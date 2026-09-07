/**
 * A deterministic authored equation for chunk-integration and local model checks.
 * This contains no recorded handwriting or learner data. Results on this image
 * describe this development example, not general handwriting accuracy.
 */
type Point = readonly [number, number];
type Glyph = readonly (readonly Point[])[];

export const SYNTHETIC_EQUATION_GLYPHS: Record<string, Glyph> = {
  '1': [[[0.20, 0.20], [0.55, 0.00], [0.55, 1.00]]],
  '2': [[[0.10, 0.20], [0.30, 0.00], [0.75, 0.00], [0.95, 0.22], [0.78, 0.48], [0.10, 1.00], [0.95, 1.00]]],
  '3': [[[0.08, 0.06], [0.62, 0.00], [0.92, 0.20], [0.72, 0.42], [0.40, 0.50], [0.73, 0.55], [0.98, 0.78], [0.72, 0.98], [0.08, 0.94]]],
  '4': [[[0.72, 0], [0.72, 1]], [[0.72, 0], [0.08, 0.66], [1, 0.66]]],
  '5': [[[0.95, 0.02], [0.15, 0.02], [0.10, 0.45], [0.63, 0.41], [0.94, 0.58], [0.84, 0.88], [0.10, 0.98]]],
  x: [[[0.1, 0.1], [0.9, 0.9]], [[0.9, 0.1], [0.1, 0.9]]],
  '+': [[[0.05, 0.52], [0.95, 0.52]], [[0.5, 0.08], [0.5, 0.94]]],
  '=': [[[0.05, 0.38], [0.95, 0.38]], [[0.05, 0.66], [0.95, 0.66]]],
  '\u00b7': [[[0.5, 0.52]]],
  '|': [[[0.5, -0.1], [0.5, 1.1]]],
};
export const SYNTHETIC_LEFT_TEXT = '3x+12+2\u00b73+12';
export const SYNTHETIC_RIGHT_TEXT = '12+3+12+3';
export const SYNTHETIC_LEFT_TEX = String.raw`3x+12+2\cdot3+12`;
export const SYNTHETIC_RIGHT_TEX = '12+3+12+3';
export const SYNTHETIC_EQUATION_TEX = SYNTHETIC_LEFT_TEX + ' = ' + SYNTHETIC_RIGHT_TEX;


type Stroke = Array<{ x: number; y: number }>;

function createSample() {
  const strokes: Stroke[] = [];
  const height = 32;
  const originX = 16;
  const originY = 16;
  const appendText = (text: string, x: number): number => {
    let cursor = x;
    for (const character of text) {
      const width = height * (character === '\u00b7' || character === '|' ? 0.24 : 0.62);
      for (const stroke of SYNTHETIC_EQUATION_GLYPHS[character]) {
        strokes.push(stroke.map(([px, py]) => ({ x: cursor + px * width, y: originY + py * height })));
      }
      cursor += width + height * 0.16;
    }
    return cursor;
  };
  const leftEnd = appendText(SYNTHETIC_LEFT_TEXT, originX);
  const equalityStart = leftEnd + height * 0.5;
  const equalEnd = appendText('=', equalityStart);
  const rightEnd = appendText(SYNTHETIC_RIGHT_TEXT, equalEnd + height * 0.5);
  return {
    id: 'synthetic-wide-equation-v1',
    family: 'long-equation',
    synthetic: true as const,
    width: Math.ceil(rightEnd + 16),
    height: 64,
    lineWidth: 3,
    expectedLatex: SYNTHETIC_EQUATION_TEX,
    expectedParts: [SYNTHETIC_LEFT_TEX, SYNTHETIC_RIGHT_TEX] as const,
    strokes,
    layout: { originX, originY, glyphHeight: height, operationX: rightEnd + height * 0.7, equalityStart },
  };
}

/** Render these absolute coordinates as black round-capped strokes on white. */
export const SYNTHETIC_LONG_EQUATION = createSample();
