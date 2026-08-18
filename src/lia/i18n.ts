// LiaScript language-aware text helper for canvas OCR UI.

function currentLiaLang(): string {
    try {
        const fromDoc = document.documentElement && document.documentElement.lang;
        if (fromDoc && String(fromDoc).trim()) return String(fromDoc).trim();
    } catch (_) { }

    try {
        const w = window as any;
        const fromLia = w && w.LIA && w.LIA.settings && w.LIA.settings.data && w.LIA.settings.data.lang;
        if (fromLia && String(fromLia).trim()) return String(fromLia).trim();
    } catch (_) { }

    try {
        if (navigator.language && String(navigator.language).trim()) return String(navigator.language).trim();
    } catch (_) { }

    return 'en';
}

function normalizeLang(raw: string): string {
    const s = String(raw || '').trim();
    if (!s) return 'en';
    return s.toLowerCase();
}

type I18nState = {
    cache: Record<string, string>;
    pending: Record<string, Promise<void> | undefined>;
    lang: string;
    translateQueue: Array<{ cacheKey: string; lang: string; text: string }>;
    translateTimer: ReturnType<typeof setTimeout> | null;
    langWatchObserver: MutationObserver | null;
};

const I18N_STATE: I18nState = (window as any).__LIA_CANVAS_I18N_STATE__ =
    (window as any).__LIA_CANVAS_I18N_STATE__ || {
        cache: {},
        pending: {},
        lang: normalizeLang(currentLiaLang()),
        translateQueue: [],
        translateTimer: null,
        langWatchObserver: null
    };

const BUILTIN_TRANSLATIONS: Record<string, Record<string, string>> = {
    de: {
        'ocr.quiz.tooFewLines': 'Schreibe die Ausgangsgleichung und mindestens einen L\u00f6sungsschritt.',
        'ocr.quiz.tooManyLines': 'Verwende h\u00f6chstens 32 Rechenzeilen.',
        'ocr.quiz.invalidFormat': 'Der \u00fcbergebene Rechenweg konnte nicht gelesen werden.',
        'ocr.quiz.casUnavailable': 'Die mathematische Pr\u00fcfung ist nicht verf\u00fcgbar.',
        'ocr.quiz.taskMismatch': 'Die erste Zeile muss zur vorgegebenen Gleichung passen.',
        'ocr.quiz.transitionProblem': 'Pr\u00fcfe den \u00dcbergang von Zeile {from} zu Zeile {to}.',
        'ocr.quiz.notSolved': 'Stelle die Variable am Ende frei oder gib die vollst\u00e4ndige Wurzell\u00f6sung an.',
        'ocr.quiz.unknown': 'Der Rechenweg konnte nicht sicher gepr\u00fcft werden.',
        'ocr.quiz.correct': 'Der vollst\u00e4ndige Rechenweg ist richtig.',
        'ocr.quiz.column.invalidFormat': 'Die schriftliche Rechnung konnte nicht gelesen werden.',
        'ocr.quiz.column.operandMismatch': 'Die geschriebenen Zahlen passen nicht zur Aufgabe.',
        'ocr.quiz.column.resultMismatch': 'Pr\u00fcfe die Ergebniszeile.',
        'ocr.quiz.column.carryMismatch': 'Pr\u00fcfe die eingetragenen \u00dcbertr\u00e4ge.',
        'ocr.quiz.column.missingCarry': 'Ein notwendiger \u00dcbertrag fehlt.',
        'ocr.quiz.column.correct': 'Die schriftliche Rechnung ist richtig.',
        'ocr.title': 'LaTeX-OCR',
        'ocr.selectSubmit': 'Als Lösung senden',
        'ocr.runningOcr': 'OCR läuft...',
        'ocr.submitted': 'Gesendet',
        'ocr.ocrError': 'Fehler',
        'ocr.plus.title': 'Erkennung prüfen',
        'ocr.plus.description': 'Vergleiche deine Handschrift mit dem dargestellten Ergebnis. Korrigiere bei Bedarf das TeX.',
        'ocr.plus.handwriting': 'Ausgewählte Handschrift',
        'ocr.plus.preview': 'Dargestelltes Ergebnis',
        'ocr.plus.tex': 'Erkanntes TeX',
        'ocr.plus.texMultiline': 'Erkanntes TeX (eine Gleichung pro Zeile)',
        'ocr.plus.linesDetected': '{count} Zeilen erkannt',
        'ocr.plus.prepared': 'Im Hintergrund vorbereitet',
        'ocr.plus.cancel': 'Abbrechen',
        'ocr.plus.accept': 'Ergebnis übernehmen',
        'ocr.plus.renderBlock': 'Rechenblock erkennen und darstellen',
        'ocr.plus.selectArea': 'Darstellungsbereich auswählen',
        'ocr.plus.clearSelection': 'Darstellungsbereich aufheben',
        'ocr.plus.selectionEmpty': 'Im ausgewählten Bereich ist keine Handschrift.',
        'ocr.plus.rendering': 'Rechenblock wird erkannt …',
        'ocr.plus.writeFirst': 'Schreibe zuerst etwas in die Zeichenfläche.',
        'ocr.plus.readyToRender': 'Bereit zum Darstellen.',
        'ocr.plus.preparing': 'Erkennung wird im Hintergrund vorbereitet …',
        'ocr.plus.preparedLines': '{count} Zeilen im Hintergrund vorbereitet.',
        'ocr.plus.preparedStale': 'Neue Erkennung vorbereitet – bitte erneut darstellen.',
        'ocr.plus.rendered': 'Rechenblock dargestellt.',
        'ocr.plus.stale': 'Handschrift geändert – bitte erneut darstellen.',
        'ocr.plus.renderError': 'Der Rechenblock konnte nicht erkannt werden.',
        'ocr.plus.engineUnavailable': 'Die OCR-Engine f\u00fcr Rechenbl\u00f6cke ist nicht verf\u00fcgbar.',
        'ocr.plus.renderErrorKeep': 'Neue Erkennung fehlgeschlagen – das vorherige Ergebnis bleibt sichtbar.',
        'ocr.plus.resultTitle': 'Erkanntes Ergebnis',
        'ocr.plus.editResult': 'Erkennung bearbeiten',
        'ocr.plus.applyCorrection': 'Änderungen übernehmen',
        'ocr.plus.editEmpty': 'Gib mindestens eine Gleichung ein.',
        'ocr.plus.editTooManyLines': 'Verwende höchstens {count} Gleichungen.',
        'ocr.plus.editLineCount': '{count} Gleichungen bereit.',
        'ocr.plus.insertPlusMinus': '± einfügen',
        'ocr.plus.missingPlusMinus': 'Zeile {line}: Vor der Wurzel wurde kein ± erkannt. Prüfe die Handschrift oder füge es ein.',
        'ocr.plus.validation.pathLabel': 'Geprüfter Rechenweg',
        'ocr.plus.validation.running': 'Übergänge werden geprüft …',
        'ocr.plus.validation.error': 'Die Übergänge konnten nicht geprüft werden.',
        'ocr.plus.validation.stale': 'Die Rechnung wurde geändert – die vorherige Prüfung ist veraltet.',
        'ocr.plus.validation.noTransitions': 'Ab zwei Gleichungen kann ein Übergang geprüft werden.',
        'ocr.plus.validation.summaryOne': '{count} Übergang: {valid} richtig, {invalid} falsch, {unknown} nicht sicher prüfbar.',
        'ocr.plus.validation.summary': '{count} Übergänge: {valid} richtig, {invalid} falsch, {unknown} nicht sicher prüfbar.',
        'ocr.plus.validation.checking': 'Wird geprüft',
        'ocr.plus.validation.correct': 'Richtig',
        'ocr.plus.validation.incorrect': 'Fehler',
        'ocr.plus.validation.unknownLabel': 'Nicht sicher prüfbar',
        'ocr.plus.validation.casUnavailableLabel': 'CAS nicht verfügbar',
        'ocr.plus.validation.casUnavailableSummary': 'Das CAS ist nicht verfügbar. Importiere LiaTemplates/Algebrite vor Canvas OCR; es wurde kein Übergang geprüft.',
        'ocr.plus.validation.transitionPending': 'Übergang von Zeile {from} zu Zeile {to}: wird geprüft.',
        'ocr.plus.validation.transitionValid': 'Übergang von Zeile {from} zu Zeile {to}: richtig.',
        'ocr.plus.validation.transitionInvalid': 'Übergang von Zeile {from} zu Zeile {to}: falsch. Erklärung anzeigen.',
        'ocr.plus.validation.transitionUnknown': 'Übergang von Zeile {from} zu Zeile {to}: konnte nicht sicher geprüft werden.',
        'ocr.plus.validation.transitionStale': 'Übergang von Zeile {from} zu Zeile {to}: Prüfung ist veraltet.',
        'ocr.plus.validation.validOperation': 'Die angegebene Umformung wurde auf beide Seiten angewendet.',
        'ocr.plus.validation.validEquivalent': 'Die beiden Gleichungen sind äquivalent.',
        'ocr.plus.validation.validRoots': 'Die Plus-Minus-Wurzelschreibweise enthält beide reellen Lösungen.',
        'ocr.plus.validation.validCubeRoot': 'Die Kubikwurzelschreibweise gibt die eindeutige reelle Lösung an.',
        'ocr.plus.validation.validFourthRoot': 'Die Plus-Minus-Schreibweise der vierten Wurzel enthält beide reellen Lösungen.',
        'ocr.plus.validation.missingPlusMinus': 'Vor der Wurzel fehlt das ±. Ohne Plus-Minus sind nicht beide reellen Lösungen angegeben.',
        'ocr.plus.validation.invalidLeft': 'Die linke Seite passt nicht zur angegebenen Umformung.',
        'ocr.plus.validation.invalidRight': 'Die rechte Seite passt nicht zur angegebenen Umformung.',
        'ocr.plus.validation.invalidBoth': 'Beide Seiten passen nicht zur angegebenen Umformung.',
        'ocr.plus.validation.invalidEquivalent': 'Die beiden Gleichungen haben unterschiedliche Lösungen.',
        'ocr.plus.validation.unknownDomain': 'Ohne Angabe der Definitionsmenge kann dieser Übergang nicht sicher geprüft werden.',
        'ocr.plus.validation.casUnavailable': 'Das CAS ist nicht verfügbar. Importiere LiaTemplates/Algebrite vor Canvas OCR.',
        'ocr.plus.validation.unknown': 'Dieser Übergang konnte mit den unterstützten Regeln nicht sicher geprüft werden.',
        'ocr.plus.validation.freezeTransitionInvalid': 'Übergang von Zeile {from} zu Zeile {to}: falsch.',
        'ocr.plus.column.previewLabel': 'Erkannte schriftliche Rechnung',
        'ocr.plus.column.recognized': 'Schriftliche Rechnung erkannt.',
        'ocr.plus.openBlock': 'Rechenblock öffnen',
        'ocr.plus.closeBlock': 'Rechenblock schließen',
        'ocr.retry': 'Erneut versuchen',
        'ocr.yes': 'ja',
        'ocr.no': 'nein',
        'ocr.pill.model': 'Modell',
        'ocr.pill.backend': 'Backend',
        'ocr.pill.precision': 'Praezision',
        'ocr.pill.loaded': 'Geladen',
        'ocr.pill.phase': 'Phase',
        'ocr.pill.status': 'Status',
        'ocr.btn.load': 'Laden/Neu laden',
        'ocr.btn.log': 'Log',
        'ocr.btn.copy': 'Kopieren',
        'ocr.aria.model': 'Modell',
        'ocr.aria.precision': 'Präzision',
        'ocr.report.title': 'LaTeX-OCR Statusbericht',
        'ocr.report.progress': 'Fortschritt',
        'ocr.report.log': 'Log',
        'ocr.log.copied': 'Bericht in die Zwischenablage kopiert.',
        'ocr.log.copyFailed': 'Kopieren fehlgeschlagen (Zwischenablage blockiert).',
        'ocr.status.idle': 'inaktiv',
        'ocr.status.ready': 'bereit',
        'ocr.status.working': 'arbeitet',
        'ocr.status.loading': 'lädt',
        'ocr.status.error': 'fehler',
        'ocr.phase.idle': 'inaktiv',
        'ocr.phase.import': 'import',
        'ocr.phase.download': 'download',
        'ocr.phase.pipeline': 'pipeline',
        'ocr.load.failed': 'Laden fehlgeschlagen.',
        'ocr.load.engine': 'OCR-Engine wird geladen...',
        'ocr.load.downloadDetail': 'Dieser Download passiert nur einmal und wird danach gecacht.',
        'ocr.load.importing': 'OCR-Engine wird geladen... (Bibliothek wird importiert)',
        'ocr.load.initializing': 'OCR-Engine wird geladen... (Modell wird initialisiert)',
        'ocr.load.firstStart': 'Der erste Start kann einen Moment dauern.',
        'canvas.undo': 'Rückgängig',
        'canvas.redo': 'Wiederholen',
        'canvas.pen': 'Stift',
        'canvas.eraser': 'Radierer',
        'canvas.background': 'Hintergrund',
        'canvas.edit': 'Bearbeiten',
        'canvas.tools': 'Werkzeuge',
        'canvas.drawingArea': 'Zeichenfläche',
        'canvas.clearMarkerRectangle': 'Markierungsrechteck entfernen',
        'canvas.closeMenu': 'Menü schließen',
        'canvas.clearAll': 'Alles löschen',
        'canvas.colorLabel': 'Farbe {color}',
        'canvas.color.auto': 'Automatisch',
        'canvas.color.red': 'Rot',
        'canvas.color.orange': 'Orange',
        'canvas.color.yellow': 'Gelb',
        'canvas.color.violett': 'Violett',
        'canvas.color.blue': 'Blau',
        'canvas.color.lightblue': 'Hellblau',
        'canvas.color.green': 'Grün',
        'canvas.color.darkgreen': 'Dunkelgrün',
        'canvas.color.black': 'Schwarz',
        'canvas.color.white': 'Weiß',
        'canvas.penWidth': 'Stiftbreite',
        'canvas.opacity': 'Deckkraft',
        'canvas.eraserWidth': 'Radiererbreite',
        'canvas.noBackground': 'Kein Hintergrund',
        'canvas.grid': 'Raster',
        'canvas.lined': 'Liniert',
        'canvas.spacing': 'Abstand',
        'canvas.backgroundSpacing': 'Hintergrundabstand',
        'canvas.resizeBottomLeft': 'Zeichenfläche unten links skalieren',
        'canvas.resizeBottomRight': 'Zeichenfläche unten rechts skalieren',
        'canvas.freeze.empty': 'Kein sichtbarer Inhalt der Zeichenfläche eingefroren.',
        'canvas.freeze.drawingArea': 'Eingefrorene Zeichenfläche'
    }
};

function getBuiltinTranslation(lang: string, key: string): string | null {
    const raw = String(lang || '').trim().toLowerCase();
    if (!raw) return null;
    const full = BUILTIN_TRANSLATIONS[raw];
    if (full && full[key]) return full[key];
    const base = raw.split('-')[0];
    const short = BUILTIN_TRANSLATIONS[base];
    if (short && short[key]) return short[key];
    return null;
}

let syncingLanguage = false;

function syncLanguage(): string {
    const now = normalizeLang(currentLiaLang());
    if (now === I18N_STATE.lang || syncingLanguage) return now;
    syncingLanguage = true;
    try {
        I18N_STATE.lang = now;
        // Clear translation cache so strings are re-fetched for the new language.
        I18N_STATE.cache = {};
        I18N_STATE.pending = {};
        document.dispatchEvent(new CustomEvent('lia:canvas-i18n-update', {
            detail: { lang: now, reason: 'lang-change' }
        }));
    } finally {
        syncingLanguage = false;
    }
    return now;
}

export function ensureI18nLanguageWatch(): void {
    if (I18N_STATE.langWatchObserver) return;
    const legacyTimer = (I18N_STATE as any).langWatchInterval;
    if (legacyTimer) {
        clearInterval(legacyTimer);
        (I18N_STATE as any).langWatchInterval = null;
    }
    const root = document.documentElement;
    if (!root) return;
    I18N_STATE.langWatchObserver = new MutationObserver(() => syncLanguage());
    I18N_STATE.langWatchObserver.observe(root, {
        attributes: true,
        attributeFilter: ['lang']
    });
}

async function translateWithMyMemory(toLang: string, text: string): Promise<string | null> {
    const lang = String(toLang || '').split('-')[0].toLowerCase() || 'en';
    if (!lang || lang === 'en') return text;

    const url = 'https://api.mymemory.translated.net/get?q=' +
        encodeURIComponent(text) + '&langpair=' + encodeURIComponent('en|' + lang);

    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 3500) as unknown as number;

    try {
        const res = await fetch(url, { signal: ctrl.signal });
        if (!res || !res.ok) return null;
        const json = await res.json() as any;
        const translated = json && json.responseData && json.responseData.translatedText;
        if (!translated || typeof translated !== 'string') return null;
        return translated.trim() || null;
    } catch (_) {
        return null;
    } finally {
        clearTimeout(t);
    }
}

function decodeHtmlEntities(s: string): string {
    const txt = document.createElement('textarea');
    txt.innerHTML = String(s || '');
    return txt.value || '';
}

function sanitizeTranslatedText(s: string): string {
    let out = String(s || '');
    out = decodeHtmlEntities(out);
    out = out.replace(/<[^>]+>/g, ' ');
    out = out.replace(/\s+/g, ' ').trim();
    return out;
}

// Drains the queue sequentially to avoid bursting the MyMemory free-tier limit.
async function drainTranslateQueue(): Promise<void> {
    while (I18N_STATE.translateQueue.length > 0) {
        const item = I18N_STATE.translateQueue.shift()!;
        const { cacheKey, lang, text } = item;

        // May have been resolved by a previous drain or cache hit
        if (I18N_STATE.cache[cacheKey]) {
            delete I18N_STATE.pending[cacheKey];
            continue;
        }

        try {
            const translated = await translateWithMyMemory(lang, text);
            const clean = translated ? sanitizeTranslatedText(translated) : '';
            if (clean && clean !== text) {
                I18N_STATE.cache[cacheKey] = clean;
                document.dispatchEvent(new CustomEvent('lia:canvas-i18n-update', {
                    detail: { lang, key: cacheKey, translated: clean }
                }));
            }
        } catch (_) { }

        delete I18N_STATE.pending[cacheKey];

        // Small delay between requests to stay within rate limits
        if (I18N_STATE.translateQueue.length > 0) {
            await new Promise<void>(r => setTimeout(r, 150));
        }
    }
}

function startTranslation(cacheKey: string, lang: string, sourceText: string): void {
    if (I18N_STATE.pending[cacheKey]) return;
    const normalizedSource = String(sourceText || '').replace(/&/g, 'and').replace(/…/g, '...');

    // Mark as pending immediately so duplicate calls are deduplicated
    I18N_STATE.pending[cacheKey] = Promise.resolve();
    I18N_STATE.translateQueue.push({ cacheKey, lang, text: normalizedSource });

    // Schedule a single drain pass; if one is already running it will pick up the new item
    if (I18N_STATE.translateTimer === null) {
        I18N_STATE.translateTimer = setTimeout(() => {
            I18N_STATE.translateTimer = null;
            drainTranslateQueue();
        }, 0);
    }
}

export function liaLang(): string {
    ensureI18nLanguageWatch();
    return syncLanguage();
}

export function liaT(key: string, fallbackEn: string): string {
    const lang = liaLang();
    const fallback = String(fallbackEn || '');

    if (!fallback) return '';
    if (lang === 'en' || lang.startsWith('en-')) return fallback;

    const builtin = getBuiltinTranslation(lang, String(key || ''));
    if (builtin) return builtin;

    const cacheKey = lang + '|' + String(key || fallback);
    const hit = I18N_STATE.cache[cacheKey];
    if (hit) return hit;

    startTranslation(cacheKey, lang, fallback);
    return fallback;
}
