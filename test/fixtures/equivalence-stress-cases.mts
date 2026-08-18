export type EquivalenceStressLine = {
  main: string;
  operation?: string;
  rendered: string;
};

export type EquivalenceStressCase = {
  id: string;
  title: string;
  source: string;
  lines: EquivalenceStressLine[];
};

export const equivalenceStressCases: EquivalenceStressCase[] = [
  {
    id: 'addition',
    title: 'Addition in two lines',
    source: 'Aufgabe_0011.md:L75-L83',
    lines: [
      { main: 'x-4=9', operation: '+4', rendered: 'x-4&=9 \\mid +4' },
      { main: 'x=13', rendered: 'x&=13' },
    ],
  },
  {
    id: 'fraction-swapped-sides',
    title: 'Fraction with swapped sides',
    source: 'Aufgabe_0011.md:L134-L142',
    lines: [
      { main: '7=\\frac{x}{6}', operation: '\\cdot 6', rendered: '7&=\\frac{x}{6} \\mid \\cdot 6' },
      { main: '42=x', rendered: '42&=x' },
    ],
  },
  {
    id: 'variable-both-sides',
    title: 'Variable on both sides',
    source: 'Aufgabe_0015.md:L105-L115',
    lines: [
      { main: '5x-12=3x+6', operation: '-3x', rendered: '5x-12&=3x+6 \\mid -3x' },
      { main: '2x-12=6', operation: '+12', rendered: '2x-12&=6 \\mid +12' },
      { main: '2x=18', operation: ':2', rendered: '2x&=18 \\mid :2' },
      { main: 'x=9', rendered: 'x&=9' },
    ],
  },
  {
    id: 'collect-terms',
    title: 'Collect terms on both sides',
    source: 'Aufgabe_0017.md:L105-L116',
    lines: [
      { main: '3x+5+x=2x+17-x', rendered: '3x+5+x&=2x+17-x' },
      { main: '4x+5=x+17', operation: '-x', rendered: '4x+5&=x+17 \\mid -x' },
      { main: '3x+5=17', operation: '-5', rendered: '3x+5&=17 \\mid -5' },
      { main: '3x=12', operation: ':3', rendered: '3x&=12 \\mid :3' },
      { main: 'x=4', rendered: 'x&=4' },
    ],
  },
  {
    id: 'parentheses-fraction-result',
    title: 'Expand parentheses and produce a fraction',
    source: 'Aufgabe_0019.md:L72-L83',
    lines: [
      { main: '4(2x-3)=2x+10', rendered: '4(2x-3)&=2x+10' },
      { main: '8x-12=2x+10', operation: '-2x', rendered: '8x-12&=2x+10 \\mid -2x' },
      { main: '6x-12=10', operation: '+12', rendered: '6x-12&=10 \\mid +12' },
      { main: '6x=22', operation: ':6', rendered: '6x&=22 \\mid :6' },
      { main: 'x=\\frac{11}{3}', rendered: 'x&=\\frac{11}{3}' },
    ],
  },
  {
    id: 'parentheses-many-fractions',
    title: 'Parentheses with several fractions',
    source: 'Aufgabe_0021.md:L184-L195',
    lines: [
      {
        main: '2(x+\\frac{3}{2})=\\frac{1}{2}x+5',
        rendered: '2(x+\\frac{3}{2})&=\\frac{1}{2}x+5',
      },
      {
        main: '2x+3=\\frac{1}{2}x+5',
        operation: '-\\frac{1}{2}x',
        rendered: '2x+3&=\\frac{1}{2}x+5 \\mid -\\frac{1}{2}x',
      },
      { main: '\\frac{3}{2}x+3=5', operation: '-3', rendered: '\\frac{3}{2}x+3&=5 \\mid -3' },
      {
        main: '\\frac{3}{2}x=2',
        operation: ':\\frac{3}{2}',
        rendered: '\\frac{3}{2}x&=2 \\mid :\\frac{3}{2}',
      },
      { main: 'x=\\frac{4}{3}', rendered: 'x&=\\frac{4}{3}' },
    ],
  },
  {
    id: 'negative-fractions',
    title: 'Negative fractions',
    source: 'Aufgabe_0022.md:L75-L86',
    lines: [
      {
        main: '7x+\\frac{1}{2}=3x-\\frac{7}{2}',
        operation: '-3x',
        rendered: '7x+\\frac{1}{2}&=3x-\\frac{7}{2} \\mid -3x',
      },
      {
        main: '4x+\\frac{1}{2}=-\\frac{7}{2}',
        operation: '-\\frac{1}{2}',
        rendered: '4x+\\frac{1}{2}&=-\\frac{7}{2} \\mid -\\frac{1}{2}',
      },
      { main: '4x=-\\frac{8}{2}', rendered: '4x&=-\\frac{8}{2}' },
      { main: '4x=-4', operation: ':4', rendered: '4x&=-4 \\mid :4' },
      { main: 'x=-1', rendered: 'x&=-1' },
    ],
  },
  {
    id: 'capstone',
    title: 'Seven-line capstone',
    source: 'Aufgabe_0024.md:L217-L230',
    lines: [
      {
        main: '2(x-\\frac{3}{2})+\\frac{1}{3}=\\frac{5}{3}x-1',
        rendered: '2(x-\\frac{3}{2})+\\frac{1}{3}&=\\frac{5}{3}x-1',
      },
      {
        main: '2x-3+\\frac{1}{3}=\\frac{5}{3}x-1',
        rendered: '2x-3+\\frac{1}{3}&=\\frac{5}{3}x-1',
      },
      {
        main: '2x-\\frac{8}{3}=\\frac{5}{3}x-1',
        operation: '-\\frac{5}{3}x',
        rendered: '2x-\\frac{8}{3}&=\\frac{5}{3}x-1 \\mid -\\frac{5}{3}x',
      },
      {
        main: '(2-\\frac{5}{3})x-\\frac{8}{3}=-1',
        rendered: '(2-\\frac{5}{3})x-\\frac{8}{3}&=-1',
      },
      {
        main: '\\frac{1}{3}x-\\frac{8}{3}=-1',
        operation: '+\\frac{8}{3}',
        rendered: '\\frac{1}{3}x-\\frac{8}{3}&=-1 \\mid +\\frac{8}{3}',
      },
      {
        main: '\\frac{1}{3}x=\\frac{5}{3}',
        operation: ':\\frac{1}{3}',
        rendered: '\\frac{1}{3}x&=\\frac{5}{3} \\mid :\\frac{1}{3}',
      },
      { main: 'x=5', rendered: 'x&=5' },
    ],
  },
];

export function stressCaseLatex(testCase: EquivalenceStressCase): string {
  if (testCase.lines.length === 1) return testCase.lines[0]?.rendered ?? '';
  return '\\begin{aligned} ' + testCase.lines.map(line => line.rendered).join(' \\\\ ') + ' \\end{aligned}';
}

export function stressCaseResponses(testCase: EquivalenceStressCase): string[] {
  return testCase.lines.flatMap(line => line.operation
    ? [line.main, line.operation]
    : [line.main]);
}

export const equivalenceStressTotals = equivalenceStressCases.reduce(
  (totals, testCase) => {
    totals.lines += testCase.lines.length;
    totals.operations += testCase.lines.filter(line => Boolean(line.operation)).length;
    totals.recognitions += stressCaseResponses(testCase).length;
    return totals;
  },
  { cases: equivalenceStressCases.length, lines: 0, operations: 0, recognitions: 0 },
);
