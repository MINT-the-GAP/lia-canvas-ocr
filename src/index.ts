// Boot module: registry, theme sync, OCR bar, engine, canvas init.

// ---------------------------------------------------------------------------
// Root window helper
// ---------------------------------------------------------------------------

export function getRootWindow(): Window {
  let w: Window = window;
  try { while (w.parent && w.parent !== w) w = w.parent as Window; } catch (_) {}
  return w;
}

// ---------------------------------------------------------------------------
// LIA registry — must be declared before any import side-effects run.
// Other modules import LIA from here; they must not access it at module
// evaluation time (only inside functions called after boot).
// ---------------------------------------------------------------------------

export const LIA: any = (window as any).__LIA_CANVAS_OCR__ = (window as any).__LIA_CANVAS_OCR__ || {
  SHOW_BAR:       false,
  bar:            null,
  ocr:            null,
  tfjs:           null,
  tfjsLoad:       null,
  store:          {},
  uidSeq:         0,
  freeze:         {},
  barBoot:        false,
  canvasBoot:     false,
  launcherBound:  false,
};

// ---------------------------------------------------------------------------
// Deferred imports — placed after LIA so the circular reference is safe.
// These modules import LIA, but only use it inside functions, never at the
// top level, so by the time those functions run LIA is already initialized.
// ---------------------------------------------------------------------------

import { ensureOcrBar }                   from './ocr/bar';
import { ensureOcrEngine }                from './ocr/engine';
import { applyThemeVars, getAccentColor } from './canvas/theme';
import { ensureCanvasFreezeApi }          from './canvas/freeze';
import { initAll, canvasMarkup }          from './canvas/index';

// ---------------------------------------------------------------------------
// Single registry — guards against double-init across iframes
// ---------------------------------------------------------------------------

const ROOT   = getRootWindow() as any;
const REGKEY = '__LIA_CANVAS_OCR_REG_V1__';
ROOT[REGKEY] = ROOT[REGKEY] || { inited: {} };

const DOC_ID = document.baseURI || location.href;
if (!ROOT[REGKEY].inited[DOC_ID]) {
  ROOT[REGKEY].inited[DOC_ID] = true;
  boot();
}

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------

function boot(): void {
  // ---- OCR bar ----
  if (!LIA.barBoot) {
    LIA.barBoot = true;
    ensureOcrBar();

    const syncAccent = () => {
      try {
        const acc = getAccentColor(document);
        if (acc) document.documentElement.style.setProperty('--canvas-accent', acc);
      } catch (_) {}
    };
    syncAccent();
    setTimeout(syncAccent, 0);
  }

  // ---- Theme vars ----
  applyThemeVars();
  new MutationObserver(() => applyThemeVars())
    .observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'style'] });
  window.addEventListener('resize', () => applyThemeVars());

  // ---- Canvas + OCR engine ----
  if (!LIA.canvasBoot) {
    LIA.canvasBoot = true;
    LIA.uidSeq     = LIA.uidSeq || 0;

    ensureOcrEngine();
    ensureCanvasFreezeApi();

    initAll();

    // Launcher click handler
    if (!LIA.launcherBound) {
      LIA.launcherBound = true;

      document.addEventListener('click', (e: MouseEvent) => {
        const btn = (e.target as Element)?.closest?.('.lia-canvas-launch') as HTMLElement | null;
        if (!btn) return;

        const pair  = btn.closest('.lia-canvas-pair') as HTMLElement | null;
        if (!pair) return;

        const mount = pair.querySelector('.lia-canvas-mount') as HTMLElement | null;
        if (!mount) return;

        if (!mount.dataset.uid) {
          LIA.uidSeq = (LIA.uidSeq || 0) + 1;
          mount.dataset.uid = 'c' + LIA.uidSeq;
        }

        try {
          const parent = mount.parentElement;
          if (parent) {
            const cs = getComputedStyle(parent);
            if (String(cs.display).includes('flex') && String(cs.flexWrap) === 'nowrap') {
              parent.style.flexWrap = 'wrap';
            }
          }
        } catch (_) {}

        if (mount.dataset.open !== '1') {
          mount.dataset.open = '1';
          if (!mount.querySelector('.lia-draw-wrap')) {
            mount.innerHTML = canvasMarkup();
            initAll();
          }
        } else {
          mount.dataset.open = '0';
        }
      }, true);
    }
  }
}
