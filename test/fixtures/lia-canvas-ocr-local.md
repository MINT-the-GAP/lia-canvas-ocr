<!--
author: lia-canvas-ocr browser tests
version: 1.0.0
language: en
comment: Synthetic lia-canvas-ocr template served by Playwright routing.
script: https://lia-canvas-ocr.invalid/dist/index.js

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

# Local lia-canvas-ocr test template
