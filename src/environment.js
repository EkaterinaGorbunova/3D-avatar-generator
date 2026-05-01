import * as THREE from 'three';

// ── Background presets ────────────────────────────────────────────────────────
export const BACKGROUNDS = {
  studio: {
    label: '🎬 Studio',
    color: 0x1a1a2e,
    floor: 0x2a2a4a,
    fog:   null,
  },
  night: {
    label: '🌃 Night',
    color: 0x060612,
    floor: 0x0d0d1f,
    fog:   { color: 0x080818, near: 5, far: 18 },
  },
  warm: {
    label: '🌅 Warm',
    color: 0x1a0905,
    floor: 0x1c0d06,
    fog:   { color: 0x1a0905, near: 8, far: 22 },
  },
  cosmic: {
    label: '🌌 Cosmic',
    color: 0x0a0520,
    floor: 0x0d0618,
    fog:   { color: 0x0a0520, near: 6, far: 20 },
  },
};

// ── Lighting presets ──────────────────────────────────────────────────────────
export const LIGHTINGS = {
  default: {
    label:   '☀️ Default',
    ambient: [0xffffff, 0.6],
    dir:     [0xffffff, 1.9,  2, 2,  5],
  },
  warm: {
    label:   '🕯️ Warm',
    ambient: [0xffd580, 0.5],
    dir:     [0xff9944, 2.2,  3, 2,  4],
  },
  cold: {
    label:   '❄️ Cold',
    ambient: [0x99aaff, 0.45],
    dir:     [0x6699ff, 2.0, -2, 3,  4],
  },
  dramatic: {
    label:   '🎭 Dramatic',
    ambient: [0x111111, 0.15],
    dir:     [0xffffff, 4.0, -3, 5,  1],
  },
};

// ── Apply background ──────────────────────────────────────────────────────────
export function applyBackground(scene, floorMesh, key) {
  const p = BACKGROUNDS[key] ?? BACKGROUNDS.studio;
  scene.background = new THREE.Color(p.color);
  floorMesh.material.color.set(p.floor);
  scene.fog = p.fog
    ? new THREE.Fog(p.fog.color, p.fog.near, p.fog.far)
    : null;
}

// ── Apply lighting ────────────────────────────────────────────────────────────
export function applyLighting(ambientLight, dirLight, key) {
  const p = LIGHTINGS[key] ?? LIGHTINGS.default;
  ambientLight.color.set(p.ambient[0]);
  ambientLight.intensity = p.ambient[1];
  dirLight.color.set(p.dir[0]);
  dirLight.intensity = p.dir[1];
  dirLight.position.set(p.dir[2], p.dir[3], p.dir[4]);
}
