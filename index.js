import * as THREE from "https://cdn.skypack.dev/three@0.132.2/build/three.module.js";
import { GLTFLoader } from "https://cdn.skypack.dev/three@0.132.2/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "https://cdn.skypack.dev/three@0.132.2/examples/jsm/controls/OrbitControls.js";

const canvas = document.querySelector(".webgl");

const scene = new THREE.Scene();

const loader = new GLTFLoader();
loader.load(
  "assets/SK_Kate_Face_Bare.glb",

  function (glb) {
    console.log(glb);
    const root = glb.scene;
    root.scale.set(1, 1, 1);
    scene.add(root);
  },

  function (xhr) {
    console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
  },
  function (error) {
    console.log("An error occurred");
  }
);

loader.load(
  "assets/SK_Kate_Body_Bare.glb",

  function (glb) {
    console.log(glb);
    const root = glb.scene;
    root.scale.set(1, 1, 1);
    scene.add(root);
  },

  function (xhr) {
    console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
  },
  function (error) {
    console.log("An error occurred");
  }
);

loader.load(
  "assets/SK_Kate_Torso_Bare.glb",

  function (glb) {
    console.log(glb);
    const root = glb.scene;
    root.scale.set(1, 1, 1);
    scene.add(root);
  },

  function (xhr) {
    console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
  },
  function (error) {
    console.log("An error occurred");
  }
);

loader.load(
  "assets/SK_Kate_Legs_Bare.glb",

  function (glb) {
    console.log(glb);
    const root = glb.scene;
    root.scale.set(1, 1, 1);
    scene.add(root);
  },

  function (xhr) {
    console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
  },
  function (error) {
    console.log("An error occurred");
  }
);

loader.load(
  "assets/SK_Kate_Glasses.glb",

  function (glb) {
    console.log(glb);
    const root = glb.scene;
    root.scale.set(1, 1, 1);
    scene.add(root);
  },

  function (xhr) {
    console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
  },
  function (error) {
    console.log("An error occurred");
  }
);

loader.load(
  "assets/SK_Kate_Feet_Bare.glb",

  function (glb) {
    console.log(glb);
    const root = glb.scene;
    root.scale.set(1, 1, 1);
    scene.add(root);
  },

  function (xhr) {
    console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
  },
  function (error) {
    console.log("An error occurred");
  }
);

const light = new THREE.DirectionalLight(0xffffff, 1.9);
light.position.set(2, 2, 5);
light.target.position.set(0, 0, 0);
light.castShadow = true;
scene.add(light);

const sizes = { width: window.innerWidth, height: window.innerHeight };

const fov = 60; //  Camera frustum vertical field of view.
const aspect = sizes.width / sizes.height; // Camera frustum aspect ratio.
const near = 1; // Camera frustum near plane.
const far = 1000; // Camera frustum far plane.

const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
camera.position.set(0, 1, 4);
scene.add(camera);
const renderer = new THREE.WebGL1Renderer({
    canvas: canvas,
  });

const controls = new OrbitControls(camera, renderer.domElement);

let geometry = new THREE.PlaneGeometry(50, 50, 5, 5);
let material = new THREE.MeshStandardMaterial({
  color: 0xffffff,
});

const plane = new THREE.Mesh(geometry, material);
plane.castShadow = true;
plane.receiveShadow = true;
plane.rotation.x = -Math.PI / 2;
scene.add(plane);

renderer.setSize(sizes.width, sizes.width);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.gammaOuput = true;

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();
