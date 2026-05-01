import { EMOTIONS, setMorph, applyEmotion } from './morphs.js';
import { BACKGROUNDS, LIGHTINGS, applyBackground, applyLighting } from './environment.js';

// ── Emotion button metadata ───────────────────────────────────────────────────
const EMOTION_META = [
  { key: 'neutral',   emoji: '😐', label: 'Neutral' },
  { key: 'happy',     emoji: '😊', label: 'Happy' },
  { key: 'sad',       emoji: '😢', label: 'Sad' },
  { key: 'angry',     emoji: '😠', label: 'Angry' },
  { key: 'surprised', emoji: '😲', label: 'Surprised' },
  { key: 'disgusted', emoji: '🤢', label: 'Disgusted' },
  { key: 'fear',      emoji: '😨', label: 'Fear' },
];

// ── Slider controls (symmetric pairs share one slider) ────────────────────────
const CONTROLS = [
  { label: 'Smile',         keys: ['mouthSmileLeft',    'mouthSmileRight'] },
  { label: 'Frown',         keys: ['mouthFrownLeft',    'mouthFrownRight'] },
  { label: 'Jaw Open',      keys: ['jawOpen'] },
  { label: 'Brow Down',     keys: ['browDownLeft',      'browDownRight'] },
  { label: 'Brow Inner Up', keys: ['browInnerUp'] },
  { label: 'Brow Outer Up', keys: ['browOuterUpLeft',   'browOuterUpRight'] },
  { label: 'Eye Wide',      keys: ['eyeWideLeft',       'eyeWideRight'] },
  { label: 'Eye Blink',     keys: ['eyeBlinkLeft',      'eyeBlinkRight'] },
  { label: 'Eye Squint',    keys: ['eyeSquintLeft',     'eyeSquintRight'] },
  { label: 'Cheek Puff',    keys: ['cheekPuff'] },
  { label: 'Nose Sneer',    keys: ['noseSneerLeft',     'noseSneerRight'] },
  { label: 'Mouth Pucker',  keys: ['mouthPucker'] },
];

// ── State ─────────────────────────────────────────────────────────────────────
let _meshes       = [];
let _scene        = null;
let _floor        = null;
let _ambientLight = null;
let _dirLight     = null;
const sliderMap   = new Map(); // label → <input>

// ── Public API ────────────────────────────────────────────────────────────────
export function initUI(meshes, scene, floor, ambientLight, dirLight) {
  _meshes       = meshes;
  _scene        = scene;
  _floor        = floor;
  _ambientLight = ambientLight;
  _dirLight     = dirLight;

  buildEmotionButtons();
  buildSliders();
  buildBackgrounds();
  buildLightings();
  document.getElementById('controls-panel').style.display = 'flex';

  // Toggle panel open/close
  document.getElementById('panel-toggle').addEventListener('click', () => {
    const panel = document.getElementById('controls-panel');
    panel.classList.toggle('collapsed');
  });
}

// ── Builders ──────────────────────────────────────────────────────────────────
function buildEmotionButtons() {
  const container = document.getElementById('emotion-buttons');
  EMOTION_META.forEach(({ key, emoji, label }) => {
    const btn = document.createElement('button');
    btn.className = 'emotion-btn';
    btn.innerHTML = `<span class="em-emoji">${emoji}</span><span class="em-label">${label}</span>`;
    btn.dataset.emotion = key;
    btn.addEventListener('click', () => {
      document.querySelectorAll('.emotion-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      applyEmotion(_meshes, key);
      syncSliders();
    });
    container.appendChild(btn);
  });
  // Mark neutral as default active
  container.querySelector('[data-emotion="neutral"]')?.classList.add('active');
}

function buildSliders() {
  const container = document.getElementById('morph-sliders');
  CONTROLS.forEach(({ label, keys }) => {
    const row = document.createElement('div');
    row.className = 'slider-row';

    const lbl = document.createElement('div');
    lbl.className = 'slider-label';
    lbl.textContent = label;

    const input = document.createElement('input');
    input.type = 'range';
    input.min = 0;
    input.max = 1;
    input.step = 0.01;
    input.value = 0;
    input.addEventListener('input', () => {
      const val = parseFloat(input.value);
      keys.forEach((k) => setMorph(_meshes, k, val));
    });

    sliderMap.set(label, input);
    row.appendChild(lbl);
    row.appendChild(input);
    container.appendChild(row);
  });
}

// ── Sync sliders → current morph values ───────────────────────────────────────
function syncSliders() {
  CONTROLS.forEach(({ label, keys }) => {
    const input = sliderMap.get(label);
    if (!input) return;
    const mesh = _meshes.find((m) => m.morphTargetDictionary?.[keys[0]] !== undefined);
    if (mesh) {
      const idx = mesh.morphTargetDictionary[keys[0]];
      input.value = mesh.morphTargetInfluences[idx];
    }
  });
}

// ── Background buttons ────────────────────────────────────────────────────────
function buildBackgrounds() {
  const container = document.getElementById('bg-buttons');
  Object.entries(BACKGROUNDS).forEach(([key, preset]) => {
    const btn = document.createElement('button');
    btn.className = 'env-btn';
    btn.textContent = preset.label;
    btn.dataset.key = key;
    btn.addEventListener('click', () => {
      container.querySelectorAll('.env-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      applyBackground(_scene, _floor, key);
    });
    container.appendChild(btn);
  });
  container.querySelector('[data-key="studio"]')?.classList.add('active');
}

// ── Lighting buttons ──────────────────────────────────────────────────────────
function buildLightings() {
  const container = document.getElementById('lighting-buttons');
  Object.entries(LIGHTINGS).forEach(([key, preset]) => {
    const btn = document.createElement('button');
    btn.className = 'env-btn';
    btn.textContent = preset.label;
    btn.dataset.key = key;
    btn.addEventListener('click', () => {
      container.querySelectorAll('.env-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      applyLighting(_ambientLight, _dirLight, key);
    });
    container.appendChild(btn);
  });
  container.querySelector('[data-key="default"]')?.classList.add('active');
}
