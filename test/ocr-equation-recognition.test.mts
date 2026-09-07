import assert from 'node:assert/strict';
import test from 'node:test';
import { composeOcrEquationChunks, isCompleteOcrEquationPart } from '../src/ocr/equation-recognition.ts';

test('joins long equation operands without computing, rewriting or dropping their content', () => {
    assert.equal(composeOcrEquationChunks([String.raw`3x+2\cdot 4-7`, '19']), String.raw`3x+2\cdot 4-7 = 19`);
    assert.equal(composeOcrEquationChunks(['2+2', '5', '6']), '2+2 = 5 = 6');
    assert.equal(composeOcrEquationChunks(['X', 'x']), 'X = x');
});

test('accepts complete nested fractions, radicals, functions and superscripts from material structures', () => {
    for (const part of [
        String.raw`\frac{\frac{1}{2}x^3-2x^2-3}{x^2-3x}`,
        String.raw`\left(x+\frac{b}{2a}\right)^2`,
        String.raw`-\frac{b}{2a}\pm\sqrt{\left(\frac{b}{2a}\right)^2-\frac{c}{a}}`,
        String.raw`\sqrt[6]{\left[\frac{a^9}{(-a)^6}\cdot a^{-7}\right]^3}^{2^4}`,
        String.raw`f'(x)`, String.raw`\sin(x)`, String.raw`x_{1,2}`, '0',
    ]) assert.equal(isCompleteOcrEquationPart(part), true, part);
});

test('rejects incomplete or crossed brackets even when a pair of bad parts would balance together', () => {
    for (const parts of [['(x+1', '2)'], ['{x', '2}'], ['x)', '(2'], ['([x)]', '2'], [String.raw`\left(x)`, '2']]) {
        assert.equal(composeOcrEquationChunks(parts), null, parts.join('='));
    }
});

test('rejects missing fraction/radical arguments, dangling operators and unfinished exponents', () => {
    for (const part of [String.raw`\frac{1}`, String.raw`\frac{}{2}`, String.raw`\sqrt[3]`,
        String.raw`\sqrt[]{x}`, String.raw`\sqrt{}`, 'x^', 'x_', 'x^{}', 'x_{}', 'x+', 'x-', 'x/', 'x,',
        String.raw`x\cdot`, String.raw`\sin`, 'x\\', '\uFFFD']) {
        assert.equal(composeOcrEquationChunks([part, '2']), null, part);
    }
});

test('rejects relations, operation bars, text and independent layouts inside a purported operand', () => {
    for (const part of ['x=3', 'x<3', 'x\u22642', 'x|+2', String.raw`x\mid+2`, String.raw`x\leq 3`,
        String.raw`\begin{matrix}1\\2\end{matrix}`, String.raw`\text{x=2}`, 'x\n2', '$x$', 'x% comment']) {
        assert.equal(composeOcrEquationChunks([part, '2']), null, part);
    }
});

test('does not return a partial result for missing, empty or excessive crops', () => {
    for (const parts of [[], ['1'], ['', '2'], ['1', ' '], ['1', '2', '3', '4', '5']]) {
        assert.equal(composeOcrEquationChunks(parts), null);
    }
});

test('incomplete nested operands also require the complete-line fallback', () => {
    for (const part of [String.raw`\frac{x+}{2}`, String.raw`x^{2+}`, String.raw`\sqrt{2+}`,
        String.raw`\left(x+\right)`, String.raw`\frac{x\cdot}{2}`, '(x+)', '(x-)', 'x^{2/}', 'f()']) {
        assert.equal(composeOcrEquationChunks([part, '3']), null, part);
    }
    assert.equal(isCompleteOcrEquationPart(String.raw`\frac{x+1}{2}`), true);
    assert.equal(isCompleteOcrEquationPart(String.raw`\left(x+1\right)`), true);
});

test('rejects a model-invented script without a base instead of publishing a partial equation', () => {
    for (const part of ['^{12+3}', '_{12}', '^2', '/2', '*2', String.raw`\cdot2`]) {
        assert.equal(composeOcrEquationChunks(['3x+12', part]), null, part);
    }
});

test('uses only the observed leading equality as context, without repairing an incomplete operand', () => {
    assert.equal(composeOcrEquationChunks(['3x+12', '= 12+3'], true), '3x+12 = 12+3');
    assert.equal(composeOcrEquationChunks(['3x+12', '12+3'], true), '3x+12 = 12+3');
    assert.equal(composeOcrEquationChunks(['a', '=b', '=c'], true), 'a = b = c');
    for (const part of ['==2', '=2=3', '=^{12+3}', '=x+', '=']) {
        assert.equal(composeOcrEquationChunks(['x', part], true), null, part);
    }
    assert.equal(composeOcrEquationChunks(['3x+12', '= 12+3']), null);
});

test('requires a real script base inside every nested group', () => {
    for (const part of [
        '{^{2}}', '{_{2}}', String.raw`\frac{1}{^{2}}`, String.raw`\frac{_2}{3}`,
        String.raw`x^{a+^{2}}`, String.raw`x_{a\cdot_{2}}`, String.raw`\sqrt[^{3}]{x}`,
        String.raw`\left(^{2}\right)`, String.raw`\frac{1}{\quad ^{2}}`,
    ]) {
        assert.equal(isCompleteOcrEquationPart(part), false, part);
        assert.equal(composeOcrEquationChunks(['x', part]), null, part);
    }
    for (const part of [
        String.raw`x^{2^{3}}`, String.raw`a_{n_{k}}`, String.raw`\frac{x_i^2}{y^{a_n}}`,
        String.raw`\sqrt[3]{(x+1)^{a_{n+1}}}`, String.raw`\left(x+\alpha\right)_{n}^{2}`,
        String.raw`{x\quad ^{2}}`, String.raw`{\displaystyle x^{2}}`, String.raw`\sin^{2}(x)`, String.raw`\log_2(x)`, 'x_1^2',
    ]) assert.equal(isCompleteOcrEquationPart(part), true, part);
});
