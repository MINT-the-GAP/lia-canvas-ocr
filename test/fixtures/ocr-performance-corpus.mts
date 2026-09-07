/**
 * Deterministic synthetic development inputs for comparing OCR runtime variants.
 * The normalized digit/operator paths originate in real-formula-block.test.mts;
 * punctuation and two-dimensional layouts below are authored test geometry.
 * No recorded handwriting, learner data, screenshots or telemetry are used.
 * Exact matches on this tiny synthetic corpus are not general handwriting accuracy.
 */
export type OcrPerformancePoint = Readonly<{ x: number; y: number }>;
export type OcrPerformanceStroke = readonly OcrPerformancePoint[];
export type OcrPerformanceSample = Readonly<{
    id: string;
    family: string;
    synthetic: true;
    width: number;
    height: number;
    lineWidth: number;
    expectedLatex: string;
    strokes: readonly OcrPerformanceStroke[];
}>;

export const OCR_PERFORMANCE_CORPUS_DESCRIPTION = {
    id: 'berechneocr-synthetic-development-v1',
    synthetic: true,
    source: 'Authored glyph paths from test/browser/real-formula-block.test.mts and authored layouts.',
    limitation: 'Exact matches measure this synthetic development sample only, not general handwriting accuracy or solution-method validation.',
} as const;

type Point = readonly [number, number];
type Glyph = readonly (readonly Point[])[];
type MutableStroke = Array<{ x: number; y: number }>;

const GLYPHS: Record<string, Glyph> = {
  '0': [[[0.50, 0.00], [0.82, 0.12], [0.95, 0.50], [0.82, 0.90], [0.50, 1.00], [0.18, 0.90], [0.05, 0.50], [0.18, 0.12], [0.50, 0.00]]],
  '1': [[[0.20, 0.20], [0.55, 0.00], [0.55, 1.00]]],
  '2': [[[0.10, 0.20], [0.30, 0.00], [0.75, 0.00], [0.95, 0.22], [0.78, 0.48], [0.10, 1.00], [0.95, 1.00]]],
  '3': [[[0.08, 0.06], [0.62, 0.00], [0.92, 0.20], [0.72, 0.42], [0.40, 0.50], [0.73, 0.55], [0.98, 0.78], [0.72, 0.98], [0.08, 0.94]]],
  '4': [
    [[0.72, 0.00], [0.72, 1.00]],
    [[0.72, 0.00], [0.08, 0.66], [1.00, 0.66]],
  ],
  '5': [[[0.95, 0.02], [0.15, 0.02], [0.10, 0.45], [0.63, 0.41], [0.94, 0.58], [0.84, 0.88], [0.10, 0.98]]],
  '6': [[[0.84, 0.04], [0.48, 0.00], [0.17, 0.28], [0.10, 0.67], [0.24, 0.94], [0.53, 1.00], [0.84, 0.82], [0.80, 0.57], [0.57, 0.44], [0.27, 0.50], [0.11, 0.68]]],
  '7': [[[0.05, 0.02], [0.96, 0.02], [0.44, 1.00]]],
  '8': [[[0.50, 0.50], [0.19, 0.35], [0.22, 0.09], [0.50, 0.00], [0.79, 0.10], [0.81, 0.35], [0.50, 0.50], [0.19, 0.68], [0.22, 0.92], [0.50, 1.00], [0.81, 0.90], [0.80, 0.65], [0.50, 0.50]]],
  '9': [[[0.16, 0.96], [0.52, 1.00], [0.83, 0.72], [0.90, 0.33], [0.76, 0.06], [0.47, 0.00], [0.16, 0.18], [0.20, 0.43], [0.43, 0.56], [0.73, 0.50], [0.89, 0.32]]],
  'x': [
    [[0.10, 0.10], [0.90, 0.90]],
    [[0.90, 0.10], [0.10, 0.90]],
  ],
  '-': [[[0.05, 0.52], [0.95, 0.52]]],
  '=': [
    [[0.05, 0.38], [0.95, 0.38]],
    [[0.05, 0.66], [0.95, 0.66]],
  ],
  '+': [
    [[0.05, 0.52], [0.95, 0.52]],
    [[0.50, 0.08], [0.50, 0.94]],
  ],
  ':': [[[0.50, 0.26]], [[0.50, 0.74]]],
  '\u00b7': [[[0.50, 0.52]]],
  ',': [[[0.65, 0.88], [0.60, 0.99], [0.20, 1.11]]],
  '/': [[[0.82, 0.00], [0.18, 1.00]]],
  '|': [[[0.50, -0.10], [0.50, 1.10]]],
};

function appendText(strokes: MutableStroke[], text: string, x: number, y: number, height = 48): number {
    let cursor = x;
    for (const character of text) {
        if (character === ' ') { cursor += height * 0.30; continue; }
        const glyph = GLYPHS[character];
        if (!glyph) throw new Error(`Missing synthetic benchmark glyph: ${character}`);
        const width = height * (character === ',' ? 0.20 :
            character === '\u00b7' || character === ':' || character === '|' ? 0.24 : 0.62);
        for (const stroke of glyph) {
            strokes.push(stroke.map(([px, py]) => ({ x: cursor + px * width, y: y + py * height })));
        }
        cursor += width + height * 0.16;
    }
    return cursor;
}

function sample(id: string, family: string, expectedLatex: string, strokes: MutableStroke[], lineWidth = 3): OcrPerformanceSample {
    const points = strokes.flat();
    const minX = Math.min(...points.map(point => point.x));
    const minY = Math.min(...points.map(point => point.y));
    const maxX = Math.max(...points.map(point => point.x));
    const maxY = Math.max(...points.map(point => point.y));
    const padding = 16 + lineWidth / 2;
    const round = (value: number) => Math.round(value * 1_000) / 1_000;
    return {
        id, family, synthetic: true,
        width: Math.ceil(maxX - minX + padding * 2),
        height: Math.ceil(maxY - minY + padding * 2),
        lineWidth, expectedLatex,
        strokes: strokes.map(stroke => stroke.map(point => ({
            x: round(point.x - minX + padding),
            y: round(point.y - minY + padding),
        }))),
    };
}

function textSample(id: string, family: string, text: string, expectedLatex = text, height = 48, lineWidth = 3): OcrPerformanceSample {
    const strokes: MutableStroke[] = [];
    appendText(strokes, text, 0, 0, height);
    return sample(id, family, expectedLatex, strokes, lineWidth);
}

function fractionSample(): OcrPerformanceSample {
    const strokes: MutableStroke[] = [];
    const fraction = (numerator: string, denominator: string, x: number) => {
        appendText(strokes, numerator, x + 10, 0, 36);
        strokes.push([{ x: x + 2, y: 45 }, { x: x + 42, y: 45 }]);
        appendText(strokes, denominator, x + 10, 54, 36);
    };
    fraction('1', '2', 0);
    appendText(strokes, '+', 58, 20, 48);
    fraction('1', '4', 106);
    appendText(strokes, '=', 164, 20, 48);
    fraction('3', '4', 212);
    return sample('stacked-fractions', 'fraction', String.raw`\frac{1}{2}+\frac{1}{4}=\frac{3}{4}`, strokes, 2.8);
}

function rootSample(): OcrPerformanceSample {
    const strokes: MutableStroke[] = [[
        { x: 0, y: 32 }, { x: 7, y: 25 }, { x: 15, y: 45 },
        { x: 27, y: 0 }, { x: 61, y: 0 },
    ]];
    appendText(strokes, '9', 31, 8, 35);
    appendText(strokes, '=3', 75, 8, 35);
    return sample('square-root', 'root', String.raw`\sqrt{9}=3`, strokes, 2.5);
}

function powerSample(): OcrPerformanceSample {
    const strokes: MutableStroke[] = [];
    appendText(strokes, 'x', 0, 24, 48);
    appendText(strokes, '2', 34, 0, 28);
    appendText(strokes, '+2x+1=9', 67, 24, 48);
    return sample('quadratic-power', 'exponent', 'x^{2}+2x+1=9', strokes);
}

/** Strokes are absolute image coordinates; render black, round-capped ink on white. */
export const OCR_PERFORMANCE_CORPUS: readonly OcrPerformanceSample[] = [
    textSample('linear-start', 'linear-equation', '3x-5=7 | +5', String.raw`3x-5=7\mid+5`),
    textSample('linear-divide', 'linear-equation', '3x=12 | :3', String.raw`3x=12\mid:3`),
    textSample('linear-result', 'linear-equation', 'x=4', 'x=4', 60, 3.5),
    textSample('addition-operands', 'arithmetic-addition', '367+458', '367+458', 44),
    textSample('addition-result', 'arithmetic-digits', '825', '825', 56, 3.5),
    textSample('subtraction', 'arithmetic-subtraction', '825-458=367', '825-458=367', 44),
    textSample('multiplication-tap', 'arithmetic-multiplication', '23\u00b74=92', String.raw`23\cdot4=92`),
    textSample('division-taps', 'arithmetic-division', '144:12=12'),
    textSample('decimal-comma', 'decimal', '1,5\u00b72=3', String.raw`1,5\cdot2=3`),
    fractionSample(),
    rootSample(),
    powerSample(),
];
