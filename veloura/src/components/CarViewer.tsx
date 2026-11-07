import { forwardRef, useEffect, useImperativeHandle, useRef, useState, type MutableRefObject } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, Environment, Html, Lightformer, OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import gsap from 'gsap';
import { Expand, Move3D, RotateCcw, X } from 'lucide-react';
import { loadCarModel, type CarModelBundle, type PaintId, type PanelId, type WheelFinishId } from '../lib/carModel';

export type CameraView = 'front' | 'rear' | 'side' | 'top' | 'interior';
export type HotspotId = 'aero' | 'alloy' | 'cockpit';

export interface CameraMotion { yaw: number; zoom: number; focusX: number; focusY: number; focusZ: number }
export interface CarViewerHandle {
  setView: (view: CameraView) => void;
  resetCamera: () => void;
  toggleFullscreen: () => Promise<void>;
  resetPanels: () => void;
}
interface CarViewerProps {
  cameraMotion: MutableRefObject<CameraMotion>;
  cameraMotionPaused: MutableRefObject<boolean>;
  paint: PaintId;
  wheelFinish: WheelFinishId;
  panelState: Record<PanelId, boolean>;
  onHotspot: (id: HotspotId | null) => void;
  activeHotspot: HotspotId | null;
  onViewChange: (view: CameraView) => void;
}

const CAMERA_PRESETS: Record<CameraView, { position: [number, number, number]; target: [number, number, number] }> = {
  front: { position: [0.2, 2.35, 8.3], target: [0, 0.75, 0.35] },
  rear: { position: [0, 2.4, -8.2], target: [0, 0.72, -0.15] },
  side: { position: [8.15, 2.25, 0.35], target: [0, 0.78, 0] },
  top: { position: [0.1, 9.4, 0.35], target: [0, 0.05, 0] },
  interior: { position: [0.22, 1.47, -0.2], target: [0, 1.53, 2.25] },
};

function SceneLights({ lowPower }: { lowPower: boolean }) {
  return (
    <>
      <ambientLight intensity={0.52} color="#e8e2d7" />
      <directionalLight position={[-4, 7, 6]} intensity={2.15} color="#f0e7d5" />
      <directionalLight position={[5, 4, -6]} intensity={2.5} color="#d7dedb" />
      <spotLight position={[0, 7, -1]} intensity={lowPower ? 38 : 58} angle={0.62} penumbra={0.85} color="#b7c6cf" />
      <spotLight position={[-7, 3, 0]} intensity={lowPower ? 24 : 37} angle={0.55} penumbra={0.95} color="#a98d68" />
      <Environment resolution={lowPower ? 128 : 256} frames={1} background={false}>
        <Lightformer form="rect" intensity={3.3} position={[0, 5, 2]} scale={[8, 3, 1]} color="#f6efe2" />
        <Lightformer form="rect" intensity={2.3} position={[-5, 2, 1]} rotation-y={Math.PI / 2} scale={[5, 2.5, 1]} color="#f2ece2" />
        <Lightformer form="rect" intensity={2.5} position={[5, 2, -2]} rotation-y={-Math.PI / 2} scale={[5, 3, 1]} color="#c8d1d4" />
        <Lightformer form="rect" intensity={1.1} position={[0, 4, -5]} rotation-y={Math.PI} scale={[6, 2, 1]} color="#9b8062" />
      </Environment>
    </>
  );
}

function VehicleScene({
  bundle, cameraMotion, cameraMotionPaused, controlsRef, paint, wheelFinish, panelState, onHotspot, activeHotspot, lowPower,
}: {
  bundle: CarModelBundle;
  cameraMotion: MutableRefObject<CameraMotion>;
  cameraMotionPaused: MutableRefObject<boolean>;
  controlsRef: MutableRefObject<OrbitControlsImpl | null>;
  paint: PaintId;
  wheelFinish: WheelFinishId;
  panelState: Record<PanelId, boolean>;
  onHotspot: (id: HotspotId | null) => void;
  activeHotspot: HotspotId | null;
  lowPower: boolean;
}) {
  const turntable = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const focusGoal = useRef(new THREE.Vector3(0, 0.72, 0));
  const reducedMotion = useRef(false);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    reducedMotion.current = query.matches;
    const update = () => { reducedMotion.current = query.matches; };
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    bundle.applyVariant(paint);
    bundle.applyWheelFinish(wheelFinish);
  }, [bundle, paint, wheelFinish]);
  useEffect(() => {
    (['doors', 'hood', 'hatch'] as PanelId[]).forEach((panel) => bundle.setPanel(panel, panelState[panel]));
  }, [bundle, panelState]);

  useFrame((state, delta) => {
    if (turntable.current && !cameraMotionPaused.current) {
      const idle = reducedMotion.current ? 0 : Math.sin(state.clock.elapsedTime * 0.13) * 0.018;
      turntable.current.rotation.y = THREE.MathUtils.damp(turntable.current.rotation.y, cameraMotion.current.yaw + idle, 1.8, delta);
    }

    const controls = controlsRef.current;
    if (!controls || cameraMotionPaused.current) return;
    const motion = cameraMotion.current;
    const nextFocus = new THREE.Vector3(motion.focusX, motion.focusY, motion.focusZ);
    focusGoal.current.lerp(nextFocus, 1 - Math.exp(-delta * 1.6));
    controls.target.lerp(focusGoal.current, 1 - Math.exp(-delta * 1.8));
    const direction = camera.position.clone().sub(controls.target);
    if (direction.lengthSq() < 0.01) direction.set(0.2, 0.25, 1);
    direction.normalize();
    const distance = THREE.MathUtils.clamp(8.55 - motion.zoom * 3.2, 5.1, 9.5);
    const desired = controls.target.clone().addScaledVector(direction, distance);
    camera.position.lerp(desired, 1 - Math.exp(-delta * 1.4));
    controls.update();
  });

  const hotspots: Array<{ id: HotspotId; label: string; position: [number, number, number]; title: string; detail: string }> = [
    { id: 'aero', label: 'Aero form', position: [0, 0.64, 2.18], title: 'Sculpted front', detail: 'A low nose, open cooling forms and a precise light signature.' },
    { id: 'alloy', label: 'Alloy wheel', position: [1.36, 0.56, 1.18], title: 'Machined alloy', detail: 'Four bespoke wheel assemblies with finishes you can change live.' },
    { id: 'cockpit', label: 'Cockpit', position: [0, 1.5, -0.12], title: 'Driver-first cabin', detail: 'Step into the two-tone cockpit and explore its controls, seats and trim.' },
  ];

  return (
    <group ref={turntable}>
      <primitive object={bundle.root} dispose={null} />
      {!lowPower && <ContactShadows position={[0, 0.02, 0]} scale={10} opacity={0.46} blur={2.8} far={4} resolution={256} color="#020303" />}
      {hotspots.map((hotspot) => (
        <Html key={hotspot.id} position={hotspot.position} center distanceFactor={8} zIndexRange={[40, 0]}>
          <div className="hotspot-anchor">
            <button
              className={`hotspot-dot ${activeHotspot === hotspot.id ? 'is-active' : ''}`}
              type="button" title={hotspot.label} aria-label={`Inspect ${hotspot.label}`}
              aria-pressed={activeHotspot === hotspot.id}
              onClick={() => onHotspot(activeHotspot === hotspot.id ? null : hotspot.id)}
            ><span /></button>
            {activeHotspot === hotspot.id && (
              <div className="hotspot-card" role="status">
                <button type="button" aria-label="Close feature detail" onClick={() => onHotspot(null)}><X size={13} /></button>
                <span className="eyebrow">VELOURA / DETAIL</span>
                <strong>{hotspot.title}</strong><p>{hotspot.detail}</p>
              </div>
            )}
          </div>
        </Html>
      ))}
    </group>
  );
}

export const CarViewer = forwardRef<CarViewerHandle, CarViewerProps>(function CarViewer(
  { cameraMotion, cameraMotionPaused, paint, wheelFinish, panelState, onHotspot, activeHotspot, onViewChange },
  forwardedRef,
) {
  const viewerElement = useRef<HTMLDivElement>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const [bundle, setBundle] = useState<CarModelBundle | null>(null);
  const [progress, setProgress] = useState(0);
  const [webglSupported, setWebglSupported] = useState<boolean | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [lowPower, setLowPower] = useState(false);
  const [manualOverride, setManualOverride] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 700px)');
    const update = () => setLowPower(media.matches);
    update(); media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    const canvas = document.createElement('canvas');
    const supported = Boolean(canvas.getContext('webgl2', { powerPreference: 'high-performance' }));
    setWebglSupported(supported);
    if (!supported) setLoadError(true);
  }, []);
  useEffect(() => {
    if (!webglSupported) return;
    let cancelled = false;
    const start = window.setTimeout(() => {
      loadCarModel(setProgress)
        .then((result) => { if (!cancelled) setBundle(result); })
        .catch(() => { if (!cancelled) setLoadError(true); });
    }, 120);
    return () => { cancelled = true; window.clearTimeout(start); };
  }, [webglSupported]);

  const setView = (view: CameraView) => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;
    onViewChange(view);
    cameraMotionPaused.current = true;
    if (bundle?.root.parent) {
      gsap.to(bundle.root.parent.rotation, { y: 0, duration: 1.1, ease: 'power3.inOut', overwrite: 'auto' });
    }
    const preset = CAMERA_PRESETS[view];
    setManualOverride(true);
    gsap.killTweensOf(camera.position); gsap.killTweensOf(controls.target);
    gsap.to(camera.position, { x: preset.position[0], y: preset.position[1], z: preset.position[2], duration: 1.1, ease: 'power3.inOut' });
    gsap.to(controls.target, {
      x: preset.target[0], y: preset.target[1], z: preset.target[2], duration: 1.1, ease: 'power3.inOut',
      onUpdate: () => controls.update(), onComplete: () => window.setTimeout(() => setManualOverride(false), 2500),
    });
  };

  const resetCamera = () => {
    cameraMotion.current.yaw = 0; cameraMotion.current.zoom = 0.08;
    cameraMotion.current.focusX = 0; cameraMotion.current.focusY = 0.72; cameraMotion.current.focusZ = 0;
    setView('front');
  };
  useImperativeHandle(forwardedRef, () => ({
    setView,
    resetCamera,
    async toggleFullscreen() {
      const element = viewerElement.current;
      if (!element) return;
      if (document.fullscreenElement) await document.exitFullscreen();
      else await element.requestFullscreen?.();
    },
    resetPanels() { bundle?.resetPanels(); },
  }));

  const handleUserCamera = () => {
    cameraMotionPaused.current = true;
    setManualOverride(true);
    window.setTimeout(() => setManualOverride(false), 2200);
  };

  return (
    <div className="viewer-root" ref={viewerElement} aria-label="Interactive 3D Veloura concept car viewer">
      {loadError ? (
        <div className="viewer-fallback">
          <img src="/models/carconcept-preview.jpg" alt="Khronos Car Concept — rendered model preview" />
          <div className="fallback-copy"><span className="eyebrow">STATIC PREVIEW</span><p>Your device cannot start WebGL in this browser. You can still explore the car with the sections and specifications below.</p></div>
        </div>
      ) : webglSupported && (
        <Canvas
          dpr={lowPower ? [1, 1.2] : [1, 1.75]}
          gl={{ antialias: !lowPower, alpha: true, powerPreference: 'high-performance', stencil: false }}
          camera={{ position: CAMERA_PRESETS.front.position, fov: 34, near: 0.1, far: 60 }}
          onCreated={({ camera }) => { cameraRef.current = camera as THREE.PerspectiveCamera; }}
          performance={{ min: 0.55 }}
        >
          <color attach="background" args={['#111311']} /><fog attach="fog" args={['#111311', 15, 32]} />
          <SceneLights lowPower={lowPower} />
          {bundle && <VehicleScene
            bundle={bundle} cameraMotion={cameraMotion} cameraMotionPaused={cameraMotionPaused} controlsRef={controlsRef}
            paint={paint} wheelFinish={wheelFinish} panelState={panelState}
            onHotspot={onHotspot} activeHotspot={activeHotspot} lowPower={lowPower}
          />}
          <OrbitControls
            ref={controlsRef} makeDefault enableDamping dampingFactor={0.075} enablePan={false} enableZoom
            zoomSpeed={0.72} rotateSpeed={0.58} minDistance={2.15} maxDistance={13}
            minPolarAngle={0.08} maxPolarAngle={Math.PI - 0.08}
            onStart={handleUserCamera}
          />
        </Canvas>
      )}

      {!bundle && !loadError && (
        <div className="model-loader" role="status" aria-live="polite">
          <div className="loader-topline"><span>{webglSupported ? 'PREPARING THE STUDIO' : 'SETTING THE STAGE'}</span><span>{progress}%</span></div>
          <div className="loader-track"><span style={{ width: `${progress}%` }} /></div>
          <span className="loader-sub">A moment while the model arrives</span>
        </div>
      )}
      {bundle && !manualOverride && <div className="drag-hint" aria-hidden="true"><Move3D size={14} /> DRAG TO EXPLORE</div>}
      <div className="viewer-utility" aria-label="Viewer controls">
        <button type="button" onClick={resetCamera} aria-label="Reset camera" title="Reset camera"><RotateCcw size={16} /></button>
        <button
          type="button"
          onClick={() => void (async () => {
            const element = viewerElement.current; if (!element) return;
            if (document.fullscreenElement) await document.exitFullscreen(); else await element.requestFullscreen?.();
          })()}
          aria-label="Toggle fullscreen" title="Fullscreen"
        ><Expand size={16} /></button>
      </div>
    </div>
  );
});
