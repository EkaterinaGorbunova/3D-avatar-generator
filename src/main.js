import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { initAnimation, updateAnimation } from "./animation.js";

// ── Scene ────────────────────────────────────────────────────────────────────
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a2e);

// ── Lighting ─────────────────────────────────────────────────────────────────
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 1.9);
dirLight.position.set(2, 2, 5);
dirLight.castShadow = true;
scene.add(dirLight);

// ── Camera ───────────────────────────────────────────────────────────────────
const camera = new THREE.PerspectiveCamera(
  50,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 1.4, 3.5);
scene.add(camera);

// ── Renderer ─────────────────────────────────────────────────────────────────
const canvas = document.querySelector(".webgl");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;

// ── Controls ─────────────────────────────────────────────────────────────────
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.target.set(0, 1.4, 0);

// ── Floor plane ──────────────────────────────────────────────────────────────
export const plane = new THREE.Mesh(
  new THREE.PlaneGeometry(50, 50),
  new THREE.MeshStandardMaterial({ color: 0x2a2a4a })
);
plane.rotation.x = -Math.PI / 2;
plane.receiveShadow = true;
scene.add(plane);

// ── GLB model loader ─────────────────────────────────────────────────────────
const MODEL_PARTS = [
  "SK_Kate_Face_Bare",
  "SK_Kate_Body_Bare",
  "SK_Kate_Torso_Bare",
  "SK_Kate_Legs_Bare",
  "SK_Kate_Feet_Bare",
  "SK_Kate_Glasses",
];

const loader = new GLTFLoader();
const faceMeshes  = []; // все меши с морф-таргетами
const teethMeshes = []; // только меши зубов

function loadModel(name) {
  return new Promise((resolve, reject) => {
    loader.load(
      `/assets/${name}.glb`,
      (glb) => {
        glb.scene.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;

            const n = child.name.toLowerCase();

            const isTeeth = n.includes("teeth") || n.includes("tooth");
            const mats = Array.isArray(child.material)
              ? child.material
              : [child.material];
            mats.forEach((m) => {
              m.depthWrite = true;
              m.depthTest = true;
            });

            if (isTeeth) teethMeshes.push(child);
            if (child.morphTargetDictionary) faceMeshes.push(child);
          }
        });
        scene.add(glb.scene);
        resolve(name);
      },
      undefined,
      (err) => reject(err)
    );
  });
}

Promise.all(MODEL_PARTS.map(loadModel))
  .then(() => {
    console.log("All models loaded. Face meshes with morphs:", faceMeshes.length);
    initAnimation(scene);
    if (faceMeshes.length > 0) {
      import("./ui.js").then(({ initUI }) =>
        initUI(faceMeshes, teethMeshes, scene, plane, ambientLight, dirLight)
      );
    }
  })
  .catch((err) => console.error("Model load error:", err));

// ── Resize handler ───────────────────────────────────────────────────────────
let panelWidth = 0; // updated by panel-resize event from ui.js
let resizeRaf  = null;

function resizeToFit() {
  const isMobile = window.innerWidth <= 600;
  const w = window.innerWidth - (isMobile ? 0 : panelWidth);
  const h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}

function scheduleResize() {
  if (resizeRaf) cancelAnimationFrame(resizeRaf);
  resizeRaf = requestAnimationFrame(() => { resizeRaf = null; resizeToFit(); });
}

window.addEventListener("resize", scheduleResize);

window.addEventListener("panel-resize", (e) => {
  panelWidth = e.detail?.width ?? 0;
  resizeToFit(); // panel toggle is user-initiated — apply immediately
});

// ── Clock for delta time ──────────────────────────────────────────────────────
const clock = new THREE.Clock();
let prevTime = 0;

// ── Render loop ──────────────────────────────────────────────────────────────
function animate() {
  requestAnimationFrame(animate);
  const elapsed = clock.getElapsedTime();
  const delta   = elapsed - prevTime;
  prevTime = elapsed;
  updateAnimation(elapsed, delta, faceMeshes);
  controls.update();
  renderer.render(scene, camera);
}
animate();
