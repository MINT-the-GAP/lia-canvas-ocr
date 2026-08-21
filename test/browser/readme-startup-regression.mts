import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { chromium } from 'playwright';

import {
  BUNDLE_URL,
  LIASCRIPT_STABLE_URL,
  SYNTHETIC_ORIGIN,
  assertNoRuntimeErrors,
  createHarness,
  snapshotDiagnostics,
  withHostTimeout,
} from './support.mts';

const README_COURSE_URL = `${SYNTHETIC_ORIGIN}/README.md`;

test(
  'unchanged README boots its runtime and opens a calculation canvas in LiaScript',
  { timeout: 120_000 },
  async () => {
    const browser = await chromium.launch({ headless: true });
    try {
      const harness = await createHarness(browser);
      try {
        const readme = await readFile(
          new URL('../../README.md', import.meta.url),
          'utf8',
        );
        let readmeRequests = 0;
        await harness.context.route(README_COURSE_URL, route => {
          readmeRequests += 1;
          return route.fulfill({
            status: 200,
            contentType: 'text/plain; charset=utf-8',
            headers: {
              'access-control-allow-origin': '*',
              'cache-control': 'no-store',
            },
            body: readme,
          });
        });

        await harness.page.goto(
          `${LIASCRIPT_STABLE_URL}?${README_COURSE_URL}#3`,
          { waitUntil: 'domcontentloaded', timeout: 120_000 },
        );
        await withHostTimeout(
          harness.page.waitForFunction(
            () => Boolean(window.__LIA_CANVAS_OCR__?.canvasBoot),
            undefined,
            { timeout: 30_000 },
          ),
          'README runtime bootstrap',
          35_000,
        );

        assert.ok(readmeRequests >= 1, 'the unchanged README was not requested');
        assert.ok(
          (harness.routeHits[BUNDLE_URL] ?? 0) >= 1,
          'the README did not request the routed runtime bundle',
        );
        assert.match(
          harness.bundleContentType(),
          /^application\/javascript(?:;|$)/iu,
          'the README runtime was not delivered as JavaScript',
        );

        const launcher = harness.page.locator('.lia-canvas-launch').first();
        await launcher.waitFor({ state: 'visible', timeout: 30_000 });
        const before = await launcher.evaluate(button => {
          const svg = button.querySelector('svg');
          const buttonRect = button.getBoundingClientRect();
          const svgRect = svg?.getBoundingClientRect();
          return {
            cssInjected: Boolean(document.getElementById('__lia_canvas_ocr_css_v2')),
            ariaExpanded: button.getAttribute('aria-expanded'),
            buttonWidth: buttonRect.width,
            buttonHeight: buttonRect.height,
            svgWidth: svgRect?.width ?? 0,
            svgHeight: svgRect?.height ?? 0,
          };
        });
        assert.equal(before.cssInjected, true, 'the README runtime CSS was not injected');
        assert.equal(before.ariaExpanded, 'false');
        assert.ok(before.buttonWidth >= 30 && before.buttonHeight >= 30);
        assert.ok(before.svgWidth >= 16 && before.svgHeight >= 16);

        await launcher.click();
        await withHostTimeout(
          harness.page.waitForFunction(() => {
            const pair = document.querySelector('.lia-canvas-pair');
            const mount = pair?.querySelector('.lia-canvas-mount');
            const canvas = pair?.querySelector('canvas.lia-draw');
            return pair?.querySelector('.lia-canvas-launch')?.getAttribute('aria-expanded') === 'true' &&
              mount?.getAttribute('data-open') === '1' &&
              canvas instanceof HTMLCanvasElement &&
              canvas.getBoundingClientRect().width > 0 &&
              canvas.getBoundingClientRect().height > 0;
          }, undefined, { timeout: 10_000 }),
          'README calculation canvas open',
          12_000,
        );

        assertNoRuntimeErrors(harness, await snapshotDiagnostics(harness.page));
      } finally {
        await harness.context.close();
      }
    } finally {
      await browser.close();
    }
  },
);
