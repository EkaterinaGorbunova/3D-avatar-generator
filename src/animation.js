import { setMorph } from './morphs.js';

// ── Bone refs ─────────────────────────────────────────────────────────────────
let headBone  = null;
let spineBone = null;

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
  let spine = null, spine1 = null, spine2 = null;

  scene.traverse((obj) => {
    if (!obj.isBone) return;
    const n = obj.name;
    if (n === 'Head')   headBone = obj;
    if (n === 'Spine')  spine    = obj;
    if (n === 'Spine1') spine1   = obj;
    if (n === 'Spine2') spine2   = obj;
  });

  spineBone = spine2 ?? spine1 ?? spine;
}

export function updateAnimation(elapsed, delta, faceMeshes) {
  updateIdle(elapsed);
  updateBreathing(elapsed);
  updateBlink(delta, faceMeshes);
}

// ── Idle head sway ────────────────────────────────────────────────────────────
function updateIdle(t) {
  if (!headBone) return;
  headBone.rotation.y = Math.sin(t * 0.4)  * 0.04;  // gentle left-right
  headBone.rotation.x = Math.sin(t * 0.25) * 0.02;  // slight up-down nod
  headBone.rotation.z = Math.sin(t * 0.3)  * 0.01;  // tiny tilt
}

// ── Breathing ─────────────────────────────────────────────────────────────────
function updateBreathing(t) {
  if (!spineBone) return;
  spineBone.rotation.x = Math.sin(t * 0.5) * 0.015; // chest rise at ~0.5 Hz
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
