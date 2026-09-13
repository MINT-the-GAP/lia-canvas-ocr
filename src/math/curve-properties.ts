/** Exact property proofs. Rational expressions retain uncancelled domain exclusions. */
import type { Proof } from './equivalence.ts';
import type { NumericPolynomial } from './nonlinear-proof.ts';
import { cas, curveClean, curveConstant, curveEqual, curvePolynomial, curveRealRoots, curveSign,
    curveSubstitute, curveTex, normalizeCurveExpression,
    type CurveEnvironment, type CurveLineResult, type CurveTaskModel } from './curve-task-core.ts';
type Fraction = { numerator: string; denominator: string; n: number; d: number; cost: number };
type Rational = { numerator: NumericPolynomial; denominator: NumericPolynomial; excluded: string[] };
type Bound = { value: string; closed: boolean };
type RealRange = { lower: Bound; upper: Bound };
type Point = { x: string; y: string };
function simple(env: CurveEnvironment, value: string): string | null {
    return cas(env, 'simplify(rationalize(' + value + '))');
}
function unique(env: CurveEnvironment, values: string[]): string[] | null {
    const out: string[] = [];
    for (const value of values) {
        let found = false;
        for (const previous of out) {
            const equal = curveEqual(env, previous, value);
            if (equal === null) return null;
            if (equal) found = true;
        }
        if (!found) out.push(value);
    }
    return out;
}
/** Keep every original divisor, even in nested fractions. Resource bounds run before CAS expansion. */
class RationalParser {
    private tokens: string[];
    private index = 0;
    private depth = 0;
    readonly exclusions: string[] = [];
    private env: CurveEnvironment;
    private source: string;
    constructor(env: CurveEnvironment, source: string) {
        this.env = env;
        this.source = source.replace(/\s/gu, '').replace(/\b(\d+)\.(\d+)\b/gu,
            (_, whole: string, part: string) => '(' + (whole + part) + '/1' + '0'.repeat(part.length) + ')');
        this.tokens = this.source.match(/[A-Za-z][A-Za-z0-9_]*|\d+|[()+*/^\-]/gu) || [];
    }
    parse(): Fraction | null {
        if (this.source.length > 2048 || this.tokens.length > 320 || this.tokens.join('') !== this.source) return null;
        const result = this.sum();
        return this.index === this.tokens.length ? result : null;
    }
    private peek(): string { return this.tokens[this.index] || ''; }
    private take(): string { return this.tokens[this.index++] || ''; }
    private bound(value: Fraction): Fraction | null {
        return value.n <= 4 && value.d <= 4 && value.cost <= 100 ? value : null;
    }
    private sum(): Fraction | null {
        let left = this.product();
        while (left && ['+', '-'].includes(this.peek())) {
            const op = this.take(), right = this.product();
            if (!right) return null;
            left = this.bound({ numerator: '((' + left.numerator + ')*(' + right.denominator + ')' + op + '(' + right.numerator + ')*(' + left.denominator + '))',
                denominator: '(' + left.denominator + ')*(' + right.denominator + ')',
                n: Math.max(left.n + right.d, right.n + left.d), d: left.d + right.d, cost: 2 * (left.cost + right.cost) });
        }
        return left;
    }
    private divisor(value: Fraction): boolean {
        const polynomial = curvePolynomial(this.env, value.numerator);
        if (!polynomial || (polynomial.degree === 0 && curveSign(this.env, polynomial.coefficients[0]) === 0)) return false;
        const roots = curveRealRoots(this.env, value.numerator);
        if (!roots) return false;
        this.exclusions.push(...roots);
        return this.exclusions.length <= 12;
    }
    private product(): Fraction | null {
        let left = this.unary();
        while (left && ['*', '/'].includes(this.peek())) {
            const op = this.take(), right = this.unary();
            if (!right || op === '/' && !this.divisor(right)) return null;
            left = this.bound({ numerator: '(' + left.numerator + ')*(' + (op === '/' ? right.denominator : right.numerator) + ')',
                denominator: '(' + left.denominator + ')*(' + (op === '/' ? right.numerator : right.denominator) + ')',
                n: left.n + (op === '/' ? right.d : right.n), d: left.d + (op === '/' ? right.n : right.d), cost: left.cost + right.cost });
        }
        return left;
    }
    private unary(): Fraction | null {
        if (++this.depth > 32) return null;
        let result: Fraction | null;
        if (['+', '-'].includes(this.peek())) {
            const op = this.take(), value = this.unary();
            result = value && { ...value, numerator: '(' + op + value.numerator + ')' };
        } else result = this.power();
        this.depth--;
        return result;
    }
    private power(): Fraction | null {
        const base = this.primary();
        if (!base || this.peek() !== '^') return base;
        this.take();
        let parens = 0;
        while (this.peek() === '(' && parens < 32) { this.take(); parens++; }
        let sign = 1;
        if (this.peek() === '-') { this.take(); sign = -1; }
        else if (this.peek() === '+') this.take();
        const token = this.take();
        if (!/^[0-4]$/u.test(token)) return null;
        for (let i = 0; i < parens; i++) if (this.take() !== ')') return null;
        const exponent = sign * Number(token);
        if (exponent <= 0 && !this.divisor(base)) return null;
        if (exponent === 0) return { numerator: '1', denominator: '1', n: 0, d: 0, cost: base.cost };
        const power = Math.abs(exponent), inverse = exponent < 0;
        return this.bound({ numerator: '(' + (inverse ? base.denominator : base.numerator) + ')^' + power,
            denominator: '(' + (inverse ? base.numerator : base.denominator) + ')^' + power,
            n: (inverse ? base.d : base.n) * power, d: (inverse ? base.n : base.d) * power, cost: base.cost * power });
    }
    private primary(): Fraction | null {
        const token = this.take();
        if (/^\d+$/u.test(token)) return { numerator: token, denominator: '1', n: 0, d: 0, cost: 1 };
        if (token === this.env.variable) return { numerator: token, denominator: '1', n: 1, d: 0, cost: 1 };
        if (token !== '(') return null;
        const result = this.sum();
        return this.take() === ')' ? result : null;
    }
}
function rational(env: CurveEnvironment, expression = env.expression): Rational | null {
    const parser = new RationalParser(env, expression), fraction = parser.parse();
    if (!fraction) return null;
    const reducedN = simple(env, fraction.numerator), reducedD = simple(env, fraction.denominator);
    const numerator = reducedN === null ? null : curvePolynomial(env, reducedN), denominator = reducedD === null ? null : curvePolynomial(env, reducedD);
    const excluded = unique(env, parser.exclusions);
    return numerator && denominator && excluded ? { numerator, denominator, excluded } : null;
}
function rationalValue(env: CurveEnvironment, model: Rational, value: string): string | null {
    for (const excluded of model.excluded) if (curveEqual(env, value, excluded) !== false) return null;
    const numerator = curveSubstitute(env, model.numerator.expression, value);
    const denominator = curveSubstitute(env, model.denominator.expression, value);
    if (numerator === null || denominator === null || curveSign(env, denominator) === 0) return null;
    return simple(env, '(' + numerator + ')/(' + denominator + ')');
}
function clean(source: string): string {
    return curveClean(source).replace(/\\(?:text|mathrm|operatorname)\s*\{([^{}]*)\}/gu, '$1')
        .replace(/\\(?:left|right)/gu, '').replace(/\\(?:quad|qquad|,|;|!)/gu, '')
        .replace(/\\mathbb\{R\}|ℝ/gu, 'R').replace(/\\(?:varnothing|emptyset)|∅/gu, '{}')
        .replace(/\\setminus|\u2216/gu, '~').replace(/\\([{}])/gu, '$1').replace(/\s/gu, '');
}
function splitTop(source: string, separators: string[]): string[] {
    const out: string[] = [];
    let depth = 0, start = 0;
    for (let i = 0; i < source.length; i++) {
        if ('({['.includes(source[i])) depth++;
        if (')}]'.includes(source[i])) depth--;
        if (depth === 0 && separators.includes(source[i])) { out.push(source.slice(start, i)); start = i + 1; }
    }
    out.push(source.slice(start));
    return out;
}
function finiteSet(source: string): string[] | null {
    const value = clean(source);
    if (!value.startsWith('{') || !value.endsWith('}')) return null;
    return value === '{}' ? [] : splitTop(value.slice(1, -1), [';', ',']);
}
function exactSet(env: CurveEnvironment, given: string[], expected: string[]): Proof {
    if (given.length !== expected.length) return false;
    const unused = [...expected];
    for (const source of given) {
        const value = curveConstant(env, source);
        if (value === null) return null;
        let found = -1, unknown = false;
        for (let i = 0; i < unused.length; i++) {
            const equal = curveEqual(env, value, unused[i]);
            if (equal) { found = i; break; }
            if (equal === null) unknown = true;
        }
        if (found < 0) return unknown ? null : false;
        unused.splice(found, 1);
    }
    return true;
}
function setTex(values: string[]): string { return values.length ? '\\{' + values.map(curveTex).join(';') + '\\}' : '\\varnothing'; }
function domainTex(excluded: string[]): string { return '\\mathbb{R}' + (excluded.length ? '\\setminus' + setTex(excluded) : ''); }
function domainProof(env: CurveEnvironment, source: string, excluded: string[]): Proof {
    const value = clean(source);
    if (value === 'R' || value === '(-\\infty;\\infty)' || value === '(-∞;∞)') return excluded.length === 0;
    const match = /^R~(\{.*\})$/u.exec(value);
    const entries = match && finiteSet(match[1]);
    return entries ? exactSet(env, entries, excluded) : null;
}
function oneResult(expectedLines: string[], required: string[], checker: (source: string) => CurveLineResult | null): CurveTaskModel {
    return { expectedLines, required, checkLine: checker };
}
function result(proof: Proof, target?: string): CurveLineResult {
    return { proof, ...(proof && target ? { targets: [target] } : {}) };
}


function domainTask(env: CurveEnvironment, model: Rational): CurveTaskModel | null {
    const interval = env.context.interval ? intervalBounds(env) : null;
    if (env.context.interval && !interval) return null;
    const excluded: string[] = [];
    for (const value of model.excluded) {
        const membership = inInterval(env, value);
        if (membership === null) return null;
        if (membership) excluded.push(value);
    }
    const expected = interval ? rangeTex(interval) + (excluded.length ? '\\setminus' + setTex(excluded) : '') : domainTex(excluded);
    return oneResult(['D=' + expected], ['domain'], source => {
        const match = /^(D(?:_\{?[A-Za-z]\}?)?|Definitionsbereich)=(.+)$/u.exec(clean(source));
        if (!match) return null;
        const owner = /^D_\{?([A-Za-z])\}?$/u.exec(match[1]);
        if (owner && owner[1] !== env.name) return result(false);
        if (!interval) return result(domainProof(env, match[2], excluded), 'domain');
        const pieces = match[2].split('~');
        if (pieces.length > 2) return result(null);
        const entries = pieces.length === 1 ? [] : finiteSet(pieces[1]);
        if (!entries) return result(null);
        const submitted = entries.map(value => curveConstant(env, value));
        if (submitted.some(value => value === null)) return result(null);
        const bounds = /^([\[(])(.+)[;,](.+)([\])])$/u.exec(pieces[0]);
        let candidate: RealRange;
        if (pieces[0] === 'R') candidate = { lower: { value: '-inf', closed: false }, upper: { value: 'inf', closed: false } };
        else {
            if (!bounds) return result(null);
            const lower = boundValue(env, bounds[2]), upper = boundValue(env, bounds[3]);
            if (lower === null || upper === null) return result(null);
            candidate = { lower: { value: lower, closed: bounds[1] === '[' }, upper: { value: upper, closed: bounds[4] === ']' } };
        }
        const lower = compare(env, candidate.lower.value, interval.lower.value);
        const upper = compare(env, candidate.upper.value, interval.upper.value);
        if (lower === null || upper === null) return result(null);
        if (lower !== 0 || upper !== 0) return result(false);
        const actual = canonicalIntervalDomain(env, candidate, submitted as string[]);
        const wanted = canonicalIntervalDomain(env, interval, excluded);
        if (!actual || !wanted) return result(null);
        if (actual.range.lower.closed !== wanted.range.lower.closed || actual.range.upper.closed !== wanted.range.upper.closed) return result(false);
        return result(exactSet(env, actual.excluded, wanted.excluded), 'domain');
    });
}
/** Removing an interval endpoint is equivalent to writing that endpoint open.
 * Exclusions outside the interval are mathematically redundant. */
function canonicalIntervalDomain(env: CurveEnvironment, source: RealRange, values: string[]): { range: RealRange; excluded: string[] } | null {
    const range = { lower: { ...source.lower }, upper: { ...source.upper } };
    if ((range.lower.value === '-inf' && range.lower.closed) || (range.upper.value === 'inf' && range.upper.closed)) return null;
    const excluded: string[] = [];
    for (const value of values) {
        const lower = compare(env, value, range.lower.value), upper = compare(env, value, range.upper.value);
        if (lower === null || upper === null) return null;
        if (lower < 0 || upper > 0) continue;
        if (lower === 0) { range.lower.closed = false; continue; }
        if (upper === 0) { range.upper.closed = false; continue; }
        excluded.push(value);
    }
    const deduplicated = unique(env, excluded);
    return deduplicated && { range, excluded: deduplicated };
}
function simplificationCost(env: CurveEnvironment, expression: string): number {
    const tokens = expression.match(/[A-Za-z][A-Za-z0-9_]*|\d+|[+*/^\-]/gu) || [];
    return tokens.reduce((sum, token) => sum + (token === env.variable ? 10 : 1), 0);
}
function simplifyTask(env: CurveEnvironment, model: Rational): CurveTaskModel | null {
    const value = simple(env, env.expression);
    if (value === null) return null;
    const domain = domainTask(env, model);
    if (!domain) return null;
    const expectedLines = [env.name + '(' + env.variable + ')=' + curveTex(value)];
    const required = ['simplify'];
    if (model.excluded.length || env.context.interval) { expectedLines.push(...domain.expectedLines); required.push('domain'); }
    return oneResult(expectedLines, required, source => {
        const domainLine = domain.checkLine(source);
        if (domainLine) return domainLine;
        const definition = /^\s*([A-Za-z])\s*\(\s*([A-Za-z])\s*\)\s*=\s*(.+)$/u.exec(source);
        if (definition && (definition[1] !== env.name || definition[2] !== env.variable)) return result(false);
        const expression = normalizeCurveExpression(definition ? definition[3] : source, env);
        if (expression === null) return null;
        const other = rational(env, expression);
        if (!other) return result(null);
        // An answer may inherit original exclusions but must not add new holes.
        for (const excluded of other.excluded) {
            const membership = model.excluded.map(item => curveEqual(env, excluded, item));
            if (!membership.includes(true)) return result(membership.includes(null) ? null : false);
        }
        const proof = curveEqual(env, env.expression, expression);
        const simplified = simplificationCost(env, expression) <= simplificationCost(env, value);
        return result(proof, simplified ? 'simplify' : undefined);
    });
}
function compare(env: CurveEnvironment, first: string, second: string): -1 | 0 | 1 | null {
    if (first === second) return 0;
    if (first === '-inf' || second === 'inf') return -1;
    if (first === 'inf' || second === '-inf') return 1;
    return curveSign(env, '(' + first + ')-(' + second + ')');
}
function infinity(source: string): string | null {
    const value = clean(source).replace(/\\?infty|\u221e|infinity/giu, 'inf');
    return value === 'inf' || value === '+inf' ? 'inf' : value === '-inf' ? '-inf' : null;
}
function boundValue(env: CurveEnvironment, source: string): string | null { return infinity(source) ?? curveConstant(env, source); }
function intervalBounds(env: CurveEnvironment): RealRange | null {
    const interval = env.context.interval;
    if (!interval) return { lower: { value: '-inf', closed: false }, upper: { value: 'inf', closed: false } };
    const lower = boundValue(env, interval.lower), upper = boundValue(env, interval.upper);
    if (lower === null || upper === null || compare(env, lower, upper) !== -1 ||
        lower === 'inf' || upper === '-inf' || lower === '-inf' && interval.lowerClosed || upper === 'inf' && interval.upperClosed) return null;
    return { lower: { value: lower, closed: interval.lowerClosed }, upper: { value: upper, closed: interval.upperClosed } };
}
function inInterval(env: CurveEnvironment, value: string): Proof {
    const bounds = intervalBounds(env);
    if (!bounds) return null;
    const lower = compare(env, value, bounds.lower.value), upper = compare(env, value, bounds.upper.value);
    if (lower === null || upper === null) return null;
    return (lower > 0 || lower === 0 && bounds.lower.closed) && (upper < 0 || upper === 0 && bounds.upper.closed);
}
function polynomialInfinity(env: CurveEnvironment, p: NumericPolynomial, side: 'inf' | '-inf'): string | null {
    if (p.degree === 0) return p.coefficients[0];
    const sign = curveSign(env, p.coefficients[p.degree]);
    if (sign === null || sign === 0) return null;
    return sign * (side === '-inf' && p.degree % 2 ? -1 : 1) > 0 ? 'inf' : '-inf';
}
function extendedTex(value: string): string { return value === 'inf' ? '\\infty' : value === '-inf' ? '-\\infty' : value === 'dne' ? '\\text{existiert nicht}' : curveTex(value); }
function rangeTex(range: RealRange): string {
    if (range.lower.value === '-inf' && range.upper.value === 'inf') return '\\mathbb{R}';
    if (range.lower.value === range.upper.value) return setTex([range.lower.value]);
    return (range.lower.closed ? '[' : '(') + extendedTex(range.lower.value) + ';' + extendedTex(range.upper.value) + (range.upper.closed ? ']' : ')');
}
function rangeProof(env: CurveEnvironment, source: string, expected: RealRange): Proof {
    const value = clean(source);
    if (value === 'R') return expected.lower.value === '-inf' && expected.upper.value === 'inf';
    const singleton = finiteSet(value);
    if (singleton) return compare(env, expected.lower.value, expected.upper.value) === 0 ? exactSet(env, singleton, [expected.lower.value]) : false;
    const match = /^([\[(])(.+)[;,](.+)([\])])$/u.exec(value);
    if (!match) return null;
    const lower = boundValue(env, match[2]), upper = boundValue(env, match[3]);
    if (lower === null || upper === null) return null;
    const first = compare(env, lower, expected.lower.value), second = compare(env, upper, expected.upper.value);
    if (first === null || second === null) return null;
    return first === 0 && second === 0 && (match[1] === '[') === expected.lower.closed && (match[4] === ']') === expected.upper.closed;
}
function polynomialRange(env: CurveEnvironment, model: Rational): RealRange | null {
    if (model.excluded.length || model.denominator.degree !== 0) return null;
    const polynomial = curvePolynomial(env, env.expression), bounds = intervalBounds(env);
    if (!polynomial || !bounds) return null;
    if (polynomial.degree === 0) return { lower: { value: polynomial.coefficients[0], closed: true }, upper: { value: polynomial.coefficients[0], closed: true } };
    const derivative = cas(env, 'd(' + env.expression + ',' + env.variable + ')');
    const roots = derivative === null ? null : curveRealRoots(env, derivative);
    if (roots === null) return null;
    const candidates: Bound[] = [];
    for (const root of roots) {
        const membership = inInterval(env, root);
        if (membership === null) return null;
        if (membership) {
            const value = rationalValue(env, model, root);
            if (value === null) return null;
            candidates.push({ value, closed: true });
        }
    }
    for (const bound of [bounds.lower, bounds.upper]) {
        const value = bound.value === '-inf' || bound.value === 'inf' ? polynomialInfinity(env, polynomial, bound.value) : rationalValue(env, model, bound.value);
        if (value === null) return null;
        candidates.push({ value, closed: bound.closed });
    }
    let lower = candidates[0], upper = candidates[0];
    for (const candidate of candidates.slice(1)) {
        const low = compare(env, candidate.value, lower.value), high = compare(env, candidate.value, upper.value);
        if (low === null || high === null) return null;
        if (low < 0 || low === 0 && candidate.closed) lower = candidate;
        if (high > 0 || high === 0 && candidate.closed) upper = candidate;
    }
    return { lower, upper };
}
function rangeTask(env: CurveEnvironment, model: Rational): CurveTaskModel | null {
    const range = polynomialRange(env, model);
    if (!range) return null;
    return oneResult(['W=' + rangeTex(range)], ['range'], source => {
        const match = /^(W(?:_\{?[A-Za-z]\}?)?|Wertebereich)=(.+)$/u.exec(clean(source));
        if (!match) return null;
        const owner = /^W_\{?([A-Za-z])\}?$/u.exec(match[1]);
        if (owner && owner[1] !== env.name) return result(false);
        return result(rangeProof(env, match[2], range), 'range');
    });
}
function symmetryTask(env: CurveEnvironment, model: Rational): CurveTaskModel | null {
    if (env.context.interval) return null;
    const reflected = cas(env, 'subst((-(' + env.variable + ')),' + env.variable + ',(' + env.expression + '))');
    if (reflected === null) return null;
    const domainSymmetric = exactSet(env, model.excluded.map(value => '-(' + value + ')'), model.excluded);
    if (domainSymmetric === null) return null;
    const reflectedN = cas(env, 'subst((-(' + env.variable + ')),' + env.variable + ',(' + model.numerator.expression + '))');
    const reflectedD = cas(env, 'subst((-(' + env.variable + ')),' + env.variable + ',(' + model.denominator.expression + '))');
    if (reflectedN === null || reflectedD === null) return null;
    const left = '(' + reflectedN + ')*(' + model.denominator.expression + ')';
    const right = '(' + model.numerator.expression + ')*(' + reflectedD + ')';
    const even = domainSymmetric && curveEqual(env, left, right);
    const odd = domainSymmetric && curveEqual(env, left, '-(' + right + ')');
    if (even === null || odd === null) return null;
    const value = even && odd ? 'achsen- und punktsymmetrisch' : even ? 'achsensymmetrisch' : odd ? 'punktsymmetrisch' : 'keine Symmetrie';
    return oneResult(['\\text{Symmetrie: ' + value + '}'], ['symmetry'], source => {
        const text = clean(source).toLowerCase().replace(/^symmetrie[:=]?/u, '');
        const classification = /^(?:achsen-undpunktsymmetrisch|geradeundungerade|beides)$/u.test(text) ? 'both' :
            /^(?:achsensymmetrisch(?:zur(?:y-achse|yachse))?|gerade)$/u.test(text) ? 'even' :
            /^(?:punktsymmetrisch(?:zumursprung)?|ungerade)$/u.test(text) ? 'odd' : /^(?:keinesymmetrie|keine|wedernoch)$/u.test(text) ? 'none' : null;
        if (classification) return result(classification === (even && odd ? 'both' : even ? 'even' : odd ? 'odd' : 'none'), 'symmetry');
        const match = /^([A-Za-z])\(-([A-Za-z])\)=(.+)$/u.exec(clean(source));
        if (!match || match[1] !== env.name || match[2] !== env.variable) return null;
        const rhs = match[3].replace(new RegExp(env.name + '\\(' + env.variable + '\\)', 'gu'), '(' + env.expression + ')');
        const expression = normalizeCurveExpression(rhs, env);
        return expression === null ? result(null) : result(curveEqual(env, reflected, expression));
    });
}
function periodicityTask(env: CurveEnvironment, model: Rational): CurveTaskModel | null {
    if (env.context.interval) return null;
    const numeratorCoefficients = model.numerator.coefficients;
    const denominatorCoefficients = model.denominator.coefficients;
    const index = denominatorCoefficients.findIndex(value => curveSign(env, value) !== 0);
    if (index < 0) return null;
    const ratio = simple(env, '(' + (numeratorCoefficients[index] || '0') + ')/(' + denominatorCoefficients[index] + ')');
    if (ratio === null) return null;
    let constant = true;
    for (let i = 0; i < Math.max(numeratorCoefficients.length, denominatorCoefficients.length); i++) {
        const equal = curveEqual(env, numeratorCoefficients[i] || '0', '(' + ratio + ')*(' + (denominatorCoefficients[i] || '0') + ')');
        if (equal === null) return null;
        if (!equal) constant = false;
    }
    // Nonconstant rational functions have no positive period. A nonempty finite
    // set of excluded arguments also prevents a nonzero translation.
    const every = !model.excluded.length && constant;
    return oneResult(['\\text{' + (every ? 'Jede positive Zahl ist eine Periode' : 'Nicht periodisch') + '}'], ['periodicity'], source => {
        const text = clean(source).toLowerCase().replace(/^periodizit[aä]t[:=]?/u, '');
        if (/^(?:nichtperiodisch|keineperiode|keineperiodizit[aä]t)$/u.test(text)) return result(!every, 'periodicity');
        if (/^(?:jedepositivezahlist(?:eine)?periode|konstant|konstantefunktion|keinegrundperiode)$/u.test(text)) return result(every, 'periodicity');
        const match = /^T=(.+)$/u.exec(clean(source));
        if (!match) return null;
        const value = curveConstant(env, match[1]);
        const sign = value === null ? null : curveSign(env, value);
        // A chosen period of a constant function is true, but does not establish
        // the requested classification: it has no smallest positive period.
        return result(sign === null ? null : every && sign > 0);
    });
}


function pointTex(point: Point): string { return '(' + curveTex(point.x) + '|' + curveTex(point.y) + ')'; }
function pointsTex(points: Point[]): string { return points.length ? '\\{' + points.map(pointTex).join(';') + '\\}' : '\\varnothing'; }
function point(source: string): Point | null {
    const value = clean(source).replace(/^[A-Za-z](?:_\{?\d+\}?)?=?/u, '');
    if (!value.startsWith('(') || !value.endsWith(')')) return null;
    const pieces = splitTop(value.slice(1, -1), ['|', ';', ',']);
    return pieces.length === 2 ? { x: pieces[0], y: pieces[1] } : null;
}
function pointSetProof(env: CurveEnvironment, source: string, expected: Point[]): Proof {
    const entries = finiteSet(source), single = point(source);
    const given = entries ? entries.map(point) : single ? [single] : null;
    if (!given) return null;
    if (given.length !== expected.length) return false;
    const unused = [...expected];
    for (const entry of given) {
        if (!entry) return null;
        const x = curveConstant(env, entry.x), y = curveConstant(env, entry.y);
        if (x === null || y === null) return null;
        let found = -1, unknown = false;
        for (let i = 0; i < unused.length; i++) {
            const eqX = curveEqual(env, x, unused[i].x), eqY = curveEqual(env, y, unused[i].y);
            if (eqX && eqY) { found = i; break; }
            if (eqX !== false && eqY !== false) unknown = true;
        }
        if (found < 0) return unknown ? null : false;
        unused.splice(found, 1);
    }
    return true;
}
function intersectionsTask(env: CurveEnvironment, model: Rational, axes: boolean): CurveTaskModel | null {
    let other: Rational | null = null;
    if (!axes) {
        const raw = env.context.secondFunction;
        if (!raw) return null;
        const definition = /^\s*([A-Za-z])\s*\(\s*([A-Za-z])\s*\)\s*=\s*(.+)$/u.exec(raw);
        if (definition && definition[2] !== env.variable) return null;
        const source = definition ? definition[3] : raw;
        const expression = normalizeCurveExpression(source, env);
        other = expression === null ? null : rational(env, expression);
        if (!other) return null;
    }
    const equation = other ? '(' + model.numerator.expression + ')*(' + other.denominator.expression + ')-(' + other.numerator.expression + ')*(' + model.denominator.expression + ')' : model.numerator.expression;
    const reducedEquation = simple(env, equation);
    const polynomial = reducedEquation === null ? null : curvePolynomial(env, reducedEquation);
    if (!polynomial || polynomial.degree === 0 && curveSign(env, polynomial.coefficients[0]) === 0) return null;
    const roots = curveRealRoots(env, reducedEquation!);
    if (roots === null) return null;
    const points: Point[] = [];
    for (const root of roots) {
        const membership = inInterval(env, root);
        if (membership === null) return null;
        if (!membership || [...model.excluded, ...(other?.excluded || [])].some(value => curveEqual(env, value, root) === true)) continue;
        const y = rationalValue(env, model, root);
        if (y === null || other && rationalValue(env, other, root) === null) return null;
        points.push({ x: root, y });
    }
    if (axes) {
        const membership = inInterval(env, '0');
        if (membership === null) return null;
        const value = rationalValue(env, model, '0');
        if (membership && value !== null && !points.some(entry => curveEqual(env, entry.x, '0') === true)) points.push({ x: '0', y: value });
    }
    const target = axes ? 'intercepts' : 'intersections';
    const required = points.length ? points.map((_, index) => target + ':point:' + index)
        : axes ? [target + ':empty:x', target + ':empty:y'] : [target + ':empty'];
    const pointLabels = new Map<string, number>();
    return oneResult(['S=' + pointsTex(points)], required, source => {
        const text = clean(source);
        if (axes) {
            const axis = /^S_(?:\{([xy])\}|([xy]))=(.+)$/u.exec(text);
            if (axis) {
                const xAxis = (axis[1] || axis[2]) === 'x';
                const indices = points.map((value, index) => ({ value, index })).filter(({ value }) =>
                    curveEqual(env, xAxis ? value.y : value.x, '0') === true);
                const proof = pointSetProof(env, axis[3], indices.map(({ value }) => value));
                const targets = points.length ? indices.map(({ index }) => required[index]) : [target + ':empty:' + (xAxis ? 'x' : 'y')];
                return { proof, ...(proof ? { targets } : {}) };
            }
        }
        const match = /^(?:S|Schnittpunkte|Achsenschnittpunkte)=(.+)$/u.exec(text);
        if (match) {
            const proof = pointSetProof(env, match[1], points);
            return { proof, ...(proof ? { targets: required } : {}) };
        }
        // A labelled individual point asserts membership, while S={...} asserts
        // completeness. Multiple individual points can jointly finish the task.
        if (!/^[PSN](?:_?\{?\d+\}?)?\(?/u.test(text)) return null;
        const named = text.replace(/^([PSN])(\d+)/u, '$1_$2');
        const value = point(named);
        const label = /^([PSN])(?:_\{?(\d+)\}?)?(?:=)?\(/u.exec(named);
        if (!value || !label) return null;
        if (label[1] === 'N') {
            const ordinate = curveConstant(env, value.y);
            if (ordinate === null) return result(null);
            const isZero = curveEqual(env, ordinate, '0');
            if (isZero !== true) return result(isZero);
        }
        const identity = label[1] + (label[2] || '');
        let uncertain = false;
        for (let i = 0; i < points.length; i++) {
            const proof = pointSetProof(env, pointTex(value), [points[i]]);
            if (proof) {
                const previous = pointLabels.get(identity);
                if (previous !== undefined && previous !== i) return result(false);
                pointLabels.set(identity, i);
                return result(true, required[i]);
            }
            if (proof === null) uncertain = true;
        }
        return result(uncertain ? null : false);
    });
}
function localOrder(env: CurveEnvironment, polynomial: NumericPolynomial, value: string): { order: number; coefficient: string } | null {
    let expression = polynomial.expression;
    for (let order = 0; order <= polynomial.degree; order++) {
        const coefficient = curveSubstitute(env, expression, value);
        if (coefficient === null) return null;
        const sign = curveSign(env, coefficient);
        if (sign === null) return null;
        if (sign !== 0) return { order, coefficient };
        expression = cas(env, 'd(' + expression + ',' + env.variable + ')') || '';
        if (!expression) return null;
    }
    return { order: Infinity, coefficient: '0' };
}
function rationalLimit(env: CurveEnvironment, model: Rational, value: string, side: 'left' | 'right' | 'both'): string | null {
    if (value === 'inf' || value === '-inf') {
        const difference = model.numerator.degree - model.denominator.degree;
        if (difference < 0) return '0';
        const ratio = simple(env, '(' + model.numerator.coefficients[model.numerator.degree] + ')/(' + model.denominator.coefficients[model.denominator.degree] + ')');
        if (ratio === null || difference === 0) return ratio;
        const sign = curveSign(env, ratio);
        if (sign === null) return null;
        if (sign === 0) return '0';
        return sign * (value === '-inf' && difference % 2 ? -1 : 1) > 0 ? 'inf' : '-inf';
    }
    const numerator = localOrder(env, model.numerator, value), denominator = localOrder(env, model.denominator, value);
    if (!numerator || !denominator || denominator.order === Infinity) return null;
    const difference = numerator.order - denominator.order;
    if (difference > 0) return '0';
    const ratio = simple(env, '(' + numerator.coefficient + ')/(' + denominator.coefficient + ')');
    if (ratio === null || difference === 0) return ratio;
    if (side === 'both' && difference % 2 !== 0) return 'dne';
    const sign = curveSign(env, ratio);
    if (sign === null || sign === 0) return null;
    return sign * (side === 'left' && difference % 2 !== 0 ? -1 : 1) > 0 ? 'inf' : '-inf';
}
function limitTask(env: CurveEnvironment, model: Rational): CurveTaskModel | null {
    if (!env.context.point || env.context.interval) return null;
    const value = boundValue(env, env.context.point);
    if (value === null) return null;
    const side = env.context.side || 'both', expected = rationalLimit(env, model, value, side);
    if (expected === null) return null;
    const suffix = value === 'inf' || value === '-inf' ? '' : side === 'left' ? '^-' : side === 'right' ? '^+' : '';
    const lhs = '\\lim_{' + env.variable + '\\to ' + extendedTex(value) + suffix + '}' + env.name + '(' + env.variable + ')';
    return oneResult([lhs + '=' + extendedTex(expected)], ['limit'], source => {
        const parts = splitTop(clean(source), ['=']);
        if (parts.length !== 2) return null;
        if (!['L', 'Grenzwert', 'lim'].includes(parts[0])) {
            const authored = clean(lhs), expressionLhs = clean(lhs.replace(env.name + '(' + env.variable + ')', curveTex(env.expression)));
            if (parts[0] !== authored && parts[0] !== expressionLhs) return null;
        }
        const answer = /^(?:existiertnicht|nichtdefiniert|dne|DNE)$/u.test(parts[1]) ? 'dne' : boundValue(env, parts[1]);
        if (answer === null) return result(null);
        if (['inf', '-inf', 'dne'].includes(expected) || ['inf', '-inf', 'dne'].includes(answer)) return result(answer === expected, 'limit');
        return result(curveEqual(env, answer, expected), 'limit');
    });
}
function singularities(env: CurveEnvironment, model: Rational): { holes: Point[]; poles: string[] } | null {
    const holes: Point[] = [], poles: string[] = [];
    for (const x of model.excluded) {
        const value = rationalLimit(env, model, x, 'right');
        if (value === null || value === 'dne') return null;
        if (value === 'inf' || value === '-inf') poles.push(x);
        else holes.push({ x, y: value });
    }
    return { holes, poles };
}
function discontinuitiesTask(env: CurveEnvironment, model: Rational): CurveTaskModel | null {
    if (env.context.interval) return null;
    const values = singularities(env, model);
    if (!values) return null;
    return oneResult(['\\text{Hebbare Luecken}=' + pointsTex(values.holes), '\\text{Polstellen}=' + setTex(values.poles)], ['holes', 'poles'], source => {
        const match = /^([^=]+)=(.+)$/u.exec(clean(source));
        if (!match) return null;
        const label = match[1].toLowerCase();
        if (['hebbar', 'hebbareluecken', 'hebbarelücken', 'luecken', 'lücken'].includes(label)) return result(pointSetProof(env, match[2], values.holes), 'holes');
        if (['polstellen', 'pole'].includes(label)) {
            const entries = finiteSet(match[2]);
            return result(entries ? exactSet(env, entries, values.poles) : null, 'poles');
        }
        return null;
    });
}
function polynomialQuotient(env: CurveEnvironment, model: Rational): string | null {
    const coefficients = [...model.numerator.coefficients];
    const quotient: string[] = [];
    for (let degree = model.numerator.degree - model.denominator.degree; degree >= 0; degree--) {
        const leading = simple(env, '(' + coefficients[degree + model.denominator.degree] + ')/(' + model.denominator.coefficients[model.denominator.degree] + ')');
        if (leading === null) return null;
        quotient.push('(' + leading + ')*' + env.variable + '^' + degree);
        for (let j = 0; j <= model.denominator.degree; j++) {
            const value = simple(env, '(' + coefficients[degree + j] + ')-(' + leading + ')*(' + model.denominator.coefficients[j] + ')');
            if (value === null) return null;
            coefficients[degree + j] = value;
        }
    }
    return simple(env, quotient.join('+') || '0');
}
function asymptotesTask(env: CurveEnvironment, model: Rational): CurveTaskModel | null {
    // The ordinate is named y in this answer contract. It must remain distinct
    // from the independent variable so a vertical line cannot name both axes.
    if (env.context.interval || env.variable === 'y') return null;
    const values = singularities(env, model);
    if (!values) return null;
    // Asymptotes here are straight lines, not polynomial approximants.
    const needsQuotient = model.numerator.degree - model.denominator.degree <= 1;
    const horizontal = needsQuotient ? polynomialQuotient(env, model) : null;
    if (needsQuotient && horizontal === null) return null;
    const expected = values.poles.map(value => env.variable + '=' + curveTex(value));
    if (horizontal !== null) expected.push('y=' + curveTex(horizontal));
    const required = values.poles.map((_, index) => 'asymptotes:vertical:' + index);
    if (horizontal !== null) required.push('asymptotes:line');
    if (!required.length) required.push('asymptotes:empty');
    return oneResult(['A=' + (expected.length ? '\\{' + expected.join(';') + '\\}' : '\\varnothing')], required, source => {
        const text = clean(source);
        const match = /^(?:A|Asymptoten)=(.+)$/u.exec(text);
        if (!match) {
            const line = /^([A-Za-z])=(.+)$/u.exec(text);
            if (!line) return null;
            if (line[1] === env.variable) {
                const value = curveConstant(env, line[2]);
                if (value === null) return result(null);
                let uncertain = false;
                for (let i = 0; i < values.poles.length; i++) {
                    const proof = curveEqual(env, value, values.poles[i]);
                    if (proof) return result(true, required[i]);
                    if (proof === null) uncertain = true;
                }
                return result(uncertain ? null : false);
            }
            if (line[1] !== 'y') return null;
            if (horizontal === null) return result(false);
            const expression = normalizeCurveExpression(line[2], env);
            if (expression === null) return result(null);
            const lineModel = rational(env, expression);
            if (!lineModel || lineModel.excluded.length || lineModel.denominator.degree !== 0 || lineModel.numerator.degree > 1) return result(false);
            return result(curveEqual(env, expression, horizontal), 'asymptotes:line');
        }
        const entries = finiteSet(match[1]);
        if (!entries) return result(null);
        if (entries.length !== expected.length) return result(false);
        const vertical: string[] = [], slanted: string[] = [];
        for (const entry of entries) {
            const line = /^([A-Za-z])=(.+)$/u.exec(entry);
            if (!line) return result(null);
            if (line[1] === env.variable) vertical.push(line[2]);
            else if (line[1] === 'y') slanted.push(line[2]);
            else return result(false);
        }
        const verticalProof = exactSet(env, vertical, values.poles);
        if (verticalProof !== true) return result(verticalProof);
        if (slanted.length !== (horizontal === null ? 0 : 1)) return result(false);
        if (horizontal === null) return { proof: true, targets: required };
        const expression = normalizeCurveExpression(slanted[0], env);
        if (expression === null) return result(null);
        const lineModel = rational(env, expression);
        if (!lineModel || lineModel.excluded.length || lineModel.denominator.degree !== 0 || lineModel.numerator.degree > 1) return result(false);
        const proof = curveEqual(env, expression, horizontal);
        return { proof, ...(proof ? { targets: required } : {}) };
    });
}

/** One affine sine/cosine/tangent with affine output; exact fundamental period.
 * The argument is inspected, never inferred from samples. */
function trigPeriodicityTask(env: CurveEnvironment): CurveTaskModel | null {
    if (env.context.interval) return null;
    const matches = [...env.expression.matchAll(/\b(sin|cos|tan)\(/gu)];
    if (matches.length !== 1) return null;
    const match = matches[0], start = match.index!, open = start + match[1].length;
    let depth = 1, end = open + 1;
    for (; end < env.expression.length && depth; end++) {
        if (env.expression[end] === '(') depth++;
        if (env.expression[end] === ')') depth--;
    }
    if (depth) return null;
    const before = env.expression.slice(0, start), after = env.expression.slice(end);
    if (new RegExp('\\b' + env.variable + '\\b', 'u').test(before + after)) return null;
    const outer = curvePolynomial(env, before + env.variable + after);
    if (!outer || outer.degree > 1) return null;
    let argument = env.expression.slice(open + 1, end - 1);
    if (env.context.angleUnit === 'deg') {
        const degrees = simple(env, '(' + argument + ')*180/pi');
        if (degrees === null) return null;
        argument = degrees;
    }
    const affine = curvePolynomial(env, argument);
    // Check the original argument before dropping a zero amplitude. Otherwise
    // undefined arguments such as x^0 at zero would lose their exclusions.
    if (!affine || affine.degree > 1) return null;
    if (outer.degree === 0) {
        if (match[1] === 'tan') return null;
        const constantEnv = { ...env, expression: outer.coefficients[0] };
        const constantModel = rational(constantEnv);
        return constantModel && periodicityTask(constantEnv, constantModel);
    }
    if (affine.degree !== 1) return null;
    const sign = curveSign(env, affine.coefficients[1]);
    if (sign === null || sign === 0) return null;
    const period = simple(env, '(' + (env.context.angleUnit === 'deg' ? match[1] === 'tan' ? '180' : '360' : match[1] === 'tan' ? 'pi' : '2*pi') + ')/((' + sign + ')*(' + affine.coefficients[1] + '))');
    if (period === null) return null;
    return oneResult(['T=' + curveTex(period)], ['periodicity'], source => {
        const text = clean(source);
        if (/^(?:nichtperiodisch|keineperiode)$/iu.test(text)) return result(false);
        const answer = /^(?:T|Periode)=(.+)$/u.exec(text);
        if (!answer) return null;
        const value = curveConstant(env, answer[1]);
        return result(value === null ? null : curveEqual(env, value, period), 'periodicity');
    });
}

export function buildCurvePropertyTask(env: CurveEnvironment): CurveTaskModel | null {
    if (env.context.task === 'periodicity' && /\b(?:sin|cos|tan)\(/u.test(env.expression)) return trigPeriodicityTask(env);
    const model = rational(env);
    if (!model) return null;
    switch (env.context.task) {
        case 'simplify': return simplifyTask(env, model);
        case 'domain': return domainTask(env, model);
        case 'range': return rangeTask(env, model);
        case 'symmetry': return symmetryTask(env, model);
        case 'periodicity': return periodicityTask(env, model);
        case 'intercepts': return intersectionsTask(env, model, true);
        case 'intersections': return intersectionsTask(env, model, false);
        case 'limit': return limitTask(env, model);
        case 'discontinuities': return discontinuitiesTask(env, model);
        case 'asymptotes': return asymptotesTask(env, model);
        default: return null;
    }
}
