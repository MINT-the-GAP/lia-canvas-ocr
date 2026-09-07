import assert from 'node:assert/strict';
import test from 'node:test';
import { chromium, firefox, webkit, type BrowserType, type Page } from 'playwright';
import {
  SYNTHETIC_ORIGIN, assertNoRuntimeErrors, createHarness, openCourse, snapshotDiagnostics,
} from './support.mts';

const COURSE_URL = SYNTHETIC_ORIGIN + '/courses/variable-case-regression.md';
const PAIR = '.lia-canvas-pair[data-canvas-mode=plus][data-canvas-output=answer]';
const SYSTEM_PROMPT = String.raw`\begin{cases}x+X=5\\x-X=1\end{cases}`;
const SYSTEM_LINES = ['I. x+X=5', 'II. x-X=1', '2x=6', 'x=3', 'X=2'];
const COURSE = [
  '<!--',
  'author: lia-canvas-ocr browser tests',
  'version: 1.0.0',
  'language: en',
  'comment: Authored variable-case UI regressions with an OCR stub; no handwriting accuracy measurement.',
  'import: https://cdn.jsdelivr.net/gh/LiaTemplates/algebrite@0.6.3/README.md',
  'import: https://lia-canvas-ocr.invalid/template.md',
  '-->', '',
  '# Uppercase variable', '', '@BerechneOCR(`X=4`)', '',
  '## Distinct variables in a system', '', '@BerechneOCR(`' + SYSTEM_PROMPT + '`)', '',
  '## Case-only correction', '', '@BerechneOCR(`x=4`)', '',
].join('\n');
const PROJECTS: Array<{ name: string; browserType: BrowserType }> = [
  { name: 'chromium', browserType: chromium },
  { name: 'firefox', browserType: firefox },
  { name: 'webkit', browserType: webkit },
];
type Check = { status: string; reason: string; fromIndex: number; toIndex: number };

async function seedThroughCanvas(page: Page, section: number, prompt: string, seed: string): Promise<void> {
  if (section > 1) {
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    await page.keyboard.press('ArrowRight');
  }
  await page.waitForFunction(({ selector, section, prompt }) => {
    const pair = document.querySelector<HTMLElement>(selector);
    return location.hash === '#' + section && pair?.dataset.calculationPrompt === prompt &&
      Boolean((window as any).__LIA_CANVAS_OCR__) && typeof (window as any).Algebrite?.run === 'function';
  }, { selector: PAIR, section, prompt }, { timeout: 30_000 });
  await page.evaluate(({ selector, section, seed }) => {
    const registry = (window as any).__LIA_CANVAS_OCR__;
    const win = window as any;
    win.__variableCaseCalls ??= [];
    win.__variableCaseAnalyses = [];
    win.__variableCaseRenders = [];
    const pair = document.querySelector(selector)!;
    pair.addEventListener('lia:canvasplus-analysis', event => {
      win.__variableCaseAnalyses.push((event as CustomEvent).detail);
    });
    pair.addEventListener('lia:canvasplus-render', event => {
      win.__variableCaseRenders.push((event as CustomEvent).detail);
    });
    const ocr = {
      model: 'variable-case-ui-seed-stub-' + section,
      cacheKey: 'variable-case-ui-seed-stub-' + section,
      precision: 'fp32', task: 'image-to-text', outputKind: 'latex',
      inputProfile: 'formulanet-line-384', calculationSinglePass: true,
      ensureLoaded: async () => true,
      recognize: async () => {
        if (win.__variableCaseCalls.some((call: { section: number }) => call.section === section)) {
          throw new Error('editing, grading and Freeze must not invoke OCR again');
        }
        win.__variableCaseCalls.push({ section, seed });
        // This stub isolates OCR-output transport and UI semantics. Recognition
        // accuracy is measured separately with the real model and authored ink.
        return seed;
      },
    };
    registry.ocr = ocr;
    registry.canvasPlusOcr = ocr;
  }, { selector: PAIR, section, seed });
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
  assert.deepEqual(await page.evaluate(() => (window as any).__variableCaseRenders.at(-1)?.lines), [seed],
    'the real OCR-output path must retain the stub result, including uppercase X');
}

async function correctPath(page: Page, lines: readonly string[]): Promise<Check[]> {
  const output = page.locator(PAIR + ' .lia-canvasplus-output');
  if (!await output.evaluate(node => (node as HTMLDetailsElement).open)) {
    await output.locator(':scope > summary.lia-canvasplus-result-toggle').click();
  }
  const before = await page.evaluate(() => (window as any).__variableCaseAnalyses.length);
  await output.locator('.lia-canvasplus-edit:visible').click();
  await output.locator('.lia-canvasplus-inline-textarea').fill(lines.join('\n'));
  await output.locator('.lia-canvasplus-accept').click();
  await page.waitForFunction(({ selector, before }) => {
    const output = document.querySelector<HTMLElement>(selector + ' .lia-canvasplus-output');
    return output?.dataset.resultSource === 'correction' && output.dataset.analysisState === 'ready' &&
      (window as any).__variableCaseAnalyses.length > before;
  }, { selector: PAIR, before }, { timeout: 10_000 });
  assert.deepEqual(await page.evaluate(() => (window as any).__variableCaseRenders.at(-1).lines), lines,
    'the visible correction editor must preserve the case of each variable');
  return page.evaluate(() => (window as any).__variableCaseAnalyses.at(-1).checks);
}

async function assertPublicGrade(page: Page, lines: readonly string[], accepted: boolean): Promise<void> {
  const quiz = page.locator('.lia-quiz:visible');
  assert.equal(await quiz.count(), 1);
  const answer = await quiz.locator('input,textarea,[contenteditable=true]').evaluateAll(fields => {
    const field = fields.find(node => node instanceof HTMLInputElement || node instanceof HTMLTextAreaElement ||
      (node as HTMLElement).isContentEditable);
    if (!field) throw new Error('native calculation answer is missing');
    return 'value' in field ? String((field as HTMLInputElement).value) : field.textContent || '';
  });
  assert.deepEqual(JSON.parse(answer), lines, 'native grading must receive case-sensitive corrected equations');
  const result = await page.evaluate(({ selector, answer }) => {
    const prompt = document.querySelector<HTMLElement>(selector)?.dataset.calculationPrompt;
    if (!prompt) throw new Error('the actual task prompt is missing');
    const registry = (window as any).__LIA_CANVAS_OCR__;
    const validated = registry.validateCalculationSubmission(prompt, answer);
    const checked = registry.checkCalculationAnswer(prompt, answer);
    return {
      accepted: validated.accepted, outcome: validated.outcome,
      checkedAccepted: checked.accepted, checkedOutcome: checked.outcome, ok: checked.ok, status: checked.status,
    };
  }, { selector: PAIR, answer });
  assert.equal(result.accepted, accepted);
  assert.equal(result.checkedAccepted, accepted);
  assert.equal(result.ok, accepted);
  assert.equal(result.checkedOutcome, result.outcome);
  assert.equal(result.status, result.outcome);
  if (accepted) assert.equal(result.outcome, 'correct');
  else assert.notEqual(result.outcome, 'correct', 'an unproved change of variable must never receive a correct verdict');
}

async function checkNativeQuiz(page: Page, lines: readonly string[], accepted: boolean): Promise<void> {
  await assertPublicGrade(page, lines, accepted);
  await page.locator('.lia-quiz:visible button.lia-quiz__check:visible').click();
  await page.waitForFunction(accepted => {
    const quiz = Array.from(document.querySelectorAll<HTMLElement>('.lia-quiz'))
      .find(node => node.getBoundingClientRect().width > 0 && node.getBoundingClientRect().height > 0);
    return accepted
      ? quiz?.classList.contains('solved') && Boolean(quiz.querySelector('.lia-quiz__feedback.text-success'))
      : quiz?.classList.contains('open') && Boolean(quiz.querySelector('.lia-quiz__feedback.text-error'));
  }, accepted, { timeout: 5_000 });
}

async function assertRejectedFreeze(page: Page, lines: readonly string[]): Promise<void> {
  const state = await page.evaluate(selector => {
    const pair = document.querySelector(selector);
    return (window as any).__LIA_CANVAS_OCR__.freeze.exportCanvasFreezeStateFromPair(pair);
  }, PAIR);
  assert.equal(state?.cr?.v, 'cr1');
  assert.deepEqual(state.cr.lines, lines, 'Freeze must retain a case-only correction');
  assert.ok(state.cr.checks.some((check: Check) => check.status !== 'valid'));
  await page.evaluate(({ selector, state }) => {
    document.body.classList.add('lia-course-frozen', 'lia-snapshot-mode', 'lia-shared-freeze-link');
    if (!(window as any).__LIA_CANVAS_OCR__.freeze.renderCanvasFreezeStateIntoPair(document.querySelector(selector), state)) {
      throw new Error('case-sensitive calculation Freeze did not restore');
    }
  }, { selector: PAIR, state });
  const review = page.locator(PAIR + ' .lia-canvas-freeze-calculation-review[data-freeze-static]');
  await review.waitFor({ state: 'visible' });
  assert.deepEqual(await review.locator('.lia-canvasplus-line').evaluateAll(rows =>
    rows.map(row => (row as HTMLElement).dataset.rawLatex)), lines,
  'the restored visible review must distinguish lowercase x from uppercase X');
  const regraded = await page.evaluate(lines => {
    const registry = (window as any).__LIA_CANVAS_OCR__;
    return registry.checkCalculationAnswer('x=4', JSON.stringify(lines));
  }, state.cr.lines);
  assert.equal(regraded.accepted, false, 'Freeze must not turn the incorrect final variable into an accepted solution');
  assert.equal(regraded.ok, false);
}

export function registerVariableCaseBrowserRegression(): void {
  const requested = new Set((process.env.LIA_BROWSER_PROJECTS ?? 'chromium,firefox,webkit')
    .split(',').map(value => value.trim().toLowerCase()).filter(Boolean));
  for (const project of PROJECTS) {
    test(`current ${project.name}: variable-case OCR UI, native grading and Freeze (stubbed recognition)`,
      { timeout: 120_000 }, async t => {
        if (!requested.has(project.name)) { t.skip('excluded by LIA_BROWSER_PROJECTS'); return; }
        const browser = await project.browserType.launch({ headless: true });
        try {
          const harness = await createHarness(browser);
          try {
            await harness.context.route(COURSE_URL, route => {
              harness.routeHits[COURSE_URL] = (harness.routeHits[COURSE_URL] ?? 0) + 1;
              return route.fulfill({ status: 200, contentType: 'text/plain; charset=utf-8', body: COURSE,
                headers: { 'access-control-allow-origin': '*', 'cache-control': 'no-store' } });
            });
            const page = harness.page;
            await page.setViewportSize({ width: 1440, height: 1000 });
            await openCourse(harness, COURSE_URL, PAIR + ' .lia-canvas-launch');
            await seedThroughCanvas(page, 1, 'X=4', 'X=4');
            const uppercase = ['X=4', 'X=4'];
            const uppercaseChecks = await correctPath(page, uppercase);
            assert.ok(uppercaseChecks.length > 0 && uppercaseChecks.every(check => check.status === 'valid'));
            await checkNativeQuiz(page, uppercase, true);

            await seedThroughCanvas(page, 2, SYSTEM_PROMPT, '0=0');
            const collapsed = SYSTEM_LINES.map((line, index) => index === 4 ? 'x=2' : line);
            await correctPath(page, collapsed);
            await checkNativeQuiz(page, collapsed, false);
            const systemChecks = await correctPath(page, SYSTEM_LINES);
            assert.ok(systemChecks.length > 0 && systemChecks.every(check => check.status === 'valid'));
            await checkNativeQuiz(page, SYSTEM_LINES, true);

            await seedThroughCanvas(page, 3, 'x=4', 'x=4');
            await correctPath(page, ['x=4', 'x=4']);
            await assertPublicGrade(page, ['x=4', 'x=4'], true);
            const wrongCase = ['x=4', 'X=4'];
            const wrongChecks = await correctPath(page, wrongCase);
            assert.ok(wrongChecks.some(check => check.status !== 'valid'));
            await checkNativeQuiz(page, wrongCase, false);
            await assertRejectedFreeze(page, wrongCase);

            assert.deepEqual(await page.evaluate(() => (window as any).__variableCaseCalls), [
              { section: 1, seed: 'X=4' }, { section: 2, seed: '0=0' }, { section: 3, seed: 'x=4' },
            ], 'correction, native grading and Freeze must reuse their OCR seed');
            assert.deepEqual(harness.modelRequests, [], 'these UI stub tests must not download real OCR models');
            assert.ok(harness.routeHits[COURSE_URL] > 0);
            assertNoRuntimeErrors(harness, await snapshotDiagnostics(page));
          } finally { await harness.context.close(); }
        } finally { await browser.close(); }
      });
  }
}
