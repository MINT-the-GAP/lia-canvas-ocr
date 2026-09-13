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

async function openBinding(browser: Browser, slide: number, baseline: boolean | 'remove-annotation' = false): Promise<BrowserHarness> {
  const harness = await createHarness(browser);
  try {
    let readme = await readFile(new URL('../../README.md', import.meta.url), 'utf8');
    if (baseline) readme = readme.replace(/@BerechneOCR:[\s\S]*?<\/script>/, originalMacro);
    let body = (await readFile(new URL('../fixtures/calculation-quiz-binding.md', import.meta.url), 'utf8')).replace(/\r\n/g, '\n');
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
    await openCourse(harness, COURSE, PAIR);
    if (slide !== 1) {
      await page.evaluate(slide => { location.hash = '#' + slide; }, slide);
      await page.waitForFunction(slide => document.querySelector('main:not([hidden]) header')?.textContent?.includes(slide === 2 ? 'Migrated' : slide === 3 ? 'Legacy' : slide === 4 ? 'Written' : slide === 5 ? 'Actual' : 'Explicit'), slide);
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
async function nativeCheck(page: Page, index: number, lines: string[] | string, success: boolean, expectedCalls = 1) {
  const target = quiz(page, index);
  const before = await page.evaluate(() => (window as any).__bindingCalls.length);
  const field = page.locator('main:visible .lia-quiz__input').nth(index);
  if (!await field.isVisible()) await field.locator('xpath=following-sibling::span[contains(@class, "lia-tex-preview")]').dispatchEvent('click');
  await field.fill(typeof lines === 'string' ? lines : JSON.stringify(lines));
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

test('native LiaScript calculation quiz binding, DynFlex, author options and legacy calls', { timeout: 480_000 }, async t => {
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
    await t.test('correct migrated derivative binds hints and solution to each native quiz', async () => {
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
          assert.equal(await quiz(h.page, index).getAttribute('data-calculation-quiz'), uid);
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
        const solution = JSON.parse(await left.locator('.lia-quiz__input').inputValue());
        assert.ok(solution.length > 1, 'native resolve must generate the complete derivative');
        assert.equal(await page.evaluate(({prompt, solution}) => (window as any).__LIA_CANVAS_OCR__.validateCalculationSubmission(prompt, solution, {calculationContext: {task: 'derivative'}}).accepted, {prompt: PROMPT, solution}), true);
        assert.equal(await right.locator('.lia-quiz__input').inputValue(), '');
        assert.equal(await right.getAttribute('class'), 'lia-quiz lia-quiz-text open');
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
    await t.test('explicit blank options and hint arguments remain valid native quizzes', async () => {
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
    await t.test('WithOptions correction editor, row feedback and Freeze retain the complete path', async () => {
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
        assert.deepEqual(JSON.parse(await quiz(page, 0).locator('.lia-quiz__input').inputValue()), CORRECT);
        const checks = await page.evaluate(() => (window as any).__bindingAnalyses.at(-1).checks);
        assert.ok(checks.length > 0 && checks.every((check: any) => check.status === 'valid'));
        assert.equal(await output.locator('.lia-canvasplus-transition').count(), checks.length);
        await nativeCheck(page, 0, CORRECT, true);
        assert.equal(await quiz(page, 1).locator('.lia-quiz__input').inputValue(), '');
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
    await t.test('inspect the actual LiaScript macro expansion', async () => {
      const h = await openBinding(browser, 5);
      try {
        const dumps = h.page.locator('main:visible pre > code');
        assert.equal(await dumps.count(), 4);
        assert.match(await dumps.nth(0).innerText(), /@-@BerechneOCR_\(@-@uid/);
        for (const [index, uid, hasHints] of [[2, 'expanded-binding', true], [3, 'expanded-empty', false]] as const) {
          // LiaScript's debug view escapes Markdown punctuation and wraps source
          // newlines in <br>. HTML comments swallow that view's textContent, so
          // inspect its actual source DOM rather than the rendered text alone.
          const source = (await dumps.nth(index).innerHTML())
            .replace(/<br id=['"]ls['"]>/g, '\n').replace(/\\([`*^+\[\]<>])/g, '$1');
          assert.match(source, new RegExp('^<!-- data-calculation-quiz="' + uid + '"'));
          assert.doesNotMatch(source, /@[0-4]/);
          const answerAt = source.indexOf('[[ '), scriptAt = source.indexOf('<script>');
          const canvasAt = source.indexOf("<span class='lia-canvas-pair'");
          assert.ok(answerAt > 0 && scriptAt > answerAt && canvasAt > scriptAt);
          if (hasHints) assert.ok(source.indexOf('[[?]]') > answerAt && source.indexOf('[[?]]') < scriptAt);
          else assert.match(source, /\[\[ 2x\+3=7 \]\]\n <script>/);
          assert.ok(source.includes("checkCalculationAnswerByUID('" + uid + "')"));
          assert.ok(source.includes("data-uid='" + uid + "'"));
          assert.ok(source.includes("data-seed='" + uid + "'"));
          assert.doesNotMatch(source, /<script\s+[^>]/);
        }
      }
      finally { await closeBinding(h); }
    });
  } finally { await browser.close(); }
});
