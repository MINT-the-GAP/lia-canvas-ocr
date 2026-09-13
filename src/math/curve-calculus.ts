import type { Proof } from './equivalence.ts';
import {
    cas, normalizeCurveExpression, curveEqual, curveConstant, curveSign, curveTex,
    curveSubstitute, curvePolynomial, curveRealRoots, curveClean,
    type CurveEnvironment, type CurveTaskModel, type CurveLineResult
} from './curve-task-core.ts';

type Sign = -1 | 0 | 1;
type Bound = string | '-inf' | '+inf';
type Interval = { lower: Bound; upper: Bound; lowerClosed: boolean; upperClosed: boolean };
type Mark = { x: string; y: string; kind: 'H' | 'T' | 'W' };
const TASKS = new Set(['derivative', 'derivative-value', 'tangent', 'normal', 'extrema', 'extrema-points',
    'inflections', 'inflection-points', 'monotonicity', 'curvature', 'antiderivative', 'integral', 'area']);
const result = (proof: Proof, targets: string[] = []): CurveLineResult =>
    ({ proof, targets, reason: proof === true ? 'curve-correct' : proof === false ? 'curve-incorrect' : 'curve-unsupported' });
const escape = (s: string): string => s.replace(/[.*+?^$()|[\]\\]/g, '\\$&');

/** Local notation cleanup never modifies the OCR source. */
function clean(raw: string): string {
    return curveClean(raw).replace(/[′’]/gu, "'").replace(/″/gu, "''")
        .replace(/\^\s*\{\s*((?:\\prime\s*)+)\}/gu, (_, primes: string) => "'".repeat((primes.match(/\\prime/gu) || []).length))
        .replace(/\^\s*\\prime\b/gu, "'").replace(/\^\s*\{\s*\(\s*([1-8])\s*\)\s*\}/gu, (_, n: string) => "'".repeat(Number(n)))
        .replace(/\\(?:text|mathrm|operatorname)\{([^{}]*)\}/gu, '$1').trim();
}
function splitTop(source: string, separators = ';,'): string[] {
    const out: string[] = []; let depth = 0, start = 0;
    for (let i = 0; i < source.length; i++) {
        if ('({['.includes(source[i])) depth++;
        else if (')}]'.includes(source[i])) depth--;
        else if (!depth && separators.includes(source[i])) { out.push(source.slice(start, i).trim()); start = i + 1; }
        if (depth < 0) return [];
    }
    if (depth) return [];
    out.push(source.slice(start).trim());
    return out.every(Boolean) ? out : [];
}
const expression = (env: CurveEnvironment, source: string) => normalizeCurveExpression(source, env);
const constant = (env: CurveEnvironment, source: string) => curveConstant(env, clean(source));
const equal = (env: CurveEnvironment, a: string, b: string) => curveEqual(env, a, b);
const diff = (env: CurveEnvironment, value: string, order = 1) => cas(env, 'd((' + value + '),' + env.variable + ',' + order + ')');
function integral(env: CurveEnvironment, value: string): string | null {
    const polynomial = curvePolynomial(env, value);
    if (!polynomial) return null;
    return cas(env, 'simplify(' + polynomial.coefficients.map((coefficient, i) =>
        '(' + coefficient + ')*' + env.variable + '^' + (i + 1) + '/' + (i + 1)).join('+') + ')');
}
function compare(env: CurveEnvironment, a: Bound, b: Bound): Sign | null {
    if (a === b) return 0;
    if (a === '-inf' || b === '+inf') return -1;
    if (a === '+inf' || b === '-inf') return 1;
    return curveSign(env, '(' + a + ')-(' + b + ')');
}
function sorted(env: CurveEnvironment, roots: string[]): string[] | null {
    const output: string[] = [];
    for (const root of roots) {
        let i = 0;
        for (; i < output.length; i++) {
            const sign = compare(env, root, output[i]);
            if (sign === null) return null;
            if (sign <= 0) break;
        }
        if (i === output.length || compare(env, root, output[i]) !== 0) output.splice(i, 0, root);
    }
    return output;
}
function parseBound(env: CurveEnvironment, source: string): Bound | null {
    const value = clean(source).replace(/\s/gu, '');
    if (/^(?:-\\infty|-∞|-Infinity|-inf(?:ty)?)$/u.test(value)) return '-inf';
    if (/^(?:\+?\\infty|\+?∞|\+?Infinity|\+?inf(?:ty)?)$/u.test(value)) return '+inf';
    return constant(env, source);
}
function domain(env: CurveEnvironment): Interval | null {
    const authored = env.context.interval;
    if (!authored) return { lower: '-inf', upper: '+inf', lowerClosed: false, upperClosed: false };
    const lower = parseBound(env, authored.lower), upper = parseBound(env, authored.upper);
    if (!lower || !upper || compare(env, lower, upper) !== -1 || lower === '+inf' || upper === '-inf' ||
        lower === '-inf' && authored.lowerClosed || upper === '+inf' && authored.upperClosed) return null;
    return { lower, upper, lowerClosed: authored.lowerClosed, upperClosed: authored.upperClosed };
}
function within(env: CurveEnvironment, point: string, interval: Interval, interior = false): boolean | null {
    const left = compare(env, point, interval.lower), right = compare(env, point, interval.upper);
    if (left === null || right === null) return null;
    return (left > 0 || left === 0 && !interior && interval.lowerClosed) &&
        (right < 0 || right === 0 && !interior && interval.upperClosed);
}
function multiplicity(env: CurveEnvironment, value: string, root: string): number | null {
    const polynomial = curvePolynomial(env, value);
    if (!polynomial || polynomial.degree < 1) return null;
    for (let order = 1; order <= polynomial.degree; order++) {
        const derivative = diff(env, value, order), at = derivative && curveSubstitute(env, derivative, root);
        const sign = at ? curveSign(env, at) : null;
        if (sign === null) return null;
        if (sign !== 0) return order;
    }
    return null;
}
/** Signs follow exactly from the leading coefficient and root multiplicities, never samples. */
function signIntervals(env: CurveEnvironment, value: string, interval: Interval): Map<Sign, Interval[]> | null {
    const polynomial = curvePolynomial(env, value);
    if (!polynomial) return null;
    const leading = curveSign(env, polynomial.coefficients[polynomial.degree]);
    if (leading === null) return null;
    const output = new Map<Sign, Interval[]>([[-1, []], [0, []], [1, []]]);
    if (!leading) { output.set(0, [interval]); return output; }
    const rawRoots = curveRealRoots(env, value), roots = rawRoots && sorted(env, rawRoots);
    if (!roots) return null;
    const signs: Sign[] = Array(roots.length + 1); signs[roots.length] = leading;
    for (let i = roots.length - 1; i >= 0; i--) {
        const count = multiplicity(env, value, roots[i]);
        if (count === null) return null;
        signs[i] = count % 2 ? -signs[i + 1] as Sign : signs[i + 1];
    }
    const boundaries: Bound[] = ['-inf', ...roots, '+inf'];
    for (let i = 0; i < signs.length; i++) {
        const l = compare(env, boundaries[i], interval.lower), r = compare(env, boundaries[i + 1], interval.upper);
        if (l === null || r === null) return null;
        const lower = l > 0 ? boundaries[i] : interval.lower, upper = r < 0 ? boundaries[i + 1] : interval.upper;
        const relation = compare(env, lower, upper);
        if (relation === null) return null;
        if (relation >= 0) continue;
        const piece: Interval = { lower, upper,
            lowerClosed: compare(env, lower, interval.lower) === 0 && interval.lowerClosed,
            upperClosed: compare(env, upper, interval.upper) === 0 && interval.upperClosed };
        const group = output.get(signs[i])!, previous = group[group.length - 1];
        // Isolated derivative zeros without a sign change preserve strict monotonicity/convexity.
        if (previous && compare(env, previous.upper, piece.lower) === 0) {
            previous.upper = piece.upper; previous.upperClosed = piece.upperClosed;
        } else group.push(piece);
    }
    return output;
}
function intervalTex(interval: Interval): string {
    if (interval.lower === '-inf' && interval.upper === '+inf') return '\\mathbb{R}';
    const fmt = (value: Bound) => value === '-inf' ? '-\\infty' : value === '+inf' ? '\\infty' : curveTex(value);
    return (interval.lowerClosed ? '[' : '(') + fmt(interval.lower) + ';' + fmt(interval.upper) + (interval.upperClosed ? ']' : ')');
}
const intervalsTex = (values: Interval[]) => values.length ? values.map(intervalTex).join('\\cup') : '\\varnothing';
function parseIntervals(env: CurveEnvironment, source: string): Interval[] | null {
    const text = clean(source).replace(new RegExp('^' + escape(env.variable) + '\\s*\\\\in\\s*', 'u'), '').trim();
    if (/^(?:\\varnothing|\\emptyset|∅|\{\}|\\\{\\\}|keine|leer)$/iu.test(text)) return [];
    if (/^(?:\\mathbb\{R\}|ℝ|R)$/u.test(text)) return [{ lower: '-inf', upper: '+inf', lowerClosed: false, upperClosed: false }];
    const parsed: Interval[] = [];
    for (const part of text.split(/\\cup|∪|\s+oder\s+/u)) {
        const match = /^([[(])\s*(.*?)\s*([\])])$/u.exec(part.trim());
        if (!match) return null;
        const ends = splitTop(match[2]);
        if (ends.length !== 2) return null;
        const lower = parseBound(env, ends[0]), upper = parseBound(env, ends[1]);
        if (!lower || !upper || compare(env, lower, upper) !== -1 ||
            lower === '-inf' && match[1] === '[' || upper === '+inf' && match[3] === ']') return null;
        parsed.push({ lower, upper, lowerClosed: match[1] === '[', upperClosed: match[3] === ']' });
    }
    return parsed;
}
function sameIntervals(env: CurveEnvironment, actual: Interval[], expected: Interval[], scope: Interval, strictBoundary = false): Proof {
    if (actual.length !== expected.length) return false;
    const used = new Set<number>();
    for (const interval of actual) {
        const index = expected.findIndex((want, i) => !used.has(i) &&
            compare(env, interval.lower, want.lower) === 0 && compare(env, interval.upper, want.upper) === 0);
        if (index < 0) return false;
        if (strictBoundary && (interval.lowerClosed !== expected[index].lowerClosed || interval.upperClosed !== expected[index].upperClosed)) return false;
        if (compare(env, interval.lower, scope.lower) === 0 && interval.lowerClosed && !scope.lowerClosed ||
            compare(env, interval.upper, scope.upper) === 0 && interval.upperClosed && !scope.upperClosed) return false;
        used.add(index);
    }
    return true;
}
function finiteValues(env: CurveEnvironment, source: string): Array<{ x: string; y?: string }> | null {
    let value = clean(source);
    if (/^(?:\\varnothing|\\emptyset|∅|\{\}|\\\{\\\}|keine)$/iu.test(value)) return [];
    if (value.startsWith('\\{') && value.endsWith('\\}')) value = value.slice(2, -2);
    else if (value.startsWith('{') && value.endsWith('}')) value = value.slice(1, -1);
    const output: Array<{ x: string; y?: string }> = [];
    for (const item of splitTop(value)) {
        const point = /^\((.*)\)$/u.exec(item), coordinates = point ? splitTop(point[1], ';,|') : [];
        if (coordinates.length === 2) {
            const x = constant(env, coordinates[0]), y = constant(env, coordinates[1]);
            if (!x || !y) return null;
            output.push({ x, y });
        } else {
            const x = constant(env, item.replace(new RegExp('^' + escape(env.variable) + '(?:_\\{?\\d+\\}?)?\\s*=\\s*'), ''));
            if (!x) return null;
            output.push({ x });
        }
    }
    return output.length ? output : null;
}
function matchMarks(env: CurveEnvironment, values: Array<{ x: string; y?: string }>, marks: Mark[], points: boolean): Proof {
    if (values.length !== marks.length) return false;
    const used = new Set<number>();
    for (const value of values) {
        if (points && value.y === undefined) return false;
        const index = marks.findIndex((mark, i) => !used.has(i) && equal(env, value.x, mark.x) === true &&
            (value.y === undefined || equal(env, value.y, mark.y) === true));
        if (index < 0) return false;
        used.add(index);
    }
    return true;
}
const marksTex = (marks: Mark[], points: boolean) => marks.length ? '\\{' + marks.map(mark =>
    points ? '(' + curveTex(mark.x) + ';' + curveTex(mark.y) + ')' : curveTex(mark.x)).join(';') + '\\}' : '\\varnothing';

// A polynomial answer must remain defined everywhere in its stated polynomial domain.
// This grammar checks the original expression before CAS cancellation, including degree-five primitives.
function polynomialCandidate(env: CurveEnvironment, source: string): boolean {
    const tokens = source.match(/[A-Za-z][A-Za-z0-9_]*|\d+(?:\.\d+)?|[()+*/^,-]/gu) || [];
    if (tokens.join('') !== source.replace(/\s/gu, '') || tokens.length > 384) return false;
    let index = 0, depth = 0;
    type Node = { degree: number; start: number; end: number };
    const literal = (node: Node) => tokens.slice(node.start, node.end).join('');
    const parse = (minimum = 0): Node | null => {
        if (++depth > 32) return null;
        const start = index, token = tokens[index++]; let node: Node | null;
        if (token === '+' || token === '-') {
            const argument = parse(25); node = argument ? { degree: argument.degree, start, end: index } : null;
        } else if (token === '(') {
            node = parse();
            if (!node || tokens[index++] !== ')') return null;
            node = { degree: node.degree, start, end: index };
        } else if (token === env.variable) node = { degree: 1, start, end: index };
        else if (token && /^\d/u.test(token)) node = { degree: 0, start, end: index };
        else if (token && ['sqrt', 'log', 'exp', 'sin', 'cos', 'tan', 'abs'].includes(token) && tokens[index++] === '(') {
            const argument = parse();
            if (!argument || argument.degree || tokens[index++] !== ')') return null;
            node = { degree: 0, start, end: index };
            if (constant(env, literal(node)) === null) return null;
        } else return null;
        if (!node) return null;
        while (index < tokens.length) {
            const op = tokens[index], precedence = op === '+' || op === '-' ? 10 : op === '*' || op === '/' ? 20 : op === '^' ? 30 : -1;
            if (precedence < minimum) break;
            index++;
            const right = parse(op === '^' ? precedence : precedence + 1);
            if (!right) return null;
            let degree: number;
            if (op === '+' || op === '-') degree = Math.max(node.degree, right.degree);
            else if (op === '*') degree = node.degree + right.degree;
            else if (op === '/') {
                if (right.degree || curveSign(env, literal(right)) === 0 || constant(env, literal(right)) === null) return null;
                degree = node.degree;
            } else {
                if (right.degree) return null;
                const exponent = constant(env, literal(right));
                if (exponent === null || !/^\d+$/u.test(exponent) || Number(exponent) > 16) return null;
                degree = node.degree * Number(exponent);
            }
            if (degree > 16) return null;
            node = { degree, start: node.start, end: index };
        }
        depth--; return node;
    };
    const parsed = parse();
    return parsed !== null && index === tokens.length;
}

function evaluateChain(env: CurveEnvironment, text: string, expected: string): Proof {
    const pieces = text.split('=').map(piece => piece.trim());
    if (!pieces.length || pieces.some(piece => !piece)) return null;
    for (const piece of pieces) {
        const value = expression(env, piece);
        if (!value || !polynomialCandidate(env, value) && constant(env, value) === null) return null;
        const proof = equal(env, value, expected);
        if (proof !== true) return proof;
    }
    return true;
}
const derivativeLabel = (env: CurveEnvironment, order: number, point = env.variable) => env.name + "'".repeat(order) + '(' + point + ')';
function checkFunctionLine(env: CurveEnvironment, source: string, targetOrder?: number, targetPoint?: string): CurveLineResult | null {
    const match = /^([A-Za-z])\s*((?:'\s*)*)\(([^=]*)\)\s*=\s*(.+)$/u.exec(clean(source));
    if (!match || match[1] !== env.name) return null;
    const order = match[2].replace(/\s/gu, '').length;
    if (order > 8) return null;
    const value = order ? diff(env, env.expression, order) : env.expression;
    if (!value) return result(null);
    const arg = match[3].trim(), point = arg === env.variable ? null : constant(env, arg);
    if (arg !== env.variable && point === null) return null;
    const expected = point === null ? value : curveSubstitute(env, value, point);
    if (!expected) return result(null);
    let right = match[4];
    const assertion = /^(.*?)\s*(<|>|\\leq?|\\geq?|≤|≥)\s*(.*?)$/u.exec(right);
    if (assertion) right = assertion[1];
    let proof = evaluateChain(env, right, expected);
    if (proof === true && assertion) {
        const compared = constant(env, assertion[3]);
        const sign = compared ? curveSign(env, '(' + expected + ')-(' + compared + ')') : null;
        proof = sign === null ? null : assertion[2] === '<' ? sign < 0 : assertion[2] === '>' ? sign > 0
            : /le|≤/u.test(assertion[2]) ? sign <= 0 : sign >= 0;
    }
    const target = targetOrder === order && (targetPoint === undefined ? point === null : point !== null && equal(env, point, targetPoint) === true);
    return result(proof, proof === true && target ? ['answer'] : []);
}
const primitiveName = (env: CurveEnvironment): string => ['F', 'G', 'H'].find(name => name !== env.name && name !== env.variable)!;
const primitiveConstant = (env: CurveEnvironment): string => env.variable === 'C' ? 'K' : 'C';
function checkPrimitive(env: CurveEnvironment, source: string, integrand: string, family: boolean, targets: string[], state?: { fixed?: string }): CurveLineResult | null {
    const name = primitiveName(env), label = new RegExp('^(?:' + name + '\\([A-Za-z]\\)|' + name + '|[Ss]tammfunktion)\\s*(?:=|:)\\s*(.+)$', 'u');
    const match = label.exec(clean(source));
    if (!match) return null;
    if (match[0].startsWith(name + '(') && !match[0].startsWith(name + '(' + env.variable + ')')) return result(false);
    let body = match[1].trim();
    const arbitraryPattern = new RegExp('[+\\-]\\s*' + primitiveConstant(env) + '\\s*$', 'u');
    const soleConstant = [primitiveConstant(env), '+' + primitiveConstant(env), '-' + primitiveConstant(env)].includes(body.replace(/\s/gu, ''));
    const arbitrary = soleConstant || arbitraryPattern.test(body);
    if (soleConstant) body = '0';
    else if (arbitrary) body = body.replace(arbitraryPattern, '').trim();
    const normalized = expression(env, body);
    if (!normalized || !polynomialCandidate(env, normalized)) return result(null);
    const derivative = diff(env, normalized), proof = derivative ? equal(env, derivative, integrand) : null;
    if (proof === true && family && !arbitrary) return result(false);
    if (proof === true && !arbitrary && state) {
        if (state.fixed !== undefined && equal(env, state.fixed, normalized) !== true) return result(false);
        state.fixed = normalized;
    }
    return result(proof, proof === true ? targets : []);
}
function numericLine(env: CurveEnvironment, source: string, aliases: string[], expected: string, targets = ['answer']): CurveLineResult | null {
    const text = clean(source), match = new RegExp('^(?:' + aliases.map(escape).join('|') + ')\\s*(?:=|:)\\s*(.+)$', 'iu').exec(text);
    if (!match && /[=:]/u.test(text)) return null;
    const proof = evaluateChain(env, match ? match[1] : text, expected);
    return proof === null ? null : result(proof, proof ? targets : []);
}


function buildDerivative(env: CurveEnvironment): CurveTaskModel | null {
    const order = env.context.order ?? 1;
    if (!Number.isInteger(order) || order < 1 || order > 8) return null;
    const value = diff(env, env.expression, order);
    if (!value) return null;
    const atPoint = env.context.task === 'derivative-value', point = atPoint && env.context.point ? constant(env, env.context.point) : null;
    if (atPoint && point === null) return null;
    const expected = point === null ? value : curveSubstitute(env, value, point);
    if (!expected) return null;
    const interval = env.context.interval ? domain(env) : null;
    if (env.context.interval && (!interval || point !== null && within(env, point, interval) !== true)) return null;
    return { expectedLines: [derivativeLabel(env, order, point === null ? env.variable : curveTex(point)) + '=' + curveTex(expected)], required: ['answer'],
        checkLine(source) {
            const checked = checkFunctionLine(env, source, order, point === null ? undefined : point);
            if (checked) return checked;
            if (atPoint) return numericLine(env, source, ['m', 'Steigung', 'Ableitungswert'], expected);
            const proof = evaluateChain(env, clean(source).replace(/^Ableitung\s*:\s*/iu, ''), expected);
            return proof === null ? null : result(proof, proof ? ['answer'] : []);
        } };
}
function buildLine(env: CurveEnvironment): CurveTaskModel | null {
    const point = env.context.point && constant(env, env.context.point), derivative = diff(env, env.expression);
    if (!point || !derivative) return null;
    const interval = env.context.interval ? domain(env) : null;
    if (env.context.interval && (!interval || within(env, point, interval) !== true)) return null;
    const y = curveSubstitute(env, env.expression, point), slope = curveSubstitute(env, derivative, point);
    if (!y || !slope) return null;
    const slopeSign = curveSign(env, slope);
    if (slopeSign === null) return null;
    const normal = env.context.task === 'normal', vertical = normal && slopeSign === 0;
    const normalSlope = slopeSign === 0 ? null : cas(env, '-1/(' + slope + ')');
    if (slopeSign !== 0 && normalSlope === null) return null;
    const actualSlope = normal ? normalSlope : slope;
    const line = vertical ? point : actualSlope && cas(env, '(' + actualSlope + ')*(' + env.variable + '-(' + point + '))+(' + y + ')');
    if (!line) return null;
    const names = [normal ? 'n' : 't', 'g', 'h'].filter(name => name !== env.name && name !== env.variable);
    const lineName = names[0];
    return { expectedLines: [vertical ? env.variable + '=' + curveTex(point) : lineName + '(' + env.variable + ')=' + curveTex(line)], required: ['answer'],
        checkLine(source) {
            const text = clean(source).replace(/^(?:Tangente|Normale)\s*:\s*/iu, ''), match = /^(.+?)\s*=\s*(.+)$/u.exec(text);
            if (match) {
                const left = match[1].trim();
                if (left === env.variable) { const proof = vertical ? evaluateChain(env, match[2], point) : false; return result(proof, proof ? ['answer'] : []); }
                if (left === 'y' || new RegExp('^(?:' + names.map(escape).join('|') + ')\\(' + escape(env.variable) + '\\)$', 'u').test(left)) {
                    const proof = vertical ? false : evaluateChain(env, match[2], line);
                    return result(proof, proof ? ['answer'] : []);
                }
                if (/^(?:m|m_[tn]|m_\{[tn]\})$/u.test(left)) {
                    const wanted = /_t|_\{t\}/u.test(left) ? slope : /_n|_\{n\}/u.test(left) ? normalSlope : actualSlope;
                    return result(wanted === null ? false : evaluateChain(env, match[2], wanted));
                }
            }
            return checkFunctionLine(env, source);
        } };
}

function classifiedMarks(env: CurveEnvironment, interval: Interval, inflections: boolean): Mark[] | null {
    const derivative = diff(env, env.expression, inflections ? 2 : 1);
    if (!derivative) return null;
    if (equal(env, derivative, '0') === true) return [];
    const raw = curveRealRoots(env, derivative), roots = raw && sorted(env, raw);
    if (!roots) return null;
    const marks: Mark[] = [];
    for (const x of roots) {
        const inside = within(env, x, interval, true);
        if (inside === null) return null;
        if (!inside) continue;
        const count = multiplicity(env, derivative, x);
        if (count === null) return null;
        if (!(count % 2)) continue;
        const firstNonzero = diff(env, derivative, count), at = firstNonzero && curveSubstitute(env, firstNonzero, x);
        const sign = at ? curveSign(env, at) : null, y = curveSubstitute(env, env.expression, x);
        if (sign === null || !sign || !y) return null;
        marks.push({ x, y, kind: inflections ? 'W' : sign > 0 ? 'T' : 'H' });
    }
    return marks;
}
function globalMarks(env: CurveEnvironment, interval: Interval): Mark[] | null {
    const polynomial = curvePolynomial(env, env.expression);
    if (!polynomial || !polynomial.degree) return null;
    const derivative = diff(env, env.expression), roots = derivative && curveRealRoots(env, derivative);
    if (!roots) return null;
    const candidates: string[] = [];
    for (const x of roots) {
        const inside = within(env, x, interval);
        if (inside === null) return null;
        if (inside) candidates.push(x);
    }
    if (interval.lower !== '-inf' && interval.lowerClosed) candidates.push(interval.lower);
    if (interval.upper !== '+inf' && interval.upperClosed) candidates.push(interval.upper);
    const unique = sorted(env, candidates);
    if (!unique) return null;
    const values: Array<{ x: string; y: string }> = [];
    for (const x of unique) { const y = curveSubstitute(env, env.expression, x); if (!y) return null; values.push({ x, y }); }
    const comparisons: Bound[] = values.map(value => value.y), leading = curveSign(env, polynomial.coefficients[polynomial.degree]);
    if (!leading) return null;
    for (const endpoint of [interval.lower, interval.upper]) {
        if (endpoint === '-inf' || endpoint === '+inf') {
            const sign = endpoint === '-inf' && polynomial.degree % 2 ? -leading : leading;
            comparisons.push(sign > 0 ? '+inf' : '-inf');
        } else { const y = curveSubstitute(env, env.expression, endpoint); if (!y) return null; comparisons.push(y); }
    }
    const marks: Mark[] = [];
    for (const value of values) {
        let low = true, high = true;
        for (const other of comparisons) {
            const sign = compare(env, value.y, other);
            if (sign === null) return null;
            if (sign > 0) low = false;
            if (sign < 0) high = false;
        }
        if (low) marks.push({ ...value, kind: 'T' });
        if (high) marks.push({ ...value, kind: 'H' });
    }
    return marks;
}
function checkStationaryWork(env: CurveEnvironment, source: string, inflections: boolean, knownIndices?: Map<string, string>): CurveLineResult | null {
    const text = clean(source), order = inflections ? 2 : 1;
    // This line states a necessary condition; it is not an identity of functions.
    if (text.replace(/\s/gu, '') === derivativeLabel(env, order) + '=0') return result(true);
    const checked = checkFunctionLine(env, text);
    if (checked) return checked;
    const derivative = diff(env, env.expression, order);
    if (!derivative) return result(null);
    const roots = equal(env, derivative, '0') === true ? null : curveRealRoots(env, derivative);
    const isolated = new RegExp('^' + escape(env.variable) + '(?:_\\{?\\d+\\}?)?\\s*=\\s*(.+)$', 'u').exec(text);
    if (isolated && roots) {
        const point = constant(env, isolated[1]);
        if (point) {
            if (!roots.some(root => equal(env, point, root) === true)) return result(false);
            const label = text.slice(0, text.indexOf('=')).replace(/\s|[{}]/gu, '');
            if (knownIndices && label.includes('_')) {
                const previous = knownIndices.get(label);
                if (previous !== undefined && equal(env, previous, point) !== true) return result(false);
                knownIndices.set(label, point);
            }
            return result(roots.some(root => equal(env, point, root) === true));
        }
    }
    const equation = text.split('=');
    if (equation.length === 2) {
        const left = expression(env, equation[0]), right = expression(env, equation[1]);
        if (!left || !right) return null;
        const delta = cas(env, '(' + left + ')-(' + right + ')');
        if (!delta) return result(null);
        if (equal(env, delta, '0') === true) return result(true);
        const candidates = roots && curveRealRoots(env, delta);
        if (roots && candidates) return result(matchMarks(env, candidates.map(x => ({ x })), roots.map(x => ({ x, y: '0', kind: 'W' })), false));
    }
    return null;
}
function markKind(label: string): 'H' | 'T' | 'W' | 'E' | null {
    const source = label.trim().toLocaleLowerCase('de-DE');
    if (/^(?:h(?:_\{?\d+\}?)?|hochstellen?|hochpunkte?|maxima|maximum|maximalstellen?)$/u.test(source)) return 'H';
    if (/^(?:t(?:_\{?\d+\}?)?|tiefstellen?|tiefpunkte?|minima|minimum|minimalstellen?)$/u.test(source)) return 'T';
    if (/^(?:w(?:_\{?\d+\}?)?|wendestellen?|wendepunkte?)$/u.test(source)) return 'W';
    if (/^(?:e|extremstellen?|extrempunkte?|extrema)$/u.test(source)) return 'E';
    return null;
}
function buildMarks(env: CurveEnvironment): CurveTaskModel | null {
    const interval = domain(env);
    if (!interval) return null;
    const inflections = env.context.task === 'inflections' || env.context.task === 'inflection-points';
    const points = env.context.task === 'extrema-points' || env.context.task === 'inflection-points';
    const global = !inflections && env.context.scope === 'global', polynomial = curvePolynomial(env, env.expression);
    if (!polynomial) return null;
    // Global maxima/minima of a constant function are non-strict and comprise its whole domain.
    if (global && polynomial.degree === 0) {
        const answer = points ? '\\{(' + env.variable + ';' + curveTex(polynomial.coefficients[0]) + ')\\mid ' + env.variable + '\\in ' + intervalTex(interval) + '\\}' : intervalTex(interval);
        return { expectedLines: ['H=' + answer, 'T=' + answer], required: ['global-H', 'global-T'], checkLine(source) {
            const match = /^(H|T)\s*=\s*(.+)$/u.exec(clean(source));
            if (!match) return checkFunctionLine(env, source);
            let proof: Proof;
            if (points) proof = clean(match[2]).replace(/\s/gu, '') === clean(answer).replace(/\s/gu, '');
            else { const got = parseIntervals(env, match[2]); proof = got ? sameIntervals(env, got, [interval], interval, true) : null; }
            return result(proof, proof ? ['global-' + match[1]] : []);
        } };
    }
    const marks = global ? globalMarks(env, interval) : classifiedMarks(env, interval, inflections);
    if (!marks) return null;
    const knownIndices = new Map<string, string>(), knownPoints = new Map<string, string>();
    const key = (mark: Mark) => mark.kind + '-' + marks.indexOf(mark);
    const required = marks.length ? marks.map(key) : ['none'], categories = inflections ? ['W'] as const : ['H', 'T'] as const;
    const expectedLines = marks.length ? categories.flatMap(kind => {
        const selected = marks.filter(mark => mark.kind === kind);
        return selected.length ? [kind + '=' + marksTex(selected, points)] : [];
    }) : [(inflections ? 'W' : 'E') + '=\\varnothing'];
    return { expectedLines, required, checkLine(source) {
        const text = clean(source);
        const none = /^keine?(?:\s+(lokalen?|globalen?))?(?:\s+(Extremstellen|Extrempunkte|Extrema|Wendestellen|Wendepunkte))?\.?$/iu.exec(text);
        if (none) {
            if (none[2] && /^Wende/iu.test(none[2]) !== inflections) return result(false);
            if (none[1] && (inflections || /^global/iu.test(none[1]) !== global)) return result(false);
            return result(!marks.length, !marks.length ? ['none'] : []);
        }
        let label: string | undefined, body: string | undefined, single = false;
        const assigned = /^([^=:()]+?)\s*(?:=|:)\s*(.+)$/u.exec(text), direct = /^([HTW](?:_\{?\d+\}?)?)\s*(\(.*\))$/u.exec(text);
        if (assigned) { label = assigned[1]; body = assigned[2]; }
        else if (direct) { label = direct[1]; body = direct[2]; single = true; }
        const kind = label && markKind(label);
        if (kind && body) {
            if (inflections && kind !== 'W' || !inflections && kind === 'W') return result(false);
            const values = finiteValues(env, body);
            if (!values) return result(null);
            const selected = kind === 'E' ? marks : marks.filter(mark => mark.kind === kind);
            single ||= !/^\s*(?:\\\{|\{)/u.test(body) && values.length === 1;
            if (single) {
                const matched = selected.find(mark => matchMarks(env, values, [mark], points) === true);
                if (matched && label!.includes('_')) {
                    const name = label!.replace(/[{}\s]/gu, ''), previous = knownPoints.get(name);
                    if (previous !== undefined && equal(env, previous, matched.x) !== true) return result(false);
                    knownPoints.set(name, matched.x);
                }
                return result(!!matched, matched && kind !== 'E' ? [key(matched)] : []);
            }
            const proof = matchMarks(env, values, selected, points), targets = !marks.length && (kind === 'E' || inflections) ? ['none'] : kind === 'E' ? [] : selected.map(key);
            return result(proof, proof ? targets : []);
        }
        return checkStationaryWork(env, source, inflections, knownIndices);
    } };
}


function buildBehavior(env: CurveEnvironment): CurveTaskModel | null {
    const interval = domain(env), curvature = env.context.task === 'curvature';
    const derivative = diff(env, env.expression, curvature ? 2 : 1);
    if (!interval || !derivative) return null;
    const groups = signIntervals(env, derivative, interval);
    if (!groups) return null;
    const labels: Array<{ sign: Sign; label: string; aliases: RegExp }> = curvature ? [
        { sign: 1, label: 'konvex', aliases: /^(?:konvex|linksgekrümmt|linksgekruemmt)$/iu },
        { sign: -1, label: 'konkav', aliases: /^(?:konkav|rechtsgekrümmt|rechtsgekruemmt)$/iu },
        { sign: 0, label: 'ungekrümmt', aliases: /^(?:ungekrümmt|ungekruemmt|linear|keine Krümmung)$/iu }
    ] : [
        { sign: 1, label: 'steigend', aliases: /^(?:(?:streng\s+)?(?:monoton\s+)?(?:steigend|wachsend))$/iu },
        { sign: -1, label: 'fallend', aliases: /^(?:(?:streng\s+)?(?:monoton\s+)?(?:fallend|abnehmend))$/iu },
        { sign: 0, label: 'konstant', aliases: /^(?:konstant)$/iu }
    ];
    const knownIndices = new Map<string, string>();
    const nonempty = labels.filter(label => groups.get(label.sign)!.length);
    return { expectedLines: nonempty.map(label => label.label + ': ' + intervalsTex(groups.get(label.sign)!)),
        required: nonempty.map(label => 'behavior-' + label.sign), checkLine(source) {
            const match = /^(.+?)\s*[:=]\s*(.+)$/u.exec(clean(source));
            if (match) {
                const label = labels.find(label => label.aliases.test(match[1].trim()));
                if (label) {
                    const intervals = parseIntervals(env, match[2]), proof = intervals ? sameIntervals(env, intervals, groups.get(label.sign)!, interval) : null;
                    return result(proof, proof && groups.get(label.sign)!.length ? ['behavior-' + label.sign] : []);
                }
            }
            return checkStationaryWork(env, source, curvature, knownIndices);
        } };
}
function buildPrimitive(env: CurveEnvironment): CurveTaskModel | null {
    if (env.context.interval && !domain(env)) return null;
    const primitive = integral(env, env.expression);
    if (!primitive) return null;
    const family = env.context.family === true, primitiveState: { fixed?: string } = {};
    return { expectedLines: [primitiveName(env) + '(' + env.variable + ')=' + curveTex(primitive) + (family ? '+' + primitiveConstant(env) : '')], required: ['answer'],
        checkLine(source) { return checkPrimitive(env, source, env.expression, family, ['answer'], primitiveState) || checkFunctionLine(env, source); } };
}
function buildIntegral(env: CurveEnvironment): CurveTaskModel | null {
    const lower = env.context.lower && constant(env, env.context.lower), upper = env.context.upper && constant(env, env.context.upper);
    if (!lower || !upper) return null;
    const area = env.context.task === 'area';
    let secondSource = env.context.secondFunction || '0';
    const definition = /^([A-Za-z])\s*\(\s*([A-Za-z])\s*\)\s*=\s*(.+)$/u.exec(secondSource);
    if (definition) { if (definition[2] !== env.variable) return null; secondSource = definition[3]; }
    const second = area ? expression(env, secondSource) : '0';
    if (!second || !curvePolynomial(env, second)) return null;
    const integrand = area ? cas(env, '(' + env.expression + ')-(' + second + ')') : env.expression;
    if (!integrand) return null;
    const primitive = integral(env, integrand);
    if (!primitive) return null;
    const relation = compare(env, lower, upper);
    if (relation === null) return null;
    const authored = env.context.interval ? domain(env) : null;
    if (env.context.interval && (!authored || compare(env, authored.lower, relation > 0 ? upper : lower) !== 0 ||
        compare(env, authored.upper, relation > 0 ? lower : upper) !== 0)) return null;
    let value: string | null;
    if (!area || !relation) {
        const high = curveSubstitute(env, primitive, upper), low = curveSubstitute(env, primitive, lower);
        value = high && low ? cas(env, '(' + high + ')-(' + low + ')') : null;
    } else {
        const a = relation > 0 ? upper : lower, b = relation > 0 ? lower : upper;
        const raw = equal(env, integrand, '0') === true ? [] : curveRealRoots(env, integrand), roots = raw && sorted(env, raw);
        if (!roots) return null;
        const bounds = [a];
        for (const root of roots) {
            const left = compare(env, root, a), right = compare(env, root, b);
            if (left === null || right === null) return null;
            if (left > 0 && right < 0) bounds.push(root);
        }
        bounds.push(b); value = '0';
        for (let i = 1; i < bounds.length; i++) {
            const high = curveSubstitute(env, primitive, bounds[i]), low = curveSubstitute(env, primitive, bounds[i - 1]);
            const piece = high && low ? cas(env, '(' + high + ')-(' + low + ')') : null, sign = piece ? curveSign(env, piece) : null;
            if (!piece || sign === null) return null;
            value = cas(env, '(' + value + ')+(' + (sign < 0 ? '-(' + piece + ')' : piece) + ')');
            if (!value) return null;
        }
    }
    if (!value) return null;
    const expected = value, primitiveState: { fixed?: string } = {};
    return { expectedLines: [(area ? 'A' : 'I') + '=' + curveTex(expected)], required: ['answer'], checkLine(source) {
        const primitiveLine = checkPrimitive(env, source, integrand, false, [], primitiveState);
        if (primitiveLine) return primitiveLine;
        let text = clean(source);
        const explicit = /^\\int_\{([^{}]*)\}\^\{([^{}]*)\}\s*(.*?)\s*d\s*([A-Za-z])\s*=\s*(.+)$/u.exec(text.replace(/^[IA]\s*=\s*(?=\\int)/u, ''));
        if (explicit) {
            const a = constant(env, explicit[1]), b = constant(env, explicit[2]), f = expression(env, explicit[3]);
            if (explicit[4] !== env.variable || !a || !b || !f || !polynomialCandidate(env, f)) return result(null);
            const sameBounds = equal(env, a, lower) === true && equal(env, b, upper) === true;
            const reverseBounds = equal(env, a, upper) === true && equal(env, b, lower) === true;
            const sameFunction = equal(env, f, integrand) === true;
            if (!area && (!sameBounds || !sameFunction)) return result(false);
            if (area) {
                if ((!sameBounds && !reverseBounds) || !sameFunction && equal(env, f, '-(' + integrand + ')') !== true) return result(false);
                const candidatePrimitive = integral(env, f);
                const high = candidatePrimitive && curveSubstitute(env, candidatePrimitive, b), low = candidatePrimitive && curveSubstitute(env, candidatePrimitive, a);
                const signed = high && low ? cas(env, '(' + high + ')-(' + low + ')') : null;
                if (!signed || equal(env, signed, expected) !== true) return result(false);
            }
            return numericLine(env, 'I=' + explicit[5], ['I'], expected);
        }
        let invalidPair = false, pairCount = 0;
        text = text.replace(new RegExp(primitiveName(env) + '\\(([^()]*)\\)\\s*-\\s*' + primitiveName(env) + '\\(([^()]*)\\)', 'gu'), (_, highTex: string, lowTex: string) => {
            pairCount++;
            const highPoint = constant(env, highTex), lowPoint = constant(env, lowTex);
            if (!highPoint || !lowPoint || !area && (equal(env, highPoint, upper) !== true || equal(env, lowPoint, lower) !== true)) {
                invalidPair = true; return '';
            }
            const high = curveSubstitute(env, primitive, highPoint), low = curveSubstitute(env, primitive, lowPoint);
            if (!high || !low) { invalidPair = true; return ''; }
            return '((' + high + ')-(' + low + '))';
        });
        if (invalidPair) return result(false);
        if (pairCount && clean(source).startsWith(primitiveName(env) + '(')) text = (area ? 'A=' : 'I=') + text;
        return numericLine(env, text, area ? ['A', 'Fläche', 'Flaeche', 'Flächeninhalt', 'Flaecheninhalt'] : ['I', 'Integral'], expected)
            || checkFunctionLine(env, source);
    } };
}

/** Unsupported algebraic roots or domains remain unknown; no approximate fallback proves a result. */
export function buildCalculusTask(env: CurveEnvironment): CurveTaskModel | null {
    const task = env.context.task;
    if (!task || !TASKS.has(task) || !curvePolynomial(env, env.expression)) return null;
    if (task === 'derivative' || task === 'derivative-value') return buildDerivative(env);
    if (task === 'tangent' || task === 'normal') return buildLine(env);
    if (task === 'extrema' || task === 'extrema-points' || task === 'inflections' || task === 'inflection-points') return buildMarks(env);
    if (task === 'monotonicity' || task === 'curvature') return buildBehavior(env);
    if (task === 'antiderivative') return buildPrimitive(env);
    return buildIntegral(env);
}
