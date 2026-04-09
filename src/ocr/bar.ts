// OCR status bar: DOM creation, state rendering, user controls.

import { LIA } from '../index';
import { ensureCss } from '../canvas/theme';

export function ensureOcrBar(): any {
    const SHOW_BAR = (LIA.SHOW_BAR === true);

    ensureCss();

    if (LIA.bar && LIA.bar.el && LIA.bar.el.isConnected) {
        try {
            const el = LIA.bar.el;
            const overlayHost = document.body || document.documentElement;

            if (el.parentNode !== overlayHost) overlayHost.appendChild(el);

            el.style.display = SHOW_BAR ? '' : 'none';
            el.setAttribute('aria-hidden', SHOW_BAR ? 'false' : 'true');

            const lw = LIA.bar.loadEl;
            if (lw && lw.parentNode !== overlayHost) overlayHost.appendChild(lw);
        } catch (_) { }
        return LIA.bar;
    }

    const overlayHost = document.body || document.documentElement;

    // -------- LOADBOX (always created) --------
    const loadWrap = document.createElement('div');
    loadWrap.className = 'lia-ocr-loadwrap';
    loadWrap.dataset.on = '0';
    loadWrap.dataset.indet = '0';
    loadWrap.innerHTML = `
    <div class="lia-ocr-loadmsg">
      <span class="t">Loading OCR engine…</span>
      <span class="p">…</span>
    </div>
    <div class="lia-ocr-loadtrack"><div class="lia-ocr-loadfill"></div></div>
    <div class="lia-ocr-loaddetail">Download ~900&nbsp;MB (first time only, cached afterwards).</div>
    <div class="lia-ocr-loaderror" style="display:none">
      <span class="lia-ocr-loaderror-msg">Loading failed.</span>
      <button class="lia-ocr-btn lia-ocr-retry-btn" type="button">Try again</button>
    </div>
  `;
    overlayHost.appendChild(loadWrap);

    const loadFill = loadWrap.querySelector('.lia-ocr-loadfill') as HTMLElement | null;
    const loadTxt = loadWrap.querySelector('.lia-ocr-loadmsg .t') as HTMLElement | null;
    const loadPct = loadWrap.querySelector('.lia-ocr-loadmsg .p') as HTMLElement | null;
    const loadDetail = loadWrap.querySelector('.lia-ocr-loaddetail') as HTMLElement | null;
    const loadErrorEl = loadWrap.querySelector('.lia-ocr-loaderror') as HTMLElement | null;
    const retryBtn = loadWrap.querySelector('.lia-ocr-retry-btn') as HTMLButtonElement | null;

    if (retryBtn) {
        retryBtn.addEventListener('click', () => {
            if (LIA.ocr && LIA.ocr.ensureLoaded) LIA.ocr.ensureLoaded(true);
        });
    }

    // -------- STATE --------
    const state: Record<string, any> = {
        model: 'Xenova/texify2',
        backend: 'wasm',
        precision: 'fp32',
        loaded: false,
        phase: 'idle',
        status: 'idle',
        progress: null
    };

    const LS_KEY = '__LIA_TEX_OCR_PREC__';
    const LS_MODEL = '__LIA_TEX_OCR_MODEL__';

    try { const s = localStorage.getItem(LS_MODEL); if (s) state.model = s; } catch (_) { }
    try { const s = localStorage.getItem(LS_KEY); if (s) state.precision = s; } catch (_) { }

    // -------- BAR (only when SHOW_BAR) --------
    let bar: HTMLElement | null = null;
    let logEl: HTMLElement | null = null;
    let prog: HTMLElement | null = null;
    let fill: HTMLElement | null = null;
    let ptxt: HTMLElement | null = null;
    let sel: HTMLSelectElement | null = null;
    let selM: HTMLSelectElement | null = null;

    if (SHOW_BAR) {
        bar = document.createElement('div');
        bar.className = 'lia-ocrbar';
        bar.dataset.state = 'idle';
        bar.dataset.open = '0';

        bar.innerHTML = `
      <span class="lia-ocr-head">
        <span class="lia-ocr-dot"></span>
        <span class="lia-ocr-title">LaTeX-OCR</span>
      </span>

      <span class="lia-ocr-pills">
        <span class="lia-ocr-pill"><span class="k">Model</span>     <span class="v" data-k="model">—</span></span>
        <span class="lia-ocr-pill"><span class="k">Backend</span>   <span class="v" data-k="backend">—</span></span>
        <span class="lia-ocr-pill"><span class="k">Precision</span> <span class="v" data-k="precision">—</span></span>
        <span class="lia-ocr-pill"><span class="k">Loaded</span>    <span class="v" data-k="loaded">—</span></span>
        <span class="lia-ocr-pill"><span class="k">Phase</span>     <span class="v" data-k="phase">—</span></span>
        <span class="lia-ocr-pill"><span class="k">Status</span>    <span class="v" data-k="status">—</span></span>
      </span>

      <span class="lia-ocr-actions">
        <select class="lia-ocr-select" data-act="model" aria-label="Model">
          <option value="Xenova/texify2">Xenova/texify2</option>
          <option value="Xenova/trocr-small-handwritten">Xenova/trocr-small-handwritten</option>
        </select>

        <select class="lia-ocr-select" data-act="precision" aria-label="Precision">
          <option value="fp32">fp32</option>
          <option value="fp16">fp16</option>
          <option value="int8">int8</option>
        </select>

        <button class="lia-ocr-btn" type="button" data-act="load">Load/Reload</button>
        <button class="lia-ocr-btn" type="button" data-act="toggle">Log</button>
        <button class="lia-ocr-btn" type="button" data-act="copy">Copy</button>
      </span>

      <span class="lia-ocr-progress" data-on="0">
        <span class="lia-ocr-progbar"><span class="lia-ocr-progfill"></span></span>
        <span class="lia-ocr-progtxt">0%</span>
      </span>

      <pre class="lia-ocr-log"></pre>
    `;

        overlayHost.appendChild(bar);

        logEl = bar.querySelector('.lia-ocr-log') as HTMLElement;
        prog = bar.querySelector('.lia-ocr-progress') as HTMLElement;
        fill = bar.querySelector('.lia-ocr-progfill') as HTMLElement;
        ptxt = bar.querySelector('.lia-ocr-progtxt') as HTMLElement;
        sel = bar.querySelector('select[data-act="precision"]') as HTMLSelectElement | null;
        selM = bar.querySelector('select[data-act="model"]') as HTMLSelectElement | null;

        if (selM) selM.value = state.model;
        if (sel) sel.value = state.precision;
    }

    function setText(key: string, val: string): void {
        if (!bar) return;
        const el = bar.querySelector('[data-k="' + key + '"]');
        if (el) el.textContent = String(val);
    }

    function render(): void {
        if (bar) {
            bar.dataset.state = String(state.status || 'idle');
            setText('model', state.model || '—');
            setText('backend', state.backend || '—');
            setText('precision', state.precision || '—');
            setText('loaded', state.loaded ? 'yes' : 'no');
            setText('phase', state.phase || '—');
            setText('status', state.status || 'idle');

            if (prog && fill && ptxt) {
                if (state.progress === null || state.progress === undefined || !isFinite(state.progress)) {
                    prog.dataset.on = '0';
                } else {
                    const v = Math.max(0, Math.min(1, Number(state.progress)));
                    prog.dataset.on = '1';
                    fill.style.width = Math.round(v * 100) + '%';
                    ptxt.textContent = Math.round(v * 100) + '%';
                }
            }

            try {
                const h = Math.ceil(bar.getBoundingClientRect().height || bar.offsetHeight || 0);
                document.documentElement.style.setProperty('--lia-ocrbar-h', (h || 0) + 'px');
                document.documentElement.style.setProperty('--lia-ocrbar-gap', '8px');
            } catch (_) { }
        } else {
            try {
                document.documentElement.style.setProperty('--lia-ocrbar-h', '0px');
                document.documentElement.style.setProperty('--lia-ocrbar-gap', '0px');
            } catch (_) { }
        }

        if (loadFill && loadTxt && loadPct) {
            const status = String(state.status || 'idle');
            const phase = String(state.phase || 'idle');
            const isLoading =
                !state.loaded &&
                (status === 'loading' || phase === 'import' || phase === 'pipeline' || phase === 'download');

            const isError = status === 'error' && !state.loaded;

            if (loadErrorEl) loadErrorEl.style.display = isError ? '' : 'none';

            if (isError) {
                loadWrap.dataset.on = '1';
                loadWrap.dataset.indet = '0';
                if (loadTxt) loadTxt.textContent = 'Loading failed.';
                if (loadPct) loadPct.textContent = '';
                if (loadDetail) loadDetail.textContent = '';
                if (loadFill) loadFill.style.width = '0%';
            } else if (isLoading) {
                loadWrap.dataset.on = '1';

                if (phase === 'download') {
                    loadTxt.textContent = 'Loading OCR engine…';
                    if (loadDetail) loadDetail.innerHTML = 'This download only happens once and is cached afterwards.';
                } else if (phase === 'import') {
                    loadTxt.textContent = 'Loading OCR engine… (importing library)';
                    if (loadDetail) loadDetail.textContent = 'First start may take a moment.';
                } else if (phase === 'pipeline') {
                    loadTxt.textContent = 'Loading OCR engine… (initializing model)';
                    if (loadDetail) loadDetail.textContent = 'First start may take a moment.';
                } else {
                    loadTxt.textContent = 'Loading OCR engine…';
                    if (loadDetail) loadDetail.textContent = 'First start may take a moment.';
                }

                if (state.progress !== null && state.progress !== undefined && isFinite(state.progress)) {
                    const v = Math.max(0, Math.min(1, Number(state.progress)));
                    loadWrap.dataset.indet = '0';
                    loadFill.style.transform = 'translateX(0)';
                    loadFill.style.width = Math.round(v * 100) + '%';
                    loadPct.textContent = Math.round(v * 100) + '%';
                } else {
                    loadWrap.dataset.indet = '1';
                    loadFill.style.width = '35%';
                    loadPct.textContent = '…';
                }
            } else if (!isError) {
                loadWrap.dataset.on = '0';
                loadWrap.dataset.indet = '0';
                loadFill.style.transform = 'translateX(0)';
                loadFill.style.width = '0%';
                loadPct.textContent = '';
            }
        }
    }

    const LOG_MAX = 10;
    function log(line: string): void {
        if (!logEl) return;
        try {
            const t = new Date();
            const hh = String(t.getHours()).padStart(2, '0');
            const mm = String(t.getMinutes()).padStart(2, '0');
            const ss = String(t.getSeconds()).padStart(2, '0');
            const s = '[' + hh + ':' + mm + ':' + ss + '] ' + String(line);
            const cur = logEl.textContent ? logEl.textContent.split('\n') : [];
            cur.push(s);
            while (cur.length > LOG_MAX) cur.shift();
            logEl.textContent = cur.join('\n');
        } catch (_) { }
    }

    function set(patch: Record<string, any>): void {
        try {
            if (!patch) return;
            for (const k in patch) {
                if (Object.prototype.hasOwnProperty.call(patch, k)) state[k] = patch[k];
            }
            render();
        } catch (_) { }
    }

    if (bar) {
        bar.addEventListener('click', (e: MouseEvent) => {
            const btn = (e.target as Element)?.closest?.('button[data-act]') as HTMLElement | null;
            if (!btn) return;
            const act = btn.getAttribute('data-act');

            if (act === 'toggle') {
                bar!.dataset.open = (bar!.dataset.open === '1') ? '0' : '1';
                return;
            }

            if (act === 'copy') {
                const report = [
                    'LaTeX-OCR Status Report',
                    'Model: ' + (state.model || ''),
                    'Backend: ' + (state.backend || ''),
                    'Precision: ' + (state.precision || ''),
                    'Loaded: ' + (state.loaded ? 'yes' : 'no'),
                    'Phase: ' + (state.phase || ''),
                    'Status: ' + (state.status || ''),
                    'Progress: ' + (state.progress === null ? '—' : String(state.progress)),
                    '',
                    'Log:',
                    logEl?.textContent || ''
                ].join('\n');
                try { navigator.clipboard.writeText(report); log('Report copied to clipboard.'); }
                catch (_) { log('Copy failed (clipboard blocked).'); }
                return;
            }

            if (act === 'load') {
                if (LIA.ocr && LIA.ocr.ensureLoaded) LIA.ocr.ensureLoaded(true);
                return;
            }
        });

        if (sel) {
            sel.addEventListener('change', () => {
                const p = String(sel!.value || 'fp32');
                try { localStorage.setItem(LS_KEY, p); } catch (_) { }
                set({ precision: p });
                if (LIA.ocr && LIA.ocr.setPrecision) LIA.ocr.setPrecision(p);
            });
        }

        if (selM) {
            selM.addEventListener('change', () => {
                const m = String(selM!.value || state.model);
                try { localStorage.setItem(LS_MODEL, m); } catch (_) { }
                set({ model: m });
                if (LIA.ocr && LIA.ocr.setModel) LIA.ocr.setModel(m);
            });
        }
    }

    LIA.bar = { el: bar, loadEl: loadWrap, set, log, get: () => ({ ...state }) };
    render();
    if (SHOW_BAR) log('OCR-Bar ready.');
    return LIA.bar;
}
