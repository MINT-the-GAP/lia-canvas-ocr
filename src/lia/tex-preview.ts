// Pure formatting helpers for the KaTeX answer preview.

const SIMPLE_INTEGER_FRACTION = /^([+-]?\d+)\s*\/\s*([+-]?\d+)$/u;

/**
 * Makes a complete, unambiguous integer fraction easier to read in the
 * inline KaTeX preview. The original answer value is deliberately untouched.
 */
export function formatTexForPreview(input: string): string {
    const source = String(input ?? '').trim();
    const match = SIMPLE_INTEGER_FRACTION.exec(source);
    if (!match) return source;
    return `\\dfrac{${match[1]}}{${match[2]}}`;
}
