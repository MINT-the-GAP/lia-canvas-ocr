import assert from 'node:assert/strict';
import test from 'node:test';

import {
    COLUMN_ADDITION_SUBMISSION_VERSION,
    MAX_COLUMN_ADDITION_DIGITS,
    MAX_COLUMN_ADDITION_SUBMISSION_LENGTH,
    composeColumnAdditionLatex,
    createColumnAdditionSubmission,
    createExpectedColumnAdditionSubmission,
    decodeColumnAdditionSubmission,
    parseColumnAdditionPrompt,
    serializeColumnAdditionSubmission,
    validateColumnAdditionSubmission,
} from '../src/math/column-arithmetic.ts';

test('parses plain and reasonably grouped TeX addition prompts exactly', () => {
    const expected = {
        kind: 'column-addition',
        operands: ['4379', '1544'],
        authoredResult: '5923',
        expectedResult: '5923',
    };
    assert.deepEqual(parseColumnAdditionPrompt('4379+1544=5923'), expected);
    assert.deepEqual(
        parseColumnAdditionPrompt(String.raw`\( {4379}\, + {{1544}} = {5923} \)`),
        expected,
    );
    assert.deepEqual(parseColumnAdditionPrompt('4379+1544'), {
        ...expected,
        authoredResult: null,
    });
    assert.deepEqual(parseColumnAdditionPrompt('0007+0005=0012'), {
        kind: 'column-addition',
        operands: ['7', '5'],
        authoredResult: '12',
        expectedResult: '12',
    });
});

test('does not mistake existing equation arrays or multi-row TeX for a prompt', () => {
    assert.equal(parseColumnAdditionPrompt(JSON.stringify(['4379+1544', '5923'])), null);
    assert.equal(
        parseColumnAdditionPrompt(String.raw`\begin{array}{r}4379+1544\\5923\end{array}`),
        null,
    );
    assert.equal(
        parseColumnAdditionPrompt(String.raw`\begin{aligned}4379+1544&=5923\end{aligned}`),
        null,
    );
    assert.equal(parseColumnAdditionPrompt('x+1544=5923'), null);
    assert.equal(parseColumnAdditionPrompt('4379+1544=5923=5923'), null);
});

test('derives exactly the two incoming carries at tens and hundreds', () => {
    const submission = createExpectedColumnAdditionSubmission('4379+1544=5923');
    assert.ok(submission);
    assert.equal(submission.version, COLUMN_ADDITION_SUBMISSION_VERSION);
    assert.deepEqual(submission.operands, ['4379', '1544']);
    assert.equal(submission.result, '5923');
    assert.deepEqual(
        submission.carries,
        [null, '1', '1', null],
        'index 0 is ones; only target columns 1 (tens) and 2 (hundreds) carry',
    );
    assert.deepEqual(submission.layout.rows[2], {
        role: 'carries',
        operator: '',
        cells: [null, '1', '1', null],
    });
    assert.deepEqual(submission.layout.rules, [{ kind: 'horizontal', afterRow: 2 }]);
});

test('handles a final carry without converting the operands to Number', () => {
    const submission = createExpectedColumnAdditionSubmission('999+1');
    assert.ok(submission);
    assert.equal(submission.result, '1000');
    assert.deepEqual(submission.carries, [null, '1', '1', '1']);

    const wide = '9'.repeat(MAX_COLUMN_ADDITION_DIGITS);
    const exact = createExpectedColumnAdditionSubmission(`${wide}+1`);
    assert.ok(exact);
    assert.equal(exact.result, `1${'0'.repeat(MAX_COLUMN_ADDITION_DIGITS)}`);
    assert.equal(exact.carries.length, MAX_COLUMN_ADDITION_DIGITS + 1);
    assert.equal(exact.carries[0], null);
    assert.ok(exact.carries.slice(1).every(carry => carry === '1'));
});

test('round-trips only the canonical versioned JSON object', () => {
    const submission = createExpectedColumnAdditionSubmission('4379+1544=5923');
    assert.ok(submission);
    const serialized = serializeColumnAdditionSubmission(submission);
    assert.ok(serialized.startsWith('{'));
    assert.deepEqual(decodeColumnAdditionSubmission(serialized), submission);

    assert.equal(decodeColumnAdditionSubmission(JSON.stringify(['4379+1544', '5923'])), null);
    assert.equal(decodeColumnAdditionSubmission(JSON.stringify({
        ...submission,
        version: 2,
    })), null);
    assert.equal(decodeColumnAdditionSubmission(JSON.stringify({
        ...submission,
        layout: { ...submission.layout, columns: 5 },
    })), null);
});

test('composes an exact KaTeX array and preserves the horizontal rule', () => {
    const submission = createExpectedColumnAdditionSubmission('4379+1544=5923');
    assert.ok(submission);
    assert.equal(
        composeColumnAdditionLatex(submission),
        String.raw`\begin{array}{rrrrr}  & 4 & 3 & 7 & 9 \\ + & 1 & 5 & 4 & 4 \\  &  & {\scriptstyle 1} & {\scriptstyle 1} & \\ \hline  & 5 & 9 & 2 & 3 \end{array}`,
    );
    assert.equal(
        composeColumnAdditionLatex(serializeColumnAdditionSubmission(submission)),
        composeColumnAdditionLatex(submission),
    );
});

test('accepts the exact written addition and rejects an extra third carry', () => {
    const exact = createColumnAdditionSubmission({
        operands: ['4379', '1544'],
        result: '5923',
        carries: [null, '1', '1', null],
    });
    const extraCarry = createColumnAdditionSubmission({
        operands: ['4379', '1544'],
        result: '5923',
        carries: [null, '1', '1', '1'],
    });
    assert.ok(exact);
    assert.ok(extraCarry);
    assert.deepEqual(validateColumnAdditionSubmission('4379+1544=5923', exact), {
        accepted: true,
        outcome: 'correct',
        reason: 'valid',
        expected: exact,
        submission: exact,
    });
    const grade = validateColumnAdditionSubmission('4379+1544=5923', extraCarry);
    assert.equal(grade.accepted, false);
    assert.equal(grade.outcome, 'incorrect');
    assert.equal(grade.reason, 'carry-mismatch');
    assert.equal(grade.carryColumn, 3);
});

test('treats missing required carries conservatively as incomplete', () => {
    const missing = createColumnAdditionSubmission({
        operands: ['4379', '1544'],
        result: '5923',
        carries: [null, '1'],
    });
    assert.ok(missing);
    const grade = validateColumnAdditionSubmission('4379+1544', missing);
    assert.equal(grade.accepted, false);
    assert.equal(grade.outcome, 'incomplete');
    assert.equal(grade.reason, 'missing-carry');
    assert.equal(grade.carryColumn, 2);

    const wrong = createColumnAdditionSubmission({
        operands: ['4379', '1544'],
        result: '5923',
        carries: [null, '1', '2', null],
    });
    assert.ok(wrong);
    const wrongGrade = validateColumnAdditionSubmission('4379+1544', wrong);
    assert.equal(wrongGrade.outcome, 'incorrect');
    assert.equal(wrongGrade.reason, 'carry-mismatch');
    assert.equal(wrongGrade.carryColumn, 2);
});

test('validates observed operands and result independently of carries', () => {
    const wrongOperand = createColumnAdditionSubmission({
        operands: ['4378', '1544'],
        result: '5923',
        carries: [null, '1', '1', null],
    });
    const wrongResult = createColumnAdditionSubmission({
        operands: ['4379', '1544'],
        result: '5924',
        carries: [null, '1', '1', null],
    });
    assert.ok(wrongOperand);
    assert.ok(wrongResult);
    assert.equal(
        validateColumnAdditionSubmission('4379+1544', wrongOperand).reason,
        'operand-mismatch',
    );
    assert.equal(
        validateColumnAdditionSubmission('4379+1544', wrongResult).reason,
        'result-mismatch',
    );
    assert.equal(
        validateColumnAdditionSubmission('4379+1544=5924', wrongResult).reason,
        'prompt-result-mismatch',
        'an arithmetically wrong authored result is not silently accepted',
    );
});

test('rejects malformed and oversized prompts/submissions safely', () => {
    assert.equal(parseColumnAdditionPrompt(`${'9'.repeat(MAX_COLUMN_ADDITION_DIGITS + 1)}+1`), null);
    assert.equal(createColumnAdditionSubmission({
        operands: ['9'.repeat(MAX_COLUMN_ADDITION_DIGITS + 1), '1'],
        result: '0',
        carries: [],
    }), null);
    assert.equal(decodeColumnAdditionSubmission('{bad json'), null);
    assert.equal(
        decodeColumnAdditionSubmission('x'.repeat(MAX_COLUMN_ADDITION_SUBMISSION_LENGTH + 1)),
        null,
    );

    const submission = createExpectedColumnAdditionSubmission('12+9=21');
    assert.ok(submission);
    const malformed = structuredClone(submission);
    malformed.layout.rows[0].cells[0] = String.raw`\hline`;
    assert.equal(decodeColumnAdditionSubmission(JSON.stringify(malformed)), null);
    assert.equal(composeColumnAdditionLatex(JSON.stringify(['12+9', '21'])), '');
});
