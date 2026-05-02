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

// Fill light from the left to eliminate harsh shadow on avatar's left side
const fillLight = new THREE.DirectionalLight(0xffffff, 0.8);
fillLight.position.set(-3, 1, 2);
scene.add(fillLight);

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
controls.minDistance = 0.5; // не позволяет провалиться внутрь аватара
controls.maxDistance = 8;   // разумный лимит отдаления

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

// LoadingManager drives the spinner overlay; onProgress fires after each part finishes
const loadingManager = new THREE.LoadingManager();
const progressEl = document.getElementById("loading-progress");
loadingManager.onProgress = (_url, loaded, total) => {
  if (progressEl) progressEl.textContent = Math.round((loaded / total) * 100) + "%";
};

const loader = new GLTFLoader(loadingManager);
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
        // Don't add to scene yet — defer until all parts are ready so the user
        // never sees the avatar pop in piece by piece
        resolve(glb.scene);
      },
      undefined,
      (err) => reject(err)
    );
  });
}

function hideLoadingOverlay() {
  const overlay = document.getElementById("loading-overlay");
  if (!overlay) return;
  overlay.classList.add("hidden");
  setTimeout(() => overlay.remove(), 500);
}

Promise.all(MODEL_PARTS.map(loadModel))
  .then((parts) => {
    // Add all parts at once — single visual reveal
    parts.forEach((p) => scene.add(p));

    // Pre-compile shaders so the first visible frame doesn't stutter
    renderer.compile(scene, camera);
    // Render one full frame before fading out the overlay so the user sees
    // the finished avatar, not an empty scene
    renderer.render(scene, camera);

    initAnimation(scene);
    if (faceMeshes.length > 0) {
      import("./ui.js").then(({ initUI }) =>
        initUI(faceMeshes, teethMeshes, scene, plane, ambientLight, dirLight, fillLight,
               (paused) => { _renderPaused = paused; })
      );
    }

    hideLoadingOverlay();
  })
  .catch((err) => {
    console.error("Model load error:", err);
    if (progressEl) progressEl.textContent = "failed";
  });

// ── Resize handler ───────────────────────────────────────────────────────────
let panelWidth    = 0;     // desktop side panel width
let mobilePanelOpen = false; // mobile bottom panel state
let resizeRaf     = null;

function resizeToFit() {
  const isMobile   = window.innerWidth <= 600;
  const panelH     = (mobilePanelOpen && isMobile) ? Math.round(window.innerHeight * 0.44) : 0;
  const w = window.innerWidth - (isMobile ? 0 : panelWidth);
  const h = window.innerHeight - panelH;
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
  panelWidth      = e.detail?.width    ?? 0;
  mobilePanelOpen = e.detail?.mobileOpen ?? false;
  resizeToFit(); // panel toggle is user-initiated — apply immediately
});

// ── Clock for delta time ──────────────────────────────────────────────────────
const clock = new THREE.Clock();
let prevTime = 0;
let _renderPaused = false;

// ── Render loop ──────────────────────────────────────────────────────────────
function animate() {
  requestAnimationFrame(animate);
  if (_renderPaused) return; // hold last frame while exporting
  const elapsed = clock.getElapsedTime();
  const delta   = elapsed - prevTime;
  prevTime = elapsed;
  updateAnimation(elapsed, delta, faceMeshes);
  controls.update();
  renderer.render(scene, camera);
}
animate();
