/** Independent authored letter-case probes. No recorded handwriting or images.
 * Clear styles test available visual cues; ambiguous twins deliberately cannot
 * both be recovered from their identical pixels without an external convention. */
import { SYNTHETIC_EQUATION_GLYPHS } from './ocr-equation-chunks.mts';
import type { OcrPipelineCase, PipelineStroke } from './ocr-pipeline-corpus.mts';

type Letter = 'x' | 'X' | 'y' | 'Y';
type Glyph = readonly (readonly (readonly [number, number])[])[];
type Style = 'curved-case-distinct' | 'unresolved-cross';
type LetterOccurrence = Readonly<{
  letter: Letter; lineIndex: number; strokeFrom: number; strokeCount: number;
  baseline: number; capTop: number;
}>;
export type OcrLetterCaseCase = OcrPipelineCase & Readonly<{
  distinction: 'explicit' | 'ambiguous'; glyphStyle: Style;
  letterOccurrences: readonly LetterOccurrence[];
  mathematicalWitness: Readonly<{
    values: Readonly<Partial<Record<Letter, string>>>;
    promptEquations: readonly string[];
    falseRowIndices: readonly number[];
  }>;
  ambiguity?: Readonly<{
    groupId: string; alternativeLines: readonly string[];
    policy: 'no-silent-case-substitution'; explanation: string;
  }>;
}>;

/** Coordinates use one shared cap top (0) and baseline (1), not per-letter
 * normalization: lower x is shorter, lower y extends below the baseline. */
export const OCR_LETTER_CASE_GLYPHS: Readonly<Record<Letter, Glyph>> = {
  x: [
    [[.08,.31],[.23,.27],[.38,.39],[.50,.63],[.63,.88],[.78,1],[.94,.95]],
    [[.92,.31],[.77,.27],[.62,.39],[.50,.63],[.37,.88],[.22,1],[.06,.95]],
  ],
  X: [[[.06,0],[.94,1]],[[.94,0],[.06,1]]],
  y: [
    [[.08,.30],[.16,.62],[.28,.91],[.45,1],[.61,.91],[.77,.61],[.88,.30]],
    [[.88,.30],[.74,.85],[.56,1.24],[.39,1.36],[.16,1.32],[.08,1.23]],
  ],
  Y: [[[.06,0],[.50,.49],[.94,0]],[[.50,.49],[.50,1]]],
};
const GLYPHS: Readonly<Record<string, Glyph>> = {
  ...SYNTHETIC_EQUATION_GLYPHS, ...OCR_LETTER_CASE_GLYPHS,
  '6': [[[.84,.04],[.48,0],[.17,.28],[.1,.67],[.24,.94],[.53,1],[.84,.82],[.8,.57],[.57,.44],[.27,.5],[.11,.68]]],
  '-': [[[.05,.52],[.95,.52]]],
};
const HEIGHT = 36;
type Meta = Omit<OcrLetterCaseCase, 'synthetic' | 'width' | 'height' | 'lineWidth' | 'strokes' | 'letterOccurrences'>;
function make(meta: Meta): OcrLetterCaseCase {
  const strokes: Array<Array<{ x: number; y: number }>> = [];
  const occurrences: LetterOccurrence[] = [];
  meta.expectedLines.forEach((line, lineIndex) => {
    let x = 0;
    const capTop = lineIndex * 82;
    // This fixture uses only plain rows plus the authored multiplication point.
    const visible = line.replace(/\\cdot\s*/gu, '·');
    for (const char of visible) {
      if (char === ' ') { x += HEIGHT * .22; continue; }
      const isLetter = char === 'x' || char === 'X' || char === 'y' || char === 'Y';
      const ambiguous = meta.glyphStyle === 'unresolved-cross' && (char === 'x' || char === 'X');
      const glyph = ambiguous ? SYNTHETIC_EQUATION_GLYPHS.x : GLYPHS[char];
      if (!glyph) throw new Error('Missing letter-case corpus glyph: ' + char);
      const width = HEIGHT * (char === '·' ? .24 : !ambiguous && (char === 'X' || char === 'Y') ? .70 : .62);
      const strokeFrom = strokes.length;
      for (const path of glyph) strokes.push(path.map(([px, py]) => ({ x: x + px * width, y: capTop + py * HEIGHT })));
      if (isLetter) occurrences.push({ letter: char, lineIndex, strokeFrom, strokeCount: glyph.length, capTop, baseline: capTop + HEIGHT });
      x += width + HEIGHT * .16;
    }
  });
  const points = strokes.flat();
  const minX = Math.min(...points.map(point => point.x)), minY = Math.min(...points.map(point => point.y));
  const maxX = Math.max(...points.map(point => point.x)), maxY = Math.max(...points.map(point => point.y));
  const rounded = (value: number) => Math.round(value * 1000) / 1000;
  const shifted: PipelineStroke[] = strokes.map(path => path.map(point => ({ x: rounded(point.x - minX + 18), y: rounded(point.y - minY + 18) })));
  return { ...meta, synthetic: true, lineWidth: 3, width: Math.ceil(maxX - minX + 36), height: Math.ceil(maxY - minY + 36),
    strokes: shifted, letterOccurrences: occurrences.map(item => ({ ...item,
      capTop: rounded(item.capTop - minY + 18), baseline: rounded(item.baseline - minY + 18),
    })) };
}
const explicit = { distinction: 'explicit', glyphStyle: 'curved-case-distinct' } as const;
const xRows = [String.raw`2\cdot x+1=5`, String.raw`2\cdot x=4`, 'x=2'];
const XRows = [String.raw`2\cdot X+1=5`, String.raw`2\cdot X=4`, 'X=2'];
const xSystem = ['x+X=5', 'x-X=1', '2x=6', 'x=3', 'X=2'];
const ySystem = ['y+Y=4', 'y-Y=2', '2y=6', 'y=3', 'Y=1'];
const grouped = (equations: readonly string[]) => String.raw`\begin{cases}` + equations.join(String.raw`\\`) + String.raw`\end{cases}`;
const witness = (values: Partial<Record<Letter, string>>, promptEquations: readonly string[], falseRowIndices: readonly number[] = []) => ({ values, promptEquations, falseRowIndices });
const ambiguity = (alternativeLines: readonly string[]) => ({
  groupId: 'same-cross-pixels-opposite-case', alternativeLines,
  policy: 'no-silent-case-substitution' as const,
  explanation: 'The lowercase-intent and uppercase-intent twins have identical strokes and the same task prompt. Their exact authored targets differ. Pixels alone do not identify the intended case; report ambiguity and never equate x with X or repair the written answer using the task solution.',
});

export const OCR_LETTER_CASE_CORPUS: readonly OcrLetterCaseCase[] = [
  make({ ...explicit, id: 'case-lower-x', baseTaskId: 'case-2v-plus1-equals5', split: 'development', family: 'letter-case-x',
    prompt: xRows[0], expectedLines: xRows, expectedGradeAccepted: true, mathematicalWitness: witness({ x: '2' }, [xRows[0]]) }),
  make({ ...explicit, id: 'case-upper-X', baseTaskId: 'case-2v-plus1-equals5', split: 'development', family: 'letter-case-x',
    prompt: XRows[0], expectedLines: XRows, expectedGradeAccepted: true, mathematicalWitness: witness({ X: '2' }, [XRows[0]]) }),
  make({ ...explicit, id: 'case-lower-y', baseTaskId: 'case-3v-minus1-equals5', split: 'holdout', family: 'letter-case-y',
    prompt: '3y-1=5', expectedLines: ['3y-1=5', '3y=6', 'y=2'], expectedGradeAccepted: true,
    mathematicalWitness: witness({ y: '2' }, ['3y-1=5']) }),
  make({ ...explicit, id: 'case-upper-Y', baseTaskId: 'case-3v-minus1-equals5', split: 'holdout', family: 'letter-case-y',
    prompt: '3Y-1=5', expectedLines: ['3Y-1=5', '3Y=6', 'Y=2'], expectedGradeAccepted: true,
    mathematicalWitness: witness({ Y: '2' }, ['3Y-1=5']) }),
  make({ ...explicit, id: 'case-mixed-xX', baseTaskId: 'case-two-variables-sum5-difference1', split: 'development', family: 'mixed-case-system',
    prompt: grouped(xSystem.slice(0, 2)), expectedLines: xSystem, expectedGradeAccepted: true,
    mathematicalWitness: witness({ x: '3', X: '2' }, xSystem.slice(0, 2)) }),
  make({ ...explicit, id: 'case-wrong-xX-step', baseTaskId: 'case-two-variables-sum5-difference1', split: 'development', family: 'wrong-case-system-step',
    prompt: grouped(xSystem.slice(0, 2)), expectedLines: [xSystem[0], xSystem[1], '2X=6', 'x=3', 'X=2'], expectedGradeAccepted: false,
    intentionalError: 'The written middle row changes x to X. Correct final assignments do not justify this false step; OCR must retain the uppercase X.',
    mathematicalWitness: witness({ x: '3', X: '2' }, xSystem.slice(0, 2), [2]) }),
  make({ ...explicit, id: 'case-mixed-yY', baseTaskId: 'case-two-variables-sum4-difference2', split: 'holdout', family: 'mixed-case-system',
    prompt: grouped(ySystem.slice(0, 2)), expectedLines: ySystem, expectedGradeAccepted: true,
    mathematicalWitness: witness({ y: '3', Y: '1' }, ySystem.slice(0, 2)) }),
  make({ ...explicit, id: 'case-wrong-yY-step', baseTaskId: 'case-two-variables-sum4-difference2', split: 'holdout', family: 'wrong-case-system-step',
    prompt: grouped(ySystem.slice(0, 2)), expectedLines: [ySystem[0], ySystem[1], '2Y=6', 'y=3', 'Y=1'], expectedGradeAccepted: false,
    intentionalError: 'The written middle row changes y to Y. The uppercase Y must stay in the transcription despite the correct final assignments.',
    mathematicalWitness: witness({ y: '3', Y: '1' }, ySystem.slice(0, 2), [2]) }),
  make({ ...explicit, id: 'case-both-xy', baseTaskId: 'case-two-variables-sum5-difference1', split: 'development', family: 'two-letter-system',
    prompt: grouped(['x+y=5', 'x-y=1']), expectedLines: ['x+y=5', 'x-y=1', '2x=6', 'x=3', 'y=2'], expectedGradeAccepted: true,
    mathematicalWitness: witness({ x: '3', y: '2' }, ['x+y=5', 'x-y=1']) }),
  make({ ...explicit, id: 'case-both-XY', baseTaskId: 'case-two-variables-sum5-difference1', split: 'development', family: 'two-letter-system',
    prompt: grouped(['X+Y=5', 'X-Y=1']), expectedLines: ['X+Y=5', 'X-Y=1', '2X=6', 'X=3', 'Y=2'], expectedGradeAccepted: true,
    mathematicalWitness: witness({ X: '3', Y: '2' }, ['X+Y=5', 'X-Y=1']) }),
  make({ distinction: 'ambiguous', glyphStyle: 'unresolved-cross', id: 'case-ambiguous-lower-intent',
    baseTaskId: 'case-2v-plus1-equals5', split: 'development', family: 'ambiguous-case-control', prompt: xRows[0],
    expectedLines: xRows, expectedGradeAccepted: true, ambiguity: ambiguity(XRows),
    measurementGap: 'The target records author intent only. This case is not evidence that an ambiguous cross can be uniquely recognized.',
    mathematicalWitness: witness({ x: '2' }, [xRows[0]]) }),
  make({ distinction: 'ambiguous', glyphStyle: 'unresolved-cross', id: 'case-ambiguous-upper-intent',
    baseTaskId: 'case-2v-plus1-equals5', split: 'development', family: 'ambiguous-case-control', prompt: xRows[0],
    expectedLines: XRows, expectedGradeAccepted: false, ambiguity: ambiguity(xRows),
    intentionalError: 'The author intended X throughout an answer to a task about x. The identical cross raster cannot establish that intent. Do not silently substitute x to obtain an accepted answer.',
    measurementGap: 'An observationally identical pair with incompatible exact targets must be reported as an ambiguity control, not an attainable joint exactness target.',
    mathematicalWitness: witness({ x: '2', X: '3' }, [xRows[0]], [0, 1, 2]) }),
];

export const OCR_LETTER_CASE_CORPUS_DESCRIPTION = {
  id: 'berechneocr-authored-letter-case-v1', synthetic: true,
  source: 'Authored vector letter styles plus existing authored mathematical glyphs; no pupil data, screenshots, recorded handwriting or repository PNG files.',
  splitPolicy: 'All numerical task variants and variable renamings share a baseTaskId and split. Both intentionally ambiguous twins are development controls, never holdout examples.',
  limitation: 'This fixed synthetic probe measures case-sensitive transcription and grading behavior, not general handwriting accuracy. Clear examples and ambiguous controls must be reported separately; the latter have conflicting authored targets for identical pixels.',
} as const;
