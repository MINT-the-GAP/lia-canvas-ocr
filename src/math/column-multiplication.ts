/**
 * Pure data, rendering and validation helpers for written column
 * multiplication in the place-value form used by the pinned SchulLia example.
 *
 * For every digit of the multiplicand, from highest to lowest place, pupils
 * write one contribution: `digit * multiplier * 10^place`.  Consequently,
 * `738 * 6` has the rows `4200`, `180`, `48`; `12 * 34` generalises to
 * `340`, `68`.  Decimal integers deliberately remain strings, so no supported
 * operand is ever coerced to a JavaScript Number.
 */

export const COLUMN_MULTIPLICATION_SUBMISSION_VERSION = 1 as const;
export const MAX_COLUMN_MULTIPLICATION_DIGITS = 256;
export const MAX_COLUMN_MULTIPLICATION_PROMPT_LENGTH = 2_048;
export const MAX_COLUMN_MULTIPLICATION_PARTIAL_VALUE_DIGITS =
    MAX_COLUMN_MULTIPLICATION_DIGITS * 2;
export const MAX_COLUMN_MULTIPLICATION_SUBMISSION_LENGTH = 262_144;

export type ColumnMultiplicationPrompt = {
    kind: 'column-multiplication';
    /** `[multiplicand, multiplier]`, both canonical nonnegative integers. */
    operands: [string, string];
    /** Result written by the author, or null when the prompt omits `=...`. */
    authoredResult: string | null;
    /** Exact product derived from the two operands. */
    expectedResult: string;
};

export type ColumnMultiplicationPartialProduct = {
    /** Source digit place in the multiplicand; 0 is ones, 1 tens, and so on. */
    multiplicandColumn: number;
    /** Explicit decimal shift observed for this row. */
    shift: number;
    /** Complete written row, including every zero introduced by the shift. */
    value: string;
};

export type ColumnMultiplicationPartialProductObservation = {
    multiplicandColumn: number;
    shift: number;
    value: string;
};

export type ColumnMultiplicationCarryMark = string | null;

type ColumnMultiplicationObservationBase = {
    operands: readonly [string, string] | readonly string[];
    result: string;
};

export type ColumnMultiplicationObservation =
    | (ColumnMultiplicationObservationBase & {
    /** Rows in the order in which they were written, normally highest place first. */
    partialProducts?: readonly ColumnMultiplicationPartialProductObservation[];
        carryMarks?: never;
    })
    | (ColumnMultiplicationObservationBase & {
        /** Observed carry below each multiplicand digit, from left to right. */
        carryMarks: readonly ColumnMultiplicationCarryMark[];
        partialProducts?: never;
    });

type ColumnMultiplicationSubmissionBase = {
    kind: 'column-multiplication';
    version: typeof COLUMN_MULTIPLICATION_SUBMISSION_VERSION;
    operands: [string, string];
    result: string;
};

export type ColumnMultiplicationPartialProductsSubmission =
    ColumnMultiplicationSubmissionBase & {
    partialProducts: ColumnMultiplicationPartialProduct[];
    };

export type ColumnMultiplicationCarryMarksSubmission =
    ColumnMultiplicationSubmissionBase & {
        carryMarks: ColumnMultiplicationCarryMark[];
    };

export type ColumnMultiplicationSubmission =
    | ColumnMultiplicationPartialProductsSubmission
    | ColumnMultiplicationCarryMarksSubmission;

export type ColumnMultiplicationValidationReason =
    | 'valid'
    | 'invalid-prompt'
    | 'prompt-result-mismatch'
    | 'invalid-format'
    | 'operand-mismatch'
    | 'partial-product-order-mismatch'
    | 'partial-product-mismatch'
    | 'shift-mismatch'
    | 'missing-partial-product'
    | 'missing-carry-mark'
    | 'unexpected-carry-mark'
    | 'carry-mark-mismatch'
    | 'result-mismatch';

export type ColumnMultiplicationValidation = {
    accepted: boolean;
    outcome: 'correct' | 'incorrect' | 'incomplete' | 'unknown';
    reason: ColumnMultiplicationValidationReason;
    /** Right-to-left multiplicand column involved in a partial-product verdict. */
    partialProductColumn?: number;
    /** Left-to-right multiplicand column involved in a carry-mark verdict. */
    carryColumn?: number;
    expected?: ColumnMultiplicationSubmission;
    submission?: ColumnMultiplicationSubmission;
};

type UnknownRecord = Record<string, unknown>;

const DECIMAL = /^\d+$/u;
const PROMPT_SHAPE = /^(\d+)\*(\d+)(?:=(\d+))?$/u;

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

function normalizeWrittenValue(value: unknown): string | null {
    if (typeof value !== 'string') return null;
    const source = value.trim();
    return source && source.length <= MAX_COLUMN_MULTIPLICATION_PARTIAL_VALUE_DIGITS &&
        DECIMAL.test(source) ? source : null;
}

function canonicalWrittenValue(value: unknown): string | null {
    if (typeof value !== 'string') return null;
    const normalized = normalizeWrittenValue(value);
    return normalized === value ? normalized : null;
}

/** Exact grade-school multiplication; only individual digits use numeric arithmetic. */
function multiplyDecimalStrings(first: string, second: string): string {
    if (first === '0' || second === '0') return '0';
    const digits = new Array<number>(first.length + second.length).fill(0);

    for (let firstIndex = first.length - 1; firstIndex >= 0; firstIndex--) {
        const firstDigit = first.charCodeAt(firstIndex) - 48;
        for (let secondIndex = second.length - 1; secondIndex >= 0; secondIndex--) {
            const secondDigit = second.charCodeAt(secondIndex) - 48;
            const target = firstIndex + secondIndex + 1;
            const total = firstDigit * secondDigit + digits[target];
            digits[target] = total % 10;
            digits[target - 1] += Math.floor(total / 10);
        }
    }

    let start = 0;
    while (start < digits.length - 1 && digits[start] === 0) start++;
    return digits.slice(start).join('');
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

function bracesAreBalanced(source: string): boolean {
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
    if (!source || source.length > MAX_COLUMN_MULTIPLICATION_PROMPT_LENGTH ||
        /[\r\n]/u.test(source)) return null;
    const unwrapped = stripMathDelimiters(source);
    if (unwrapped === null) return null;
    source = unwrapped
        .replace(/\\(?:left|right)\b/gu, '')
        .replace(/\\(?:quad|qquad|enspace|thinspace|medspace|thickspace)\b/gu, '')
        .replace(/\\[,;!:>]/gu, '')
        .replace(/\\[ \t]/gu, '')
        .replace(/\\(?:cdot|times)(?![A-Za-z])/gu, '*')
        .replace(/[·⋅×]/gu, '*')
        .replace(/[\s~]/gu, '');
    if (!bracesAreBalanced(source)) return null;
    return source.replace(/[{}]/gu, '');
}

/** Parses one authored multiplication of two nonnegative decimal integers. */
export function parseColumnMultiplicationPrompt(
    value: unknown
): ColumnMultiplicationPrompt | null {
    const source = normalizePromptSource(value);
    if (!source) return null;
    const match = PROMPT_SHAPE.exec(source);
    if (!match) return null;
    const multiplicand = normalizeDecimal(match[1], MAX_COLUMN_MULTIPLICATION_DIGITS);
    const multiplier = normalizeDecimal(match[2], MAX_COLUMN_MULTIPLICATION_DIGITS);
    const authoredResult = match[3] === undefined
        ? null
        : normalizeDecimal(
            match[3], MAX_COLUMN_MULTIPLICATION_PARTIAL_VALUE_DIGITS
        );
    if (multiplicand === null || multiplier === null ||
        (match[3] !== undefined && authoredResult === null)) return null;
    return {
        kind: 'column-multiplication',
        operands: [multiplicand, multiplier],
        authoredResult,
        expectedResult: multiplyDecimalStrings(multiplicand, multiplier)
    };
}

function normalizePrompt(
    value: string | ColumnMultiplicationPrompt
): ColumnMultiplicationPrompt | null {
    if (typeof value === 'string') return parseColumnMultiplicationPrompt(value);
    if (!isRecord(value) || !hasExactKeys(value, [
        'kind', 'operands', 'authoredResult', 'expectedResult'
    ]) || value.kind !== 'column-multiplication' || !Array.isArray(value.operands) ||
        value.operands.length !== 2) return null;
    const multiplicand = canonicalDecimal(
        value.operands[0], MAX_COLUMN_MULTIPLICATION_DIGITS
    );
    const multiplier = canonicalDecimal(
        value.operands[1], MAX_COLUMN_MULTIPLICATION_DIGITS
    );
    const authoredResult = value.authoredResult === null
        ? null
        : canonicalDecimal(
            value.authoredResult, MAX_COLUMN_MULTIPLICATION_PARTIAL_VALUE_DIGITS
        );
    const expectedResult = canonicalDecimal(
        value.expectedResult, MAX_COLUMN_MULTIPLICATION_PARTIAL_VALUE_DIGITS
    );
    if (multiplicand === null || multiplier === null || expectedResult === null ||
        (value.authoredResult !== null && authoredResult === null)) return null;
    if (expectedResult !== multiplyDecimalStrings(multiplicand, multiplier)) return null;
    return {
        kind: 'column-multiplication',
        operands: [multiplicand, multiplier],
        authoredResult,
        expectedResult
    };
}

function normalizePartialProduct(
    value: unknown,
    multiplicandLength: number,
    canonical: boolean
): ColumnMultiplicationPartialProduct | null {
    if (!isRecord(value) || !hasExactKeys(value, [
        'multiplicandColumn', 'shift', 'value'
    ])) return null;
    const column = value.multiplicandColumn;
    const shift = value.shift;
    const written = canonical
        ? canonicalWrittenValue(value.value)
        : normalizeWrittenValue(value.value);
    if (!Number.isInteger(column) || (column as number) < 0 ||
        (column as number) >= multiplicandLength || !Number.isInteger(shift) ||
        (shift as number) < 0 ||
        (shift as number) >= MAX_COLUMN_MULTIPLICATION_DIGITS || written === null) {
        return null;
    }
    return {
        multiplicandColumn: column as number,
        shift: shift as number,
        value: written
    };
}

function buildPartialProductsSubmission(
    operands: [string, string],
    result: string,
    sourceRows: readonly unknown[],
    canonicalRows: boolean
): ColumnMultiplicationPartialProductsSubmission | null {
    if (sourceRows.length > operands[0].length) return null;
    const partialProducts: ColumnMultiplicationPartialProduct[] = [];
    const seenColumns: Record<number, true> = {};
    for (const sourceRow of sourceRows) {
        const row = normalizePartialProduct(
            sourceRow, operands[0].length, canonicalRows
        );
        if (!row || seenColumns[row.multiplicandColumn]) return null;
        seenColumns[row.multiplicandColumn] = true;
        partialProducts.push(row);
    }
    return {
        kind: 'column-multiplication',
        version: COLUMN_MULTIPLICATION_SUBMISSION_VERSION,
        operands,
        partialProducts,
        result
    };
}

function normalizeCarryMark(
    value: unknown,
    canonical: boolean
): ColumnMultiplicationCarryMark | undefined {
    if (value === null) return null;
    if (typeof value !== 'string') return undefined;
    const source = value.trim();
    if (!/^\d$/u.test(source) || (canonical && source !== value)) return undefined;
    return source;
}

function buildCarryMarksSubmission(
    operands: [string, string],
    result: string,
    sourceMarks: readonly unknown[],
    canonicalMarks: boolean
): ColumnMultiplicationCarryMarksSubmission | null {
    if (operands[1].length !== 1 || sourceMarks.length !== operands[0].length) {
        return null;
    }
    const carryMarks: ColumnMultiplicationCarryMark[] = [];
    for (const sourceMark of sourceMarks) {
        const mark = normalizeCarryMark(sourceMark, canonicalMarks);
        if (mark === undefined) return null;
        carryMarks.push(mark);
    }
    return {
        kind: 'column-multiplication',
        version: COLUMN_MULTIPLICATION_SUBMISSION_VERSION,
        operands,
        carryMarks,
        result
    };
}

/** Builds a bounded structural observation without correcting written values. */
export function createColumnMultiplicationSubmission(
    observation: ColumnMultiplicationObservation
): ColumnMultiplicationSubmission | null {
    if (!isRecord(observation) || !Array.isArray(observation.operands) ||
        observation.operands.length !== 2) return null;
    const multiplicand = normalizeDecimal(
        observation.operands[0], MAX_COLUMN_MULTIPLICATION_DIGITS
    );
    const multiplier = normalizeDecimal(
        observation.operands[1], MAX_COLUMN_MULTIPLICATION_DIGITS
    );
    const result = normalizeDecimal(
        observation.result, MAX_COLUMN_MULTIPLICATION_PARTIAL_VALUE_DIGITS
    );
    if (multiplicand === null || multiplier === null || result === null) return null;
    const hasPartialProducts = Object.prototype.hasOwnProperty.call(
        observation, 'partialProducts'
    );
    const hasCarryMarks = Object.prototype.hasOwnProperty.call(
        observation, 'carryMarks'
    );
    if (hasPartialProducts && hasCarryMarks) return null;
    if (hasCarryMarks) {
        const sourceMarks = (observation as { carryMarks?: unknown }).carryMarks;
        return Array.isArray(sourceMarks)
            ? buildCarryMarksSubmission(
                [multiplicand, multiplier], result, sourceMarks, false
            )
            : null;
    }
    const sourceRows = hasPartialProducts
        ? (observation as { partialProducts?: unknown }).partialProducts
        : [];
    return Array.isArray(sourceRows)
        ? buildPartialProductsSubmission(
            [multiplicand, multiplier], result, sourceRows, false
        )
        : null;
}

/** Derives the exact product and every required place-value contribution. */
export function createExpectedColumnMultiplicationSubmission(
    value: string | ColumnMultiplicationPrompt
): ColumnMultiplicationPartialProductsSubmission | null {
    const prompt = normalizePrompt(value);
    if (!prompt || (prompt.authoredResult !== null &&
        prompt.authoredResult !== prompt.expectedResult)) return null;
    const [multiplicand, multiplier] = prompt.operands;
    const partialProducts: ColumnMultiplicationPartialProduct[] = [];
    for (let index = 0; index < multiplicand.length; index++) {
        const multiplicandColumn = multiplicand.length - index - 1;
        const digitProduct = multiplyDecimalStrings(multiplicand[index], multiplier);
        partialProducts.push({
            multiplicandColumn,
            shift: multiplicandColumn,
            value: `${digitProduct}${'0'.repeat(multiplicandColumn)}`
        });
    }
    return createColumnMultiplicationSubmission({
        operands: prompt.operands,
        partialProducts,
        result: prompt.expectedResult
    }) as ColumnMultiplicationPartialProductsSubmission | null;
}

/** Derives the carry marks expected for the compact single-digit method. */
export function createExpectedColumnMultiplicationCarrySubmission(
    value: string | ColumnMultiplicationPrompt
): ColumnMultiplicationCarryMarksSubmission | null {
    const prompt = normalizePrompt(value);
    if (!prompt || prompt.operands[1].length !== 1 ||
        (prompt.authoredResult !== null &&
            prompt.authoredResult !== prompt.expectedResult)) return null;
    const [multiplicand, multiplier] = prompt.operands;
    const multiplierDigit = multiplier.charCodeAt(0) - 48;
    const carryMarks: ColumnMultiplicationCarryMark[] =
        new Array<ColumnMultiplicationCarryMark>(multiplicand.length).fill(null);
    let incomingCarry = 0;
    for (let index = multiplicand.length - 1; index >= 0; index--) {
        const digit = multiplicand.charCodeAt(index) - 48;
        const outgoingCarry = Math.floor(
            (digit * multiplierDigit + incomingCarry) / 10
        );
        if (index > 0) {
            carryMarks[index - 1] = outgoingCarry > 0
                ? String(outgoingCarry)
                : null;
        }
        incomingCarry = outgoingCarry;
    }
    return createColumnMultiplicationSubmission({
        operands: prompt.operands,
        carryMarks,
        result: prompt.expectedResult
    }) as ColumnMultiplicationCarryMarksSubmission | null;
}

function normalizeSubmission(value: unknown): ColumnMultiplicationSubmission | null {
    if (!isRecord(value) || value.kind !== 'column-multiplication' ||
        value.version !== COLUMN_MULTIPLICATION_SUBMISSION_VERSION ||
        !Array.isArray(value.operands) || value.operands.length !== 2) return null;
    const multiplicand = canonicalDecimal(
        value.operands[0], MAX_COLUMN_MULTIPLICATION_DIGITS
    );
    const multiplier = canonicalDecimal(
        value.operands[1], MAX_COLUMN_MULTIPLICATION_DIGITS
    );
    const result = canonicalDecimal(
        value.result, MAX_COLUMN_MULTIPLICATION_PARTIAL_VALUE_DIGITS
    );
    if (multiplicand === null || multiplier === null || result === null) return null;
    if (hasExactKeys(value, [
        'kind', 'version', 'operands', 'partialProducts', 'result'
    ]) && Array.isArray(value.partialProducts)) {
        return buildPartialProductsSubmission(
            [multiplicand, multiplier], result, value.partialProducts, true
        );
    }
    if (hasExactKeys(value, [
        'kind', 'version', 'operands', 'carryMarks', 'result'
    ]) && Array.isArray(value.carryMarks)) {
        return buildCarryMarksSubmission(
            [multiplicand, multiplier], result, value.carryMarks, true
        );
    }
    return null;
}

/** Serializes only the canonical versioned object shape. */
export function serializeColumnMultiplicationSubmission(
    value: ColumnMultiplicationSubmission
): string {
    const submission = normalizeSubmission(value);
    if (!submission) return '';
    try {
        const serialized = JSON.stringify(submission);
        return serialized.length <= MAX_COLUMN_MULTIPLICATION_SUBMISSION_LENGTH
            ? serialized
            : '';
    } catch (_) {
        return '';
    }
}

/** Rejects legacy arrays, unversioned objects and noncanonical values. */
export function decodeColumnMultiplicationSubmission(
    source: string
): ColumnMultiplicationSubmission | null {
    if (typeof source !== 'string') return null;
    const value = source.trim();
    if (!value || value.length > MAX_COLUMN_MULTIPLICATION_SUBMISSION_LENGTH ||
        value[0] !== '{') return null;
    try {
        return normalizeSubmission(JSON.parse(value) as unknown);
    } catch (_) {
        return null;
    }
}

function submissionFromInput(
    value: string | ColumnMultiplicationSubmission
): ColumnMultiplicationSubmission | null {
    return typeof value === 'string'
        ? decodeColumnMultiplicationSubmission(value)
        : normalizeSubmission(value);
}

function renderSchoolPartialProduct(
    row: ColumnMultiplicationPartialProduct
): string {
    const shiftedStart = Math.max(0, row.value.length - row.shift);
    const value = Array.from(row.value).map((digit, index) =>
        index >= shiftedStart && digit === '0'
            ? String.raw`\textcolor{red}{0}`
            : digit
    ).join('');
    return `+${value}`;
}

function renderSchoolCarryExpression(
    submission: ColumnMultiplicationCarryMarksSubmission
): string {
    const multiplicand = Array.from(submission.operands[0])
        .map((digit, index) => {
            const mark = submission.carryMarks[index];
            return mark === null
                ? digit
                : `${digit}_{\\scriptstyle\\textcolor{red}{${mark}}}`;
        })
        .join('');
    return `${multiplicand} \\cdot ${submission.operands[1]}`;
}

/**
 * Mirrors both pinned SchulLia methods without filling missing work: either
 * observed place-value rows with red shift zeros, or observed red carry marks
 * attached to the corresponding multiplicand digits.
 */
export function composeColumnMultiplicationLatex(
    value: string | ColumnMultiplicationSubmission
): string {
    const submission = submissionFromInput(value);
    if (!submission) return '';
    const rows = 'partialProducts' in submission
        ? [
            `${submission.operands[0]} \\cdot ${submission.operands[1]}`,
            ...submission.partialProducts.map(renderSchoolPartialProduct)
        ]
        : [renderSchoolCarryExpression(submission)];
    const body = rows.map(row => row + String.raw` \\ `).join('');
    return `\\begin{array}{r} ${body}\\hline ${submission.result}` +
        String.raw` \\ ` + String.raw`\end{array}`;
}

function validation(
    accepted: boolean,
    outcome: ColumnMultiplicationValidation['outcome'],
    reason: ColumnMultiplicationValidationReason,
    expected?: ColumnMultiplicationSubmission,
    submission?: ColumnMultiplicationSubmission,
    partialProductColumn?: number,
    carryColumn?: number
): ColumnMultiplicationValidation {
    return {
        accepted,
        outcome,
        reason,
        ...(partialProductColumn === undefined ? {} : { partialProductColumn }),
        ...(carryColumn === undefined ? {} : { carryColumn }),
        ...(expected ? { expected } : {}),
        ...(submission ? { submission } : {})
    };
}

/** Validates operands, row order, every contribution/shift and the final product. */
export function validateColumnMultiplicationSubmission(
    promptValue: string | ColumnMultiplicationPrompt,
    answer: string | ColumnMultiplicationSubmission
): ColumnMultiplicationValidation {
    const prompt = normalizePrompt(promptValue);
    if (!prompt) return validation(false, 'unknown', 'invalid-prompt');
    if (prompt.authoredResult !== null && prompt.authoredResult !== prompt.expectedResult) {
        return validation(false, 'unknown', 'prompt-result-mismatch');
    }
    const expected = createExpectedColumnMultiplicationSubmission(prompt);
    if (!expected) return validation(false, 'unknown', 'invalid-prompt');
    const submission = submissionFromInput(answer);
    if (!submission) return validation(false, 'incorrect', 'invalid-format', expected);

    if (submission.operands[0] !== prompt.operands[0] ||
        submission.operands[1] !== prompt.operands[1]) {
        return validation(false, 'incorrect', 'operand-mismatch', expected, submission);
    }

    if ('carryMarks' in submission) {
        const carryExpected = createExpectedColumnMultiplicationCarrySubmission(prompt);
        if (!carryExpected) {
            return validation(false, 'incorrect', 'invalid-format', expected, submission);
        }
        for (let index = 0; index < carryExpected.carryMarks.length; index++) {
            const required = carryExpected.carryMarks[index];
            const written = submission.carryMarks[index];
            if (required !== null && written === null) {
                return validation(
                    false, 'incomplete', 'missing-carry-mark', carryExpected,
                    submission, undefined, index
                );
            }
            if (required === null && written !== null) {
                return validation(
                    false, 'incorrect', 'unexpected-carry-mark', carryExpected,
                    submission, undefined, index
                );
            }
            if (required !== written) {
                return validation(
                    false, 'incorrect', 'carry-mark-mismatch', carryExpected,
                    submission, undefined, index
                );
            }
        }
        if (submission.result !== carryExpected.result) {
            return validation(
                false, 'incorrect', 'result-mismatch', carryExpected, submission
            );
        }
        return validation(true, 'correct', 'valid', carryExpected, submission);
    }

    const byColumn: Record<number, ColumnMultiplicationPartialProduct> = {};
    for (const row of submission.partialProducts) byColumn[row.multiplicandColumn] = row;
    for (const expectedRow of expected.partialProducts) {
        const written = byColumn[expectedRow.multiplicandColumn];
        if (!written) {
            return validation(
                false, 'incomplete', 'missing-partial-product', expected, submission,
                expectedRow.multiplicandColumn
            );
        }
    }
    for (let index = 0; index < expected.partialProducts.length; index++) {
        const expectedRow = expected.partialProducts[index];
        const written = submission.partialProducts[index];
        if (written.multiplicandColumn !== expectedRow.multiplicandColumn) {
            return validation(
                false, 'incorrect', 'partial-product-order-mismatch', expected,
                submission, expectedRow.multiplicandColumn
            );
        }
        if (written.shift !== expectedRow.shift) {
            return validation(
                false, 'incorrect', 'shift-mismatch', expected, submission,
                expectedRow.multiplicandColumn
            );
        }
        if (written.value !== expectedRow.value) {
            return validation(
                false, 'incorrect', 'partial-product-mismatch', expected, submission,
                expectedRow.multiplicandColumn
            );
        }
    }
    if (submission.result !== expected.result) {
        return validation(false, 'incorrect', 'result-mismatch', expected, submission);
    }
    return validation(true, 'correct', 'valid', expected, submission);
}
