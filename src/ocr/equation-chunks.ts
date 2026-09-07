/** Conservative geometry-only splitting of wide equation rows. Nonzero mask pixels are ink. */
export type OcrEquationChunkPlan = {
    /** Source x coordinates, with an exclusive x1. No ink outside the separators is removed. */
    ranges: Array<{ x0: number; x1: number }>;
    separators: Array<{ x0: number; x1: number; token: '=' }>;
    /** Largest token budget of the remaining chunks, not of the original complete row. */
    maxNewTokens: number;
};

type Component = { id: number; x0: number; x1: number; y0: number; y1: number; ink: number };
type Bar = { component: Component; slope: number; thickness: number };
type Delimiter = { component: Component; direction: 'open' | 'close' | 'both' };

/** Pass ink bounds when available. Scaling both dimensions never changes the budget. */
export function getOcrEquationTokenBudget(width: number, height: number): number {
    if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return 64;
    const aspect = width / height;
    return aspect >= 22 ? 256 : aspect >= 10 ? 128 : 64;
}

function componentsOf(mask: Uint8Array, width: number, height: number): Component[] | null {
    const seen = new Uint8Array(mask.length);
    const queue = new Int32Array(mask.length);
    const components: Component[] = [];
    for (let index = 0; index < mask.length; index++) {
        if (!mask[index] || seen[index]) continue;
        // A heavily fragmented/noisy raster is not evidence for structural rewriting.
        if (components.length >= 4096) return null;
        const component: Component = {
            id: components.length, x0: width, x1: 0, y0: height, y1: 0, ink: 0
        };
        let start = 0;
        let end = 1;
        queue[0] = index;
        seen[index] = 1;
        while (start < end) {
            const position = queue[start++];
            const y = Math.floor(position / width);
            const x = position - y * width;
            component.x0 = Math.min(component.x0, x);
            component.x1 = Math.max(component.x1, x + 1);
            component.y0 = Math.min(component.y0, y);
            component.y1 = Math.max(component.y1, y + 1);
            component.ink++;
            for (let ny = Math.max(0, y - 1); ny <= Math.min(height - 1, y + 1); ny++) {
                for (let nx = Math.max(0, x - 1); nx <= Math.min(width - 1, x + 1); nx++) {
                    const next = ny * width + nx;
                    if (mask[next] && !seen[next]) {
                        seen[next] = 1;
                        queue[end++] = next;
                    }
                }
            }
        }
        components.push(component);
    }
    return components;
}

function straightBar(mask: Uint8Array, width: number, component: Component, glyphHeight: number, scale: number): Bar | null {
    const w = component.x1 - component.x0;
    const h = component.y1 - component.y0;
    if (w < 6 * scale || w < h * 3 || h > glyphHeight * 0.24 || w > glyphHeight * 1.5) return null;
    const thickness = component.ink / w;
    if (thickness > glyphHeight * 0.15 || w < thickness * 4) return null;
    const centers: number[] = [];
    let xy = 0;
    let yy = 0;
    const centerX = (w - 1) / 2;
    for (let x = component.x0; x < component.x1; x++) {
        let count = 0;
        let sum = 0;
        for (let y = component.y0; y < component.y1; y++) {
            if (mask[y * width + x]) { count++; sum += y; }
        }
        if (!count || count > Math.max(thickness * 1.8, scale * 2)) return null;
        const center = sum / count;
        centers.push(center);
        xy += (x - component.x0 - centerX) * center;
        yy += center;
    }
    const slope = w > 1 ? xy / (w * (w * w - 1) / 12) : 0;
    if (Math.abs(slope) > 0.12) return null;
    const centerY = yy / w;
    const tolerance = thickness * 0.4 + scale * 0.2;
    for (let x = 0; x < w; x++) {
        if (Math.abs(centers[x] - centerY - slope * (x - centerX)) > tolerance) return null;
    }
    return { component, slope, thickness };
}

// Potential enclosures are vetoes only. This does not assign recognized bracket tokens.
function possibleDelimiter(mask: Uint8Array, width: number, component: Component, glyphHeight: number, scale: number): Delimiter | null {
    const w = component.x1 - component.x0;
    const h = component.y1 - component.y0;
    if (h < glyphHeight * 0.75 || w > h * 0.65) return null;
    const means: number[] = [];
    let broadRows = 0;
    for (let y = component.y0; y < component.y1; y++) {
        let count = 0;
        let sum = 0;
        let first = component.x1;
        let last = component.x0;
        for (let x = component.x0; x < component.x1; x++) {
            if (mask[y * width + x]) { count++; sum += x; first = Math.min(first, x); last = x; }
        }
        if (!count) return null;
        if (last - first + 1 > Math.max(scale * 3, h * 0.28)) broadRows++;
        means.push(sum / count);
    }
    if (broadRows > h * 0.25) return null;
    if (w <= Math.max(scale * 2.5, h * 0.09)) return { component, direction: 'both' };
    const average = (from: number, to: number): number => {
        const a = Math.floor(h * from);
        const b = Math.max(a + 1, Math.ceil(h * to));
        return means.slice(a, b).reduce((sum, value) => sum + value, 0) / (b - a);
    };
    const middle = average(0.4, 0.6);
    // Short horizontal caps on square brackets must not disappear in a band average.
    const outerCenter = (from: number, to: number): number => means
        .slice(Math.floor(h * from), Math.ceil(h * to))
        .reduce((best, value) => Math.abs(value - middle) > Math.abs(best - middle) ? value : best, middle);
    const top = outerCenter(0, 0.2);
    const bottom = outerCenter(0.8, 1);
    if (Math.abs(top - bottom) > Math.max(scale * 2, h * 0.18)) return null;
    const minimumBend = Math.max(scale * 1.1, h * 0.07);
    const bend = (top + bottom) / 2 - middle;
    if (Math.abs(bend) < minimumBend || (top - middle) * (bottom - middle) <= 0
        || Math.min(Math.abs(top - middle), Math.abs(bottom - middle)) < minimumBend * 0.6) return null;
    return { component, direction: bend > 0 ? 'open' : 'close' };
}

function sameVerticalSpan(left: Component, right: Component, glyphHeight: number): boolean {
    return Math.abs(left.y0 - right.y0) <= glyphHeight * 0.3
        && Math.abs(left.y1 - right.y1) <= glyphHeight * 0.3;
}

/**
 * Returns null unless two separate straight bars have positive local equality evidence.
 * Fractions/radicals crossing the corridor, attached strokes, third bars, superscripts,
 * and potential enclosing brackets remain with the complete row. Raster evidence is
 * intentionally insufficient for difficult handwriting: callers must retain a whole-row
 * fallback and validate the independently recognized TeX chunks before joining with '='.
 */
export function planOcrEquationChunks(mask: Uint8Array, width: number, height: number, pixelScale = 1): OcrEquationChunkPlan | null {
    if (!Number.isSafeInteger(width) || !Number.isSafeInteger(height) || width <= 0 || height <= 0
        || width * height !== mask.length || mask.length > 0x7fffffff) return null;
    const scale = Number.isFinite(pixelScale) && pixelScale > 0 ? pixelScale : 1;
    const occupiedColumns = new Uint8Array(width);
    let inkX0 = width;
    let inkX1 = 0;
    let inkY0 = height;
    let inkY1 = 0;
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            if (!mask[y * width + x]) continue;
            occupiedColumns[x] = 1;
            inkX0 = Math.min(inkX0, x); inkX1 = Math.max(inkX1, x + 1);
            inkY0 = Math.min(inkY0, y); inkY1 = Math.max(inkY1, y + 1);
        }
    }
    const inkHeight = inkY1 - inkY0;
    if (inkHeight <= 0 || (inkX1 - inkX0) / inkHeight < 10) return null;
    const components = componentsOf(mask, width, height);
    if (!components || components.length < 4) return null;
    const glyphHeights = components
        .filter(c => c.y1 - c.y0 >= Math.max(scale * 5, inkHeight * 0.25)
            && c.x1 - c.x0 < (c.y1 - c.y0) * 3)
        .map(c => c.y1 - c.y0).sort((a, b) => a - b);
    if (glyphHeights.length < 2) return null;
    const glyphHeight = glyphHeights[Math.floor(glyphHeights.length / 2)];
    // A wide column gutter can separate independent equations on the same row.
    // Do not turn such a page layout into an invented equality chain. Whitespace
    // outside the ink bounds is irrelevant; accepted equality neighbors already
    // have the stricter maximum distance of two glyph heights below.
    let emptyColumns = 0;
    for (let x = inkX0; x < inkX1; x++) {
        emptyColumns = occupiedColumns[x] ? 0 : emptyColumns + 1;
        if (emptyColumns > glyphHeight * 3) return null;
    }
    const bars = components.map(c => straightBar(mask, width, c, glyphHeight, scale))
        .filter((bar): bar is Bar => bar !== null);
    const delimiters = components.map(c => possibleDelimiter(mask, width, c, glyphHeight, scale))
        .filter((delimiter): delimiter is Delimiter => delimiter !== null);
    const separators: OcrEquationChunkPlan['separators'] = [];
    for (let i = 0; i < bars.length; i++) {
        for (let j = i + 1; j < bars.length; j++) {
            let top = bars[i];
            let bottom = bars[j];
            if (top.component.y0 > bottom.component.y0) [top, bottom] = [bottom, top];
            const a = top.component;
            const b = bottom.component;
            const aw = a.x1 - a.x0;
            const bw = b.x1 - b.x0;
            const overlap = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0);
            const gap = b.y0 - a.y1;
            const pairHeight = b.y1 - a.y0;
            if (Math.min(aw, bw) < Math.max(aw, bw) * 0.75 || overlap < Math.min(aw, bw) * 0.82
                || gap < Math.max(scale, Math.max(top.thickness, bottom.thickness) * 0.8)
                || gap > glyphHeight * 0.38 || pairHeight < glyphHeight * 0.24 || pairHeight > glyphHeight * 0.72
                || Math.abs(top.slope - bottom.slope) > 0.1) continue;
            const x0 = Math.min(a.x0, b.x0);
            const x1 = Math.max(a.x1, b.x1);
            const centerY = (a.y0 + b.y1) / 2;
            const guard = Math.max(scale * 2, Math.min((x1 - x0) * 0.2, glyphHeight * 0.16));
            // Require an entirely free vertical corridor around exactly these two
            // complete components. This also catches numerator/denominator ink and
            // long overbars that are disconnected from the equality strokes.
            if (components.some(c => c.id !== a.id && c.id !== b.id && c.x1 > x0 - guard && c.x0 < x1 + guard)) continue;
            const neighbors = (side: 'left' | 'right'): Component | undefined => components
                .filter(c => (side === 'left' ? c.x1 <= x0 - guard : c.x0 >= x1 + guard))
                .sort((c, d) => side === 'left' ? d.x1 - c.x1 : c.x0 - d.x0)[0];
            const left = neighbors('left');
            const right = neighbors('right');
            if (!left || !right) continue;
            const onBaseline = (c: Component): boolean => {
                const h = c.y1 - c.y0;
                return h >= glyphHeight * 0.7 && h <= glyphHeight * 1.6
                    && centerY >= c.y0 + h * 0.25 && centerY <= c.y0 + h * 0.75;
            };
            if (!onBaseline(left) || !onBaseline(right) || !sameVerticalSpan(left, right, glyphHeight)
                || x0 - left.x1 > glyphHeight * 2 || right.x0 - x1 > glyphHeight * 2) continue;
            const enclosed = delimiters.some(open => open.direction !== 'close' && open.component.x1 <= x0
                && open.component.y0 < centerY && open.component.y1 > centerY
                && delimiters.some(close => close.direction !== 'open' && close.component.x0 >= x1
                    && sameVerticalSpan(open.component, close.component, glyphHeight)));
            if (enclosed) continue;
            // An adjacent open/close shape could be < or > in a compound relation.
            // A paired closing/opening bracket belonging wholly to one side is safe.
            const ambiguousNeighbor = (c: Component, side: 'left' | 'right'): boolean => {
                const delimiter = delimiters.find(d => d.component.id === c.id && d.direction !== 'both');
                if (!delimiter) return false;
                return !delimiters.some(d => d.component.id !== c.id && sameVerticalSpan(c, d.component, glyphHeight)
                    && (side === 'left' ? delimiter.direction === 'close' && d.direction === 'open' && d.component.x1 < c.x0
                        : delimiter.direction === 'open' && d.direction === 'close' && d.component.x0 > c.x1));
            };
            if (ambiguousNeighbor(left, 'left') || ambiguousNeighbor(right, 'right')) continue;
            separators.push({ x0, x1, token: '=' });
        }
    }
    separators.sort((a, b) => a.x0 - b.x0);
    if (!separators.length || separators.length > 3) return null;
    const ranges: OcrEquationChunkPlan['ranges'] = [];
    let start = inkX0;
    for (const separator of separators) {
        if (separator.x0 - start < glyphHeight * 0.7) return null;
        ranges.push({ x0: start, x1: separator.x0 });
        start = separator.x1;
    }
    if (inkX1 - start < glyphHeight * 0.7) return null;
    ranges.push({ x0: start, x1: inkX1 });
    return {
        ranges, separators,
        maxNewTokens: Math.max(...ranges.map(range => getOcrEquationTokenBudget(range.x1 - range.x0, inkHeight)))
    };
}
