import assert from 'node:assert/strict';
import test from 'node:test';
import { scanTexMath, classifyMathFeatures, summarizeTexMath } from '../scripts/tex-material-index.mts';

test('source math regions keep original line references across comments and display delimiters', () => {
  const input = '% $not=math$\nText $x=2$ and \\(y=3\\).\n\\[\na=\\frac{1}{2}\n\\]\n$$b=4$$';
  const result = scanTexMath(input);
  assert.deepEqual(result.spans.map(span => [span.text, span.fromLine, span.toLine]),
    [['x=2',2,2],['y=3',2,2],['\na=\\frac{1}{2}\n',3,5],['b=4',6,6]]);
  assert.deepEqual(result.issues, []);
  assert.equal(summarizeTexMath(result).features.fraction.count, 1);
});

test('escaped dollars, percent signs and verbatim examples do not invent math regions', () => {
  const result = scanTexMath(String.raw`Price \$3. \verb|$fake=1$| \verb*+$fake=2$+
\begin{verbatim}
$x=999$
\end{verbatim}
\begin{lstlisting}$x=998$\end{lstlisting}
$25\%=x$ % $invisible$
$x=25$`);
  assert.deepEqual(result.spans.map(span => span.text), [String.raw`25\%=x`, 'x=25']);
  assert.equal(result.spans[1].fromLine, 7);
});

test('nested TeX groups and math inside text remain a single outer region', () => {
  const result = scanTexMath(String.raw`$a=\text{when $x>0$}\frac{1}{2}$`);
  assert.equal(result.spans.length, 1);
  assert.equal(result.spans[0].text, String.raw`a=\text{when $x>0$}\frac{1}{2}`);
  assert.deepEqual(result.issues, []);
});

test('outer align environment includes cases once without duplicate inner spans', () => {
  const result = scanTexMath(String.raw`\begin{align}
x&=\begin{cases}1&x>0\\0&x\le0\end{cases}\\
y&=2
\end{align}`);
  assert.equal(result.spans.length, 1);
  assert.deepEqual(result.issues, []);
  assert.ok(result.spans[0].features.includes('system'));
  assert.equal(result.spans[0].fromLine, 1);
  assert.equal(result.spans[0].toLine, 4);
});

test('malformed and bounded source regions report limitations explicitly', () => {
  assert.ok(scanTexMath('$x=1').issues.some(issue => issue.reason === 'unclosed-math-region'));
  assert.ok(scanTexMath(String.raw`\begin{verbatim}$x=1$`).issues.some(issue => issue.reason === 'unclosed-literal-environment'));
  const limited = scanTexMath('$x=1$ $y=2$', { maxSpans: 1 });
  assert.equal(limited.truncated, true);
  assert.equal(limited.spans.length, 1);
  const long = scanTexMath('$' + 'x'.repeat(100) + '$', { maxSpanChars: 16 });
  assert.equal(long.spans.length, 0);
  assert.ok(long.issues.some(issue => issue.reason === 'math-region-too-large'));
});

test('feature tags preserve mathematical symbols and respect TeX command boundaries', () => {
  const features = classifyMathFeatures(String.raw`x_{1,2}=\frac{-b\pm\sqrt{b^2-4ac}}{2a}\cdot 1`);
  for (const name of ['equation','subscript','fraction','plus-minus','root','power','multiplication-dot']) assert.ok(features.includes(name as any),name);
  assert.equal(features.includes('multiplication-cross'), false);
  assert.deepEqual(classifyMathFeatures(String.raw`\sinewave+\login+\integer`), []);
  assert.ok(classifyMathFeatures(String.raw`\vec a\times\vec b`).includes('multiplication-cross'));
  assert.ok(classifyMathFeatures(String.raw`\frac{d}{dx}f(x)=\ln x+\int_0^1 x\,dx`).includes('derivative'));
});

test('inventory summaries preserve counts and bound examples without retaining source text', () => {
  const scan = scanTexMath('$x=1$ $y=2$ $z=3$');
  const summary = summarizeTexMath(scan, 2);
  assert.equal(summary.equationRegions, 3);
  assert.equal(summary.features.equation.examples.length, 2);
  assert.match(summary.features.equation.examples[0].sha256, /^[a-f0-9]{64}$/u);
  assert.equal('text' in summary.features.equation.examples[0], false);
});

test('adjacent inline regions are not swallowed as a nested display delimiter', () => {
  const result = scanTexMath('$x$$y$ $$z=1$$');
  assert.deepEqual(result.spans.map(span => span.text), ['x','y','z=1']);
  assert.deepEqual(result.issues, []);
});

test('coverage loss remains explicit for oversized regions and a capped issue list', () => {
  assert.equal(scanTexMath('$12345$', {maxSpanChars: 3}).truncated, true);
  const result = scanTexMath(String.raw`\)`.repeat(1001) + '$x=1$ $y=2$', {maxSpans: 1});
  assert.equal(result.issues.length, 1000);
  assert.equal(result.spans.length, 1);
  assert.equal(result.truncated, true);
});

test('index lists, solution sets and ordinary variable fractions do not inflate feature counts', () => {
  for (const source of [String.raw`x_{1,2}=3`, String.raw`L=\{1,2\}`]) {
    assert.equal(classifyMathFeatures(source).includes('decimal-comma'), false, source);
  }
  for (const source of ['1,5x=3', String.raw`L=\{1{,}5\}`]) {
    assert.equal(classifyMathFeatures(source).includes('decimal-comma'), true, source);
  }
  for (const source of [String.raw`v=\frac{d}{t}`, String.raw`\frac{d+1}{2}=3`]) {
    assert.equal(classifyMathFeatures(source).includes('derivative'), false, source);
  }
  for (const source of [String.raw`\frac{d}{dx}f(x)`, String.raw`\frac{\mathrm{d}f}{\mathrm{d}t}`,
    String.raw`\frac{d^2f}{dx^2}`]) {
    assert.equal(classifyMathFeatures(source).includes('derivative'), true, source);
  }
});


test('nested explicit sets and indices exclude list commas while retaining protected decimals', () => {
  for (const source of [String.raw`L=\{1,2,\sqrt{3}\}`, String.raw`L=\left\{1,2,\frac{1}{3}\right\}`,
    String.raw`x_{1,{2,3}}=4`, String.raw`L=\{1,\{2,3\}\}`]) {
    assert.equal(classifyMathFeatures(source).includes('decimal-comma'), false, source);
  }
  for (const source of [String.raw`L=\{1{,}5,\sqrt{3}\}`, String.raw`L=\{1,\sqrt{3}\};x=2,5`, 'x=2,5']) {
    assert.equal(classifyMathFeatures(source).includes('decimal-comma'), true, source);
  }
});

test('empty dollar-only table cells are skipped with explicit counts and preserve following mathematics', () => {
  const source=String.raw`\begin{tabular}{|c|c|c|}
$52893$ & $$ & $$ \\ \hline
$159423$ & $$ & $$ \\
\end{tabular}
\begin{align*}x&=\frac{1}{2}\end{align*}`;
  const scan=scanTexMath(source);
  assert.deepEqual(scan.spans.map(span=>span.text), ['52893','159423',String.raw`x&=\frac{1}{2}`]);
  assert.equal(scan.skippedRegions.emptyTableCells,4);
  assert.equal(scan.issueCount,0);
  assert.equal(scan.truncated,false);
  assert.equal(summarizeTexMath(scan).skippedRegions.emptyTableCells,4);
  for (const [name,args] of [['tabular','[t]{cc}'],['tabular*','{10cm}[t]{cc}'],['tabularx','{10cm}[b]{XX}']]) {
    const result=scanTexMath(String.raw`\begin{${name}}${args} $$ & $$ \tabularnewline \end{${name}} $x=1$`);
    assert.deepEqual(result.spans.map(span=>span.text),['x=1']);
    assert.equal(result.skippedRegions.emptyTableCells,2,name);
    assert.equal(result.issueCount,0,name);
  }
});

test('table exception cannot reinterpret genuine display math or nonempty and escaped cells', () => {
  for (const source of [String.raw`$$x=1$$`,String.raw`\begin{tabular}{c}$$x=1$$\end{tabular}`,
    '\\begin{tabular}{c}$$\nx=1\n$$\\end{tabular}',String.raw`\begin{tabular}{c}text $$x=1$$\end{tabular}`,
    String.raw`\begin{tabular}{c}\& $$x=1$$\end{tabular}`]) {
    const result=scanTexMath(source);
    assert.equal(result.spans.length,1,source);
    assert.equal(result.skippedRegions.emptyTableCells,0,source);
    assert.equal(result.spans[0].text.trim(),'x=1',source);
    assert.equal(result.issueCount,0,source);
  }
  const outside=scanTexMath('Text $$ & $$');
  assert.equal(outside.skippedRegions.emptyTableCells,0);
  assert.deepEqual(outside.spans.map(span=>span.text),[' & ']);
  const adjacent=scanTexMath(String.raw`\begin{tabular}{cc}$x$$y$ & $z$\end{tabular}`);
  assert.deepEqual(adjacent.spans.map(span=>span.text),['x','y','z']);
});

test('only confirmed TikZ path coordinates are excluded, preserving mathematical node labels', () => {
  const source=String.raw`\begin{tikzpicture}
\draw ($(node)+(0,2pt)$) -- (0,0) node {$x=1,5$};
\node at (0,0) {($(x)+(0,2)$)};
\end{tikzpicture}
\tikzset{example/.code={\draw ($(a)+(0,2pt)$) -- (1,1);}}
\pgfextra{\begin{pgfinterruptpath}\draw ($(\tikzlastnode.south west)+(0,2pt)$);\end{pgfinterruptpath}}
Outside ($(x)+(0,2)$)`;
  const result=scanTexMath(source);
  assert.equal(result.skippedRegions.tikzCoordinateCalculations,3);
  assert.deepEqual(result.spans.map(span=>span.text),['x=1,5','(x)+(0,2)','(x)+(0,2)']);
  assert.equal(result.issueCount,0);
  const unconfirmed=scanTexMath(String.raw`\draw ($(node)+(0,2pt)$);`);
  assert.equal(unconfirmed.skippedRegions.tikzCoordinateCalculations,0);
  assert.equal(unconfirmed.spans.length,1);
});

test('complete issue aggregates survive the bounded examples list', () => {
  const result=scanTexMath(String.raw`\)`.repeat(1001)+'$x=1$ $y=2$',{maxSpans:1});
  assert.equal(result.issues.length,1000);
  assert.equal(result.issueCount,1002);
  assert.deepEqual(result.issueCounts,{'unmatched-math-close':1001,'math-region-count-limit':1});
  assert.equal(result.truncated,true);
  assert.equal(summarizeTexMath(result).issueCount,1002);
});


test('empty dollar-only TikZ labels and color groups cannot swallow subsequent text formulas', () => {
  const source=String.raw`\begin{tikzpicture}
\node at (0,0) {\textcolor[rgb]{1,0,0}{$$}};
\node at (1,0) { $$ };
\node at (2,0) {$$x=1$$};
\node at (3,0) {$y=2$};
\end{tikzpicture}
Die $8$ passt $\fib{10}$-mal in die $2$.`;
  const result=scanTexMath(source);
  assert.equal(result.skippedRegions.emptyTikzGroups,2);
  assert.deepEqual(result.spans.map(span=>span.text),['x=1','y=2','8',String.raw`\fib{10}`,'2']);
  assert.equal(result.issueCount,0);
  assert.equal(result.truncated,false);
  assert.equal(scanTexMath(String.raw`\textcolor{red}{$$}`).skippedRegions.emptyTikzGroups,0);
});


test('a malformed TikZ label is discarded at its closing group without swallowing later tasks', () => {
  const source=String.raw`\begin{tikzpicture}
\node at (0.75,-0.75) {$\footnotesize$\fib{\,3\,}$$};
\node at (1.25,-0.75) {$9$};
\end{tikzpicture}
Die $8$ passt $\fib{10}$-mal in die $2$.
\begin{align*}2x&=4\\x&=2\end{align*}`;
  const result=scanTexMath(source);
  assert.deepEqual(result.spans.map(span=>span.text),[String.raw`\footnotesize`,'9','8',String.raw`\fib{10}`,'2',String.raw`2x&=4\\x&=2`]);
  assert.equal(result.issueCount,2);
  assert.equal(result.issueCounts['discarded-malformed-math-region'],1);
  assert.equal(result.issueCounts['unbalanced-math-braces'],1);
  assert.equal(result.truncated,true);
  assert.equal(result.issues.find(issue=>issue.reason==='discarded-malformed-math-region')?.line,2);
  const nested=scanTexMath(String.raw`$a=\text{when $x>0$}\frac{1}{2}$`);
  assert.equal(nested.spans.length,1);
  assert.equal(nested.issueCount,0);
});
