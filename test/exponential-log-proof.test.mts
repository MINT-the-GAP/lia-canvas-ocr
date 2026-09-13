import assert from 'node:assert/strict';
import test from 'node:test';
import Algebrite from 'algebrite';
import { analyzeExponentialLogEquation, analyzeFunctionPolynomialEquation, normalizeFunctionExpression, compareFunctionConstants, functionConstantToTex, isPositiveExponential, proveExponentialLogDomainAssertion, functionExpressionDefinedAt } from '../src/math/exponential-log-proof.ts';
const context = { runtime: Algebrite };
const T = String.raw;
function solutions(source: string): string[] {
    const model = analyzeExponentialLogEquation(source, context);
    assert.ok(model, source);
    assert.equal(model.solutions.kind, 'finite');
    return model.solutions.kind === 'finite' ? [...model.solutions.values].sort() : [];
}
test('solves exact exponential inverses and positive exponential substitution branches', () => {
    for (const [source, expected] of [
        ['2^(x+1)=16', ['3']], ['2^x=3', ['log(3)/log(2)']],
        ['e^(2x)-3e^x+2=0', ['0', 'log(2)']], ['e^(2x)+e^x-2=0', ['0']],
        ['e^x=-1', []], ['e^x=1', ['0']], ['e^x=2', ['log(2)']],
        [T`2^{x+1}=16`, ['3']], [T`e^{2x}-3e^x+2=0`, ['0', 'log(2)']],
    ] as const) assert.deepEqual(solutions(source), [...expected].sort(), source);
});
test('retains each original logarithm domain when products introduce extra roots', () => {
    for (const [source, expected] of [
        ['ln(x-1)=0', ['2']], [T`\log_{10}(x)=2`, ['100']], [T`\log_2(x-1)=3`, ['9']],
        ['ln(x-1)+ln(x+1)=ln(8)', ['3']], ['ln(x^2-1)=ln(8)', ['-3', '3']],
        ['ln(x^2)=0', ['-1', '1']], ['2ln|x|=0', ['-1', '1']], ['2ln(x)=0', ['1']],
    ] as const) assert.deepEqual(solutions(source), [...expected].sort(), source);
    const separated = analyzeExponentialLogEquation('ln(x-1)+ln(x+1)=ln(8)', context)!;
    assert.equal(separated.domain('-3'), false);
    assert.equal(separated.domain('3'), true);
    const combined = analyzeExponentialLogEquation('ln(x^2-1)=ln(8)', context)!;
    assert.equal(combined.domain('-3'), true);
    assert.equal(combined.domain('1'), false);
});
test('natural logarithm and explicit logarithm bases stay distinct', () => {
    assert.deepEqual(solutions('log(x)=2'), ['exp(2)']);
    assert.deepEqual(solutions(T`\log_{10}(x)=2`), ['100']);
    for (const source of [T`\log_1(x)=2`, T`\log_0(x)=2`, T`\log_{-2}(x)=2`, '1^x=2', '(-2)^x=4']) {
        assert.equal(analyzeExponentialLogEquation(source, context), null, source);
    }
});
test('constant conversion roundtrips logarithms and exact radicals without a global CAS', () => {
    for (const value of ['log(2)', 'log(3)/log(2)', '(2+sqrt(10))/3', 'e^2']) {
        const converted = normalizeFunctionExpression(functionConstantToTex(value));
        assert.ok(converted, value);
        assert.equal(String(Algebrite.run('simplify((' + converted + ')-(' + value + '))')), '0', value);
    }
    assert.equal(compareFunctionConstants('log(2)', '0', context), false);
    assert.equal(compareFunctionConstants('log(2)', 'log(2)', context), true);
});
test('polynomial intermediates are solved exactly and refuse unsupported degrees', () => {
    const model = analyzeFunctionPolynomialEquation('x^2=9', context)!;
    assert.deepEqual(model.solutions, { kind: 'finite', values: ['3', '-3'] });
    assert.equal(analyzeFunctionPolynomialEquation('x^3=2', context), null);
    assert.equal(analyzeExponentialLogEquation('ln(x)=x', context), null);
    assert.equal(analyzeExponentialLogEquation('2^x+3^x=5', context), null);
});
test('unknown commands, extra statements and oversized inputs never reach CAS', () => {
    const calls: string[] = [];
    const guarded = { runtime: { run(source: string) { calls.push(source); return Algebrite.run(source); } } };
    for (const source of ['run(x)=1', 'ln(x)=1;run(2)', 'ln(x)=1=2', 'x'.repeat(5000), 'e^{999999999999999999999}=x']) {
        calls.length = 0;
        assert.equal(analyzeExponentialLogEquation(source, guarded), null, source);
        assert.equal(calls.length, 0, source);
    }
});


test('standalone constant normalization blocks nested power bombs before CAS', () => {
    const calls: string[] = [];
    const guarded = { runtime: { run(source: string) { calls.push(source); return Algebrite.run(source); } } };
    for (const value of ['2^{999999999999}', '16^{16^{16}}', '((16^16)^16)^16', 'e^{16^16}', '(x+1)^{16^{16}}']) {
        assert.equal(normalizeFunctionExpression(value), null, value);
        assert.equal(compareFunctionConstants(value, '0', guarded), null, value);
        assert.equal(analyzeExponentialLogEquation('e^x=' + value, guarded), null, value);
        assert.equal(calls.length, 0, value);
    }
});
test('constant and original domains reject nonreal inputs before accepting roots', () => {
    const model = analyzeExponentialLogEquation('e^x=2', context)!;
    assert.equal(model.domain('log(-1)'), false);
    assert.equal(model.domain('1/0'), false);
    assert.equal(model.domain('sqrt(-1)'), false);
    assert.equal(model.domain('sqrt(0)'), true);
    assert.equal(compareFunctionConstants('log(-1)', 'log(-1)', context), null);
});
test('domain annotations need a proof from the original expression', () => {
    assert.equal(isPositiveExponential('e^x', 'x', context), true);
    assert.equal(isPositiveExponential('2^(x+1)', 'x', context), true);
    assert.equal(isPositiveExponential('(-2)^x', 'x', context), false);
    assert.equal(isPositiveExponential('e^(1/x)', 'x', context), false);
    assert.equal(proveExponentialLogDomainAssertion('x>1', 'ln(x-1)=0', context), true);
    assert.equal(proveExponentialLogDomainAssertion(T`x\ne1`, 'ln(x-1)=0', context), true);
    assert.equal(proveExponentialLogDomainAssertion('x<1', 'ln(x-1)=0', context), null);
    assert.equal(proveExponentialLogDomainAssertion('x>2', 'ln(x-1)=0', context), null);
    assert.equal(proveExponentialLogDomainAssertion('x<2', 'ln(2-x)=0', context), true);
});
test('generated intermediate equations preserve each original solution after domain restriction', () => {
    for (const source of ['2^(x+1)=16', 'e^(2x)-3e^x+2=0', 'ln(x-1)+ln(x+1)=ln(8)', '2ln|x|=0']) {
        const model = analyzeExponentialLogEquation(source, context)!;
        assert.ok(model.expectedLines.length >= 3, source);
        const intermediate = model.expectedLines[1];
        const next = analyzeExponentialLogEquation(intermediate, context) || analyzeFunctionPolynomialEquation(intermediate, context);
        assert.ok(next, intermediate);
        assert.equal(next.solutions.kind, 'finite');
        if (next.solutions.kind === 'finite' && model.solutions.kind === 'finite') {
            assert.deepEqual(next.solutions.values.filter(value => model.domain(value) === true).sort(), [...model.solutions.values].sort(), intermediate);
        }
    }
});

test('substitution preserves the complete replaced atom under an outer square', () => {
    for (const source of ['((e^x))^2-3((e^x))+2=0', '(e^x)^2-3e^x+2=0', '(2^(x+1))^2-10(2^(x+1))+16=0']) {
        const expected = source.startsWith('(2') ? ['0', '2'] : ['0', 'log(2)'];
        assert.deepEqual(solutions(source), expected, source);
    }
});
test('large affine offsets and logarithmic inverse powers never expand into huge constants', () => {
    const calls: string[] = [];
    const guarded = { runtime: { run(source: string) { calls.push(source); return Algebrite.run(source); } } };
    for (const source of ['2^(x+100000000)=16', T`\log_{10}(x)=100000000`]) {
        calls.length = 0;
        assert.equal(analyzeExponentialLogEquation(source, guarded), null, source);
        assert.ok(calls.every(call => !call.includes('^(100000000)') && !call.includes('^(-(100000000))')));
    }
});

test('logarithm injectivity proves distinct positive rational log roots exactly', () => {
    assert.equal(compareFunctionConstants('log(2)', 'log(3)', context), false);
    assert.equal(compareFunctionConstants('log(2)/log(e)', 'log(3)/log(e)', context), false);
    assert.equal(compareFunctionConstants('log(2)', 'log(2)/log(e)', context), true);
    assert.equal(compareFunctionConstants('log(-2)', 'log(-3)', context), null);
});

test('base-change logarithms compare with exact rational powers without floating evaluation', () => {
    for (const [expression, value] of [[T`\log_2(8)`, '3'], [T`\log_{10}(100)`, '2'], [T`\lg(100)`, '2'], [T`\log_2(\sqrt{2})`, '1/2']] as const) {
        const normalized = normalizeFunctionExpression(expression);
        assert.ok(normalized, expression);
        assert.equal(compareFunctionConstants(normalized, value, context), true, expression);
    }
    assert.equal(compareFunctionConstants(normalizeFunctionExpression(T`\log_2(8)`)!,'4',context),false);
    assert.deepEqual(solutions(T`\lg(x)=2`), ['100']);
});


test('auxiliary expressions must be real and defined at each original solution', () => {
    assert.equal(functionExpressionDefinedAt('1/x', 'x', '0', context), false);
    assert.equal(functionExpressionDefinedAt('x/x', 'x', '0', context), false);
    assert.equal(functionExpressionDefinedAt('1/x', 'x', '2', context), true);
    assert.equal(functionExpressionDefinedAt('e^x+sqrt(-1)', 'x', '0', context), false);
    assert.equal(functionExpressionDefinedAt('e^x', 'x', 'log(2)', context), true);
    assert.equal(functionExpressionDefinedAt('ln(x-1)', 'x', '2', context), true);
    assert.equal(functionExpressionDefinedAt('ln(x-1)', 'x', '1', context), false);
});
