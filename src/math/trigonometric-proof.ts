import { calculationProofTools as shared, type Proof } from './equivalence.ts';
import type { FunctionContext, FunctionEquationModel, RealSolutionSet } from './function-proof-types.ts';

/** Exact, bounded school trigonometry: rational affine arguments, exact special
 * angles and rational/pi interval boundaries. No numeric root search. */
type Rational = { n: bigint; d: bigint };
type PiScalar = { rational: Rational; pi: Rational };
type Node = { kind: 'number'; value: string } | { kind: 'symbol'; value: string } |
    { kind: 'call'; name: string; argument: Node } |
    { kind: 'binary'; op: string; left: Node; right: Node };
type TrigName = 'sin' | 'cos' | 'tan';
type Family = { offset: string; period: string };
interface Atom { name: TrigName; argument: Node; slope: Rational; shift: PiScalar; key: string; }
const ZERO: Rational = { n: 0n, d: 1n };
const ONE: Rational = { n: 1n, d: 1n };
const MAX_LENGTH = 2048, MAX_TOKENS = 384, MAX_FAMILIES = 128;
function gcd(a: bigint, b: bigint): bigint {
    a = a < 0n ? -a : a; b = b < 0n ? -b : b;
    while (b) { const r = a % b; a = b; b = r; }
    return a;
}
function rat(n: bigint, d = 1n): Rational {
    if (String(n).length > 512 || String(d).length > 512) throw new RangeError('exact scalar budget');
    if (!d) throw new Error('zero denominator');
    if (d < 0n) { n = -n; d = -d; }
    const divisor = gcd(n, d); return { n: n / divisor, d: d / divisor };
}
function add(a: Rational, b: Rational): Rational { return rat(a.n * b.d + b.n * a.d, a.d * b.d); }
function neg(a: Rational): Rational { return { n: -a.n, d: a.d }; }
function sub(a: Rational, b: Rational): Rational { return add(a, neg(b)); }
function mul(a: Rational, b: Rational): Rational { return rat(a.n * b.n, a.d * b.d); }
function div(a: Rational, b: Rational): Rational | null { return b.n ? rat(a.n * b.d, a.d * b.n) : null; }
function compare(a: Rational, b: Rational): -1 | 0 | 1 {
    const delta = a.n * b.d - b.n * a.d; return delta < 0n ? -1 : delta > 0n ? 1 : 0;
}
function rationalCas(a: Rational): string { return a.d === 1n ? String(a.n) : `${a.n}/${a.d}`; }
function parseRational(value: string): Rational | null {
    const found = /^([+-]?\d+)(?:\/([+-]?\d+))?$/u.exec(value.replace(/\s/gu, ''));
    return found && (found[2] === undefined || BigInt(found[2]) !== 0n)
        ? rat(BigInt(found[1]), BigInt(found[2] || '1')) : null;
}
function scalar(rational: Rational = ZERO, pi: Rational = ZERO): PiScalar { return { rational, pi }; }
function addScalar(a: PiScalar, b: PiScalar): PiScalar { return scalar(add(a.rational, b.rational), add(a.pi, b.pi)); }
function scale(a: PiScalar, factor: Rational): PiScalar { return scalar(mul(a.rational, factor), mul(a.pi, factor)); }
function scalarCas(a: PiScalar): string {
    if (!a.pi.n) return rationalCas(a.rational);
    const p = a.pi.n === a.pi.d ? 'pi' : a.pi.n === -a.pi.d ? '-pi' : rationalCas(a.pi) + '*pi';
    return !a.rational.n ? p : '(' + rationalCas(a.rational) + ')+(' + p + ')';
}
function scalarSign(a: PiScalar): -1 | 0 | 1 | null {
    if (!a.pi.n) return compare(a.rational, ZERO);
    // Certified enclosure of pi. A comparison is unknown when these exact
    // rational bounds fail to separate it; no floating tolerance is used.
    const digits = 314159265358979323846264338327950288419716939937510n;
    const denominator = 10n ** 50n;
    const low = add(a.rational, mul(a.pi, rat(digits, denominator)));
    const high = add(a.rational, mul(a.pi, rat(digits + 1n, denominator)));
    const aSign = compare(low, ZERO), bSign = compare(high, ZERO);
    return aSign === bSign ? aSign : null;
}
function integerRatio(a: PiScalar, b: PiScalar): Proof {
    // Irrationality of pi forces the two coefficients to agree separately.
    const ratio = b.pi.n ? div(a.pi, b.pi) : div(a.rational, b.rational);
    if (!ratio) return null;
    if (compare(mul(b.rational, ratio), a.rational) !== 0 || compare(mul(b.pi, ratio), a.pi) !== 0) return false;
    return ratio.d === 1n;
}
/** Equation sides are dimensionless outside sin/cos/tan arguments. A degree
 * annotation on their result or on an added coefficient must not be erased.
 * Final isolated angle values are parsed separately and may carry degree marks.
 */
function equationDegreeMarkersValid(tex: string): boolean {
    if (!/\u00b0|\\circ/u.test(tex)) return true;
    const source = tex.replace(/\\(?:left|right|quad|qquad)(?![A-Za-z])/gu, '')
        .replace(/\\[,;! ]/gu, '').replace(/\s/gu, '');
    const spans: Array<{ start: number; end: number }> = [];
    const endGroup = (start: number): number | null => {
        const closing: Record<string, string> = { '(': ')', '{': '}', '[': ']' };
        if (!closing[source[start]]) return null;
        const stack: string[] = [];
        for (let index = start; index < source.length; index++) {
            if (closing[source[index]]) stack.push(closing[source[index]]);
            else if (')}]'.includes(source[index])) {
                if (stack.pop() !== source[index]) return null;
                if (!stack.length) return index + 1;
            }
        }
        return null;
    };
    const functions = /\\?(?:sin|cos|tan)/gu;
    let found: RegExpExecArray | null;
    while ((found = functions.exec(source))) {
        if (found.index > 0 && /[A-Za-z]/u.test(source[found.index - 1])) continue;
        let argumentStart = found.index + found[0].length;
        if (source[argumentStart] === '^') {
            argumentStart++;
            if ('({['.includes(source[argumentStart] || ' ')) {
                const end = endGroup(argumentStart);
                if (end === null) continue;
                argumentStart = end;
            } else {
                const exponent = /^\d+/u.exec(source.slice(argumentStart));
                if (!exponent) continue;
                argumentStart += exponent[0].length;
            }
        }
        const grouped = endGroup(argumentStart);
        if (grouped !== null) { spans.push({ start: argumentStart, end: grouped }); continue; }
        // Also retain unambiguous school forms with a number or variable carrying a degree mark.
        const atom = /^(?:\d+(?:\.\d+)?|[A-Za-z])/u.exec(source.slice(argumentStart));
        if (atom) {
            const atomEnd = argumentStart + atom[0].length;
            const annotation = /^(?:\u00b0|\^\{?\\circ\}?)/u.exec(source.slice(atomEnd));
            spans.push({ start: argumentStart, end: atomEnd + (annotation?.[0].length || 0) });
        }
    }
    const annotations = /\u00b0|\\circ(?![A-Za-z])/gu;
    while ((found = annotations.exec(source))) {
        if (!spans.some(span => found!.index >= span.start && found!.index < span.end)) return false;
    }
    return true;
}
function normalizeTex(tex: string): { source: string; degree: boolean } | null {
    if (!tex || tex.length > MAX_LENGTH) return null;
    let source = tex.trim().replace(/^\$([^]*)\$$/u, '$1');
    const degree = /°|\\circ/u.test(source);
    source = source.replace(/\^\s*\{?\s*\\circ\s*\}?|°/gu, '')
        .replace(/\\(?:left|right|quad|qquad)(?![A-Za-z])/gu, '')
        .replace(/\\[,;! ]/gu, '')
        .replace(/\\(?:cdot|times)(?![A-Za-z])/gu, '*')
        .replace(/\\div(?![A-Za-z])/gu, '/')
        .replace(/\\pi(?![A-Za-z])|π/gu, 'pi')
        .replace(/\\(sin|cos|tan|arcsin|arccos|arctan)(?![A-Za-z])/gu, '$1')
        .replace(/−/gu, '-').replace(/²/gu, '^2').replace(/\s/gu, '');
    const group = (start: number): { body: string; end: number } | null => {
        if (source[start] !== '{') return null;
        let depth = 1;
        for (let i = start + 1; i < source.length; i++) {
            if (source[i] === '{') depth++;
            else if (source[i] === '}' && --depth === 0) return { body: source.slice(start + 1, i), end: i + 1 };
        }
        return null;
    };
    for (let count = 0; /\\(?:[dt]?frac|sqrt)/u.test(source); count++) {
        if (count > 32) return null;
        const found = /\\([dt]?frac|sqrt)/u.exec(source);
        if (!found) return null;
        const first = group(found.index + found[0].length);
        if (!first) return null;
        if (found[1] === 'sqrt') source = source.slice(0, found.index) + 'sqrt(' + first.body + ')' + source.slice(first.end);
        else {
            const second = group(first.end);
            if (!second) return null;
            source = source.slice(0, found.index) + '((' + first.body + ')/(' + second.body + '))' + source.slice(second.end);
        }
    }
    source = source.replace(/\{/gu, '(').replace(/\}/gu, ')');
    return source.length <= MAX_LENGTH && !/\\/u.test(source) ? { source, degree } : null;
}
class Parser {
    private tokens: string[];
    private index = 0;
    private depth = 0;
    private source: string;
    constructor(source: string) {
        this.source = source;
        this.tokens = source.match(/arcsin|arccos|arctan|sqrt|sin|cos|tan|pi|[A-Za-z]|\d+(?:\.\d+)?|[()+\-*/^]/gu) || [];
    }
    parse(): Node | null {
        if (!this.source || this.tokens.length > MAX_TOKENS || this.tokens.join('') !== this.source) return null;
        const result = this.sum(); return result && this.index === this.tokens.length && boundedNode(result) ? result : null;
    }
    private peek(): string { return this.tokens[this.index] || ''; }
    private take(): string { return this.tokens[this.index++] || ''; }
    private sum(): Node | null {
        let left = this.product();
        while (left && (this.peek() === '+' || this.peek() === '-')) {
            const op = this.take(), right = this.product();
            if (!right) return null;
            left = { kind: 'binary', op, left, right };
        }
        return left;
    }
    private product(): Node | null {
        let left = this.unary();
        while (left) {
            const explicit = this.peek() === '*' || this.peek() === '/';
            if (!explicit && !/^(?:\(|[A-Za-z]|\d)/u.test(this.peek())) break;
            const op = explicit ? this.take() : '*', right = this.unary();
            if (!right) return null;
            left = { kind: 'binary', op, left, right };
        }
        return left;
    }
    private unary(): Node | null {
        if (++this.depth > 32) return null;
        let result: Node | null;
        if (this.peek() === '+' || this.peek() === '-') {
            const minus = this.take() === '-', operand = this.unary();
            result = !operand ? null : minus ? { kind: 'binary', op: '*', left: { kind: 'number', value: '-1' }, right: operand } : operand;
        } else {
            result = this.primary();
            if (result && this.peek() === '^') {
                this.take(); const right = this.unary();
                result = right ? { kind: 'binary', op: '^', left: result, right } : null;
            }
        }
        this.depth--; return result;
    }
    private primary(): Node | null {
        const token = this.take();
        if (token === '(') { const result = this.sum(); return this.take() === ')' ? result : null; }
        if (/^-?\d+(?:\.\d+)?$/u.test(token) && token.length <= 30) return { kind: 'number', value: token };
        if (/^(?:sqrt|sin|cos|tan|arcsin|arccos|arctan)$/u.test(token)) {
            let exponent: Node | null = null;
            if (this.peek() === '^') { this.take(); exponent = this.primary(); if (!exponent) return null; }
            const parenthesized = this.peek() === '(';
            const argument = this.primary();
            if (!argument || !parenthesized && !exponent && this.peek() === '^') return null;
            const call: Node = { kind: 'call', name: token, argument };
            return exponent ? { kind: 'binary', op: '^', left: call, right: exponent } : call;
        }
        return /^(?:pi|[A-Za-z])$/u.test(token) ? { kind: 'symbol', value: token } : null;
    }
}
function boundedNode(node: Node): boolean {
    type Cost = { degree: number; terms: number; operations: number; digits: number };
    const measure = (node: Node): Cost | null => {
        if (node.kind === 'number') return { degree: 0, terms: 1, operations: 1, digits: node.value.length };
        if (node.kind === 'symbol') return { degree: node.value === 'pi' ? 0 : 1, terms: 1, operations: 1, digits: 1 };
        if (node.kind === 'call') {
            const argument = measure(node.argument);
            return argument && argument.operations <= 64 ? { degree: variables(node).size ? 1 : 0, terms: 1, operations: argument.operations + 1, digits: argument.digits } : null;
        }
        const a = measure(node.left), b = measure(node.right);
        if (!a || !b) return null;
        let degree = Math.max(a.degree, b.degree), terms = a.terms + b.terms, digits = Math.max(a.digits, b.digits) + 1;
        if (node.op === '*' || node.op === '/') { degree = a.degree + b.degree; terms = a.terms * b.terms; digits = a.digits + b.digits; }
        if (node.op === '^') {
            const power = scalarNode(node.right);
            if (!power || power.pi.n || power.rational.d !== 1n || power.rational.n < 0n || power.rational.n > 4n) return null;
            const exponent = Number(power.rational.n);
            degree = a.degree * exponent; terms = a.terms ** exponent; digits = a.digits * exponent;
        }
        const operations = a.operations + b.operations + 1;
        return degree <= 4 && terms <= 128 && operations <= 192 && digits <= 384 ? { degree, terms, operations, digits } : null;
    };
    return measure(node) !== null;
}
function parsed(tex: string, context: FunctionContext): Node | null {
    const normalized = normalizeTex(tex);
    if (!normalized || (normalized.degree && context.angleUnit !== 'deg') ||
        (context.angleUnit === 'deg' && /pi/u.test(normalized.source))) return null;
    return new Parser(normalized.source).parse();
}
function numericNode(node: Node): Rational | null {
    if (node.kind === 'number') {
        if (node.value.includes('.')) { const [a, b] = node.value.split('.'); return rat(BigInt(a + b), 10n ** BigInt(b.length)); }
        return parseRational(node.value);
    }
    return null;
}
function scalarNode(node: Node): PiScalar | null {
    const number = numericNode(node);
    if (number) return scalar(number);
    if (node.kind === 'symbol') return node.value === 'pi' ? scalar(ZERO, ONE) : null;
    if (node.kind !== 'binary') return null;
    const a = scalarNode(node.left), b = scalarNode(node.right);
    if (!a || !b) return null;
    if (node.op === '+') return addScalar(a, b);
    if (node.op === '-') return addScalar(a, scale(b, neg(ONE)));
    if (node.op === '*') return !a.pi.n ? scale(b, a.rational) : !b.pi.n ? scale(a, b.rational) : null;
    if (node.op === '/') {
        if (!b.pi.n) { const inverse = div(ONE, b.rational); return inverse ? scale(a, inverse) : null; }
        if (!a.rational.n && !b.rational.n) { const ratio = div(a.pi, b.pi); return ratio ? scalar(ratio) : null; }
        return null;
    }
    if (node.op === '^' && !b.pi.n && b.rational.d === 1n && b.rational.n >= 0n && b.rational.n <= 4n) {
        if (!b.rational.n) return scalar(ONE);
        if (b.rational.n === 1n) return a;
        return !a.pi.n ? scalar(rat(a.rational.n ** b.rational.n, a.rational.d ** b.rational.n)) : null;
    }
    return null;
}
function scalarFromCas(value: string): PiScalar | null {
    return scalarNode(new Parser(value.replace(/\s/gu, '')).parse() || { kind: 'symbol', value: '?' });
}
function run(source: string, context: FunctionContext): string | null { return shared.casRun(source, context.runtime); }
function simplify(source: string, context: FunctionContext): string | null { return run('simplify(' + source + ')', context); }
function variables(node: Node, result = new Set<string>()): Set<string> {
    if (node.kind === 'symbol' && node.value !== 'pi') result.add(node.value);
    if (node.kind === 'binary') { variables(node.left, result); variables(node.right, result); }
    if (node.kind === 'call') variables(node.argument, result);
    return result;
}
function cas(node: Node, context: FunctionContext, atoms?: Map<string, string>): string | null {
    if (node.kind === 'number') { const value = numericNode(node); return value ? rationalCas(value) : null; }
    if (node.kind === 'symbol') return atoms && node.value !== 'pi' ? null : node.value;
    if (node.kind === 'call') {
        const argument = cas(node.argument, context);
        if (!argument) return null;
        if (node.name === 'sqrt') {
            const numeric = scalarNode(node.argument);
            if (!numeric || numeric.pi.n || compare(numeric.rational, ZERO) < 0) return null;
            return 'sqrt(' + argument + ')';
        }
        if (atoms) return atoms.get(node.name + '(' + argument + ')') || null;
        if (context.angleUnit === 'deg') {
            if (/^(sin|cos|tan)$/u.test(node.name)) return node.name + '((' + argument + ')*pi/180)';
            if (/^arc(sin|cos|tan)$/u.test(node.name)) return '(180*' + node.name + '(' + argument + ')/pi)';
        }
        return node.name + '(' + argument + ')';
    }
    const left = cas(node.left, context, atoms), right = cas(node.right, context, atoms);
    if (!left || !right) return null;
    if (node.op === '/') {
        const denominator = scalarNode(node.right);
        if (!denominator || scalarSign(denominator) === 0 || scalarSign(denominator) === null) return null;
    }
    if (node.op === '^') {
        const power = scalarNode(node.right);
        if (!power || power.pi.n || power.rational.d !== 1n || power.rational.n < 0n || power.rational.n > 4n) return null;
    }
    return '(' + left + node.op + right + ')';
}
function constant(node: Node, context: FunctionContext): string | null {
    if (variables(node).size) return null;
    const expression = cas(node, context);
    if (!expression) return null;
    const result = simplify(expression, context);
    return result && !/[A-Za-z]/u.test(result.replace(/sqrt|pi/gu, '')) ? result : null;
}
function affine(node: Node, variable: string): { slope: Rational; shift: PiScalar } | null {
    const value = scalarNode(node);
    if (value) return { slope: ZERO, shift: value };
    if (node.kind === 'symbol') return node.value === variable ? { slope: ONE, shift: scalar() } : null;
    if (node.kind !== 'binary') return null;
    const a = affine(node.left, variable), b = affine(node.right, variable);
    if (!a || !b) return null;
    if (node.op === '+' || node.op === '-') {
        const sign = node.op === '+' ? ONE : neg(ONE);
        return { slope: add(a.slope, mul(b.slope, sign)), shift: addScalar(a.shift, scale(b.shift, sign)) };
    }
    if (node.op === '*') {
        if (!a.slope.n && !a.shift.pi.n) return { slope: mul(b.slope, a.shift.rational), shift: scale(b.shift, a.shift.rational) };
        if (!b.slope.n && !b.shift.pi.n) return { slope: mul(a.slope, b.shift.rational), shift: scale(a.shift, b.shift.rational) };
    }
    if (node.op === '/' && !b.slope.n && !b.shift.pi.n) {
        const inverse = div(ONE, b.shift.rational);
        if (inverse) return { slope: mul(a.slope, inverse), shift: scale(a.shift, inverse) };
    }
    if (node.op === '^' && !b.slope.n && !b.shift.pi.n && compare(b.shift.rational, ONE) === 0) return a;
    return null;
}
function collectAtoms(node: Node, variable: string, context: FunctionContext, out: Atom[] = []): Atom[] | null {
    if (node.kind === 'binary') return collectAtoms(node.left, variable, context, out) && collectAtoms(node.right, variable, context, out);
    if (node.kind !== 'call') return out;
    if (node.name === 'sqrt') return variables(node).size ? null : out;
    if (!/^(sin|cos|tan)$/u.test(node.name)) return null;
    const argument = affine(node.argument, variable), argumentCas = cas(node.argument, context);
    if (!argument || !argument.slope.n || !argumentCas) return null;
    const key = node.name + '(' + argumentCas + ')';
    if (!out.some(atom => atom.key === key)) out.push({ name: node.name as TrigName, argument: node.argument, ...argument, key });
    return out.length <= 8 ? out : null;
}
function equalExact(a: string, b: string, context: FunctionContext): Proof {
    if (a === b) return true;
    const first = scalarFromCas(a), second = scalarFromCas(b);
    if (first && second) return compare(first.rational, second.rational) === 0 && compare(first.pi, second.pi) === 0;
    const difference = simplify('(' + a + ')-(' + b + ')', context);
    if (difference === '0') return true;
    const value = difference ? scalarFromCas(difference) : null;
    return value ? scalarSign(value) === null ? null : false : null;
}
function roots(coefficients: string[], context: FunctionContext): string[] | null {
    while (coefficients.length > 1 && coefficients[coefficients.length - 1] === '0') coefficients.pop();
    if (coefficients.length === 1) return coefficients[0] === '0' ? null : [];
    if (coefficients.length === 2) {
        const root = simplify('-(' + coefficients[0] + ')/(' + coefficients[1] + ')', context);
        return root ? [root] : null;
    }
    const [c, b, a] = coefficients;
    const discriminant = simplify('(' + b + ')^2-4*(' + a + ')*(' + c + ')', context);
    const d = discriminant ? parseRational(discriminant) : null;
    if (!d) return null;
    if (d.n < 0n) return [];
    const found = [1, -1].map(sign => simplify('(-(' + b + ')+(' + sign + ')*sqrt(' + discriminant + '))/(2*(' + a + '))', context));
    return found.every(value => value !== null) ? [...new Set(found as string[])] : null;
}
const SPECIAL_SIN = [
    ['-1', '-1/2'], ['-sqrt(3)/2', '-1/3'], ['-sqrt(2)/2', '-1/4'], ['-1/2', '-1/6'],
    ['0', '0'], ['1/2', '1/6'], ['sqrt(2)/2', '1/4'], ['sqrt(3)/2', '1/3'], ['1', '1/2']
];
const SPECIAL_TAN = [
    ['-sqrt(3)', '-1/3'], ['-1', '-1/4'], ['-sqrt(3)/3', '-1/6'],
    ['0', '0'], ['sqrt(3)/3', '1/6'], ['1', '1/4'], ['sqrt(3)', '1/3']
];
function invertAtom(atom: Atom, value: string, context: FunctionContext): Family[] | null {
    const rationalValue = parseRational(value);
    if (atom.name !== 'tan' && rationalValue && (compare(rationalValue, neg(ONE)) < 0 || compare(rationalValue, ONE) > 0)) return [];
    const candidates = atom.name === 'tan' ? SPECIAL_TAN : SPECIAL_SIN;
    let angle: Rational | null = null;
    for (const [candidate, fraction] of candidates) {
        if (equalExact(value, candidate, context) === true) { angle = parseRational(fraction); break; }
    }
    if (!angle) return null;
    const inverseSlope = div(ONE, atom.slope);
    if (!inverseSlope) return null;
    let angles: Rational[];
    if (atom.name === 'sin') angles = [angle, sub(ONE, angle)];
    else if (atom.name === 'cos') { const cosineAngle = sub(rat(1n, 2n), angle); angles = [cosineAngle, neg(cosineAngle)]; }
    else angles = [angle];
    const periodFraction = mul(rat(atom.name === 'tan' ? 1n : 2n), inverseSlope);
    const period = context.angleUnit === 'deg' ? scalar(mul(periodFraction, rat(180n))) : scalar(ZERO, periodFraction);
    return angles.map(fraction => {
        const argument = context.angleUnit === 'deg' ? scalar(mul(fraction, rat(180n))) : scalar(ZERO, fraction);
        return {
            offset: scalarCas(scale(addScalar(argument, scale(atom.shift, neg(ONE))), inverseSlope)),
            period: scalarCas(scalarSign(period) === -1 ? scale(period, neg(ONE)) : period)
        };
    });
}
function solveNode(node: Node, variable: string, context: FunctionContext): RealSolutionSet | null {
    if (node.kind === 'binary' && node.op === '*') {
        const left = solveNode(node.left, variable, context), right = solveNode(node.right, variable, context);
        if (!left || !right) return null;
        if (left.kind === 'all' || right.kind === 'all') return { kind: 'all' };
        if (left.kind === 'finite' && left.values.length || right.kind === 'finite' && right.values.length) return null;
        return { kind: 'periodic', families: [...(left.kind === 'periodic' ? left.families : []), ...(right.kind === 'periodic' ? right.families : [])] };
    }
    const atoms = collectAtoms(node, variable, context);
    if (!atoms) return null;
    if (!atoms.length) {
        const value = constant(node, context);
        const truth = value ? equalExact(value, '0', context) : null;
        return truth === null ? null : truth ? { kind: 'all' } : { kind: 'finite', values: [] };
    }
    const mapping = new Map(atoms.map((atom, index) => [atom.key, index === 0 ? 'u' : 'v']));
    let expression = cas(node, context, mapping);
    if (!expression || atoms.length > 2) return null;
    let atom = atoms[0];
    if (atoms.length === 2) {
        const sine = atoms.find(value => value.name === 'sin'), cosine = atoms.find(value => value.name === 'cos');
        if (!sine || !cosine || compare(sine.slope, cosine.slope) !== 0 ||
            scalarSign(addScalar(sine.shift, scale(cosine.shift, neg(ONE)))) !== 0) return null;
        const sineSymbol = mapping.get(sine.key)!, cosineSymbol = mapping.get(cosine.key)!;
        expression = run('subst(1-' + sineSymbol + '^2,' + cosineSymbol + '^2,expand(' + expression + '))', context);
        if (!expression || new RegExp('\\b' + cosineSymbol + '\\b', 'u').test(expression)) return null;
        expression = expression.replace(new RegExp('\\b' + sineSymbol + '\\b', 'gu'), 'u'); atom = sine;
    }
    const expanded = run('expand(' + expression + ')', context);
    if (!expanded || /\b(?!u\b|sqrt\b|pi\b)[A-Za-z]+\b/u.test(expanded)) return null;
    const coefficients = [0, 1, 2].map(degree => simplify('coeff(' + expanded + ',u,' + degree + ')', context));
    if (coefficients.some(value => value === null || /\bu\b/u.test(value))) return null;
    const [c, b, a] = coefficients as string[];
    if (equalExact(expanded, '(' + c + ')+(' + b + ')*u+(' + a + ')*u^2', context) !== true) return null;
    if (a === '0' && b === '0') return c === '0' ? { kind: 'all' } : { kind: 'finite', values: [] };
    const values = roots(coefficients as string[], context);
    if (!values) return null;
    const families: Family[] = [];
    for (const value of values) {
        const inverted = invertAtom(atom, value, context);
        if (!inverted) return null;
        families.push(...inverted);
    }
    return families.length ? { kind: 'periodic', families } : { kind: 'finite', values: [] };
}
function normalizedFamilies(families: Family[]): Family[] | null {
    if (families.length > MAX_FAMILIES) return null;
    const result: Family[] = [];
    for (const family of families) {
        const offset = scalarFromCas(family.offset), period = scalarFromCas(family.period);
        if (!offset || !period || scalarSign(period) !== 1) return null;
        if (result.some(existing => {
            const p = scalarFromCas(existing.period)!, o = scalarFromCas(existing.offset)!;
            return integerRatio(period, p) === true && integerRatio(addScalar(offset, scale(o, neg(ONE))), p) === true;
        })) continue;
        result.push({ offset: scalarCas(offset), period: scalarCas(period) });
    }
    return result;
}
function intervalBounds(context: FunctionContext): { lower: PiScalar; upper: PiScalar } | null {
    if (!context.interval) return null;
    const lower = parsed(context.interval.lower, context), upper = parsed(context.interval.upper, context);
    const a = lower && scalarNode(lower), b = upper && scalarNode(upper);
    return a && b && scalarSign(addScalar(b, scale(a, neg(ONE)))) === 1 ? { lower: a, upper: b } : null;
}
function inInterval(value: PiScalar, context: FunctionContext): Proof {
    if (!context.interval) return true;
    const bounds = intervalBounds(context);
    if (!bounds) return null;
    const lower = scalarSign(addScalar(value, scale(bounds.lower, neg(ONE))));
    const upper = scalarSign(addScalar(value, scale(bounds.upper, neg(ONE))));
    if (lower === null || upper === null) return null;
    return (lower > 0 || lower === 0 && context.interval.lowerClosed) &&
        (upper < 0 || upper === 0 && context.interval.upperClosed);
}
function filterInterval(set: RealSolutionSet, context: FunctionContext): RealSolutionSet | null {
    if (!context.interval) return set;
    const bounds = intervalBounds(context);
    if (!bounds || set.kind === 'all') return null;
    if (set.kind === 'finite') {
        const values: string[] = [];
        for (const value of set.values) {
            const scalarValue = scalarFromCas(value);
            const included = scalarValue ? inInterval(scalarValue, context) : null;
            if (included === null) return null;
            if (included) values.push(value);
        }
        return { kind: 'finite', values };
    }
    const values: PiScalar[] = [];
    for (const family of set.families) {
        const offset = scalarFromCas(family.offset), period = scalarFromCas(family.period);
        if (!offset || !period) return null;
        // Boundary witnesses prove that the bounded enumeration is exhaustive.
        // Huge intervals conservatively remain unsupported.
        let coveredLower = false, coveredUpper = false;
        for (let index = -MAX_FAMILIES; index <= MAX_FAMILIES; index++) {
            const value = addScalar(offset, scale(period, rat(BigInt(index))));
            const below = scalarSign(addScalar(value, scale(bounds.lower, neg(ONE))));
            const above = scalarSign(addScalar(value, scale(bounds.upper, neg(ONE))));
            if (below === null || above === null) return null;
            if (index === -MAX_FAMILIES) coveredLower = below < 0;
            if (index === MAX_FAMILIES) coveredUpper = above > 0;
            const contained = (below > 0 || below === 0 && context.interval.lowerClosed) &&
                (above < 0 || above === 0 && context.interval.upperClosed);
            if (contained && !values.some(other => compare(value.rational, other.rational) === 0 && compare(value.pi, other.pi) === 0)) values.push(value);
            if (values.length > MAX_FAMILIES) return null;
        }
        if (!coveredLower || !coveredUpper) return null;
    }
    values.sort((a, b) => scalarSign(addScalar(a, scale(b, neg(ONE)))) || 0);
    return { kind: 'finite', values: values.map(scalarCas) };
}
export function trigConstantToTex(value: string): string {
    return value.replace(/pi/gu, '\\pi ').replace(/\*/gu, '\\cdot ');
}
function finalLine(variable: string, set: RealSolutionSet, context: FunctionContext): string {
    const tex = (value: string) => trigConstantToTex(value) + (context.angleUnit === 'deg' ? '^{\\circ}' : '');
    if (set.kind === 'all') return 'L=\\mathbb{R}';
    if (set.kind === 'finite') return set.values.length ? 'L=\\{' + set.values.map(tex).join(';') + '\\}' : 'L=\\varnothing';
    return set.families.map(family => variable + '=' + tex(family.offset) + '+(' + tex(family.period) + ')k').join('\\quad\\lor\\quad') + ',\\quad k\\in\\mathbb{Z}';
}
function analyzeTrigEquationInternal(tex: string, context: FunctionContext): FunctionEquationModel | null {
    const source = tex.split('=');
    if (source.length !== 2 || !source.every(equationDegreeMarkersValid)) return null;
    const left = parsed(source[0], context), right = parsed(source[1], context);
    if (!left || !right) return null;
    const difference: Node = { kind: 'binary', op: '-', left, right };
    const found = [...variables(difference)];
    if (found.length !== 1) return null;
    const variable = found[0], atoms = collectAtoms(difference, variable, context);
    if (!atoms?.length) return null;
    let node: Node = difference;
    if (constant(right, context) === '0') node = left;
    else if (constant(left, context) === '0') node = right;
    let solutions = solveNode(node, variable, context);
    if (!solutions) return null;
    const tangentDomain = (scalarValue: PiScalar): Proof => {
        for (const atom of atoms) {
            if (atom.name !== 'tan') continue;
            let argument = addScalar(scale(scalarValue, atom.slope), atom.shift);
            if (context.angleUnit === 'deg') argument = scalar(ZERO, div(argument.rational, rat(180n)) || ZERO);
            if (!argument.rational.n && sub(argument.pi, rat(1n, 2n)).d === 1n) return false;
        }
        return true;
    };
    const domain = (value: string): Proof => {
        try {
            const node = parsed(value, context), scalarValue = node && scalarNode(node);
            if (!scalarValue) return null;
            const inRange = inInterval(scalarValue, context);
            return inRange === true ? tangentDomain(scalarValue) : inRange;
        } catch { return null; }
    };
    if (solutions.kind === 'periodic') {
        const families = normalizedFamilies(solutions.families);
        if (!families) return null;
        for (const family of families) {
            const offset = scalarFromCas(family.offset)!, period = scalarFromCas(family.period)!;
            for (const atom of atoms.filter(value => value.name === 'tan')) {
                const step = scale(period, atom.slope);
                const unit = context.angleUnit === 'deg' ? scalar(rat(180n)) : scalar(ZERO, ONE);
                if (integerRatio(step, unit) !== true || tangentDomain(offset) !== true) return null;
            }
        }
        solutions = families.length ? { kind: 'periodic', families } : { kind: 'finite', values: [] };
    }
    solutions = filterInterval(solutions, context);
    if (!solutions) return null;
    if (solutions.kind === 'finite') {
        for (const value of solutions.values) if (domain(value) !== true) return null;
    } else if (solutions.kind === 'all' && atoms.some(atom => atom.name === 'tan')) return null;
    return { variable, solutions, expectedLines: [tex, finalLine(variable, solutions, context)], domain };
}
/** Equality includes shifted integer parameters and splitting a family into
 * several residue classes. All congruences and bounds use exact rationals. */
function compareTrigSolutionSetsInternal(left: RealSolutionSet, right: RealSolutionSet, context: FunctionContext): Proof {
    if (left.kind === 'all' || right.kind === 'all') return left.kind === right.kind;
    if (left.kind === 'finite' && right.kind === 'finite') {
        const includes = (a: string[], b: string[]): Proof => {
            for (const value of a) {
                const proofs = b.map(other => equalExact(value, other, context));
                if (!proofs.includes(true)) return proofs.includes(null) ? null : false;
            }
            return true;
        };
        const a = includes(left.values, right.values), b = includes(right.values, left.values);
        return a === false || b === false ? false : a === true && b === true ? true : null;
    }
    if (left.kind !== 'periodic' || right.kind !== 'periodic') return false;
    const families = [...left.families, ...right.families];
    if (!families.length) return true;
    const unit = context.angleUnit === 'deg' ? scalar(ONE) : scalar(ZERO, ONE);
    let periodCoefficient = ONE;
    for (const family of families) {
        const period = scalarFromCas(family.period);
        if (!period || scalarSign(period) !== 1 || (context.angleUnit === 'deg' ? period.pi.n !== 0n : period.rational.n !== 0n)) return null;
        const value = context.angleUnit === 'deg' ? period.rational : period.pi;
        periodCoefficient = rat(periodCoefficient.n / gcd(periodCoefficient.n, value.n) * value.n, gcd(periodCoefficient.d, value.d));
    }
    const commonPeriod = scale(unit, periodCoefficient);
    const residues = (set: Extract<RealSolutionSet, { kind: 'periodic' }>): PiScalar[] | null => {
        const result: PiScalar[] = [];
        for (const family of set.families) {
            const period = scalarFromCas(family.period)!, offset = scalarFromCas(family.offset);
            if (!offset) return null;
            const count = div(periodCoefficient, context.angleUnit === 'deg' ? period.rational : period.pi);
            if (!count || count.d !== 1n || count.n > BigInt(MAX_FAMILIES) || count.n < 1n) return null;
            for (let i = 0n; i < count.n; i++) {
                const value = addScalar(offset, scale(period, rat(i)));
                if (!result.some(other => integerRatio(addScalar(value, scale(other, neg(ONE))), commonPeriod) === true)) result.push(value);
            }
        }
        return result.length <= MAX_FAMILIES ? result : null;
    };
    const a = residues(left), b = residues(right);
    if (!a || !b) return null;
    return a.length === b.length && a.every(value => b.some(other => integerRatio(addScalar(value, scale(other, neg(ONE))), commonPeriod) === true));
}

/** Final forms: L={...}, indexed isolated values, or affine families with an
 * explicitly declared integer k/n/m. No implicit integer assumption. */
function parseTrigSolutionTargetInternal(tex: string, variable: string, context: FunctionContext): RealSolutionSet | null {
    if (!tex || tex.length > MAX_LENGTH || !/^[A-Za-z]$/u.test(variable)) return null;
    let source = tex.trim().replace(/\\(?:left|right)(?![A-Za-z])/gu, '')
        .replace(/\\(?:qquad|quad|,|;|!| )/gu, ' ').trim();
    const set = /^(?:L|\\mathcal\{L\})\s*=\s*(.*)$/u.exec(source);
    const value = (input: string): string | null => {
        const node = parsed(input, context);
        if (!node) return null;
        const result = constant(node, context);
        return result && scalarFromCas(result) ? result : null;
    };
    if (set) {
        if (/^(?:\\varnothing|\\emptyset|∅)$/u.test(set[1])) return { kind: 'finite', values: [] };
        if (/^(?:\\mathbb\{R\}|ℝ)$/u.test(set[1])) return { kind: 'all' };
        const content = /^(?:\\\{|\{)([^]*?)(?:\\\}|\})$/u.exec(set[1]);
        if (!content) return null;
        const entries = content[1].trim() ? content[1].split(/[;,]/u) : [];
        if (entries.length > MAX_FAMILIES) return null;
        const values = entries.map(value);
        return values.every(entry => entry !== null) ? { kind: 'finite', values: values as string[] } : null;
    }
    const integer = /(?:[,;]\s*)?([knm])\s*(?:\\in\s*\\mathbb\{Z\}|∈\s*ℤ|(?:ist\s+)?ganzzahlig)\s*$/u.exec(source);
    const parameter = integer?.[1];
    if (integer) source = source.slice(0, integer.index).trim();
    const pieces = source.split(/\s*(?:\\(?:lor|vee)|\boder\b|∨)\s*|[,;]\s*(?=[A-Za-z](?:_|\s*=))/u);
    if (!pieces.length || pieces.length > MAX_FAMILIES) return null;
    const families: Family[] = [], values: string[] = [];
    for (const piece of pieces) {
        const isolated = /^([A-Za-z])(?:_(?:\{[0-9,]+\}|[0-9]+))?\s*=\s*([^]*)$/u.exec(piece);
        if (!isolated || isolated[1] !== variable) return null;
        const alternatives = /\\pm|±/u.test(isolated[2])
            ? [isolated[2].replace(/\\pm|±/u, '+'), isolated[2].replace(/\\pm|±/u, '-')]
            : [isolated[2]];
        for (const alternative of alternatives) {
            const node = parsed(alternative, context);
            if (!node) return null;
            const symbols = variables(node);
            if (!symbols.size) {
                const scalar = value(alternative);
                if (!scalar || parameter) return null;
                values.push(scalar); continue;
            }
            if (!parameter || symbols.size !== 1 || !symbols.has(parameter)) return null;
            const expression = cas(node, context);
            if (!expression) return null;
            const slope = simplify('coeff(expand(' + expression + '),' + parameter + ',1)', context);
            const offset = simplify('subst(0,' + parameter + ',' + expression + ')', context);
            if (!slope || !offset || equalExact(expression, '(' + slope + ')*' + parameter + '+(' + offset + ')', context) !== true) return null;
            const p = scalarFromCas(slope), o = scalarFromCas(offset);
            if (!p || !o || scalarSign(p) === 0 || scalarSign(p) === null) return null;
            families.push({ offset: scalarCas(o), period: scalarCas(scalarSign(p) === -1 ? scale(p, neg(ONE)) : p) });
        }
    }
    return families.length ? values.length ? null : { kind: 'periodic', families } : { kind: 'finite', values };
}

/** Bounded normalization for prompt matching; it does not assert an identity.
 * A degree marker is retained as unsupported here so callers cannot erase units
 * without supplying the explicit exercise context. */
function normalizeTrigExpressionInternal(tex: string, context?: FunctionContext): string | null {
    const actual = context || { runtime: { run: () => { throw new Error('normalization uses no CAS'); } } };
    const node = parsed(tex, actual);
    return node ? cas(node, actual) : null;
}




export function analyzeTrigEquation(tex: string, context: FunctionContext): FunctionEquationModel | null {
    try { return analyzeTrigEquationInternal(tex, context); } catch { return null; }
}
export function compareTrigSolutionSets(left: RealSolutionSet, right: RealSolutionSet, context: FunctionContext): Proof {
    try { return compareTrigSolutionSetsInternal(left, right, context); } catch { return null; }
}
export function parseTrigSolutionTarget(tex: string, variable: string, context: FunctionContext): RealSolutionSet | null {
    try { return parseTrigSolutionTargetInternal(tex, variable, context); } catch { return null; }
}
export function normalizeTrigExpression(tex: string, context?: FunctionContext): string | null {
    try { return normalizeTrigExpressionInternal(tex, context); } catch { return null; }
}

/** Restricts exact rational/pi solution sets to the authored interval, returning
 * unknown for endpoints or values beyond the supported exact scalar grammar. */
export function restrictTrigSolutionSet(set: RealSolutionSet, context: FunctionContext): RealSolutionSet | null {
    try { return filterInterval(set, context); } catch { return null; }
}

/** Exact membership, useful for distinguishing one correct principal value from
 * a complete periodic answer. */
export function trigSolutionContains(set: RealSolutionSet, value: string, context: FunctionContext): Proof {
    try {
        if (set.kind === 'all') return true;
        if (set.kind === 'finite') {
            const proofs = set.values.map(other => equalExact(value, other, context));
            return proofs.includes(true) ? true : proofs.includes(null) ? null : false;
        }
        const candidate = scalarFromCas(value);
        if (!candidate) return null;
        let unproved = false;
        for (const family of set.families) {
            const offset = scalarFromCas(family.offset), period = scalarFromCas(family.period);
            if (!offset || !period || scalarSign(period) !== 1) { unproved = true; continue; }
            const proof = integerRatio(addScalar(candidate, scale(offset, neg(ONE))), period);
            if (proof === true) return true;
            if (proof === null) unproved = true;
        }
        return unproved ? null : false;
    } catch { return null; }
}
