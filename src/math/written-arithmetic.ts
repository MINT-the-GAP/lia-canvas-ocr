/**
 * Discriminated dispatcher for every supported written-arithmetic layout.
 *
 * The authored prompt selects the layout.  Handwriting is deliberately never
 * used to guess or correct the operation, and every concrete model keeps its
 * own strict, versioned submission decoder.
 */

import {
    MAX_COLUMN_ADDITION_SUBMISSION_LENGTH,
    composeColumnAdditionLatex,
    createExpectedColumnAdditionSubmission,
    decodeColumnAdditionSubmission,
    parseColumnAdditionPrompt,
    serializeColumnAdditionSubmission,
    validateColumnAdditionSubmission,
    type ColumnAdditionPrompt,
    type ColumnAdditionSubmission,
    type ColumnAdditionValidation
} from './column-arithmetic.ts';
import {
    MAX_COLUMN_SUBTRACTION_SUBMISSION_LENGTH,
    composeColumnSubtractionLatex,
    createExpectedColumnSubtractionSubmission,
    decodeColumnSubtractionSubmission,
    parseColumnSubtractionPrompt,
    serializeColumnSubtractionSubmission,
    validateColumnSubtractionSubmission,
    type ColumnSubtractionPrompt,
    type ColumnSubtractionSubmission,
    type ColumnSubtractionValidation
} from './column-subtraction.ts';
import {
    MAX_COLUMN_MULTIPLICATION_SUBMISSION_LENGTH,
    composeColumnMultiplicationLatex,
    createExpectedColumnMultiplicationSubmission,
    decodeColumnMultiplicationSubmission,
    parseColumnMultiplicationPrompt,
    serializeColumnMultiplicationSubmission,
    validateColumnMultiplicationSubmission,
    type ColumnMultiplicationPrompt,
    type ColumnMultiplicationSubmission,
    type ColumnMultiplicationValidation
} from './column-multiplication.ts';
import {
    MAX_COLUMN_DIVISION_SUBMISSION_LENGTH,
    composeColumnDivisionLatex,
    createExpectedColumnDivisionSubmission,
    decodeColumnDivisionSubmission,
    parseColumnDivisionPrompt,
    serializeColumnDivisionSubmission,
    validateColumnDivisionSubmission,
    type ColumnDivisionPrompt,
    type ColumnDivisionSubmission,
    type ColumnDivisionValidation
} from './column-division.ts';

export type WrittenArithmeticKind =
    | 'column-addition'
    | 'column-subtraction'
    | 'column-multiplication'
    | 'column-division';

export type WrittenArithmeticPrompt =
    | ColumnAdditionPrompt
    | ColumnSubtractionPrompt
    | ColumnMultiplicationPrompt
    | ColumnDivisionPrompt;

export type WrittenArithmeticSubmission =
    | ColumnAdditionSubmission
    | ColumnSubtractionSubmission
    | ColumnMultiplicationSubmission
    | ColumnDivisionSubmission;

export type WrittenArithmeticValidation =
    | ColumnAdditionValidation
    | ColumnSubtractionValidation
    | ColumnMultiplicationValidation
    | ColumnDivisionValidation;

export const MAX_WRITTEN_ARITHMETIC_SUBMISSION_LENGTH = Math.max(
    MAX_COLUMN_ADDITION_SUBMISSION_LENGTH,
    MAX_COLUMN_SUBTRACTION_SUBMISSION_LENGTH,
    MAX_COLUMN_MULTIPLICATION_SUBMISSION_LENGTH,
    MAX_COLUMN_DIVISION_SUBMISSION_LENGTH
);

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Selects a written layout solely from one concrete, integer-only prompt.
 * Algebraic equations and multiline/serialized calculations remain untouched.
 */
export function parseWrittenArithmeticPrompt(value: unknown): WrittenArithmeticPrompt | null {
    return parseColumnAdditionPrompt(value) ||
        parseColumnSubtractionPrompt(value) ||
        parseColumnMultiplicationPrompt(value) ||
        parseColumnDivisionPrompt(value);
}

export function createExpectedWrittenArithmeticSubmission(
    value: string | WrittenArithmeticPrompt
): WrittenArithmeticSubmission | null {
    const prompt = typeof value === 'string'
        ? parseWrittenArithmeticPrompt(value)
        : value;
    if (!prompt) return null;
    switch (prompt.kind) {
        case 'column-addition':
            return createExpectedColumnAdditionSubmission(prompt);
        case 'column-subtraction':
            return createExpectedColumnSubtractionSubmission(prompt);
        case 'column-multiplication':
            return createExpectedColumnMultiplicationSubmission(prompt);
        case 'column-division':
            return createExpectedColumnDivisionSubmission(prompt);
        default:
            return null;
    }
}

/** Serializes through the strict concrete-model normalizer. */
export function serializeWrittenArithmeticSubmission(
    value: WrittenArithmeticSubmission
): string {
    if (!isRecord(value)) return '';
    switch (value.kind) {
        case 'column-addition':
            return serializeColumnAdditionSubmission(value);
        case 'column-subtraction':
            return serializeColumnSubtractionSubmission(value);
        case 'column-multiplication':
            return serializeColumnMultiplicationSubmission(value);
        case 'column-division':
            return serializeColumnDivisionSubmission(value);
        default:
            return '';
    }
}

/**
 * Reads the discriminator under one global size bound, then delegates to the
 * matching strict/versioned decoder.  Equation arrays are never accepted.
 */
export function decodeWrittenArithmeticSubmission(
    source: string
): WrittenArithmeticSubmission | null {
    if (typeof source !== 'string') return null;
    const value = source.trim();
    if (!value || value.length > MAX_WRITTEN_ARITHMETIC_SUBMISSION_LENGTH ||
        value[0] !== '{') return null;
    let parsed: unknown;
    try {
        parsed = JSON.parse(value) as unknown;
    } catch (_) {
        return null;
    }
    if (!isRecord(parsed) || typeof parsed.kind !== 'string') return null;
    switch (parsed.kind) {
        case 'column-addition':
            return decodeColumnAdditionSubmission(value);
        case 'column-subtraction':
            return decodeColumnSubtractionSubmission(value);
        case 'column-multiplication':
            return decodeColumnMultiplicationSubmission(value);
        case 'column-division':
            return decodeColumnDivisionSubmission(value);
        default:
            return null;
    }
}

function normalizeSubmission(
    value: string | WrittenArithmeticSubmission
): WrittenArithmeticSubmission | null {
    if (typeof value === 'string') return decodeWrittenArithmeticSubmission(value);
    const serialized = serializeWrittenArithmeticSubmission(value);
    return serialized ? decodeWrittenArithmeticSubmission(serialized) : null;
}

export function composeWrittenArithmeticLatex(
    value: string | WrittenArithmeticSubmission
): string {
    const submission = normalizeSubmission(value);
    if (!submission) return '';
    switch (submission.kind) {
        case 'column-addition':
            return composeColumnAdditionLatex(submission);
        case 'column-subtraction':
            return composeColumnSubtractionLatex(submission);
        case 'column-multiplication':
            return composeColumnMultiplicationLatex(submission);
        case 'column-division':
            return composeColumnDivisionLatex(submission);
    }
}

function serializedAnswer(
    answer: string | WrittenArithmeticSubmission
): string {
    return typeof answer === 'string'
        ? answer
        : serializeWrittenArithmeticSubmission(answer);
}

/** Validates with the model selected by the authored prompt. */
export function validateWrittenArithmeticSubmission(
    promptValue: string | WrittenArithmeticPrompt,
    answer: string | WrittenArithmeticSubmission
): WrittenArithmeticValidation {
    const prompt = typeof promptValue === 'string'
        ? parseWrittenArithmeticPrompt(promptValue)
        : promptValue;
    if (!prompt) {
        return { accepted: false, outcome: 'unknown', reason: 'invalid-prompt' };
    }
    const input = serializedAnswer(answer);
    switch (prompt.kind) {
        case 'column-addition':
            return validateColumnAdditionSubmission(prompt, input);
        case 'column-subtraction':
            return validateColumnSubtractionSubmission(prompt, input);
        case 'column-multiplication':
            return validateColumnMultiplicationSubmission(prompt, input);
        case 'column-division':
            return validateColumnDivisionSubmission(prompt, input);
        default:
            return { accepted: false, outcome: 'unknown', reason: 'invalid-prompt' };
    }
}

/** Number of visible school-layout rows represented by a valid submission. */
export function writtenArithmeticLayoutRowCount(
    value: string | WrittenArithmeticSubmission
): number {
    const submission = normalizeSubmission(value);
    if (!submission) return 0;
    switch (submission.kind) {
        case 'column-addition':
        case 'column-subtraction':
            return submission.layout.rows.length;
        case 'column-multiplication':
            return 'carryMarks' in submission
                ? 2
                : submission.partialProducts.length + 2;
        case 'column-division':
            return submission.steps.length * 2 + 1;
    }
}
