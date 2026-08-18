/**
 * Pure data and validation helpers for handwritten column addition.
 *
 * Decimal values deliberately remain strings. This keeps arithmetic exact for
 * every supported input size while the browser bundle still targets ES2017.
 */

export const COLUMN_ADDITION_SUBMISSION_VERSION = 1 as const;
export const MAX_COLUMN_ADDITION_DIGITS = 256;
export const MAX_COLUMN_ADDITION_PROMPT_LENGTH = 1_024;
export const MAX_COLUMN_ADDITION_SUBMISSION_LENGTH = 16_384;

export type ColumnAdditionCarry = string | null;

export type ColumnAdditionPrompt = {
    kind: 'column-addition';
    operands: [string, string];
    /** Result written by the author, or null when the prompt omits `=...`. */
    authoredResult: string | null;
    /** Exact result derived from the two operands. */
    expectedResult: string;
};

export type ColumnAdditionObservation = {
    operands: readonly [string, string] | readonly string[];
    result: string;
    /**
     * Right-to-left target columns: index 0 is the ones column and must have
     * no incoming carry. Index 1 is tens, index 2 hundreds, and so on.
     * A null cell means that no carry was written in that target column.
     */
    carries?: readonly ColumnAdditionCarry[];
};

export type ColumnAdditionLayoutRole =
    | 'carries'
    | 'first-operand'
    | 'second-operand'
    | 'result';

export type ColumnAdditionLayoutRow = {
    role: ColumnAdditionLayoutRole;
    operator: '' | '+';
    /** Digit cells in display order, from the highest column to ones. */
    cells: ColumnAdditionCarry[];
};

export type ColumnAdditionLayoutRule = {
    kind: 'horizontal';
    /** Zero-based row index after which the rule is rendered. */
    afterRow: 2;
};

export type ColumnAdditionLayout = {
    /** Number of digit columns; the leading operator column is additional. */
    columns: number;
    rows: [
        ColumnAdditionLayoutRow,
        ColumnAdditionLayoutRow,
        ColumnAdditionLayoutRow,
        ColumnAdditionLayoutRow
    ];
    rules: [ColumnAdditionLayoutRule];
};

export type ColumnAdditionSubmission = {
    kind: 'column-addition';
    version: typeof COLUMN_ADDITION_SUBMISSION_VERSION;
    operands: [string, string];
    result: string;
    /** Incoming carries by target column, right-to-left; index 0 is ones. */
    carries: ColumnAdditionCarry[];
    layout: ColumnAdditionLayout;
};

export type ColumnAdditionValidationReason =
    | 'valid'
    | 'invalid-prompt'
    | 'prompt-result-mismatch'
    | 'invalid-format'
    | 'operand-mismatch'
    | 'result-mismatch'
    | 'carry-mismatch'
    | 'missing-carry';

export type ColumnAdditionValidation = {
    accepted: boolean;
    outcome: 'correct' | 'incorrect' | 'incomplete' | 'unknown';
    reason: ColumnAdditionValidationReason;
    /** Right-to-left target column involved in a carry verdict. */
    carryColumn?: number;
    expected?: ColumnAdditionSubmission;
    submission?: ColumnAdditionSubmission;
};

type DecimalAddition = {
    result: string;
    carries: ColumnAdditionCarry[];
};

type UnknownRecord = Record<string, unknown>;

const DECIMAL = /^\d+$/u;
const CARRY_DIGIT = /^\d$/u;
const PROMPT_SHAPE = /^(\d+)\+(\d+)(?:=(\d+))?$/u;

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

function decimalDigit(source: string, rightToLeftIndex: number): number {
    const index = source.length - rightToLeftIndex - 1;
    return index < 0 ? 0 : source.charCodeAt(index) - 48;
}

function addDecimalStrings(first: string, second: string): DecimalAddition {
    const width = Math.max(first.length, second.length);
    const digits: string[] = [];
    const carries: ColumnAdditionCarry[] = [];
    let incoming = 0;

    for (let column = 0; column < width; column++) {
        carries.push(incoming ? '1' : null);
        const total = decimalDigit(first, column) + decimalDigit(second, column) + incoming;
        digits.push(String.fromCharCode(48 + total % 10));
        incoming = total >= 10 ? 1 : 0;
    }
    if (incoming) {
        carries.push('1');
        digits.push('1');
    }

    return {
        result: digits.reverse().join('') || '0',
        carries
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
    if (!source || source.length > MAX_COLUMN_ADDITION_PROMPT_LENGTH || /[\r\n]/u.test(source)) {
        return null;
    }
    const unwrapped = stripMathDelimiters(source);
    if (unwrapped === null) return null;
    source = unwrapped
        .replace(/\\(?:left|right)\b/gu, '')
        .replace(/\\(?:quad|qquad|enspace|thinspace|medspace|thickspace)\b/gu, '')
        .replace(/\\[,;!:>]/gu, '')
        .replace(/\\[ \t]/gu, '')
        .replace(/[\s~]/gu, '');
    if (!bracesAreBalanced(source)) return null;
    source = source.replace(/[{}]/gu, '');
    return source;
}

/** Parses only a single, authored, two-operand nonnegative integer addition. */
export function parseColumnAdditionPrompt(value: unknown): ColumnAdditionPrompt | null {
    const source = normalizePromptSource(value);
    if (!source) return null;
    const match = PROMPT_SHAPE.exec(source);
    if (!match) return null;
    const first = normalizeDecimal(match[1], MAX_COLUMN_ADDITION_DIGITS);
    const second = normalizeDecimal(match[2], MAX_COLUMN_ADDITION_DIGITS);
    const authoredResult = match[3] === undefined
        ? null
        : normalizeDecimal(match[3], MAX_COLUMN_ADDITION_DIGITS + 1);
    if (first === null || second === null ||
        (match[3] !== undefined && authoredResult === null)) return null;
    return {
        kind: 'column-addition',
        operands: [first, second],
        authoredResult,
        expectedResult: addDecimalStrings(first, second).result
    };
}

function normalizePrompt(value: string | ColumnAdditionPrompt): ColumnAdditionPrompt | null {
    if (typeof value === 'string') return parseColumnAdditionPrompt(value);
    if (!isRecord(value) || !hasExactKeys(value, [
        'kind', 'operands', 'authoredResult', 'expectedResult'
    ]) || value.kind !== 'column-addition' || !Array.isArray(value.operands) ||
        value.operands.length !== 2) return null;
    const first = canonicalDecimal(value.operands[0], MAX_COLUMN_ADDITION_DIGITS);
    const second = canonicalDecimal(value.operands[1], MAX_COLUMN_ADDITION_DIGITS);
    const authoredResult = value.authoredResult === null
        ? null
        : canonicalDecimal(value.authoredResult, MAX_COLUMN_ADDITION_DIGITS + 1);
    const expectedResult = canonicalDecimal(value.expectedResult, MAX_COLUMN_ADDITION_DIGITS + 1);
    if (first === null || second === null ||
        (value.authoredResult !== null && authoredResult === null) ||
        expectedResult === null) return null;
    const exact = addDecimalStrings(first, second).result;
    if (expectedResult !== exact) return null;
    return {
        kind: 'column-addition',
        operands: [first, second],
        authoredResult,
        expectedResult
    };
}

function rightAlignedCells(value: string, columns: number): ColumnAdditionCarry[] {
    const cells = new Array<ColumnAdditionCarry>(columns).fill(null);
    const offset = columns - value.length;
    for (let index = 0; index < value.length; index++) cells[offset + index] = value[index];
    return cells;
}

function carryDisplayCells(carries: readonly ColumnAdditionCarry[]): ColumnAdditionCarry[] {
    return Array.from(carries).reverse();
}

function createLayout(
    operands: [string, string],
    result: string,
    carries: ColumnAdditionCarry[]
): ColumnAdditionLayout {
    const columns = Math.max(operands[0].length, operands[1].length, result.length);
    return {
        columns,
        rows: [
            { role: 'first-operand', operator: '', cells: rightAlignedCells(operands[0], columns) },
            { role: 'second-operand', operator: '+', cells: rightAlignedCells(operands[1], columns) },
            { role: 'carries', operator: '', cells: carryDisplayCells(carries) },
            { role: 'result', operator: '', cells: rightAlignedCells(result, columns) }
        ],
        rules: [{ kind: 'horizontal', afterRow: 2 }]
    };
}

/**
 * Builds a structurally valid observation. Short carry arrays are padded with
 * null cells at higher target columns so OCR callers can provide sparse tails.
 */
export function createColumnAdditionSubmission(
    observation: ColumnAdditionObservation
): ColumnAdditionSubmission | null {
    if (!isRecord(observation) || !Array.isArray(observation.operands) ||
        observation.operands.length !== 2) return null;
    const first = normalizeDecimal(observation.operands[0], MAX_COLUMN_ADDITION_DIGITS);
    const second = normalizeDecimal(observation.operands[1], MAX_COLUMN_ADDITION_DIGITS);
    const result = normalizeDecimal(observation.result, MAX_COLUMN_ADDITION_DIGITS + 1);
    if (first === null || second === null || result === null) return null;

    const columns = Math.max(first.length, second.length, result.length);
    const observedCarries = observation.carries === undefined ? [] : observation.carries;
    if (!Array.isArray(observedCarries) || observedCarries.length > columns) return null;
    const carries: ColumnAdditionCarry[] = [];
    for (const carry of observedCarries) {
        if (carry === null) carries.push(null);
        else if (typeof carry === 'string' && CARRY_DIGIT.test(carry.trim())) {
            carries.push(carry.trim());
        } else return null;
    }
    while (carries.length < columns) carries.push(null);

    const operands: [string, string] = [first, second];
    return {
        kind: 'column-addition',
        version: COLUMN_ADDITION_SUBMISSION_VERSION,
        operands,
        result,
        carries,
        layout: createLayout(operands, result, carries)
    };
}

/** Derives the canonical result and every required carry from a prompt. */
export function createExpectedColumnAdditionSubmission(
    value: string | ColumnAdditionPrompt
): ColumnAdditionSubmission | null {
    const prompt = normalizePrompt(value);
    if (!prompt || (prompt.authoredResult !== null &&
        prompt.authoredResult !== prompt.expectedResult)) return null;
    const exact = addDecimalStrings(prompt.operands[0], prompt.operands[1]);
    return createColumnAdditionSubmission({
        operands: prompt.operands,
        result: exact.result,
        carries: exact.carries
    });
}

function cellsMatch(left: readonly ColumnAdditionCarry[], right: readonly ColumnAdditionCarry[]): boolean {
    return left.length === right.length && left.every((cell, index) => cell === right[index]);
}

function layoutMatches(value: unknown, expected: ColumnAdditionLayout): boolean {
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
                row.cells as ColumnAdditionCarry[], expectedRow.cells
            )) return false;
    }
    const rule = value.rules[0];
    return isRecord(rule) && hasExactKeys(rule, ['kind', 'afterRow']) &&
        rule.kind === 'horizontal' && rule.afterRow === 2;
}

function normalizeSubmission(value: unknown): ColumnAdditionSubmission | null {
    if (!isRecord(value) || !hasExactKeys(value, [
        'kind', 'version', 'operands', 'result', 'carries', 'layout'
    ]) || value.kind !== 'column-addition' ||
        value.version !== COLUMN_ADDITION_SUBMISSION_VERSION ||
        !Array.isArray(value.operands) || value.operands.length !== 2 ||
        !Array.isArray(value.carries)) return null;

    const first = canonicalDecimal(value.operands[0], MAX_COLUMN_ADDITION_DIGITS);
    const second = canonicalDecimal(value.operands[1], MAX_COLUMN_ADDITION_DIGITS);
    const result = canonicalDecimal(value.result, MAX_COLUMN_ADDITION_DIGITS + 1);
    if (first === null || second === null || result === null) return null;
    const columns = Math.max(first.length, second.length, result.length);
    if (value.carries.length !== columns || !value.carries.every(carry =>
        carry === null || typeof carry === 'string' && CARRY_DIGIT.test(carry)
    )) return null;

    const submission = createColumnAdditionSubmission({
        operands: [first, second],
        result,
        carries: value.carries as ColumnAdditionCarry[]
    });
    return submission && layoutMatches(value.layout, submission.layout) ? submission : null;
}

/** Serializes only the canonical, versioned object shape. */
export function serializeColumnAdditionSubmission(value: ColumnAdditionSubmission): string {
    const submission = normalizeSubmission(value);
    if (!submission) return '';
    try {
        const serialized = JSON.stringify(submission);
        return serialized.length <= MAX_COLUMN_ADDITION_SUBMISSION_LENGTH ? serialized : '';
    } catch (_) {
        return '';
    }
}

/** Decodes neither legacy equation arrays nor unversioned objects. */
export function decodeColumnAdditionSubmission(source: string): ColumnAdditionSubmission | null {
    if (typeof source !== 'string') return null;
    const value = source.trim();
    if (!value || value.length > MAX_COLUMN_ADDITION_SUBMISSION_LENGTH || value[0] !== '{') return null;
    try {
        return normalizeSubmission(JSON.parse(value) as unknown);
    } catch (_) {
        return null;
    }
}

function submissionFromInput(value: string | ColumnAdditionSubmission): ColumnAdditionSubmission | null {
    return typeof value === 'string' ? decodeColumnAdditionSubmission(value) : normalizeSubmission(value);
}

function renderLayoutRow(row: ColumnAdditionLayoutRow): string {
    const cells = row.cells.map(cell => {
        if (cell === null) return '';
        return row.role === 'carries' ? `{\\scriptstyle ${cell}}` : cell;
    });
    return [row.operator, ...cells].join(' & ').replace(/\s+$/u, '');
}

/** Composes a KaTeX-safe array; all rendered cells were restricted to digits. */
export function composeColumnAdditionLatex(
    value: string | ColumnAdditionSubmission
): string {
    const submission = submissionFromInput(value);
    if (!submission) return '';
    const { layout } = submission;
    const alignment = new Array(layout.columns + 1).fill('r').join('');
    const rows: string[] = [];
    for (let index = 0; index < layout.rows.length; index++) {
        rows.push(renderLayoutRow(layout.rows[index]));
        if (index + 1 < layout.rows.length) {
            rows.push(layout.rules.some(rule => rule.afterRow === index)
                ? String.raw` \\ \hline `
                : String.raw` \\ `);
        }
    }
    return `\\begin{array}{${alignment}} ${rows.join('')} \\end{array}`;
}

function validation(
    accepted: boolean,
    outcome: ColumnAdditionValidation['outcome'],
    reason: ColumnAdditionValidationReason,
    expected?: ColumnAdditionSubmission,
    submission?: ColumnAdditionSubmission,
    carryColumn?: number
): ColumnAdditionValidation {
    return {
        accepted,
        outcome,
        reason,
        ...(carryColumn === undefined ? {} : { carryColumn }),
        ...(expected ? { expected } : {}),
        ...(submission ? { submission } : {})
    };
}

/**
 * Validates the written operands, result and carry annotations exactly.
 * Missing required carries are conservatively `incomplete` and not accepted;
 * a written wrong or superfluous carry is `incorrect`.
 */
export function validateColumnAdditionSubmission(
    promptValue: string | ColumnAdditionPrompt,
    answer: string | ColumnAdditionSubmission
): ColumnAdditionValidation {
    const prompt = normalizePrompt(promptValue);
    if (!prompt) return validation(false, 'unknown', 'invalid-prompt');
    if (prompt.authoredResult !== null && prompt.authoredResult !== prompt.expectedResult) {
        return validation(false, 'unknown', 'prompt-result-mismatch');
    }
    const expected = createExpectedColumnAdditionSubmission(prompt);
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
    for (let column = 0; column < expected.carries.length; column++) {
        const required = expected.carries[column];
        const written = submission.carries[column];
        if (written === required) continue;
        if (required !== null && written === null) {
            if (missingColumn === undefined) missingColumn = column;
            continue;
        }
        return validation(
            false, 'incorrect', 'carry-mismatch', expected, submission, column
        );
    }
    if (missingColumn !== undefined) {
        return validation(
            false, 'incomplete', 'missing-carry', expected, submission, missingColumn
        );
    }
    return validation(true, 'correct', 'valid', expected, submission);
}
