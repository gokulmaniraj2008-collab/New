# Veloura — Interactive Automotive Study

A responsive, single-page React and Three.js concept-car configurator. The car is a real glTF model, not a still image or rendered video: it can be orbited, zoomed, recoloured and explored through camera presets and model hotspots.

## Run locally

- Requires Node.js 20.19+ and pnpm 11.25.0 (the package manager is pinned in `package.json`).
- Install dependencies with `pnpm install`.
- Start development with `pnpm dev` on port 3000.
- Run the production type-check/build with `pnpm run build`; Vite writes static files into `dist/`.

## Experience

- Drag to orbit horizontally and vertically; swipe on touch screens. Use the mouse wheel or a two-finger pinch to zoom.
- Camera presets: front, rear, side, top and cockpit; reset and fullscreen are available in the viewer controls.
- The Studio panel changes between the GLB’s three authored material variants and applies three finishes to real alloy-wheel materials. It also animates the GLB’s separately addressable side doors, hood and rear hatch.
- Scroll through the editorial chapters to animate the model rotation and camera focus; the closing chapter completes one full turn.
- A reduced-resolution rendering profile is used on small screens; `prefers-reduced-motion` disables the idle drift and simplifies scroll movement. The viewer displays a credited rendered-preview image if WebGL 2 is unavailable.

## 3D asset and attribution

The GLB and its rendered fallback are from KhronosGroup/glTF-Sample-Assets — CarConcept. The delivered model is compressed with Meshopt geometry compression, retains the original source textures, and keeps its articulated door, hood and rear-hatch nodes and three material variants. It is an automotive concept car, not a vehicle from a production manufacturer. The author, source, CC BY 4.0 license and included Khronos/3D Commerce markings are described in [public/models/ATTRIBUTION.md](public/models/ATTRIBUTION.md).
