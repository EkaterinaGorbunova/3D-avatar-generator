import { setMorph } from './morphs.js';

// ── Bone refs (arrays — one entry per GLB skeleton copy) ─────────────────────
const headBones  = [];
const spineBones = [];

// ── Blink state ───────────────────────────────────────────────────────────────
let blinkProgress = 0;
let blinkPhase    = 'wait'; // 'wait' | 'closing' | 'opening'
let blinkTimer    = 0;
let nextBlinkAt   = randomBlinkInterval();

function randomBlinkInterval() {
  return 2.5 + Math.random() * 3.5; // blink every 2.5–6 s
}

// ── Public API ────────────────────────────────────────────────────────────────

export function initAnimation(scene) {
  // Each GLB part carries its own copy of the full skeleton.
  // We collect every instance so all parts animate in sync.
  scene.traverse((obj) => {
    if (!obj.isBone) return;
    if (obj.name === 'Head')   headBones.push(obj);
    if (obj.name === 'Spine2') spineBones.push(obj);
  });
  console.log(`[animation] Head bones: ${headBones.length}, Spine2 bones: ${spineBones.length}`);
}

export function updateAnimation(elapsed, delta, faceMeshes) {
  updateIdle(elapsed);
  updateBreathing(elapsed);
  updateBlink(delta, faceMeshes);
}

// ── Idle head sway ────────────────────────────────────────────────────────────
function updateIdle(t) {
  const ry = Math.sin(t * 0.6)  * 0.12; // left-right ~7°
  const rx = Math.sin(t * 0.4)  * 0.07; // up-down nod ~4°
  const rz = Math.sin(t * 0.5)  * 0.04; // tilt ~2°
  headBones.forEach((bone) => {
    bone.rotation.y = ry;
    bone.rotation.x = rx;
    bone.rotation.z = rz;
  });
}

// ── Breathing ─────────────────────────────────────────────────────────────────
function updateBreathing(t) {
  const rx = Math.sin(t * 0.7) * 0.05; // chest rise ~3°
  spineBones.forEach((bone) => { bone.rotation.x = rx; });
}

// ── Blink loop ────────────────────────────────────────────────────────────────
const BLINK_CLOSE_SPEED = 10; // influence units/s
const BLINK_OPEN_SPEED  = 5;

function updateBlink(delta, faceMeshes) {
  if (!faceMeshes?.length) return;

  if (blinkPhase === 'wait') {
    blinkTimer += delta;
    if (blinkTimer >= nextBlinkAt) {
      blinkPhase  = 'closing';
      blinkTimer  = 0;
      nextBlinkAt = randomBlinkInterval();
    }
    return;
  }

  if (blinkPhase === 'closing') {
    blinkProgress = Math.min(1, blinkProgress + delta * BLINK_CLOSE_SPEED);
    if (blinkProgress >= 1) blinkPhase = 'opening';
  } else {
    blinkProgress = Math.max(0, blinkProgress - delta * BLINK_OPEN_SPEED);
    if (blinkProgress <= 0) blinkPhase = 'wait';
  }

  setMorph(faceMeshes, 'eyeBlinkLeft',  blinkProgress);
  setMorph(faceMeshes, 'eyeBlinkRight', blinkProgress);
}
