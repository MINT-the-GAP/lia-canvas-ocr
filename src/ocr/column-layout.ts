import type { OcrCarryOneHint, OcrCalculationRuleHint } from './symbol-geometry';

export type OcrColumnSegmentLike = {
    bbox: { x: number; y: number; width: number; height: number };
    /**
     * Unpadded ink bounds in the same coordinate space as the crop bbox.
     *
     * OCR line crops add symmetric whitespace around the actual strokes. The
     * optional ink box keeps that implementation detail from shifting the
     * inferred digit grid. Callers without it retain the bbox-only fallback.
     */
    inkBox?: { x: number; y: number; width: number; height: number };
    inkPixels?: number;
};

export type OcrColumnAdditionSelection<T extends OcrColumnSegmentLike> = {
    rule: OcrCalculationRuleHint;
    operands: [T, T];
    result: T;
};

export type OcrColumnStackSelection<T extends OcrColumnSegmentLike> = {
    rule: OcrCalculationRuleHint;
    rowsAbove: T[];
    result: T;
};

function centerY(segment: OcrColumnSegmentLike): number {
    return segment.bbox.y + segment.bbox.height / 2;
}

function segmentScore(segment: OcrColumnSegmentLike): number {
    return Math.max(1, Number(segment.inkPixels) || 0) +
        Math.max(1, segment.bbox.width) * Math.max(1, segment.bbox.height);
}

/**
 * Selects the two full-size operand rows above a confirmed calculation rule
 * and the result row below it. Tiny carry rows and isolated noise lose against
 * the full-size rows; the selected rows are returned in reading order.
 */
export function selectOcrColumnAdditionSegments<T extends OcrColumnSegmentLike>(
    segments: readonly T[],
    rules: readonly OcrCalculationRuleHint[]
): OcrColumnAdditionSelection<T> | null {
    let best: (OcrColumnAdditionSelection<T> & { score: number }) | null = null;
    for (const rule of rules) {
        const ruleY = (rule.y0 + rule.y1) / 2;
        const above = segments.filter(segment => centerY(segment) < ruleY);
        const below = segments.filter(segment => centerY(segment) > ruleY);
        if (above.length < 2 || below.length < 1) continue;

        const maximumAboveHeight = Math.max(...above.map(segment => segment.bbox.height));
        const fullSizeAbove = above.filter(segment =>
            segment.bbox.height >= maximumAboveHeight * 0.62
        );
        if (fullSizeAbove.length < 2) continue;
        const operands = fullSizeAbove
            .slice()
            .sort((left, right) => centerY(right) - centerY(left))
            .slice(0, 2)
            .sort((left, right) => centerY(left) - centerY(right)) as [T, T];

        const referenceHeight = Math.max(
            operands[0].bbox.height,
            operands[1].bbox.height
        );
        const result = below
            .filter(segment => segment.bbox.height >= referenceHeight * 0.55)
            .slice()
            .sort((left, right) =>
                centerY(left) - centerY(right) || segmentScore(right) - segmentScore(left)
            )[0];
        if (!result) continue;

        const score = (rule.x1 - rule.x0) +
            segmentScore(operands[0]) + segmentScore(operands[1]) +
            segmentScore(result);
        if (!best || score > best.score) {
            best = { rule, operands, result, score };
        }
    }
    if (!best) return null;
    return { rule: best.rule, operands: best.operands, result: best.result };
}

/**
 * Selects every full-size written row above a final calculation rule and the
 * first full-size result below it. This is the multiplication counterpart of
 * the two-operand selector: place-value products may contain an arbitrary
 * number of contribution rows.
 */
export function selectOcrColumnStackSegments<T extends OcrColumnSegmentLike>(
    segments: readonly T[],
    rules: readonly OcrCalculationRuleHint[],
    minimumRowsAbove = 2
): OcrColumnStackSelection<T> | null {
    let best: (OcrColumnStackSelection<T> & { score: number }) | null = null;
    for (const rule of rules) {
        const ruleY = (rule.y0 + rule.y1) / 2;
        const above = segments.filter(segment => centerY(segment) < ruleY);
        const below = segments.filter(segment => centerY(segment) > ruleY);
        if (above.length < minimumRowsAbove || below.length < 1) continue;

        const maximumHeight = Math.max(...above.map(segment => segment.bbox.height));
        const rowsAbove = above
            .filter(segment => segment.bbox.height >= maximumHeight * 0.55)
            .slice()
            .sort((left, right) => centerY(left) - centerY(right));
        if (rowsAbove.length < minimumRowsAbove) continue;
        const referenceHeight = median(rowsAbove.map(row => row.bbox.height));
        const result = below
            .filter(segment => segment.bbox.height >= referenceHeight * 0.52)
            .slice()
            .sort((left, right) =>
                centerY(left) - centerY(right) || segmentScore(right) - segmentScore(left)
            )[0];
        if (!result) continue;
        const score = (rule.x1 - rule.x0) + segmentScore(result) +
            rowsAbove.reduce((total, row) => total + segmentScore(row), 0);
        if (!best || score > best.score) best = { rule, rowsAbove, result, score };
    }
    return best ? { rule: best.rule, rowsAbove: best.rowsAbove, result: best.result } : null;
}

/** Accepts the conservative FormulaNet shapes used for plain integer rows. */
export function normalizeOcrColumnDigits(
    latex: unknown,
    allowLeadingPlus = false
): string | null {
    let source = String(latex ?? '').trim();
    if (!source) return null;
    source = source
        .replace(/^\$+|\$+$/gu, '')
        .replace(/\\(?:left|right)\b/gu, '')
        .replace(/\\(?:,|;|!|quad|qquad|enspace|thinspace|medspace|thickspace)/gu, '')
        .replace(/\\(?:mathrm|mathbf|mathsf|text)\s*\{(\d+)\}/gu, '$1')
        .replace(/[{}\s~]/gu, '');
    const expression = allowLeadingPlus ? /^\+?(\d+)$/u : /^(\d+)$/u;
    const match = expression.exec(source);
    return match ? match[1].replace(/^0+(?=\d)/u, '') : null;
}

/**
 * Normalizes a plain integer row while retaining meaningful leading zeroes
 * (for example the 07 brought down during long division). An optional
 * structural operator may be present in the OCR output but is not returned.
 */
export function normalizeOcrColumnDigitsExact(
    latex: unknown,
    leadingOperator: '+' | '-' | null = null
): string | null {
    let source = String(latex ?? '').trim();
    if (!source) return null;
    source = source
        .replace(/^\$+|\$+$/gu, '')
        .replace(/\\(?:left|right)\b/gu, '')
        .replace(/\\(?:,|;|!|quad|qquad|enspace|thinspace|medspace|thickspace)/gu, '')
        .replace(/\\(?:mathrm|mathbf|mathsf|text)\s*\{(\d+)\}/gu, '$1')
        .replace(/[{}\s~]/gu, '')
        .replace(/\u2212/gu, '-');
    const escaped = leadingOperator === '+' ? '\\+' : leadingOperator === '-' ? '-' : '';
    const match = new RegExp(
        '^' + (escaped ? escaped + '?' : '') + '(\\d+)$',
        'u'
    ).exec(source);
    return match ? match[1] : null;
}

function median(values: readonly number[]): number {
    if (!values.length) return 0;
    const sorted = Array.from(values).sort((left, right) => left - right);
    const middle = Math.floor(sorted.length / 2);
    return sorted.length % 2
        ? sorted[middle]
        : (sorted[middle - 1] + sorted[middle]) / 2;
}

type OcrDigitRowGeometry = {
    digitCount: number;
    exactInkBox: boolean;
    pitch: number;
    rightmostCenter: number;
};

// Across handwritten decimal glyphs, the visible ink of the two outer half
// digits occupies roughly 55% of one cell. Thus an unpadded n-digit ink span
// is approximately (n - 0.45) cell pitches wide. Crucially, the remaining
// outer span is split across both sides: the ink/crop edge is not a center.
const OUTER_DIGIT_INK_SPAN = 0.55;
const OUTER_DIGIT_CENTER_INSET = OUTER_DIGIT_INK_SPAN / 2;

function finiteBox(
    value: unknown
): value is { x: number; y: number; width: number; height: number } {
    if (!value || typeof value !== 'object') return false;
    const box = value as { x?: unknown; y?: unknown; width?: unknown; height?: unknown };
    return typeof box.x === 'number' && Number.isFinite(box.x) &&
        typeof box.y === 'number' && Number.isFinite(box.y) &&
        typeof box.width === 'number' && Number.isFinite(box.width) && box.width > 0 &&
        typeof box.height === 'number' && Number.isFinite(box.height) && box.height > 0;
}

function digitRowGeometry(
    segment: OcrColumnSegmentLike,
    digitCount: number
): OcrDigitRowGeometry | null {
    if (!Number.isInteger(digitCount) || digitCount < 1 || !finiteBox(segment.bbox)) {
        return null;
    }
    const exactInkBox = finiteBox(segment.inkBox);
    const box = exactInkBox ? segment.inkBox! : segment.bbox;
    const pitch = box.width / Math.max(
        OUTER_DIGIT_INK_SPAN,
        digitCount - (1 - OUTER_DIGIT_INK_SPAN)
    );
    if (!Number.isFinite(pitch) || pitch <= 0) return null;
    return {
        digitCount,
        exactInkBox,
        pitch,
        rightmostCenter: box.x + box.width - OUTER_DIGIT_CENTER_INSET * pitch
    };
}

function distanceToInterval(value: number, x0: number, x1: number): number {
    if (value < x0) return x0 - value;
    if (value > x1) return value - x1;
    return 0;
}

/**
 * Maps geometrically confirmed carry-one glyphs to right-to-left digit
 * columns. Duplicate glyphs in a cell are preserved as a wrong digit count,
 * so validation never silently repairs extra handwriting.
 */
export function mapOcrCarryOnesToColumns(
    hints: readonly OcrCarryOneHint[],
    anchorRows: ReadonlyArray<{
        segment: OcrColumnSegmentLike;
        digitCount: number;
    }>,
    columns: number
): Array<string | null> | null {
    if (!Number.isInteger(columns) || columns < 1) return null;
    const rowGeometries = anchorRows
        .map(row => digitRowGeometry(row.segment, row.digitCount))
        .filter((row): row is OcrDigitRowGeometry => Boolean(row));
    if (!rowGeometries.length) {
        return hints.length ? null : new Array(columns).fill(null);
    }

    // Prefer true ink bounds whenever they are available. Crop bboxes remain a
    // backwards-compatible fallback, but their whitespace must not pollute an
    // otherwise exact median.
    const preciseRows = rowGeometries.filter(row => row.exactInkBox);
    const pitchRows = preciseRows.length ? preciseRows : rowGeometries;
    const pitch = median(pitchRows.map(row => row.pitch));
    if (!Number.isFinite(pitch) || pitch <= 0) return null;

    const columnCenters: number[] = [];
    for (let column = 0; column < columns; column++) {
        const candidates = rowGeometries.filter(row => row.digitCount > column);
        const preciseCandidates = candidates.filter(row => row.exactInkBox);
        const selected = preciseCandidates.length ? preciseCandidates : candidates;
        if (!selected.length) return null;
        columnCenters.push(median(selected.map(row =>
            row.rightmostCenter - column * row.pitch
        )));
    }

    const counts = new Array<number>(columns).fill(0);
    for (const hint of hints) {
        const x0 = Math.min(hint.x0, hint.x1);
        const x1 = Math.max(hint.x0, hint.x1);
        if (!Number.isFinite(x0) || !Number.isFinite(x1)) return null;
        const glyphCenter = (x0 + x1) / 2;
        const ranked = columnCenters.map((center, column) => ({
            column,
            intervalDistance: distanceToInterval(center, x0, x1),
            centerDistance: Math.abs(center - glyphCenter)
        })).sort((left, right) =>
            left.intervalDistance - right.intervalDistance ||
            left.centerDistance - right.centerDistance ||
            left.column - right.column
        );
        const best = ranked[0];
        if (!best || best.intervalDistance > pitch * 0.58) return null;

        // A hooked one can extend substantially to either side of its stem.
        // Comparing the complete glyph interval with cell centers avoids
        // letting that hook move the digit into a neighbouring column. A glyph
        // spanning two centers is genuinely ambiguous and is not guessed.
        const second = ranked[1];
        if (second && best.intervalDistance === 0 && second.intervalDistance === 0) {
            return null;
        }
        if (second &&
            Math.abs(second.intervalDistance - best.intervalDistance) <= pitch * 0.035 &&
            Math.abs(second.centerDistance - best.centerDistance) <= pitch * 0.035) {
            return null;
        }
        counts[best.column]++;
    }
    return counts.map(count => count ? String(Math.min(9, count)) : null);
}
