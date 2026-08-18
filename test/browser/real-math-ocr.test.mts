import assert from 'node:assert/strict';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';

import { chromium, type Page } from 'playwright';

import {
  CALCULATION_QUIZ_COURSE_URL,
  createHarness,
  openCourse,
} from './support.mts';

async function drawStroke(
  page: Page,
  points: Array<{ x: number; y: number }>,
): Promise<void> {
  assert.ok(points.length >= 2);
  await page.mouse.move(points[0].x, points[0].y);
  await page.mouse.down();
  for (let index = 1; index < points.length; index++) {
    await page.mouse.move(points[index].x, points[index].y, { steps: 8 });
  }
  await page.mouse.up();
}

test(
  'opt-in real FormulaNet OCR recognizes a handwritten x=4 line',
  { timeout: 20 * 60_000 },
  async () => {
    const context = await chromium.launchPersistentContext(
      join(tmpdir(), 'lia-canvas-real-math-profile'),
      {
        args: ['--enable-unsafe-webgpu'],
        colorScheme: 'light',
        headless: true,
        serviceWorkers: 'block',
        viewport: { width: 1280, height: 900 },
      },
    );
    const harness = await createHarness(null, { context });
    const httpErrors: Array<{ status: number; url: string }> = [];
    harness.page.on('response', response => {
      if (response.status() >= 400) {
        httpErrors.push({ status: response.status(), url: response.url() });
      }
    });
    try {
      await openCourse(
        harness,
        CALCULATION_QUIZ_COURSE_URL,
        '.lia-canvas-pair[data-canvas-mode=plus][data-canvas-output=answer]',
      );
      const pair = harness.page.locator(
        '.lia-canvas-pair[data-canvas-mode=plus][data-canvas-output=answer]',
      ).first();
      await pair.locator('.lia-canvas-launch:visible').click();
      const canvas = pair.locator('canvas.lia-draw:visible');
      await canvas.waitFor({ state: 'visible', timeout: 10_000 });
      const box = await canvas.boundingBox();
      assert.ok(box);

      const centerY = box.y + box.height * 0.48;
      const glyphHeight = Math.min(90, box.height * 0.30);
      const startX = box.x + box.width * 0.30;

      await drawStroke(harness.page, [
        { x: startX, y: centerY - glyphHeight / 2 },
        { x: startX + glyphHeight * 0.65, y: centerY + glyphHeight / 2 },
      ]);
      await drawStroke(harness.page, [
        { x: startX + glyphHeight * 0.65, y: centerY - glyphHeight / 2 },
        { x: startX, y: centerY + glyphHeight / 2 },
      ]);

      const equalsX = startX + glyphHeight * 1.10;
      await drawStroke(harness.page, [
        { x: equalsX, y: centerY - glyphHeight * 0.17 },
        { x: equalsX + glyphHeight * 0.70, y: centerY - glyphHeight * 0.17 },
      ]);
      await drawStroke(harness.page, [
        { x: equalsX, y: centerY + glyphHeight * 0.17 },
        { x: equalsX + glyphHeight * 0.70, y: centerY + glyphHeight * 0.17 },
      ]);

      const fourX = equalsX + glyphHeight * 1.15;
      await drawStroke(harness.page, [
        { x: fourX + glyphHeight * 0.48, y: centerY - glyphHeight / 2 },
        { x: fourX + glyphHeight * 0.48, y: centerY + glyphHeight / 2 },
      ]);
      await drawStroke(harness.page, [
        { x: fourX + glyphHeight * 0.48, y: centerY - glyphHeight / 2 },
        { x: fourX, y: centerY + glyphHeight * 0.10 },
        { x: fourX + glyphHeight * 0.72, y: centerY + glyphHeight * 0.10 },
      ]);

      await pair.locator('.lia-canvasplus-submit:visible').click();
      await harness.page.waitForFunction(
        selector => {
          const output = document.querySelector(
            selector + ' .lia-canvasplus-output',
          ) as HTMLElement | null;
          return output?.dataset.state === 'ready' ||
            output?.dataset.state === 'error';
        },
        '.lia-canvas-pair[data-canvas-mode=plus][data-canvas-output=answer]',
        { timeout: 15 * 60_000 },
      );

      const result = await pair.evaluate(element => {
        const registry = (window as any).__LIA_CANVAS_OCR__;
        const output = element.querySelector(
          '.lia-canvasplus-output',
        ) as HTMLElement | null;
        return {
          state: output?.dataset.state || '',
          latex: output?.dataset.latex || '',
          engine: {
            model: registry?.canvasPlusOcr?.model || '',
            revision: registry?.canvasPlusOcr?.modelRevision || '',
            backend: registry?.canvasPlusOcr?.backend || '',
            precision: registry?.canvasPlusOcr?.precision || '',
            lastError: registry?.canvasPlusOcr?.lastError || '',
            lastOutput: registry?.canvasPlusOcr?.lastOutput || '',
            lastText: registry?.canvasPlusOcr?.lastText || '',
          },
          canvasError: registry?.lastCanvasPlusError || '',
        };
      });
      console.log(JSON.stringify({
        result,
        modelRequests: harness.modelRequests,
        httpErrors,
        requestFailures: harness.requestFailures,
        consoleErrors: harness.consoleErrors,
        pageErrors: harness.pageErrors,
      }, null, 2));

      assert.equal(result.state, 'ready');
      assert.ok(result.latex.trim(), 'the real model returned an empty result');
      assert.equal(result.engine.model, 'alephpi/FormulaNet');
      assert.equal(
        result.engine.revision,
        '63e04c86fc96c2324811114351eeea8118bf6b28',
      );
      assert.deepEqual(harness.pageErrors, []);
    } finally {
      await harness.context.close();
    }
  },
);
