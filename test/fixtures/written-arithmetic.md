<!--
author: lia-canvas-ocr browser tests
version: 1.0.0
language: en
comment: Isolated native quiz fixture for automatic written arithmetic.
import: https://lia-canvas-ocr.invalid/template.md
-->

# Written column subtraction

Subtract in writing. Show every borrow in a separate row.

@BerechneOCR(`9002-3487`)

## Written multiplication

Multiply in writing. Show every carry mark, or one partial product for every digit of the multiplicand.

@BerechneOCR(`738\cdot6`)

## Written long division

Divide in writing. Show every subtraction and every brought-down digit.

@BerechneOCR(`8736:8`)
