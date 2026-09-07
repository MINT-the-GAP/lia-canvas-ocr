import { calculationProofTools as proof, type AlgebriteRuntime, type ParsedEquation } from './equivalence.ts';

/** Exact rational linear systems with two or three unknowns. No numerical sampling. */
export type LinearSystemModel = Readonly<{
    variables: readonly string[];
    rank: number;
    inconsistent: boolean;
    uniqueSolution: Readonly<Record<string, string>> | null;
}>;

type Matrix = string[][];
const systemRows = new WeakMap<LinearSystemModel, Matrix>();
const MAX_EQUATIONS = 12;
const MAX_RATIONAL_LENGTH = 128;
const RATIONAL = /^-?\d+(?:\/[1-9]\d*)?$/u;

function unavailable(): never { throw new Error('Exact linear proof unavailable.'); }

function exactValue(expression: string, runtime: AlgebriteRuntime): string {
    const value = proof.casRun('simplify(' + expression + ')', runtime);
    if (!value || value.length > MAX_RATIONAL_LENGTH || !RATIONAL.test(value)) return unavailable();
    return value;
}

/** Decimal literals are exact rational input, including digits beyond Number precision. */
function exactExpression(source: string): string | null {
    // Keep expensive nonlinear expansion outside this deliberately small solver.
    // A first power of an individual symbol is still a linear spelling.
    let value = source.replace(/([A-Za-z][A-Za-z0-9_]*)\^\(1\)/gu, '$1');
    if (value.includes('^') || value.length > 1_024) return null;
    value = value.replace(/\d+\.\d+/gu, decimal => {
        const [whole, fraction] = decimal.split('.');
        const numerator = (whole + fraction).replace(/^0+(?=\d)/u, '');
        return '(' + numerator + '/1' + '0'.repeat(fraction.length) + ')';
    });
    return value;
}

function parseSafeEquation(equation: string): ParsedEquation | null {
    const parsed = proof.parseEquation(equation);
    if (!parsed || parsed.left.domainRisk || parsed.right.domainRisk) return null;
    const left = exactExpression(parsed.left.cas);
    const right = exactExpression(parsed.right.cas);
    return left && right
        ? { left: { cas: left, domainRisk: false }, right: { cas: right, domainRisk: false } }
        : null;
}

function rowForEquation(parsed: ParsedEquation, variables: readonly string[], runtime: AlgebriteRuntime): string[] {
    const ownVariables = proof.variablesIn([parsed.left.cas, parsed.right.cas]);
    if (ownVariables.some(variable => !variables.includes(variable))) return unavailable();
    // Algebrite treats i*i as -1. Give every unknown an internal symbol before
    // evaluating anything so a nonlinear real constraint cannot collapse to a
    // linear equation through a reserved CAS constant.
    const handles = variables.map((_, index) => 'lia_system_unknown_' + index);
    const withHandles = (source: string) => source.replace(/[A-Za-z][A-Za-z0-9_]*/gu, identifier => {
        const index = variables.indexOf(identifier);
        return index < 0 ? identifier : handles[index];
    });
    const difference = '((' + withHandles(parsed.left.cas) + ')-(' + withHandles(parsed.right.cas) + '))';
    const coefficients = handles.map(variable => exactValue('d(' + difference + ',' + variable + ')', runtime));
    let constantExpression = difference;
    for (const variable of handles) constantExpression = 'subst(0,' + variable + ',' + constantExpression + ')';
    const constant = exactValue(constantExpression, runtime);
    const reconstructed = coefficients.map((coefficient, index) => '(' + coefficient + ')*' + handles[index])
        .concat('(' + constant + ')').join('+');
    // Numeric derivatives alone are not accepted as a proof of global linearity.
    if (proof.proveExpressionIdentity(difference, reconstructed, runtime) !== true) return unavailable();
    return coefficients.concat(exactValue('-(' + constant + ')', runtime));
}

function reduceRows(input: readonly (readonly string[])[], variables: number, runtime: AlgebriteRuntime) {
    const rows = input.map(row => row.slice());
    let rank = 0;
    for (let column = 0; column < variables; column++) {
        const pivot = rows.findIndex((row, index) => index >= rank && row[column] !== '0');
        if (pivot < 0) continue;
        [rows[rank], rows[pivot]] = [rows[pivot], rows[rank]];
        const divisor = rows[rank][column];
        rows[rank] = rows[rank].map(value => exactValue('(' + value + ')/(' + divisor + ')', runtime));
        for (let index = 0; index < rows.length; index++) {
            if (index === rank || rows[index][column] === '0') continue;
            const multiplier = rows[index][column];
            rows[index] = rows[index].map((value, position) => exactValue(
                '(' + value + ')-(' + multiplier + ')*(' + rows[rank][position] + ')', runtime,
            ));
        }
        rank++;
    }
    const inconsistent = rows.some(row => row.slice(0, variables).every(value => value === '0') && row[variables] !== '0');
    return { rows: rows.filter(row => row.some(value => value !== '0')), rank, inconsistent };
}

/** Labels and procedure annotations belong to the caller's path parser. */
export function analyzeLinearSystem(
    equations: readonly string[],
    suppliedRuntime?: AlgebriteRuntime | null,
): LinearSystemModel | null {
    const runtime = suppliedRuntime === undefined ? proof.resolveAlgebriteRuntime() : suppliedRuntime;
    if (!runtime || !Array.isArray(equations) || equations.length < 1 || equations.length > MAX_EQUATIONS) return null;
    try {
        const parsed = equations.map(parseSafeEquation);
        if (parsed.some(equation => !equation)) return null;
        const expressions: string[] = [];
        for (const equation of parsed) expressions.push(equation!.left.cas, equation!.right.cas);
        const variables = proof.variablesIn(expressions);
        if (variables.length < 2 || variables.length > 3) return null;
        const reduced = reduceRows(parsed.map(equation => rowForEquation(equation!, variables, runtime)), variables.length, runtime);
        let uniqueSolution: Record<string, string> | null = null;
        if (!reduced.inconsistent && reduced.rank === variables.length) {
            uniqueSolution = {};
            for (let index = 0; index < variables.length; index++) uniqueSolution[variables[index]] = reduced.rows[index][variables.length];
            Object.freeze(uniqueSolution);
        }
        const model: LinearSystemModel = Object.freeze({
            variables: Object.freeze(variables.slice()), rank: reduced.rank, inconsistent: reduced.inconsistent, uniqueSolution,
        });
        systemRows.set(model, reduced.rows);
        return model;
    } catch (_) { return null; }
}

/** True means the candidate lies in the exact augmented row space. */
export function proveLinearSystemConsequence(
    model: LinearSystemModel,
    equation: string,
    suppliedRuntime?: AlgebriteRuntime | null,
): boolean | null {
    const runtime = suppliedRuntime === undefined ? proof.resolveAlgebriteRuntime() : suppliedRuntime;
    const rows = systemRows.get(model);
    if (!runtime || !rows || model.inconsistent) return null;
    try {
        const parsed = parseSafeEquation(equation);
        if (!parsed) return null;
        const row = rowForEquation(parsed, model.variables, runtime);
        const augmented = reduceRows(rows.concat([row]), model.variables.length, runtime);
        return !augmented.inconsistent && augmented.rank === model.rank;
    } catch (_) { return null; }
}

function alignedRows(model: LinearSystemModel, variables: readonly string[]): Matrix | null {
    const rows = systemRows.get(model);
    if (!rows) return null;
    return rows.map(row => variables.map(variable => {
        const index = model.variables.indexOf(variable);
        return index < 0 ? '0' : row[index];
    }).concat(row[model.variables.length]));
}

/** Compare complete systems, not individual consequences that may discard a constraint. */
export function compareLinearSystems(
    left: LinearSystemModel,
    right: LinearSystemModel,
    suppliedRuntime?: AlgebriteRuntime | null,
): boolean | null {
    const runtime = suppliedRuntime === undefined ? proof.resolveAlgebriteRuntime() : suppliedRuntime;
    if (!runtime || left.inconsistent || right.inconsistent) return null;
    try {
        const variables = Array.from(new Set(left.variables.concat(right.variables))).sort();
        if (variables.length > 3) return null;
        const leftRows = alignedRows(left, variables);
        const rightRows = alignedRows(right, variables);
        if (!leftRows || !rightRows) return null;
        const a = reduceRows(leftRows, variables.length, runtime);
        const b = reduceRows(rightRows, variables.length, runtime);
        return a.rank === b.rank && JSON.stringify(a.rows) === JSON.stringify(b.rows);
    } catch (_) { return null; }
}

/** Partial correct assignments are not a complete solution; singular systems stay unproven. */
export function proveLinearSystemAssignments(
    model: LinearSystemModel,
    assignments: readonly string[],
    suppliedRuntime?: AlgebriteRuntime | null,
): boolean | null {
    const runtime = suppliedRuntime === undefined ? proof.resolveAlgebriteRuntime() : suppliedRuntime;
    if (!runtime || !systemRows.has(model) || model.inconsistent || !model.uniqueSolution ||
        !Array.isArray(assignments) || assignments.length < 1 || assignments.length > MAX_EQUATIONS) return null;
    try {
        const assigned = new Set<string>();
        for (const assignment of assignments) {
            const parsed = parseSafeEquation(assignment);
            if (!parsed) return null;
            const leftVariable = model.variables.includes(parsed.left.cas);
            const rightVariable = model.variables.includes(parsed.right.cas);
            if (leftVariable === rightVariable) return null;
            const variable = leftVariable ? parsed.left.cas : parsed.right.cas;
            const expression = leftVariable ? parsed.right.cas : parsed.left.cas;
            if (proof.variablesIn([expression]).length) return null;
            const value = exactValue(expression, runtime);
            if (value !== model.uniqueSolution[variable]) return false;
            assigned.add(variable);
        }
        return assigned.size === model.variables.length ? true : null;
    } catch (_) { return null; }
}
