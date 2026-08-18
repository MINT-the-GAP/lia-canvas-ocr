<!--
author:   MINT-the-GAP, Martin Lommatzsch, Jihad Hyadi

version:  0.1.0

language: en

edit:     true

narrator: US English Female

comment:  A LiaScript template that adds handwriting-to-LaTeX OCR. @canvas
          writes into an existing answer field, while @BerechneOCR creates a
          checked native multi-line calculation quiz.

import:   https://cdn.jsdelivr.net/gh/LiaTemplates/algebrite@0.6.3/README.md

script:   ./dist/index.js

@canvas: @canvas_(@uid)

@canvas_
<span class="lia-canvas-pair">
  <span class="lia-canvas-anchor" data-seed="@0">
    <button class="lia-canvas-launch" type="button" aria-label="Open/close drawing area">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path class="launch-stroke" d="M3 21l3.2-0.6L19 7.6a2.2 2.2 0 0 0 0-3.1l-0.5-0.5a2.2 2.2 0 0 0-3.1 0L2.6 16.8 3 21z"/>
        <path class="launch-stroke" d="M14.2 5.2l4.6 4.6"/>
      </svg>
    </button>
  </span>
  <span class="lia-canvas-mount" data-open="0" data-uid="@0"></span>
</span>
@end

@BerechneOCR: @BerechneOCR_(@uid,`@0`,`@1`)

@BerechneOCR_
[[ @1 ]]
<script modify='false'>
window.__LIA_CANVAS_OCR__?.checkCalculationAnswerByUID('@0') === true
</script>
<span class='lia-canvas-pair' data-canvas-mode='plus' data-canvas-output='answer' data-answer-format='native-equation-v1' data-calculation-quiz='@0' data-calculation-prompt='@1' data-calculation-options='@2' data-ocr-mode='submit'>
  <span class='lia-canvas-anchor' data-seed='@0'>
    <button class='lia-canvas-launch' type='button' aria-label='Open calculation block' aria-expanded='false'>
      <svg viewBox='0 0 24 24' aria-hidden='true'>
        <path class='launch-stroke' d='M3 21l3.2-0.6L19 7.6a2.2 2.2 0 0 0 0-3.1l-0.5-0.5a2.2 2.2 0 0 0-3.1 0L2.6 16.8 3 21z'/>
        <path class='launch-stroke' d='M14.2 5.2l4.6 4.6'/>
      </svg>
    </button>
  </span>
  <span class='lia-canvas-mount' data-open='0' data-uid='@0'></span>
</span>
@end

-->

# LiaScript Canvas + OCR

          --{{0}}--
This template adds handwriting-to-LaTeX OCR to LiaScript. `@canvas` belongs to
an existing answer field: students select part of the drawing and submit it as
the answer. `@BerechneOCR` creates one native LiaScript input quiz for a complete
multi-line calculation. The recognized calculation is handed to that field and
checked with the normal quiz button.

__Try it on LiaScript:__

https://liascript.github.io/course/?https://raw.githubusercontent.com/MINT-the-GAP/lia-canvas-ocr/main/README.md

__See the project on GitHub:__

https://github.com/MINT-the-GAP/lia-canvas-ocr

          --{{1}}--
There are three ways to use this template. The easiest way is to use the
`import` statement with the URL of the raw README file. You can also copy the
macro definitions directly into your document header, or clone and customize
the project.

           {{1}}
1. Load Algebrite first and then the Canvas macros via

   `import: https://cdn.jsdelivr.net/gh/LiaTemplates/algebrite@0.6.3/README.md`

   `import: https://raw.githubusercontent.com/MINT-the-GAP/lia-canvas-ocr/main/README.md`

   or pin to an existing release for a stable course. The legacy `0.0.1`
   example below contains `@canvas` only:

   `import: https://raw.githubusercontent.com/MINT-the-GAP/lia-canvas-ocr/0.0.1/README.md`

2. Copy the definitions into your project

3. Clone this repository on GitHub

## `@canvas`

          --{{0}}--
Place `@canvas` directly below any answer field. A small pen icon will appear
next to the field. Clicking it opens the drawing canvas. The student draws
their answer and uses the "Submit as Solution" tool to draw a rectangle around
it. The recognized result is applied directly to the input field.
Plain integer fractions such as `5/7` keep their original answer value but are
shown as a full-size stacked fraction in the KaTeX preview.

``` markdown
__$a)\;\;$__ $10 + 5 =$ [[ 15 ]]

@canvas

__$b)\;\;$__ $50 + 30 =$ [[ 80 ]]

@canvas
```

---

__$a)\;\;$__ $10 + 5 =$ [[ 15 ]]

@canvas

__$b)\;\;$__ $50 + 30 =$ [[ 80 ]]

@canvas

## `@BerechneOCR(task[, options])`

          --{{0}}--
Pass the task equation to `@BerechneOCR`. The macro creates exactly one native
LiaScript text quiz, its semantic calculation validator, and a multi-line
handwriting calculation block. The optional second argument controls row feedback
for ordinary equation paths.
Without that argument every transition between adjacent calculation rows is
shown by default. A second argument of `1` explicitly keeps row feedback
enabled, while `0` disables it. Enabled row feedback is also shown when the
course state is opened through a Freeze link. Wrap the equation in backticks,
especially when it contains commas or parentheses, so LiaScript treats it as
one macro argument.
If the task contains only non-negative decimal integers and one of `+`, `-`,
`\cdot`/`\times`, or `:`, the authored prompt automatically selects written
column addition, subtraction, multiplication, or long division. No mode
parameter is needed, and the mode is not guessed from the learner's
handwriting. Subtraction currently expects the minuend to be at least as large
as the subtrahend; the divisor in a division task must not be zero. An optional
correct result may be included after `=`.
The four written modes follow the German-school layouts in
[Wochenaufgabe Lia5_02, Aufgabe 1](https://liascript.github.io/nightly/?https://raw.githubusercontent.com/MINT-the-GAP/Wochenaufgabe/refs/heads/main/5/Mathematik/Lia5_02.md#2):
addition records hooked carry ones, subtraction records the
borrow ones, multiplication uses one place-value contribution row for every
digit of the multiplicand, and long division records each partial dividend and
underlined subtraction. Calculation rules, division underlines, and the small
carry or borrow marks are recognized structurally and are not sent to the row
OCR as digits. No colored guidance is required. The preview renders the whole
calculation as one aligned block, so equation-transition arrows and their row
feedback option do not apply to these four modes.
On **Submit to render**, the complete recognized or manually corrected path is
validated and retained in the native answer field. The field's TeX preview
shows all calculation rows. For an equation path, **Check** compares the first
row semantically with the task equation, validates every transition, and
requires a solved final row; equivalent TeX spellings such as `x^2` and
`x^{2}` therefore agree. For written arithmetic it checks the operands, result,
and every required carry, borrow, contribution, or division step. An invalid,
incomplete, or task-unrelated calculation is not accepted.
Drawing again marks the rendered path as stale but keeps the last submitted
field content until the learner submits the canvas again.
The native **Resolve** button keeps LiaScript's normal resolved state and fills
the answer with a complete expected calculation for supported equations. The
serialized calculation is rendered in the same TeX preview above the canvas;
resolving does not run handwriting OCR. Do not add a separate detailed-solution
block after `@BerechneOCR`. Automatic step generation is derived from the
authored equation; it is not tied to the example below. It supports
one-variable linear and quadratic polynomial equations with terms on either
side, parentheses, constant fractions, and finite decimal coefficients. It
also supports pure power equations of degree 2, 3, or 4, including identities,
contradictions, repeated roots, irrational exact roots, and equations without
real solutions. For domain-sensitive or otherwise unsupported forms (for
example multiple variables, variable denominators, trigonometric equations,
or general cubic and quartic polynomials), LiaScript's native resolved equation
remains unchanged instead of displaying guessed steps.
Algebrite and this template must both be imported directly by the course.

$a)\;\;$ Written addition

Solve $4728+3596$ using written column addition. Include every carry, one long calculation rule, and the result.

@BerechneOCR(`4728+3596`)

$b)\;\;$ Written subtraction

Solve $9002-3487$ using written column subtraction. Include every borrow, one long calculation rule, and the result.

@BerechneOCR(`9002-3487`)

$c)\;\;$ Written multiplication

Solve $738\cdot6$ in writing. Add one place-value contribution row for each digit of the multiplicand, then draw the calculation rule and write the result.

@BerechneOCR(`738\cdot6`)

$d)\;\;$ Written division

Solve $8736:8$ using long division. Write the quotient in the first row and show every underlined subtraction and partial dividend, including a meaningful leading zero.

@BerechneOCR(`8736:8`)

---


---

$e)\;\;$ Solve the equation 3x^{2}-7=9. Enter every transformation in the calculation block.


``` markdown
@BerechneOCR(`3x^{2}-7=9`)
```

---


@BerechneOCR(`3x^{2}-7=9`,1)

To hide the row-transition feedback for an individual quiz, use the explicit
opt-out:

``` markdown
@BerechneOCR(`2(x+3)=3x-4`,0)
```

### Multi-line calculation recognition

          --{{0}}--
The calculation block created by `@BerechneOCR` uses the same drawing tools and
Freeze-compatible drawing state as `@canvas`, with a dedicated handwriting-math
OCR engine for complete calculation paths. It starts with a pen-icon button whose accessible label is
**Open calculation block**. The rectangle tool
optionally limits recognition to a marked area; closing the rectangle restores
the whole drawing as the render scope. A dedicated **Submit to render** button
recognizes the selected handwriting, or all handwriting when no selection is
present, and displays the rendered TeX directly below the canvas.
The rendered result is line-based. **Edit recognition** opens an inline TeX
editor with one equation per line; applying a correction re-renders and
re-checks the block without invoking OCR again. Consecutive rows are connected
by an arrow and a visible status: a check mark for a proven equivalent step, a
red cross for a proven error, and a question mark when the transition cannot be
checked safely. For explicit side operations such as `| +7`, `| :3`, or
`| \\cdot 2`, a proven mismatch also highlights the affected side of the next
equation.
The current test mode deliberately starts model inference only after the
student clicks **Submit to render**. This keeps the drawing surface responsive:
running the browser OCR model during a thinking pause can otherwise compete
with new pen input. After one submit, unchanged line results stay cached in
memory; a later submit only recognizes changed lines again. Panning, zooming,
or resizing does not change the block: OCR is rendered from world-space paths
rather than only the currently visible viewport, with an optional selection
remaining anchored to those same coordinates.
Multiple detected lines are serialized as one
`\begin{aligned} ... \\ ... \end{aligned}` expression. For ordinary equation
rows, the first supported outer relation receives an alignment point, so equals
signs line up.
Fractions, dots, and superscripts are deliberately kept together when their
vertical gaps are small. Calculation OCR uses the configured German-school
handwriting rule that a digit `1` has a visible top hook, while a separate,
straight stroke without that hook is a transformation marker. It still needs
clear space and content on both sides and a complete relation to its left.
Every geometrically plausible hookless candidate is checked semantically; a
fixed candidate limit must not let digit stems hide the real marker. Forms such
as `5 | +7` and `12 | :3` can therefore be rendered structurally instead of
letting OCR turn `|` into an extra `1`.
Complex two-dimensional layouts such as tables or matrices remain experimental
and must be checked visually in the rendered result.
For device safety, one recognition pass is limited to 32 detected lines instead
of silently merging additional lines or enqueueing unbounded model work.
Transition checks use the `window.Algebrite` CAS runtime supplied by the
directly imported LiaTemplates/Algebrite template. It runs only after a block
has been rendered or manually corrected; no CAS work runs while the student is
drawing. Longer paths are checked one transition at a time so the browser can
update the interface between steps. If the Algebrite import is absent, the block
states that the CAS is unavailable and leaves every transition ungraded.
The conservative first scope proves explicit
numeric `+`, `-`, `\\cdot`, and `:` transformations and one-variable linear-equation
equivalence. Variable denominators, symbolic division without a nonzero
assumption, multiple-variable steps without an explicit operation, and
unsupported/nonlinear TeX are marked **not safely checkable**, never silently
marked wrong. The CAS calculation remains in the browser and is not sent to a
server.
True background inference will be enabled only after it runs outside the drawing
thread. Until then `data-ocr-mode='submit'` is the safe default.
`@canvas` continues to use the classic single-selection flow, applies recognized
text directly, and does not run background OCR.
The line cache is session-only and is not included in Freeze state.

## Canvas Tools

| Tool | Description |
| ---- | ----------- |
| Pen | Draw with a customizable color, width, and opacity |
| Eraser | Erase parts of the drawing |
| Background | Set a blank, grid, or lined background |
| Undo / Redo | Step through drawing history |
| Submit as Solution (`@canvas`) | Draw a rectangle and apply the recognized text to the answer field |
| Select calculation area (`@BerechneOCR`) | Optionally limit recognition to one marked part; clear it to use the whole drawing |
| Submit to render (`@BerechneOCR`) | Recognize the marked area, or the complete multi-line calculation when nothing is marked |

          --{{0}}--
The canvas supports touch and stylus input with pinch-to-zoom and pan. It can
be resized by dragging the corners. The background and drawings remain in the
runtime store while the course is open and can be carried by the Freeze
integration. A hard browser reload currently resets the drawing.

## OCR Engine

          --{{0}}--
Classic `@canvas` continues to use
[Xenova/texify2](https://huggingface.co/Xenova/texify2) with the pinned
`@xenova/transformers@2.17.2` runtime. `@BerechneOCR` instead uses
[alephpi/FormulaNet](https://huggingface.co/alephpi/FormulaNet) at pinned
revision `63e04c86fc96c2324811114351eeea8118bf6b28`. FormulaNet is a
20-million-parameter formula-image-to-LaTeX model with a browser-tested merged
ONNX decoder. Calculation OCR keeps its own line segmentation and sends only one
calculation line at a time through FormulaNet's 384 x 384 preprocessing.

The calculation model loads lazily on the first **Submit to render**. It uses a
WASM worker and downloads about 80 MiB of fp32 ONNX graphs. Runtime and weights
come from pinned URLs and are cached by the browser. The handwriting image
itself stays in the browser and is not uploaded for recognition. The first
download can therefore take noticeably longer; later uses reuse the browser
cache. FormulaNet is licensed AGPL-3.0, so the calculation OCR remains
experimental until the licensing and target-handwriting evaluation are accepted
for a release.

`@BerechneOCR` uses one canonical recognition pass per ordinary calculation
line and retries only an empty or syntactically incomplete result. A
structurally detected transformation marker causes the main equation and its
side operation to be recognized separately. `@canvas` writes one recognized
expression to an existing answer field; `@BerechneOCR` serializes the complete
recognized calculation into its generated native quiz. FormulaNet's published ONNX handwriting split reports a
0.0976 edit distance; that is promising but not a guarantee for student
handwriting. The inline **Edit recognition** step therefore remains part of
this experimental workflow; the CAS never repairs or invents OCR text.

This npm-bundled template intentionally loads `script: ./dist/index.js`; the
generated `dist/index.js` contains the Canvas runtime, while Algebrite comes
from the separate direct template import. Both imports must be listed directly
in a consuming course because nested template imports are not resolved reliably.
The bundle must stay in sync with `src/`. `Alt+L` starts the LiaScript development server but does not rebuild the
bundle, so run `npm run dev` alongside it (or `npm run build` once). Then use
`Ctrl+F5` in the external preview browser after JavaScript changes to reload the
locally served asset with the development server's JavaScript MIME type.

### Browser stability regression

Older Chromium versions could enter an endless microtask loop after import:
the theme `MutationObserver` watched the root `style` attribute while the theme
sync wrote the same canvas custom properties back to that attribute on every
callback. The runtime now writes only changed values, disconnects its observer
during owned writes, coalesces theme refreshes, and starts canvas-specific
global work only after a `.lia-canvas-pair` is actually rendered.

The browser regression suite serves the local `dist/index.js` through request
interception as `application/javascript`; it intentionally does not execute a
Raw GitHub `dist` URL, which is delivered as `text/plain` with `nosniff`.

``` bash
npm run test:browser:chromium-131
npm run test:browser:current
npm run test:browser:real
```

`test:browser:real` is the opt-in real-model check. It downloads/caches
FormulaNet, draws the three-line path `3x-5=7 | +5`, `3x=12 | :3`, `x=4`, and
requires both detected transitions to validate. It is intentionally excluded
from the normal smoke suite because model download and inference are dependent
on the machine and network.

The first command requires Chrome/Chromium 131, either through
`CHROMIUM_131_EXECUTABLE_PATH` or in Puppeteer's standard Chrome-for-Testing
cache. Install the current Playwright browser matrix once with
`npx playwright install chromium firefox webkit`.

## Implementation

          --{{0}}--
If you prefer not to use `import:`, copy the following block directly into
the header of your LiaScript document.

``` markdown
import:   https://cdn.jsdelivr.net/gh/LiaTemplates/algebrite@0.6.3/README.md

script:   https://cdn.jsdelivr.net/gh/MINT-the-GAP/lia-canvas-ocr@main/dist/index.js

@canvas: @canvas_(@uid)

@canvas_
<span class="lia-canvas-pair">
  <span class="lia-canvas-anchor" data-seed="@0">
    <button class="lia-canvas-launch" type="button" aria-label="Open/close drawing area">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path class="launch-stroke" d="M3 21l3.2-0.6L19 7.6a2.2 2.2 0 0 0 0-3.1l-0.5-0.5a2.2 2.2 0 0 0-3.1 0L2.6 16.8 3 21z"/>
        <path class="launch-stroke" d="M14.2 5.2l4.6 4.6"/>
      </svg>
    </button>
  </span>
  <span class="lia-canvas-mount" data-open="0" data-uid="@0"></span>
</span>
@end

@BerechneOCR: @BerechneOCR_(@uid,`@0`,`@1`)

@BerechneOCR_
[[ @1 ]]
<script modify='false'>
window.__LIA_CANVAS_OCR__?.checkCalculationAnswerByUID('@0') === true
</script>
<span class='lia-canvas-pair' data-canvas-mode='plus' data-canvas-output='answer' data-answer-format='native-equation-v1' data-calculation-quiz='@0' data-calculation-prompt='@1' data-calculation-options='@2' data-ocr-mode='submit'>
  <span class='lia-canvas-anchor' data-seed='@0'>
    <button class='lia-canvas-launch' type='button' aria-label='Open calculation block' aria-expanded='false'>
      <svg viewBox='0 0 24 24' aria-hidden='true'>
        <path class='launch-stroke' d='M3 21l3.2-0.6L19 7.6a2.2 2.2 0 0 0 0-3.1l-0.5-0.5a2.2 2.2 0 0 0-3.1 0L2.6 16.8 3 21z'/>
        <path class='launch-stroke' d='M14.2 5.2l4.6 4.6'/>
      </svg>
    </button>
  </span>
  <span class='lia-canvas-mount' data-open='0' data-uid='@0'></span>
</span>
@end
```
