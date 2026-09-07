import assert from 'node:assert/strict';
import test from 'node:test';

import {
  resolveFormulaOcrProfile,
  type FormulaOcrCapabilities,
  type FormulaOcrProfileId,
} from '../src/ocr/formulanet-profiles.ts';

const capable: FormulaOcrCapabilities = {
  crossOriginIsolated: true,
  hardwareConcurrency: 8,
  webgpu: true,
};

test('single-threaded WASM works without cross-origin isolation or a GPU', () => {
  const profile = resolveFormulaOcrProfile('wasm-1', {
    crossOriginIsolated: false,
    hardwareConcurrency: 1,
    webgpu: false,
  });
  assert.equal(profile.id, 'wasm-1');
  assert.equal(profile.device, 'wasm');
  assert.equal(profile.numThreads, 1);
  assert.equal(profile.dtype, 'fp32');
});

test('explicit WASM thread profiles require isolation and enough processors', () => {
  for (const [id, threads] of [['wasm-2', 2], ['wasm-4', 4]] as const) {
    const profile = resolveFormulaOcrProfile(id, capable);
    assert.equal(profile.device, 'wasm');
    assert.equal(profile.numThreads, threads);
    assert.throws(() => resolveFormulaOcrProfile(id, { ...capable, crossOriginIsolated: false }), /isolation/);
    assert.throws(() => resolveFormulaOcrProfile(id, { ...capable, hardwareConcurrency: threads - 1 }), /logical processors/);
    assert.throws(() => resolveFormulaOcrProfile(id, { ...capable, hardwareConcurrency: NaN }), /logical processors/);
  }
});

test('GPU profiles never silently downgrade when an adapter is unavailable', () => {
  for (const id of ['webgpu', 'webgpu-encoder', 'webgpu-decoder'] as const) {
    assert.throws(() => resolveFormulaOcrProfile(id, { ...capable, webgpu: false }), /WebGPU adapter/);
    const profile = resolveFormulaOcrProfile(id, { ...capable, crossOriginIsolated: false });
    assert.equal(profile.id, id);
    assert.equal(profile.numThreads, 1);
    assert.equal(profile.dtype, 'fp32');
  }
  assert.equal(resolveFormulaOcrProfile('webgpu', capable).device, 'webgpu');
  assert.deepEqual(resolveFormulaOcrProfile('webgpu-decoder', capable).device, {
    encoder_model: 'wasm',
    decoder_model_merged: 'webgpu',
  });
  assert.deepEqual(resolveFormulaOcrProfile('webgpu-encoder', capable).device, {
    encoder_model: 'webgpu',
    decoder_model_merged: 'wasm',
  });
});

test('cache identities distinguish all device and thread profiles', () => {
  const ids: FormulaOcrProfileId[] = ['wasm-1', 'wasm-2', 'wasm-4', 'webgpu', 'webgpu-encoder', 'webgpu-decoder'];
  const profiles = ids.map(id => resolveFormulaOcrProfile(id, capable));
  assert.equal(new Set(profiles.map(profile => profile.cacheSuffix)).size, ids.length);
  for (const profile of profiles) {
    assert.match(profile.cacheSuffix, /dtype=fp32/);
    assert.match(profile.cacheSuffix, new RegExp('wasmThreads=' + profile.numThreads));
    assert.equal(profile.cacheSuffix, resolveFormulaOcrProfile(profile.id, capable).cacheSuffix);
  }
});

test('invalid profile IDs fail and resolving another profile does not mutate earlier settings', () => {
  assert.throws(() => resolveFormulaOcrProfile('automatic' as FormulaOcrProfileId, capable), /Unknown/);
  const first = resolveFormulaOcrProfile('webgpu-encoder', capable);
  const original = JSON.stringify(first);
  resolveFormulaOcrProfile('wasm-4', capable);
  assert.equal(JSON.stringify(first), original);
  assert.notEqual(first.device, resolveFormulaOcrProfile('webgpu-encoder', capable).device);
});
