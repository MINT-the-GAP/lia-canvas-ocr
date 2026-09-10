import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { chromium, firefox, webkit, type CDPSession, type Page } from 'playwright';

type MutationSummary = { ringState: number; attributes: Record<string, number> };

async function settleFrames(page: Page): Promise<void> {
  await page.evaluate(() => new Promise<void>(resolve => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  }));
}

async function readMutations(page: Page): Promise<MutationSummary> {
  await settleFrames(page);
  return page.evaluate(() => {
    const records = (window as any).__canvasMutationRecords.splice(0) as MutationRecord[];
    const attributes: Record<string, number> = {};
    for (const record of records) {
      const target = record.target as HTMLElement;
      const key = `${target.classList[0] || target.tagName}:${record.attributeName}`;
      attributes[key] = (attributes[key] || 0) + 1;
    }
    return {
      ringState: records.filter(record =>
        (record.target as Element).classList.contains('lia-eraser-ring') &&
        record.attributeName === 'data-on'
      ).length,
      attributes,
    };
  });
}

async function dispatchPen(
  session: CDPSession,
  type: 'mousePressed' | 'mouseMoved' | 'mouseReleased',
  x: number,
  y: number,
): Promise<void> {
  await session.send('Input.dispatchMouseEvent', {
    type, x, y, pointerType: 'pen', button: 'left',
    buttons: type === 'mouseReleased' ? 0 : 1,
    clickCount: type === 'mousePressed' || type === 'mouseReleased' ? 1 : 0,
    force: type === 'mouseReleased' ? 0 : 0.5,
  });
}

for (const browserType of [chromium, firefox, webkit]) {
  test(`${browserType.name()}: canvas pointer movements avoid redundant DOM mutations and preserve eraser visibility`,
    { timeout: 60_000 }, async t => {
      const browser = await browserType.launch({ headless: true });
      t.diagnostic(`Browser: ${browserType.name()} ${browser.version()}`);
      try {
        const page = await browser.newPage({ viewport: { width: 1000, height: 700 } });
        const errors: string[] = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.setContent(`<!doctype html><html lang="en"><body>
          <span class="lia-canvas-pair">
            <span class="lia-canvas-anchor" data-seed="mutation-test">
              <button class="lia-canvas-launch" type="button">Canvas</button>
            </span>
            <span class="lia-canvas-mount" data-open="0" data-uid="mutation-test"></span>
          </span>
        </body></html>`);
        await page.addScriptTag({ content: await readFile(
          new URL('../../dist/index.js', import.meta.url), 'utf8'
        ) });
        await page.locator('.lia-canvas-launch').click();
        const canvas = page.locator('canvas.lia-draw[data-ready="1"]');
        await canvas.waitFor({ state: 'visible' });
        await settleFrames(page);
        const box = await canvas.boundingBox();
        assert.ok(box && box.width > 200 && box.height > 100);
        const x = box.x + 160;
        const y = box.y + 100;
        // Chromium can send genuine pen events through CDP. Firefox/WebKit
        // exercise the same drawing handlers through their native mouse input.
        const session = browserType === chromium
          ? await page.context().newCDPSession(page) : null;
        const pen = async (
          type: 'mousePressed' | 'mouseMoved' | 'mouseReleased',
          px: number, py: number,
        ): Promise<void> => {
          if (session) return dispatchPen(session, type, px, py);
          if (type === 'mouseMoved') await page.mouse.move(px, py);
          else if (type === 'mousePressed') {
            await page.mouse.move(px, py);
            await page.mouse.down();
          } else {
            await page.mouse.move(px, py);
            await page.mouse.up();
          }
        };
        await page.evaluate(() => {
          const records: MutationRecord[] = [];
          (window as any).__canvasMutationRecords = records;
          new MutationObserver(mutations => records.push(...mutations))
            .observe(document.documentElement, { attributes: true, subtree: true });
        });

        await pen('mouseMoved', x, y);
        await pen('mousePressed', x, y);
        await readMutations(page);
        for (let i = 1; i <= 30; i++) {
          await pen('mouseMoved', x + i * 3, y + i);
        }
        const hidden = await readMutations(page);
        t.diagnostic(`30 pen movements with hidden eraser: ${JSON.stringify(hidden)}`);
        await pen('mouseReleased', x + 90, y + 30);
        const firstEnd = await readMutations(page);
        t.diagnostic(`First stroke end: ${JSON.stringify(firstEnd)}`);
        const stroke = await page.evaluate(() => {
          const item = (window as any).__LIA_CANVAS_OCR__.store['mutation-test'].ITEMS[0];
          return { tool: item.tool, pointCount: item.points.length };
        });
        assert.equal(stroke.tool, 'pen');
        assert.ok(stroke.pointCount >= 31, 'real pen events must extend the recorded stroke');

        await pen('mousePressed', x, y);
        const repeatedStart = await readMutations(page);
        await pen('mouseReleased', x, y);
        const repeatedEnd = await readMutations(page);
        t.diagnostic(`Repeated stroke start/end: ${JSON.stringify({ repeatedStart, repeatedEnd })}`);

        await page.locator('.lia-eraser-btn').click();
        await page.keyboard.press('Escape');
        await pen('mouseMoved', x, y);
        await readMutations(page);
        await pen('mousePressed', x, y);
        const shown = await readMutations(page);
        const ring = page.locator('.lia-eraser-ring');
        assert.equal(await ring.getAttribute('data-on'), '1');
        assert.equal(await ring.isVisible(), true);
        for (let i = 1; i <= 30; i++) {
          await pen('mouseMoved', x + i * 3, y + i);
        }
        const moving = await readMutations(page);
        assert.equal(await ring.getAttribute('data-on'), '1');
        await pen('mouseReleased', x + 90, y + 30);
        const hiddenAgain = await readMutations(page);
        assert.equal(await ring.getAttribute('data-on'), '0');
        assert.equal(await ring.isVisible(), false);
        await canvas.dispatchEvent('pointercancel', { pointerId: 2, pointerType: 'pen' });
        const cancelledAgain = await readMutations(page);
        t.diagnostic(`Eraser show/move/hide/repeated hide: ${JSON.stringify({ shown, moving, hiddenAgain, cancelledAgain })}`);

        await pen('mousePressed', x, y);
        const shownAgain = await readMutations(page);
        assert.equal(await ring.isVisible(), true);
        await pen('mouseReleased', x, y);
        const hiddenTwice = await readMutations(page);
        assert.equal(await ring.isVisible(), false);

        // A retained OCR selection is redrawn along with every stroke. Its
        // stationary action buttons must also remain free of attribute churn.
        await page.locator('.lia-rect-btn').click();
        await pen('mouseMoved', x, y);
        await pen('mousePressed', x, y);
        await pen('mouseMoved', x + 80, y + 30);
        await pen('mouseReleased', x + 80, y + 30);
        await settleFrames(page);
        const selectionButtons = page.locator('.lia-rect-action, .lia-rect-close');
        assert.equal(await selectionButtons.count(), 2);
        for (const button of await selectionButtons.all()) {
          assert.equal(await button.isVisible(), true);
        }
        await page.locator('.lia-color-btn').click();
        await page.keyboard.press('Escape');
        await pen('mouseMoved', x + 100, y - 50);
        await pen('mousePressed', x + 100, y - 50);
        await readMutations(page);
        for (let i = 1; i <= 30; i++) {
          await pen('mouseMoved', x + 100 + i * 3, y - 50 + i);
        }
        const selectedDrawing = await readMutations(page);
        await pen('mouseReleased', x + 190, y - 20);
        for (const button of await selectionButtons.all()) {
          assert.equal(await button.isVisible(), true);
        }
        t.diagnostic(`30 pen movements with retained selection: ${JSON.stringify(selectedDrawing)}`);

        assert.deepEqual(errors, []);
        assert.deepEqual(selectedDrawing.attributes, {}, 'drawing must not hide/show stationary selection buttons');
        assert.equal(hidden.ringState, 0, 'hidden eraser must not mutate data-on during pen moves');
        assert.deepEqual(hidden.attributes, {}, 'normal pen movement must not rewrite DOM attributes');
        assert.deepEqual(repeatedStart.attributes, {}, 'unchanged toolbar state must not be rewritten at stroke start');
        assert.deepEqual(repeatedEnd.attributes, {}, 'unchanged toolbar state must not be rewritten at stroke end');
        assert.equal(shown.ringState, 1, 'showing the eraser must change data-on exactly once');
        assert.equal(moving.ringState, 0, 'visible eraser must not rewrite data-on while moving');
        assert.equal(hiddenAgain.ringState, 1, 'hiding the eraser must change data-on exactly once');
        assert.equal(cancelledAgain.ringState, 0, 'hiding an already hidden eraser must not mutate data-on');
        assert.equal(shownAgain.ringState, 1, 'a hidden eraser can be shown again');
        assert.equal(hiddenTwice.ringState, 1, 'a shown eraser can be hidden again');
      } finally {
        await browser.close();
      }
    });
}
