/** Authored vector fixtures, never recorded handwriting. Development and holdout
 * are task groups, not claims about general handwriting accuracy. */
import { SYNTHETIC_EQUATION_GLYPHS, SYNTHETIC_LONG_EQUATION } from './ocr-equation-chunks.mts';
export type PipelinePoint = Readonly<{ x: number; y: number }>;
export type PipelineStroke = readonly PipelinePoint[];
export type OcrPipelineCase = Readonly<{
  id: string; baseTaskId: string; split: 'development' | 'holdout'; family: string;
  synthetic: true; prompt: string; expectedLines: readonly string[];
  expectedGradeAccepted: boolean; measurementGap?: string; intentionalError?: string;
  width: number; height: number; lineWidth: number; strokes: readonly PipelineStroke[];
}>;
type Glyph = readonly (readonly (readonly [number, number])[])[];
type Stroke = Array<{ x: number; y: number }>;
type MathPart = string | { power: [string, string] } | { fraction: [string, string] }
  | { root: string } | { subscript: [string, string] };
const GLYPHS: Record<string, Glyph> = {
  ...SYNTHETIC_EQUATION_GLYPHS,
  '0': [[[.5,0],[.85,.12],[.95,.5],[.85,.9],[.5,1],[.15,.9],[.05,.5],[.15,.12],[.5,0]]],
  '6': [[[.84,.04],[.48,0],[.17,.28],[.1,.67],[.24,.94],[.53,1],[.84,.82],[.8,.57],[.57,.44],[.27,.5],[.11,.68]]],
  '7': [[[.05,.02],[.96,.02],[.44,1]]],
  '8': [[[.5,.5],[.19,.35],[.22,.09],[.5,0],[.79,.1],[.81,.35],[.5,.5],[.19,.68],[.22,.92],[.5,1],[.81,.9],[.8,.65],[.5,.5]]],
  '9': [[[.16,.96],[.52,1],[.83,.72],[.9,.33],[.76,.06],[.47,0],[.16,.18],[.2,.43],[.43,.56],[.73,.5],[.89,.32]]],
  '-': [[[.05,.52],[.95,.52]]], ':': [[[.5,.25]],[[.5,.75]]],
  ',': [[[.65,.88],[.6,.99],[.2,1.12]]], '.': [[[.5,.95]]],
  '(': [[[.85,0],[.4,.22],[.2,.5],[.4,.8],[.85,1]]],
  ')': [[[.15,0],[.6,.22],[.8,.5],[.6,.8],[.15,1]]],
  '\u00b1': [[[.05,.35],[.95,.35]],[[.5,.05],[.5,.65]],[[.05,.88],[.95,.88]]],
  y: [[[.05,.05],[.5,.55],[.95,.05]],[[.95,.05],[.4,1.1]]],
  I: [[[.15,0],[.85,0]],[[.5,0],[.5,1]],[[.15,1],[.85,1]]],
  P: [[[.1,1],[.1,0],[.65,0],[.9,.18],[.7,.43],[.1,.43]]],
  r: [[[.15,1],[.15,.3],[.15,.55],[.5,.3],[.85,.3]]],
  o: [[[.5,.3],[.15,.45],[.12,.8],[.5,1],[.85,.8],[.88,.45],[.5,.3]]],
  b: [[[.12,0],[.12,1],[.12,.55],[.5,.3],[.85,.5],[.85,.8],[.5,1],[.12,.8]]],
  e: [[[.15,.65],[.88,.65],[.8,.4],[.5,.3],[.15,.45],[.12,.8],[.5,1],[.88,.85]]],
};
function text(strokes: Stroke[], value: string, x: number, y: number, height: number): number {
  for (const char of value) {
    if (char === ' ') { x += height * .3; continue; }
    const glyph = GLYPHS[char];
    if (!glyph) throw new Error('Missing authored pipeline glyph: ' + char);
    const width = height * (',.\u00b7:|'.includes(char) ? .24 : .62);
    for (const line of glyph) strokes.push(line.map(([px, py]) => ({ x: x + px * width, y: y + py * height })));
    x += width + height * .16;
  }
  return x;
}
function row(strokes: Stroke[], parts: readonly MathPart[], y: number, height = 36): void {
  let x = 0;
  for (const part of parts) {
    if (typeof part === 'string') { x = text(strokes, part, x, y, height); continue; }
    if ('power' in part) {
      x = text(strokes, part.power[0], x, y, height);
      x = text(strokes, part.power[1], x - height * .08, y - height * .34, height * .55);
    } else if ('subscript' in part) {
      x = text(strokes, part.subscript[0], x, y, height);
      x = text(strokes, part.subscript[1], x - height * .08, y + height * .76, height * .42);
    } else if ('fraction' in part) {
      const small = height * .72;
      const width = Math.max(...part.fraction.map(value => value.length * small * .78)) + height * .2;
      text(strokes, part.fraction[0], x + height * .1, y - height * .4, small);
      text(strokes, part.fraction[1], x + height * .1, y + height * .63, small);
      strokes.push([{ x, y: y + height * .47 }, { x: x + width, y: y + height * .47 }]);
      x += width + height * .22;
    } else {
      const width = part.root.length * height * .62 + height * .2;
      strokes.push([{ x, y: y + height * .5 }, { x: x + height * .15, y: y + height * .35 },
        { x: x + height * .32, y: y + height * .9 }, { x: x + height * .6, y: y - height * .1 },
        { x: x + height * .6 + width, y: y - height * .1 }]);
      text(strokes, part.root, x + height * .65, y + height * .05, height * .82);
      x += height * .8 + width;
    }
  }
}
function make(meta: Omit<OcrPipelineCase, 'synthetic' | 'width' | 'height' | 'lineWidth' | 'strokes'>,
  rows: readonly (readonly MathPart[])[], custom?: Stroke[]): OcrPipelineCase {
  const strokes = custom || [];
  if (!custom) rows.forEach((parts, index) => row(strokes, parts, index * 82));
  const points = strokes.flat();
  const minX = Math.min(...points.map(point => point.x)), minY = Math.min(...points.map(point => point.y));
  const maxX = Math.max(...points.map(point => point.x)), maxY = Math.max(...points.map(point => point.y));
  return { ...meta, synthetic: true, lineWidth: 3,
    width: Math.ceil(maxX - minX + 36), height: Math.ceil(maxY - minY + 36),
    strokes: strokes.map(stroke => stroke.map(point => ({
      x: Math.round((point.x - minX + 18) * 1000) / 1000,
      y: Math.round((point.y - minY + 18) * 1000) / 1000,
    }))),
  };
}
const linear = ['3x-5=7 \\mid +5', '3x=12 \\mid :3', 'x=4'];
const longStrokes: Stroke[] = SYNTHETIC_LONG_EQUATION.strokes.map(stroke => stroke.map(point => ({ ...point })));
row(longStrokes, ['3x=0'], 100, 32); row(longStrokes, ['x=0'], 175, 32);
export const OCR_PIPELINE_CORPUS: readonly OcrPipelineCase[] = [
  make({ id: 'linear-valid', baseTaskId: 'linear-3x-minus5-equals7', split: 'development', family: 'linear-path',
    prompt: '3x-5=7', expectedLines: linear, expectedGradeAccepted: true }, [['3x-5=7 | +5'], ['3x=12 | :3'], ['x=4']]),
  make({ id: 'linear-wrong-step', baseTaskId: 'linear-3x-minus5-equals7', split: 'development', family: 'negative-linear-path',
    prompt: '3x-5=7', expectedLines: [linear[0], '3x=15 \\mid :3', 'x=4'], expectedGradeAccepted: false,
    intentionalError: 'The authored wrong 15 and final 4 must be transcribed unchanged. Correcting either number is an OCR error.' },
    [['3x-5=7 | +5'], ['3x=15 | :3'], ['x=4']]),
  make({ id: 'multiplication-tap', baseTaskId: 'x-23-times4', split: 'development', family: 'multiplication-dot',
    prompt: String.raw`x=23\cdot4`, expectedLines: [String.raw`x=23\cdot4`, 'x=92'], expectedGradeAccepted: true }, [['x=23\u00b74'], ['x=92']]),
  make({ id: 'decimal-comma', baseTaskId: 'x-onepoint5-times2', split: 'development', family: 'decimal-comma',
    prompt: String.raw`x=1,5\cdot2`, expectedLines: [String.raw`x=1,5\cdot2`, 'x=3'], expectedGradeAccepted: true }, [['x=1,5\u00b72'], ['x=3']]),
  make({ id: 'stacked-fraction', baseTaskId: 'x-half-equals3', split: 'development', family: 'fraction-equation',
    prompt: String.raw`\frac{x}{2}=3`, expectedLines: [String.raw`\frac{x}{2}=3`, 'x=6'], expectedGradeAccepted: true },
    [[{ fraction: ['x', '2'] }, '=3'], ['x=6']]),
  make({ id: 'square-root-indices', baseTaskId: 'x-square-equals9', split: 'development', family: 'root-and-indices',
    prompt: 'x^2=9', expectedLines: ['x^{2}=9', String.raw`x_{1,2}=\pm\sqrt{9}`], expectedGradeAccepted: true,
    measurementGap: 'Joint OCR of superscript, subscript, plus-minus and root is measured without assuming it succeeds.' },
    [[{ power: ['x', '2'] }, '=9'], [{ subscript: ['x', '1,2'] }, '=\u00b1', { root: '9' }]]),
  make({ id: 'linear-system', baseTaskId: 'system-sum5-difference1', split: 'development', family: 'linear-system',
    prompt: String.raw`\begin{cases}x+y=5\\x-y=1\end{cases}`,
    expectedLines: ['I. x+y=5', 'II. x-y=1', '2x=6', 'x=3', 'y=2'], expectedGradeAccepted: true,
    measurementGap: 'Roman labels and separate system rows are an OCR coverage probe, not prevalidated handwriting recognition.' },
    [['I. x+y=5'], ['II. x-y=1'], ['2x=6'], ['x=3'], ['y=2']]),
  make({ id: 'long-equation', baseTaskId: 'long-3x-plus30-equals30', split: 'development', family: 'long-equation',
    prompt: SYNTHETIC_LONG_EQUATION.expectedLatex,
    expectedLines: [SYNTHETIC_LONG_EQUATION.expectedLatex, '3x=0', 'x=0'], expectedGradeAccepted: true }, [], longStrokes),
  make({ id: 'holdout-linear', baseTaskId: 'linear-5x-plus6-equals21', split: 'holdout', family: 'linear-path',
    prompt: '5x+6=21', expectedLines: ['5x+6=21 \\mid -6', '5x=15 \\mid :5', 'x=3'], expectedGradeAccepted: true },
    [['5x+6=21 | -6'], ['5x=15 | :5'], ['x=3']]),
  make({ id: 'holdout-completion', baseTaskId: 'x-square-minus6x-equals7', split: 'holdout', family: 'completion-and-indices',
    prompt: 'x^2-6x=7', expectedLines: ['x^{2}-6x=7', 'x^{2}-6x+9=16', '(x-3)^{2}=16', String.raw`x_{1,2}=3\pm4`],
    expectedGradeAccepted: true, measurementGap: 'Completion with indexed branches measures composition of multiple OCR structures.' },
    [[{ power: ['x', '2'] }, '-6x=7'], [{ power: ['x', '2'] }, '-6x+9=16'], [{ power: ['(x-3)', '2'] }, '=16'], [{ subscript: ['x', '1,2'] }, '=3\u00b14']]),
  make({ id: 'holdout-verification', baseTaskId: 'linear-2x-plus1-equals7', split: 'holdout', family: 'verification-label',
    prompt: '2x+1=7', expectedLines: ['2x+1=7', '2x=6', 'x=3', String.raw`\text{Probe: }2\cdot3+1=7`, '7=7'],
    expectedGradeAccepted: true, measurementGap: 'The authored word Probe and its separate numeric check are an OCR coverage probe.' },
    [['2x+1=7'], ['2x=6'], ['x=3'], ['Probe: 2\u00b73+1=7'], ['7=7']]),
];
export const OCR_PIPELINE_CORPUS_DESCRIPTION = {
  id: 'berechneocr-authored-pipeline-v1', synthetic: true,
  source: 'Authored normalized glyphs and layouts. No pupil records, screenshots, telemetry or captured handwriting.',
  splitPolicy: 'All variants of one baseTaskId share a fixed split. Holdout means excluded from development tuning; reporting a holdout result consumes that evaluation.',
  limitation: 'This small synthetic development/holdout sample measures specific pipeline behavior, not general handwriting accuracy. Deliberately wrong calculations have deliberately wrong transcription targets.',
} as const;
