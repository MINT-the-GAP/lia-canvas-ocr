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

const VECTOR_ALGEBRITE = {
  commit: '1fd3bf4d50b4557a73721922357013125be4ccbe',
  assets: {
    'README.md': '0faf5aad49a0e3263e498692785689381efdfeac25a93f76e3b0fcf9a88f8ae2',
    'dist/index.js': 'c73af1a14b40968372b128dceed8ca272b80d32e711f9445c89dc94639fec6a1',
  },
};

async function readOfficialAlgebrite(
  path: keyof typeof ALGEBRITE_ASSETS,
  { commit, assets } = { commit: ALGEBRITE_COMMIT, assets: ALGEBRITE_ASSETS },
): Promise<string> {
  const cache = join(tmpdir(), 'lia-canvas-algebrite-regression');
  const target = join(cache, commit + '-' + basename(path));
  const expectedHash = assets[path];
  const hash = (body: Uint8Array) => createHash('sha256').update(body).digest('hex');
  try {
    const cached = await readFile(target);
    if (hash(cached) === expectedHash) return cached.toString('utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }
  const source = `https://raw.githubusercontent.com/LiaTemplates/Algebrite/${commit}/${path}`;
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
  checkOnly?: boolean;
  preserveInput?: boolean;
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
  { name: 'spaced OCR variables and grouped exponent', latex: 'q p ^ { 4 }', solution: 'p^4*q', accepted: true, checkOnly: true },
  { name: 'compact OCR variables', latex: 'qp^4', solution: 'p^4*q', accepted: true, checkOnly: true },
  { name: 'compact OCR variables and grouped exponent', latex: 'qp^{4}', solution: 'p^4*q', accepted: true, checkOnly: true },
  { name: 'spaced OCR variables', latex: 'q p^4', solution: 'p^4*q', accepted: true, checkOnly: true },
  { name: 'power then compact variable', latex: 'p^4q', solution: 'p^4*q', accepted: true, checkOnly: true },
  { name: 'grouped power then variable', latex: 'p^{4}q', solution: 'p^4*q', accepted: true, checkOnly: true },
  { name: 'spaced grouped power then variable', latex: 'p ^ { 4 } q', solution: 'p^4*q', accepted: true, checkOnly: true },
  { name: 'multi-digit power then variable', latex: 'p^{12}q', solution: 'p^12*q', accepted: true, checkOnly: true },
  { name: 'two powered factors', latex: 'p^{4}q^{2}', solution: 'p^4*q^2', accepted: true, checkOnly: true },
  { name: 'power then two variables', latex: 'p^{4}qr', solution: 'p^4*q*r', accepted: true, checkOnly: true },
  { name: 'power with product inside exponent is different', latex: 'p^(4q)', solution: 'p^4*q', accepted: false, checkOnly: true },
  { name: 'standalone grouped exponent', latex: 'p^{4}', solution: 'p^4', accepted: true, checkOnly: true },
  { name: 'standalone multi-digit exponent', latex: 'p^{12}', solution: 'p^12', accepted: true, checkOnly: true },
  { name: 'typed compact trailing variable', latex: 'p^4q', solution: 'p^4*q', accepted: true, typed: true, checkOnly: true, preserveInput: true },
  { name: 'typed grouped trailing variable', latex: 'p^{4}q', solution: 'p^4*q', accepted: true, typed: true, checkOnly: true },
  { name: 'typed compact variables', latex: 'qp^4', solution: 'p^4*q', accepted: true, typed: true, checkOnly: true },
  { name: 'typed spaced grouped exponent', latex: 'q p ^ { 4 }', solution: 'p^4*q', accepted: true, typed: true, checkOnly: true },
  { name: 'typed wrong exponent stays wrong', latex: 'qp^{3}', solution: 'p^4*q', accepted: false, typed: true, checkOnly: true },
  { name: 'wrong exponent stays wrong', latex: 'qp^{3}', solution: 'p^4*q', accepted: false, checkOnly: true },
];
const variants = cases.flatMap(entry => (entry.checkOnly ? ['check'] : ['check', 'check2'])
  .map(macro => ({ ...entry, macro })));
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

type Stroke = ReadonlyArray<readonly [number, number]>;

async function submitOcr(
  page: Page, selector: string, latex: string | string[],
  strokes: Stroke[] = [[[0.42, 0.35], [0.57, 0.56]]],
): Promise<void> {
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
        const index = state.__ocrAnswerCalls++;
        return typeof raw === 'string' ? raw : raw[index] ?? '';
      },
    };
    state.__LIA_CANVAS_OCR__.canvasPlusOcr = engine;
  }, latex);
  const group = page.locator(selector);
  const pair = group.locator('.lia-canvas-pair');
  await pair.locator('.lia-canvas-launch:visible').click();
  const canvas = pair.locator('canvas.lia-draw:visible');
  await canvas.waitFor({ state: 'visible' });
  await canvas.evaluate(element => element.scrollIntoView({ block: 'center', behavior: 'instant' }));
  const draw = async ([first, ...points]: Stroke) => {
    const box = await canvas.boundingBox();
    assert.ok(box, 'Drawing canvas must have a visible bounding box');
    await page.mouse.move(box.x + box.width * first[0], box.y + box.height * first[1]);
    await page.mouse.down();
    for (const [x, y] of points) {
      await page.mouse.move(box.x + box.width * x, box.y + box.height * y, { steps: 8 });
    }
    await page.mouse.up();
  };
  // Real ink and a real selection ensure the production crop/recognition/submit
  // path is used. Only the probabilistic OCR model response is substituted.
  for (const stroke of strokes) await draw(stroke);
  await pair.locator('.lia-rect-btn:visible').click();
  await canvas.evaluate(element => element.scrollIntoView({ block: 'center', behavior: 'instant' }));
  await draw([[0.20, 0.12], [0.80, 0.88]]);
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
  assert.equal(await page.evaluate(() => (window as any).__ocrAnswerCalls),
    typeof latex === 'string' ? 1 : latex.length, 'Number of whole-crop or component inferences');
  await pair.locator('.lia-canvas-launch:visible').click();
}

test('OCR answers retain TeX number and algebra semantics in actual Algebrite quizzes',
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
          const finalAnswer = await input.inputValue();
          if (entry.typed && entry.checkOnly) {
            if (entry.preserveInput) assert.equal(finalAnswer, entry.latex);
            else assert.notEqual(finalAnswer, entry.latex);
          }
          subtest.diagnostic(JSON.stringify({ raw: entry.latex, answer, converted,
            finalAnswer, macro: entry.macro, solution: entry.solution, accepted }));
          assert.equal(accepted, entry.accepted,
            `${entry.macro}(${entry.solution}) for submitted answer ${JSON.stringify(finalAnswer)}`);
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

const columnStrokes: Stroke[] = [
  [[.43, .21], [.405, .29], [.39, .42], [.385, .50], [.39, .58], [.405, .71], [.43, .79]],
  [[.57, .21], [.595, .29], [.61, .42], [.615, .50], [.61, .58], [.595, .71], [.57, .79]],
  [[.48, .29], [.52, .37]], [[.52, .29], [.48, .37]],
  [[.48, .46], [.5, .51], [.52, .46]], [[.52, .46], [.493, .55]],
  [[.48, .62], [.52, .62], [.48, .71], [.52, .71]],
];

const rowStrokes: Stroke[] = [
  [[.28, .33], [.266, .39], [.26, .50], [.266, .61], [.28, .67]],
  [[.72, .33], [.734, .39], [.74, .50], [.734, .61], [.72, .67]],
  [[.325, .43], [.356, .56]], [[.356, .43], [.325, .56]],
  [[.415, .36], [.415, .64]],
  [[.48, .43], [.5, .49], [.52, .43]], [[.52, .43], [.493, .57]],
  [[.585, .36], [.585, .64]],
  [[.644, .43], [.675, .43], [.644, .56], [.675, .56]],
];

test('Canvas recognizes vector notation and submits it to the current Algebrite converter',
  { timeout: 120_000 }, async t => {
    const [template, bundle] = await Promise.all([
      readOfficialAlgebrite('README.md', VECTOR_ALGEBRITE),
      readOfficialAlgebrite('dist/index.js', VECTOR_ALGEBRITE),
    ]);
    const browser = await chromium.launch({ headless: true });
    const harness = await createHarness(browser);
    try {
      const column = '\\left(\\begin{array}{c} x \\\\ y \\\\ z \\end{array}\\right)';
      const row = '\\left( x \\mid y \\mid z \\right)';
      const entries = [
        { name: 'drawn column', raw: ['x', 'y', 'z'], answer: column, strokes: columnStrokes },
        { name: 'drawn row', raw: ['x', 'y', 'z'], answer: row, strokes: rowStrokes },
        { name: 'raw array', raw: column, answer: column },
        { name: 'raw TeX separators', raw: row, answer: row },
        { name: 'raw plain separators', raw: '( x | y | z )', answer: row },
        { name: 'wrong coordinate', raw: '( x | y | t )', answer: '\\left( x \\mid y \\mid t \\right)', wrong: true },
        { name: 'incomplete coordinate is read again', raw: ['_ x', 'x', 'y', 'z'],
          answer: column, strokes: columnStrokes },
        { name: 'failed segment falls back to whole crop', raw: ['x', '', column],
          answer: column, strokes: columnStrokes },
      ];
      const vectorCourseUrl = SYNTHETIC_ORIGIN + '/courses/ocr-vector.md';
      const vectorCourse = [
        '<!--', 'language: en', 'import: ' + ALGEBRITE_TEMPLATE_URL,
        'import: ' + SYNTHETIC_ORIGIN + '/template.md', '-->', '', '# Vector OCR', '',
        ...entries.flatMap((entry, index) => [
          '<div id="vector-' + index + '">', '', entry.name, '', '[[ vector ]]',
          '@Algebrite.check(`([x,y,z])`)',
          '@canvas', '', '</div>', '',
        ]),
      ].join('\n');
      for (const [url, body, contentType] of [
        [ALGEBRITE_TEMPLATE_URL, template, 'text/plain; charset=utf-8'],
        [ALGEBRITE_BUNDLE_URL, bundle, 'application/javascript; charset=utf-8'],
        [vectorCourseUrl, vectorCourse, 'text/plain; charset=utf-8'],
      ]) {
        await harness.context.route(url, route => route.fulfill({
          status: 200, body, contentType, headers: { 'access-control-allow-origin': '*' },
        }));
      }
      await openCourse(harness, vectorCourseUrl, '#vector-0 .lia-canvas-launch');
      await harness.page.waitForFunction(() => Boolean(
        window.__LIA_CANVAS_OCR__ && typeof (window as any).latexToMath === 'function',
      ));
      for (const [index, entry] of entries.entries()) {
        await t.test(entry.name, async () => {
          const selector = '#vector-' + index;
          await submitOcr(harness.page, selector, entry.raw, entry.strokes);
          const group = harness.page.locator(selector);
          const answer = await group.locator('.lia-quiz input').inputValue();
          assert.equal(answer, entry.answer);
          const nativeVector = await harness.page.evaluate(value => (window as any).latexToMath(value), answer);
          assert.equal(nativeVector, entry.wrong ? '[x,y,t]' : '[x,y,z]');
          await group.locator('button.lia-quiz__check').click();
          const feedback = entry.wrong ? '.text-error' : '.text-success';
          await group.locator('.lia-quiz__feedback' + feedback).waitFor({ state: 'visible' });
        });
      }
    } finally {
      await harness.context.close();
      await browser.close();
    }
  });
