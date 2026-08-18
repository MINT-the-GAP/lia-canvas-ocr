import assert from 'node:assert/strict';
import test from 'node:test';

import {
    COLUMN_MULTIPLICATION_SUBMISSION_VERSION,
    MAX_COLUMN_MULTIPLICATION_DIGITS,
    MAX_COLUMN_MULTIPLICATION_SUBMISSION_LENGTH,
    composeColumnMultiplicationLatex,
    createColumnMultiplicationSubmission,
    createExpectedColumnMultiplicationSubmission,
    decodeColumnMultiplicationSubmission,
    parseColumnMultiplicationPrompt,
    serializeColumnMultiplicationSubmission,
    validateColumnMultiplicationSubmission,
} from '../src/math/column-multiplication.ts';

test('parses plain, Unicode and grouped TeX multiplication prompts exactly', () => {
    const expected = {
        kind: 'column-multiplication',
        operands: ['738', '6'],
        authoredResult: '4428',
        expectedResult: '4428',
    };
    assert.deepEqual(parseColumnMultiplicationPrompt('738*6=4428'), expected);
    assert.deepEqual(parseColumnMultiplicationPrompt('738 · 6 = 4428'), expected);
    assert.deepEqual(
        parseColumnMultiplicationPrompt(String.raw`\( {738}\,\cdot {{6}} = {4428} \)`),
        expected,
    );
    assert.deepEqual(parseColumnMultiplicationPrompt(String.raw`738\times6`), {
        ...expected,
        authoredResult: null,
    });
    assert.deepEqual(parseColumnMultiplicationPrompt('0007×0005=0035'), {
        kind: 'column-multiplication',
        operands: ['7', '5'],
        authoredResult: '35',
        expectedResult: '35',
    });
});

test('does not mistake arrays, multiple rows or algebra for a multiplication prompt', () => {
    assert.equal(parseColumnMultiplicationPrompt(JSON.stringify(['738*6', '4428'])), null);
    assert.equal(
        parseColumnMultiplicationPrompt(String.raw`\begin{array}{r}738\cdot6\\4428\end{array}`),
        null,
    );
    assert.equal(parseColumnMultiplicationPrompt('x*6=42'), null);
    assert.equal(parseColumnMultiplicationPrompt('738+6=744'), null);
    assert.equal(parseColumnMultiplicationPrompt('738*6=4428=4428'), null);
});

test('derives the pinned SchulLia place-value rows for 738 times 6', () => {
    const submission = createExpectedColumnMultiplicationSubmission(
        String.raw`738\cdot6=4428`,
    );
    assert.ok(submission);
    assert.equal(submission.version, COLUMN_MULTIPLICATION_SUBMISSION_VERSION);
    assert.deepEqual(submission.operands, ['738', '6']);
    assert.deepEqual(submission.partialProducts, [
        { multiplicandColumn: 2, shift: 2, value: '4200' },
        { multiplicandColumn: 1, shift: 1, value: '180' },
        { multiplicandColumn: 0, shift: 0, value: '48' },
    ]);
    assert.equal(submission.result, '4428');
});

test('requires the explicit shifted zero row shown by the 2405 times 7 example', () => {
    const submission = createExpectedColumnMultiplicationSubmission('2405*7=16835');
    assert.ok(submission);
    assert.deepEqual(submission.partialProducts, [
        { multiplicandColumn: 3, shift: 3, value: '14000' },
        { multiplicandColumn: 2, shift: 2, value: '2800' },
        { multiplicandColumn: 1, shift: 1, value: '00' },
        { multiplicandColumn: 0, shift: 0, value: '35' },
    ]);

    const missingZeroRow = createColumnMultiplicationSubmission({
        operands: ['2405', '7'],
        partialProducts: [
            { multiplicandColumn: 3, shift: 3, value: '14000' },
            { multiplicandColumn: 2, shift: 2, value: '2800' },
            { multiplicandColumn: 0, shift: 0, value: '35' },
        ],
        result: '16835',
    });
    assert.ok(missingZeroRow);
    const grade = validateColumnMultiplicationSubmission('2405*7', missingZeroRow);
    assert.equal(grade.outcome, 'incomplete');
    assert.equal(grade.reason, 'missing-partial-product');
    assert.equal(grade.partialProductColumn, 1);
});

test('generalises the same multiplicand-digit method to a multi-digit multiplier', () => {
    const submission = createExpectedColumnMultiplicationSubmission('12*34=408');
    assert.ok(submission);
    assert.deepEqual(submission.partialProducts, [
        { multiplicandColumn: 1, shift: 1, value: '340' },
        { multiplicandColumn: 0, shift: 0, value: '68' },
    ]);
    assert.equal(submission.result, '408');
});

test('multiplies the full supported width exactly without Number coercion', () => {
    const wide = '9'.repeat(MAX_COLUMN_MULTIPLICATION_DIGITS);
    const submission = createExpectedColumnMultiplicationSubmission(`${wide}*${wide}`);
    assert.ok(submission);
    assert.equal(
        submission.result,
        `${'9'.repeat(MAX_COLUMN_MULTIPLICATION_DIGITS - 1)}8` +
            `${'0'.repeat(MAX_COLUMN_MULTIPLICATION_DIGITS - 1)}1`,
    );
    assert.equal(submission.partialProducts.length, MAX_COLUMN_MULTIPLICATION_DIGITS);
    assert.equal(submission.partialProducts[0].shift, MAX_COLUMN_MULTIPLICATION_DIGITS - 1);
});

test('round-trips only canonical versioned multiplication JSON', () => {
    const submission = createExpectedColumnMultiplicationSubmission('738*6=4428');
    assert.ok(submission);
    const serialized = serializeColumnMultiplicationSubmission(submission);
    assert.ok(serialized.startsWith('{'));
    assert.deepEqual(decodeColumnMultiplicationSubmission(serialized), submission);

    assert.equal(decodeColumnMultiplicationSubmission(JSON.stringify(['738*6', '4428'])), null);
    assert.equal(decodeColumnMultiplicationSubmission(JSON.stringify({
        ...submission,
        version: 2,
    })), null);
    assert.equal(decodeColumnMultiplicationSubmission(JSON.stringify({
        ...submission,
        extra: true,
    })), null);
    assert.equal(decodeColumnMultiplicationSubmission(JSON.stringify({
        ...submission,
        partialProducts: [
            submission.partialProducts[0],
            submission.partialProducts[0],
        ],
    })), null);
});

test('renders the SchulLia row order without coloured assistance', () => {
    const submission = createExpectedColumnMultiplicationSubmission('738*6=4428');
    assert.ok(submission);
    const latex = composeColumnMultiplicationLatex(submission);
    assert.equal(
        latex,
        String.raw`\begin{array}{r} 738 \cdot 6 \\ +4200 \\ +180 \\ +48 \\ \hline 4428 \end{array}`,
    );
    assert.equal(latex.includes('textcolor'), false);
    assert.equal(
        composeColumnMultiplicationLatex(serializeColumnMultiplicationSubmission(submission)),
        latex,
    );
});

test('validates every partial product, its shift, row order and final result', () => {
    const exact = createExpectedColumnMultiplicationSubmission('738*6=4428');
    assert.ok(exact);
    assert.equal(validateColumnMultiplicationSubmission('738*6', exact).accepted, true);

    const wrongProduct = structuredClone(exact);
    wrongProduct.partialProducts[1].value = '170';
    let grade = validateColumnMultiplicationSubmission('738*6', wrongProduct);
    assert.equal(grade.reason, 'partial-product-mismatch');
    assert.equal(grade.partialProductColumn, 1);

    const wrongShift = structuredClone(exact);
    wrongShift.partialProducts[1].shift = 0;
    grade = validateColumnMultiplicationSubmission('738*6', wrongShift);
    assert.equal(grade.reason, 'shift-mismatch');
    assert.equal(grade.partialProductColumn, 1);

    const wrongOrder = structuredClone(exact);
    wrongOrder.partialProducts.reverse();
    grade = validateColumnMultiplicationSubmission('738*6', wrongOrder);
    assert.equal(grade.reason, 'partial-product-order-mismatch');

    const wrongResult = structuredClone(exact);
    wrongResult.result = '4429';
    assert.equal(
        validateColumnMultiplicationSubmission('738*6', wrongResult).reason,
        'result-mismatch',
    );
});

test('rejects inconsistent authored answers, malformed rows and oversized input', () => {
    const exact = createExpectedColumnMultiplicationSubmission('738*6');
    assert.ok(exact);
    assert.equal(
        validateColumnMultiplicationSubmission('738*6=4429', exact).reason,
        'prompt-result-mismatch',
    );
    assert.equal(createExpectedColumnMultiplicationSubmission('738*6=4429'), null);
    assert.equal(createColumnMultiplicationSubmission({
        operands: ['738', '6'],
        partialProducts: [
            { multiplicandColumn: 3, shift: 3, value: '42000' },
        ],
        result: '4428',
    }), null);
    assert.equal(decodeColumnMultiplicationSubmission('{bad json'), null);
    assert.equal(
        decodeColumnMultiplicationSubmission(
            'x'.repeat(MAX_COLUMN_MULTIPLICATION_SUBMISSION_LENGTH + 1),
        ),
        null,
    );
    assert.equal(
        parseColumnMultiplicationPrompt(
            `${'9'.repeat(MAX_COLUMN_MULTIPLICATION_DIGITS + 1)}*1`,
        ),
        null,
    );
});
