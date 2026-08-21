import assert from 'node:assert/strict';
import test from 'node:test';

import { chromium, type Page } from 'playwright';

import {
  BUNDLE_URL,
  COLUMN_ADDITION_COURSE_URL,
  REAL_COLUMN_ADDITION_COURSE_URL,
  assertNoRuntimeErrors,
  assertSyntheticDelivery,
  createHarness,
  openCourse,
  snapshotDiagnostics,
} from './support.mts';

type Point = readonly [number, number];
type Stroke = ReadonlyArray<Point>;

const NO_CARRY_COLUMN_ADDITION_COURSE_URL =
  'https://lia-canvas-ocr.invalid/courses/no-carry-column-addition.md';
const NO_CARRY_COLUMN_ADDITION_COURSE = [
  '<!--',
  'author: lia-canvas-ocr browser tests',
  'version: 1.0.0',
  'language: en',
  'import: https://lia-canvas-ocr.invalid/template.md',
  '-->',
  '',
  '# Written addition without carries',
  '',
  '@BerechneOCR(`2415+1213`)',
].join('\n');
const THREE_SUMMAND_COLUMN_ADDITION_COURSE_URL =
  'https://lia-canvas-ocr.invalid/courses/three-summand-column-addition.md';
const THREE_SUMMAND_COLUMN_ADDITION_COURSE = [
  '<!--',
  'author: lia-canvas-ocr browser tests',
  'version: 1.0.0',
  'language: en',
  'import: https://lia-canvas-ocr.invalid/template.md',
  '-->',
  '',
  '# Written addition with three summands',
  '',
  '@BerechneOCR(`1111+2222+3333`)',
].join('\n');
const WRONG_CARRY_THREE_SUMMAND_COURSE_URL =
  'https://lia-canvas-ocr.invalid/courses/wrong-carry-three-summand-column-addition.md';
const WRONG_CARRY_THREE_SUMMAND_COURSE = [
  '<!--',
  'author: lia-canvas-ocr browser tests',
  'version: 1.0.0',
  'language: en',
  'import: https://lia-canvas-ocr.invalid/template.md',
  '-->',
  '',
  '# Written addition with three summands and a wrong carry row',
  '',
  '@BerechneOCR(`1111+2222+3333`)',
].join('\n');
const EXTRA_OBSERVED_SUMMAND_COURSE_URL =
  'https://lia-canvas-ocr.invalid/courses/extra-observed-summand-column-addition.md';
const EXTRA_OBSERVED_SUMMAND_COURSE = [
  '<!--',
  'author: lia-canvas-ocr browser tests',
  'version: 1.0.0',
  'language: en',
  'import: https://lia-canvas-ocr.invalid/template.md',
  '-->',
  '',
  '# Written addition with an extra observed summand',
  '',
  '@BerechneOCR(`4728+3596`)',
].join('\n');

async function drawPolyline(page: Page, points: ReadonlyArray<{ x: number; y: number }>) {
  assert.ok(points.length >= 2);
  await page.mouse.move(points[0].x, points[0].y);
  await page.mouse.down();
  for (let index = 1; index < points.length; index += 1) {
    const from = points[index - 1];
    const to = points[index];
    for (let step = 1; step <= 6; step += 1) {
      await page.mouse.move(
        from.x + ((to.x - from.x) * step) / 6,
        from.y + ((to.y - from.y) * step) / 6,
      );
    }
  }
  await page.mouse.up();
}

function digitStrokes(
  digit: string,
  x: number,
  y: number,
  width = 28,
  height = 60,
): Stroke[] {
  const p = (dx: number, dy: number): Point => [x + dx * width, y + dy * height];
  switch (digit) {
    case '1': {
      const stemX = x + width * 0.72;
      return [[
        [stemX - height * 0.24, y + height * 0.30],
        [stemX, y],
        [stemX, y + height * 0.40],
        [stemX, y + height],
      ]];
    }
    case '2':
      return [[
        p(0.04, 0.22), p(0.18, 0.04), p(0.76, 0), p(1, 0.18),
        p(0.88, 0.38), p(0, 1), p(1, 1),
      ]];
    case '3':
      return [[
        p(0.06, 0.04), p(0.80, 0), p(1, 0.18), p(0.62, 0.48),
        p(1, 0.66), p(0.82, 0.96), p(0.08, 1),
      ]];
    case '4':
      return [
        [p(0.82, 0), p(0.08, 0.62), p(1, 0.62)],
        [p(0.80, 0.20), p(0.80, 1)],
      ];
    case '5':
      return [[
        p(1, 0), p(0.14, 0), p(0.04, 0.48), p(0.74, 0.48),
        p(1, 0.66), p(0.84, 0.96), p(0.08, 1),
      ]];
    case '6':
      return [[
        p(0.92, 0.08), p(0.66, 0), p(0.24, 0.08), p(0.04, 0.48),
        p(0.10, 0.84), p(0.30, 1), p(0.78, 0.96), p(1, 0.72),
        p(0.84, 0.52), p(0.08, 0.52),
      ]];
    case '7':
      return [[p(0, 0), p(1, 0), p(0.28, 1)]];
    case '8':
      return [[
        p(0.50, 0.50), p(0.19, 0.35), p(0.22, 0.09), p(0.50, 0),
        p(0.79, 0.10), p(0.81, 0.35), p(0.50, 0.50), p(0.19, 0.68),
        p(0.22, 0.92), p(0.50, 1), p(0.81, 0.90), p(0.80, 0.65),
        p(0.50, 0.50),
      ]];
    case '9':
      return [[
        p(0.92, 0.46), p(0.20, 0.48), p(0, 0.28), p(0.18, 0.02),
        p(0.78, 0), p(1, 0.24), p(0.82, 1),
      ]];
    default:
      throw new Error('Unsupported test digit: ' + digit);
  }
}

function numberStrokes(value: string, y: number): Stroke[] {
  return Array.from(value).flatMap((digit, index) =>
    digitStrokes(digit, 150 + index * 40, y),
  );
}

function writtenAdditionStrokes(): Stroke[] {
  return [
    ...numberStrokes('4379', 35),
    [[100, 170], [126, 170]],
    [[113, 156], [113, 184]],
    ...numberStrokes('1544', 140),
    // Incoming carries for tens and hundreds: both have an explicit top hook.
    [[194.16, 222.8], [210, 212], [210, 226.4], [210, 248]],
    [[234.16, 222.8], [250, 212], [250, 226.4], [250, 248]],
    // Match the visibly rising, slightly wobbly rule from the documented
    // hand-written example instead of an unrealistically level test stroke.
    [[90, 265], [155, 264], [225, 267.5], [330, 250]],
    ...numberStrokes('5923', 295),
  ];
}

function threeSummandAdditionStrokes(): Stroke[] {
  const number = (value: string, y: number): Stroke[] =>
    Array.from(value).flatMap((digit, index) =>
      digitStrokes(digit, 150 + index * 40, y, 28, 45),
    );
  const plus = (y: number): Stroke[] => [
    [[100, y + 22.5], [126, y + 22.5]],
    [[113, y + 10], [113, y + 35]],
  ];
  return [
    ...number('1111', 0),
    ...plus(85),
    ...number('2222', 85),
    ...plus(170),
    ...number('3333', 170),
    [[90, 260], [160, 259], [235, 261], [330, 260]],
    ...number('6666', 305),
  ];
}

function threeSummandAdditionWithWrongCarryStrokes(): Stroke[] {
  const number = (value: string, y: number): Stroke[] =>
    Array.from(value).flatMap((digit, index) =>
      digitStrokes(digit, 150 + index * 40, y, 28, 45),
    );
  const plus = (y: number): Stroke[] => [
    [[100, y + 22.5], [126, y + 22.5]],
    [[113, y + 10], [113, y + 35]],
  ];
  const carryOne = (x: number): Stroke => [
    [x - 13, 196],
    [x, 180],
    [x, 210],
    [x + 10, 200],
  ];
  return [
    ...number('1111', 0),
    ...plus(60),
    ...number('2222', 60),
    ...plus(120),
    ...number('3333', 120),
    carryOne(164),
    ...digitStrokes('2', 190, 180, 28, 30),
    carryOne(244),
    [[90, 220], [160, 219], [235, 221], [330, 220]],
    ...number('6666', 245),
  ];
}

function extraObservedSummandAndCarryStrokes(): Stroke[] {
  const number = (value: string, y: number): Stroke[] =>
    Array.from(value).flatMap((digit, index) =>
      digitStrokes(digit, 150 + index * 40, y, 28, 45),
    );
  const plus = (y: number): Stroke[] => [
    [[100, y + 22.5], [126, y + 22.5]],
    [[113, y + 10], [113, y + 35]],
  ];
  return [
    ...number('4397', 0),
    ...plus(60),
    ...number('1478', 60),
    ...plus(120),
    ...number('5392', 120),
    // Deliberately smaller than every operand row. The observed `2` belongs
    // to the hundreds carry cell and must not become a fourth summand.
    ...digitStrokes('2', 190, 180, 28, 30),
    [[90, 220], [160, 219], [235, 221], [330, 220]],
    ...number('9785', 245),
  ];
}

export function readmeAdditionStrokes(): Stroke[] {
  return [
    ...numberStrokes('4728', 35),
    [[100, 170], [126, 170]],
    [[113, 156], [113, 184]],
    ...numberStrokes('3596', 140),
    [[154.16, 222.8], [170, 212], [170, 226.4], [170, 248]],
    [[194.16, 222.8], [210, 212], [210, 226.4], [210, 248]],
    [[234.16, 222.8], [250, 212], [250, 226.4], [250, 248]],
    [[90, 265], [155, 263], [225, 265.5], [330, 264]],
    ...numberStrokes('8324', 295),
  ];
}

/** Exact geometry from the handwritten report that triggered the fraction OCR. */
export function screenshotAdditionStrokes(): Stroke[] {
  return [
    [[178, 36], [165, 75], [197, 76]],
    [[190, 35], [185, 95]],
    [[205, 40], [239, 40], [217, 95]],
    [[248, 48], [253, 39], [271, 35], [285, 39], [290, 49], [286, 60], [251, 94], [290, 94]],
    [[317, 41], [328, 35], [342, 39], [347, 49], [345, 59], [317, 80], [335, 96], [349, 92], [351, 80], [323, 60], [317, 48]],
    [[100, 170], [128, 170]],
    [[114, 154], [114, 187]],
    [[151, 145], [181, 143], [186, 154], [172, 169], [188, 178], [181, 198], [150, 200]],
    [[228, 143], [198, 143], [195, 169], [219, 169], [230, 180], [223, 199], [194, 201]],
    [[251, 151], [260, 143], [278, 143], [287, 152], [284, 171], [271, 176], [253, 170], [251, 151], [284, 201]],
    [[329, 143], [309, 157], [302, 177], [305, 194], [318, 202], [335, 196], [339, 181], [329, 170], [307, 174]],
    [[154, 229], [170, 214], [170, 248]],
    [[194, 229], [210, 214], [210, 248]],
    [[234, 229], [250, 214], [250, 248]],
    [[90, 265], [160, 263], [235, 264], [330, 264]],
    [[182, 301], [165, 296], [156, 303], [157, 312], [168, 319], [184, 320], [169, 324], [157, 332], [158, 343], [169, 352], [185, 350], [190, 342], [188, 334], [171, 324]],
    [[205, 299], [233, 297], [238, 308], [225, 322], [240, 331], [234, 350], [205, 352]],
    [[248, 307], [254, 299], [273, 296], [288, 304], [288, 315], [253, 351], [290, 351]],
    [[327, 296], [304, 332], [340, 332]],
    [[332, 306], [332, 354]],
  ];
}

function screenshotAdditionWithoutWrittenStructureStrokes(): Stroke[] {
  // Keep the two operands and result, but deliberately omit the carry marks
  // and the calculation rule. OCR can still read three rows, while written
  // arithmetic must remain an editable, non-submittable draft.
  return screenshotAdditionStrokes().filter(stroke =>
    !stroke.every(([, y]) => y >= 210 && y <= 270)
  );
}

function remapStrokeY(
  stroke: Stroke,
  sourceY: number,
  sourceHeight: number,
  targetY: number,
  targetHeight: number,
): Stroke {
  return stroke.map(([x, y]) => [
    x,
    targetY + (y - sourceY) * targetHeight / sourceHeight,
  ] as const);
}

function largeDeepCarryAdditionStrokes(): Stroke[] {
  const source = screenshotAdditionStrokes();
  const deepCarry = (x: number): Stroke => [
    [x - 24, 205 + 51 * 0.6],
    [x, 205],
    [x, 256],
  ];
  return [
    ...source.slice(0, 5).map(stroke => remapStrokeY(stroke, 35, 61, 10, 75)),
    ...source.slice(5, 11).map(stroke => remapStrokeY(stroke, 143, 59, 105, 75)),
    deepCarry(170),
    deepCarry(210),
    deepCarry(250),
    [[90, 272], [160, 270.5], [235, 271.5], [330, 271]],
    ...source.slice(15).map(stroke => remapStrokeY(stroke, 296, 58, 290, 75)),
  ];
}

function screenshotAdditionWithoutCarryStrokes(): Stroke[] {
  const source = screenshotAdditionStrokes();
  return [...source.slice(0, 11), ...source.slice(14)];
}

function ambiguousVisibleCarryRowAdditionStrokes(): Stroke[] {
  const source = screenshotAdditionStrokes();
  const remapTop = (stroke: Stroke): Stroke => remapStrokeY(
    stroke.map(([x, y]) => [351 - (351 - x) * 1.25, y] as const),
    35,
    61,
    5,
    95,
  );
  return [
    ...source.slice(0, 5).map(remapTop),
    ...source.slice(5, 11).map(stroke => remapStrokeY(stroke, 143, 59, 120, 75)),
    // These are visibly connected, compact `1` glyphs, but the deliberate
    // bottom foot keeps them outside the vector carry classifier. The OCR row
    // fallback must preserve the three observed glyphs even when FormulaNet
    // repeats one token and returns four written ones.
    [[158, 239], [170, 227], [170, 278], [180, 268]],
    [[198, 239], [210, 227], [210, 278], [220, 268]],
    [[238, 239], [250, 227], [250, 278], [260, 268]],
    [[90, 290], [160, 289], [235, 291], [330, 290]],
    ...source.slice(15).map(stroke => remapStrokeY(stroke, 296, 58, 300, 75)),
  ];
}

async function installCarryPreviewStub(page: Page): Promise<void> {
  await page.evaluate(() => {
    (window as any).katex = {
      render(
        tex: string,
        target: HTMLElement,
        options: Record<string, any> = {},
      ) {
        target.replaceChildren();
        const katex = document.createElement('span');
        katex.className = 'katex';
        const html = document.createElement('span');
        html.className = 'katex-html';
        html.style.display = 'inline-block';
        html.style.width = options.displayMode === true ? '1000px' : '148px';
        html.textContent = 'rendered';
        const carryCount = (tex.match(/\\textcolor\{red\}\{1\}/gu) || []).length;
        for (let index = 0; index < carryCount; index += 1) {
          const carry = document.createElement('span');
          carry.className = 'test-rendered-carry';
          carry.style.color = 'red';
          carry.textContent = '1';
          html.appendChild(carry);
        }
        katex.appendChild(html);
        target.appendChild(katex);
        target.setAttribute('data-rendered-tex', tex);
      },
    };
  });
}

async function installColumnPolicyOcrStub(
  page: Page,
  responses: string[],
  label: string,
): Promise<void> {
  await page.evaluate(({ rawResponses, stubLabel }) => {
    (window as any).__liaColumnPolicyResponses = [...rawResponses];
    (window as any).__liaColumnPolicyCalls = 0;
    const ocr = {
      model: stubLabel,
      precision: 'fp32',
      task: 'image-to-text',
      cacheKey: stubLabel + '-v1',
      outputKind: 'latex',
      inputProfile: 'formulanet-line-384',
      calculationSinglePass: true,
      ensureLoaded: async () => true,
      recognize: async () => {
        (window as any).__liaColumnPolicyCalls += 1;
        const response = (window as any).__liaColumnPolicyResponses.shift();
        if (typeof response !== 'string') {
          throw new Error(stubLabel + ' reached an unexpected OCR call.');
        }
        return response;
      },
    };
    window.__LIA_CANVAS_OCR__.ocr = ocr;
    window.__LIA_CANVAS_OCR__.canvasPlusOcr = ocr;
  }, { rawResponses: responses, stubLabel: label });
}

function threeDigitCarryAdditionStrokes(): Stroke[] {
  return [
    ...numberStrokes('372', 35),
    [[100, 170], [126, 170]],
    [[113, 156], [113, 184]],
    ...numberStrokes('165', 140),
    // 7 + 6 creates the sole incoming carry in the leftmost hundreds column.
    [[154.16, 222.8], [170, 212], [170, 226.4], [170, 248]],
    [[90, 265], [145, 263], [215, 265.5], [290, 264]],
    ...numberStrokes('537', 295),
  ];
}

export async function drawDesign(
  page: Page,
  box: { x: number; y: number; width: number; height: number },
  strokes: readonly Stroke[],
): Promise<void> {
  const scale = Math.min(box.width * 0.68 / 420, box.height * 0.78 / 380);
  const originX = box.x + (box.width - 420 * scale) / 2;
  const originY = box.y + box.height * 0.08;
  for (const stroke of strokes) {
    await drawPolyline(page, stroke.map(([x, y]) => ({
      x: originX + x * scale,
      y: originY + y * scale,
    })));
  }
}

export async function answerBeforePair(page: Page, selector: string): Promise<string> {
  return page.evaluate(pairSelector => {
    const pair = document.querySelector(pairSelector);
    if (!pair) throw new Error('Canvas pair not found.');
    let answer: Element | null = null;
    for (const field of document.querySelectorAll(
      'input, textarea, [contenteditable=true]',
    )) {
      if (field.compareDocumentPosition(pair) & Node.DOCUMENT_POSITION_FOLLOWING) {
        answer = field;
      }
    }
    if (!answer) throw new Error('Native answer field not found.');
    return 'value' in answer
      ? String((answer as HTMLInputElement).value || '')
      : String(answer.textContent || '');
  }, selector);
}

export async function checkNativeQuiz(page: Page, selector: string): Promise<void> {
  await page.evaluate(pairSelector => {
    const pair = document.querySelector(pairSelector);
    if (!pair) throw new Error('Canvas pair not found.');
    let answer: Element | null = null;
    for (const field of document.querySelectorAll(
      'input, textarea, [contenteditable=true]',
    )) {
      if (field.compareDocumentPosition(pair) & Node.DOCUMENT_POSITION_FOLLOWING) {
        answer = field;
      }
    }
    const quiz = answer?.closest('.lia-quiz');
    const button = Array.from(
      quiz?.querySelectorAll<HTMLButtonElement>('button.lia-quiz__check') || [],
    ).at(-1);
    if (!button || button.disabled) throw new Error('Native Check button not available.');
    button.setAttribute('data-column-addition-check', '1');
  }, selector);
  await page.locator('[data-column-addition-check]').click();
  await page.waitForFunction(
    pairSelector => {
      const pair = document.querySelector(pairSelector);
      if (!pair) return false;
      let answer: Element | null = null;
      for (const field of document.querySelectorAll(
        'input, textarea, [contenteditable=true]',
      )) {
        if (field.compareDocumentPosition(pair) & Node.DOCUMENT_POSITION_FOLLOWING) {
          answer = field;
        }
      }
      const quiz = answer?.closest('.lia-quiz');
      return Boolean(
        quiz?.classList.contains('solved') &&
        quiz.querySelector('.lia-quiz__feedback.text-success'),
      );
    },
    selector,
    { timeout: 8_000 },
  );
}

async function checkNativeQuizIncorrect(page: Page, selector: string): Promise<void> {
  await page.evaluate(pairSelector => {
    const pair = document.querySelector(pairSelector);
    if (!pair) throw new Error('Canvas pair not found.');
    let answer: Element | null = null;
    for (const field of document.querySelectorAll(
      'input, textarea, [contenteditable=true]',
    )) {
      if (field.compareDocumentPosition(pair) & Node.DOCUMENT_POSITION_FOLLOWING) {
        answer = field;
      }
    }
    const quiz = answer?.closest('.lia-quiz');
    const button = Array.from(
      quiz?.querySelectorAll<HTMLButtonElement>('button.lia-quiz__check') || [],
    ).at(-1);
    if (!button || button.disabled) throw new Error('Native Check button not available.');
    document
      .querySelectorAll('[data-column-addition-incorrect-check]')
      .forEach(node => node.removeAttribute('data-column-addition-incorrect-check'));
    button.setAttribute('data-column-addition-incorrect-check', '1');
  }, selector);
  await page.locator('[data-column-addition-incorrect-check]').click();
  await page.waitForFunction(
    pairSelector => {
      const pair = document.querySelector(pairSelector);
      if (!pair) return false;
      let answer: Element | null = null;
      for (const field of document.querySelectorAll(
        'input, textarea, [contenteditable=true]',
      )) {
        if (field.compareDocumentPosition(pair) & Node.DOCUMENT_POSITION_FOLLOWING) {
          answer = field;
        }
      }
      const quiz = answer?.closest('.lia-quiz');
      return Boolean(
        quiz?.classList.contains('open') &&
        quiz.querySelector('.lia-quiz__feedback.text-error') &&
        !quiz.querySelector('.lia-quiz__feedback.text-success'),
      );
    },
    selector,
    { timeout: 8_000 },
  );
}

async function settleAndMeasureNativePreview(page: Page, selector: string): Promise<{
  width: number;
  hintRight: number;
  inlineWidth: string;
  mathScrollWidth: number;
}> {
  await page.evaluate(() => new Promise<void>(resolve => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  }));
  return page.evaluate(pairSelector => {
    const pair = document.querySelector(pairSelector);
    if (!pair) throw new Error('Canvas pair not found for preview measurement.');
    let field: Element | null = null;
    for (const candidate of document.querySelectorAll(
      'input, textarea, [contenteditable=true]',
    )) {
      if (candidate.compareDocumentPosition(pair) & Node.DOCUMENT_POSITION_FOLLOWING) {
        field = candidate;
      }
    }
    const preview = field
      ? (field as any).__liaTexPreviewBox as HTMLElement | null
      : null;
    const hint = preview?.querySelector('.lia-tex-preview-hint') as HTMLElement | null;
    const math = preview?.querySelector('.lia-tex-preview-math') as HTMLElement | null;
    if (!preview || !hint || !math || preview.dataset.on !== '1' ||
        preview.dataset.multiline !== '1') {
      throw new Error('Native multiline preview not found.');
    }
    return {
      width: preview.getBoundingClientRect().width,
      hintRight: hint.getBoundingClientRect().right,
      inlineWidth: preview.style.width,
      mathScrollWidth: math.scrollWidth,
    };
  }, selector);
}

export function registerColumnAdditionBrowserRegression(): void {
  test(
    'current chromium smoke: automatic written addition preserves rule and carries',
    { timeout: 90_000 },
    async t => {
      const requested = new Set(
        (process.env.LIA_BROWSER_PROJECTS ?? 'chromium,firefox,webkit')
          .split(',')
          .map(value => value.trim().toLowerCase())
          .filter(Boolean),
      );
      if (!requested.has('chromium')) {
        t.skip('excluded by LIA_BROWSER_PROJECTS');
        return;
      }

      let browser;
      try {
        browser = await chromium.launch({ headless: true });
      } catch (error) {
        throw new Error(
          'Could not launch Playwright chromium. Install it first.\n' + String(error),
        );
      }

      const harness = await createHarness(browser, { withAlgebrite: false });
      const selector =
        '.lia-canvas-pair[data-canvas-mode=plus][data-canvas-output=answer]';
      try {
        await harness.page.setViewportSize({ width: 1920, height: 1100 });
        await openCourse(
          harness,
          COLUMN_ADDITION_COURSE_URL,
          selector + ' .lia-canvas-launch',
        );
        const page = harness.page;
        const pair = page.locator(selector);
        await page.evaluate(() => {
          const answers = document.querySelector('.lia-quiz__answers') as HTMLElement | null;
          if (!answers) throw new Error('Native quiz answers container not found.');
          answers.style.width = '1200px';
          answers.style.maxWidth = 'none';
          answers.dataset.autosizeStress = 'wide';
        });
        assert.equal(new URL(page.url()).hash, '#1');
        await page.evaluate(() => {
          (window as any).__liaKatexRenders = [];
          (window as any).katex = {
            render(
              tex: string,
              target: HTMLElement,
              options: Record<string, any> = {},
            ) {
              target.replaceChildren();
              const katex = document.createElement('span');
              katex.className = 'katex';
              const html = document.createElement('span');
              html.className = 'katex-html';
              html.style.display = 'inline-block';
              // Model the relevant KaTeX sizing contract: a top-level display
              // environment consumes the available line, whereas an inline
              // array keeps its intrinsic calculation width.
              html.style.width = options.displayMode === true ? '1000px' : '148px';
              html.textContent = 'rendered';
              const carryCount = (tex.match(/\\textcolor\{red\}\{1\}/gu) || []).length;
              for (let index = 0; index < carryCount; index += 1) {
                const carry = document.createElement('span');
                carry.className = 'test-rendered-carry';
                carry.style.color = 'red';
                carry.textContent = '1';
                html.appendChild(carry);
              }
              katex.appendChild(html);
              target.appendChild(katex);
              target.setAttribute('data-rendered-tex', tex);
              (window as any).__liaKatexRenders.push({
                tex,
                targetClass: target.className,
                displayMode: options.displayMode === true,
              });
            },
          };
          // FormulaNet can return a syntactically valid wrong digit when a
          // compact leading plus changes the row aspect ratio. A second crop
          // may replace it only when two plain anchor rows independently make
          // the first reading inconsistent and the retry changes one digit.
          (window as any).__liaColumnResponses = [
            '4379',
            '+1584',
            '5923',
            '1544',
          ];
          (window as any).__liaColumnCrops = [];
          const ocr = {
            model: 'column-addition-geometry-stub',
            precision: 'fp32',
            task: 'image-to-text',
            cacheKey: 'column-addition-geometry-v1',
            outputKind: 'latex',
            inputProfile: 'formulanet-line-384',
            calculationSinglePass: true,
            ensureLoaded: async () => true,
            recognize: async (
              input: HTMLCanvasElement,
              options: Record<string, any> = {},
            ) => {
              const context = input.getContext('2d', { willReadFrequently: true });
              if (!context) throw new Error('column crop has no 2D context');
              const image = context.getImageData(0, 0, input.width, input.height);
              let x0 = input.width;
              let y0 = input.height;
              let x1 = -1;
              let y1 = -1;
              for (let y = 0; y < input.height; y += 1) {
                for (let x = 0; x < input.width; x += 1) {
                  const offset = (y * input.width + x) * 4;
                  const alpha = image.data[offset + 3] / 255;
                  const luminance = image.data[offset] * 0.299 +
                    image.data[offset + 1] * 0.587 + image.data[offset + 2] * 0.114;
                  if (255 - alpha * (255 - luminance) >= 245) continue;
                  x0 = Math.min(x0, x);
                  y0 = Math.min(y0, y);
                  x1 = Math.max(x1, x);
                  y1 = Math.max(y1, y);
                }
              }
              (window as any).__liaColumnCrops.push({
                width: input.width,
                height: input.height,
                inkWidth: x1 >= x0 ? x1 - x0 + 1 : 0,
                inkHeight: y1 >= y0 ? y1 - y0 + 1 : 0,
                maxNewTokens: Number(options.max_new_tokens) || 0,
              });
              const response = (window as any).__liaColumnResponses.shift();
              if (typeof response !== 'string') {
                throw new Error('FormulaNet received an unexpected rule/carry crop');
              }
              return response;
            },
          };
          window.__LIA_CANVAS_OCR__.ocr = ocr;
          window.__LIA_CANVAS_OCR__.canvasPlusOcr = ocr;
        });

        await pair.locator('.lia-canvas-launch:visible').click();
        assert.equal(
          await pair.getAttribute('data-calculation-kind'),
          'column-addition',
          'the integer-only + prompt must select column addition automatically',
        );
        const canvas = pair.locator('canvas.lia-draw:visible');
        await canvas.waitFor({ state: 'visible', timeout: 10_000 });
        const box = await canvas.boundingBox();
        assert.ok(box, 'the written-addition canvas has no bounding box');
        await drawDesign(page, box, writtenAdditionStrokes());
        await pair.locator('.lia-canvasplus-submit:visible').click();
        await page.waitForFunction(
          pairSelector => {
            const pair = document.querySelector(pairSelector) as HTMLElement | null;
            if (pair?.dataset.ocrError) return true;
            const output = document.querySelector(
              pairSelector + ' .lia-canvasplus-output',
            ) as HTMLElement | null;
            return output?.dataset.state === 'ready' &&
              output.dataset.analysisState === 'ready' &&
              String(output.dataset.latex || '').includes('\\hline');
          },
          selector,
          { timeout: 15_000 },
        );
        const recognitionError = await pair.getAttribute('data-ocr-error');
        assert.equal(recognitionError, null, recognitionError || 'column OCR failed');

        const output = pair.locator('.lia-canvasplus-output');
        if (!await output.evaluate(node => (node as HTMLDetailsElement).open)) {
          await output.locator(':scope > summary.lia-canvasplus-result-toggle').click();
        }
        const result = await pair.evaluate(element => {
          const outputNode = element.querySelector(
            '.lia-canvasplus-output',
          ) as HTMLElement | null;
          return {
            kind: (element as HTMLElement).dataset.calculationKind || '',
            latex: outputNode?.dataset.latex || '',
            lineCount: outputNode?.dataset.lineCount || '',
            transitions: outputNode?.querySelectorAll('.lia-canvasplus-transition').length || 0,
            equationRows: outputNode?.querySelectorAll('.lia-canvasplus-line').length || 0,
            columnPreviews: outputNode?.querySelectorAll(
              '.lia-canvasplus-column-calculation',
            ).length || 0,
            renderedTex: outputNode?.querySelector(
              '.lia-canvasplus-rendered',
            )?.getAttribute('data-rendered-tex') || '',
            crops: (window as any).__liaColumnCrops,
            remainingResponses: (window as any).__liaColumnResponses.length,
            katexRenders: (window as any).__liaKatexRenders,
            carryMapping: (window as any).__LIA_CANVAS_OCR__?.canvasPlusOcr
              ?.lastColumnCarryMapping || null,
          };
        });

        assert.equal(result.kind, 'column-addition');
        assert.equal(result.lineCount, '4', 'the visual column calculation has four rows');
        assert.equal(result.transitions, 0, 'column addition has no equation transitions');
        assert.equal(result.equationRows, 0, 'column addition has no equation row markup');
        assert.equal(result.columnPreviews, 1);
        assert.equal(result.renderedTex, result.latex);
        assert.match(result.latex, /\\hline/u);
        const rowOrder = [
          result.latex.indexOf('4379'),
          result.latex.indexOf('+1544'),
          result.latex.indexOf('\\textcolor{red}{1}'),
          result.latex.indexOf('\\hline'),
          result.latex.indexOf('5923'),
        ];
        assert.ok(
          rowOrder.every((offset, index) => offset >= 0 &&
            (index === 0 || offset > rowOrder[index - 1])),
          'TeX rows must be operand 1, operand 2, carries, rule, result: ' +
            result.latex + ' carryMapping=' + JSON.stringify(result.carryMapping),
        );
        assert.equal(
          result.carryMapping?.hints?.length,
          2,
          'both vector-confirmed carries must reach column mapping',
        );
        assert.equal(
          (result.latex.match(/\\textcolor\{red\}\{1\}/gu) || []).length,
          2,
          'the preview must retain exactly the two written carry ones',
        );
        assert.doesNotMatch(result.latex, /scriptstyle/u);
        const nativeArrayRender = result.katexRenders.find((entry: any) =>
          String(entry.targetClass).includes('lia-tex-preview-math') &&
          String(entry.tex).startsWith('\\begin{array}{r}'),
        );
        assert.ok(nativeArrayRender, JSON.stringify(result.katexRenders));
        assert.equal(
          nativeArrayRender.displayMode,
          false,
          'the compact array preview must stay out of KaTeX display mode',
        );
        await page.waitForFunction(() => {
          const preview = document.querySelector(
            '.lia-tex-preview',
          ) as HTMLElement | null;
          if (preview?.dataset.on !== '1' || preview.dataset.multiline !== '1') {
            return false;
          }
          const width = preview?.getBoundingClientRect().width || 0;
          return width >= 80 && width < 400;
        });
        const preview = page.locator(
          '.lia-tex-preview',
        ).first();
        const previewBounds = await preview.boundingBox();
        const answersBounds = await page.locator('.lia-quiz__answers').boundingBox();
        assert.ok(previewBounds, 'the native calculation preview has no bounds');
        assert.ok(answersBounds, 'the native answer container has no bounds');
        assert.ok(
          previewBounds.width < answersBounds.width * 0.4,
          'the native calculation preview expanded to the answer-row width',
        );
        assert.ok(
          previewBounds.x < answersBounds.x + answersBounds.width / 2,
          'the compact calculation preview drifted to the right edge',
        );
        assert.equal(
          await preview.locator('.test-rendered-carry').count(),
          2,
          'both red carry ones must remain visible in the native preview DOM',
        );
        assert.equal(result.remainingResponses, 0);
        assert.equal(
          result.crops.length,
          4,
          'FormulaNet must receive three rows and one targeted operand retry',
        );
        const initialCrops = result.crops.slice(0, 3);
        const maximumInkHeight = Math.max(
          ...initialCrops.map((crop: any) => Number(crop.inkHeight) || 0),
        );
        assert.ok(maximumInkHeight > 0);
        assert.ok(
          initialCrops.every((crop: any) =>
            crop.inkWidth > 0 && crop.inkHeight >= maximumInkHeight * 0.72,
          ),
          'a thin rule or small carry crop reached FormulaNet: ' +
            JSON.stringify(result.crops),
        );
        assert.ok(
          result.crops[3].inkWidth < result.crops[1].inkWidth &&
            result.crops[3].inkHeight < result.crops[1].height,
          'the retry must contain only the tight digit block after the plus: ' +
            JSON.stringify(result.crops),
        );
        assert.deepEqual(
          result.crops.map((crop: any) => crop.maxNewTokens),
          [64, 64, 64, 8],
          'only the targeted retry may use the short decoder budget',
        );

        const answer = await answerBeforePair(page, selector);
        const decoded = JSON.parse(answer);
        assert.equal(decoded.kind, 'column-addition');
        assert.equal(decoded.version, 1);
        assert.deepEqual(decoded.operands, ['4379', '1544']);
        assert.equal(decoded.result, '5923');
        assert.deepEqual(decoded.carries, [null, '1', '1', null]);
        assert.deepEqual(decoded.layout.rules, [{ kind: 'horizontal', afterRow: 2 }]);

        const previewGeometry = new Map<number, { width: number; hintRight: number }>();
        previewGeometry.set(1, await settleAndMeasureNativePreview(page, selector));
        for (let submitIndex = 2; submitIndex <= 10; submitIndex += 1) {
          await pair.locator('.lia-canvasplus-submit:visible').click();
          const geometry = await settleAndMeasureNativePreview(page, selector);
          if (submitIndex === 4 || submitIndex === 10) {
            previewGeometry.set(submitIndex, geometry);
          }
        }
        const geometries = [1, 4, 10].map(index => previewGeometry.get(index)!);
        const widthSpread = Math.max(...geometries.map(value => value.width)) -
          Math.min(...geometries.map(value => value.width));
        const hintSpread = Math.max(...geometries.map(value => value.hintRight)) -
          Math.min(...geometries.map(value => value.hintRight));
        assert.ok(
          widthSpread <= 0.5 && hintSpread <= 0.5,
          'identical submits must be pixel-stable at 1/4/10: ' +
            JSON.stringify(Object.fromEntries(previewGeometry)),
        );
        await page.evaluate(() => {
          const answers = document.querySelector(
            '.lia-quiz__answers[data-autosize-stress=wide]',
          ) as HTMLElement | null;
          if (!answers) throw new Error('Autosize stress container disappeared.');
          answers.style.width = '360px';
        });
        const narrowGeometry = await settleAndMeasureNativePreview(page, selector);
        assert.ok(
          narrowGeometry.width <= 360.5,
          'native preview must clamp to a narrow responsive parent: ' +
            JSON.stringify(narrowGeometry),
        );
        await page.evaluate(() => {
          const answers = document.querySelector(
            '.lia-quiz__answers[data-autosize-stress=wide]',
          ) as HTMLElement | null;
          if (answers) answers.style.width = '1200px';
        });
        const restoredGeometry = await settleAndMeasureNativePreview(page, selector);
        assert.ok(
          Math.abs(restoredGeometry.width - geometries[0].width) <= 0.5,
          'native preview must recover its intrinsic width after responsive growth: ' +
            JSON.stringify({ initial: geometries[0], narrowGeometry, restoredGeometry }),
        );

        await checkNativeQuiz(page, selector);
        assert.equal(await answerBeforePair(page, selector), answer);
        assert.equal(await output.count(), 1, 'the preview must survive native Check');
        assert.equal(await output.getAttribute('data-latex'), result.latex);
        assert.match(
          String(await page.locator('.lia-tex-preview-math').getAttribute('data-rendered-tex')),
          /\\hline/u,
        );

        // The dedicated second page exercises a leftmost carry in a
        // three-digit stack without changing the established fixtures.
        await page.evaluate(() => {
          if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
        });
        await page.keyboard.press('ArrowRight');
        await page.waitForFunction(
          pairSelector => {
            const pair = document.querySelector(pairSelector) as HTMLElement | null;
            return location.hash === '#2' &&
              document.querySelectorAll(pairSelector).length === 1 &&
              pair?.dataset.calculationPrompt === '372+165';
          },
          selector,
          { timeout: 10_000 },
        );
        const carryPair = page.locator(selector);
        await page.evaluate(() => {
          (window as any).__liaThreeDigitResponses = ['372', '+165', '537'];
          (window as any).__liaThreeDigitCalls = 0;
          const ocr = {
            model: 'three-digit-carry-stub',
            precision: 'fp32',
            task: 'image-to-text',
            cacheKey: 'three-digit-carry-inkbox-v1',
            outputKind: 'latex',
            inputProfile: 'formulanet-line-384',
            calculationSinglePass: true,
            ensureLoaded: async () => true,
            recognize: async () => {
              (window as any).__liaThreeDigitCalls += 1;
              const response = (window as any).__liaThreeDigitResponses.shift();
              if (typeof response !== 'string') {
                throw new Error('unexpected three-digit carry OCR crop');
              }
              return response;
            },
          };
          window.__LIA_CANVAS_OCR__.ocr = ocr;
          window.__LIA_CANVAS_OCR__.canvasPlusOcr = ocr;
        });
        await carryPair.locator('.lia-canvas-launch:visible').click();
        assert.equal(
          await carryPair.getAttribute('data-calculation-kind'),
          'column-addition',
        );
        const carryCanvas = carryPair.locator('canvas.lia-draw:visible');
        await carryCanvas.waitFor({ state: 'visible', timeout: 10_000 });
        const carryBox = await carryCanvas.boundingBox();
        assert.ok(carryBox, 'the three-digit carry canvas has no bounding box');
        await drawDesign(page, carryBox, threeDigitCarryAdditionStrokes());
        await carryPair.locator('.lia-canvasplus-submit:visible').click();
        await page.waitForFunction(
          pairSelector => {
            const pair = document.querySelector(pairSelector) as HTMLElement | null;
            if (pair?.dataset.ocrError) return true;
            const output = pair?.querySelector('.lia-canvasplus-output') as HTMLElement | null;
            return output?.dataset.state === 'ready' &&
              output.dataset.lineCount === '4' &&
              String(output.dataset.latex || '').includes('\\hline');
          },
          selector,
          { timeout: 15_000 },
        );
        const carryError = await carryPair.getAttribute('data-ocr-error');
        assert.equal(carryError, null, carryError || 'three-digit carry OCR failed');

        const carryOutput = carryPair.locator('.lia-canvasplus-output');
        const carryLatex = String(await carryOutput.getAttribute('data-latex') || '');
        assert.equal(await carryOutput.locator('.lia-canvasplus-transition').count(), 0);
        assert.equal((carryLatex.match(/\\textcolor\{red\}\{1\}/gu) || []).length, 1);
        assert.match(
          carryLatex,
          /\\mathclap\{\\textcolor\{red\}\{1\}\}\\hspace\{0\.25em\}(?:\\hspace\{0\.5em\}){2}\s*\\\\\s*\\hline/u,
          'the single carry must occupy the leftmost digit cell before the rule',
        );
        const carryAnswer = await answerBeforePair(page, selector);
        const carryDecoded = JSON.parse(carryAnswer);
        assert.deepEqual(carryDecoded.operands, ['372', '165']);
        assert.equal(carryDecoded.result, '537');
        assert.deepEqual(carryDecoded.carries, [null, null, '1']);
        const carryRow = carryDecoded.layout.rows.find(
          (row: any) => row?.role === 'carries',
        );
        assert.deepEqual(carryRow?.cells, ['1', null, null]);
        assert.equal(await page.evaluate(() => (window as any).__liaThreeDigitCalls), 3);
        await checkNativeQuiz(page, selector);
        assert.equal(await answerBeforePair(page, selector), carryAnswer);
        assert.equal(await carryOutput.count(), 1, 'three-digit preview must survive Check');

        // The third page protects the existing variable-equation mode.
        await page.evaluate(() => {
          if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
        });
        await page.keyboard.press('ArrowRight');
        await page.waitForFunction(
          pairSelector => {
            const pair = document.querySelector(pairSelector) as HTMLElement | null;
            return location.hash === '#3' &&
              document.querySelectorAll(pairSelector).length === 1 &&
              pair?.dataset.calculationPrompt === '3x-5=7';
          },
          selector,
          { timeout: 10_000 },
        );
        const equationPair = page.locator(selector);
        await page.evaluate(() => {
          (window as any).__liaEquationCalls = 0;
          const ocr = {
            model: 'unchanged-equation-stub',
            precision: 'fp32',
            task: 'image-to-text',
            cacheKey: 'unchanged-equation-v1',
            outputKind: 'latex',
            inputProfile: 'formulanet-line-384',
            calculationSinglePass: true,
            ensureLoaded: async () => true,
            recognize: async () => {
              (window as any).__liaEquationCalls += 1;
              return '3x-5=7';
            },
          };
          window.__LIA_CANVAS_OCR__.ocr = ocr;
          window.__LIA_CANVAS_OCR__.canvasPlusOcr = ocr;
        });
        await equationPair.locator('.lia-canvas-launch:visible').click();
        assert.equal(
          await equationPair.getAttribute('data-calculation-kind'),
          'equation',
          'a variable equation must remain in equation-path mode',
        );
        const equationCanvas = equationPair.locator('canvas.lia-draw:visible');
        await equationCanvas.waitFor({ state: 'visible', timeout: 10_000 });
        const equationBox = await equationCanvas.boundingBox();
        assert.ok(equationBox);
        await drawDesign(page, equationBox, [
          [[140, 150], [175, 205]],
          [[175, 150], [140, 205]],
          [[195, 178], [225, 178]],
          ...digitStrokes('5', 240, 150),
          [[280, 170], [312, 170]],
          [[280, 188], [312, 188]],
          ...digitStrokes('7', 328, 150),
        ]);
        await equationPair.locator('.lia-canvasplus-submit:visible').click();
        await page.waitForFunction(
          pairSelector => {
            const output = document.querySelector(
              pairSelector + ' .lia-canvasplus-output',
            ) as HTMLElement | null;
            return output?.dataset.state === 'ready' && output.dataset.lineCount === '1';
          },
          selector,
          { timeout: 10_000 },
        );

        const equationOutput = equationPair.locator('.lia-canvasplus-output');
        assert.equal(await equationOutput.locator('.lia-canvasplus-line').count(), 1);
        assert.equal(await equationOutput.locator('.lia-canvasplus-transition').count(), 0);
        assert.doesNotMatch(
          String(await equationOutput.getAttribute('data-latex')),
          /\\hline/u,
        );
        assert.deepEqual(JSON.parse(await answerBeforePair(page, selector)), ['3x-5=7']);
        assert.equal(await page.evaluate(() => (window as any).__liaEquationCalls), 1);

        const diagnostics = await snapshotDiagnostics(page);
        assertSyntheticDelivery(harness, COLUMN_ADDITION_COURSE_URL);
        assert.deepEqual(harness.modelRequests, []);
        assertNoRuntimeErrors(harness, diagnostics);
      } finally {
        await harness.context.close();
        await browser.close();
      }
    },
  );

  test(
    'current chromium smoke: ordinary plus OCR keeps priority over the plus-minus alias',
    { timeout: 90_000 },
    async t => {
      const requested = new Set(
        (process.env.LIA_BROWSER_PROJECTS ?? 'chromium,firefox,webkit')
          .split(',')
          .map(value => value.trim().toLowerCase())
          .filter(Boolean),
      );
      if (!requested.has('chromium')) {
        t.skip('excluded by LIA_BROWSER_PROJECTS');
        return;
      }

      const browser = await chromium.launch({ headless: true });
      const harness = await createHarness(browser, { withAlgebrite: false });
      const selector =
        '.lia-canvas-pair[data-canvas-mode=plus][data-canvas-output=answer]';
      try {
        await harness.page.setViewportSize({ width: 1920, height: 1100 });
        await openCourse(
          harness,
          REAL_COLUMN_ADDITION_COURSE_URL,
          selector + ' .lia-canvas-launch',
        );
        const page = harness.page;
        const pair = page.locator(selector);
        const bundleMarkers = await page.evaluate(async bundleUrl => {
          const response = await fetch(bundleUrl, { cache: 'no-store' });
          const source = await response.text();
          return {
            ok: response.ok,
            layoutVersion: source.match(/lines-v\d+-[a-z0-9-]+/u)?.[0] || '',
            hasExactNormalizer: source.includes('normalizeOcrColumnDigitsExact'),
          };
        }, BUNDLE_URL);
        await page.evaluate(() => {
          const answers = document.querySelector('.lia-quiz__answers') as HTMLElement | null;
          if (!answers) throw new Error('Native quiz answers container not found.');
          answers.style.width = '1200px';
          answers.style.maxWidth = 'none';

          (window as any).katex = {
            render(
              tex: string,
              target: HTMLElement,
              options: Record<string, any> = {},
            ) {
              target.replaceChildren();
              const katex = document.createElement('span');
              katex.className = 'katex';
              const html = document.createElement('span');
              html.className = 'katex-html';
              html.style.display = 'inline-block';
              html.style.width = options.displayMode === true ? '1000px' : '148px';
              html.textContent = 'rendered';
              const carryCount = (tex.match(/\\textcolor\{red\}\{1\}/gu) || []).length;
              for (let index = 0; index < carryCount; index += 1) {
                const carry = document.createElement('span');
                carry.className = 'test-rendered-carry';
                carry.style.color = 'red';
                carry.textContent = '1';
                html.appendChild(carry);
              }
              katex.appendChild(html);
              target.appendChild(katex);
              target.setAttribute('data-rendered-tex', tex);
            },
          };

          (window as any).__liaStandardPlusResponses = [
            '4728',
            '+ 3 5 9 6',
            '8324',
          ];
          (window as any).__liaStandardPlusCalls = [];
          const ocr = {
            model: 'column-addition-standard-plus-stub',
            precision: 'fp32',
            task: 'image-to-text',
            cacheKey: 'column-addition-standard-plus-v1',
            outputKind: 'latex',
            inputProfile: 'formulanet-line-384',
            calculationSinglePass: true,
            ensureLoaded: async () => true,
            recognize: async (
              input: HTMLCanvasElement,
              options: Record<string, any> = {},
            ) => {
              const context = input.getContext('2d', { willReadFrequently: true });
              if (!context) throw new Error('column crop has no 2D context');
              const image = context.getImageData(0, 0, input.width, input.height);
              let x0 = input.width;
              let y0 = input.height;
              let x1 = -1;
              let y1 = -1;
              for (let y = 0; y < input.height; y += 1) {
                for (let x = 0; x < input.width; x += 1) {
                  const offset = (y * input.width + x) * 4;
                  const alpha = image.data[offset + 3] / 255;
                  const luminance = image.data[offset] * 0.299 +
                    image.data[offset + 1] * 0.587 + image.data[offset + 2] * 0.114;
                  if (255 - alpha * (255 - luminance) >= 245) continue;
                  x0 = Math.min(x0, x);
                  y0 = Math.min(y0, y);
                  x1 = Math.max(x1, x);
                  y1 = Math.max(y1, y);
                }
              }
              const response = (window as any).__liaStandardPlusResponses.shift();
              (window as any).__liaStandardPlusCalls.push({
                raw: response,
                width: input.width,
                height: input.height,
                inkX0: x1 >= x0 ? x0 : -1,
                inkY0: y1 >= y0 ? y0 : -1,
                inkWidth: x1 >= x0 ? x1 - x0 + 1 : 0,
                inkHeight: y1 >= y0 ? y1 - y0 + 1 : 0,
                maxNewTokens: Number(options.max_new_tokens) || 0,
              });
              if (typeof response !== 'string') {
                throw new Error('Unexpected operatorless retry after ordinary plus OCR.');
              }
              return response;
            },
          };
          window.__LIA_CANVAS_OCR__.ocr = ocr;
          window.__LIA_CANVAS_OCR__.canvasPlusOcr = ocr;
        });

        await pair.locator('.lia-canvas-launch:visible').click();
        const canvas = pair.locator('canvas.lia-draw:visible');
        await canvas.waitFor({ state: 'visible', timeout: 10_000 });
        const box = await canvas.boundingBox();
        assert.ok(box);
        await drawDesign(page, box, screenshotAdditionStrokes());
        await pair.locator('.lia-canvasplus-submit:visible').click();
        await page.waitForFunction(
          pairSelector => {
            const pair = document.querySelector(pairSelector) as HTMLElement | null;
            const output = pair?.querySelector('.lia-canvasplus-output') as HTMLElement | null;
            return Boolean(
              pair?.dataset.ocrError ||
              output?.dataset.state === 'error' ||
              output?.dataset.state === 'ready' &&
                String(output.dataset.latex || '').includes('\\hline')
            );
          },
          selector,
          { timeout: 15_000 },
        );

        const answer = await answerBeforePair(page, selector);
        const result = await pair.evaluate((element, submittedAnswer) => {
          const output = element.querySelector('.lia-canvasplus-output') as HTMLElement | null;
          const registry = window.__LIA_CANVAS_OCR__ as any;
          return {
            state: output?.dataset.state || '',
            latex: output?.dataset.latex || '',
            ocrError: (element as HTMLElement).dataset.ocrError || '',
            calls: (window as any).__liaStandardPlusCalls,
            remaining: (window as any).__liaStandardPlusResponses.length,
            operatorlessRetry: registry.canvasPlusOcr?.lastOperatorlessRetry ?? null,
            grade: registry.checkCalculationAnswer('4728+3596', submittedAnswer),
          };
        }, answer);

        t.diagnostic(JSON.stringify({
          bundleMarkers,
          selectionAndRawRecognitionOrder: result.calls,
          ocrError: result.ocrError,
          answer,
          grade: result.grade,
        }));

        assert.deepEqual(bundleMarkers, {
          ok: true,
          layoutVersion: 'lines-v20-deep-hook-carries',
          hasExactNormalizer: true,
        });
        assert.equal(result.state, 'ready');
        assert.equal(result.ocrError, '');
        assert.deepEqual(result.calls.map((call: any) => call.raw), [
          '4728', '+ 3 5 9 6', '8324',
        ]);
        assert.deepEqual(result.calls.map((call: any) => call.maxNewTokens), [64, 64, 64]);
        assert.ok(result.calls.every((call: any) => call.inkWidth > 0 && call.inkHeight > 0));
        assert.equal(result.remaining, 0);
        assert.equal(result.operatorlessRetry, null);
        assert.equal((result.latex.match(/\\textcolor\{red\}\{1\}/gu) || []).length, 3);
        const submission = JSON.parse(answer);
        assert.deepEqual(submission.operands, ['4728', '3596']);
        assert.equal(submission.result, '8324');
        assert.deepEqual(submission.carries, [null, '1', '1', '1']);
        assert.equal(result.grade?.accepted, true);
        assert.equal(result.grade?.outcome, 'correct');
        assert.equal(result.grade?.status, 'correct');

        await page.waitForFunction(() => {
          const preview = document.querySelector('.lia-tex-preview') as HTMLElement | null;
          if (preview?.dataset.on !== '1' || preview.dataset.multiline !== '1') return false;
          const width = preview.getBoundingClientRect().width || 0;
          return width >= 80 && width < 400;
        });
        const preview = page.locator('.lia-tex-preview').first();
        const previewBounds = await preview.boundingBox();
        const answersBounds = await page.locator('.lia-quiz__answers').boundingBox();
        assert.ok(previewBounds);
        assert.ok(answersBounds);
        assert.ok(previewBounds.width < answersBounds.width * 0.4);
        assert.ok(previewBounds.x < answersBounds.x + answersBounds.width / 2);
        assert.equal(await preview.locator('.test-rendered-carry').count(), 3);

        await checkNativeQuiz(page, selector);
        assert.equal(await answerBeforePair(page, selector), answer);
        const diagnostics = await snapshotDiagnostics(page);
        assertSyntheticDelivery(harness, REAL_COLUMN_ADDITION_COURSE_URL);
        assert.deepEqual(harness.modelRequests, []);
        assertNoRuntimeErrors(harness, diagnostics);
      } finally {
        await harness.context.close();
        await browser.close();
      }
    },
  );

  test(
    'current chromium smoke: plus-minus OCR normalizes as the written addition operator',
    { timeout: 90_000 },
    async t => {
      const requested = new Set(
        (process.env.LIA_BROWSER_PROJECTS ?? 'chromium,firefox,webkit')
          .split(',')
          .map(value => value.trim().toLowerCase())
          .filter(Boolean),
      );
      if (!requested.has('chromium')) {
        t.skip('excluded by LIA_BROWSER_PROJECTS');
        return;
      }

      const browser = await chromium.launch({ headless: true });
      const harness = await createHarness(browser, { withAlgebrite: false });
      const selector =
        '.lia-canvas-pair[data-canvas-mode=plus][data-canvas-output=answer]';
      try {
        await harness.page.setViewportSize({ width: 1920, height: 1100 });
        await openCourse(
          harness,
          REAL_COLUMN_ADDITION_COURSE_URL,
          selector + ' .lia-canvas-launch',
        );
        const page = harness.page;
        const pair = page.locator(selector);
        await page.evaluate(() => {
          const answers = document.querySelector('.lia-quiz__answers') as HTMLElement | null;
          if (!answers) throw new Error('Native quiz answers container not found.');
          answers.style.width = '1200px';
          answers.style.maxWidth = 'none';

          (window as any).katex = {
            render(
              tex: string,
              target: HTMLElement,
              options: Record<string, any> = {},
            ) {
              target.replaceChildren();
              const katex = document.createElement('span');
              katex.className = 'katex';
              const html = document.createElement('span');
              html.className = 'katex-html';
              html.style.display = 'inline-block';
              html.style.width = options.displayMode === true ? '1000px' : '148px';
              html.textContent = 'rendered';
              const carryCount = (tex.match(/\\textcolor\{red\}\{1\}/gu) || []).length;
              for (let index = 0; index < carryCount; index += 1) {
                const carry = document.createElement('span');
                carry.className = 'test-rendered-carry';
                carry.style.color = 'red';
                carry.textContent = '1';
                html.appendChild(carry);
              }
              katex.appendChild(html);
              target.appendChild(katex);
              target.setAttribute('data-rendered-tex', tex);
            },
          };

          (window as any).__liaPmResponses = [
            '4728',
            '\\pm 3 5 9 6',
            '8324',
          ];
          (window as any).__liaPmCalls = 0;
          const ocr = {
            model: 'column-addition-plus-minus-stub',
            precision: 'fp32',
            task: 'image-to-text',
            cacheKey: 'column-addition-plus-minus-v1',
            outputKind: 'latex',
            inputProfile: 'formulanet-line-384',
            calculationSinglePass: true,
            ensureLoaded: async () => true,
            recognize: async () => {
              (window as any).__liaPmCalls += 1;
              const response = (window as any).__liaPmResponses.shift();
              if (typeof response !== 'string') {
                throw new Error('Unexpected operatorless retry after plus-minus OCR.');
              }
              return response;
            },
          };
          window.__LIA_CANVAS_OCR__.ocr = ocr;
          window.__LIA_CANVAS_OCR__.canvasPlusOcr = ocr;
        });

        await pair.locator('.lia-canvas-launch:visible').click();
        assert.equal(await pair.getAttribute('data-calculation-kind'), 'column-addition');
        const canvas = pair.locator('canvas.lia-draw:visible');
        await canvas.waitFor({ state: 'visible', timeout: 10_000 });
        const box = await canvas.boundingBox();
        assert.ok(box);
        await drawDesign(page, box, screenshotAdditionStrokes());
        await pair.locator('.lia-canvasplus-submit:visible').click();
        await page.waitForFunction(
          pairSelector => {
            const pair = document.querySelector(pairSelector) as HTMLElement | null;
            const output = pair?.querySelector('.lia-canvasplus-output') as HTMLElement | null;
            return Boolean(
              pair?.dataset.ocrError ||
              output?.dataset.state === 'error' ||
              output?.dataset.state === 'ready' &&
                String(output.dataset.latex || '').includes('\\hline')
            );
          },
          selector,
          { timeout: 15_000 },
        );

        assert.equal(await pair.getAttribute('data-ocr-error'), null);
        const answer = await answerBeforePair(page, selector);
        const result = await pair.evaluate((element, submittedAnswer) => {
          const output = element.querySelector('.lia-canvasplus-output') as HTMLElement | null;
          const registry = window.__LIA_CANVAS_OCR__ as any;
          return {
            state: output?.dataset.state || '',
            latex: output?.dataset.latex || '',
            kind: (element as HTMLElement).dataset.calculationKind || '',
            calls: (window as any).__liaPmCalls,
            remaining: (window as any).__liaPmResponses.length,
            operatorlessRetry: registry.canvasPlusOcr?.lastOperatorlessRetry ?? null,
            grade: registry.checkCalculationAnswer('4728+3596', submittedAnswer),
          };
        }, answer);

        assert.equal(result.state, 'ready');
        assert.equal(result.kind, 'column-addition');
        assert.equal(result.calls, 3, 'the plus-minus row must not trigger an OCR retry');
        assert.equal(result.remaining, 0);
        assert.equal(result.operatorlessRetry, null);
        assert.equal((result.latex.match(/\\textcolor\{red\}\{1\}/gu) || []).length, 3);
        const submission = JSON.parse(answer);
        assert.deepEqual(submission.operands, ['4728', '3596']);
        assert.equal(submission.result, '8324');
        assert.deepEqual(submission.carries, [null, '1', '1', '1']);
        assert.equal(result.grade?.accepted, true);
        assert.equal(result.grade?.outcome, 'correct');
        assert.equal(result.grade?.status, 'correct');

        await page.waitForFunction(() => {
          const preview = document.querySelector('.lia-tex-preview') as HTMLElement | null;
          if (preview?.dataset.on !== '1' || preview.dataset.multiline !== '1') return false;
          const width = preview.getBoundingClientRect().width || 0;
          return width >= 80 && width < 400;
        });
        const preview = page.locator('.lia-tex-preview').first();
        const previewBounds = await preview.boundingBox();
        const answersBounds = await page.locator('.lia-quiz__answers').boundingBox();
        assert.ok(previewBounds);
        assert.ok(answersBounds);
        assert.ok(previewBounds.width < answersBounds.width * 0.4);
        assert.ok(previewBounds.x < answersBounds.x + answersBounds.width / 2);
        assert.equal(await preview.locator('.test-rendered-carry').count(), 3);

        await checkNativeQuiz(page, selector);
        assert.equal(await answerBeforePair(page, selector), answer);
        const diagnostics = await snapshotDiagnostics(page);
        assertSyntheticDelivery(harness, REAL_COLUMN_ADDITION_COURSE_URL);
        assert.deepEqual(harness.modelRequests, []);
        assertNoRuntimeErrors(harness, diagnostics);
      } finally {
        await harness.context.close();
        await browser.close();
      }
    },
  );

  test(
    'current chromium smoke: a visible unmasked carry row keeps every operand and grades correctly',
    { timeout: 120_000 },
    async t => {
      const requested = new Set(
        (process.env.LIA_BROWSER_PROJECTS ?? 'chromium,firefox,webkit')
          .split(',')
          .map(value => value.trim().toLowerCase())
          .filter(Boolean),
      );
      if (!requested.has('chromium')) {
        t.skip('excluded by LIA_BROWSER_PROJECTS');
        return;
      }

      const browser = await chromium.launch({ headless: true });
      const harness = await createHarness(browser, { withAlgebrite: false });
      const selector =
        '.lia-canvas-pair[data-canvas-mode=plus][data-canvas-output=answer]';
      try {
        await harness.page.setViewportSize({ width: 1920, height: 1100 });
        await openCourse(
          harness,
          REAL_COLUMN_ADDITION_COURSE_URL,
          selector + ' .lia-canvas-launch',
        );
        const page = harness.page;
        const pair = page.locator(selector);
        await installCarryPreviewStub(page);
        await installColumnPolicyOcrStub(
          page,
          ['4728', '+ 3 5 9 6', '1 1 1 1', '8324'],
          'column-addition-visible-carry-row-stub',
        );

        await pair.locator('.lia-canvas-launch:visible').click();
        const canvas = pair.locator('canvas.lia-draw:visible');
        await canvas.waitFor({ state: 'visible', timeout: 10_000 });
        const box = await canvas.boundingBox();
        assert.ok(box);
        await drawDesign(page, box, ambiguousVisibleCarryRowAdditionStrokes());
        await pair.locator('.lia-canvasplus-submit:visible').click();
        await page.waitForFunction(
          pairSelector => {
            const pair = document.querySelector(pairSelector) as HTMLElement | null;
            const output = pair?.querySelector('.lia-canvasplus-output') as HTMLElement | null;
            return !pair?.dataset.ocrError && output?.dataset.state === 'ready' &&
              output.dataset.previewMode === 'structured' &&
              String(output.dataset.latex || '').includes('\\hline');
          },
          selector,
          { timeout: 15_000 },
        );

        const answer = await answerBeforePair(page, selector);
        assert.ok(answer, 'a structured carry preview must populate the native answer');
        const result = await pair.evaluate((element, submittedAnswer) => {
          const output = element.querySelector('.lia-canvasplus-output') as HTMLElement | null;
          const registry = window.__LIA_CANVAS_OCR__ as any;
          return {
            calls: (window as any).__liaColumnPolicyCalls,
            remaining: (window as any).__liaColumnPolicyResponses.length,
            latex: output?.dataset.latex || '',
            mapping: registry.canvasPlusOcr?.lastColumnCarryMapping || null,
            grade: registry.checkCalculationAnswer('4728+3596', submittedAnswer),
          };
        }, answer);
        assert.equal(result.calls, 4, 'every visible stack row must reach OCR exactly once');
        assert.equal(result.remaining, 0);
        assert.equal(result.mapping?.hints?.length, 0);
        assert.equal(result.mapping?.observedCarryRow?.rawText, '1111');
        assert.equal(result.mapping?.observedCarryRow?.text, '111');
        assert.deepEqual(result.mapping?.carries, [null, '1', '1', '1']);
        assert.match(result.latex, /\\hline/u);
        assert.equal((result.latex.match(/\\textcolor\{red\}\{1\}/gu) || []).length, 3);
        const submission = JSON.parse(answer);
        assert.deepEqual(submission.operands, ['4728', '3596']);
        assert.equal(submission.result, '8324');
        assert.deepEqual(submission.carries, [null, '1', '1', '1']);
        assert.equal(result.grade?.accepted, true);
        assert.equal(result.grade?.outcome, 'correct');

        await page.waitForFunction(() =>
          document.querySelectorAll('.lia-tex-preview .test-rendered-carry').length === 3,
        );
        assert.equal(
          await page.locator('.lia-tex-preview').first()
            .locator('.test-rendered-carry:visible').count(),
          3,
        );
        await checkNativeQuiz(page, selector);
        const postCheckLatex = await pair.locator('.lia-canvasplus-output')
          .getAttribute('data-latex') || '';
        assert.equal(
          (postCheckLatex.match(/\\textcolor\{red\}\{1\}/gu) || []).length,
          3,
        );
        assert.equal(
          await page.locator('.lia-tex-preview').first()
            .locator('.test-rendered-carry:visible').count(),
          3,
        );
        assert.equal(await answerBeforePair(page, selector), answer);

        const diagnostics = await snapshotDiagnostics(page);
        assertSyntheticDelivery(harness, REAL_COLUMN_ADDITION_COURSE_URL);
        assert.deepEqual(harness.modelRequests, []);
        assertNoRuntimeErrors(harness, diagnostics);
      } finally {
        await harness.context.close();
        await browser.close();
      }
    },
  );

  test(
    'current chromium smoke: large deep-hook carries remain visible and grade correctly',
    { timeout: 120_000 },
    async t => {
      const requested = new Set(
        (process.env.LIA_BROWSER_PROJECTS ?? 'chromium,firefox,webkit')
          .split(',')
          .map(value => value.trim().toLowerCase())
          .filter(Boolean),
      );
      if (!requested.has('chromium')) {
        t.skip('excluded by LIA_BROWSER_PROJECTS');
        return;
      }

      const browser = await chromium.launch({ headless: true });
      const harness = await createHarness(browser, { withAlgebrite: false });
      const selector =
        '.lia-canvas-pair[data-canvas-mode=plus][data-canvas-output=answer]';
      try {
        await harness.page.setViewportSize({ width: 1920, height: 1100 });
        await openCourse(
          harness,
          REAL_COLUMN_ADDITION_COURSE_URL,
          selector + ' .lia-canvas-launch',
        );
        const page = harness.page;
        const pair = page.locator(selector);
        await installCarryPreviewStub(page);
        await installColumnPolicyOcrStub(
          page,
          ['4728', '+ 3 5 9 6', '8324'],
          'column-addition-large-deep-carry-stub',
        );

        await pair.locator('.lia-canvas-launch:visible').click();
        const canvas = pair.locator('canvas.lia-draw:visible');
        await canvas.waitFor({ state: 'visible', timeout: 10_000 });
        const box = await canvas.boundingBox();
        assert.ok(box);
        await drawDesign(page, box, largeDeepCarryAdditionStrokes());
        await pair.locator('.lia-canvasplus-submit:visible').click();
        await page.waitForFunction(
          pairSelector => {
            const pair = document.querySelector(pairSelector) as HTMLElement | null;
            const output = pair?.querySelector('.lia-canvasplus-output') as HTMLElement | null;
            return !pair?.dataset.ocrError && output?.dataset.state === 'ready' &&
              output.dataset.previewMode === 'structured' &&
              String(output.dataset.latex || '').includes('\\hline');
          },
          selector,
          { timeout: 15_000 },
        );

        const answer = await answerBeforePair(page, selector);
        const result = await pair.evaluate((element, submittedAnswer) => {
          const output = element.querySelector('.lia-canvasplus-output') as HTMLElement | null;
          const registry = window.__LIA_CANVAS_OCR__ as any;
          return {
            calls: (window as any).__liaColumnPolicyCalls,
            remaining: (window as any).__liaColumnPolicyResponses.length,
            latex: output?.dataset.latex || '',
            mapping: registry.canvasPlusOcr?.lastColumnCarryMapping || null,
            grade: registry.checkCalculationAnswer('4728+3596', submittedAnswer),
          };
        }, answer);
        assert.equal(result.calls, 3);
        assert.equal(result.remaining, 0);
        assert.equal(result.mapping?.hints?.length, 3);
        assert.deepEqual(result.mapping?.carries, [null, '1', '1', '1']);
        assert.equal((result.latex.match(/\\textcolor\{red\}\{1\}/gu) || []).length, 3);
        const submission = JSON.parse(answer);
        assert.deepEqual(submission.operands, ['4728', '3596']);
        assert.equal(submission.result, '8324');
        assert.deepEqual(submission.carries, [null, '1', '1', '1']);
        assert.equal(result.grade?.accepted, true);
        assert.equal(result.grade?.outcome, 'correct');

        await page.waitForFunction(() => {
          const preview = document.querySelector('.lia-tex-preview') as HTMLElement | null;
          return preview?.dataset.on === '1' &&
            preview.querySelectorAll('.test-rendered-carry').length === 3;
        });
        assert.equal(
          await page.locator('.lia-tex-preview').first()
            .locator('.test-rendered-carry:visible').count(),
          3,
        );
        await checkNativeQuiz(page, selector);
        assert.equal(await answerBeforePair(page, selector), answer);
        assert.equal(
          await page.locator('.lia-tex-preview').first()
            .locator('.test-rendered-carry:visible').count(),
          3,
        );

        const diagnostics = await snapshotDiagnostics(page);
        assertSyntheticDelivery(harness, REAL_COLUMN_ADDITION_COURSE_URL);
        assert.deepEqual(harness.modelRequests, []);
        assertNoRuntimeErrors(harness, diagnostics);
      } finally {
        await harness.context.close();
        await browser.close();
      }
    },
  );

  test(
    'current chromium smoke: native answer survives edits and a new render clears stale feedback',
    { timeout: 120_000 },
    async t => {
      const requested = new Set(
        (process.env.LIA_BROWSER_PROJECTS ?? 'chromium,firefox,webkit')
          .split(',')
          .map(value => value.trim().toLowerCase())
          .filter(Boolean),
      );
      if (!requested.has('chromium')) {
        t.skip('excluded by LIA_BROWSER_PROJECTS');
        return;
      }

      const browser = await chromium.launch({ headless: true });
      const harness = await createHarness(browser, { withAlgebrite: false });
      const selector =
        '.lia-canvas-pair[data-canvas-mode=plus][data-canvas-output=answer]';
      try {
        await harness.page.setViewportSize({ width: 1920, height: 1100 });
        await openCourse(
          harness,
          REAL_COLUMN_ADDITION_COURSE_URL,
          selector + ' .lia-canvas-launch',
        );
        const page = harness.page;
        const pair = page.locator(selector);
        await installCarryPreviewStub(page);
        await installColumnPolicyOcrStub(
          page,
          ['4728', '+ 3 5 9 6', '8324'],
          'column-addition-stale-structured-stub',
        );

        await pair.locator('.lia-canvas-launch:visible').click();
        const canvas = pair.locator('canvas.lia-draw:visible');
        await canvas.waitFor({ state: 'visible', timeout: 10_000 });
        const box = await canvas.boundingBox();
        assert.ok(box);
        await drawDesign(page, box, screenshotAdditionStrokes());
        await pair.locator('.lia-canvasplus-submit:visible').click();
        await page.waitForFunction(
          pairSelector => (document.querySelector(
            pairSelector + ' .lia-canvasplus-output',
          ) as HTMLElement | null)?.dataset.previewMode === 'structured',
          selector,
          { timeout: 15_000 },
        );
        const structuredAnswer = await answerBeforePair(page, selector);
        assert.deepEqual(JSON.parse(structuredAnswer).carries, [null, '1', '1', '1']);

        await drawPolyline(page, [
          { x: box.x + box.width - 48, y: box.y + box.height - 42 },
          { x: box.x + box.width - 28, y: box.y + box.height - 24 },
        ]);
        await page.waitForFunction(
          pairSelector => (document.querySelector(
            pairSelector + ' .lia-canvasplus-output',
          ) as HTMLElement | null)?.dataset.stale === '1',
          selector,
          { timeout: 5_000 },
        );
        assert.equal(await answerBeforePair(page, selector), structuredAnswer);

        await pair.locator('.lia-eraser-btn:visible').click();
        await pair.locator('.lia-tool-menu [data-act=clear]:visible').click();
        await page.waitForFunction(
          pairSelector => Boolean((document.querySelector(
            pairSelector + ' .lia-canvasplus-output',
          ) as HTMLElement | null)?.hidden),
          selector,
          { timeout: 5_000 },
        );
        assert.equal(await answerBeforePair(page, selector), structuredAnswer);

        await installColumnPolicyOcrStub(
          page,
          ['4728', '+ 3 5 9 6', '8324'],
          'column-addition-zero-carry-draft-stub',
        );
        await pair.evaluate(element => {
          (window as any).__liaZeroCarryAnswerEvents = [];
          element.addEventListener('lia:canvasplus-answer', event => {
            (window as any).__liaZeroCarryAnswerEvents.push(
              (event as CustomEvent).detail,
            );
          });
        });
        await pair.locator('.lia-color-btn:visible').click();
        await pair.locator('.lia-tool-menu [data-act=close]:visible').click();
        await drawDesign(page, box, screenshotAdditionWithoutCarryStrokes());
        await pair.locator('.lia-canvasplus-submit:visible').click();
        await page.waitForFunction(
          pairSelector => {
            const pair = document.querySelector(pairSelector) as HTMLElement | null;
            const output = pair?.querySelector('.lia-canvasplus-output') as HTMLElement | null;
            return !pair?.dataset.ocrError && output?.dataset.state === 'ready' &&
              output.dataset.previewMode === 'structured';
          },
          selector,
          { timeout: 15_000 },
        );

        const output = pair.locator('.lia-canvasplus-output');
        const zeroCarryState = await pair.evaluate(element => {
          const output = element.querySelector('.lia-canvasplus-output') as HTMLElement | null;
          const registry = window.__LIA_CANVAS_OCR__ as any;
          return {
            calls: (window as any).__liaColumnPolicyCalls,
            remaining: (window as any).__liaColumnPolicyResponses.length,
            latex: output?.dataset.latex || '',
            mapping: registry.canvasPlusOcr?.lastColumnCarryMapping || null,
          };
        });
        assert.equal(zeroCarryState.calls, 3);
        assert.equal(zeroCarryState.remaining, 0);
        assert.equal(zeroCarryState.mapping?.hints?.length, 0);
        assert.deepEqual(zeroCarryState.mapping?.carries, [null, null, null, null]);
        assert.equal((zeroCarryState.latex.match(/\\textcolor\{red\}\{1\}/gu) || []).length, 0);
        const missingCarryAnswer = await answerBeforePair(page, selector);
        assert.notEqual(missingCarryAnswer, structuredAnswer);
        const missingCarrySubmission = JSON.parse(missingCarryAnswer);
        assert.deepEqual(missingCarrySubmission.operands, ['4728', '3596']);
        assert.deepEqual(missingCarrySubmission.carries, [null, null, null, null]);
        assert.equal(missingCarrySubmission.result, '8324');
        const missingCarryLifecycle = await page.evaluate(submittedAnswer => {
          const events = (window as any).__liaZeroCarryAnswerEvents;
          const event = events[events.length - 1];
          return {
            applied: event?.applied,
            submissionValue: event?.submissionValue,
            grade: (window as any).__LIA_CANVAS_OCR__.checkCalculationAnswer(
              '4728+3596',
              submittedAnswer,
            ),
          };
        }, missingCarryAnswer);
        assert.equal(missingCarryLifecycle.applied, true);
        assert.equal(missingCarryLifecycle.submissionValue, missingCarryAnswer);
        assert.equal(missingCarryLifecycle.grade?.accepted, false);
        assert.equal(missingCarryLifecycle.grade?.outcome, 'incomplete');
        assert.equal(missingCarryLifecycle.grade?.reason, 'missing-carry');
        assert.equal(await output.getAttribute('data-preview-mode'), 'structured');
        await page.waitForTimeout(3_300);
        assert.equal(await answerBeforePair(page, selector), missingCarryAnswer);
        assert.equal(
          await page.locator('.lia-tex-preview').first()
            .locator('.test-rendered-carry:visible').count(),
          0,
        );

        await checkNativeQuizIncorrect(page, selector);
        assert.equal(
          await page.locator('.lia-quiz__feedback.text-error:visible').count(),
          1,
        );

        // A completed explicit render starts a new, unchecked attempt even
        // when its serialized value is unchanged. The previous trial remains
        // LiaScript state, but its feedback must no longer describe the newly
        // rendered work.
        await drawPolyline(page, [
          { x: box.x + box.width - 48, y: box.y + box.height - 42 },
          { x: box.x + box.width - 28, y: box.y + box.height - 24 },
        ]);
        await page.waitForFunction(
          pairSelector => (document.querySelector(
            pairSelector + ' .lia-canvasplus-output',
          ) as HTMLElement | null)?.dataset.stale === '1',
          selector,
          { timeout: 5_000 },
        );
        await pair.locator('.lia-undo-btn:visible').click();
        await pair.locator('.lia-canvasplus-submit:visible').click();
        await page.waitForFunction(
          pairSelector => {
            const pair = document.querySelector(pairSelector) as HTMLElement | null;
            const output = pair?.querySelector('.lia-canvasplus-output') as HTMLElement | null;
            return !pair?.dataset.ocrError && output?.dataset.state === 'ready' &&
              output.dataset.stale === '0';
          },
          selector,
          { timeout: 15_000 },
        );
        const pendingState = await pair.evaluate(element => {
          const quizzes = Array.from(document.querySelectorAll<HTMLElement>('.lia-quiz'));
          return {
            pairPending: (element as HTMLElement).dataset.nativeCheckPending || '',
            quizClasses: quizzes.map(quiz => quiz.className),
          };
        });
        assert.equal(
          pendingState.pairPending,
          '1',
          JSON.stringify(pendingState),
        );
        assert.ok(
          pendingState.quizClasses.some(classes =>
            classes.includes('lia-canvas-answer-pending-check')),
          JSON.stringify(pendingState),
        );
        assert.equal(await answerBeforePair(page, selector), missingCarryAnswer);
        assert.equal(
          await page.locator('.lia-quiz__feedback.text-error:visible').count(),
          0,
          'a completed render must hide feedback for the previously checked value',
        );
        await checkNativeQuizIncorrect(page, selector);
        assert.equal(
          await page.locator('.lia-quiz__feedback.text-error:visible').count(),
          1,
          'the next explicit Check must show feedback for the current value again',
        );

        const diagnostics = await snapshotDiagnostics(page);
        assertSyntheticDelivery(harness, REAL_COLUMN_ADDITION_COURSE_URL);
        assert.deepEqual(harness.modelRequests, []);
        assertNoRuntimeErrors(harness, diagnostics);
      } finally {
        await harness.context.close();
        await browser.close();
      }
    },
  );

  test(
    'current chromium smoke: a true no-carry task stays structured without invented marks',
    { timeout: 120_000 },
    async t => {
      const requested = new Set(
        (process.env.LIA_BROWSER_PROJECTS ?? 'chromium,firefox,webkit')
          .split(',')
          .map(value => value.trim().toLowerCase())
          .filter(Boolean),
      );
      if (!requested.has('chromium')) {
        t.skip('excluded by LIA_BROWSER_PROJECTS');
        return;
      }

      const browser = await chromium.launch({ headless: true });
      const harness = await createHarness(browser, { withAlgebrite: false });
      const selector =
        '.lia-canvas-pair[data-canvas-mode=plus][data-canvas-output=answer]';
      let courseRequests = 0;
      await harness.context.route(NO_CARRY_COLUMN_ADDITION_COURSE_URL, route => {
        courseRequests += 1;
        return route.fulfill({
          status: 200,
          contentType: 'text/plain; charset=utf-8',
          headers: {
            'access-control-allow-origin': '*',
            'cache-control': 'no-store',
          },
          body: NO_CARRY_COLUMN_ADDITION_COURSE,
        });
      });
      try {
        await harness.page.setViewportSize({ width: 1920, height: 1100 });
        await openCourse(
          harness,
          NO_CARRY_COLUMN_ADDITION_COURSE_URL,
          selector + ' .lia-canvas-launch',
        );
        const page = harness.page;
        const pair = page.locator(selector);
        await installCarryPreviewStub(page);
        await installColumnPolicyOcrStub(
          page,
          ['2415', '+ 1 2 1 3', '3628'],
          'column-addition-true-no-carry-stub',
        );

        await pair.locator('.lia-canvas-launch:visible').click();
        const canvas = pair.locator('canvas.lia-draw:visible');
        await canvas.waitFor({ state: 'visible', timeout: 10_000 });
        const box = await canvas.boundingBox();
        assert.ok(box);
        await drawDesign(page, box, screenshotAdditionWithoutCarryStrokes());
        await pair.locator('.lia-canvasplus-submit:visible').click();
        await page.waitForFunction(
          pairSelector => {
            const pair = document.querySelector(pairSelector) as HTMLElement | null;
            const output = pair?.querySelector('.lia-canvasplus-output') as HTMLElement | null;
            return !pair?.dataset.ocrError && output?.dataset.state === 'ready' &&
              output.dataset.previewMode === 'structured';
          },
          selector,
          { timeout: 15_000 },
        );

        const output = pair.locator('.lia-canvasplus-output');
        const answer = await answerBeforePair(page, selector);
        const submission = JSON.parse(answer);
        assert.deepEqual(submission.operands, ['2415', '1213']);
        assert.equal(submission.result, '3628');
        assert.deepEqual(submission.carries, [null, null, null, null]);
        assert.equal(
          (String(await output.getAttribute('data-latex') || '')
            .match(/\\textcolor\{red\}\{1\}/gu) || []).length,
          0,
        );
        assert.equal(
          await page.locator('.lia-tex-preview').first()
            .locator('.test-rendered-carry:visible').count(),
          0,
        );
        const result = await page.evaluate(submitted => {
          const registry = (window as any).__LIA_CANVAS_OCR__;
          return {
            calls: (window as any).__liaColumnPolicyCalls,
            mapping: registry.canvasPlusOcr?.lastColumnCarryMapping || null,
            grade: registry.checkCalculationAnswer('2415+1213', submitted),
          };
        }, answer);
        assert.equal(result.calls, 3);
        assert.equal(result.mapping?.hints?.length, 0);
        assert.deepEqual(result.mapping?.carries, [null, null, null, null]);
        assert.equal(result.grade?.accepted, true);
        assert.equal(result.grade?.outcome, 'correct');
        await checkNativeQuiz(page, selector);
        assert.equal(await answerBeforePair(page, selector), answer);
        assert.ok(courseRequests >= 1);

        const diagnostics = await snapshotDiagnostics(page);
        assert.deepEqual(harness.modelRequests, []);
        assertNoRuntimeErrors(harness, diagnostics);
      } finally {
        await harness.context.close();
        await browser.close();
      }
    },
  );

  test(
    'current chromium smoke: three summands remain three operand rows and grade correctly',
    { timeout: 120_000 },
    async t => {
      const requested = new Set(
        (process.env.LIA_BROWSER_PROJECTS ?? 'chromium,firefox,webkit')
          .split(',')
          .map(value => value.trim().toLowerCase())
          .filter(Boolean),
      );
      if (!requested.has('chromium')) {
        t.skip('excluded by LIA_BROWSER_PROJECTS');
        return;
      }

      const browser = await chromium.launch({ headless: true });
      const harness = await createHarness(browser, { withAlgebrite: false });
      const selector =
        '.lia-canvas-pair[data-canvas-mode=plus][data-canvas-output=answer]';
      let courseRequests = 0;
      await harness.context.route(THREE_SUMMAND_COLUMN_ADDITION_COURSE_URL, route => {
        courseRequests += 1;
        return route.fulfill({
          status: 200,
          contentType: 'text/plain; charset=utf-8',
          headers: {
            'access-control-allow-origin': '*',
            'cache-control': 'no-store',
          },
          body: THREE_SUMMAND_COLUMN_ADDITION_COURSE,
        });
      });
      try {
        await harness.page.setViewportSize({ width: 1920, height: 1100 });
        await openCourse(
          harness,
          THREE_SUMMAND_COLUMN_ADDITION_COURSE_URL,
          selector + ' .lia-canvas-launch',
        );
        const page = harness.page;
        const pair = page.locator(selector);
        await installCarryPreviewStub(page);
        await installColumnPolicyOcrStub(
          page,
          ['1111', '+ 2 2 2 2', '+ 3 3 3 3', '6666'],
          'column-addition-three-summand-stub',
        );

        await pair.locator('.lia-canvas-launch:visible').click();
        const canvas = pair.locator('canvas.lia-draw:visible');
        await canvas.waitFor({ state: 'visible', timeout: 10_000 });
        const box = await canvas.boundingBox();
        assert.ok(box);
        await drawDesign(page, box, threeSummandAdditionStrokes());
        await pair.locator('.lia-canvasplus-submit:visible').click();
        await page.waitForFunction(
          pairSelector => {
            const pair = document.querySelector(pairSelector) as HTMLElement | null;
            const output = pair?.querySelector('.lia-canvasplus-output') as HTMLElement | null;
            return !pair?.dataset.ocrError && output?.dataset.state === 'ready' &&
              output.dataset.previewMode === 'structured';
          },
          selector,
          { timeout: 15_000 },
        );

        const answer = await answerBeforePair(page, selector);
        const submission = JSON.parse(answer);
        assert.deepEqual(submission.operands, ['1111', '2222', '3333']);
        assert.equal(submission.result, '6666');
        assert.deepEqual(submission.carries, [null, null, null, null]);
        assert.deepEqual(
          submission.layout.rows.map((row: any) => row.role),
          ['first-operand', 'second-operand', 'additional-operand', 'carries', 'result'],
        );
        assert.equal(submission.layout.rules[0].afterRow, 3);
        const result = await pair.evaluate((element, submittedAnswer) => {
          const output = element.querySelector('.lia-canvasplus-output') as HTMLElement | null;
          const registry = window.__LIA_CANVAS_OCR__ as any;
          return {
            calls: (window as any).__liaColumnPolicyCalls,
            latex: output?.dataset.latex || '',
            grade: registry.checkCalculationAnswer(
              '1111+2222+3333',
              submittedAnswer,
            ),
          };
        }, answer);
        assert.equal(result.calls, 4);
        assert.match(result.latex, /1111.*\+2222.*\+3333.*\\hline.*6666/u);
        assert.equal(result.grade?.accepted, true);
        assert.equal(result.grade?.outcome, 'correct');
        assert.equal(
          await page.locator('.lia-tex-preview').first()
            .locator('.test-rendered-carry:visible').count(),
          0,
        );
        await checkNativeQuiz(page, selector);
        assert.equal(await answerBeforePair(page, selector), answer);
        assert.ok(courseRequests >= 1);

        const diagnostics = await snapshotDiagnostics(page);
        assert.deepEqual(harness.modelRequests, []);
        assertNoRuntimeErrors(harness, diagnostics);
      } finally {
        await harness.context.close();
        await browser.close();
      }
    },
  );

  test(
    'current chromium smoke: a wrong 121 carry row with three summands reaches native grading',
    { timeout: 120_000 },
    async t => {
      const requested = new Set(
        (process.env.LIA_BROWSER_PROJECTS ?? 'chromium,firefox,webkit')
          .split(',')
          .map(value => value.trim().toLowerCase())
          .filter(Boolean),
      );
      if (!requested.has('chromium')) {
        t.skip('excluded by LIA_BROWSER_PROJECTS');
        return;
      }

      const browser = await chromium.launch({ headless: true });
      const harness = await createHarness(browser, { withAlgebrite: false });
      const selector =
        '.lia-canvas-pair[data-canvas-mode=plus][data-canvas-output=answer]';
      let courseRequests = 0;
      await harness.context.route(WRONG_CARRY_THREE_SUMMAND_COURSE_URL, route => {
        courseRequests += 1;
        return route.fulfill({
          status: 200,
          contentType: 'text/plain; charset=utf-8',
          headers: {
            'access-control-allow-origin': '*',
            'cache-control': 'no-store',
          },
          body: WRONG_CARRY_THREE_SUMMAND_COURSE,
        });
      });
      try {
        await harness.page.setViewportSize({ width: 1920, height: 1100 });
        await openCourse(
          harness,
          WRONG_CARRY_THREE_SUMMAND_COURSE_URL,
          selector + ' .lia-canvas-launch',
        );
        const page = harness.page;
        const pair = page.locator(selector);
        await installCarryPreviewStub(page);
        await installColumnPolicyOcrStub(
          page,
          ['1111', '+ 2 2 2 2', '+ 3 3 3 3', '1 2 1', '6666'],
          'column-addition-three-summand-wrong-carry-stub',
        );

        await pair.locator('.lia-canvas-launch:visible').click();
        const canvas = pair.locator('canvas.lia-draw:visible');
        await canvas.waitFor({ state: 'visible', timeout: 10_000 });
        const box = await canvas.boundingBox();
        assert.ok(box);
        await drawDesign(page, box, threeSummandAdditionWithWrongCarryStrokes());
        await pair.locator('.lia-canvasplus-submit:visible').click();
        await page.waitForFunction(
          pairSelector => {
            const pair = document.querySelector(pairSelector) as HTMLElement | null;
            const output = pair?.querySelector('.lia-canvasplus-output') as HTMLElement | null;
            return !pair?.dataset.ocrError && output?.dataset.state === 'ready' &&
              output.dataset.previewMode === 'structured';
          },
          selector,
          { timeout: 15_000 },
        );

        const output = pair.locator('.lia-canvasplus-output');
        const answer = await answerBeforePair(page, selector);
        assert.ok(answer, 'the wrong structured work must populate the native answer');
        const submission = JSON.parse(answer);
        assert.deepEqual(submission.operands, ['1111', '2222', '3333']);
        assert.equal(submission.result, '6666');
        assert.deepEqual(submission.carries, [null, '1', '2', '1']);
        assert.deepEqual(
          submission.layout.rows.map((row: any) => row.role),
          ['first-operand', 'second-operand', 'additional-operand', 'carries', 'result'],
        );
        assert.equal(submission.layout.rules[0].afterRow, 3);

        const result = await pair.evaluate((element, submittedAnswer) => {
          const rendered = element.querySelector('.lia-canvasplus-output') as HTMLElement | null;
          const registry = window.__LIA_CANVAS_OCR__ as any;
          return {
            calls: (window as any).__liaColumnPolicyCalls,
            latex: rendered?.dataset.latex || '',
            mapping: registry.canvasPlusOcr?.lastColumnCarryMapping || null,
            grade: registry.checkCalculationAnswer(
              '1111+2222+3333',
              submittedAnswer,
            ),
          };
        }, answer);
        assert.equal(result.calls, 5);
        assert.deepEqual(result.mapping?.carries, [null, '1', '2', '1']);
        assert.match(result.latex, /1111.*\+2222.*\+3333.*\\hline.*6666/u);
        assert.match(result.latex, /\\textcolor\{red\}\{2\}/u);
        assert.equal(result.grade?.accepted, false);
        assert.equal(result.grade?.outcome, 'incorrect');
        assert.equal(result.grade?.reason, 'carry-mismatch');

        await checkNativeQuizIncorrect(page, selector);
        assert.equal(await answerBeforePair(page, selector), answer);
        assert.equal(await output.count(), 1, 'the rendered work must survive native Check');
        assert.ok(courseRequests >= 1);

        const diagnostics = await snapshotDiagnostics(page);
        assert.deepEqual(harness.modelRequests, []);
        assertNoRuntimeErrors(harness, diagnostics);
      } finally {
        await harness.context.close();
        await browser.close();
      }
    },
  );

  test(
    'current chromium smoke: an extra observed summand stays separate from a small carry row',
    { timeout: 120_000 },
    async t => {
      const requested = new Set(
        (process.env.LIA_BROWSER_PROJECTS ?? 'chromium,firefox,webkit')
          .split(',')
          .map(value => value.trim().toLowerCase())
          .filter(Boolean),
      );
      if (!requested.has('chromium')) {
        t.skip('excluded by LIA_BROWSER_PROJECTS');
        return;
      }

      const browser = await chromium.launch({ headless: true });
      const harness = await createHarness(browser, { withAlgebrite: false });
      const selector =
        '.lia-canvas-pair[data-canvas-mode=plus][data-canvas-output=answer]';
      let courseRequests = 0;
      await harness.context.route(EXTRA_OBSERVED_SUMMAND_COURSE_URL, route => {
        courseRequests += 1;
        return route.fulfill({
          status: 200,
          contentType: 'text/plain; charset=utf-8',
          headers: {
            'access-control-allow-origin': '*',
            'cache-control': 'no-store',
          },
          body: EXTRA_OBSERVED_SUMMAND_COURSE,
        });
      });
      try {
        await harness.page.setViewportSize({ width: 1920, height: 1100 });
        await openCourse(
          harness,
          EXTRA_OBSERVED_SUMMAND_COURSE_URL,
          selector + ' .lia-canvas-launch',
        );
        const page = harness.page;
        const pair = page.locator(selector);
        await installCarryPreviewStub(page);
        await installColumnPolicyOcrStub(
          page,
          ['4397', '+ 1 4 7 8', '+ 5 3 9 2', '2', '9785'],
          'column-addition-extra-observed-summand-stub',
        );

        await pair.locator('.lia-canvas-launch:visible').click();
        const canvas = pair.locator('canvas.lia-draw:visible');
        await canvas.waitFor({ state: 'visible', timeout: 10_000 });
        const box = await canvas.boundingBox();
        assert.ok(box);
        await drawDesign(page, box, extraObservedSummandAndCarryStrokes());
        await pair.locator('.lia-canvasplus-submit:visible').click();
        await page.waitForFunction(
          pairSelector => {
            const pair = document.querySelector(pairSelector) as HTMLElement | null;
            const output = pair?.querySelector('.lia-canvasplus-output') as HTMLElement | null;
            return !pair?.dataset.ocrError && output?.dataset.state === 'ready' &&
              output.dataset.previewMode === 'structured';
          },
          selector,
          { timeout: 15_000 },
        );

        const output = pair.locator('.lia-canvasplus-output');
        const answer = await answerBeforePair(page, selector);
        assert.ok(answer, 'the structured wrong work must populate the native answer');
        const submission = JSON.parse(answer);
        assert.deepEqual(submission.operands, ['4397', '1478', '5392']);
        assert.equal(submission.result, '9785');
        assert.deepEqual(submission.carries, [null, null, '2', null]);
        assert.deepEqual(
          submission.layout.rows.map((row: any) => row.role),
          ['first-operand', 'second-operand', 'additional-operand', 'carries', 'result'],
        );
        assert.equal(submission.layout.rules[0].afterRow, 3);

        const result = await pair.evaluate((element, submittedAnswer) => {
          const rendered = element.querySelector('.lia-canvasplus-output') as HTMLElement | null;
          const registry = window.__LIA_CANVAS_OCR__ as any;
          return {
            calls: (window as any).__liaColumnPolicyCalls,
            latex: rendered?.dataset.latex || '',
            mapping: registry.canvasPlusOcr?.lastColumnCarryMapping || null,
            grade: registry.checkCalculationAnswer(
              '4728+3596',
              submittedAnswer,
            ),
          };
        }, answer);
        assert.equal(result.calls, 5);
        assert.equal(result.mapping?.observedCarryRow?.text, '2');
        assert.deepEqual(result.mapping?.carries, [null, null, '2', null]);
        assert.match(result.latex, /4397.*\+1478.*\+5392.*\\hline.*9785/u);
        assert.match(result.latex, /\\textcolor\{red\}\{2\}/u);
        assert.equal(result.grade?.accepted, false);
        assert.equal(result.grade?.outcome, 'incorrect');
        assert.equal(result.grade?.reason, 'operand-mismatch');

        await checkNativeQuizIncorrect(page, selector);
        assert.equal(await answerBeforePair(page, selector), answer);
        assert.equal(await output.count(), 1, 'the rendered work must survive native Check');
        assert.ok(courseRequests >= 1);

        const diagnostics = await snapshotDiagnostics(page);
        assert.deepEqual(harness.modelRequests, []);
        assertNoRuntimeErrors(harness, diagnostics);
      } finally {
        await harness.context.close();
        await browser.close();
      }
    },
  );

  test(
    'current chromium smoke: missing written structure stays a draft until a clean redraw',
    { timeout: 120_000 },
    async t => {
      const requested = new Set(
        (process.env.LIA_BROWSER_PROJECTS ?? 'chromium,firefox,webkit')
          .split(',')
          .map(value => value.trim().toLowerCase())
          .filter(Boolean),
      );
      if (!requested.has('chromium')) {
        t.skip('excluded by LIA_BROWSER_PROJECTS');
        return;
      }

      const browser = await chromium.launch({ headless: true });
      const harness = await createHarness(browser, { withAlgebrite: false });
      const selector =
        '.lia-canvas-pair[data-canvas-mode=plus][data-canvas-output=answer]';
      try {
        await harness.page.setViewportSize({ width: 1920, height: 1100 });
        await openCourse(
          harness,
          REAL_COLUMN_ADDITION_COURSE_URL,
          selector + ' .lia-canvas-launch',
        );
        const page = harness.page;
        const pair = page.locator(selector);
        await page.evaluate(pairSelector => {
          (window as any).__liaMissingStructureResponses = [
            '4728',
            '+ 3 5 9 5',
            '8324',
          ];
          (window as any).__liaMissingStructureCalls = 0;
          (window as any).__liaMissingStructureCorrections = [];
          (window as any).__liaMissingStructureAnswerEvents = [];
          const pair = document.querySelector(pairSelector);
          pair?.addEventListener('lia:canvasplus-correction', event => {
            (window as any).__liaMissingStructureCorrections.push(
              (event as CustomEvent).detail,
            );
          });
          pair?.addEventListener('lia:canvasplus-answer', event => {
            (window as any).__liaMissingStructureAnswerEvents.push(
              (event as CustomEvent).detail,
            );
          });
          const ocr = {
            model: 'column-addition-missing-structure-draft-stub',
            precision: 'fp32',
            task: 'image-to-text',
            cacheKey: 'column-addition-missing-structure-draft-v1',
            outputKind: 'latex',
            inputProfile: 'formulanet-line-384',
            calculationSinglePass: true,
            ensureLoaded: async () => true,
            recognize: async () => {
              (window as any).__liaMissingStructureCalls += 1;
              const response = (window as any).__liaMissingStructureResponses.shift();
              if (typeof response !== 'string') {
                throw new Error('Missing-structure draft reached an unexpected OCR call.');
              }
              return response;
            },
          };
          window.__LIA_CANVAS_OCR__.ocr = ocr;
          window.__LIA_CANVAS_OCR__.canvasPlusOcr = ocr;
        }, selector);

        await pair.locator('.lia-canvas-launch:visible').click();
        const canvas = pair.locator('canvas.lia-draw:visible');
        await canvas.waitFor({ state: 'visible', timeout: 10_000 });
        const box = await canvas.boundingBox();
        assert.ok(box);
        await drawDesign(page, box, screenshotAdditionWithoutWrittenStructureStrokes());
        await pair.locator('.lia-canvasplus-submit:visible').click();
        await page.waitForFunction(
          pairSelector => {
            const pair = document.querySelector(pairSelector) as HTMLElement | null;
            const output = pair?.querySelector('.lia-canvasplus-output') as HTMLElement | null;
            return !pair?.dataset.ocrError && output?.dataset.state === 'ready' &&
              Boolean(output.querySelector('.lia-canvasplus-rendered[data-rendered-tex]'));
          },
          selector,
          { timeout: 15_000 },
        );

        const output = pair.locator('.lia-canvasplus-output');
        if (!await output.evaluate(node => (node as HTMLDetailsElement).open)) {
          await output.locator(':scope > summary.lia-canvasplus-result-toggle').click();
        }
        assert.equal(await pair.getAttribute('data-ocr-error'), null);
        assert.equal(await page.evaluate(() => (window as any).__liaMissingStructureCalls), 3);
        const initialDraftAnswer = await answerBeforePair(page, selector);
        assert.deepEqual(
          JSON.parse(initialDraftAnswer),
          ['4728', '+ 3 5 9 5', '8324'],
        );
        assert.equal(await output.getAttribute('data-preview-mode'), 'draft');
        assert.match(
          await output.locator('.lia-canvasplus-standalone-title').innerText(),
          /rendered calculation block/i,
        );
        assert.equal(await output.locator('.lia-canvasplus-edit:visible').isEnabled(), true);
        assert.doesNotMatch(String(await output.getAttribute('data-latex') || ''), /\\hline/u);

        await output.locator('.lia-canvasplus-edit:visible').click();
        const editor = output.locator('.lia-canvasplus-inline-editor');
        const textarea = editor.locator('.lia-canvasplus-inline-textarea');
        assert.equal(await textarea.inputValue(), '4728\n+ 3 5 9 5\n8324');
        await textarea.fill('4728\n+ 3 5 9 6\n8324');
        await editor.locator('.lia-canvasplus-accept').click();
        await page.waitForFunction(
          pairSelector => (document.querySelector(
            pairSelector + ' .lia-canvasplus-output',
          ) as HTMLElement | null)?.dataset.resultSource === 'correction',
          selector,
          { timeout: 10_000 },
        );
        assert.equal(await page.evaluate(() => (window as any).__liaMissingStructureCalls), 3);
        assert.equal(
          await page.evaluate(() => (window as any).__liaMissingStructureCorrections.length),
          1,
        );
        assert.equal(await output.getAttribute('data-preview-mode'), 'draft');
        const correctedDraftAnswer = await answerBeforePair(page, selector);
        assert.deepEqual(
          JSON.parse(correctedDraftAnswer),
          ['4728', '+ 3 5 9 6', '8324'],
        );
        assert.ok(
          (await page.evaluate(() => (window as any).__liaMissingStructureAnswerEvents))
            .every((event: any) => event?.applied && event?.submissionValue),
          'every rendered written draft and correction must reach the native quiz field',
        );
        const correctedDraftGrade = await page.evaluate(submittedAnswer =>
          (window as any).__LIA_CANVAS_OCR__.checkCalculationAnswer(
            '4728+3596',
            submittedAnswer,
          ),
        correctedDraftAnswer);
        assert.equal(correctedDraftGrade?.accepted, false);
        assert.equal(correctedDraftGrade?.reason, 'invalid-format');

        await pair.locator('.lia-canvasplus-submit:visible').click();
        await page.waitForFunction(
          pairSelector => (document.querySelector(
            pairSelector + ' .lia-canvasplus-output',
          ) as HTMLElement | null)?.dataset.resultSource === 'correction',
          selector,
          { timeout: 10_000 },
        );
        assert.equal(await page.evaluate(() => (window as any).__liaMissingStructureCalls), 3);
        assert.equal(await answerBeforePair(page, selector), correctedDraftAnswer);
        assert.equal(await output.getAttribute('data-preview-mode'), 'draft');

        await pair.locator('.lia-eraser-btn:visible').click();
        await pair.locator('.lia-tool-menu [data-act=clear]:visible').click();
        await page.waitForFunction(
          pairSelector => Boolean((document.querySelector(
            pairSelector + ' .lia-canvasplus-output',
          ) as HTMLElement | null)?.hidden),
          selector,
          { timeout: 5_000 },
        );
        await page.evaluate(() => {
          (window as any).__liaCleanRedrawResponses = ['4728', '+ 3 5 9 6', '8324'];
          (window as any).__liaCleanRedrawCalls = 0;
          const ocr = {
            model: 'column-addition-clean-redraw-stub',
            precision: 'fp32',
            task: 'image-to-text',
            cacheKey: 'column-addition-clean-redraw-v1',
            outputKind: 'latex',
            inputProfile: 'formulanet-line-384',
            calculationSinglePass: true,
            ensureLoaded: async () => true,
            recognize: async () => {
              (window as any).__liaCleanRedrawCalls += 1;
              const response = (window as any).__liaCleanRedrawResponses.shift();
              if (typeof response !== 'string') {
                throw new Error('Clean redraw reached an unexpected OCR call.');
              }
              return response;
            },
          };
          window.__LIA_CANVAS_OCR__.ocr = ocr;
          window.__LIA_CANVAS_OCR__.canvasPlusOcr = ocr;
        });
        await pair.locator('.lia-color-btn:visible').click();
        await pair.locator('.lia-tool-menu [data-act=close]:visible').click();
        await drawDesign(page, box, screenshotAdditionStrokes());
        await pair.locator('.lia-canvasplus-submit:visible').click();
        await page.waitForFunction(
          pairSelector => {
            const pair = document.querySelector(pairSelector) as HTMLElement | null;
            const output = pair?.querySelector('.lia-canvasplus-output') as HTMLElement | null;
            return !pair?.dataset.ocrError && output?.dataset.state === 'ready' &&
              output.dataset.resultSource === 'ocr' &&
              String(output.dataset.latex || '').includes('\\hline');
          },
          selector,
          { timeout: 15_000 },
        );

        assert.equal(await page.evaluate(() => (window as any).__liaCleanRedrawCalls), 3);
        assert.equal(await pair.getAttribute('data-ocr-error'), null);
        assert.equal(await output.getAttribute('data-preview-mode'), 'structured');
        const answer = await answerBeforePair(page, selector);
        const submission = JSON.parse(answer);
        assert.deepEqual(submission.operands, ['4728', '3596']);
        assert.equal(submission.result, '8324');
        assert.deepEqual(submission.carries, [null, '1', '1', '1']);
        assert.equal(
          await page.evaluate(submitted =>
            (window as any).__LIA_CANVAS_OCR__.checkCalculationAnswer(
              '4728+3596',
              submitted,
            )?.accepted,
          answer),
          true,
        );

        const diagnostics = await snapshotDiagnostics(page);
        assertSyntheticDelivery(harness, REAL_COLUMN_ADDITION_COURSE_URL);
        assert.deepEqual(harness.modelRequests, []);
        assertNoRuntimeErrors(harness, diagnostics);
      } finally {
        await harness.context.close();
        await browser.close();
      }
    },
  );

  test(
    'current chromium smoke: inconsistent plus-minus OCR never becomes an operand submission',
    { timeout: 90_000 },
    async t => {
      const requested = new Set(
        (process.env.LIA_BROWSER_PROJECTS ?? 'chromium,firefox,webkit')
          .split(',')
          .map(value => value.trim().toLowerCase())
          .filter(Boolean),
      );
      if (!requested.has('chromium')) {
        t.skip('excluded by LIA_BROWSER_PROJECTS');
        return;
      }

      const browser = await chromium.launch({ headless: true });
      const harness = await createHarness(browser, { withAlgebrite: false });
      const selector =
        '.lia-canvas-pair[data-canvas-mode=plus][data-canvas-output=answer]';
      try {
        await harness.page.setViewportSize({ width: 1920, height: 1100 });
        await openCourse(
          harness,
          REAL_COLUMN_ADDITION_COURSE_URL,
          selector + ' .lia-canvas-launch',
        );
        const page = harness.page;
        const pair = page.locator(selector);
        await page.evaluate(() => {
          (window as any).__liaBadPmResponses = [
            '4728',
            '\\pm 2 5 9 6',
            '8324',
          ];
          (window as any).__liaBadPmCalls = 0;
          (window as any).__liaBadPmAnswerEvents = [];
          document.querySelector(
            '.lia-canvas-pair[data-canvas-mode=plus][data-canvas-output=answer]',
          )?.addEventListener('lia:canvasplus-answer', event => {
            (window as any).__liaBadPmAnswerEvents.push((event as CustomEvent).detail);
          });
          const ocr = {
            model: 'column-addition-bad-plus-minus-stub',
            precision: 'fp32',
            task: 'image-to-text',
            cacheKey: 'column-addition-bad-plus-minus-v1',
            outputKind: 'latex',
            inputProfile: 'formulanet-line-384',
            calculationSinglePass: true,
            ensureLoaded: async () => true,
            recognize: async () => {
              (window as any).__liaBadPmCalls += 1;
              const response = (window as any).__liaBadPmResponses.shift();
              if (typeof response !== 'string') {
                throw new Error('Inconsistent plus-minus row reached operatorless retry.');
              }
              return response;
            },
          };
          window.__LIA_CANVAS_OCR__.ocr = ocr;
          window.__LIA_CANVAS_OCR__.canvasPlusOcr = ocr;
        });

        await pair.locator('.lia-canvas-launch:visible').click();
        const canvas = pair.locator('canvas.lia-draw:visible');
        await canvas.waitFor({ state: 'visible', timeout: 10_000 });
        const box = await canvas.boundingBox();
        assert.ok(box);
        await drawDesign(page, box, screenshotAdditionStrokes());
        await pair.locator('.lia-canvasplus-submit:visible').click();
        await page.waitForFunction(
          pairSelector => {
            const pair = document.querySelector(pairSelector) as HTMLElement | null;
            const output = pair?.querySelector('.lia-canvasplus-output') as HTMLElement | null;
            return Boolean(
              pair?.dataset.ocrError ||
              output?.dataset.state === 'error' ||
              output?.dataset.state === 'ready'
            );
          },
          selector,
          { timeout: 15_000 },
        );

        const answer = await answerBeforePair(page, selector);
        const result = await pair.evaluate((element, submittedAnswer) => {
          const output = element.querySelector('.lia-canvasplus-output') as HTMLElement | null;
          const registry = window.__LIA_CANVAS_OCR__ as any;
          return {
            state: output?.dataset.state || '',
            previewMode: output?.dataset.previewMode || '',
            ocrError: (element as HTMLElement).dataset.ocrError || '',
            calls: (window as any).__liaBadPmCalls,
            renderedTex: output?.querySelector(
              '.lia-canvasplus-rendered',
            )?.getAttribute('data-rendered-tex') || '',
            grade: registry.checkCalculationAnswer('4728+3596', submittedAnswer),
            answerEvent: (() => {
              const events = (window as any).__liaBadPmAnswerEvents;
              return events[events.length - 1];
            })(),
          };
        }, answer);
        assert.equal(result.state, 'ready');
        assert.equal(result.previewMode, 'draft');
        assert.equal(result.ocrError, '');
        assert.ok(result.renderedTex);
        assert.ok(result.calls >= 3 && result.calls <= 4);
        assert.deepEqual(JSON.parse(answer), ['4728', '\\pm 2 5 9 6', '8324']);
        assert.doesNotMatch(answer, /2596/u);
        assert.equal(result.answerEvent?.applied, true);
        assert.equal(result.answerEvent?.submissionValue, answer);
        assert.equal(result.grade?.accepted, false);
        assert.equal(result.grade?.reason, 'invalid-format');
        const badPmOutput = pair.locator('.lia-canvasplus-output');
        await checkNativeQuizIncorrect(page, selector);
        assert.equal(await answerBeforePair(page, selector), answer);
        assert.equal(await badPmOutput.getAttribute('data-preview-mode'), 'draft');
        if (!await badPmOutput.evaluate(node => (node as HTMLDetailsElement).open)) {
          await badPmOutput.locator(':scope > summary.lia-canvasplus-result-toggle').click();
        }
        assert.equal(await pair.locator('.lia-canvasplus-edit:visible').isEnabled(), true);

        const diagnostics = await snapshotDiagnostics(page);
        assertSyntheticDelivery(harness, REAL_COLUMN_ADDITION_COURSE_URL);
        assert.deepEqual(harness.modelRequests, []);
        assertNoRuntimeErrors(harness, diagnostics);
      } finally {
        await harness.context.close();
        await browser.close();
      }
    },
  );

}
