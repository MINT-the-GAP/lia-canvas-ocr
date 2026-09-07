import assert from 'node:assert/strict';
import test from 'node:test';
import Algebrite from 'algebrite';

import {
  analyzeLinearSystem,
  compareLinearSystems,
  proveLinearSystemAssignments,
  proveLinearSystemConsequence,
  type LinearSystemModel,
} from '../src/math/linear-system-proof.ts';

const runtime = Algebrite;
// Repetitorium.tex 24597-24625: authored textbook examples, no learner data.
const MATERIAL_SYSTEM = ['4a=b-2', '2b=12a+8'];
function model(equations: readonly string[]): LinearSystemModel {
  const result = analyzeLinearSystem(equations, runtime);
  assert.ok(result, 'the fixture is an exact supported linear system');
  return result;
}

test('proves the material substitution, elimination and back-substitution with exact roots', () => {
  const system = model(MATERIAL_SYSTEM);
  assert.deepEqual(system.variables, ['a', 'b']);
  assert.equal(system.rank, 2);
  assert.equal(system.inconsistent, false);
  assert.deepEqual(system.uniqueSolution, { a: '-1', b: '-2' });
  for (const equation of ['b=6a+4', '4a=(6a+4)-2', '4a=6a+2', '-2a=2', '-4a=4', 'a=-1', 'b=-2']) {
    assert.equal(proveLinearSystemConsequence(system, equation, runtime), true, equation);
  }
  assert.equal(proveLinearSystemAssignments(system, ['b=6(-1)+4', '-1=a'], runtime), true);
});

test('compares complete row spaces after reordering, scaling and replacing one equation by a row sum', () => {
  const original = model(MATERIAL_SYSTEM);
  const scaled = model([String.raw`-\frac{3}{2}(2b-12a)= -12`, '8a-2b=-4']);
  const eliminated = model(['-4a=4', '4a-b=-2']);
  assert.equal(compareLinearSystems(original, scaled, runtime), true);
  assert.equal(compareLinearSystems(original, eliminated, runtime), true);
  assert.equal(compareLinearSystems(model(['b=-2', 'a=-1']), original, runtime), true);
});

test('a correct eventual assignment does not validate a false intermediate equation', () => {
  const system = model(MATERIAL_SYSTEM);
  const checks = ['4a=6a+2', '-2a=-2', 'a=-1', 'b=-2']
    .map(equation => proveLinearSystemConsequence(system, equation, runtime));
  assert.deepEqual(checks, [true, false, true, true]);
  assert.equal(proveLinearSystemAssignments(system, ['a=-1', 'b=-2'], runtime), true);
  assert.equal(proveLinearSystemConsequence(system, 'b=2', runtime), false);
});

test('two individually implied equations cannot silently replace the system by one duplicated constraint', () => {
  const original = model(MATERIAL_SYSTEM);
  const lostConstraint = model(['-8a+b=6', '-16a+2b=12']);
  assert.equal(proveLinearSystemConsequence(original, '-8a+b=6', runtime), true);
  assert.equal(proveLinearSystemConsequence(original, '-16a+2b=12', runtime), true);
  assert.equal(compareLinearSystems(original, lostConstraint, runtime), false);
  assert.equal(proveLinearSystemAssignments(lostConstraint, ['a=0', 'b=6'], runtime), null);
  assert.equal(proveLinearSystemAssignments(original, ['a=0', 'b=6'], runtime), false);
});

test('keeps decimal commas and constant fractions exact beyond floating-point precision', () => {
  const decimal = model(['0,1x+0,2y=0,3', '0,3x-0,1y=0,2']);
  const fractions = model([String.raw`\frac{x}{10}+\frac{y}{5}=\frac{3}{10}`, '3x-y=2']);
  assert.deepEqual(decimal.uniqueSolution, { x: '1', y: '1' });
  assert.equal(compareLinearSystems(decimal, fractions, runtime), true);
  const changedLastDigit = model(['0,1x+0,2y=0,3000000000000000001', '0,3x-0,1y=0,2']);
  assert.equal(compareLinearSystems(decimal, changedLastDigit, runtime), false);
  assert.equal(proveLinearSystemAssignments(changedLastDigit, ['x=1', 'y=1'], runtime), false);
});

test('proves the three-variable material example and requires every final coordinate', () => {
  // Repetitorium.tex 26205, checked against all three original equations.
  const system = model(['y=5x-4', '5-3x=z', '6=x+y+z']);
  assert.deepEqual(system.uniqueSolution, { x: '5/3', y: '13/3', z: '0' });
  assert.equal(proveLinearSystemConsequence(system, '6=3x+1', runtime), true);
  assert.equal(proveLinearSystemAssignments(system, ['z=0', String.raw`\frac{10}{6}=x`, String.raw`y=\frac{13}{3}`], runtime), true);
  assert.equal(proveLinearSystemAssignments(system, [String.raw`x=\frac{5}{3}`, String.raw`y=\frac{13}{3}`], runtime), null);
  assert.equal(proveLinearSystemAssignments(system, [String.raw`x=\frac{5}{3}`, String.raw`y=\frac{13}{3}`, 'z=10'], runtime), false);
});

test('singular systems prove only their consequences, never an arbitrary unique solution', () => {
  const singular = model(['x+y=3', '2x+2y=6']);
  assert.equal(singular.rank, 1);
  assert.equal(singular.uniqueSolution, null);
  assert.equal(proveLinearSystemConsequence(singular, '3x+3y=9', runtime), true);
  assert.equal(proveLinearSystemConsequence(singular, 'x=2', runtime), false);
  assert.equal(proveLinearSystemAssignments(singular, ['x=2', 'y=1'], runtime), null);
  assert.equal(compareLinearSystems(singular, model(['6x+6y=18']), runtime), true);
  const identity = model(['0x+0y=0']);
  assert.equal(identity.rank, 0);
  assert.equal(identity.uniqueSolution, null);
  assert.equal(proveLinearSystemConsequence(identity, '0=0', runtime), true);
  assert.equal(proveLinearSystemConsequence(identity, '0=1', runtime), false);
});

test('inconsistent systems do not prove arbitrary statements by vacuous implication', () => {
  const inconsistent = model(['x+y=3', 'x+y=4']);
  assert.equal(inconsistent.inconsistent, true);
  assert.equal(inconsistent.uniqueSolution, null);
  assert.equal(proveLinearSystemConsequence(inconsistent, 'x=123', runtime), null);
  assert.equal(proveLinearSystemAssignments(inconsistent, ['x=123', 'y=-120'], runtime), null);
  assert.equal(compareLinearSystems(inconsistent, inconsistent, runtime), null);
});

test('assignment checks distinguish incomplete, non-isolated and conflicting values', () => {
  const system = model(['x+y=3', 'x-y=1']);
  assert.equal(proveLinearSystemAssignments(system, ['x=2'], runtime), null);
  assert.equal(proveLinearSystemAssignments(system, ['x=9'], runtime), false);
  assert.equal(proveLinearSystemAssignments(system, ['2x=4', 'y=1'], runtime), null);
  assert.equal(proveLinearSystemAssignments(system, ['x=2', 'y=1', 'x=3'], runtime), false);
  assert.equal(proveLinearSystemAssignments(system, ['x=2', 'y=1', 'z=0'], runtime), null);
  assert.equal(proveLinearSystemAssignments(system, ['x=2', 'y=1', 'x=2'], runtime), true);
});

test('unsupported domains, coefficients, dimensions and nonlinear equations remain unproven', () => {
  for (const equations of [
    ['x*y=1', 'x+y=2'],
    [String.raw`\frac{x}{y}=1`, 'x+y=2'],
    [String.raw`\sqrt{2}x+y=3`, 'x-y=1'],
    ['ax+y=1', 'x+a=2'],
    ['x+y+z+w=1', 'x-y=0'],
    ['x=1', '2x=2'],
    ['x+y=1/0', 'x-y=0'],
    ['x=y=1', 'x+y=2'],
  ]) assert.equal(analyzeLinearSystem(equations, runtime), null, equations.join('; '));
  assert.equal(analyzeLinearSystem(Array(13).fill('x+y=1'), runtime), null);
  const system = model(['x+y=3', 'x-y=1']);
  assert.equal(proveLinearSystemConsequence(system, 'z=0', runtime), null);
  assert.equal(proveLinearSystemConsequence(system, 'x*y=2', runtime), null);
  assert.equal(proveLinearSystemConsequence(system, 'x/x=1', runtime), null);
});

test('unsafe powers are rejected before any CAS evaluation and a first variable power remains supported', () => {
  let calls = 0;
  const countingRuntime = { run(source: string) { calls++; return runtime.run(source); } };
  assert.equal(analyzeLinearSystem(['(x+y)^{1000000}=1', 'x-y=0'], countingRuntime), null);
  assert.equal(calls, 0);
  assert.deepEqual(model(['x^1+y=3', 'x-y=1']).uniqueSolution, { x: '2', y: '1' });
});

test('missing or failing CAS never becomes a mathematical rejection or acceptance', () => {
  const system = model(MATERIAL_SYSTEM);
  const failingRuntime = { run() { throw new Error('synthetic CAS unavailable'); } };
  assert.equal(analyzeLinearSystem(MATERIAL_SYSTEM, null), null);
  assert.equal(analyzeLinearSystem(MATERIAL_SYSTEM, failingRuntime), null);
  assert.equal(proveLinearSystemConsequence(system, 'a=-1', failingRuntime), null);
  assert.equal(proveLinearSystemAssignments(system, ['a=-1', 'b=-2'], null), null);
  assert.equal(compareLinearSystems(system, system, null), null);
});


test('reserved CAS symbols do not turn nonlinear unknowns into imaginary constants', () => {
  const linearI = model(['i+x=3', 'i-x=1']);
  assert.deepEqual(linearI.uniqueSolution, { i: '2', x: '1' });
  assert.equal(proveLinearSystemAssignments(linearI, ['i=2', 'x=1'], runtime), true);
  assert.equal(analyzeLinearSystem(['i*i+x+y=2', 'x-y=0'], runtime), null);
  assert.equal(analyzeLinearSystem(['e+x+y=3', 'x-y=1'], runtime), null);
});
