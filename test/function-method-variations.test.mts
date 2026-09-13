import assert from 'node:assert/strict';
import test from 'node:test';
import Algebrite from 'algebrite';
import { validateCalculationPathSubmission } from '../src/math/calculation-path.ts';
import type { TransitionValidationOptions } from '../src/math/equivalence.ts';
const T = String.raw;
const options: TransitionValidationOptions = { runtime: Algebrite };
const exp = 'e^(2x)-3e^x+2=0';
const start = [exp, T`\text{Substitution:}u=e^x`, 'u^2-3u+2=0'];
const final = T`L=\{0;\ln(2)\}`;
function accepted(prompt: string, lines: string[], extra: TransitionValidationOptions = {}) {
    const grade = validateCalculationPathSubmission(prompt, lines, { ...options, ...extra });
    assert.equal(grade.accepted, true, JSON.stringify(grade));
    return grade;
}
test('accepts pq coefficients, a discriminant and indexed auxiliary root pairs before back substitution', () => {
    accepted(exp, [...start, 'p=-3', 'q=2', T`D=\left(\frac{p}{2}\right)^2-q=\frac{1}{4}`,
        T`u_{1,2}=-\frac{p}{2}\pm\sqrt{D}`, 'u_1=2', 'u_2=1', 'e^x=1', 'x=0', 'e^x=2', T`x=\ln(2)`, final]);
    accepted(exp, [...start, T`u_{1,2}=\frac{3}{2}\pm\frac{1}{2}`, final]);
    accepted(exp, [...start, 'u_1=1', 'u_2=2', final]);
});
test('rejects incorrect auxiliary roots, coefficients, discriminants, label conflicts and unfinished operations', () => {
    for (const middle of [
        ['p=-4', 'q=2', T`u_{1,2}=\frac{3}{2}\pm\frac{1}{2}`],
        [T`D=3^2-4\cdot1\cdot2=2`],
        [T`u_{1,2}=\frac{3}{2}\pm\frac{3}{2}`],
        ['u_1=1', 'u_1=2'],
        [T`u_{1,2}=\frac{3}{2}\pm\frac{1}{2}\mid+1`],
    ]) assert.equal(validateCalculationPathSubmission(exp, [...start, ...middle, final], options).accepted, false, JSON.stringify(middle));
});
test('keeps negative exponential auxiliary roots separate from valid original roots', () => {
    const prompt = 'e^(2x)+e^x-2=0';
    const lines = [prompt, T`\text{Substitution:}u=e^x`, 'u^2+u-2=0', T`u_{1,2}=-\frac{1}{2}\pm\frac{3}{2}`];
    accepted(prompt, [...lines, 'u_1=1', 'e^x=1', 'x=0']);
    assert.equal(validateCalculationPathSubmission(prompt, [...lines, T`x=\ln(-2)`, 'x=0'], options).accepted, false);
});
test('accepts auxiliary plus-minus notation for trigonometric substitution on an authored interval', () => {
    const prompt = T`2\sin(x)^2-\sin(x)=0`;
    accepted(prompt, [prompt, T`\text{Substitution:}u=\sin(x)`, '2u^2-u=0',
        T`u_{1,2}=\frac{1}{4}\pm\frac{1}{4}`, 'u_1=1/2', 'u_2=0',
        T`L=\{0;\frac{\pi}{6};\frac{5\pi}{6};\pi\}`],
        { calculationContext: { interval: { lower: '0', upper: '2*pi', lowerClosed: true, upperClosed: false } } });
});
test('a probe verifies the substituted original sides and preserves the solved calculation', () => {
    accepted('e^x=1', ['e^x=1', 'x=0', T`\text{Probe:}e^0=1`]);
    accepted('ln(x-1)=0', ['ln(x-1)=0', 'x=2', T`\text{Probe:}\ln(2-1)=0`]);
    for (const probe of [T`\text{Probe:}2+3=5`, T`\text{Probe:}e^0=2`, T`\text{Probe:}e^0=1\mid+1`, T`\text{Probe:}\ln(-1)=\ln(-1)`]) {
        assert.equal(validateCalculationPathSubmission('e^x=1', ['e^x=1', 'x=0', probe], options).accepted, false, probe);
    }
    assert.equal(validateCalculationPathSubmission('e^x=1', ['e^x=1', 'e^x=2', 'x=0', T`\text{Probe:}e^0=1`], options).accepted, false);
});

test('degree substitutions retain authored angles through helper roots and back substitution', () => {
    const prompt = T`2\sin(x)^2-\sin(x)=0`;
    const degrees: TransitionValidationOptions = { calculationContext: { angleUnit: 'deg', interval: { lower: '0', upper: '360', lowerClosed: true, upperClosed: false } } };
    accepted(prompt, [prompt, T`\text{Substitution:}u=\sin(x)`, '2u^2-u=0', T`L=\{0;30;150;180\}`], degrees);
    accepted(prompt, [prompt, T`\text{Substitution:}u=\sin(x)`, '2u^2-u=0', T`u_{1,2}=\frac{1}{4}\pm\frac{1}{4}`, 'u_1=1/2', 'u_2=0', T`L=\{0;30;150;180\}`], degrees);
});

test('an established single auxiliary value switches the active branch for the next isolated original root', () => {
    accepted(exp, [...start, T`u_{1,2}=\frac{3}{2}\pm\frac{1}{2}`, 'u=1', 'e^x=1', 'x=0', 'u=2', T`x=\ln(2)`]);
    assert.equal(validateCalculationPathSubmission(exp, [...start, T`u_{1,2}=\frac{3}{2}\pm\frac{1}{2}`, 'u=1', T`x=\ln(2)`, final], options).accepted, false);
});
