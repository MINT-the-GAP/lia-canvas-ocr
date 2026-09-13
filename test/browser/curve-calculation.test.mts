import assert from 'node:assert/strict';
import test from 'node:test';
import { chromium, firefox, webkit } from 'playwright';
import { assertNoRuntimeErrors, snapshotDiagnostics } from './support.mts';
import { openCalculation, correctPath, checkNativeQuiz, assertPathPresentation, assertFreezePath } from './priority-four-regression.mts';

const fixture = 'curve-calculation.md';
const scenarios = [
  { name: 'derivative identity', page: 1, context: { task: 'derivative' },
    prompt: 'f(x)=x^3-3x', lines: ['f(x)=x^3-3x', "f'(x)=3(x^2-1)"], wrong: ['f(x)=x^3-3x', "f'(x)=x^2-1"] },
  { name: 'complete classified extrema points', page: 2, context: { task: 'extrema-points' },
    prompt: 'f(x)=x^3-3x', lines: ['f(x)=x^3-3x', 'H(-1|2)', 'T(1|-2)'], wrong: ['f(x)=x^3-3x', 'H(-1|3)', 'T(1|-2)'] },
  { name: 'inflection point', page: 3, context: { task: 'inflection-points' },
    prompt: 'f(x)=x^3', lines: ['f(x)=x^3', 'W(0|0)'], wrong: ['f(x)=x^3', 'W(0|1)'] },
  { name: 'vertical normal', page: 4, context: { task: 'normal', point: '0' },
    prompt: 'f(x)=x^2', lines: ['f(x)=x^2', 'x=0'], wrong: ['f(x)=x^2', 'y=0'] },
  { name: 'signed integral', page: 5, context: { task: 'integral', lower: '-1', upper: '1' },
    prompt: 'f(x)=x', lines: ['f(x)=x', 'I=0'], wrong: ['f(x)=x', 'I=1'] },
  { name: 'geometric area', page: 6, context: { task: 'area', lower: '-1', upper: '1' },
    prompt: 'f(x)=x', lines: ['f(x)=x', 'A=1'], wrong: ['f(x)=x', 'A=0'] },
  { name: 'compound investigation', page: 7, context: { task: 'curve' },
    prompt: 'f(x)=x^3-3x', lines: null, wrong: ['f(x)=x^3-3x', '\\text{extrempunkte:}', 'H(-1|3)', 'T(1|-2)'] },
  { name: 'explicit simplification overrides written arithmetic', page: 9, context: { task: 'simplify' },
    prompt: '2+3', lines: ['2+3', '5'], wrong: ['2+3', '6'] },
];
const requested = new Set((process.env.LIA_BROWSER_PROJECTS ?? 'chromium,firefox,webkit').split(','));
for (const [name, browserType] of Object.entries({ chromium, firefox, webkit })) {
  test('current ' + name + ': curve tasks through editor, public APIs, native grading, resolution and Freeze', { timeout: 900_000 }, async t => {
    if (!requested.has(name)) { t.skip('excluded by LIA_BROWSER_PROJECTS'); return; }
    const browser = await browserType.launch({ headless: true });
    try {
      for (const scenario of scenarios) await t.test(scenario.name, { timeout: 180_000 }, async () => {
        const harness = await openCalculation(browser, scenario.page, fixture, true);
        try {
          const page = harness.page, options = { calculationContext: scenario.context };
          const lines = scenario.lines || await page.evaluate(({ prompt, options }) =>
            (window as any).__LIA_CANVAS_OCR__.generateExpectedCalculation(prompt, options), { prompt: scenario.prompt, options });
          assert.ok(lines?.length);
          const wrongChecks = await correctPath(page, scenario.wrong, 60_000);
          assert.ok(wrongChecks.some(check => check.status === 'invalid'), JSON.stringify(wrongChecks));
          await checkNativeQuiz(page, scenario.wrong, 'failure', options);
          const checks = await correctPath(page, lines, 60_000);
          assert.ok(checks.length && checks.every(check => check.status === 'valid'), JSON.stringify(checks));
          await checkNativeQuiz(page, lines, 'success', options);
          await assertPathPresentation(page, checks);
          await assertFreezePath(page, lines, checks);
          assert.deepEqual(harness.modelRequests, []);
          assert.equal(await page.evaluate(() => (window as any).__priorityFourRecognizeCalls), 1);
          assertNoRuntimeErrors(harness, await snapshotDiagnostics(page));
        } finally { await harness.context.close(); }
      });
      await t.test('missing author parameter is visible and cannot be accepted', { timeout: 120_000 }, async () => {
        const harness = await openCalculation(browser, 8, fixture, true);
        try {
          const message = await harness.page.locator('.lia-calculation-options-error').textContent();
          assert.match(message || '', /stelle/iu);
          const grade = await harness.page.evaluate(() =>
            (window as any).__LIA_CANVAS_OCR__.checkCalculationAnswer('f(x)=x^2', '["f(x)=x^2","y=2x-1"]', { calculationContext: { task: 'tangent' } }));
          assert.equal(grade.accepted, false);
          assert.match(grade.message, /stelle/iu);
          assertNoRuntimeErrors(harness, await snapshotDiagnostics(harness.page));
        } finally { await harness.context.close(); }
      });
      await t.test('native resolution fills a checked derivative without further OCR', { timeout: 120_000 }, async () => {
        const harness = await openCalculation(browser, 1, fixture, true);
        try {
          const page = harness.page;
          const resolve = page.locator('.lia-quiz__resolve:visible');
          await resolve.click();
          await page.waitForFunction(() => {
            const field = document.querySelector<HTMLInputElement>('main:not([hidden]) .lia-quiz__input');
            if (!field || !document.querySelector('.lia-quiz.resolved')) return false;
            try {
              const lines = JSON.parse(field.value);
              return Array.isArray(lines) && lines.length > 1 &&
                (window as any).__LIA_CANVAS_OCR__.validateCalculationSubmission('f(x)=x^3-3x', lines, { calculationContext: { task: 'derivative' } }).accepted;
            } catch { return false; }
          }, undefined, { timeout: 30_000 });
          assert.equal(await page.evaluate(() => (window as any).__priorityFourRecognizeCalls), 1);
          assertNoRuntimeErrors(harness, await snapshotDiagnostics(page));
        } finally { await harness.context.close(); }
      });
    } finally { await browser.close(); }
  });
}
