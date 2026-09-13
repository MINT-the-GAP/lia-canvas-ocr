# BerechneOCR: native Quizbindung und Autorensyntax

Stand: 13. September 2026.

Quizattribute stehen unmittelbar vor `@BerechneOCR`, native Hinweise unmittelbar dahinter. Diese gewöhnliche LiaScript-Schreibweise funktioniert auch in einer DynFlex-Spalte. Ein eigener Aufruf pro Aufgabe erzeugt ein eigenes natives Quiz mit Antwortfeld, Prüfen-Button und Canvas.

## Die einfache Einbindung

Das ursprünglich gemeldete Beispiel kann unverändert so geschrieben werden:

```markdown
<!-- data-hint-button="1" data-solution-button="3" -->
@BerechneOCR(`f(x)=2*x^3-5*x^2+4*x-9`,`aufgabe=ableitung;ordnung=1;zeilenrueckmeldung=1`)
[[?]] Wende die Potenzregel auf jeden Summanden einzeln an.
```

Der Kommentar setzt die Optionen dieses Quiz. Der anschließende `[[?]]`-Text ist dessen nativer Hinweis. Weitere Hinweise stehen auf weiteren `[[?]]`-Zeilen. Zwischen Kommentar, Makro und Hinweisen keine Leerzeile einfügen; nach dem letzten Hinweis darf eine Leerzeile die nächste Aufgabe abtrennen.

Für diese Einbindung müssen weder Kommentar noch Hinweise als Makroargumente verpackt werden. Die zuvor empfohlene besondere Schreibweise mit einem abschließenden Zeilenumbruch im Hinweisargument ist nicht mehr erforderlich.

Die bisherigen vier Aufrufformen bleiben gültig:

```markdown
@BerechneOCR(`3x-5=7`)

@BerechneOCR(`3x-5=7`,1)

@BerechneOCR(`3x-5=7`,0)

@BerechneOCR(`f(x)=2*x^3-5*x^2+4*x-9`,`aufgabe=ableitung;ordnung=1;zeilenrueckmeldung=1`)
```

Der zweite Parameter behält seine Bedeutung: `1` aktiviert Zeilenrückmeldung, `0` deaktiviert sie; ohne Parameter ist sie aktiviert. Die Optionsliste legt beispielsweise Ableitungsaufgabe, Ordnung und Zeilenrückmeldung fest. Quizattribute wie `data-hint-button` und `data-solution-button` gehören in den äußeren Quizkommentar.

## Vollständiger Kurs mit zwei DynFlex-Spalten

Im Arbeitsbereich wurde `Alt/BerechneOCRTest.md` weder neben dem Repository noch innerhalb von `lia-canvas-ocr` gefunden. Der folgende vollständige Kurs ist als Ersatz kopierbar. Bei Speicherung unter `lia-canvas-ocr/Alt/BerechneOCRTest.md` verweist `../README.md` auf die korrigierte lokale Vorlage. Es wurde keine Alt-Datei angelegt oder überschrieben.

Bei einem vorhandenen Kurs dessen Dokumentkopf beibehalten, die nötigen direkten Importe ergänzen und nur die Aufgabenblöcke übernehmen. Für einen entfernten Kurs den OCR-Import auf die veröffentlichte korrigierte Repository-Revision richten. Eine alte importierte Vorlage enthält diese Korrektur noch nicht.

```markdown
<!--
language: de
version: 1.0.0
mode: Textbook
comment: Zweite und dritte Ableitung in zwei unabhängigen DynFlex-Spalten.

import: https://cdn.jsdelivr.net/gh/LiaTemplates/algebrite@0.6.3/README.md
import: ../README.md
import: https://raw.githubusercontent.com/MINT-the-GAP/lia-DynFlex/d91ae5c4445070b96f03b5438241ae9cfebc8817/README.md
-->

# Höhere Ableitungen

<section class="dynFlex" data-basis="50%">

<div class="flex-child">

**a)** Bilde die zweite Ableitung von $f(x)=x^4-3x^3+2x^2-x+1$. Notiere die Ausgangsfunktion sowie die erste und zweite Ableitung.

<!-- data-hint-button="1" data-solution-button="3" -->
@BerechneOCR(`f(x)=x^4-3*x^3+2*x^2-x+1`,`aufgabe=ableitung;ordnung=2;zeilenrueckmeldung=1`)
[[?]] Bestimme zunächst die erste Ableitung und leite diese anschließend noch einmal ab.
[[?]] Wende bei jedem Schritt die Potenzregel auf jeden Summanden einzeln an.

</div>

<div class="flex-child">

**b)** Bilde die dritte Ableitung von $g(x)=\frac{1}{2}x^4-2x^3+x^2$. Notiere die Ausgangsfunktion sowie die erste, zweite und dritte Ableitung.

<!-- data-hint-button="1" data-solution-button="3" -->
@BerechneOCR(`g(x)=1/2*x^4-2*x^3+x^2`,`aufgabe=ableitung;ordnung=3;zeilenrueckmeldung=1`)
[[?]] Bestimme nacheinander die erste, zweite und dritte Ableitung.
[[?]] Prüfe nach jedem Ableitungsschritt den neuen Faktor und den neuen Exponenten.

</div>

</section>
```

Jede Spalte enthält einen vollständigen eigenen Quizblock. Die Spalten können vertauscht werden. Der Kommentar und die Hinweise bleiben jeweils direkt bei ihrem Makro. Die Urheberschaft eines vorhandenen Kurses wird beibehalten; das Kopierbeispiel ergänzt keine Person.

## Ursache und korrigierte Expansion

Die frühere Makroausgabe enthielt zuerst das Antwortfeld, dann `<script modify='false'>` und zuletzt das Canvas-HTML. Mit einer äußeren Quizannotation wurde diese Ausgabe innerhalb eines Absatzes geparst. Der Absatzparser übernimmt ein Skript nur dann als Quizvalidator, wenn es das letzte Inline-Element ohne Attribute ist. Die alte Ausgabe erfüllte beide Bedingungen nicht. Das Skript lief sichtbar und gab beim Laden `false` aus; der Prüfen-Button konnte danach den gewöhnlichen Textvergleich verwenden.

Die korrigierte Ausgabe beginnt mit **Antwortfeld und Canvas im selben Absatz**. Das attributlose Prüfskript steht **hinter dem vollständig geschlossenen Canvas-HTML als letztes Inline-Element**. Der native Absatzquizparser bindet damit den mathematischen Validator. Anschließend übernimmt er die außerhalb des Makros geschriebenen nativen Hinweise und die äußeren Quizattribute in dasselbe Quiz.

Der folgende vollständige Strukturabdruck zeigt das kubische Beispiel mit einer zur Erklärung eingesetzten UID `beispiel-uid`. Er dient zum Verständnis der Expansion, nicht als zusätzliche Autorensyntax oder als Ersatz für einen Browsernachweis:

```html
<!-- data-hint-button="1" data-solution-button="3" -->
[[ f(x)=2*x^3-5*x^2+4*x-9 ]] <span class='lia-canvas-pair' data-canvas-mode='plus' data-canvas-output='answer' data-answer-format='native-equation-v1' data-calculation-quiz='beispiel-uid' data-calculation-prompt='f(x)=2*x^3-5*x^2+4*x-9' data-calculation-options='aufgabe=ableitung;ordnung=1;zeilenrueckmeldung=1' data-ocr-mode='submit'>
  <span class='lia-canvas-anchor' data-seed='beispiel-uid'>
    <button class='lia-canvas-launch' type='button' aria-label='Open calculation block' aria-expanded='false'>
      <svg viewBox='0 0 24 24' aria-hidden='true'>
        <path class='launch-stroke' d='M3 21l3.2-0.6L19 7.6a2.2 2.2 0 0 0 0-3.1l-0.5-0.5a2.2 2.2 0 0 0-3.1 0L2.6 16.8 3 21z'/>
        <path class='launch-stroke' d='M14.2 5.2l4.6 4.6'/>
      </svg>
    </button>
  </span>
  <span class='lia-canvas-mount' data-open='0' data-uid='beispiel-uid'></span>
</span>
<script>
window.__LIA_CANVAS_OCR__?.checkCalculationAnswerByUID('beispiel-uid') === true
</script>
[[?]] Wende die Potenzregel auf jeden Summanden einzeln an.
```

`@uid` wird einmal pro öffentlichem Aufruf erzeugt. Validatorargument, Canvas-`data-calculation-quiz`, `data-seed` und `data-uid` verwenden denselben Wert. Die mathematische Prüfung liest weiterhin Aufgabe und Rechenoptionen des zugehörigen Canvas-Paars sowie dessen natives Antwortfeld. Benachbarte Quizze erhalten jeweils eine eigene UID.

Die Zeilenrückmeldung behält dieselben Rechenoptionen. Die native Lösungsfreigabe verwendet weiterhin die passende vollständige Musterlösung; Freeze erhält Canvas-Zustand, Rechenweg und Zeilenprüfung. Sichtbare Booleans werden nicht per CSS versteckt und der Validator wird nicht durch eine unterdrückte Skriptausgabe ersetzt.

## Bereits geschriebene WithOptions-Aufrufe

`@BerechneOCRWithOptions(Aufgabe, Rechenoptionen, Quizattribute, Hinweise)` bleibt als Kompatibilitätshülle erhalten. Sie erzeugt den äußeren Kommentar, ruft das gewöhnliche `@BerechneOCR` auf und fügt danach die nativen Hinweise ein. Die Hülle verlangt keinen besonderen abschließenden Zeilenumbruch im Hinweisargument; vorhandene Varianten mit oder ohne diesen Zeilenumbruch bleiben verwendbar. Mehrzeilige Hinweisargumente können weiterhin in drei Backticks eingefasst werden. Explizite Leerzeichenargumente für fehlende Optionen, Attribute oder Hinweise bleiben möglich.

Für die einfache Schreibweise einen bisherigen WithOptions-Aufruf in diese drei Bestandteile aufteilen: Attribute ohne weitere Änderungen in `<!-- ... -->` vor das Makro setzen, Aufgabe und Rechenoptionen an `@BerechneOCR` übergeben und die vollständigen `[[?]]`-Zeilen darunter schreiben. Das erste Beispiel dieser Anleitung zeigt die vollständige Migration.

## Verifikation am nativen Quiz

Maßgeblich sind die tatsächliche Expansion im echten LiaScript-Parser und der native Quizstatus nach Betätigung des echten Prüfen-Buttons. Direkte Aufrufe der mathematischen API allein belegen die Quizbindung nicht. Das gilt auch dann, wenn eine Zeichenschaltfläche sichtbar ist: Jede Aufgabe benötigt ihr eigenes Antwortfeld und ihren eigenen nativen Prüfen-Button.

Diese vollständigen Wege bilden die richtigen Antworten der Beispiele:

```text
f(x)=2*x^3-5*x^2+4*x-9
f'(x)=6*x^2-10*x+4
```

```text
f(x)=x^4-3*x^3+2*x^2-x+1
f'(x)=4*x^3-9*x^2+4*x-1
f''(x)=12*x^2-18*x+4
```

```text
g(x)=1/2*x^4-2*x^3+x^2
g'(x)=2*x^3-6*x^2+2*x
g''(x)=6*x^2-12*x+2
g'''(x)=12*x-12
```

Die Regression prüft außerdem falsche und unvollständige Ableitungswege, Hinweise und Lösungsfreigabe, unabhängige benachbarte Quizze, die bisherigen Aufrufformen, Gleichungsaufgaben und schriftliche Rechenverfahren. Canvas-Editor, Antworttransport, Zeilenrückmeldung und Freeze werden gemeinsam mit dem nativen Quizstatus kontrolliert. Beim Laden darf kein sichtbares `false` oder `true` erscheinen.

Die [gezielte Browserregression](../test/browser/calculation-quiz-binding.test.mts) verwendet den echten LiaScript-Interpreter und das gepinnte DynFlex. Mit vorhandenem Bundle lässt sie sich über `npm run test:browser:binding:run` ausführen; `npm run test:browser:binding` baut vorher das Bundle neu. Kontrollierte OCR-Texte prüfen dabei Quizbindung und mathematische Verarbeitung, nicht die allgemeine Handschrifterkennungsgenauigkeit.
## Tatsächlich ausgeführte Prüfungen am 13. September 2026

| Prüfung | Ergebnis |
| --- | --- |
| `npm run typecheck` | Bestanden |
| `npm test` | 774 Tests bestanden, keine übersprungen |
| `npm run test:browser:binding:run` | 12 Szenarien bestanden (13 Node-Testeinträge einschließlich Obertest), keine Fehler oder übersprungenen Tests; 151,49 Sekunden |
| `LIA_BROWSER_PROJECTS=chromium npm run test:browser:curve:run` | 10 Szenarien bestanden: unter anderem Ableitungen, native Musterlösung, Korrektureditor, Zeilenrückmeldung und Freeze |
| `LIA_BROWSER_PROJECTS=chromium npm run test:browser:functions:run` | 4 Szenarien bestanden |
| `registerVariableCaseBrowserRegression()` mit Chromium | Bestanden: Groß-/Kleinschreibung, native Bewertung und Freeze |

Die Browserprüfungen liefen mit dem echten LiaScript-Stable-Interpreter in Chromium 151.0.7922.34. Die gezielte Quizregression verwendete DynFlex `d91ae5c4445070b96f03b5438241ae9cfebc8817`. Firefox und WebKit waren in diesen Durchläufen ausgeschlossen. Die beiden geöffneten Canvas der zweiten und dritten Ableitung wurden außerdem im gerenderten DynFlex-Kurs visuell kontrolliert.

Die alte WithOptions-Struktur aus `d1f60eb` wurde mit den einzeilig abgeschlossenen Hinweisargumenten des Screenshots nachgestellt. Dabei wird das Prüfskript vom Hinweis verschluckt: Ein korrekter Ableitungsweg scheitert am nativen Prüfen ohne Validatoraufruf; beim Anzeigen des Hinweises wird dessen Skriptausgabe `false` sichtbar. Die korrigierte Kompatibilitätshülle und die einfache Schreibweise bestehen diesen Fall.

Den Befund „nur eine Canvas pro Folie“ konnte der isolierte alte Zweispaltenausschnitt nicht reproduzieren: Dort waren zwei Launcher vorhanden. Für die korrigierte Ausgabe ist dagegen ausdrücklich geprüft, dass beide Canvas gleichzeitig sichtbar und bedienbar sind, getrennte Zeichnungen behalten und sich weder beim Schließen, erneuten Öffnen noch beim nativen Prüfen gegenseitig beeinflussen.

Die Korrektur betrifft Makros, Dokumentation und Regressionstests. Die JavaScript-Laufzeit und das ausgelieferte `dist/index.js` benötigen dafür keine Änderung.
