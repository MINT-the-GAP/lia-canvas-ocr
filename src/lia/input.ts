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
    ensureTexSyncBoot();
    (el as any).dataset.liaCanvasTex = '1';
}

function __liaSyncTexPreviewBorder(el: HTMLElement): void {
    if (!el || !(el as any).__liaTexPreviewBox) return;
    const box = (el as any).__liaTexPreviewBox as HTMLElement;
    let border = '';
    if (__liaHasQuizStateColor(el)) {
        try {
            const cs = getComputedStyle(el);
            border = cs.borderTopColor || cs.borderColor || cs.outlineColor || '';
        } catch (_) { }
        if (!__liaIsUsableCssColor(border)) border = '';
    }
    const current = box.style.getPropertyValue('--lia-tex-preview-border').trim();
    if (current === border) return;
    if (border) box.style.setProperty('--lia-tex-preview-border', border);
    else box.style.removeProperty('--lia-tex-preview-border');
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
        box.dataset.multiline = '0';
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

function __liaIsSerializedCalculationPreview(
    source: string,
    previewTex: string
): boolean {
    const value = String(source || '').trim();
    return (
        value.startsWith('[') &&
        previewTex.startsWith('\\begin{aligned}') &&
        previewTex.endsWith('\\end{aligned}')
    ) || (
        value.startsWith('{') && (
            (
                previewTex.startsWith('\\begin{array}') &&
                previewTex.endsWith('\\end{array}')
            ) || (
                previewTex.startsWith('\\begin{aligned}') &&
                previewTex.endsWith('\\end{aligned}')
            )
        )
    );
}

// ---------------------------------------------------------------------------
// Auto-size TeX widget
// ---------------------------------------------------------------------------

export function __liaAutoSizeTexWidgets(el: Element): void {
    if (!el) return;

    const box = (el as any).__liaTexPreviewBox as HTMLElement | null || null;
    const math = box ? box.querySelector('.lia-tex-preview-math') as HTMLElement | null : null;

    function getIntrinsicContentWidth(node: HTMLElement): number {
        try {
            // KaTeX's visible HTML tree keeps its natural inline width even
            // when the scroll container below is stretched to `width: 100%`.
            // Measuring that tree avoids feeding yesterday's assigned widget
            // width back into the next autosize pass.
            const rendered = node.querySelector('.katex-html, .katex') as HTMLElement | null;
            const renderedWidth = rendered?.getBoundingClientRect().width || 0;
            if (renderedWidth > 0) return renderedWidth;
        } catch (_) { }
        try {
            // The synchronous browser-test renderer and the text fallback do
            // not create KaTeX children. A DOM Range measures their glyphs,
            // not the allocated width of the 100%-wide container.
            if (node.childNodes.length && document.createRange) {
                const range = document.createRange();
                range.selectNodeContents(node);
                const width = range.getBoundingClientRect().width || 0;
                try { range.detach(); } catch (_) { }
                if (width > 0) return width;
            }
        } catch (_) { }
        try {
            return node.getBoundingClientRect().width || 0;
        } catch (_) { }
        return 0;
    }

    function applyWidth(px: number): void {
        // Keep the intrinsic target as the inline width. `max-width: 100%`
        // performs the responsive clamp without destroying that target, so a
        // widget shrunk by a narrow parent expands correctly when space returns.
        const w = Math.max(80, Math.ceil(px));
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
                const inner = getIntrinsicContentWidth(math);
                const hint = box.querySelector('.lia-tex-preview-hint') as HTMLElement | null;
                const hintW = hint ? (hint.getBoundingClientRect().width || 0) : 0;
                wanted = box.dataset.multiline === '1'
                    ? Math.max(inner, hintW) + 24
                    : inner + hintW + 32;
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

export function __liaRenderTexPreview(target: HTMLElement, tex: string): boolean {
    const src = String(tex || '').trim();
    target.innerHTML = '';
    const box = target.closest ? target.closest('.lia-tex-preview') : null;
    if (!src) {
        if (box instanceof HTMLElement) box.dataset.multiline = '0';
        return false;
    }
    const previewTex = formatTexForPreview(src);
    if (box instanceof HTMLElement) {
        box.dataset.multiline = __liaIsSerializedCalculationPreview(src, previewTex)
            ? '1'
            : '0';
    }
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

function __liaSyncMultilinePreviewPair(el: HTMLElement, multiline: boolean): void {
    try {
        document.querySelectorAll('.lia-canvas-pair').forEach(pair => {
            if (__liaFindInputBeforeNode(pair) !== el) return;
            if (multiline) pair.setAttribute('data-lia-preview-multiline', '1');
            else pair.removeAttribute('data-lia-preview-multiline');
        });
    } catch (_) { }
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
    box.dataset.multiline = '0';
    box.style.display = 'none';
    el.style.display = '';
    __liaSyncMultilinePreviewPair(el, false);
    __liaAutoSizeTexWidgets(el);
    try { el.focus(); if (typeof (el as any).select === 'function') (el as any).select(); } catch (_) { }
}

function __liaShowTexPreview(el: HTMLElement): void {
    if (!el || !(el as any).__liaTexPreviewBox) return;

    const box = (el as any).__liaTexPreviewBox as HTMLElement;
    const value = __liaReadFieldValue(el).trim();

    if (!value) {
        box.dataset.on = '0';
        box.dataset.multiline = '0';
        box.style.display = 'none';
        el.style.display = '';
        __liaSyncMultilinePreviewPair(el, false);
        return;
    }

    const math = box.querySelector('.lia-tex-preview-math') as HTMLElement | null;
    if (math) __liaRenderTexPreview(math, value);

    box.dataset.on = '1';
    box.style.display = box.dataset.multiline === '1' ? 'inline-grid' : 'inline-flex';
    el.style.display = 'none';
    __liaSyncMultilinePreviewPair(el, box.dataset.multiline === '1');
    __liaAutoSizeTexWidgets(el);
}

function __liaEnsureTexPreview(el: HTMLElement): HTMLElement | null {
    if (!el) return null;
    if ((el as any).__liaTexPreviewReady) return el;
    (el as any).__liaTexPreviewReady = true;
    __liaRegisterCanvasTexField(el);
    if (!(el as any).__liaTexPreviewBorderObserver) {
        const mo = new MutationObserver(() => {
            __liaSyncTexPreviewBorder(el);
            __liaSyncCanvasTexPreview(el);
        });
        mo.observe(el, {
            attributes: true,
            attributeFilter: ['class', 'style', 'aria-invalid', 'value'],
            characterData: true,
            childList: true,
            subtree: true
        });
        (el as any).__liaTexPreviewBorderObserver = mo;
    }
    __liaSyncTexPreviewBorder(el);

    const box = document.createElement('span');
        const editLabel = liaT('canvas.edit', 'Edit');
    box.className = 'lia-tex-preview';
    box.dataset.on = '0';
    box.dataset.multiline = '0';
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
    if (__liaReadFieldValue(el) === String(value)) {
        __liaRefreshTexPreviewNear(refEl);
        return true;
    }
    const ok = __liaApplyValue(el, value);
    if (!ok) return false;
    __liaRefreshTexPreviewNear(refEl);
    return true;
}

export function __liaInitTexPreviews(): void {
    ensureTexSyncBoot();
    document.querySelectorAll('.lia-canvas-pair').forEach(pair => {
        const field = __liaFindInputBeforeNode(pair);
        if (field) {
            __liaEnsureTexPreview(field as HTMLElement);
            __liaSyncTexPreviewBorder(field as HTMLElement);
        }
    });
}

// ---------------------------------------------------------------------------
// Event-driven refresh bridge boot (starts only when a canvas pair is present)
// ---------------------------------------------------------------------------

export function ensureTexSyncBoot(): void {
    if ((window as any).__LIA_CANVAS_TEX_SYNC_BOOT__) return;
    (window as any).__LIA_CANVAS_TEX_SYNC_BOOT__ = true;
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
