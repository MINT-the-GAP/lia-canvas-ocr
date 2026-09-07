import assert from 'node:assert/strict';
import test from 'node:test';

import { chromium, firefox, webkit, type Browser, type BrowserType, type Page } from 'playwright';

import {
  CALCULATION_QUIZ_COURSE_URL,
  assertNoRuntimeErrors,
  createHarness,
  openCourse,
  snapshotDiagnostics,
  type BrowserHarness,
} from './support.mts';
import {
  SYNTHETIC_EQUATION_GLYPHS as GLYPHS,
  SYNTHETIC_EQUATION_TEX as EQUATION_TEX,
  SYNTHETIC_LEFT_TEX as LEFT_TEX,
  SYNTHETIC_RIGHT_TEX as RIGHT_TEX,
  SYNTHETIC_LONG_EQUATION,
} from '../fixtures/ocr-equation-chunks.mts';

const PAIR = '.lia-canvas-pair[data-canvas-mode=plus][data-canvas-output=answer]';
const PROJECTS: Array<{ name: string; browserType: BrowserType }> = [
  { name: 'chromium', browserType: chromium },
  { name: 'firefox', browserType: firefox },
  { name: 'webkit', browserType: webkit },
];

type Point = readonly [number, number];
type Raster = {
  width: number;
  height: number;
  maxNewTokens: number;
  bands: Array<{ x0: number; x1: number; y0: number; y1: number; pixels: number }>;
};

// Authored synthetic glyph geometry, shared in shape with the development
// corpus. This checks canvas segmentation and integration, not handwriting
// accuracy. Only the expensive model invocation is replaced by a stub.

async function drawStroke(page: Page, points: readonly Point[]): Promise<void> {
  await page.mouse.move(points[0][0], points[0][1]);
  await page.mouse.down();
  for (let index = 1; index < points.length; index++) {
    await page.mouse.move(points[index][0], points[index][1], { steps: 3 });
  }
  // A dot is a genuine single-pointer-position tap, not a tiny artificial line.
  await page.mouse.up();
}

async function drawText(page: Page, text: string, x: number, y: number, height: number): Promise<number> {
  let cursor = x;
  for (const character of text) {
    const glyph = GLYPHS[character];
    assert.ok(glyph, `missing synthetic glyph: ${character}`);
    const width = height * (character === '\u00b7' || character === '|' ? 0.24 : 0.62);
    for (const stroke of glyph) {
      await drawStroke(page, stroke.map(([px, py]) => [cursor + px * width, y + py * height] as const));
    }
    cursor += width + height * 0.16;
  }
  return cursor;
}

async function canvasBox(page: Page) {
  const canvas = page.locator(PAIR + ' canvas.lia-draw:visible');
  await canvas.scrollIntoViewIfNeeded();
  const box = await canvas.boundingBox();
  assert.ok(box, 'the calculation drawing surface must be visible');
  return box;
}

async function drawLongEquation(page: Page): Promise<{ operationX: number; y: number; height: number }> {
  const box = await canvasBox(page);
  // Reserve room for a later independent right-hand operation. Uniform scaling
  // retains the wide ink aspect and the isolated equality sign on small canvases.
  const height = Math.min(32, box.width / 24, box.height * 0.12);
  const x = box.x + 64;
  const y = box.y + box.height * 0.65;
  const sample = SYNTHETIC_LONG_EQUATION;
  const scale = height / sample.layout.glyphHeight;
  for (const stroke of sample.strokes) {
    await drawStroke(page, stroke.map(point => [
      x + (point.x - sample.layout.originX) * scale,
      y + (point.y - sample.layout.originY) * scale,
    ] as const));
  }
  return { operationX: x - box.x + (sample.layout.operationX - sample.layout.originX) * scale, y: y - box.y, height };
}

async function queueResponses(page: Page, responses: string[], operationResponse?: string): Promise<void> {
  await page.evaluate(({ responses, operationResponse }) => {
    (window as any).__priorityThreeResponses = responses;
    (window as any).__priorityThreeOperationResponse = operationResponse;
  }, { responses, operationResponse });
}

async function rasters(page: Page): Promise<Raster[]> {
  return page.evaluate(() => (window as any).__priorityThreeRasters);
}

async function submit(page: Page, lineCount: number): Promise<string[]> {
  const previous = await page.evaluate(() => (window as any).__priorityThreeRenders.length);
  await page.locator(PAIR + ' .lia-canvasplus-submit:visible').click();
  await page.waitForFunction(({ selector, previous, lineCount }) => {
    const output = document.querySelector(selector + ' .lia-canvasplus-output') as HTMLElement | null;
    const events = (window as any).__priorityThreeRenders;
    return events.length > previous && output?.dataset.state === 'ready'
      && output.dataset.stale === '0' && output.dataset.lineCount === String(lineCount);
  }, { selector: PAIR, previous, lineCount }, { timeout: 10_000 }).catch(async error => {
    const diagnostics = await page.evaluate(selector => ({
      output: (document.querySelector(selector + ' .lia-canvasplus-output') as HTMLElement)?.dataset,
      error: (document.querySelector(selector) as HTMLElement)?.dataset.ocrError,
      rasters: (window as any).__priorityThreeRasters,
      renders: (window as any).__priorityThreeRenders,
      remainingResponses: (window as any).__priorityThreeResponses,
    }), PAIR);
    throw new Error('Calculation did not become ready: ' + JSON.stringify(diagnostics), { cause: error });
  });
  return page.evaluate(() => {
    const events = (window as any).__priorityThreeRenders;
    return events[events.length - 1].lines;
  });
}

async function openSyntheticCalculation(browser: Browser): Promise<BrowserHarness> {
  const harness = await createHarness(browser);
  try {
    const page = harness.page;
    await page.setViewportSize({ width: 1440, height: 1000 });
    await openCourse(harness, CALCULATION_QUIZ_COURSE_URL, PAIR + ' .lia-canvas-launch');
    await page.waitForFunction(() => Boolean((window as any).__LIA_CANVAS_OCR__), undefined, { timeout: 10_000 });
    await page.evaluate(selector => {
      const registry = (window as any).__LIA_CANVAS_OCR__;
      (window as any).__priorityThreeResponses = [];
      (window as any).__priorityThreeRenders = [];
      (window as any).__priorityThreeRasters = [];
      document.querySelector(selector)!.addEventListener('lia:canvasplus-render', event => {
        (window as any).__priorityThreeRenders.push((event as CustomEvent).detail);
      });
      (window as any).katex = {
        render(tex: string, target: HTMLElement) {
          target.textContent = tex;
          target.setAttribute('data-rendered-tex', tex);
        },
      };
      const ocr = {
        model: 'priority-three-integration-stub',
        cacheKey: 'priority-three-integration-stub',
        precision: 'fp32',
        task: 'image-to-text',
        outputKind: 'latex',
        inputProfile: 'formulanet-line-384',
        calculationSinglePass: true,
        ensureLoaded: async () => true,
        recognize: async (input: HTMLCanvasElement, options: { max_new_tokens?: number }) => {
          const context = input.getContext('2d', { willReadFrequently: true });
          if (!context) throw new Error('OCR raster has no 2D context');
          const pixels = context.getImageData(0, 0, input.width, input.height).data;
          const bands: Array<{ x0: number; x1: number; y0: number; y1: number; pixels: number }> = [];
          let band: typeof bands[number] | null = null;
          for (let x = 0; x < input.width; x++) {
            let count = 0;
            let y0 = input.height;
            let y1 = 0;
            for (let y = 0; y < input.height; y++) {
              const offset = (y * input.width + x) * 4;
              if (pixels[offset + 3] > 128 &&
                (pixels[offset] + pixels[offset + 1] + pixels[offset + 2]) / 3 < 180) {
                count++;
                y0 = Math.min(y0, y);
                y1 = Math.max(y1, y);
              }
            }
            if (count) {
              if (!band) { band = { x0: x, x1: x, y0, y1, pixels: 0 }; bands.push(band); }
              band.x1 = x;
              band.y0 = Math.min(band.y0, y0);
              band.y1 = Math.max(band.y1, y1);
              band.pixels += count;
            } else band = null;
          }
          (window as any).__priorityThreeRasters.push({
            width: input.width, height: input.height, maxNewTokens: options.max_new_tokens, bands,
          });
          // Right-hand operations may run concurrently with the equation chunks.
          // The narrow physical crop identifies them without assuming call order.
          if ((window as any).__priorityThreeOperationResponse !== undefined && input.width / input.height < 3) {
            const response = (window as any).__priorityThreeOperationResponse;
            (window as any).__priorityThreeOperationResponse = undefined;
            return response;
          }
          const response = (window as any).__priorityThreeResponses.shift();
          if (typeof response !== 'string') throw new Error('unexpected uncached priority-three OCR call');
          if (response === (window as any).__priorityThreeHoldResponse) {
            (window as any).__priorityThreeHoldResponse = undefined;
            return new Promise<string>(resolve => { (window as any).__priorityThreeReleaseFallback = resolve; });
          }
          return response;
        },
      };
      registry.ocr = ocr;
      registry.canvasPlusOcr = ocr;
    }, PAIR);
    await page.locator(PAIR + ' .lia-canvas-launch:visible').click();
    await page.locator(PAIR + ' canvas.lia-draw:visible').waitFor({ state: 'visible' });
    // Resize through the real handle so the authored thin equality bars retain
    // enough height, and keep all ink clear of the canvas toolbar at the left.
    const corner = page.locator(PAIR + ' .lia-resize-corner[data-corner="br"]');
    const cornerBox = await corner.boundingBox();
    assert.ok(cornerBox);
    await page.mouse.move(cornerBox.x + cornerBox.width / 2, cornerBox.y + cornerBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(cornerBox.x + cornerBox.width / 2 + 240, cornerBox.y + cornerBox.height / 2, { steps: 8 });
    await page.mouse.up();
    return harness;
  } catch (error) {
    await harness.context.close();
    throw error;
  }
}

export function registerPriorityThreeBrowserRegression(): void {
  const requested = new Set((process.env.LIA_BROWSER_PROJECTS ?? 'chromium,firefox,webkit')
    .split(',').map(value => value.trim().toLowerCase()).filter(Boolean));
  for (const project of PROJECTS) {
    test(`current ${project.name}: priority-three long equation chunks, whole-line fallback and cache`,
      { timeout: 180_000 }, async t => {
        if (!requested.has(project.name)) { t.skip('excluded by LIA_BROWSER_PROJECTS'); return; }
        const browser = await project.browserType.launch({ headless: true });
        try {
          const harness = await openSyntheticCalculation(browser);
          try {
            const page = harness.page;
            const box = await canvasBox(page);
            await drawText(page, 'x=4', box.x + box.width * 0.12, box.y + box.height * 0.18, 30);
            await queueResponses(page, ['x=4']);
            assert.deepEqual(await submit(page, 1), ['x=4']);
            assert.equal((await rasters(page)).length, 1, 'a short equation requires one OCR invocation');
            assert.equal((await rasters(page))[0].maxNewTokens, 64, 'short equations retain the small token budget');

            const operation = await drawLongEquation(page);
            await queueResponses(page, [LEFT_TEX, '= ' + RIGHT_TEX]);
            const longActual = await submit(page, 2);
            assert.deepEqual(longActual, ['x=4', EQUATION_TEX],
              'the two recognized sides must become one equation row, with the existing short row retained');
            const firstRasters = await rasters(page);
            assert.equal(firstRasters.length, 3,
              'adding a long row requires its two chunks only; unchanged short-row ink must remain cached');
            const longRasters = firstRasters.filter(raster => raster.bands.length > 3);
            assert.equal(longRasters.length, 2, 'the long equation requires exactly two model invocations');
            assert.deepEqual(longRasters.map(raster => raster.maxNewTokens), [64, 64],
              'each short side uses its own small token budget');
            const leftRaster = longRasters[0];
            const inkHeight = Math.max(...leftRaster.bands.map(band => band.y1))
              - Math.min(...leftRaster.bands.map(band => band.y0)) + 1;
            assert.ok(leftRaster.bands.some(band => band.pixels > 0 &&
              band.x1 - band.x0 + 1 <= inkHeight / 4 && band.y1 - band.y0 + 1 <= inkHeight / 4),
            'the left chunk must retain the real tapped multiplication dot');
            await queueResponses(page, []);
            assert.deepEqual(await submit(page, 2), ['x=4', EQUATION_TEX]);
            assert.equal((await rasters(page)).length, firstRasters.length, 'resubmitting unchanged chunked equations uses the line cache');

            const operationBox = await canvasBox(page);
            await drawText(page, '|', operationBox.x + operation.operationX, operationBox.y + operation.y, operation.height);
            await drawText(page, '+5', operationBox.x + operation.operationX + operation.height * 0.85,
              operationBox.y + operation.y, operation.height);
            await queueResponses(page, [LEFT_TEX, '= ' + RIGHT_TEX], '+5');
            assert.deepEqual(await submit(page, 2), ['x=4', EQUATION_TEX + String.raw` \mid +5`],
              'chunked equations must retain a separately recognized transformation operation');
            const transformedRasters = await rasters(page);
            const newRasters = transformedRasters.slice(firstRasters.length);
            assert.equal(newRasters.length, 3, 'only two equation chunks and the added operation need OCR');
            assert.equal(newRasters.filter(raster => raster.bands.length > 3).length, 2,
              'the transformed equation still uses exactly two equation chunks');
            assert.equal(newRasters.filter(raster => raster.bands.length === 2).length, 1,
              'the right-hand operation is recognized independently');
            await queueResponses(page, []);
            assert.deepEqual(await submit(page, 2), ['x=4', EQUATION_TEX + String.raw` \mid +5`]);
            assert.equal((await rasters(page)).length, transformedRasters.length, 'the full transformed line is cached too');
            assert.deepEqual(harness.modelRequests, [], 'synthetic regressions must not download models');
            assertNoRuntimeErrors(harness, await snapshotDiagnostics(page));
          } finally {
            await harness.context.close();
          }

          const fallbackHarness = await openSyntheticCalculation(browser);
          try {
            const page = fallbackHarness.page;
            await drawLongEquation(page);
            await queueResponses(page, [LEFT_TEX, String.raw`\frac{12}{`, EQUATION_TEX]);
            assert.deepEqual(await submit(page, 1), [EQUATION_TEX],
              'an unbalanced chunk must trigger whole-line recognition instead of publishing partial content');
            const fallbackRasters = await rasters(page);
            assert.equal(fallbackRasters.length, 3, 'two proposed chunks are followed by one whole-line fallback');
            assert.ok(fallbackRasters[2].width > Math.max(fallbackRasters[0].width, fallbackRasters[1].width) * 1.5,
              'the fallback engine input contains the entire equation width');
            assert.equal(fallbackRasters[2].maxNewTokens, 128,
              'the complete long equation has an expanded token budget');
            assert.deepEqual(await page.evaluate(() => (window as any).__priorityThreeRenders.map((event: any) => event.lines)),
              [[EQUATION_TEX]], 'no intermediate partial equation may be rendered');
            await queueResponses(page, []);
            assert.deepEqual(await submit(page, 1), [EQUATION_TEX]);
            assert.equal((await rasters(page)).length, 3, 'the successful whole-line fallback is cached');

            // Force a fresh recognition, then switch the runtime profile while
            // its final whole-row model promise is still pending. The old result
            // must not be committed after that last await.
            const beforeSwitch = await page.evaluate(() => (window as any).__priorityThreeRenders.length);
            await queueResponses(page, [LEFT_TEX, String.raw`\frac{12}{`, EQUATION_TEX]);
            await page.evaluate(holdResponse => {
              const registry = (window as any).__LIA_CANVAS_OCR__;
              registry.canvasPlusOcr.cacheKey = 'priority-three-before-profile-switch';
              (window as any).__priorityThreeHoldResponse = holdResponse;
            }, EQUATION_TEX);
            await page.locator(PAIR + ' .lia-canvasplus-submit:visible').click();
            await page.waitForFunction(() => typeof (window as any).__priorityThreeReleaseFallback === 'function',
              undefined, { timeout: 10_000 });
            assert.equal((await rasters(page)).length, 6, 'the profile switch happens during the final fallback call');
            await page.evaluate(response => {
              const registry = (window as any).__LIA_CANVAS_OCR__;
              const next = { ...registry.canvasPlusOcr, cacheKey: 'priority-three-after-profile-switch' };
              registry.canvasPlusOcr = next;
              registry.ocr = next;
              (window as any).__priorityThreeReleaseFallback(response);
              (window as any).__priorityThreeReleaseFallback = undefined;
            }, EQUATION_TEX);
            await page.waitForFunction(selector => {
              const output = document.querySelector(selector + ' .lia-canvasplus-output') as HTMLElement | null;
              const button = document.querySelector(selector + ' .lia-canvasplus-submit') as HTMLButtonElement | null;
              return output?.getAttribute('aria-busy') !== 'true' && button?.disabled === false;
            }, PAIR, { timeout: 10_000 });
            assert.equal(await page.evaluate(() => (window as any).__priorityThreeRenders.length), beforeSwitch,
              'a late fallback from the former profile must not render another result');
            assert.equal((await rasters(page)).length, 6, 'cancellation must not schedule extra old-profile model calls');
            assert.deepEqual(fallbackHarness.modelRequests, []);
            assertNoRuntimeErrors(fallbackHarness, await snapshotDiagnostics(page));
          } finally {
            await fallbackHarness.context.close();
          }
        } finally {
          await browser.close();
        }
      });
  }
}
