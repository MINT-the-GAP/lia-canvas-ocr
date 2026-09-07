# BerechneOCR: Priorität 4 – Lösungsverfahren und Rechenkontext

Stand: 6. September 2026.

BerechneOCR prüft nun zusammengehörige Rechnungen im Kontext der ursprünglichen Aufgabe. Nebenrechnungen, Hilfsvariablen, Lösungszweige, Proben und Gleichungen eines linearen Systems müssen dadurch nicht mehr als eine einzige Folge unmittelbar benachbarter Äquivalenzumformungen erscheinen.

Diese Änderung erweitert die fachliche Interpretation der erkannten oder im vorhandenen Editor korrigierten Gleichungen. Sie trainiert kein neues Handschriftmodell und belegt keine höhere Trefferquote der optischen Zeichenerkennung. Sie benötigt keine zusätzlichen Modellaufrufe, keine Sammlung von Schülerhandschrift und keine neue Telemetrie. Die vorhandene Speicherung des Kurszustands und der bewusst erzeugte Freeze-Link behalten ihre bisherige Funktion.

## Bezug zu den TeX-Materialien

Die folgenden Originalstellen im lokalen Repetitorium dienen als Strukturvorgabe. Tests verwenden daraus übernommene beziehungsweise abgeleitete TeX-Beispiele und künstliche Eingaben; es entsteht kein neues Handschriftkorpus.

| Quelle im Repetitorium.tex | Anforderung und Umsetzung |
| --- | --- |
| Zeilen 20983–20989 | Lineare Gleichung mit anschließender Probe: Die Probe wird durch Einsetzen in die Ausgangsgleichung geprüft. |
| Zeile 21347 | Nenner mit Unbekannten: Für die unterstützten Bruchgleichungen bleiben ursprüngliche Nennerausschlüsse erhalten. |
| Zeilen 24321–24338 | Quadratische Ergänzung, Verschiebung, Plusminus und vollständige Lösungsmenge. Die allgemeine Darstellung mit Parametern wird für Tests mit numerischen Koeffizienten instanziiert. |
| Zeile 24450 | Doppelte quadratische Lösung: Eine doppelte Nullstelle verlangt keine zwei verschiedenen Werte. |
| Zeilen 24597–24625 | Lineares Gleichungssystem und Einsetzungsverfahren: Mehrere Ausgangsgleichungen bleiben gemeinsam gültig. |
| Zeile 26205 | Lineares System mit drei Unbekannten und rationalen Lösungen. |
| Zeilen 59564–59580 | Eigene Hilfsvariable und Nebenrechnung: Diese Struktur ist jetzt für eine polynomiale Substitution vorhanden. Die dortige Ableitungsrechnung selbst wird noch nicht allgemein geprüft. |

Quelle: [lokales Repetitorium](<Z:/Drive/Martin - Schule/Material/Repetitorium/Repetitorium.tex>). Die in [Priorität 3](berechneocr-priority-3.md) untersuchten Wochenaufgaben mit Logarithmen, Exponentialausdrücken und Arkuskosinus bleiben Zielmaterial; deren Lösungsverfahren sind hier noch nicht vollständig abgedeckt.

Die Materialien werden nicht blind als mathematischer Sollwert übernommen: Beispielsweise enthält die Gleichungssystemrechnung um Zeile 24616 eine wiederholte Randoperation. Jede Testlösung wird unabhängig fachlich geprüft.

## Unterstützte Abläufe

### Nebenrechnung und Probe

Beschriftungen wie `\text{Nebenrechnung:}` und `\text{Probe:}` werden als Rollen erkannt. Eine korrekte Nebenrechnung ersetzt die Hauptgleichung nicht. Jede Gleichheit innerhalb einer Rechnungskette muss stimmen. Angegebene Operationen dürfen nicht unbemerkt entfallen.

Beispiel:

```tex
3x-2=5x+4
-2x=6
x=-3
\text{Probe:}3\cdot(-3)-2=5\cdot(-3)+4
-11=-11
```

Die Probe bezieht sich auf die ursprüngliche Gleichung, auch wenn dazwischen mehrere Hauptschritte liegen. Eine beliebige wahre Rechnung wie `2+3=5` genügt nicht als Probe dieser Aufgabe. Bei einer einzelnen Gleichung werden nach einem falschen Hauptschritt die folgenden Umformungen relativ zur tatsächlich geschriebenen Gleichung geprüft. Der erste Fehler bleibt für die Gesamtbewertung erhalten; richtige Folgeumformungen erzeugen keine erfundenen zusätzlichen Fehler. Gegenwärtig wird eine einzelne reelle Lösung geprüft; Proben für mehrere Lösungen, Systeme oder mit eigener Randoperationsfolge bleiben zusätzliche Arbeit.

### Quadratische Gleichungen und vollständige Lösungen

Die Prüfung unterstützt quadratische Ergänzung, Diskriminanten-Nebenrechnung, verschobene Plusminus-Ausdrücke, einzeln indizierte Lösungen und explizite Lösungsmengen. Sie unterscheidet:

- einen nachgewiesenen Lösungskandidaten;
- eine vollständige Menge aller reellen Lösungen;
- eine noch nicht isolierte Zwischenzeile;
- einen zusätzlichen falschen oder fehlenden Wert.

`x_{1,2}-2=\pm\sqrt{14}` ist deshalb noch kein fertiger Abschluss. `x_{1,2}=2\pm\sqrt{14}` kann die entsprechende Aufgabe abschließen. Ein später wieder nicht isolierter Hauptschritt macht einen früheren Abschluss nicht automatisch zum Endergebnis. Derselbe einzelne Lösungsindex darf im selben Zweig nicht widersprüchlich neu belegt werden.

Die Polynomprüfung arbeitet mit exakten rationalen Koeffizienten und algebraischen Identitäten. Für Polynome bis Grad vier kann eine vorgelegte endliche Lösungsmenge durch exakte Faktordivision auf Vollständigkeit geprüft werden; dies ist kein allgemeiner Lösungsalgorithmus für beliebige Gleichungen vierten Grades. Für unterstützte quadratische Fälle werden auch doppelte Lösungen, keine reelle Lösung und Identitäten unterschieden.

### Lineare Gleichungssysteme

Zwei oder drei Unbekannte werden gemeinsam geprüft. Die Aufgabe kann etwa als vollständiges `cases`-System vorgegeben werden:

```text
@BerechneOCR(`\begin{cases}x+y=5\\x-y=1\end{cases}`)
```

Im Rechenweg können die beiden Ausgangsgleichungen mit `I.` und `II.` beschriftet werden. `\text{I+II}`, kleine ganzzahlige Linearkombinationen und `\text{II in I}` werden anhand der tatsächlich referenzierten Gleichungen überprüft. Bei einer ausdrücklich genannten Kombination genügt eine zufällig richtige Folgegleichung nicht.

Ein Systemabschluss benötigt die isolierten Werte aller Unbekannten. Der Vergleich vollständiger Systeme berücksichtigt auch den Rang; eine verlorene Bedingung wird nicht durch richtige Einzelgleichungen verdeckt. Singuläre und widersprüchliche Systeme erhalten keine erfundene eindeutige Lösung. Die Koeffizienten sind rational; Systeme mit allgemeinen Parametern oder irrationalen Koeffizienten sind nicht Gegenstand dieser Erweiterung.

### Substitution und Rücksubstitution

Eine frische Hilfsvariable, beispielsweise `u=x^2`, erhält einen eigenen Kontext. Die Hilfsgleichung muss nach Rückeinsetzen der Definition zur Hauptgleichung passen. Erst nachgewiesene Werte der Hilfsvariablen dürfen Rücksubstitutionszweige erzeugen.

Für `x^4-5x^2+4=0` werden damit `u^2-5u+4=0`, die Werte `u=4` und `u=1`, beide Rücksubstitutionen sowie die vollständige Menge `\mathcal{L}=\{-2;-1;1;2\}` zusammen geprüft. Nur einen der beiden Zweige abzugeben genügt nicht. Angegebene Randoperationen direkt an einer mehrwertigen Wurzelzeile werden noch nicht zweigweise bewiesen und bleiben ungeprüft; eine spätere richtige Lösungsmenge darf sie nicht verdecken. Derzeit ist eine polynomiale Hilfsdefinition mit einer ursprünglichen Unbekannten und Grad eins oder zwei vorgesehen; verschachtelte allgemeine Hilfsdefinitionen fehlen noch.

### Bruchgleichungen

Bei unterstützten Bruchgleichungen werden die ursprünglichen Nenner vor dem Kürzen erfasst. Bei `\frac{x^2-1}{x-1}=0` bleibt `x=1` ausgeschlossen, auch wenn anschließend nur noch `x+1=0` dasteht. Neue Nennerausschlüsse dürfen nicht unbemerkt hinzukommen.

Eine ausdrücklich angegebene Multiplikation mit `\cdot(x-1)` kann bei passendem ursprünglichem Ausschluss geprüft werden: Der Faktor muss im zulässigen Bereich ungleich null sein, beide Seiten müssen der angegebenen Operation entsprechen und die erhaltene Gleichung muss im ursprünglichen Definitionsbereich gleichwertig bleiben.

Der Umfang ist begrenzt auf eine Unbekannte, lineare einzelne Nenner und einen entstehenden Zähler bis Grad zwei. Eine endliche Lösungsliste wird gegen die ursprünglichen Ausschlüsse geprüft. Unendliche Lösungsmengen mit ausgeschlossenen Einzelwerten, allgemeine variable Wurzeln und nichtlineare Nenner bleiben offen.

## Anzeige, Grenzen und Laufzeit

Die Zeilenprüfung und die native Bewertung nutzen den Rechenkontext. Die Anzeige kennzeichnet unter anderem Nebenrechnung, Definition, Probe und Lösungszweig. Liegt die Quellgleichung weiter oben, werden die tatsächlichen Zeilennummern angegeben. Freeze übernimmt Rollen und Zeilenbezüge mit optionalen Feldern im weiterhin kompatiblen Format `cr1`.

Der Textparser berücksichtigt vollständige TeX-Gruppen, Systemklammern, römische Beschriftungen und mehrere vollständig geschriebene Gleichungen in einer Zeile. Das allein löst noch keine beliebige zweidimensionale Handschriftanordnung. Unbeschriftete unabhängige Spalten und über mehrere physische Editorzeilen zerrissene TeX-Umgebungen werden nicht zuverlässig zu einem Verfahren zusammengesetzt. Eindeutige Rollenbeschriftungen und vollständige Gleichungszeilen sind die derzeit belastbare Eingabeform.

Nicht beweisbare Schritte bleiben ausdrücklich ungeprüft und werden nicht als richtige Abgabe angenommen. Das gilt auch für viele trigonometrische, logarithmische, exponentielle, Ableitungs- und Integralverfahren, allgemeine Parameter, Ungleichungssysteme und komplexe Lösungen. `i` bleibt im neuen Prüfpfad vorsichtshalber ungeprüft, weil das eingebundene CAS diesen Buchstaben als imaginäre Einheit reserviert. `e` behält seine bisherige Bedeutung als Eulerkonstante. In expliziten Lösungsmengen trennen Komma oder Semikolon die Einträge; Dezimalwerte dort mit Dezimalpunkt schreiben.

Ein vorgeschalteter Kostenwächter begrenzt Länge, Verschachtelung, Exponenten und geschätzte Expansion, bevor ein Ausdruck das CAS erreicht. Er schützt auch den bisherigen Prüfpfad innerhalb von BerechneOCR. Das ist eine konservative Begrenzung der unterstützten Ausdrücke, keine garantierte Laufzeitobergrenze für jede CAS-Operation. Die Liveprüfung gibt zwischen angezeigten Zeilen die Browsersteuerung frei. Es gibt keine neue Modellschleife zur Suche nach einer mathematisch passenden OCR-Antwort.

Die vier schriftlichen Grundrechenarten behalten ihre eigenen Prüfungen für Überträge, Entleihen, Teilprodukte und Division. Gewöhnliche Multiplikation wird weiterhin als `\cdot` dargestellt. Die vorhandene automatische Musterlösungserzeugung wird nicht pauschal auf alle neuen Klassen erweitert; ihre bisherigen unterstützten Beispiele werden gegen den neuen Prüfer getestet.

## Validierung

- `npm run check`: Typprüfung, **466 Unit-Tests** und Produktionsbuild erfolgreich. Darunter sind 57 Tests der vollständigen Rechenwege einschließlich aller 24 bisherigen Musterlösungsbeispiele.
- Die **drei neuen Browserfälle** bestehen gegen den finalen Build in Chromium, Firefox und WebKit: echter Korrektureditor, native Bewertung, beide öffentlichen Prüf-APIs, Rollenanzeige, Zeilenbezüge und Freeze. Beide öffentlichen APIs lehnen auch die abschließend ergänzte Wurzelzeile mit einer nicht ausgeführten Randoperation ab. Die OCR-Antwort wird für diese Verfahrensprüfungen kontrolliert vorgegeben; Modelle werden dabei nicht heruntergeladen.
- Insgesamt **41 Browserfälle** abgedeckt: 38 im vollständigen Durchlauf erfolgreich, die drei allgemeinen Sammelfälle nach den Korrekturen erfolgreich in Chromium, Firefox und WebKit wiederholt. Sie sichern unter anderem die vier schriftlichen Grundrechenarten, Korrekturen, OCR-Caches, Sprachwechsel, Freeze, Folgefehler und bisherige exakte Wurzelverfahren ab. Der freie OCR-Testharness hat dabei ausdrücklich keinen fremden Aufgaben-Prompt; echte Quiztests behalten ihre vorgegebenen Aufgaben.
- Produktionsbundle: 471486 Bytes, SHA-256 `bf7fd4ba9a1e41de82a1685dc4ab3c874a1a681f87b73f9b1a314414bb9c84f0`.

Die Tests umfassen positive vollständige Verfahren sowie falsche Zwischenwerte, verlorene Lösungen, widersprüchliche Lösungsindizes, falsche Proben, übersprungene Operationen und Nennerausschlüsse. CAS-Kostenüberschreitungen werden mit einem protokollierenden Testlaufzeitobjekt geprüft; gefährlich große Potenzen werden dabei nicht tatsächlich ausgerechnet.

Reproduzieren:

```powershell
npm run check
npm run test:browser:smoke
```

Wesentliche Implementierung: [Rechenkontext](../src/math/calculation-path.ts), [Strukturparser](../src/math/calculation-structure.ts), [Polynomprüfung](../src/math/nonlinear-proof.ts), [Bruchgleichungen](../src/math/rational-equation-proof.ts), [lineare Systeme](../src/math/linear-system-proof.ts) und [Kostenwächter](../src/math/calculation-proof-budget.ts).
