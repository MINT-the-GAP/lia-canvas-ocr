import assert from 'node:assert/strict';
import test from 'node:test';
import { chromium, firefox, webkit } from 'playwright';
import { SYNTHETIC_ORIGIN, assertNoRuntimeErrors, snapshotDiagnostics } from './support.mts';
import { openCalculation, correctPath, checkNativeQuiz, assertPathPresentation, assertFreezePath } from './priority-four-regression.mts';

const fixture = 'function-calculation.md';
const courseUrl = SYNTHETIC_ORIGIN + '/courses/' + fixture;
const scenarios = [
  {
    name: 'explicit cubic zeroes task',
    options: { calculationContext: { task: 'zeros' } },
    lines: ['3x^3-4x^2-2x=0', 'x(3x^2-4x-2)=0', String.raw`x=0\lor 3x^2-4x-2=0`,
      'Fall 2: 3x^2-4x-2=0', '(x-2/3)^2=10/9', String.raw`x_{2,3}=2/3\pm\sqrt{10}/3`],
    wrong: ['3x^3-4x^2-2x=0', String.raw`L=\{0;7\}`],
  },
  {
    name: 'sine in a retained half-open interval',
    options: { calculationContext: { angleUnit: 'rad', interval: { lower: '0', upper: '2*pi', lowerClosed: true, upperClosed: false } } },
    lines: ['sin(x)=1/2', String.raw`L=\{\pi/6;5\pi/6\}`],
    wrong: ['sin(x)=1/2', String.raw`L=\{0;5\pi/6\}`],
  },
  {
    name: 'quadratic exponential expression', options: {},
    lines: ['e^(2x)-3e^x+2=0', String.raw`L=\{0;\ln(2)\}`],
    wrong: ['e^(2x)-3e^x+2=0', String.raw`L=\{0;\ln(3)\}`],
  },
  {
    name: 'original logarithm domain', options: {},
    lines: ['ln(x-1)+ln(x+1)=ln(8)', 'x^2=9', 'x=3'],
    wrong: ['ln(x-1)+ln(x+1)=ln(8)', 'x^2=9', 'x=-3'],
  },
];
const requested = new Set((process.env.LIA_BROWSER_PROJECTS ?? 'chromium,firefox,webkit').split(',').map(value => value.trim()));
for (const [name, browserType] of Object.entries({ chromium, firefox, webkit })) {
  test(`current ${name}: algebra and function paths through editor, public API, native grading and Freeze`, { timeout: 600_000 }, async t => {
    if (!requested.has(name)) { t.skip('excluded by LIA_BROWSER_PROJECTS'); return; }
    const browser = await browserType.launch({ headless: true });
    try {
      for (let index = 0; index < scenarios.length; index++) {
        const scenario = scenarios[index];
        await t.test(scenario.name, { timeout: 180_000 }, async () => {
          const harness = await openCalculation(browser, index + 1, fixture, true);
          try {
            const page = harness.page;
            const rejected = await correctPath(page, scenario.wrong, 60_000);
            assert.ok(rejected.some(check => check.status === 'invalid'), 'the incorrect root or domain violation needs visible row feedback');
            await checkNativeQuiz(page, scenario.wrong, 'failure', scenario.options);
            const checks = await correctPath(page, scenario.lines, 60_000);
            assert.ok(checks.length && checks.every(check => check.status === 'valid'), JSON.stringify(checks));
            await checkNativeQuiz(page, scenario.lines, 'success', scenario.options);
            await assertPathPresentation(page, checks);
            await assertFreezePath(page, scenario.lines, checks);
            assert.equal(await page.evaluate(() => (window as any).__priorityFourRecognizeCalls), 1,
              'correction, grading and Freeze must reuse the edited path');
            assert.deepEqual(harness.modelRequests, [], 'controlled mathematical checks do not download or evaluate an OCR model');
            assert.ok(harness.routeHits[courseUrl] > 0);
            assertNoRuntimeErrors(harness, await snapshotDiagnostics(page));
          } finally { await harness.context.close(); }
        });
      }
    } finally { await browser.close(); }
  });
}
