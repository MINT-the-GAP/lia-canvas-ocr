/**
 * Exact, side-effect-free model for handwritten long division.
 * Decimal operands remain strings so the ES2017 browser target never loses
 * integer precision.
 */

export const COLUMN_DIVISION_SUBMISSION_VERSION = 1 as const;
export const MAX_COLUMN_DIVISION_DIGITS = 128;
export const MAX_COLUMN_DIVISION_PROMPT_LENGTH = 1_024;
export const MAX_COLUMN_DIVISION_SUBMISSION_LENGTH = 65_536;

export type ColumnDivisionPrompt = {
    kind: 'column-division';
    dividend: string;
    divisor: string;
    authoredQuotient: string | null;
    authoredRemainder: string | null;
    expectedQuotient: string;
    expectedRemainder: string;
};

export type ColumnDivisionStep = {
    /** Display value, including a meaningful leading zero such as `07`. */
    partialDividend: string;
    /** Zero-based positions in the dividend, counted from the left. */
    partialDividendStart: number;
    partialDividendEnd: number;
    quotientDigit: string;
    subtractedProduct: string;
    subtractedProductStart: number;
    remainder: string;
    remainderPosition: number;
    broughtDownDigit: string | null;
    broughtDownPosition: number | null;
};

export type ColumnDivisionObservation = {
    dividend: string;
    divisor: string;
    quotient: string;
    /** Null means that no separate final remainder was written. */
    remainder?: string | null;
    steps?: readonly ColumnDivisionStep[];
};

export type ColumnDivisionSubmission = {
    kind: 'column-division';
    version: typeof COLUMN_DIVISION_SUBMISSION_VERSION;
    dividend: string;
    divisor: string;
    quotient: string;
    remainder: string | null;
    steps: ColumnDivisionStep[];
};

export type ColumnDivisionValidationReason =
    | 'valid'
    | 'invalid-prompt'
    | 'prompt-result-mismatch'
    | 'invalid-format'
    | 'operand-mismatch'
    | 'quotient-mismatch'
    | 'remainder-mismatch'
    | 'missing-remainder'
    | 'step-mismatch'
    | 'missing-step'
    | 'extra-step';

export type ColumnDivisionValidation = {
    accepted: boolean;
    outcome: 'correct' | 'incorrect' | 'incomplete' | 'unknown';
    reason: ColumnDivisionValidationReason;
    stepIndex?: number;
    stepField?: keyof ColumnDivisionStep;
    expected?: ColumnDivisionSubmission;
    submission?: ColumnDivisionSubmission;
};

type ExactDivision = {
    quotient: string;
    remainder: string;
    steps: ColumnDivisionStep[];
};

type UnknownRecord = Record<string, unknown>;

const DECIMAL = /^\d+$/u;
const DIGIT = /^\d$/u;
const PROMPT_SHAPE = /^(\d+):(\d+)(?:=(\d+)(?:R(?:EST)?=?(\d+))?)?$/iu;
const STEP_KEYS: readonly (keyof ColumnDivisionStep)[] = [
    'partialDividend',
    'partialDividendStart',
    'partialDividendEnd',
    'quotientDigit',
    'subtractedProduct',
    'subtractedProductStart',
    'remainder',
    'remainderPosition',
    'broughtDownDigit',
    'broughtDownPosition'
];

function isRecord(value: unknown): value is UnknownRecord {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasExactKeys(value: UnknownRecord, keys: readonly string[]): boolean {
    const actual = Object.keys(value).sort();
    const expected = Array.from(keys).sort();
    return actual.length === expected.length &&
        actual.every((key, index) => key === expected[index]);
}

function normalizeDecimal(value: unknown, maximumLength: number): string | null {
    if (typeof value !== 'string') return null;
    const source = value.trim();
    if (!source || source.length > maximumLength || !DECIMAL.test(source)) return null;
    return source.replace(/^0+(?=\d)/u, '');
}

function canonicalDecimal(value: unknown, maximumLength: number): string | null {
    if (typeof value !== 'string') return null;
    const normalized = normalizeDecimal(value, maximumLength);
    return normalized === value ? normalized : null;
}

function compareDecimals(first: string, second: string): -1 | 0 | 1 {
    if (first.length !== second.length) return first.length < second.length ? -1 : 1;
    if (first === second) return 0;
    return first < second ? -1 : 1;
}

/** Exact subtraction for canonical nonnegative decimals with first >= second. */
function subtractDecimals(first: string, second: string): string {
    const output: string[] = [];
    let borrow = 0;
    for (let offset = 0; offset < first.length; offset++) {
        const firstIndex = first.length - offset - 1;
        const secondIndex = second.length - offset - 1;
        let digit = first.charCodeAt(firstIndex) - 48 - borrow;
        if (secondIndex >= 0) digit -= second.charCodeAt(secondIndex) - 48;
        if (digit < 0) {
            digit += 10;
            borrow = 1;
        } else borrow = 0;
        output.push(String.fromCharCode(48 + digit));
    }
    return output.reverse().join('').replace(/^0+(?=\d)/u, '');
}

function quotientDigit(partialDividend: string, divisor: string): {
    digit: string;
    product: string;
    remainder: string;
} {
    let remainder = partialDividend;
    let digit = 0;
    while (compareDecimals(remainder, divisor) >= 0) {
        remainder = subtractDecimals(remainder, divisor);
        digit++;
        // Every long-division partial dividend is smaller than 10 * divisor.
        if (digit > 9) throw new Error('invalid long-division partial dividend');
    }
    return {
        digit: String.fromCharCode(48 + digit),
        product: subtractDecimals(partialDividend, remainder),
        remainder
    };
}

function divideDecimalStrings(dividend: string, divisor: string): ExactDivision {
    let partialEnd = 0;
    let partialDisplay = dividend[0];
    let partial = normalizeDecimal(partialDisplay, MAX_COLUMN_DIVISION_DIGITS)!;
    while (partialEnd + 1 < dividend.length && compareDecimals(partial, divisor) < 0) {
        partialEnd++;
        partialDisplay += dividend[partialEnd];
        partial = normalizeDecimal(partialDisplay, MAX_COLUMN_DIVISION_DIGITS)!;
    }

    const steps: ColumnDivisionStep[] = [];
    const quotient: string[] = [];
    let finalRemainder = '0';
    for (;;) {
        const divided = quotientDigit(partial, divisor);
        quotient.push(divided.digit);
        const remainderPosition = partialEnd - divided.remainder.length + 1;
        const broughtDownPosition = partialEnd + 1 < dividend.length
            ? partialEnd + 1
            : null;
        const broughtDownDigit = broughtDownPosition === null
            ? null
            : dividend[broughtDownPosition];
        steps.push({
            partialDividend: partialDisplay,
            partialDividendStart: partialEnd - partialDisplay.length + 1,
            partialDividendEnd: partialEnd,
            quotientDigit: divided.digit,
            subtractedProduct: divided.product,
            subtractedProductStart: partialEnd - divided.product.length + 1,
            remainder: divided.remainder,
            remainderPosition,
            broughtDownDigit,
            broughtDownPosition
        });
        finalRemainder = divided.remainder;
        if (broughtDownDigit === null || broughtDownPosition === null) break;
        partialDisplay = divided.remainder + broughtDownDigit;
        partial = normalizeDecimal(partialDisplay, MAX_COLUMN_DIVISION_DIGITS)!;
        partialEnd = broughtDownPosition;
    }

    return {
        quotient: quotient.join('').replace(/^0+(?=\d)/u, ''),
        remainder: finalRemainder,
        steps
    };
}

function stripMathDelimiters(value: string): string | null {
    let source = value.trim();
    if (source.startsWith('$$') || source.endsWith('$$')) {
        if (!(source.startsWith('$$') && source.endsWith('$$') && source.length > 4)) return null;
        source = source.slice(2, -2).trim();
    } else if (source.startsWith('$') || source.endsWith('$')) {
        if (!(source.startsWith('$') && source.endsWith('$') && source.length > 2)) return null;
        source = source.slice(1, -1).trim();
    } else if (source.startsWith('\\(') || source.endsWith('\\)')) {
        if (!(source.startsWith('\\(') && source.endsWith('\\)'))) return null;
        source = source.slice(2, -2).trim();
    } else if (source.startsWith('\\[') || source.endsWith('\\]')) {
        if (!(source.startsWith('\\[') && source.endsWith('\\]'))) return null;
        source = source.slice(2, -2).trim();
    }
    return source;
}

function balancedBraces(source: string): boolean {
    let depth = 0;
    for (const character of source) {
        if (character === '{') depth++;
        else if (character === '}' && --depth < 0) return false;
    }
    return depth === 0;
}

function normalizePromptSource(value: unknown): string | null {
    if (typeof value !== 'string') return null;
    let source = value.trim();
    if (!source || source.length > MAX_COLUMN_DIVISION_PROMPT_LENGTH || /[\r\n]/u.test(source)) {
        return null;
    }
    const unwrapped = stripMathDelimiters(source);
    if (unwrapped === null) return null;
    source = unwrapped
        .replace(/\\(?:operatorname|mathrm|text)\s*\{\s*(?:R|Rest)\s*\}/giu, 'R')
        .replace(/\\div\b/gu, ':')
        .replace(/\u00f7/gu, ':')
        .replace(/\\(?:left|right)\b/gu, '')
        .replace(/\\(?:quad|qquad|enspace|thinspace|medspace|thickspace)\b/gu, '')
        .replace(/\\[,;!:>]/gu, '')
        .replace(/\\[ \t]/gu, '')
        .replace(/[\s~]/gu, '');
    if (!balancedBraces(source)) return null;
    return source.replace(/[{}]/gu, '');
}

/** Parses a single nonnegative integer division, never an equation array. */
export function parseColumnDivisionPrompt(value: unknown): ColumnDivisionPrompt | null {
    const source = normalizePromptSource(value);
    if (!source) return null;
    const match = PROMPT_SHAPE.exec(source);
    if (!match) return null;
    const dividend = normalizeDecimal(match[1], MAX_COLUMN_DIVISION_DIGITS);
    const divisor = normalizeDecimal(match[2], MAX_COLUMN_DIVISION_DIGITS);
    const authoredQuotient = match[3] === undefined
        ? null
        : normalizeDecimal(match[3], MAX_COLUMN_DIVISION_DIGITS);
    const authoredRemainder = match[4] === undefined
        ? null
        : normalizeDecimal(match[4], MAX_COLUMN_DIVISION_DIGITS);
    if (dividend === null || divisor === null || divisor === '0' ||
        (match[3] !== undefined && authoredQuotient === null) ||
        (match[4] !== undefined && authoredRemainder === null)) return null;
    const exact = divideDecimalStrings(dividend, divisor);
    return {
        kind: 'column-division',
        dividend,
        divisor,
        authoredQuotient,
        authoredRemainder,
        expectedQuotient: exact.quotient,
        expectedRemainder: exact.remainder
    };
}

function normalizePrompt(value: string | ColumnDivisionPrompt): ColumnDivisionPrompt | null {
    if (typeof value === 'string') return parseColumnDivisionPrompt(value);
    if (!isRecord(value) || !hasExactKeys(value, [
        'kind', 'dividend', 'divisor', 'authoredQuotient', 'authoredRemainder',
        'expectedQuotient', 'expectedRemainder'
    ]) || value.kind !== 'column-division') return null;
    const dividend = canonicalDecimal(value.dividend, MAX_COLUMN_DIVISION_DIGITS);
    const divisor = canonicalDecimal(value.divisor, MAX_COLUMN_DIVISION_DIGITS);
    const authoredQuotient = value.authoredQuotient === null
        ? null
        : canonicalDecimal(value.authoredQuotient, MAX_COLUMN_DIVISION_DIGITS);
    const authoredRemainder = value.authoredRemainder === null
        ? null
        : canonicalDecimal(value.authoredRemainder, MAX_COLUMN_DIVISION_DIGITS);
    const expectedQuotient = canonicalDecimal(value.expectedQuotient, MAX_COLUMN_DIVISION_DIGITS);
    const expectedRemainder = canonicalDecimal(value.expectedRemainder, MAX_COLUMN_DIVISION_DIGITS);
    if (dividend === null || divisor === null || divisor === '0' ||
        (value.authoredQuotient !== null && authoredQuotient === null) ||
        (value.authoredRemainder !== null && authoredRemainder === null) ||
        expectedQuotient === null || expectedRemainder === null) return null;
    const exact = divideDecimalStrings(dividend, divisor);
    if (exact.quotient !== expectedQuotient || exact.remainder !== expectedRemainder) return null;
    return {
        kind: 'column-division',
        dividend,
        divisor,
        authoredQuotient,
        authoredRemainder,
        expectedQuotient,
        expectedRemainder
    };
}

function integerPosition(value: unknown, dividendLength: number): number | null {
    return typeof value === 'number' && Number.isInteger(value) &&
        value >= 0 && value < dividendLength ? value : null;
}

function normalizeStep(value: unknown, dividendLength: number, canonical: boolean): ColumnDivisionStep | null {
    if (!isRecord(value) || !hasExactKeys(value, STEP_KEYS)) return null;
    const rawPartial = typeof value.partialDividend === 'string'
        ? value.partialDividend.trim()
        : '';
    const partialDividend = rawPartial.length <= MAX_COLUMN_DIVISION_DIGITS && DECIMAL.test(rawPartial)
        ? rawPartial
        : null;
    const quotientDigit = typeof value.quotientDigit === 'string'
        ? value.quotientDigit.trim()
        : '';
    const subtractedProduct = canonical
        ? canonicalDecimal(value.subtractedProduct, MAX_COLUMN_DIVISION_DIGITS)
        : normalizeDecimal(value.subtractedProduct, MAX_COLUMN_DIVISION_DIGITS);
    const remainder = canonical
        ? canonicalDecimal(value.remainder, MAX_COLUMN_DIVISION_DIGITS)
        : normalizeDecimal(value.remainder, MAX_COLUMN_DIVISION_DIGITS);
    const partialDividendStart = integerPosition(value.partialDividendStart, dividendLength);
    const partialDividendEnd = integerPosition(value.partialDividendEnd, dividendLength);
    const subtractedProductStart = integerPosition(value.subtractedProductStart, dividendLength);
    const remainderPosition = integerPosition(value.remainderPosition, dividendLength);
    const broughtDownPosition = value.broughtDownPosition === null
        ? null
        : integerPosition(value.broughtDownPosition, dividendLength);
    const broughtDownDigit = value.broughtDownDigit === null
        ? null
        : typeof value.broughtDownDigit === 'string' && DIGIT.test(value.broughtDownDigit.trim())
            ? value.broughtDownDigit.trim()
            : undefined;
    if (partialDividend === null || !DIGIT.test(quotientDigit) ||
        subtractedProduct === null || remainder === null ||
        partialDividendStart === null || partialDividendEnd === null ||
        subtractedProductStart === null || remainderPosition === null ||
        broughtDownDigit === undefined ||
        (value.broughtDownPosition !== null && broughtDownPosition === null) ||
        (broughtDownDigit === null) !== (broughtDownPosition === null) ||
        partialDividendStart > partialDividendEnd) return null;
    if (canonical && (rawPartial !== value.partialDividend ||
        quotientDigit !== value.quotientDigit || broughtDownDigit !== value.broughtDownDigit)) return null;
    return {
        partialDividend,
        partialDividendStart,
        partialDividendEnd,
        quotientDigit,
        subtractedProduct,
        subtractedProductStart,
        remainder,
        remainderPosition,
        broughtDownDigit,
        broughtDownPosition
    };
}

export function createColumnDivisionSubmission(
    observation: ColumnDivisionObservation
): ColumnDivisionSubmission | null {
    if (!isRecord(observation)) return null;
    const dividend = normalizeDecimal(observation.dividend, MAX_COLUMN_DIVISION_DIGITS);
    const divisor = normalizeDecimal(observation.divisor, MAX_COLUMN_DIVISION_DIGITS);
    const quotient = normalizeDecimal(observation.quotient, MAX_COLUMN_DIVISION_DIGITS);
    const remainderValue = observation.remainder === undefined ? null : observation.remainder;
    const remainder = remainderValue === null
        ? null
        : normalizeDecimal(remainderValue, MAX_COLUMN_DIVISION_DIGITS);
    const observedSteps = observation.steps === undefined ? [] : observation.steps;
    if (dividend === null || divisor === null || divisor === '0' || quotient === null ||
        (remainderValue !== null && remainder === null) || !Array.isArray(observedSteps) ||
        observedSteps.length > dividend.length) return null;
    const steps: ColumnDivisionStep[] = [];
    for (const step of observedSteps) {
        const normalized = normalizeStep(step, dividend.length, false);
        if (!normalized) return null;
        steps.push(normalized);
    }
    return {
        kind: 'column-division',
        version: COLUMN_DIVISION_SUBMISSION_VERSION,
        dividend,
        divisor,
        quotient,
        remainder,
        steps
    };
}

function promptResultIsValid(prompt: ColumnDivisionPrompt): boolean {
    if (prompt.authoredQuotient !== null &&
        prompt.authoredQuotient !== prompt.expectedQuotient) return false;
    return prompt.authoredRemainder === null ||
        prompt.authoredRemainder === prompt.expectedRemainder;
}

export function createExpectedColumnDivisionSubmission(
    value: string | ColumnDivisionPrompt
): ColumnDivisionSubmission | null {
    const prompt = normalizePrompt(value);
    if (!prompt || !promptResultIsValid(prompt)) return null;
    const exact = divideDecimalStrings(prompt.dividend, prompt.divisor);
    return createColumnDivisionSubmission({
        dividend: prompt.dividend,
        divisor: prompt.divisor,
        quotient: exact.quotient,
        remainder: exact.remainder === '0' ? null : exact.remainder,
        steps: exact.steps
    });
}

function normalizeSubmission(value: unknown): ColumnDivisionSubmission | null {
    if (!isRecord(value) || !hasExactKeys(value, [
        'kind', 'version', 'dividend', 'divisor', 'quotient', 'remainder', 'steps'
    ]) || value.kind !== 'column-division' ||
        value.version !== COLUMN_DIVISION_SUBMISSION_VERSION || !Array.isArray(value.steps)) return null;
    const dividend = canonicalDecimal(value.dividend, MAX_COLUMN_DIVISION_DIGITS);
    const divisor = canonicalDecimal(value.divisor, MAX_COLUMN_DIVISION_DIGITS);
    const quotient = canonicalDecimal(value.quotient, MAX_COLUMN_DIVISION_DIGITS);
    const remainder = value.remainder === null
        ? null
        : canonicalDecimal(value.remainder, MAX_COLUMN_DIVISION_DIGITS);
    if (dividend === null || divisor === null || divisor === '0' || quotient === null ||
        (value.remainder !== null && remainder === null) || value.steps.length > dividend.length) return null;
    const steps: ColumnDivisionStep[] = [];
    for (const step of value.steps) {
        const normalized = normalizeStep(step, dividend.length, true);
        if (!normalized) return null;
        steps.push(normalized);
    }
    return {
        kind: 'column-division',
        version: COLUMN_DIVISION_SUBMISSION_VERSION,
        dividend,
        divisor,
        quotient,
        remainder,
        steps
    };
}

export function serializeColumnDivisionSubmission(value: ColumnDivisionSubmission): string {
    const submission = normalizeSubmission(value);
    if (!submission) return '';
    try {
        const serialized = JSON.stringify(submission);
        return serialized.length <= MAX_COLUMN_DIVISION_SUBMISSION_LENGTH ? serialized : '';
    } catch (_) {
        return '';
    }
}

export function decodeColumnDivisionSubmission(source: string): ColumnDivisionSubmission | null {
    if (typeof source !== 'string') return null;
    const value = source.trim();
    if (!value || value.length > MAX_COLUMN_DIVISION_SUBMISSION_LENGTH || value[0] !== '{') return null;
    try {
        return normalizeSubmission(JSON.parse(value) as unknown);
    } catch (_) {
        return null;
    }
}

function submissionFromInput(value: string | ColumnDivisionSubmission): ColumnDivisionSubmission | null {
    return typeof value === 'string' ? decodeColumnDivisionSubmission(value) : normalizeSubmission(value);
}

function phantomDigits(count: number): string {
    return count > 0 ? `\\phantom{${'0'.repeat(count)}}` : '';
}

function positionedValue(value: string, start: number, width: number): string {
    return phantomDigits(start) + value + phantomDigits(width - start - value.length);
}

/** Renders the pinned SchulLia alternating subtraction/bring-down layout. */
export function composeColumnDivisionLatex(
    value: string | ColumnDivisionSubmission
): string {
    const submission = submissionFromInput(value);
    if (!submission) return '';
    const width = submission.dividend.length;
    const divisorPadding = `\\phantom{:${submission.divisor}}`;
    const remainder = submission.remainder === null
        ? ''
        : `\\;\\mathrm{R}\\;${submission.remainder}`;
    const rows: string[] = [
        `${submission.dividend}:${submission.divisor}&=${submission.quotient}${remainder}`
    ];
    for (const step of submission.steps) {
        rows.push(
            phantomDigits(step.subtractedProductStart) +
            `\\underline{-${step.subtractedProduct}}` +
            phantomDigits(width - step.subtractedProductStart - step.subtractedProduct.length) +
            divisorPadding + '&'
        );
        const nextValue = step.remainder + (step.broughtDownDigit || '');
        rows.push(
            positionedValue(nextValue, step.remainderPosition, width) + divisorPadding + '&'
        );
    }
    return `\\begin{aligned} ${rows.join(String.raw` \\ `)} \\end{aligned}`;
}

function validation(
    accepted: boolean,
    outcome: ColumnDivisionValidation['outcome'],
    reason: ColumnDivisionValidationReason,
    expected?: ColumnDivisionSubmission,
    submission?: ColumnDivisionSubmission,
    stepIndex?: number,
    stepField?: keyof ColumnDivisionStep
): ColumnDivisionValidation {
    return {
        accepted,
        outcome,
        reason,
        ...(stepIndex === undefined ? {} : { stepIndex }),
        ...(stepField === undefined ? {} : { stepField }),
        ...(expected ? { expected } : {}),
        ...(submission ? { submission } : {})
    };
}

function firstStepMismatch(
    expected: ColumnDivisionStep,
    actual: ColumnDivisionStep
): keyof ColumnDivisionStep | undefined {
    return STEP_KEYS.find(field => expected[field] !== actual[field]);
}

/** Requires every pinned long-division step; omitted work is incomplete. */
export function validateColumnDivisionSubmission(
    promptValue: string | ColumnDivisionPrompt,
    answer: string | ColumnDivisionSubmission
): ColumnDivisionValidation {
    const prompt = normalizePrompt(promptValue);
    if (!prompt) return validation(false, 'unknown', 'invalid-prompt');
    if (!promptResultIsValid(prompt)) {
        return validation(false, 'unknown', 'prompt-result-mismatch');
    }
    const expected = createExpectedColumnDivisionSubmission(prompt);
    if (!expected) return validation(false, 'unknown', 'invalid-prompt');
    const submission = submissionFromInput(answer);
    if (!submission) return validation(false, 'incorrect', 'invalid-format', expected);
    if (submission.dividend !== expected.dividend || submission.divisor !== expected.divisor) {
        return validation(false, 'incorrect', 'operand-mismatch', expected, submission);
    }
    if (submission.quotient !== expected.quotient) {
        return validation(false, 'incorrect', 'quotient-mismatch', expected, submission);
    }
    const exactRemainder = prompt.expectedRemainder;
    if (exactRemainder !== '0' && submission.remainder === null) {
        return validation(false, 'incomplete', 'missing-remainder', expected, submission);
    }
    if (submission.remainder !== null && submission.remainder !== exactRemainder) {
        return validation(false, 'incorrect', 'remainder-mismatch', expected, submission);
    }

    const commonSteps = Math.min(expected.steps.length, submission.steps.length);
    for (let index = 0; index < commonSteps; index++) {
        const field = firstStepMismatch(expected.steps[index], submission.steps[index]);
        if (field !== undefined) {
            return validation(
                false, 'incorrect', 'step-mismatch', expected, submission, index, field
            );
        }
    }
    if (submission.steps.length < expected.steps.length) {
        return validation(
            false, 'incomplete', 'missing-step', expected, submission, submission.steps.length
        );
    }
    if (submission.steps.length > expected.steps.length) {
        return validation(
            false, 'incorrect', 'extra-step', expected, submission, expected.steps.length
        );
    }
    return validation(true, 'correct', 'valid', expected, submission);
}
