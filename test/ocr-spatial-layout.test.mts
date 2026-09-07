import assert from 'node:assert/strict';
import test from 'node:test';
import { findOcrLineBands, selectOcrOperationSeparator } from '../src/ocr/layout.ts';
import { mergeSpatialOcrLineBands } from '../src/ocr/spatial-layout.ts';

type Rectangle = readonly [number, number, number, number];

function fixture(rectangles: readonly Rectangle[], width = 180, height = 160, scale = 1) {
    const pixelWidth = Math.round(width * scale), pixelHeight = Math.round(height * scale);
    const mask = new Uint8Array(pixelWidth * pixelHeight);
    const rows = new Uint32Array(pixelHeight);
    for (const [x0, y0, x1, y1] of rectangles) {
        for (let y = Math.round(y0 * scale); y < Math.round((y1 + 1) * scale); y++) {
            for (let x = Math.round(x0 * scale); x < Math.round((x1 + 1) * scale); x++) {
                if (!mask[y * pixelWidth + x]) rows[y]++;
                mask[y * pixelWidth + x] = 1;
            }
        }
    }
    const bands = findOcrLineBands(rows, pixelWidth, scale, 'local-scale');
    return { mask, width: pixelWidth, bands, scale };
}

function recovered(rectangles: readonly Rectangle[], width = 180, height = 160, scale = 1) {
    const input = fixture(rectangles, width, height, scale);
    return mergeSpatialOcrLineBands(input.mask, input.width, input.bands, input.scale)
        .map(band => [band.y0 / scale, (band.y1 + 1) / scale - 1]);
}

test('recovers a large spaced fraction from its horizontal bar and centered bodies', () => {
    const rectangles: Rectangle[] = [
        [40, 5, 49, 24], [53, 5, 62, 24],
        [24, 43, 80, 44],
        [45, 64, 56, 83],
        [10, 116, 20, 135], [27, 116, 39, 135],
    ];
    assert.deepEqual(recovered(rectangles), [[5, 83], [116, 135]]);
    assert.deepEqual(recovered(rectangles, 180, 160, 3), [[5, 83], [116, 135]]);
    assert.deepEqual(recovered(rectangles, 180, 400), [[5, 83], [116, 135]],
        'extra empty canvas height does not change the recovered fraction');
});

test('recovers the outer denominator of a nested fraction without a run-count limit', () => {
    const rectangles: Rectangle[] = [
        [40, 5, 49, 12], [30, 18, 65, 19], [40, 25, 49, 32],
        [15, 42, 80, 43], [40, 51, 49, 58],
        [15, 89, 24, 108], [32, 89, 42, 108],
    ];
    assert.deepEqual(recovered(rectangles), [[5, 58], [89, 108]]);
    assert.deepEqual(recovered(rectangles, 180, 160, 3), [[5, 58], [89, 108]]);
});

test('attaches a full-height small exponent and subscript to their nearby glyph', () => {
    assert.deepEqual(recovered([
        [29, 10, 34, 17], [10, 24, 24, 43], [44, 24, 54, 43],
    ], 100, 80), [[10, 43]]);
    assert.deepEqual(recovered([
        [10, 10, 24, 29], [44, 10, 54, 29], [29, 39, 34, 46],
    ], 100, 80), [[10, 46]]);
    assert.deepEqual(recovered([
        [29, 10, 34, 17], [10, 24, 24, 43], [44, 24, 54, 43],
    ], 100, 80, 3), [[10, 43]]);
});

test('does not attach a small unrelated column or a script ambiguous between two baselines', () => {
    assert.deepEqual(recovered([
        [100, 10, 105, 17], [10, 24, 24, 43], [44, 24, 54, 43],
    ]), [[10, 17], [24, 43]]);
    assert.deepEqual(recovered([
        [10, 5, 24, 24], [29, 33, 34, 40], [10, 47, 24, 66],
    ], 100, 100), [[5, 24], [33, 40], [47, 66]]);
});

test('requires horizontal fraction support and does not use an unrelated dash as a bridge', () => {
    assert.deepEqual(recovered([
        [10, 5, 20, 24], [95, 43, 150, 44], [10, 64, 20, 83],
    ]), [[5, 24], [43, 44], [64, 83]]);
    assert.deepEqual(recovered([
        [10, 10, 24, 29], [27, 35, 29, 37], [10, 46, 24, 65],
    ], 100, 100), [[10, 37], [46, 65]], 'a small dot cannot glue two full-size rows');
});

test('does not pull the next equation up to an unmatched fraction-like horizontal stroke', () => {
    assert.deepEqual(recovered([
        [40, 5, 50, 24], [24, 43, 80, 44], [40, 91, 50, 110],
    ]), [[5, 24], [43, 44], [91, 110]]);
});

test('keeps the two complete neighboring fractions as separate equations', () => {
    assert.deepEqual(recovered([
        [40, 5, 49, 24], [24, 43, 80, 44], [40, 64, 49, 83],
        [40, 116, 49, 135], [24, 154, 80, 155], [40, 175, 49, 194],
    ], 180, 220), [[5, 83], [116, 194]]);
});

test('spatial recovery neither removes ink nor reorders independent columns', () => {
    const input = fixture([
        [10, 10, 20, 29], [110, 10, 120, 29],
        [10, 60, 20, 79], [110, 60, 120, 79],
    ]);
    const originalMask = input.mask.slice();
    const output = mergeSpatialOcrLineBands(input.mask, input.width, input.bands, input.scale);
    assert.deepEqual(output, input.bands);
    assert.deepEqual(input.mask, originalMask);
    assert.equal(output.reduce((sum, band) => sum + band.ink, 0),
        input.bands.reduce((sum, band) => sum + band.ink, 0));
});

test('keeps a confirmed operation bar after a very long equation and before a short operation', () => {
    const columns = new Uint32Array(1240);
    for (let x = 10; x <= 1120; x++) columns[x] = 12;
    for (let x = 1170; x <= 1172; x++) columns[x] = 30;
    for (let x = 1190; x <= 1207; x++) columns[x] = 3;
    const box = { x0: 10, y0: 5, x1: 1207, y1: 34 };
    const bar = { x0: 1170, y0: 5, x1: 1172, y1: 34, hasTopHook: false };
    assert.deepEqual(selectOcrOperationSeparator([bar], box, columns), bar);
    assert.equal(selectOcrOperationSeparator([{ ...bar, hasTopHook: true }], box, columns), null);
    const weak = { x0: 1170, y0: 5, x1: 1172, y1: 34 };
    assert.equal(selectOcrOperationSeparator([weak], box, columns), null,
        'weak vector evidence retains the established strict position guard');
});

test('keeps a confirmed operation bar before a long operation but still requires ink on both sides', () => {
    const columns = new Uint32Array(440);
    for (let x = 10; x <= 60; x++) columns[x] = 8;
    for (let x = 84; x <= 86; x++) columns[x] = 30;
    for (let x = 110; x <= 420; x++) columns[x] = 8;
    const box = { x0: 10, y0: 5, x1: 420, y1: 34 };
    const bar = { x0: 84, y0: 5, x1: 86, y1: 34, hasTopHook: false };
    assert.deepEqual(selectOcrOperationSeparator([bar], box, columns), bar);
    columns.fill(0, 87);
    assert.equal(selectOcrOperationSeparator([bar], box, columns), null);
});

test('does not turn a minus between two equation rows into a fraction from coincidentally aligned operands', () => {
    assert.deepEqual(recovered([
        [10, 5, 20, 24], [44, 5, 54, 24], [80, 5, 90, 24],
        [30, 43, 66, 44],
        [10, 64, 20, 83], [44, 64, 54, 83], [80, 64, 90, 83],
    ]), [[5, 24], [43, 44], [64, 83]]);
});

test('lets parallel fraction bars jointly support their numerator and denominator row', () => {
    assert.deepEqual(recovered([
        [29, 5, 40, 24], [109, 5, 120, 24],
        [10, 43, 60, 44], [90, 43, 140, 44],
        [29, 64, 40, 83], [109, 64, 120, 83],
    ]), [[5, 83]]);
});

test('returns the existing bands unchanged when a noisy raster exceeds the component budget', () => {
    const width = 260, height = 70;
    const mask = new Uint8Array(width * height);
    for (let y = 0; y <= 68; y += 2) {
        if (y === 32 || y === 34) continue;
        for (let x = 0; x < width; x += 2) mask[y * width + x] = 1;
    }
    // 4290 mutually disconnected dots exceed the all-or-nothing 4096 limit.
    const bands = [{ y0: 0, y1: 30, ink: 2080 }, { y0: 36, y1: 68, ink: 2210 }];
    assert.deepEqual(mergeSpatialOcrLineBands(mask, width, bands), bands);
});

function outlineGlyph(x: number, y: number, width = 14, height = 28): Rectangle[] {
    return [
        [x, y, x + width - 1, y + 1],
        [x, y + height - 2, x + width - 1, y + height - 1],
        [x, y, x + 1, y + height - 1],
        [x + width - 2, y, x + width - 1, y + height - 1],
    ];
}

test('a tall closing bracket does not turn the complete following equation into a subscript', () => {
    const rectangles: Rectangle[] = [
        [28, 10, 30, 89], [15, 10, 30, 12], [15, 87, 30, 89],
        ...outlineGlyph(0, 18, 10, 20), [0, 47, 11, 48], ...outlineGlyph(0, 59, 10, 20),
        ...outlineGlyph(42, 116), [69, 124, 86, 125], [69, 132, 86, 133], ...outlineGlyph(101, 116),
    ];
    const input = fixture(rectangles, 220, 190);
    assert.deepEqual(input.bands, [{ y0: 10, y1: 89, ink: 550 }, { y0: 116, y1: 143, ink: 376 }],
        'the fixture reproduces the independently observed baseline bands');
    assert.deepEqual(recovered(rectangles, 220, 190), [[10, 89], [116, 143]]);
    assert.deepEqual(recovered(rectangles, 220, 190, 3), [[10, 89], [116, 143]]);
});

test('a genuinely small exponent may attach to a tall bracket using the enclosed glyph scale', () => {
    assert.deepEqual(recovered([
        [35, 0, 40, 7],
        [28, 16, 30, 95], [15, 16, 30, 18], [15, 93, 30, 95],
        ...outlineGlyph(0, 24, 10, 20), [0, 53, 11, 54], ...outlineGlyph(0, 65, 10, 20),
    ], 220, 160), [[0, 95]]);
});

test('a full-height low-ink independent equation vetoes fraction merging even below fifteen percent of the ink', () => {
    const rectangles: Rectangle[] = [];
    for (const y of [5, 64]) {
        for (const x of [8, 24, 40, 56, 72, 88, 104, 120]) rectangles.push(...outlineGlyph(x, y, 12, 20));
        rectangles.push([200, y, 201, y + 19], [240, y, 241, y + 19],
            [216, y + 6, 227, y + 7], [216, y + 12, 227, y + 13]);
    }
    rectangles.push([0, 43, 150, 44]);
    const input = fixture(rectangles, 300, 110);
    assert.deepEqual(input.bands, [
        { y0: 5, y1: 24, ink: 1024 }, { y0: 43, y1: 44, ink: 302 }, { y0: 64, y1: 83, ink: 1024 },
    ]);
    assert.deepEqual(recovered(rectangles, 300, 110), [[5, 24], [43, 44], [64, 83]]);
    assert.deepEqual(recovered(rectangles, 300, 110, 3), [[5, 24], [43, 44], [64, 83]]);
});
