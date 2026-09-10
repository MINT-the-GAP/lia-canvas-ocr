import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import test from 'node:test';

import { chromium, type Page } from 'playwright';

import {
  ALGEBRITE_BUNDLE_URL,
  ALGEBRITE_TEMPLATE_URL,
  BUNDLE_URL,
  SYNTHETIC_ORIGIN,
  createHarness,
  openCourse,
} from './support.mts';

// Use the actual template macros and algebra-latex converter. The general
// browser harness intentionally supplies only the npm CAS, which cannot catch
// this regression. These are the byte-exact official 0.6.3 assets, cached only
// after SHA-256 verification; missing dependencies fail instead of skipping.
const ALGEBRITE_COMMIT = '9227c2fa05cbc97d3a19ed6fb394e29080781081';
const ALGEBRITE_ASSETS = {
  'README.md': '77c142b318f885eae1d8bf0c1f9e476ae9f5e66b000043f85e91b52faa263ee1',
  'dist/index.js': '695b1d3a560031b45c4850e9fb13e649cbb57595f2ba9b1745965d06fceb0892',
} as const;

async function readOfficialAlgebrite(path: keyof typeof ALGEBRITE_ASSETS): Promise<string> {
  const cache = join(tmpdir(), 'lia-canvas-algebrite-regression');
  const target = join(cache, basename(path));
  const expectedHash = ALGEBRITE_ASSETS[path];
  const hash = (body: Uint8Array) => createHash('sha256').update(body).digest('hex');
  try {
    const cached = await readFile(target);
    if (hash(cached) === expectedHash) return cached.toString('utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }
  const source = `https://raw.githubusercontent.com/LiaTemplates/Algebrite/${ALGEBRITE_COMMIT}/${path}`;
  const response = await fetch(source, { signal: AbortSignal.timeout(30_000) });
  assert.equal(response.ok, true, `Could not download official Algebrite asset: ${source}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  assert.equal(hash(bytes), expectedHash, `Algebrite asset checksum mismatch: ${source}`);
  await mkdir(cache, { recursive: true });
  await writeFile(target, bytes);
  return bytes.toString('utf8');
}

type Case = {
  name: string;
  latex: string;
  solution: string;
  accepted: boolean;
  typed?: boolean;
};

const cases: Case[] = [
  { name: 'OCR spaced digits', latex: String.raw`\sqrt { 1 3 }`, solution: 'sqrt(13)', accepted: true },
  { name: 'OCR compact number', latex: String.raw`\sqrt{13}`, solution: 'sqrt(13)', accepted: true },
  { name: 'OCR spaced braces', latex: String.raw`\sqrt { 13 }`, solution: 'sqrt(13)', accepted: true },
  { name: 'typed control', latex: String.raw`\sqrt{13}`, solution: 'sqrt(13)', accepted: true, typed: true },
  ...[String.raw`\cdot`, String.raw`\times`, '*'].flatMap(operator => [
    { name: `OCR product ${operator} rejects 13`, latex: `\\sqrt { 1 ${operator} 3 }`, solution: 'sqrt(13)', accepted: false },
    { name: `OCR product ${operator} accepts 3`, latex: `\\sqrt { 1 ${operator} 3 }`, solution: 'sqrt(3)', accepted: true },
  ]),
];
const variants = cases.flatMap(entry => ['check', 'check2'].map(macro => ({ ...entry, macro })));
const COURSE_URL = `${SYNTHETIC_ORIGIN}/courses/ocr-answer-regression.md`;
const course = [
  '<!--',
  'author: lia-canvas-ocr browser tests',
  'version: 1.0.0',
  'language: en',
  `import: ${ALGEBRITE_TEMPLATE_URL}`,
  `import: ${SYNTHETIC_ORIGIN}/template.md`,
  '-->',
  '',
  '# OCR answer normalization through native Algebrite quizzes',
  '',
  ...variants.flatMap((entry, index) => [
    `<div id="ocr-answer-${index}">`,
    '',
    `Case ${index + 1}: ${entry.name}, Algebrite.${entry.macro}.`,
    '',
    `[[ ${entry.solution} ]]`,
    `@Algebrite.${entry.macro}(\`${entry.solution}\`${entry.macro === 'check2' ? ',0.000001' : ''})`,
    '@canvas',
    '',
    '</div>',
    '',
  ]),
].join('\n');

async function submitOcr(page: Page, selector: string, latex: string): Promise<void> {
  await page.evaluate(raw => {
    const state = window as any;
    state.__ocrAnswerCalls = 0;
    state.__ocrAnswerInputEvents = [];
    const engine = {
      model: 'answer-normalization-regression',
      outputKind: 'latex',
      inputProfile: 'formulanet-line-384',
      calculationSinglePass: true,
      ensureLoaded: async () => true,
      recognize: async () => {
        state.__ocrAnswerCalls += 1;
        return raw;
      },
    };
    state.__LIA_CANVAS_OCR__.canvasPlusOcr = engine;
  }, latex);
  const group = page.locator(selector);
  const pair = group.locator('.lia-canvas-pair');
  await pair.locator('.lia-canvas-launch:visible').click();
  const canvas = pair.locator('canvas.lia-draw:visible');
  await canvas.waitFor({ state: 'visible' });
  await canvas.scrollIntoViewIfNeeded();
  const box = await canvas.boundingBox();
  assert.ok(box, 'Drawing canvas must have a visible bounding box');
  const drag = async (x0: number, y0: number, x1: number, y1: number) => {
    await page.mouse.move(box.x + box.width * x0, box.y + box.height * y0);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * x1, box.y + box.height * y1, { steps: 8 });
    await page.mouse.up();
  };
  // Real ink and a real selection ensure the production crop/recognition/submit
  // path is used. Only the probabilistic OCR model response is substituted.
  await drag(0.42, 0.35, 0.57, 0.56);
  await pair.locator('.lia-rect-btn:visible').click();
  await drag(0.30, 0.22, 0.70, 0.68);
  await page.evaluate(groupSelector => {
    const input = document.querySelector(`${groupSelector} .lia-quiz input`);
    if (!input) throw new Error('Native quiz input missing before OCR submission');
    for (const type of ['input', 'change']) {
      input.addEventListener(type, event => {
        (window as any).__ocrAnswerInputEvents.push({
          type,
          value: (event.target as HTMLInputElement).value,
        });
      });
    }
  }, selector);
  await pair.locator('.lia-rect-action:visible').click();
  await page.waitForFunction(groupSelector => {
    const input = document.querySelector(`${groupSelector} .lia-quiz input`) as HTMLInputElement | null;
    return Boolean(input?.value && (window as any).__ocrAnswerInputEvents.length >= 2);
  }, selector, { timeout: 10_000 });
  assert.equal(await page.evaluate(() => (window as any).__ocrAnswerCalls), 1,
    'Each submission must call the production OCR engine once');
  await pair.locator('.lia-canvas-launch:visible').click();
}

test('OCR answers retain TeX number semantics in actual Algebrite.check and check2',
  { timeout: 240_000 }, async t => {
    const [template, bundle] = await Promise.all([
      readOfficialAlgebrite('README.md'),
      readOfficialAlgebrite('dist/index.js'),
    ]);
    const browser = await chromium.launch({ headless: true });
    const harness = await createHarness(browser);
    try {
      // Playwright uses the last registered route first. Override the generic
      // harness's CAS fixture with the official converter bundle and macros.
      for (const [url, body, contentType] of [
        [ALGEBRITE_TEMPLATE_URL, template, 'text/plain; charset=utf-8'],
        [ALGEBRITE_BUNDLE_URL, bundle, 'application/javascript; charset=utf-8'],
        [COURSE_URL, course, 'text/plain; charset=utf-8'],
      ]) {
        await harness.context.route(url, route => route.fulfill({
          status: 200,
          contentType,
          headers: { 'access-control-allow-origin': '*', 'cache-control': 'no-store' },
          body,
        }));
      }
      // Allows a before/after measurement without replacing the working bundle.
      if (process.env.LIA_OCR_REGRESSION_BUNDLE_PATH) {
        const body = await readFile(process.env.LIA_OCR_REGRESSION_BUNDLE_PATH, 'utf8');
        await harness.context.route(BUNDLE_URL, route => route.fulfill({
          status: 200,
          contentType: 'application/javascript; charset=utf-8',
          headers: { 'access-control-allow-origin': '*' },
          body,
        }));
      }
      await openCourse(harness, COURSE_URL, '#ocr-answer-0 .lia-canvas-launch');
      await harness.page.waitForFunction(() => Boolean(
        window.__LIA_CANVAS_OCR__ && typeof (window as any).latexToMath === 'function' &&
        typeof (window as any).normalizeInputToArray === 'function',
      ));
      const rawConversion = await harness.page.evaluate(() => ({
        spaced: (window as any).latexToMath(String.raw`\sqrt { 1 3 }`),
        compact: (window as any).latexToMath(String.raw`\sqrt{13}`),
      }));
      assert.notEqual(rawConversion.spaced, rawConversion.compact,
        'Official converter must reproduce the original spaced-number bug');
      t.diagnostic(`Official Algebrite 0.6.3 raw converter: ${JSON.stringify(rawConversion)}`);
      for (const [index, entry] of variants.entries()) {
        await t.test(`${entry.name}, Algebrite.${entry.macro}`, async subtest => {
          const selector = `#ocr-answer-${index}`;
          const group = harness.page.locator(selector);
          assert.equal(await group.locator("output.lia-script").count(), 0,
            "The Algebrite script must be attached to the quiz, not rendered separately");
          const input = group.locator('.lia-quiz input').first();
          if (entry.typed) await input.fill(entry.latex);
          else await submitOcr(harness.page, selector, entry.latex);
          const answer = await input.inputValue();
          const converted = await harness.page.evaluate(value =>
            (window as any).latexToMath(value), answer);
          const events = entry.typed ? [] : await harness.page.evaluate(() =>
            (window as any).__ocrAnswerInputEvents);
          if (!entry.typed) {
            assert.deepEqual(events, [
              { type: 'input', value: answer },
              { type: 'change', value: answer },
            ], 'Both native events must carry the final normalized answer');
          }
          await group.locator('button.lia-quiz__check').last().click();
          await harness.page.waitForFunction(groupSelector => Boolean(
            document.querySelector(`${groupSelector} .lia-quiz__feedback.text-success`) ||
            document.querySelector(`${groupSelector} .lia-quiz__feedback.text-error`),
          ), selector, { timeout: 10_000 });
          const accepted = await group.locator('.lia-quiz.solved .lia-quiz__feedback.text-success').count() === 1;
          subtest.diagnostic(JSON.stringify({ raw: entry.latex, answer, converted,
            macro: entry.macro, solution: entry.solution, accepted }));
          assert.equal(accepted, entry.accepted,
            `${entry.macro}(${entry.solution}) for submitted answer ${JSON.stringify(answer)}`);
        });
      }
      assert.deepEqual(harness.pageErrors, [], harness.pageErrors.join('\n'));
      assert.deepEqual(harness.requestFailures, [], harness.requestFailures.join('\n'));
      assert.deepEqual(harness.modelRequests, [], 'The model must remain substituted in this focused regression');
    } finally {
      await harness.context.close();
      await browser.close();
    }
  });
