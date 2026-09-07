import assert from 'node:assert/strict';
import test from 'node:test';
import {
    parseCalculationStatement,
    parseCalculationStructure,
    parseCalculationPromptStructure,
    type CalculationStatement,
} from '../src/math/calculation-structure.ts';

function equation(source: string) {
    const statement = parseCalculationStatement(source);
    assert.equal(statement.kind, 'equation', source);
    if (statement.kind !== 'equation') throw new Error(source);
    return statement;
}
function group(source: string) {
    const statement = parseCalculationStatement(source);
    assert.equal(statement.kind, 'group', source);
    if (statement.kind !== 'group') throw new Error(source);
    return statement;
}
function equations(statement: CalculationStatement): Array<[string, string]> {
    if (statement.kind === 'group') return statement.members.flatMap(equations);
    return statement.kind === 'equation' ? [[statement.left, statement.right]] : [];
}

test('preserves original equation text, symbols and explicit transformation operations', () => {
    const source = String.raw`  2x_1 + 3\cdot x_2 = 7 \mid -3\cdot x_2  `;
    assert.deepEqual(equation(source), {
        kind: 'equation', source, left: String.raw`2x_1 + 3\cdot x_2`, right: '7', operation: String.raw`-3\cdot x_2`,
    });
    assert.deepEqual(equation('$x=4 | :2$'), { kind: 'equation', source: '$x=4 | :2$', left: 'x', right: '4', operation: ':2' });
    assert.equal(equation('x=|y|+2').right, '|y|+2', 'a closing absolute-value bar is not a transformation marker');
    assert.equal(equation(String.raw`\(x=2\)`).left, 'x');
});

test('an equality chain retains all intermediate operands and never supplies a missing side', () => {
    const source = 'x=1+1=2';
    assert.deepEqual(parseCalculationStatement(source), { kind: 'equality-chain', source, operands: ['x', '1+1', '2'] });
    assert.deepEqual(parseCalculationStatement('x=1+1=3'), { kind: 'equality-chain', source: 'x=1+1=3', operands: ['x', '1+1', '3'] });
    for (const source of ['x=', '=2', 'x=2=', 'x==2', 'x<=2', 'x!=2']) {
        assert.equal(parseCalculationStatement(source).kind, 'unsupported', source);
    }
});

test('recognizes explicit roman labels without renaming actual variables', () => {
    for (const source of [String.raw`I. x+y=5`, String.raw`II: x+y=5`, String.raw`(III) x+y=5`,
        String.raw`\text{I}: x+y=5`, String.raw`\mathrm{II}\quad x+y=5`]) {
        const statement = equation(source);
        assert.equal(statement.left, 'x+y');
        assert.match(statement.label || '', /^(I|II|III)$/);
        assert.equal(statement.source, source);
    }
    assert.equal(equation('I=2').label, undefined);
    assert.equal(equation(String.raw`\mathrm{I}=2`).label, undefined);
    assert.deepEqual(parseCalculationStatement('II.'), { kind: 'label', source: 'II.', label: 'II' });
});

test('explicit method headings and prefixed equations retain their role without inheriting it globally', () => {
    const cases = [
        ['Hauptrechnung', 'main'], ['Nebenrechnung', 'auxiliary'], ['Probe', 'check'],
        ['Substitution', 'substitution'], ['Einsetzen', 'substitution'], ['Rücksubstitution', 'back-substitution'],
    ] as const;
    for (const [label, roleHint] of cases) {
        assert.deepEqual(parseCalculationStatement(label + ':'), { kind: 'label', source: label + ':', label, roleHint });
        const statement = equation(label + ': u=x^2');
        assert.equal(statement.roleHint, roleHint);
        assert.equal(statement.left, 'u');
        assert.equal(statement.right, 'x^2');
    }
    assert.equal(equation(String.raw`\text{Nebenrechnung}: 2+2=4`).roleHint, 'auxiliary');
    assert.equal(equation('u=x^2').roleHint, undefined, 'an unlabelled equation does not itself declare a substitution');
    const document = parseCalculationStructure(['Nebenrechnung:', 'u=x^2']);
    assert.equal(document.rows[1].statement.roleHint, undefined, 'role scope belongs to the contextual path validator');
});

test('domain declarations remain original unsupported mathematical content with an explicit role', () => {
    for (const source of [String.raw`D: x\neq0`, String.raw`D=\mathbb{R}\setminus\{0\}`,
        String.raw`\mathbb{D}=\mathbb{R}\setminus\{0\}`]) {
        const statement = parseCalculationStatement(source);
        assert.equal(statement.kind, 'unsupported');
        assert.equal(statement.roleHint, 'domain');
        assert.equal(statement.source, source);
    }
    assert.equal(equation('D=2').roleHint, undefined, 'the letter D may be an ordinary variable');
});

test('standalone cases preserve simultaneous equations while piecewise functions remain unsupported', () => {
    const source = String.raw`\begin{cases}x+y=5\\x-y=1\end{cases}`;
    const statement = group(source);
    assert.equal(statement.format, 'cases');
    assert.equal(statement.semantics, 'system');
    assert.deepEqual(equations(statement), [['x+y', '5'], ['x-y', '1']]);
    assert.equal(statement.source, source);
    for (const unsupported of [
        String.raw`f(x)=\begin{cases}x&x>0\\-x&x\leq0\end{cases}`,
        String.raw`\begin{cases}x=2&x>0\\x=-2&x<0\end{cases}`,
    ]) assert.equal(parseCalculationStatement(unsupported).kind, 'unsupported');
});

test('array alignment is structural only and a visible system brace supplies explicit grouping', () => {
    const inner = String.raw`\begin{array}{rcl}x+y&=&5\\x-y&=&1\end{array}`;
    const plain = group(inner);
    assert.equal(plain.semantics, 'unspecified');
    assert.deepEqual(equations(plain), [['x+y', '5'], ['x-y', '1']]);
    const braced = group(String.raw`\left\{` + inner + String.raw`\right.`);
    assert.equal(braced.semantics, 'system');
    assert.deepEqual(equations(braced), equations(plain));
    assert.equal(parseCalculationStatement(String.raw`\begin{array}{p{3cm}}x=2\end{array}`).kind, 'unsupported');
});

test('aligned rows retain order and multiple alignment columns remain separate statements', () => {
    const statement = group(String.raw`\begin{aligned}2x&=4\\x&=2\end{aligned}`);
    assert.equal(statement.semantics, 'unspecified', 'aligned alone does not select a system or a derivation');
    assert.deepEqual(equations(statement), [['2x', '4'], ['x', '2']]);
    const parallel = group(String.raw`\begin{aligned}x&=2&y&=3\\2x&=4&2y&=6\end{aligned}`);
    assert.equal(parallel.members[0].kind, 'group');
    assert.deepEqual(equations(parallel), [['x', '2'], ['y', '3'], ['2x', '4'], ['2y', '6']]);
    assert.equal(parseCalculationStatement(String.raw`\begin{aligned}&=2\\x&=2\end{aligned}`).kind, 'unsupported', 'missing left sides are never copied from a previous row');
});

test('roman label columns remain associated with their equation', () => {
    const statement = group(String.raw`\begin{aligned}\text{I}&x+y&=5\\x-y&=1&\mathrm{II}\end{aligned}`);
    assert.deepEqual(statement.members.map(member => member.label), ['I', 'II']);
    assert.deepEqual(equations(statement), [['x+y', '5'], ['x-y', '1']]);
});

test('semicolon and explicit spacing compounds remain candidates without guessing root branches', () => {
    for (const source of [String.raw`x_1=2; x_2=-2`, String.raw`x_1=2\quad x_2=-2`,
        String.raw`x_1=2\qquad x_2=-2`, 'x_1=2,5, x_2=-2,5']) {
        const statement = group(source);
        assert.equal(statement.format, 'compound');
        assert.equal(statement.semantics, 'unspecified');
        assert.deepEqual(equations(statement).map(([left]) => left), ['x_1', 'x_2']);
        assert.equal(statement.source, source);
    }
    assert.equal(equation(String.raw`x=\pm2`).right, String.raw`\pm2`);
    assert.equal(equation(String.raw`x_{1,2}=\pm2`).left, 'x_{1,2}');
    assert.equal(equation(String.raw`x=1\quad+2`).right, String.raw`1\quad+2`, 'ordinary expression spacing does not create a second equation');
    for (const source of [String.raw`x=2;`, String.raw`x=2; hier endet mein Weg`, String.raw`x=2\quad\text{denn }y=3`]) {
        assert.equal(parseCalculationStatement(source).kind, 'unsupported', source);
    }
});

test('nested fractions, radicals and subscripts preserve their exact expression spelling', () => {
    const source = String.raw`\frac{x_1+\sqrt{a^2+b^2}}{2}=\frac{3}{4}`;
    const statement = equation(source);
    assert.equal(statement.left, String.raw`\frac{x_1+\sqrt{a^2+b^2}}{2}`);
    assert.equal(statement.right, String.raw`\frac{3}{4}`);
    assert.equal(statement.source, source);
    assert.equal(equation(String.raw`a_{i,j}=2`).left, 'a_{i,j}');
});

test('multiline environment source locations and following independent rows are retained', () => {
    const sourceLines = [
        String.raw`\left\{\begin{array}{rl}`,
        String.raw`x+y&=5\\`,
        String.raw`x-y&=1`,
        String.raw`\end{array}`,
        String.raw`\right.`,
        '', 'Probe:', '3+2=5',
    ];
    const document = parseCalculationStructure(sourceLines);
    assert.deepEqual(document.issues, []);
    assert.deepEqual(document.sourceLines, sourceLines);
    assert.deepEqual(document.rows.map(row => row.sourceLineIndexes), [[0, 1, 2, 3, 4], [5], [6], [7]]);
    assert.equal(document.rows[0].source, sourceLines.slice(0, 5).join('\n'));
    assert.equal(document.rows[0].lastLineIndex, 4);
    assert.equal(document.rows[1].statement.kind, 'unsupported');
    assert.equal(document.rows[1].statement.source, '');
    assert.equal(document.rows[2].statement.roleHint, 'check');
});

test('one-line environments do not swallow the next unrelated row and terminal TeX row spacing stays explicit', () => {
    const source = String.raw`\left\{\begin{array}{rl}x&=2\\y&=3\end{array}\right.`;
    const document = parseCalculationStructure([source, 'Probe:', '2+3=5']);
    assert.equal(document.rows.length, 3);
    assert.deepEqual(document.rows[0].sourceLineIndexes, [0]);
    assert.equal(document.rows[1].statement.roleHint, 'check');
    assert.deepEqual(equations(group(String.raw`\begin{aligned}x&=2\\[2pt]y&=3\\\end{aligned}`)), [['x', '2'], ['y', '3']]);
});

test('unparsed content, incomplete groups and unknown environments never disappear', () => {
    for (const source of ['Das ist meine Nebenrechnung', String.raw`\begin{cases}x=2`,
        String.raw`\begin{cases}x=2\end{aligned}`, String.raw`\begin{aligned}x=2\\\\y=3\end{aligned}`,
        String.raw`\begin{matrix}x=2\\y=3\end{matrix}`, String.raw`\left(x+1)=2`,
        String.raw`x=2 % Kommentar`, String.raw`([x)]=2`]) {
        const statement = parseCalculationStatement(source);
        assert.equal(statement.kind, 'unsupported', source);
        assert.equal(statement.source, source);
    }
    const document = parseCalculationStructure(['x=2', '', 'hier steht eine Notiz', 'y=3']);
    assert.equal(document.rows.length, 4);
    assert.deepEqual(document.rows.map(row => row.source), document.sourceLines);
});

test('row, length and depth bounds preserve the complete source while declining analysis', () => {
    const tooMany = Array.from({ length: 33 }, (_, index) => 'x=' + index);
    const document = parseCalculationStructure(tooMany);
    assert.deepEqual(document.sourceLines, tooMany);
    assert.deepEqual(document.rows, []);
    assert.deepEqual(document.issues, ['row-limit']);
    const longSource = 'x=' + '1'.repeat(16_384);
    assert.equal(parseCalculationStatement(longSource).source, longSource);
    assert.equal(parseCalculationStatement(longSource).kind, 'unsupported');
    assert.deepEqual(parseCalculationStructure([longSource]).issues, ['length-limit']);
    const deep = '{'.repeat(33) + 'x' + '}'.repeat(33) + '=2';
    assert.equal(parseCalculationStatement(deep).kind, 'unsupported');
    assert.equal(parseCalculationStatement(tooMany.join(';')).kind, 'unsupported');
    assert.equal(parseCalculationStructure(Array.from({ length: 32 }, () => 'x=2')).rows.length, 32);
});

test('prompt parser preserves grouped systems without depending on a browser or a CAS', () => {
    const prompt = String.raw`\begin{cases}x+y=5\\x-y=1\end{cases}`;
    const parsed = parseCalculationPromptStructure(prompt);
    assert.equal(parsed.rows.length, 1);
    assert.equal(parsed.rows[0].statement.kind, 'group');
    assert.deepEqual(parsed.sourceLines, [prompt]);
});

test('explicit LGS method labels preserve their declaration without substituting equation symbols', () => {
    for (const label of ['I+II', 'I-II', '2I+3II', '-I+2II']) {
        assert.deepEqual(parseCalculationStatement(label), { kind: 'label', source: label, label });
        const source = label + ': 2x=4';
        assert.equal(equation(source).label, label);
        assert.equal(equation(source).left, '2x');
        assert.equal(equation(String.raw`\text{` + label + ': } 2x=4').label, label);
        assert.equal(parseCalculationStatement(String.raw`\mathrm{` + label + '}').kind, 'label');
    }
    for (const source of ['II in I', String.raw`\text{II in I}`, String.raw`\mathrm{II in I}`]) {
        assert.deepEqual(parseCalculationStatement(source), { kind: 'label', source, label: 'II in I', roleHint: 'substitution' });
    }
    const inserted = equation('II in I: 4a=6a+4-2');
    assert.equal(inserted.label, 'II in I');
    assert.equal(inserted.roleHint, 'substitution');
    assert.equal(inserted.left, '4a');
    assert.equal(inserted.right, '6a+4-2');
});

test('leading implication notation stays in source while the statement can still be parsed', () => {
    for (const source of [String.raw`\Rightarrow x=2`, '⇒ x=2', String.raw`I+II: \Rightarrow 2x=4`]) {
        const parsed = equation(source);
        assert.equal(parsed.source, source);
        assert.equal(parsed.right, source.includes('2x') ? '4' : '2');
    }
    assert.equal(equation(String.raw`\Rightarrow \text{I+II: } 2x=4`).label, 'I+II');
});

test('a roman math variable is not stripped without an explicit label separator', () => {
    for (const source of [String.raw`\mathrm{I}+x=3`, String.raw`\mathrm{I}x=3`]) {
        const statement = equation(source);
        assert.equal(statement.label, undefined);
        assert.equal(statement.left, source.slice(0, source.indexOf('=')));
    }
    assert.equal(equation(String.raw`\mathrm{I}\quad x=3`).label, 'I');
    assert.equal(equation(String.raw`\text{I: }x=3`).label, 'I');
});

test('explicit comma spacing and control word boundaries preserve method operands', () => {
    const source = String.raw`\Rightarrow x_1=3,\quad x_2=2`;
    const parsed = parseCalculationStatement(source);
    assert.equal(parsed.kind, 'group');
    if (parsed.kind !== 'group') return;
    assert.equal(parsed.source, source);
    assert.equal(parsed.members.length, 2);
    assert.equal(parsed.members[1].kind, 'equation');
    if (parsed.members[1].kind === 'equation') assert.equal(parsed.members[1].left, 'x_2');
    assert.equal(equation(String.raw`2x=6\mid\cdot3`).operation, String.raw`\cdot3`);
    assert.equal(equation(String.raw`2x=6\mid\cdotfoo`).operation, undefined);
});
test('legacy OCR arrow aliases expose the equation while preserving original source', () => {
    for (const arrow of [String.raw`\Rarr`, String.raw`\to`]) {
        const source = arrow + String.raw` x=\sqrt[3]{2}`;
        const parsed = equation(source);
        assert.equal(parsed.source, source);
        assert.equal(parsed.left, 'x');
        assert.equal(parsed.right, String.raw`\sqrt[3]{2}`);
        assert.equal(equation('I. ' + arrow + ' x=2').label, 'I');
        assert.equal(equation(arrow + '2x=4').left, '2x');
    }
    for (const source of [String.raw`\tofoo x=2`, String.raw`\Rarrfoo x=2`]) {
        assert.equal(equation(source).left, source.slice(0, source.indexOf('=')));
    }
});