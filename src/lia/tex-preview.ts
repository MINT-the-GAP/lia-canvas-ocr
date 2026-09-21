// Pure formatting helpers for the KaTeX answer preview.

import { composeMultilineLatex } from '../ocr/layout.ts';
import { MAX_CALCULATION_ANSWER_LENGTH } from '../math/equivalence.ts';
import {
    MAX_WRITTEN_ARITHMETIC_SUBMISSION_LENGTH,
    composeWrittenArithmeticLatex,
    decodeWrittenArithmeticSubmission
} from '../math/written-arithmetic.ts';

const SIMPLE_INTEGER_FRACTION = /^([+-]?\d+)\s*\/\s*([+-]?\d+)$/u;
const MAX_PREVIEW_CALCULATION_LINES = 34;

function calculationLinesFromJson(source: string): string[] | null {
    if (!source.startsWith('[')) return null;
    try {
        const parsed: unknown = JSON.parse(source);
        if (!Array.isArray(parsed) || parsed.length < 1 ||
            parsed.length > MAX_PREVIEW_CALCULATION_LINES ||
            !parsed.every(line => typeof line === 'string')) return null;
        const lines = parsed.map(line => line.trim()).filter(Boolean);
        return lines.length === parsed.length ? lines : null;
    } catch (_) {
        return null;
    }
}

function formatCasPowersForPreview(source: string): string {
    if (!source.includes('^(')) return source;
    let formatted = '';
    for (let i = 0; i < source.length; i++) {
        if (source[i] !== '^' || source[i + 1] !== '(') {
            formatted += source[i];
            continue;
        }
        let depth = 1;
        let end = i + 2;
        while (end < source.length && depth > 0) {
            if (source[end] === '(') depth++;
            if (source[end] === ')') depth--;
            end++;
        }
        if (depth !== 0) {
            formatted += source[i];
            continue;
        }
        const exponent = formatCasPowersForPreview(source.slice(i + 2, end - 1));
        formatted += '^{' + exponent + '}';
        i = end - 1;
    }
    return formatted;
}

/**
 * Makes a complete, unambiguous integer fraction easier to read in the
 * inline KaTeX preview. The original answer value is deliberately untouched.
 */
export function formatTexForPreview(input: string): string {
    const source = String(input ?? '').trim();
    if (source.length > MAX_WRITTEN_ARITHMETIC_SUBMISSION_LENGTH) return '';
    const writtenArithmetic = decodeWrittenArithmeticSubmission(source);
    if (writtenArithmetic) return composeWrittenArithmeticLatex(writtenArithmetic);
    // A larger bound is reserved for a successfully decoded, structured
    // multiplication/division object.  Plain TeX and equation arrays retain
    // their original conservative preview limit.
    if (source.length > MAX_CALCULATION_ANSWER_LENGTH) return '';
    const calculationLines = calculationLinesFromJson(source);
    if (calculationLines) return composeMultilineLatex(calculationLines);
    const match = SIMPLE_INTEGER_FRACTION.exec(source);
    if (!match) return formatCasPowersForPreview(source);
    return `\\dfrac{${match[1]}}{${match[2]}}`;
}
