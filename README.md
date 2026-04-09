<!--
author:   MINT-the-GAP
version:  0.0.1
language: en

script:   ./dist/index.js

@canvas: @canvas_(@uid)

@canvas_
<span class="lia-canvas-pair">
  <span class="lia-canvas-anchor" data-seed="@0">
    <button class="lia-canvas-launch" type="button" aria-label="Zeichenfläche öffnen/schließen">
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

Import this template:

`import: https://raw.githubusercontent.com/MINT-the-GAP/lia-canvas-ocr/main/README.md`

## Usage

Place `@canvas` below any answer field:

__$a)\;\;$__ $10+5 =$ [[ 15 ]]

@canvas

__$b)\;\;$__ $50+30 =$ [[ 80 ]]

@canvas
