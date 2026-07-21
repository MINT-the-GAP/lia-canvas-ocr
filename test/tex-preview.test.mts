import assert from 'node:assert/strict';
import test from 'node:test';

import { formatTexForPreview } from '../src/lia/tex-preview.ts';

test('formats a complete integer fraction for the KaTeX preview', () => {
    assert.equal(formatTexForPreview('5/7'), String.raw`\dfrac{5}{7}`);
    assert.equal(formatTexForPreview(' 5 / 7 '), String.raw`\dfrac{5}{7}`);
    assert.equal(formatTexForPreview('-5/+7'), String.raw`\dfrac{-5}{+7}`);
});

test('leaves ambiguous slash expressions and existing LaTeX unchanged', () => {
    const unchanged = [
        'https://example.org/a/b',
        String.raw`\frac{5}{7}`,
        String.raw`\dfrac{5}{7}`,
        '1.5/2.5',
        '5/7/9',
        '5/7+1',
        'x/7',
        '2026/07/20',
    ];

    for (const value of unchanged) {
        assert.equal(formatTexForPreview(value), value);
    }
});
