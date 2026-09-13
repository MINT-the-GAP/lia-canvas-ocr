# BerechneOCR: native Quizbindung und Migration

Stand: 13. September 2026.

`@BerechneOCRWithOptions` übernimmt Quizattribute und native Hinweise gemeinsam mit der Aufgabe. Dadurch stehen Antwortfeld, Hinweise und mathematischer Validator im selben nativen LiaScript-Quiz, auch in einer DynFlex-Spalte. Die bisherigen `@BerechneOCR`-Aufrufe bleiben gültig.

## Ursache und Korrektur

Ein äußerer Quizkommentar vor dem alten Makro verhinderte dessen frühe Expansion für den nativen Quizparser. Die Expansion wurde stattdessen innerhalb eines Absatzes verarbeitet. Dort bindet LiaScript ein Skript nur dann als Quizvalidator, wenn es das letzte Inline-Element ohne Attribute ist. Das bisherige `<script modify='false'>` erfüllte diese Bedingung nicht; zusätzlich folgte ihm noch das Canvas-HTML. Das Skript wurde beim Laden als sichtbares Skript ausgeführt und gab `false` aus. Beim Prüfen konnte der native Textvergleich statt der mathematischen Prüfung greifen.

Nur den äußeren Kommentar zu entfernen genügt nicht: Ein danach noch hinter dem Canvas stehender `[[?]]`-Hinweis gehört nicht mehr zum vorangegangenen nativen Quiz.

Die tiefste Makrodefinition erzeugt deshalb jetzt in dieser Reihenfolge:

1. Nichtleerer Quizkommentar mit einer festen UID und den übergebenen Attributen.
2. Natives Antwortfeld.
3. Vollständige native `[[?]]`-Hinweiszeilen.
4. Attributloses Prüfskript mit `checkCalculationAnswerByUID`.
5. Canvas-HTML.

Die öffentliche Variante reicht diese Angaben bis in dieselbe tiefste Definition durch. Auch ohne Autorenattribute enthält der Kommentar `data-calculation-quiz` mit der UID: Ein vollständig leerer HTML-Kommentar würde erneut den Absatzparser wählen. Zwischen Antwortfeld, Hinweiszeilen und Skript darf keine Leerzeile entstehen, weil der native Parser sonst den Validator nicht mehr übernimmt. Für Aufrufe ohne Quizattribute oder Hinweise übergibt der Kurzaufruf ausdrücklich in Backticks eingefasste Leerzeichen; bloß leere Argumentpositionen sind im Makroparser ungültig. Es wird weder `false` per CSS versteckt noch die Validatorausgabe unterdrückt.

## Autorensyntax

```text
@BerechneOCRWithOptions(Aufgabe, Rechenoptionen, Quizattribute, Hinweise)
```

| Argument | Inhalt |
| --- | --- |
| Aufgabe | Dieselbe Ausgangsgleichung oder Rechenaufgabe wie bei `@BerechneOCR`. |
| Rechenoptionen | Bestehende Optionssyntax, etwa `1`, `0` oder `aufgabe=ableitung;ordnung=1;zeilenrueckmeldung=1`. |
| Quizattribute | Nur die Attribute, beispielsweise `data-hint-button="1" data-solution-button="3"`, **ohne** `<!--` und `-->`. |
| Hinweise | Vollständige native Hinweiszeilen einschließlich `[[?]]`, mit genau einem abschließenden echten Zeilenumbruch. Mehrere Hinweise stehen ohne Leerzeilen auf eigenen Zeilen im selben Argument. |

Aufgabe, Optionsliste und Attribute können in einfachen Backticks stehen. Ein nichtleeres Hinweisargument wird mit **drei Backticks** eingefasst. Die schließenden drei Backticks stehen unmittelbar auf der nächsten Zeile nach dem letzten Hinweis. So enthält das Argument den nötigen abschließenden Zeilenumbruch, und das Prüfskript beginnt direkt in der folgenden Zeile. Ein geschriebenes `\n` ersetzt diesen echten Zeilenumbruch nicht. Keine Leerzeile innerhalb oder nach den Hinweiszeilen ergänzen.

Bei `@BerechneOCRWithOptions` alle vier Argumente ausdrücklich angeben. Für Standard-Rechenoptionen, fehlende Quizattribute oder fehlende Hinweise jeweils ein einzelnes Leerzeichen in einfachen Backticks verwenden. Das Argument ohne Hinweise enthält keinen Zeilenumbruch. Leere Positionen zwischen zwei Kommas sind ungültig und können die Argumentweitergabe verhindern.

Ohne zusätzliche Einstellungen lautet ein vollständiger Aufruf beispielsweise:

```markdown
@BerechneOCRWithOptions(`3x-5=7`,` `,` `,` `)
```

Das gemeldete Beispiel wird vollständig ersetzt durch:

````markdown
@BerechneOCRWithOptions(`f(x)=2*x^3-5*x^2+4*x-9`,`aufgabe=ableitung;ordnung=1;zeilenrueckmeldung=1`,`data-hint-button="1" data-solution-button="3"`,```[[?]] Wende die Potenzregel auf jeden Summanden einzeln an.
```)
````

Den bisherigen äußeren Kommentar entfernen und den nachfolgenden Hinweis in das vierte Argument verschieben. Quizattribute künftig nicht vor den Makroaufruf stellen; Hinweise nicht nach dessen Canvas-HTML anhängen. LiaScript verwaltet Hinweis- und Lösungsfreigabe über die übergebenen nativen Attribute.

Die vier bisherigen Formen bleiben unverändert verfügbar:

```markdown
@BerechneOCR(`3x-5=7`)

@BerechneOCR(`3x-5=7`,1)

@BerechneOCR(`3x-5=7`,0)

@BerechneOCR(`f(x)=2*x^3-5*x^2+4*x-9`,`aufgabe=ableitung;ordnung=1;zeilenrueckmeldung=1`)
```

## Vollständiges Kursbeispiel mit zwei DynFlex-Spalten

Im geprüften Arbeitsbereich wurde `Alt/BerechneOCRTest.md` weder neben dem Repository noch innerhalb von `lia-canvas-ocr` gefunden. Es wurde keine vorhandene Datei dieses Namens geändert. Der folgende vollständige Kurs kann als `lia-canvas-ocr/Alt/BerechneOCRTest.md` gespeichert werden; `../README.md` importiert dann unmittelbar die korrigierte lokale Vorlage. Für eine bestehende Kursdatei nur die Aufgabenblöcke übernehmen und die direkten Importe in ihrem vorhandenen Dokumentkopf ergänzen. Der OCR-Import muss auf die korrigierte Vorlage zeigen; bei entfernten Kursen nach deren Veröffentlichung auf die entsprechende Repository-Revision.

````markdown
<!--
language: de
version: 1.0.0
mode: Textbook
comment: Ableitungsquiz und Gleichungsquiz in zwei unabhängigen DynFlex-Spalten.

import: https://cdn.jsdelivr.net/gh/LiaTemplates/algebrite@0.6.3/README.md
import: ../README.md
import: https://raw.githubusercontent.com/MINT-the-GAP/lia-DynFlex/d91ae5c4445070b96f03b5438241ae9cfebc8817/README.md
-->

# Ableitung und Gleichung

<section class="dynFlex" data-basis="50%">

<div class="flex-child">

Leite die Funktion ab. Notiere zuerst die Ausgangsfunktion und danach ihre erste Ableitung.

@BerechneOCRWithOptions(`f(x)=2*x^3-5*x^2+4*x-9`,`aufgabe=ableitung;ordnung=1;zeilenrueckmeldung=1`,`data-hint-button="1" data-solution-button="3"`,```[[?]] Wende die Potenzregel auf jeden Summanden einzeln an.
```)

</div>

<div class="flex-child">

Löse die Gleichung und notiere den vollständigen Rechenweg.

@BerechneOCRWithOptions(`3x-5=7`,1,`data-hint-button="1" data-solution-button="3"`,```[[?]] Addiere zuerst 5 auf beiden Seiten.
[[?]] Teile anschließend beide Seiten durch 3.
```)

</div>

</section>
````

Die Urheberschaft des Zielkurses wird aus dessen vorhandenem Kopf beibehalten; das Kopierbeispiel ergänzt keine Person. Die Spalten können vertauscht werden, ohne Quizattribute oder Hinweise außerhalb der jeweiligen Makroaufrufe zu setzen.

## Struktur der Expansion und gemeinsame UID

Der folgende vollständige Strukturabdruck veranschaulicht die Ausgabe für das Ableitungsbeispiel. `beispiel-uid` ersetzt nur zur Erklärung die automatisch erzeugte UID. Dies ist kein Browserprotokoll und keine zusätzliche Autorensyntax; Autoren verwenden den Makroaufruf oben.

```html
<!-- data-calculation-quiz="beispiel-uid" data-hint-button="1" data-solution-button="3" -->
[[ f(x)=2*x^3-5*x^2+4*x-9 ]]
[[?]] Wende die Potenzregel auf jeden Summanden einzeln an.
<script>
window.__LIA_CANVAS_OCR__?.checkCalculationAnswerByUID('beispiel-uid') === true
</script>
<span class='lia-canvas-pair' data-canvas-mode='plus' data-canvas-output='answer' data-answer-format='native-equation-v1' data-calculation-quiz='beispiel-uid' data-calculation-prompt='f(x)=2*x^3-5*x^2+4*x-9' data-calculation-options='aufgabe=ableitung;ordnung=1;zeilenrueckmeldung=1' data-ocr-mode='submit'>
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
```

`@uid` wird einmal im öffentlichen Makro erzeugt und an die tiefste Definition übergeben. Quizkommentar, Validatorargument, Canvas-`data-calculation-quiz`, `data-seed` und `data-uid` verwenden denselben Wert. Die bestehende Laufzeit findet über diese UID das Canvas-Paar und dessen vorangehendes natives Antwortfeld. Eingefügte Hinweise erzeugen kein zweites Antwortfeld.

Die mathematische Prüfung und `data-calculation-options` bleiben erhalten. Die Zeilenrückmeldung verwendet weiterhin dieselben Rechenoptionen; die native Lösungsfreigabe löst weiterhin die Erzeugung des passenden vollständigen Musterwegs aus. Freeze verwendet weiterhin den bestehenden Canvas-Zustand samt UID und Zeilenprüfung. Für diese Strukturkorrektur wurde kein Laufzeit-JavaScript geändert; `dist/index.js` bleibt deshalb unverändert.

## Verifikation

Die Prüfung der Makrodefinition allein reicht nicht aus. Maßgeblich sind die tatsächlich expandierte Ausgabe und die Statusänderung des nativen LiaScript-Quiz nach einem Klick auf seinen echten Prüfen-Button. Für das Ableitungsbeispiel muss dieser vollständige Weg angenommen werden:

```text
f(x)=2*x^3-5*x^2+4*x-9
f'(x)=6*x^2-10*x+4
```

Ein falscher Ableitungsweg und die Ausgangsfunktion allein müssen abgelehnt werden. Zusätzlich gehören Ladezustand ohne sichtbares `false` oder `true`, Hinweis- und Lösungsfreigabe, unabhängige benachbarte Quizze, Gleichungsaufgaben, schriftliche Rechenverfahren und Freeze zur Browserregression. Kontrollierte Texteingaben belegen dabei die Quizbindung und mathematische Prüfung; sie sind keine neue Messung der Handschrifterkennung.

Durchgeführt mit der korrigierten Makrostruktur:

- `npm run test:browser:binding:run`: **10/10 Testeinträge bestanden** (9 Szenarien und ihr übergeordneter Test), keine ausgelassenen Tests, etwa 28,6 Sekunden. Chromium **151.0.7922.34**, echter LiaScript-Stable-Interpreter; das unveränderte DynFlex der gepinnten Revision `d91ae5c4445070b96f03b5438241ae9cfebc8817` wurde im Test aus dem lokalen Korpus über `LIA_DYNFLEX_DIR` geliefert. Keine JavaScript-Seitenfehler, fehlgeschlagenen Browseranfragen oder Fehler in der Laufzeitdiagnostik.
- `npm run typecheck`: erfolgreich; TypeScript blieb unverändert.
- `npm test`: **774/774 bestanden**, keine ausgelassenen Tests.
- `test:browser:curve:run` mit Chromium: **10 fachliche Einzelszenarien bestanden** (11 Testeinträge einschließlich des übergeordneten Tests). Geprüft wurden Korrektureditor, tatsächlicher nativer Quizstatus, Zeilenrückmeldung, Freeze und native Musterlösung. Firefox und WebKit waren ausgeschlossen; die zwei entsprechenden Testeinträge wurden übersprungen.
- `test:browser:functions:run` mit Chromium: **4 fachliche Einzelszenarien bestanden** (5 Testeinträge einschließlich des übergeordneten Tests), mit Korrektureditor, tatsächlicher nativer Prüfung, Zeilenrückmeldung und Freeze. Firefox und WebKit waren ausgeschlossen; die zwei entsprechenden Testeinträge wurden übersprungen.
- Die tatsächliche `README.md` wurde mit dem echten stabilen LiaScript-Parser als Kurs geöffnet. Das Ableitungsbeispiel erzeugte genau ein Quiz und ein Canvas ohne sichtbare Skriptausgabeknoten. Der echte Prüfen-Button akzeptierte den oben angegebenen vollständigen kubischen Ableitungsweg; es gab keine JavaScript-Seitenfehler.
- Der vollständige DynFlex-Kurs wurde unverändert aus dem obigen Kopierblock entnommen und unter einer gerouteten URL `/Alt/BerechneOCRTest.md` mit dem relativen `../README.md`-Import geladen. Der echte LiaScript-Parser und das gepinnte DynFlex erzeugten zwei Spalten und zwei native Quizze ohne Skriptausgabeknoten. Die vollständige Ableitung links und der Weg `3x-5=7`, `3x=12`, `x=4` rechts wurden jeweils durch Betätigung des echten nativen Prüfen-Buttons angenommen. Es gab keine JavaScript-Seitenfehler; eine lokale Alt-Datei wurde dafür nicht angelegt.

Die gezielte neue Regression steht in [calculation-quiz-binding.test.mts](../test/browser/calculation-quiz-binding.test.mts); sie umfasst zusätzlich das ursprüngliche Fehlerbeispiel und die Migration von Quizattributen und Hinweisen. Die hier genannten Browserergebnisse beziehen sich auf Chromium.
Die neue Browserregression belegt im Einzelnen:

| Fall | Beobachtung am echten Parser/Quiz |
| --- | --- |
| Ursprüngliche Einbindung in DynFlex | Sichtbares `false`; vollständiger korrekter Weg abgelehnt, Aufgabenstellung allein angenommen; bei beiden Prüfungen kein Aufruf des mathematischen UID-Validators. |
| Nur Kommentar entfernt (ohne Spaltenhülle) | Mathematische Bewertung gebunden, nachgestellter nativer Hinweis verloren. |
| Migrierte Ableitung | Kein sichtbares Boolean beim Laden; richtiger Weg angenommen, falscher Weg und Ausgangsfunktion allein abgelehnt; jeder Prüfen-Button ruft genau den eigenen UID-Validator auf. |
| Benachbarte DynFlex-Quizze | Linke Prüfung verändert weder Antwort noch Status oder Hinweise des rechten Quiz. Beide Quizze sind separat lösbar. |
| Hinweis und Musterlösung | Links Hinweis nach einem und Lösungsfreigabe nach drei Fehlversuchen, rechts jeweils nach zwei; beide rechten Hinweise samt Inline-Code angezeigt. Native Auflösung ergibt `resolved` und einen mathematisch geprüften vollständigen Ableitungsweg. |
| Bestehende API und Leerargumente | Alle vier alten Signaturen sowie ausdrückliche Leerzeichen für Optionen, Attribute und Hinweise nativ geprüft. |
| Schriftliche Verfahren | Addition, Subtraktion, Multiplikation und Division: falscher strukturierter Weg nativ abgelehnt, korrekter Weg angenommen. |
| Canvas und Freeze | Zeichnung, kontrollierter OCR-Startwert, sichtbarer Korrektureditor, vollständiger Antworttransport, gültiges Zeilenfeedback und nativer Erfolg; Freeze-Export und Wiederherstellung erhalten Weg und Zeilenstatus ohne erneuten OCR-Aufruf. |
| Tatsächliche Expansion | LiaScripts `@@`-Debugausgabe für öffentliche Weitergabe und tiefste Definition im Browser untersucht; Reihenfolge, konkrete UID, fehlende Skriptattribute und fehlende Leerzeile vor dem Validator durch Assertions gesichert. |

Zum Wiederholen mit vorhandenem Bundle: `npm run test:browser:binding:run`.
`npm run test:browser:binding` baut vorher das Bundle neu; die Regression ist
auch in `test:browser:full` enthalten. Der Test lädt standardmäßig den echten
LiaScript-Interpreter und das gepinnte DynFlex aus dem Netz. Ein lokaler
DynFlex-Checkout derselben Revision kann mit `LIA_DYNFLEX_DIR` angegeben werden.
