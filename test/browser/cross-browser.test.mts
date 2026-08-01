import assert from 'node:assert/strict';
import test from 'node:test';

import {
  chromium,
  firefox,
  webkit,
  type BrowserType,
  type Page,
} from 'playwright';

import {
  CANVAS_COURSE_URL,
  NO_CANVAS_COURSE_URL,
  assertNoRuntimeErrors,
  assertSyntheticDelivery,
  createHarness,
  hostDelay,
  openCourse,
  resetIdleDiagnostics,
  snapshotDiagnostics,
  withHostTimeout,
} from './support.mts';

const projects: Array<{ name: string; browserType: BrowserType }> = [
  { name: 'chromium', browserType: chromium },
  { name: 'firefox', browserType: firefox },
  { name: 'webkit', browserType: webkit },
];

const requestedProjects = new Set(
  (process.env.LIA_BROWSER_PROJECTS ?? 'chromium,firefox,webkit')
    .split(',')
    .map(value => value.trim().toLowerCase())
    .filter(Boolean),
);

async function canvasState(page: Page) {
  return withHostTimeout(
    page.evaluate(() => {
      const mount = document.querySelector('.lia-canvas-mount[data-open="1"]');
      const uid = mount?.getAttribute('data-uid') || '';
      const registry = window.__LIA_CANVAS_OCR__;
      const store = (registry && registry.store) || {};
      const state = store[uid] || {};
      const items = Array.isArray(state.ITEMS) ? state.ITEMS : [];
      const redo = Array.isArray(state.REDO) ? state.REDO : [];
      return {
        uid,
        itemCount: items.length,
        redoCount: redo.length,
        lastTool: items.length ? String(items[items.length - 1].tool || '') : '',
        bgMode: String(state.bgMode || ''),
      };
    }),
    'canvas store snapshot',
  );
}

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

async function navigateToSecondPageAndCaptureCleanup(page: Page) {
  await withHostTimeout(
    page.evaluate(() => {
      const nativeRemoveEventListener = EventTarget.prototype.removeEventListener;
      const removed = [];
      Object.defineProperty(window, '__liaCanvasRemovedListeners', {
        configurable: true,
        value: removed,
      });
      Object.defineProperty(window, '__liaCanvasRestoreRemoveEventListener', {
        configurable: true,
        value: () => {
          EventTarget.prototype.removeEventListener = nativeRemoveEventListener;
        },
      });
      EventTarget.prototype.removeEventListener = function(type, listener, options) {
        const target = this === document
          ? 'document'
          : this === window
            ? 'window'
            : null;
        if (target) removed.push({ target, type: String(type) });
        return nativeRemoveEventListener.call(this, type, listener, options);
      };
    }),
    'install listener cleanup probe',
  );

  assert.equal(new URL(page.url()).hash, '#1', 'the canvas page must start at #1');
  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  });
  await page.keyboard.press('ArrowRight');

  await withHostTimeout(
    page.waitForFunction(
      () =>
        location.hash === '#2' &&
        !document.querySelector('.lia-draw-wrap') &&
        /Second page/.test(document.body.textContent || ''),
      undefined,
      { timeout: 10_000 },
    ),
    'LiaScript navigation from #1 to #2',
    15_000,
  );

  const expected = [
    'document:lia:canvas-i18n-update',
    'document:lia-canvas-theme',
    'document:click',
    'document:keydown',
    'window:keydown',
    'window:keyup',
  ];
  await withHostTimeout(
    page.waitForFunction(
      expectedKeys => {
        const actual = new Set(
          (window.__liaCanvasRemovedListeners || []).map(
            entry => entry.target + ':' + entry.type,
          ),
        );
        return expectedKeys.every(key => actual.has(key));
      },
      expected,
      { timeout: 10_000 },
    ),
    'canvas listener cleanup after LiaScript navigation',
    15_000,
  );

  return withHostTimeout(
    page.evaluate(() => {
      const removed = [...(window.__liaCanvasRemovedListeners || [])];
      window.__liaCanvasRestoreRemoveEventListener?.();
      return removed;
    }),
    'read listener cleanup probe',
  );
}

for (const project of projects) {
  test(
    `current ${project.name} smoke: lazy init, live theme, drawing and OCR binding`,
    { timeout: 180_000 },
    async t => {
      if (!requestedProjects.has(project.name)) {
        t.skip(`excluded by LIA_BROWSER_PROJECTS=${[...requestedProjects].join(',')}`);
        return;
      }

      let browser;
      try {
        browser = await project.browserType.launch({ headless: true });
      } catch (error) {
        throw new Error(
          `Could not launch Playwright ${project.name}. Run ` +
          `"npx playwright install ${project.name}".\n${String(error)}`,
        );
      }

      try {
        const lazyHarness = await createHarness(browser);
        try {
          await openCourse(lazyHarness, NO_CANVAS_COURSE_URL);
          await hostDelay(750);
          const diagnostics = await snapshotDiagnostics(lazyHarness.page);
          const lazyState = await withHostTimeout(
            lazyHarness.page.evaluate(() => ({
              pairCount: document.querySelectorAll('.lia-canvas-pair').length,
              canvasCount: document.querySelectorAll('canvas.lia-draw').length,
              cssInjected: Boolean(document.getElementById('__lia_canvas_ocr_css_v2')),
              barBoot: Boolean(window.__LIA_CANVAS_OCR__?.barBoot),
              canvasBoot: Boolean(window.__LIA_CANVAS_OCR__?.canvasBoot),
              ocrCreated: Boolean(window.__LIA_CANVAS_OCR__?.ocr),
            })),
            'cross-browser lazy state',
          );

          assertSyntheticDelivery(lazyHarness, NO_CANVAS_COURSE_URL);
          assert.equal(diagnostics.runawayStopped, false);
          assert.deepEqual(lazyState, {
            pairCount: 0,
            canvasCount: 0,
            cssInjected: false,
            barBoot: false,
            canvasBoot: false,
            ocrCreated: false,
          });
          assert.deepEqual(lazyHarness.modelRequests, []);
          assertNoRuntimeErrors(lazyHarness, diagnostics);
        } finally {
          await lazyHarness.context.close();
        }

        const harness = await createHarness(browser, {
          hasTouch: project.name === 'chromium',
        });
        try {
          await openCourse(harness, CANVAS_COURSE_URL, '.lia-canvas-launch');
          const page = harness.page;
          const launcher = page.locator('.lia-canvas-launch:visible').first();
          await launcher.waitFor({ state: 'visible', timeout: 30_000 });

          assert.equal(
            await page.locator('canvas.lia-draw').count(),
            0,
            'the drawing surface must be created only after opening it',
          );
          assert.deepEqual(harness.modelRequests, []);

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
          await hostDelay(150);

          let state = await canvasState(page);
          assert.equal(state.itemCount, 1);
          assert.equal(state.lastTool, 'pen');

          const undo = page.locator('.lia-undo-btn:visible').first();
          const redo = page.locator('.lia-redo-btn:visible').first();
          assert.equal(await undo.isEnabled(), true);
          await undo.click();
          state = await canvasState(page);
          assert.equal(state.itemCount, 0);
          assert.equal(state.redoCount, 1);
          assert.equal(await redo.isEnabled(), true);
          await redo.click();
          state = await canvasState(page);
          assert.equal(state.itemCount, 1);

          const eraser = page.locator('.lia-eraser-btn:visible').first();
          await eraser.click();
          assert.equal(await eraser.getAttribute('data-active'), '1');
          await page.keyboard.press('Escape');
          await drawMouseStroke(
            page,
            box.x + box.width * 0.45,
            box.y + box.height * 0.35,
            box.x + box.width * 0.55,
            box.y + box.height * 0.55,
          );
          state = await canvasState(page);
          assert.equal(state.itemCount, 2);
          assert.equal(state.lastTool, 'eraser');

          await page.locator('.lia-bgmenu-btn:visible').first().click();
          await page.locator('.lia-bg-tile[data-mode="grid"]:visible').first().click();
          state = await canvasState(page);
          assert.equal(state.bgMode, 'grid');

          if (project.name === 'chromium') {
            await page.touchscreen.tap(
              box.x + box.width * 0.75,
              box.y + box.height * 0.25,
            );
            await hostDelay(100);
            assert.equal((await canvasState(page)).lastTool, 'eraser');
          }

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

          const itemsBeforeTheme = (await canvasState(page)).itemCount;
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
          const themeTransition = await snapshotDiagnostics(page);
          assert.ok(themeTransition.themeEvents >= 1 && themeTransition.themeEvents <= 2);
          assert.ok(
            themeTransition.rootCanvasWrites >= 1 &&
            themeTransition.rootCanvasWrites <= 5,
            `unexpected theme write count: ${themeTransition.rootCanvasWrites}`,
          );
          assert.equal((await canvasState(page)).itemCount, itemsBeforeTheme);

          await resetIdleDiagnostics(page);
          await hostDelay(1_000);
          const themeIdle = await snapshotDiagnostics(page);
          assert.equal(themeIdle.rootStyleMutations, 0);
          assert.equal(themeIdle.rootCanvasWrites, 0);
          assert.equal(themeIdle.themeEvents, 0);

          const realOcrEngineApi = await page.evaluate(() => {
            const ocr = window.__LIA_CANVAS_OCR__?.ocr as any;
            return {
              model: String(ocr?.model || ''),
              task: String(ocr?.task || ''),
              hasEnsureLoaded: typeof ocr?.ensureLoaded === 'function',
              hasRecognize: typeof ocr?.recognize === 'function',
            };
          });
          assert.ok(realOcrEngineApi.model, 'the lazy OCR engine has no model');
          assert.equal(realOcrEngineApi.task, 'image-to-text');
          assert.equal(realOcrEngineApi.hasEnsureLoaded, true);
          assert.equal(realOcrEngineApi.hasRecognize, true);

          await page.evaluate(() => {
            window.__LIA_CANVAS_OCR__.ocr = {
              model: 'stub-model',
              ensureLoaded: async () => true,
              recognize: async () => '42',
            };
          });
          await page.locator('.lia-rect-btn:visible').first().click();
          await drawMouseStroke(
            page,
            box.x + box.width * 0.12,
            box.y + box.height * 0.15,
            box.x + box.width * 0.86,
            box.y + box.height * 0.8,
          );

          const submit = page.locator('.lia-rect-action:visible').first();
          await submit.waitFor({ state: 'visible', timeout: 5_000 });
          await submit.click();
          await page.waitForFunction(
            () => Array.from(
              document.querySelectorAll('input, textarea, [contenteditable="true"]'),
            ).some(element => {
              const value = 'value' in element ? element.value : element.textContent;
              return String(value || '').trim() === '42';
            }),
            undefined,
            { timeout: 10_000 },
          );

          const stateBeforeNavigation = await canvasState(page);
          const removedListeners = await navigateToSecondPageAndCaptureCleanup(page);
          const removedListenerKeys = new Set(
            removedListeners.map(entry => entry.target + ':' + entry.type),
          );
          for (const expected of [
            'document:lia:canvas-i18n-update',
            'document:lia-canvas-theme',
            'document:click',
            'document:keydown',
            'window:keydown',
            'window:keyup',
          ]) {
            assert.ok(
              removedListenerKeys.has(expected),
              'cleanup did not remove ' + expected,
            );
          }

          await resetIdleDiagnostics(page);
          await hostDelay(1_000);
          const finalDiagnostics = await snapshotDiagnostics(page);
          t.diagnostic(JSON.stringify({
            project: project.name,
            browser: browser.version(),
            themeTransition,
            finalDiagnostics,
            stateBeforeNavigation,
            removedListeners,
          }, null, 2));

          assertSyntheticDelivery(harness, CANVAS_COURSE_URL);
          assert.equal(finalDiagnostics.runawayStopped, false);
          assert.equal(finalDiagnostics.rootCanvasWrites, 0);
          assert.equal(finalDiagnostics.themeEvents, 0);
          assert.ok(
            finalDiagnostics.longTaskCount <= 1 &&
            finalDiagnostics.longTaskDuration < 500,
          );
          assert.deepEqual(harness.modelRequests, []);
          assertNoRuntimeErrors(harness, finalDiagnostics);
        } finally {
          await harness.context.close();
        }
      } finally {
        await browser.close();
      }
    },
  );
}
