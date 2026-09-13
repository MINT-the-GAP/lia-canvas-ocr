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

## Migrated adjacent derivatives

<section class="dynFlex">

<div class="flex-child">

@BerechneOCRWithOptions(`f(x)=2*x^3-5*x^2+4*x-9`,`aufgabe=ableitung;ordnung=1;zeilenrueckmeldung=1`,`data-hint-button="1" data-solution-button="3"`,```[[?]] Wende die Potenzregel auf jeden Summanden einzeln an.
```)

</div>

<div class="flex-child">

@BerechneOCRWithOptions(`f(x)=x^2`,`aufgabe=ableitung;zeilenrueckmeldung=1`,`data-hint-button="2" data-solution-button="2"`,```[[?]] Rechts: Leite `x^2` mit der Potenzregel ab.
[[?]] Rechts: Der Exponent wird zum Faktor.
```)

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

@BerechneOCRWithOptions(`8736:8`,1,`data-solution-button="0"`,` `)

## Actual macro expansion

@@BerechneOCRWithOptions(`f(x)=2*x^3-5*x^2+4*x-9`,`aufgabe=ableitung;ordnung=1;zeilenrueckmeldung=1`,`data-hint-button="1" data-solution-button="3"`,```[[?]] Wende die Potenzregel auf jeden Summanden einzeln an.
```)

@@BerechneOCR(`2x+3=7`)

@@BerechneOCR_(`expanded-binding`,`f(x)=2*x^3-5*x^2+4*x-9`,`aufgabe=ableitung;ordnung=1;zeilenrueckmeldung=1`,`data-hint-button="1" data-solution-button="3"`,```[[?]] Wende die Potenzregel auf jeden Summanden einzeln an.
```)

@@BerechneOCR_(`expanded-empty`,`2x+3=7`,1,` `,` `)

## Explicit blank option arguments

@BerechneOCRWithOptions(`2x+3=7`,` `,` `,` `)

@BerechneOCRWithOptions(`2x+3=7`,` `,` `,```[[?]] Erst `3` subtrahieren, dann durch `2` dividieren.
```)
