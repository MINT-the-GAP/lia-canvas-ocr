import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';
import Algebrite from 'algebrite';
import { MATERIAL_CALCULATION_CORPUS as corpus, MATERIAL_CALCULATION_CORPUS_VERSION } from './fixtures/material-calculation-corpus.mts';
import { validateCalculationPathSubmission } from '../src/math/calculation-path.ts';

(globalThis as any).Algebrite = Algebrite;

test('the curated corpus is versioned, source-addressable and contains distinct supported and open families', () => {
    assert.match(MATERIAL_CALCULATION_CORPUS_VERSION,/^material-calculation-v[1-9]\d*$/u);
    assert.ok(corpus.length>=20 && corpus.length<=28);
    assert.equal(new Set(corpus.map(sample=>sample.id)).size,corpus.length);
    assert.ok(new Set(corpus.map(sample=>sample.family)).size>=15);
    assert.ok(corpus.filter(sample=>sample.expectedSupport==='supported').length>=15);
    assert.ok(corpus.filter(sample=>sample.expectedSupport==='gap').length>=7);
    for(const sample of corpus) {
        assert.match(sample.id,/^[a-z][a-z0-9-]+$/u);
        assert.match(sample.family,/^[a-z][a-z0-9-]+$/u);
        assert.ok(sample.source.path.endsWith('.tex'));
        assert.ok(!sample.source.path.startsWith('/') && !sample.source.path.includes('\\') && !sample.source.path.includes(':'));
        assert.ok(!sample.source.path.split('/').includes('..'));
        assert.ok(Number.isInteger(sample.source.fromLine) && sample.source.fromLine>0);
        assert.ok(Number.isInteger(sample.source.toLine) && sample.source.toLine>=sample.source.fromLine);
        assert.ok(sample.source.toLine-sample.source.fromLine<60);
        assert.ok(sample.source.anchor.length>=6 && sample.source.anchor.length<=200);
        assert.ok(sample.adaptation.length>=25 && sample.note.length>=25);
        assert.ok(sample.prompt.trim());
        assert.ok(sample.lines.length>=2 && sample.lines.length<=32);
        assert.ok(sample.lines.every(line=>line.trim().length>0));
        assert.ok(sample.expectedSupport==='supported' || sample.expectedSupport==='gap');
        if(sample.expectedSupport==='supported') {
            assert.ok(sample.incorrectLines, sample.id+' needs a controlled negative path');
            assert.ok(sample.incorrectLines.length>=2 && sample.incorrectLines.length<=32);
            assert.ok(sample.incorrectLines.every(line=>line.trim().length>0));
            assert.equal(sample.incorrectLines[0],sample.lines[0],sample.id+' must retain the same initial problem');
            assert.notDeepEqual(sample.incorrectLines,sample.lines);
        }
    }
});

// The private material tree is optional on other machines. Supplying an
// explicit root makes missing files an error; the repository's normal unit
// suite remains portable without copying private chapters into Git.
const configuredRoot=process.env.LIA_OCR_MATERIAL_ROOT;
const materialRoot=resolve(configuredRoot || 'Z:/Drive/Martin - Schule/Material');
const sourceAvailable=!!configuredRoot || existsSync(materialRoot);
test('literal anchors occur in the specified local source windows', {skip: !sourceAvailable}, () => {
    const cache=new Map<string,string[]>();
    for(const sample of corpus) {
        const file=resolve(materialRoot,...sample.source.path.split('/'));
        let lines=cache.get(file);
        if(!lines) {
            // All curated anchors are ASCII TeX. Latin-1 preserves those bytes
            // in both the local Windows-1252 and UTF-8 source files.
            lines=readFileSync(file,'latin1').split(/\r?\n/u);
            cache.set(file,lines);
        }
        assert.ok(sample.source.toLine<=lines.length,sample.id+' source window out of range');
        const window=lines.slice(sample.source.fromLine-1,sample.source.toLine).join('\n');
        assert.ok(window.includes(sample.source.anchor),sample.id+' literal source anchor not found');
    }
});

test('supported mathematical text paths pass and their independently authored incorrect variants fail', async t => {
    for(const sample of corpus.filter(sample=>sample.expectedSupport==='supported')) await t.test(sample.id, () => {
        const result=validateCalculationPathSubmission(sample.prompt,sample.lines);
        assert.equal(result.accepted,true,JSON.stringify({id:sample.id,result}));
        assert.equal(result.outcome,'correct');
        const incorrect=validateCalculationPathSubmission(sample.prompt,sample.incorrectLines!);
        assert.equal(incorrect.accepted,false,JSON.stringify({id:sample.id,incorrect}));
        assert.notEqual(incorrect.outcome,'correct');
    });
});

test('documented gaps remain outside supported coverage even when their limitation tests pass', async t => {
    for(const sample of corpus.filter(sample=>sample.expectedSupport==='gap')) await t.test(sample.id, () => {
        const result=validateCalculationPathSubmission(sample.prompt,sample.lines);
        assert.equal(result.accepted,false,JSON.stringify({id:sample.id,result}));
        assert.notEqual(result.outcome,'correct');
        // This assertion only locks a known limitation. It must not contribute
        // to a reported recognition/solver success rate for the material.
        assert.equal(sample.expectedSupport,'gap');
    });
});