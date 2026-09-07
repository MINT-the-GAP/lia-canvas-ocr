import assert from 'node:assert/strict';
import test from 'node:test';
import {
    OCR_PERFORMANCE_CORPUS,
    OCR_PERFORMANCE_CORPUS_DESCRIPTION,
} from './fixtures/ocr-performance-corpus.mts';

test('synthetic OCR benchmark samples have unique identities and complete transcriptions', () => {
    const samples = OCR_PERFORMANCE_CORPUS;
    assert.ok(samples.length >= 8 && samples.length <= 12);
    assert.equal(new Set(samples.map(sample => sample.id)).size, samples.length);
    assert.equal(OCR_PERFORMANCE_CORPUS_DESCRIPTION.synthetic, true);
    assert.match(OCR_PERFORMANCE_CORPUS_DESCRIPTION.limitation, /not general handwriting accuracy/);
    for (const sample of samples) {
        assert.equal(sample.synthetic, true);
        assert.ok(sample.id && sample.family && sample.expectedLatex.trim());
        assert.ok(!sample.expectedLatex.includes('\n'), 'each input is a single equation or arithmetic row');
    }
});

test('all benchmark ink is finite, nonempty and fully inside its image', () => {
    for (const sample of OCR_PERFORMANCE_CORPUS) {
        assert.ok(Number.isInteger(sample.width) && sample.width > 0 && sample.width <= 1024);
        assert.ok(Number.isInteger(sample.height) && sample.height > 0 && sample.height <= 512);
        assert.ok(Number.isFinite(sample.lineWidth) && sample.lineWidth > 0);
        assert.ok(sample.strokes.length > 0);
        const radius = sample.lineWidth / 2;
        for (const stroke of sample.strokes) {
            assert.ok(stroke.length > 0);
            for (const point of stroke) {
                assert.ok(Number.isFinite(point.x) && Number.isFinite(point.y), sample.id);
                assert.ok(point.x - radius >= 0 && point.x + radius < sample.width, sample.id);
                assert.ok(point.y - radius >= 0 && point.y + radius < sample.height, sample.id);
            }
        }
    }
});

test('the corpus includes real single-point operators and two-dimensional notation', () => {
    const find = (id: string) => {
        const sample = OCR_PERFORMANCE_CORPUS.find(candidate => candidate.id === id);
        assert.ok(sample, id);
        return sample;
    };
    assert.equal(find('multiplication-tap').strokes.filter(stroke => stroke.length === 1).length, 1);
    assert.equal(find('division-taps').strokes.filter(stroke => stroke.length === 1).length, 2);
    assert.equal(find('decimal-comma').strokes.filter(stroke => stroke.length === 1).length, 1);
    assert.ok(new Set(OCR_PERFORMANCE_CORPUS.map(sample => sample.family)).size >= 9);
    assert.ok(find('stacked-fractions').height > find('addition-result').height);
    assert.ok(find('quadratic-power').height > find('addition-result').height);
    assert.ok(find('square-root').strokes[0].length > 2);
});
