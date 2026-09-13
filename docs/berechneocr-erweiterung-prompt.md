# Umsetzungsprompt: BerechneOCR – Lösungswege, Trigonometrie, Exponentialfunktionen und Logarithmen

Erweitere BerechneOCR im Repository lia-canvas-ocr so, dass schulübliche alternative Lösungswege, zusammengefasste Umformungen sowie ausgewählte trigonometrische Gleichungen, Exponentialgleichungen und logarithmische Gleichungen zuverlässig geprüft werden. Implementiere die Erweiterung einschließlich Tests und Dokumentation. Verwende den vorhandenen Prüfcode und das Computeralgebrasystem; ergänze dafür kein Sprachmodell und keine zusätzlichen KI-Dienste. Die bestehende KI zur Handschrifterkennung bleibt erhalten.

Beachte Projektanweisungen und relevante Skills. Untersuche zuerst den aktuellen Stand. Bearbeite anschließend die folgenden Anforderungen in aufeinander aufbauenden Etappen. Eine Bestandsanalyse oder ein Umsetzungsplan allein erfüllt diesen Auftrag nicht.

1. Ausgangslage und Grundprinzip

   Die bisherige Analyse bezog sich auf Commit a139a851213c3b295d316da51aefecd1cb9019fe. Damals bestanden 136 gezielt ausgeführte vorhandene Tests; zusätzliche Laufzeitproben zeigten die unten beschriebenen Lücken. Prüfe diese Befunde am aktuellen Stand erneut.

   Relevante Dateien sind insbesondere:

   - src/math/calculation-path.ts
   - src/math/nonlinear-proof.ts
   - src/math/calculation-structure.ts
   - src/math/calculation-proof-budget.ts
   - src/math/equivalence.ts
   - src/math/expected-calculation.ts
   - src/math/calculation-methods.ts
   - src/lia/calculation-review.ts
   - src/lia/calculation-options.ts
   - src/canvas/calculation-freeze.ts
   - src/canvas/index.ts
   - src/index.ts

   Prüfe erkannte oder manuell korrigierte mathematische Aussagen unabhängig von einem vorgegebenen Musterweg. Führe Ausgangsaufgabe, Definitionsbereich, lokale Hilfsdefinitionen, Nebenrechnungen und Lösungszweige als Kontext mit. Ein korrekter Endwert darf einen tatsächlich falschen Zwischenschritt nicht verdecken.

2. Kubische Nullstellen und exakte algebraische Werte

   Unterstütze den vollständigen Rechenweg für die Nullstellen von:

       f(x) = 3x^3 - 4x^2 - 2x

   Beispielsweise:

       3x^3 - 4x^2 - 2x = 0
       x(3x^2 - 4x - 2) = 0
       x = 0 oder 3x^2 - 4x - 2 = 0
       L = {0; (2 + sqrt(10))/3; (2 - sqrt(10))/3}

   Akzeptiere eine vollständige Lösungsmenge sowie getrennt notierte, eindeutig zugeordnete Lösungen. Die quadratische Teilgleichung muss über pq-Formel, allgemeine quadratische Lösungsformel, quadratische Ergänzung und geeignete Faktorisierung bearbeitbar sein.

   Behebe die nachgewiesenen Ursachen: Die Einsetzproben stimmen bereits; der Vergleich verschiedener algebraischer Wurzelwerte kann jedoch ungeprüft abbrechen. Zusätzlich ist die Vollständigkeitsprüfung nach Faktordivision bei verbleibenden irrationalen Koeffizienten begrenzt. Entwickle belastbare exakte Nachweise; verwende keine bloße Gleitkommatoleranz, um Gleichheit, Verschiedenheit oder Vollständigkeit zu behaupten.

   Unterscheide Funktionsdefinition und Aufgabenabsicht. Bei einer ausdrücklich als Nullstellenaufgabe angegebenen Funktion darf f(x)=0 als Zielgleichung abgeleitet werden. Eine beliebige Funktionsdefinition allein ist kein automatischer Nullstellenauftrag. Gestalte erforderliche Autorenangaben explizit und rückwärtskompatibel.

3. Lösungswegvariationen und ausgelassene Zwischenschritte

   Akzeptiere unterschiedlich ausführliche korrekte Wege, beispielsweise:

       3x - 5 = 7  →  x = 4
       2(x + 3) = 3x - 4  →  x = 10
       3x^2 - 4x - 2 = 0  →  (x - 2/3)^2 = 10/9

   Verlange keine feste Anzahl elementarer Zwischenschritte. Bewahre Aufgabenbezug, mathematische Bedingungen und einen vollständigen Abschluss.

   Ausdrücklich angeschriebene Randoperationen sind verbindlich. Ein allein angegebenes „+5“ rechtfertigt bei 3x-5=7 nicht direkt x=4. Unterstütze eindeutig notierte Folgen mehrerer Randoperationen und prüfe deren Reihenfolge. Dokumentiere die unterstützte Schreibweise.

   Unterstütze numerisch definierte Hilfswerte der pq-Formel, beispielsweise p=-5 und q=6 bei x^2-5x+6=0, und deren anschließende Verwendung. Methodenbeschriftungen wie „pq-Formel“, „quadratische Ergänzung“ und „Faktorisierung“ dürfen einen korrekten Weg nicht unprüfbar machen. Eine Beschriftung allein beweist keinen Rechenschritt.

   Entferne die starre Annahme, dass D oder Delta immer b^2-4ac bedeuten. Eine ausdrücklich definierte Hilfsgröße D=(p/2)^2-q muss in ihrem Kontext korrekt geprüft werden. Widersprüchliche Definitionen dürfen nicht stillschweigend überschrieben werden.

4. Nullprodukt und Fallunterscheidungen

   Unterstütze „oder“, die entsprechenden TeX-Zeichen und getrennte, eindeutig beschriftete Zweige durchgängig in Vorprüfung, Parser, mathematischer Prüfung und Anzeige. Verhindere, dass intern unterstützte Schreibweisen an einer vorgeschalteten Grammatik scheitern.

   Ein Zweig darf eine Teilmenge der Lösungen bearbeiten. Seine Zwischengleichung muss nicht zur gesamten Ausgangsgleichung äquivalent sein; sie muss aus der gültigen Fallzerlegung folgen. Führe Zweigergebnisse zusammen und prüfe deren Vollständigkeit.

   Unterscheide Äquivalenzumformungen von zulässigen Folgerungen. Bei Quadrieren, variabler Division, Wurzelziehen oder anderen bedingten Schritten müssen verlorene Lösungen, zusätzliche Kandidaten und erforderliche Bedingungen berücksichtigt werden.

5. Trigonometrische Funktionen

   Unterstütze zunächst Gleichungen mit sin, cos und tan bei affinen Argumenten sowie geeignete Produkte und quadratische Ausdrücke in derselben trigonometrischen Funktion. Dazu gehören Nullproduktzerlegung, schulübliche Identitäten und Substitution mit korrektem Wertebereich.

   Verwalte Winkelmaß und Suchbereich ausdrücklich. Dokumentiere eine Standardkonvention für Radiant, unterstütze explizite Gradangaben und verhindere stillschweigende Vermischungen. Berücksichtige offene und geschlossene Intervallgrenzen. Über den reellen Zahlen sind periodische Lösungsfamilien mit ganzzahligem Parameter erforderlich.

   Verbindliche Prüffälle:

   - sin(x)=1/2 auf [0,2pi): L={pi/6;5pi/6}.
   - Dieselbe Gleichung über R: x=pi/6+2k*pi oder x=5pi/6+2k*pi, k ganzzahlig. Prüfe auch äquivalente Verschiebungen des ganzzahligen Parameters.
   - cos(2x)=0 auf [0,2pi): L={pi/4;3pi/4;5pi/4;7pi/4}.
   - tan(x)=1 über R: x=pi/4+k*pi; ursprüngliche Definitionslücken beachten.
   - cos(x)(2sin(x)-1)=0 auf [0,2pi): L={pi/6;pi/2;5pi/6;3pi/2}.
   - sin(x)=1/2 auf [0°,360°): L={30°;150°}.
   - cos(x)=2: keine reelle Lösung.
   - sin(x)=0 auf [0,2pi) beziehungsweise [0,2pi]: Die Zugehörigkeit von 2pi muss sich unterscheiden.

   Gegenprüfungen: Nur der Hauptwert von arcsin ist bei sin(x)=1/2 keine vollständige Lösung. Division durch cos(x) darf dessen Nullstellen nicht verlieren. sin(x+y)=sin(x)+sin(y) ist keine gültige allgemeine Identität. Umkehrfunktionen benötigen ihre korrekten Definitions- und Wertebereiche.

6. Exponentialfunktionen

   Unterstütze zunächst positive konstante Basen ungleich eins, die Basis e, affine Exponenten und geeignete polynomiale Gleichungen in einer Exponentialsubstitution. Prüfe Regeln für Potenzen, Logarithmieren und Rücksubstitution.

   Verbindliche Prüffälle:

   - 2^(x+1)=16: x=3; ausführlicher Weg und direkter Sprung.
   - 2^x=3: x=ln(3)/ln(2), einschließlich gleichwertiger Basiswechsel.
   - e^(2x)-3e^x+2=0: Substitution t=e^x>0, Ergebnis L={0;ln(2)}.
   - e^(2x)+e^x-2=0: Der Hilfswert t=-2 ist unzulässig; Ergebnis L={0}.
   - e^x=-1: keine reelle Lösung.

   Bei einer Exponentialsubstitution ist Positivität eine mathematisch notwendige Bedingung. Behandle Sonderfälle der Basis und des Wertebereichs ausdrücklich; übertrage Regeln nicht ungeprüft auf Basis null, eins oder negative Basen.

7. Logarithmen

   Unterstütze ln, den Zehnerlogarithmus und Logarithmen mit expliziter zulässiger konstanter Basis. Dokumentiere die Bedeutung einer unindizierten log-Schreibweise. Produkt-, Quotienten-, Potenz- und Basiswechselregeln müssen ihre Bedingungen behalten.

   Verbindliche Prüffälle:

   - ln(x-1)=0: x=2, ursprünglicher Definitionsbereich x>1.
   - log_10(x)=2: x=100.
   - log_2(x-1)=3: x=9, ursprünglicher Definitionsbereich x>1.
   - ln(x-1)+ln(x+1)=ln(8): Über x^2=9 bleibt ausschließlich x=3; x=-3 ist ausgeschlossen.
   - ln(x^2)=0: L={-1;1}, ursprünglicher Definitionsbereich x ungleich null.

   Gegenprüfungen: ln(x^2)=2ln(x) ist über x ungleich null keine äquivalente Umformung, weil die negative Hälfte des Definitionsbereichs verloren geht. Die passende Identität lautet dort 2ln(|x|). ln(u+v)=ln(u)+ln(v) ist keine allgemeine Logarithmusregel. Bei log_a(u) gelten a>0, a ungleich 1 und u>0.

8. Umfang und mathematische Verlässlichkeit

   Definiere für jede neue Gleichungsklasse die unterstützte Grammatik und die verfügbaren Nachweise. Allgemeine gemischte transzendente Gleichungen wie x+sin(x)=1 müssen nicht mit einem universellen Lösungsverfahren gelöst werden. Bewahre für nicht unterstützte Fälle den Status „nicht sicher prüfbar“ mit möglichst konkreter Ursache.

   Für die oben genannten gültigen Standardfälle ist „unknown“ keine erfolgreiche Umsetzung. Falsche Gleichheiten, fehlende Lösungen und nicht beweisbare Aussagen müssen unterscheidbar bleiben. Korrekte lokale Folgeschritte nach einem Fehler sollen weiterhin korrekt eingeordnet werden; der ursprüngliche Fehler bleibt für die Gesamtbewertung erhalten.

   Numerische Stichproben sind kein Beweis einer Identität oder einer vollständigen Lösungsmenge. Bewahre Kosten- und Größenbegrenzungen vor CAS-Aufrufen und die reaktionsfähige Oberfläche. Neue Funktionen dürfen nicht durch pauschales Entfernen der Schutzprüfungen ermöglicht werden.

9. Integration und Musterlösungen

   Integriere die Erweiterungen in die öffentliche Prüf-API, native Quizbewertung, Zeilenrückmeldung, den Korrektureditor und Freeze. Ergänze verständliche Rückmeldungen zu fehlenden Zweigen, unzulässigen Werten, verlorenen Lösungen und falschen Randoperationen.

   Erweitere die automatische Musterlösung für das konkrete kubische Beispiel und die neu zugesicherten Standardfälle. Ein automatisch erzeugter Lösungsweg muss denselben Prüfer bestehen wie ein Schülerweg. Der Musterweg darf die zugelassenen Schülerverfahren nicht einschränken.

   Gestalte erforderliche Angaben zu Aufgabenabsicht, Intervall, Grundmenge und Winkelmaß über eine kleine, dokumentierte und rückwärtskompatible Schnittstelle. Behalte die bestehenden schriftlichen Grundrechenverfahren und ihre fachlichen Prüfungen bei.

10. Nachweise und Abschluss

    Ergänze aussagekräftige Regressionstests für die genannten positiven und negativen Fälle. Prüfe mehrere Lösungswege pro Aufgabenfamilie, unterschiedliche Schrittweiten, Nebenrechnungen, Zweige, fehlende und zusätzliche Lösungen sowie gleichwertige Ergebnisdarstellungen.

    Prüfe den vollständigen Weg durch Vorprüfung, Parser und öffentliche Bewertung. Interne Hilfsfunktionen allein reichen als Nachweis nicht aus. Sichere insbesondere ab, dass unterstützte TeX-Ausdrücke nicht vorher an der Eingabeprüfung scheitern.

    Führe angemessene vorhandene Unit-Tests, Typprüfung und Produktionsbuild aus. Ergänze gezielte Browserprüfungen für geänderte Interaktionen, Zeilenfeedback, Quizbewertung und Freeze. Berichte getrennt über mathematische Prüfungen mit kontrollierter Erkennung und tatsächlich ausgeführte Handschrifterkennung.

    Dokumentiere die geänderten Fähigkeiten, eine kompakte Matrix der geprüften Szenarien, erforderliche Autorenangaben, verbleibende Grenzen und die ausgeführten Prüfungen. Behaupte keine allgemeine Unterstützung einer Funktionsklasse, wenn nur einzelne Sonderfälle nachgewiesen sind.
