/** Opt-in end-to-end measurement through real LiaScript macros and canvas events.
 * The real FP32 recognize method is only observed; no OCR result is stubbed. */
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve, sep } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { chromium, type Page } from 'playwright';
import { createHarness, openCourse, SYNTHETIC_ORIGIN, LIASCRIPT_STABLE_URL } from '../test/browser/support.mts';
import { OCR_PIPELINE_CORPUS, OCR_PIPELINE_CORPUS_DESCRIPTION, type OcrPipelineCase } from '../test/fixtures/ocr-pipeline-corpus.mts';
import { OCR_LETTER_CASE_CORPUS, OCR_LETTER_CASE_CORPUS_DESCRIPTION } from '../test/fixtures/ocr-letter-case-corpus.mts';
import { parseCalculationStatement } from '../src/math/calculation-structure.ts';
import { compareOcrTex, summarizeOcrQuality, type OcrQualityRecord } from './ocr-quality-metrics.mts';

async function deadline<T>(promise: Promise<T>, milliseconds: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  try { return await Promise.race([promise, new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(label + ' timed out.')), milliseconds);
  })]); } finally { clearTimeout(timer!); }
}
const scoreText = (lines: readonly string[]): string => lines.join(String.raw`\\`);
const root = fileURLToPath(new URL('../', import.meta.url));
const values = new Map<string, string>();
let validateOnly = false;
let saveImages = false;
const args = process.argv.slice(2);
for (let index = 0; index < args.length; index++) {
  const option = args[index];
  if (option === '--help') {
    console.log('Usage: benchmark-ocr-pipeline.mts [--assets DIR] [--output FILE] [--repeats 1..5] [--cases id,...] [--corpus pipeline|letter-case|combined] [--device-scale 1|2] [--validate-only] [--save-images]');
    process.exit(0);
  }
  if (option === '--validate-only') {
    if (validateOnly) throw new Error('Repeated option: ' + option);
    validateOnly = true; continue;
  }
  if (option === '--save-images') {
    if (saveImages) throw new Error('Repeated option: ' + option);
    saveImages = true; continue;
  }
  if (!['--assets', '--output', '--repeats', '--cases', '--corpus', '--device-scale'].includes(option) || values.has(option)) throw new Error('Unknown/repeated option: ' + option);
  const value = args[++index];
  if (!value || value.startsWith('--')) throw new Error('Missing value for ' + option);
  values.set(option, value);
}
const assets = resolve(values.get('--assets') || join(tmpdir(), 'lia-ocr-priority2-models'));
const output = resolve(values.get('--output') || join(tmpdir(), 'lia-ocr-pipeline-benchmark.json'));
const artifactDir = output + '.assets';
const repeats = Number(values.get('--repeats') || '1');
if (!Number.isInteger(repeats) || repeats < 1 || repeats > 5) throw new Error('--repeats must be 1..5.');
const deviceScaleFactor = Number(values.get('--device-scale') || '1');
if (![1, 2].includes(deviceScaleFactor)) throw new Error('--device-scale must be 1 or 2.');
const corpusName = values.get('--corpus') || 'pipeline';
if (!['pipeline', 'letter-case', 'combined'].includes(corpusName)) throw new Error('Unknown corpus: ' + corpusName);
type BenchmarkCase = OcrPipelineCase & { distinction?: 'explicit' | 'ambiguous'; ambiguity?: unknown };
const corpusCases: readonly BenchmarkCase[] = corpusName === 'pipeline' ? OCR_PIPELINE_CORPUS
  : corpusName === 'letter-case' ? OCR_LETTER_CASE_CORPUS : [...OCR_PIPELINE_CORPUS, ...OCR_LETTER_CASE_CORPUS];
const corpusDescription = corpusName === 'pipeline' ? OCR_PIPELINE_CORPUS_DESCRIPTION
  : corpusName === 'letter-case' ? OCR_LETTER_CASE_CORPUS_DESCRIPTION : {
    id: 'berechneocr-combined-v1', synthetic: true,
    parts: [OCR_PIPELINE_CORPUS_DESCRIPTION, OCR_LETTER_CASE_CORPUS_DESCRIPTION],
    limitation: 'Combined authored development and previously evaluated task holdout. Pixel-identical ambiguous letter controls are reported separately and cannot establish a unique intended case.',
  };
const ids = values.has('--cases') ? values.get('--cases')!.split(',') : [];
if (new Set(ids).size !== ids.length || ids.some(id => !corpusCases.some(item => item.id === id))) throw new Error('Unknown/repeated case ID.');
const cases = corpusCases.filter(item => !ids.length || ids.includes(item.id));
const canonical = (path: string) => process.platform === 'win32' ? resolve(path).toLowerCase() : resolve(path);
const inputs = [fileURLToPath(import.meta.url), ...[
  'dist/index.js', 'test/fixtures/ocr-pipeline-corpus.mts', 'test/fixtures/ocr-letter-case-corpus.mts',
  'test/fixtures/ocr-equation-chunks.mts', 'scripts/ocr-quality-metrics.mts', 'test/browser/support.mts',
  'test/fixtures/lia-canvas-ocr-local.md', 'test/fixtures/algebrite-local.md', 'package-lock.json',
  'src/ocr/layout.ts', 'src/ocr/operation-head.ts', 'src/canvas/index.ts',
  'src/math/equivalence.ts', 'src/math/calculation-structure.ts', 'src/math/equality-groups.ts', 'src/math/calculation-path.ts',
].map(path => join(root, path))];
if (canonical(output).startsWith(canonical(assets) + sep) || canonical(output) === canonical(assets) ||
    inputs.some(path => canonical(path) === canonical(output))) throw new Error('--output must not overwrite benchmark inputs or model assets.');
const sha256 = (body: string | Buffer) => createHash('sha256').update(body).digest('hex');
async function fileHash(path: string): Promise<string> {
  const hash = createHash('sha256'); for await (const chunk of createReadStream(path)) hash.update(chunk); return hash.digest('hex');
}
const revision = '63e04c86fc96c2324811114351eeea8118bf6b28';
const manifestPath = join(assets, 'manifest.json');
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
if (manifest.model !== 'alephpi/FormulaNet' || manifest.revision !== revision || manifest.variants?.fp32?.status !== 'checked') {
  throw new Error('Prepare checked pinned FP32 assets with scripts/prepare-ocr-precision.py.');
}
const modelFiles = new Map<string, string>();
const verifiedFiles: Array<{ path: string; sha256: string }> = [];
for (const file of manifest.variants.fp32.files) {
  const prefix = 'fp32/' + revision + '/';
  const suffix = String(file.path || '').slice(prefix.length);
  if (!String(file.path).startsWith(prefix) || !/^(?:onnx\/)?[A-Za-z0-9_.-]+$/u.test(suffix) || modelFiles.has(suffix)) throw new Error('Invalid/duplicate FP32 manifest path.');
  const path = resolve(assets, file.path);
  const hash = await fileHash(path);
  if (hash !== file.sha256) throw new Error('FP32 checksum mismatch: ' + file.path);
  modelFiles.set(suffix, path); verifiedFiles.push({ path: file.path, sha256: hash });
}
for (const required of ['config.json', 'tokenizer.json', 'tokenizer_config.json', 'onnx/encoder_model.onnx', 'onnx/decoder_model_merged.onnx']) {
  if (!modelFiles.has(required)) throw new Error('Missing FP32 asset: ' + required);
}
const taskSplits = new Map<string, string>();
for (const item of cases) {
  if (!item.synthetic || item.expectedLines.length < 2 || !item.strokes.length || item.lineWidth !== 3) throw new Error('Invalid corpus entry: ' + item.id);
  if (taskSplits.has(item.baseTaskId) && taskSplits.get(item.baseTaskId) !== item.split) throw new Error('Task leaked across corpus splits.');
  taskSplits.set(item.baseTaskId, item.split);
  if (item.strokes.some(stroke => !stroke.length)) throw new Error('Empty authored stroke: ' + item.id);
  for (const stroke of item.strokes) for (const point of stroke) {
    if (!stroke.length || !Number.isFinite(point.x + point.y) || point.x < 0 || point.x >= item.width || point.y < 0 || point.y >= item.height) throw new Error('Invalid corpus geometry: ' + item.id);
  }
  compareOcrTex(scoreText(item.expectedLines), scoreText(item.expectedLines));
}
const planned = cases.flatMap(sample => Array.from({ length: repeats }, (_, repeat) => ({ sample, repeat: repeat + 1 })));
const records: OcrQualityRecord[] = planned.map(({ sample }) => ({ caseId: sample.id, split: sample.split,
  expected: scoreText(sample.expectedLines), actual: '', wallMs: NaN, gradeAccepted: null,
  expectedGradeAccepted: sample.expectedGradeAccepted, status: 'missing' }));
const report: any = {
  schema: 1, measuredAt: new Date().toISOString(), status: validateOnly ? 'validated' : 'starting',
  synthetic: true, corpus: { ...corpusDescription, selection: corpusName, cases }, repeats,
  validationOnly: validateOnly, saveImages, deviceScaleFactor,
  model: { model: manifest.model, revision, precision: 'fp32', profile: 'reference', verifiedFiles, manifestSha256: await fileHash(manifestPath) },
  inputs: Object.fromEntries(await Promise.all(inputs.map(async path => [path, await fileHash(path)]))),
  scope: 'Real authored mouse strokes, production crop/segmentation/symbol repair/chunking/fallback/cache, real FP32 model, real KaTeX preview, native answer transport and public native grading APIs. No expected equation is injected into OCR.',
  limitations: [
    corpusDescription.limitation,
    'Model weights are served locally. LiaScript, KaTeX, Transformers.js and ONNX runtime resources may still load from their normal external URLs; this is not an offline browser benchmark.',
    'Browser replay, diagnostic observers and PNG capture are benchmark overhead. Input drawing and model loading are outside submit-to-review timing; model-call timings exclude PNG capture but include any production inference-queue wait; pipeline wall time includes capture. Extra public API grading is timed separately.',
    'One fresh canvas per planned case/repeat, one resident model per browser page. No inference warmup; the first actual model call is marked separately. Repeated Submit on the same canvas is a separate cache observation, never a recognition-speed sample.',
    'A mathematically accepted grade is not transcription accuracy. Line count, operation text, raw OCR calls and TeX comparisons are reported independently.',
  ],
  load: null, environment: null, runtimeResources: [], errors: [], records, runs: [],
};
async function save(): Promise<void> {
  if (!validateOnly) {
    report.quality = summarizeOcrQuality(records);
    report.qualityByDistinction = {
      explicit: summarizeOcrQuality(records.filter((_, index) => planned[index].sample.distinction === 'explicit')),
      unassessed: summarizeOcrQuality(records.filter((_, index) => planned[index].sample.distinction === undefined)),
      ambiguous: summarizeOcrQuality(records.filter((_, index) => planned[index].sample.distinction === 'ambiguous')),
    };
  }
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, JSON.stringify(report, null, 2) + '\n', 'utf8');
}
await save();
if (validateOnly) {
  console.log(JSON.stringify({ status: 'validated', cases: cases.length, plannedRuns: planned.length, output }, null, 2));
  process.exit(0);
}
const PAIR = '.lia-canvas-pair[data-canvas-mode=plus][data-canvas-output=answer]';
const course = ['<!--', 'author: BerechneOCR authored pipeline benchmark', 'version: 1.0.0', 'language: en',
  'comment: Deterministic authored strokes. No recorded handwriting or pupil data.',
  'import: https://cdn.jsdelivr.net/gh/LiaTemplates/algebrite@0.6.3/README.md',
  'import: ' + SYNTHETIC_ORIGIN + '/template.md', '-->', '',
  ...planned.flatMap(({ sample, repeat }, index) => [
    (index ? '## ' : '# ') + sample.id + ' / ' + repeat, '', '@BerechneOCR(`' + sample.prompt + '`)', '',
  ]),
].join('\n');
const courseUrl = SYNTHETIC_ORIGIN + '/courses/pipeline-' + sha256(course).slice(0, 16) + '.md';
let cleanupBrowser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
let cleanupHarness: Awaited<ReturnType<typeof createHarness>> | undefined;
const resourceJobs: Promise<unknown>[] = [];
let fatal: unknown = null;
async function draw(page: Page, sample: OcrPipelineCase): Promise<void> {
  await page.locator(PAIR + ' .lia-canvas-launch:visible').click();
  const canvas = page.locator(PAIR + ' canvas.lia-draw:visible');
  await canvas.waitFor({ state: 'visible' });
  const initial = await canvas.boundingBox();
  if (!initial) throw new Error('The active drawing canvas is missing.');
  const targetWidth = Math.max(710, sample.width + 110), targetHeight = Math.max(420, sample.height + 55);
  const corner = await page.locator(PAIR + ' .lia-resize-corner[data-corner=br]').boundingBox();
  if (!corner) throw new Error('Canvas resize control is missing.');
  await page.mouse.move(corner.x + corner.width / 2, corner.y + corner.height / 2);
  await page.mouse.down();
  await page.mouse.move(corner.x + corner.width / 2 + targetWidth - initial.width,
    corner.y + corner.height / 2 + targetHeight - initial.height, { steps: 8 });
  await page.mouse.up();
  await canvas.scrollIntoViewIfNeeded();
  const box = await canvas.boundingBox();
  if (!box || box.width < sample.width + 80 || box.height < sample.height + 20) throw new Error('The canvas cannot fit the authored geometry without scaling.');
  for (const stroke of sample.strokes) {
    await page.mouse.move(box.x + 72 + stroke[0].x, box.y + 10 + stroke[0].y);
    await page.mouse.down();
    for (let index = 1; index < stroke.length; index++) {
      await page.mouse.move(box.x + 72 + stroke[index].x, box.y + 10 + stroke[index].y, { steps: 4 });
    }
    await page.mouse.up();
  }
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
}
function operations(lines: readonly string[]) {
  return lines.map(line => {
    const statement = parseCalculationStatement(line);
    return statement.kind === 'equation' || statement.kind === 'equality-chain' ? statement.operation || null : null;
  });
}
try {
  const browser = cleanupBrowser = await chromium.launch({ channel: 'chromium', headless: true });
  const context = await browser.newContext({ colorScheme: 'light', hasTouch: false,
    serviceWorkers: 'block', viewport: { width: 1280, height: 900 }, deviceScaleFactor });
  const harness = cleanupHarness = await createHarness(browser, { context });
  const page = harness.page;
  await page.setViewportSize({ width: 1920, height: 1200 });
  await harness.context.route(courseUrl, route => route.fulfill({ status: 200,
    contentType: 'text/plain; charset=utf-8', body: course, headers: { 'access-control-allow-origin': '*', 'cache-control': 'no-store' } }));
  await harness.context.route('https://huggingface.co/alephpi/FormulaNet/resolve/' + revision + '/**', async route => {
    const suffix = new URL(route.request().url()).pathname.split('/resolve/' + revision + '/')[1];
    const path = modelFiles.get(suffix);
    if (!path) { report.errors.push('Unmanifested model request: ' + suffix); await route.abort(); return; }
    await route.fulfill({ status: 200, body: await readFile(path), contentType: path.endsWith('.json') ? 'application/json' : 'application/octet-stream',
      headers: { 'access-control-allow-origin': '*', 'cross-origin-resource-policy': 'cross-origin', 'cache-control': 'no-store' } });
  });
  page.on('response', response => {
    const type = response.request().resourceType();
    if (!['document', 'script'].includes(type)) return;
    resourceJobs.push(response.body().then(body => report.runtimeResources.push({ url: response.url(), status: response.status(), sha256: sha256(body), bytes: body.length }))
      .catch(error => report.runtimeResources.push({ url: response.url(), error: String(error) })));
  });
  await openCourse(harness, courseUrl, PAIR);
  await page.waitForFunction(() => typeof (window as any).__LIA_CANVAS_OCR__?.createFormulaOcrEngine === 'function' && typeof (window as any).Algebrite?.run === 'function');
  report.environment = { browser: browser.version(), host: LIASCRIPT_STABLE_URL,
    ...await page.evaluate(() => ({ userAgent: navigator.userAgent, hardwareConcurrency: navigator.hardwareConcurrency,
      crossOriginIsolated, devicePixelRatio, viewport: { width: innerWidth, height: innerHeight } })) };
  report.load = await deadline(page.evaluate(async () => {
    const registry = (window as any).__LIA_CANVAS_OCR__;
    const engine = registry.createFormulaOcrEngine('reference');
    registry.canvasPlusOcr = engine;
    const original = engine.recognize.bind(engine);
    const state = (window as any).__ocrPipelineBenchmark = { calls: [], events: [], serial: 0 };
    engine.recognize = async (input: HTMLCanvasElement, options: any) => {
      const captureStart = performance.now();
      const call: any = { index: state.calls.length, firstInference: state.serial++ === 0,
        width: input.width, height: input.height, options: { max_new_tokens: options?.max_new_tokens, do_sample: options?.do_sample },
        worldBounds: (input as any).__liaOcrWorldBounds || null, pixelScale: (input as any).__liaOcrPixelScale || null,
        png: input.toDataURL('image/png'), captureMs: performance.now() - captureStart };
      state.calls.push(call);
      const start = performance.now();
      call.startedAt = start;
      try { const result = await original(input, options); call.text = result; return result; }
      catch (error) { call.error = String(error); throw error; }
      finally { call.wallMs = performance.now() - start; }
    };
    for (const name of ['lia:canvasplus-ocr', 'lia:canvasplus-render', 'lia:canvasplus-analysis', 'lia:canvasplus-answer']) {
      document.addEventListener(name, (event: Event) => state.events.push({ type: name, at: performance.now(), detail: (event as CustomEvent).detail }));
    }
    const started = performance.now();
    await engine.ensureLoaded(false);
    return { wallMs: performance.now() - started, runtimeUrl: engine.runtime?.__url, model: engine.model,
      revision: engine.modelRevision, precision: engine.precision, backend: engine.backend, cacheKey: engine.cacheKey };
  }), 300_000, 'Loading the real FP32 model');
  await save();
  for (let index = 0; index < planned.length; index++) {
    const { sample, repeat } = planned[index];
    const run: any = { caseId: sample.id, repeat, split: sample.split, distinction: sample.distinction || 'not-assessed', ambiguity: sample.ambiguity || null,
      status: 'running', expectedLines: sample.expectedLines,
      expectedLineCount: sample.expectedLines.length, expectedOperations: operations(sample.expectedLines), expectedGradeAccepted: sample.expectedGradeAccepted,
      intentionalError: sample.intentionalError || null, modelCalls: [] };
    report.runs.push(run);
    let began = 0, callStart = 0, eventStart = 0, traceReady = false;
    try {
      const state = await page.evaluate(() => ({ calls: (window as any).__ocrPipelineBenchmark.calls.length, events: (window as any).__ocrPipelineBenchmark.events.length }));
      callStart = state.calls; eventStart = state.events; traceReady = true;
      await page.waitForFunction(({ selector, section, prompt }) => location.hash === '#' + section &&
        document.querySelector<HTMLElement>(selector)?.dataset.calculationPrompt === prompt,
      { selector: PAIR, section: index + 1, prompt: sample.prompt }, { timeout: 20_000 });
      await draw(page, sample);
      run.freezeInput = await page.evaluate(selector => (window as any).__LIA_CANVAS_OCR__.freeze.exportCanvasFreezeStateFromPair(document.querySelector(selector)), PAIR);
      const tag = sample.id + '-r' + repeat;
      if (saveImages) {
        const drawingPath = join(artifactDir, tag + '-drawing.png');
        try {
          await mkdir(artifactDir, { recursive: true });
          await page.locator(PAIR + ' canvas.lia-draw:visible').screenshot({ path: drawingPath });
          run.drawingPng = drawingPath;
        } catch (error) { (run.artifactErrors ||= []).push('Drawing PNG: ' + String(error)); }
      }
      began = await page.evaluate(() => performance.now());
      await page.locator(PAIR + ' .lia-canvasplus-submit:visible').click();
      await page.waitForFunction(({ selector, eventStart }) => {
        const output = document.querySelector<HTMLElement>(selector + ' .lia-canvasplus-output');
        return output?.dataset.state === 'error' || ((window as any).__ocrPipelineBenchmark.events.length > eventStart &&
          output?.dataset.state === 'ready' && ['ready', 'error'].includes(output.dataset.analysisState || ''));
      }, { selector: PAIR, eventStart }, { timeout: 180_000 });
      const result = await page.evaluate(({ selector, began, eventStart }) => {
        const pair = document.querySelector<HTMLElement>(selector)!;
        const output = pair.querySelector<HTMLElement>('.lia-canvasplus-output')!;
        const registry = (window as any).__LIA_CANVAS_OCR__;
        const lines = Array.from(output.querySelectorAll<HTMLElement>('.lia-canvasplus-line')).map(row => row.dataset.rawLatex || '');
        const render = (window as any).__ocrPipelineBenchmark.events.slice(eventStart).filter((event: any) => event.type === 'lia:canvasplus-render').at(-1);
        let field: Element | null = null;
        for (const candidate of document.querySelectorAll('input,textarea,[contenteditable=true]')) {
          if (candidate.compareDocumentPosition(pair) & Node.DOCUMENT_POSITION_FOLLOWING) field = candidate;
        }
        const answer = field ? 'value' in field ? String((field as HTMLInputElement).value) : field.textContent || '' : '';
        const prompt = pair.dataset.calculationPrompt || '';
        const reviewedAt = performance.now();
        const validated = registry.validateCalculationSubmission(prompt, answer);
        const checked = registry.checkCalculationAnswer(prompt, answer);
        return { wallMs: reviewedAt - began, nativeApiMs: performance.now() - reviewedAt, state: output.dataset.state, analysisState: output.dataset.analysisState,
          lines: render?.detail.lines || lines, latex: output.dataset.latex || '', answer,
          validated, checked, engineError: registry.canvasPlusOcr?.lastError || '',
          checks: Array.from(output.querySelectorAll<HTMLElement>('.lia-canvasplus-transition')).map(node => ({
            fromIndex: node.dataset.fromIndex, toIndex: node.dataset.toIndex, role: node.dataset.role, status: node.dataset.verdict, reason: node.dataset.code,
          })) };
      }, { selector: PAIR, began, eventStart });
      Object.assign(run, result);
      if (result.state !== 'ready' || result.analysisState !== 'ready') throw new Error('The production pipeline did not produce a ready reviewed result.');
      if (result.validated.accepted !== result.checked.accepted) throw new Error('Public native grading APIs disagree.');
      const realCallCount = await page.evaluate(start => (window as any).__ocrPipelineBenchmark.calls.length - start, callStart);
      if (!realCallCount) throw new Error('A fresh canvas produced no observed real model call.');
      run.recognitionModelCallCount = realCallCount;
      run.actualLineCount = result.lines.length;
      run.actualOperations = operations(result.lines);
      run.lineCountExact = result.lines.length === sample.expectedLines.length;
      run.operationTextExact = JSON.stringify(run.actualOperations) === JSON.stringify(run.expectedOperations);
      run.transcription = compareOcrTex(scoreText(sample.expectedLines), scoreText(result.lines));
      Object.assign(records[index], { actual: scoreText(result.lines), wallMs: result.wallMs, gradeAccepted: result.checked.accepted, status: 'ok' });
      run.status = 'ok';
      // Evidence-file failures must not erase a completed real OCR/grade result.
      if (saveImages) {
        try {
          await page.locator(PAIR + ' .lia-canvasplus-output').evaluate(node => { (node as HTMLDetailsElement).open = true; });
          const previewPath = join(artifactDir, tag + '-preview.png');
          await page.locator(PAIR + ' .lia-canvasplus-output').screenshot({ path: previewPath });
          run.previewPng = previewPath;
        } catch (error) { (run.artifactErrors ||= []).push('Preview PNG: ' + String(error)); }
      }
      try {
        const cacheStart = await page.evaluate(() => ({ time: performance.now(), calls: (window as any).__ocrPipelineBenchmark.calls.length,
          renders: (window as any).__ocrPipelineBenchmark.events.filter((event: any) => event.type === 'lia:canvasplus-render').length }));
        run.cacheStartCallIndex = cacheStart.calls;
        await page.locator(PAIR + ' .lia-canvasplus-submit:visible').click();
        await page.waitForFunction(({ selector, renders }) => {
          const output = document.querySelector<HTMLElement>(selector + ' .lia-canvasplus-output');
          return output?.dataset.analysisState === 'ready' &&
            (window as any).__ocrPipelineBenchmark.events.filter((event: any) => event.type === 'lia:canvasplus-render').length > renders;
        }, { selector: PAIR, renders: cacheStart.renders }, { timeout: 30_000 });
        run.cacheObservation = await page.evaluate(start => ({ wallMs: performance.now() - start.time,
          additionalModelCalls: (window as any).__ocrPipelineBenchmark.calls.length - start.calls }), cacheStart);
      } catch (error) { run.cacheObservation = { error: String(error) }; }
    } catch (error) {
      run.status = 'failed'; run.error = String(error);
      records[index].status = 'failed';
      report.errors.push(sample.id + '/r' + repeat + ': ' + String(error));
    } finally {
      try {
        if (!traceReady) throw new Error('No per-case trace baseline was established.');
        const trace = await page.evaluate(({ callStart, eventStart }) => ({ calls: (window as any).__ocrPipelineBenchmark.calls.slice(callStart),
          events: (window as any).__ocrPipelineBenchmark.events.slice(eventStart) }), { callStart, eventStart });
        run.events = trace.events;
        for (const call of trace.calls) {
          const { png, ...metadata } = call;
          const bytes = Buffer.from(String(png).split(',')[1] || '', 'base64');
          const observed: any = { ...metadata, phase: call.index >= (run.cacheStartCallIndex ?? Infinity) ? 'cache-resubmit' : 'recognition',
            cropSha256: sha256(bytes) };
          run.modelCalls.push(observed);
          if (saveImages) {
            const path = join(artifactDir, sample.id + '-r' + repeat + '-call' + call.index + '.png');
            try { await mkdir(artifactDir, { recursive: true }); await writeFile(path, bytes); observed.cropPng = path; }
            catch (error) { observed.artifactError = String(error); (run.artifactErrors ||= []).push('Model crop PNG: ' + String(error)); }
          }
        }
      } catch (error) { run.traceError = String(error); }
      await save();
      console.log(sample.id + '/r' + repeat + ': ' + run.status + ', calls=' + run.modelCalls.length + ', rawExact=' + String(run.transcription?.rawExact ?? false));
    }
    if (run.modelCalls.some((call: any) => !Number.isFinite(call.wallMs))) {
      throw new Error('Stopped after an unfinished model call; remaining planned runs are preserved as missing.');
    }
    if (index + 1 < planned.length) {
      await page.evaluate(() => { if (document.activeElement instanceof HTMLElement) document.activeElement.blur(); });
      await page.keyboard.press('ArrowRight');
    }
  }
  report.status = report.runs.every((run: any) => run.status === 'ok') ? 'complete' : 'completed-with-errors';
} catch (error) {
  fatal = error; report.status = 'failed'; report.errors.push(String(error));
} finally {
  report.artifactErrorCount = report.runs.reduce((count: number, run: any) => count + (run.artifactErrors?.length || 0) + (run.traceError ? 1 : 0), 0);
  report.browserErrors = { console: cleanupHarness?.consoleErrors || [], page: cleanupHarness?.pageErrors || [], requests: cleanupHarness?.requestFailures || [] };
  report.modelRequests = cleanupHarness?.modelRequests || [];
  await deadline(Promise.allSettled(resourceJobs), 10_000, 'Resource provenance collection').catch(error => report.errors.push(String(error)));
  await save();
  await cleanupHarness?.context.close(); await cleanupBrowser?.close();
}
console.log(JSON.stringify({ status: report.status, output, quality: report.quality }, null, 2));
if (fatal || report.status !== 'complete') process.exitCode = 1;
