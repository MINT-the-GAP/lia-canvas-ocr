import {
    calculationProofTools as shared,
    type AlgebriteRuntime,
    type ParsedEquation,
    type Proof
} from './equivalence.ts';

export interface NumericPolynomial {
    variable: string | null;
    /** Exact rational CAS strings, in ascending degree order. */
    coefficients: readonly string[];
    degree: number;
    expression: string;
}

export interface CompleteRealSolutionProof {
    proof: Proof;
    kind: 'polynomial-roots';
    variable: string;
    complete: boolean;
    isIsolated: boolean;
    reason: 'complete-root-set' | 'missing-roots' | 'extraneous-roots' | 'unsupported';
    solutionCount?: number;
    solutions?: readonly string[];
}

type Sign = -1 | 0 | 1;
interface SafeExpression { cas: string; constant: boolean; sign: Sign | null; degree: number; cost: number; }
const MAX_SOURCE = 2048;
const MAX_TOKENS = 384;
const MAX_DEPTH = 32;

function rationalSign(value: string | null): Sign | null {
    if (value === null || value.length > 256) return null;
    const match = /^([+-]?\d+)(?:\/([+-]?\d+))?$/u.exec(value);
    if (!match || (match[2] !== undefined && !/[1-9]/u.test(match[2]))) return null;
    if (!/[1-9]/u.test(match[1])) return 0;
    return (match[1][0] === '-') !== (match[2]?.[0] === '-') ? -1 : 1;
}

function exactDecimals(value: string): string {
    return value.replace(/\b(\d+)\.(\d+)\b/gu, (_, whole: string, fraction: string) =>
        '(' + (whole + fraction).replace(/^0+(?=\d)/u, '') + '/1' + '0'.repeat(fraction.length) + ')');
}

function simplify(value: string, runtime: AlgebriteRuntime): string | null {
    return shared.casRun('simplify(rationalize(' + value + '))', runtime);
}

function zeroProof(value: string, runtime: AlgebriteRuntime): Proof {
    const result = simplify(value, runtime);
    const sign = rationalSign(result);
    if (sign !== null) return sign === 0;
    if (result === null) return null;
    const guarded = new DomainParser(result, runtime).parse();
    return guarded?.constant && guarded.sign !== null ? guarded.sign === 0 : null;
}

/** A small domain guard over the already normalized CAS grammar. It proves
 * every denominator nonzero before CAS simplification can cancel it. Radicals
 * are accepted only on proven nonnegative numeric inputs; variable radicals,
 * symbolic denominators, parameters and functions remain unsupported. */
class DomainParser {
    private readonly tokens: string[];
    private index = 0;
    private depth = 0;
    readonly variables = new Set<string>();

    private readonly source: string;
    private readonly runtime: AlgebriteRuntime;
    constructor(source: string, runtime: AlgebriteRuntime) {
        this.source = source;
        this.runtime = runtime;
        this.tokens = source.match(/sqrt|[A-Za-z][A-Za-z0-9_]*|\d+|[()+\-*/^]/gu) || [];
    }

    parse(): SafeExpression | null {
        if (!this.source || this.source.length > MAX_SOURCE || this.tokens.length > MAX_TOKENS ||
            this.tokens.join('') !== this.source) return null;
        const result = this.sum();
        return result && this.index === this.tokens.length ? result : null;
    }

    private numericSign(cas: string): Sign | null { return rationalSign(simplify(cas, this.runtime)); }
    private peek(): string { return this.tokens[this.index] || ''; }
    private take(): string { return this.tokens[this.index++] || ''; }

    private sum(): SafeExpression | null {
        let left = this.product();
        while (left && (this.peek() === '+' || this.peek() === '-')) {
            const operator = this.take();
            const right = this.product();
            if (!right) return null;
            const cas = '(' + left.cas + operator + right.cas + ')';
            const constant = left.constant && right.constant;
            const rightSign = right.sign === null ? null : operator === '-' ? -right.sign as Sign : right.sign;
            const sign = constant ? this.numericSign(cas) ??
                (left.sign === 0 ? rightSign : rightSign === 0 ? left.sign : left.sign === rightSign ? left.sign : null) : null;
            if (left.cost + right.cost > 128) return null;
            left = { cas, constant, sign, degree: Math.max(left.degree, right.degree), cost: left.cost + right.cost };
        }
        return left;
    }

    private product(): SafeExpression | null {
        let left = this.unary();
        while (left && (this.peek() === '*' || this.peek() === '/')) {
            const operator = this.take();
            const right = this.unary();
            if (!right || (operator === '/' && (!right.constant || right.sign === null || right.sign === 0))) return null;
            if (left.degree + right.degree > 4 || left.cost + right.cost > 128) return null;
            left = {
                degree: left.degree + right.degree, cost: left.cost + right.cost,
                cas: '(' + left.cas + operator + right.cas + ')',
                constant: left.constant && right.constant,
                sign: left.sign === null || right.sign === null ? null : left.sign * right.sign as Sign
            };
        }
        return left;
    }

    private unary(): SafeExpression | null {
        if (++this.depth > MAX_DEPTH) return null;
        let value: SafeExpression | null;
        if (this.peek() === '+' || this.peek() === '-') {
            const operator = this.take();
            const inner = this.unary();
            value = inner && {
                cas: '(' + operator + inner.cas + ')', constant: inner.constant, degree: inner.degree, cost: inner.cost,
                sign: inner.sign === null ? null : operator === '-' ? -inner.sign as Sign : inner.sign
            };
        } else value = this.power();
        this.depth--;
        return value;
    }

    private power(): SafeExpression | null {
        const base = this.primary();
        if (!base || this.peek() !== '^') return base;
        this.take();
        const exponent = this.unary();
        if (!exponent?.constant) return null;
        const simplified = simplify(exponent.cas, this.runtime);
        const integer = simplified !== null && /^-?\d+$/u.test(simplified) ? Number(simplified) : null;
        if (integer === null) {
            if (simplified !== '1/2' || !base.constant || base.sign === null || base.sign < 0) return null;
            return { cas: '(' + base.cas + ')^(1/2)', constant: true, sign: base.sign, degree: 0, cost: base.cost };
        }
        if (!Number.isInteger(integer) || Math.abs(integer) > 16 || base.degree * Math.max(0, integer) > 4 || base.cost * Math.max(1, Math.abs(integer)) > 128 ||
            (!base.constant && (integer <= 0 || integer > 4)) ||
            (integer <= 0 && (base.sign === 0 || (integer < 0 && base.sign === null)))) return null;
        return {
            cas: '(' + base.cas + ')^(' + integer + ')', constant: base.constant, degree: base.degree * Math.max(0, integer), cost: base.cost * Math.max(1, Math.abs(integer)),
            sign: integer === 0 ? 1 : base.sign === null ? null : integer % 2 === 0 ? (base.sign === 0 ? 0 : 1) : base.sign
        };
    }

    private primary(): SafeExpression | null {
        const token = this.take();
        if (/^\d+$/u.test(token)) return { cas: token, constant: true, sign: /[1-9]/u.test(token) ? 1 : 0, degree: 0, cost: 1 };
        if (/^[A-Za-z]$/u.test(token) && token !== 'e' && token !== 'i') {
            this.variables.add(token);
            return { cas: token, constant: false, sign: null, degree: 1, cost: 1 };
        }
        if (token === '(') {
            const value = this.sum();
            return this.take() === ')' ? value : null;
        }
        if (token !== 'sqrt' || this.take() !== '(') return null;
        const value = this.sum();
        if (!value?.constant || this.take() !== ')' || value.sign === null || value.sign < 0) return null;
        return { cas: 'sqrt(' + value.cas + ')', constant: true, sign: value.sign, degree: 0, cost: value.cost };
    }
}

function guardedEquation(source: ParsedEquation, runtime: AlgebriteRuntime): { expression: string; variable: string | null } | null {
    const leftParser = new DomainParser(exactDecimals(source.left.cas), runtime);
    const rightParser = new DomainParser(exactDecimals(source.right.cas), runtime);
    const left = leftParser.parse();
    const right = rightParser.parse();
    const variables = new Set([...leftParser.variables, ...rightParser.variables]);
    if (!left || !right || variables.size > 1) return null;
    return { expression: '((' + left.cas + ')-(' + right.cas + '))', variable: [...variables][0] || null };
}

export function analyzeNumericPolynomial(
    source: ParsedEquation,
    runtime: AlgebriteRuntime,
    maxDegree = 4
): NumericPolynomial | null {
    if (!Number.isInteger(maxDegree) || maxDegree < 0 || maxDegree > 4) return null;
    const guarded = guardedEquation(source, runtime);
    if (!guarded) return null;
    const expanded = shared.casRun('expand(' + guarded.expression + ')', runtime);
    if (expanded === null) return null;
    if (!guarded.variable) {
        const constant = simplify(expanded, runtime);
        return rationalSign(constant) === null ? null : {
            ...guarded, coefficients: [constant!], degree: 0
        };
    }
    const coefficients: string[] = [];
    for (let degree = 0; degree <= maxDegree; degree++) {
        const value = simplify('coeff(' + expanded + ',' + guarded.variable + ',' + degree + ')', runtime);
        if (rationalSign(value) === null) return null;
        coefficients.push(value!);
    }
    const reconstructed = coefficients.map((value, index) => '(' + value + ')*' + guarded.variable + '^' + index).join('+');
    if (zeroProof('(' + expanded + ')-(' + reconstructed + ')', runtime) !== true) return null;
    while (coefficients.length > 1 && rationalSign(coefficients[coefficients.length - 1]) === 0) coefficients.pop();
    return { ...guarded, coefficients, degree: coefficients.length - 1 };
}

/** A nonzero constant multiple proves equivalence even for a factored quartic.
 * Failure to be proportional is not proof of different solution sets. */
export function provePolynomialTransition(from: ParsedEquation, to: ParsedEquation, runtime: AlgebriteRuntime): Proof {
    const first = analyzeNumericPolynomial(from, runtime);
    const second = analyzeNumericPolynomial(to, runtime);
    if (!first || !second || (first.variable && second.variable && first.variable !== second.variable)) return null;
    if (first.degree === 0 && second.degree === 0) {
        return (rationalSign(first.coefficients[0]) === 0) === (rationalSign(second.coefficients[0]) === 0);
    }
    if (first.degree !== second.degree) return null;
    const multiplier = simplify('(' + first.coefficients[first.degree] + ')/(' + second.coefficients[second.degree] + ')', runtime);
    if (rationalSign(multiplier) === null || rationalSign(multiplier) === 0) return null;
    for (let index = 0; index <= first.degree; index++) {
        if (zeroProof('(' + first.coefficients[index] + ')-(' + multiplier + ')*(' + second.coefficients[index] + ')', runtime) !== true) return null;
    }
    return true;
}

interface RootTarget { values: string[]; isIsolated: boolean; allReals?: boolean; }

function cleanTarget(value: string): string {
    return value.trim().replace(/^\$([^]*?)\$$/u, '$1')
        .replace(/^(?:(?:⇒|⟹|→|⟶|=>|->|\\(?:Rarr|to|rightarrow|longrightarrow|Rightarrow|Longrightarrow|Leftrightarrow|implies)(?![A-Za-z]))\s*)+/u, '')
        .replace(/\\(?:left|right)(?![A-Za-z])/gu, '')
        .replace(/\\(?:qquad|quad|,|;|!| )/gu, ' ').trim();
}

function constantExpression(value: string, runtime: AlgebriteRuntime): string | null {
    const converted = shared.convertTexFragment(value);
    if (!converted) return null;
    const parsed = new DomainParser(exactDecimals(converted.cas), runtime).parse();
    return parsed?.constant ? parsed.cas : null;
}

function solveLinearTarget(value: string, variable: string, runtime: AlgebriteRuntime): { value: string; isIsolated: boolean } | null {
    const equation = shared.parseEquation(value);
    if (!equation) return null;
    const guarded = guardedEquation(equation, runtime);
    if (!guarded || guarded.variable !== variable) return null;
    const expanded = shared.casRun('expand(' + guarded.expression + ')', runtime);
    if (expanded === null) return null;
    const coefficient = simplify('coeff(' + expanded + ',' + variable + ',1)', runtime);
    const constant = simplify('coeff(' + expanded + ',' + variable + ',0)', runtime);
    if (rationalSign(coefficient) === null || rationalSign(coefficient) === 0 || constant === null) return null;
    const guardedConstant = new DomainParser(constant, runtime).parse();
    if (!guardedConstant?.constant || zeroProof('(' + expanded + ')-((' + coefficient + ')*' + variable + '+(' + constant + '))', runtime) !== true) return null;
    return {
        value: '((' + constant + ')/(-(' + coefficient + ')))',
        isIsolated: shared.isBareCalculationVariable(equation.left, variable) || shared.isBareCalculationVariable(equation.right, variable)
    };
}

function parseRootTarget(targetTex: string, variable: string, runtime: AlgebriteRuntime): RootTarget | null {
    if (!targetTex || targetTex.length > 512) return null;
    const source = cleanTarget(shared.splitLine(targetTex).equation);
    const solutionSet = /^(?:L|\\mathcal\{L\})(?:_(?:\{\\mathbb\{R\}\}|\\mathbb\{R\}))?\s*=\s*(.*)$/u.exec(source);
    if (solutionSet) {
        const body = solutionSet[1].trim();
        if (/^\\(?:varnothing|emptyset)$/u.test(body)) return { values: [], isIsolated: true };
        if (/^\\mathbb\{R\}$/u.test(body)) return { values: [], isIsolated: true, allReals: true };
        const set = /^\\\{([^]*)\\\}$/u.exec(body);
        if (!set) return null;
        if (!set[1].trim()) return { values: [], isIsolated: true };
        // Set commas separate entries. Write decimal values with a point;
        // semicolons can also separate entries in German school notation.
        const entries = set[1].split(/[;,]/u);
        if (entries.length > 4) return null;
        const values = entries.map(entry => constantExpression(entry.trim(), runtime));
        return values.every(value => value !== null) ? { values: values as string[], isIsolated: true } : null;
    }
    const pieces = source.split(/\s*\\(?:lor|vee)\s*|,\s*(?=[A-Za-z]_(?:\{?[1-4]\}?\s*=))/u);
    if (pieces.length > 4) return null;
    const values: string[] = [];
    let isIsolated = true;
    const usedIndices = new Set<string>();
    for (let piece of pieces) {
        const indexed = /^([A-Za-z])_(\{(?:1,2|12|1\/2|1|2|3|4)\}|[1-4])(?=\s*[^A-Za-z0-9_]|$)/u.exec(piece);
        if (indexed) {
            if (indexed[1] !== variable || usedIndices.has(indexed[2])) return null;
            usedIndices.add(indexed[2]);
            piece = variable + piece.slice(indexed[0].length);
        }
        const pmCount = (piece.match(/\\pm(?![A-Za-z])|±/gu) || []).length;
        if (pmCount > 1 || (pieces.length > 1 && pmCount > 0)) return null;
        const branches = pmCount === 1
            ? [piece.replace(/\\pm(?![A-Za-z])|±/u, '+'), piece.replace(/\\pm(?![A-Za-z])|±/u, '-')]
            : [piece];
        for (const branch of branches) {
            const solved = solveLinearTarget(branch, variable, runtime);
            if (!solved) return null;
            values.push(solved.value);
            isIsolated &&= solved.isIsolated;
        }
    }
    return { values, isIsolated };
}

function numberOfRealRoots(polynomial: NumericPolynomial, runtime: AlgebriteRuntime): number | null {
    if (polynomial.degree === 0) return rationalSign(polynomial.coefficients[0]) === 0 ? Infinity : 0;
    if (polynomial.degree === 1) return 1;
    if (polynomial.degree === 4 && polynomial.coefficients.slice(1, 4).every(value => rationalSign(value) === 0)) {
        // A real fourth power cannot equal a negative rational constant.
        // This proves the empty pure-power case without a quartic root solver.
        const radicandSign = rationalSign(simplify('-(' + polynomial.coefficients[0] + ')/(' + polynomial.coefficients[4] + ')', runtime));
        if (radicandSign !== null && radicandSign < 0) return 0;
    }
    if (polynomial.degree !== 2) return null;
    const [c, b, a] = polynomial.coefficients;
    const sign = rationalSign(simplify('(' + b + ')^2-4*(' + a + ')*(' + c + ')', runtime));
    return sign === null ? null : sign < 0 ? 0 : sign === 0 ? 1 : 2;
}

function removeRoot(coefficients: readonly string[], candidate: string, runtime: AlgebriteRuntime): { quotient: string[]; proof: Proof } {
    const quotient = Array<string>(coefficients.length - 1);
    quotient[quotient.length - 1] = coefficients[coefficients.length - 1];
    for (let index = quotient.length - 1; index > 0; index--) {
        const value = simplify('(' + coefficients[index] + ')+(' + candidate + ')*(' + quotient[index] + ')', runtime);
        if (value === null) return { quotient: [], proof: null };
        quotient[index - 1] = value;
    }
    return {
        quotient,
        proof: zeroProof('(' + coefficients[0] + ')+(' + candidate + ')*(' + quotient[0] + ')', runtime)
    };
}

/** Proves supplied real candidates against the original guarded polynomial.
 * Cubics/quartics are supported through exact factor division, not a numeric
 * root search. Every repeated occurrence of a known root is removed. */
export function provePolynomialCandidateSet(
    source: ParsedEquation,
    candidatesCas: readonly string[],
    runtime: AlgebriteRuntime
): CompleteRealSolutionProof | null {
    const polynomial = analyzeNumericPolynomial(source, runtime);
    if (!polynomial?.variable || candidatesCas.length > 4) return null;
    const candidates: string[] = [];
    for (const candidate of candidatesCas) {
        const guarded = new DomainParser(exactDecimals(candidate), runtime).parse();
        if (!guarded?.constant) return null;
        const canonical = simplify(guarded.cas, runtime);
        if (canonical === null) return null;
        candidates.push(canonical);
    }
    const base = { kind: 'polynomial-roots' as const, variable: polynomial.variable, isIsolated: true, solutions: candidates };
    const count = numberOfRealRoots(polynomial, runtime);
    const countMetadata = count !== null && Number.isFinite(count) ? { solutionCount: count } : {};
    const unique: string[] = [];
    for (const candidate of candidates) {
        const evaluated = polynomial.coefficients.map((coefficient, degree) => '(' + coefficient + ')*(' + candidate + ')^' + degree).join('+');
        const membership = zeroProof(evaluated, runtime);
        if (membership === false) return { ...base, proof: false, complete: false, reason: 'extraneous-roots', ...countMetadata };
        if (membership === null) return { ...base, proof: null, complete: false, reason: 'unsupported', ...countMetadata };
        let duplicate = false;
        for (const previous of unique) {
            const equal = zeroProof('(' + previous + ')-(' + candidate + ')', runtime);
            if (equal === true) { duplicate = true; break; }
            if (equal === null) return { ...base, proof: null, complete: false, reason: 'unsupported', ...countMetadata };
        }
        if (!duplicate) unique.push(candidate);
    }
    if (count !== null) {
        const complete = unique.length === count;
        return { ...base, solutions: unique, proof: complete, complete, reason: complete ? 'complete-root-set' : 'missing-roots', ...countMetadata };
    }
    let remaining = [...polynomial.coefficients];
    for (const candidate of unique) {
        while (remaining.length > 1) {
            const divided = removeRoot(remaining, candidate, runtime);
            if (divided.proof === null) return { ...base, proof: null, complete: false, reason: 'unsupported' };
            if (divided.proof === false) break;
            remaining = divided.quotient;
        }
    }
    let complete: boolean | null = null;
    const degree = remaining.length - 1;
    if (degree === 0) complete = true;
    else if (degree === 1 || degree === 3) complete = false;
    else if (degree === 2 && remaining.every(value => rationalSign(value) !== null)) {
        const residual = numberOfRealRoots({ ...polynomial, coefficients: remaining, degree }, runtime);
        if (residual !== null) complete = residual === 0;
    }
    return complete === null
        ? { ...base, solutions: unique, proof: null, complete: false, reason: 'unsupported' }
        : { ...base, solutions: unique, proof: complete, complete, reason: complete ? 'complete-root-set' : 'missing-roots', ...(complete ? { solutionCount: unique.length } : {}) };
}

/** Proves membership AND completeness over the reals. An explicit single
 * answer never silently stands for both square roots. Shifted intermediate
 * targets expose isIsolated=false so the path layer can require a final form. */
export function proveCompleteRealSolutionSet(
    source: ParsedEquation,
    targetTex: string,
    runtime: AlgebriteRuntime
): CompleteRealSolutionProof | null {
    const polynomial = analyzeNumericPolynomial(source, runtime);
    if (!polynomial?.variable) return null;
    const target = parseRootTarget(targetTex, polynomial.variable, runtime);
    if (!target) return null;
    target.isIsolated &&= !shared.splitLine(targetTex).operation;
    if (target.allReals) {
        const complete = numberOfRealRoots(polynomial, runtime) === Infinity;
        return { kind: 'polynomial-roots', variable: polynomial.variable, isIsolated: target.isIsolated, proof: complete, complete, reason: complete ? 'complete-root-set' : 'extraneous-roots' };
    }
    const result = provePolynomialCandidateSet(source, target.values, runtime);
    return result && { ...result, isIsolated: target.isIsolated };
}