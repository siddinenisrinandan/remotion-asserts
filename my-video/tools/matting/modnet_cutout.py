"""
Cut the person out of a video with MODNet (Apache-2.0, ~25 MB ONNX model).
Free for commercial use, incl. inside a closed-source app. Licence text:
tools/matting/models/MODNET_LICENSE.txt  (keep it with the model when shipping).
CPU only - no graphics card needed.

Output: a transparent WebM (VP9 + alpha) that Remotion plays as the top layer
of the TextBehindSubject effect.

Usage (from the my-video folder, with the project venv):
    .venv\\Scripts\\python tools/matting/modnet_cutout.py public/clip.mp4
    .venv\\Scripts\\python tools/matting/modnet_cutout.py public/clip.mp4 --seconds 3   # quick test

Clean-up steps on top of MODNet:
  * stray-blob removal  - drops bits of wall/floor wrongly marked as "person"
  * median of N frames  - each mask is the median of itself and its neighbours,
                          which removes 1-frame flicker and ghost patches (~40% less flicker)
  * zoom pass           - when the person is small in frame, a second close-up pass
                          recovers missed parts (e.g. a runner's head against the sky)

Needs: onnxruntime, numpy, pillow, scipy, av   (no PyTorch; all permissive licences)
    pip install onnxruntime numpy pillow scipy av
The model downloads once into tools/matting/models/ if it is missing.

Model: MODNet photographic portrait matting (github.com/ZHKKKe/MODNet),
ONNX conversion from huggingface.co/Xenova/modnet (Apache-2.0).
"""

import argparse
import sys
import time
import urllib.request
from collections import deque
from fractions import Fraction
from pathlib import Path

import av
import numpy as np
import onnxruntime as ort
from PIL import Image
from scipy import ndimage

HERE = Path(__file__).resolve().parent
MODEL = HERE / "models" / "modnet.onnx"
MODEL_URL = "https://huggingface.co/Xenova/modnet/resolve/main/onnx/model.onnx"
REF_SIZE = 512  # MODNet's native working size (tested: higher sizes pick up more background)


def ensure_model():
    if MODEL.exists():
        return
    MODEL.parent.mkdir(parents=True, exist_ok=True)
    print(f"Downloading MODNet model (~25 MB) -> {MODEL}")
    urllib.request.urlretrieve(MODEL_URL, MODEL)


def infer_size(w: int, h: int, ref: int = REF_SIZE):
    """Scale so the short side is ~ref px, both sides a multiple of 32."""
    scale = ref / min(w, h)
    return max(32, round(w * scale / 32) * 32), max(32, round(h * scale / 32) * 32)


def remove_blobs(matte: np.ndarray, keep_ratio: float) -> np.ndarray:
    """MODNet sometimes marks bits of wall/floor as 'person'. Keep the biggest
    shape (and any other shape at least keep_ratio of its size, e.g. a 2nd
    person), drop the small stray blobs. Soft edges of kept shapes are preserved."""
    solid = matte > 0.3
    labels, count = ndimage.label(solid)
    if count <= 1:
        return matte
    sizes = ndimage.sum(solid, labels, index=range(1, count + 1))
    keep_ids = [i + 1 for i, s in enumerate(sizes) if s >= sizes.max() * keep_ratio]
    keep = np.isin(labels, keep_ids)
    keep = ndimage.binary_dilation(keep, iterations=4)  # keep the soft hair edge around them
    return matte * keep


def run_modnet(session, in_name, rgb: np.ndarray, size) -> np.ndarray:
    """MODNet on one RGB image resized to `size` (w, h); returns mask (h, w) 0..1."""
    small = np.asarray(Image.fromarray(rgb).resize(size, Image.BILINEAR), dtype=np.float32)
    x = ((small / 255.0 - 0.5) / 0.5).transpose(2, 0, 1)[None]  # RGB in [-1, 1], NCHW
    return session.run(None, {in_name: x})[0][0, 0]


def zoom_pass(session, in_name, rgb, matte, keep_ratio, max_height=0.6):
    """When the person is small in the frame, MODNet can miss details (e.g. a head
    against bright sky). Crop around them, run MODNet again on the close-up, and
    merge: anything either pass sees as 'person' is kept. Returns the merged mask."""
    ih, iw = matte.shape
    ys, xs = np.where(matte > 0.5)
    if len(xs) == 0 or (ys.max() - ys.min()) > ih * max_height:
        return matte  # nobody found, or already big in frame
    h, w = rgb.shape[:2]
    sx, sy = w / iw, h / ih
    x0, x1, y0, y1 = xs.min() * sx, xs.max() * sx, ys.min() * sy, ys.max() * sy
    bw, bh = x1 - x0, y1 - y0
    px, py = bw * 0.6 + 40, bh * 0.6 + 40  # generous: the first pass may have missed the head
    X0, X1 = int(max(0, x0 - px)), int(min(w, x1 + px))
    Y0, Y1 = int(max(0, y0 - py)), int(min(h, y1 + py))
    crop = rgb[Y0:Y1, X0:X1]
    zm = run_modnet(session, in_name, crop, infer_size(X1 - X0, Y1 - Y0))
    if keep_ratio > 0:
        zm = remove_blobs(zm, keep_ratio)
    # put the close-up mask back into the small (model-size) mask space
    sx0, sx1 = int(round(X0 / sx)), max(int(round(X1 / sx)), int(round(X0 / sx)) + 1)
    sy0, sy1 = int(round(Y0 / sy)), max(int(round(Y1 / sy)), int(round(Y0 / sy)) + 1)
    zm = np.asarray(Image.fromarray(zm.astype(np.float32)).resize((sx1 - sx0, sy1 - sy0), Image.BILINEAR))
    merged = matte.copy()
    merged[sy0:sy1, sx0:sx1] = np.maximum(merged[sy0:sy1, sx0:sx1], np.clip(zm, 0, 1))
    return merged


def frame_rotation(frame) -> int:
    try:
        return int(getattr(frame, "rotation", 0) or 0)
    except Exception:
        return 0


def main():
    ap = argparse.ArgumentParser(description="Video -> transparent person cut-out (WebM) with MODNet.")
    ap.add_argument("input", type=Path)
    ap.add_argument("-o", "--output", type=Path, help="default: <input>_person.webm")
    ap.add_argument("--seconds", type=float, help="only process the first N seconds (for testing)")
    ap.add_argument("--window", type=int, default=3, choices=[1, 3, 5],
                    help="median over this many frames: 1 = off, 3 = default, 5 = calmer but can lag on fast moves")
    ap.add_argument("--keep", type=float, default=0.35,
                    help="drop stray blobs smaller than this fraction of the main person (0 = off, default 0.35)")
    ap.add_argument("--no-zoom", action="store_true",
                    help="skip the close-up second pass for small/far-away people (faster)")
    ap.add_argument("--crf", type=int, default=20, help="WebM quality, lower = better/bigger (default 20)")
    args = ap.parse_args()

    if not args.input.exists():
        sys.exit(f"Input not found: {args.input}")
    out_path = args.output or args.input.with_name(args.input.stem + "_person.webm")
    tmp_path = out_path.with_name(out_path.name + ".partial")
    half = args.window // 2

    ensure_model()
    session = ort.InferenceSession(str(MODEL), providers=["CPUExecutionProvider"])
    in_name = session.get_inputs()[0].name

    src = av.open(str(args.input))
    vin = src.streams.video[0]
    vin.thread_type = "AUTO"
    fps = vin.average_rate or vin.guessed_rate or Fraction(30)
    max_frames = int(args.seconds * fps) if args.seconds else None

    dst = vout = None
    # Masks are small (model size); keep a short window of (rgb, mask) for the median.
    frames: deque = deque()
    masks: deque = deque(maxlen=args.window)
    written = 0
    n, t0 = 0, time.time()

    def write(rgb: np.ndarray, small_alpha: np.ndarray):
        nonlocal written
        h, w = rgb.shape[:2]
        alpha = np.asarray(Image.fromarray(small_alpha.astype(np.float32)).resize((w, h), Image.BILINEAR))
        alpha = np.clip(alpha, 0.0, 1.0)
        rgba = np.dstack([rgb, (alpha * 255).astype(np.uint8)])
        rgba = np.ascontiguousarray(rgba[: vout.height, : vout.width])
        out_frame = av.VideoFrame.from_ndarray(rgba, format="rgba").reformat(format="yuva420p")
        out_frame.pts = written
        out_frame.time_base = Fraction(1) / fps
        for packet in vout.encode(out_frame):
            dst.mux(packet)
        written += 1

    def median_for(center: int) -> np.ndarray:
        # masks holds the last `window` masks; pick those within +-half of center
        stack = list(masks)
        return np.median(np.stack(stack), axis=0) if len(stack) > 1 else stack[0]

    try:
        for frame in src.decode(vin):
            rgb = frame.to_ndarray(format="rgb24")
            rot = frame_rotation(frame)
            if rot % 360:
                rgb = np.ascontiguousarray(np.rot90(rgb, k=(rot // 90) % 4))
            h, w = rgb.shape[:2]

            if dst is None:
                iw, ih = infer_size(w, h)
                print(f"{args.input.name}: {w}x{h} @ {float(fps):.2f} fps | model input {iw}x{ih} "
                      f"| median window={args.window}")
                # Write to a temp file first so Studio never sees a half-written video.
                dst = av.open(str(tmp_path), mode="w", format="webm")
                vout = dst.add_stream("libvpx-vp9", rate=fps)
                vout.width, vout.height = w - (w % 2), h - (h % 2)
                vout.pix_fmt = "yuva420p"
                vout.options = {"crf": str(args.crf), "b": "0", "auto-alt-ref": "0",
                                "row-mt": "1", "deadline": "good"}

            matte = run_modnet(session, in_name, rgb, (iw, ih))  # (ih, iw), 0..1
            if args.keep > 0:
                matte = remove_blobs(matte, args.keep)
            if not args.no_zoom:
                matte = zoom_pass(session, in_name, rgb, matte, args.keep)

            frames.append(rgb)
            masks.append(matte)
            if len(frames) == 1 and half == 0:
                write(frames.popleft(), matte)
            elif len(frames) > half:
                # the frame in the middle of the window now has its neighbours on both sides
                # (for the very first frames the window is just shorter)
                write(frames.popleft(), median_for(0))

            n += 1
            if n % 30 == 0:
                print(f"  {n} frames  ({n / (time.time() - t0):.1f} fps)", flush=True)
            if max_frames and n >= max_frames:
                break

        # flush the last frames, letting the window shrink at the end
        while frames:
            if len(masks) > 1:
                masks.popleft()
            write(frames.popleft(), median_for(0))
    finally:
        if dst is not None:
            for packet in vout.encode():
                dst.mux(packet)
            dst.close()
        src.close()

    if written == 0:
        tmp_path.unlink(missing_ok=True)
        sys.exit("No frames were decoded - is the input a valid video?")
    tmp_path.replace(out_path)  # swap in the finished file in one step
    print(f"Done: {written} frames in {time.time() - t0:.0f}s -> {out_path}")


if __name__ == "__main__":
    main()
