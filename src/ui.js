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
  { key: 'wink',      emoji: '😉', label: 'Wink' },
];

// ── Slider controls (symmetric pairs share one slider) ────────────────────────
const CONTROLS = [
  { label: 'Smile',         keys: ['mouthSmileLeft',    'mouthSmileRight'], max: 0.75 },
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

// Эмоции с открытым ртом — зубы видны; остальные — скрываем
const TEETH_VISIBLE_EMOTIONS = new Set(['neutral', 'happy', 'wink', 'surprised', 'fear']);

// ── State ─────────────────────────────────────────────────────────────────────
let _meshes       = [];
let _teethMeshes  = [];
let _scene        = null;
let _floor        = null;
let _ambientLight = null;
let _dirLight     = null;
const sliderMap   = new Map(); // label → <input>

// ── Public API ────────────────────────────────────────────────────────────────
export function initUI(meshes, teethMeshes, scene, floor, ambientLight, dirLight) {
  _meshes       = meshes;
  _teethMeshes  = teethMeshes;
  _scene        = scene;
  _floor        = floor;
  _ambientLight = ambientLight;
  _dirLight     = dirLight;

  buildEmotionButtons();
  buildSliders();
  buildBackgrounds();
  buildLightings();

  const panel = document.getElementById('controls-panel');
  panel.style.display = 'flex';

  const isMobile = () => window.innerWidth <= 600;

  // On mobile start collapsed so avatar is fully visible
  if (isMobile()) {
    panel.classList.add('collapsed');
  } else {
    // Desktop: panel opens immediately — shrink the renderer
    dispatchPanelResize(false);
  }

  document.getElementById('panel-toggle').addEventListener('click', () => {
    panel.classList.toggle('collapsed');
    dispatchPanelResize(panel.classList.contains('collapsed'));
  });
}

// ── Panel resize event ────────────────────────────────────────────────────────
function dispatchPanelResize(collapsed) {
  const isMobile = window.innerWidth <= 600;
  window.dispatchEvent(new CustomEvent('panel-resize', {
    detail: { width: (!collapsed && !isMobile) ? 280 : 0 },
  }));
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
      const showTeeth = TEETH_VISIBLE_EMOTIONS.has(key);
      _teethMeshes.forEach((m) => { m.visible = showTeeth; });
      syncSliders();
    });
    container.appendChild(btn);
  });
  // Mark neutral as default active
  container.querySelector('[data-emotion="neutral"]')?.classList.add('active');
}

function buildSliders() {
  const container = document.getElementById('morph-sliders');
  CONTROLS.forEach(({ label, keys, max }) => {
    const row = document.createElement('div');
    row.className = 'slider-row';

    const lbl = document.createElement('div');
    lbl.className = 'slider-label';
    lbl.textContent = label;

    const input = document.createElement('input');
    input.type = 'range';
    input.min = 0;
    input.max = max ?? 1;
    input.step = 0.01;
    input.value = 0;
    input.addEventListener('input', () => {
      const val = parseFloat(input.value);
      keys.forEach((k) => setMorph(_meshes, k, val));
      // Smile слайдер: чуть приоткрываем верхнюю губу чтобы зубы
      // были видны, но нижняя губа не теряла контур
      if (label === 'Smile') {
        const sliderMax = max ?? 1;
        const t = val / sliderMax;
        setMorph(_meshes, 'jawOpen',          t * 0.05);
        setMorph(_meshes, 'mouthUpperUpLeft',  t * 0.18);
        setMorph(_meshes, 'mouthUpperUpRight', t * 0.18);
      }
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
