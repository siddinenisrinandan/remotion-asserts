import React from 'react';

// -----------------------------------------------------------
// Background clock: when several glass scenes are placed one after
// another in a project, each scene would normally start its background
// video from 0, so the background "jumps" at every cut. A project can
// wrap a scene in <BgOffset.Provider value={startFrame}> so the scene's
// background video (and the refraction copy inside the glass) continues
// from where the previous scene left off.
// -----------------------------------------------------------

export const BgOffset = React.createContext(0);

/** Frames to skip at the start of the background video. */
export const useBgTrim = () => React.useContext(BgOffset);
