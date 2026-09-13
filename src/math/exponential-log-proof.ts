import { calculationProofTools as shared, type Proof } from './equivalence.ts';
import type { FunctionContext, FunctionEquationModel } from './function-proof-types.ts';

type Node = { kind: 'number'; value: string } | { kind: 'symbol'; value: string } | { [K in 'add' | 'mul' | 'div' | 'pow']: { kind: K; left: Node; right: Node } }['add' | 'mul' | 'div' | 'pow'] | { kind: 'log'; argument: Node; base: Node } | { kind: 'abs'; argument: Node };
const number = (value: string): Node => ({ kind: 'number', value });
const binary = (kind: 'add' | 'mul' | 'div' | 'pow', left: Node, right: Node): Node => ({ kind, left, right });
const negative = (value: Node): Node => binary('mul', number('-1'), value);
const naturalBase: Node = { kind: 'symbol', value: 'e' };

/** Bounded expression grammar. It retains logarithms and their arguments before CAS cancellation. */
class ExpressionParser {
    private index = 0;
    private depth = 0;
    private readonly tokens: string[];
    private readonly source: string;
    constructor(source: string) {
        this.source = source;
        this.tokens = source.match(/\\[A-Za-z]+|\\[{}|,;! ]|\d+(?:\.\d+)?|[A-Za-z]+|[^\s]/gu) || [];
    }
    parse(): Node | null {
        if (!this.source || this.source.length > 2048 || this.tokens.length > 256) return null;
        const result = this.sum();
        return result && this.index === this.tokens.length ? result : null;
    }
    private peek() { return this.tokens[this.index] || ''; }
    private take() { return this.tokens[this.index++] || ''; }
    private sum(): Node | null {
        let left = this.product();
        while (left && ['+', '-'].includes(this.peek())) {
            const operator = this.take(), right = this.product();
            if (!right) return null;
            left = binary('add', left, operator === '-' ? negative(right) : right);
        }
        return left;
    }
    private startsAtom() { return /^(?:\d|[A-Za-z]|\\(?:frac|dfrac|tfrac|ln|log|lg|exp|sqrt|pi|mathrm|operatorname))/.test(this.peek()) || ['(', '{'].includes(this.peek()); }
    private product(): Node | null {
        let left = this.unary();
        while (left) {
            const next = this.peek(), explicit = ['*', '/', '\\cdot', '\\times', '\\div'].includes(next);
            if (!explicit && !this.startsAtom()) break;
            if (explicit) this.take();
            const right = this.unary();
            if (!right) return null;
            left = binary(next === '/' || next === '\\div' ? 'div' : 'mul', left, right);
        }
        return left;
    }
    private unary(): Node | null {
        if (++this.depth > 32) return null;
        let result: Node | null;
        if (this.peek() === '+' || this.peek() === '-') {
            const sign = this.take(), value = this.unary();
            result = value && (sign === '-' ? negative(value) : value);
        } else {
            result = this.primary();
            if (result && this.peek() === '^') {
                this.take(); const exponent = this.unary();
                result = exponent && binary('pow', result, exponent);
            }
        }
        this.depth--;
        return result;
    }
    private group(): Node | null {
        const open = this.take(), close = open === '(' ? ')' : open === '{' ? '}' : '';
        if (!close) return null;
        const result = this.sum();
        return this.take() === close ? result : null;
    }
    private primary(): Node | null {
        const token = this.peek();
        if (token === '(' || token === '{') return this.group();
        this.take();
        if (/^\d+(?:\.\d+)?$/.test(token) && token.replace('.', '').length <= 18) return number(token);
        if (/^[A-Za-z]$/.test(token)) return { kind: 'symbol', value: token };
        if (token === 'pi' || token === '\\pi') return { kind: 'symbol', value: 'pi' };
        if (['\\frac', '\\dfrac', '\\tfrac'].includes(token)) {
            const numerator = this.group(), denominator = this.group();
            return numerator && denominator && binary('div', numerator, denominator);
        }
        if (token === '\\mathrm' || token === '\\operatorname') return this.group();
        if (token === '|' || token === '\\vert') {
            const argument = this.sum();
            return argument && ['|', '\\vert'].includes(this.take()) ? { kind: 'abs', argument } : null;
        }
        if (['ln', 'log', 'lg', '\\ln', '\\log', '\\lg'].includes(token)) {
            let base = token === 'lg' || token === '\\lg' ? number('10') : naturalBase;
            if (this.peek() === '_') {
                this.take(); const explicit = this.peek() === '{' ? this.group() : this.primary();
                if (!explicit) return null;
                base = explicit;
            }
            const argument = ['(', '{'].includes(this.peek()) ? this.group() : this.unary();
            return argument ? { kind: 'log', argument, base } : null;
        }
        if (['exp', '\\exp', 'sqrt', '\\sqrt', 'abs'].includes(token)) {
            const argument = ['(', '{'].includes(this.peek()) ? this.group() : this.unary();
            if (!argument) return null;
            return token === 'abs' ? { kind: 'abs', argument } : token.endsWith('sqrt')
                ? binary('pow', argument, binary('div', number('1'), number('2'))) : binary('pow', naturalBase, argument);
        }
        return null;
    }
}
function clean(tex: string): string {
    return tex.trim().replace(/^\$([^]*)\$$/u, '$1').replace(/\\(?:left|right)(?![A-Za-z])/gu, '')
        .replace(/\\(?:quad|qquad|,|;|!| )(?![A-Za-z])/gu, '').replace(/[−–]/gu, '-').replace(/[·×]/gu, '*')
        .replace(/\\operatorname\s*\{(ln|log|lg|exp|abs)\}/gu, '$1');
}
function parse(tex: string): Node | null { return new ExpressionParser(clean(tex)).parse(); }
function children(node: Node): Node[] {
    return node.kind === 'log' ? [node.argument, node.base] : node.kind === 'abs' ? [node.argument]
        : 'left' in node ? [node.left, node.right] : [];
}
function symbols(node: Node): string[] {
    return node.kind === 'symbol' && !['e', 'pi'].includes(node.value) ? [node.value] : children(node).reduce<string[]>((all, child) => all.concat(symbols(child)), []);
}
function contains(node: Node, predicate: (node: Node) => boolean): boolean { return predicate(node) || children(node).some(child => contains(child, predicate)); }
function cas(node: Node, replace?: (node: Node) => string | null): string {
    const substituted = replace?.(node);
    if (substituted !== undefined && substituted !== null) return '(' + substituted + ')';
    if (node.kind === 'number') {
        const decimal = /^(\d+)\.(\d+)$/.exec(node.value);
        return decimal ? '(' + decimal[1] + decimal[2] + '/1' + '0'.repeat(decimal[2].length) + ')' : node.value;
    }
    if (node.kind === 'symbol') return node.value;
    if (node.kind === 'abs') return 'abs(' + cas(node.argument, replace) + ')';
    if (node.kind === 'log') return '(' + 'log(' + cas(node.argument, replace) + ')/log(' + cas(node.base, replace) + '))';
    return '(' + cas(node.left, replace) + ({ add: '+', mul: '*', div: '/', pow: '^' }[node.kind]) + cas(node.right, replace) + ')';
}
interface InputMeasure { cost: number; terms: number; digits: number; degree: number; constant: boolean; numeric: number | null }
/** Syntactic work estimate only; arithmetic here never proves a mathematical claim. */
function inputMeasure(node: Node): InputMeasure | null {
    const bound = (value: InputMeasure): InputMeasure | null => value.cost <= 256 && value.terms <= 256 && value.digits <= 384 && value.degree <= 16 ? value : null;
    const small = (value: number): number | null => Number.isFinite(value) && Math.abs(value) <= 1e6 ? value : null;
    if (node.kind === 'number') return { cost: 1, terms: 1, digits: node.value.replace(/[^0-9]/g, '').length, degree: 0, constant: true, numeric: small(Number(node.value)) };
    if (node.kind === 'symbol') return { cost: 1, terms: 1, digits: 1, degree: ['e', 'pi'].includes(node.value) ? 0 : 1, constant: ['e', 'pi'].includes(node.value), numeric: null };
    if (node.kind === 'log' || node.kind === 'abs') {
        const argument = inputMeasure(node.argument), base = node.kind === 'log' ? inputMeasure(node.base) : null;
        return argument && (node.kind !== 'log' || base) ? bound({ ...argument, cost: argument.cost + (base?.cost || 0) + 2, constant: argument.constant && (base?.constant ?? true), numeric: null }) : null;
    }
    const left = inputMeasure(node.left), right = inputMeasure(node.right);
    if (!left || !right) return null;
    if (node.kind === 'pow') {
        if (right.constant && (right.numeric === null || Math.abs(right.numeric) > 16)) return null;
        const power = Math.max(1, Math.abs(right.numeric ?? 4));
        return bound({ cost: left.cost * power + right.cost + 1, terms: left.terms ** Math.ceil(power), digits: left.digits * power,
            degree: left.degree * Math.ceil(power) + (right.constant ? 0 : right.degree), constant: left.constant && right.constant,
            numeric: left.numeric !== null && right.numeric !== null && Number.isInteger(right.numeric) ? small(left.numeric ** right.numeric) : null });
    }
    const product = node.kind === 'mul' || node.kind === 'div';
    const numeric = left.numeric !== null && right.numeric !== null
        ? small(node.kind === 'add' ? left.numeric + right.numeric : node.kind === 'mul' ? left.numeric * right.numeric : left.numeric / right.numeric) : null;
    return bound({ cost: left.cost + right.cost + 1, terms: product ? left.terms * right.terms : left.terms + right.terms,
        digits: product ? left.digits + right.digits : Math.max(left.digits, right.digits) + 1,
        degree: product ? left.degree + right.degree : Math.max(left.degree, right.degree), constant: left.constant && right.constant, numeric });
}
export function normalizeFunctionExpression(tex: string): string | null {
    const node = parse(tex);
    return node && inputMeasure(node) ? cas(node) : null;
}
function run(source: string, context: FunctionContext): string | null {
    if (source.length > 8192) return null;
    return shared.casRun(source, context.runtime);
}
function simplify(source: string, context: FunctionContext): string | null { return run('simplify(' + source + ')', context); }
function rational(source: string | null): { n: number; d: number } | null {
    const match = source && /^(-?\d+)(?:\/(\d+))?$/.exec(source);
    if (!match) return null;
    const n = Number(match[1]), d = Number(match[2] || 1);
    return Number.isSafeInteger(n) && Number.isSafeInteger(d) && d !== 0 ? { n, d } : null;
}
function signNode(node: Node, context: FunctionContext, depth: number): -1 | 0 | 1 | null {
    if (depth > 16) return null;
    if (node.kind === 'number') return Number(node.value) < 0 ? -1 : Number(node.value) === 0 ? 0 : 1;
    if (node.kind === 'symbol') return ['e', 'pi'].includes(node.value) ? 1 : null;
    if (node.kind === 'log') {
        const argument = sign(cas(node.argument), context, depth + 1), base = sign(cas(node.base), context, depth + 1);
        if (argument !== 1 || base !== 1) return null;
        const a = sign('(' + cas(node.argument) + ')-1', context, depth + 1), b = node.base.kind === 'symbol' && node.base.value === 'e' ? 1 : sign('(' + cas(node.base) + ')-1', context, depth + 1);
        return a === null || b === null || b === 0 ? null : a * b as -1 | 0 | 1;
    }
    if (node.kind === 'abs') { const value = signNode(node.argument, context, depth + 1); return value === null ? null : value === 0 ? 0 : 1; }
    const left = signNode(node.left, context, depth + 1), right = signNode(node.right, context, depth + 1);
    if (node.kind === 'mul' || node.kind === 'div') return left === null || right === null || (node.kind === 'div' && right === 0) ? null : left * right as -1 | 0 | 1;
    if (node.kind === 'add') return left === 0 ? right : right === 0 ? left : left !== null && left === right ? left : null;
    if (left === 1) return 1;
    const exponent = rational(simplify(cas(node.right), context));
    if (!exponent || exponent.d !== 1) return null;
    if (left === 0) return exponent.n > 0 ? 0 : null;
    return left === null ? null : exponent.n % 2 === 0 ? 1 : -1;
}
function sign(source: string, context: FunctionContext, depth = 0): -1 | 0 | 1 | null {
    if (depth > 16) return null;
    const simple = simplify(source, context), value = rational(simple);
    if (value) return value.n === 0 ? 0 : value.n < 0 ? -1 : 1;
    const node = simple && parse(simple);
    return node ? signNode(node, context, depth + 1) : null;
}
function logarithmView(node: Node): { argument: Node; base: Node } | null {
    if (node.kind === 'log') return node;
    if (node.kind === 'div' && node.left.kind === 'log' && node.right.kind === 'log' &&
        node.left.base.kind === 'symbol' && node.left.base.value === 'e' && node.right.base.kind === 'symbol' && node.right.base.value === 'e') {
        return { argument: node.left.argument, base: node.right.argument };
    }
    return null;
}
function compareLogarithmWithRational(node: Node, other: string, context: FunctionContext): Proof {
    const logarithm = logarithmView(node), value = rational(other);
    if (!logarithm || !value || Math.abs(value.n / value.d) > 16 || value.d > 16) return null;
    const base = cas(logarithm.base), argument = cas(logarithm.argument);
    if (sign(base, context) !== 1 || sign(argument, context) !== 1) return null;
    if (!(logarithm.base.kind === 'symbol' && logarithm.base.value === 'e') && ![-1, 1].includes(sign('(' + base + ')-1', context) || 0)) return null;
    const comparison = sign('(' + argument + ')-((' + base + ')^(' + other + '))', context);
    return comparison === null ? null : comparison === 0;
}
export function compareFunctionConstants(left: string, right: string, context: FunctionContext): Proof {
    const a = parse(left), b = parse(right);
    if (!a || !b || !inputMeasure(a) || !inputMeasure(b) || symbols(a).length || symbols(b).length) return null;
    if (domainFor([a, b], 'z', context)('0') !== true) return null;
    const normalizedLeft = simplify(left, context), normalizedRight = simplify(right, context);
    const first = normalizedLeft && parse(normalizedLeft), second = normalizedRight && parse(normalizedRight);
    if (first && normalizedRight !== null) {
        const comparison = compareLogarithmWithRational(first, normalizedRight, context);
        if (comparison !== null) return comparison;
    }
    if (second && normalizedLeft !== null) {
        const comparison = compareLogarithmWithRational(second, normalizedLeft, context);
        if (comparison !== null) return comparison;
    }
    // A fixed valid logarithm base is injective on its positive domain.
    // This proves distinct logarithmic roots without approximating their values.
    if (first && second && first.kind === 'log' && second.kind === 'log' &&
        simplify('(' + cas(first.base) + ')-(' + cas(second.base) + ')', context) === '0') {
        const argumentsDifference = sign('(' + cas(first.argument) + ')-(' + cas(second.argument) + ')', context);
        if (argumentsDifference !== null) return argumentsDifference === 0;
    }
    const difference = sign('(' + left + ')-(' + right + ')', context);
    return difference === null ? null : difference === 0;
}
function integer(node: Node, context: FunctionContext): number | null {
    if (symbols(node).length) return null;
    const value = rational(simplify(cas(node), context));
    return value && value.d === 1 && Math.abs(value.n) <= 16 ? value.n : null;
}
function safe(node: Node, context: FunctionContext): boolean {
    if (!inputMeasure(node) || !children(node).every(child => safe(child, context))) return false;
    if (node.kind === 'pow' && !symbols(node.right).length) {
        const exponent = rational(simplify(cas(node.right), context));
        if (!exponent || Math.abs(exponent.n) > 16 || exponent.d > 16) return false;
    }
    return true;
}
function equation(tex: string, context: FunctionContext): { left: Node; right: Node; variable: string } | null {
    if (tex.length > 4096) return null;
    const pieces = clean(tex).split('=');
    if (pieces.length !== 2) return null;
    const left = parse(pieces[0]), right = parse(pieces[1]);
    if (!left || !right || !inputMeasure(left) || !inputMeasure(right) || !safe(left, context) || !safe(right, context)) return null;
    const variables = [...new Set([...symbols(left), ...symbols(right)])];
    return variables.length === 1 && variables[0] !== 'i' ? { left, right, variable: variables[0] } : null;
}
function domainFor(nodes: Node[], variable: string, context: FunctionContext): (value: string) => Proof {
    const conditions: { expression: string; positive: boolean; allowZero?: boolean }[] = [];
    const visit = (node: Node) => {
        if (node.kind === 'log') {
            conditions.push({ expression: cas(node.argument), positive: true });
            if (!(node.base.kind === 'symbol' && node.base.value === 'e')) conditions.push({ expression: cas(node.base), positive: true }, { expression: '(' + cas(node.base) + ')-1', positive: false });
        }
        if (node.kind === 'div') conditions.push({ expression: cas(node.right), positive: false });
        if (node.kind === 'pow') {
            const exponent = integer(node.right, context);
            if (symbols(node.right).length || exponent === null) {
                const power = rational(simplify(cas(node.right), context));
                conditions.push({ expression: cas(node.left), positive: true, allowZero: !!power && power.n > 0 });
            }
            else if (exponent <= 0) conditions.push({ expression: cas(node.left), positive: false });
        }
        children(node).forEach(visit);
    };
    nodes.forEach(visit);
    return value => {
        const parsed = parse(value);
        if (!parsed || symbols(parsed).length || !safe(parsed, context)) return null;
        const originalCount = conditions.length;
        visit(parsed);
        const checkedConditions = conditions.slice(originalCount).map(condition => ({ ...condition, target: true }))
            .concat(conditions.slice(0, originalCount).map(condition => ({ ...condition, target: false })));
        conditions.length = originalCount;
        let unknown = false;
        for (const condition of checkedConditions) {
            const substituted = condition.target ? condition.expression : run('subst((' + value + '),' + variable + ',(' + condition.expression + '))', context);
            const result = substituted === null ? null : sign(substituted, context);
            if (result === null) unknown = true;
            else if (condition.positive ? result < (condition.allowZero ? 0 : 1) : result === 0) return false;
        }
        return unknown ? null : true;
    };
}
/** Exact enumeration, limited to degree two. No numerical candidate sampling. */
function solvePolynomial(expression: string, variable: string, context: FunctionContext): string[] | null {
    const guarded = parse(expression);
    if (!guarded || !inputMeasure(guarded)) return null;
    const expanded = run('expand(' + expression + ')', context);
    if (expanded === null) return null;
    const coefficients = [0, 1, 2].map(order => simplify('coeff(' + expanded + ',' + variable + ',' + order + ')', context));
    if (coefficients.some(value => value === null || new RegExp('\\b' + variable + '\\b').test(value))) return null;
    const [c, b, a] = coefficients as string[];
    if (simplify('(' + expanded + ')-((' + a + ')*' + variable + '^2+(' + b + ')*' + variable + '+(' + c + '))', context) !== '0') return null;
    if (a === '0') {
        if (b === '0') return c === '0' ? null : sign(c, context) !== null ? [] : null;
        if (sign(b, context) === null) return null;
        const root = simplify('-(' + c + ')/(' + b + ')', context);
        return root === null ? null : [root];
    }
    if (sign(a, context) === null) return null;
    const discriminant = simplify('(' + b + ')^2-4*(' + a + ')*(' + c + ')', context);
    const discriminantSign = discriminant === null ? null : sign(discriminant, context);
    if (discriminantSign === null) return null;
    if (discriminantSign < 0) return [];
    const roots = (discriminantSign === 0 ? ['+'] : ['+', '-']).map(operator => simplify('(-(' + b + ')' + operator + 'sqrt(' + discriminant + '))/(2*(' + a + '))', context));
    return roots.every(root => root !== null) ? roots as string[] : null;
}
function finiteModel(tex: string, variable: string, candidates: string[], domain: (value: string) => Proof): FunctionEquationModel | null {
    const values: string[] = [];
    for (const candidate of candidates) {
        const allowed = domain(candidate);
        if (allowed === null) return null;
        if (allowed && !values.includes(candidate)) values.push(candidate);
    }
    return { variable, solutions: { kind: 'finite', values }, domain,
        expectedLines: [tex, values.length ? '\\mathcal{L}=\\{' + values.map(functionConstantToTex).join(';') + '\\}' : '\\mathcal{L}=\\varnothing'] };
}
function primeFactors(value: number): Map<number, number> | null {
    if (!Number.isSafeInteger(value) || value < 1 || value > 1e12) return null;
    const factors = new Map<number, number>();
    for (let divisor = 2; divisor * divisor <= value && divisor <= 100000; divisor += divisor === 2 ? 1 : 2) {
        while (value % divisor === 0) { factors.set(divisor, (factors.get(divisor) || 0) + 1); value /= divisor; }
    }
    if (value > 1) factors.set(value, (factors.get(value) || 0) + 1);
    return factors;
}
function exactLogRatio(value: string, base: string, context: FunctionContext): string {
    if (value === '1') return '0';
    if (base === 'e') return simplify('log(' + value + ')', context) || 'log(' + value + ')';
    const a = rational(value), b = rational(base);
    if (a && b && a.n > 0 && b.n > 0) {
        const factorRational = (v: { n: number; d: number }) => {
            const top = primeFactors(v.n), bottom = primeFactors(v.d);
            if (!top || !bottom) return null;
            for (const [prime, exponent] of bottom) top.set(prime, (top.get(prime) || 0) - exponent);
            return top;
        };
        const first = factorRational(a), second = factorRational(b);
        if (first && second) {
            const key = [...second.keys()].find(prime => second.get(prime));
            if (key !== undefined) {
                const n = first.get(key) || 0, d = second.get(key)!;
                if ([...new Set([...first.keys(), ...second.keys()])].every(prime => (first.get(prime) || 0) * d === (second.get(prime) || 0) * n)) return simplify(n + '/' + d, context) || n + '/' + d;
            }
        }
    }
    return simplify('log(' + value + ')/log(' + base + ')', context) || 'log(' + value + ')/log(' + base + ')';
}
function exponential(tex: string, source: { left: Node; right: Node; variable: string }, context: FunctionContext): FunctionEquationModel | null {
    const atoms: Extract<Node, { kind: 'pow' }>[] = [];
    const visit = (node: Node) => {
        if (node.kind === 'pow' && symbols(node.right).includes(source.variable) && !symbols(node.left).length) atoms.push(node as Extract<Node, { kind: 'pow' }>);
        else children(node).forEach(visit);
    };
    visit(source.left); visit(source.right);
    if (!atoms.length || atoms.length > 8) return null;
    const base = simplify(cas(atoms[0].left), context);
    if (!base || sign(base, context) !== 1 || sign('(' + base + ')-1', context) === 0) return null;
    if (base !== 'e' && sign('(' + base + ')-1', context) === null) return null;
    const exponents: { node: Node; slope: number; shift: string }[] = [];
    for (const atom of atoms) {
        if (simplify('(' + cas(atom.left) + ')-(' + base + ')', context) !== '0') return null;
        const expression = cas(atom.right), slopeCAS = simplify('coeff(expand(' + expression + '),' + source.variable + ',1)', context);
        const shift = simplify('subst(0,' + source.variable + ',(' + expression + '))', context), slope = rational(slopeCAS);
        if (!slope || slope.d !== 1 || !slope.n || Math.abs(slope.n) > 16 || shift === null || symbols(parse(shift) || number('0')).length) return null;
        const shiftValue = rational(shift);
        if (!shiftValue || Math.abs(shiftValue.n / shiftValue.d) > 16 || shiftValue.d > 16) return null;
        if (simplify('(' + expression + ')-((' + slopeCAS + ')*' + source.variable + '+(' + shift + '))', context) !== '0') return null;
        exponents.push({ node: atom, slope: slope.n, shift });
    }
    const gcd = (a: number, b: number): number => b ? gcd(b, a % b) : a;
    const scale = exponents.reduce((value, item) => gcd(value, Math.abs(item.slope)), 0);
    let denominatorPower = 0;
    const helperVariable = source.variable === 't' ? 'z' : 't';
    const substitutions = new Map<Node, string>();
    for (const item of exponents) {
        const power = item.slope / scale;
        if (Math.abs(power) > 4) return null;
        denominatorPower += Math.max(0, -power);
        substitutions.set(item.node, '((' + base + ')^(' + item.shift + '))*' + helperVariable + '^(' + power + ')');
    }
    const replaced = '(' + cas(source.left, node => substitutions.get(node) || null) + ')-(' + cas(source.right, node => substitutions.get(node) || null) + ')';
    if (new RegExp('\\b' + source.variable + '\\b').test(replaced)) return null;
    const transformed = denominatorPower ? '(' + replaced + ')*' + helperVariable + '^' + denominatorPower : replaced;
    const candidates = solvePolynomial(transformed, helperVariable, context);
    if (!candidates) return null;
    const roots: string[] = [];
    const positiveCandidates: string[] = [];
    for (const candidate of candidates) {
        const positive = sign(candidate, context);
        if (positive === null) return null;
        if (positive !== 1) continue;
        const value = simplify('(' + exactLogRatio(candidate, base, context) + ')/' + scale, context);
        if (value === null) return null;
        roots.push(value);
        positiveCandidates.push(candidate);
    }
    const model = finiteModel(tex, source.variable, roots, domainFor([source.left, source.right], source.variable, context));
    if (model && positiveCandidates.length) {
        const term = functionConstantToTex(base) + '^{' + (scale === 1 ? '' : scale) + source.variable + '}';
        const intermediate = positiveCandidates.length === 1 ? term + '=' + functionConstantToTex(positiveCandidates[0])
            : positiveCandidates.map(candidate => '\\left(' + term + '-(' + functionConstantToTex(candidate) + ')\\right)').join('') + '=0';
        if (clean(intermediate) !== clean(tex)) model.expectedLines.splice(1, 0, intermediate);
    }
    return model;
}
function logarithmic(tex: string, source: { left: Node; right: Node; variable: string }, context: FunctionContext): FunctionEquationModel | null {
    const logs: { node: Extract<Node, { kind: 'log' }>; coefficient: number }[] = [];
    const constants: string[] = [];
    const collect = (node: Node, multiplier: number): boolean => {
        if (node.kind === 'log') { logs.push({ node, coefficient: multiplier }); return true; }
        if (node.kind === 'add') return collect(node.left, multiplier) && collect(node.right, multiplier);
        if (node.kind === 'mul') {
            const left = integer(node.left, context), right = integer(node.right, context);
            if (left !== null) return collect(node.right, multiplier * left);
            if (right !== null) return collect(node.left, multiplier * right);
        }
        if (!symbols(node).length && !contains(node, child => child.kind === 'log')) { constants.push('(' + multiplier + ')*(' + cas(node) + ')'); return true; }
        return false;
    };
    if (!collect(source.left, 1) || !collect(source.right, -1) || !logs.length || logs.length > 8) return null;
    const base = simplify(cas(logs[0].node.base), context);
    if (!base || sign(base, context) !== 1 || (base !== 'e' && ![-1, 1].includes(sign('(' + base + ')-1', context) || 0))) return null;
    const positive: string[] = [], negative: string[] = [];
    for (const item of logs) {
        if (!Number.isInteger(item.coefficient) || Math.abs(item.coefficient) > 4 || simplify('(' + cas(item.node.base) + ')-(' + base + ')', context) !== '0') return null;
        if (item.coefficient === 0) continue;
        let argument = item.node.argument;
        if (argument.kind === 'abs' && Math.abs(item.coefficient) % 2 === 0) argument = argument.argument;
        if (contains(argument, node => node.kind === 'abs' || node.kind === 'log')) return null;
        (item.coefficient > 0 ? positive : negative).push('(' + cas(argument) + ')^' + Math.abs(item.coefficient));
    }
    const constant = simplify(constants.length ? constants.join('+') : '0', context);
    const constantValue = rational(constant);
    if (!constantValue || Math.abs(constantValue.n / constantValue.d) > 16 || constantValue.d > 16) return null;
    const transformed = '(' + (positive.join('*') || '1') + ')-((' + base + ')^(-(' + constant + ')))*(' + (negative.join('*') || '1') + ')';
    const roots = solvePolynomial(transformed, source.variable, context);
    const model = roots && finiteModel(tex, source.variable, roots, domainFor([source.left, source.right], source.variable, context));
    if (model) {
        const expanded = run('expand(' + transformed + ')', context);
        if (expanded !== null) model.expectedLines.splice(1, 0, functionConstantToTex(expanded) + '=0');
    }
    return model;
}
export function analyzeExponentialLogEquation(tex: string, context: FunctionContext): FunctionEquationModel | null {
    const source = equation(tex, context);
    if (!source) return null;
    if (contains(source.left, node => node.kind === 'log') || contains(source.right, node => node.kind === 'log')) return logarithmic(tex, source, context);
    return exponential(tex, source, context);
}
export function analyzeFunctionPolynomialEquation(tex: string, context: FunctionContext): FunctionEquationModel | null {
    const source = equation(tex, context);
    if (!source || [source.left, source.right].some(node => contains(node, child => child.kind === 'log' || child.kind === 'abs' || (child.kind === 'pow' && symbols(child.right).length > 0)))) return null;
    const roots = solvePolynomial('(' + cas(source.left) + ')-(' + cas(source.right) + ')', source.variable, context);
    return roots && finiteModel(tex, source.variable, roots, domainFor([source.left, source.right], source.variable, context));
}
function texNode(node: Node): string {
    if (node.kind === 'number') return node.value;
    if (node.kind === 'symbol') return node.value === 'pi' ? '\\pi' : node.value;
    if (node.kind === 'abs') return '\\left|' + texNode(node.argument) + '\\right|';
    if (node.kind === 'log') return (node.base.kind === 'symbol' && node.base.value === 'e' ? '\\ln' : '\\log_{' + texNode(node.base) + '}') + '\\left(' + texNode(node.argument) + '\\right)';
    if (node.kind === 'div') return '\\frac{' + texNode(node.left) + '}{' + texNode(node.right) + '}';
    if (node.kind === 'pow') {
        if (node.right.kind === 'div' && node.right.left.kind === 'number' && node.right.left.value === '1' && node.right.right.kind === 'number' && node.right.right.value === '2') return '\\sqrt{' + texNode(node.left) + '}';
        return '\\left(' + texNode(node.left) + '\\right)^{' + texNode(node.right) + '}';
    }
    if (node.kind === 'mul' && node.left.kind === 'number' && node.left.value === '-1') return '-\\left(' + texNode(node.right) + '\\right)';
    return '\\left(' + texNode(node.left) + (node.kind === 'add' ? '+' : '\\cdot ') + texNode(node.right) + '\\right)';
}
export function functionConstantToTex(value: string): string { const node = parse(value); return node ? texNode(node) : value; }





/** Recognizes a positive exponential for every real value of the named variable. */
export function isPositiveExponential(tex: string, variable: string, context: FunctionContext): boolean {
    const node = parse(tex);
    if (!node || !inputMeasure(node) || !safe(node, context) || node.kind !== 'pow' || symbols(node.left).length || sign(cas(node.left), context) !== 1) return false;
    const realPolynomial = (part: Node): boolean => {
        if (part.kind === 'number') return true;
        if (part.kind === 'symbol') return [variable, 'e', 'pi'].includes(part.value);
        if (part.kind === 'add' || part.kind === 'mul') return realPolynomial(part.left) && realPolynomial(part.right);
        if (part.kind === 'div') return realPolynomial(part.left) && !symbols(part.right).length && sign(cas(part.right), context) !== null && sign(cas(part.right), context) !== 0;
        if (part.kind === 'pow') { const power = integer(part.right, context); return power !== null && power >= 0 && realPolynomial(part.left); }
        return false;
    };
    return realPolynomial(node.right);
}
/** Proves elementary domain annotations from an original linear log argument or denominator. */
export function proveExponentialLogDomainAssertion(assertionTex: string, originalEquationTex: string, context: FunctionContext): Proof {
    const source = equation(originalEquationTex, context);
    const assertion = clean(assertionTex).replace(/\\(?:gt|greater)(?![A-Za-z])/gu, '>').replace(/\\lt(?![A-Za-z])/gu, '<').replace(/\\(?:ne|neq)(?![A-Za-z])|≠/gu, '!=');
    const match = /^([A-Za-z])\s*(>|<|!=)\s*(.+)$/u.exec(assertion);
    if (!source || !match || match[1] !== source.variable) return null;
    const bound = parse(match[3]);
    if (!bound || symbols(bound).length || !inputMeasure(bound) || !safe(bound, context)) return null;
    const candidates: { argument: Node; relation: 'positive' | 'nonzero' }[] = [];
    const visit = (node: Node) => {
        if (node.kind === 'log') candidates.push({ argument: node.argument, relation: 'positive' });
        if (node.kind === 'div') candidates.push({ argument: node.right, relation: 'nonzero' });
        children(node).forEach(visit);
    };
    visit(source.left); visit(source.right);
    for (const candidate of candidates) {
        const expression = cas(candidate.argument), variable = source.variable;
        const slope = simplify('coeff(expand(' + expression + '),' + variable + ',1)', context);
        const constant = simplify('subst(0,' + variable + ',(' + expression + '))', context);
        if (slope === null || constant === null || simplify('(' + expression + ')-((' + slope + ')*' + variable + '+(' + constant + '))', context) !== '0') continue;
        const direction = sign(slope, context);
        if (direction === null || direction === 0) continue;
        if (simplify('(-(' + constant + ')/(' + slope + '))-(' + cas(bound) + ')', context) !== '0') continue;
        if (match[2] === '!=' || (candidate.relation === 'positive' && match[2] === (direction === 1 ? '>' : '<'))) return true;
    }
    return null;
}









/** Checks an auxiliary expression at one exact original solution before cancellation. */
export function functionExpressionDefinedAt(tex: string, variable: string, value: string, context: FunctionContext): Proof {
    const expression = parse(tex);
    if (!expression || !inputMeasure(expression) || !safe(expression, context) || symbols(expression).some(symbol => symbol !== variable)) return null;
    return domainFor([expression], variable, context)(value);
}
