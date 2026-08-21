/**
 * Pure data and validation helpers for handwritten column subtraction.
 *
 * Decimal values deliberately remain strings. This keeps arithmetic exact for
 * every supported input size while the browser bundle still targets ES2017.
 */

export const COLUMN_SUBTRACTION_SUBMISSION_VERSION = 1 as const;
export const MAX_COLUMN_SUBTRACTION_DIGITS = 256;
export const MAX_COLUMN_SUBTRACTION_PROMPT_LENGTH = 1_024;
export const MAX_COLUMN_SUBTRACTION_SUBMISSION_LENGTH = 16_384;

export type ColumnSubtractionBorrow = string | null;

export type ColumnSubtractionPrompt = {
    kind: 'column-subtraction';
    operands: [string, string];
    /** Result written by the author, or null when the prompt omits `=...`. */
    authoredResult: string | null;
    /** Exact nonnegative result derived from minuend and subtrahend. */
    expectedResult: string;
};

export type ColumnSubtractionObservation = {
    operands: readonly [string, string] | readonly string[];
    result: string;
    /**
     * Right-to-left target columns: index 0 is the ones column and cannot
     * receive a borrow mark. A `1` at index n means that the calculation in
     * column n - 1 borrowed one unit from column n. Null means that no mark was
     * written in that target column.
     */
    borrows?: readonly ColumnSubtractionBorrow[];
};

export type ColumnSubtractionLayoutRole =
    | 'borrows'
    | 'first-operand'
    | 'second-operand'
    | 'result';

export type ColumnSubtractionLayoutRow = {
    role: ColumnSubtractionLayoutRole;
    operator: '' | '-';
    /** Digit cells in display order, from the highest column to ones. */
    cells: ColumnSubtractionBorrow[];
};

export type ColumnSubtractionLayoutRule = {
    kind: 'horizontal';
    /** Zero-based row index after which the rule is rendered. */
    afterRow: 1 | 2;
};

export type ColumnSubtractionLayout = {
    /** Number of digit columns; the leading operator column is additional. */
    columns: number;
    /** The borrow row is present only when at least one mark was written. */
    rows:
        | [
            ColumnSubtractionLayoutRow,
            ColumnSubtractionLayoutRow,
            ColumnSubtractionLayoutRow
        ]
        | [
            ColumnSubtractionLayoutRow,
            ColumnSubtractionLayoutRow,
            ColumnSubtractionLayoutRow,
            ColumnSubtractionLayoutRow
        ];
    rules: [ColumnSubtractionLayoutRule];
};

export type ColumnSubtractionSubmission = {
    kind: 'column-subtraction';
    version: typeof COLUMN_SUBTRACTION_SUBMISSION_VERSION;
    /** Minuend first, subtrahend second. */
    operands: [string, string];
    result: string;
    /** Borrow marks by target column, right-to-left; index 0 is ones. */
    borrows: ColumnSubtractionBorrow[];
    layout: ColumnSubtractionLayout;
};

export type ColumnSubtractionValidationReason =
    | 'valid'
    | 'invalid-prompt'
    | 'prompt-result-mismatch'
    | 'invalid-format'
    | 'operand-mismatch'
    | 'result-mismatch'
    | 'borrow-mismatch'
    | 'missing-borrow';

export type ColumnSubtractionValidation = {
    accepted: boolean;
    outcome: 'correct' | 'incorrect' | 'incomplete' | 'unknown';
    reason: ColumnSubtractionValidationReason;
    /** Right-to-left target column involved in a borrow verdict. */
    borrowColumn?: number;
    expected?: ColumnSubtractionSubmission;
    submission?: ColumnSubtractionSubmission;
};

type DecimalSubtraction = {
    result: string;
    borrows: ColumnSubtractionBorrow[];
};

type UnknownRecord = Record<string, unknown>;

const DECIMAL = /^\d+$/u;
const BORROW_DIGIT = /^\d$/u;
const PROMPT_SHAPE = /^(\d+)-(\d+)(?:=(\d+))?$/u;

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

function compareDecimalStrings(first: string, second: string): number {
    if (first.length !== second.length) return first.length < second.length ? -1 : 1;
    if (first === second) return 0;
    return first < second ? -1 : 1;
}

function decimalDigit(source: string, rightToLeftIndex: number): number {
    const index = source.length - rightToLeftIndex - 1;
    return index < 0 ? 0 : source.charCodeAt(index) - 48;
}

function subtractDecimalStrings(first: string, second: string): DecimalSubtraction | null {
    if (compareDecimalStrings(first, second) < 0) return null;
    const digits: string[] = [];
    const borrows: ColumnSubtractionBorrow[] = [];
    let incomingBorrow = 0;

    for (let column = 0; column < first.length; column++) {
        borrows.push(incomingBorrow ? '1' : null);
        const minuendDigit = decimalDigit(first, column);
        const adjustedSubtrahend = decimalDigit(second, column) + incomingBorrow;
        if (minuendDigit < adjustedSubtrahend) {
            digits.push(String.fromCharCode(48 + minuendDigit + 10 - adjustedSubtrahend));
            incomingBorrow = 1;
        } else {
            digits.push(String.fromCharCode(48 + minuendDigit - adjustedSubtrahend));
            incomingBorrow = 0;
        }
    }
    if (incomingBorrow) return null;
    const result = digits.reverse().join('').replace(/^0+(?=\d)/u, '') || '0';
    return { result, borrows };
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
    if (!source || source.length > MAX_COLUMN_SUBTRACTION_PROMPT_LENGTH || /[\r\n]/u.test(source)) {
        return null;
    }
    const unwrapped = stripMathDelimiters(source);
    if (unwrapped === null) return null;
    source = unwrapped
        .replace(/\\(?:left|right)\b/gu, '')
        .replace(/\\(?:quad|qquad|enspace|thinspace|medspace|thickspace)\b/gu, '')
        .replace(/\\[,;!:>]/gu, '')
        .replace(/\\[ \t]/gu, '')
        .replace(/[\s~]/gu, '')
        .replace(/\u2212/gu, '-');
    if (!bracesAreBalanced(source)) return null;
    return source.replace(/[{}]/gu, '');
}

/** Parses only one authored subtraction of nonnegative integers with a nonnegative result. */
export function parseColumnSubtractionPrompt(value: unknown): ColumnSubtractionPrompt | null {
    const source = normalizePromptSource(value);
    if (!source) return null;
    const match = PROMPT_SHAPE.exec(source);
    if (!match) return null;
    const first = normalizeDecimal(match[1], MAX_COLUMN_SUBTRACTION_DIGITS);
    const second = normalizeDecimal(match[2], MAX_COLUMN_SUBTRACTION_DIGITS);
    const authoredResult = match[3] === undefined
        ? null
        : normalizeDecimal(match[3], MAX_COLUMN_SUBTRACTION_DIGITS);
    if (first === null || second === null ||
        (match[3] !== undefined && authoredResult === null)) return null;
    const exact = subtractDecimalStrings(first, second);
    if (!exact) return null;
    return {
        kind: 'column-subtraction',
        operands: [first, second],
        authoredResult,
        expectedResult: exact.result
    };
}

function normalizePrompt(value: string | ColumnSubtractionPrompt): ColumnSubtractionPrompt | null {
    if (typeof value === 'string') return parseColumnSubtractionPrompt(value);
    if (!isRecord(value) || !hasExactKeys(value, [
        'kind', 'operands', 'authoredResult', 'expectedResult'
    ]) || value.kind !== 'column-subtraction' || !Array.isArray(value.operands) ||
        value.operands.length !== 2) return null;
    const first = canonicalDecimal(value.operands[0], MAX_COLUMN_SUBTRACTION_DIGITS);
    const second = canonicalDecimal(value.operands[1], MAX_COLUMN_SUBTRACTION_DIGITS);
    const authoredResult = value.authoredResult === null
        ? null
        : canonicalDecimal(value.authoredResult, MAX_COLUMN_SUBTRACTION_DIGITS);
    const expectedResult = canonicalDecimal(value.expectedResult, MAX_COLUMN_SUBTRACTION_DIGITS);
    if (first === null || second === null ||
        (value.authoredResult !== null && authoredResult === null) ||
        expectedResult === null) return null;
    const exact = subtractDecimalStrings(first, second);
    if (!exact || expectedResult !== exact.result) return null;
    return {
        kind: 'column-subtraction',
        operands: [first, second],
        authoredResult,
        expectedResult
    };
}

function rightAlignedCells(value: string, columns: number): ColumnSubtractionBorrow[] {
    const cells = new Array<ColumnSubtractionBorrow>(columns).fill(null);
    const offset = columns - value.length;
    for (let index = 0; index < value.length; index++) cells[offset + index] = value[index];
    return cells;
}

function borrowDisplayCells(borrows: readonly ColumnSubtractionBorrow[]): ColumnSubtractionBorrow[] {
    return Array.from(borrows).reverse();
}

function createLayout(
    operands: [string, string],
    result: string,
    borrows: ColumnSubtractionBorrow[]
): ColumnSubtractionLayout {
    const columns = Math.max(operands[0].length, operands[1].length, result.length);
    const firstRow: ColumnSubtractionLayoutRow = {
        role: 'first-operand',
        operator: '',
        cells: rightAlignedCells(operands[0], columns)
    };
    const secondRow: ColumnSubtractionLayoutRow = {
        role: 'second-operand',
        operator: '-',
        cells: rightAlignedCells(operands[1], columns)
    };
    const resultRow: ColumnSubtractionLayoutRow = {
        role: 'result',
        operator: '',
        cells: rightAlignedCells(result, columns)
    };
    const hasBorrowRow = borrows.some(borrow => borrow !== null);
    return {
        columns,
        rows: hasBorrowRow
            ? [
                firstRow,
                secondRow,
                { role: 'borrows', operator: '-', cells: borrowDisplayCells(borrows) },
                resultRow
            ]
            : [firstRow, secondRow, resultRow],
        rules: [{ kind: 'horizontal', afterRow: hasBorrowRow ? 2 : 1 }]
    };
}

/**
 * Builds a structurally valid observation. Short borrow arrays are padded with
 * null cells at higher target columns so OCR callers can provide sparse tails.
 */
export function createColumnSubtractionSubmission(
    observation: ColumnSubtractionObservation
): ColumnSubtractionSubmission | null {
    if (!isRecord(observation) || !Array.isArray(observation.operands) ||
        observation.operands.length !== 2) return null;
    const first = normalizeDecimal(observation.operands[0], MAX_COLUMN_SUBTRACTION_DIGITS);
    const second = normalizeDecimal(observation.operands[1], MAX_COLUMN_SUBTRACTION_DIGITS);
    const result = normalizeDecimal(observation.result, MAX_COLUMN_SUBTRACTION_DIGITS);
    if (first === null || second === null || result === null ||
        compareDecimalStrings(first, second) < 0) return null;

    const columns = Math.max(first.length, second.length, result.length);
    const observedBorrows = observation.borrows === undefined ? [] : observation.borrows;
    if (!Array.isArray(observedBorrows) || observedBorrows.length > columns) return null;
    const borrows: ColumnSubtractionBorrow[] = [];
    for (const borrow of observedBorrows) {
        if (borrow === null) borrows.push(null);
        else if (typeof borrow === 'string' && BORROW_DIGIT.test(borrow.trim())) {
            borrows.push(borrow.trim());
        } else return null;
    }
    while (borrows.length < columns) borrows.push(null);

    const operands: [string, string] = [first, second];
    return {
        kind: 'column-subtraction',
        version: COLUMN_SUBTRACTION_SUBMISSION_VERSION,
        operands,
        result,
        borrows,
        layout: createLayout(operands, result, borrows)
    };
}

/** Derives the canonical difference and all required borrow marks from a prompt. */
export function createExpectedColumnSubtractionSubmission(
    value: string | ColumnSubtractionPrompt
): ColumnSubtractionSubmission | null {
    const prompt = normalizePrompt(value);
    if (!prompt || (prompt.authoredResult !== null &&
        prompt.authoredResult !== prompt.expectedResult)) return null;
    const exact = subtractDecimalStrings(prompt.operands[0], prompt.operands[1]);
    if (!exact) return null;
    return createColumnSubtractionSubmission({
        operands: prompt.operands,
        result: exact.result,
        borrows: exact.borrows
    });
}

function cellsMatch(
    left: readonly ColumnSubtractionBorrow[],
    right: readonly ColumnSubtractionBorrow[]
): boolean {
    return left.length === right.length && left.every((cell, index) => cell === right[index]);
}

function layoutMatches(value: unknown, expected: ColumnSubtractionLayout): boolean {
    if (!isRecord(value) || !hasExactKeys(value, ['columns', 'rows', 'rules']) ||
        value.columns !== expected.columns || !Array.isArray(value.rows) ||
        value.rows.length !== expected.rows.length || !Array.isArray(value.rules) ||
        value.rules.length !== 1) return false;

    for (let index = 0; index < expected.rows.length; index++) {
        const row = value.rows[index];
        const expectedRow = expected.rows[index];
        if (!isRecord(row) || !hasExactKeys(row, ['role', 'operator', 'cells']) ||
            row.role !== expectedRow.role || row.operator !== expectedRow.operator ||
            !Array.isArray(row.cells) || !cellsMatch(
                row.cells as ColumnSubtractionBorrow[], expectedRow.cells
            )) return false;
    }
    const rule = value.rules[0];
    return isRecord(rule) && hasExactKeys(rule, ['kind', 'afterRow']) &&
        rule.kind === 'horizontal' && rule.afterRow === expected.rules[0].afterRow;
}

function normalizeSubmission(value: unknown): ColumnSubtractionSubmission | null {
    if (!isRecord(value) || !hasExactKeys(value, [
        'kind', 'version', 'operands', 'result', 'borrows', 'layout'
    ]) || value.kind !== 'column-subtraction' ||
        value.version !== COLUMN_SUBTRACTION_SUBMISSION_VERSION ||
        !Array.isArray(value.operands) || value.operands.length !== 2 ||
        !Array.isArray(value.borrows)) return null;

    const first = canonicalDecimal(value.operands[0], MAX_COLUMN_SUBTRACTION_DIGITS);
    const second = canonicalDecimal(value.operands[1], MAX_COLUMN_SUBTRACTION_DIGITS);
    const result = canonicalDecimal(value.result, MAX_COLUMN_SUBTRACTION_DIGITS);
    if (first === null || second === null || result === null ||
        compareDecimalStrings(first, second) < 0) return null;
    const columns = Math.max(first.length, second.length, result.length);
    if (value.borrows.length !== columns || !value.borrows.every(borrow =>
        borrow === null || typeof borrow === 'string' && BORROW_DIGIT.test(borrow)
    )) return null;

    const submission = createColumnSubtractionSubmission({
        operands: [first, second],
        result,
        borrows: value.borrows as ColumnSubtractionBorrow[]
    });
    return submission && layoutMatches(value.layout, submission.layout) ? submission : null;
}

/** Serializes only the canonical, versioned object shape. */
export function serializeColumnSubtractionSubmission(value: ColumnSubtractionSubmission): string {
    const submission = normalizeSubmission(value);
    if (!submission) return '';
    try {
        const serialized = JSON.stringify(submission);
        return serialized.length <= MAX_COLUMN_SUBTRACTION_SUBMISSION_LENGTH ? serialized : '';
    } catch (_) {
        return '';
    }
}

/** Decodes neither legacy equation arrays nor unversioned objects. */
export function decodeColumnSubtractionSubmission(source: string): ColumnSubtractionSubmission | null {
    if (typeof source !== 'string') return null;
    const value = source.trim();
    if (!value || value.length > MAX_COLUMN_SUBTRACTION_SUBMISSION_LENGTH || value[0] !== '{') {
        return null;
    }
    try {
        return normalizeSubmission(JSON.parse(value) as unknown);
    } catch (_) {
        return null;
    }
}

function submissionFromInput(
    value: string | ColumnSubtractionSubmission
): ColumnSubtractionSubmission | null {
    return typeof value === 'string' ? decodeColumnSubtractionSubmission(value) : normalizeSubmission(value);
}

function renderSchoolBorrowRow(row: ColumnSubtractionLayoutRow): string | null {
    if (row.role !== 'borrows' || row.cells.every(cell => cell === null)) {
        return null;
    }
    const cells = row.cells.map(cell => cell === null
        ? String.raw`\hspace{0.5em}`
        : `\\hspace{0.25em}\\mathclap{\\textcolor{red}{${cell}}}\\hspace{0.25em}`
    ).join('');
    // The pinned source repeats the sign on the borrow row. A zero-width
    // overlap keeps that sign outside the fixed-width digit slots.
    return String.raw`\mathllap{-}` + cells;
}

/** Composes the compact right-aligned school layout used by the SchulLia tasks. */
export function composeColumnSubtractionLatex(
    value: string | ColumnSubtractionSubmission
): string {
    const submission = submissionFromInput(value);
    if (!submission) return '';
    const borrowLayoutRow = submission.layout.rows.find(row => row.role === 'borrows');
    const borrowRow = borrowLayoutRow ? renderSchoolBorrowRow(borrowLayoutRow) : null;
    const rows = [
        submission.operands[0],
        `-${submission.operands[1]}`,
        ...(borrowRow ? [borrowRow] : []),
        submission.result
    ];
    const body = rows.map((row, index) => {
        if (index === rows.length - 1) return row + String.raw` \\ `;
        if (index === rows.length - 2) return row + String.raw` \\ \hline `;
        return row + String.raw` \\ `;
    }).join('');
    return `\\begin{array}{r} ${body}\\end{array}`;
}

function validation(
    accepted: boolean,
    outcome: ColumnSubtractionValidation['outcome'],
    reason: ColumnSubtractionValidationReason,
    expected?: ColumnSubtractionSubmission,
    submission?: ColumnSubtractionSubmission,
    borrowColumn?: number
): ColumnSubtractionValidation {
    return {
        accepted,
        outcome,
        reason,
        ...(borrowColumn === undefined ? {} : { borrowColumn }),
        ...(expected ? { expected } : {}),
        ...(submission ? { submission } : {})
    };
}

/**
 * Validates operands, difference and borrow annotations independently.
 * Missing required marks are conservatively incomplete; wrong or superfluous
 * marks are incorrect and are never moved to a semantically expected column.
 */
export function validateColumnSubtractionSubmission(
    promptValue: string | ColumnSubtractionPrompt,
    answer: string | ColumnSubtractionSubmission
): ColumnSubtractionValidation {
    const prompt = normalizePrompt(promptValue);
    if (!prompt) return validation(false, 'unknown', 'invalid-prompt');
    if (prompt.authoredResult !== null && prompt.authoredResult !== prompt.expectedResult) {
        return validation(false, 'unknown', 'prompt-result-mismatch');
    }
    const expected = createExpectedColumnSubtractionSubmission(prompt);
    if (!expected) return validation(false, 'unknown', 'invalid-prompt');
    const submission = submissionFromInput(answer);
    if (!submission) return validation(false, 'incorrect', 'invalid-format', expected);

    if (submission.operands[0] !== prompt.operands[0] ||
        submission.operands[1] !== prompt.operands[1]) {
        return validation(false, 'incorrect', 'operand-mismatch', expected, submission);
    }
    if (submission.result !== expected.result) {
        return validation(false, 'incorrect', 'result-mismatch', expected, submission);
    }

    let missingColumn: number | undefined;
    for (let column = 0; column < expected.borrows.length; column++) {
        const required = expected.borrows[column];
        const written = submission.borrows[column];
        if (written === required) continue;
        if (required !== null && written === null) {
            if (missingColumn === undefined) missingColumn = column;
            continue;
        }
        return validation(
            false, 'incorrect', 'borrow-mismatch', expected, submission, column
        );
    }
    if (missingColumn !== undefined) {
        return validation(
            false, 'incomplete', 'missing-borrow', expected, submission, missingColumn
        );
    }
    return validation(true, 'correct', 'valid', expected, submission);
}
