import assert from 'node:assert/strict';
import test from 'node:test';

import { chromium, type Page } from 'playwright';

import {
  CANVAS_COURSE_URL,
  CHROMIUM_131_EXECUTABLE_PATH,
  NO_CANVAS_COURSE_URL,
  assertNoRuntimeErrors,
  assertSyntheticDelivery,
  createHarness,
  hostDelay,
  openCourse,
  pathExists,
  resetIdleDiagnostics,
  snapshotDiagnostics,
  withHostTimeout,
} from './support.mts';

async function drawMouseStroke(page: Page, x1: number, y1: number, x2: number, y2: number) {
  await page.mouse.move(x1, y1);
  await page.mouse.down();
  for (let step = 1; step <= 8; step += 1) {
    await page.mouse.move(
      x1 + ((x2 - x1) * step) / 8,
      y1 + ((y2 - y1) * step) / 8,
    );
  }
  await page.mouse.up();
}

test(
  'Chromium 131 stays responsive and reaches mutation idle for 30 seconds',
  { timeout: 180_000 },
  async t => {
    if (!(await pathExists(CHROMIUM_131_EXECUTABLE_PATH))) {
      throw new Error(
        'Chrome/Chromium 131 is required. Set CHROMIUM_131_EXECUTABLE_PATH ' +
        'to its executable before running this regression test.',
      );
    }

    const browser = await chromium.launch({
      executablePath: CHROMIUM_131_EXECUTABLE_PATH,
      headless: true,
      args: [
        '--disable-background-timer-throttling',
        '--disable-renderer-backgrounding',
      ],
    });

    try {
      assert.match(
        browser.version(),
        /^131\./,
        `expected Chromium 131, got ${browser.version()}`,
      );

      const harness = await createHarness(browser);
      try {
        await openCourse(harness, NO_CANVAS_COURSE_URL);
        await hostDelay(1_500);
        const initial = await snapshotDiagnostics(harness.page);

        await resetIdleDiagnostics(harness.page);
        const idleStartedAt = Date.now();
        await hostDelay(30_000);
        const idle = await snapshotDiagnostics(harness.page);
        const idleElapsed = Date.now() - idleStartedAt;

        const clicks = await withHostTimeout(
          harness.page.evaluate(() => {
            const probe = document.createElement('button');
            probe.id = 'lia-canvas-responsiveness-probe';
            probe.style.cssText =
              'position:fixed;left:8px;top:8px;z-index:2147483647;width:80px;height:40px';
            probe.addEventListener('click', () => {
              probe.dataset.clicks = String(Number(probe.dataset.clicks || 0) + 1);
            });
            document.body.appendChild(probe);
            return true;
          }).then(async () => {
            await harness.page.locator('#lia-canvas-responsiveness-probe').click({
              timeout: 3_000,
            });
            return harness.page
              .locator('#lia-canvas-responsiveness-probe')
              .getAttribute('data-clicks');
          }),
          'post-idle pointer interaction',
          5_000,
        );

        const lazyState = await withHostTimeout(
          harness.page.evaluate(() => ({
            pairCount: document.querySelectorAll('.lia-canvas-pair').length,
            canvasCount: document.querySelectorAll('canvas.lia-draw').length,
            cssInjected: Boolean(document.getElementById('__lia_canvas_ocr_css_v2')),
            barBoot: Boolean(window.__LIA_CANVAS_OCR__?.barBoot),
            canvasBoot: Boolean(window.__LIA_CANVAS_OCR__?.canvasBoot),
            ocrCreated: Boolean(window.__LIA_CANVAS_OCR__?.ocr),
          })),
          'lazy initialization snapshot',
        );

        t.diagnostic(JSON.stringify({
          browser: browser.version(),
          idleElapsed,
          initial,
          idle,
          lazyState,
        }, null, 2));

        assertSyntheticDelivery(harness, NO_CANVAS_COURSE_URL);
        assert.equal(
          initial.runawayStopped,
          false,
          'the safety cutoff detected a runaway root-style mutation loop',
        );
        assert.ok(idleElapsed >= 30_000, 'the host-side stability window was too short');
        assert.equal(idle.rootStyleMutations, 0, 'root style mutations did not become idle');
        assert.equal(idle.rootCanvasWrites, 0, 'canvas CSS variables were rewritten while idle');
        assert.equal(idle.themeEvents, 0, 'theme events continued while idle');
        assert.ok(
          idle.domMutationRecords <= 2,
          `DOM did not settle: ${idle.domMutationRecords} mutation records`,
        );
        assert.ok(
          idle.longTaskCount <= 1 && idle.longTaskDuration < 500,
          `long-task activity continued while idle: ${JSON.stringify(idle)}`,
        );
        assert.equal(clicks, '1', 'the page did not process a pointer click after 30 seconds');
        assert.deepEqual(lazyState, {
          pairCount: 0,
          canvasCount: 0,
          cssInjected: false,
          barBoot: false,
          canvasBoot: false,
          ocrCreated: false,
        });
        assert.deepEqual(
          harness.modelRequests,
          [],
          'OCR/model resources must not load without a canvas',
        );
        assertNoRuntimeErrors(harness, idle);
      } finally {
        await harness.context.close();
      }

      const activeHarness = await createHarness(browser);
      try {
        await openCourse(activeHarness, CANVAS_COURSE_URL, '.lia-canvas-launch');
        const page = activeHarness.page;
        const launcher = page.locator('.lia-canvas-launch:visible').first();
        await launcher.waitFor({ state: 'visible', timeout: 30_000 });
        await launcher.click({ timeout: 5_000 });

        const canvas = page.locator('canvas.lia-draw:visible').first();
        await canvas.waitFor({ state: 'visible', timeout: 10_000 });
        await page.waitForFunction(
          () => document.querySelector('canvas.lia-draw')?.hasAttribute('data-ready'),
          undefined,
          { timeout: 10_000 },
        );
        const box = await canvas.boundingBox();
        assert.ok(box && box.width > 100 && box.height > 100, 'canvas has no usable size');

        await drawMouseStroke(
          page,
          box.x + box.width * 0.25,
          box.y + box.height * 0.35,
          box.x + box.width * 0.65,
          box.y + box.height * 0.6,
        );
        const undo = page.locator('.lia-undo-btn:visible').first();
        const redo = page.locator('.lia-redo-btn:visible').first();
        assert.equal(await undo.isEnabled(), true, 'drawn stroke was not undoable');

        await page.addStyleTag({
          content: [
            'html.lia-canvas-test-light body { background-color: rgb(255,255,255) !important; }',
            'html.lia-canvas-test-dark body { background-color: rgb(0,0,0) !important; }',
          ].join('\n'),
        });
        await page.evaluate(() => {
          document.documentElement.classList.remove('lia-canvas-test-dark');
          document.documentElement.classList.add('lia-canvas-test-light');
        });
        await page.waitForFunction(
          () => document.documentElement.style.getPropertyValue('--canvas-border').trim() === '#000',
          undefined,
          { timeout: 5_000 },
        );

        await resetIdleDiagnostics(page);
        await page.evaluate(() => {
          document.documentElement.classList.replace(
            'lia-canvas-test-light',
            'lia-canvas-test-dark',
          );
        });
        await page.waitForFunction(
          () => document.documentElement.style.getPropertyValue('--canvas-border').trim() === '#fff',
          undefined,
          { timeout: 5_000 },
        );
        const activeThemeTransition = await snapshotDiagnostics(page);
        assert.ok(
          activeThemeTransition.themeEvents >= 1 &&
          activeThemeTransition.themeEvents <= 2,
          'live theme transition dispatched an unexpected event count',
        );
        assert.ok(
          activeThemeTransition.rootCanvasWrites >= 1 &&
          activeThemeTransition.rootCanvasWrites <= 5,
          'live theme transition wrote an unexpected number of root variables',
        );

        await hostDelay(1_000);
        await resetIdleDiagnostics(page);
        const activeIdleStartedAt = Date.now();
        await hostDelay(30_000);
        const activeIdle = await snapshotDiagnostics(page);
        const activeIdleElapsed = Date.now() - activeIdleStartedAt;
        const activeBorder = await withHostTimeout(
          page.evaluate(() =>
            document.documentElement.style.getPropertyValue('--canvas-border').trim()
          ),
          'active canvas theme snapshot',
        );

        await undo.click({ timeout: 3_000 });
        assert.equal(await redo.isEnabled(), true, 'undo failed after the idle window');
        await redo.click({ timeout: 3_000 });
        assert.equal(await undo.isEnabled(), true, 'redo failed after the idle window');
        const postInteraction = await snapshotDiagnostics(page);

        t.diagnostic(JSON.stringify({
          browser: browser.version(),
          activeIdleElapsed,
          activeThemeTransition,
          activeIdle,
          activeBorder,
        }, null, 2));

        assertSyntheticDelivery(activeHarness, CANVAS_COURSE_URL);
        assert.ok(
          activeIdleElapsed >= 30_000,
          'the active-canvas stability window was too short',
        );
        assert.equal(
          activeIdle.runawayStopped,
          false,
          'the active canvas hit the mutation-loop safety cutoff',
        );
        assert.equal(
          activeIdle.rootStyleMutations,
          0,
          'active-canvas root style mutations did not become idle',
        );
        assert.equal(
          activeIdle.rootCanvasWrites,
          0,
          'active-canvas root variables were rewritten while idle',
        );
        assert.equal(
          activeIdle.themeEvents,
          0,
          'active-canvas theme events continued while idle',
        );
        assert.ok(
          activeIdle.domMutationRecords <= 2,
          'active canvas DOM did not settle',
        );
        assert.ok(
          activeIdle.longTaskCount <= 1 && activeIdle.longTaskDuration < 500,
          'active canvas produced continuing long-task activity',
        );
        assert.equal(activeBorder, '#fff', 'the live dark theme was not retained');
        assert.deepEqual(activeHarness.modelRequests, []);
        assertNoRuntimeErrors(activeHarness, postInteraction);
      } finally {
        await activeHarness.context.close();
      }
    } finally {
      await browser.close();
    }
  },
);
