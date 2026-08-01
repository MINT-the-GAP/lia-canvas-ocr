// Boot module: registry, theme sync, OCR bar, engine, canvas init.

// ---------------------------------------------------------------------------
// Root window helper
// ---------------------------------------------------------------------------

export function getRootWindow(): Window {
  let w: Window = window;
  try { while (w.parent && w.parent !== w) w = w.parent as Window; } catch (_) { }
  return w;
}

// ---------------------------------------------------------------------------
// LIA registry — must be declared before any import side-effects run.
// Other modules import LIA from here; they must not access it at module
// evaluation time (only inside functions called after boot).
// ---------------------------------------------------------------------------

export const LIA: any = (window as any).__LIA_CANVAS_OCR__ = (window as any).__LIA_CANVAS_OCR__ || {
  SHOW_BAR: false,
  bar: null,
  ocr: null,
  tfjs: null,
  tfjsLoad: null,
  store: {},
  uidSeq: 0,
  freeze: {},
  barBoot: false,
  canvasBoot: false,
  launcherBound: false,
};

// ---------------------------------------------------------------------------
// Deferred imports — placed after LIA so the circular reference is safe.
// These modules import LIA, but only use it inside functions, never at the
// top level, so by the time those functions run LIA is already initialized.
// ---------------------------------------------------------------------------

import { ensureOcrBar } from './ocr/bar';
import { ensureOcrEngine } from './ocr/engine';
import { applyThemeVars, getThemeDocument } from './canvas/theme';
import { ensureCanvasFreezeApi } from './canvas/freeze';
import { initAll, canvasMarkup } from './canvas/index';

const CANVAS_PAIR_SELECTOR = '.lia-canvas-pair';
const THEME_ATTRIBUTES = ['class', 'style', 'data-theme', 'data-color-scheme'];

let discoveryObserver: MutationObserver | null = null;
let themeObserver: MutationObserver | null = null;
let themeSyncFrame = 0;
let themeSyncRunning = false;

// ---------------------------------------------------------------------------
// Single registry — guards against double-init across iframes
// ---------------------------------------------------------------------------

const ROOT = getRootWindow() as any;
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
  if (document.querySelector(CANVAS_PAIR_SELECTOR)) {
    startCanvasRuntime();
    return;
  }

  if (LIA.discoveryBoot) return;
  LIA.discoveryBoot = true;

  const root = document.body || document.documentElement;
  discoveryObserver = new MutationObserver((records) => {
    for (const record of records) {
      for (const node of Array.from(record.addedNodes)) {
        if (nodeContainsCanvasPair(node)) {
          startCanvasRuntime();
          return;
        }
      }
    }
  });
  discoveryObserver.observe(root, { childList: true, subtree: true });
  LIA.discoveryObserver = discoveryObserver;

  // Close the query/observe race without polling.
  if (document.querySelector(CANVAS_PAIR_SELECTOR)) startCanvasRuntime();
}

function nodeContainsCanvasPair(node: Node): boolean {
  if (node.nodeType !== Node.ELEMENT_NODE) return false;
  const el = node as Element;
  return el.matches(CANVAS_PAIR_SELECTOR) || !!el.querySelector(CANVAS_PAIR_SELECTOR);
}

function startCanvasRuntime(): void {
  if (LIA.canvasBoot) return;
  LIA.canvasBoot = true;
  LIA.uidSeq = LIA.uidSeq || 0;

  if (discoveryObserver) {
    discoveryObserver.disconnect();
    discoveryObserver = null;
  }
  if (LIA.discoveryObserver) {
    try { LIA.discoveryObserver.disconnect(); } catch (_) { }
    LIA.discoveryObserver = null;
  }

  if (!LIA.barBoot) {
    LIA.barBoot = true;
    ensureOcrBar();
  }

  installThemeSync();
  ensureOcrEngine();
  ensureCanvasFreezeApi();
  initAll();
  bindLauncher();
}

function observeThemeSources(): void {
  if (!themeObserver) return;
  const sourceDoc = getThemeDocument();
  const options: MutationObserverInit = {
    attributes: true,
    attributeFilter: THEME_ATTRIBUTES,
  };
  const targets = [sourceDoc.documentElement, sourceDoc.body].filter(
    (target, index, all): target is HTMLElement => !!target && all.indexOf(target) === index
  );
  for (const target of targets) {
    try { themeObserver.observe(target, options); } catch (_) { }
  }
}

function runThemeSync(): void {
  if (themeSyncRunning) return;
  themeSyncRunning = true;
  if (themeObserver) themeObserver.disconnect();
  try {
    applyThemeVars();
  } finally {
    if (themeObserver) themeObserver.takeRecords();
    observeThemeSources();
    themeSyncRunning = false;
  }
}

function queueThemeSync(): void {
  if (themeSyncFrame) return;
  themeSyncFrame = requestAnimationFrame(() => {
    themeSyncFrame = 0;
    runThemeSync();
  });
}

function installThemeSync(): void {
  if (LIA.themeBoot) return;
  LIA.themeBoot = true;
  themeObserver = new MutationObserver(() => queueThemeSync());
  LIA.themeObserver = themeObserver;
  runThemeSync();

  try {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    if (typeof media.addEventListener === 'function') media.addEventListener('change', queueThemeSync);
    else if (typeof media.addListener === 'function') media.addListener(queueThemeSync);
  } catch (_) { }
  window.addEventListener('resize', queueThemeSync, { passive: true });
}

function bindLauncher(): void {
  if (LIA.launcherBound) return;
  LIA.launcherBound = true;

  document.addEventListener('click', (e: MouseEvent) => {
    const btn = (e.target as Element)?.closest?.('.lia-canvas-launch') as HTMLElement | null;
    if (!btn) return;

    const pair = btn.closest('.lia-canvas-pair') as HTMLElement | null;
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
    } catch (_) { }

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
