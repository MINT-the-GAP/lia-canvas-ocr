export type FormulaOcrProfileId = 'wasm-1' | 'wasm-2' | 'wasm-4' | 'webgpu' | 'webgpu-encoder' | 'webgpu-decoder';

export type FormulaOcrCapabilities = {
    crossOriginIsolated: boolean;
    hardwareConcurrency: number;
    webgpu: boolean;
};

export type FormulaOcrDevice = 'wasm' | 'webgpu' | {
    encoder_model: 'webgpu';
    decoder_model_merged: 'wasm';
} | {
    encoder_model: 'wasm';
    decoder_model_merged: 'webgpu';
};

export type FormulaOcrProfileConfig = {
    id: FormulaOcrProfileId;
    device: FormulaOcrDevice;
    dtype: 'fp32';
    numThreads: number;
    cacheSuffix: string;
};

/** Resolve exactly the requested profile; unavailable profiles never downgrade. */
export function resolveFormulaOcrProfile(
    id: FormulaOcrProfileId,
    capabilities: FormulaOcrCapabilities,
): FormulaOcrProfileConfig {
    if (!['wasm-1', 'wasm-2', 'wasm-4', 'webgpu', 'webgpu-encoder', 'webgpu-decoder'].includes(id)) {
        throw new Error('Unknown FormulaNet runtime profile: ' + String(id));
    }
    const numThreads = id === 'wasm-4' ? 4 : id === 'wasm-2' ? 2 : 1;
    if (numThreads > 1) {
        if (!capabilities.crossOriginIsolated) {
            throw new Error('FormulaNet profile ' + id + ' requires cross-origin isolation.');
        }
        if (!Number.isFinite(capabilities.hardwareConcurrency)
            || capabilities.hardwareConcurrency < numThreads) {
            throw new Error('FormulaNet profile ' + id + ' requires at least ' + numThreads + ' logical processors.');
        }
    }
    if ((id === 'webgpu' || id === 'webgpu-encoder' || id === 'webgpu-decoder') && !capabilities.webgpu) {
        throw new Error('FormulaNet profile ' + id + ' requires an available WebGPU adapter.');
    }
    const device: FormulaOcrDevice = id === 'webgpu-encoder'
        ? { encoder_model: 'webgpu', decoder_model_merged: 'wasm' }
        : id === 'webgpu-decoder' ? { encoder_model: 'wasm', decoder_model_merged: 'webgpu' }
        : id === 'webgpu' ? 'webgpu' : 'wasm';
    const encoder = id === 'webgpu' || id === 'webgpu-encoder' ? 'webgpu' : 'wasm';
    const decoder = id === 'webgpu' || id === 'webgpu-decoder' ? 'webgpu' : 'wasm';
    return {
        id,
        device,
        dtype: 'fp32',
        numThreads,
        cacheSuffix: 'transformers-3.8.1|worker-v1|encoder=' + encoder
            + '|decoder=' + decoder + '|dtype=fp32|wasmThreads=' + numThreads,
    };
}
