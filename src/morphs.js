// ── Emotion presets ───────────────────────────────────────────────────────────
// Values are morph target influences in range [0, 1].
// All unlisted targets are implicitly reset to 0 when an emotion is applied.
export const EMOTIONS = {
  neutral: {},

  happy: {
    mouthSmileLeft: 0.9, mouthSmileRight: 0.9,
    cheekSquintLeft: 0.5, cheekSquintRight: 0.5,
    eyeSquintLeft: 0.35, eyeSquintRight: 0.35,
  },

  sad: {
    mouthFrownLeft: 0.85, mouthFrownRight: 0.85,
    browInnerUp: 0.9,
    browDownLeft: 0.15,  browDownRight: 0.15,
    eyeSquintLeft: 0.2,  eyeSquintRight: 0.2,
  },

  angry: {
    browDownLeft: 0.9,   browDownRight: 0.9,
    noseSneerLeft: 0.5,  noseSneerRight: 0.5,
    eyeSquintLeft: 0.5,  eyeSquintRight: 0.5,
    mouthFrownLeft: 0.3, mouthFrownRight: 0.3,
  },

  surprised: {
    jawOpen: 0.5,        mouthFunnel: 0.3,
    eyeWideLeft: 0.9,    eyeWideRight: 0.9,
    browOuterUpLeft: 0.9, browOuterUpRight: 0.9,
    browInnerUp: 0.6,
  },

  disgusted: {
    noseSneerLeft: 0.9,  noseSneerRight: 0.9,
    mouthShrugUpper: 0.5,
    mouthFrownLeft: 0.4, mouthFrownRight: 0.4,
    browDownLeft: 0.4,   browDownRight: 0.4,
  },

  fear: {
    eyeWideLeft: 0.9,    eyeWideRight: 0.9,
    browInnerUp: 0.9,
    browOuterUpLeft: 0.5, browOuterUpRight: 0.5,
    mouthStretchLeft: 0.4, mouthStretchRight: 0.4,
    jawOpen: 0.2,
  },

  wink: {
    eyeBlinkRight: 1.0,
    mouthSmileLeft: 0.5, mouthSmileRight: 0.5,
    cheekSquintLeft: 0.3, cheekSquintRight: 0.3,
  },
};

// ── Utilities ─────────────────────────────────────────────────────────────────

/** Set a single morph target by name on all provided meshes. */
export function setMorph(meshes, name, value) {
  meshes.forEach((mesh) => {
    const idx = mesh.morphTargetDictionary?.[name];
    if (idx !== undefined) {
      mesh.morphTargetInfluences[idx] = Math.max(0, Math.min(1, value));
    }
  });
}

/** Reset all morphs to 0 and apply a named emotion preset. */
export function applyEmotion(meshes, name) {
  meshes.forEach((mesh) => {
    if (mesh.morphTargetInfluences) mesh.morphTargetInfluences.fill(0);
  });
  const preset = EMOTIONS[name] ?? {};
  Object.entries(preset).forEach(([morphName, val]) => {
    setMorph(meshes, morphName, val);
  });
}
