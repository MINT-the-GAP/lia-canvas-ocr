import assert from 'node:assert/strict';
import test from 'node:test';
import Algebrite from 'algebrite';
import { calculationProofTools as shared } from '../src/math/equivalence.ts';
import { analyzeRationalEquation, proveRationalEquationTransition, proveRationalSolutionSet } from '../src/math/rational-equation-proof.ts';
function equation(tex: string) { const parsed = shared.parseEquation(tex); assert.ok(parsed,tex); return parsed; }
function model(tex: string) { const parsed = analyzeRationalEquation(equation(tex), Algebrite); assert.ok(parsed,tex); return parsed; }

test('preserves an original linear denominator and proves clearing and solving it', () => {
    const original = String.raw`\frac{6}{x-1}=3`;
    const domain = model(original);
    assert.deepEqual(domain.excludedValues,['1']);
    assert.equal(domain.denominators.length,1);
    assert.equal(proveRationalEquationTransition(domain,equation(original),equation('6=3(x-1)'),Algebrite),true);
    assert.equal(proveRationalEquationTransition(domain,equation('6=3(x-1)'),equation('x=3'),Algebrite),true);
    assert.equal(proveRationalSolutionSet(domain,'x=3',Algebrite)?.proof,true);
    assert.equal(proveRationalSolutionSet(domain,'x=1',Algebrite)?.reason,'extraneous-roots');
});

test('proves x/(x-1)=2 without inventing an externally supplied assumption', () => {
    const original = String.raw`\frac{x}{x-1}=2`;
    const domain = model(original);
    assert.equal(proveRationalEquationTransition(domain,equation(original),equation('x=2(x-1)'),Algebrite),true);
    assert.equal(proveRationalSolutionSet(domain,'x=2',Algebrite)?.proof,true);
});

test('removes a cancelled forbidden root but never accepts it as a solution', () => {
    const original = String.raw`\frac{x^2-1}{x-1}=0`;
    const domain = model(original);
    assert.deepEqual(domain.excludedValues,['1']);
    assert.equal(proveRationalEquationTransition(domain,equation(original),equation('x^2-1=0'),Algebrite),true);
    assert.equal(proveRationalEquationTransition(domain,equation('x^2-1=0'),equation('x+1=0'),Algebrite),true);
    assert.equal(proveRationalSolutionSet(domain,String.raw`L=\{-1\}`,Algebrite)?.proof,true);
    assert.equal(proveRationalSolutionSet(domain,String.raw`L=\{-1;1\}`,Algebrite)?.reason,'extraneous-roots');
});

test('retains all distinct original poles and accepts equivalent presentations of them', () => {
    const original = String.raw`\frac{1}{x}+\frac{1}{x-1}=0`;
    const domain = model(original);
    assert.deepEqual(domain.excludedValues,['0','1']);
    assert.equal(proveRationalSolutionSet(domain,String.raw`x=\frac{1}{2}`,Algebrite)?.proof,true);
    assert.equal(proveRationalEquationTransition(domain,equation(original),equation(String.raw`\frac{2}{2x}+\frac{1}{x-1}=0`),Algebrite),true);
});

test('rejects a newly introduced forbidden value even when cancellation hides it', () => {
    const domain = model(String.raw`\frac{6}{x-1}=3`);
    for (const next of [String.raw`\frac{x-3}{x-2}=0`,String.raw`\frac{(x-3)(x-2)}{x-2}=0`]) {
        assert.equal(proveRationalEquationTransition(domain,equation('x=3'),equation(next),Algebrite),null,next);
    }
    assert.notEqual(proveRationalEquationTransition(domain,equation('x=3'),equation('x=4'),Algebrite),true);
});

test('proves an empty finite solution set and keeps punctured-domain identities unknown', () => {
    const impossible = model(String.raw`\frac{x-1}{x-1}=0`);
    assert.equal(proveRationalSolutionSet(impossible,String.raw`L=\varnothing`,Algebrite)?.proof,true);
    assert.equal(proveRationalSolutionSet(impossible,'x=1',Algebrite)?.proof,false);
    const identity = model(String.raw`\frac{x-1}{x-1}=1`);
    assert.equal(proveRationalSolutionSet(identity,String.raw`L=\mathbb{R}`,Algebrite),null);
});

test('supports rational and exact decimal coefficients plus a retained quadratic numerator', () => {
    const domain = model(String.raw`\frac{x^2-2}{2x-1}=0`);
    assert.deepEqual(domain.excludedValues,['1/2']);
    assert.equal(proveRationalSolutionSet(domain,String.raw`x_{1,2}=\pm\sqrt{2}`,Algebrite)?.proof,true);
    const decimal = model(String.raw`\frac{0,6}{0,2x-0,2}=3`);
    assert.deepEqual(decimal.excludedValues,['1']);
    assert.equal(proveRationalSolutionSet(decimal,'x=2',Algebrite)?.proof,true);
});

test('rejects zero divisors, double inverses, nonlinear denominators, parameters and functions', () => {
    for (const source of [
        String.raw`\frac{x}{0}=1`,String.raw`\frac{1}{x-x}=1`,
        String.raw`\frac{1}{\frac{1}{x-1}}=2`,String.raw`\frac{1}{x+\frac{1}{x}}=2`,
        String.raw`\frac{1}{x^2-1}=2`,String.raw`\frac{x^3+1}{x-1}=0`,
        String.raw`\frac{a}{x-1}=2`,String.raw`\frac{\sqrt{x}}{x-1}=2`,
        'x^(-1)=2','i/(i-1)=2','x/0.0=2'
    ]) assert.equal(analyzeRationalEquation(equation(source),Algebrite),null,source);
});

test('bounds power and expression growth before CAS expansion', () => {
    const calls: string[] = [];
    const runtime = { run(source: string) { calls.push(source); return Algebrite.run(source); } };
    for (const source of [String.raw`\frac{x^{999999999}}{x-1}=2`,String.raw`\frac{(x^4)^4}{x-1}=0`,String.raw`\frac{1}{x^{999999999}-1}=2`]) {
        calls.length=0;
        assert.equal(analyzeRationalEquation(equation(source),runtime),null,source);
        assert.equal(calls.some(call=>call.startsWith('expand(')),false,source);
    }
});