import assert from 'node:assert/strict';
import test from 'node:test';

import {
    acceptOcrColumnAdditionSecondOperandAlias,
    inferOcrColumnAdditionOperandCount,
    isOcrColumnDivisionEightAlias,
    isOcrColumnAnnotationRowSmaller,
    mapOcrCarryDigitRowToColumns,
    mapOcrCarryOnesToColumns,
    mergeOcrCarryColumnObservations,
    normalizeOcrColumnAdditionSecondOperandAlias,
    normalizeOcrColumnDigits,
    normalizeOcrColumnDigitsExact,
    normalizeOcrColumnDigitsWithRequiredOperator,
    normalizeOcrColumnMultiplicationCommaSequence,
    normalizeOcrColumnMultiplicationCarryExpression,
    normalizeOcrColumnMultiplicationDotAlias,
    reconcileOcrCarryDigitRowWithRaster,
    selectOcrColumnAdditionSegments,
    selectOcrColumnStackSegments
} from '../src/ocr/column-layout.ts';

test('requires an observed operator when extending an operand stack', () => {
    assert.equal(
        normalizeOcrColumnDigitsWithRequiredOperator('+ 5 3 9 2', '+'),
        '5392'
    );
    assert.equal(
        normalizeOcrColumnDigitsWithRequiredOperator('5392', '+'),
        null
    );
    assert.equal(
        normalizeOcrColumnDigitsWithRequiredOperator('2', '+'),
        null,
        'a bare carry digit must not become an extra summand'
    );
    assert.equal(
        normalizeOcrColumnDigitsWithRequiredOperator('- 3 4 8 7', '-'),
        '3487'
    );
});

test('extends a prompt-defined addition stack without consuming a small carry row', () => {
    const rows = [
        { bbox: { x: 100, y: 10, width: 180, height: 72 } },
        { bbox: { x: 70, y: 100, width: 210, height: 74 } },
        { bbox: { x: 70, y: 190, width: 210, height: 73 } },
        { bbox: { x: 190, y: 275, width: 22, height: 28 } },
    ];
    assert.equal(inferOcrColumnAdditionOperandCount(
        rows,
        ['4397', '+ 1 4 7 8', '+ 5 3 9 2', '2'],
        2
    ), 3);
    assert.equal(inferOcrColumnAdditionOperandCount(
        rows,
        ['4397', '+ 1 4 7 8', '5392', '+2'],
        2
    ), 2, 'an operator-less row stops the observed operand prefix');
    assert.equal(inferOcrColumnAdditionOperandCount(
        rows,
        ['4397', '+ 1 4 7 8', '5392', '2'],
        3
    ), 3, 'the operand count from the prompt remains the minimum');
});

test('compares annotation and anchor ink heights without bbox-padding distortion', () => {
    const anchors = [
        {
            bbox: { x: 0, y: 0, width: 100, height: 59 },
            inkBox: { x: 5, y: 5, width: 90, height: 48 }
        },
        {
            bbox: { x: 0, y: 60, width: 100, height: 36 },
            inkBox: { x: 5, y: 65, width: 90, height: 35 }
        },
        {
            bbox: { x: 0, y: 130, width: 100, height: 57 },
            inkBox: { x: 5, y: 135, width: 90, height: 42 }
        }
    ];
    assert.equal(isOcrColumnAnnotationRowSmaller({
        bbox: { x: 20, y: 100, width: 60, height: 33 },
        inkBox: { x: 25, y: 104, width: 50, height: 26 }
    }, anchors), true, 'the screenshot borrow row is smaller in observed ink');
    assert.equal(isOcrColumnAnnotationRowSmaller({
        bbox: { x: 20, y: 100, width: 60, height: 24 },
        inkBox: { x: 25, y: 104, width: 50, height: 39 }
    }, anchors), false, 'a full-size ink row is not accepted from a small padded bbox');
});

test('annotation height comparison falls back to bbox as one shared metric', () => {
    assert.equal(isOcrColumnAnnotationRowSmaller(
        { bbox: { x: 0, y: 50, width: 50, height: 20 } },
        [
            { bbox: { x: 0, y: 0, width: 90, height: 40 } },
            { bbox: { x: 0, y: 80, width: 90, height: 42 } }
        ]
    ), true);
});

test('selects operand and result rows around a calculation rule', () => {
    const rows = [
        { id: 'heading', bbox: { x: 5, y: -70, width: 520, height: 64 }, inkPixels: 1_200 },
        { id: 'first', bbox: { x: 80, y: 10, width: 330, height: 58 }, inkPixels: 700 },
        { id: 'second', bbox: { x: 35, y: 80, width: 375, height: 60 }, inkPixels: 760 },
        { id: 'carries', bbox: { x: 185, y: 145, width: 120, height: 22 }, inkPixels: 80 },
        { id: 'result', bbox: { x: 80, y: 190, width: 330, height: 59 }, inkPixels: 720 }
    ];
    const rule = { x0: 28, y0: 174, x1: 430, y1: 178, pathIndexes: [9] };
    const selected = selectOcrColumnAdditionSegments(rows, [rule]);
    assert.equal(selected?.operands[0].id, 'first');
    assert.equal(selected?.operands[1].id, 'second');
    assert.equal(selected?.result.id, 'result');
});

test('prefers the operand pair over a large unmasked carry row near the rule', () => {
    const rows = [
        { id: 'first-4728', bbox: { x: 180, y: 70, width: 180, height: 75 }, inkPixels: 900 },
        { id: 'second-+3596', bbox: { x: 140, y: 195, width: 220, height: 75 }, inkPixels: 980 },
        // 51 / 75 = 0.68: this deliberately crosses the broad 0.62 prefilter.
        { id: 'unmasked-carries', bbox: { x: 205, y: 290, width: 120, height: 51 }, inkPixels: 230 },
        { id: 'result-8324', bbox: { x: 180, y: 390, width: 180, height: 75 }, inkPixels: 900 },
    ];
    const rule = { x0: 130, y0: 359, x1: 385, y1: 362, pathIndexes: [13] };

    const selected = selectOcrColumnAdditionSegments(rows, [rule]);
    assert.deepEqual(selected?.operands.map(row => row.id), [
        'first-4728',
        'second-+3596',
    ]);
    assert.equal(selected?.result.id, 'result-8324');
});

test('ignores an earlier below segment outside the calculation rule span', () => {
    const rows = [
        { id: 'first', bbox: { x: 180, y: 70, width: 180, height: 75 }, inkPixels: 900 },
        { id: 'second', bbox: { x: 140, y: 195, width: 220, height: 75 }, inkPixels: 980 },
        { id: 'unrelated-below', bbox: { x: 600, y: 370, width: 180, height: 75 }, inkPixels: 900 },
        { id: 'result', bbox: { x: 180, y: 450, width: 180, height: 75 }, inkPixels: 900 },
    ];
    const rule = { x0: 130, y0: 359, x1: 385, y1: 362, pathIndexes: [13] };

    const selected = selectOcrColumnAdditionSegments(rows, [rule]);
    assert.equal(selected?.result.id, 'result');
});

test('does not mistake two equally tall carry bands for an operand pair', () => {
    const rows = [
        { id: 'first-4728', bbox: { x: 180, y: 70, width: 180, height: 75 }, inkPixels: 900 },
        { id: 'second-+3596', bbox: { x: 140, y: 185, width: 220, height: 75 }, inkPixels: 980 },
        { id: 'carry-band-a', bbox: { x: 205, y: 285, width: 120, height: 51 }, inkPixels: 230 },
        { id: 'carry-band-b', bbox: { x: 215, y: 350, width: 105, height: 51 }, inkPixels: 210 },
        { id: 'result-8324', bbox: { x: 180, y: 450, width: 180, height: 75 }, inkPixels: 900 },
    ];
    const rule = { x0: 130, y0: 419, x1: 385, y1: 422, pathIndexes: [13] };

    const selected = selectOcrColumnAdditionSegments(rows, [rule]);
    assert.deepEqual(selected?.operands.map(row => row.id), [
        'first-4728',
        'second-+3596',
    ]);
});

test('does not promote a large carry row when one real operand row is missing', () => {
    const rows = [
        { id: 'second-+3596', bbox: { x: 140, y: 195, width: 220, height: 75 }, inkPixels: 980 },
        { id: 'carry-band-a', bbox: { x: 205, y: 285, width: 120, height: 51 }, inkPixels: 230 },
        { id: 'carry-band-b', bbox: { x: 215, y: 350, width: 105, height: 51 }, inkPixels: 210 },
        { id: 'result-8324', bbox: { x: 180, y: 450, width: 180, height: 75 }, inkPixels: 900 },
    ];
    const rule = { x0: 130, y0: 419, x1: 385, y1: 422, pathIndexes: [13] };

    assert.equal(selectOcrColumnAdditionSegments(rows, [rule]), null);
});

test('keeps a horizontally short wrong operand instead of snapping to carry work', () => {
    const rows = [
        // Even an oversized distant heading must not inflate the local row scale.
        { id: 'heading', bbox: { x: 5, y: -300, width: 520, height: 260 }, inkPixels: 1_200 },
        { id: 'first', bbox: { x: 180, y: 70, width: 180, height: 75 }, inkPixels: 900 },
        // A row of short ones can be only 68% as tall as other handwritten
        // digits. Its stronger ink evidence still distinguishes this ordinary
        // wrong operand from annotation work and leaves grading semantic.
        { id: 'wrong-short-111', bbox: { x: 245, y: 195, width: 120, height: 51 }, inkPixels: 900 },
        { id: 'carry-work', bbox: { x: 205, y: 290, width: 120, height: 51 }, inkPixels: 230 },
        { id: 'result', bbox: { x: 180, y: 390, width: 180, height: 75 }, inkPixels: 900 },
    ];
    const rule = { x0: 130, y0: 359, x1: 385, y1: 362, pathIndexes: [13] };

    const selected = selectOcrColumnAdditionSegments(rows, [rule]);
    assert.deepEqual(selected?.operands.map(row => row.id), [
        'first',
        'wrong-short-111',
    ]);
});

test('keeps every full-size place-value row around a multiplication rule', () => {
    const rows = [
        { id: 'expression', bbox: { x: 90, y: 5, width: 280, height: 55 }, inkPixels: 600 },
        { id: 'partial-1', bbox: { x: 70, y: 68, width: 300, height: 54 }, inkPixels: 620 },
        { id: 'partial-2', bbox: { x: 130, y: 130, width: 240, height: 56 }, inkPixels: 580 },
        { id: 'partial-3', bbox: { x: 190, y: 194, width: 180, height: 55 }, inkPixels: 510 },
        { id: 'noise', bbox: { x: 30, y: 252, width: 20, height: 12 }, inkPixels: 8 },
        { id: 'result', bbox: { x: 80, y: 286, width: 290, height: 58 }, inkPixels: 650 }
    ];
    const rule = { x0: 55, y0: 264, x1: 390, y1: 268, pathIndexes: [20] };
    const selected = selectOcrColumnStackSegments(rows, [rule], 3);
    assert.deepEqual(selected?.rowsAbove.map(row => row.id), [
        'expression', 'partial-1', 'partial-2', 'partial-3'
    ]);
    assert.equal(selected?.result.id, 'result');
});

test('keeps the complete rule-local addition stack for post-OCR role assignment', () => {
    const rows = [
        { id: 'first-4728', bbox: { x: 180, y: 60, width: 180, height: 75 }, inkPixels: 900 },
        { id: 'second-+3596', bbox: { x: 140, y: 160, width: 220, height: 75 }, inkPixels: 980 },
        { id: 'visible-carries-111', bbox: { x: 205, y: 250, width: 120, height: 51 }, inkPixels: 230 },
        { id: 'result-8324', bbox: { x: 180, y: 340, width: 180, height: 75 }, inkPixels: 900 },
    ];
    const rule = { x0: 130, y0: 319, x1: 385, y1: 322, pathIndexes: [13] };

    const selected = selectOcrColumnStackSegments(rows, [rule], 2);
    assert.deepEqual(selected?.rowsAbove.map(row => row.id), [
        'first-4728',
        'second-+3596',
        'visible-carries-111',
    ]);
    assert.equal(selected?.result.id, 'result-8324');
});

test('keeps all 32 operand rows plus a carry but stops before a heading', () => {
    const operandCount = 32;
    const rows = [
        { id: 'heading', bbox: { x: 100, y: -250, width: 260, height: 60 }, inkPixels: 700 },
        ...Array.from({ length: operandCount }, (_, index) => ({
            id: 'operand-' + (index + 1),
            bbox: { x: 140, y: index * 70, width: 220, height: 45 },
            inkPixels: 650,
        })),
        { id: 'carry', bbox: { x: 205, y: operandCount * 70, width: 80, height: 30 }, inkPixels: 120 },
        { id: 'result', bbox: { x: 140, y: operandCount * 70 + 75, width: 220, height: 45 }, inkPixels: 660 },
    ];
    const ruleY = operandCount * 70 + 44;
    const rule = { x0: 120, y0: ruleY, x1: 385, y1: ruleY + 4, pathIndexes: [40] };

    const selected = selectOcrColumnStackSegments(rows, [rule], 2);
    assert.equal(selected?.rowsAbove.length, operandCount + 1);
    assert.equal(selected?.rowsAbove[0].id, 'operand-1');
    assert.equal(selected?.rowsAbove[operandCount - 1].id, 'operand-32');
    assert.equal(selected?.rowsAbove[operandCount].id, 'carry');
    assert.equal(selected?.result.id, 'result');
});

test('maps a separately observed carry row without inventing or collapsing digits', () => {
    const anchors = [{
        segment: {
            bbox: { x: 90, y: 10, width: 140, height: 70 },
            inkBox: { x: 100, y: 20, width: 120, height: 55 },
        },
        digitCount: 4,
        digitCenters: [110, 140, 170, 200],
    }];

    assert.deepEqual(
        mapOcrCarryDigitRowToColumns('111', [110, 140, 170], anchors, 4),
        [null, '1', '1', '1'],
    );
    assert.deepEqual(
        mapOcrCarryDigitRowToColumns('10', [132, 148], anchors, 4),
        [null, null, '10', null],
        'two observed glyphs in one target cell must remain a multi-digit carry',
    );
    assert.equal(
        mapOcrCarryDigitRowToColumns('1', [155], anchors, 4),
        null,
        'a glyph exactly between target columns is ambiguous',
    );
    assert.deepEqual(
        mapOcrCarryDigitRowToColumns('1111', [110, 140, 170, 200], anchors, 4),
        ['1', '1', '1', '1'],
        'four independently drawn glyphs must remain four carries',
    );
});

test('merges disjoint vector ones and raster digits into one observed carry row', () => {
    assert.deepEqual(
        mergeOcrCarryColumnObservations(
            [null, '1', null, '1'],
            [null, null, '2', null],
        ),
        [null, '1', '2', '1'],
        'the mixed 1-2-1 row is retained entirely from observed evidence',
    );
    assert.equal(
        mergeOcrCarryColumnObservations(
            [null, '1', null, null],
            [null, '2', null, null],
        ),
        null,
        'differing observations in the same target cell are ambiguous',
    );
    assert.equal(
        mergeOcrCarryColumnObservations(
            [null, '1', null, null],
            [null, '1', null, null],
        ),
        null,
        'equal overlapping evidence must not double-count the same ink',
    );
    assert.equal(
        mergeOcrCarryColumnObservations([null, '1'], [null, null, '2']),
        null,
    );
});

test('reconciles only one duplicated OCR carry-one against raster glyphs', () => {
    assert.equal(reconcileOcrCarryDigitRowWithRaster('1111', 3), '111');
    assert.equal(reconcileOcrCarryDigitRowWithRaster('111', 3), '111');
    assert.equal(
        reconcileOcrCarryDigitRowWithRaster('1111', 4),
        '1111',
        'four actual raster glyphs must not be collapsed',
    );
    assert.equal(reconcileOcrCarryDigitRowWithRaster('11111', 3), null);
    assert.equal(reconcileOcrCarryDigitRowWithRaster('11', 3), null);
    assert.equal(
        reconcileOcrCarryDigitRowWithRaster('11', 1),
        null,
        'a possible multi-digit carry in one connected component is not collapsed',
    );
    assert.equal(reconcileOcrCarryDigitRowWithRaster('101', 2), null);
    assert.equal(reconcileOcrCarryDigitRowWithRaster('1111', 0), null);
});

test('normalizes only plain integer OCR rows', () => {
    assert.equal(normalizeOcrColumnDigits('4379'), '4379');
    assert.equal(normalizeOcrColumnDigits('\\mathrm{1544}', true), '1544');
    assert.equal(normalizeOcrColumnDigits('+ 1544', true), '1544');
    assert.equal(normalizeOcrColumnDigits(String.fromCharCode(92) + 'mathrm{B} 3 2 4'), null);
    assert.equal(normalizeOcrColumnDigits('472B'), null);
    assert.equal(normalizeOcrColumnDigits('5g23'), null);
    assert.equal(normalizeOcrColumnDigits('\\vert 8 \\vert'), null);
    assert.equal(normalizeOcrColumnDigits('|8|'), null);
    assert.equal(normalizeOcrColumnDigits('15+44', true), null);
    assert.equal(normalizeOcrColumnDigits('83.24'), null);
    assert.equal(normalizeOcrColumnDigits('b324'), null);
    assert.equal(normalizeOcrColumnDigits('x=4'), null);
});

test('retains leading zeroes in division rows and strips only a declared sign', () => {
    assert.equal(normalizeOcrColumnDigitsExact('07'), '07');
    assert.equal(normalizeOcrColumnDigitsExact('- 072', '-'), '072');
    assert.equal(normalizeOcrColumnDigitsExact('+48', '+'), '48');
    assert.equal(normalizeOcrColumnDigitsExact('+35g6', '+'), null);
    assert.equal(normalizeOcrColumnDigitsExact('-8'), null);
    assert.equal(normalizeOcrColumnDigitsExact('7:8'), null);
});

test('recognizes only the signed FormulaNet g-alias for a division eight', () => {
    assert.equal(isOcrColumnDivisionEightAlias('-g'), true);
    assert.equal(isOcrColumnDivisionEightAlias('− \\mathrm{g}'), true);
    assert.equal(isOcrColumnDivisionEightAlias('-G'), true);
    for (const rejected of ['g', '-q', '-9', '-x', '8', '-8', '']) {
        assert.equal(isOcrColumnDivisionEightAlias(rejected), false, rejected);
    }
});

test('keeps the historical spaced leading-plus path ahead of alias fallback', () => {
    assert.equal(normalizeOcrColumnDigitsExact('+ 3 5 9 6', '+'), '3596');
});

test('reads only the geometry-gated FormulaNet multiplication-dot alias shape', () => {
    assert.deepEqual(
        normalizeOcrColumnMultiplicationDotAlias('738-6'),
        ['738', '6'],
    );
    assert.deepEqual(
        normalizeOcrColumnMultiplicationDotAlias('0 - 6'),
        ['0', '6'],
    );
    assert.deepEqual(
        normalizeOcrColumnMultiplicationDotAlias('738 - 0'),
        ['738', '0'],
    );
    assert.deepEqual(
        normalizeOcrColumnMultiplicationDotAlias('  7 3 8 \t\u2212\t0 0 6  '),
        ['738', '006'],
    );
    assert.deepEqual(
        normalizeOcrColumnMultiplicationDotAlias('738=6'),
        ['738', '6'],
    );
    assert.deepEqual(
        normalizeOcrColumnMultiplicationDotAlias(' 7 3 8 = 0 0 6 '),
        ['738', '006'],
    );

    for (const rejected of [
        '',
        '-738-6',
        '738-',
        '-6',
        '738--6',
        '738-6-1',
        '=738=6',
        '738==6',
        '738=6=4428',
        '738+6',
        '738\u20136',
        '738\u20146',
        '738.0-6',
        '738-6.0',
        '738,0-6',
        '738\u00b76',
        '738\u00d76',
        '738*6',
        '738\\cdot6',
        '\\mathrm{738}-6',
        '$738-6$',
        '{738}-6',
        '738\n-6',
    ]) {
        assert.equal(
            normalizeOcrColumnMultiplicationDotAlias(rejected),
            null,
            rejected,
        );
    }
    assert.equal(normalizeOcrColumnMultiplicationDotAlias(738 - 6), null);
});

test('extracts only a plain FormulaNet comma-separated multiplication candidate', () => {
    assert.deepEqual(
        normalizeOcrColumnMultiplicationCommaSequence('7,3,8,6'),
        ['7', '3', '8', '6'],
    );
    assert.deepEqual(
        normalizeOcrColumnMultiplicationCommaSequence(' 0 , 0 , 6 '),
        ['0', '0', '6'],
    );

    for (const rejected of [
        '',
        '738,6',
        '7,38,6',
        '7,3,8,-6',
        '-7,3,8,6',
        '7.3,8,6',
        '7;3;8;6',
        '7,3,8,6=4428',
        '7,3,8,6\n4428',
        '{7},{3},{8},{6}',
        String.raw`\mathrm{7,3,8,6}`,
        '$7,3,8,6$',
    ]) {
        assert.equal(
            normalizeOcrColumnMultiplicationCommaSequence(rejected),
            null,
            rejected,
        );
    }
    assert.equal(normalizeOcrColumnMultiplicationCommaSequence(7.386), null);
});

test('reads only observed multiplication subscripts without inferring carries', () => {
    assert.deepEqual(
        normalizeOcrColumnMultiplicationCarryExpression(
            String.raw`7_{2}3_{4}8\cdot6`,
        ),
        { operands: ['738', '6'], carryMarks: ['2', '4', null] },
    );
    assert.deepEqual(
        normalizeOcrColumnMultiplicationCarryExpression('7_{2},3_{4},8,6'),
        { operands: ['738', '6'], carryMarks: ['2', '4', null] },
    );
    assert.deepEqual(
        normalizeOcrColumnMultiplicationCarryExpression('7_2 3_4 8 - 6'),
        { operands: ['738', '6'], carryMarks: ['2', '4', null] },
    );
    assert.deepEqual(
        normalizeOcrColumnMultiplicationCarryExpression('7_{2}3_{4}8=6'),
        { operands: ['738', '6'], carryMarks: ['2', '4', null] },
    );
    assert.deepEqual(
        normalizeOcrColumnMultiplicationCarryExpression('7_{2},3_{4},8'),
        { operands: ['73', '8'], carryMarks: ['2', '4'] },
        'the parser retains this candidate; only raster-dot geometry may accept it',
    );

    for (const rejected of [
        '738\\cdot6',
        '7_{2}3_{4}8+6',
        '7_{2}3_{4}8==6',
        '7_{2}3_{4}8\\cdot66',
        '7_{22}3_{4}8\\cdot6',
        '7^{2}3_{4}8\\cdot6',
        '7_{2},3_{4},8,-6',
        '7_{2}3_{4}8\\cdot6=4428',
        '7_{2}3_{4}8\\cdot6\n4428',
    ]) {
        assert.equal(
            normalizeOcrColumnMultiplicationCarryExpression(rejected),
            null,
            rejected,
        );
    }
});

test('accepts FormulaNet pm only for the leading plus of addition operand two', () => {
    assert.equal(
        normalizeOcrColumnAdditionSecondOperandAlias('\\pm 3 5 9 6'),
        '3596',
    );
    assert.equal(
        normalizeOcrColumnAdditionSecondOperandAlias('\\pm{003596}'),
        '003596',
    );

    // No opt-in represents operand one, the result, and existing callers in
    // multiplication. Subtraction and plain division rows use other declared
    // operators and must reject the same FormulaNet token even if miscalled
    // with the opt-in flag.
    assert.equal(normalizeOcrColumnDigitsExact('\\pm3596', '+'), null);
    assert.equal(normalizeOcrColumnAdditionSecondOperandAlias('+3596'), null);
    assert.equal(normalizeOcrColumnAdditionSecondOperandAlias('-3596'), null);
    assert.equal(normalizeOcrColumnDigits('\\pm3596'), null);

    assert.equal(normalizeOcrColumnAdditionSecondOperandAlias('35\\pm96'), null);
    assert.equal(normalizeOcrColumnAdditionSecondOperandAlias('+\\pm3596'), null);
    assert.equal(normalizeOcrColumnAdditionSecondOperandAlias('\\pm\\pm3596'), null);
});

test('gates the FormulaNet pm alias without suppressing normal wrong rows', () => {
    assert.equal(
        acceptOcrColumnAdditionSecondOperandAlias('3596', true, true),
        '3596',
    );
    assert.equal(
        acceptOcrColumnAdditionSecondOperandAlias('2596', true, false),
        null,
    );
    assert.equal(
        acceptOcrColumnAdditionSecondOperandAlias('3596', false, true),
        null,
    );
    assert.equal(
        acceptOcrColumnAdditionSecondOperandAlias(null, true, true),
        null,
    );

    // A normal leading-plus row bypasses the alias gate at the callsite and
    // therefore remains available for ordinary incorrect-answer grading.
    assert.equal(normalizeOcrColumnDigitsExact('+2596', '+'), '2596');
});

test('maps exactly two carry ones and preserves a duplicate as wrong work', () => {
    const anchors = [
        { segment: { bbox: { x: 170, y: 10, width: 165, height: 58 } }, digitCount: 4 },
        { segment: { bbox: { x: 170, y: 190, width: 165, height: 59 } }, digitCount: 4 }
    ];
    const carries = [
        { x0: 268, y0: 150, x1: 278, y1: 169, pathIndexes: [10], rulePathIndexes: [9] },
        { x0: 228, y0: 150, x1: 238, y1: 169, pathIndexes: [11], rulePathIndexes: [9] }
    ];
    assert.deepEqual(
        mapOcrCarryOnesToColumns(carries, anchors, 4),
        [null, '1', '1', null]
    );
    assert.deepEqual(
        mapOcrCarryOnesToColumns([...carries, carries[0]], anchors, 4),
        [null, '2', '1', null]
    );
});

test('maps the hooked carry in 372 + 165 to the hundreds column', () => {
    const anchors = [
        {
            segment: {
                // Deliberately different symmetric crop padding around both
                // rows; only inkBox describes the handwritten digits.
                bbox: { x: 646, y: 10, width: 292, height: 82 },
                inkBox: { x: 680, y: 22, width: 240, height: 58 }
            },
            digitCount: 3
        },
        {
            segment: {
                bbox: { x: 660, y: 190, width: 270, height: 78 },
                inkBox: { x: 682, y: 201, width: 236, height: 56 }
            },
            digitCount: 3
        }
    ];
    // The long left hook makes the glyph midpoint too far left. Its stem at
    // x=704 still reaches the geometrically inferred hundreds cell.
    const carries = [
        { x0: 650, y0: 150, x1: 704, y1: 178, pathIndexes: [7], rulePathIndexes: [8] }
    ];

    assert.deepEqual(
        mapOcrCarryOnesToColumns(carries, anchors, 3),
        [null, null, '1']
    );
});

test('uses measured glyph centers and fitted stems for broad screenshot carries', () => {
    const anchors = [
        {
            segment: {
                bbox: { x: 150, y: 10, width: 205, height: 65 },
                inkBox: { x: 165, y: 20, width: 187, height: 61 }
            },
            digitCount: 4,
            digitCenters: [181, 222, 269, 334]
        },
        {
            segment: {
                bbox: { x: 145, y: 190, width: 205, height: 65 },
                inkBox: { x: 156, y: 200, width: 185, height: 59 }
            },
            digitCount: 4,
            digitCenters: [173, 222.5, 269, 322]
        }
    ];
    const carries = [
        { x0: 152.5, y0: 150, x1: 171.5, y1: 187, stemX: 170, pathIndexes: [11], rulePathIndexes: [14] },
        { x0: 192.5, y0: 150, x1: 211.5, y1: 187, stemX: 210, pathIndexes: [12], rulePathIndexes: [14] },
        { x0: 232.5, y0: 150, x1: 251.5, y1: 187, stemX: 250, pathIndexes: [13], rulePathIndexes: [14] }
    ];

    assert.deepEqual(
        mapOcrCarryOnesToColumns(carries, anchors, 4),
        [null, '1', '1', '1']
    );
    assert.deepEqual(
        mapOcrCarryOnesToColumns([...carries, carries[2]], anchors, 4),
        [null, '2', '1', '1'],
        'a genuinely duplicated stem must remain a duplicate'
    );
});

test('uses ink bounds so changing crop padding cannot move a carry column', () => {
    const row = (bbox: { x: number; width: number }) => ({
        segment: {
            bbox: { ...bbox, y: 10, height: 90 },
            inkBox: { x: 105, y: 22, width: 193, height: 60 }
        },
        digitCount: 4
    });
    const carry = [
        { x0: 216, y0: 150, x1: 229, y1: 174, pathIndexes: [2], rulePathIndexes: [9] }
    ];

    assert.deepEqual(
        mapOcrCarryOnesToColumns(carry, [row({ x: 92, width: 220 })], 4),
        [null, '1', null, null]
    );
    assert.deepEqual(
        mapOcrCarryOnesToColumns(carry, [row({ x: 55, width: 294 })], 4),
        [null, '1', null, null]
    );
});

test('combines unequal three- and four-digit anchors without semantic snapping', () => {
    const anchors = [
        {
            segment: {
                bbox: { x: 120, y: 10, width: 150, height: 72 },
                inkBox: { x: 132, y: 20, width: 126, height: 52 }
            },
            digitCount: 3
        },
        {
            segment: {
                bbox: { x: 76, y: 190, width: 200, height: 76 },
                inkBox: { x: 87, y: 200, width: 168, height: 55 }
            },
            digitCount: 4
        }
    ];
    const leftmost = [
        { x0: 96, y0: 150, x1: 108, y1: 174, pathIndexes: [5], rulePathIndexes: [9] }
    ];
    const rightmost = [
        { x0: 224, y0: 150, x1: 238, y1: 174, pathIndexes: [6], rulePathIndexes: [9] }
    ];

    assert.deepEqual(
        mapOcrCarryOnesToColumns(leftmost, anchors, 4),
        [null, null, null, '1']
    );
    assert.deepEqual(
        mapOcrCarryOnesToColumns(rightmost, anchors, 4),
        ['1', null, null, null],
        'geometry is preserved even when a carry in the ones column is mathematically wrong'
    );
});
