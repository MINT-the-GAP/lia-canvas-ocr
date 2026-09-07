import { findTopLevelGroupedEqualities, normalizeTopLevelEqualityGroups } from './equality-groups.ts';

// Lossless structural parsing only. Mathematical proofs and role inheritance belong
// to the path validator; this module never repairs OCR or changes an expression.
export type CalculationRoleHint = 'main' | 'auxiliary' | 'check' | 'substitution' | 'back-substitution' | 'domain';
export type CalculationStatementBase = { source: string; label?: string; roleHint?: CalculationRoleHint };
export type CalculationStatement = CalculationStatementBase & (
    | { kind: 'equation'; left: string; right: string; operation?: string }
    | { kind: 'equality-chain'; operands: string[]; operation?: string }
    | { kind: 'group'; format: 'cases' | 'array' | 'aligned' | 'compound'; semantics: 'system' | 'sequence' | 'unspecified'; members: CalculationStatement[] }
    | { kind: 'label'; label: string }
    | { kind: 'unsupported'; reason: string }
);
export type CalculationStructuredRow = {
    source: string;
    lineIndex: number;
    lastLineIndex: number;
    sourceLineIndexes: number[];
    statement: CalculationStatement;
};
export type CalculationStructure = { sourceLines: string[]; rows: CalculationStructuredRow[]; issues: string[] };

const MAX_LENGTH = 16_384;
const MAX_ROWS = 32;
const MAX_DEPTH = 32;
const SPACING_COMMAND = /^(?:quad|qquad|enspace|thinspace|medspace|thickspace)$/;
const ROMAN = /^(?:I|II|III|IV|V|VI|VII|VIII|IX|X)$/;
const ROLES: Record<string, CalculationRoleHint> = {
    hauptrechnung: 'main', hauptgleichung: 'main',
    nebenrechnung: 'auxiliary', hilfsrechnung: 'auxiliary',
    probe: 'check', kontrolle: 'check', prüfung: 'check',
    substitution: 'substitution', einsetzen: 'substitution',
    rücksubstitution: 'back-substitution', ruecksubstitution: 'back-substitution',
    definitionsmenge: 'domain', definitionsbereich: 'domain'
};
type Cut = { start: number; end: number; kind: 'row' | 'column' | 'semicolon' | 'spacing' | 'comma' };
type Scan = { equalities: Cut[]; cuts: Cut[]; operation: { start: number; end: number } | null; error?: string };

function unsupported(source: string, reason: string): CalculationStatement { return { kind: 'unsupported', source, reason }; }
function groupAt(source: string, start: number): { content: string; end: number } | null {
    if (source[start] !== '{') return null;
    let depth = 1;
    for (let index = start + 1; index < source.length; index++) {
        if (source[index] === '\\') { index++; continue; }
        if (source[index] === '{' && ++depth > MAX_DEPTH) return null;
        if (source[index] === '}' && --depth === 0) return { content: source.slice(start + 1, index), end: index + 1 };
    }
    return null;
}
function removeMathWrapper(source: string): string {
    const value = source.trim();
    for (const [open, close] of [['$$', '$$'], ['$', '$'], ['\\(', '\\)'], ['\\[', '\\]']]) {
        if (value.startsWith(open) && value.endsWith(close) && value.length >= open.length + close.length) {
            return value.slice(open.length, -close.length).trim();
        }
    }
    return value;
}

/** Scan separators only outside balanced brackets and complete environments. */
function scan(source: string): Scan {
    const result: Scan = { equalities: [], cuts: [], operation: null };
    const groupedEqualities = new Map(findTopLevelGroupedEqualities(source).map(range => [range.start, range]));
    const brackets: string[] = [];
    const environments: string[] = [];
    let plainBars = 0;
    let leftRightDepth = 0;
    const fail = (error: string): Scan => ({ ...result, error });
    for (let index = 0; index < source.length;) {
        const ch = source[index];
        const top = !brackets.length && !environments.length;
        if (ch === '%') return fail('unsupported-comment');
        if (ch === '$') return fail('nested-math-delimiter');
        if (ch === '\\') {
            const token = /^\\([A-Za-z]+|[^\r\n])/u.exec(source.slice(index));
            if (!token) return fail('unfinished-command');
            const command = token[1];
            const end = index + token[0].length;
            if (command === 'left') leftRightDepth++;
            if (command === 'right' && --leftRightDepth < 0) return fail('unmatched-delimiter-size');
            if (command === 'begin' || command === 'end') {
                let start = end;
                while (/\s/u.test(source[start] || '') && start < source.length) start++;
                const group = groupAt(source, start);
                if (!group) return fail('invalid-environment');
                if (command === 'begin') {
                    environments.push(group.content);
                    if (environments.length + brackets.length > MAX_DEPTH) return fail('nesting-limit');
                } else if (environments.pop() !== group.content) return fail('mismatched-environment');
                index = group.end;
                continue;
            }
            if (command === '{') brackets.push('\\}');
            else if (command === '}') { if (brackets.pop() !== '\\}') return fail('mismatched-bracket'); }
            else if (top && command === '\\') {
                let rowEnd = end;
                const spacing = /^\s*\[(?:[+-]?(?:\d+(?:\.\d+)?|\.\d+))(?:pt|em|ex|mm|cm)\]/u.exec(source.slice(end));
                if (spacing) rowEnd += spacing[0].length;
                result.cuts.push({ start: index, end: rowEnd, kind: 'row' });
                index = rowEnd;
                continue;
            } else if (top && SPACING_COMMAND.test(command)) result.cuts.push({ start: index, end, kind: 'spacing' });
            else if (top && command === 'mid' && !result.operation && /^(?:[+\-:/*]|\\(?:cdot|times|div)(?![A-Za-z]))/u.test(source.slice(end).trim())) {
                result.operation = { start: index, end };
            }
            index = end;
            continue;
        }
        const groupedEquality = top && groupedEqualities.get(index);
        if (groupedEquality) {
            result.equalities.push({ start: index, end: groupedEquality.end, kind: 'column' });
            index = groupedEquality.end;
            continue;
        }
        if ('{(['.includes(ch)) {
            brackets.push(ch === '{' ? '}' : ch === '(' ? ')' : ']');
            if (brackets.length + environments.length > MAX_DEPTH) return fail('nesting-limit');
        } else if ('})]'.includes(ch)) {
            if (brackets.pop() !== ch) return fail('mismatched-bracket');
        } else if (top) {
            if (ch === '=') {
                if (/[=<>!:]/u.test(source[index - 1] || '') || source[index + 1] === '=') return fail('unsupported-relation');
                result.equalities.push({ start: index, end: index + 1, kind: 'column' });
            } else if (ch === ';') result.cuts.push({ start: index, end: index + 1, kind: 'semicolon' });
            else if (ch === '&') result.cuts.push({ start: index, end: index + 1, kind: 'column' });
            else if (ch === ',') {
                const nextAssignment = /^(\s*(?:\\(?:quad|qquad)(?![A-Za-z])\s*)*)[A-Za-z](?:_(?:\{[A-Za-z0-9,]+\}|[A-Za-z0-9]))?\s*=/u.exec(source.slice(index + 1));
                if (nextAssignment) {
                    result.cuts.push({ start: index, end: index + 1 + nextAssignment[1].length, kind: 'comma' });
                    index += nextAssignment[1].length;
                }
            } else if (ch === '|') {
                if (plainBars % 2 === 0 && !result.operation && /^(?:[+\-:/*]|\\(?:cdot|times|div)(?![A-Za-z]))/u.test(source.slice(index + 1).trim())) {
                    result.operation = { start: index, end: index + 1 };
                } else plainBars++;
            }
        }
        index++;
    }
    return brackets.length || environments.length || leftRightDepth ? fail('unclosed-structure') : result;
}

function splitAt(source: string, cuts: readonly Cut[]): string[] {
    const parts: string[] = [];
    let start = 0;
    for (const cut of cuts) { parts.push(source.slice(start, cut.start)); start = cut.end; }
    parts.push(source.slice(start));
    return parts;
}

type Prefix = { body: string; label?: string; roleHint?: CalculationRoleHint };
function labelValue(value: string): { label: string; roleHint?: CalculationRoleHint } | null {
    const label = value.trim().replace(/^\((.*)\)$/u, '$1').replace(/[.:]$/u, '').trim();
    if (ROMAN.test(label)) return { label };
    const roman = '(?:VIII|VII|III|II|IX|IV|VI|X|V|I)';
    const compact = label.replace(/\s+/gu, '');
    if (new RegExp('^[+-]?[0-9]*' + roman + '(?:[+-][0-9]*' + roman + ')+$').test(compact)) return { label: compact };
    if (new RegExp('^' + roman + '\\s+in\\s+' + roman + '$', 'u').test(label)) {
        return { label: label.replace(/\s+/gu, ' '), roleHint: 'substitution' };
    }
    const roleHint = ROLES[label.toLocaleLowerCase('de')];
    return roleHint ? { label, roleHint } : null;
}
function readPrefix(source: string): Prefix {
    const method = /^([^:]+?)(?::\s*|$)/u.exec(source);
    if (method) {
        const label = labelValue(method[1]);
        if (label && (/[+\-]/u.test(label.label) || label.label.includes(' in '))) {
            return { ...label, body: source.slice(method[0].length) };
        }
    }
    const wrapped = /^\\(text|mathrm|mathbb)\s*/u.exec(source);
    if (wrapped) {
        const group = groupAt(source, wrapped[0].length);
        if (group) {
            const rest = source.slice(group.end);
            const domain = group.content.trim() === 'D' && wrapped[1] === 'mathbb';
            const value = domain ? { label: 'D', roleHint: 'domain' as const } : labelValue(group.content);
            // A roman numeral is a label only with label-like separation.
            // \mathrm{I}=2 is still an equation in the variable I.
            if (value && (value.roleHint || !rest.trim() || /[.:]\s*$/u.test(group.content) ||
                /^\s*(?:[:.]|\\quad\b|\\qquad\b)/u.test(rest))) {
                return { ...value, body: rest.replace(/^\s*(?:[:.]|\\quad\b|\\qquad\b)?\s*/u, '') };
            }
        }
    }
    const parenthesized = /^\((I|II|III|IV|V|VI|VII|VIII|IX|X)\)\s*[:.]?\s*/u.exec(source);
    if (parenthesized) return { label: parenthesized[1], body: source.slice(parenthesized[0].length) };
    const bare = /^([A-Za-zÄÖÜäöüß]+)([.:]?)(\s*)/u.exec(source);
    if (bare) {
        const value = labelValue(bare[1]);
        const rest = source.slice(bare[0].length);
        if (value && (value.roleHint || bare[2] || !rest)) return { ...value, body: rest };
        if (bare[1] === 'D' && (bare[2] || !rest || /^\s*=\s*(?:\\(?:mathbb|mathds|mathbf)\b|[ℝℤℕℚℂ]|\\\{)/u.test(rest))) {
            return { label: 'D', roleHint: 'domain', body: rest };
        }
    }
    return { body: source };
}
function withSource(statement: CalculationStatement, source: string, prefix: Prefix): CalculationStatement {
    return { ...statement, source, ...(prefix.label ? { label: prefix.label } : {}), ...(prefix.roleHint ? { roleHint: prefix.roleHint } : {}) };
}
function isRelation(statement: CalculationStatement): boolean {
    return statement.kind === 'equation' || statement.kind === 'equality-chain';
}

function parseEnvironmentRow(source: string, depth: number): CalculationStatement {
    const scanned = scan(source);
    if (scanned.error) return unsupported(source, scanned.error);
    const cuts = scanned.cuts.filter(cut => cut.kind === 'column');
    if (!cuts.length) return parseStatement(source, depth + 1);
    const cells = splitAt(source, cuts);
    let label: string | undefined;
    if (cells.length > 1) {
        const first = readPrefix(cells[0].trim());
        if (first.label && !first.body && !first.roleHint) { label = first.label; cells.shift(); }
        const last = readPrefix(cells[cells.length - 1].trim());
        if (!label && last.label && !last.body && !last.roleHint) { label = last.label; cells.pop(); }
    }
    const members: CalculationStatement[] = [];
    for (let index = 0; index < cells.length; index++) {
        let content = cells[index].trim();
        if (!content) return unsupported(source, 'empty-alignment-cell');
        if (!scan(content).equalities.length && /^\s*=/u.test(normalizeTopLevelEqualityGroups(cells[index + 1] || ''))) {
            content += cells[++index].trim();
            if (normalizeTopLevelEqualityGroups(content).endsWith('=') && index + 1 < cells.length) content += cells[++index].trim();
        }
        const member = parseStatement(content, depth + 1);
        if (!isRelation(member) && member.kind !== 'group') return unsupported(source, 'ambiguous-alignment-columns');
        members.push(member);
    }
    if (members.length === 1) return { ...members[0], source, ...(label ? { label } : {}) };
    return { kind: 'group', source, format: 'compound', semantics: 'unspecified', members, ...(label ? { label } : {}) };
}

function parseEnvironment(source: string, body: string, depth: number): CalculationStatement | null {
    let content = body;
    let systemBrace = false;
    const openingBrace = /^\\left\s*\\\{\s*/u.exec(content);
    if (openingBrace) {
        const ending = /\s*\\right\s*\.\s*$/u.exec(content);
        if (!ending) return unsupported(source, 'unclosed-system-brace');
        content = content.slice(openingBrace[0].length, ending.index).trim();
        systemBrace = true;
    }
    const opening = /^\\begin\s*\{(cases|array|aligned)\}/u.exec(content);
    if (!opening) return systemBrace ? unsupported(source, 'unsupported-system-layout') : null;
    const format = opening[1] as 'cases' | 'array' | 'aligned';
    const closing = new RegExp('\\\\end\\s*\\{' + format + '\\}\\s*$').exec(content);
    if (!closing) return unsupported(source, 'unclosed-environment');
    let inner = content.slice(opening[0].length, closing.index);
    if (format === 'array') {
        inner = inner.replace(/^\s+/u, '');
        const columns = groupAt(inner, 0);
        if (!columns || !/^[lcr|\s]+$/u.test(columns.content)) return unsupported(source, 'unsupported-array-columns');
        inner = inner.slice(columns.end);
    }
    const scanned = scan(inner);
    if (scanned.error) return unsupported(source, scanned.error);
    const parts = splitAt(inner, scanned.cuts.filter(cut => cut.kind === 'row'));
    // One conventional terminal row break is harmless; internal empty rows are not discarded.
    if (parts.length > 1 && !parts[parts.length - 1].trim()) parts.pop();
    if (!parts.length || parts.length > MAX_ROWS) return unsupported(source, 'row-limit');
    if (parts.some(part => !part.trim())) return unsupported(source, 'empty-environment-row');
    const members = parts.map(part => parseEnvironmentRow(part, depth + 1));
    if (members.some(member => member.kind === 'unsupported')) return unsupported(source, 'unsupported-environment-member');
    const plainEquations = members.every(member => member.kind === 'equation');
    return { kind: 'group', source, format,
        semantics: (systemBrace || format === 'cases') && plainEquations ? 'system' : 'unspecified', members };
}

function parseStatement(source: string, depth: number): CalculationStatement {
    if (source.length > MAX_LENGTH) return unsupported(source, 'length-limit');
    if (depth > MAX_DEPTH) return unsupported(source, 'nesting-limit');
    const stripLeadingArrow = (value: string): string => value.replace(
        /^(?:(?:⇒|⟹|→|⟶|⇔|⟺|=>|->)|\\(?:Rightarrow|Longrightarrow|rightarrow|longrightarrow|implies|Leftrightarrow|Longleftrightarrow|iff|Rarr|to)(?![A-Za-z]))\s*/u, ''
    ).trim();
    const unwrapped = stripLeadingArrow(removeMathWrapper(source));
    if (!unwrapped) return unsupported(source, 'empty');
    const prefix = readPrefix(unwrapped);
    const body = stripLeadingArrow(prefix.body.trim());
    if (prefix.label && !body) return { kind: 'label', source, label: prefix.label, ...(prefix.roleHint ? { roleHint: prefix.roleHint } : {}) };
    if (prefix.roleHint === 'domain') return withSource(unsupported(source, 'domain-declaration'), source, prefix);
    const environment = parseEnvironment(source, body, depth);
    if (environment) return withSource(environment, source, prefix);
    const scanned = scan(body);
    if (scanned.error) return withSource(unsupported(source, scanned.error), source, prefix);
    if (/\\(?:text|mbox|hbox|verb)\b/u.test(body)) return withSource(unsupported(source, 'unparsed-text'), source, prefix);
    if (scanned.cuts.some(cut => cut.kind === 'row' || cut.kind === 'column') || /\\(?:begin|end)\b/u.test(body)) {
        return withSource(unsupported(source, 'embedded-or-unscoped-layout'), source, prefix);
    }
    const strongCuts = scanned.cuts.filter(cut => cut.kind === 'semicolon' || cut.kind === 'comma');
    const spacingCuts = scanned.cuts.filter(cut => cut.kind === 'spacing');
    const tryCompound = (cuts: Cut[]): CalculationStatement | null => {
        if (!cuts.length) return null;
        const parts = splitAt(body, cuts);
        if (parts.length > MAX_ROWS) return unsupported(source, 'row-limit');
        if (parts.some(part => !part.trim())) return unsupported(source, 'empty-compound-member');
        const members = parts.map(part => parseStatement(part, depth + 1));
        if (!members.every(member => isRelation(member) || member.kind === 'group')) return null;
        return { kind: 'group', source, format: 'compound', semantics: 'unspecified', members };
    };
    if (strongCuts.length) {
        return withSource(tryCompound(strongCuts) || unsupported(source, 'ambiguous-compound'), source, prefix);
    }
    if (spacingCuts.length) {
        const compound = tryCompound(spacingCuts);
        if (compound) return withSource(compound, source, prefix);
    }
    const relationBody = scanned.operation ? body.slice(0, scanned.operation.start).trim() : body;
    const relationScan = scanned.operation ? scan(relationBody) : scanned;
    const operation = scanned.operation ? body.slice(scanned.operation.end).trim() : undefined;
    if (relationScan.error || !relationScan.equalities.length) return withSource(unsupported(source, 'not-an-equation'), source, prefix);
    const cuts = relationScan.equalities;
    const operands = splitAt(relationBody, cuts).map(part => part.trim());
    if (operands.some(part => !part)) return withSource(unsupported(source, 'empty-equation-side'), source, prefix);
    const statement: CalculationStatement = operands.length === 2
        ? { kind: 'equation', source, left: operands[0], right: operands[1], ...(operation ? { operation } : {}) }
        : { kind: 'equality-chain', source, operands, ...(operation ? { operation } : {}) };
    return withSource(statement, source, prefix);
}

export function parseCalculationStatement(source: string): CalculationStatement {
    const original = String(source ?? '');
    const statement = parseStatement(original, 0);
    return logicalRows(statement) > MAX_ROWS ? unsupported(original, 'row-limit') : statement;
}

function logicalRows(statement: CalculationStatement): number {
    return statement.kind === 'group' ? statement.members.reduce((sum, member) => sum + logicalRows(member), 0) : 1;
}

/** Preserve every input line, including headers, blank separators and unparsed prose. */
export function parseCalculationStructure(lines: readonly string[]): CalculationStructure {
    const sourceLines = Array.from(lines);
    const output: CalculationStructure = { sourceLines, rows: [], issues: [] };
    if (sourceLines.some(line => typeof line !== 'string')) { output.issues.push('invalid-lines'); return output; }
    if (sourceLines.length > MAX_ROWS) { output.issues.push('row-limit'); return output; }
    if (sourceLines.reduce((length, line) => length + line.length, Math.max(0, sourceLines.length - 1)) > MAX_LENGTH) { output.issues.push('length-limit'); return output; }
    let count = 0;
    for (let index = 0; index < sourceLines.length; index++) {
        const first = index;
        let source = sourceLines[index];
        // Accumulate an explicitly opened environment, never arbitrary equations.
        if (/\\begin\s*\{/u.test(source)) {
            const openEnvironment = (value: string): boolean => {
                const stack: string[] = [];
                const markers = /\\(begin|end)\s*\{([^{}]+)\}/gu;
                let marker: RegExpExecArray | null;
                while ((marker = markers.exec(value))) {
                    if (marker[1] === 'begin') stack.push(marker[2]);
                    else if (stack.pop() !== marker[2]) return false;
                    if (stack.length > MAX_DEPTH) return false;
                }
                return stack.length > 0;
            };
            while (openEnvironment(source) && index + 1 < sourceLines.length) source += '\n' + sourceLines[++index];
            if (/^\s*\\left\s*\\\{/u.test(source) && /^\s*\\right\s*\.\s*$/u.test(sourceLines[index + 1] || '')) {
                source += '\n' + sourceLines[++index];
            }
        }
        const statement = parseCalculationStatement(source);
        count += logicalRows(statement);
        if (count > MAX_ROWS) { output.rows = []; output.issues.push('row-limit'); return output; }
        output.rows.push({ source, lineIndex: first, lastLineIndex: index,
            sourceLineIndexes: Array.from({ length: index - first + 1 }, (_, offset) => first + offset), statement });
    }
    return output;
}

export function parseCalculationPromptStructure(promptTex: string): CalculationStructure {
    return parseCalculationStructure([String(promptTex ?? '')]);
}
