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
  CALCULATION_QUIZ_COURSE_URL,
  CANVAS_COURSE_URL,
  CANVAS_MIXED_COURSE_URL,
  MULTI_INSTANCE_COURSE_URL,
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
import { registerColumnAdditionBrowserRegression } from './column-addition-regression.mts';
import { registerWrittenArithmeticBrowserRegression } from './written-arithmetic-regression.mts';

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

const CALCULATION_LOCALE_TEXT = {
  en: {
    launcherOpen: 'Open calculation block',
    launcherClose: 'Close calculation block',
    submit: 'Submit to render',
    edit: 'Edit recognition',
    title: 'Rendered calculation block',
    summary: '2 transitions: 2 correct, 0 incorrect, 0 not checked.',
    path: 'Checked calculation path',
    transition: 'Correct',
    transitionAria: 'Transition from line 1 to line 2: correct.',
    detail: 'The stated transformation was applied to both sides.',
    toolbar: {
      undo: 'Undo',
      redo: 'Redo',
      pen: 'Pen',
      eraser: 'Eraser',
      background: 'Background',
      selection: 'Select render area',
      drawingArea: 'Drawing area',
      tools: 'Tools',
      closeMenu: 'Close menu',
      clearAll: 'Clear all',
      penWidth: 'Pen width',
      opacity: 'Opacity',
      eraserWidth: 'Eraser width',
      noBackground: 'No background',
      grid: 'Grid',
      lined: 'Lined',
      spacing: 'Spacing',
      backgroundSpacing: 'Background spacing',
    },
  },
  de: {
    launcherOpen: 'Rechenblock öffnen',
    launcherClose: 'Rechenblock schließen',
    submit: 'Rechenblock erkennen und darstellen',
    edit: 'Erkennung bearbeiten',
    title: 'Erkanntes Ergebnis',
    summary: '2 Übergänge: 2 richtig, 0 falsch, 0 nicht sicher prüfbar.',
    path: 'Geprüfter Rechenweg',
    transition: 'Richtig',
    transitionAria: 'Übergang von Zeile 1 zu Zeile 2: richtig.',
    detail: 'Die angegebene Umformung wurde auf beide Seiten angewendet.',
    toolbar: {
      undo: 'Rückgängig',
      redo: 'Wiederholen',
      pen: 'Stift',
      eraser: 'Radierer',
      background: 'Hintergrund',
      selection: 'Darstellungsbereich auswählen',
      drawingArea: 'Zeichenfläche',
      tools: 'Werkzeuge',
      closeMenu: 'Menü schließen',
      clearAll: 'Alles löschen',
      penWidth: 'Stiftbreite',
      opacity: 'Deckkraft',
      eraserWidth: 'Radiererbreite',
      noBackground: 'Kein Hintergrund',
      grid: 'Raster',
      lined: 'Liniert',
      spacing: 'Abstand',
      backgroundSpacing: 'Hintergrundabstand',
    },
  },
} as const;

type CalculationLocaleText =
  (typeof CALCULATION_LOCALE_TEXT)[keyof typeof CALCULATION_LOCALE_TEXT];

async function setCanvasLocale(page: Page, lang: 'de' | 'en'): Promise<void> {
  const detail = await withHostTimeout(
    page.evaluate(targetLang => new Promise<{ lang: string; reason: string }>(
      (resolve, reject) => {
        const expectedLang = targetLang.toLowerCase();
        let timeout = 0;
        const onUpdate = (event: Event) => {
          const eventDetail = (event as CustomEvent<{
            lang?: string;
            reason?: string;
          }>).detail;
          if (String(eventDetail?.lang || '').toLowerCase() !== expectedLang ||
              eventDetail?.reason !== 'lang-change') {
            return;
          }
          window.clearTimeout(timeout);
          document.removeEventListener('lia:canvas-i18n-update', onUpdate);
          window.requestAnimationFrame(() => resolve({
            lang: String(eventDetail.lang),
            reason: String(eventDetail.reason),
          }));
        };
        document.addEventListener('lia:canvas-i18n-update', onUpdate);
        timeout = window.setTimeout(() => {
          document.removeEventListener('lia:canvas-i18n-update', onUpdate);
          reject(new Error('Timed out waiting for lia:canvas-i18n-update: ' + expectedLang));
        }, 5_000);
        document.documentElement.lang = targetLang;
      }
    ), lang),
    `switch Canvas OCR locale to ${lang}`,
    6_000,
  );
  assert.deepEqual(detail, { lang, reason: 'lang-change' });
}

async function assertCalculationToolbarLocale(
  page: Page,
  pairSelector: string,
  expected: CalculationLocaleText['toolbar'],
): Promise<void> {
  const pair = page.locator(pairSelector);
  assert.deepEqual(
    await pair.evaluate(node => {
      const button = (selector: string) => {
        const element = node.querySelector<HTMLElement>(selector);
        return {
          aria: element?.getAttribute('aria-label') || '',
          title: element?.title || '',
        };
      };
      return {
        undo: button('.lia-undo-btn'),
        redo: button('.lia-redo-btn'),
        pen: button('.lia-color-btn'),
        eraser: button('.lia-eraser-btn'),
        background: button('.lia-bgmenu-btn'),
        selection: button('.lia-rect-btn'),
        drawingArea: node.querySelector('canvas.lia-draw')?.getAttribute('aria-label') || '',
        tools: node.querySelector('.lia-tool-menu')?.getAttribute('aria-label') || '',
      };
    }),
    {
      undo: { aria: expected.undo, title: expected.undo },
      redo: { aria: expected.redo, title: expected.redo },
      pen: { aria: expected.pen, title: expected.pen },
      eraser: { aria: expected.eraser, title: expected.eraser },
      background: { aria: expected.background, title: expected.background },
      selection: { aria: expected.selection, title: expected.selection },
      drawingArea: expected.drawingArea,
      tools: expected.tools,
    },
  );

  const menu = pair.locator('.lia-tool-menu');
  await pair.locator('.lia-color-btn:visible').click();
  assert.equal(await menu.getAttribute('data-open'), '1');
  assert.equal((await menu.locator('.lia-tool-heading').textContent())?.trim(), expected.pen);
  assert.equal(
    await menu.locator('[data-act=close]').getAttribute('aria-label'),
    expected.closeMenu,
  );
  assert.equal(
    await menu.locator('input[data-act=penWidth]').getAttribute('aria-label'),
    expected.penWidth,
  );
  assert.equal(
    await menu.locator('input[data-act=penAlpha]').getAttribute('aria-label'),
    expected.opacity,
  );
  await menu.locator('[data-act=close]').click();

  await pair.locator('.lia-eraser-btn:visible').click();
  assert.equal((await menu.locator('.lia-tool-heading').textContent())?.trim(), expected.eraser);
  assert.equal(
    await menu.locator('[data-act=clear]').getAttribute('aria-label'),
    expected.clearAll,
  );
  assert.equal(
    await menu.locator('[data-act=close]').getAttribute('aria-label'),
    expected.closeMenu,
  );
  assert.equal(
    await menu.locator('input[data-act=eraserWidth]').getAttribute('aria-label'),
    expected.eraserWidth,
  );
  await menu.locator('[data-act=close]').click();

  await pair.locator('.lia-bgmenu-btn:visible').click();
  assert.equal(
    (await menu.locator('.lia-tool-heading').textContent())?.trim(),
    expected.background,
  );
  assert.equal(
    await menu.locator('[data-act=close]').getAttribute('aria-label'),
    expected.closeMenu,
  );
  assert.equal(
    await menu.locator('[data-mode=none]').getAttribute('aria-label'),
    expected.noBackground,
  );
  assert.equal(
    await menu.locator('[data-mode=grid]').getAttribute('aria-label'),
    expected.grid,
  );
  assert.equal(
    await menu.locator('[data-mode=lined]').getAttribute('aria-label'),
    expected.lined,
  );
  assert.equal((await menu.locator('.lia-menu-label').textContent())?.trim(), expected.spacing);
  assert.equal(
    await menu.locator('input[data-act=bgStep]').getAttribute('aria-label'),
    expected.backgroundSpacing,
  );
  await menu.locator('[data-act=close]').click();
}

async function assertInteractiveCalculationLocale(
  page: Page,
  pairSelector: string,
  expected: CalculationLocaleText,
): Promise<void> {
  await withHostTimeout(
    page.waitForFunction(
      ({ selector, title, summary, launcher }) => {
        const pair = document.querySelector(selector);
        return pair?.querySelector('.lia-canvasplus-standalone-title')?.textContent?.trim() ===
            title &&
          pair.querySelector('.lia-canvasplus-analysis-summary')?.textContent?.trim() ===
            summary &&
          pair.querySelector('.lia-canvas-launch')?.getAttribute('aria-label') ===
            launcher;
      },
      {
        selector: pairSelector,
        title: expected.title,
        summary: expected.summary,
        launcher: expected.launcherClose,
      },
      { timeout: 5_000 },
    ),
    'localized interactive calculation review',
    6_000,
  );

  const pair = page.locator(pairSelector);
  const launcher = pair.locator('.lia-canvas-launch:visible');
  assert.equal(await launcher.getAttribute('aria-label'), expected.launcherClose);
  assert.equal(await launcher.getAttribute('title'), expected.launcherClose);
  assert.equal(await launcher.getAttribute('aria-expanded'), 'true');
  await launcher.click();
  assert.equal(await launcher.getAttribute('aria-label'), expected.launcherOpen);
  assert.equal(await launcher.getAttribute('title'), expected.launcherOpen);
  assert.equal(await launcher.getAttribute('aria-expanded'), 'false');
  await launcher.click();
  assert.equal(await launcher.getAttribute('aria-label'), expected.launcherClose);
  assert.equal(await launcher.getAttribute('title'), expected.launcherClose);
  assert.equal(await launcher.getAttribute('aria-expanded'), 'true');
  await pair.locator('canvas.lia-draw:visible').waitFor({
    state: 'visible',
    timeout: 5_000,
  });

  const output = pair.locator('.lia-canvasplus-output');
  assert.equal(
    (await pair.locator('.lia-canvasplus-submit:visible').textContent())?.trim(),
    expected.submit,
  );
  assert.equal(
    (await output.locator('.lia-canvasplus-edit:visible').textContent())?.trim(),
    expected.edit,
  );
  assert.equal(
    (await output.locator('.lia-canvasplus-standalone-title').textContent())?.trim(),
    expected.title,
  );
  assert.equal(
    (await output.locator('.lia-canvasplus-analysis-summary').textContent())?.trim(),
    expected.summary,
  );
  assert.equal(
    await output.locator('.lia-canvasplus-steps').getAttribute('aria-label'),
    expected.path,
  );

  const transition = output.locator(
    '.lia-canvasplus-transition[data-verdict=correct]',
  ).first();
  const trigger = transition.locator('.lia-canvasplus-transition-trigger');
  if (await trigger.getAttribute('aria-expanded') !== 'true') {
    await trigger.click();
  }
  assert.equal(
    (await transition.locator('.lia-canvasplus-transition-label').textContent())?.trim(),
    expected.transition,
  );
  assert.equal(await trigger.getAttribute('aria-label'), expected.transitionAria);
  assert.equal(await trigger.getAttribute('aria-expanded'), 'true');
  const detail = transition.locator('.lia-canvasplus-transition-detail');
  assert.equal(await detail.isVisible(), true);
  assert.equal((await detail.textContent())?.trim(), expected.detail);

  await assertCalculationToolbarLocale(page, pairSelector, expected.toolbar);
}

async function assertFreezeCalculationLocale(
  page: Page,
  pairSelector: string,
  expected: CalculationLocaleText,
): Promise<void> {
  await withHostTimeout(
    page.waitForFunction(
      ({ selector, title, summary }) => {
        const review = document.querySelector(
          selector + ' .lia-canvas-freeze-calculation-review[data-freeze-static]',
        );
        return review?.querySelector('.lia-canvasplus-standalone-title')
          ?.textContent?.trim() === title &&
          review.querySelector('.lia-canvasplus-analysis-summary')
            ?.textContent?.trim() === summary;
      },
      {
        selector: pairSelector,
        title: expected.title,
        summary: expected.summary,
      },
      { timeout: 5_000 },
    ),
    'localized static Freeze calculation review',
    6_000,
  );

  const pair = page.locator(pairSelector);
  const review = pair.locator(
    '.lia-canvas-freeze-calculation-review[data-freeze-static]',
  );
  assert.equal(
    await pair.locator('.lia-canvas-freeze-calculation-review').count(),
    1,
  );
  assert.equal(
    (await review.locator('.lia-canvasplus-standalone-title').textContent())?.trim(),
    expected.title,
  );
  assert.equal(
    (await review.locator('.lia-canvasplus-analysis-summary').textContent())?.trim(),
    expected.summary,
  );
  assert.equal(
    await review.locator('.lia-canvas-freeze-review-steps').getAttribute('aria-label'),
    expected.path,
  );

  const transition = review.locator(
    '.lia-canvasplus-transition[data-verdict=correct]',
  ).first();
  assert.equal(
    (await transition.locator('.lia-canvasplus-transition-label').textContent())?.trim(),
    expected.transitionAria,
  );
  assert.equal(
    await transition.locator('.lia-canvasplus-transition-trigger').getAttribute('aria-label'),
    expected.transitionAria,
  );
  const detail = transition.locator('.lia-canvasplus-transition-detail');
  assert.equal(await detail.isVisible(), true);
  assert.equal((await detail.textContent())?.trim(), expected.detail);
}

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

async function drawMousePolyline(
  page: Page,
  points: ReadonlyArray<{ x: number; y: number }>,
) {
  assert.ok(points.length >= 2, 'a mouse polyline needs at least two points');
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

async function answerValueBeforePair(page: Page, pairSelector: string): Promise<string> {
  return withHostTimeout(
    page.evaluate(selector => {
      const pair = document.querySelector(selector);
      if (!pair) throw new Error('Canvas pair not found: ' + selector);
      const fields = Array.from(
        document.querySelectorAll('input, textarea, [contenteditable="true"]'),
      );
      let answer: Element | null = null;
      for (const field of fields) {
        if (field.compareDocumentPosition(pair) & Node.DOCUMENT_POSITION_FOLLOWING) {
          answer = field;
        }
      }
      if (!answer) throw new Error('Answer field before canvas pair not found.');
      if ('value' in answer) return String((answer as HTMLInputElement).value || '');
      return String(answer.textContent || '');
    }, pairSelector),
    'answer field value before canvas pair',
  );
}

async function markNativeQuizCheckBeforePair(
  page: Page,
  pairSelector: string,
): Promise<{ candidateCount: number; label: string }> {
  return withHostTimeout(
    page.evaluate(selector => {
      const pair = document.querySelector(selector);
      if (!pair) throw new Error('Canvas pair not found: ' + selector);
      const fields = Array.from(
        document.querySelectorAll('input, textarea, [contenteditable=true]'),
      );
      let answer: Element | null = null;
      for (const field of fields) {
        if (field.compareDocumentPosition(pair) & Node.DOCUMENT_POSITION_FOLLOWING) {
          answer = field;
        }
      }
      if (!answer) throw new Error('Answer field before canvas pair not found.');

      document
        .querySelectorAll('[data-lia-calculation-quiz-check]')
        .forEach(node => node.removeAttribute('data-lia-calculation-quiz-check'));
      const quiz = answer.closest('.lia-quiz') ??
        Array.from(document.querySelectorAll('.lia-quiz')).find(candidate =>
          Boolean(pair.compareDocumentPosition(candidate) & Node.DOCUMENT_POSITION_FOLLOWING),
        );
      if (!quiz) throw new Error('Native LiaScript quiz before canvas pair not found.');
      const candidates = Array.from(
        quiz.querySelectorAll<HTMLButtonElement>('button.lia-quiz__check'),
      );
      const labelOf = (button: HTMLButtonElement) =>
        [button.innerText, button.getAttribute('aria-label'), button.title]
          .filter(Boolean)
          .join(' ')
          .trim();
      const target = candidates.at(-1);
      if (!target) throw new Error('Native LiaScript quiz check button was not found.');
      const style = getComputedStyle(target);
      const box = target.getBoundingClientRect();
      if (target.disabled || style.display === 'none' || style.visibility === 'hidden' ||
          box.width <= 0 || box.height <= 0) {
        throw new Error('Native LiaScript quiz check button is not visible and enabled.');
      }
      target.setAttribute('data-lia-calculation-quiz-check', '1');
      return {
        candidateCount: candidates.length,
        label: labelOf(target),
      };
    }, pairSelector),
    'mark native LiaScript quiz check button',
  );
}

async function waitForNativeQuizResultBeforePair(
  page: Page,
  pairSelector: string,
  result: 'success' | 'failure',
): Promise<void> {
  await withHostTimeout(
    page.waitForFunction(
      ({ selector, expectedResult }) => {
        const pair = document.querySelector(selector);
        if (!pair) return false;
        const fields = Array.from(
          document.querySelectorAll('input, textarea, [contenteditable=true]'),
        );
        let answer: Element | null = null;
        for (const field of fields) {
          if (field.compareDocumentPosition(pair) & Node.DOCUMENT_POSITION_FOLLOWING) {
            answer = field;
          }
        }
        const quiz = answer?.closest('.lia-quiz') ??
          Array.from(document.querySelectorAll('.lia-quiz')).find(candidate =>
            Boolean(pair.compareDocumentPosition(candidate) & Node.DOCUMENT_POSITION_FOLLOWING),
          );
        if (!quiz) return false;
        if (expectedResult === 'success') {
          return quiz.classList.contains('solved') &&
            Boolean(quiz.querySelector('.lia-quiz__feedback.text-success'));
        }
        return quiz.classList.contains('open') &&
          Boolean(quiz.querySelector('.lia-quiz__feedback.text-error'));
      },
      { selector: pairSelector, expectedResult: result },
      { timeout: 5_000 },
    ),
    `native LiaScript quiz ${result} state`,
    6_000,
  );
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
        /Second (?:page|calculation)/.test(document.body.textContent || ''),
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

registerColumnAdditionBrowserRegression();
registerWrittenArithmeticBrowserRegression();

for (const project of projects) {
  test(
    `current ${project.name} smoke: pointer delimiters survive structured OCR crops`,
    { timeout: 60_000 },
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
          `npx playwright install ${project.name}.\n${String(error)}`,
        );
      }

      const harness = await createHarness(browser);
      try {
        const pairSelector =
          '.lia-canvas-pair[data-canvas-mode=plus][data-canvas-output=answer]';
        await openCourse(
          harness,
          CALCULATION_QUIZ_COURSE_URL,
          pairSelector + ' .lia-canvas-launch',
        );
        const page = harness.page;
        const pair = page.locator(pairSelector);
        await page.evaluate(() => {
          (window as any).__liaDelimiterRecognizeCalls = 0;
          (window as any).__liaDelimiterInputSizes = [];
          (window as any).katex = {
            render(tex: string, target: HTMLElement) {
              target.textContent = 'rendered: ' + tex;
              target.setAttribute('data-rendered-tex', tex);
            },
          };
          window.__LIA_CANVAS_OCR__.ocr = {
            model: 'nested-delimiter-geometry-stub',
            precision: 'fp32',
            task: 'image-to-text',
            cacheKey: 'nested-delimiter-geometry-v1',
            outputKind: 'latex',
            inputProfile: 'formulanet-line-384',
            calculationSinglePass: true,
            ensureLoaded: async () => true,
            recognize: async (input: HTMLCanvasElement) => {
              const call = ++(window as any).__liaDelimiterRecognizeCalls;
              (window as any).__liaDelimiterInputSizes.push([
                input.width,
                input.height,
              ]);
              if (call === 1) {
                // Whole-line FormulaNet output: the inner closing bracket was
                // lost. Geometry, not textual balancing, must reconstruct it.
                return '[(x]';
              }
              if (call === 2) return 'x';
              throw new Error('unexpected nested-delimiter OCR call');
            },
          };
          window.__LIA_CANVAS_OCR__.canvasPlusOcr =
            window.__LIA_CANVAS_OCR__.ocr;
        });

        await pair.locator('.lia-canvas-launch:visible').click();
        const canvas = pair.locator('canvas.lia-draw:visible');
        await canvas.waitFor({ state: 'visible', timeout: 10_000 });
        const box = await canvas.boundingBox();
        assert.ok(box, 'the delimiter regression drawing surface is unavailable');

        const originX = box.x + box.width * 0.32;
        const originY = box.y + box.height * 0.33;
        const scale = Math.min(1.25, box.height * 0.22 / 60);
        const point = ([x, y]: readonly [number, number]) => ({
          x: originX + x * scale,
          y: originY + y * scale,
        });
        const paths: ReadonlyArray<ReadonlyArray<readonly [number, number]>> = [
          [[14, 0], [2, 0], [2, 60], [14, 60]],
          [[32, 0], [25, 8], [21, 22], [20, 30], [21, 38], [25, 52], [32, 60]],
          [[40, 20], [52, 42]],
          [[52, 20], [40, 42]],
          [[60, 0], [67, 8], [71, 22], [72, 30], [71, 38], [67, 52], [60, 60]],
          [[80, 0], [92, 0], [92, 60], [80, 60]],
        ];
        for (const path of paths) {
          await drawMousePolyline(page, path.map(point));
        }
        await pair.locator('.lia-canvasplus-submit:visible').click();
        await page.waitForFunction(
          ({ selector, tex }) => {
            const output = document.querySelector(
              selector + ' .lia-canvasplus-output',
            ) as HTMLElement | null;
            return output?.dataset.state === 'ready' &&
              output.dataset.latex === tex;
          },
          { selector: pairSelector, tex: '[(x)]' },
          { timeout: 10_000 },
        );

        const result = await pair.evaluate(element => {
          const output = element.querySelector(
            '.lia-canvasplus-output',
          ) as HTMLElement | null;
          return {
            latex: output?.dataset.latex || '',
            lineCount: output?.dataset.lineCount || '',
            rendered: output?.querySelector('.lia-canvasplus-rendered')
              ?.getAttribute('data-rendered-tex') || '',
            recognizeCalls: (window as any).__liaDelimiterRecognizeCalls,
            inputSizes: (window as any).__liaDelimiterInputSizes,
          };
        });
        assert.deepEqual(result, {
          latex: '[(x)]',
          lineCount: '1',
          rendered: '[(x)]',
          recognizeCalls: 2,
          inputSizes: result.inputSizes,
        });
        assert.equal(result.inputSizes.length, 2);
        assert.ok(
          result.inputSizes[0][0] > result.inputSizes[1][0],
          'the first OCR input must be the whole line and the second only its content',
        );

        const diagnostics = await snapshotDiagnostics(page);
        assertSyntheticDelivery(
          harness,
          CALCULATION_QUIZ_COURSE_URL,
          undefined,
          true,
        );
        assert.deepEqual(harness.modelRequests, []);
        assert.deepEqual(harness.chunkRequests, []);
        assertNoRuntimeErrors(harness, diagnostics);
      } finally {
        await harness.context.close();
        await browser.close();
      }
    },
  );

  test(
    `current ${project.name} smoke: multiple canvases bind to their own quiz fields`,
    { timeout: 90_000 },
    async t => {
      if (!requestedProjects.has(project.name)) {
        t.skip(`excluded by LIA_BROWSER_PROJECTS=${[...requestedProjects].join(',')}`);
        return;
      }

      const browser = await project.browserType.launch({ headless: true });
      const harness = await createHarness(browser);
      try {
        await openCourse(
          harness,
          MULTI_INSTANCE_COURSE_URL,
          '.lia-canvas-pair .lia-canvas-launch',
        );
        const page = harness.page;
        const classicPairs = page.locator(
          '.lia-canvas-pair:not([data-canvas-mode=plus])',
        );
        const calculationPairs = page.locator(
          '.lia-canvas-pair[data-canvas-mode=plus][data-canvas-output=answer]',
        );
        assert.equal(await classicPairs.count(), 2);
        assert.equal(await calculationPairs.count(), 2);
        assert.equal(await page.locator('.lia-quiz__input').count(), 4);

        await page.evaluate(() => {
          (window as any).__liaMultiClassicValue = '11';
          (window as any).__liaMultiCalculationResponses = ['x+1=2', 'x=1'];
          const classicOcr = {
            model: 'multi-instance-classic-stub',
            precision: 'fp32',
            task: 'image-to-text',
            ensureLoaded: async () => true,
            recognize: async () => (window as any).__liaMultiClassicValue,
          };
          const calculationOcr = {
            model: 'multi-instance-calculation-stub',
            precision: 'fp32',
            task: 'image-to-text',
            cacheKey: 'multi-instance-calculation-v1',
            outputKind: 'latex',
            inputProfile: 'formulanet-line-384',
            calculationSinglePass: true,
            ensureLoaded: async () => true,
            recognize: async () => {
              const response = (window as any).__liaMultiCalculationResponses.shift();
              if (typeof response !== 'string') {
                throw new Error('Missing multi-instance calculation response');
              }
              return response;
            },
          };
          window.__LIA_CANVAS_OCR__.ocr = classicOcr;
          window.__LIA_CANVAS_OCR__.canvasPlusOcr = calculationOcr;
        });

        const fieldValues = () => page.locator('.lia-quiz__input').evaluateAll(
          fields => fields.map(field => (field as HTMLInputElement).value),
        );
        const submitClassic = async (index: number, value: string) => {
          await page.evaluate(next => {
            (window as any).__liaMultiClassicValue = next;
          }, value);
          const pair = classicPairs.nth(index);
          await pair.scrollIntoViewIfNeeded();
          await pair.locator('.lia-canvas-launch:visible').click();
          const canvas = pair.locator('canvas.lia-draw:visible');
          await canvas.waitFor({ state: 'visible', timeout: 10_000 });
          await canvas.scrollIntoViewIfNeeded();
          const box = await canvas.boundingBox();
          assert.ok(box, `classic canvas ${index} has no bounding box`);
          await drawMouseStroke(
            page,
            box.x + box.width * 0.42,
            box.y + box.height * 0.38,
            box.x + box.width * 0.58,
            box.y + box.height * 0.58,
          );
          await pair.locator('.lia-rect-btn:visible').click();
          await canvas.scrollIntoViewIfNeeded();
          const selectionBox = await canvas.boundingBox();
          assert.ok(selectionBox, `classic selection surface ${index} is unavailable`);
          await drawMouseStroke(
            page,
            selectionBox.x + selectionBox.width * 0.25,
            selectionBox.y + selectionBox.height * 0.20,
            selectionBox.x + selectionBox.width * 0.75,
            selectionBox.y + selectionBox.height * 0.78,
          );
          await pair.locator('.lia-rect-action:visible').click();
          await page.waitForFunction(
            ({ fieldIndex, expected }) =>
              (document.querySelectorAll('.lia-quiz__input')[fieldIndex] as
                HTMLInputElement | undefined)?.value === expected,
            { fieldIndex: index, expected: value },
            { timeout: 10_000 },
          );
        };
        const submitCalculation = async (index: number, values: string[]) => {
          await page.evaluate(next => {
            (window as any).__liaMultiCalculationResponses = [...next];
          }, values);
          const pair = calculationPairs.nth(index);
          await pair.scrollIntoViewIfNeeded();
          await pair.locator('.lia-canvas-launch:visible').click();
          const canvas = pair.locator('canvas.lia-draw:visible');
          await canvas.waitFor({ state: 'visible', timeout: 10_000 });
          await canvas.scrollIntoViewIfNeeded();
          const box = await canvas.boundingBox();
          assert.ok(box, `calculation canvas ${index} has no bounding box`);
          await drawMouseStroke(
            page,
            box.x + box.width * 0.38,
            box.y + box.height * 0.18,
            box.x + box.width * 0.56,
            box.y + box.height * 0.34,
          );
          await drawMouseStroke(
            page,
            box.x + box.width * 0.56,
            box.y + box.height * 0.18,
            box.x + box.width * 0.38,
            box.y + box.height * 0.34,
          );
          await drawMouseStroke(
            page,
            box.x + box.width * 0.38,
            box.y + box.height * 0.62,
            box.x + box.width * 0.56,
            box.y + box.height * 0.78,
          );
          await drawMouseStroke(
            page,
            box.x + box.width * 0.56,
            box.y + box.height * 0.62,
            box.x + box.width * 0.38,
            box.y + box.height * 0.78,
          );
          await pair.locator('.lia-canvasplus-submit:visible').click();
          const expected = JSON.stringify(values);
          await page.waitForFunction(
            ({ fieldIndex, expectedValue }) =>
              (document.querySelectorAll('.lia-quiz__input')[fieldIndex] as
                HTMLInputElement | undefined)?.value === expectedValue,
            { fieldIndex: index + 2, expectedValue: expected },
            { timeout: 10_000 },
          );
        };

        await submitClassic(0, '11');
        assert.deepEqual(await fieldValues(), ['11', '', '', '']);
        await submitClassic(1, '22');
        assert.deepEqual(await fieldValues(), ['11', '22', '', '']);
        await submitCalculation(0, ['x+1=2', 'x=1']);
        assert.deepEqual(
          await fieldValues(),
          ['11', '22', JSON.stringify(['x+1=2', 'x=1']), ''],
        );
        await submitCalculation(1, ['x+2=4', 'x=2']);
        assert.deepEqual(
          await fieldValues(),
          [
            '11',
            '22',
            JSON.stringify(['x+1=2', 'x=1']),
            JSON.stringify(['x+2=4', 'x=2']),
          ],
        );

        const solvedQuizStates = () => page.locator('.lia-quiz__input').evaluateAll(
          fields => fields.map(field =>
            Boolean(field.closest('.lia-quiz')?.classList.contains('solved')),
          ),
        );
        const checkQuiz = async (index: number) => {
          await page.evaluate(fieldIndex => {
            document.querySelectorAll('[data-multi-instance-check]').forEach(
              node => node.removeAttribute('data-multi-instance-check'),
            );
            const field = document.querySelectorAll('.lia-quiz__input')[fieldIndex];
            const quiz = field?.closest('.lia-quiz');
            const button = Array.from(
              quiz?.querySelectorAll<HTMLButtonElement>('button.lia-quiz__check') || [],
            ).at(-1);
            if (!button || button.disabled) {
              throw new Error('Native Check button is unavailable for quiz ' + fieldIndex);
            }
            button.setAttribute('data-multi-instance-check', '1');
          }, index);
          await page.locator('[data-multi-instance-check]').click();
          await page.waitForFunction(fieldIndex => {
            const field = document.querySelectorAll('.lia-quiz__input')[fieldIndex];
            const quiz = field?.closest('.lia-quiz');
            return Boolean(
              quiz?.classList.contains('solved') &&
              quiz.querySelector('.lia-quiz__feedback.text-success'),
            );
          }, index, { timeout: 10_000 });
        };

        assert.deepEqual(await solvedQuizStates(), [false, false, false, false]);
        await checkQuiz(0);
        assert.deepEqual(await solvedQuizStates(), [true, false, false, false]);
        await checkQuiz(2);
        assert.deepEqual(await solvedQuizStates(), [true, false, true, false]);
        await checkQuiz(1);
        assert.deepEqual(await solvedQuizStates(), [true, true, true, false]);
        await checkQuiz(3);
        assert.deepEqual(await solvedQuizStates(), [true, true, true, true]);

        const diagnostics = await snapshotDiagnostics(page);
        assertSyntheticDelivery(
          harness,
          MULTI_INSTANCE_COURSE_URL,
          undefined,
          true,
        );
        assert.deepEqual(harness.modelRequests, []);
        assertNoRuntimeErrors(harness, diagnostics);
      } finally {
        await harness.context.close();
        await browser.close();
      }
    },
  );

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
          assert.deepEqual(lazyHarness.chunkRequests, []);
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
          assert.equal(
            await page.locator('.lia-canvasplus-dialog').count(),
            0,
            '@canvas must continue to submit without the calculation review dialog',
          );
          assert.equal(
            await page.locator('.lia-canvasplus-submit, .lia-canvasplus-output').count(),
            0,
            '@canvas must not receive multi-line calculation controls',
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
          assert.deepEqual(
            harness.chunkRequests,
            [],
            'classic @canvas must not download the calculation CAS chunk',
          );
          assertNoRuntimeErrors(harness, finalDiagnostics);
        } finally {
          await harness.context.close();
        }

        const plusHarness = await createHarness(browser);
        try {
          await openCourse(
            plusHarness,
            CALCULATION_QUIZ_COURSE_URL,
            '.lia-canvas-pair[data-canvas-mode=plus] .lia-canvas-launch',
          );
          const page = plusHarness.page;
          const plusPairSelector =
            '.lia-canvas-pair[data-canvas-mode=plus][data-canvas-output=answer]';
          const plusPair = page.locator(plusPairSelector);
          const plusLauncher = plusPair.locator('.lia-canvas-launch:visible');

          await page.waitForFunction(
            () => typeof (window as any).Algebrite?.run === 'function',
            undefined,
            { timeout: 10_000 },
          );
          assert.equal(
            await page.evaluate(() => typeof (window as any).Algebrite?.run),
            'function',
            'the host import must establish window.Algebrite before calculation OCR runs',
          );
          assert.equal(await plusPair.count(), 1);
          assert.equal(await plusPair.getAttribute('data-canvas-output'), 'answer');
          assert.equal(await plusPair.getAttribute('data-ocr-mode'), 'submit');
          assert.deepEqual(
            await plusLauncher.evaluate(button => {
              const style = getComputedStyle(button);
              return {
                text: (button.textContent || '').trim(),
                ariaLabel: button.getAttribute('aria-label'),
                labelCount: button.querySelectorAll('.lia-canvas-launch-label').length,
                svgCount: button.querySelectorAll('svg').length,
                width: style.width,
                height: style.height,
              };
            }),
            {
              text: '',
              ariaLabel: 'Open calculation block',
              labelCount: 0,
              svgCount: 1,
              width: '32px',
              height: '32px',
            },
            'the calculation launcher must match the classic icon-only canvas button',
          );
          assert.equal(await plusLauncher.getAttribute('aria-expanded'), 'false');
          assert.equal(
            await plusPair.locator('canvas.lia-draw').count(),
            0,
            '@BerechneOCR must keep the shared lazy canvas initialization',
          );

          await page.evaluate(selector => {
            const pair = document.querySelector(selector);
            if (!pair) throw new Error('Calculation pair not found.');
            (window as any).katex = {
              render(tex: string, target: HTMLElement) {
                target.textContent = 'rendered: ' + tex;
                target.setAttribute('data-rendered-tex', tex);
              },
            };
            (window as any).__liaCanvasPlusEnsureLoadedCalls = 0;
            (window as any).__liaCanvasPlusRecognizeCalls = 0;
            (window as any).__liaCanvasPlusInputSizes = [];
            (window as any).__liaCanvasPlusOcrEvents = [];
            (window as any).__liaCanvasPlusRenderEvents = [];
            (window as any).__liaCanvasPlusCorrectionEvents = [];
            (window as any).__liaCanvasPlusAnalysisEvents = [];
            pair.addEventListener('lia:canvasplus-ocr', event => {
              (window as any).__liaCanvasPlusOcrEvents.push(
                (event as CustomEvent).detail,
              );
            });
            pair.addEventListener('lia:canvasplus-render', event => {
              (window as any).__liaCanvasPlusRenderEvents.push(
                (event as CustomEvent).detail,
              );
            });
            pair.addEventListener('lia:canvasplus-correction', event => {
              (window as any).__liaCanvasPlusCorrectionEvents.push(
                (event as CustomEvent).detail,
              );
            });
            pair.addEventListener('lia:canvasplus-analysis', event => {
              (window as any).__liaCanvasPlusAnalysisEvents.push(
                (event as CustomEvent).detail,
              );
            });
            window.__LIA_CANVAS_OCR__.ocr = {
              model: 'calculation-stub-model',
              precision: 'fp32',
              task: 'image-to-text',
              cacheKey: 'formulanet-test-engine',
              outputKind: 'latex',
              inputProfile: 'formulanet-line-384',
              ensureLoaded: async () => {
                (window as any).__liaCanvasPlusEnsureLoadedCalls += 1;
                return true;
              },
              recognize: async (input: HTMLCanvasElement) => {
                (window as any).__liaCanvasPlusInputSizes.push([
                  input.width,
                  input.height,
                ]);
                const call = ++(window as any).__liaCanvasPlusRecognizeCalls;
                if (call === 1) return '3\\cdot-5=7';
                if (call === 2) return '+5';
                if (call === 3) return '3X=12';
                if (call === 4) return ':3';
                if (call === 5) return 'X=4';
                if (call === 6) return '3X=15';
                // Regression: a tiny side crop can lose the ':' while the
                // independently drawn hookless operation bar remains certain.
                if (call === 7) return '3';
                if (call === 8) return '3X=15:3';
                if (call === 9) return '3\\cdot-5=7';
                if (call === 10) return '5';
                if (call === 11) return '3\\cdot-5=7+5';
                throw new Error('unexpected uncached canvasplus OCR call');
              },
            };
            window.__LIA_CANVAS_OCR__.canvasPlusOcr =
              window.__LIA_CANVAS_OCR__.ocr;
          }, plusPairSelector);

          await plusLauncher.click({ timeout: 5_000 });
          assert.equal(await plusLauncher.getAttribute('aria-expanded'), 'true');
          const plusCanvas = plusPair.locator('canvas.lia-draw:visible');
          await plusCanvas.waitFor({ state: 'visible', timeout: 10_000 });
          const plusBox = await plusCanvas.boundingBox();
          assert.ok(plusBox, 'the calculation drawing surface has no bounding box');

          assert.equal(
            await plusPair.locator('.lia-rect-btn:visible').count(),
            1,
            '@BerechneOCR must expose the shared selection rectangle tool',
          );
          assert.equal(
            await plusPair.locator('.lia-rect-action:visible').count(),
            0,
            '@BerechneOCR must not expose the classic quiz submit action',
          );
          const plusSubmit = plusPair.locator('.lia-canvasplus-submit:visible');
          await plusSubmit.waitFor({ state: 'visible', timeout: 5_000 });
          assert.equal(await plusSubmit.isDisabled(), true);

          await drawMouseStroke(
            page,
            plusBox.x + plusBox.width * 0.18,
            plusBox.y + plusBox.height * 0.30,
            plusBox.x + plusBox.width * 0.55,
            plusBox.y + plusBox.height * 0.30,
          );
          await drawMouseStroke(
            page,
            plusBox.x + plusBox.width * 0.68,
            plusBox.y + plusBox.height * 0.21,
            plusBox.x + plusBox.width * 0.68,
            plusBox.y + plusBox.height * 0.39,
          );
          await drawMouseStroke(
            page,
            plusBox.x + plusBox.width * 0.76,
            plusBox.y + plusBox.height * 0.30,
            plusBox.x + plusBox.width * 0.82,
            plusBox.y + plusBox.height * 0.30,
          );
          await page.waitForFunction(
            selector =>
              document.querySelector(selector)?.getAttribute('data-ocr-background') === 'manual',
            plusPairSelector,
            { timeout: 5_000 },
          );
          await hostDelay(2_100);
          assert.deepEqual(
            await page.evaluate(() => ({
              ensureLoadedCalls: (window as any).__liaCanvasPlusEnsureLoadedCalls,
              recognizeCalls: (window as any).__liaCanvasPlusRecognizeCalls,
              heavyPhases: (window as any).__liaCanvasPlusOcrEvents
                .filter((event: any) => ['scheduled', 'running', 'ready', 'error'].includes(event.phase))
                .map((event: any) => event.phase),
            })),
            { ensureLoadedCalls: 0, recognizeCalls: 0, heavyPhases: [] },
            'a thinking pause between lines must not load or run the OCR model',
          );
          await drawMouseStroke(
            page,
            plusBox.x + plusBox.width * 0.20,
            plusBox.y + plusBox.height * 0.68,
            plusBox.x + plusBox.width * 0.55,
            plusBox.y + plusBox.height * 0.74,
          );
          await drawMouseStroke(
            page,
            plusBox.x + plusBox.width * 0.66,
            plusBox.y + plusBox.height * 0.59,
            plusBox.x + plusBox.width * 0.66,
            plusBox.y + plusBox.height * 0.80,
          );
          await drawMouseStroke(
            page,
            plusBox.x + plusBox.width * 0.74,
            plusBox.y + plusBox.height * 0.72,
            plusBox.x + plusBox.width * 0.82,
            plusBox.y + plusBox.height * 0.72,
          );
          // A separate vertical stem attached to the right-side glyph models
          // the handwritten 4 in the reported operation. It must not be
          // mistaken for a second free-standing separator.
          await drawMouseStroke(
            page,
            plusBox.x + plusBox.width * 0.80,
            plusBox.y + plusBox.height * 0.62,
            plusBox.x + plusBox.width * 0.80,
            plusBox.y + plusBox.height * 0.80,
          );
          await drawMouseStroke(
            page,
            plusBox.x + plusBox.width * 0.30,
            plusBox.y + plusBox.height * 0.90,
            plusBox.x + plusBox.width * 0.54,
            plusBox.y + plusBox.height * 0.90,
          );
          await hostDelay(150);

          await page.waitForFunction(
            selector =>
              document.querySelector(selector)?.getAttribute('data-ocr-background') === 'manual',
            plusPairSelector,
            { timeout: 5_000 },
          );
          assert.deepEqual(
            await page.evaluate(selector => {
              const pair = document.querySelector(selector);
              return {
                lineCount: pair?.getAttribute('data-ocr-line-count'),
                ensureLoadedCalls: (window as any).__liaCanvasPlusEnsureLoadedCalls,
                recognizeCalls: (window as any).__liaCanvasPlusRecognizeCalls,
              };
            }, plusPairSelector),
            { lineCount: '0', ensureLoadedCalls: 0, recognizeCalls: 0 },
          );
          assert.equal(
            await plusPair.locator('.lia-canvasplus-standalone-status').getAttribute('data-state'),
            'ready',
          );
          assert.equal(await plusSubmit.isDisabled(), false);

          const plusFreezeState = await page.evaluate(selector => {
            const pair = document.querySelector(selector);
            const state = pair
              ? window.__LIA_CANVAS_OCR__?.freeze?.exportCanvasFreezeStateFromPair?.(pair)
              : null;
            return state && {
              version: String(state.v || ''),
              uid: String(state.u || ''),
              itemCount: Array.isArray(state.it) ? state.it.length : 0,
              pathCount: Array.isArray(state.it)
                ? state.it.filter((item: any) => item?.k === 'p').length
                : 0,
              pathPointCounts: Array.isArray(state.it)
                ? state.it
                    .filter((item: any) => item?.k === 'p')
                    .map((item: any) => Array.isArray(item?.p) ? item.p.length : 0)
                : [],
              rectCount: Array.isArray(state.it)
                ? state.it.filter((item: any) => item?.k === 'r').length
                : 0,
            };
          }, plusPairSelector);
          assert.equal(plusFreezeState?.version, 'cvf1');
          assert.ok(plusFreezeState?.uid, '@BerechneOCR freeze state has no UID');
          assert.ok(Number(plusFreezeState?.itemCount || 0) > 0);
          assert.equal(plusFreezeState?.pathCount, 8);
          assert.ok(
            plusFreezeState?.pathPointCounts?.every((count: number) => count >= 8),
            'RAF batching must preserve the sampled points of every stroke',
          );
          assert.equal(plusFreezeState?.rectCount, 0);

          const firstAligned = '\\begin{aligned} 3x-5&=7 \\mid +5 \\\\ 3x&=12 \\mid :3 \\\\ x&=4 \\end{aligned}';
          await plusSubmit.click();
          const output = plusPair.locator('.lia-canvasplus-output');
          await output.waitFor({ state: 'visible', timeout: 10_000 });
          await page.waitForFunction(
            ({ selector, tex }) =>
              document
                .querySelector(selector + ' .lia-canvasplus-rendered')
                ?.getAttribute('data-rendered-tex') === tex,
            { selector: plusPairSelector, tex: firstAligned },
            { timeout: 10_000 },
          );
          assert.equal(await output.getAttribute('data-state'), 'ready');
          assert.equal(await output.getAttribute('data-latex'), firstAligned);
          assert.equal(await output.getAttribute('data-line-count'), '3');
          await page.waitForFunction(
            selector => {
              const result = document.querySelector(
                selector + ' .lia-canvasplus-output',
              ) as HTMLElement | null;
              return result?.dataset.analysisState === 'ready' &&
                result.querySelectorAll(
                  '.lia-canvasplus-transition[data-verdict=correct]',
                ).length === 2;
            },
            plusPairSelector,
            { timeout: 10_000 },
          );
          assert.deepEqual(
            await page.evaluate(() => {
              const render = (window as any).__liaCanvasPlusRenderEvents.at(-1);
              const analysis = (window as any).__liaCanvasPlusAnalysisEvents.at(-1);
              return {
                lines: render?.lines,
                checks: analysis?.checks?.map((check: any) => ({
                  status: check.status,
                  reason: check.reason,
                  operation: check.operation,
                })),
              };
            }),
            {
              lines: [
                '3x-5=7 \\mid +5',
                '3x=12 \\mid :3',
                'x=4',
              ],
              checks: [
                {
                  status: 'valid',
                  reason: 'operation-applied-both-sides',
                  operation: '+5',
                },
                {
                  status: 'valid',
                  reason: 'operation-applied-both-sides',
                  operation: ':3',
                },
              ],
            },
            'geometry, contextual x repair and Algebrite must validate the reported chain',
          );
          const resultToggle = output.locator(
            ':scope > summary.lia-canvasplus-result-toggle',
          );
          const resultContent = output.locator(
            ':scope > .lia-canvasplus-result-content',
          );
          assert.deepEqual(
            await output.evaluate(node => ({
              tagName: node.tagName,
              open: (node as HTMLDetailsElement).open,
              directSummaries: node.querySelectorAll(
                ':scope > summary.lia-canvasplus-result-toggle',
              ).length,
              directContents: node.querySelectorAll(
                ':scope > .lia-canvasplus-result-content',
              ).length,
            })),
            {
              tagName: 'DETAILS',
              open: false,
              directSummaries: 1,
              directContents: 1,
            },
            'the rendered result must start as one native, closed disclosure',
          );
          assert.equal(await resultToggle.isVisible(), true);
          assert.equal(await resultContent.isHidden(), true);
          assert.equal(await output.locator('.lia-canvasplus-edit').isHidden(), true);
          assert.equal(
            await resultToggle.locator('.lia-canvasplus-edit').count(),
            0,
            'the edit control must stay outside the native summary',
          );
          assert.equal(await output.locator('.lia-canvasplus-steps').isHidden(), true);
          assert.match(await resultToggle.innerText(), /Rendered calculation block/i);
          assert.match(
            await resultToggle.innerText(),
            /2 transitions: 2 correct, 0 incorrect, 0 not checked\./i,
          );
          assert.equal(
            await output.locator('.lia-canvasplus-analysis-summary')
              .getAttribute('aria-atomic'),
            'true',
          );
          const closedResultLayout = await output.evaluate((root, submitSelector) => {
            const controls = root.parentElement as HTMLElement | null;
            const submit = controls?.querySelector<HTMLElement>(submitSelector as string) ?? null;
            const submitStack = submit?.parentElement as HTMLElement | null;
            const status = controls?.querySelector<HTMLElement>(
              '.lia-canvasplus-standalone-status',
            ) ?? null;
            const toggle = root.querySelector<HTMLElement>(
              ':scope > .lia-canvasplus-result-toggle',
            );
            const indicator = toggle?.querySelector<HTMLElement>(
              '.lia-canvasplus-result-toggle-indicator',
            );
            const title = toggle?.querySelector<HTMLElement>(
              '.lia-canvasplus-standalone-title',
            );
            const summary = toggle?.querySelector<HTMLElement>(
              '.lia-canvasplus-analysis-summary',
            );
            if (!controls || !submit || !submitStack || !status || !toggle ||
                !indicator || !title || !summary) {
              return null;
            }
            const rect = (node: Element) => {
              const box = node.getBoundingClientRect();
              return {
                left: box.left,
                right: box.right,
                top: box.top,
                bottom: box.bottom,
                width: box.width,
                height: box.height,
              };
            };
            const styleSnapshot = (node: Element) => {
              const style = getComputedStyle(node);
              return {
                width: node.getBoundingClientRect().width,
                height: node.getBoundingClientRect().height,
                padding: style.padding,
                border: style.border,
                borderRadius: style.borderRadius,
                fontFamily: style.fontFamily,
                fontSize: style.fontSize,
                fontWeight: style.fontWeight,
                lineHeight: style.lineHeight,
              };
            };
            const probe = document.createElement('button');
            probe.type = 'button';
            probe.className = 'lia-btn';
            probe.textContent = submit.textContent;
            probe.style.position = 'fixed';
            probe.style.insetInlineStart = '-10000px';
            document.body.appendChild(probe);
            const liaButtonStyle = styleSnapshot(probe);
            probe.remove();
            const statusStyle = getComputedStyle(status);
            return {
              controlsClass: controls.classList.contains(
                'lia-canvasplus-standalone-controls',
              ),
              controlsDisplay: getComputedStyle(controls).display,
              submit: rect(submit),
              submitStack: rect(submitStack),
              submitIsLiaButton: submit.classList.contains('lia-btn'),
              submitStyle: styleSnapshot(submit),
              liaButtonStyle,
              result: rect(root),
              toggle: rect(toggle),
              indicator: rect(indicator),
              indicatorAriaHidden: indicator.getAttribute('aria-hidden'),
              title: rect(title),
              summary: rect(summary),
              status: {
                ...rect(status),
                position: statusStyle.position,
                clipPath: statusStyle.clipPath,
                overflow: statusStyle.overflow,
              },
              nestedInteractiveCount: toggle.querySelectorAll(
                'button, input, textarea, select, a[href]',
              ).length,
            };
          }, '.lia-canvasplus-submit');
          assert.ok(closedResultLayout, 'the compact result disclosure is incomplete');
          assert.equal(closedResultLayout.controlsClass, true);
          assert.equal(closedResultLayout.controlsDisplay, 'flex');
          assert.equal(closedResultLayout.submitIsLiaButton, true);
          assert.deepEqual(
            {
              padding: closedResultLayout.submitStyle.padding,
              border: closedResultLayout.submitStyle.border,
              borderRadius: closedResultLayout.submitStyle.borderRadius,
              fontFamily: closedResultLayout.submitStyle.fontFamily,
              fontSize: closedResultLayout.submitStyle.fontSize,
              fontWeight: closedResultLayout.submitStyle.fontWeight,
              lineHeight: closedResultLayout.submitStyle.lineHeight,
            },
            {
              padding: closedResultLayout.liaButtonStyle.padding,
              border: closedResultLayout.liaButtonStyle.border,
              borderRadius: closedResultLayout.liaButtonStyle.borderRadius,
              fontFamily: closedResultLayout.liaButtonStyle.fontFamily,
              fontSize: closedResultLayout.liaButtonStyle.fontSize,
              fontWeight: closedResultLayout.liaButtonStyle.fontWeight,
              lineHeight: closedResultLayout.liaButtonStyle.lineHeight,
            },
            'Submit must inherit the actual LiaButton shape and typography',
          );
          assert.ok(
            closedResultLayout.submitStyle.height >= 43.5 &&
              closedResultLayout.submitStyle.height <= 44.5,
            'Submit must use the readable 44px control height while retaining LiaButton styling',
          );
          assert.ok(
            Math.abs(closedResultLayout.submitStyle.width -
              closedResultLayout.liaButtonStyle.width) <= 0.5,
            'Submit must keep the native LiaButton width for the same label',
          );
          assert.ok(
            Math.abs(closedResultLayout.submitStack.height -
              closedResultLayout.submit.height) <= 0.5,
            'the hidden live status must not add height below Submit',
          );
          assert.ok(
            closedResultLayout.result.left >= closedResultLayout.submit.right + 8,
            'the result disclosure must sit beside the submit button on desktop: ' +
              JSON.stringify(closedResultLayout),
          );
          assert.ok(
            Math.abs(closedResultLayout.result.top - closedResultLayout.submit.top) <= 2,
            'submit and result disclosure must start on the same row',
          );
          assert.ok(
            Math.abs(closedResultLayout.result.height -
              closedResultLayout.submit.height) <= 1,
            'the closed result disclosure must match the LiaButton height',
          );
          assert.ok(
            closedResultLayout.indicator.width >= 35 &&
              closedResultLayout.indicator.height >= 35,
            'the compact disclosure indicator must remain clearly visible',
          );
          assert.equal(closedResultLayout.indicatorAriaHidden, 'true');
          assert.ok(
            closedResultLayout.indicator.right < closedResultLayout.title.left &&
              closedResultLayout.indicator.right < closedResultLayout.summary.left,
            'the prominent disclosure indicator must precede title and status',
          );
          assert.ok(
            closedResultLayout.title.bottom <= closedResultLayout.summary.top + 2 &&
              Math.abs(closedResultLayout.title.left - closedResultLayout.summary.left) <= 2,
            'the transition summary must appear directly beneath the result title',
          );
          assert.equal(
            closedResultLayout.nestedInteractiveCount,
            0,
            'the native summary must not contain a competing interactive control',
          );
          assert.ok(
            closedResultLayout.status.position === 'absolute' &&
              closedResultLayout.status.width <= 1 &&
              closedResultLayout.status.height <= 1 &&
              closedResultLayout.status.clipPath === 'inset(50%)' &&
              closedResultLayout.status.overflow === 'hidden',
            'the calculation OCR announcement must have no visible layout footprint',
          );
          await resultToggle.focus();
          await resultToggle.press('Enter');
          await page.waitForFunction(
            selector => Boolean((document.querySelector(
              selector + ' .lia-canvasplus-output',
            ) as HTMLDetailsElement | null)?.open),
            plusPairSelector,
            { timeout: 5_000 },
          );
          assert.equal(await resultContent.isVisible(), true);
          assert.equal(await output.locator('.lia-canvasplus-edit').isVisible(), true);
          const openResultLayout = await output.evaluate(root => {
            const controls = root.parentElement as HTMLElement;
            const submit = controls.querySelector<HTMLElement>(
              '.lia-canvasplus-submit',
            )!;
            const content = root.querySelector<HTMLElement>(
              ':scope > .lia-canvasplus-result-content',
            )!;
            const toggle = root.querySelector<HTMLElement>(
              ':scope > .lia-canvasplus-result-toggle',
            )!;
            const header = root.querySelector<HTMLElement>(
              ':scope > .lia-canvasplus-result-header',
            )!;
            const edit = header.querySelector<HTMLElement>('.lia-canvasplus-edit')!;
            const math = content.querySelector<HTMLElement>('.lia-canvasplus-rendered')!;
            const rect = (node: Element) => {
              const box = node.getBoundingClientRect();
              return {
                left: box.left,
                right: box.right,
                top: box.top,
                bottom: box.bottom,
                width: box.width,
                height: box.height,
              };
            };
           return {
              result: rect(root),
              submit: rect(submit),
             content: rect(content),
             toggle: rect(toggle),
             headerPosition: getComputedStyle(header).position,
             edit: rect(edit),
              math: rect(math),
            };
          });
          assert.ok(
            Math.abs(openResultLayout.submit.left - closedResultLayout.submit.left) <= 2 &&
              Math.abs(openResultLayout.submit.top - closedResultLayout.submit.top) <= 2,
            'opening the result must not move the submit button',
          );
          assert.ok(
            openResultLayout.edit.width >= 36 && openResultLayout.edit.height >= 36,
            'the edit control must remain clearly operable in the compact heading',
          );
          assert.equal(
            openResultLayout.headerPosition,
            'absolute',
            'the opened edit header must overlay the result heading on desktop',
          );
         assert.ok(
            openResultLayout.edit.top >= openResultLayout.toggle.top - 2 &&
              openResultLayout.edit.bottom <= openResultLayout.toggle.bottom + 2,
            'the edit control must stay within the opened summary heading band',
         );
         assert.ok(
           openResultLayout.result.right - openResultLayout.edit.right >= 0 &&
             openResultLayout.result.right - openResultLayout.edit.right <= 18,
            'the edit control must stay at the top-right edge of the opened result',
         );
          assert.ok(
            openResultLayout.edit.top - openResultLayout.content.top <= 16 &&
              openResultLayout.edit.bottom <= openResultLayout.math.top + 2,
            'the edit control must remain above the rendered equations',
          );
          const resultTypography = await output.evaluate(root => {
            const toggle = root.querySelector<HTMLElement>(
              ':scope > .lia-canvasplus-result-toggle',
            )!;
            const title = toggle.querySelector<HTMLElement>(
              '.lia-canvasplus-standalone-title',
            )!;
            const summary = toggle.querySelector<HTMLElement>(
              '.lia-canvasplus-analysis-summary',
            )!;
            const numbers = Array.from(root.querySelectorAll<HTMLElement>(
              '.lia-canvasplus-line-number',
            ));
            const styleNumber = (node: Element, property: 'fontSize' | 'lineHeight') =>
              Number.parseFloat(getComputedStyle(node)[property]) || 0;
            return {
              toggleHeight: toggle.getBoundingClientRect().height,
              titleFontSize: styleNumber(title, 'fontSize'),
              titleLineHeight: styleNumber(title, 'lineHeight'),
              titleWeight: Number.parseFloat(getComputedStyle(title).fontWeight) || 0,
              summaryFontSize: styleNumber(summary, 'fontSize'),
              summaryLineHeight: styleNumber(summary, 'lineHeight'),
              numbers: numbers.map(number => ({
                fontSize: styleNumber(number, 'fontSize'),
                lineHeight: styleNumber(number, 'lineHeight'),
                ariaHidden: number.getAttribute('aria-hidden'),
                color: getComputedStyle(number).color,
              })),
            };
          });
          assert.ok(resultTypography.toggleHeight >= 41.5);
          assert.ok(resultTypography.titleFontSize >= 15);
          assert.ok(resultTypography.titleLineHeight >= resultTypography.titleFontSize);
          assert.ok(resultTypography.titleWeight >= 600);
          assert.ok(resultTypography.summaryFontSize >= 13);
          assert.ok(
            resultTypography.summaryLineHeight >= resultTypography.summaryFontSize,
          );
          assert.ok(
            resultTypography.numbers.length === 3 &&
            resultTypography.numbers.every(number =>
              number.fontSize >= 14 && number.lineHeight >= 14 &&
              number.ariaHidden === 'true' && !/rgba\([^)]*,\s*0\)/u.test(number.color)
            ),
            'line numbers must be visibly readable without adding screen-reader noise',
          );
          assert.equal(await output.getAttribute('data-result-source'), 'ocr');
          assert.equal(await output.locator('.lia-canvasplus-line').count(), 3);
          assert.equal(await output.locator('.lia-canvasplus-transition').count(), 2);
          await page.waitForFunction(
            selector => {
              const list = document.querySelector(
                selector + ' .lia-canvasplus-steps[data-layout=side-rail]',
              ) as HTMLElement | null;
              if (list?.dataset.layoutReady !== '1') return false;
              const lines = Array.from(list.querySelectorAll<HTMLElement>(
                ':scope > .lia-canvasplus-step > .lia-canvasplus-line',
              ));
              const transitions = Array.from(list.querySelectorAll<HTMLElement>(
                ':scope > .lia-canvasplus-step > .lia-canvasplus-transition',
              ));
              return transitions.length === Math.max(0, lines.length - 1) &&
                transitions.every((transition, index) => {
                  const from = lines[index]?.getBoundingClientRect();
                  const to = lines[index + 1]?.getBoundingClientRect();
                  const trigger = transition.querySelector<HTMLElement>(
                    '.lia-canvasplus-transition-trigger',
                  )?.getBoundingClientRect();
                  if (!from || !to || !trigger) return false;
                  const desiredY = (
                    from.top + from.bottom + to.top + to.bottom
                  ) / 4;
                  const actualY = (trigger.top + trigger.bottom) / 2;
                  return Math.abs(actualY - desiredY) <= 2;
                });
            },
            plusPairSelector,
            { timeout: 10_000 },
          );
          const reviewRail = await output.locator(
            '.lia-canvasplus-steps[data-layout=side-rail]',
          ).evaluate(list => {
            const lines = Array.from(list.querySelectorAll<HTMLElement>(
              ':scope > .lia-canvasplus-step > .lia-canvasplus-line',
            ));
            const transitions = Array.from(list.querySelectorAll<HTMLElement>(
              ':scope > .lia-canvasplus-step > .lia-canvasplus-transition',
            ));
            return transitions.map((transition, index) => {
              const currentLine = lines[index].getBoundingClientRect();
              const nextLine = lines[index + 1].getBoundingClientRect();
              const currentEquation = lines[index]
                .querySelector<HTMLElement>('.lia-canvasplus-line-equation')!
                .getBoundingClientRect();
              const nextEquation = lines[index + 1]
                .querySelector<HTMLElement>('.lia-canvasplus-line-equation')!
                .getBoundingClientRect();
              const trigger = transition.querySelector<HTMLButtonElement>(
                '.lia-canvasplus-transition-trigger',
              )!;
              const triggerBox = trigger.getBoundingClientRect();
              const triggerY = (triggerBox.top + triggerBox.bottom) / 2;
              const fromY = (currentLine.top + currentLine.bottom) / 2;
              const toY = (nextLine.top + nextLine.bottom) / 2;
              const labelBox = transition.querySelector<HTMLElement>(
                '.lia-canvasplus-transition-label',
              )!.getBoundingClientRect();
              const arrow = transition.querySelector<HTMLElement>(
                '.lia-canvasplus-transition-arrow',
              )!;
              const detail = transition.querySelector<HTMLElement>(
                '.lia-canvasplus-transition-detail',
              )!;
              const svg = arrow.querySelector<SVGElement>('svg')!;
              const curvePath = svg.querySelector('path')?.getAttribute('d') || '';
              return {
                from: transition.dataset.fromIndex,
                to: transition.dataset.toIndex,
                position: getComputedStyle(transition).position,
                triggerBetweenLines: triggerY > fromY && triggerY < toY,
                centerDelta: Math.abs(triggerY - (fromY + toY) / 2),
                triggerRightOfMath: triggerBox.left >=
                  Math.max(currentEquation.right, nextEquation.right) - 1,
                lineGap: nextLine.top - currentLine.bottom,
                triggerTop: triggerBox.top,
                triggerBottom: triggerBox.bottom,
                triggerWidth: triggerBox.width,
                triggerHeight: triggerBox.height,
                labelWidth: labelBox.width,
                labelHeight: labelBox.height,
                arrowShape: arrow.dataset.shape,
                hasSvgCurve: /C/u.test(curvePath),
                svgFocusable: svg.getAttribute('focusable'),
                detailHidden: detail.hidden,
                detailPosition: getComputedStyle(detail).position,
                expanded: trigger.getAttribute('aria-expanded'),
                controlsMatch: trigger.getAttribute('aria-controls') === detail.id,
              };
            });
          });
          assert.equal(reviewRail.length, 2);
          reviewRail.forEach((transition, index) => {
            assert.equal(transition.from, String(index));
            assert.equal(transition.to, String(index + 1));
            assert.equal(transition.position, 'absolute');
            assert.equal(transition.triggerBetweenLines, true);
            assert.ok(transition.centerDelta <= 2);
            assert.equal(transition.triggerRightOfMath, true);
            assert.ok(
              transition.lineGap >= 0 && transition.lineGap < 44,
              'equations must not overlap or reserve a 44px transition row',
            );
            assert.ok(transition.triggerWidth >= 44 && transition.triggerWidth <= 48);
            assert.ok(
              transition.triggerHeight >= 43.5,
              'the nominal 44px transition target must survive subpixel layout rounding',
            );
            assert.ok(transition.labelWidth <= 1.5 && transition.labelHeight <= 1.5);
            assert.equal(transition.arrowShape, 'curved-down');
            assert.equal(transition.hasSvgCurve, true);
            assert.equal(transition.svgFocusable, 'false');
            assert.equal(transition.detailHidden, true);
            assert.equal(transition.detailPosition, 'absolute');
            assert.equal(transition.expanded, 'false');
            assert.equal(transition.controlsMatch, true);
          });
          for (let index = 1; index < reviewRail.length; index++) {
            assert.ok(
              reviewRail[index].triggerTop >= reviewRail[index - 1].triggerBottom - 0.5,
              'adjacent transition touch targets must not overlap',
            );
          }
          const relationStarts = await output.locator(
            '.lia-canvasplus-line-right',
          ).evaluateAll(nodes => nodes.map(node => node.getBoundingClientRect().x));
          assert.ok(
            Math.max(...relationStarts) - Math.min(...relationStarts) <= 1.5,
            'the row-wise renderer must align all relation signs in one column',
          );
          assert.equal(
            await output.locator('.lia-canvasplus-transition-trigger').first().getAttribute('aria-label'),
            'Transition from line 1 to line 2: correct.',
          );
          const submitMetrics = await page.evaluate(() => ({
              ensureLoadedCalls: (window as any).__liaCanvasPlusEnsureLoadedCalls,
              recognizeCalls: (window as any).__liaCanvasPlusRecognizeCalls,
              inputSizes: (window as any).__liaCanvasPlusInputSizes,
              preparedInBackground: (window as any).__liaCanvasPlusRenderEvents.at(-1)
                ?.preparedInBackground,
            }));
          assert.deepEqual(
            {
              ensureLoadedCalls: submitMetrics.ensureLoadedCalls,
              recognizeCalls: submitMetrics.recognizeCalls,
              preparedInBackground: submitMetrics.preparedInBackground,
            },
            {
              ensureLoadedCalls: 3,
              recognizeCalls: 5,
              preparedInBackground: false,
            },
            'model inference must start only after calculation submit',
          );
          assert.equal(submitMetrics.inputSizes.length, 5);
          assert.ok(
            submitMetrics.inputSizes.every(
              ([width, height]: [number, number]) => width > 0 && height > 0,
            ),
            'FormulaNet must receive five non-empty line/operation crops',
          );
          assert.equal(await page.locator('.lia-canvasplus-dialog').count(), 0);

          const rawRecognizedLines =
            '3x-5=7 \\mid +5\n3x=12 \\mid :3\nx=4';
          const rawInvalidLines =
            '3x-5=7 \\mid +5\n3x=13 \\mid :3\nx=4';
          const invalidManualAligned =
            '\\begin{aligned} 3x-5&=7 \\mid +5 \\\\ 3x&=13 \\mid :3 \\\\ x&=4 \\end{aligned}';
          const editButton = output.locator('.lia-canvasplus-edit');
          const inlineEditor = output.locator('.lia-canvasplus-inline-editor');
          const editTextarea = output.locator('.lia-canvasplus-inline-textarea');
          await editButton.click();
          assert.equal(await editButton.getAttribute('aria-expanded'), 'true');
          assert.equal(await editTextarea.inputValue(), rawRecognizedLines);
          await editTextarea.fill(rawInvalidLines);
          assert.equal(await output.getAttribute('data-latex'), firstAligned);
          await inlineEditor.locator('.lia-canvasplus-cancel').click();
          assert.equal(await inlineEditor.isHidden(), true);
          assert.equal(await output.getAttribute('data-latex'), firstAligned);

          await editButton.click();
          await editTextarea.fill(rawInvalidLines);
          await inlineEditor.locator('.lia-canvasplus-accept').click();
          await page.waitForFunction(
            ({ selector, tex }) => {
              const result = document.querySelector(
                selector + ' .lia-canvasplus-output',
              ) as HTMLElement | null;
              return result?.dataset.latex === tex &&
                result.dataset.analysisState === 'ready' &&
                result.querySelectorAll(
                  '.lia-canvasplus-transition[data-verdict=incorrect]',
                ).length === 2;
            },
            { selector: plusPairSelector, tex: invalidManualAligned },
            { timeout: 10_000 },
          );
          assert.equal(await output.getAttribute('data-result-source'), 'correction');
          assert.equal(
            await output.evaluate(node => (node as HTMLDetailsElement).open),
            true,
            'manual correction must preserve the user-opened disclosure',
          );
          assert.equal(await output.locator('.lia-canvasplus-line[data-error-side=right]').count(), 2);
          assert.deepEqual(
            await page.evaluate(() => ({
              ensureLoadedCalls: (window as any).__liaCanvasPlusEnsureLoadedCalls,
              recognizeCalls: (window as any).__liaCanvasPlusRecognizeCalls,
              corrections: (window as any).__liaCanvasPlusCorrectionEvents.length,
              renderSource: (window as any).__liaCanvasPlusRenderEvents.at(-1)?.source,
            })),
            {
              ensureLoadedCalls: 3,
              recognizeCalls: 5,
              corrections: 1,
              renderSource: 'correction',
            },
            'manual TeX correction must rerun only CAS, never OCR',
          );

          await plusSubmit.click();
          await page.waitForFunction(
            ({ selector, tex }) => {
              const result = document.querySelector(
                selector + ' .lia-canvasplus-output',
              ) as HTMLElement | null;
              return result?.dataset.latex === tex &&
                result.dataset.resultSource === 'correction' &&
                result.dataset.analysisState === 'ready' &&
                result.querySelectorAll(
                  '.lia-canvasplus-transition[data-verdict=incorrect]',
                ).length === 2;
            },
            { selector: plusPairSelector, tex: invalidManualAligned },
            { timeout: 10_000 },
          );
          assert.deepEqual(
            await page.evaluate(() => ({
              ensureLoadedCalls: (window as any).__liaCanvasPlusEnsureLoadedCalls,
              recognizeCalls: (window as any).__liaCanvasPlusRecognizeCalls,
              corrections: (window as any).__liaCanvasPlusCorrectionEvents.length,
            })),
            { ensureLoadedCalls: 3, recognizeCalls: 5, corrections: 1 },
            'an unchanged submit must preserve the manual correction',
          );

          const rawLeftErrorLines =
            'E_{kin}+mgh=\\frac{1}{2}mv^2 \\mid \\cdot 2\n' +
            '2E_{kin}+mgh=mv^2 \\mid :m';
          await editButton.click();
          await editTextarea.fill(rawLeftErrorLines);
          await inlineEditor.locator('.lia-canvasplus-accept').click();
          await page.waitForFunction(
            selector => {
              const result = document.querySelector(
                selector + ' .lia-canvasplus-output',
              ) as HTMLElement | null;
              return result?.dataset.analysisState === 'ready' &&
                result.querySelectorAll(
                  '.lia-canvasplus-transition[data-verdict=incorrect]',
                ).length === 1 &&
                result.querySelectorAll(
                  '.lia-canvasplus-line[data-error-side=left]',
                ).length === 1;
            },
            plusPairSelector,
            { timeout: 10_000 },
          );
          const leftErrorTransition = output.locator(
            '.lia-canvasplus-transition[data-code=operation-missing-left]',
          );
          assert.equal(await leftErrorTransition.count(), 1);
          const leftErrorTrigger = leftErrorTransition.locator(
            '.lia-canvasplus-transition-trigger',
          );
          await leftErrorTrigger.scrollIntoViewIfNeeded();
          await leftErrorTrigger.focus();
          const reviewList = output.locator('.lia-canvasplus-steps');
          const layoutBeforeDetail = await reviewList.evaluate(list => {
            const listBox = list.getBoundingClientRect();
            return {
              height: listBox.height,
              lineTops: Array.from(list.querySelectorAll<HTMLElement>(
                '.lia-canvasplus-line',
              )).map(line => line.getBoundingClientRect().top - listBox.top),
            };
          });
          await leftErrorTrigger.press('Enter');
          await page.waitForFunction(
            id => {
              const trigger = document.querySelector<HTMLButtonElement>(
                `[aria-controls=${id}]`,
              );
              const detail = document.getElementById(String(id));
              return trigger?.getAttribute('aria-expanded') === 'true' &&
                Boolean(detail && !detail.hidden);
            },
            await leftErrorTrigger.getAttribute('aria-controls'),
          );
          await page.evaluate(() => new Promise(resolve => {
            requestAnimationFrame(() => resolve(null));
          }));
          assert.equal(await leftErrorTrigger.getAttribute('aria-expanded'), 'true');
          assert.equal(await leftErrorTransition.getAttribute('data-expanded'), '1');
          assert.equal(
            await leftErrorTrigger.evaluate(node => document.activeElement === node),
            true,
          );
          assert.match(
            await leftErrorTransition.locator(
              '.lia-canvasplus-transition-detail',
            ).innerText(),
            /left side/i,
          );
          assert.equal(
            await leftErrorTransition.locator(
              '.lia-canvasplus-transition-detail',
            ).evaluate(node => getComputedStyle(node).position),
            'absolute',
          );
          const layoutAfterDetail = await reviewList.evaluate(list => {
            const listBox = list.getBoundingClientRect();
            return {
              height: listBox.height,
              lineTops: Array.from(list.querySelectorAll<HTMLElement>(
                '.lia-canvasplus-line',
              )).map(line => line.getBoundingClientRect().top - listBox.top),
            };
          });
          assert.ok(
            Math.abs(layoutAfterDetail.height - layoutBeforeDetail.height) <= 0.75 &&
            layoutAfterDetail.lineTops.every(
              (top, index) => Math.abs(top - layoutBeforeDetail.lineTops[index]) <= 0.75,
            ),
            'opening a transition explanation must not move equation rows',
          );

          const rawUnknownLines = '\\sin(x)=0\nx=0';
          await editButton.click();
          await editTextarea.fill(rawUnknownLines);
          await inlineEditor.locator('.lia-canvasplus-accept').click();
          await page.waitForFunction(
            selector => {
              const result = document.querySelector(
                selector + ' .lia-canvasplus-output',
              ) as HTMLElement | null;
              return result?.dataset.analysisState === 'ready' &&
                result.querySelectorAll(
                  '.lia-canvasplus-transition[data-verdict=unknown]',
                ).length === 1;
            },
            plusPairSelector,
            { timeout: 10_000 },
          );
          assert.equal(await output.locator('.lia-canvasplus-line[data-error-side]').count(), 0);
          assert.match(
            await output.locator(
              '.lia-canvasplus-transition[data-verdict=unknown] ' +
              '.lia-canvasplus-transition-trigger',
            ).getAttribute('aria-label') || '',
            /could not be checked reliably/i,
          );

          await editButton.click();
          await editTextarea.fill(rawRecognizedLines);
          await editTextarea.press('Control+Enter');
          await page.waitForFunction(
            ({ selector, tex }) => {
              const result = document.querySelector(
                selector + ' .lia-canvasplus-output',
              ) as HTMLElement | null;
              return result?.dataset.latex === tex &&
                result.dataset.analysisState === 'ready' &&
                result.querySelectorAll(
                  '.lia-canvasplus-transition[data-verdict=correct]',
                ).length === 2;
            },
            { selector: plusPairSelector, tex: firstAligned },
            { timeout: 10_000 },
          );
          assert.equal(await output.locator('.lia-canvasplus-line[data-error-side]').count(), 0);
          assert.equal(
            await page.evaluate(() => (window as any).__liaCanvasPlusCorrectionEvents.length),
            4,
          );
          await page.waitForFunction(
            selector =>
              document.activeElement === document.querySelector(
                selector + ' .lia-canvasplus-edit',
              ),
            plusPairSelector,
            { timeout: 5_000 },
          );

          await editButton.click();
          await page.evaluate(() => document.body.classList.add('lia-snapshot-mode'));
          await page.waitForFunction(
            selector => {
              const result = document.querySelector(selector + ' .lia-canvasplus-output');
              const editor = result?.querySelector(
                '.lia-canvasplus-inline-editor',
              ) as HTMLElement | null;
              const edit = result?.querySelector(
                '.lia-canvasplus-edit',
              ) as HTMLButtonElement | null;
              const submit = document.querySelector(
                selector + ' .lia-canvasplus-submit',
              ) as HTMLButtonElement | null;
              return Boolean(editor?.hidden) && Boolean(edit?.disabled) &&
                Boolean(submit?.disabled) &&
                !editor?.contains(document.activeElement);
            },
            plusPairSelector,
            { timeout: 5_000 },
          );
          assert.equal(await output.getAttribute('data-latex'), firstAligned);
          await page.evaluate(() => document.body.classList.remove('lia-snapshot-mode'));
          await page.waitForFunction(
            selector => {
              const edit = document.querySelector(
                selector + ' .lia-canvasplus-edit',
              ) as HTMLButtonElement | null;
              const submit = document.querySelector(
                selector + ' .lia-canvasplus-submit',
              ) as HTMLButtonElement | null;
              return Boolean(edit && !edit.disabled && submit && !submit.disabled);
            },
            plusPairSelector,
            { timeout: 5_000 },
          );

          await plusSubmit.click();
          await page.waitForFunction(
            selector =>
              document.querySelector(selector + ' .lia-canvasplus-output')
                ?.getAttribute('data-state') === 'ready',
            plusPairSelector,
            { timeout: 5_000 },
          );
          assert.deepEqual(
            await page.evaluate(() => ({
              ensureLoadedCalls: (window as any).__liaCanvasPlusEnsureLoadedCalls,
              recognizeCalls: (window as any).__liaCanvasPlusRecognizeCalls,
            })),
            { ensureLoadedCalls: 3, recognizeCalls: 5 },
            'submitting an unchanged block must reuse the complete draft',
          );

          await plusCanvas.scrollIntoViewIfNeeded();
          const updatedPlusBox = await plusCanvas.boundingBox();
          assert.ok(updatedPlusBox, 'the calculation drawing surface moved out of view');
          await drawMouseStroke(
            page,
            updatedPlusBox.x + updatedPlusBox.width * 0.46,
            updatedPlusBox.y + updatedPlusBox.height * 0.63,
            updatedPlusBox.x + updatedPlusBox.width * 0.58,
            updatedPlusBox.y + updatedPlusBox.height * 0.72,
          );
          await page.waitForFunction(
            selector =>
              document.querySelector(selector + ' .lia-canvasplus-output')
                ?.getAttribute('data-state') === 'stale',
            plusPairSelector,
            { timeout: 5_000 },
          );
          await page.waitForFunction(
            selector =>
              document.querySelector(selector)?.getAttribute('data-ocr-background') === 'manual',
            plusPairSelector,
            { timeout: 5_000 },
          );
          await hostDelay(2_100);
          assert.deepEqual(
            await page.evaluate(() => ({
              ensureLoadedCalls: (window as any).__liaCanvasPlusEnsureLoadedCalls,
              recognizeCalls: (window as any).__liaCanvasPlusRecognizeCalls,
            })),
            { ensureLoadedCalls: 3, recognizeCalls: 5 },
            'continuing to write must not start model inference',
          );
          assert.equal(
            await plusPair.locator('.lia-canvasplus-standalone-status').getAttribute('data-state'),
            'stale',
          );
          assert.equal(await output.getAttribute('data-state'), 'stale');
          assert.equal(await output.getAttribute('data-analysis-state'), 'stale');
          assert.equal(
            await output.evaluate(node => (node as HTMLDetailsElement).open),
            true,
            'a stale result must preserve the disclosure state chosen by the user',
          );
          assert.equal(await editButton.isDisabled(), true);
          assert.equal(
            await output.locator('.lia-canvasplus-transition[data-stale="1"]').count(),
            2,
          );

          const updatedAligned = '\\begin{aligned} 3x-5&=7 \\mid +5 \\\\ 3x&=15 \\mid :3 \\\\ x&=4 \\end{aligned}';
          await plusSubmit.click();
          await page.waitForFunction(
            ({ selector, tex }) =>
              document
                .querySelector(selector + ' .lia-canvasplus-rendered')
                ?.getAttribute('data-rendered-tex') === tex,
            { selector: plusPairSelector, tex: updatedAligned },
            { timeout: 10_000 },
          );
          assert.equal(await output.getAttribute('data-state'), 'ready');
          await page.waitForFunction(
            selector => {
              const result = document.querySelector(
                selector + ' .lia-canvasplus-output',
              ) as HTMLElement | null;
              return result?.dataset.analysisState === 'ready' &&
                result.querySelectorAll(
                  '.lia-canvasplus-transition[data-verdict=incorrect]',
                ).length === 2;
            },
            plusPairSelector,
            { timeout: 10_000 },
          );
          assert.equal(
            await output.evaluate(node => (node as HTMLDetailsElement).open),
            true,
            'rerendering stale handwriting must preserve the open disclosure',
          );
          assert.deepEqual(
            await page.evaluate(() => ({
              ensureLoadedCalls: (window as any).__liaCanvasPlusEnsureLoadedCalls,
              recognizeCalls: (window as any).__liaCanvasPlusRecognizeCalls,
            })),
            { ensureLoadedCalls: 4, recognizeCalls: 8 },
            'a certain hookless vector bar must recover the colon from whole-line OCR',
          );

          await plusCanvas.scrollIntoViewIfNeeded();
          const firstLineUpdateBox = await plusCanvas.boundingBox();
          assert.ok(firstLineUpdateBox, 'the first line moved out of view');
          await drawMouseStroke(
            page,
            firstLineUpdateBox.x + firstLineUpdateBox.width * 0.34,
            firstLineUpdateBox.y + firstLineUpdateBox.height * 0.27,
            firstLineUpdateBox.x + firstLineUpdateBox.width * 0.38,
            firstLineUpdateBox.y + firstLineUpdateBox.height * 0.31,
          );
          await page.waitForFunction(
            selector =>
              document.querySelector(selector + ' .lia-canvasplus-output')
                ?.getAttribute('data-state') === 'stale',
            plusPairSelector,
            { timeout: 5_000 },
          );
          const weakSideAligned = '\\begin{aligned} 3x-5&=7 \\mid +5 \\\\ 3x&=15 \\mid :3 \\\\ x&=4 \\end{aligned}';
          await plusSubmit.click();
          await page.waitForFunction(
            ({ selector, tex }) =>
              document
                .querySelector(selector + ' .lia-canvasplus-rendered')
                ?.getAttribute('data-rendered-tex') === tex,
            { selector: plusPairSelector, tex: weakSideAligned },
            { timeout: 10_000 },
          );
          assert.deepEqual(
            await page.evaluate(selector => {
              const result = document.querySelector(selector + ' .lia-canvasplus-output');
              const latex = String(result?.getAttribute('data-latex') || '');
              return {
                latex,
                corruptedBar: latex.includes('71') || latex.includes('121'),
                ensureLoadedCalls: (window as any).__liaCanvasPlusEnsureLoadedCalls,
                recognizeCalls: (window as any).__liaCanvasPlusRecognizeCalls,
              };
            }, plusPairSelector),
            {
              latex: weakSideAligned,
              corruptedBar: false,
              ensureLoadedCalls: 5,
              recognizeCalls: 11,
            },
            'both hookless bars must recover + or : from matching whole-line OCR',
          );

          await plusPair.locator('.lia-eraser-btn:visible').click();
          const clearButton = plusPair.locator('.lia-tool-menu [data-act=clear]:visible');
          await clearButton.waitFor({ state: 'visible', timeout: 5_000 });
          await clearButton.click();
          await page.waitForFunction(
            selector => {
              const pair = document.querySelector(selector);
              const result = pair?.querySelector('.lia-canvasplus-output') as HTMLElement | null;
              const submit = pair?.querySelector('.lia-canvasplus-submit') as HTMLButtonElement | null;
              return pair?.getAttribute('data-ocr-background') === 'idle' &&
                Boolean(result?.hidden) &&
                Boolean(submit?.disabled);
            },
            plusPairSelector,
            { timeout: 5_000 },
          );
          await hostDelay(2_100);
          assert.equal(
            await page.evaluate(() => (window as any).__liaCanvasPlusRecognizeCalls),
            11,
            'clearing the block must not enqueue more OCR work',
          );
          assert.equal(await output.getAttribute('data-analysis-state'), 'idle');
          assert.equal(
            await output.evaluate(node => (node as HTMLDetailsElement).open),
            false,
            'clearing the handwriting must reset the disclosure to closed',
          );
          assert.equal(await output.locator('.lia-canvasplus-line').count(), 0);
          assert.equal(await output.locator('.lia-canvasplus-transition').count(), 0);
          assert.equal(await editButton.isDisabled(), true);

          // Regression for a quadratic school calculation where a detached,
          // tall digit stem scores better geometrically than the real
          // operation bar. Every plausible bar must be tried before the
          // recognizer falls back to the complete line.
          await page.evaluate(() => {
            (window as any).__liaQuadraticEnsureLoadedCalls = 0;
            (window as any).__liaQuadraticRecognizeCalls = 0;
            (window as any).__liaQuadraticInputSizes = [];
            window.__LIA_CANVAS_OCR__.ocr = {
              model: 'quadratic-multi-separator-stub',
              precision: 'fp32',
              task: 'image-to-text',
              cacheKey: 'quadratic-multi-separator-regression',
              outputKind: 'latex',
              inputProfile: 'formulanet-line-384',
              calculationSinglePass: true,
              ensureLoaded: async () => {
                (window as any).__liaQuadraticEnsureLoadedCalls++;
                return true;
              },
              recognize: async (input: HTMLCanvasElement) => {
                (window as any).__liaQuadraticInputSizes.push([
                  input.width,
                  input.height,
                ]);
                const call = ++(window as any).__liaQuadraticRecognizeCalls;
                if (call === 1) return '4x^{2}-5=-2+';
                if (call === 2) return '5';
                if (call === 3) return '4x^{2}-5=-2';
                if (call === 4) return '';
                if (call === 5) return '4x^{2}-5=-21+5';
                if (call === 6) return '4x^{2}=3:';
                if (call === 7) return '4';
                if (call === 8) return '4x^{2}=3';
                if (call === 9) return '';
                if (call === 10) return '4x^{2}=31:4';
                if (call === 11) return 'x^{2}=\\frac{3}{4}';
                if (call === 12) {
                  // FormulaNet can omit the compact three-stroke ± even
                  // while retaining the indexed root notation.
                  return '\\Rightarrow x_{12}=\\sqrt{\\frac{3}{4}}';
                }
                if (call === 13) return '\\Rightarrow x_{12}=';
                if (call === 14) return '\\sqrt{\\frac{3}{4}}';
                throw new Error('unexpected quadratic separator OCR call');
              },
            };
            window.__LIA_CANVAS_OCR__.canvasPlusOcr =
              window.__LIA_CANVAS_OCR__.ocr;
          });
          await plusPair.locator('.lia-color-btn:visible').click();
          await plusPair.locator('.lia-tool-menu [data-act=close]:visible').click();
          await plusCanvas.scrollIntoViewIfNeeded();
          const quadraticBox = await plusCanvas.boundingBox();
          assert.ok(quadraticBox, 'the quadratic regression surface is unavailable');
          const drawQuadraticLine = async (
            centerY: number,
            equationStart = 0.12,
          ) => {
            await drawMouseStroke(
              page,
              quadraticBox.x + quadraticBox.width * equationStart,
              quadraticBox.y + quadraticBox.height * centerY,
              quadraticBox.x + quadraticBox.width * 0.55,
              quadraticBox.y + quadraticBox.height * centerY,
            );
            await drawMouseStroke(
              page,
              quadraticBox.x + quadraticBox.width * 0.60,
              quadraticBox.y + quadraticBox.height * (centerY - 0.09),
              quadraticBox.x + quadraticBox.width * 0.60,
              quadraticBox.y + quadraticBox.height * (centerY + 0.09),
            );
            await drawMouseStroke(
              page,
              quadraticBox.x + quadraticBox.width * 0.67,
              quadraticBox.y + quadraticBox.height * centerY,
              quadraticBox.x + quadraticBox.width * 0.71,
              quadraticBox.y + quadraticBox.height * centerY,
            );
            await drawMouseStroke(
              page,
              quadraticBox.x + quadraticBox.width * 0.80,
              quadraticBox.y + quadraticBox.height * (centerY - 0.09),
              quadraticBox.x + quadraticBox.width * 0.80,
              quadraticBox.y + quadraticBox.height * (centerY + 0.09),
            );
            await drawMouseStroke(
              page,
              quadraticBox.x + quadraticBox.width * 0.88,
              quadraticBox.y + quadraticBox.height * centerY,
              quadraticBox.x + quadraticBox.width * 0.92,
              quadraticBox.y + quadraticBox.height * centerY,
            );
          };
          await drawQuadraticLine(0.14);
          await drawQuadraticLine(0.38, 0.16);
          await drawMouseStroke(
            page,
            quadraticBox.x + quadraticBox.width * 0.26,
            quadraticBox.y + quadraticBox.height * 0.62,
            quadraticBox.x + quadraticBox.width * 0.68,
            quadraticBox.y + quadraticBox.height * 0.62,
          );
          await drawMouseStroke(
            page,
            quadraticBox.x + quadraticBox.width * 0.24,
            quadraticBox.y + quadraticBox.height * 0.86,
            quadraticBox.x + quadraticBox.width * 0.70,
            quadraticBox.y + quadraticBox.height * 0.86,
          );
          // Independent vector evidence for a handwritten ±. The OCR stub
          // deliberately drops it; calculation OCR may restore it only from these
          // three strokes, never from the expected algebraic result alone.
          await drawMouseStroke(
            page,
            quadraticBox.x + quadraticBox.width * 0.75,
            quadraticBox.y + quadraticBox.height * 0.82,
            quadraticBox.x + quadraticBox.width * 0.79,
            quadraticBox.y + quadraticBox.height * 0.82,
          );
          await drawMouseStroke(
            page,
            quadraticBox.x + quadraticBox.width * 0.77,
            quadraticBox.y + quadraticBox.height * 0.79,
            quadraticBox.x + quadraticBox.width * 0.77,
            quadraticBox.y + quadraticBox.height * 0.85,
          );
          await drawMouseStroke(
            page,
            quadraticBox.x + quadraticBox.width * 0.75,
            quadraticBox.y + quadraticBox.height * 0.89,
            quadraticBox.x + quadraticBox.width * 0.79,
            quadraticBox.y + quadraticBox.height * 0.89,
          );
          // Keep real ink on both sides of the ± hint. The split validator
          // must never ask FormulaNet to recognize a completely blank crop.
          await drawMouseStroke(
            page,
            quadraticBox.x + quadraticBox.width * 0.82,
            quadraticBox.y + quadraticBox.height * 0.86,
            quadraticBox.x + quadraticBox.width * 0.94,
            quadraticBox.y + quadraticBox.height * 0.86,
          );
          const quadraticLatex = '\\begin{aligned} 4x^{2}-5&=-2 \\mid +5 \\\\ 4x^{2}&=3 \\mid :4 \\\\ x^{2}&=\\frac{3}{4} \\\\ \\Rightarrow x_{12}&=\\pm\\sqrt{\\frac{3}{4}} \\end{aligned}';
          await plusSubmit.click();
          await page.waitForFunction(
            selector => {
              const result = document.querySelector(
                selector + ' .lia-canvasplus-output',
              ) as HTMLElement | null;
              return result?.dataset.analysisState === 'ready';
            },
            plusPairSelector,
            { timeout: 10_000 },
          );
          assert.equal(
            await output.getAttribute('data-latex'),
            quadraticLatex,
            'the quadratic multi-separator OCR result changed',
          );
          assert.equal(
            await output.evaluate(node => (node as HTMLDetailsElement).open),
            false,
            'the next independent result must again start behind the spoiler',
          );
          await resultToggle.focus();
          await resultToggle.press('Enter');
          await page.waitForFunction(
            selector => Boolean((document.querySelector(
              selector + ' .lia-canvasplus-output',
            ) as HTMLDetailsElement | null)?.open),
            plusPairSelector,
            { timeout: 5_000 },
          );
          const quadraticResult = await page.evaluate(selector => {
            const result = document.querySelector(
              selector + ' .lia-canvasplus-output',
            ) as HTMLElement | null;
            const sizes = (window as any).__liaQuadraticInputSizes as number[][];
            return {
              latex: result?.dataset.latex || '',
              lineCount: result?.dataset.lineCount || '',
              ensureLoadedCalls: (window as any).__liaQuadraticEnsureLoadedCalls,
              recognizeCalls: (window as any).__liaQuadraticRecognizeCalls,
              falseCandidateRatios: [
                sizes[0][0] / sizes[1][0],
                sizes[5][0] / sizes[6][0],
              ],
              selectedCandidateRatios: [
                sizes[2][0] / sizes[3][0],
                sizes[7][0] / sizes[8][0],
              ],
              verdicts: Array.from(result?.querySelectorAll(
                '.lia-canvasplus-transition',
              ) || []).map(node => (node as HTMLElement).dataset.verdict),
              codes: Array.from(result?.querySelectorAll(
                '.lia-canvasplus-transition',
              ) || []).map(node => (node as HTMLElement).dataset.code),
            };
          }, plusPairSelector);
          assert.equal(quadraticResult.latex, quadraticLatex);
          assert.equal(quadraticResult.lineCount, '4');
          assert.equal(quadraticResult.ensureLoadedCalls, 4);
          assert.equal(quadraticResult.recognizeCalls, 14);
          assert.ok(
            quadraticResult.falseCandidateRatios.every(ratio => ratio > 4),
            'the deliberately taller digit stems must be tried before the real bars',
          );
          assert.ok(
            quadraticResult.selectedCandidateRatios.every(
              ratio => ratio > 1 && ratio < 3,
            ),
            'the later, semantically valid operation bars must win',
          );
          assert.deepEqual(quadraticResult.verdicts, [
            'correct',
            'correct',
            'correct',
          ]);
          assert.deepEqual(quadraticResult.codes, [
            'operation-applied-both-sides',
            'operation-applied-both-sides',
            'quadratic-root-solutions',
          ]);
          assert.equal((quadraticResult.latex.match(/\\mid/g) || []).length, 2);
          assert.equal(/-21|31|241\.4|;/.test(quadraticResult.latex), false);

          const manuallyCorrectedQuadraticLinesWithoutSign =
            '4x^2-5=-2 \\mid +5\n' +
            '4x^2=3 \\mid :4\n' +
            'x^2=\\frac{3}{4}\n' +
            '\\Rightarrow x_{1,2}=\\sqrt{\\frac{3}{4}}';
          const manuallyCorrectedQuadraticLines =
            manuallyCorrectedQuadraticLinesWithoutSign.replace(
              '=\\sqrt',
              '=\\pm\\sqrt',
            );
          const manuallyCorrectedQuadraticLatex =
            '\\begin{aligned} 4x^2-5&=-2 \\mid +5 \\\\ ' +
            '4x^2&=3 \\mid :4 \\\\ ' +
            'x^2&=\\frac{3}{4} \\\\ ' +
            '\\Rightarrow x_{1,2}&=\\pm\\sqrt{\\frac{3}{4}} \\end{aligned}';
          await editButton.click();
          const contextTrapLine = 'y_{1,2}=\\sqrt{4}';
          await editTextarea.fill(
            contextTrapLine + '\n' + manuallyCorrectedQuadraticLinesWithoutSign,
          );
          const insertPlusMinus = inlineEditor.locator(
            '.lia-canvasplus-insert-pm',
          );
          await insertPlusMinus.waitFor({ state: 'visible', timeout: 5_000 });
          await insertPlusMinus.click();
          const contextCheckedValue = await editTextarea.inputValue();
          assert.equal(contextCheckedValue.split('\n')[0], contextTrapLine);
          assert.ok(
            contextCheckedValue.endsWith(
              '\\Rightarrow x_{1,2}=\\pm\\sqrt{\\frac{3}{4}}',
            ),
            'the insert action must modify only the context-confirmed root line',
          );
          await editTextarea.fill(manuallyCorrectedQuadraticLinesWithoutSign);
          await insertPlusMinus.waitFor({ state: 'visible', timeout: 5_000 });
          assert.equal(
            await inlineEditor.locator('.lia-canvasplus-edit-validation')
              .getAttribute('data-state'),
            'warning',
          );
          await insertPlusMinus.click();
          assert.equal(await editTextarea.inputValue(), manuallyCorrectedQuadraticLines);
          await inlineEditor.locator('.lia-canvasplus-accept').click();
          await page.waitForFunction(
            ({ selector, tex }) => {
              const result = document.querySelector(
                selector + ' .lia-canvasplus-output',
              ) as HTMLElement | null;
              return result?.dataset.latex === tex &&
                result.dataset.resultSource === 'correction' &&
                result.dataset.analysisState === 'ready' &&
                result.querySelectorAll(
                  '.lia-canvasplus-transition[data-verdict=correct]',
                ).length === 3;
            },
            {
              selector: plusPairSelector,
              tex: manuallyCorrectedQuadraticLatex,
            },
            { timeout: 10_000 },
          );
          assert.deepEqual(
            await output.locator('.lia-canvasplus-transition').evaluateAll(nodes =>
              nodes.map(node => (node as HTMLElement).dataset.code),
            ),
            [
              'operation-applied-both-sides',
              'operation-applied-both-sides',
              'quadratic-root-solutions',
            ],
          );
          assert.equal(
            await page.evaluate(() => (window as any).__liaQuadraticRecognizeCalls),
            14,
            'manual root-notation correction must rerun only CAS, never OCR',
          );

          // Formula OCR can confuse the comma in x_{1,2} with a slash. The
          // actual result UI must still validate this narrowly proven
          // quadratic-root step without treating arbitrary fraction indices
          // as solution-pair notation.
          const slashConfusedQuadraticLines =
            manuallyCorrectedQuadraticLines.replace('x_{1,2}', 'x_{1/2}');
          const slashConfusedQuadraticLatex =
            manuallyCorrectedQuadraticLatex.replace('x_{1,2}', 'x_{1/2}');
          await editButton.click();
          await editTextarea.fill(slashConfusedQuadraticLines);
          await inlineEditor.locator('.lia-canvasplus-accept').click();
          await page.waitForFunction(
            ({ selector, tex }) => {
              const result = document.querySelector(
                selector + ' .lia-canvasplus-output',
              ) as HTMLElement | null;
              return result?.dataset.latex === tex &&
                result.dataset.resultSource === 'correction' &&
                result.dataset.analysisState === 'ready' &&
                result.querySelectorAll(
                  '.lia-canvasplus-transition[data-verdict=correct]',
                ).length === 3;
            },
            {
              selector: plusPairSelector,
              tex: slashConfusedQuadraticLatex,
            },
            { timeout: 10_000 },
          );
          assert.deepEqual(
            await output.locator('.lia-canvasplus-transition').evaluateAll(nodes =>
              nodes.map(node => (node as HTMLElement).dataset.code),
            ),
            [
              'operation-applied-both-sides',
              'operation-applied-both-sides',
              'quadratic-root-solutions',
            ],
          );
          assert.equal(
            await page.evaluate(() => (window as any).__liaQuadraticRecognizeCalls),
            14,
            'the slash-confused solution index must rerun only CAS, never OCR',
          );

          // Exact manual-correction form from the reported screenshot:
          // sqrt(3/4) is equivalently written as sqrt(3)/2.
          const simplifiedRadicalQuadraticLines =
            manuallyCorrectedQuadraticLines.replace(
              '\\pm\\sqrt{\\frac{3}{4}}',
              '\\pm\\frac{\\sqrt{3}}{2}',
            );
          const simplifiedRadicalQuadraticLatex =
            manuallyCorrectedQuadraticLatex.replace(
              '\\pm\\sqrt{\\frac{3}{4}}',
              '\\pm\\frac{\\sqrt{3}}{2}',
            );
          await editButton.click();
          await editTextarea.fill(simplifiedRadicalQuadraticLines);
          await inlineEditor.locator('.lia-canvasplus-accept').click();
          await page.waitForFunction(
            ({ selector, tex }) => {
              const result = document.querySelector(
                selector + ' .lia-canvasplus-output',
              ) as HTMLElement | null;
              return result?.dataset.latex === tex &&
                result.dataset.resultSource === 'correction' &&
                result.dataset.analysisState === 'ready' &&
                result.querySelectorAll(
                  '.lia-canvasplus-transition[data-verdict=correct]',
                ).length === 3;
            },
            {
              selector: plusPairSelector,
              tex: simplifiedRadicalQuadraticLatex,
            },
            { timeout: 10_000 },
          );
          assert.deepEqual(
            await output.locator('.lia-canvasplus-transition').evaluateAll(nodes =>
              nodes.map(node => (node as HTMLElement).dataset.code),
            ),
            [
              'operation-applied-both-sides',
              'operation-applied-both-sides',
              'quadratic-root-solutions',
            ],
          );
          assert.equal(
            await page.evaluate(() => (window as any).__liaQuadraticRecognizeCalls),
            14,
            'the equivalent sqrt(3)/2 correction must rerun only CAS, never OCR',
          );

          // Exact continuation behavior from the reported classroom case:
          // the first step is deliberately wrong, but the following division
          // and square-root steps must still be checked independently. Formula
          // OCR may emit both a plain \to marker and an unbraced \sqrt6.
          const continuesAfterErrorLines =
            '3x^2-5=12 \\mid +5\n' +
            '3x^2=18 \\mid :3\n' +
            'x^2=6\n' +
            '\\to x_{1,2}=\\pm\\sqrt6';
          await editButton.click();
          await editTextarea.fill(continuesAfterErrorLines);
          await inlineEditor.locator('.lia-canvasplus-accept').click();
          await page.waitForFunction(
            selector => {
              const result = document.querySelector(
                selector + ' .lia-canvasplus-output',
              ) as HTMLElement | null;
              const verdicts = Array.from(result?.querySelectorAll(
                '.lia-canvasplus-transition',
              ) || []).map(node => (node as HTMLElement).dataset.verdict);
              return result?.dataset.resultSource === 'correction' &&
                result.dataset.analysisState === 'ready' &&
                verdicts.join(',') === 'incorrect,correct,correct';
            },
            plusPairSelector,
            { timeout: 10_000 },
          );
          const continuedTransitions = output.locator(
            '.lia-canvasplus-transition',
          );
          assert.deepEqual(
            await continuedTransitions.evaluateAll(nodes =>
              nodes.map(node => (node as HTMLElement).dataset.verdict),
            ),
            ['incorrect', 'correct', 'correct'],
          );
          assert.equal(
            await continuedTransitions.nth(1).getAttribute('data-code'),
            'operation-applied-both-sides',
          );
          assert.equal(
            await continuedTransitions.nth(2).getAttribute('data-code'),
            'quadratic-root-solutions',
          );
          assert.equal(
            await output.locator(
              '.lia-canvasplus-transition[data-verdict=unknown]',
            ).count(),
            0,
          );
          assert.equal(
            await page.evaluate(() => (window as any).__liaQuadraticRecognizeCalls),
            14,
            'manual correction must continue with CAS only and never rerun OCR',
          );

          // Exact TeX copied from the reported correction. The leading
          // FormulaNet command \Rarr and the equivalent magnitude 3/sqrt(2)
          // must both reach the same CAS-proven quadratic-root verdict.
          const radicalDenominatorLines =
            '2 x ^ { 2 } - 4 = 5 \\mid + 4\n' +
            '2 x ^ { 2 } = 9 \\mid : 2\n' +
            'x ^ { 2 } = \\frac { 9 } { 2 }\n' +
            '\\Rarr x _ { 1, 2 } = \\pm \\frac { 3 } { \\sqrt { 2 } }';
          await editButton.click();
          await editTextarea.fill(radicalDenominatorLines);
          await inlineEditor.locator('.lia-canvasplus-accept').click();
          await page.waitForFunction(
            selector => {
              const result = document.querySelector(
                selector + ' .lia-canvasplus-output',
              ) as HTMLElement | null;
              return result?.dataset.resultSource === 'correction' &&
                result.dataset.analysisState === 'ready' &&
                result.querySelectorAll(
                  '.lia-canvasplus-transition[data-verdict=correct]',
                ).length === 3;
            },
            plusPairSelector,
            { timeout: 10_000 },
          );
          assert.deepEqual(
            await output.locator('.lia-canvasplus-transition').evaluateAll(nodes =>
              nodes.map(node => (node as HTMLElement).dataset.code),
            ),
            [
              'operation-applied-both-sides',
              'operation-applied-both-sides',
              'quadratic-root-solutions',
            ],
          );
          assert.equal(
            await output.locator(
              '.lia-canvasplus-transition[data-verdict=unknown]',
            ).count(),
            0,
          );
          assert.equal(
            await page.evaluate(() => (window as any).__liaQuadraticRecognizeCalls),
            14,
            'the radical-denominator correction must rerun only CAS, never OCR',
          );

          // Exact cubic-root correction reported from the classroom UI. A
          // third power has one real cube-root solution, so this final step
          // must be checked without inventing an indexed or plus-minus pair.
          const cubicRootLines =
            '3 x ^ { 3 } - 4 = 0 \\mid + 4\n' +
            '3 x ^ { 3 } = 4 \\mid : 3\n' +
            'x ^ { 3 } = \\frac { 4 } { 3 }\n' +
            '\\Rarr x = \\sqrt [ 3 ] { \\frac { 4 } { 3 } }';
          await editButton.click();
          await editTextarea.fill(cubicRootLines);
          await inlineEditor.locator('.lia-canvasplus-accept').click();
          await page.waitForFunction(
            selector => {
              const result = document.querySelector(
                selector + ' .lia-canvasplus-output',
              ) as HTMLElement | null;
              return result?.dataset.resultSource === 'correction' &&
                result.dataset.analysisState === 'ready' &&
                result.querySelectorAll(
                  '.lia-canvasplus-transition[data-verdict=correct]',
                ).length === 3;
            },
            plusPairSelector,
            { timeout: 10_000 },
          );
          const cubicTransitions = output.locator(
            '.lia-canvasplus-transition',
          );
          assert.deepEqual(
            await cubicTransitions.evaluateAll(nodes =>
              nodes.map(node => (node as HTMLElement).dataset.code),
            ),
            [
              'operation-applied-both-sides',
              'operation-applied-both-sides',
              'cubic-root-solution',
            ],
          );
          assert.equal(
            await output.locator(
              '.lia-canvasplus-transition[data-verdict=incorrect], ' +
              '.lia-canvasplus-transition[data-verdict=unknown]',
            ).count(),
            0,
          );
          assert.equal(
            await output.locator('.lia-canvasplus-line').nth(3).getAttribute(
              'data-raw-latex',
            ),
            '\\Rarr x = \\sqrt [ 3 ] { \\frac { 4 } { 3 } }',
          );
         assert.equal(
           await page.evaluate(() => (window as any).__liaQuadraticRecognizeCalls),
           14,
           'the cubic-root correction must rerun only CAS, never OCR',
         );

          // Exact fourth-root correction reported from the classroom UI. An
          // even fourth power has the two real roots written with an explicit
          // plus-minus sign; the radicand must still be proved by the CAS.
          const quarticRootLines =
            '3 m ^ { 4 } = 5 \\mid : 3\n' +
            'm ^ { 4 } = \\frac { 5 } { 3 }\n' +
            '\\Rarr m _ { 1, 2 } = \\pm \\sqrt [ 4 ] { \\frac { 5 } { 3 } }';
          await editButton.click();
          await editTextarea.fill(quarticRootLines);
          await inlineEditor.locator('.lia-canvasplus-accept').click();
          await page.waitForFunction(
            selector => {
              const result = document.querySelector(
                selector + ' .lia-canvasplus-output',
              ) as HTMLElement | null;
              return result?.dataset.resultSource === 'correction' &&
                result.dataset.analysisState === 'ready' &&
                result.querySelectorAll(
                  '.lia-canvasplus-transition[data-verdict=correct]',
                ).length === 2 &&
                result.querySelectorAll('.lia-canvasplus-transition').length === 2;
            },
            plusPairSelector,
            { timeout: 10_000 },
          );
          const quarticTransitions = output.locator(
            '.lia-canvasplus-transition',
          );
          assert.deepEqual(
            await quarticTransitions.evaluateAll(nodes =>
              nodes.map(node => (node as HTMLElement).dataset.code),
            ),
            [
              'operation-applied-both-sides',
              'quartic-root-solutions',
            ],
          );
          assert.equal(
            await output.locator(
              '.lia-canvasplus-transition[data-verdict=incorrect], ' +
              '.lia-canvasplus-transition[data-verdict=unknown]',
            ).count(),
            0,
          );
          assert.equal(
            await output.locator('.lia-canvasplus-line').nth(2).getAttribute(
              'data-raw-latex',
            ),
            '\\Rarr m _ { 1, 2 } = \\pm \\sqrt [ 4 ] { \\frac { 5 } { 3 } }',
          );
          assert.equal(
            await page.evaluate(() => (window as any).__liaQuadraticRecognizeCalls),
            14,
            'the fourth-root correction must rerun only CAS, never OCR',
          );

         await plusPair.locator('.lia-eraser-btn:visible').click();
          const quadraticClear = plusPair.locator(
            '.lia-tool-menu [data-act=clear]:visible',
          );
          await quadraticClear.waitFor({ state: 'visible', timeout: 5_000 });
          await quadraticClear.click();
          await page.waitForFunction(
            selector => {
              const pair = document.querySelector(selector);
              const result = pair?.querySelector(
                '.lia-canvasplus-output',
              ) as HTMLElement | null;
              return pair?.getAttribute('data-ocr-background') === 'idle' &&
                Boolean(result?.hidden);
            },
            plusPairSelector,
            { timeout: 5_000 },
          );

          // Negative E2E: a mathematically expected ± must not be invented
          // when the learner did not draw the three-stroke symbol.
          await page.evaluate(() => {
            (window as any).__liaMissingPmRecognizeCalls = 0;
            window.__LIA_CANVAS_OCR__.ocr = {
              model: 'missing-pm-no-geometry-stub',
              precision: 'fp32',
              task: 'image-to-text',
              cacheKey: 'missing-pm-no-geometry-regression',
              outputKind: 'latex',
              inputProfile: 'formulanet-line-384',
              calculationSinglePass: true,
              ensureLoaded: async () => true,
              recognize: async () => {
                const call = ++(window as any).__liaMissingPmRecognizeCalls;
                if (call === 1) return 'x^{2}=\\frac{3}{5}';
                if (call === 2) {
                  return '\\Rightarrow x_{12}=\\sqrt{\\frac{3}{5}}';
                }
                throw new Error('unexpected no-geometry OCR call');
              },
            };
            window.__LIA_CANVAS_OCR__.canvasPlusOcr =
              window.__LIA_CANVAS_OCR__.ocr;
          });
          await plusPair.locator('.lia-color-btn:visible').click();
          await plusPair.locator('.lia-tool-menu [data-act=close]:visible').click();
          await plusCanvas.scrollIntoViewIfNeeded();
          const missingPmBox = await plusCanvas.boundingBox();
          assert.ok(missingPmBox, 'the no-geometry surface is unavailable');
          await drawMouseStroke(
            page,
            missingPmBox.x + missingPmBox.width * 0.24,
            missingPmBox.y + missingPmBox.height * 0.30,
            missingPmBox.x + missingPmBox.width * 0.68,
            missingPmBox.y + missingPmBox.height * 0.30,
          );
          await drawMouseStroke(
            page,
            missingPmBox.x + missingPmBox.width * 0.30,
            missingPmBox.y + missingPmBox.height * 0.72,
            missingPmBox.x + missingPmBox.width * 0.72,
            missingPmBox.y + missingPmBox.height * 0.72,
          );
          await plusSubmit.click();
          await page.waitForFunction(
            selector => {
              const result = document.querySelector(
                selector + ' .lia-canvasplus-output',
              ) as HTMLElement | null;
              return result?.dataset.analysisState === 'ready';
            },
            plusPairSelector,
            { timeout: 10_000 },
          );
          assert.equal(
            await output.getAttribute('data-latex'),
            '\\begin{aligned} x^{2}&=\\frac{3}{5} \\\\ ' +
              '\\Rightarrow x_{12}&=\\sqrt{\\frac{3}{5}} \\end{aligned}',
          );
          assert.equal(
            await page.evaluate(() => (window as any).__liaMissingPmRecognizeCalls),
            2,
          );
          assert.equal(
            await output.locator('.lia-canvasplus-transition').getAttribute('data-verdict'),
            'unknown',
          );
          assert.equal(
            await output.locator('.lia-canvasplus-transition').getAttribute('data-code'),
            'missing-plus-minus',
          );

          await plusPair.locator('.lia-eraser-btn:visible').click();
          const noGeometryClear = plusPair.locator(
            '.lia-tool-menu [data-act=clear]:visible',
          );
          await noGeometryClear.waitFor({ state: 'visible', timeout: 5_000 });
          await noGeometryClear.click();
          await page.waitForFunction(
            selector => Boolean((document.querySelector(
              selector + ' .lia-canvasplus-output',
            ) as HTMLElement | null)?.hidden),
            plusPairSelector,
            { timeout: 5_000 },
          );

          await page.evaluate(() => {
            (window as any).__liaCanvasPlusErrorEnsureLoadedCalls = 0;
            (window as any).__liaCanvasPlusErrorRecognizeCalls = 0;
            window.__LIA_CANVAS_OCR__.ocr = {
              model: 'calculation-error-model',
              precision: 'fp32',
              task: 'image-to-text',
              ensureLoaded: async () => {
                (window as any).__liaCanvasPlusErrorEnsureLoadedCalls++;
                throw new Error('synthetic model load failure');
              },
              recognize: async () => {
                (window as any).__liaCanvasPlusErrorRecognizeCalls++;
                throw new Error('recognize must not run after a load failure');
              },
            };
            window.__LIA_CANVAS_OCR__.canvasPlusOcr =
              window.__LIA_CANVAS_OCR__.ocr;
          });
          await plusPair.locator('.lia-color-btn:visible').click();
          await plusPair.locator('.lia-tool-menu [data-act=close]:visible').click();
          await plusCanvas.scrollIntoViewIfNeeded();
          const errorPlusBox = await plusCanvas.boundingBox();
          assert.ok(errorPlusBox, 'the calculation error-test surface is unavailable');
          await drawMouseStroke(
            page,
            errorPlusBox.x + errorPlusBox.width * 0.24,
            errorPlusBox.y + errorPlusBox.height * 0.68,
            errorPlusBox.x + errorPlusBox.width * 0.70,
            errorPlusBox.y + errorPlusBox.height * 0.76,
          );
          await page.waitForFunction(
            selector =>
              document.querySelector(selector)?.getAttribute('data-ocr-background') === 'manual',
            plusPairSelector,
            { timeout: 5_000 },
          );
          await hostDelay(2_100);
          assert.deepEqual(
            await page.evaluate(selector => ({
              background: document.querySelector(selector)?.getAttribute('data-ocr-background'),
              ensureLoadedCalls: (window as any).__liaCanvasPlusErrorEnsureLoadedCalls,
              recognizeCalls: (window as any).__liaCanvasPlusErrorRecognizeCalls,
            }), plusPairSelector),
            { background: 'manual', ensureLoadedCalls: 0, recognizeCalls: 0 },
            'a load failure must remain impossible until the learner explicitly submits',
          );
          await plusSubmit.click();
          await page.waitForFunction(
            selector =>
              document.querySelector(selector + ' .lia-canvasplus-output')
                ?.getAttribute('data-state') === 'error',
            plusPairSelector,
            { timeout: 10_000 },
          );
          assert.equal(await output.getAttribute('data-latex'), null);
          assert.equal(await plusSubmit.isDisabled(), false);
          assert.deepEqual(
            await page.evaluate(() => ({
              ensureLoadedCalls: (window as any).__liaCanvasPlusErrorEnsureLoadedCalls,
              recognizeCalls: (window as any).__liaCanvasPlusErrorRecognizeCalls,
            })),
            { ensureLoadedCalls: 1, recognizeCalls: 0 },
          );
          const visibleError = plusPair.locator(
            '.lia-canvasplus-standalone-status[role=alert]',
          );
          assert.equal(
            await visibleError.isVisible(),
            true,
            'calculation OCR errors must be visible without opening developer tools',
          );
          assert.match(
            (await visibleError.innerText()).trim(),
            /synthetic model load failure/i,
            'the visible error must include the actionable failure reason',
          );
          assert.match(await plusSubmit.innerText(), /try again/i);
          assert.equal(
            await plusPair.getAttribute('data-ocr-error'),
            'synthetic model load failure',
          );

          await page.evaluate(() => {
            window.__LIA_CANVAS_OCR__.canvasPlusOcr = {
              model: 'missing-recognize-method',
            };
          });
          await plusSubmit.click();
          await page.waitForFunction(
            selector => /OCR.*engine|OCR-Engine/i.test(
              String(
                (document.querySelector(selector) as HTMLElement | null)
                  ?.dataset.ocrError || '',
              ),
            ),
            plusPairSelector,
            { timeout: 10_000 },
          );
          const missingEngineError = String(
            await plusPair.getAttribute('data-ocr-error') || '',
          );
          assert.match(missingEngineError, /OCR.*engine|OCR-Engine/i);
          assert.doesNotMatch(missingEngineError, /synthetic model load failure/i);
          assert.match(
            (await visibleError.innerText()).trim(),
            /OCR.*engine|OCR-Engine/i,
          );

          await page.evaluate(() => {
            const retryOcr = {
              model: 'calculation-retry-model',
              precision: 'fp32',
              task: 'image-to-text',
              cacheKey: 'calculation-retry-v1',
              outputKind: 'latex',
              inputProfile: 'formulanet-line-384',
              calculationSinglePass: true,
              ensureLoaded: async () => true,
              recognize: async () => '3x^{2}-7=9',
            };
            window.__LIA_CANVAS_OCR__.ocr = retryOcr;
            window.__LIA_CANVAS_OCR__.canvasPlusOcr = retryOcr;
          });
          await plusSubmit.click();
          await page.waitForFunction(
            selector =>
              document.querySelector(selector + ' .lia-canvasplus-output')
                ?.getAttribute('data-state') === 'ready',
            plusPairSelector,
            { timeout: 10_000 },
          );
          assert.equal(await plusPair.getAttribute('data-ocr-error'), null);
          assert.match(await plusSubmit.innerText(), /submit to render/i);

          const removedListeners = await navigateToSecondPageAndCaptureCleanup(page);
          assert.ok(
            removedListeners.some(entry =>
              entry.target === 'document' && entry.type === 'visibilitychange'
            ),
            'canvasplus cleanup did not remove its visibility listener',
          );
          const plusDiagnostics = await snapshotDiagnostics(page);
          assertSyntheticDelivery(
            plusHarness,
            CALCULATION_QUIZ_COURSE_URL,
            undefined,
            true,
          );
          assert.deepEqual(plusHarness.modelRequests, []);
          assert.deepEqual(plusHarness.chunkRequests, []);
          assert.equal(plusDiagnostics.runawayStopped, false);
          assertNoRuntimeErrors(plusHarness, plusDiagnostics);
        } finally {
          await plusHarness.context.close();
        }

        const selectionHarness = await createHarness(browser);
        try {
          await openCourse(
            selectionHarness,
            CALCULATION_QUIZ_COURSE_URL,
            '.lia-canvas-pair[data-canvas-mode=plus] .lia-canvas-launch',
          );
          const page = selectionHarness.page;
          const pairSelector =
            '.lia-canvas-pair[data-canvas-mode=plus][data-canvas-output=answer]';
          const pair = page.locator(pairSelector);

          await page.evaluate(selector => {
            const pair = document.querySelector(selector);
            if (!pair) throw new Error('Calculation selection pair not found.');
            (window as any).katex = {
              render(tex: string, target: HTMLElement) {
                target.textContent = 'rendered: ' + tex;
                target.setAttribute('data-rendered-tex', tex);
              },
            };
            (window as any).__liaSelectionRecognizeCalls = 0;
            (window as any).__liaSelectionInputSizes = [];
            (window as any).__liaSelectionSignatures = [];
            (window as any).__liaSelectionRenderEvents = 0;
            pair.addEventListener('lia:canvasplus-render', () => {
              (window as any).__liaSelectionRenderEvents += 1;
            });
            window.__LIA_CANVAS_OCR__.ocr = {
              model: 'selection-scope-stub',
              precision: 'fp32',
              task: 'image-to-text',
              cacheKey: 'selection-scope-regression',
              outputKind: 'latex',
              inputProfile: 'formulanet-line-384',
              calculationSinglePass: true,
              ensureLoaded: async () => true,
              recognize: async (input: HTMLCanvasElement) => {
                (window as any).__liaSelectionInputSizes.push([
                  input.width,
                  input.height,
                ]);
                const context = input.getContext('2d', {
                  willReadFrequently: true,
                });
                if (!context) {
                  throw new Error('selection OCR input has no 2D context');
                }
                const pixels = context.getImageData(
                  0,
                  0,
                  input.width,
                  input.height,
                ).data;
                let weight = 0;
                let weightedX = 0;
                let weightedY = 0;
                let weightedXY = 0;
                for (let y = 0; y < input.height; y += 1) {
                  for (let x = 0; x < input.width; x += 1) {
                    const offset = ((y * input.width) + x) * 4;
                    const alpha = pixels[offset + 3] / 255;
                    const luminance = (
                      pixels[offset] + pixels[offset + 1] + pixels[offset + 2]
                    ) / 3;
                    const darkness = Math.max(0, 245 - luminance) * alpha;
                    if (darkness < 24) continue;
                    weight += darkness;
                    weightedX += x * darkness;
                    weightedY += y * darkness;
                    weightedXY += x * y * darkness;
                  }
                }
                if (weight <= 0) {
                  throw new Error('selection OCR input contains no dark ink');
                }
                const covariance = (weightedXY * weight) -
                  (weightedX * weightedY);
                const signature = covariance >= 0 ? 'down' : 'up';
                (window as any).__liaSelectionSignatures.push(signature);
                const call = ++(window as any).__liaSelectionRecognizeCalls;
                if (call <= 4) return signature === 'down' ? 'x=1' : 'y=2';
                throw new Error('unexpected uncached selection OCR call');
              },
            };
            window.__LIA_CANVAS_OCR__.canvasPlusOcr =
              window.__LIA_CANVAS_OCR__.ocr;
          }, pairSelector);

          await pair.locator('.lia-canvas-launch:visible').click();
          const canvas = pair.locator('canvas.lia-draw:visible');
          await canvas.waitFor({ state: 'visible', timeout: 10_000 });
          const getCanvasBox = async () => {
            await canvas.scrollIntoViewIfNeeded();
            const currentBox = await canvas.boundingBox();
            assert.ok(currentBox, 'the selection regression surface is unavailable');
            return currentBox;
          };
          let box = await getCanvasBox();

          const rectTool = pair.locator('.lia-rect-btn:visible');
          const submit = pair.locator('.lia-canvasplus-submit:visible');
          const output = pair.locator('.lia-canvasplus-output');
          const status = pair.locator('.lia-canvasplus-standalone-status');
          assert.equal(await rectTool.count(), 1);
          assert.equal(await pair.locator('.lia-rect-action:visible').count(), 0);
          assert.match(
            String(await rectTool.getAttribute('aria-label')),
            /render area|Darstellungsbereich/i,
          );

          await drawMouseStroke(
            page,
            box.x + box.width * 0.16,
            box.y + box.height * 0.20,
            box.x + box.width * 0.58,
            box.y + box.height * 0.34,
          );
          await drawMouseStroke(
            page,
            box.x + box.width * 0.36,
            box.y + box.height * 0.78,
            box.x + box.width * 0.83,
            box.y + box.height * 0.62,
          );

          const countSelectionRects = () => page.evaluate(selector => {
            const mount = document.querySelector(
              selector + ' .lia-canvas-mount',
            ) as HTMLElement | null;
            const uid = mount?.dataset.uid || '';
            const items = window.__LIA_CANVAS_OCR__?.store?.[uid]?.ITEMS || [];
            return items.filter((item: any) => item?.kind === 'rect').length;
          }, pairSelector);

          await rectTool.click();
          assert.equal(await rectTool.getAttribute('aria-pressed'), 'true');
          box = await getCanvasBox();
          await drawMouseStroke(
            page,
            box.x + box.width * 0.10,
            box.y + box.height * 0.10,
            box.x + box.width * 0.66,
            box.y + box.height * 0.44,
          );
          assert.equal(await countSelectionRects(), 1);
          await pair.locator('.lia-rect-close').waitFor({
            state: 'visible',
            timeout: 5_000,
          });
          assert.equal(await pair.locator('.lia-rect-close:visible').count(), 1);
          assert.equal(await pair.locator('.lia-rect-action:visible').count(), 0);
          assert.equal(
            await page.evaluate(() => (window as any).__liaSelectionRecognizeCalls),
            0,
            'committing a selection must not infer before submit',
          );

          await submit.click();
          await page.waitForFunction(
            selector => {
              const result = document.querySelector(
                selector + ' .lia-canvasplus-output',
              );
              return result?.getAttribute('data-state') === 'ready' &&
                result?.getAttribute('data-latex') === 'x=1';
            },
            pairSelector,
            { timeout: 10_000 },
          );
          assert.equal(await output.getAttribute('data-line-count'), '1');
          assert.equal(
            await page.evaluate(() => (window as any).__liaSelectionRecognizeCalls),
            1,
          );
          assert.deepEqual(
            await page.evaluate(() => (window as any).__liaSelectionSignatures),
            ['down'],
          );
          assert.equal(
            await page.evaluate(() => (window as any).__liaSelectionRenderEvents),
            1,
          );

          await submit.click();
          await page.waitForFunction(
            () => (window as any).__liaSelectionRenderEvents === 2,
            undefined,
            { timeout: 10_000 },
          );
          assert.equal(await output.getAttribute('data-latex'), 'x=1');
          assert.equal(
            await page.evaluate(() => (window as any).__liaSelectionRecognizeCalls),
            1,
            'an unchanged selected area must reuse the complete draft',
          );

          box = await getCanvasBox();
          await drawMouseStroke(
            page,
            box.x + box.width * 0.29,
            box.y + box.height * 0.54,
            box.x + box.width * 0.90,
            box.y + box.height * 0.88,
          );
          assert.equal(await countSelectionRects(), 1);
          assert.equal(await pair.locator('.lia-rect-action:visible').count(), 0);
          await page.waitForFunction(
            selector => document.querySelector(
              selector + ' .lia-canvasplus-output',
            )?.getAttribute('data-state') === 'stale',
            pairSelector,
            { timeout: 5_000 },
          );
          assert.equal(
            await page.evaluate(() => (window as any).__liaSelectionRecognizeCalls),
            1,
            'changing only the selection must not infer before submit',
          );

          await submit.click();
          await page.waitForFunction(
            selector => {
              const result = document.querySelector(
                selector + ' .lia-canvasplus-output',
              );
              return result?.getAttribute('data-state') === 'ready' &&
                result?.getAttribute('data-latex') === 'y=2';
            },
            pairSelector,
            { timeout: 10_000 },
          );
          assert.equal(await output.getAttribute('data-line-count'), '1');
          assert.equal(
            await page.evaluate(() => (window as any).__liaSelectionRecognizeCalls),
            2,
          );
          assert.deepEqual(
            await page.evaluate(() => (window as any).__liaSelectionSignatures),
            ['down', 'up'],
          );
          assert.equal(
            await page.evaluate(() => (window as any).__liaSelectionRenderEvents),
            3,
          );

          await pair.locator('.lia-rect-close:visible').click();
          assert.equal(await countSelectionRects(), 0);
          await page.waitForFunction(
            selector => document.querySelector(
              selector + ' .lia-canvasplus-output',
            )?.getAttribute('data-state') === 'stale',
            pairSelector,
            { timeout: 5_000 },
          );
          assert.equal(await submit.isDisabled(), false);
          await submit.click();
          await page.waitForFunction(
            selector => {
              const result = document.querySelector(
                selector + ' .lia-canvasplus-output',
              );
              return result instanceof HTMLDetailsElement &&
                !result.hidden &&
                result.dataset.state === 'ready' &&
                result.dataset.analysisState === 'ready' &&
                result.dataset.lineCount === '2';
            },
            pairSelector,
            { timeout: 10_000 },
          );
          assert.equal(
            await output.getAttribute('data-latex'),
            String.raw`\begin{aligned} x&=1 \\ y&=2 \end{aligned}`,
          );
          const fullBlockLatex = await output.getAttribute('data-latex');
          assert.equal(
            await page.evaluate(() => (window as any).__liaSelectionRecognizeCalls),
            4,
            'the first full-block render may use scope-specific line fingerprints',
          );
          assert.deepEqual(
            await page.evaluate(() => (window as any).__liaSelectionSignatures),
            ['down', 'up', 'down', 'up'],
          );
          assert.equal(
            await page.evaluate(() => (window as any).__liaSelectionRenderEvents),
            4,
          );

          await rectTool.click();
          box = await getCanvasBox();
          await drawMouseStroke(
            page,
            box.x + box.width * 0.70,
            box.y + box.height * 0.46,
            box.x + box.width * 0.70 + 2,
            box.y + box.height * 0.46 + 2,
          );
          assert.equal(
            await countSelectionRects(),
            0,
            'pointer jitter must not commit a tiny render selection',
          );
          assert.equal(await output.getAttribute('data-state'), 'ready');

          // A valid but empty selection is intentionally empty. It must never
          // fall back to recognizing the full drawing behind the learner's back.
          await rectTool.click();
          box = await getCanvasBox();
          await drawMouseStroke(
            page,
            box.x + box.width * 0.78,
            box.y + box.height * 0.10,
            box.x + box.width * 0.95,
            box.y + box.height * 0.38,
          );
          assert.equal(await countSelectionRects(), 1);
          await submit.click();
          await page.waitForFunction(
            selector => {
              const pair = document.querySelector(selector);
              const result = pair?.querySelector('.lia-canvasplus-output');
              const status = pair?.querySelector('.lia-canvasplus-standalone-status');
              return result instanceof HTMLElement && result.hidden &&
                status?.getAttribute('data-state') === 'empty';
            },
            pairSelector,
            { timeout: 10_000 },
          );
          assert.equal(
            await page.evaluate(() => (window as any).__liaSelectionRecognizeCalls),
            4,
          );
          assert.match((await status.innerText()).trim(), /selected area|Bereich/i);
          assert.equal(await submit.isDisabled(), true);

          await pair.locator('.lia-rect-close:visible').click();
          assert.equal(await countSelectionRects(), 0);
          assert.equal(await submit.isDisabled(), false);
          await submit.click();
          await page.waitForFunction(
            selector => {
              const result = document.querySelector(
                selector + ' .lia-canvasplus-output',
              );
              return result instanceof HTMLDetailsElement &&
                !result.hidden &&
                result.dataset.state === 'ready' &&
                result.dataset.analysisState === 'ready' &&
                result.dataset.lineCount === '2';
            },
            pairSelector,
            { timeout: 10_000 },
          );
          assert.equal(
            await page.evaluate(() => (window as any).__liaSelectionRecognizeCalls),
            4,
          );
          assert.equal(await output.getAttribute('data-latex'), fullBlockLatex);
          assert.deepEqual(
            await page.evaluate(() => (window as any).__liaSelectionSignatures),
            ['down', 'up', 'down', 'up'],
          );
          assert.equal(
            await page.evaluate(() => (window as any).__liaSelectionRenderEvents),
            5,
          );

          const diagnostics = await snapshotDiagnostics(page);
          assertSyntheticDelivery(
            selectionHarness,
            CALCULATION_QUIZ_COURSE_URL,
            undefined,
            true,
          );
          assert.deepEqual(selectionHarness.modelRequests, []);
          assert.deepEqual(selectionHarness.chunkRequests, []);
          assertNoRuntimeErrors(selectionHarness, diagnostics);

        } finally {
          await selectionHarness.context.close();
        }


        const mixedHarness = await createHarness(browser);
        try {
          const classicPairSelector = '.lia-canvas-pair:not([data-canvas-mode])';
          const plusPairSelector =
            '.lia-canvas-pair[data-canvas-mode=plus][data-canvas-output=answer]';
          await openCourse(
            mixedHarness,
            CANVAS_MIXED_COURSE_URL,
            classicPairSelector + ' .lia-canvas-launch',
          );
          const page = mixedHarness.page;
          const classicPair = page.locator(classicPairSelector);
          const plusPair = page.locator(plusPairSelector);
          assert.equal(await classicPair.count(), 1);
          assert.equal(await plusPair.count(), 1);

          await page.evaluate(() => {
            (window as any).__liaMixedRecognizeCalls = 0;
            (window as any).__liaMixedClassicPhase = false;
            (window as any).__liaMixedPendingBackground = [];
            (window as any).__liaMixedAnalysisEvents = [];
            document.querySelector(
              '.lia-canvas-pair[data-canvas-mode=plus]',
            )?.addEventListener('lia:canvasplus-analysis', event => {
              (window as any).__liaMixedAnalysisEvents.push(
                (event as CustomEvent).detail,
              );
            });
            (window as any).katex = {
              render(tex: string, target: HTMLElement) {
                target.textContent = 'rendered: ' + tex;
                target.setAttribute('data-rendered-tex', tex);
              },
            };
            window.__LIA_CANVAS_OCR__.ocr = {
              model: 'mixed-stub-model',
              precision: 'fp32',
              task: 'image-to-text',
              ensureLoaded: async () => true,
              recognize: async () => {
                (window as any).__liaMixedRecognizeCalls += 1;
                if ((window as any).__liaMixedClassicPhase) return '42';
                return new Promise<string>(resolve => {
                  (window as any).__liaMixedPendingBackground.push(resolve);
                });
              },
            };
            window.__LIA_CANVAS_OCR__.canvasPlusOcr =
              window.__LIA_CANVAS_OCR__.ocr;
          });

          await plusPair.locator('.lia-canvas-launch:visible').click();
          const plusCanvas = plusPair.locator('canvas.lia-draw:visible');
          await plusCanvas.waitFor({ state: 'visible', timeout: 10_000 });
          const plusBox = await plusCanvas.boundingBox();
          assert.ok(plusBox);
          await drawMouseStroke(
            page,
            plusBox.x + plusBox.width * 0.25,
            plusBox.y + plusBox.height * 0.35,
            plusBox.x + plusBox.width * 0.75,
            plusBox.y + plusBox.height * 0.35,
          );
          await page.waitForFunction(
            selector =>
              document.querySelector(selector)?.getAttribute('data-ocr-background') === 'manual',
            plusPairSelector,
            { timeout: 5_000 },
          );
          await hostDelay(2_100);
          assert.equal(
            await page.evaluate(() => (window as any).__liaMixedRecognizeCalls),
            0,
            'calculation writing must not start OCR before submit',
          );

          await classicPair.locator('.lia-canvas-launch:visible').click();
          const classicCanvas = classicPair.locator('canvas.lia-draw:visible');
          await classicCanvas.waitFor({ state: 'visible', timeout: 10_000 });
          const classicBox = await classicCanvas.boundingBox();
          assert.ok(classicBox);
          await drawMouseStroke(
            page,
            classicBox.x + classicBox.width * 0.42,
            classicBox.y + classicBox.height * 0.35,
            classicBox.x + classicBox.width * 0.57,
            classicBox.y + classicBox.height * 0.56,
          );
          await classicPair.locator('.lia-rect-btn:visible').click();
          await drawMouseStroke(
            page,
            classicBox.x + classicBox.width * 0.30,
            classicBox.y + classicBox.height * 0.22,
            classicBox.x + classicBox.width * 0.70,
            classicBox.y + classicBox.height * 0.68,
          );
          await page.evaluate(() => {
            (window as any).__liaMixedClassicPhase = true;
          });
          await classicPair.locator('.lia-rect-action:visible').click();
          await withHostTimeout(
            page.waitForFunction(
              selector => {
                const pair = document.querySelector(selector);
                if (!pair) return false;
                const fields = Array.from(
                  document.querySelectorAll('input, textarea, [contenteditable=true]'),
                );
                let answer: Element | null = null;
                for (const field of fields) {
                  if (field.compareDocumentPosition(pair) & Node.DOCUMENT_POSITION_FOLLOWING) {
                    answer = field;
                  }
                }
                const value = answer && 'value' in answer
                  ? (answer as HTMLInputElement).value
                  : answer?.textContent;
                return String(value || '') === '42';
              },
              classicPairSelector,
              { timeout: 4_000 },
            ),
            'classic OCR after calculation writing',
            5_000,
          );
          assert.equal(
            await plusPair.getAttribute('data-ocr-background'),
            'manual',
            'the calculation block must stay inference-free until its own submit',
          );
          assert.equal(await page.locator('.lia-canvasplus-dialog').count(), 0);

          await page.evaluate(() => {
            (window as any).__liaMixedClassicPhase = false;
          });
          await plusPair.locator('.lia-canvasplus-submit:visible').click();
          await page.waitForFunction(
            () => (window as any).__liaMixedPendingBackground.length >= 1,
            undefined,
            { timeout: 10_000 },
          );
          await page.evaluate(() => {
            const pending = (window as any).__liaMixedPendingBackground.splice(0);
            for (const resolve of pending) resolve('x=1');
          });
          await page.waitForFunction(
            selector =>
              document
                .querySelector(selector + ' .lia-canvasplus-rendered')
                ?.getAttribute('data-rendered-tex') === 'x=1',
            plusPairSelector,
            { timeout: 10_000 },
          );
          assert.equal(
            await plusPair.locator('.lia-canvasplus-output').getAttribute('data-latex'),
            'x=1',
          );
          await page.waitForFunction(
            () => (window as any).__liaMixedAnalysisEvents.length === 1,
            undefined,
            { timeout: 5_000 },
          );
          assert.deepEqual(
            await page.evaluate(() => {
              const event = (window as any).__liaMixedAnalysisEvents[0];
              return { state: event?.state, checks: event?.checks };
            }),
            { state: 'ready', checks: [] },
            'a single equation must publish a completed analysis with no transitions',
          );
          assert.equal(
            await answerValueBeforePair(page, classicPairSelector),
            '42',
            '@BerechneOCR must never overwrite the preceding classic quiz',
          );
          const mixedDiagnostics = await snapshotDiagnostics(page);
          assertSyntheticDelivery(
            mixedHarness,
            CANVAS_MIXED_COURSE_URL,
            undefined,
            true,
          );
          assert.deepEqual(mixedHarness.modelRequests, []);
          assert.deepEqual(
            mixedHarness.chunkRequests,
            [],
            'a single calculation equation has no transition and must not load the CAS chunk',
          );
          assertNoRuntimeErrors(mixedHarness, mixedDiagnostics);
        } finally {
          await mixedHarness.context.close();
        }

        const calculationQuizHarness = await createHarness(browser);
        try {
          const pairSelector =
            '.lia-canvas-pair[data-canvas-mode=plus][data-canvas-output=answer]';
          await openCourse(
            calculationQuizHarness,
            CALCULATION_QUIZ_COURSE_URL,
            pairSelector + ' .lia-canvas-launch',
          );
          const page = calculationQuizHarness.page;
          const defaultPair = page.locator(pairSelector);
          assert.equal(
            new URL(page.url()).hash,
            '#1',
            'the parameterless calculation quiz must be tested on the first page',
          );
          assert.deepEqual(
            await defaultPair.evaluate(node => ({
              optionState: (node as HTMLElement).dataset.calculationOptionsState,
              lineFeedback: (node as HTMLElement).dataset.lineFeedback,
            })),
            {
              optionState: 'valid',
              lineFeedback: '1',
            },
            'a parameterless @BerechneOCR call must enable transition feedback by default',
          );
          await page.waitForFunction(
            () => typeof (window as any).Algebrite?.run === 'function',
            undefined,
            { timeout: 10_000 },
          );
          await page.evaluate(() => {
            (window as any).katex = {
              render(tex: string, target: HTMLElement) {
                target.textContent = 'rendered: ' + tex;
                target.setAttribute('data-rendered-tex', tex);
              },
            };
            (window as any).__liaDefaultCalculationResponses = [
              '3x^{2}-7=9 \\mid +7',
              '3x^{2}=16',
            ];
            (window as any).__liaDefaultCalculationRecognizeCalls = 0;
            const ocr = {
              model: 'default-calculation-quiz-stub-model',
              precision: 'fp32',
              task: 'image-to-text',
              ensureLoaded: async () => true,
              recognize: async () => {
                (window as any).__liaDefaultCalculationRecognizeCalls += 1;
                const response = (window as any).__liaDefaultCalculationResponses.shift();
                if (typeof response !== 'string') {
                  throw new Error('unexpected default calculation quiz OCR call');
                }
                return response;
              },
            };
            window.__LIA_CANVAS_OCR__.ocr = ocr;
            window.__LIA_CANVAS_OCR__.canvasPlusOcr = ocr;
          });

          await defaultPair.locator('.lia-canvas-launch:visible').click();
          const defaultCanvas = defaultPair.locator('canvas.lia-draw:visible');
          await defaultCanvas.waitFor({ state: 'visible', timeout: 10_000 });
          const defaultBox = await defaultCanvas.boundingBox();
          assert.ok(defaultBox, 'the default calculation quiz canvas has no bounding box');
          await drawMouseStroke(
            page,
            defaultBox.x + defaultBox.width * 0.20,
            defaultBox.y + defaultBox.height * 0.30,
            defaultBox.x + defaultBox.width * 0.60,
            defaultBox.y + defaultBox.height * 0.30,
          );
          await drawMouseStroke(
            page,
            defaultBox.x + defaultBox.width * 0.24,
            defaultBox.y + defaultBox.height * 0.68,
            defaultBox.x + defaultBox.width * 0.58,
            defaultBox.y + defaultBox.height * 0.68,
          );
          await defaultPair.locator('.lia-canvasplus-submit:visible').click();
          await page.waitForFunction(
            selector => {
              const output = document.querySelector(
                selector + ' .lia-canvasplus-output',
              ) as HTMLElement | null;
              return output?.dataset.state === 'ready' &&
                output.dataset.analysisState === 'ready' &&
                output.dataset.lineCount === '2';
            },
            pairSelector,
            { timeout: 10_000 },
          );

          const defaultOutput = defaultPair.locator('.lia-canvasplus-output');
          if (!await defaultOutput.evaluate(node => (node as HTMLDetailsElement).open)) {
            await defaultOutput.locator(
              ':scope > summary.lia-canvasplus-result-toggle',
            ).click();
          }
          assert.equal(
            await defaultOutput.locator('.lia-canvasplus-line:visible').count(),
            2,
            'default calculation quizzes must still render all recognized equations',
          );
          assert.equal(
            await defaultOutput.locator('.lia-canvasplus-transition').count(),
            1,
            'parameterless @BerechneOCR must render the validated row transition',
          );
          assert.equal(
            await defaultOutput.locator('.lia-canvasplus-transition:visible').count(),
            1,
            'parameterless @BerechneOCR must show row-transition feedback',
          );
          assert.equal(
            await defaultOutput.locator('.lia-canvasplus-analysis-summary:visible').count(),
            1,
            'parameterless @BerechneOCR must show the transition summary',
          );
          assert.equal(
            await page.evaluate(() => (window as any).__liaDefaultCalculationRecognizeCalls),
            2,
          );
          const defaultFreezeState = await page.evaluate(selector => {
            const pair = document.querySelector(selector);
            const state = pair
              ? window.__LIA_CANVAS_OCR__?.freeze?.exportCanvasFreezeStateFromPair?.(pair)
              : null;
            return state && {
              version: String(state.v || ''),
              reviewVersion: String(state.cr?.v || ''),
              reviewState: String(state.cr?.state || ''),
              reviewLines: Array.isArray(state.cr?.lines) ? state.cr.lines : [],
              reviewCheckStatuses: Array.isArray(state.cr?.checks)
                ? state.cr.checks.map((check: any) => check?.status)
                : [],
            };
          }, pairSelector);
          assert.deepEqual(
            defaultFreezeState,
            {
              version: 'cvf1',
              reviewVersion: 'cr1',
              reviewState: 'ready',
              reviewLines: [
                '3x^{2}-7=9 \\mid +7',
                '3x^{2}=16',
              ],
              reviewCheckStatuses: ['valid'],
            },
            'the parameterless default must retain visible transition feedback in Freeze',
          );
          assert.equal(
            await page.evaluate(selector => {
              const pair = document.querySelector(selector);
              if (!pair) throw new Error('Default calculation quiz pair not found.');
              const freeze = window.__LIA_CANVAS_OCR__?.freeze;
              const state = freeze?.exportCanvasFreezeStateFromPair?.(pair);
              document.body.classList.add(
                'lia-course-frozen',
                'lia-snapshot-mode',
                'lia-shared-freeze-link',
              );
              return Boolean(state && freeze?.renderCanvasFreezeStateIntoPair?.(pair, state));
            }, pairSelector),
            true,
            'the parameterless Freeze state must restore into its calculation pair',
          );
          const defaultRestoredReview = defaultPair.locator(
            '.lia-canvas-freeze-calculation-review[data-freeze-static]',
          );
          await defaultRestoredReview.waitFor({ state: 'visible', timeout: 10_000 });
          assert.equal(
            await defaultRestoredReview.locator(
              '.lia-canvasplus-transition[data-verdict=correct]:visible',
            ).count(),
            1,
            'a parameterless Freeze restore must keep its row feedback visible',
          );
          assert.equal(
            await defaultRestoredReview.locator(
              '.lia-canvasplus-analysis-summary:visible',
            ).count(),
            1,
            'a parameterless Freeze restore must keep its transition summary visible',
          );
          await page.evaluate(() => {
            document.body.classList.remove(
              'lia-course-frozen',
              'lia-snapshot-mode',
              'lia-shared-freeze-link',
            );
          });

          await page.evaluate(() => {
            if (document.activeElement instanceof HTMLElement) {
              document.activeElement.blur();
            }
          });
          await page.keyboard.press('ArrowRight');
          await page.waitForFunction(
            selector => location.hash === '#2' &&
              document.querySelectorAll(selector).length === 1,
            pairSelector,
            { timeout: 10_000 },
          );

          const pair = page.locator(pairSelector);
          assert.equal(await pair.count(), 1);
          assert.equal(await pair.getAttribute('data-canvas-output'), 'answer');
          assert.equal(await pair.getAttribute('data-answer-format'), 'native-equation-v1');
          assert.deepEqual(
            await pair.evaluate(node => ({
              options: (node as HTMLElement).dataset.calculationOptions,
              optionState: (node as HTMLElement).dataset.calculationOptionsState,
              lineFeedback: (node as HTMLElement).dataset.lineFeedback,
            })),
            {
              options: '1',
              optionState: 'valid',
              lineFeedback: '1',
            },
            'the second calculation pair must expose the positional feedback opt-in',
          );
          await page.waitForFunction(
            () => typeof (window as any).Algebrite?.run === 'function',
            undefined,
            { timeout: 10_000 },
          );

          await page.evaluate(selector => {
            const pair = document.querySelector(selector);
            if (!pair) throw new Error('Calculation quiz pair not found.');
            (window as any).katex = {
              render(tex: string, target: HTMLElement) {
                target.textContent = 'rendered: ' + tex;
                target.setAttribute('data-rendered-tex', tex);
              },
            };
            (window as any).__liaCalculationQuizResponses = [
              '3x-5=7 \\mid +5',
              '3x=12 \\mid :3',
              'x=3',
            ];
            (window as any).__liaCalculationQuizRecognizeCalls = 0;
            (window as any).__liaCalculationQuizAnswerEvents = [];
            pair.addEventListener('lia:canvasplus-answer', event => {
              (window as any).__liaCalculationQuizAnswerEvents.push(
                (event as CustomEvent).detail,
              );
            });
            window.__LIA_CANVAS_OCR__.ocr = {
              model: 'calculation-quiz-stub-model',
              precision: 'fp32',
              task: 'image-to-text',
              ensureLoaded: async () => true,
              recognize: async () => {
                (window as any).__liaCalculationQuizRecognizeCalls += 1;
                const response = (window as any).__liaCalculationQuizResponses.shift();
                if (typeof response !== 'string') {
                  throw new Error('unexpected calculation quiz OCR call');
                }
                return response;
              },
            };
            window.__LIA_CANVAS_OCR__.canvasPlusOcr =
              window.__LIA_CANVAS_OCR__.ocr;
          }, pairSelector);

          await pair.locator('.lia-canvas-launch:visible').click();
          const canvas = pair.locator('canvas.lia-draw:visible');
          await canvas.waitFor({ state: 'visible', timeout: 10_000 });
          const box = await canvas.boundingBox();
          assert.ok(box, 'the calculation quiz canvas has no bounding box');
          await drawMouseStroke(
            page,
            box.x + box.width * 0.20,
            box.y + box.height * 0.24,
            box.x + box.width * 0.60,
            box.y + box.height * 0.24,
          );
          await drawMouseStroke(
            page,
            box.x + box.width * 0.24,
            box.y + box.height * 0.50,
            box.x + box.width * 0.58,
            box.y + box.height * 0.50,
          );
          await drawMouseStroke(
            page,
            box.x + box.width * 0.30,
            box.y + box.height * 0.76,
            box.x + box.width * 0.50,
            box.y + box.height * 0.76,
          );

          const submit = pair.locator('.lia-canvasplus-submit:visible');
          await submit.waitFor({ state: 'visible', timeout: 5_000 });
          assert.equal(await submit.isDisabled(), false);
          await submit.click();
          await page.waitForFunction(
            selector => {
              const output = document.querySelector(
                selector + ' .lia-canvasplus-output',
              ) as HTMLElement | null;
              return output?.dataset.state === 'ready' &&
                output.dataset.analysisState === 'ready' &&
                output.dataset.lineCount === '3';
            },
            pairSelector,
            { timeout: 10_000 },
          );

          const output = pair.locator('.lia-canvasplus-output');
          if (!await output.evaluate(node => (node as HTMLDetailsElement).open)) {
            await output.locator(
              ':scope > summary.lia-canvasplus-result-toggle',
            ).click();
          }
          assert.equal(
            await output.locator('.lia-canvasplus-transition:visible').count(),
            2,
            'the opted-in calculation quiz must show both row transitions',
          );
          assert.equal(
            await output.locator(
              '.lia-canvasplus-transition[data-verdict=correct]:visible',
            ).count(),
            1,
          );
          assert.equal(
            await output.locator(
              '.lia-canvasplus-transition[data-verdict=incorrect]:visible',
            ).count(),
            1,
          );
          const optedInSummary = output.locator(
            '.lia-canvasplus-analysis-summary:visible',
          );
          assert.equal(await optedInSummary.count(), 1);
          assert.equal(
            (await optedInSummary.textContent())?.trim(),
            '2 transitions: 1 correct, 1 incorrect, 0 not checked.',
          );

          const invalidAnswer = await answerValueBeforePair(page, pairSelector);
          assert.deepEqual(JSON.parse(invalidAnswer), [
            '3x-5=7 \\mid +5',
            '3x=12 \\mid :3',
            'x=3',
          ]);
          assert.equal(
            await page.evaluate(() => (window as any).__liaCalculationQuizRecognizeCalls),
            3,
          );

          const nativeCheck = await markNativeQuizCheckBeforePair(page, pairSelector);
          assert.ok(nativeCheck.candidateCount >= 1);
          await page.locator('[data-lia-calculation-quiz-check]').click();
          await waitForNativeQuizResultBeforePair(page, pairSelector, 'failure');
          assert.equal(
            await answerValueBeforePair(page, pairSelector),
            invalidAnswer,
            'the native LiaScript check must keep the submitted calculation path',
          );

          await canvas.scrollIntoViewIfNeeded();
          const staleBox = await canvas.boundingBox();
          assert.ok(staleBox, 'the calculation quiz canvas disappeared after checking');
          await drawMouseStroke(
            page,
            staleBox.x + staleBox.width * 0.35,
            staleBox.y + staleBox.height * 0.88,
            staleBox.x + staleBox.width * 0.48,
            staleBox.y + staleBox.height * 0.88,
          );
          await page.waitForFunction(
            selector => {
              const output = document.querySelector(
                selector + ' .lia-canvasplus-output',
              ) as HTMLElement | null;
              return output?.dataset.stale === '1';
            },
            pairSelector,
            { timeout: 5_000 },
          );
          const staleAnswer = await answerValueBeforePair(page, pairSelector);
          assert.equal(
            staleAnswer,
            invalidAnswer,
            'editing the drawing must preserve the last submitted native quiz value',
          );
          await waitForNativeQuizResultBeforePair(page, pairSelector, 'failure');
          assert.equal(
            await page.evaluate(() => (window as any).__liaCalculationQuizRecognizeCalls),
            3,
            'editing the drawing must only mark the render stale without background OCR',
          );

          const undo = pair.locator('.lia-undo-btn:visible');
          await undo.click();
          await submit.click();
          await page.waitForFunction(
            selector => {
              const output = document.querySelector(
                selector + ' .lia-canvasplus-output',
              ) as HTMLElement | null;
              return output?.dataset.state === 'ready' &&
                output.dataset.analysisState === 'ready' &&
                output.dataset.resultSource === 'ocr' &&
                output.dataset.lineCount === '3';
            },
            pairSelector,
            { timeout: 10_000 },
          );
          const restoredInvalidAnswer = await answerValueBeforePair(page, pairSelector);
          assert.equal(restoredInvalidAnswer, invalidAnswer);
          assert.equal(
            await page.evaluate(() => (window as any).__liaCalculationQuizRecognizeCalls),
            3,
            'undo plus submit must reuse all three cached OCR lines',
          );

          const outputToggle = output.locator(
            ':scope > summary.lia-canvasplus-result-toggle',
          );
          if (!await output.evaluate(node => (node as HTMLDetailsElement).open)) {
            await outputToggle.click();
          }
          const editButton = output.locator('.lia-canvasplus-edit:visible');
          await editButton.click();
          const inlineEditor = output.locator('.lia-canvasplus-inline-editor');
          const editTextarea = inlineEditor.locator('.lia-canvasplus-inline-textarea');
          const correctedRows =
            '3 x - 5 = 7 \\mid +5\n3x=12 \\mid :3\nx=4';
          await editTextarea.fill(correctedRows);
          await inlineEditor.locator('.lia-canvasplus-accept').click();
          await page.waitForFunction(
            selector => {
              const result = document.querySelector(
                selector + ' .lia-canvasplus-output',
              ) as HTMLElement | null;
              return result?.dataset.resultSource === 'correction' &&
                result.dataset.analysisState === 'ready' &&
                result.querySelectorAll(
                  '.lia-canvasplus-transition[data-verdict=correct]',
                ).length === 2;
            },
            pairSelector,
            { timeout: 10_000 },
          );

          const correctedPath = JSON.stringify([
            '3 x - 5 = 7 \\mid +5',
            '3x=12 \\mid :3',
            'x=4',
          ]);
          const correctedAnswer = await answerValueBeforePair(page, pairSelector);
          assert.equal(
            correctedAnswer,
            correctedPath,
            'an accepted path must remain complete in the native LiaScript field',
          );
          assert.equal(
            await page.evaluate(() => (window as any).__liaCalculationQuizRecognizeCalls),
            3,
            'manual correction must update the quiz without another OCR pass',
          );
          assert.deepEqual(
            await page.evaluate(() =>
              (window as any).__liaCalculationQuizAnswerEvents.map((event: any) => ({
                applied: event?.applied,
                source: event?.source,
                value: event?.value,
                submissionValue: event?.submissionValue,
                pathAccepted: event?.pathAccepted,
              }))),
            [
              {
                applied: true,
                source: 'ocr',
                value: invalidAnswer,
                submissionValue: invalidAnswer,
                pathAccepted: false,
              },
              {
                applied: true,
                source: 'ocr',
                value: invalidAnswer,
                submissionValue: invalidAnswer,
                pathAccepted: false,
              },
              {
                applied: true,
                source: 'correction',
                value: correctedPath,
                submissionValue: correctedPath,
                pathAccepted: true,
              },
            ],
          );

          await markNativeQuizCheckBeforePair(page, pairSelector);
          const correctedNativeCheck = page.locator(
            '[data-lia-calculation-quiz-check]',
          );
          assert.equal(await correctedNativeCheck.isEnabled(), true);
          await correctedNativeCheck.click();
          await waitForNativeQuizResultBeforePair(page, pairSelector, 'success');
          assert.equal(
            await answerValueBeforePair(page, pairSelector),
            correctedPath,
            'the native LiaScript success state must retain the complete calculation',
          );
          assert.equal(
            await page.locator('.lia-tex-preview').getAttribute('data-multiline'),
            '1',
            'the accepted native answer must keep its multiline calculation preview',
          );

          const answerBeforeLocaleRoundTrip =
            await answerValueBeforePair(page, pairSelector);
          const ocrCallsBeforeLocaleRoundTrip = await page.evaluate(
            () => (window as any).__liaCalculationQuizRecognizeCalls,
          );
          await assertInteractiveCalculationLocale(
            page,
            pairSelector,
            CALCULATION_LOCALE_TEXT.en,
          );
          await setCanvasLocale(page, 'de');
          await assertInteractiveCalculationLocale(
            page,
            pairSelector,
            CALCULATION_LOCALE_TEXT.de,
          );
          assert.equal(
            await answerValueBeforePair(page, pairSelector),
            answerBeforeLocaleRoundTrip,
            'switching the live calculation UI to German must preserve the native answer',
          );
          assert.equal(
            await page.evaluate(() => (window as any).__liaCalculationQuizRecognizeCalls),
            ocrCallsBeforeLocaleRoundTrip,
            'switching the live calculation UI to German must not run OCR',
          );
          await setCanvasLocale(page, 'en');
          await assertInteractiveCalculationLocale(
            page,
            pairSelector,
            CALCULATION_LOCALE_TEXT.en,
          );
          assert.equal(
            await answerValueBeforePair(page, pairSelector),
            answerBeforeLocaleRoundTrip,
            'switching the live calculation UI back to English must preserve the native answer',
          );
          assert.equal(
            await page.evaluate(() => (window as any).__liaCalculationQuizRecognizeCalls),
            ocrCallsBeforeLocaleRoundTrip,
            'the live EN-DE-EN locale roundtrip must not run OCR',
          );

          const calculationFreezeState = await page.evaluate(selector => {
            const pair = document.querySelector(selector);
            return pair
              ? window.__LIA_CANVAS_OCR__?.freeze?.exportCanvasFreezeStateFromPair?.(pair)
              : null;
          }, pairSelector);
          assert.equal(calculationFreezeState?.v, 'cvf1');
          assert.ok(calculationFreezeState?.u, 'the opted-in Freeze state has no UID');
          assert.equal(calculationFreezeState?.cr?.v, 'cr1');
          assert.equal(calculationFreezeState?.cr?.state, 'ready');
          assert.deepEqual(calculationFreezeState?.cr?.lines, [
            '3 x - 5 = 7 \\mid +5',
            '3x=12 \\mid :3',
            'x=4',
          ]);
          assert.deepEqual(
            calculationFreezeState?.cr?.checks?.map((check: any) => check.status),
            ['valid', 'valid'],
            'Freeze must retain the completed transition verdicts',
          );
          const freezeCompatibility = await page.evaluate(
            ({ selector, state }) => {
              const pair = document.querySelector(selector);
              const canvas = pair?.querySelector('canvas.lia-draw') as
                HTMLCanvasElement | null;
              const getStoreEntry =
                window.__LIA_CANVAS_OCR__?.freeze?.getCanvasStoreEntry;
              return {
                publicStoreEntryHidden: typeof getStoreEntry === 'function' &&
                  getStoreEntry(String(state?.u || '')) === null,
                stateWidth: Number(state?.w || 0),
                stateHeight: Number(state?.h || 0),
                canvasWidth: Math.round(canvas?.clientWidth || 0),
                canvasHeight: Math.round(canvas?.clientHeight || 0),
              };
            },
            { selector: pairSelector, state: calculationFreezeState },
          );
          assert.equal(
            freezeCompatibility.publicStoreEntryHidden,
            true,
            'lia-freeze-v2 must retain the exported raw cvf1/cr1 state instead of rebuilding it',
          );
          assert.equal(
            freezeCompatibility.stateWidth,
            freezeCompatibility.canvasWidth,
            'review-bearing Freeze state must use the full canvas viewport width',
          );
          assert.equal(
            freezeCompatibility.stateHeight,
            freezeCompatibility.canvasHeight,
            'review-bearing Freeze state must use the full canvas viewport height',
          );

          await page.reload({
            waitUntil: 'domcontentloaded',
            timeout: 120_000,
          });
          await page.waitForFunction(
            selector => {
              const pair = document.querySelector(selector) as HTMLElement | null;
              return location.hash === '#2' &&
                pair?.dataset.lineFeedback === '1' &&
                typeof window.__LIA_CANVAS_OCR__?.freeze
                  ?.renderCanvasFreezeStateIntoPair === 'function';
            },
            pairSelector,
            { timeout: 30_000 },
          );
          await page.evaluate(
            ({ selector, state }) => {
              const pair = document.querySelector(selector);
              if (!pair) throw new Error('Opted-in calculation pair missing after reload.');
              document.body.classList.add(
                'lia-course-frozen',
                'lia-snapshot-mode',
                'lia-shared-freeze-link',
              );
              (window as any).katex = {
                render(tex: string, target: HTMLElement) {
                  target.textContent = 'rendered: ' + tex;
                  target.setAttribute('data-rendered-tex', tex);
                },
              };
              (window as any).__liaFreezeRestoreOcrCalls = 0;
              const ocr = {
                model: 'freeze-restore-must-not-run-ocr',
                precision: 'fp32',
                task: 'image-to-text',
                ensureLoaded: async () => true,
                recognize: async () => {
                  (window as any).__liaFreezeRestoreOcrCalls += 1;
                  throw new Error('Freeze restore must not invoke OCR.');
                },
              };
              window.__LIA_CANVAS_OCR__.ocr = ocr;
              window.__LIA_CANVAS_OCR__.canvasPlusOcr = ocr;
              const render =
                window.__LIA_CANVAS_OCR__.freeze?.renderCanvasFreezeStateIntoPair;
              if (typeof render !== 'function' || !render(pair, state)) {
                throw new Error('Freeze calculation review could not be restored.');
              }
              // Restore is intentionally idempotent: a host may retry after
              // fonts or styles settle without duplicating the static block.
              render(pair, state);
            },
            { selector: pairSelector, state: calculationFreezeState },
          );

          const restoredPair = page.locator(pairSelector);
          const restoredReview = restoredPair.locator(
            '.lia-canvas-freeze-calculation-review[data-freeze-static]',
          );
          await restoredReview.waitFor({ state: 'visible', timeout: 10_000 });
          assert.equal(
            await restoredPair.locator('.lia-canvas-freeze-calculation-review').count(),
            1,
            'a repeated Freeze restore must leave exactly one static review',
          );
          assert.equal(await restoredReview.locator('.lia-canvasplus-line:visible').count(), 3);
          assert.equal(
            await restoredReview.locator(
              '.lia-canvasplus-transition[data-verdict=correct]:visible',
            ).count(),
            2,
          );
          assert.equal(
            (await restoredReview.locator(
              '.lia-canvasplus-analysis-summary:visible',
            ).textContent())?.trim(),
            '2 transitions: 2 correct, 0 incorrect, 0 not checked.',
          );
          assert.equal(
            await restoredPair.locator('.lia-canvasplus-submit:visible').count(),
            0,
            'a Freeze review must not expose the interactive OCR submit action',
          );
          assert.equal(
            await page.evaluate(() => (window as any).__liaFreezeRestoreOcrCalls),
            0,
            'restoring a Freeze review must not invoke handwriting OCR',
          );
          await restoredReview.evaluate(node => {
            (window as any).__liaFreezeLocaleReviewNode = node;
          });

          await assertFreezeCalculationLocale(
            page,
            pairSelector,
            CALCULATION_LOCALE_TEXT.en,
          );
          await setCanvasLocale(page, 'de');
          await assertFreezeCalculationLocale(
            page,
            pairSelector,
            CALCULATION_LOCALE_TEXT.de,
          );
          assert.equal(
            await restoredPair.locator('.lia-canvas-freeze-calculation-review').count(),
            1,
            'the German Freeze locale refresh must not remount the static review',
          );
          assert.equal(
            await restoredReview.evaluate(
              node => (window as any).__liaFreezeLocaleReviewNode === node,
            ),
            true,
            'the German Freeze locale refresh must retain the original review node',
          );
          assert.equal(
            await page.evaluate(() => (window as any).__liaFreezeRestoreOcrCalls),
            0,
            'the German Freeze locale refresh must not invoke OCR',
          );
          await setCanvasLocale(page, 'en');
          await assertFreezeCalculationLocale(
            page,
            pairSelector,
            CALCULATION_LOCALE_TEXT.en,
          );
          assert.equal(
            await restoredPair.locator('.lia-canvas-freeze-calculation-review').count(),
            1,
            'the Freeze EN-DE-EN locale roundtrip must not remount the static review',
          );
          assert.equal(
            await restoredReview.evaluate(
              node => (window as any).__liaFreezeLocaleReviewNode === node,
            ),
            true,
            'the Freeze EN-DE-EN locale roundtrip must retain the original review node',
          );
          assert.equal(
            await page.evaluate(() => (window as any).__liaFreezeRestoreOcrCalls),
            0,
            'the Freeze EN-DE-EN locale roundtrip must not invoke OCR',
          );

          const calculationQuizDiagnostics = await snapshotDiagnostics(page);
          assertSyntheticDelivery(
            calculationQuizHarness,
            CALCULATION_QUIZ_COURSE_URL,
            undefined,
            true,
          );
          assert.deepEqual(calculationQuizHarness.modelRequests, []);
          assertNoRuntimeErrors(calculationQuizHarness, calculationQuizDiagnostics);
        } finally {
          await calculationQuizHarness.context.close();
        }

        const calculationResolveHarness = await createHarness(browser);
        try {
          const pairSelector =
            '.lia-canvas-pair[data-canvas-mode=plus][data-canvas-output=answer]';
          const expectedCalculation = [
            '3x^{2}-7=9 \\mid +7',
            '3x^{2}=16 \\mid :3',
            'x^{2}=\\frac{16}{3}',
            '\\Rightarrow x_{1,2}=\\pm\\frac{4}{\\sqrt{3}}',
          ];
          const expectedSerializedCalculation = JSON.stringify(expectedCalculation);
          const expectedAlignedCalculation =
            '\\begin{aligned} 3x^{2}-7&=9 \\mid +7 \\\\ ' +
            '3x^{2}&=16 \\mid :3 \\\\ ' +
            'x^{2}&=\\frac{16}{3} \\\\ ' +
            '\\Rightarrow x_{1,2}&=\\pm\\frac{4}{\\sqrt{3}} \\end{aligned}';
          await openCourse(
            calculationResolveHarness,
            CALCULATION_QUIZ_COURSE_URL,
            pairSelector + ' .lia-canvas-launch',
          );
          const page = calculationResolveHarness.page;
          assert.equal(
            new URL(page.url()).hash,
            '#1',
            'the isolated Resolve regression must stay on the first calculation page',
          );
          await page.waitForFunction(
            () => typeof (window as any).Algebrite?.run === 'function',
            undefined,
            { timeout: 10_000 },
          );
          await page.evaluate(() => {
            (window as any).__liaCalculationResolveEnsureLoadedCalls = 0;
            (window as any).__liaCalculationResolveRecognizeCalls = 0;
            const ocr = {
              model: 'resolve-must-not-load-ocr',
              precision: 'fp32',
              task: 'image-to-text',
              ensureLoaded: async () => {
                (window as any).__liaCalculationResolveEnsureLoadedCalls += 1;
                return true;
              },
              recognize: async () => {
                (window as any).__liaCalculationResolveRecognizeCalls += 1;
                throw new Error('native Resolve must not invoke handwriting OCR');
              },
            };
            window.__LIA_CANVAS_OCR__.ocr = ocr;
            window.__LIA_CANVAS_OCR__.canvasPlusOcr = ocr;
            (window as any).katex = {
              render(tex: string, target: HTMLElement) {
                target.textContent = 'rendered: ' + tex;
                target.setAttribute('data-rendered-tex', tex);
              },
            };
          });
          await withHostTimeout(
            page.waitForFunction(
              selector => {
                const pair = document.querySelector(selector);
                if (!pair) return false;
                const fields = Array.from(
                  document.querySelectorAll('input, textarea, [contenteditable=true]'),
                );
                let answer: Element | null = null;
                for (const field of fields) {
                  if (field.compareDocumentPosition(pair) & Node.DOCUMENT_POSITION_FOLLOWING) {
                    answer = field;
                  }
                }
                const preview = answer && (
                  (answer as any).__liaTexPreviewBox ||
                  (answer.nextElementSibling?.matches('.lia-tex-preview')
                    ? answer.nextElementSibling
                    : null)
                );
                return Boolean(answer && preview);
              },
              pairSelector,
              { timeout: 5_000 },
            ),
            'empty native calculation input and preview before Resolve',
            6_000,
          );

          const beforeResolve = await withHostTimeout(
            page.evaluate(selector => {
              const pair = document.querySelector(selector);
              const fields = Array.from(
                document.querySelectorAll('input, textarea, [contenteditable=true]'),
              );
              let answer: Element | null = null;
              for (const field of fields) {
                if (pair &&
                    field.compareDocumentPosition(pair) & Node.DOCUMENT_POSITION_FOLLOWING) {
                  answer = field;
                }
              }
              const preview = answer && (
                (answer as any).__liaTexPreviewBox ||
                (answer.nextElementSibling?.matches('.lia-tex-preview')
                  ? answer.nextElementSibling
                  : null)
              ) as HTMLElement | null;
              const fieldStyle = answer ? getComputedStyle(answer) : null;
              const fieldBox = answer?.getBoundingClientRect();
              const previewStyle = preview ? getComputedStyle(preview) : null;
              const previewBox = preview?.getBoundingClientRect();
              return {
                quizCount: document.querySelectorAll('.lia-quiz').length,
                checkCount: document.querySelectorAll('.lia-quiz__check').length,
                resolveCount: document.querySelectorAll('.lia-quiz__resolve').length,
                canvasCount: document.querySelectorAll(selector).length,
                solutionCount: document.querySelectorAll('.lia-quiz__solution').length,
                quizResolved: Boolean(
                  document.querySelector('.lia-quiz')?.classList.contains('resolved'),
                ),
                fieldVisible: Boolean(
                  fieldStyle &&
                  fieldStyle.display !== 'none' &&
                  fieldStyle.visibility !== 'hidden' &&
                  fieldBox &&
                  fieldBox.width > 0 &&
                  fieldBox.height > 0
                ),
                fieldDisabled: Boolean(answer && 'disabled' in answer && (answer as any).disabled),
                previewCount: document.querySelectorAll('.lia-tex-preview').length,
                previewOn: preview?.dataset.on || '0',
                previewVisible: Boolean(
                  previewStyle &&
                  previewStyle.display !== 'none' &&
                  previewStyle.visibility !== 'hidden' &&
                  previewBox &&
                  previewBox.width > 0 &&
                  previewBox.height > 0
                ),
              };
            }, pairSelector),
            'calculation quiz structure before Resolve',
          );
          assert.deepEqual(beforeResolve, {
            quizCount: 1,
            checkCount: 1,
            resolveCount: 1,
            canvasCount: 1,
            solutionCount: 0,
            quizResolved: false,
            fieldVisible: true,
            fieldDisabled: false,
            previewCount: 1,
            previewOn: '0',
            previewVisible: false,
          });
          assert.equal(
            await answerValueBeforePair(page, pairSelector),
            '',
            'the native LiaScript field must start empty and editable',
          );

          const nativeResolve = page.locator('.lia-quiz__resolve');
          assert.equal(await nativeResolve.count(), 1);
          assert.equal(await nativeResolve.isVisible(), true);
          assert.equal(await nativeResolve.isEnabled(), true);
          await nativeResolve.click();
          await withHostTimeout(
            page.waitForFunction(
              ({ selector, expectedValue, expectedTex }) => {
                const pair = document.querySelector(selector);
                if (!pair) return false;
                const fields = Array.from(
                  document.querySelectorAll('input, textarea, [contenteditable=true]'),
                );
                let answer: Element | null = null;
                for (const field of fields) {
                  if (field.compareDocumentPosition(pair) & Node.DOCUMENT_POSITION_FOLLOWING) {
                    answer = field;
                  }
                }
                const value = answer && 'value' in answer
                  ? String((answer as HTMLInputElement).value || '')
                  : String(answer?.textContent || '');
                const preview = answer && (
                  (answer as any).__liaTexPreviewBox ||
                  (answer.nextElementSibling?.matches('.lia-tex-preview')
                    ? answer.nextElementSibling
                    : null)
                ) as HTMLElement | null;
                const math = preview?.querySelector(
                  '.lia-tex-preview-math',
                ) as HTMLElement | null;
                const style = preview ? getComputedStyle(preview) : null;
                const box = preview?.getBoundingClientRect();
                return Boolean(
                  document.querySelector('.lia-quiz.resolved') &&
                  !document.querySelector('.lia-quiz__solution') &&
                  value === expectedValue &&
                  preview?.dataset.on === '1' &&
                  math?.dataset.renderedTex === expectedTex &&
                  style &&
                  style.display !== 'none' &&
                  style.visibility !== 'hidden' &&
                  box &&
                  box.width > 0 &&
                  box.height > 0
                );
              },
              {
                selector: pairSelector,
                expectedValue: expectedSerializedCalculation,
                expectedTex: expectedAlignedCalculation,
              },
              { timeout: 10_000 },
            ),
            'generated calculation handoff after native Resolve',
            12_000,
          );

          const resolvedLauncher = page.locator(
            pairSelector + ' .lia-canvas-launch:visible',
          );
          await resolvedLauncher.click();
          await page.waitForFunction(
            selector => document.querySelector(
              selector + ' .lia-canvas-launch',
            )?.getAttribute('aria-expanded') === 'true',
            pairSelector,
            { timeout: 5_000 },
          );

          const afterResolve = await withHostTimeout(
            page.evaluate(selector => {
              const pair = document.querySelector(selector);
              const fields = Array.from(
                document.querySelectorAll('input, textarea, [contenteditable=true]'),
              );
              let answer: Element | null = null;
              for (const field of fields) {
                if (pair &&
                    field.compareDocumentPosition(pair) & Node.DOCUMENT_POSITION_FOLLOWING) {
                  answer = field;
                }
              }
              const preview = answer && (
                (answer as any).__liaTexPreviewBox ||
                (answer.nextElementSibling?.matches('.lia-tex-preview')
                  ? answer.nextElementSibling
                  : null)
              ) as HTMLElement | null;
              const math = preview?.querySelector(
                '.lia-tex-preview-math',
              ) as HTMLElement | null;
              const previewStyle = preview ? getComputedStyle(preview) : null;
              const previewBox = preview?.getBoundingClientRect();
              const previewParent = preview?.parentElement || null;
              const mathStyle = math ? getComputedStyle(math) : null;
              const cornerRadii = previewStyle
                ? [
                    previewStyle.borderTopLeftRadius,
                    previewStyle.borderTopRightRadius,
                    previewStyle.borderBottomRightRadius,
                    previewStyle.borderBottomLeftRadius,
                  ].map(value => Number.parseFloat(value))
                : [];
              const previewMinorAxis = previewBox
                ? Math.min(previewBox.width, previewBox.height)
                : 0;
              const launcher = pair?.querySelector('.lia-canvas-launch') as HTMLElement | null;
              const launcherStyle = launcher ? getComputedStyle(launcher) : null;
              const launcherBox = launcher?.getBoundingClientRect();
              return {
                quizCount: document.querySelectorAll('.lia-quiz').length,
                checkCount: document.querySelectorAll('.lia-quiz__check').length,
                resolveCount: document.querySelectorAll('.lia-quiz__resolve').length,
                canvasCount: document.querySelectorAll(selector).length,
                solutionCount: document.querySelectorAll('.lia-quiz__solution').length,
                quizResolved: Boolean(
                  document.querySelector('.lia-quiz')?.classList.contains('resolved'),
                ),
                previewCount: document.querySelectorAll('.lia-tex-preview').length,
                previewOn: preview?.dataset.on || '0',
                previewMultiline: preview?.dataset.multiline || '0',
                previewGrid: Boolean(previewStyle?.display.includes('grid')),
                previewNonPill: Boolean(
                  cornerRadii.length === 4 &&
                  cornerRadii.every(Number.isFinite) &&
                  Math.max(...cornerRadii) * 2 < previewMinorAxis
                ),
                previewBoundedWidth: Boolean(
                  preview && previewParent &&
                  preview.offsetWidth <= previewParent.clientWidth
                ),
                mathBoundedWidth: Boolean(
                  preview && math && math.clientWidth <= preview.clientWidth
                ),
                mathOverflowX: mathStyle?.overflowX || '',
                mathScrollRangeValid: Boolean(
                  math && math.scrollWidth >= math.clientWidth
                ),
                previewVisible: Boolean(
                  previewStyle &&
                  previewStyle.display !== 'none' &&
                  previewStyle.visibility !== 'hidden' &&
                  previewBox &&
                  previewBox.width > 0 &&
                  previewBox.height > 0
                ),
                previewBeforeCanvas: Boolean(
                  preview && pair &&
                  preview.compareDocumentPosition(pair) & Node.DOCUMENT_POSITION_FOLLOWING,
                ),
                renderedTex: math?.dataset.renderedTex || '',
                canvasLauncherVisible: Boolean(
                  launcherStyle &&
                  launcherStyle.display !== 'none' &&
                  launcherStyle.visibility !== 'hidden' &&
                  launcherBox &&
                  launcherBox.width > 0 &&
                  launcherBox.height > 0
                ),
                launcherExpanded: launcher?.getAttribute('aria-expanded') || 'false',
                launcherText: launcher?.textContent?.trim() || '',
                launcherAriaLabel: launcher?.getAttribute('aria-label') || '',
                launcherLabelCount:
                  launcher?.querySelectorAll('.lia-canvas-launch-label').length || 0,
                launcherSvgCount: launcher?.querySelectorAll('svg').length || 0,
                launcherWidth: launcherStyle?.width || '',
                launcherHeight: launcherStyle?.height || '',
                launcherVerticalAlign: launcherStyle?.verticalAlign || '',
                pairVerticalAlign: pair ? getComputedStyle(pair).verticalAlign : '',
                ensureLoadedCalls:
                  (window as any).__liaCalculationResolveEnsureLoadedCalls,
                recognizeCalls: (window as any).__liaCalculationResolveRecognizeCalls,
              };
            }, pairSelector),
            'calculation quiz structure after Resolve',
          );
          assert.deepEqual(
            {
              quizCount: afterResolve.quizCount,
              checkCount: afterResolve.checkCount,
              resolveCount: afterResolve.resolveCount,
              canvasCount: afterResolve.canvasCount,
              solutionCount: afterResolve.solutionCount,
            },
            {
              quizCount: 1,
              checkCount: 1,
              resolveCount: 1,
              canvasCount: 1,
              solutionCount: 0,
            },
            'Resolve must retain exactly one native quiz, check, resolve button, and canvas',
          );
          assert.equal(afterResolve.quizResolved, true);
          assert.equal(afterResolve.previewCount, 1);
          assert.equal(afterResolve.previewOn, '1');
          assert.equal(afterResolve.previewMultiline, '1');
          assert.equal(afterResolve.previewGrid, true);
          assert.equal(afterResolve.previewNonPill, true);
          assert.equal(afterResolve.previewBoundedWidth, true);
          assert.equal(afterResolve.mathBoundedWidth, true);
          assert.equal(afterResolve.mathOverflowX, 'auto');
          assert.equal(afterResolve.mathScrollRangeValid, true);
          assert.equal(afterResolve.previewVisible, true);
          assert.equal(afterResolve.previewBeforeCanvas, true);
          assert.equal(afterResolve.renderedTex, expectedAlignedCalculation);
          assert.equal(afterResolve.canvasLauncherVisible, true);
          assert.equal(afterResolve.launcherExpanded, 'true');
          assert.equal(afterResolve.launcherText, '');
          assert.equal(afterResolve.launcherAriaLabel, 'Close calculation block');
          assert.equal(afterResolve.launcherLabelCount, 0);
          assert.equal(afterResolve.launcherSvgCount, 1);
          assert.equal(afterResolve.launcherWidth, '32px');
          assert.equal(afterResolve.launcherHeight, '32px');
          assert.equal(afterResolve.launcherVerticalAlign, 'top');
          assert.equal(afterResolve.pairVerticalAlign, 'top');
          assert.equal(afterResolve.ensureLoadedCalls, 0);
          assert.equal(afterResolve.recognizeCalls, 0);
          const resolvedAnswer = await answerValueBeforePair(page, pairSelector);
          assert.deepEqual(
            JSON.parse(resolvedAnswer),
            expectedCalculation,
            'native Resolve must hand off the complete four-row calculation as JSON',
          );

          // LiaScript can rewrite the authored answer during its delayed render
          // cycle. Inspect the durable state after the bounded runtime guard has
          // ended, rather than sampling its at-most-16ms corrective interval.
          await page.waitForTimeout(3_800);
          assert.equal(
            await answerValueBeforePair(page, pairSelector),
            expectedSerializedCalculation,
            'the generated calculation must survive LiaScript\'s delayed resolved rerender',
          );
          assert.deepEqual(
            await page.evaluate(() => {
              const quiz = document.querySelector('.lia-quiz');
              const preview = document.querySelector(
                '.lia-tex-preview',
              ) as HTMLElement | null;
              const math = preview?.querySelector(
                '.lia-tex-preview-math',
              ) as HTMLElement | null;
              return {
                quizResolved: Boolean(quiz?.classList.contains('resolved')),
                solutionCount: document.querySelectorAll('.lia-quiz__solution').length,
                previewOn: preview?.dataset.on || '0',
                renderedTex: math?.dataset.renderedTex || '',
              };
            }),
            {
              quizResolved: true,
              solutionCount: 0,
              previewOn: '1',
              renderedTex: expectedAlignedCalculation,
            },
            'the resolved quiz and full TeX preview must remain stable after runtime settling',
          );

          const calculationResolveDiagnostics = await snapshotDiagnostics(page);
          assertSyntheticDelivery(
            calculationResolveHarness,
            CALCULATION_QUIZ_COURSE_URL,
            undefined,
            true,
          );
          assert.deepEqual(calculationResolveHarness.modelRequests, []);
          assert.deepEqual(calculationResolveHarness.chunkRequests, []);
          assertNoRuntimeErrors(
            calculationResolveHarness,
            calculationResolveDiagnostics,
          );
        } finally {
          await calculationResolveHarness.context.close();
        }

        const generalLinearResolveHarness = await createHarness(browser);
        try {
          const pairSelector =
            '.lia-canvas-pair[data-canvas-mode=plus][data-canvas-output=answer]';
          const expectedGeneralLinearCalculation = [
            '2(x+3)=3x-4',
            '2x+6=3x-4',
            'x-10=0 \\mid +10',
            'x=10',
          ];
          const expectedGeneralLinearSerialized = JSON.stringify(
            expectedGeneralLinearCalculation,
          );
          const expectedGeneralLinearAligned =
            '\\begin{aligned} 2(x+3)&=3x-4 \\\\ ' +
            '2x+6&=3x-4 \\\\ ' +
            'x-10&=0 \\mid +10 \\\\ ' +
            'x&=10 \\end{aligned}';
          await openCourse(
            generalLinearResolveHarness,
            CALCULATION_QUIZ_COURSE_URL,
            pairSelector + ' .lia-canvas-launch',
          );
          const page = generalLinearResolveHarness.page;
          assert.equal(new URL(page.url()).hash, '#1');
          await page.evaluate(() => {
            location.hash = '#3';
          });
          await page.reload({
            waitUntil: 'domcontentloaded',
            timeout: 120_000,
          });
          await page.waitForFunction(
            selector => {
              const heading = Array.from(document.querySelectorAll('h1,h2,h3'))
                .find(node => node.textContent?.trim() === 'Third calculation');
              const pair = document.querySelector(selector) as HTMLElement | null;
              const box = pair?.getBoundingClientRect();
              return location.hash === '#3' &&
                Boolean(window.__liaCanvasTestDiagnostics?.diagnosticsReady) &&
                Boolean(window.__LIA_CANVAS_OCR__) &&
                Boolean(heading && pair && box && box.width > 0 && box.height > 0);
            },
            pairSelector,
            { timeout: 30_000 },
          );
          assert.equal(
            new URL(page.url()).hash,
            '#3',
            'the dynamic linear Resolve regression must use its own third page',
          );
          assert.deepEqual(
            await page.locator(pairSelector).evaluate(node => ({
              options: (node as HTMLElement).dataset.calculationOptions,
              optionState: (node as HTMLElement).dataset.calculationOptionsState,
              lineFeedback: (node as HTMLElement).dataset.lineFeedback,
            })),
            {
              options: '0',
              optionState: 'valid',
              lineFeedback: '0',
            },
            'the third calculation pair must expose the positional feedback opt-out',
          );
          await page.waitForFunction(
            () => typeof (window as any).Algebrite?.run === 'function',
            undefined,
            { timeout: 10_000 },
          );
          await page.evaluate(() => {
            (window as any).__liaGeneralLinearResolveEnsureLoadedCalls = 0;
            (window as any).__liaGeneralLinearResolveRecognizeCalls = 0;
            const ocr = {
              model: 'general-linear-resolve-must-not-load-ocr',
              precision: 'fp32',
              task: 'image-to-text',
              ensureLoaded: async () => {
                (window as any).__liaGeneralLinearResolveEnsureLoadedCalls += 1;
                return true;
              },
              recognize: async () => {
                (window as any).__liaGeneralLinearResolveRecognizeCalls += 1;
                throw new Error('native Resolve must not invoke handwriting OCR');
              },
            };
            window.__LIA_CANVAS_OCR__.ocr = ocr;
            window.__LIA_CANVAS_OCR__.canvasPlusOcr = ocr;
            (window as any).katex = {
              render(tex: string, target: HTMLElement) {
                target.textContent = 'rendered: ' + tex;
                target.setAttribute('data-rendered-tex', tex);
              },
            };
          });
          await withHostTimeout(
            page.waitForFunction(
              selector => Boolean(
                document.querySelector(selector) &&
                document.querySelector('.lia-tex-preview')
              ),
              pairSelector,
              { timeout: 5_000 },
            ),
            'third-page native calculation field and preview before Resolve',
            6_000,
          );
          assert.deepEqual(
            await page.evaluate(selector => ({
              quizCount: document.querySelectorAll('.lia-quiz').length,
              checkCount: document.querySelectorAll('.lia-quiz__check').length,
              resolveCount: document.querySelectorAll('.lia-quiz__resolve').length,
              canvasCount: document.querySelectorAll(selector).length,
              solutionCount: document.querySelectorAll('.lia-quiz__solution').length,
            }), pairSelector),
            {
              quizCount: 1,
              checkCount: 1,
              resolveCount: 1,
              canvasCount: 1,
              solutionCount: 0,
            },
          );
          assert.equal(
            await answerValueBeforePair(page, pairSelector),
            '',
            'the third-page native input must start empty',
          );

          const nativeResolve = page.locator('.lia-quiz__resolve');
          assert.equal(await nativeResolve.count(), 1);
          assert.equal(await nativeResolve.isVisible(), true);
          assert.equal(await nativeResolve.isEnabled(), true);
          await nativeResolve.click();
          const resolvedGeneralLinearHandle = await withHostTimeout(
            page.waitForFunction(
              ({ selector, expectedValue, expectedTex }) => {
                const pair = document.querySelector(selector);
                if (!pair) return false;
                const fields = Array.from(
                  document.querySelectorAll('input, textarea, [contenteditable=true]'),
                );
                let answer: Element | null = null;
                for (const field of fields) {
                  if (field.compareDocumentPosition(pair) & Node.DOCUMENT_POSITION_FOLLOWING) {
                    answer = field;
                  }
                }
                const value = answer && 'value' in answer
                  ? String((answer as HTMLInputElement).value || '')
                  : String(answer?.textContent || '');
                const preview = answer && (
                  (answer as any).__liaTexPreviewBox ||
                  (answer.nextElementSibling?.matches('.lia-tex-preview')
                    ? answer.nextElementSibling
                    : null)
                ) as HTMLElement | null;
                const math = preview?.querySelector(
                  '.lia-tex-preview-math',
                ) as HTMLElement | null;
                const ready = Boolean(
                  document.querySelector('.lia-quiz.resolved') &&
                  !document.querySelector('.lia-quiz__solution') &&
                  value === expectedValue &&
                  preview?.dataset.on === '1' &&
                  preview.dataset.multiline === '1' &&
                  math?.dataset.renderedTex === expectedTex
                );
                return ready ? value : false;
              },
              {
                selector: pairSelector,
                expectedValue: expectedGeneralLinearSerialized,
                expectedTex: expectedGeneralLinearAligned,
              },
              { timeout: 10_000 },
            ),
            'dynamic general-linear calculation handoff after native Resolve',
            12_000,
          );

          const resolvedGeneralLinearAnswer = String(
            (await resolvedGeneralLinearHandle.jsonValue()) || '',
          );
          assert.equal(
            resolvedGeneralLinearAnswer,
            expectedGeneralLinearSerialized,
          );
          assert.deepEqual(
            JSON.parse(resolvedGeneralLinearAnswer),
            expectedGeneralLinearCalculation,
            'Resolve must derive the expanded general-linear path from page 3',
          );
          assert.doesNotMatch(
            resolvedGeneralLinearAnswer,
            /3x\^\{2\}-7=9/u,
            'the dynamic generator must not reuse the page-1 demo calculation',
          );

          await page.waitForTimeout(3_800);
          assert.equal(
            await answerValueBeforePair(page, pairSelector),
            expectedGeneralLinearSerialized,
            'the page-3 generated calculation must survive runtime settling',
          );
          assert.deepEqual(
            await page.evaluate(selector => {
              const preview = document.querySelector(
                '.lia-tex-preview',
              ) as HTMLElement | null;
              const math = preview?.querySelector(
                '.lia-tex-preview-math',
              ) as HTMLElement | null;
              return {
                quizResolved: Boolean(
                  document.querySelector('.lia-quiz')?.classList.contains('resolved'),
                ),
                quizCount: document.querySelectorAll('.lia-quiz').length,
                checkCount: document.querySelectorAll('.lia-quiz__check').length,
                resolveCount: document.querySelectorAll('.lia-quiz__resolve').length,
                canvasCount: document.querySelectorAll(selector).length,
                solutionCount: document.querySelectorAll('.lia-quiz__solution').length,
                previewOn: preview?.dataset.on || '0',
                previewMultiline: preview?.dataset.multiline || '0',
                renderedTex: math?.dataset.renderedTex || '',
                ensureLoadedCalls:
                  (window as any).__liaGeneralLinearResolveEnsureLoadedCalls,
                recognizeCalls:
                  (window as any).__liaGeneralLinearResolveRecognizeCalls,
              };
            }, pairSelector),
            {
              quizResolved: true,
              quizCount: 1,
              checkCount: 1,
              resolveCount: 1,
              canvasCount: 1,
              solutionCount: 0,
              previewOn: '1',
              previewMultiline: '1',
              renderedTex: expectedGeneralLinearAligned,
              ensureLoadedCalls: 0,
              recognizeCalls: 0,
            },
            'the third-page Resolve result must remain native, dynamic, and OCR-free',
          );

          const disabledFreezeRestore = await page.evaluate(selector => {
            const pair = document.querySelector(selector) as HTMLElement | null;
            const freeze = window.__LIA_CANVAS_OCR__?.freeze;
            const uid = pair && freeze?.getCanvasUidFromPair?.(pair);
            if (!pair || !uid || typeof freeze?.renderCanvasFreezeStateIntoPair !== 'function') {
              throw new Error('The opted-out calculation Freeze API is unavailable.');
            }
            document.body.classList.add(
              'lia-course-frozen',
              'lia-snapshot-mode',
              'lia-shared-freeze-link',
            );
            const rendered = freeze.renderCanvasFreezeStateIntoPair(pair, {
              v: 'cvf1',
              u: uid,
              e: 1,
              w: 0,
              h: 0,
              bg: { m: 'none' },
              it: [],
              cr: {
                v: 'cr1',
                lines: ['2(x+3)=3x-4', '2x+6=3x-4'],
                state: 'ready',
                checks: [{
                  status: 'valid',
                  reason: 'equivalent-linear-equations',
                }],
              },
            });
            return {
              rendered: Boolean(rendered),
              lineFeedback: pair.dataset.lineFeedback,
              reviewCount: pair.querySelectorAll(
                '.lia-canvas-freeze-calculation-review',
              ).length,
              transitionCount: pair.querySelectorAll(
                '.lia-canvasplus-transition',
              ).length,
              summaryCount: pair.querySelectorAll(
                '.lia-canvasplus-analysis-summary',
              ).length,
            };
          }, pairSelector);
          assert.deepEqual(
            disabledFreezeRestore,
            {
              rendered: true,
              lineFeedback: '0',
              reviewCount: 0,
              transitionCount: 0,
              summaryCount: 0,
            },
            '@BerechneOCR(0) must not reveal feedback supplied by a Freeze state',
          );

          const generalLinearResolveDiagnostics = await snapshotDiagnostics(page);
          assertSyntheticDelivery(
            generalLinearResolveHarness,
            CALCULATION_QUIZ_COURSE_URL,
            undefined,
            true,
          );
          assert.deepEqual(generalLinearResolveHarness.modelRequests, []);
          assert.deepEqual(generalLinearResolveHarness.chunkRequests, []);
          assertNoRuntimeErrors(
            generalLinearResolveHarness,
            generalLinearResolveDiagnostics,
          );
        } finally {
          await generalLinearResolveHarness.context.close();
        }

        const missingCasHarness = await createHarness(browser, {
          withAlgebrite: false,
        });
        try {
          const pairSelector =
            '.lia-canvas-pair[data-canvas-mode=plus][data-canvas-output=answer]';
          await openCourse(
            missingCasHarness,
            CALCULATION_QUIZ_COURSE_URL,
            pairSelector + ' .lia-canvas-launch',
          );
          const page = missingCasHarness.page;
          const pair = page.locator(pairSelector);
          assert.equal(
            await page.evaluate(() => typeof (window as any).Algebrite),
            'undefined',
          );

          await page.evaluate(() => {
            (window as any).__missingCasResponses = ['3x-5=8', '3x=13'];
            (window as any).katex = {
              render(tex: string, target: HTMLElement) {
                target.textContent = 'rendered: ' + tex;
                target.setAttribute('data-rendered-tex', tex);
              },
            };
            window.__LIA_CANVAS_OCR__.ocr = {
              model: 'missing-cas-stub-model',
              precision: 'fp32',
              task: 'image-to-text',
              ensureLoaded: async () => true,
              recognize: async () => {
                const response = (window as any).__missingCasResponses.shift();
                if (typeof response !== 'string') {
                  throw new Error('unexpected missing-CAS OCR call');
                }
                return response;
              },
            };
            window.__LIA_CANVAS_OCR__.canvasPlusOcr =
              window.__LIA_CANVAS_OCR__.ocr;
          });

          await pair.locator('.lia-canvas-launch:visible').click();
          const canvas = pair.locator('canvas.lia-draw:visible');
          await canvas.waitFor({ state: 'visible', timeout: 10_000 });
          const box = await canvas.boundingBox();
          assert.ok(box);
          await drawMouseStroke(
            page,
            box.x + box.width * 0.20,
            box.y + box.height * 0.30,
            box.x + box.width * 0.58,
            box.y + box.height * 0.30,
          );
          await drawMouseStroke(
            page,
            box.x + box.width * 0.28,
            box.y + box.height * 0.72,
            box.x + box.width * 0.62,
            box.y + box.height * 0.72,
          );
          await pair.locator('.lia-canvasplus-submit:visible').click();
          await page.waitForFunction(
            selector => {
              const output = document.querySelector(
                selector + ' .lia-canvasplus-output',
              ) as HTMLElement | null;
              return output?.dataset.analysisState === 'ready' &&
                output.querySelector(
                  '.lia-canvasplus-transition[data-code=cas-unavailable]',
                );
            },
            pairSelector,
            { timeout: 10_000 },
          );

          const output = pair.locator('.lia-canvasplus-output');
          assert.equal(
            (await output.locator('.lia-canvasplus-analysis-summary').innerText()).trim(),
            'The CAS is unavailable. Import LiaTemplates/Algebrite before Canvas OCR; no transitions were checked.',
          );
          const transition = output.locator(
            '.lia-canvasplus-transition[data-code=cas-unavailable]',
          );
          assert.equal(await transition.count(), 1);
          const missingCasToggle = output.locator(
            ':scope > summary.lia-canvasplus-result-toggle',
          );
          assert.equal(
            await output.evaluate(node => (node as HTMLDetailsElement).open),
            false,
          );
          await missingCasToggle.focus();
          await missingCasToggle.press('Enter');
          await page.waitForFunction(
            selector => Boolean((document.querySelector(
              selector + ' .lia-canvasplus-output',
            ) as HTMLDetailsElement | null)?.open),
            pairSelector,
            { timeout: 5_000 },
          );
          assert.equal(
            (await transition.locator('.lia-canvasplus-transition-label').innerText()).trim(),
            'CAS unavailable',
          );
          await transition.locator('.lia-canvasplus-transition-trigger').click();
          assert.equal(
            (await transition.locator('.lia-canvasplus-transition-detail').innerText()).trim(),
            'The CAS is unavailable. Import LiaTemplates/Algebrite before Canvas OCR.',
          );

          const missingCasDiagnostics = await snapshotDiagnostics(page);
          assertSyntheticDelivery(
            missingCasHarness,
            CALCULATION_QUIZ_COURSE_URL,
            undefined,
            'missing',
          );
          assert.deepEqual(missingCasHarness.modelRequests, []);
          assert.deepEqual(missingCasHarness.chunkRequests, []);
          assertNoRuntimeErrors(missingCasHarness, missingCasDiagnostics);
        } finally {
          await missingCasHarness.context.close();
        }
      } finally {
        await browser.close();
      }
    },
  );
}
