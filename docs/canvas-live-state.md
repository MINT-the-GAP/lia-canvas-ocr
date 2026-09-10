# Canvas-Live-Zustand für lia-freeze-v2

Die laufende Fortschrittssicherung verwendet die Live-API unter
`window.__LIA_CANVAS_OCR__.freeze`. Sie liest das Zeichenmodell ohne Rasterbild,
Pixelanalyse, Zuschnitt oder Komprimierung. Der bisherige Abgabeexport bleibt
unverändert verfügbar und kann weiterhin pixelgenau zuschneiden.

Die Implementierung und die maßgeblichen TypeScript-Typen stehen in
[`src/canvas/live-state.ts`](../src/canvas/live-state.ts); die Registrierung der
öffentlichen Methoden erfolgt in [`src/canvas/freeze.ts`](../src/canvas/freeze.ts).
Die neue Zustandsversion ist `cvl1`. `freeze.version === 'cvf1'` bezeichnet weiterhin
den bestehenden Abgabeexport. `freeze.liveStateVersion === 'cvl1'` beschreibt
die neue API; Freeze prüft zusätzlich die benötigten Methoden.

## Öffentliche Methoden

| Methode | Ergebnis und Bedeutung |
| --- | --- |
| `listCanvasLiveStateRevisions(root)` | `[{ uid, revision }]` für Canvas-Paare innerhalb des angegebenen `Element` oder `Document`, einschließlich `root` selbst. Nur Canvas mit vorhandenem Storeeintrag erscheinen; jede UID höchstens einmal. Es werden keine Striche exportiert. |
| `exportCanvasLiveStateByUID(uid)` | `{ uid, revision, state }` oder `null`, wenn kein zugehöriger Storeeintrag existiert. Liefert den aktuellen vollständigen `cvl1`-Zustand. |
| `getCanvasLiveActivityByUID(uid)` | `{ uid, revision, active, operations }` oder `null`. Synchroner Blick auf laufende Vorgänge; `operations` ist ein Array von Zeichenketten. |
| `restoreCanvasLiveStateByUID(uid, state)` | `boolean`: validiert einen `cvl1`-Zustand und stellt ihn unter der Ziel-UID wieder her. Ungültiger Zustand wird mit `false` abgelehnt. Erfolgreiche Wiederherstellung erzeugt eine neue lokale Revision. |

Eine UID gehört zum jeweiligen Canvas-Mount. Bei Speicherung über einen Reload
hinweg muss Freeze zusätzlich seine stabile Zuordnung vom Kurs-/Aufgabenort zur
UID beziehungsweise zum neuen Mount bewahren. Die UID allein bezeichnet keine
kursübergreifend stabile Dokumentidentität.

## Zustand `cvl1`

`state` ist ein reines Datenobjekt und kann mit JSON oder Structured Clone
transportiert werden. Die Felder entsprechen dem bearbeitbaren Canvas-Modell:

| Feld | Bedeutung |
| --- | --- |
| `v: 'cvl1'` | Explizite Version des Live-Zustands. |
| `ITEMS` | Geordnete Folge aller aktuellen Striche und bestätigten Auswahlrechtecke. Enthält auch vollständig außerhalb des Viewports liegende Geometrie. |
| `REDO` | Redo-Stapel in der internen Reihenfolge; nach Restore bleibt Redo möglich. |
| `VIEW` | `{ panX, panY, scale, minScale, maxScale }`; Pan in CSS-Pixeln, Geometrie in Weltkoordinaten. |
| `bgMode` | Hintergrundmodus `none`, `grid` oder `lined`. |
| `bgStep` | Abstand des Hintergrundrasters in Weltkoordinaten. |
| `wrapW`, `canvasH` | Gesicherte Zeichenbereichsgröße in CSS-Pixeln. |
| `calculationReviewFreeze?` | Bestehender versionierter `cr1`-Reviewzustand mit Zeilen, Prüfstatus, Prüfungen und gegebenenfalls `stale: 1`. |
| `editorDraft?` | Noch nicht übernommener Text des OCR-Korrektureditors. |
| `ocr?` | Wiederherstellbare OCR-Ausgabe mit `editableText: string`, optionalem Veraltet-Marker `stale: boolean` und gegebenenfalls strukturierter `writtenSubmission` (JSON-Objekt oder `null`). |

Ein Strich hat die Form
`{ kind: 'path', tool, color, alpha, width, points: [{ x, y }, ...] }`.
`tool: 'eraser'` erhält den Radierer als Geometrie mit seiner Position in der
Zeichenreihenfolge. Er wird weder auf das sichtbare Bild angewendet noch beim
Sichern in einen Pixelstand umgerechnet. Ein bestätigtes Auswahlrechteck bewahrt
`kind: 'rect'`, `x0`, `y0`, `x1`, `y1`, `alpha` und seine Farbangabe.

Punkte werden weder gerundet noch vereinfacht. Weltkoordinaten und Strichbreiten
bleiben erhalten. Die Anzeige ergibt sich aus
`screenX = x * VIEW.scale + VIEW.panX` und entsprechend für Y. Hintergrund und
symbolische Themefarben folgen weiterhin der Canvas-Darstellung.

Ein aktiver Strich ist mit seinen bereits eingegangenen Punkten im Live-Zustand
enthalten. Die noch nicht bestätigte Auswahlvorschau wird über die Aktivität
`select` gemeldet; erst ihre Bestätigung wird als Rechteck in `ITEMS` gesichert.

Das native LiaScript-Quizantwortfeld wird weiterhin von Freeze separat gesichert.
Der Canvas-Live-Zustand ersetzt diesen Teil des Kurszustands nicht. OCR-Modelle,
Worker, Rasterbilder, Inferenzaufträge und sessioninterne Erkennungscaches sind
kein Bestandteil von `cvl1`.

## Revisionen und unveränderliche Snapshots

Revisionen beginnen bei der ersten Erfassung einer UID mit 1 und sind konservativ
steigende Zahlen pro UID innerhalb der laufenden
Widget-Laufzeit. Sie erfassen Geometrie einschließlich neuer Punkte eines
laufenden Strichs, Radieren, Undo/Redo, Löschen, Auswahl, Pan/Zoom,
Größenänderungen, Hintergrund, exportierte OCR-/Reviewdaten und Restore.
Zusätzliche Revisionen sind zulässig; die Differenz zweier Zahlen ist keine
Anzahl fachlicher Änderungen.

Freeze vergleicht Revisionen nur auf Gleichheit. Nach Reload oder Neuinitialisierung
des Laufzeitregisters startet seine lokale Revisionsbuchführung neu. Eine mit dem
Snapshot gespeicherte Revision wird beim Wiederherstellen nicht als aktuelle
Laufzeitrevision eingesetzt.

Ein ausgegebener Snapshot bleibt auch dann unverändert, wenn anschließend weitere
Punkte gezeichnet, Striche gelöscht oder Undo/Redo ausgeführt werden. Unveränderte
Strichobjekte werden zwischen Snapshots wiederverwendet. Wiederholter Export ohne
Änderung liefert für eine vorhandene UID dieselbe Snapshot-Hülle: `a === b` und
`a.state === b.state`. Zwischen geänderten Revisionen gilt für einen unveränderten
Strich ebenfalls Referenzgleichheit (`a.state.ITEMS[i] === b.state.ITEMS[j]`), auch
wenn Undo/Redo seine Position verändert. Die Snapshot-Objekte und ihre Unterobjekte
sind zur Laufzeit eingefroren; Verbraucher behandeln sie als schreibgeschützt.

Der erste Export kopiert die vorhandene Geometrie. Ein späterer Export übernimmt
unveränderte Strichkopien und kopiert nur geänderte Striche; Änderungen der
Arrayzusammensetzung benötigen neue Arraycontainer. Der Export ist damit frei
von Pixelkosten, aber der erstmalige Aufbau und die externe Serialisierung eines
großen Dokuments sind weiterhin Arbeit. Freeze sollte auch JSON-Serialisierung
und seine eigene Komprimierung außerhalb laufender Eingaben planen.

Ein Austausch eines Legacy-Storeeintrags wird beim Lesen erkannt und erhält eine
neue Revision. Beliebige direkte Änderungen an bestehenden Store-Unterobjekten
sind kein öffentlicher Mutationsvertrag. Zur Wiederherstellung die neue
Restore-Methode verwenden.

## Ereignisse und Aktivität

`lia:canvas-change` bleibt ein nachlaufend um 120 ms gebündeltes Änderungsereignis.
Sein `detail` enthält mindestens `uid`, `revision` und `active`; zusätzlich sind
bestehende Angaben wie `reason`, `hasItems` und `ts` möglich. Die Verzögerung
betrifft nur die Benachrichtigung: Modell und Revision sind bereits synchron
aktuell. Eine erfolgreiche explizite Wiederherstellung meldet `reason: 'restore'`
sofort.

`lia:canvas-activity` meldet Beginn und Ende laufender Vorgänge synchron. Sein
`detail` enthält `uid`, `revision`, `active` und `operations`. Vorgänge können
überlappen; `active` ist wahr, solange mindestens einer läuft. Die Operationsnamen
sind `draw`, `erase`, `select`, `pan`, `pinch`, `resize`, `editor`, `ocr`, `review`
sowie `ocr-background` und `controls`. Verbraucher entscheiden anhand von `active` und
sollten zusätzliche zukünftige Operationsnamen tolerieren.

Beide Ereignisse werden am Root-Window des Widgets ausgelöst. Ohne Einbettung ist
dies `window`; bei eingebettetem LiaScript muss Freeze seine Listener am selben
Root-Window anmelden. Ist das Root-Window wegen einer fremden Origin nicht zugänglich,
fällt das neue Aktivitätssignal auf das lokale Window zurück. Der API-Zugriff
erfolgt im Window mit dem Canvas-Register.

Freeze fragt unmittelbar vor einer geplanten Sicherung
`getCanvasLiveActivityByUID(uid)` ab. Ein stillgehaltener Stift mit weiterhin
gedrückter Spitze bleibt aktiv, ebenso eine offene OCR-Korrektur und eine laufende
Größenänderung. Eine DOM-Mutationspause oder das Ausbleiben von
`lia:canvas-change` beweist daher keinen Leerlauf. Nach `active: false` erneut
entprellen und die Aktivität vor dem Export nochmals lesen. Aktive Canvas dürfen
übersprungen werden; andere Canvas können währenddessen gesichert werden.

## Einbindung in lia-freeze-v2

Das folgende Beispiel prüft alle zugehörigen Revisionen und exportiert nur noch
nicht erfolgreich gesicherte Zustände. `writeBatch` ist die vorhandene
Persistenzfunktion von Freeze; sie erhält Snapshot-Hüllen und muss erst nach
erfolgreicher Speicherung auflösen. Fehler gehen an `onError`. Das Beispiel
wartet 180 ms nach einer Änderung und nutzt, falls vorhanden, einen Idle-Callback.

```js
function createCanvasLiveSaver(root, writeBatch, onError, eventTarget = window) {
  const api = window.__LIA_CANVAS_OCR__.freeze;
  const savedRevisions = new Map();
  let timer = 0;
  let idle = 0;
  let disposed = false;
  let saving = false;
  let again = false;

  function cancelPending() {
    clearTimeout(timer);
    timer = 0;
    if (idle) window.cancelIdleCallback(idle);
    idle = 0;
  }

  function schedule(delay = 180) {
    if (disposed) return;
    cancelPending();
    timer = setTimeout(() => {
      timer = 0;
      if (window.requestIdleCallback) {
        idle = window.requestIdleCallback(() => {
          idle = 0;
          void flush();
        }, { timeout: 1000 });
      } else {
        void flush();
      }
    }, delay);
  }

  async function flush() {
    if (disposed) return;
    if (saving) {
      again = true;
      return;
    }
    const batch = [];
    for (const { uid, revision } of api.listCanvasLiveStateRevisions(root)) {
      if (savedRevisions.get(uid) === revision) continue;
      if (api.getCanvasLiveActivityByUID(uid)?.active) continue;
      const snapshot = api.exportCanvasLiveStateByUID(uid);
      if (snapshot) batch.push(snapshot);
    }
    if (!batch.length) return;
    saving = true;
    let failed = false;
    try {
      await writeBatch(batch);
      for (const snapshot of batch) {
        savedRevisions.set(snapshot.uid, snapshot.revision);
      }
    } catch (error) {
      failed = true;
      onError(error);
    } finally {
      saving = false;
      if (again || failed) {
        again = false;
        schedule(failed ? 1000 : 180);
      }
    }
  }

  function onChange() {
    schedule();
  }
  function onActivity(event) {
    if (event.detail?.active) cancelPending();
    // Auch während anderer aktiver Canvas darf eine Sicherung erneut prüfen.
    schedule();
  }
  eventTarget.addEventListener('lia:canvas-change', onChange);
  eventTarget.addEventListener('lia:canvas-activity', onActivity);
  schedule(); // Bereits vorhandene Canvas beim Verbinden sichern.

  return {
    refresh: schedule, // Nach neuem Mount oder Wechsel des Root-Inhalts aufrufen.
    stop() {
      disposed = true;
      cancelPending();
      eventTarget.removeEventListener('lia:canvas-change', onChange);
      eventTarget.removeEventListener('lia:canvas-activity', onActivity);
    }
  };
}
```

Ein Wechsel der Canvas-Menge gehört zur bestehenden Mount-/Kursverwaltung von
Freeze. Sie ruft `refresh()` auf und entscheidet anhand ihrer stabilen
Aufgabenzuordnung, welche gespeicherten Canvas weiter zum Kurs gehören. Ein gerade
nicht gemountetes Canvas bedeutet nicht automatisch, dass dessen gespeicherte
Zeichnung gelöscht werden soll.

Die Live-API selbst erstellt keine JSON-Zeichenkette und komprimiert keine Daten.
Eine Integrationsprüfung muss deshalb auch bestätigen, dass der neue Aufrufer
nicht zusätzlich `exportAllCanvasFreezeStatesFromRoot` oder einen anderen
Rasterexport für dieselbe Autosicherung ausführt.

## Wiederherstellung und sofortige Abgabe

Freeze entpackt seinen Transport und übergibt den inneren `state`:

```js
const ok = api.restoreCanvasLiveStateByUID(targetUid, savedSnapshot.state);
```

Der Restore erzeugt bearbeitbare Daten ohne mutable Verbindung zum gespeicherten
Snapshot und stellt Geometrie, Redo, View, Hintergrund, Größen sowie die
unterstützten OCR-/Reviewdaten wieder her. Ein bereits geöffnetes Canvas wird mit
diesem Zustand neu aufgebaut. Ist ein Mount vorübergehend ausgeblendet und misst
0 Pixel, bleiben die letzten gültigen gespeicherten Größen erhalten. Ein
wiederhergestellter Editorentwurf öffnet auch den zugehörigen Ergebnisbereich.

Restore rendert die OCR-Ausgabe ohne das native Quizantwortfeld zu überschreiben,
eine neue Antwort als ausstehend zu markieren oder Abgabe-/Antwortereignisse
auszulösen. Freeze kann den nativen Antwortwert daher separat wiederherstellen.
Eine erneut angestoßene Reviewanalyse kann später ihren regulären Analysezustand
melden. Die neue Canvas-Revision ist über die Live-API lesbar; Freeze übernimmt
nicht die alte Revision als Bestätigung einer neuen Sicherung.

Ungültige strukturierte OCR-Abgaben werden mit `false` abgelehnt. Ist das
zugehörige BerechneOCR-Canvas bereits im DOM vorhanden, muss die gespeicherte
schriftliche Rechenart außerdem zur Rechenart des Ziels passen. Diese Prüfungen
finden vor dem Austausch von Store, Controller und Canvas-DOM statt; eine
abgelehnte Wiederherstellung verändert den vorhandenen Zustand nicht.

Beim endgültigen Abgeben muss Freeze vor dem Entfernen oder Ersetzen des
Canvas-DOM synchron den aktuellen Zustand abfragen. Es darf dabei keinen vorher
entprellten Autosicherungsstand als aktuell voraussetzen:

```js
const currentLiveStates = api.listCanvasLiveStateRevisions(root)
  .map(({ uid }) => api.exportCanvasLiveStateByUID(uid))
  .filter(Boolean);
// Nur für das endgültige Abgabebild / den bisherigen cvf1-Vertrag:
const finalCanvasStates = api.exportAllCanvasFreezeStatesFromRoot(root);
```

Der Canvas-`pointerup`-Handler nimmt den letzten Endpunkt auf und aktualisiert das
Modell synchron. Ein unmittelbar anschließender Abgabe-`click` sieht ihn bereits,
auch vor dem nächsten Animationsframe und vor dem gebündelten Änderungsereignis.
Ein Capture-Listener, der vor dem Canvas-`pointerup`-Handler läuft, darf diesen
noch nicht verarbeiteten Endpunkt nicht voraussetzen. Eine programmgesteuerte
Abgabe während einer aktiven Eingabe enthält alle bis dahin verarbeiteten Punkte;
für das Ende eines noch laufenden OCR-/Bearbeitungsvorgangs muss Freeze dessen
Aktivitätsende abwarten.

Die bestehenden `exportCanvasFreezeStateFromEntry`,
`exportCanvasFreezeStateFromPair`, `exportAllCanvasFreezeStatesFromRoot`, Render-
und Paint-Methoden behalten ihren `cvf1`-Vertrag. Der teure Alpha-Pixelzuschnitt ist
für diesen endgültigen Export weiterhin vorgesehen. Beim Ersetzen des Live-DOM
durch eine eingefrorene Darstellung beendet der Renderer den zugehörigen
Live-Controller und seine Aktivitätsmeldungen synchron.

## Prüfumfang und Ergebnisse

Abschluss am 10. September 2026; alle ausgeführten Prüfungen bestanden.
Der abschließende TypeScript-/Build-Lauf synchronisiert `dist/index.js` mit
dem geprüften Quellstand.

| Prüfung | Befehl | Ergebnis |
| --- | --- | --- |
| Gesamte Projektprüfung | `npm run check` | PASS: TypeScript, 583/583 Unit-Tests und dist-Build |
| Neuer Snapshot-Core (in den 583 enthalten) | `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test test/canvas-live-state.test.mts` | 8/8 PASS |
| Live-API-Browsertests | `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test test/browser/canvas-live-state.test.mts` nach Build | 15/15 PASS, fünf Szenarien je Browser, 28,0 s |
| Vorhandene Browserregressionen inklusive DOM-Mutationsfix | `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test test/browser/canvas-mutations.test.mts test/browser/cross-browser.test.mts` | 47/47 PASS |
| DOM-Mutationsfix erneut am abschließenden dist-Stand | `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test test/browser/canvas-mutations.test.mts` | 3/3 PASS |
| Abschließende Typprüfung und Bundle-Synchronisierung | `npm run typecheck` und `npm run build` | PASS |
| Patchformat | `git diff --check` | PASS |

Die Live-Browserfälle prüfen:

- Zeichnen und Radieren einschließlich aktiver Striche, Undo/Redo und Löschen.
- Hintergrundmodus/-abstand, OCR-Auswahl, Pan, Wheel-Zoom und Touch-Pinch.
- Mehrere unabhängige Canvas, Scope-Abfrage einschließlich Root-Paar und unbekannte UIDs.
- Größenänderung und Erhalt der letzten sichtbaren Abmessungen bei ausgeblendetem Mount.
- Unveränderliche Snapshots, Wiederverwendung identischer Striche und unveränderter Snapshots.
- JSON-Roundtrip mit vollständiger Offscreen-Geometrie, Float-Präzision, Redo, View, Hintergrund und Größe; anschließendes Weiterzeichnen.
- OCR-/Reviewzustand und offener Korrekturentwurf; Tippen, Abbrechen und Übernehmen der Korrektur.
- Wiederherstellung ohne Überschreiben manuell korrigierter nativer Quizantworten, ohne Pending-Änderung und ohne Abgabeereignisse.
- Ablehnung fehlerhafter strukturierter OCR-Daten ohne Store-, Revisions- oder DOM-Änderung.
- `pointercancel`, verlorene Pointer-Capture, Blur, dritter Touchkontakt und Wechsel von Pan zu Pinch ohne hängende Aktivität.
- Sofortige Abgabe eines aktiven letzten Strichs sowie des erst auf `pointerup` eingegangenen Endpunkts.
- Synchrones Beenden des Live-Controllers beim endgültigen Rendern.

Der Core-Test blockiert DOM-Zugriffe und `JSON.stringify` während des Exports.
Wurfbereite Getter auf bereits gesicherten historischen Punkten weisen zusätzlich
nach, dass reine View-/Hintergrund-/OCR-Änderungen deren Koordinaten nicht erneut
lesen. Die Browserinstrumentierung verbietet während synchroner Live-Aufrufe
Canvas-Erzeugung, Rasterzeichnung, `getImageData`, `toDataURL`, `toBlob`,
`OffscreenCanvas`, `CompressionStream` und `btoa`. Normales Zeichnen und der
abschließende `cvf1`-Export werden separat geprüft.

Der Performancefall verwendet ein synthetisch vorbelegtes Zeichenmodell mit
150 Strichen zu je 140 Punkten, also 21.000 Punkten, einschließlich Radierern
und Offscreen-Koordinaten. Ein weiterer Strich wird durch die Eingabehandler
gezeichnet; danach teilen alle 150 unveränderten Striche weiterhin ihre
Snapshotobjekte. Der erste Wert misst den erstmaligen Live-Export; die
Cachewerte stammen aus 100 wiederholten Aufrufen von Revisionsliste plus
Live-Export im abschließenden Lauf:

| Browser | Erster Export | Mittelwert Cache | Maximum Cache | Raster-/Readback-/Komprimierungsaufrufe |
| --- | ---: | ---: | ---: | ---: |
| Chromium 151.0.7922.34 | 3,1 ms | 0,007 ms | 0,2 ms | 0 |
| Firefox 153.0 | 5 ms | unter Timerauflösung | unter Timerauflösung | 0 |
| WebKit 26.5 | 7 ms | 0,01 ms | 1 ms | 0 |

Firefox meldete für alle Cacheaufrufe 0 ms; das bedeutet hier unterhalb seiner
Timerauflösung. Diese lokalen synthetischen Laufzeiten sind keine
geräteübergreifende Latenzgarantie. Sie messen weder die externe
JSON-Serialisierung noch die Persistenz durch lia-freeze-v2. Der strukturelle
Nachweis ist unabhängig von der Timerauflösung: Live-Aufrufe lösen keine der
instrumentierten Raster-, Readback- oder Komprimierungsoperationen aus.

Für den anschließenden Freeze-Fix bleibt die Aufruferumstellung erforderlich:
Die Autosicherung muss die neuen Live-Methoden verwenden und darf dabei
keinen zusätzlichen `cvf1`-Rasterexport auslösen. Die obigen Tests prüfen den
Canvas-Vertrag; sie ersetzen diese Integrationsprüfung in lia-freeze-v2 nicht.
