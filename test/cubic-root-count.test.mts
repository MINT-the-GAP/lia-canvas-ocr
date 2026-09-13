import assert from 'node:assert/strict';
import test from 'node:test';
import Algebrite from 'algebrite';
import { calculationProofTools as shared } from '../src/math/equivalence.ts';
import { provePolynomialCandidateSet } from '../src/math/nonlinear-proof.ts';
function prove(source: string, candidates: readonly string[] = []) {
    const parsed = shared.parseEquation(source);
    assert.ok(parsed, source);
    return provePolynomialCandidateSet(parsed, candidates, Algebrite);
}
test('exact cubic discriminant counts distinct real roots before candidate division', () => {
    for (const [source, count] of [
        ['x^3-x=0', 3],
        ['x^3+x=0', 1],
        ['x^3=0', 1],
        ['(x-2)^3=0', 1],
        ['(3x-2)^3=0', 1],
        ['(x-2)^2*(x+1)=0', 2],
        ['(x-2)*(x+1)^2=0', 2],
        ['-7*(x-2)^2*(x+1)=0', 2],
        ['(x^3-x)/7=0', 3],
        ['3x^3-4x^2-2x=0', 3],
        ['x^3-3x+2+1/1000000000000=0', 1],
        ['x^3-3x+2-1/1000000000000=0', 3],
    ] as const) {
        const result = prove(source);
        assert.equal(result?.solutionCount, count, source);
        assert.equal(result?.proof, false, source);
        assert.equal(result?.reason, 'missing-roots', source);
    }
});
test('candidate membership and distinctness remain mandatory for every cubic', () => {
    for (const candidates of [
        ['0', '(2+sqrt(10))/3', '(2-sqrt(10))/3'],
        ['(2-sqrt(10))/3', '(2+sqrt(10))/3', '0'],
        ['(2+sqrt(10))/3', '0', '(2-sqrt(10))/3'],
    ]) {
        const result = prove('3x^3-4x^2-2x=0', candidates);
        assert.equal(result?.proof, true, JSON.stringify(candidates));
        assert.equal(result?.solutionCount, 3);
    }
    assert.equal(prove('3x^3-4x^2-2x=0', ['0', '(2+sqrt(10))/3'])?.reason, 'missing-roots');
    assert.equal(prove('3x^3-4x^2-2x=0', ['0', '(2+sqrt(10))/3', '(2+sqrt(10))/3'])?.reason, 'missing-roots');
    assert.equal(prove('3x^3-4x^2-2x=0', ['0', '1', '2'])?.reason, 'extraneous-roots');
    assert.equal(prove('x^3+x=0', ['1'])?.reason, 'extraneous-roots');
    assert.equal(prove('x^3+x=0', ['0'])?.proof, true);
});
test('repeated cubic roots are counted once and order-independent', () => {
    for (const candidates of [['2', '-1'], ['-1', '2'], ['2', '2', '-1'], ['-1', '2', '-1']]) {
        const result = prove('(x-2)^2*(x+1)=0', candidates);
        assert.equal(result?.proof, true, JSON.stringify(candidates));
        assert.equal(result?.solutionCount, 2);
        assert.equal(result?.solutions?.length, 2);
    }
    assert.equal(prove('(x-2)^2*(x+1)=0', ['2', '2'])?.reason, 'missing-roots');
    assert.equal(prove('(x-2)^2*(x+1)=0', ['2', '-2'])?.reason, 'extraneous-roots');
    assert.equal(prove('(3x-2)^3=0', ['2/3'])?.proof, true);
    assert.equal(prove('(3x-2)^3=0', ['2/3', '4/6', '6/9'])?.proof, true);
});
test('cubic shortcut does not relax the polynomial or candidate domain guards', () => {
    for (const source of ['(x^3-x)/(x-1)=0', 'a*x^3+x=0']) assert.equal(prove(source), null, source);
    assert.equal(prove('x^3-x=0', ['-1', '0', '1/0']), null);
    const calls: string[] = [];
    const source = shared.parseEquation('x^3-x=0')!;
    const runtime = { run(expression: string) {
        calls.push(expression);
        if (expression.includes('18*(') && expression.includes('-27*(')) return 'unproved';
        return Algebrite.run(expression);
    } };
    const result = provePolynomialCandidateSet(source, [], runtime);
    assert.equal(result?.proof, false);
    assert.equal(result?.solutionCount, undefined);
    assert.ok(calls.some(expression => expression.includes('18*(')));
});
