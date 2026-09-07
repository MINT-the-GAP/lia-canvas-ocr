# BerechneOCR: Integrationstest und Groß-/Kleinschreibung

Stand: 6. September 2026. Geprüft werden der gemeinsame Stand der Prioritäten 1–5, die mathematische Verarbeitung und die echte lokale OCR mit synthetisch konstruierten Strichen. Es werden keine Schreibdaten von Schüler:innen erhoben.

## Behobene Fehler

- Die OCR-Nachbearbeitung schreibt ein erkanntes `X` nicht mehr pauschal in `x` um. Dasselbe Prinzip gilt für gemischte Variablen, Indizes und griechische Großbuchstaben. Auch der Hinweis auf fehlende positive/negative Wurzeln verbindet nur gleich geschriebene Variablen.
- Gültige Multiplikationen mit vorzeichenbehafteten Faktoren, etwa `3\cdot(-5)` und `3\cdot-5`, bleiben Multiplikationen. Ein Quantor wird nicht allein wegen benachbarter Gleichungen in eine `3` umgeschrieben.
- Ein Doppelpunkt unmittelbar rechts eines geometrisch bestätigten Operationsstrichs kann aus zwei klar getrennten Punkten im endgültigen Raster erkannt werden. OCR liest anschließend den vollständigen Operanden. Das behebt die beobachteten Verwechslungen `:3` mit `i3` und `:5` mit einem Multiplikationspunkt, sofern die Geometrie eindeutig ist. Radierungen, abgeschnittene Tinte und unklare Zeichen fallen auf den bisherigen Weg zurück.
- TeX-Ausgaben wie `Y { = } 2` sind als Gleichung prüfbar und ausrichtbar, ohne den Originaltext zu ändern. Gruppen in Exponenten, Befehlsargumenten, Texten oder Matrizen werden dabei nicht als neue Hauptrelationen behandelt.
- Die Pfadprüfung kann einen falschen ersten Hauptschritt nicht mehr überspringen, nur weil eine spätere Zeile zur Aufgabe passt. Einleitende Beschriftungen und ausdrückliche Nebenrechnungen bleiben erlaubt.

Die Layoutversion `lines-v24-geometric-division-head` verhindert die Wiederverwendung alter automatischer OCR-Ergebnisse. Schriftliche Rechenverfahren behalten ihre eigenen Strukturprüfungen. Eine ausdrückliche Substitution wie `X=x^2` bleibt mathematisch zulässig; sie ist keine allgemeine Gleichsetzung von `x` und `X`.

## Was die Testarten belegen

Die Unit- und Browserregressionen prüfen unter anderem richtige und falsche Rechenschritte, deklarierte Randoperationen, LGS, Nebenrechnungen, Probe, Korrektureditor, Antworttransport und Freeze. In den Browserregressionen sind OCR-Ausgaben kontrollierte Testwerte. Ein grüner UI-Test allein belegt deshalb keine Bildgenauigkeit.

Der echte Modelltest verwendet 23 konstruierte Zeichnungen: die bisherigen elf Verfahren-/Layoutfälle sowie zwölf neue Fälle für `x/X/y/Y`. Zehn neue Fälle besitzen absichtlich verschiedene Buchstabenformen und gemeinsame Grundlinien; zwei weitere haben identische Kreuzstriche und identische Aufgaben, aber verschiedene beabsichtigte Groß-/Kleinschreibung. Diese beiden mehrdeutigen Kontrollen werden separat ausgewiesen. Die elf alten Zeichnungen sind kein eigens geprüfter Bestand zur visuellen Unterscheidbarkeit der Buchstaben.

Die Solltexte und kontrolliert falschen Schritte bleiben unverändert. Mathematische Annahme, exakte Transkription und Laufzeit sind getrennte Messungen. Der strenge TeX-Vergleich zählt auch zusätzliche `{=}`-Gruppen als Abweichung; eine korrekte Darstellung oder Bewertung wird daher nicht automatisch als exakte Transkription gezählt. Ein bloßes `unknown` bei einem falschen Weg ist keine erfolgreiche Erklärung des Fehlers.

Die Splitnamen development/holdout dokumentieren die Herkunft der Zeichnungen. Nach Einsicht in diesen Durchlauf sind die verwendeten Fälle Diagnose- und Regressionsevidenz, kein unberührter unabhängiger Nachweis allgemeiner Handschriftgenauigkeit.

## Ergebnisse mit dem echten Modell

Alle 23 geplanten Ausgangsläufe und alle 23 Nachläufe wurden ausgeführt. Hinzu kamen fünf gezielte Vergleiche mit doppelter Pixeldichte. Modell: gepinntes FormulaNet, Revision `63e04c86fc96c2324811114351eeea8118bf6b28`, Referenzprofil FP32/WASM. Es wurden weder neue Gewichte trainiert noch Modellantworten durch Sollgleichungen ersetzt.

| Neue Buchstabenfälle (10 Zeichnungen) | Ausgangslauf | Nachlauf |
| --- | ---: | ---: |
| Gewünschte Annahme/Ablehnung (`accepted`) | 5/10 | 9/10 |
| Davon eindeutiges Ergebnis `correct`/`incorrect` statt `unknown` | 4/10 | 9/10 |
| Vollständig richtige Folge von `x/X/y/Y` | 8/10 | 8/10 |
| Strenger normalisierter TeX-Gesamtvergleich | 3/10 | 3/10 |

Die Verbesserung der Bewertung kommt hier aus der Behandlung von `{=}` und der Pfadprüfung. Sie ist keine Verbesserung der optischen Buchstabenrate. Der strenge Gesamtvergleich bleibt unter anderem wegen der unverändert erhaltenen TeX-Gruppen niedriger. Bei einem ohnehin falschen Weg kann eine Ablehnung zudem aus einer anderen falsch gelesenen Zeile entstehen; sie beweist nicht die genaue Erkennung des beabsichtigten Fehlers.

Im Nachlauf werden die vier Einzelfälle `x`, `X`, `y`, `Y`, das korrekte gemischte `y/Y`-System sowie beide Systeme `x/y` und `X/Y` angenommen. Der absichtlich falsche `Y`-Zwischenschritt wird beanstandet. Beim korrekten `x/X`-System liest das Modell hingegen `x+x=5` und `X-X=1`; deshalb wird dieser korrekte Weg abgelehnt. Der zugehörige absichtlich falsche Weg wird ebenfalls abgelehnt, enthält aber dieselben Transkriptionsfehler.

Bei den elf bisherigen Verfahren-/Layoutzeichnungen stimmen im Nachlauf fünf Gesamttranskriptionen nach der strengen Normalisierung. Auch die gewünschte Annahme/Ablehnung stimmt in fünf Fällen. Offen bleiben insbesondere optische Groß-/Kleinverwechslungen, die beschriftete Probe (`P r o b e :`) und beschriftete Systeme. Die beiden identischen mehrdeutigen Kreuzkontrollen werden separat ausgewiesen: Identische Bildinformation kann die zwei verschiedenen beabsichtigten Schreibweisen nicht eindeutig belegen.

| Randoperationsfall | Modellaufrufe vorher → nachher | Gesamtdauer vorher → nachher | Nachlauf |
| --- | ---: | ---: | --- |
| `3x-5=7`, `3x=12 | :3`, `x=4` | 8 → 5 | 4.621 → 3.008 ms | korrekt gelesen und angenommen |
| Derselbe Weg mit absichtlich falscher `15` | 6 → 5 | 3.608 → 2.861 ms | geschriebene falsche Zahl bleibt erhalten; Weg abgelehnt |
| `5x+6=21`, `5x=15 | :5`, `x=3` | 5 → 5 | 2.843 → 2.841 ms | Doppelpunkt korrekt, Weg angenommen |

Hier bedeutet die absichtlich falsche `15`: Die **geschriebene** falsche Zahl wird unverändert richtig transkribiert. Das Modell soll keine Rechenfehler verbessern. Die Zeiten sind einzelne vergleichbare lokale Messungen, keine zugesicherte Geräteleistung oder statistische Geschwindigkeitsgarantie.

Der gesamte Nachlauf benötigte 91 Modellaufrufe gegenüber 95 im Ausgangslauf. Alle 23 Zeilenzahlen stimmen. Alle sechs Randoperationen stimmen bis auf bedeutungslose TeX-Leerzeichen; der separat gespeicherte rohe Operations-Stringvergleich zählt diese Leerzeichen weiterhin als Unterschied. Median der vollständigen Rechenblöcke: 2.812 ms; p95: 3.392 ms. Wiederholtes Prüfen desselben unveränderten Blocks: Median 94 ms, in allen 23 Fällen **kein weiterer Modellaufruf**.

Der DPR-2-Vergleich beseitigt die gemischten `x/X`-Fehler nicht. Die gesichteten Zuschnitte enthalten das kleine gebogene `x` und das große gerade `X` sichtbar getrennt. Die beiden korrekten alten linearen Zeichnungen erhalten bei DPR 2 zudem ein großes `X` in der letzten Zeile und werden dadurch abgelehnt. Die Doppelpunkt-Erkennung funktioniert auch dort. Eine pauschale Erhöhung der Pixeldichte ist daher durch diesen Versuch nicht gerechtfertigt. Wegen ausdrücklicher Bilddiagnose in diesem Vergleich werden dessen Laufzeiten nicht als direkter Geschwindigkeitsvergleich verwendet.

Die Modellläufe hatten keine JavaScript-Seitenfehler und keine fehlgeschlagenen Browseranfragen. Die bekannte ONNX-Warnung `VerifyOutputSizes` tritt weiterhin auf und bleibt im Rohbericht enthalten.

## Zusätzliche echte schriftliche Verfahren

Die dokumentierte schriftliche Addition `4728+3596=8324` besteht mit allen drei Überträgen, Rechenstrich, strukturiertem Antworttransport und nativer Prüfung.

Der bestehende echte Test `8x-7=11 | +7`, `8x=18 | :8`, `x=9/4` scheitert: Operationsstriche und Randoperationen sind korrekt, das Modell liest aber abschließend `X=9/4`. Der zweite Übergang wird deshalb zu Recht nicht als korrekte Umformung angezeigt. Der Test wird nicht durch eine erzwungene Kleinschreibung grün gemacht.

Der echte Divisionstest für `8736:8=1092` hat früher lediglich neun OCR-Rückgaben verlangt. Jetzt verlangt er zusätzlich die erkannten Zahlen, das strukturierte Divisionsformat und die native Prüfung des gesamten Weges. Außerdem initialisiert sein Beobachter die echte, bedarfsgeladene Engine und reicht Erkennungsoptionen unverändert weiter. Der tatsächliche Nachlauf scheitert: Unter anderem wird `16` als `\mathbf{Y6}` erkannt; weitere Zeilen lauten `^{-8}`, `^{-0}` und `_0`. Es entsteht kein prüfbarer strukturierter Divisionsweg. Dieser strengere Test bleibt als echter offener Befund rot.

Damit liegt **keine allgemeine Freigabe für fehlerfreie Handschrifterkennung** vor. Funktionierende mathematische Verfahren und Bedienabläufe beheben diese optischen Lücken nicht automatisch.

## Technische Prüfung und Nachvollziehbarkeit

- Anwendungstypecheck: erfolgreich.
- Vollständige Unit-Suite nach allen Produktkorrekturen: **571/571**, keine ausgelassenen Tests. Die bisherigen 21 unterstützten Materialwege samt 21 absichtlich falschen Varianten bleiben Bestandteil dieser Suite; die sieben dokumentierten fachlichen Lücken bleiben offen.
- Vollständige Browserregression mit der Case-Korrektur: **44/44** in Chromium, Firefox und WebKit.
- Nach dem abschließenden Build: zusätzlich **10/10** gezielte Browserprüfungen für lange Gleichungen, Verfahren, Groß-/Kleinschreibung und den umfassenden Chromium-Bedienablauf. Die schriftlichen Strukturverfahren sind von den zuletzt hinzugefügten Relations-/Randoperationskorrekturen ausgenommen.
- Chromium 131: **1/1**, einschließlich 30 Sekunden stabiler Leerlaufphase und anschließender Bedienung.
- Produktionsbuild mit `--no-cache`: erfolgreich. Der trotzdem angelegte kleine Parcel-Datenbankrest wurde danach entfernt.
- Strenge echte Verfahrenstests: Addition bestanden; der Weg mit `x=9/4` und die schriftliche Division aus den oben beschriebenen optischen Gründen nicht bestanden. Diese Fehlschläge werden nicht als erfolgreiche Regressionen gezählt.

Endgültiges Bundle: `dist/index.js`, 476.503 Byte, SHA-256 `6514ae969633306589738243a4d5bb0dfffcf28dd9c1670cd3bf563e9cc0090b`.

Der [kompakte Messbericht](benchmarks/ocr-integration-2026-09-06.json) enthält Soll-/Istzeilen, getrennte Bewertungen, Messzeiten sowie Modell- und Eingabeprüfsummen. Die ausführlichen JSONs und Browserlogs dieses Durchlaufs liegen unter `%TEMP%/lia-ocr-combination-*`. Vektorzeichnungen stehen reproduzierbar in den Testquellen; keine Bildduplikate werden dem Repository hinzugefügt. Die DPR-2-Diagnosebilder liegen ausschließlich unter `%TEMP%/lia-ocr-combination-dpr2.json.assets`.

Reproduktion mit den bereits geprüften lokalen Modellgewichten:

```powershell
npm run typecheck
npm test
npm run build -- --no-cache
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test test/browser/cross-browser.test.mts
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/benchmark-ocr-pipeline.mts --corpus combined --output "$env:TEMP/lia-ocr-combination-final.json"
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/benchmark-ocr-pipeline.mts --corpus combined --cases linear-valid,linear-wrong-step,holdout-linear,case-mixed-xX,case-wrong-xX-step --device-scale 2 --save-images --output "$env:TEMP/lia-ocr-combination-dpr2.json"
$env:LIA_REAL_DIVISION = '1'
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test test/browser/real-formula-block.test.mts
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test test/browser/chromium-131.test.mts
```

Für aussagekräftige Zeiten echte Modellläufe nacheinander starten. Bibliotheken und LiaScript dürfen aus den bestehenden externen Quellen laden; der Gewichtsvergleich und die Pipeline-Messung sind deshalb kein vollständiger Offline-Test. Der optische Bestand ist klein und synthetisch; seine Werte sind keine allgemeine Genauigkeitsquote für Handschrift.

## Nächster technischer Ansatz aus diesen Befunden

Die verbleibenden Fehler liegen bereits in den Modelltexten. Eine weitere globale Umbenennung anhand der Aufgabe würde geschriebene Fehler verändern und die nun gesicherte Unterscheidung von `x` und `X` wieder zerstören.

Ein gezielter nächster Versuch sollte deshalb positionsgebundene Erkennung der Problemzeichen `x/X` sowie `1/Y` auf tatsächlichen Zeichenausschnitten untersuchen. Bei schriftlichen Rechenverfahren kann die nachgewiesene Rolle einer Ziffernzeile die zulässigen Zeichen eingrenzen; sie darf niemals die erwarteten Zahlen einsetzen. Ebenso müssen Zeilenfragmente wie `^{-8}` erst mit ihrer sichtbaren räumlichen Rolle verbunden werden, bevor sie als normaler Subtraktionsschritt gelten.

Der Nachweis dafür braucht neue, getrennt zurückgehaltene synthetische Schriftvarianten mit gemischter Groß-/Kleinschreibung, verschiedenen Auflösungen und unveränderten falschen Rechenschritten. Gemessen werden müssen bessere Transkription, weniger Modellaufrufe und unverändert sichere Ablehnung falscher Wege. Das lässt sich ohne gesammelte Schreibdaten von Lernenden aufbauen. Bis dahin bleibt der vorhandene Korrektureditor für solche Erkennungsfehler notwendig.
