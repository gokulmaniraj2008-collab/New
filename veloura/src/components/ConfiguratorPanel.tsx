import { ChevronDown, DoorOpen, RotateCcw, SlidersHorizontal, X } from 'lucide-react';
import type { CSSProperties } from 'react';
import { PAINT_VARIANTS, WHEEL_FINISHES, type PaintId, type PanelId, type WheelFinishId } from '../lib/carModel';

interface ConfiguratorPanelProps {
  open: boolean;
  onToggle: () => void;
  paint: PaintId;
  onPaintChange: (paint: PaintId) => void;
  wheelFinish: WheelFinishId;
  onWheelFinishChange: (finish: WheelFinishId) => void;
  panelState: Record<PanelId, boolean>;
  onPanelToggle: (panel: PanelId) => void;
  onReset: () => void;
}

export function ConfiguratorPanel({
  open, onToggle, paint, onPaintChange, wheelFinish, onWheelFinishChange, panelState, onPanelToggle, onReset,
}: ConfiguratorPanelProps) {
  const selectedPaint = PAINT_VARIANTS.find((item) => item.id === paint) ?? PAINT_VARIANTS[0];
  return (
    <aside className={`configurator ${open ? 'is-open' : ''}`} id="configurator" aria-label="Car configuration panel">
      <button type="button" className="configurator-toggle" onClick={onToggle} aria-expanded={open}>
        <span className="configurator-mark"><SlidersHorizontal size={15} /></span>
        <span className="configurator-toggle-copy"><small>PERSONALISE</small><strong>Studio controls</strong></span>
        <ChevronDown className="configurator-chevron" size={17} />
      </button>
      {open && (
        <div className="configurator-body">
          <div className="configurator-heading">
            <div><span className="eyebrow">YOUR FINISH</span><h2>Make it yours.</h2></div>
            <button type="button" className="quiet-icon" onClick={onToggle} aria-label="Close configuration panel"><X size={15} /></button>
          </div>
          <section className="control-group" aria-labelledby="paint-label">
            <div className="control-title"><span id="paint-label">01 / Body colour</span><span className="control-value">{selectedPaint.label}</span></div>
            <div className="swatch-row" role="group" aria-label="Choose car paint">
              {PAINT_VARIANTS.map((option) => (
                <button
                  key={option.id} type="button"
                  className={`paint-swatch ${paint === option.id ? 'is-selected' : ''}`}
                  style={{ '--swatch': option.swatch } as CSSProperties}
                  aria-label={`Paint ${option.name}`} aria-pressed={paint === option.id}
                  title={option.note} onClick={() => onPaintChange(option.id)}
                ><span /></button>
              ))}
            </div>
            <p className="control-note">{selectedPaint.note} · model-authored material variant</p>
          </section>
          <section className="control-group" aria-labelledby="wheel-label">
            <div className="control-title"><span id="wheel-label">02 / Alloy finish</span><span className="control-value">{WHEEL_FINISHES.find((item) => item.id === wheelFinish)?.name}</span></div>
            <div className="wheel-options" role="group" aria-label="Choose alloy wheel finish">
              {WHEEL_FINISHES.map((option) => (
                <button key={option.id} type="button" className={`wheel-option ${wheelFinish === option.id ? 'is-selected' : ''}`}
                  onClick={() => onWheelFinishChange(option.id)} aria-pressed={wheelFinish === option.id}>
                  <span className="wheel-chip" style={{ backgroundColor: option.swatch }} /><span>{option.name}</span>
                </button>
              ))}
            </div>
          </section>
          <section className="control-group cabin-controls" aria-labelledby="cabin-label">
            <div className="control-title"><span id="cabin-label">03 / Open details</span><span className="control-value">Live scene</span></div>
            <div className="panel-actions">
              <button type="button" className={panelState.doors ? 'is-selected' : ''} onClick={() => onPanelToggle('doors')} aria-pressed={panelState.doors}>
                <DoorOpen size={14} /><span>{panelState.doors ? 'Close' : 'Open'} doors</span>
              </button>
              <button type="button" className={panelState.hood ? 'is-selected' : ''} onClick={() => onPanelToggle('hood')} aria-pressed={panelState.hood}>
                <span className="panel-icon panel-icon-hood" /><span>{panelState.hood ? 'Close' : 'Open'} bonnet</span>
              </button>
              <button type="button" className={panelState.hatch ? 'is-selected' : ''} onClick={() => onPanelToggle('hatch')} aria-pressed={panelState.hatch}>
                <span className="panel-icon panel-icon-hatch" /><span>{panelState.hatch ? 'Close' : 'Open'} rear hatch</span>
              </button>
            </div>
          </section>
          <div className="configurator-footer">
            <span>Concept car · live 3D materials</span>
            <button type="button" onClick={onReset} aria-label="Reset car configuration"><RotateCcw size={14} /> Reset</button>
          </div>
        </div>
      )}
    </aside>
  );
}
