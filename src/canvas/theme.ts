// Canvas theme: CSS injection, color helpers, icon setters.

export function ensureCss(): void {
  if (document.getElementById('__lia_canvas_ocr_css_v1')) return;

  const st = document.createElement('style');
  st.id = '__lia_canvas_ocr_css_v1';

  st.textContent = `
:root{
  --canvas-border: #000;
  --canvas-pen: #000;
  --canvas-accent: #0b5fff;
}

@media (prefers-color-scheme: dark){
  :root{
    --canvas-border: #fff;
    --canvas-pen: #fff;
  }
}

/* ---------------------------------------------------------
   Canvas Block: KEIN horizontal scroll!
   --------------------------------------------------------- */
.lia-draw-block{
  display: block;
  width: 100%;
  overflow-x: hidden;
  overflow-y: visible;
}

.lia-draw-wrap{
  width: min(520px, 100%);
  border: 2px solid var(--canvas-border);
  border-radius: 10px;
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
  border: 2px solid var(--canvas-border);
  border-radius: 999px;
  cursor: pointer;
  user-select: none;
  display: grid;
  place-items: center;
  background: transparent;
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

.lia-tool-btn[data-active="1"]{
  outline: 2px solid var(--canvas-border);
  outline-offset: 2px;
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
  border-radius: 999px;
  background: transparent;
  border: 2px solid var(--canvas-accent);
  cursor: pointer;
  user-select: none;
  touch-action: manipulation;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  vertical-align: middle;
  line-height: 0;
  margin-right: 6px;
}

.lia-canvas-launch:hover{
  filter: brightness(1.05);
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
  padding: 10px;
  border: 2px solid var(--canvas-border);
  border-radius: 12px;
  background: rgba(0,0,0,0.15);
  backdrop-filter: blur(6px);
  display: none;
  gap: 10px;
}

.lia-tool-menu[data-open="1"]{
  display: grid;
  align-items: start;
  row-gap: 10px;
}

.lia-color-grid{
  display: grid;
  grid-template-columns: repeat(9, 22px);
  gap: 10px;
  align-items: center;
}

.lia-color-item{
  width: 22px;
  height: 22px;
  border-radius: 999px;
  cursor: pointer;
  user-select: none;
  border: 2px solid var(--canvas-border);
  background: transparent;
  box-sizing: border-box;
}

.lia-color-item:hover{
  transform: scale(1.06);
}

.lia-color-item[data-active="1"]{
  outline: 2px solid var(--canvas-border);
  outline-offset: 2px;
}

.lia-tool-heading{
  font-size: 1.5rem;
  font-weight: 750;
  line-height: 1.1;
  padding-left: 2px;
}

.lia-heading-row{
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.lia-heading-row .lia-tool-heading{
  padding-left: 2px;
}

.lia-menu-icon-btn{
  width: 28px;
  height: 28px;
  border-radius: 999px;
  border: 2px solid var(--canvas-border);
  background: transparent;
  display: grid;
  place-items: center;
  cursor: pointer;
  user-select: none;
  padding: 0;
}

.lia-menu-icon-btn:hover{
  filter: brightness(1.08);
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
}

.lia-preview{
  width: 34px;
  height: 22px;
  border-radius: 10px;
  border: 2px solid var(--canvas-border);
  box-sizing: border-box;
  display: grid;
  place-items: center;
}

.lia-preview-line{
  width: 22px;
  border-radius: 999px;
  background: var(--canvas-border);
  height: 3px;
}

.lia-slider{
  width: 180px;
}

.lia-bg-tiles{
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  align-items: stretch;
}

.lia-bg-tile{
  height: 34px;
  border-radius: 12px;
  border: 2px solid var(--canvas-border);
  background: transparent;
  cursor: pointer;
  user-select: none;
  padding: 0;
}

.lia-bg-tile:hover{
  filter: brightness(1.08);
}

.lia-bg-tile[data-active="1"]{
  outline: 2px solid var(--canvas-border);
  outline-offset: 2px;
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
  background: rgba(0,0,0,0.07);
  backdrop-filter: blur(6px);
  box-sizing: border-box;
  flex: 0 0 100%;
  align-self: stretch;
}

@media (prefers-color-scheme: dark){
  .lia-ocrbar{
    background: rgba(255,255,255,0.08);
  }
}

.lia-ocr-head{
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin-right: 6px;
}

.lia-ocr-title{
  font-weight: 850;
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
}

.lia-ocr-pill .v{
  font-weight: 800;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: min(52vw, 520px);
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
  padding: 6px 10px;
  font-weight: 850;
  cursor: pointer;
  user-select: none;
  line-height: 1;
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
  font-size: 0.92em;
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
  width: min(820px, calc(100vw - 20px));
  max-width: calc(100vw - 20px);
  margin: 0;
  padding: 10px 12px;
  border: 2px solid var(--canvas-border);
  border-radius: 14px;
  background: rgba(0,0,0,0.05);
  backdrop-filter: blur(6px);
  box-sizing: border-box;
  pointer-events: none;
}

@media (prefers-color-scheme: dark){
  .lia-ocr-loadwrap{
    background: rgba(255,255,255,0.06);
  }
}

.lia-ocr-loadwrap[data-on="1"]{
  display: block;
}

.lia-ocr-loadmsg{
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  font-weight: 850;
}

.lia-ocr-loadmsg .t{ font-weight: 850; }
.lia-ocr-loadmsg .p{ font-weight: 900; min-width: 3.5em; text-align: right; }

.lia-ocr-loaddetail{
  margin-top: 6px;
  opacity: .78;
  font-weight: 700;
  font-size: 0.95em;
}

.lia-ocr-loadtrack{
  margin-top: 8px;
  height: 10px;
  width: 100%;
  border-radius: 999px;
  border: 2px solid var(--canvas-border);
  overflow: hidden;
  box-sizing: border-box;
  background: transparent;
}

.lia-ocr-loadfill{
  height: 100%;
  width: 0%;
  background: var(--canvas-accent);
}

.lia-ocr-loadwrap[data-indet="1"] .lia-ocr-loadfill{
  width: 35%;
  animation: lia_ocr_indet 1.1s linear infinite;
}

@keyframes lia_ocr_indet{
  0%{ transform: translateX(-120%); }
  100%{ transform: translateX(320%); }
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
  background: rgba(0,0,0,0.10);
  backdrop-filter: blur(6px);
  box-sizing: border-box;
  align-items: center;
  gap: 8px;
}

@media (prefers-color-scheme: dark){
  .lia-rect-progress{
    background: rgba(255,255,255,0.10);
  }
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
  border: 2px solid var(--canvas-accent);
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
    const body = d.body || d.documentElement;
    const existing = d.querySelector('.lia-btn');
    if (existing) {
      const bg = getComputedStyle(existing).backgroundColor;
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
    const bg = getComputedStyle(probe).backgroundColor;
    probe.remove();
    if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') return bg;
  } catch (e) {}
  return null;
}

export function applyThemeVars(): void {
  ensureCss();
  try {
    const doc = (window.parent && window.parent.document) ? window.parent.document : document;
    const root = document.documentElement;
    const bg = getComputedStyle(doc.body || doc.documentElement).backgroundColor
            || getComputedStyle(doc.documentElement).backgroundColor;
    const rgb = parseRgb(bg);
    const isDark = rgb ? (luminance(rgb) < 0.5) : false;
    const border = isDark ? '#fff' : '#000';
    root.style.setProperty('--canvas-border', border);
    root.style.setProperty('--canvas-pen', border);
    const accent = getAccentColor(doc) || getAccentColor(document);
    if (accent) root.style.setProperty('--canvas-accent', accent);
    document.dispatchEvent(new Event('lia-canvas-theme'));
  } catch (e) {}
}

export const COLORS: Array<{ key: string; value: string | null }> = [
  { key: 'auto',       value: null },
  { key: 'red',        value: '#ff0000' },
  { key: 'orange',     value: '#ff7500' },
  { key: 'yellow',     value: '#ffff00' },
  { key: 'violett',    value: '#ff00ff' },
  { key: 'blue',       value: '#0055ff' },
  { key: 'lightblue',  value: '#00ffff' },
  { key: 'green',      value: '#00ff00' },
  { key: 'darkgreen',  value: '#007500' },
  { key: 'black',      value: '#000000' },
  { key: 'white',      value: '#ffffff' },
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
  setSvg(btn, `
    <svg viewBox="0 0 24 24" aria-hidden="true" style="transform: translateX(3px);">
      <path class="ico-stroke" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"
            d="M4.1 4.6 H19.2 Q20.9 4.6 20.9 6.3 V16.0 M17.2 19.8 H4.1 Q2.4 19.8 2.4 18.1 V6.3 Q2.4 4.6 4.1 4.6"/>
      <path class="ico-stroke" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"
        d="M5.2 12.7l1.9 1.9 4.0-4.8"/>
      <path class="ico-stroke" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"
            d="M13.8 9.9c0-2.2 4.8-2.2 4.8 0 0 1.6-2.4 1.8-2.4 3.6"/>
      <circle cx="16.2" cy="16.6" r="0.92" fill="var(--canvas-border)"/>
      <path class="ico-stroke" stroke-width="1.4" stroke-linecap="round"
        d="M19.4 19.0H24.0 M21.7 16.7V21.3"/>
    </svg>
  `);
}

export function setEraserIcon(btn: HTMLElement | null): void {
  setSvg(btn, `
    <svg viewBox="-4 4 24 24" aria-hidden="true">
      <path class="ico-stroke" d="M4 16.5l8.6-8.6a2 2 0 0 1 2.8 0l4.1 4.1a2 2 0 0 1 0 2.8L12.8 23H7.6L4 19.4a2 2 0 0 1 0-2.9z"
            fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path class="ico-stroke" d="M8 23h8" fill="none" stroke-width="2" stroke-linecap="round"/>
      <path class="ico-stroke" d="M9.2 14.3l6.5 6.5" fill="none" stroke-width="2" stroke-linecap="round"/>
    </svg>
  `);
}

export function setUndoIcon(btn: HTMLElement | null): void {
  setSvg(btn, `
    <svg viewBox="-4 0 24 24" aria-hidden="true">
      <path d="M21 8H10.2V4L2 12l8.2 8v-4H21V8z" fill="var(--canvas-border)"/>
      <rect x="10.2" y="10.6" width="10.8" height="2.8" rx="1.4" fill="var(--canvas-border)"/>
    </svg>
  `);
}

export function setRedoIcon(btn: HTMLElement | null): void {
  setSvg(btn, `
    <svg viewBox="-4 0 24 24" aria-hidden="true">
      <path d="M3 8h10.8V4l8.2 8-8.2 8v-4H3V8z" fill="var(--canvas-border)"/>
      <rect x="3" y="10.6" width="10.8" height="2.8" rx="1.4" fill="var(--canvas-border)"/>
    </svg>
  `);
}

export function setTrashIcon(btn: HTMLElement | null): void {
  if (!btn) return;
  btn.innerHTML = `
    <svg viewBox="-1 0 24 24" aria-hidden="true" style="width:22px;height:22px;display:block;">
      <path class="ico-stroke" d="M9 3h6" stroke-width="2" stroke-linecap="round"/>
      <path class="ico-stroke" d="M4 6h16" stroke-width="2" stroke-linecap="round"/>
      <path class="ico-stroke" d="M7 6l1 15h8l1-15" stroke-width="2" stroke-linejoin="round"/>
      <path class="ico-stroke" d="M10 10v8M14 10v8" stroke-width="2" stroke-linecap="round"/>
    </svg>
  `;
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
