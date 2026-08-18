import assert from 'node:assert/strict';
import test from 'node:test';

import {
    MAX_WRITTEN_ARITHMETIC_SUBMISSION_LENGTH,
    composeWrittenArithmeticLatex,
    createExpectedWrittenArithmeticSubmission,
    decodeWrittenArithmeticSubmission,
    parseWrittenArithmeticPrompt,
    serializeWrittenArithmeticSubmission,
    validateWrittenArithmeticSubmission,
    writtenArithmeticLayoutRowCount
} from '../src/math/written-arithmetic.ts';

test('selects all four written layouts from the authored prompt only', () => {
    assert.equal(parseWrittenArithmeticPrompt('4379+1544')?.kind, 'column-addition');
    assert.equal(parseWrittenArithmeticPrompt('9002-3487')?.kind, 'column-subtraction');
    assert.equal(
        parseWrittenArithmeticPrompt(String.raw`\(738\cdot 6\)`)?.kind,
        'column-multiplication'
    );
    assert.equal(parseWrittenArithmeticPrompt('8736:8')?.kind, 'column-division');

    assert.equal(parseWrittenArithmeticPrompt('3x^2-7=9'), null);
    assert.equal(parseWrittenArithmeticPrompt('["4379+1544","5923"]'), null);
    assert.equal(parseWrittenArithmeticPrompt('12+3\n15'), null);
});

test('round-trips, renders and counts every written-arithmetic submission', () => {
    const cases = [
        ['4379+1544', 'column-addition', 4],
        ['9002-3487', 'column-subtraction', 4],
        ['738*6', 'column-multiplication', 5],
        ['8736:8', 'column-division', 9]
    ] as const;

    for (const [prompt, kind, rows] of cases) {
        const submission = createExpectedWrittenArithmeticSubmission(prompt);
        assert.ok(submission, prompt);
        assert.equal(submission.kind, kind);
        const serialized = serializeWrittenArithmeticSubmission(submission);
        assert.ok(serialized.startsWith('{'));
        assert.deepEqual(decodeWrittenArithmeticSubmission(serialized), submission);
        assert.match(composeWrittenArithmeticLatex(serialized), /\\begin\{/u);
        assert.equal(writtenArithmeticLayoutRowCount(serialized), rows);
        assert.equal(validateWrittenArithmeticSubmission(prompt, serialized).accepted, true);
    }
});

test('keeps model boundaries strict when validating a structured answer', () => {
    const subtraction = createExpectedWrittenArithmeticSubmission('12-5');
    assert.ok(subtraction);
    const wrongKind = validateWrittenArithmeticSubmission('7+5', subtraction);
    assert.equal(wrongKind.accepted, false);
    assert.equal(wrongKind.reason, 'invalid-format');

    const multiplication = createExpectedWrittenArithmeticSubmission('738*6');
    assert.ok(multiplication && multiplication.kind === 'column-multiplication');
    multiplication.partialProducts[0].value = '9999';
    const observed = serializeWrittenArithmeticSubmission(multiplication);
    assert.ok(observed);
    assert.match(composeWrittenArithmeticLatex(observed), /\+9999/u);
    const grade = validateWrittenArithmeticSubmission('738*6', observed);
    assert.equal(grade.accepted, false);
    assert.equal(grade.reason, 'partial-product-mismatch');
});

test('rejects malformed, unknown, legacy and oversized dispatcher input safely', () => {
    assert.equal(decodeWrittenArithmeticSubmission('{bad json'), null);
    assert.equal(decodeWrittenArithmeticSubmission(JSON.stringify({ kind: 'other' })), null);
    assert.equal(decodeWrittenArithmeticSubmission(JSON.stringify(['12+5', '17'])), null);
    assert.equal(
        decodeWrittenArithmeticSubmission('x'.repeat(MAX_WRITTEN_ARITHMETIC_SUBMISSION_LENGTH + 1)),
        null
    );
    assert.equal(composeWrittenArithmeticLatex('{"kind":"column-addition"}'), '');
    assert.equal(writtenArithmeticLayoutRowCount('{"kind":"column-addition"}'), 0);
    assert.deepEqual(validateWrittenArithmeticSubmission('x=4', 'x=4'), {
        accepted: false,
        outcome: 'unknown',
        reason: 'invalid-prompt'
    });
});
