import assert from 'node:assert/strict';
import test from 'node:test';

import {
  classifyOcrVerticalSymbolPath,
  findOcrCalculationRuleHints,
  findOcrDelimiterHints,
  findOcrPlusMinusBoxes,
  type OcrSymbolPath,
} from '../src/ocr/symbol-geometry.ts';

const path = (points: Array<[number, number]>, strokeWidth = 3): OcrSymbolPath => ({
  points: points.map(([x, y]) => ({ x, y })),
  strokeWidth,
});
const digit = (x: number, y: number): OcrSymbolPath => path([
  [x, y], [x + 25, y], [x + 25, y + 60], [x, y + 60], [x, y],
], 2);
const stack = (operators: OcrSymbolPath[]): OcrSymbolPath[] => [
  digit(120, 80), digit(160, 80), digit(200, 80),
  ...operators,
  digit(270, 80),
  path([[100, 190], [330, 190]]),
  digit(150, 220), digit(190, 220), digit(230, 220), digit(270, 220),
];
const multiplicationRules = (paths: OcrSymbolPath[]) =>
  findOcrCalculationRuleHints(paths, { allowSingleMultiplicationRow: true });

test('a single-point multiplication tap confirms the written calculation rule', () => {
  for (const points of [[[244, 110]], [[244, 110], [244, 110]]] as Array<Array<[number, number]>>) {
    const input = stack([path(points)]);
    assert.deepEqual(multiplicationRules(input).map(rule => rule.pathIndexes), [[5]]);
    assert.deepEqual(findOcrCalculationRuleHints(input), [],
      'a tap must not relax the ordinary two-operand-row requirement');
    assert.deepEqual(input[3].points, points.map(([x, y]) => ({ x, y })),
      'the observed point sequence must remain unchanged');
  }
});

test('tap evidence remains valid after scaling, translation and stroke reordering', () => {
  for (const scale of [0.5, 1, 2.5]) {
    const input = stack([path([[244, 110]])]).map(item => ({
      points: item.points.map(point => ({
        x: point.x * scale - 40,
        y: point.y * scale + 12,
      })).reverse(),
      strokeWidth: item.strokeWidth! * scale,
    })).reverse();
    assert.equal(multiplicationRules(input).length, 1);
  }
});

test('a tap does not turn another written operator or fraction into multiplication', () => {
  const tap = path([[244, 110]]);
  const rejectedOperators: OcrSymbolPath[][] = [
    [],
    [tap, path([[233, 110], [255, 110]], 6)],
    [tap, path([[232, 103], [256, 103]]), path([[232, 117], [256, 117]])],
    [path([[244, 100]]), path([[244, 120]])],
    [path([[244, 170]])],
  ];
  for (const operators of rejectedOperators) {
    assert.deepEqual(multiplicationRules(stack(operators)), []);
  }
});

test('isolated tapped dots do not become delimiters, vertical stems or plus-minus signs', () => {
  const taps = [path([[20, 20]]), path([[20, 40]])];
  assert.equal(classifyOcrVerticalSymbolPath(taps, 0), 'other');
  assert.deepEqual(findOcrDelimiterHints(taps), []);
  assert.deepEqual(findOcrPlusMinusBoxes(taps), []);
});
