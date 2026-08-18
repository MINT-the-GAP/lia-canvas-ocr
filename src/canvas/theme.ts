// Canvas theme: CSS injection, color helpers, icon setters.

import { SVG_RECT, SVG_ERASER, SVG_UNDO, SVG_REDO, SVG_TRASH } from './icons';

export function ensureCss(): void {
  const old = document.getElementById('__lia_canvas_ocr_css_v1');
  if (old && old.parentNode) old.parentNode.removeChild(old);
  if (document.getElementById('__lia_canvas_ocr_css_v2')) return;

    const st = document.createElement('style');
  st.id = '__lia_canvas_ocr_css_v2';

    st.textContent = `
:root{
  --canvas-border: #000;
  --canvas-pen: #000;
  --canvas-accent: #0b5fff;
  --canvas-error: #b3261e;
  --canvas-panel-bg: rgba(255,255,255,0.84);
  --canvas-overlay-soft: rgba(0,0,0,0.10);
}

@media (prefers-color-scheme: dark){
  :root{
    --canvas-border: #fff;
    --canvas-pen: #fff;
    --canvas-error: #ffb4ab;
    --canvas-panel-bg: rgba(22,22,24,0.84);
    --canvas-overlay-soft: rgba(255,255,255,0.10);
  }
}

/* ---------------------------------------------------------
   Canvas Block
   --------------------------------------------------------- */
.lia-draw-block{
  display: block;
  width: 100%;
  overflow-x: hidden;
  overflow-y: visible;
}

.lia-draw-wrap{
  width: min(520px, 100%);
  border: 1.5px solid color-mix(in srgb, var(--canvas-border) 30%, transparent);
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.10);
  box-sizing: border-box;
  position: relative;
  display: block;
  max-width: 100%;
}

canvas.lia-draw{
  width: 100%;
  height: 245px;
  display: block;
  background: transparent;
  touch-action: none;
  cursor: crosshair;
  border-radius: 8px;
}

canvas.lia-canvas-freeze-preview{
  width: 100%;
  height: auto;
  display: block;
  background: transparent;
  border-radius: 8px;
  cursor: default;
  touch-action: auto;
}

.lia-canvas-freeze-empty{
  padding: 12px 14px;
  font-weight: 700;
  opacity: 0.75;
}

.lia-toolstack{
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translate(0, -50%);
  z-index: 25;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.lia-tool-btn{
  width: 32px;
  height: 32px;
  padding: 0;
  border: 1.5px solid color-mix(in srgb, var(--canvas-border) 35%, transparent);
  border-radius: 8px;
  cursor: pointer;
  user-select: none;
  display: grid;
  place-items: center;
  background: color-mix(in srgb, var(--canvas-border) 6%, transparent);
  transition: background 0.12s, border-color 0.12s;
}

.lia-tool-btn:disabled{
  opacity: 0.35;
  cursor: not-allowed;
}

.lia-tool-btn svg{
  width: 22px;
  height: 22px;
  display: block;
  margin: 0;
  transform: translate(0,0);
}

.lia-tool-btn .ico-stroke{
  stroke: var(--canvas-border);
  fill: none;
}

.lia-tool-btn .ico-fill{
  fill: rgba(0,0,0,0);
}

.lia-tool-btn:hover{
  background: color-mix(in srgb, var(--canvas-border) 14%, transparent);
  border-color: color-mix(in srgb, var(--canvas-border) 55%, transparent);
}

.lia-tool-btn[data-active="1"]{
  background: color-mix(in srgb, var(--canvas-border) 18%, transparent);
  border-color: var(--canvas-border);
}

.lia-canvas-anchor{
  display: inline-block;
}

.lia-canvas-mount{
  display: none;
  width: 100%;
  max-width: 100%;
  margin: 6px 0;
  flex: 0 0 100%;
  min-width: 0;
}

.lia-canvas-mount[data-open="1"]{
  display: block;
}

.lia-canvas-launch{
  width: 32px;
  height: 32px;
  padding: 0;
  border-radius: 8px;
  background: color-mix(in srgb, var(--canvas-accent) 12%, transparent);
  border: 1.5px solid color-mix(in srgb, var(--canvas-accent) 60%, transparent);
  cursor: pointer;
  user-select: none;
  touch-action: manipulation;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  vertical-align: middle;
  line-height: 0;
  margin-bottom: 6px;
  transition: background 0.12s, border-color 0.12s;
}

.lia-canvas-launch:hover{
  background: color-mix(in srgb, var(--canvas-accent) 22%, transparent);
  border-color: var(--canvas-accent);
}

.lia-canvas-launch svg{
  width: 18px;
  height: 18px;
  display: block;
}

.lia-canvas-launch .launch-stroke{
  stroke: var(--canvas-accent);
  fill: none;
  stroke-width: 2.4;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.lia-tool-menu{
  position: absolute;
  left: 44px;
  top: 10px;
  z-index: 30;
  padding: 12px 14px;
  border: 1px solid color-mix(in srgb, var(--canvas-border) 18%, transparent);
  border-radius: 14px;
  background: var(--canvas-panel-bg);
  backdrop-filter: blur(20px) saturate(1.4);
  -webkit-backdrop-filter: blur(20px) saturate(1.4);
  box-shadow: 0 8px 32px rgba(0,0,0,0.18), 0 1.5px 4px rgba(0,0,0,0.08);
  display: none;
  gap: 10px;
  font-size: 1rem;
}

.lia-tool-menu[data-open="1"]{
  display: grid;
  align-items: start;
  row-gap: 8px;
}

.lia-color-grid{
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.lia-color-item{
  width: 18px;
  height: 18px;
  border-radius: 5px;
  cursor: pointer;
  user-select: none;
  border: 1.5px solid color-mix(in srgb, var(--canvas-border) 30%, transparent);
  background: transparent;
  box-sizing: border-box;
  transition: transform 0.1s, border-color 0.1s;
}

.lia-color-item:hover{
  transform: scale(1.1);
  border-color: color-mix(in srgb, var(--canvas-border) 60%, transparent);
}

.lia-color-item[data-active="1"]{
  outline: 2px solid var(--canvas-border);
  outline-offset: 2px;
  border-color: var(--canvas-border);
}

.lia-tool-heading{
  font-size: 1.3rem;
  font-weight: 700;
  line-height: 1.1;
  padding-left: 2px;
  opacity: 0.7;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.lia-heading-row{
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding-bottom: 6px;
  border-bottom: 1px solid color-mix(in srgb, var(--canvas-border) 15%, transparent);
  margin-bottom: 2px;
}

.lia-heading-row .lia-tool-heading{
  padding-left: 2px;
}

.lia-menu-icon-btn{
  width: 26px;
  height: 26px;
  border-radius: 6px;
  border: none;
  background: transparent;
  display: grid;
  place-items: center;
  cursor: pointer;
  user-select: none;
  padding: 0;
  opacity: 0.55;
  transition: opacity 0.12s, background 0.12s;
}

.lia-menu-icon-btn:hover{
  opacity: 1;
  background: color-mix(in srgb, var(--canvas-border) 12%, transparent);
}

.lia-menu-icon-btn svg{
  width: 16px;
  height: 16px;
  display: block;
  margin: 0;
}

.lia-menu-icon-btn .ico-stroke{
  stroke: var(--canvas-border);
  fill: none;
}

.lia-menu-icon-btn .ico-fill{
  fill: rgba(0,0,0,0);
}

.lia-row{
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.98rem;
}

.lia-menu-label,
.lia-menu-value{
  font-size: 0.98rem;
}

.lia-preview{
  width: 34px;
  height: 22px;
  border-radius: 6px;
  border: 1.5px solid color-mix(in srgb, var(--canvas-border) 35%, transparent);
  box-sizing: border-box;
  display: grid;
  place-items: center;
  background: color-mix(in srgb, var(--canvas-border) 5%, transparent);
}

.lia-preview-line{
  width: 22px;
  border-radius: 999px;
  background: var(--canvas-border);
  height: 3px;
}

.lia-preview-line--eraser{
  background: transparent;
  border: 1.5px solid var(--canvas-border);
  box-sizing: border-box;
  border-radius: 3px;
}

.lia-slider{
  width: 180px;
  accent-color: var(--canvas-accent);
  font-size: 0.98rem;
}

.lia-bg-tiles{
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  align-items: stretch;
}

.lia-bg-tile{
  height: 34px;
  border-radius: 8px;
  border: 1.5px solid color-mix(in srgb, var(--canvas-border) 30%, transparent);
  background: color-mix(in srgb, var(--canvas-border) 5%, transparent);
  cursor: pointer;
  user-select: none;
  padding: 0;
  transition: background 0.12s, border-color 0.12s;
}

.lia-bg-tile:hover{
  background: color-mix(in srgb, var(--canvas-border) 12%, transparent);
  border-color: color-mix(in srgb, var(--canvas-border) 55%, transparent);
}

.lia-bg-tile[data-active="1"]{
  border-color: var(--canvas-accent);
  box-shadow: inset 0 0 0 1px var(--canvas-accent);
}

.lia-resize-corner{
  position: absolute;
  bottom: 0;
  width: 18px;
  height: 18px;
  z-index: 50;
  background: transparent;
  border: 0;
  padding: 0;
  margin: 0;
  user-select: none;
  touch-action: none;
  opacity: 0;
}

.lia-resize-corner[data-corner="br"]{ right: 0; cursor: nwse-resize; }
.lia-resize-corner[data-corner="bl"]{ left: 0; cursor: nesw-resize; }

.lia-rect-action{
  position: absolute;
  z-index: 60;
  display: none;
  right: auto;
  bottom: auto;
  padding: 6px 9px;
  border-radius: 999px;
  border: 2px solid var(--canvas-accent);
  background: var(--canvas-accent);
  color: #fff;
  font-weight: 800;
  font-size: 0.75em;
  cursor: pointer;
  user-select: none;
  line-height: 1;
  white-space: nowrap;
}

.lia-rect-action:active{
  transform: translateY(1px);
}

.lia-rect-close{
  position: absolute;
  z-index: 61;
  display: none;
  width: 24px;
  height: 24px;
  padding: 0;
  border-radius: 999px;
  border: 2px solid var(--canvas-accent);
  background: transparent;
  cursor: pointer;
  user-select: none;
  line-height: 0;
}

.lia-rect-close svg{
  width: 14px;
  height: 14px;
  display: block;
  margin: auto;
}

.lia-rect-close .x{
  stroke: var(--canvas-accent);
  stroke-width: 2.4;
  stroke-linecap: round;
}

.lia-rect-close:hover{
  background: var(--canvas-accent);
}

.lia-rect-close:hover .x{
  stroke: #fff;
}

.lia-rect-close:active{
  transform: translateY(1px);
}

.lia-eraser-ring{
  position: absolute;
  left: 0;
  top: 0;
  width: 12px;
  height: 12px;
  border-radius: 999px;
  box-sizing: border-box;
  border: 2px solid var(--canvas-accent);
  background: transparent;
  box-shadow: 0 0 0 1px var(--canvas-border);
  pointer-events: none;
  display: none;
  z-index: 58;
  transform: translate(-50%, -50%);
}

.lia-eraser-ring[data-on="1"]{
  display: block;
}

/* OCR */

.lia-ocrbar{
  position: fixed;
  left: 50%;
  transform: translateX(-50%);
  top: 10px;
  z-index: 10000;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  width: min(1100px, calc(100vw - 20px));
  max-width: calc(100vw - 20px);
  padding: 10px 12px;
  margin: 0;
  border: 2px solid var(--canvas-border);
  border-radius: 14px;
  background: var(--canvas-overlay-soft);
  backdrop-filter: blur(6px);
  box-sizing: border-box;
  flex: 0 0 100%;
  align-self: stretch;
  font-size: 1.22rem;
}

.lia-ocr-head{
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin-right: 6px;
}

.lia-ocr-title{
  font-weight: 850;
  font-size: 1.14em;
  letter-spacing: 0.2px;
  line-height: 1;
}

.lia-ocr-dot{
  width: 10px;
  height: 10px;
  border-radius: 999px;
  border: 2px solid var(--canvas-border);
  background: transparent;
  box-sizing: border-box;
}

.lia-ocrbar[data-state="ready"] .lia-ocr-dot,
.lia-ocrbar[data-state="working"] .lia-ocr-dot{
  border-color: var(--canvas-accent);
  background: var(--canvas-accent);
}

.lia-ocrbar[data-state="loading"] .lia-ocr-dot{
  border-color: var(--canvas-accent);
  border-style: dashed;
}

.lia-ocrbar[data-state="error"] .lia-ocr-dot{
  border-color: #c00000;
  background: #c00000;
}

.lia-ocr-pills{
  display: inline-flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  min-width: 0;
}

.lia-ocr-pill{
  display: inline-flex;
  align-items: baseline;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 999px;
  border: 2px solid var(--canvas-border);
  background: transparent;
  max-width: 100%;
}

.lia-ocr-pill .k{
  opacity: 0.75;
  font-weight: 750;
  white-space: nowrap;
  font-size: 1em;
}

.lia-ocr-pill .v{
  font-weight: 800;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: min(52vw, 520px);
  font-size: 1.04em;
}

.lia-ocr-actions{
  display: inline-flex;
  gap: 8px;
  align-items: center;
  margin-left: auto;
}

.lia-ocr-btn,
.lia-ocr-select{
  border: 2px solid var(--canvas-accent);
  background: transparent;
  color: var(--canvas-accent);
  border-radius: 999px;
  padding: 9px 13px;
  font-weight: 850;
  cursor: pointer;
  user-select: none;
  line-height: 1;
  font-size: 1em;
}

.lia-ocr-select{
  appearance: none;
}

.lia-ocr-btn:active,
.lia-ocr-select:active{
  transform: translateY(1px);
}

.lia-ocr-progress{
  display: none;
  align-items: center;
  gap: 8px;
  width: min(420px, 100%);
}

.lia-ocr-progress[data-on="1"]{
  display: inline-flex;
}

.lia-ocr-progbar{
  height: 10px;
  width: 100%;
  border-radius: 999px;
  border: 2px solid var(--canvas-border);
  overflow: hidden;
  box-sizing: border-box;
  background: transparent;
}

.lia-ocr-progfill{
  height: 100%;
  width: 0%;
  background: var(--canvas-accent);
}

.lia-ocr-progtxt{
  font-weight: 850;
  font-size: 1em;
  min-width: 44px;
  text-align: right;
}

.lia-ocr-log{
  display: none;
  width: 100%;
  margin: 6px 0 0 0;
  padding: 10px 12px;
  border-radius: 12px;
  border: 2px solid var(--canvas-border);
  background: transparent;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
  font-size: 1.02em;
  line-height: 1.25;
  white-space: pre-wrap;
  box-sizing: border-box;
}

.lia-ocrbar[data-open="1"] .lia-ocr-log{
  display: block;
}

.lia-tool-btn .ico-accent{
  stroke: var(--canvas-accent);
  fill: none;
}

.lia-tool-btn .ico-accent-fill{
  fill: var(--canvas-accent);
}

.lia-ocr-loadwrap{
  position: fixed;
  left: 50%;
  transform: translateX(-50%);
  top: calc(10px + var(--lia-ocrbar-h, 0px) + var(--lia-ocrbar-gap, 0px));
  z-index: 10001;
  display: none;
  width: min(640px, calc(100vw - 24px));
  max-width: calc(100vw - 24px);
  margin: 0;
  padding: 14px 16px;
  border: 1px solid color-mix(in srgb, var(--canvas-border) 18%, transparent);
  border-radius: 14px;
  background: var(--canvas-panel-bg);
  backdrop-filter: blur(20px) saturate(1.4);
  -webkit-backdrop-filter: blur(20px) saturate(1.4);
  box-shadow: 0 8px 32px rgba(0,0,0,0.18), 0 1.5px 4px rgba(0,0,0,0.08);
  box-sizing: border-box;
  pointer-events: none;
}

.lia-ocr-loadwrap[data-on="1"]{
  display: block;
}

.lia-ocr-loadwrap[data-on="1"][data-indet="0"]:not([data-error="1"]),
.lia-ocr-loadwrap[data-on="1"][data-indet="1"]{
  pointer-events: none;
}

.lia-ocr-loadmsg{
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.lia-ocr-loadmsg .t{
  font-size: 1.6rem;
  font-weight: 600;
  opacity: 0.9;
}

.lia-ocr-loadmsg .p{
  font-size: 1.42rem;
  font-weight: 700;
  min-width: 3em;
  text-align: right;
  opacity: 0.7;
}

.lia-ocr-loaddetail{
  margin-top: 4px;
  opacity: 0.5;
  font-size: 1.3rem;
  font-weight: 500;
}

.lia-ocr-loadtrack{
  margin-top: 10px;
  height: 4px;
  width: 100%;
  border-radius: 999px;
  overflow: hidden;
  box-sizing: border-box;
  background: color-mix(in srgb, var(--canvas-border) 15%, transparent);
}

.lia-ocr-loadfill{
  height: 100%;
  width: 0%;
  border-radius: 999px;
  background: var(--canvas-accent);
  transition: width 0.2s ease;
}

.lia-ocr-loadwrap[data-indet="1"] .lia-ocr-loadfill{
  width: 35%;
  transition: none;
  animation: lia_ocr_indet 1.1s ease-in-out infinite;
}

@keyframes lia_ocr_indet{
  0%{ transform: translateX(-120%); }
  100%{ transform: translateX(320%); }
}

.lia-ocr-loaderror{
  margin-top: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.lia-ocr-loaderror-msg{
  font-size: 1.05rem;
  font-weight: 600;
  color: #c00;
}

.lia-ocr-retry-btn{
  pointer-events: all;
  font-size: 1rem;
  padding: 4px 10px;
}

.lia-rect-progress{
  position: absolute;
  z-index: 59;
  display: none;
  left: 0;
  top: 0;
  width: 180px;
  padding: 4px 8px;
  border-radius: 999px;
  border: 2px solid var(--canvas-border);
  background: var(--canvas-overlay-soft);
  backdrop-filter: blur(6px);
  box-sizing: border-box;
  align-items: center;
  gap: 8px;
}

.lia-rect-progress[data-on="1"]{
  display: flex;
}

.lia-rect-progbar{
  flex: 1 1 auto;
  height: 8px;
  border-radius: 999px;
  border: 2px solid var(--canvas-border);
  overflow: hidden;
  box-sizing: border-box;
  background: transparent;
}

.lia-rect-progfill{
  height: 100%;
  width: 0%;
  background: var(--canvas-accent);
}

.lia-rect-progtxt{
  font-weight: 850;
  font-size: 0.8em;
  min-width: 3.2em;
  text-align: right;
}

.lia-tex-preview{
  display: none;
  align-items: center;
  gap: 8px;
  vertical-align: middle;
  min-height: 2.1em;
  max-width: 100%;
  width: fit-content;
  padding: 4px 10px;
  border: 2px solid var(--lia-tex-preview-border, var(--canvas-accent));
  border-radius: 999px;
  background: transparent;
  cursor: text;
  user-select: none;
  box-sizing: border-box;
}

.lia-tex-preview[data-on="1"]{
  display: inline-flex;
}

.lia-tex-preview-math{
  min-width: 0;
  overflow: visible;
  white-space: nowrap;
  flex: 0 0 auto;
}

.lia-tex-preview-hint{
  font-size: 0.78em;
  font-weight: 800;
  opacity: 0.7;
  white-space: nowrap;
}

.lia-tex-preview[data-on='1'][data-multiline='1']{
  display: inline-grid;
  grid-template-columns: minmax(0, 1fr) auto;
  grid-template-rows: auto auto;
  align-items: start;
  gap: 2px 8px;
  vertical-align: top;
  min-height: 0;
  width: fit-content;
  max-width: 100%;
  padding: 6px 8px 8px;
  border-radius: 12px;
  background: color-mix(in srgb, var(--canvas-panel-bg) 38%, transparent);
  overflow: visible;
}

.lia-tex-preview[data-multiline='1'] .lia-tex-preview-math{
  grid-column: 1 / -1;
  grid-row: 2;
  justify-self: stretch;
  width: 100%;
  min-width: 0;
  max-width: 100%;
  padding: 2px 2px 4px;
  overflow: auto;
  overscroll-behavior-inline: contain;
  scrollbar-width: thin;
  box-sizing: border-box;
}

.lia-tex-preview[data-multiline='1'] .lia-tex-preview-hint{
  grid-column: 2;
  grid-row: 1;
  justify-self: end;
  align-self: start;
  line-height: 1.1;
  padding-inline: 2px;
}

.lia-tex-preview[data-multiline='1'] + .lia-canvas-pair,
.lia-tex-preview[data-multiline='1'] + .lia-canvas-pair > .lia-canvas-anchor,
.lia-tex-preview[data-multiline='1'] + .lia-canvas-pair .lia-canvas-launch,
.lia-canvas-pair[data-lia-preview-multiline='1'],
.lia-canvas-pair[data-lia-preview-multiline='1'] > .lia-canvas-anchor,
.lia-canvas-pair[data-lia-preview-multiline='1'] .lia-canvas-launch{
  vertical-align: top;
}

/* ---------------------------------------------------------
   Multi-line calculation block rendering
   --------------------------------------------------------- */
.lia-canvas-pair[data-canvas-mode='plus'] .lia-rect-action{
  display: none !important;
}

.lia-canvasplus-standalone-controls{
  display: flex;
  flex-wrap: wrap;
  align-items: start;
  gap: 10px 12px;
  width: min(1180px, 100%);
  box-sizing: border-box;
  margin-top: 12px;
}

.lia-canvasplus-submit-stack{
  display: flex;
  flex: 0 0 auto;
  flex-direction: column;
  align-items: flex-start;
  min-width: 0;
  min-height: 44px;
}

.lia-canvasplus-standalone-submit{
  box-sizing: border-box;
  height: 44px;
  min-height: 44px;
  align-self: flex-start;
  margin: 0;
  white-space: nowrap;
}

.lia-canvasplus-standalone-status{
  position: absolute !important;
  width: 1px !important;
  height: 1px !important;
  margin: -1px !important;
  padding: 0 !important;
  overflow: hidden !important;
  clip: rect(0 0 0 0) !important;
  clip-path: inset(50%) !important;
  border: 0 !important;
  white-space: nowrap !important;
}

.lia-canvasplus-standalone-status:empty{
  display: none !important;
}

.lia-canvasplus-standalone-status[data-state=error],
.lia-canvasplus-standalone-status[data-state=error-stale]{
  position: static !important;
  width: auto !important;
  height: auto !important;
  max-width: min(34rem, 100%) !important;
  margin: 6px 0 0 !important;
  overflow: visible !important;
  clip: auto !important;
  clip-path: none !important;
  white-space: normal !important;
  color: var(--canvas-error);
  font-size: 0.9em;
  font-weight: 600;
  line-height: 1.35;
}

.lia-canvasplus-standalone-result{
  flex: 1 1 440px;
  position: relative;
  container: lia-canvasplus-result / inline-size;
  align-self: start;
  width: auto;
  min-width: min(440px, 100%);
  box-sizing: border-box;
  margin-top: 0;
  padding: 0;
  border: 1px solid color-mix(in srgb, var(--canvas-border) 24%, transparent);
  border-radius: 8px;
  color: var(--canvas-border);
  background: color-mix(in srgb, var(--canvas-overlay-soft) 55%, transparent);
  font-size: 16px;
  overflow: visible;
}

.lia-canvasplus-standalone-result[hidden]{
  display: none !important;
}

.lia-canvasplus-standalone-result[data-stale='1']{
  border-style: dashed;
  border-color: color-mix(in srgb, var(--canvas-accent) 70%, var(--canvas-border));
}

.lia-canvasplus-result-toggle{
  display: grid;
  grid-template-columns: 36px minmax(0, 1fr);
  grid-template-rows: 18px 16px;
  align-items: center;
  gap: 2px 10px;
  height: 42px;
  min-height: 42px;
  box-sizing: border-box;
  padding: 3px 10px;
  border-radius: 7px;
  cursor: pointer;
  line-height: 1.3;
  list-style: none;
}

.lia-canvasplus-result-toggle::marker{
  content: '';
  font-size: 0;
}

.lia-canvasplus-result-toggle::-webkit-details-marker{
  display: none;
}

.lia-canvasplus-result-toggle::after{
  display: none !important;
  content: none !important;
}

.lia-canvasplus-result-toggle-indicator{
  grid-column: 1;
  grid-row: 1 / span 2;
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  box-sizing: border-box;
  border: 2px solid var(--canvas-accent);
  border-radius: 8px;
  color: #fff;
  background: var(--canvas-accent);
  box-shadow: 0 2px 7px color-mix(in srgb, var(--canvas-accent) 28%, transparent);
}

.lia-canvasplus-result-toggle-indicator::before{
  width: 0;
  height: 0;
  border-block: 5px solid transparent;
  border-inline-start: 8px solid currentColor;
  content: '';
  transform: translateX(1px);
  transform-origin: 3px 5px;
  transition: transform 140ms ease;
}

.lia-canvasplus-standalone-result[open]
  > .lia-canvasplus-result-toggle
  .lia-canvasplus-result-toggle-indicator::before{
  transform: translateY(-1px) rotate(90deg);
}

.lia-canvasplus-result-toggle:hover{
  background: color-mix(in srgb, var(--canvas-accent) 8%, transparent);
}

.lia-canvasplus-result-toggle:focus-visible{
  outline: 3px solid color-mix(in srgb, var(--canvas-accent) 48%, transparent);
  outline-offset: 3px;
}

.lia-canvasplus-standalone-result[open] > .lia-canvasplus-result-toggle{
  padding-inline-end: 150px;
  border-end-start-radius: 0;
  border-end-end-radius: 0;
  border-bottom: 1px solid color-mix(in srgb, var(--canvas-border) 22%, transparent);
}

.lia-canvasplus-result-content{
  position: static;
  padding: 14px;
}

.lia-canvasplus-standalone-title{
  grid-column: 2;
  grid-row: 1;
  display: block;
  margin: 0;
  min-width: 0;
  overflow: hidden;
  font-size: 16px;
  line-height: 18px;
  font-weight: 650;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.lia-canvasplus-result-header{
  display: none;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  min-height: 42px;
  margin: 0;
  padding: 0;
}

.lia-canvasplus-standalone-result[open]
  > .lia-canvasplus-result-header{
  position: absolute;
  z-index: 5;
  inset-block-start: 0;
  inset-inline-end: 6px;
  display: flex;
  transform: none !important;
}

.lia-canvasplus-edit{
  box-sizing: border-box;
  height: 36px;
  min-height: 36px;
  margin: 0;
  padding: 7px 10px;
  border: 1px solid var(--canvas-accent);
  border-radius: 8px;
  color: var(--canvas-accent);
  background: transparent;
  font: inherit;
  font-size: 15px;
  line-height: 20px;
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;
}

@container lia-canvasplus-result (max-width: 400px){
  .lia-canvasplus-standalone-result[open] > .lia-canvasplus-result-toggle{
    padding-inline-end: 10px;
  }

  .lia-canvasplus-standalone-result[open]
    > .lia-canvasplus-result-header{
    position: static;
    margin: 10px 10px 4px;
  }
}

.lia-canvasplus-edit:disabled{
  opacity: 0.45;
  cursor: not-allowed;
}

.lia-canvasplus-edit:focus-visible{
  outline: 3px solid color-mix(in srgb, var(--canvas-accent) 45%, transparent);
  outline-offset: 2px;
}

.lia-canvasplus-analysis-summary{
  grid-column: 2;
  grid-row: 2;
  display: block;
  min-width: 0;
  min-height: 0;
  margin: 0;
  overflow: hidden;
  font-size: 14px;
  line-height: 16px;
  font-weight: 400;
  opacity: 0.96;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.lia-canvasplus-analysis-summary:empty{
  display: none;
}

.lia-canvasplus-rendered.lia-canvasplus-standalone-math{
  min-height: 96px;
  display: block;
  position: relative;
  overflow: visible;
  padding: 14px 10px;
  font-size: clamp(18px, 2.7vw, 30px);
}

.lia-canvasplus-steps{
  --lia-canvasplus-review-rail: clamp(4.75rem, 13vw, 6.5rem);
  position: relative;
  width: 100%;
  max-width: 760px;
  box-sizing: border-box;
  margin: 0 auto;
  padding: 0 var(--lia-canvasplus-review-rail) 0 0;
  list-style: none;
  overflow: visible;
}

.lia-canvasplus-step{
  margin: 0;
  padding: 0;
}

.lia-canvasplus-step:not(:last-child){
  margin-block-end: 0.55rem;
}

.lia-canvasplus-line{
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr);
  align-items: center;
  gap: 0.35rem;
  min-width: 0;
  min-height: 44px;
  box-sizing: border-box;
  padding: 0.2rem 0.15rem;
  border: 2px solid transparent;
  border-radius: 9px;
  line-height: 1.1;
}

.lia-canvasplus-line-number{
  align-self: center;
  padding: 0;
  color: #374151;
  font: 800 14px/1.2 system-ui, sans-serif;
  text-align: center;
}

.lia-canvasplus-line-equation{
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  align-items: baseline;
  min-width: 0;
  overflow-x: auto;
  overflow-y: hidden;
}

.lia-canvasplus-line-equation[data-has-relation='0']{
  display: block;
  text-align: center;
}

.lia-canvasplus-line-left{
  min-width: max-content;
  justify-self: end;
  padding-left: 4px;
}

.lia-canvasplus-line-right{
  min-width: max-content;
  justify-self: start;
  padding-right: 4px;
}

.lia-canvasplus-line-whole{
  display: inline-block;
}

.lia-canvasplus-line[data-error-side='left'] .lia-canvasplus-line-left,
.lia-canvasplus-line[data-error-side='right'] .lia-canvasplus-line-right,
.lia-canvasplus-line[data-error-side='both'] .lia-canvasplus-line-left,
.lia-canvasplus-line[data-error-side='both'] .lia-canvasplus-line-right,
.lia-canvasplus-line[data-error-side='whole']{
  color: #b42318;
  text-decoration: underline wavy currentColor 2px;
  text-underline-offset: 0.18em;
}

.lia-canvasplus-transition{
  --lia-canvasplus-transition-y: 0px;
  position: absolute;
  z-index: 4;
  inset-inline-end: 0;
  top: var(--lia-canvasplus-transition-y);
  width: var(--lia-canvasplus-review-rail);
  height: 52px;
  display: grid;
  grid-template-columns: minmax(1.75rem, 1fr) 44px;
  align-items: center;
  transform: translateY(-50%);
  pointer-events: none;
  color: #59636e;
}

.lia-canvasplus-transition[data-expanded='1']{
  z-index: 30;
}

.lia-canvasplus-transition-arrow{
  grid-column: 1;
  display: grid;
  place-items: center;
  align-self: stretch;
  pointer-events: none;
}

.lia-canvasplus-transition-arrow svg{
  display: block;
  width: 2.6rem;
  height: 52px;
  overflow: visible;
}

.lia-canvasplus-transition-arrow path{
  fill: none;
  stroke: currentColor;
  stroke-width: 3.2;
  stroke-linecap: round;
  stroke-linejoin: round;
  vector-effect: non-scaling-stroke;
}

.lia-canvasplus-transition-trigger{
  grid-column: 2;
  justify-self: center;
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  min-width: 44px;
  min-height: 44px;
  margin: 0;
  padding: 0;
  border: 0;
  border-radius: 50%;
  color: inherit;
  background: transparent;
  font: 800 1rem/1 system-ui, sans-serif;
  cursor: pointer;
  pointer-events: auto;
}

.lia-canvasplus-transition-trigger:hover:not(:disabled),
.lia-canvasplus-transition[data-expanded='1'] .lia-canvasplus-transition-trigger{
  background: color-mix(in srgb, currentColor 12%, transparent);
}

.lia-canvasplus-transition-trigger:disabled{
  cursor: wait;
  opacity: 0.6;
}

.lia-canvasplus-transition-trigger:focus-visible{
  outline: 3px solid color-mix(in srgb, currentColor 42%, transparent);
  outline-offset: 2px;
}

.lia-canvasplus-transition-icon{
  font-size: 2rem;
  font-weight: 900;
  line-height: 1;
}

.lia-canvasplus-transition-label{
  position: absolute !important;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}

.lia-canvasplus-transition[data-verdict='correct']{
  color: #147a36;
}

.lia-canvasplus-transition[data-verdict='incorrect']{
  color: #b42318;
}

.lia-canvasplus-transition[data-verdict='unknown']{
  color: #8a5a00;
}

.lia-canvasplus-transition[data-stale='1']{
  color: #59636e;
  opacity: 0.64;
}

.lia-canvasplus-transition-detail{
  position: absolute;
  z-index: 3;
  inset-inline-end: 0;
  inset-block-start: calc(100% + 0.2rem);
  width: min(22rem, calc(100vw - 2rem));
  box-sizing: border-box;
  margin: 0;
  padding: 9px 11px;
  border: 2px solid currentColor;
  border-radius: 9px;
  color: light-dark(#222, #f7f7f7);
  background: light-dark(#f4f5f6, #24282c);
  box-shadow: 0 7px 22px rgba(0,0,0,0.2);
  font: 14px/1.4 system-ui, sans-serif;
  text-align: start;
  pointer-events: auto;
}

.lia-canvasplus-transition-detail[hidden]{
  display: none !important;
}

/* Authored calculation quizzes opt into transition feedback explicitly. The
   equation rows stay visible when feedback is disabled. Calculation
   Calculation blocks retain their existing review behaviour. */
.lia-canvas-pair[data-canvas-mode='plus'][data-canvas-output='answer'][data-line-feedback='0']
  .lia-canvasplus-analysis-summary,
.lia-canvas-pair[data-canvas-mode='plus'][data-canvas-output='answer'][data-line-feedback='0']
  .lia-canvasplus-transition{
  display: none !important;
}

.lia-canvas-pair[data-canvas-mode='plus'][data-canvas-output='answer'][data-line-feedback='0']
  .lia-canvasplus-steps{
  --lia-canvasplus-review-rail: 0px;
  padding-inline-end: 0;
}

.lia-canvas-pair[data-canvas-mode='plus'][data-canvas-output='answer'][data-line-feedback='0']
  .lia-canvasplus-line[data-error-side='left'] .lia-canvasplus-line-left,
.lia-canvas-pair[data-canvas-mode='plus'][data-canvas-output='answer'][data-line-feedback='0']
  .lia-canvasplus-line[data-error-side='right'] .lia-canvasplus-line-right,
.lia-canvas-pair[data-canvas-mode='plus'][data-canvas-output='answer'][data-line-feedback='0']
  .lia-canvasplus-line[data-error-side='both'] .lia-canvasplus-line-left,
.lia-canvas-pair[data-canvas-mode='plus'][data-canvas-output='answer'][data-line-feedback='0']
  .lia-canvasplus-line[data-error-side='both'] .lia-canvasplus-line-right,
.lia-canvas-pair[data-canvas-mode='plus'][data-canvas-output='answer'][data-line-feedback='0']
  .lia-canvasplus-line[data-error-side='whole']{
  color: inherit;
  text-decoration: none;
}

/* Frozen calculation feedback is immutable and always expanded. It reuses the
   live semantic class names for accessibility/test stability, but flows below
   the frozen drawing instead of relying on interactive side-rail controls. */
.lia-canvas-freeze-block{
  display: grid;
  gap: 12px;
  width: 100%;
}

.lia-canvas-freeze-calculation-review{
  display: block;
  width: min(760px, 100%);
  min-width: 0;
  margin: 0;
  padding: 12px;
}

.lia-canvas-freeze-review-header{
  display: grid;
  gap: 4px;
  padding: 0 2px 10px;
  border-bottom: 1px solid color-mix(in srgb, var(--canvas-border) 20%, transparent);
}

.lia-canvas-freeze-review-header .lia-canvasplus-standalone-title{
  display: block;
  margin: 0;
  overflow: visible;
  white-space: normal;
}

.lia-canvas-freeze-review-header .lia-canvasplus-analysis-summary{
  display: block;
  margin: 0;
  overflow: visible;
  white-space: normal;
}

.lia-canvas-freeze-calculation-review .lia-canvasplus-result-content{
  padding: 8px 0 0;
}

.lia-canvas-freeze-calculation-review
  .lia-canvasplus-rendered.lia-canvasplus-standalone-math{
  min-height: 0;
  padding: 0;
  font-size: clamp(17px, 2.4vw, 26px);
}

.lia-canvas-freeze-calculation-review .lia-canvasplus-steps{
  --lia-canvasplus-review-rail: 0px;
  width: 100%;
  max-width: 100%;
  padding: 0;
}

.lia-canvas-freeze-calculation-review .lia-canvasplus-step:not(:last-child){
  margin-block-end: 0.7rem;
}

.lia-canvas-freeze-calculation-review .lia-canvasplus-transition{
  position: static;
  inset: auto;
  width: auto;
  height: auto;
  min-height: 42px;
  margin: 0.25rem 0 0.15rem 2rem;
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr);
  gap: 4px 8px;
  align-items: center;
  transform: none;
  pointer-events: none;
}

.lia-canvas-freeze-calculation-review .lia-canvasplus-transition-arrow{
  grid-column: 1;
  grid-row: 1;
  display: block;
  align-self: center;
  font: 800 1.4rem/1 system-ui, sans-serif;
  text-align: center;
}

.lia-canvas-freeze-calculation-review .lia-canvasplus-transition-trigger{
  grid-column: 2;
  grid-row: 1;
  justify-self: start;
  width: auto;
  height: auto;
  min-width: 0;
  min-height: 32px;
  display: inline-grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 7px;
  padding: 3px 7px;
  border-radius: 8px;
  cursor: default;
  pointer-events: none;
}

.lia-canvas-freeze-calculation-review .lia-canvasplus-transition-icon{
  font-size: 1.5rem;
}

.lia-canvas-freeze-calculation-review .lia-canvasplus-transition-label{
  position: static !important;
  width: auto;
  height: auto;
  margin: 0;
  padding: 0;
  overflow: visible;
  clip: auto;
  clip-path: none;
  border: 0;
  white-space: normal;
  font: 650 0.88rem/1.35 system-ui, sans-serif;
}

.lia-canvas-freeze-calculation-review .lia-canvasplus-transition-detail{
  position: static;
  grid-column: 2;
  grid-row: 2;
  inset: auto;
  width: auto;
  max-width: 42rem;
  margin: 0;
  padding: 7px 9px;
  border-width: 1px;
  box-shadow: none;
  pointer-events: none;
}

.lia-canvas-freeze-calculation-review[data-stale='1']
  .lia-canvasplus-transition-detail{
  opacity: 0.72;
}

.lia-canvasplus-inline-editor{
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1.5px solid color-mix(in srgb, var(--canvas-border) 22%, transparent);
}

.lia-canvasplus-inline-editor[hidden]{
  display: none !important;
}

.lia-canvasplus-edit-validation{
  min-height: 1.25em;
  margin: 6px 0 0;
  font-size: 13px;
}

.lia-canvasplus-inline-textarea{
  font-size: 15px;
  line-height: 1.45;
}

.lia-canvasplus-edit-validation[data-state='error']{
  color: #b42318;
  font-weight: 750;
}

.lia-canvasplus-edit-validation[data-state='ready']{
  opacity: 0.72;
}

.lia-canvasplus-edit-validation[data-state='warning']{
  color: #805000;
  color: light-dark(#805000, #ffd166);
  font-weight: 750;
}

.lia-canvasplus-insert-pm{
  border-color: currentColor;
  color: #805000;
  color: light-dark(#805000, #ffd166);
}

.lia-canvasplus-insert-pm[hidden]{
  display: none !important;
}

@media (max-width: 820px){
  .lia-canvasplus-submit-stack,
  .lia-canvasplus-standalone-result{
    flex-basis: 100%;
    width: 100%;
  }

  .lia-canvasplus-standalone-result{
    margin-top: 6px;
  }
}

@media (max-width: 520px){
  .lia-canvasplus-standalone-controls{
    align-items: stretch;
  }

  .lia-canvasplus-standalone-submit{
    width: auto;
  }

  .lia-canvasplus-result-header{
    align-items: flex-start;
    justify-content: flex-end;
  }

  .lia-canvasplus-result-toggle{
    column-gap: 8px;
    padding: 3px 8px;
  }

  .lia-canvasplus-result-content{
    padding: 10px;
  }

  .lia-canvasplus-rendered.lia-canvasplus-standalone-math{
    padding-inline: 4px;
    font-size: clamp(16px, 5vw, 22px);
  }

  .lia-canvasplus-steps{
    --lia-canvasplus-review-rail: 68px;
  }

  .lia-canvasplus-line{
    grid-template-columns: 28px minmax(0, 1fr);
    padding-inline: 0;
  }

  .lia-canvasplus-transition{
    grid-template-columns: minmax(16px, 1fr) 44px;
  }

  .lia-canvasplus-transition-arrow svg{
    width: 1.9rem;
  }

  .lia-canvasplus-transition-detail{
    width: min(18rem, calc(100vw - 1rem));
  }
}

@media (prefers-reduced-motion: reduce){
  .lia-canvasplus-transition-trigger,
  .lia-canvasplus-result-toggle-indicator::before{
    transition: none;
  }
}

@media (forced-colors: active){
  .lia-canvasplus-result-toggle:focus-visible{
    outline-color: Highlight;
  }

  .lia-canvasplus-result-toggle-indicator{
    border-color: ButtonText;
    color: ButtonText;
    background: ButtonFace;
    box-shadow: none;
  }

  .lia-canvasplus-result-toggle::marker,
  .lia-canvasplus-line-number{
    color: CanvasText;
  }

  .lia-canvasplus-edit,
  .lia-canvasplus-line[data-error-side]{
    border-color: currentColor;
  }

  .lia-canvasplus-transition-trigger:focus-visible{
    outline-color: Highlight;
  }

  .lia-canvasplus-transition-detail{
    color: CanvasText;
    background: Canvas;
    box-shadow: none;
  }
}

/* ---------------------------------------------------------
   Experimental calculation recognition handoff (reserved)
   --------------------------------------------------------- */
.lia-canvasplus-overlay{
  position: fixed;
  inset: 0;
  z-index: 2147483000;
  display: grid;
  place-items: center;
  box-sizing: border-box;
  padding: 18px;
  background: rgba(0,0,0,0.58);
  overflow: auto;
}

.lia-canvasplus-dialog{
  width: min(880px, 100%);
  max-height: calc(100vh - 36px);
  max-height: calc(100dvh - 36px);
  overflow: auto;
  box-sizing: border-box;
  padding: clamp(18px, 3vw, 30px);
  border: 2px solid color-mix(in srgb, var(--canvas-border) 35%, transparent);
  border-radius: 18px;
  color: var(--canvas-border);
  background: var(--canvas-panel-bg);
  box-shadow: 0 24px 80px rgba(0,0,0,0.38);
  backdrop-filter: blur(18px);
}

.lia-canvasplus-title{
  margin: 0;
  font-size: clamp(1.35rem, 2.7vw, 1.9rem);
  line-height: 1.2;
}

.lia-canvasplus-description{
  margin: 8px 0 20px;
  opacity: 0.82;
  line-height: 1.45;
}

.lia-canvasplus-meta{
  width: fit-content;
  margin: -10px 0 18px;
  padding: 5px 9px;
  border-radius: 999px;
  color: var(--canvas-accent);
  background: color-mix(in srgb, var(--canvas-accent) 12%, transparent);
  font-size: 0.82rem;
  font-weight: 700;
}

.lia-canvasplus-comparison{
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.lia-canvasplus-panel{
  min-width: 0;
  padding: 14px;
  border: 1.5px solid color-mix(in srgb, var(--canvas-border) 24%, transparent);
  border-radius: 12px;
  background: color-mix(in srgb, var(--canvas-overlay-soft) 55%, transparent);
}

.lia-canvasplus-panel-title{
  margin: 0 0 10px;
  font-size: 0.9rem;
  font-weight: 800;
  opacity: 0.78;
}

.lia-canvasplus-handwriting-frame,
.lia-canvasplus-rendered{
  min-height: 130px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  overflow: auto;
  padding: 12px;
  border-radius: 9px;
  background: #fff;
  color: #111;
}

.lia-canvasplus-handwriting{
  display: block;
  max-width: 100%;
  width: auto;
  height: auto;
  max-height: 220px;
}

.lia-canvasplus-rendered{
  font-size: clamp(1.35rem, 3.4vw, 2.2rem);
  overflow-wrap: anywhere;
}

.lia-canvasplus-rendered[data-empty='1']{
  opacity: 0.45;
}

.lia-canvasplus-editor{
  margin-top: 16px;
}

.lia-canvasplus-label{
  display: block;
  margin-bottom: 7px;
  font-weight: 800;
}

.lia-canvasplus-textarea{
  display: block;
  width: 100%;
  min-height: 5.5em;
  resize: vertical;
  box-sizing: border-box;
  padding: 11px 12px;
  border: 2px solid color-mix(in srgb, var(--canvas-border) 30%, transparent);
  border-radius: 10px;
  color: var(--canvas-border);
  background: color-mix(in srgb, var(--canvas-panel-bg) 85%, transparent);
  font: 1rem/1.45 ui-monospace, SFMono-Regular, Consolas, 'Liberation Mono', monospace;
}

.lia-canvasplus-textarea:focus{
  outline: 3px solid color-mix(in srgb, var(--canvas-accent) 45%, transparent);
  outline-offset: 1px;
  border-color: var(--canvas-accent);
}

.lia-canvasplus-actions{
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 18px;
}

.lia-canvasplus-button{
  min-height: 42px;
  padding: 8px 16px;
  border: 2px solid color-mix(in srgb, var(--canvas-border) 28%, transparent);
  border-radius: 10px;
  color: var(--canvas-border);
  background: transparent;
  font: inherit;
  font-weight: 800;
  cursor: pointer;
}

.lia-canvasplus-accept{
  border-color: var(--canvas-accent);
  color: #fff;
  background: var(--canvas-accent);
}

.lia-canvasplus-button:disabled{
  opacity: 0.45;
  cursor: not-allowed;
}

.lia-canvasplus-button:focus-visible{
  outline: 3px solid color-mix(in srgb, var(--canvas-accent) 45%, transparent);
  outline-offset: 2px;
}

@media (max-width: 680px){
  .lia-canvasplus-overlay{
    padding: 8px;
    align-items: end;
  }

  .lia-canvasplus-dialog{
    max-height: calc(100vh - 8px);
    max-height: calc(100dvh - 8px);
    border-radius: 16px 16px 6px 6px;
  }

  .lia-canvasplus-comparison{
    grid-template-columns: 1fr;
  }

  .lia-canvasplus-handwriting-frame,
  .lia-canvasplus-rendered{
    min-height: 96px;
  }
}
  `;

    (document.head || document.documentElement).appendChild(st);
}


// Parse "rgb(r,g,b)" or "rgba(r,g,b,a)" into [r,g,b]. Returns null on failure.
export function parseRgb(s: string): [number, number, number] | null {
    const m = String(s || '').match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    if (!m) return null;
    return [Number(m[1]), Number(m[2]), Number(m[3])];
}

export function luminance(rgb: [number, number, number]): number {
    const [r, g, b] = rgb.map(v => v / 255).map(c => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// Probe a .lia-btn element to read the LiaScript theme accent color.
// Consolidates getLiaAccentColor and the duplicate __ocrGetLiaAccent.
export function getAccentColor(doc?: Document): string | null {
    try {
        const d = doc || document;
        const view = d.defaultView || window;
        const body = d.body || d.documentElement;
        const existing = d.querySelector('.lia-btn');
        if (existing) {
            const bg = view.getComputedStyle(existing).backgroundColor;
            if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') return bg;
        }
        const probe = d.createElement('button');
        probe.className = 'lia-btn';
        probe.type = 'button';
        probe.textContent = 'x';
        probe.style.position = 'absolute';
        probe.style.left = '-9999px';
        probe.style.top = '-9999px';
        probe.style.visibility = 'hidden';
        body.appendChild(probe);
        const bg = view.getComputedStyle(probe).backgroundColor;
        probe.remove();
        if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') return bg;
    } catch (e) { }
    return null;
}

export function getThemeDocument(): Document {
    try {
        if (window.parent && window.parent !== window && window.parent.document) {
            return window.parent.document;
        }
    } catch (_) { }
    return document;
}

let applyingThemeVars = false;

function setCssVarIfChanged(root: HTMLElement, name: string, value: string): boolean {
    const next = String(value || '').trim();
    if (!next) return false;
    if (root.style.getPropertyValue(name).trim() === next) return false;
    root.style.setProperty(name, next);
    return true;
}

export function applyThemeVars(): boolean {
    if (applyingThemeVars) return false;
    applyingThemeVars = true;
    try {
        ensureCss();
        const doc = getThemeDocument();
        const view = doc.defaultView || window;
        const root = document.documentElement;
        const bg = view.getComputedStyle(doc.body || doc.documentElement).backgroundColor
            || view.getComputedStyle(doc.documentElement).backgroundColor;
        const rgb = parseRgb(bg);
        const isDark = rgb ? (luminance(rgb) < 0.5) : false;
        const border = isDark ? '#fff' : '#000';
        let changed = false;
        changed = setCssVarIfChanged(root, '--canvas-border', border) || changed;
        changed = setCssVarIfChanged(root, '--canvas-pen', border) || changed;
        changed = setCssVarIfChanged(root, '--canvas-panel-bg',
            isDark ? 'rgba(22,22,24,0.84)' : 'rgba(255,255,255,0.84)') || changed;
        changed = setCssVarIfChanged(root, '--canvas-overlay-soft',
            isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)') || changed;
        const accent = getAccentColor(doc) || getAccentColor(document);
        if (accent) changed = setCssVarIfChanged(root, '--canvas-accent', accent) || changed;
        if (changed) document.dispatchEvent(new Event('lia-canvas-theme'));
        return changed;
    } catch (_) {
        return false;
    } finally {
        applyingThemeVars = false;
    }
}

export const COLORS: Array<{ key: string; value: string | null }> = [
    { key: 'auto', value: null },
    { key: 'red', value: '#ff0000' },
    { key: 'orange', value: '#ff7500' },
    { key: 'yellow', value: '#ffff00' },
    { key: 'violett', value: '#ff00ff' },
    { key: 'blue', value: '#0055ff' },
    { key: 'lightblue', value: '#00ffff' },
    { key: 'green', value: '#00ff00' },
    { key: 'darkgreen', value: '#007500' },
    { key: 'black', value: '#000000' },
    { key: 'white', value: '#ffffff' },
];

export function getAutoPen(): string {
    return getComputedStyle(document.documentElement).getPropertyValue('--canvas-pen').trim() || '#000';
}

export function getBorderColor(): string {
    return getComputedStyle(document.documentElement).getPropertyValue('--canvas-border').trim() || '#000';
}

// Read the --canvas-accent CSS variable (already applied by applyThemeVars).
export function getAccentCssVar(): string {
    return getComputedStyle(document.documentElement).getPropertyValue('--canvas-accent').trim() || getBorderColor();
}

export function setSvg(btn: HTMLElement | null, svg: string): void {
    if (!btn) return;
    if ((btn as any).__hasIcon) return;
    (btn as any).__hasIcon = true;
    btn.innerHTML = svg;
}

export function setRectIcon(btn: HTMLElement | null): void {
    setSvg(btn, SVG_RECT);
}

export function setEraserIcon(btn: HTMLElement | null): void {
    setSvg(btn, SVG_ERASER);
}

export function setUndoIcon(btn: HTMLElement | null): void {
    setSvg(btn, SVG_UNDO);
}

export function setRedoIcon(btn: HTMLElement | null): void {
    setSvg(btn, SVG_REDO);
}

export function setTrashIcon(btn: HTMLElement | null): void {
    setSvg(btn, SVG_TRASH);
}

// Convert any color string to rgba(r,g,b,a).
export function rgbaFromAny(color: string, a: number): string {
    const rgb = parseRgb(color);
    if (rgb) return `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${a})`;
    if (String(color).startsWith('#')) {
        const h = String(color).slice(1);
        const hex = (h.length === 3) ? (h[0] + h[0] + h[1] + h[1] + h[2] + h[2]) : h;
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);
        return `rgba(${r},${g},${b},${a})`;
    }
    return `rgba(0,0,0,${a})`;
}
