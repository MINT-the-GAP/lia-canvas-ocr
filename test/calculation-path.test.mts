import assert from 'node:assert/strict';
import test from 'node:test';
import Algebrite from 'algebrite';
import { generateExpectedCalculation } from '../src/math/expected-calculation.ts';
import { serializeCalculationSubmission } from '../src/math/equivalence.ts';
import { validateCalculationPathSubmission, iterateCalculationPathChecks } from '../src/math/calculation-path.ts';

(globalThis as any).Algebrite = Algebrite;

function accepted(prompt: string, lines: readonly string[]) {
    const grade = validateCalculationPathSubmission(prompt, [...lines]);
    assert.equal(grade.accepted, true, JSON.stringify({ prompt, lines, grade }));
    assert.equal(grade.outcome, 'correct');
    assert.equal(grade.promptCheck.status, 'valid');
    assert.equal(grade.finalCheck.status, 'valid');
    assert.equal(grade.transitionChecks.some(check => check.status !== 'valid'), false);
    return grade;
}

const quadraticCompletion = [
    String.raw`5x^2-20x=50 \mid :5`,
    String.raw`x^2-4x=10 \mid +4`,
    'x^2-4x+4=14',
    '(x-2)^2=14',
    String.raw`x_{1,2}-2=\pm\sqrt{14}`,
    String.raw`x_{1,2}=2\pm\sqrt{14}`,
];

test('accepts the complete quadratic-completion method including a shifted root step', () => {
    accepted('5x^2-20x=50', quadraticCompletion);
    const unfinished = validateCalculationPathSubmission('5x^2-20x=50', quadraticCompletion.slice(0,-1));
    assert.equal(unfinished.accepted, false);
    assert.equal(unfinished.outcome, 'incomplete');
});

test('never hides an incorrect middle step behind the correct quadratic roots', () => {
    const lines = [...quadraticCompletion];
    lines[2] = 'x^2-4x+4=15';
    const grade = validateCalculationPathSubmission('5x^2-20x=50', lines);
    assert.equal(grade.accepted, false);
    assert.equal(grade.outcome, 'incorrect');
    assert.ok(grade.transitionChecks.some(check => check.status === 'invalid'));
});

const linearSolution = ['3x-2=5x+4','-2x=6','x=-3'];

test('checks a substitution probe against the original equation and preserves the solved main path', () => {
    const grade = accepted('3x-2=5x+4', [
        ...linearSolution,
        String.raw`\text{Probe:}3\cdot(-3)-2=5\cdot(-3)+4`,
        '-11=-11',
    ]);
    assert.ok(grade.transitionChecks.some(check => check.role === 'verification'));
});

test('rejects an incorrect probe even when its last numeric row is correct', () => {
    const grade = validateCalculationPathSubmission('3x-2=5x+4', [
        ...linearSolution,
        String.raw`\text{Probe:}3\cdot(-3)-2=5\cdot(-3)+5`,
        '-11=-11',
    ]);
    assert.equal(grade.accepted, false);
    assert.equal(grade.outcome, 'incorrect');
});

test('does not claim an unrelated true numeric equality is a probe of the solved equation', () => {
    const grade = validateCalculationPathSubmission('3x-2=5x+4', [
        ...linearSolution, String.raw`\text{Probe:}2+3=5`,
    ]);
    assert.equal(grade.accepted, false);
});

test('checks an explicitly independent numeric side calculation without replacing the main equation', () => {
    const lines = [
        linearSolution[0],
        String.raw`\text{Nebenrechnung:}2+3=5`,
        String.raw`\text{Hauptrechnung:}-2x=6`,
        'x=-3',
    ];
    accepted('3x-2=5x+4', lines);
    lines[1] = String.raw`\text{Nebenrechnung:}2+3=6`;
    const grade = validateCalculationPathSubmission('3x-2=5x+4', lines);
    assert.equal(grade.accepted, false);
    assert.equal(grade.outcome, 'incorrect');
});

test('accepts every existing supported generated sample solution including discriminant side calculations', async t => {
    const prompts = [
        String.raw`3x^{2}-7=9`, '3x-5=7', '2x+3=x-4', '2(x+3)=3x-4',
        '1/3+x/2=5/6', String.raw`\frac{x+1}{2}=3`, '0.5t+1=2', '0,5t+1=2',
        '2(x+1)=2x+2', '2(x+1)=2x+3', 'x^2-5x+6=0',
        String.raw`\frac{1}{2}z^2-\frac{3}{2}z+1=0`,
        'x^2+x+1=0', '(x+1)^2=0', '2x^2+x=x^2+5', 'x^2-2x-2=0',
        '2x^3=16', 'x^3+1=0', '16y^4=81', 'x^3=2', 'x^4+2=0',
        '2x^3+1=x^3+9', '2x^2+1=x^2+5', '2y+3=y-4',
    ];
    for (const prompt of prompts) await t.test(prompt, () => {
        const lines = generateExpectedCalculation(prompt);
        assert.ok(lines, prompt);
        accepted(prompt, lines);
    });
});

test('accepts a labelled elimination path only after all system variables are solved', () => {
    const prompt = String.raw`\begin{cases}x+y=3\\x-y=1\end{cases}`;
    const lines = ['I: x+y=3','II: x-y=1','I+II: 2x=4','x=2','y=1'];
    accepted(prompt, lines);
    assert.equal(validateCalculationPathSubmission(prompt, lines.slice(0,-1)).accepted, false);
    const incorrect = [...lines];
    incorrect[2]='I+II: 2x=5';
    assert.equal(validateCalculationPathSubmission(prompt,incorrect).accepted, false);
});

test('accepts the material substitution method with retained equation labels and back-substitution', () => {
    const prompt = String.raw`\begin{cases}4a=b-2\\2b=12a+8\end{cases}`;
    accepted(prompt, [
        'I: 4a=b-2','II: 2b=12a+8','II: b=6a+4',
        'II in I: 4a=(6a+4)-2','-2a=2','a=-1','II: b=6*(-1)+4','b=-2',
    ]);
});

test('validates a three-variable system through an explicit equation combination', () => {
    const prompt = String.raw`\begin{cases}x+y+z=6\\x-y=0\\z=2\end{cases}`;
    accepted(prompt, [
        'I: x+y+z=6','II: x-y=0','III: z=2',
        'I-II: 2y+z=6','2y+2=6','y=2','x=2','z=2',
    ]);
});

test('supports an explicit biquadratic substitution with two return branches and all four final roots', () => {
    const prompt = 'x^4-5x^2+4=0';
    const lines = [
        prompt, String.raw`\text{Substitution:}u=x^2`,
        String.raw`\text{Nebenrechnung:}u^2-5u+4=0`,
        String.raw`u_{1,2}=\frac{5\pm3}{2}`,
        String.raw`u_1=4,\quad u_2=1`,
        String.raw`\text{Rücksubstitution:}x^2=4`,
        String.raw`x_{1,2}=\pm2`,
        String.raw`\text{Rücksubstitution:}x^2=1`,
        String.raw`x_{1,2}=\pm1`,
        String.raw`\mathcal{L}=\{-2;-1;1;2\}`,
    ];
    accepted(prompt, lines);
    const missing = [...lines];
    missing[missing.length-1]=String.raw`\mathcal{L}=\{-2;2\}`;
    assert.equal(validateCalculationPathSubmission(prompt,missing).accepted, false);
    const incorrect = [...lines];
    incorrect[2]=String.raw`\text{Nebenrechnung:}u^2-5u+5=0`;
    assert.equal(validateCalculationPathSubmission(prompt,incorrect).accepted, false);
});

test('retains rational original exclusions through clearing and a finite solution set', () => {
    for (const [prompt, lines] of [
        [String.raw`\frac{6}{x-1}=3`, [String.raw`\frac{6}{x-1}=3`,'6=3(x-1)','x=3']],
        [String.raw`\frac{x}{x-1}=2`, [String.raw`\frac{x}{x-1}=2`,'x=2(x-1)','x=2']],
        [String.raw`\frac{x^2-1}{x-1}=0`, [String.raw`\frac{x^2-1}{x-1}=0`,'x^2-1=0','x+1=0',String.raw`L=\{-1\}`]],
    ] as const) accepted(prompt, lines);
    const prompt=String.raw`\frac{x^2-1}{x-1}=0`;
    const forbidden=validateCalculationPathSubmission(prompt,[prompt,'x^2-1=0',String.raw`L=\{-1;1\}`]);
    assert.equal(forbidden.accepted,false);
    assert.equal(forbidden.outcome,'incorrect');
});

test('refuses hidden new poles and incorrect rational intermediate steps despite a correct final value', () => {
    const prompt=String.raw`\frac{6}{x-1}=3`;
    for (const intermediate of [String.raw`\frac{(x-3)(x-2)}{x-2}=0`,'x=4']) {
        assert.equal(validateCalculationPathSubmission(prompt,[prompt,intermediate,'x=3']).accepted,false);
    }
});

test('keeps array and serialized submissions consistent and yields review results at original line indexes', () => {
    const expected=accepted('5x^2-20x=50',quadraticCompletion);
    const serialized=validateCalculationPathSubmission('5x^2-20x=50',serializeCalculationSubmission(quadraticCompletion));
    assert.equal(serialized.accepted,true);
    assert.deepEqual(serialized.lines,expected.lines);
    const checks=[...iterateCalculationPathChecks(quadraticCompletion,'5x^2-20x=50')];
    assert.ok(checks.length>0);
    assert.equal(checks.some(check=>check.status!=='valid'),false);
    assert.equal(checks.at(-1)?.toIndex,quadraticCompletion.length-1);
    for(const check of checks) {
        assert.equal(check.to,quadraticCompletion[check.toIndex]);
        assert.equal(check.from,quadraticCompletion[check.fromIndex]);
    }
});

test('preserves safe outcomes for another task, absent CAS and malformed input', () => {
    assert.equal(validateCalculationPathSubmission('x+1=3',linearSolution).accepted,false);
    for(const answer of ['', '["x=1",null]', ['x=2=3','x=2']]) {
        assert.equal(validateCalculationPathSubmission('x+1=3',answer).accepted,false);
    }
    const previous=(globalThis as any).Algebrite;
    try {
        delete (globalThis as any).Algebrite;
        const grade=validateCalculationPathSubmission('3x-2=5x+4',linearSolution);
        assert.equal(grade.accepted,false);
        assert.equal(grade.outcome,'unknown');
    } finally { (globalThis as any).Algebrite=previous; }
});
test('accepts an exclusion derived from the original denominator but no arbitrary added assumption', () => {
    const prompt=String.raw`\frac{6}{x-1}=3`;
    accepted(prompt,[prompt,String.raw`x\ne1`,'6=3(x-1)','x=3']);
    assert.equal(validateCalculationPathSubmission(prompt,[prompt,String.raw`x\ne2`,'6=3(x-1)','x=3']).accepted,false);
});
test('rejects a power bomb before either the contextual or legacy path invokes the CAS', () => {
    const previous=(globalThis as any).Algebrite;
    const calls: string[]=[];
    try {
        // Record-only runtime: these intentionally huge exponents never reach
        // the real CAS, including when a regression makes this assertion fail.
        (globalThis as any).Algebrite={run(source: string){calls.push(source);return '0';}};
        for(const [prompt,lines] of [
            ['x=1',['x=1','x=2^{999999999999999999999999}']],
            ['x^{999999999999999999999999}=1',['x=1','x=1']],
        ] as const) {
            calls.length=0;
            const grade=validateCalculationPathSubmission(prompt,lines);
            assert.equal(grade.accepted,false);
            assert.equal(calls.length,0);
        }
    } finally { (globalThis as any).Algebrite=previous; }
});
test('requires the final main equation to be isolated even after an earlier solved row', () => {
    const grade=validateCalculationPathSubmission('3x-5=7',[
        '3x-5=7','3x=12','x=4','2x=8',
    ]);
    assert.equal(grade.accepted,false);
    assert.equal(grade.outcome,'incomplete');
});

test('does not let a correct final solution set bypass an unperformed declared operation', () => {
    const grade=validateCalculationPathSubmission('x^2=4',[
        String.raw`x^2=4 \mid +1`,String.raw`L=\{-2;2\}`,
    ]);
    assert.equal(grade.accepted,false);
    accepted('x^2=4',[
        String.raw`x^2=4 \mid +1`,'x^2+1=5',String.raw`L=\{-2;2\}`,
    ]);
});

test('proves denominator clearing under the retained domain and enforces the declared factor', () => {
    const prompt=String.raw`\frac{6}{x-1}=3`;
    accepted(prompt,[
        String.raw`\frac{6}{x-1}=3 \mid \cdot(x-1)`,'6=3(x-1)','x=3',
    ]);
    for(const [first,next] of [
        [String.raw`\frac{6}{x-1}=3 \mid \cdot(x+1)`,'6=3(x-1)'],
        [String.raw`\frac{6}{x-1}=3 \mid \cdot2`,'6=3(x-1)'],
        [String.raw`\frac{6}{x-1}=3 \mid \cdot(x-1)`,'7=3(x-1)'],
    ]) assert.equal(validateCalculationPathSubmission(prompt,[first,next,'x=3']).accepted,false);
});
test('does not discard a contradictory later equality in the original prompt', () => {
    const grade = validateCalculationPathSubmission('x=2=3', ['x=2', 'x=2']);
    assert.equal(grade.accepted, false);
    assert.notEqual(grade.promptCheck.status, 'valid');
});

test('an explicit system combination cannot bypass a preceding unperformed operation', () => {
    const prompt = String.raw`\begin{cases}x+y=5\\x-y=1\end{cases}`;
    const grade = validateCalculationPathSubmission(prompt, [
        'I. x+y=5', String.raw`II. x-y=1\mid+1`, String.raw`\text{I+II:}2x=6`, 'x=3', 'y=2',
    ]);
    assert.equal(grade.accepted, false);
    assert.ok(grade.transitionChecks.some(check => check.status !== 'valid'));
});

test('an independent side calculation retains its own unfinished declared operation', () => {
    const grade = validateCalculationPathSubmission('x=2', [
        'x=2', String.raw`\text{Nebenrechnung:}1=1\mid+1`, 'x=2',
    ]);
    assert.equal(grade.accepted, false);
});
test('a completed numerical probe cannot hide its own unperformed operation', () => {
    const grade = validateCalculationPathSubmission('2x=6', [
        '2x=6', 'x=3', String.raw`\text{Probe:}6=6\mid+1`,
    ]);
    assert.equal(grade.accepted, false);
});

test('ambiguous i does not become a proven nonzero imaginary constant in a real solution method', () => {
    for (const lines of [
        [String.raw`x=2\mid +(i^2+1)`, 'x=2'],
        [String.raw`x=2\mid\cdot i^2`, '-x=-2', 'x=2'],
    ]) {
        const native = validateCalculationPathSubmission('x=2', lines);
        assert.equal(native.accepted, false);
        assert.equal(native.outcome, 'unknown');
        const live = [...iterateCalculationPathChecks(lines, 'x=2')];
        assert.ok(live.some(check => check.status === 'unknown'));
    }
});
test('a root index retains one value inside its branch while identical repetition stays valid', () => {
    const conflicting = validateCalculationPathSubmission('x^2=4', [
        'x^2=4', 'x_1=-2', 'x_1=2',
    ]);
    assert.equal(conflicting.accepted, false);
    assert.ok(conflicting.transitionChecks.some(check => check.reason === 'conflicting-solution-label'));
    accepted('x^2=4', ['x^2=4', 'x_1=-2', 'x_1=-2', 'x_2=2']);
});

test('live and native checks both require a declared ordinary operation to be performed', () => {
    const lines = [String.raw`2x=6\mid +1`, 'x=3'];
    assert.equal(validateCalculationPathSubmission('2x=6', lines).accepted, false);
    assert.ok([...iterateCalculationPathChecks(lines, '2x=6')].some(check => check.status !== 'valid'));
});


test('a real unknown named D is not mistaken for a discriminant side calculation', () => {
    const lines = ['2D=6', 'D=3'];
    accepted('2D=6', lines);
    assert.ok([...iterateCalculationPathChecks(lines, '2D=6')].every(check => check.status === 'valid'));
});


test('live review keeps the declared operation and the incorrect equation side', () => {
    const prompt = '3x-5=7';
    const start = String.raw`3x-5=7\mid +5`;
    const [correct] = [...iterateCalculationPathChecks([start, '3x=12'], prompt)];
    assert.equal(correct.status, 'valid');
    assert.equal(correct.operation, '+5');
    const [incorrect] = [...iterateCalculationPathChecks([start, '3x=13'], prompt)];
    assert.equal(incorrect.status, 'invalid');
    assert.equal(incorrect.side, 'right');
});

test('a descriptive kinetic-energy subscript is not mistaken for the reserved CAS variable i', () => {
    const prompt = String.raw`E_{kin}+mgh=\frac{1}{2}mv^2`;
    const lines = [prompt + String.raw` |\cdot2`, String.raw`2E_{kin}+mgh=mv^2 |:m`];
    const native = validateCalculationPathSubmission(prompt, lines);
    assert.equal(native.accepted, false);
    assert.equal(native.outcome, 'incorrect');
    assert.equal(native.promptCheck.status, 'valid');
    const live = [...iterateCalculationPathChecks(lines, prompt)];
    for (const checks of [native.transitionChecks, live]) {
        assert.equal(checks.length, 1);
        assert.equal(checks[0].status, 'invalid');
        assert.equal(checks[0].reason, 'operation-missing-left');
        assert.equal(checks[0].side, 'left');
        assert.equal(checks[0].operation, String.raw`\cdot2`);
    }
});
test('live review validates correct local continuations after an incorrect quadratic main step', () => {
    const prompt='3x^2-5=12';
    const lines=[
        String.raw`3x^2-5=12 \mid +5`,
        String.raw`3x^2=18 \mid :3`,
        'x^2=6',String.raw`\to x_{1,2}=\pm\sqrt6`,
    ];
    const live=[...iterateCalculationPathChecks(lines,prompt)];
    assert.deepEqual(live.map(check=>check.status),['invalid','valid','valid']);
    const grade=validateCalculationPathSubmission(prompt,lines);
    assert.equal(grade.accepted,false);
    assert.equal(grade.outcome,'incorrect');
});

test('live review preserves the existing braced cubic and fourth-root OCR arrow paths', () => {
    const cases=[
        ['3x^3-4=0',[
            String.raw`3x^3-4=0 \mid +4`,String.raw`3x^3=4 \mid :3`,
            String.raw`x^3=\frac{4}{3}`,String.raw`\Rarr x=\sqrt[3]{\frac{4}{3}}`,
        ]],
        ['3m^4=5',[
            String.raw`3m^4=5 \mid :3`,String.raw`m^4=\frac{5}{3}`,
            String.raw`\Rarr m_{1,2}=\pm\sqrt[4]{\frac{5}{3}}`,
        ]],
    ] as const;
    for(const [prompt,lines] of cases) {
        const live=[...iterateCalculationPathChecks(lines,prompt)];
        assert.equal(live.length,lines.length-1);
        assert.ok(live.every(check=>check.status==='valid'),JSON.stringify({prompt,live}));
        accepted(prompt,lines);
    }
});

test('a final solution set cannot hide an unperformed operation attached to a root row', () => {
    for (const [prompt, root, solutionSet] of [
        ['x^2=4', String.raw`x_{1,2}=\pm2\mid+1`, String.raw`\mathcal{L}=\{-2;2\}`],
        ['x^3=8', String.raw`x=2\mid+1`, String.raw`\mathcal{L}=\{2\}`],
    ]) {
        const lines = [prompt, root, solutionSet];
        assert.equal(validateCalculationPathSubmission(prompt, lines).accepted, false);
        assert.ok([...iterateCalculationPathChecks(lines, prompt)].some(check => check.status !== 'valid'));
    }
});
