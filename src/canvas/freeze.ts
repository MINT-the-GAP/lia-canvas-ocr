// Canvas freeze: export, paint, and render frozen canvas states.

import { LIA } from '../index';
import { isLineFeedbackEnabledForPair } from '../lia/calculation-options';
import { liaT } from '../lia/i18n';
import { __liaRenderTexPreview } from '../lia/input';
import { alignFirstTopLevelRelation } from '../ocr/layout';
import { ensureMountUID } from './store';
import { getAccentCssVar, getAutoPen, rgbaFromAny } from './theme';
import {
    sanitizeCalculationReviewFreezeState,
    type CalculationReviewFreezeCheck,
    type CalculationReviewFreezeState
} from './calculation-freeze';

const CF_REVIEW_STATE_BY_ROOT = new WeakMap<HTMLElement, CalculationReviewFreezeState>();
let cfFreezeTextRefreshQueued = false;

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

function cfGetCanvasStoreEntryRaw(uid: string): any {
    const STORE = cfGetCanvasStore();
    return uid && STORE[uid] ? STORE[uid] : null;
}

/**
 * lia-freeze-v2 asks this public getter for full, uncropped geometry and then
 * rebuilds cvf1 from the drawing store. That older rebuild does not yet know
 * the optional `cr` field. Returning null for a valid review makes it retain
 * the already exported, full-viewport raw state instead. Internal exports use
 * cfGetCanvasStoreEntryRaw and therefore still see the complete store entry.
 */
function cfGetCanvasStoreEntry(uid: string): any {
    const entry = cfGetCanvasStoreEntryRaw(uid);
    const review = sanitizeCalculationReviewFreezeState(
        entry?.calculationReviewFreeze
    );
    if (!review) return entry;

    const activePair = cfCollectCanvasPairsFromRoot(document).some(pair =>
        cfGetCanvasUidFromPair(pair) === uid &&
        isLineFeedbackEnabledForPair(pair)
    );
    return activePair ? null : entry;
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

function cfExportCanvasFreezeStateFromEntry(
    uid: string,
    entry: any,
    includeCalculationReview = true
): any {
    if (!uid || !entry) return null;

    const built = cfBuildScreenItemsFromEntry(entry);
    const vw = Math.max(1, built.vw | 0);
    const vh = Math.max(1, built.vh | 0);
    const items = Array.isArray(built.items) ? built.items : [];
    const calculationReview = includeCalculationReview
        ? sanitizeCalculationReviewFreezeState(entry.calculationReviewFreeze)
        : null;

    // A review-bearing state deliberately uses full viewport geometry. The
    // current lia-freeze-v2 recognizes the extra field as a forward-compatible
    // raw cvf1 state, while the filtered public store getter prevents its older
    // geometry rebuilder from dropping `cr`.
    if (calculationReview) {
        return {
            v: 'cvf1',
            u: String(uid),
            ...(items.length ? {} : { e: 1 }),
            w: vw,
            h: vh,
            bg: cfBuildBackgroundRecipe(entry, null),
            it: items,
            cr: calculationReview
        };
    }

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
    const entry = cfGetCanvasStoreEntryRaw(uid);
    if (!entry) return null;
    const includeCalculationReview = isLineFeedbackEnabledForPair(pair);
    const calculationReview = includeCalculationReview
        ? sanitizeCalculationReviewFreezeState(entry.calculationReviewFreeze)
        : null;
    const canvas = calculationReview
        ? pair.querySelector('canvas.lia-draw') as HTMLCanvasElement | null
        : null;
    const exportEntry = canvas && canvas.clientWidth > 0 && canvas.clientHeight > 0
        ? {
            ...entry,
            wrapW: canvas.clientWidth,
            canvasH: canvas.clientHeight
        }
        : entry;
    return cfExportCanvasFreezeStateFromEntry(
        uid,
        exportEntry,
        includeCalculationReview
    );
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

function cfAppendElement<K extends keyof HTMLElementTagNameMap>(
    parent: HTMLElement,
    tag: K,
    className: string,
    text?: string
): HTMLElementTagNameMap[K] {
    const element = document.createElement(tag);
    element.className = className;
    if (typeof text === 'string') element.textContent = text;
    parent.appendChild(element);
    return element;
}

function cfReplaceTokens(
    template: string,
    values: Record<string, string | number>
): string {
    let output = String(template || '');
    for (const [key, value] of Object.entries(values)) {
        output = output.replace(new RegExp('\\{' + key + '\\}', 'g'), String(value));
    }
    return output;
}

function cfTransitionLabel(
    status: CalculationReviewFreezeCheck['status'] | 'pending',
    from: number,
    to: number,
    stale: boolean
): string {
    const positions = { from: from + 1, to: to + 1 };
    if (stale) {
        return cfReplaceTokens(
            liaT(
                'ocr.plus.validation.transitionStale',
                'Transition from line {from} to line {to}: result is outdated.'
            ),
            positions
        );
    }
    if (status === 'valid') {
        return cfReplaceTokens(
            liaT(
                'ocr.plus.validation.transitionValid',
                'Transition from line {from} to line {to}: correct.'
            ),
            positions
        );
    }
    if (status === 'invalid') {
        return cfReplaceTokens(
            liaT(
                'ocr.plus.validation.freezeTransitionInvalid',
                'Transition from line {from} to line {to}: incorrect.'
            ),
            positions
        );
    }
    if (status === 'unknown') {
        return cfReplaceTokens(
            liaT(
                'ocr.plus.validation.transitionUnknown',
                'Transition from line {from} to line {to}: could not be checked reliably.'
            ),
            positions
        );
    }
    return cfReplaceTokens(
        liaT(
            'ocr.plus.validation.transitionPending',
            'Transition from line {from} to line {to}: checking.'
        ),
        positions
    );
}

function cfCheckMessage(check: CalculationReviewFreezeCheck): string {
    if (check.reason === 'quadratic-root-solutions') {
        return liaT(
            'ocr.plus.validation.validRoots',
            'The plus-minus square-root notation contains both real solutions.'
        );
    }
    if (check.reason === 'quartic-root-solutions') {
        return liaT(
            'ocr.plus.validation.validFourthRoot',
            'The plus-minus fourth-root notation contains both real solutions.'
        );
    }
    if (check.reason === 'cubic-root-solution') {
        return liaT(
            'ocr.plus.validation.validCubeRoot',
            'The cube-root notation gives the unique real solution.'
        );
    }
    if (check.reason === 'missing-plus-minus') {
        return liaT(
            'ocr.plus.validation.missingPlusMinus',
            'The indexed square-root solution is missing the plus-minus sign.'
        );
    }
    if (check.reason === 'cas-unavailable') {
        return liaT(
            'ocr.plus.validation.casUnavailable',
            'The CAS is unavailable. Import LiaTemplates/Algebrite before Canvas OCR.'
        );
    }
    if (check.reason === 'domain-uncertain') {
        return liaT(
            'ocr.plus.validation.unknownDomain',
            'Without the equation domain, this transition cannot be checked safely.'
        );
    }
    if (check.reason === 'operation-applied-both-sides') {
        return liaT(
            'ocr.plus.validation.validOperation',
            'The stated transformation was applied to both sides.'
        );
    }
    if (check.reason === 'operation-missing-left') {
        return liaT(
            'ocr.plus.validation.invalidLeft',
            'The left side does not match the stated transformation.'
        );
    }
    if (check.reason === 'operation-missing-right') {
        return liaT(
            'ocr.plus.validation.invalidRight',
            'The right side does not match the stated transformation.'
        );
    }
    if (check.reason === 'operation-mismatch-both') {
        return liaT(
            'ocr.plus.validation.invalidBoth',
            'Both sides do not match the stated transformation.'
        );
    }
    if (check.reason === 'equivalent-linear-equations') {
        return liaT(
            'ocr.plus.validation.validEquivalent',
            'The two equations are equivalent.'
        );
    }
    if (check.reason === 'different-linear-solutions') {
        return liaT(
            'ocr.plus.validation.invalidEquivalent',
            'The two equations have different solutions.'
        );
    }
    return liaT(
        'ocr.plus.validation.unknown',
        'This transition could not be checked reliably.'
    );
}

function cfReviewSummary(review: CalculationReviewFreezeState): string {
    if (review.stale === 1) {
        return liaT(
            'ocr.plus.validation.stale',
            'The calculation has changed; the previous check is outdated.'
        );
    }
    if (review.state === 'running') {
        return liaT(
            'ocr.plus.validation.running',
            'Checking transitions...'
        );
    }
    if (review.state === 'error') {
        return liaT(
            'ocr.plus.validation.error',
            'The transitions could not be checked.'
        );
    }
    if (!review.checks.length) {
        return liaT(
            'ocr.plus.validation.noTransitions',
            'Add at least two equations to check a transition.'
        );
    }
    if (review.checks.some(check => check.reason === 'cas-unavailable')) {
        return liaT(
            'ocr.plus.validation.casUnavailableSummary',
            'The CAS is unavailable. Import LiaTemplates/Algebrite before Canvas OCR; no transitions were checked.'
        );
    }
    const valid = review.checks.filter(check => check.status === 'valid').length;
    const invalid = review.checks.filter(check => check.status === 'invalid').length;
    const unknown = review.checks.length - valid - invalid;
    const summaryKey = review.checks.length === 1
        ? 'ocr.plus.validation.summaryOne'
        : 'ocr.plus.validation.summary';
    const summaryFallback = review.checks.length === 1
        ? '{count} transition: {valid} correct, {invalid} incorrect, {unknown} not checked.'
        : '{count} transitions: {valid} correct, {invalid} incorrect, {unknown} not checked.';
    return cfReplaceTokens(
        liaT(summaryKey, summaryFallback),
        { count: review.checks.length, valid, invalid, unknown }
    );
}

function cfFreezeEmptyText(): string {
    return liaT(
        'canvas.freeze.empty',
        'No visible canvas content frozen.'
    );
}

function cfFreezeDrawingAreaLabel(): string {
    return liaT(
        'canvas.freeze.drawingArea',
        'Frozen drawing area'
    );
}

function cfRenderFreezeEquationLine(
    parent: HTMLElement,
    line: string,
    index: number
): HTMLElement {
    const row = cfAppendElement(parent, 'div', 'lia-canvasplus-line');
    row.dataset.lineIndex = String(index);
    row.dataset.rawLatex = line;
    const number = cfAppendElement(
        row,
        'span',
        'lia-canvasplus-line-number',
        String(index + 1)
    );
    number.setAttribute('aria-hidden', 'true');

    const equation = cfAppendElement(row, 'div', 'lia-canvasplus-line-equation');
    const aligned = alignFirstTopLevelRelation(line);
    const marker = aligned.indexOf('&');
    if (marker >= 0) {
        equation.dataset.hasRelation = '1';
        const left = cfAppendElement(equation, 'span', 'lia-canvasplus-line-left');
        const right = cfAppendElement(equation, 'span', 'lia-canvasplus-line-right');
        __liaRenderTexPreview(left, aligned.slice(0, marker));
        __liaRenderTexPreview(right, aligned.slice(marker + 1));
    } else {
        equation.dataset.hasRelation = '0';
        const whole = cfAppendElement(equation, 'span', 'lia-canvasplus-line-whole');
        __liaRenderTexPreview(whole, line);
    }
    return row;
}

function cfFreezeTransitionDetail(
    review: CalculationReviewFreezeState,
    index: number
): string {
    const check = review.state === 'ready' ? review.checks[index] : null;
    if (check) return cfCheckMessage(check);
    if (review.state === 'running') {
        return liaT('ocr.plus.validation.checking', 'Checking');
    }
    return liaT(
        'ocr.plus.validation.error',
        'The transitions could not be checked.'
    );
}

function cfRenderFreezeTransition(
    parent: HTMLElement,
    review: CalculationReviewFreezeState,
    index: number
): void {
    const check = review.state === 'ready' ? review.checks[index] : null;
    const status = check?.status || (review.state === 'running' ? 'pending' : 'unknown');
    const verdict = status === 'valid'
        ? 'correct'
        : status === 'invalid'
            ? 'incorrect'
            : status;
    const transition = cfAppendElement(parent, 'div', 'lia-canvasplus-transition');
    transition.dataset.fromIndex = String(index);
    transition.dataset.toIndex = String(index + 1);
    transition.dataset.verdict = verdict;
    transition.dataset.code = check?.reason || (
        review.state === 'running' ? 'pending' : 'analysis-error'
    );
    transition.dataset.expanded = '1';
    if (review.stale === 1) transition.dataset.stale = '1';

    const arrow = cfAppendElement(
        transition,
        'span',
        'lia-canvasplus-transition-arrow',
        '\u2193'
    );
    arrow.setAttribute('aria-hidden', 'true');

    const statusBox = cfAppendElement(
        transition,
        'span',
        'lia-canvasplus-transition-trigger'
    );
    statusBox.setAttribute('role', 'status');
    const labelText = cfTransitionLabel(status, index, index + 1, review.stale === 1);
    statusBox.setAttribute('aria-label', labelText);
    const icon = cfAppendElement(
        statusBox,
        'span',
        'lia-canvasplus-transition-icon',
        status === 'valid'
            ? '\u2713'
            : status === 'invalid'
                ? '\u00d7'
                : status === 'pending'
                    ? '\u2026'
                    : '?'
    );
    icon.setAttribute('aria-hidden', 'true');
    cfAppendElement(
        statusBox,
        'span',
        'lia-canvasplus-transition-label',
        labelText
    );

    const detail = cfAppendElement(
        transition,
        'p',
        'lia-canvasplus-transition-detail',
        cfFreezeTransitionDetail(review, index)
    );
    detail.removeAttribute('hidden');
}

function cfRefreshCalculationReviewFreezeTexts(
    root: HTMLElement,
    value: unknown
): void {
    const review = sanitizeCalculationReviewFreezeState(value);
    if (!review) return;
    CF_REVIEW_STATE_BY_ROOT.set(root, review);

    const title = root.querySelector<HTMLElement>(
        '.lia-canvasplus-standalone-title'
    );
    if (title) {
        title.textContent = liaT(
            'ocr.plus.resultTitle',
            'Rendered calculation block'
        );
    }

    const summary = root.querySelector<HTMLElement>(
        '.lia-canvasplus-analysis-summary'
    );
    if (summary) summary.textContent = cfReviewSummary(review);

    root.querySelector<HTMLElement>('.lia-canvasplus-steps')?.setAttribute(
        'aria-label',
        liaT('ocr.plus.validation.pathLabel', 'Checked calculation path')
    );

    for (let index = 0; index + 1 < review.lines.length; index++) {
        const transition = root.querySelector<HTMLElement>(
            `.lia-canvasplus-transition[data-from-index='${index}']` +
            `[data-to-index='${index + 1}']`
        );
        if (!transition) continue;

        const check = review.state === 'ready' ? review.checks[index] : null;
        const status = check?.status ||
            (review.state === 'running' ? 'pending' : 'unknown');
        const labelText = cfTransitionLabel(
            status,
            index,
            index + 1,
            review.stale === 1
        );
        transition.querySelector<HTMLElement>(
            '.lia-canvasplus-transition-trigger'
        )?.setAttribute('aria-label', labelText);

        const label = transition.querySelector<HTMLElement>(
            '.lia-canvasplus-transition-label'
        );
        if (label) label.textContent = labelText;

        const detail = transition.querySelector<HTMLElement>(
            '.lia-canvasplus-transition-detail'
        );
        if (detail) detail.textContent = cfFreezeTransitionDetail(review, index);
    }
}

function cfRenderCalculationReviewFreezeState(
    parent: HTMLElement,
    value: unknown
): HTMLElement | null {
    const review = sanitizeCalculationReviewFreezeState(value);
    if (!review) return null;

    const root = document.createElement('section');
    root.className = [
        'lia-canvasplus-output',
        'lia-canvasplus-standalone-result',
        'lia-canvas-freeze-calculation-review'
    ].join(' ');
    root.dataset.freezeStatic = '1';
    root.dataset.state = 'ready';
    root.dataset.analysisState = review.state;
    root.dataset.lineCount = String(review.lines.length);
    root.dataset.stale = review.stale === 1 ? '1' : '0';

    const header = cfAppendElement(root, 'header', 'lia-canvas-freeze-review-header');
    const title = cfAppendElement(
        header,
        'h3',
        'lia-canvasplus-standalone-title',
        liaT('ocr.plus.resultTitle', 'Rendered calculation block')
    );
    title.setAttribute('aria-level', '3');
    const summary = cfAppendElement(
        header,
        'p',
        'lia-canvasplus-analysis-summary',
        cfReviewSummary(review)
    );
    summary.dataset.state = review.stale === 1 ? 'stale' : review.state;
    summary.setAttribute('role', 'status');

    const content = cfAppendElement(root, 'div', 'lia-canvasplus-result-content');
    const rendered = cfAppendElement(
        content,
        'div',
        'lia-canvasplus-rendered lia-canvasplus-standalone-math'
    );
    const list = cfAppendElement(
        rendered,
        'ol',
        'lia-canvasplus-steps lia-canvas-freeze-review-steps'
    );
    list.dataset.layout = 'flow';
    list.setAttribute(
        'aria-label',
        liaT('ocr.plus.validation.pathLabel', 'Checked calculation path')
    );

    const rows: HTMLElement[] = [];
    for (let index = 0; index < review.lines.length; index++) {
        const step = cfAppendElement(list, 'li', 'lia-canvasplus-step');
        step.dataset.lineIndex = String(index);
        rows.push(cfRenderFreezeEquationLine(step, review.lines[index], index));
        if (index + 1 < review.lines.length) {
            cfRenderFreezeTransition(step, review, index);
        }
    }

    if (review.state === 'ready') {
        for (let index = 0; index < review.checks.length; index++) {
            const check = review.checks[index];
            if (check.status === 'invalid' && rows[index + 1]) {
                rows[index + 1].dataset.errorSide = check.side || 'whole';
            }
        }
    }

    CF_REVIEW_STATE_BY_ROOT.set(root, review);
    parent.appendChild(root);
    cfRefreshCalculationReviewFreezeTexts(root, review);
    return root;
}

function cfRefreshAllFreezeTexts(): void {
    const emptyText = cfFreezeEmptyText();
    document.querySelectorAll<HTMLElement>('.lia-canvas-freeze-empty').forEach(
        empty => {
            empty.textContent = emptyText;
        }
    );

    const drawingAreaLabel = cfFreezeDrawingAreaLabel();
    document.querySelectorAll<HTMLCanvasElement>(
        'canvas.lia-canvas-freeze-preview'
    ).forEach(canvas => {
        canvas.setAttribute('aria-label', drawingAreaLabel);
    });

    document.querySelectorAll<HTMLElement>(
        '.lia-canvas-freeze-calculation-review[data-freeze-static=\'1\']'
    ).forEach(root => {
        const review = CF_REVIEW_STATE_BY_ROOT.get(root);
        if (review) cfRefreshCalculationReviewFreezeTexts(root, review);
    });
}

function cfOnFreezeI18nUpdate(): void {
    if (cfFreezeTextRefreshQueued) return;
    cfFreezeTextRefreshQueued = true;
    void Promise.resolve().then(() => {
        try {
            cfRefreshAllFreezeTexts();
        } finally {
            cfFreezeTextRefreshQueued = false;
        }
    });
}

function cfEnsureFreezeI18nListener(api: any): void {
    const listener = cfOnFreezeI18nUpdate as EventListener;
    const previous = api.__canvasFreezeI18nListener;
    if (previous === listener) return;
    if (typeof previous === 'function') {
        document.removeEventListener('lia:canvas-i18n-update', previous);
    }
    document.addEventListener('lia:canvas-i18n-update', listener);
    api.__canvasFreezeI18nListener = listener;
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
    mount.replaceChildren();

    const hasDrawing = cfHasCanvasFreezeContent(state);
    const review = sanitizeCalculationReviewFreezeState(state.cr);
    if (!hasDrawing && !review) {
        const empty = document.createElement('span');
        empty.className = 'lia-canvas-freeze-empty';
        empty.textContent = cfFreezeEmptyText();
        mount.appendChild(empty);
        return empty;
    }

    const block = document.createElement('span');
    block.className = 'lia-draw-block lia-canvas-freeze-block';
    mount.appendChild(block);

    let canvas: HTMLCanvasElement | null = null;
    if (hasDrawing) {
        const wrap = document.createElement('span');
        wrap.className = 'lia-draw-wrap';
        canvas = document.createElement('canvas');
        canvas.className = 'lia-canvas-freeze-preview';
        canvas.setAttribute('aria-label', cfFreezeDrawingAreaLabel());
        wrap.appendChild(canvas);
        block.appendChild(wrap);
        cfPaintCanvasFreezeStateToCanvas(canvas, state);
    } else {
        // lia-freeze-v2 uses this marker to recognize an already restored pair.
        const empty = document.createElement('span');
        empty.className = 'lia-canvas-freeze-empty lia-canvas-freeze-drawing-empty';
        empty.textContent = cfFreezeEmptyText();
        block.appendChild(empty);
    }

    const renderedReview = review
        ? cfRenderCalculationReviewFreezeState(block, review)
        : null;
    return canvas || renderedReview;
}

function cfRenderCanvasFreezeStateIntoPair(pair: Element, state: any): Element | null {
    const mount = cfGetCanvasMountFromPair(pair);
    if (!mount) return null;
    const uid = cfGetCanvasUidFromPair(pair);
    const allowReview = isLineFeedbackEnabledForPair(pair) &&
        !!uid && String(state?.u || '') === uid;
    const renderState = allowReview || !state || typeof state !== 'object' ||
        Array.isArray(state)
        ? state
        : { ...state, cr: null };
    return cfRenderCanvasFreezeStateIntoMount(mount, renderState);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function ensureCanvasFreezeApi(): any {
    const api = LIA.freeze || {};
    cfEnsureFreezeI18nListener(api);

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
    api.sanitizeCalculationReviewFreezeState = sanitizeCalculationReviewFreezeState;
    api.renderCalculationReviewFreezeStateIntoMount = (
        mount: HTMLElement,
        state: unknown
    ) => cfRenderCalculationReviewFreezeState(mount, state);

    LIA.freeze = api;
    return api;
}
