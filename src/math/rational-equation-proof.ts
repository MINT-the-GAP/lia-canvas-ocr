import {
    calculationProofTools as shared,
    type AlgebriteRuntime,
    type ParsedEquation,
    type Proof
} from './equivalence.ts';
import {
    analyzeNumericPolynomial,
    provePolynomialTransition,
    proveCompleteRealSolutionSet,
    type NumericPolynomial,
    type CompleteRealSolutionProof
} from './nonlinear-proof.ts';

export interface RationalEquationModel {
    variable: string;
    originalEquation: ParsedEquation;
    /** Uncancelled numerator after multiplying through all original denominators. */
    polynomialEquation: ParsedEquation;
    excludedValues: readonly string[];
    /** Original divisor numerators, retained before any CAS cancellation. */
    denominators: readonly string[];
}

interface FractionExpression {
    numerator: string;
    denominator: string;
    numeratorDegree: number;
    denominatorDegree: number;
    cost: number;
}
interface ParsedRational extends RationalEquationModel { polynomial: NumericPolynomial; }

function simplify(source: string, runtime: AlgebriteRuntime): string | null {
    return shared.casRun('simplify(rationalize(' + source + '))', runtime);
}
function isRational(value: string | null): value is string {
    return value !== null && value.length <= 256 && /^[+-]?\d+(?:\/[1-9]\d*)?$/u.test(value);
}
function isZero(value: string): boolean { return /^[+-]?0(?:\/\d+)?$/u.test(value); }
function polynomialEquation(expression: string, variable?: string): ParsedEquation {
    return {
        left: { cas: variable ? '(' + expression + ')+0*' + variable : expression, domainRisk: false },
        right: { cas: '0', domainRisk: false }
    };
}
function exactDecimals(value: string): string {
    return value.replace(/\b(\d+)\.(\d+)\b/gu, (_, whole: string, fraction: string) =>
        '(' + (whole + fraction).replace(/^0+(?=\d)/u, '') + '/1' + '0'.repeat(fraction.length) + ')');
}

/** Parses fractions before simplification. Division by another variable
 * fraction, nonlinear divisors and negative powers are intentionally outside
 * this bounded grammar. Degree and expansion-cost guards run before the CAS. */
class FractionParser {
    private readonly tokens: string[];
    private readonly source: string;
    private readonly variable: string;
    private readonly runtime: AlgebriteRuntime;
    private index = 0;
    private depth = 0;
    readonly denominators: string[] = [];
    readonly excludedValues: string[] = [];

    constructor(source: string, variable: string, runtime: AlgebriteRuntime) {
        this.source = exactDecimals(source);
        this.tokens = this.source.match(/[A-Za-z][A-Za-z0-9_]*|\d+|[()+\-*/^]/gu) || [];
        this.variable = variable;
        this.runtime = runtime;
    }
    parse(): FractionExpression | null {
        if (!this.source || this.source.length > 2048 || this.tokens.length > 256 || this.tokens.join('') !== this.source) return null;
        const result = this.sum();
        return result && this.index === this.tokens.length ? result : null;
    }
    private peek(): string { return this.tokens[this.index] || ''; }
    private take(): string { return this.tokens[this.index++] || ''; }
    private bounded(value: FractionExpression): FractionExpression | null {
        return value.numeratorDegree <= 4 && value.denominatorDegree <= 4 && value.cost <= 64 ? value : null;
    }
    private sum(): FractionExpression | null {
        let left = this.product();
        while (left && (this.peek() === '+' || this.peek() === '-')) {
            const operator = this.take();
            const right = this.product();
            if (!right) return null;
            left = this.bounded({
                numerator: '((' + left.numerator + ')*(' + right.denominator + ')' + operator + '(' + right.numerator + ')*(' + left.denominator + '))',
                denominator: '(' + left.denominator + ')*(' + right.denominator + ')',
                numeratorDegree: Math.max(left.numeratorDegree + right.denominatorDegree, right.numeratorDegree + left.denominatorDegree),
                denominatorDegree: left.denominatorDegree + right.denominatorDegree,
                cost: 2 * (left.cost + right.cost)
            });
        }
        return left;
    }
    private product(): FractionExpression | null {
        let left = this.unary();
        while (left && (this.peek() === '*' || this.peek() === '/')) {
            const operator = this.take();
            const right = this.unary();
            if (!right) return null;
            if (operator === '/' && !this.recordDivisor(right)) return null;
            left = this.bounded({
                numerator: '(' + left.numerator + ')*(' + (operator === '/' ? right.denominator : right.numerator) + ')',
                denominator: '(' + left.denominator + ')*(' + (operator === '/' ? right.numerator : right.denominator) + ')',
                numeratorDegree: left.numeratorDegree + (operator === '/' ? right.denominatorDegree : right.numeratorDegree),
                denominatorDegree: left.denominatorDegree + (operator === '/' ? right.numeratorDegree : right.denominatorDegree),
                cost: left.cost + right.cost
            });
        }
        return left;
    }
    private recordDivisor(divisor: FractionExpression): boolean {
        if (divisor.denominatorDegree !== 0 || divisor.numeratorDegree > 1) return false;
        const polynomial = analyzeNumericPolynomial(polynomialEquation(divisor.numerator), this.runtime, 1);
        if (!polynomial || (polynomial.variable !== null && polynomial.variable !== this.variable)) return false;
        if (polynomial.degree === 0) return !isZero(polynomial.coefficients[0]);
        if (this.denominators.length >= 4) return false;
        const root = simplify('-(' + polynomial.coefficients[0] + ')/(' + polynomial.coefficients[1] + ')', this.runtime);
        if (!isRational(root)) return false;
        this.denominators.push(divisor.numerator);
        this.excludedValues.push(root);
        return true;
    }
    private unary(): FractionExpression | null {
        if (++this.depth > 32) return null;
        let value: FractionExpression | null;
        if (this.peek() === '+' || this.peek() === '-') {
            const operator = this.take();
            const inner = this.unary();
            value = inner && { ...inner, numerator: '(' + operator + inner.numerator + ')' };
        } else value = this.power();
        this.depth--;
        return value;
    }
    private power(): FractionExpression | null {
        const base = this.primary();
        if (!base || this.peek() !== '^') return base;
        this.take();
        let nesting = 0;
        while (this.peek() === '(' && nesting < 32) { this.take(); nesting++; }
        const token = this.take();
        if (!/^[1-4]$/u.test(token)) return null;
        for (let index = 0; index < nesting; index++) if (this.take() !== ')') return null;
        const exponent = Number(token);
        return this.bounded({
            numerator: '(' + base.numerator + ')^' + exponent,
            denominator: '(' + base.denominator + ')^' + exponent,
            numeratorDegree: base.numeratorDegree * exponent,
            denominatorDegree: base.denominatorDegree * exponent,
            cost: base.cost * exponent
        });
    }
    private primary(): FractionExpression | null {
        const token = this.take();
        if (/^\d+$/u.test(token)) return { numerator: token, denominator: '1', numeratorDegree: 0, denominatorDegree: 0, cost: 1 };
        if (token === this.variable) return { numerator: token, denominator: '1', numeratorDegree: 1, denominatorDegree: 0, cost: 1 };
        if (token !== '(') return null;
        const value = this.sum();
        return this.take() === ')' ? value : null;
    }
}

function parseRational(source: ParsedEquation, runtime: AlgebriteRuntime, requiredVariable?: string): ParsedRational | null {
    const identifiers = (source.left.cas + '+' + source.right.cas).match(/[A-Za-z][A-Za-z0-9_]*/gu) || [];
    const variables = new Set(identifiers);
    if (variables.size > 1 || identifiers.some(value => !/^[A-Za-z]$/u.test(value) || value === 'e' || value === 'i')) return null;
    const variable = [...variables][0] || requiredVariable;
    if (!variable || (requiredVariable && variable !== requiredVariable)) return null;
    const leftParser = new FractionParser(source.left.cas, variable, runtime);
    const rightParser = new FractionParser(source.right.cas, variable, runtime);
    const left = leftParser.parse();
    const right = rightParser.parse();
    if (!left || !right || left.numeratorDegree + right.denominatorDegree > 4 || right.numeratorDegree + left.denominatorDegree > 4) return null;
    const numerator = '((' + left.numerator + ')*(' + right.denominator + ')-(' + right.numerator + ')*(' + left.denominator + '))';
    const equation = polynomialEquation(numerator, variable);
    const polynomial = analyzeNumericPolynomial(equation, runtime, 2);
    if (!polynomial) return null;
    const excludedValues = [...new Set([...leftParser.excludedValues, ...rightParser.excludedValues])];
    return {
        variable, originalEquation: source, polynomialEquation: equation, polynomial, excludedValues,
        denominators: [...leftParser.denominators, ...rightParser.denominators]
    };
}

export function analyzeRationalEquation(source: ParsedEquation, runtime: AlgebriteRuntime): RationalEquationModel | null {
    const result = parseRational(source, runtime);
    return result && result.excludedValues.length > 0 ? result : null;
}

function domainContained(model: RationalEquationModel, candidate: ParsedRational, runtime: AlgebriteRuntime): boolean {
    return candidate.excludedValues.every(value => model.excludedValues.some(excluded =>
        shared.proveExpressionIdentity(value, excluded, runtime) === true));
}

function removeExcludedFactors(polynomial: NumericPolynomial, excludedValues: readonly string[], runtime: AlgebriteRuntime): ParsedEquation | null {
    let coefficients = [...polynomial.coefficients];
    for (const excluded of excludedValues) {
        while (coefficients.length > 1) {
            const quotient = Array<string>(coefficients.length - 1);
            quotient[quotient.length - 1] = coefficients[coefficients.length - 1];
            for (let index = quotient.length - 1; index > 0; index--) {
                const coefficient = simplify('(' + coefficients[index] + ')+(' + excluded + ')*(' + quotient[index] + ')', runtime);
                if (!isRational(coefficient)) return null;
                quotient[index - 1] = coefficient;
            }
            const remainder = simplify('(' + coefficients[0] + ')+(' + excluded + ')*(' + quotient[0] + ')', runtime);
            if (!isRational(remainder)) return null;
            if (!isZero(remainder)) break;
            coefficients = quotient;
        }
    }
    const expression = coefficients.map((value, degree) => '(' + value + ')' + (degree ? '*' + polynomial.variable + '^' + degree : '')).join('+');
    return polynomialEquation(expression, polynomial.variable || undefined);
}

/** Equivalence is checked on the ORIGINAL domain. A newly introduced pole is
 * never accepted just because it disappears during simplification. */
export function proveRationalEquationTransition(
    model: RationalEquationModel,
    from: ParsedEquation,
    to: ParsedEquation,
    runtime: AlgebriteRuntime
): Proof {
    const first = parseRational(from, runtime, model.variable);
    const second = parseRational(to, runtime, model.variable);
    if (!first || !second || !domainContained(model, first, runtime) || !domainContained(model, second, runtime)) return null;
    const firstReduced = removeExcludedFactors(first.polynomial, model.excludedValues, runtime);
    const secondReduced = removeExcludedFactors(second.polynomial, model.excludedValues, runtime);
    return firstReduced && secondReduced ? provePolynomialTransition(firstReduced, secondReduced, runtime) : null;
}

/** Finite solution sets are proved after removing only forbidden roots.
 * An identity on R minus its poles is NOT silently reported as all of R. */
export function proveRationalSolutionSet(
    model: RationalEquationModel,
    targetTex: string,
    runtime: AlgebriteRuntime
): CompleteRealSolutionProof | null {
    const polynomial = analyzeNumericPolynomial(model.polynomialEquation, runtime, 2);
    if (!polynomial || (polynomial.degree === 0 && isZero(polynomial.coefficients[0]))) return null;
    const reduced = removeExcludedFactors(polynomial, model.excludedValues, runtime);
    return reduced ? proveCompleteRealSolutionSet(reduced, targetTex, runtime) : null;
}