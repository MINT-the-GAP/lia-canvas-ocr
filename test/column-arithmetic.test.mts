import assert from 'node:assert/strict';
import test from 'node:test';

import {
    COLUMN_ADDITION_SUBMISSION_VERSION,
    MAX_COLUMN_ADDITION_DIGITS,
    MAX_COLUMN_ADDITION_OPERANDS,
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

test('parses a bounded list of three or more authored summands', () => {
    assert.deepEqual(parseColumnAdditionPrompt('120+34+5=159'), {
        kind: 'column-addition',
        operands: ['120', '34', '5'],
        authoredResult: '159',
        expectedResult: '159',
    });
    assert.deepEqual(
        parseColumnAdditionPrompt(String.raw`\( {0007} + {5} + {08} \)`),
        {
            kind: 'column-addition',
            operands: ['7', '5', '8'],
            authoredResult: null,
            expectedResult: '20',
        },
    );
    assert.equal(parseColumnAdditionPrompt('120'), null);
    assert.equal(parseColumnAdditionPrompt('120++34'), null);
    assert.equal(parseColumnAdditionPrompt('120+34+'), null);
    assert.equal(
        parseColumnAdditionPrompt(
            new Array(MAX_COLUMN_ADDITION_OPERANDS + 1).fill('1').join('+'),
        ),
        null,
    );
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

test('derives variable operand rows and multi-summand carries canonically', () => {
    const submission = createExpectedColumnAdditionSubmission('999+999+999=2997');
    assert.ok(submission);
    assert.deepEqual(submission.operands, ['999', '999', '999']);
    assert.equal(submission.result, '2997');
    assert.deepEqual(submission.carries, [null, '2', '2', '2']);
    assert.deepEqual(
        submission.layout.rows.map(row => [row.role, row.operator]),
        [
            ['first-operand', ''],
            ['second-operand', '+'],
            ['additional-operand', '+'],
            ['carries', ''],
            ['result', ''],
        ],
    );
    assert.deepEqual(submission.layout.rules, [{ kind: 'horizontal', afterRow: 3 }]);
    assert.deepEqual(submission.layout.rows[3].cells, ['2', '2', '2', null]);
});

test('keeps multi-digit carries when many summands share one column', () => {
    const prompt = new Array(MAX_COLUMN_ADDITION_OPERANDS).fill('9').join('+');
    const submission = createExpectedColumnAdditionSubmission(prompt);
    assert.ok(submission);
    assert.equal(submission.result, '288');
    assert.deepEqual(submission.carries, [null, '28', '2']);
    assert.deepEqual(
        submission.layout.rows[MAX_COLUMN_ADDITION_OPERANDS].cells,
        ['2', '28', null],
    );
});

test('round-trips only the canonical versioned JSON object', () => {
    const submission = createExpectedColumnAdditionSubmission('4379+1544=5923');
    assert.ok(submission);
    const serialized = serializeColumnAdditionSubmission(submission);
    assert.ok(serialized.startsWith('{'));
    assert.equal(
        serialized,
        JSON.stringify({
            kind: 'column-addition',
            version: 1,
            operands: ['4379', '1544'],
            result: '5923',
            carries: [null, '1', '1', null],
            layout: {
                columns: 4,
                rows: [
                    { role: 'first-operand', operator: '', cells: ['4', '3', '7', '9'] },
                    { role: 'second-operand', operator: '+', cells: ['1', '5', '4', '4'] },
                    { role: 'carries', operator: '', cells: [null, '1', '1', null] },
                    { role: 'result', operator: '', cells: ['5', '9', '2', '3'] },
                ],
                rules: [{ kind: 'horizontal', afterRow: 2 }],
            },
        }),
        'the legacy two-summand v1 wire format remains byte-for-byte stable',
    );
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

    const multiple = createExpectedColumnAdditionSubmission('120+34+5=159');
    assert.ok(multiple);
    assert.deepEqual(
        decodeColumnAdditionSubmission(serializeColumnAdditionSubmission(multiple)),
        multiple,
    );
});

test('composes the SchulLia addition layout with red full-size carries', () => {
    const submission = createExpectedColumnAdditionSubmission('4379+1544=5923');
    assert.ok(submission);
    assert.equal(
        composeColumnAdditionLatex(submission),
        String.raw`\begin{array}{r} 4379 \\ +1544 \\ \hspace{0.5em}\hspace{0.25em}\mathclap{\textcolor{red}{1}}\hspace{0.25em}\hspace{0.25em}\mathclap{\textcolor{red}{1}}\hspace{0.25em}\hspace{0.5em} \\ \hline 5923 \\ \end{array}`,
    );
    assert.equal(
        composeColumnAdditionLatex(serializeColumnAdditionSubmission(submission)),
        composeColumnAdditionLatex(submission),
    );

    const reported = createExpectedColumnAdditionSubmission('4728+3596=8324');
    assert.ok(reported);
    assert.equal(
        composeColumnAdditionLatex(reported),
        String.raw`\begin{array}{r} 4728 \\ +3596 \\ \hspace{0.25em}\mathclap{\textcolor{red}{1}}\hspace{0.25em}\hspace{0.25em}\mathclap{\textcolor{red}{1}}\hspace{0.25em}\hspace{0.25em}\mathclap{\textcolor{red}{1}}\hspace{0.25em}\hspace{0.5em} \\ \hline 8324 \\ \end{array}`,
    );

    const withoutCarries = createExpectedColumnAdditionSubmission('2415+1213=3628');
    assert.ok(withoutCarries);
    const noCarryLatex = composeColumnAdditionLatex(withoutCarries);
    assert.equal(
        noCarryLatex,
        String.raw`\begin{array}{r} 2415 \\ +1213 \\ \hline 3628 \\ \end{array}`,
    );
    assert.doesNotMatch(noCarryLatex, /textcolor|scriptstyle/u);

    const multiple = createExpectedColumnAdditionSubmission('999+999+999=2997');
    assert.ok(multiple);
    assert.equal(
        composeColumnAdditionLatex(multiple),
        String.raw`\begin{array}{r} 999 \\ +999 \\ +999 \\ \hspace{0.25em}\mathclap{\textcolor{red}{2}}\hspace{0.25em}\hspace{0.25em}\mathclap{\textcolor{red}{2}}\hspace{0.25em}\hspace{0.25em}\mathclap{\textcolor{red}{2}}\hspace{0.25em}\hspace{0.5em} \\ \hline 2997 \\ \end{array}`,
    );

    const multiDigitCarry = createColumnAdditionSubmission({
        operands: ['9', '9'],
        result: '18',
        carries: [null, '10'],
    });
    assert.ok(multiDigitCarry);
    const multiDigitLatex = composeColumnAdditionLatex(multiDigitCarry);
    assert.match(
        multiDigitLatex,
        /\\hspace\{0\.25em\}\\mathclap\{\\textcolor\{red\}\{10\}\}\\hspace\{0\.25em\}/u,
        'a multi-digit carry occupies exactly one centered place-value cell',
    );
    assert.equal((multiDigitLatex.match(/\\mathclap/gu) || []).length, 1);
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

test('validates the number and order of every observed summand', () => {
    const exact = createExpectedColumnAdditionSubmission('100+20+3=123');
    const missingOperand = createColumnAdditionSubmission({
        operands: ['100', '20'],
        result: '123',
        carries: [],
    });
    const wrongOrder = createColumnAdditionSubmission({
        operands: ['100', '3', '20'],
        result: '123',
        carries: [],
    });
    assert.ok(exact);
    assert.ok(missingOperand);
    assert.ok(wrongOrder);
    assert.equal(
        validateColumnAdditionSubmission('100+20+3', exact).reason,
        'valid',
    );
    assert.equal(
        validateColumnAdditionSubmission('100+20+3', missingOperand).reason,
        'operand-mismatch',
    );
    assert.equal(
        validateColumnAdditionSubmission('100+20+3', wrongOrder).reason,
        'operand-mismatch',
    );
});

test('serializes only observed multi-summand values without prompt synthesis', () => {
    const observed = createColumnAdditionSubmission({
        operands: ['010', '020', '031'],
        result: '0999',
        carries: ['07'],
    });
    assert.ok(observed);
    assert.deepEqual(observed.operands, ['10', '20', '31']);
    assert.equal(observed.result, '999');
    assert.deepEqual(observed.carries, ['7', null, null]);
    const decoded = decodeColumnAdditionSubmission(
        serializeColumnAdditionSubmission(observed),
    );
    assert.deepEqual(decoded, observed);
    assert.equal(
        validateColumnAdditionSubmission('10+20+30', observed).reason,
        'operand-mismatch',
        'the independent observation is graded, never replaced with prompt values',
    );
});

test('rejects 8224 for the documented 4728 plus 3596 task', () => {
    const wrongResult = createColumnAdditionSubmission({
        operands: ['4728', '3596'],
        result: '8224',
        carries: [null, '1', '1', '1'],
    });
    assert.ok(wrongResult);
    const grade = validateColumnAdditionSubmission('4728+3596', wrongResult);
    assert.equal(grade.accepted, false);
    assert.equal(grade.outcome, 'incorrect');
    assert.equal(grade.reason, 'result-mismatch');
    assert.equal(grade.expected?.result, '8324');
});

test('rejects malformed and oversized prompts/submissions safely', () => {
    assert.equal(parseColumnAdditionPrompt(`${'9'.repeat(MAX_COLUMN_ADDITION_DIGITS + 1)}+1`), null);
    assert.equal(createColumnAdditionSubmission({
        operands: ['9'.repeat(MAX_COLUMN_ADDITION_DIGITS + 1), '1'],
        result: '0',
        carries: [],
    }), null);
    assert.equal(createColumnAdditionSubmission({
        operands: ['1'],
        result: '1',
        carries: [],
    }), null);
    assert.equal(createColumnAdditionSubmission({
        operands: new Array(MAX_COLUMN_ADDITION_OPERANDS + 1).fill('1'),
        result: '33',
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
