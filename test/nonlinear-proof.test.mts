import assert from 'node:assert/strict';
import test from 'node:test';
import Algebrite from 'algebrite';
import { calculationProofTools as shared } from '../src/math/equivalence.ts';
import { analyzeNumericPolynomial, provePolynomialTransition, proveCompleteRealSolutionSet, provePolynomialCandidateSet } from '../src/math/nonlinear-proof.ts';

function equation(tex: string) {
    const parsed = shared.parseEquation(tex);
    assert.ok(parsed, tex);
    return parsed;
}
function roots(source: string, target: string) {
    return proveCompleteRealSolutionSet(equation(source), target, Algebrite);
}

test('proves completion of the square, expansion, factoring and rational scaling', () => {
    for (const [from, to] of [
        ['x^2+6x+9=4', '(x+3)^2=4'],
        ['x^2-5x+6=0', '(x-2)(x-3)=0'],
        ['2x^2+3x=1', '4x^2+6x-2=0'],
        ['x^4-5x^2+4=0', '(x^2-1)(x^2-4)=0'],
        ['0.1x^2+0.2x=0.3', 'x^2+2x=3'],
    ]) assert.equal(provePolynomialTransition(equation(from), equation(to), Algebrite), true, from);
    assert.equal(provePolynomialTransition(equation('x^2=0'), equation('x=0'), Algebrite), null);
    assert.equal(provePolynomialTransition(equation('x^2=1'), equation('x^2=2'), Algebrite), null);
});

test('exposes exact rational coefficients and rejects parameter/domain assumptions', () => {
    const polynomial = analyzeNumericPolynomial(equation(String.raw`\frac{x^2}{2}+x=3`), Algebrite);
    assert.deepEqual(polynomial?.coefficients, ['-3','1','1/2']);
    for (const source of [String.raw`\frac{x^2-1}{x-1}=0`, 'ax^2+x=0', 'x^(-1)=2', String.raw`\sqrt{x}=2`, 'x/0=2']) {
        assert.equal(analyzeNumericPolynomial(equation(source), Algebrite), null, source);
    }
});

test('accepts shifted plus-minus roots and keeps the unfinished square-root step distinct', () => {
    for (const target of [String.raw`x_{1,2}=-3\pm2`, String.raw`x_1=-1,\quad x_2=-5`, String.raw`\mathcal{L}=\{-5;-1\}`]) {
        const result = roots('(x+3)^2=4', target);
        assert.equal(result?.proof, true, target);
        assert.equal(result?.complete, true);
        assert.equal(result?.isIsolated, true);
    }
    const intermediate = roots('(x+3)^2=4', String.raw`x_{1,2}+3=\pm\sqrt{4}`);
    assert.equal(intermediate?.proof, true);
    assert.equal(intermediate?.isIsolated, false);
});

test('proves pq and discriminant results with irrational roots and constant denominators', () => {
    for (const [source, target] of [
        ['x^2-2x-2=0', String.raw`x_{1,2}=1\pm\sqrt{3}`],
        ['2x^2+3x-1=0', String.raw`x_{1,2}=\frac{-3\pm\sqrt{17}}{4}`],
        ['x^2+2x+1=3', String.raw`x_{1,2}+1=\pm\sqrt{3}`],
        ['x^2=2', String.raw`x_{1,2}=\pm\frac{2}{\sqrt{2}}`],
    ]) assert.equal(roots(source, target)?.proof, true, target);
});

test('does not accept a missing, duplicate or incorrect root', () => {
    for (const target of ['x=2', String.raw`x_1=2,\quad x_2=2`, String.raw`L=\{2\}`]) {
        const result = roots('x^2-5x+6=0', target);
        assert.equal(result?.proof, false, target);
        assert.equal(result?.reason, 'missing-roots');
    }
    assert.equal(roots('x^2-5x+6=0', String.raw`x_1=2,\quad x_2=4`)?.reason, 'extraneous-roots');
    assert.equal(roots('x^2-5x+6=0', String.raw`x_1=2,\quad x_1=3`), null);
    assert.equal(roots('x^2=2', String.raw`x_{1,2}=\sqrt{2}`)?.reason, 'missing-roots');
});

test('handles a repeated root, empty real set, identity and contradiction', () => {
    assert.equal(roots('(x+1)^2=0', 'x=-1')?.proof, true);
    assert.equal(roots('(x+1)^2=0', String.raw`x_{1,2}=-1\pm0`)?.proof, true);
    assert.equal(roots('x^2+x+1=0', String.raw`\mathcal{L}_{\mathbb{R}}=\varnothing`)?.proof, true);
    assert.equal(roots('x^2=2', String.raw`L=\varnothing`)?.reason, 'missing-roots');
    assert.equal(roots('x-x=0', String.raw`L=\mathbb{R}`)?.proof, true);
    assert.equal(roots('x-x=1', String.raw`L=\varnothing`)?.proof, true);
    assert.equal(roots('x-x=1', String.raw`L=\mathbb{R}`)?.proof, false);
});

test('proves explicit cubic/quartic root sets including repeated factors', () => {
    for (const [source, target] of [
        ['x^4-5x^2+4=0', String.raw`L=\{-2,-1,1,2\}`],
        ['x^3-x=0', String.raw`L=\{-1;0;1\}`],
        ['(x-2)^4=0', String.raw`L=\{2\}`],
        ['(x-1)^2*(x+2)^2=0', String.raw`L=\{1;-2\}`],
        ['(x-1)*(x^2+1)=0', String.raw`L=\{1\}`],
    ]) assert.equal(roots(source, target)?.proof, true, source);
    assert.equal(roots('x^4-5x^2+4=0', String.raw`L=\{-1;1\}`)?.reason, 'missing-roots');
    assert.equal(roots('x^4-5x^2+4=0', String.raw`L=\{-2;-1;1;3\}`)?.reason, 'extraneous-roots');
    assert.equal(roots('x^4+x^2+1=0', String.raw`L=\varnothing`)?.proof, null);
    assert.deepEqual(provePolynomialCandidateSet(equation('x^2=1'), ['1','-1'], Algebrite)?.solutions, ['1','-1']);
});

test('refuses unsafe roots, zero denominators, functions and correlated multiple plus-minus', () => {
    for (const target of [
        String.raw`x_{1,2}=1\pm\sqrt{-3}`,
        String.raw`x_{1,2}=\frac{1\pm\sqrt{3}}{0}`,
        String.raw`x_{1,2}=1\pm\sqrt{a}`,
        String.raw`x_{1,2}=1\pm\sqrt{3}\pm1`,
        String.raw`x_{1,2}=\sin(2)`,
    ]) assert.equal(roots('x^2-2x-2=0', target), null, target);
    assert.equal(provePolynomialCandidateSet(equation('x^2=1'), ['1/0','-1'], Algebrite), null);
});

test('bounds nested and huge powers before polynomial expansion', () => {
    const calls: string[] = [];
    const runtime = { run(source: string) { calls.push(source); return Algebrite.run(source); } };
    for (const source of ['x^{99999999}=1', '(x^4)^4=1', 'x^4*x^4=1', 'x^{16^{16}}=1', '((16^{16})^{16})^{16}*x=1']) {
        calls.length = 0;
        assert.equal(analyzeNumericPolynomial(equation(source), runtime), null, source);
        assert.equal(calls.some(call => /^(?:expand|.*coeff)\(/u.test(call)), false, source);
    }
});
test('does not finish a target that still declares an operation or assume zero to the zeroth power', () => {
    const result = roots('x^2=4', String.raw`x_{1,2}=\pm2 \mid :0`);
    assert.equal(result?.proof, true);
    assert.equal(result?.isIsolated, false);
    assert.equal(analyzeNumericPolynomial(equation('x^0=1'), Algebrite), null);
    assert.equal(provePolynomialCandidateSet(equation('x^2=1'), ['0^0','1'], Algebrite), null);
});
test('does not mistake CAS constants e and i for a freely varying real unknown', () => {
    assert.equal(analyzeNumericPolynomial(equation('i^2+1=0'), Algebrite), null);
    assert.equal(roots('i^2+1=0', String.raw`L=\mathbb{R}`), null);
    assert.equal(analyzeNumericPolynomial(equation('e^2=2'), Algebrite), null);
});
test('proves only a negative right side of a pure real fourth power has no roots', () => {
    for (const source of ['x^4+2=0', '-2x^4-1=0', '3x^4=-6', '2x^4+1=x^4']) {
        assert.equal(roots(source, String.raw`L=\varnothing`)?.proof, true, source);
    }
    assert.notEqual(roots('x^4=2', String.raw`L=\varnothing`)?.proof, true);
    assert.notEqual(roots('x^4=0', String.raw`L=\varnothing`)?.proof, true);
    assert.equal(roots('x^4+x^2+1=0', String.raw`L=\varnothing`)?.proof, null);
});
test('keeps legacy leading OCR arrow aliases local to complete tokens', () => {
    for(const arrow of [String.raw`\to`,String.raw`\Rarr`,String.raw`\rightarrow`,String.raw`\Rightarrow`,'→','=>']) {
        assert.equal(roots('x^2=6',arrow+String.raw` x_{1,2}=\pm\sqrt6`)?.proof,true,arrow);
    }
    for(const target of [String.raw`\tofoo x_{1,2}=\pm\sqrt6`,String.raw`\Rarrfoo x_{1,2}=\pm\sqrt6`,String.raw`x_{1,2}=\to\pm\sqrt6`]) {
        assert.equal(roots('x^2=6',target),null,target);
    }
});