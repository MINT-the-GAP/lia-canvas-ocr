import {
    resolveFormulaOcrProfile,
    type FormulaOcrCapabilities,
    type FormulaOcrProfileConfig,
} from './formulanet-profiles';

type LoadRequest = {
    id: number;
    type: 'load';
    profile: FormulaOcrProfileConfig;
    model: string;
    revision: string;
    assetBaseUrl?: string;
    requiresShaderF16?: boolean;
};
type RecognizeRequest = {
    id: number;
    type: 'recognize';
    data: Float32Array;
    maxNewTokens: number;
    doSample: boolean;
};
type WorkerRequest = LoadRequest | RecognizeRequest | { id: number; type: 'dispose' };
type WorkerScope = {
    addEventListener(type: 'message', listener: (event: MessageEvent<WorkerRequest>) => void): void;
    postMessage(message: unknown): void;
    close(): void;
};
type FormulaRuntime = {
    __url: string;
    VisionEncoderDecoderModel: any;
    PreTrainedTokenizer: any;
    Tensor: any;
    env: any;
};
type ProbedCapabilities = FormulaOcrCapabilities & {
    adapterInfo: Record<string, string> | null;
    adapterFeatures: string[];
};

const scope = globalThis as unknown as WorkerScope;
let model: any = null;
let tokenizer: any = null;
let runtime: FormulaRuntime | null = null;
let loadedKey = '';
let loadedDetails: Record<string, unknown> | null = null;
let tail: Promise<void> = Promise.resolve();

async function importRuntime(): Promise<FormulaRuntime> {
    const urls = [
        'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1/+esm',
        'https://esm.sh/@huggingface/transformers@3.8.1?bundle',
    ];
    let lastError: unknown = null;
    for (const url of urls) {
        try {
            const mod = await (new Function('u', 'return import(u)'))(url);
            const api: FormulaRuntime = {
                __url: url,
                VisionEncoderDecoderModel: mod.VisionEncoderDecoderModel || mod.default?.VisionEncoderDecoderModel,
                PreTrainedTokenizer: mod.PreTrainedTokenizer || mod.default?.PreTrainedTokenizer,
                Tensor: mod.Tensor || mod.default?.Tensor,
                env: mod.env || mod.default?.env,
            };
            if (!api.VisionEncoderDecoderModel || !api.PreTrainedTokenizer || !api.Tensor || !api.env) {
                throw new Error('FormulaNet worker runtime exports are incomplete.');
            }
            return api;
        } catch (error) {
            lastError = error;
        }
    }
    throw lastError || new Error('Failed to import the FormulaNet worker runtime.');
}

async function probeCapabilities(): Promise<{ capabilities: ProbedCapabilities; adapter: any }> {
    const workerNavigator = (globalThis as any).navigator;
    let adapter: any = null;
    try { adapter = await workerNavigator?.gpu?.requestAdapter(); } catch (_) { }
    let info = adapter?.info;
    if (!info && typeof adapter?.requestAdapterInfo === 'function') {
        try { info = await adapter.requestAdapterInfo(); } catch (_) { }
    }
    const adapterInfo = info ? {
        vendor: String(info.vendor || ''),
        architecture: String(info.architecture || ''),
        device: String(info.device || ''),
        description: String(info.description || ''),
    } : null;
    return {
        adapter,
        capabilities: {
            crossOriginIsolated: (globalThis as any).crossOriginIsolated === true,
            hardwareConcurrency: Number(workerNavigator?.hardwareConcurrency) || 1,
            webgpu: Boolean(adapter),
            adapterInfo,
            adapterFeatures: adapter?.features ? Array.from(adapter.features, String).sort() : [],
        },
    };
}

async function disposeModel(): Promise<void> {
    const previous = model;
    model = null;
    tokenizer = null;
    loadedDetails = null;
    if (previous?.dispose) await previous.dispose();
}

type Settled<T> = { status: 'fulfilled'; value: T } | { status: 'rejected'; reason: unknown };

function settle<T>(promise: Promise<T>): Promise<Settled<T>> {
    return promise.then(
        value => ({ status: 'fulfilled' as const, value }),
        reason => ({ status: 'rejected' as const, reason }),
    );
}
async function load(request: LoadRequest): Promise<Record<string, unknown>> {
    const requestedKey = JSON.stringify([
        request.profile.id, request.model, request.revision, request.assetBaseUrl || '', request.requiresShaderF16 === true,
    ]);
    if (loadedKey && loadedKey !== requestedKey) {
        throw new Error('A FormulaNet worker has a fixed runtime profile; create a new worker to change it.');
    }
    if (model && tokenizer && loadedDetails) return loadedDetails;
    const { capabilities, adapter } = await probeCapabilities();
    if (request.requiresShaderF16 === true && !adapter?.features?.has('shader-f16')) {
        throw new Error('This FormulaNet FP16 artifact requires the WebGPU shader-f16 feature.');
    }
    const profile = resolveFormulaOcrProfile(request.profile.id, capabilities);
    if (request.profile.cacheSuffix !== profile.cacheSuffix
        || request.profile.numThreads !== profile.numThreads
        || request.profile.dtype !== profile.dtype
        || JSON.stringify(request.profile.device) !== JSON.stringify(profile.device)) {
        throw new Error('FormulaNet worker profile does not match its explicit runtime settings.');
    }
    if (profile.numThreads > 1) {
        if (typeof SharedArrayBuffer === 'undefined') {
            throw new Error('The requested WASM threads require SharedArrayBuffer in this worker.');
        }
        try {
            const memory = new WebAssembly.Memory({ initial: 1, maximum: 1, shared: true });
            if (!(memory.buffer instanceof SharedArrayBuffer)) throw new Error('No shared memory.');
        } catch (_) {
            throw new Error('The requested WASM threads require shared WebAssembly memory.');
        }
    }
    runtime = runtime || await importRuntime();
    const env = runtime.env;
    env.allowLocalModels = false;
    env.allowRemoteModels = true;
    env.useBrowserCache = true;
    if (request.assetBaseUrl) {
        const base = new URL(request.assetBaseUrl);
        if (base.protocol !== 'https:' && base.protocol !== 'http:') {
            throw new Error('FormulaNet development assets need an HTTP(S) base URL.');
        }
        env.remoteHost = base.href.endsWith('/') ? base.href : base.href + '/';
        env.remotePathTemplate = '{model}/{revision}/';
    }
    env.backends.onnx.wasm.numThreads = profile.numThreads;
    env.backends.onnx.wasm.proxy = false;
    if (profile.id === 'webgpu' || profile.id === 'webgpu-encoder' || profile.id === 'webgpu-decoder') {
        // Use the same adapter whose capabilities are reported to the caller.
        env.backends.onnx.webgpu.adapter = adapter;
    }
    loadedKey = requestedKey;
    const progress_callback = (value: unknown): void => {
        scope.postMessage({ id: request.id, type: 'progress', value });
    };
    const pending = await Promise.all([
        settle(runtime.VisionEncoderDecoderModel.from_pretrained(request.model, {
            revision: request.revision,
            dtype: profile.dtype,
            device: profile.device,
            progress_callback,
        })),
        settle(runtime.PreTrainedTokenizer.from_pretrained(request.model, {
            revision: request.revision,
            progress_callback,
        })),
    ]);
    const loadedModel = pending[0];
    const loadedTokenizer = pending[1];
    if (loadedModel.status === 'fulfilled') model = loadedModel.value;
    if (loadedTokenizer.status === 'fulfilled') tokenizer = loadedTokenizer.value;
    if (loadedModel.status === 'rejected' || loadedTokenizer.status === 'rejected') {
        const error = loadedModel.status === 'rejected' ? loadedModel.reason
            : (loadedTokenizer as { status: 'rejected'; reason: unknown }).reason;
        await disposeModel();
        throw error;
    }
    if (Number(env.backends.onnx.wasm.numThreads) !== profile.numThreads) {
        await disposeModel();
        throw new Error('ONNX changed the requested WASM thread count; this profile cannot be measured as requested.');
    }
    const encoderDevice = model.sessions?.model?.config?.device;
    const decoderDevice = model.sessions?.decoder_model_merged?.config?.device;
    const encoderDtype = model.sessions?.model?.config?.dtype;
    const decoderDtype = model.sessions?.decoder_model_merged?.config?.dtype;
    const expectedEncoder = profile.id === 'wasm-1' || profile.id === 'wasm-2' || profile.id === 'wasm-4' || profile.id === 'webgpu-decoder'
        ? 'wasm' : 'webgpu';
    const expectedDecoder = profile.id === 'webgpu' || profile.id === 'webgpu-decoder' ? 'webgpu' : 'wasm';
    if (encoderDevice !== expectedEncoder || decoderDevice !== expectedDecoder
        || encoderDtype !== 'fp32' || decoderDtype !== 'fp32') {
        await disposeModel();
        throw new Error('FormulaNet sessions did not confirm the requested devices and precision.');
    }
    // Session configuration confirms EP selection, not placement of every op.
    // WebGPU may still use ONNX's internal CPU operator fallback.
    loadedDetails = {
        runtimeUrl: runtime.__url,
        backend: profile.id === 'webgpu-encoder' || profile.id === 'webgpu-decoder' ? profile.id
            : profile.id === 'webgpu' ? 'webgpu' : 'wasm',
        profileId: profile.id,
        precision: 'fp32',
        numThreads: profile.numThreads,
        devices: { encoder_model: encoderDevice, decoder_model_merged: decoderDevice },
        sessionPrecisions: { encoder_model: encoderDtype, decoder_model_merged: decoderDtype },
        capabilities,
    };
    return loadedDetails;
}

async function recognize(request: RecognizeRequest): Promise<Record<string, unknown>> {
    if (!model || !tokenizer || !runtime) throw new Error('Load the FormulaNet worker before recognition.');
    if (!(request.data instanceof Float32Array) || request.data.length !== 3 * 384 * 384) {
        throw new Error('FormulaNet needs a Float32Array with shape [1,3,384,384].');
    }
    const requestedTokens = Number(request.maxNewTokens);
    const maxNewTokens = Number.isFinite(requestedTokens)
        ? Math.max(1, Math.min(256, Math.floor(requestedTokens))) : 64;
    const started = performance.now();
    const inputs = new runtime.Tensor('float32', request.data, [1, 3, 384, 384]);
    let output: any = null;
    try {
        output = await model.generate({
            inputs,
            max_new_tokens: maxNewTokens,
            do_sample: request.doSample === true,
        });
        const decoded = tokenizer.batch_decode(output, { skip_special_tokens: true });
        const tokenCount = Number(output?.dims?.[1] ?? output?.data?.length);
        return {
            text: String(decoded?.[0] || '').trim(),
            ...(Number.isFinite(tokenCount) ? { tokenCount } : {}),
            inferenceMs: performance.now() - started,
        };
    } finally {
        if (inputs?.dispose) await inputs.dispose();
        if (output?.dispose) await output.dispose();
    }
}

async function handle(request: WorkerRequest): Promise<void> {
    try {
        let value: unknown;
        if (request.type === 'load') value = await load(request);
        else if (request.type === 'recognize') value = await recognize(request);
        else if (request.type === 'dispose') {
            await disposeModel();
            value = null;
        } else throw new Error('Unknown FormulaNet worker request.');
        scope.postMessage({ id: request.id, type: 'result', value });
        if (request.type === 'dispose') scope.close();
    } catch (error) {
        scope.postMessage({
            id: request.id,
            type: 'error',
            error: error instanceof Error ? error.message : String(error),
        });
    }
}

scope.addEventListener('message', event => {
    const request = event.data;
    if (!request || !Number.isSafeInteger(request.id)) return;
    // Keep ONNX sessions serial even if several canvases enqueue messages.
    tail = tail.then(() => handle(request), () => handle(request));
});
