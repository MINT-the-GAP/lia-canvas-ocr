import { isCalculationProofInputBounded, isCalculationCasInputBounded } from './calculation-proof-budget.ts';
import { analyzeRationalEquation, proveRationalEquationTransition, proveRationalSolutionSet, type RationalEquationModel } from './rational-equation-proof.ts';
import {
    calculationProofTools as proof, validateEquationTransition,
    validateCalculationSubmission as validateLegacySubmission,
    type AlgebriteRuntime, type ParsedEquation, type Proof, type TransitionCheck,
    type TransitionReason, type TransitionValidationOptions,
    type CalculationQuizGrade, type CalculationPromptCheck, type CalculationFinalCheck
} from './equivalence.ts';
import {
    parseCalculationStatement, parseCalculationPromptStructure,
    type CalculationStatement, type CalculationRoleHint
} from './calculation-structure.ts';
import {
    analyzeNumericPolynomial, provePolynomialTransition, proveCompleteRealSolutionSet,
    provePolynomialCandidateSet, type CompleteRealSolutionProof
} from './nonlinear-proof.ts';
import {
    analyzeLinearSystem, compareLinearSystems, proveLinearSystemConsequence,
    proveLinearSystemAssignments, type LinearSystemModel
} from './linear-system-proof.ts';
import type { CalculationCheckRole } from './calculation-methods.ts';

function boundedRuntime(options: TransitionValidationOptions): AlgebriteRuntime | null {
    const runtime = options.runtime === undefined ? proof.resolveAlgebriteRuntime() : options.runtime;
    if (!runtime) return null;
    return { run(source: string): unknown {
        if (!isCalculationCasInputBounded(source)) throw new Error('Calculation proof budget exceeded.');
        return runtime.run(source);
    } };
}

type EquationRecord = { text: string; equation: ParsedEquation; index: number; operation?: string };
type Definition = { variable: string; expression: string; originalVariable: string; index: number };
type StepResult = { status: TransitionCheck['status']; reason: TransitionReason; role?: CalculationCheckRole; fromIndex?: number; messageKey?: string; operation?: string; side?: TransitionCheck['side'] };
const VALID: StepResult = { status: 'valid', reason: 'equivalent-polynomial-equations' };
const UNKNOWN: StepResult = { status: 'unknown', reason: 'unsupported-or-unproven' };
function relation(statement: CalculationStatement): string | null {
    return statement.kind === 'equation' ? statement.left + '=' + statement.right
        : statement.kind === 'equality-chain' ? statement.operands[0] + '=' + statement.operands[1] : null;
}
function leaves(statement: CalculationStatement): CalculationStatement[] {
    if (statement.kind !== 'group') return [statement];
    const result: CalculationStatement[] = [];
    for (const member of statement.members) result.push(...leaves(member));
    return result;
}
// Algebrite reserves i for the imaginary unit although school equations may
// use it as a real unknown. Leave that ambiguous spelling unproved here.
function hasReservedCasVariable(source: string): boolean {
    return leaves(parseCalculationStatement(source)).some(statement => {
        const fragments = statement.kind === 'equation' ? [statement.left, statement.right]
            : statement.kind === 'equality-chain' ? statement.operands : [statement.source];
        if (statement.kind === 'equation' || statement.kind === 'equality-chain') {
            const operation = proof.parseOperation(statement.operation || null);
            if (operation && proof.variablesIn([operation.operand.cas]).includes('i')) return true;
        }
        return fragments.some(fragment => {
            const converted = proof.convertTexFragment(fragment);
            if (converted) return proof.variablesIn([converted.cas]).includes('i');
            const plain = fragment.replace(/\\(?:text|mbox)\s*\{[^}]*\}/gu, '').replace(/\\[A-Za-z]+/gu, '');
            return /(?:^|[^A-Za-z0-9_])i(?![A-Za-z0-9_])/u.test(plain);
        });
    });
}
function supportedPrompt(promptTex: string): boolean {
    const parsed = parseCalculationPromptStructure(promptTex);
    return !parsed.issues.length && parsed.rows.length > 0 && parsed.rows.every(row =>
        leaves(row.statement).every(statement => statement.kind === 'equation'));
}
function record(statement: CalculationStatement, index: number): EquationRecord | null {
    const text = relation(statement);
    const equation = text && proof.parseEquation(text);
    return text && equation ? { text, equation, index,
        operation: statement.kind === 'equation' || statement.kind === 'equality-chain' ? statement.operation : undefined } : null;
}
function resultOf(value: Proof, valid: TransitionReason, invalid: TransitionReason, role?: CalculationCheckRole): StepResult {
    return value === null ? UNKNOWN : { status: value ? 'valid' : 'invalid', reason: value ? valid : invalid, role };
}
function combine(checks: StepResult[]): StepResult {
    return checks.find(check => check.status === 'invalid') ||
        checks.find(check => check.status === 'unknown') || checks[checks.length - 1] || UNKNOWN;
}
function identity(left: string, right: string, runtime: AlgebriteRuntime): Proof {
    const guarded = analyzeNumericPolynomial({
        left: { cas: left, domainRisk: false }, right: { cas: right, domainRisk: false }
    }, runtime);
    return guarded ? proof.proveExpressionIdentity(left, right, runtime) : null;
}
function sameSides(first: ParsedEquation, second: ParsedEquation, runtime: AlgebriteRuntime): Proof {
    if (first.left.cas === second.left.cas && first.right.cas === second.right.cas ||
        first.left.cas === second.right.cas && first.right.cas === second.left.cas) return true;
    if (first.left.domainRisk || first.right.domainRisk || second.left.domainRisk || second.right.domainRisk) return null;
    const direct = [proof.proveExpressionIdentity(first.left.cas, second.left.cas, runtime),
        proof.proveExpressionIdentity(first.right.cas, second.right.cas, runtime)];
    const swapped = [proof.proveExpressionIdentity(first.left.cas, second.right.cas, runtime),
        proof.proveExpressionIdentity(first.right.cas, second.left.cas, runtime)];
    return direct.every(value => value === true) || swapped.every(value => value === true)
        ? true : [...direct, ...swapped].some(value => value === null) ? null : false;
}
function substitute(equation: ParsedEquation, variable: string, expression: string, runtime: AlgebriteRuntime): ParsedEquation | null {
    const convert = (cas: string) => proof.casRun('subst((' + expression + '),' + variable + ',(' + cas + '))', runtime);
    const left = convert(equation.left.cas), right = convert(equation.right.cas);
    return left !== null && right !== null
        ? { left: { cas: left, domainRisk: equation.left.domainRisk }, right: { cas: right, domainRisk: equation.right.domainRisk } } : null;
}
function isolated(equation: ParsedEquation, variables: readonly string[]): { variable: string; expression: string } | null {
    for (const [left, right] of [[equation.left, equation.right], [equation.right, equation.left]]) {
        for (const variable of variables) {
            if (proof.isBareCalculationVariable(left, variable) && !proof.variablesIn([right.cas]).includes(variable)) {
                return { variable, expression: right.cas };
            }
        }
    }
    return null;
}

/** Original constraints and auxiliary work share a session, not a guessed chain.
 * Live review performs one displayed row at a time and yields between rows. */
export class CalculationPathValidation {
    readonly lines: string[];
    readonly checks: TransitionCheck[] = [];
    readonly prompt: string;
    private readonly runtime: AlgebriteRuntime | null;
    private readonly bounded: boolean;
    private readonly options: TransitionValidationOptions;
    private readonly statements: CalculationStatement[];
    private readonly expected: EquationRecord[];
    private readonly system: LinearSystemModel | null;
    private readonly rational: RationalEquationModel | null;
    private readonly matchedGiven = new Set<number>();
    private readonly labels = new Map<string, EquationRecord>();
    private readonly systemAssignments = new Map<string, string>();
    private current: EquationRecord | null = null;
    private original: EquationRecord | null = null;
    private originalRoots: CompleteRealSolutionProof | null = null;
    private candidateValues: string[] = [];
    private readonly indexedValues = new Map<string, string>();
    private definition: Definition | null = null;
    private auxiliaryEquation: EquationRecord | null = null;
    private auxiliaryPending: EquationRecord | null = null;
    private auxiliaryRoots: CompleteRealSolutionProof | null = null;
    private branchEquation: EquationRecord | null = null;
    private pendingRole: CalculationRoleHint | undefined;
    private pendingDerivation = '';
    private pendingLabel = '';
    private firstFailure: StepResult | null = null;
    private cursor = 0;
    private initialMatched = false;
    private lastWasLabel = false;
    private verificationIndex = -1;
    private reachedSolution = false;
    private pathHasFailure = false;

    constructor(lines: readonly string[], promptTex?: string, options: TransitionValidationOptions = {}) {
        this.lines = lines.map(line => String(line || '').trim());
        this.prompt = String(promptTex || this.lines[0] || '').trim();
        this.bounded = this.lines.length <= 32 && this.lines.join('\n').length <= 16384 && this.lines.every(isCalculationProofInputBounded) && isCalculationProofInputBounded(this.prompt)
            && !this.lines.some(hasReservedCasVariable) && !hasReservedCasVariable(this.prompt);
        this.runtime = boundedRuntime(options);
        this.options = { ...options, strictDeclaredOperations: true, runtime: this.runtime };
        this.statements = this.lines.map(parseCalculationStatement);
        const parsedPrompt = parseCalculationPromptStructure(this.prompt);
        this.expected = [];
        if (supportedPrompt(this.prompt)) for (const row of parsedPrompt.rows) {
            for (const statement of leaves(row.statement)) {
                const value = record(statement, 0);
                if (value) this.expected.push({ ...value, operation: undefined });
            }
        }
        this.system = this.bounded && this.runtime && this.expected.length > 1
            ? analyzeLinearSystem(this.expected.map(row => row.text), this.runtime) : null;
        if (!this.system && this.expected.length === 1) this.original = this.expected[0];
        this.rational = this.bounded && this.runtime && this.original ? analyzeRationalEquation(this.original.equation, this.runtime) : null;
    }
    private nextCheck(index: number, result: StepResult): TransitionCheck {
        const fromIndex = Math.max(0, Math.min(index - 1, result.fromIndex ?? index - 1));
        return { from: this.lines[fromIndex] || '', to: this.lines[index] || '', fromIndex, toIndex: index,
            status: result.status, reason: result.reason,
            messageKey: result.messageKey || (result.reason === 'cas-unavailable' ? 'ocr.plus.validation.casUnavailable'
                : result.reason === 'unsupported-or-unproven' ? 'ocr.plus.validation.unknown'
                    : 'ocr.plus.validation.' + result.reason),
            ...(result.role ? { role: result.role } : {}),
            ...(result.operation ? { operation: result.operation } : {}),
            ...(result.side ? { side: result.side } : {}) };
    }
    private given(row: EquationRecord, statement: CalculationStatement): StepResult | null {
        if (!this.runtime) return UNKNOWN;
        if (this.system && this.matchedGiven.size < this.expected.length) {
            const match = this.expected.findIndex((expected, index) =>
                !this.matchedGiven.has(index) && sameSides(expected.equation, row.equation, this.runtime!) === true);
            if (match < 0) return { status: 'invalid', reason: 'incorrect-system-consequence', role: 'given' };
            this.matchedGiven.add(match);
            this.initialMatched = this.matchedGiven.size === this.expected.length;
            this.current = row;
            const label = statement.label || this.pendingLabel;
            if (label && /^(?:I|II|III)\.?$/u.test(label)) this.labels.set(label.replace(/\.$/u, ''), row);
            this.pendingLabel = '';
            return { status: 'valid', reason: 'given-system-equation', role: 'given' };
        }
        if (!this.initialMatched && this.original) {
            // A failed first main equation remains the source of subsequent
            // algebra; a later task match must not masquerade as its proof.
            if (this.current) return null;
            this.current = row;
            const match = sameSides(this.original.equation, row.equation, this.runtime);
            if (match === true) {
                this.initialMatched = true; this.current = row;
                this.original = { ...this.original, index: row.index };
                return row.index > 0 ? { status: 'valid', reason: 'given-equation', role: 'given' } : VALID;
            }
            return match === false ? { status: 'invalid', reason: 'different-polynomial-solutions' } : UNKNOWN;
        }
        return null;
    }
    private checkDerivation(annotation: string, row: EquationRecord): StepResult {
        if (!this.runtime || !this.system) return UNKNOWN;
        const source = annotation.replace(/\s+/gu, '').replace(/[.:]$/u, '');
        const insertion = /^(I|II|III)in(I|II|III)$/iu.exec(source);
        if (insertion) {
            const replacing = this.labels.get(insertion[1].toUpperCase()), base = this.labels.get(insertion[2].toUpperCase());
            if (!replacing || !base) return UNKNOWN;
            const assignment = isolated(replacing.equation, this.system.variables);
            const changed = assignment && substitute(base.equation, assignment.variable, assignment.expression, this.runtime);
            return changed ? resultOf(sameSides(changed, row.equation, this.runtime),
                'substitution-step', 'incorrect-system-consequence', 'system') : UNKNOWN;
        }
        const terms = source.match(/[+-]?(?:\d+)?(?:III|II|I)/gu);
        if (!terms || terms.join('') !== source || terms.length < 2 || terms.length > 3) return UNKNOWN;
        const inputs: { coefficient: string; value: EquationRecord }[] = [];
        for (const term of terms) {
            const match = /^([+-]?\d*)(III|II|I)$/u.exec(term)!;
            const coefficient = match[1] === '-' ? '-1' : !match[1] || match[1] === '+' ? '1' : match[1];
            if (Math.abs(Number(coefficient)) > 100 || Number(coefficient) === 0) return UNKNOWN;
            const value = this.labels.get(match[2]);
            if (!value) return UNKNOWN;
            inputs.push({ coefficient, value });
        }
        const combined: ParsedEquation = {
            left: { cas: inputs.map(term => '(' + term.coefficient + ')*(' + term.value.equation.left.cas + ')').join('+'), domainRisk: false },
            right: { cas: inputs.map(term => '(' + term.coefficient + ')*(' + term.value.equation.right.cas + ')').join('+'), domainRisk: false }
        };
        return resultOf(sameSides(combined, row.equation, this.runtime),
            'linear-system-consequence', 'incorrect-system-consequence', 'system');
    }
    private systemRow(row: EquationRecord, statement: CalculationStatement): StepResult {
        if (!this.system || !this.runtime) return UNKNOWN;
        const derivation = statement.label && !/^(?:I|II|III)\.?$/u.test(statement.label)
            ? statement.label : this.pendingDerivation;
        this.pendingDerivation = '';
        if (derivation) {
            const declared = this.checkDerivation(derivation, row);
            if (declared.status !== 'valid') return declared;
        }
        if (this.current?.operation) {
            const declared = validateEquationTransition(this.current.text + ' \\mid ' + this.current.operation,
                row.text, this.current.index, { ...this.options, strictDeclaredOperations: true });
            if (declared.status !== 'valid') return declared;
        }
        const consequence = proveLinearSystemConsequence(this.system, row.text, this.runtime);
        if (consequence !== true) return resultOf(consequence, 'linear-system-consequence', 'incorrect-system-consequence', 'system');
        const value = isolated(row.equation, this.system.variables);
        if (value && !proof.variablesIn([value.expression]).length && !row.operation) this.systemAssignments.set(value.variable, row.text);
        const label = statement.label || this.pendingLabel;
        if (label && /^(?:I|II|III)\.?$/u.test(label)) this.labels.set(label.replace(/\.$/u, ''), row);
        this.pendingLabel = ''; this.current = row;
        return { status: 'valid', reason: derivation && /in/iu.test(derivation)
            ? 'substitution-step' : 'linear-system-consequence', role: 'system' };
    }
    private verify(row: EquationRecord, explicit: boolean): StepResult | null {
        if (!this.runtime || !this.original || !this.reachedSolution || this.candidateValues.length !== 1) return explicit ? UNKNOWN : null;
        if (proof.variablesIn([row.equation.left.cas, row.equation.right.cas]).length) return explicit ? UNKNOWN : null;
        const variables = proof.variablesIn([this.original.equation.left.cas, this.original.equation.right.cas]);
        if (variables.length !== 1) return explicit ? UNKNOWN : null;
        if (row.operation) return UNKNOWN;
        const substituted = substitute(this.original.equation, variables[0], this.candidateValues[0], this.runtime);
        if (!substituted) return explicit ? UNKNOWN : null;
        // Denominator safety is established against the retained original domain.
        if (this.rational && this.rational.excludedValues.some(value => identity(value, this.candidateValues[0], this.runtime!) === true)) {
            return { status: 'invalid', reason: 'domain-violation', role: 'verification' };
        }
        substituted.left.domainRisk = false; substituted.right.domainRisk = false;
        const matches = sameSides(substituted, row.equation, this.runtime);
        const equal = identity(row.equation.left.cas, row.equation.right.cas, this.runtime);
        if (!explicit && this.verificationIndex < 0 && matches !== true) return null;
        if (matches === true && equal === true) {
            this.verificationIndex = row.index;
            return { status: 'valid', reason: 'verification-step', role: 'verification', fromIndex: this.original.index };
        }
        return matches === false || equal === false
            ? { status: 'invalid', reason: 'incorrect-verification', role: 'verification' } : UNKNOWN;
    }
    private define(row: EquationRecord): StepResult | null {
        if (!this.runtime || !this.original || this.system || this.definition || this.rational) return null;
        const originalVariables = proof.variablesIn([this.original.equation.left.cas, this.original.equation.right.cas]);
        if (originalVariables.length !== 1) return null;
        const variables = proof.variablesIn([row.equation.left.cas, row.equation.right.cas]);
        const fresh = variables.filter(variable => !originalVariables.includes(variable));
        if (fresh.length !== 1 || variables.length !== 2) return null;
        const assignment = isolated(row.equation, fresh);
        if (!assignment || row.operation || fresh[0] === 'i' || fresh[0] === 'e') return null;
        const polynomial = analyzeNumericPolynomial({
            left: { cas: assignment.expression, domainRisk: row.equation.right.domainRisk },
            right: { cas: '0', domainRisk: false }
        }, this.runtime);
        if (!polynomial || polynomial.variable !== originalVariables[0] || polynomial.degree < 1 || polynomial.degree > 2) return null;
        this.definition = { variable: fresh[0], expression: assignment.expression,
            originalVariable: originalVariables[0], index: row.index };
        return { status: 'valid', reason: 'definition-step', role: 'definition' };
    }
    private discriminant(statement: CalculationStatement): StepResult | null {
        if (!this.runtime || !this.original || !this.initialMatched) return null;
        if (proof.variablesIn([this.original.equation.left.cas, this.original.equation.right.cas]).includes('D')) return null;
        const text = relation(statement) || statement.source;
        if (!/^\s*(?:\\Delta|D)\s*=/u.test(text)) return null;
        if ((statement.kind === 'equation' || statement.kind === 'equality-chain') && statement.operation) return UNKNOWN;
        const polynomial = analyzeNumericPolynomial((this.current || this.original).equation, this.runtime, 2);
        if (!polynomial || polynomial.degree !== 2) return UNKNOWN;
        const [c, b, a] = polynomial.coefficients;
        const expected = '(' + b + ')^2-4*(' + a + ')*(' + c + ')';
        const operands = statement.kind === 'equality-chain' ? statement.operands.slice(1)
            : statement.kind === 'equation' ? [statement.right] : text.split('=').slice(1);
        if (!operands.length || operands.length > 4) return UNKNOWN;
        const checks: Proof[] = [];
        for (const operand of operands) {
            const converted = proof.convertTexFragment(operand.replace(/<\s*0\s*$/u, ''));
            if (!converted) return UNKNOWN;
            checks.push(identity(expected, converted.cas, this.runtime));
            if (/<\s*0\s*$/u.test(operand)) {
                const value = proof.casRun('simplify(' + converted.cas + ')', this.runtime);
                if (!value || proof.numericCasValue(value) === null) return UNKNOWN;
                checks.push(Number(proof.numericCasValue(value)) < 0);
            }
        }
        return resultOf(checks.every(check => check === true) ? true
            : checks.some(check => check === false) ? false : null,
            'auxiliary-calculation', 'incorrect-auxiliary-calculation', 'auxiliary');
    }
    private roots(rowSource: string, index: number): StepResult | null {
        if (!this.runtime || !this.original || !this.current || this.system) return null;
        const globalSet = /\\mathcal\s*\{\s*L\s*\}|(?:^|[^A-Za-z])L\s*=/u.test(rowSource);
        const source = globalSet ? this.original : this.branchEquation || this.auxiliaryEquation || this.current;
        if (source.operation || (this.branchEquation || this.auxiliaryEquation || this.current).operation) return null;
        const statement = parseCalculationStatement(rowSource);
        const target = record(statement, index);
        const variables = proof.variablesIn([source.equation.left.cas, source.equation.right.cas]);
        const assignment = target && isolated(target.equation, variables);
        const explicitSet = /\\(?:pm|mathcal|varnothing|emptyset)\b|\u00b1|(?:^|[^A-Za-z])L\s*=|_\s*\{?\s*\d\s*,/u.test(rowSource);
        const indexedCandidate = /(?:^|[^A-Za-z\\])[A-Za-z]_\s*(?:\{\s*)?[1-4](?:\s*\})?\s*=/u.test(rowSource);
        const polynomial = analyzeNumericPolynomial(this.rational?.polynomialEquation || source.equation, this.runtime);
        if (!explicitSet && !indexedCandidate &&
            !(assignment && !proof.variablesIn([assignment.expression]).length && polynomial && polynomial.degree >= 2)) return null;
        // Operations on a multi-valued root row need their own branchwise
        // literal proof. Do not let a later correct set silently consume one.
        if (proof.splitLine(rowSource).operation) return UNKNOWN;
        let roots = this.rational ? proveRationalSolutionSet(this.rational, rowSource, this.runtime)
            : proveCompleteRealSolutionSet(source.equation, rowSource, this.runtime);
        let original = !!this.rational || globalSet;
        if (!roots && source !== this.original && !this.rational) {
            roots = proveCompleteRealSolutionSet(this.original.equation, rowSource, this.runtime);
            original = !!roots;
        }
        if (!roots) return null;
        if (roots.reason === 'extraneous-roots') return { status: 'invalid', reason: 'incorrect-real-solutions', role: 'branch' };
        if (roots.proof === null) return UNKNOWN;
        // An explicit final set must be complete on its own; earlier candidates
        // cannot silently repair an incomplete set written at the end.
        if (explicitSet && roots.proof !== true) return { status: 'unknown', reason: 'incomplete-real-solutions', role: 'branch' };
        if (roots.isIsolated && roots.solutions?.length) {
            const indices: string[] = [];
            const labels = /([A-Za-z])_\s*(?:\{([1-4](?:\s*,\s*[1-4])*)\}|([1-4]))\s*=/gu;
            let label: RegExpExecArray | null;
            while ((label = labels.exec(rowSource))) {
                for (const index of (label[2] || label[3]).split(',')) indices.push(label[1] + '_' + index.trim());
            }
            if (indices.length === roots.solutions.length || roots.solutions.length === 1) {
                for (let part = 0; part < indices.length; part++) {
                    const value = roots.solutions[Math.min(part, roots.solutions.length - 1)];
                    const previous = this.indexedValues.get(indices[part]);
                    if (previous !== undefined && identity(previous, value, this.runtime) !== true) {
                        return { status: 'invalid', reason: 'conflicting-solution-label', role: 'branch' };
                    }
                    this.indexedValues.set(indices[part], value);
                }
            }
        }
        const auxiliary = !!this.auxiliaryEquation && !this.branchEquation && !original;
        if (auxiliary) {
            if (roots.proof !== true) return { status: 'unknown', reason: 'incomplete-real-solutions', role: 'branch' };
            this.auxiliaryRoots = roots;
            return { status: 'valid', reason: 'complete-real-solutions', role: 'branch', fromIndex: source.index };
        }
        if (!roots.isIsolated) { this.reachedSolution = false; this.originalRoots = null; }
        if (roots.solutions && roots.isIsolated) {
            const candidates = this.candidateValues.slice();
            for (const value of roots.solutions) {
                if (!candidates.some(previous => identity(previous, value, this.runtime!) === true)) candidates.push(value);
            }
            const complete = this.rational ? roots : provePolynomialCandidateSet(this.original.equation, candidates, this.runtime);
            if (complete?.reason === 'extraneous-roots') {
                if (this.pathHasFailure && roots.proof === true) {
                    return { status: 'valid', reason: 'complete-real-solutions', role: 'branch', fromIndex: source.index };
                }
                return { status: 'invalid', reason: 'incorrect-real-solutions', role: 'branch' };
            }
            if (complete && complete.proof !== null) {
                this.candidateValues = candidates; this.originalRoots = complete; this.reachedSolution = complete.complete;
            }
        } else if (roots.proof === true && roots.isIsolated && !this.branchEquation) {
            this.originalRoots = roots; this.reachedSolution = true;
        }
        if (roots.proof === true) return { status: 'valid', reason: 'complete-real-solutions', role: 'branch', fromIndex: source.index };
        if (roots.reason === 'missing-roots' && roots.solutions?.length && roots.isIsolated) {
            return { status: 'valid', reason: 'solution-candidate', role: 'branch', fromIndex: source.index };
        }
        return { status: 'unknown', reason: 'incomplete-real-solutions', role: 'branch' };
    }
    private legacyRootStep(source: string): StepResult | null {
        const from = this.branchEquation || this.current;
        if (!from || !this.runtime || this.system || proof.splitLine(source).operation || !/\\(?:sqrt|pm)(?![A-Za-z])|\u00b1/u.test(source)) return null;
        const check = validateEquationTransition(from.text + (from.operation ? ' \\mid ' + from.operation : ''),
            source, from.index, this.options);
        return ['quadratic-root-solutions', 'cubic-root-solution', 'quartic-root-solutions', 'missing-plus-minus'].includes(check.reason)
            ? { ...check, fromIndex: from.index } : null;
    }
    private domain(statement: CalculationStatement): StepResult | null {
        if (!this.rational || !this.runtime) return null;
        const source = statement.source.replace(/\\(?:text|mathrm)\s*\{[^}]*\}\s*:?\s*/gu, '').trim();
        const exclude = /^([A-Za-z])\s*(?:\\ne(?:q)?(?![A-Za-z])|\u2260)\s*(.+)$/u.exec(source);
        if (!exclude || exclude[1] !== this.rational.variable) return null;
        const value = proof.convertTexFragment(exclude[2]);
        if (!value) return UNKNOWN;
        const matches = this.rational.excludedValues.map(excluded => identity(excluded, value.cas, this.runtime!));
        return matches.some(match => match === true)
            ? { status: 'valid', reason: 'domain-restriction', role: 'annotation' } : UNKNOWN;
    }
    private equation(row: EquationRecord, statement: CalculationStatement, role?: CalculationRoleHint): StepResult {
        if (!this.runtime) return UNKNOWN;
        if (!this.initialMatched && role === 'auxiliary') {
            if (row.operation) return UNKNOWN;
            return resultOf(identity(row.equation.left.cas, row.equation.right.cas, this.runtime),
                'auxiliary-calculation', 'incorrect-auxiliary-calculation', 'auxiliary');
        }
        const given = this.given(row, statement);
        if (given) return given;
        if (this.system) return this.systemRow(row, statement);
        if (!this.original || !this.current) return UNKNOWN;
        if (this.auxiliaryPending) {
            const pending = this.auxiliaryPending;
            const declared = validateEquationTransition(pending.text + ' \\mid ' + pending.operation,
                row.text, pending.index, { ...this.options, strictDeclaredOperations: true });
            if (declared.status !== 'valid') return declared;
            const equal = identity(row.equation.left.cas, row.equation.right.cas, this.runtime);
            if (equal !== true) return resultOf(equal, 'auxiliary-calculation', 'incorrect-auxiliary-calculation', 'auxiliary');
            this.auxiliaryPending = row.operation ? row : null;
            return { status: 'valid', reason: 'auxiliary-calculation', role: 'auxiliary', fromIndex: pending.index };
        }
        const verification = this.verify(row, role === 'check');
        if (verification) return verification;
        const definition = this.define(row);
        if (definition) return definition;
        if (this.definition) {
            const variables = proof.variablesIn([row.equation.left.cas, row.equation.right.cas]);
            if (variables.length === 1 && variables[0] === this.definition.variable) {
                if (!this.auxiliaryEquation) {
                    const changed = substitute(row.equation, this.definition.variable, this.definition.expression, this.runtime);
                    const equivalent = changed && provePolynomialTransition(this.current.equation, changed, this.runtime);
                    if (equivalent === true) {
                        this.auxiliaryEquation = row;
                        return { status: 'valid', reason: 'substitution-step', role: 'definition', fromIndex: this.definition.index };
                    }
                    return UNKNOWN;
                }
                if (this.auxiliaryEquation.operation) {
                    const declared = validateEquationTransition(this.auxiliaryEquation.text + ' \\mid ' + this.auxiliaryEquation.operation,
                        row.text, this.auxiliaryEquation.index, { ...this.options, strictDeclaredOperations: true });
                    if (declared.status !== 'valid') return declared;
                }
                const equivalent = provePolynomialTransition(this.auxiliaryEquation.equation, row.equation, this.runtime);
                if (equivalent === true) { this.auxiliaryEquation = row; return { ...VALID, fromIndex: this.definition.index }; }
            }
            if (this.auxiliaryRoots?.complete && this.auxiliaryRoots.solutions?.length) {
                for (const value of this.auxiliaryRoots.solutions) {
                    const branch: ParsedEquation = { left: { cas: this.definition.expression, domainRisk: false },
                        right: { cas: value, domainRisk: false } };
                    if (provePolynomialTransition(branch, row.equation, this.runtime) === true) {
                        this.branchEquation = row; this.indexedValues.clear();
                        return { status: 'valid', reason: 'back-substitution', role: 'branch', fromIndex: this.definition.index };
                    }
                }
            }
        }
        if (role === 'auxiliary') {
            const equal = identity(row.equation.left.cas, row.equation.right.cas, this.runtime);
            if (equal === true && row.operation) this.auxiliaryPending = row;
            return resultOf(equal, 'auxiliary-calculation', 'incorrect-auxiliary-calculation', 'auxiliary');
        }
        const from = this.branchEquation || this.current;
        const legacy = validateEquationTransition(from.text + (from.operation ? ' \\mid ' + from.operation : ''),
            row.text, from.index, this.options);
        if (legacy.status === 'valid') {
            if (this.branchEquation) this.branchEquation = row; else this.current = row;
            this.rememberSingleSolution(row);
            return { ...legacy, fromIndex: from.index };
        }
        if (from.operation && !this.rational) return legacy;
        const equivalent = this.rational
            ? proveRationalEquationTransition(this.rational, from.equation, row.equation, this.runtime)
            : provePolynomialTransition(from.equation, row.equation, this.runtime);
        if (equivalent === true) {
            if (from.operation && this.declaredRationalOperation(from, row) !== true) return legacy;
            if (this.branchEquation) this.branchEquation = row; else this.current = row;
            this.rememberSingleSolution(row);
            return { ...VALID, fromIndex: from.index };
        }
        if (equivalent === false) return { status: 'invalid', reason: 'different-polynomial-solutions', fromIndex: from.index };
        return legacy;
    }
    private declaredRationalOperation(from: EquationRecord, to: EquationRecord): Proof {
        if (!this.runtime || !this.rational || !from.operation) return null;
        const operation = proof.parseOperation(from.operation);
        if (!operation) return null;
        if (operation.kind === 'multiply' || operation.kind === 'divide') {
            const factor = analyzeNumericPolynomial({ left: operation.operand,
                right: { cas: '0', domainRisk: false } }, this.runtime, 1);
            if (!factor) return null;
            if (factor.degree === 0) {
                if (identity(factor.coefficients[0], '0', this.runtime) !== false) return null;
            } else {
                const zero = proof.casRun('simplify(-(' + factor.coefficients[0] + ')/(' + factor.coefficients[1] + '))', this.runtime);
                if (!zero || !this.rational.excludedValues.some(value => identity(value, zero, this.runtime!) === true)) return null;
            }
        }
        const left = proof.proveExpressionIdentity(proof.applyOperation(from.equation.left.cas, operation), to.equation.left.cas, this.runtime);
        const right = proof.proveExpressionIdentity(proof.applyOperation(from.equation.right.cas, operation), to.equation.right.cas, this.runtime);
        return left === true && right === true ? true : left === false || right === false ? false : null;
    }
    private rememberSingleSolution(row: EquationRecord): void {
        this.reachedSolution = false; this.originalRoots = null;
        if (!this.runtime || !this.original || row.operation) return;
        const variables = proof.variablesIn([this.original.equation.left.cas, this.original.equation.right.cas]);
        const solved = isolated(row.equation, variables);
        if (!solved || proof.variablesIn([solved.expression]).length) return;
        const complete = this.rational ? proveRationalSolutionSet(this.rational, row.text, this.runtime)
            : provePolynomialCandidateSet(this.original.equation, [solved.expression], this.runtime);
        if (complete?.proof === true) {
            this.candidateValues = complete.solutions?.slice() || [solved.expression];
            this.originalRoots = complete; this.reachedSolution = true;
        }
    }
    private evaluate(statement: CalculationStatement, index: number, inheritedRole?: CalculationRoleHint): StepResult {
        if (!this.runtime) return { status: 'unknown', reason: 'cas-unavailable' };
        if (!this.bounded) return UNKNOWN;
        const role = statement.roleHint || inheritedRole || this.pendingRole;
        if (statement.kind === 'label') {
            this.lastWasLabel = true;
            if (statement.roleHint) this.pendingRole = statement.roleHint;
            const label = statement.label.replace(/[.:]$/u, '');
            if (/^(?:I|II|III)$/u.test(label)) this.pendingLabel = label;
            else if (/^(?:[+\-\d\s]*(?:I|II|III)){2,3}$/u.test(label) ||
                /^(?:I|II|III)\s+in\s+(?:I|II|III)$/iu.test(label)) this.pendingDerivation = label;
            else if (!statement.roleHint) return UNKNOWN;
            return { status: 'valid', reason: 'calculation-annotation', role: 'annotation' };
        }
        this.lastWasLabel = false;
        this.pendingRole = undefined;
        const domain = this.domain(statement);
        if (domain) return domain;
        const delta = this.discriminant(statement);
        if (delta) return delta;
        if (!this.system && !this.auxiliaryPending && this.initialMatched && (role !== 'auxiliary' || !!this.auxiliaryEquation) && role !== 'check') {
            const roots = this.roots(statement.source, index);
            if (roots) {
                return roots.status === 'unknown' && roots.reason === 'unsupported-or-unproven'
                    ? this.legacyRootStep(statement.source) || roots : roots;
            }
            const legacyRoots = this.legacyRootStep(statement.source);
            if (legacyRoots) return legacyRoots;
        }
        if (statement.kind === 'group') {
            const members = leaves(statement);
            if (this.system && this.initialMatched && statement.semantics === 'system') {
                const equations = members.map(member => relation(member));
                if (equations.some(value => !value)) return UNKNOWN;
                const model = analyzeLinearSystem(equations as string[], this.runtime);
                if (!model) return UNKNOWN;
                const equivalent = compareLinearSystems(this.system, model, this.runtime);
                if (equivalent !== true) return resultOf(equivalent, 'equivalent-system', 'incorrect-system-consequence', 'system');
            }
            return combine(statement.members.map(member => this.evaluate(member, index, role)));
        }
        if (statement.kind === 'unsupported') return UNKNOWN;
        const row = record(statement, index);
        if (!row) return UNKNOWN;
        const first = this.equation(row, statement, role);
        if (statement.kind !== 'equality-chain') return first;
        const extras: StepResult[] = [first];
        for (let part = 1; part + 1 < statement.operands.length; part++) {
            const left = proof.convertTexFragment(statement.operands[part]);
            const right = proof.convertTexFragment(statement.operands[part + 1]);
            if (!left || !right) { extras.push(UNKNOWN); continue; }
            const equal = identity(left.cas, right.cas, this.runtime);
            if (equal === true) extras.push({ status: 'valid', reason: 'auxiliary-calculation', role: 'auxiliary' });
            else if (this.system) extras.push(resultOf(proveLinearSystemConsequence(this.system,
                statement.operands[part] + '=' + statement.operands[part + 1], this.runtime),
                'linear-system-consequence', 'incorrect-system-consequence', 'system'));
            else extras.push(resultOf(equal, 'auxiliary-calculation', 'incorrect-auxiliary-calculation', 'auxiliary'));
        }
        return combine(extras);
    }
    next(): TransitionCheck | null {
        if (this.cursor >= this.lines.length) return null;
        const index = this.cursor++;
        const result = this.evaluate(this.statements[index], index);
        if (result.status !== 'valid') {
            this.pathHasFailure = true;
            const statement = this.statements[index];
            const row = record(statement, index);
            // Judge subsequent ordinary algebra against what was actually
            // written. Keep every earlier failure for the overall grade.
            if (this.initialMatched && !this.system && row &&
                (!statement.roleHint || statement.roleHint === 'main') &&
                (!result.role || result.role === 'equivalence') &&
                proof.variablesIn([row.equation.left.cas, row.equation.right.cas]).length) {
                if (this.branchEquation) this.branchEquation = row; else this.current = row;
                this.reachedSolution = false; this.originalRoots = null;
            }
        }
        if (index === 0) {
            if (result.status !== 'valid') this.firstFailure = result;
            return this.next();
        }
        const check = this.nextCheck(index, result);
        this.checks.push(check);
        return check;
    }
    finish(): CalculationQuizGrade {
        while (this.cursor < this.lines.length) this.next();
        const promptCheck: CalculationPromptCheck = this.initialMatched && !this.firstFailure
            ? { status: 'valid', reason: 'prompt-match' }
            : { status: this.firstFailure?.status === 'invalid' ? 'invalid' : 'unknown',
                reason: this.firstFailure?.status === 'invalid' ? 'prompt-mismatch' : 'prompt-unproven' };
        let finalCheck: CalculationFinalCheck = { status: 'incomplete', reason: 'not-isolated' };
        if (this.system && this.runtime) {
            const solved = proveLinearSystemAssignments(this.system, Array.from(this.systemAssignments.values()), this.runtime);
            finalCheck = solved === true ? { status: 'valid', reason: 'solved-system' }
                : { status: 'incomplete', reason: 'not-isolated' };
        } else if (this.reachedSolution && this.originalRoots?.complete) {
            finalCheck = { status: 'valid', reason: 'solved-root-set' };
        } else if (this.runtime && this.current && !this.definition) {
            finalCheck = proof.checkCalculationFinal(this.prompt, [this.current.text], [], this.runtime);
            if (finalCheck.status === 'valid' && this.original) {
                const variables = proof.variablesIn([this.original.equation.left.cas, this.original.equation.right.cas]);
                const solved = isolated(this.current.equation, variables);
                const complete = this.rational ? proveRationalSolutionSet(this.rational, this.current.text, this.runtime)
                    : solved && provePolynomialCandidateSet(this.original.equation, [solved.expression], this.runtime);
                if (!complete?.complete) finalCheck = { status: 'incomplete', reason: 'not-isolated' };
            }
        }
        if (this.lastWasLabel || this.pendingDerivation || this.pendingLabel || this.auxiliaryPending || this.current?.operation || this.branchEquation?.operation) finalCheck = { status: 'incomplete', reason: 'not-isolated' };
        const invalid = this.checks.find(check => check.status === 'invalid');
        const unknown = this.checks.find(check => check.status === 'unknown');
        const firstProblem: CalculationQuizGrade['firstProblem'] = !this.runtime
            ? { stage: 'prompt', reason: 'cas-unavailable', lineIndex: 0 }
            : promptCheck.status !== 'valid' ? { stage: 'prompt', reason: promptCheck.reason, lineIndex: 0 }
                : invalid || unknown ? { stage: 'transition', reason: (invalid || unknown)!.reason, lineIndex: (invalid || unknown)!.toIndex - 1 }
                    : finalCheck.status !== 'valid' ? { stage: 'final', reason: finalCheck.reason, lineIndex: this.lines.length - 1 } : undefined;
        const outcome: CalculationQuizGrade['outcome'] = !firstProblem ? 'correct'
            : !this.runtime || promptCheck.status === 'unknown' ? 'unknown'
                : promptCheck.status === 'invalid' || invalid ? 'incorrect'
                    : unknown || finalCheck.status === 'unknown' ? 'unknown' : 'incomplete';
        return { accepted: !firstProblem, outcome, lines: this.lines, promptCheck,
            transitionChecks: this.checks, finalCheck, ...(firstProblem ? { firstProblem } : {}) };
    }
}
export function* iterateCalculationPathChecks(
    lines: readonly string[], promptTex?: string, options: TransitionValidationOptions = {}
): Generator<TransitionCheck> {
    const session = new CalculationPathValidation(lines, promptTex, options);
    let next: TransitionCheck | null;
    while ((next = session.next())) yield next;
}
export function validateCalculationPathSubmission(
    promptTex: string, answer: string | readonly string[], options: TransitionValidationOptions = {}
): CalculationQuizGrade {
    const lines = proof.decodeCalculationSubmission(answer);
    if (!lines || lines.length < 2 || lines.length > 32) return validateLegacySubmission(promptTex, answer, options);
    const bounded = lines.every(isCalculationProofInputBounded) && isCalculationProofInputBounded(promptTex)
        && !lines.some(hasReservedCasVariable) && !hasReservedCasVariable(promptTex);
    if (bounded && supportedPrompt(promptTex)) {
        const legacy = validateLegacySubmission(promptTex, answer, { ...options, runtime: boundedRuntime(options) });
        if (legacy.accepted) return legacy;
    }
    return new CalculationPathValidation(lines, promptTex, { ...options, strictDeclaredOperations: true }).finish();
}
