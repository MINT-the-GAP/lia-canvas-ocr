import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { createExpectedColumnAdditionSubmission } from '../../src/math/column-arithmetic.ts';
import { createExpectedColumnSubtractionSubmission } from '../../src/math/column-subtraction.ts';
import { createExpectedColumnMultiplicationSubmission } from '../../src/math/column-multiplication.ts';
import { createExpectedColumnDivisionSubmission } from '../../src/math/column-division.ts';
import { chromium, type Browser, type Page, type Locator } from 'playwright';
import { createHarness, openCourse, SYNTHETIC_ORIGIN, TEMPLATE_URL, assertNoRuntimeErrors, snapshotDiagnostics, type BrowserHarness } from './support.mts';

const COURSE = SYNTHETIC_ORIGIN + '/courses/calculation-quiz-binding.md';
const DYNFLEX = 'https://raw.githubusercontent.com/MINT-the-GAP/lia-DynFlex/d91ae5c4445070b96f03b5438241ae9cfebc8817/';
const PAIR = 'main:visible .lia-canvas-pair[data-calculation-quiz]';
const PROMPT = 'f(x)=2*x^3-5*x^2+4*x-9';
const CORRECT = [PROMPT, "f'(x)=6*x^2-10*x+4"];
const WRONG = [PROMPT, "f'(x)=6*x^2-10*x+5"];
const originalMacro = [
  '@BerechneOCR: @BerechneOCR_(@uid,`@0`,`@1`)', '', '@BerechneOCR_',
  '[[ @1 ]]', "<script modify='false'>",
  "window.__LIA_CANVAS_OCR__?.checkCalculationAnswerByUID('@0') === true", '</script>',
].join('\n');

// Released d1f60eb structure: a hint without a trailing newline consumes the
// following validator as hint content. Preserve that observed parser failure.
const releasedOptionsMacro = [
  '@BerechneOCR: @BerechneOCR_(@uid,`@0`,`@1`,` `,` `)', '',
  '@BerechneOCRWithOptions: @BerechneOCR_(@uid,`@0`,`@1`,`@2`,```@3```)', '',
  '@BerechneOCR_', '<!-- data-calculation-quiz="@0" @3 -->',
  '[[ @1 ]]', '@4<script>',
  "window.__LIA_CANVAS_OCR__?.checkCalculationAnswerByUID('@0') === true", '</script>',
].join('\n');

async function openBinding(browser: Browser, slide: number,
  baseline: boolean | 'remove-annotation' | 'options-without-newline' = false,
  compatibilityOptions = false): Promise<BrowserHarness> {
  const harness = await createHarness(browser);
  try {
    let readme = await readFile(new URL('../../README.md', import.meta.url), 'utf8');
    if (baseline) {
      const implementation = readme.match(/@BerechneOCR_\r?\n([\s\S]*?)\r?\n@end/)?.[1];
      assert.ok(implementation);
      const canvas = implementation.match(/<span class='lia-canvas-pair'[\s\S]*<\/span>/)?.[0];
      assert.ok(canvas);
      readme = readme.replace(/@BerechneOCR:[\s\S]*?@BerechneOCR_\r?\n[\s\S]*?\r?\n@end/,
        (baseline === 'options-without-newline' ? releasedOptionsMacro + '\n' : originalMacro + '\n\n') + canvas + '\n@end');
    }
    let body = (await readFile(new URL('../fixtures/calculation-quiz-binding.md', import.meta.url), 'utf8')).replace(/\r\n/g, '\n');
    if (compatibilityOptions || baseline === 'options-without-newline') {
      body = body.replace(/<!-- ([^\n]+) -->\n@BerechneOCR\(([^\n]+)\)\n(\[\[\?\]\] [^\n]+)/g,
        (_, attributes, args, hint) => '@BerechneOCRWithOptions(' + args + ',`' + attributes + '`,```' + hint + '```)');
    }
    if (baseline === 'remove-annotation') body = body.slice(0, body.indexOf('-->') + 3) + '\n\n# Removal only\n\n@BerechneOCR(`f(x)=2*x^3-5*x^2+4*x-9`,`aufgabe=ableitung;ordnung=1;zeilenrueckmeldung=1`)\n[[?]] Wende die Potenzregel auf jeden Summanden einzeln an.\n';
    for (const [url, source] of [[TEMPLATE_URL, readme], [COURSE, body]]) {
      await harness.context.route(url, route => route.fulfill({ status: 200, body: source,
        contentType: 'text/plain; charset=utf-8', headers: { 'access-control-allow-origin': '*' } }));
    }
    // Optional pinned checkout for offline/restricted hosts; its unmodified runtime
    // must be the same revision as the fixture import, never a DynFlex substitute.
    if (process.env.LIA_DYNFLEX_DIR) for (const path of ['README.md', 'dist/index.js']) {
      const source = await readFile(process.env.LIA_DYNFLEX_DIR + '/' + path, 'utf8');
      await harness.context.route(DYNFLEX + path, route => route.fulfill({ status: 200, body: source,
        contentType: path.endsWith('.js') ? 'application/javascript' : 'text/plain',
        headers: { 'access-control-allow-origin': '*' } }));
    }
    const page = harness.page; page.setDefaultTimeout(8_000);
    await openCourse(harness, COURSE, 'main:visible .lia-quiz');
    if (slide !== 1) {
      await page.evaluate(slide => { location.hash = '#' + slide; }, slide);
      await page.waitForFunction(slide => document.querySelector('main:not([hidden]) header')?.textContent?.includes(({ 2: 'Annotated', 3: 'Legacy', 4: 'Written', 5: 'Actual', 6: 'Explicit', 7: 'Screenshot' } as Record<number, string>)[slide]), slide);
    }
    await page.waitForTimeout(400);
    await page.evaluate(() => {
      const registry = (window as any).__LIA_CANVAS_OCR__;
      let check = registry.checkCalculationAnswerByUID;
      (window as any).__bindingCalls = [];
      const observedCheck = function(uid: string) {
        const result = check.call(this, uid);
        (window as any).__bindingCalls.push({ uid, result });
        return result;
      };
      // Canvas initAll republishes the public function after opening a canvas.
      // Observe each original implementation without binding or replacing a quiz.
      Object.defineProperty(registry, 'checkCalculationAnswerByUID', {
        configurable: true, get: () => observedCheck, set: implementation => { check = implementation; },
      });
    });
    await page.waitForFunction(() => typeof (window as any).Algebrite?.run === 'function');
    return harness;
  } catch (error) { await harness.context.close(); throw error; }
}

async function closeBinding(harness: BrowserHarness) {
  try {
    assertNoRuntimeErrors(harness, await snapshotDiagnostics(harness.page));
    assert.deepEqual(harness.requestFailures, []);
  } finally { await harness.context.close(); }
}

function quiz(page: Page, index: number): Locator { return page.locator('.lia-quiz:visible').nth(index); }
function field(page: Page, index: number): Locator { return page.locator('main:visible .lia-quiz__input').nth(index); }
async function nativeCheck(page: Page, index: number, lines: string[] | string, success: boolean, expectedCalls = 1) {
  const target = quiz(page, index);
  const before = await page.evaluate(() => (window as any).__bindingCalls.length);
  const input = field(page, index);
  if (!await input.isVisible()) await input.locator('xpath=following-sibling::span[contains(@class, "lia-tex-preview")]').dispatchEvent('click');
  await input.fill(typeof lines === 'string' ? lines : JSON.stringify(lines));
  // Let LiaScript replace its answer/feedback subtree after the edit before
  // focusing and activating the genuine native Check button.
  await page.waitForTimeout(100);
  await target.locator('button.lia-quiz__check').press('Enter');
  if (expectedCalls) await page.waitForFunction(before => (window as any).__bindingCalls.length > before, before);
  await page.waitForFunction(({ index, success }) => {
    const target = Array.from(document.querySelectorAll<HTMLElement>('.lia-quiz')).filter(node => node.offsetWidth && node.offsetHeight)[index];
    return target?.classList.contains(success ? 'solved' : 'open') &&
      Boolean(target.querySelector(success ? '.lia-quiz__feedback.text-success' : '.lia-quiz__feedback.text-error'));
  }, { index, success });
  const calls = await page.evaluate(before => (window as any).__bindingCalls.slice(before), before);
  assert.equal(calls.length, expectedCalls, 'only the clicked native quiz must call its validator');
  if (expectedCalls) {
    assert.equal(calls[0].uid, await page.locator(PAIR).nth(index).getAttribute('data-calculation-quiz'));
    assert.equal(calls[0].result, success);
  }
}

async function noBooleanOutput(page: Page) {
  assert.doesNotMatch(await page.locator('main:visible').innerText(), /\b(?:false|true)\b/, 'a validator must never run as visible script output');
}

test('native LiaScript calculation quiz binding with external annotations, hints and multiple DynFlex canvases', { timeout: 480_000 }, async t => {
  const browser = await chromium.launch({ headless: true });
  t.diagnostic('Chromium ' + browser.version() + '; real LiaScript stable interpreter; pinned DynFlex d91ae5c4445070b96f03b5438241ae9cfebc8817');
  try {
    await t.test('reproduce external annotation failure with the original macro and real Check', async () => {
      const h = await openBinding(browser, 1, true);
      try {
        assert.match(await h.page.locator('main:visible').innerText(), /\bfalse\b/);
        assert.equal(await h.page.locator('main:visible .dynFlex .flex-child').count(), 2);
        await nativeCheck(h.page, 0, CORRECT, false, 0);
        await nativeCheck(h.page, 0, PROMPT, true, 0);
      } finally { await closeBinding(h); }
    });
    await t.test('removing only the annotation binds grading but loses the external hint', async () => {
      const h = await openBinding(browser, 1, 'remove-annotation');
      try {
        await noBooleanOutput(h.page);
        assert.equal(await quiz(h.page, 0).locator('.lia-quiz__hints').count(), 0);
        await nativeCheck(h.page, 0, WRONG, false);
        await nativeCheck(h.page, 0, CORRECT, true);
      } finally { await closeBinding(h); }
    });
    await t.test('simple external annotation and hints bind each adjacent native derivative quiz', async () => {
      const h = await openBinding(browser, 2);
      try {
        await noBooleanOutput(h.page);
        assert.equal(await h.page.locator(PAIR).count(), 2);
        if (await h.page.locator('main:visible .dynFlex').count()) {
          assert.equal(await h.page.locator('main:visible .flex-child[data-dynflex-blockified="1"]').count(), 2);
          assert.equal(await h.page.locator('main:visible .dynFlexResizer').count(), 2);
        }
        for (const index of [0, 1]) {
          const pair = h.page.locator(PAIR).nth(index);
          const uid = await pair.getAttribute('data-calculation-quiz');
          assert.ok(uid);
          assert.equal(await field(h.page, index).count(), 1);
          assert.equal(await pair.locator('.lia-canvas-anchor').getAttribute('data-seed'), uid);
          assert.equal(await pair.locator('.lia-canvas-mount').getAttribute('data-uid'), uid);
        }
        await nativeCheck(h.page, 0, WRONG, false);
        assert.equal(await quiz(h.page, 1).locator('.lia-quiz__feedback').count(), 0);
        assert.equal(await h.page.locator('main:visible .lia-quiz__input').nth(1).inputValue(), '');
        await nativeCheck(h.page, 0, [PROMPT], false);
        await nativeCheck(h.page, 0, CORRECT, true);
        await nativeCheck(h.page, 1, ['f(x)=x^2', "f'(x)=2*x"], true);
      } finally { await closeBinding(h); }
    });
    await t.test('all four legacy signatures retain native grading', async () => {
      const h = await openBinding(browser, 3);
      try {
        await noBooleanOutput(h.page);
        assert.equal(await h.page.locator(PAIR).count(), 4);
        assert.equal(await h.page.locator(PAIR).nth(1).getAttribute('data-line-feedback'), '1');
        assert.equal(await h.page.locator(PAIR).nth(2).getAttribute('data-line-feedback'), '0');
        for (let index = 0; index < 3; index++) {
          await nativeCheck(h.page, index, ['2x+3=7', 'x=3'], false);
          await nativeCheck(h.page, index, ['2x+3=7', '2x=4', 'x=2'], true);
        }
        await nativeCheck(h.page, 3, [PROMPT], false);
        await nativeCheck(h.page, 3, CORRECT, true);
      } finally { await closeBinding(h); }
    });
    await t.test('native hint thresholds and solution reveal stay with their own DynFlex quiz', async () => {
      const h = await openBinding(browser, 2);
      try {
        const page = h.page, left = quiz(page, 0), right = quiz(page, 1);
        assert.equal(await left.getAttribute('data-hint-button'), '1');
        assert.equal(await left.getAttribute('data-solution-button'), '3');
        assert.equal(await right.getAttribute('data-hint-button'), '2');
        assert.equal(await right.getAttribute('data-solution-button'), '2');
        assert.equal(await left.locator('.lia-quiz__resolve').isVisible(), false);
        await nativeCheck(page, 0, WRONG, false);

        await left.locator('.lia-quiz__hint').press('Enter');
        await left.locator('.lia-quiz__hints li').waitFor();
        assert.match(await left.locator('.lia-quiz__hints').innerText(), /Wende die Potenzregel/);
        assert.doesNotMatch(await right.innerText(), /Wende die Potenzregel/);
        assert.equal(await right.locator('.lia-quiz__hint:visible').count(), 0);
        await nativeCheck(page, 0, [PROMPT], false);
        assert.equal(await left.locator('.lia-quiz__resolve').isVisible(), false);
        await nativeCheck(page, 0, WRONG, false);
        assert.equal(await left.locator('.lia-quiz__resolve').isVisible(), true);
        await left.locator('.lia-quiz__resolve').press('Enter');
        await page.waitForFunction(() => document.querySelector('main:not([hidden]) .lia-quiz')?.classList.contains('resolved'));
        await page.waitForFunction(() => {
          const field = document.querySelector<HTMLInputElement>('main:not([hidden]) .lia-quiz__input');
          try { return JSON.parse(field?.value || 'null')?.some((line: string) => line.includes("f'")); } catch { return false; }
        });
        const solution = JSON.parse(await field(page, 0).inputValue());
        assert.ok(solution.length > 1, 'native resolve must generate the complete derivative');
        assert.equal(await page.evaluate(({prompt, solution}) => (window as any).__LIA_CANVAS_OCR__.validateCalculationSubmission(prompt, solution, {calculationContext: {task: 'derivative'}}).accepted, {prompt: PROMPT, solution}), true);
        assert.equal(await field(page, 1).inputValue(), '');
        assert.match(await right.getAttribute('class') || '', /\bopen\b/);
        await nativeCheck(page, 1, ['f(x)=x^2', "f'(x)=3*x"], false);
        await nativeCheck(page, 1, ['f(x)=x^2'], false);
        await right.locator('.lia-quiz__hint').press('Enter');
        await right.locator('.lia-quiz__hints li').first().waitFor();
        await right.locator('.lia-quiz__hint').press('Enter');
        await right.locator('.lia-quiz__hints li').nth(1).waitFor();
        assert.match(await right.locator('.lia-quiz__hints').innerText(), /Rechts: Leite x\^2/);
        assert.match(await right.locator('.lia-quiz__hints').innerText(), /Exponent wird zum Faktor/);
        assert.equal(await right.locator('.lia-quiz__hints code').count(), 1);
      } finally { await closeBinding(h); }
    });
    await t.test('four written arithmetic procedures grade through native Check', async () => {
      const h = await openBinding(browser, 4);
      try {
        await noBooleanOutput(h.page);
        const submissions = [createExpectedColumnAdditionSubmission('4728+3596'),
          createExpectedColumnSubtractionSubmission('9002-3487'),
          createExpectedColumnMultiplicationSubmission('738*6'),
          createExpectedColumnDivisionSubmission('8736:8')];
        for (const [index, submission] of submissions.entries()) {
          assert.ok(submission);
          const wrong = { ...submission, ...('quotient' in submission ? { quotient: '1093' } : { result: '9999' }) };
          await nativeCheck(h.page, index, JSON.stringify(wrong), false);
          await nativeCheck(h.page, index, JSON.stringify(submission), true);
        }
      } finally { await closeBinding(h); }
    });
    await t.test('blank calculation options and ordinary external hints remain valid native quizzes', async () => {
      const h = await openBinding(browser, 6);
      try {
        await noBooleanOutput(h.page);
        assert.equal(await h.page.locator(PAIR).count(), 2);
        if (await h.page.locator('main:visible .dynFlex').count()) {
          assert.equal(await h.page.locator('main:visible .flex-child[data-dynflex-blockified="1"]').count(), 2);
          assert.equal(await h.page.locator('main:visible .dynFlexResizer').count(), 2);
        }
        for (const index of [0, 1]) {
          await nativeCheck(h.page, index, ['2x+3=7', 'x=3'], false);
          if (index === 1) {
            await quiz(h.page, index).locator('.lia-quiz__hint').press('Enter');
            await quiz(h.page, index).locator('.lia-quiz__hints li').waitFor();
            assert.equal(await quiz(h.page, index).locator('.lia-quiz__hints').innerText(), 'Erst 3 subtrahieren, dann durch 2 dividieren.');
            assert.equal(await quiz(h.page, index).locator('.lia-quiz__hints code').count(), 2);
          }
          await nativeCheck(h.page, index, ['2x+3=7', '2x=4', 'x=2'], true);
        }
      } finally { await closeBinding(h); }
    });
    await t.test('simple syntax correction editor, row feedback and Freeze retain the complete path', async () => {
      const h = await openBinding(browser, 2);
      try {
        const page = h.page, pair = page.locator(PAIR).first();
        await page.evaluate(() => {
          const registry = (window as any).__LIA_CANVAS_OCR__;
          (window as any).__bindingOcrCalls = 0;
          (window as any).__bindingAnalyses = [];
          document.querySelector('main:not([hidden]) .lia-canvas-pair')!.addEventListener('lia:canvasplus-analysis', event => {
            (window as any).__bindingAnalyses.push((event as CustomEvent).detail);
          });
          const ocr = { model: 'binding-test-seed', cacheKey: 'binding-test-seed', precision: 'fp32',
            task: 'image-to-text', outputKind: 'latex', inputProfile: 'formulanet-line-384',
            calculationSinglePass: true, ensureLoaded: async () => true,
            recognize: async () => { (window as any).__bindingOcrCalls++; return '0=0'; } };
          registry.ocr = ocr; registry.canvasPlusOcr = ocr;
        });
        await pair.locator('.lia-canvas-launch').click();
        const canvas = pair.locator('canvas.lia-draw');
        await canvas.scrollIntoViewIfNeeded();
        const box = await canvas.boundingBox(); assert.ok(box);
        await page.mouse.move(box.x + box.width * 0.3, box.y + box.height * 0.3);
        await page.mouse.down();
        await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.42, { steps: 8 });
        await page.mouse.up();
        await pair.locator('.lia-canvasplus-submit').click();
        const output = pair.locator('.lia-canvasplus-output[data-state=ready]');
        await output.waitFor();
        if (!await output.evaluate(node => (node as HTMLDetailsElement).open)) await output.locator(':scope > summary').click();
        await output.locator('.lia-canvasplus-edit').click();
        await output.locator('.lia-canvasplus-inline-textarea').fill(CORRECT.join('\n'));
        await output.locator('.lia-canvasplus-accept').click();
        await pair.locator('.lia-canvasplus-output[data-result-source=correction][data-analysis-state=ready]').waitFor();
        assert.deepEqual(JSON.parse(await field(page, 0).inputValue()), CORRECT);
        const checks = await page.evaluate(() => (window as any).__bindingAnalyses.at(-1).checks);
        assert.ok(checks.length > 0 && checks.every((check: any) => check.status === 'valid'));
        assert.equal(await output.locator('.lia-canvasplus-transition').count(), checks.length);
        await nativeCheck(page, 0, CORRECT, true);
        assert.equal(await field(page, 1).inputValue(), '');
        const state = await pair.evaluate(node => (window as any).__LIA_CANVAS_OCR__.freeze.exportCanvasFreezeStateFromPair(node));
        assert.equal(state.cr.v, 'cr1');
        assert.deepEqual(state.cr.lines, CORRECT);
        assert.deepEqual(state.cr.checks.map((check: any) => check.status), checks.map((check: any) => check.status));
        await pair.evaluate((node, state) => {
          document.body.classList.add('lia-course-frozen', 'lia-snapshot-mode', 'lia-shared-freeze-link');
          if (!(window as any).__LIA_CANVAS_OCR__.freeze.renderCanvasFreezeStateIntoPair(node, state)) throw new Error('Freeze restore failed');
        }, state);
        await pair.locator('.lia-canvas-freeze-calculation-review[data-freeze-static]').waitFor();
        assert.equal(await page.evaluate(() => (window as any).__bindingOcrCalls), 1);
        assert.deepEqual(h.modelRequests, []);
      } finally { await closeBinding(h); }
    });
    await t.test('released WithOptions same-line hints steal the validator and expose false on hint reveal', async () => {
      const h = await openBinding(browser, 7, 'options-without-newline');
      try {
        assert.equal(await h.page.locator('main:visible .lia-quiz').count(), 2);
        await nativeCheck(h.page, 0, ['f(x)=x^4-3*x^3+2*x^2-x+1', "f'(x)=4*x^3-9*x^2+4*x-1", "f''(x)=12*x^2-18*x+4"], false, 0);
        await nativeCheck(h.page, 0, ['f(x)=x^4-3*x^3+2*x^2-x+1'], false, 0);
        await quiz(h.page, 0).locator('.lia-quiz__hint').press('Enter');
        await quiz(h.page, 0).locator('.lia-quiz__hints li').waitFor();
        assert.match(await quiz(h.page, 0).locator('.lia-quiz__hints').innerText(), /\bfalse\b/,
          'the swallowed script output becomes visible when the native hint is opened');
      } finally { await closeBinding(h); }
    });
    await t.test('previous WithOptions screenshot calls also work with same-line hint arguments', async () => {
      const h = await openBinding(browser, 7, false, true);
      try {
        await noBooleanOutput(h.page);
        assert.equal(await h.page.locator('main:visible .lia-canvas-launch:visible').count(), 2);
        for (const index of [0, 1]) {
          await h.page.locator(PAIR).nth(index).locator('.lia-canvas-launch').click();
          await h.page.locator(PAIR).nth(index).locator('canvas.lia-draw').waitFor({ state: 'visible' });
        }
        assert.equal(await h.page.locator('main:visible canvas.lia-draw:visible').count(), 2);
        await nativeCheck(h.page, 0, ['f(x)=x^4-3*x^3+2*x^2-x+1'], false);
        await quiz(h.page, 0).locator('.lia-quiz__hint').press('Enter');
        await quiz(h.page, 0).locator('.lia-quiz__hints li').waitFor();
        assert.match(await quiz(h.page, 0).locator('.lia-quiz__hints').innerText(), /Bilde zuerst/);
        await nativeCheck(h.page, 0, ['f(x)=x^4-3*x^3+2*x^2-x+1', "f'(x)=4*x^3-9*x^2+4*x-1", "f''(x)=12*x^2-18*x+4"], true);
        await nativeCheck(h.page, 1, ['g(x)=1/2*x^4-2*x^3+x^2', "g'(x)=2*x^3-6*x^2+2*x", "g''(x)=6*x^2-12*x+2", "g'''(x)=12*x-12"], true);
      } finally { await closeBinding(h); }
    });
    await t.test('screenshot case keeps second and third derivative canvases open and independent in DynFlex', async () => {
      const h = await openBinding(browser, 7);
      try {
        const page = h.page;
        await page.setViewportSize({ width: 1920, height: 1400 });
        await noBooleanOutput(page);
        const pairs = page.locator(PAIR);
        assert.equal(await pairs.count(), 2);
        assert.equal(await page.locator('main:visible .dynFlex .flex-child').count(), 2);
        assert.equal(await page.locator('main:visible .lia-canvas-launch:visible').count(), 2,
          'each authored macro must render a visible canvas launcher');
        const uids = await pairs.evaluateAll(nodes => nodes.map(node => node.getAttribute('data-calculation-quiz')));
        assert.equal(new Set(uids).size, 2, 'adjacent macros must have different UIDs');
        for (const index of [0, 1]) {
          await pairs.nth(index).locator('.lia-canvas-launch').click();
          await pairs.nth(index).locator('canvas.lia-draw[data-ready="1"]').waitFor({ state: 'visible' });
        }
        assert.equal(await page.locator('main:visible canvas.lia-draw:visible').count(), 2,
          'opening the second canvas must leave the first one open');
        const items = async (index: number) => pairs.nth(index).evaluate(node => {
          const uid = node.getAttribute('data-calculation-quiz');
          const snapshot = (window as any).__LIA_CANVAS_OCR__.freeze.exportCanvasLiveStateByUID(uid);
          return snapshot?.state.ITEMS;
        });
        const draw = async (index: number, y: number) => {
          const canvas = pairs.nth(index).locator('canvas.lia-draw');
          await canvas.scrollIntoViewIfNeeded();
          const box = await canvas.boundingBox(); assert.ok(box);
          await page.mouse.move(box.x + box.width * 0.2, box.y + box.height * y);
          await page.mouse.down();
          await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * (y + 0.08), { steps: 8 });
          await page.mouse.up();
        };
        await draw(0, 0.2);
        const leftDrawing = await items(0);
        assert.equal(leftDrawing.length, 1);
        assert.equal((await items(1)).length, 0);
        await draw(1, 0.4);
        const rightDrawing = await items(1);
        assert.equal(rightDrawing.length, 1);
        assert.deepEqual(await items(0), leftDrawing, 'drawing on the right must preserve the left drawing');
        assert.notDeepEqual(rightDrawing, leftDrawing);
        await pairs.nth(0).locator('.lia-canvas-launch').click();
        assert.equal(await pairs.nth(1).locator('canvas.lia-draw').isVisible(), true);
        await pairs.nth(0).locator('.lia-canvas-launch').click();
        await pairs.nth(0).locator('canvas.lia-draw').waitFor({ state: 'visible' });
        assert.deepEqual(await items(0), leftDrawing, 'reopening the left canvas must preserve its own drawing');
        assert.deepEqual(await items(1), rightDrawing);

        const solutions = [
          ['f(x)=x^4-3*x^3+2*x^2-x+1', "f'(x)=4*x^3-9*x^2+4*x-1", "f''(x)=12*x^2-18*x+4"],
          ['g(x)=1/2*x^4-2*x^3+x^2', "g'(x)=2*x^3-6*x^2+2*x", "g''(x)=6*x^2-12*x+2", "g'''(x)=12*x-12"],
        ];
        for (const [index, solution] of solutions.entries()) {
          await nativeCheck(page, index, [...solution.slice(0, -1), index ? "g'''(x)=12*x-11" : "f''(x)=12*x^2-18*x+5"], false);
          await quiz(page, index).locator('.lia-quiz__hint').press('Enter');
          await quiz(page, index).locator('.lia-quiz__hints li').waitFor();
          assert.match(await quiz(page, index).locator('.lia-quiz__hints').innerText(), index ? /Leite dreimal/ : /Bilde zuerst/);
          await nativeCheck(page, index, [solution[0]], false);
          await nativeCheck(page, index, solution.slice(0, -1), false);
          await nativeCheck(page, index, solution, true);
          if (index === 0) {
            assert.equal(await field(page, 1).inputValue(), '');
            assert.equal(await quiz(page, 1).locator('.lia-quiz__feedback').count(), 0);
          }
        }
        assert.equal(await page.locator('main:visible canvas.lia-draw:visible').count(), 2);
        assert.deepEqual(await items(0), leftDrawing, 'native quiz rerenders must retain the left drawing');
        assert.deepEqual(await items(1), rightDrawing, 'native quiz rerenders must retain the right drawing');
        await noBooleanOutput(page);
        if (process.env.LIA_BINDING_SCREENSHOT) await page.screenshot({ path: process.env.LIA_BINDING_SCREENSHOT, fullPage: true });
      } finally { await closeBinding(h); }
    });
    await t.test('inspect the actual LiaScript macro expansion', async () => {
      const h = await openBinding(browser, 5);
      try {
        const dumps = h.page.locator('main:visible pre');
        assert.equal(await dumps.count(), 4);
        assert.match(await dumps.nth(0).innerText(), /@-@BerechneOCR_\(@-@uid/);
        for (const [index, uid] of [[2, 'expanded-binding'], [3, 'expanded-empty']] as const) {
          // LiaScript's debug view escapes punctuation but the browser still
          // reparses the embedded button and splits its code element. Inspect
          // the complete pre element to retain the final validator and canvas UID.
          const source = (await dumps.nth(index).innerHTML()).replace(/<\/?code[^>]*>/g, '')
            .replace(/<br id=['"]ls['"]>/g, '\n').replace(/\\([`*^+\[\]<>])/g, '$1');
          assert.match(source, /^\[\[ /);
          assert.doesNotMatch(source, /@[0-4]/);
          const answerAt = source.indexOf('[[ '), scriptAt = source.indexOf('<script>');
          const canvasAt = source.indexOf('class="lia-canvas-pair"');
          assert.ok(answerAt === 0 && canvasAt > answerAt && scriptAt > canvasAt, source);
          assert.ok(source.indexOf('</script>') > scriptAt, source);
          assert.doesNotMatch(source.slice(scriptAt), /lia-canvas-pair|\[\[ /);
          assert.doesNotMatch(source.slice(0, canvasAt), /\n\s*\n/);
          assert.doesNotMatch(source, /<!--|\[\[\?\]\]/);
          assert.ok(source.includes("checkCalculationAnswerByUID('" + uid + "')"));
          assert.ok(source.includes('data-uid="' + uid + '"'));
          assert.ok(source.includes('data-seed="' + uid + '"'));
          assert.doesNotMatch(source, /<script\s+[^>]/);
        }
      }
      finally { await closeBinding(h); }
    });
  } finally { await browser.close(); }
});
