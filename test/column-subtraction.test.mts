import assert from 'node:assert/strict';
import test from 'node:test';

import {
    COLUMN_SUBTRACTION_SUBMISSION_VERSION,
    MAX_COLUMN_SUBTRACTION_DIGITS,
    MAX_COLUMN_SUBTRACTION_SUBMISSION_LENGTH,
    composeColumnSubtractionLatex,
    createColumnSubtractionSubmission,
    createExpectedColumnSubtractionSubmission,
    decodeColumnSubtractionSubmission,
    parseColumnSubtractionPrompt,
    serializeColumnSubtractionSubmission,
    validateColumnSubtractionSubmission,
} from '../src/math/column-subtraction.ts';

test('parses plain and reasonably grouped TeX subtraction prompts exactly', () => {
    const expected = {
        kind: 'column-subtraction',
        operands: ['9002', '3487'],
        authoredResult: '5515',
        expectedResult: '5515',
    };
    assert.deepEqual(parseColumnSubtractionPrompt('9002-3487=5515'), expected);
    assert.deepEqual(
        parseColumnSubtractionPrompt(String.raw`\( {9002}\, - {{3487}} = {5515} \)`),
        expected,
    );
    assert.deepEqual(parseColumnSubtractionPrompt('9002 − 3487'), {
        ...expected,
        authoredResult: null,
    });
    assert.deepEqual(parseColumnSubtractionPrompt('0012-0005=0007'), {
        kind: 'column-subtraction',
        operands: ['12', '5'],
        authoredResult: '7',
        expectedResult: '7',
    });
});

test('rejects negative differences, equations with variables and multi-row TeX', () => {
    assert.equal(parseColumnSubtractionPrompt('5-12=-7'), null);
    assert.equal(parseColumnSubtractionPrompt('5-12'), null);
    assert.equal(parseColumnSubtractionPrompt('x-3=7'), null);
    assert.equal(parseColumnSubtractionPrompt('12-5=7=7'), null);
    assert.equal(parseColumnSubtractionPrompt(JSON.stringify(['12-5', '7'])), null);
    assert.equal(
        parseColumnSubtractionPrompt(String.raw`\begin{array}{r}12-5\\7\end{array}`),
        null,
    );
});

test('derives the source-convention borrow targets for 9002 minus 3487', () => {
    const submission = createExpectedColumnSubtractionSubmission('9002-3487=5515');
    assert.ok(submission);
    assert.equal(submission.version, COLUMN_SUBTRACTION_SUBMISSION_VERSION);
    assert.deepEqual(submission.operands, ['9002', '3487']);
    assert.equal(submission.result, '5515');
    assert.deepEqual(
        submission.borrows,
        [null, '1', '1', '1'],
        'the ones operation borrows into tens, then hundreds, then thousands',
    );
    assert.deepEqual(submission.layout.rows[2], {
        role: 'borrows',
        operator: '-',
        cells: ['1', '1', '1', null],
    });
    assert.deepEqual(submission.layout.rules, [{ kind: 'horizontal', afterRow: 2 }]);
});

test('matches the second pinned SchulLia example with four borrow marks', () => {
    const submission = createExpectedColumnSubtractionSubmission('64310-28945=35365');
    assert.ok(submission);
    assert.equal(submission.result, '35365');
    assert.deepEqual(submission.borrows, [null, '1', '1', '1', '1']);
    assert.deepEqual(submission.layout.rows[2].cells, ['1', '1', '1', '1', null]);
});

test('handles no borrow, equality, zero chains and the full supported width exactly', () => {
    const noBorrow = createExpectedColumnSubtractionSubmission('987-123');
    assert.ok(noBorrow);
    assert.deepEqual(noBorrow.borrows, [null, null, null]);
    assert.deepEqual(
        noBorrow.layout.rows.map(row => row.role),
        ['first-operand', 'second-operand', 'result'],
        'an entirely empty borrow row is omitted',
    );
    assert.deepEqual(noBorrow.layout.rules, [{ kind: 'horizontal', afterRow: 1 }]);
    assert.equal(
        composeColumnSubtractionLatex(noBorrow),
        String.raw`\begin{array}{rrrr}  & 9 & 8 & 7 \\ - & 1 & 2 & 3 \\ \hline  & 8 & 6 & 4 \end{array}`,
    );
    assert.equal(createExpectedColumnSubtractionSubmission('123-123')?.result, '0');

    const chain = createExpectedColumnSubtractionSubmission('1000-1=999');
    assert.ok(chain);
    assert.deepEqual(chain.borrows, [null, '1', '1', '1']);

    const wideMinuend = `1${'0'.repeat(MAX_COLUMN_SUBTRACTION_DIGITS - 1)}`;
    const exact = createExpectedColumnSubtractionSubmission(`${wideMinuend}-1`);
    assert.ok(exact);
    assert.equal(exact.result, '9'.repeat(MAX_COLUMN_SUBTRACTION_DIGITS - 1));
    assert.equal(exact.borrows.length, MAX_COLUMN_SUBTRACTION_DIGITS);
    assert.equal(exact.borrows[0], null);
    assert.ok(exact.borrows.slice(1).every(borrow => borrow === '1'));
});

test('round-trips only the canonical versioned JSON shape', () => {
    const submission = createExpectedColumnSubtractionSubmission('9002-3487=5515');
    assert.ok(submission);
    const serialized = serializeColumnSubtractionSubmission(submission);
    assert.ok(serialized.startsWith('{'));
    assert.deepEqual(decodeColumnSubtractionSubmission(serialized), submission);

    assert.equal(decodeColumnSubtractionSubmission(JSON.stringify(['9002-3487', '5515'])), null);
    assert.equal(decodeColumnSubtractionSubmission(JSON.stringify({
        ...submission,
        version: 2,
    })), null);
    assert.equal(decodeColumnSubtractionSubmission(JSON.stringify({
        ...submission,
        layout: { ...submission.layout, columns: 5 },
    })), null);
    assert.equal(decodeColumnSubtractionSubmission(JSON.stringify({
        ...submission,
        unexpected: true,
    })), null);
});

test('composes the source-style KaTeX array without color support', () => {
    const submission = createExpectedColumnSubtractionSubmission('9002-3487=5515');
    assert.ok(submission);
    assert.equal(
        composeColumnSubtractionLatex(submission),
        String.raw`\begin{array}{rrrrr}  & 9 & 0 & 0 & 2 \\ - & 3 & 4 & 8 & 7 \\ - & {\scriptstyle 1} & {\scriptstyle 1} & {\scriptstyle 1} & \\ \hline  & 5 & 5 & 1 & 5 \end{array}`,
    );
    assert.doesNotMatch(composeColumnSubtractionLatex(submission), /textcolor/u);
    assert.equal(
        composeColumnSubtractionLatex(serializeColumnSubtractionSubmission(submission)),
        composeColumnSubtractionLatex(submission),
    );
});

test('accepts the exact subtraction and rejects a misplaced or extra borrow', () => {
    const exact = createColumnSubtractionSubmission({
        operands: ['9002', '3487'],
        result: '5515',
        borrows: [null, '1', '1', '1'],
    });
    const misplaced = createColumnSubtractionSubmission({
        operands: ['9002', '3487'],
        result: '5515',
        borrows: ['1', null, '1', '1'],
    });
    assert.ok(exact);
    assert.ok(misplaced);
    assert.deepEqual(validateColumnSubtractionSubmission('9002-3487=5515', exact), {
        accepted: true,
        outcome: 'correct',
        reason: 'valid',
        expected: exact,
        submission: exact,
    });
    const grade = validateColumnSubtractionSubmission('9002-3487=5515', misplaced);
    assert.equal(grade.accepted, false);
    assert.equal(grade.outcome, 'incorrect');
    assert.equal(grade.reason, 'borrow-mismatch');
    assert.equal(grade.borrowColumn, 0, 'a written mark is not moved to its expected column');
});

test('distinguishes missing borrows from wrong borrow digits', () => {
    const missing = createColumnSubtractionSubmission({
        operands: ['9002', '3487'],
        result: '5515',
        borrows: [null, '1'],
    });
    assert.ok(missing);
    const grade = validateColumnSubtractionSubmission('9002-3487', missing);
    assert.equal(grade.accepted, false);
    assert.equal(grade.outcome, 'incomplete');
    assert.equal(grade.reason, 'missing-borrow');
    assert.equal(grade.borrowColumn, 2);

    const wrong = createColumnSubtractionSubmission({
        operands: ['9002', '3487'],
        result: '5515',
        borrows: [null, '1', '2', '1'],
    });
    assert.ok(wrong);
    const wrongGrade = validateColumnSubtractionSubmission('9002-3487', wrong);
    assert.equal(wrongGrade.outcome, 'incorrect');
    assert.equal(wrongGrade.reason, 'borrow-mismatch');
    assert.equal(wrongGrade.borrowColumn, 2);
});

test('grades the observed operands and result independently of borrow marks', () => {
    const wrongOperand = createColumnSubtractionSubmission({
        operands: ['9003', '3487'],
        result: '5515',
        borrows: [null, '1', '1', '1'],
    });
    const wrongResult = createColumnSubtractionSubmission({
        operands: ['9002', '3487'],
        result: '5516',
        borrows: [null, '1', '1', '1'],
    });
    assert.ok(wrongOperand);
    assert.ok(wrongResult);
    assert.equal(
        validateColumnSubtractionSubmission('9002-3487', wrongOperand).reason,
        'operand-mismatch',
    );
    assert.equal(
        validateColumnSubtractionSubmission('9002-3487', wrongResult).reason,
        'result-mismatch',
    );
    assert.equal(
        validateColumnSubtractionSubmission('9002-3487=5516', wrongResult).reason,
        'prompt-result-mismatch',
        'an arithmetically wrong authored result is not silently accepted',
    );
});

test('rejects malformed and oversized prompts/submissions safely', () => {
    assert.equal(
        parseColumnSubtractionPrompt(`${'9'.repeat(MAX_COLUMN_SUBTRACTION_DIGITS + 1)}-1`),
        null,
    );
    assert.equal(createColumnSubtractionSubmission({
        operands: ['9'.repeat(MAX_COLUMN_SUBTRACTION_DIGITS + 1), '1'],
        result: '0',
        borrows: [],
    }), null);
    assert.equal(createColumnSubtractionSubmission({
        operands: ['1', '2'],
        result: '0',
        borrows: [],
    }), null);
    assert.equal(decodeColumnSubtractionSubmission('{bad json'), null);
    assert.equal(
        decodeColumnSubtractionSubmission('x'.repeat(MAX_COLUMN_SUBTRACTION_SUBMISSION_LENGTH + 1)),
        null,
    );

    const submission = createExpectedColumnSubtractionSubmission('12-5=7');
    assert.ok(submission);
    const malformed = structuredClone(submission);
    malformed.layout.rows[2].cells[0] = String.raw`\hline`;
    assert.equal(decodeColumnSubtractionSubmission(JSON.stringify(malformed)), null);
    assert.equal(composeColumnSubtractionLatex(JSON.stringify(['12-5', '7'])), '');
});
