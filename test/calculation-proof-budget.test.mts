import assert from 'node:assert/strict';
import test from 'node:test';
import { isCalculationCasInputBounded as cas, isCalculationProofInputBounded as tex } from '../src/math/calculation-proof-budget.ts';

test('ordinary TeX equations, root sets and nested school algebra fit the proof budget', () => {
    for (const source of [
        String.raw`3x-2=5x+4`, String.raw`x^2-4x+4=14`, String.raw`(x-2)^2=14`,
        String.raw`x_{1,2}=2\pm\sqrt{14}`, String.raw`x_1=-2; x_2=2`,
        String.raw`\frac{\frac{1}{2}x^3-2x^2-3}{x^2-3x}=0`,
        String.raw`x=\frac{-b\pm\sqrt{b^2-4ac}}{2a}`, String.raw`x=\sqrt[3]{\frac{4}{3}}`,
        String.raw`L=\{-2,2\}`, String.raw`L=\emptyset`, String.raw`L=\mathbb{R}`,
        String.raw`\left(x+\frac{b}{2a}\right)^2=4`, String.raw`x=2\mid+3`,
        String.raw`\Rightarrow x_{1,2}=\pm\sqrt6`, '⇒ x=2', String.raw`x=\sqrt x`,
        String.raw`\begin{cases}x+y=5\\x-y=1\end{cases}`,
        String.raw`\left\{\begin{array}{rl}x+y&=5\\x-y&=1\end{array}\right.`,
        String.raw`\text{Probe: }3\cdot(-3)-2=5\cdot(-3)+4`,
    ]) assert.equal(tex(source), true, source);
});

test('bounded rational CAS expressions and the actual proof wrappers remain available', () => {
    for (const source of [
        'x^4-5*x^2+4', '(x+1)/(x-1)', '1/0', 'x^(-2)', 'sqrt(14)',
        'simplify(rationalize((x+1)-(1+x)))', 'expand((x+1)^4)',
        'simplify(coeff((x^2+3*x+2),x,2))', 'd(x+y,x)',
        'subst((-3),x,(3*x-2))', 'subst((u^2),x,(x^2-5*x+4))',
        'sqrt(2)^(1/2)', 'systemvar_1+systemvar_2', '123456789012345678901234/7',
    ]) assert.equal(cas(source), true, source);
});

test('oversized and compounded powers are declined before any symbolic execution', () => {
    for (const source of [
        '2^999999999999999999999999', '2^(2^16)', '2^(16^16)', '(x^16)^16',
        '(2^16)^16', 'x^x', '(x+y)^16', '2^(1/999999999999999999)',
        '2^16.00000000000000000000001', '2^coeff(2,x,99999)',
    ]) assert.equal(cas(source), false, source);
    for (const source of [
        String.raw`x=2^{999999999999999999999999}`, String.raw`x=2^{2^{16}}`,
        String.raw`x=(a^{16})^{16}`, String.raw`x=(a+b)^{16}`,
        String.raw`x=2^{\frac{256}{2}^{4}}`, String.raw`x=2^{\frac{1}{999999999999999999}}`,
        String.raw`x=\sqrt[999999]{2}`, String.raw`x=2; y=2^{999999999999999999999999}`,
    ]) assert.equal(tex(source), false, source);
    assert.equal(cas('2^(2^4)'), true, 'a small genuinely bounded nested power is still allowed');
    assert.equal(tex(String.raw`x=2^{2^4}`), true);
});

test('multiplication expansions and substitution amplification have independent cost bounds', () => {
    assert.equal(cas(Array.from({ length: 12 }, () => '(x+y)').join('*')), false);
    assert.equal(tex(Array.from({ length: 12 }, () => '(x+y)').join('') + '=0'), false);
    assert.equal(cas('subst((x+y+z),u,(u+1)^8)'), false);
    assert.equal(cas('subst((x+1),u,u^2)'), true);
    assert.equal(cas('(x+1)*(x-1)*(x+2)*(x-2)'), true);
});

test('literal length, nesting, token count and unknown executable calls fail closed', () => {
    const number = '1'.repeat(25);
    assert.equal(cas(number), false);
    assert.equal(tex('x=' + number), false);
    assert.equal(cas('('.repeat(33) + '1' + ')'.repeat(33)), false);
    assert.equal(tex('x=' + '{'.repeat(33) + '1' + '}'.repeat(33)), false);
    assert.equal(cas(Array.from({ length: 140 }, () => '1').join('+')), false);
    assert.equal(tex('x=' + '1'.repeat(4096)), false);
    for (const source of ['run(1)', 'factorial(999999)', 'for(x,1,999999)', 'x=2', '1;2', 'sqrt()']) assert.equal(cas(source), false, source);
    for (const source of ['', String.raw`\unknown{2}`, String.raw`\frac{1}`, String.raw`\begin{cases}x=2`, String.raw`\left(x=2`]) assert.equal(tex(source), false, source);
});

test('the preflight never invokes a globally supplied CAS', () => {
    const previous = (globalThis as any).Algebrite;
    (globalThis as any).Algebrite = { run() { throw new Error('The preflight must never execute a CAS.'); } };
    try {
        assert.equal(cas('simplify(x^2-4)'), true);
        assert.equal(tex(String.raw`x^{2}=4`), true);
        assert.equal(cas('2^999999999999999999999999'), false);
    } finally { (globalThis as any).Algebrite = previous; }
});

test('preflight preserves explicit path labels and guards their following operands', () => {
    for (const source of ['I. x+y=5', 'II. x-y=1', String.raw`\text{I+II}`, 'Substitution:',
        'Nebenrechnung:', 'Probe:', 'Rücksubstitution:', String.raw`2x=6\mid :2`, String.raw`2x=6\mid\cdot3`]) {
        assert.equal(tex(source), true, source);
    }
    assert.equal(tex('9'.repeat(25) + 'I+II'), false);
    assert.equal(tex(String.raw`Probe: x=2^{999999999999999999999999}`), false);
});

test('comma and explicit spacing preserve separate root assignments within budget', () => {
    for (const source of [String.raw`\Rightarrow x_1=3,\quad x_2=2`, String.raw`u_1=4,\quad u_2=1`]) {
        assert.equal(tex(source), true, source);
    }
    assert.equal(tex(String.raw`u_1=4,\quad u_2=2^{999999999999999999999999}`), false);
});