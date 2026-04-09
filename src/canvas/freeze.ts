// Canvas freeze: export, paint, and render frozen canvas states.

import { LIA } from '../index';
import { ensureMountUID } from './store';
import { getAccentCssVar, getAutoPen, rgbaFromAny } from './theme';

// ---------------------------------------------------------------------------
// Numeric helpers
// ---------------------------------------------------------------------------

function cfNum(v: unknown, fallback: number): number {
    const n = Number(v);
    return isFinite(n) ? n : (fallback || 0);
}

function cfClamp(v: number, a: number, b: number): number {
    return Math.max(a, Math.min(b, v));
}

function cfRound(v: number): number {
    return Math.round(cfNum(v, 0) * 100) / 100;
}

function cfMod(v: number, m: number): number {
    const mm = cfNum(m, 0);
    if (!(mm > 0)) return 0;
    const x = cfNum(v, 0) % mm;
    return x < 0 ? (x + mm) : x;
}

// ---------------------------------------------------------------------------
// View / geometry helpers
// ---------------------------------------------------------------------------

interface View {
    panX: number;
    panY: number;
    scale: number;
    minScale: number;
    maxScale: number;
}

interface BBox {
    x: number;
    y: number;
    w: number;
    h: number;
}

function cfCloneView(view: any): View {
    const src = (view && typeof view === 'object') ? view : {};
    return {
        panX: cfNum(src.panX, 0),
        panY: cfNum(src.panY, 0),
        scale: cfNum(src.scale, 1) || 1,
        minScale: cfNum(src.minScale, 0.25),
        maxScale: cfNum(src.maxScale, 8)
    };
}

function cfProjectWorldPoint(pt: any, view: View): { x: number; y: number } {
    const x = cfNum(pt && pt.x, 0);
    const y = cfNum(pt && pt.y, 0);
    const s = cfNum(view && view.scale, 1) || 1;
    return {
        x: x * s + cfNum(view && view.panX, 0),
        y: y * s + cfNum(view && view.panY, 0)
    };
}

function cfNormalizeRect(x0: number, y0: number, x1: number, y1: number): BBox {
    const left = Math.min(cfNum(x0, 0), cfNum(x1, 0));
    const top = Math.min(cfNum(y0, 0), cfNum(y1, 0));
    const right = Math.max(cfNum(x0, 0), cfNum(x1, 0));
    const bottom = Math.max(cfNum(y0, 0), cfNum(y1, 0));
    return { x: left, y: top, w: Math.max(0, right - left), h: Math.max(0, bottom - top) };
}

function cfBBoxFromScreenPoints(points: Array<{ x: number; y: number }>, radius: number): BBox | null {
    const pts = Array.isArray(points) ? points : [];
    if (!pts.length) return null;

    let xMin = Infinity, yMin = Infinity, xMax = -Infinity, yMax = -Infinity;
    for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        const x = cfNum(p && p.x, 0);
        const y = cfNum(p && p.y, 0);
        if (x < xMin) xMin = x;
        if (y < yMin) yMin = y;
        if (x > xMax) xMax = x;
        if (y > yMax) yMax = y;
    }

    const r = Math.max(0, cfNum(radius, 0));
    return {
        x: xMin - r,
        y: yMin - r,
        w: Math.max(0, (xMax - xMin) + 2 * r),
        h: Math.max(0, (yMax - yMin) + 2 * r)
    };
}

function cfIntersectViewport(bb: BBox | null, vw: number, vh: number): BBox | null {
    if (!bb) return null;
    const x0 = Math.max(0, cfNum(bb.x, 0));
    const y0 = Math.max(0, cfNum(bb.y, 0));
    const x1 = Math.min(cfNum(vw, 0), cfNum(bb.x, 0) + cfNum(bb.w, 0));
    const y1 = Math.min(cfNum(vh, 0), cfNum(bb.y, 0) + cfNum(bb.h, 0));
    if (x1 <= x0 || y1 <= y0) return null;
    return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

export function cfUnionBBox(a: BBox | null, b: BBox | null): BBox | null {
    if (!a) return b ? { x: b.x, y: b.y, w: b.w, h: b.h } : null;
    if (!b) return { x: a.x, y: a.y, w: a.w, h: a.h };
    const x0 = Math.min(a.x, b.x);
    const y0 = Math.min(a.y, b.y);
    const x1 = Math.max(a.x + a.w, b.x + b.w);
    const y1 = Math.max(a.y + a.h, b.y + b.h);
    return { x: x0, y: y0, w: Math.max(0, x1 - x0), h: Math.max(0, y1 - y0) };
}

// ---------------------------------------------------------------------------
// Store accessors
// ---------------------------------------------------------------------------

function cfGetCanvasStore(): Record<string, any> {
    return LIA.store || {};
}

function cfGetCanvasMountFromPair(pair: Element): Element | null {
    if (!pair || !pair.querySelector) return null;
    return pair.querySelector('.lia-canvas-mount');
}

function cfGetCanvasUidFromPair(pair: Element): string {
    const mount = cfGetCanvasMountFromPair(pair);
    if (!mount) return '';
    return ensureMountUID(mount as HTMLElement);
}

function cfGetCanvasStoreEntry(uid: string): any {
    const STORE = cfGetCanvasStore();
    return uid && STORE[uid] ? STORE[uid] : null;
}

function cfCollectCanvasPairsFromRoot(root: Element | Document): Element[] {
    const scope = (root && (root as any).querySelectorAll) ? root : document;
    return Array.from(scope.querySelectorAll('.lia-canvas-pair')).filter(pair =>
        !!cfGetCanvasMountFromPair(pair)
    );
}

// ---------------------------------------------------------------------------
// Screen item builder
// ---------------------------------------------------------------------------

function cfBuildScreenItemsFromEntry(entry: any): { vw: number; vh: number; items: any[] } {
    const src = (entry && typeof entry === 'object') ? entry : {};
    const items = Array.isArray(src.ITEMS) ? src.ITEMS : [];
    const view = cfCloneView(src.VIEW || {});
    const vw = Math.max(1, Math.round(cfNum(src.wrapW, 0)));
    const vh = Math.max(1, Math.round(cfNum(src.canvasH, 0)));

    const rectFillDefault = rgbaFromAny(getAccentCssVar(), 0.28);
    const out: any[] = [];

    for (let i = 0; i < items.length; i++) {
        const it = items[i];
        if (!it || typeof it !== 'object') continue;

        if (it.kind === 'path') {
            const ptsSrc = Array.isArray(it.points) ? it.points : [];
            if (!ptsSrc.length) continue;

            const pts = ptsSrc.map((p: any) => cfProjectWorldPoint(p, view));
            const screenWidth = Math.max(0.75, cfNum(it.width, 1) * cfNum(view.scale, 1));
            const bb = cfBBoxFromScreenPoints(pts, screenWidth / 2 + 2);
            const vis = cfIntersectViewport(bb, vw, vh);
            if (!vis) continue;

            out.push({
                k: (it.tool === 'eraser') ? 'e' : 'p',
                c: String(it.color || getAutoPen()),
                a: cfClamp(cfNum(it.alpha, 1), 0, 1),
                w: cfRound(screenWidth),
                p: pts.map((p: { x: number; y: number }) => [cfRound(p.x), cfRound(p.y)])
            });
            continue;
        }

        if (it.kind === 'rect') {
            const a = cfProjectWorldPoint({ x: it.x0, y: it.y0 }, view);
            const b = cfProjectWorldPoint({ x: it.x1, y: it.y1 }, view);
            const bb = cfNormalizeRect(a.x, a.y, b.x, b.y);
            const vis = cfIntersectViewport(bb, vw, vh);
            if (!vis) continue;

            const alpha = cfClamp(cfNum(it.alpha, 0.28), 0, 1);
            const fill = it.color
                ? rgbaFromAny(it.color, alpha)
                : rgbaFromAny(getAccentCssVar(), alpha);

            out.push({
                k: 'r',
                f: fill || rectFillDefault,
                x: cfRound(bb.x),
                y: cfRound(bb.y),
                w: cfRound(bb.w),
                h: cfRound(bb.h)
            });
        }
    }

    return { vw, vh, items: out };
}

// ---------------------------------------------------------------------------
// Painting
// ---------------------------------------------------------------------------

function cfPaintFreezeItems(ctx: CanvasRenderingContext2D, items: any[]): void {
    const list = Array.isArray(items) ? items : [];

    for (let i = 0; i < list.length; i++) {
        const it = list[i];
        if (!it) continue;

        if (it.k === 'r') {
            ctx.save();
            ctx.globalCompositeOperation = 'source-over';
            ctx.globalAlpha = 1;
            ctx.fillStyle = String(it.f || 'rgba(0,0,0,0.15)');
            ctx.fillRect(cfNum(it.x, 0), cfNum(it.y, 0), Math.max(0, cfNum(it.w, 0)), Math.max(0, cfNum(it.h, 0)));
            ctx.restore();
            continue;
        }

        const pts = Array.isArray(it.p) ? it.p : [];
        if (!pts.length) continue;

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(cfNum(pts[0][0], 0), cfNum(pts[0][1], 0));
        for (let j = 1; j < pts.length; j++) {
            ctx.lineTo(cfNum(pts[j][0], 0), cfNum(pts[j][1], 0));
        }
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = Math.max(0.75, cfNum(it.w, 1));

        if (it.k === 'e') {
            ctx.globalCompositeOperation = 'destination-out';
            ctx.globalAlpha = 1;
            ctx.strokeStyle = 'rgba(0,0,0,1)';
        } else {
            ctx.globalCompositeOperation = 'source-over';
            ctx.globalAlpha = cfClamp(cfNum(it.a, 1), 0, 1);
            ctx.strokeStyle = String(it.c || '#000');
        }
        ctx.stroke();
        ctx.restore();
    }
}

function cfComputeAlphaBBox(canvas: HTMLCanvasElement, pad: number): BBox | null {
    if (!canvas) return null;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;
    const W = canvas.width | 0;
    const H = canvas.height | 0;
    if (!(W > 0 && H > 0)) return null;

    const img = ctx.getImageData(0, 0, W, H);
    const d = img.data;
    let xMin = W, yMin = H, xMax = -1, yMax = -1;

    for (let y = 0; y < H; y++) {
        const row = y * W * 4;
        for (let x0 = 0; x0 < W; x0++) {
            if (d[row + x0 * 4 + 3] <= 10) continue;
            if (x0 < xMin) xMin = x0;
            if (y < yMin) yMin = y;
            if (x0 > xMax) xMax = x0;
            if (y > yMax) yMax = y;
        }
    }

    if (xMax < 0) return null;

    const p = Math.max(0, Math.round(cfNum(pad, 0)));
    return {
        x: Math.max(0, xMin - p),
        y: Math.max(0, yMin - p),
        w: Math.max(1, Math.min(W - 1, xMax + p) - Math.max(0, xMin - p) + 1),
        h: Math.max(1, Math.min(H - 1, yMax + p) - Math.max(0, yMin - p) + 1)
    };
}

function cfRebaseFreezeItems(items: any[], crop: BBox | null): any[] {
    const list = Array.isArray(items) ? items : [];
    const dx = cfNum(crop && crop.x, 0);
    const dy = cfNum(crop && crop.y, 0);

    return list.map(it => {
        if (!it) return null;
        if (it.k === 'r') {
            return {
                k: 'r',
                f: String(it.f || ''),
                x: cfRound(cfNum(it.x, 0) - dx),
                y: cfRound(cfNum(it.y, 0) - dy),
                w: cfRound(cfNum(it.w, 0)),
                h: cfRound(cfNum(it.h, 0))
            };
        }
        return {
            k: it.k === 'e' ? 'e' : 'p',
            c: String(it.c || ''),
            a: cfClamp(cfNum(it.a, 1), 0, 1),
            w: cfRound(cfNum(it.w, 1)),
            p: (Array.isArray(it.p) ? it.p : []).map((pt: any) => [
                cfRound(cfNum(pt && pt[0], 0) - dx),
                cfRound(cfNum(pt && pt[1], 0) - dy)
            ])
        };
    }).filter(Boolean);
}

// ---------------------------------------------------------------------------
// Background recipe
// ---------------------------------------------------------------------------

function cfBuildBackgroundRecipe(entry: any, crop: BBox | null): any {
    const src = (entry && typeof entry === 'object') ? entry : {};
    const view = cfCloneView(src.VIEW || {});
    const mode = String(src.bgMode || 'none');

    if (mode !== 'grid' && mode !== 'lined') return { m: 'none' };

    const stepWorld = Math.max(1, cfNum(src.bgStep, 24));
    const stepPx = stepWorld * Math.max(0.0001, cfNum(view.scale, 1));
    if (!(stepPx > 0)) return { m: 'none' };

    const cropX = cfNum(crop && crop.x, 0);
    const cropY = cfNum(crop && crop.y, 0);

    return {
        m: mode,
        s: cfRound(stepPx),
        ox: cfRound(cfMod(cfNum(view.panX, 0) - cropX, stepPx)),
        oy: cfRound(cfMod(cfNum(view.panY, 0) - cropY, stepPx)),
        c: rgbaFromAny(getAccentCssVar(), 0.65),
        lw: 1.125
    };
}

function cfPaintBackground(ctx: CanvasRenderingContext2D, bg: any, w: number, h: number): void {
    const spec = (bg && typeof bg === 'object') ? bg : {};
    const mode = String(spec.m || 'none');
    if (mode !== 'grid' && mode !== 'lined') return;

    const step = Math.max(1, cfNum(spec.s, 1));
    const ox = cfMod(cfNum(spec.ox, 0), step);
    const oy = cfMod(cfNum(spec.oy, 0), step);
    const col = String(spec.c || rgbaFromAny(getAccentCssVar(), 0.65));
    const lw = Math.max(0.5, cfNum(spec.lw, 1.125));

    ctx.save();
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.strokeStyle = col;
    ctx.lineWidth = lw;
    ctx.beginPath();

    if (mode === 'grid') {
        for (let x = ox; x <= w; x += step) { ctx.moveTo(x, 0); ctx.lineTo(x, h); }
        for (let y = oy; y <= h; y += step) { ctx.moveTo(0, y); ctx.lineTo(w, y); }
    } else {
        for (let y = oy; y <= h; y += step) { ctx.moveTo(0, y); ctx.lineTo(w, y); }
    }

    ctx.stroke();
    ctx.restore();
}

// ---------------------------------------------------------------------------
// Export / render
// ---------------------------------------------------------------------------

function cfExportCanvasFreezeStateFromEntry(uid: string, entry: any): any {
    if (!uid || !entry) return null;

    const built = cfBuildScreenItemsFromEntry(entry);
    const vw = Math.max(1, built.vw | 0);
    const vh = Math.max(1, built.vh | 0);
    const items = Array.isArray(built.items) ? built.items : [];

    const off = document.createElement('canvas');
    off.width = vw;
    off.height = vh;
    const ox = off.getContext('2d', { willReadFrequently: true })!;
    ox.clearRect(0, 0, vw, vh);
    cfPaintFreezeItems(ox, items);

    const crop = cfComputeAlphaBBox(off, 8);

    if (!crop) {
        return { v: 'cvf1', u: String(uid), e: 1, w: 0, h: 0, bg: { m: 'none' }, it: [] };
    }

    return {
        v: 'cvf1',
        u: String(uid),
        w: crop.w,
        h: crop.h,
        bg: cfBuildBackgroundRecipe(entry, crop),
        it: cfRebaseFreezeItems(items, crop)
    };
}

function cfExportCanvasFreezeStateFromPair(pair: Element): any {
    const uid = cfGetCanvasUidFromPair(pair);
    if (!uid) return null;
    const entry = cfGetCanvasStoreEntry(uid);
    if (!entry) return null;
    return cfExportCanvasFreezeStateFromEntry(uid, entry);
}

function cfExportAllCanvasFreezeStatesFromRoot(root: Element | Document): any[] {
    const pairs = cfCollectCanvasPairsFromRoot(root);
    const out: any[] = [];
    for (let i = 0; i < pairs.length; i++) {
        const state = cfExportCanvasFreezeStateFromPair(pairs[i]);
        if (state) out.push(state);
    }
    return out;
}

function cfHasCanvasFreezeContent(state: any): boolean {
    return !!(
        state &&
        state.e !== 1 &&
        cfNum(state.w, 0) > 0 &&
        cfNum(state.h, 0) > 0 &&
        Array.isArray(state.it) &&
        state.it.length
    );
}

function cfPaintCanvasFreezeStateToCanvas(canvas: HTMLCanvasElement, state: any): HTMLCanvasElement | null {
    if (!canvas || !state) return null;

    const w = Math.max(1, Math.round(cfNum(state.w, 1)));
    const h = Math.max(1, Math.round(cfNum(state.h, 1)));
    const dpr = window.devicePixelRatio || 1;

    canvas.width = Math.max(1, Math.round(w * dpr));
    canvas.height = Math.max(1, Math.round(h * dpr));
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';

    const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    cfPaintBackground(ctx, state.bg || { m: 'none' }, w, h);
    cfPaintFreezeItems(ctx, Array.isArray(state.it) ? state.it : []);

    return canvas;
}

function cfRenderCanvasFreezeStateIntoMount(mount: Element, state: any): Element | null {
    if (!mount || !(mount instanceof Element) || !state) return null;

    (mount as HTMLElement).dataset.open = '1';
    mount.innerHTML = '';

    if (!cfHasCanvasFreezeContent(state)) {
        const empty = document.createElement('span');
        empty.className = 'lia-canvas-freeze-empty';
        empty.textContent = 'No visible canvas content frozen.';
        mount.appendChild(empty);
        return empty;
    }

    const block = document.createElement('span');
    block.className = 'lia-draw-block';
    const wrap = document.createElement('span');
    wrap.className = 'lia-draw-wrap';
    const canvas = document.createElement('canvas');
    canvas.className = 'lia-canvas-freeze-preview';
    canvas.setAttribute('aria-label', 'Frozen drawing area');

    wrap.appendChild(canvas);
    block.appendChild(wrap);
    mount.appendChild(block);
    cfPaintCanvasFreezeStateToCanvas(canvas, state);
    return canvas;
}

function cfRenderCanvasFreezeStateIntoPair(pair: Element, state: any): Element | null {
    const mount = cfGetCanvasMountFromPair(pair);
    if (!mount) return null;
    return cfRenderCanvasFreezeStateIntoMount(mount, state);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function ensureCanvasFreezeApi(): any {
    const api = LIA.freeze || {};

    api.version = 'cvf1';
    api.collectCanvasPairsFromRoot = cfCollectCanvasPairsFromRoot;
    api.getCanvasMountFromPair = cfGetCanvasMountFromPair;
    api.getCanvasUidFromPair = cfGetCanvasUidFromPair;
    api.getCanvasStoreEntry = cfGetCanvasStoreEntry;
    api.exportCanvasFreezeStateFromEntry = cfExportCanvasFreezeStateFromEntry;
    api.exportCanvasFreezeStateFromPair = cfExportCanvasFreezeStateFromPair;
    api.exportAllCanvasFreezeStatesFromRoot = cfExportAllCanvasFreezeStatesFromRoot;
    api.hasCanvasFreezeContent = cfHasCanvasFreezeContent;
    api.paintCanvasFreezeStateToCanvas = cfPaintCanvasFreezeStateToCanvas;
    api.renderCanvasFreezeStateIntoMount = cfRenderCanvasFreezeStateIntoMount;
    api.renderCanvasFreezeStateIntoPair = cfRenderCanvasFreezeStateIntoPair;

    LIA.freeze = api;
    return api;
}
