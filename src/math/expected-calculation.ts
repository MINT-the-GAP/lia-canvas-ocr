type Exponent = 1 | 2 | 3 | 4;

type Rational = { numerator: number; denominator: number };
type Polynomial = Rational[];
type Token = { kind: 'number' | 'variable' | 'operator' | 'left' | 'right'; value: string };
type ParsedEquation = { left: Polynomial; right: Polynomial; variable: string; display: string };

const MAX_SOURCE_LENGTH = 512;
const MAX_EXPANDED_LENGTH = 2_048;
const MAX_DEGREE = 4;

function safeAdd(left: number, right: number): number | null {
    const value = left + right;
    return Number.isSafeInteger(value) ? value : null;
}

function safeMultiply(left: number, right: number): number | null {
    const value = left * right;
    return Number.isSafeInteger(value) ? value : null;
}

function gcd(first: number, second: number): number {
    let left = Math.abs(first);
    let right = Math.abs(second);
    while (right) [left, right] = [right, left % right];
    return left || 1;
}

function makeRational(numerator: number, denominator = 1): Rational | null {
    if (!Number.isSafeInteger(numerator) || !Number.isSafeInteger(denominator) || !denominator) return null;
    const divisor = gcd(numerator, denominator);
    const sign = denominator < 0 ? -1 : 1;
    const reducedNumerator = (numerator / divisor) * sign;
    const reducedDenominator = (denominator / divisor) * sign;
    return Number.isSafeInteger(reducedNumerator) && Number.isSafeInteger(reducedDenominator)
        ? { numerator: reducedNumerator, denominator: reducedDenominator }
        : null;
}

const ZERO = (): Rational => ({ numerator: 0, denominator: 1 });
const ONE = (): Rational => ({ numerator: 1, denominator: 1 });
const isZero = (value: Rational): boolean => value.numerator === 0;
const isOne = (value: Rational): boolean => value.numerator === value.denominator;
const negate = (value: Rational): Rational => ({ numerator: -value.numerator, denominator: value.denominator });
const absolute = (value: Rational): Rational => ({ numerator: Math.abs(value.numerator), denominator: value.denominator });

function addRational(left: Rational, right: Rational): Rational | null {
    const common = gcd(left.denominator, right.denominator);
    const leftScale = right.denominator / common;
    const rightScale = left.denominator / common;
    const first = safeMultiply(left.numerator, leftScale);
    const second = safeMultiply(right.numerator, rightScale);
    const denominator = safeMultiply(left.denominator, leftScale);
    if (first === null || second === null || denominator === null) return null;
    const numerator = safeAdd(first, second);
    return numerator === null ? null : makeRational(numerator, denominator);
}

function subtractRational(left: Rational, right: Rational): Rational | null {
    return addRational(left, negate(right));
}

function multiplyRational(left: Rational, right: Rational): Rational | null {
    const firstCancellation = gcd(left.numerator, right.denominator);
    const secondCancellation = gcd(right.numerator, left.denominator);
    const numerator = safeMultiply(
        left.numerator / firstCancellation,
        right.numerator / secondCancellation
    );
    const denominator = safeMultiply(
        left.denominator / secondCancellation,
        right.denominator / firstCancellation
    );
    return numerator === null || denominator === null ? null : makeRational(numerator, denominator);
}

function divideRational(left: Rational, right: Rational): Rational | null {
    if (isZero(right)) return null;
    return multiplyRational(left, { numerator: right.denominator, denominator: right.numerator });
}

function zeroPolynomial(): Polynomial {
    return Array.from({ length: MAX_DEGREE + 1 }, ZERO);
}

function constantPolynomial(value: Rational): Polynomial {
    const result = zeroPolynomial();
    result[0] = value;
    return result;
}

function variablePolynomial(): Polynomial {
    const result = zeroPolynomial();
    result[1] = ONE();
    return result;
}

function polynomialDegree(value: Polynomial): number {
    for (let degree = MAX_DEGREE; degree > 0; degree--) {
        if (!isZero(value[degree])) return degree;
    }
    return 0;
}

function addPolynomials(left: Polynomial, right: Polynomial): Polynomial | null {
    const result = zeroPolynomial();
    for (let degree = 0; degree <= MAX_DEGREE; degree++) {
        const coefficient = addRational(left[degree], right[degree]);
        if (!coefficient) return null;
        result[degree] = coefficient;
    }
    return result;
}

function negatePolynomial(value: Polynomial): Polynomial {
    return value.map(negate);
}

function multiplyPolynomials(left: Polynomial, right: Polynomial): Polynomial | null {
    const result = zeroPolynomial();
    for (let first = 0; first <= MAX_DEGREE; first++) {
        if (isZero(left[first])) continue;
        for (let second = 0; second <= MAX_DEGREE; second++) {
            if (isZero(right[second])) continue;
            if (first + second > MAX_DEGREE) return null;
            const product = multiplyRational(left[first], right[second]);
            if (!product) return null;
            const sum = addRational(result[first + second], product);
            if (!sum) return null;
            result[first + second] = sum;
        }
    }
    return result;
}

function dividePolynomial(value: Polynomial, divisor: Polynomial): Polynomial | null {
    if (polynomialDegree(divisor) !== 0 || isZero(divisor[0])) return null;
    const result = zeroPolynomial();
    for (let degree = 0; degree <= MAX_DEGREE; degree++) {
        const coefficient = divideRational(value[degree], divisor[0]);
        if (!coefficient) return null;
        result[degree] = coefficient;
    }
    return result;
}

function powerPolynomial(value: Polynomial, exponent: number): Polynomial | null {
    let result = constantPolynomial(ONE());
    for (let index = 0; index < exponent; index++) {
        const next = multiplyPolynomials(result, value);
        if (!next) return null;
        result = next;
    }
    return result;
}

function readBraceGroup(source: string, start: number): { content: string; end: number } | null {
    if (source[start] !== '{') return null;
    let depth = 1;
    for (let index = start + 1; index < source.length; index++) {
        if (source[index] === '{') depth++;
        else if (source[index] === '}' && --depth === 0) {
            return { content: source.slice(start + 1, index), end: index + 1 };
        }
    }
    return null;
}

function expandFractions(source: string, depth = 0): string | null {
    if (depth > 16) return null;
    let output = '';
    for (let index = 0; index < source.length;) {
        const command = ['\\dfrac', '\\tfrac', '\\frac'].find(value => source.startsWith(value, index));
        if (!command) {
            output += source[index++];
            continue;
        }
        const numerator = readBraceGroup(source, index + command.length);
        if (!numerator) return null;
        const denominator = readBraceGroup(source, numerator.end);
        if (!denominator) return null;
        const top = expandFractions(numerator.content, depth + 1);
        const bottom = expandFractions(denominator.content, depth + 1);
        if (top === null || bottom === null) return null;
        output += '((' + top + ')/(' + bottom + '))';
        index = denominator.end;
    }
    return output;
}

function normalizeSource(value: string): { source: string; display: string } | null {
    let source = String(value || '').trim();
    if (!source || source.length > MAX_SOURCE_LENGTH) return null;
    if (source.startsWith('$') && source.endsWith('$') && source.length > 2) source = source.slice(1, -1);
    if (source.startsWith('\\(') && source.endsWith('\\)')) source = source.slice(2, -2);
    source = source
        .replace(/\u2212/gu, '-')
        .replace(/\u00b2/gu, '^2')
        .replace(/\u00b3/gu, '^3')
        .replace(/\u2074/gu, '^4')
        .replace(/\\left|\\right|\\bigl|\\bigr|\\Bigl|\\Bigr/gu, '')
        .replace(/\\(?:,|;|!| |quad|qquad)/gu, '')
        .replace(/\s+/gu, '');
    const display = source
        .replace(/\\times|\*/gu, '\\cdot ')
        .replace(/\^\{([0-4])\}|\^([0-4])/gu, (_match, braced: string, plain: string) => `^{${braced || plain}}`);
    source = source
        .replace(/\\cdot|\\times/gu, '*')
        .replace(/(\d),(\d)/gu, '$1.$2')
        .replace(/\^\{([0-4])\}/gu, '^$1');
    const expanded = expandFractions(source);
    if (expanded === null || expanded.length > MAX_EXPANDED_LENGTH) return null;
    return {
        source: expanded.replace(/\{/gu, '(').replace(/\}/gu, ')').replace(/:/gu, '/'),
        display
    };
}

function tokenize(source: string): Token[] | null {
    const tokens: Token[] = [];
    for (let index = 0; index < source.length;) {
        const character = source[index];
        if (/\d/u.test(character)) {
            let end = index + 1;
            while (end < source.length && /\d/u.test(source[end])) end++;
            if (source[end] === '.') {
                end++;
                const decimalStart = end;
                while (end < source.length && /\d/u.test(source[end])) end++;
                if (end === decimalStart) return null;
            }
            tokens.push({ kind: 'number', value: source.slice(index, end) });
            index = end;
            continue;
        }
        if (/[A-Za-z]/u.test(character)) {
            tokens.push({ kind: 'variable', value: character });
            index++;
            continue;
        }
        if ('+-*/^'.includes(character)) tokens.push({ kind: 'operator', value: character });
        else if (character === '(' || character === '[') tokens.push({ kind: 'left', value: character });
        else if (character === ')' || character === ']') tokens.push({ kind: 'right', value: character });
        else return null;
        index++;
    }
    return tokens;
}

function parseNumber(source: string): Rational | null {
    if (!source.includes('.')) {
        const value = Number(source);
        return Number.isSafeInteger(value) ? makeRational(value) : null;
    }
    const [whole, decimal] = source.split('.');
    const denominator = 10 ** decimal.length;
    const numerator = Number(whole + decimal);
    return Number.isSafeInteger(numerator) && Number.isSafeInteger(denominator)
        ? makeRational(numerator, denominator)
        : null;
}

class Parser {
    private index = 0;
    private readonly tokens: Token[];
    private readonly variable: string;

    constructor(tokens: Token[], variable: string) {
        this.tokens = tokens;
        this.variable = variable;
    }

    parse(): Polynomial | null {
        const value = this.sum();
        return value && this.index === this.tokens.length ? value : null;
    }

    private peek(): Token | undefined { return this.tokens[this.index]; }
    private take(): Token | undefined { return this.tokens[this.index++]; }

    private sum(): Polynomial | null {
        let left = this.product();
        if (!left) return null;
        while (this.peek()?.kind === 'operator' && ['+', '-'].includes(this.peek()!.value)) {
            const operation = this.take()!.value;
            const right = this.product();
            if (!right) return null;
            left = addPolynomials(left, operation === '+' ? right : negatePolynomial(right));
            if (!left) return null;
        }
        return left;
    }

    private product(): Polynomial | null {
        let left = this.unary();
        if (!left) return null;
        for (;;) {
            const token = this.peek();
            const explicit = token?.kind === 'operator' && (token.value === '*' || token.value === '/');
            const implicit = token?.kind === 'number' || token?.kind === 'variable' || token?.kind === 'left';
            if (!explicit && !implicit) break;
            const operation = explicit ? this.take()!.value : '*';
            const right = this.unary();
            if (!right) return null;
            left = operation === '/' ? dividePolynomial(left, right) : multiplyPolynomials(left, right);
            if (!left) return null;
        }
        return left;
    }

    private unary(): Polynomial | null {
        const token = this.peek();
        if (token?.kind === 'operator' && (token.value === '+' || token.value === '-')) {
            this.take();
            const value = this.unary();
            return value && token.value === '-' ? negatePolynomial(value) : value;
        }
        return this.power();
    }

    private power(): Polynomial | null {
        const base = this.primary();
        if (!base) return null;
        if (this.peek()?.kind !== 'operator' || this.peek()!.value !== '^') return base;
        this.take();
        const exponent = this.take();
        if (!exponent || exponent.kind !== 'number' || !/^\d+$/u.test(exponent.value)) return null;
        const value = Number(exponent.value);
        return Number.isInteger(value) && value >= 0 && value <= MAX_DEGREE
            ? powerPolynomial(base, value)
            : null;
    }

    private primary(): Polynomial | null {
        const token = this.take();
        if (!token) return null;
        if (token.kind === 'number') {
            const value = parseNumber(token.value);
            return value ? constantPolynomial(value) : null;
        }
        if (token.kind === 'variable') return token.value === this.variable ? variablePolynomial() : null;
        if (token.kind !== 'left') return null;
        const value = this.sum();
        const close = this.take();
        if (!value || close?.kind !== 'right' ||
            (token.value === '(' && close.value !== ')') ||
            (token.value === '[' && close.value !== ']')) return null;
        return value;
    }
}

function parseEquation(value: string): ParsedEquation | null {
    const normalized = normalizeSource(value);
    if (!normalized) return null;
    const parts = normalized.source.split('=');
    if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
    const leftTokens = tokenize(parts[0]);
    const rightTokens = tokenize(parts[1]);
    if (!leftTokens?.length || !rightTokens?.length) return null;
    const variables = new Set(
        [...leftTokens, ...rightTokens]
            .filter(token => token.kind === 'variable')
            .map(token => token.value)
    );
    if (variables.size !== 1) return null;
    const variable = [...variables][0];
    const left = new Parser(leftTokens, variable).parse();
    const right = new Parser(rightTokens, variable).parse();
    return left && right ? { left, right, variable, display: normalized.display } : null;
}

function formatRational(value: Rational): string {
    if (value.denominator === 1) return String(value.numerator);
    const sign = value.numerator < 0 ? '-' : '';
    return `${sign}\\frac{${Math.abs(value.numerator)}}{${value.denominator}}`;
}

function formatTerm(coefficient: Rational, degree: number, variable: string, includeSign: boolean): string {
    const negative = coefficient.numerator < 0;
    const magnitude = absolute(coefficient);
    const sign = includeSign ? (negative ? '-' : '+') : (negative ? '-' : '');
    if (degree === 0) return sign + formatRational(magnitude);
    const coefficientText = isOne(magnitude) ? '' : formatRational(magnitude);
    const exponent = degree === 1 ? '' : `^{${degree}}`;
    return sign + coefficientText + variable + exponent;
}

function formatPolynomial(value: Polynomial, variable: string): string {
    let output = '';
    for (let degree = MAX_DEGREE; degree >= 0; degree--) {
        if (isZero(value[degree])) continue;
        output += formatTerm(value[degree], degree, variable, output.length > 0);
    }
    return output || '0';
}

function primitiveIntegerPolynomial(value: Polynomial): number[] | null {
    let commonDenominator = 1;
    for (const coefficient of value) {
        const factor = coefficient.denominator / gcd(commonDenominator, coefficient.denominator);
        const next = safeMultiply(commonDenominator, factor);
        if (next === null) return null;
        commonDenominator = next;
    }
    const coefficients: number[] = [];
    for (const coefficient of value) {
        const scaled = safeMultiply(coefficient.numerator, commonDenominator / coefficient.denominator);
        if (scaled === null) return null;
        coefficients.push(scaled);
    }
    let divisor = 0;
    for (const coefficient of coefficients) divisor = gcd(divisor, coefficient);
    if (divisor > 1) {
        for (let index = 0; index < coefficients.length; index++) coefficients[index] /= divisor;
    }
    let degree = coefficients.length - 1;
    while (degree > 0 && coefficients[degree] === 0) degree--;
    if (coefficients[degree] < 0) {
        for (let index = 0; index < coefficients.length; index++) coefficients[index] *= -1;
    }
    return coefficients;
}

function integerPolynomial(coefficients: number[]): Polynomial {
    const result = zeroPolynomial();
    for (let index = 0; index < result.length; index++) result[index] = makeRational(coefficients[index] || 0)!;
    return result;
}

function operationToRemove(value: Rational): string {
    return value.numerator > 0 ? '-' + formatRational(value) : '+' + formatRational(absolute(value));
}

function divisionOperation(value: Rational): string {
    const formatted = formatRational(value);
    return value.numerator < 0 || value.denominator !== 1 ? ':(' + formatted + ')' : ':' + formatted;
}

function exactIntegerRoot(value: number, exponent: Exponent): number | null {
    const negative = value < 0;
    if (negative && exponent % 2 === 0) return null;
    const magnitude = Math.abs(value);
    const estimate = Math.round(magnitude ** (1 / exponent));
    for (let candidate = Math.max(0, estimate - 2); candidate <= estimate + 2; candidate++) {
        const power = candidate ** exponent;
        if (Number.isSafeInteger(power) && power === magnitude) return negative ? -candidate : candidate;
    }
    return null;
}

function exactRationalRoot(value: Rational, exponent: Exponent): Rational | null {
    const numerator = exactIntegerRoot(value.numerator, exponent);
    const denominator = exactIntegerRoot(value.denominator, exponent);
    return numerator === null || denominator === null ? null : makeRational(numerator, denominator);
}

function squareFactor(value: number): { outside: number; inside: number } {
    let inside = value;
    let outside = 1;
    // Bounded trial division extracts the small square factors common in
    // school exercises without making large prime inputs expensive.
    for (let factor = 2; factor <= 10_000 && factor * factor <= inside; factor++) {
        const square = factor * factor;
        while (inside % square === 0) {
            inside /= square;
            outside *= factor;
        }
    }
    const remainingRoot = exactIntegerRoot(inside, 2);
    if (remainingRoot !== null) {
        outside *= remainingRoot;
        inside = 1;
    }
    return { outside, inside };
}

function formatSquareRootInteger(value: number): string {
    const factor = squareFactor(value);
    if (factor.inside === 1) return String(factor.outside);
    const radical = `\\sqrt{${factor.inside}}`;
    return factor.outside === 1 ? radical : String(factor.outside) + radical;
}

function formatRoot(value: Rational, exponent: Exponent, splitSquare = false): string {
    const exact = exactRationalRoot(value, exponent);
    if (exact) return formatRational(exact);
    const negative = value.numerator < 0;
    const magnitude = absolute(value);
    if (exponent === 2) {
        const top = formatSquareRootInteger(magnitude.numerator);
        if (magnitude.denominator === 1) return top;
        const bottom = formatSquareRootInteger(magnitude.denominator);
        if (splitSquare || top[0] !== '\\' || bottom[0] !== '\\') return `\\frac{${top}}{${bottom}}`;
    }
    const inner = formatRational(magnitude);
    const radical = exponent === 2 ? `\\sqrt{${inner}}` : `\\sqrt[${exponent}]{${inner}}`;
    return negative ? '-' + radical : radical;
}

function appendRealPowerSolutions(lines: string[], value: Rational, exponent: Exponent, variable: string): void {
    if (exponent % 2 === 0 && value.numerator < 0) {
        lines.push('\\Rightarrow \\mathcal{L}_{\\mathbb{R}}=\\varnothing');
        return;
    }
    if (isZero(value)) {
        lines.push(`\\Rightarrow ${variable}=0`);
        return;
    }
    const root = formatRoot(value, exponent, exponent === 2);
    lines.push(exponent % 2 === 0
        ? `\\Rightarrow ${variable}_{1,2}=\\pm${root}`
        : `\\Rightarrow ${variable}=${root}`);
}

function simplePowerCalculation(parsed: ParsedEquation): string[] | null {
    if (polynomialDegree(parsed.right) !== 0) return null;
    const degree = polynomialDegree(parsed.left);
    if (degree < 1 || degree > MAX_DEGREE) return null;
    for (let index = 1; index <= MAX_DEGREE; index++) {
        if (index !== degree && !isZero(parsed.left[index])) return null;
    }
    const exponent = degree as Exponent;
    const coefficient = parsed.left[degree];
    const constant = parsed.left[0];
    const right = parsed.right[0];
    const isolatedRight = subtractRational(right, constant);
    if (!isolatedRight) return null;
    const result = divideRational(isolatedRight, coefficient);
    if (!result) return null;
    const variableTerm = formatTerm(coefficient, degree, parsed.variable, false);
    const initial = variableTerm + (isZero(constant) ? '' : formatTerm(constant, 0, parsed.variable, true)) + '=' + formatRational(right);
    const lines: string[] = parsed.display === initial ? [] : [parsed.display];
    if (!isZero(constant)) lines.push(initial + ' \\mid ' + operationToRemove(constant));
    const isolated = variableTerm + '=' + formatRational(isolatedRight);
    if (!isOne(coefficient)) lines.push(isolated + ' \\mid ' + divisionOperation(coefficient));
    else if (isZero(constant)) lines.push(initial);
    const solvedPower = parsed.variable + (degree === 1 ? '' : `^{${degree}}`) + '=' + formatRational(result);
    if (lines[lines.length - 1] !== solvedPower) lines.push(solvedPower);
    if (degree > 1) appendRealPowerSolutions(lines, result, exponent, parsed.variable);
    return lines;
}

function annotateLast(lines: string[], operation: string): void {
    lines[lines.length - 1] += ' \\mid ' + operation;
}

function appendLinearSolution(lines: string[], coefficient: number, constant: number, variable: string): string[] | null {
    const result = makeRational(-constant, coefficient);
    if (!result) return null;
    const coefficientValue = makeRational(coefficient)!;
    if (constant !== 0) {
        annotateLast(lines, operationToRemove(makeRational(constant)!));
        lines.push(formatTerm(coefficientValue, 1, variable, false) + '=' + String(-constant));
    }
    if (coefficient !== 1) annotateLast(lines, divisionOperation(coefficientValue));
    const solution = variable + '=' + formatRational(result);
    if (lines[lines.length - 1] !== solution) lines.push(solution);
    return lines;
}

function appendPureStandardSolution(lines: string[], coefficients: number[], degree: Exponent, variable: string): string[] | null {
    const coefficient = coefficients[degree];
    const constant = coefficients[0];
    const result = makeRational(-constant, coefficient);
    if (!result) return null;
    const coefficientValue = makeRational(coefficient)!;
    if (constant !== 0) {
        annotateLast(lines, operationToRemove(makeRational(constant)!));
        lines.push(formatTerm(coefficientValue, degree, variable, false) + '=' + String(-constant));
    }
    if (coefficient !== 1) annotateLast(lines, divisionOperation(coefficientValue));
    const power = variable + `^{${degree}}=` + formatRational(result);
    if (lines[lines.length - 1] !== power) lines.push(power);
    appendRealPowerSolutions(lines, result, degree, variable);
    return lines;
}

function formatIrrationalQuadraticResult(
    numeratorBase: number,
    discriminant: number,
    denominator: number
): string {
    const factor = squareFactor(discriminant);
    const common = gcd(gcd(Math.abs(numeratorBase), factor.outside), denominator);
    const base = numeratorBase / common;
    const radicalCoefficient = factor.outside / common;
    const reducedDenominator = denominator / common;
    const radical = (radicalCoefficient === 1 ? '' : String(radicalCoefficient)) +
        `\\sqrt{${factor.inside}}`;
    const numerator = String(base) + '\\pm' + radical;
    return reducedDenominator === 1
        ? numerator
        : `\\frac{${numerator}}{${reducedDenominator}}`;
}

function appendQuadraticSolution(lines: string[], coefficients: number[], variable: string): string[] | null {
    const [constant, linear, quadratic] = coefficients;
    const linearSquared = safeMultiply(linear, linear);
    const product = safeMultiply(quadratic, constant);
    const fourProduct = product === null ? null : safeMultiply(4, product);
    const discriminant = linearSquared === null || fourProduct === null
        ? null
        : safeAdd(linearSquared, -fourProduct);
    const denominator = safeMultiply(2, quadratic);
    if (discriminant === null || denominator === null) return null;
    const shownLinear = linear < 0 ? `(${linear})` : String(linear);
    const shownConstant = constant < 0 ? `(${constant})` : String(constant);
    lines.push(`\\Delta=${shownLinear}^{2}-4\\cdot${quadratic}\\cdot${shownConstant}=${discriminant}` + (discriminant < 0 ? '<0' : ''));
    if (discriminant < 0) {
        lines.push('\\Rightarrow \\mathcal{L}_{\\mathbb{R}}=\\varnothing');
        return lines;
    }
    if (discriminant === 0) {
        const root = makeRational(-linear, denominator);
        if (!root) return null;
        lines.push(`\\Rightarrow ${variable}=${formatRational(root)}`);
        return lines;
    }
    const squareRoot = exactIntegerRoot(discriminant, 2);
    if (squareRoot === null) {
        lines.push(`\\Rightarrow ${variable}_{1,2}=` +
            formatIrrationalQuadraticResult(-linear, discriminant, denominator));
        return lines;
    }
    const firstNumerator = safeAdd(-linear, squareRoot);
    const secondNumerator = safeAdd(-linear, -squareRoot);
    if (firstNumerator === null || secondNumerator === null) return null;
    const first = makeRational(firstNumerator, denominator);
    const second = makeRational(secondNumerator, denominator);
    if (!first || !second) return null;
    lines.push(`${variable}_{1,2}=\\frac{${-linear}\\pm${squareRoot}}{${denominator}}`);
    lines.push(`\\Rightarrow ${variable}_1=${formatRational(first)},\\quad ${variable}_2=${formatRational(second)}`);
    return lines;
}

/**
 * Generates exact school-style solution steps for one-variable polynomial
 * equations: all linear and quadratic equations, plus pure powers of degree
 * three or four. Coefficients may be integers, finite decimals or constant
 * fractions. Unsupported syntax, variable denominators and unsafe arithmetic
 * return null; supported equations without real roots yield an empty real set.
 */
export function generateExpectedCalculation(equation: string): string[] | null {
    const parsed = parseEquation(equation);
    if (!parsed) return null;
    const simple = simplePowerCalculation(parsed);
    if (simple) return simple;

    const difference = addPolynomials(parsed.left, negatePolynomial(parsed.right));
    if (!difference) return null;
    const coefficients = primitiveIntegerPolynomial(difference);
    if (!coefficients) return null;
    let degree = coefficients.length - 1;
    while (degree > 0 && coefficients[degree] === 0) degree--;
    const expanded = formatPolynomial(parsed.left, parsed.variable) + '=' + formatPolynomial(parsed.right, parsed.variable);
    const authoredLines = parsed.display === expanded
        ? [expanded]
        : [parsed.display, expanded];
    if (degree === 0) {
        return coefficients[0] === 0
            ? [...authoredLines, '\\Rightarrow \\mathcal{L}=\\mathbb{R}']
            : [...authoredLines, coefficients[0] + '=0', '\\Rightarrow \\mathcal{L}=\\varnothing'];
    }
    const standard = formatPolynomial(integerPolynomial(coefficients), parsed.variable) + '=0';
    const lines = [...authoredLines];
    if (lines[lines.length - 1] !== standard) lines.push(standard);
    if (degree === 1) return appendLinearSolution(lines, coefficients[1], coefficients[0], parsed.variable);
    if (degree === 2 && coefficients[1] !== 0) return appendQuadraticSolution(lines, coefficients, parsed.variable);
    if (degree >= 2 && degree <= 4) {
        for (let index = 1; index < degree; index++) if (coefficients[index] !== 0) return null;
        return appendPureStandardSolution(lines, coefficients, degree as Exponent, parsed.variable);
    }
    return null;
}
