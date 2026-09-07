# BerechneOCR: Priorität 2 - Laufzeitvergleich

Stand: 6. September 2026. **Der Vergleich ist implementiert und mit dem echten Modell gemessen.** Für die weitere Entwicklung ist ein GPU-Encoder mit unveränderten FP32-Gewichten und einem CPU-Decoder der aussichtsreichste Kandidat: Faktor 9,85 gegenüber dem bisherigen Ablauf auf diesem Rechner, bei identischer Ausgabe auf den zwölf Entwicklungsbeispielen. Die automatische Auswahl im normalen `@BerechneOCR` bleibt beim bisherigen Ablauf, bis die angepassten Modellartefakte bereitgestellt und weitere Gerätefamilien geprüft sind.

## Messung

- Rechner: Windows, Ryzen 7 3700X, 16 logische Prozessoren, NVIDIA GeForce RTX 2070 SUPER (Modellnamen separat per Windows-CIM-Abfrage erhoben). Chromium 151 von Playwright 1.62.1, vollständiger Chromium im Headless-Modus; echter NVIDIA-Turing-Adapter, kein Softwareadapter und keine unsicheren GPU-Startflags.
- Modell: `alephpi/FormulaNet`, festgelegte Revision `63e04c86fc96c2324811114351eeea8118bf6b28`; Transformers.js 3.8.1. Exportwerkzeuge, Dateigrößen, SHA-256-Prüfsummen und tatsächlich geladene Laufzeit stehen in den [Messdaten](benchmarks/ocr-runtime-2026-09-06.json).
- Zwölf selbst konstruierte Strichbilder: drei Gleichungszeilen, Additionsoperanden und Ergebnis, Subtraktion, Multiplikationspunkt, Divisionspunkte, Dezimalkomma, Brüche, Wurzel und Potenz. [Korpus](../test/fixtures/ocr-performance-corpus.mts). Keine Aufzeichnungen von Schüler:innen, kein Training und kein Upload von Handschrift.
- Pro Profil ein frischer Browserkontext. Modellladen und erste Erkennung separat; danach drei Wiederholungen je Beispiel, also 36 warme Erkennungen. Ein einzelner abgeschlossener Messdurchgang je Profil, keine statistische Absicherung über mehrere Rechner oder Tage.
- Identische Vorverarbeitung und Begrenzung auf 64 Ausgabetokens, keine zufällige Ausgabe. Die Messung ruft die OCR-Engine direkt auf und umgeht den Zeilencache. Sie misst Vorverarbeitung, Datentransfer und Erkennung einer Eingabe, nicht die gesamte Bedienfolge eines Rechenblocks.
- Modellgewichte wurden aus einem lokalen, vorab per SHA-256 geprüften Spiegel geladen. Laufzeitmodule kommen weiterhin von den festgelegten externen CDNs. Die Ladezeit ist deshalb **keine Messung des ersten Modelldownloads über das Internet**.
- GPU-/CPU-Zuordnung wird nach dem Laden an beiden ONNX-Sessions geprüft. Einzelne vom GPU-Backend nicht unterstützte Operatoren können intern auf der CPU laufen.

| Profil | Warme Erkennung, Median | p95 | Beschleunigungsfaktor | Gleiche Roh-Ausgabe wie bisher |
| --- | ---: | ---: | ---: | ---: |
| `reference` | 573 ms | 609 ms | 1.00 | 12/12 |
| `wasm-1` | 550 ms | 585 ms | 1.04 | 12/12 |
| `wasm-2` | 336 ms | 369 ms | 1.71 | 12/12 |
| `wasm-4` | 223 ms | 256 ms | 2.55 | 12/12 |
| `webgpu` | nicht lauffähig | - | - | - |
| `webgpu-encoder` | nicht lauffähig | - | - | - |
| `webgpu-fp16-encoder` | 53 ms | 87 ms | 10.41 | 12/12 |
| `webgpu-decoder` | 599 ms | 742 ms | 0.94 | 12/12 |
| `webgpu-floorpool` | 100 ms | 236 ms | 5.23 | 12/12 |
| `webgpu-encoder-floorpool` | 57 ms | 87 ms | 9.85 | 12/12 |
| `webgpu-q8-decoder` | 49 ms | 72 ms | 11.46 | 11/12 |
| `wasm-fp16-encoder` | 632 ms | 669 ms | 0.91 | 12/12 |
| `wasm-q8` | 553 ms | 579 ms | 1.04 | 11/12 |

Der Faktor ist die Summe der bisherigen Medianzeiten je Beispiel geteilt durch die entsprechende Summe des Kandidaten. Er ist deshalb nicht genau der Quotient der beiden über alle 36 Läufe gebildeten Tabellenmediane. p95 ist das 95. Perzentil dieser 36 Messungen.

`reference` ist die unveränderte Standardkonfiguration (WASM, FP32, ein Thread, ONNX-Proxy). `wasm-1/2/4` laufen in einem eigenen Worker. Bei `webgpu-encoder` verarbeitet die GPU das Strichbild; die CPU erzeugt anschließend die Zeichenfolge. `webgpu-decoder` vertauscht diese Aufgaben. `webgpu` wählt für beide Teile das GPU-Backend. Varianten mit `floorpool` verwenden ausschließlich die unten erklärte kompatible Pool-Operation.

### Was die Ergebnisse belegen

Der GPU-Encoder mit FP32 und CPU-Decoder benötigte im warmen Median **57 ms statt 573 ms**. Das Laden dauerte lokal rund 2,55 s, die erste Erkennung anschließend 550 ms. Die kurze warme Zeit gilt also nicht für den allerersten Aufruf.

Der FP16-Encoder erreichte 53 ms und verringerte die beiden Modelldateien zusammen von **80.114.829 auf 53.070.899 Byte**, rund 34 Prozent. Auf diesen Beispielen blieb die Ausgabe gleich. Das ist ein weiterer Kandidat für kleinere Downloads, aber kein Nachweis unveränderter Genauigkeit auf allen Gleichungen. Er benötigt außerdem `shader-f16`. Auf der CPU war derselbe FP16-Encoder sogar langsamer.

Vier CPU-Threads erreichten Faktor 2,55. Sie benötigen `crossOriginIsolated`, SharedArrayBuffer und ausreichend logische Prozessoren. Die Benchmarkseite setzt dafür COOP-/COEP-Header. Das Template setzt solche Header nicht für fremde LiaScript-Hosts und aktiviert dort nicht stillschweigend mehrere Threads. In einer zusätzlichen [Messung ohne Isolation](benchmarks/ocr-runtime-2026-09-06-no-isolation.json) funktionierte der GPU-Encoder mit CPU-Decoder weiterhin; das Vier-Thread-Profil meldete seine fehlende Voraussetzung korrekt. Dieser Zusatz prüft nur zwei Beispiele mit zwei Wiederholungen.

Q8 bedeutet hier ausschließlich dynamische 8-Bit-Quantisierung der MatMul-/Gemm-Gewichte im Decoder; der Encoder bleibt FP32. Diese Variante veränderte `division-taps` reproduzierbar in allen drei Wiederholungen, sowohl mit GPU- als auch mit CPU-Encoder:

```text
Bisher: 1 4 4. 1 ~ 2 = 1 2
Q8:     1 ~ 4 4. 1 ~ 2 = 1 ~ 2
```

Beide Roh-Ausgaben sind für das verlangte `144:12=12` unzureichend. Der Q8-Unterschied betrifft hier zusätzliche TeX-Abstandszeichen; er belegt keine neu verursachte falsche mathematische Zahl. Er verletzt jedoch das bewusst strenge Kriterium einer identischen Ausgabe und bringt gegenüber dem FP32-GPU-Encoder nur begrenzten Zusatznutzen. **Q8 wird deshalb nicht als Standard empfohlen.** Die Modelldateien wären zusammen 62.921.181 Byte groß.

### Was die Ergebnisse nicht belegen

**Identisch zur bisherigen OCR bedeutet nicht korrekt erkannt.** Das Feld `qualitySafeSpeedup` in den Messdaten bedeutet nur: vollständige, stabile Vergleichsmessung und exakt gleiche Roh-Ausgaben auf diesem Korpus. Es ist kein allgemeines Qualitätssiegel.

Der absichtlich strikte Vergleich der unbearbeiteten Ausgabe mit `expectedLatex` ergibt sogar 0 von 12 exakten Treffern: Leerzeichen unterscheiden sich, `x` wird teilweise `X`, und es gibt wirkliche Symbol- und Strukturfehler. Die Solltexte wurden nach der Messung nicht angepasst. Dieser kleine Korpus ist ein Laufzeit- und Veränderungsalarm; eine allgemeine Erkennungsquote darf daraus nicht abgeleitet werden.

Die normale Aufteilung eines Rechenblocks, die Behandlung von Umformungsstrichen, die Normalisierung zu `\cdot` und die Prüfung der Lösungsschritte liegen außerhalb dieses direkten Engine-Vergleichs. Priorität 2 erweitert weder deren mathematische Abdeckung noch behauptet sie eine verbesserte Schrifterkennung. Die bestehenden Verfahren für schriftliche Addition, Subtraktion, Multiplikation und Division bleiben erhalten und werden gesondert durch Regressionstests abgesichert. Die Breite aus Repetitorium und TeX-Materialsammlung bleibt Ziel der folgenden Arbeit an Segmentierung und Verfahren.

## Warum ein angepasster GPU-Export erforderlich ist

Die ursprünglichen FP32-Exporte scheitern bei der ersten GPU-Erkennung an `MaxPool` mit `ceil_mode=1`. Nur die Laufzeitoption `device: 'webgpu'` umzustellen reicht deshalb nicht.

Das Exportskript prüft exakt den vorhandenen Knoten `/stem/pool/MaxPool`: Kernel 2 mal 2, Schrittweite 1, Dilatation 1 und kein Pool-Padding. Für jede gültige ganzzahlige Eingangsgröße N ist `(N-2)/1+1 = N-1` bereits ganzzahlig; Abrunden und Aufrunden liefern dieselbe Größe und dieselben vollständigen Fenster. Deshalb darf für **diesen geprüften Knoten** `ceil_mode` von 1 auf 0 wechseln. Grundlage ist die [ONNX-MaxPool-Spezifikation](https://onnx.ai/onnx/operators/onnx__MaxPool.html#maxpool-12).

Das Skript kontrolliert Quellprüfsummen und alle genannten Attribute und weist durch Rücksetzen und Serialisierungsvergleich nach, dass keine weitere Graphänderung erfolgt. Gewichte, 384-Pixel-Eingabe, Padding der Vorverarbeitung und öffentliche Tensor-Schnittstellen bleiben gleich. Die Anpassung ist kein allgemeiner Austausch von Aufrunden durch Abrunden.

Die komplette FP16-Konvertierung des Decoders wird als fehlgeschlagen protokolliert: Die If-/Concat-Zweige für die zwischengespeicherten Decoderzustände haben inkompatible Typen. Deshalb verwendet der brauchbare FP16-Kandidat ausschließlich einen FP16-Encoder mit originalem FP32-Decoder. Alle lokalen Varianten behalten FP32 an den öffentlichen Ein-/Ausgängen und die unsuffigierten ONNX-Dateinamen. Der Transformers.js-Dateiselektor bleibt `dtype: 'fp32'`; die wirkliche Gewichtsgenauigkeit steht separat im Manifest und im Cache-Schlüssel.

## Reproduzieren

Voraussetzungen: die Node-Umgebung des Repos, installierte Playwright-Browser und Python mit den festgelegten Exportpaketen. Die Exportpakete wurden mit Python 3.14 unter Windows ausgeführt. Folgende PowerShell-Befehle legen die großen Artefakte außerhalb des Repos im temporären Verzeichnis ab:

```powershell
python -m venv "$env:TEMP\lia-ocr-priority2-venv"
& "$env:TEMP\lia-ocr-priority2-venv\Scripts\python.exe" -m pip install -r scripts/requirements-ocr-benchmark.txt
& "$env:TEMP\lia-ocr-priority2-venv\Scripts\python.exe" scripts/prepare-ocr-precision.py
```

Die Vorbereitung protokolliert auch gescheiterte Versuche und endet wegen des oben genannten vollständigen FP16-Decoders derzeit mit Exitcode 1. Danach im ausgegebenen `manifest.json` kontrollieren: `fp32`, `fp16-encoder` und `q8-decoder` müssen jeweils `status: "checked"` haben. Bei anderen Fehlern nicht von einer gelungenen Vorbereitung ausgehen. Anschließend:

```powershell
& "$env:TEMP\lia-ocr-priority2-venv\Scripts\python.exe" scripts/prepare-ocr-precision.py --derive-floorpool
npm run benchmark:ocr -- --repeats 3
```

Die Vorbereitung überschreibt keine bestehenden Modelldateien. Für eine neue Konvertierung einen neuen Ordner mit `--output` verwenden und den Benchmark mit dem passenden `--assets` starten. `--derive-existing` ist nur für ältere Exportverzeichnisse ohne die gemischten Profile vorgesehen und im obigen neuen Ablauf nicht nötig. Ein `checked`-Export bedeutet Graph-/Schnittstellenprüfung; erst der Browserlauf belegt, ob die jeweilige Kombination tatsächlich erkennt.

Die Messung schreibt standardmäßig nach `%TEMP%/lia-ocr-priority2-benchmark.json`. Begrenzte Durchläufe sind möglich:

```powershell
npm run benchmark:ocr -- --profiles reference,wasm-1,webgpu-encoder-floorpool --cases linear-result,multiplication-tap --repeats 2
npm run benchmark:ocr -- --no-isolation --profiles reference,wasm-4,webgpu-encoder-floorpool --cases linear-result,multiplication-tap --repeats 2
```

Fehlende GPU-Funktionen, unbrauchbare Exporte oder nicht verfügbare Threads werden im Bericht als Fehler erfasst. Ein Kandidat wird nicht unbemerkt durch ein anderes Profil ersetzt. Für einen aussagekräftigen Geschwindigkeitsvergleich immer `reference` und dieselben Beispiele/Wiederholungen einschließen. Ein fehlgeschlagener Referenzlauf setzt den Prozess-Exitcode auf 1; erwartete Fehler einzelner experimenteller Profile stehen im Bericht.

## Explizite Verwendung in der Entwicklung

`window.__LIA_CANVAS_OCR__.createFormulaOcrEngine(profileId, options)` erzeugt einen eigenständigen Profil-Worker. Die ID `reference` liefert die wiederverwendete bisherige WASM-Engine, unabhängig vom aktuell ausgewählten Canvas-Profil; der Abruf schaltet kein Canvas um. Die Laufzeitprofile heißen `wasm-1`, `wasm-2`, `wasm-4`, `webgpu`, `webgpu-encoder` und `webgpu-decoder`. Benchmarknamen wie `webgpu-encoder-floorpool` kombinieren ein Laufzeitprofil mit einem lokalen Artefakt; sie sind keine weiteren Factory-IDs.

Beispiel für einen Entwicklungsserver, der die erzeugten Artefakte mit CORS unter `/models/` bereitstellt; `baseUrl` ist dessen tatsächliche HTTP(S)-Adresse:

```javascript
const registry = window.__LIA_CANVAS_OCR__;
const engine = registry.createFormulaOcrEngine('webgpu-encoder', {
  model: 'fp32-floorpool',
  revision: '63e04c86fc96c2324811114351eeea8118bf6b28',
  assetBaseUrl: new URL('/models/', baseUrl).href,
  weightPrecision: 'fp32'
});
await engine.ensureLoaded();
// Für direkte Entwicklungsprüfungen:
const latex = await engine.recognize(canvas);
// Nach Abschluss aller Aufrufe Ressourcen freigeben:
engine.dispose();
```

Der Serverpfad folgt `{model}/{revision}/`, darunter Konfigurationsdateien und `onnx/encoder_model.onnx` sowie `onnx/decoder_model_merged.onnx`. Modell- und Tokenizerdateien brauchen passende HTTP-/CORS-Header. Der erzeugte `dist/formulanet-worker.<hash>.js` muss zusammen mit `dist/index.js` ausgeliefert werden. Berechnungen laufen im eigenen Worker; die bestehende Canvas-Vorverarbeitung bleibt im Hauptthread. WebGPU nutzt keinen ONNX-Proxy, entsprechend den [ONNX-Runtime-Hinweisen zu Worker und Proxy](https://onnxruntime.ai/docs/tutorials/web/env-flags-and-session-options.html).

Ein Profil wird durch seine Erzeugung nicht automatisch für die sichtbaren Canvas-Felder ausgewählt. Für eine gezielte Entwicklungsintegration kann der aufgeladene Worker vor Beginn eines Rechenblocks `registry.canvasPlusOcr` zugewiesen werden. Modellrevision, Vorverarbeitung, Laufzeit, Gerätezuordnung, Threadzahl, Gewichtsgenauigkeit und Artefaktadresse trennen die OCR-Caches. Ein entsorgter Worker ist nicht wiederverwendbar. Die Benchmarkausgaben stammen ausschließlich aus den festen synthetischen Beispielen; der Produktablauf legt keine Handschrift- oder Messdatensammlung an.

## Abschlussprüfungen

- `npm run check`: Typprüfung, **298 Unit-Tests** und neuer Parcel-Build erfolgreich.
- **11 gezielte Browserprüfungen** erfolgreich: Worker-Integration jeweils in Chromium, Firefox und WebKit; die drei allgemeinen Browser-Smokes; die drei Regressionen zu Punkten, Multiplikation und erhaltenen Korrekturen; schriftliche Addition mit Überträgen sowie der gemeinsame Test für schriftliche Subtraktion, Multiplikation und Division. Keine dieser Prüfungen wurde übersprungen.
- Die Worker-Tests verwenden einen echten Worker und ersetzen nur die importierte ML-Laufzeit. Sie prüfen auch UI-Reaktionsfähigkeit, Kanalübergabe, Abbruch, Reload, unveränderliche Artefaktquellen, getrennte Referenzinstanz und Fehler statt stiller Profilwechsel. Die tatsächliche Modellkompatibilität belegt separat die oben gespeicherte Messmatrix.
- Nach den abschließenden Korrekturen der Profilverwaltung wurden Referenz und FP32-GPU-Encoder nochmals mit dem echten Modell ohne Isolation auf `linear-result` und `multiplication-tap` ausgeführt: gleiche Ausgaben. Die veröffentlichten Laufzeitzahlen stammen weiterhin aus dem vollständigen Durchgang.

Die gezielten Browserprüfungen lassen sich zusammen starten:

```powershell
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test --test-name-pattern="FormulaNet profile worker integration|priority-one|pinned written layouts|automatic written addition preserves|lazy init" test/browser/cross-browser.test.mts
```

## Entscheidung und verbleibender Einführungsschritt

Für die weitere Entwicklung zuerst **GPU-Encoder FP32 + CPU-Decoder FP32 mit der geprüften Pool-Anpassung** verwenden. FP16 ist ein optionaler Kandidat für kleinere Modelldownloads. Q8 wird vorerst zurückgestellt. Mehrere CPU-Threads sind eine Option für passende selbst gehostete Umgebungen.

Die neuen Profile, der reproduzierbare Export, die Messwerkzeuge und Regressionstests sind vorhanden. Die erzeugten ONNX-Dateien liegen nur lokal außerhalb des Repos und wurden nicht veröffentlicht. Vor einer automatischen Aktivierung fehlen ein festgelegter Auslieferungsort für diese Artefakte, Prüfungen auf integrierten GPUs und Mobilgeräten mit künstlichen bzw. öffentlichen Beispielen sowie ein kontrollierter Rückfall auf WASM bei fehlender GPU. Diese Voraussetzungen werden durch die Desktopmessung nicht ersetzt.
