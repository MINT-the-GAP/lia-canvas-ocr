import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve, dirname, join, sep } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { OCR_PERFORMANCE_CORPUS, OCR_PERFORMANCE_CORPUS_DESCRIPTION } from '../test/fixtures/ocr-performance-corpus.mts';
import { summarizeOcrBenchmark, type OcrBenchmarkRun } from './ocr-benchmark-metrics.mts';

const args = process.argv.slice(2);
const option = (name: string, fallback: string) => {
    const index = args.indexOf(name);
    return index < 0 ? fallback : args[index + 1] || fallback;
};
async function withDeadline<T>(operation: Promise<T>, milliseconds: number, description: string): Promise<T> {
    let timer: ReturnType<typeof setTimeout>;
    const timeout = new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(description + ' timed out.')), milliseconds);
    });
    try { return await Promise.race([operation, timeout]); }
    finally { clearTimeout(timer!); }
}
const root = fileURLToPath(new URL('../', import.meta.url));
const assetDir = resolve(option('--assets', join(tmpdir(), 'lia-ocr-priority2-models')));
const output = resolve(option('--output', join(tmpdir(), 'lia-ocr-priority2-benchmark.json')));
const repeats = Number(option('--repeats', '3'));
if (!Number.isInteger(repeats) || repeats < 1 || repeats > 20) throw new Error('--repeats must be 1..20.');
const ids = option('--cases', '').split(',').filter(Boolean);
const corpus = OCR_PERFORMANCE_CORPUS.filter(sample => !ids.length || ids.includes(sample.id));
if (!corpus.length || ids.some(id => !corpus.some(sample => sample.id === id))) throw new Error('Unknown or empty --cases selection.');
const isolated = !args.includes('--no-isolation');
const manifest = JSON.parse(await readFile(join(assetDir, 'manifest.json'), 'utf8'));
const revision = '63e04c86fc96c2324811114351eeea8118bf6b28';
if (manifest.revision !== revision || manifest.variants?.fp32?.status !== 'checked') {
    throw new Error('Prepare the pinned, checked FP32 assets first with scripts/prepare-ocr-precision.py.');
}
const profiles: Record<string, { runtime: string; artifact: string }> = {
    reference: { runtime: 'reference', artifact: 'fp32' },
    'wasm-1': { runtime: 'wasm-1', artifact: 'fp32' },
    'wasm-2': { runtime: 'wasm-2', artifact: 'fp32' },
    'wasm-4': { runtime: 'wasm-4', artifact: 'fp32' },
    webgpu: { runtime: 'webgpu', artifact: 'fp32' },
    'webgpu-encoder': { runtime: 'webgpu-encoder', artifact: 'fp32' },
    'webgpu-fp16-encoder': { runtime: 'webgpu-encoder', artifact: 'fp16-encoder-floorpool' },
    'webgpu-decoder': { runtime: 'webgpu-decoder', artifact: 'fp32' },
    'webgpu-floorpool': { runtime: 'webgpu', artifact: 'fp32-floorpool' },
    'webgpu-encoder-floorpool': { runtime: 'webgpu-encoder', artifact: 'fp32-floorpool' },
    'webgpu-q8-decoder': { runtime: 'webgpu-encoder', artifact: 'q8-decoder-floorpool' },
    'wasm-fp16-encoder': { runtime: 'wasm-1', artifact: 'fp16-encoder' },
    'wasm-q8': { runtime: 'wasm-1', artifact: 'q8-decoder' },
};
const requested = option('--profiles', Object.keys(profiles).join(',')).split(',');
if (requested.some(id => !profiles[id])) throw new Error('Unknown --profiles selection.');
// Verify the files actually measured, not just a possibly stale manifest label.
const verified = new Set<string>();
for (const name of requested) {
    const artifact = manifest.variants[profiles[name].artifact];
    if (artifact?.status !== 'checked') continue;
    for (const entry of artifact.files) {
        const path = resolve(assetDir, entry.path);
        if (!path.startsWith(assetDir + sep)) throw new Error('Invalid manifest file path.');
        if (verified.has(path)) continue;
        const hash = createHash('sha256');
        for await (const block of createReadStream(path)) hash.update(block);
        if (hash.digest('hex') !== entry.sha256) throw new Error('Artifact checksum mismatch: ' + entry.path);
        verified.add(path);
    }
}


const server = createServer(async (req, res) => {
    const headers: Record<string, string> = {
        'access-control-allow-origin': '*', 'cross-origin-resource-policy': 'cross-origin',
        'cache-control': 'no-store',
    };
    if (isolated) {
        headers['cross-origin-opener-policy'] = 'same-origin';
        headers['cross-origin-embedder-policy'] = 'require-corp';
    }
    try {
        const path = new URL(req.url || '/', 'http://localhost').pathname;
        if (path === '/') {
            res.writeHead(200, { ...headers, 'content-type': 'text/html' });
            res.end('<!doctype html><html><head><meta charset="utf-8"></head><body><script src="/dist/index.js"></script></body></html>');
            return;
        }
        let file: string;
        if (/^\/dist\/[a-zA-Z0-9._-]+\.js$/.test(path)) file = join(root, path.slice(1));
        else if (/^\/models\/[a-zA-Z0-9_-]+\/[a-f0-9]{40}\/(?:onnx\/)?[a-zA-Z0-9._-]+$/.test(path)) {
            file = resolve(assetDir, path.slice('/models/'.length));
            if (!file.startsWith(assetDir + sep)) throw new Error('Invalid asset path.');
        } else { res.writeHead(404, headers); res.end(); return; }
        const body = await readFile(file);
        res.writeHead(200, { ...headers, 'content-type': file.endsWith('.js') ? 'text/javascript' :
            file.endsWith('.json') ? 'application/json' : 'application/octet-stream', 'content-length': body.length });
        res.end(body);
    } catch { res.writeHead(404, headers); res.end(); }
});
await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
const address = server.address();
if (!address || typeof address === 'string') throw new Error('No benchmark server address.');
const base = 'http://127.0.0.1:' + address.port;
const results: any[] = [];
let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
let environment: any = null;
const save = async () => {
    const reference = results.find(result => result.profile === 'reference' && result.status === 'complete')?.runs;
    for (const result of results) {
        if (result.runs?.length) {
            result.summary = summarizeOcrBenchmark(result.runs, reference);
            if (result.status !== 'complete') {
                result.summary.speedupRatio = null;
                result.summary.qualitySafeSpeedup = false;
            }
        }
    }
    await mkdir(dirname(output), { recursive: true });
    await writeFile(output, JSON.stringify({
        schema: 1, measuredAt: new Date().toISOString(),
        corpus: { ...OCR_PERFORMANCE_CORPUS_DESCRIPTION, caseIds: corpus.map(sample => sample.id) },
        environment, repeats, tokenLimit: 64,
        loadMeasurement: 'Fresh browser context per profile; verified pinned weights served locally. Runtime modules still load from their pinned external CDN. Load time mixes runtime transfer and initialization; it is not internet model download timing.',
        gpuMeasurement: 'Session execution providers are confirmed, but ONNX may run unsupported operators on CPU. GPU-only execution is not claimed.',
        modelManifest: manifest, results,
    }, null, 2) + '\n', 'utf8');
};
try {
    browser = await chromium.launch({ channel: 'chromium', headless: true });
    for (const name of requested) {
        const definition = profiles[name];
        const artifact = manifest.variants[definition.artifact];
        if (artifact?.status !== 'checked') {
            results.push({ profile: name, status: 'unavailable', reason: artifact?.error || 'No checked artifact.', runs: [] });
            await save();
            continue;
        }
        console.log('Loading ' + name + '...');
        const context = await browser.newContext({ serviceWorkers: 'block' });
        // The unmodified reference loader still uses its pinned upstream URL.
        // Redirect only this exact public model revision to the same local assets.
        await context.route('https://huggingface.co/alephpi/FormulaNet/resolve/' + revision + '/**', async route => {
            const upstream = new URL(route.request().url());
            const suffix = upstream.pathname.split('/resolve/' + revision + '/')[1];
            await route.fulfill({ status: 307, headers: {
                location: base + '/models/fp32/' + revision + '/' + suffix,
                'access-control-allow-origin': '*',
                'cross-origin-resource-policy': 'cross-origin',
            } });
        });
        const page = await context.newPage();
        const errors: string[] = [];
        page.on('pageerror', error => errors.push(String(error)));
        const result: any = { profile: name, artifact: definition.artifact, runtime: definition.runtime,
            weightPrecision: artifact.weights_precision, status: 'loading', runs: [] as OcrBenchmarkRun[], pageErrors: errors };
        try {
            await page.goto(base, { waitUntil: 'load' });
            await page.waitForFunction(() => Boolean((window as any).__LIA_CANVAS_OCR__?.createFormulaOcrEngine));
            environment = environment || await page.evaluate(async () => {
                const adapter = await (navigator as any).gpu?.requestAdapter();
                const info = adapter?.info;
                return { userAgent: navigator.userAgent, crossOriginIsolated,
                    hardwareConcurrency: navigator.hardwareConcurrency,
                    adapter: info ? { vendor: info.vendor, architecture: info.architecture,
                        device: info.device, description: info.description, isFallbackAdapter: info.isFallbackAdapter } : null,
                    adapterFeatures: adapter ? [...adapter.features].sort() : [],
                    browserChannel: 'chromium', headless: true, unsafeGpuFlags: false };
            });
            const load = await withDeadline(page.evaluate(async ({ definition, revision, base, precision }) => {
                const registry = (window as any).__LIA_CANVAS_OCR__;
                const engine = registry.createFormulaOcrEngine(definition.runtime, {
                    model: definition.artifact, revision, assetBaseUrl: base + '/models/', weightPrecision: precision,
                });
                (window as any).__benchmarkEngine = engine;
                const start = performance.now();
                await engine.ensureLoaded(false);
                return { loadMs: performance.now() - start, cacheKey: engine.cacheKey,
                    runtimeInfo: engine.runtimeInfo || { backend: engine.backend, precision: engine.precision,
                        numThreads: 1, proxy: true, runtimeUrl: registry.canvasPlusTfjs?.__url } };
            }, { definition, revision, base, precision: typeof artifact.weights_precision === 'string' ? artifact.weights_precision : JSON.stringify(artifact.weights_precision) }), 250_000, 'Loading ' + name);
            Object.assign(result, load);
            const infer = async (sample: typeof corpus[number]) => withDeadline(page.evaluate(async sample => {
                const engine = (window as any).__benchmarkEngine;
                const canvas = document.createElement('canvas');
                canvas.width = sample.width; canvas.height = sample.height;
                const ctx = canvas.getContext('2d')!;
                ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.strokeStyle = ctx.fillStyle = '#000'; ctx.lineCap = ctx.lineJoin = 'round'; ctx.lineWidth = sample.lineWidth;
                for (const stroke of sample.strokes) {
                    ctx.beginPath();
                    if (stroke.length === 1) { ctx.arc(stroke[0].x, stroke[0].y, sample.lineWidth / 2, 0, Math.PI * 2); ctx.fill(); }
                    else { ctx.moveTo(stroke[0].x, stroke[0].y); for (const p of stroke.slice(1)) ctx.lineTo(p.x, p.y); ctx.stroke(); }
                }
                const begin = performance.now();
                let lastTick = begin, maxEventLoopDelayMs = 0;
                const interval = setInterval(() => { const now = performance.now();
                    maxEventLoopDelayMs = Math.max(maxEventLoopDelayMs, now - lastTick - 10); lastTick = now; }, 10);
                try {
                    const text = await engine.recognize(canvas, { max_new_tokens: 64, do_sample: false });
                    const end = performance.now();
                    maxEventLoopDelayMs = Math.max(maxEventLoopDelayMs, end - lastTick - 10);
                    return { caseId: sample.id, expectedLatex: sample.expectedLatex, text,
                        wallMs: end - begin, inferenceMs: engine.lastTiming?.inferenceMs,
                        tokenCount: engine.lastTiming?.tokenCount, maxEventLoopDelayMs };
                } finally { clearInterval(interval); }
            }, sample), 130_000, 'Recognizing ' + sample.id);
            result.firstRun = await infer(corpus[0]);
            console.log(name + ' loaded in ' + Math.round(result.loadMs) + ' ms; first row ' + Math.round(result.firstRun.wallMs) + ' ms');
            for (const sample of corpus) {
                for (let repeat = 0; repeat < repeats; repeat++) result.runs.push(await infer(sample));
                console.log(name + ': ' + sample.id + ' done');
            }
            result.status = errors.length ? 'page-error' : 'complete';
        } catch (error) {
            result.status = 'failed'; result.error = String(error);
            console.log(name + ': ' + result.error.slice(0, 600));
        } finally {
            results.push(result);
            await save();
            await context.close();
        }
    }
} finally {
    await browser?.close();
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
}
console.log('Report: ' + output);
const referenceResult = results.find(result => result.profile === 'reference');
if (referenceResult && referenceResult.status !== 'complete') process.exitCode = 1;
