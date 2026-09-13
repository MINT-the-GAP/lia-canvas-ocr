# BerechneOCR: Lösungswege und ausgewählte Funktionsgleichungen

BerechneOCR prüft erkannte oder manuell korrigierte Rechenwege mit dem vorhandenen Computeralgebrasystem und begrenzten exakten Nachweisen. Die Erweiterung ergänzt keinen Sprachmodell- oder KI-Dienst. Die vorhandene Handschrifterkennung liefert weiterhin die Eingabe; ihre Erkennungsgenauigkeit folgt nicht aus den hier beschriebenen mathematischen Tests.

## Autorenangaben

Der zweite Makroparameter bleibt optional. Die bisherigen Werte `0` und `1` schalten ausschließlich die Zeilenrückmeldung aus beziehungsweise ein. Mehrere benannte Angaben stehen gemeinsam in einem durch Backticks geschützten Parameter und werden durch Semikolons getrennt.

``` markdown
@BerechneOCR(`f(x)=3x^3-4x^2-2x`,`aufgabe=nullstellen`)
@BerechneOCR(`sin(x)=1/2`,`intervall=[0,2*pi);winkelmass=rad`)
@BerechneOCR(`sin(x)=1/2`,`intervall=[0,360);winkelmass=deg`)
@BerechneOCR(`e^(2x)-3e^x+2=0`)
@BerechneOCR(`ln(x-1)+ln(x+1)=ln(8)`)
```

| Angabe | Bedeutung |
| --- | --- |
| `aufgabe=nullstellen` | Leitet aus einer ausdrücklich angegebenen Funktion die Zielgleichung Ausdruck `=0` ab. |
| `aufgabe=gleichung` | Prüft eine Gleichung; Standard. Eine Funktionsdefinition allein ist kein Nullstellenauftrag. |
| `intervall=[0,2*pi)` | Beschränkt die trigonometrische Lösungsmenge auf das angegebene Intervall. Runde Klammern schließen die Grenze aus, eckige schließen sie ein. |
| `winkelmass=rad` | Radiant; Standard. |
| `winkelmass=deg` | Gradmaß. Gradzeichen sind zulässig; eine Mischung mit Pi-Winkeln wird abgelehnt. |
| `zeilenrueckmeldung=0` | Deaktiviert die Zeilenrückmeldung. Die mathematische Quizprüfung bleibt aktiv. |

Ohne Intervall wird über den reellen Zahlen geprüft. Bei periodischen Gleichungen sind dann alle Lösungsfamilien erforderlich. Unbekannte, doppelte oder ungültige Optionen werden nicht stillschweigend ignoriert. Ein eigener Optionswert für komplexe Zahlen wird nicht angeboten.

Die öffentlichen APIs nehmen denselben Kontext als optionales drittes Argument entgegen:

``` javascript
const options = {
  calculationContext: {
    angleUnit: 'rad',
    interval: {
      lower: '0', upper: '2*pi',
      lowerClosed: true, upperClosed: false
    }
  }
};
window.__LIA_CANVAS_OCR__.validateCalculationSubmission(
  'sin(x)=1/2',
  ['sin(x)=1/2', String.raw`L=\{\pi/6;5\pi/6\}`],
  options
);
```

Für Nullstellen lautet der API-Kontext `{ calculationContext: { task: 'zeros' } }`. Unter- und Obergrenze sind mathematische Zeichenketten. Kontext und Ausgangsaufgabe werden auch bei nativer Quizbewertung, Zeilenanalyse und Erzeugung der Musterlösung verwendet.

## Algebraische Lösungswege

Die erste mathematische Hauptzeile muss die Aufgaben-Gleichung wiedergeben. Danach sind unterschiedlich große, bewiesene Umformungen zulässig. Beispielsweise dürfen `3x-5=7` direkt zu `x=4` und `2(x+3)=3x-4` direkt zu `x=10` führen.

Explizite Randoperationen sind verbindlich. Die Schreibweise

``` text
3x-5=7 | +5; :3
x=4
```

führt zunächst `+5`, danach `:3` aus. Zwei bis vier Operationen können so zusammengefasst werden. Ein allein angeschriebenes `+5` rechtfertigt den direkten Sprung nicht. Multiplikation und Division in dieser Operationsfolge verlangen einen nachweislich von null verschiedenen numerischen Faktor; eine variable Division erhält dadurch keine pauschale Freigabe.

Für quadratische Gleichungen sind eingesetzte pq-Formel, allgemeine quadratische Formel, quadratische Ergänzung und geeignete Faktorisierung möglich. Beschriftungen wie `pq-Formel:`, `quadratische Ergänzung:` und `Faktorisierung:` werden als Methodenangaben erkannt. Sie können alleine stehen oder einer Gleichung vorangestellt werden und beweisen selbst keine Umformung.

``` text
x^2-5x+6=0
pq-Formel:
p=-5
q=6
D=(p/2)^2-q=1/4
x_{1,2}=-p/2\pm\sqrt{D}
```

`p` und `q` werden gegen die normierte aktive quadratische Gleichung geprüft. Ein expliziter Ausdruck definiert `D` oder `\Delta` lokal. Die folgenden Gleichheiten einer Definitionszeile müssen stimmen. Eine bereits definierte Hilfsgröße darf nicht mit einem widersprüchlichen Wert überschrieben werden. Eine bloß numerische erste Angabe wie `D=1` verwendet aus Gründen der Kompatibilität weiterhin die Konvention `b^2-4ac`.

Das kubische Beispiel unterstützt unter anderem diesen Weg:

``` text
3x^3-4x^2-2x=0
x(3x^2-4x-2)=0
x=0 oder 3x^2-4x-2=0
Fall 2: 3x^2-4x-2=0
(x-2/3)^2=10/9
x_{2,3}=2/3\pm\sqrt{10}/3
```

Der erste Zweig liefert bereits `x=0`. Die Ergebnisse des zweiten Zweiges vervollständigen die Gesamtmenge. Alternativ kann die explizite Menge `L=\{0;(2+\sqrt{10})/3;(2-\sqrt{10})/3\}` oder eine Folge eindeutig indizierter Einzelwerte angegeben werden.

Nullprodukte akzeptieren `oder`, `\lor`, `\vee` und `\text{oder}`. Explizite Zweiglabels heißen `Fall 1:` beziehungsweise `Zweig 1:` bis Nummer 4 und beziehen sich auf die Reihenfolge einer vorher bewiesenen Zerlegung. Ein Zweig darf nur einen Teil der Gesamtlösungen bearbeiten. Ein abschließend geschriebenes `L=...` muss selbst vollständig sein; frühere Kandidaten reparieren keine unvollständige Abschlussmenge.

Die algebraischen Wurzelvergleiche verwenden CAS-Identitäten und vorzeichenbewiesene Vergleiche quadrierter Beträge. Restpolynome nach Faktordivision werden auch bei unterstützten irrationalen Koeffizienten geprüft. Gleitkommatoleranzen liefern dabei keinen Gleichheits- oder Vollständigkeitsbeweis. Allgemeine algebraische Zahlen und beliebige kubische oder quartische Lösungsverfahren werden dadurch nicht zugesichert.

## Trigonometrie

Die begrenzte Grammatik umfasst `sin`, `cos` und `tan` mit affinen Argumenten `a*x+b`. Der Faktor `a` ist rational und ungleich null. Die Verschiebung ist im Radiantmodus rational plus ein rationales Vielfaches von Pi; im Gradmodus rational. Unterstützt werden Polynome bis Grad zwei im selben Trigonometrie-Ausdruck, explizite Nullprodukte sowie die Identität `sin(u)^2+cos(u)^2=1` bei demselben affinen Argument.

Argumente in Klammern sind die eindeutige Schreibweise. Ein Ausdruck wie `sin x^2` bleibt wegen seiner Mehrdeutigkeit unbewiesen; verwende `sin(x^2)` beziehungsweise `(sin(x))^2` (wobei das erste Argument nicht affin ist). Eine trigonometrische Substitution wie `t=sin(x)` übernimmt den Wertebereich `[-1,1]`; daraus folgt kein `t>0`.

Exakte Umkehrungen verwenden Standardwinkel: Sinus und Kosinus bei `0`, `±1/2`, `±sqrt(2)/2`, `±sqrt(3)/2`, `±1`; Tangens zusätzlich bei `±sqrt(3)` und `±sqrt(3)/3`. Die Wertebereiche der Funktionen bleiben erhalten. Ein allgemeiner unbekannter Umkehrwinkel oder eine beliebige trigonometrische Identität gehört nicht automatisch zum unterstützten Umfang. Eine Tangensidentität mit sämtlichen reellen Zahlen außer unendlich vielen Polstellen ist ebenfalls keine unterstützte Lösungsdarstellung.

Über den reellen Zahlen enthält eine Lösung einen ausdrücklich ganzzahligen Parameter, beispielsweise:

``` text
sin(x)=1/2
x=pi/6+2k*pi oder x=5pi/6+2k*pi, k\in\mathbb{Z}
```

Verschiebungen des ganzzahligen Parameters dürfen dieselbe Familie beschreiben. Ein einzelner Hauptwert von `arcsin` ersetzt die zweite Familie nicht. Offene und geschlossene Intervallgrenzen werden exakt unterschieden. Die Ausgabe endlicher Intervalllösungen ist auf 128 Werte und eine begrenzte Enumeration der ganzzahligen Periodenparameter beschränkt. Sehr breite oder weit verschobene Intervalle können deshalb außerhalb dieses Verfahrens liegen. Pi-Intervallvergleiche verwenden zertifizierte rationale Einschließungen, keine Stichproben.

## Exponentialfunktionen und Logarithmen

Exponentialgleichungen verwenden positive konstante rationale Basen ungleich eins oder die Basis `e` und affine Exponenten. Aktuell ist der Koeffizient von `x` ganzzahlig, ungleich null und im Betrag höchstens 16; konstante rationale Exponentenverschiebungen haben Betrag und Nenner höchstens 16. Unterstützte Kombinationen einer gemeinsamen Exponentialsubstitution führen auf ein Polynom bis Grad zwei. `exp(...)` und die entsprechenden TeX-Schreibweisen sind ebenfalls vorgesehen. Die Hilfsvariable einer Exponentialsubstitution ist positiv: Bei `e^(2x)+e^x-2=0` muss die Hilfswurzel `t=-2` deshalb verworfen werden.

`ln` **und unindiziertes `log` bedeuten den natürlichen Logarithmus**. Für Zehnerlogarithmen sind `lg` und `log_{10}` vorgesehen; `log_{2}` bezeichnet Basis zwei. Zulässige Basen sind positiv und ungleich eins, jedes ursprüngliche Argument muss positiv sein.

Logarithmische Summen, Differenzen und unterstützte ganzzahlige Faktoren werden unter ihren Bedingungen in eine Polynomgleichung bis Grad zwei überführt. Gleiche Logarithmenbasen und die ursprünglichen Definitionsbedingungen bleiben Teil des Nachweises. Aus `ln(x-1)+ln(x+1)=ln(8)` ergibt sich zwar `x^2=9`; wegen `x>1` bleibt nur `x=3`.

Dagegen hat `ln(x^2)=0` beide Lösungen `-1` und `1`. Die Umformung zu `2ln(x)=0` würde die negative Lösung verlieren und ist hier nicht äquivalent. Die Form `2ln(|x|)=0` behält den ursprünglichen Bereich `x!=0` bei.

Eine quadratische Hilfsgleichung nach einer Substitution kann ebenfalls mit p, q, einer ausdrücklich definierten Diskriminante und indizierten ±-Werten bearbeitet werden. Die algebraischen Hilfswurzeln und die zulässigen Rücksubstitutionen werden getrennt geprüft:

``` text
e^(2x)-3e^x+2=0
Substitution: u=e^x
u^2-3u+2=0
p=-3
q=2
D=(p/2)^2-q=1/4
u_{1,2}=-p/2\pm\sqrt{D}
u_1=2
u_2=1
L=\{0;\ln(2)\}
```

Beschriftete Proben prüfen die in die ursprünglichen Gleichungsseiten eingesetzten Ergebnisse, etwa `Probe: e^0=1` nach `x=0`. Eine beliebige wahre Nebenrechnung ersetzt diese Probe nicht. Nach einem falschen Zwischenschritt können korrekte lokale Folgeschritte wieder als richtig erscheinen; die Gesamtbewertung behält den ursprünglichen Fehler.

## Szenarienmatrix

| Ausgangsaufgabe und Kontext | Vollständiges Ergebnis / Prüfaspekt |
| --- | --- |
| `3x^3-4x^2-2x=0` | `0`, `(2+sqrt(10))/3`, `(2-sqrt(10))/3`; mehrere quadratische Verfahren, Zweige und Einzelwerte |
| `3x-5=7`; `2(x+3)=3x-4` | Direkte Sprünge zu `4` beziehungsweise `10`; falsche Randoperation bleibt ein Fehler |
| `sin(x)=1/2`, `[0,2pi)` | `{pi/6;5pi/6}` |
| `sin(x)=1/2`, reell | Zwei periodische Familien mit ganzzahligem Parameter; nur Hauptwert unvollständig |
| `cos(2x)=0`, `[0,2pi)` | `{pi/4;3pi/4;5pi/4;7pi/4}` |
| `tan(x)=1`, reell | `pi/4+k*pi`; Tangenslücken bleiben ausgeschlossen |
| `cos(x)(2sin(x)-1)=0`, `[0,2pi)` | `{pi/6;pi/2;5pi/6;3pi/2}`; Division durch Kosinus darf keine Lösungen verlieren |
| `sin(x)=1/2`, Grad, `[0,360)` | `{30°;150°}` |
| `cos(x)=2` | Leere reelle Lösungsmenge |
| `sin(x)=0`, `[0,2pi)` / `[0,2pi]` | `2pi` ist nur im geschlossenen Intervall enthalten |
| `2^(x+1)=16`; `2^x=3` | `3`; `ln(3)/ln(2)` einschließlich äquivalenter Basiswechsel |
| `e^(2x)-3e^x+2=0` | `{0;ln(2)}` |
| `e^(2x)+e^x-2=0`; `e^x=-1` | `{0}` nach positiver Rücksubstitution; leere reelle Menge |
| `ln(x-1)=0` | `2`, ursprünglicher Bereich `x>1` |
| `log_{10}(x)=2`; `log_{2}(x-1)=3` | `100`; `9` |
| `ln(x-1)+ln(x+1)=ln(8)` | Nur `3`; `-3` verletzt den ursprünglichen Bereich |
| `ln(x^2)=0` | `{-1;1}`; die Einschränkung auf `2ln(x)` ist unzulässig |

Die Tests enthalten zusätzlich falsche Zwischenzeilen, fehlende und zusätzliche Lösungen, widersprüchliche Hilfsdefinitionen, Varianten der TeX-Schreibweise und übergroße Eingaben. Die Matrix beschreibt geprüfte Standardfälle und keine allgemeine Lösung sämtlicher Gleichungen einer Funktionsklasse.

## Integration, Musterlösung und Grenzen

Native Bewertung, öffentliche Prüf-API, Korrektureditor und Zeilenrückmeldung verwenden denselben Aufgabenkontext. Freeze speichert und zeigt den überprüften Rechenweg mit seinen Zeilenbezügen und Rollen. Die automatische Musterlösung wird für unterstützte Aufgaben erzeugt und gegen denselben Prüfer validiert, bevor sie verwendet wird; sie legt keinen obligatorischen Schülerweg fest.

Der kubische Generator deckt einen ausgeklammerten Nullfaktor und einen quadratischen Zweig mit zwei verschiedenen reellen Nullstellen ab. Höhere allgemeine Polynome, gemischte transzendente Gleichungen wie `x+sin(x)=1` oder `ln(x)=x`, nicht unterstützte Basiswechsel in einer gemischten Gleichung und nicht bewiesene Definitionsbedingungen bleiben konservativ **nicht sicher prüfbar** (`unknown`). Das ist kein erfolgreicher Nachweis. Eine nachweislich falsche Aussage, eine unvollständige Lösung und eine nicht bewiesene Aussage bleiben in Ergebnis und Rückmeldung unterscheidbar.

Die Funktionsprüfer arbeiten mit einer reellen Unbekannten, bezeichnet durch einen lateinischen Einzelbuchstaben. Die Grenzen für Zeilenanzahl, Eingabelänge, Verschachtelung, Potenzen und symbolische Kosten bleiben bestehen. Die mathematische Prüfung läuft nach Erkennung beziehungsweise Korrektur im Browser; sie startet nicht während des Schreibens. Längere Rechenwege geben zwischen ihren Zeilen die Oberfläche frei.

## Nachweise

Die algebraischen Varianten werden über `validateCalculationPathSubmission` in `test/calculation-algebra-variations.test.mts` geprüft. Die Funktionsmodule und ihre öffentliche Integration besitzen eigene Regressionstests. Die vorhandenen Tests für schriftliche Grundrechenverfahren bleiben Teil der Gesamtsuite.

`test/browser/function-calculation.test.mts` führt vier echte Makroaufgaben durch den sichtbaren Korrektureditor, beide öffentlichen Bewertungs-APIs, den nativen LiaScript-Quizknopf, Zeilenfeedback und Freeze. Ein kontrollierter OCR-Ersatz öffnet den Editor; die mathematischen Rechenwege werden anschließend sichtbar eingegeben. Dadurch werden keine OCR-Modelle heruntergeladen oder ausgewertet. Wie in der vorhandenen Verfahrensregression wird die KaTeX-Ausgabe des Widgets für diese Strukturprüfung deterministisch ersetzt; geprüft werden Interaktionen, Datenübergaben und Zeilenrückmeldungen, nicht die pixelgenaue Formeltypografie. Diese Prüfung liefert ausdrücklich keinen Nachweis für tatsächliche Handschrifterkennung.

Reproduzierbare Befehle im Repository:

``` powershell
npm run typecheck
npm run test:unit
npm run test:browser:functions
```

Der Browsertest verwendet den aktuellen Produktionsbuild und standardmäßig Chromium, Firefox und WebKit. `LIA_BROWSER_PROJECTS=chromium` beschränkt einen gezielten Lauf auf Chromium. Der Befehl `test:browser:functions` erstellt den Produktionsbuild vor dem Browsertest. `test:browser:full` schließt die neuen Funktionsszenarien ebenfalls ein.


### Ausgeführte Abschlussprüfung am 13. September 2026

- Vollständige Unit-Suite: **661/661 Tests bestanden**, keine ausgelassenen Tests. Enthalten sind algebraische und funktionale Nachweise, Gegenbeispiele, Ressourcenbegrenzungen, schriftliche Grundrechenverfahren und der Vorlagenvertrag.
- TypeScript-Typprüfung und Produktionsbuild erfolgreich. Das aktualisierte Hauptbundle in `dist/index.js` hat 552,79 kB.
- Neue Browsersuite auf dem abschließenden Produktionsbuild: **12/12 Szenarien** in Chromium, Firefox und WebKit bestanden; der Runner zählt mit den drei Browsergruppen **15/15 Tests**. Dauer etwa 208 Sekunden. Geprüft wurden sichtbarer Korrektureditor, beide APIs, falsche und richtige native Quizbewertung, Zeilenfeedback und Freeze.
- Bestehende Chromium-Smoke-Regressionssuite: **28/28 aktive Szenarien** erfolgreich geprüft, durch vollständigen Lauf und gezielte Wiederholung eines aktualisierten Falls. Der bisherige Unknown-Test verwendete eine jetzt unterstützte Sinusgleichung; er verwendet nun die weiterhin nicht unterstützte gemischte Gleichung `x+sin(x)=1`. Die Assertions blieben erhalten. 16 Fälle anderer Engines waren in diesem ausschließlich auf Chromium begrenzten Bestandslauf erwartungsgemäß ausgelassen.

Die mathematischen Browserprüfungen nutzen kontrollierte OCR-Eingaben und die oben beschriebene kontrollierte Widget-Darstellung. Tatsächliche Handschrifterkennung wurde in dieser Abschlussprüfung nicht ausgeführt oder hinsichtlich ihrer Genauigkeit bewertet. Die größere Zeit für kubische Rechenwege in Firefox und WebKit wird durch begrenzte Analysewartezeiten in der Testsuite berücksichtigt; sie ist kein Nachweis identischer Laufzeiten auf allen Endgeräten.
