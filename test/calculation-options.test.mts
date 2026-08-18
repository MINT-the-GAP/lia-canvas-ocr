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
