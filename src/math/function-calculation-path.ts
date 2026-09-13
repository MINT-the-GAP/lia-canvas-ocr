import { usesCurveCalculation, generateCurveExpectedCalculation } from './curve-calculation-path.ts';
import {
    calculationProofTools as proof, type CalculationQuizGrade, type TransitionCheck,
    type TransitionReason, type TransitionValidationOptions, type Proof
} from './equivalence.ts';
import { analyzeNumericPolynomial, algebraicConstantSign, proveAlgebraicConstantIdentity } from './nonlinear-proof.ts';
import { prepareCalculationTask, usesFunctionCalculation } from './calculation-context.ts';
import type { FunctionContext, FunctionEquationModel, RealSolutionSet } from './function-proof-types.ts';
import { analyzeTrigEquation, compareTrigSolutionSets, parseTrigSolutionTarget, normalizeTrigExpression, restrictTrigSolutionSet, trigSolutionContains } from './trigonometric-proof.ts';
import {
    analyzeExponentialLogEquation, normalizeFunctionExpression,
    functionConstantToTex, compareFunctionConstants, analyzeFunctionPolynomialEquation,
    isPositiveExponential, proveExponentialLogDomainAssertion, functionExpressionDefinedAt
} from './exponential-log-proof.ts';
import { generateExpectedCalculation } from './expected-calculation.ts';
import { CalculationPathValidation } from './calculation-path.ts';

function cas(source: string, context: FunctionContext): string | null {
    if (source.length > 4096 || !/^[A-Za-z0-9_+*/^().,\s-]+$/u.test(source)) return null;
    try {
        const result = String(context.runtime.run(source)).replace(/\s/gu, '');
        return result.length <= 2048 && !/Stop:|Error|NaN|undefined|Infinity/u.test(result) ? result : null;
    } catch { return null; }
}
function equal(a: string, b: string, context: FunctionContext): Proof {
    if (a === b) return true;
    const difference = cas('simplify((' + a + ')-(' + b + '))', context);
    if (difference === '0') return true;
    const algebraic = proveAlgebraicConstantIdentity(a, b, context.runtime);
    return algebraic === null ? compareFunctionConstants(a, b, context) : algebraic;
}
function finiteEqual(a: readonly string[], b: readonly string[], context: FunctionContext): Proof {
    let unproved = false;
    for (const [left, right] of [[a, b], [b, a]]) for (const value of left) {
        const matches = right.map(other => equal(value, other, context));
        if (!matches.includes(true)) {
            if (matches.includes(null)) unproved = true; else return false;
        }
    }
    return unproved ? null : true;
}
function same(a: RealSolutionSet, b: RealSolutionSet, context: FunctionContext): Proof {
    if (a.kind === 'finite' && b.kind === 'finite') return finiteEqual(a.values, b.values, context);
    return compareTrigSolutionSets(a, b, context);
}
function subsetOf(target: RealSolutionSet, baseline: RealSolutionSet, context: FunctionContext): Proof {
    if (target.kind === 'finite') {
        const membership = target.values.map(value => baseline.kind === 'finite'
            ? baseline.values.map(other => equal(value, other, context))
            : [trigSolutionContains(baseline, value, context)]);
        return membership.every(results => results.includes(true)) ? true
            : membership.some(results => !results.includes(true) && !results.includes(null)) ? false : null;
    }
    const union = merge([baseline, target], context);
    return union ? same(baseline, union, context) : null;
}
function merge(sets: RealSolutionSet[], context: FunctionContext): RealSolutionSet | null {
    if (sets.some(set => set.kind === 'all')) return { kind: 'all' };
    if (sets.every(set => set.kind === 'finite')) {
        const values: string[] = [];
        for (const set of sets) if (set.kind === 'finite') for (const value of set.values) {
            if (!values.some(previous => equal(value, previous, context) === true)) values.push(value);
        }
        return values.length <= 64 ? { kind: 'finite', values } : null;
    }
    if (sets.every(set => set.kind === 'periodic' || set.kind === 'finite' && set.values.length === 0)) {
        return { kind: 'periodic', families: sets.reduce<Array<{ offset: string; period: string }>>((all, set) => all.concat(set.kind === 'periodic' ? set.families : []), []) };
    }
    return null;
}
function splitTop(source: string, separators = ';,'): string[] {
    const parts: string[] = [];
    let depth = 0, begin = 0;
    for (let i = 0; i < source.length; i++) {
        if ('({['.includes(source[i])) depth++;
        else if (')}]'.includes(source[i])) depth--;
        if (depth < 0) return [];
        if (!depth && separators.includes(source[i])) { parts.push(source.slice(begin, i).trim()); begin = i + 1; }
    }
    if (depth) return [];
    parts.push(source.slice(begin).trim());
    return parts.filter(Boolean);
}
function clean(source: string): string {
    return source.trim().replace(/^\$|\$$/gu, '')
        .replace(/^(?:\\(?:Rightarrow|Longrightarrow|Leftrightarrow|implies|to)|[⇒⇔→]|=>|->)\s*/u, '')
        .replace(/\\(?:left|right)(?![A-Za-z])/gu, '')
        .replace(/\\(?:quad|qquad|,|;|!)(?![A-Za-z])/gu, ' ').trim();
}
function constant(tex: string, context: FunctionContext): string | null {
    const value = normalizeFunctionExpression(tex);
    return value && !/[A-Za-z]/u.test(value.replace(/\b(?:sqrt|log|exp|sin|cos|tan|abs|pi|e)\b/gu, '')) &&
        compareFunctionConstants(value, value, context) === true ? value : null;
}
function finiteTarget(tex: string, variable: string, context: FunctionContext): RealSolutionSet | null {
    const trig = parseTrigSolutionTarget(tex, variable, context);
    if (trig) return trig;
    const source = clean(tex);
    const set = /^(?:L|\\mathcal\s*\{L\})(?:_\{\\mathbb\{R\}\})?\s*=\s*(.+)$/u.exec(source);
    if (set) {
        if (/^\\(?:emptyset|varnothing)$/u.test(set[1])) return { kind: 'finite', values: [] };
        if (/^\\mathbb\{R\}$/u.test(set[1])) return { kind: 'all' };
        const braces = /^\{(.*)\}$/u.exec(set[1].replace(/\\([{}])/gu, '$1'));
        if (!braces) return null;
        const entries = splitTop(braces[1]);
        if (!entries.length && braces[1].trim()) return null;
        const values = entries.map(entry => constant(entry, context));
        return values.length <= 64 && values.every(value => value !== null)
            ? { kind: 'finite', values: values as string[] } : null;
    }
    const parts = source.split(/\\(?:lor|vee)\b|\boder\b|,(?=\s*[A-Za-z](?:_|=))/u);
    if (parts.length > 64) return null;
    const values: string[] = [];
    for (const part of parts) {
        const match = /^([A-Za-z])(?:_\{?[1-9](?:,[1-9])*\}?)?\s*=\s*(.+)$/u.exec(part.trim());
        if (!match || match[1] !== variable) return null;
        const rhs = match[2];
        const pm = (rhs.match(/\\pm|±/gu) || []).length;
        if (pm > 1) return null;
        for (const branch of pm ? [rhs.replace(/\\pm|±/u, '+'), rhs.replace(/\\pm|±/u, '-')] : [rhs]) {
            const value = constant(branch, context);
            if (!value) return null;
            values.push(value);
        }
    }
    return values.length ? { kind: 'finite', values } : null;
}
function polynomial(tex: string, context: FunctionContext): FunctionEquationModel | null {
    const sides = tex.split('=');
    if (sides.length !== 2) return null;
    const left = normalizeFunctionExpression(sides[0]), right = normalizeFunctionExpression(sides[1]);
    if (!left || !right) return null;
    const expression = { left: { cas: left, domainRisk: false }, right: { cas: right, domainRisk: false } };
    const model = analyzeNumericPolynomial(expression, context.runtime, 2);
    if (!model || !model.variable) return null;
    const [c, b = '0', a = '0'] = model.coefficients;
    let values: string[] = [];
    if (model.degree === 1) {
        const value = cas('simplify(-(' + c + ')/(' + b + '))', context);
        if (!value) return null;
        values = [value];
    } else if (model.degree === 2) {
        const disc = cas('simplify((' + b + ')^2-4*(' + a + ')*(' + c + '))', context);
        if (!disc) return null;
        const sign = algebraicConstantSign(disc, context.runtime);
        if (sign === null) return null;
        if (sign >= 0) for (const op of sign === 0 ? ['+'] : ['+', '-']) {
            const value = cas('simplify(((-(' + b + '))' + op + 'sqrt(' + disc + '))/(2*(' + a + ')))', context);
            if (!value) return null;
            values.push(value);
        }
    } else return null;
    return { variable: model.variable, solutions: { kind: 'finite', values }, domain: () => true, expectedLines: [tex] };
}
function analyze(tex: string, context: FunctionContext): FunctionEquationModel | null {
    const model = analyzeTrigEquation(tex, context) || analyzeExponentialLogEquation(tex, context) || analyzeFunctionPolynomialEquation(tex, context) || polynomial(tex, context);
    if (!model || !context.interval) return model;
    const solutions = restrictTrigSolutionSet(model.solutions, context);
    if (!solutions) return null;
    return { ...model, solutions };
}
function originalDomain(model: FunctionEquationModel, set: RealSolutionSet): RealSolutionSet | null {
    if (set.kind !== 'finite') return set;
    const values: string[] = [];
    for (const value of set.values) {
        const valid = model.domain(value);
        if (valid === null) return null;
        if (valid) values.push(value);
    }
    return { kind: 'finite', values };
}

function substitutionDefined(value: string, original: FunctionEquationModel, context: FunctionContext): boolean {
    if (isPositiveExponential(value, original.variable, context)) return true;
    const trig = normalizeTrigExpression(value, context);
    const trigModel = trig ? analyzeTrigEquation(value + '=0', context) : null;
    if (trig && /^(?:sin|cos)\(/u.test(trig) && trigModel) {
        let depth = 0, whole = true;
        for (let i = trig.indexOf('('); i < trig.length; i++) {
            if (trig[i] === '(') depth++;
            if (trig[i] === ')' && --depth === 0 && i < trig.length - 1) { whole = false; break; }
        }
        if (whole) return true;
    }
    return original.solutions.kind === 'finite' && original.solutions.values.length > 0 &&
        original.solutions.values.every(point => functionExpressionDefinedAt(value, original.variable, point, context) === true ||
            !!trigModel && trigModel.domain(point) === true);
}

function contextFor(options: TransitionValidationOptions): FunctionContext | null {
    const runtime = options.runtime === undefined ? proof.resolveAlgebriteRuntime() : options.runtime;
    const memo = new Map<string, unknown>();
    const cached = runtime && { run(source: string): unknown {
        if (memo.has(source)) return memo.get(source);
        const result = runtime.run(source);
        if (memo.size < 512 && source.length <= 8192) memo.set(source, result);
        return result;
    } };
    return cached ? { runtime: cached, angleUnit: options.calculationContext?.angleUnit || 'rad', interval: options.calculationContext?.interval } : null;
}
function check(index: number, lines: string[], status: TransitionCheck['status'], reason: TransitionReason,
    from = index - 1, role: TransitionCheck['role'] = 'equivalence'): TransitionCheck {
    return { from: lines[Math.max(0, from)] || '', to: lines[index], fromIndex: Math.max(0, from), toIndex: index,
        status, reason, messageKey: 'ocr.plus.validation.' + reason, role };
}
function stripLabel(source: string): { text: string; label: string } {
    const tex = /^\\text\s*\{([^}]+)\}\s*:?\s*/u.exec(source);
    const plain = /^(Nebenrechnung|Hilfsrechnung|Hauptrechnung|Substitution|Rücksubstitution|Ruecksubstitution|Probe|Fall\s*[1-9]|Zweig\s*[1-9])\s*:\s*/iu.exec(source);
    const match = tex || plain;
    if (!match) return { text: source, label: '' };
    const label = match[1].trim().replace(/:$/u, '').toLowerCase();
    if (!/^(nebenrechnung|hilfsrechnung|hauptrechnung|hauptgleichung|substitution|rücksubstitution|ruecksubstitution|probe|pq-formel|faktorisierung|quadratische ergänzung|fall\s*[1-9]|zweig\s*[1-9])$/u.test(label)) return { text: source, label: '' };
    return { text: source.slice(match[0].length).trim(), label };
}

interface AuxiliaryWork {
    variable: string;
    prompt: string;
    lines: string[];
    numeric: Map<string, string>;
    index: number;
}
function expandAuxiliaryConstants(source: string, work: AuxiliaryWork): string {
    let expanded = source;
    for (const [name, value] of work.numeric) {
        const pattern = name === '\\Delta' ? /\\Delta(?![A-Za-z])/gu
            : new RegExp('(^|[^A-Za-z0-9_\\\\])(' + name + ')(?![A-Za-z0-9_])', 'gu');
        expanded = name === '\\Delta' ? expanded.replace(pattern, () => '(' + value + ')')
            : expanded.replace(pattern, (_, prefix: string) => prefix + '(' + value + ')');
    }
    return expanded;
}
function checkAuxiliaryWork(source: string, work: AuxiliaryWork, context: FunctionContext): TransitionCheck | null {
    // Reuse the polynomial method validator without entering the public function dispatcher.
    const history = [...work.lines, source];
    const grade = new CalculationPathValidation(history, work.prompt, { runtime: context.runtime, strictDeclaredOperations: true }).finish();
    const latest = grade.transitionChecks[grade.transitionChecks.length - 1] || null;
    work.lines.push(source);
    if (latest?.status === 'valid') {
        const definition = /^(p|q|D|\\Delta)\s*=\s*([^]*?)(?:=|$)/u.exec(source);
        if (definition && definition[1] !== work.variable) {
            const value = constant(expandAuxiliaryConstants(definition[2].replace(/<\s*0\s*$/u, ''), work), context);
            const canonical = value && cas('simplify(' + value + ')', context);
            if (canonical) work.numeric.set(definition[1], canonical);
        }
    }
    return latest;
}
function auxiliaryEquationVariable(source: string, definitions: Map<string, string>, context: FunctionContext): string | null {
    const sides = source.split('=');
    if (sides.length !== 2) return null;
    const left = normalizeFunctionExpression(sides[0]), right = normalizeFunctionExpression(sides[1]);
    if (!left || !right) return null;
    const model = analyzeNumericPolynomial({ left: { cas: left, domainRisk: false }, right: { cas: right, domainRisk: false } }, context.runtime, 2);
    return model?.variable && model.degree >= 1 && definitions.has(model.variable) ? model.variable : null;
}
function probeConstant(source: string, context: FunctionContext): string | null {
    const ordinary = constant(source, context);
    if (ordinary) return ordinary;
    // Sine and cosine have no real poles; scalar denominators/powers stay guarded.
    const trig = normalizeTrigExpression(source, context);
    if (!trig || /\btan\(/u.test(trig) || /[A-Za-z]/u.test(trig.replace(/\b(?:sin|cos|sqrt|pi)\b/gu, ''))) return null;
    const value = cas('simplify(' + trig + ')', context);
    return value && compareFunctionConstants(value, value, context) === true ? trig : null;
}
function verifyFunctionProbe(source: string, prompt: string, points: string[], original: FunctionEquationModel, context: FunctionContext): Proof {
    if (!points.length || points.length > 64) return null;
    const displayed = source.split('=').map(part => probeConstant(part, context));
    const originalParts = prompt.split('=').map(part => normalizeFunctionExpression(part) || normalizeTrigExpression(part, context));
    if (displayed.length < 2 || displayed.length > 4 || displayed.some(part => !part) || originalParts.length !== 2 || originalParts.some(part => !part)) return null;
    const truthful = displayed.slice(1).map((part, index) => equal(displayed[index]!, part!, context));
    if (truthful.includes(false)) return false;
    if (truthful.includes(null)) return null;
    let unproved = false;
    for (const point of points) {
        if (original.domain(point) !== true) continue;
        const sides = originalParts.map(part => cas('subst((' + point + '),' + original.variable + ',(' + part + '))', context));
        if (sides.some(part => part === null)) { unproved = true; continue; }
        const direct = [equal(sides[0]!, displayed[0]!, context), equal(sides[1]!, displayed[1]!, context)];
        const reversed = [equal(sides[0]!, displayed[1]!, context), equal(sides[1]!, displayed[0]!, context)];
        if (direct.every(value => value === true) || reversed.every(value => value === true)) return true;
        unproved ||= [...direct, ...reversed].includes(null);
    }
    return unproved ? null : false;
}

/** This session compares proven solution sets while retaining the authored domain.
 * It never infers an unrestricted function solver from numeric samples. */
export function* iterateFunctionCalculation(
    promptTex: string, answer: string | readonly string[], options: TransitionValidationOptions = {}
): Generator<TransitionCheck, CalculationQuizGrade | null> {
    const prompt = prepareCalculationTask(promptTex, options.calculationContext);
    if (prompt !== null && !usesFunctionCalculation(prompt, options)) return null;
    const decoded = proof.decodeCalculationSubmission(answer);
    const lines = decoded ? [...decoded] : [];
    const context = contextFor(options);
    const bounded = lines.length >= 2 && lines.length <= 32 && lines.join('\n').length <= 16384 &&
        lines.every(line => line.length <= 2048) && prompt !== null && prompt.length <= 2048;
    const original = context && bounded && prompt ? analyze(prompt, context) : null;
    const checks: TransitionCheck[] = [];
    let promptStatus: 'valid' | 'invalid' | 'unknown' = 'unknown', solved = false;
    let current = original, currentIndex = 0;
    let currentText = prompt || '';
    let declared = '';
    let candidates: RealSolutionSet[] = [];
    let branches: Array<{ model: FunctionEquationModel; index: number; text: string }> = [];
    const definitions = new Map<string, string>();
    const auxiliaryWorks = new Map<string, AuxiliaryWork>();
    let activeAuxiliary = '';
    const indexed = new Map<string, string>();
    let pendingLabel = '';
    let initialSeen = false;
    let firstLineFailure: 'invalid' | 'unknown' | null = null;
    const expand = (text: string): string => {
        let result = text;
        for (const [name, value] of definitions) result = result.replace(/(^|[^A-Za-z\\])([A-Za-z])(?:_\{?[1-9]\}?)?(?![A-Za-z])/gu, (match, prefix: string, symbol: string) => symbol === name ? prefix + '(' + value + ')' : match);
        return result;
    };
    for (let index = 0; index < lines.length; index++) {
        const tagged = stripLabel(clean(lines[index]));
        if (!tagged.label && pendingLabel) tagged.label = pendingLabel;
        let source = tagged.text;
        pendingLabel = source ? '' : tagged.label;
        const line = proof.splitLine(source);
        source = clean(line.equation);
        let status: TransitionCheck['status'] = 'unknown';
        let reason: TransitionReason = context ? 'unsupported-or-unproven' : 'cas-unavailable';
        let role: TransitionCheck['role'] = 'equivalence';
        let from = currentIndex;
        const auxiliary = auxiliaryWorks.get(activeAuxiliary);
        const auxiliaryTarget = auxiliary && context && new RegExp('^' + auxiliary.variable + '(?:_|\\s*=)', 'u').test(source)
            ? finiteTarget(expandAuxiliaryConstants(source, auxiliary), auxiliary.variable, { runtime: context.runtime, angleUnit: context.angleUnit }) : null;
        const coefficient = /^(p|q|D|\\Delta)\s*=/u.exec(source);
        const auxiliaryCoefficient = !!auxiliary && !!coefficient && coefficient[1] !== auxiliary.variable && coefficient[1] !== original?.variable;
        if (original && current && context && bounded) {
            if (!source && tagged.label) {
                status = 'valid'; reason = 'calculation-annotation'; role = 'annotation';
            } else if (tagged.label === 'probe') {
                const points = candidates.reduce<string[]>((all, set) => all.concat(set.kind === 'finite' ? set.values : []), []);
                const verified = !declared && !line.operation ? verifyFunctionProbe(source, prompt!, points, original, context) : null;
                status = verified === true ? 'valid' : verified === false ? 'invalid' : 'unknown';
                reason = verified === true ? 'verification-step' : verified === false ? 'incorrect-verification' : 'unsupported-or-unproven';
                role = 'verification'; from = 0;
            } else if (auxiliary && (auxiliaryTarget || auxiliaryCoefficient)) {
                role = auxiliaryTarget ? 'branch' : 'auxiliary'; from = auxiliary.index;
                if (!declared && !line.operation) {
                    const result = checkAuxiliaryWork(source, auxiliary, context);
                    if (result) { status = result.status; reason = result.reason; }
                    if (status === 'valid' && auxiliaryTarget?.kind === 'finite') {
                        const expression = definitions.get(auxiliary.variable)!;
                        const mapped = auxiliaryTarget.values.map(value => ({ text: '(' + expression + ')=(' + value + ')', model: analyze('(' + expression + ')=(' + value + ')', context) }));
                        if (mapped.some(branch => !branch.model)) { status = 'unknown'; reason = 'unsupported-or-unproven'; }
                        else {
                            for (const branch of mapped) branches.push({ model: branch.model!, text: branch.text, index });
                            if (mapped.length === 1) {
                                current = mapped[0].model!; currentText = mapped[0].text; currentIndex = index;
                                solved = false;
                            }
                        }
                    }
                }
            } else if (/^(?:k|n)\s*(?:\\in|∈)\s*\\mathbb\{Z\}$/u.test(source)) {
                // Integer declarations belong on the same periodic answer row.
                status = 'unknown'; reason = 'unsupported-or-unproven';
            } else if (proveExponentialLogDomainAssertion(source, prompt!, context) === true ||
                Array.from(definitions.entries()).some(([name, value]) =>
                    new RegExp('^' + name + '\\s*>\\s*0$','u').test(source) && isPositiveExponential(value, original.variable, context))) {
                status = 'valid'; reason = 'domain-condition'; role = 'annotation';
            } else {
                const definition = /^([A-Za-z])\s*=\s*(.+?)(?:\s*>\s*0)?$/u.exec(source);
                if (definition && definition[1] !== original.variable && !['e','i'].includes(definition[1]) && tagged.label === 'substitution') {
                    const value = normalizeFunctionExpression(definition[2]) || normalizeTrigExpression(definition[2], context);
                    const symbols = value?.replace(/\b(?:sin|cos|tan|exp|log|sqrt|abs|pi|e)\b/gu, '').match(/[A-Za-z]+/gu) || [];
                    if (value && symbols.every(symbol => symbol === original.variable) && symbols.length &&
                        substitutionDefined(definition[2], original, context) &&
                        (!/>\s*0\s*$/u.test(source) || isPositiveExponential(value, original.variable, context))) {
                        const previous = definitions.get(definition[1]);
                        const previousValue = previous && (normalizeFunctionExpression(previous) || normalizeTrigExpression(previous, context));
                        if (!previous || previousValue && equal(previousValue, value, context) === true) {
                            // Keep authored angle notation; CAS-normalized trig arguments already
                            // contain the degree conversion and must never be parsed as degrees again.
                            definitions.set(definition[1], definition[2]);
                            status = 'valid'; reason = 'definition-step'; role = 'definition';
                        } else { status = 'invalid'; reason = 'incorrect-auxiliary-calculation'; }
                    }
                } else {
                    const target = finiteTarget(source, original.variable, context);
                    if (index > 0 && target && !line.operation && !declared) {
                        const explicit = /^(?:L|\\mathcal)/u.test(source);
                        const domain = target.kind === 'finite' ? target.values.map(value => original.domain(value)) : [];
                        const targetComparison = same(original.solutions, target, context);
                        const localSet = explicit ? original.solutions : originalDomain(original, current.solutions);
                        const subset = localSet ? subsetOf(target, localSet, context) : null;
                        const originalSubset = subsetOf(target, original.solutions, context);
                        const localComplete = localSet ? same(localSet, target, context) : null;
                        if (domain.includes(false)) { status = 'invalid'; reason = 'domain-violation'; }
                        else if (explicit && targetComparison !== true) {
                            status = targetComparison === false ? 'invalid' : 'unknown';
                            reason = subset === true ? 'incomplete-real-solutions' : 'incorrect-real-solutions';
                            solved = false;
                        } else if (subset === true || explicit && targetComparison === true) {
                            let conflict = false;
                            if (target.kind === 'finite') {
                                const labels: string[] = [];
                                const pattern = /([A-Za-z])_(?:\{([1-9](?:,[1-9])*)\}|([1-9]))\s*=/gu;
                                let match: RegExpExecArray | null;
                                while ((match = pattern.exec(source))) for (const num of (match[2] || match[3]).split(',')) labels.push(match[1] + '_' + num);
                                if (labels.length === target.values.length) labels.forEach((label, part) => {
                                    if (indexed.has(label) && equal(indexed.get(label)!, target.values[part], context) !== true) conflict = true;
                                    indexed.set(label, target.values[part]);
                                });
                            }
                            if (conflict) { status = 'invalid'; reason = 'conflicting-solution-label'; }
                            else {
                                if (originalSubset === true) candidates.push(target);
                                const accumulated = merge(candidates, context);
                                solved = originalSubset === true && (explicit ? targetComparison === true : !!accumulated && same(original.solutions, accumulated, context) === true);
                                status = 'valid'; reason = (explicit ? solved : localComplete === true) ? 'complete-real-solutions' : 'solution-candidate'; role = 'branch';
                            }
                        } else if (subset === false) { status = 'invalid'; reason = 'incorrect-real-solutions'; }
                    } else {
                        const expanded = expand(source);
                        const disjunction = expanded.split(/\s*(?:\\lor|\\vee|\boder\b)\s*/u);
                        if (index > 0 && disjunction.length > 1 && !declared && !line.operation) {
                            const models = disjunction.map(part => analyze(part, context));
                            const sets = models.map(model => model && originalDomain(original, model.solutions));
                            if (models.every(Boolean) && sets.every(Boolean)) {
                                const union = merge(sets as RealSolutionSet[], context);
                                const expected = originalDomain(original, current.solutions);
                                const valid = union && expected ? same(expected, union, context) : null;
                                if (valid === true) {
                                    branches = models.map((model, part) => ({ model: model!, index, text: disjunction[part] }));
                                    status = 'valid'; reason = 'substitution-step'; role = 'branch';
                                } else if (valid === false) { status = 'invalid'; reason = 'different-polynomial-solutions'; }
                            }
                        } else {
                            const model = analyze(expanded, context);
                            if (model && model.variable === original.variable) {
                                const nextSet = originalDomain(original, model.solutions);
                                const previousSet = originalDomain(original, current.solutions);
                                let matches = nextSet && previousSet ? same(previousSet, nextSet, context) : null;
                                if (!initialSeen) {
                                    initialSeen = true;
                                    // Retain the original task, while accepting equivalent typesetting.
                                    const identicalSides = normalizedEquationEqual(expanded, prompt!, context);
                                    matches = matches === false || identicalSides === false ? false : matches === true && identicalSides === true ? true : null;
                                    promptStatus = matches === true ? 'valid' : matches === false ? 'invalid' : 'unknown';
                                } else if (declared) {
                                    const literal = declaredOperation(currentText, expanded, declared, context);
                                    matches = matches === false || literal === false ? false : matches === true && literal === true ? true : null;
                                    reason = matches === false ? 'operation-mismatch-both' : 'operation-applied-both-sides';
                                } else if (matches !== true && branches.length) {
                                    const branch = branches.find(entry => {
                                        const set = originalDomain(original, entry.model.solutions);
                                        return !!set && !!nextSet && same(set, nextSet, context) === true;
                                    });
                                    if (branch) { matches = true; from = branch.index; role = 'branch'; }
                                }
                                if (matches === true) {
                                    status = 'valid';
                                    if (!declared) reason = index === 0 ? 'given-equation' : 'equivalent-function-equations';
                                } else if (matches === false) {
                                    status = 'invalid';
                                    if (!declared) reason = 'different-polynomial-solutions';
                                }
                                if (status === 'valid') {
                                    const helper = auxiliaryEquationVariable(source, definitions, context);
                                    if (helper) {
                                        const raw = source + (line.operation ? ' \\mid ' + line.operation : '');
                                        const existing = auxiliaryWorks.get(helper);
                                        if (existing) existing.lines.push(raw);
                                        else auxiliaryWorks.set(helper, { variable: helper, prompt: source, lines: [raw], numeric: new Map(), index });
                                        activeAuxiliary = helper;
                                    }
                                }
                                current = model; currentIndex = index; currentText = expanded; declared = line.operation || '';
                                solved = false;
                            } else if (tagged.label === 'nebenrechnung' || tagged.label === 'hilfsrechnung') {
                                const parts = expanded.split('=').map(part => constant(part, context));
                                if (parts.length >= 2 && parts.every(Boolean)) {
                                    const results = parts.slice(1).map((part, j) => equal(parts[j]!, part!, context));
                                    status = results.every(result => result === true) ? 'valid' : results.includes(false) ? 'invalid' : 'unknown';
                                    reason = status === 'valid' ? 'auxiliary-calculation' : 'incorrect-auxiliary-calculation'; role = 'auxiliary';
                                }
                            }
                        }
                    }
                }
            }
        }
        if (line.operation && ['definition','annotation','auxiliary','verification'].includes(role || '')) {
            status = 'unknown'; reason = 'unsupported-or-unproven'; solved = false;
        }
        if (index === 0) {
            if (status !== 'valid') { promptStatus = status; firstLineFailure = status; }
        } else {
            const result = check(index, lines, status, reason, from, role);
            checks.push(result);
            yield result;
        }
    }
    if (firstLineFailure) promptStatus = firstLineFailure;
    const invalid = checks.find(item => item.status === 'invalid'), unknown = checks.find(item => item.status === 'unknown');
    const final = solved && !declared && !pendingLabel;
    const firstProblem: CalculationQuizGrade['firstProblem'] = promptStatus !== 'valid'
        ? { stage: 'prompt', reason: context ? 'prompt-unproven' : 'cas-unavailable', lineIndex: 0 }
        : invalid || unknown ? { stage: 'transition', reason: (invalid || unknown)!.reason, lineIndex: (invalid || unknown)!.toIndex - 1 }
        : !final ? { stage: 'final', reason: 'not-isolated', lineIndex: lines.length - 1 } : undefined;
    const accepted = !firstProblem;
    return {
        accepted, outcome: accepted ? 'correct' : promptStatus === 'invalid' || invalid ? 'incorrect'
            : promptStatus === 'unknown' || unknown ? 'unknown' : 'incomplete',
        lines, promptCheck: { status: promptStatus, reason: promptStatus === 'valid' ? 'prompt-match' : promptStatus === 'invalid' ? 'prompt-mismatch' : 'prompt-unproven' },
        transitionChecks: checks,
        finalCheck: final ? { status: 'valid', reason: 'solved-root-set' } : { status: 'incomplete', reason: 'not-isolated' },
        ...(firstProblem ? { firstProblem } : {})
    };
}
function normalizedEquationEqual(a: string, b: string, context: FunctionContext): Proof {
    const first = a.split('='), second = b.split('=');
    if (first.length !== 2 || second.length !== 2) return null;
    const normalize = (value: string) => normalizeFunctionExpression(value) || normalizeTrigExpression(value, context);
    const f = first.map(normalize), s = second.map(normalize);
    if (f.some(value => !value) || s.some(value => !value)) return null;
    if (f[0] === s[0] && f[1] === s[1] || f[0] === s[1] && f[1] === s[0]) return true;
    const side = (a: string, b: string) => cas('simplify((' + a + ')-(' + b + '))', context) === '0';
    return side(f[0]!, s[0]!) && side(f[1]!, s[1]!) || side(f[0]!, s[1]!) && side(f[1]!, s[0]!) ? true : false;
}
function declaredOperation(from: string, to: string, raw: string, context: FunctionContext): Proof {
    const normalize = (value: string) => normalizeFunctionExpression(value) || normalizeTrigExpression(value, context);
    const sides = from.split('=').map(normalize);
    const target = to.split('=').map(normalize);
    if (sides.length !== 2 || target.length !== 2 || [...sides, ...target].some(value => !value)) return null;
    const operations = raw.split(/\\mid|\||;/u).map(value => value.trim()).filter(Boolean);
    if (!operations.length || operations.length > 8) return null;
    let left = sides[0]!, right = sides[1]!;
    for (const rawOperation of operations) {
        const op = /^(\\cdot|\\times|[+\-*/:]|\\div)\s*(.+)$/u.exec(rawOperation);
        if (!op) return null;
        const value = constant(op[2], context);
        if (!value) return null;
        const kind = op[1] === ':' || op[1] === '\\div' ? '/' : op[1] === '\\cdot' || op[1] === '\\times' ? '*' : op[1];
        if ((kind === '*' || kind === '/') && equal(value, '0', context) !== false) return null;
        left = '(' + left + ')' + kind + '(' + value + ')';
        right = '(' + right + ')' + kind + '(' + value + ')';
    }
    const l = cas('simplify((' + left + ')-(' + target[0] + '))', context);
    const r = cas('simplify((' + right + ')-(' + target[1] + '))', context);
    return l === '0' && r === '0' ? true : l !== null && r !== null ? false : null;
}
export function generateContextualExpectedCalculation(promptTex: string, options: TransitionValidationOptions = {}): string[] | null {
    if (usesCurveCalculation(options)) return generateCurveExpectedCalculation(promptTex, options);
    if (options.runtime === null) return null;
    const prompt = prepareCalculationTask(promptTex, options.calculationContext);
    if (!prompt) return null;
    if (!usesFunctionCalculation(prompt, options)) return generateExpectedCalculation(prompt);
    const context = contextFor(options);
    if (!context) return null;
    const model = analyze(prompt, context);
    if (!model) return null;
    const lines = model.expectedLines;
    const checked = validateFunctionCalculation(promptTex, lines, options);
    if (checked?.accepted) return lines;
    // Exact finite sets still provide a complete supported resolution.
    if (model.solutions.kind === 'finite') {
        const target = model.solutions.values.length ? '\\mathcal{L}=\\{' + model.solutions.values.map(functionConstantToTex).join(';') + '\\}' : '\\mathcal{L}=\\varnothing';
        const minimal = [prompt, target];
        return validateFunctionCalculation(promptTex, minimal, options)?.accepted ? minimal : null;
    }
    return null;
}


export function validateFunctionCalculation(prompt: string, answer: string | readonly string[], options: TransitionValidationOptions = {}): CalculationQuizGrade | null {
    const iterator = iterateFunctionCalculation(prompt, answer, options);
    let result = iterator.next();
    while (!result.done) result = iterator.next();
    return result.value;
}
