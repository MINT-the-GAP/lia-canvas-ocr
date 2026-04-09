// Canvas: markup, setup, init, launcher.

import { LIA } from '../index';
import {
    COLORS, getAutoPen, getAccentCssVar, rgbaFromAny,
    setUndoIcon, setRedoIcon, setEraserIcon, setRectIcon
} from './theme';
import { ensureMountUID, __liaDispatchCanvasFreezeChange } from './store';
export { ensureCanvasFreezeApi } from './freeze';
import { __liaFindAndSetInputBeforeNode, __liaInitTexPreviews } from '../lia/input';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CANVAS_DEFAULT_H = 245;   // px — matches CSS canvas.lia-draw initial height
const CANVAS_MIN_H = 130;   // px — minimum canvas height when resizing
const CANVAS_MAX_H = 9000;  // px — maximum canvas height when resizing
const CANVAS_MIN_W = 200;   // px — minimum canvas width when resizing

const OCR_MIN_SIDE = 420;   // px — minimum side length for OCR normalization
const OCR_MAX_SIDE = 1400;  // px — maximum side length for OCR normalization
const OCR_BINARIZE_THR = 200;   // luminance threshold (0–255) for binarization

// ---------------------------------------------------------------------------
// Markup
// ---------------------------------------------------------------------------

export function canvasMarkup(): string {
    return `
    <span class="lia-draw-block">
      <span class="lia-draw-wrap">
        <span class="lia-toolstack">
          <button class="lia-tool-btn lia-undo-btn"   type="button" aria-label="Undo"></button>
          <button class="lia-tool-btn lia-redo-btn"   type="button" aria-label="Redo"></button>
          <button class="lia-tool-btn lia-eraser-btn" type="button" aria-label="Eraser"></button>
          <button class="lia-tool-btn lia-color-btn"  type="button" aria-label="Pen"></button>
          <button class="lia-tool-btn lia-bgmenu-btn" type="button" aria-label="Background"></button>
          <button class="lia-tool-btn lia-rect-btn"   type="button" aria-label="Select & Submit"></button>
        </span>

        <span class="lia-tool-menu" data-open="0" aria-label="Werkzeuge"></span>
        <canvas class="lia-draw" aria-label="Drawing area"></canvas>
      </span>
    </span>
  `;
}

// ---------------------------------------------------------------------------
// setupCanvas
// ---------------------------------------------------------------------------

function setupCanvas(canvas: HTMLCanvasElement): void {
    const wrap = canvas.closest('.lia-draw-wrap') as HTMLElement | null;
    if (!wrap) return;

    const mount = wrap.closest('.lia-canvas-mount') as HTMLElement | null;
    const uid = ensureMountUID(mount);

    const btnUndo = wrap.querySelector('.lia-undo-btn') as HTMLButtonElement | null;
    const btnRedo = wrap.querySelector('.lia-redo-btn') as HTMLButtonElement | null;
    const btnColor = wrap.querySelector('.lia-color-btn') as HTMLButtonElement | null;
    const btnEraser = wrap.querySelector('.lia-eraser-btn') as HTMLButtonElement | null;
    const btnRect = wrap.querySelector('.lia-rect-btn') as HTMLButtonElement | null;
    const btnBg = wrap.querySelector('.lia-bgmenu-btn') as HTMLButtonElement | null;
    const menu = wrap.querySelector('.lia-tool-menu') as HTMLElement | null;

    // Action button
    const rectActionBtn = document.createElement('button');
    rectActionBtn.type = 'button';
    rectActionBtn.className = 'lia-rect-action';
    rectActionBtn.textContent = 'Select & Submit';
    rectActionBtn.style.display = 'none';
    wrap.appendChild(rectActionBtn);

    // Progress bar
    const rectProg = document.createElement('div');
    rectProg.className = 'lia-rect-progress';
    rectProg.dataset.on = '0';
    rectProg.innerHTML = `
    <div class="lia-rect-progbar"><div class="lia-rect-progfill"></div></div>
    <div class="lia-rect-progtxt">0%</div>
  `;
    wrap.appendChild(rectProg);

    const rectProgFill = rectProg.querySelector('.lia-rect-progfill') as HTMLElement | null;
    const rectProgTxt = rectProg.querySelector('.lia-rect-progtxt') as HTMLElement | null;

    rectProg.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); });
    rectActionBtn.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); });

    // Close button
    const rectCloseBtn = document.createElement('button');
    rectCloseBtn.type = 'button';
    rectCloseBtn.className = 'lia-rect-close';
    rectCloseBtn.setAttribute('aria-label', 'Marker-Rechteck entfernen');
    rectCloseBtn.style.display = 'none';
    rectCloseBtn.innerHTML = `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 7L17 17M17 7L7 17" fill="none" stroke="currentColor"
            stroke-width="2.4" stroke-linecap="round"/>
    </svg>
  `;
    wrap.appendChild(rectCloseBtn);

    // Eraser ring
    const eraserRing = document.createElement('span');
    eraserRing.className = 'lia-eraser-ring';
    eraserRing.dataset.on = '0';
    wrap.appendChild(eraserRing);

    rectCloseBtn.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); });
    rectCloseBtn.addEventListener('click', (e) => {
        e.preventDefault(); e.stopPropagation();
        clearMarkerRect();
    });

    setUndoIcon(btnUndo);
    setRedoIcon(btnRedo);
    setEraserIcon(btnEraser);
    setRectIcon(btnRect);
    if (btnBg && !(btnBg as any).__bgCleared) { (btnBg as any).__bgCleared = true; btnBg.innerHTML = ''; }

    const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
    const hiLayer = document.createElement('canvas');
    const hctx = hiLayer.getContext('2d', { willReadFrequently: true })!;
    const strokeLayer = document.createElement('canvas');
    const sctx = strokeLayer.getContext('2d', { willReadFrequently: true })!;

    const STORE = LIA.store as Record<string, any>;
    const saved = (uid && STORE[uid]) ? STORE[uid] : null;

    const VIEW = saved && saved.VIEW
        ? { ...saved.VIEW }
        : { panX: 0, panY: 0, scale: 1, minScale: 0.25, maxScale: 8 };

    let __liaCanvasFreezeNotifyTimer = 0;
    let __liaCanvasFreezeNotifyArmed = false;

    function scheduleCanvasFreezeNotify(reason: string): void {
        if (!uid) return;
        if (!__liaCanvasFreezeNotifyArmed) return;
        clearTimeout(__liaCanvasFreezeNotifyTimer);
        __liaCanvasFreezeNotifyTimer = setTimeout(() => {
            __liaDispatchCanvasFreezeChange({
                uid,
                reason: String(reason || 'persist'),
                hasItems: (Array.isArray(ITEMS) && ITEMS.length > 0) ? 1 : 0
            });
        }, 120) as unknown as number;
    }

    // ---- OCR closures ----

    function __ocrLog(msg: string): void {
        try { const b = LIA.bar; if (b && b.log) b.log(msg); } catch (_) { }
    }

    function __ocrSquashWS(str: string): string {
        const s = String(str || '');
        let out = '', was = false;
        for (let i = 0; i < s.length; i++) {
            const ch = s[i];
            const isWS = (ch === ' ' || ch === '\n' || ch === '\r' || ch === '\t' || ch === '\f');
            if (isWS) { if (!was) out += ' '; was = true; } else { out += ch; was = false; }
        }
        return out.trim();
    }

    function __ocrCleanLatex(s: string): string {
        let t = String(s || '').trim();
        if (t.startsWith('$$') && t.endsWith('$$')) t = t.slice(2, -2).trim();
        if (t.startsWith('$') && t.endsWith('$')) t = t.slice(1, -1).trim();
        if (t.startsWith('\\[') && t.endsWith('\\]')) t = t.slice(2, -2).trim();
        return __ocrSquashWS(t);
    }

    function __ocrUnwrapRoman(t: string): string {
        let s = String(t || '').trim();
        const pre = '\\mathrm{';
        if (s.startsWith(pre) && s.endsWith('}')) {
            s = s.slice(pre.length, -1);
            let out = '';
            for (let i = 0; i < s.length; i++) { if (s[i] !== '~') out += s[i]; }
            return out.trim();
        }
        return s;
    }

    function __ocrCropFromRect(rectItem: any): HTMLCanvasElement | null {
        if (!rectItem) return null;
        const dpr = window.devicePixelRatio || 1;
        const x0w = Math.min(rectItem.x0, rectItem.x1), y0w = Math.min(rectItem.y0, rectItem.y1);
        const x1w = Math.max(rectItem.x0, rectItem.x1), y1w = Math.max(rectItem.y0, rectItem.y1);
        const A = worldToScreen(x0w, y0w), B = worldToScreen(x1w, y1w);
        let sx0 = clamp(Math.min(A.sx, B.sx), 0, canvas.clientWidth);
        let sy0 = clamp(Math.min(A.sy, B.sy), 0, canvas.clientHeight);
        let sx1 = clamp(Math.max(A.sx, B.sx), 0, canvas.clientWidth);
        let sy1 = clamp(Math.max(A.sy, B.sy), 0, canvas.clientHeight);
        const wCss = sx1 - sx0, hCss = sy1 - sy0;
        if (wCss < 6 || hCss < 6) return null;
        const padCss = 12;
        const srcX = Math.round((sx0 - padCss) * dpr), srcY = Math.round((sy0 - padCss) * dpr);
        const srcW = Math.round((wCss + 2 * padCss) * dpr), srcH = Math.round((hCss + 2 * padCss) * dpr);
        const out = document.createElement('canvas');
        out.width = Math.max(1, srcW); out.height = Math.max(1, srcH);
        const octx = out.getContext('2d', { willReadFrequently: true })!;
        octx.setTransform(1, 0, 0, 1, 0, 0);
        octx.globalCompositeOperation = 'source-over';
        octx.globalAlpha = 1.0;
        octx.clearRect(0, 0, out.width, out.height);
        const SRCW = strokeLayer.width, SRCH = strokeLayer.height;
        let sX = srcX, sY = srcY, sW = srcW, sH = srcH;
        let dX = 0, dY = 0, dW = out.width, dH = out.height;
        if (sX < 0) { const f = (-sX) / sW; dX += dW * f; dW -= dW * f; sW += sX; sX = 0; }
        if (sY < 0) { const f = (-sY) / sH; dY += dH * f; dH -= dH * f; sH += sY; sY = 0; }
        if (sX + sW > SRCW) { const o = (sX + sW) - SRCW; dW -= dW * (o / sW); sW -= o; }
        if (sY + sH > SRCH) { const o = (sY + sH) - SRCH; dH -= dH * (o / sH); sH -= o; }
        if (sW <= 1 || sH <= 1 || dW <= 1 || dH <= 1) return null;
        octx.drawImage(strokeLayer, sX, sY, sW, sH, dX, dY, dW, dH);
        const img = octx.getImageData(0, 0, out.width, out.height);
        const data = img.data;
        for (let i = 0; i < data.length; i += 4) {
            if (data[i + 3] > 10) { data[i] = 0; data[i + 1] = 0; data[i + 2] = 0; data[i + 3] = 255; }
            else { data[i] = 255; data[i + 1] = 255; data[i + 2] = 255; data[i + 3] = 255; }
        }
        octx.putImageData(img, 0, 0);
        return out;
    }

    function __ocrNormalizeSize(c: HTMLCanvasElement): HTMLCanvasElement {
        const maxSide = Math.max(c.width, c.height);
        let scale = 1;
        if (maxSide < OCR_MIN_SIDE) scale = OCR_MIN_SIDE / maxSide;
        if (maxSide > OCR_MAX_SIDE) scale = OCR_MAX_SIDE / maxSide;
        scale = clamp(scale, 0.5, 4.0);
        if (Math.abs(scale - 1) < 0.06) return c;
        const out = document.createElement('canvas');
        out.width = Math.max(1, Math.round(c.width * scale));
        out.height = Math.max(1, Math.round(c.height * scale));
        const x = out.getContext('2d', { willReadFrequently: true })!;
        x.fillStyle = '#fff'; x.fillRect(0, 0, out.width, out.height);
        x.drawImage(c, 0, 0, out.width, out.height);
        return out;
    }

    function __ocrPreprocessCanvas(src: HTMLCanvasElement): HTMLCanvasElement {
        const c0 = document.createElement('canvas');
        c0.width = Math.max(1, src.width | 0); c0.height = Math.max(1, src.height | 0);
        const x0 = c0.getContext('2d', { willReadFrequently: true })!;
        x0.fillStyle = '#fff'; x0.fillRect(0, 0, c0.width, c0.height); x0.drawImage(src, 0, 0);
        const img = x0.getImageData(0, 0, c0.width, c0.height);
        const d = img.data, W = c0.width, H = c0.height;
        const thr = OCR_BINARIZE_THR;
        const bin = new Uint8Array(W * H);
        for (let i = 0, p = 0; p < bin.length; p++, i += 4) {
            bin[p] = ((d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114) < thr) ? 1 : 0;
        }
        function dilateOnce(srcBin: Uint8Array<ArrayBuffer>): Uint8Array<ArrayBuffer> {
            const out = new Uint8Array(W * H) as Uint8Array<ArrayBuffer>;
            for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
                const idx = y * W + x; let on = 0;
                for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
                    if (srcBin[idx + dy * W + dx]) { on = 1; dy = 2; break; }
                }
                out[idx] = on;
            }
            return out;
        }
        let b2: Uint8Array<ArrayBuffer> = bin as Uint8Array<ArrayBuffer>;
        const DILATE_ITERS = 0;
        for (let k = 0; k < DILATE_ITERS; k++) b2 = dilateOnce(b2);
        let xMin = W, yMin = H, xMax = -1, yMax = -1;
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
            if (!b2[y * W + x]) continue;
            if (x < xMin) xMin = x; if (y < yMin) yMin = y;
            if (x > xMax) xMax = x; if (y > yMax) yMax = y;
        }
        if (xMax < 0) return c0;
        const pad = 18;
        xMin = Math.max(0, xMin - pad); yMin = Math.max(0, yMin - pad);
        xMax = Math.min(W - 1, xMax + pad); yMax = Math.min(H - 1, yMax + pad);
        const cw = Math.max(1, xMax - xMin + 1), ch = Math.max(1, yMax - yMin + 1);
        const c1 = document.createElement('canvas'); c1.width = cw; c1.height = ch;
        const x1 = c1.getContext('2d', { willReadFrequently: true })!;
        const out1 = x1.createImageData(cw, ch);
        const od = out1.data;
        for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) {
            const v = b2[(yMin + y) * W + (xMin + x)] ? 0 : 255;
            const i = (y * cw + x) * 4;
            od[i] = v; od[i + 1] = v; od[i + 2] = v; od[i + 3] = 255;
        }
        x1.putImageData(out1, 0, 0);
        const target = 512, m = Math.max(cw, ch);
        let scale = target / m;
        if (scale < 0.75) scale = 0.75; if (scale > 3.5) scale = 3.5;
        const c2 = document.createElement('canvas');
        c2.width = Math.max(1, Math.round(cw * scale)); c2.height = Math.max(1, Math.round(ch * scale));
        const x2 = c2.getContext('2d', { willReadFrequently: true })!;
        x2.fillStyle = '#fff'; x2.fillRect(0, 0, c2.width, c2.height);
        x2.imageSmoothingEnabled = true; x2.drawImage(c1, 0, 0, c2.width, c2.height);
        return c2;
    }

    function __ocrPreprocessDigitCanvas(src: HTMLCanvasElement, opts: any): HTMLCanvasElement {
        const o = (opts && typeof opts === 'object') ? opts : {};
        const dilate = (o.dilate === 1) ? 1 : 0;
        const c0 = document.createElement('canvas');
        c0.width = Math.max(1, src.width | 0); c0.height = Math.max(1, src.height | 0);
        const x0 = c0.getContext('2d', { willReadFrequently: true })!;
        x0.fillStyle = '#fff'; x0.fillRect(0, 0, c0.width, c0.height); x0.drawImage(src, 0, 0);
        const img = x0.getImageData(0, 0, c0.width, c0.height);
        const d = img.data, W = c0.width, H = c0.height;
        const thr = 225;
        let bin: Uint8Array<ArrayBuffer> = new Uint8Array(W * H);
        for (let i = 0, p = 0; p < bin.length; p++, i += 4) {
            bin[p] = ((d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114) < thr) ? 1 : 0;
        }
        function dilateOnce(srcBin: Uint8Array<ArrayBuffer>): Uint8Array<ArrayBuffer> {
            const out = new Uint8Array(W * H) as Uint8Array<ArrayBuffer>;
            for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
                const idx = y * W + x; let on = 0;
                for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
                    if (srcBin[idx + dy * W + dx]) { on = 1; dy = 2; break; }
                }
                out[idx] = on;
            }
            return out;
        }
        if (dilate === 1) bin = dilateOnce(bin as Uint8Array<ArrayBuffer>);
        let xMin = W, yMin = H, xMax = -1, yMax = -1;
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
            if (!bin[y * W + x]) continue;
            if (x < xMin) xMin = x; if (y < yMin) yMin = y;
            if (x > xMax) xMax = x; if (y > yMax) yMax = y;
        }
        if (xMax < 0) return __ocrPreprocessCanvas(src);
        const cw = Math.max(1, xMax - xMin + 1), ch = Math.max(1, yMax - yMin + 1);
        const pad = Math.max(24, Math.floor(Math.max(cw, ch) * 0.35));
        const side = Math.max(64, Math.min(1024, Math.max(cw, ch) + 2 * pad));
        const c1 = document.createElement('canvas'); c1.width = side; c1.height = side;
        const x1 = c1.getContext('2d', { willReadFrequently: true })!;
        const out1 = x1.createImageData(side, side); const od = out1.data;
        for (let i = 0; i < od.length; i += 4) { od[i] = 255; od[i + 1] = 255; od[i + 2] = 255; od[i + 3] = 255; }
        const offX = Math.floor((side - cw) / 2), offY = Math.floor((side - ch) / 2);
        for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) {
            const v = bin[(yMin + y) * W + (xMin + x)] ? 0 : 255;
            const i = ((offY + y) * side + (offX + x)) * 4;
            od[i] = v; od[i + 1] = v; od[i + 2] = v; od[i + 3] = 255;
        }
        x1.putImageData(out1, 0, 0);
        const c2 = document.createElement('canvas'); c2.width = 512; c2.height = 512;
        const x2 = c2.getContext('2d', { willReadFrequently: true })!;
        x2.fillStyle = '#fff'; x2.fillRect(0, 0, 512, 512);
        x2.imageSmoothingEnabled = false; x2.drawImage(c1, 0, 0, 512, 512);
        return c2;
    }

    function __ocrRotateCanvas(src: HTMLCanvasElement, deg: number): HTMLCanvasElement {
        const rad = deg * Math.PI / 180, w = src.width | 0, h = src.height | 0;
        const out = document.createElement('canvas'); out.width = Math.max(1, w); out.height = Math.max(1, h);
        const x = out.getContext('2d', { willReadFrequently: true })!;
        x.fillStyle = '#fff'; x.fillRect(0, 0, out.width, out.height);
        x.translate(out.width / 2, out.height / 2); x.rotate(rad); x.translate(-w / 2, -h / 2);
        x.imageSmoothingEnabled = false; x.drawImage(src, 0, 0);
        return out;
    }

    function __ocrFixDigitsIfPossible(s: string): string | null {
        const t = String(s || '').trim(); if (!t) return null;
        let allDigits = true;
        for (let i = 0; i < t.length; i++) { const c = t.charCodeAt(i); if (c < 48 || c > 57) { allDigits = false; break; } }
        if (allDigits) return t;
        const low = t.toLowerCase();
        if (low === 'li' || low === 'l1' || low === 'il') return '4';
        if (low === 'go' || low === 'g0' || low === 'qo' || low === 'q0') return '8';
        const map: Record<string, string> = { 'O': '0', 'o': '0', 'Q': '0', 'I': '1', 'l': '1', '|': '1', '!': '1', 'Z': '2', 'z': '2', 'J': '3', 'j': '3', 'H': '4', 'h': '4', 'S': '5', 's': '5', 'B': '8', 'g': '9', 'q': '9' };
        let out = '';
        for (let i = 0; i < t.length; i++) { const ch = t[i]; if (map[ch]) out += map[ch]; else return null; }
        return out || null;
    }

    function __ocrIsAllDigits(s: string): boolean {
        const t = String(s || '').trim(); if (!t) return false;
        for (let i = 0; i < t.length; i++) { const c = t.charCodeAt(i); if (c < 48 || c > 57) return false; }
        return true;
    }

    function __ocrMathLooksIncomplete(s: string): boolean {
        const t = String(s || '').trim(); if (!t) return true;
        if (/[+\-*/=,:;\\]$/.test(t)) return true;
        if (/[{[(]$/.test(t)) return true;
        let curly = 0, square = 0, round = 0, escaped = false;
        for (let i = 0; i < t.length; i++) {
            const ch = t[i];
            if (escaped) { escaped = false; continue; }
            if (ch === '\\') { escaped = true; continue; }
            if (ch === '{') curly++; else if (ch === '}') curly--;
            else if (ch === '[') square++; else if (ch === ']') square--;
            else if (ch === '(') round++; else if (ch === ')') round--;
        }
        return curly !== 0 || square !== 0 || round !== 0;
    }

    function __ocrShouldPreferDigits(ink: any, crop: HTMLCanvasElement): boolean {
        if (!ink || !crop) return false;
        const cropW = Math.max(1, crop.width | 0), cropH = Math.max(1, crop.height | 0);
        const w = Math.max(1, ink.w | 0), h = Math.max(1, ink.h | 0);
        const longSide = Math.max(w, h), shortSide = Math.min(w, h);
        const ar = w / Math.max(1, h);
        const fill = (Number(ink.black || 0) || 0) / Math.max(1, w * h);
        if (longSide > 220 || shortSide > 170) return false;
        if (ar < 0.20 || ar > 2.80) return false;
        if (fill < 0.01 || fill > 0.60) return false;
        if (w > Math.floor(cropW * 0.82) && h > Math.floor(cropH * 0.82) && longSide > 140) return false;
        return true;
    }

    function __ocrDigitCandidateFrom(txt: string): string | null {
        const t = String(txt || '').trim(); if (!t) return null;
        if (t.indexOf('\\') !== -1) return null;
        const map: Record<string, string> = { 'O': '0', 'o': '0', 'Q': '0', 'D': '0', 'I': '1', 'l': '1', '|': '1', '!': '1', 'Z': '2', 'z': '2', 'S': '5', 's': '5', 'B': '8', 'g': '9', 'q': '9' };
        let out = '';
        for (let i = 0; i < t.length; i++) {
            const ch = t[i]; const code = t.charCodeAt(i);
            if (code >= 48 && code <= 57) { out += ch; continue; }
            if (' \n\r\t'.includes(ch)) continue;
            if ('${}()[]'.includes(ch)) continue;
            if (',.;:_-'.includes(ch)) continue;
            if (map[ch]) { out += map[ch]; continue; }
            return null;
        }
        out = String(out).trim();
        if (!out || out.length > 3) return null;
        return out;
    }

    async function __ocrDigitGuard(engine: any, cropCanvas: HTMLCanvasElement): Promise<string | null> {
        // Lazy variant factory — avoids creating all 6 canvases when early consensus is reached.
        const c = cropCanvas as any;
        if (!c.__dgBase0) c.__dgBase0 = __ocrPreprocessDigitCanvas(cropCanvas, { dilate: 0 });
        if (!c.__dgBase1) c.__dgBase1 = __ocrPreprocessDigitCanvas(cropCanvas, { dilate: 1 });
        const base0: HTMLCanvasElement = c.__dgBase0;
        const base1: HTMLCanvasElement = c.__dgBase1;

        // deg=0 needs no rotation — reuse the base directly to save a canvas + draw call.
        const variantDefs: Array<() => HTMLCanvasElement> = [
            () => base0,
            () => __ocrRotateCanvas(base0, -6),
            () => __ocrRotateCanvas(base0, 6),
            () => base1,
            () => __ocrRotateCanvas(base1, -6),
            () => __ocrRotateCanvas(base1, 6),
        ];

        const counts: Record<string, number> = {};
        const order: string[] = [];

        for (let i = 0; i < variantDefs.length; i++) {
            let raw = '';
            try { raw = await engine.recognize(variantDefs[i](), { max_new_tokens: 8, do_sample: false, temperature: 0, __silent: true }); } catch (_) { continue; }
            let latex = __ocrCleanLatex(raw); latex = __ocrUnwrapRoman(latex);
            const cand = __ocrDigitCandidateFrom(latex); if (!cand) continue;
            if (!counts[cand]) { counts[cand] = 0; order.push(cand); }
            counts[cand] += 1;
            if (counts[cand] >= 3) return cand;
        }

        let best = null, bestV = 0;
        for (const k of order) { if ((counts[k] || 0) > bestV) { bestV = counts[k]; best = k; } }
        return best;
    }

    // Rect progress
    let __rectProgRAF = 0;
    let __rectProgStart = 0;

    function __rectProgSet01(v: number): void {
        if (!rectProg || !rectProgFill || !rectProgTxt) return;
        const p = Math.max(0, Math.min(1, Number(v)));
        rectProgFill.style.width = Math.round(p * 100) + '%';
        rectProgTxt.textContent = Math.round(p * 100) + '%';
    }
    function __rectProgShow(): void { if (!rectProg) return; rectProg.dataset.on = '1'; __rectProgSet01(0); scheduleRectActionUpdate(); }
    function __rectProgHide(): void { if (!rectProg) return; rectProg.dataset.on = '0'; __rectProgSet01(0); }
    function __rectProgStartPseudo(): void {
        __rectProgShow(); __rectProgStart = performance.now();
        const tick = () => {
            const t = performance.now() - __rectProgStart; let v = 0;
            if (t < 900) v = (t / 900) * 0.70;
            else if (t < 2200) v = 0.70 + ((t - 900) / 1300) * 0.20;
            else v = 0.90 + Math.min(0.08, ((t - 2200) / 5000) * 0.08);
            __rectProgSet01(v); __rectProgRAF = requestAnimationFrame(tick);
        };
        __rectProgRAF = requestAnimationFrame(tick);
    }
    function __rectProgStop(final01: number): void {
        if (__rectProgRAF) { cancelAnimationFrame(__rectProgRAF); __rectProgRAF = 0; }
        __rectProgSet01(final01); setTimeout(() => __rectProgHide(), 250);
    }

    async function __ocrFromMarkedRect({ auto = false } = {}): Promise<void> {
        const rectItem = getRectItem();
        if (!rectItem) { __ocrLog('No marker-rectangle found.'); return; }
        const engine = LIA.ocr;
        if (!engine || !engine.recognize) { __ocrLog('OCR engine not available (LIA.ocr).'); return; }
        const oldText = rectActionBtn.textContent || '';
        rectActionBtn.disabled = true;
        rectActionBtn.textContent = 'Running OCR...';
        __rectProgStartPseudo();
        try {
            if (engine.ensureLoaded) await engine.ensureLoaded(false);
            const crop = __ocrCropFromRect(rectItem);
            if (!crop) { __ocrLog('Crop failed (rect too small or out of bounds).'); return; }

            function __ocrInkBBoxQuick(src: HTMLCanvasElement) {
                try {
                    const W = src.width | 0, H = src.height | 0;
                    const x = src.getContext('2d', { willReadFrequently: true })!;
                    const img = x.getImageData(0, 0, W, H); const d = img.data;
                    const step = (W * H > 1200000) ? 2 : 1;
                    let xMin = W, yMin = H, xMax = -1, yMax = -1, black = 0;
                    for (let y = 0; y < H; y += step) {
                        const row = y * W * 4;
                        for (let x0 = 0; x0 < W; x0 += step) {
                            const i = row + x0 * 4;
                            if (d[i] < 128) { black++; if (x0 < xMin) xMin = x0; if (y < yMin) yMin = y; if (x0 > xMax) xMax = x0; if (y > yMax) yMax = y; }
                        }
                    }
                    if (xMax < 0) return null;
                    const w = xMax - xMin + 1, h = yMax - yMin + 1;
                    return { xMin, yMin, xMax, yMax, w, h, black, W, H };
                } catch (_) { }
                return null;
            }

            const ink = __ocrInkBBoxQuick(crop);
            const preferDigits = __ocrShouldPreferDigits(ink, crop);
            const modelName = String(engine.model || '');
            const isTrocr = modelName.toLowerCase().indexOf('trocr') !== -1;

            let inputCanvas = crop, raw = '';
            try { inputCanvas = preferDigits ? __ocrPreprocessDigitCanvas(crop, { dilate: 0 }) : __ocrPreprocessCanvas(crop); } catch (_) { inputCanvas = crop; }
            try { inputCanvas = __ocrNormalizeSize(inputCanvas); } catch (_) { }
            raw = await engine.recognize(inputCanvas, preferDigits ? { max_new_tokens: 16, do_sample: false, temperature: 0 } : { max_new_tokens: 128, do_sample: false, temperature: 0 });

            if (preferDigits) {
                const rawTrim = String(raw || '').trim();
                const looksMathy = rawTrim.indexOf('\\') !== -1 || rawTrim.indexOf('{') !== -1 || rawTrim.indexOf('}') !== -1 || rawTrim.indexOf('^') !== -1 || rawTrim.indexOf('_') !== -1 || rawTrim.indexOf('sqrt') !== -1 || rawTrim.indexOf('frac') !== -1;
                if (looksMathy || __ocrMathLooksIncomplete(rawTrim)) {
                    let retryCanvas = crop;
                    try { retryCanvas = __ocrPreprocessCanvas(crop); } catch (_) { retryCanvas = crop; }
                    try { retryCanvas = __ocrNormalizeSize(retryCanvas); } catch (_) { }
                    raw = await engine.recognize(retryCanvas, { max_new_tokens: 128, do_sample: false, temperature: 0 });
                }
            }

            function __ocrTidyMathText(s: string): string {
                const t = __ocrSquashWS(s), ops = '+-=*/()[]{}';
                let out = '';
                for (let i = 0; i < t.length; i++) {
                    const ch = t[i];
                    if (ch === ' ') { const prev = (i > 0) ? t[i - 1] : '', next = (i + 1 < t.length) ? t[i + 1] : ''; if (ops.indexOf(prev) >= 0 || ops.indexOf(next) >= 0) continue; out += ' '; } else out += ch;
                }
                return out.trim();
            }

            let latex = isTrocr ? __ocrTidyMathText(raw) : __ocrUnwrapRoman(__ocrCleanLatex(raw));

            function __ocrIsShortPlainToken(s: string): boolean {
                const t = String(s || '').trim(); if (!t || t.length > 6 || t.indexOf('\\') !== -1) return false;
                let has = false;
                for (let i = 0; i < t.length; i++) {
                    const c = t.charCodeAt(i), ch = t[i];
                    if (c >= 48 && c <= 57) { has = true; continue; }
                    if ('lLIi|!OoQqSsZzBg'.includes(ch)) { has = true; continue; }
                    if (' \n\r\t()[]{}.,;:_-'.includes(ch)) continue;
                    return false;
                }
                return has;
            }

            const tryDigitSalvage = preferDigits || __ocrIsShortPlainToken(latex);
            if (tryDigitSalvage) {
                const cand = __ocrDigitCandidateFrom(latex);
                if (cand) { latex = cand; }
                else { const fixed = __ocrFixDigitsIfPossible(latex); if (fixed) latex = fixed; }
                if (!__ocrIsAllDigits(latex)) {
                    const voted = await __ocrDigitGuard(engine, crop);
                    if (voted) latex = voted;
                }
            }

            __ocrLog('OCR result: ' + latex);
            const pair = wrap!.closest('.lia-canvas-pair');
            const ok = __liaFindAndSetInputBeforeNode((pair || wrap!) as Element, latex);
            if (!ok) { __ocrLog('Could not find an input field before this @canvas.'); }
            else { rectActionBtn.textContent = '✅ submitted'; setTimeout(() => { rectActionBtn.textContent = oldText; }, 900); }
        } catch (err) {
            __ocrLog('OCR error: ' + (err && (err as any).message ? (err as any).message : String(err)));
            rectActionBtn.textContent = '⚠ Fehler';
            setTimeout(() => { rectActionBtn.textContent = oldText; }, 900);
        } finally {
            __rectProgStop(1);
            rectActionBtn.disabled = false;
        }
    }

    rectActionBtn.addEventListener('click', async (e) => {
        e.preventDefault(); e.stopPropagation();
        await __ocrFromMarkedRect({ auto: false });
    });

    // ---- State ----
    let ITEMS: any[] = [];
    let REDO: any[] = [];
    if (saved) {
        if (Array.isArray(saved.ITEMS)) { ITEMS = saved.ITEMS; REDO = Array.isArray(saved.REDO) ? saved.REDO : []; }
        else if (Array.isArray(saved.STROKES)) { ITEMS = saved.STROKES.map((st: any) => ({ kind: 'path', ...st })); REDO = Array.isArray(saved.REDO) ? saved.REDO.map((st: any) => ({ kind: 'path', ...st })) : []; }
    }

    let tool = 'pen', menuMode = 'pen';
    let colorIndex = 0, penWidth = 3, penAlpha = 1.0, eraserWidth = 12;
    let bgMode = (saved && saved.bgMode) ? saved.bgMode : 'none';
    let bgStep = (saved && saved.bgStep) ? saved.bgStep : 24;
    const RECT_ALPHA = 0.28;
    let currentPath: any = null, currentRect: any = null;

    function clamp(v: number, a: number, b: number): number { return Math.max(a, Math.min(b, v)); }

    function persist(reason?: string): void {
        if (!uid) return;
        STORE[uid] = { VIEW: { ...VIEW }, ITEMS, REDO, bgMode, bgStep, wrapW: wrap!.getBoundingClientRect().width, canvasH: canvas.clientHeight };
        scheduleCanvasFreezeNotify(reason || 'persist');
    }

    function penBaseColor(): string {
        const c = COLORS[colorIndex] || COLORS[0];
        return (c.key === 'auto') ? getAutoPen() : (c.value || getAutoPen());
    }

    function setMenuOpen(open: boolean): void { if (!menu) return; menu.dataset.open = open ? '1' : '0'; }
    function autoCloseSubmenus(): void { if (menu && menu.dataset.open === '1') setMenuOpen(false); }

    function __menuCloseBtnSvg(): string {
        return `<svg viewBox="-1 0 24 24" aria-hidden="true" style="width:22px;height:22px;display:block;"><path class="ico-stroke" d="M6 6l12 12M18 6L6 18" stroke-width="2" stroke-linecap="round"/></svg>`;
    }
    function __menuTrashSvg(): string {
        return `<svg viewBox="-1 0 24 24" aria-hidden="true" style="width:22px;height:22px;display:block;"><path class="ico-stroke" d="M9 3h6" stroke-width="2" stroke-linecap="round"/><path class="ico-stroke" d="M4 6h16" stroke-width="2" stroke-linecap="round"/><path class="ico-stroke" d="M7 6l1 15h8l1-15" stroke-width="2" stroke-linejoin="round"/><path class="ico-stroke" d="M10 10v8M14 10v8" stroke-width="2" stroke-linecap="round"/></svg>`;
    }

    function buildPenMenu(): void {
        if (!menu) return; (menu as any).__mode = 'pen';
        const auto = getAutoPen(); let html = '';
        html += `<span class="lia-heading-row"><span class="lia-tool-heading">Pen</span><button class="lia-menu-icon-btn" type="button" data-act="close" aria-label="Close">${__menuCloseBtnSvg()}</button></span>`;
        html += `<span class="lia-color-grid">`;
        for (let i = 0; i < COLORS.length; i++) {
            const c = COLORS[i], col = (c.key === 'auto') ? auto : (c.value || auto);
            html += `<button class="lia-color-item" type="button" data-act="color" data-idx="${i}" data-active="${i === colorIndex ? '1' : '0'}" style="background:${col};" aria-label="Color ${c.key}"></button>`;
        }
        html += `</span>`;
        html += `<span class="lia-row"><span class="lia-preview"><span class="lia-preview-line" data-k="pw" style="height:${Math.max(2, Math.min(14, penWidth))}px;"></span></span><input class="lia-slider" type="range" min="1" max="100" step="1" value="${penWidth}" data-act="penWidth" aria-label="Pen width"><span style="font-weight:800;min-width:2.6em;text-align:right">${penWidth}</span></span>`;
        html += `<span class="lia-row"><span class="lia-preview"><span class="lia-preview-line" data-k="pa" style="opacity:${penAlpha};"></span></span><input class="lia-slider" type="range" min="0.15" max="1" step="0.05" value="${penAlpha}" data-act="penAlpha" aria-label="Opacity"><span style="font-weight:800;min-width:2.6em;text-align:right">${Math.round(penAlpha * 100)}%</span></span>`;
        menu.innerHTML = html;
        menu.onclick = (e: MouseEvent) => {
            const el = (e.target && (e.target as Element).closest) ? (e.target as Element).closest('[data-act]') : null;
            if (!el) return; const act = el.getAttribute('data-act');
            if (act === 'close') { setMenuOpen(false); return; }
            if (act === 'color') { const idx = Number(el.getAttribute('data-idx')); if (isFinite(idx)) colorIndex = clamp(idx, 0, COLORS.length - 1); tool = 'pen'; updateUI(); persist(); buildPenMenu(); return; }
        };
        const w = menu.querySelector('input[data-act="penWidth"]') as HTMLInputElement | null;
        if (w) w.oninput = () => { penWidth = clamp(Number(w.value), 1, 100); updateUI(); persist(); const line = menu.querySelector('[data-k="pw"]') as HTMLElement | null; if (line) line.style.height = Math.max(2, Math.min(14, penWidth)) + 'px'; const t = w.parentElement && w.parentElement.querySelector('span[style*="min-width"]'); if (t) t.textContent = String(penWidth); };
        const a = menu.querySelector('input[data-act="penAlpha"]') as HTMLInputElement | null;
        if (a) a.oninput = () => { penAlpha = clamp(Number(a.value), 0.05, 1); updateUI(); persist(); const line = menu.querySelector('[data-k="pa"]') as HTMLElement | null; if (line) line.style.opacity = String(penAlpha); const t = a.parentElement && a.parentElement.querySelector('span[style*="min-width"]'); if (t) t.textContent = Math.round(penAlpha * 100) + '%'; };
    }

    function buildEraserMenu(): void {
        if (!menu) return; (menu as any).__mode = 'eraser';
        menu.innerHTML = `<span class="lia-heading-row"><span class="lia-tool-heading">Eraser</span><span style="display:flex;gap:8px;align-items:center"><button class="lia-menu-icon-btn" type="button" data-act="clear" aria-label="Clear all">${__menuTrashSvg()}</button><button class="lia-menu-icon-btn" type="button" data-act="close" aria-label="Close">${__menuCloseBtnSvg()}</button></span></span><span class="lia-row"><span class="lia-preview"><span class="lia-preview-line lia-preview-line--eraser" style="height:${Math.max(2, Math.min(18, eraserWidth))}px;"></span></span><input class="lia-slider" type="range" min="4" max="500" step="1" value="${eraserWidth}" data-act="eraserWidth" aria-label="Eraser width"><span style="font-weight:800;min-width:2.6em;text-align:right">${eraserWidth}</span></span>`;
        menu.onclick = (e: MouseEvent) => { const el = (e.target as Element)?.closest?.('[data-act]'); if (!el) return; const act = el.getAttribute('data-act'); if (act === 'close') { setMenuOpen(false); return; } if (act === 'clear') { clearAllDrawing(); return; } };
        const w = menu.querySelector('input[data-act="eraserWidth"]') as HTMLInputElement | null;
        if (w) w.oninput = () => { eraserWidth = clamp(Number(w.value), 2, 500); updateUI(); persist(); const t = w.parentElement && w.parentElement.querySelector('span[style*="min-width"]'); if (t) t.textContent = String(eraserWidth); };
    }

    function buildBgMenu(): void {
        if (!menu) return; (menu as any).__mode = 'bg';
        menu.innerHTML = `<span class="lia-heading-row"><span class="lia-tool-heading">Background</span><button class="lia-menu-icon-btn" type="button" data-act="close" aria-label="Close">${__menuCloseBtnSvg()}</button></span><span class="lia-bg-tiles"><button class="lia-bg-tile" type="button" data-act="bg" data-mode="none" data-active="${bgMode === 'none' ? '1' : '0'}" aria-label="No background"></button><button class="lia-bg-tile" type="button" data-act="bg" data-mode="grid" data-active="${bgMode === 'grid' ? '1' : '0'}" aria-label="Grid"></button><button class="lia-bg-tile" type="button" data-act="bg" data-mode="lined" data-active="${bgMode === 'lined' ? '1' : '0'}" aria-label="Lined"></button></span><span class="lia-row"><span style="font-weight:800;opacity:.8;min-width:4.8em">Spacing</span><input class="lia-slider" type="range" min="8" max="80" step="1" value="${bgStep}" data-act="bgStep" aria-label="Background spacing"><span style="font-weight:800;min-width:2.6em;text-align:right">${bgStep}</span></span>`;
        try {
            const accent = rgbaFromAny(getAccentCssVar(), 0.65);
            const tiles = menu.querySelectorAll('.lia-bg-tile');
            if (tiles && tiles.length >= 3) {
                (tiles[1] as HTMLElement).style.backgroundImage = `linear-gradient(to right, ${accent} 2px, transparent 2px), linear-gradient(to bottom, ${accent} 2px, transparent 2px)`;
                (tiles[1] as HTMLElement).style.backgroundSize = '10px 10px'; (tiles[1] as HTMLElement).style.backgroundPosition = 'center';
                (tiles[2] as HTMLElement).style.backgroundImage = `linear-gradient(to bottom, ${accent} 2px, transparent 2px)`;
                (tiles[2] as HTMLElement).style.backgroundSize = '10px 10px'; (tiles[2] as HTMLElement).style.backgroundPosition = 'center';
            }
        } catch (_) { }
        menu.onclick = (e: MouseEvent) => { const el = (e.target as Element)?.closest?.('[data-act]'); if (!el) return; const act = el.getAttribute('data-act'); if (act === 'close') { setMenuOpen(false); return; } if (act === 'bg') { const m = String(el.getAttribute('data-mode') || 'none'); bgMode = (m === 'grid' || m === 'lined') ? m : 'none'; present(); persist(); buildBgMenu(); updateUI(); return; } };
        const s = menu.querySelector('input[data-act="bgStep"]') as HTMLInputElement | null;
        if (s) s.oninput = () => { bgStep = clamp(Number(s.value), 6, 300); present(); persist(); const t = s.parentElement && s.parentElement.querySelector('span[style*="min-width"]'); if (t) t.textContent = String(bgStep); };
    }

    function clearMarkerRect(): void {
        let removed = false;
        for (let i = ITEMS.length - 1; i >= 0; i--) if (ITEMS[i] && ITEMS[i].kind === 'rect') { ITEMS.splice(i, 1); removed = true; }
        for (let i = REDO.length - 1; i >= 0; i--) if (REDO[i] && REDO[i].kind === 'rect') { REDO.splice(i, 1); removed = true; }
        if (removed) { rebuildHighlightLayer(); present(); updateUI(); persist(); }
        scheduleRectActionUpdate();
    }

    function getRectItem(): any {
        for (let i = ITEMS.length - 1; i >= 0; i--) { const it = ITEMS[i]; if (it && it.kind === 'rect') return it; }
        return null;
    }

    function hideEraserRing(): void { if (!eraserRing) return; eraserRing.dataset.on = '0'; }

    function updateEraserRingFromScreen(sx: number, sy: number): void {
        if (!eraserRing) return;
        if (tool !== 'eraser' || !isFinite(sx) || !isFinite(sy)) { hideEraserRing(); return; }
        const size = Math.max(8, eraserWidth * VIEW.scale);
        eraserRing.style.width = size + 'px'; eraserRing.style.height = size + 'px';
        eraserRing.style.left = clamp(sx, 0, canvas.clientWidth) + 'px';
        eraserRing.style.top = clamp(sy, 0, canvas.clientHeight) + 'px';
        eraserRing.dataset.on = '1';
    }

    let __rectBtnRAF = 0;
    function scheduleRectActionUpdate(): void {
        if (__rectBtnRAF) return;
        __rectBtnRAF = requestAnimationFrame(() => { __rectBtnRAF = 0; updateRectActionButton(); });
    }

    function updateRectActionButton(): void {
        const it = getRectItem();
        if (!it) { rectActionBtn.style.display = 'none'; if (rectCloseBtn) rectCloseBtn.style.display = 'none'; return; }
        rectActionBtn.style.display = 'block'; rectActionBtn.style.visibility = 'hidden';
        const bw = rectActionBtn.offsetWidth || 180, bh = rectActionBtn.offsetHeight || 34;
        rectActionBtn.style.visibility = 'visible';
        const x0 = Math.min(it.x0, it.x1), y0 = Math.min(it.y0, it.y1);
        const x1 = Math.max(it.x0, it.x1), y1 = Math.max(it.y0, it.y1);
        const a = worldToScreen(x0, y0), b = worldToScreen(x1, y1);
        const right = Math.max(a.sx, b.sx), bottom = Math.max(a.sy, b.sy);
        const pad = 6, gap = 8;
        let left = clamp(right - bw, pad, canvas.clientWidth - bw - pad);
        let top = clamp(bottom + gap, pad, canvas.clientHeight - bh - pad);
        rectActionBtn.style.left = left + 'px'; rectActionBtn.style.top = top + 'px';
        if (rectProg) {
            rectProg.style.width = bw + 'px';
            const pbH = rectProg.offsetHeight || 26;
            rectProg.style.left = clamp(left, pad, canvas.clientWidth - bw - pad) + 'px';
            rectProg.style.top = clamp(top + bh + 6, pad, canvas.clientHeight - pbH - pad) + 'px';
        }
        if (rectCloseBtn) {
            rectCloseBtn.style.display = 'block'; rectCloseBtn.style.visibility = 'hidden';
            const cbw = rectCloseBtn.offsetWidth || 24, cbh = rectCloseBtn.offsetHeight || 24;
            rectCloseBtn.style.visibility = 'visible';
            const topRect = Math.min(a.sy, b.sy), rightRect = Math.max(a.sx, b.sx);
            const pad2 = 6;
            rectCloseBtn.style.left = clamp(rightRect - cbw * 0.5, pad2, canvas.clientWidth - cbw - pad2) + 'px';
            rectCloseBtn.style.top = clamp(topRect - cbh * 0.5, pad2, canvas.clientHeight - cbh - pad2) + 'px';
        }
    }

    function screenToWorld(sx: number, sy: number): { x: number; y: number } {
        return { x: (sx - VIEW.panX) / VIEW.scale, y: (sy - VIEW.panY) / VIEW.scale };
    }
    function worldToScreen(wx: number, wy: number): { sx: number; sy: number } {
        return { sx: wx * VIEW.scale + VIEW.panX, sy: wy * VIEW.scale + VIEW.panY };
    }
    function worldBounds(): { x0: number; y0: number; x1: number; y1: number } {
        const w = canvas.clientWidth, h = canvas.clientHeight;
        return { x0: (0 - VIEW.panX) / VIEW.scale, y0: (0 - VIEW.panY) / VIEW.scale, x1: (w - VIEW.panX) / VIEW.scale, y1: (h - VIEW.panY) / VIEW.scale };
    }

    function drawBackground(): void {
        if (bgMode === 'none') return;
        const dpr = window.devicePixelRatio || 1;
        ctx.setTransform(dpr * VIEW.scale, 0, 0, dpr * VIEW.scale, dpr * VIEW.panX, dpr * VIEW.panY);
        const step = Math.max(6, Number(bgStep) || 24), b = worldBounds();
        const col = rgbaFromAny(getAccentCssVar(), 0.65);
        ctx.save(); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1.0;
        ctx.strokeStyle = col; ctx.lineWidth = 1.125 / VIEW.scale;
        const xStart = Math.floor(b.x0 / step) * step, xEnd = Math.ceil(b.x1 / step) * step;
        const yStart = Math.floor(b.y0 / step) * step, yEnd = Math.ceil(b.y1 / step) * step;
        const maxLines = 4000; ctx.beginPath();
        if (bgMode === 'grid') {
            let count = 0;
            for (let x = xStart; x <= xEnd; x += step) { ctx.moveTo(x, b.y0); ctx.lineTo(x, b.y1); if (++count > maxLines) break; }
            for (let y = yStart; y <= yEnd; y += step) { ctx.moveTo(b.x0, y); ctx.lineTo(b.x1, y); if (++count > maxLines) break; }
        } else {
            let count = 0;
            for (let y = yStart; y <= yEnd; y += step) { ctx.moveTo(b.x0, y); ctx.lineTo(b.x1, y); if (++count > maxLines) break; }
        }
        ctx.stroke(); ctx.restore();
    }

    function setViewportTransformOn(ctx2: CanvasRenderingContext2D): void {
        const dpr = window.devicePixelRatio || 1;
        ctx2.setTransform(dpr * VIEW.scale, 0, 0, dpr * VIEW.scale, dpr * VIEW.panX, dpr * VIEW.panY);
    }
    function clearLayer(ctx2: CanvasRenderingContext2D): void {
        const dpr = window.devicePixelRatio || 1;
        ctx2.setTransform(dpr, 0, 0, dpr, 0, 0); ctx2.globalCompositeOperation = 'source-over';
        ctx2.globalAlpha = 1; ctx2.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
    }
    function applyPathStyleTo(ctx2: CanvasRenderingContext2D, it: any): void {
        if (it.tool === 'eraser') { ctx2.globalCompositeOperation = 'destination-out'; ctx2.globalAlpha = 1.0; ctx2.strokeStyle = 'rgba(0,0,0,1)'; ctx2.lineWidth = it.width; }
        else { ctx2.globalCompositeOperation = 'source-over'; ctx2.globalAlpha = it.alpha; ctx2.strokeStyle = it.color; ctx2.lineWidth = it.width; }
        ctx2.lineCap = 'round'; ctx2.lineJoin = 'round';
    }
    function rebuildHighlightLayer(): void {
        clearLayer(hctx); setViewportTransformOn(hctx);
        for (const it of ITEMS) {
            if (!it || it.kind !== 'rect') continue;
            const colBase = (it.colorKey === 'accent') ? getAccentCssVar() : (it.color || getAccentCssVar());
            const fillCol = rgbaFromAny(colBase, Math.max(0, Math.min(1, it.alpha)));
            const x0 = Math.min(it.x0, it.x1), y0 = Math.min(it.y0, it.y1), x1 = Math.max(it.x0, it.x1), y1 = Math.max(it.y0, it.y1);
            hctx.save(); hctx.globalCompositeOperation = 'source-over'; hctx.globalAlpha = 1.0;
            hctx.fillStyle = fillCol; hctx.fillRect(x0, y0, Math.max(0, x1 - x0), Math.max(0, y1 - y0)); hctx.restore();
        }
    }
    function rebuildStrokeLayer(): void {
        clearLayer(sctx); setViewportTransformOn(sctx);
        for (const it of ITEMS) {
            if (!it || it.kind !== 'path' || !it.points || it.points.length < 2) continue;
            applyPathStyleTo(sctx, it); sctx.beginPath(); sctx.moveTo(it.points[0].x, it.points[0].y);
            for (let i = 1; i < it.points.length; i++) sctx.lineTo(it.points[i].x, it.points[i].y);
            sctx.stroke();
        }
    }
    function clearMain(): void {
        const dpr = window.devicePixelRatio || 1;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
        ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
    }
    function present(): void {
        clearMain(); drawBackground();
        const dpr = window.devicePixelRatio || 1;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1.0;
        ctx.drawImage(hiLayer, 0, 0, hiLayer.width, hiLayer.height, 0, 0, canvas.clientWidth, canvas.clientHeight);
        if (currentRect) {
            const col = rgbaFromAny(getAccentCssVar(), RECT_ALPHA);
            const x0 = Math.min(currentRect.x0, currentRect.x1), y0 = Math.min(currentRect.y0, currentRect.y1);
            const x1 = Math.max(currentRect.x0, currentRect.x1), y1 = Math.max(currentRect.y0, currentRect.y1);
            const a = worldToScreen(x0, y0), b = worldToScreen(x1, y1);
            ctx.save(); ctx.fillStyle = col; ctx.globalAlpha = 1.0;
            ctx.fillRect(a.sx, a.sy, Math.max(0, b.sx - a.sx), Math.max(0, b.sy - a.sy)); ctx.restore();
        }
        ctx.drawImage(strokeLayer, 0, 0, strokeLayer.width, strokeLayer.height, 0, 0, canvas.clientWidth, canvas.clientHeight);
        scheduleRectActionUpdate();
    }

    function updateUI(): void {
        const col = penBaseColor(), accent = getAccentCssVar();
        if (btnUndo) { btnUndo.disabled = (ITEMS.length === 0); btnUndo.title = 'Undo'; }
        if (btnRedo) { btnRedo.disabled = (REDO.length === 0); btnRedo.title = 'Redo'; }
        if (btnColor) { btnColor.style.background = col; btnColor.dataset.active = (tool === 'pen') ? '1' : '0'; btnColor.title = 'Pen'; }
        if (btnEraser) { btnEraser.dataset.active = (tool === 'eraser') ? '1' : '0'; btnEraser.title = 'Eraser'; }
        if (btnRect) { btnRect.style.background = 'transparent'; btnRect.dataset.active = (tool === 'rect') ? '1' : '0'; btnRect.title = 'Select & Submit'; }
        if (btnBg) {
            const gridCol = rgbaFromAny(accent, 0.65), s = 6, t = 1.8;
            btnBg.style.backgroundColor = 'transparent';
            btnBg.style.backgroundImage = `linear-gradient(to right, ${gridCol} ${t}px, transparent ${t}px), linear-gradient(to bottom, ${gridCol} ${t}px, transparent ${t}px)`;
            btnBg.style.backgroundSize = `${s}px ${s}px`; btnBg.style.backgroundPosition = 'center';
            btnBg.dataset.active = (menuMode === 'bg') ? '1' : '0'; btnBg.title = 'Background';
        }
        if (tool !== 'eraser') hideEraserRing();
    }

    function doUndo(): void { if (!ITEMS.length) return; REDO.push(ITEMS.pop()); rebuildHighlightLayer(); rebuildStrokeLayer(); present(); updateUI(); persist(); }
    function doRedo(): void { if (!REDO.length) return; ITEMS.push(REDO.pop()); rebuildHighlightLayer(); rebuildStrokeLayer(); present(); updateUI(); persist(); }
    function clearAllDrawing(): void { ITEMS.length = 0; REDO.length = 0; rebuildHighlightLayer(); rebuildStrokeLayer(); present(); updateUI(); persist(); }

    function startStrokeAtScreen(sx: number, sy: number): void {
        const w = screenToWorld(sx, sy);
        const it = { kind: 'path', tool, color: penBaseColor(), alpha: penAlpha, width: (tool === 'eraser') ? eraserWidth : penWidth, points: [{ x: w.x, y: w.y }] };
        ITEMS.push(it); currentPath = it; REDO.length = 0;
        setViewportTransformOn(sctx); applyPathStyleTo(sctx, it); sctx.beginPath(); sctx.moveTo(w.x, w.y);
        updateUI(); persist();
    }
    function extendStrokeToScreen(sx: number, sy: number): void {
        if (!currentPath) return;
        const w = screenToWorld(sx, sy); currentPath.points.push({ x: w.x, y: w.y });
        sctx.lineTo(w.x, w.y); sctx.stroke(); present(); persist();
    }
    function endStroke(): void { currentPath = null; }

    function startRectAtScreen(sx: number, sy: number): void { const w = screenToWorld(sx, sy); currentRect = { x0: w.x, y0: w.y, x1: w.x, y1: w.y }; }
    function updateRectToScreen(sx: number, sy: number): void { if (!currentRect) return; const w = screenToWorld(sx, sy); currentRect.x1 = w.x; currentRect.y1 = w.y; present(); }
    function finishRect(commit: boolean): void {
        if (!currentRect) return;
        if (commit) {
            const x0 = Math.min(currentRect.x0, currentRect.x1), y0 = Math.min(currentRect.y0, currentRect.y1);
            const x1 = Math.max(currentRect.x0, currentRect.x1), y1 = Math.max(currentRect.y0, currentRect.y1);
            if ((x1 - x0) > 1e-3 && (y1 - y0) > 1e-3) {
                for (let i = ITEMS.length - 1; i >= 0; i--) if (ITEMS[i] && ITEMS[i].kind === 'rect') ITEMS.splice(i, 1);
                for (let i = REDO.length - 1; i >= 0; i--) if (REDO[i] && REDO[i].kind === 'rect') REDO.splice(i, 1);
                ITEMS.push({ kind: 'rect', x0, y0, x1, y1, alpha: RECT_ALPHA, colorKey: 'accent' }); REDO.length = 0;
            }
        }
        currentRect = null; rebuildHighlightLayer(); present(); updateUI(); persist(); scheduleRectActionUpdate();
    }

    function resizeToCss(): void {
        hideEraserRing();
        const dpr = window.devicePixelRatio || 1, cssW = canvas.clientWidth, cssH = canvas.clientHeight;
        const pxW = Math.max(1, Math.round(cssW * dpr)), pxH = Math.max(1, Math.round(cssH * dpr));
        canvas.width = pxW; canvas.height = pxH;
        hiLayer.width = pxW; hiLayer.height = pxH;
        strokeLayer.width = pxW; strokeLayer.height = pxH;
        rebuildHighlightLayer(); rebuildStrokeLayer(); present(); updateUI(); persist();
    }

    updateUI(); resizeToCss();
    const ro = new ResizeObserver(() => resizeToCss()); ro.observe(canvas);

    function ensureCorners(): void {
        const ww = wrap!;
        if ((ww as any).__cornersReady) return; (ww as any).__cornersReady = true;
        const bl = document.createElement('button'); bl.type = 'button'; bl.className = 'lia-resize-corner'; bl.dataset.corner = 'bl'; bl.setAttribute('aria-label', 'Resize drawing area (bottom left)');
        const br = document.createElement('button'); br.type = 'button'; br.className = 'lia-resize-corner'; br.dataset.corner = 'br'; br.setAttribute('aria-label', 'Resize drawing area (bottom right)');
        ww.appendChild(bl); ww.appendChild(br);
        const MIN_H = CANVAS_MIN_H, MAX_H = CANVAS_MAX_H, MIN_W = CANVAS_MIN_W;
        const clampLocal = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
        function containerMaxWidth(): number {
            const m = ww.closest('.lia-canvas-mount'); let host = (m || ww.parentElement || ww) as HTMLElement;
            let w = 0; try { w = host.getBoundingClientRect().width; } catch (_) { }
            if ((!w || w < MIN_W) && document.querySelector('main')) { try { w = (document.querySelector('main') as HTMLElement).getBoundingClientRect().width; } catch (_) { } }
            return Math.max(MIN_W, Math.floor(w || MIN_W));
        }
        function bindCorner(handle: HTMLElement, side: string): void {
            let resizing = false, startX = 0, startY = 0, startW = 0, startH = 0;
            function down(e: PointerEvent) { autoCloseSubmenus(); e.preventDefault(); e.stopPropagation(); resizing = true; startW = ww.getBoundingClientRect().width; startH = canvas.clientHeight || CANVAS_DEFAULT_H; startX = e.clientX; startY = e.clientY; try { handle.setPointerCapture(e.pointerId); } catch (_) { } }
            function move(e: PointerEvent) { if (!resizing) return; e.preventDefault(); const dx = e.clientX - startX, dy = e.clientY - startY; canvas.style.height = clampLocal(startH + dy, MIN_H, MAX_H) + 'px'; const maxW = containerMaxWidth(); ww.style.width = clampLocal(side === 'br' ? startW + dx : startW - dx, MIN_W, maxW) + 'px'; }
            function up(e: PointerEvent) { if (!resizing) return; resizing = false; try { handle.releasePointerCapture(e.pointerId); } catch (_) { } resizeToCss(); persist(); }
            handle.addEventListener('pointerdown', down); handle.addEventListener('pointermove', move);
            handle.addEventListener('pointerup', up); handle.addEventListener('pointercancel', up);
        }
        bindCorner(br, 'br'); bindCorner(bl, 'bl');
    }
    ensureCorners();

    const onTheme = () => { updateUI(); rebuildHighlightLayer(); rebuildStrokeLayer(); present(); };
    document.addEventListener('lia-canvas-theme', onTheme);

    if (btnUndo && !(btnUndo as any).__bound) { (btnUndo as any).__bound = true; btnUndo.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); doUndo(); }); }
    if (btnRedo && !(btnRedo as any).__bound) { (btnRedo as any).__bound = true; btnRedo.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); doRedo(); }); }
    if (btnRect && !(btnRect as any).__bound) { (btnRect as any).__bound = true; btnRect.addEventListener('click', (e) => { e.stopPropagation(); tool = 'rect'; menuMode = 'rect'; setMenuOpen(false); updateUI(); }); }
    if (btnColor && menu) btnColor.addEventListener('click', (e) => { e.stopPropagation(); tool = 'pen'; menuMode = 'pen'; const open = menu.dataset.open === '1', same = (menu as any).__mode === 'pen'; if (!open || !same) buildPenMenu(); setMenuOpen(!open || !same); updateUI(); });
    if (btnEraser && menu) btnEraser.addEventListener('click', (e) => { e.stopPropagation(); tool = 'eraser'; menuMode = 'eraser'; const open = menu.dataset.open === '1', same = (menu as any).__mode === 'eraser'; if (!open || !same) buildEraserMenu(); setMenuOpen(!open || !same); updateUI(); });
    if (btnBg && menu) btnBg.addEventListener('click', (e) => { e.stopPropagation(); menuMode = 'bg'; const open = menu.dataset.open === '1', same = (menu as any).__mode === 'bg'; if (!open || !same) buildBgMenu(); setMenuOpen(!open || !same); updateUI(); });

    const onDocClick = (e: Event) => { if (!wrap.contains(e.target as Node)) setMenuOpen(false); };
    const onDocKeydown = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false); };
    document.addEventListener('click', onDocClick);
    document.addEventListener('keydown', onDocKeydown);

    let spaceDown = false;
    const onWinKeydown = (e: KeyboardEvent) => { if (e.code === 'Space') spaceDown = true; };
    const onWinKeyup = (e: KeyboardEvent) => { if (e.code === 'Space') spaceDown = false; };
    window.addEventListener('keydown', onWinKeydown);
    window.addEventListener('keyup', onWinKeyup);

    function cleanup(): void {
        ro.disconnect();
        document.removeEventListener('lia-canvas-theme', onTheme);
        document.removeEventListener('click', onDocClick);
        document.removeEventListener('keydown', onDocKeydown);
        window.removeEventListener('keydown', onWinKeydown);
        window.removeEventListener('keyup', onWinKeyup);
        teardownObs.disconnect();
    }

    const teardownObs = new MutationObserver(() => {
        if (!wrap.isConnected) cleanup();
    });
    const teardownRoot = wrap.parentElement || document.body;
    teardownObs.observe(teardownRoot, { childList: true, subtree: true });

    canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    function clampScale(s: number): number { return Math.max(VIEW.minScale, Math.min(VIEW.maxScale, s)); }
    function zoomAboutScreenPoint(factor: number, sx: number, sy: number): void {
        const oldS = VIEW.scale, newS = clampScale(oldS * factor);
        if (newS === oldS) return;
        const w = screenToWorld(sx, sy); VIEW.scale = newS; VIEW.panX = sx - w.x * newS; VIEW.panY = sy - w.y * newS;
        rebuildHighlightLayer(); rebuildStrokeLayer(); present(); persist();
    }

    canvas.addEventListener('wheel', (e) => {
        autoCloseSubmenus(); e.preventDefault(); hideEraserRing();
        const r = canvas.getBoundingClientRect();
        zoomAboutScreenPoint(Math.exp(-e.deltaY * 0.0012), e.clientX - r.left, e.clientY - r.top);
    }, { passive: false });

    const pointers = new Map<number, { sx: number; sy: number }>();
    let mode = 'idle', lastPanSX = 0, lastPanSY = 0, pinchStart: any = null;

    function getScreenPos(evt: PointerEvent): { sx: number; sy: number } { const r = canvas.getBoundingClientRect(); return { sx: evt.clientX - r.left, sy: evt.clientY - r.top }; }
    function dist(a: { sx: number; sy: number }, b: { sx: number; sy: number }): number { return Math.hypot(a.sx - b.sx, a.sy - b.sy); }
    function mid(a: { sx: number; sy: number }, b: { sx: number; sy: number }): { sx: number; sy: number } { return { sx: (a.sx + b.sx) / 2, sy: (a.sy + b.sy) / 2 }; }

    canvas.addEventListener('pointerdown', (e) => {
        autoCloseSubmenus();
        if ((e.target as Element)?.classList?.contains('lia-resize-corner')) return;
        const p = getScreenPos(e); pointers.set(e.pointerId, p); canvas.setPointerCapture(e.pointerId);
        if (pointers.size === 2) {
            hideEraserRing(); if (mode === 'draw') endStroke(); if (mode === 'rect') finishRect(false);
            const arr = Array.from(pointers.values()); const m = mid(arr[0], arr[1]); const d = Math.max(1e-6, dist(arr[0], arr[1]));
            pinchStart = { dist: d, worldMid: screenToWorld(m.sx, m.sy), startScale: VIEW.scale }; mode = 'pinch'; return;
        }
        const isRightMouse = (e.pointerType === 'mouse' && e.button === 2), isMiddleMouse = (e.pointerType === 'mouse' && e.button === 1);
        const wantPan = isRightMouse || isMiddleMouse || (e.pointerType === 'mouse' && spaceDown);
        if (wantPan) { hideEraserRing(); mode = 'pan'; lastPanSX = p.sx; lastPanSY = p.sy; canvas.style.cursor = 'grab'; return; }
        if (tool === 'rect') { hideEraserRing(); mode = 'rect'; canvas.style.cursor = 'crosshair'; startRectAtScreen(p.sx, p.sy); present(); return; }
        mode = 'draw'; canvas.style.cursor = 'crosshair'; startStrokeAtScreen(p.sx, p.sy);
        if (tool === 'eraser') updateEraserRingFromScreen(p.sx, p.sy); else hideEraserRing();
    });

    canvas.addEventListener('pointermove', (e) => {
        if (!pointers.has(e.pointerId)) return;
        const p = getScreenPos(e); pointers.set(e.pointerId, p);
        if (tool === 'eraser' && mode !== 'pan' && mode !== 'pinch' && mode !== 'rect') updateEraserRingFromScreen(p.sx, p.sy); else hideEraserRing();
        if (mode === 'pinch' && pointers.size >= 2 && pinchStart) {
            const arr = Array.from(pointers.values()).slice(0, 2);
            const m = mid(arr[0], arr[1]); const d = Math.max(1e-6, dist(arr[0], arr[1]));
            const newScale = clampScale(pinchStart.startScale * (d / pinchStart.dist));
            VIEW.scale = newScale; VIEW.panX = m.sx - pinchStart.worldMid.x * newScale; VIEW.panY = m.sy - pinchStart.worldMid.y * newScale;
            rebuildHighlightLayer(); rebuildStrokeLayer(); present(); persist(); return;
        }
        if (mode === 'pan') { const dx = p.sx - lastPanSX, dy = p.sy - lastPanSY; lastPanSX = p.sx; lastPanSY = p.sy; VIEW.panX += dx; VIEW.panY += dy; rebuildHighlightLayer(); rebuildStrokeLayer(); present(); persist(); return; }
        if (mode === 'rect') { updateRectToScreen(p.sx, p.sy); return; }
        if (mode === 'draw') extendStrokeToScreen(p.sx, p.sy);
    });

    function stopPointer(e: PointerEvent): void {
        hideEraserRing(); if (pointers.has(e.pointerId)) pointers.delete(e.pointerId);
        try { canvas.releasePointerCapture(e.pointerId); } catch (_) { }
        if (mode === 'pinch') { if (pointers.size < 2) { pinchStart = null; mode = 'idle'; } return; }
        if (mode === 'pan') { mode = 'idle'; canvas.style.cursor = 'crosshair'; return; }
        if (mode === 'rect') { if (pointers.size === 0) { finishRect(true); mode = 'idle'; } return; }
        if (mode === 'draw') { endStroke(); mode = 'idle'; updateUI(); persist(); return; }
    }
    canvas.addEventListener('pointerup', stopPointer);
    canvas.addEventListener('pointercancel', stopPointer);
    canvas.addEventListener('pointerleave', () => {
        hideEraserRing();
        if (mode === 'draw') endStroke();
        if (mode !== 'pinch') mode = 'idle';
        canvas.style.cursor = 'crosshair'; updateUI(); persist();
    });

    __liaCanvasFreezeNotifyArmed = true;
}

// ---------------------------------------------------------------------------
// initAll + export
// ---------------------------------------------------------------------------

export function initAll(): void {
    document.querySelectorAll('.lia-draw-wrap canvas.lia-draw:not([data-ready])').forEach(c => {
        (c as HTMLCanvasElement).setAttribute('data-ready', '1');
        setupCanvas(c as HTMLCanvasElement);
    });
    __liaInitTexPreviews();
}
