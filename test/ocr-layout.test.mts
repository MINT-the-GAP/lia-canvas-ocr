import assert from 'node:assert/strict';
import test from 'node:test';

import {
    alignFirstTopLevelRelation,
    canComposeOcrOperationSeparator,
    composeOcrLiteralBarParts,
    composeOcrStructuralParts,
    composeMultilineLatex,
    canRestoreOcrPlusMinusFromSplit,
    editableTextToLatex,
    findMissingPlusMinusRootLine,
    findOcrLineBands,
    getOcrOperationSeparators,
    hasOcrNumeralOneTopHook,
    normalizeCalculationLineSequence,
    normalizeOcrOperationSide,
    recoverOcrOperationSeparatorFromWholeLine,
    segmentOcrCanvas,
    splitOcrColumnLineBands,
    splitOcrDivisionLineBands,
    splitOcrLineBandsAtRules,
    insertPlusMinusIntoIndexedRootSolution,
    selectOcrOperationSeparator,
    selectOcrRasterOperationSeparator,
    selectOcrStructuralDelimiters,
    selectOcrStructuralBars
} from '../src/ocr/layout.ts';
import { enqueueOcrJob, promoteOcrJob } from '../src/ocr/job-queue.ts';

type RasterRectangle = readonly [x0: number, y0: number, x1: number, y1: number];
type CalculationRuleBox = {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
};

function fakeRasterCanvas(
    width: number,
    height: number,
    rectangles: readonly RasterRectangle[],
    calculationRules: readonly CalculationRuleBox[] = [],
    carryOnes: readonly CalculationRuleBox[] = [],
    divisionRules: readonly CalculationRuleBox[] = []
): HTMLCanvasElement {
    const pixels = new Uint8ClampedArray(width * height * 4);
    for (let offset = 0; offset < pixels.length; offset += 4) {
        pixels[offset] = 255;
        pixels[offset + 1] = 255;
        pixels[offset + 2] = 255;
        pixels[offset + 3] = 255;
    }
    for (const [rawX0, rawY0, rawX1, rawY1] of rectangles) {
        const x0 = Math.max(0, Math.min(rawX0, rawX1));
        const x1 = Math.min(width - 1, Math.max(rawX0, rawX1));
        const y0 = Math.max(0, Math.min(rawY0, rawY1));
        const y1 = Math.min(height - 1, Math.max(rawY0, rawY1));
        for (let y = y0; y <= y1; y++) {
            for (let x = x0; x <= x1; x++) {
                const offset = (y * width + x) * 4;
                pixels[offset] = 0;
                pixels[offset + 1] = 0;
                pixels[offset + 2] = 0;
            }
        }
    }

    const canvas: any = {
        width,
        height,
        __liaOcrCalculationRules: calculationRules.map(rule => ({ ...rule })),
        __liaOcrCarryOneHints: carryOnes.map(carry => ({ ...carry })),
        __liaOcrDivisionRules: divisionRules.map(rule => ({ ...rule }))
    };
    canvas.getContext = () => ({
        getImageData: () => ({ data: pixels }),
        createImageData: (imageWidth: number, imageHeight: number) => ({
            width: imageWidth,
            height: imageHeight,
            data: new Uint8ClampedArray(imageWidth * imageHeight * 4)
        }),
        putImageData: () => undefined
    });
    return canvas as HTMLCanvasElement;
}

function withFakeCanvasDocument<T>(run: () => T): T {
    const original = Object.getOwnPropertyDescriptor(globalThis, 'document');
    Object.defineProperty(globalThis, 'document', {
        configurable: true,
        writable: true,
        value: {
            createElement: (tagName: string) => {
                assert.equal(tagName, 'canvas');
                return fakeRasterCanvas(0, 0, []);
            }
        }
    });
    try {
        return run();
    } finally {
        if (original) Object.defineProperty(globalThis, 'document', original);
        else delete (globalThis as { document?: unknown }).document;
    }
}

function segmentSummary(segments: ReturnType<typeof segmentOcrCanvas>) {
    return segments.map(segment => ({
        bbox: segment.bbox,
        fingerprint: segment.fingerprint,
        inkPixels: segment.inkPixels
    }));
}

function projection(height: number, spans: Array<[number, number, number]>): number[] {
    const rows = new Array<number>(height).fill(0);
    for (const [from, to, ink] of spans) {
        for (let y = from; y <= to; y++) rows[y] = ink;
    }
    return rows;
}

test('detects two clearly separated handwriting lines', () => {
    const bands = findOcrLineBands(projection(64, [
        [5, 16, 24],
        [39, 51, 22]
    ]), 220);
    assert.deepEqual(bands.map(({ y0, y1 }) => [y0, y1]), [[5, 16], [39, 51]]);
});

test('keeps numerator, fraction bar and denominator in one math line', () => {
    const bands = findOcrLineBands(projection(48, [
        [5, 11, 10],
        [16, 17, 32],
        [23, 30, 11]
    ]), 180);
    assert.deepEqual(bands.map(({ y0, y1 }) => [y0, y1]), [[5, 30]]);
});

test('keeps a high-DPI fraction together without swallowing the following line', () => {
    const rows = projection(160, [
        [15, 33, 30],
        [48, 53, 96],
        [69, 90, 33],
        [126, 146, 42]
    ]);
    const bands = findOcrLineBands(rows, 540, 3);
    assert.deepEqual(bands.map(({ y0, y1 }) => [y0, y1]), [[15, 90], [126, 146]]);
    const wideCanvasBands = findOcrLineBands(rows, 3000, 3);
    assert.deepEqual(
        wideCanvasBands.map(({ y0, y1 }) => [y0, y1]),
        [[15, 90], [126, 146]]
    );
});

test('keeps a superscript or dot with the neighboring baseline', () => {
    const bands = findOcrLineBands(projection(48, [
        [8, 11, 5],
        [14, 15, 2],
        [20, 30, 26]
    ]), 180);
    assert.deepEqual(bands.map(({ y0, y1 }) => [y0, y1]), [[8, 30]]);
});

test('filters a single isolated raster-noise pixel', () => {
    const bands = findOcrLineBands(projection(48, [
        [3, 3, 1],
        [20, 31, 20]
    ]), 220);
    assert.deepEqual(bands.map(({ y0, y1 }) => [y0, y1]), [[20, 31]]);
});

test('does not let a tiny middle speck join two real handwriting lines', () => {
    const bands = findOcrLineBands(projection(128, [
        [10, 30, 30],
        [42, 43, 1],
        [55, 75, 30]
    ]), 400);
    assert.deepEqual(bands.map(({ y0, y1 }) => [y0, y1]), [[10, 30], [55, 75]]);
});

test('does not silently merge a ninth handwriting line', () => {
    const spans: Array<[number, number, number]> = [];
    for (let line = 0; line < 9; line++) {
        const y = 4 + line * 16;
        spans.push([y, y + 7, 20]);
    }
    const bands = findOcrLineBands(projection(152, spans), 240);
    assert.equal(bands.length, 9);
});

test('reopens tightly spaced full-size operands only for a confirmed column rule', () => {
    const rows = projection(140, [
        [10, 30, 24],
        [34, 54, 23],
        [72, 80, 7],
        [110, 130, 24]
    ]);
    const generic = findOcrLineBands(rows, 220);
    assert.deepEqual(
        generic.map(({ y0, y1 }) => [y0, y1]),
        [[10, 54], [72, 80], [110, 130]],
        'the generic fraction-safe segmenter deliberately merges the close rows'
    );
    assert.deepEqual(
        splitOcrColumnLineBands(
            rows,
            generic,
            [{ x0: 20, y0: 94, x1: 180, y1: 98 }],
            2
        ).map(({ y0, y1 }) => [y0, y1]),
        [[10, 30], [34, 54], [72, 80], [110, 130]]
    );
    assert.deepEqual(
        splitOcrColumnLineBands(rows, generic, [], 2),
        generic,
        'without an independently confirmed rule no band is reopened'
    );
});

test('separates two full operands and a smaller annotation from one merged band', () => {
    const rows = projection(130, [
        [10, 30, 24],
        [33, 53, 23],
        [56, 65, 8],
        [100, 120, 24]
    ]);
    const generic = findOcrLineBands(rows, 220);
    assert.deepEqual(
        generic.map(({ y0, y1 }) => [y0, y1]),
        [[10, 65], [100, 120]],
        'both operand gaps and the nearby annotation are generically merged'
    );
    assert.deepEqual(
        splitOcrColumnLineBands(
            rows,
            generic,
            [{ x0: 20, y0: 82, x1: 180, y1: 86 }],
            2
        ).map(({ y0, y1 }) => [y0, y1]),
        [[10, 30], [33, 53], [56, 65], [100, 120]]
    );
});

test('splits two touching operand rows from the observed result-row height', () => {
    const rows = projection(210, [
        [10, 92, 24],
        [110, 135, 8],
        [155, 196, 24]
    ]);
    rows[50] = 4;
    rows[51] = 3;
    const generic = findOcrLineBands(rows, 220);
    assert.deepEqual(
        generic.map(({ y0, y1 }) => [y0, y1]),
        [[10, 92], [110, 135], [155, 196]]
    );
    assert.deepEqual(
        splitOcrColumnLineBands(
            rows,
            generic,
            [{ x0: 20, y0: 140, x1: 180, y1: 144 }],
            2
        ).map(({ y0, y1 }) => [y0, y1]),
        [[10, 50], [51, 92], [110, 135], [155, 196]]
    );
});

test('does not promote a superscript-sized component to a column operand', () => {
    const rows = projection(96, [
        [8, 13, 5],
        [17, 37, 24],
        [62, 82, 24]
    ]);
    const generic = findOcrLineBands(rows, 220);
    assert.deepEqual(
        splitOcrColumnLineBands(
            rows,
            generic,
            [{ x0: 20, y0: 48, x1: 180, y1: 51 }],
            2
        ),
        generic
    );
});

test('column canvas segmentation applies the tight-row recovery end to end', () => {
    withFakeCanvasDocument(() => {
        const rule = { x0: 42, y0: 140, x1: 178, y1: 144 };
        const source = fakeRasterCanvas(220, 210, [
            [70, 10, 150, 50],
            [48, 50, 150, 91],
            [90, 110, 130, 135],
            [42, 140, 178, 144],
            [70, 155, 150, 196]
        ], [rule]);
        const genericColumn = segmentOcrCanvas(source, 1, {
            maskCalculationRules: true
        });
        const subtractionColumn = segmentOcrCanvas(source, 1, {
            maskCalculationRules: true,
            minimumColumnRowsAboveRule: 2
        });
        assert.deepEqual(
            genericColumn.map(segment => [segment.inkBox.y, segment.inkBox.height]),
            [[10, 82], [110, 26], [155, 42]]
        );
        assert.deepEqual(
            subtractionColumn.length,
            4,
            'touching operands, annotation and result must become four crops'
        );
    });
});

test('masks a written-addition rule only in the explicit column segmentation mode', () => {
    withFakeCanvasDocument(() => {
        const calculationRule = { x0: 50, y0: 95, x1: 134, y1: 99 };
        const rectangles: RasterRectangle[] = [
            // First operand: 4379.
            [72, 10, 78, 22], [86, 10, 92, 22],
            [100, 10, 106, 22], [114, 10, 120, 22],
            // Plus sign and second operand: +1544.
            [56, 45, 66, 47], [60, 40, 62, 52],
            [72, 40, 78, 52], [86, 40, 92, 52],
            [100, 40, 106, 52], [114, 40, 120, 52],
            // Exactly two small carry ones.
            [99, 68, 103, 70], [102, 68, 104, 76],
            [113, 68, 117, 70], [116, 68, 118, 76],
            // Long written-calculation rule.
            [52, 96, 132, 98],
            // Result: 5923.
            [72, 120, 78, 132], [86, 120, 92, 132],
            [100, 120, 106, 132], [114, 120, 120, 132]
        ];
        const source = fakeRasterCanvas(
            160,
            148,
            rectangles,
            [calculationRule],
            [
                { x0: 99, y0: 68, x1: 104, y1: 76 },
                { x0: 113, y0: 68, x1: 118, y1: 76 }
            ]
        );

        const legacy = segmentOcrCanvas(source);
        const explicitLegacy = segmentOcrCanvas(source, 1, {
            maskCalculationRules: false
        });
        const column = segmentOcrCanvas(source, 1, {
            maskCalculationRules: true
        });
        const columnWithoutStructuralCarries = segmentOcrCanvas(source, 1, {
            maskCalculationRules: true,
            maskCarryOnes: true
        });

        assert.deepEqual(
            segmentSummary(explicitLegacy),
            segmentSummary(legacy),
            'omitting the opt-in must preserve the existing equation segmentation'
        );
        assert.equal(legacy.length, 5);
        assert.equal(column.length, 4);
        assert.equal(columnWithoutStructuralCarries.length, 3);

        const ruleY = 97;
        const coversY = (segment: (typeof legacy)[number], y: number) =>
            segment.bbox.y <= y && y < segment.bbox.y + segment.bbox.height;
        assert.equal(
            legacy.filter(segment => coversY(segment, ruleY)).length,
            1,
            'the legacy path retains the long rule as its own OCR crop'
        );
        assert.equal(
            column.some(segment => coversY(segment, ruleY)),
            false,
            'the column path must not send the calculation rule to OCR'
        );
        for (const rowY of [16, 46, 72, 126]) {
            assert.equal(
                column.filter(segment => coversY(segment, rowY)).length,
                1,
                'masking the rule must retain every semantic addition row'
            );
        }
        assert.equal(
            columnWithoutStructuralCarries.some(segment => coversY(segment, 72)),
            false,
            'geometrically confirmed carries must not be sent to whole-row OCR'
        );
        for (const rowY of [16, 46, 126]) {
            assert.equal(
                columnWithoutStructuralCarries.filter(segment => coversY(segment, rowY)).length,
                1,
                'masking carry cells must retain operands and result'
            );
        }
    });
});

test('keeps fraction and equation horizontals unchanged outside confirmed rule masking', () => {
    withFakeCanvasDocument(() => {
        const fractionRectangles: RasterRectangle[] = [
            [60, 10, 72, 18],
            [45, 23, 87, 25],
            [60, 30, 72, 38]
        ];
        const fraction = fakeRasterCanvas(120, 52, fractionRectangles, [{
            x0: 44, y0: 22, x1: 88, y1: 26
        }]);
        const fractionLegacy = segmentOcrCanvas(fraction);
        const fractionExplicitEquation = segmentOcrCanvas(fraction, 1, {
            maskCalculationRules: false
        });
        assert.equal(fractionLegacy.length, 1);
        assert.deepEqual(
            segmentSummary(fractionExplicitEquation),
            segmentSummary(fractionLegacy),
            'a fraction bar remains part of its equation without the column opt-in'
        );

        const equation = fakeRasterCanvas(150, 52, [
            [12, 18, 30, 32],
            [42, 23, 54, 25],
            [66, 18, 82, 32],
            [94, 21, 108, 23],
            [94, 27, 108, 29],
            [120, 18, 136, 32]
        ]);
        assert.deepEqual(
            segmentSummary(segmentOcrCanvas(equation, 1, {
                maskCalculationRules: true
            })),
            segmentSummary(segmentOcrCanvas(equation)),
            'ordinary minus and equality strokes are untouched without rule metadata'
        );
    });
});

test('masks every confirmed long-division underline without dropping number rows', () => {
    withFakeCanvasDocument(() => {
        const divisionRules = [
            { x0: 45, y0: 58, x1: 82, y1: 60 },
            { x0: 58, y0: 118, x1: 104, y1: 120 }
        ];
        const rectangles: RasterRectangle[] = [
            // 8736:8=1092
            [40, 8, 100, 22], [108, 8, 118, 22], [126, 8, 168, 22],
            // -8 and its underline
            [44, 38, 52, 40], [60, 32, 70, 48], [45, 58, 82, 60],
            // 07
            [60, 72, 72, 88], [80, 72, 92, 88],
            // -72 and its underline
            [58, 98, 66, 100], [72, 92, 84, 108], [90, 92, 102, 108],
            [58, 118, 104, 120],
            // 16
            [80, 132, 90, 148], [98, 132, 110, 148]
        ];
        const source = fakeRasterCanvas(
            190,
            164,
            rectangles,
            [],
            [],
            divisionRules
        );
        const unmasked = segmentOcrCanvas(source);
        const division = segmentOcrCanvas(source, 1, { maskDivisionRules: true });
        const coversY = (segment: (typeof division)[number], y: number) =>
            segment.bbox.y <= y && y < segment.bbox.y + segment.bbox.height;

        assert.ok(unmasked.some(segment => coversY(segment, 59)));
        assert.equal(division.some(segment => coversY(segment, 59)), false);
        assert.equal(division.some(segment => coversY(segment, 119)), false);
        for (const rowY of [15, 40, 80, 100, 140]) {
            assert.equal(
                division.filter(segment => coversY(segment, rowY)).length,
                1,
                'division masking must retain semantic row y=' + rowY
            );
        }
    });
});

test('uses confirmed division rules as hard boundaries for conservatively merged bands', () => {
    const rowInk = new Uint32Array(90);
    rowInk.fill(3, 5, 86);
    rowInk.fill(0, 30, 34);
    rowInk.fill(0, 60, 64);
    assert.deepEqual(
        splitOcrLineBandsAtRules(
            rowInk,
            [{ y0: 5, y1: 85, ink: 219 }],
            [
                { x0: 10, y0: 30, x1: 60, y1: 33 },
                { x0: 12, y0: 60, x1: 62, y1: 63 }
            ]
        ),
        [
            { y0: 5, y1: 29, ink: 75 },
            { y0: 34, y1: 59, ink: 78 },
            { y0: 64, y1: 85, ink: 66 }
        ]
    );
});

test('splits the two semantic rows before every long-division underline', () => {
    const rowInk = new Uint32Array(150);
    const inkRun = (from: number, to: number, value = 4) =>
        rowInk.fill(value, from, to + 1);
    // top/product, partial/product, partial/product, final remainder
    inkRun(4, 14, 9);
    inkRun(21, 29, 3);
    inkRun(38, 47, 4);
    inkRun(53, 61, 3);
    inkRun(70, 79, 4);
    inkRun(85, 93, 3);
    inkRun(103, 112, 4);
    const rules = [
        { x0: 1, y0: 31, x1: 20, y1: 34 },
        { x0: 1, y0: 63, x1: 20, y1: 66 },
        { x0: 1, y0: 95, x1: 20, y1: 98 }
    ];
    assert.deepEqual(
        splitOcrDivisionLineBands(
            rowInk,
            [
                { y0: 4, y1: 29, ink: 126 },
                { y0: 38, y1: 61, ink: 67 },
                { y0: 70, y1: 93, ink: 67 },
                { y0: 103, y1: 112, ink: 40 }
            ],
            rules
        ).map(band => [band.y0, band.y1]),
        [
            [4, 14], [21, 29],
            [38, 47], [53, 61],
            [70, 79], [85, 93],
            [103, 112]
        ]
    );
});

test('uses a conservative ink valley when responsive division rows touch', () => {
    const rowInk = new Uint32Array(40);
    rowInk.fill(8, 4, 14);
    rowInk.fill(2, 14, 16);
    rowInk.fill(6, 16, 27);
    assert.deepEqual(
        splitOcrDivisionLineBands(
            rowInk,
            [{ y0: 4, y1: 26, ink: 150 }],
            [{ x0: 0, y0: 29, x1: 20, y1: 31 }]
        ).map(band => [band.y0, band.y1]),
        [[4, 14], [15, 26]]
    );
});

test('distinguishes a hookless operation bar from a handwritten digit one', () => {
    assert.equal(hasOcrNumeralOneTopHook([
        { x: 20, y: 0 },
        { x: 23, y: 30 },
        { x: 26, y: 60 }
    ], 2), false);
    assert.equal(hasOcrNumeralOneTopHook([
        { x: 20, y: 0 },
        { x: 30, y: 8 },
        { x: 30, y: 32 },
        { x: 30, y: 60 }
    ], 2), true);
});

test('reassembles non-semantic hookless bars as literal TeX bars', () => {
    assert.equal(
        composeOcrLiteralBarParts(['1', '1']),
        '1 \\vert 1'
    );
    assert.equal(
        composeOcrLiteralBarParts(['1/5', '5']),
        '1/5 \\vert 5'
    );
    assert.equal(
        composeOcrLiteralBarParts(['1+1=11', '11']),
        '1+1=11 \\vert 11'
    );
    assert.equal(
        composeOcrLiteralBarParts(['', 'x', '']),
        ' \\vert x \\vert '
    );
});

test('reassembles nested screenshot delimiters and bars in reading order', () => {
    assert.equal(
        composeOcrStructuralParts(
            ['', '', '12', '3', '', '7', ''],
            ['[', '(', '\\vert', ')', '\\vert', ']']
        ),
        '[(12 \\vert 3) \\vert 7]'
    );
    assert.equal(
        composeOcrStructuralParts(['', '7:8', ''], ['[', ']']),
        '[7:8]'
    );
    assert.equal(
        composeOcrStructuralParts(['A', '1', '31', ''], ['(', '\\vert', ')']),
        'A(1 \\vert 31)'
    );
    assert.equal(composeOcrStructuralParts(['x'], ['(']), '');
});

test('composes one line unchanged and multiple lines as aligned TeX', () => {
    assert.equal(composeMultilineLatex(['x+1=2']), 'x+1=2');
    assert.equal(
        composeMultilineLatex(['x+1=2', 'y=3']),
        '\\begin{aligned} x+1&=2 \\\\ y&=3 \\end{aligned}'
    );
    assert.equal(
        editableTextToLatex(' x+1=2 \r\n\n y=3 '),
        '\\begin{aligned} x+1&=2 \\\\ y&=3 \\end{aligned}'
    );
});

test('recovers a vector-confirmed operation bar from the whole-line OCR text', () => {
    assert.equal(
        recoverOcrOperationSeparatorFromWholeLine(
            '3x^{2}=7 :3',
            '3x^{2}=7'
        ),
        '3x^{2}=7 \\mid :3'
    );
    assert.equal(
        recoverOcrOperationSeparatorFromWholeLine(
            '3x^{2}=321:3',
            '3x^{2}=32'
        ),
        '3x^{2}=32 \\mid :3'
    );
    assert.equal(
        recoverOcrOperationSeparatorFromWholeLine(
            '5x^{2}-7=-4+7',
            '5x^{2}-7=-4'
        ),
        '5x^{2}-7=-4 \\mid +7'
    );
    assert.equal(
        recoverOcrOperationSeparatorFromWholeLine(
            '8x^{2}=181:8',
            '8x^{2}=18'
        ),
        '8x^{2}=18 \\mid :8',
        'a hookless school-operation bar must not survive as the extra 1 in 181:8'
    );
    assert.equal(
        recoverOcrOperationSeparatorFromWholeLine(
            '4x^{2}-5=-21+5',
            '4x^{2}-5=-2'
        ),
        '4x^{2}-5=-2 \\mid +5'
    );
    assert.equal(
        recoverOcrOperationSeparatorFromWholeLine(
            '4x^{2}=31:4',
            '4x^{2}=3'
        ),
        '4x^{2}=3 \\mid :4'
    );
});

test('keeps every hookless operation-bar candidate until semantic recognition', () => {
    const candidates = Array.from({ length: 5 }, (_, index) => ({
        x0: 10 + index * 10,
        x1: 12 + index * 10,
        source: 'vector' as const,
        confidence: 'high' as const
    }));
    assert.deepEqual(
        getOcrOperationSeparators({ operationSeparators: candidates }),
        candidates,
        'the real operation bar may follow three higher-scoring digit stems'
    );
});

test('does not invent an operation bar without matching left-side evidence', () => {
    assert.equal(
        recoverOcrOperationSeparatorFromWholeLine('3x=6:3', ''),
        null
    );
    assert.equal(
        recoverOcrOperationSeparatorFromWholeLine('3x=6:3', '3x=7'),
        null
    );
    assert.equal(
        recoverOcrOperationSeparatorFromWholeLine(
            '3x^{2}=327:3',
            '3x^{2}=32'
        ),
        null
    );
    assert.equal(
        recoverOcrOperationSeparatorFromWholeLine(
            String.raw`x=\frac{6}{3}`,
            'x=6'
        ),
        null
    );
});

test('offers an explicit plus-minus repair only for indexed root notation', () => {
    const missing = String.raw`\Rightarrow x_{1,2}=\sqrt{\frac{32}{3}}`;
    assert.equal(findMissingPlusMinusRootLine([
        String.raw`x^2=\frac{32}{3}`,
        missing
    ]), 1);
    assert.equal(
        insertPlusMinusIntoIndexedRootSolution(missing),
        String.raw`\Rightarrow x_{1,2}=\pm\sqrt{\frac{32}{3}}`
    );
    assert.equal(
        insertPlusMinusIntoIndexedRootSolution(
            String.raw`x_{1,2}=\pm\sqrt{\frac{32}{3}}`
        ),
        null
    );
    assert.equal(
        insertPlusMinusIntoIndexedRootSolution(
            String.raw`x=\sqrt{\frac{32}{3}}`
        ),
        null
    );
    assert.equal(findMissingPlusMinusRootLine([
        String.raw`x_{1,2}=\pm\sqrt{4}`
    ]), -1);
    assert.equal(findMissingPlusMinusRootLine([
        String.raw`y^2=\frac{32}{3}`,
        missing
    ]), -1);
    assert.equal(findMissingPlusMinusRootLine([missing]), -1);
    assert.equal(
        insertPlusMinusIntoIndexedRootSolution(
            String.raw`x_{1,2}=\sqrt{x\pm1}`
        ),
        null
    );
    assert.equal(
        canRestoreOcrPlusMinusFromSplit(
            String.raw`\Rightarrow x_{12}=`,
            String.raw`\sqrt{\frac{32}{3}}`
        ),
        true
    );
    assert.equal(
        canRestoreOcrPlusMinusFromSplit('x_{12}=1', String.raw`\sqrt{4}`),
        false
    );
});

test('aligns only the first outer relation and preserves transformation bars', () => {
    assert.equal(
        composeMultilineLatex(['3x-7=5 \\mid +7', '3x=12 \\mid :3', 'x=4']),
        '\\begin{aligned} 3x-7&=5 \\mid +7 \\\\ 3x&=12 \\mid :3 \\\\ x&=4 \\end{aligned}'
    );
    assert.equal(alignFirstTopLevelRelation('a=b=c'), 'a&=b=c');
    assert.equal(alignFirstTopLevelRelation('f(x=1)=2'), 'f(x=1)&=2');
    assert.equal(alignFirstTopLevelRelation('\\text{a=b}:x=1'), '\\text{a=b}:x&=1');
    assert.equal(alignFirstTopLevelRelation('\\left(x+1\\right)=2'), '\\left(x+1\\right)&=2');
    assert.equal(alignFirstTopLevelRelation('x&=1'), 'x&=1');
    assert.equal(alignFirstTopLevelRelation('|x|=3'), '|x|&=3');
    assert.equal(alignFirstTopLevelRelation('x \\approx 1'), 'x &\\approx 1');
});

test('repairs an exists-sign confusion only inside a proven algebra sequence', () => {
    assert.deepEqual(
        normalizeCalculationLineSequence(['3x-7=5', '\u2203 x=12', 'x=4']),
        ['3x-7=5', '3x=12', 'x=4']
    );
    assert.deepEqual(
        normalizeCalculationLineSequence(['3x-7=5', '\\exists x =12', 'x=4']),
        ['3x-7=5', '3x=12', 'x=4']
    );
    assert.deepEqual(
        normalizeCalculationLineSequence(['\\exists x=12']),
        ['\\exists x=12']
    );
    assert.deepEqual(
        normalizeCalculationLineSequence(['\\exists x\\in\\mathbb R: x^2=4']),
        ['\\exists x\\in\\mathbb R: x^2=4']
    );
    assert.deepEqual(
        normalizeCalculationLineSequence(['3x+1', '\\exists x=12', 'x=4']),
        ['3x+1', '\\exists x=12', 'x=4']
    );
    assert.deepEqual(normalizeCalculationLineSequence(['x=51+7']), ['x=51+7']);
});

test('repairs the screenshot coefficient-dot OCR error only from an adjacent variable', () => {
    assert.deepEqual(
        normalizeCalculationLineSequence([
            String.raw`3\cdot-5=8 \mid +5`,
            String.raw`3\cdot=13 \mid :3`,
            String.raw`X=\frac{13}{3}`
        ]),
        [
            String.raw`3x-5=8 \mid +5`,
            String.raw`3x=13 \mid :3`,
            String.raw`x=\frac{13}{3}`
        ]
    );
});

test('prefers lowercase x only for an otherwise uncontextualized algebra variable', () => {
    assert.deepEqual(
        normalizeCalculationLineSequence(['3X-5=7', '3X=12', 'X=4']),
        ['3x-5=7', '3x=12', 'x=4']
    );
    assert.deepEqual(normalizeCalculationLineSequence(['X=4']), ['x=4']);
    assert.deepEqual(
        normalizeCalculationLineSequence([String.raw`\frac{X+1}{2}=3`]),
        [String.raw`\frac{x+1}{2}=3`]
    );
    assert.deepEqual(normalizeCalculationLineSequence(['X+Y=7']), ['X+Y=7']);
    assert.deepEqual(normalizeCalculationLineSequence(['X_0=4']), ['X_0=4']);
    assert.deepEqual(
        normalizeCalculationLineSequence([String.raw`\vec{X}=4`]),
        [String.raw`\vec{X}=4`]
    );
    assert.equal(editableTextToLatex('X=4'), 'X=4');
});

test('repairs a coefficient-dot from the correctly recognized following equation row', () => {
    assert.deepEqual(
        normalizeCalculationLineSequence([
            String.raw`3\cdot-5=7 \mid +5`,
            String.raw`3x=12 \mid :3`,
            String.raw`x=4`
        ]),
        [
            String.raw`3x-5=7 \mid +5`,
            String.raw`3x=12 \mid :3`,
            String.raw`x=4`
        ]
    );
    assert.deepEqual(
        normalizeCalculationLineSequence([
            String.raw`3\cdot(-5)=-15`,
            String.raw`3x=12`
        ]),
        [
            String.raw`3\cdot(-5)=-15`,
            String.raw`3x=12`
        ]
    );
    assert.deepEqual(
        normalizeCalculationLineSequence([
            String.raw`3\cdot 5=15`,
            String.raw`3x=12`
        ]),
        [
            String.raw`3\cdot 5=15`,
            String.raw`3x=12`
        ]
    );
});

test('does not invent a variable for genuine multiplication or without a unique neighbor', () => {
    assert.deepEqual(
        normalizeCalculationLineSequence([
            String.raw`3\cdot(-5)=-15`,
            String.raw`X=-15`
        ]),
        [
            String.raw`3\cdot(-5)=-15`,
            String.raw`x=-15`
        ]
    );
    assert.deepEqual(
        normalizeCalculationLineSequence([String.raw`3\cdot=13 \mid :3`]),
        [String.raw`3\cdot=13 \mid :3`]
    );
    assert.deepEqual(
        normalizeCalculationLineSequence([
            String.raw`X=1`,
            String.raw`3\cdot=13`,
            String.raw`Y=2`
        ]),
        [
            String.raw`X=1`,
            String.raw`3\cdot=13`,
            String.raw`Y=2`
        ]
    );
});

test('requires a relation on the left and an operation on the right of a separator', () => {
    assert.equal(canComposeOcrOperationSeparator('3x=12', ':3'), true);
    assert.equal(canComposeOcrOperationSeparator('3x-7=5', '+7'), true);
    assert.equal(canComposeOcrOperationSeparator('5x^{2}-7=-4', '+7'), true);
    assert.equal(canComposeOcrOperationSeparator('5x^{2}-7=-', '+7'), false);
    assert.equal(canComposeOcrOperationSeparator('5x^{2}=3', ':5'), true);
    assert.equal(canComposeOcrOperationSeparator('x=', '+2'), false);
    assert.equal(canComposeOcrOperationSeparator('x=2+', '+3'), false);
    assert.equal(canComposeOcrOperationSeparator('x=|4', '+0'), false);
    assert.equal(canComposeOcrOperationSeparator(String.raw`x=\lvert 4`, '+0'), false);
    assert.equal(normalizeOcrOperationSide(';4'), ':4');
    assert.equal(normalizeOcrOperationSide(' ; 4 '), ': 4');
    assert.equal(normalizeOcrOperationSide(';5'), ':5');
    assert.equal(normalizeOcrOperationSide('=8'), ':8');
    assert.equal(normalizeOcrOperationSide('= 8'), ': 8');
    assert.equal(normalizeOcrOperationSide('==8'), '==8');
    assert.equal(normalizeOcrOperationSide('+8'), '+8');
    assert.equal(normalizeOcrOperationSide('1;4'), '1;4');
    assert.equal(normalizeOcrOperationSide(';'), ';');
    assert.equal(canComposeOcrOperationSeparator('|x', '=3'), false);
    assert.equal(canComposeOcrOperationSeparator('x=|y', '+3'), false);
    assert.equal(canComposeOcrOperationSeparator('x=\\lvert y', '+3'), false);
    assert.equal(canComposeOcrOperationSeparator('x=\\vert y', '+3'), false);
    assert.equal(canComposeOcrOperationSeparator('x \\to', '+1'), false);
    assert.equal(canComposeOcrOperationSeparator('x=1', '2'), false);
    assert.equal(canComposeOcrOperationSeparator('x=51+7', ''), false);
});

test('selects a separated tall operation stroke but not a neighboring digit one', () => {
    const columns = new Array<number>(120).fill(0);
    const yMin = new Array<number>(120).fill(8);
    const yMax = new Array<number>(120).fill(25);
    for (let x = 4; x <= 58; x++) columns[x] = 5;
    for (let x = 72; x <= 74; x++) {
        columns[x] = 30;
        yMin[x] = 1;
        yMax[x] = 30;
    }
    for (let x = 88; x <= 108; x++) columns[x] = 5;
    const separator = { x0: 72, y0: 1, x1: 74, y1: 30 };
    assert.deepEqual(
        selectOcrOperationSeparator(
            [separator],
            { x0: 4, y0: 0, x1: 108, y1: 31 },
            columns,
            1,
            yMin,
            yMax
        ),
        separator
    );
    assert.equal(
        selectOcrOperationSeparator(
            [{ ...separator, hasTopHook: true }],
            { x0: 4, y0: 0, x1: 108, y1: 31 },
            columns,
            1,
            yMin,
            yMax
        ),
        null
    );
    assert.deepEqual(
        selectOcrOperationSeparator(
            [{ ...separator, hasTopHook: false }],
            { x0: 4, y0: 0, x1: 108, y1: 31 },
            columns,
            1,
            yMin,
            yMax
        ),
        { ...separator, hasTopHook: false }
    );
    const pairedColumns = new Array<number>(130).fill(0);
    const pairedYMin = new Array<number>(130).fill(8);
    const pairedYMax = new Array<number>(130).fill(25);
    for (let x = 4; x <= 55; x++) pairedColumns[x] = 5;
    for (let x = 66; x <= 68; x++) {
        pairedColumns[x] = 30;
        pairedYMin[x] = 1;
        pairedYMax[x] = 30;
    }
    for (let x = 78; x <= 84; x++) pairedColumns[x] = 5;
    for (let x = 94; x <= 96; x++) {
        pairedColumns[x] = 30;
        pairedYMin[x] = 1;
        pairedYMax[x] = 30;
    }
    for (let x = 106; x <= 120; x++) pairedColumns[x] = 5;
    const openingAbsoluteBar = {
        x0: 66, y0: 1, x1: 68, y1: 30, hasTopHook: false
    };
    const closingAbsoluteBar = {
        x0: 94, y0: 1, x1: 96, y1: 30, hasTopHook: false
    };
    assert.equal(
        selectOcrOperationSeparator(
            [openingAbsoluteBar, closingAbsoluteBar],
            { x0: 4, y0: 0, x1: 120, y1: 31 },
            pairedColumns,
            1,
            pairedYMin,
            pairedYMax
        ),
        null,
        'paired hookless strokes must remain available for absolute-value notation'
    );
    const digitFourColumns = columns.slice();
    const digitFourYMin = yMin.slice();
    const digitFourYMax = yMax.slice();
    for (let x = 78; x <= 84; x++) {
        digitFourColumns[x] = 5;
        digitFourYMin[x] = 8;
        digitFourYMax[x] = 25;
    }
    for (let x = 82; x <= 84; x++) {
        digitFourColumns[x] = 30;
        digitFourYMin[x] = 1;
        digitFourYMax[x] = 30;
    }
    assert.deepEqual(
        selectOcrOperationSeparator(
            [
                { ...separator, hasTopHook: false },
                { x0: 82, y0: 1, x1: 84, y1: 30, hasTopHook: false }
            ],
            { x0: 4, y0: 0, x1: 108, y1: 31 },
            digitFourColumns,
            1,
            digitFourYMin,
            digitFourYMax
        ),
        { ...separator, hasTopHook: false },
        'an attached vertical digit-4 stem must not suppress the isolated operation bar'
    );
    const detachedFourColumns = new Array<number>(140).fill(0);
    const detachedFourYMin = new Array<number>(140).fill(8);
    const detachedFourYMax = new Array<number>(140).fill(25);
    const paintDetached = (
        from: number,
        to: number,
        ink: number,
        minimum: number,
        maximum: number
    ) => {
        for (let x = from; x <= to; x++) {
            detachedFourColumns[x] = ink;
            detachedFourYMin[x] = minimum;
            detachedFourYMax[x] = maximum;
        }
    };
    paintDetached(4, 70, 5, 8, 25);
    paintDetached(82, 84, 30, 1, 30);
    paintDetached(94, 96, 6, 10, 22);
    paintDetached(102, 109, 5, 8, 25);
    paintDetached(112, 114, 30, 1, 30);
    paintDetached(117, 120, 5, 15, 18);
    const detachedOperationBar = {
        x0: 82, y0: 1, x1: 84, y1: 30, hasTopHook: false
    };
    const detachedFourStem = {
        x0: 112, y0: 1, x1: 114, y1: 30, hasTopHook: false
    };
    assert.deepEqual(
        selectOcrOperationSeparator(
            [detachedOperationBar, detachedFourStem],
            { x0: 4, y0: 0, x1: 120, y1: 31 },
            detachedFourColumns,
            1,
            detachedFourYMin,
            detachedFourYMax
        ),
        detachedOperationBar,
        'a separately drawn 4-stem must not hide the more isolated operation bar'
    );

    const tightColumns = new Array<number>(120).fill(0);
    for (let x = 4; x <= 68; x++) tightColumns[x] = 5;
    for (let x = 72; x <= 74; x++) tightColumns[x] = 30;
    for (let x = 77; x <= 108; x++) tightColumns[x] = 5;
    assert.equal(
        selectOcrOperationSeparator(
            [separator],
            { x0: 4, y0: 0, x1: 108, y1: 31 },
            tightColumns
        ),
        null
    );

    const equalHeightColumns = columns.slice();
    const equalHeightYMin = yMin.slice();
    const equalHeightYMax = yMax.slice();
    for (let x = 0; x < equalHeightColumns.length; x++) {
        if (equalHeightColumns[x] <= 0) continue;
        equalHeightYMin[x] = 5;
        equalHeightYMax[x] = 23;
    }
    for (let x = 72; x <= 74; x++) {
        equalHeightColumns[x] = 18;
        equalHeightYMin[x] = 6;
        equalHeightYMax[x] = 23;
    }
    const equalHeightSeparator = { x0: 72, y0: 6, x1: 74, y1: 23 };
    assert.deepEqual(
        selectOcrOperationSeparator(
            [equalHeightSeparator],
            { x0: 4, y0: 4, x1: 108, y1: 27 },
            equalHeightColumns,
            1,
            equalHeightYMin,
            equalHeightYMax
        ),
        equalHeightSeparator
    );

    const superscriptColumns = new Array<number>(140).fill(0);
    const superscriptYMin = new Array<number>(140).fill(10);
    const superscriptYMax = new Array<number>(140).fill(40);
    for (let x = 4; x <= 70; x++) {
        superscriptColumns[x] = 5;
        superscriptYMin[x] = 0;
        superscriptYMax[x] = 49;
    }
    for (let x = 82; x <= 84; x++) {
        superscriptColumns[x] = 28;
        superscriptYMin[x] = 15;
        superscriptYMax[x] = 42;
    }
    for (let x = 98; x <= 128; x++) superscriptColumns[x] = 5;
    const superscriptSeparator = {
        x0: 82, y0: 15, x1: 84, y1: 42, hasTopHook: false
    };
    assert.deepEqual(
        selectOcrOperationSeparator(
            [superscriptSeparator],
            { x0: 4, y0: 0, x1: 128, y1: 49 },
            superscriptColumns,
            1,
            superscriptYMin,
            superscriptYMax
        ),
        superscriptSeparator,
        'a digit-high hookless bar must survive an exponent-expanded line box'
    );

    const erasedColumns = columns.slice();
    for (let x = 72; x <= 74; x++) erasedColumns[x] = 0;
    assert.equal(
        selectOcrOperationSeparator(
            [separator],
            { x0: 4, y0: 0, x1: 108, y1: 31 },
            erasedColumns,
            1,
            yMin,
            yMax
        ),
        null
    );
});

function rasterProjection(
    width: number,
    height: number,
    rectangles: Array<[number, number, number, number]>
): {
    mask: Uint8Array;
    columns: Uint32Array;
    yMin: Int32Array;
    yMax: Int32Array;
} {
    const mask = new Uint8Array(width * height);
    for (const [x0, y0, x1, y1] of rectangles) {
        for (let y = y0; y <= y1; y++) {
            for (let x = x0; x <= x1; x++) mask[y * width + x] = 1;
        }
    }
    const columns = new Uint32Array(width);
    const yMin = new Int32Array(width);
    const yMax = new Int32Array(width);
    yMin.fill(height);
    yMax.fill(-1);
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            if (!mask[y * width + x]) continue;
            columns[x]++;
            yMin[x] = Math.min(yMin[x], y);
            yMax[x] = Math.max(yMax[x], y);
        }
    }
    return { mask, columns, yMin, yMax };
}

test('keeps every confirmed literal bar but no hooked or unknown stem', () => {
    const columns = new Array<number>(150).fill(0);
    for (let x = 2; x <= 4; x++) columns[x] = 34;
    for (let x = 54; x <= 56; x++) columns[x] = 31;
    for (let x = 104; x <= 106; x++) columns[x] = 33;
    const opening = { x0: 2, y0: 3, x1: 4, y1: 36, hasTopHook: false };
    const closing = { x0: 104, y0: 2, x1: 106, y1: 36, hasTopHook: false };
    assert.deepEqual(
        selectOcrStructuralBars(
            [
                opening,
                { x0: 54, y0: 5, x1: 56, y1: 35, hasTopHook: true },
                { x0: 78, y0: 4, x1: 80, y1: 35 },
                closing
            ],
            { x0: 2, y0: 1, x1: 106, y1: 38 },
            columns
        ),
        [opening, closing]
    );
});

test('rejects the real-formula slash geometry as a structural bar', () => {
    const columns = new Array<number>(90).fill(0);
    for (let x = 36; x <= 53; x++) columns[x] = 3;
    const slash = {
        x0: 36,
        y0: 1,
        x1: 53,
        y1: 43,
        hasTopHook: false,
        slantRatio: 0.64 * 0.62
    };
    assert.deepEqual(
        selectOcrStructuralBars(
            [slash],
            { x0: 4, y0: 0, x1: 84, y1: 44 },
            columns
        ),
        []
    );
});

test('retains vertical and moderately slanted confirmed structural bars', () => {
    const columns = new Array<number>(120).fill(0);
    for (let x = 12; x <= 14; x++) columns[x] = 43;
    for (let x = 64; x <= 76; x++) columns[x] = 4;
    const vertical = {
        x0: 12,
        y0: 1,
        x1: 14,
        y1: 43,
        hasTopHook: false,
        slantRatio: 0
    };
    const slanted = {
        x0: 64,
        y0: 1,
        x1: 76,
        y1: 43,
        hasTopHook: false,
        slantRatio: 16 / 60
    };
    assert.deepEqual(
        selectOcrStructuralBars(
            [vertical, slanted],
            { x0: 4, y0: 0, x1: 110, y1: 44 },
            columns
        ),
        [vertical, slanted]
    );
});

test('keeps only complete nested vector-delimiter sequences on one line', () => {
    const columns = new Array<number>(130).fill(0);
    const hints = [
        {
            x0: 4, y0: 2, x1: 14, y1: 38,
            kind: 'square-open' as const, pathIndexes: [0]
        },
        {
            x0: 22, y0: 3, x1: 30, y1: 37,
            kind: 'round-open' as const, pathIndexes: [1]
        },
        {
            x0: 72, y0: 3, x1: 80, y1: 37,
            kind: 'round-close' as const, pathIndexes: [2]
        },
        {
            x0: 100, y0: 2, x1: 110, y1: 38,
            kind: 'square-close' as const, pathIndexes: [3]
        }
    ];
    for (const hint of hints) {
        for (let x = hint.x0; x <= hint.x1; x++) columns[x] = 4;
    }
    for (let x = 44; x <= 58; x++) columns[x] = 5;
    const lineBox = { x0: 4, y0: 1, x1: 110, y1: 39 };
    assert.deepEqual(
        selectOcrStructuralDelimiters(hints, lineBox, columns),
        hints
    );
    const intactRaster = rasterProjection(130, 42, [
        [4, 2, 14, 38],
        [22, 3, 30, 37],
        [44, 15, 58, 25],
        [72, 3, 80, 37],
        [100, 2, 110, 38]
    ]);
    assert.deepEqual(
        selectOcrStructuralDelimiters(
            hints,
            lineBox,
            intactRaster.columns,
            1,
            intactRaster.mask,
            130
        ),
        hints,
        'intact rendered vector delimiters remain structural'
    );
    const erasedRaster = rasterProjection(130, 42, [
        [4, 2, 14, 7],
        [4, 33, 14, 38],
        [22, 3, 30, 8],
        [22, 32, 30, 37],
        [44, 15, 58, 25],
        [72, 3, 80, 8],
        [72, 32, 80, 37],
        [100, 2, 110, 7],
        [100, 33, 110, 38]
    ]);
    assert.deepEqual(
        selectOcrStructuralDelimiters(
            hints,
            lineBox,
            erasedRaster.columns,
            1,
            erasedRaster.mask,
            130
        ),
        [],
        'erased delimiter stems must not be restored from stale vector paths'
    );
    assert.deepEqual(
        selectOcrStructuralDelimiters(hints.slice(0, -1), lineBox, columns),
        [],
        'an unmatched outer opening bracket must not be invented structurally'
    );
    assert.deepEqual(
        selectOcrStructuralDelimiters(hints.slice(1), lineBox, columns),
        [],
        'an unmatched outer closing bracket must not be invented structurally'
    );

    const emptyColumns = new Uint32Array(120);
    for (const hint of hints) {
        for (let x = Math.floor(hint.x0); x <= Math.ceil(hint.x1); x++) {
            emptyColumns[x] = 20;
        }
    }
    assert.deepEqual(
        selectOcrStructuralDelimiters(
            [hints[1], hints[2]],
            lineBox,
            emptyColumns
        ),
        [],
        'two delimiter-like strokes without enclosed ink stay with whole-line OCR'
    );
});

test('finds an isolated raster operation bar without vector hints', () => {
    const raster = rasterProjection(120, 34, [
        [4, 9, 58, 24],
        [72, 1, 73, 32],
        [88, 10, 108, 23]
    ]);
    assert.deepEqual(
        selectOcrRasterOperationSeparator(
            raster.mask,
            120,
            { x0: 4, y0: 1, x1: 108, y1: 32 },
            raster.columns,
            1,
            raster.yMin,
            raster.yMax
        ),
        { x0: 72, y0: 1, x1: 73, y1: 32 }
    );
});

test('raster fallback rejects a digit one and paired absolute-value bars', () => {
    const digitOne = rasterProjection(120, 34, [
        [4, 8, 58, 25],
        [72, 8, 73, 25],
        [88, 9, 108, 24]
    ]);
    assert.equal(
        selectOcrRasterOperationSeparator(
            digitOne.mask,
            120,
            { x0: 4, y0: 8, x1: 108, y1: 25 },
            digitOne.columns,
            1,
            digitOne.yMin,
            digitOne.yMax
        ),
        null
    );

    const numberThenOperationBar = rasterProjection(140, 36, [
        [4, 9, 46, 25],
        [55, 7, 56, 27],
        [59, 10, 67, 25],
        [82, 1, 83, 34],
        [101, 10, 126, 25]
    ]);
    assert.deepEqual(
        selectOcrRasterOperationSeparator(
            numberThenOperationBar.mask,
            140,
            { x0: 4, y0: 1, x1: 126, y1: 34 },
            numberThenOperationBar.columns,
            1,
            numberThenOperationBar.yMin,
            numberThenOperationBar.yMax
        ),
        { x0: 82, y0: 1, x1: 83, y1: 34 },
        'the digit 1 in `12` must not suppress the later operation bar'
    );

    const absoluteBars = rasterProjection(120, 34, [
        [4, 9, 38, 24],
        [48, 1, 49, 32],
        [58, 10, 64, 23],
        [72, 1, 73, 32],
        [88, 9, 108, 24]
    ]);
    assert.equal(
        selectOcrRasterOperationSeparator(
            absoluteBars.mask,
            120,
            { x0: 4, y0: 1, x1: 108, y1: 32 },
            absoluteBars.columns,
            1,
            absoluteBars.yMin,
            absoluteBars.yMax
        ),
        null
    );
});

test('runs one OCR job at a time and promotes queued foreground work', async () => {
    const order: string[] = [];
    let releaseFirst!: () => void;
    const firstGate = new Promise<void>(resolve => { releaseFirst = resolve; });

    const first = enqueueOcrJob('background', async () => {
        order.push('background-1');
        await firstGate;
    });
    const second = enqueueOcrJob('background', async () => {
        order.push('background-2');
    });
    const foreground = enqueueOcrJob('foreground', async () => {
        order.push('foreground');
    });
    const promoted = enqueueOcrJob('background', async () => {
        order.push('promoted');
    });
    promoteOcrJob(promoted);

    await Promise.resolve();
    assert.deepEqual(order, ['background-1']);
    releaseFirst();
    await Promise.all([first, second, foreground, promoted]);
    assert.deepEqual(order, ['background-1', 'foreground', 'promoted', 'background-2']);
});
