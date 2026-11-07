import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowDown, ArrowRight, ArrowUpRight, BadgeCheck, ChevronRight, CircleDot, Maximize2, RotateCcw, Sparkles, Wind } from 'lucide-react';
import type { CameraView, CarViewerHandle, CameraMotion, HotspotId } from './components/CarViewer';
import { ConfiguratorPanel } from './components/ConfiguratorPanel';
import { FeatureSections } from './components/FeatureSections';
import { type PaintId, type PanelId, type WheelFinishId } from './lib/carModel';

const LazyCarViewer = lazy(() => import('./components/CarViewer').then((module) => ({ default: module.CarViewer })));

gsap.registerPlugin(ScrollTrigger, useGSAP);

const VIEWS: Array<{ id: CameraView; label: string; icon: string }> = [
  { id: 'front', label: 'Front', icon: '01' },
  { id: 'rear', label: 'Rear', icon: '02' },
  { id: 'side', label: 'Side', icon: '03' },
  { id: 'top', label: 'Top', icon: '04' },
  { id: 'interior', label: 'Cabin', icon: '05' },
];

export default function App() {
  const mainRef = useRef<HTMLDivElement>(null);
  const experienceRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<CarViewerHandle>(null);
  const cameraMotion = useRef<CameraMotion>({ yaw: 0, zoom: 0.08, focusX: 0, focusY: 0.72, focusZ: 0 });
  const cameraMotionPaused = useRef(false);
  const [paint, setPaint] = useState<PaintId>(0);
  const [wheelFinish, setWheelFinish] = useState<WheelFinishId>('original');
  const [panelState, setPanelState] = useState<Record<PanelId, boolean>>({ doors: false, hood: false, hatch: false });
  const [configOpen, setConfigOpen] = useState(true);
  const [activeHotspot, setActiveHotspot] = useState<HotspotId | null>(null);
  const [activeChapter, setActiveChapter] = useState(0);
  const [selectedView, setSelectedView] = useState<CameraView>('front');
  const [fullscreen, setFullscreen] = useState(false);
  const prefersReducedMotion = useRef(false);

  useEffect(() => {
    const resumeScrollCamera = () => { cameraMotionPaused.current = false; };
    window.addEventListener('scroll', resumeScrollCamera, { passive: true });
    return () => window.removeEventListener('scroll', resumeScrollCamera);
  }, []);

  const changeView = useCallback((view: CameraView) => {
    viewerRef.current?.setView(view);
    setSelectedView(view);
  }, []);

  const resetStudio = useCallback(() => {
    setPaint(0);
    setWheelFinish('original');
    setPanelState({ doors: false, hood: false, hatch: false });
    setActiveHotspot(null);
    setSelectedView('front');
    viewerRef.current?.resetPanels();
    viewerRef.current?.resetCamera();
  }, []);

  const togglePanel = (panel: PanelId) => setPanelState((state) => ({ ...state, [panel]: !state[panel] }));

  useGSAP(() => {
    if (!experienceRef.current) return;
    prefersReducedMotion.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const motion = cameraMotion.current;
    const sequence = gsap.timeline({
      scrollTrigger: {
        trigger: experienceRef.current,
        start: 'top top',
        end: 'bottom bottom',
        scrub: prefersReducedMotion.current ? 0.01 : 1.05,
        invalidateOnRefresh: true,
      },
    });

    if (prefersReducedMotion.current) {
      sequence.to(motion, { yaw: Math.PI * 2, zoom: 0.08, focusX: 0, focusY: 0.72, focusZ: 0, ease: 'none' }, 0);
    } else {
      sequence
        .to(motion, { yaw: Math.PI * 0.42, zoom: 0.48, focusX: 0, focusY: 0.72, focusZ: 1.65, ease: 'none' }, 0.03)
        .to(motion, { yaw: Math.PI * 0.95, zoom: 0.64, focusX: 1.03, focusY: 0.55, focusZ: 1.0, ease: 'none' }, 0.25)
        .to(motion, { yaw: Math.PI * 1.5, zoom: 0.45, focusX: 0, focusY: 1.05, focusZ: -0.1, ease: 'none' }, 0.50)
        .to(motion, { yaw: Math.PI * 1.95, zoom: 0.46, focusX: 0, focusY: 0.72, focusZ: -1.55, ease: 'none' }, 0.73)
        .to(motion, { yaw: Math.PI * 2, zoom: 0.08, focusX: 0, focusY: 0.72, focusZ: 0, ease: 'none' }, 0.91);
    }

    const chapters = gsap.utils.toArray<HTMLElement>('.story-section');
    chapters.forEach((section, index) => {
      ScrollTrigger.create({
        trigger: section,
        start: 'top 55%',
        end: 'bottom 45%',
        onEnter: () => setActiveChapter(index),
        onEnterBack: () => setActiveChapter(index),
      });
    });
    return () => { sequence.scrollTrigger?.kill(); };
  }, { scope: mainRef, dependencies: [] });

  useEffect(() => {
    const updateFullscreen = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', updateFullscreen);
    return () => document.removeEventListener('fullscreenchange', updateFullscreen);
  }, []);

  return (
    <div className="site-shell" ref={mainRef}>
      <div className="studio-backdrop" aria-hidden="true" />
      <Suspense fallback={<div className="model-loader" role="status"><div className="loader-topline"><span>SETTING THE STAGE</span><span>—</span></div><div className="loader-track"><span style={{ width: '42%' }} /></div><span className="loader-sub">Preparing the interactive studio</span></div>}>
        <LazyCarViewer
          ref={viewerRef}
          cameraMotion={cameraMotion}
          cameraMotionPaused={cameraMotionPaused}
          paint={paint}
          wheelFinish={wheelFinish}
          panelState={panelState}
          onHotspot={setActiveHotspot}
          activeHotspot={activeHotspot}
          onViewChange={setSelectedView}
        />
      </Suspense>
      <div className="scene-vignette" aria-hidden="true" />

      <header className="site-header">
        <a className="brand-lockup" href="#home" aria-label="Veloura home">
          <span className="brand-monogram" aria-hidden="true"><i /><i /></span>
          <span className="brand-wordmark">VELOURA</span>
        </a>
        <nav className="primary-nav" aria-label="Main navigation">
          <a href="#journey">The experience</a>
          <a href="#configurator">Configure</a>
          <a href="#credits">About the model</a>
        </nav>
        <a href="#configurator" className="header-action"><span>Enter the studio</span><ArrowUpRight size={14} /></a>
      </header>

      <main>
        <section className="hero-section" id="home" aria-labelledby="hero-title">
          <div className="hero-copy">
            <span className="hero-kicker"><span className="status-dot" /> THE VELOURA CONCEPT GRAND TOURER</span>
            <h1 id="hero-title">Sculpted<br />for the <em>long way.</em></h1>
            <p>A study in presence, proportion and the pleasure of looking closer.</p>
            <div className="hero-actions">
              <a href="#journey" className="button-primary"><span>Explore the form</span><ArrowRight size={15} /></a>
              <button className="button-ghost" type="button" onClick={() => changeView('interior')}><span className="play-mark"><CircleDot size={15} /></span> Enter the cabin</button>
            </div>
          </div>

          <div className="hero-index" aria-hidden="true"><span>01</span><span className="hero-index-line" /><span>05</span></div>
          <div className="hero-caption"><span>CAR CONCEPT / DIGITAL STUDIO</span><span>MOVE TO DISCOVER <ArrowDown size={13} /></span></div>
          <div className="hero-corner-note"><span>FREE ROTATION</span><span>DRAG · ZOOM · INSPECT</span></div>

          <div className="hero-specs" aria-label="Model highlights">
            <div><span>01 / FORM</span><strong>Concept grand tourer</strong></div>
            <div><span>02 / MATERIAL</span><strong>3 authored paint variants</strong></div>
            <div><span>03 / VIEW</span><strong>Full 360° exploration</strong></div>
          </div>
        </section>

        <div ref={experienceRef} className="experience-sequence">
          <div className="sequence-caption"><span>THE STUDY / {String(activeChapter + 1).padStart(2, '0')}</span><span>SCROLL TO MOVE THROUGH THE FORM</span></div>
          <FeatureSections onChapterChange={setActiveChapter} />
        </div>

        <section className="specification-section" aria-labelledby="spec-title">
          <div className="specification-header">
            <div><span className="eyebrow">THE OBJECT / SPECIFICATION</span><h2 id="spec-title">A concept, considered.</h2></div>
            <p>Design details, not performance claims. This is a digital exploration of the Car Concept model and its authored materials.</p>
          </div>
          <div className="spec-grid">
            <article className="spec-card"><span>01</span><Wind size={19} /><div><small>PROPORTION</small><strong>Low, long silhouette</strong><p>A wide stance with a fastback roofline.</p></div></article>
            <article className="spec-card"><span>02</span><Sparkles size={19} /><div><small>FINISH</small><strong>Clearcoat material study</strong><p>Three original paint and trim variants.</p></div></article>
            <article className="spec-card"><span>03</span><BadgeCheck size={19} /><div><small>INTERIOR</small><strong>Two-tone cockpit</strong><p>Explore the seat, dash and steering detail.</p></div></article>
            <article className="spec-card"><span>04</span><Maximize2 size={19} /><div><small>INTERACTION</small><strong>Full 360° studio</strong><p>Orbit freely or jump to a camera view.</p></div></article>
          </div>
        </section>

        <section className="closing-section" aria-labelledby="closing-title">
          <span className="eyebrow">THE LAST LOOK / THEN YOURS</span>
          <h2 id="closing-title">A complete circuit.<br /><em>Begin again.</em></h2>
          <p>Make a finish choice, open the panels and take the view wherever you want it.</p>
          <div className="closing-actions">
            <button className="button-primary" type="button" onClick={() => { resetStudio(); window.scrollTo({ top: 0, behavior: prefersReducedMotion.current ? 'auto' : 'smooth' }); }}><span>Start your tour</span><RotateCcw size={14} /></button>
            <a className="button-ghost" href="#configurator">Configure the finish <ChevronRight size={15} /></a>
          </div>
          <span className="closing-coordinate" aria-hidden="true">N 00° / 360°</span>
        </section>
      </main>

      <div className="view-dock" aria-label="Camera view presets">
        <span className="dock-label">CAMERA / <b>{VIEWS.find((view) => view.id === selectedView)?.label}</b></span>
        <div className="view-buttons">
          {VIEWS.map((view) => (
            <button key={view.id} type="button" onClick={() => changeView(view.id)} className={selectedView === view.id ? 'is-selected' : ''} aria-pressed={selectedView === view.id} aria-label={`View ${view.label}`} title={`${view.label} view`}>
              <span>{view.icon}</span><small>{view.label}</small>
            </button>
          ))}
        </div>
      </div>

      <ConfiguratorPanel
        open={configOpen}
        onToggle={() => setConfigOpen((value) => !value)}
        paint={paint}
        onPaintChange={setPaint}
        wheelFinish={wheelFinish}
        onWheelFinishChange={setWheelFinish}
        panelState={panelState}
        onPanelToggle={togglePanel}
        onReset={resetStudio}
      />

      <button
        type="button"
        className={`floating-fullscreen ${fullscreen ? 'is-active' : ''}`}
        onClick={() => void viewerRef.current?.toggleFullscreen()}
        aria-label={fullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
        title={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
      ><Maximize2 size={15} /></button>

      <footer className="site-footer" id="credits">
        <div className="footer-brand"><span className="brand-monogram" aria-hidden="true"><i /><i /></span><span>VELOURA</span></div>
        <span>A DIGITAL STUDY IN AUTOMOTIVE FORM</span>
        <a href="/models/ATTRIBUTION.md" target="_blank" rel="noreferrer">Model credits <ArrowUpRight size={12} /></a>
        <span>© VELOURA STUDIO / 2026</span>
      </footer>
    </div>
  );
}
