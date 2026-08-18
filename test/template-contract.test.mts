import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const readUtf8 = (url: URL): string => readFileSync(url, 'utf8');

const readme = readUtf8(new URL('../README.md', import.meta.url));
const localTemplate = readUtf8(
  new URL('./fixtures/lia-canvas-ocr-local.md', import.meta.url),
);
const calculationCourse = readUtf8(
  new URL('./fixtures/calculation-quiz.md', import.meta.url),
);
const pinnedAlgebriteImport =
  'https://cdn.jsdelivr.net/gh/LiaTemplates/algebrite@0.6.3/README.md';

function berechneOcrMacroBodies(source: string): string[] {
  return [...source.matchAll(
    /^@BerechneOCR_[ \t]*\r?\n([\s\S]*?)^@end[ \t]*$/gm,
  )].map(match => match[1]);
}

test('@BerechneOCR creates one native quiz with the calculation validator', () => {
  const readmeBodies = berechneOcrMacroBodies(readme);
  const localBodies = berechneOcrMacroBodies(localTemplate);
  assert.equal(readmeBodies.length, 2, 'README.md must define and document the macro');
  assert.equal(localBodies.length, 1, 'the local template must define the macro once');
  assert.ok(
    readmeBodies.every(body => body === localBodies[0]),
    'README.md and the routed local template must use the same macro body',
  );

  for (const [name, macroBodies] of [
    ['README.md', readmeBodies],
    ['test/fixtures/lia-canvas-ocr-local.md', localBodies],
  ] as const) {

    for (const body of macroBodies) {
      assert.equal(
        (body.match(/\[\[/gu) ?? []).length,
        1,
        `${name} must generate exactly one native quiz inside @BerechneOCR_`,
      );
      assert.equal(
        (body.match(/<script\b/giu) ?? []).length,
        1,
        `${name} must attach exactly one semantic validator script`,
      );
      assert.match(
        body,
        /<script\b[^>]*\bmodify=[']false['][^>]*>[\s\S]*checkCalculationAnswerByUID\('@0'\) === true/u,
        `${name} must validate through the generated UID without interpolating learner input`,
      );
      assert.doesNotMatch(
        body,
        /@(?:'?)input/u,
        `${name} must never interpolate editable learner input into JavaScript`,
      );
    }
  }

  for (const [name, source] of [
    ['README.md', readme],
    ['test/fixtures/lia-canvas-ocr-local.md', localTemplate],
  ] as const) {
    assert.match(
      source,
      /^@BerechneOCR:[ \t]+@BerechneOCR_\(@uid,`@0`,`@1`\)[ \t]*$/m,
      `${name} must forward the generated UID, prompt, and option string`,
    );
    const calculationLauncherBodies = berechneOcrMacroBodies(source);
    for (const body of calculationLauncherBodies) {
      assert.doesNotMatch(
        body,
        /lia-canvas-launch-label/u,
        name + ' calculation launchers must not render a visible text label',
      );
      assert.equal(
        (body.match(/<svg\b/giu) ?? []).length,
        1,
        name + ' calculation launchers must render exactly one SVG icon',
      );
      assert.match(
        body,
        /<button\b[^>]*\baria-label=['"]Open calculation block['"]/iu,
        name + ' calculation launchers must retain their accessible open label',
      );
    }

    for (const body of berechneOcrMacroBodies(source)) {
      assert.match(
        body,
        /\bdata-calculation-prompt=[']@1[']/u,
        `${name} must expose the authored task equation on the calculation pair`,
      );
      assert.match(
        body,
        /\bdata-calculation-options=[']@2[']/u,
        `${name} must expose the forwarded options on the calculation pair`,
      );
    }
  }

  for (const [name, source] of [
    ['README.md', readme],
    ['test/fixtures/lia-canvas-ocr-local.md', localTemplate],
  ] as const) {
    assert.doesNotMatch(
      source,
      /^@canvasplus(?::|_|\s*$)/gmu,
      `${name} must not expose the removed standalone @canvasplus macro`,
    );
    assert.doesNotMatch(
      source,
      /\bdata-canvas-output=['"]render['"]/u,
      `${name} must not create render-only calculation pairs`,
    );
  }

  assert.equal(
    (readme.match(/^@BerechneOCR\(`3x\^\{2\}-7=9`\)[ \t]*$/gm) ?? [])
      .length,
    1,
    'README must show the enabled-by-default quiz syntax',
  );
  assert.equal(
    (readme.match(/^@BerechneOCR\(`3x\^\{2\}-7=9`,1\)[ \t]*$/gm) ?? [])
      .length,
    1,
    'README must show the explicitly enabled quiz syntax',
  );
  assert.equal(
    (readme.match(/^@BerechneOCR\(`2\(x\+3\)=3x-4`,0\)[ \t]*$/gm) ?? [])
      .length,
    1,
    'README must show the explicit row-feedback opt-out syntax',
  );
});

test('README provides one live lettered quiz for every written arithmetic mode', () => {
  const normalized = readme.replace(/\r\n/gu, '\n');
  const examples = [
    {
      label: '$a)\\;\\;$ Written addition',
      prompt: 'Solve $4728+3596$ using written column addition. Include every carry, one long calculation rule, and the result.',
      call: '@BerechneOCR(`4728+3596`)',
    },
    {
      label: '$b)\\;\\;$ Written subtraction',
      prompt: 'Solve $9002-3487$ using written column subtraction. Include every borrow, one long calculation rule, and the result.',
      call: '@BerechneOCR(`9002-3487`)',
    },
    {
      label: '$c)\\;\\;$ Written multiplication',
      prompt: 'Solve $738\\cdot6$ in writing. Add one place-value contribution row for each digit of the multiplicand, then draw the calculation rule and write the result.',
      call: '@BerechneOCR(`738\\cdot6`)',
    },
    {
      label: '$d)\\;\\;$ Written division',
      prompt: 'Solve $8736:8$ using long division. Write the quotient in the first row and show every underlined subtraction and partial dividend, including a meaningful leading zero.',
      call: '@BerechneOCR(`8736:8`)',
    },
  ] as const;

  for (const example of examples) {
    const liveBlock = [
      example.label,
      '',
      example.prompt,
      '',
      example.call,
    ].join('\n');
    assert.ok(
      normalized.includes(liveBlock),
      `${example.label} must be a live macro call directly preceded by its task paragraph`,
    );
    assert.equal(
      normalized.split(example.call).length - 1,
      1,
      `${example.label} must occur exactly once`,
    );
  }

  assert.doesNotMatch(
    normalized,
    /^#### Written (?:addition|subtraction|multiplication|division)[ \t]*$/gmu,
    'written-arithmetic examples must remain lettered tasks rather than headings',
  );

  assert.match(
    normalized,
    /authored prompt automatically selects written\s+column addition, subtraction, multiplication, or long division/u,
    'the task prompt, not a new macro option, must select the written method',
  );
  assert.match(
    normalized,
    /No colored guidance is required\./u,
    'written arithmetic recognition must not depend on colored support marks',
  );
  assert.match(
    normalized,
    /multiplication uses one place-value contribution row for every\s+digit of the multiplicand/u,
    'the documented multiplication layout must match the pinned school method',
  );
  assert.match(
    normalized,
    /long division records each partial dividend and\s+underlined subtraction/u,
    'the documented division layout must retain every written step',
  );
});

test('runnable courses use the pinned Algebrite CDN import', () => {
  for (const [name, source] of [
    ['README.md', readme],
    ['test/fixtures/calculation-quiz.md', calculationCourse],
  ] as const) {
    assert.ok(
      source.split(/\r?\n/u).some(line =>
        line.replace(/^import:[ \t]*/u, '').trim() === pinnedAlgebriteImport
      ),
      `${name} must use the rate-limit-resistant pinned Algebrite import`,
    );
    assert.doesNotMatch(
      source,
      /raw\.githubusercontent\.com\/LiaTemplates\/algebrite/iu,
      `${name} must not depend on the rate-limited Raw GitHub import`,
    );
  }
});

test('calculation fixture creates exactly three native input quizzes with @BerechneOCR', () => {
  const macroCalls = [...calculationCourse.matchAll(
    /^@BerechneOCR\((.+)\)[ \t]*$/gm,
  )].map(match => {
    const source = match[1].trim();
    const option = /,([01])$/u.exec(source);
    const rawEquation = option ? source.slice(0, option.index).trim() : source;
    return {
      equation: rawEquation.startsWith('`') && rawEquation.endsWith('`')
        ? rawEquation.slice(1, -1)
        : rawEquation,
      options: option?.[1] ?? '',
    };
  });

  assert.deepEqual(
    macroCalls,
    [
      { equation: '3x^{2}-7=9', options: '' },
      { equation: '3x-5=7', options: '1' },
      { equation: '2(x+3)=3x-4', options: '0' },
    ],
  );
  assert.equal((calculationCourse.match(/^\[\[/gm) ?? []).length, 0);
  assert.equal((calculationCourse.match(/@BerechneOCR\b/g) ?? []).length, 3);
  assert.equal(
    (calculationCourse.match(/@BerechneOCR\([^\r\n]+,1\)/gu) ?? []).length,
    1,
    'exactly one authored quiz must explicitly enable row-transition feedback',
  );
  assert.equal(
    macroCalls.filter(call => call.options === '').length,
    1,
    'exactly one authored quiz must exercise enabled-by-default row feedback',
  );
  assert.equal(
    (calculationCourse.match(/@BerechneOCR\([^\r\n]+,0\)/gu) ?? []).length,
    1,
    'exactly one authored quiz must explicitly opt out of row-transition feedback',
  );
});

test('@BerechneOCR documents enabled row feedback by default and numeric option forms', () => {
  assert.match(
    readme,
    /Without that argument every transition between adjacent calculation rows is\s+shown by default/u,
    'README must document row-transition feedback as enabled by default',
  );
  assert.match(
    readme,
    /A second argument of `1` explicitly keeps row feedback\s+enabled/u,
    'README must document the explicit enabled form',
  );
  assert.match(
    readme,
    /while `0` disables it/u,
    'README must document the explicit opt-out form',
  );
});

test('calculation quizzes do not author a separate detailed-solution block', () => {
  for (const [name, source] of [
    ['README.md', readme],
    ['test/fixtures/calculation-quiz.md', calculationCourse],
    ['test/fixtures/lia-canvas-ocr-local.md', localTemplate],
  ] as const) {
    assert.doesNotMatch(
      source,
      /^\*{3,}[ \t]*$/m,
      `${name} must not add a LiaScript detailed-solution delimiter`,
    );
    assert.doesNotMatch(
      source,
      /\*\*Expected calculation:\*\*/iu,
      `${name} must not author a separate expected-calculation block`,
    );
  }

  assert.match(
    readme,
    /Do not add a separate detailed-solution\s+block after `@BerechneOCR`\./u,
    'README must document that Resolve uses the generated calculation handoff',
  );
});
