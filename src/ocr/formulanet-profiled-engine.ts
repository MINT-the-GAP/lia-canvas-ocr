// Explicit development profiles. The production default is selected separately.
import { LIA } from '../index';
import { ensureOcrBar } from './bar';
import { prepareFormulaPlane } from './formulanet-input';
import { CANVASPLUS_FORMULA_OCR_MODEL, CANVASPLUS_FORMULA_OCR_REVISION } from './formulanet-engine';
import { resolveFormulaOcrProfile, type FormulaOcrProfileId } from './formulanet-profiles';

export type FormulaOcrArtifactOptions = {
    model?: string;
    revision?: string;
    assetBaseUrl?: string;
    weightPrecision?: string;
};

type Pending = {
    resolve: (value: any) => void;
    reject: (error: Error) => void;
    timer: ReturnType<typeof setTimeout>;
};

export function createProfiledFormulaOcrEngine(
    profileId: FormulaOcrProfileId,
    options: FormulaOcrArtifactOptions = {}
): any {
    const profile = resolveFormulaOcrProfile(profileId, {
        crossOriginIsolated: globalThis.crossOriginIsolated === true,
        hardwareConcurrency: navigator.hardwareConcurrency || 1,
        webgpu: Boolean((navigator as any).gpu)
    });
    const model = options.model || CANVASPLUS_FORMULA_OCR_MODEL;
    const revision = options.revision || CANVASPLUS_FORMULA_OCR_REVISION;
    const precision = options.weightPrecision || 'fp32';
    const assetBaseUrl = options.assetBaseUrl;
    const backend = typeof profile.device === 'string' ? profile.device : profileId;
    const bar = ensureOcrBar();
    let worker: Worker | null = null;
    let sequence = 0;
    let disposed = false;
    let ready = false;
    const pending = new Map<number, Pending>();

    function stop(error: Error): void {
        worker?.terminate();
        worker = null;
        ready = false;
        for (const request of pending.values()) {
            clearTimeout(request.timer);
            request.reject(error);
        }
        pending.clear();
    }

    function getWorker(): Worker {
        if (disposed) throw new Error('This OCR profile has been disposed.');
        if (worker) return worker;
        worker = new Worker(new URL('./formulanet-worker.ts', import.meta.url), { type: 'module' });
        const created = worker;
        worker.onmessage = event => {
            if (worker !== created) return;
            const message = event.data;
            const request = pending.get(message?.id);
            if (!request) return;
            if (message.type === 'progress') {
                const progress = Number(message.value?.progress);
                if (Number.isFinite(progress)) bar.set({ progress: Math.max(0, Math.min(1, progress / 100)), phase: 'download' });
                return;
            }
            clearTimeout(request.timer);
            pending.delete(message.id);
            if (message.type === 'result') request.resolve(message.value);
            else request.reject(new Error(String(message.error || 'OCR worker failed.')));
        };
        worker.onerror = event => { if (worker === created) stop(new Error(event.message || 'OCR worker failed to start.')); };
        worker.onmessageerror = () => { if (worker === created) stop(new Error('OCR worker returned an unreadable message.')); };
        return worker;
    }

    function request(type: string, payload: Record<string, unknown>, transfer: Transferable[] = []): Promise<any> {
        return new Promise((resolve, reject) => {
            const id = ++sequence;
            try {
                const activeWorker = getWorker();
                const timer = setTimeout(() => stop(new Error('OCR profile timed out: ' + type)),
                    type === 'load' ? 240_000 : 120_000);
                pending.set(id, { resolve, reject, timer });
                try { activeWorker.postMessage({ id, type, ...payload }, transfer); }
                catch (error) { stop(error instanceof Error ? error : new Error(String(error))); }
            } catch (error) { reject(error); }
        });
    }

    const engine = {
        model,
        modelRevision: revision,
        profileId,
        precision,
        backend,
        numThreads: profile.numThreads,
        // A profile never changes devices or artifacts after construction.
        cacheKey: [model + '@' + revision, 'formulanet-input-v1', 'transformers-3.8.1',
            profile.cacheSuffix, precision, assetBaseUrl || 'upstream'].join('|'),
        task: 'image-to-text',
        domain: 'handwritten-math',
        outputKind: 'latex',
        inputProfile: 'formulanet-line-384',
        calculationSinglePass: true,
        loading: null as Promise<any> | null,
        inferenceTail: Promise.resolve() as Promise<unknown>,
        runtimeInfo: null as any,
        lastTiming: null as { preprocessingMs: number; inferenceMs: number; totalMs: number; tokenCount?: number } | null,
        lastError: '',
        lastText: '',
        lastOutput: '',

        async ensureLoaded(force = false): Promise<any> {
            if (disposed) throw new Error('This OCR profile has been disposed.');
            if (this.loading) return this.loading;
            if (force) stop(new Error('OCR profile reload requested.'));
            if (ready) return this;
            LIA.activeOcrLoadEngine = this;
            bar.set({ model, backend, precision, status: 'loading', phase: 'import', loaded: false, progress: 0 });
            this.loading = (async () => {
                try {
                    const info = await request('load', { profile, model, revision, assetBaseUrl,
                        requiresShaderF16: backend.includes('webgpu') && precision.includes('fp16') });
                    this.runtimeInfo = info;
                    ready = true;
                    this.lastError = '';
                    bar.set({ model, backend, precision, status: 'ready', phase: 'ready', loaded: true, progress: null });
                    return this;
                } catch (error) {
                    this.lastError = String((error as any)?.message || error);
                    stop(error instanceof Error ? error : new Error(String(error)));
                    bar.set({ status: 'error', phase: 'error', loaded: false, progress: null });
                    throw error;
                } finally {
                    this.loading = null;
                    if (LIA.activeOcrLoadEngine === this) LIA.activeOcrLoadEngine = null;
                }
            })();
            return this.loading;
        },

        async recognize(image: unknown, options?: Record<string, any>): Promise<string> {
            const max = Number(options?.max_new_tokens);
            const maxNewTokens = Number.isFinite(max) ? Math.max(1, Math.min(256, Math.floor(max))) : 64;
            const run = async () => {
                await this.ensureLoaded(false);
                const started = performance.now();
                bar.set({ status: 'working', phase: 'infer', progress: null });
                try {
                    const plane = await prepareFormulaPlane(image);
                    const data = new Float32Array(plane.length * 3);
                    data.set(plane, 0); data.set(plane, plane.length); data.set(plane, plane.length * 2);
                    const preprocessingMs = performance.now() - started;
                    const result = await request('recognize', { data, maxNewTokens, doSample: options?.do_sample === true }, [data.buffer]);
                    this.lastText = String(result.text || '');
                    this.lastOutput = JSON.stringify([this.lastText]);
                    this.lastError = '';
                    this.lastTiming = { preprocessingMs, inferenceMs: result.inferenceMs,
                        totalMs: performance.now() - started, tokenCount: result.tokenCount };
                    bar.set({ status: 'ready', phase: 'ready' });
                    return this.lastText;
                } catch (error) {
                    this.lastError = String((error as any)?.message || error);
                    bar.set({ status: 'error', phase: 'error' });
                    throw error;
                }
            };
            const result = this.inferenceTail.then(run, run);
            this.inferenceTail = result.then(() => undefined, () => undefined);
            return result;
        },

        dispose(): void {
            disposed = true;
            stop(new Error('OCR profile disposed.'));
            this.lastText = '';
            this.lastOutput = '';
        }
    };
    return engine;
}
