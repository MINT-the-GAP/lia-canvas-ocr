import assert from 'node:assert/strict';
import test from 'node:test';
import Algebrite from 'algebrite';
import { OCR_LETTER_CASE_CORPUS as corpus, OCR_LETTER_CASE_GLYPHS as glyphs } from './fixtures/ocr-letter-case-corpus.mts';
import { OCR_PIPELINE_CORPUS } from './fixtures/ocr-pipeline-corpus.mts';
import { calculationProofTools as proof } from '../src/math/equivalence.ts';
import { validateCalculationPathSubmission } from '../src/math/calculation-path.ts';

const sample = (id: string) => { const result = corpus.find(item => item.id === id); assert.ok(result, id); return result; };
const cas = (expression: string) => String(Algebrite.run('simplify(' + expression + ')'));
const difference = (tex: string) => {
  const equation = proof.parseEquation(tex); assert.ok(equation, tex);
  return '(' + equation.left.cas + ')-(' + equation.right.cas + ')';
};
function substitute(expression: string, values: Readonly<Record<string, string>>): string {
  for (const [variable, value] of Object.entries(values)) expression = 'subst((' + value + '),' + variable + ',(' + expression + '))';
  return cas(expression);
}

test('the separate letter-case corpus is bounded and keeps task variants in the same split', () => {
  assert.equal(corpus.length, 12);
  const ids = new Set(OCR_PIPELINE_CORPUS.map(item => item.id)), splits = new Map<string, string>();
  for (const item of corpus) {
    assert.equal(ids.has(item.id), false, item.id); ids.add(item.id);
    if (splits.has(item.baseTaskId)) assert.equal(splits.get(item.baseTaskId), item.split);
    splits.set(item.baseTaskId, item.split);
    assert.equal(item.synthetic, true);
    assert.equal(item.lineWidth, 3);
    assert.ok(item.width > 0 && item.width < 900 && item.height > 0 && item.height < 650);
    assert.ok(item.expectedLines.length >= 2 && item.letterOccurrences.length > 0);
    for (const stroke of item.strokes) {
      assert.ok(stroke.length > 0);
      for (const point of stroke) {
        assert.ok(Number.isFinite(point.x) && Number.isFinite(point.y));
        assert.ok(point.x >= item.lineWidth && point.x <= item.width - item.lineWidth);
        assert.ok(point.y >= item.lineWidth && point.y <= item.height - item.lineWidth);
      }
    }
    assert.equal(item.expectedLines.some(line => line.includes(String.raw`\times`)), false);
  }
  assert.ok(corpus.some(item => item.split === 'holdout'));
  assert.ok(corpus.some(item => item.strokes.some(stroke => stroke.length === 1)));
});

test('explicit letter styles retain visible case cues in their actual shared-baseline geometry', () => {
  for (const path of glyphs.x) {
    assert.ok(path.length > 2);
    const first = path[0], last = path[path.length - 1];
    assert.ok(path.some(point => Math.abs((last[0] - first[0]) * (point[1] - first[1]) -
      (last[1] - first[1]) * (point[0] - first[0])) > .05), 'lower x must curve away from a plain diagonal');
  }
  assert.ok(glyphs.X.every(path => path.length === 2));
  for (const item of corpus.filter(item => item.distinction === 'explicit')) {
    for (const occurrence of item.letterOccurrences) {
      const points = item.strokes.slice(occurrence.strokeFrom, occurrence.strokeFrom + occurrence.strokeCount).flat();
      const top = Math.min(...points.map(point => point.y)), bottom = Math.max(...points.map(point => point.y));
      if (occurrence.letter === 'x' || occurrence.letter === 'y') assert.ok(top > occurrence.capTop + 9, item.id);
      else assert.equal(top, occurrence.capTop, item.id);
      if (occurrence.letter === 'y') assert.ok(bottom > occurrence.baseline + 10, item.id);
      else assert.ok(Math.abs(bottom - occurrence.baseline) < .001, item.id);
    }
  }
  assert.notDeepEqual(sample('case-lower-x').strokes, sample('case-upper-X').strokes);
  assert.notDeepEqual(sample('case-lower-y').strokes, sample('case-upper-Y').strokes);
});

test('Algebrite independently verifies prompt uniqueness and the deliberately false written rows', () => {
  for (const item of corpus) {
    const { values, promptEquations, falseRowIndices } = item.mathematicalWitness;
    const expressions = promptEquations.map(difference);
    for (const expression of expressions) assert.equal(substitute(expression, values), '0', item.id + ': prompt witness');
    const variables = proof.variablesIn(expressions);
    assert.ok(variables.length >= 1 && variables.length <= 2);
    const coefficients = expressions.map(expression => variables.map(variable => String(Algebrite.run('coeff(expand(' + expression + '),' + variable + ',1)'))));
    expressions.forEach((expression, index) => {
      const constant = substitute(expression, Object.fromEntries(variables.map(variable => [variable, '0'])));
      assert.equal(cas('(' + expression + ')-(' + coefficients[index].map((coefficient, column) => '(' + coefficient + ')*' + variables[column]).join('+') + '+(' + constant + '))'), '0');
    });
    const determinant = variables.length === 1 ? coefficients[0][0]
      : '(' + coefficients[0][0] + ')*(' + coefficients[1][1] + ')-(' + coefficients[0][1] + ')*(' + coefficients[1][0] + ')';
    assert.notEqual(cas(determinant), '0', item.id + ': the prompt has one unique assignment');
    item.expectedLines.forEach((line, index) => {
      const zero = substitute(difference(line), values) === '0';
      assert.equal(zero, !falseRowIndices.includes(index), item.id + ': written row ' + index);
    });
    const grade = validateCalculationPathSubmission(item.prompt, [...item.expectedLines], { runtime: Algebrite });
    assert.equal(grade.accepted, item.expectedGradeAccepted, item.id + ': ' + JSON.stringify(grade));
    if (!item.expectedGradeAccepted) assert.equal(grade.outcome, 'incorrect', item.id);
  }
});

test('correct final assignments cannot hide a changed variable in the intermediate system step', () => {
  for (const [rightId, wrongId] of [['case-mixed-xX', 'case-wrong-xX-step'], ['case-mixed-yY', 'case-wrong-yY-step']]) {
    const right = sample(rightId), wrong = sample(wrongId);
    assert.deepEqual(wrong.expectedLines.slice(-2), right.expectedLines.slice(-2));
    assert.notEqual(wrong.expectedLines[2], right.expectedLines[2]);
    assert.ok(wrong.intentionalError);
    assert.equal(wrong.expectedGradeAccepted, false);
    assert.equal(validateCalculationPathSubmission(right.prompt, right.expectedLines.map(line => line.toLowerCase()), { runtime: Algebrite }).accepted, false);
  }
});

test('identical ambiguous cross twins retain incompatible authored targets instead of merging case', () => {
  const lower = sample('case-ambiguous-lower-intent'), upper = sample('case-ambiguous-upper-intent');
  assert.deepEqual(lower.strokes, upper.strokes);
  assert.deepEqual([lower.width, lower.height, lower.lineWidth, lower.prompt], [upper.width, upper.height, upper.lineWidth, upper.prompt]);
  assert.notDeepEqual(lower.expectedLines, upper.expectedLines);
  assert.notEqual(lower.expectedGradeAccepted, upper.expectedGradeAccepted);
  assert.deepEqual(lower.ambiguity?.alternativeLines, upper.expectedLines);
  assert.deepEqual(upper.ambiguity?.alternativeLines, lower.expectedLines);
  for (const item of [lower, upper]) {
    assert.equal(item.distinction, 'ambiguous');
    assert.equal(item.ambiguity?.policy, 'no-silent-case-substitution');
    assert.equal(item.split, 'development');
    assert.ok(item.measurementGap);
  }
});
