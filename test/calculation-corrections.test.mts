import assert from 'node:assert/strict';
import test from 'node:test';
import { CalculationCorrections } from '../src/canvas/calculation-corrections.ts';

const line = (key: string, latex = 'x=1') => ({ correctionKey: key, latex });

test('a confirmed row survives new and changed neighboring ink without contaminating identical OCR', () => {
    const store = new CalculationCorrections();
    const first = line('model|ink1');
    const identical = line('model|ink2');
    store.remember([first, identical], ['x=7', 'x=1']);
    assert.deepEqual(store.apply([line('new-before'), first, identical, line('new-after')]), {
        lines: ['x=1', 'x=7', 'x=1', 'x=1'], corrected: true
    });
    assert.equal(store.originalFor(first.correctionKey), 'x=1');
    assert.equal(store.originalFor(identical.correctionKey), undefined);
});

test('changed, rewritten and different-model ink never inherits a correction; undo can restore it', () => {
    const store = new CalculationCorrections();
    const original = line('model1|ink1');
    store.remember([original], ['x=7']);
    for (const key of ['model1|ink1+eraser', 'model1|ink1+stroke', 'model1|rewritten', 'model2|ink1']) {
        assert.deepEqual(store.apply([line(key)]), { lines: ['x=1'], corrected: false });
    }
    assert.deepEqual(store.apply([original]), { lines: ['x=7'], corrected: true });
});

test('editing a correction replaces it, and explicitly restoring OCR text clears it', () => {
    const store = new CalculationCorrections();
    const source = [line('a'), line('b', 'y=2')];
    store.remember(source, ['x=7', 'y=2']);
    store.remember(source, ['x=8', 'y=3']);
    assert.deepEqual(store.apply(source).lines, ['x=8', 'y=3']);
    store.remember(source, ['x=1', 'y=2']);
    assert.equal(store.apply(source).corrected, false);
});

test('split and merged editor rows follow only the full contiguous source span', () => {
    for (const replacement of [['x=7'], ['x+1=8', 'x=7', 'y=3']]) {
        const store = new CalculationCorrections();
        const source = [line('a'), line('b', 'y=2')];
        store.remember(source, replacement);
        assert.deepEqual(store.apply([line('before'), ...source, line('after')]).lines,
            ['x=1', ...replacement, 'x=1']);
        for (const changed of [[source[0]], [source[1]], [source[1], source[0]],
            [source[0], line('middle'), source[1]], [source[0], line('b-changed', 'y=2')]]) {
            assert.equal(store.apply(changed).corrected, false);
        }
    }
});

test('ambiguous identities cannot apply corrections to the wrong line', () => {
    const store = new CalculationCorrections();
    store.remember([line('a')], ['x=7']);
    assert.equal(store.apply([line('a'), line('a')]).corrected, false);
    store.remember([line(''), line('b')], ['x=9', 'x=8']);
    assert.deepEqual(store.apply([line(''), line('b')]).lines, ['x=1', 'x=8']);
    store.remember([line('same'), line('same')], ['x=9', 'x=8']);
    assert.equal(store.apply([line('same')]).corrected, false);
});

test('session storage is bounded and clear removes corrections and original text reuse', () => {
    const store = new CalculationCorrections(2);
    for (const key of ['a', 'b', 'c']) store.remember([line(key)], ['x=7']);
    assert.equal(store.apply([line('a')]).corrected, false);
    assert.equal(store.apply([line('b')]).corrected, true);
    store.clear();
    assert.equal(store.apply([line('b'), line('c')]).corrected, false);
    assert.equal(store.originalFor('c'), undefined);
});


test('splitting another row preserves independent corrections, even beside ambiguous ink', () => {
    for (const secondKey of ['b', '']) {
        const store = new CalculationCorrections();
        const first = line('a', 'x=3');
        const second = line(secondKey, 'y=1 y=2');
        store.remember([first], ['x=4']);
        store.remember([first, second], ['x=4', 'y=1', 'y=2']);
        assert.deepEqual(store.apply([first]).lines, ['x=4']);
        assert.deepEqual(store.apply([first, line('changed-b')]).lines, ['x=4', 'x=1']);
        if (secondKey) assert.deepEqual(store.apply([first, second]).lines, ['x=4', 'y=1', 'y=2']);
    }
});

test('unchanged corrected suffix spans also survive splitting earlier editor rows', () => {
    const store = new CalculationCorrections();
    const source = [line('a', 'x=3'), line('b', 'y=2')];
    store.remember([source[1]], ['y=4']);
    store.remember(source, ['x+1=4', 'x=3', 'y=4']);
    assert.deepEqual(store.apply(source).lines, ['x+1=4', 'x=3', 'y=4']);
    assert.deepEqual(store.apply([line('changed-a'), source[1]]).lines, ['x=1', 'y=4']);
});


test('trimming unchanged edges never makes an ambiguous source identity unique', () => {
    const store = new CalculationCorrections();
    const source = line('same');
    store.remember([source, source], ['x=1', 'x=2', 'x=3']);
    assert.deepEqual(store.apply([source]), { lines: ['x=1'], corrected: false });
});

test('a merged group retains its sources when another split restores the original row count', () => {
    const store = new CalculationCorrections();
    const source = [line('a', 'A'), line('b', 'B'), line('c', 'C')];
    store.remember(source.slice(0, 2), ['AB']);
    store.remember(source, ['AB', 'C1', 'C2']);
    assert.deepEqual(store.apply(source).lines, ['AB', 'C1', 'C2']);
    assert.deepEqual(store.apply([source[0], source[1], line('changed-c', 'NEW')]).lines, ['AB', 'NEW']);
    assert.deepEqual(store.apply([line('changed-a', 'NEW'), ...source.slice(1)]).lines, ['NEW', 'B', 'C1', 'C2']);
});

test('editing a merged group never redistributes its output onto unproven individual sources', () => {
    const store = new CalculationCorrections();
    const source = [line('a', 'A'), line('b', 'B'), line('c', 'C')];
    store.remember(source.slice(0, 2), ['AB']);
    store.remember(source, ['AB changed', 'C1', 'C2']);
    assert.deepEqual(store.apply(source).lines, ['AB changed', 'C1', 'C2']);
    assert.deepEqual(store.apply(source.slice(0, 2)).lines, ['A', 'B']);
});
