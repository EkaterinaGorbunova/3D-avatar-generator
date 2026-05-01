# 3D Avatar Generator

An interactive 3D avatar viewer built with Three.js and Vite. Load a fully rigged ReadyPlayerMe avatar and control its facial expressions in real time using ARKit blend shapes.

![3D Avatar Generator](./public/img/avatar.png)

---

## Features

- **7 emotion presets** — Neutral, Happy, Sad, Angry, Surprised, Disgusted, Fear
- **12 fine-control sliders** — individually adjust Smile, Frown, Jaw, Brows, Eye Blink, Eye Wide, Cheek Puff, and more
- **63 ARKit morph targets** driven in real time via Three.js `morphTargetInfluences`
- **Glassmorphism side panel** — collapsible controls UI with smooth transitions
- **OrbitControls** — rotate, zoom, and pan with mouse/touch + damping
- **Modular architecture** — scene, morphs, and UI are separate ES modules
- **Vite-powered** — instant hot reload in development, optimized production build

---

## Tech Stack

| Tool | Version | Role |
|---|---|---|
| [Three.js](https://threejs.org/) | 0.184 | 3D rendering engine |
| [Vite](https://vitejs.dev/) | 8 | Build tool & dev server |
| GLTFLoader | bundled | Load `.glb` avatar parts |
| OrbitControls | bundled | Camera interaction |

---

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

---

## Project Structure

```
my_3d_avatar/
├── public/
│   └── assets/              # GLB model parts (ReadyPlayerMe avatar)
│       ├── SK_Kate_Face_Bare.glb
│       ├── SK_Kate_Body_Bare.glb
│       ├── SK_Kate_Torso_Bare.glb
│       ├── SK_Kate_Legs_Bare.glb
│       ├── SK_Kate_Feet_Bare.glb
│       └── SK_Kate_Glasses.glb
├── src/
│   ├── main.js              # Scene setup, lighting, camera, model loader
│   ├── morphs.js            # Emotion presets + morph target utilities
│   └── ui.js                # Controls panel — emotion buttons & sliders
├── index.html               # App entry point + panel CSS
└── package.json
```

---

## How Facial Expressions Work

The avatar's face mesh (`Wolf3D_Head`, `Wolf3D_Teeth`) contains **63 ARKit-compatible blend shapes** (morph targets). Each morph target deforms the mesh geometry — e.g. `mouthSmileLeft` pulls the left mouth corner up.

**Emotion presets** (`src/morphs.js`) combine multiple morph targets at calibrated weights:

```js
happy: {
  mouthSmileLeft: 0.9, mouthSmileRight: 0.9,
  cheekSquintLeft: 0.5, cheekSquintRight: 0.5,
  eyeSquintLeft: 0.35,  eyeSquintRight: 0.35,
}
```

The **fine-control sliders** (`src/ui.js`) let you override individual targets after applying a preset — symmetric pairs (Left/Right) are controlled by a single slider.

---

## Avatar Model

The avatar was created with [ReadyPlayerMe](https://readyplayer.me/) and exported as separate GLB parts for modular loading.
