/**
 * Pure data and validation helpers for handwritten column addition.
 *
 * Decimal values deliberately remain strings. This keeps arithmetic exact for
 * every supported input size while the browser bundle still targets ES2017.
 */

export const COLUMN_ADDITION_SUBMISSION_VERSION = 1 as const;
export const MAX_COLUMN_ADDITION_DIGITS = 256;
export const MAX_COLUMN_ADDITION_OPERANDS = 32;
export const MAX_COLUMN_ADDITION_PROMPT_LENGTH = 1_024;
export const MAX_COLUMN_ADDITION_SUBMISSION_LENGTH = 16_384;

export type ColumnAdditionCarry = string | null;
export type ColumnAdditionOperands = [string, string, ...string[]];

export type ColumnAdditionPrompt = {
    kind: 'column-addition';
    operands: ColumnAdditionOperands;
    /** Result written by the author, or null when the prompt omits `=...`. */
    authoredResult: string | null;
    /** Exact result derived from all operands. */
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
    | 'additional-operand'
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
    afterRow: number;
};

export type ColumnAdditionLayout = {
    /** Number of digit columns; the leading operator column is additional. */
    columns: number;
    rows: ColumnAdditionLayoutRow[];
    rules: [ColumnAdditionLayoutRule];
};

export type ColumnAdditionSubmission = {
    kind: 'column-addition';
    version: typeof COLUMN_ADDITION_SUBMISSION_VERSION;
    operands: ColumnAdditionOperands;
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
const PROMPT_SHAPE = /^(\d+(?:\+\d+)+)(?:=(\d+))?$/u;
const MAX_COLUMN_ADDITION_RESULT_DIGITS =
    MAX_COLUMN_ADDITION_DIGITS + String(MAX_COLUMN_ADDITION_OPERANDS).length;
const MAX_COLUMN_ADDITION_CARRY_DIGITS =
    String(MAX_COLUMN_ADDITION_OPERANDS - 1).length;

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

function normalizeOperands(value: unknown, canonical: boolean): ColumnAdditionOperands | null {
    if (!Array.isArray(value) || value.length < 2 ||
        value.length > MAX_COLUMN_ADDITION_OPERANDS) return null;
    const operands: string[] = [];
    for (const operand of value) {
        const normalized = canonical
            ? canonicalDecimal(operand, MAX_COLUMN_ADDITION_DIGITS)
            : normalizeDecimal(operand, MAX_COLUMN_ADDITION_DIGITS);
        if (normalized === null) return null;
        operands.push(normalized);
    }
    return operands as ColumnAdditionOperands;
}

function addDecimalStrings(operands: readonly string[]): DecimalAddition {
    const width = Math.max(...operands.map(operand => operand.length));
    const digits: string[] = [];
    const carries: ColumnAdditionCarry[] = [];
    let incoming = 0;

    for (let column = 0; column < width || incoming > 0; column++) {
        carries.push(incoming ? String(incoming) : null);
        let total = incoming;
        if (column < width) {
            for (const operand of operands) total += decimalDigit(operand, column);
        }
        digits.push(String(total % 10));
        incoming = Math.floor(total / 10);
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

/** Parses only a single authored addition of two or more nonnegative integers. */
export function parseColumnAdditionPrompt(value: unknown): ColumnAdditionPrompt | null {
    const source = normalizePromptSource(value);
    if (!source) return null;
    const match = PROMPT_SHAPE.exec(source);
    if (!match) return null;
    const operands = normalizeOperands(match[1].split('+'), false);
    const authoredResult = match[2] === undefined
        ? null
        : normalizeDecimal(match[2], MAX_COLUMN_ADDITION_RESULT_DIGITS);
    if (operands === null || (match[2] !== undefined && authoredResult === null)) return null;
    return {
        kind: 'column-addition',
        operands,
        authoredResult,
        expectedResult: addDecimalStrings(operands).result
    };
}

function normalizePrompt(value: string | ColumnAdditionPrompt): ColumnAdditionPrompt | null {
    if (typeof value === 'string') return parseColumnAdditionPrompt(value);
    if (!isRecord(value) || !hasExactKeys(value, [
        'kind', 'operands', 'authoredResult', 'expectedResult'
    ]) || value.kind !== 'column-addition') return null;
    const operands = normalizeOperands(value.operands, true);
    const authoredResult = value.authoredResult === null
        ? null
        : canonicalDecimal(value.authoredResult, MAX_COLUMN_ADDITION_RESULT_DIGITS);
    const expectedResult = canonicalDecimal(
        value.expectedResult, MAX_COLUMN_ADDITION_RESULT_DIGITS
    );
    if (operands === null ||
        (value.authoredResult !== null && authoredResult === null) ||
        expectedResult === null) return null;
    const exact = addDecimalStrings(operands).result;
    if (expectedResult !== exact) return null;
    return {
        kind: 'column-addition',
        operands,
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
    operands: ColumnAdditionOperands,
    result: string,
    carries: ColumnAdditionCarry[]
): ColumnAdditionLayout {
    const columns = Math.max(result.length, ...operands.map(operand => operand.length));
    const rows: ColumnAdditionLayoutRow[] = operands.map((operand, index) => ({
        role: index === 0
            ? 'first-operand'
            : index === 1 ? 'second-operand' : 'additional-operand',
        operator: index === 0 ? '' : '+',
        cells: rightAlignedCells(operand, columns)
    }));
    rows.push(
        { role: 'carries', operator: '', cells: carryDisplayCells(carries) },
        { role: 'result', operator: '', cells: rightAlignedCells(result, columns) }
    );
    return {
        columns,
        rows,
        rules: [{ kind: 'horizontal', afterRow: operands.length }]
    };
}

/**
 * Builds a structurally valid observation. Short carry arrays are padded with
 * null cells at higher target columns so OCR callers can provide sparse tails.
 */
export function createColumnAdditionSubmission(
    observation: ColumnAdditionObservation
): ColumnAdditionSubmission | null {
    if (!isRecord(observation)) return null;
    const operands = normalizeOperands(observation.operands, false);
    const result = normalizeDecimal(observation.result, MAX_COLUMN_ADDITION_RESULT_DIGITS);
    if (operands === null || result === null) return null;

    const columns = Math.max(result.length, ...operands.map(operand => operand.length));
    const observedCarries = observation.carries === undefined ? [] : observation.carries;
    if (!Array.isArray(observedCarries) || observedCarries.length > columns) return null;
    const carries: ColumnAdditionCarry[] = [];
    for (const carry of observedCarries) {
        if (carry === null) carries.push(null);
        else {
            const normalized = normalizeDecimal(carry, MAX_COLUMN_ADDITION_CARRY_DIGITS);
            if (normalized === null) return null;
            carries.push(normalized);
        }
    }
    while (carries.length < columns) carries.push(null);

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
    const exact = addDecimalStrings(prompt.operands);
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
    const expectedRule = expected.rules[0];
    return isRecord(rule) && hasExactKeys(rule, ['kind', 'afterRow']) &&
        rule.kind === expectedRule.kind && rule.afterRow === expectedRule.afterRow;
}

function normalizeSubmission(value: unknown): ColumnAdditionSubmission | null {
    if (!isRecord(value) || !hasExactKeys(value, [
        'kind', 'version', 'operands', 'result', 'carries', 'layout'
    ]) || value.kind !== 'column-addition' ||
        value.version !== COLUMN_ADDITION_SUBMISSION_VERSION ||
        !Array.isArray(value.carries)) return null;

    const operands = normalizeOperands(value.operands, true);
    const result = canonicalDecimal(value.result, MAX_COLUMN_ADDITION_RESULT_DIGITS);
    if (operands === null || result === null) return null;
    const columns = Math.max(result.length, ...operands.map(operand => operand.length));
    if (value.carries.length !== columns || !value.carries.every(carry =>
        carry === null || canonicalDecimal(
            carry, MAX_COLUMN_ADDITION_CARRY_DIGITS
        ) !== null
    )) return null;

    const submission = createColumnAdditionSubmission({
        operands,
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

function renderSchoolCarryRow(row: ColumnAdditionLayoutRow): string | null {
    if (row.role !== 'carries' || row.cells.every(cell => cell === null)) {
        return null;
    }
    return row.cells.map(cell => cell === null
        ? String.raw`\hspace{0.5em}`
        : `\\hspace{0.25em}\\mathclap{\\textcolor{red}{${cell}}}\\hspace{0.25em}`
    ).join('');
}

/** Composes the compact right-aligned school layout used by the SchulLia tasks. */
export function composeColumnAdditionLatex(
    value: string | ColumnAdditionSubmission
): string {
    const submission = submissionFromInput(value);
    if (!submission) return '';
    const carryLayoutRow = submission.layout.rows.find(row => row.role === 'carries');
    const carryRow = carryLayoutRow ? renderSchoolCarryRow(carryLayoutRow) : null;
    const rows = [
        ...submission.operands.map((operand, index) => index === 0 ? operand : `+${operand}`),
        ...(carryRow ? [carryRow] : []),
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

    if (submission.operands.length !== prompt.operands.length ||
        submission.operands.some((operand, index) => operand !== prompt.operands[index])) {
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
