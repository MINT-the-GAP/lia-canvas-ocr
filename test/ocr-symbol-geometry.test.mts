import assert from 'node:assert/strict';
import test from 'node:test';

import {
  classifyOcrVerticalSymbolPath,
  findOcrCalculationRuleHints,
  findOcrCarryOneHints,
  findOcrDelimiterHints,
  findOcrDivisionRuleHints,
  findOcrPlusMinusBoxes,
  type OcrDelimiterKind,
  type OcrSymbolPath,
  type OcrVerticalGlyphKind,
} from '../src/ocr/symbol-geometry.ts';

const path = (
  points: Array<[number, number]>,
  strokeWidth = 2,
): OcrSymbolPath => ({
  points: points.map(([x, y]) => ({ x, y })),
  strokeWidth,
});

const classify = (
  paths: OcrSymbolPath[],
  targetIndex = 0,
): OcrVerticalGlyphKind => classifyOcrVerticalSymbolPath(paths, targetIndex);

const delimiterSummary = (paths: OcrSymbolPath[]) =>
  findOcrDelimiterHints(paths).map(hint => ({
    kind: hint.kind,
    pathIndexes: hint.pathIndexes,
  }));

const digitLoop = (
  x: number,
  y: number,
  width = 26,
  height = 60,
): OcrSymbolPath => path([
  [x + width * 0.25, y],
  [x + width * 0.85, y + height * 0.08],
  [x + width, y + height * 0.5],
  [x + width * 0.78, y + height],
  [x + width * 0.18, y + height * 0.92],
  [x, y + height * 0.48],
  [x + width * 0.25, y],
]);

const hookedOne = (
  x: number,
  y: number,
  height: number,
): OcrSymbolPath => path([
  [x - height * 0.24, y + height * 0.3],
  [x, y],
  [x, y + height * 0.4],
  [x, y + height],
]);

const screenshotAdditionPaths = (): OcrSymbolPath[] => [
  digitLoop(180, 100),
  digitLoop(220, 100),
  digitLoop(260, 100),
  digitLoop(300, 100),
  path([[145, 230], [169, 230]]),
  path([[157, 216], [157, 244]]),
  hookedOne(188, 200, 60),
  digitLoop(220, 200),
  digitLoop(260, 200),
  digitLoop(300, 200),
  hookedOne(228, 272, 28),
  hookedOne(268, 272, 28),
  path([[140, 330], [205, 328], [275, 330.5], [350, 329]], 3),
  digitLoop(180, 350),
  digitLoop(220, 350),
  digitLoop(260, 350),
  digitLoop(300, 350),
];

test('finds a screenshot-like calculation rule and only the two small carries', () => {
  const paths = screenshotAdditionPaths();
  const rules = findOcrCalculationRuleHints(paths);

  assert.equal(rules.length, 1);
  assert.deepEqual(rules[0].pathIndexes, [12]);
  assert.ok(rules[0].x1 - rules[0].x0 > 200);

  const carries = findOcrCarryOneHints(paths, rules);
  assert.deepEqual(
    carries.map(hint => hint.pathIndexes),
    [[10], [11]],
  );
  assert.deepEqual(
    carries.map(hint => hint.rulePathIndexes),
    [[12], [12]],
  );
});

test('calculation-rule and carry hints are invariant to scale, direction, and path order', () => {
  const source = screenshotAdditionPaths();
  for (const scale of [0.5, 1, 4]) {
    const transformed = source
      .slice()
      .reverse()
      .map(sourcePath => path(
        sourcePath.points
          .slice()
          .reverse()
          .map(point => [
            point.x * scale - 37,
            point.y * scale + 19,
          ]),
        (sourcePath.strokeWidth ?? 1) * scale,
      ));

    const rules = findOcrCalculationRuleHints(transformed);
    assert.equal(rules.length, 1);
    assert.deepEqual(rules[0].pathIndexes, [4]);
    assert.deepEqual(
      findOcrCarryOneHints(transformed, rules).map(hint => hint.pathIndexes),
      [[6], [5]],
    );
  }
});

test('rejects a minus sign and an ordinary one-row fraction bar', () => {
  const minus = [
    digitLoop(100, 100),
    path([[140, 130], [190, 130]]),
    digitLoop(200, 100),
  ];
  assert.deepEqual(findOcrCalculationRuleHints(minus), []);

  const fraction = [
    digitLoop(140, 80),
    digitLoop(180, 80),
    path([[100, 170], [260, 168], [320, 170]], 3),
    digitLoop(140, 200),
    digitLoop(180, 200),
  ];
  assert.deepEqual(findOcrCalculationRuleHints(fraction), []);
  assert.deepEqual(findOcrCarryOneHints(fraction), []);
});

test('finds long-division underlines but not subtraction signs or digit crossbars', () => {
  const paths = [
    // Top division row.
    digitLoop(100, 10),
    digitLoop(140, 10),
    digitLoop(180, 10),
    digitLoop(220, 10),
    // First subtraction row: minus, digit, underline.
    path([[82, 130], [108, 130]]),
    digitLoop(120, 100),
    // A one-digit subtraction gets only a short underline in the source
    // convention; the explicit division context must still preserve it.
    path([[106, 165], [120, 164], [134, 165]], 3),
    // Next partial dividend.
    digitLoop(120, 190),
    digitLoop(160, 190),
    // A separately drawn 4-like crossbar must not become a rule.
    path([[202, 220], [228, 220]]),
    path([[218, 194], [218, 248]]),
    // Second subtraction row and underline.
    path([[122, 300], [148, 300]]),
    digitLoop(160, 270),
    path([[118, 335], [205, 334], [228, 335]], 3),
    digitLoop(190, 360),
  ];

  assert.deepEqual(
    findOcrDivisionRuleHints(paths).map(hint => hint.pathIndexes),
    [[6], [13]],
  );
});

test('division-rule hints are scale, direction, and path-order invariant', () => {
  const source = [
    digitLoop(100, 40),
    digitLoop(140, 40),
    path([[80, 100], [160, 99], [190, 100]], 3),
    digitLoop(120, 125),
  ];
  for (const scale of [0.5, 1, 4]) {
    const transformed = source.slice().reverse().map(sourcePath => path(
      sourcePath.points.slice().reverse().map(point => [
        point.x * scale - 23,
        point.y * scale + 17,
      ]),
      (sourcePath.strokeWidth ?? 1) * scale,
    ));
    assert.deepEqual(
      findOcrDivisionRuleHints(transformed).map(hint => hint.pathIndexes),
      [[1]],
      'scale=' + scale,
    );
  }
});

test('finds single-stroke square and round delimiters in reading order', () => {
  const hints = delimiterSummary([
    path([[14, 0], [2, 0], [2, 60], [14, 60]]),
    path([[32, 0], [25, 8], [21, 22], [20, 30], [21, 38], [25, 52], [32, 60]]),
    path([[60, 0], [67, 8], [71, 22], [72, 30], [71, 38], [67, 52], [60, 60]]),
    path([[80, 0], [92, 0], [92, 60], [80, 60]]),
  ]);

  assert.deepEqual(hints, [
    { kind: 'square-open', pathIndexes: [0] },
    { kind: 'round-open', pathIndexes: [1] },
    { kind: 'round-close', pathIndexes: [2] },
    { kind: 'square-close', pathIndexes: [3] },
  ]);
});

test('is invariant to point direction, path order, translation, and scale', () => {
  const source: Array<{ kind: OcrDelimiterKind; points: Array<[number, number]> }> = [
    { kind: 'square-open', points: [[14, 0], [2, 0], [2, 60], [14, 60]] },
    { kind: 'round-open', points: [[32, 0], [25, 8], [21, 22], [20, 30], [21, 38], [25, 52], [32, 60]] },
    { kind: 'round-close', points: [[60, 0], [67, 8], [71, 22], [72, 30], [71, 38], [67, 52], [60, 60]] },
    { kind: 'square-close', points: [[80, 0], [92, 0], [92, 60], [80, 60]] },
  ];

  for (const scale of [0.5, 1, 4]) {
    const order = [3, 1, 0, 2];
    const transformed = order.map(sourceIndex => path(
      source[sourceIndex].points
        .slice()
        .reverse()
        .map(([x, y]) => [x * scale - 37, y * scale + 19]),
      2 * scale,
    ));
    const hints = findOcrDelimiterHints(transformed);
    assert.deepEqual(
      hints.map(hint => hint.kind),
      source.map(entry => entry.kind),
    );
    assert.deepEqual(
      hints.map(hint => hint.pathIndexes),
      [[2], [1], [3], [0]],
    );
  }
});

test('finds three-stroke square brackets regardless of stroke order and direction', () => {
  const hints = delimiterSummary([
    path([[92, 60], [80, 60]]),
    path([[2, 60], [2, 0]]),
    path([[92, 0], [92, 60]]),
    path([[14, 0], [2, 0]]),
    path([[92, 0], [80, 0]]),
    path([[14, 60], [2, 60]]),
  ]);

  assert.deepEqual(hints, [
    { kind: 'square-open', pathIndexes: [1, 3, 5] },
    { kind: 'square-close', pathIndexes: [0, 2, 4] },
  ]);
});

test('rejects digit, letter, plus, and four lookalikes', () => {
  assert.deepEqual(findOcrDelimiterHints([
    // Seven: its one-sided reach peaks at the top rather than near mid-height.
    path([[0, 0], [20, 0], [8, 60]]),
    // C: its terminals are not the top and bottom extrema and it is too broad.
    path([[76, 8], [70, 2], [60, 0], [50, 8], [44, 20], [42, 30],
      [44, 40], [50, 52], [60, 60], [70, 58], [76, 52]]),
    // Hooked German-school one.
    path([[108, 10], [120, 0], [120, 24], [120, 60]]),
    // Plus sign.
    path([[150, 30], [180, 30]]),
    path([[165, 15], [165, 45]]),
    // Separately drawn four.
    path([[220, 0], [220, 60]]),
    path([[202, 34], [220, 12], [238, 34]]),
  ]), []);
});

test('classifies isolated straight and slanted stems without depending on point direction', () => {
  const vertical = path([[20, 0], [20.3, 20], [20, 60]]);
  const slanted = path([[20, 0], [28, 30], [36, 60]]);

  assert.equal(classify([vertical]), 'hookless-bar');
  assert.equal(classify([slanted]), 'hookless-bar');
  assert.equal(classify([path([[36, 60], [28, 30], [20, 0]])]), 'hookless-bar');
});

test('recognizes a one-stroke top hook in either point direction', () => {
  assert.equal(classify([
    path([[8, 10], [20, 0], [20, 24], [20, 60]]),
  ]), 'hooked-one');
  assert.equal(classify([
    path([[20, 60], [20, 24], [20, 0], [8, 10]]),
  ]), 'hooked-one');
});

test('recognizes a separate hook before or after the stem path', () => {
  const stem = path([[20, 0], [20, 60]]);
  const hook = path([[8, 10], [20, 0]]);

  assert.equal(classify([stem, hook], 0), 'hooked-one');
  assert.equal(classify([hook, stem], 1), 'hooked-one');
  assert.equal(classify([path([[20, 0], [8, 10]]), stem], 1), 'hooked-one');
});

test('keeps middle branches of pluses and fours ambiguous regardless of path order', () => {
  const stem = path([[20, 0], [20, 60]]);
  const crossbar = path([[7, 30], [33, 30]]);
  const fourBranch = path([[7, 34], [20, 15], [33, 34]]);

  assert.equal(classify([stem, crossbar], 0), 'ambiguous');
  assert.equal(classify([crossbar, stem], 1), 'ambiguous');
  assert.equal(classify([stem, fourBranch], 0), 'ambiguous');
});

test('does not let unrelated paths change an isolated bar classification', () => {
  assert.equal(classify([
    path([[20, 0], [20, 60]]),
    path([[80, 20], [100, 20]]),
  ]), 'hookless-bar');
});

test('is scale invariant for separate hooks and rejects non-vertical targets', () => {
  for (const scale of [0.5, 1, 4]) {
    const scaledPath = (points: Array<[number, number]>): OcrSymbolPath => path(
      points.map(([x, y]) => [x * scale, y * scale]),
      2 * scale,
    );
    assert.equal(classify([
      scaledPath([[20, 0], [20, 60]]),
      scaledPath([[8, 10], [20, 0]]),
    ]), 'hooked-one');
  }

  assert.equal(classify([path([[0, 20], [60, 20]])]), 'other');
  assert.equal(classify([path([[20, 0], [20, 60]])], 2), 'other');
});

test('finds a hand-drawn three-stroke plus-minus cluster', () => {
  const boxes = findOcrPlusMinusBoxes([
    path([[10, 12], [20, 11.5], [30, 12]]),
    path([[20, 4], [20.5, 12], [20, 20]]),
    path([[11, 29], [20, 29.5], [29, 29]]),
  ]);

  assert.deepEqual(boxes, [{ x0: 9, y0: 3, x1: 31, y1: 30.5 }]);
});

test('finds separate plus-minus symbols and returns them in reading order', () => {
  const boxes = findOcrPlusMinusBoxes([
    path([[60, 52], [80, 52]]),
    path([[70, 44], [70, 60]]),
    path([[61, 69], [79, 69]]),
    path([[10, 12], [30, 12]]),
    path([[20, 4], [20, 20]]),
    path([[11, 29], [29, 29]]),
  ]);

  assert.equal(boxes.length, 2);
  assert.ok(boxes[0].x0 < boxes[1].x0);
  assert.ok(boxes[0].y0 < boxes[1].y0);
});

test('rejects an individual plus, minus, and equals sign', () => {
  assert.deepEqual(findOcrPlusMinusBoxes([
    path([[10, 12], [30, 12]]),
    path([[20, 4], [20, 20]]),
  ]), []);
  assert.deepEqual(findOcrPlusMinusBoxes([
    path([[10, 12], [30, 12]]),
  ]), []);
  assert.deepEqual(findOcrPlusMinusBoxes([
    path([[10, 10], [30, 10]]),
    path([[10, 18], [30, 18]]),
  ]), []);
});

test('rejects the strokes of a handwritten digit four', () => {
  assert.deepEqual(findOcrPlusMinusBoxes([
    path([[24, 2], [24, 28]]),
    path([[24, 2], [10, 18], [32, 18]]),
  ]), []);
});

test('rejects horizontally separated strokes', () => {
  assert.deepEqual(findOcrPlusMinusBoxes([
    path([[10, 12], [30, 12]]),
    path([[20, 4], [20, 20]]),
    path([[70, 29], [90, 29]]),
  ]), []);
});

test('rejects a plus and minus written on different calculation lines', () => {
  assert.deepEqual(findOcrPlusMinusBoxes([
    path([[10, 12], [30, 12]]),
    path([[20, 4], [20, 20]]),
    path([[11, 86], [29, 86]]),
  ]), []);
});
