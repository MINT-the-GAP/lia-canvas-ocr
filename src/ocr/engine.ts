// OCR engine: Transformers.js pipeline loader and image recognizer.

import { LIA } from '../index';
import { ensureOcrBar } from './bar';

async function __ocrGetTransformers(): Promise<any> {
    if (LIA.tfjs && LIA.tfjs.pipeline) return LIA.tfjs;

    LIA.tfjsLoad = LIA.tfjsLoad || (async () => {
        const URLS = [
            'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2/+esm',
            'https://esm.sh/@xenova/transformers@2.17.2?bundle'
        ];

        let lastErr: unknown = null;

        for (const url of URLS) {
            try {
                try {
                    const b = LIA.bar;
                    if (b && b.log) b.log('Importing Transformers.js: ' + url);
                } catch (_) { }

                const mod = await (new Function('u', 'return import(u)'))(url);

                const pipeline = mod.pipeline || (mod.default && mod.default.pipeline);
                const env = mod.env || (mod.default && mod.default.env);

                if (!pipeline || !env) {
                    throw new Error('Transformers.js ESM export missing (pipeline/env).');
                }

                const api = { pipeline, env, __url: url };
                LIA.tfjs = api;
                return api;

            } catch (e) {
                lastErr = e;
                try {
                    const b = LIA.bar;
                    if (b && b.log) b.log('Import failed: ' + url + ' — ' + (e && (e as any).message ? (e as any).message : String(e)));
                } catch (_) { }
            }
        }

        throw lastErr || new Error('Failed to load Transformers.js from all CDN URLs.');
    })();

    return await LIA.tfjsLoad;
}

function __ocrProgressTo01(p: unknown): number | null {
    try {
        if (p === null || p === undefined) return null;
        if (typeof p === 'number' && isFinite(p)) return Math.max(0, Math.min(1, p));
        const obj = (p && typeof p === 'object') ? p as Record<string, any> : null;
        if (!obj) return null;
        if (isFinite(obj.progress)) return Math.max(0, Math.min(1, Number(obj.progress)));
        if (isFinite(obj.loaded) && isFinite(obj.total) && Number(obj.total) > 0) {
            return Math.max(0, Math.min(1, Number(obj.loaded) / Number(obj.total)));
        }
    } catch (_) { }
    return null;
}

export function ensureOcrEngine(): any {
    if (LIA.ocr) return LIA.ocr;

    const bar = ensureOcrBar();

    const engine = {
        model: bar.get().model || 'Xenova/trocr-small-handwritten',
        task: 'image-to-text',
        precision: bar.get().precision || 'fp32',
        pipe: null as any,
        loading: null as Promise<any> | null,

        async setModel(m: string): Promise<any> {
            const next = String(m || this.model || 'Xenova/texify2');
            this.model = next;
            bar.set({ model: next, loaded: false, status: 'idle', phase: 'idle', progress: null });
            this.pipe = null;
            this.loading = null;
            return this.ensureLoaded(true);
        },

        async setPrecision(p: string): Promise<any> {
            const next = String(p || 'fp32');
            this.precision = next;
            bar.set({ precision: next, loaded: false, status: 'idle', phase: 'idle', progress: null });
            this.pipe = null;
            this.loading = null;
            return this.ensureLoaded(true);
        },

        async ensureLoaded(force?: boolean): Promise<any> {
            if (this.pipe && !force) return this.pipe;
            if (this.loading) return this.loading;

            const prec = this.precision || 'fp32';
            const dtypeMap: Record<string, string> = { fp32: 'fp32', fp16: 'fp16', int8: 'q8' };
            const dtype = dtypeMap[prec] || 'fp32';

            bar.set({
                model: this.model,
                backend: 'wasm',
                precision: prec,
                status: 'loading',
                phase: 'import',
                loaded: false,
                progress: 0
            });
            bar.log('Loading model (' + prec + ') …');

            const LOAD_TIMEOUT_MS = 60_000;
            let timeoutId: ReturnType<typeof setTimeout> | null = null;
            const timeoutPromise = new Promise<never>((_, reject) => {
                timeoutId = setTimeout(() => reject(new Error('OCR model load timed out after 60s')), LOAD_TIMEOUT_MS);
            });

            this.loading = (async () => {
                try {
                    const t = await Promise.race([__ocrGetTransformers(), timeoutPromise]);
                    const { pipeline, env } = t;

                    try {
                        env.allowLocalModels = false;
                        env.allowRemoteModels = true;
                        env.useBrowserCache = true;
                        env.backends = env.backends || {};
                        env.backends.onnx = env.backends.onnx || {};
                        env.backends.onnx.wasm = env.backends.onnx.wasm || {};
                    } catch (_) { }

                    bar.set({ phase: 'pipeline' });

                    const pipe = await Promise.race([
                        pipeline(this.task, this.model, {
                            dtype,
                            progress_callback: (p: unknown) => {
                                const v = __ocrProgressTo01(p);
                                if (v !== null) bar.set({ progress: v, phase: 'download' });
                            }
                        }),
                        timeoutPromise
                    ]);

                    this.pipe = pipe;
                    bar.set({ status: 'ready', phase: 'ready', loaded: true, progress: null });
                    bar.log('Model loaded (' + prec + ').');
                    return pipe;

                } catch (err) {
                    bar.set({ status: 'error', phase: 'error', loaded: false, progress: null });
                    bar.log('Load failed: ' + (err && (err as any).message ? (err as any).message : String(err)));
                    throw err;
                } finally {
                    if (timeoutId !== null) clearTimeout(timeoutId);
                    this.loading = null;
                }
            })();

            return this.loading;
        },

        async recognize(image: unknown, opts?: Record<string, any>): Promise<string> {
            const o = (opts && typeof opts === 'object') ? opts : {};
            const silent = (o.__silent === true);

            const pipe = await this.ensureLoaded(false);
            bar.set({ status: 'working', phase: 'infer', progress: null });

            let revoke: (() => void) | null = null;

            async function toBlobFromCanvasLike(c: any): Promise<Blob> {
                if (c && typeof c.convertToBlob === 'function') {
                    return await c.convertToBlob({ type: 'image/png' });
                }
                if (c && typeof c.toBlob === 'function') {
                    return await new Promise<Blob>((resolve, reject) => {
                        c.toBlob((b: Blob | null) => b ? resolve(b) : reject(new Error('toBlob() returned null')), 'image/png');
                    });
                }
                throw new Error('Canvas-like has no toBlob/convertToBlob');
            }

            function isImageDataLike(x: unknown): x is { width: number; height: number; data: ArrayLike<number> } {
                return !!(x && typeof x === 'object'
                    && typeof (x as any).width === 'number'
                    && typeof (x as any).height === 'number'
                    && (x as any).data && typeof (x as any).data.length === 'number');
            }

            function isBlobLike(x: unknown): boolean {
                return !!(x && typeof x === 'object'
                    && typeof (x as any).arrayBuffer === 'function'
                    && typeof (x as any).size === 'number'
                    && typeof (x as any).type === 'string');
            }

            async function normalizeToPipeInput(x: unknown): Promise<{ input: string; revoke: (() => void) | null }> {
                if (typeof x === 'string') return { input: x, revoke: null };

                if (isBlobLike(x)) {
                    const url = URL.createObjectURL(x as Blob);
                    return { input: url, revoke: () => URL.revokeObjectURL(url) };
                }

                if (isImageDataLike(x)) {
                    const c = document.createElement('canvas');
                    c.width = Math.max(1, Math.floor(x.width));
                    c.height = Math.max(1, Math.floor(x.height));
                    const cx = c.getContext('2d', { willReadFrequently: true })!;
                    cx.putImageData(x as ImageData, 0, 0);
                    const blob = await toBlobFromCanvasLike(c);
                    const url = URL.createObjectURL(blob);
                    return { input: url, revoke: () => URL.revokeObjectURL(url) };
                }

                if (x && typeof x === 'object') {
                    if (typeof (x as any).toDataURL === 'function') {
                        const url = (x as any).toDataURL('image/png');
                        return { input: url, revoke: null };
                    }
                    if (typeof (x as any).toBlob === 'function' || typeof (x as any).convertToBlob === 'function') {
                        const blob = await toBlobFromCanvasLike(x);
                        const url2 = URL.createObjectURL(blob);
                        return { input: url2, revoke: () => URL.revokeObjectURL(url2) };
                    }
                }

                throw new Error('Unsupported input type for OCR: ' + (x === null ? 'null' : typeof x));
            }

            try {
                const norm = await normalizeToPipeInput(image);
                revoke = norm.revoke;

                const maxNew = (typeof o.max_new_tokens === 'number' && isFinite(o.max_new_tokens))
                    ? Math.max(1, Math.floor(o.max_new_tokens))
                    : 96;

                const out = await pipe(norm.input, {
                    max_new_tokens: maxNew,
                    do_sample: (o.do_sample === true),
                    temperature: (typeof o.temperature === 'number' && isFinite(o.temperature)) ? o.temperature : 0
                });

                let s = '';
                if (typeof out === 'string') {
                    s = out;
                } else if (Array.isArray(out) && out.length) {
                    const r0 = out[0] || {};
                    s = r0.generated_text || r0.text || r0.latex || '';
                    if (!s) s = JSON.stringify(r0);
                } else if (out && typeof out === 'object') {
                    s = (out as any).generated_text || (out as any).text || (out as any).latex || '';
                    if (!s) s = JSON.stringify(out);
                } else {
                    s = String(out);
                }

                bar.set({ status: 'ready', phase: 'ready' });
                if (!silent) bar.log('Recognize done.');
                return s;

            } catch (err) {
                bar.set({ status: 'error', phase: 'error' });
                if (!silent) bar.log('Recognize failed: ' + (err && (err as any).message ? (err as any).message : String(err)));
                throw err;
            } finally {
                try { if (revoke) revoke(); } catch (_) { }
            }
        }
    };

    LIA.ocr = engine;
    return engine;
}
