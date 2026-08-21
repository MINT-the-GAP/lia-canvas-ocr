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
        const ruleX0 = Math.min(rule.x0, rule.x1);
        const ruleX1 = Math.max(rule.x0, rule.x1);
        const horizontallyRelevantAbove = segments.filter(segment =>
            centerY(segment) < ruleY &&
            segment.bbox.x + segment.bbox.width >= ruleX0 &&
            segment.bbox.x <= ruleX1
        );
        if (horizontallyRelevantAbove.length < 2) continue;
        const localHeights = horizontallyRelevantAbove
            .map(segment => segment.bbox.height)
            .sort((a, b) => a - b);
        const initialLocalHeight = localHeights[
            Math.floor((localHeights.length - 1) * 0.68)
        ];
        // Keep this set local to the written stack. Far-away course headings
        // must not define the main row scale merely because they overlap a
        // long rule horizontally, while two smaller carry bands must not pull
        // the operand window down. The robust upper local quantile handles
        // both cases. The calculation-rule detector itself uses
        // a tighter 3.6-glyph operand window; 4.5 leaves crop-padding margin.
        const above = horizontallyRelevantAbove.filter(segment =>
            ruleY - centerY(segment) <= initialLocalHeight * 4.5
        );
        const below = segments.filter(segment =>
            centerY(segment) > ruleY &&
            segment.bbox.x + segment.bbox.width >= ruleX0 &&
            segment.bbox.x <= ruleX1
        );
        if (above.length < 2 || below.length < 1) continue;

        const maximumAboveHeight = Math.max(...above.map(segment => segment.bbox.height));
        const fullSizeAbove = above.filter(segment =>
            segment.bbox.height >= maximumAboveHeight * 0.62
        );
        if (fullSizeAbove.length < 2) continue;
        const orderedAbove = fullSizeAbove
            .slice()
            .sort((left, right) => centerY(left) - centerY(right));
        let bestPair: {
            operands: [T, T];
            score: number;
            compatibility: number;
            proximity: number;
        } | null = null;
        for (let upperIndex = 0; upperIndex < orderedAbove.length - 1; upperIndex++) {
            for (let lowerIndex = upperIndex + 1;
                lowerIndex < orderedAbove.length;
                lowerIndex++) {
                const upper = orderedAbove[upperIndex];
                const lower = orderedAbove[lowerIndex];
                const upperHeight = Math.max(1, upper.bbox.height);
                const lowerHeight = Math.max(1, lower.bbox.height);
                // Pair-relative balance alone would rate two equally small,
                // vertically staggered carry bands as a perfect operand pair.
                // At least one member must therefore reach the main row scale
                // established by the rule-local candidate set.
                if (Math.max(upperHeight, lowerHeight) /
                    Math.max(1, maximumAboveHeight) < 0.72) continue;
                const heightBalance = Math.min(upperHeight, lowerHeight) /
                    Math.max(upperHeight, lowerHeight);
                const upperInkSize = segmentScore(upper);
                const lowerInkSize = segmentScore(lower);
                const inkSizeBalance = Math.min(upperInkSize, lowerInkSize) /
                    Math.max(upperInkSize, lowerInkSize);

                // Operand rows normally have matching glyph heights even when
                // one operand contains far fewer digits. An unmasked carry row
                // can be close to the rule and cross the broad 62% height
                // prefilter, but it is smaller in both height and ink extent.
                // Weight height strongly so a genuine short operand is not
                // discarded merely for having less horizontal ink.
                const compatibility = heightBalance * 0.82 + inkSizeBalance * 0.18;
                if (compatibility < 0.64) continue;
                const totalRuleDistance = Math.max(0, ruleY - centerY(upper)) +
                    Math.max(0, ruleY - centerY(lower));
                const proximity = 1 / (1 + totalRuleDistance /
                    Math.max(1, maximumAboveHeight * 4));
                // Size compatibility must outweigh the tempting proximity of
                // annotations directly above the calculation rule. Proximity
                // remains the tie-breaker for otherwise comparable row pairs,
                // keeping distant headings out of the operand stack.
                const pairScore = compatibility * 4 + proximity;
                if (!bestPair || pairScore > bestPair.score + 1e-9 ||
                    (Math.abs(pairScore - bestPair.score) <= 1e-9 && (
                        compatibility > bestPair.compatibility + 1e-9 ||
                        (Math.abs(compatibility - bestPair.compatibility) <= 1e-9 &&
                            proximity > bestPair.proximity)
                    ))) {
                    bestPair = {
                        operands: [upper, lower],
                        score: pairScore,
                        compatibility,
                        proximity
                    };
                }
            }
        }
        if (!bestPair) continue;
        const operands = bestPair.operands;

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
 * Selects every rule-local written row above a final calculation rule and the
 * first full-size result below it. Addition uses the complete ordered stack so
 * that an unmasked carry row can be interpreted after OCR instead of silently
 * displacing an operand. Multiplication likewise keeps its arbitrary number of
 * place-value rows.
 */
export function selectOcrColumnStackSegments<T extends OcrColumnSegmentLike>(
    segments: readonly T[],
    rules: readonly OcrCalculationRuleHint[],
    minimumRowsAbove = 2
): OcrColumnStackSelection<T> | null {
    let best: (OcrColumnStackSelection<T> & { score: number }) | null = null;
    for (const rule of rules) {
        const ruleY = (rule.y0 + rule.y1) / 2;
        const ruleX0 = Math.min(rule.x0, rule.x1);
        const ruleX1 = Math.max(rule.x0, rule.x1);
        const horizontallyRelevantAbove = segments.filter(segment =>
            centerY(segment) < ruleY &&
            segment.bbox.x + segment.bbox.width >= ruleX0 &&
            segment.bbox.x <= ruleX1
        );
        if (horizontallyRelevantAbove.length < minimumRowsAbove) continue;
        const localHeights = horizontallyRelevantAbove
            .map(segment => segment.bbox.height)
            .sort((left, right) => left - right);
        const localHeight = localHeights[
            Math.floor((localHeights.length - 1) * 0.68)
        ];
        // A written stack may contain more observed operands than the prompt
        // names. A fixed distance from the rule therefore truncates the first
        // rows as soon as the stack grows. Keep the complete, vertically
        // contiguous suffix instead: the rule-nearest row must still be local
        // to the rule, while a large inter-row gap stops before headings or a
        // different calculation above it.
        const eligibleAbove = horizontallyRelevantAbove
            .filter(segment => segment.bbox.height >= localHeight * 0.55)
            .slice()
            .sort((left, right) => centerY(left) - centerY(right));
        const above: T[] = [];
        const nearestAbove = eligibleAbove[eligibleAbove.length - 1];
        if (nearestAbove &&
            ruleY - centerY(nearestAbove) <= localHeight * 1.95) {
            above.unshift(nearestAbove);
            let lowerCenter = centerY(nearestAbove);
            for (let index = eligibleAbove.length - 2; index >= 0; index--) {
                const candidate = eligibleAbove[index];
                const candidateCenter = centerY(candidate);
                if (lowerCenter - candidateCenter > localHeight * 2.4) break;
                above.unshift(candidate);
                lowerCenter = candidateCenter;
            }
        }
        const below = segments.filter(segment =>
            centerY(segment) > ruleY &&
            segment.bbox.x + segment.bbox.width >= ruleX0 &&
            segment.bbox.x <= ruleX1
        );
        if (above.length < minimumRowsAbove || below.length < 1) continue;

        const rowsAbove = above;
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

/**
 * Confirms a carry/borrow annotation from its observed ink height. Crop bbox
 * padding varies with neighboring rows, so use inkBox for every compared row
 * when it is available for all of them; otherwise fall back to bbox for all.
 */
export function isOcrColumnAnnotationRowSmaller<T extends OcrColumnSegmentLike>(
    annotation: T,
    anchorRows: readonly T[],
    maximumRatio = 0.9
): boolean {
    if (!anchorRows.length) return false;
    const allRows = [annotation, ...anchorRows];
    const useInkHeight = allRows.every(row =>
        row.inkBox && Number.isFinite(row.inkBox.height) && row.inkBox.height > 0
    );
    const height = (row: T): number => useInkHeight
        ? Number(row.inkBox!.height)
        : Number(row.bbox.height);
    const anchorHeights = anchorRows
        .map(height)
        .filter(value => Number.isFinite(value) && value > 0)
        .sort((left, right) => left - right);
    const annotationHeight = height(annotation);
    const ratio = Number(maximumRatio);
    if (!anchorHeights.length || !Number.isFinite(annotationHeight) ||
        annotationHeight <= 0 || !Number.isFinite(ratio) ||
        ratio <= 0 || ratio > 1) return false;
    const referenceHeight = anchorHeights[Math.floor(anchorHeights.length / 2)] || 0;
    return referenceHeight > 0 && annotationHeight < referenceHeight * ratio;
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

/**
 * Detects only FormulaNet's handwritten-eight-as-`g` confusion in a signed
 * subtraction-product row. No digit is returned: a caller must still prove
 * the value from the neighboring, observed long-division rows.
 */
export function isOcrColumnDivisionEightAlias(latex: unknown): boolean {
    let source = String(latex ?? '').trim();
    if (!source) return false;
    source = source
        .replace(/^\$+|\$+$/gu, '')
        .replace(/\\(?:left|right)\b/gu, '')
        .replace(/\\(?:,|;|!|quad|qquad|enspace|thinspace|medspace|thickspace)/gu, '')
        .replace(/\\(?:operatorname|mathrm|mathbf|mathsf|text)\s*\{([gG])\}/gu, '$1')
        .replace(/[{}\s~]/gu, '')
        .replace(/\u2212/gu, '-');
    return /^-g$/iu.test(source);
}

/**
 * Normalizes a plain integer row only when OCR preserved the requested
 * structural operator. Unlike `normalizeOcrColumnDigitsExact`, the operator
 * is mandatory. This is used when an observed row may extend a prompt-defined
 * operand stack: accepting an operator-less annotation there would turn a
 * carry row into a synthetic operand.
 */
export function normalizeOcrColumnDigitsWithRequiredOperator(
    latex: unknown,
    leadingOperator: '+' | '-'
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
    const escaped = leadingOperator === '+' ? '\\+' : '-';
    const match = new RegExp('^' + escaped + '(\\d+)$', 'u').exec(source);
    return match ? match[1] : null;
}

/**
 * Treats the prompt operand count as a minimum and extends it only over a
 * consecutive prefix of full-size rows with an explicitly observed plus.
 */
export function inferOcrColumnAdditionOperandCount<T extends OcrColumnSegmentLike>(
    rowsAbove: readonly T[],
    recognizedLatex: readonly unknown[],
    minimumOperandCount: number,
    maximumOperandCount = 32
): number {
    const maximum = Math.max(2, Math.floor(maximumOperandCount) || 2);
    const minimum = Math.min(
        maximum,
        Math.max(2, Math.floor(minimumOperandCount) || 2)
    );
    const referenceHeights = rowsAbove
        .slice(0, minimum)
        .map(segment => segment.bbox.height)
        .sort((left, right) => left - right);
    const referenceHeight = referenceHeights[
        Math.floor((referenceHeights.length - 1) / 2)
    ] || 0;
    let operandCount = minimum;
    while (operandCount < rowsAbove.length && operandCount < maximum) {
        const candidateSegment = rowsAbove[operandCount];
        const explicitOperand = normalizeOcrColumnDigitsWithRequiredOperator(
            recognizedLatex[operandCount],
            '+'
        );
        if (!explicitOperand || referenceHeight <= 0 ||
            candidateSegment.bbox.height < referenceHeight * 0.72) {
            break;
        }
        operandCount++;
    }
    return operandCount;
}

/**
 * Reads only FormulaNet's multiplication-dot-as-minus confusion.
 *
 * This helper deliberately does not confirm the multiplication-dot geometry;
 * the caller must do that before accepting the alias. It accepts one
 * horizontal ASCII or Unicode minus between two nonnegative plain-integer digit
 * groups and returns only the observed digits.
 */
export function normalizeOcrColumnMultiplicationDotAlias(
    latex: unknown
): readonly [string, string] | null {
    if (typeof latex !== 'string') return null;
    const source = latex.trim();
    if (!source || /[\r\n\u2028\u2029]/u.test(source)) return null;

    const match = /^([0-9](?:\s*[0-9])*)\s*[-\u2212]\s*([0-9](?:\s*[0-9])*)$/u.exec(source);
    if (!match) return null;

    const first = match[1].replace(/\s/gu, '');
    const second = match[2].replace(/\s/gu, '');
    return [first, second];
}

/**
 * Reads FormulaNet's comma-separated digit-list rendering of one handwritten
 * multiplication row.
 *
 * A response such as `7,3,8,6` does not reveal which separator represents the
 * multiplication dot. Consequently this helper returns only the observed
 * digits; the caller must independently locate exactly one compact raster dot
 * before joining the digits into two operands. Requiring single ASCII-digit
 * tokens keeps multi-digit decimal/grouped numbers, minus expressions and TeX
 * structures out of this parser; even a two-token candidate still needs the
 * caller's independent raster-dot proof before it can become multiplication.
 */
export function normalizeOcrColumnMultiplicationCommaSequence(
    latex: unknown
): readonly string[] | null {
    if (typeof latex !== 'string') return null;
    const source = latex.trim();
    if (!source || source.length > 1_024 ||
        /[\r\n\u2028\u2029]/u.test(source) ||
        !/^[0-9](?:\s*,\s*[0-9])+$/u.test(source)) {
        return null;
    }
    const digits = source.split(',').map(value => value.trim());
    return digits.length >= 2 && digits.length <= 512 ? digits : null;
}

export type OcrColumnMultiplicationCarryExpression = {
    operands: readonly [string, string];
    /** Left-to-right marks attached to the observed multiplicand digits. */
    carryMarks: ReadonlyArray<string | null>;
};

function parseOcrMultiplicationCarryTokens(
    source: string
): { digits: string[]; carryMarks: Array<string | null> } | null {
    const digits: string[] = [];
    const carryMarks: Array<string | null> = [];
    const token = /(\d)(?:_\{?(\d)\}?)?/uy;
    let offset = 0;
    while (offset < source.length) {
        token.lastIndex = offset;
        const match = token.exec(source);
        if (!match || match.index !== offset) return null;
        digits.push(match[1]);
        carryMarks.push(match[2] ?? null);
        offset = token.lastIndex;
    }
    return digits.length ? { digits, carryMarks } : null;
}

/**
 * Reads FormulaNet's compact single-digit multiplication with observed
 * subscript carries, for example `7_{2}3_{4}8\\cdot6` or
 * `7_{2},3_{4},8,6`.
 *
 * This function deliberately retains only written digits and marks. It does
 * not verify the operator: every caller must independently confirm the one
 * compact raster multiplication dot before accepting the candidate.
 */
export function normalizeOcrColumnMultiplicationCarryExpression(
    latex: unknown
): OcrColumnMultiplicationCarryExpression | null {
    if (typeof latex !== 'string') return null;
    let source = latex.trim();
    if (!source || source.length > 1_024 || /[\r\n\u2028\u2029]/u.test(source)) {
        return null;
    }
    if (source.startsWith('$') || source.endsWith('$')) {
        if (!(source.startsWith('$') && source.endsWith('$') && source.length > 2)) {
            return null;
        }
        source = source.slice(1, -1).trim();
    }
    source = source
        .replace(/\\(?:left|right)\b/gu, '')
        .replace(/\\(?:[,;!]|(?:quad|qquad|enspace|thinspace|medspace|thickspace)\b)/gu, '')
        .replace(/[\s~]/gu, '');

    let leftSource = '';
    let multiplier = '';
    const explicit = /^(.*?)(?:\\(?:cdot|times)(?![A-Za-z])|[\u00b7\u22c5\u00d7*\-\u2212])(\d)$/u.exec(source);
    if (explicit) {
        leftSource = explicit[1];
        multiplier = explicit[2];
    } else {
        const commaTokens = source.split(',');
        if (commaTokens.length < 2 || commaTokens.some(value => !value)) return null;
        multiplier = commaTokens.pop() || '';
        if (!/^\d$/u.test(multiplier)) return null;
        leftSource = commaTokens.join('');
    }

    const left = parseOcrMultiplicationCarryTokens(leftSource);
    if (!left || !left.carryMarks.some(mark => mark !== null)) return null;
    return {
        operands: [left.digits.join(''), multiplier],
        carryMarks: left.carryMarks
    };
}

/**
 * Reads only FormulaNet's `\pm` confusion for addition operand two.
 *
 * This is intentionally separate from `normalizeOcrColumnDigitsExact`, so the
 * historical leading-`+` path remains the first and unchanged parser. The
 * caller must still apply the independent-anchor and arithmetic-consistency
 * gate before accepting these digits.
 */
export function normalizeOcrColumnAdditionSecondOperandAlias(
    latex: unknown
): string | null {
    let source = String(latex ?? '').trim();
    if (!source) return null;
    source = source
        .replace(/^\$+|\$+$/gu, '')
        .replace(/\\(?:left|right)\b/gu, '')
        .replace(/\\(?:,|;|!|quad|qquad|enspace|thinspace|medspace|thickspace)/gu, '')
        .replace(/\\(?:mathrm|mathbf|mathsf|text)\s*\{(\d+)\}/gu, '$1')
        .replace(/[{}\s~]/gu, '');
    const match = /^\\pm(?![A-Za-z])(\d+)$/u.exec(source);
    return match ? match[1] : null;
}

/**
 * Gates FormulaNet's addition-only `\pm` operator alias behind independent
 * operand/result anchors and an exact arithmetic consistency check.
 *
 * Ordinary recognized digit rows deliberately do not use this gate: an
 * incorrect student operand must remain observable and reach normal grading.
 */
export function acceptOcrColumnAdditionSecondOperandAlias(
    aliasDigits: string | null,
    hasIndependentPlainAnchors: boolean,
    rowsAreConsistent: boolean
): string | null {
    return aliasDigits && hasIndependentPlainAnchors && rowsAreConsistent
        ? aliasDigits
        : null;
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
    measuredCenters: readonly number[] | null;
};

export type OcrColumnAnchorRow = {
    segment: OcrColumnSegmentLike;
    digitCount: number;
    /** Optional observed left-to-right glyph centers in source coordinates. */
    digitCenters?: readonly number[] | null;
};

type OcrColumnGrid = {
    pitch: number;
    /** Target-column centers in right-to-left order. */
    columnCenters: number[];
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
    digitCount: number,
    digitCenters?: readonly number[] | null
): OcrDigitRowGeometry | null {
    if (!Number.isInteger(digitCount) || digitCount < 1 || !finiteBox(segment.bbox)) {
        return null;
    }
    const exactInkBox = finiteBox(segment.inkBox);
    const box = exactInkBox ? segment.inkBox! : segment.bbox;
    let measuredCenters: readonly number[] | null = null;
    if (digitCenters && digitCenters.length === digitCount &&
        digitCenters.every((center, index) =>
            Number.isFinite(center) &&
            center >= segment.bbox.x &&
            center <= segment.bbox.x + segment.bbox.width &&
            (index === 0 || center > digitCenters[index - 1])
        )) {
        measuredCenters = Array.from(digitCenters);
    }
    const measuredPitches = measuredCenters
        ? measuredCenters.slice(1).map((center, index) =>
            center - measuredCenters![index]
        )
        : [];
    const pitch = measuredPitches.length
        ? median(measuredPitches)
        : box.width / Math.max(
            OUTER_DIGIT_INK_SPAN,
            digitCount - (1 - OUTER_DIGIT_INK_SPAN)
        );
    if (!Number.isFinite(pitch) || pitch <= 0) return null;
    return {
        digitCount,
        exactInkBox,
        pitch,
        rightmostCenter: measuredCenters
            ? measuredCenters[measuredCenters.length - 1]
            : box.x + box.width - OUTER_DIGIT_CENTER_INSET * pitch,
        measuredCenters
    };
}

function distanceToInterval(value: number, x0: number, x1: number): number {
    if (value < x0) return x0 - value;
    if (value > x1) return value - x1;
    return 0;
}

function resolveOcrColumnGrid(
    anchorRows: readonly OcrColumnAnchorRow[],
    columns: number
): OcrColumnGrid | null {
    if (!Number.isInteger(columns) || columns < 1) return null;
    const rowGeometries = anchorRows
        .map(row => digitRowGeometry(
            row.segment,
            row.digitCount,
            row.digitCenters
        ))
        .filter((row): row is OcrDigitRowGeometry => Boolean(row));
    if (!rowGeometries.length) return null;

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
        columnCenters.push(median(selected.map(row => row.measuredCenters
            ? row.measuredCenters[row.digitCount - column - 1]
            : row.rightmostCenter - column * row.pitch
        )));
    }
    return { pitch, columnCenters };
}

/**
 * Maps geometrically confirmed carry-one glyphs to right-to-left digit
 * columns. Duplicate glyphs in a cell are preserved as a wrong digit count,
 * so validation never silently repairs extra handwriting.
 */
export function mapOcrCarryOnesToColumns(
    hints: readonly OcrCarryOneHint[],
    anchorRows: readonly OcrColumnAnchorRow[],
    columns: number
): Array<string | null> | null {
    if (!Number.isInteger(columns) || columns < 1) return null;
    const grid = resolveOcrColumnGrid(anchorRows, columns);
    if (!grid) {
        return hints.length ? null : new Array(columns).fill(null);
    }
    const { pitch, columnCenters } = grid;

    const counts = new Array<number>(columns).fill(0);
    for (const hint of hints) {
        const x0 = Math.min(hint.x0, hint.x1);
        const x1 = Math.max(hint.x0, hint.x1);
        if (!Number.isFinite(x0) || !Number.isFinite(x1)) return null;
        const fittedStemX = Number(hint.stemX);
        const hasFittedStem = Number.isFinite(fittedStemX);
        const glyphCenter = hasFittedStem ? fittedStemX : (x0 + x1) / 2;
        const ranked = columnCenters.map((center, column) => ({
            column,
            intervalDistance: hasFittedStem
                ? Math.abs(center - fittedStemX)
                : distanceToInterval(center, x0, x1),
            centerDistance: Math.abs(center - glyphCenter)
        })).sort((left, right) =>
            left.intervalDistance - right.intervalDistance ||
            left.centerDistance - right.centerDistance ||
            left.column - right.column
        );
        const best = ranked[0];
        if (!best || best.intervalDistance > pitch * 0.58) return null;

        // Prefer the fitted vertical stem when vector geometry provides it:
        // a broad top hook can extend far into the neighbouring cell. Legacy
        // callers without stem evidence retain the conservative full-interval
        // comparison. A glyph spanning two centers remains ambiguous.
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

/**
 * Maps a separately OCR-recognized carry row to target columns. This fallback
 * is intentionally observation-only: every returned digit must exist both in
 * the OCR token and as an independently measured raster component. Multiple
 * glyphs assigned to one target column are kept as a multi-digit carry instead
 * of being repaired or collapsed.
 */
export function mapOcrCarryDigitRowToColumns(
    digits: string,
    digitCenters: readonly number[],
    anchorRows: readonly OcrColumnAnchorRow[],
    columns: number
): Array<string | null> | null {
    if (!/^\d+$/u.test(digits) || digitCenters.length !== digits.length ||
        digitCenters.some(center => !Number.isFinite(center))) return null;
    const grid = resolveOcrColumnGrid(anchorRows, columns);
    if (!grid) return null;
    const { pitch, columnCenters } = grid;
    const cells: Array<Array<{ x: number; digit: string }>> =
        Array.from({ length: columns }, () => []);

    for (let index = 0; index < digits.length; index++) {
        const x = digitCenters[index];
        const ranked = columnCenters.map((center, column) => ({
            column,
            distance: Math.abs(center - x)
        })).sort((left, right) =>
            left.distance - right.distance || left.column - right.column
        );
        const best = ranked[0];
        if (!best || best.distance > pitch * 0.58) return null;
        const second = ranked[1];
        if (second && second.distance - best.distance <= pitch * 0.07) {
            return null;
        }
        cells[best.column].push({ x, digit: digits[index] });
    }

    return cells.map(cell => cell.length
        ? cell.slice().sort((left, right) => left.x - right.x)
            .map(item => item.digit).join('')
        : null
    );
}

/**
 * Combines independently observed carry cells without counting the same ink
 * twice. Vector carry-one hints and raster/OCR digits may coexist in one
 * handwritten row (for example `1 2 1` in a multi-summand addition). They may
 * only be combined when they occupy disjoint target columns. Any overlap is
 * ambiguous evidence and therefore remains unresolved for the draft path.
 */
export function mergeOcrCarryColumnObservations(
    first: readonly (string | null)[],
    second: readonly (string | null)[]
): Array<string | null> | null {
    if (!first.length || first.length !== second.length) return null;
    const merged: Array<string | null> = [];
    for (let index = 0; index < first.length; index++) {
        const left = first[index];
        const right = second[index];
        if ((left !== null && !/^\d+$/u.test(left)) ||
            (right !== null && !/^\d+$/u.test(right)) ||
            (left !== null && right !== null)) return null;
        merged.push(left ?? right);
    }
    return merged;
}

/**
 * Reconciles one conservative FormulaNet repetition error with independently
 * measured raster glyphs. Exact OCR/component agreement always wins. The only
 * correction allowed is one duplicated digit one; mixed digits, missing OCR
 * digits, and larger disagreements remain unresolved instead of being guessed.
 */
export function reconcileOcrCarryDigitRowWithRaster(
    digits: string,
    observedGlyphCount: number
): string | null {
    if (!/^\d+$/u.test(digits) || !Number.isInteger(observedGlyphCount) ||
        observedGlyphCount < 1) return null;
    if (digits.length === observedGlyphCount) return digits;
    if (observedGlyphCount >= 2 && /^1+$/u.test(digits) &&
        digits.length === observedGlyphCount + 1) {
        return '1'.repeat(observedGlyphCount);
    }
    return null;
}
