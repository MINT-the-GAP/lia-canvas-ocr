import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { chromium, firefox, webkit, type Browser, type BrowserType, type Page } from 'playwright';
import {
  SYNTHETIC_ORIGIN,
  assertNoRuntimeErrors,
  createHarness,
  openCourse,
  snapshotDiagnostics,
  type BrowserHarness,
} from './support.mts';

const COURSE_URL = SYNTHETIC_ORIGIN + '/courses/priority-four-calculation.md';
const PAIR = '.lia-canvas-pair[data-canvas-mode=plus][data-canvas-output=answer]';
const PROJECTS: Array<{ name: string; browserType: BrowserType }> = [
  { name: 'chromium', browserType: chromium },
  { name: 'firefox', browserType: firefox },
  { name: 'webkit', browserType: webkit },
];
const SYSTEM_PATH = ['I. x+y=5', 'II. x-y=1', String.raw`\text{I+II}`, '2x=6', 'x=3', 'y=5-3', 'y=2'];
const COMPLETION_PATH = ['x^2-4x=10', 'x^2-4x+4=14', '(x-2)^2=14', String.raw`x_{1,2}=2\pm\sqrt{14}`];
// Repetitorium.tex 20983-20989, with the verification explicitly identified.
const PROBE_PATH = ['3x-2=5x+4', '-2x=6', 'x=-3', String.raw`\text{Probe: }3\cdot(-3)-2=5\cdot(-3)+4`, '-11=-11'];

type Check = { status: string; reason: string; fromIndex: number; toIndex: number; role?: string; side?: string };

async function openCalculation(browser: Browser, coursePage: number): Promise<BrowserHarness> {
  const harness = await createHarness(browser);
  try {
    const body = await readFile(new URL('../fixtures/priority-four-calculation.md', import.meta.url), 'utf8');
    await harness.context.route(COURSE_URL, route => {
      harness.routeHits[COURSE_URL] = (harness.routeHits[COURSE_URL] ?? 0) + 1;
      return route.fulfill({
        status: 200, contentType: 'text/plain; charset=utf-8', body,
        headers: { 'access-control-allow-origin': '*', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' },
      });
    });
    const page = harness.page;
    await page.setViewportSize({ width: 1440, height: 1000 });
    await openCourse(harness, COURSE_URL, PAIR + ' .lia-canvas-launch');
    if (coursePage !== 1) {
      await page.evaluate(number => { location.hash = '#' + number; }, coursePage);
      await page.reload({ waitUntil: 'domcontentloaded', timeout: 120_000 });
    }
    await page.waitForFunction(({ selector, coursePage }) =>
      location.hash === '#' + coursePage && Boolean(document.querySelector(selector)) &&
      Boolean((window as any).__LIA_CANVAS_OCR__) && typeof (window as any).Algebrite?.run === 'function',
    { selector: PAIR, coursePage }, { timeout: 30_000 });
    await page.evaluate(selector => {
      const registry = (window as any).__LIA_CANVAS_OCR__;
      (window as any).__priorityFourRecognizeCalls = 0;
      (window as any).__priorityFourAnalyses = [];
      (window as any).__priorityFourRenders = [];
      const pair = document.querySelector(selector)!;
      pair.addEventListener('lia:canvasplus-analysis', event => {
        (window as any).__priorityFourAnalyses.push((event as CustomEvent).detail);
      });
      pair.addEventListener('lia:canvasplus-render', event => {
        (window as any).__priorityFourRenders.push((event as CustomEvent).detail);
      });
      (window as any).katex = {
        render(tex: string, target: HTMLElement) {
          target.textContent = tex;
          target.setAttribute('data-rendered-tex', tex);
        },
      };
      const ocr = {
        model: 'priority-four-editor-seed-stub', cacheKey: 'priority-four-editor-seed-stub',
        precision: 'fp32', task: 'image-to-text', outputKind: 'latex',
        inputProfile: 'formulanet-line-384', calculationSinglePass: true,
        ensureLoaded: async () => true,
        recognize: async () => {
          if (++(window as any).__priorityFourRecognizeCalls !== 1) throw new Error('the correction workflow must not run the model again');
          // Only opens the existing correction workflow. The actual authored
          // calculation paths are entered through its visible editor below.
          return '0=0';
        },
      };
      registry.ocr = ocr;
      registry.canvasPlusOcr = ocr;
    }, PAIR);
    await page.locator(PAIR + ' .lia-canvas-launch:visible').click();
    const canvas = page.locator(PAIR + ' canvas.lia-draw:visible');
    await canvas.waitFor({ state: 'visible' });
    await canvas.scrollIntoViewIfNeeded();
    const box = await canvas.boundingBox();
    assert.ok(box);
    await page.mouse.move(box.x + box.width * 0.3, box.y + box.height * 0.3);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.42, { steps: 8 });
    await page.mouse.up();
    await page.locator(PAIR + ' .lia-canvasplus-submit:visible').click();
    await page.waitForFunction(selector => document.querySelector(selector + ' .lia-canvasplus-output')
      ?.getAttribute('data-state') === 'ready', PAIR, { timeout: 10_000 });
    return harness;
  } catch (error) {
    await harness.context.close();
    throw error;
  }
}

async function correctPath(page: Page, lines: readonly string[]): Promise<Check[]> {
  const output = page.locator(PAIR + ' .lia-canvasplus-output');
  if (!await output.evaluate(node => (node as HTMLDetailsElement).open)) {
    await output.locator(':scope > summary.lia-canvasplus-result-toggle').click();
  }
  const before = await page.evaluate(() => (window as any).__priorityFourAnalyses.length);
  await output.locator('.lia-canvasplus-edit:visible').click();
  await output.locator('.lia-canvasplus-inline-textarea').fill(lines.join('\n'));
  await output.locator('.lia-canvasplus-accept').click();
  await page.waitForFunction(({ selector, before }) => {
    const output = document.querySelector(selector + ' .lia-canvasplus-output') as HTMLElement | null;
    return output?.dataset.resultSource === 'correction' && output.dataset.analysisState === 'ready'
      && (window as any).__priorityFourAnalyses.length > before;
  }, { selector: PAIR, before }, { timeout: 10_000 });
  assert.deepEqual(await page.evaluate(() => (window as any).__priorityFourRenders.at(-1).lines), lines,
    'the correction must retain every authored equation, label and verification row');
  return page.evaluate(() => (window as any).__priorityFourAnalyses.at(-1).checks);
}

async function checkNativeQuiz(page: Page, lines: readonly string[], expected: 'success' | 'failure'): Promise<void> {
  const quiz = page.locator('.lia-quiz:visible');
  assert.equal(await quiz.count(), 1, 'each fixture page has one native LiaScript calculation quiz');
  const answer = await quiz.locator('input,textarea,[contenteditable=true]').evaluateAll(fields => {
    const field = fields.find(node => node instanceof HTMLInputElement || node instanceof HTMLTextAreaElement ||
      (node as HTMLElement).isContentEditable);
    if (!field) throw new Error('the native calculation answer is missing');
    return 'value' in field ? String((field as HTMLInputElement).value) : field.textContent || '';
  });
  assert.deepEqual(JSON.parse(answer), lines, 'native grading must receive the whole corrected path');
  const publicResults = await page.evaluate(({ selector, answer }) => {
    const prompt = document.querySelector<HTMLElement>(selector)?.dataset.calculationPrompt;
    if (!prompt) throw new Error('the public calculation API needs the real macro prompt');
    const registry = (window as any).__LIA_CANVAS_OCR__;
    const validated = registry.validateCalculationSubmission(prompt, answer);
    const checked = registry.checkCalculationAnswer(prompt, answer);
    return {
      validated: { accepted: validated.accepted, outcome: validated.outcome },
      checked: { accepted: checked.accepted, outcome: checked.outcome, ok: checked.ok, status: checked.status },
    };
  }, { selector: PAIR, answer });
  const accepted = expected === 'success';
  const outcome = accepted ? 'correct' : 'incorrect';
  assert.deepEqual(publicResults.validated, { accepted, outcome },
    'the public validator must agree with native grading for the full procedure');
  assert.deepEqual(publicResults.checked, { accepted, outcome, ok: accepted, status: outcome },
    'the public answer API and its compatibility aliases must agree with native grading');
  await quiz.locator('button.lia-quiz__check:visible').click();
  await page.waitForFunction(expected => {
    const quiz = Array.from(document.querySelectorAll<HTMLElement>('.lia-quiz'))
      .find(node => node.getBoundingClientRect().width > 0 && node.getBoundingClientRect().height > 0);
    return expected === 'success'
      ? quiz?.classList.contains('solved') && Boolean(quiz.querySelector('.lia-quiz__feedback.text-success'))
      : quiz?.classList.contains('open') && Boolean(quiz.querySelector('.lia-quiz__feedback.text-error'));
  }, expected, { timeout: 5_000 });
}

async function assertPathPresentation(page: Page, checks: Check[]): Promise<void> {
  const transitions = page.locator(PAIR + ' .lia-canvasplus-output .lia-canvasplus-transition');
  assert.equal(await transitions.count(), checks.length);
  for (let index = 0; index < checks.length; index++) {
    const check = checks[index];
    const transition = transitions.nth(index);
    assert.equal(await transition.getAttribute('data-from-index'), String(check.fromIndex));
    assert.equal(await transition.getAttribute('data-to-index'), String(check.toIndex));
    const aria = await transition.locator('.lia-canvasplus-transition-trigger').getAttribute('aria-label');
    assert.ok(aria?.includes('line ' + (check.fromIndex + 1)) && aria.includes('line ' + (check.toIndex + 1)),
      'the accessible verdict must name its actual source and target rows');
    if (check.role && check.role !== 'equivalence') {
      assert.equal(await transition.getAttribute('data-role'), check.role);
      assert.equal(await transition.locator('.lia-canvasplus-transition-role').isVisible(), true,
        'procedures and verification need a visible label');
      assert.equal(await transition.locator('.lia-canvasplus-transition-arrow svg').isVisible(), false,
        'a procedure label must not imply an equivalence transformation');
    }
  }
}

async function assertFreezePath(page: Page, lines: readonly string[], checks: Check[]): Promise<void> {
  const state = await page.evaluate(selector => {
    const pair = document.querySelector(selector);
    return (window as any).__LIA_CANVAS_OCR__?.freeze?.exportCanvasFreezeStateFromPair?.(pair);
  }, PAIR);
  assert.equal(state?.cr?.v, 'cr1');
  assert.deepEqual(state.cr.lines, lines);
  const expected = checks.map(check => ({
    status: check.status, reason: check.reason, fromIndex: check.fromIndex, toIndex: check.toIndex,
    ...(check.side ? { side: check.side } : {}), ...(check.role ? { role: check.role } : {}),
  }));
  assert.deepEqual(state.cr.checks, expected, 'Freeze must retain the proven dependencies and procedure roles');
  await page.evaluate(({ selector, state }) => {
    const pair = document.querySelector(selector);
    document.body.classList.add('lia-course-frozen', 'lia-snapshot-mode', 'lia-shared-freeze-link');
    if (!(window as any).__LIA_CANVAS_OCR__?.freeze?.renderCanvasFreezeStateIntoPair?.(pair, state)) {
      throw new Error('the calculation procedure Freeze did not restore');
    }
  }, { selector: PAIR, state });
  const review = page.locator(PAIR + ' .lia-canvas-freeze-calculation-review[data-freeze-static]');
  await review.waitFor({ state: 'visible' });
  const transitions = review.locator('.lia-canvasplus-transition');
  assert.equal(await transitions.count(), checks.length);
  for (let index = 0; index < checks.length; index++) {
    const check = checks[index];
    const transition = transitions.nth(index);
    assert.equal(await transition.getAttribute('data-from-index'), String(check.fromIndex));
    assert.equal(await transition.getAttribute('data-to-index'), String(check.toIndex));
    if (check.role) assert.equal(await transition.getAttribute('data-role'), check.role);
  }
  const verification = checks.findIndex(check => check.role === 'verification');
  if (verification >= 0) {
    const row = transitions.nth(verification);
    assert.equal((await row.locator('.lia-canvasplus-transition-role').textContent())?.trim(), 'Verification');
    await page.evaluate(() => { document.documentElement.lang = 'de'; });
    await page.waitForFunction(selector => document.querySelector(selector + ' .lia-canvas-freeze-calculation-review ' +
      '.lia-canvasplus-transition[data-role=verification] .lia-canvasplus-transition-role')?.textContent === 'Probe', PAIR);
    assert.match(await row.locator('.lia-canvasplus-transition-trigger').getAttribute('aria-label') || '',
      /Probe: Zeile 1 zu Zeile 4: Richtig/);
    assert.match(await row.locator('.lia-canvasplus-transition-detail').textContent() || '', /Ausgangsgleichung/);
  }
}

export function registerPriorityFourBrowserRegression(): void {
  const requested = new Set((process.env.LIA_BROWSER_PROJECTS ?? 'chromium,firefox,webkit')
    .split(',').map(value => value.trim().toLowerCase()).filter(Boolean));
  for (const project of PROJECTS) {
    test(`current ${project.name}: priority-four system procedures, completing the square and verification`,
      { timeout: 180_000 }, async t => {
        if (!requested.has(project.name)) { t.skip('excluded by LIA_BROWSER_PROJECTS'); return; }
        const browser = await project.browserType.launch({ headless: true });
        try {
          for (const coursePage of [1, 2, 3]) {
            const harness = await openCalculation(browser, coursePage);
            try {
              const page = harness.page;
              let finalChecks: Check[] = [];
              let finalLines: readonly string[] = [];
              if (coursePage === 1) {
                const wrong = SYSTEM_PATH.map((line, index) => index === 3 ? '2x=8' : line);
                const checks = await correctPath(page, wrong);
                assert.ok(checks.some(check => check.status === 'invalid' &&
                  (check.fromIndex === 3 || check.toIndex === 3)),
                'the false addition result must remain a proven error despite correct final coordinates');
                await checkNativeQuiz(page, wrong, 'failure');
                const corrected = await correctPath(page, SYSTEM_PATH);
                assert.ok(corrected.length > 0 && corrected.every(check => check.status === 'valid'));
                await checkNativeQuiz(page, SYSTEM_PATH, 'success');
                finalChecks = corrected; finalLines = SYSTEM_PATH;
              } else if (coursePage === 2) {
                const checks = await correctPath(page, COMPLETION_PATH);
                assert.ok(checks.length > 0 && checks.every(check => check.status === 'valid'),
                  'completion of the square and both shifted roots must be proven');
                await checkNativeQuiz(page, COMPLETION_PATH, 'success');
                const rootOperation = await page.evaluate(() => {
                  const registry = (window as any).__LIA_CANVAS_OCR__;
                  const prompt = 'x^2=4';
                  const answer = JSON.stringify([
                    prompt, String.raw`x_{1,2}=\pm2\mid+1`, String.raw`\mathcal{L}=\{-2;2\}`,
                  ]);
                  const validated = registry.validateCalculationSubmission(prompt, answer);
                  const checked = registry.checkCalculationAnswer(prompt, answer);
                  return { accepted: validated.accepted, answerAccepted: checked.accepted, ok: checked.ok };
                });
                assert.deepEqual(rootOperation, { accepted: false, answerAccepted: false, ok: false },
                  'the correct final set must not hide an unperformed operation attached to the root row');
                finalChecks = checks; finalLines = COMPLETION_PATH;
              } else {
                const checks = await correctPath(page, PROBE_PATH);
                assert.ok(checks.some(check => check.reason === 'verification-step'),
                  'the explicitly marked verification is a verification step');
                assert.ok(checks.every(check => check.status === 'valid'),
                  'a correct numeric verification must not be judged as changing the solution set');
                await checkNativeQuiz(page, PROBE_PATH, 'success');
                finalChecks = checks; finalLines = PROBE_PATH;
              }
              await assertPathPresentation(page, finalChecks);
              await assertFreezePath(page, finalLines, finalChecks);
              assert.equal(await page.evaluate(() => (window as any).__priorityFourRecognizeCalls), 1,
                'editing and grading calculation paths must reuse the authored correction');
              assert.deepEqual(harness.modelRequests, [], 'authored path tests must not download OCR models');
              assert.ok(harness.routeHits[COURSE_URL] > 0, 'the real macro fixture must be delivered');
              assertNoRuntimeErrors(harness, await snapshotDiagnostics(page));
            } finally {
              await harness.context.close();
            }
          }
        } finally {
          await browser.close();
        }
      });
  }
}
