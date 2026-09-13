<!--
author: lia-canvas-ocr browser tests
version: 1.0.0
language: de
import: https://cdn.jsdelivr.net/gh/LiaTemplates/algebrite@0.6.3/README.md
        https://lia-canvas-ocr.invalid/template.md
        https://raw.githubusercontent.com/MINT-the-GAP/lia-DynFlex/d91ae5c4445070b96f03b5438241ae9cfebc8817/README.md
-->

# Original external annotation

<section class="dynFlex">

<div class="flex-child">

<!-- data-hint-button="1" data-solution-button="3" -->
@BerechneOCR(`f(x)=2*x^3-5*x^2+4*x-9`,`aufgabe=ableitung;ordnung=1;zeilenrueckmeldung=1`)
[[?]] Wende die Potenzregel auf jeden Summanden einzeln an.

</div>

<div class="flex-child">

Nachbarquiz: [[ Nachbar ]]

</div>

</section>

## Annotated adjacent derivatives

<section class="dynFlex">

<div class="flex-child">

<!-- data-hint-button="1" data-solution-button="3" -->
@BerechneOCR(`f(x)=2*x^3-5*x^2+4*x-9`,`aufgabe=ableitung;ordnung=1;zeilenrueckmeldung=1`)
[[?]] Wende die Potenzregel auf jeden Summanden einzeln an.

</div>

<div class="flex-child">

<!-- data-hint-button="2" data-solution-button="2" -->
@BerechneOCR(`f(x)=x^2`,`aufgabe=ableitung;zeilenrueckmeldung=1`)
[[?]] Rechts: Leite `x^2` mit der Potenzregel ab.
[[?]] Rechts: Der Exponent wird zum Faktor.

</div>

</section>

## Legacy forms

@BerechneOCR(`2x+3=7`)

@BerechneOCR(`2x+3=7`,1)

@BerechneOCR(`2x+3=7`,0)

@BerechneOCR(`f(x)=2*x^3-5*x^2+4*x-9`,`aufgabe=ableitung;ordnung=1;zeilenrueckmeldung=1`)

## Written procedures

@BerechneOCR(`4728+3596`)

@BerechneOCR(`9002-3487`,1)

@BerechneOCR(`738\cdot6`,0)

<!-- data-solution-button="0" -->
@BerechneOCR(`8736:8`,1)

## Actual macro expansion

@@BerechneOCR(`f(x)=2*x^3-5*x^2+4*x-9`,`aufgabe=ableitung;ordnung=1;zeilenrueckmeldung=1`)

@@BerechneOCR(`2x+3=7`)

@@BerechneOCR_(`expanded-binding`,`f(x)=2*x^3-5*x^2+4*x-9`,`aufgabe=ableitung;ordnung=1;zeilenrueckmeldung=1`)

@@BerechneOCR_(`expanded-empty`,`2x+3=7`,1)

## Explicit default options

@BerechneOCR(`2x+3=7`,` `)

<!-- data-hint-button="1" data-solution-button="3" -->
@BerechneOCR(`2x+3=7`,` `)
[[?]] Erst `3` subtrahieren, dann durch `2` dividieren.

## Screenshot: Zweite und dritte Ableitung

Kennzeichne die aufeinanderfolgenden Ableitungen mit $f'(x)$, $f''(x)$ beziehungsweise $g'(x)$, $g''(x)$ und $g'''(x)$.

<section class="dynFlex" data-basis="49%">

<div class="flex-child">

**Bestimme** die zweite Ableitung von $f(x)=x^4-3x^3+2x^2-x+1$. **Notiere** auch die erste Ableitung als Zwischenschritt. Die Ausgangsgleichung muss nicht wiederholt werden.

<!-- data-hint-button="1" data-solution-button="3" -->
@BerechneOCR(`f(x)=x^4-3*x^3+2*x^2-x+1`,`aufgabe=ableitung;ordnung=2;zeilenrueckmeldung=1`)
[[?]] Bilde zuerst $f'(x)$. Wende danach die Potenzregel erneut auf diesen neuen Funktionsterm an.

</div>

<div class="flex-child">

**Bestimme** die dritte Ableitung von $g(x)=\frac12 x^4-2x^3+x^2$. **Notiere** auch die erste und zweite Ableitung.

<!-- data-hint-button="1" data-solution-button="3" -->
@BerechneOCR(`g(x)=1/2*x^4-2*x^3+x^2`,`aufgabe=ableitung;ordnung=3;zeilenrueckmeldung=1`)
[[?]] Leite dreimal nacheinander ab. Der höchste Exponent wird bei jedem Ableiten um $1$ kleiner.

</div>

</section>
