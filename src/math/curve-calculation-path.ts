import { calculationProofTools as proof, type CalculationQuizGrade, type TransitionCheck, type TransitionReason, type TransitionValidationOptions } from './equivalence.ts';
import { calculationContextError, CALCULATION_TASK_NAMES, DEFAULT_CURVE_TASK_PARTS, parseCalculationTask, type CalculationTask, type CalculationContext } from './calculation-context.ts';
import { CALCULATION_METHOD_REASONS } from './calculation-methods.ts';
import { buildCalculusTask } from './curve-calculus.ts';
import { buildCurvePropertyTask } from './curve-properties.ts';
import { createCurveEnvironment, curveClean, curveEqual, curvePolynomial, curveRealRoots, curveConstant, curveSign, curveTex, type CurveEnvironment, type CurveTaskModel, type CurveLineResult } from './curve-task-core.ts';

export function usesCurveCalculation(options: TransitionValidationOptions = {}): boolean {
    const task = options.calculationContext?.task;
    return task !== undefined && task !== 'equation' && task !== 'zeros';
}

function zeroTask(env: CurveEnvironment): CurveTaskModel | null {
    const polynomial = curvePolynomial(env, env.expression);
    if (!polynomial) return null;
    let roots = curveRealRoots(env, env.expression);
    const all = polynomial.degree === 0 && polynomial.coefficients[0] === '0';
    if (!roots && !all) return null;
    const interval = env.context.interval;
    let lower: string | null = null, upper: string | null = null;
    if (interval) {
        lower = curveConstant(env, interval.lower); upper = curveConstant(env, interval.upper);
        if (lower === null || upper === null || curveSign(env, '(' + upper + ')-(' + lower + ')') !== 1) return null;
        const filtered: string[] = [];
        for (const root of roots || []) {
            const l = curveSign(env, '(' + root + ')-(' + lower + ')'), r = curveSign(env, '(' + upper + ')-(' + root + ')');
            if (l === null || r === null) return null;
            if ((l > 0 || l === 0 && interval.lowerClosed) && (r > 0 || r === 0 && interval.upperClosed)) filtered.push(root);
        }
        if (roots) roots = filtered;
    }
    const fullInterval = interval ? (interval.lowerClosed ? '[' : '(') + curveTex(lower!) + ',' + curveTex(upper!) + (interval.upperClosed ? ']' : ')') : '\\mathbb{R}';
    const target = all ? 'L=' + fullInterval : roots!.length ? 'L=\\{' + roots!.map(curveTex).join(';') + '\\}' : 'L=\\varnothing';
    const observed: string[] = [];
    const indexed = new Map<string, string>();
    const member = (a: string, values: string[]) => values.some(b => curveEqual(env, a, b) === true);
    return {
        expectedLines: [target], required: ['zeros'],
        checkLine(source) {
            const clean = curveClean(source);
            const set = /^(?:L|N|\\mathcal\s*\{L\})\s*=\s*(.+)$/u.exec(clean);
            const one = new RegExp('^' + env.variable + '(?:_\\{?\\d+\\}?)?\\s*=\\s*(.+)$', 'u').exec(clean);
            if (!set && !one) return null;
            if (all) {
                if (!set) return null;
                const rhs = set[1].replace(/\s/gu, '');
                let valid = !interval && ['\\mathbb{R}', 'R'].includes(rhs);
                if (interval) {
                    const bounds = /^([\[(])(.+),(.+)([\])])$/u.exec(rhs);
                    valid = !!bounds && (bounds[1] === '[') === interval.lowerClosed && (bounds[4] === ']') === interval.upperClosed &&
                        curveEqual(env, bounds[2], lower!) === true && curveEqual(env, bounds[3], upper!) === true;
                }
                return { proof: valid, targets: valid ? ['zeros'] : [] };
            }
            let values: string[];
            if (set) {
                const body = set[1].replace(/\\\{/gu, '{').replace(/\\\}/gu, '}').trim();
                if (['\\varnothing', '\\emptyset', '{}'].includes(body)) values = [];
                else if (body.startsWith('{') && body.endsWith('}')) values = body.slice(1, -1).split(';');
                else return null;
            } else values = [one![1]];
            const constants = values.map(value => curveConstant(env, value));
            if (constants.some(value => value === null)) return { proof: null };
            if (constants.some(value => !member(value!, roots!))) return { proof: false };
            if (set) {
                const complete = roots!.every(root => member(root, constants as string[]));
                return { proof: complete, targets: complete ? ['zeros'] : [] };
            }
            const label = new RegExp('^' + env.variable + '_\\{?(\\d+)\\}?\\s*=', 'u').exec(clean)?.[1];
            if (label) {
                const previous = indexed.get(label);
                if (previous !== undefined && curveEqual(env, previous, constants[0]!) !== true) return { proof: false };
                indexed.set(label, constants[0]!);
            }
            observed.push(...constants as string[]);
            return { proof: true, targets: roots!.every(root => member(root, observed)) ? ['zeros'] : [] };
        }
    };
}

function singleTask(env: CurveEnvironment): CurveTaskModel | null {
    if (env.context.task === 'zeros') return zeroTask(env);
    return buildCalculusTask(env) || buildCurvePropertyTask(env);
}
function partContext(context: CalculationContext, task: CalculationTask): CalculationContext {
    const result = { ...context, task };
    delete result.parts;
    if (task !== 'extrema' && task !== 'extrema-points') delete result.scope;
    return result;
}
export function buildCurveTask(env: CurveEnvironment): CurveTaskModel | null {
    if (env.context.task !== 'curve') return singleTask(env);
    const tasks = env.context.parts || DEFAULT_CURVE_TASK_PARTS;
    const models = tasks.map(task => ({ task, model: singleTask({ ...env, context: partContext(env.context, task) }) }));
    if (models.some(part => !part.model)) return null;
    let active: CalculationTask | null = null;
    const prefix = (task: CalculationTask, result: CurveLineResult): CurveLineResult => ({
        ...result, targets: result.targets?.map(target => task + ':' + target)
    });
    return {
        required: models.flatMap(({ task, model }) => model!.required.map(target => task + ':' + target)),
        expectedLines: models.flatMap(({ task, model }) => ['\\text{' + CALCULATION_TASK_NAMES[task] + ':}', ...model!.expectedLines]),
        checkLine(source) {
            const heading = /^([A-Za-zÄÖÜäöüß-]+)\s*:$/u.exec(curveClean(source));
            if (heading) {
                const task = parseCalculationTask(heading[1]);
                if (!task || !tasks.includes(task)) return { proof: false };
                active = task;
                return { proof: true, reason: 'calculation-annotation' };
            }
            if (active) {
                const result = models.find(part => part.task === active)!.model!.checkLine(source);
                return result && prefix(active, result);
            }
            // Labels are optional where an assertion has only one unambiguous task meaning.
            const results = models.map(({ task }) => ({ task, result: singleTask({ ...env, context: partContext(env.context, task) })?.checkLine(source) })).filter(part => part.result);
            const valid = results.filter(part => part.result!.proof === true);
            if (valid.length === 1) {
                const selected = models.find(part => part.task === valid[0].task)!;
                const committed = selected.model!.checkLine(source);
                return committed && prefix(selected.task, committed);
            }
            if (valid.length > 1 && valid.every(part => !part.result!.targets?.length)) return { proof: true };
            return valid.length ? { proof: null } : results.length === 1 ? prefix(results[0].task, results[0].result!) : null;
        }
    };
}

function promptMatches(env: CurveEnvironment, source: string): boolean | null {
    if (curveClean(source) === curveClean(env.prompt)) return true;
    const candidate = createCurveEnvironment(source, env.context, env.runtime);
    if (!candidate || candidate.name !== env.name || candidate.variable !== env.variable) return false;
    if (candidate.expression === env.expression) return true;
    // Equivalent polynomial spellings preserve their domain; rational cancellation needs its own evidence.
    if (!curvePolynomial(env, env.expression) || !curvePolynomial(env, candidate.expression)) return null;
    return curveEqual(env, env.expression, candidate.expression);
}
function knownReason(result: CurveLineResult | null): TransitionReason {
    if (result?.reason && CALCULATION_METHOD_REASONS.includes(result.reason as any)) return result.reason as TransitionReason;
    return result?.proof === true ? 'curve-correct' : result?.proof === false ? 'curve-incorrect' : 'curve-unsupported';
}

export function* iterateCurveCalculation(
    prompt: string, answer: string | readonly string[], options: TransitionValidationOptions = {}
): Generator<TransitionCheck, CalculationQuizGrade | null> {
    if (!usesCurveCalculation(options)) return null;
    const configurationError = calculationContextError(options.calculationContext) || undefined;
    const decoded = proof.decodeCalculationSubmission(answer);
    const lines = decoded || [];
    const optionalPrompt = options.calculationContext?.task === 'derivative';
    const bounded = decoded !== null && lines.length >= (optionalPrompt ? 1 : 2) && lines.length <= 32 && lines.every(line => line.length <= 2048) && typeof prompt === 'string' && prompt.length <= 2048;
    const runtime = options.runtime === undefined ? proof.resolveAlgebriteRuntime() : options.runtime;
    let env: CurveEnvironment | null = null, model: CurveTaskModel | null = null;
    if (!configurationError && bounded && runtime) {
        try {
            env = createCurveEnvironment(prompt, options.calculationContext!, runtime);
            model = env && buildCurveTask(env);
        } catch { model = null; }
    }
    const matched = env && bounded ? promptMatches(env, lines[0]) : null;
    // A derivative task already supplies its function. Learners may start with
    // the first derivative, but that first assertion still needs the same proof
    // as every following row; it must never be treated as an unchecked premise.
    const firstIsAnswer = optionalPrompt && !!model && matched !== true;
    let firstResult: CurveLineResult | null = null;
    if (firstIsAnswer && model) {
        try { firstResult = model.checkLine(lines[0]); } catch { firstResult = null; }
    }
    const anchorProof = firstIsAnswer ? firstResult?.proof ?? null : matched;
    const promptStatus = anchorProof === true ? 'valid' : anchorProof === false ? 'invalid' : 'unknown';
    const satisfied = new Set<string>(), checks: TransitionCheck[] = [];
    if (firstResult?.proof === true) firstResult.targets?.forEach(target => satisfied.add(target));
    for (let index = 1; index < lines.length && index < 32; index++) {
        let result: CurveLineResult | null = null;
        if (model) {
            try { result = model.checkLine(lines[index]); } catch { result = null; }
        }
        if (result?.proof === true) result.targets?.forEach(target => satisfied.add(target));
        // The UI and cr1 Freeze format have one check per visible row gap.
        // Keep the learner's rows and indices unchanged, and include a failed
        // first assertion in the first visible check instead of inserting a
        // synthetic function row. A proven error takes precedence over unknown.
        let reviewed = result;
        if (index === 1 && firstIsAnswer && firstResult?.proof !== true) {
            reviewed = firstResult?.proof === false || result?.proof !== false ? firstResult : result;
        }
        const reason: TransitionReason = configurationError ? 'curve-task-invalid' : !runtime ? 'cas-unavailable' : knownReason(reviewed);
        const check: TransitionCheck = {
            from: lines[0] || '', to: lines[index], fromIndex: 0, toIndex: index,
            status: reviewed?.proof === true ? 'valid' : reviewed?.proof === false ? 'invalid' : 'unknown',
            reason, messageKey: 'ocr.plus.validation.' + reason,
            role: reason === 'calculation-annotation' ? 'annotation' : 'task',
            dependencies: [0]
        };
        checks.push(check);
        yield check;
    }
    const complete = !!model && model.required.every(target => satisfied.has(target));
    const invalid = checks.find(check => check.status === 'invalid'), unknown = checks.find(check => check.status === 'unknown');
    const firstProblem: CalculationQuizGrade['firstProblem'] =
        configurationError ? { stage: 'prompt', reason: 'curve-task-invalid', lineIndex: 0 }
        : !runtime ? { stage: 'prompt', reason: 'cas-unavailable', lineIndex: 0 }
        : !bounded ? { stage: 'prompt', reason: decoded === null ? 'invalid-format' : lines.length < (optionalPrompt ? 1 : 2) ? 'too-few-lines' : lines.length > 32 ? 'too-many-lines' : 'curve-unsupported', lineIndex: 0 }
        : firstIsAnswer && firstResult?.proof !== true ? { stage: 'transition', reason: knownReason(firstResult), lineIndex: 0 }
        : promptStatus !== 'valid' ? { stage: 'prompt', reason: matched === false ? 'prompt-mismatch' : 'prompt-unproven', lineIndex: 0 }
        : invalid || unknown ? { stage: 'transition', reason: (invalid || unknown)!.reason, lineIndex: Math.max(0, (invalid || unknown)!.toIndex - 1) }
        : !complete ? { stage: 'final', reason: model ? 'curve-incomplete' : 'curve-unsupported', lineIndex: lines.length - 1 } : undefined;
    return {
        accepted: !firstProblem,
        outcome: !firstProblem ? 'correct' : configurationError || !bounded || !runtime || promptStatus === 'unknown' ? 'unknown'
            : promptStatus === 'invalid' || invalid ? 'incorrect' : unknown || !model ? 'unknown' : 'incomplete',
        lines, promptCheck: { status: promptStatus, reason: anchorProof === true ? 'prompt-match' : anchorProof === false ? 'prompt-mismatch' : 'prompt-unproven' },
        transitionChecks: checks,
        finalCheck: complete ? { status: 'valid', reason: 'task-complete' } : { status: model ? 'incomplete' : 'unknown', reason: model ? 'task-incomplete' : 'unsupported' },
        ...(configurationError ? { configurationError } : {}),
        ...(firstProblem ? { firstProblem } : {})
    };
}

export function validateCurveCalculation(prompt: string, answer: string | readonly string[], options: TransitionValidationOptions = {}): CalculationQuizGrade | null {
    const iterator = iterateCurveCalculation(prompt, answer, options);
    let next = iterator.next();
    while (!next.done) next = iterator.next();
    return next.value;
}

export function generateCurveExpectedCalculation(prompt: string, options: TransitionValidationOptions = {}): string[] | null {
    if (!usesCurveCalculation(options) || calculationContextError(options.calculationContext) || options.runtime === null) return null;
    const runtime = options.runtime === undefined ? proof.resolveAlgebriteRuntime() : options.runtime;
    if (!runtime) return null;
    try {
        const env = createCurveEnvironment(prompt, options.calculationContext!, runtime);
        const model = env && buildCurveTask(env);
        if (!model) return null;
        const lines = [prompt, ...model.expectedLines];
        return validateCurveCalculation(prompt, lines, options)?.accepted ? lines : null;
    } catch { return null; }
}
