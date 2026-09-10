import assert from 'node:assert/strict';
import test from 'node:test';

import { normalizeOcrTexNumbers } from '../src/ocr/math-notation.ts';

test('joins OCR-split numeric runs including inside roots, fractions and grouped indices', () => {
  const cases = [
    [String.raw`\sqrt { 1 3 }`, String.raw`\sqrt { 13 }`],
    [String.raw`\sqrt{13}`, String.raw`\sqrt{13}`],
    [String.raw`\sqrt { 13 }`, String.raw`\sqrt { 13 }`],
    ['1 2 3 + 4 5', '123 + 45'],
    ['1\t2\r\n3', '123'],
    [String.raw`\frac { 1 3 } { 2 6 }`, String.raw`\frac { 13 } { 26 }`],
    [String.raw`x_{1 3}^{2 4}`, String.raw`x_{13}^{24}`],
    [String.raw`\sqrt[1 3]{2 6}`, String.raw`\sqrt[13]{26}`],
    ['1 2.3 4 + 5 6,7 8', '12.34 + 56,78'],
    [String.raw`\sqrt { 1 3`, String.raw`\sqrt { 13`],
  ];
  for (const [input, expected] of cases) {
    assert.equal(normalizeOcrTexNumbers(input), expected, input);
    assert.equal(normalizeOcrTexNumbers(expected), expected, 'idempotent: ' + input);
  }
});

test('preserves explicit products, spacing commands, variables and command delimiters', () => {
  const unchanged = [
    String.raw`\sqrt { 1 \cdot 3 }`,
    String.raw`\sqrt { 1 \times 3 }`,
    String.raw`\sqrt { 1 * 3 }`,
    String.raw`1 \, 3 + 1 \quad 3 + 1 \ 3 + 1~3`,
    String.raw`\sin x + \alpha x + a b + 1 x 3`,
    String.raw`\frac{1}{3} + {1} {3}`,
    '1, 3 + 1 . 3',
    String.raw`\vec{a} \times \vec{b}`,
    String.raw`\timescale 1 + \divergence 3`,
    '', '\\',
  ];
  for (const input of unchanged) assert.equal(normalizeOcrTexNumbers(input), input, input);
  assert.equal(
    normalizeOcrTexNumbers(String.raw`\sqrt { 1 3 \cdot 2 4 } + \sin x + a b`),
    String.raw`\sqrt { 13 \cdot 24 } + \sin x + a b`,
  );
});

test('keeps text, nested text groups, verbatim and comments byte-for-byte', () => {
  const unchanged = [
    String.raw`\text { 1 3 und {4 5} }`,
    String.raw`\textbf{1  3} + \mbox{4 5} + \hbox{6 7}`,
    String.raw`\operatorname* {log 1 3}`,
    String.raw`\operatorname * {log 1 3}`,
    String.raw`\text{escaped \{ 1 3 \} braces}`,
    String.raw`\verb|1 3| + \verb*+4 5+`,
    String.raw`\text{unfinished 1 3`,
  ];
  for (const input of unchanged) assert.equal(normalizeOcrTexNumbers(input), input, input);
  assert.equal(normalizeOcrTexNumbers('1 3 % comment 4 5\n6 7'), '13 % comment 4 5\n67');
  for (const input of [
    '\\sqrt % comment\n 1 3',
    '\\text % comment\n {1 3}',
    '\\operatorname % comment\n * {log 1 3}',
  ]) assert.equal(normalizeOcrTexNumbers(input), input, input);
  assert.equal(
    normalizeOcrTexNumbers(String.raw`\text{1 3} + \sqrt{1 3}`),
    String.raw`\text{1 3} + \sqrt{13}`,
  );
});

test('does not merge separate unbraced TeX arguments or script operands', () => {
  const unchanged = [
    String.raw`\frac 1 3`, String.raw`\dfrac 1 3`, String.raw`\tfrac 1 3`,
    String.raw`\binom 1 3`, String.raw`\sqrt 1 3`,
    String.raw`\sqrt[3]1 3`,
    'x^1 3 + x_1 3', String.raw`\hat 1 3`,
    String.raw`\mathrm 1 3`, String.raw`\text 1 3`,
    String.raw`\overset 1 3`, String.raw`\underset 1 3`,
    String.raw`\boxed 1 3`, String.raw`\overbrace 1 3`, String.raw`\phantom 1 3`,
    String.raw`\textcolor{red}1 3`,
  ];
  for (const input of unchanged) assert.equal(normalizeOcrTexNumbers(input), input, input);
  assert.equal(normalizeOcrTexNumbers(String.raw`\frac 1 3 + 4 5`), String.raw`\frac 1 3 + 45`);
  assert.equal(normalizeOcrTexNumbers('x^1 3 4'), 'x^1 34');
  assert.equal(normalizeOcrTexNumbers(String.raw`\frac{1 3}2 4 5`), String.raw`\frac{13}2 45`);
});
