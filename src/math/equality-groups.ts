/** Interpret only a standalone top-level { = } as an equality separator.
 * Argument groups, scripts, visible delimiters and nested groups stay opaque.
 * This is a parser aid: callers retain the original source for display/storage.
 */
export type GroupedEquality = { start: number; end: number; equality: number };
const MAX_SOURCE = 16_384;
const MAX_DEPTH = 32;
const ARGUMENTS: Record<string, number> = {
    frac: 2, dfrac: 2, tfrac: 2, binom: 2, dbinom: 2, tbinom: 2,
    text: 1, mbox: 1, hbox: 1, mathrm: 1, mathbf: 1, mathit: 1,
    mathsf: 1, mathtt: 1, mathcal: 1, mathbb: 1, operatorname: 1,
    overline: 1, underline: 1, vec: 1, overrightarrow: 1, hat: 1,
    bar: 1, dot: 1, ddot: 1, phantom: 1, hphantom: 1, vphantom: 1,
    overset: 2, underset: 2, stackrel: 2, not: 1,
};
const ATOMIC_COMMAND = /^(?:alpha|beta|gamma|delta|epsilon|varepsilon|zeta|eta|theta|vartheta|iota|kappa|lambda|mu|nu|xi|pi|varpi|rho|varrho|sigma|varsigma|tau|upsilon|phi|varphi|chi|psi|omega|Gamma|Delta|Theta|Lambda|Xi|Pi|Sigma|Upsilon|Phi|Psi|Omega|cdot|times|div|pm|mp|le|leq|ge|geq|ne|neq|approx|equiv|in|notin|infty|emptyset|varnothing|mid|sin|cos|tan|cot|arcsin|arccos|arctan|sinh|cosh|tanh|ln|log|exp|quad|qquad|enspace|thinspace|medspace|thickspace|Rightarrow|Longrightarrow|rightarrow|longrightarrow|Leftrightarrow|Longleftrightarrow|implies|iff|Rarr|to)$/;

export function findTopLevelGroupedEqualities(source: string): GroupedEquality[] {
    if (source.length > MAX_SOURCE || /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f%$]/u.test(source)) return [];
    const ranges: GroupedEquality[] = [];
    const whitespace = (start: number): number => {
        while (start < source.length && /\s/u.test(source[start])) start++;
        return start;
    };
    const commandEnd = (start: number): number => {
        const match = /^\\(?:[A-Za-z]+|[^\r\n])/u.exec(source.slice(start));
        return match ? start + match[0].length : -1;
    };
    const groupEnd = (start: number): number => {
        const closing: Record<string, string> = { '{': '}', '(': ')', '[': ']', '\\{': '\\}' };
        const open = source.startsWith('\\{', start) ? '\\{' : source[start];
        const stack = [closing[open]];
        if (!stack[0]) return -1;
        for (let index = start + open.length; index < source.length;) {
            let token = source[index], end = index + 1;
            if (token === '\\') {
                end = commandEnd(index);
                if (end < 0) return -1;
                token = source.slice(index, end);
            }
            if (closing[token]) {
                if (stack.push(closing[token]) > MAX_DEPTH) return -1;
            } else if (token === '}' || token === ')' || token === ']' || token === '\\}') {
                if (stack.pop() !== token) return -1;
                if (!stack.length) return end;
            }
            index = end;
        }
        return -1;
    };
    const atomEnd = (start: number, depth: number): number => {
        if (depth > MAX_DEPTH) return -1;
        start = whitespace(start);
        if (start >= source.length) return -1;
        if ('{(['.includes(source[start]) || source.startsWith('\\{', start)) return groupEnd(start);
        if ('})]'.includes(source[start]) || source.startsWith('\\}', start)) return -1;
        if (source[start] !== '\\') return start + 1;
        let end = commandEnd(start);
        if (end < 0) return -1;
        const command = source.slice(start + 1, end);
        if (command === 'sqrt') {
            end = whitespace(end);
            if (source[end] === '[') end = groupEnd(end);
            return end < 0 ? -1 : atomEnd(end, depth + 1);
        }
        const arity = ARGUMENTS[command];
        if (arity !== undefined) {
            for (let argument = 0; argument < arity && end >= 0; argument++) end = atomEnd(end, depth + 1);
            return end;
        }
        // Unknown macros can own further arguments. Do not guess their extent.
        // Sized/invisible delimiters and environments are left to their parsers.
        return ATOMIC_COMMAND.test(command) || /^[,;! :\\]$/u.test(command) ? end : -1;
    };
    for (let index = 0; index < source.length;) {
        index = whitespace(index);
        if (index >= source.length) break;
        const ch = source[index];
        if (ch === '^' || ch === '_') {
            index = atomEnd(index + 1, 1);
            if (index < 0) return [];
            continue;
        }
        // A vertical bar is safe here only as an explicit side operation.
        if (ch === '|' && !/^(?:[+\-:/*]|\\(?:cdot|times|div)(?![A-Za-z]))/u.test(source.slice(index + 1).trim())) return [];
        const end = atomEnd(index, 0);
        if (end < 0) return [];
        if (ch === '{' && /^\{\s*=\s*\}$/u.test(source.slice(index, end))) {
            ranges.push({ start: index, end, equality: source.indexOf('=', index) });
        }
        index = end;
    }
    return ranges;
}

export function normalizeTopLevelEqualityGroups(source: string): string {
    const ranges = findTopLevelGroupedEqualities(source);
    if (!ranges.length) return source;
    let result = '', start = 0;
    for (const range of ranges) {
        result += source.slice(start, range.start) + '=';
        start = range.end;
    }
    return result + source.slice(start);
}
