type Token = {
    value: string;
    kind: 'command' | 'character' | 'space' | 'protected';
    pair?: number;
};

const TEXT_COMMANDS = new Set([
    '\\text', '\\textrm', '\\textnormal', '\\textup', '\\textit', '\\textsl',
    '\\textsc', '\\textbf', '\\textmd', '\\textsf', '\\texttt', '\\mbox',
    '\\hbox', '\\operatorname',
]);
const VECTOR_COMMANDS = new Set([
    '\\vec', '\\overrightarrow', '\\overleftarrow', '\\overleftrightarrow',
    // Bold symbols can denote vectors. Preserve a cross here rather than
    // guessing whether the author meant a scalar product.
    '\\mathbf', '\\boldsymbol', '\\bm',
]);
const MATRIX_ENVIRONMENTS = new Set([
    'matrix', 'pmatrix', 'bmatrix', 'Bmatrix', 'vmatrix', 'Vmatrix',
    'smallmatrix', 'array',
]);
const SPACING_COMMANDS = new Set([
    '\\,', '\\:', '\\;', '\\!', '\\ ', '\\quad', '\\qquad', '\\enspace',
    '\\thinspace', '\\medspace', '\\thickspace', '\\left', '\\right',
    '\\big', '\\Big', '\\bigg', '\\Bigg', '\\bigl', '\\bigr',
    '\\Bigl', '\\Bigr', '\\biggl', '\\biggr', '\\Biggl', '\\Biggr',
]);

function protectedGroupEnd(input: string, start: number): number {
    let depth = 0;
    for (let i = start; i < input.length; i++) {
        if (input[i] === '\\') { i++; continue; }
        if (input[i] === '{') depth++;
        if (input[i] === '}' && --depth === 0) return i + 1;
    }
    // An unfinished text argument remains text, including its final symbols.
    return input.length;
}


function skipArgumentTrivia(input: string, start: number): number {
    while (start < input.length) {
        if (/\s/.test(input[start])) start++;
        else if (input[start] === '%') {
            const newline = input.indexOf('\n', start);
            start = newline < 0 ? input.length : newline;
        } else break;
    }
    return start;
}

function tokenize(input: string): Token[] {
    const tokens: Token[] = [];
    const stack: number[] = [];
    const closing: Record<string, string> = { '}': '{', ')': '(', ']': '[', '\\}': '\\{' };
    for (let i = 0; i < input.length;) {
        const start = i;
        let kind: Token['kind'] = 'character';
        if (input[i] === '%') {
            const newline = input.indexOf('\n', i);
            i = newline < 0 ? input.length : newline;
            kind = 'protected';
        } else if (input[i] === '\\') {
            i++;
            if (/[a-zA-Z]/.test(input[i] || '')) {
                while (i < input.length && /[a-zA-Z]/.test(input[i])) i++;
            } else if (i < input.length) i++;
            kind = 'command';
            const command = input.slice(start, i);
            if (TEXT_COMMANDS.has(command)) {
                let argument = skipArgumentTrivia(input, i);
                if (command === '\\operatorname' && input[argument] === '*') argument++;
                argument = skipArgumentTrivia(input, argument);
                if (input[argument] === '{') {
                    i = protectedGroupEnd(input, argument);
                    kind = 'protected';
                }
            } else if (command === '\\verb') {
                if (input[i] === '*') i++;
                if (i < input.length) {
                    const end = input.indexOf(input[i], i + 1);
                    i = end < 0 ? input.length : end + 1;
                    kind = 'protected';
                }
            }
        } else if (/\s/.test(input[i])) {
            while (i < input.length && /\s/.test(input[i])) i++;
            kind = 'space';
        } else i++;
        const token: Token = { value: input.slice(start, i), kind };
        const index = tokens.length;
        tokens.push(token);
        if (['{', '(', '[', '\\{'].includes(token.value)) stack.push(index);
        else if (closing[token.value]) {
            const opener = stack[stack.length - 1];
            if (opener !== undefined && tokens[opener].value === closing[token.value]) {
                stack.pop();
                token.pair = opener;
                tokens[opener].pair = index;
            }
        }
    }
    return tokens;
}


// Ungrouped TeX arguments consume one token, not the following digit run:
// \\frac 1 3 is a fraction and x^1 3 is x to the first power followed by 3.
const TWO_ARGUMENT_COMMANDS = new Set([
    '\\frac', '\\dfrac', '\\tfrac', '\\binom', '\\dbinom', '\\tbinom',
    '\\overset', '\\underset', '\\stackrel', '\\textcolor',
]);
const ONE_ARGUMENT_COMMANDS = new Set([
    ...TEXT_COMMANDS, ...VECTOR_COMMANDS,
    '\\sqrt', '\\mathrm', '\\mathit', '\\mathsf', '\\mathtt', '\\mathnormal',
    '\\mathcal', '\\mathbb', '\\mathfrak', '\\hat', '\\widehat', '\\bar',
    '\\overline', '\\underline', '\\tilde', '\\widetilde', '\\dot', '\\ddot',
    '\\boxed', '\\overbrace', '\\underbrace', '\\phantom', '\\hphantom', '\\vphantom',
    '\\smash', '\\mathop', '\\mathord', '\\mathbin', '\\mathrel', '\\mathopen',
    '\\mathclose', '\\mathpunct', '\\mathinner',
]);

/**
 * Join OCR-split digits in math before sending TeX to a native quiz validator.
 * Only ordinary source whitespace between digits is removed. Commands, text,
 * comments, variables, explicit spacing/products and TeX argument boundaries
 * retain their meaning; this is deliberately not a general whitespace cleanup.
 */
export function normalizeOcrTexNumbers(input: string): string {
    if (!/[0-9]\s+[0-9]/.test(input)) return input;
    const tokens = tokenize(input);
    const argumentEnds = new Set<number>();
    const skipSpace = (start: number): number => {
        while (tokens[start]?.kind === 'space'
            || (tokens[start]?.kind === 'protected' && tokens[start].value.startsWith('%'))) start++;
        return start;
    };
    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        if (token.kind === 'protected') continue;
        let count = TWO_ARGUMENT_COMMANDS.has(token.value) ? 2
            : ONE_ARGUMENT_COMMANDS.has(token.value) || token.value === '^' || token.value === '_' ? 1 : 0;
        let argument = skipSpace(i + 1);
        if (token.value === '\\sqrt' && tokens[argument]?.value === '[') {
            const end = tokens[argument].pair;
            if (end === undefined) continue;
            argument = skipSpace(end + 1);
        }
        while (count-- > 0 && argument < tokens.length) {
            const next = tokens[argument];
            if (next.value === '{') {
                if (next.pair === undefined) break;
                argument = skipSpace(next.pair + 1);
            } else {
                argumentEnds.add(argument);
                argument = skipSpace(argument + 1);
            }
        }
    }
    return tokens.map((token, index) => {
        const left = tokens[index - 1];
        const right = tokens[index + 1];
        return token.kind === 'space' && !argumentEnds.has(index - 1)
            && left?.kind === 'character' && /^[0-9]$/.test(left.value)
            && right?.kind === 'character' && /^[0-9]$/.test(right.value)
            ? '' : token.value;
    }).join('');
}

function neighbor(tokens: Token[], index: number, direction: -1 | 1): number {
    while (index >= 0 && index < tokens.length) {
        const token = tokens[index];
        if (token.kind !== 'space' && token.value !== '~' && !SPACING_COMMANDS.has(token.value)) break;
        index += direction;
    }
    return index;
}

function isMatrixEnvironment(tokens: Token[], commandIndex: number): boolean {
    const command = tokens[commandIndex]?.value;
    if (command !== '\\begin' && command !== '\\end') return false;
    const start = neighbor(tokens, commandIndex + 1, 1);
    const group = tokens[start];
    if (group?.value !== '{' || group.pair === undefined) return false;
    const name = tokens.slice(start + 1, group.pair).map(token => token.value).join('');
    return MATRIX_ENVIRONMENTS.has(name);
}

function containsVectorNotation(tokens: Token[], start: number, end: number): boolean {
    for (let i = start; i <= end; i++) {
        if (VECTOR_COMMANDS.has(tokens[i].value) || isMatrixEnvironment(tokens, i)) return true;
    }
    return false;
}

function hasVectorOperand(tokens: Token[], start: number, direction: -1 | 1): boolean {
    let index = neighbor(tokens, start, direction);
    while (index >= 0 && index < tokens.length) {
        const token = tokens[index];
        if (VECTOR_COMMANDS.has(token.value) || isMatrixEnvironment(tokens, index)) return true;
        if (direction === 1) {
            if (token.pair !== undefined && token.pair > index) {
                return containsVectorNotation(tokens, index + 1, token.pair - 1);
            }
            return false;
        }

        const operandStart = token.pair !== undefined && token.pair < index ? token.pair : index;
        const before = neighbor(tokens, operandStart - 1, -1);
        const prefix = tokens[before]?.value;
        // A subscript/superscript belongs to the preceding operand. Walk past
        // it so that both \\vec{a}_1 and \\vec{a}^{(2)} retain their cross.
        if (prefix === '^' || prefix === '_') {
            index = neighbor(tokens, before - 1, -1);
            continue;
        }
        if (VECTOR_COMMANDS.has(prefix) || isMatrixEnvironment(tokens, before)) return true;
        return operandStart < index && containsVectorNotation(tokens, operandStart + 1, index - 1);
    }
    return false;
}

// These separators bound a numeric operand. Adjacent letters, commands or
// groups can extend it (2\\vec{b}, 2x, {2}\\vec{b}), so stay conservative there.
const NUMERIC_BOUNDARIES = new Set([
    '+', '-', '=', '<', '>', '&', ';', '|', '/', ':', '×', '÷',
    '\\times', '\\cdot', '\\div', '\\pm', '\\mp', '\\le', '\\leq',
    '\\ge', '\\geq', '\\neq', '\\approx', '\\equiv', '\\mid',
    '\\Rightarrow', '\\Leftrightarrow', '\\to', '\\implies', '\\iff', '\\\\',
]);
const NUMERIC_LITERAL = /^[+-]?(?:[0-9]+(?:[.,][0-9]*)?|[.,][0-9]+)$/;

function isNumericFactor(tokens: Token[], start: number, direction: -1 | 1): boolean {
    let index = neighbor(tokens, start, direction);
    if (direction === 1 && (tokens[index]?.value === '+' || tokens[index]?.value === '-')) {
        index = neighbor(tokens, index + 1, 1);
    }
    const token = tokens[index];
    if (!token) return false;
    let value = '';
    if (token.pair !== undefined && (token.pair - index) * direction > 0) {
        const first = Math.min(index, token.pair);
        const last = Math.max(index, token.pair);
        value = tokens.slice(first + 1, last).map(part => part.value).join('').replace(/\s/g, '');
        index = neighbor(tokens, token.pair + direction, direction);
    } else {
        while (tokens[index]?.kind === 'character' && /^[0-9.,]$/.test(tokens[index].value)) {
            value = direction === 1 ? value + tokens[index].value : tokens[index].value + value;
            index = neighbor(tokens, index + direction, direction);
        }
    }
    if (!NUMERIC_LITERAL.test(value)) return false;
    const adjacent = tokens[index]?.value;
    return adjacent === undefined || NUMERIC_BOUNDARIES.has(adjacent)
        || (direction === 1 ? ['}', ')', ']'].includes(adjacent) : ['{', '(', '['].includes(adjacent));
}
/**
 * Normalize recognized calculation notation without repairing mathematical
 * content: scalar multiplication uses \\cdot and division uses a colon.
 * Explicit adjacent vector/bold/matrix notation keeps a cross conservatively.
 * This does not infer vector types from variable names or validate a product.
 * TeX text arguments, comments, existing \\cdot and the variable x are untouched.
 */
export function normalizeCalculationNotation(input: string): string {
    if (!input || !/[×÷]|\\(?:times|div)(?![a-zA-Z])/.test(input)) return input;
    const tokens = tokenize(input);
    return tokens.map((token, index) => {
        if (token.kind === 'protected') return token.value;
        if (token.value === '\\div' || token.value === '÷') return ':';
        if (token.value !== '\\times' && token.value !== '×') return token.value;
        const leftVector = hasVectorOperand(tokens, index - 1, -1);
        const rightVector = hasVectorOperand(tokens, index + 1, 1);
        // Only a complete numeric factor proves scalar multiplication. A
        // leading number in 2\\vec{b} is part of a scaled vector operand.
        const numericFactor = (!leftVector && isNumericFactor(tokens, index - 1, -1))
            || (!rightVector && isNumericFactor(tokens, index + 1, 1));
        const vectorProduct = (leftVector || rightVector) && !numericFactor;
        const replacement = vectorProduct ? '\\times' : '\\cdot';
        // Unicode multiplication can directly precede a letter. Do not turn
        // 2×x into the unrelated TeX command \\cdotx.
        return replacement + (/^[a-zA-Z]/.test(tokens[index + 1]?.value || '') ? ' ' : '');
    }).join('');
}
