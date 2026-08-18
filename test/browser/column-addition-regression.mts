import assert from 'node:assert/strict';
import test from 'node:test';

import { chromium, type Page } from 'playwright';

import {
  COLUMN_ADDITION_COURSE_URL,
  assertNoRuntimeErrors,
  assertSyntheticDelivery,
  createHarness,
  openCourse,
  snapshotDiagnostics,
} from './support.mts';

type Point = readonly [number, number];
type Stroke = ReadonlyArray<Point>;

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
    [[90, 265], [155, 263], [225, 265.5], [330, 264]],
    ...numberStrokes('5923', 295),
  ];
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

async function drawDesign(
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
          (window as any).katex = {
            render(tex: string, target: HTMLElement) {
              target.textContent = 'rendered: ' + tex;
              target.setAttribute('data-rendered-tex', tex);
            },
          };
          (window as any).__liaColumnResponses = ['4379', '+1544', '5923'];
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
            recognize: async (input: HTMLCanvasElement) => {
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
          result.latex.indexOf('4 & 3 & 7 & 9'),
          result.latex.indexOf('+ & 1 & 5 & 4 & 4'),
          result.latex.indexOf('{\\scriptstyle 1}'),
          result.latex.indexOf('\\hline'),
          result.latex.indexOf('5 & 9 & 2 & 3'),
        ];
        assert.ok(
          rowOrder.every((offset, index) => offset >= 0 &&
            (index === 0 || offset > rowOrder[index - 1])),
          'TeX rows must be operand 1, operand 2, carries, rule, result: ' +
            result.latex,
        );
        assert.equal(
          (result.latex.match(/\{\\scriptstyle 1\}/gu) || []).length,
          2,
          'the preview must retain exactly the two written carry ones',
        );
        assert.doesNotMatch(result.latex, /111/u);
        assert.equal(result.remainingResponses, 0);
        assert.equal(
          result.crops.length,
          3,
          'FormulaNet must receive only two operands and one result crop',
        );
        const maximumInkHeight = Math.max(
          ...result.crops.map((crop: any) => Number(crop.inkHeight) || 0),
        );
        assert.ok(maximumInkHeight > 0);
        assert.ok(
          result.crops.every((crop: any) =>
            crop.inkWidth > 0 && crop.inkHeight >= maximumInkHeight * 0.72,
          ),
          'a thin rule or small carry crop reached FormulaNet: ' +
            JSON.stringify(result.crops),
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
        assert.equal((carryLatex.match(/\{\\scriptstyle 1\}/gu) || []).length, 1);
        assert.match(
          carryLatex,
          /&\s*\{\\scriptstyle 1\}\s*&\s*&\s*\\\\\s*\\hline/u,
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
}
