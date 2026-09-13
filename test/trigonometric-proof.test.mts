import assert from 'node:assert/strict';
import test from 'node:test';
import Algebrite from 'algebrite';
import { analyzeTrigEquation, compareTrigSolutionSets, parseTrigSolutionTarget, normalizeTrigExpression, restrictTrigSolutionSet, trigSolutionContains } from '../src/math/trigonometric-proof.ts';
import { validateCalculationPathSubmission } from '../src/math/calculation-path.ts';
import type { FunctionContext } from '../src/math/function-proof-types.ts';
const rad: FunctionContext = { runtime: Algebrite };
const circle: FunctionContext = { ...rad, interval: { lower: '0', upper: '2*pi', lowerClosed: true, upperClosed: false } };
const degrees: FunctionContext = { ...rad, angleUnit: 'deg', interval: { lower: '0°', upper: '360°', lowerClosed: true, upperClosed: false } };
function check(equation: string, target: string, context = rad) {
    const model = analyzeTrigEquation(equation, context);
    assert.ok(model, equation);
    const solution = parseTrigSolutionTarget(target, model.variable, context);
    assert.ok(solution, target);
    assert.equal(compareTrigSolutionSets(model.solutions, solution, context), true, equation + ' -> ' + target);
    const generated = parseTrigSolutionTarget(model.expectedLines.at(-1)!, model.variable, context);
    assert.ok(generated, model.expectedLines.at(-1));
    assert.equal(compareTrigSolutionSets(model.solutions, generated, context), true, 'generated solution');
    return model;
}
test('required exact finite trig sets, products and degree units', () => {
    check('sin(x)=1/2', String.raw`L=\{\pi/6;5\pi/6\}`, circle);
    check(String.raw`\cos(2x)=0`, String.raw`L=\{\pi/4;3\pi/4;5\pi/4;7\pi/4\}`, circle);
    check(String.raw`\cos(x)(2\sin(x)-1)=0`, String.raw`L=\{\pi/6;\pi/2;5\pi/6;3\pi/2\}`, circle);
    check(String.raw`\sin(x)=\frac{1}{2}`, String.raw`L=\{30^{\circ};150^{\circ}\}`, degrees);
    check('cos(x)=2', String.raw`L=\varnothing`);
});
test('periodic solutions require the integer parameter and accept shifts', () => {
    const model = check('sin(x)=1/2', String.raw`x=pi/6+2k*pi oder x=5pi/6+2k*pi, k\in\mathbb{Z}`);
    check('sin(x)=1/2', String.raw`x=13pi/6+2n*pi oder x=-7pi/6+2n*pi, n\in\mathbb{Z}`);
    check('sin(x)=0', String.raw`x=k*pi, k\in\mathbb{Z}`);
    check('sin(x)=1/2', String.raw`x=pi/6+2(k+7)*pi oder x=5pi/6+2(k-3)*pi, k\in\mathbb{Z}`);
    assert.equal(parseTrigSolutionTarget('x=pi/6+2k*pi', 'x', rad), null);
    assert.equal(compareTrigSolutionSets(model.solutions, parseTrigSolutionTarget('x=arcsin(1/2)', 'x', rad)!, rad), false);
    assert.equal(compareTrigSolutionSets(model.solutions, parseTrigSolutionTarget(String.raw`x=pi/6+2k*pi, k\in\mathbb{Z}`, 'x', rad)!, rad), false);
});
test('open and closed interval endpoints differ exactly', () => {
    check('sin(x)=0', String.raw`L=\{0;pi\}`, circle);
    check('sin(x)=0', String.raw`L=\{0;pi;2pi\}`, { ...circle, interval: { ...circle.interval!, upperClosed: true } });
    check('sin(x)=0', String.raw`L=\{pi\}`, { ...circle, interval: { ...circle.interval!, lowerClosed: false } });
});
test('tangent retains holes and affine arguments', () => {
    const model = check('tan(x)=1', String.raw`x=pi/4+k*pi, k\in\mathbb{Z}`);
    assert.equal(model.domain('pi/2'), false);
    assert.equal(model.domain('3*pi/2'), false);
    assert.equal(model.domain('pi/4'), true);
    assert.equal(model.domain('1+pi/2'), true);
    check('sin(2x+pi/3)=1/2', String.raw`x=-pi/12+k*pi oder x=pi/4+k*pi, k\in\mathbb{Z}`);
    check('cos(-2x)=0', String.raw`L=\{pi/4;3pi/4;5pi/4;7pi/4\}`, circle);
});
test('same-atom quadratics preserve the trig range and Pythagorean identity', () => {
    check('2sin(x)^2-sin(x)=0', String.raw`L=\{0;pi/6;5pi/6;pi\}`, circle);
    check(String.raw`\sin^2(x)+\sin(x)-2=0`, String.raw`L=\{pi/2\}`, circle);
    check(String.raw`\sin^2(x)+\cos^2(x)=1`, String.raw`L=\mathbb{R}`);
    check(String.raw`\sin^2(x)+\cos^2(x)=2`, String.raw`L=\varnothing`);
    const full = analyzeTrigEquation('cos(x)*(2sin(x)-1)=0', circle)!;
    const lost = analyzeTrigEquation('2sin(x)-1=0', circle)!;
    assert.equal(compareTrigSolutionSets(full.solutions, lost.solutions, circle), false);
});
test('bounded parser refuses unsafe and unsupported expressions and mixed units', () => {
    for (const input of ['x+sin(x)=1', 'u+sin(u)=1', 'v+cos(v)=1', 'sin(x+y)=sin(x)+sin(y)', 'sin(x^2)=0', 'sin(x)/cos(x)=0', 'sin(x)=1/0', 'sin(x)=sqrt(-1)', 'sin(x)^1000000=0']) {
        assert.equal(analyzeTrigEquation(input, rad), null, input);
    }
    assert.equal(analyzeTrigEquation('sin(x+30°)=1/2', rad), null);
    assert.equal(analyzeTrigEquation('sin(x+pi)=0', degrees), null);
    assert.equal(parseTrigSolutionTarget('x=arcsin(2)', 'x', rad), null);
    assert.equal(parseTrigSolutionTarget(String.raw`x=k^2*pi, k\in\mathbb{Z}`, 'x', rad), null);
    assert.equal(normalizeTrigExpression(String.raw`\sin(2x)+\cos(x)^2`), '(sin((2*x))+(cos(x)^2))');
});

test('resource bounds, undefined tangent identities and exact interval restriction', () => {
    let calls = 0;
    const bounded = { runtime: { run: () => { calls++; return '0'; } } };
    for (const input of ['sin x^2=0', 'sin(x)=(((9999999999^4)^4)^4)', 'sin(x)^(4^4)=0']) {
        assert.equal(analyzeTrigEquation(input, bounded), null, input);
    }
    assert.equal(calls, 0);
    assert.equal(analyzeTrigEquation('tan(x)=tan(x)', rad), null);
    assert.equal(analyzeTrigEquation('0*tan(x)=0', rad), null);
    assert.deepEqual(restrictTrigSolutionSet({ kind: 'finite', values: ['-1', '0', '3', '2*pi'] }, circle), { kind: 'finite', values: ['0', '3'] });
    assert.equal(restrictTrigSolutionSet({ kind: 'finite', values: ['log(2)'] }, circle), null);
    assert.equal(restrictTrigSolutionSet({ kind: 'finite', values: [] }, { ...rad, interval: { lower: '2', upper: '1', lowerClosed: true, upperClosed: false } }), null);
    assert.deepEqual(parseTrigSolutionTarget('x=arcsin(1/2)', 'x', degrees), { kind: 'finite', values: ['30'] });
});

test('membership distinguishes a valid principal value from missing periodic families', () => {
    const set = analyzeTrigEquation('sin(x)=1/2', rad)!.solutions;
    assert.equal(trigSolutionContains(set, 'pi/6', rad), true);
    assert.equal(trigSolutionContains(set, '13*pi/6', rad), true);
    assert.equal(trigSolutionContains(set, '0', rad), false);
    assert.equal(trigSolutionContains(set, 'sqrt(2)', rad), null);
});

test('degree annotations belong to angle arguments and final values, not trig outputs', () => {
    const context = { ...degrees, interval: { ...degrees.interval!, lower: '0', upper: '360' } };
    for (const equation of [
        String.raw`sin(x)=1/2^{\circ}`,
        String.raw`sin(x)+0^{\circ}=1/2`,
        String.raw`sin(x)^{\circ}=1/2`,
        String.raw`sin^{\circ}(x)=1/2`,
        String.raw`sin(x)^2+cos(x)^2=1^{\circ}`,
    ]) assert.equal(analyzeTrigEquation(equation, context), null, equation);
    check(String.raw`sin(x+30^{\circ})=1/2`, String.raw`L=\{0^{\circ};120^{\circ}\}`, context);
    check(String.raw`sin(x^{\circ})=1/2`, String.raw`L=\{30^{\circ};150^{\circ}\}`, context);
    assert.deepEqual(parseTrigSolutionTarget(String.raw`x=30^{\circ}`, 'x', context), { kind: 'finite', values: ['30'] });
    const constant = normalizeTrigExpression(String.raw`sin(30^{\circ})`, context);
    assert.ok(constant);
    assert.equal(String(Algebrite.run('simplify(' + constant + ')')), '1/2');
    const options = { runtime: Algebrite, calculationContext: { angleUnit: 'deg' as const, interval: context.interval } };
    const prompt = 'sin(x)=1/2';
    const target = String.raw`L=\{30^{\circ};150^{\circ}\}`;
    assert.equal(validateCalculationPathSubmission(prompt, [prompt, target], options).accepted, true);
    assert.equal(validateCalculationPathSubmission(prompt, [prompt, String.raw`sin(x)=1/2^{\circ}`, target], options).accepted, false);
    assert.equal(validateCalculationPathSubmission(String.raw`sin(x)=1/2^{\circ}`, [String.raw`sin(x)=1/2^{\circ}`, target], options).accepted, false);
});
