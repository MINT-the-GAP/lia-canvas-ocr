// Shared handwritten-formula OCR for classic selections and multi-line
// calculations. The legacy LIA.ocr object remains available for compatibility;
// both canvas flows reuse this FormulaNet instance through LIA.canvasPlusOcr.

import { LIA } from '../index';
import { ensureOcrBar } from './bar';

export const CANVASPLUS_FORMULA_OCR_MODEL = 'alephpi/FormulaNet';
export const CANVASPLUS_FORMULA_OCR_REVISION = '63e04c86fc96c2324811114351eeea8118bf6b28';

type FormulaRuntime = {
    VisionEncoderDecoderModel: any;
    PreTrainedTokenizer: any;
    Tensor: any;
    cat: (...args: any[]) => any;
    env: any;
    __url: string;
};

async function getFormulaRuntime(): Promise<FormulaRuntime> {
    if (LIA.canvasPlusTfjs?.VisionEncoderDecoderModel) return LIA.canvasPlusTfjs;

    LIA.canvasPlusTfjsLoad = LIA.canvasPlusTfjsLoad || (async () => {
        const urls = [
            'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1/+esm',
            'https://esm.sh/@huggingface/transformers@3.8.1?bundle'
        ];
        let lastError: unknown = null;

        for (const url of urls) {
            try {
                const mod = await (new Function('u', 'return import(u)'))(url);
                const api: FormulaRuntime = {
                    VisionEncoderDecoderModel: mod.VisionEncoderDecoderModel || mod.default?.VisionEncoderDecoderModel,
                    PreTrainedTokenizer: mod.PreTrainedTokenizer || mod.default?.PreTrainedTokenizer,
                    Tensor: mod.Tensor || mod.default?.Tensor,
                    cat: mod.cat || mod.default?.cat,
                    env: mod.env || mod.default?.env,
                    __url: url
                };
                if (!api.VisionEncoderDecoderModel || !api.PreTrainedTokenizer ||
                    !api.Tensor || !api.cat || !api.env) {
                    throw new Error('Transformers.js ESM exports for FormulaNet are missing.');
                }
                LIA.canvasPlusTfjs = api;
                return api;
            } catch (error) {
                lastError = error;
            }
        }

        throw lastError || new Error('Failed to load the handwritten-formula OCR runtime.');
    })();

    return await LIA.canvasPlusTfjsLoad;
}

function progressTo01(progress: unknown): number | null {
    if (typeof progress === 'number' && Number.isFinite(progress)) {
        const value = progress > 1 ? progress / 100 : progress;
        return Math.max(0, Math.min(1, value));
    }
    if (!progress || typeof progress !== 'object') return null;
    const value = progress as Record<string, unknown>;
    if (typeof value.progress === 'number' && Number.isFinite(value.progress)) {
        const normalized = value.progress > 1 ? value.progress / 100 : value.progress;
        return Math.max(0, Math.min(1, normalized));
    }
    if (typeof value.loaded === 'number' && typeof value.total === 'number' && value.total > 0) {
        return Math.max(0, Math.min(1, value.loaded / value.total));
    }
    return null;
}

async function sourceToCanvas(image: unknown): Promise<HTMLCanvasElement> {
    if (typeof HTMLCanvasElement !== 'undefined' && image instanceof HTMLCanvasElement) {
        return image;
    }

    if (typeof ImageData !== 'undefined' && image instanceof ImageData) {
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, image.width);
        canvas.height = Math.max(1, image.height);
        const context = canvas.getContext('2d', { willReadFrequently: true });
        if (!context) throw new Error('Could not create the FormulaNet source canvas.');
        context.putImageData(image, 0, 0);
        return canvas;
    }

    let bitmap: ImageBitmap | null = null;
    try {
        if (typeof image === 'string') {
            const response = await fetch(image);
            if (!response.ok) throw new Error('Could not load the FormulaNet image input.');
            bitmap = await createImageBitmap(await response.blob());
        } else if (image instanceof Blob) {
            bitmap = await createImageBitmap(image);
        } else {
            const value = image as any;
            if (value && typeof value.convertToBlob === 'function') {
                bitmap = await createImageBitmap(await value.convertToBlob({ type: 'image/png' }));
            } else if (value && typeof value.toBlob === 'function') {
                const blob = await new Promise<Blob>((resolve, reject) => {
                    value.toBlob(
                        (result: Blob | null) => result
                            ? resolve(result)
                            : reject(new Error('FormulaNet toBlob() returned null.')),
                        'image/png'
                    );
                });
                bitmap = await createImageBitmap(blob);
            }
        }
        if (!bitmap) throw new Error('Unsupported FormulaNet image input.');
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, bitmap.width);
        canvas.height = Math.max(1, bitmap.height);
        const context = canvas.getContext('2d', { willReadFrequently: true });
        if (!context) throw new Error('Could not create the FormulaNet bitmap canvas.');
        context.fillStyle = '#fff';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(bitmap, 0, 0);
        return canvas;
    } finally {
        try { bitmap?.close(); } catch (_) { }
    }
}

async function prepareFormulaTensor(runtime: FormulaRuntime, image: unknown): Promise<any> {
    const source = await sourceToCanvas(image);
    const context = source.getContext('2d', { willReadFrequently: true });
    if (!context) throw new Error('Could not read the FormulaNet source image.');
    const pixels = context.getImageData(0, 0, source.width, source.height);
    const grey = new Uint8Array(source.width * source.height);
    let darkCount = 0;
    let lightCount = 0;

    for (let index = 0; index < grey.length; index++) {
        const offset = index * 4;
        const alpha = pixels.data[offset + 3] / 255;
        const red = pixels.data[offset] * alpha + 255 * (1 - alpha);
        const green = pixels.data[offset + 1] * alpha + 255 * (1 - alpha);
        const blue = pixels.data[offset + 2] * alpha + 255 * (1 - alpha);
        const value = Math.round(red * 0.299 + green * 0.587 + blue * 0.114);
        grey[index] = value;
        if (value < 200) darkCount++;
        else lightCount++;
    }

    // Texo accepts both themes by normalising to black ink on white paper.
    if (darkCount >= lightCount) {
        for (let index = 0; index < grey.length; index++) grey[index] = 255 - grey[index];
    }

    let minX = source.width;
    let minY = source.height;
    let maxX = -1;
    let maxY = -1;
    for (let y = 0; y < source.height; y++) {
        for (let x = 0; x < source.width; x++) {
            if (grey[y * source.width + x] >= 200) continue;
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
        }
    }
    if (maxX < minX || maxY < minY) throw new Error('FormulaNet received a blank line.');

    const cropWidth = maxX - minX + 1;
    const cropHeight = maxY - minY + 1;
    const cropped = document.createElement('canvas');
    cropped.width = cropWidth;
    cropped.height = cropHeight;
    const croppedContext = cropped.getContext('2d', { willReadFrequently: true });
    if (!croppedContext) throw new Error('Could not create the FormulaNet crop.');
    const cropPixels = croppedContext.createImageData(cropWidth, cropHeight);
    for (let y = 0; y < cropHeight; y++) {
        for (let x = 0; x < cropWidth; x++) {
            const value = grey[(minY + y) * source.width + minX + x];
            const offset = (y * cropWidth + x) * 4;
            cropPixels.data[offset] = value;
            cropPixels.data[offset + 1] = value;
            cropPixels.data[offset + 2] = value;
            cropPixels.data[offset + 3] = 255;
        }
    }
    croppedContext.putImageData(cropPixels, 0, 0);

    const targetSize = 384;
    const scale = Math.min(targetSize / cropWidth, targetSize / cropHeight);
    const drawWidth = Math.max(1, Math.round(cropWidth * scale));
    const drawHeight = Math.max(1, Math.round(cropHeight * scale));
    const prepared = document.createElement('canvas');
    prepared.width = targetSize;
    prepared.height = targetSize;
    const preparedContext = prepared.getContext('2d', { willReadFrequently: true });
    if (!preparedContext) throw new Error('Could not create the FormulaNet input.');
    preparedContext.fillStyle = '#000';
    preparedContext.fillRect(0, 0, targetSize, targetSize);
    preparedContext.imageSmoothingEnabled = true;
    preparedContext.drawImage(
        cropped,
        Math.floor((targetSize - drawWidth) / 2),
        Math.floor((targetSize - drawHeight) / 2),
        drawWidth,
        drawHeight
    );

    const preparedPixels = preparedContext.getImageData(0, 0, targetSize, targetSize);
    const values = new Float32Array(targetSize * targetSize);
    for (let index = 0; index < values.length; index++) {
        const offset = index * 4;
        const value = (
            preparedPixels.data[offset] * 0.299 +
            preparedPixels.data[offset + 1] * 0.587 +
            preparedPixels.data[offset + 2] * 0.114
        ) / 255;
        values[index] = (value - 0.7931) / 0.1738;
    }

    const channel = new runtime.Tensor('float32', values, [1, 1, targetSize, targetSize]);
    return runtime.cat([channel, channel, channel], 1);
}

export function ensureFormulaOcrEngine(): any {
    if (LIA.canvasPlusOcr) return LIA.canvasPlusOcr;

    const bar = ensureOcrBar();
    const engine = {
        model: CANVASPLUS_FORMULA_OCR_MODEL,
        modelRevision: CANVASPLUS_FORMULA_OCR_REVISION,
        task: 'image-to-text',
        precision: 'fp32',
        backend: 'wasm',
        cacheKey: CANVASPLUS_FORMULA_OCR_MODEL + '@' +
            CANVASPLUS_FORMULA_OCR_REVISION + '|formulanet-v1',
        domain: 'handwritten-math',
        outputKind: 'latex',
        inputProfile: 'formulanet-line-384',
        calculationSinglePass: true,
        modelInstance: null as any,
        tokenizer: null as any,
        runtime: null as FormulaRuntime | null,
        lastError: '',
        lastOutput: '',
        lastText: '',
        loading: null as Promise<any> | null,
        loadGeneration: 0,
        inferenceTail: Promise.resolve() as Promise<unknown>,

        async ensureLoaded(force?: boolean): Promise<any> {
            if (this.modelInstance && this.tokenizer && !force) return this;
            if (this.loading) return this.loading;

            const generation = ++this.loadGeneration;
            LIA.activeOcrLoadEngine = this;
            bar.set({
                model: this.model,
                backend: 'wasm',
                precision: 'fp32',
                status: 'loading',
                phase: 'import',
                loaded: false,
                progress: 0
            });
            bar.log('Loading FormulaNet OCR...');

            this.loading = (async () => {
                try {
                    const runtime = await getFormulaRuntime();
                    const { env, VisionEncoderDecoderModel, PreTrainedTokenizer } = runtime;
                    env.allowLocalModels = false;
                    env.allowRemoteModels = true;
                    env.useBrowserCache = true;
                    env.backends.onnx.wasm.numThreads = 1;
                    env.backends.onnx.wasm.proxy = true;

                    const progress_callback = (progress: unknown) => {
                        if (generation !== this.loadGeneration) return;
                        const value = progressTo01(progress);
                        if (value !== null) bar.set({ progress: value, phase: 'download' });
                    };
                    const [model, tokenizer] = await Promise.all([
                        VisionEncoderDecoderModel.from_pretrained(this.model, {
                            revision: this.modelRevision,
                            dtype: 'fp32',
                            progress_callback
                        }),
                        PreTrainedTokenizer.from_pretrained(this.model, {
                            revision: this.modelRevision,
                            progress_callback
                        })
                    ]);
                    if (generation !== this.loadGeneration) {
                        throw new Error('Discarded stale FormulaNet model load.');
                    }
                    this.runtime = runtime;
                    this.modelInstance = model;
                    this.tokenizer = tokenizer;
                    this.lastError = '';
                    bar.set({
                        model: this.model,
                        backend: 'wasm',
                        precision: 'fp32',
                        status: 'ready',
                        phase: 'ready',
                        loaded: true,
                        progress: null
                    });
                    bar.log('FormulaNet OCR ready.');
                    return this;
                } catch (error) {
                    this.lastError = error && (error as any).message
                        ? String((error as any).message)
                        : String(error);
                    if (generation === this.loadGeneration) {
                        bar.set({ status: 'error', phase: 'error', loaded: false, progress: null });
                    }
                    throw error;
                } finally {
                    if (generation === this.loadGeneration) this.loading = null;
                    if (LIA.activeOcrLoadEngine === this) LIA.activeOcrLoadEngine = null;
                }
            })();

            return this.loading;
        },

        async recognize(image: unknown, _options?: Record<string, any>): Promise<string> {
            const requestedMaxTokens = Number(_options?.max_new_tokens);
            const maxNewTokens = Number.isFinite(requestedMaxTokens)
                ? Math.max(1, Math.min(256, Math.floor(requestedMaxTokens)))
                : 64;
            const run = async (): Promise<string> => {
                await this.ensureLoaded(false);
                bar.set({ status: 'working', phase: 'infer', progress: null });
                try {
                    const pixelValues = await prepareFormulaTensor(this.runtime!, image);
                    const output = await this.modelInstance.generate({
                        inputs: pixelValues,
                        max_new_tokens: maxNewTokens,
                        do_sample: _options?.do_sample === true
                    });
                    const decoded = this.tokenizer.batch_decode(output, {
                        skip_special_tokens: true
                    });
                    const text = String(decoded?.[0] || '').trim();
                    this.lastOutput = JSON.stringify(decoded || []);
                    this.lastText = text;
                    this.lastError = '';
                    bar.set({ status: 'ready', phase: 'ready' });
                    return text;
                } catch (error) {
                    this.lastError = error && (error as any).message
                        ? String((error as any).message)
                        : String(error);
                    bar.set({ status: 'error', phase: 'error' });
                    throw error;
                }
            };

            const result = this.inferenceTail.then(run, run);
            this.inferenceTail = result.then(() => undefined, () => undefined);
            return await result;
        }
    };

    LIA.canvasPlusOcr = engine;
    return engine;
}

// Preserve the established export for downstream code while the engine is now
// shared by @canvas and @BerechneOCR.
export const ensureCanvasPlusFormulaOcrEngine = ensureFormulaOcrEngine;
