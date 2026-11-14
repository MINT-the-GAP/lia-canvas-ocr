import assert from 'node:assert/strict';
import test from 'node:test';
import { getRootWindow } from '../src/root-window.ts';

test('root-window lookup stays local when the parent is cross-origin', () => {
  const local = {} as Window;
  const foreignParent = {} as Window;
  Object.defineProperty(local, 'parent', { value: foreignParent });
  Object.defineProperty(foreignParent, 'document', {
    get() {
      const error = new Error('Blocked by the same-origin policy');
      error.name = 'SecurityError';
      throw error;
    }
  });

  assert.equal(getRootWindow(local), local);
});

test('root-window lookup reaches a readable same-origin ancestor', () => {
  const parent = { document: {} } as Window;
  Object.defineProperty(parent, 'parent', { value: parent });
  const local = { parent } as Window;

  assert.equal(getRootWindow(local), parent);
});
