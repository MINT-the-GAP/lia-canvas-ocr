import assert from 'node:assert/strict';
import test from 'node:test';

import { generateExpectedCalculation } from '../src/math/expected-calculation.ts';

test('preserves the exact requested quadratic calculation', () => {
  assert.deepEqual(generateExpectedCalculation(String.raw`3x^{2}-7=9`), [
    String.raw`3x^{2}-7=9 \mid +7`,
    String.raw`3x^{2}=16 \mid :3`,
    String.raw`x^{2}=\frac{16}{3}`,
    String.raw`\Rightarrow x_{1,2}=\pm\frac{4}{\sqrt{3}}`,
  ]);
});

test('preserves the exact requested linear calculation', () => {
  assert.deepEqual(generateExpectedCalculation('3x-5=7'), [
    String.raw`3x-5=7 \mid +5`,
    String.raw`3x=12 \mid :3`,
    'x=4',
  ]);
});

test('solves linear equations with the variable on both sides', () => {
  assert.deepEqual(generateExpectedCalculation('2x+3=x-4'), [
    '2x+3=x-4',
    String.raw`x+7=0 \mid -7`,
    'x=-7',
  ]);
});

test('keeps the authored bracket equation before expansion and standard form', () => {
  assert.deepEqual(generateExpectedCalculation('2(x+3)=3x-4'), [
    '2(x+3)=3x-4',
    String.raw`2x+6=3x-4`,
    String.raw`x-10=0 \mid +10`,
    'x=10',
  ]);
});

test('supports reordered fractional terms and reduces them exactly', () => {
  assert.deepEqual(generateExpectedCalculation('1/3+x/2=5/6'), [
    '1/3+x/2=5/6',
    String.raw`\frac{1}{2}x+\frac{1}{3}=\frac{5}{6} \mid -\frac{1}{3}`,
    String.raw`\frac{1}{2}x=\frac{1}{2} \mid :(\frac{1}{2})`,
    'x=1',
  ]);
  assert.deepEqual(generateExpectedCalculation(String.raw`\frac{x+1}{2}=3`), [
    String.raw`\frac{x+1}{2}=3`,
    String.raw`\frac{1}{2}x+\frac{1}{2}=3 \mid -\frac{1}{2}`,
    String.raw`\frac{1}{2}x=\frac{5}{2} \mid :(\frac{1}{2})`,
    'x=5',
  ]);
});

test('parses finite English and German decimals as exact rationals', () => {
  assert.deepEqual(generateExpectedCalculation('0.5t+1=2'), [
    '0.5t+1=2',
    String.raw`\frac{1}{2}t+1=2 \mid -1`,
    String.raw`\frac{1}{2}t=1 \mid :(\frac{1}{2})`,
    't=2',
  ]);
  assert.deepEqual(generateExpectedCalculation('0,5t+1=2'), [
    '0,5t+1=2',
    String.raw`\frac{1}{2}t+1=2 \mid -1`,
    String.raw`\frac{1}{2}t=1 \mid :(\frac{1}{2})`,
    't=2',
  ]);
});

test('distinguishes a linear identity from a contradiction', () => {
  assert.deepEqual(generateExpectedCalculation('2(x+1)=2x+2'), [
    '2(x+1)=2x+2',
    String.raw`2x+2=2x+2`,
    String.raw`\Rightarrow \mathcal{L}=\mathbb{R}`,
  ]);
  assert.deepEqual(generateExpectedCalculation('2(x+1)=2x+3'), [
    '2(x+1)=2x+3',
    String.raw`2x+2=2x+3`,
    String.raw`1=0`,
    String.raw`\Rightarrow \mathcal{L}=\varnothing`,
  ]);
});

test('solves a general quadratic through standard form and discriminant', () => {
  assert.deepEqual(generateExpectedCalculation('x^2-5x+6=0'), [
    String.raw`x^{2}-5x+6=0`,
    String.raw`\Delta=(-5)^{2}-4\cdot1\cdot6=1`,
    String.raw`x_{1,2}=\frac{5\pm1}{2}`,
    String.raw`\Rightarrow x_1=3,\quad x_2=2`,
  ]);
});

test('clears rational coefficients before solving a quadratic', () => {
  assert.deepEqual(
    generateExpectedCalculation(String.raw`\frac{1}{2}z^2-\frac{3}{2}z+1=0`),
    [
      String.raw`\frac{1}{2}z^{2}-\frac{3}{2}z+1=0`,
      String.raw`z^{2}-3z+2=0`,
      String.raw`\Delta=(-3)^{2}-4\cdot1\cdot2=1`,
      String.raw`z_{1,2}=\frac{3\pm1}{2}`,
      String.raw`\Rightarrow z_1=2,\quad z_2=1`,
    ],
  );
});

test('reports a quadratic without real roots as an empty real solution set', () => {
  assert.deepEqual(generateExpectedCalculation('x^2+x+1=0'), [
    String.raw`x^{2}+x+1=0`,
    String.raw`\Delta=1^{2}-4\cdot1\cdot1=-3<0`,
    String.raw`\Rightarrow \mathcal{L}_{\mathbb{R}}=\varnothing`,
  ]);
});

test('handles repeated quadratic roots and quadratics on both sides', () => {
  assert.deepEqual(generateExpectedCalculation('(x+1)^2=0'), [
    String.raw`(x+1)^{2}=0`,
    String.raw`x^{2}+2x+1=0`,
    String.raw`\Delta=2^{2}-4\cdot1\cdot1=0`,
    String.raw`\Rightarrow x=-1`,
  ]);
  assert.deepEqual(generateExpectedCalculation('2x^2+x=x^2+5'), [
    String.raw`2x^{2}+x=x^{2}+5`,
    String.raw`x^{2}+x-5=0`,
    String.raw`\Delta=1^{2}-4\cdot1\cdot(-5)=21`,
    String.raw`\Rightarrow x_{1,2}=\frac{-1\pm\sqrt{21}}{2}`,
  ]);
});

test('simplifies a manageable square factor in an irrational discriminant', () => {
  const lines = generateExpectedCalculation('x^2-2x-2=0');
  assert.ok(lines);
  assert.equal(lines.at(-1), String.raw`\Rightarrow x_{1,2}=1\pm\sqrt{3}`);
});

test('solves exact cubic and fourth-power equations over the reals', () => {
  assert.deepEqual(generateExpectedCalculation('2x^3=16'), [
    String.raw`2x^{3}=16 \mid :2`,
    String.raw`x^{3}=8`,
    String.raw`\Rightarrow x=2`,
  ]);
  assert.deepEqual(generateExpectedCalculation('x^3+1=0'), [
    String.raw`x^{3}+1=0 \mid -1`,
    String.raw`x^{3}=-1`,
    String.raw`\Rightarrow x=-1`,
  ]);
  assert.deepEqual(generateExpectedCalculation('16y^4=81'), [
    String.raw`16y^{4}=81 \mid :16`,
    String.raw`y^{4}=\frac{81}{16}`,
    String.raw`\Rightarrow y_{1,2}=\pm\frac{3}{2}`,
  ]);
});

test('supports exact irrational pure-power roots and real empty sets', () => {
  assert.deepEqual(generateExpectedCalculation('x^3=2'), [
    String.raw`x^{3}=2`,
    String.raw`\Rightarrow x=\sqrt[3]{2}`,
  ]);
  assert.deepEqual(generateExpectedCalculation('x^4+2=0'), [
    String.raw`x^{4}+2=0 \mid -2`,
    String.raw`x^{4}=-2`,
    String.raw`\Rightarrow \mathcal{L}_{\mathbb{R}}=\varnothing`,
  ]);
});

test('collects pure powers from both sides before extracting roots', () => {
  assert.deepEqual(generateExpectedCalculation('2x^3+1=x^3+9'), [
    String.raw`2x^{3}+1=x^{3}+9`,
    String.raw`x^{3}-8=0 \mid +8`,
    String.raw`x^{3}=8`,
    String.raw`\Rightarrow x=2`,
  ]);
  assert.deepEqual(generateExpectedCalculation('2x^2+1=x^2+5'), [
    String.raw`2x^{2}+1=x^{2}+5`,
    String.raw`x^{2}-4=0 \mid +4`,
    String.raw`x^{2}=4`,
    String.raw`\Rightarrow x_{1,2}=\pm2`,
  ]);
});

test('uses exactly one freely named Latin variable', () => {
  assert.deepEqual(generateExpectedCalculation('2y+3=y-4'), [
    '2y+3=y-4',
    String.raw`y+7=0 \mid -7`,
    'y=-7',
  ]);
  assert.equal(generateExpectedCalculation('x+y=2'), null);
});

test('rejects unsupported algebra instead of guessing steps', () => {
  for (const equation of [
    'x^3+x=0',
    'x^4+x=0',
    '1/x=2',
    String.raw`\frac{1}{x}=2`,
    'sin(x)=0',
    'x^5=1',
    'x=1=2',
    '9007199254740991x-1=9007199254740992',
    '',
  ]) {
    assert.equal(generateExpectedCalculation(equation), null, equation);
  }
});
