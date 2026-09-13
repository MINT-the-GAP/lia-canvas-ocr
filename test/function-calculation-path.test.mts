import assert from 'node:assert/strict';
import test from 'node:test';
import Algebrite from 'algebrite';
import { validateCalculationPathSubmission, iterateCalculationPathChecks } from '../src/math/calculation-path.ts';
import { generateContextualExpectedCalculation } from '../src/math/function-calculation-path.ts';
import { parseCalculationOptions } from '../src/lia/calculation-options.ts';
import type { TransitionValidationOptions } from '../src/math/equivalence.ts';
(globalThis as any).Algebrite = Algebrite;
const tex=(s:string)=>s.replace(/§/gu,String.fromCharCode(92));
const period: TransitionValidationOptions = { calculationContext: { interval: { lower: '0', upper: '2*pi', lowerClosed: true, upperClosed: false } } };
const cases: Array<[string,string,TransitionValidationOptions?]> = [
    ['§sin(x)=§frac{1}{2}','L=§{§frac{§pi}{6};§frac{5§pi}{6}§}',period],
    ['§sin(x)=§frac{1}{2}','x=§frac{§pi}{6}+2k§pi§lor x=§frac{5§pi}{6}+2k§pi,§quad k§in§mathbb{Z}'],
    ['§cos(2x)=0','L=§{§frac{§pi}{4};§frac{3§pi}{4};§frac{5§pi}{4};§frac{7§pi}{4}§}',period],
    ['§tan(x)=1','x=§frac{§pi}{4}+k§pi,§quad k§in§mathbb{Z}'],
    ['§cos(x)(2§sin(x)-1)=0','L=§{§frac{§pi}{6};§frac{§pi}{2};§frac{5§pi}{6};§frac{3§pi}{2}§}',period],
    ['§sin(x)=§frac{1}{2}','L=§{30^§circ;150^§circ§}',{ calculationContext: { angleUnit:'deg',interval:{lower:'0',upper:'360',lowerClosed:true,upperClosed:false} } }],
    ['§cos(x)=2','L=§varnothing'],
    ['§sin(x)=0','L=§{0;§pi§}',period],
    ['§sin(x)=0','L=§{0;§pi;2§pi§}',{ calculationContext: { interval:{lower:'0',upper:'2*pi',lowerClosed:true,upperClosed:true} } }],
    ['2^{x+1}=16','x=3'],
    ['2^x=3','x=§frac{§ln(3)}{§ln(2)}'],
    ['e^{2x}-3e^x+2=0','L=§{0;§ln(2)§}'],
    ['e^{2x}+e^x-2=0','L=§{0§}'],
    ['e^x=-1','L=§varnothing'],
    ['§ln(x-1)=0','x=2'],
    ['§log_{10}(x)=2','x=100'],
    ['§log_2(x-1)=3','x=9'],
    ['§ln(x-1)+§ln(x+1)=§ln(8)','x=3'],
    ['§ln(x^2)=0','L=§{-1;1§}'],
];
test('public path validates required function results, review and generated resolutions', async t => {
    for (const [rawPrompt, rawTarget, options = {}] of cases) await t.test(rawPrompt+JSON.stringify(options),()=>{
        const prompt=tex(rawPrompt),target=tex(rawTarget);
        const grade=validateCalculationPathSubmission(prompt,[prompt,target],options);
        assert.equal(grade.accepted,true,JSON.stringify(grade));
        assert.ok([...iterateCalculationPathChecks([prompt,target],prompt,options)].every(check=>check.status==='valid'));
        const generated=generateContextualExpectedCalculation(prompt,options);
        assert.ok(generated,'missing expected calculation for '+prompt);
        assert.equal(validateCalculationPathSubmission(prompt,generated!,options).accepted,true,JSON.stringify(generated));
    });
});
test('keeps logarithm domain while admitting polynomial candidates in the main calculation',()=>{
    const prompt=tex('§ln(x-1)+§ln(x+1)=§ln(8)');
    const lines=[prompt,tex('§ln(x^2-1)=§ln(8)'),'x^2-1=8','x^2=9','x=3'];
    assert.equal(validateCalculationPathSubmission(prompt,lines).accepted,true,JSON.stringify(validateCalculationPathSubmission(prompt,lines)));
    for(const answer of ['x=-3',tex('L=§{-3;3§}')]) assert.equal(validateCalculationPathSubmission(prompt,[...lines.slice(0,-1),answer]).accepted,false);
});
test('compares exponential pathways and combines branch results',()=>{
    const prompt='e^{2x}-3e^x+2=0';
    const lines=[prompt,tex('§text{Substitution:}t=e^x'),'t^2-3t+2=0','(t-1)(t-2)=0',tex('t=1§lor t=2'),'t=1','x=0','t=2',tex('x=§ln(2)'),tex('L=§{0;§ln(2)§}')];
    assert.equal(validateCalculationPathSubmission(prompt,lines).accepted,true,JSON.stringify(validateCalculationPathSubmission(prompt,lines)));
});
test('rejects missing branches, range violations, lost logarithm roots and wrong intermediates',()=>{
    const negative: Array<[string,string[],TransitionValidationOptions?]> = [
        ['§sin(x)=§frac{1}{2}',['§sin(x)=§frac{1}{2}','x=§frac{§pi}{6}'],period],
        ['§cos(x)(2§sin(x)-1)=0',['§cos(x)(2§sin(x)-1)=0','2§sin(x)-1=0','L=§{§frac{§pi}{6};§frac{§pi}{2};§frac{5§pi}{6};§frac{3§pi}{2}§}'],period],
        ['§ln(x^2)=0',['§ln(x^2)=0','2§ln(x)=0','x=1','L=§{-1;1§}']],
        ['e^x=2',['e^x=2','e^x=3','x=§ln(2)']],
        ['e^{2x}+e^x-2=0',['e^{2x}+e^x-2=0','L=§{0;§ln(-2)§}']],
        ['2^x=3',['2^x=3§mid +1','x=§frac{§ln(3)}{§ln(2)}']],
    ];
    for(const [prompt,lines,options] of negative) assert.equal(validateCalculationPathSubmission(tex(prompt),lines.map(tex),options).accepted,false,JSON.stringify({prompt,lines}));
});
test('author options retain legacy booleans and add exact intervals and task intention',()=>{
    const options=parseCalculationOptions('zeilenrueckmeldung=1;intervall=[0,2*pi);winkelmass=rad');
    assert.equal(options.valid,true);
    assert.deepEqual(options.calculationContext,{...period.calculationContext,angleUnit:'rad'});
    assert.equal(parseCalculationOptions('intervall=[0,2*pi);interval=[0,pi]').valid,false);
    assert.equal(parseCalculationOptions('angle=turns').valid,false);
    const prompt='f(x)=3x^3-4x^2-2x';
    const target=tex('L=§{0;§frac{2+§sqrt{10}}{3};§frac{2-§sqrt{10}}{3}§}');
    const config:TransitionValidationOptions={calculationContext:{task:'zeros'}};
    assert.equal(validateCalculationPathSubmission(prompt,['3x^3-4x^2-2x=0',target],config).accepted,true);
    assert.equal(validateCalculationPathSubmission(prompt,[prompt,target]).accepted,false);
    const generated=generateContextualExpectedCalculation(prompt,config);
    assert.ok(generated);
    assert.equal(validateCalculationPathSubmission(prompt,generated!,config).accepted,true);
});
test('refuses unsupported mixed equations, malformed constants and resource bombs',()=>{
    for(const [prompt,answer] of [
        ['x+sin(x)=1','x=0'],
        ['e^x=2','x=2^(2^100000)'],
        ['e^x=2','x=ln(-2)'],
        ['ln(x)=0','x=1/0'],
    ]) assert.equal(validateCalculationPathSubmission(prompt,[prompt,answer]).accepted,false);
});


test('does not ignore operations attached to annotations, definitions or auxiliary calculations',()=>{
    const paths=[
        ['e^x=1','x=0','§text{Nebenrechnung:}1=1§mid+1'],
        ['§ln(x-1)=0','x>1§mid+1','x=2'],
        ['e^x=1','§text{Substitution:}u=e^x§mid+1','u=1','x=0'],
        ['e^x=1','§text{Substitution:}u=e^x-3>0','x=0'],
    ];
    for(const path of paths) {
        const lines=path.map(tex);
        assert.equal(validateCalculationPathSubmission(lines[0],lines).accepted,false,JSON.stringify(lines));
    }
});
test('retains intervals on other supported functions and classifies principal trig values as incomplete',()=>{
    const options:TransitionValidationOptions={calculationContext:{interval:{lower:'0',upper:'1',lowerClosed:true,upperClosed:true}}};
    const prompt=tex('§ln(x)=§ln(3)');
    assert.equal(validateCalculationPathSubmission(prompt,[prompt,'x=3'],options).accepted,false);
    assert.equal(validateCalculationPathSubmission(prompt,[prompt,tex('L=§varnothing')],options).accepted,true);
    const trig=tex('§sin(x)=§frac{1}{2}');
    const grade=validateCalculationPathSubmission(trig,[trig,tex('x=§arcsin(§frac{1}{2})')]);
    assert.equal(grade.accepted,false);
    assert.equal(grade.outcome,'incomplete',JSON.stringify(grade));
});
test('supports explicit domain annotations and trig substitution with independent branches',()=>{
    const exp=['e^x=2','§text{Substitution:}u=e^x>0','u>0','u=2','x=§ln(2)'].map(tex);
    assert.equal(validateCalculationPathSubmission(exp[0],exp).accepted,true,JSON.stringify(validateCalculationPathSubmission(exp[0],exp)));
    const log=['§ln(x-1)=0','x>1','x=2'].map(tex);
    assert.equal(validateCalculationPathSubmission(log[0],log).accepted,true);
    const path=['2§sin(x)^2-§sin(x)=0','§text{Substitution:}u=§sin(x)','2u^2-u=0','u(2u-1)=0','u=0§lor u=§frac{1}{2}','u=0','§sin(x)=0','x_1=0','x_2=§pi','u=§frac{1}{2}','§sin(x)=§frac{1}{2}','x_3=§frac{§pi}{6}','x_4=§frac{5§pi}{6}','L=§{0;§pi;§frac{§pi}{6};§frac{5§pi}{6}§}'].map(tex);
    const grade=validateCalculationPathSubmission(path[0],path,period);
    assert.equal(grade.accepted,true,JSON.stringify(grade));
});


test('rejects domain-changing first rows and undefined auxiliary expressions',()=>{
    const paths=[
        ['ln(x^2)=0','2ln(x)=0','L=\\{-1;1\\}'],
        ['e^x=1','e^x=1\\mid +(ln(-1)-ln(-1))','e^x=1','x=0'],
        ['e^x=1','\\text{Nebenrechnung:}ln(-1)=ln(-1)','x=0'],
        ['e^x=1','\\text{Nebenrechnung:}1/0=1/0','x=0'],
        ['e^x=1','\\text{Substitution:}u=1/x','x=0'],
        ['e^x=1','\\text{Substitution:}u=e^x+sqrt(-1)','x=0'],
        ['e^x=1','\\text{Substitution:}e=e^x','x=0'],
        ['e^x=1','\\text{Substitution:}i=e^x','x=0'],
    ];
    for(const [prompt,...lines] of paths) {
        const actual=lines[0]==='2ln(x)=0'?lines:[prompt,...lines];
        assert.equal(validateCalculationPathSubmission(prompt,actual).accepted,false,JSON.stringify({prompt,actual}));
    }
});
test('accepts a recognized method caption before the initial function equation',()=>{
    const prompt='e^{2x}-3e^x+2=0';
    const lines=['\\text{Substitution}',prompt,'L=\\{0;\\ln(2)\\}'];
    assert.equal(validateCalculationPathSubmission(prompt,lines).accepted,true,JSON.stringify(validateCalculationPathSubmission(prompt,lines)));
});

test('rejects malformed public calculation contexts without throwing or dropping conditions',()=>{
    for(const context of [
        {angleUnit:'turns'}, {task:'guess'}, {interval:{lower:0,upper:'2*pi',lowerClosed:true,upperClosed:false}},
        {interval:{lower:'0',upper:'2*pi',lowerClosed:'true',upperClosed:false}},
    ]) {
        const options={calculationContext:context} as unknown as TransitionValidationOptions;
        assert.equal(validateCalculationPathSubmission('sin(x)=0',['sin(x)=0','L=\\{0;\\pi\\}'],options).accepted,false);
        assert.equal(generateContextualExpectedCalculation('sin(x)=0',options),null);
    }
    assert.equal(generateContextualExpectedCalculation('3x=6',{runtime:null}),null);
});

test('keeps a wrong intermediate while judging later transformations locally',()=>{
    const prompt='e^x=2';
    const grade=validateCalculationPathSubmission(prompt,[prompt,'e^x=3','x=\\ln(3)']);
    assert.equal(grade.accepted,false);
    assert.equal(grade.outcome,'incorrect');
    assert.equal(grade.transitionChecks[0].status,'invalid');
    assert.equal(grade.transitionChecks[1].status,'valid',JSON.stringify(grade));
    const unrelated=validateCalculationPathSubmission(prompt,[prompt,'e^x=3','x=\\ln(2)']);
    assert.equal(unrelated.accepted,false);
    assert.equal(unrelated.transitionChecks[1].status,'invalid',JSON.stringify(unrelated));
});
