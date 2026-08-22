// Conservative layout helpers for multi-line calculation OCR.

import {
    classifyOcrVerticalSymbolPath,
    type OcrDelimiterHint,
    type OcrDelimiterKind,
    type OcrSymbolBox
} from './symbol-geometry.ts';

export const OCR_LAYOUT_ALGORITHM_VERSION = 'lines-v21-multiplication-dot-clusters';

export type OcrVerticalStrokeHint = {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
    hasTopHook?: boolean;
    /** Absolute endpoint slope |dx| / |dy| before stroke-width padding. */
    slantRatio?: number;
};

export type OcrOperationSeparator = {
    x0: number;
    x1: number;
    source?: 'vector' | 'raster';
    confidence?: 'high' | 'normal';
};

export type OcrStructuralDelimiter = {
    x0: number;
    x1: number;
    kind: OcrDelimiterKind;
};

export type OcrStructuralToken = '(' | ')' | '[' | ']' | '\\vert';

export type OcrLineBand = {
    y0: number;
    y1: number;
    ink: number;
};

export type OcrLineSegment = {
    canvas: HTMLCanvasElement;
    bbox: { x: number; y: number; width: number; height: number };
    /** Exact unpadded ink bounds in source-canvas coordinates. */
    inkBox: { x: number; y: number; width: number; height: number };
    fingerprint: string;
    inkPixels: number;
    operationSeparator?: OcrOperationSeparator;
    operationSeparators?: OcrOperationSeparator[];
    structuralBars?: OcrOperationSeparator[];
    structuralDelimiters?: OcrStructuralDelimiter[];
    plusMinusHints?: OcrSymbolBox[];
    hasPlusMinusHint?: boolean;
};

export type OcrCanvasSegmentationOptions = {
    /**
     * Remove vector-confirmed written-calculation rules from the OCR raster
     * before line bands are formed. This is deliberately opt-in: the same
     * horizontal geometry remains meaningful as a fraction bar in ordinary
     * equation recognition.
    */
    maskCalculationRules?: boolean;
    /** Remove geometrically confirmed small carry-one glyphs before OCR. */
    maskCarryOnes?: boolean;
    /** Remove vector-confirmed long-division underlines before row splitting. */
    maskDivisionRules?: boolean;
    /** Minimum full-size rows expected above a confirmed column rule. */
    minimumColumnRowsAboveRule?: number;
};

/**
 * Returns every geometrically plausible transformation bar in recognition
 * order. Do not cap this list: in school handwriting, vertical components of
 * digits such as 4 or 8 can score ahead of the actual hookless `|`. The
 * semantic split check must therefore be allowed to reach every candidate.
 */
export function getOcrOperationSeparators(
    segment: Pick<OcrLineSegment, 'operationSeparator' | 'operationSeparators'>
): OcrOperationSeparator[] {
    if (segment.operationSeparators?.length) {
        return Array.from(segment.operationSeparators);
    }
    return segment.operationSeparator ? [segment.operationSeparator] : [];
}

/**
 * Returns every vector-confirmed vertical bar, including literal bars and
 * paired delimiters. Operation candidates are a semantic subset of this list.
 */
export function getOcrStructuralBars(
    segment: Pick<OcrLineSegment, 'structuralBars'>
): OcrOperationSeparator[] {
    return segment.structuralBars?.length
        ? Array.from(segment.structuralBars)
        : [];
}

export function getOcrStructuralDelimiters(
    segment: Pick<OcrLineSegment, 'structuralDelimiters'>
): OcrStructuralDelimiter[] {
    return segment.structuralDelimiters?.length
        ? Array.from(segment.structuralDelimiters)
        : [];
}

export function ocrDelimiterToken(kind: OcrDelimiterKind): OcrStructuralToken {
    if (kind === 'round-open') return '(';
    if (kind === 'round-close') return ')';
    if (kind === 'square-open') return '[';
    return ']';
}

export function composeOcrStructuralParts(
    parts: readonly string[],
    tokens: readonly OcrStructuralToken[]
): string {
    if (parts.length !== tokens.length + 1) return '';
    let output = String(parts[0] || '').trim();
    for (let index = 0; index < tokens.length; index++) {
        output += tokens[index] === '\\vert' ? ' \\vert ' : tokens[index];
        output += String(parts[index + 1] || '').trim();
    }
    return output;
}

/**
 * Reassembles OCR crops around literal vertical bars without changing them
 * into school-algebra operation markers. Empty edge/intermediate crops are
 * intentional: `|x|`, `a||b`, and a trailing `|` retain every stroke.
 */
export function composeOcrLiteralBarParts(parts: readonly string[]): string {
    if (parts.length < 2) return String(parts[0] || '').trim();
    return composeOcrStructuralParts(
        parts,
        new Array<OcrStructuralToken>(parts.length - 1).fill('\\vert')
    );
}

type WorkingBand = OcrLineBand & {
    maxRunHeight: number;
    hasBroadThinRun: boolean;
    substantialRuns: number;
    componentCount: number;
};

function mergeBands(a: WorkingBand, b: WorkingBand): WorkingBand {
    return {
        y0: a.y0,
        y1: b.y1,
        ink: a.ink + b.ink,
        maxRunHeight: Math.max(a.maxRunHeight, b.maxRunHeight),
        hasBroadThinRun: a.hasBroadThinRun || b.hasBroadThinRun,
        substantialRuns: a.substantialRuns + b.substantialRuns,
        componentCount: a.componentCount + b.componentCount
    };
}

function normalizePixelScale(value: number): number {
    const scale = Number(value);
    if (!isFinite(scale)) return 1;
    return Math.max(0.25, Math.min(32, scale));
}

/**
 * A German-school digit one normally has a short shoulder/hook at its top,
 * while the transformation marker is one independent, almost straight path.
 * Fit the lower stem and measure only the top section against that stem so a
 * deliberately slanted `|` is still accepted.
 */
export function hasOcrNumeralOneTopHook(
    points: readonly { x: number; y: number }[],
    strokeWidth = 1
): boolean {
    return classifyOcrVerticalSymbolPath([{
        points,
        strokeWidth
    }], 0) === 'hooked-one';
}

function shouldMergeBands(
    a: WorkingBand,
    b: WorkingBand,
    baseGap: number,
    pixelScale: number
): boolean {
    const gap = b.y0 - a.y1 - 1;
    if (gap <= baseGap) return true;

    const heightA = a.y1 - a.y0 + 1;
    const heightB = b.y1 - b.y0 + 1;
    const smallComponent = a.substantialRuns === 0 || b.substantialRuns === 0;
    if (smallComponent) {
        const threshold = Math.min(
            Math.round(16 * pixelScale),
            Math.max(baseGap, Math.round(Math.max(heightA, heightB) * 0.8))
        );
        return gap <= threshold;
    }

    // Only a broad thin component may bridge numerator and denominator. A dot
    // or speck may join one neighbor, but must never glue two real lines.
    const substantialRuns = a.substantialRuns + b.substantialRuns;
    const componentCount = a.componentCount + b.componentCount;
    if ((a.hasBroadThinRun || b.hasBroadThinRun) &&
        substantialRuns <= 2 &&
        componentCount <= 3) {
        const threshold = Math.min(
            Math.round(14 * pixelScale),
            Math.max(baseGap, Math.round(Math.max(heightA, heightB) * 0.45))
        );
        return gap <= threshold;
    }

    return false;
}

/**
 * Turns a horizontal ink projection into conservative handwriting line bands.
 * Nearby dots, superscripts and fraction components stay with their equation.
 */
export function findOcrLineBands(
    rowInk: ArrayLike<number>,
    imageWidth: number,
    pixelScale = 1
): OcrLineBand[] {
    const height = rowInk.length;
    if (!height) return [];
    const scale = normalizePixelScale(pixelScale);
    const thinLimit = Math.max(1, Math.round(4 * scale));

    const runs: WorkingBand[] = [];
    let start = -1;
    let ink = 0;
    for (let y = 0; y <= height; y++) {
        const count = y < height ? Math.max(0, Number(rowInk[y]) || 0) : 0;
        if (count > 0) {
            if (start < 0) {
                start = y;
                ink = 0;
            }
            ink += count;
            continue;
        }
        if (start >= 0) {
            const runHeight = y - start;
            const isThin = runHeight <= thinLimit;
            const meanRowInk = ink / Math.max(1, runHeight);
            runs.push({
                y0: start,
                y1: y - 1,
                ink,
                maxRunHeight: runHeight,
                hasBroadThinRun: isThin && meanRowInk >= Math.max(
                    Math.round(4 * scale),
                    runHeight * 4
                ),
                substantialRuns: isThin ? 0 : 1,
                componentCount: 1
            });
            start = -1;
            ink = 0;
        }
    }
    const baseGap = Math.max(
        Math.round(2 * scale),
        Math.min(Math.round(6 * scale), Math.round(height * 0.018))
    );
    const minimumInk = Math.max(
        Math.round(2 * scale),
        Math.round(Math.max(1, imageWidth) * 0.003)
    );
    const nearbyComponentGap = Math.max(baseGap, Math.round(8 * scale));
    let bands = runs.filter((band, index) => {
        if (runs.length === 1 || band.ink > minimumInk) return true;
        const previousGap = index > 0
            ? band.y0 - runs[index - 1].y1 - 1
            : Number.POSITIVE_INFINITY;
        const nextGap = index + 1 < runs.length
            ? runs[index + 1].y0 - band.y1 - 1
            : Number.POSITIVE_INFINITY;
        return Math.min(previousGap, nextGap) <= nearbyComponentGap;
    });
    if (!bands.length) return [];

    let changed = true;
    while (changed && bands.length > 1) {
        changed = false;
        const next: WorkingBand[] = [];
        for (const band of bands) {
            const previous = next[next.length - 1];
            if (previous && shouldMergeBands(previous, band, baseGap, scale)) {
                next[next.length - 1] = mergeBands(previous, band);
                changed = true;
            } else {
                next.push(band);
            }
        }
        bands = next;
    }

    bands = bands.filter(band => {
        if (bands.length === 1) return true;
        const bandHeight = band.y1 - band.y0 + 1;
        return bandHeight > Math.max(1, Math.round(scale)) || band.ink >= minimumInk;
    });

    return bands.map(({ y0, y1, ink: bandInk }) => ({ y0, y1, ink: bandInk }));
}

/**
 * A confirmed long-division underline is an authored row boundary. Generic
 * math-line segmentation may otherwise merge the product above it with the
 * brought-down value below it (the same conservative merge is useful for
 * fractions). Split only at explicitly supplied geometry; ordinary equation
 * and fraction recognition never call this helper.
 */
export function splitOcrLineBandsAtRules(
    rowInk: ArrayLike<number>,
    bands: readonly OcrLineBand[],
    rawRules: unknown
): OcrLineBand[] {
    const rules = (Array.isArray(rawRules) ? rawRules : [])
        .map(rule => {
            if (!rule || typeof rule !== 'object') return null;
            const box = rule as Partial<OcrSymbolBox>;
            if (![box.y0, box.y1].every(Number.isFinite)) return null;
            return {
                y0: Math.floor(Math.min(Number(box.y0), Number(box.y1))),
                y1: Math.ceil(Math.max(Number(box.y0), Number(box.y1)))
            };
        })
        .filter((rule): rule is { y0: number; y1: number } => Boolean(rule))
        .sort((left, right) => left.y0 - right.y0);
    if (!rules.length) return Array.from(bands);

    const inkBetween = (y0: number, y1: number): number => {
        let ink = 0;
        for (let y = Math.max(0, y0); y <= Math.min(rowInk.length - 1, y1); y++) {
            ink += Math.max(0, Number(rowInk[y]) || 0);
        }
        return ink;
    };
    let output = Array.from(bands);
    for (const rule of rules) {
        const next: OcrLineBand[] = [];
        for (const band of output) {
            if (rule.y1 < band.y0 || rule.y0 > band.y1) {
                next.push(band);
                continue;
            }
            const upperY1 = Math.min(band.y1, rule.y0 - 1);
            const lowerY0 = Math.max(band.y0, rule.y1 + 1);
            if (upperY1 >= band.y0) {
                const ink = inkBetween(band.y0, upperY1);
                if (ink > 0) next.push({ y0: band.y0, y1: upperY1, ink });
            }
            if (lowerY0 <= band.y1) {
                const ink = inkBetween(lowerY0, band.y1);
                if (ink > 0) next.push({ y0: lowerY0, y1: band.y1, ink });
            }
        }
        output = next;
    }
    return output.sort((left, right) => left.y0 - right.y0);
}

/**
 * Reopens a conservatively merged line band only for a confirmed written
 * column stack. A split needs a real, short empty projection gap and two
 * comparably tall ink-bearing pieces, so dots and superscripts stay attached.
 */
export function splitOcrColumnLineBands(
    rowInk: ArrayLike<number>,
    bands: readonly OcrLineBand[],
    rawRules: unknown,
    minimumRowsAboveRule: number,
    pixelScale = 1
): OcrLineBand[] {
    const minimumRows = Math.max(0, Math.floor(Number(minimumRowsAboveRule) || 0));
    if (minimumRows < 2 || !bands.length) return Array.from(bands);
    const rules = (Array.isArray(rawRules) ? rawRules : [])
        .map(rule => {
            if (!rule || typeof rule !== 'object') return null;
            const box = rule as Partial<OcrSymbolBox>;
            if (![box.y0, box.y1].every(Number.isFinite)) return null;
            return {
                y0: Math.floor(Math.min(Number(box.y0), Number(box.y1))),
                y1: Math.ceil(Math.max(Number(box.y0), Number(box.y1)))
            };
        })
        .filter((rule): rule is { y0: number; y1: number } => Boolean(rule))
        .sort((left, right) => left.y0 - right.y0);
    if (!rules.length) return Array.from(bands);

    const scale = normalizePixelScale(pixelScale);
    const minimumPieceHeight = Math.max(5, Math.round(8 * scale));
    const maximumGap = Math.max(2, Math.round(6 * scale));
    let output = Array.from(bands).sort((left, right) => left.y0 - right.y0);

    for (const rule of rules) {
        const ruleY = (rule.y0 + rule.y1) / 2;
        const rowsAbove = (): OcrLineBand[] => output.filter(band =>
            (band.y0 + band.y1) / 2 < ruleY
        );
        const fullSizeCount = (rows: readonly OcrLineBand[]): number => {
            if (!rows.length) return 0;
            const maximumHeight = Math.max(...rows.map(row => row.y1 - row.y0 + 1));
            return rows.filter(row =>
                row.y1 - row.y0 + 1 >= maximumHeight * 0.68
            ).length;
        };

        while (fullSizeCount(rowsAbove()) < minimumRows) {
            type Candidate = {
                index: number;
                pieces: OcrLineBand[];
                balance: number;
                gap: number;
            };
            let best: Candidate | null = null;
            for (let index = 0; index < output.length; index++) {
                const band = output[index];
                if ((band.y0 + band.y1) / 2 >= ruleY) continue;
                const boundaries: Array<{
                    upperY1: number;
                    lowerY0: number;
                    balance: number;
                    gap: number;
                }> = [];
                let gapStart = -1;
                for (let y = band.y0; y <= band.y1 + 1; y++) {
                    const empty = y <= band.y1 &&
                        !(Math.max(0, Number(rowInk[y]) || 0));
                    if (empty && gapStart < 0) gapStart = y;
                    if (empty || gapStart < 0) continue;
                    const gapEnd = y - 1;
                    const gapSize = gapEnd - gapStart + 1;
                    const upperY1 = gapStart - 1;
                    const lowerY0 = gapEnd + 1;
                    gapStart = -1;
                    let adjacentUpperY0 = upperY1;
                    while (adjacentUpperY0 > band.y0 &&
                        (Math.max(0, Number(rowInk[adjacentUpperY0 - 1]) || 0))) {
                        adjacentUpperY0--;
                    }
                    let adjacentLowerY1 = lowerY0;
                    while (adjacentLowerY1 < band.y1 &&
                        (Math.max(0, Number(rowInk[adjacentLowerY1 + 1]) || 0))) {
                        adjacentLowerY1++;
                    }
                    const adjacentUpperHeight = upperY1 - adjacentUpperY0 + 1;
                    const adjacentLowerHeight = adjacentLowerY1 - lowerY0 + 1;
                    if (gapSize > maximumGap ||
                        adjacentUpperHeight < minimumPieceHeight ||
                        adjacentLowerHeight < minimumPieceHeight) continue;
                    let upperInk = 0;
                    let lowerInk = 0;
                    for (let row = band.y0; row <= upperY1; row++) {
                        upperInk += Math.max(0, Number(rowInk[row]) || 0);
                    }
                    for (let row = lowerY0; row <= band.y1; row++) {
                        lowerInk += Math.max(0, Number(rowInk[row]) || 0);
                    }
                    if (!upperInk || !lowerInk) continue;
                    const balance = Math.min(
                        adjacentUpperHeight,
                        adjacentLowerHeight
                    ) / Math.max(adjacentUpperHeight, adjacentLowerHeight);
                    boundaries.push({
                        upperY1,
                        lowerY0,
                        balance,
                        gap: gapSize
                    });
                }
                if (!boundaries.length) continue;
                const pieces: OcrLineBand[] = [];
                let pieceY0 = band.y0;
                for (const boundary of boundaries) {
                    let ink = 0;
                    for (let row = pieceY0; row <= boundary.upperY1; row++) {
                        ink += Math.max(0, Number(rowInk[row]) || 0);
                    }
                    if (ink) pieces.push({ y0: pieceY0, y1: boundary.upperY1, ink });
                    pieceY0 = boundary.lowerY0;
                }
                let finalInk = 0;
                for (let row = pieceY0; row <= band.y1; row++) {
                    finalInk += Math.max(0, Number(rowInk[row]) || 0);
                }
                if (finalInk) pieces.push({ y0: pieceY0, y1: band.y1, ink: finalInk });
                if (pieces.length < 2) continue;
                const candidate: Candidate = {
                    index,
                    pieces,
                    balance: Math.max(...boundaries.map(boundary => boundary.balance)),
                    gap: Math.max(...boundaries.map(boundary => boundary.gap))
                };
                if (!best || candidate.pieces.length > best.pieces.length ||
                    (candidate.pieces.length === best.pieces.length && (
                        candidate.balance > best.balance + 1e-9 ||
                        (Math.abs(candidate.balance - best.balance) <= 1e-9 &&
                            candidate.gap > best.gap)
                    ))) best = candidate;
            }
            if (!best) {
                // Responsive scaling and a fixed pen width can close a small
                // design-space gap completely. Use the nearest result row
                // below the confirmed rule as an observed height reference;
                // never derive a cut from prompt digits or expected values.
                const reference = output
                    .filter(band => (band.y0 + band.y1) / 2 > ruleY)
                    .slice()
                    .sort((left, right) =>
                        (left.y0 + left.y1) - (right.y0 + right.y1)
                    )[0];
                const referenceHeight = reference
                    ? reference.y1 - reference.y0 + 1
                    : 0;
                type TouchingCandidate = {
                    index: number;
                    upper: OcrLineBand;
                    lower: OcrLineBand;
                    score: number;
                    distance: number;
                };
                let touching: TouchingCandidate | null = null;
                if (referenceHeight >= minimumPieceHeight) {
                    for (let index = 0; index < output.length; index++) {
                        const band = output[index];
                        if ((band.y0 + band.y1) / 2 >= ruleY) continue;
                        const bandHeight = band.y1 - band.y0 + 1;
                        if (bandHeight < referenceHeight * 1.55) continue;
                        const minimumSide = Math.max(
                            minimumPieceHeight,
                            Math.ceil(referenceHeight * 0.65)
                        );
                        const target = band.y0 + referenceHeight - 1;
                        const radius = Math.max(1, Math.round(referenceHeight * 0.15));
                        const firstCut = Math.max(
                            band.y0 + minimumSide - 1,
                            target - radius
                        );
                        const lastCut = Math.min(
                            band.y1 - minimumSide,
                            target + radius
                        );
                        for (let cut = firstCut; cut <= lastCut; cut++) {
                            const score = Math.max(0, Number(rowInk[cut]) || 0) +
                                Math.max(0, Number(rowInk[cut + 1]) || 0);
                            const distance = Math.abs(cut - target);
                            if (touching && (
                                score > touching.score ||
                                (score === touching.score && distance >= touching.distance)
                            )) continue;
                            let upperInk = 0;
                            let lowerInk = 0;
                            for (let row = band.y0; row <= cut; row++) {
                                upperInk += Math.max(0, Number(rowInk[row]) || 0);
                            }
                            for (let row = cut + 1; row <= band.y1; row++) {
                                lowerInk += Math.max(0, Number(rowInk[row]) || 0);
                            }
                            if (!upperInk || !lowerInk) continue;
                            touching = {
                                index,
                                upper: { y0: band.y0, y1: cut, ink: upperInk },
                                lower: { y0: cut + 1, y1: band.y1, ink: lowerInk },
                                score,
                                distance
                            };
                        }
                    }
                }
                if (!touching) break;
                output.splice(touching.index, 1, touching.upper, touching.lower);
                continue;
            }
            output.splice(best.index, 1, ...best.pieces);
        }
    }
    return output.sort((left, right) => left.y0 - right.y0);
}

function normalizedRuleYBoxes(
    rawRules: unknown
): Array<{ y0: number; y1: number }> {
    return (Array.isArray(rawRules) ? rawRules : [])
        .map(rule => {
            if (!rule || typeof rule !== 'object') return null;
            const box = rule as Partial<OcrSymbolBox>;
            if (![box.y0, box.y1].every(Number.isFinite)) return null;
            return {
                y0: Math.floor(Math.min(Number(box.y0), Number(box.y1))),
                y1: Math.ceil(Math.max(Number(box.y0), Number(box.y1)))
            };
        })
        .filter((rule): rule is { y0: number; y1: number } => Boolean(rule))
        .sort((left, right) => left.y0 - right.y0);
}

function splitBandAtLargestEmptyGap(
    rowInk: ArrayLike<number>,
    band: OcrLineBand
): OcrLineBand[] {
    let bestStart = -1;
    let bestEnd = -1;
    let runStart = -1;
    for (let y = band.y0; y <= band.y1 + 1; y++) {
        const empty = y <= band.y1 && (Number(rowInk[y]) || 0) <= 0;
        if (empty) {
            if (runStart < 0) runStart = y;
            continue;
        }
        if (runStart >= 0) {
            const runEnd = y - 1;
            if (runStart > band.y0 && runEnd < band.y1 &&
                runEnd - runStart > bestEnd - bestStart) {
                bestStart = runStart;
                bestEnd = runEnd;
            }
            runStart = -1;
        }
    }
    const inkBetween = (y0: number, y1: number): number => {
        let ink = 0;
        for (let y = y0; y <= y1; y++) {
            ink += Math.max(0, Number(rowInk[y]) || 0);
        }
        return ink;
    };
    if (bestStart < 0) {
        const height = band.y1 - band.y0 + 1;
        if (height < 10) return [band];
        const margin = Math.max(2, Math.floor(height * 0.22));
        let boundary = -1;
        let boundaryInk = Number.POSITIVE_INFINITY;
        for (
            let y = band.y0 + margin;
            y < band.y1 - margin;
            y++
        ) {
            const candidateInk =
                Math.max(0, Number(rowInk[y]) || 0) +
                Math.max(0, Number(rowInk[y + 1]) || 0);
            if (candidateInk < boundaryInk) {
                boundary = y;
                boundaryInk = candidateInk;
            }
        }
        const meanRowInk = band.ink / Math.max(1, height);
        if (boundary < 0 ||
            boundaryInk > Math.max(4, meanRowInk * 0.65)) {
            return [band];
        }
        const upperInk = inkBetween(band.y0, boundary);
        const lowerInk = inkBetween(boundary + 1, band.y1);
        if (!upperInk || !lowerInk) return [band];
        return [
            { y0: band.y0, y1: boundary, ink: upperInk },
            { y0: boundary + 1, y1: band.y1, ink: lowerInk }
        ];
    }
    const upperInk = inkBetween(band.y0, bestStart - 1);
    const lowerInk = inkBetween(bestEnd + 1, band.y1);
    if (!upperInk || !lowerInk) return [band];
    return [
        { y0: band.y0, y1: bestStart - 1, ink: upperInk },
        { y0: bestEnd + 1, y1: band.y1, ink: lowerInk }
    ];
}

/**
 * Long division has two semantic rows before every underline: initially the
 * division expression and first product, then a partial dividend and the next
 * product. At the screenshot-like tight spacing used in school worksheets,
 * generic formula segmentation intentionally joins each pair. The confirmed
 * underline sequence makes it safe to split the largest empty gap inside
 * those regions; the final remainder region remains a single row.
 */
export function splitOcrDivisionLineBands(
    rowInk: ArrayLike<number>,
    bands: readonly OcrLineBand[],
    rawRules: unknown
): OcrLineBand[] {
    const rules = normalizedRuleYBoxes(rawRules);
    const hardSplit = splitOcrLineBandsAtRules(rowInk, bands, rules);
    if (!rules.length) return hardSplit;

    const grouped = new Map<number, OcrLineBand[]>();
    for (const band of hardSplit) {
        const centerY = (band.y0 + band.y1) / 2;
        let region = rules.length;
        for (let index = 0; index < rules.length; index++) {
            if (centerY < rules[index].y0) {
                region = index;
                break;
            }
        }
        const entries = grouped.get(region) || [];
        entries.push(band);
        grouped.set(region, entries);
    }

    const output: OcrLineBand[] = [];
    for (let region = 0; region <= rules.length; region++) {
        const entries = (grouped.get(region) || [])
            .sort((left, right) => left.y0 - right.y0);
        if (region < rules.length && entries.length) {
            // Reconsider the complete authored region even when the generic
            // segmenter happened to create more than one preliminary band.
            // Tiny detached strokes (notably the leading subtraction sign)
            // can otherwise make entries.length look complete while the
            // partial-dividend and product glyphs remain joined.
            const y0 = entries[0].y0;
            const y1 = entries[entries.length - 1].y1;
            let ink = 0;
            for (let y = y0; y <= y1; y++) {
                ink += Math.max(0, Number(rowInk[y]) || 0);
            }
            const split = splitBandAtLargestEmptyGap(rowInk, { y0, y1, ink });
            if (split.length === 2) {
                output.push(...split);
                continue;
            }
        }
        output.push(...entries);
    }
    return output.sort((left, right) => left.y0 - right.y0);
}

function isInkPixel(data: Uint8ClampedArray, offset: number): boolean {
    const alpha = data[offset + 3] / 255;
    if (alpha <= 0.04) return false;
    const luminance = data[offset] * 0.299 + data[offset + 1] * 0.587 + data[offset + 2] * 0.114;
    const compositedOnWhite = 255 - alpha * (255 - luminance);
    return compositedOnWhite < 245;
}

/**
 * Selects a separate, tall pen stroke that behaves like the German-school
 * transformation marker in `3x = 12 | :3`. OCR models commonly turn that
 * stroke into `1`; vector evidence lets us preserve it as structure instead.
 */
export function selectOcrOperationSeparator(
    hints: readonly OcrVerticalStrokeHint[],
    lineBox: { x0: number; y0: number; x1: number; y1: number },
    columnInk: ArrayLike<number>,
    pixelScale = 1,
    columnYMin?: ArrayLike<number>,
    columnYMax?: ArrayLike<number>
): OcrVerticalStrokeHint | null {
    if (!hints.length) return null;
    const scale = normalizePixelScale(pixelScale);
    const lineWidth = Math.max(1, lineBox.x1 - lineBox.x0 + 1);
    const lineHeight = Math.max(1, lineBox.y1 - lineBox.y0 + 1);
    let totalInk = 0;
    for (let x = lineBox.x0; x <= lineBox.x1; x++) {
        totalInk += Math.max(0, Number(columnInk[x]) || 0);
    }
    if (!totalInk) return null;

    let best: OcrVerticalStrokeHint | null = null;
    let bestScore = Number.NEGATIVE_INFINITY;

    for (const hint of hints) {
        if (hint.hasTopHook === true) continue;
        const explicitlyHookless = hint.hasTopHook === false;
        const x0 = Math.max(lineBox.x0, Math.floor(Math.min(hint.x0, hint.x1)));
        const x1 = Math.min(lineBox.x1, Math.ceil(Math.max(hint.x0, hint.x1)));
        const y0 = Math.max(lineBox.y0, Math.floor(Math.min(hint.y0, hint.y1)));
        const y1 = Math.min(lineBox.y1, Math.ceil(Math.max(hint.y0, hint.y1)));
        if (x1 < x0 || y1 < y0) continue;

        const strokeWidth = x1 - x0 + 1;
        const strokeHeight = y1 - y0 + 1;
        const centerX = (x0 + x1) * 0.5;
        const relativeX = (centerX - lineBox.x0) / lineWidth;
        if (relativeX < 0.48 || relativeX > 0.92) continue;
        const requiredLineHeightRatio = explicitlyHookless ? 0.55 : 0.72;
        if (strokeHeight < Math.max(Math.round(12 * scale), lineHeight * requiredLineHeightRatio)) continue;
        if (strokeWidth > Math.max(Math.round(5 * scale), strokeHeight * 0.18)) continue;

        let visibleStrokeInk = 0;
        for (let x = x0; x <= x1; x++) {
            visibleStrokeInk += Math.max(0, Number(columnInk[x]) || 0);
        }
        if (visibleStrokeInk < Math.max(Math.round(3 * scale), strokeHeight * 0.35)) continue;

        if (columnYMin && columnYMax) {
            let otherY0 = Number.POSITIVE_INFINITY;
            let otherY1 = Number.NEGATIVE_INFINITY;
            for (let x = lineBox.x0; x <= lineBox.x1; x++) {
                if (x >= x0 && x <= x1 || (Number(columnInk[x]) || 0) <= 0) continue;
                const columnMin = Number(columnYMin[x]);
                const columnMax = Number(columnYMax[x]);
                if (!isFinite(columnMin) || !isFinite(columnMax) || columnMax < columnMin) continue;
                otherY0 = Math.min(otherY0, columnMin);
                otherY1 = Math.max(otherY1, columnMax);
            }
            if (!explicitlyHookless && isFinite(otherY0) && isFinite(otherY1)) {
                const otherHeight = otherY1 - otherY0 + 1;
                // A handwritten operation bar is not always taller than every
                // digit in the row. In particular, an exponent expands the
                // combined row height even though a normal operation bar is
                // only digit-high. Explicitly hookless vector paths already
                // satisfy the school-profile distinction from a hooked `1`;
                // keep this relative-height veto only for weaker evidence.
                if (strokeHeight < otherHeight * 0.92) continue;
            }
        }

        let leftNeighbor = lineBox.x0 - 1;
        for (let x = x0 - 1; x >= lineBox.x0; x--) {
            if ((Number(columnInk[x]) || 0) > 0) {
                leftNeighbor = x;
                break;
            }
        }
        let rightNeighbor = lineBox.x1 + 1;
        for (let x = x1 + 1; x <= lineBox.x1; x++) {
            if ((Number(columnInk[x]) || 0) > 0) {
                rightNeighbor = x;
                break;
            }
        }
        if (leftNeighbor < lineBox.x0 || rightNeighbor > lineBox.x1) continue;
        const leftGap = x0 - leftNeighbor - 1;
        const rightGap = rightNeighbor - x1 - 1;
        const minimumGap = Math.max(
            Math.round(2 * scale),
            Math.round(lineHeight * (explicitlyHookless ? 0.07 : 0.10))
        );
        if (leftGap < minimumGap || rightGap < minimumGap) continue;
        const isolationScore = Math.sqrt((leftGap + 1) * (rightGap + 1));

        // Two independently isolated hookless strokes around one expression
        // are likely absolute-value delimiters. A vertical stem belonging to
        // a handwritten 4 is not isolated: its cross/diagonal stroke touches
        // a neighboring column and must never suppress the real operation bar.
        const hasPairedStroke = hints.some(other => {
            if (other === hint || other.hasTopHook === true) return false;
            const otherX0 = Math.max(lineBox.x0, Math.floor(Math.min(other.x0, other.x1)));
            const otherX1 = Math.min(lineBox.x1, Math.ceil(Math.max(other.x0, other.x1)));
            const otherY0 = Math.max(lineBox.y0, Math.floor(Math.min(other.y0, other.y1)));
            const otherY1 = Math.min(lineBox.y1, Math.ceil(Math.max(other.y0, other.y1)));
            if (otherX1 < otherX0 || otherY1 < otherY0) return false;

            let otherLeftNeighbor = lineBox.x0 - 1;
            let otherRightNeighbor = lineBox.x1 + 1;
            for (let x = otherX0 - 1; x >= lineBox.x0; x--) {
                if ((Number(columnInk[x]) || 0) > 0) {
                    otherLeftNeighbor = x;
                    break;
                }
            }
            for (let x = otherX1 + 1; x <= lineBox.x1; x++) {
                if ((Number(columnInk[x]) || 0) > 0) {
                    otherRightNeighbor = x;
                    break;
                }
            }
            const otherLeftGap = otherX0 - otherLeftNeighbor - 1;
            const otherRightGap = otherRightNeighbor - otherX1 - 1;
            if (otherLeftNeighbor < lineBox.x0 || otherRightNeighbor > lineBox.x1 ||
                otherLeftGap < minimumGap || otherRightGap < minimumGap) return false;

            const otherHeight = otherY1 - otherY0 + 1;
            const overlap = Math.max(0, Math.min(y1, otherY1) - Math.max(y0, otherY0) + 1);
            const centerDistance = Math.abs((otherX0 + otherX1) * 0.5 - centerX);
            const otherIsolationScore = Math.sqrt(
                (otherLeftGap + 1) * (otherRightGap + 1)
            );
            return Math.min(strokeHeight, otherHeight) >= Math.max(strokeHeight, otherHeight) * 0.82 &&
                overlap >= Math.min(strokeHeight, otherHeight) * 0.78 &&
                centerDistance >= minimumGap &&
                centerDistance <= lineWidth * 0.35 &&
                otherIsolationScore >= isolationScore * 0.65;
        });
        if (hasPairedStroke) continue;

        let leftInk = 0;
        let rightInk = 0;
        for (let x = lineBox.x0; x < x0; x++) leftInk += Math.max(0, Number(columnInk[x]) || 0);
        for (let x = x1 + 1; x <= lineBox.x1; x++) rightInk += Math.max(0, Number(columnInk[x]) || 0);
        if (leftInk < totalInk * 0.25 || rightInk < totalInk * 0.035) continue;

        const score = strokeHeight * 2 + leftGap + rightGap - strokeWidth * 2;
        if (score > bestScore) {
            bestScore = score;
            best = hint;
        }
    }
    return best;
}

/**
 * Keeps every positively classified vector bar that visibly belongs to this
 * line. Unlike operation selection, this deliberately permits edge bars,
 * paired absolute-value delimiters, and multiple literal bars.
 */
export function selectOcrStructuralBars(
    hints: readonly OcrVerticalStrokeHint[],
    lineBox: { x0: number; y0: number; x1: number; y1: number },
    columnInk: ArrayLike<number>,
    pixelScale = 1
): OcrVerticalStrokeHint[] {
    const scale = normalizePixelScale(pixelScale);
    const lineHeight = Math.max(1, lineBox.y1 - lineBox.y0 + 1);
    const candidates: OcrVerticalStrokeHint[] = [];

    for (const hint of hints) {
        // false is written only for a positively classified hookless bar.
        // Missing information must never be upgraded to structural evidence.
        if (hint.hasTopHook !== false) continue;
        const slantRatio = Number(hint.slantRatio);
        // A slash can be tall enough to pass the general vertical-stem
        // classifier. Literal bars may lean slightly, but a stronger diagonal
        // must remain available to FormulaNet as fraction/division ink.
        if (Number.isFinite(slantRatio) && slantRatio > 1 / 3) continue;
        const x0 = Math.max(lineBox.x0, Math.floor(Math.min(hint.x0, hint.x1)));
        const x1 = Math.min(lineBox.x1, Math.ceil(Math.max(hint.x0, hint.x1)));
        const y0 = Math.max(lineBox.y0, Math.floor(Math.min(hint.y0, hint.y1)));
        const y1 = Math.min(lineBox.y1, Math.ceil(Math.max(hint.y0, hint.y1)));
        if (x1 < x0 || y1 < y0) continue;

        const strokeWidth = x1 - x0 + 1;
        const strokeHeight = y1 - y0 + 1;
        if (strokeHeight < Math.max(Math.round(8 * scale), lineHeight * 0.45)) {
            continue;
        }
        // A deliberately slanted bar occupies more columns than a vertical
        // one. The vector classifier already rejected slash-like strokes.
        if (strokeWidth > Math.max(Math.round(7 * scale), strokeHeight * 0.55)) {
            continue;
        }
        let visibleInk = 0;
        for (let x = x0; x <= x1; x++) {
            visibleInk += Math.max(0, Number(columnInk[x]) || 0);
        }
        if (visibleInk < Math.max(Math.round(3 * scale), strokeHeight * 0.28)) {
            continue;
        }

        const duplicate = candidates.some(existing => {
            const existingX0 = Math.min(existing.x0, existing.x1);
            const existingX1 = Math.max(existing.x0, existing.x1);
            return Math.max(existingX0, x0) <= Math.min(existingX1, x1);
        });
        if (!duplicate) candidates.push(hint);
    }

    candidates.sort((left, right) =>
        (Math.min(left.x0, left.x1) + Math.max(left.x0, left.x1)) -
        (Math.min(right.x0, right.x1) + Math.max(right.x0, right.x1))
    );
    return candidates;
}

/**
 * Keeps only a complete, non-crossing sequence of vector-confirmed visible
 * delimiters. Pairing is intentionally based on open/close direction rather
 * than equal bracket types so interval notation such as (0,1] remains valid.
 */
export function selectOcrStructuralDelimiters(
    hints: readonly OcrDelimiterHint[],
    lineBox: { x0: number; y0: number; x1: number; y1: number },
    columnInk: ArrayLike<number>,
    pixelScale = 1,
    mask?: ArrayLike<number>,
    maskWidth = columnInk.length
): OcrDelimiterHint[] {
    const scale = normalizePixelScale(pixelScale);
    const lineHeight = Math.max(1, lineBox.y1 - lineBox.y0 + 1);
    const candidates = hints.filter(hint => {
        const x0 = Math.max(lineBox.x0, Math.floor(Math.min(hint.x0, hint.x1)));
        const x1 = Math.min(lineBox.x1, Math.ceil(Math.max(hint.x0, hint.x1)));
        const y0 = Math.max(lineBox.y0, Math.floor(Math.min(hint.y0, hint.y1)));
        const y1 = Math.min(lineBox.y1, Math.ceil(Math.max(hint.y0, hint.y1)));
        if (x1 < x0 || y1 < y0) return false;
        const originalHeight = Math.max(1, Math.abs(hint.y1 - hint.y0));
        const visibleHeight = y1 - y0 + 1;
        const visibleWidth = x1 - x0 + 1;
        if (visibleHeight < Math.max(Math.round(8 * scale), lineHeight * 0.45) ||
            visibleHeight < originalHeight * 0.72 ||
            visibleWidth > visibleHeight * 0.68) return false;
        let visibleInk = 0;
        for (let x = x0; x <= x1; x++) {
            visibleInk += Math.max(0, Number(columnInk[x]) || 0);
        }
        if (visibleInk < Math.max(Math.round(4 * scale), visibleHeight * 0.30)) {
            return false;
        }
        if (mask && maskWidth > 0) {
            let rowsWithInk = 0;
            for (let y = y0; y <= y1; y++) {
                const row = y * maskWidth;
                let rowHasInk = false;
                for (let x = x0; x <= x1; x++) {
                    if (!Number(mask[row + x])) continue;
                    rowHasInk = true;
                    break;
                }
                if (rowHasInk) rowsWithInk++;
            }
            // Vector paths survive erasing in the history. Confirm that the
            // rendered delimiter is still continuous before restoring it.
            if (rowsWithInk < visibleHeight * 0.68) return false;
        }
        return true;
    }).sort((left, right) =>
        (Math.min(left.x0, left.x1) + Math.max(left.x0, left.x1)) -
        (Math.min(right.x0, right.x1) + Math.max(right.x0, right.x1))
    );
    if (!candidates.length) return [];

    const stack: OcrDelimiterHint[] = [];
    for (const hint of candidates) {
        const opening = hint.kind === 'round-open' || hint.kind === 'square-open';
        if (opening) {
            stack.push(hint);
            continue;
        }
        const partner = stack.pop();
        if (!partner) return [];
        const partnerHeight = Math.max(1, Math.abs(partner.y1 - partner.y0));
        const hintHeight = Math.max(1, Math.abs(hint.y1 - hint.y0));
        const heightRatio = Math.min(partnerHeight, hintHeight) /
            Math.max(partnerHeight, hintHeight);
        const overlapHeight = Math.max(
            0,
            Math.min(Math.max(partner.y0, partner.y1), Math.max(hint.y0, hint.y1)) -
            Math.max(Math.min(partner.y0, partner.y1), Math.min(hint.y0, hint.y1))
        );
        const overlapRatio = overlapHeight / Math.min(partnerHeight, hintHeight);
        const partnerCenter = (partner.x0 + partner.x1) * 0.5;
        const hintCenter = (hint.x0 + hint.x1) * 0.5;
        const insideX0 = Math.max(
            lineBox.x0,
            Math.ceil(Math.max(partner.x0, partner.x1)) + 1
        );
        const insideX1 = Math.min(
            lineBox.x1,
            Math.floor(Math.min(hint.x0, hint.x1)) - 1
        );
        let insideInk = 0;
        for (let x = insideX0; x <= insideX1; x++) {
            insideInk += Math.max(0, Number(columnInk[x]) || 0);
        }
        if (heightRatio < 0.64 || overlapRatio < 0.68 ||
            hintCenter - partnerCenter < Math.max(3 * scale, lineHeight * 0.10) ||
            insideInk < Math.max(Math.round(2 * scale), lineHeight * 0.08)) {
            return [];
        }
    }
    return stack.length ? [] : candidates;
}

function scoreOcrOperationSeparatorHint(
    hint: OcrVerticalStrokeHint,
    lineBox: { x0: number; y0: number; x1: number; y1: number },
    columnInk: ArrayLike<number>
): number {
    const x0 = Math.max(lineBox.x0, Math.floor(Math.min(hint.x0, hint.x1)));
    const x1 = Math.min(lineBox.x1, Math.ceil(Math.max(hint.x0, hint.x1)));
    const y0 = Math.max(lineBox.y0, Math.floor(Math.min(hint.y0, hint.y1)));
    const y1 = Math.min(lineBox.y1, Math.ceil(Math.max(hint.y0, hint.y1)));
    let leftNeighbor = lineBox.x0 - 1;
    let rightNeighbor = lineBox.x1 + 1;
    for (let x = x0 - 1; x >= lineBox.x0; x--) {
        if ((Number(columnInk[x]) || 0) > 0) {
            leftNeighbor = x;
            break;
        }
    }
    for (let x = x1 + 1; x <= lineBox.x1; x++) {
        if ((Number(columnInk[x]) || 0) > 0) {
            rightNeighbor = x;
            break;
        }
    }
    const leftGap = Math.max(0, x0 - leftNeighbor - 1);
    const rightGap = Math.max(0, rightNeighbor - x1 - 1);
    return (y1 - y0 + 1) * 2 + leftGap + rightGap - (x1 - x0 + 1) * 2;
}

/**
 * Raster-only fallback for restored/imported drawings that do not carry the
 * original pen-stroke metadata. It deliberately requires stronger evidence
 * than the vector path: an isolated, nearly continuous component, taller than
 * the remaining handwriting, with substantial equation ink on both sides.
 */
export function selectOcrRasterOperationSeparator(
    mask: ArrayLike<number>,
    sourceWidth: number,
    lineBox: { x0: number; y0: number; x1: number; y1: number },
    columnInk: ArrayLike<number>,
    pixelScale = 1,
    columnYMin?: ArrayLike<number>,
    columnYMax?: ArrayLike<number>
): OcrVerticalStrokeHint | null {
    const width = Math.max(0, Math.floor(sourceWidth));
    const sourceHeight = width > 0 ? Math.floor(mask.length / width) : 0;
    if (!width || !sourceHeight) return null;
    const scale = normalizePixelScale(pixelScale);
    const box = {
        x0: Math.max(0, Math.floor(lineBox.x0)),
        y0: Math.max(0, Math.floor(lineBox.y0)),
        x1: Math.min(width - 1, Math.floor(lineBox.x1)),
        y1: Math.min(sourceHeight - 1, Math.floor(lineBox.y1))
    };
    if (box.x1 < box.x0 || box.y1 < box.y0) return null;
    const lineWidth = box.x1 - box.x0 + 1;
    const lineHeight = box.y1 - box.y0 + 1;
    const minimumGap = Math.max(Math.round(3 * scale), Math.round(lineHeight * 0.11));
    let totalInk = 0;
    for (let x = box.x0; x <= box.x1; x++) {
        totalInk += Math.max(0, Number(columnInk[x]) || 0);
    }
    if (!totalInk) return null;

    const runs: Array<{ x0: number; x1: number }> = [];
    let runStart = -1;
    for (let x = box.x0; x <= box.x1 + 1; x++) {
        const occupied = x <= box.x1 && (Number(columnInk[x]) || 0) > 0;
        if (occupied && runStart < 0) runStart = x;
        if (!occupied && runStart >= 0) {
            runs.push({ x0: runStart, x1: x - 1 });
            runStart = -1;
        }
    }

    type RasterVerticalShape = OcrVerticalStrokeHint & {
        height: number;
        width: number;
        ink: number;
    };
    const verticalShapes: RasterVerticalShape[] = [];
    for (const run of runs) {
        let y0 = sourceHeight;
        let y1 = -1;
        if (columnYMin && columnYMax) {
            for (let x = run.x0; x <= run.x1; x++) {
                const minimum = Number(columnYMin[x]);
                const maximum = Number(columnYMax[x]);
                if (!isFinite(minimum) || !isFinite(maximum) || maximum < minimum) continue;
                y0 = Math.min(y0, minimum);
                y1 = Math.max(y1, maximum);
            }
        } else {
            for (let y = box.y0; y <= box.y1; y++) {
                const row = y * width;
                for (let x = run.x0; x <= run.x1; x++) {
                    if (!(Number(mask[row + x]) || 0)) continue;
                    y0 = Math.min(y0, y);
                    y1 = Math.max(y1, y);
                }
            }
        }
        if (y1 < y0) continue;
        y0 = Math.max(box.y0, y0);
        y1 = Math.min(box.y1, y1);
        const strokeWidth = run.x1 - run.x0 + 1;
        const strokeHeight = y1 - y0 + 1;
        if (strokeHeight < Math.max(Math.round(14 * scale), lineHeight * 0.76)) continue;
        if (strokeWidth > Math.max(Math.round(4 * scale), strokeHeight * 0.16)) continue;

        let rowsWithInk = 0;
        let longestGap = 0;
        let currentGap = 0;
        let shapeInk = 0;
        let minimumCenter = Number.POSITIVE_INFINITY;
        let maximumCenter = Number.NEGATIVE_INFINITY;
        for (let y = y0; y <= y1; y++) {
            const row = y * width;
            let rowInk = 0;
            let centerSum = 0;
            for (let x = run.x0; x <= run.x1; x++) {
                if (!(Number(mask[row + x]) || 0)) continue;
                rowInk++;
                centerSum += x;
            }
            shapeInk += rowInk;
            if (!rowInk) {
                currentGap++;
                longestGap = Math.max(longestGap, currentGap);
                continue;
            }
            currentGap = 0;
            rowsWithInk++;
            const center = centerSum / rowInk;
            minimumCenter = Math.min(minimumCenter, center);
            maximumCenter = Math.max(maximumCenter, center);
        }
        if (rowsWithInk < strokeHeight * 0.78 ||
            longestGap > Math.max(Math.round(2 * scale), Math.round(strokeHeight * 0.08)) ||
            shapeInk < strokeHeight * 0.70 ||
            maximumCenter - minimumCenter >
                Math.max(Math.round(3 * scale), strokeWidth * 1.8)) continue;
        verticalShapes.push({
            x0: run.x0,
            y0,
            x1: run.x1,
            y1,
            height: strokeHeight,
            width: strokeWidth,
            ink: shapeInk
        });
    }

    let best: RasterVerticalShape | null = null;
    let bestScore = Number.NEGATIVE_INFINITY;
    for (const candidate of verticalShapes) {
        const centerX = (candidate.x0 + candidate.x1) * 0.5;
        const relativeX = (centerX - box.x0) / lineWidth;
        if (relativeX < 0.48 || relativeX > 0.92) continue;
        let leftNeighbor = box.x0 - 1;
        let rightNeighbor = box.x1 + 1;
        for (let x = candidate.x0 - 1; x >= box.x0; x--) {
            if ((Number(columnInk[x]) || 0) > 0) { leftNeighbor = x; break; }
        }
        for (let x = candidate.x1 + 1; x <= box.x1; x++) {
            if ((Number(columnInk[x]) || 0) > 0) { rightNeighbor = x; break; }
        }
        if (leftNeighbor < box.x0 || rightNeighbor > box.x1) continue;
        const leftGap = candidate.x0 - leftNeighbor - 1;
        const rightGap = rightNeighbor - candidate.x1 - 1;
        if (leftGap < minimumGap || rightGap < minimumGap) continue;

        let leftInk = 0;
        let rightInk = 0;
        let otherY0 = sourceHeight;
        let otherY1 = -1;
        for (let x = box.x0; x <= box.x1; x++) {
            const ink = Math.max(0, Number(columnInk[x]) || 0);
            if (x < candidate.x0) leftInk += ink;
            if (x > candidate.x1) rightInk += ink;
            if (!ink || (x >= candidate.x0 && x <= candidate.x1) ||
                !columnYMin || !columnYMax) continue;
            const minimum = Number(columnYMin[x]);
            const maximum = Number(columnYMax[x]);
            if (!isFinite(minimum) || !isFinite(maximum) || maximum < minimum) continue;
            otherY0 = Math.min(otherY0, minimum);
            otherY1 = Math.max(otherY1, maximum);
        }
        if (leftInk < totalInk * 0.28 || rightInk < totalInk * 0.04) continue;
        if (otherY1 >= otherY0 && candidate.height < (otherY1 - otherY0 + 1) * 1.05) {
            continue;
        }

        // Paired tall strokes are more likely to delimit an absolute value.
        // Reject the ambiguous raster case and let full-line OCR handle it.
        const pairedBar = verticalShapes.some(other => {
            if (other === candidate) return false;
            let otherLeftNeighbor = box.x0 - 1;
            let otherRightNeighbor = box.x1 + 1;
            for (let x = other.x0 - 1; x >= box.x0; x--) {
                if ((Number(columnInk[x]) || 0) > 0) {
                    otherLeftNeighbor = x;
                    break;
                }
            }
            for (let x = other.x1 + 1; x <= box.x1; x++) {
                if ((Number(columnInk[x]) || 0) > 0) {
                    otherRightNeighbor = x;
                    break;
                }
            }
            // A digit 1 inside a number such as `12` is another tall raster
            // shape, but it is not isolated on both sides. Only a second
            // independently separated bar may trigger the absolute-value
            // ambiguity guard.
            if (otherLeftNeighbor < box.x0 || otherRightNeighbor > box.x1 ||
                other.x0 - otherLeftNeighbor - 1 < minimumGap ||
                otherRightNeighbor - other.x1 - 1 < minimumGap) return false;
            const heightRatio = Math.min(other.height, candidate.height) /
                Math.max(other.height, candidate.height);
            const verticalOverlap = Math.max(
                0,
                Math.min(other.y1, candidate.y1) - Math.max(other.y0, candidate.y0) + 1
            );
            const overlapRatio = verticalOverlap / Math.min(other.height, candidate.height);
            const distance = Math.abs(
                (other.x0 + other.x1) * 0.5 - (candidate.x0 + candidate.x1) * 0.5
            );
            return heightRatio >= 0.82 && overlapRatio >= 0.78 &&
                distance >= minimumGap && distance <= lineWidth * 0.35;
        });
        if (pairedBar) continue;

        const score = candidate.height * 3 + leftGap + rightGap -
            candidate.width * 3 + candidate.ink * 0.1;
        if (score > bestScore) {
            bestScore = score;
            best = candidate;
        }
    }
    return best
        ? { x0: best.x0, y0: best.y0, x1: best.x1, y1: best.y1 }
        : null;
}

function hashBinaryRegion(
    mask: Uint8Array,
    sourceWidth: number,
    x0: number,
    y0: number,
    width: number,
    height: number
): string {
    let hash = 0x811c9dc5;
    const mix = (value: number): void => {
        hash ^= value & 0xff;
        hash = Math.imul(hash, 0x01000193) >>> 0;
    };
    mix(width);
    mix(width >>> 8);
    mix(height);
    mix(height >>> 8);
    for (let y = 0; y < height; y++) {
        const row = (y0 + y) * sourceWidth + x0;
        for (let x = 0; x < width; x++) mix(mask[row + x]);
    }
    return width + 'x' + height + '-' + hash.toString(16).padStart(8, '0');
}

/**
 * Splits an already cropped handwriting canvas into deterministic black/white
 * line crops. Bounding boxes are relative to the supplied source canvas.
 */
export function segmentOcrCanvas(
    source: HTMLCanvasElement,
    pixelScale = 1,
    options: OcrCanvasSegmentationOptions = {}
): OcrLineSegment[] {
    const width = Math.max(0, source.width | 0);
    const height = Math.max(0, source.height | 0);
    if (!width || !height) return [];

    const context = source.getContext('2d', { willReadFrequently: true });
    if (!context) return [];
    const image = context.getImageData(0, 0, width, height);
    const mask = new Uint8Array(width * height);
    const rowInk = new Uint32Array(height);

    for (let y = 0; y < height; y++) {
        const row = y * width;
        for (let x = 0; x < width; x++) {
            const pixel = row + x;
            if (!isInkPixel(image.data, pixel * 4)) continue;
            mask[pixel] = 1;
            rowInk[y]++;
        }
    }

    const maskStructuralBoxes = (rawBoxes: unknown): void => {
        const boxes = Array.isArray(rawBoxes) ? rawBoxes : [];
        for (const rawBox of boxes) {
            if (!rawBox || typeof rawBox !== 'object') continue;
            const box = rawBox as Partial<OcrSymbolBox>;
            if (![box.x0, box.y0, box.x1, box.y1].every(Number.isFinite)) continue;
            const x0 = Math.max(0, Math.floor(Math.min(Number(box.x0), Number(box.x1))));
            const x1 = Math.min(width - 1, Math.ceil(Math.max(Number(box.x0), Number(box.x1))));
            const y0 = Math.max(0, Math.floor(Math.min(Number(box.y0), Number(box.y1))));
            const y1 = Math.min(height - 1, Math.ceil(Math.max(Number(box.y0), Number(box.y1))));
            if (x1 < x0 || y1 < y0) continue;
            for (let y = y0; y <= y1; y++) {
                const row = y * width;
                for (let x = x0; x <= x1; x++) {
                    const pixel = row + x;
                    if (!mask[pixel]) continue;
                    mask[pixel] = 0;
                    if (rowInk[y] > 0) rowInk[y]--;
                }
            }
        }
    };

    if (options.maskCalculationRules) {
        maskStructuralBoxes((source as HTMLCanvasElement & {
            __liaOcrCalculationRules?: unknown;
        }).__liaOcrCalculationRules);
    }
    if (options.maskCarryOnes) {
        maskStructuralBoxes((source as HTMLCanvasElement & {
            __liaOcrCarryOneHints?: unknown;
        }).__liaOcrCarryOneHints);
    }
    if (options.maskDivisionRules) {
        maskStructuralBoxes((source as HTMLCanvasElement & {
            __liaOcrDivisionRules?: unknown;
        }).__liaOcrDivisionRules);
    }

    const scale = normalizePixelScale(pixelScale);
    let bands = findOcrLineBands(rowInk, width, scale);
    if (options.maskCalculationRules && options.minimumColumnRowsAboveRule) {
        bands = splitOcrColumnLineBands(
            rowInk,
            bands,
            (source as HTMLCanvasElement & {
                __liaOcrCalculationRules?: unknown;
            }).__liaOcrCalculationRules,
            options.minimumColumnRowsAboveRule,
            scale
        );
    }
    if (options.maskDivisionRules) {
        bands = splitOcrDivisionLineBands(
            rowInk,
            bands,
            (source as HTMLCanvasElement & {
                __liaOcrDivisionRules?: unknown;
            }).__liaOcrDivisionRules
        );
    }
    const verticalStrokeHints: OcrVerticalStrokeHint[] = Array.isArray(
        (source as HTMLCanvasElement & { __liaOcrVerticalStrokes?: unknown }).__liaOcrVerticalStrokes
    )
        ? ((source as HTMLCanvasElement & { __liaOcrVerticalStrokes: OcrVerticalStrokeHint[] })
            .__liaOcrVerticalStrokes)
        : [];
    const plusMinusBoxes: OcrSymbolBox[] = Array.isArray(
        (source as HTMLCanvasElement & { __liaOcrPlusMinusBoxes?: unknown })
            .__liaOcrPlusMinusBoxes
    )
        ? ((source as HTMLCanvasElement & { __liaOcrPlusMinusBoxes: OcrSymbolBox[] })
            .__liaOcrPlusMinusBoxes)
        : [];
    const delimiterHints: OcrDelimiterHint[] = Array.isArray(
        (source as HTMLCanvasElement & { __liaOcrDelimiterHints?: unknown })
            .__liaOcrDelimiterHints
    )
        ? ((source as HTMLCanvasElement & { __liaOcrDelimiterHints: OcrDelimiterHint[] })
            .__liaOcrDelimiterHints)
        : [];
    const segments: OcrLineSegment[] = [];
    for (let index = 0; index < bands.length; index++) {
        const band = bands[index];
        let xMin = width;
        let xMax = -1;
        let inkPixels = 0;
        const columnInk = new Uint32Array(width);
        const columnYMin = new Int32Array(width);
        const columnYMax = new Int32Array(width);
        columnYMin.fill(height);
        columnYMax.fill(-1);
        for (let y = band.y0; y <= band.y1; y++) {
            const row = y * width;
            for (let x = 0; x < width; x++) {
                if (!mask[row + x]) continue;
                inkPixels++;
                columnInk[x]++;
                if (y < columnYMin[x]) columnYMin[x] = y;
                if (y > columnYMax[x]) columnYMax[x] = y;
                if (x < xMin) xMin = x;
                if (x > xMax) xMax = x;
            }
        }
        if (xMax < xMin || inkPixels < 2) continue;

        const bandHeight = band.y1 - band.y0 + 1;
        const padX = Math.max(
            Math.round(8 * scale),
            Math.min(Math.round(28 * scale), Math.round((xMax - xMin + 1) * 0.04))
        );
        const padY = Math.max(
            Math.round(5 * scale),
            Math.min(Math.round(18 * scale), Math.round(bandHeight * 0.22))
        );
        const upperLimit = index > 0
            ? Math.floor((bands[index - 1].y1 + band.y0) / 2) + 1
            : 0;
        const lowerLimit = index + 1 < bands.length
            ? Math.ceil((band.y1 + bands[index + 1].y0) / 2) - 1
            : height - 1;
        const cropX0 = Math.max(0, xMin - padX);
        const cropX1 = Math.min(width - 1, xMax + padX);
        const cropY0 = Math.max(upperLimit, band.y0 - padY);
        const cropY1 = Math.min(lowerLimit, band.y1 + padY);
        const cropWidth = cropX1 - cropX0 + 1;
        const cropHeight = cropY1 - cropY0 + 1;
        if (cropWidth <= 0 || cropHeight <= 0) continue;

        const operationLineBox = {
            x0: xMin,
            y0: band.y0,
            x1: xMax,
            y1: band.y1
        };
        const operationHints: Array<{
            hint: OcrVerticalStrokeHint;
            source: 'vector' | 'raster';
        }> = [];
        const structuralHints = selectOcrStructuralBars(
            verticalStrokeHints,
            operationLineBox,
            columnInk,
            scale
        );
        const structuralDelimiterHints = selectOcrStructuralDelimiters(
            delimiterHints,
            operationLineBox,
            columnInk,
            scale,
            mask,
            width
        );
        for (const hint of verticalStrokeHints) {
            const candidate = selectOcrOperationSeparator(
                [hint],
                operationLineBox,
                columnInk,
                scale,
                columnYMin,
                columnYMax
            );
            if (!candidate || operationHints.some(entry =>
                Math.abs(entry.hint.x0 - candidate.x0) < 1 &&
                Math.abs(entry.hint.x1 - candidate.x1) < 1
            )) continue;
            operationHints.push({ hint: candidate, source: 'vector' });
        }
        operationHints.sort((left, right) =>
            scoreOcrOperationSeparatorHint(right.hint, operationLineBox, columnInk) -
            scoreOcrOperationSeparatorHint(left.hint, operationLineBox, columnInk)
        );
        if (!operationHints.length) {
            const rasterHint = selectOcrRasterOperationSeparator(
                mask,
                width,
                operationLineBox,
                columnInk,
                scale,
                columnYMin,
                columnYMax
            );
            if (rasterHint) operationHints.push({ hint: rasterHint, source: 'raster' });
        }

        const canvas = document.createElement('canvas');
        canvas.width = cropWidth;
        canvas.height = cropHeight;
        const cropContext = canvas.getContext('2d', { willReadFrequently: true });
        if (!cropContext) continue;
        const output = cropContext.createImageData(cropWidth, cropHeight);
        for (let y = 0; y < cropHeight; y++) {
            const sourceRow = (cropY0 + y) * width + cropX0;
            const targetRow = y * cropWidth;
            for (let x = 0; x < cropWidth; x++) {
                const target = (targetRow + x) * 4;
                const value = mask[sourceRow + x] ? 0 : 255;
                output.data[target] = value;
                output.data[target + 1] = value;
                output.data[target + 2] = value;
                output.data[target + 3] = 255;
            }
        }
        cropContext.putImageData(output, 0, 0);
        const operationSeparators: OcrOperationSeparator[] = operationHints.map(entry => ({
                x0: Math.max(
                    0,
                    Math.floor(Math.min(entry.hint.x0, entry.hint.x1)) - cropX0
                ),
                x1: Math.min(
                    cropWidth - 1,
                    Math.ceil(Math.max(entry.hint.x0, entry.hint.x1)) - cropX0
                ),
                source: entry.source,
                confidence: entry.source === 'vector' && entry.hint.hasTopHook === false
                    ? 'high'
                    : 'normal'
            }));
        const operationSeparator = operationSeparators[0];
        const structuralBars: OcrOperationSeparator[] = structuralHints.map(hint => ({
            x0: Math.max(
                0,
                Math.floor(Math.min(hint.x0, hint.x1)) - cropX0
            ),
            x1: Math.min(
                cropWidth - 1,
                Math.ceil(Math.max(hint.x0, hint.x1)) - cropX0
            ),
            source: 'vector',
            confidence: 'high'
        }));
        const structuralDelimiters: OcrStructuralDelimiter[] =
            structuralDelimiterHints.map(hint => ({
                x0: Math.max(
                    0,
                    Math.floor(Math.min(hint.x0, hint.x1)) - cropX0
                ),
                x1: Math.min(
                    cropWidth - 1,
                    Math.ceil(Math.max(hint.x0, hint.x1)) - cropX0
                ),
                kind: hint.kind
            }));
        const plusMinusHints = plusMinusBoxes
            .filter(box => {
                const centerX = (box.x0 + box.x1) / 2;
                const centerY = (box.y0 + box.y1) / 2;
                if (centerX < xMin || centerX > xMax ||
                    centerY < cropY0 || centerY > cropY1 ||
                    box.y0 < cropY0 || box.y1 > cropY1) return false;
                const boxX0 = Math.max(0, Math.floor(box.x0));
                const boxY0 = Math.max(0, Math.floor(box.y0));
                const boxX1 = Math.min(width - 1, Math.ceil(box.x1));
                const boxY1 = Math.min(height - 1, Math.ceil(box.y1));
                let ink = 0;
                const columns = new Set<number>();
                const rows = new Set<number>();
                for (let y = boxY0; y <= boxY1; y++) {
                    const row = y * width;
                    for (let x = boxX0; x <= boxX1; x++) {
                        if (!mask[row + x]) continue;
                        ink++;
                        columns.add(x);
                        rows.add(y);
                    }
                }
                const boxWidth = Math.max(1, boxX1 - boxX0 + 1);
                const boxHeight = Math.max(1, boxY1 - boxY0 + 1);
                return ink >= Math.max(6, Math.round((boxWidth + boxHeight) * 0.6)) &&
                    columns.size >= Math.max(2, Math.round(boxWidth * 0.45)) &&
                    rows.size >= Math.max(2, Math.round(boxHeight * 0.45));
            })
            .map(box => ({
                x0: Math.max(0, box.x0 - cropX0),
                y0: Math.max(0, box.y0 - cropY0),
                x1: Math.min(cropWidth - 1, box.x1 - cropX0),
                y1: Math.min(cropHeight - 1, box.y1 - cropY0)
            }));
        segments.push({
            canvas,
            bbox: { x: cropX0, y: cropY0, width: cropWidth, height: cropHeight },
            inkBox: {
                x: xMin,
                y: band.y0,
                width: xMax - xMin + 1,
                height: band.y1 - band.y0 + 1
            },
            fingerprint: hashBinaryRegion(
                mask,
                width,
                xMin,
                band.y0,
                xMax - xMin + 1,
                band.y1 - band.y0 + 1
            ),
            inkPixels,
            operationSeparator,
            operationSeparators,
            structuralBars,
            structuralDelimiters,
            plusMinusHints,
            hasPlusMinusHint: plusMinusHints.length > 0
        });
    }
    return segments;
}

const TEX_RELATION_COMMANDS = new Set([
    'le', 'leq', 'ge', 'geq', 'approx', 'neq', 'ne', 'equiv', 'sim',
    'simeq', 'cong', 'propto', 'in', 'notin', 'subset', 'subseteq',
    'supset', 'supseteq', 'to', 'mapsto', 'implies', 'iff'
]);

function hasRelationAt(value: string, index: number): boolean {
    const two = value.slice(index, index + 2);
    if (two === '<=' || two === '>=' || two === '!=' || two === ':=' || two === '==') return true;
    return '=<>\u2264\u2265\u2248\u2260\u2261\u223c'.includes(value[index] || '');
}

export function alignFirstTopLevelRelation(value: string): string {
    const source = String(value || '');
    if (!source) return source;
    let curly = 0;
    let round = 0;
    let square = 0;
    let malformed = false;
    let relationIndex = -1;

    for (let index = 0; index < source.length;) {
        const ch = source[index];
        if (ch === '%') break;
        if (ch === '&') return source;
        if (ch === '\\') {
            const next = source[index + 1] || '';
            if (!/[A-Za-z]/.test(next)) {
                index += Math.min(2, source.length - index);
                continue;
            }
            let end = index + 2;
            while (end < source.length && /[A-Za-z]/.test(source[end])) end++;
            const command = source.slice(index + 1, end);
            if (command === 'begin' || command === 'end') return source;
            if (relationIndex < 0 && curly === 0 && round === 0 && square === 0) {
                if (TEX_RELATION_COMMANDS.has(command)) relationIndex = index;
                else if (command === 'not') {
                    let lookahead = end;
                    while (lookahead < source.length && /\s/.test(source[lookahead])) lookahead++;
                    if (hasRelationAt(source, lookahead)) relationIndex = index;
                }
            }
            index = end;
            continue;
        }
        if (ch === '{') curly++;
        else if (ch === '}') { curly--; if (curly < 0) malformed = true; }
        else if (ch === '(') round++;
        else if (ch === ')') { round--; if (round < 0) malformed = true; }
        else if (ch === '[') square++;
        else if (ch === ']') { square--; if (square < 0) malformed = true; }
        else if (relationIndex < 0 && curly === 0 && round === 0 && square === 0 &&
            hasRelationAt(source, index)) {
            relationIndex = index;
        }
        index++;
    }
    if (malformed || curly !== 0 || round !== 0 || square !== 0 || relationIndex < 0) return source;
    return source.slice(0, relationIndex) + '&' + source.slice(relationIndex);
}

export function canComposeOcrOperationSeparator(left: string, right: string): boolean {
    const main = String(left || '').trim();
    const side = String(right || '').trim();
    if (!main) return false;
    const aligned = alignFirstTopLevelRelation(main);
    if (aligned === main) return false;
    const alignmentIndex = aligned.indexOf('&');
    if (alignmentIndex < 0) return false;
    const relationAndRhs = aligned.slice(alignmentIndex + 1);
    const rhs = relationAndRhs.replace(
        /^(?:(?:<=|>=|!=|:=|==|[=<>\u2264\u2265\u2248\u2260\u2261\u223c])|\\(?:le|leq|ge|geq|approx|neq|ne|equiv|sim|simeq|cong|propto|in|notin|subset|subseteq|supset|supseteq|to|mapsto|implies|iff)\b)\s*/,
        ''
    );
    const trimmedRhs = rhs.trim();
    if (!trimmedRhs || /[+\-*/=,:;]$/.test(trimmedRhs) ||
        /\\(?:cdot|div|times)\s*$/.test(trimmedRhs)) return false;
    let rawBars = 0;
    let slashRun = 0;
    for (const character of main) {
        if (character === '|') {
            if (slashRun % 2 === 0) rawBars++;
            slashRun = 0;
        } else if (character === '\\') {
            slashRun++;
        } else {
            slashRun = 0;
        }
    }
    const leftBars = (main.match(/\\lvert\b/g) || []).length;
    const rightBars = (main.match(/\\rvert\b/g) || []).length;
    const neutralBars = (main.match(/\\vert\b/g) || []).length;
    const leftDoubleBars = (main.match(/\\lVert\b/g) || []).length;
    const rightDoubleBars = (main.match(/\\rVert\b/g) || []).length;
    const neutralDoubleBars = (main.match(/\\Vert\b/g) || []).length;
    if (rawBars % 2 !== 0 || leftBars !== rightBars || neutralBars % 2 !== 0 ||
        leftDoubleBars !== rightDoubleBars || neutralDoubleBars % 2 !== 0) return false;
    return /^(?:[+\-:/]|\\(?:cdot|div|times)\b)/.test(side);
}

/**
 * FormulaNet occasionally renders the two dots of a handwritten division
 * annotation as a leading semicolon or equals sign. Immediately after a
 * geometrically confirmed operation bar, neither form is a supported
 * school-algebra side operation; normalize only that narrow leading shape and
 * leave all other text untouched.
 */
export function normalizeOcrOperationSide(value: string): string {
    const source = String(value || '').trim();
    return /^(?:;|=(?=\s*[^=]))(?=\s*\S)/.test(source)
        ? ':' + source.slice(1)
        : source;
}

function normalizeOcrEquationEvidence(value: string): string {
    return String(value || '')
        .trim()
        .replace(/&/gu, '')
        .replace(/\\(?:left|right)\b/gu, '')
        .replace(/\\dfrac\b/gu, '\\frac')
        .replace(/\s/gu, '');
}

/**
 * Restores a transformation bar only when vector-based split OCR already
 * supplied the complete equation to its left. This is deliberately not a
 * general text repair: without that independent evidence, `x=6:3` remains
 * ambiguous and must not be reinterpreted as a school operation.
 */
export function recoverOcrOperationSeparatorFromWholeLine(
    wholeLine: string,
    leftEvidence: string
): string | null {
    const source = String(wholeLine || '').replace(/&/gu, '').trim();
    const expected = normalizeOcrEquationEvidence(leftEvidence);
    if (!source || !expected ||
        !canComposeOcrOperationSeparator(leftEvidence, '+0')) return null;

    let curly = 0;
    let round = 0;
    let square = 0;
    let equalitySeen = false;
    const candidates: number[] = [];
    for (let index = 0; index < source.length;) {
        const character = source[index];
        if (character === '\\') {
            let end = index + 1;
            while (end < source.length && /[A-Za-z]/u.test(source[end])) end++;
            const command = source.slice(index + 1, end);
            if (equalitySeen && curly === 0 && round === 0 && square === 0 &&
                (command === 'cdot' || command === 'times' || command === 'div')) {
                candidates.push(index);
            }
            index = Math.max(end, index + 2);
            continue;
        }
        if (character === '{') curly++;
        else if (character === '}') curly--;
        else if (character === '(') round++;
        else if (character === ')') round--;
        else if (character === '[') square++;
        else if (character === ']') square--;
        else if (curly === 0 && round === 0 && square === 0) {
            if (character === '=') equalitySeen = true;
            else if (equalitySeen && '+-:/*'.includes(character)) candidates.push(index);
        }
        if (curly < 0 || round < 0 || square < 0) return null;
        index++;
    }
    if (curly !== 0 || round !== 0 || square !== 0) return null;

    for (const index of candidates) {
        const left = source.slice(0, index).trim();
        const right = normalizeOcrOperationSide(source.slice(index));
        const normalizedLeft = normalizeOcrEquationEvidence(left);
        const exactLeftMatch = normalizedLeft === expected;
        const vectorBarReadAsOne = normalizedLeft === expected + '1';
        if (!exactLeftMatch && !vectorBarReadAsOne) continue;
        const trustedLeft = vectorBarReadAsOne
            ? String(leftEvidence || '').trim()
            : left;
        if (!canComposeOcrOperationSeparator(trustedLeft, right)) continue;
        return trustedLeft + ' \\mid ' + right;
    }
    return null;
}

const INDEXED_ROOT_WITHOUT_PLUS_MINUS =
    /^(\s*(?:(?:⇒|⟹|=>|\\(?:Rightarrow|Longrightarrow|implies)\b)\s*)?[A-Za-z]_\{(?:1,2|12)\}\s*=\s*)(\\sqrt\b[\s\S]*)$/u;

const INDEXED_ROOT_CONTEXT =
    /^\s*(?:(?:⇒|⟹|=>|\\(?:Rightarrow|Longrightarrow|implies)\b)\s*)?([A-Za-z])_\{(?:1,2|12)\}\s*=\s*\\sqrt\{([\s\S]+)\}\s*$/u;

function normalizeOcrRootComparison(value: string): string {
    return String(value || '')
        .replace(/\\(?:left|right)\b/gu, '')
        .replace(/\\dfrac\b/gu, '\\frac')
        .replace(/\s/gu, '');
}

export function findMissingPlusMinusRootLine(
    lines: readonly string[]
): number {
    for (let index = 1; index < lines.length; index++) {
        const target = INDEXED_ROOT_CONTEXT.exec(String(lines[index] || ''));
        if (!target) continue;
        const previous = String(lines[index - 1] || '')
            .split(/\\mid\b/u, 1)[0]
            .replace(/\s/gu, '');
        const equation = /^([A-Za-z])(?:\^\{2\}|\^2|²)=([\s\S]+)$/u.exec(previous);
        if (!equation || equation[1].toLowerCase() !== target[1].toLowerCase()) continue;
        if (normalizeOcrRootComparison(equation[2]) !==
            normalizeOcrRootComparison(target[2])) continue;
        return index;
    }
    return -1;
}

export function canRestoreOcrPlusMinusFromSplit(
    left: string,
    right: string
): boolean {
    const leftSource = String(left || '').replace(/&/gu, '').trim();
    const rightSource = String(right || '').trim();
    return /^(?:(?:⇒|⟹|=>|\\(?:Rightarrow|Longrightarrow|implies)\b)\s*)?[A-Za-z]_\{(?:1,2|12)\}\s*=\s*$/u
        .test(leftSource) &&
        /^\\sqrt\b/u.test(rightSource);
}

/**
 * Inserts the common OCR omission in indexed root notation. Callers must
 * supply their own proof: either an explicit learner action in the editor or
 * position-confirmed three-stroke vector evidence around the missing symbol.
 */
export function insertPlusMinusIntoIndexedRootSolution(
    value: string
): string | null {
    const source = String(value || '');
    if (/(?:±|\\pm(?![A-Za-z]))/u.test(source)) return null;
    const match = INDEXED_ROOT_WITHOUT_PLUS_MINUS.exec(source);
    if (!match) return null;
    return match[1] + '\\pm' + match[2];
}

const OCR_GREEK_VARIABLE_COMMANDS = new Set([
    'alpha', 'beta', 'gamma', 'delta', 'epsilon', 'varepsilon', 'zeta', 'eta',
    'theta', 'vartheta', 'iota', 'kappa', 'lambda', 'mu', 'nu', 'xi', 'pi',
    'varpi', 'rho', 'varrho', 'sigma', 'varsigma', 'tau', 'upsilon', 'phi',
    'varphi', 'chi', 'psi', 'omega'
]);

function hasBalancedOcrTexGroups(source: string): boolean {
    let depth = 0;
    for (let index = 0; index < source.length; index++) {
        if (source[index] === '\\') {
            index++;
            continue;
        }
        if (source[index] === '{') depth++;
        if (source[index] === '}' && --depth < 0) return false;
    }
    return depth === 0;
}

/**
 * Formula OCR sometimes capitalizes the only school-algebra variable. Prefer
 * lowercase x only when the entire block contains no competing variable or
 * explicit uppercase context. Manual edits do not pass through this helper.
 */
function normalizeUncontextualizedUppercaseX(lines: readonly string[]): string[] {
    const output = lines.slice();
    const block = output.join('\n');
    if (!hasBalancedOcrTexGroups(block)) return output;

    const protectedUppercaseX = [
        /\\(?:vec|mathbf|mathcal|mathrm|text|operatorname)\s*\{\s*X(?:\s|\})/,
        /(?:^|[^A-Za-z])X\s*_/m,
        /_\s*\{?\s*X(?:\s|\}|$)/m,
        /(?:^|[^A-Za-z])X\s*'(?:\s|$)/m,
        /(?:^|[^A-Za-z])X\s*\^\s*(?:T|\{\s*(?:T|\\top)\s*\})/m,
        /(?:^|[^A-Za-z])X\s*\(/m,
        /(?:^|[^A-Za-z])X\s*=\s*\(/m,
        /\\Delta\s+X(?:\s|$)/m,
        /(?:^|[^A-Za-z])X\s*\\sim\b/m,
        /(?:^|[^A-Za-z])X\s*=.*\\(?:mathrm|text)\b/m
    ];
    if (protectedUppercaseX.some(pattern => pattern.test(block))) return output;

    const variables = new Set<string>();
    for (const source of output) {
        for (let index = 0; index < source.length;) {
            const character = source[index];
            if (character === '\\') {
                let end = index + 1;
                while (end < source.length && /[A-Za-z]/.test(source[end])) end++;
                const command = source.slice(index + 1, end);
                if (OCR_GREEK_VARIABLE_COMMANDS.has(command)) variables.add('\\' + command);
                index = Math.max(end, index + 2);
                continue;
            }
            if (/[A-Za-z]/.test(character)) {
                let end = index + 1;
                while (end < source.length && /[A-Za-z]/.test(source[end])) end++;
                const token = source.slice(index, end);
                variables.add(token.length === 1 && /[xX]/.test(token) ? 'x' : token);
                index = end;
                continue;
            }
            index++;
        }
    }
    if (variables.size !== 1 || !variables.has('x')) return output;

    return output.map(source => source.replace(
        /(^|[^A-Za-z\\])X(?=$|[^A-Za-z_])/g,
        (_match, prefix: string) => prefix + 'x'
    ));
}

/**
 * Repairs `exists x=...` as a misread leading `3` only when neighboring rows
 * prove the concrete school-algebra chain `3x... -> 3x=... -> x=...`.
 */
export function normalizeCalculationLineSequence(lines: readonly string[]): string[] {
    const output = lines.map(line => String(line || '').trim());

    const solvedVariable = (source: string): string => {
        const match = String(source || '').match(
            /^\s*(?:\{([A-Za-z])\}|([A-Za-z]))\s*(?:&\s*)?=(?!=)/
        );
        return match ? (match[1] || match[2] || '') : '';
    };
    const leadingCoefficientDot = (
        source: string,
        requireImmediateRelation: boolean
    ): { coefficient: string; prefix: string } | null => {
        const suffix = requireImmediateRelation
            ? '(?=\\s*(?:==|<=|>=|!=|=|<|>))'
            : '(?=\\s*(?:[+\\-]|==|<=|>=|!=|=|<|>))';
        const match = String(source || '').match(new RegExp(
            '^(\\s*[+\\-]?\\s*\\d+(?:[.,]\\d+)?\\s*(?:\\\\,)?\\s*)' +
            '\\\\cdot\\b' + suffix
        ));
        if (!match) return null;
        return {
            coefficient: match[1].replace(/\s+/g, ''),
            prefix: match[1]
        };
    };
    const repairLeadingCoefficientDot = (
        source: string,
        variable: string,
        expectedCoefficient: string
    ): string => {
        const candidate = leadingCoefficientDot(source, false);
        if (!candidate || candidate.coefficient !== expectedCoefficient ||
            alignFirstTopLevelRelation(source) === source) return source;
        return source.replace(
            /^(\s*[+\-]?\s*\d+(?:[.,]\d+)?\s*(?:\\,)?\s*)\\cdot\b/,
            '$1' + variable
        );
    };

    const leadingCoefficientVariable = (
        source: string
    ): { coefficient: string; variable: string } | null => {
        const match = String(source || '').match(
            /^\s*([+\-]?\s*\d+(?:[.,]\d+)?\s*(?:\\,)?\s*)(?:\{([A-Za-z])\}|([A-Za-z]))(?=\s*(?:[+\-]|==|<=|>=|!=|=|<|>))/
        );
        if (!match || alignFirstTopLevelRelation(source) === source) return null;
        return {
            coefficient: match[1].replace(/\s+/g, ''),
            variable: match[2] || match[3] || ''
        };
    };

    // A correctly recognized following row can disambiguate the same
    // coefficient in the row above: 3\cdot-5=7 followed by 3x=12.
    // Parenthesized and ordinary multiplication operands do not match the
    // deliberately narrow leadingCoefficientDot shape.
    for (let index = 0; index + 1 < output.length; index++) {
        const candidate = leadingCoefficientDot(output[index], false);
        const next = leadingCoefficientVariable(output[index + 1]);
        if (!candidate || !next || candidate.coefficient !== next.coefficient) continue;
        output[index] = repairLeadingCoefficientDot(
            output[index],
            next.variable,
            candidate.coefficient
        );
    }

    // texify2 occasionally reads a handwritten variable as `\\cdot`. Do
    // not replace multiplication signs globally: first require a malformed
    // coefficient-dot-relation row such as `3\\cdot=13`, then take the
    // variable from an immediately adjacent solved row such as `X=13/3`.
    // Only consecutive rows with the same leading coefficient are repaired.
    for (let index = 0; index < output.length; index++) {
        const anchor = leadingCoefficientDot(output[index], true);
        if (!anchor) continue;
        const adjacentVariables = [
            index > 0 ? solvedVariable(output[index - 1]) : '',
            index + 1 < output.length ? solvedVariable(output[index + 1]) : ''
        ].filter(Boolean);
        const uniqueVariables = Array.from(new Set(adjacentVariables));
        if (uniqueVariables.length !== 1) continue;
        const variable = uniqueVariables[0];
        output[index] = repairLeadingCoefficientDot(
            output[index],
            variable,
            anchor.coefficient
        );
        for (let previous = index - 1; previous >= 0; previous--) {
            const repaired = repairLeadingCoefficientDot(
                output[previous],
                variable,
                anchor.coefficient
            );
            if (repaired === output[previous]) break;
            output[previous] = repaired;
        }
    }

    for (let index = 1; index + 1 < output.length; index++) {
        const current = output[index];
        const existsMatch = current.match(
            /^(?:\u2203\s*|\\exists\s*)(?:\{([A-Za-z])\}|([A-Za-z]))\s*=/
        );
        if (!existsMatch) continue;
        const variable = existsMatch[1] || existsMatch[2];
        const previousSource = output[index - 1];
        const previous = previousSource.replace(/\s+/g, '');
        const next = output[index + 1].replace(/\s+/g, '');
        const escapedVariable = variable.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const previousStartsWithThree = new RegExp(
            '^3(?:\\\\,)?' + escapedVariable + '(?=[+\\-*/^_=<>])'
        ).test(previous);
        const nextSolvesVariable = new RegExp('^' + escapedVariable + '=').test(next);
        const previousHasRelation = alignFirstTopLevelRelation(previousSource) !== previousSource;
        if (!previousStartsWithThree || !previousHasRelation || !nextSolvesVariable) continue;
        output[index] = '3' + variable + '=' + current.slice(existsMatch[0].length);
    }
    return normalizeUncontextualizedUppercaseX(output);
}

export function composeMultilineLatex(lines: readonly string[]): string {
    const clean = lines.map(line => String(line || '').trim()).filter(Boolean);
    if (!clean.length) return '';
    if (clean.length === 1) return clean[0];
    return '\\begin{aligned} ' + clean.map(alignFirstTopLevelRelation).join(' \\\\ ') + ' \\end{aligned}';
}

export function editableTextToLatex(value: string): string {
    return composeMultilineLatex(String(value || '').replace(/\r/g, '').split('\n'));
}
