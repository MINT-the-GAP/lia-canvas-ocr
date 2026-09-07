import assert from 'node:assert/strict';
import test from 'node:test';

import { getOcrEquationTokenBudget, planOcrEquationChunks } from '../src/ocr/equation-chunks.ts';
import { SYNTHETIC_LONG_EQUATION } from './fixtures/ocr-equation-chunks.mts';

type Raster = { mask: Uint8Array; width: number; height: number };
function raster(width = 760, height = 100): Raster { return { mask: new Uint8Array(width * height), width, height }; }
function rect(r: Raster, x: number, y: number, width: number, height: number, ink = 1): void {
    for (let yy = y; yy < y + height; yy++) {
        for (let xx = x; xx < x + width; xx++) r.mask[yy * r.width + xx] = ink;
    }
}
function glyph(r: Raster, x: number, y = 28, w = 12, h = 28): void {
    rect(r, x, y, w, 2); rect(r, x, y + h - 2, w, 2);
    rect(r, x, y, 2, h); rect(r, x + w - 2, y, 2, h);
}
function equals(r: Raster, x = 340, y = 37, w = 20): void {
    rect(r, x, y, w, 2); rect(r, x, y + 8, w, 2);
}
function row(): Raster {
    const r = raster();
    for (let x = 12; x <= 292; x += 28) glyph(r, x);
    for (let x = 380; x <= 716; x += 28) glyph(r, x);
    equals(r);
    return r;
}
function clearEquality(r: Raster): void { rect(r, 338, 25, 24, 34, 0); }
function plan(r: Raster, scale = 1) { return planOcrEquationChunks(r.mask, r.width, r.height, scale); }
function enlarge(r: Raster, scale: number): Raster {
    const output = raster(r.width * scale, r.height * scale);
    for (let y = 0; y < r.height; y++) {
        for (let x = 0; x < r.width; x++) if (r.mask[y * r.width + x]) rect(output, x * scale, y * scale, scale, scale);
    }
    return output;
}
function bracket(r: Raster, x: number, y: number, w: number, h: number, closing = false): void {
    rect(r, x, y, w, 2); rect(r, x, y + h - 2, w, 2);
    rect(r, closing ? x + w - 2 : x, y, 2, h);
}

test('wide equations split only around a confirmed equality and preserve every other ink pixel', () => {
    const r = row();
    const before = r.mask.slice();
    const result = plan(r);
    assert.ok(result);
    assert.deepEqual(result.separators, [{ x0: 340, x1: 360, token: '=' }]);
    assert.deepEqual(result.ranges, [{ x0: 12, x1: 340 }, { x0: 360, x1: 728 }]);
    assert.equal(result.maxNewTokens, 128);
    for (let y = 0; y < r.height; y++) {
        for (let x = 0; x < r.width; x++) {
            if (!r.mask[y * r.width + x]) continue;
            const owners = [...result.ranges, ...result.separators].filter(range => x >= range.x0 && x < range.x1);
            assert.equal(owners.length, 1, 'each observed ink pixel belongs to one crop or separator');
        }
    }
    assert.deepEqual(r.mask, before, 'planning must not modify the source raster');
});

test('splitting and token budgets are independent of DPI and white canvas margins', () => {
    const r = row();
    const expected = plan(r)!;
    for (const scale of [2, 3]) {
        const actual = plan(enlarge(r, scale), scale)!;
        assert.ok(actual);
        assert.deepEqual(actual.separators.map(s => ({ x0: s.x0 / scale, x1: s.x1 / scale, token: s.token })), expected.separators);
        assert.deepEqual(actual.ranges.map(range => ({ x0: range.x0 / scale, x1: range.x1 / scale })), expected.ranges);
        assert.equal(actual.maxNewTokens, expected.maxNewTokens);
    }
    const padded = raster(1200, 200);
    for (let y = 0; y < r.height; y++) padded.mask.set(r.mask.subarray(y * r.width, (y + 1) * r.width), (y + 50) * padded.width + 100);
    const paddedPlan = plan(padded)!;
    assert.ok(paddedPlan);
    assert.deepEqual(paddedPlan.ranges.map(range => ({ x0: range.x0 - 100, x1: range.x1 - 100 })), expected.ranges);
    assert.equal(paddedPlan.maxNewTokens, expected.maxNewTokens);
});

test('token budgets grow with aspect ratio, including the complete-row fallback', () => {
    for (const scale of [0.5, 1, 2, 4]) {
        assert.equal(getOcrEquationTokenBudget(199 * scale, 20 * scale), 64);
        assert.equal(getOcrEquationTokenBudget(200 * scale, 20 * scale), 128);
        assert.equal(getOcrEquationTokenBudget(439 * scale, 20 * scale), 128);
        assert.equal(getOcrEquationTokenBudget(440 * scale, 20 * scale), 256);
    }
    for (const [width, height] of [[0, 20], [20, 0], [-1, 20], [NaN, 10], [Infinity, 10]]) {
        assert.equal(getOcrEquationTokenBudget(width, height), 64);
    }
    assert.equal(getOcrEquationTokenBudget(716, 28), 256);
});

test('short equations, blank rasters and invalid dimensions remain complete rows', () => {
    const short = raster(180, 70);
    glyph(short, 10); glyph(short, 145); equals(short, 80);
    assert.equal(plan(short), null);
    assert.equal(plan(raster()), null);
    assert.equal(planOcrEquationChunks(new Uint8Array(3), 2, 2), null);
    assert.equal(planOcrEquationChunks(new Uint8Array(3), 1.5, 2), null);
    assert.equal(planOcrEquationChunks(new Uint8Array(), 0, 0), null);
});

test('two slightly slanted straight parallel strokes remain an equality', () => {
    const r = row(); clearEquality(r);
    for (let x = 340; x < 360; x++) {
        const rise = Math.floor((x - 340) / 10);
        rect(r, x, 37 + rise, 1, 2); rect(r, x, 45 + rise, 1, 2);
    }
    assert.deepEqual(plan(r)?.separators, [{ x0: 340, x1: 360, token: '=' }]);
});

test('zeros, plus-minus, three bars, inequalities and crossed equalities are never separators', () => {
    const cases: Array<[string, (r: Raster) => void]> = [
        ['zero', r => { clearEquality(r); glyph(r, 340, 32, 20, 22); }],
        ['plus-minus', r => rect(r, 349, 32, 2, 12)],
        ['three bars', r => rect(r, 340, 53, 20, 2)],
        ['not equal', r => { for (let y = 31; y < 54; y++) rect(r, 357 - Math.floor((y - 31) * 0.65), y, 2, 1); }],
        ['less or equal', r => {
            clearEquality(r);
            for (let y = 30; y < 50; y++) rect(r, 342 + Math.round(Math.abs(y - 39.5)), y, 2, 1);
            rect(r, 340, 53, 20, 2);
        }],
        ['separate less-than and equal', r => {
            for (let y = 28; y < 56; y++) rect(r, 317 + Math.round(Math.abs(y - 41.5)), y, 2, 1);
        }],
        ['separate greater-than and equal', r => {
            for (let y = 28; y < 56; y++) rect(r, 330 - Math.round(Math.abs(y - 41.5)), y, 2, 1);
        }],
        ['approximate', r => {
            clearEquality(r);
            for (let x = 340; x < 360; x++) {
                const bend = Math.round(Math.sin((x - 340) / 19 * Math.PI * 2) * 2);
                rect(r, x, 37 + bend, 1, 2); rect(r, x, 46 + bend, 1, 2);
            }
        }],
    ];
    for (const [label, draw] of cases) {
        const r = row(); draw(r);
        assert.equal(plan(r), null, label);
    }
});

test('a fraction bar, radical overbar, extra dot or attached glyph vetoes the whole separator corridor', () => {
    const cases: Array<[string, (r: Raster) => void]> = [
        ['fraction numerator', r => { rect(r, 312, 61, 90, 2); glyph(r, 347, 70, 12, 14); }],
        ['radical overbar', r => { rect(r, 300, 18, 110, 2); rect(r, 300, 18, 2, 40); }],
        ['extra mark above', r => rect(r, 349, 12, 2, 2)],
        ['extra mark below', r => rect(r, 349, 73, 2, 2)],
        ['attached neighboring stroke', r => rect(r, 303, 37, 39, 2)],
        ['touching side corridor', r => rect(r, 362, 25, 1, 20)],
    ];
    for (const [label, draw] of cases) {
        const r = row(); draw(r);
        assert.equal(plan(r), null, label);
    }
});

test('small raised equalities and mismatched neighboring baselines remain in the complete expression', () => {
    const raised = row(); clearEquality(raised); equals(raised, 340, 6, 12);
    assert.equal(plan(raised), null);
    const mismatch = row(); rect(mismatch, 380, 28, 12, 28, 0); glyph(mismatch, 380, 48);
    assert.equal(plan(mismatch), null);
    const shortStrokes = row(); clearEquality(shortStrokes);
    rect(shortStrokes, 344, 39, 8, 1); rect(shortStrokes, 344, 42, 8, 1);
    assert.equal(plan(shortStrokes), null);
});

test('bracketed or absolute-value equality regions stay intact', () => {
    const square = row(); bracket(square, 0, 22, 10, 40); bracket(square, 744, 22, 10, 40, true);
    assert.equal(plan(square), null, 'square-bracket caps must count even when only two pixels thick');
    const round = row();
    for (let y = 22; y < 62; y++) {
        const bend = Math.round(9 * ((y - 41.5) / 19.5) ** 2);
        rect(round, bend, y, 2, 1); rect(round, 757 - bend, y, 2, 1);
    }
    assert.equal(plan(round), null);
    const absolute = row(); rect(absolute, 4, 23, 2, 38); rect(absolute, 750, 23, 2, 38);
    assert.equal(plan(absolute), null);
});

test('fractions, roots, powers and complete bracket groups away from the split retain their original pixels', () => {
    for (const kind of ['fraction', 'root', 'power', 'brackets']) {
        const r = row();
        if (kind === 'fraction') { rect(r, 170, 64, 100, 2); glyph(r, 201, 72, 12, 14); }
        if (kind === 'root') { rect(r, 166, 16, 100, 2); rect(r, 166, 16, 2, 43); }
        if (kind === 'power') glyph(r, 273, 8, 7, 12);
        if (kind === 'brackets') { bracket(r, 0, 23, 10, 38); bracket(r, 312, 23, 10, 38, true); }
        const result = plan(r);
        assert.ok(result, kind);
        assert.deepEqual(result.separators, [{ x0: 340, x1: 360, token: '=' }], kind);
    }
});

test('equality chains use at most four chunks and never join arbitrary empty gaps', () => {
    const chain = (count: number): Raster => {
        const r = raster(240 * (count + 1), 90);
        for (let part = 0; part <= count; part++) {
            for (let offset = 12; offset <= 152; offset += 28) glyph(r, part * 240 + offset);
            if (part < count) equals(r, part * 240 + 194);
        }
        return r;
    };
    const three = plan(chain(3));
    assert.ok(three);
    assert.equal(three.ranges.length, 4);
    assert.deepEqual(three.separators.map(separator => separator.token), ['=', '=', '=']);
    assert.equal(three.maxNewTokens, 64);
    assert.equal(plan(chain(4)), null);
    const gapOnly = row(); clearEquality(gapOnly);
    assert.equal(plan(gapOnly), null);
});

test('large internal gutters keep neighboring independent equations out of an equality chain', () => {
    const independent = raster(1100, 90);
    for (const x of [12, 40, 68, 160, 188, 216, 700, 728, 756, 850, 878, 906]) glyph(independent, x);
    equals(independent, 110); equals(independent, 798);
    assert.equal(plan(independent), null);
    const ordinarySpacing = row();
    rect(ordinarySpacing, 208, 28, 12, 28, 0); rect(ordinarySpacing, 236, 28, 12, 28, 0);
    assert.ok(plan(ordinarySpacing), 'a larger ordinary word space must not be confused with a page column');
});

test('a heavily fragmented raster stays a whole row even with a clean local equality', () => {
    const noisy = raster(2200, 90);
    for (let x = 12; x <= 2160; x += 28) if (x < 320 || x >= 376) glyph(noisy, x);
    equals(noisy);
    assert.ok(plan(noisy), 'the wide baseline without the fragments provides a valid control');
    // More than 4096 isolated marks, kept away from the equality and its two
    // immediate neighbors, must not cause unbounded structural pair searching.
    for (let y = 0; y <= 18; y += 3) {
        for (let x = 0; x < noisy.width; x += 3) if (x < 300 || x >= 380) rect(noisy, x, y, 1, 1);
    }
    assert.equal(plan(noisy), null);
});

test('the authored multi-stroke equation used by the pointer regression remains splittable', () => {
    const sample = SYNTHETIC_LONG_EQUATION;
    const r = raster(sample.width, sample.height);
    const radius = sample.lineWidth / 2;
    const dab = (cx: number, cy: number): void => {
        for (let y = Math.max(0, Math.floor(cy - radius)); y < Math.min(r.height, Math.ceil(cy + radius)); y++) {
            for (let x = Math.max(0, Math.floor(cx - radius)); x < Math.min(r.width, Math.ceil(cx + radius)); x++) {
                if ((x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 <= radius ** 2) r.mask[y * r.width + x] = 1;
            }
        }
    };
    for (const stroke of sample.strokes) {
        dab(stroke[0].x, stroke[0].y);
        for (let index = 1; index < stroke.length; index++) {
            const from = stroke[index - 1];
            const to = stroke[index];
            const steps = Math.ceil(Math.hypot(to.x - from.x, to.y - from.y) * 2);
            for (let step = 1; step <= steps; step++) dab(from.x + (to.x - from.x) * step / steps, from.y + (to.y - from.y) * step / steps);
        }
    }
    const result = plan(r);
    assert.ok(result);
    assert.equal(result.ranges.length, 2);
    assert.equal(result.separators.length, 1);
    assert.equal(result.separators[0].token, '=');
    assert.equal(result.maxNewTokens, 64);
});
