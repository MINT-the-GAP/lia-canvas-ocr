import assert from 'node:assert/strict';
import test from 'node:test';

import {
    mapOcrCarryOnesToColumns,
    normalizeOcrColumnDigits,
    normalizeOcrColumnDigitsExact,
    selectOcrColumnAdditionSegments,
    selectOcrColumnStackSegments
} from '../src/ocr/column-layout.ts';

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

test('normalizes only plain integer OCR rows', () => {
    assert.equal(normalizeOcrColumnDigits('4379'), '4379');
    assert.equal(normalizeOcrColumnDigits('\\mathrm{1544}', true), '1544');
    assert.equal(normalizeOcrColumnDigits('+ 1544', true), '1544');
    assert.equal(normalizeOcrColumnDigits('15+44', true), null);
    assert.equal(normalizeOcrColumnDigits('x=4'), null);
});

test('retains leading zeroes in division rows and strips only a declared sign', () => {
    assert.equal(normalizeOcrColumnDigitsExact('07'), '07');
    assert.equal(normalizeOcrColumnDigitsExact('- 072', '-'), '072');
    assert.equal(normalizeOcrColumnDigitsExact('+48', '+'), '48');
    assert.equal(normalizeOcrColumnDigitsExact('-8'), null);
    assert.equal(normalizeOcrColumnDigitsExact('7:8'), null);
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
