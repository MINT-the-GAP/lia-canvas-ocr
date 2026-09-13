import assert from 'node:assert/strict';
import test from 'node:test';
import Algebrite from 'algebrite';
import { buildCalculusTask } from '../src/math/curve-calculus.ts';
import { createCurveEnvironment, type CurveTaskModel } from '../src/math/curve-task-core.ts';
import type { CalculationContext } from '../src/math/calculation-context.ts';

const T = String.raw;
function model(prompt: string, context: CalculationContext): CurveTaskModel {
    const env = createCurveEnvironment(prompt, context, Algebrite);
    assert.ok(env, prompt);
    const task = buildCalculusTask(env);
    assert.ok(task, prompt + ' / ' + JSON.stringify(context));
    return task;
}
function accepts(task: CurveTaskModel, lines: string[]): boolean {
    const targets = new Set<string>();
    for (const line of lines) {
        const checked = task.checkLine(line);
        if (!checked || checked.proof !== true) return false;
        for (const target of checked.targets || []) targets.add(target);
    }
    return task.required.every(target => targets.has(target));
}
const interval = (a: string, b: string, lc = true, uc = true) =>
    ({ lower: a, upper: b, lowerClosed: lc, upperClosed: uc });

test('all thirteen calculus tasks prove a complete answer and reject a false answer', () => {
    const scenarios: Array<[string, CalculationContext, string[], string[]]> = [
        ['f(x)=x^3-3x', { task: 'derivative' }, ["f'(x)=3(x^2-1)"], ["f'(x)=x^2-1"]],
        ['f(x)=x^3', { task: 'derivative-value', point: '2' }, ["f'(2)=12"], ["f'(2)=6"]],
        ['f(x)=x^2', { task: 'tangent', point: '1' }, ['t(x)=2x-1'], ['t(x)=2x+1']],
        ['f(x)=x^2', { task: 'normal', point: '1' }, ['n(x)=-x/2+3/2'], ['n(x)=x/2+1/2']],
        ['f(x)=x^3-3x', { task: 'extrema' }, ['Hochstelle: x=-1', 'Tiefstelle: x=1'], ['Hochstelle: x=1', 'Tiefstelle: x=-1']],
        ['f(x)=x^3-3x', { task: 'extrema-points' }, ['H(-1|2)', 'T(1|-2)'], ['H(-1|-2)', 'T(1|2)']],
        ['f(x)=x^3', { task: 'inflections' }, ['W={0}'], ['W={1}']],
        ['f(x)=x^3+2', { task: 'inflection-points' }, ['W(0|2)'], ['W(0|0)']],
        ['f(x)=x^2', { task: 'monotonicity' }, [T`fallend: (-\infty;0)`, T`steigend: (0;\infty)`], [T`steigend: \mathbb{R}`]],
        ['f(x)=x^3', { task: 'curvature' }, [T`konkav: (-\infty;0)`, T`konvex: (0;\infty)`], [T`konvex: \mathbb{R}`]],
        ['f(x)=x^4', { task: 'antiderivative' }, ['F(x)=x^5/5+3'], ['F(x)=x^5/4']],
        ['f(x)=x', { task: 'integral', lower: '-1', upper: '1' }, ['I=0'], ['I=1']],
        ['f(x)=x', { task: 'area', lower: '-1', upper: '1' }, ['A=1'], ['A=0']],
    ];
    for (const [prompt, context, good, bad] of scenarios) {
        const task = model(prompt, context);
        assert.equal(accepts(task, good), true, context.task + ' good: ' + good.join(' / '));
        assert.equal(accepts(model(prompt, context), bad), false, context.task + ' bad');
        const generated = model(prompt, context);
        assert.equal(accepts(generated, generated.expectedLines), true, context.task + ' generated: ' + generated.expectedLines.join(' / '));
    }
});

test('derivative notation, variable, order, and missing chain factors remain distinct', () => {
    const first = model('g(t)=(2t+1)^3', { task: 'derivative' });
    assert.equal(accepts(first, [T`g^{\prime}(t)=6(2t+1)^2`]), true);
    assert.equal(accepts(first, ['g′(t)=3(2t+1)^2']), false);
    assert.equal(accepts(first, ["f'(t)=6(2t+1)^2"]), false);
    const second = model('f(x)=x^4', { task: 'derivative', order: 2 });
    assert.equal(accepts(second, ["f'(x)=4x^3", 'f″(x)=12x^2']), true);
    assert.equal(accepts(second, ["f'(x)=4x^3"]), false);
    assert.equal(accepts(second, [T`f^{\prime\prime}(x)=12x^2`]), true);
    assert.equal(accepts(model('f(x)=4', { task: 'derivative' }), ["f'(x)=0"]), true);
});

test('stationary points of x cubed and x to the fourth are classified exactly', () => {
    assert.equal(accepts(model('f(x)=x^3', { task: 'extrema' }), [T`E=\varnothing`]), true);
    assert.equal(accepts(model('f(x)=x^3', { task: 'extrema' }), ['T={0}']), false);
    assert.equal(accepts(model('f(x)=x^4', { task: 'extrema' }), ["f''(0)=0", 'T={0}']), true);
    assert.equal(accepts(model('f(x)=x^4', { task: 'inflections' }), [T`W=\varnothing`]), true);
    assert.equal(accepts(model('f(x)=x^4', { task: 'inflections' }), ['W={0}']), false);
    assert.equal(accepts(model('f(x)=x^3', { task: 'inflection-points' }), ['W(0|0)']), true);
});

test('classification and complete location/point sets cannot be replaced by candidates', () => {
    const task = model('f(x)=x^3-3x', { task: 'extrema-points' });
    assert.equal(accepts(task, ["f'(x)=3x^2-3", "f'(x)=0", 'x^2=1', 'x_1=-1', 'x_2=1',
        "f''(x)=6x", "f''(-1)=-6<0", "f''(1)=6>0", 'H(-1|2)', 'T(1|-2)']), true);
    assert.equal(accepts(task, ['H(-1|2)']), false);
    assert.equal(accepts(task, ['H={-1}', 'T={1}']), false);
    assert.equal(accepts(task, ['E={(-1;2);(1;-2)}']), false);
    assert.equal(accepts(task, ["f'(x)=x^2-1", 'H(-1|2)', 'T(1|-2)']), false);
    assert.equal(accepts(task, ["f''(-1)=6>0", 'H(-1|2)', 'T(1|-2)']), false);
});

test('horizontal tangents and vertical normals include constant functions', () => {
    for (const prompt of ['f(x)=x^2+3', 'f(x)=3']) {
        assert.equal(accepts(model(prompt, { task: 'tangent', point: '0' }), ['y=3']), true);
        const task = model(prompt, { task: 'normal', point: '0' });
        assert.equal(accepts(task, ['x=0']), true);
        assert.equal(accepts(task, ['y=0']), false);
    }
    assert.equal(accepts(model('f(x)=2x+3', { task: 'normal', point: '1' }), ['n(x)=-x/2+11/2']), true);
});

test('local versus global extrema honor open and closed interval boundaries', () => {
    const closed = interval('-2', '2');
    assert.equal(accepts(model('f(x)=x^2', { task: 'extrema', interval: closed }), ['T={0}']), true);
    const global = model('f(x)=x^2', { task: 'extrema', scope: 'global', interval: closed });
    assert.equal(accepts(global, ['T={0}', 'H={-2;2}']), true);
    assert.equal(accepts(global, ['T={0}', 'H={2}']), false);
    assert.equal(accepts(model('f(x)=x', { task: 'extrema', scope: 'global', interval: interval('0', '1', false, false) }),
        ['keine Extremstellen']), true);
    assert.equal(accepts(model('f(x)=x', { task: 'extrema', scope: 'global', interval: interval('0', '1', true, false) }),
        ['T={0}']), true);
    assert.equal(accepts(model('f(x)=x^3-3x', { task: 'extrema', scope: 'global' }), [T`E=\varnothing`]), true);
});

test('constant and linear functions have explicit supported behavior', () => {
    for (const prompt of ['f(x)=3', 'f(x)=2x+1']) {
        assert.equal(accepts(model(prompt, { task: 'extrema' }), ['keine Extremstellen']), true);
        assert.equal(accepts(model(prompt, { task: 'inflections' }), ['keine Wendestellen']), true);
        assert.equal(accepts(model(prompt, { task: 'curvature' }), [T`ungekrümmt: \mathbb{R}`]), true);
    }
    assert.equal(accepts(model('f(x)=3', { task: 'monotonicity' }), [T`konstant: \mathbb{R}`]), true);
    assert.equal(accepts(model('f(x)=3', { task: 'monotonicity' }), [T`steigend: \mathbb{R}`]), false);
    const global = model('f(x)=3', { task: 'extrema', scope: 'global', interval: interval('-1', '1') });
    assert.equal(accepts(global, ['H=[-1;1]', 'T=[-1;1]']), true);
});

test('sign intervals merge isolated even-order zeros and respect domain limits', () => {
    assert.equal(accepts(model('f(x)=x^3', { task: 'monotonicity' }), [T`steigend: \mathbb{R}`]), true);
    assert.equal(accepts(model('f(x)=x^4', { task: 'curvature' }), [T`konvex: \mathbb{R}`]), true);
    const bounded = model('f(x)=x^2', { task: 'monotonicity', interval: interval('-2', '2', false, true) });
    assert.equal(accepts(bounded, ['fallend: (-2;0]', 'steigend: [0;2]']), true);
    assert.equal(accepts(bounded, ['fallend: [-2;0]', 'steigend: [0;2]']), false);
    assert.equal(accepts(bounded, [T`fallend: (-\infty;0)`, T`steigend: (0;\infty)`]), false);
});

test('primitive family completeness and signed integral differ from area', () => {
    const family = model('f(x)=3x^2', { task: 'antiderivative', family: true });
    assert.equal(accepts(family, ['F(x)=x^3+C']), true);
    assert.equal(accepts(family, ['F(x)=x^3+7']), false);
    assert.equal(accepts(family, ['F(x)=x^3-C']), true);
    assert.equal(accepts(model('f(x)=x^2', { task: 'integral', lower: '1', upper: '0' }), ['I=-1/3']), true);
    assert.equal(accepts(model('f(x)=x^2', { task: 'area', lower: '1', upper: '0' }), ['A=1/3']), true);
    assert.equal(accepts(model('f(x)=x^2', { task: 'area', lower: '-1', upper: '1', secondFunction: 'g(x)=1' }), ['A=4/3']), true);
    assert.equal(accepts(model('f(x)=x^2', { task: 'area', lower: '-1', upper: '1', secondFunction: 'x^2' }), ['A=0']), true);
    assert.equal(accepts(model('f(x)=0', { task: 'integral', lower: '0', upper: '0' }), ['I=0']), true);
});



test('polynomial answers cannot acquire removable holes or negative-power singularities', () => {
    assert.equal(accepts(model('f(x)=x', { task: 'derivative' }), ["f'(x)=x/x"]), false);
    assert.equal(accepts(model('f(x)=x', { task: 'derivative' }), ["f'(x)=1+x^(-1)-x^(-1)"]), false);
    assert.equal(accepts(model('f(x)=1', { task: 'antiderivative' }), ['F(x)=(x^2-1)/(x-1)']), false);
    assert.equal(accepts(model('f(x)=x', { task: 'antiderivative' }), ['F(x)=x^2/2+x^(-1)-x^(-1)']), false);
    assert.equal(accepts(model('f(x)=x', { task: 'derivative' }), ["f'(x)=1+(sqrt(-1)-sqrt(-1))"]), false);
});

test('quartics, repeated critical points, and irrational roots retain complete exact sets', () => {
    const extrema = model('f(x)=x^4-2x^2', { task: 'extrema-points' });
    assert.equal(accepts(extrema, ['H(0|0)', 'T_1(-1|-1)', 'T_2(1|-1)']), true);
    assert.equal(accepts(extrema, ['H(0|0)', 'T={(-1;-1)}']), false);
    const global = model('f(x)=x^4-2x^2', { task: 'extrema', scope: 'global' });
    assert.equal(accepts(global, ['T={-1;1}']), true);
    assert.equal(accepts(global, ['T={-1;1}', 'H={0}']), false);
    assert.equal(accepts(model('f(x)=x^4-6x^2', { task: 'inflection-points' }), ['W={(-1;-5);(1;-5)}']), true);
    assert.equal(accepts(model('f(x)=x^3-6x', { task: 'extrema' }), ['H={-sqrt(2)}', 'T={sqrt(2)}']), true);
    assert.equal(accepts(model('f(x)=x^2-2', { task: 'area', lower: '-2', upper: '2' }), ['A=(16sqrt(2)-8)/3']), true);
});

test('explicit integral and primitive evaluation form a checked calculation path', () => {
    const task = model('f(x)=x^2', { task: 'integral', lower: '0', upper: '1' });
    assert.equal(accepts(task, ['F(x)=x^3/3', 'I=F(1)-F(0)=1/3']), true);
    assert.equal(accepts(task, [String.raw`\int_{0}^{1}x^2\,dx=1/3`]), true);
    assert.equal(accepts(task, [String.raw`\int_{0}^{2}x^2\,dx=1/3`]), false);
    assert.equal(accepts(task, ['F(x)=x^3/2', 'I=1/3']), false);
    const area = model('f(x)=x^2', { task: 'area', lower: '-1', upper: '1', secondFunction: '1' });
    assert.equal(accepts(area, [String.raw`\int_{-1}^{1}(1-x^2)\,dx=4/3`]), true);
});

test('point and integration context bounds are never silently ignored', () => {
    const out = createCurveEnvironment('f(x)=x^2', { task: 'tangent', point: '3', interval: interval('-1', '1') }, Algebrite);
    assert.ok(out); assert.equal(buildCalculusTask(out), null);
    const mismatch = createCurveEnvironment('f(x)=x', { task: 'integral', lower: '0', upper: '1', interval: interval('0', '2') }, Algebrite);
    assert.ok(mismatch); assert.equal(buildCalculusTask(mismatch), null);
    const global = model('f(x)=3', { task: 'extrema', scope: 'global', interval: interval('-1', '1') });
    assert.equal(accepts(global, ['H=(-1;1)', 'T=(-1;1)']), false);
});


test('empty-result prose cannot silently change the requested mathematical property', () => {
    assert.equal(accepts(model('f(x)=x^4', { task: 'inflections' }), ['keine Extremstellen']), false);
    assert.equal(accepts(model('f(x)=x^3', { task: 'extrema' }), ['keine Wendestellen']), false);
    assert.equal(accepts(model('f(x)=3', { task: 'extrema' }), ['keine globalen Extremstellen']), false);
    assert.equal(accepts(model('f(x)=x^3-3x', { task: 'extrema', scope: 'global' }), ['keine lokalen Extremstellen']), false);
});


test('point labels and stationary indices cannot be assigned conflicting values', () => {
    const points = model('f(x)=x^4-2x^2', { task: 'extrema-points' });
    assert.equal(accepts(points, ['H(0|0)', 'T_1(-1|-1)', 'T_1(1|-1)']), false);
    const roots = model('f(x)=x^3-3x', { task: 'extrema' });
    assert.equal(accepts(roots, ['x_1=-1', 'x_1=1', 'H={-1}', 'T={1}']), false);
});

test('authored infinity interval aliases agree with TeX infinity', () => {
    const task = model('f(x)=x^3', { task: 'monotonicity', interval: interval('-infty', '+infty', false, false) });
    assert.equal(accepts(task, [String.raw`steigend: \mathbb{R}`]), true);
});


test('primitive and integration-constant names cannot overwrite the original function or variable', () => {
    assert.equal(accepts(model('f(x)=x', { task: 'antiderivative' }), ['f(x)=x^2/2']), false);
    const uppercase = model('F(x)=x', { task: 'antiderivative' });
    assert.equal(accepts(uppercase, ['G(x)=x^2/2']), true);
    assert.equal(accepts(uppercase, ['F(x)=x^2/2']), false);
    const variableC = model('f(C)=C^2', { task: 'antiderivative', family: true });
    assert.equal(accepts(variableC, ['F(C)=C^3/3+K']), true);
    assert.equal(accepts(variableC, ['F(C)=C^3/3+C']), false);
    assert.equal(accepts(variableC, variableC.expectedLines), true);
});


test('explicit tangent and normal slope labels keep their mathematical meaning in either task', () => {
    const tangent = model('f(x)=x^2', { task: 'tangent', point: '1' });
    assert.equal(accepts(tangent, ['m_n=2', 't(x)=2x-1']), false);
    assert.equal(accepts(tangent, ['m_t=2', 'm_n=-1/2', 't(x)=2x-1']), true);
    const horizontal = model('f(x)=x^2', { task: 'tangent', point: '0' });
    assert.equal(accepts(horizontal, ['m_n=0', 't(x)=0']), false);
    const normal = model('f(x)=x^2', { task: 'normal', point: '1' });
    assert.equal(accepts(normal, ['m_t=-1/2', 'n(x)=-x/2+3/2']), false);
    assert.equal(accepts(normal, ['m_t=2', 'm_n=-1/2', 'n(x)=-x/2+3/2']), true);
});

test('line equations cannot overwrite the given function or confuse its independent variable with y', () => {
    const tangent = model('t(x)=x^2', { task: 'tangent', point: '1' });
    assert.equal(accepts(tangent, ['t(x)=2x-1']), false);
    assert.equal(accepts(tangent, ['g(x)=2x-1']), true);
    assert.equal(accepts(tangent, tangent.expectedLines), true);
    const normal = model('n(x)=x^2', { task: 'normal', point: '1' });
    assert.equal(accepts(normal, ['n(x)=-x/2+3/2']), false);
    assert.equal(accepts(normal, ['g(x)=-x/2+3/2']), true);
    for (const prompt of ['f(t)=t^2', 'g(t)=t^2']) {
        const task = model(prompt, { task: 'tangent', point: '1' });
        assert.equal(accepts(task, ['t(t)=2t-1']), false);
        assert.equal(accepts(task, task.expectedLines), true);
    }
    assert.equal(accepts(model('f(y)=y^2', { task: 'tangent', point: '1' }), ['y=2y-1']), false);
    assert.equal(accepts(model('f(y)=y^2', { task: 'tangent', point: '1' }), ['t(y)=2y-1']), true);
    assert.equal(accepts(model('f(y)=y^2', { task: 'normal', point: '0' }), ['y=0']), true);
});

test('a concrete primitive definition stays consistent and the zero primitive family permits C', () => {
    const task = model('f(x)=x', { task: 'antiderivative' });
    assert.equal(accepts(task, ['F(x)=x^2/2', 'F(x)=x^2/2+1']), false);
    assert.equal(accepts(model('f(x)=x', { task: 'antiderivative' }), ['F(x)=x^2/2+1', 'F(x)=(x^2+2)/2']), true);
    const definite = model('f(x)=x', { task: 'integral', lower: '0', upper: '1' });
    assert.equal(accepts(definite, ['F(x)=x^2/2', 'F(x)=x^2/2+1', 'I=1/2']), false);
    assert.equal(accepts(model('f(x)=0', { task: 'antiderivative', family: true }), ['F(x)=C']), true);
    assert.equal(accepts(model('f(C)=0', { task: 'antiderivative', family: true }), ['F(C)=K']), true);
});

test('global extrema distinguish attained ties from unattained endpoint bounds', () => {
    assert.equal(accepts(model('f(x)=x^2', { task: 'extrema', scope: 'global', interval: interval('0', '1', false, true) }), ['H={1}']), true);
    assert.equal(accepts(model('f(x)=x^2', { task: 'extrema', scope: 'global', interval: interval('0', '1', false, true) }), ['T={0}', 'H={1}']), false);
    assert.equal(accepts(model('f(x)=x^2', { task: 'extrema', scope: 'global', interval: interval('-1', '1', true, false) }), ['T={0}', 'H={-1}']), true);
    const open = model('f(x)=x^3-3x', { task: 'extrema-points', scope: 'global', interval: interval('-2', '1', false, false) });
    assert.equal(accepts(open, ['H(-1|2)']), true);
    assert.equal(accepts(open, ['H(-1|2)', 'T(1|-2)']), false);
});
