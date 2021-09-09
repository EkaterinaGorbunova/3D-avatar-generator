import * as THREE from "https://cdn.skypack.dev/three@0.132.2/build/three.module.js";
import { GLTFLoader } from "https://cdn.skypack.dev/three@0.132.2/examples/jsm/loaders/GLTFLoader.js";

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

const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(2, 2, 5);
scene.add(light);

// Boiler Plate Code
const sizes = { width: window.innerWidth, height: window.innerHeight };

const camera = new THREE.PerspectiveCamera(
  75,
  sizes.width / sizes.height,
  0.1,
  100
);
camera.position.set(0, 1, 2);
scene.add(camera);

const renderer = new THREE.WebGL1Renderer({
  canvas: canvas,
});

renderer.setSize(sizes.width, sizes.width);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.gammaOuput = true;

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();
