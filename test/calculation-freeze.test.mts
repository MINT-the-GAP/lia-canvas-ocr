import assert from 'node:assert/strict';
import test from 'node:test';

import {
  CALCULATION_REVIEW_FREEZE_VERSION,
  MAX_CALCULATION_REVIEW_FREEZE_CHARACTERS,
  MAX_CALCULATION_REVIEW_FREEZE_LINES,
  sanitizeCalculationReviewFreezeState,
} from '../src/canvas/calculation-freeze.ts';

const readyReview = {
  v: CALCULATION_REVIEW_FREEZE_VERSION,
  lines: [
    String.raw`3x-5=7 \mid +5`,
    String.raw`3x=12 \mid :3`,
    'x=4',
  ],
  state: 'ready',
  checks: [
    {
      status: 'valid',
      reason: 'operation-applied-both-sides',
      side: 'both',
    },
    {
      status: 'valid',
      reason: 'equivalent-linear-equations',
    },
  ],
} as const;

test('sanitizes ready, running, and stale calculation reviews', () => {
  const ready = sanitizeCalculationReviewFreezeState(readyReview);
  assert.deepEqual(ready, readyReview);
  assert.notStrictEqual(ready, readyReview);
  assert.notStrictEqual(ready?.lines, readyReview.lines);
  assert.notStrictEqual(ready?.checks, readyReview.checks);

  assert.deepEqual(
    sanitizeCalculationReviewFreezeState({
      v: CALCULATION_REVIEW_FREEZE_VERSION,
      lines: [' x=1 ', 'x=1'],
      state: 'running',
      checks: [],
    }),
    {
      v: CALCULATION_REVIEW_FREEZE_VERSION,
      lines: ['x=1', 'x=1'],
      state: 'running',
      checks: [],
    },
  );

  assert.deepEqual(
    sanitizeCalculationReviewFreezeState({ ...readyReview, stale: 1 }),
    { ...readyReview, stale: 1 },
  );
});

test('rejects invalid calculation review versions, states, checks, reasons, and sides', () => {
  const invalid = [
    { ...readyReview, v: 'cr2' },
    { ...readyReview, state: 'done' },
    { ...readyReview, stale: 0 },
    { ...readyReview, checks: readyReview.checks.slice(0, 1) },
    {
      ...readyReview,
      checks: [{ ...readyReview.checks[0], status: 'correct' }, readyReview.checks[1]],
    },
    {
      ...readyReview,
      checks: [{ ...readyReview.checks[0], reason: 'invented-reason' }, readyReview.checks[1]],
    },
    {
      ...readyReview,
      checks: [{ ...readyReview.checks[0], side: 'middle' }, readyReview.checks[1]],
    },
    { ...readyReview, lines: ['x=1', 'bad\nline', 'x=1'] },
  ];

  for (const candidate of invalid) {
    assert.equal(sanitizeCalculationReviewFreezeState(candidate), null);
  }
});

test('enforces calculation review line and serialized-size limits', () => {
  assert.equal(
    sanitizeCalculationReviewFreezeState({
      v: CALCULATION_REVIEW_FREEZE_VERSION,
      lines: Array.from(
        { length: MAX_CALCULATION_REVIEW_FREEZE_LINES + 1 },
        (_, index) => `x=${index}`,
      ),
      state: 'running',
      checks: [],
    }),
    null,
  );

  assert.equal(
    sanitizeCalculationReviewFreezeState({
      v: CALCULATION_REVIEW_FREEZE_VERSION,
      lines: ['x'.repeat(MAX_CALCULATION_REVIEW_FREEZE_CHARACTERS + 1)],
      state: 'ready',
      checks: [],
    }),
    null,
  );
});
