import assert from 'node:assert/strict';
import test from 'node:test';

import {
  CANVAS_LIVE_STATE_VERSION,
  cloneCanvasLiveStateForRestore,
  exportCanvasLiveSnapshot,
  getCanvasLiveRevision,
  publishCanvasLiveEntry,
  touchCanvasLiveEntry,
  type CanvasLiveStateV1,
} from '../src/canvas/live-state.ts';

function path(tool: 'pen' | 'eraser' = 'pen') {
  return {
    kind: 'path', tool, color: '#123456', alpha: 0.75, width: 2.123456789,
    points: [{ x: -876.123456789, y: 5432.987654321 }, { x: 40.125, y: 32.875 }],
  };
}

function entry() {
  return {
    ITEMS: [path()] as any[],
    REDO: [path('eraser')] as any[],
    VIEW: { panX: -35.125, panY: 70.875, scale: 1.75, minScale: 0.25, maxScale: 8 },
    bgMode: 'grid',
    bgStep: 21.625,
    wrapW: 640.5,
    canvasH: 300.75,
    calculationReviewFreeze: {
      v: 'cr1', state: 'ready', lines: ['3x=12', 'x=4'],
      checks: [{ status: 'valid', reason: 'equivalent-linear-equations' }],
    },
    ocr: {
      editableText: '3x=12\nx=4',
      stale: true,
      writtenSubmission: { kind: 'sample', rows: [{ digits: [1, 2, 3] }] },
    },
    editorDraft: 'x=',
  };
}

function snapshot(uid: string, source: any) {
  const result = exportCanvasLiveSnapshot(uid, source);
  assert.ok(result);
  return result;
}

test('revisions are stable when read, isolated by UID, and monotonic across legacy replacement', () => {
  const firstEntry = entry();
  const secondEntry = entry();
  const revision = getCanvasLiveRevision('revision-a', firstEntry);
  assert.equal(revision, 1);
  assert.equal(getCanvasLiveRevision('revision-a', firstEntry), revision);
  assert.equal(getCanvasLiveRevision('revision-b', secondEntry), 1);
  const first = snapshot('revision-a', firstEntry);
  assert.strictEqual(snapshot('revision-a', firstEntry), first);
  assert.ok(touchCanvasLiveEntry('revision-a') > revision);
  assert.equal(getCanvasLiveRevision('revision-b', secondEntry), 1);
  const touched = snapshot('revision-a', firstEntry);
  assert.ok(touched.revision > first.revision);
  const replacement = { ...firstEntry, editorDraft: 'restored' };
  const restored = snapshot('revision-a', replacement);
  assert.ok(restored.revision > touched.revision);
  assert.equal(restored.state.editorDraft, 'restored');
  assert.ok(publishCanvasLiveEntry('revision-a', replacement) > restored.revision);
  assert.equal(exportCanvasLiveSnapshot('', firstEntry), null);
  assert.equal(exportCanvasLiveSnapshot('missing', null), null);
});

test('snapshots preserve offscreen world coordinates, erasers, selection, view, background and OCR', () => {
  const source = entry();
  source.ITEMS.push({
    kind: 'rect', x0: -999.125, y0: 8000.5, x1: -1000.875, y1: 79.25,
    alpha: 0.28, colorKey: 'accent',
  });
  const state = snapshot('full-geometry', source).state;
  assert.equal(state.v, CANVAS_LIVE_STATE_VERSION);
  assert.deepEqual(state.ITEMS, source.ITEMS);
  assert.deepEqual(state.REDO, source.REDO);
  assert.deepEqual(state.VIEW, source.VIEW);
  assert.equal(state.bgMode, source.bgMode);
  assert.equal(state.bgStep, source.bgStep);
  assert.equal(state.wrapW, source.wrapW);
  assert.equal(state.canvasH, source.canvasH);
  assert.deepEqual(state.calculationReviewFreeze, source.calculationReviewFreeze);
  assert.deepEqual(state.ocr, source.ocr);
  assert.equal(state.editorDraft, source.editorDraft);
});

test('appending and editing geometry never mutates a previously exported snapshot', () => {
  const source = entry();
  const original = snapshot('immutable', source);
  const stroke = source.ITEMS[0];
  stroke.points.push({ x: 999.123, y: -55.875 });
  touchCanvasLiveEntry('immutable');
  const appended = snapshot('immutable', source);
  const beforePath = original.state.ITEMS[0];
  const afterPath = appended.state.ITEMS[0];
  assert.equal(beforePath.kind, 'path');
  assert.equal(afterPath.kind, 'path');
  if (beforePath.kind !== 'path' || afterPath.kind !== 'path') return;
  assert.equal(beforePath.points.length, 2);
  assert.equal(afterPath.points.length, 3);
  assert.strictEqual(afterPath.points[0], beforePath.points[0]);
  assert.strictEqual(afterPath.points[1], beforePath.points[1]);
  // Editing existing coordinates uses a replacement points array.
  stroke.points = stroke.points.map((point: any) => ({ ...point, x: point.x + 10 }));
  touchCanvasLiveEntry('immutable');
  const edited = snapshot('immutable', source).state.ITEMS[0];
  assert.equal(edited.kind, 'path');
  if (edited.kind !== 'path') return;
  assert.notStrictEqual(edited.points, afterPath.points);
  assert.equal(beforePath.points[0].x, -876.123456789);
  assert.equal(afterPath.points[0].x, -876.123456789);
  assert.equal(edited.points[0].x, -866.123456789);
  assert.throws(() => { (beforePath.points[0] as any).x = 0; }, TypeError);
  assert.throws(() => { (original.state.ITEMS as any[]).push(path()); }, TypeError);
  assert.throws(() => { (original.state.ocr as any).writtenSubmission.rows[0].digits.push(9); }, TypeError);
  assert.throws(() => { (original.state.calculationReviewFreeze as any).checks[0].status = 'invalid'; }, TypeError);
});

test('pan, background and OCR revisions reuse unchanged strokes without reading old points', () => {
  const source = entry();
  const before = snapshot('sharing', source);
  for (const point of source.ITEMS[0].points) {
    Object.defineProperty(point, 'x', { get() { throw new Error('Old geometry was traversed'); } });
    Object.defineProperty(point, 'y', { get() { throw new Error('Old geometry was traversed'); } });
  }
  source.VIEW = { ...source.VIEW, panX: 120.5 };
  source.bgStep = 32;
  publishCanvasLiveEntry('sharing', source);
  const moved = snapshot('sharing', source);
  assert.strictEqual(moved.state.ITEMS, before.state.ITEMS);
  assert.strictEqual(moved.state.REDO, before.state.REDO);
  assert.strictEqual(moved.state.ocr, before.state.ocr);
  assert.strictEqual(moved.state.calculationReviewFreeze, before.state.calculationReviewFreeze);
  assert.notStrictEqual(moved.state.VIEW, before.state.VIEW);
  source.ocr = { ...source.ocr, editableText: 'new OCR' };
  publishCanvasLiveEntry('sharing', source);
  const ocr = snapshot('sharing', source);
  assert.strictEqual(ocr.state.ITEMS, before.state.ITEMS);
  assert.strictEqual(ocr.state.VIEW, moved.state.VIEW);
  assert.equal(before.state.ocr?.editableText, '3x=12\nx=4');
  assert.equal(ocr.state.ocr?.editableText, 'new OCR');
});

test('undo, redo, rectangle changes and clear preserve historical snapshots and share unchanged items', () => {
  const source = entry();
  const rect = { kind: 'rect', x0: 1, y0: 2, x1: 3, y1: 4, alpha: 0.28, colorKey: 'accent' };
  source.ITEMS.push(rect);
  const before = snapshot('history', source);
  source.REDO.push(source.ITEMS.pop());
  publishCanvasLiveEntry('history', source);
  const undone = snapshot('history', source);
  assert.strictEqual(undone.state.REDO[1], before.state.ITEMS[1]);
  source.ITEMS.push(source.REDO.pop());
  publishCanvasLiveEntry('history', source);
  const redone = snapshot('history', source);
  assert.strictEqual(redone.state.ITEMS[1], before.state.ITEMS[1]);
  rect.x1 = 900.1234;
  touchCanvasLiveEntry('history');
  const edited = snapshot('history', source);
  assert.notStrictEqual(edited.state.ITEMS[1], before.state.ITEMS[1]);
  assert.deepEqual(before.state.ITEMS[1], { ...rect, x1: 3 });
  source.ITEMS.length = 0;
  source.REDO.length = 0;
  publishCanvasLiveEntry('history', source);
  const cleared = snapshot('history', source);
  assert.deepEqual(cleared.state.ITEMS, []);
  assert.deepEqual(cleared.state.REDO, []);
  assert.equal(before.state.ITEMS.length, 2);
  assert.equal(before.state.REDO.length, 1);
});

test('live export performs neither DOM/canvas access nor JSON serialization', () => {
  const oldDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');
  const originalStringify = JSON.stringify;
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    get() { throw new Error('Live export touched the DOM/canvas'); },
  });
  JSON.stringify = () => { throw new Error('Live export serialized data'); };
  try {
    const source = entry();
    source.ITEMS = Array.from({ length: 150 }, (_, index) => ({
      ...path(),
      points: Array.from({ length: 140 }, (_, point) => ({ x: index + point / 7, y: point * 1.125 })),
    }));
    const first = snapshot('no-raster', source);
    assert.equal(first.state.ITEMS.length, 150);
    assert.strictEqual(snapshot('no-raster', source), first);
    source.ITEMS.push(path());
    touchCanvasLiveEntry('no-raster');
    const second = snapshot('no-raster', source);
    assert.equal(second.state.ITEMS.length, 151);
    assert.strictEqual(second.state.ITEMS[149], first.state.ITEMS[149]);
  } finally {
    JSON.stringify = originalStringify;
    if (oldDocument) Object.defineProperty(globalThis, 'document', oldDocument);
    else delete (globalThis as any).document;
  }
});

test('restore creates an editable deep copy of geometry, undo stack, review, OCR and draft', () => {
  const source = entry();
  const saved = snapshot('restore-copy', source).state;
  const restored = cloneCanvasLiveStateForRestore(saved);
  assert.ok(restored);
  assert.deepEqual(restored, source);
  restored.ITEMS[0].points[0].x = 0;
  restored.REDO[0].points.push({ x: 1, y: 2 });
  restored.VIEW.scale = 2;
  restored.calculationReviewFreeze.checks[0].status = 'invalid';
  restored.ocr.writtenSubmission.rows[0].digits.push(9);
  const originalPath = saved.ITEMS[0];
  assert.equal(originalPath.kind, 'path');
  if (originalPath.kind === 'path') assert.equal(originalPath.points[0].x, -876.123456789);
  assert.equal(saved.REDO[0].kind === 'path' && saved.REDO[0].points.length, 2);
  assert.equal(saved.VIEW.scale, 1.75);
  assert.equal(saved.calculationReviewFreeze?.checks[0].status, 'valid');
  assert.deepEqual(saved.ocr?.writtenSubmission?.rows, [{ digits: [1, 2, 3] }]);
});

test('restore rejects unknown versions and malformed geometry, view, dimensions, review and OCR', () => {
  const valid = snapshot('restore-invalid', entry()).state;
  const cases: unknown[] = [
    null, [], {}, { ...valid, v: 'cvl2' },
    { ...valid, wrapW: 0 }, { ...valid, canvasH: Infinity },
    { ...valid, bgStep: 0 }, { ...valid, bgMode: 'photo' },
    { ...valid, VIEW: { ...valid.VIEW, scale: 0 } },
    { ...valid, VIEW: { ...valid.VIEW, panX: NaN } },
    { ...valid, ITEMS: [{ ...path(), width: -1 }] },
    { ...valid, ITEMS: [{ ...path(), points: [{ x: Infinity, y: 1 }] }] },
    { ...valid, ITEMS: [{ kind: 'rect', x0: 0, y0: 1, x1: NaN, y1: 2, alpha: 0.28 }] },
    { ...valid, REDO: 'invalid' },
    { ...valid, calculationReviewFreeze: { v: 'cr9' } },
    { ...valid, editorDraft: 7 },
    { ...valid, ocr: { editableText: 'text', stale: 1 } },
    { ...valid, ocr: { editableText: 'text', writtenSubmission: [] } },
    { ...valid, ocr: { editableText: 'text', writtenSubmission: { invalid: undefined } } },
  ];
  const cyclic: any = {};
  cyclic.loop = cyclic;
  cases.push({ ...valid, ocr: { editableText: 'text', writtenSubmission: cyclic } });
  for (const candidate of cases) assert.equal(cloneCanvasLiveStateForRestore(candidate), null);
  const minimal: CanvasLiveStateV1 = {
    v: 'cvl1', ITEMS: [], REDO: [], VIEW: valid.VIEW, bgMode: 'none',
    bgStep: 24, wrapW: 1, canvasH: 1,
  };
  assert.ok(cloneCanvasLiveStateForRestore(minimal));
});
