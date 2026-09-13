import assert from 'node:assert/strict';
import test from 'node:test';
import Algebrite from 'algebrite';
import { sanitizeCalculationReviewFreezeState } from '../src/canvas/calculation-freeze.ts';
import { validateCalculationPathSubmission, iterateCalculationPathChecks } from '../src/math/calculation-path.ts';
import { generateContextualExpectedCalculation } from '../src/math/function-calculation-path.ts';
import { parseCalculationOptions } from '../src/lia/calculation-options.ts';
import { CALCULATION_TASK_NAMES, type CalculationContext } from '../src/math/calculation-context.ts';
import { createCurveEnvironment, curveRealRoots, curveEqual, curveSubstitute } from '../src/math/curve-task-core.ts';

const config = (source: string) => {
    const options = parseCalculationOptions(source);
    assert.equal(options.valid, true, options.message);
    return { runtime: Algebrite, calculationContext: options.calculationContext };
};
const generatedCases: Array<[string, string]> = [
    ['2(x+3)-x', 'aufgabe=vereinfachen'],
    ['f(x)=x^2', 'aufgabe=definitionsbereich'],
    ['f(x)=x^2', 'aufgabe=wertebereich'],
    ['f(x)=x^2', 'aufgabe=symmetrie'],
    ['f(x)=x^2', 'aufgabe=periodizitaet'],
    ['f(x)=x^2-1', 'aufgabe=achsenschnittpunkte'],
    ['f(x)=x^2', 'aufgabe=schnittpunkte;zweitefunktion=g(x)=1'],
    ['f(x)=(x^2-1)/(x-1)', 'aufgabe=grenzwert;stelle=1'],
    ['f(x)=1/(x-1)', 'aufgabe=definitionsluecken'],
    ['f(x)=1/(x-1)', 'aufgabe=asymptoten'],
    ['f(x)=x^3-3x', 'aufgabe=ableitung'],
    ['f(x)=x^3', 'aufgabe=ableitungswert;stelle=2;ordnung=2'],
    ['f(x)=x^3-3x', 'aufgabe=monotonie'],
    ['f(x)=x^3', 'aufgabe=kruemmung'],
    ['f(x)=x^3-3x', 'aufgabe=extremstellen'],
    ['f(x)=x^3-3x', 'aufgabe=extrempunkte'],
    ['f(x)=x^3', 'aufgabe=wendestellen'],
    ['f(x)=x^3', 'aufgabe=wendepunkte'],
    ['f(x)=x^2', 'aufgabe=tangente;stelle=2'],
    ['f(x)=x^2', 'aufgabe=normale;stelle=0'],
    ['f(x)=x^4', 'aufgabe=stammfunktion;familie=1'],
    ['f(x)=x', 'aufgabe=integral;von=-1;bis=1'],
    ['f(x)=x', 'aufgabe=flaecheninhalt;von=-1;bis=1'],
    ['f(x)=x^3-3x', 'aufgabe=kurvendiskussion'],
    ['f(x)=x^2-1', 'aufgabe=nullstellen'],
    ['x^2=4', 'aufgabe=gleichung'],
];
test('every documented task has a checked resolution through the public dispatcher and row review', async t => {
    assert.equal(generatedCases.length, Object.keys(CALCULATION_TASK_NAMES).length);
    for (const [prompt, authored] of generatedCases) await t.test(authored, () => {
        const options = config(authored);
        const lines = generateContextualExpectedCalculation(prompt, options);
        assert.ok(lines, 'missing generated path: ' + prompt + ' / ' + authored);
        const grade = validateCalculationPathSubmission(prompt, lines, options);
        assert.equal(grade.accepted, true, JSON.stringify(grade));
        assert.equal(grade.outcome, 'correct');
        const checks = [...iterateCalculationPathChecks(lines, prompt, options)];
        if (!['equation', 'zeros'].includes(options.calculationContext!.task!)) assert.deepEqual(checks, grade.transitionChecks);
        else assert.deepEqual(checks.map(c => c.status), grade.transitionChecks.map(c => c.status));
        assert.ok(checks.every(check => check.status === 'valid'));
    });
});
test('derivatives require function identity and retain errors before a correct final line', () => {
    const prompt = 'f(x)=x^3-3x', options = config('aufgabe=ableitung');
    for (const answer of ["f'(x)=3(x^2-1)", "f′(x)=3x^2-3", "f^{\\prime}(x)=3x^2-3"]) {
        assert.equal(validateCalculationPathSubmission(prompt, [prompt, answer], options).accepted, true, answer);
    }
    for (const answer of ["f'(x)=x^2-1", "f'(x)=3x^2", "f'(x)=3x^2-3+sqrt(-1)-sqrt(-1)"]) {
        assert.equal(validateCalculationPathSubmission(prompt, [prompt, answer], options).accepted, false, answer);
    }
    assert.equal(validateCalculationPathSubmission(prompt, [prompt, "f'(x)=x^2-1", "f'(x)=3x^2-3"], options).accepted, false);
    assert.equal(validateCalculationPathSubmission(prompt, ['f(x)=x^3-4x', "f'(x)=3x^2-3"], options).accepted, false);
});
test('normal at a horizontal tangent is vertical and integral differs from area', () => {
    const normal = config('aufgabe=normale;stelle=0'), prompt = 'f(x)=x^2';
    assert.equal(validateCalculationPathSubmission(prompt, [prompt, 'x=0'], normal).accepted, true);
    assert.equal(validateCalculationPathSubmission(prompt, [prompt, 'y=0'], normal).accepted, false);
    for (const [task, correct, wrong] of [['integral', 'I=0', 'I=1'], ['flaecheninhalt', 'A=1', 'A=0']]) {
        const options = config('aufgabe=' + task + ';von=-1;bis=1');
        assert.equal(validateCalculationPathSubmission('f(x)=x', ['f(x)=x', correct], options).accepted, true);
        assert.equal(validateCalculationPathSubmission('f(x)=x', ['f(x)=x', wrong], options).accepted, false);
    }
});
test('complete investigations require every selected subtask and preserve section meaning', () => {
    const prompt = 'f(x)=x^3-3x', options = config('aufgabe=kurvendiskussion');
    const lines = generateContextualExpectedCalculation(prompt, options);
    assert.ok(lines);
    assert.equal(validateCalculationPathSubmission(prompt, lines.slice(0, -2), options).accepted, false);
    const altered = lines.map(line => line === '\\text{extrempunkte:}' ? '\\text{wendepunkte:}' : line);
    assert.equal(validateCalculationPathSubmission(prompt, altered, options).accepted, false);
    const small = config('aufgabe=kurvendiskussion;teile=definitionsbereich,extrempunkte');
    const partial = generateContextualExpectedCalculation(prompt, small);
    assert.ok(partial);
    assert.equal(validateCalculationPathSubmission(prompt, partial, small).accepted, true);
    assert.equal(validateCalculationPathSubmission(prompt, partial, options).accepted, false);
    const bounded = config('aufgabe=kurvendiskussion;intervall=[-2,2]');
    assert.ok(generateContextualExpectedCalculation(prompt, bounded));
});
test('bad author and API contexts cannot fall back to another task', () => {
    for (const context of [
        { task: 'tangent' }, { task: 'integral', lower: '0' },
        { task: 'derivative', order: 0 }, { task: 'normal', point: '0', upper: '3' },
        { task: 'curve', parts: [] }, { task: 'guess' }, { task: 'derivative', hidden: true },
    ]) {
        const options = { runtime: Algebrite, calculationContext: context as CalculationContext };
        const grade = validateCalculationPathSubmission('f(x)=x^2', ['f(x)=x^2', "f'(x)=2x"], options);
        assert.equal(grade.accepted, false, JSON.stringify(context));
        assert.equal(generateContextualExpectedCalculation('f(x)=x^2', options), null);
        assert.ok(grade.configurationError);
    }
});
test('roots include only proven real values and undefined constants do not cancel', () => {
    const env = createCurveEnvironment('f(x)=x^4', { task: 'derivative' }, Algebrite)!;
    assert.deepEqual(curveRealRoots(env, 'x^4-1')?.sort(), ['-1', '1']);
    assert.deepEqual(curveRealRoots(env, 'x^3-1'), ['1']);
    assert.notEqual(curveEqual(env, 'x+sqrt(-1)-sqrt(-1)', 'x'), true);
    assert.notEqual(curveEqual(env, 'x+1/0-1/0', 'x'), true);
});
test('unsupported inputs, missing runtime and oversized paths remain unaccepted', () => {
    const options = config('aufgabe=ableitung');
    assert.equal(validateCalculationPathSubmission('f(x)=x^2', ['f(x)=x^2', "f'(x)=2x"], { ...options, runtime: null }).accepted, false);
    assert.equal(validateCalculationPathSubmission('f(x)=x^2', Array(34).fill('f(x)=x^2'), options).accepted, false);
    assert.equal(validateCalculationPathSubmission('f(x)=x^2', ['f(x)=x^2', "f'(x)=2^(2^100000)"], options).accepted, false);
    assert.equal(generateContextualExpectedCalculation('f(x)=x^100000', options), null);
});

test('substitution retains original holes and repeated solution labels cannot contradict', () => {
    const env = createCurveEnvironment('f(x)=x/x', { task: 'domain' }, Algebrite)!;
    assert.equal(curveSubstitute(env, env.expression, '0'), null);
    const options = config('aufgabe=kurvendiskussion;teile=nullstellen');
    const prompt = 'f(x)=x^2-1';
    assert.equal(validateCalculationPathSubmission(prompt, [prompt, 'nullstellen:', 'x_1=-1', 'x_1=1'], options).accepted, false);
    assert.equal(validateCalculationPathSubmission(prompt, [prompt, 'nullstellen:', 'x_1=-1', 'x_2=1'], options).accepted, true);
});


test('derivative paths may omit the supplied function without changing learner rows or Freeze indices', () => {
    const prompt = 'f(x)=x^4-3*x^3+2*x^2-x+1';
    const derivatives = ["f'(x)=4*x^3-9*x^2+4*x-1", "f''(x)=12*x^2-18*x+4"];
    const options = config('aufgabe=ableitung;ordnung=2;zeilenrueckmeldung=1');
    const rawPrompt = 'f ( x ) = x ^ { 4 } - 3 x ^ { 3 } + 2 x ^ { 2 } - x + 1';
    const rawDerivatives = [
        String.raw`f ^ { \prime }(x)= 4 x ^ { 3 } - 9 x ^ { 2 } + 4 x - 1`,
        String.raw`f ^ { \prime \prime } ( x ) = 1 2 x ^ { 2 } - 1 8 x + 4`,
    ];
    for (const lines of [derivatives, [prompt, ...derivatives], rawDerivatives, [rawPrompt, ...rawDerivatives]]) {
        const original = [...lines];
        const grade = validateCalculationPathSubmission(prompt, lines, options);
        assert.equal(grade.accepted, true, JSON.stringify(grade));
        assert.deepEqual(grade.lines, original, 'no synthetic starting-function row may enter the answer');
        assert.deepEqual(lines, original, 'the submitted array must not be mutated');
        assert.equal(grade.transitionChecks.length, lines.length - 1);
        assert.ok(grade.transitionChecks.every(check => check.status === 'valid'));
        assert.deepEqual([...iterateCalculationPathChecks(lines, prompt, options)], grade.transitionChecks);
        const review = { v: 'cr1', state: 'ready', lines: grade.lines,
            checks: grade.transitionChecks.map(({ status, reason, fromIndex, toIndex, role }) =>
                ({ status, reason, fromIndex, toIndex, role })) };
        assert.deepEqual(sanitizeCalculationReviewFreezeState(review), review,
            'every feedback dependency must remain a valid original-row index in Freeze');
    }
});

test('a wrong or unsupported first derivative cannot be skipped before a correct requested derivative', () => {
    const prompt = 'f(x)=x^4-3*x^3+2*x^2-x+1';
    const final = "f''(x)=12*x^2-18*x+4";
    const options = config('aufgabe=ableitung;ordnung=2');
    for (const [first, status] of [
        ["f'(x)=4*x^3-9*x^2+4*x", 'invalid'],
        ["g'(x)=4*x^3-9*x^2+4*x-1", 'unknown'],
        ["f'(t)=4*t^3-9*t^2+4*t-1", 'unknown'],
        ['an unsupported first row', 'unknown'],
    ]) {
        const grade = validateCalculationPathSubmission(prompt, [first, final], options);
        assert.equal(grade.accepted, false, first);
        assert.equal(grade.transitionChecks.length, 1);
        assert.equal(grade.transitionChecks[0].status, status, first);
        assert.equal(grade.transitionChecks[0].fromIndex, 0);
        assert.equal(grade.transitionChecks[0].toIndex, 1);
        assert.equal(grade.firstProblem?.lineIndex, 0);
    }
    const grade = validateCalculationPathSubmission(prompt,
        ['unknown first row', "f''(x)=12*x^2-18*x+5"], options);
    assert.equal(grade.transitionChecks[0].status, 'invalid', 'a proven later error outranks an unsupported first row');
});

test('an explicitly repeated wrong function remains rejected even when all derivatives match the authored task', () => {
    const prompt = 'f(x)=x^4-3*x^3+2*x^2-x+1';
    const options = config('aufgabe=ableitung;ordnung=2');
    const final = "f''(x)=12*x^2-18*x+4";
    for (const first of ['f(x)=x^4-3*x^3+2*x^2-x+2', 'g(x)=x^4-3*x^3+2*x^2-x+1']) {
        const grade = validateCalculationPathSubmission(prompt, [first, final], options);
        assert.equal(grade.accepted, false, first);
        assert.notEqual(grade.transitionChecks[0].status, 'valid', 'the supplied wrong premise must remain visible');
    }
});

test('a single requested derivative is complete but the original function or a lower order is not', () => {
    const prompt = 'f(x)=x^4';
    const options = config('aufgabe=ableitung;ordnung=2');
    for (const answer of [["f''(x)=12*x^2"], JSON.stringify(["f''(x)=12*x^2"])]) {
        const grade = validateCalculationPathSubmission(prompt, answer, options);
        assert.equal(grade.accepted, true, JSON.stringify(grade));
        assert.deepEqual(grade.lines, ["f''(x)=12*x^2"]);
        assert.deepEqual(grade.transitionChecks, []);
    }
    for (const lines of [[prompt], ["f'(x)=4*x^3"], ["f''(x)=12*x^2+1"], []]) {
        assert.equal(validateCalculationPathSubmission(prompt, lines, options).accepted, false, JSON.stringify(lines));
    }
    assert.equal(validateCalculationPathSubmission(prompt, ["f'(x)=4*x^3"], config('aufgabe=ableitung')).accepted, true);
    assert.equal(validateCalculationPathSubmission(prompt, ["f''(x)=12*x^2"], config('aufgabe=ableitung;ordnung=3')).accepted, false);
});

test('third derivatives can begin with intermediate derivatives and retain later errors', () => {
    const prompt = 'g(x)=1/2*x^4-2*x^3+x^2';
    const options = config('aufgabe=ableitung;ordnung=3');
    const lines = ["g'(x)=2*x^3-6*x^2+2*x", "g''(x)=6*x^2-12*x+2", "g'''(x)=12*x-12"];
    const grade = validateCalculationPathSubmission(prompt, lines, options);
    assert.equal(grade.accepted, true, JSON.stringify(grade));
    assert.equal(grade.transitionChecks.length, 2);
    const wrong = [lines[0], "g''(x)=6*x^2-12*x+3", lines[2]];
    const failed = validateCalculationPathSubmission(prompt, wrong, options);
    assert.equal(failed.accepted, false);
    assert.equal(failed.transitionChecks[0].status, 'invalid');
    assert.deepEqual(failed.lines, wrong);
});

test('optional supplied functions remain limited to derivatives and keep existing safety bounds', () => {
    assert.equal(validateCalculationPathSubmission('f(x)=x', ['I=0'], config('aufgabe=integral;von=-1;bis=1')).accepted, false);
    assert.equal(validateCalculationPathSubmission('f(x)=x^2', ["f'(1)=2"], config('aufgabe=ableitungswert;stelle=1')).accepted, false);
    assert.equal(validateCalculationPathSubmission('2x+3=7', ['2x=4', 'x=2'], config('aufgabe=gleichung')).accepted, false);
    const options = config('aufgabe=ableitung');
    for (const lines of [["f'(x)=2^(2^100000)"], Array(33).fill("f'(x)=2*x")]) {
        assert.equal(validateCalculationPathSubmission('f(x)=x^2', lines, options).accepted, false);
    }
    assert.equal(validateCalculationPathSubmission('f(x)=x^2', ["f'(x)=2*x"], { ...options, runtime: null }).accepted, false);
});
