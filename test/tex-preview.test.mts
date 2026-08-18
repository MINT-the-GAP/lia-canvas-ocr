import assert from 'node:assert/strict';
import test from 'node:test';

import {
    MAX_CALCULATION_ANSWER_LENGTH,
    serializeCalculationSubmission,
} from '../src/math/equivalence.ts';
import {
    createColumnAdditionSubmission,
    serializeColumnAdditionSubmission
} from '../src/math/column-arithmetic.ts';
import {
    createExpectedWrittenArithmeticSubmission,
    serializeWrittenArithmeticSubmission
} from '../src/math/written-arithmetic.ts';
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

test('formats serialized calculation JSON as an aligned multiline preview', () => {
    const submission = serializeCalculationSubmission([
        String.raw`3x-5=7 \mid +5`,
        String.raw`3x=12 \mid :3`,
        'x=4',
    ]);

    assert.equal(
        formatTexForPreview(submission),
        String.raw`\begin{aligned} 3x-5&=7 \mid +5 \\ 3x&=12 \mid :3 \\ x&=4 \end{aligned}`,
    );
});

test('formats written addition with two carries and its calculation rule', () => {
    const structured = createColumnAdditionSubmission({
        operands: ['4379', '1544'],
        result: '5923',
        carries: [null, '1', '1', null]
    });
    assert.ok(structured);
    const preview = formatTexForPreview(
        serializeColumnAdditionSubmission(structured)
    );
    assert.match(preview, /\\begin\{array\}/u);
    assert.match(preview, /\\hline/u);
    assert.equal((preview.match(/\{\\scriptstyle 1\}/gu) || []).length, 2);
    assert.doesNotMatch(preview, /111/u);
});

test('formats subtraction, multiplication and long division through the shared preview', () => {
    const cases = [
        ['9002-3487', /-\s*&/u],
        ['738*6', /738 \\cdot 6/u],
        ['8736:8', /\\underline\{-8\}/u]
    ] as const;
    for (const [prompt, marker] of cases) {
        const submission = createExpectedWrittenArithmeticSubmission(prompt);
        assert.ok(submission, prompt);
        const preview = formatTexForPreview(
            serializeWrittenArithmeticSubmission(submission)
        );
        assert.match(preview, /\\begin\{/u);
        assert.match(preview, marker);
    }
    const division = createExpectedWrittenArithmeticSubmission('8736:8');
    assert.ok(division);
    assert.match(
        formatTexForPreview(serializeWrittenArithmeticSubmission(division)),
        /07/u
    );
});

test('leaves malformed calculation JSON unchanged in the preview', () => {
    const malformed = JSON.stringify(['x=1', 42]);
    assert.equal(formatTexForPreview(malformed), malformed);

    const emptyRow = JSON.stringify(['x=1', ' ', 'x=1']);
    assert.equal(formatTexForPreview(emptyRow), emptyRow);
});

test('rejects oversized preview and serializer input safely', () => {
    const oversized = 'x'.repeat(MAX_CALCULATION_ANSWER_LENGTH + 1);
    assert.equal(formatTexForPreview(oversized), '');
    assert.equal(serializeCalculationSubmission([oversized]), '');
});
