import { readFile, writeFile, mkdir, readdir, realpath, stat } from 'node:fs/promises';
import { resolve, relative, isAbsolute, dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import Algebrite from 'algebrite';
import { MATERIAL_INDEX_VERSION, MATERIAL_FEATURES, scanTexMath, summarizeTexMath } from './tex-material-index.mts';
import { MATERIAL_CALCULATION_CORPUS, MATERIAL_CALCULATION_CORPUS_VERSION } from '../test/fixtures/material-calculation-corpus.mts';
import { validateCalculationPathSubmission } from '../src/math/calculation-path.ts';

const options = new Map<string,string>();
let inventoryOnly = false;
const args = process.argv.slice(2);
for (let at = 0; at < args.length; at++) {
  const arg = args[at];
  if (arg === '--help') {
    console.log('Usage: audit-ocr-materials.mts --materials DIR [--output FILE] [--inventory-only]');
    process.exit(0);
  }
  if (arg === '--inventory-only') {
    if (inventoryOnly) throw new Error('Repeated --inventory-only.');
    inventoryOnly = true; continue;
  }
  if (!['--materials','--output'].includes(arg) || options.has(arg)) throw new Error('Unknown or repeated option: ' + arg);
  const value = args[++at];
  if (!value || value.startsWith('--')) throw new Error('Missing value for ' + arg);
  options.set(arg,value);
}
if (!options.get('--materials')) throw new Error('--materials must name the local TeX material directory.');
const materialRoot = await realpath(resolve(options.get('--materials')!));
if (!(await stat(materialRoot)).isDirectory()) throw new Error('--materials is not a directory.');
const output = resolve(options.get('--output') || join(tmpdir(),'lia-ocr-priority5-material-coverage.json'));
const within = (root:string,path:string) => {
  const part = relative(root,path);
  return part === '' || (!isAbsolute(part) && part !== '..' && !part.startsWith('..\\') && !part.startsWith('../'));
};
if (within(materialRoot,output)) throw new Error('Write the audit report outside the read-only material tree.');
const repoRoot = fileURLToPath(new URL('../',import.meta.url));
const hash = (input: string | Buffer) => createHash('sha256').update(input).digest('hex');
const portable = (path:string) => path.replace(/\\/gu,'/');
const decode = (bytes:Buffer): {text:string;encoding:string} => {
  if (bytes[0] === 0xff && bytes[1] === 0xfe) return {text:new TextDecoder('utf-16le',{fatal:true}).decode(bytes),encoding:'utf-16le'};
  if (bytes[0] === 0xfe && bytes[1] === 0xff) return {text:new TextDecoder('utf-16be',{fatal:true}).decode(bytes),encoding:'utf-16be'};
  try { return {text:new TextDecoder('utf-8',{fatal:true}).decode(bytes),encoding:'utf-8'}; }
  catch { return {text:new TextDecoder('windows-1252').decode(bytes),encoding:'windows-1252-fallback'}; }
};
const errors: Array<{path:string;error:string}> = [];
const files: string[] = [];
async function collect(directory:string):Promise<void> {
  let entries;
  try { entries = await readdir(directory,{withFileTypes:true}); }
  catch(error) { errors.push({path:portable(relative(materialRoot,directory)),error:String(error)});return; }
  entries.sort((a,b)=>a.name<b.name?-1:a.name>b.name?1:0);
  for (const entry of entries) {
    if (entry.isSymbolicLink() || ['.git','.svn','node_modules'].includes(entry.name)) continue;
    const path=join(directory,entry.name);
    if (entry.isDirectory()) await collect(path);
    else if (entry.isFile() && entry.name.toLowerCase().endsWith('.tex')) files.push(path);
  }
}
await collect(materialRoot);
type IndexEntry = {
  paths:string[]; sha256:string; bytes:number; encoding:string; categories:string[];
  math:ReturnType<typeof summarizeTexMath>;
};
const unique = new Map<string,IndexEntry>();
const featureTotals:Record<string,number> = Object.fromEntries(MATERIAL_FEATURES.map(feature=>[feature,0]));
let processed=0, readablePaths=0, totalBytes=0, regions=0, equationRegions=0, filesWithIssues=0;
for (const path of files) {
  const rel=portable(relative(materialRoot,path));
  try {
    if ((await stat(path)).size > 24_000_000) throw new Error('File exceeds the explicit 24 MB inventory bound.');
    const bytes=await readFile(path), sha256=hash(bytes);
    totalBytes+=bytes.length;
    const category = /(?:^|\/)Repetitorium(?:\/|$)|mathe/iu.test(rel) ? 'mathematics-path' : 'other-or-unclassified-path';
    const previous=unique.get(sha256);
    if (previous) { previous.paths.push(rel); if(!previous.categories.includes(category))previous.categories.push(category); }
    else {
      const decoded=decode(bytes);
      const math=summarizeTexMath(scanTexMath(decoded.text),1);
      math.features=Object.fromEntries(Object.entries(math.features).filter(([,entry])=>entry.count>0));
      unique.set(sha256,{paths:[rel],sha256,bytes:bytes.length,encoding:decoded.encoding,categories:[category],math});
      regions+=math.mathRegions; equationRegions+=math.equationRegions;
      if (math.issues.length) filesWithIssues++;
      for (const feature of MATERIAL_FEATURES) featureTotals[feature]+=(math.features[feature]?.count??0);
    }
    readablePaths++;
  } catch(error) { errors.push({path:rel,error:String(error)}); }
  processed++;
  if (processed % 250 === 0) console.log('Indexed ' + processed + '/' + files.length + ' TeX paths.');
}
const sourceDigests: Record<string,string> = {};
for (const path of ['scripts/tex-material-index.mts','scripts/audit-ocr-materials.mts','test/fixtures/material-calculation-corpus.mts',
  'src/math/calculation-path.ts','src/math/calculation-structure.ts','src/math/nonlinear-proof.ts',
  'src/math/rational-equation-proof.ts','src/math/linear-system-proof.ts','src/math/calculation-proof-budget.ts','src/math/equivalence.ts',
  'src/math/expected-calculation.ts','package-lock.json','dist/index.js']) {
  sourceDigests[path]=hash(await readFile(resolve(repoRoot,path)));
}
const caseResults:any[]=[];
let contractFailures=0;
if (!inventoryOnly) {
  for (const sample of MATERIAL_CALCULATION_CORPUS) {
    const sourcePath=resolve(materialRoot,sample.source.path);
    let sourceEvidence:any={status:'missing'};
    try {
      if (!within(materialRoot,sourcePath) || !within(materialRoot,await realpath(sourcePath))) throw new Error('Source escaped the material root.');
      const bytes=await readFile(sourcePath);
      const lines=decode(bytes).text.split(/\r?\n/u);
      const window=lines.slice(sample.source.fromLine-1,sample.source.toLine).join('\n');
      if (!sample.source.anchor || !window.includes(sample.source.anchor)) throw new Error('Source anchor does not match its declared line window.');
      sourceEvidence={status:'verified',fileSha256:hash(bytes),windowSha256:hash(window),...sample.source};
    } catch(error) { sourceEvidence={...sample.source,status:'missing-or-changed',error:String(error)};contractFailures++; }
    const begin=performance.now();
    const grade=validateCalculationPathSubmission(sample.prompt,sample.lines,{runtime:Algebrite});
    const checkMs=performance.now()-begin;
    const negative=sample.incorrectLines
      ? validateCalculationPathSubmission(sample.prompt,sample.incorrectLines,{runtime:Algebrite}) : null;
    const supported=grade.accepted && (!negative || !negative.accepted);
    const regression=sample.expectedSupport==='supported' && !supported;
    const falseAcceptance=negative?.accepted===true;
    if (regression || falseAcceptance) contractFailures++;
    caseResults.push({
      id:sample.id,family:sample.family,source:sourceEvidence,adaptation:sample.adaptation,note:sample.note,
      prompt:sample.prompt,lines:sample.lines,expectedSupport:sample.expectedSupport,
      observedSupport:supported?'demonstrated-on-this-tex-case':'gap',
      positive:{accepted:grade.accepted,outcome:grade.outcome,firstProblem:grade.firstProblem||null,checkMs,
        checks:grade.transitionChecks.map(check=>({status:check.status,reason:check.reason,fromIndex:check.fromIndex,toIndex:check.toIndex}))},
      negative:negative?{lines:sample.incorrectLines,accepted:negative.accepted,outcome:negative.outcome,
        firstProblem:negative.firstProblem||null}:null,regression,falseAcceptance,
    });
  }
}
const familyNames=[...new Set(caseResults.map(entry=>entry.family))].sort();
const families=familyNames.map(family=>{
  const samples=caseResults.filter(entry=>entry.family===family);
  return {family,curatedCases:samples.length,demonstratedCases:samples.filter(entry=>entry.observedSupport==='demonstrated-on-this-tex-case').length,
    gaps:samples.filter(entry=>entry.observedSupport==='gap').map(entry=>entry.id)};
});
const issueCounts:Record<string,number>={};
const skippedRegions={emptyTableCells:0,emptyTikzGroups:0,tikzCoordinateCalculations:0};
for (const entry of unique.values()) {
  for (const [reason,count] of Object.entries(entry.math.issueCounts)) issueCounts[reason]=(issueCounts[reason]||0)+count;
  skippedRegions.emptyTableCells+=entry.math.skippedRegions.emptyTableCells;
  skippedRegions.emptyTikzGroups+=entry.math.skippedRegions.emptyTikzGroups;
  skippedRegions.tikzCoordinateCalculations+=entry.math.skippedRegions.tikzCoordinateCalculations;
}
const report={
  schema:1,kind:'berechneocr-material-coverage',createdAt:new Date().toISOString(),
  inventoryVersion:MATERIAL_INDEX_VERSION,corpusVersion:MATERIAL_CALCULATION_CORPUS_VERSION,sourceDigests,
  scope:{
    sourceRootLabel:'user-specified local TeX material directory',symlinks:'not traversed',
    inventory:'Lexical TeX math regions, not expanded TeX, semantic tasks or a handwriting dataset.',
    duplicates:'Byte-identical files are indexed once; all paths remain listed.',
    subjectCategories:'Path-name hints only; other subjects and unclassified paths are retained.',
    coverage:'Curated correct and incorrect TeX paths only. Unknown is a coverage gap, never OCR success. No material-wide success percentage is inferred.',
    hashes:'File SHA-256 uses original bytes; math/window hashes use decoded source with source comments excluded only in math-region hashes.',
  },
  inventory:{
    filePaths:files.length,readablePaths,uniqueByteContents:unique.size,
    duplicatePaths:readablePaths-unique.size,totalBytes,mathRegions:regions,equationRegions,
    uniqueFilesWithScanIssues:filesWithIssues,
    uniqueFilesWithTruncation:[...unique.values()].filter(entry=>entry.math.truncated).length,
    features:featureTotals,issueCounts,skippedRegions,errors,files:[...unique.values()],
  },
  semanticAudit:inventoryOnly?null:{
    cases:caseResults.length,demonstratedCases:caseResults.filter(item=>item.observedSupport==='demonstrated-on-this-tex-case').length,
    gapCases:caseResults.filter(item=>item.observedSupport==='gap').length,
    falseAcceptances:caseResults.filter(item=>item.falseAcceptance).length,
    sourceProblems:caseResults.filter(item=>item.source.status!=='verified').length,contractFailures,families,results:caseResults,
  },
};
await mkdir(dirname(output),{recursive:true});
await writeFile(output,JSON.stringify(report)+'\n','utf8');
console.log(JSON.stringify({
  report:output,filePaths:files.length,uniqueByteContents:unique.size,mathRegions:regions,equationRegions,
  filesWithIssues,readErrors:errors.length,semanticCases:caseResults.length,
  demonstratedCases:report.semanticAudit?.demonstratedCases??null,gaps:report.semanticAudit?.gapCases??null,contractFailures,
}));
if(errors.length || contractFailures)process.exitCode=1;
