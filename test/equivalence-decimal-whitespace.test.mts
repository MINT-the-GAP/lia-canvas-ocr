import assert from 'node:assert/strict';
import test from 'node:test';
import Algebrite from 'algebrite';
import { calculationProofTools as proof, validateEquationTransition } from '../src/math/equivalence.ts';
import { validateCalculationPathSubmission } from '../src/math/calculation-path.ts';
import { parseCalculationStatement } from '../src/math/calculation-structure.ts';

const options = { runtime: Algebrite };
const prompt = String.raw`x=1,5\cdot2`;

test('accepts source whitespace at decimal commas without rewriting recognized lines', () => {
  for (const decimal of ['1,5', '1, 5', '1 ,5', '1 , 5', '1\t,\n5']) {
    const first = 'x = ' + decimal + String.raw` \cdot 2`;
    assert.equal(proof.parseEquation(first)?.right.cas, '1.5*2');
    const lines = [first, 'x = 3'];
    const grade = validateCalculationPathSubmission(prompt, lines, options);
    assert.equal(grade.accepted, true, first + ': ' + JSON.stringify(grade));
    assert.deepEqual(grade.lines, lines, 'grading must preserve the original transcription');
    const wrong = validateCalculationPathSubmission(prompt, [first, 'x = 4'], options);
    assert.equal(wrong.accepted, false);
    assert.equal(wrong.outcome, 'incorrect');
  }
});

test('rejects malformed or oversized decimal literals and keeps TeX command boundaries', () => {
  for (const value of ['1,,5', '1, 5,2', '1.5,2', '1,5.2', '1,', ',5', '1 , +5', '1.', '1..5',
    '12345678901234567890123 , 4', String.raw`1\quad,5`, String.raw`1,\,5`]) {
    assert.equal(proof.convertTexFragment(value), null, value);
    assert.equal(validateCalculationPathSubmission(prompt, ['x=' + value, 'x=3'], options).accepted, false, value);
  }
  assert.equal(proof.convertTexFragment(String.raw`1 , 5\cdot x`)?.cas, '1.5*x');
  assert.equal(proof.convertTexFragment(String.raw`1 , 5\cdotx`), null);
});

test('preserves assignment separators, solution indices and commas between set entries', () => {
  const assignments = parseCalculationStatement('x=1,y=5');
  assert.equal(assignments.kind, 'group');
  if (assignments.kind !== 'group') return;
  assert.equal(assignments.members.length, 2);
  assert.equal(proof.parseEquation('x=1,y=5'), null);
  const indexed = parseCalculationStatement(String.raw`x_{1,2}=\pm5`);
  assert.equal(indexed.kind, 'equation');
  if (indexed.kind === 'equation') assert.equal(indexed.left, 'x_{1,2}');
  assert.equal(validateCalculationPathSubmission('x^2=25', ['x^2=25', String.raw`x_{1,2}=\pm5`], options).accepted, true);
  assert.equal(validateCalculationPathSubmission('x^2-6x+5=0', ['x^2-6x+5=0', String.raw`L=\{1,5\}`], options).accepted, true);
  assert.equal(validateCalculationPathSubmission('x=1,5', ['x=1,5', String.raw`L=\{1,5\}`], options).accepted, false);
});

test('uses the same decimal reading for fractions and strictly declared operations', () => {
  assert.equal(proof.parseEquation(String.raw`x=\frac{1, 5}{2}`)?.right.cas, '((1.5)/(2))');
  const valid = validateEquationTransition(String.raw`1,5x=3\mid:1, 5`, 'x=2', 0, { ...options, strictDeclaredOperations: true });
  assert.equal(valid.status, 'valid');
  assert.equal(valid.reason, 'operation-applied-both-sides');
  const wrong = validateEquationTransition(String.raw`1,5x=3\mid:1, 4`, 'x=2', 0, { ...options, strictDeclaredOperations: true });
  assert.equal(wrong.status, 'invalid');
});
