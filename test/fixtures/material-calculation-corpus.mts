/** Curated mathematical text cases, NOT handwriting or an OCR accuracy corpus.
 * Expected answers are independently derived from the cited material structure.
 * Supported/gap labels describe the explicitly bounded current path validator;
 * a test confirming a gap is not evidence of recognition or solver coverage.
 */
export type MaterialCalculationSupport = 'supported' | 'gap';
export interface MaterialCalculationSource {
    /** Relative to the material root supplied to the coverage tool. */
    path: string;
    fromLine: number;
    toLine: number;
    /** Literal excerpt inside this small source window, not a generated label. */
    anchor: string;
}
export interface MaterialCalculationCase {
    id: string;
    family: string;
    source: MaterialCalculationSource;
    adaptation: string;
    prompt: string;
    lines: readonly string[];
    expectedSupport: MaterialCalculationSupport;
    incorrectLines?: readonly string[];
    note: string;
}
export const MATERIAL_CALCULATION_CORPUS_VERSION = 'material-calculation-v1';
const REPETITORIUM = 'Repetitorium/Repetitorium.tex';
const source = (fromLine: number, toLine: number, anchor: string): MaterialCalculationSource =>
    ({ path: REPETITORIUM, fromLine, toLine, anchor });
const T = String.raw;

export const MATERIAL_CALCULATION_CORPUS: readonly MaterialCalculationCase[] = [
    {
        id: 'linear-integer', family: 'linear-equations', source: source(21021,21024,'2x = 4'),
        adaptation: 'Aufgabe 1a unverändert; kurze Äquivalenzumformung unabhängig ergänzt.',
        prompt: '2x=4', lines: [T`2x=4\mid:2`,'x=2'], expectedSupport: 'supported',
        incorrectLines: [T`2x=4\mid:2`,'x=3'],
        note: 'Beide Seiten durch 2: einzige Lösung 2. Negativfall dividiert rechts falsch.',
    },
    {
        id: 'linear-decimal-comma', family: 'decimal-coefficients', source: source(21028,21029,'2x = 4,2'),
        adaptation: 'Aufgabe 1s unverändert; Dezimalkomma in Aufgabe und Lösung beibehalten.',
        prompt: '2x=4,2', lines: [T`2x=4,2\mid:2`,'x=2,1'], expectedSupport: 'supported',
        incorrectLines: [T`2x=4,2\mid:2`,'x=2,2'],
        note: '4,2/2=2,1 exakt; keine Rundungstoleranz als Ersatz für Gleichheit.',
    },
    {
        id: 'linear-constant-fraction', family: 'constant-fractions', source: source(21026,21027,T`\frac{x}{2} = 3`),
        adaptation: 'Aufgabe 1m unverändert; Nennerbeseitigung als Randoperation ergänzt.',
        prompt: T`\frac{x}{2}=3`, lines: [T`\frac{x}{2}=3\mid\cdot2`,'x=6'], expectedSupport: 'supported',
        incorrectLines: [T`\frac{x}{2}=3\mid\cdot2`,'x=1,5'],
        note: 'Konstanter Nenner 2 ist unkritisch; falsche Richtung der Gegenoperation im Negativfall.',
    },
    {
        id: 'linear-parentheses', family: 'parenthesized-expressions', source: source(21292,21294,'2 (x - 2) = 4'),
        adaptation: 'Aufgabe 15a unverändert; Ausmultiplizieren und Isolieren ausgeschrieben.',
        prompt: '2(x-2)=4', lines: ['2(x-2)=4',T`2x-4=4\mid+4`,T`2x=8\mid:2`,'x=4'], expectedSupport: 'supported',
        incorrectLines: ['2(x-2)=4',T`2x-4=4\mid+4`,T`2x=7\mid:2`,'x=4'],
        note: 'Kontrollierter falscher Zwischenwert 7 darf durch den richtigen Endwert 4 nicht geheilt werden.',
    },
    {
        id: 'linear-both-sides', family: 'linear-equations', source: source(21121,21123,'3x + 4x - 4 + 9 = 5x'),
        adaptation: 'Aufgabe 6a unverändert; gleichartige Terme zusammengefasst und nach x gelöst.',
        prompt: '3x+4x-4+9=5x', lines: ['3x+4x-4+9=5x',T`7x+5=5x\mid-5x`,T`2x+5=0\mid-5`,T`2x=-5\mid:2`,T`x=-\frac{5}{2}`], expectedSupport: 'supported',
        incorrectLines: ['3x+4x-4+9=5x','7x+5=5x','2x=-5',T`x=\frac{5}{2}`],
        note: '7x+5=5x ergibt x=-5/2. Die Vorzeichenumkehr ist der kontrollierte Fehler.',
    },
    {
        id: 'linear-collect-fractions', family: 'constant-fractions', source: source(21272,21274,T`\frac{x}{2}  + \frac{x}{4} - 2  = 6`),
        adaptation: 'Aufgabe 14a unverändert; gemeinsame Skalierung mit 4 und anschließende Lösung ergänzt.',
        prompt: T`\frac{x}{2}+\frac{x}{4}-2=6`, lines: [T`\frac{x}{2}+\frac{x}{4}-2=6`,'3x-8=24',T`3x=32\mid:3`,T`x=\frac{32}{3}`], expectedSupport: 'supported',
        incorrectLines: [T`\frac{x}{2}+\frac{x}{4}-2=6`,'3x-8=24','3x=32','x=10'],
        note: '3x/4=8; die Lösung ist exakt 32/3 und nicht auf 10 abzurunden.',
    },
    {
        id: 'quadratic-pure-root', family: 'square-root-pair', source: source(20363,20364,T`\sqrt{16}`),
        adaptation: 'Die Wurzelaufgabe sqrt(16) wird zur zugehörigen reellen Gleichung x²=16 erweitert.',
        prompt: 'x^2=16', lines: ['x^2=16',T`x_{1,2}=\pm4`], expectedSupport: 'supported',
        incorrectLines: ['x^2=16','x=4'],
        note: 'Bei der Gleichung gehören -4 und 4 dazu; die ursprüngliche einzelne Hauptwurzel wäre nur 4.',
    },
    {
        id: 'quadratic-completion', family: 'quadratic-completion', source: source(24429,24432,'5x^2 - 20x   = 50'),
        adaptation: 'Aufgabe 1d unverändert; quadratische Ergänzung statt direkter Formeleinsetzung vorgeführt.',
        prompt: '5x^2-20x=50', lines: [T`5x^2-20x=50\mid:5`,T`x^2-4x=10\mid+4`,'x^2-4x+4=14','(x-2)^2=14',T`x_{1,2}-2=\pm\sqrt{14}`,T`x_{1,2}=2\pm\sqrt{14}`], expectedSupport: 'supported',
        incorrectLines: [T`5x^2-20x=50\mid:5`,T`x^2-4x=10\mid+4`,'x^2-4x+4=15',T`x_{1,2}=2\pm\sqrt{14}`],
        note: '10+4=14; beide Verschiebungswurzeln erforderlich. Richtiger Abschluss verdeckt den falschen Zwischenwert 15 nicht.',
    },
    {
        id: 'quadratic-discriminant', family: 'quadratic-discriminant', source: source(24429,24430,'3x^2 + 24x - 3 = 0'),
        adaptation: 'Aufgabe 1c unverändert; durch 3 normalisiert, Diskriminante der normalisierten Gleichung berechnet.',
        prompt: '3x^2+24x-3=0', lines: ['3x^2+24x-3=0','x^2+8x-1=0',T`\Delta=8^2-4\cdot1\cdot(-1)=68`,T`x_{1,2}=-4\pm\sqrt{17}`], expectedSupport: 'supported',
        incorrectLines: ['3x^2+24x-3=0','x^2+8x-1=0',T`\Delta=8^2-4\cdot1\cdot(-1)=60`,T`x_{1,2}=-4\pm\sqrt{17}`],
        note: 'D=64+4=68, sqrt(68)/2=sqrt(17). Die falsche Diskriminante 60 bleibt ein Fehler.',
    },
    {
        id: 'quadratic-double-root', family: 'repeated-roots', source: source(24449,24451,'x^2 + 4x + 4 = 0'),
        adaptation: 'Aufgabe 2a unverändert; binomische Form und einfache Darstellung der doppelten Nullstelle ergänzt.',
        prompt: 'x^2+4x+4=0', lines: ['x^2+4x+4=0','(x+2)^2=0','x=-2'], expectedSupport: 'supported',
        incorrectLines: ['x^2+4x+4=0','(x+2)^2=0','x=2'],
        note: 'Nur der Wert -2 ist nötig; doppelte algebraische Vielfachheit verlangt keine zwei verschiedenen Zahlen.',
    },
    {
        id: 'quadratic-zero-product', family: 'zero-product-factoring', source: source(24391,24394,'x^2 - 6 x = x (x - 6)'),
        adaptation: 'Aus dem ausgeklammerten Term wird ausdrücklich die Nullgleichung formuliert; die im Material implizite Nullsetzung wird nicht verschwiegen.',
        prompt: 'x^2-6x=0', lines: ['x^2-6x=0','x(x-6)=0',T`L=\{0;6\}`], expectedSupport: 'supported',
        incorrectLines: ['x^2-6x=0','x(x-6)=0',T`L=\{6\}`],
        note: 'Die Faktoren liefern 0 und 6. Division durch x ohne Fallprüfung würde die Lösung 0 verlieren.',
    },
    {
        id: 'quadratic-empty-real-set', family: 'empty-real-solutions', source: source(24347,24351,'x^2 + p x + q =0'),
        adaptation: 'Die allgemeine p-q-Vorlage wird mit p=0 und q=1 numerisch instanziiert; Grundmenge ist R.',
        prompt: 'x^2+1=0', lines: [T`x^2+1=0\mid-1`,'x^2=-1',T`L=\varnothing`], expectedSupport: 'supported',
        incorrectLines: [T`x^2+1=0\mid-1`,'x^2=-1',T`L=\{-1;1\}`],
        note: 'Kein reelles Quadrat ist negativ. Komplexe Lösungen werden hier nicht als reelle Werte ausgegeben.',
    },
    {
        id: 'cubic-real-root', family: 'cubic-roots', source: source(20363,20364,T`\sqrt[3]{8}`),
        adaptation: 'Zur vorhandenen Kubikwurzelaufgabe wird die inverse Gleichung x³=8 gebildet.',
        prompt: 'x^3=8', lines: ['x^3=8','x=2'], expectedSupport: 'supported',
        incorrectLines: ['x^3=8','x=-2'],
        note: 'Eine reelle Kubikwurzel: 2³=8 und (-2)³=-8.',
    },
    {
        id: 'quartic-real-root-pair', family: 'quartic-roots', source: source(20365,20365,T`\sqrt[4]{81}`),
        adaptation: 'Zur vorhandenen Hauptwurzelaufgabe wird die reelle Gleichung x⁴=81 gebildet; beide Vorzeichen nötig.',
        prompt: 'x^4=81', lines: ['x^4=81',T`x_{1,2}=\pm3`], expectedSupport: 'supported',
        incorrectLines: ['x^4=81','x=3'],
        note: '3⁴=(-3)⁴=81. Der alleinige positive Wert ist keine vollständige Lösungsmenge.',
    },
    {
        id: 'biquadratic-two-branches', family: 'biquadratic-substitution', source: source(48891,48893,'f(x) = x^4 - 2x^2 - 5'),
        adaptation: 'Biquadratische Struktur des Funktionsterms beibehalten, Koeffizienten für eine Nullstellenaufgabe mit rationalen Hilfswurzeln auf -5 und +4 geändert.',
        prompt: 'x^4-5x^2+4=0',
        lines: ['x^4-5x^2+4=0',T`\text{Substitution:}u=x^2`,T`\text{Nebenrechnung:}u^2-5u+4=0`,T`u_{1,2}=\frac{5\pm3}{2}`,T`u_1=4,\quad u_2=1`,T`\text{Rücksubstitution:}x^2=4`,T`x_{1,2}=\pm2`,T`\text{Rücksubstitution:}x^2=1`,T`x_{1,2}=\pm1`,T`L=\{-2;-1;1;2\}`], expectedSupport: 'supported',
        incorrectLines: ['x^4-5x^2+4=0',T`\text{Substitution:}u=x^2`,T`\text{Nebenrechnung:}u^2-5u+4=0`,T`u_{1,2}=\frac{5\pm3}{2}`,T`\text{Rücksubstitution:}x^2=4`,T`x_{1,2}=\pm2`,T`L=\{-2;2\}`],
        note: 'u²-5u+4=(u-1)(u-4); beide positiven Hilfswerte erzeugen je zwei reelle x-Werte. Dies misst eine Adaptation, nicht unveränderte Abdeckung der Originalkoeffizienten.',
    },
    {
        id: 'rational-original-domain', family: 'rational-equations', source: source(21345,21348,T`\frac{a}{x} = \frac{d}{k}`),
        adaptation: 'Aufgabe 17f mit a=6,d=3,k=1 numerisch instanziiert; ursprünglicher Nenner bleibt x.',
        prompt: T`\frac{6}{x}=3`, lines: [T`\frac{6}{x}=3`,T`x\ne0`,'6=3x','x=2'], expectedSupport: 'supported',
        incorrectLines: [T`\frac{6}{x}=3`,T`x\ne0`,'6=3x',T`L=\{0;2\}`],
        note: 'x=0 bleibt ausgeschlossen. Die einzige zulässige Lösung ist 2.',
    },
    {
        id: 'rational-cancelled-pole', family: 'rational-cancellation', source: source(52537,52544,T`\frac{x^2 - 9}{x + 3}`),
        adaptation: 'Der originale gebrochen rationale Funktionsterm wird für eine Nullstellenaufgabe gleich null gesetzt; Nenner und Koeffizienten unverändert.',
        prompt: T`\frac{x^2-9}{x+3}=0`, lines: [T`\frac{x^2-9}{x+3}=0`,T`x\ne-3`,'x^2-9=0','x-3=0',T`L=\{3\}`], expectedSupport: 'supported',
        incorrectLines: [T`\frac{x^2-9}{x+3}=0`,'x^2-9=0',T`L=\{-3;3\}`],
        note: 'x²-9=(x-3)(x+3); Kürzen beseitigt die ursprüngliche Definitionslücke -3 nicht.',
    },
    {
        id: 'system-substitution-two', family: 'linear-systems-two', source: source(24597,24625,'2b &&  = 12a + 8'),
        adaptation: 'Beide Originalgleichungen und das Einsetzungsverfahren übernommen; dekorative Farben/Tabellenspalten und die irrtümlich wiederholte Randoperation weggelassen.',
        prompt: T`\begin{cases}4a=b-2\\2b=12a+8\end{cases}`,
        lines: ['I: 4a=b-2','II: 2b=12a+8','II: b=6a+4','II in I: 4a=(6a+4)-2','-2a=2','a=-1','II: b=6*(-1)+4','b=-2'], expectedSupport: 'supported',
        incorrectLines: ['I: 4a=b-2','II: 2b=12a+8','II: b=6a+4','II in I: 4a=6a+3','a=-1','b=-2'],
        note: '4a=6a+2 führt zu a=-1,b=-2; falsche Einsetzung mit +3 wird nicht durch richtige Endwerte geheilt.',
    },
    {
        id: 'system-three-rational-values', family: 'linear-systems-three', source: source(26204,26206,'y=5x-4'),
        adaptation: 'Aufgabe 8g mit allen drei Originalgleichungen übernommen; Rückeinsetzungen und rationale Lösung unabhängig ausgerechnet.',
        prompt: T`\begin{cases}y=5x-4\\5-3x=z\\6=x+y+z\end{cases}`,
        lines: ['I: y=5x-4','II: 5-3x=z','III: 6=x+y+z','6=x+(5x-4)+(5-3x)','6=3x+1',T`x=\frac{5}{3}`,T`y=\frac{13}{3}`,'z=0'], expectedSupport: 'supported',
        incorrectLines: ['I: y=5x-4','II: 5-3x=z','III: 6=x+y+z',T`x=\frac{5}{3}`,T`y=\frac{13}{3}`,'z=1'],
        note: 'x=5/3,y=13/3,z=0 erfüllen jede der drei Gleichungen. Eine falsche dritte Komponente darf nicht akzeptiert werden.',
    },
    {
        id: 'linear-original-probe', family: 'solution-verification', source: source(20983,20989,'3x-2&=5x+4'),
        adaptation: 'Originalrechnung und Probe mit expliziter Probe-Rolle statt bloßem Pfeil übernommen; Tabellen-Ausrichtung entfernt.',
        prompt: '3x-2=5x+4', lines: ['3x-2=5x+4','-2x=6','x=-3',T`\text{Probe:}3\cdot(-3)-2=5\cdot(-3)+4`,'-11=-11'], expectedSupport: 'supported',
        incorrectLines: ['3x-2=5x+4','-2x=6','x=-3',T`\text{Probe:}3\cdot(-3)-2=5\cdot(-3)+5`,'-11=-11'],
        note: 'Die Probe setzt -3 in die Ausgangsgleichung ein. Eine veränderte rechte Konstante bleibt ein Fehler trotz letzter richtiger Zahlengleichheit.',
    },
    {
        id: 'independent-neutral-calculation', family: 'auxiliary-calculation', source: source(20966,20986,'4 = 4 + 0 = 4+6-6 = 10 - 6'),
        adaptation: 'Das Beispiel zur Addition der Null wird als ausdrücklich unabhängige Nebenrechnung in die unmittelbar folgende lineare Beispielaufgabe eingefügt.',
        prompt: '3x-2=5x+4', lines: ['3x-2=5x+4',T`\text{Nebenrechnung:}4=4+0=4+6-6=10-6`,T`\text{Hauptrechnung:}-2x=6`,'x=-3'], expectedSupport: 'supported',
        incorrectLines: ['3x-2=5x+4',T`\text{Nebenrechnung:}4=4+0=4+6-6=10-5`,T`\text{Hauptrechnung:}-2x=6`,'x=-3'],
        note: 'Jede Gleichheit der Nebenrechnung muss stimmen. 10-5=5 macht die veränderte Kette falsch.',
    },
    {
        id: 'gap-logarithmic-equation', family: 'logarithmic-equations', source: source(20615,20618,T`a^c = b  \Leftrightarrow c = \log_a b`),
        adaptation: 'Die logarithmische Umkehrbeziehung mit Basis 2 und Exponent 3 zu einer Gleichung in ihrem positiven Argument instanziiert.',
        prompt: T`\log_2(x)=3`, lines: [T`\log_2(x)=3`,'x=2^3','x=8'], expectedSupport: 'gap',
        note: 'x>0 ist durch den Logarithmus gefordert; x=8 erfüllt dies. Nichtannahme ist eine dokumentierte Lücke, kein Erfolg der Erkennung.',
    },
    {
        id: 'gap-exponential-equation', family: 'exponential-equations', source: source(20615,20618,T`a^c = b  \Leftrightarrow c = \log_a b`),
        adaptation: 'Die gleiche Umkehrbeziehung als Aufgabe mit unbekanntem Exponenten, Basis 2 und Wert 8 instanziiert.',
        prompt: '2^x=8', lines: ['2^x=8',T`x=\log_2(8)`,'x=3'], expectedSupport: 'gap',
        note: 'Die streng monotone Funktion 2^x hat hier genau die reelle Lösung 3; variable Exponenten sind kein unterstütztes Polynomverfahren.',
    },
    {
        id: 'gap-inverse-trigonometric-chain', family: 'inverse-trigonometric-equations',
        source: { path: '12. Klasse/Mathe/Wochenaufgaben/Klasse 12 Woche 19.tex', fromLine: 401, toLine: 408, anchor: T`\arccos \left(B e^{-\lambda a + T} \right)` },
        adaptation: 'Der innere Arkuskosinus-Exponentialausdruck bleibt erhalten; B=1,lambda=1,T=0 und Zielwinkel pi/3 werden gewählt. Äußere inverse Quadrate entfallen ausdrücklich.',
        prompt: T`\arccos(e^{-a})=\frac{\pi}{3}`, lines: [T`\arccos(e^{-a})=\frac{\pi}{3}`,T`e^{-a}=\frac{1}{2}`,T`-a=\ln(\frac{1}{2})`,T`a=\ln2`], expectedSupport: 'gap',
        note: 'Für reelle Eingaben gilt a>=0; ln(2)>0 und arccos(1/2)=pi/3 bestätigen die Lösung. Kein allgemeiner Trigonometriebeweis im jetzigen Prüfer.',
    },
    {
        id: 'gap-power-derivative', family: 'differentiation', source: source(60594,60599,T`\frac{d}{dx} x^{n} &= n x^{n-1}`),
        adaptation: 'Die Potenzregel wird mit n=3 auf f(x)=x³ angewandt; die Ableitung wird als eigene Rechenoperation angegeben.',
        prompt: 'f(x)=x^3', lines: [T`f(x)=x^3\mid\frac{d}{dx}`,T`f'(x)=3x^2`], expectedSupport: 'gap',
        note: 'Die Sollableitung gilt für alle reellen x. Funktionsableitung darf nicht als gewöhnliche Gleichungsäquivalenz behandelt werden.',
    },
    {
        id: 'gap-power-antiderivative', family: 'integration', source: source(60595,60600,T`\int  x^{m} dx & = \frac{1}{m+1} x^{m+1}`),
        adaptation: 'Die Integrationsregel wird mit m=2 instanziiert. Für die vollständige Familie der Stammfunktionen wird die im Quellenausschnitt fehlende Integrationskonstante ausdrücklich ergänzt.',
        prompt: T`F(x)=\int x^2\,dx`, lines: [T`F(x)=\int x^2\,dx`,T`F(x)=\frac{1}{3}x^3+C`], expectedSupport: 'gap',
        note: 'C ist eine beliebige reelle Konstante; Ableiten ergibt x². Dies ist keine derzeit unterstützte Lösungswegklasse.',
    },
    {
        id: 'gap-symbolic-parameter', family: 'symbolic-parameters', source: source(21344,21346,'ax - c = d'),
        adaptation: 'Aufgabe 17b unverändert im Gleichungsterm; die notwendige Voraussetzung a ungleich null ist explizit an die Aufgabe angefügt.',
        prompt: T`ax-c=d,\quad a\ne0`, lines: [T`ax-c=d,\quad a\ne0`,'ax=c+d',T`x=\frac{c+d}{a}`], expectedSupport: 'gap',
        note: 'Nur unter a!=0 gilt dieser Weg. Es wird keine Nichtnullannahme allein aus einem Buchstaben erfunden.',
    },
    {
        id: 'gap-vector-addition', family: 'vector-calculations', source: source(71746,71750,T`P(1|2|3)`),
        adaptation: 'Die konkreten Koordinaten (1,2,3) werden übernommen und um den ausdrücklich neu gewählten Vektor (2,-1,0) für eine komponentenweise Additionsaufgabe ergänzt.',
        prompt: T`\vec v=\begin{pmatrix}1\\2\\3\end{pmatrix}+\begin{pmatrix}2\\-1\\0\end{pmatrix}`,
        lines: [T`\vec v=\begin{pmatrix}1\\2\\3\end{pmatrix}+\begin{pmatrix}2\\-1\\0\end{pmatrix}`,T`\vec v=\begin{pmatrix}3\\1\\3\end{pmatrix}`], expectedSupport: 'gap',
        note: 'Komponentenweise 1+2=3, 2-1=1, 3+0=3. Matrix-/Vektorausdrücke sind nicht mit drei unabhängigen skalaren Gleichungen gleichzusetzen.',
    },
];