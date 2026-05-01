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
};

const I18N_STATE: I18nState = (window as any).__LIA_CANVAS_I18N_STATE__ =
    (window as any).__LIA_CANVAS_I18N_STATE__ || {
        cache: {},
        pending: {},
        lang: normalizeLang(currentLiaLang())
    };

const BUILTIN_TRANSLATIONS: Record<string, Record<string, string>> = {
    de: {
        'ocr.title': 'LaTeX-OCR',
        'ocr.selectSubmit': 'Als Lösung senden',
        'ocr.runningOcr': 'OCR läuft...',
        'ocr.submitted': 'Gesendet',
        'ocr.ocrError': 'Fehler',
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
        'canvas.pen': 'Stift',
        'canvas.eraser': 'Radierer',
        'canvas.background': 'Hintergrund',
        'canvas.edit': 'Bearbeiten'
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

if (!(window as any).__LIA_CANVAS_I18N_LANG_WATCH__) {
    (window as any).__LIA_CANVAS_I18N_LANG_WATCH__ = true;
    setInterval(() => {
        const now = normalizeLang(currentLiaLang());
        if (now === I18N_STATE.lang) return;
        I18N_STATE.lang = now;
        document.dispatchEvent(new CustomEvent('lia:canvas-i18n-update', {
            detail: { lang: now, reason: 'lang-change' }
        }));
    }, 500);
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

function startTranslation(cacheKey: string, lang: string, sourceText: string): void {
    if (I18N_STATE.pending[cacheKey]) return;
    const normalizedSource = String(sourceText || '').replace(/&/g, 'and').replace(/…/g, '...');

    I18N_STATE.pending[cacheKey] = (async () => {
        const translated = await translateWithMyMemory(lang, normalizedSource);
        const clean = translated ? sanitizeTranslatedText(translated) : '';
        if (clean && clean !== sourceText) {
            I18N_STATE.cache[cacheKey] = clean;
            document.dispatchEvent(new CustomEvent('lia:canvas-i18n-update', {
                detail: { lang, key: cacheKey, translated: clean }
            }));
        }
    })().then(() => {
        delete I18N_STATE.pending[cacheKey];
    }, () => {
        delete I18N_STATE.pending[cacheKey];
    });
}

export function liaLang(): string {
    return normalizeLang(currentLiaLang());
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
