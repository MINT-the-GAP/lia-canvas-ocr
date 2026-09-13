<!--
author: lia-canvas-ocr browser tests
version: 1.0.0
language: en
comment: Authored curve tasks tested through the visible correction editor; controlled OCR seed.
import: https://cdn.jsdelivr.net/gh/LiaTemplates/algebrite@0.6.3/README.md
import: https://lia-canvas-ocr.invalid/template.md
-->

# Ableitung

Bilde die Ableitungsfunktion.

@BerechneOCR(`f(x)=x^3-3x`,`aufgabe=ableitung`)

## Extrempunkte

Bestimme alle lokalen Extrempunkte und ordne sie als Hoch- oder Tiefpunkte ein.

@BerechneOCR(`f(x)=x^3-3x`,`aufgabe=extrempunkte`)

## Wendepunkt

Bestimme den Wendepunkt.

@BerechneOCR(`f(x)=x^3`,`aufgabe=wendepunkte`)

## Normale

Bestimme die Normale an der Stelle 0.

@BerechneOCR(`f(x)=x^2`,`aufgabe=normale;stelle=0`)

## Bestimmtes Integral

Berechne das bestimmte Integral von -1 bis 1.

@BerechneOCR(`f(x)=x`,`aufgabe=integral;von=-1;bis=1`)

## Flächeninhalt

Berechne den Flächeninhalt zwischen dem Graphen und der Abszissenachse von -1 bis 1.

@BerechneOCR(`f(x)=x`,`aufgabe=flaecheninhalt;von=-1;bis=1`)

## Kurvendiskussion

Untersuche Definitionsbereich, Nullstellen, Extrempunkte, Wendepunkte, Monotonie und Krümmung.

@BerechneOCR(`f(x)=x^3-3x`,`aufgabe=kurvendiskussion`)

## Fehlende Vorgabe

Diese Autorenfehler-Probe lässt die Berührstelle absichtlich weg.

@BerechneOCR(`f(x)=x^2`,`aufgabe=tangente`)

## Termvereinfachung

Vereinfache den Term.

@BerechneOCR(`2+3`,`aufgabe=vereinfachen`)
