import assert from 'node:assert/strict';
import test from 'node:test';

import { chromium, firefox, webkit, type BrowserType, type Page } from 'playwright';

import {
  CALCULATION_QUIZ_COURSE_URL,
  assertNoRuntimeErrors,
  createHarness,
  openCourse,
  snapshotDiagnostics,
} from './support.mts';

const PAIR = '.lia-canvas-pair[data-canvas-mode=plus][data-canvas-output=answer]';
const PROJECTS: Array<{ name: string; browserType: BrowserType }> = [
  { name: 'chromium', browserType: chromium },
  { name: 'firefox', browserType: firefox },
  { name: 'webkit', browserType: webkit },
];

type RelativePoint = readonly [number, number];

async function draw(page: Page, points: ReadonlyArray<RelativePoint>): Promise<void> {
  const canvas = page.locator(PAIR + ' canvas.lia-draw:visible');
  await canvas.scrollIntoViewIfNeeded();
  const box = await canvas.boundingBox();
  assert.ok(box, 'the calculation drawing surface is visible');
  const absolute = points.map(([x, y]) => ({ x: box.x + x * box.width, y: box.y + y * box.height }));
  await page.mouse.move(absolute[0].x, absolute[0].y);
  await page.mouse.down();
  for (let i = 1; i < absolute.length; i++) {
    await page.mouse.move(absolute[i].x, absolute[i].y, { steps: 6 });
  }
  // A one-element path deliberately has no pointermove while pressed.
  await page.mouse.up();
}

async function queueResponses(page: Page, responses: string[]): Promise<void> {
  await page.evaluate(values => {
    (window as any).__priorityOneResponses = values;
  }, responses);
}

async function renderedLines(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const events = (window as any).__priorityOneRenders;
    return events[events.length - 1].lines;
  });
}

async function submit(page: Page, lineCount: number): Promise<string[]> {
  const previous = await page.evaluate(() => (window as any).__priorityOneRenders.length);
  await page.locator(PAIR + ' .lia-canvasplus-submit:visible').click();
  await page.waitForFunction(({ selector, previous, lineCount }) => {
    const output = document.querySelector(selector + ' .lia-canvasplus-output') as HTMLElement | null;
    const events = (window as any).__priorityOneRenders;
    return events.length > previous && output?.dataset.state === 'ready'
      && output.dataset.stale === '0' && output.dataset.lineCount === String(lineCount);
  }, { selector: PAIR, previous, lineCount }, { timeout: 10_000 });
  return renderedLines(page);
}

async function strokeState(page: Page): Promise<{ count: number; redo: number; lastPoints: number }> {
  return page.evaluate(selector => {
    const mount = document.querySelector(selector + ' .lia-canvas-mount[data-open="1"]');
    const uid = mount?.getAttribute('data-uid') || '';
    const state = (window as any).__LIA_CANVAS_OCR__.store[uid];
    const items = state?.ITEMS || [];
    return {
      count: items.length,
      redo: state?.REDO?.length || 0,
      lastPoints: items[items.length - 1]?.points?.length || 0,
    };
  }, PAIR);
}

async function dotDarkness(page: Page): Promise<number> {
  return page.locator(PAIR + ' canvas.lia-draw:visible').evaluate(node => {
    const canvas = node as HTMLCanvasElement;
    const context = canvas.getContext('2d')!;
    const x = Math.round(canvas.width * 0.46);
    const y = Math.round(canvas.height * 0.29);
    const pixels = context.getImageData(x - 3, y - 3, 7, 7).data;
    let darkness = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      darkness += (255 - (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3) * pixels[i + 3] / 255;
    }
    return darkness;
  });
}

export function registerPriorityOneBrowserRegression(): void {
  const requested = new Set(
    (process.env.LIA_BROWSER_PROJECTS ?? 'chromium,firefox,webkit')
      .split(',').map(value => value.trim().toLowerCase()).filter(Boolean),
  );
  for (const project of PROJECTS) {
    test(`current ${project.name}: priority-one dots, multiplication and persistent corrections`,
      { timeout: 120_000 }, async t => {
        if (!requested.has(project.name)) {
          t.skip('excluded by LIA_BROWSER_PROJECTS');
          return;
        }
        const browser = await project.browserType.launch({ headless: true });
        try {
          const harness = await createHarness(browser);
          try {
            const page = harness.page;
            await page.setViewportSize({ width: 1440, height: 1000 });
            await openCourse(harness, CALCULATION_QUIZ_COURSE_URL, PAIR + ' .lia-canvas-launch');
            // Course markup can precede its asynchronously loaded template script.
            await page.waitForFunction(() => Boolean((window as any).__LIA_CANVAS_OCR__),
              undefined, { timeout: 10_000 });
            await page.evaluate(selector => {
              const registry = (window as any).__LIA_CANVAS_OCR__;
              (window as any).__priorityOneResponses = [];
              (window as any).__priorityOneRenders = [];
              (window as any).__priorityOneRasters = [];
              document.querySelector(selector)!.addEventListener('lia:canvasplus-render', event => {
                (window as any).__priorityOneRenders.push((event as CustomEvent).detail);
              });
              (window as any).katex = {
                render(tex: string, target: HTMLElement) {
                  target.textContent = tex;
                  target.setAttribute('data-rendered-tex', tex);
                },
              };
              const ocr = {
                model: 'priority-one-integration-stub',
                cacheKey: 'priority-one-integration-stub',
                precision: 'fp32',
                task: 'image-to-text',
                outputKind: 'latex',
                inputProfile: 'formulanet-line-384',
                calculationSinglePass: true,
                ensureLoaded: async () => true,
                recognize: async (input: HTMLCanvasElement) => {
                  const context = input.getContext('2d', { willReadFrequently: true });
                  if (!context) throw new Error('OCR raster has no 2D context');
                  const pixels = context.getImageData(0, 0, input.width, input.height).data;
                  // The synthetic first line has two separated glyphs and a
                  // tapped central multiplication dot. Count their occupied
                  // x bands in the actual canvas handed to the OCR engine.
                  const bands: Array<{ start: number; end: number; pixels: number }> = [];
                  let band: { start: number; end: number; pixels: number } | null = null;
                  for (let x = 0; x < input.width; x++) {
                    let darkPixels = 0;
                    for (let y = 0; y < input.height; y++) {
                      const offset = (y * input.width + x) * 4;
                      if (pixels[offset + 3] > 128 &&
                        (pixels[offset] + pixels[offset + 1] + pixels[offset + 2]) / 3 < 180) darkPixels++;
                    }
                    if (darkPixels) {
                      if (!band) { band = { start: x, end: x, pixels: 0 }; bands.push(band); }
                      band.end = x;
                      band.pixels += darkPixels;
                    } else band = null;
                  }
                  (window as any).__priorityOneRasters.push({ width: input.width, height: input.height, bands });
                  const response = (window as any).__priorityOneResponses.shift();
                  if (typeof response !== 'string') throw new Error('unexpected uncached priority-one OCR call');
                  return response;
                },
              };
              registry.ocr = ocr;
              registry.canvasPlusOcr = ocr;
            }, PAIR);
            await page.locator(PAIR + ' .lia-canvas-launch:visible').click();
            await page.locator(PAIR + ' canvas.lia-draw:visible').waitFor({ state: 'visible' });

            await draw(page, [[0.20, 0.22], [0.27, 0.22], [0.20, 0.36], [0.27, 0.36]]);
            await draw(page, [[0.62, 0.22], [0.69, 0.22], [0.62, 0.36], [0.69, 0.36]]);
            const emptyDotDarkness = await dotDarkness(page);
            await draw(page, [[0.46, 0.29]]);
            assert.deepEqual(await strokeState(page), { count: 3, redo: 0, lastPoints: 1 });
            const paintedDotDarkness = await dotDarkness(page);
            assert.ok(paintedDotDarkness > emptyDotDarkness + 50, 'a tap must paint visible ink');

            const recognized = String.raw`a\times b=x`;
            const normalized = String.raw`a\cdot b=x`;
            await queueResponses(page, [recognized]);
            assert.deepEqual(await submit(page, 1), [normalized], 'scalar multiplication must use a dot and retain x');
            const firstBands = await page.evaluate(() => (window as any).__priorityOneRasters[0].bands);
            assert.equal(firstBands.length, 3, 'the OCR input must include the two glyphs and the tapped dot');
            assert.ok(firstBands[1].pixels > 0, 'the central dot must contain real dark pixels');

            await page.locator(PAIR + ' .lia-undo-btn:visible').click();
            const undone = await strokeState(page);
            assert.equal(undone.count, 2);
            assert.equal(undone.redo, 1);
            assert.ok(undone.lastPoints >= 2, 'undo restores the preceding full glyph');
            assert.ok(await dotDarkness(page) < paintedDotDarkness - 50, 'undo must remove the visible dot');
            await queueResponses(page, [recognized]);
            assert.deepEqual(await submit(page, 1), [normalized]);
            assert.equal(await page.evaluate(() => (window as any).__priorityOneRasters[1].bands.length), 2,
              'undo must also remove the dot from the actual OCR input');

            await page.locator(PAIR + ' .lia-redo-btn:visible').click();
            assert.deepEqual(await strokeState(page), { count: 3, redo: 0, lastPoints: 1 });
            assert.ok(await dotDarkness(page) > emptyDotDarkness + 50, 'redo must repaint the dot');
            await queueResponses(page, []);
            assert.deepEqual(await submit(page, 1), [normalized]);
            assert.equal(await page.evaluate(() => (window as any).__priorityOneRasters.length), 2,
              'redo must reuse the unchanged recognized line');

            const output = page.locator(PAIR + ' .lia-canvasplus-output');
            if (!await output.evaluate(node => (node as HTMLDetailsElement).open)) {
              await output.locator(':scope > summary.lia-canvasplus-result-toggle').click();
            }
            await output.locator('.lia-canvasplus-edit:visible').click();
            const correction = String.raw`a\cdot b=y`;
            await output.locator('.lia-canvasplus-inline-textarea').fill(correction);
            await output.locator('.lia-canvasplus-accept').click();
            await page.waitForFunction(selector =>
              document.querySelector(selector + ' .lia-canvasplus-output')?.getAttribute('data-result-source') === 'correction',
            PAIR, { timeout: 5_000 });
            assert.deepEqual(await renderedLines(page), [correction]);

            await draw(page, [[0.20, 0.63], [0.27, 0.63], [0.20, 0.77], [0.27, 0.77]]);
            await queueResponses(page, ['x=1']);
            assert.deepEqual(await submit(page, 2), [correction, 'x=1'],
              'an unchanged corrected line must survive adding a new line');
            assert.equal(await page.evaluate(() => (window as any).__priorityOneRasters.length), 3,
              'only the new line needs another OCR pass');

            await draw(page, [[0.23, 0.26], [0.25, 0.31]]);
            await queueResponses(page, ['a=2']);
            assert.deepEqual(await submit(page, 2), ['a=2', 'x=1'],
              'changing the corrected line itself must invalidate its old correction');
            assert.equal(await page.evaluate(() => (window as any).__priorityOneRasters.length), 4,
              'changing one line must retain the other line cache');
            assert.deepEqual(harness.modelRequests, [], 'synthetic integration tests must not download models');
            assertNoRuntimeErrors(harness, await snapshotDiagnostics(page));
          } finally {
            await harness.context.close();
          }
        } finally {
          await browser.close();
        }
      });
  }
}
