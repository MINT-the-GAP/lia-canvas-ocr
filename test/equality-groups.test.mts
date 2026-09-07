import assert from 'node:assert/strict';
import test from 'node:test';
import Algebrite from 'algebrite';
import { findTopLevelGroupedEqualities, normalizeTopLevelEqualityGroups as normalize } from '../src/math/equality-groups.ts';
import { parseCalculationStatement } from '../src/math/calculation-structure.ts';
import { calculationProofTools as proof, validateEquationTransition, validateCalculationSubmission } from '../src/math/equivalence.ts';
import { validateCalculationPathSubmission, iterateCalculationPathChecks } from '../src/math/calculation-path.ts';
import { isCalculationProofInputBounded } from '../src/math/calculation-proof-budget.ts';

const options = { runtime: Algebrite, strictDeclaredOperations: true };
function accepted(prompt: string, lines: readonly string[]) {
    const grade = validateCalculationPathSubmission(prompt, lines, options);
    assert.equal(grade.accepted, true, JSON.stringify({ prompt, lines, grade }));
    assert.deepEqual(grade.lines, lines, 'the original TeX is retained, not rewritten for presentation');
    assert.ok(grade.transitionChecks.every(check => check.status === 'valid'));
    return grade;
}

test('only standalone top-level single equality groups are transparent', () => {
    for (const source of ['x{=}2', 'X { = } 2', 'Y{\t=\n}1', 'x {=} 1+1 { = } 2']) {
        const expected = source.replace(/\{\s*=\s*\}/gu, '=');
        assert.equal(normalize(source), expected);
        const ranges = findTopLevelGroupedEqualities(source);
        assert.ok(ranges.length > 0);
        for (const range of ranges) assert.equal(source[range.equality], '=');
        const parsed = parseCalculationStatement(source);
        assert.equal(parsed.source, source);
        assert.equal(parsed.kind, ranges.length > 1 ? 'equality-chain' : 'equation');
    }
    for (const source of ['x{{=}}2', 'x{=+}2', 'x{==}2', 'x{<}2', 'x{\\neq}2', 'x{=}2+{', 'x{=}2)', 'x{=}2%comment']) {
        assert.equal(normalize(source), source, source);
        assert.equal(parseCalculationStatement(source).kind, 'unsupported', source);
    }
});

test('command arguments, scripts, matrices and enclosing groups cannot introduce main equalities', () => {
    const sources = [
        String.raw`\text{x{=}2}`, String.raw`\mathrm{x{=}2}`,
        String.raw`x^{=}2`, String.raw`x_{{=}}2`, String.raw`x^{y{=}2}`,
        String.raw`\frac{x}{=}2`, String.raw`\frac{=}{x}2`, String.raw`\frac{x{=}2}{3}`,
        String.raw`\frac x {=}2`, String.raw`\sqrt{=}2`, String.raw`\sqrt[=]{2}`,
        String.raw`\overset{x}{=}2`, String.raw`\unknown{x}{=}2`, String.raw`\not{=}2`,
        String.raw`\begin{matrix}x{=}2\end{matrix}`, String.raw`(x{=}2)`,
        String.raw`\{x{=}2\}`, String.raw`|x{=}2|`, String.raw`{x{=}2}`,
        String.raw`\left. x{=}2 \right.`,
    ];
    for (const source of sources) {
        assert.equal(normalize(source), source, source);
        assert.equal(proof.parseEquation(source), null, source);
        assert.equal(parseCalculationStatement(source).kind, 'unsupported', source);
        assert.equal(validateCalculationPathSubmission('x=2', [source, 'x=2'], options).accepted, false, source);
    }
});

test('complete fraction, root, script and parenthesized operands retain their mathematical grouping', () => {
    const examples = [
        [String.raw`\frac{x}{2}{=}3`, String.raw`\frac{x}{2}=3`],
        [String.raw`\sqrt{4}{=}x`, String.raw`\sqrt{4}=x`],
        [String.raw`(x+1){=}3`, '(x+1)=3'],
        [String.raw`x^{2}{=}4`, String.raw`x^{2}=4`],
        [String.raw`X_{1,2}{=}\pm2`, String.raw`X_{1,2}=\pm2`],
    ];
    for (const [source, expected] of examples) {
        assert.equal(normalize(source), expected);
        assert.equal(parseCalculationStatement(source).source, source);
        assert.equal(isCalculationProofInputBounded(source), true, source);
    }
    accepted(String.raw`\frac{x}{2}=3`, [String.raw`\frac{x}{2}{=}3`, 'x { = } 6']);
    accepted('(x+1)=3', ['(x+1){=}3', 'x { = } 2']);
    accepted('X^2=4', ['X^{2}{=}4', String.raw`X_{1,2}{=}\pm2`]);
});

test('real model grouped-equality outputs pass legacy and complete-path grading without changing variable case', () => {
    for (const variable of ['x', 'X', 'y', 'Y']) {
        const prompt = '2' + variable + '=4';
        const lines = [prompt, variable + ' { = } 2'];
        accepted(prompt, lines);
        assert.equal(validateEquationTransition(lines[0], lines[1], 0, options).status, 'valid');
        assert.equal(validateCalculationSubmission(prompt, lines, options).accepted, true);
        const wrong = variable === variable.toUpperCase() ? variable.toLowerCase() : variable.toUpperCase();
        assert.notEqual(validateEquationTransition(prompt, wrong + ' { = } 2', 0, options).status, 'valid');
        assert.equal(validateCalculationPathSubmission(prompt, [prompt, wrong + ' { = } 2'], options).accepted, false);
    }
});

test('explicit grouped relations work within supported system and alignment rows while original sources remain intact', () => {
    const prompt = String.raw`\begin{cases}x+X{=}5\\x-X{=}1\end{cases}`;
    const lines = ['I. x+X{=}5', 'II. x-X{=}1', '2x{=}6', 'x{=}3', 'X { = } 2'];
    accepted(prompt, lines);
    const parsed = parseCalculationStatement(prompt);
    assert.equal(parsed.kind, 'group');
    if (parsed.kind === 'group') assert.deepEqual(parsed.members.map(member => member.source), ['x+X{=}5', 'x-X{=}1']);
    const aligned = String.raw`\begin{aligned}2Y&{ = }&4\\Y&{=}&2\end{aligned}`;
    const alignment = parseCalculationStatement(aligned);
    assert.equal(alignment.kind, 'group');
    if (alignment.kind === 'group') {
        assert.deepEqual(alignment.members.map(member => member.source), ['2Y&{ = }&4', 'Y&{=}&2']);
        assert.ok(alignment.members.every(member => member.kind === 'equation'));
    }
    const compound = 'x{=}3; X { = } 2';
    const grouped = parseCalculationStatement(compound);
    assert.equal(grouped.kind, 'group');
    if (grouped.kind === 'group') assert.deepEqual(grouped.members.map(member => member.source), ['x{=}3', ' X { = } 2']);
});

test('group wrappers do not excuse a wrong intermediate equality or an unperformed declared operation', () => {
    const wrongChain = ['2x=4', 'x{=}2{=}3', 'x=2'];
    assert.equal(validateCalculationPathSubmission('2x=4', wrongChain, options).accepted, false);
    const declared = [String.raw`2x {=} 4 \mid:2`, 'x {=} 4'];
    const grade = validateCalculationPathSubmission('2x=4', declared, options);
    assert.equal(grade.accepted, false);
    assert.ok(grade.transitionChecks.some(check => check.status === 'invalid'));
    for (const source of [String.raw`x^{=}=2`, String.raw`\frac{x{=}2}{3}=1`, String.raw`x{=}2\unknown{a}`]) {
        assert.equal(validateCalculationPathSubmission('x=2', [source, 'x=2'], options).accepted, false, source);
    }
});

test('grouped-relation scanning is bounded and leaves excessive or malformed inputs untouched', () => {
    for (const source of ['x{=}2' + ' '.repeat(16_384), 'x{=}2+' + '{'.repeat(33) + '1' + '}'.repeat(33), 'x{=}2\u0000']) {
        assert.equal(normalize(source), source);
        assert.deepEqual(findTopLevelGroupedEqualities(source), []);
    }
});
