import { createHash } from 'node:crypto';

export const MATERIAL_INDEX_VERSION = 'tex-math-inventory-v2';
export const MATERIAL_FEATURES = [
  'equation', 'fraction', 'root', 'power', 'subscript', 'plus-minus', 'inequality',
  'logarithm', 'exponential', 'trigonometry', 'derivative', 'integral', 'sum-product',
  'limit', 'vector', 'matrix', 'system', 'solution-set', 'units', 'greek',
  'multiplication-dot', 'multiplication-cross', 'decimal-comma',
] as const;
export type MaterialFeature = typeof MATERIAL_FEATURES[number];
export type MathSpan = { fromLine: number; toLine: number; delimiter: string; text: string; sha256: string; features: MaterialFeature[] };
export type TexMathScan = {
  spans: MathSpan[]; issues: Array<{ line: number; reason: string }>;
  issueCount: number; issueCounts: Record<string, number>;
  skippedRegions: { emptyTableCells: number; emptyTikzGroups: number; tikzCoordinateCalculations: number };
  lineCount: number; truncated: boolean;
};
const MATH_ENVIRONMENTS = new Set(['equation', 'equation*', 'align', 'align*', 'alignat', 'alignat*', 'flalign', 'flalign*', 'aligned', 'alignedat',
  'gather', 'gather*', 'gathered', 'multline', 'multline*', 'eqnarray', 'eqnarray*', 'displaymath', 'math']);
const LITERAL_ENVIRONMENTS = new Set(['verbatim', 'verbatim*', 'Verbatim', 'lstlisting', 'minted', 'comment']);
const TABLE_ENVIRONMENTS = new Set(['tabular', 'tabular*', 'tabularx']);
// Match nested TeX groups or explicit sets without flattening their contents.
function groupEnd(source: string, start: number, explicitSet = false): number {
  const stack = [explicitSet];
  for (let at = start + (explicitSet ? 2 : 1); at < source.length; at++) {
    if (source[at] === '\\') {
      const next = source[++at];
      if (explicitSet && (next === '{' || next === '}')) {
        if (next === '{') stack.push(true);
        else { if (stack.pop() !== true) return -1; if (!stack.length) return at + 1; }
      }
    } else if (source[at] === '{') stack.push(false);
    else if (source[at] === '}') {
      if (stack.pop() !== false) return -1;
      if (!stack.length) return at + 1;
    }
  }
  return -1;
}
function withoutCommaLists(source: string): string {
  const parts: string[] = [];
  for (let at = 0; at < source.length;) {
    let start = at;
    if (source[at] === '_') { start++; while (start < source.length && /\s/u.test(source[start])) start++; }
    const set = source.startsWith('\\{', at);
    if (set || (source[at] === '_' && source[start] === '{')) {
      const end = groupEnd(source, set ? at : start, set);
      if (end >= 0) { parts.push(' '); at = end; continue; }
    }
    if (source[at] === '\\' && source[at + 1] === '\\') { parts.push('\\\\'); at += 2; }
    else parts.push(source[at++]);
  }
  return parts.join('');
}
function tablePreambleEnd(source: string, start: number, name: string): number {
  let at = start;
  const spaces = () => { while (at < source.length && /\s/u.test(source[at])) at++; };
  const group = () => { spaces(); if (source[at] !== '{') return false; const end = groupEnd(source, at); if (end < 0) return false; at = end; return true; };
  if (name !== 'tabular' && !group()) return start;
  spaces();
  if (source[at] === '[') { const end = source.indexOf(']', at + 1); if (end < 0) return start; at = end + 1; }
  return group() ? at : start;
}
const commands = new Map<string, RegExp>();
const command = (names: string) => {
  let pattern = commands.get(names);
  if (!pattern) { pattern = new RegExp('\\\\(?:' + names + ')(?![A-Za-z])', 'u'); commands.set(names, pattern); }
  return pattern;
};
export function classifyMathFeatures(source: string): MaterialFeature[] {
  const features = new Set<MaterialFeature>();
  const add = (feature: MaterialFeature, test: boolean) => { if (test) features.add(feature); };
  add('equation', /[=]/u.test(source));
  add('fraction', command('frac|dfrac|tfrac|cfrac|over').test(source));
  add('root', command('sqrt').test(source));
  add('power', /\^/u.test(source));
  add('subscript', /_/u.test(source));
  add('plus-minus', /[±∓]/u.test(source) || command('pm|mp').test(source));
  add('inequality', /[<>≤≥≠]/u.test(source) || command('le|leq|ge|geq|ne|neq|lesssim|gtrsim').test(source));
  add('logarithm', command('ln|log|lg').test(source));
  add('exponential', command('exp').test(source) || /(?:^|[^A-Za-z])e\s*\^/u.test(source));
  add('trigonometry', command('sin|cos|tan|cot|arcsin|arccos|arctan|sinh|cosh|tanh').test(source));
  // A bare d in a numerator can be an ordinary variable (distance/time).
  // Tag Leibniz notation only when the denominator also names a differential.
  const differentialSource = source.replace(/\\mathrm\s*\{\s*d\s*\}/gu, 'd');
  add('derivative', command('partial|nabla|dot|ddot').test(source) || /[A-Za-z)]\s*(?:'|\\prime)/u.test(source)
    || /\\(?:d?frac|tfrac)\s*\{\s*d(?:\s*\^\s*(?:\{\s*\d+\s*\}|\d+))?\s*[A-Za-z]?\s*\}\s*\{\s*d\s*[A-Za-z](?:\s*\^\s*(?:\{\s*\d+\s*\}|\d+))?\s*\}/u.test(differentialSource));
  add('integral', command('int|iint|iiint|oint').test(source));
  add('sum-product', command('sum|prod').test(source));
  add('limit', command('lim|limsup|liminf').test(source));
  add('vector', command('vec|overrightarrow').test(source));
  add('matrix', /\\begin\s*\{\s*(?:[pbBvV]?matrix|smallmatrix)\s*\}/u.test(source));
  add('system', /\\begin\s*\{\s*cases\s*\}/u.test(source));
  add('solution-set', /\\mathcal\s*\{\s*L\s*\}|\\(?:emptyset|varnothing)(?![A-Za-z])/u.test(source));
  add('units', command('si|SI|unit|qty').test(source) || /\\mathrm\s*\{\s*(?:m|s|kg|km|cm|mm|N|J|W|V|A|Pa|Hz|mol)\s*\}/u.test(source));
  add('greek', command('alpha|beta|gamma|delta|Delta|epsilon|theta|lambda|mu|sigma|omega|Omega|pi|rho|phi|varphi').test(source));
  add('multiplication-dot', /[·⋅]/u.test(source) || command('cdot').test(source));
  add('multiplication-cross', /×/u.test(source) || command('times').test(source));
  // Unprotected commas in index lists and explicit sets are ambiguous.
  // Keep protected TeX decimal commas (1{,}5), but do not count x_{1,2} or {1,2}.
  const decimalSource = withoutCommaLists(source);
  add('decimal-comma', /\d\{,\}\d/u.test(source) || /\d,\d/u.test(decimalSource));
  return MATERIAL_FEATURES.filter(feature => features.has(feature));
}

/** Lexical source inventory, NOT a TeX interpreter or an exercise counter.
 * Outer math regions are emitted once. Comments, verbatim and escaped delimiters
 * are excluded; macros/includes are not expanded. Bounds are explicit in output.
 */
export function scanTexMath(source: string, limits: { maxChars?: number; maxSpans?: number; maxSpanChars?: number } = {}): TexMathScan {
  const maxChars = limits.maxChars ?? 12_000_000, maxSpans = limits.maxSpans ?? 100_000;
  const maxSpanChars = limits.maxSpanChars ?? 16_384;
  let truncated = source.length > maxChars;
  const input = source.slice(0, maxChars);
  const spans: MathSpan[] = [], issues: TexMathScan['issues'] = [];
  let issueCount = 0;
  const issueCounts: Record<string, number> = {};
  const skippedRegions = { emptyTableCells: 0, emptyTikzGroups: 0, tikzCoordinateCalculations: 0 };
  let line = 1, at = 0;
  let groupDepth = 0, pendingTikzGroup = -1, tikzPathDepth: number | null = null;
  const tikzGroups: number[] = [];
  const environments: Array<{name: string; table?: {cellStart: number; depth: number}}> = [];
  const inTikz = () => tikzGroups.length > 0 || environments.some(env => env.name === 'tikzpicture' || env.name === 'pgfinterruptpath');
  const state: { active: { delimiter: string; fromLine: number; parts: string[]; chars: number; oversized: boolean; envs: string[]; braceDepth: number } | null } = { active: null };
  const issue = (reason: string, lineNumber = line) => {
    issueCount++; issueCounts[reason] = (issueCounts[reason] || 0) + 1;
    // Loss of source coverage must remain visible even after the issue list fills.
    if (reason.endsWith('-limit') || reason === 'math-region-too-large' || reason === 'discarded-malformed-math-region') truncated = true;
    if (issues.length < 1000) issues.push({ line: lineNumber, reason });
  };
  const append = (text: string) => {
    if (!state.active) return;
    state.active.chars += text.length;
    if (state.active.chars <= maxSpanChars) state.active.parts.push(text);
    else state.active.oversized = true;
  };
  const advance = (text: string, record = true) => {
    if (record) append(text);
    line += (text.match(/\n/gu) || []).length;
    at += text.length;
  };
  const start = (delimiter: string, opener: string, env?: string) => {
    state.active = { delimiter, fromLine: line, parts: [], chars: 0, oversized: false, envs: env ? [env] : [], braceDepth: 0 };
    advance(opener, false);
  };
  const finish = (closer: string) => {
    if (!state.active) return;
    if (state.active.braceDepth) issue('unbalanced-math-braces', state.active.fromLine);
    if (state.active.oversized) issue('math-region-too-large', state.active.fromLine);
    else {
      const text = state.active.parts.join('');
      spans.push({ fromLine: state.active.fromLine, toLine: line, delimiter: state.active.delimiter, text,
        sha256: createHash('sha256').update(text).digest('hex'), features: classifyMathFeatures(text) });
    }
    state.active = null;
    advance(closer, false);
  };
  if (truncated) issue('file-character-limit', 1);
  while (at < input.length) {
    if (spans.length >= maxSpans) { issue('math-region-count-limit'); break; }
    const char = input[at];
    if (char === '%') {
      const end = input.indexOf('\n', at);
      advance(input.slice(at, end < 0 ? input.length : end), false);
      continue;
    }
    if (char === '\\') {
      if (/[$%{}\\&]/u.test(input[at + 1] || '')) {
        const table = environments.at(-1)?.table;
        if (input[at + 1] === '\\' && !state.active && table?.depth === groupDepth) table.cellStart = at + 2;
        advance(input.slice(at, at + 2)); continue;
      }
      const verb = /^\\verb\*?(?![A-Za-z])/u.exec(input.slice(at, at + 16));
      if (verb) {
        const delimiter = input[at + verb[0].length];
        const end = delimiter && delimiter !== '\n' ? input.indexOf(delimiter, at + verb[0].length + 1) : -1;
        const newline = input.indexOf('\n', at);
        if (end < 0 || (newline >= 0 && end > newline)) { issue('unclosed-verb'); advance(verb[0]); continue; }
        advance(input.slice(at, end + 1), false); continue;
      }
      const environment = /^\\(begin|end)\s*\{\s*([A-Za-z*]+)\s*\}/u.exec(input.slice(at, at + 120));
      if (environment) {
        const [whole, action, name] = environment;
        if (action === 'begin' && LITERAL_ENVIRONMENTS.has(name)) {
          const closing = '\\end{' + name + '}';
          const end = input.indexOf(closing, at + whole.length);
          if (end < 0) { issue('unclosed-literal-environment'); advance(input.slice(at), false); break; }
          advance(input.slice(at, end + closing.length), false); continue;
        }
        if (action === 'begin') {
          const table = TABLE_ENVIRONMENTS.has(name)
            ? { cellStart: tablePreambleEnd(input, at + whole.length, name), depth: groupDepth } : undefined;
          environments.push({name, table});
        } else if (environments.at(-1)?.name === name) environments.pop();
        if (!state.active && action === 'begin' && MATH_ENVIRONMENTS.has(name)) { start('environment:' + name, whole, name); continue; }
        if (state.active?.delimiter.startsWith('environment:')) {
          if (action === 'begin') state.active.envs.push(name);
          else if (state.active.envs.at(-1) === name) {
            state.active.envs.pop();
            if (!state.active.envs.length) { finish(whole); continue; }
          } else issue('mismatched-environment');
        }
        advance(whole); continue;
      }
      const marker = input.slice(at, at + 2);
      if (marker === '\\(' || marker === '\\[') {
        if (!state.active) start(marker, marker); else { if (!state.active.braceDepth) issue('nested-math-delimiter'); advance(marker); }
        continue;
      }
      if (marker === '\\)' || marker === '\\]') {
        if (state.active?.delimiter === (marker === '\\)' ? '\\(' : '\\[') && !state.active.braceDepth) finish(marker);
        else { if (!state.active?.braceDepth) issue('unmatched-math-close'); advance(marker); }
        continue;
      }
      const control = /^\\[A-Za-z]+\*?/u.exec(input.slice(at));
      if (control?.[0] === '\\tikzset') {
        let next = at + control[0].length; while (next < input.length && /\s/u.test(input[next])) next++;
        if (input[next] === '{') pendingTikzGroup = next;
      }
      if (control && /^\\(?:draw|path|fill|filldraw|clip|coordinate|node)$/u.test(control[0]) && inTikz()) tikzPathDepth = groupDepth;
      advance(control?.[0] || '\\'); continue;
    }
    if (char === '$') {
      const table = environments.at(-1)?.table;
      if (!state.active && input.startsWith('$$', at) && table?.depth === groupDepth
        && /^\s*$/u.test(input.slice(table.cellStart, at))
        && /^\s*(?:&|\\\\|\\tabularnewline(?![A-Za-z])|\\end\s*\{\s*tabular(?:\*|x)?\s*\})/u.test(input.slice(at + 2))) {
        skippedRegions.emptyTableCells++; advance('$$', false); continue;
      }
      if (!state.active && input.startsWith('$$', at) && inTikz() && tikzPathDepth !== null && groupDepth > tikzPathDepth
        && /^\s*\}/u.test(input.slice(at + 2))) {
        let previous = at - 1; while (previous >= 0 && /\s/u.test(input[previous])) previous--;
        if (input[previous] === '{' && input[previous - 1] !== '\\') {
          skippedRegions.emptyTikzGroups++; advance('$$', false); continue;
        }
      }
      // TikZ calc's ($...$) is drawing syntax. Require a confirmed TikZ path
      // at its own group depth; mathematical node labels remain ordinary math.
      if (!state.active && inTikz() && tikzPathDepth === groupDepth && input[at - 1] === '(' && input[at + 1] === '(') {
        const end = input.indexOf('$', at + 1);
        if (end > at && end - at <= maxSpanChars && input[end + 1] === ')') {
          const body = input.slice(at + 1, end);
          let depth = 0, balanced = true;
          for (const value of body) { if (value === '(') depth++; else if (value === ')' && --depth < 0) balanced = false; }
          if (balanced && depth === 0) { skippedRegions.tikzCoordinateCalculations++; advance(input.slice(at, end + 1), false); continue; }
        }
      }
      // An active inline region closes at the first dollar of $x$$y$.
      const marker = state.active?.delimiter === '$' && !state.active.braceDepth
        ? '$' : input.startsWith('$$', at) ? '$$' : '$';
      if (!state.active) start(marker, marker);
      else if (state.active.delimiter === marker && !state.active.braceDepth) finish(marker);
      else { if (!state.active.braceDepth) issue('nested-math-delimiter'); advance(marker); }
      continue;
    }
    if (char === '{' || char === '}') {
      if (char === '{') { groupDepth++; if (at === pendingTikzGroup) { tikzGroups.push(groupDepth); pendingTikzGroup = -1; } }
      else { if (tikzGroups.at(-1) === groupDepth) tikzGroups.pop(); groupDepth = Math.max(0, groupDepth - 1); }
      if (state.active) {
        state.active.braceDepth += char === '{' ? 1 : -1;
        if (state.active.braceDepth < 0) {
          // A math region cannot consume a brace belonging to its surrounding
          // text/label group. Discard that broken region and resume at the boundary.
          issue('unbalanced-math-braces');
          issue('discarded-malformed-math-region', state.active.fromLine);
          state.active = null;
        }
      }
      advance(char); continue;
    }
    if (char === '&' || char === ';') {
      const table = environments.at(-1)?.table;
      if (char === '&' && !state.active && table?.depth === groupDepth) table.cellStart = at + 1;
      if (char === ';' && tikzPathDepth === groupDepth) tikzPathDepth = null;
      advance(char); continue;
    }
    let end = at + 1;
    while (end < input.length && !/[\\$%{}&;]/u.test(input[end])) end++;
    advance(input.slice(at, end));
  }
  if (state.active) issue('unclosed-math-region', state.active.fromLine);
  return { spans, issues, issueCount, issueCounts, skippedRegions, lineCount: line, truncated };
}

export function summarizeTexMath(scan: TexMathScan, examplesPerFeature = 2) {
  const features: Record<string, { count: number; examples: Array<{ fromLine: number; toLine: number; sha256: string }> }> = {};
  for (const feature of MATERIAL_FEATURES) features[feature] = { count: 0, examples: [] };
  for (const span of scan.spans) for (const feature of span.features) {
    const entry = features[feature]; entry.count++;
    if (entry.examples.length < examplesPerFeature) entry.examples.push({ fromLine: span.fromLine, toLine: span.toLine, sha256: span.sha256 });
  }
  return { lineCount: scan.lineCount, mathRegions: scan.spans.length,
    equationRegions: features.equation.count, features, issues: scan.issues,
    issueCount: scan.issueCount, issueCounts: scan.issueCounts, skippedRegions: scan.skippedRegions, truncated: scan.truncated };
}
