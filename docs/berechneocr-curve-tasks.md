# BerechneOCR: Kurvendiskussion und Aufgabenoptionen

Die [README](../README.md#aufgaben-und-vorgabenoptionen) enthält die vollständige
Tabelle aller 26 Aufgabenarten und ihrer Vorgaben. Hier stehen die
mathematischen Grenzen und die dazugehörigen Antwortformen.

## Autorenvertrag

Der Aufruf bleibt:

```markdown
@BerechneOCR(`f(x)=x^3-3x`,`aufgabe=extrempunkte`)
```

Der erste Parameter enthält für Funktionsthemen eine Definition mit einer
einstelligen Funktion und einer Variablen, beispielsweise `f(x)=x^3-3x`.
Funktionsname und unabhängige Variable sind unterschiedliche einzelne
lateinische Buchstaben; Groß- und Kleinschreibung werden unterschieden.
Die Bezeichner `e` und `i` sind als unabhängige Variablen nicht vorgesehen.
Bei `vereinfachen` ist auch ein einzelner Term möglich.
`gleichung` bleibt der Standard; eine Funktionsdefinition allein fordert
weiterhin keine Nullstellenberechnung an. Das vorhandene automatische
Erkennen schriftlicher Grundrechenverfahren bleibt erhalten.

Der zweite Parameter enthält alle Optionen in einem Backtick-Argument.
Semikola trennen Optionen; Kommas trennen Intervallgrenzen oder Teilaufgaben.
Dezimalzahlen werden in diesen Vorgaben mit Dezimalpunkt geschrieben.
`zweitefunktion=g(x)=x+1` ist erlaubt, weil der Optionsparser nur das erste
Gleichheitszeichen als Trennzeichen verwendet. Die zweite Funktion muss
dieselbe unabhängige Variable wie die erste verwenden und bei einer
Funktionsdefinition einen vollständigen rechten Term enthalten.

Fehlende Pflichtangaben, doppelte Optionen einschließlich ihrer Aliasse,
unbekannte Aufgaben und unpassende Vorgaben sind Autorenfehler. Beispielsweise
braucht `tangente` eine `stelle`, `integral` braucht `von` und `bis`,
und `schnittpunkte` braucht `zweitefunktion`.
Ein Untersuchungsintervall ersetzt keine Integrationsgrenzen.

Die Ordnungen 1–4 sind möglich; Standard ist 1.
`familie=0` verlangt eine Stammfunktion, `familie=1` die allgemeine Familie mit freier Integrationskonstante (normalerweise `C`).
`art=lokal` ist der Standard für Extrema.
`art=global` braucht ein explizites Untersuchungsintervall.
`seite=beide` ist der Standard für Grenzwerte.

Die Autorenoptionen sind auf 2048 Zeichen begrenzt, Stellen und Grenzen
auf jeweils 64 Zeichen, die zweite Funktion auf 512 Zeichen.
Diese syntaktischen Grenzen ersetzen nicht die mathematische Prüfung.

## Prüfung und Antwortaufbau

Die erste Rechenzeile wiederholt die vorgegebene Funktion oder den Term.
Die folgenden Zeilen enthalten Ergebnisse und belegbare Zwischenrechnungen.
Eine Ableitung wird gegen die Ableitung der vorgegebenen Funktion geprüft;
sie ist kein äquivalenter Umformungsschritt der ursprünglichen Funktion.

Eine Aufgabe ist erst vollständig, wenn alle verlangten Ergebnisse vorhanden
sind. Eine falsche zusätzliche Rechnung verhindert die Annahme.
Nicht unterstützte Funktionen, Aussagen oder Begründungsformen bleiben
ungeprüft; sie werden nicht durch numerische Stichproben als richtig bestätigt.
Algebraisch gleichwertige Ergebnisse sind innerhalb der unterstützten
Ausdrucksformen möglich.

Für Punkte gehören Abszisse und Ordinate zusammen. Bei Extremaufgaben gehört
die Klassifikation dazu. Für `f(x)=x^3-3x` ergeben sich:

| Auftrag | Ergebnisform |
| --- | --- |
| `ableitung` | `f'(x)=3x^2-3` |
| `ableitungswert;stelle=2` | `f'(2)=9` |
| `extremstellen` | `H=\{-1\}` und `T=\{1\}` |
| `extrempunkte` | `H=\{(-1;2)\}` und `T=\{(1;-2)\}` |
| `wendestellen` | `W=\{0\}` |
| `wendepunkte` | `W=\{(0;0)\}` |

Punktkoordinaten können mit Semikolon oder senkrechtem Strich getrennt werden.
Leere Ergebnismengen werden ausdrücklich mit `\varnothing` angegeben.

Die Bedingungen `f'(x)=0` und `f''(x)=0` liefern zunächst Kandidaten.
Die Prüfung unterscheidet diese von echten Extrema und Wendepunkten:
`f(x)=x^3` hat bei 0 kein Extremum;
`f(x)=x^4` hat bei 0 keinen Wendepunkt.

## Mathematischer Umfang der Funktionseigenschaften

Die Eigenschaftenprüfung verarbeitet rationale Terme in einer reellen
Variablen. Zähler, Nenner und benötigte Hilfspolynome dürfen höchstens
Grad 4 haben; alle benötigten reellen Nullstellen müssen exakt und
vollständig nachgewiesen werden. Ursprüngliche Nennernullstellen
bleiben auch nach Kürzen oder algebraischer Vereinfachung ausgeschlossen.
Wurzelfunktionen, Logarithmen, abschnittsweise definierte Funktionen und
allgemeine transzendente Terme gehören nicht automatisch zu diesem Umfang.

| Aufgabe | Aktueller Umfang | Beispiel einer Ergebniszeile |
| --- | --- | --- |
| `vereinfachen` | Rationale Terme; vereinfachte Endform und ursprünglicher Definitionsbereich | Zu `(x^2-1)/(x-1)`: `f(x)=x+1` sowie `D=\mathbb{R}\setminus\{1\}` |
| `definitionsbereich` | Rationale Funktionen und ihre ursprünglichen Ausschlüsse, optional im Intervall | Zu `f(x)=1/x`: `D=\mathbb{R}\setminus\{0\}` |
| `wertebereich` | Polynome, optional auf einem Untersuchungsintervall | Zu `f(x)=x^2`: `W=[0;\infty)` |
| `symmetrie` | Rationale Funktionen; Ordinatenachse und Ursprung einschließlich des Definitionsbereichs | Zu `f(x)=x^2`: `\text{Symmetrie: achsensymmetrisch}` |
| `periodizitaet` | Rationale Funktionen und affine Sinus-/Kosinus-/Tangensformen | Zu `f(x)=sin(3x)`: `T=2*pi/3` |
| `achsenschnittpunkte` | Endliche Schnittpunktmenge rationaler Funktionen mit beiden Koordinatenachsen | Zu `f(x)=x^2-1`: `S=\{(-1\|0);(1\|0);(0\|-1)\}` |
| `schnittpunkte` | Endliche Schnittpunktmenge zweier rationaler Funktionen; beide Definitionsbereiche bleiben erhalten | Zu `f(x)=x^2` und `g(x)=x`: `S=\{(0\|0);(1\|1)\}` |
| `grenzwert` | Rationale Funktionen an endlichen Stellen und im Unendlichen, ein- oder beidseitig | Zu `f(x)=1/x` mit `stelle=0;seite=rechts`: `L=\infty` |
| `definitionsluecken` | Hebbare Lücken mit fortgesetztem Punkt und Polstellen | Zu `f(x)=(x^2-1)/(x-1)`: `\text{Hebbare Luecken}=\{(1\|2)\}` und `\text{Polstellen}=\varnothing` |
| `asymptoten` | Senkrechte, waagerechte und schiefe Geraden; keine höhergradigen Näherungspolynome | Zu `f(x)=1/x`: `A=\{x=0;y=0\}` |

`vereinfachen` verlangt eine gleichwertige Endform mit erhaltenen
Definitionsbedingungen, deren Termkomplexität höchstens der symbolisch
vereinfachten Vergleichsform entspricht. Längere gleichwertige Zwischenformen
können richtige Rechenzeilen sein, erfüllen aber das Endziel noch nicht.
Eine bestimmte didaktische Zielgestalt ist nicht gesondert konfigurierbar.

Ein `intervall` wird bei Vereinfachung, Definitionsbereich, Wertebereich
und endlichen Schnittpunktmengen berücksichtigt. Bei Symmetrie, Periodizität,
Grenzwerten, Definitionslücken und Asymptoten wird ein zusätzliches
Untersuchungsintervall derzeit nicht ausgewertet; solche Kombinationen
bleiben ungeprüft. Eine Kurvendiskussion mit Intervall sollte daher nur
Teilaufgaben aus der ersten Gruppe und die passenden Analysisaufgaben enthalten.

Bei `D_f` und `W_f` muss der Funktionsindex zum tatsächlichen Namen der
vorgegebenen Funktion passen; `D` und `W` ohne Index bleiben möglich.
Achsenschnittpunkte können gemeinsam als `S=\{...\}` oder getrennt als
`S_x` für die Abszissenachse und `S_y` für die Ordinatenachse angegeben werden.
Für `f(x)=x^2-1` sind dies beispielsweise:

```tex
S_x=\{(-1|0);(1|0)\}
S_y=(0|-1)
```

Einzelne Punkte können `P_1`, `S_1` oder mit weiteren eindeutigen Indizes
bezeichnet werden. `N` beziehungsweise `N_1` bezeichnet einen
Nullstellenpunkt und verlangt die Ordinate 0. Ein Punktname darf nicht
widersprüchlich für verschiedene Punkte wiederverwendet werden.

Bei identischen Graphen ist die Schnittpunktmenge unendlich;
diese Antwortform wird hier noch nicht geprüft. Bei Asymptoten ist `y` für die Ordinate reserviert; eine Aufgabe mit `y` als unabhängiger Variable bleibt daher ungeprüft.
Wertebereiche rationaler Funktionen mit echten Nennern oder Definitionslücken
gehören ebenfalls nicht zur aktuellen Wertebereichsprüfung.

Nichtkonstante rationale Funktionen sind nicht periodisch.
Konstante Funktionen sind unter jeder positiven Verschiebung periodisch
und haben keine kleinste positive Periode. Das Ergebnis kann dann
`\text{Jede positive Zahl ist eine Periode}` lauten. Auch `konstant`, `konstante Funktion` oder `keine Grundperiode` beschreiben diesen Fall vollständig. Eine einzelne Angabe wie `T=2` ist hier nur eine richtige Zwischenaussage.
Zusätzlich werden Grundperioden einer einzelnen Sinus-, Kosinus- oder
Tangensfunktion mit affinem Argument und affinem äußerem Term geprüft,
beispielsweise `f(x)=2*sin(3x+1)+4`. Die Koeffizienten müssen exakt
verarbeitbar sein. `winkelmass=rad` und `winkelmass=deg` werden berücksichtigt.
Für `f(x)=sin(3x)` gilt im Radiantmaß `T=2*pi/3`; ein größeres Vielfaches
wie `4*pi/3` ist zwar eine Periode, aber nicht die verlangte Grundperiode.

Bei hebbaren Definitionslücken ist die Ordinate der stetigen Fortsetzung
anzugeben; dieser Punkt gehört weiterhin nicht zum ursprünglichen Graphen.
Polstellen werden als Stellen angegeben. Beide Kategorien müssen in der
Antwort vorkommen, gegebenenfalls mit leerer Menge.

## Mathematischer Umfang der Analysisaufgaben

Die neue Analysisprüfung arbeitet mit einer reellen Variablen und
Polynomen mit rationalen Koeffizienten bis Grad 4. Benötigte Nullstellen müssen mit
den begrenzten exakten Routinen nachweisbar sein. Die Aufgabenoptionen
erweitern die bestehende Trigonometrieprüfung für Gleichungen nicht
automatisch auf trigonometrische Ableitungen oder Integrale.

| Aufgaben | Aktueller mathematischer Umfang |
| --- | --- |
| Ableitung und Ableitungswert | Polynome; Ableitungsordnung 1–4; Wert an einer endlichen, exakt auswertbaren Stelle |
| Tangente und Normale | Polynome an endlichen Stellen; senkrechte Normale bei waagerechter Tangente eingeschlossen |
| Lokale Extremstellen und Extrempunkte | Strikte innere Extrema von Polynomen; vollständige Kandidatenmenge und tatsächlicher Vorzeichenwechsel |
| Globale Extremstellen und Extrempunkte | Polynome auf dem vorgegebenen Intervall; enthaltene Randstellen und tatsächlich angenommene Werte werden berücksichtigt |
| Wendestellen und Wendepunkte | Polynome; tatsächlicher Wechsel des Vorzeichens der zweiten Ableitung |
| Monotonie und Krümmung | Polynome mit exakt bestimmbaren relevanten Nullstellen; Intervalle nach Ableitungsvorzeichen |
| Stammfunktion | Polynome; bei `familie=1` ist eine freie Integrationskonstante (normalerweise `C`) erforderlich |
| Bestimmtes Integral | Polynome mit zwei endlichen, exakt auswertbaren Grenzen; vertauschte Grenzen ändern das Vorzeichen |
| Flächeninhalt | Polynome, optional Differenz zweier Polynome; exakte Aufteilung an allen inneren Null- beziehungsweise Schnittstellen |

Lokale Extrema beziehen sich auf das Innere des Untersuchungsintervalls.
Randextrema werden über `art=global` abgefragt.
Eine konstante Funktion hat in dieser lokalen, strikten Konvention keine
Extremstellen; bei globaler Betrachtung nimmt jede Stelle des Intervalls
sowohl den größten als auch den kleinsten Wert an.

Ein gesetztes Intervall wird bei Stellenwerten und Geraden gegen die Stelle
geprüft. Bei Integralen und Flächen wird der Bereich bereits durch
`von` und `bis` festgelegt; ein zusätzliches `intervall` muss dieselben
Grenzen beschreiben. Uneigentliche Integrale sind in diesem Umfang nicht
enthalten.

Monotonieantworten verwenden beispielsweise
`steigend: (-\infty;-1)\cup(1;\infty)` und `fallend: (-1;1)`.
Krümmungsantworten heißen beispielsweise
`konvex: (0;\infty)` und `konkav: (-\infty;0)`.
`linksgekrümmt` und `rechtsgekrümmt` sind entsprechende Aliasformen.

## Tangente, Normale und Integralrechnung

```markdown
@BerechneOCR(`f(x)=x^2`,`aufgabe=tangente;stelle=2`)
@BerechneOCR(`f(x)=x^2`,`aufgabe=normale;stelle=0`)
@BerechneOCR(`f(x)=x^2`,`aufgabe=stammfunktion;familie=1`)
@BerechneOCR(`f(x)=x^2`,`aufgabe=integral;von=0;bis=2`)
@BerechneOCR(`f(x)=x`,`aufgabe=flaecheninhalt;von=-1;bis=1`)
@BerechneOCR(`f(x)=x^2`,`aufgabe=flaecheninhalt;von=0;bis=1;zweitefunktion=g(x)=x`)
```

Im Tangentenbeispiel lautet die Gerade `y=4x-4`.
Im Normalenbeispiel lautet sie `x=0`: Bei waagerechter Tangente ist
die Normale senkrecht und besitzt keine Darstellung `y=mx+b`.

Die Tangente heißt normalerweise `t`, die Normale `n`. Ist dieser Name
bereits durch die Ausgangsfunktion oder unabhängige Variable belegt, wird
`g` verwendet; bei einer weiteren Namenskollision `h`. Beispielsweise heißt
die Tangente zu `t(x)=x^2` an der Stelle 1 dann `g(x)=2x-1`.
Die Ausgangsfunktion darf nicht durch die Geradengleichung neu definiert werden.
`m_t` bezeichnet immer die Tangentensteigung, `m_n` immer die
Normalensteigung. Eine senkrechte Normale hat keine endliche Steigung `m_n`.

Die allgemeine Stammfunktion im Beispiel ist `F(x)=x^3/3+C`.
Normalerweise heißt die Stammfunktion `F` und die freie Integrationskonstante
`C`. Heißt die Ausgangsfunktion bereits `F`, wird die Stammfunktion mit `G`
bezeichnet. Lautet die unabhängige Variable `C`, wird stattdessen `K` als
Integrationskonstante verwendet.
Eine konkret gewählte Stammfunktion bleibt innerhalb desselben Rechenwegs
festgelegt. Sie darf in gleichwertiger Schreibweise wiederholt, aber nicht
unter demselben Namen mit einer anderen Integrationskonstante neu definiert
werden. Bei der Nullfunktion reicht für die allgemeine Familie natürlich
`F(x)=C`; bei unabhängiger Variable `C` entsprechend `F(C)=K`.

Das bestimmte Integral beträgt `8/3`.
Der Flächeninhalt zu `f(x)=x` auf `[-1,1]` beträgt `1`,
während das vorzeichenbehaftete Integral `0` beträgt.
Zwischen `x^2` und `x` auf `[0,1]` beträgt der Flächeninhalt `1/6`.
Flächen werden dafür an den relevanten Null- beziehungsweise Schnittstellen
aufgeteilt. Eine zweite Funktion ist beim bestimmten Integral keine gültige
Zusatzoption.

## Zusammengesetzte Kurvendiskussion

```markdown
@BerechneOCR(`f(x)=x^3-3x`,`aufgabe=kurvendiskussion;teile=definitionsbereich,nullstellen,extrempunkte,wendepunkte`)
```

Ohne `teile` werden Definitionsbereich, Nullstellen, Extrempunkte,
Wendepunkte, Monotonie und Krümmung verlangt.
Die übrigen zulässigen Teilaufgaben sind Wertebereich, Symmetrie,
Periodizität, Achsenschnittpunkte, Extremstellen, Wendestellen,
Definitionslücken und Asymptoten.

Eine Abgabe umfasst höchstens **32 Zeilen**, einschließlich Ausgangsfunktion
und Abschnittsüberschriften. Diese Grenze gilt gemeinsam für alle gewählten
Teile. Beispielsweise benötigt die automatisch erzeugte Lösung zu
`f(x)=x^3-3x` mit allen 14 zulässigen Teilaufgaben 34 Zeilen und wird deshalb
nicht als Musterlösung ausgegeben. Umfangreiche Untersuchungen lassen sich
auf mehrere Aufgaben mit jeweils passenden `teile` verteilen.

Jeder Teilauftrag wird einzeln ausgewertet. Überschriften geben an,
zu welchem Teil die folgenden Zeilen gehören; das verhindert beispielsweise
eine Verwechslung von `W` für Wertebereich und für Wendepunkte.
Die erzeugte Lösung verwendet dafür eigene Zeilen wie:

```tex
\text{definitionsbereich:}
D=\mathbb{R}
\text{extrempunkte:}
H=\{(-1;2)\}
T=\{(1;-2)\}
\text{wendepunkte:}
W=\{(0;0)\}
```

Das ist ein Ausschnitt einer Antwort, kein zusätzlicher LiaScript-Lösungsblock.
Jeder konfigurierte Teilauftrag muss vollständig beantwortet werden.
Nicht unterstützte Teilaufgaben verhindern eine automatische Gesamtbestätigung.
Der native Auflösen-Knopf verwendet dieselbe Aufgabenprüfung wie die Abgabe.

## Quellen für Syntax und Aufgabenmuster

Die Options-API dieser Erweiterung ist durch den lokalen Parser definiert.
Die folgenden gepinnten Quellen dienten nur als Syntax- und
Aufgabenvergleich; sie dokumentieren keine früher vorhandene Unterstützung
der neuen Aufgabenoptionen.

- [LiaScript/docs, README.md, Zeilen 10272–10310, Revision 17a777d](https://github.com/LiaScript/docs/blob/17a777dfb028c7979f2e3204090452c95a01c134/README.md#L10272): Makroargumente und Backticks bei Kommata.
- [MINT-the-GAP/Aufgabensammlung, Ableitungen/Aufgabe_0004.md, Zeilen 57–129, Revision 10ad35b](https://github.com/MINT-the-GAP/Aufgabensammlung/blob/10ad35b87de13f852c1f09adee62ee7bd0570d0d/05_Differentiation_und_Integration/01_Ableitungen/Aufgabe_0004.md#L57): grafische Ableitungen.
- [MINT-the-GAP/Wochenaufgabe, Alt/Sandkasten.md, Zeilen 515–527, Revision 3184ab1](https://github.com/MINT-the-GAP/Wochenaufgabe/blob/3184ab1978075679b6f1ae060474541fbfd1554d/Alt/Sandkasten.md#L515): Tangenten und Steigungen.
- [MINT-the-GAP/Wochenaufgabe, 9/Mathematik/Lia9_02.md, Zeilen 766–798, Revision 3184ab1](https://github.com/MINT-the-GAP/Wochenaufgabe/blob/3184ab1978075679b6f1ae060474541fbfd1554d/9/Mathematik/Lia9_02.md#L766): Vereinfachung und vollständige Lösungsmengen.
- [MINT-the-GAP/Wochenaufgabe, ABs/Spezi/profil10Lehrer.md, Zeilen 4751–4798, Revision 3184ab1](https://github.com/MINT-the-GAP/Wochenaufgabe/blob/3184ab1978075679b6f1ae060474541fbfd1554d/ABs/Spezi/profil10Lehrer.md#L4751): Stammfunktion eines Feldterms.

Der lokale Korpus war zuletzt am 12. September 2026 synchronisiert:
28 Quellen aktuell, 23 Templates ohne offene Inventarhinweise.

## Prüfung am 13. September 2026

- TypeScript-Prüfung und Produktionsbuild erfolgreich; das aktualisierte Browserbundle liegt in `dist/index.js`.
- Vollständige Unit-Testsuite nach dem zusätzlichen Review: **774/774 Tests bestanden**, ohne übersprungene Tests.
- Neue Kurvensuite: **30 Szenarien** in Chromium, Firefox und WebKit; einschließlich der Browsergruppen **33/33 Tests bestanden**.
- Funktionsgleichungen: **15/15 Browsertests bestanden**, einschließlich der Browsergruppen.
- Bestandsprüfungen: **45/45 Tests bestanden**, einschließlich Chromium 131 sowie der aktuellen Versionen von Chromium, Firefox und WebKit.
- Insgesamt **93/93 Browsertests bestanden**, ohne übersprungene Tests.
- Die neuen Szenarien prüfen den sichtbaren Korrektureditor, beide öffentlichen Bewertungs-APIs, die native Quizbewertung, Zeilenrückmeldungen, Freeze, fehlende Vorgaben und den nativen Auflösen-Knopf.

Die Browserszenarien beginnen mit einem kontrollierten OCR-Ergebnis, das
anschließend im sichtbaren Editor korrigiert wird. Sie prüfen die
Aufgabeninterpretation und mathematische Bewertung. Die Erkennungsgenauigkeit
echter Handschriften wurde dabei nicht gemessen. Für die TeX-Darstellung
verwenden sie die bestehende deterministische Browsertestumgebung.

Ein erster Wiederholungslauf meldete abgebrochene Schrift-Downloads in Firefox.
Die Testhilfe wartet nun auf geladene Schriften, vermeidet eine Zwischenrenderung
vor dem Reload und speichert die tatsächlich geladenen Hostschriften zwischen.
Alle Prüfungen auf Browserfehler bleiben aktiv; beide betroffenen Suiten
bestanden anschließend vollständig.

Reproduzierbar in PowerShell mit:

```powershell
$env:LIA_BROWSER_PROJECTS = 'chromium,firefox,webkit'
npm run check
npm run test:browser:full
```
