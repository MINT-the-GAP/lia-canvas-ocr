import assert from 'node:assert/strict';
import test from 'node:test';

import { chromium, type Page } from 'playwright';

import {
  WRITTEN_ARITHMETIC_COURSE_URL,
  assertNoRuntimeErrors,
  assertSyntheticDelivery,
  createHarness,
  openCourse,
  snapshotDiagnostics,
} from './support.mts';

type Point = readonly [number, number];
type Stroke = ReadonlyArray<Point>;

type Drawing = {
  width: number;
  height: number;
  strokes: Stroke[];
};

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
  height = 58,
): Stroke[] {
  const p = (dx: number, dy: number): Point => [x + dx * width, y + dy * height];
  switch (digit) {
    case '0':
      return [[
        p(0.50, 0), p(0.18, 0.08), p(0, 0.34), p(0.04, 0.78),
        p(0.28, 1), p(0.72, 0.98), p(0.98, 0.72), p(1, 0.28),
        p(0.78, 0.04), p(0.50, 0),
      ]];
    case '1': {
      const stemX = x + width * 0.72;
      return [[
        [stemX - height * 0.24, y + height * 0.30],
        [stemX, y],
        [stemX, y + height * 0.42],
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
        p(0.50, 0), p(0.14, 0.10), p(0.06, 0.30), p(0.50, 0.50),
        p(0.94, 0.30), p(0.86, 0.08), p(0.50, 0), p(0.50, 0.50),
        p(0.04, 0.72), p(0.14, 0.94), p(0.50, 1), p(0.88, 0.92),
        p(0.98, 0.70), p(0.50, 0.50),
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

function numberStrokes(
  value: string,
  x: number,
  y: number,
  gap = 42,
  width = 28,
  height = 58,
): Stroke[] {
  return Array.from(value).flatMap((digit, index) =>
    digitStrokes(digit, x + index * gap, y, width, height),
  );
}

function rightAlignedNumberStrokes(
  value: string,
  rightmostX: number,
  y: number,
  gap = 42,
  width = 28,
  height = 58,
): Stroke[] {
  return numberStrokes(
    value,
    rightmostX - (value.length - 1) * gap,
    y,
    gap,
    width,
    height,
  );
}

function minusStroke(x: number, y: number, width = 30): Stroke {
  return [[x, y], [x + width, y]];
}

function plusStrokes(x: number, y: number, size = 30): Stroke[] {
  return [
    [[x, y + size / 2], [x + size, y + size / 2]],
    [[x + size / 2, y], [x + size / 2, y + size]],
  ];
}

function equalsStrokes(x: number, y: number, width = 30): Stroke[] {
  return [
    [[x, y], [x + width, y]],
    [[x, y + 16], [x + width, y + 16]],
  ];
}

function dotStrokes(x: number, y: number): Stroke[] {
  return [
    [[x, y], [x + 4, y + 3], [x, y + 6], [x - 4, y + 3], [x, y]],
  ];
}

function colonStrokes(x: number, y: number): Stroke[] {
  return [
    ...dotStrokes(x, y),
    ...dotStrokes(x, y + 28),
  ];
}

function hookedSmallOne(stemX: number, y: number, height = 34): Stroke {
  return [[
    stemX - height * 0.44,
    y + height * 0.30,
  ], [
    stemX,
    y,
  ], [
    stemX,
    y + height * 0.40,
  ], [
    stemX,
    y + height,
  ]];
}

function writtenSubtraction(): Drawing {
  return {
    width: 450,
    height: 390,
    strokes: [
      ...numberStrokes('9002', 145, 20),
      minusStroke(88, 158, 34),
      ...numberStrokes('3487', 145, 128),
      // Pinned SchulLia convention: a leading minus and hooked borrow ones.
      minusStroke(88, 229, 34),
      hookedSmallOne(163, 205),
      hookedSmallOne(205, 205),
      hookedSmallOne(247, 205),
      [[75, 248], [145, 247], [250, 249], [355, 248]],
      ...numberStrokes('5515', 145, 270),
    ],
  };
}

function writtenMultiplication(): Drawing {
  return {
    width: 470,
    height: 500,
    strokes: [
      ...numberStrokes('738', 128, 18),
      ...dotStrokes(273, 47),
      ...digitStrokes('6', 315, 18),
      ...plusStrokes(70, 127),
      ...rightAlignedNumberStrokes('4200', 315, 100),
      ...plusStrokes(70, 207),
      ...rightAlignedNumberStrokes('180', 315, 180),
      ...plusStrokes(70, 287),
      ...rightAlignedNumberStrokes('48', 315, 260),
      [[55, 350], [145, 349], [250, 351], [365, 350]],
      ...rightAlignedNumberStrokes('4428', 315, 377),
    ],
  };
}

export function writtenDivision(): Drawing {
  const digitHeight = 46;
  const digitWidth = 24;
  const gap = 34;
  const digits = (
    value: string,
    x: number,
    y: number,
  ) => numberStrokes(value, x, y, gap, digitWidth, digitHeight);
  return {
    width: 560,
    height: 590,
    strokes: [
      ...digits('8736', 80, 10),
      ...colonStrokes(224, 17),
      ...digits('8', 250, 10),
      ...equalsStrokes(290, 24),
      ...digits('1092', 334, 10),

      minusStroke(48, 96, 24),
      ...digits('8', 80, 74),
      [[44, 128], [78, 127], [112, 128]],
      ...digits('07', 80, 140),

      minusStroke(82, 222, 24),
      ...digits('0', 114, 200),
      [[78, 254], [112, 253], [146, 254]],
      ...digits('73', 114, 266),

      minusStroke(82, 348, 24),
      ...digits('72', 114, 326),
      [[78, 380], [130, 379], [180, 380]],
      ...digits('16', 148, 392),

      minusStroke(116, 474, 24),
      ...digits('16', 148, 452),
      [[112, 506], [164, 505], [214, 506]],
      ...digits('0', 182, 518),
    ],
  };
}

async function drawDesign(
  page: Page,
  box: { x: number; y: number; width: number; height: number },
  drawing: Drawing,
): Promise<void> {
  const scale = Math.min(
    box.width * 0.82 / drawing.width,
    box.height * 0.88 / drawing.height,
  );
  const originX = box.x + (box.width - drawing.width * scale) / 2;
  const originY = box.y + box.height * 0.05;
  for (const stroke of drawing.strokes) {
    await drawPolyline(page, stroke.map(([x, y]) => ({
      x: originX + x * scale,
      y: originY + y * scale,
    })));
  }
}

async function answerBeforePair(page: Page, selector: string): Promise<string> {
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

async function checkNativeQuiz(page: Page, selector: string): Promise<void> {
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
      .querySelectorAll('[data-written-arithmetic-check]')
      .forEach(node => node.removeAttribute('data-written-arithmetic-check'));
    button.setAttribute('data-written-arithmetic-check', '1');
  }, selector);
  await page.locator('[data-written-arithmetic-check]').click();
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

async function installOcrStub(page: Page, responses: string[], label: string): Promise<void> {
  await page.evaluate(({ expectedResponses, stubLabel }) => {
    (window as any).__liaWrittenResponses = [...expectedResponses];
    (window as any).__liaWrittenCrops = [];
    (window as any).__liaWrittenDivisionRules = [];
    const divisionRuleProperty = '__liaOcrDivisionRules';
    if (!Object.getOwnPropertyDescriptor(
      HTMLCanvasElement.prototype,
      divisionRuleProperty,
    )) {
      Object.defineProperty(HTMLCanvasElement.prototype, divisionRuleProperty, {
        configurable: true,
        get() {
          return undefined;
        },
        set(value) {
          (window as any).__liaWrittenDivisionRules = Array.isArray(value)
            ? structuredClone(value)
            : value;
          Object.defineProperty(this, divisionRuleProperty, {
            configurable: true,
            enumerable: false,
            writable: true,
            value,
          });
        },
      });
    }
    const ocr = {
      model: stubLabel + '-geometry-stub',
      precision: 'fp32',
      task: 'image-to-text',
      cacheKey: stubLabel + '-geometry-v1',
      outputKind: 'latex',
      inputProfile: 'formulanet-line-384',
      calculationSinglePass: true,
      ensureLoaded: async () => true,
      recognize: async (input: HTMLCanvasElement) => {
        const context = input.getContext('2d', { willReadFrequently: true });
        if (!context) throw new Error(stubLabel + ' crop has no 2D context');
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
        (window as any).__liaWrittenCrops.push({
          width: input.width,
          height: input.height,
          inkWidth: x1 >= x0 ? x1 - x0 + 1 : 0,
          inkHeight: y1 >= y0 ? y1 - y0 + 1 : 0,
        });
        const response = (window as any).__liaWrittenResponses.shift();
        if (typeof response !== 'string') {
          throw new Error(stubLabel + ' received an unexpected rule-only OCR crop');
        }
        return response;
      },
    };
    window.__LIA_CANVAS_OCR__.ocr = ocr;
    window.__LIA_CANVAS_OCR__.canvasPlusOcr = ocr;
  }, { expectedResponses: responses, stubLabel: label });
}

async function submitDrawing(
  page: Page,
  selector: string,
  drawing: Drawing,
): Promise<{
  answer: string;
  kind: string;
  latex: string;
  lineCount: string;
  transitions: number;
  equationRows: number;
  columnPreviews: number;
  renderedTex: string;
  crops: Array<{ inkWidth: number; inkHeight: number }>;
  remainingResponses: number;
}> {
  const pair = page.locator(selector);
  await pair.locator('.lia-canvas-launch:visible').click();
  const canvas = pair.locator('canvas.lia-draw:visible');
  await canvas.waitFor({ state: 'visible', timeout: 10_000 });
  const box = await canvas.boundingBox();
  assert.ok(box, 'written-arithmetic canvas has no bounding box');
  await drawDesign(page, box, drawing);
  await pair.locator('.lia-canvasplus-submit:visible').click();
  await page.waitForFunction(
    pairSelector => {
      const pairNode = document.querySelector(pairSelector) as HTMLElement | null;
      if (pairNode?.dataset.ocrError) return true;
      const output = pairNode?.querySelector('.lia-canvasplus-output') as HTMLElement | null;
      return output?.dataset.state === 'ready' &&
        output.dataset.analysisState === 'ready' &&
        Boolean(output.dataset.latex);
    },
    selector,
    { timeout: 15_000 },
  );
  const recognitionError = await pair.getAttribute('data-ocr-error');
  const recognitionDebug = await page.evaluate(() => ({
    remainingResponses: (window as any).__liaWrittenResponses?.length,
    crops: (window as any).__liaWrittenCrops,
    divisionRules: (window as any).__liaWrittenDivisionRules,
  }));
  assert.equal(
    recognitionError,
    null,
    (recognitionError || 'written arithmetic OCR failed') +
      ' | ' + JSON.stringify(recognitionDebug),
  );
  const output = pair.locator('.lia-canvasplus-output');
  if (!await output.evaluate(node => (node as HTMLDetailsElement).open)) {
    await output.locator(':scope > summary.lia-canvasplus-result-toggle').click();
  }
  const snapshot = await pair.evaluate(element => {
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
      crops: (window as any).__liaWrittenCrops,
      remainingResponses: (window as any).__liaWrittenResponses.length,
    };
  });
  return {
    answer: await answerBeforePair(page, selector),
    ...snapshot,
  };
}

async function assertCheckPreservesPreview(
  page: Page,
  selector: string,
  answer: string,
  latex: string,
): Promise<void> {
  await checkNativeQuiz(page, selector);
  assert.equal(await answerBeforePair(page, selector), answer);
  const pair = page.locator(selector);
  const output = pair.locator('.lia-canvasplus-output');
  assert.equal(await output.count(), 1, 'rendered work must survive native Check');
  assert.equal(await output.getAttribute('data-latex'), latex);
  const nativePreview = await page.evaluate(pairSelector => {
    const pairNode = document.querySelector(pairSelector);
    let field: Element | null = null;
    for (const candidate of document.querySelectorAll(
      'input, textarea, [contenteditable=true]',
    )) {
      if (candidate.compareDocumentPosition(pairNode!) & Node.DOCUMENT_POSITION_FOLLOWING) {
        field = candidate;
      }
    }
    const preview = field
      ? (field as any).__liaTexPreviewBox as HTMLElement | null
      : null;
    return {
      on: preview?.dataset.on || '',
      multiline: preview?.dataset.multiline || '',
      renderedTex: preview?.querySelector(
        '.lia-tex-preview-math',
      )?.getAttribute('data-rendered-tex') || '',
    };
  }, selector);
  assert.deepEqual(nativePreview, {
    on: '1',
    multiline: '1',
    renderedTex: latex,
  });
}

async function goToNextTask(
  page: Page,
  selector: string,
  hash: string,
  prompt: string,
): Promise<void> {
  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  });
  await page.keyboard.press('ArrowRight');
  await page.waitForFunction(
    ({ pairSelector, targetHash, expectedPrompt }) => {
      const pair = document.querySelector(pairSelector) as HTMLElement | null;
      return location.hash === targetHash &&
        document.querySelectorAll(pairSelector).length === 1 &&
        pair?.dataset.calculationPrompt === expectedPrompt;
    },
    {
      pairSelector: selector,
      targetHash: hash,
      expectedPrompt: prompt,
    },
    { timeout: 10_000 },
  );
}

function assertOnlySemanticCrops(
  crops: Array<{ inkWidth: number; inkHeight: number }>,
  expectedCount: number,
): void {
  assert.equal(
    crops.length,
    expectedCount,
    'rules, underlines and borrow hooks must not become separate OCR calls',
  );
  const maximumInkHeight = Math.max(...crops.map(crop => Number(crop.inkHeight) || 0));
  assert.ok(maximumInkHeight > 0);
  assert.ok(
    crops.every(crop =>
      crop.inkWidth > 0 && crop.inkHeight >= maximumInkHeight * 0.38,
    ),
    'a thin structural rule reached FormulaNet: ' + JSON.stringify(crops),
  );
}

export function registerWrittenArithmeticBrowserRegression(): void {
  test(
    'current chromium smoke: subtraction, multiplication and division use pinned written layouts',
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
          WRITTEN_ARITHMETIC_COURSE_URL,
          selector + ' .lia-canvas-launch',
        );
        const page = harness.page;
        await page.evaluate(() => {
          (window as any).katex = {
            render(tex: string, target: HTMLElement) {
              target.textContent = 'rendered: ' + tex;
              target.setAttribute('data-rendered-tex', tex);
            },
          };
        });

        await installOcrStub(page, ['9002', '-3487', '5515'], 'column-subtraction');
        let pair = page.locator(selector);
        assert.equal(new URL(page.url()).hash, '#1');
        const subtraction = await submitDrawing(page, selector, writtenSubtraction());
        assert.equal(subtraction.kind, 'column-subtraction');
        assert.equal(
          await pair.getAttribute('data-calculation-kind'),
          'column-subtraction',
          'an integer-only minus prompt must select written subtraction automatically',
        );
        assert.equal(subtraction.lineCount, '4');
        assert.equal(subtraction.transitions, 0);
        assert.equal(subtraction.equationRows, 0);
        assert.equal(subtraction.columnPreviews, 1);
        assert.equal(subtraction.renderedTex, subtraction.latex);
        assert.equal(subtraction.remainingResponses, 0);
        assertOnlySemanticCrops(subtraction.crops, 3);
        assert.match(subtraction.latex, /\\hline/u);
        assert.equal((subtraction.latex.match(/\{\\scriptstyle 1\}/gu) || []).length, 3);
        assert.doesNotMatch(subtraction.latex, /color/iu);
        const subtractionAnswer = JSON.parse(subtraction.answer);
        assert.equal(subtractionAnswer.kind, 'column-subtraction');
        assert.equal(subtractionAnswer.version, 1);
        assert.deepEqual(subtractionAnswer.operands, ['9002', '3487']);
        assert.equal(subtractionAnswer.result, '5515');
        assert.deepEqual(subtractionAnswer.borrows, [null, '1', '1', '1']);
        assert.deepEqual(
          subtractionAnswer.layout.rows.map((row: any) => row.role),
          ['first-operand', 'second-operand', 'borrows', 'result'],
        );
        await assertCheckPreservesPreview(
          page,
          selector,
          subtraction.answer,
          subtraction.latex,
        );

        await goToNextTask(page, selector, '#2', '738\\cdot6');
        await installOcrStub(
          page,
          ['738\\cdot6', '+4200', '+180', '+48', '4428'],
          'column-multiplication',
        );
        pair = page.locator(selector);
        const multiplication = await submitDrawing(
          page,
          selector,
          writtenMultiplication(),
        );
        assert.equal(multiplication.kind, 'column-multiplication');
        assert.equal(
          await pair.getAttribute('data-calculation-kind'),
          'column-multiplication',
          'an integer-only cdot prompt must select written multiplication automatically',
        );
        assert.equal(multiplication.lineCount, '5');
        assert.equal(multiplication.transitions, 0);
        assert.equal(multiplication.equationRows, 0);
        assert.equal(multiplication.columnPreviews, 1);
        assert.equal(multiplication.renderedTex, multiplication.latex);
        assert.equal(multiplication.remainingResponses, 0);
        assertOnlySemanticCrops(multiplication.crops, 5);
        assert.match(multiplication.latex, /738\s+\\cdot\s+6/u);
        const multiplicationOrder = ['+4200', '+180', '+48', '\\hline', '4428']
          .map(fragment => multiplication.latex.indexOf(fragment));
        assert.ok(
          multiplicationOrder.every((offset, index) =>
            offset >= 0 && (index === 0 || offset > multiplicationOrder[index - 1]),
          ),
          'multiplication TeX does not preserve the pinned place-value row order: ' +
            multiplication.latex,
        );
        assert.doesNotMatch(multiplication.latex, /color/iu);
        const multiplicationAnswer = JSON.parse(multiplication.answer);
        assert.equal(multiplicationAnswer.kind, 'column-multiplication');
        assert.equal(multiplicationAnswer.version, 1);
        assert.deepEqual(multiplicationAnswer.operands, ['738', '6']);
        assert.deepEqual(multiplicationAnswer.partialProducts, [
          { multiplicandColumn: 2, shift: 2, value: '4200' },
          { multiplicandColumn: 1, shift: 1, value: '180' },
          { multiplicandColumn: 0, shift: 0, value: '48' },
        ]);
        assert.equal(multiplicationAnswer.result, '4428');
        await assertCheckPreservesPreview(
          page,
          selector,
          multiplication.answer,
          multiplication.latex,
        );

        await goToNextTask(page, selector, '#3', '8736:8');
        await installOcrStub(
          page,
          ['8736:8=1092', '-8', '07', '-0', '73', '-72', '16', '-16', '0'],
          'column-division',
        );
        pair = page.locator(selector);
        const division = await submitDrawing(page, selector, writtenDivision());
        assert.equal(division.kind, 'column-division');
        assert.equal(
          await pair.getAttribute('data-calculation-kind'),
          'column-division',
          'an integer-only colon prompt must select written long division automatically',
        );
        assert.equal(division.lineCount, '9');
        assert.equal(division.transitions, 0);
        assert.equal(division.equationRows, 0);
        assert.equal(division.columnPreviews, 1);
        assert.equal(division.renderedTex, division.latex);
        assert.equal(division.remainingResponses, 0);
        assertOnlySemanticCrops(
          division.crops,
          9,
        );
        assert.equal(
          division.crops.length,
          9,
          'the four underlines must be structural and must never be OCR crops',
        );
        assert.match(division.latex, /07/u);
        assert.equal(
          (division.latex.match(/\\underline\{-/gu) || []).length,
          4,
          'all four structural division underlines must be reconstructed in TeX',
        );
        assert.doesNotMatch(division.latex, /color/iu);
        const divisionAnswer = JSON.parse(division.answer);
        assert.equal(divisionAnswer.kind, 'column-division');
        assert.equal(divisionAnswer.version, 1);
        assert.equal(divisionAnswer.dividend, '8736');
        assert.equal(divisionAnswer.divisor, '8');
        assert.equal(divisionAnswer.quotient, '1092');
        assert.equal(divisionAnswer.remainder, null);
        assert.deepEqual(
          divisionAnswer.steps.map((step: any) => ({
            partialDividend: step.partialDividend,
            subtractedProduct: step.subtractedProduct,
            remainder: step.remainder,
            broughtDownDigit: step.broughtDownDigit,
          })),
          [
            {
              partialDividend: '8',
              subtractedProduct: '8',
              remainder: '0',
              broughtDownDigit: '7',
            },
            {
              partialDividend: '07',
              subtractedProduct: '0',
              remainder: '7',
              broughtDownDigit: '3',
            },
            {
              partialDividend: '73',
              subtractedProduct: '72',
              remainder: '1',
              broughtDownDigit: '6',
            },
            {
              partialDividend: '16',
              subtractedProduct: '16',
              remainder: '0',
              broughtDownDigit: null,
            },
          ],
        );
        await assertCheckPreservesPreview(page, selector, division.answer, division.latex);

        const diagnostics = await snapshotDiagnostics(page);
        assertSyntheticDelivery(harness, WRITTEN_ARITHMETIC_COURSE_URL);
        assert.deepEqual(harness.modelRequests, []);
        assertNoRuntimeErrors(harness, diagnostics);
      } finally {
        await harness.context.close();
        await browser.close();
      }
    },
  );
}
