// Recover only spatially supported fractions and scripts after conservative
// horizontal projection. Independent columns keep their existing ordering.
export type SpatialOcrLineBand = { y0: number; y1: number; ink: number };

type Component = {
    x0: number; y0: number; x1: number; y1: number;
    width: number; height: number; ink: number;
};

function componentsOf(mask: ArrayLike<number>, width: number): Component[] | null {
    const height = Math.floor(mask.length / width);
    const visited = new Uint8Array(width * height);
    const stack: number[] = [];
    const components: Component[] = [];
    for (let origin = 0; origin < visited.length; origin++) {
        if (visited[origin] || !mask[origin]) continue;
        // No partial component set may influence a layout decision.
        if (components.length >= 4096) return null;
        visited[origin] = 1;
        stack.push(origin);
        let x0 = width, y0 = height, x1 = -1, y1 = -1, ink = 0;
        while (stack.length) {
            const pixel = stack.pop()!;
            const y = Math.floor(pixel / width);
            const x = pixel - y * width;
            x0 = Math.min(x0, x); x1 = Math.max(x1, x);
            y0 = Math.min(y0, y); y1 = Math.max(y1, y);
            ink++;
            for (let neighborY = Math.max(0, y - 1); neighborY <= Math.min(height - 1, y + 1); neighborY++) {
                for (let neighborX = Math.max(0, x - 1); neighborX <= Math.min(width - 1, x + 1); neighborX++) {
                    const neighbor = neighborY * width + neighborX;
                    if (visited[neighbor] || !mask[neighbor]) continue;
                    visited[neighbor] = 1;
                    stack.push(neighbor);
                }
            }
        }
        components.push({ x0, y0, x1, y1, width: x1 - x0 + 1, height: y1 - y0 + 1, ink });
    }
    return components;
}

function bounds(components: readonly Component[]): Component {
    const x0 = Math.min(...components.map(component => component.x0));
    const y0 = Math.min(...components.map(component => component.y0));
    const x1 = Math.max(...components.map(component => component.x1));
    const y1 = Math.max(...components.map(component => component.y1));
    return { x0, y0, x1, y1, width: x1 - x0 + 1, height: y1 - y0 + 1,
        ink: components.reduce((sum, component) => sum + component.ink, 0) };
}

function containingBand(component: Component, bands: readonly SpatialOcrLineBand[]): number {
    // A component crossing a supplied boundary is deliberately ineligible.
    return bands.findIndex(band => component.y0 >= band.y0 && component.y1 <= band.y1);
}

function joinBoundaries(
    bands: readonly SpatialOcrLineBand[],
    boundaries: ReadonlySet<number>
): SpatialOcrLineBand[] {
    const output: SpatialOcrLineBand[] = [];
    for (let index = 0; index < bands.length; index++) {
        const band = bands[index];
        const previous = output[output.length - 1];
        if (previous && boundaries.has(index - 1)) {
            previous.y1 = band.y1;
            previous.ink += band.ink;
        } else output.push({ ...band });
    }
    return output;
}

function representativeGlyphHeight(components: readonly Component[], scale: number): number {
    const heights = components.filter(component =>
        component.height >= 3 * scale && component.width < component.height * 3
    ).map(component => component.height).sort((left, right) => left - right);
    // Use the lower median: one tall delimiter must not set the handwriting
    // scale for the smaller glyphs that it encloses.
    return heights.length ? heights[Math.floor((heights.length - 1) / 2)] : 0;
}
function groupComponentsByBand(
    components: readonly Component[],
    bands: readonly SpatialOcrLineBand[]
): Component[][] {
    const grouped = bands.map(() => [] as Component[]);
    for (const component of components) {
        const index = containingBand(component, bands);
        if (index >= 0) grouped[index].push(component);
    }
    return grouped;
}

function fractionBoundaries(
    components: readonly Component[],
    bands: readonly SpatialOcrLineBand[],
    scale: number
): Set<number> {
    const boundaries = new Set<number>();
    type Candidate = { bar: Component; aboveBand: number; barBand: number; belowBand: number; glyphHeight: number };
    const groups = new Map<string, Candidate[]>();
    for (const bar of components) {
        if (bar.width < Math.max(8 * scale, bar.height * 4.5) ||
            bar.height > Math.max(3 * scale, bar.width * 0.12) ||
            bar.ink < bar.width * 0.70) continue;
        const barBand = containingBand(bar, bands);
        if (barBand < 0) continue;
        const horizontalSlack = Math.max(bar.height, bar.width * 0.08);
        const bodies = components.filter(component => component !== bar &&
            component.height >= Math.max(3 * scale, bar.height * 2.5) &&
            component.x0 >= bar.x0 - horizontalSlack &&
            component.x1 <= bar.x1 + horizontalSlack);
        const nearestBody = (above: boolean): Component | null => {
            const candidates = bodies.filter(component => above
                ? component.y1 < bar.y0 : component.y0 > bar.y1);
            candidates.sort((left, right) => above
                ? right.y1 - left.y1 : left.y0 - right.y0);
            const nearest = candidates[0];
            if (!nearest) return null;
            const peers = candidates.filter(component => {
                const overlap = Math.min(component.y1, nearest.y1) - Math.max(component.y0, nearest.y0) + 1;
                return overlap >= Math.min(component.height, nearest.height) * 0.5;
            });
            return bounds(peers);
        };
        const above = nearestBody(true);
        const below = nearestBody(false);
        if (!above || !below) continue;
        const glyphHeight = Math.max(above.height, below.height);
        if (bar.width < glyphHeight * 0.75) continue;
        const maximumGap = glyphHeight * 0.95 + bar.height;
        if (bar.y0 - above.y1 - 1 > maximumGap ||
            below.y0 - bar.y1 - 1 > maximumGap) continue;
        const center = (bar.x0 + bar.x1) / 2;
        const centered = (body: Component): boolean =>
            Math.abs((body.x0 + body.x1) / 2 - center) <= bar.width * 0.35 + bar.height;
        if (!centered(above) || !centered(below)) continue;
        const aboveBand = containingBand(above, bands);
        const belowBand = containingBand(below, bands);
        // Never jump over an unrelated line to reach a spatially aligned glyph.
        if (aboveBand < 0 || belowBand < 0 ||
            barBand - aboveBand > 1 || belowBand - barBand > 1) continue;
        const key = [aboveBand, barBand, belowBand].join(':');
        const peers = groups.get(key) || [];
        peers.push({ bar, aboveBand, barBand, belowBand, glyphHeight });
        groups.set(key, peers);
    }
    const byBand = groupComponentsByBand(components, bands);
    for (const candidates of groups.values()) {
        const { aboveBand, barBand, belowBand } = candidates[0];
        const minimumBodyHeight = Math.min(...candidates.map(candidate => candidate.glyphHeight));
        const supported = (index: number): boolean => {
            if (index === barBand) return true;
            let totalInk = 0, supportedInk = 0;
            for (const component of byBand[index]) {
                totalInk += component.ink;
                const covered = candidates.some(({ bar }) => {
                    const slack = Math.max(bar.height, bar.width * 0.08);
                    return component.x0 >= bar.x0 - slack && component.x1 <= bar.x1 + slack;
                });
                if (covered) supportedInk += component.ink;
                else {
                    // Thin full-height glyphs (such as the ones in a separate
                    // 1=1 row) carry little ink. Their geometry vetoes a merge
                    // regardless of their fraction of the total row ink.
                    if (component.height >= Math.max(3 * scale, minimumBodyHeight * 0.55)) return false;
                }
            }
            // A narrow aligned operand is insufficient if the rest of this
            // row is a separate equation. Parallel fractions may jointly own
            // the row, provided their bars share the same three-band stack.
            return totalInk > 0 && supportedInk >= totalInk * 0.85;
        };
        if (!supported(aboveBand) || !supported(belowBand)) continue;
        if (aboveBand < barBand) boundaries.add(aboveBand);
        if (belowBand > barBand) boundaries.add(barBand);
    }
    return boundaries;
}
function scriptBoundaries(
    components: readonly Component[],
    bands: readonly SpatialOcrLineBand[],
    scale: number
): Set<number> {
    const boundaries = new Set<number>();
    const byBand = groupComponentsByBand(components, bands);
    for (let index = 0; index < bands.length; index++) {
        const scriptComponents = byBand[index];
        if (!scriptComponents.length) continue;
        const script = bounds(scriptComponents);
        const matches: Array<{ neighbor: number; score: number }> = [];
        for (const neighbor of [index - 1, index + 1]) {
            if (neighbor < 0 || neighbor >= bands.length) continue;
            let bestScore = Number.POSITIVE_INFINITY;
            const baselineHeight = representativeGlyphHeight(byBand[neighbor], scale);
            if (!baselineHeight) continue;
            for (const base of byBand[neighbor]) {
                // A tall bracket/radical may be the attachment point, but its
                // full structural height is not the local handwriting size.
                const glyphHeight = Math.min(base.height, baselineHeight);
                if (script.height > glyphHeight * 0.68 ||
                    script.height < Math.max(3 * scale, glyphHeight * 0.18) ||
                    script.width > glyphHeight * 2.5 ||
                    base.width > glyphHeight * 2) continue;
                // A compact filled dot is insufficient evidence for a script.
                if (scriptComponents.every(component =>
                    component.height <= glyphHeight * 0.30 &&
                    component.width <= component.height * 1.25 &&
                    component.ink >= component.width * component.height * 0.45)) continue;
                const gap = neighbor < index
                    ? script.y0 - base.y1 - 1 : base.y0 - script.y1 - 1;
                if (gap < 0 || gap > glyphHeight * 0.65) continue;
                const horizontalGap = script.x0 - base.x1 - 1;
                // Exponents/indices attach to the upper/lower right of a glyph.
                if (horizontalGap < -glyphHeight * 0.20 ||
                    horizontalGap > glyphHeight * 0.60) continue;
                const score = gap / glyphHeight +
                    Math.max(0, horizontalGap) / glyphHeight * 0.35;
                bestScore = Math.min(bestScore, score);
            }
            if (Number.isFinite(bestScore)) matches.push({ neighbor, score: bestScore });
        }
        matches.sort((left, right) => left.score - right.score);
        const best = matches[0];
        if (!best) continue;
        // Between two plausible baselines, proximity must clearly identify one.
        if (matches[1] && best.score + 0.10 >= matches[1].score * 0.65) continue;
        boundaries.add(Math.min(index, best.neighbor));
    }
    return boundaries;
}

/**
 * Joins existing neighboring Y bands only when an actual horizontal component
 * spans ink above and below it, or a smaller glyph cluster has one clear base.
 * No ink is moved, removed or reordered, and no page-height threshold is used.
 */
export function mergeSpatialOcrLineBands(
    mask: ArrayLike<number>,
    sourceWidth: number,
    bands: readonly SpatialOcrLineBand[],
    pixelScale = 1
): SpatialOcrLineBand[] {
    const width = Math.floor(sourceWidth);
    if (bands.length < 2 || width <= 0 || mask.length < width) return Array.from(bands);
    const scale = Number.isFinite(pixelScale) ? Math.max(0.25, Math.min(32, pixelScale)) : 1;
    const components = componentsOf(mask, width);
    if (!components) return Array.from(bands);
    const fractions = joinBoundaries(bands, fractionBoundaries(components, bands, scale));
    return joinBoundaries(fractions, scriptBoundaries(components, fractions, scale));
}
