# OCR answer and canvas mutation regressions

Verified on 2026-09-10. Baseline bundle: commit
`23384c05016533b448fd90d4ddf92a9143206f73`.

## Changes

The classic canvas submission now calls `normalizeOcrTexNumbers` immediately
before `__liaFindAndSetInputBeforeNode`. The existing `math-notation.ts`
tokenizer is reused to join digit runs such as `1 3`, while retaining command
boundaries, text arguments, comments, variables, explicit multiplication and
spacing commands. Ungrouped arguments such as `\frac 1 3` and `x^1 3` remain
separate. Typed input continues through the existing native input path.

`hideEraserRing` and the corresponding show operation write `data-on` only
when its value changes. Toolbar labels, active flags, disabled states and
menu state are also updated only when changed. Stationary OCR selection
buttons no longer toggle `visibility` twice during every drawing frame.

## Native answer verification

`test/browser/ocr-answer-regression.test.mts` draws ink, creates a selection,
submits through the production OCR path, observes native `input` and `change`
events, then clicks the actual LiaScript quiz check button.

Only the OCR model response is substituted with the known recognition strings.
The test uses the original Algebrite template macros and its actual
`latexToMath` converter, rather than a replacement validator or the npm CAS
alone. The official 0.6.3 assets are pinned to commit
`9227c2fa05cbc97d3a19ed6fb394e29080781081` and verified by SHA-256.

| Case, tested with both `Algebrite.check` and `check2` | Before | After |
| --- | --- | --- |
| OCR `\sqrt { 1 3 }`, expected `sqrt(13)` | Rejected; converter produced `3^(1/2)` | Accepted; native field contains `\sqrt { 13 }`, converter produces `13^(1/2)` |
| OCR `\sqrt{13}` | Accepted | Accepted |
| OCR `\sqrt { 13 }` | Accepted | Accepted |
| Typed `\sqrt{13}` | Accepted | Accepted |
| Explicit `\cdot`, `\times`, `*` inside the root | Accepted for `sqrt(3)`, rejected for `sqrt(13)` | Same |

All 20 native quiz scenarios pass with the rebuilt bundle. The original HEAD
bundle passes 18/20; only the two spaced-digit scenarios fail.

## Mutation measurements

The mutation test observes attributes across the entire document and verifies
recorded drawing points and actual eraser/button visibility. Chromium uses
real pen events through CDP; Firefox and WebKit use mouse events through the
same production pointer handlers.

Before values were measured in Chromium against the original HEAD bundle.
After values match in Chromium 151.0.7922.34, Firefox 153.0 and WebKit 26.5.

| Measured operation | Before | After |
| --- | ---: | ---: |
| 30 drawing movements, eraser already hidden: attribute mutations | 30 | 0 |
| 30 drawing movements with a retained OCR selection: attribute mutations | 150 | 0 |
| Repeated stroke start, unchanged toolbar: attribute mutations | 20 | 0 |
| Repeated stroke end, unchanged toolbar: attribute mutations | 20 | 0 |
| 30 eraser movements while visible: `data-on` mutations | 30 | 0 |
| Actual eraser show / hide: `data-on` mutations per transition | 1 | 1 |

The moving eraser still updates its position: 60 necessary `left`/`top` style
mutations for 30 movements. Hiding an already hidden eraser causes zero
additional state mutations; repeated show/hide cycles remain functional.

## Reproduction

```sh
npm run typecheck
npm test
npm run test:browser:ocr-regressions
```

The last command rebuilds the bundle and runs both focused browser test files.
It requires installed Playwright Chromium, Firefox and WebKit browsers.
The native quiz test accesses the LiaScript player and downloads the pinned
Algebrite assets when its verified temporary cache is absent. The mutation
test itself runs offline.

For an OCR before/after comparison without overwriting `dist/index.js`, set
`LIA_OCR_REGRESSION_BUNDLE_PATH` to an alternative bundle and run
`test/browser/ocr-answer-regression.test.mts` directly with Node's test runner.

Final checks: 575/575 unit tests, 20/20 native quiz scenarios, 3/3 mutation
browser projects, TypeScript check and Parcel production build passed.
The focused browser run reports 24/24 tests including its parent test.

The existing "lazy init, live theme, drawing and OCR binding" integration
smoke test also passed in all three browsers (3/3, no skips or runtime errors).
