# Veloura — Interactive 3D Automotive

## Scope and implementation approach

Build a single-page, responsive luxury sports-car configurator as a React + Vite + TypeScript site. Render the car as an actual interactive Three.js scene through React Three Fiber. Use Drei for environment, loading, controls and scene helpers; GSAP ScrollTrigger for section-linked camera choreography; Tailwind CSS for responsive layout and component styling. There is no need for an application server or database.

The 3D experience is the core product, not a video or a static hero. Use Khronos' Car Concept GLB, downloaded from the Khronos Group glTF Sample Assets repository at `https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/CarConcept/glTF-Binary/CarConcept.glb`. Meshopt-compress its geometry without flattening or joining separately addressable scene parts; preserve the three authored material variants, original textures, and door, hood and rear-hatch nodes. The delivered model is approximately 5.2 MB (down from approximately 11.8 MB). Preserve required CC BY 4.0 credits in `public/models/ATTRIBUTION.md`: © 2024 Darmstadt Graphics Group GmbH, Eric Chadwick for model and textures, plus the listed Khronos Group trademark/logo notices. The asset contains Khronos and 3D Commerce markings; do not claim the model is an original production-brand vehicle or remove required notices.

Support free 360-degree orbiting with mouse drag and touch, mouse-wheel and pinch zoom, damping, front/rear/left/right/top/interior camera presets, reset, and fullscreen. Add live paint/material and wheel-finish choices using the real scene meshes/material variants where supported. Provide inspectable hotspots for visible details. Door, bonnet and boot actions will be enabled only if the model contains separately addressable movable parts; otherwise omit them instead of presenting nonfunctional controls. Interior view will reposition the camera into the cabin when model geometry permits.

The scroll narrative will use short editorial chapters to drive damped camera position/target/azimuth changes and close-ups of the front, wheel, cabin, and a closing full rotation. Scroll gestures must coexist with direct viewer controls; reduced-motion preferences and mobile viewport limits will be respected. Include a visible loading/progress state, lazy-load the model/viewer, adjust canvas quality and shadow cost for mobile, and show a helpful fallback when WebGL is unavailable.

## Project structure

- `src/main.tsx` mounts the application and global styles.
- `src/App.tsx` owns the page sections, navigation, configurator state, scroll orchestration, and responsive layout.
- `src/components/CarViewer.tsx` owns the canvas, model load/progress state, camera controls/presets, hotspots, custom paint/wheels, fullscreen, and WebGL fallback.
- `src/components/ConfiguratorPanel.tsx` and `src/components/FeatureSections.tsx` provide accessible customization controls, camera-view shortcuts, feature content, and scroll chapters.
- `src/lib/carModel.ts` contains model loading, material/node discovery, safe bounds framing, optional articulated-node detection, and any loaded-model adapter.
- `src/styles.css` contains the design tokens, responsive page layout and interaction states; Tailwind is available through the Vite plugin and global import.
- `public/models/CarConcept.glb` contains the optimized licensed GLB; `public/models/ATTRIBUTION.md` carries its attribution and license details.
- `public/manus-routes.json` declares the home route before the first dev-server start.

## Design system

**Design movement:** contemporary European grand-touring editorial, expressed as a quiet, restrained configurator rather than a dealership interface.

**Core principles:** cinematic but legible; tactile and purposeful controls; substantial negative space; technical detail without visual noise.

**Color philosophy:** ink-black and graphite give the car the visual focus; warm white carries reading contrast; muted brushed-metal/champagne is the single signature accent for selected states and fine rules. Paint swatches are the strongest color on screen.

**Layout paradigm:** an edge-to-edge hero with the car allowed to dominate the viewport; compact navigation sits at the edges, while the specification, feature chapters and configuration controls enter as horizontally offset editorial panels. On phones, controls collapse into a thumb-reachable bottom drawer.

**Signature elements:** a hairline champagne rule that marks active sections; large restrained model numerals/short labels; tiny uppercase instrument-style metadata with generous letter spacing.

**Interaction philosophy:** direct manipulation first, presets and settings remain obvious. Every icon control has a label or accessible name and visible pressed/selected states. Camera movement eases naturally; customization applies immediately; focus and keyboard interaction remain usable. Manual camera control takes precedence over scroll choreography until the visitor scrolls again; editorial text remains a page-scroll target alongside the interactive canvas.

**Animation:** slow, low-amplitude idle presentation; damped orbit controls; short eased state changes; scroll-scrubbed camera moves only when their chapter is visible. Avoid parallax on small devices and honor `prefers-reduced-motion` with a static, operable camera path.

**Typography system:** a high-contrast editorial display serif for the model title, paired with a crisp modern sans for controls and specifications. Use a small, consistent scale for technical metadata and never encode meaning only in typeface or color.

**Brand essence:** a considered digital studio for exploring a modern grand tourer; composed, tactile, precise.

**Brand voice:** short, confident labels rather than sales copy. Example lines: “Sculpted for the long way.” “Choose your finish.”

**Wordmark & logo:** a custom text wordmark with a thin, geometric V monogram built from two unequal hairlines; use the mark in navigation and the lower footer, not as a large decoration.

**Signature brand color:** muted champagne metal.

## Frontend/runtime and resource assumptions

Use the existing managed sandbox project with local port 3000, no new managed server or database. Pin the package manager and declare install-script permissions before dependency installation. TypeScript diagnostics are registered with the host. Start the preview server on `0.0.0.0:3000`. Keep the page route manifest current at `/manus-routes.json`. Prepare a static production build declaration once the application is implemented. Do not publish or enable auto-publication unless explicitly requested.

## Model constraints

The asset is a third-party CC BY 4.0 concept car with Khronos/3D Commerce marks. Keep license/creator credit next to the model's attribution notice. Camera rotation, zoom, presets, reset, fullscreen and scroll camera choreography are application controls. Paint/wheel customization must address actual supported scene materials. Door/bonnet/boot movement remains conditional on actual articulated model nodes. Do not label invented performance numbers as official vehicle specifications; show clearly styled concept/car-scene specs where genuine source specifications are unavailable.
