import assert from 'node:assert/strict';
import test from 'node:test';

import { composeMultilineLatex } from '../src/ocr/layout.ts';
import {
  equivalenceStressCases,
  equivalenceStressTotals,
  stressCaseLatex,
} from './fixtures/equivalence-stress-cases.mts';

test('equivalence stress corpus covers the intended calculation-block load', () => {
  assert.deepEqual(equivalenceStressTotals, {
    cases: 8,
    lines: 35,
    operations: 20,
    recognitions: 55,
  });
});

for (const testCase of equivalenceStressCases) {
  test(`composes aligned stress case: ${testCase.id}`, () => {
    const recognizedLines = testCase.lines.map(line =>
      line.operation ? `${line.main} \\mid ${line.operation}` : line.main,
    );
    const latex = composeMultilineLatex(recognizedLines);

    assert.equal(latex, stressCaseLatex(testCase));
    assert.equal((latex.match(/&/g) ?? []).length, testCase.lines.length);
    assert.equal(
      (latex.match(/\\mid/g) ?? []).length,
      testCase.lines.filter(line => Boolean(line.operation)).length,
    );
  });
}
