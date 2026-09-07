# BerechneOCR: Priorität 3 - lange Gleichungen und Zeilenaufteilung

Stand: 6. September 2026. Die normale Gleichungserkennung verwendet jetzt räumliche Strukturprüfungen und teilt sehr breite Gleichungen an eindeutig erkennbaren Gleichheitszeichen. Die vier schriftlichen Grundrechenarten behalten ihre eigenen Regeln für Zeilen, Überträge, Entleihen, Teilprodukte und Divisionsschritte. Diese Arbeit führt kein Training, keine Aufzeichnung von Schülerhandschrift und keine Telemetrie ein.

## Zielvorgaben aus den vorhandenen TeX-Materialien

Gezielt gelesene Originalstellen; sie dienen als Strukturvorgabe. Die Tests verwenden selbst konstruierte Strichbilder, keine abgezeichneten Eingaben von Lernenden.

| Lokale Quelle | Stellen | Daraus abgeleitete Anforderung |
| --- | --- | --- |
| Repetitorium/Repetitorium.tex | 24321-24338 | Quadratische Ergänzung, Brüche in Klammern hoch zwei, Indizes, Plusminuszeichen und Randoperationen müssen zusammenbleiben. |
| Repetitorium/Repetitorium.tex | 61587-61598 | Verschachtelte Brüche und lange Ableitungszähler/-nenner dürfen nicht als mehrere Rechenschritte erscheinen. |
| 12. Klasse/Mathe/Wochenaufgaben/Klasse 12 Woche 19.tex | 401-408 | Lange Gleichungen mit Exponential-, Logarithmus- und Arkuskosinusausdrücken und kurzen Operationen am rechten Rand. |
| 12. Klasse/Mathe/Wochenaufgaben/Klasse 12 Woche 19.tex | 416-420 | Wurzelindex, Bruchpotenzen und Exponenten innerhalb weiterer Exponenten; keine beliebigen Schnitte mitten in einer Struktur. |
| Repetitorium/Repetitorium.tex | 59564-59580 | Eigene Nebenrechnungen, Einsetzung und Rücksubstitution brauchen später eine eigenständige fachliche Zuordnung. |

Die Dateien liegen unter `Z:/Drive/Martin - Schule/Material/`. Auch nebeneinander gesetzte unabhängige Aufgaben und erklärende Unterklammern sind in den Materialien vorhanden. Deren vollständige Interpretation wird durch diese Änderungen nicht behauptet.

## Was sich im normalen BerechneOCR ändert

### Räumliche Zugehörigkeit statt nur horizontaler Tintenstreifen

Die bisherige Zeilensuche konnte einen deutlich abgesetzten Exponenten als eigene Gleichung behandeln. Eine neue, konservative Prüfung betrachtet zusammenhängende Tintenbestandteile, ihre Größe und ihre Lage zueinander. Ein kleiner rechts angesetzter Exponent oder Index wird nur bei eindeutiger Zuordnung an seine Basis angeschlossen. Eine hohe Klammer darf dabei nicht eine vollständige Folgegleichung als Index anziehen.

Getrennte Zähler-, Bruchstrich- und Nennerbereiche werden nur zusammengefasst, wenn ein tatsächlicher Strich die passenden Bereiche überspannt. Fremde vollhohe Zeichen daneben verhindern eine Verbindung. Das gilt auch dann, wenn ein großer Bruch deutlich mehr Tinte enthält als eine kleine Nebenrechnung. Mehrdeutige Zuordnungen bleiben getrennt. Die Analyse bricht bei mehr als 4096 Tintenkomponenten konservativ ab und behält dann die bestehende Segmentierung.

Außerdem hing bisher der Grundabstand zwischen Zeilen von der gesamten Höhe des Zeichenbereichs ab. Eine weit entfernte neue Zeile oder zusätzlicher Leerraum konnte dadurch zwei vorhandene Zeilen zusammenkleben. Gewöhnliche Gleichungen verwenden jetzt einen nur vom Pixelmaßstab abhängigen Grundabstand. Die bisherigen Abstandseinstellungen für die schriftlichen Verfahren bleiben erhalten.

Implementierung: [spatial-layout.ts](../src/ocr/spatial-layout.ts), [layout.ts](../src/ocr/layout.ts). Die Layoutkennung `lines-v22-priority3-spatial-equations` trennt alte und neue OCR-Caches.

### Kurze Randoperation neben einer langen Gleichung

Ein separat gezeichneter, gerader Umformungsstrich mit hoher geometrischer Sicherheit darf jetzt auch jenseits der alten relativen Grenze von 92 Prozent der Gesamtbreite liegen. Ein kleiner Anteil der Tinte rechts vom Strich verwirft ihn nicht mehr allein deshalb. Er braucht weiterhin passende lokale Tinte und Abstände. Die Abgrenzung gegen Ziffern, Klammern und Betragsstriche sowie die vorhandene Prüfung der gelesenen Randoperation bleiben aktiv.

### Breite Gleichungen in vollständige Teile zerlegen

Ab einem Verhältnis von Tintenbreite zu Tintenhöhe von 10:1 prüft der Ablauf, ob ein freistehendes Gleichheitszeichen eine sichere Grenze bildet. Erfordert werden zwei passende gerade Balken, ein freier senkrechter Korridor und passende Nachbarzeichen auf der Grundlinie. Bruch-/Wurzelstriche durch den Korridor, zusätzliche Zeichen, andere Relationszeichen, Klammerumschließungen, sehr große Spaltenlücken und unpassende Grundlinien verhindern den Schnitt. Es entstehen höchstens vier Teile; beliebige Leerstellen werden nicht als Schnittstelle verwendet.

**Jeder Teil nach dem ersten behält sein sichtbares führendes Gleichheitszeichen als Erkennungskontext.** Beim Zusammensetzen wird nur dieses eine belegte Grenzzeichen entfernt und zwischen die vollständigen Teile gesetzt. Das stabilisiert den rechten Ausdruck: Ein völlig isolierter Ausschnitt kann vom Modell fälschlich als Exponent interpretiert werden.

Alle Teile müssen strukturell vollständig sein: passende Klammern, vollständige Bruch-/Wurzelargumente, keine hängenden Operatoren auch innerhalb von Gruppen und keine Exponenten ohne Basis. Interne Relationen oder mehrere unabhängige TeX-Zeilen werden nicht zu einer Gleichung zusammengebaut. Bei unsicherem Plan, fehlgeschlagener Erkennung oder unvollständigem Teilergebnis folgt ein kompletter Ganzzeilenaufruf. Halb erkannte Ergebnisse werden nicht zwischendurch angezeigt oder als fertige Zeile gespeichert. Diese Prüfung bewertet keine mathematische Gleichheit und erfindet keine fehlenden Zeichen.

Die Obergrenze der Ausgabetokens richtet sich nach dem jeweiligen Tinten-Seitenverhältnis: 64 unter 10:1, 128 ab 10:1, 256 ab 22:1. Sie ist eine Obergrenze, keine erzwungene Ausgabelänge. Die Grundrechenarten behalten ihre etablierten Budgets. Sehr lange unteilbare Strukturen können weiterhin an Modellauflösung oder Tokenlimit scheitern.

Implementierung: [equation-chunks.ts](../src/ocr/equation-chunks.ts), [equation-recognition.ts](../src/ocr/equation-recognition.ts) und Einbindung in [Canvas](../src/canvas/index.ts).

### Unveränderte Zeilen und manuelle Korrekturen

Neben dem Rasterfingerprint verwendet der Sitzungscache jetzt auch die bereits für Korrekturen vorhandene Identität vollständiger Striche. Wenn das Hinzufügen einer weiteren Zeile den Rasterursprung und einzelne Pixelrundungen verschiebt, muss eine unveränderte Gleichung nicht erneut erkannt werden. Änderungen an Strichen, Radierungen, andere Modell-/Layoutkennungen oder nicht eindeutig zuordenbare Striche verhindern diese Wiederverwendung. Der Cache bleibt begrenzt und nur im laufenden Browserzustand; es wird keine neue Handschriftkopie angelegt.

Korrekturen behalten ihre bisherige Zuordnung. Laufende Teil- und Ganzzeilenaufrufe dürfen nach einer Änderung des Rechenblocks oder einem Wechsel des OCR-Profils keine alten Ergebnisse mehr übernehmen.

## Echter Modellvergleich

Das synthetische Beispiel lautet `3x+12+2\cdot3+12 = 12+3+12+3`. **Mit dem tatsächlichen Anwendungsraster erkennen sowohl der bisherige Ganzzeilenweg als auch die neue Zerlegung mit Gleichheitskontext dieses Beispiel in allen drei Wiederholungen richtig**, nach Entfernen der Leerzeichen. Das Beispiel belegt deshalb keinen Genauigkeitsgewinn gegenüber dem bisherigen Produktionspfad.

| Variante | Exakte Treffer ohne Leerzeichen | Median der warmen Erkennung |
| --- | --- | --- |
| Ganze Zeile, 64 Tokens | 3/3 | 639 ms |
| Ganze Zeile, 128 Tokens | 3/3 | 625 ms |
| Zwei isolierte Teile | 0/3 | 1166 ms |
| Zwei Teile, Gleichheitskontext rechts (eingebaut) | 3/3 | 1163 ms |
| Zwei Teile, Gleichheitskontext beidseitig (Vergleich) | 3/3 | 1167 ms |

Ein vorausgehender Pilot auf einem direkt gezeichneten, geglätteten Rohbild hatte das `x` nur bei der Ganzzeilenerkennung falsch gelesen. Dieser Unterschied verschwand mit der tatsächlichen Binarisierung und den Produktionszuschnitten. Der Pilot ist deshalb nicht die Grundlage des hier gespeicherten Messprotokolls.

Die isolierten Teilbilder lieferten rechts weiterhin einen Exponenten ohne Basis. Die Strukturprüfung verwirft dieses Ergebnis; im normalen Ablauf würde anschließend die ganze Zeile erkannt. Die Zeitangabe dieser Versuchsvariante enthält diesen zusätzlichen Rückfallaufruf nicht. Der sichtbare Gleichheitskontext ist hier also erforderlich, damit die Zerlegung kein schlechteres Ergebnis erzeugt.

Der eingebaute Weg benötigte hier im Median 1,16 Sekunden statt 0,64 Sekunden (etwa 1,8-mal so lange). Der Modellvergleich lief in Chromium 151 mit der unveränderten FP32-WASM-Referenzengine, einem Thread und ohne Browserisolation. Gemessen wurden nacheinander drei Wiederholungen je Variante nach einem Aufwärmlauf. Dieser abschließende Messlauf fand nach den Browserregressionen statt. Die geringe Zahl und feste Reihenfolge erlauben keine belastbare allgemeine Laufzeitprognose. Die Teilung ist eine zusätzliche Möglichkeit für lange Gleichungen; ihre Schwelle und ihr Nutzen müssen mit weiteren öffentlichen oder künstlichen Beispielen bewertet werden.

[Vollständiges Messprotokoll mit Rohantworten, Strichen, Rasterdaten und Prüfsummen](benchmarks/ocr-layout-2026-09-06.json).

Der Vergleich verwendet ausschließlich ein [festes künstliches Strichbild](../test/fixtures/ocr-equation-chunks.mts), dieselbe gepinnte FP32-Referenzengine und drei Wiederholungen pro Variante. Das Skript verwendet die tatsächlichen Quellabschnitte für Strichzeichnung, Rasterursprung, Randzugabe, Binärcrop und Zeilenausschnitte. Pixel- und Quellcodeprüfsummen sind im Protokoll enthalten. Änderungen an den extrahierten Quellabschnitten können eine Anpassung des Messskripts erfordern; sie führen bei fehlenden Markierungen zu einem ausdrücklichen Fehler. Ganze Zeile, größeres Tokenbudget und Teilbilder werden getrennt protokolliert. Die Modelldateien werden zuvor per SHA-256 geprüft und lokal bereitgestellt; das ist keine Messung des ersten Internetdownloads. Der Erkennungscache wird umgangen. Bedienfolge und Cache werden separat in Browserregressionen geprüft.

Die Messergebnisse belegen nur diesen Entwicklungsfall. Sie begründen keine allgemeine Genauigkeitsquote und auch keine Garantie für alle Strukturen aus den TeX-Materialien. Zwei Teilaufrufe kosten auf der bisherigen CPU-Engine mehr Zeit als ein einziger Ganzzeilenaufruf. Bei kurzen Gleichungen entsteht kein zusätzlicher Modellaufruf. Die GPU-Profile aus Priorität 2 bleiben davon unabhängig ausdrücklich auswählbar.

Reproduzieren nach [Vorbereitung der lokalen Modelle aus Priorität 2](berechneocr-priority-2.md#reproduzieren):

```powershell
npm run benchmark:ocr-layout -- --repeats 3
```

Optional `--assets` und `--output` angeben. Mit `--validate-raster` werden ausschließlich die Bildaufbereitung und Schnittbilder geprüft, ohne das OCR-Modell zu laden oder auszuführen. Standardausgabe: `%TEMP%/lia-ocr-priority3-model-check.json`. Das Skript protokolliert bewusst auch den unbrauchbaren Versuch ohne Gleichheitskontext, damit die Auswahl nachvollziehbar bleibt.

## Validierung und Grenzen

- `npm run check`: Typprüfung, **342 Unit-Tests** und aktueller Produktionsbuild erfolgreich.
- **38 Browserfälle** geprüft: 35 im vollständigen Durchlauf erfolgreich; drei bestehende Sammeltests nach Korrektur einer fehlenden Startbereitschaftsprüfung und veralteter Cacheerwartungen in Chromium, Firefox und WebKit erfolgreich wiederholt. Die Tests verlangen nun genau zwei statt vier Modellaufrufe, wenn zwei bereits erkannte, vollständig unveränderte Striche anschließend gemeinsam gerendert werden.
- Die **drei neuen Prio-3-Browserfälle** wurden nach der letzten Strukturprüfung nochmals gegen den finalen Build ausgeführt: Teilerkennung mit sichtbarem Gleichheitskontext, Ganzzeilenrückfall, Wiederverwendung unveränderter Zeilen, Randoperation und Verwerfen verspäteter Ergebnisse nach Profilwechsel erfolgreich.
- **Zwei bestehende Tests mit echter Modellerkennung** erfolgreich: Umformungsstrich gegen gehakte Einsen sowie dokumentierte schriftliche Addition mit nativer Bewertung.
- Eigene geometrische Gegenbeispiele sichern unter anderem hohe Klammern neben Folgegleichungen, kleine Nebenrechnungen neben großen Brüchen, verschiedene Pixeldichten und zusätzlichen Leerraum ab. Unvollständige Teilantworten inklusive Exponenten ohne Basis innerhalb verschachtelter Gruppen werden verworfen; gültige Funktionspotenzen wie `\sin^2(x)` bleiben zulässig.

Die Browserregressionen verwenden kontrollierte OCR-Antworten, um Ablauf und Bewertung gezielt zu prüfen. Die getrennt ausgewiesenen Modelltests und der Modellvergleich verwenden die echte Referenzengine. Eine große Handschriftstudie oder vollständige Abdeckungsmessung des Repetitoriums ist damit nicht ersetzt.

Das ist eine Verbesserung der räumlichen Erkennung und ihrer Einbindung. Die fachliche Anerkennung neuer Verfahren, eigenständige Nebenrechnungen, Systeme, beliebige nebeneinanderstehende Aufgaben und erklärende Unterklammern benötigen weitere Arbeit. Sie werden nicht als fertige Unterstützung ausgewiesen. Die vorhandenen vier schriftlichen Grundrechenarten und die normale Schreibweise mit `\cdot` bleiben abgesichert.
