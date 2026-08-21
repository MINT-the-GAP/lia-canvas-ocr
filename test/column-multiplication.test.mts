import assert from 'node:assert/strict';
import test from 'node:test';

import {
    COLUMN_MULTIPLICATION_SUBMISSION_VERSION,
    MAX_COLUMN_MULTIPLICATION_DIGITS,
    MAX_COLUMN_MULTIPLICATION_SUBMISSION_LENGTH,
    composeColumnMultiplicationLatex,
    createColumnMultiplicationSubmission,
    createExpectedColumnMultiplicationCarrySubmission,
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

test('round-trips the compact carry-mark shape without changing legacy v1', () => {
    const legacy = createExpectedColumnMultiplicationSubmission('738*6=4428');
    const carries = createExpectedColumnMultiplicationCarrySubmission('738*6=4428');
    assert.ok(legacy);
    assert.ok(carries);
    assert.deepEqual(carries.carryMarks, ['2', '4', null]);
    assert.deepEqual(
        decodeColumnMultiplicationSubmission(
            serializeColumnMultiplicationSubmission(carries),
        ),
        carries,
    );
    assert.deepEqual(Object.keys(legacy).sort(), [
        'kind', 'operands', 'partialProducts', 'result', 'version',
    ]);
    assert.equal('carryMarks' in legacy, false);
    assert.equal('partialProducts' in carries, false);
});

test('grades missing, extra and wrong compact carries separately', () => {
    const observed = (carryMarks: Array<string | null>, result = '4428') => {
        const submission = createColumnMultiplicationSubmission({
            operands: ['738', '6'],
            carryMarks,
            result,
        });
        assert.ok(submission);
        return validateColumnMultiplicationSubmission('738*6', submission);
    };

    assert.deepEqual(
        { ...observed(['2', '4', null]), expected: undefined, submission: undefined },
        {
            accepted: true,
            outcome: 'correct',
            reason: 'valid',
            expected: undefined,
            submission: undefined,
        },
    );
    let grade = observed([null, '4', null]);
    assert.equal(grade.outcome, 'incomplete');
    assert.equal(grade.reason, 'missing-carry-mark');
    assert.equal(grade.carryColumn, 0);

    grade = observed(['2', '4', '1']);
    assert.equal(grade.outcome, 'incorrect');
    assert.equal(grade.reason, 'unexpected-carry-mark');
    assert.equal(grade.carryColumn, 2);

    grade = observed(['2', '3', null]);
    assert.equal(grade.outcome, 'incorrect');
    assert.equal(grade.reason, 'carry-mark-mismatch');
    assert.equal(grade.carryColumn, 1);

    grade = observed(['2', '4', null], '4429');
    assert.equal(grade.reason, 'result-mismatch');
});

test('accepts an observed no-carry method and rejects carry marks for multi-digit multipliers', () => {
    const noCarry = createExpectedColumnMultiplicationCarrySubmission('101*1=101');
    assert.ok(noCarry);
    assert.deepEqual(noCarry.carryMarks, [null, null, null]);
    assert.equal(
        validateColumnMultiplicationSubmission('101*1', noCarry).accepted,
        true,
    );

    assert.equal(createExpectedColumnMultiplicationCarrySubmission('12*34'), null);
    assert.equal(createColumnMultiplicationSubmission({
        operands: ['12', '34'],
        carryMarks: [null, null],
        result: '408',
    }), null);
    assert.equal(decodeColumnMultiplicationSubmission(JSON.stringify({
        kind: 'column-multiplication',
        version: 1,
        operands: ['12', '34'],
        carryMarks: [null, null],
        result: '408',
    })), null);
});

test('renders the pinned SchulLia row order with red observed place-value zeros', () => {
    const submission = createExpectedColumnMultiplicationSubmission('738*6=4428');
    assert.ok(submission);
    const latex = composeColumnMultiplicationLatex(submission);
    assert.equal(
        latex,
        String.raw`\begin{array}{r} 738 \cdot 6 \\ +42\textcolor{red}{0}\textcolor{red}{0} \\ +18\textcolor{red}{0} \\ +48 \\ \hline 4428 \\ \end{array}`,
    );
    assert.equal((latex.match(/\\textcolor\{red\}\{0\}/gu) || []).length, 3);
    assert.match(latex, /738 \\cdot 6/u);
    assert.doesNotMatch(latex, /738\s*-\s*6/u);
    assert.equal(
        composeColumnMultiplicationLatex(serializeColumnMultiplicationSubmission(submission)),
        latex,
    );
});

test('renders compact observed carry marks red at their multiplicand digits', () => {
    const submission = createExpectedColumnMultiplicationCarrySubmission('738*6=4428');
    assert.ok(submission);
    assert.deepEqual(submission.carryMarks, ['2', '4', null]);
    const latex = composeColumnMultiplicationLatex(submission);
    assert.equal(
        latex,
        String.raw`\begin{array}{r} 7_{\scriptstyle\textcolor{red}{2}}3_{\scriptstyle\textcolor{red}{4}}8 \cdot 6 \\ \hline 4428 \\ \end{array}`,
    );
    assert.equal((latex.match(/\\textcolor\{red\}/gu) || []).length, 2);
    assert.match(latex, /\\hline 4428/u);
});

test('does not synthesize expected multiplication digits while colouring observations', () => {
    const partialProducts = createColumnMultiplicationSubmission({
        operands: ['738', '6'],
        partialProducts: [
            { multiplicandColumn: 2, shift: 2, value: '4290' },
            { multiplicandColumn: 1, shift: 1, value: '170' },
        ],
        result: '4429',
    });
    const carryMarks = createColumnMultiplicationSubmission({
        operands: ['738', '6'],
        carryMarks: ['2', '3', null],
        result: '4429',
    });
    assert.ok(partialProducts);
    assert.ok(carryMarks);
    const partialLatex = composeColumnMultiplicationLatex(partialProducts);
    assert.match(partialLatex, /\+429\\textcolor\{red\}\{0\}/u);
    assert.match(partialLatex, /\+17\\textcolor\{red\}\{0\}/u);
    assert.doesNotMatch(partialLatex, /\+42\\textcolor\{red\}\{0\}\\textcolor\{red\}\{0\}/u);
    assert.doesNotMatch(partialLatex, /\+18\\textcolor\{red\}\{0\}/u);
    const carryLatex = composeColumnMultiplicationLatex(carryMarks);
    assert.match(carryLatex, /3_\{\\scriptstyle\\textcolor\{red\}\{3\}\}/u);
    assert.doesNotMatch(carryLatex, /3_\{\\scriptstyle\\textcolor\{red\}\{4\}\}/u);
    assert.match(carryLatex, /4429/u);
    assert.doesNotMatch(carryLatex, /4428/u);
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
