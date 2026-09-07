import assert from 'node:assert/strict';
import test from 'node:test';
import Algebrite from 'algebrite';
import { calculationProofTools as proof, serializeCalculationSubmission, validateEquationTransition } from '../src/math/equivalence.ts';
import { validateCalculationPathSubmission, iterateCalculationPathChecks } from '../src/math/calculation-path.ts';
import { analyzeLinearSystem, proveLinearSystemAssignments, proveLinearSystemConsequence } from '../src/math/linear-system-proof.ts';
import { parseCalculationStatement } from '../src/math/calculation-structure.ts';
import { CalculationCorrections } from '../src/canvas/calculation-corrections.ts';
import { sanitizeCalculationReviewFreezeState } from '../src/canvas/calculation-freeze.ts';

const options = { runtime: Algebrite, strictDeclaredOperations: true };
const pairs = [['x', 'X'], ['y', 'Y']] as const;
function accepted(prompt: string, lines: readonly string[]) {
    const grade = validateCalculationPathSubmission(prompt, lines, options);
    assert.equal(grade.accepted, true, JSON.stringify({ prompt, lines, grade }));
    assert.ok([...iterateCalculationPathChecks(lines, prompt, options)].every(check => check.status === 'valid'));
    return grade;
}
function rejected(prompt: string, lines: readonly string[]) {
    const grade = validateCalculationPathSubmission(prompt, lines, options);
    assert.equal(grade.accepted, false, JSON.stringify({ prompt, lines, grade }));
    assert.ok(grade.promptCheck.status !== 'valid' || [...iterateCalculationPathChecks(lines, prompt, options)].some(check => check.status !== 'valid'), JSON.stringify({ prompt, lines }));
    assert.deepEqual(grade.lines, lines, 'validation preserves the submitted variable spelling');
}

test('CAS conversion preserves lower and upper variable names, including lettered indices and Greek symbols', () => {
    const source = String.raw`x+X+y+Y+x_i+X_i+x_I+X_I+\gamma+\Gamma`;
    const converted = proof.convertTexFragment(source);
    assert.ok(converted);
    assert.deepEqual(proof.variablesIn([converted.cas]), ['X', 'X_I', 'X_i', 'Y', 'greek_Gamma', 'greek_gamma', 'x', 'x_I', 'x_i', 'y']);
    for (const [lower, upper] of pairs) {
        const parsed = parseCalculationStatement(lower + '+' + upper + '=5');
        assert.equal(parsed.kind, 'equation');
        if (parsed.kind === 'equation') assert.equal(parsed.left, lower + '+' + upper);
    }
});

test('the original task cannot be matched by changing x to X or y to Y', () => {
    for (const [lower, upper] of pairs) {
        rejected('2' + lower + '=4', ['2' + upper + '=4', upper + '=2']);
        rejected('2' + upper + '=4', ['2' + lower + '=4', lower + '=2']);
        accepted('2' + upper + '=4', ['2' + upper + '=4', upper + '=2']);
        accepted('2' + lower + '=4', ['2' + lower + '=4', lower + '=2']);
    }
});

test('case changes in intermediate equations and final answers do not become valid transformations', () => {
    for (const [lower, upper] of pairs) {
        const prompt = '2' + lower + '=4';
        rejected(prompt, [prompt, '2' + upper + '=4', lower + '=2']);
        rejected(prompt, [prompt, upper + '=2']);
        const declared = validateEquationTransition(prompt + String.raw`\mid:2`, upper + '=2', 0, options);
        assert.notEqual(declared.status, 'valid');
        assert.notEqual(validateEquationTransition(lower + '-' + upper + '=0', '0=0', 0, options).status, 'valid');
    }
    const differentOperand = validateEquationTransition(String.raw`x=2\mid+Y`, 'x+y=2+y', 0, options);
    assert.notEqual(differentOperand.status, 'valid', 'an operation in Y must not be checked as an operation in y');
});

test('a side calculation does not cancel differently cased variables', () => {
    for (const [lower, upper] of pairs) {
        const prompt = '2' + lower + '=4';
        rejected(prompt, [prompt, String.raw`\text{Nebenrechnung:}` + lower + '-' + upper + '=0', lower + '=2']);
        rejected(prompt, [prompt, String.raw`\text{Nebenrechnung:}(` + lower + '-' + upper + ')^2=0', lower + '=2']);
        accepted(prompt, [prompt, String.raw`\text{Nebenrechnung:}` + upper + '-' + upper + '=0', lower + '=2']);
    }
});

test('a probe substitutes only the actual solved variable and retains an unrelated uppercase symbol', () => {
    for (const [lower, upper] of pairs) {
        const prompt = '2' + lower + '+1=7';
        const main = [prompt, '2' + lower + '=6', lower + '=3'];
        rejected(prompt, [...main, String.raw`\text{Probe:}2` + upper + '+1=7', '7=7']);
        accepted(prompt, [...main, String.raw`\text{Probe:}2\cdot3+1=7`, '7=7']);
    }
});

test('indexed quadratic solutions must retain the variable of the original equation', () => {
    for (const [lower, upper] of pairs) {
        rejected(lower + '^2=4', [lower + '^2=4', upper + String.raw`_{1,2}=\pm2`]);
        accepted(upper + '^2=4', [upper + '^2=4', upper + String.raw`_{1,2}=\pm2`]);
        rejected(lower + '^2=4', [lower + '^2=4', lower + '_1=-2', upper + '_2=2']);
    }
});

test('mixed-case linear systems have independent unknowns and require both correct assignments', () => {
    for (const [lower, upper] of pairs) {
        const first = lower + '+' + upper + '=5', second = lower + '-' + upper + '=1';
        const model = analyzeLinearSystem([first, second], Algebrite);
        assert.ok(model);
        assert.deepEqual(model.variables, [upper, lower]);
        assert.deepEqual(model.uniqueSolution, { [upper]: '2', [lower]: '3' });
        assert.equal(proveLinearSystemAssignments(model, [lower + '=3', upper + '=2'], Algebrite), true);
        assert.notEqual(proveLinearSystemAssignments(model, [lower + '=3', lower + '=2'], Algebrite), true);
        assert.equal(proveLinearSystemConsequence(model, lower + '-' + upper + '=0', Algebrite), false);
        const prompt = String.raw`\begin{cases}` + first + String.raw`\\` + second + String.raw`\end{cases}`;
        const given = ['I. ' + first, 'II. ' + second];
        accepted(prompt, [...given, '2' + lower + '=6', lower + '=3', upper + '=2']);
        rejected(prompt, [...given, lower + '=3', lower + '=2']);
        rejected(prompt, [...given, upper + '=3', lower + '=2']);
    }
});

test('a deliberately introduced uppercase substitution remains distinct from its original lowercase variable', () => {
    const prompt = 'x^4-5x^2+4=0';
    accepted(prompt, [
        prompt, String.raw`\text{Substitution:}X=x^2`, 'X^2-5X+4=0',
        String.raw`X_{1,2}=\frac{5\pm3}{2}`,
        String.raw`\text{Rücksubstitution:}x^2=4`, String.raw`x_{1,2}=\pm2`,
        String.raw`\text{Rücksubstitution:}x^2=1`, String.raw`x_{1,2}=\pm1`,
        String.raw`L=\{-2;-1;1;2\}`,
    ]);
});

test('a case-only manual correction survives Freeze and transport without becoming a correct answer', () => {
    const original = [
        { correctionKey: 'ink-first', latex: '2x=4' },
        { correctionKey: 'ink-answer', latex: 'x=2' },
    ];
    const corrections = new CalculationCorrections();
    corrections.remember(original, ['2x=4', 'X=2']);
    const projected = corrections.apply(original);
    assert.equal(projected.corrected, true);
    assert.deepEqual(projected.lines, ['2x=4', 'X=2']);
    assert.equal(corrections.originalFor('ink-answer'), 'x=2');
    const checks = [...iterateCalculationPathChecks(projected.lines, '2x=4', options)];
    const frozen = sanitizeCalculationReviewFreezeState({
        v: 'cr1', state: 'ready', lines: projected.lines,
        checks: checks.map(check => ({ status: check.status, reason: check.reason, fromIndex: check.fromIndex, toIndex: check.toIndex })),
    });
    assert.ok(frozen);
    assert.deepEqual(frozen.lines, ['2x=4', 'X=2']);
    const restored = sanitizeCalculationReviewFreezeState(JSON.parse(JSON.stringify(frozen)));
    assert.ok(restored);
    const answer = serializeCalculationSubmission(restored.lines);
    assert.deepEqual(proof.decodeCalculationSubmission(answer), ['2x=4', 'X=2']);
    assert.equal(validateCalculationPathSubmission('2x=4', answer, options).accepted, false);
    corrections.remember(original, ['2x=4', 'x=2']);
    assert.deepEqual(corrections.apply(original), { lines: ['2x=4', 'x=2'], corrected: false });
});
test('a wrong first main variable cannot be skipped when a later row happens to match the prompt', () => {
    for (const [lower, upper] of pairs) {
        for (const [promptVariable, wrongVariable] of [[lower, upper], [upper, lower]]) {
            const prompt = promptVariable + String.raw`=1.5\cdot2`;
            const lines = [wrongVariable + String.raw` = 1, 5 \cdot 2`, promptVariable + '=3'];
            const checks = [...iterateCalculationPathChecks(lines, prompt, options)];
            assert.equal(checks.length, 1);
            assert.notEqual(checks[0].status, 'valid', JSON.stringify({ prompt, lines, checks }));
            assert.equal(checks[0].from, lines[0]);
            assert.equal(validateCalculationPathSubmission(prompt, lines, options).accepted, false);
            accepted(prompt, [promptVariable + String.raw`=1, 5\cdot2`, promptVariable + '=3']);
        }
    }
    const arithmetic = [...iterateCalculationPathChecks(['x=4', 'x=3'], 'x=3', options)];
    assert.notEqual(arithmetic[0].status, 'valid', 'a changed constant cannot reset the initial equation either');
});

test('explicit headings and correct auxiliary work before a given equation do not count as failed main attempts', () => {
    for (const prefix of [[String.raw`\text{Hauptrechnung}`], [String.raw`\text{Nebenrechnung:}2+2=4`]]) {
        const prompt = '2X=4';
        const grade = accepted(prompt, [...prefix, prompt, 'X=2']);
        assert.equal(grade.transitionChecks[0].role, 'given');
        assert.equal(grade.transitionChecks[0].reason, 'given-equation');
    }
    accepted(String.raw`\begin{cases}x+X=5\\x-X=1\end{cases}`, [
        String.raw`\text{Nebenrechnung:}2+2=4`, 'I. x+X=5', 'II. x-X=1', '2x=6', 'x=3', 'X=2',
    ]);
});
