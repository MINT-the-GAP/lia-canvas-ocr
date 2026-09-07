<!--
author: lia-canvas-ocr browser tests
version: 1.0.0
language: en
comment: Authored calculation-path regressions. No recorded handwriting or learner data.
import: https://cdn.jsdelivr.net/gh/LiaTemplates/algebrite@0.6.3/README.md
import: https://lia-canvas-ocr.invalid/template.md
-->

# Linear system

Solve both equations together. Preserve the addition and back-substitution steps.

@BerechneOCR(`\begin{cases}x+y=5\\x-y=1\end{cases}`)

## Completing the square

Solve the equation and include both real solutions.

@BerechneOCR(`x^2-4x=10`)

## Solution and verification

Solve the equation and check the solution in the original equation.

@BerechneOCR(`3x-2=5x+4`)
