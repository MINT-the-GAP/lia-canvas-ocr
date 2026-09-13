import { type AlgebriteRuntime, type Proof } from './equivalence.ts';
import type { CalculationContext } from './calculation-context.ts';
import { isCalculationCasInputBounded } from './calculation-proof-budget.ts';
import { analyzeNumericPolynomial, algebraicConstantSign, proveAlgebraicConstantIdentity, provePolynomialCandidateSet, type NumericPolynomial } from './nonlinear-proof.ts';
import { normalizeFunctionExpression, functionConstantToTex, compareFunctionConstants, analyzeFunctionPolynomialEquation, functionExpressionDefinedAt } from './exponential-log-proof.ts';
import { normalizeTrigExpression } from './trigonometric-proof.ts';

/** Each task proves its own assertions; differentiation is not equation equivalence. */
export interface CurveEnvironment {
    prompt: string;
    name: string;
    variable: string;
    /** Uncancelled, bounded expression. Domain checks use this original expression. */
    expression: string;
    runtime: AlgebriteRuntime;
    context: CalculationContext;
}
export interface CurveLineResult { proof: Proof; targets?: string[]; reason?: string; }
export interface CurveTaskModel {
    expectedLines: string[];
    required: string[];
    checkLine(source: string): CurveLineResult | null;
}

export function curveClean(text: string): string {
    return text.trim().replace(/^\$([^]*)\$$/u, '$1')
        .replace(/\\(?:left|right)(?![A-Za-z])/gu, '')
        .replace(/\\(?:quad|qquad|,|;|!| )(?![A-Za-z])/gu, ' ')
        .replace(/[−–]/gu, '-').replace(/′/gu, "'").replace(/″/gu, "''")
        .replace(/\\text\s*\{([^{}]*)\}/gu, '$1').trim();
}

const COMMANDS = new Set(['simplify', 'expand', 'rationalize', 'factor', 'numerator', 'denominator',
    'degree', 'coeff', 'd', 'subst', 'integral', 'roots', 'sqrt', 'log', 'exp', 'sin', 'cos', 'tan', 'abs']);

/** Only task code constructs commands; learner expressions pass the expression grammar. */
function boundedCommand(source: string): boolean {
    if (source.length > 8192 || !/^[A-Za-z0-9_+*/^().,\s-]+$/u.test(source)) return false;
    const calls = source.match(/[A-Za-z][A-Za-z0-9_]*(?=\s*\()/gu) || [];
    if (calls.some(name => !COMMANDS.has(name))) return false;
    const estimate = source.replace(/\b(?:factor|numerator|denominator|abs)\s*\(/gu, 'simplify(')
        .replace(/\b(?:integral|roots|degree)\s*\(/gu, 'd(')
        .replace(/\b(?:log|exp|sin|cos|tan)\s*\(/gu, 'sqrt(');
    return isCalculationCasInputBounded(estimate);
}

/** One budget and cache per submitted task, shared by its subgoals. */
export function curveRuntime(runtime: AlgebriteRuntime): AlgebriteRuntime {
    const memo = new Map<string, string>();
    let calls = 0;
    return { run(source: string): string {
        if (!boundedCommand(source)) throw new Error('Unsupported or oversized curve calculation.');
        const cached = memo.get(source);
        if (cached !== undefined) return cached;
        if (++calls > 4096) throw new Error('Curve calculation budget exceeded.');
        const result = String(runtime.run(source)).replace(/\s/gu, '');
        if (!result || result.length > 4096 || /Stop:|Error|NaN|undefined|Infinity/u.test(result)) throw new Error('Unproved curve calculation.');
        memo.set(source, result);
        return result;
    } };
}

export function cas(env: CurveEnvironment, source: string): string | null {
    if (!boundedCommand(source)) return null;
    try {
        const result = String(env.runtime.run(source)).replace(/\s/gu, '');
        return result && result.length <= 4096 && !/Stop:|Error|NaN|undefined|Infinity/u.test(result) ? result : null;
    } catch { return null; }
}

/** Undefined real constants must not disappear through cancellation in the CAS. */
function realConstantSubexpressions(source: string, env: CurveEnvironment): boolean {
    const variable = new RegExp('\\b' + env.variable + '\\b', 'u');
    const starts: number[] = [];
    const check = (part: string): boolean => variable.test(part) ||
        functionExpressionDefinedAt(part, env.variable, '0', { runtime: env.runtime }) === true;
    if (!variable.test(source)) return check(source);
    for (let i = 0; i < source.length; i++) {
        if (source[i] === '(') {
            let begin = i;
            while (begin > 0 && /[A-Za-z]/u.test(source[begin - 1])) begin--;
            starts.push(begin);
        } else if (source[i] === ')') {
            const begin = starts.pop();
            if (begin === undefined || !check(source.slice(begin, i + 1))) return false;
        }
    }
    return starts.length === 0;
}

export function normalizeCurveExpression(tex: string, env: CurveEnvironment): string | null {
    if (typeof tex !== 'string' || tex.length > 2048) return null;
    const clean = curveClean(tex);
    const value = normalizeFunctionExpression(clean) || normalizeTrigExpression(clean, { runtime: env.runtime, angleUnit: env.context.angleUnit });
    if (!value || !boundedCommand(value) || !realConstantSubexpressions(value, env)) return null;
    const symbols = value.match(/[A-Za-z][A-Za-z0-9_]*/gu) || [];
    return symbols.every(symbol => symbol === env.variable || ['pi', 'e', 'sqrt', 'log', 'exp', 'sin', 'cos', 'tan', 'abs'].includes(symbol)) ? value : null;
}

/** Algebraic identity; callers independently retain the original domain. */
export function curveEqual(env: CurveEnvironment, a: string, b: string): Proof {
    const left = normalizeCurveExpression(a, env), right = normalizeCurveExpression(b, env);
    if (!left || !right) return null;
    const difference = cas(env, 'simplify((' + left + ')-(' + right + '))');
    if (difference === '0') return true;
    if (difference === null) return null;
    const constant = proveAlgebraicConstantIdentity(left, right, env.runtime);
    if (constant !== null) return constant;
    const polynomial = curvePolynomial(env, difference);
    if (polynomial) return polynomial.coefficients.every(coefficient => coefficient === '0');
    return compareFunctionConstants(left, right, { runtime: env.runtime });
}

export function curveConstant(env: CurveEnvironment, tex: string): string | null {
    const value = normalizeCurveExpression(tex, env);
    if (!value || new RegExp('\\b' + env.variable + '\\b', 'u').test(value)) return null;
    // Inspect the unsimplified expression, so undefined terms cannot cancel.
    if (functionExpressionDefinedAt(value, env.variable, '0', { runtime: env.runtime }) !== true) return null;
    const result = cas(env, 'simplify(' + value + ')');
    return result !== null && compareFunctionConstants(result, result, { runtime: env.runtime }) === true ? result : null;
}

export function curveSign(env: CurveEnvironment, value: string): -1 | 0 | 1 | null {
    const expression = curveConstant(env, value);
    return expression === null ? null : algebraicConstantSign(expression, env.runtime);
}
export function curveTex(value: string): string { return functionConstantToTex(value); }

export function curveSubstitute(env: CurveEnvironment, expression: string, value: string): string | null {
    const source = normalizeCurveExpression(expression, env), point = curveConstant(env, value);
    if (!source || point === null || functionExpressionDefinedAt(source, env.variable, point, { runtime: env.runtime }) !== true) return null;
    return cas(env, 'simplify(subst((' + point + '),' + env.variable + ',(' + source + ')))');
}
export function curvePolynomial(env: CurveEnvironment, expression: string): NumericPolynomial | null {
    const source = normalizeCurveExpression(expression, env);
    return source ? analyzeNumericPolynomial({ left: { cas: source, domainRisk: false }, right: { cas: '0', domainRisk: false } }, env.runtime) : null;
}
export function curveRealRoots(env: CurveEnvironment, expression: string): string[] | null {
    const polynomial = curvePolynomial(env, expression);
    if (!polynomial) return null;
    if (polynomial.degree === 0) return polynomial.coefficients[0] === '0' ? null : [];
    const equation = { left: { cas: polynomial.expression, domainRisk: false }, right: { cas: '0', domainRisk: false } };
    let candidates: string[] | null = null;
    const model = analyzeFunctionPolynomialEquation(expression + '=0', { runtime: env.runtime });
    if (model?.solutions.kind === 'finite') candidates = model.solutions.values;
    if (!candidates) {
        // CAS candidates become a proof only after membership AND completeness checks below.
        const result = cas(env, 'roots((' + polynomial.expression + '),' + env.variable + ')');
        if (!result || /\broots\b/u.test(result)) return null;
        const body = result.startsWith('[') && result.endsWith(']') ? result.slice(1, -1) : result;
        let depth = 0, begin = 0;
        candidates = [];
        for (let i = 0; i <= body.length; i++) {
            if (body[i] === '(') depth++;
            else if (body[i] === ')') depth--;
            if (i === body.length || body[i] === ',' && depth === 0) { candidates.push(body.slice(begin, i)); begin = i + 1; }
        }
    }
    if (!candidates.length || candidates.length > 4) return provePolynomialCandidateSet(equation, [], env.runtime)?.complete ? [] : null;
    const values = candidates.map(value => curveConstant(env, value)).filter((value): value is string => value !== null);
    const verified = provePolynomialCandidateSet(equation, values, env.runtime);
    return verified?.proof === true && verified.complete ? [...(verified.solutions || values as string[])] : null;
}

export function createCurveEnvironment(prompt: string, context: CalculationContext, runtime: AlgebriteRuntime): CurveEnvironment | null {
    if (typeof prompt !== 'string' || !prompt.trim() || prompt.length > 2048) return null;
    const clean = curveClean(prompt);
    const definition = /^([A-Za-z])\s*\(\s*([A-Za-z])\s*\)\s*=\s*(.+)$/u.exec(clean);
    const raw = definition ? definition[3] : clean;
    if (!definition && context.task !== 'simplify') return null;
    const name = definition?.[1] || 'f', variable = definition?.[2] ||
        raw.replace(/\\[A-Za-z]+|\b(?:sqrt|sin|cos|tan|log|ln|exp|pi)\b/gu, '').match(/[A-Za-z]/u)?.[0] || 'x';
    if (name === variable || ['e', 'i'].includes(variable) || /[=<>;]/u.test(raw)) return null;
    const env: CurveEnvironment = { prompt, name, variable, expression: '', runtime: curveRuntime(runtime), context };
    const expression = normalizeCurveExpression(raw, env);
    return expression ? { ...env, expression } : null;
}
