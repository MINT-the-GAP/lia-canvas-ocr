// Data-only canvas snapshots for frequent progress saves. No DOM or raster work.
import {
    sanitizeCalculationReviewFreezeState,
    type CalculationReviewFreezeState
} from './calculation-freeze.ts';

export const CANVAS_LIVE_STATE_VERSION = 'cvl1' as const;
type DeepReadonly<T> = T extends readonly (infer U)[]
    ? readonly DeepReadonly<U>[]
    : T extends object ? { readonly [K in keyof T]: DeepReadonly<T[K]> } : T;

export type CanvasLiveJSONValue = null | boolean | number | string |
    readonly CanvasLiveJSONValue[] | { readonly [key: string]: CanvasLiveJSONValue };

export interface CanvasLivePoint { readonly x: number; readonly y: number; }
export interface CanvasLivePath {
    readonly kind: 'path';
    readonly tool: 'pen' | 'eraser';
    readonly color: string;
    readonly alpha: number;
    readonly width: number;
    readonly points: readonly CanvasLivePoint[];
}
export interface CanvasLiveRect {
    readonly kind: 'rect';
    readonly x0: number;
    readonly y0: number;
    readonly x1: number;
    readonly y1: number;
    readonly alpha: number;
    readonly color?: string;
    readonly colorKey?: string;
}
export type CanvasLiveItem = CanvasLivePath | CanvasLiveRect;
export interface CanvasLiveView {
    readonly panX: number;
    readonly panY: number;
    readonly scale: number;
    readonly minScale: number;
    readonly maxScale: number;
}
export interface CanvasLiveOCRState {
    readonly editableText: string;
    readonly stale?: boolean;
    readonly writtenSubmission?: { readonly [key: string]: CanvasLiveJSONValue } | null;
}

/**
 * Full, unrounded world geometry in drawing order, including eraser paths and
 * offscreen content. REDO retains stack order. VIEW maps world coordinates to
 * CSS pixels: x * scale + panX / y * scale + panY. wrapW/canvasH are viewport
 * dimensions; bgStep is in world units. Review uses the existing cr1 schema.
 * editorDraft is current editor text; ocr preserves the committed OCR result.
 *
 * All nested values are immutable and may be shared between revisions.
 * Restore through restoreCanvasLiveStateByUID to obtain mutable editing data.
 */
export interface CanvasLiveStateV1 {
    readonly v: typeof CANVAS_LIVE_STATE_VERSION;
    readonly ITEMS: readonly CanvasLiveItem[];
    readonly REDO: readonly CanvasLiveItem[];
    readonly VIEW: CanvasLiveView;
    readonly bgMode: 'none' | 'grid' | 'lined';
    readonly bgStep: number;
    readonly wrapW: number;
    readonly canvasH: number;
    readonly calculationReviewFreeze?: DeepReadonly<CalculationReviewFreezeState>;
    readonly editorDraft?: string;
    readonly ocr?: CanvasLiveOCRState;
}
export interface CanvasLiveSnapshot {
    readonly uid: string;
    readonly revision: number;
    readonly state: CanvasLiveStateV1;
}
interface LiveRecord { entry: any; revision: number; snapshot?: CanvasLiveSnapshot; }
interface PathCache { sourcePoints: any[]; value: CanvasLivePath; }

const records = new Map<string, LiveRecord>();
const pathCache = new WeakMap<object, PathCache>();
const rectCache = new WeakMap<object, CanvasLiveRect>();
const reviewCache = new WeakMap<object, DeepReadonly<CalculationReviewFreezeState>>();
const ocrCache = new WeakMap<object, CanvasLiveOCRState>();
const EMPTY_ITEMS: readonly CanvasLiveItem[] = Object.freeze([]);

function isRecord(value: unknown): value is Record<string, any> {
    return !!value && typeof value === 'object' && !Array.isArray(value);
}
function finite(value: unknown): value is number {
    return typeof value === 'number' && Number.isFinite(value);
}
function numberOr(value: unknown, fallback: number): number {
    return finite(value) ? value : fallback;
}
function recordFor(uid: string): LiveRecord {
    let record = records.get(uid);
    if (!record) {
        record = { entry: null, revision: 0 };
        records.set(uid, record);
    }
    return record;
}

/** Publish a changed store entry. O(1); never clones geometry. */
export function publishCanvasLiveEntry(uid: string, entry: any): number {
    if (!uid || !isRecord(entry)) return 0;
    const record = recordFor(uid);
    record.entry = entry;
    return ++record.revision;
}

/**
 * Notify an in-place edit, including each appended stroke point. O(1).
 * Existing path points are immutable internally: append new points, or replace
 * the points array to edit existing coordinates. Replace review/OCR objects.
 * This lets export reuse unchanged strokes without scanning their points.
 */
export function touchCanvasLiveEntry(uid: string): number {
    return uid ? ++recordFor(uid).revision : 0;
}

/** O(1). Entry replacement also detects legacy restore through the raw store. */
export function getCanvasLiveRevision(uid: string, entry: any): number {
    if (!uid || !isRecord(entry)) return 0;
    const record = recordFor(uid);
    if (record.entry !== entry) {
        record.entry = entry;
        record.revision++;
    }
    return record.revision;
}

function snapshotPath(item: any): CanvasLivePath {
    const points: any[] = Array.isArray(item.points) ? item.points : [];
    const previous = pathCache.get(item);
    const old = previous?.value;
    const tool = item.tool === 'eraser' ? 'eraser' : 'pen';
    const color = typeof item.color === 'string' ? item.color : '#000';
    const alpha = numberOr(item.alpha, 1);
    const width = numberOr(item.width, 1);
    if (old && previous!.sourcePoints === points && old.points.length === points.length &&
        old.tool === tool && old.color === color && old.alpha === alpha && old.width === width) return old;

    let frozenPoints: readonly CanvasLivePoint[];
    if (old && previous!.sourcePoints === points && old.points.length === points.length) {
        frozenPoints = old.points;
    } else {
        // Active paths are append-only: reuse their already frozen point prefix.
        const copied = old && previous!.sourcePoints === points && old.points.length <= points.length
            ? old.points.slice() : [];
        for (let index = copied.length; index < points.length; index++) {
            copied.push(Object.freeze({ x: points[index].x, y: points[index].y }));
        }
        frozenPoints = Object.freeze(copied);
    }
    const value: CanvasLivePath = Object.freeze({
        kind: 'path', tool, color, alpha, width, points: frozenPoints
    });
    pathCache.set(item, { sourcePoints: points, value });
    return value;
}

function snapshotRect(item: any): CanvasLiveRect {
    const old = rectCache.get(item);
    if (old && old.x0 === item.x0 && old.y0 === item.y0 && old.x1 === item.x1 &&
        old.y1 === item.y1 && old.alpha === item.alpha &&
        old.color === item.color && old.colorKey === item.colorKey) return old;
    const value: CanvasLiveRect = Object.freeze({
        kind: 'rect', x0: item.x0, y0: item.y0, x1: item.x1, y1: item.y1,
        alpha: item.alpha,
        ...(typeof item.color === 'string' ? { color: item.color } : {}),
        ...(typeof item.colorKey === 'string' ? { colorKey: item.colorKey } : {})
    });
    rectCache.set(item, value);
    return value;
}

function snapshotItems(source: unknown, previous?: readonly CanvasLiveItem[]): readonly CanvasLiveItem[] {
    if (!Array.isArray(source) || !source.length) return EMPTY_ITEMS;
    const result: CanvasLiveItem[] = [];
    let unchanged = !!previous && previous.length === source.length;
    for (const item of source) {
        if (!isRecord(item) || (item.kind !== 'path' && item.kind !== 'rect')) continue;
        const value = item.kind === 'path' ? snapshotPath(item) : snapshotRect(item);
        if (previous?.[result.length] !== value) unchanged = false;
        result.push(value);
    }
    return unchanged && previous ? previous : Object.freeze(result);
}

function snapshotView(source: any, previous?: CanvasLiveView): CanvasLiveView {
    const view = isRecord(source) ? source : {};
    const value: CanvasLiveView = {
        panX: numberOr(view.panX, 0), panY: numberOr(view.panY, 0),
        scale: numberOr(view.scale, 1), minScale: numberOr(view.minScale, 0.25),
        maxScale: numberOr(view.maxScale, 8)
    };
    if (previous && previous.panX === value.panX && previous.panY === value.panY &&
        previous.scale === value.scale && previous.minScale === value.minScale &&
        previous.maxScale === value.maxScale) return previous;
    return Object.freeze(value);
}

function snapshotReview(source: any): DeepReadonly<CalculationReviewFreezeState> | undefined {
    if (!isRecord(source)) return undefined;
    const old = reviewCache.get(source);
    if (old) return old;
    // Store reviews were validated on creation/restore. The sanitizer serializes
    // review text for a transport-size check, so it must stay off this hot path.
    const value = Object.freeze({
        v: source.v,
        lines: Object.freeze(source.lines.slice()),
        state: source.state,
        checks: Object.freeze(source.checks.map((check: any) => Object.freeze({ ...check }))),
        ...(source.stale === 1 ? { stale: 1 as const } : {})
    }) as DeepReadonly<CalculationReviewFreezeState>;
    reviewCache.set(source, value);
    return value;
}

function cloneJSON(value: unknown, freeze: boolean, ancestors = new Set<object>()): CanvasLiveJSONValue {
    if (value === null || typeof value === 'string' || typeof value === 'boolean' || finite(value)) return value;
    if (!value || typeof value !== 'object' || ancestors.has(value)) throw new TypeError('Invalid canvas live JSON data');
    ancestors.add(value);
    let result: CanvasLiveJSONValue;
    if (Array.isArray(value)) {
        const array = value.map(item => cloneJSON(item, freeze, ancestors));
        result = freeze ? Object.freeze(array) : array;
    } else {
        const object: Record<string, CanvasLiveJSONValue> = {};
        for (const key of Object.keys(value)) {
            // defineProperty preserves a JSON "__proto__" key as ordinary data.
            Object.defineProperty(object, key, {
                value: cloneJSON((value as Record<string, unknown>)[key], freeze, ancestors),
                enumerable: true, configurable: true, writable: true
            });
        }
        result = freeze ? Object.freeze(object) : object;
    }
    ancestors.delete(value);
    return result;
}

function snapshotOCR(source: any): CanvasLiveOCRState | undefined {
    if (!isRecord(source)) return undefined;
    const old = ocrCache.get(source);
    if (old) return old;
    const value: CanvasLiveOCRState = Object.freeze({
        editableText: source.editableText,
        ...(typeof source.stale === 'boolean' ? { stale: source.stale } : {}),
        ...(source.writtenSubmission !== undefined
            ? { writtenSubmission: cloneJSON(source.writtenSubmission, true) as CanvasLiveOCRState['writtenSubmission'] } : {})
    });
    ocrCache.set(source, value);
    return value;
}

/** Stable revisions return the identical snapshot in O(1), without any pixels. */
export function exportCanvasLiveSnapshot(uid: string, entry: any): CanvasLiveSnapshot | null {
    if (!uid || !isRecord(entry)) return null;
    const revision = getCanvasLiveRevision(uid, entry);
    const record = recordFor(uid);
    if (record.snapshot?.revision === revision) return record.snapshot;
    const previous = record.snapshot?.state;
    const review = snapshotReview(entry.calculationReviewFreeze);
    const ocr = snapshotOCR(entry.ocr);
    const state: CanvasLiveStateV1 = Object.freeze({
        v: CANVAS_LIVE_STATE_VERSION,
        ITEMS: snapshotItems(entry.ITEMS, previous?.ITEMS),
        REDO: snapshotItems(entry.REDO, previous?.REDO),
        VIEW: snapshotView(entry.VIEW, previous?.VIEW),
        bgMode: entry.bgMode === 'grid' || entry.bgMode === 'lined' ? entry.bgMode : 'none',
        bgStep: numberOr(entry.bgStep, 24),
        wrapW: numberOr(entry.wrapW, 1),
        canvasH: numberOr(entry.canvasH, 1),
        ...(review ? { calculationReviewFreeze: review } : {}),
        ...(ocr ? { ocr } : {}),
        ...(typeof entry.editorDraft === 'string' ? { editorDraft: entry.editorDraft } : {})
    });
    record.snapshot = Object.freeze({ uid, revision, state });
    return record.snapshot;
}

function cloneItemsForRestore(source: unknown): any[] | null {
    if (!Array.isArray(source)) return null;
    const result: any[] = [];
    for (const item of source) {
        if (!isRecord(item) || !finite(item.alpha) || item.alpha < 0 || item.alpha > 1) return null;
        if (item.kind === 'path') {
            if ((item.tool !== 'pen' && item.tool !== 'eraser') ||
                typeof item.color !== 'string' || !finite(item.width) || item.width <= 0 ||
                !Array.isArray(item.points)) return null;
            const points: { x: number; y: number }[] = [];
            for (const point of item.points) {
                if (!isRecord(point) || !finite(point.x) || !finite(point.y)) return null;
                points.push({ x: point.x, y: point.y });
            }
            result.push({ kind: 'path', tool: item.tool, color: item.color,
                alpha: item.alpha, width: item.width, points });
        } else if (item.kind === 'rect') {
            if (![item.x0, item.y0, item.x1, item.y1].every(finite) ||
                (item.color !== undefined && typeof item.color !== 'string') ||
                (item.colorKey !== undefined && typeof item.colorKey !== 'string')) return null;
            result.push({
                kind: 'rect', x0: item.x0, y0: item.y0, x1: item.x1, y1: item.y1,
                alpha: item.alpha,
                ...(item.color !== undefined ? { color: item.color } : {}),
                ...(item.colorKey !== undefined ? { colorKey: item.colorKey } : {})
            });
        } else return null;
    }
    return result;
}

/** Validate external cvl1 data and detach every editable value for restoration. */
export function cloneCanvasLiveStateForRestore(state: unknown): Record<string, any> | null {
    if (!isRecord(state) || state.v !== CANVAS_LIVE_STATE_VERSION ||
        !isRecord(state.VIEW) || !finite(state.wrapW) || state.wrapW <= 0 ||
        !finite(state.canvasH) || state.canvasH <= 0 ||
        !finite(state.bgStep) || state.bgStep <= 0 ||
        !['none', 'grid', 'lined'].includes(state.bgMode) ||
        (state.editorDraft !== undefined && typeof state.editorDraft !== 'string')) return null;
    const view = state.VIEW;
    if (![view.panX, view.panY, view.scale, view.minScale, view.maxScale].every(finite) ||
        view.scale <= 0 || view.minScale <= 0 || view.maxScale < view.minScale) return null;
    const items = cloneItemsForRestore(state.ITEMS);
    const redo = cloneItemsForRestore(state.REDO);
    if (!items || !redo) return null;
    const review = state.calculationReviewFreeze === undefined
        ? null : sanitizeCalculationReviewFreezeState(state.calculationReviewFreeze);
    if (state.calculationReviewFreeze !== undefined && !review) return null;
    let ocr: Record<string, any> | undefined;
    if (state.ocr !== undefined) {
        if (!isRecord(state.ocr) || typeof state.ocr.editableText !== 'string' ||
            (state.ocr.stale !== undefined && typeof state.ocr.stale !== 'boolean') ||
            (state.ocr.writtenSubmission !== undefined && state.ocr.writtenSubmission !== null &&
                !isRecord(state.ocr.writtenSubmission))) return null;
        try {
            ocr = {
                editableText: state.ocr.editableText,
                ...(state.ocr.stale !== undefined ? { stale: state.ocr.stale } : {}),
                ...(state.ocr.writtenSubmission !== undefined
                    ? { writtenSubmission: cloneJSON(state.ocr.writtenSubmission, false) } : {})
            };
        } catch (_) { return null; }
    }
    return {
        VIEW: { panX: view.panX, panY: view.panY, scale: view.scale,
            minScale: view.minScale, maxScale: view.maxScale },
        ITEMS: items, REDO: redo,
        bgMode: state.bgMode, bgStep: state.bgStep,
        wrapW: state.wrapW, canvasH: state.canvasH,
        ...(review ? { calculationReviewFreeze: review } : {}),
        ...(ocr ? { ocr } : {}),
        ...(state.editorDraft !== undefined ? { editorDraft: state.editorDraft } : {})
    };
}
