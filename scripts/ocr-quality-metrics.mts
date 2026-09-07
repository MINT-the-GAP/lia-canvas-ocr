/** Transcription metrics only: never evaluates equations or invokes a CAS. */
const MAX_CHARS = 16_384;
const MAX_TOKENS = 2_048;
const MAX_DEPTH = 32;
const TEXT_COMMANDS = new Set('text textrm textbf textit textsf texttt mbox hbox operatorname'.split(' '));
const ONE_ARGUMENT = new Set('mathrm mathbf mathit mathsf mathtt mathcal mathbb mathds boldsymbol vec overrightarrow hat widehat bar overline underline tilde widetilde dot ddot'.split(' '));
const SYMBOL_COMMANDS = new Set(('alpha beta gamma delta epsilon varepsilon zeta eta theta vartheta iota kappa lambda mu nu xi omicron pi varpi rho varrho sigma varsigma tau upsilon phi varphi chi psi omega Gamma Delta Theta Lambda Xi Pi Sigma Upsilon Phi Psi Omega '
    + 'cdot times div pm mp mid le leq ge geq ne neq approx sim simeq equiv propto in notin ni subset subseteq supset supseteq cup cap setminus land lor neg forall exists emptyset varnothing infty partial nabla '
    + 'sin cos tan cot sec csc arcsin arccos arctan sinh cosh tanh log ln exp lim min max det gcd '
    + 'sum prod int iint iiint oint bigcup bigcap ldots cdots vdots ddots dots prime circ degree top bot '
    + 'Rightarrow Longrightarrow rightarrow longrightarrow Leftrightarrow Longleftrightarrow leftarrow Leftarrow to Rarr implies iff '
    + 'quad qquad enspace thinspace medspace thickspace displaystyle textstyle scriptstyle scriptscriptstyle').split(' '));
const ENVIRONMENTS = new Set('cases array aligned align align* gathered gather gather* split matrix pmatrix bmatrix Bmatrix vmatrix Vmatrix smallmatrix equation equation*'.split(' '));
const CLOSE: Record<string, string> = { '{': '}', '(': ')', '[': ']' };
const DELIMITERS = new Set(['(', ')', '[', ']', '\\{', '\\}', '|', '\\vert', '\\lvert', '\\rvert', '\\Vert', '\\lVert', '\\rVert', '.']);
const CONTROL = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f\ufffd]/u;

function lex(source: string): string[] {
    if (typeof source !== 'string' || source.length > MAX_CHARS) throw new RangeError('OCR comparison input exceeds the character limit.');
    const tokens: string[] = [];
    for (let index = 0; index < source.length;) {
        if (/\s/u.test(source[index])) { index++; continue; }
        const start = index;
        if (source[index] === '\\') {
            const command = /^\\([A-Za-z]+|[^\r\n])/u.exec(source.slice(index));
            if (command) {
                index += command[0].length;
                if (TEXT_COMMANDS.has(command[1])) {
                    let opening = index;
                    while (/\s/u.test(source[opening] || '') && opening < source.length) opening++;
                    if (source[opening] === '{') {
                        let depth = 1, cursor = opening + 1;
                        for (; cursor < source.length && depth; cursor++) {
                            if (source[cursor] === '\\') { cursor++; continue; }
                            if (source[cursor] === '{' && ++depth > MAX_DEPTH) throw new RangeError('OCR text nesting exceeds the depth limit.');
                            if (source[cursor] === '}') depth--;
                        }
                        if (!depth) {
                            tokens.push(command[0] + source.slice(opening, cursor));
                            index = cursor;
                            if (tokens.length > MAX_TOKENS) throw new RangeError('OCR comparison input exceeds the token limit.');
                            continue;
                        }
                    }
                }
                tokens.push(command[0]);
            } else { tokens.push(source[index++]); }
        } else {
            const code = source.codePointAt(index)!;
            index += code > 0xffff ? 2 : 1;
            tokens.push(source.slice(start, index));
        }
        if (tokens.length > MAX_TOKENS) throw new RangeError('OCR comparison input exceeds the token limit.');
    }
    return tokens;
}

/** Remove sizing commands only after their explicit pairs and delimiters check out. */
function withoutSizing(tokens: readonly string[]): string[] | null {
    const result: string[] = [];
    const stack: { depth: number; delimiter: string }[] = [];
    let depth = 0;
    for (let index = 0; index < tokens.length; index++) {
        const token = tokens[index];
        if (token === '{') depth++;
        if (token === '}') depth--;
        if (token !== '\\left' && token !== '\\right') { result.push(token); continue; }
        const delimiter = tokens[++index];
        if (!DELIMITERS.has(delimiter)) return null;
        if (token === '\\left') stack.push({ depth, delimiter });
        else {
            const left = stack.pop();
            if (!left || left.depth !== depth) return null;
            const pairs: Record<string, string> = { '(': ')', '[': ']', '\\{': '\\}', '|': '|', '\\vert': '\\vert', '\\lvert': '\\rvert', '\\Vert': '\\Vert', '\\lVert': '\\rVert' };
            if (left.delimiter !== '.' && delimiter !== '.' && pairs[left.delimiter] !== delimiter) return null;
        }
        if (stack.length > MAX_DEPTH) return null;
        if (delimiter !== '.') result.push(delimiter);
    }
    return stack.length ? null : result;
}

class TypographyParser {
    private index = 0;
    private depth = 0;
    private readonly tokens: readonly string[];
    constructor(tokens: readonly string[]) { this.tokens = tokens; }
    private peek(): string { return this.tokens[this.index] || ''; }
    private take(): string { return this.tokens[this.index++] || ''; }
    parse(): string[] | null {
        const result = this.sequence();
        return result?.length && this.index === this.tokens.length ? result : null;
    }
    private sequence(close?: string): string[] | null {
        if (++this.depth > MAX_DEPTH) return null;
        const result: string[] = [];
        let canScript = false, scripts = '';
        while (this.index < this.tokens.length && this.peek() !== close) {
            const token = this.peek();
            if (token === '^' || token === '_') {
                if (!canScript || scripts.includes(token)) return null;
                this.take(); scripts += token;
                const argument = this.argument(true);
                if (!argument) return null;
                result.push(token, ...argument);
                continue;
            }
            if (['=', '<', '>'].includes(token) && ['=', '<', '>'].includes(result[result.length - 1])) return null;
            const atom = this.atom();
            if (!atom) return null;
            result.push(...atom);
            canScript = !/^(?:[+=,:;*/<>-]|\\(?:cdot|times|div|pm|mp)|&|\\\\)$/u.test(token);
            scripts = '';
        }
        if (result.length && /^(?:[+=,:*/<>-]|\\(?:cdot|times|div|pm|mp))$/u.test(result[result.length - 1])) return null;
        if (close && this.take() !== close) return null;
        this.depth--;
        return result;
    }
    private argument(canonical: boolean): string[] | null {
        if (!this.peek() || ['^', '_', '}', ')', ']', '\\}', '\\end', '=', '&', '\\\\'].includes(this.peek())) return null;
        if (this.peek() === '{') {
            this.take();
            const content = this.sequence('}');
            return content?.length ? ['{', ...content, '}'] : null;
        }
        // An unbraced TeX argument consumes one token, never a whole number or word.
        const token = this.peek();
        if (['+', '-', '*', '/', ':', ',', '<', '>'].includes(token)) return null;
        if (CLOSE[token] || ONE_ARGUMENT.has(token.slice(1)) || ['\\frac', '\\dfrac', '\\tfrac', '\\sqrt', '\\begin'].includes(token)) return null;
        const atom = this.atom();
        return atom ? canonical ? ['{', ...atom, '}'] : atom : null;
    }
    private atom(): string[] | null {
        const token = this.take();
        if (!token || ['}', ')', ']', '^', '_', '$', '%', '#', '\\', '\\end'].includes(token)) return null;
        if (CLOSE[token]) {
            const content = this.sequence(CLOSE[token]);
            return content ? [token, ...content, CLOSE[token]] : null;
        }
        if (!token.startsWith('\\')) return [token];
        const name = token.slice(1);
        const textCommand = /^\\([A-Za-z]+)\{/u.exec(token);
        if (textCommand && TEXT_COMMANDS.has(textCommand[1])) return [token];
        if (name === 'begin') {
            if (this.take() !== '{') return null;
            let environment = '';
            while (this.peek() && this.peek() !== '}') environment += this.take();
            if (this.take() !== '}' || !ENVIRONMENTS.has(environment)) return null;
            const columns: string[] = [];
            if (environment === 'array') {
                if (this.take() !== '{') return null;
                while (this.peek() && this.peek() !== '}') columns.push(this.take());
                if (this.take() !== '}' || !/^[lcr|]+$/u.test(columns.join(''))) return null;
            }
            const content = this.sequence('\\end');
            if (!content?.length || this.take() !== '{') return null;
            let ended = '';
            while (this.peek() && this.peek() !== '}') ended += this.take();
            if (this.take() !== '}' || ended !== environment) return null;
            return ['\\begin', '{', ...environment, '}', ...(columns.length ? ['{', ...columns, '}'] : []), ...content, '\\end', '{', ...ended, '}'];
        }
        if (name === 'frac' || name === 'dfrac' || name === 'tfrac') {
            const numerator = this.argument(false), denominator = this.argument(false);
            return numerator && denominator ? ['\\frac', ...numerator, ...denominator] : null;
        }
        if (name === 'sqrt') {
            let index: string[] = [];
            if (this.peek() === '[') {
                this.take();
                const content = this.sequence(']');
                if (!content?.length) return null;
                index = ['[', ...content, ']'];
            }
            const argument = this.argument(true);
            return argument ? ['\\sqrt', ...index, ...argument] : null;
        }
        if (ONE_ARGUMENT.has(name)) {
            const argument = this.argument(false);
            return argument ? [token, ...argument] : null;
        }
        if (SYMBOL_COMMANDS.has(name) || DELIMITERS.has(token) || ['\\,', '\\;', '\\:', '\\!', '\\ ', '\\\\', '\\%', '\\&', '\\#', '\\_'].includes(token)) return [token];
        return null;
    }
}

function normalizedTokens(source: string): string[] | null {
    if (CONTROL.test(source)) return null;
    const raw = lex(source);
    const tokens = withoutSizing(raw);
    if (!tokens) return null;
    const result = new TypographyParser(tokens).parse();
    if (result && result.length > MAX_TOKENS) throw new RangeError('Normalized OCR comparison exceeds the token limit.');
    return result;
}
function render(tokens: readonly string[]): string {
    return tokens.map((token, index) => token + (/^\\[A-Za-z]+$/u.test(token) && /^[A-Za-z]/u.test(tokens[index + 1] || '') ? ' ' : '')).join('');
}

/** null means malformed, unsupported or over-budget TeX; no equation is repaired. */
export function normalizeOcrTexForComparison(tex: string): string | null {
    try {
        const tokens = normalizedTokens(tex);
        return tokens ? render(tokens) : null;
    } catch (error) {
        if (error instanceof RangeError) return null;
        throw error;
    }
}

function edits(first: readonly string[], second: readonly string[]): number {
    if (first.length < second.length) return edits(second, first);
    const row = Array.from({ length: second.length + 1 }, (_, index) => index);
    for (let i = 1; i <= first.length; i++) {
        let diagonal = row[0]; row[0] = i;
        for (let j = 1; j <= second.length; j++) {
            const previous = row[j];
            row[j] = Math.min(row[j] + 1, row[j - 1] + 1, diagonal + (first[i - 1] === second[j - 1] ? 0 : 1));
            diagonal = previous;
        }
    }
    return row[second.length];
}

/** Token counts, not tokenizer-model IDs. RangeError declines excessive DP work. */
export function compareOcrTex(expected: string, actual: string) {
    const expectedRaw = lex(expected), actualRaw = lex(actual);
    const expectedNormalized = normalizedTokens(expected), actualNormalized = normalizedTokens(actual);
    const expectedTokens = expectedNormalized || expectedRaw;
    const actualTokens = actualNormalized || actualRaw;
    const tokenEdits = edits(expectedTokens, actualTokens);
    return {
        rawExact: expected === actual,
        normalizedExact: expectedNormalized !== null && actualNormalized !== null && render(expectedNormalized) === render(actualNormalized),
        expectedTokens: expectedTokens.length, actualTokens: actualTokens.length,
        tokenEdits, tokenErrorRate: tokenEdits / Math.max(1, expectedTokens.length),
    };
}

export type OcrQualityRecord = {
    caseId: string;
    split: 'development' | 'holdout';
    expected: string;
    actual: string;
    wallMs: number;
    gradeAccepted: boolean | null;
    expectedGradeAccepted: boolean | null;
    status?: 'ok' | 'missing' | 'failed';
};

function summarize(records: readonly OcrQualityRecord[]) {
    let rawMatches = 0, normalizedMatches = 0, expectedTokens = 0, actualTokens = 0, tokenEdits = 0, unscored = 0;
    let failed = 0, missing = 0, expectedGrades = 0, observedGrades = 0, correctGrades = 0;
    const times: number[] = [];
    for (const record of records) {
        const status = record.status || 'ok';
        if (status === 'failed') failed++;
        if (status === 'missing') missing++;
        try {
            const result = compareOcrTex(record.expected, status === 'ok' ? record.actual : '');
            rawMatches += status === 'ok' && result.rawExact ? 1 : 0;
            normalizedMatches += status === 'ok' && result.normalizedExact ? 1 : 0;
            expectedTokens += result.expectedTokens; actualTokens += result.actualTokens; tokenEdits += result.tokenEdits;
        } catch (error) {
            if (!(error instanceof RangeError)) throw error;
            unscored++;
        }
        if (record.expectedGradeAccepted !== null) {
            expectedGrades++;
            if (status === 'ok' && record.gradeAccepted !== null) {
                observedGrades++;
                if (record.gradeAccepted === record.expectedGradeAccepted) correctGrades++;
            }
        }
        if (status === 'ok' && Number.isFinite(record.wallMs) && record.wallMs >= 0) times.push(record.wallMs);
    }
    times.sort((a, b) => a - b);
    const middle = Math.floor(times.length / 2);
    return {
        total: records.length,
        completed: records.length - missing - failed,
        missing, failed,
        transcription: {
            rawExact: { matches: rawMatches, total: records.length, rate: records.length ? rawMatches / records.length : null },
            normalizedExact: { matches: normalizedMatches, total: records.length, rate: records.length ? normalizedMatches / records.length : null },
            expectedTokens, actualTokens, tokenEdits,
            // Never report a deceptively low pooled error rate after omitting an over-budget result.
            tokenErrorRate: unscored ? null : records.length ? tokenEdits / Math.max(1, expectedTokens) : null,
            unscored,
        },
        grading: { expected: expectedGrades, observed: observedGrades, correct: correctGrades,
            accuracy: expectedGrades ? correctGrades / expectedGrades : null },
        wallMs: { count: times.length, excluded: records.length - times.length,
            median: !times.length ? null : times.length % 2 ? times[middle] : times[middle - 1] + (times[middle] - times[middle - 1]) / 2,
            p95: times.length ? times[Math.ceil(times.length * 0.95) - 1] : null },
    };
}

/** Supply one record per planned run, including missing/failed runs with actual: ''. */
export function summarizeOcrQuality(records: readonly OcrQualityRecord[]) {
    return {
        overall: summarize(records),
        bySplit: {
            development: summarize(records.filter(record => record.split === 'development')),
            holdout: summarize(records.filter(record => record.split === 'holdout')),
        },
    };
}