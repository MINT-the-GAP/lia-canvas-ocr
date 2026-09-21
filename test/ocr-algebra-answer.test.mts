import assert from 'node:assert/strict';
import test from 'node:test';

import { normalizeOcrAlgebraAnswer } from '../src/ocr/math-notation.ts';

test('Canvas OCR separates TeX variables and makes grouped powers checkable', () => {
  const cases = [
    ['q p ^ { 4 }', 'q\\cdot p ^ { 4 }'],
    ['qp^4', 'q\\cdot p^4'],
    ['qp^{4}', 'q\\cdot p^{4}'],
    ['q p^4', 'q\\cdot p^4'],
    ['p^{4}', 'p^4'],
    ['p^ { 12 }', 'p^(12)'],
    ['p^{n+1}', 'p^(n+1)'],
    ['p^{q^{2}}', 'p^(q^2)'],
    ['qp^{3}', 'q\\cdot p^{3}'],
    ['p^4q', 'p^4q'],
    ['p^{4}q', 'p^4q'],
    ['p ^ { 4 } q', 'p ^4 q'],
    ['p^{12}q', 'p^(12)q'],
    ['p^{4}q^{2}', 'p^4q^2'],
    ['p^{4}qr', 'p^{4}q\\cdot r'],
    ['p^(4q)', 'p^(4q)'],
  ];
  for (const [raw, expected] of cases) {
    assert.equal(normalizeOcrAlgebraAnswer(raw), expected, raw);
    assert.equal(normalizeOcrAlgebraAnswer(expected), expected, 'idempotent: ' + raw);
  }
});

test('Canvas OCR preserves commands, text, named symbols and explicit products', () => {
  const unchanged = [
    '\\text{qp^4}', '\\mathrm{kg}', '\\vec{AB}', '\\operatorname{sin}',
    '\\sqrt{13}', 'p^4*q', 'q\\cdot p^{4}', 'q\np',
  ];
  for (const raw of unchanged) assert.equal(normalizeOcrAlgebraAnswer(raw), raw);
  assert.equal(
    normalizeOcrAlgebraAnswer('\\frac{qp}{2}'),
    '\\frac{q\\cdot p}{2}',
  );
  assert.equal(
    normalizeOcrAlgebraAnswer('\\sqrt { 1 3 }'),
    '\\sqrt { 13 }',
  );
});
