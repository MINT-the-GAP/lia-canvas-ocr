import assert from 'node:assert/strict';
import test from 'node:test';

import Algebrite from 'algebrite';

import {
  extractCalculationEquation,
  MAX_CALCULATION_ANSWER_LENGTH,
  serializeCalculationSubmission,
  validateCalculationSubmission,
  validateEquationTransition,
  validateEquationTransitions,
} from '../src/math/equivalence.ts';
import { equivalenceStressCases } from './fixtures/equivalence-stress-cases.mts';

(globalThis as any).Algebrite = Algebrite;

test('validates a complete linear chain and preserves transition indexes', () => {
  const checks = validateEquationTransitions([
    String.raw`3x-7=5 \mid +7`,
    String.raw`3x=12 \mid :3`,
    'x=4',
  ]);

  assert.deepEqual(checks.map(check => check.status), ['valid', 'valid']);
  assert.deepEqual(checks.map(check => check.reason), [
    'operation-applied-both-sides',
    'operation-applied-both-sides',
  ]);
  assert.deepEqual(checks.map(check => [check.fromIndex, check.toIndex]), [
    [0, 1],
    [1, 2],
  ]);
});

test('validates the exact three-line chain from the reported calculation failure', () => {
  const checks = validateEquationTransitions([
    String.raw`7x-5=12 \mid +5`,
    String.raw`7x=17 \mid :7`,
    String.raw`x=\frac{17}{7}`,
  ]);

  assert.deepEqual(checks.map(check => check.status), ['valid', 'valid']);
  assert.ok(checks.every(
    check => check.reason === 'operation-applied-both-sides'
  ));
});

test('validates the explicit quadratic operations and both real roots', () => {
  const checks = validateEquationTransitions([
    String.raw`5x^2-7=-4 \mid +7`,
    String.raw`5x^2=3 \mid :5`,
    String.raw`x^2=\frac{3}{5}`,
    String.raw`x_{1,2}=\pm\sqrt{\frac{3}{5}}`,
  ]);

  assert.deepEqual(checks.map(check => check.status), [
    'valid',
    'valid',
    'valid',
  ]);
  assert.deepEqual(checks.map(check => check.reason), [
    'operation-applied-both-sides',
    'operation-applied-both-sides',
    'quadratic-root-solutions',
  ]);
  assert.deepEqual(checks.slice(0, 2).map(check => check.operation), ['+7', ':5']);
});

test('validates both quadratic roots after simplifying the exact magnitude', () => {
  const checks = validateEquationTransitions([
    String.raw`8x^2-7=11 \mid +7`,
    String.raw`8x^2=18 \mid :8`,
    String.raw`x^2=\frac{9}{4}`,
    String.raw`x_{1,2}=\pm\frac{3}{2}`,
  ]);

  assert.deepEqual(checks.map(check => check.status), [
    'valid',
    'valid',
    'valid',
  ]);
  assert.deepEqual(checks.map(check => check.reason), [
    'operation-applied-both-sides',
    'operation-applied-both-sides',
    'quadratic-root-solutions',
  ]);
});

test('validates an exact principal-radical magnitude over a positive denominator', () => {
  const check = validateEquationTransition(
    String.raw`x^2=\frac{3}{4}`,
    String.raw`\Rightarrow x_{1,2}=\pm\frac{\sqrt{3}}{2}`,
  );

  assert.equal(check.status, 'valid');
  assert.equal(check.reason, 'quadratic-root-solutions');
  assert.equal(check.messageKey, 'ocr.plus.validation.validRoots');
});

test('validates the reported Rarr solution with a radical denominator', () => {
  const checks = validateEquationTransitions([
    String.raw`2 x ^ { 2 } - 4 = 5 \mid + 4`,
    String.raw`2 x ^ { 2 } = 9 \mid : 2`,
    String.raw`x ^ { 2 } = \frac { 9 } { 2 }`,
    String.raw`\Rarr x _ { 1, 2 } = \pm \frac { 3 } { \sqrt { 2 } }`,
  ]);

  assert.deepEqual(checks.map(check => check.status), [
    'valid',
    'valid',
    'valid',
  ]);
  assert.deepEqual(checks.map(check => check.reason), [
    'operation-applied-both-sides',
    'operation-applied-both-sides',
    'quadratic-root-solutions',
  ]);
});

test('validates the reported cubic-root solution as the unique real root', () => {
  const checks = validateEquationTransitions([
    String.raw`3 x ^ { 3 } - 4 = 0 \mid + 4`,
    String.raw`3 x ^ { 3 } = 4 \mid : 3`,
    String.raw`x ^ { 3 } = \frac { 4 } { 3 }`,
    String.raw`\Rarr x = \sqrt [ 3 ] { \frac { 4 } { 3 } }`,
  ]);

  assert.deepEqual(checks.map(check => check.status), [
    'valid',
    'valid',
    'valid',
  ]);
  assert.deepEqual(checks.map(check => check.reason), [
    'operation-applied-both-sides',
    'operation-applied-both-sides',
    'cubic-root-solution',
  ]);
  assert.equal(checks[2].messageKey, 'ocr.plus.validation.validCubeRoot');
});

test('accepts negative cubic radicands but rejects unsafe root variants', () => {
  const negative = validateEquationTransition(
    String.raw`x^3=-8`,
    String.raw`\Rarr x=\sqrt[3]{-8}`,
  );
  assert.equal(negative.status, 'valid');
  assert.equal(negative.reason, 'cubic-root-solution');

  const reversed = validateEquationTransition(
    String.raw`-\frac{27}{64}=t^3`,
    String.raw`\Rarr t=\sqrt[3]{-\frac{27}{64}}`,
  );
  assert.equal(reversed.status, 'valid');
  assert.equal(reversed.reason, 'cubic-root-solution');

  const cases: Array<[string, string]> = [
    [String.raw`x^3=\frac{4}{3}`, String.raw`\Rarr x=\sqrt[2]{\frac{4}{3}}`],
    [String.raw`x^3=\frac{4}{3}`, String.raw`\Rarr x=\sqrt[4]{\frac{4}{3}}`],
    [String.raw`x^3=\frac{4}{3}`, String.raw`\Rarr x=\sqrt[03]{\frac{4}{3}}`],
    [String.raw`x^3=\frac{4}{3}`, String.raw`\Rarr x=\sqrt[1+2]{\frac{4}{3}}`],
    [String.raw`x^3=\frac{4}{3}`, String.raw`\Rarr x=\sqrt{\frac{4}{3}}`],
    [String.raw`x^3=\frac{4}{3}`, String.raw`\Rarr y=\sqrt[3]{\frac{4}{3}}`],
    [String.raw`x^3=\frac{4}{3}`, String.raw`\Rarr x_{1,2}=\sqrt[3]{\frac{4}{3}}`],
    [String.raw`x^3=\frac{4}{3}`, String.raw`\Rarr x=\pm\sqrt[3]{\frac{4}{3}}`],
    [String.raw`x^3=\frac{4}{3}`, String.raw`\Rarr x=\sqrt[3]{\frac{5}{3}}`],
    [String.raw`x^2=\frac{4}{3}`, String.raw`\Rarr x=\sqrt[3]{\frac{4}{3}}`],
    [String.raw`x^3=a`, String.raw`\Rarr x=\sqrt[3]{a}`],
    [String.raw`x^3=1/0`, String.raw`\Rarr x=\sqrt[3]{1/0}`],
    [String.raw`x^3=\frac{4}{3} \mid +0`, String.raw`\Rarr x=\sqrt[3]{\frac{4}{3}}`],
    [String.raw`x^3=\frac{4}{3}`, String.raw`\Rarr x=\sqrt[3]{\frac{4}{3}}+1`],
  ];

  for (const [from, to] of cases) {
    const check = validateEquationTransition(from, to);
    assert.equal(check.status, 'unknown', from + ' -> ' + to);
    assert.equal(check.reason, 'unsupported-or-unproven', from + ' -> ' + to);
  }
});

test('validates the reported fourth-root solution as both real roots', () => {
  const checks = validateEquationTransitions([
    String.raw`3 m ^ { 4 } = 5 \mid : 3`,
    String.raw`m ^ { 4 } = \frac { 5 } { 3 }`,
    String.raw`\Rarr m _ { 1, 2 } = \pm \sqrt [ 4 ] { \frac { 5 } { 3 } }`,
  ]);

  assert.deepEqual(checks.map(check => check.status), ['valid', 'valid']);
  assert.deepEqual(checks.map(check => check.reason), [
    'operation-applied-both-sides',
    'quartic-root-solutions',
  ]);
  assert.equal(checks[1].messageKey, 'ocr.plus.validation.validFourthRoot');
});

test('keeps unsafe or mismatched fourth-root targets unproven', () => {
  const cases: Array<[string, string]> = [
    [String.raw`m^4=-\frac{5}{3}`, String.raw`\Rarr m_{1,2}=\pm\sqrt[4]{-\frac{5}{3}}`],
    [String.raw`m^4=\frac{5}{3}`, String.raw`\Rarr m_{1,2}=\pm\sqrt[4]{\frac{4}{3}}`],
    [String.raw`m^4=\frac{5}{3}`, String.raw`\Rarr n_{1,2}=\pm\sqrt[4]{\frac{5}{3}}`],
    [String.raw`m^4=\frac{5}{3}`, String.raw`\Rarr m_{1,3}=\pm\sqrt[4]{\frac{5}{3}}`],
    [String.raw`m^4=\frac{5}{3}`, String.raw`\Rarr m=\pm\sqrt[4]{\frac{5}{3}}`],
    [String.raw`m^4=\frac{5}{3}`, String.raw`\Rarr m_{1,2}=\pm\sqrt[3]{\frac{5}{3}}`],
    [String.raw`m^4=\frac{5}{3}`, String.raw`\Rarr m_{1,2}=\pm\sqrt[04]{\frac{5}{3}}`],
    [String.raw`m^4=a`, String.raw`\Rarr m_{1,2}=\pm\sqrt[4]{a}`],
  ];

  for (const [from, to] of cases) {
    const check = validateEquationTransition(from, to);
    assert.equal(check.status, 'unknown', from + ' -> ' + to);
    assert.equal(check.reason, 'unsupported-or-unproven', from + ' -> ' + to);
  }
});

test('reports a missing plus-minus sign for a proven fourth-root target', () => {
  const check = validateEquationTransition(
    String.raw`m^4=\frac{5}{3}`,
    String.raw`\Rarr m_{1,2}=\sqrt[4]{\frac{5}{3}}`,
  );

  assert.equal(check.status, 'unknown');
  assert.equal(check.reason, 'missing-plus-minus');
  assert.equal(check.messageKey, 'ocr.plus.validation.missingPlusMinus');
});

test('keeps unsafe or mismatched radical denominators unknown', () => {
  const cases: Array<[string, string]> = [
    [String.raw`x^2=\frac{9}{2}`, String.raw`\Rarr x_{1,2}=\pm\frac{2}{\sqrt{2}}`],
    [String.raw`x^2=\frac{9}{2}`, String.raw`\Rarr x_{1,2}=\pm\frac{3}{\sqrt{3}}`],
    [String.raw`x^2=\frac{9}{2}`, String.raw`\Rarr x_{1,2}=\pm\frac{3}{\sqrt{0}}`],
    [String.raw`x^2=\frac{9}{2}`, String.raw`\Rarr x_{1,2}=\pm\frac{3}{\sqrt{a}}`],
    [String.raw`x^2=\frac{9}{2}`, String.raw`\Rarr x_{1,2}=\frac{3}{\sqrt{2}}`],
  ];

  for (const [from, to] of cases) {
    const check = validateEquationTransition(from, to);
    assert.equal(check.status, 'unknown', from + ' -> ' + to);
  }
});

test('keeps unsafe or mismatched radical magnitudes unknown', () => {
  const cases: Array<[string, string]> = [
    [String.raw`x^2=\frac{3}{4}`, String.raw`x_{1,2}=\pm\frac{\sqrt{2}}{2}`],
    [String.raw`x^2=\frac{3}{4}`, String.raw`x_{1,2}=\pm\frac{\sqrt{3}}{3}`],
    [String.raw`x^2=\frac{3}{4}`, String.raw`x_{1,2}=\frac{\sqrt{3}}{2}`],
    [String.raw`x^2=-\frac{3}{4}`, String.raw`x_{1,2}=\pm\frac{\sqrt{3}}{2}`],
    [String.raw`y^2=\frac{3}{4}`, String.raw`x_{1,2}=\pm\frac{\sqrt{3}}{2}`],
    [String.raw`x^2=\frac{3}{4}`, String.raw`x_{1,2}=\pm\frac{\sqrt{a}}{2}`],
    [String.raw`x^2=\frac{3}{4}`, String.raw`x_{1,2}=\pm\frac{\sqrt{3}}{a}`],
  ];

  for (const [from, to] of cases) {
    const check = validateEquationTransition(from, to);
    assert.equal(check.status, 'unknown', from + ' -> ' + to);
    assert.equal(check.reason, 'unsupported-or-unproven', from + ' -> ' + to);
  }
});

test('keeps unsafe or unproven explicit quadratic magnitudes unknown', () => {
  const cases: Array<[string, string]> = [
    [String.raw`x^2=\frac{9}{4}`, String.raw`x_{1,2}=\pm\frac{2}{3}`],
    [String.raw`x^2=\frac{9}{4}`, String.raw`y_{1,2}=\pm\frac{3}{2}`],
    [String.raw`x^2=\frac{9}{4}`, String.raw`x_{1,2}=\pm a`],
    [String.raw`x^2=-\frac{9}{4}`, String.raw`x_{1,2}=\pm\frac{3}{2}`],
    [String.raw`x^2=\frac{9}{4}`, String.raw`x_{1,2}=\frac{3}{2}`],
    [String.raw`x^2=\frac{9}{4}`, String.raw`x=\pm\frac{3}{2}`],
  ];

  for (const [from, to] of cases) {
    const check = validateEquationTransition(from, to);
    assert.equal(check.status, 'unknown', from + ' -> ' + to);
    assert.equal(check.reason, 'unsupported-or-unproven', from + ' -> ' + to);
  }
});

test('checks an explicit divide bar and accepts the indexed square-root solution notation', () => {
  const checks = validateEquationTransitions([
    String.raw`3x^2=7 \mid :3`,
    String.raw`x^2=\frac{7}{3}`,
    String.raw`\Rightarrow x_{12}=\pm\sqrt{\frac{7}{3}}`,
  ]);

  assert.deepEqual(checks.map(check => check.status), ['valid', 'valid']);
  assert.deepEqual(checks.map(check => check.reason), [
    'operation-applied-both-sides',
    'quadratic-root-solutions',
  ]);
  assert.equal(checks[0].operation, ':3');
});

test('continues after an incorrect step and accepts the OCR arrow with an unbraced root', () => {
  const checks = validateEquationTransitions([
    String.raw`3x^2-5=12 \mid +5`,
    String.raw`3x^2=18 \mid :3`,
    String.raw`x^2=6`,
    String.raw`\to x_{1,2}=\pm\sqrt6`,
  ]);

  assert.deepEqual(checks.map(check => check.status), [
    'invalid',
    'valid',
    'valid',
  ]);
  assert.equal(checks[1].reason, 'operation-applied-both-sides');
  assert.equal(checks[2].reason, 'quadratic-root-solutions');
});

test('accepts only narrow leading-arrow and unbraced-root OCR variants', () => {
  for (const target of [
    String.raw`\rightarrow x_{1,2}=\pm\sqrt 6`,
    String.raw`→ x_{1,2}=\pm\sqrt6`,
  ]) {
    const check = validateEquationTransition('x^2=6', target);
    assert.equal(check.status, 'valid', target);
    assert.equal(check.reason, 'quadratic-root-solutions', target);
  }

  for (const target of [
    String.raw`\to x_{1,2}=\pm\sqrt12`,
    String.raw`\to x_{1,2}=\pm\sqrt6+1`,
    String.raw`\to x_{1,2}=\pm\sqrt x`,
    String.raw`\to x_{1,2}=\sqrt6`,
    String.raw`\to x_{1,2}=\pm\sqrt7`,
    String.raw`x_{1,2}\to=\pm\sqrt6`,
    String.raw`\leftarrow x_{1,2}=\pm\sqrt6`,
  ]) {
    const check = validateEquationTransition('x^2=6', target);
    assert.equal(check.status, 'unknown', target);
  }
});

test('reports a missing plus-minus sign without inventing the second root', () => {
  const check = validateEquationTransition(
    String.raw`x^2=\frac{7}{3}`,
    String.raw`\Rightarrow x_{1,2}=\sqrt{\frac{7}{3}}`,
  );
  assert.equal(check.status, 'unknown');
  assert.equal(check.reason, 'missing-plus-minus');
  assert.equal(check.messageKey, 'ocr.plus.validation.missingPlusMinus');
});

test('does not invent a missing transformation bar from an ambiguous colon', () => {
  const check = validateEquationTransition('3x=6:3', 'x=2');
  assert.equal(check.status, 'unknown');
  assert.equal(check.reason, 'unsupported-or-unproven');
});

test('accepts only the braced slash-confused pair of quadratic solution indices', () => {
  const recognizedPair = validateEquationTransition(
    'x^2=8/3',
    String.raw`\Rightarrow x_{1/2}=\pm\sqrt{8/3}`,
  );
  assert.equal(recognizedPair.status, 'valid');
  assert.equal(recognizedPair.reason, 'quadratic-root-solutions');

  const genuineFractionContexts = [
    String.raw`\Rightarrow x_1/2=\pm\sqrt{8/3}`,
    String.raw`\Rightarrow x_{\frac{1}{2}}=\pm\sqrt{8/3}`,
    String.raw`\Rightarrow x_{1/3}=\pm\sqrt{8/3}`,
  ];
  for (const target of genuineFractionContexts) {
    const check = validateEquationTransition('x^2=8/3', target);
    assert.equal(check.status, 'unknown', target);
  }
});

test('keeps unbraced solution indices unsupported', () => {
  const check = validateEquationTransition(
    'x^2=4',
    String.raw`x_12=\pm\sqrt{4}`,
  );
  assert.equal(check.status, 'unknown');
});

test('keeps ambiguous or incomplete square-root notations unproven', () => {
  const cases: Array<[string, string]> = [
    [String.raw`x^2=\frac{7}{3}`, String.raw`x=\sqrt{\frac{7}{3}}`],
    [String.raw`x^2=\frac{7}{3}`, String.raw`x_{1,2}=\pm\sqrt{\frac{5}{3}}`],
    [String.raw`x^2=-1`, String.raw`x_{1,2}=\pm\sqrt{-1}`],
    [String.raw`y^2=4`, String.raw`x_{1,2}=\pm\sqrt{4}`],
  ];
  for (const [from, to] of cases) {
    const check = validateEquationTransition(from, to);
    assert.equal(check.status, 'unknown', from + ' -> ' + to);
  }
  const ambiguousColon = validateEquationTransition('x=6:3', 'x=2');
  assert.equal(ambiguousColon.status, 'unknown');
});

test('accepts every transition in the existing equivalence stress corpus', () => {
  for (const stressCase of equivalenceStressCases) {
    const lines = stressCase.lines.map(line =>
      line.operation ? line.main + String.raw` \mid ` + line.operation : line.main
    );
    const checks = validateEquationTransitions(lines);
    assert.ok(
      checks.every(check => check.status === 'valid'),
      stressCase.id + ': ' + JSON.stringify(checks),
    );
  }
});

test('pinpoints a missing transformation on the left side from the reference scenario', () => {
  const check = validateEquationTransition(
    String.raw`E_{kin}+mgh=\frac{1}{2}mv^2 \mid \cdot 2`,
    String.raw`2E_{kin}+mgh=mv^2 \mid :m`,
  );

  assert.equal(check.status, 'invalid');
  assert.equal(check.reason, 'operation-missing-left');
  assert.equal(check.messageKey, 'ocr.plus.validation.invalidLeft');
  assert.equal(check.side, 'left');
  assert.equal(check.operation, String.raw`\cdot 2`);
});

test('treats juxtaposed physics symbols as products while preserving structured identifiers', () => {
  const lines = [
    String.raw`E_{kin}+mgh=\frac{1}{2}mv^2 \mid \cdot 2`,
    String.raw`2E_{kin}+2mgh=mv^2 \mid :m`,
    String.raw`\frac{2E_{kin}}{m}+2gh=v^2`,
  ];

  const withoutAssumption = validateEquationTransitions(lines);
  assert.deepEqual(
    withoutAssumption.map(check => check.status),
    ['valid', 'unknown'],
  );
  assert.equal(withoutAssumption[1].reason, 'domain-uncertain');

  const withPhysicalMassAssumption = validateEquationTransitions(lines, {
    nonZeroSymbols: ['m'],
  });
  assert.deepEqual(
    withPhysicalMassAssumption.map(check => check.status),
    ['valid', 'valid'],
  );
  assert.ok(withPhysicalMassAssumption.every(
    check => check.reason === 'operation-applied-both-sides'
  ));
});

test('does not overclaim the square-root choice at the end of the physics chain', () => {
  const check = validateEquationTransition(
    String.raw`\frac{2E_{kin}}{m}+2gh=v^2`,
    String.raw`v=\sqrt{\frac{2E_{kin}}{m}+2gh}`,
    0,
    { nonZeroSymbols: ['m'] },
  );

  assert.equal(check.status, 'unknown');
  assert.equal(check.reason, 'domain-uncertain');
});

test('pinpoints a missing transformation on the right side', () => {
  const check = validateEquationTransition(
    String.raw`3x=12 \mid :3`,
    'x=12',
  );

  assert.equal(check.status, 'invalid');
  assert.equal(check.reason, 'operation-missing-right');
  assert.equal(check.side, 'right');
});

test('marks both sides when neither follows the stated operation', () => {
  const check = validateEquationTransition(
    '3x=12 \\mid :3',
    '2x=7',
  );

  assert.equal(check.status, 'invalid');
  assert.equal(check.reason, 'operation-mismatch-both');
  assert.equal(check.side, 'both');
});

test('falls back to equation equivalence when neither side follows the annotation literally', () => {
  const check = validateEquationTransition(
    String.raw`3x=12 \mid :3`,
    '2x=8',
  );

  assert.equal(check.status, 'valid');
  assert.equal(check.reason, 'equivalent-linear-equations');
  assert.equal(check.messageKey, 'ocr.plus.validation.validEquivalent');
});

test('proves equivalent and different one-variable linear equations', () => {
  const equivalent = validateEquationTransition('5x-12=3x+6', '2x=18');
  assert.equal(equivalent.status, 'valid');
  assert.equal(equivalent.reason, 'equivalent-linear-equations');

  const different = validateEquationTransition('3x=12', 'x=5');
  assert.equal(different.status, 'invalid');
  assert.equal(different.reason, 'different-linear-solutions');
  assert.equal(different.messageKey, 'ocr.plus.validation.invalidEquivalent');
});

test('normalizes TeX fractions and decimal commas in safe linear steps', () => {
  const fraction = validateEquationTransition(
    String.raw`\frac{2}{3}x=6 \mid \cdot \frac{3}{2}`,
    'x=9',
  );
  assert.equal(fraction.status, 'valid');
  assert.equal(fraction.reason, 'operation-applied-both-sides');

  const decimal = validateEquationTransition('1,5x=3', 'x=2');
  assert.equal(decimal.status, 'valid');
});

test('returns unknown for variable denominators and symbolic division assumptions', () => {
  const rationalDomain = validateEquationTransition(
    String.raw`\frac{x}{x-1}=2`,
    'x=2(x-1)',
  );
  assert.equal(rationalDomain.status, 'unknown');
  assert.equal(rationalDomain.reason, 'domain-uncertain');
  assert.equal(rationalDomain.messageKey, 'ocr.plus.validation.unknownDomain');

  const symbolicDivision = validateEquationTransition(
    String.raw`mx=m \mid :m`,
    'x=1',
  );
  assert.equal(symbolicDivision.status, 'unknown');
  assert.equal(symbolicDivision.reason, 'domain-uncertain');
});

test('does not call unsupported or malformed input wrong', () => {
  const unsupported = validateEquationTransition(
    String.raw`\sin(x)=0`,
    'x=0',
  );
  assert.equal(unsupported.status, 'unknown');
  assert.equal(unsupported.reason, 'unsupported-or-unproven');

  const malformed = validateEquationTransition('x=2=2', 'x=2');
  assert.equal(malformed.status, 'unknown');

  const multivariable = validateEquationTransition('x+y=2', '2x+2y=4');
  assert.equal(multivariable.status, 'unknown');
});

test('reports the missing imported CAS explicitly and never marks the step wrong', () => {
  const scope = globalThis as any;
  const previous = scope.Algebrite;
  delete scope.Algebrite;
  try {
    const check = validateEquationTransition(
      String.raw`3x-5=8 \mid +5`,
      String.raw`3x=13 \mid :3`,
    );

    assert.equal(check.status, 'unknown');
    assert.equal(check.reason, 'cas-unavailable');
    assert.equal(check.messageKey, 'ocr.plus.validation.casUnavailable');
  } finally {
    scope.Algebrite = previous;
  }
});

test('distinguishes identities from contradictions conservatively', () => {
  assert.equal(
    validateEquationTransition('2x=2x', '0=0').status,
    'valid',
  );
  assert.equal(
    validateEquationTransition('2x=2x', '0=1').status,
    'invalid',
  );
});

test('returns no checks when there is no adjacent pair', () => {
  assert.deepEqual(validateEquationTransitions([]), []);
  assert.deepEqual(validateEquationTransitions(['x=1']), []);
});

test('extracts the native quiz equation from a calculation row', () => {
  assert.equal(
    extractCalculationEquation(String.raw`3x-5=7 \mid +5`),
    '3x-5=7',
  );
  assert.equal(
    extractCalculationEquation(String.raw`$3x=12 | :3$`),
    '3x=12',
  );
  assert.equal(
    extractCalculationEquation(String.raw`$x^{2}=16 \mid :4$`),
    'x^{2}=16',
  );
  assert.equal(extractCalculationEquation('$x=4$'), 'x=4');
});

test('serializes and accepts a complete linear calculation submission', () => {
  const lines = [
    String.raw`3x-5=7 \mid +5`,
    String.raw`3x=12 \mid :3`,
    'x=4',
  ];
  const answer = serializeCalculationSubmission(lines);

  assert.equal(answer, JSON.stringify(lines));

  const grade = validateCalculationSubmission('3x-5=7', answer);
  assert.equal(grade.accepted, true);
  assert.equal(grade.outcome, 'correct');
  assert.deepEqual(grade.lines, lines);
  assert.deepEqual(grade.promptCheck, {
    status: 'valid',
    reason: 'prompt-match',
  });
  assert.deepEqual(
    grade.transitionChecks.map(check => check.status),
    ['valid', 'valid'],
  );
  assert.deepEqual(grade.finalCheck, {
    status: 'valid',
    reason: 'solved-variable',
  });
  assert.equal(grade.firstProblem, undefined);
});

test('requires a syntactically isolated variable in the terminal linear row', () => {
  for (const terminal of ['2x-x=4', 'x+(x-x)=4', 'x*1=4']) {
    const grade = validateCalculationSubmission('3x=12', [
      String.raw`3x=12 \mid :3`,
      terminal,
    ]);

    assert.equal(grade.transitionChecks[0].status, 'valid');
    assert.equal(grade.accepted, false);
    assert.equal(grade.outcome, 'incomplete');
    assert.deepEqual(grade.finalCheck, {
      status: 'incomplete',
      reason: 'not-isolated',
    });
  }

  const parenthesized = validateCalculationSubmission('3x=12', [
    String.raw`3x=12 \mid :3`,
    String.raw`\left((x)\right)=4`,
  ]);
  assert.equal(parenthesized.accepted, true);
  assert.deepEqual(parenthesized.finalCheck, {
    status: 'valid',
    reason: 'solved-variable',
  });
});

test('rejects empty JSON rows and oversized serialized answers', () => {
  const emptyJsonRow = validateCalculationSubmission(
    '3x=12',
    JSON.stringify([String.raw`3x=12 \mid :3`, ' ', 'x=4']),
  );
  assert.equal(emptyJsonRow.accepted, false);
  assert.equal(emptyJsonRow.outcome, 'unknown');
  assert.equal(emptyJsonRow.firstProblem?.reason, 'invalid-format');

  const emptyArrayRow = validateCalculationSubmission('3x=12', [
    String.raw`3x=12 \mid :3`,
    '',
    'x=4',
  ]);
  assert.equal(emptyArrayRow.accepted, false);
  assert.equal(emptyArrayRow.firstProblem?.reason, 'invalid-format');

  const oversizedLine = 'x'.repeat(MAX_CALCULATION_ANSWER_LENGTH + 1);
  assert.equal(serializeCalculationSubmission([oversizedLine]), '');
  const oversizedArray = validateCalculationSubmission('x=1', [
    'x=1',
    oversizedLine,
  ]);
  assert.equal(oversizedArray.accepted, false);
  assert.equal(oversizedArray.outcome, 'unknown');
  assert.equal(oversizedArray.firstProblem?.reason, 'invalid-format');
});

test('rejects a valid solution path copied from a different task', () => {
  const answer = serializeCalculationSubmission([
    String.raw`3x-5=8 \mid +5`,
    String.raw`3x=13 \mid :3`,
    String.raw`x=\frac{13}{3}`,
  ]);

  const grade = validateCalculationSubmission('3x-5=7', answer);
  assert.equal(grade.accepted, false);
  assert.equal(grade.outcome, 'incorrect');
  assert.deepEqual(grade.promptCheck, {
    status: 'invalid',
    reason: 'prompt-mismatch',
  });
  assert.deepEqual(grade.firstProblem, {
    stage: 'prompt',
    lineIndex: 0,
    reason: 'prompt-mismatch',
  });
});

test('rejects an incorrect middle transition', () => {
  const grade = validateCalculationSubmission('3x-5=7', [
    String.raw`3x-5=7 \mid +5`,
    String.raw`3x=13 \mid :3`,
    String.raw`x=\frac{13}{3}`,
  ]);

  assert.equal(grade.accepted, false);
  assert.equal(grade.outcome, 'incorrect');
  assert.equal(grade.transitionChecks[0].status, 'invalid');
  assert.deepEqual(grade.firstProblem, {
    stage: 'transition',
    lineIndex: 0,
    reason: grade.transitionChecks[0].reason,
  });
});

test('enforces a declared operation even when the next equation is equivalent', () => {
  const grade = validateCalculationSubmission('3x=12', [
    String.raw`3x=12 \mid :3`,
    '2x=8',
    'x=4',
  ]);

  assert.equal(grade.accepted, false);
  assert.equal(grade.outcome, 'incorrect');
  assert.equal(grade.transitionChecks[0].status, 'invalid');
  assert.equal(grade.transitionChecks[0].reason, 'operation-mismatch-both');
  assert.deepEqual(grade.firstProblem, {
    stage: 'transition',
    lineIndex: 0,
    reason: 'operation-mismatch-both',
  });
});

test('reports a mathematically unfinished submission as incomplete', () => {
  const grade = validateCalculationSubmission('3x-5=7', [
    String.raw`3x-5=7 \mid +5`,
    '3x=12',
  ]);

  assert.equal(grade.accepted, false);
  assert.equal(grade.outcome, 'incomplete');
  assert.deepEqual(grade.finalCheck, {
    status: 'incomplete',
    reason: 'not-isolated',
  });
  assert.deepEqual(grade.firstProblem, {
    stage: 'final',
    lineIndex: 1,
    reason: 'not-isolated',
  });
});

test('accepts a complete quadratic root solution path', () => {
  const lines = [
    String.raw`5x^2-7=-4 \mid +7`,
    String.raw`5x^2=3 \mid :5`,
    String.raw`x^2=\frac{3}{5}`,
    String.raw`\Rightarrow x_{1,2}=\pm\sqrt{\frac{3}{5}}`,
  ];
  const grade = validateCalculationSubmission(
    '5x^2-7=-4',
    serializeCalculationSubmission(lines),
  );

  assert.equal(grade.accepted, true);
  assert.equal(grade.outcome, 'correct');
  assert.equal(
    grade.transitionChecks.at(-1)?.reason,
    'quadratic-root-solutions',
  );
  assert.deepEqual(grade.finalCheck, {
    status: 'valid',
    reason: 'solved-root-set',
  });
});

test('accepts the screenshot path when OCR TeX differs from the authored spelling', () => {
  const lines = [
    String.raw`3x^2 - 7 = 9 \mid +7`,
    String.raw`3x^2 = 16 \mid :3`,
    String.raw`x^2 = \frac{16}{3}`,
    String.raw`\Rightarrow x_{1,2} = \pm \frac{4}{\sqrt{3}}`,
  ];
  const grade = validateCalculationSubmission(
    '3x^{2}-7=9',
    serializeCalculationSubmission(lines),
  );

  assert.equal(grade.accepted, true);
  assert.deepEqual(grade.promptCheck, {
    status: 'valid',
    reason: 'prompt-match',
  });
  assert.deepEqual(
    grade.transitionChecks.map(check => check.status),
    ['valid', 'valid', 'valid'],
  );
  assert.deepEqual(grade.finalCheck, {
    status: 'valid',
    reason: 'solved-root-set',
  });
});

test('accepts complete cubic and fourth-root quiz paths', () => {
  const cubic = validateCalculationSubmission('3x^3-4=0', [
    String.raw`3x^3-4=0 \mid +4`,
    String.raw`3x^3=4 \mid :3`,
    String.raw`x^3=\frac{4}{3}`,
    String.raw`\Rarr x=\sqrt[3]{\frac{4}{3}}`,
  ]);
  assert.equal(cubic.accepted, true);
  assert.equal(cubic.transitionChecks.at(-1)?.reason, 'cubic-root-solution');
  assert.deepEqual(cubic.finalCheck, {
    status: 'valid',
    reason: 'solved-root-set',
  });

  const fourth = validateCalculationSubmission('3m^4=5', [
    String.raw`3m^4=5 \mid :3`,
    String.raw`m^4=\frac{5}{3}`,
    String.raw`\Rarr m_{1,2}=\pm\sqrt[4]{\frac{5}{3}}`,
  ]);
  assert.equal(fourth.accepted, true);
  assert.equal(fourth.transitionChecks.at(-1)?.reason, 'quartic-root-solutions');
  assert.deepEqual(fourth.finalCheck, {
    status: 'valid',
    reason: 'solved-root-set',
  });
});

test('never accepts a root-set answer with a missing plus-minus sign', () => {
  const grade = validateCalculationSubmission('x^2=4', [
    'x^2=4',
    String.raw`x_{1,2}=\sqrt{4}`,
  ]);
  assert.equal(grade.accepted, false);
  assert.equal(grade.outcome, 'unknown');
  assert.equal(grade.transitionChecks[0].reason, 'missing-plus-minus');
});

test('handles malformed, oversized, and CAS-less quiz submissions safely', () => {
  const malformed = validateCalculationSubmission('x=1', '[not-json');
  assert.equal(malformed.accepted, false);
  assert.equal(malformed.outcome, 'unknown');
  assert.deepEqual(malformed.firstProblem, {
    stage: 'prompt',
    lineIndex: undefined,
    reason: 'invalid-format',
  });

  const tooMany = validateCalculationSubmission(
    'x=1',
    Array.from({ length: 33 }, () => 'x=1'),
  );
  assert.equal(tooMany.accepted, false);
  assert.equal(tooMany.outcome, 'incomplete');
  assert.equal(tooMany.lines.length, 33);
  assert.deepEqual(tooMany.firstProblem, {
    stage: 'final',
    lineIndex: undefined,
    reason: 'too-many-lines',
  });

  const scope = globalThis as any;
  const previous = scope.Algebrite;
  delete scope.Algebrite;
  try {
    const unavailable = validateCalculationSubmission('x+1=2', [
      String.raw`x+1=2 \mid -1`,
      'x=1',
    ]);
    assert.equal(unavailable.accepted, false);
    assert.equal(unavailable.outcome, 'unknown');
    assert.deepEqual(unavailable.firstProblem, {
      stage: 'prompt',
      lineIndex: undefined,
      reason: 'cas-unavailable',
    });
  } finally {
    scope.Algebrite = previous;
  }
});
