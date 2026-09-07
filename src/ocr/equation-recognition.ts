// A failed part must never become a complete-looking equation by concatenation.
// This is a conservative TeX structure check, not a mathematical validator.
const RELATIONS_OR_LAYOUT = /[=<>|&$%\n\r\u2260\u2264\u2265\u2248\u2261]|\\(?:begin|end|mid|vert|Vert|lvert|rvert|leftarrow|rightarrow|to|mapsto|implies|iff|le|leq|ge|geq|ne|neq|equiv|approx|sim|simeq|in|notin|text|mbox|hbox|verb)\b|\\\\/;
const CLOSING: Record<string, string> = { '}': '{', ')': '(', ']': '[', '\\}': '\\{' };
const OPENING = new Set(['{', '(', '[', '\\{']);
const SPACING = new Set(['\\,', '\\;', '\\:', '\\!', '\\ ', '\\quad', '\\qquad', '\\enspace', '~']);
const DELIMITER_SIZE = /^\\(?:left|right|big|Big|bigg|Bigg|bigl|bigr|Bigl|Bigr|biggl|biggr|Biggl|Biggr)$/;
const MISSING_SCRIPT_BASE = /^[+\-*/=:,;.^_\\]$|^\\(?:cdot|times|div|pm|mp)$/;
const unfinishedEnd = (token: string): boolean => /^[+\-*/=:,;.^_\\]$/.test(token)
    || /^\\(?:cdot|times|div|pm|mp|frac|dfrac|tfrac|sqrt|sin|cos|tan|ln|log|arcsin|arccos|arctan|left|right)$/.test(token);


export function isCompleteOcrEquationPart(value: string): boolean {
    const source = String(value || '').trim();
    if (!source || source.length > 4096 || RELATIONS_OR_LAYOUT.test(source) || source.includes('\uFFFD')) return false;
    const tokens = source.match(/\\[a-zA-Z]+|\\.|[^\s]/g) || [];
    const stack: string[] = [];
    let leftRightDepth = 0;
    let previousContent = '';
    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        // Check at every nesting depth, before a closing brace can hide an
        // orphan exponent/index inside an apparently balanced operand.
        if ((token === '^' || token === '_') && (!previousContent ||
            OPENING.has(previousContent) || MISSING_SCRIPT_BASE.test(previousContent))) return false;
        if (token === '\\left') leftRightDepth++;
        if (token === '\\right' && --leftRightDepth < 0) return false;
        if (OPENING.has(token)) stack.push(token);
        else if (CLOSING[token]) {
            if (stack.pop() !== CLOSING[token] || unfinishedEnd(previousContent) || OPENING.has(previousContent)) return false;
        }
        if (!SPACING.has(token) && !DELIMITER_SIZE.test(token)) previousContent = token;
    }
    if (stack.length || leftRightDepth) return false;
    const meaningful = tokens.filter(token => !SPACING.has(token));
    const first = meaningful[0] || '';
    if (/^[*/=,:;.^_]/.test(first) || /^\\(?:cdot|times|div)$/.test(first)) return false;
    const last = meaningful[meaningful.length - 1] || '';
    if (!last || unfinishedEnd(last)) return false;
    if (!/[a-zA-Z0-9]/.test(source)) return false;

    // Require complete braced arguments for structure-bearing commands.
    // Unusual but legal abbreviated TeX takes the whole-line path instead.
    const groupEnd = (start: number): number => {
        if (tokens[start] !== '{' || tokens[start + 1] === '}') return -1;
        let depth = 0;
        for (let i = start; i < tokens.length; i++) {
            if (tokens[i] === '{') depth++;
            if (tokens[i] === '}' && --depth === 0) return i + 1;
        }
        return -1;
    };
    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        if (token === '^' || token === '_') {
            const next = tokens[i + 1] || '';
            if (!next || /^[+\-*/=,;.^_\]}]$/.test(next) || (next === '{' && groupEnd(i + 1) < 0)) return false;
        }
        if (/^\\(?:frac|dfrac|tfrac|binom)$/.test(token)) {
            const numeratorEnd = groupEnd(i + 1);
            if (numeratorEnd < 0 || groupEnd(numeratorEnd) < 0) return false;
        }
        if (token === '\\sqrt') {
            let start = i + 1;
            if (tokens[start] === '[') {
                let depth = 1;
                start++;
                if (tokens[start] === ']') return false;
                while (start < tokens.length && depth) {
                    if (tokens[start] === '[') depth++;
                    if (tokens[start] === ']') depth--;
                    start++;
                }
                if (depth) return false;
            }
            if (groupEnd(start) < 0) return false;
        }
    }
    return true;
}

/** Join only complete operands around the equality signs observed in the ink. */
export function composeOcrEquationChunks(parts: readonly string[], leadingEqualityContext = false): string | null {
    // In context mode every crop after the first includes its observed leading
    // equality. Remove only that one boundary token, never an internal relation.
    const operands = parts.map((part, index) => {
        const text = part.trim();
        return leadingEqualityContext && index > 0 && text.startsWith('=')
            ? text.slice(1).trim() : text;
    });
    if (operands.length < 2 || operands.length > 4 || !operands.every(isCompleteOcrEquationPart)) return null;
    return operands.join(' = ');
}
