<!--
author:   MINT-the-GAP, Martin Lommatzsch, Jihad Hyadi

version:  0.1.0

language: en

edit:     true

narrator: US English Female

comment:  A LiaScript template that adds a handwriting canvas with LaTeX OCR
          to any answer field. Students draw their solution, select it, and
          the recognized LaTeX is inserted directly into the answer field.

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

-->

# LiaScript Canvas + OCR

          --{{0}}--
This template adds a handwriting canvas with LaTeX OCR to any LiaScript answer
field. Students draw their solution on the canvas, draw a selection rectangle
around it, and click "Submit as Solution" — the handwriting is recognized via
[Transformers.js](https://huggingface.co/docs/transformers.js) and inserted
directly into the answer field.

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
1. Load the macros via

   `import: https://raw.githubusercontent.com/MINT-the-GAP/lia-canvas-ocr/main/README.md`

   or pin to a specific version for a stable course:

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

## Canvas Tools

| Tool | Description |
| ---- | ----------- |
| Pen | Draw with a customizable color, width, and opacity |
| Eraser | Erase parts of the drawing |
| Background | Set a blank, grid, or lined background |
| Undo / Redo | Step through drawing history |
| Submit as Solution | Draw a rectangle, recognize it, and apply the result directly |

          --{{0}}--
The canvas supports touch and stylus input with pinch-to-zoom and pan. It can
be resized by dragging the corners. The background and all drawings are
preserved across page reloads via localStorage.

## OCR Engine

          --{{0}}--
The OCR is powered by the
[Xenova/texify2](https://huggingface.co/Xenova/texify2) model and the pinned,
previously proven `@xenova/transformers@2.17.2` browser runtime. The runtime
and model weights are downloaded from their CDNs on first use and then cached
by the browser. The handwriting image itself is processed locally through ONNX
Runtime WebAssembly and is not uploaded for recognition.

The model loads lazily when "Submit as Solution" is used for the first time.
The established preprocessing and voting path remains active, and a recognized
result is written directly into the current LiaScript answer field.

When developing locally, `Alt+L` starts the LiaScript development server but
does not rebuild this template bundle. Run `npm run dev` alongside it (or
`npm run build` once), then use `Ctrl+F5` in the external preview browser after
JavaScript changes to reload imported assets.

## Implementation

          --{{0}}--
If you prefer not to use `import:`, copy the following block directly into
the header of your LiaScript document.

``` markdown
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
```
