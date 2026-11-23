import { findOcrLineBands, selectOcrStructuralBars, selectOcrStructuralDelimiters } from './layout.ts';
import { mergeSpatialOcrLineBands } from './spatial-layout.ts';
import { classifyOcrVerticalSymbolPath, findOcrDelimiterHints, type OcrSymbolBox, type OcrSymbolPath } from './symbol-geometry.ts';

type OcrVectorLayout = {
    kind: 'column' | 'row';
    components: OcrSymbolBox[];
};

const MAX_COMPONENTS = 16;

/**
 * Recognize a standalone vector only when the selected ink has visible outer
 * parentheses and either distinct coordinate rows or isolated separator strokes.
 */
export function findOcrVectorLayout(
    { data, width, height }: ImageData,
    paths: readonly OcrSymbolPath[],
    scale: number
): OcrVectorLayout | null {
    const delimiters = findOcrDelimiterHints(paths)
        .filter(hint => hint.kind === 'round-open' || hint.kind === 'round-close')
        .sort((a, b) => a.x0 - b.x0);
    const left = delimiters[0];
    const right = delimiters[delimiters.length - 1];
    if (left?.kind !== 'round-open' || right?.kind !== 'round-close') return null;

    const mask = new Uint8Array(width * height);
    const columns = new Uint32Array(width);
    const ink = { x0: width, x1: -1, y0: height, y1: -1 };
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const i = y * width + x;
            if (data[i * 4] >= 128) continue;
            mask[i] = 1;
            columns[x]++;
            ink.x0 = Math.min(ink.x0, x);
            ink.x1 = Math.max(ink.x1, x);
            ink.y0 = Math.min(ink.y0, y);
            ink.y1 = y;
        }
    }
    const tolerance = Math.ceil(scale * 2);
    if (ink.x0 < left.x0 - tolerance || ink.x1 > right.x1 + tolerance ||
        ink.y0 < Math.min(left.y0, right.y0) - tolerance ||
        ink.y1 > Math.max(left.y1, right.y1) + tolerance ||
        selectOcrStructuralDelimiters([left, right], ink, columns, scale, mask).length !== 2) {
        return null;
    }

    const x0 = Math.max(0, Math.floor(left.x1) + 1);
    const x1 = Math.min(width - 1, Math.ceil(right.x0) - 1);
    const delimiterPaths = new Set([...left.pathIndexes, ...right.pathIndexes]);
    // Cutting the delimiter strips must leave the coordinate strokes intact.
    if (paths.some((path, index) => !delimiterPaths.has(index) &&
        path.points.some(point => point.x - (path.strokeWidth ?? scale) / 2 < x0 ||
            point.x + (path.strokeWidth ?? scale) / 2 > x1))) return null;
    const rows = new Uint32Array(height);
    for (let y = ink.y0; y <= ink.y1; y++) {
        const offset = y * width;
        mask.fill(0, offset, offset + x0);
        mask.fill(0, offset + x1 + 1, offset + width);
        for (let x = x0; x <= x1; x++) rows[y] += mask[offset + x];
    }
    const bands = mergeSpatialOcrLineBands(mask, width,
        findOcrLineBands(rows, x1 - x0 + 1, scale, 'local-scale'), scale);
    if (bands.length >= 2 && bands.length <= MAX_COMPONENTS &&
        bands[0].y0 >= Math.max(left.y0, right.y0) - tolerance &&
        bands[bands.length - 1].y1 <= Math.min(left.y1, right.y1) + tolerance &&
        bands.every(band => band.ink >= 4 * scale)) {
        return { kind: 'column', components: bands.map(({ y0, y1 }) => ({ x0, x1, y0, y1 })) };
    }
    if (bands.length !== 1) return null;

    const { y0, y1 } = ink;
    const minimumBarHeight = Math.max(left.y1 - left.y0, right.y1 - right.y0) * 0.55;
    const separatorGap = Math.max(1, Math.round(scale * 2));
    const bars = selectOcrStructuralBars(paths.flatMap((path, index) => {
        if (delimiterPaths.has(index) ||
            classifyOcrVerticalSymbolPath(paths, index) !== 'hookless-bar') return [];
        const xs = path.points.map(point => point.x);
        const ys = path.points.map(point => point.y);
        const padding = (path.strokeWidth ?? scale) / 2;
        const loX = Math.floor(Math.min(...xs) - padding);
        const hiX = Math.ceil(Math.max(...xs) + padding);
        const loY = Math.floor(Math.min(...ys) - padding);
        const hiY = Math.ceil(Math.max(...ys) + padding);
        if (loX - separatorGap < x0 || hiX + separatorGap > x1 ||
            hiY - loY < minimumBarHeight ||
            columns.subarray(loX - separatorGap, loX).some(Boolean) ||
            columns.subarray(hiX + 1, hiX + separatorGap + 1).some(Boolean)) return [];
        let visibleRows = 0;
        for (let y = Math.max(loY, y0); y <= Math.min(hiY, y1); y++) {
            if (mask.subarray(y * width + loX, y * width + hiX + 1).some(Boolean)) visibleRows++;
        }
        if (visibleRows < (hiY - loY + 1) * 0.68) return [];
        const first = path.points[0];
        const last = path.points[path.points.length - 1];
        return [{
            x0: loX, x1: hiX, y0: loY, y1: hiY, hasTopHook: false,
            slantRatio: Math.abs(last.x - first.x) / Math.max(1, Math.abs(last.y - first.y))
        }];
    }), { x0, x1, y0, y1 }, columns, scale);
    if (!bars.length || bars.length >= MAX_COMPONENTS) return null;

    const components: OcrSymbolBox[] = [];
    let start = x0;
    for (const bar of bars) {
        components.push({ x0: start, x1: bar.x0 - 1, y0, y1 });
        start = bar.x1 + 1;
    }
    components.push({ x0: start, x1, y0, y1 });
    return components.every(cell => cell.x0 <= cell.x1 &&
        columns.subarray(cell.x0, cell.x1 + 1).some(Boolean))
        ? { kind: 'row', components }
        : null;
}
