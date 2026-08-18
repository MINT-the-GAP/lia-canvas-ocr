import assert from 'node:assert/strict';
import test from 'node:test';

import {
    MAX_COLUMN_DIVISION_DIGITS,
    MAX_COLUMN_DIVISION_SUBMISSION_LENGTH,
    composeColumnDivisionLatex,
    createColumnDivisionSubmission,
    createExpectedColumnDivisionSubmission,
    decodeColumnDivisionSubmission,
    parseColumnDivisionPrompt,
    serializeColumnDivisionSubmission,
    validateColumnDivisionSubmission,
    type ColumnDivisionStep,
} from '../src/math/column-division.ts';

test('parses plain and grouped TeX integer-division prompts', () => {
    assert.deepEqual(parseColumnDivisionPrompt('46872:6=7812'), {
        kind: 'column-division',
        dividend: '46872',
        divisor: '6',
        authoredQuotient: '7812',
        authoredRemainder: null,
        expectedQuotient: '7812',
        expectedRemainder: '0',
    });
    assert.deepEqual(parseColumnDivisionPrompt(String.raw`\({8736}\,\div {8}\)`), {
        kind: 'column-division',
        dividend: '8736',
        divisor: '8',
        authoredQuotient: null,
        authoredRemainder: null,
        expectedQuotient: '1092',
        expectedRemainder: '0',
    });
    assert.deepEqual(parseColumnDivisionPrompt(String.raw`17:5=3\;\text{Rest}\;2`), {
        kind: 'column-division',
        dividend: '17',
        divisor: '5',
        authoredQuotient: '3',
        authoredRemainder: '2',
        expectedQuotient: '3',
        expectedRemainder: '2',
    });
    assert.equal(parseColumnDivisionPrompt('12:0'), null);
});

test('does not parse legacy equation arrays or multiline TeX as division', () => {
    assert.equal(parseColumnDivisionPrompt(JSON.stringify(['8736:8=1092', '07', '73'])), null);
    assert.equal(
        parseColumnDivisionPrompt(String.raw`\begin{aligned}8736:8&=1092\\07\end{aligned}`),
        null,
    );
    assert.equal(parseColumnDivisionPrompt('8736:8=1092=1092'), null);
    assert.equal(parseColumnDivisionPrompt('x:8=2'), null);
});

test('derives every pinned 8736:8 step and preserves partial 07', () => {
    const submission = createExpectedColumnDivisionSubmission('8736:8=1092');
    assert.ok(submission);
    assert.equal(submission.quotient, '1092');
    assert.equal(submission.remainder, null);
    assert.deepEqual(submission.steps, [
        {
            partialDividend: '8',
            partialDividendStart: 0,
            partialDividendEnd: 0,
            quotientDigit: '1',
            subtractedProduct: '8',
            subtractedProductStart: 0,
            remainder: '0',
            remainderPosition: 0,
            broughtDownDigit: '7',
            broughtDownPosition: 1,
        },
        {
            partialDividend: '07',
            partialDividendStart: 0,
            partialDividendEnd: 1,
            quotientDigit: '0',
            subtractedProduct: '0',
            subtractedProductStart: 1,
            remainder: '7',
            remainderPosition: 1,
            broughtDownDigit: '3',
            broughtDownPosition: 2,
        },
        {
            partialDividend: '73',
            partialDividendStart: 1,
            partialDividendEnd: 2,
            quotientDigit: '9',
            subtractedProduct: '72',
            subtractedProductStart: 1,
            remainder: '1',
            remainderPosition: 2,
            broughtDownDigit: '6',
            broughtDownPosition: 3,
        },
        {
            partialDividend: '16',
            partialDividendStart: 2,
            partialDividendEnd: 3,
            quotientDigit: '2',
            subtractedProduct: '16',
            subtractedProductStart: 2,
            remainder: '0',
            remainderPosition: 3,
            broughtDownDigit: null,
            broughtDownPosition: null,
        },
    ]);
});

test('derives the pinned 46872:6 partial-dividend sequence', () => {
    const submission = createExpectedColumnDivisionSubmission('46872:6=7812');
    assert.ok(submission);
    assert.deepEqual(
        submission.steps.map(step => ({
            partialDividend: step.partialDividend,
            subtractedProduct: step.subtractedProduct,
            remainder: step.remainder,
            broughtDownDigit: step.broughtDownDigit,
        })),
        [
            { partialDividend: '46', subtractedProduct: '42', remainder: '4', broughtDownDigit: '8' },
            { partialDividend: '48', subtractedProduct: '48', remainder: '0', broughtDownDigit: '7' },
            { partialDividend: '07', subtractedProduct: '6', remainder: '1', broughtDownDigit: '2' },
            { partialDividend: '12', subtractedProduct: '12', remainder: '0', broughtDownDigit: null },
        ],
    );
});

test('supports an explicit nonzero remainder and dividend smaller than divisor', () => {
    const remainder = createExpectedColumnDivisionSubmission('17:5=3 R 2');
    assert.ok(remainder);
    assert.equal(remainder.quotient, '3');
    assert.equal(remainder.remainder, '2');
    assert.equal(remainder.steps.length, 1);

    const smaller = createExpectedColumnDivisionSubmission('3:8');
    assert.ok(smaller);
    assert.equal(smaller.quotient, '0');
    assert.equal(smaller.remainder, '3');
    assert.deepEqual(smaller.steps.map(step => [
        step.partialDividend,
        step.quotientDigit,
        step.subtractedProduct,
        step.remainder,
    ]), [['3', '0', '0', '3']]);
});

test('serializes and decodes only the strict versioned object shape', () => {
    const submission = createExpectedColumnDivisionSubmission('8736:8=1092');
    assert.ok(submission);
    const serialized = serializeColumnDivisionSubmission(submission);
    assert.ok(serialized.startsWith('{'));
    assert.deepEqual(decodeColumnDivisionSubmission(serialized), submission);
    assert.equal(decodeColumnDivisionSubmission(JSON.stringify(['8736:8=1092', '07'])), null);
    assert.equal(decodeColumnDivisionSubmission(JSON.stringify({
        ...submission,
        version: 2,
    })), null);
    assert.equal(decodeColumnDivisionSubmission(JSON.stringify({
        ...submission,
        extra: true,
    })), null);
});

test('renders the pinned alternating rows without color and with leading zero', () => {
    const submission = createExpectedColumnDivisionSubmission('8736:8=1092');
    assert.ok(submission);
    const latex = composeColumnDivisionLatex(submission);
    assert.equal(
        latex,
        String.raw`\begin{aligned} 8736:8&=1092 \\ \underline{-8}\phantom{000}\phantom{:8}& \\ 07\phantom{00}\phantom{:8}& \\ \phantom{0}\underline{-0}\phantom{00}\phantom{:8}& \\ \phantom{0}73\phantom{0}\phantom{:8}& \\ \phantom{0}\underline{-72}\phantom{0}\phantom{:8}& \\ \phantom{00}16\phantom{:8}& \\ \phantom{00}\underline{-16}\phantom{:8}& \\ \phantom{000}0\phantom{:8}& \end{aligned}`,
    );
    assert.match(latex, /07/u);
    assert.doesNotMatch(latex, /color/iu);
});

test('validates quotient, remainder and every required long-division step', () => {
    const exact = createExpectedColumnDivisionSubmission('8736:8=1092');
    assert.ok(exact);
    assert.equal(validateColumnDivisionSubmission('8736:8=1092', exact).outcome, 'correct');

    const wrongQuotient = createColumnDivisionSubmission({ ...exact, quotient: '1093' });
    assert.ok(wrongQuotient);
    assert.equal(
        validateColumnDivisionSubmission('8736:8', wrongQuotient).reason,
        'quotient-mismatch',
    );

    const wrongSteps = structuredClone(exact.steps);
    wrongSteps[1].partialDividend = '17';
    const wrongStep = createColumnDivisionSubmission({ ...exact, steps: wrongSteps });
    assert.ok(wrongStep);
    const wrongStepGrade = validateColumnDivisionSubmission('8736:8', wrongStep);
    assert.equal(wrongStepGrade.outcome, 'incorrect');
    assert.equal(wrongStepGrade.reason, 'step-mismatch');
    assert.equal(wrongStepGrade.stepIndex, 1);
    assert.equal(wrongStepGrade.stepField, 'partialDividend');

    const missingStep = createColumnDivisionSubmission({
        ...exact,
        steps: exact.steps.slice(0, -1),
    });
    assert.ok(missingStep);
    const missingGrade = validateColumnDivisionSubmission('8736:8', missingStep);
    assert.equal(missingGrade.outcome, 'incomplete');
    assert.equal(missingGrade.reason, 'missing-step');
});

test('requires a nonzero remainder but permits omitted or written zero for exact division', () => {
    const inexact = createExpectedColumnDivisionSubmission('17:5');
    assert.ok(inexact);
    const missing = createColumnDivisionSubmission({ ...inexact, remainder: null });
    assert.ok(missing);
    const missingGrade = validateColumnDivisionSubmission('17:5', missing);
    assert.equal(missingGrade.outcome, 'incomplete');
    assert.equal(missingGrade.reason, 'missing-remainder');

    const exact = createExpectedColumnDivisionSubmission('46872:6');
    assert.ok(exact);
    const writtenZero = createColumnDivisionSubmission({ ...exact, remainder: '0' });
    assert.ok(writtenZero);
    assert.equal(validateColumnDivisionSubmission('46872:6', writtenZero).accepted, true);
});

test('rejects malformed positions, huge values and oversized JSON safely', () => {
    const huge = '9'.repeat(MAX_COLUMN_DIVISION_DIGITS + 1);
    assert.equal(parseColumnDivisionPrompt(`${huge}:3`), null);
    assert.equal(decodeColumnDivisionSubmission('{bad json'), null);
    assert.equal(
        decodeColumnDivisionSubmission('x'.repeat(MAX_COLUMN_DIVISION_SUBMISSION_LENGTH + 1)),
        null,
    );

    const exact = createExpectedColumnDivisionSubmission('17:5');
    assert.ok(exact);
    const malformedStep: ColumnDivisionStep = {
        ...exact.steps[0],
        broughtDownDigit: '7',
        broughtDownPosition: null,
    };
    assert.equal(createColumnDivisionSubmission({ ...exact, steps: [malformedStep] }), null);

    const tampered = structuredClone(exact);
    tampered.steps[0].subtractedProduct = String.raw`\hline`;
    assert.equal(decodeColumnDivisionSubmission(JSON.stringify(tampered)), null);
    assert.equal(composeColumnDivisionLatex(JSON.stringify(['17:5=3', '2'])), '');
});

test('keeps core division exact at the configured decimal-string limit', () => {
    const dividend = '9'.repeat(MAX_COLUMN_DIVISION_DIGITS);
    const submission = createExpectedColumnDivisionSubmission(`${dividend}:9`);
    assert.ok(submission);
    assert.equal(submission.quotient, '1'.repeat(MAX_COLUMN_DIVISION_DIGITS));
    assert.equal(submission.remainder, null);
    assert.equal(submission.steps.length, MAX_COLUMN_DIVISION_DIGITS);
});
