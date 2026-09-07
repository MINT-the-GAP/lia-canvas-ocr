import { parseCalculationStatement, type CalculationStatement } from './calculation-structure.ts';

/** Pure cost preflight, not a domain or equivalence proof. Never invokes a CAS. */
const MAX_LENGTH = 4096;
const MAX_TOKENS = 256;
const MAX_DEPTH = 32;
const MAX_LITERAL_DIGITS = 24;
const MAX_DEGREE = 16;
const MAX_COST = 256;
const MAX_TERMS = 256;
const MAX_RESULT_DIGITS = 384;
const SMALL_INTEGER = 1_000_000;
type Rational = { n: number; d: number };
type Measure = { value: Rational | null; degree: number; cost: number; terms: number; digits: number };

function rational(n: number, d = 1): Rational | null {
    if (!Number.isSafeInteger(n) || !Number.isSafeInteger(d) || !d || Math.abs(n) > SMALL_INTEGER || Math.abs(d) > SMALL_INTEGER) return null;
    let a = Math.abs(n), b = Math.abs(d);
    while (b) [a, b] = [b, a % b];
    const divisor = a || 1;
    return { n: n / divisor * (d < 0 ? -1 : 1), d: Math.abs(d) / divisor };
}
function numeric(token: string): Rational | null {
    const parts = token.split('.');
    return rational(Number(parts.join('')), parts.length === 2 ? 10 ** parts[1].length : 1);
}
function calculated(a: Rational | null, b: Rational | null, operator: string): Rational | null {
    if (!a || !b) return null;
    if (operator === '+') return rational(a.n * b.d + b.n * a.d, a.d * b.d);
    if (operator === '-') return rational(a.n * b.d - b.n * a.d, a.d * b.d);
    if (operator === '*') return rational(a.n * b.n, a.d * b.d);
    return rational(a.n * b.d, a.d * b.n);
}
function bounded(value: Measure): Measure | null {
    return value.degree <= MAX_DEGREE && value.cost <= MAX_COST && value.terms <= MAX_TERMS && value.digits <= MAX_RESULT_DIGITS ? value : null;
}
function joined(a: Measure, b: Measure, operator: string): Measure | null {
    const product = operator === '*' || operator === '/';
    return bounded({
        value: calculated(a.value, b.value, operator),
        degree: product ? a.degree + b.degree : Math.max(a.degree, b.degree),
        cost: a.cost + b.cost + 1,
        terms: product ? a.terms * b.terms : a.terms + b.terms,
        digits: product ? a.digits + b.digits : Math.max(a.digits, b.digits) + 1,
    });
}
function powered(base: Measure, exponent: Measure): Measure | null {
    const value = exponent.value;
    if (!value) return null;
    if (value.n === 1 && value.d === 2) return bounded({ ...base, value: null, cost: base.cost + exponent.cost + 1 });
    if (value.d !== 1 || Math.abs(value.n) > 16) return null;
    const power = Math.max(1, Math.abs(value.n));
    // Exponentiation is only evaluated on tiny integers here, under a fixed
    // exponent bound, to inspect a later nested exponent. No symbolic execution.
    const number = base.value && value.n >= 0
        ? rational(base.value.n ** value.n, base.value.d ** value.n) : null;
    return bounded({ value: number, degree: base.degree * power,
        cost: base.cost * power + exponent.cost + 1,
        terms: base.terms ** power, digits: base.digits * power });
}

const CAS_ARITY: Record<string, readonly number[]> = {
    simplify: [1], rationalize: [1], expand: [1], sqrt: [1], coeff: [3], d: [2, 3], subst: [3],
};
class CostParser {
    private index = 0;
    private depth = 0;
    private readonly tokens: readonly string[];
    private readonly tex: boolean;
    constructor(tokens: readonly string[], tex: boolean) { this.tokens = tokens; this.tex = tex; }
    private peek(): string { return this.tokens[this.index] || ''; }
    private take(): string { return this.tokens[this.index++] || ''; }
    parse(): boolean {
        if (!this.tokens.length || this.tokens.length > MAX_TOKENS) return false;
        const value = this.sequence();
        return value !== null && this.index === this.tokens.length;
    }
    private sequence(): Measure | null {
        let value = this.sum();
        while (value && this.tex && this.peek() === ',') {
            this.take();
            const next = this.sum();
            if (!next) return null;
            value = bounded({ value: null, degree: Math.max(value.degree, next.degree),
                cost: value.cost + next.cost + 1, terms: Math.max(value.terms, next.terms), digits: Math.max(value.digits, next.digits) });
        }
        return value;
    }
    private sum(): Measure | null {
        let left = this.product();
        while (left && (this.peek() === '+' || this.peek() === '-')) {
            const operator = this.take();
            const right = this.product();
            if (!right) return null;
            left = joined(left, right, operator);
        }
        return left;
    }
    private product(): Measure | null {
        let left = this.unary();
        while (left) {
            const next = this.peek();
            const explicit = next === '*' || next === '/';
            const implicit = this.tex && (next === '(' || /^[A-Za-z0-9]/u.test(next));
            if (!explicit && !implicit) break;
            const operator = explicit ? this.take() : '*';
            const right = this.unary();
            if (!right) return null;
            left = joined(left, right, operator);
        }
        return left;
    }
    private unary(): Measure | null {
        if (++this.depth > MAX_DEPTH) return null;
        let value: Measure | null;
        if (this.peek() === '+' || this.peek() === '-') {
            const operator = this.take();
            const inner = this.unary();
            value = inner && bounded({ ...inner, cost: inner.cost + 1,
                value: inner.value ? rational((operator === '-' ? -1 : 1) * inner.value.n, inner.value.d) : null });
        } else {
            value = this.primary();
            if (value && this.peek() === '^') {
                this.take();
                const exponent = this.unary();
                value = exponent ? powered(value, exponent) : null;
            }
        }
        this.depth--;
        return value;
    }
    private primary(): Measure | null {
        const token = this.take();
        if (/^\d+(?:\.\d+)?$/u.test(token)) {
            const digits = token.replace('.', '').length;
            return digits <= MAX_LITERAL_DIGITS ? { value: numeric(token), degree: 0, cost: 1, terms: 1, digits } : null;
        }
        if (token === '(') {
            const value = this.sequence();
            return this.take() === ')' ? value : null;
        }
        if (!/^[A-Za-z][A-Za-z0-9_]*$/u.test(token)) return null;
        if (this.peek() !== '(' || (this.tex && !CAS_ARITY[token])) return { value: null, degree: 1, cost: 1, terms: 1, digits: 0 };
        const arities = CAS_ARITY[token];
        if (!arities) return null;
        this.take();
        const args: Measure[] = [];
        for (;;) {
            const arg = this.sum();
            if (!arg) return null;
            args.push(arg);
            if (this.peek() !== ',') break;
            this.take();
            if (args.length >= 3) return null;
        }
        if (this.take() !== ')' || !arities.includes(args.length)) return null;
        if ((token === 'coeff' || token === 'd') && args.length === 3) {
            const order = args[2].value;
            if (!order || order.d !== 1 || order.n < 0 || order.n > 16) return null;
        }
        const cost = args.reduce((sum, arg) => sum + arg.cost, 1);
        const arg = args[0];
        if (token === 'subst') {
            const target = args[2];
            return bounded({ value: null, degree: target.degree * Math.max(1, arg.degree),
                cost: cost + arg.cost * target.cost,
                terms: target.terms * arg.terms ** target.degree,
                digits: target.digits + arg.digits * target.degree });
        }
        return bounded({ ...arg, cost, value: token === 'sqrt' ? null : arg.value });
    }
}

function casTokens(source: string): string[] | null {
    const compact = source.replace(/\s+/gu, '');
    const tokens = compact.match(/[A-Za-z][A-Za-z0-9_]*|\d+(?:\.\d+)?|[()+\-*/^,]/gu) || [];
    return tokens.join('') === compact ? tokens : null;
}

const TEX_ATOMS = new Set(('alpha beta gamma delta epsilon varepsilon zeta eta theta vartheta iota kappa lambda mu nu xi pi varpi rho varrho sigma varsigma tau upsilon phi varphi chi psi omega Gamma Delta Theta Lambda Xi Pi Sigma Upsilon Phi Psi Omega infty emptyset varnothing sin cos tan cot ln log arcsin arccos arctan').split(' '));
const TEX_WRAPPERS = new Set(('mathrm mathbf mathit mathsf mathtt mathcal mathbb mathds boldsymbol operatorname vec hat bar tilde overline underline').split(' '));
const TEX_SPACING = new Set(('quad qquad enspace thinspace medspace thickspace displaystyle textstyle scriptstyle scriptscriptstyle').split(' '));

function texTokens(source: string): string[] | null {
    let text = source.trim();
    for (const [open, close] of [['$$', '$$'], ['$', '$'], ['\\[', '\\]'], ['\\(', '\\)']]) {
        if (text.startsWith(open) && text.endsWith(close)) { text = text.slice(open.length, -close.length); break; }
    }
    const raw = text.match(/\\[A-Za-z]+|\\[^\r\n]|\d+(?:[.,]\d+)?|[^\s]/gu) || [];
    if (raw.length > MAX_TOKENS) return null;
    const output: string[] = [];
    const stack: string[] = [];
    const environments: string[] = [];
    const braces = (start: number): { content: string[]; end: number } | null => {
        if (raw[start] !== '{') return null;
        let depth = 1;
        for (let index = start + 1; index < raw.length; index++) {
            if (raw[index] === '{' && ++depth > MAX_DEPTH) return null;
            if (raw[index] === '}' && --depth === 0) return { content: raw.slice(start + 1, index), end: index + 1 };
        }
        return null;
    };
    const push = (close: string): boolean => { stack.push(close); output.push('('); return stack.length + environments.length <= MAX_DEPTH; };
    for (let index = 0; index < raw.length; index++) {
        const token = raw[index];
        if (/^\d/u.test(token)) {
            if (token.replace(/[.,]/gu, '').length > MAX_LITERAL_DIGITS) return null;
            output.push(token.replace(',', '.')); continue;
        }
        if (/^[A-Za-z]$/u.test(token)) { output.push(token); continue; }
        if (token === '_') {
            const grouped = braces(index + 1);
            const content = grouped?.content || [raw[index + 1]];
            if (!content.length || content.some(part => !part || /[\^=]/u.test(part) || (/^\d/u.test(part) && part.length > MAX_LITERAL_DIGITS))) return null;
            index = grouped ? grouped.end - 1 : index + 1;
            continue;
        }
        if (token === '\\left' || token === '\\right') {
            const delimiter = raw[++index];
            if (!delimiter || !['(', ')', '[', ']', '\\{', '\\}', '.', '|', '\\vert', '\\lvert', '\\rvert'].includes(delimiter)) return null;
            if (token === '\\left') { if (!push('right')) return null; }
            else { if (stack.pop() !== 'right') return null; output.push(')'); }
            continue;
        }
        if (token === '{' || token === '(' || token === '[' || token === '\\{') {
            if (!push(token === '{' ? '}' : token === '(' ? ')' : token === '[' ? ']' : '\\}')) return null;
            continue;
        }
        if (token === '}' || token === ')' || token === ']' || token === '\\}') {
            if (stack.pop() !== token) return null;
            output.push(')'); continue;
        }
        if (['+', '-', '*', '/', '^'].includes(token)) { output.push(token); continue; }
        if (token === ':') { output.push('/'); continue; }
        if (token === '−') { output.push('-'); continue; }
        if (token === '·' || token === '×') { output.push('*'); continue; }
        if (token === '÷') { output.push('/'); continue; }
        if (token === '±' || token === '∓') { output.push('+'); continue; }
        if (['=', ';', ',', '|', '<', '>', '≤', '≥', '≠', '∈'].includes(token)) { output.push(','); continue; }
        if (token === '&' || token === '~' || token === String.fromCharCode(39) || ['⇒', '→', '⟹', '⟶', '⇔', '⟺'].includes(token)) continue;
        if (!token.startsWith('\\')) return null;
        const command = token.slice(1);
        if (TEX_SPACING.has(command) || [',', ';', '!', ':', ' '].includes(command)) continue;
        if (command === 'cdot' || command === 'times') { output.push('*'); continue; }
        if (command === 'div') { output.push('/'); continue; }
        if (command === 'pm' || command === 'mp') { output.push('+'); continue; }
        if (command === 'prime') continue;
        if (command === '\\') { output.push(','); continue; }
        if (['mid', 'in', 'notin', 'neq', 'ne', 'le', 'leq', 'ge', 'geq', 'setminus'].includes(command)) { output.push(','); continue; }
        if (['Rightarrow', 'Longrightarrow', 'rightarrow', 'longrightarrow', 'implies', 'Leftrightarrow', 'Longleftrightarrow', 'iff', 'to', 'Rarr'].includes(command)) continue;
        if (command === 'begin' || command === 'end') {
            const group = braces(index + 1);
            if (!group) return null;
            const environment = group.content.join('');
            if (!['cases', 'aligned', 'array'].includes(environment)) return null;
            index = group.end - 1;
            if (command === 'begin') {
                environments.push(environment); output.push('(');
                if (environments.length + stack.length > MAX_DEPTH) return null;
                if (environment === 'array') {
                    const columns = braces(index + 1);
                    if (!columns || !/^[lcr|]+$/u.test(columns.content.join(''))) return null;
                    index = columns.end - 1;
                }
            } else {
                if (environments.pop() !== environment) return null;
                output.push(')');
            }
            continue;
        }
        if (command === 'frac' || command === 'dfrac' || command === 'tfrac') {
            const numerator = braces(index + 1);
            const denominator = numerator && braces(numerator.end);
            if (!numerator || !denominator) return null;
            // Parenthesize the complete fraction, so a following power applies
            // to both numerator and denominator when it is itself an exponent.
            raw[index] = '(';
            raw.splice(denominator.end, 0, ')');
            raw.splice(numerator.end, 0, '/');
            index--;
            continue;
        }
        if (command === 'sqrt') {
            if (raw[index + 1] === '[') {
                const root = raw[index + 2];
                if (!/^\d+$/u.test(root || '') || Number(root) < 1 || Number(root) > 16 || raw[index + 3] !== ']') return null;
                index += 3;
            }
            if (raw[index + 1] !== '{') {
                const atom = raw[index + 1] || '';
                if (!/^[A-Za-z0-9]$/u.test(atom) && !(atom.startsWith('\\') && TEX_ATOMS.has(atom.slice(1)))) return null;
                raw.splice(index + 2, 0, ')');
                raw.splice(index + 1, 0, '(');
            }
            output.push('sqrt'); continue;
        }
        if (command === 'text' || command === 'mbox') {
            const group = braces(index + 1);
            if (!group) return null;
            index = group.end - 1;
            continue;
        }
        if (TEX_WRAPPERS.has(command)) continue;
        if (TEX_ATOMS.has(command)) { output.push('tex_' + command); continue; }
        return null;
    }
    return stack.length || environments.length ? null : output;
}

/** TeX preflight for one expression, equation, root set or explicitly grouped row. */
export function isCalculationProofInputBounded(sourceTex: string): boolean {
    if (typeof sourceTex !== 'string' || !sourceTex.trim() || sourceTex.length > MAX_LENGTH) return false;
    if ((sourceTex.match(/\d+(?:[.,]\d+)?/gu) || []).some(number => number.replace(/[.,]/gu, '').length > MAX_LITERAL_DIGITS)) return false;
    const statement = parseCalculationStatement(sourceTex);
    const payload = (item: CalculationStatement): string => {
        if (item.kind === 'label') return '1';
        if (item.kind === 'group') return item.members.map(payload).join(';');
        if (item.kind === 'equation' || item.kind === 'equality-chain') {
            const equation = item.kind === 'equation' ? item.left + '=' + item.right : item.operands.join('=');
            return equation + (item.operation ? ';1' + item.operation : '');
        }
        return item.source;
    };
    const tokens = texTokens(payload(statement));
    return tokens !== null && new CostParser(tokens, true).parse();
}

/** CAS expression/call preflight. Variable denominators are deliberately allowed. */
export function isCalculationCasInputBounded(cas: string): boolean {
    if (typeof cas !== 'string' || !cas.trim() || cas.length > MAX_LENGTH) return false;
    const tokens = casTokens(cas);
    return tokens !== null && new CostParser(tokens, false).parse();
}
