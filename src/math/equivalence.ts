export type TransitionStatus = 'valid' | 'invalid' | 'unknown';
export type TransitionSide = 'left' | 'right' | 'both';

type AlgebriteRuntime = {
    run(source: string): unknown;
};

export type TransitionValidationOptions = {
    /**
     * Symbols the caller can prove are non-zero in the exercise context.
     * No such assumption is made implicitly.
     */
    nonZeroSymbols?: readonly string[];
    /**
     * Require a written transformation operation to be the operation that
     * actually produces the following equation. This is intentionally stricter
     * than the review UI and is used when a calculation decides a quiz.
     */
    strictDeclaredOperations?: boolean;
};

export type CalculationQuizOutcome =
    | 'correct'
    | 'incorrect'
    | 'incomplete'
    | 'unknown';

export type CalculationPromptCheck = {
    status: TransitionStatus;
    reason: 'prompt-match' | 'prompt-mismatch' | 'prompt-unproven';
};

export type CalculationFinalCheck = {
    status: 'valid' | 'incomplete' | 'unknown';
    reason: 'solved-variable' | 'solved-root-set' | 'not-isolated' | 'unsupported';
};

export type CalculationQuizGrade = {
    accepted: boolean;
    outcome: CalculationQuizOutcome;
    lines: string[];
    promptCheck: CalculationPromptCheck;
    transitionChecks: TransitionCheck[];
    finalCheck: CalculationFinalCheck;
    firstProblem?: {
        stage: 'prompt' | 'transition' | 'final';
        lineIndex?: number;
        reason: string;
    };
};

export type TransitionReason =
    | 'operation-applied-both-sides'
    | 'operation-missing-left'
    | 'operation-missing-right'
    | 'operation-mismatch-both'
    | 'equivalent-linear-equations'
    | 'quadratic-root-solutions'
    | 'quartic-root-solutions'
    | 'cubic-root-solution'
    | 'missing-plus-minus'
    | 'different-linear-solutions'
    | 'domain-uncertain'
    | 'cas-unavailable'
    | 'unsupported-or-unproven';

export type TransitionCheck = {
    from: string;
    to: string;
    fromIndex: number;
    toIndex: number;
    status: TransitionStatus;
    reason: TransitionReason;
    messageKey: string;
    side?: TransitionSide;
    operation?: string;
};

type NormalizedExpression = {
    cas: string;
    domainRisk: boolean;
};

type ParsedEquation = {
    left: NormalizedExpression;
    right: NormalizedExpression;
};

type OperationKind = 'add' | 'subtract' | 'multiply' | 'divide';

type ParsedOperation = {
    kind: OperationKind;
    operand: NormalizedExpression;
    source: string;
};

type PrincipalRadicalRatio =
    | {
        kind: 'radical-numerator';
        radicand: NormalizedExpression;
        denominator: NormalizedExpression;
    }
    | {
        kind: 'radical-denominator';
        numerator: NormalizedExpression;
        radicand: NormalizedExpression;
    };

type QuadraticSolutionTarget =
    | {
        kind: 'radical';
        variable: string;
        radicand: NormalizedExpression;
        hasPlusMinus: boolean;
    }
    | {
        kind: 'magnitude';
        variable: string;
        magnitude: NormalizedExpression;
        principalRadicalRatio: PrincipalRadicalRatio | null;
        hasPlusMinus: true;
    };

type CubicSolutionTarget = {
    variable: string;
    radicand: NormalizedExpression;
};

type QuarticSolutionTarget = {
    variable: string;
    radicand: NormalizedExpression;
    hasPlusMinus: boolean;
};

type Proof = boolean | null;

type LinearEquation =
    | { kind: 'identity' }
    | { kind: 'contradiction' }
    | { kind: 'root'; root: string };

const MAX_EXPRESSION_LENGTH = 512;
const MAX_NESTING = 32;
const NUMERIC_CAS = /^[+-]?(?:\d+(?:\.\d+)?|\d+\/\d+)$/u;
const IDENTIFIER = /[A-Za-z][A-Za-z0-9_]*/g;

function resolveAlgebriteRuntime(): AlgebriteRuntime | null {
    try {
        const candidate = (globalThis as typeof globalThis & {
            Algebrite?: Partial<AlgebriteRuntime>;
        }).Algebrite;
        return candidate && typeof candidate.run === 'function'
            ? candidate as AlgebriteRuntime
            : null;
    } catch (_) {
        return null;
    }
}

const TEX_GREEK: Record<string, string> = {
    alpha: 'greek_alpha',
    beta: 'greek_beta',
    gamma: 'greek_gamma',
    delta: 'greek_delta',
    epsilon: 'greek_epsilon',
    theta: 'greek_theta',
    lambda: 'greek_lambda',
    mu: 'greek_mu',
    nu: 'greek_nu',
    pi: 'pi',
    rho: 'greek_rho',
    sigma: 'greek_sigma',
    tau: 'greek_tau',
    phi: 'greek_phi',
    chi: 'greek_chi',
    psi: 'greek_psi',
    omega: 'greek_omega',
    Gamma: 'greek_Gamma',
    Delta: 'greek_Delta',
    Theta: 'greek_Theta',
    Lambda: 'greek_Lambda',
    Sigma: 'greek_Sigma',
    Phi: 'greek_Phi',
    Psi: 'greek_Psi',
    Omega: 'greek_Omega'
};

const TEX_WRAPPERS = new Set(['mathrm', 'mathit', 'mathbf', 'mathsf', 'mathtt']);
const TEX_SPACING = new Set(['quad', 'qquad', 'enspace', 'thinspace', 'medspace', 'thickspace']);

function transition(
    from: string,
    to: string,
    fromIndex: number,
    status: TransitionStatus,
    reason: TransitionReason,
    messageKey: string,
    extra: Pick<TransitionCheck, 'side' | 'operation'> = {}
): TransitionCheck {
    return {
        from,
        to,
        fromIndex,
        toIndex: fromIndex + 1,
        status,
        reason,
        messageKey,
        ...extra
    };
}

function readBalanced(
    source: string,
    start: number,
    open: string,
    close: string
): { content: string; end: number } | null {
    if (source[start] !== open) return null;
    let depth = 1;
    for (let index = start + 1; index < source.length; index++) {
        if (source[index] === open) depth++;
        else if (source[index] === close) {
            depth--;
            if (depth === 0) {
                return { content: source.slice(start + 1, index), end: index + 1 };
            }
        }
    }
    return null;
}

function readScriptAtom(source: string, start: number): { content: string; end: number } | null {
    let index = start;
    while (index < source.length && /\s/u.test(source[index])) index++;
    if (source[index] === '{') return readBalanced(source, index, '{', '}');
    if (source[index] === '(') return readBalanced(source, index, '(', ')');
    if (source[index] === '\\') {
        let end = index + 1;
        while (end < source.length && /[A-Za-z]/u.test(source[end])) end++;
        if (end === index + 1) return null;
        return { content: source.slice(index, end), end };
    }
    if (/[A-Za-z0-9.+-]/u.test(source[index] || '')) {
        return { content: source[index], end: index + 1 };
    }
    return null;
}

function hasSymbol(value: string): boolean {
    return /[A-Za-z]/u.test(value);
}

function hasVariableDenominator(value: string): boolean {
    for (let index = 0; index < value.length; index++) {
        if (value[index] !== '/') continue;
        let cursor = index + 1;
        while (cursor < value.length && /\s/u.test(value[cursor])) cursor++;
        if (value[cursor] === '+' || value[cursor] === '-') cursor++;
        while (cursor < value.length && /\s/u.test(value[cursor])) cursor++;

        if (value[cursor] === '(') {
            const group = readBalanced(value, cursor, '(', ')');
            if (!group || hasSymbol(group.content)) return true;
            continue;
        }
        if (!/[0-9.]/u.test(value[cursor] || '')) return true;
    }
    return false;
}

function variableDenominatorExpressions(value: string): string[] {
    const denominators: string[] = [];
    for (let index = 0; index < value.length; index++) {
        if (value[index] !== '/') continue;
        let cursor = index + 1;
        while (cursor < value.length && /\s/u.test(value[cursor])) cursor++;
        if (value[cursor] === '+' || value[cursor] === '-') cursor++;
        while (cursor < value.length && /\s/u.test(value[cursor])) cursor++;
        if (value[cursor] === '(') {
            const group = readBalanced(value, cursor, '(', ')');
            if (group && hasSymbol(group.content)) denominators.push(group.content);
            continue;
        }
        if (/[A-Za-z]/u.test(value[cursor] || '')) {
            let end = cursor + 1;
            while (end < value.length && /[A-Za-z0-9_]/u.test(value[end])) end++;
            denominators.push(value.slice(cursor, end));
        }
    }
    return denominators;
}

function hasUnresolvedDomainRisk(
    expression: NormalizedExpression,
    options: TransitionValidationOptions
): boolean {
    if (!expression.domainRisk) return false;
    if (/sqrt\s*\(|\^\(\s*-/u.test(expression.cas)) return true;
    const denominators = variableDenominatorExpressions(expression.cas);
    if (!denominators.length) return true;
    const assumptions = new Set(options.nonZeroSymbols || []);
    return denominators.some(denominator =>
        !/^[A-Za-z][A-Za-z0-9_]*$/u.test(denominator) ||
        !assumptions.has(denominator)
    );
}

function makeImplicitMultiplicationExplicit(value: string): string {
    let result = value;
    result = result.replace(/\b([A-Za-z][A-Za-z0-9_]*)\s*\(/gu, (_all, name: string) =>
        name === 'sqrt' ? 'sqrt(' : name + '*('
    );
    result = result.replace(/(\d|\))\s*\(/gu, '$1*(');
    result = result.replace(/\)\s*(?=[A-Za-z0-9_])/gu, ')*');
    return result;
}

function normalizeSubscript(value: string): string | null {
    const source = String(value || '').replace(/\s/gu, '');
    if (/^[A-Za-z0-9]+$/u.test(source)) return source;
    const command = /^\\([A-Za-z]+)$/u.exec(source);
    if (!command) return null;
    const greek = TEX_GREEK[command[1]];
    return greek ? greek.replace(/^greek_/u, '') : null;
}

function convertTexFragment(source: string, nesting = 0): NormalizedExpression | null {
    if (nesting > MAX_NESTING || source.length > MAX_EXPRESSION_LENGTH) return null;
    let output = '';
    let domainRisk = false;

    for (let index = 0; index < source.length;) {
        const character = source[index];
        if (/\s/u.test(character) || character === '\u200b') {
            index++;
            continue;
        }
        if (character === '{') {
            const group = readBalanced(source, index, '{', '}');
            if (!group) return null;
            const converted = convertTexFragment(group.content, nesting + 1);
            if (!converted) return null;
            output += '(' + converted.cas + ')';
            domainRisk ||= converted.domainRisk;
            index = group.end;
            continue;
        }
        if (character === '(' || character === '[') {
            const close = character === '(' ? ')' : ']';
            const group = readBalanced(source, index, character, close);
            if (!group) return null;
            const converted = convertTexFragment(group.content, nesting + 1);
            if (!converted) return null;
            output += '(' + converted.cas + ')';
            domainRisk ||= converted.domainRisk;
            index = group.end;
            continue;
        }
        if (character === '}' || character === ')' || character === ']') return null;

        if (character === '\\') {
            const next = source[index + 1] || '';
            if (!/[A-Za-z]/u.test(next)) {
                if (next === ',' || next === ';' || next === '!' || /\s/u.test(next)) {
                    index += 2;
                    continue;
                }
                return null;
            }
            let end = index + 2;
            while (end < source.length && /[A-Za-z]/u.test(source[end])) end++;
            const command = source.slice(index + 1, end);

            if (TEX_SPACING.has(command) || command === 'left' || command === 'right') {
                index = end;
                continue;
            }
            if (command === 'cdot' || command === 'times') {
                output += '*';
                index = end;
                continue;
            }
            if (command === 'div') {
                output += '/';
                index = end;
                continue;
            }
            if (command === 'prime') {
                output += '_prime';
                index = end;
                continue;
            }
            if (command === 'frac' || command === 'dfrac' || command === 'tfrac') {
                const numerator = readScriptAtom(source, end);
                if (!numerator) return null;
                let denominatorStart = numerator.end;
                while (denominatorStart < source.length && /\s/u.test(source[denominatorStart])) {
                    denominatorStart++;
                }
                if (source[denominatorStart] !== '{') return null;
                const denominator = readBalanced(source, denominatorStart, '{', '}');
                if (!denominator) return null;
                const convertedNumerator = convertTexFragment(numerator.content, nesting + 1);
                const convertedDenominator = convertTexFragment(denominator.content, nesting + 1);
                if (!convertedNumerator || !convertedDenominator) return null;
                output += '((' + convertedNumerator.cas + ')/(' + convertedDenominator.cas + '))';
                domainRisk ||= convertedNumerator.domainRisk ||
                    convertedDenominator.domainRisk ||
                    hasSymbol(convertedDenominator.cas);
                index = denominator.end;
                continue;
            }
            if (command === 'sqrt') {
                const radicand = readScriptAtom(source, end);
                if (!radicand) return null;
                const converted = convertTexFragment(radicand.content, nesting + 1);
                if (!converted) return null;
                output += 'sqrt(' + converted.cas + ')';
                domainRisk = true;
                index = radicand.end;
                continue;
            }
            if (TEX_WRAPPERS.has(command)) {
                const wrapped = readScriptAtom(source, end);
                if (!wrapped) return null;
                const converted = convertTexFragment(wrapped.content, nesting + 1);
                if (!converted) return null;
                output += converted.cas;
                domainRisk ||= converted.domainRisk;
                index = wrapped.end;
                continue;
            }
            const greek = TEX_GREEK[command];
            if (greek) {
                output += greek;
                index = end;
                continue;
            }
            return null;
        }

        if (character === '_') {
            const subscript = readScriptAtom(source, index + 1);
            if (!subscript) return null;
            const normalized = normalizeSubscript(subscript.content);
            if (!normalized) return null;
            output += '_' + normalized;
            index = subscript.end;
            continue;
        }
        if (character === '^') {
            const exponent = readScriptAtom(source, index + 1);
            if (!exponent) return null;
            const converted = convertTexFragment(exponent.content, nesting + 1);
            if (!converted) return null;
            output += '^(' + converted.cas + ')';
            domainRisk ||= converted.domainRisk || /^\s*-/u.test(converted.cas);
            index = exponent.end;
            continue;
        }
        if (character === "'") {
            output += '_prime';
            index++;
            continue;
        }
        if (character === ',') {
            const previous = source[index - 1] || '';
            const following = source[index + 1] || '';
            if (!/\d/u.test(previous) || !/\d/u.test(following)) return null;
            output += '.';
            index++;
            continue;
        }
        if (/[0-9.]/u.test(character)) {
            let end = index + 1;
            while (end < source.length && /[0-9.]/u.test(source[end])) end++;
            const number = source.slice(index, end);
            if (!/^\d+(?:\.\d+)?$/u.test(number) || number.length > 24) return null;
            output += number;
            index = end;
            continue;
        }
        if (/[A-Za-z]/u.test(character)) {
            let end = index + 1;
            while (end < source.length && /[A-Za-z0-9]/u.test(source[end])) end++;
            if (/[A-Za-z0-9_]$/u.test(output)) output += '*';
            output += Array.from(source.slice(index, end)).join('*');
            index = end;
            continue;
        }
        if ('+-*/'.includes(character)) {
            output += character;
            index++;
            continue;
        }
        if (character === '\u2212') {
            output += '-';
            index++;
            continue;
        }
        if (character === '\u00d7' || character === '\u00b7') {
            output += '*';
            index++;
            continue;
        }
        if (character === '\u00f7' || character === ':') {
            output += '/';
            index++;
            continue;
        }
        return null;
    }

    if (!output || !/^[A-Za-z0-9_+\-*/^().]+$/u.test(output)) return null;
    const cas = makeImplicitMultiplicationExplicit(output);
    return {
        cas,
        domainRisk: domainRisk || hasVariableDenominator(cas)
    };
}

function stripMathDelimiters(value: string): string {
    let source = String(value || '').trim();
    if (source.startsWith('$$') && source.endsWith('$$') && source.length >= 4) {
        source = source.slice(2, -2).trim();
    } else if (source.startsWith('$') && source.endsWith('$') && source.length >= 2) {
        source = source.slice(1, -1).trim();
    }
    return source;
}

function findOperationSeparator(source: string): { start: number; end: number } | null {
    let curly = 0;
    let round = 0;
    let square = 0;
    for (let index = 0; index < source.length;) {
        const character = source[index];
        if (character === '{') curly++;
        else if (character === '}') curly--;
        else if (character === '(') round++;
        else if (character === ')') round--;
        else if (character === '[') square++;
        else if (character === ']') square--;
        else if (character === '\\') {
            let end = index + 1;
            while (end < source.length && /[A-Za-z]/u.test(source[end])) end++;
            if (source.slice(index + 1, end) === 'mid' && curly === 0 && round === 0 && square === 0) {
                return { start: index, end };
            }
            index = Math.max(end, index + 2);
            continue;
        } else if (character === '|' && curly === 0 && round === 0 && square === 0) {
            const suffix = source.slice(index + 1).trim();
            if (/^(?:[+\-:/*]|\\(?:cdot|times|div)\b)/u.test(suffix)) {
                return { start: index, end: index + 1 };
            }
        }
        if (curly < 0 || round < 0 || square < 0) return null;
        index++;
    }
    return null;
}

function splitLine(value: string): { equation: string; operation: string | null } {
    const source = stripMathDelimiters(value);
    const separator = findOperationSeparator(source);
    if (!separator) return { equation: source, operation: null };
    return {
        equation: source.slice(0, separator.start).trim(),
        operation: source.slice(separator.end).trim()
    };
}

/**
 * Returns the equation part of a calculation row without a trailing side
 * operation such as `\\mid +5` or `| :3`.
 */
export function extractCalculationEquation(value: string): string {
    return splitLine(value).equation;
}

function stripLeadingImplication(value: string): string {
    let source = stripMathDelimiters(value);
    for (;;) {
        // Formula OCR may render the learner's leading continuation marker as
        // a plain right arrow. Strip only a complete token at the beginning
        // of this quadratic-solution target; arrows inside expressions remain
        // part of the mathematics and therefore unsupported here.
        const match = /^(?:⇒|⟹|→|⟶|=>|->|\\(?:Rarr|to|rightarrow|longrightarrow|Rightarrow|Longrightarrow|implies)\b)\s*/u.exec(source);
        if (!match) return source;
        source = source.slice(match[0].length).trim();
    }
}

function findSingleTopLevelEquality(source: string): number | null {
    let curly = 0;
    let round = 0;
    let square = 0;
    let equality = -1;
    for (let index = 0; index < source.length; index++) {
        const character = source[index];
        if (character === '\\') {
            index++;
            while (index + 1 < source.length && /[A-Za-z]/u.test(source[index + 1])) index++;
            continue;
        }
        if (character === '{') curly++;
        else if (character === '}') curly--;
        else if (character === '(') round++;
        else if (character === ')') round--;
        else if (character === '[') square++;
        else if (character === ']') square--;
        else if (character === '=' && curly === 0 && round === 0 && square === 0) {
            if (equality >= 0) return null;
            equality = index;
        }
        if (curly < 0 || round < 0 || square < 0) return null;
    }
    return curly === 0 && round === 0 && square === 0 && equality >= 0
        ? equality
        : null;
}

function hasAmbiguousInlineDivideNotation(value: string): boolean {
    const source = stripMathDelimiters(value);
    const equality = findSingleTopLevelEquality(source);
    if (equality === null) return false;
    let curly = 0;
    let round = 0;
    let square = 0;
    for (let index = equality + 1; index < source.length;) {
        const character = source[index];
        if (character === '\\') {
            let end = index + 1;
            while (end < source.length && /[A-Za-z]/u.test(source[end])) end++;
            const command = source.slice(index + 1, end);
            if (curly === 0 && round === 0 && square === 0 &&
                command === 'div' && source.slice(end).trim()) return true;
            index = Math.max(end, index + 2);
            continue;
        }
        if (character === '{') curly++;
        else if (character === '}') curly--;
        else if (character === '(') round++;
        else if (character === ')') round--;
        else if (character === '[') square++;
        else if (character === ']') square--;
        else if (curly === 0 && round === 0 && square === 0 &&
            (character === ':' || character === '\u00f7') &&
            source.slice(index + 1).trim()) return true;
        if (curly < 0 || round < 0 || square < 0) return false;
        index++;
    }
    return false;
}

function parsePrincipalRadicalRatio(
    value: string
): PrincipalRadicalRatio | null {
    const source = String(value || '').trim();
    if (!source.startsWith('\\frac')) return null;
    let cursor = '\\frac'.length;
    while (cursor < source.length && /\s/u.test(source[cursor])) cursor++;
    const numerator = readBalanced(source, cursor, '{', '}');
    if (!numerator) return null;
    cursor = numerator.end;
    while (cursor < source.length && /\s/u.test(source[cursor])) cursor++;
    const denominator = readBalanced(source, cursor, '{', '}');
    if (!denominator || source.slice(denominator.end).trim()) return null;

    const parseCompleteSquareRoot = (
        sourceValue: string
    ): NormalizedExpression | null => {
        const rootSource = sourceValue.trim();
        if (!rootSource.startsWith('\\sqrt')) return null;
        let rootCursor = '\\sqrt'.length;
        while (rootCursor < rootSource.length && /\s/u.test(rootSource[rootCursor])) {
            rootCursor++;
        }
        const root = readBalanced(rootSource, rootCursor, '{', '}');
        if (!root || rootSource.slice(root.end).trim()) return null;
        return convertTexFragment(root.content);
    };

    const radicalNumerator = parseCompleteSquareRoot(numerator.content);
    if (radicalNumerator) {
        const convertedDenominator = convertTexFragment(denominator.content);
        return convertedDenominator
            ? {
                kind: 'radical-numerator',
                radicand: radicalNumerator,
                denominator: convertedDenominator
            }
            : null;
    }

    const radicalDenominator = parseCompleteSquareRoot(denominator.content);
    if (!radicalDenominator) return null;
    const convertedNumerator = convertTexFragment(numerator.content);
    return convertedNumerator
        ? {
            kind: 'radical-denominator',
            numerator: convertedNumerator,
            radicand: radicalDenominator
        }
        : null;
}

function parseQuadraticSolutionTarget(
    value: string,
    allowMissingPlusMinus = false
): QuadraticSolutionTarget | null {
    const source = stripLeadingImplication(value).replace(/&/gu, '').trim();
    const equality = findSingleTopLevelEquality(source);
    if (equality === null) return null;
    const left = source.slice(0, equality).replace(/\s/gu, '');
    // Formula OCR can confuse the comma in the conventional solution index
    // x_{1,2} with a slash. Keep that alias local to this CAS-proven
    // quadratic-root target; it must never become a general subscript rewrite.
    const variable = /^([A-Za-z])_\{(1,2|12|1\/2)\}$/u.exec(left);
    if (!variable) return null;
    const slashIndexAlias = variable[2] === '1/2';

    let right = source.slice(equality + 1).trim();
    let hasPlusMinus = false;
    if (right.startsWith('±')) {
        right = right.slice(1).trim();
        hasPlusMinus = true;
    } else if (/^\\pm(?![A-Za-z])/u.test(right)) {
        right = right.slice('\\pm'.length).trim();
        hasPlusMinus = true;
    } else if (slashIndexAlias || !allowMissingPlusMinus) {
        return null;
    }
    if (right.startsWith('\\sqrt')) {
        let cursor = '\\sqrt'.length;
        while (cursor < right.length && /\s/u.test(right[cursor])) cursor++;
        let radicandSource = '';
        if (right[cursor] === '{') {
            const radicand = readBalanced(right, cursor, '{', '}');
            if (!radicand || right.slice(radicand.end).trim()) return null;
            radicandSource = radicand.content;
        } else {
            // TeX permits an unbraced single-token radicand. Keep this OCR
            // tolerance deliberately narrow: one decimal digit and nothing
            // else. Multi-token or symbolic roots still require braces.
            const atom = /^([0-9])\s*$/u.exec(right.slice(cursor));
            if (!atom) return null;
            radicandSource = atom[1];
        }
        const converted = convertTexFragment(radicandSource);
        return converted
            ? {
                kind: 'radical',
                variable: variable[1],
                radicand: converted,
                hasPlusMinus
            }
            : null;
    }
    if (!hasPlusMinus) return null;
    const principalRadicalRatio = parsePrincipalRadicalRatio(right);
    const magnitude = convertTexFragment(right);
    return magnitude
        ? {
            kind: 'magnitude',
            variable: variable[1],
            magnitude,
            principalRadicalRatio,
            hasPlusMinus: true
        }
        : null;
}

function parseCubicSolutionTarget(value: string): CubicSolutionTarget | null {
    const source = stripLeadingImplication(value).replace(/&/gu, '').trim();
    const equality = findSingleTopLevelEquality(source);
    if (equality === null) return null;

    const left = source.slice(0, equality).replace(/\s/gu, '');
    const variable = /^([A-Za-z])$/u.exec(left);
    if (!variable) return null;

    const right = source.slice(equality + 1).trim();
    if (!right.startsWith('\\sqrt')) return null;
    let cursor = '\\sqrt'.length;
    while (cursor < right.length && /\s/u.test(right[cursor])) cursor++;

    const rootIndex = readBalanced(right, cursor, '[', ']');
    if (!rootIndex || rootIndex.content.replace(/\s/gu, '') !== '3') return null;
    cursor = rootIndex.end;
    while (cursor < right.length && /\s/u.test(right[cursor])) cursor++;

    const radicand = readBalanced(right, cursor, '{', '}');
    if (!radicand || right.slice(radicand.end).trim()) return null;
    const converted = convertTexFragment(radicand.content);
    return converted
        ? { variable: variable[1], radicand: converted }
        : null;
}

function parseQuarticSolutionTarget(value: string): QuarticSolutionTarget | null {
    const source = stripLeadingImplication(value).replace(/&/gu, '').trim();
    const equality = findSingleTopLevelEquality(source);
    if (equality === null) return null;

    const left = source.slice(0, equality).replace(/\s/gu, '');
    const variable = /^([A-Za-z])_\{1,2\}$/u.exec(left);
    if (!variable) return null;

    let right = source.slice(equality + 1).trim();
    let hasPlusMinus = false;
    if (right.startsWith('\u00b1')) {
        right = right.slice(1).trim();
        hasPlusMinus = true;
    } else if (/^\\pm(?![A-Za-z])/u.test(right)) {
        right = right.slice('\\pm'.length).trim();
        hasPlusMinus = true;
    }

    if (!right.startsWith('\\sqrt')) return null;
    let cursor = '\\sqrt'.length;
    while (cursor < right.length && /\s/u.test(right[cursor])) cursor++;

    const rootIndex = readBalanced(right, cursor, '[', ']');
    if (!rootIndex || rootIndex.content.replace(/\s/gu, '') !== '4') return null;
    cursor = rootIndex.end;
    while (cursor < right.length && /\s/u.test(right[cursor])) cursor++;

    const radicand = readBalanced(right, cursor, '{', '}');
    if (!radicand || right.slice(radicand.end).trim()) return null;
    const converted = convertTexFragment(radicand.content);
    return converted
        ? {
            variable: variable[1],
            radicand: converted,
            hasPlusMinus
        }
        : null;
}

function parseEquation(value: string): ParsedEquation | null {
    const source = splitLine(value).equation.replace(/&/gu, '').trim();
    if (!source || source.length > MAX_EXPRESSION_LENGTH * 2) return null;
    let curly = 0;
    let round = 0;
    let square = 0;
    const equalities: number[] = [];

    for (let index = 0; index < source.length; index++) {
        const character = source[index];
        if (character === '\\') {
            index++;
            while (index + 1 < source.length && /[A-Za-z]/u.test(source[index + 1])) index++;
            continue;
        }
        if (character === '{') curly++;
        else if (character === '}') curly--;
        else if (character === '(') round++;
        else if (character === ')') round--;
        else if (character === '[') square++;
        else if (character === ']') square--;
        else if (character === '=' && curly === 0 && round === 0 && square === 0) {
            equalities.push(index);
        }
        if (curly < 0 || round < 0 || square < 0) return null;
    }
    if (curly !== 0 || round !== 0 || square !== 0 || equalities.length !== 1) return null;

    const equality = equalities[0];
    const left = convertTexFragment(source.slice(0, equality));
    const right = convertTexFragment(source.slice(equality + 1));
    return left && right ? { left, right } : null;
}

function parseOperation(source: string | null): ParsedOperation | null {
    if (!source) return null;
    const trimmed = source.trim();
    let kind: OperationKind;
    let operandSource: string;

    if (trimmed.startsWith('\\cdot')) {
        kind = 'multiply';
        operandSource = trimmed.slice('\\cdot'.length);
    } else if (trimmed.startsWith('\\times')) {
        kind = 'multiply';
        operandSource = trimmed.slice('\\times'.length);
    } else if (trimmed.startsWith('\\div')) {
        kind = 'divide';
        operandSource = trimmed.slice('\\div'.length);
    } else {
        const marker = trimmed[0];
        if (marker === '+') kind = 'add';
        else if (marker === '-') kind = 'subtract';
        else if (marker === '*' || marker === '\u00d7' || marker === '\u00b7') kind = 'multiply';
        else if (marker === '/' || marker === ':' || marker === '\u00f7') kind = 'divide';
        else return null;
        operandSource = trimmed.slice(1);
    }

    const operand = convertTexFragment(operandSource.trim());
    return operand ? { kind, operand, source: trimmed } : null;
}

function casRun(source: string, runtime: AlgebriteRuntime): string | null {
    if (!source || source.length > MAX_EXPRESSION_LENGTH * 8) return null;
    try {
        const output = String(runtime.run(source) ?? '').trim();
        if (!output || /^Stop:/u.test(output)) return null;
        return output;
    } catch (_) {
        return null;
    }
}

function proveExpressionIdentity(
    left: string,
    right: string,
    runtime: AlgebriteRuntime
): Proof {
    const result = casRun(
        'simplify(rationalize((' + left + ')-(' + right + ')))',
        runtime
    );
    if (result === null) return null;
    return isZeroCas(result);
}

function isNumericCas(value: string): boolean {
    return NUMERIC_CAS.test(value);
}

function isZeroCas(value: string): boolean {
    return /^[+-]?0+(?:\.0+)?$/u.test(value);
}

function numericCasValue(value: string): number | null {
    if (!isNumericCas(value)) return null;
    const parts = value.split('/');
    const numerator = Number(parts[0]);
    const denominator = parts.length > 1 ? Number(parts[1]) : 1;
    if (!isFinite(numerator) || !isFinite(denominator) || denominator === 0) return null;
    return numerator / denominator;
}

function isSafeReversibleOperation(
    operation: ParsedOperation,
    options: TransitionValidationOptions,
    runtime: AlgebriteRuntime
): boolean {
    if (hasUnresolvedDomainRisk(operation.operand, options)) return false;
    if (operation.kind === 'add' || operation.kind === 'subtract') return true;
    const operand = casRun('simplify(' + operation.operand.cas + ')', runtime);
    if (operand === null) return false;
    if (isNumericCas(operand)) return !isZeroCas(operand);
    if (!/^[A-Za-z][A-Za-z0-9_]*$/u.test(operand)) return false;
    return (options.nonZeroSymbols || []).some(symbol => symbol === operand);
}

function applyOperation(expression: string, operation: ParsedOperation): string {
    const operand = operation.operand.cas;
    if (operation.kind === 'add') return '((' + expression + ')+(' + operand + '))';
    if (operation.kind === 'subtract') return '((' + expression + ')-(' + operand + '))';
    if (operation.kind === 'multiply') return '((' + expression + ')*(' + operand + '))';
    return '((' + expression + ')/(' + operand + '))';
}

function variablesIn(expressions: readonly string[]): string[] {
    const variables = new Set<string>();
    for (const expression of expressions) {
        const identifiers = expression.match(IDENTIFIER) || [];
        for (const identifier of identifiers) {
            if (identifier === 'sqrt' || identifier === 'pi' || identifier === 'e') continue;
            if (identifier.includes('_') || identifier.length === 1) {
                variables.add(identifier);
            } else {
                for (const character of identifier) variables.add(character);
            }
        }
    }
    return Array.from(variables).sort();
}

function proveQuadraticSolutionStep(
    from: ParsedEquation,
    target: QuadraticSolutionTarget,
    runtime: AlgebriteRuntime
): Proof {
    const targetExpression = target.kind === 'radical'
        ? target.radicand
        : target.magnitude;
    const unsafeTargetDomain = targetExpression.domainRisk &&
        (target.kind === 'radical' || target.principalRadicalRatio === null);
    if (from.left.domainRisk || from.right.domainRisk || unsafeTargetDomain) return null;
    const variables = variablesIn([from.left.cas, from.right.cas]);
    if (variables.length !== 1 || !/^[A-Za-z]$/u.test(variables[0])) return null;
    const variable = variables[0];
    if (target.variable !== variable) return null;
    const square = variable + '^2';
    const leftIsSquare = proveExpressionIdentity(from.left.cas, square, runtime);
    const rightIsSquare = proveExpressionIdentity(from.right.cas, square, runtime);
    if (leftIsSquare === rightIsSquare || (leftIsSquare !== true && rightIsSquare !== true)) {
        return null;
    }
    const radicand = leftIsSquare === true ? from.right : from.left;
    if (variablesIn([radicand.cas]).length) return null;
    const simplified = casRun(
        'simplify(rationalize(' + radicand.cas + '))',
        runtime
    );
    const numeric = simplified === null ? null : numericCasValue(simplified);
    if (numeric === null || numeric < 0) return null;
    if (target.kind === 'radical') {
        return proveExpressionIdentity(radicand.cas, target.radicand.cas, runtime);
    }
    if (variablesIn([target.magnitude.cas]).length) return null;
    if (target.principalRadicalRatio) {
        const evidence = target.principalRadicalRatio;
        if (evidence.kind === 'radical-numerator') {
            if (evidence.radicand.domainRisk || evidence.denominator.domainRisk ||
                variablesIn([
                    evidence.radicand.cas,
                    evidence.denominator.cas
                ]).length) return null;
            const simplifiedRootInput = casRun(
                'simplify(rationalize(' + evidence.radicand.cas + '))',
                runtime
            );
            const rootInput = simplifiedRootInput === null
                ? null
                : numericCasValue(simplifiedRootInput);
            const simplifiedDenominator = casRun(
                'simplify(rationalize(' + evidence.denominator.cas + '))',
                runtime
            );
            const denominator = simplifiedDenominator === null
                ? null
                : numericCasValue(simplifiedDenominator);
            if (rootInput === null || rootInput < 0 ||
                denominator === null || denominator <= 0) return null;
        } else {
            if (evidence.numerator.domainRisk || evidence.radicand.domainRisk ||
                variablesIn([
                    evidence.numerator.cas,
                    evidence.radicand.cas
                ]).length) return null;
            const simplifiedNumerator = casRun(
                'simplify(rationalize(' + evidence.numerator.cas + '))',
                runtime
            );
            const numerator = simplifiedNumerator === null
                ? null
                : numericCasValue(simplifiedNumerator);
            const simplifiedRootInput = casRun(
                'simplify(rationalize(' + evidence.radicand.cas + '))',
                runtime
            );
            const rootInput = simplifiedRootInput === null
                ? null
                : numericCasValue(simplifiedRootInput);
            if (numerator === null || numerator < 0 ||
                rootInput === null || rootInput <= 0) return null;
        }
    } else {
        const simplifiedMagnitude = casRun(
            'simplify(rationalize(' + target.magnitude.cas + '))',
            runtime
        );
        const magnitude = simplifiedMagnitude === null
            ? null
            : numericCasValue(simplifiedMagnitude);
        if (magnitude === null || magnitude < 0) return null;
    }
    return proveExpressionIdentity(
        radicand.cas,
        '((' + target.magnitude.cas + ')^2)',
        runtime
    );
}

function proveCubicSolutionStep(
    from: ParsedEquation,
    target: CubicSolutionTarget,
    runtime: AlgebriteRuntime
): Proof {
    if (from.left.domainRisk || from.right.domainRisk || target.radicand.domainRisk) {
        return null;
    }
    const variables = variablesIn([from.left.cas, from.right.cas]);
    if (variables.length !== 1 || !/^[A-Za-z]$/u.test(variables[0])) return null;
    const variable = variables[0];
    if (target.variable !== variable) return null;

    const cube = variable + '^3';
    const leftIsCube = proveExpressionIdentity(from.left.cas, cube, runtime);
    const rightIsCube = proveExpressionIdentity(from.right.cas, cube, runtime);
    if (leftIsCube === rightIsCube || (leftIsCube !== true && rightIsCube !== true)) {
        return null;
    }

    const radicand = leftIsCube === true ? from.right : from.left;
    if (variablesIn([radicand.cas, target.radicand.cas]).length) return null;
    const simplified = casRun(
        'simplify(rationalize(' + radicand.cas + '))',
        runtime
    );
    if (simplified === null || numericCasValue(simplified) === null) return null;
    return proveExpressionIdentity(radicand.cas, target.radicand.cas, runtime);
}

function proveQuarticSolutionStep(
    from: ParsedEquation,
    target: QuarticSolutionTarget,
    runtime: AlgebriteRuntime
): Proof {
    if (from.left.domainRisk || from.right.domainRisk || target.radicand.domainRisk) {
        return null;
    }
    const variables = variablesIn([from.left.cas, from.right.cas]);
    if (variables.length !== 1 || !/^[A-Za-z]$/u.test(variables[0])) return null;
    const variable = variables[0];
    if (target.variable !== variable) return null;

    const fourthPower = variable + '^4';
    const leftIsFourthPower = proveExpressionIdentity(
        from.left.cas,
        fourthPower,
        runtime
    );
    const rightIsFourthPower = proveExpressionIdentity(
        from.right.cas,
        fourthPower,
        runtime
    );
    if (leftIsFourthPower === rightIsFourthPower ||
        (leftIsFourthPower !== true && rightIsFourthPower !== true)) {
        return null;
    }

    const radicand = leftIsFourthPower === true ? from.right : from.left;
    if (variablesIn([radicand.cas, target.radicand.cas]).length) return null;
    const simplified = casRun(
        'simplify(rationalize(' + radicand.cas + '))',
        runtime
    );
    const numeric = simplified === null ? null : numericCasValue(simplified);
    if (numeric === null || numeric < 0) return null;
    return proveExpressionIdentity(radicand.cas, target.radicand.cas, runtime);
}

function analyzeLinearEquation(
    equation: ParsedEquation,
    variable: string | null,
    runtime: AlgebriteRuntime
): LinearEquation | null {
    const difference = '((' + equation.left.cas + ')-(' + equation.right.cas + '))';
    if (!variable) {
        const constant = casRun('simplify(rationalize(' + difference + '))', runtime);
        if (constant === null || !isNumericCas(constant)) return null;
        return isZeroCas(constant) ? { kind: 'identity' } : { kind: 'contradiction' };
    }

    const expanded = casRun('expand(' + difference + ')', runtime);
    if (expanded === null) return null;
    const coefficient = casRun(
        'simplify(coeff(' + expanded + ',' + variable + ',1))',
        runtime
    );
    const constant = casRun(
        'simplify(coeff(' + expanded + ',' + variable + ',0))',
        runtime
    );
    if (coefficient === null || constant === null ||
        !isNumericCas(coefficient) || !isNumericCas(constant)) return null;
    const remainder = casRun(
        'simplify(rationalize((' + expanded + ')-((' + coefficient + ')*' +
        variable + '+(' + constant + '))))',
        runtime
    );
    if (remainder === null || !isZeroCas(remainder)) return null;
    if (isZeroCas(coefficient)) {
        return isZeroCas(constant) ? { kind: 'identity' } : { kind: 'contradiction' };
    }
    const root = casRun(
        'simplify(-(' + constant + ')/(' + coefficient + '))',
        runtime
    );
    return root === null || !isNumericCas(root) ? null : { kind: 'root', root };
}

function compareLinearEquations(
    from: ParsedEquation,
    to: ParsedEquation,
    runtime: AlgebriteRuntime
): Proof {
    if (from.left.domainRisk || from.right.domainRisk ||
        to.left.domainRisk || to.right.domainRisk) return null;
    const variables = variablesIn([
        from.left.cas,
        from.right.cas,
        to.left.cas,
        to.right.cas
    ]);
    if (variables.length > 1) return null;
    const variable = variables[0] || null;
    const first = analyzeLinearEquation(from, variable, runtime);
    const second = analyzeLinearEquation(to, variable, runtime);
    if (!first || !second) return null;
    if (first.kind !== second.kind) return false;
    if (first.kind !== 'root' || second.kind !== 'root') return true;
    return proveExpressionIdentity(first.root, second.root, runtime);
}

/**
 * Validates one handwritten calculation step without touching the DOM.
 *
 * A trailing \\mid operation is checked side-by-side first. If that is not
 * conclusive, the function falls back to exact one-variable linear equations.
 * Unsupported syntax and domain assumptions are never reported as wrong.
 */
export function validateEquationTransition(
    from: string,
    to: string,
    fromIndex = 0,
    options: TransitionValidationOptions = {}
): TransitionCheck {
    const fromSource = String(from || '').trim();
    const toSource = String(to || '').trim();
    const fromLine = splitLine(fromSource);
    const fromEquation = parseEquation(fromLine.equation);
    if (!fromLine.operation && hasAmbiguousInlineDivideNotation(fromSource)) {
        return transition(
            fromSource,
            toSource,
            fromIndex,
            'unknown',
            'unsupported-or-unproven',
            'ocr.plus.validation.unknown'
        );
    }
    const toEquation = parseEquation(toSource);
    const quadraticTarget = fromEquation
        ? parseQuadraticSolutionTarget(toSource, true)
        : null;
    const cubicTarget = fromEquation && !fromLine.operation
        ? parseCubicSolutionTarget(toSource)
        : null;
    const quarticTarget = fromEquation && !fromLine.operation
        ? parseQuarticSolutionTarget(toSource)
        : null;

    if (!fromEquation ||
        (!toEquation && !quadraticTarget && !cubicTarget && !quarticTarget)) {
        return transition(
            fromSource,
            toSource,
            fromIndex,
            'unknown',
            'unsupported-or-unproven',
            'ocr.plus.validation.unknown'
        );
    }

    const runtime = resolveAlgebriteRuntime();
    if (!runtime) {
        return transition(
            fromSource,
            toSource,
            fromIndex,
            'unknown',
            'cas-unavailable',
            'ocr.plus.validation.casUnavailable'
        );
    }

    const operation = parseOperation(fromLine.operation);
    if (options.strictDeclaredOperations && fromLine.operation && !operation) {
        return transition(
            fromSource,
            toSource,
            fromIndex,
            'unknown',
            'unsupported-or-unproven',
            'ocr.plus.validation.unknown',
            { operation: fromLine.operation }
        );
    }
    if (options.strictDeclaredOperations && fromLine.operation &&
        (quadraticTarget || cubicTarget || quarticTarget)) {
        return transition(
            fromSource,
            toSource,
            fromIndex,
            'unknown',
            'unsupported-or-unproven',
            'ocr.plus.validation.unknown',
            { operation: fromLine.operation }
        );
    }

    if (quadraticTarget) {
        const quadraticProof = proveQuadraticSolutionStep(
            fromEquation,
            quadraticTarget,
            runtime
        );
        if (quadraticProof === true && quadraticTarget.hasPlusMinus) {
            return transition(
                fromSource,
                toSource,
                fromIndex,
                'valid',
                'quadratic-root-solutions',
                'ocr.plus.validation.validRoots'
            );
        }
        if (quadraticProof === true) {
            return transition(
                fromSource,
                toSource,
                fromIndex,
                'unknown',
                'missing-plus-minus',
                'ocr.plus.validation.missingPlusMinus'
            );
        }
        return transition(
            fromSource,
            toSource,
            fromIndex,
            'unknown',
            'unsupported-or-unproven',
            'ocr.plus.validation.unknown'
        );
    }

    if (cubicTarget) {
        const cubicProof = proveCubicSolutionStep(
            fromEquation,
            cubicTarget,
            runtime
        );
        if (cubicProof === true) {
            return transition(
                fromSource,
                toSource,
                fromIndex,
                'valid',
                'cubic-root-solution',
                'ocr.plus.validation.validCubeRoot'
            );
        }
        return transition(
            fromSource,
            toSource,
            fromIndex,
            'unknown',
            'unsupported-or-unproven',
            'ocr.plus.validation.unknown'
        );
    }

    if (quarticTarget) {
        const quarticProof = proveQuarticSolutionStep(
            fromEquation,
            quarticTarget,
            runtime
        );
        if (quarticProof === true && quarticTarget.hasPlusMinus) {
            return transition(
                fromSource,
                toSource,
                fromIndex,
                'valid',
                'quartic-root-solutions',
                'ocr.plus.validation.validFourthRoot'
            );
        }
        if (quarticProof === true) {
            return transition(
                fromSource,
                toSource,
                fromIndex,
                'unknown',
                'missing-plus-minus',
                'ocr.plus.validation.missingPlusMinus'
            );
        }
        return transition(
            fromSource,
            toSource,
            fromIndex,
            'unknown',
            'unsupported-or-unproven',
            'ocr.plus.validation.unknown'
        );
    }

    if (!toEquation) {
        return transition(
            fromSource,
            toSource,
            fromIndex,
            'unknown',
            'unsupported-or-unproven',
            'ocr.plus.validation.unknown'
        );
    }

    if (operation) {
        const domainRisk = hasUnresolvedDomainRisk(fromEquation.left, options) ||
            hasUnresolvedDomainRisk(fromEquation.right, options) ||
            hasUnresolvedDomainRisk(toEquation.left, options) ||
            hasUnresolvedDomainRisk(toEquation.right, options) ||
            !isSafeReversibleOperation(operation, options, runtime);
        if (domainRisk) {
            return transition(
                fromSource,
                toSource,
                fromIndex,
                'unknown',
                'domain-uncertain',
                'ocr.plus.validation.unknownDomain',
                { operation: operation.source }
            );
        }

        const left = proveExpressionIdentity(
            applyOperation(fromEquation.left.cas, operation),
            toEquation.left.cas,
            runtime
        );
        const right = proveExpressionIdentity(
            applyOperation(fromEquation.right.cas, operation),
            toEquation.right.cas,
            runtime
        );
        if (left === true && right === true) {
            return transition(
                fromSource,
                toSource,
                fromIndex,
                'valid',
                'operation-applied-both-sides',
                'ocr.plus.validation.validOperation',
                { operation: operation.source }
            );
        }
        if (left === false && right === true) {
            return transition(
                fromSource,
                toSource,
                fromIndex,
                'invalid',
                'operation-missing-left',
                'ocr.plus.validation.invalidLeft',
                { side: 'left', operation: operation.source }
            );
        }
        if (left === true && right === false) {
            return transition(
                fromSource,
                toSource,
                fromIndex,
                'invalid',
                'operation-missing-right',
                'ocr.plus.validation.invalidRight',
                { side: 'right', operation: operation.source }
            );
        }

        if (options.strictDeclaredOperations) {
            if (left === false && right === false) {
                return transition(
                    fromSource,
                    toSource,
                    fromIndex,
                    'invalid',
                    'operation-mismatch-both',
                    'ocr.plus.validation.invalidBoth',
                    { side: 'both', operation: operation.source }
                );
            }
            return transition(
                fromSource,
                toSource,
                fromIndex,
                'unknown',
                'unsupported-or-unproven',
                'ocr.plus.validation.unknown',
                { operation: operation.source }
            );
        }

        const equivalent = compareLinearEquations(fromEquation, toEquation, runtime);
        if (equivalent === false && left === false && right === false) {
            return transition(
                fromSource,
                toSource,
                fromIndex,
                'invalid',
                'operation-mismatch-both',
                'ocr.plus.validation.invalidBoth',
                { side: 'both', operation: operation.source }
            );
        }
        if (equivalent === true) {
            return transition(
                fromSource,
                toSource,
                fromIndex,
                'valid',
                'equivalent-linear-equations',
                'ocr.plus.validation.validEquivalent',
                { operation: operation.source }
            );
        }
    }

    if (hasUnresolvedDomainRisk(fromEquation.left, options) ||
        hasUnresolvedDomainRisk(fromEquation.right, options) ||
        hasUnresolvedDomainRisk(toEquation.left, options) ||
        hasUnresolvedDomainRisk(toEquation.right, options)) {
        return transition(
            fromSource,
            toSource,
            fromIndex,
            'unknown',
            'domain-uncertain',
            'ocr.plus.validation.unknownDomain',
            fromLine.operation ? { operation: fromLine.operation } : {}
        );
    }

    const equivalent = compareLinearEquations(fromEquation, toEquation, runtime);
    if (equivalent === true) {
        return transition(
            fromSource,
            toSource,
            fromIndex,
            'valid',
            'equivalent-linear-equations',
            'ocr.plus.validation.validEquivalent',
            fromLine.operation ? { operation: fromLine.operation } : {}
        );
    }
    if (equivalent === false) {
        return transition(
            fromSource,
            toSource,
            fromIndex,
            'invalid',
            'different-linear-solutions',
            'ocr.plus.validation.invalidEquivalent',
            fromLine.operation ? { operation: fromLine.operation } : {}
        );
    }
    return transition(
        fromSource,
        toSource,
        fromIndex,
        'unknown',
        'unsupported-or-unproven',
        'ocr.plus.validation.unknown',
        fromLine.operation ? { operation: fromLine.operation } : {}
    );
}

export function validateEquationTransitions(
    lines: readonly string[],
    options: TransitionValidationOptions = {}
): TransitionCheck[] {
    const checks: TransitionCheck[] = [];
    for (let index = 0; index + 1 < lines.length; index++) {
        checks.push(validateEquationTransition(lines[index], lines[index + 1], index, options));
    }
    return checks;
}

const MAX_CALCULATION_QUIZ_LINES = 32;
export const MAX_CALCULATION_ANSWER_LENGTH = 16_384;
const SOLVED_ROOT_REASONS = new Set<TransitionReason>([
    'quadratic-root-solutions',
    'cubic-root-solution',
    'quartic-root-solutions'
]);

function splitAlignedCalculationRows(value: string): string[] | null {
    const source = stripMathDelimiters(value);
    const begin = '\\begin{aligned}';
    const end = '\\end{aligned}';
    if (!source.startsWith(begin) || !source.endsWith(end)) return null;
    const body = source.slice(begin.length, source.length - end.length);
    const rows: string[] = [];
    let row = '';
    let curly = 0;
    let round = 0;
    let square = 0;
    for (let index = 0; index < body.length; index++) {
        const character = body[index];
        if (character === '\\' && body[index + 1] === '\\' &&
            curly === 0 && round === 0 && square === 0) {
            rows.push(row.replace(/&/gu, '').trim());
            row = '';
            index++;
            continue;
        }
        if (character === '{') curly++;
        else if (character === '}') curly--;
        else if (character === '(') round++;
        else if (character === ')') round--;
        else if (character === '[') square++;
        else if (character === ']') square--;
        if (curly < 0 || round < 0 || square < 0) return null;
        row += character;
    }
    if (curly !== 0 || round !== 0 || square !== 0) return null;
    rows.push(row.replace(/&/gu, '').trim());
    return rows;
}

function decodeCalculationSubmission(
    answer: string | readonly string[]
): string[] | null {
    if (Array.isArray(answer)) {
        const values = answer as readonly unknown[];
        if (!values.every(line => typeof line === 'string') ||
            values.reduce((length, line) => length + String(line).length, 0) >
                MAX_CALCULATION_ANSWER_LENGTH) return null;
        const lines = values.map(line => String(line).trim());
        return lines.some(line => !line) ? null : lines;
    }
    const source = String(answer || '').trim();
    if (!source) return [];
    if (source.length > MAX_CALCULATION_ANSWER_LENGTH) return null;

    if (source.startsWith('[')) {
        try {
            const parsed: unknown = JSON.parse(source);
            if (!Array.isArray(parsed) ||
                !parsed.every(line => typeof line === 'string')) return null;
            const lines = parsed.map(line => line.trim());
            return lines.some(line => !line) ? null : lines;
        } catch (_) {
            return null;
        }
    }

    if (source.includes('\\begin{aligned}') ||
        source.includes('\\end{aligned}')) {
        return splitAlignedCalculationRows(source);
    }
    return source.replace(/\r/gu, '').split('\n')
        .map(line => line.trim())
        .filter(Boolean);
}

export function serializeCalculationSubmission(lines: readonly string[]): string {
    const serialized = JSON.stringify(
        lines.map(line => String(line || '').trim()).filter(Boolean)
    );
    return serialized.length <= MAX_CALCULATION_ANSWER_LENGTH ? serialized : '';
}

function isBareCalculationVariable(
    expression: NormalizedExpression,
    variable: string
): boolean {
    let source = expression.cas.trim();
    for (;;) {
        if (!source.startsWith('(')) break;
        const outer = readBalanced(source, 0, '(', ')');
        if (!outer || outer.end !== source.length) break;
        source = outer.content.trim();
    }
    return source === variable;
}

function checkCalculationPrompt(
    promptTex: string,
    firstLine: string,
    runtime: AlgebriteRuntime
): CalculationPromptCheck {
    const prompt = parseEquation(promptTex);
    const first = parseEquation(splitLine(firstLine).equation);
    if (!prompt || !first) {
        return { status: 'unknown', reason: 'prompt-unproven' };
    }
    const promptVariables = variablesIn([
        prompt.left.cas,
        prompt.right.cas
    ]);
    if (promptVariables.length !== 1 || !/^[A-Za-z]$/u.test(promptVariables[0])) {
        return { status: 'unknown', reason: 'prompt-unproven' };
    }

    const directCas = prompt.left.cas === first.left.cas &&
        prompt.right.cas === first.right.cas;
    const swappedCas = prompt.left.cas === first.right.cas &&
        prompt.right.cas === first.left.cas;
    const domainRisk = prompt.left.domainRisk || prompt.right.domainRisk ||
        first.left.domainRisk || first.right.domainRisk;
    if (domainRisk) {
        return directCas || swappedCas
            ? { status: 'valid', reason: 'prompt-match' }
            : { status: 'unknown', reason: 'prompt-unproven' };
    }

    const direct = [
        proveExpressionIdentity(prompt.left.cas, first.left.cas, runtime),
        proveExpressionIdentity(prompt.right.cas, first.right.cas, runtime)
    ];
    const swapped = [
        proveExpressionIdentity(prompt.left.cas, first.right.cas, runtime),
        proveExpressionIdentity(prompt.right.cas, first.left.cas, runtime)
    ];
    if (direct.every(value => value === true) ||
        swapped.every(value => value === true)) {
        return { status: 'valid', reason: 'prompt-match' };
    }
    if ([...direct, ...swapped].some(value => value === null)) {
        return { status: 'unknown', reason: 'prompt-unproven' };
    }
    return { status: 'invalid', reason: 'prompt-mismatch' };
}

function checkCalculationFinal(
    promptTex: string,
    lines: readonly string[],
    checks: readonly TransitionCheck[],
    runtime: AlgebriteRuntime
): CalculationFinalCheck {
    const lastCheck = checks[checks.length - 1];
    if (lastCheck?.status === 'valid' &&
        SOLVED_ROOT_REASONS.has(lastCheck.reason)) {
        return { status: 'valid', reason: 'solved-root-set' };
    }

    const prompt = parseEquation(promptTex);
    const lastSource = String(lines[lines.length - 1] || '').trim();
    const lastLine = splitLine(lastSource);
    const last = lastLine.operation ? null : parseEquation(lastLine.equation);
    if (!prompt || !last) {
        return { status: 'unknown', reason: 'unsupported' };
    }
    const promptVariables = variablesIn([prompt.left.cas, prompt.right.cas]);
    if (promptVariables.length !== 1 || !/^[A-Za-z]$/u.test(promptVariables[0])) {
        return { status: 'unknown', reason: 'unsupported' };
    }
    const variable = promptVariables[0];
    const candidates: Array<[NormalizedExpression, NormalizedExpression]> = [
        [last.left, last.right],
        [last.right, last.left]
    ];
    let hadUnknownProof = false;
    for (const [variableSide, valueSide] of candidates) {
        if (!isBareCalculationVariable(variableSide, variable) ||
            valueSide.domainRisk ||
            variablesIn([valueSide.cas]).length) continue;
        const simplified = casRun(
            'simplify(rationalize(' + valueSide.cas + '))',
            runtime
        );
        if (simplified === null) hadUnknownProof = true;
        if (simplified !== null && numericCasValue(simplified) !== null) {
            return { status: 'valid', reason: 'solved-variable' };
        }
    }
    return hadUnknownProof
        ? { status: 'unknown', reason: 'unsupported' }
        : { status: 'incomplete', reason: 'not-isolated' };
}

function baseCalculationGrade(
    lines: string[],
    outcome: CalculationQuizOutcome,
    stage: 'prompt' | 'transition' | 'final',
    reason: string,
    lineIndex?: number
): CalculationQuizGrade {
    return {
        accepted: false,
        outcome,
        lines,
        promptCheck: { status: 'unknown', reason: 'prompt-unproven' },
        transitionChecks: [],
        finalCheck: { status: 'unknown', reason: 'unsupported' },
        firstProblem: { stage, lineIndex, reason }
    };
}

/**
 * Grades a complete handwritten solution path for a LiaScript text quiz.
 * The first row must reproduce the task equation, every transition must be
 * proven, and the last row must be a supported solved form.
 */
export function validateCalculationSubmission(
    promptTex: string,
    answer: string | readonly string[],
    options: TransitionValidationOptions = {}
): CalculationQuizGrade {
    const lines = decodeCalculationSubmission(answer);
    if (lines === null) {
        return baseCalculationGrade([], 'unknown', 'prompt', 'invalid-format');
    }
    if (lines.length < 2) {
        return baseCalculationGrade(lines, 'incomplete', 'final', 'too-few-lines');
    }
    if (lines.length > MAX_CALCULATION_QUIZ_LINES) {
        return baseCalculationGrade(lines, 'incomplete', 'final', 'too-many-lines');
    }
    const runtime = resolveAlgebriteRuntime();
    if (!runtime) {
        return baseCalculationGrade(lines, 'unknown', 'prompt', 'cas-unavailable');
    }

    const promptCheck = checkCalculationPrompt(promptTex, lines[0], runtime);
    const transitionChecks = validateEquationTransitions(lines, {
        ...options,
        strictDeclaredOperations: true
    });
    const finalCheck = checkCalculationFinal(
        promptTex,
        lines,
        transitionChecks,
        runtime
    );

    if (promptCheck.status !== 'valid') {
        const outcome = promptCheck.status === 'invalid' ? 'incorrect' : 'unknown';
        return {
            accepted: false,
            outcome,
            lines,
            promptCheck,
            transitionChecks,
            finalCheck,
            firstProblem: {
                stage: 'prompt',
                lineIndex: 0,
                reason: promptCheck.reason
            }
        };
    }

    const invalidIndex = transitionChecks.findIndex(check => check.status === 'invalid');
    if (invalidIndex >= 0) {
        return {
            accepted: false,
            outcome: 'incorrect',
            lines,
            promptCheck,
            transitionChecks,
            finalCheck,
            firstProblem: {
                stage: 'transition',
                lineIndex: invalidIndex,
                reason: transitionChecks[invalidIndex].reason
            }
        };
    }
    const unknownIndex = transitionChecks.findIndex(check => check.status === 'unknown');
    if (unknownIndex >= 0) {
        return {
            accepted: false,
            outcome: 'unknown',
            lines,
            promptCheck,
            transitionChecks,
            finalCheck,
            firstProblem: {
                stage: 'transition',
                lineIndex: unknownIndex,
                reason: transitionChecks[unknownIndex].reason
            }
        };
    }
    if (finalCheck.status !== 'valid') {
        return {
            accepted: false,
            outcome: finalCheck.status === 'incomplete' ? 'incomplete' : 'unknown',
            lines,
            promptCheck,
            transitionChecks,
            finalCheck,
            firstProblem: {
                stage: 'final',
                lineIndex: lines.length - 1,
                reason: finalCheck.reason
            }
        };
    }
    return {
        accepted: true,
        outcome: 'correct',
        lines,
        promptCheck,
        transitionChecks,
        finalCheck
    };
}
