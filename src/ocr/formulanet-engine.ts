// Shared handwritten-formula OCR for classic selections and multi-line
// calculations. The legacy LIA.ocr object remains available for compatibility;
// both canvas flows reuse this FormulaNet instance through LIA.canvasPlusOcr.

import { LIA } from '../index';
import { ensureOcrBar } from './bar';
import { prepareFormulaPlane } from './formulanet-input';

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

async function prepareFormulaTensor(runtime: FormulaRuntime, image: unknown): Promise<any> {
    const values = await prepareFormulaPlane(image);
    const channel = new runtime.Tensor('float32', values, [1, 1, 384, 384]);
    return runtime.cat([channel, channel, channel], 1);
}

let referenceEngine: any = null;

// Keep the reference independent from the explicitly selected canvas profile.
// Asking for a reference must neither return nor replace a selected worker.
export function getReferenceFormulaOcrEngine(): any {
    if (referenceEngine) return referenceEngine;

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

    referenceEngine = engine;
    return engine;
}

export function ensureFormulaOcrEngine(): any {
    if (LIA.canvasPlusOcr) return LIA.canvasPlusOcr;
    LIA.canvasPlusOcr = getReferenceFormulaOcrEngine();
    return LIA.canvasPlusOcr;
}

// Preserve the established export for downstream code while the engine is now
// shared by @canvas and @BerechneOCR.
export const ensureCanvasPlusFormulaOcrEngine = ensureFormulaOcrEngine;
