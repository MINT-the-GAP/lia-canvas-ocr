import assert from 'node:assert/strict';
import test from 'node:test';
import Algebrite from 'algebrite';
import { createCurveEnvironment } from '../src/math/curve-task-core.ts';
import { buildCurvePropertyTask } from '../src/math/curve-properties.ts';
import { validateCalculationPathSubmission } from '../src/math/calculation-path.ts';
import type { CalculationContext } from '../src/math/calculation-context.ts';
function model(prompt: string, context: CalculationContext) {
    const env = createCurveEnvironment(prompt, context, Algebrite);
    assert.ok(env, 'environment: ' + prompt);
    const task = buildCurvePropertyTask(env);
    assert.ok(task, 'model: ' + prompt + ' ' + JSON.stringify(context));
    const completed = new Set<string>();
    for (const line of task.expectedLines) {
        const check = task.checkLine(line);
        assert.equal(check?.proof, true, 'generated line: ' + line + ' ' + JSON.stringify(check));
        for (const target of check?.targets || []) completed.add(target);
    }
    assert.ok(task.required.every(target => completed.has(target)), 'generated completeness');
    return task;
}
const cases: Array<[string, CalculationContext, string[], string[]]> = [
    ['f(x)=(x^2-1)/(x-1)', { task:'simplify' }, ['f(x)=x+1','D=\\mathbb{R}\\setminus\\{1\\}'], ['f(x)=x-1','D=\\mathbb{R}']],
    ['f(x)=2x+3x', { task:'simplify' }, ['5x'], ['4x', '5x^2/x']],
    ['f(x)=1/(x^2-1)', { task:'domain' }, ['D=\\mathbb{R}\\setminus\\{-1;1\\}'], ['D=\\mathbb{R}', 'D=\\mathbb{R}\\setminus\\{1\\}']],
    ['f(x)=1/(x^2+1)', { task:'domain' }, ['D=\\mathbb{R}'], ['D=\\mathbb{R}\\setminus\\{0\\}']],
    ['f(x)=1/(1/x)', { task:'domain' }, ['D=\\mathbb{R}\\setminus\\{0\\}'], ['D=\\mathbb{R}']],
    ['f(x)=x^2-2x+3', { task:'range' }, ['W=[2;\\infty)'], ['W=(2;\\infty)', 'W=\\mathbb{R}']],
    ['f(x)=x^4-2x^2', { task:'range' }, ['W=[-1;\\infty)'], ['W=[0;\\infty)']],
    ['f(x)=-2', { task:'range' }, ['W=\\{-2\\}'], ['W=\\mathbb{R}']],
    ['f(x)=x^3', { task:'range' }, ['W=\\mathbb{R}'], ['W=[0;\\infty)']],
    ['f(x)=x^2', { task:'range', interval:{lower:'-1',upper:'2',lowerClosed:false,upperClosed:false} }, ['W=[0;4)'], ['W=(0;4)', 'W=[0;4]']],
    ['f(x)=x^2', { task:'symmetry' }, ['achsensymmetrisch'], ['punktsymmetrisch', 'keine Symmetrie']],
    ['f(x)=1/x', { task:'symmetry' }, ['punktsymmetrisch'], ['achsensymmetrisch']],
    ['f(x)=x^2+x', { task:'symmetry' }, ['keine Symmetrie'], ['achsensymmetrisch']],
    ['f(x)=0', { task:'symmetry' }, ['achsen- und punktsymmetrisch'], ['keine Symmetrie']],
    ['f(x)=x', { task:'periodicity' }, ['nicht periodisch'], ['T=2']],
    ['f(x)=3', { task:'periodicity' }, ['Jede positive Zahl ist eine Periode'], ['nicht periodisch','T=0']],
    ['f(x)=x^2-1', { task:'intercepts' }, ['S=\\{(-1|0);(1|0);(0|-1)\\}'], ['S=\\{(-1|0);(1|0)\\}','S=\\{(-1|0);(1|0);(0|1)\\}']],
    ['f(x)=x^2', { task:'intersections', secondFunction:'g(x)=x+2' }, ['S=\\{(-1|1);(2|4)\\}'], ['S=\\{(2|4)\\}','S=\\{-1;2\\}']],
    ['f(x)=(x^2-1)/(x-1)', { task:'limit', point:'1' }, ['L=2'], ['L=1','L=\\infty']],
    ['f(x)=1/x', { task:'limit', point:'0', side:'left' }, ['L=-\\infty'], ['L=\\infty','L=0']],
    ['f(x)=1/x', { task:'limit', point:'0' }, ['L=\\text{existiert nicht}'], ['L=\\infty']],
    ['f(x)=1/x^2', { task:'limit', point:'0' }, ['L=\\infty'], ['L=\\text{existiert nicht}']],
    ['f(x)=(2x^2+1)/(x^2+1)', { task:'limit', point:'\\infty' }, ['L=2'], ['L=0']],
    ['f(x)=x^3', { task:'limit', point:'-\\infty' }, ['L=-\\infty'], ['L=\\infty']],
    ['f(x)=(x^2-1)/(x-1)', { task:'discontinuities' }, ['Hebbare Luecken=\\{(1|2)\\}', 'Polstellen=\\varnothing'], ['Polstellen=\\{1\\}','Hebbare Luecken=\\{(1|0)\\}']],
    ['f(x)=1/(x-1)^2', { task:'discontinuities' }, ['Hebbare Luecken=\\varnothing', 'Polstellen=\\{1\\}'], ['Polstellen=\\varnothing']],
    ['f(x)=(x^2+1)/(x-1)', { task:'asymptotes' }, ['A=\\{x=1;y=x+1\\}'], ['A=\\{x=1\\}', 'A=\\{x=1;y=x\\}']],
    ['f(x)=1/x', { task:'asymptotes' }, ['A=\\{x=0;y=0\\}'], ['A=\\{y=0\\}']],
    ['f(x)=x^2', { task:'asymptotes' }, ['A=\\varnothing'], ['A=\\{y=x^2\\}']],
];
test('properties prove expected lines and reject mathematically wrong/partial result sets', async t => {
    for (const [prompt,context,valid,invalid] of cases) await t.test(prompt+' '+JSON.stringify(context), () => {
        const task = model(prompt,context);
        for (const line of valid) assert.equal(task.checkLine(line)?.proof, true, line);
        for (const line of invalid) assert.notEqual(task.checkLine(line)?.proof, true, line);
    });
});
test('a cancelled exclusion remains a required final simplification condition', () => {
    const task = model('f(x)=(x^2-1)/(x-1)', {task:'simplify'});
    assert.ok(task.required.includes('domain'));
    assert.deepEqual(task.checkLine('f(x)=x+1')?.targets, ['simplify']);
});
test('intersections respect the second domain and the authored interval', () => {
    const task = model('f(x)=x^2', {task:'intersections',secondFunction:'x+2', interval:{lower:'0',upper:'3',lowerClosed:true,upperClosed:true}});
    assert.equal(task.checkLine('S=\\{(2|4)\\}')?.proof,true);
    assert.notEqual(task.checkLine('S=\\{(-1|1);(2|4)\\}')?.proof,true);
    const empty = model('f(x)=x+1', {task:'intersections',secondFunction:'(x^2-1)/(x-1)+x-1'});
    assert.equal(empty.checkLine('S=\\varnothing')?.proof,true);
});
test('unsupported expressions and undefined constants never yield a successful property model', () => {
    for (const prompt of ['f(x)=1/0', 'f(x)=sin(x)+x', 'f(x)=x^6']) {
        const env = createCurveEnvironment(prompt,{task:'domain'},Algebrite);
        assert.equal(env && buildCurvePropertyTask(env),null,prompt);
    }
});


test('simplification requires a shorter collected end form and allows correct intermediate terms', () => {
    for (const [prompt,original,answer] of [['f(x)=x+x','x+x','2x'],['f(x)=2(x+3)-x','2(x+3)-x','x+6']]) {
        const task=model(prompt,{task:'simplify'});
        assert.equal(task.checkLine(original)?.proof,true);
        assert.ok(!task.checkLine(original)?.targets?.includes('simplify'));
        assert.ok(task.checkLine(answer)?.targets?.includes('simplify'));
    }
});
test('domains retain interval endpoints and all original holes inside them', () => {
    const context={task:'domain' as const, interval:{lower:'0',upper:'2',lowerClosed:false,upperClosed:true}};
    const polynomial=model('f(x)=x^2',context);
    assert.equal(polynomial.checkLine('D=(0;2]')?.proof,true);
    assert.notEqual(polynomial.checkLine('D=[0;2]')?.proof,true);
    const rational=model('f(x)=1/(x^2-1)',context);
    assert.equal(rational.checkLine('D=(0;2]\\setminus\\{1\\}')?.proof,true);
    assert.notEqual(rational.checkLine('D=(0;2]')?.proof,true);
});
test('fundamental periods respect affine arguments, amplitudes, offsets and angle units', () => {
    for (const [prompt,context,correct,wrong] of [
        ['f(x)=2sin(3x+1)+4',{task:'periodicity'},'T=2*pi/3','T=4*pi/3'],
        ['f(x)=cos(-2x)',{task:'periodicity'},'T=pi','T=-pi'],
        ['f(x)=tan(2x)',{task:'periodicity'},'T=pi/2','T=pi'],
        ['f(x)=sin(3x+1)',{task:'periodicity',angleUnit:'deg'},'T=120','T=2*pi/3'],
    ] as Array<[string,CalculationContext,string,string]>) {
        const task=model(prompt,context);
        assert.equal(task.checkLine(correct)?.proof,true,correct);
        assert.notEqual(task.checkLine(wrong)?.proof,true,wrong);
    }
});
test('second functions cannot silently change the independent variable', () => {
    const env=createCurveEnvironment('f(x)=x^2',{task:'intersections',secondFunction:'g(t)=x'},Algebrite)!;
    assert.equal(buildCurvePropertyTask(env),null);
});


test('rational periods and symmetry preserve their uncancelled domains', () => {
    for (const prompt of ['f(x)=1/x','f(x)=(x-1)/(x-1)']) {
        const task=model(prompt,{task:'periodicity'});
        assert.equal(task.checkLine('nicht periodisch')?.proof,true);
        assert.notEqual(task.checkLine('T=2')?.proof,true);
    }
    const symmetry=model('f(x)=(x-1)/(x-1)',{task:'symmetry'});
    assert.equal(symmetry.checkLine('keine Symmetrie')?.proof,true);
    assert.notEqual(symmetry.checkLine('achsensymmetrisch')?.proof,true);
});
test('finite excluded sets cannot masquerade as domains', () => {
    const task=model('f(x)=1/x',{task:'domain'});
    for(const answer of ['D=\\{0\\}','D=R\\{0\\}','D=\\mathbb{R}']) assert.notEqual(task.checkLine(answer)?.proof,true,answer);
});
test('plain authored infinity and one-sided notation are respected', () => {
    const negative=model('f(x)=x^3',{task:'limit',point:'-infty'});
    assert.equal(negative.checkLine('L=-infty')?.proof,true);
    const positive=model('f(x)=1/x',{task:'limit',point:'+infty'});
    assert.equal(positive.checkLine('L=0')?.proof,true);
    const right=model('f(x)=1/x',{task:'limit',point:'0',side:'right'});
    assert.notEqual(right.checkLine('\\lim_{x\\to 0^-}f(x)=-\\infty')?.proof,true);
});


test('individual labelled intersections and individual asymptote equations form complete answers', () => {
    const intersections=model('f(x)=x^2',{task:'intersections',secondFunction:'x+2'});
    const targets=new Set<string>();
    for(const line of ['S_1=(-1|1)','P2(2|4)']) {
        const check=intersections.checkLine(line);
        assert.equal(check?.proof,true,line);
        for(const target of check?.targets||[]) targets.add(target);
    }
    assert.ok(intersections.required.every(target=>targets.has(target)));
    assert.notEqual(intersections.checkLine('P(2|3)')?.proof,true);
    const asymptotes=model('f(x)=1/x',{task:'asymptotes'});
    const asymptoteTargets=new Set<string>();
    for(const line of ['x=0','y=0']) {
        const check=asymptotes.checkLine(line);
        assert.equal(check?.proof,true,line);
        for(const target of check?.targets||[]) asymptoteTargets.add(target);
    }
    assert.ok(asymptotes.required.every(target=>asymptoteTargets.has(target)));
    assert.notEqual(asymptotes.checkLine('y=1')?.proof,true);
});


test('periodicity distinguishes a chosen period from a complete constant-function classification', () => {
    const task=model('f(x)=3',{task:'periodicity'});
    assert.equal(task.checkLine('T=2')?.proof,true);
    assert.deepEqual(task.checkLine('T=2')?.targets,undefined);
    assert.ok(task.checkLine('keine Grundperiode')?.targets?.includes('periodicity'));
});
test('axis and null-point labels retain their mathematical meanings', () => {
    const task=model('f(x)=x^2-1',{task:'intercepts'});
    assert.equal(task.checkLine('S_x=\\{(-1|0);(1|0)\\}')?.proof,true);
    assert.equal(task.checkLine('S_y=(0|-1)')?.proof,true);
    assert.equal(task.checkLine('N_1=(-1|0)')?.proof,true);
    assert.equal(task.checkLine('N(0|-1)')?.proof,false);
    assert.equal(task.checkLine('S_y=\\{(-1|0);(1|0);(0|-1)\\}')?.proof,false);
    assert.equal(task.checkLine('S_x=(0|-1)')?.proof,false);
});
test('different coordinates cannot silently reassign the same intersection label', () => {
    const task=model('f(x)=x^2',{task:'intersections',secondFunction:'x+2'});
    assert.equal(task.checkLine('S_1=(-1|1)')?.proof,true);
    assert.equal(task.checkLine('S_{1}=(2|4)')?.proof,false);
    assert.equal(task.checkLine('S_2=(2|4)')?.proof,true);
});
test('property owners and ordinate labels cannot be silently changed', () => {
    assert.equal(model('f(x)=x',{task:'domain'}).checkLine('D_g=\\mathbb{R}')?.proof,false);
    assert.equal(model('f(x)=x',{task:'range'}).checkLine('W_g=\\mathbb{R}')?.proof,false);
    const env=createCurveEnvironment('f(y)=1/y',{task:'asymptotes'},Algebrite)!;
    assert.equal(buildCurvePropertyTask(env),null);
});


test('excluded interval endpoints agree with equivalent open-endpoint domain notation', () => {
    const task=model('f(x)=1/x',{task:'domain',interval:{lower:'0',upper:'2',lowerClosed:true,upperClosed:true}});
    assert.equal(task.checkLine('D=(0;2]')?.proof,true);
    assert.equal(task.checkLine('D=[0;2]\\setminus\\{0\\}')?.proof,true);
    assert.equal(task.checkLine('D=(0;2]\\setminus\\{-1\\}')?.proof,true);
    assert.equal(task.checkLine('D=[0;2]')?.proof,false);
    assert.equal(task.checkLine('D=(0;2)')?.proof,false);
    assert.equal(task.checkLine('D=(0;2]\\setminus\\{1\\}')?.proof,false);
});


test('zero trigonometric amplitude cannot erase an undefined argument domain', () => {
    const env=createCurveEnvironment('f(x)=0*sin(x^0)+3',{task:'periodicity'},Algebrite)!;
    assert.ok(env);
    assert.equal(buildCurvePropertyTask(env),null);
    assert.equal(model('f(x)=0*sin(x)+3',{task:'periodicity'}).checkLine('konstant')?.proof,true);
});
test('review regressions hold through the public complete-path grader', () => {
    const grade=(prompt:string,answer:string[],context:CalculationContext)=>validateCalculationPathSubmission(prompt,[prompt,...answer],{runtime:Algebrite,calculationContext:context});
    const intersections:CalculationContext={task:'intersections',secondFunction:'x+2'};
    assert.equal(grade('f(x)=x^2',['S_1=(-1|1)','S_1=(2|4)'],intersections).accepted,false);
    assert.equal(grade('f(x)=x^2',['S_1=(-1|1)','S_2=(2|4)'],intersections).accepted,true);
    assert.equal(grade('f(x)=x^2',['S_1=(-1|1)','S_2=(-1|1)'],intersections).accepted,false);
    assert.equal(grade('f(x)=x^2-1',['S_y=\\{(-1|0);(1|0);(0|-1)\\}'],{task:'intercepts'}).accepted,false);
    assert.equal(grade('f(x)=x^2-1',['S_x=\\{(-1|0);(1|0)\\}','S_y=(0|-1)'],{task:'intercepts'}).accepted,true);
    assert.equal(grade('f(x)=x^2-1',['N(0|-1)','S=\\{(-1|0);(1|0);(0|-1)\\}'],{task:'intercepts'}).accepted,false);
    assert.equal(grade('f(x)=3',['T=2'],{task:'periodicity'}).outcome,'incomplete');
    assert.equal(grade('f(x)=3',['T=2','keine Grundperiode'],{task:'periodicity'}).accepted,true);
    assert.equal(grade('f(x)=0*sin(x^0)+3',['Jede positive Zahl ist eine Periode'],{task:'periodicity'}).accepted,false);
    assert.equal(grade('f(x)=1/x',['D=(0;2]'],{task:'domain',interval:{lower:'0',upper:'2',lowerClosed:true,upperClosed:true}}).accepted,true);
});


test('two empty axis groups jointly establish the absence of any axis intercept', () => {
    const task=model('f(x)=1/x',{task:'intercepts'});
    const first=task.checkLine('S_x=\\varnothing'), second=task.checkLine('S_y=\\varnothing');
    assert.equal(first?.proof,true);
    assert.equal(second?.proof,true);
    const combined=new Set([...(first?.targets||[]),...(second?.targets||[])]);
    assert.ok(task.required.every(target=>combined.has(target)));
    assert.ok(task.required.some(target=>!(first?.targets||[]).includes(target)));
    const context:CalculationContext={task:'intercepts'};
    assert.equal(validateCalculationPathSubmission('f(x)=1/x',['f(x)=1/x','S_x=\\varnothing','S_y=\\varnothing'],{runtime:Algebrite,calculationContext:context}).accepted,true);
});
