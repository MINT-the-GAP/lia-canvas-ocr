import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { stripTypeScriptTypes } from 'node:module';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { SYNTHETIC_LONG_EQUATION } from '../test/fixtures/ocr-equation-chunks.mts';
import { composeOcrEquationChunks } from '../src/ocr/equation-recognition.ts';

const root = fileURLToPath(new URL('../', import.meta.url));
const args = process.argv.slice(2);
const options = new Map<string, string>();
let rasterOnly = false;
for (let index = 0; index < args.length; index++) {
    const key = args[index];
    if (key === '--help') {
        console.log('Usage: benchmark-ocr-layout.mts [--assets DIR] [--output FILE] [--repeats 1..10] [--validate-raster]');
        process.exit(0);
    }
    if (key === '--validate-raster') {
        if (rasterOnly) throw new Error('Repeated option: ' + key);
        rasterOnly = true;
        continue;
    }
    if (!['--assets', '--output', '--repeats'].includes(key)) throw new Error('Unknown option: ' + key);
    if (options.has(key)) throw new Error('Repeated option: ' + key);
    const value = args[++index];
    if (!value || value.startsWith('--')) throw new Error('Missing value for ' + key);
    options.set(key, value);
}
const assets = resolve(options.get('--assets') || join(tmpdir(), 'lia-ocr-priority2-models'));
const output = resolve(options.get('--output') || join(tmpdir(),
    rasterOnly ? 'lia-ocr-priority3-raster-check.json' : 'lia-ocr-priority3-model-check.json'));
const repeats = Number(options.get('--repeats') || '3');
if (!Number.isInteger(repeats) || repeats < 1 || repeats > 10) throw new Error('--repeats must be 1..10.');
const revision = '63e04c86fc96c2324811114351eeea8118bf6b28';
const manifest = JSON.parse(await readFile(join(assets, 'manifest.json'), 'utf8'));
if (manifest.model !== 'alephpi/FormulaNet' || manifest.revision !== revision ||
    manifest.variants?.fp32?.status !== 'checked') throw new Error('Prepare the pinned FP32 model assets first.');
const files: Record<string, Buffer> = {};
const checksums: Record<string, string> = {};
const inputPaths = new Set([resolve(assets, 'manifest.json'), resolve(root, 'dist/index.js'),
    fileURLToPath(import.meta.url)]);
for (const file of manifest.variants.fp32.files) {
    const prefix = 'fp32/' + revision + '/';
    if (!file.path.startsWith(prefix) || !new RegExp('^(?:onnx/)?[A-Za-z0-9_.-]+$').test(file.path.slice(prefix.length))) throw new Error('Invalid model manifest path.');
    inputPaths.add(resolve(assets, file.path));
    const body = await readFile(join(assets, file.path));
    const checksum = createHash('sha256').update(body).digest('hex');
    if (checksum !== file.sha256) throw new Error('Checksum mismatch: ' + file.path);
    files['/models/' + file.path.slice(prefix.length)] = body;
    checksums[file.path.slice(prefix.length)] = checksum;
}
const bundle = await readFile(join(root, 'dist/index.js'));
const sourceHashes: Record<string, string> = {};
const source = async (path: string): Promise<string> => {
    const absolute = resolve(root, path);
    inputPaths.add(absolute);
    const text = await readFile(absolute, 'utf8');
    sourceHashes[path] = createHash('sha256').update(text).digest('hex');
    return text;
};
const modulePaths = [
    'src/ocr/equation-chunks.ts', 'src/ocr/layout.ts', 'src/ocr/spatial-layout.ts',
    'src/ocr/symbol-geometry.ts', 'src/ocr/math-notation.ts', 'src/canvas/stroke-rendering.ts',
];
for (const path of modulePaths) {
    const compiled = stripTypeScriptTypes(await source(path), { mode: 'strip' })
        .replace(/(\bfrom\s+['"]\.[^'"]*)\.ts(['"])/g, '$1.js$2');
    files['/helpers/' + path.slice(4).replace(/\.ts$/, '.js')] = Buffer.from(compiled);
}
const canvasSource = await source('src/canvas/index.ts');
await source('src/ocr/equation-recognition.ts');
const section = (startMarker: string, endMarker: string): string => {
    const start = canvasSource.indexOf(startMarker);
    const end = canvasSource.indexOf(endMarker, start + startMarker.length);
    if (start < 0 || end <= start || canvasSource.indexOf(startMarker, start + startMarker.length) >= 0) {
        throw new Error('The production raster helper changed; review benchmark extraction: ' + startMarker);
    }
    return canvasSource.slice(start, end);
};
const constant = (name: string): string => {
    const found = canvasSource.match(new RegExp('const ' + name + ' = ([0-9]+);'));
    if (!found) throw new Error('The production raster limit changed: ' + name);
    return 'const ' + name + ' = ' + found[1] + ';';
};
// Reuse the actual production prefix through the binary crop and world bounds.
// The remaining vector hints do not alter pixels; they belong to UI/operation
// recognition, which this direct model comparison deliberately does not run.
const cropPrefix = section('    function __plusCropAllInk()', '        const hintPathItems = ITEMS.filter');
if (!cropPrefix.includes('__liaOcrWorldBounds') || !cropPrefix.includes('outputContext.putImageData(binary, 0, 0)')) {
    throw new Error('Production crop extraction did not include its binary raster.');
}
const rendererSource = [
    "import { paintStrokePath } from './canvas/stroke-rendering.js';",
    section('    function __ocrSquashWS(', '    function __ocrUnwrapRoman('),
    section('    function __ocrInkBBoxQuick(', '    type OcrRasterDigitComponent ='),
    section('    function __ocrSliceCanvas(', '    function __ocrCropColumnOperandWithoutLeadingOperator('),
    'export { __ocrCleanLatex as cleanLatex, __ocrInkBBoxQuick as inkBounds, __ocrSliceCanvas as sliceCrop };',
    'export function renderCalculationSample(sample: any): HTMLCanvasElement | null {',
    'const ITEMS = sample.strokes.map((points: any) => ({ kind: "path", tool: "pen", width: sample.lineWidth, points }));',
    'const isCanvasPlus = true;',
    'let __plusRasterInkState = "unknown";',
    'const __plusHasVisibleInkItems = () => ITEMS.length > 0;',
    'const __plusSelectionBounds = (): { x0: number; y0: number; x1: number; y1: number } | null => null;',
    constant('PLUS_OCR_MAX_RASTER_PIXELS'),
    constant('PLUS_OCR_MAX_RASTER_SIDE'),
    cropPrefix,
    'return output;',
    '}',
    'return __plusCropAllInk();',
    '}',
].join('\n');
files['/helpers/raster.js'] = Buffer.from(stripTypeScriptTypes(rendererSource, { mode: 'strip' }));
// Refuse accidental replacement of an input/model file by the JSON report.
if (Array.from(inputPaths).some(path => process.platform === 'win32'
    ? path.toLowerCase() === output.toLowerCase() : path === output)) throw new Error('--output must not overwrite a benchmark input.');
const server = createServer((request, response) => {
    const path = new URL(request.url || '/', 'http://localhost').pathname;
    const headers = { 'access-control-allow-origin': '*', 'cache-control': 'no-store' };
    if (path === '/') {
        response.writeHead(200, { ...headers, 'content-type': 'text/html' });
        response.end('<!doctype html><meta charset="utf-8"><script src="/dist/index.js"></script>');
    } else {
        const body = path === '/dist/index.js' ? bundle : files[path];
        if (!body) { response.writeHead(404, headers); response.end(); return; }
        response.writeHead(200, { ...headers, 'content-type': path.endsWith('.js') ? 'text/javascript'
            : path.endsWith('.json') ? 'application/json' : 'application/octet-stream' });
        response.end(body);
    }
});
await new Promise<void>((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
const address = server.address();
if (!address || typeof address === 'string') throw new Error('No local server address.');
const base = 'http://127.0.0.1:' + address.port;
let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
let deadline: ReturnType<typeof setTimeout> | undefined;
const report: any = {
    schema: 2, measuredAt: new Date().toISOString(), synthetic: true, rasterOnly,
    scope: 'One authored long equation. Actual production stroke painter, world-crop prefix (including raster origin, padding, limits and alpha binarization), line segmenter, slice helper, ink bounds, geometry planner and output cleanup. Direct reference-model inference bypasses UI, operation/delimiter orchestration, automatic fallback and recognition caches; those are tested separately. No selection or eraser strokes exist in this fixture. This is not a handwriting accuracy study.',
    model: manifest.model, revision, checksums, repeats,
    bundleSha256: createHash('sha256').update(bundle).digest('hex'),
    sourceHashes,
    benchmarkSha256: createHash('sha256').update(await readFile(fileURLToPath(import.meta.url))).digest('hex'),
    rendererSha256: createHash('sha256').update(rendererSource).digest('hex'),
    selectedMode: 'chunks-right-context',
    sample: SYNTHETIC_LONG_EQUATION, runs: [], status: 'starting',
};
try {
    browser = await chromium.launch({ channel: 'chromium', headless: true });
    deadline = setTimeout(() => { void browser?.close(); }, 240_000);
    const context = await browser.newContext({ serviceWorkers: 'block', deviceScaleFactor: 1 });
    await context.route('https://huggingface.co/alephpi/FormulaNet/resolve/' + revision + '/**', async route => {
        const suffix = new URL(route.request().url()).pathname.split('/resolve/' + revision + '/')[1];
        await route.fulfill({ status: 307, headers: { location: base + '/models/' + suffix, 'access-control-allow-origin': '*' } });
    });
    const page = await context.newPage();
    const pageErrors: string[] = [];
    page.on('pageerror', error => pageErrors.push(String(error)));
    await page.goto(base);
    await page.waitForFunction(() => typeof (window as any).__LIA_CANVAS_OCR__?.createFormulaOcrEngine === 'function');
    Object.assign(report, await page.evaluate(async ({ sample, base, rasterOnly }) => {
        const [raster, layout, planner, notation] = await Promise.all([
            import(base + '/helpers/raster.js'), import(base + '/helpers/ocr/layout.js'),
            import(base + '/helpers/ocr/equation-chunks.js'), import(base + '/helpers/ocr/math-notation.js'),
        ]);
        const documentCrop = raster.renderCalculationSample(sample);
        if (!documentCrop) throw new Error('Production crop preparation returned no ink.');
        const segments = layout.segmentOcrCanvas(documentCrop, (documentCrop as any).__liaOcrPixelScale);
        if (segments.length !== 1) throw new Error('This fixture must form exactly one production equation row.');
        const canvas = segments[0].canvas;
        const ink = raster.inkBounds(canvas);
        if (!ink) throw new Error('The production line crop has no ink.');
        const image = canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height);
        const mask = new Uint8Array(canvas.width * canvas.height);
        for (let i = 0; i < mask.length; i++) {
            const offset = i * 4;
            const alpha = image.data[offset + 3] / 255;
            const grey = image.data[offset] * 0.299 + image.data[offset + 1] * 0.587 + image.data[offset + 2] * 0.114;
            mask[i] = 255 - alpha * (255 - grey) < 200 ? 1 : 0;
        }
        const plan = planner.planOcrEquationChunks(mask, canvas.width, canvas.height, (canvas as any).__liaOcrPixelScale);
        if (!plan) throw new Error('The authored production raster must have a safe geometry plan.');
        const wholeBudget = planner.getOcrEquationTokenBudget(ink.w, ink.h);
        const pixelInfo = async (input: HTMLCanvasElement) => {
            const pixels = input.getContext('2d')!.getImageData(0, 0, input.width, input.height).data;
            const digest = await crypto.subtle.digest('SHA-256', pixels);
            let nonBinaryPixels = 0;
            for (let i = 0; i < pixels.length; i += 4) {
                if (!((pixels[i] === 0 || pixels[i] === 255) && pixels[i] === pixels[i + 1] &&
                    pixels[i] === pixels[i + 2] && pixels[i + 3] === 255)) nonBinaryPixels++;
            }
            const measuredInk = raster.inkBounds(input);
            // Avoid w/W and h/H JSON keys: Windows PowerShell treats them as duplicates.
            const ink = measuredInk ? { xMin: measuredInk.xMin, yMin: measuredInk.yMin,
                xMax: measuredInk.xMax, yMax: measuredInk.yMax, w: measuredInk.w, h: measuredInk.h,
                black: measuredInk.black } : null;
            return { width: input.width, height: input.height, ink,
                rgbaSha256: Array.from(new Uint8Array(digest), value => value.toString(16).padStart(2, '0')).join(''),
                nonBinaryPixels };
        };
        const modes = ['whole-64', 'whole-adaptive', 'chunks', 'chunks-right-context', 'chunks-both-context'];
        const inputsByMode: Record<string, HTMLCanvasElement[]> = {};
        const modeInputs: Record<string, any[]> = {};
        for (const mode of modes) {
            const inputs = mode.startsWith('chunks') ? plan.ranges.map((range: { x0: number; x1: number }, index: number) => {
                const x0 = mode.includes('context') && index > 0 ? plan.separators[index - 1].x0 : range.x0;
                const x1 = mode === 'chunks-both-context' && index < plan.separators.length
                    ? plan.separators[index].x1 : range.x1;
                const crop = raster.sliceCrop(canvas, x0, x1 - 1);
                if (!crop || !raster.inkBounds(crop)) throw new Error('A production slice has no ink.');
                return crop;
            }) : [canvas];
            inputsByMode[mode] = inputs;
            modeInputs[mode] = await Promise.all(inputs.map(async (input: HTMLCanvasElement) => {
                const info = await pixelInfo(input);
                if (info.nonBinaryPixels) throw new Error('The production comparison input must remain binary.');
                return { ...info, maxNewTokens: mode === 'whole-64' ? 64
                    : planner.getOcrEquationTokenBudget(info.ink.w, info.ink.h) };
            }));
        }
        let engine: any = null;
        let loadMs: number | null = null, firstInferenceMs: number | null = null;
        if (!rasterOnly) {
            engine = (window as any).__LIA_CANVAS_OCR__.createFormulaOcrEngine('reference');
            const loadStart = performance.now();
            await engine.ensureLoaded();
            loadMs = performance.now() - loadStart;
            const warmStart = performance.now();
            await engine.recognize(canvas, { max_new_tokens: 64, do_sample: false });
            firstInferenceMs = performance.now() - warmStart;
        }
        (window as any).__layoutProbe = { engine, inputsByMode, modeInputs,
            cleanLatex: raster.cleanLatex, normalize: notation.normalizeCalculationNotation };
        return {
            loadMs, firstInferenceMs, plan, wholeBudget, modeInputs,
            raster: { documentCrop: await pixelInfo(documentCrop), lineCrop: await pixelInfo(canvas),
                worldBounds: (documentCrop as any).__liaOcrWorldBounds,
                pixelScale: (documentCrop as any).__liaOcrPixelScale, lineBbox: segments[0].bbox,
                lineInkBox: segments[0].inkBox, layoutVersion: layout.OCR_LAYOUT_ALGORITHM_VERSION },
            environment: { userAgent: navigator.userAgent, crossOriginIsolated,
                hardwareConcurrency: navigator.hardwareConcurrency, devicePixelRatio },
            loadMeasurement: rasterOnly ? 'Raster validation only: no OCR model was loaded or run.'
                : 'Verified weights served locally; pinned runtime modules load from an external CDN.',
        };
    }, { sample: SYNTHETIC_LONG_EQUATION, base, rasterOnly }));
    if (!rasterOnly) {
        for (const mode of ['whole-64', 'whole-adaptive', 'chunks', 'chunks-right-context', 'chunks-both-context']) {
            for (let repeat = 0; repeat < repeats; repeat++) {
                const run = await page.evaluate(async mode => {
                    const probe = (window as any).__layoutProbe;
                    const inputs = probe.inputsByMode[mode] as HTMLCanvasElement[];
                    const rawParts: string[] = [];
                    const tokenBudgets = probe.modeInputs[mode].map((info: any) => info.maxNewTokens);
                    const start = performance.now();
                    for (let index = 0; index < inputs.length; index++) {
                        rawParts.push(await probe.engine.recognize(inputs[index], {
                            max_new_tokens: tokenBudgets[index], do_sample: false,
                        }));
                    }
                    return { mode, rawParts, tokenBudgets, wallMs: performance.now() - start,
                        normalizedParts: rawParts.map(value => probe.normalize(probe.cleanLatex(value))) };
                }, mode);
                // The both-context mode is an explicitly experimental comparison.
                // The selected right-context mode uses the production composer.
                const compositionParts = mode === 'chunks-both-context'
                    ? run.normalizedParts.map((part: string, index: number) => index < run.normalizedParts.length - 1
                        ? part.trim().replace(/=$/, '').trim() : part)
                    : run.normalizedParts;
                const composed = mode.startsWith('chunks')
                    ? composeOcrEquationChunks(compositionParts, mode.includes('context')) : compositionParts[0];
                report.runs.push({ ...run, repeat, compositionParts, composed,
                    exactIgnoringWhitespace: composed?.replace(/\s/g, '') === SYNTHETIC_LONG_EQUATION.expectedLatex.replace(/\s/g, '') });
            }
        }
    }
    report.pageErrors = pageErrors;
    report.status = pageErrors.length ? 'page-error' : rasterOnly ? 'raster-validated' : 'complete';
    if (pageErrors.length) process.exitCode = 1;
} catch (error) {
    report.status = 'failed'; report.error = String(error); process.exitCode = 1;
} finally {
    clearTimeout(deadline);
    await browser?.close();
    await new Promise<void>((resolve, reject) => { server.close(error => error ? reject(error) : resolve()); server.closeAllConnections(); });
    await mkdir(dirname(output), { recursive: true });
    await writeFile(output, JSON.stringify(report, null, 2) + '\n', 'utf8');
}
console.log('Report: ' + output);
for (const run of report.runs) console.log(run.mode + ': ' + JSON.stringify(run.composed));
