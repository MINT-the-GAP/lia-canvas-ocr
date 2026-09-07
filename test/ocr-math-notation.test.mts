import assert from 'node:assert/strict';
import test from 'node:test';

import { normalizeCalculationNotation } from '../src/ocr/math-notation.ts';

test('scalar multiplication uses a dot without inventing the variable x', () => {
  const cases = [
    [String.raw`2\times3=6`, String.raw`2\cdot3=6`],
    [String.raw`a\times b=c`, String.raw`a\cdot b=c`],
    [String.raw`x\times(x+1)=2`, String.raw`x\cdot(x+1)=2`],
    [String.raw`\frac{a\times b}{2}\times 4`, String.raw`\frac{a\cdot b}{2}\cdot 4`],
    [String.raw`2x\cdot x=8`, String.raw`2x\cdot x=8`],
    [String.raw`2\times2=5`, String.raw`2\cdot2=5`],
  ];
  for (const [input, expected] of cases) assert.equal(normalizeCalculationNotation(input), expected);
});

test('Unicode multiplication produces delimited TeX commands and division uses a colon', () => {
  const cases = [
    ['2×x=6', String.raw`2\cdot x=6`],
    ['a×b=c', String.raw`a\cdot b=c`],
    ['2×3=6', String.raw`2\cdot3=6`],
    ['12÷3=4', '12:3=4'],
    [String.raw`12 \div 3=4`, '12 : 3=4'],
    [String.raw`\alpha×\beta`, String.raw`\alpha\cdot\beta`],
  ];
  for (const [input, expected] of cases) assert.equal(normalizeCalculationNotation(input), expected);
});

test('explicit local vector notation preserves a cross including subscripts and groups', () => {
  const cases = [
    String.raw`\vec{a}\times\vec{b}`,
    String.raw`\vec a\times\vec b`,
    String.raw`\vec{a}_1\times b`,
    String.raw`\vec{a}_{12}^{(2)}\times b`,
    String.raw`a\times\overrightarrow{BC}`,
    String.raw`(\vec{a}+\vec{b})\times\vec{c}`,
    String.raw`\left(\vec{a}+\vec{b}\right)\times\vec{c}`,
    String.raw`\mathbf{a}\times\boldsymbol{b}`,
    String.raw`a\times\begin{pmatrix}1\\2\\3\end{pmatrix}`,
    String.raw`\begin{pmatrix}1\\2\\3\end{pmatrix}\times b`,
  ];
  for (const input of cases) assert.equal(normalizeCalculationNotation(input), input);
  assert.equal(normalizeCalculationNotation(String.raw`\vec{a}×b`), String.raw`\vec{a}\times b`);
});

test('vector notation elsewhere does not prevent scalar multiplication normalization', () => {
  const input = String.raw`\vec{c}=2\times3\vec{a}+\vec{a}\times\vec{b}+a\times b`;
  assert.equal(
    normalizeCalculationNotation(input),
    String.raw`\vec{c}=2\cdot3\vec{a}+\vec{a}\times\vec{b}+a\cdot b`,
  );
  assert.equal(
    normalizeCalculationNotation(String.raw`\begin{pmatrix}2\times3\\4\end{pmatrix}\times\vec{a}`),
    String.raw`\begin{pmatrix}2\cdot3\\4\end{pmatrix}\times\vec{a}`,
  );
});

test('text arguments, TeX command boundaries and verbatim text remain intact', () => {
  const cases = [
    String.raw`\timescale + \divergence + \timesx`,
    String.raw`\text{a × b und \div sowie {\times}}`,
    String.raw`\operatorname*{a×b}`,
    String.raw`\mbox{a\times b} + \textbf{×}`,
    String.raw`\text{geschweift \{ a×b \} fertig}`,
    String.raw`\verb|a×b\times c|`,
    String.raw`\verb*+a×b+`,
    String.raw`\text{unvollständig a×b`,
    String.raw`\\times + \\div`,
  ];
  for (const input of cases) assert.equal(normalizeCalculationNotation(input), input);
  assert.equal(
    normalizeCalculationNotation(String.raw`\text{a×b} + 2×x`),
    String.raw`\text{a×b} + 2\cdot x`,
  );
});

test('comments remain intact and normalization resumes on the next line', () => {
  assert.equal(
    normalizeCalculationNotation('2×3 % a×b \\times\n4×5'),
    '2\\cdot3 % a×b \\times\n4\\cdot5',
  );
});

test('normalization is idempotent and handles incomplete OCR output', () => {
  for (const input of ['', '\\', '\\times', '×x', '{2×3', String.raw`\vec{a}_1\times b`]) {
    const normalized = normalizeCalculationNotation(input);
    assert.equal(normalizeCalculationNotation(normalized), normalized);
  }
});

test('numeric scalar factors next to vectors use a dot', () => {
  const cases = [
    [String.raw`2\times\vec{a}`, String.raw`2\cdot\vec{a}`],
    [String.raw`\vec{a}\times2`, String.raw`\vec{a}\cdot2`],
    [String.raw`\vec{a}\times -2`, String.raw`\vec{a}\cdot -2`],
    [String.raw`\vec{a}_1\times 2`, String.raw`\vec{a}_1\cdot 2`],
  ];
  for (const [input, expected] of cases) assert.equal(normalizeCalculationNotation(input), expected);
});

test('a numeric prefix of a scaled vector is not a complete scalar operand', () => {
  const vectorProducts = [
    String.raw`\vec{a}\times2\vec{b}`,
    String.raw`\vec{a}\times-2\vec{b}`,
    String.raw`\vec{a}\times -2 \vec{b}`,
    String.raw`\vec{a}\times{2}\vec{b}`,
    String.raw`\vec{a}\times(-2)\vec{b}`,
    String.raw`\vec{a}2\times\vec{b}`,
  ];
  for (const input of vectorProducts) assert.equal(normalizeCalculationNotation(input), input);
  const scalarProducts = [
    [String.raw`\vec{a}\times{2}`, String.raw`\vec{a}\cdot{2}`],
    [String.raw`{2}\times\vec{a}`, String.raw`{2}\cdot\vec{a}`],
    [String.raw`\vec{a}\times(-2)`, String.raw`\vec{a}\cdot(-2)`],
    [String.raw`\vec{a}\times2,5+\vec{b}`, String.raw`\vec{a}\cdot2,5+\vec{b}`],
    [String.raw`2\times\vec{a}`, String.raw`2\cdot\vec{a}`],
  ];
  for (const [input, expected] of scalarProducts) {
    assert.equal(normalizeCalculationNotation(input), expected);
    assert.equal(normalizeCalculationNotation(expected), expected);
  }
});
