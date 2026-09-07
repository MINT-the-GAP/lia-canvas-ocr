import assert from 'node:assert/strict';
import test from 'node:test';
import { findOcrDivisionOperationHead as find, composeOcrDivisionOperation as compose } from '../src/ocr/operation-head.ts';
import { OCR_PIPELINE_CORPUS } from './fixtures/ocr-pipeline-corpus.mts';

type Raster = { mask: Uint8Array; width: number; height: number };
const raster = (width = 80, height = 68): Raster => ({ mask: new Uint8Array(width * height), width, height });
function rect(r: Raster, x: number, y: number, w: number, h: number, value = 1): void {
  for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) r.mask[yy * r.width + xx] = value;
}
function digit(r: Raster, value: '3' | '5'): void {
  rect(r, 38, 14, 20, 3); rect(r, 38, 32, 20, 3); rect(r, 38, 50, 20, 3);
  rect(r, value === '3' ? 55 : 38, 14, 3, 21); rect(r, 55, 32, 3, 21);
}
function colon(value: '3' | '5' = '3'): Raster {
  const r = raster(); rect(r, 19, 23, 3, 3); rect(r, 19, 41, 3, 3); digit(r, value); return r;
}
const plan = (r: Raster, scale = 1) => find(r.mask, r.width, r.height, scale);
function scaled(r: Raster, scale: number): Raster {
  const result = raster(r.width * scale, r.height * scale);
  for (let y = 0; y < r.height; y++) for (let x = 0; x < r.width; x++) if (r.mask[y * r.width + x]) rect(result, x * scale, y * scale, scale, scale);
  return result;
}

test('two isolated compact points before 3 or 5 give a colon and preserve every other ink pixel', () => {
  for (const operand of ['3', '5'] as const) {
    const r = colon(operand), before = r.mask.slice(), head = plan(r);
    assert.ok(head); assert.equal(compose(head, operand), ': ' + operand);
    assert.deepEqual(head.box, { x0: 19, y0: 23, x1: 22, y1: 44 });
    for (let y = 0; y < r.height; y++) for (let x = 0; x < r.width; x++) {
      if (r.mask[y * r.width + x] && x < head.operandX0) {
        assert.ok(x >= head.box.x0 && x < head.box.x1 && y >= head.box.y0 && y < head.box.y1);
      }
    }
    assert.deepEqual(r.mask, before);
  }
});

test('scaling and compact irregular filled dots keep the same interpretation', () => {
  const r = colon(), expected = plan(r)!;
  for (const scale of [2, 3]) {
    const actual = plan(scaled(r, scale), scale); assert.ok(actual);
    assert.deepEqual(actual.box, Object.fromEntries(Object.entries(expected.box).map(([key, value]) => [key, value * scale])));
    assert.equal(actual.operandX0, expected.operandX0 * scale);
  }
  rect(r, 17, 20, 8, 27, 0);
  rect(r, 19, 23, 4, 3); rect(r, 19, 23, 1, 1, 0);
  rect(r, 19, 41, 3, 4); rect(r, 21, 44, 1, 1, 0);
  assert.ok(plan(r), 'two compact scribbled/overdrawn footprints are still two dots');
});

test('a real i, exclamation mark, semicolon, multiplication dot or extra operator ink is never rewritten', () => {
  const mutations: Array<[string, (r: Raster) => void]> = [
    ['i stem', r => { rect(r, 18, 38, 6, 10, 0); rect(r, 20, 31, 2, 18); }],
    ['exclamation stem', r => { rect(r, 18, 20, 6, 9, 0); rect(r, 20, 17, 2, 18); }],
    ['semicolon tail', r => { rect(r, 20, 43, 2, 4); rect(r, 18, 46, 3, 2); }],
    ['single multiplication dot', r => rect(r, 18, 40, 6, 6, 0)],
    ['erased upper point', r => rect(r, 18, 22, 6, 6, 0)],
    ['partly erased lower point', r => { rect(r, 18, 40, 6, 6, 0); rect(r, 20, 42, 1, 1); }],
    ['connecting stem', r => rect(r, 20, 25, 1, 17)],
    ['additional horizontal stroke', r => rect(r, 16, 32, 10, 2)],
    ['third point', r => rect(r, 19, 32, 3, 3)],
    ['horizontal point pair', r => { rect(r, 18, 40, 6, 6, 0); rect(r, 25, 23, 3, 3); }],
    ['missing operand', r => rect(r, 37, 12, 23, 43, 0)],
    ['additional leading speck', r => rect(r, 8, 32, 2, 2)],
    ['speck before operand', r => rect(r, 29, 32, 2, 2)],
    ['crop clips a dot', r => rect(r, 0, 23, 20, 1)],
    ['crop clips operand', r => rect(r, 57, 14, r.width - 57, 1)],
  ];
  for (const [name, mutate] of mutations) { const r = colon(); mutate(r); assert.equal(plan(r), null, name); }
});

// Deterministic round-cap rasterization of the two existing authored operation
// rows. No report files, screenshots, browser or OCR model enter this check.
function authoredOperation(id: string, scale: number): Raster {
  const sample = OCR_PIPELINE_CORPUS.find(item => item.id === id)!;
  const tapIndex = sample.strokes.findIndex(path => path.length === 1);
  const bar = sample.strokes[tapIndex - 1];
  const x0 = Math.ceil(Math.max(...bar.map(p => p.x)) + sample.lineWidth + 2);
  const y0 = Math.floor(Math.min(...bar.map(p => p.y)) - 10);
  const y1 = Math.ceil(Math.max(...bar.map(p => p.y)) + 10);
  const r = raster(Math.ceil((sample.width - x0) * scale), Math.ceil((y1 - y0) * scale));
  const radius = sample.lineWidth * scale / 2 + .25;
  for (const path of sample.strokes) {
    const points = path.map(p => ({ x: (p.x - x0) * scale, y: (p.y - y0) * scale }));
    for (let index = 0; index < Math.max(1, points.length - 1); index++) {
      const a = points[index], b = points[Math.min(points.length - 1, index + 1)];
      const dx = b.x - a.x, dy = b.y - a.y, length = dx * dx + dy * dy;
      for (let y = Math.max(0, Math.floor(Math.min(a.y, b.y) - radius)); y < Math.min(r.height, Math.ceil(Math.max(a.y, b.y) + radius)); y++) {
        for (let x = Math.max(0, Math.floor(Math.min(a.x, b.x) - radius)); x < Math.min(r.width, Math.ceil(Math.max(a.x, b.x) + radius)); x++) {
          const t = length ? Math.max(0, Math.min(1, ((x + .5 - a.x) * dx + (y + .5 - a.y) * dy) / length)) : 0;
          if (Math.hypot(x + .5 - a.x - t * dx, y + .5 - a.y - t * dy) <= radius) r.mask[y * r.width + x] = 1;
        }
      }
    }
  }
  return r;
}

test('the unchanged authored :3 and :5 pipeline rows supply final raster evidence at several scales', () => {
  for (const id of ['linear-valid', 'holdout-linear']) for (const scale of [.5, 1, 2]) {
    const r = authoredOperation(id, scale);
    assert.ok(plan(r, scale), id + ' scale=' + scale);
  }
});

test('only an independently observed head can compose a complete unchanged operand', () => {
  const head = plan(colon())!;
  for (const operand of ['3', '5', '(x+1)', String.raw`\frac{3}{2}`, 'i 3']) assert.equal(compose(head, operand), ': ' + operand);
  for (const operand of ['', ':5', String.raw`\cdot5`, '=3', String.raw`\frac{3}{}`, '(3', '3+']) assert.equal(compose(head, operand), null);
  assert.equal(compose(null, '3'), null);
});

test('invalid, noisy and oversized raster inputs fail closed within a fixed budget', () => {
  const r = colon();
  for (const scale of [0, NaN, Infinity, .1, 33]) assert.equal(plan(r, scale), null);
  assert.equal(find(new Uint8Array(3), 2, 2), null);
  assert.equal(find(new Uint8Array(3), 1.5, 2), null);
  assert.equal(find(new Uint8Array(1_000_001), 1_000_001, 1), null);
  const noisy = raster(80, 80);
  for (let y = 2; y < 76; y += 4) for (let x = 2; x < 76; x += 4) rect(noisy, x, y, 1, 1);
  assert.equal(plan(noisy), null);
});
