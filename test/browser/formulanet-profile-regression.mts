import assert from 'node:assert/strict';
import test from 'node:test';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { chromium, firefox, webkit, type BrowserType, type Page, type Worker } from 'playwright';

import {
  assertNoRuntimeErrors,
  createHarness,
  hostDelay,
  snapshotDiagnostics,
} from './support.mts';

// Only the imported ML runtime is mocked. Parcel's cross-origin worker, messaging,
// input conversion, profile validation and cancellation execute unchanged.
const MOCK_RUNTIME = String.raw`
export const env = { backends: { onnx: { wasm: {}, webgpu: {} } } };
const probe = globalThis.__formulaProfileProbe = { model: '', phase: 'imported', generated: 0, disposed: 0 };
export class Tensor {
  constructor(dtype, data, dims) { this.dtype = dtype; this.data = data; this.dims = dims; }
  dispose() { this.disposed = true; }
}
export class VisionEncoderDecoderModel {
  static async from_pretrained(model, options) {
    if (typeof document !== 'undefined') throw new Error('The model must execute in a real worker.');
    if (env.backends.onnx.wasm.proxy !== false) throw new Error('A dedicated worker must disable the ONNX proxy.');
    probe.model = model;
    probe.phase = 'loading';
    options.progress_callback?.({ status: 'progress', progress: 100 });
    if (model.includes('blocked-load')) return new Promise(() => {});
    const encoder = typeof options.device === 'string' ? options.device : options.device.encoder_model;
    const decoder = typeof options.device === 'string' ? options.device : options.device.decoder_model_merged;
    return {
      sessions: {
        model: { config: { device: model.includes('wrong-session') ? 'webgpu' : encoder, dtype: options.dtype } },
        decoder_model_merged: { config: { device: decoder, dtype: options.dtype } },
      },
      async generate({ inputs, max_new_tokens, do_sample }) {
        probe.phase = 'generating';
        probe.generated++;
        if (model.includes('blocked-generate')) return new Promise(() => {});
        if (!(inputs.data instanceof Float32Array)) throw new Error('Expected a transferred Float32Array.');
        if (JSON.stringify(inputs.dims) !== '[1,3,384,384]') throw new Error('Unexpected input dimensions.');
        const plane = 384 * 384;
        if (inputs.data.length !== plane * 3) throw new Error('Unexpected input data length.');
        let equalChannels = true;
        let finite = true;
        let whitePixels = 0;
        for (let i = 0; i < plane; i++) {
          if (inputs.data[i] !== inputs.data[i + plane] || inputs.data[i] !== inputs.data[i + plane * 2]) equalChannels = false;
          if (!Number.isFinite(inputs.data[i])) finite = false;
          if (inputs.data[i] > 1) whitePixels++;
        }
        let centerInkBands = 0;
        let inInk = false;
        for (let x = 0; x < 384; x++) {
          const ink = inputs.data[192 * 384 + x] < -2;
          if (ink && !inInk) centerInkBands++;
          inInk = ink;
        }
        // Deliberately occupy the worker's JS thread. The page must continue
        // processing its heartbeat while inference is running.
        const start = performance.now();
        while (performance.now() - start < 40) {}
        probe.phase = 'ready';
        return {
          dims: [1, 4], data: [1, 2, 3, 4], dispose() {},
          summary: {
            dims: inputs.dims, length: inputs.data.length, equalChannels, finite,
            whitePixels, centerInkBands, corner: inputs.data[0],
            maxNewTokens: max_new_tokens, doSample: do_sample,
            proxy: env.backends.onnx.wasm.proxy, numThreads: env.backends.onnx.wasm.numThreads,
            remoteHost: env.remoteHost, remotePathTemplate: env.remotePathTemplate,
            workerRealm: typeof document === 'undefined',
          },
        };
      },
      async dispose() { probe.disposed++; },
    };
  }
}
export class PreTrainedTokenizer {
  static async from_pretrained() {
    return { batch_decode(output) { return [JSON.stringify(output.summary)]; } };
  }
}
`;

async function startProfileServer() {
  const runtimeRequests: string[] = [];
  const assetRequests: string[] = [];
  let assetOrigin = '';
  const server = createServer(async (request, response) => {
    const path = new URL(request.url || '/', 'http://127.0.0.1').pathname;
    const headers = {
      'access-control-allow-origin': '*',
      'cross-origin-resource-policy': 'cross-origin',
      'cache-control': 'no-store',
    };
    try {
      if (path === '/') {
        response.writeHead(200, { ...headers, 'content-type': 'text/html; charset=utf-8' });
        response.end('<!doctype html><html><head><meta charset="utf-8"></head><body>'
          + '<script src="' + assetOrigin + '/dist/index.js"></script></body></html>');
      } else if (path === '/mock-runtime.js') {
        runtimeRequests.push(assetOrigin + request.url);
        response.writeHead(200, { ...headers, 'content-type': 'application/javascript; charset=utf-8' });
        response.end(MOCK_RUNTIME);
      } else if (/^\/dist\/[A-Za-z0-9._-]+\.js$/.test(path)) {
        const filename = path.slice('/dist/'.length);
        let body = await readFile(new URL('../../dist/' + filename, import.meta.url), 'utf8');
        if (/worker/i.test(filename)) {
          // Firefox does not route worker imports through Playwright in this
          // harness. Serve the real Parcel worker over HTTP and replace only
          // its two pinned external runtime URLs in the response, not on disk.
          body = body.replace('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1/+esm',
            assetOrigin + '/mock-runtime.js?cdn=jsdelivr');
          body = body.replace('https://esm.sh/@huggingface/transformers@3.8.1?bundle',
            assetOrigin + '/mock-runtime.js?cdn=esmsh');
          assetRequests.push(assetOrigin + path);
        }
        response.writeHead(200, { ...headers, 'content-type': 'application/javascript; charset=utf-8' });
        response.end(body);
      } else if (path === '/favicon.ico') {
        response.writeHead(204, headers); response.end();
      } else {
        response.writeHead(404, headers); response.end('Unknown test resource');
      }
    } catch (error) {
      response.writeHead(500, headers); response.end(String(error));
    }
  });
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  assert.ok(address && typeof address === 'object');
  assetOrigin = 'http://127.0.0.1:' + address.port;
  return {
    documentUrl: 'http://localhost:' + address.port + '/',
    assetOrigin,
    runtimeRequests,
    assetRequests,
    close: () => new Promise<void>((resolve, reject) => {
      server.close(error => error ? reject(error) : resolve());
      server.closeAllConnections();
    }),
  };
}
async function waitForWorkerPhase(page: Page, model: string, phase: string): Promise<Worker> {
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    for (const worker of page.workers()) {
      const probe = await worker.evaluate(() => (globalThis as any).__formulaProfileProbe).catch(() => null);
      if (probe?.model === model && probe.phase === phase) return worker;
    }
    await hostDelay(30);
  }
  throw new Error('Worker did not reach the expected phase: ' + model + '/' + phase);
}

export function registerFormulaNetProfileBrowserRegression(): void {
  const requested = new Set((process.env.LIA_BROWSER_PROJECTS ?? 'chromium,firefox,webkit')
    .split(',').map(value => value.trim().toLowerCase()).filter(Boolean));
  const projects: Array<{ name: string; browserType: BrowserType }> = [
    { name: 'chromium', browserType: chromium },
    { name: 'firefox', browserType: firefox },
    { name: 'webkit', browserType: webkit },
  ];
  for (const project of projects) {
    test(`current ${project.name}: FormulaNet profile worker integration`, { timeout: 90_000 }, async t => {
      if (!requested.has(project.name)) { t.skip('excluded by LIA_BROWSER_PROJECTS'); return; }
      const browser = await project.browserType.launch({ headless: true });
      let fixture: Awaited<ReturnType<typeof startProfileServer>> | null = null;
      try {
        const harness = await createHarness(browser, { withAlgebrite: false });
        try {
          fixture = await startProfileServer();
          const { runtimeRequests, assetRequests } = fixture;
          const transportFailures: string[] = [];
          harness.context.on('requestfailed', request => {
            transportFailures.push(request.url() + ': ' + request.failure()?.errorText);
          });
          const page = harness.page;
          await page.goto(fixture.documentUrl, { waitUntil: 'load' });
          await page.waitForFunction(() => typeof (window as any).__LIA_CANVAS_OCR__?.createFormulaOcrEngine === 'function');
          const originalRuntimeState = await page.evaluate(() => ({
            formula: Boolean((window as any).__LIA_CANVAS_OCR__.canvasPlusTfjs),
            legacy: Boolean((window as any).__LIA_CANVAS_OCR__.tfjs),
          }));
          const loaded = await page.evaluate(async assetBase => {
            const registry = (window as any).__LIA_CANVAS_OCR__;
            const reference = registry.createFormulaOcrEngine('reference');
            (window as any).__profileReference = reference;
            const artifactOptions = {
              model: 'test/profile', revision: 'fixture-v1', assetBaseUrl: assetBase,
            };
            const engine = registry.createFormulaOcrEngine('wasm-1', artifactOptions);
            (window as any).__profileArtifactOptions = artifactOptions;
            (window as any).__profileEngine = engine;
            artifactOptions.assetBaseUrl = assetBase + '/changed-before-load';
            registry.canvasPlusOcr = engine;
            const referenceAfterSelection = registry.createFormulaOcrEngine('reference');
            const referenceIdentity = {
              sameReference: referenceAfterSelection === reference,
              distinctFromProfile: referenceAfterSelection !== engine,
              activeSelectionPreserved: registry.canvasPlusOcr === engine,
            };
            await engine.ensureLoaded();
            const same = registry.createFormulaOcrEngine('wasm-1', {
              model: 'test/profile', revision: 'fixture-v1', assetBaseUrl: assetBase,
            });
            const otherRevision = registry.createFormulaOcrEngine('wasm-1', { model: 'test/profile', revision: 'fixture-v2' });
            const identity = { key: engine.cacheKey, sameKey: same.cacheKey, otherKey: otherRevision.cacheKey };
            same.dispose(); otherRevision.dispose();
            return { ...identity, referenceIdentity, info: engine.runtimeInfo, backend: engine.backend, precision: engine.precision };
          }, fixture.assetOrigin + '/models').catch(error => {
            t.diagnostic(JSON.stringify({ runtimeRequests, assetRequests, transportFailures, routeHits: harness.routeHits,
              workers: page.workers().map(worker => worker.url()), consoleErrors: harness.consoleErrors, pageErrors: harness.pageErrors }));
            throw error;
          });
          assert.deepEqual(loaded.referenceIdentity, {
            sameReference: true, distinctFromProfile: true, activeSelectionPreserved: true,
          }, 'requesting the original reference must preserve the selected worker profile');
          assert.equal(loaded.backend, 'wasm');
          assert.equal(loaded.precision, 'fp32');
          assert.equal(loaded.info.numThreads, 1);
          assert.deepEqual(loaded.info.devices, { encoder_model: 'wasm', decoder_model_merged: 'wasm' });
          assert.deepEqual(loaded.info.sessionPrecisions, { encoder_model: 'fp32', decoder_model_merged: 'fp32' });
          assert.equal(loaded.key, loaded.sameKey);
          assert.notEqual(loaded.key, loaded.otherKey);
          assert.match(loaded.key, /wasmThreads=1/);
          assert.equal(runtimeRequests.length, 1);
          assert.ok(assetRequests.some(url => /worker.*\.js/.test(url)), 'the actual Parcel worker must load from a different origin over HTTP');

          const inference = await page.evaluate(async () => {
            const source = document.createElement('canvas');
            source.width = 100; source.height = 50;
            const context = source.getContext('2d')!;
            context.fillStyle = '#fff'; context.fillRect(0, 0, 100, 50);
            context.fillStyle = '#000';
            context.fillRect(10, 20, 10, 10); context.fillRect(70, 20, 10, 10);
            context.beginPath(); context.arc(45, 25, 1, 0, Math.PI * 2); context.fill();
            (window as any).__profileSource = source;
            let heartbeats = 0;
            const timer = setInterval(() => heartbeats++, 10);
            try {
              const engine = (window as any).__profileEngine;
              const text = await engine.recognize(source, { max_new_tokens: 17, do_sample: false });
              return { summary: JSON.parse(text), timing: engine.lastTiming, heartbeats };
            } finally { clearInterval(timer); }
          });
          assert.deepEqual(inference.summary.dims, [1, 3, 384, 384]);
          assert.equal(inference.summary.length, 3 * 384 * 384);
          assert.equal(inference.summary.equalChannels, true);
          assert.equal(inference.summary.finite, true);
          assert.ok(inference.summary.whitePixels > 1000);
          assert.equal(inference.summary.centerInkBands, 3, 'the two glyphs and small central dot must reach the tensor');
          assert.ok(Math.abs(inference.summary.corner - Math.fround(-0.7931 / 0.1738)) < 0.00001,
            'FormulaNet must retain its established normalized black padding');
          assert.equal(inference.summary.maxNewTokens, 17);
          assert.equal(inference.summary.doSample, false);
          assert.equal(inference.summary.workerRealm, true);
          assert.equal(inference.summary.proxy, false);
          assert.equal(inference.summary.numThreads, 1);
          assert.equal(inference.summary.remoteHost, fixture.assetOrigin + '/models/');
          assert.equal(inference.summary.remotePathTemplate, '{model}/{revision}/');
          assert.equal(inference.timing.tokenCount, 4);
          assert.ok(inference.timing.inferenceMs >= 35);
          assert.ok(inference.timing.totalMs >= inference.timing.preprocessingMs);
          assert.ok(inference.heartbeats >= 2, 'the page must stay responsive during worker computation');
          assert.deepEqual(await page.evaluate(() => ({
            formula: Boolean((window as any).__LIA_CANVAS_OCR__.canvasPlusTfjs),
            legacy: Boolean((window as any).__LIA_CANVAS_OCR__.tfjs),
          })), originalRuntimeState, 'worker runtime settings must not initialize or change the legacy/main runtime');

          await page.evaluate(async () => {
            await (window as any).__profileEngine.ensureLoaded(false);
          });
          assert.equal(runtimeRequests.length, 1, 'an already loaded profile must reuse its model');
          const firstWorker = await waitForWorkerPhase(page, 'test/profile', 'ready');
          const firstClosed = firstWorker.waitForEvent('close', { timeout: 5000 });
          const reloaded = await page.evaluate(async () => {
            const engine = (window as any).__profileEngine;
            (window as any).__profileArtifactOptions.assetBaseUrl += '/changed-before-reload';
            await engine.ensureLoaded(true);
            const summary = JSON.parse(await engine.recognize((window as any).__profileSource));
            return { key: engine.cacheKey, remoteHost: summary.remoteHost };
          });
          await firstClosed;
          assert.equal(reloaded.key, loaded.key, 'reload must preserve the artifact identity');
          assert.equal(reloaded.remoteHost, fixture.assetOrigin + '/models/',
            'mutating caller options must not change the source on initial load or reload');
          assert.equal(runtimeRequests.length, 2, 'explicit reload must start a fresh isolated worker');
          assert.deepEqual(await page.evaluate(async () => {
            const engine = (window as any).__profileEngine;
            engine.dispose();
            const failures = await Promise.all([
              engine.ensureLoaded().then(() => '', (error: Error) => error.message),
              engine.recognize((window as any).__profileSource).then(() => '', (error: Error) => error.message),
            ]);
            return failures.map(message => /disposed/i.test(message));
          }), [true, true]);
          assert.deepEqual(await page.evaluate(() => {
            const registry = (window as any).__LIA_CANVAS_OCR__;
            const reference = registry.createFormulaOcrEngine('reference');
            return {
              sameOriginal: reference === (window as any).__profileReference,
              distinctFromDisposedProfile: reference !== (window as any).__profileEngine,
              activeSelectionPreserved: registry.canvasPlusOcr === (window as any).__profileEngine,
            };
          }), { sameOriginal: true, distinctFromDisposedProfile: true, activeSelectionPreserved: true },
          'a disposed selected worker must not replace the reusable original reference');

          const beforeUnavailable = runtimeRequests.length;
          const unavailable = await page.evaluate(() => {
            const registry = (window as any).__LIA_CANVAS_OCR__;
            const gpuDescriptor = Object.getOwnPropertyDescriptor(navigator, 'gpu');
            const isolationDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'crossOriginIsolated');
            Object.defineProperty(navigator, 'gpu', { configurable: true, value: undefined });
            Object.defineProperty(globalThis, 'crossOriginIsolated', { configurable: true, value: false });
            try {
              return ['wasm-2', 'wasm-4', 'webgpu', 'webgpu-encoder', 'webgpu-decoder'].map(id => {
                try { registry.createFormulaOcrEngine(id); return ''; }
                catch (error) { return String((error as Error).message); }
              });
            } finally {
              if (gpuDescriptor) Object.defineProperty(navigator, 'gpu', gpuDescriptor);
              else delete (navigator as any).gpu;
              if (isolationDescriptor) Object.defineProperty(globalThis, 'crossOriginIsolated', isolationDescriptor);
              else delete (globalThis as any).crossOriginIsolated;
            }
          });
          assert.match(unavailable[0], /isolation/);
          assert.match(unavailable[1], /isolation/);
          assert.match(unavailable[2], /WebGPU/);
          assert.match(unavailable[3], /WebGPU/);
          assert.match(unavailable[4], /WebGPU/);
          assert.equal(runtimeRequests.length, beforeUnavailable, 'unavailable profiles must fail before any replacement model is loaded');

          for (const phase of ['load', 'generate'] as const) {
            const model = 'test/blocked-' + phase;
            await page.evaluate(async ({ model, phase }) => {
              const engine = (window as any).__LIA_CANVAS_OCR__.createFormulaOcrEngine('wasm-1', { model });
              (window as any).__blockedProfileEngine = engine;
              (window as any).__blockedProfileResult = null;
              if (phase === 'generate') await engine.ensureLoaded();
              const pending = phase === 'load' ? engine.ensureLoaded()
                : engine.recognize((window as any).__profileSource);
              pending.then(
                () => { (window as any).__blockedProfileResult = 'unexpected success'; },
                (error: Error) => { (window as any).__blockedProfileResult = error.message; },
              );
            }, { model, phase });
            const blockedWorker = await waitForWorkerPhase(page, model, phase === 'load' ? 'loading' : 'generating');
            const closed = blockedWorker.waitForEvent('close', { timeout: 5000 });
            await page.evaluate(() => (window as any).__blockedProfileEngine.dispose());
            await page.waitForFunction(() => typeof (window as any).__blockedProfileResult === 'string');
            assert.match(await page.evaluate(() => (window as any).__blockedProfileResult), /disposed/i);
            await closed;
          }

          const sessionFailure = await page.evaluate(async () => {
            const engine = (window as any).__LIA_CANVAS_OCR__.createFormulaOcrEngine('wasm-1', { model: 'test/wrong-session' });
            try { await engine.ensureLoaded(); return ''; }
            catch (error) { return String((error as Error).message); }
            finally { engine.dispose(); }
          });
          assert.match(sessionFailure, /did not confirm/, 'mismatched session devices must fail rather than relabel a fallback');
          assertNoRuntimeErrors(harness, await snapshotDiagnostics(page));
        } finally { await harness.context.close(); }
      } finally { await browser.close(); await fixture?.close(); }
    });
  }
}
