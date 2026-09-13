<!--
author: lia-canvas-ocr browser tests
version: 1.0.0
language: en
comment: Authored algebra and function paths. Controlled editor input; no recorded learner handwriting.
import: https://cdn.jsdelivr.net/gh/LiaTemplates/algebrite@0.6.3/README.md
import: https://lia-canvas-ocr.invalid/template.md
-->

# Cubic zeroes

Find all real zeroes. Use a zero-product split and solve the quadratic branch.

@BerechneOCR(`f(x)=3x^3-4x^2-2x`,`aufgabe=nullstellen`)

## Sine on a half-open interval

Solve $\sin(x)=1/2$ on $[0,2\pi)$ using radians.

@BerechneOCR(`sin(x)=1/2`,`intervall=[0,2*pi);winkelmass=rad`)

## Exponential equation

Solve over the real numbers.

@BerechneOCR(`e^(2x)-3e^x+2=0`)

## Logarithm domain

Solve the equation while retaining the original logarithm domain.

@BerechneOCR(`ln(x-1)+ln(x+1)=ln(8)`)
