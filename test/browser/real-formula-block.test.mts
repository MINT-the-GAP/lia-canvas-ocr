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

type Point = readonly [number, number];
type Glyph = readonly (readonly Point[])[];

const GLYPHS: Record<string, Glyph> = {
  '1': [[[0.20, 0.20], [0.55, 0.00], [0.55, 1.00]]],
  '2': [[[0.10, 0.20], [0.30, 0.00], [0.75, 0.00], [0.95, 0.22], [0.78, 0.48], [0.10, 1.00], [0.95, 1.00]]],
  '3': [[[0.08, 0.06], [0.62, 0.00], [0.92, 0.20], [0.72, 0.42], [0.40, 0.50], [0.73, 0.55], [0.98, 0.78], [0.72, 0.98], [0.08, 0.94]]],
  '4': [
    [[0.72, 0.00], [0.72, 1.00]],
    [[0.72, 0.00], [0.08, 0.66], [1.00, 0.66]],
  ],
  '5': [[[0.95, 0.02], [0.15, 0.02], [0.10, 0.45], [0.63, 0.41], [0.94, 0.58], [0.84, 0.88], [0.10, 0.98]]],
  '6': [[[0.84, 0.04], [0.48, 0.00], [0.17, 0.28], [0.10, 0.67], [0.24, 0.94], [0.53, 1.00], [0.84, 0.82], [0.80, 0.57], [0.57, 0.44], [0.27, 0.50], [0.11, 0.68]]],
  '7': [[[0.05, 0.02], [0.96, 0.02], [0.44, 1.00]]],
  '8': [[[0.50, 0.50], [0.19, 0.35], [0.22, 0.09], [0.50, 0.00], [0.79, 0.10], [0.81, 0.35], [0.50, 0.50], [0.19, 0.68], [0.22, 0.92], [0.50, 1.00], [0.81, 0.90], [0.80, 0.65], [0.50, 0.50]]],
  '9': [[[0.16, 0.96], [0.52, 1.00], [0.83, 0.72], [0.90, 0.33], [0.76, 0.06], [0.47, 0.00], [0.16, 0.18], [0.20, 0.43], [0.43, 0.56], [0.73, 0.50], [0.89, 0.32]]],
  'x': [
    [[0.10, 0.10], [0.90, 0.90]],
    [[0.90, 0.10], [0.10, 0.90]],
  ],
  '-': [[[0.05, 0.52], [0.95, 0.52]]],
  '=': [
    [[0.05, 0.38], [0.95, 0.38]],
    [[0.05, 0.66], [0.95, 0.66]],
  ],
  '+': [
    [[0.05, 0.52], [0.95, 0.52]],
    [[0.50, 0.08], [0.50, 0.94]],
  ],
  ':': [
    [[0.50, 0.18], [0.50, 0.32]],
    [[0.50, 0.68], [0.50, 0.82]],
  ],
  '/': [[[0.82, 0.00], [0.18, 1.00]]],
  '|': [[[0.50, -0.10], [0.50, 1.10]]],
};

async function drawStroke(page: Page, points: Array<{ x: number; y: number }>) {
  await page.mouse.move(points[0].x, points[0].y);
  await page.mouse.down();
  for (let index = 1; index < points.length; index++) {
    await page.mouse.move(points[index].x, points[index].y, { steps: 5 });
  }
  await page.mouse.up();
}

async function drawFormulaLine(
  page: Page,
  text: string,
  startX: number,
  startY: number,
  height = 52,
) {
  const glyphWidth = height * 0.62;
  let cursor = startX;
  for (const char of text) {
    if (char === ' ') {
      cursor += glyphWidth * 0.45;
      continue;
    }
    const glyph = GLYPHS[char];
    if (!glyph) throw new Error(`missing test glyph: ${char}`);
    for (const stroke of glyph) {
      await drawStroke(page, stroke.map(([x, y]) => ({
        x: cursor + x * glyphWidth,
        y: startY + y * height,
      })));
    }
    cursor += glyphWidth + height * (char === '|' ? 0.34 : 0.16);
  }
}

test(
  'real FormulaNet keeps a hookless operation bar distinct from hooked ones',
  { timeout: 12 * 60_000 },
  async () => {
    const context = await chromium.launchPersistentContext(
      join(tmpdir(), 'lia-canvas-real-math-profile'),
      {
        colorScheme: 'light',
        headless: true,
        serviceWorkers: 'block',
        viewport: { width: 1280, height: 900 },
      },
    );
    const harness = await createHarness(null, { context });
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

      const x = box.x + box.width * 0.10;
      const glyphHeight = Math.min(42, box.height * 0.16);
      await drawFormulaLine(
        harness.page,
        '8x-7=11 | +7',
        x,
        box.y + box.height * 0.10,
        glyphHeight,
      );
      await drawFormulaLine(
        harness.page,
        '8x=18 | :8',
        x + box.width * 0.08,
        box.y + box.height * 0.42,
        glyphHeight,
      );
      await drawFormulaLine(
        harness.page,
        'x=9/4',
        x + box.width * 0.28,
        box.y + box.height * 0.74,
        glyphHeight,
      );

      await pair.locator('.lia-canvasplus-submit:visible').click();
      await harness.page.waitForFunction(
        selector => {
          const output = document.querySelector(
            selector + ' .lia-canvasplus-output',
          ) as HTMLElement | null;
          return output?.dataset.state === 'ready' &&
            output?.dataset.analysisState === 'ready';
        },
        '.lia-canvas-pair[data-canvas-mode=plus]',
        { timeout: 10 * 60_000 },
      );

      const result = await pair.evaluate(element => {
        const output = element.querySelector(
          '.lia-canvasplus-output',
        ) as HTMLElement | null;
        const transitions = Array.from(element.querySelectorAll(
          '.lia-canvasplus-transition',
        )).map(node => ({
          verdict: (node as HTMLElement).dataset.verdict || '',
          code: (node as HTMLElement).dataset.code || '',
        }));
        return {
          latex: output?.dataset.latex || '',
          lineCount: output?.dataset.lineCount || '',
          transitions,
          rawLines: Array.from(element.querySelectorAll(
            '.lia-canvasplus-equation-row',
          )).map(node => (node as HTMLElement).dataset.lineTex || ''),
        };
      });

      console.log(JSON.stringify({
        result,
        modelRequests: harness.modelRequests,
        consoleErrors: harness.consoleErrors,
        pageErrors: harness.pageErrors,
      }, null, 2));

      assert.equal(result.lineCount, '3');
      assert.equal(result.transitions.length, 2);
      assert.deepEqual(
        result.transitions.map(item => item.verdict),
        ['correct', 'correct'],
      );
      assert.deepEqual(
        result.transitions.map(item => item.code),
        ['operation-applied-both-sides', 'operation-applied-both-sides'],
      );
      assert.equal((result.latex.match(/\\mid/g) || []).length, 2);
      assert.equal(result.latex.includes('181:8'), false);
      assert.equal(result.latex.includes('181.8'), false);
      assert.equal(result.latex.includes(';'), false);
      assert.match(result.latex, /\\mid\s*:\s*8/);
      assert.deepEqual(harness.pageErrors, []);
    } finally {
      await harness.context.close();
    }
  },
);
