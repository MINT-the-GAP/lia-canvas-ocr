# BerechneOCR: Priorität 5 – Materialbezug und messbare Qualität

Stand: 6. September 2026.

Dieser Schritt schafft eine wiederholbare Prüfung gegen das Repetitorium, die TeX-Materialien und künstliche Stricheingaben. Er erfasst Erkennungsfehler, fehlende Lösungsverfahren und Laufzeit getrennt. Die produktive Zeichenerkennung bleibt auf dem bisherigen Modell. Ein durch diese Messung belegter Fehler bei Dezimalzahlen mit OCR-Leerzeichen wird in der mathematischen Prüfung behoben. Eine neue allgemeine Genauigkeits- oder Geschwindigkeitssteigerung wird hier nicht behauptet.

## Materialbestand und nachvollziehbare Quellen

| Bestand | Ergebnis |
| --- | ---: |
| Gelesene TeX-Dateipfade | 2.043 |
| Unterschiedliche Dateiinhalte | 1.811 |
| Bytegleiche weitere Kopien | 232 |
| Lexikalisch erfasste mathematische Bereiche | 140.835 |
| Davon mit Gleichheitszeichen | 26.263 |
| Dateien mit Scan-Hinweisen | 105 |
| Dateien mit explizit verworfenen oder begrenzten Bereichen | 31 |
| Lesefehler | 0 |

Der Scanner überspringt im gesamten Bestand 2.692 leere Tabellenzellen, 10.863 leere TikZ-Gruppen und 8.806 sicher erkannte TikZ-Koordinatenberechnungen. Das Repetitorium allein umfasst 129.682 gelesene Zeilen und 15.493 erfasste Bereiche, davon 2.363 mit Gleichheitszeichen.

**Diese Zahlen sind keine vollständige Aufgabenzählung.** Auch nach der eng begrenzten Fehlererholung bleiben 52 überlange und 1.440 verworfene fehlerhafte Bereiche sowie 50 ungeschlossene Bereiche im gesamten Bestand sichtbar. Im Repetitorium sind unter anderem zwölf überlange und 105 verworfene Bereiche dokumentiert. Die Dateien werden gelesen, aber Teile ihres mathematischen Inhalts sind lexikalisch nicht verlustfrei aufgeschlüsselt. Die gespeicherte Hinweisliste ist je Datei auf 1.000 Einträge begrenzt; Gesamtzähler je Ursache gehen darüber hinaus und werden nicht abgeschnitten.

Das [Materialinventar](benchmarks/material-coverage-2026-09-06.json) enthält relative Dateipfade, Prüfsummen, Merkmalszahlen und begrenzte Quellenbeispiele mit Zeilennummern. Bytegleiche Kopien zählen für Strukturzahlen einmal. Die Dateiauswahl umfasst auch andere Fächer; ein mathematisch klingender Pfad ist lediglich ein Hinweis und kein fachlicher Klassifikator.

Der Scanner liest Quelltext lexikalisch. Er expandiert weder Makros noch eingebundene Dateien und zählt keine semantisch eigenständigen Aufgaben. Kommentare und wörtliche Codebereiche werden übersprungen. Leere Tabellenzellen und sicher erkannte TikZ-Koordinatenberechnungen erhalten eigene Zähler. Mehrdeutigkeiten, ungeschlossene Bereiche und Begrenzungen bleiben im Bericht sichtbar. Merkmalszahlen wie „Dezimalkomma“ sind Suchhinweise, keine vollständige mathematische Analyse.

Die fachlichen Testfälle besitzen zusätzlich einen konkreten Quellenanker, ein enges Zeilenfenster und eine Beschreibung jeder Anpassung. Diese Anker werden unabhängig vom lexikalischen Inventar direkt gegen die Originaldatei geprüft. Keine Kapitelkopien oder personenbezogenen Schreibproben werden in den Testbestand übernommen.

## Was die mathematische Prüfung nachweislich abdeckt

Der [kuratierte TeX-Korpus](../test/fixtures/material-calculation-corpus.mts) enthält 28 Fälle aus 26 Familien. 21 korrekte Wege bestehen; ihre 21 kontrolliert falschen Varianten werden abgelehnt. Sieben mathematisch korrekte Wege dokumentieren offene Unterstützung. Ein grüner Test für eine bekannte Grenze macht diese Grenze nicht zur abgedeckten Aufgabe.

| Bereich | Fälle | Nachweis bzw. heutige Grenze | Quellenzeilen |
| --- | ---: | --- | --- |
| Lineare Gleichungen, Dezimalkomma, konstante Brüche, Klammern | 6 unterstützt | Randoperationen, Zusammenfassen und Isolieren; falsche Zwischenwerte bleiben Fehler. | R 21021–21029; 21121–21123; 21272–21274; 21292–21294 |
| Quadratische Gleichungen | 6 unterstützt | Wurzelpaar, Ergänzung, Diskriminante, doppelte Nullstelle, Nullprodukt, leere reelle Lösungsmenge. | R 20363–20364; 24347–24351; 24391–24394; 24429–24432; 24449–24451 |
| Kubik-/Viertwurzel, biquadratische Substitution | 3 unterstützt | Vollständige reelle Lösungen und beide Rücksubstitutionszweige. | R 20363–20365; 48891–48893 |
| Variable Nenner | 2 unterstützt | Ursprüngliche Ausschlüsse bleiben beim Beseitigen und Kürzen von Nennern erhalten. | R 21345–21348; 52537–52544 |
| Lineare Gleichungssysteme | 2 unterstützt | Einsetzen mit Gleichungsbezügen; vollständige Lösungen für zwei bzw. drei Unbekannte. | R 24597–24625; 26204–26206 |
| Probe und Nebenrechnung | 2 unterstützt | Prüfung gegen die Ausgangsgleichung; vollständige Gleichheitsketten. | R 20966–20989 |
| Logarithmus-/Exponentialgleichungen | 2 offen | Umkehrregeln, Definitionsbereiche und variable Exponenten haben keinen passenden Verfahrensprüfer. | R 20615–20618 |
| Arkuskosinus mit Exponentialausdruck | 1 offen | Verkettete Umkehrschritte und Definitions-/Wertebereiche werden nicht bewiesen. | Wochenaufgabe 19, 401–408 |
| Ableiten und Integrieren | 2 offen | Eigene Funktionsoperationen und Stammfunktionen einschließlich `+C` fehlen. | R 60594–60600 |
| Symbolische Parameter | 1 offen | Voraussetzungen wie `a≠0` und parametrische Fallunterscheidungen fehlen. | R 21344–21346 |
| Vektorrechnung | 1 offen | Kein eigener Prüfer für komponentenweise Vektoraddition. | R 71746–71750 |

R bezeichnet `Repetitorium/Repetitorium.tex`. Die Wochenaufgabe liegt unter `12. Klasse/Mathe/Wochenaufgaben/Klasse 12 Woche 19.tex`. Der Bericht enthält alle einzelnen Aufgaben, Sollwege, Fehlerwege, Quellenanker und tatsächlichen Prüfentscheidungen.

Einzelne Beispiele sind ausdrücklich abgeleitet: Wurzelwertaufgaben wurden in zugehörige Gleichungen überführt; beim biquadratischen Beispiel wurden Koeffizienten für rationale Hilfswurzeln geändert. Die Sollwege wurden mathematisch unabhängig erstellt und nicht aus den Antworten des Prüfers generiert. Aus 21 bestandenen TeX-Fällen folgt weder eine OCR-Trefferquote noch eine Erfolgsquote für den gesamten Materialbestand.

## Messung durch den echten BerechneOCR-Ablauf

Der [Bildkorpus](../test/fixtures/ocr-pipeline-corpus.mts) besteht aus elf festgelegten synthetischen Strichzeichnungen: lineare Umformungen, bewusst falscher Zwischenwert, Multiplikationspunkt, Dezimalkomma, Bruch, Potenz/Wurzel/Indizes, Gleichungssystem, lange Gleichung, quadratische Ergänzung und Probe. Die Strukturen orientieren sich an den untersuchten Anforderungen; diese Zeichnungen sind selbst konstruierte Varianten, keine wortgleichen Transkriptionen der Materialaufgaben.

Acht Fälle dienen der Entwicklung, drei bilden einen vor der Messung festgelegten Aufgaben-Holdout. Varianten derselben Grundaufgabe bleiben im selben Teilbestand. Beide verwenden dieselben synthetischen Zeichen und denselben Renderer: Es handelt sich nicht um unabhängige Schreibstile. Mit der jetzt veröffentlichten Messung ist dieser Holdout ausgewertet; Anpassungen anhand dieser Ergebnisse verlangen für eine neue unabhängige Bewertung einen neuen Holdout.

Der Runner öffnet echte LiaScript-Aufgaben, zeichnet per Mausereignissen auf die Zeichenfläche, drückt Absenden und liest Vorschau sowie natives Antwortfeld aus. Er verwendet die reale FP32-Referenzengine einschließlich produktiver Zuschnitte, Zeilengruppierung, Symbolbehandlung, Aufteilung langer Gleichungen, zusätzlicher Erkennungsversuche und mathematischer Prüfung. Die beiden öffentlichen Prüf-APIs müssen übereinstimmen. Kein Solltext ersetzt eine Modellantwort.

Die Messung hält fünf Dinge auseinander:

- Unveränderte Rohtexte und Vergleich nach eng begrenzter typografischer Normalisierung. Leerzeichen außerhalb von Text und gleichwertige TeX-Darstellungen wie `\dfrac`/`\frac` dürfen sich unterscheiden.
- Mathematische Zeichen und Anordnung. `\cdot` und `\times`, `x` und `X`, Indizes, Plusminus und explizite Zeilengrenzen bleiben verschieden. Es gibt keine algebraische Gleichsetzung zur Verbesserung der OCR-Quote.
- Annahme/Ablehnung und Begründung der erkannten Rechnung. Eine richtige Endzahl reicht nicht für einen richtigen Lösungsweg.
- Zeit von Absenden bis zur fertigen Prüfansicht und reale Modellaufrufe. Laden, Zeichnen und zusätzliche API-Prüfung stehen separat.
- Erneutes Absenden derselben unveränderten Zeichnung als eigene Cachemessung. Das zählt nicht als neue Erkennung.

Fehlgeschlagene oder nicht ausgeführte geplante Messungen bleiben im Nenner. Rein diagnostische Bilddateifehler löschen keine bereits abgeschlossene OCR-Messung. Überlange oder nicht sicher vergleichbare Texte werden nicht stillschweigend als exakte Treffer gewertet.

Die [vollständige Ausgangsmessung](benchmarks/ocr-pipeline-2026-09-06.json) umfasst zwei Wiederholungen je Fall, also 22 geplante und abgeschlossene Läufe. Sie lief vor der unten beschriebenen Dezimalkorrektur auf dem Bundle von Priorität 4. Chromium 151.0.7922.34 unter Windows, 16 logische Prozessoren, WASM/FP32, ein Thread, keine Cross-Origin-Isolation. Modellrevision: `63e04c86fc96c2324811114351eeea8118bf6b28`.

| Teilbestand | Zeichengetreue Wege nach typografischer Normalisierung | Richtige Annahme/Ablehnung | Absenden bis Prüfansicht, Median |
| --- | ---: | ---: | ---: |
| Entwicklung, 8 Aufgaben × 2 | 10/16 | 8/16 | 1.851 ms |
| Aufgaben-Holdout, 3 Aufgaben × 2 | 0/6 | 0/6 | 2.918 ms |
| Gesamter kleiner Korpus | 10/22 | 8/22 | 2.870 ms |

Das entspricht fünf von elf vollständig zeichengetreuen Zeichnungen in beiden Wiederholungen. Die Zeilenanzahl stimmt in 22/22 Läufen. Der strikte Rohtextvergleich ergibt wegen OCR-Leerzeichen 0/22; deshalb stehen Rohtext und typografischer Vergleich nebeneinander. Die gepoolte Tokenfehlerrate beträgt 54/520 = 10,38 %. Tokenfehler sind Einfügungen, Löschungen und Ersetzungen nach der dokumentierten Normalisierung.

Insgesamt entstanden 94 echte Modellaufrufe. Das lokale Laden dauerte 4,08 s, der erste Modellaufruf ist separat markiert. p95 der 22 kompletten Rechenblöcke: 4.648 ms. Diese Werte lassen sich nicht direkt mit der einzelnen Engine-Erkennung aus Priorität 2 vergleichen. Mehrere Zeilen und zusätzliche Erkennungsversuche erzeugen mehrere Modellaufrufe.

22 erneute Abgaben derselben Zeichnung benötigten keine weiteren Modellaufrufe; der Median lag bei 85 ms. Dieser vorhandene Cacheeffekt ist kein neuer Beschleunigungsnachweis. Diagnosebeobachter und Zuschnittbilder verursachen Messaufwand; API-Zeiten werden separat ausgewiesen. Es gab keine fehlenden Läufe, Skriptfehler, Netzwerkfehler oder fehlgeschlagenen Bildartefakte. Die bekannte ONNX-Warnung zur Encoder-Ausgabegröße blieb sichtbar und steht in den Rohdaten.

Die kleine, gezielt zusammengestellte Stichprobe erlaubt keine allgemeine Trefferquote für Schülerhandschrift, andere Geräte oder den gesamten Materialbestand.

## Konkrete Befunde und nächste technische Schritte

- **Gewöhnliche Multiplikation:** `x=23\cdot4` und die lange Gleichung wurden in beiden Wiederholungen mit `\cdot` zeichengetreu erkannt und korrekt geprüft. Der Bruchfall besteht ebenfalls.
- **Falscher Lösungsweg:** Der absichtlich falsche Zwischenwert `3x=15` blieb erhalten. Beide Wiederholungen wurden als `incorrect` abgelehnt; die OCR darf diese Zahl nicht zum passenden Wert umschreiben.
- **Randoperationen:** `:3` wurde im gültigen Entwicklungsfall als `i 3` erkannt; im Holdout wurde `:5` zu `\cdot5`. Als nächstes sollten die vorhandenen geometrischen Punktmerkmale im konkreten Randoperationszuschnitt geprüft werden. Zwei vertikal angeordnete Punkte müssen von einem Multiplikationspunkt unterschieden bleiben. Der erwartete Rechenausgang darf diese Entscheidung nicht erzwingen.
- **Unnötige Modellarbeit:** Im gültigen linearen Fall entstanden acht Aufrufe; identische Teilbilder wurden innerhalb zusätzlicher Versuche erneut erkannt. Ein enger Cache für identische Zuschnitte samt Modell-/Optionsschlüssel könnte diese Doppelarbeit vermeiden. Das muss gegen identische Ausgaben und Fehlerfälle gemessen werden, bevor daraus eine Geschwindigkeitsangabe folgt.
- **Variablen und Rollen:** `x`/`X` sowie `y`/`Y` wurden verwechselt. `Probe` kam als einzelne mathematische Buchstaben an; römische Zeilenlabels erhielten zusätzliche TeX-Auszeichnungen. Diese Fälle brauchen strukturbezogene Kandidaten und Rollenlesung. Ein pauschales Kleinschreiben würde echte verschiedene Variablen verfälschen.
- **Fachliche Erweiterung:** Die sieben offenen Verfahren im Materialkorpus benötigen eigene Prüfregeln und Voraussetzungen. Verbesserte Zeichenerkennung allein beweist weder logarithmische Umkehrungen noch Ableitungen, Integrale oder Vektoroperationen.

### Belegter Fehler direkt behoben: Dezimalzahlen mit OCR-Leerzeichen

Die Ausgangsmessung erkannte `x = 1, 5 \cdot 2` korrekt, der mathematische Leser verlangte jedoch direkt benachbarte Ziffern am Komma und gab `unknown` zurück. Die Zahlenlesung in [equivalence.ts](../src/math/equivalence.ts) akzeptiert jetzt normale TeX-Quellleerzeichen innerhalb dieses Dezimalliterals. Das sichtbare OCR-Transkript wird nicht verändert. Unvollständige Zahlen, Mehrfachkommas und Trennung durch TeX-Befehle bleiben ungültig; Listen, Lösungsmengen und Indizes werden vorher strukturell behandelt.

Der [echte Nachlauf](benchmarks/ocr-pipeline-decimal-fix-2026-09-06.json) mit demselben Entwicklungsfall und zwei Wiederholungen bestätigt:

| Merkmal | Ausgangsmessung | Nach der Korrektur |
| --- | --- | --- |
| Erkannte Zeilen | `x = 1, 5 \cdot 2`; `x = 3` | identisch |
| Typografisch zeichengetreu | 2/2 | 2/2 |
| Korrekte Annahme | 0/2, `unknown` | 2/2, `correct` |
| Modellaufrufe je Zeichnung | 2 | 2 |

Der Nachlauf benötigte im Median 1.316 ms bis zur Prüfansicht. Das ist kein Beschleunigungsnachweis: Er läuft in einem frischen Modellkontext und führt jetzt eine tatsächliche mathematische Prüfung aus. Der belegte Gewinn ist die korrekte Verarbeitung bereits richtig erkannter Dezimalzahlen ohne weitere Modellaufrufe.

Der komplette 22er-Bestand wurde nach diesem begrenzten Entwicklungsfix nicht erneut optisch gemessen. Insbesondere bleibt der ausgewertete Holdout unverändert; aus dem Zweier-Nachlauf wird keine neue Gesamttrefferquote konstruiert.

## Wiederholen und erweitern

Node 24 mit den vorhandenen Projektabhängigkeiten wird vorausgesetzt. Die normalen Tests benötigen keine Handschriftdateien. Ist der private Materialordner auf einem anderen Rechner nicht vorhanden, entfällt nur die lokale Quellenankerprüfung. Mit explizitem `LIA_OCR_MATERIAL_ROOT` werden fehlende Quellen zum Fehler.

```powershell
npm run audit:materials -- --materials "Z:\Drive\Martin - Schule\Material" --output docs/benchmarks/material-coverage-2026-09-06.json
npm run benchmark:ocr-pipeline -- --validate-only
npm run benchmark:ocr-pipeline -- --repeats 2 --output docs/benchmarks/ocr-pipeline-2026-09-06.json
npm run check
```

Das Materialaudit kann mit `--inventory-only` ausschließlich inventarisieren. Der Bildbenchmark akzeptiert `--assets DIR`, `--cases id,...` und ein bis fünf Wiederholungen. Die Modelle müssen zuvor entsprechend [Priorität 2](berechneocr-priority-2.md) lokal vorbereitet und geprüft sein. Standardpfad: `%TEMP%/lia-ocr-priority2-models`. Der Benchmark startet erst nach Manifest- und SHA-256-Abgleich; `--validate-only` lädt kein Modell in den Browser.

Die Gewichte kommen aus dem lokalen Spiegel. LiaScript und Laufzeitressourcen dürfen weiter von ihren normalen externen URLs laden; die Messung ist daher kein vollständiger Offline-Test. Die Ladezeit beschreibt insbesondere keinen erstmaligen Internetdownload. Berichte enthalten Modellrevision, Eingabeprüfsummen, Browserumgebung und tatsächlich geladene Skriptressourcen. Standardmäßig schreibt der Benchmark nur den JSON-Bericht. Mit dem ausdrücklichen Schalter `--save-images` entstehen zusätzlich selbst konstruierte Zeichnungen, Vorschauen und Modellzuschnitte in `*.json.assets`; diese Verzeichnisse sind von Git ausgeschlossen. Der standardmäßige Berichtspfad liegt weiterhin im temporären Verzeichnis.


Die 146 Diagnose-PNGs der dokumentierten Ausgangsmessung und des Dezimalnachlaufs wurden nach der Auswertung aus dem Repository entfernt. Sie waren keine Eingaben für Tests oder Anwendung. Die historischen JSON-Pfade beschreiben den ursprünglichen Speicherort; `artifactRetention` kennzeichnet die nicht im Repository aufbewahrten Bilder. Sollstriche, Rohtexte, Bewertungen, Zeiten und Zuschnitt-Prüfsummen bleiben erhalten. Die ursprünglichen Messungen enthielten die damalige Diagnosearbeit; durch das neue Ausgabe-Flag werden deren Zeiten nicht nachträglich neu interpretiert.

Neue Anforderungen bekommen zuerst eine belegte Materialquelle, einen unabhängig geprüften richtigen und einen gezielt falschen Weg. Danach folgen synthetische Strichvarianten mit vorab festgelegtem Solltext. Für jede Änderung werden Zeichenfehler, Prüfentscheidung, Anzahl der Modellaufrufe und Laufzeit gemeinsam verglichen. Eine einzige zusammengefasste „Genauigkeit“ würde die gefundenen unterschiedlichen Ursachen verdecken.

## Validierung und Artefaktstand

`npm run check` besteht: Anwendungstypecheck, **537/537 Tests**, keine ausgelassenen Tests, Produktionsbuild. Darin enthalten sind 17 Scanner-, 16 Metrik-, 32 Materialkorpus-, zwei Bildkorpus- und vier gezielte Dezimal-Testfälle bzw. Testgruppen. Die mathematischen Tests umfassen korrekte und kontrolliert falsche Wege; bekannte Lücken bleiben als solche ausgewiesen.

Zusätzlich wurden die geprüften Modelle validiert, alle 22 geplanten Ausgangsläufe und zwei echte Dezimal-Nachläufe abgeschlossen. Die bestehenden vier schriftlichen Rechenverfahren bleiben Teil der gesamten Testsuite.

- Bundle der Ausgangsmessung: SHA-256 `bf7fd4ba9a1e41de82a1685dc4ab3c874a1a681f87b73f9b1a314414bb9c84f0`.
- Neues `dist/index.js`: 471.406 Byte, SHA-256 `15faddc25fdc3eab7c953900c8acfe6332d2a6b21602d526f68c670a7bbbb4d8`.

Alle neuen Schreibproben sind künstlich erstellt. Es gibt keine Sammlung von Eingaben von Schüler:innen, kein Modelltraining mit deren Daten und keine neue Telemetrie. Die Werkzeuge schreiben nur bei ausdrücklichem lokalen Aufruf ihre Entwicklungsberichte.
