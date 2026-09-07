import assert from 'node:assert/strict';
import test from 'node:test';
import { summarizeOcrBenchmark, type OcrBenchmarkRun } from '../scripts/ocr-benchmark-metrics.mts';

const run = (caseId: string, wallMs: number, overrides: Partial<OcrBenchmarkRun> = {}): OcrBenchmarkRun => ({
    caseId, wallMs, text: 'x=1', expectedLatex: 'x=1', ...overrides,
});

test('timings use median and nearest-rank P95; exact transcription never normalizes math or whitespace', () => {
    const result = summarizeOcrBenchmark([
        run('a', 40, { inferenceMs: 8, tokenCount: 3 }),
        run('b', 10, { text: 'x = 1', inferenceMs: 2, tokenCount: 5 }),
        run('c', 30, { text: '2x=2', inferenceMs: 6, tokenCount: 5 }),
        run('d', 20, { text: '' }),
    ]);
    assert.deepEqual(result.wallMs, { count: 4, invalidCount: 0, missingCount: 0, median: 25, p95: 40 });
    assert.deepEqual(result.inferenceMs, { count: 3, invalidCount: 0, missingCount: 1, median: 6, p95: 8 });
    assert.deepEqual(result.exact, { matches: 1, total: 4, rate: 0.25 });
    assert.ok(result.cases[3].errorTypes.includes('empty-output'));
    assert.ok(result.cases[2].errorTypes.includes('raw-text-mismatch'));
    assert.equal(result.coverage.complete, null, 'without reference the expected case coverage is unknown');
});

test('speedup matches cases and weights their medians equally even with different repeat counts between cases', () => {
    const baseline = [run('a', 10), run('a', 100), run('a', 20), run('b', 50)];
    const candidate = [run('b', 25), run('a', 3), run('a', 1), run('a', 2)];
    const result = summarizeOcrBenchmark(candidate, baseline);
    assert.equal(result.speedupRatio, 70 / 27);
    assert.equal(result.coverage.completeCaseCount, 2);
    assert.equal(result.coverage.complete, true);
    assert.equal(result.baselineAgreement?.comparisons, 10);
    assert.equal(result.baselineAgreement?.rate, 1);
    assert.equal(result.qualitySafeSpeedup, true);
});

test('missing cases, added cases or missing repetitions never become a reported speed gain', () => {
    const baseline = [run('a', 100), run('a', 100), run('b', 100)];
    for (const candidate of [
        [run('a', 1), run('a', 1)],
        [run('a', 1), run('b', 1)],
        [run('a', 1), run('a', 1), run('b', 1), run('extra', 1)],
    ]) {
        const result = summarizeOcrBenchmark(candidate, baseline);
        assert.equal(result.speedupRatio, null);
        assert.equal(result.qualitySafeSpeedup, false);
        assert.equal(result.coverage.complete, false);
    }
    const missing = summarizeOcrBenchmark([run('a', 1), run('a', 1)], baseline);
    assert.deepEqual(missing.coverage.missingCaseIds, ['b']);
    assert.equal(missing.coverage.completeCaseCount, 1);
});

test('agreement compares every same-case reference output and flags a nondeterministic baseline', () => {
    const baseline = [run('a', 10), run('a', 10, { text: 'x=2' })];
    const result = summarizeOcrBenchmark([run('a', 2), run('a', 2)], baseline);
    assert.deepEqual(result.baselineAgreement, { matches: 2, comparisons: 4, rate: 0.5, unstableCaseIds: ['a'] });
    assert.equal(result.coverage.complete, true);
    assert.equal(result.speedupRatio, null);
    assert.equal(result.qualitySafeSpeedup, false);
});

test('matching strings from different cases are never compared', () => {
    const result = summarizeOcrBenchmark([run('new', 1)], [run('old', 10)]);
    assert.equal(result.baselineAgreement?.comparisons, 0);
    assert.equal(result.baselineAgreement?.rate, null);
    assert.deepEqual(result.coverage.missingCaseIds, ['old']);
    assert.deepEqual(result.coverage.extraCaseIds, ['new']);
    assert.equal(result.speedupRatio, null);
});

test('shorter outputs may be faster but are not quality-preserving; tokens only describe observations', () => {
    const baseline = [run('a', 100, { tokenCount: 20 })];
    const result = summarizeOcrBenchmark([run('a', 10, { text: 'x', tokenCount: 1 })], baseline);
    assert.equal(result.speedupRatio, 10);
    assert.equal(result.exact.rate, 0);
    assert.equal(result.qualitySafeSpeedup, false);
    assert.equal(result.tokenCount.median, 1);
    const sameText = summarizeOcrBenchmark([run('a', 10, { tokenCount: 7 })], baseline);
    assert.equal(sameText.speedupRatio, 10, 'token counts do not weight wall-time speedups');
    assert.equal(sameText.qualitySafeSpeedup, true);
});

test('a nondeterministic candidate cannot claim unchanged output quality', () => {
    const result = summarizeOcrBenchmark([run('a', 2), run('a', 2, { text: 'x=2' })], [run('a', 10), run('a', 10)]);
    assert.equal(result.speedupRatio, 5);
    assert.equal(result.qualitySafeSpeedup, false);
    assert.ok(result.cases[0].errorTypes.includes('non-deterministic-output'));
});

test('invalid required or provided optional timings remain visible and invalidate coverage comparisons', () => {
    const baseline = [run('a', 100), run('a', 100)];
    for (const invalid of [Number.NaN, Number.POSITIVE_INFINITY, -1]) {
        const result = summarizeOcrBenchmark([run('a', 1), run('a', invalid)], baseline);
        assert.equal(result.runCount, 2);
        assert.equal(result.wallMs.invalidCount, 1);
        assert.equal(result.coverage.completeCaseCount, 0);
        assert.deepEqual(result.coverage.invalidTimingCaseIds, ['a']);
        assert.equal(result.coverage.complete, false);
        assert.equal(result.speedupRatio, null);
    }
    const invalidInference = summarizeOcrBenchmark([run('a', 1, { inferenceMs: Number.NaN })], [run('a', 10)]);
    assert.equal(invalidInference.inferenceMs.invalidCount, 1);
    assert.equal(invalidInference.speedupRatio, null);
    const invalidReference = summarizeOcrBenchmark([run('a', 1)], [run('a', Number.NaN)]);
    assert.deepEqual(invalidReference.coverage.invalidTimingCaseIds, ['a']);
    assert.equal(invalidReference.speedupRatio, null);
});

test('reused case IDs with changed or conflicting expected text are not comparable', () => {
    const changed = summarizeOcrBenchmark([run('a', 1, { expectedLatex: 'x=2' })], [run('a', 10)]);
    assert.deepEqual(changed.coverage.expectedMismatchCaseIds, ['a']);
    assert.equal(changed.speedupRatio, null);
    const conflicting = summarizeOcrBenchmark([run('a', 1), run('a', 1, { expectedLatex: 'x=2' })], [run('a', 10), run('a', 10)]);
    assert.ok(conflicting.cases[0].errorTypes.includes('conflicting-expected-text'));
    assert.equal(conflicting.coverage.complete, false);
});

test('empty or zero-time comparisons report no ratio instead of NaN or infinity', () => {
    const empty = summarizeOcrBenchmark([], []);
    assert.equal(empty.wallMs.median, null);
    assert.equal(empty.exact.rate, null);
    assert.equal(empty.coverage.complete, false);
    assert.equal(empty.speedupRatio, null);
    assert.equal(summarizeOcrBenchmark([run('a', 0)], [run('a', 1)]).speedupRatio, null);
});
