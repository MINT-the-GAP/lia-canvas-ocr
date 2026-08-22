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

function shortRoundCappedDotStrokes(x: number, y: number): Stroke[] {
  // Real pen input often records only a sub-pen-width centre-line movement.
  // The round canvas cap still paints a visible multiplication dot.
  return [
    [[x, y], [x + 0.8, y + 0.2]],
  ];
}

function thickRoundDotStrokes(x: number, y: number): Stroke[] {
  // A fresh, deliberately thick scribbled dot. The outer and inner loops are
  // one connected stroke, so this exercises the initial recognition instead
  // of relying on a previously accepted tiny dab.
  return [[
    [x - 10, y], [x - 7, y - 7], [x, y - 10], [x + 7, y - 7],
    [x + 10, y], [x + 7, y + 7], [x, y + 10], [x - 7, y + 7],
    [x - 10, y], [x - 6, y], [x - 4, y - 4], [x, y - 6],
    [x + 4, y - 4], [x + 6, y], [x + 4, y + 4], [x, y + 6],
    [x - 4, y + 4], [x - 6, y], [x, y],
  ]];
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

function bottomFootSmallOne(stemX: number, y: number, height = 34): Stroke {
  return [
    [stemX - height * 0.24, y + height * 0.24],
    [stemX, y],
    [stemX, y + height],
    [stemX + height * 0.20, y + height * 0.80],
  ];
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

function screenshotTightSubtractionWithVisibleBorrowRow(): Drawing {
  return {
    width: 450,
    height: 330,
    strokes: [
      ...numberStrokes('9002', 145, 20),
      // Only five completely empty raster rows separate the operand glyphs.
      // This is the screenshot-like spacing that generic line segmentation
      // used to merge into one FormulaNet crop (for example `-34487`).
      minusStroke(88, 113, 34),
      ...numberStrokes('3487', 145, 84),
      // These compact bottom-foot ones deliberately remain visible to OCR
      // instead of becoming vector borrow hints.
      bottomFootSmallOne(163, 151),
      bottomFootSmallOne(205, 151),
      bottomFootSmallOne(247, 151),
      [[75, 194], [145, 193], [250, 195], [355, 194]],
      ...numberStrokes('5515', 145, 211),
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

function screenshotIncompleteMultiplication(): Drawing {
  return {
    width: 470,
    height: 300,
    strokes: [
      ...numberStrokes('738', 128, 18),
      ...dotStrokes(273, 47),
      ...digitStrokes('6', 315, 18),
      [[55, 140], [145, 139], [250, 141], [365, 140]],
      ...rightAlignedNumberStrokes('4428', 315, 170),
    ],
  };
}

export function screenshotCarryMultiplicationStrokes(
  operatorStrokes = shortRoundCappedDotStrokes(294, 47),
): Stroke[] {
  return [
    ...digitStrokes('7', 112, 18),
    ...digitStrokes('3', 176, 18),
    ...digitStrokes('8', 240, 18),
    // Observed compact carry marks: 8*6 -> 4, then 3*6+4 -> 2.
    ...digitStrokes('2', 151, 66, 13, 23),
    ...digitStrokes('4', 215, 66, 13, 23),
    ...operatorStrokes,
    ...digitStrokes('6', 330, 18),
    [[55, 139], [145, 138], [250, 140], [365, 139]],
    ...rightAlignedNumberStrokes('4428', 330, 169),
  ];
}

function screenshotCarryMultiplication(): Drawing {
  return {
    width: 470,
    height: 300,
    strokes: screenshotCarryMultiplicationStrokes(),
  };
}

function screenshotThickCarryMultiplication(): Drawing {
  return {
    width: 470,
    height: 300,
    strokes: screenshotCarryMultiplicationStrokes(
      thickRoundDotStrokes(294, 47),
    ),
  };
}

function screenshotMinusOperatorMultiplication(): Drawing {
  return {
    width: 470,
    height: 300,
    strokes: [
      ...numberStrokes('738', 128, 18),
      minusStroke(272, 49, 34),
      ...digitStrokes('6', 315, 18),
      [[55, 140], [145, 139], [250, 141], [365, 140]],
      ...rightAlignedNumberStrokes('4428', 315, 170),
    ],
  };
}

function screenshotPartiallyCompleteMultiplication(): Drawing {
  return {
    width: 470,
    height: 390,
    strokes: [
      ...numberStrokes('738', 128, 18),
      ...dotStrokes(273, 47),
      ...digitStrokes('6', 315, 18),
      ...plusStrokes(70, 127),
      ...rightAlignedNumberStrokes('4200', 315, 100),
      [[55, 220], [145, 219], [250, 221], [365, 220]],
      ...rightAlignedNumberStrokes('4428', 315, 247),
    ],
  };
}

export function writtenDivision(includeObservedQuotient = true): Drawing {
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
      ...(includeObservedQuotient
        ? [...equalsStrokes(290, 24), ...digits('1092', 334, 10)]
        : []),

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

function incompleteWrittenDivisionPrefix(): Drawing {
  const complete = writtenDivision();
  return {
    width: complete.width,
    height: 220,
    // Header, first subtraction, its underline, and the observed 07
    // bring-down row form one unambiguous authored prefix.
    strokes: complete.strokes.slice(0, 18),
  };
}

export async function drawDesign(
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

async function checkNativeQuiz(
  page: Page,
  selector: string,
  expectedResult: 'success' | 'failure' = 'success',
): Promise<void> {
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
    ({ pairSelector, expectedResult }) => {
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
      if (expectedResult === 'success') {
        return Boolean(
          quiz?.classList.contains('solved') &&
          quiz.querySelector('.lia-quiz__feedback.text-success'),
        );
      }
      return Boolean(
        quiz?.classList.contains('open') &&
        quiz.querySelector('.lia-quiz__feedback.text-error') &&
        !quiz.querySelector('.lia-quiz__feedback.text-success'),
      );
    },
    { pairSelector: selector, expectedResult },
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
  previewMode: string;
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
      previewMode: outputNode?.dataset.previewMode || '',
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
  expectedResult: 'success' | 'failure' = 'success',
): Promise<void> {
  await checkNativeQuiz(page, selector, expectedResult);
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
        assert.match(subtraction.latex, /\\mathllap\{-\}/u);
        assert.equal(
          (subtraction.latex.match(/\\textcolor\{red\}\{1\}/gu) || []).length,
          3,
        );
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
          ['7,3,8,6', '+4200', '+180', '+48', '4428'],
          'column-multiplication-comma-dot-complete',
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
        const multiplicationSemanticLatex = multiplication.latex.replace(
          /\\textcolor\{red\}\{(\d)\}/gu,
          '$1',
        );
        const multiplicationOrder = ['+4200', '+180', '+48', '\\hline', '4428']
          .map(fragment => multiplicationSemanticLatex.indexOf(fragment));
        assert.ok(
          multiplicationOrder.every((offset, index) =>
            offset >= 0 && (index === 0 || offset > multiplicationOrder[index - 1]),
          ),
          'multiplication TeX does not preserve the pinned place-value row order: ' +
            multiplication.latex,
        );
        assert.equal(
          (multiplication.latex.match(/\\textcolor\{red\}\{0\}/gu) || []).length,
          3,
        );
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
          [
            String.raw`\(8736 \div 8\)`,
            '-g',
            '0 7',
            '− 0',
            '7 3',
            '− 7 2',
            '1 6',
            '− 1 6',
            '0',
          ],
          'column-division',
        );
        pair = page.locator(selector);
        const division = await submitDrawing(page, selector, writtenDivision(false));
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
        assert.doesNotMatch(division.latex, /\\textcolor\{/u);
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
        assert.match(division.latex, /8736:8&=1092/u);
        assert.doesNotMatch(division.latex, /\{g\}/u);
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

  test(
    'current chromium smoke: tight screenshot subtraction splits both operands and succeeds natively',
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

        await installOcrStub(
          page,
          ['9002', '-3487', '1 1 1', '5515'],
          'column-subtraction-visible-borrow-row',
        );
        const pair = page.locator(selector);
        const subtraction = await submitDrawing(
          page,
          selector,
          screenshotTightSubtractionWithVisibleBorrowRow(),
        );
        assert.equal(subtraction.kind, 'column-subtraction');
        assert.equal(
          subtraction.previewMode,
          'structured',
          'tight subtraction snapshot: ' + JSON.stringify(subtraction),
        );
        assert.ok(subtraction.answer, 'structured subtraction must populate the native answer');
        assert.equal(subtraction.renderedTex, subtraction.latex);
        assert.equal(
          subtraction.remainingResponses,
          0,
          'tight subtraction OCR crops: ' + JSON.stringify(subtraction),
        );
        assertOnlySemanticCrops(subtraction.crops, 4);
        assert.match(subtraction.latex, /\\hline/u);
        const subtractionAnswer = JSON.parse(subtraction.answer);
        assert.deepEqual(subtractionAnswer.operands, ['9002', '3487']);
        assert.equal(subtractionAnswer.result, '5515');
        assert.deepEqual(subtractionAnswer.borrows, [null, '1', '1', '1']);
        assert.deepEqual(
          subtractionAnswer.layout.rows.map((row: any) => row.role),
          ['first-operand', 'second-operand', 'borrows', 'result'],
        );
        assert.deepEqual(subtractionAnswer.layout.rules, [
          { kind: 'horizontal', afterRow: 2 },
        ]);
        const subtractionGrade = await pair.evaluate((_, answer) =>
          (window.__LIA_CANVAS_OCR__ as any)
            .checkCalculationAnswer('9002-3487', answer),
        subtraction.answer);
        assert.equal(subtractionGrade?.accepted, true);
        assert.equal(subtractionGrade?.outcome, 'correct');
        await assertCheckPreservesPreview(
          page,
          selector,
          subtraction.answer,
          subtraction.latex,
          'success',
        );

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

  test(
    'current chromium smoke: incomplete screenshot multiplication stays structured and fails natively',
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
        await goToNextTask(page, selector, '#2', '738\\cdot6');
        await installOcrStub(
          page,
          ['7,3,8,6', '4428'],
          'column-multiplication-comma-dot-screenshot',
        );

        const pair = page.locator(selector);
        const multiplication = await submitDrawing(
          page,
          selector,
          screenshotIncompleteMultiplication(),
        );
        assert.equal(multiplication.kind, 'column-multiplication');
        assert.equal(multiplication.previewMode, 'structured');
        assert.ok(
          multiplication.answer,
          'incomplete structured multiplication must populate the native answer',
        );
        assert.equal(multiplication.renderedTex, multiplication.latex);
        assert.equal(multiplication.remainingResponses, 0);
        assertOnlySemanticCrops(multiplication.crops, 2);
        assert.match(multiplication.latex, /\\hline/u);
        assert.match(multiplication.latex, /\\cdot/u);
        assert.doesNotMatch(multiplication.latex, /,/u);
        const multiplicationAnswer = JSON.parse(multiplication.answer);
        assert.deepEqual(multiplicationAnswer.operands, ['738', '6']);
        assert.deepEqual(multiplicationAnswer.carryMarks, [null, null, null]);
        assert.equal(multiplicationAnswer.result, '4428');
        const multiplicationGrade = await pair.evaluate((_, answer) =>
          (window.__LIA_CANVAS_OCR__ as any)
            .checkCalculationAnswer('738\\cdot6', answer),
        multiplication.answer);
        assert.equal(multiplicationGrade?.accepted, false);
        assert.equal(multiplicationGrade?.outcome, 'incomplete');
        assert.equal(multiplicationGrade?.reason, 'missing-carry-mark');
        assert.equal(multiplicationGrade?.carryColumn, 0);
        await assertCheckPreservesPreview(
          page,
          selector,
          multiplication.answer,
          multiplication.latex,
          'failure',
        );

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

  test(
    'current chromium smoke: screenshot multiplication carry marks render red and pass native check',
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
        await goToNextTask(page, selector, '#2', '738\\cdot6');
        await installOcrStub(
          page,
          [String.raw`7_{2}3_{4}8-6`, '4428'],
          'column-multiplication-index-carries-minus-alias',
        );

        const pair = page.locator(selector);
        const multiplication = await submitDrawing(
          page,
          selector,
          screenshotCarryMultiplication(),
        );
        assert.equal(multiplication.kind, 'column-multiplication');
        assert.equal(multiplication.previewMode, 'structured');
        assert.ok(multiplication.answer);
        assert.equal(multiplication.renderedTex, multiplication.latex);
        assert.equal(multiplication.remainingResponses, 0);
        assertOnlySemanticCrops(multiplication.crops, 2);
        assert.match(multiplication.latex, /\\hline/u);
        assert.match(multiplication.latex, /\\cdot/u);
        assert.doesNotMatch(multiplication.latex, /738\s*-\s*6/u);
        assert.equal(
          (multiplication.latex.match(/\\textcolor\{red\}/gu) || []).length,
          2,
        );
        assert.match(
          multiplication.latex,
          /7_\{\\scriptstyle\\textcolor\{red\}\{2\}\}3_\{\\scriptstyle\\textcolor\{red\}\{4\}\}8/u,
        );

        const multiplicationAnswer = JSON.parse(multiplication.answer);
        assert.deepEqual(multiplicationAnswer, {
          kind: 'column-multiplication',
          version: 1,
          operands: ['738', '6'],
          carryMarks: ['2', '4', null],
          result: '4428',
        });
        const multiplicationGrade = await pair.evaluate((_, answer) =>
          (window.__LIA_CANVAS_OCR__ as any)
            .checkCalculationAnswer('738\\cdot6', answer),
        multiplication.answer);
        assert.equal(multiplicationGrade?.accepted, true);
        assert.equal(multiplicationGrade?.outcome, 'correct');
        await assertCheckPreservesPreview(
          page,
          selector,
          multiplication.answer,
          multiplication.latex,
          'success',
        );

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

  test(
    'current chromium smoke: multiplication dot gate accepts thick equals aliases and rejects hallucinated marks or a real minus',
    { timeout: 240_000 },
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

      const scenarios = [
        {
          label: 'comma-carries',
          responses: ['7,3,8,6', '4428', '2', '4'],
          drawing: screenshotCarryMultiplication(),
          previewMode: 'structured',
          cropCount: 4,
        },
        {
          label: 'thick-dot-equals-carries',
          responses: [String.raw`7_{2}3_{4}8=6`, '4428'],
          drawing: screenshotThickCarryMultiplication(),
          previewMode: 'structured',
          cropCount: 2,
        },
        {
          label: 'hallucinated-subscripts',
          responses: [String.raw`7_{2}3_{4}8\cdot6`, '4428'],
          drawing: screenshotIncompleteMultiplication(),
          previewMode: 'draft',
          cropCount: 2,
        },
        {
          label: 'real-minus-geometry',
          responses: [String.raw`738\cdot6`, '-', '4428'],
          drawing: screenshotMinusOperatorMultiplication(),
          previewMode: 'draft',
          cropCount: 3,
        },
      ] as const;

      for (const scenario of scenarios) {
        const browser = await chromium.launch({ headless: true });
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
          await goToNextTask(page, selector, '#2', '738\\cdot6');
          await installOcrStub(
            page,
            [...scenario.responses],
            'column-multiplication-raster-' + scenario.label,
          );

          const multiplication = await submitDrawing(
            page,
            selector,
            scenario.drawing,
          );
          assert.equal(
            multiplication.previewMode,
            scenario.previewMode,
            scenario.label + ': ' + JSON.stringify(multiplication),
          );
          assert.equal(multiplication.remainingResponses, 0, scenario.label);
          if (scenario.label === 'comma-carries') {
            assert.equal(multiplication.crops.length, scenario.cropCount);
            assertOnlySemanticCrops(multiplication.crops.slice(0, 2), 2);
            assert.ok(
              multiplication.crops.slice(2).every(crop =>
                crop.inkWidth > 0 && crop.inkHeight > 0,
              ),
              'isolated carry digits must remain non-empty semantic OCR crops',
            );
          } else if (scenario.label === 'real-minus-geometry') {
            assert.equal(multiplication.crops.length, scenario.cropCount);
            assertOnlySemanticCrops([
              multiplication.crops[0],
              multiplication.crops[2],
            ], 2);
            assert.ok(
              multiplication.crops[1].inkHeight <
                Math.min(
                  multiplication.crops[0].inkHeight,
                  multiplication.crops[2].inkHeight,
                ) * 0.38,
              'the genuine minus/rule geometry must remain a thin draft row',
            );
          } else {
            assertOnlySemanticCrops(multiplication.crops, scenario.cropCount);
          }

          const pair = page.locator(selector);
          if (scenario.previewMode === 'structured') {
            const answer = JSON.parse(multiplication.answer);
            assert.deepEqual(answer, {
              kind: 'column-multiplication',
              version: 1,
              operands: ['738', '6'],
              carryMarks: ['2', '4', null],
              result: '4428',
            });
            assert.match(multiplication.latex, /\\cdot/u);
            assert.match(multiplication.latex, /\\hline/u);
            assert.equal(
              (multiplication.latex.match(/\\textcolor\{red\}/gu) || []).length,
              2,
            );
            const grade = await pair.evaluate((_, value) =>
              (window.__LIA_CANVAS_OCR__ as any)
                .checkCalculationAnswer('738\\cdot6', value),
            multiplication.answer);
            assert.equal(grade?.accepted, true);
            assert.equal(grade?.outcome, 'correct');
            await assertCheckPreservesPreview(
              page,
              selector,
              multiplication.answer,
              multiplication.latex,
              'success',
            );
          } else {
            assert.deepEqual(
              JSON.parse(multiplication.answer),
              [...scenario.responses],
            );
            const grade = await pair.evaluate((_, value) =>
              (window.__LIA_CANVAS_OCR__ as any)
                .checkCalculationAnswer('738\\cdot6', value),
            multiplication.answer);
            assert.equal(grade?.accepted, false);
            assert.equal(grade?.reason, 'invalid-format');
            await assertCheckPreservesPreview(
              page,
              selector,
              multiplication.answer,
              multiplication.latex,
              'failure',
            );
          }

          const diagnostics = await snapshotDiagnostics(page);
          assertSyntheticDelivery(harness, WRITTEN_ARITHMETIC_COURSE_URL);
          assert.deepEqual(harness.modelRequests, []);
          assertNoRuntimeErrors(harness, diagnostics);
        } finally {
          await harness.context.close();
          await browser.close();
        }
      }
    },
  );

  test(
    'current chromium smoke: observed multiplication partial prefix stays structured and incomplete',
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
        await goToNextTask(page, selector, '#2', '738\\cdot6');
        await installOcrStub(
          page,
          ['7,3,8,6', '+4200', '4428'],
          'column-multiplication-comma-dot-partial-prefix',
        );

        const pair = page.locator(selector);
        const multiplication = await submitDrawing(
          page,
          selector,
          screenshotPartiallyCompleteMultiplication(),
        );
        assert.equal(multiplication.kind, 'column-multiplication');
        assert.equal(multiplication.previewMode, 'structured');
        assert.ok(
          multiplication.answer,
          'a partially authored multiplication must populate the native answer',
        );
        assert.equal(multiplication.renderedTex, multiplication.latex);
        assert.equal(multiplication.remainingResponses, 0);
        assertOnlySemanticCrops(multiplication.crops, 3);
        assert.match(multiplication.latex, /738\s+\\cdot\s+6/u);
        const semanticLatex = multiplication.latex.replace(
          /\\textcolor\{red\}\{(\d)\}/gu,
          '$1',
        );
        assert.match(semanticLatex, /\+4200/u);
        assert.match(multiplication.latex, /\\hline/u);
        assert.doesNotMatch(multiplication.latex, /\+180|\+48/u);

        const multiplicationAnswer = JSON.parse(multiplication.answer);
        assert.deepEqual(multiplicationAnswer.operands, ['738', '6']);
        assert.deepEqual(multiplicationAnswer.partialProducts, [
          { multiplicandColumn: 2, shift: 2, value: '4200' },
        ]);
        assert.equal(multiplicationAnswer.result, '4428');
        const multiplicationGrade = await pair.evaluate((_, answer) =>
          (window.__LIA_CANVAS_OCR__ as any)
            .checkCalculationAnswer('738\\cdot6', answer),
        multiplication.answer);
        assert.equal(multiplicationGrade?.accepted, false);
        assert.equal(multiplicationGrade?.outcome, 'incomplete');
        assert.equal(multiplicationGrade?.reason, 'missing-partial-product');
        assert.equal(multiplicationGrade?.partialProductColumn, 1);
        await assertCheckPreservesPreview(
          page,
          selector,
          multiplication.answer,
          multiplication.latex,
          'failure',
        );

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

  test(
    'current chromium smoke: observed division mistakes and prefixes stay structured for native grading',
    { timeout: 180_000 },
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
      const selector =
        '.lia-canvas-pair[data-canvas-mode=plus][data-canvas-output=answer]';
      const cases = [
        {
          label: 'wrong-observed-step',
          drawing: writtenDivision(),
          responses: [
            '8736:8=1092', '-8', '07', '-0', '73', '-71', '16', '-16', '0',
          ],
          reason: 'step-mismatch',
          outcome: 'incorrect',
          expectedSteps: 4,
          expectedLineCount: '9',
        },
        {
          label: 'observed-header-mismatch',
          drawing: writtenDivision(),
          responses: [
            '9736:8=1092', '-8', '07', '-0', '73', '-72', '16', '-16', '0',
          ],
          reason: 'operand-mismatch',
          outcome: 'incorrect',
          expectedSteps: 4,
          expectedLineCount: '9',
        },
        {
          label: 'unambiguous-observed-prefix',
          drawing: incompleteWrittenDivisionPrefix(),
          responses: ['8736:8=1092', '-8', '07'],
          reason: 'missing-step',
          outcome: 'incomplete',
          expectedSteps: 1,
          expectedLineCount: '3',
        },
      ] as const;

      try {
        for (const scenario of cases) {
          const harness = await createHarness(browser, { withAlgebrite: false });
          try {
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
            await goToNextTask(page, selector, '#2', '738\\cdot6');
            await goToNextTask(page, selector, '#3', '8736:8');
            await installOcrStub(page, [...scenario.responses], scenario.label);

            const division = await submitDrawing(
              page,
              selector,
              scenario.drawing,
            );
            assert.equal(division.kind, 'column-division');
            assert.equal(division.previewMode, 'structured');
            assert.equal(division.lineCount, scenario.expectedLineCount);
            assert.equal(division.remainingResponses, 0);
            assert.doesNotMatch(division.latex, /\\textcolor\{/u);
            const answer = JSON.parse(division.answer);
            assert.equal(answer.kind, 'column-division');
            assert.equal(answer.steps.length, scenario.expectedSteps);

            if (scenario.label === 'wrong-observed-step') {
              assert.equal(answer.steps[2].subtractedProduct, '71');
              assert.match(
                division.latex,
                /\\underline\{-71\}/u,
              );
            } else if (scenario.label === 'observed-header-mismatch') {
              assert.equal(answer.dividend, '9736');
              assert.equal(answer.dividend === '8736', false);
            } else {
              assert.equal(answer.steps[0].partialDividend, '8');
              assert.equal(answer.steps[0].remainder, '0');
              assert.equal(answer.steps[0].broughtDownDigit, '7');
            }

            const grade = await page.locator(selector).evaluate((_, value) =>
              (window.__LIA_CANVAS_OCR__ as any)
                .checkCalculationAnswer('8736:8', value),
            division.answer);
            assert.equal(grade?.accepted, false);
            assert.equal(grade?.outcome, scenario.outcome);
            assert.equal(grade?.reason, scenario.reason);
            await assertCheckPreservesPreview(
              page,
              selector,
              division.answer,
              division.latex,
              'failure',
            );

            const diagnostics = await snapshotDiagnostics(page);
            assertSyntheticDelivery(harness, WRITTEN_ARITHMETIC_COURSE_URL);
            assert.deepEqual(harness.modelRequests, []);
            assertNoRuntimeErrors(harness, diagnostics);
          } finally {
            await harness.context.close();
          }
        }
      } finally {
        await browser.close();
      }
    },
  );

  test(
    'current chromium smoke: an uncertain division row remains an editable native draft',
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
        await goToNextTask(page, selector, '#2', '738\\cdot6');
        await goToNextTask(page, selector, '#3', '8736:8');
        await installOcrStub(
          page,
          ['8736:8', '-g', '17', '-0', '73', '-72', '16', '-16', '0'],
          'column-division-uncertain-role',
        );

        const division = await submitDrawing(page, selector, writtenDivision(false));
        assert.equal(division.kind, 'column-division');
        assert.equal(division.previewMode, 'draft');
        assert.equal(division.lineCount, '9');
        assert.equal(division.remainingResponses, 0);
        assert.deepEqual(JSON.parse(division.answer), [
          '8736:8', '-g', '17', '-0', '73', '-72', '16', '-16', '0',
        ]);
        const grade = await page.locator(selector).evaluate((_, value) =>
          (window.__LIA_CANVAS_OCR__ as any)
            .checkCalculationAnswer('8736:8', value),
        division.answer);
        assert.equal(grade?.accepted, false);
        assert.equal(grade?.reason, 'invalid-format');
        await assertCheckPreservesPreview(
          page,
          selector,
          division.answer,
          division.latex,
          'failure',
        );

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
