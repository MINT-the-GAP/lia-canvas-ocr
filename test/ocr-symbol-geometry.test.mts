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

const broadCarryOne = (
  x: number,
  y: number,
  height: number,
  strokeWidth = 2,
): OcrSymbolPath => path([
  [x - height * 0.47, y + height * 0.44],
  [x, y],
  [x, y + height],
], strokeWidth);

const broadDeepOnePoints = (
  x: number,
  y: number,
  height: number,
): Array<[number, number]> => [
  [x - height * 31 / 51, y + height * 35 / 51],
  [x - height * 26 / 51, y + height * 31 / 51],
  [x - height * 17 / 51, y + height * 22 / 51],
  [x - height * 8 / 51, y + height * 10 / 51],
  [x, y],
  [x, y + height],
];

const broadDeepCarryOne = (
  x: number,
  y: number,
  height: number,
  strokeWidth = 4,
): OcrSymbolPath => path(broadDeepOnePoints(x, y, height), strokeWidth);

const screenshotAdditionPaths = (): OcrSymbolPath[] => [
  // Keep the first operand at the 3.5-glyph-height spacing observed in the
  // reported four-row stack (operand, operand, carries, result).
  digitLoop(180, 89),
  digitLoop(220, 89),
  digitLoop(260, 89),
  digitLoop(300, 89),
  path([[145, 230], [169, 230]]),
  path([[157, 216], [157, 244]]),
  hookedOne(188, 200, 60),
  digitLoop(220, 200),
  digitLoop(260, 200),
  digitLoop(300, 200),
  broadCarryOne(228, 272, 34),
  broadCarryOne(268, 272, 34),
  // The real canvas example drifts upward by a little over six percent.
  // It is still an unambiguous long calculation rule.
  path([[140, 330], [205, 329], [275, 332], [380, 315]], 3),
  digitLoop(180, 350),
  digitLoop(220, 350),
  digitLoop(260, 350),
  digitLoop(300, 350),
];

const spacedSubtractionPaths = (firstOperandY: number): OcrSymbolPath[] => [
  ...[180, 220, 260, 300].map(x => digitLoop(x, firstOperandY)),
  path([[145, 220], [179, 220]]),
  ...[180, 220, 260, 300].map(x => digitLoop(x, 190)),
  broadCarryOne(220, 275, 34),
  broadCarryOne(260, 275, 34),
  broadCarryOne(300, 275, 34),
  path([[135, 330], [220, 329], [300, 331], [390, 330]], 3),
  ...[180, 220, 260, 300].map(x => digitLoop(x, 350)),
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

test('keeps screenshot carries when responsive points shrink but pen width stays fixed', () => {
  const scale = 0.503;
  const paths = screenshotAdditionPaths().map(sourcePath => path(
    sourcePath.points.map(point => [point.x * scale, point.y * scale]),
    3,
  ));
  const rules = findOcrCalculationRuleHints(paths);
  assert.deepEqual(rules.map(rule => rule.pathIndexes), [[12]]);
  assert.deepEqual(
    findOcrCarryOneHints(paths, rules).map(hint => hint.pathIndexes),
    [[10], [11]],
  );
});

test('compares thick carry ink with unpadded digit ink height', () => {
  const paths: OcrSymbolPath[] = [
    digitLoop(180, 70, 32, 75),
    digitLoop(225, 70, 32, 75),
    digitLoop(270, 70, 32, 75),
    digitLoop(315, 70, 32, 75),
    path([[145, 235], [171, 235]], 4),
    path([[158, 220], [158, 250]], 4),
    hookedOne(188, 195, 75),
    digitLoop(225, 195, 32, 75),
    digitLoop(270, 195, 32, 75),
    digitLoop(315, 195, 32, 75),
    broadCarryOne(228, 290, 51, 4),
    broadCarryOne(273, 290, 51, 4),
    path([[140, 360], [220, 359], [300, 361], [380, 360]], 3),
    digitLoop(180, 390, 32, 75),
    digitLoop(225, 390, 32, 75),
    digitLoop(270, 390, 32, 75),
    digitLoop(315, 390, 32, 75),
  ];
  // These raw 51 px carry paths are still clearly smaller than the 75 px
  // digit paths. With a 4 px pen, their padded delimiter boxes used to cross
  // the 72% cutoff even though the underlying glyph geometry did not change.
  const rules = findOcrCalculationRuleHints(paths);

  assert.deepEqual(rules.map(rule => rule.pathIndexes), [[12]]);
  assert.deepEqual(
    findOcrCarryOneHints(paths, rules).map(hint => hint.pathIndexes),
    [[10], [11]],
  );
  assert.equal(
    findOcrCarryOneHints(paths, rules).some(hint => hint.pathIndexes.includes(6)),
    false,
    'the full-height hooked operand one must remain excluded',
  );
});

test('finds three deep-hook carries but excludes a full-size operand one', () => {
  const paths: OcrSymbolPath[] = [
    digitLoop(180, 70, 32, 75),
    digitLoop(225, 70, 32, 75),
    digitLoop(270, 70, 32, 75),
    digitLoop(315, 70, 32, 75),
    path([[145, 235], [171, 235]], 4),
    path([[158, 220], [158, 250]], 4),
    broadDeepCarryOne(188, 195, 75),
    digitLoop(225, 195, 32, 75),
    digitLoop(270, 195, 32, 75),
    digitLoop(315, 195, 32, 75),
    broadDeepCarryOne(228, 290, 51),
    broadDeepCarryOne(273, 290, 51),
    broadDeepCarryOne(318, 290, 51),
    path([[140, 360], [220, 359], [300, 361], [380, 360]], 3),
    digitLoop(180, 390, 32, 75),
    digitLoop(225, 390, 32, 75),
    digitLoop(270, 390, 32, 75),
    digitLoop(315, 390, 32, 75),
  ];
  const rules = findOcrCalculationRuleHints(paths);
  assert.deepEqual(rules.map(rule => rule.pathIndexes), [[13]]);
  assert.deepEqual(
    findOcrCarryOneHints(paths, rules).map(hint => hint.pathIndexes),
    [[10], [11], [12]],
  );
  assert.equal(
    findOcrCarryOneHints(paths, rules).some(hint => hint.pathIndexes.includes(6)),
    false,
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

test('relaxes only the subtraction first-row distance from 3.6 to 4.5 glyph heights', () => {
  const strictInside = spacedSubtractionPaths(85);
  const relaxedOnly = spacedSubtractionPaths(80);
  const relaxedEdge = spacedSubtractionPaths(30);
  const outsideRelaxedLimit = spacedSubtractionPaths(25);

  assert.deepEqual(
    findOcrCalculationRuleHints(strictInside).map(rule => rule.pathIndexes),
    [[12]],
    '3.583 glyph heights stays inside the conservative 3.6 default',
  );
  assert.deepEqual(
    findOcrCalculationRuleHints(relaxedOnly),
    [],
    '3.667 glyph heights must not change the conservative default',
  );
  assert.deepEqual(
    findOcrCalculationRuleHints(relaxedOnly, {
      maximumSecondAboveDistance: 4.5,
    }).map(rule => rule.pathIndexes),
    [[12]],
    'the subtraction context preserves the same unambiguous long rule',
  );
  assert.deepEqual(
    findOcrCalculationRuleHints(relaxedEdge, {
      maximumSecondAboveDistance: 4.5,
    }).map(rule => rule.pathIndexes),
    [[12]],
    'the documented 4.5-glyph selector edge is inclusive',
  );
  assert.deepEqual(
    findOcrCalculationRuleHints(outsideRelaxedLimit, {
      maximumSecondAboveDistance: 4.5,
    }),
    [],
    'a first row beyond 4.5 glyph heights remains unconfirmed',
  );
});

test('single-row multiplication rules require an independent compact dot', () => {
  const expressionWith = (operator: OcrSymbolPath): OcrSymbolPath[] => [
    digitLoop(120, 80),
    digitLoop(160, 80),
    digitLoop(200, 80),
    operator,
    digitLoop(270, 80),
    path([[100, 190], [180, 189], [255, 191], [330, 190]], 3),
    digitLoop(150, 220),
    digitLoop(190, 220),
    digitLoop(230, 220),
    digitLoop(270, 220),
  ];
  const compactDot = path([
    [239, 107], [244, 102], [249, 107], [244, 112], [239, 107],
  ], 3);
  const expression = expressionWith(compactDot);

  assert.deepEqual(
    findOcrCalculationRuleHints(expression),
    [],
    'the default still requires two full-size rows above a final rule',
  );
  assert.deepEqual(
    findOcrCalculationRuleHints(expression, {
      allowSingleMultiplicationRow: true,
    }).map(rule => rule.pathIndexes),
    [[5]],
  );

  const minusInsteadOfDot = expressionWith(path([[237, 107], [251, 107]], 3));
  assert.deepEqual(
    findOcrCalculationRuleHints(minusInsteadOfDot, {
      allowSingleMultiplicationRow: true,
    }),
    [],
    'a compact minus between digits is not multiplication evidence',
  );

  const oneRowFraction = [
    digitLoop(140, 80),
    digitLoop(180, 80),
    path([[100, 170], [260, 168], [320, 170]], 3),
    digitLoop(140, 200),
    digitLoop(180, 200),
  ];
  assert.deepEqual(
    findOcrCalculationRuleHints(oneRowFraction, {
      allowSingleMultiplicationRow: true,
    }),
    [],
    'the multiplication opt-in must not promote an ordinary fraction bar',
  );
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

test('recognizes deep one-stroke hooks without accepting seven, four, or nine', () => {
  for (const hookDepth of [0.44, 0.46, 0.48, 0.52, 0.60, 0.68]) {
    const points: Array<[number, number]> = [
      [70, hookDepth * 60],
      [100, 0],
      [100, 60],
    ];
    assert.equal(classify([path(points, 3)]), 'hooked-one');
    assert.equal(classify([path(points.slice().reverse(), 3)]), 'hooked-one');
  }

  const denseOne: Array<[number, number]> = [];
  const denseSource: Array<[number, number]> = [[70, 31.2], [100, 0], [100, 60]];
  for (let segment = 1; segment < denseSource.length; segment++) {
    const from = denseSource[segment - 1];
    const to = denseSource[segment];
    if (!denseOne.length) denseOne.push(from);
    for (let step = 1; step <= 12; step++) {
      denseOne.push([
        from[0] + (to[0] - from[0]) * step / 12,
        from[1] + (to[1] - from[1]) * step / 12,
      ]);
    }
  }
  assert.equal(classify([path(denseOne, 3)]), 'hooked-one');
  assert.equal(classify([path(denseOne.slice().reverse(), 3)]), 'hooked-one');
  const broadDeepOne = broadDeepOnePoints(100, 0, 60);
  assert.equal(classify([path(broadDeepOne, 3)]), 'hooked-one');
  assert.equal(
    classify([path(broadDeepOne.slice().reverse(), 3)]),
    'hooked-one',
  );
  assert.equal(classify([
    path(denseOne, 3),
    path([[0, 80], [200, 52]], 3),
  ], 0), 'hooked-one', 'a distant sloped rule is not an attached branch');

  const seven = path([[70, 0], [100, 0], [78, 60]], 3);
  const sevenStem = path([[100, 0], [78, 60]], 3);
  const sevenHead = path([[70, 0], [100, 0]], 3);
  const openFour = path([[100, 0], [72, 37], [108, 37], [100, 18], [100, 60]], 3);
  const browserNine = path([
    [99, 27.6], [76, 28.8], [70, 16.8], [75, 1.2],
    [93, 0], [100, 14.4], [94, 60],
  ], 3);

  assert.notEqual(classify([seven]), 'hooked-one');
  for (const headDrop of [0.05, 0.10, 0.15, 0.20]) {
    for (const legEndX of [78, 84, 88]) {
      const fallingSeven: Array<[number, number]> = [
        [70, 0],
        [100, headDrop * 60],
        [legEndX, 60],
      ];
      assert.notEqual(classify([path(fallingSeven, 3)]), 'hooked-one');
      assert.notEqual(
        classify([path(fallingSeven.slice().reverse(), 3)]),
        'hooked-one',
      );
    }
  }
  assert.notEqual(classify([sevenStem, sevenHead], 0), 'hooked-one');
  assert.notEqual(classify([openFour]), 'hooked-one');
  assert.notEqual(classify([browserNine]), 'hooked-one');
});

test('recognizes a separate hook before or after the stem path', () => {
  const stem = path([[20, 0], [20, 60]]);
  const hook = path([[8, 10], [20, 0]]);

  assert.equal(classify([stem, hook], 0), 'hooked-one');
  assert.equal(classify([hook, stem], 1), 'hooked-one');
  assert.equal(classify([path([[20, 0], [8, 10]]), stem], 1), 'hooked-one');
});

test('recognizes a deep separate hook but rejects a horizontal seven head', () => {
  const stem = path([[100, 0], [100, 60]], 3);
  for (const hookDepth of [0.42, 0.46, 0.52, 0.60, 0.66]) {
    const hook = path([[70, hookDepth * 60], [100, 0]], 3);
    assert.equal(classify([stem, hook], 0), 'hooked-one');
    assert.equal(classify([hook, stem], 1), 'hooked-one');
  }
  assert.notEqual(
    classify([path([[100, 0], [78, 60]], 3), path([[70, 0], [100, 0]], 3)], 0),
    'hooked-one',
  );
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
