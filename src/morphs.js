// ── Emotion presets ───────────────────────────────────────────────────────────
// Values are morph target influences in range [0, 1].
// All unlisted targets are implicitly reset to 0 when an emotion is applied.
export const EMOTIONS = {
  neutral: {},

  // Улыбка Дюшена: уголки рта + щёки + лёгкое прищуривание глаз (AU6+AU12)
  happy: {
    mouthSmileLeft: 0.4,         mouthSmileRight: 0.4,
    mouthUpperUpLeft: 0.15,      mouthUpperUpRight: 0.15,
    jawOpen: 0.05,
    cheekSquintLeft: 0.5,        cheekSquintRight: 0.5,
    eyeSquintLeft: 0.4,          eyeSquintRight: 0.4,
  },

  // Грусть: опущенные уголки рта + поднятые внутренние брови (AU1+AU15+AU17)
  sad: {
    mouthFrownLeft: 0.6,         mouthFrownRight: 0.6,
    mouthStretchLeft: 0.1,       mouthStretchRight: 0.1,
    browInnerUp: 0.85,
    browDownLeft: 0.1,           browDownRight: 0.1,
    eyeSquintLeft: 0.25,         eyeSquintRight: 0.25,
    cheekSquintLeft: 0.15,       cheekSquintRight: 0.15,
  },

  // Злость: сведённые брови + прищур + напряжение рта (AU4+AU5+AU17+AU23)
  angry: {
    browDownLeft: 0.85,          browDownRight: 0.85,
    browInnerUp: 0.2,
    noseSneerLeft: 0.4,          noseSneerRight: 0.4,
    eyeSquintLeft: 0.6,          eyeSquintRight: 0.6,
    cheekSquintLeft: 0.25,       cheekSquintRight: 0.25,
    mouthFrownLeft: 0.25,        mouthFrownRight: 0.25,
    mouthPressLipLowerLeft: 0.2, mouthPressLipLowerRight: 0.2,
  },

  // Удивление: широко открытый рот + широко открытые глаза + поднятые брови (AU1+AU2+AU5+AU26)
  surprised: {
    jawOpen: 0.62,
    mouthFunnel: 0.15,
    mouthStretchLeft: 0.1,       mouthStretchRight: 0.1,
    eyeWideLeft: 0.9,            eyeWideRight: 0.9,
    browOuterUpLeft: 0.9,        browOuterUpRight: 0.9,
    browInnerUp: 0.7,
  },

  // Отвращение: морщины носа + поднятая верхняя губа + нахмуренный взгляд (AU9+AU15+AU16)
  disgusted: {
    noseSneerLeft: 0.8,          noseSneerRight: 0.8,
    mouthShrugUpper: 0.4,
    mouthFrownLeft: 0.3,         mouthFrownRight: 0.3,
    mouthLowerDownLeft: 0.2,     mouthLowerDownRight: 0.2,
    browDownLeft: 0.35,          browDownRight: 0.35,
    eyeSquintLeft: 0.3,          eyeSquintRight: 0.3,
    cheekSquintLeft: 0.2,        cheekSquintRight: 0.2,
  },

  // Страх: широко открытые глаза + поднятые брови + уголки рта назад (AU1+AU2+AU4+AU20+AU26)
  fear: {
    eyeWideLeft: 0.9,            eyeWideRight: 0.9,
    browInnerUp: 0.9,
    browOuterUpLeft: 0.55,       browOuterUpRight: 0.55,
    browDownLeft: 0.15,          browDownRight: 0.15,
    mouthStretchLeft: 0.55,      mouthStretchRight: 0.55,
    mouthFrownLeft: 0.2,         mouthFrownRight: 0.2,
    jawOpen: 0.28,
  },

  // Подмигивание: закрытый правый глаз + лёгкая улыбка
  wink: {
    eyeBlinkRight: 1.0,
    cheekSquintRight: 0.5,
    mouthSmileLeft: 0.5,         mouthSmileRight: 0.45,
    mouthDimpleLeft: 0.2,        mouthDimpleRight: 0.15,
    cheekSquintLeft: 0.3,
    eyeSquintLeft: 0.2,
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
