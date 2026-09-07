import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeOcrTexForComparison as normalize, compareOcrTex as compare, summarizeOcrQuality as summarize, type OcrQualityRecord } from '../scripts/ocr-quality-metrics.mts';

const record = (caseId: string, overrides: Partial<OcrQualityRecord> = {}): OcrQualityRecord => ({
    caseId, split: 'development', expected: 'x=1', actual: 'x=1', wallMs: 10,
    gradeAccepted: true, expectedGradeAccepted: true, ...overrides,
});

test('normalization removes only supported typography and keeps canonical control-word boundaries', () => {
    for (const [expected, actual] of [
        [String.raw`\frac{x^{2}}{2}=3`, String.raw` \dfrac { x^2 } { 2 } = 3 `],
        [String.raw`\frac{1}{2}`, String.raw`\tfrac{1}{2}`],
        [String.raw`(x+1)^{2}=4`, String.raw`\left(x+1\right)^2=4`],
        [String.raw`x_{1}=\sqrt{x}`, String.raw`x_1=\sqrt x`],
        [String.raw`x=\sqrt[3]{2}`, String.raw`x=\sqrt[3]2`],
        [String.raw`x_{i}^{2}=3`, String.raw`x_i^2=3`],
        [String.raw`\sin^{2}(x)=1`, String.raw`\sin^2(x)=1`],
        [String.raw`\alpha x=1`, String.raw`\alpha   x = 1`],
    ]) {
        assert.equal(compare(expected, actual).normalizedExact, true, actual);
        assert.equal(compare(expected, actual).tokenEdits, 0, actual);
        assert.equal(normalize(normalize(actual)!), normalize(actual), 'normalization is idempotent');
    }
    assert.equal(normalize(String.raw`\alpha x`), String.raw`\alpha x`);
    assert.equal(compare(String.raw`\alpha x`, String.raw`\alphax`).normalizedExact, false);
});

test('multiplication symbols, variable case and all solution symbols remain distinct', () => {
    for (const [expected, actual] of [
        [String.raw`a\cdot b=c`, String.raw`a\times b=c`],
        ['x=2', 'X=2'], ['x=2', '2'],
        [String.raw`x=\pm2`, 'x=2'], ['x_1=2', 'x=2'],
        ['x_{1,2}=2', 'x_1=2'], ['x=2', 'x2'],
        [String.raw`L=\{-2;2\}`, String.raw`L=\{2;-2\}`],
        ['2x=4', 'x=2'], ['x+1=3', '1+x=3'],
        ['x^{12}=2', 'x^12=2'], [String.raw`x=\sqrt{12}`, String.raw`x=\sqrt12`],
        [String.raw`x=\sqrt[3]{2}`, String.raw`x=\sqrt{2}`],
    ]) {
        const result = compare(expected, actual);
        assert.equal(result.normalizedExact, false, expected + ' vs ' + actual);
        assert.ok(result.tokenEdits > 0, expected + ' vs ' + actual);
    }
});

test('text contents keep exact spacing, symbols, aliases and escaped braces', () => {
    assert.equal(compare(String.raw`\text{Probe: a b} x=1`, String.raw`\text{Probe: a  b}x=1`).normalizedExact, false);
    assert.equal(compare(String.raw`\text{\times}x=1`, String.raw`\text{\cdot}x=1`).normalizedExact, false);
    assert.equal(normalize(String.raw` \text{a \{ b \} c} x=1 `), String.raw`\text{a \{ b \} c}x=1`);
    assert.equal(normalize(String.raw`\text{\dfrac{1}{2}}`), String.raw`\text{\dfrac{1}{2}}`);
});

test('explicit rows and alignment remain part of the transcription', () => {
    const source = String.raw`\begin{aligned}x&=1\\y&=2\end{aligned}`;
    assert.equal(normalize(source), source);
    for (const changed of [
        String.raw`\begin{aligned}x&=1y&=2\end{aligned}`,
        String.raw`\begin{aligned}x=1\\y=2\end{aligned}`,
        String.raw`\begin{aligned}y&=2\\x&=1\end{aligned}`,
        String.raw`\begin{aligned}x&=1\end{aligned}`,
    ]) assert.equal(compare(source, changed).normalizedExact, false);
    const system = String.raw`\left\{\begin{aligned}x&=1\\y&=2\end{aligned}\right.`;
    assert.notEqual(normalize(system), null);
});

test('known malformed TeX never becomes a normalized match even against itself', () => {
    for (const source of [
        '', ' ', 'x=', 'x+', 'x^', 'x_{}', '{x=2', '(x+1]', String.raw`x=\frac{1}`,
        String.raw`x=\sqrt`, String.raw`x=\sqrt[]{2}`, String.raw`x=\sqrt{}`,
        String.raw`\left(x=2)`, String.raw`\right)x=2`, String.raw`\left x\right)`,
        String.raw`\begin{aligned}x=1\end{cases}`, String.raw`\begin{cases}x=1`,
        String.raw`\text{unclosed`, String.raw`x=\unknown{2}`, 'x=1' + String.fromCharCode(7),
        String.raw`x^{2^}=1`, String.raw`x^2^3=1`, String.raw`{^2}=1`,
    ]) {
        assert.equal(normalize(source), null, source);
        const result = compare(source, source);
        assert.equal(result.rawExact, true);
        assert.equal(result.normalizedExact, false, source);
    }
});

test('token edits count insertions, deletions and substitutions without equation equivalence', () => {
    assert.deepEqual(compare('x=12', 'x=1'), {
        rawExact: false, normalizedExact: false, expectedTokens: 4, actualTokens: 3, tokenEdits: 1, tokenErrorRate: 0.25,
    });
    assert.equal(compare('x=1', 'x=2').tokenEdits, 1);
    assert.equal(compare('x=1', 'x=12').tokenEdits, 1);
    assert.equal(compare('x=1', '').tokenErrorRate, 1);
    assert.equal(compare('x', 'xxxxxxxx').tokenErrorRate, 7, 'insertion-heavy TER can exceed one');
});

test('bounds decline excessive comparison work without silently truncating into a match', () => {
    const long = 'x'.repeat(16_385);
    assert.equal(normalize(long), null);
    assert.throws(() => compare(long, long), RangeError);
    assert.throws(() => compare('x'.repeat(2049), 'x'), RangeError);
    assert.equal(normalize('{'.repeat(33) + 'x' + '}'.repeat(33)), null);
    assert.equal(normalize(String.raw`\text{` + '{'.repeat(33) + 'x' + '}'.repeat(34)), null);
});

test('summary keeps symbol quality separate from a matching mathematical grade', () => {
    const result = summarize([
        record('exact'),
        record('equivalent-only', { expected: '2x=2', actual: 'x=1', split: 'holdout' }),
    ]);
    assert.deepEqual(result.overall.transcription.normalizedExact, { matches: 1, total: 2, rate: 0.5 });
    assert.deepEqual(result.overall.grading, { expected: 2, observed: 2, correct: 2, accuracy: 1 });
    assert.equal(result.bySplit.development.transcription.normalizedExact.rate, 1);
    assert.equal(result.bySplit.holdout.transcription.normalizedExact.rate, 0);
});

test('planned missing and failed records stay in every applicable denominator', () => {
    const result = summarize([
        record('ok'),
        record('missing', { status: 'missing', actual: '', gradeAccepted: null, wallMs: Number.NaN }),
        record('failed', { status: 'failed', actual: 'x=1', gradeAccepted: false, expectedGradeAccepted: false }),
    ]).overall;
    assert.equal(result.total, 3);
    assert.equal(result.completed, 1);
    assert.equal(result.missing, 1);
    assert.equal(result.failed, 1);
    assert.deepEqual(result.transcription.normalizedExact, { matches: 1, total: 3, rate: 1 / 3 });
    assert.equal(result.transcription.expectedTokens, 9);
    assert.equal(result.transcription.tokenEdits, 6);
    assert.equal(result.transcription.tokenErrorRate, 2 / 3);
    assert.deepEqual(result.grading, { expected: 3, observed: 1, correct: 1, accuracy: 1 / 3 });
    assert.deepEqual(result.wallMs, { count: 1, excluded: 2, median: 10, p95: 10 });
});

test('an over-budget result remains a nonmatch and disables the pooled token rate', () => {
    const result = summarize([record('ok'), record('oversized', { actual: 'x'.repeat(2049) })]).overall;
    assert.deepEqual(result.transcription.normalizedExact, { matches: 1, total: 2, rate: 0.5 });
    assert.equal(result.transcription.unscored, 1);
    assert.equal(result.transcription.tokenErrorRate, null);
});

test('only finite nonnegative successful timings enter median and nearest-rank p95', () => {
    const result = summarize([10, 40, 20, 30, Number.NaN, Number.POSITIVE_INFINITY, -1].map((wallMs, index) => record(String(index), { wallMs }))).overall;
    assert.deepEqual(result.wallMs, { count: 4, excluded: 3, median: 25, p95: 40 });
    const empty = summarize([]);
    assert.equal(empty.overall.transcription.normalizedExact.rate, null);
    assert.equal(empty.overall.transcription.tokenErrorRate, null);
    assert.equal(empty.overall.grading.accuracy, null);
    assert.deepEqual(empty.overall.wallMs, { count: 0, excluded: 0, median: null, p95: null });
});
test('finite solution-set delimiters and nested root arguments remain recognizable', () => {
    for (const source of [String.raw`L=\{-2;2\}`, String.raw`x=\sqrt{\frac{1}{2}}`, String.raw`\alpha+\beta=\gamma`]) {
        assert.equal(normalize(source), source);
        assert.equal(compare(source, source).normalizedExact, true);
    }
});
test('malformed unbraced arguments and array declarations are declined rather than canonized', () => {
    for (const source of ['x^+2', 'x=-', 'x==2', 'x=#', String.raw`\begin{array}x=1\end{array}`]) {
        assert.equal(normalize(source), null, source);
        assert.equal(compare(source, source).normalizedExact, false, source);
    }
    const valid = String.raw`\begin{array}{rl}x&=1\\y&=2\end{array}`;
    assert.equal(normalize(valid), valid);
});
test('declared operations preserve their actual mid and vert symbols', () => {
    for (const source of [String.raw`3x-5=7\mid+5`, String.raw`3x=12\mid:3`, String.raw`x\vert y`]) {
        assert.equal(normalize(source), source);
        assert.equal(compare(source, source).normalizedExact, true);
    }
    assert.equal(compare(String.raw`x\mid y`, String.raw`x\vert y`).normalizedExact, false);
    assert.equal(compare(String.raw`x\vert y`, 'x|y').normalizedExact, false);
    assert.equal(compare(String.raw`3x=12\mid:3`, '3x=12').normalizedExact, false);
});

test('explicit pipeline row tokens prevent merged or omitted lines from becoming exact matches', () => {
    const score = (lines: readonly string[]) => lines.join(String.raw`\\`);
    const expected = score(['x=1', 'y=2']);
    assert.equal(compare(expected, expected).normalizedExact, true);
    const merged = compare(expected, score(['x=1y=2']));
    assert.equal(merged.normalizedExact, false);
    assert.equal(merged.tokenEdits, 1);
    assert.equal(compare(expected, score(['x=1'])).normalizedExact, false);
    const operations = score([String.raw`3x-5=7\mid+5`, String.raw`3x=12\mid:3`, 'x=4']);
    assert.equal(compare(operations, operations).normalizedExact, true);
    assert.equal(compare(operations, score([String.raw`3x-5=7\mid+5`, 'x=4'])).normalizedExact, false);
});
test('paired scalable set braces retain the same visible delimiters', () => {
    const scalable = String.raw`\left\{1,2\right\}`;
    const ordinary = String.raw`\{1,2\}`;
    assert.equal(normalize(scalable), ordinary);
    const result = compare(scalable, ordinary);
    assert.equal(result.normalizedExact, true);
    assert.equal(result.tokenEdits, 0);
    assert.equal(compare(scalable, '1,2').normalizedExact, false);
    assert.equal(normalize(String.raw`\left\{1,2\right)`), null);
});