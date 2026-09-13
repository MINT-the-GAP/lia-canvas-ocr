import assert from 'node:assert/strict';
import test from 'node:test';
import Algebrite from 'algebrite';
import { validateCalculationPathSubmission } from '../src/math/calculation-path.ts';
import { generateExpectedCalculation } from '../src/math/expected-calculation.ts';
import { isCalculationProofInputBounded } from '../src/math/calculation-proof-budget.ts';
(globalThis as any).Algebrite = Algebrite;
const cubic = '3x^3-4x^2-2x=0';
const full = String.raw`L=\{0;(2+\sqrt{10})/3;(2-\sqrt{10})/3\}`;
function accepts(prompt: string, rows: readonly string[]) {
    const result = validateCalculationPathSubmission(prompt, rows);
    assert.equal(result.accepted, true, JSON.stringify(result));
    return result;
}
test('cubic roots are exact, distinct and complete including separate irrational candidates', () => {
    accepts(cubic, [cubic, full]);
    accepts(cubic, [cubic, 'x_1=0', String.raw`x_2=(2+\sqrt{10})/3`, String.raw`x_3=(2-\sqrt{10})/3`]);
    for (const row of [String.raw`L=\{0;(2+\sqrt{10})/3\}`, String.raw`L=\{0;(2+\sqrt{10})/3;7\}`]) {
        assert.equal(validateCalculationPathSubmission(cubic,[cubic,row]).accepted,false);
    }
});
test('null-product disjunction passes preflight, structure and grading for each documented spelling', () => {
    for (const separator of ['oder', String.raw`\lor`, String.raw`\vee`, String.raw`\text{oder}`]) {
        const disjunction = 'x=0 '+separator+' 3x^2-4x-2=0';
        assert.equal(isCalculationProofInputBounded(disjunction),true,disjunction);
        accepts(cubic,[cubic,'x(3x^2-4x-2)=0',disjunction,full]);
    }
});
test('labelled null-product branches collect their individual results', () => {
    accepts(cubic,[cubic,String.raw`x=0\lor 3x^2-4x-2=0`,'Zweig 2: 3x^2-4x-2=0',
        '(x-2/3)^2=10/9', String.raw`x_{2,3}=2/3\pm\sqrt{10}/3`]);
});
test('pq numeric parameters and an explicitly defined pq discriminant remain local', () => {
    const prompt='x^2-5x+6=0';
    accepts(prompt,[prompt,'pq-Formel:','p=-5','q=6','D=(p/2)^2-q=1/4',String.raw`x_{1,2}=-p/2\pm\sqrt{D}`]);
    accepts(prompt,[prompt,String.raw`\text{pq-Formel:}`,'p=-5; q=6',String.raw`\Delta=(p/2)^2-q=1/4`,String.raw`x_{1,2}=-p/2\pm\sqrt{\Delta}`]);
    for (const line of ['p=-4','q=7','D=(p/2)^2-q=2']) {
        assert.equal(validateCalculationPathSubmission(prompt,[prompt,'p=-5','q=6',line,String.raw`L=\{2;3\}`]).accepted,false);
    }
});
test('helper definitions cannot be silently replaced', () => {
    const prompt='x^2-5x+6=0';
    const grade=validateCalculationPathSubmission(prompt,[prompt,'D=(5/2)^2-6=1/4','D=1',String.raw`L=\{2;3\}`]);
    assert.equal(grade.outcome,'incorrect');
});
test('method captions allow skipped steps but supply no mathematical proof', () => {
    accepts('3x^2-4x-2=0',['3x^2-4x-2=0','quadratische Ergänzung: (x-2/3)^2=10/9',String.raw`x_{1,2}=2/3\pm\sqrt{10}/3`]);
    assert.equal(validateCalculationPathSubmission(cubic,[cubic,'Faktorisierung: x(3x^2-4x-3)=0',full]).accepted,false);
});
test('multiple declared operations are applied literally and in their written order', () => {
    accepts('3x-5=7',['3x-5=7 | +5; :3','x=4']);
    accepts('2(x+3)=3x-4',['2(x+3)=3x-4','x=10']);
    for (const operation of ['+5',':3; +5','+5; :0']) {
        assert.equal(validateCalculationPathSubmission('3x-5=7',['3x-5=7 | '+operation,'x=4']).accepted,false);
    }
});
test('cubic generated solution passes the same public validator', () => {
    const rows=generateExpectedCalculation(cubic);
    assert.ok(rows);
    accepts(cubic,rows);
});

test('the cubic quadratic branch accepts pq, general formula and radical factorization', () => {
    const start=[cubic,String.raw`x=0\lor 3x^2-4x-2=0`,'Fall 2: 3x^2-4x-2=0'];
    accepts(cubic,[...start,'p=-4/3','q=-2/3',String.raw`pq-Formel: x_{2,3}=-p/2\pm\sqrt{(p/2)^2-q}`]);
    accepts(cubic,[...start,String.raw`x_{2,3}=(4\pm\sqrt{16+24})/6`]);
    accepts(cubic,[...start,String.raw`(x-(2+\sqrt{10})/3)(x-(2-\sqrt{10})/3)=0`,String.raw`x_{2,3}=(2\pm\sqrt{10})/3`]);
    accepts(cubic,[...start,String.raw`Fall 2: x_2=(2+\sqrt{10})/3`,String.raw`Fall 2: x_3=(2-\sqrt{10})/3`,'Fall 1: x=0']);
});
test('declared branches and a correct final set cannot conceal an erroneous intermediate branch', () => {
    for (const wrong of ['Zweig 2: 3x^2-4x-3=0','Zweig 3: 3x^2-4x-2=0','x=0 oder 3x^2-4x-3=0']) {
        const result=validateCalculationPathSubmission(cubic,[cubic,String.raw`x=0\lor 3x^2-4x-2=0`,wrong,full]);
        assert.equal(result.accepted,false,wrong);
    }
    const duplicate=String.raw`L=\{0;(2+\sqrt{10})/3;2/3+\sqrt{10}/3\}`;
    assert.equal(validateCalculationPathSubmission(cubic,[cubic,duplicate]).accepted,false);
});
test('generated zero-factor cubics with rational roots use distinct result indices', () => {
    for (const prompt of ['x^3-5x^2+6x=0','x^3-x=0']) {
        const lines=generateExpectedCalculation(prompt);assert.ok(lines);accepts(prompt,lines);
    }
});
