import assert from 'node:assert/strict';
import test from 'node:test';
import Algebrite from 'algebrite';
import { OCR_PIPELINE_CORPUS } from './fixtures/ocr-pipeline-corpus.mts';
import { validateCalculationPathSubmission } from '../src/math/calculation-path.ts';

test('the pipeline corpus has bounded valid authored geometry and task-level split isolation', () => {
  assert.ok(OCR_PIPELINE_CORPUS.length >= 8 && OCR_PIPELINE_CORPUS.length <= 12);
  const ids = new Set<string>(), splits = new Map<string, string>();
  for (const item of OCR_PIPELINE_CORPUS) {
    assert.equal(ids.has(item.id), false); ids.add(item.id);
    assert.equal(item.synthetic, true);
    assert.ok(item.strokes.length > 0 && item.expectedLines.length >= 2);
    assert.ok(item.width > 0 && item.width < 900 && item.height > 0 && item.height < 650);
    if (splits.has(item.baseTaskId)) assert.equal(splits.get(item.baseTaskId), item.split);
    splits.set(item.baseTaskId, item.split);
    for (const stroke of item.strokes) {
      assert.ok(stroke.length > 0);
      for (const point of stroke) {
        assert.ok(Number.isFinite(point.x) && Number.isFinite(point.y));
        assert.ok(point.x >= item.lineWidth && point.x <= item.width - item.lineWidth);
        assert.ok(point.y >= item.lineWidth && point.y <= item.height - item.lineWidth);
      }
    }
  }
  assert.ok(OCR_PIPELINE_CORPUS.some(item => item.split === 'holdout'));
  assert.ok(OCR_PIPELINE_CORPUS.some(item => item.strokes.some(stroke => stroke.length === 1)));
});

test('the authored mathematical targets have independently checked native expectations', () => {
  for (const item of OCR_PIPELINE_CORPUS) {
    const grade = validateCalculationPathSubmission(item.prompt, item.expectedLines, { runtime: Algebrite });
    assert.equal(grade.accepted, item.expectedGradeAccepted, item.id + ': ' + JSON.stringify(grade));
  }
  const wrong = OCR_PIPELINE_CORPUS.find(item => item.id === 'linear-wrong-step')!;
  assert.ok(wrong.intentionalError);
  assert.equal(wrong.expectedLines[1], String.raw`3x=15 \mid :3`);
  assert.equal(wrong.expectedLines[2], 'x=4', 'the incorrect path is an exact transcription target');
});
