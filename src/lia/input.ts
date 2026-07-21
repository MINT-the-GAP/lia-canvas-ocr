// LiaScript input helpers: field value apply/read, TeX preview, input finder.

import { getRootWindow } from '../index';
import { liaT } from './i18n';
import { formatTexForPreview } from './tex-preview';

// ---------------------------------------------------------------------------
// Quiz state + border helpers
// ---------------------------------------------------------------------------

function __liaHasQuizStateColor(el: Element): boolean {
    try {
        if (!el || !el.classList) return false;
        if (el.classList.contains('is-success')) return true;
        if (el.classList.contains('is-failure')) return true;
        if (el.classList.contains('is-warning')) return true;
        if (el.classList.contains('is-partial')) return true;
        if (el.classList.contains('is-resolved')) return true;
        if (el.getAttribute && el.getAttribute('aria-invalid') === 'true') return true;
    } catch (_) { }
    return false;
}

function __liaIsUsableCssColor(v: string): boolean {
    const s = String(v || '').trim().toLowerCase();
    if (!s || s === 'transparent' || s === 'rgba(0, 0, 0, 0)' || s === 'rgba(0,0,0,0)') return false;
    return true;
}

export function __liaRegisterCanvasTexField(el: HTMLElement): void {
    if (!el) return;
    (el as any).dataset.liaCanvasTex = '1';
    const list: HTMLElement[] = (window as any).__LIA_CANVAS_TEX_FIELDS__ =
        (window as any).__LIA_CANVAS_TEX_FIELDS__ || [];
    if (list.indexOf(el) === -1) list.push(el);
}

function __liaSyncTexPreviewBorder(el: HTMLElement): void {
    if (!el || !(el as any).__liaTexPreviewBox) return;
    const box = (el as any).__liaTexPreviewBox as HTMLElement;
    box.style.removeProperty('--lia-tex-preview-border');
    if (!__liaHasQuizStateColor(el)) return;
    let border = '';
    try {
        const cs = getComputedStyle(el);
        border = cs.borderTopColor || cs.borderColor || cs.outlineColor || '';
    } catch (_) { }
    if (!__liaIsUsableCssColor(border)) return;
    box.style.setProperty('--lia-tex-preview-border', border);
}

export function __liaRefreshAllTexPreviewBorders(root?: Element | Document): void {
    const scope = (root && (root as any).querySelectorAll) ? root : document;
    (scope as Element).querySelectorAll('.lia-canvas-pair').forEach((pair: Element) => {
        const field = __liaFindInputBeforeNode(pair);
        if (field) __liaSyncTexPreviewBorder(field as HTMLElement);
    });
}

function __liaSyncCanvasTexPreview(el: HTMLElement): void {
    if (!el || !(el as any).__liaTexPreviewBox) return;
    const value = __liaReadFieldValue(el as Element);
    const focused = (document.activeElement === el);
    if ((el as any).__liaTexPreviewLastValue === value && (el as any).__liaTexPreviewLastFocused === focused) return;
    (el as any).__liaTexPreviewLastValue = value;
    (el as any).__liaTexPreviewLastFocused = focused;
    const box = (el as any).__liaTexPreviewBox as HTMLElement;
    const math = box.querySelector('.lia-tex-preview-math') as HTMLElement | null;
    if (math) __liaRenderTexPreview(math, value);
    if (focused) {
        box.dataset.on = '0';
        box.style.display = 'none';
        el.style.display = '';
        __liaAutoSizeTexWidgets(el);
    } else {
        __liaShowTexPreview(el);
    }
}

function __liaForceRefreshCanvasTexPreviews(root?: Element | Document): void {
    const scope = (root && (root as any).querySelectorAll) ? root : document;
    (scope as Element).querySelectorAll('.lia-canvas-pair').forEach((pair: Element) => {
        const field = __liaFindInputBeforeNode(pair);
        if (!field) return;
        __liaEnsureTexPreview(field as HTMLElement);
        __liaSyncTexPreviewBorder(field as HTMLElement);
        (field as any).__liaTexPreviewLastValue = null;
        (field as any).__liaTexPreviewLastFocused = null;
        __liaSyncCanvasTexPreview(field as HTMLElement);
        if (document.activeElement !== field) __liaShowTexPreview(field as HTMLElement);
    });
}

let __liaForceRefreshTimer = 0;
// Separate timers for the staggered freeze-refresh passes (0ms, 80ms, 200ms)
const __liaForceRefreshTimers: number[] = [0, 0, 0];

function __liaQueueForceRefreshCanvasTexPreviews(delay: number): void {
    clearTimeout(__liaForceRefreshTimer);
    __liaForceRefreshTimer = setTimeout(() => {
        __liaForceRefreshCanvasTexPreviews(document);
    }, Math.max(0, delay || 0)) as unknown as number;
}

function __liaScheduleStaggeredRefresh(delays: number[]): void {
    delays.forEach((delay, i) => {
        clearTimeout(__liaForceRefreshTimers[i]);
        __liaForceRefreshTimers[i] = setTimeout(() => {
            __liaForceRefreshCanvasTexPreviews(document);
        }, delay) as unknown as number;
    });
}

// ---------------------------------------------------------------------------
// Field value helpers
// ---------------------------------------------------------------------------

export function __liaApplyValue(el: Element, value: string): boolean {
    const v = String(value);
    try {
        if (el && (el as any).getAttribute && (el as any).getAttribute('contenteditable') === 'true') {
            (el as any).textContent = v;
            el.dispatchEvent(new Event('input', { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
            return true;
        }
        if (el && ('value' in el)) {
            (el as any).value = v;
            el.dispatchEvent(new Event('input', { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
            return true;
        }
    } catch (_) { }
    return false;
}

export function __liaReadFieldValue(el: Element | null): string {
    try {
        if (!el) return '';
        if ((el as any).getAttribute && (el as any).getAttribute('contenteditable') === 'true') {
            return String((el as any).textContent || '');
        }
        if ('value' in el) return String((el as any).value || '');
    } catch (_) { }
    return '';
}

// ---------------------------------------------------------------------------
// Auto-size TeX widget
// ---------------------------------------------------------------------------

export function __liaAutoSizeTexWidgets(el: Element): void {
    if (!el) return;

    const box = (el as any).__liaTexPreviewBox as HTMLElement | null || null;
    const math = box ? box.querySelector('.lia-tex-preview-math') as HTMLElement | null : null;

    function getAvailableWidth(node: Element | null): number {
        try {
            const parent = (node && (node as HTMLElement).parentElement) ? (node as HTMLElement).parentElement : null;
            if (!parent) return 900;
            const pr = parent.getBoundingClientRect();
            if (!pr || !pr.width) return 900;
            return Math.max(80, Math.floor(pr.width - 8));
        } catch (_) { }
        return 900;
    }

    function applyWidth(px: number): void {
        const avail = getAvailableWidth(box || el as HTMLElement);
        const w = Math.max(80, Math.min(Math.ceil(px), avail));
        try {
            (el as HTMLElement).style.width = w + 'px';
            (el as HTMLElement).style.maxWidth = '100%';
            (el as HTMLElement).style.boxSizing = 'border-box';
        } catch (_) { }
        if (box) {
            try {
                box.style.width = w + 'px';
                box.style.maxWidth = '100%';
                box.style.boxSizing = 'border-box';
            } catch (_) { }
        }
        if (math) {
            try {
                math.style.minWidth = '0';
                math.style.maxWidth = '100%';
            } catch (_) { }
        }
    }

    function measureAndApply(): void {
        try {
            let wanted = 140;
            if (box && math && box.dataset.on === '1') {
                const inner = math.scrollWidth || math.getBoundingClientRect().width || 0;
                const hint = box.querySelector('.lia-tex-preview-hint') as HTMLElement | null;
                const hintW = hint ? (hint.getBoundingClientRect().width || 0) : 0;
                wanted = inner + hintW + 32;
            } else {
                const raw = __liaReadFieldValue(el as Element);
                wanted = Math.max(140, raw.length * 0.62 * 16 + 28);
            }
            applyWidth(wanted);
        } catch (_) { }
    }

    requestAnimationFrame(measureAndApply);
}

// ---------------------------------------------------------------------------
// KaTeX loader
// ---------------------------------------------------------------------------

let __liaKatexLoadPromise: Promise<any> | null = null;

function __liaEnsureKatex(): Promise<any> {
    const ROOT_WIN = getRootWindow() as any;

    const candidates = [
        (window as any).katex,
        ROOT_WIN.katex,
        (window as any).KaTeX,
        ROOT_WIN.KaTeX
    ];

    for (let i = 0; i < candidates.length; i++) {
        const k = candidates[i];
        if (k && typeof k.render === 'function') return Promise.resolve(k);
    }

    if (__liaKatexLoadPromise) return __liaKatexLoadPromise;

    __liaKatexLoadPromise = (async () => {
        const ROOT_DOC = ROOT_WIN.document || document;

        if (!ROOT_DOC.getElementById('__lia_katex_css_v1')) {
            const link = ROOT_DOC.createElement('link');
            link.id = '__lia_katex_css_v1';
            link.rel = 'stylesheet';
            link.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css';
            (ROOT_DOC.head || ROOT_DOC.documentElement).appendChild(link);
        }

        const mod = await (new Function('u', 'return import(u)'))('https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.mjs');
        const katex = mod && (mod.default || mod);

        if (!katex || typeof katex.render !== 'function') {
            throw new Error('KaTeX render not available.');
        }

        try { if (!ROOT_WIN.katex) ROOT_WIN.katex = katex; } catch (_) { }
        try { if (!(window as any).katex) (window as any).katex = katex; } catch (_) { }

        return katex;
    })();

    return __liaKatexLoadPromise;
}

// ---------------------------------------------------------------------------
// TeX preview rendering
// ---------------------------------------------------------------------------

function __liaRenderTexPreview(target: HTMLElement, tex: string): boolean {
    const src = String(tex || '').trim();
    target.innerHTML = '';
    if (!src) return false;
    const previewTex = formatTexForPreview(src);

    const box = target.closest ? target.closest('.lia-tex-preview') : null;
    const el = box ? (box.previousElementSibling as HTMLElement | null) : null;

    const ROOT_WIN = getRootWindow() as any;
    const KATEX = (window as any).katex || ROOT_WIN.katex || null;

    function resizeLater(): void {
        if (!el) return;
        __liaAutoSizeTexWidgets(el);
    }

    try {
        if (KATEX && typeof KATEX.render === 'function') {
            KATEX.render(previewTex, target, { throwOnError: false, displayMode: false });
            resizeLater();
            return true;
        }
    } catch (_) { }

    __liaEnsureKatex()
        .then(katex => {
            if (!target || !target.isConnected) return;
            target.innerHTML = '';
            try {
                katex.render(previewTex, target, { throwOnError: false, displayMode: false });
            } catch (_) {
                target.textContent = src;
            }
            resizeLater();
        })
        .catch(() => {
            if (!target || !target.isConnected) return;
            target.textContent = src;
            resizeLater();
        });

    target.textContent = src;
    resizeLater();
    return false;
}

function __liaShowTexEditor(el: HTMLElement): void {
    if (!el || !(el as any).__liaTexPreviewBox) return;
    const body = document.body;
    if (body && (body.classList.contains('lia-snapshot-mode') || body.classList.contains('lia-course-frozen'))) {
        __liaShowTexPreview(el);
        return;
    }
    const box = (el as any).__liaTexPreviewBox as HTMLElement;
    box.dataset.on = '0';
    box.style.display = 'none';
    el.style.display = '';
    __liaAutoSizeTexWidgets(el);
    try { el.focus(); if (typeof (el as any).select === 'function') (el as any).select(); } catch (_) { }
}

function __liaShowTexPreview(el: HTMLElement): void {
    if (!el || !(el as any).__liaTexPreviewBox) return;

    const box = (el as any).__liaTexPreviewBox as HTMLElement;
    const value = __liaReadFieldValue(el).trim();

    if (!value) {
        box.dataset.on = '0';
        box.style.display = 'none';
        el.style.display = '';
        return;
    }

    const math = box.querySelector('.lia-tex-preview-math') as HTMLElement | null;
    if (math) __liaRenderTexPreview(math, value);

    box.dataset.on = '1';
    box.style.display = 'inline-flex';
    el.style.display = 'none';
    __liaAutoSizeTexWidgets(el);
}

function __liaEnsureTexPreview(el: HTMLElement): HTMLElement | null {
    if (!el) return null;
    if ((el as any).__liaTexPreviewReady) return el;
    (el as any).__liaTexPreviewReady = true;
    __liaRegisterCanvasTexField(el);
    if (!(el as any).__liaTexPreviewBorderObserver) {
        const mo = new MutationObserver(() => { __liaSyncTexPreviewBorder(el); });
        mo.observe(el, { attributes: true, attributeFilter: ['class', 'style', 'aria-invalid'] });
        (el as any).__liaTexPreviewBorderObserver = mo;
    }
    __liaSyncTexPreviewBorder(el);

    const box = document.createElement('span');
        const editLabel = liaT('canvas.edit', 'Edit');
    box.className = 'lia-tex-preview';
    box.dataset.on = '0';
    box.innerHTML = `
    <span class="lia-tex-preview-math"></span>
        <span class="lia-tex-preview-hint">${editLabel}</span>
  `;

    box.addEventListener('click', (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        __liaShowTexEditor(el);
    });

    el.insertAdjacentElement('afterend', box);
    (el as any).__liaTexPreviewBox = box;

    el.addEventListener('input', () => {
        __liaSyncCanvasTexPreview(el);
    });
    el.addEventListener('change', () => { __liaSyncCanvasTexPreview(el); });
    el.addEventListener('focus', () => { __liaSyncCanvasTexPreview(el); });

    el.addEventListener('blur', () => {
        setTimeout(() => __liaShowTexPreview(el), 0);
    });

    el.addEventListener('keydown', (e: Event) => {
        const ke = e as KeyboardEvent;
        const isTextarea =
            (el.tagName && el.tagName.toUpperCase() === 'TEXTAREA') ||
            ((el as any).getAttribute && (el as any).getAttribute('contenteditable') === 'true');

        if (ke.key === 'Escape') {
            ke.preventDefault();
            __liaShowTexPreview(el);
            return;
        }
        if (ke.key === 'Enter' && !isTextarea) {
            ke.preventDefault();
            __liaShowTexPreview(el);
        }
    });

    __liaShowTexPreview(el);
    __liaSyncCanvasTexPreview(el);
    return el;
}

// ---------------------------------------------------------------------------
// Input finder
// ---------------------------------------------------------------------------

function __liaFindInputBeforeNode(refEl: Element): Element | null {
    try {
        if (!refEl || refEl.nodeType !== 1) return null;

        function findIn(node: Element | null): Element | null {
            if (!node || node.nodeType !== 1) return null;
            const ce = node.querySelector && node.querySelector('[contenteditable="true"]');
            if (ce) return ce;
            const list = node.querySelectorAll ? node.querySelectorAll('input, textarea') : null;
            if (list && list.length) return list[list.length - 1];
            return null;
        }

        let n = refEl.previousElementSibling;
        while (n) {
            if ((n as any).matches && ((n as any).matches('input, textarea') || n.getAttribute('contenteditable') === 'true')) {
                return n;
            }
            const hit = findIn(n);
            if (hit) return hit;
            n = n.previousElementSibling;
        }

        let cur: Element = refEl;
        for (let depth = 0; depth < 10; depth++) {
            const p = (cur as HTMLElement).parentElement;
            if (!p) break;

            const kids = Array.from(p.children);
            const idx = kids.indexOf(cur);

            for (let i = idx - 1; i >= 0; i--) {
                const el = kids[i];
                if ((el as any).matches && ((el as any).matches('input, textarea') || el.getAttribute('contenteditable') === 'true')) {
                    return el;
                }
                const hit = findIn(el);
                if (hit) return hit;
            }

            cur = p;
        }
    } catch (_) { }
    return null;
}

function __liaRefreshTexPreviewNear(refEl: Element): void {
    function run(): boolean {
        const fresh = __liaFindInputBeforeNode(refEl);
        if (!fresh) return false;
        __liaEnsureTexPreview(fresh as HTMLElement);
        __liaShowTexPreview(fresh as HTMLElement);
        return true;
    }

    if (run()) return;

    const root = (refEl as HTMLElement).parentElement;
    if (!root) return;

    const observer = new MutationObserver(() => {
        if (run()) observer.disconnect();
    });
    observer.observe(root, { childList: true, subtree: true });

    // Safety timeout: disconnect if input never appears
    setTimeout(() => observer.disconnect(), 2000);
}

export function __liaFindAndSetInputBeforeNode(refEl: Element, value: string): boolean {
    const el = __liaFindInputBeforeNode(refEl);
    if (!el) return false;
    const ok = __liaApplyValue(el, value);
    if (!ok) return false;
    __liaRefreshTexPreviewNear(refEl);
    return true;
}

export function __liaInitTexPreviews(): void {
    document.querySelectorAll('.lia-canvas-pair').forEach(pair => {
        const field = __liaFindInputBeforeNode(pair);
        if (field) {
            __liaEnsureTexPreview(field as HTMLElement);
            __liaSyncTexPreviewBorder(field as HTMLElement);
        }
    });
}

// ---------------------------------------------------------------------------
// Polling + refresh bridge boot (runs once per module load)
// ---------------------------------------------------------------------------

if (!(window as any).__LIA_CANVAS_TEX_SYNC_BOOT__) {
    (window as any).__LIA_CANVAS_TEX_SYNC_BOOT__ = true;
    setInterval(() => {
        const list: HTMLElement[] = (window as any).__LIA_CANVAS_TEX_FIELDS__ || [];
        for (let i = list.length - 1; i >= 0; i--) {
            const el = list[i];
            if (!el || !el.isConnected) { list.splice(i, 1); continue; }
            __liaSyncCanvasTexPreview(el);
        }
    }, 250);
}

if (!(window as any).__LIA_CANVAS_TEX_REFRESH_BRIDGE__) {
    (window as any).__LIA_CANVAS_TEX_REFRESH_BRIDGE__ = true;
    const onFreezeRefresh = () => {
        __liaScheduleStaggeredRefresh([0, 80, 200]);
    };
    try { window.addEventListener('lia:freeze-tex-refresh', onFreezeRefresh as EventListener, true); } catch (_) { }
    try { document.addEventListener('lia:freeze-tex-refresh', onFreezeRefresh as EventListener, true); } catch (_) { }
    document.addEventListener('focusout', (e: Event) => {
        const t = e.target as Element | null;
        if (!t) return;
        if ((t as any).dataset && (t as any).dataset.liaCanvasTex === '1') {
            __liaQueueForceRefreshCanvasTexPreviews(0);
            return;
        }
        if ((t as any).matches && (t as any).matches('input, textarea, [contenteditable="true"]')) {
            __liaQueueForceRefreshCanvasTexPreviews(0);
        }
    }, true);
    document.addEventListener('change', (e: Event) => {
        const t = e.target as Element | null;
        if (!t) return;
        if (!(t as any).matches || !(t as any).matches('input, textarea, [contenteditable="true"]')) return;
        __liaQueueForceRefreshCanvasTexPreviews(0);
    }, true);
}
