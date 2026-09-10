import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { chromium, firefox, webkit, type BrowserType, type Page } from 'playwright';

const projects = [chromium, firefox, webkit].filter(browser =>
  (process.env.LIA_BROWSER_PROJECTS || 'chromium,firefox,webkit').split(',')
    .map(value => value.trim()).includes(browser.name())
);

async function settleFrames(page: Page): Promise<void> {
  await page.evaluate(() => new Promise<void>(resolve => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  }));
}

async function setup(browserType: BrowserType, count = 2) {
  const browser = await browserType.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1100, height: 1600 } });
  page.setDefaultTimeout(10_000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setContent(`<!doctype html><html lang="en"><body>
    ${Array.from({ length: count }, (_, i) => `<section id="root-${i}">
      <span class="lia-canvas-pair" id="pair-${i}">
        <span class="lia-canvas-anchor" data-seed="live-${i}">
          <button class="lia-canvas-launch" type="button">Canvas ${i}</button>
        </span>
        <span class="lia-canvas-mount" data-open="0" data-uid="live-${i}"></span>
      </span>
    </section>`).join('')}
  </body></html>`);
  await page.addScriptTag({ content: await readFile(
    new URL('../../dist/index.js', import.meta.url), 'utf8'
  ) });
  await page.evaluate(() => {
    const win = window as any;
    win.__liveChanges = [];
    win.__liveActivities = [];
    window.addEventListener('lia:canvas-change', (event: Event) => {
      win.__liveChanges.push((event as CustomEvent).detail);
    });
    window.addEventListener('lia:canvas-activity', (event: Event) => {
      win.__liveActivities.push((event as CustomEvent).detail);
    });
    // Guard only synchronous live calls, leaving normal painting and the
    // explicitly requested final submission export outside instrumentation.
    win.__withoutLiveRaster = (fn: () => any) => {
      const calls: Record<string, number> = {};
      const restore: Array<() => void> = [];
      const block = (owner: any, name: string, label: string) => {
        if (!owner || typeof owner[name] !== 'function') return;
        const original = owner[name];
        owner[name] = function () {
          calls[label] = (calls[label] || 0) + 1;
          throw new Error(`Live export called ${label}`);
        };
        restore.push(() => { owner[name] = original; });
      };
      const originalCreate = document.createElement;
      document.createElement = function (...args: any[]) {
        if (String(args[0]).toLowerCase() === 'canvas') {
          calls['createElement(canvas)'] = (calls['createElement(canvas)'] || 0) + 1;
          throw new Error('Live export created a raster canvas');
        }
        return Reflect.apply(originalCreate, this, args);
      } as typeof document.createElement;
      restore.push(() => { document.createElement = originalCreate; });
      for (const method of ['getImageData', 'drawImage', 'stroke', 'fill', 'clearRect']) {
        block(CanvasRenderingContext2D.prototype, method, method);
      }
      for (const method of ['toDataURL', 'toBlob']) {
        block(HTMLCanvasElement.prototype, method, method);
      }
      block(win, 'OffscreenCanvas', 'OffscreenCanvas');
      block(win, 'CompressionStream', 'CompressionStream');
      block(win, 'btoa', 'btoa');
      try { return { value: fn(), calls }; }
      finally { for (const undo of restore.reverse()) undo(); }
    };
  });
  return { browser, page, errors };
}

async function open(page: Page, index: number): Promise<void> {
  await page.locator(`#pair-${index} .lia-canvas-launch`).click();
  await page.locator(`#pair-${index} canvas.lia-draw[data-ready="1"]`)
    .waitFor({ state: 'visible' });
  await settleFrames(page);
}

async function snapshot(page: Page, index = 0): Promise<any> {
  const result = await page.evaluate(index => {
    const win = window as any;
    return win.__withoutLiveRaster(() =>
      win.__LIA_CANVAS_OCR__.freeze.exportCanvasLiveStateByUID(`live-${index}`)
    );
  }, index);
  assert.deepEqual(result.calls, {}, 'live snapshots must never paint, read pixels or compress');
  assert.ok(result.value);
  return result.value;
}

async function activity(page: Page, index = 0): Promise<any> {
  return page.evaluate(index => (window as any).__LIA_CANVAS_OCR__.freeze
    .getCanvasLiveActivityByUID(`live-${index}`), index);
}

async function canvasPoint(page: Page, index = 0, x = 70, y = 70) {
  const box = await page.locator(`#pair-${index} canvas.lia-draw`).boundingBox();
  assert.ok(box);
  return { x: box.x + x, y: box.y + y };
}

async function stroke(page: Page, index = 0, x = 70, y = 70): Promise<void> {
  const point = await canvasPoint(page, index, x, y);
  await page.mouse.move(point.x, point.y);
  await page.mouse.down();
  await page.mouse.move(point.x + 70, point.y + 15, { steps: 10 });
  await page.mouse.up();
}

for (const browserType of projects) {
  test(`${browserType.name()}: live revisions cover drawing, erasing, history, view, resize and multiple canvases`,
    { timeout: 60_000 }, async t => {
      const { browser, page, errors } = await setup(browserType);
      t.diagnostic(`Browser: ${browserType.name()} ${browser.version()}`);
      try {
        await open(page, 0);
        await open(page, 1);
        const listed = await page.evaluate(() => {
          const win = window as any;
          const api = win.__LIA_CANVAS_OCR__.freeze;
          return win.__withoutLiveRaster(() => ({
            all: api.listCanvasLiveStateRevisions(document),
            subtree: api.listCanvasLiveStateRevisions(document.getElementById('root-0')),
            pair: api.listCanvasLiveStateRevisions(document.getElementById('pair-1')),
            missing: api.exportCanvasLiveStateByUID('does-not-exist'),
            missingActivity: api.getCanvasLiveActivityByUID('does-not-exist'),
          }));
        });
        assert.deepEqual(listed.calls, {});
        assert.deepEqual(listed.value.all.map((entry: any) => entry.uid).sort(), ['live-0', 'live-1']);
        assert.deepEqual(listed.value.subtree.map((entry: any) => entry.uid), ['live-0']);
        assert.deepEqual(listed.value.pair.map((entry: any) => entry.uid), ['live-1']);
        assert.equal(listed.value.missing, null);
        assert.equal(listed.value.missingActivity, null);
        let previous = await snapshot(page);
        const untouched = await snapshot(page, 1);
        assert.equal(previous.state.v, 'cvl1');
        assert.ok(Number.isSafeInteger(previous.revision));
        const changed = async (reason: string) => {
          const next = await snapshot(page);
          assert.ok(next.revision > previous.revision, `${reason} must advance revision`);
          assert.deepEqual(await snapshot(page, 1), untouched,
            `${reason} must leave the other canvas unchanged`);
          previous = next;
          return next.state;
        };
        const point = await canvasPoint(page);
        await page.mouse.move(point.x, point.y);
        await page.mouse.down();
        assert.equal((await activity(page)).active, true, 'pointerdown must synchronously expose activity');
        await changed('stroke start');
        await page.mouse.move(point.x + 40, point.y + 10, { steps: 4 });
        const partial = await changed('active stroke points');
        assert.ok(partial.ITEMS[0].points.length > 1);
        await page.evaluate(() => {
          const win = window as any;
          win.__firstStrokeSnapshot = win.__LIA_CANVAS_OCR__.freeze.exportCanvasLiveStateByUID('live-0');
          win.__firstStrokeJSON = JSON.stringify(win.__firstStrokeSnapshot);
        });
        await page.mouse.move(point.x + 90, point.y + 30, { steps: 4 });
        await page.mouse.up();
        assert.equal((await activity(page)).active, false);
        let state = await changed('stroke end');
        assert.ok(state.ITEMS[0].points.length > partial.ITEMS[0].points.length);
        assert.equal(await page.evaluate(() => {
          const win = window as any;
          return JSON.stringify(win.__firstStrokeSnapshot) === win.__firstStrokeJSON;
        }), true, 'continuing a stroke must never mutate a previously returned snapshot');
        await page.evaluate(() => {
          const win = window as any;
          win.__completedSnapshot = win.__LIA_CANVAS_OCR__.freeze.exportCanvasLiveStateByUID('live-0');
        });
        await page.locator('#pair-0 .lia-eraser-btn').click();
        await page.keyboard.press('Escape');
        await stroke(page);
        state = await changed('eraser');
        assert.equal(state.ITEMS.at(-1).tool, 'eraser');
        assert.equal(await page.evaluate(() => {
          const win = window as any;
          const next = win.__LIA_CANVAS_OCR__.freeze.exportCanvasLiveStateByUID('live-0');
          return next.state.ITEMS[0] === win.__completedSnapshot.state.ITEMS[0];
        }), true, 'unchanged completed strokes must be shared across snapshots');
        await page.locator('#pair-0 .lia-undo-btn').click();
        state = await changed('undo');
        assert.equal(state.ITEMS.length, 1);
        assert.equal(state.REDO.length, 1);
        assert.equal(state.REDO[0].tool, 'eraser');
        await page.locator('#pair-0 .lia-redo-btn').click();
        state = await changed('redo');
        assert.equal(state.ITEMS.length, 2);
        assert.equal(state.REDO.length, 0);
        const beforePan = state.VIEW;
        await page.mouse.move(point.x, point.y);
        await page.mouse.down({ button: 'right' });
        assert.equal((await activity(page)).active, true);
        await page.mouse.move(point.x + 40, point.y + 20, { steps: 3 });
        await page.mouse.up({ button: 'right' });
        assert.equal((await activity(page)).active, false);
        state = await changed('pan');
        assert.ok(Math.abs(state.VIEW.panX - beforePan.panX - 40) < 1);
        assert.ok(Math.abs(state.VIEW.panY - beforePan.panY - 20) < 1);
        const scale = state.VIEW.scale;
        await page.locator('#pair-0 canvas.lia-draw').dispatchEvent('wheel', {
          deltaY: -100, clientX: point.x, clientY: point.y,
        });
        state = await changed('zoom');
        assert.ok(state.VIEW.scale > scale);
        await page.locator('#pair-0 .lia-bgmenu-btn').click();
        await page.locator('#pair-0 [data-act="bg"][data-mode="grid"]').click();
        state = await changed('background');
        assert.equal(state.bgMode, 'grid');
        await page.locator('#pair-0 input[data-act="bgStep"]').evaluate((element: HTMLInputElement) => {
          element.value = '37';
          element.dispatchEvent(new Event('input', { bubbles: true }));
        });
        state = await changed('background spacing');
        assert.equal(state.bgStep, 37);
        await page.keyboard.press('Escape');
        const height = state.canvasH;
        const handle = page.locator('#pair-0 .lia-resize-corner[data-corner="br"]');
        const box = await handle.boundingBox();
        assert.ok(box);
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.down();
        assert.equal((await activity(page)).active, true, 'resize must expose activity from pointerdown');
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2 + 60, { steps: 3 });
        await page.mouse.up();
        await settleFrames(page);
        state = await changed('resize');
        assert.ok(state.canvasH > height);
        assert.equal((await activity(page)).active, false);
        // OCR selection is retained in world space, alongside all ink.
        await page.locator('#pair-0 .lia-rect-btn').click();
        await stroke(page, 0, 90, 110);
        state = await changed('OCR selection');
        assert.equal(state.ITEMS.at(-1).kind, 'rect');
        // This minimal fixture omits LiaScript layout CSS; the selection action
        // can overlap the toolbar. Activate its normal click handler directly.
        await page.locator('#pair-0 .lia-eraser-btn').dispatchEvent('click');
        await page.locator('#pair-0 [data-act="clear"]').click();
        state = await changed('clear');
        assert.deepEqual(state.ITEMS, []);
        assert.deepEqual(state.REDO, []);
        await page.waitForFunction(() => {
          const win = window as any;
          const revision = win.__LIA_CANVAS_OCR__.freeze.exportCanvasLiveStateByUID('live-0').revision;
          return win.__liveChanges.some((event: any) => event.uid === 'live-0' && event.revision === revision);
        });
        const events = await page.evaluate(() => ({
          changes: (window as any).__liveChanges,
          activities: (window as any).__liveActivities,
        }));
        for (const event of [...events.changes, ...events.activities]) {
          assert.ok(['live-0', 'live-1'].includes(event.uid));
          assert.ok(Number.isSafeInteger(event.revision), 'events must carry a usable uid/revision pair');
        }
        assert.ok(events.activities.some((event: any) => event.active === true));
        assert.ok(events.activities.some((event: any) => event.active === false));
        assert.deepEqual(errors, []);
      } finally { await browser.close(); }
    });

  test(`${browserType.name()}: 150 x 140 live geometry snapshots avoid raster work, reuse objects and restore losslessly`,
    { timeout: 60_000 }, async t => {
      const { browser, page, errors } = await setup(browserType, 1);
      try {
        await page.evaluate(() => {
          const items = Array.from({ length: 150 }, (_, i) => ({
            kind: 'path', tool: i % 13 === 0 ? 'eraser' : 'pen',
            color: '#123456', alpha: 0.65, width: 2.375,
            points: Array.from({ length: 140 }, (_, j) => ({
              // Include negative, off-viewport and non-rounded coordinates.
              x: -320.123456 + j * 13.125,
              y: -200.654321 + i * 8.25 + Math.sin(j / 7) * 12,
            })),
          }));
          const entry = {
            ITEMS: items, REDO: [{ ...items[1], points: [{ x: 9900.123456, y: -712.654321 }] }],
            VIEW: { panX: 123.456789, panY: -54.321987, scale: 1.125, minScale: 0.25, maxScale: 8 },
            bgMode: 'lined', bgStep: 31.25, wrapW: 700, canvasH: 350,
          };
          (window as any).__seedGeometry = JSON.stringify(entry.ITEMS);
          (window as any).__LIA_CANVAS_OCR__.store['live-0'] = entry;
        });
        await open(page, 0);
        const profile = await page.evaluate(() => {
          const win = window as any;
          const api = win.__LIA_CANVAS_OCR__.freeze;
          return win.__withoutLiveRaster(() => {
            const start = performance.now();
            const first = api.exportCanvasLiveStateByUID('live-0');
            const firstMs = performance.now() - start;
            const cachedMs: number[] = [];
            let reused = true;
            for (let i = 0; i < 100; i++) {
              const before = performance.now();
              const revisions = api.listCanvasLiveStateRevisions(document);
              const next = api.exportCanvasLiveStateByUID('live-0');
              cachedMs.push(performance.now() - before);
              reused = reused && next === first && revisions[0].revision === first.revision;
            }
            win.__largeSnapshot = first;
            win.__largeSnapshotJSON = JSON.stringify(first);
            return {
              firstMs, maxCachedMs: Math.max(...cachedMs),
              meanCachedMs: cachedMs.reduce((sum, ms) => sum + ms, 0) / cachedMs.length,
              reused, exactGeometry: JSON.stringify(first.state.ITEMS) === win.__seedGeometry,
              itemCount: first.state.ITEMS.length,
              pointCount: first.state.ITEMS.reduce((sum: number, item: any) => sum + item.points.length, 0),
              state: first.state,
            };
          });
        });
        assert.deepEqual(profile.calls, {});
        assert.equal(profile.value.reused, true, 'unchanged revisions must return the same snapshot object');
        assert.equal(profile.value.exactGeometry, true, 'all world points and their precision must survive export');
        assert.equal(profile.value.itemCount, 150);
        assert.equal(profile.value.pointCount, 21_000);
        t.diagnostic(`150 strokes / 21000 points: first=${profile.value.firstMs.toFixed(3)}ms; ` +
          `100 cached list+export calls: mean=${profile.value.meanCachedMs.toFixed(3)}ms, ` +
          `max=${profile.value.maxCachedMs.toFixed(3)}ms; raster/readback/compression calls=0`);
        await stroke(page);
        const afterDrawing = await snapshot(page);
        assert.equal(afterDrawing.state.ITEMS.length, 151);
        assert.ok(afterDrawing.revision > (await page.evaluate(() => (window as any).__largeSnapshot.revision)));
        assert.equal(await page.evaluate(() => {
          const win = window as any;
          const current = win.__LIA_CANVAS_OCR__.freeze.exportCanvasLiveStateByUID('live-0');
          return JSON.stringify(win.__largeSnapshot) === win.__largeSnapshotJSON &&
            win.__largeSnapshot.state.ITEMS.every((item: any, index: number) => item === current.state.ITEMS[index]);
        }), true, 'drawing must retain the old snapshot and share all 150 unchanged strokes');
        const restored = await page.evaluate(() => {
          const win = window as any;
          const state = JSON.parse(win.__largeSnapshotJSON).state;
          return win.__LIA_CANVAS_OCR__.freeze.restoreCanvasLiveStateByUID('live-0', state);
        });
        assert.equal(restored, true);
        await settleFrames(page);
        const roundTrip = await snapshot(page);
        assert.ok(roundTrip.revision > afterDrawing.revision, 'restore must invalidate previously saved revisions');
        assert.deepEqual(roundTrip.state, profile.value.state, 'JSON round-trip restores geometry, redo, view, background and dimensions');
        await stroke(page);
        assert.equal((await snapshot(page)).state.ITEMS.length, 151, 'restored canvas must remain editable');
        assert.equal(await page.evaluate(() => {
          const win = window as any;
          return JSON.stringify(win.__largeSnapshot) === win.__largeSnapshotJSON;
        }), true);
        assert.deepEqual(errors, []);
      } finally { await browser.close(); }
    });

  test(`${browserType.name()}: immediate final export includes an active last stroke and its pointerup endpoint`,
    { timeout: 60_000 }, async () => {
      const { browser, page, errors } = await setup(browserType, 1);
      try {
        await open(page, 0);
        const point = await canvasPoint(page);
        await page.mouse.move(point.x, point.y);
        await page.mouse.down();
        await page.mouse.move(point.x + 60, point.y + 30, { steps: 6 });
        const active = await snapshot(page);
        assert.equal((await activity(page)).active, true);
        assert.equal(active.state.ITEMS.length, 1);
        // No debounce timeout or extra frame before final submission.
        const finalWhileDrawing = await page.evaluate(() => {
          const api = (window as any).__LIA_CANVAS_OCR__.freeze;
          return api.exportAllCanvasFreezeStatesFromRoot(document)[0];
        });
        assert.equal(finalWhileDrawing.v, 'cvf1');
        assert.equal(finalWhileDrawing.it.length, 1);
        assert.equal(finalWhileDrawing.it[0].p.length, active.state.ITEMS[0].points.length);
        assert.ok(finalWhileDrawing.w > 50 && finalWhileDrawing.h > 20);
        // A final position delivered only on pointerup must be available to an
        // export in the very same task, before lia:canvas-change dispatches.
        const immediate = await page.evaluate(({ x, y }) => {
          const canvas = document.querySelector('canvas.lia-draw')!;
          canvas.dispatchEvent(new PointerEvent('pointerup', {
            bubbles: true, pointerId: 1, pointerType: 'mouse', button: 0,
            buttons: 0, clientX: x + 115, clientY: y + 45,
          }));
          const api = (window as any).__LIA_CANVAS_OCR__.freeze;
          return {
            live: api.exportCanvasLiveStateByUID('live-0'),
            submitted: api.exportAllCanvasFreezeStatesFromRoot(document)[0],
          };
        }, point);
        await page.mouse.up();
        assert.equal(immediate.live.state.ITEMS.length, 1);
        assert.deepEqual(immediate.live.state.ITEMS[0].points.at(-1), { x: 185, y: 115 });
        assert.ok(immediate.live.revision > active.revision);
        assert.equal(immediate.submitted.it[0].p.length, immediate.live.state.ITEMS[0].points.length);
        assert.ok(immediate.submitted.w > finalWhileDrawing.w + 40,
          'pixel-cropped submission must include the last pointerup endpoint');
        assert.equal((await activity(page)).active, false);
        // Rendering the final result destroys the live controller immediately,
        // including an in-progress stroke; Freeze must never see ghost activity.
        await page.mouse.move(point.x + 10, point.y + 60);
        await page.mouse.down();
        await page.mouse.move(point.x + 60, point.y + 75, { steps: 4 });
        const rendered = await page.evaluate(() => {
          const api = (window as any).__LIA_CANVAS_OCR__.freeze;
          const before = api.getCanvasLiveActivityByUID('live-0');
          const final = api.exportAllCanvasFreezeStatesFromRoot(document)[0];
          api.renderCanvasFreezeStateIntoMount(document.querySelector('.lia-canvas-mount'), final);
          return { before, after: api.getCanvasLiveActivityByUID('live-0'), itemCount: final.it.length };
        });
        assert.equal(rendered.before.active, true);
        assert.equal(rendered.after.active, false, 'final rendering must synchronously dispose the active live controller');
        assert.equal(rendered.itemCount, 2, 'final rendering must retain the active last stroke');
        await page.mouse.up();
        assert.deepEqual(errors, []);
      } finally { await browser.close(); }
    });

  test(`${browserType.name()}: live restore retains OCR review and editable draft with observable editor activity`,
    { timeout: 60_000 }, async () => {
      const { browser, page, errors } = await setup(browserType, 1);
      try {
        const restored = await page.evaluate(() => {
          const pair = document.getElementById('pair-0')!;
          pair.setAttribute('data-canvas-mode', 'plus');
          pair.setAttribute('data-canvas-output', 'answer');
          pair.setAttribute('data-line-feedback', 'true');
          pair.setAttribute('data-answer-format', 'native-equation-v1');
          const quiz = document.createElement('div');
          quiz.className = 'lia-quiz';
          const input = document.createElement('input');
          input.id = 'native-live-answer';
          input.className = 'lia-quiz__input';
          input.value = 'x=999';
          pair.before(quiz);
          quiz.append(input, pair);
          const win = window as any;
          win.__nativeRestoreEvents = [];
          for (const type of ['input', 'change']) {
            input.addEventListener(type, () => win.__nativeRestoreEvents.push(type));
          }
          for (const type of ['lia:canvasplus-answer', 'lia:canvasplus-render']) {
            pair.addEventListener(type, () => win.__nativeRestoreEvents.push(type));
          }
          const state = {
            v: 'cvl1', ITEMS: [], REDO: [],
            VIEW: { panX: 0, panY: 0, scale: 1, minScale: 0.25, maxScale: 8 },
            bgMode: 'grid', bgStep: 24, wrapW: 700, canvasH: 350,
            calculationReviewFreeze: {
              v: 'cr1', state: 'ready', lines: ['x=1', 'x=1'],
              checks: [{ status: 'valid', reason: 'equivalent-linear-equations' }],
            },
            ocr: { editableText: 'x=1\nx=1', stale: false },
            editorDraft: 'x=1\nx=2',
          };
          (window as any).__reviewSeed = state;
          return (window as any).__LIA_CANVAS_OCR__.freeze.restoreCanvasLiveStateByUID('live-0', state);
        });
        assert.equal(restored, true, 'a closed canvas must accept live restoration');
        const closed = await snapshot(page);
        assert.deepEqual(closed.state, await page.evaluate(() => (window as any).__reviewSeed));
        await open(page, 0);
        const editor = page.locator('#pair-0 .lia-canvasplus-inline-textarea');
        await editor.waitFor({ state: 'visible' });
        assert.equal(await editor.inputValue(), 'x=1\nx=2');
        assert.equal(await page.locator('#native-live-answer').inputValue(), 'x=999',
          'restoring a review must preserve the existing native answer');
        assert.deepEqual(await page.evaluate(() => (window as any).__nativeRestoreEvents), [],
          'restore must not emit native input or OCR submission/render events');
        assert.equal(await page.locator('#pair-0').getAttribute('data-native-check-pending'), null);
        assert.equal(await page.locator('.lia-quiz').evaluate(quiz =>
          quiz.classList.contains('lia-canvas-answer-pending-check')), false);
        assert.ok((await activity(page)).operations.includes('editor'), 'restored draft marks the editor active');
        const beforeEdit = await snapshot(page);
        assert.equal(beforeEdit.state.ocr.editableText, 'x=1\nx=1');
        assert.deepEqual(beforeEdit.state.calculationReviewFreeze.lines, ['x=1', 'x=1']);
        await page.evaluate(() => {
          const win = window as any;
          win.__reviewSnapshot = win.__LIA_CANVAS_OCR__.freeze.exportCanvasLiveStateByUID('live-0');
          win.__reviewSnapshotJSON = JSON.stringify(win.__reviewSnapshot);
        });
        await editor.fill('x=1\nx=3');
        const edited = await snapshot(page);
        assert.ok(edited.revision > beforeEdit.revision);
        assert.equal(edited.state.editorDraft, 'x=1\nx=3');
        assert.equal(edited.state.ocr.editableText, 'x=1\nx=1', 'draft does not replace committed OCR prematurely');
        assert.equal(await page.evaluate(() => {
          const win = window as any;
          return JSON.stringify(win.__reviewSnapshot) === win.__reviewSnapshotJSON;
        }), true, 'typing must not mutate a previous review snapshot');
        await page.locator('#pair-0 .lia-canvasplus-cancel').click();
        const cancelled = await snapshot(page);
        assert.ok(cancelled.revision > edited.revision);
        assert.equal(cancelled.state.editorDraft, undefined);
        assert.equal((await activity(page)).operations.includes('editor'), false);
        await page.locator('#pair-0 .lia-canvasplus-edit').click();
        assert.ok((await activity(page)).operations.includes('editor'));
        await editor.fill('x=1\nx=2');
        await page.locator('#pair-0 .lia-canvasplus-accept').click();
        const committed = await snapshot(page);
        assert.ok(committed.revision > cancelled.revision);
        assert.equal(committed.state.ocr.editableText, 'x=1\nx=2');
        assert.equal(committed.state.editorDraft, undefined);
        assert.equal((await activity(page)).operations.includes('editor'), false);
        // Verify the fixture really owns a native field: an explicit correction
        // still performs the normal submission transport and pending marking.
        assert.deepEqual(JSON.parse(await page.locator('#native-live-answer').inputValue()), ['x=1', 'x=2']);
        assert.ok((await page.evaluate(() => (window as any).__nativeRestoreEvents))
          .includes('lia:canvasplus-answer'));
        await settleFrames(page);
        const invalidRestore = await page.evaluate(() => {
          const api = (window as any).__LIA_CANVAS_OCR__.freeze;
          const before = api.exportCanvasLiveStateByUID('live-0');
          const canvas = document.querySelector('#pair-0 canvas.lia-draw');
          const invalid = JSON.parse(JSON.stringify(before.state));
          invalid.ocr = { ...invalid.ocr, writtenSubmission: { kind: 'bogus' } };
          const restored = api.restoreCanvasLiveStateByUID('live-0', invalid);
          return {
            restored,
            sameSnapshot: before === api.exportCanvasLiveStateByUID('live-0'),
            sameCanvas: canvas === document.querySelector('#pair-0 canvas.lia-draw'),
          };
        });
        assert.deepEqual(invalidRestore, { restored: false, sameSnapshot: true, sameCanvas: true },
          'invalid structured OCR must be rejected before altering the live state or controller');
        // Native answer fields may be hidden behind the math preview after a
        // submission. Model a later manual answer through their input protocol.
        await page.locator('#native-live-answer').evaluate((input: HTMLInputElement) => {
          input.value = 'x=777';
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
        });
        const staleRestored = await page.evaluate(state => {
          const win = window as any;
          const pair = document.getElementById('pair-0')!;
          pair.removeAttribute('data-native-check-pending');
          document.querySelector('.lia-quiz')!.classList.remove('lia-canvas-answer-pending-check');
          win.__nativeRestoreEvents = [];
          state.ocr = { ...state.ocr, stale: true };
          if (state.calculationReviewFreeze) state.calculationReviewFreeze.stale = 1;
          return win.__LIA_CANVAS_OCR__.freeze.restoreCanvasLiveStateByUID('live-0', state);
        }, committed.state);
        assert.equal(staleRestored, true);
        await settleFrames(page);
        assert.equal(await page.locator('#native-live-answer').inputValue(), 'x=777',
          'stale OCR restoration must not overwrite a newer manual answer');
        assert.deepEqual(await page.evaluate(() => (window as any).__nativeRestoreEvents), []);
        assert.equal(await page.locator('#pair-0').getAttribute('data-native-check-pending'), null);
        assert.equal(await page.locator('.lia-quiz').evaluate(quiz =>
          quiz.classList.contains('lia-canvas-answer-pending-check')), false);
        assert.equal((await snapshot(page)).state.ocr.stale, true);
        assert.deepEqual(errors, []);
      } finally { await browser.close(); }
    });

  test(`${browserType.name()}: pinch, cancellation, capture loss and hidden mounts preserve live state and release activity`,
    { timeout: 60_000 }, async () => {
      const { browser, page, errors } = await setup(browserType, 1);
      try {
        await open(page, 0);
        const result = await page.evaluate(() => {
          const win = window as any;
          const api = win.__LIA_CANVAS_OCR__.freeze;
          const canvas = document.querySelector('canvas.lia-draw') as HTMLCanvasElement;
          const box = canvas.getBoundingClientRect();
          const originalSet = canvas.setPointerCapture;
          const originalRelease = canvas.releasePointerCapture;
          // Synthetic contact IDs have no native OS pointer to capture.
          canvas.setPointerCapture = () => {};
          canvas.releasePointerCapture = () => {};
          const send = (type: string, pointerId: number, pointerType: string, x: number, y: number, button = 0) => {
            canvas.dispatchEvent(new PointerEvent(type, {
              bubbles: true, cancelable: true, pointerId, pointerType, button,
              buttons: type === 'pointerdown' || type === 'pointermove' ? 1 : 0,
              pressure: type === 'pointerdown' || type === 'pointermove' ? 0.5 : 0,
              clientX: box.x + x, clientY: box.y + y,
            }));
          };
          const live = () => win.__withoutLiveRaster(() => api.exportCanvasLiveStateByUID('live-0'));
          try {
            const initial = live();
            send('pointerdown', 101, 'touch', 100, 100);
            send('pointerdown', 102, 'touch', 200, 100);
            const pinchStart = { snapshot: live(), activity: api.getCanvasLiveActivityByUID('live-0') };
            send('pointermove', 102, 'touch', 250, 100);
            const pinchMoved = live();
            send('pointerdown', 103, 'touch', 175, 150);
            send('pointermove', 103, 'touch', 180, 155);
            const thirdTouch = { snapshot: live(), activity: api.getCanvasLiveActivityByUID('live-0') };
            send('pointerup', 103, 'touch', 180, 155);
            const thirdTouchEnded = api.getCanvasLiveActivityByUID('live-0');
            send('pointerup', 101, 'touch', 100, 100);
            send('pointerup', 102, 'touch', 250, 100);
            const pinchEnded = api.getCanvasLiveActivityByUID('live-0');
            send('pointerdown', 104, 'mouse', 100, 100, 2);
            const panStarted = api.getCanvasLiveActivityByUID('live-0');
            send('pointerdown', 105, 'touch', 200, 100);
            const panToPinch = api.getCanvasLiveActivityByUID('live-0');
            send('pointermove', 105, 'touch', 220, 100);
            send('pointerup', 104, 'mouse', 100, 100, 2);
            send('pointerup', 105, 'touch', 220, 100);
            const panPinchEnded = api.getCanvasLiveActivityByUID('live-0');
            send('pointerdown', 201, 'pen', 80, 80);
            send('pointermove', 201, 'pen', 120, 95);
            const beforeCancel = live();
            send('pointercancel', 201, 'pen', 120, 95);
            const cancelled = { snapshot: live(), activity: api.getCanvasLiveActivityByUID('live-0') };
            send('pointerdown', 202, 'pen', 90, 90);
            const tap = live();
            send('pointercancel', 202, 'pen', 90, 90);
            const cancelledTap = { snapshot: live(), activity: api.getCanvasLiveActivityByUID('live-0') };
            send('pointerdown', 203, 'pen', 100, 100);
            send('pointermove', 203, 'pen', 140, 115);
            send('lostpointercapture', 203, 'pen', 140, 115);
            const captureLost = { snapshot: live(), activity: api.getCanvasLiveActivityByUID('live-0') };
            send('pointerdown', 204, 'pen', 110, 110);
            send('pointermove', 204, 'pen', 150, 125);
            window.dispatchEvent(new Event('blur'));
            const blurred = { snapshot: live(), activity: api.getCanvasLiveActivityByUID('live-0') };
            return { initial, pinchStart, pinchMoved, thirdTouch, thirdTouchEnded, pinchEnded,
              panStarted, panToPinch, panPinchEnded, beforeCancel, cancelled, tap, cancelledTap, captureLost, blurred };
          } finally {
            canvas.setPointerCapture = originalSet;
            canvas.releasePointerCapture = originalRelease;
          }
        });
        for (const guarded of [result.initial, result.pinchStart.snapshot, result.pinchMoved, result.thirdTouch.snapshot,
          result.beforeCancel, result.cancelled.snapshot, result.tap, result.cancelledTap.snapshot,
          result.captureLost.snapshot, result.blurred.snapshot]) assert.deepEqual(guarded.calls, {});
        assert.equal(result.pinchStart.snapshot.value.state.ITEMS.length, 0, 'a pinch must not leave a touch dot');
        assert.ok(result.pinchStart.activity.operations.includes('pinch'));
        assert.ok(result.pinchMoved.value.revision > result.initial.value.revision);
        assert.ok(result.pinchMoved.value.state.VIEW.scale > result.initial.value.state.VIEW.scale);
        assert.equal(result.thirdTouch.snapshot.value.state.ITEMS.length, 0, 'a third touch must not start an accidental stroke');
        assert.deepEqual(result.thirdTouch.activity.operations, ['pinch']);
        assert.deepEqual(result.thirdTouchEnded.operations, ['pinch'], 'two remaining contacts still constitute a pinch');
        assert.equal(result.pinchEnded.active, false, 'ending all contacts must release pinch activity');
        assert.deepEqual(result.panStarted.operations, ['pan']);
        assert.deepEqual(result.panToPinch.operations, ['pinch'], 'entering pinch must release the previous pan operation');
        assert.equal(result.panPinchEnded.active, false);
        assert.equal(result.cancelled.snapshot.value.state.ITEMS.length, 1, 'cancellation retains a stroke that already contains ink');
        assert.ok(result.cancelled.snapshot.value.revision > result.beforeCancel.value.revision);
        assert.equal(result.cancelled.activity.active, false);
        assert.equal(result.tap.value.state.ITEMS.length, 2);
        assert.equal(result.cancelledTap.snapshot.value.state.ITEMS.length, 1, 'a cancelled tap is removed');
        assert.equal(result.cancelledTap.activity.active, false);
        assert.equal(result.captureLost.snapshot.value.state.ITEMS.length, 2);
        assert.equal(result.captureLost.activity.active, false);
        assert.equal(result.blurred.snapshot.value.state.ITEMS.length, 3);
        assert.equal(result.blurred.activity.active, false);
        const visible = await snapshot(page);
        await page.locator('#pair-0 .lia-canvas-mount').evaluate((mount: HTMLElement) => { mount.style.display = 'none'; });
        await settleFrames(page);
        const hidden = await snapshot(page);
        assert.equal(hidden.state.wrapW, visible.state.wrapW, 'a hidden mount retains the last visible width');
        assert.equal(hidden.state.canvasH, visible.state.canvasH, 'a hidden mount retains the last visible height');
        assert.ok(hidden.state.wrapW > 0 && hidden.state.canvasH > 0);
        await page.locator('#pair-0 .lia-canvas-mount').evaluate((mount: HTMLElement) => { mount.style.display = ''; });
        await settleFrames(page);
        assert.deepEqual((await snapshot(page)).state.ITEMS, visible.state.ITEMS);
        assert.deepEqual(errors, []);
      } finally { await browser.close(); }
    });

}
