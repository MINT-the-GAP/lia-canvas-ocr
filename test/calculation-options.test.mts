import assert from 'node:assert/strict';
import test from 'node:test';

import {
  isLineFeedbackEnabledForPair,
  parseCalculationOptions,
} from '../src/lia/calculation-options.ts';

test('enables row-transition feedback for parameterless calls', () => {
  for (const source of [
    undefined,
    null,
    '',
    '   ',
    '@0',
    '  @0  ',
    '@1',
  ]) {
    assert.deepEqual(parseCalculationOptions(source), {
      lineFeedback: true,
      valid: true,
    });
  }
});

test('parses positional boolean shortcuts', () => {
  for (const source of ['1', 'true', ' TRUE ']) {
    assert.deepEqual(parseCalculationOptions(source), {
      lineFeedback: true,
      valid: true,
    });
  }

  for (const source of ['0', 'false', ' FALSE ']) {
    assert.deepEqual(parseCalculationOptions(source), {
      lineFeedback: false,
      valid: true,
    });
  }
});

test('parses the authored Zeilenrückmeldung switch', () => {
  for (const source of [
    'Zeilenrückmeldung=1',
    '  Zeilenrückmeldung = 1  ',
    'ZEILENRÜCKMELDUNG=true',
    'Zeilenrueckmeldung=TRUE',
  ]) {
    assert.deepEqual(parseCalculationOptions(source), {
      lineFeedback: true,
      valid: true,
    });
  }

  for (const source of [
    'Zeilenrückmeldung=0',
    'Zeilenrückmeldung=false',
    'Zeilenrueckmeldung=FALSE',
  ]) {
    assert.deepEqual(parseCalculationOptions(source), {
      lineFeedback: false,
      valid: true,
    });
  }
});

test('rejects malformed, unknown, duplicate, and substring options safely', () => {
  const invalidCases = [
    ['Zeilenrückmeldung', 'malformed-option'],
    ['Zeilenrückmeldung=', 'malformed-option'],
    ['Zeilenrückmeldung=1=0', 'malformed-option'],
    ['fooZeilenrückmeldung=1', 'unknown-option'],
    ['Unbekannt=1', 'unknown-option'],
    ['Zeilenrückmeldung=10', 'invalid-boolean'],
    ['Zeilenrückmeldung=ja', 'invalid-boolean'],
    ['Zeilenrückmeldung=1;Zeilenrückmeldung=0', 'duplicate-option'],
    ['Zeilenrückmeldung=1;', 'empty-option'],
    [';Zeilenrückmeldung=1', 'empty-option'],
  ] as const;

  for (const [source, error] of invalidCases) {
    assert.deepEqual(parseCalculationOptions(source), {
      lineFeedback: false,
      valid: false,
      error,
    });
  }
});

function pairWith(attributes: Readonly<Record<string, string>>): Element {
  return {
    getAttribute(name: string): string | null {
      return Object.prototype.hasOwnProperty.call(attributes, name)
        ? attributes[name]
        : null;
    },
  } as Element;
}

test('reads a normalized line-feedback flag before the authored option', () => {
  assert.equal(isLineFeedbackEnabledForPair(pairWith({
    'data-line-feedback': '1',
    'data-calculation-options': '0',
  })), true);
  assert.equal(isLineFeedbackEnabledForPair(pairWith({
    'data-line-feedback': '0',
    'data-calculation-options': '1',
  })), false);
  assert.equal(isLineFeedbackEnabledForPair(pairWith({
    'data-line-feedback': 'not-a-boolean',
    'data-calculation-options': '1',
  })), false);
});

test('applies the BerechneOCR default and positional switch to answer pairs', () => {
  const answerPair = (raw?: string): Element => pairWith({
    'data-canvas-mode': 'plus',
    'data-canvas-output': 'answer',
    ...(raw === undefined ? {} : { 'data-calculation-options': raw }),
  });

  assert.equal(isLineFeedbackEnabledForPair(answerPair()), true);
  assert.equal(isLineFeedbackEnabledForPair(answerPair('')), true);
  assert.equal(isLineFeedbackEnabledForPair(answerPair('@0')), true);
  assert.equal(isLineFeedbackEnabledForPair(answerPair('1')), true);
  assert.equal(isLineFeedbackEnabledForPair(answerPair('0')), false);
  assert.equal(isLineFeedbackEnabledForPair(answerPair('Unbekannt=1')), false);
});

test('does not infer line feedback for classic canvas pairs', () => {
  assert.equal(isLineFeedbackEnabledForPair(pairWith({})), false);
  assert.equal(isLineFeedbackEnabledForPair(pairWith({
    'data-calculation-options': '1',
  })), false);
  assert.equal(isLineFeedbackEnabledForPair(pairWith({
    'data-canvas-output': 'answer',
    'data-calculation-options': '1',
  })), false);
});

import {
  CALCULATION_TASK_NAMES,
  DEFAULT_CURVE_TASK_PARTS,
  calculationContextError,
  isCalculationContextValid,
  parseCalculationTask,
  type CalculationContext,
} from '../src/math/calculation-context.ts';

test('maps all published curve tasks and German umlaut aliases', () => {
  assert.equal(Object.keys(CALCULATION_TASK_NAMES).length, 26);
  for (const [canonical, authored] of Object.entries(CALCULATION_TASK_NAMES)) {
    assert.equal(parseCalculationTask(canonical), canonical);
    assert.equal(parseCalculationTask(authored), canonical);
  }
  for (const [authored, task] of [
    ['Periodizität', 'periodicity'], ['Definitionslücken', 'discontinuities'],
    ['Krümmung', 'curvature'], ['Flächeninhalt', 'area'], ['Steigung', 'derivative-value'],
  ]) assert.equal(parseCalculationTask(authored), task);
  assert.equal(parseCalculationTask('constructor'), null);
});

test('parses every task with its required author data', () => {
  const required: Record<string, string> = {
    tangent: ';stelle=2', normal: ';stelle=2', 'derivative-value': ';stelle=pi/2',
    limit: ';stelle=+infty', integral: ';von=0;bis=2', area: ';von=-1;bis=1',
    intersections: ';zweitefunktion=g(x)=x+1',
  };
  for (const [canonical, authored] of Object.entries(CALCULATION_TASK_NAMES)) {
    const parsed = parseCalculationOptions('aufgabe=' + authored + (required[canonical] ?? ''));
    assert.equal(parsed.valid, true, authored + ': ' + parsed.message);
    assert.equal(parsed.calculationContext?.task, canonical);
  }
});

test('retains second-function definitions and rejects hidden option aliases', () => {
  assert.deepEqual(parseCalculationOptions(
    'aufgabe=schnittpunkte;zweitefunktion=g(x)=x^2+1;intervall=[-2,2]'
  ).calculationContext, {
    task: 'intersections',
    secondFunction: 'g(x)=x^2+1',
    interval: { lower: '-2', upper: '2', lowerClosed: true, upperClosed: true },
  });
  assert.equal(parseCalculationOptions('aufgabe=schnittpunkte;zweitefunktion=g(x)=x=2').valid, false);
  for (const source of [
    'aufgabe=tangente;stelle=1;point=2',
    'aufgabe=ableitung;ordnung=1;order=2',
    'aufgabe=integral;von=0;lower=1;bis=2',
    'aufgabe=integral;von=0;bis=2;upper=3',
    'aufgabe=schnittpunkte;zweitefunktion=x;secondFunction=x^2',
    'aufgabe=grenzwert;stelle=0;seite=links;side=right',
    'aufgabe=extremstellen;art=lokal;scope=local',
    'aufgabe=stammfunktion;familie=1;family=0',
    'aufgabe=kurvendiskussion;teile=nullstellen;parts=domain',
  ]) {
    assert.equal(parseCalculationOptions(source).error, 'duplicate-option', source);
  }
  assert.equal(parseCalculationOptions('constructor=1').error, 'unknown-option');
});

test('parses derivative, limit, primitive family and curve-part settings', () => {
  assert.deepEqual(parseCalculationOptions('aufgabe=ableitungswert;stelle=pi/2;ordnung=3').calculationContext,
    { task: 'derivative-value', point: 'pi/2', order: 3 });
  assert.deepEqual(parseCalculationOptions('aufgabe=grenzwert;stelle=0;seite=rechts').calculationContext,
    { task: 'limit', point: '0', side: 'right' });
  assert.deepEqual(parseCalculationOptions('aufgabe=stammfunktion;familie=1').calculationContext,
    { task: 'antiderivative', family: true });
  assert.deepEqual(parseCalculationOptions(
    'aufgabe=kurvendiskussion;teile=definitionsbereich,extrempunkte,wendepunkte;art=global;intervall=[-2,2]'
  ).calculationContext, {
    task: 'curve', parts: ['domain', 'extrema-points', 'inflection-points'], scope: 'global',
    interval: { lower: '-2', upper: '2', lowerClosed: true, upperClosed: true },
  });
  assert.deepEqual(DEFAULT_CURVE_TASK_PARTS,
    ['domain', 'zeros', 'extrema-points', 'inflection-points', 'monotonicity', 'curvature']);
});

test('reports missing, irrelevant and invalid curve author data', () => {
  for (const source of [
    'aufgabe=tangente', 'aufgabe=normale', 'aufgabe=ableitungswert', 'aufgabe=grenzwert',
    'aufgabe=integral', 'aufgabe=integral;von=0', 'aufgabe=flaecheninhalt;bis=1',
    'aufgabe=schnittpunkte', 'aufgabe=extrempunkte;art=global',
    'aufgabe=ableitung;stelle=1', 'aufgabe=tangente;stelle=1;ordnung=2',
    'aufgabe=nullstellen;von=0;bis=1', 'aufgabe=integral;von=0;bis=1;zweitefunktion=x',
    'aufgabe=ableitung;seite=links', 'aufgabe=extrempunkte;familie=1',
    'aufgabe=wendepunkte;art=lokal', 'aufgabe=gleichung;teile=nullstellen',
    'aufgabe=ableitung;ordnung=0', 'aufgabe=ableitung;ordnung=5',
    'aufgabe=ableitung;ordnung=1.5', 'aufgabe=kurvendiskussion;teile=nullstellen,zeros',
    'aufgabe=kurvendiskussion;teile=tangente', 'aufgabe=kurvendiskussion;teile=nullstellen,',
    'aufgabe=kurvendiskussion;teile=nullstellen;art=lokal',
    'aufgabe=grenzwert;stelle=0;seite=oben',
    'aufgabe=tangente;stelle=infty', 'aufgabe=normale;stelle=\\infty',
    'aufgabe=tangente;stelle=<script>', 'aufgabe=tangente;stelle=' + '1'.repeat(65),
    'aufgabe=schnittpunkte;zweitefunktion=' + 'x'.repeat(513),
    'aufgabe=grenzwert;stelle=0' + ' '.repeat(2048) + ';seite=links',
  ]) {
    const parsed = parseCalculationOptions(source);
    assert.equal(parsed.valid, false, source);
    assert.equal(parsed.error, 'invalid-context', source);
    assert.equal(typeof parsed.message, 'string', source);
  }
});

test('validates JavaScript contexts with the same task and option contract', () => {
  const invalidContexts: unknown[] = [
    null, [], false, { task: 'invalid' }, { task: 'constructor' }, { unknown: 1 },
    { task: 'tangent' }, { task: 'derivative', point: '2' }, { task: 'derivative', order: NaN },
    { task: 'normal', point: '2', order: 1 }, { task: 'limit', point: '0', side: 'up' },
    { task: 'antiderivative', family: 'true' }, { task: 'intersections', secondFunction: 'f(x)=x=1' },
    { task: 'integral', lower: '0' }, { task: 'extrema', scope: 'global' },
    { task: 'curve', parts: [] }, { task: 'curve', parts: ['zeros', 'zeros'] },
    { task: 'curve', parts: ['tangent'] }, { task: 'curve', parts: 'zeros' },
    { interval: { lower: '0', upper: '1', lowerClosed: true, upperClosed: false, ignored: true } },
    { interval: { lower: '<img>', upper: '1', lowerClosed: true, upperClosed: false } },
  ];
  for (const context of invalidContexts) {
    assert.equal(isCalculationContextValid(context as CalculationContext), false, JSON.stringify(context));
    assert.equal(typeof calculationContextError(context as CalculationContext), 'string');
  }
  for (const context of [
    undefined, {}, { task: 'derivative', order: 4 }, { task: 'tangent', point: '\\frac{1}{2}' },
    { task: 'limit', point: '-infty', side: 'left' },
    { task: 'integral', lower: '0', upper: 'pi/2' }, { task: 'curve' },
  ]) assert.equal(calculationContextError(context as CalculationContext), null);
});


test('requires a complete function definition when the second function contains equals', () => {
  for (const source of ['x=2', '=x', '2=x', 'g(x)=', 'g(x)=   ', 'g(x,y)=x', 'g=x+1']) {
    const authored = parseCalculationOptions('aufgabe=schnittpunkte;zweitefunktion=' + source);
    assert.equal(authored.valid, false, source);
    assert.equal(authored.error, 'invalid-context', source);
    assert.equal(isCalculationContextValid({ task: 'intersections', secondFunction: source }), false, source);
  }
  for (const source of ['x+1', '0', 'g(x)=x+1', ' g ( x ) = x+1 ']) {
    assert.equal(parseCalculationOptions('aufgabe=schnittpunkte;zweitefunktion=' + source).valid, true, source);
    assert.equal(isCalculationContextValid({ task: 'intersections', secondFunction: source }), true, source);
  }
});

test('rejects omitted curve parts and non-enumerable unknown API fields', () => {
  const sparse: NonNullable<CalculationContext['parts']> = new Array(2);
  sparse[1] = 'zeros';
  assert.equal(isCalculationContextValid({ task: 'curve', parts: sparse }), false);
  assert.equal(isCalculationContextValid({ task: 'curve', parts: new Array(1) }), false);

  const hiddenContext = Object.defineProperty({ task: 'derivative' }, 'typo', { value: 1 });
  const symbolContext = { task: 'derivative', [Symbol('unknown')]: true };
  const hiddenInterval = Object.defineProperty(
    { lower: '0', upper: '1', lowerClosed: true, upperClosed: true },
    'typo', { value: 1 },
  );
  assert.equal(isCalculationContextValid(hiddenContext as CalculationContext), false);
  assert.equal(isCalculationContextValid(symbolContext as CalculationContext), false);
  assert.equal(isCalculationContextValid({ task: 'curve', interval: hiddenInterval }), false);
});

test('accepts infinity aliases only for limit points', () => {
  for (const point of ['inf', '-inf', '+infty', '\\infty', 'Infinity', '-∞']) {
    for (const task of ['tangente', 'normale', 'ableitungswert']) {
      assert.equal(parseCalculationOptions('aufgabe=' + task + ';stelle=' + point).valid, false, task + ': ' + point);
    }
    assert.equal(parseCalculationOptions('aufgabe=grenzwert;stelle=' + point).valid, true, point);
  }
});
