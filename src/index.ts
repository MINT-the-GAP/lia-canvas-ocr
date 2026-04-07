// @ts-nocheck
(function(){



function getRootWindow(){
  let w = window;
  try { while (w.parent && w.parent !== w) w = w.parent; } catch(e){}
  return w;
}

const ROOT = getRootWindow();
const REGKEY = "__LIA_CANVAS_OCR_REG_V1__";
ROOT[REGKEY] = ROOT[REGKEY] || { inited: {} };

const DOC_ID = document.baseURI || location.href;
if (ROOT[REGKEY].inited[DOC_ID]) return;
ROOT[REGKEY].inited[DOC_ID] = true;


// ---------------------------------------------------------
// OCR-Bar + Engine: eigener Guard (läuft unabhängig vom Canvas-Guard)
// - Precision Dropdown (fp32/fp16/int8)
// - Load/Reload Button
// - Auto-Load beim Kursstart (warmup)
// ---------------------------------------------------------
window.__LIA_OCR_SHOW_BAR__ = false;   // <-- HIER umschalten (true/false)



if (!window.__LIA_OCR_BAR_BOOT__){
  window.__LIA_OCR_BAR_BOOT__ = true;

  // --------- kleine Theme-Akzent-Sync (nur für --canvas-accent) ----------
  function __ocrGetLiaAccent(){
    try{
      const existing = document.querySelector('.lia-btn');
      if (existing){
        const bg = getComputedStyle(existing).backgroundColor;
        if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') return bg;
      }
      const body = document.body || document.documentElement;
      const probe = document.createElement('button');
      probe.className = 'lia-btn';
      probe.type = 'button';
      probe.textContent = 'x';
      probe.style.position = 'absolute';
      probe.style.left = '-9999px';
      probe.style.top = '-9999px';
      probe.style.visibility = 'hidden';
      body.appendChild(probe);
      const bg = getComputedStyle(probe).backgroundColor;
      probe.remove();
      if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') return bg;
    }catch(_){}
    return null;
  }
  function __ocrSyncAccent(){
    try{
      const acc = __ocrGetLiaAccent();
      if (acc) document.documentElement.style.setProperty('--canvas-accent', acc);
    }catch(_){}
  }

  // ---------------- CSS Fallback (inkl. Select) ----------------
    function ensureOcrCss(){
      ensureCss();
    }

  // ---------------- OCR-Bar ----------------
  function ensureOcrBar(){
    const SHOW_BAR = (window.__LIA_OCR_SHOW_BAR__ !== false);

    ensureOcrCss();

    if (window.__LIA_OCR_BAR__ && window.__LIA_OCR_BAR__.el && window.__LIA_OCR_BAR__.el.isConnected){
      try{
          const el = window.__LIA_OCR_BAR__.el;
          const DOC = document;
          const overlayHost = DOC.body || DOC.documentElement;

          // OCR-Bar IMMER als Overlay außerhalb des Content halten
          if (el.parentNode !== overlayHost){
            overlayHost.appendChild(el);
          }

          // Sichtbarkeit der Bar
          el.style.display = SHOW_BAR ? '' : 'none';
          el.setAttribute('aria-hidden', SHOW_BAR ? 'false' : 'true');

          // Loadbox IMMER als Overlay außerhalb des Content halten
          const lw = window.__LIA_OCR_BAR__.loadEl;
          if (lw && lw.parentNode !== overlayHost){
            overlayHost.appendChild(lw);
          }
    
      }catch(_){}
      return window.__LIA_OCR_BAR__;
    }



    const DOC = document;

    // -------- BAR ERZEUGEN (das fehlte bei dir!) --------
    const bar = DOC.createElement('div');
    bar.className = 'lia-ocrbar';

    // Bar ggf. komplett ausblenden (Loadbox bleibt separat sichtbar)
    if (!SHOW_BAR){
      bar.style.display = 'none';
      bar.setAttribute('aria-hidden','true');
    }


    bar.dataset.state = 'idle';
    bar.dataset.open  = '0';

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

    // -------- EINHÄNGEN: ALS OVERLAY AUSSERHALB DES CONTENT --------
    const overlayHost = DOC.body || DOC.documentElement;
    overlayHost.appendChild(bar);


    // -------- LOADBOX --------
    const loadWrap = DOC.createElement('div');
    loadWrap.className = 'lia-ocr-loadwrap';
    loadWrap.dataset.on = '0';
    loadWrap.dataset.indet = '0';
    loadWrap.innerHTML = `
      <div class="lia-ocr-loadmsg">
        <span class="t">Schrifterkennungsmodul lädt noch…</span>
        <span class="p">…</span>
      </div>
      <div class="lia-ocr-loadtrack"><div class="lia-ocr-loadfill"></div></div>
      <div class="lia-ocr-loaddetail">Download von rund 900&nbsp;MB (nur beim ersten Mal, danach Cache).</div>
    `;

    overlayHost.appendChild(loadWrap);

    const loadFill   = loadWrap.querySelector('.lia-ocr-loadfill');
    const loadTxt    = loadWrap.querySelector('.lia-ocr-loadmsg .t');
    const loadPct    = loadWrap.querySelector('.lia-ocr-loadmsg .p');
    const loadDetail = loadWrap.querySelector('.lia-ocr-loaddetail');
    


    // -------- STATE + UI BINDINGS --------
    const state = {
      model: 'Xenova/texify2',
      backend: 'wasm',
      precision: 'fp32',
      loaded: false,
      phase: 'idle',
      status: 'idle',
      progress: null
    };

    const logEl = bar.querySelector('.lia-ocr-log');
    const prog  = bar.querySelector('.lia-ocr-progress');
    const fill  = bar.querySelector('.lia-ocr-progfill');
    const ptxt  = bar.querySelector('.lia-ocr-progtxt');
    const sel   = bar.querySelector('select[data-act="precision"]');
    const selM  = bar.querySelector('select[data-act="model"]');

    const LS_KEY   = '__LIA_TEX_OCR_PREC__';
    const LS_MODEL = '__LIA_TEX_OCR_MODEL__';

    try{
      const savedM = localStorage.getItem(LS_MODEL);
      if (savedM) state.model = String(savedM);
    }catch(_){}
    try{
      const saved = localStorage.getItem(LS_KEY);
      if (saved) state.precision = String(saved);
    }catch(_){}

    if (selM) selM.value = state.model;
    if (sel)  sel.value  = state.precision;

    function setText(key, val){
      const el = bar.querySelector('[data-k="' + key + '"]');
      if (el) el.textContent = String(val);
    }

    function render(){
      bar.dataset.state = String(state.status || 'idle');
      setText('model', state.model || '—');
      setText('backend', state.backend || '—');
      setText('precision', state.precision || '—');
      setText('loaded', state.loaded ? 'yes' : 'no');
      setText('phase', state.phase || '—');
      setText('status', state.status || 'idle');
    
      // bestehender Progress (in der Bar)
      if (state.progress === null || state.progress === undefined || !isFinite(state.progress)){
        prog.dataset.on = '0';
      }else{
        const v = Math.max(0, Math.min(1, Number(state.progress)));
        prog.dataset.on = '1';
        fill.style.width = Math.round(v * 100) + '%';
        ptxt.textContent = Math.round(v * 100) + '%';
      }
    


      // --- Bar-Höhe als CSS-Var (damit loadWrap sticky exakt drunter sitzt) ---
      try{
        if (!SHOW_BAR){
          document.documentElement.style.setProperty('--lia-ocrbar-h', '0px');
          document.documentElement.style.setProperty('--lia-ocrbar-gap', '0px');
        }else{
          const h = Math.ceil(bar.getBoundingClientRect().height || bar.offsetHeight || 0);
          document.documentElement.style.setProperty('--lia-ocrbar-h', (h || 0) + 'px');
          document.documentElement.style.setProperty('--lia-ocrbar-gap', '8px');
        }
      }catch(_){}


      // --- Loadbox (unterhalb, außerhalb) ---
      if (loadWrap && loadFill && loadTxt && loadPct){
        const status = String(state.status || 'idle');
        const phase  = String(state.phase  || 'idle');

        const isLoading =
          (!state.loaded) &&
          (status === 'loading' || phase === 'import' || phase === 'pipeline' || phase === 'download');

        if (isLoading){
          loadWrap.dataset.on = '1';

          if (phase === 'download'){
            loadTxt.textContent = 'Schrifterkennungsmodul lädt noch…';
            if (loadDetail) loadDetail.innerHTML = 'Dieser Download dauert nur beim ersten Mal so lange und ist danach im Cache.';
          }else if (phase === 'import'){
            loadTxt.textContent = 'Schrifterkennungsmodul lädt noch… (Bibliothek wird geladen)';
            if (loadDetail) loadDetail.textContent = 'Erster Start kann etwas dauern.';
          }else if (phase === 'pipeline'){
            loadTxt.textContent = 'Schrifterkennungsmodul lädt noch… (Modell wird initialisiert)';
            if (loadDetail) loadDetail.textContent = 'Erster Start kann etwas dauern.';
          }else{
            loadTxt.textContent = 'Schrifterkennungsmodul lädt noch…';
            if (loadDetail) loadDetail.textContent = 'Erster Start kann etwas dauern.';
          }

          if (state.progress !== null && state.progress !== undefined && isFinite(state.progress)){
            const v = Math.max(0, Math.min(1, Number(state.progress)));
            loadWrap.dataset.indet = '0';
            loadFill.style.transform = 'translateX(0)';
            loadFill.style.width = Math.round(v * 100) + '%';
            loadPct.textContent = Math.round(v * 100) + '%';
          }else{
            loadWrap.dataset.indet = '1';
            loadFill.style.width = '35%';
            loadPct.textContent = '…';
          }
        }else{
          loadWrap.dataset.on = '0';
          loadWrap.dataset.indet = '0';
          loadFill.style.transform = 'translateX(0)';
          loadFill.style.width = '0%';
          loadPct.textContent = '';
        }
      }

    }


    const LOG_MAX = 10;
    function log(line){
      try{
        const t = new Date();
        const hh = String(t.getHours()).padStart(2,'0');
        const mm = String(t.getMinutes()).padStart(2,'0');
        const ss = String(t.getSeconds()).padStart(2,'0');
        const s = '[' + hh + ':' + mm + ':' + ss + '] ' + String(line);
        const cur = logEl.textContent ? logEl.textContent.split('\n') : [];
        cur.push(s);
        while (cur.length > LOG_MAX) cur.shift();
        logEl.textContent = cur.join('\n');
      }catch(_){}
    }

    function set(patch){
      try{
        if (!patch) return;
        for (const k in patch){
          if (Object.prototype.hasOwnProperty.call(patch, k)) state[k] = patch[k];
        }
        render();
      }catch(_){}
    }

    bar.addEventListener('click', (e) => {
      const btn = e.target && e.target.closest ? e.target.closest('button[data-act]') : null;
      if (!btn) return;
      const act = btn.getAttribute('data-act');

      if (act === 'toggle'){
        bar.dataset.open = (bar.dataset.open === '1') ? '0' : '1';
        return;
      }

      if (act === 'copy'){
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
          logEl.textContent || ''
        ].join('\n');
        try{ navigator.clipboard.writeText(report); log('Report copied to clipboard.'); }
        catch(_){ log('Copy failed (clipboard blocked).'); }
        return;
      }

      if (act === 'load'){
        if (window.__LIA_TEX_OCR__ && window.__LIA_TEX_OCR__.ensureLoaded){
          window.__LIA_TEX_OCR__.ensureLoaded(true);
        }
        return;
      }
    });

    if (sel){
      sel.addEventListener('change', () => {
        const p = String(sel.value || 'fp32');
        try{ localStorage.setItem(LS_KEY, p); }catch(_){}
        set({ precision: p });
        if (window.__LIA_TEX_OCR__ && window.__LIA_TEX_OCR__.setPrecision){
          window.__LIA_TEX_OCR__.setPrecision(p);
        }
      });
    }

    if (selM){
      selM.addEventListener('change', () => {
        const m = String(selM.value || state.model);
        try{ localStorage.setItem(LS_MODEL, m); }catch(_){}
        set({ model: m });
        if (window.__LIA_TEX_OCR__ && window.__LIA_TEX_OCR__.setModel){
          window.__LIA_TEX_OCR__.setModel(m);
        }
      });
    }

    window.__LIA_OCR_BAR__ = { el: bar, loadEl: loadWrap, set, log, get: () => ({ ...state }) };
    render();
    log('OCR-Bar ready.');
    return window.__LIA_OCR_BAR__;
  }



  // ---------------- OCR Engine (Transformers.js pipeline) ----------------
  async function __ocrGetTransformers(){
    function getRootWindow(){
      let w = window;
      try { while (w.parent && w.parent !== w) w = w.parent; } catch(e){}
      return w;
    }
    const ROOT = getRootWindow();

    // Cache: schon geladen?
    if (ROOT.__LIA_TFJS__ && ROOT.__LIA_TFJS__.pipeline) return ROOT.__LIA_TFJS__;

    // Single-flight Import
    ROOT.__LIA_TFJS_IMPORT__ = ROOT.__LIA_TFJS_IMPORT__ || (async () => {

      // WICHTIG: dynamic import braucht ESM. Daher NUR ESM-URLs.
      const URLS = [
        'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2/+esm',
        'https://esm.sh/@xenova/transformers@2.17.2?bundle'
      ];

      let lastErr = null;

      for (const url of URLS){
        try{
          try{
            const b = window.__LIA_OCR_BAR__;
            if (b && b.log) b.log('Importing Transformers.js: ' + url);
          }catch(_){}

          const mod = await (new Function('u', 'return import(u)'))(url);

          const pipeline = mod.pipeline || (mod.default && mod.default.pipeline);
          const env      = mod.env      || (mod.default && mod.default.env);

          if (!pipeline || !env){
            throw new Error('Transformers.js ESM export missing (pipeline/env).');
          }

          const api = { pipeline, env, __mod: mod, __url: url };
          ROOT.__LIA_TFJS__ = api;
          return api;

        }catch(e){
          lastErr = e;
          try{
            const b = window.__LIA_OCR_BAR__;
            if (b && b.log) b.log('Import failed: ' + url + ' — ' + (e && e.message ? e.message : String(e)));
          }catch(_){}
        }
      }

      throw lastErr || new Error('Failed to load Transformers.js from all CDN URLs.');
    })();

    return await ROOT.__LIA_TFJS_IMPORT__;
  }






  function __ocrProgressTo01(p){
    try{
      if (p === null || p === undefined) return null;
      if (typeof p === 'number' && isFinite(p)) return Math.max(0, Math.min(1, p));
      const obj = p && typeof p === 'object' ? p : null;
      if (!obj) return null;

      // transformers.js liefert oft { loaded, total } oder { progress }
      if (isFinite(obj.progress)) return Math.max(0, Math.min(1, Number(obj.progress)));
      if (isFinite(obj.loaded) && isFinite(obj.total) && Number(obj.total) > 0){
        return Math.max(0, Math.min(1, Number(obj.loaded) / Number(obj.total)));
      }
    }catch(_){}
    return null;
  }

  function ensureOcrEngine(){
    if (window.__LIA_TEX_OCR__) return window.__LIA_TEX_OCR__;

    const bar = ensureOcrBar();

    const engine = {
      model: (bar.get().model || 'Xenova/trocr-small-handwritten'),
      task:  'image-to-text',
      precision: (bar.get().precision || 'fp32'),
      pipe: null,
      loading: null,

      setModel: async function(m){
        const next = String(m || this.model || 'Xenova/texify2');
        this.model = next;

        bar.set({ model: next, loaded:false, status:'idle', phase:'idle', progress:null });

        // Pipeline reset -> zwingt Reload
        this.pipe = null;
        this.loading = null;

        return this.ensureLoaded(true);
      },

      setPrecision: async function(p){
        const next = String(p || 'fp32');
        this.precision = next;
        bar.set({ precision: next, loaded:false, status:'idle', phase:'idle', progress:null });

        this.pipe = null;
        this.loading = null;

        return this.ensureLoaded(true);
      },

      ensureLoaded: async function(force){
        if (this.pipe && !force){
          return this.pipe;
        }
        if (this.loading) return this.loading;

        const prec = this.precision || 'fp32';

        // UI -> transformers dtype
        const dtypeMap = { fp32:'fp32', fp16:'fp16', int8:'q8' };
        const dtype = dtypeMap[prec] || 'fp32';

        // UI sofort aktualisieren (damit man überhaupt etwas sieht)
        bar.set({
          model: this.model,
          backend: 'wasm',
          precision: prec,
          status: 'loading',
          phase: 'import',
          loaded: false,
          progress: 0
        });
        bar.log('Loading model (' + prec + ') …');

        // Single-flight
        this.loading = (async () => {
          try{
            const t = await __ocrGetTransformers();
            const pipeline = t.pipeline;
            const env = t.env;

            // Remote-Modelle + Browser-Cache
            try{
              env.allowLocalModels  = false;
              env.allowRemoteModels = true;
              env.useBrowserCache   = true;

              env.backends = env.backends || {};
              env.backends.onnx = env.backends.onnx || {};
              env.backends.onnx.wasm = env.backends.onnx.wasm || {};
              // Wenn du später "ort-wasm" Pfadfehler siehst -> entkommentieren:
              // env.backends.onnx.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web/dist/';
            }catch(_){}

            bar.set({ phase: 'pipeline' });

            const pipe = await pipeline(this.task, this.model, {
              dtype, // <-- WICHTIG: nicht prec, sondern das gemappte dtype
              progress_callback: (p) => {
                const v = __ocrProgressTo01(p);
                if (v !== null) bar.set({ progress: v, phase: 'download' });
              }
            });

            this.pipe = pipe;
            bar.set({ status:'ready', phase:'ready', loaded:true, progress:null });
            bar.log('Model loaded (' + prec + ').');
            return pipe;

          }catch(err){
            bar.set({ status:'error', phase:'error', loaded:false, progress:null });
            bar.log('Load failed: ' + (err && err.message ? err.message : String(err)));
            throw err;
          }finally{
            this.loading = null;
          }
        })();

        return this.loading;
      },


          recognize: async function(image, opts){

            const o = (opts && typeof opts === 'object') ? opts : {};
            const silent = (o.__silent === true);

            const pipe = await this.ensureLoaded(false);
            bar.set({ status:'working', phase:'infer', progress:null });

            let revoke = null;

            async function toBlobFromCanvasLike(c){
              if (c && typeof c.convertToBlob === 'function'){
                return await c.convertToBlob({ type: 'image/png' });
              }
              if (c && typeof c.toBlob === 'function'){
                return await new Promise((resolve, reject) => {
                  c.toBlob((b) => b ? resolve(b) : reject(new Error('toBlob() returned null')), 'image/png');
                });
              }
              throw new Error('Canvas-like has no toBlob/convertToBlob');
            }

            function isImageDataLike(x){
              return x && typeof x === 'object'
                && typeof x.width === 'number'
                && typeof x.height === 'number'
                && x.data && typeof x.data.length === 'number';
            }

            function isBlobLike(x){
              // realm-safe: nicht instanceof Blob (iframe!)
              return x && typeof x === 'object'
                && typeof x.arrayBuffer === 'function'
                && typeof x.size === 'number'
                && typeof x.type === 'string';
            }

            async function normalizeToPipeInput(x){
              // 1) string bleibt string (URL / dataURL / blobURL)
              if (typeof x === 'string') return { input: x, revoke: null };

              // 2) Blob-like -> blobURL
              if (isBlobLike(x)){
                const url = URL.createObjectURL(x);
                return { input: url, revoke: () => URL.revokeObjectURL(url) };
              }

              // 3) ImageData-like -> Canvas -> blobURL
              if (isImageDataLike(x)){
                const c = document.createElement('canvas');
                c.width  = Math.max(1, Math.floor(x.width));
                c.height = Math.max(1, Math.floor(x.height));
                const cx = c.getContext('2d', { willReadFrequently: true });
                cx.putImageData(x, 0, 0);
                const blob = await toBlobFromCanvasLike(c);
                const url = URL.createObjectURL(blob);
                return { input: url, revoke: () => URL.revokeObjectURL(url) };
              }

              // 4) Canvas-like: bevorzugt dataURL (stabil)
              if (x && typeof x === 'object'){
                if (typeof x.toDataURL === 'function'){
                  const url = x.toDataURL('image/png');
                  return { input: url, revoke: null };
                }
                if (typeof x.toBlob === 'function' || typeof x.convertToBlob === 'function'){
                  const blob = await toBlobFromCanvasLike(x);
                  const url2 = URL.createObjectURL(blob);
                  return { input: url2, revoke: () => URL.revokeObjectURL(url2) };
                }
              }

              throw new Error('Unsupported input type for OCR: ' + (x === null ? 'null' : typeof x));
            }

            try{
              const norm = await normalizeToPipeInput(image);
              revoke = norm.revoke;

              const o = (opts && typeof opts === 'object') ? opts : {};
              const maxNew = (typeof o.max_new_tokens === 'number' && isFinite(o.max_new_tokens))
                ? Math.max(1, Math.floor(o.max_new_tokens))
                : 96;

              const out = await pipe(norm.input, {
                max_new_tokens: maxNew,
                do_sample: (o.do_sample === true),
                temperature: (typeof o.temperature === 'number' && isFinite(o.temperature)) ? o.temperature : 0
              });

              // robust: string | array | object
              let s = '';
              if (typeof out === 'string') s = out;
              else if (Array.isArray(out) && out.length){
                const r0 = out[0] || {};
                s = r0.generated_text || r0.text || r0.latex || '';
                if (!s) s = JSON.stringify(r0);
              }else if (out && typeof out === 'object'){
                s = out.generated_text || out.text || out.latex || '';
                if (!s) s = JSON.stringify(out);
              }else{
                s = String(out);
              }

              bar.set({ status:'ready', phase:'ready' });
              if (!silent) bar.log('Recognize done.');
              return s;

            }catch(err){
              bar.set({ status:'error', phase:'error' });
              if (!silent) bar.log('Recognize failed: ' + (err && err.message ? err.message : String(err)));
              throw err;

            }finally{
              try{ if (revoke) revoke(); }catch(_){}
            }
          },

        };


    window.__LIA_TEX_OCR__ = engine;
    return engine;
  }

  // ---- Boot: Bar + Engine + Auto-Load beim Kursstart ----
  ensureOcrBar();
  __ocrSyncAccent();
  setTimeout(__ocrSyncAccent, 0);

  const eng = ensureOcrEngine();

  // Auto-Load erzwingen, sobald der Kurs offen ist:
  // (kein "idle" – wirklich sofort; aber async, damit UI nicht blockiert)
  Promise.resolve()
  .then(() => eng.ensureLoaded(false))
  .catch(err => {
    try{
      const b = window.__LIA_OCR_BAR__;
      if (b && b.log) b.log('Auto-load failed: ' + (err && err.message ? err.message : String(err)));
    }catch(_){}
  });

}



  // ---------------------------------------------------------
  // Canvas: alter Guard bleibt wie er ist
  // ---------------------------------------------------------
  if (window.__liaDrawCanvasInit) return;
  window.__liaDrawCanvasInit = true;


window.__LIA_CANVAS_UID_COUNTER__ = window.__LIA_CANVAS_UID_COUNTER__ || 0;

function ensureMountUID(mount){
  if (!mount) return '';
  if (mount.dataset && mount.dataset.uid) return mount.dataset.uid;
  const uid = 'c' + (++window.__LIA_CANVAS_UID_COUNTER__);
  mount.dataset.uid = uid;
  return uid;
}

function __liaDispatchCanvasFreezeChange(detail){
  try{
    const payload = Object.assign(
      { ts: Date.now() },
      (detail && typeof detail === 'object') ? detail : {}
    );

    const target = (ROOT && typeof ROOT.dispatchEvent === 'function')
      ? ROOT
      : window;

    target.dispatchEvent(new CustomEvent('lia:canvas-change', {
      detail: payload
    }));
  }catch(_){}
}

  // =========================================================
  // CSS-Fallback: falls @style aus Import nicht greift → injizieren
  // (Design bleibt identisch, nur robust)
  // =========================================================
function ensureCss(){
  if (document.getElementById('__lia_canvas_ocr_css_v1')) return;

  const st = document.createElement('style');
  st.id = '__lia_canvas_ocr_css_v1';

  st.textContent = `
:root{
  --canvas-border: #000;
  --canvas-pen: #000;
  --canvas-accent: #0b5fff;
}

@media (prefers-color-scheme: dark){
  :root{
    --canvas-border: #fff;
    --canvas-pen: #fff;
  }
}

/* ---------------------------------------------------------
   Canvas Block: KEIN horizontal scroll!
   --------------------------------------------------------- */
.lia-draw-block{
  display: block;
  width: 100%;
  overflow-x: hidden;
  overflow-y: visible;
}

.lia-draw-wrap{
  width: min(520px, 100%);
  border: 2px solid var(--canvas-border);
  border-radius: 10px;
  box-sizing: border-box;
  position: relative;
  display: block;
  max-width: 100%;
}

canvas.lia-draw{
  width: 100%;
  height: 245px;
  display: block;
  background: transparent;
  touch-action: none;
  cursor: crosshair;
  border-radius: 8px;
}

canvas.lia-canvas-freeze-preview{
  width: 100%;
  height: auto;
  display: block;
  background: transparent;
  border-radius: 8px;
  cursor: default;
  touch-action: auto;
}

.lia-canvas-freeze-empty{
  padding: 12px 14px;
  font-weight: 700;
  opacity: 0.75;
}

.lia-toolstack{
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translate(0, -50%);
  z-index: 25;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.lia-tool-btn{
  width: 32px;
  height: 32px;
  padding: 0;
  border: 2px solid var(--canvas-border);
  border-radius: 999px;
  cursor: pointer;
  user-select: none;
  display: grid;
  place-items: center;
  background: transparent;
}

.lia-tool-btn:disabled{
  opacity: 0.35;
  cursor: not-allowed;
}

.lia-tool-btn svg{
  width: 22px;
  height: 22px;
  display: block;
  margin: 0;
  transform: translate(0,0);
}

.lia-tool-btn .ico-stroke{
  stroke: var(--canvas-border);
  fill: none;
}

.lia-tool-btn .ico-fill{
  fill: rgba(0,0,0,0);
}

.lia-tool-btn[data-active="1"]{
  outline: 2px solid var(--canvas-border);
  outline-offset: 2px;
}

.lia-canvas-anchor{
  display: inline-block;
}

.lia-canvas-mount{
  display: none;
  width: 100%;
  max-width: 100%;
  margin: 6px 0;
  flex: 0 0 100%;
  min-width: 0;
}

.lia-canvas-mount[data-open="1"]{
  display: block;
}

.lia-canvas-launch{
  width: 32px;
  height: 32px;
  padding: 0;
  border-radius: 999px;
  background: transparent;
  border: 2px solid var(--canvas-accent);
  cursor: pointer;
  user-select: none;
  touch-action: manipulation;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  vertical-align: middle;
  line-height: 0;
  margin-right: 6px;
}

.lia-canvas-launch:hover{
  filter: brightness(1.05);
}

.lia-canvas-launch svg{
  width: 18px;
  height: 18px;
  display: block;
}

.lia-canvas-launch .launch-stroke{
  stroke: var(--canvas-accent);
  fill: none;
  stroke-width: 2.4;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.lia-tool-menu{
  position: absolute;
  left: 44px;
  top: 10px;
  z-index: 30;
  padding: 10px;
  border: 2px solid var(--canvas-border);
  border-radius: 12px;
  background: rgba(0,0,0,0.15);
  backdrop-filter: blur(6px);
  display: none;
  gap: 10px;
}

.lia-tool-menu[data-open="1"]{
  display: grid;
  align-items: start;
  row-gap: 10px;
}

.lia-color-grid{
  display: grid;
  grid-template-columns: repeat(9, 22px);
  gap: 10px;
  align-items: center;
}

.lia-color-item{
  width: 22px;
  height: 22px;
  border-radius: 999px;
  cursor: pointer;
  user-select: none;
  border: 2px solid var(--canvas-border);
  background: transparent;
  box-sizing: border-box;
}

.lia-color-item:hover{
  transform: scale(1.06);
}

.lia-color-item[data-active="1"]{
  outline: 2px solid var(--canvas-border);
  outline-offset: 2px;
}

.lia-tool-heading{
  font-size: 1.5rem;
  font-weight: 750;
  line-height: 1.1;
  padding-left: 2px;
}

.lia-heading-row{
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.lia-heading-row .lia-tool-heading{
  padding-left: 2px;
}

.lia-menu-icon-btn{
  width: 28px;
  height: 28px;
  border-radius: 999px;
  border: 2px solid var(--canvas-border);
  background: transparent;
  display: grid;
  place-items: center;
  cursor: pointer;
  user-select: none;
  padding: 0;
}

.lia-menu-icon-btn:hover{
  filter: brightness(1.08);
}

.lia-menu-icon-btn svg{
  width: 16px;
  height: 16px;
  display: block;
  margin: 0;
}

.lia-menu-icon-btn .ico-stroke{
  stroke: var(--canvas-border);
  fill: none;
}

.lia-menu-icon-btn .ico-fill{
  fill: rgba(0,0,0,0);
}

.lia-row{
  display: flex;
  align-items: center;
  gap: 10px;
}

.lia-preview{
  width: 34px;
  height: 22px;
  border-radius: 10px;
  border: 2px solid var(--canvas-border);
  box-sizing: border-box;
  display: grid;
  place-items: center;
}

.lia-preview-line{
  width: 22px;
  border-radius: 999px;
  background: var(--canvas-border);
  height: 3px;
}

.lia-slider{
  width: 180px;
}

.lia-bg-tiles{
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  align-items: stretch;
}

.lia-bg-tile{
  height: 34px;
  border-radius: 12px;
  border: 2px solid var(--canvas-border);
  background: transparent;
  cursor: pointer;
  user-select: none;
  padding: 0;
}

.lia-bg-tile:hover{
  filter: brightness(1.08);
}

.lia-bg-tile[data-active="1"]{
  outline: 2px solid var(--canvas-border);
  outline-offset: 2px;
}

.lia-resize-corner{
  position: absolute;
  bottom: 0;
  width: 18px;
  height: 18px;
  z-index: 50;
  background: transparent;
  border: 0;
  padding: 0;
  margin: 0;
  user-select: none;
  touch-action: none;
  opacity: 0;
}

.lia-resize-corner[data-corner="br"]{ right: 0; cursor: nwse-resize; }
.lia-resize-corner[data-corner="bl"]{ left: 0; cursor: nesw-resize; }

.lia-rect-action{
  position: absolute;
  z-index: 60;
  display: none;
  right: auto;
  bottom: auto;
  padding: 6px 9px;
  border-radius: 999px;
  border: 2px solid var(--canvas-accent);
  background: var(--canvas-accent);
  color: #fff;
  font-weight: 800;
  font-size: 0.75em;
  cursor: pointer;
  user-select: none;
  line-height: 1;
  white-space: nowrap;
}

.lia-rect-action:active{
  transform: translateY(1px);
}

.lia-rect-close{
  position: absolute;
  z-index: 61;
  display: none;
  width: 24px;
  height: 24px;
  padding: 0;
  border-radius: 999px;
  border: 2px solid var(--canvas-accent);
  background: transparent;
  cursor: pointer;
  user-select: none;
  line-height: 0;
}

.lia-rect-close svg{
  width: 14px;
  height: 14px;
  display: block;
  margin: auto;
}

.lia-rect-close .x{
  stroke: var(--canvas-accent);
  stroke-width: 2.4;
  stroke-linecap: round;
}

.lia-rect-close:hover{
  background: var(--canvas-accent);
}

.lia-rect-close:hover .x{
  stroke: #fff;
}

.lia-rect-close:active{
  transform: translateY(1px);
}

.lia-eraser-ring{
  position: absolute;
  left: 0;
  top: 0;
  width: 12px;
  height: 12px;
  border-radius: 999px;
  box-sizing: border-box;
  border: 2px solid var(--canvas-accent);
  background: transparent;
  box-shadow: 0 0 0 1px var(--canvas-border);
  pointer-events: none;
  display: none;
  z-index: 58;
  transform: translate(-50%, -50%);
}

.lia-eraser-ring[data-on="1"]{
  display: block;
}

/* OCR */

.lia-ocrbar{
  position: fixed;
  left: 50%;
  transform: translateX(-50%);
  top: 10px;
  z-index: 10000;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  width: min(1100px, calc(100vw - 20px));
  max-width: calc(100vw - 20px);
  padding: 10px 12px;
  margin: 0;
  border: 2px solid var(--canvas-border);
  border-radius: 14px;
  background: rgba(0,0,0,0.07);
  backdrop-filter: blur(6px);
  box-sizing: border-box;
  flex: 0 0 100%;
  align-self: stretch;
}

@media (prefers-color-scheme: dark){
  .lia-ocrbar{
    background: rgba(255,255,255,0.08);
  }
}

.lia-ocr-head{
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin-right: 6px;
}

.lia-ocr-title{
  font-weight: 850;
  letter-spacing: 0.2px;
  line-height: 1;
}

.lia-ocr-dot{
  width: 10px;
  height: 10px;
  border-radius: 999px;
  border: 2px solid var(--canvas-border);
  background: transparent;
  box-sizing: border-box;
}

.lia-ocrbar[data-state="ready"] .lia-ocr-dot,
.lia-ocrbar[data-state="working"] .lia-ocr-dot{
  border-color: var(--canvas-accent);
  background: var(--canvas-accent);
}

.lia-ocrbar[data-state="loading"] .lia-ocr-dot{
  border-color: var(--canvas-accent);
  border-style: dashed;
}

.lia-ocrbar[data-state="error"] .lia-ocr-dot{
  border-color: #c00000;
  background: #c00000;
}

.lia-ocr-pills{
  display: inline-flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  min-width: 0;
}

.lia-ocr-pill{
  display: inline-flex;
  align-items: baseline;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 999px;
  border: 2px solid var(--canvas-border);
  background: transparent;
  max-width: 100%;
}

.lia-ocr-pill .k{
  opacity: 0.75;
  font-weight: 750;
  white-space: nowrap;
}

.lia-ocr-pill .v{
  font-weight: 800;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: min(52vw, 520px);
}

.lia-ocr-actions{
  display: inline-flex;
  gap: 8px;
  align-items: center;
  margin-left: auto;
}

.lia-ocr-btn,
.lia-ocr-select{
  border: 2px solid var(--canvas-accent);
  background: transparent;
  color: var(--canvas-accent);
  border-radius: 999px;
  padding: 6px 10px;
  font-weight: 850;
  cursor: pointer;
  user-select: none;
  line-height: 1;
}

.lia-ocr-select{
  appearance: none;
}

.lia-ocr-btn:active,
.lia-ocr-select:active{
  transform: translateY(1px);
}

.lia-ocr-progress{
  display: none;
  align-items: center;
  gap: 8px;
  width: min(420px, 100%);
}

.lia-ocr-progress[data-on="1"]{
  display: inline-flex;
}

.lia-ocr-progbar{
  height: 10px;
  width: 100%;
  border-radius: 999px;
  border: 2px solid var(--canvas-border);
  overflow: hidden;
  box-sizing: border-box;
  background: transparent;
}

.lia-ocr-progfill{
  height: 100%;
  width: 0%;
  background: var(--canvas-accent);
}

.lia-ocr-progtxt{
  font-weight: 850;
  min-width: 44px;
  text-align: right;
}

.lia-ocr-log{
  display: none;
  width: 100%;
  margin: 6px 0 0 0;
  padding: 10px 12px;
  border-radius: 12px;
  border: 2px solid var(--canvas-border);
  background: transparent;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
  font-size: 0.92em;
  line-height: 1.25;
  white-space: pre-wrap;
  box-sizing: border-box;
}

.lia-ocrbar[data-open="1"] .lia-ocr-log{
  display: block;
}

.lia-tool-btn .ico-accent{
  stroke: var(--canvas-accent);
  fill: none;
}

.lia-tool-btn .ico-accent-fill{
  fill: var(--canvas-accent);
}

.lia-ocr-loadwrap{
  position: fixed;
  left: 50%;
  transform: translateX(-50%);
  top: calc(10px + var(--lia-ocrbar-h, 0px) + var(--lia-ocrbar-gap, 0px));
  z-index: 10001;
  display: none;
  width: min(820px, calc(100vw - 20px));
  max-width: calc(100vw - 20px);
  margin: 0;
  padding: 10px 12px;
  border: 2px solid var(--canvas-border);
  border-radius: 14px;
  background: rgba(0,0,0,0.05);
  backdrop-filter: blur(6px);
  box-sizing: border-box;
  pointer-events: none;
}

@media (prefers-color-scheme: dark){
  .lia-ocr-loadwrap{
    background: rgba(255,255,255,0.06);
  }
}

.lia-ocr-loadwrap[data-on="1"]{
  display: block;
}

.lia-ocr-loadmsg{
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  font-weight: 850;
}

.lia-ocr-loadmsg .t{ font-weight: 850; }
.lia-ocr-loadmsg .p{ font-weight: 900; min-width: 3.5em; text-align: right; }

.lia-ocr-loaddetail{
  margin-top: 6px;
  opacity: .78;
  font-weight: 700;
  font-size: 0.95em;
}

.lia-ocr-loadtrack{
  margin-top: 8px;
  height: 10px;
  width: 100%;
  border-radius: 999px;
  border: 2px solid var(--canvas-border);
  overflow: hidden;
  box-sizing: border-box;
  background: transparent;
}

.lia-ocr-loadfill{
  height: 100%;
  width: 0%;
  background: var(--canvas-accent);
}

.lia-ocr-loadwrap[data-indet="1"] .lia-ocr-loadfill{
  width: 35%;
  animation: lia_ocr_indet 1.1s linear infinite;
}

@keyframes lia_ocr_indet{
  0%{ transform: translateX(-120%); }
  100%{ transform: translateX(320%); }
}

.lia-rect-progress{
  position: absolute;
  z-index: 59;
  display: none;
  left: 0;
  top: 0;
  width: 180px;
  padding: 4px 8px;
  border-radius: 999px;
  border: 2px solid var(--canvas-border);
  background: rgba(0,0,0,0.10);
  backdrop-filter: blur(6px);
  box-sizing: border-box;
  align-items: center;
  gap: 8px;
}

@media (prefers-color-scheme: dark){
  .lia-rect-progress{
    background: rgba(255,255,255,0.10);
  }
}

.lia-rect-progress[data-on="1"]{
  display: flex;
}

.lia-rect-progbar{
  flex: 1 1 auto;
  height: 8px;
  border-radius: 999px;
  border: 2px solid var(--canvas-border);
  overflow: hidden;
  box-sizing: border-box;
  background: transparent;
}

.lia-rect-progfill{
  height: 100%;
  width: 0%;
  background: var(--canvas-accent);
}

.lia-rect-progtxt{
  font-weight: 850;
  font-size: 0.8em;
  min-width: 3.2em;
  text-align: right;
}

.lia-tex-preview{
  display: none;
  align-items: center;
  gap: 8px;
  vertical-align: middle;
  min-height: 2.1em;
  max-width: 100%;
  width: fit-content;
  padding: 4px 10px;
  border: 2px solid var(--canvas-accent);
  border-radius: 999px;
  background: transparent;
  cursor: text;
  user-select: none;
  box-sizing: border-box;
}

.lia-tex-preview[data-on="1"]{
  display: inline-flex;
}

.lia-tex-preview-math{
  min-width: 0;
  overflow: visible;
  white-space: nowrap;
  flex: 0 0 auto;
}

.lia-tex-preview-hint{
  font-size: 0.78em;
  font-weight: 800;
  opacity: 0.7;
  white-space: nowrap;
}
  `;

  (document.head || document.documentElement).appendChild(st);
}






  // =========================================================
  // Lia Input Helper: setze das Feld direkt VOR dem @canvas-Anchor
  // =========================================================
function __liaApplyValue(el, value){
  const v = String(value);

  try{
    if (el && el.getAttribute && el.getAttribute('contenteditable') === 'true'){
      el.textContent = v;
      el.dispatchEvent(new Event('input',  { bubbles:true }));
      el.dispatchEvent(new Event('change', { bubbles:true }));
      return true;
    }

    if (el && ('value' in el)){
      el.value = v;
      el.dispatchEvent(new Event('input',  { bubbles:true }));
      el.dispatchEvent(new Event('change', { bubbles:true }));
      return true;
    }
  }catch(_){}
  return false;
}

function __liaReadFieldValue(el){
  try{
    if (!el) return '';
    if (el.getAttribute && el.getAttribute('contenteditable') === 'true'){
      return String(el.textContent || '');
    }
    if ('value' in el){
      return String(el.value || '');
    }
  }catch(_){}
  return '';
}


function __liaAutoSizeTexWidgets(el){
  if (!el) return;

  const box = el.__liaTexPreviewBox || null;
  const math = box ? box.querySelector('.lia-tex-preview-math') : null;

  function getAvailableWidth(node){
    try{
      const parent = (node && node.parentElement) ? node.parentElement : null;
      if (!parent) return 900;

      const pr = parent.getBoundingClientRect();
      if (!pr || !pr.width) return 900;

      return Math.max(80, Math.floor(pr.width - 8));
    }catch(_){}
    return 900;
  }

  function applyWidth(px){
    const avail = getAvailableWidth(box || el);
    const w = Math.max(80, Math.min(Math.ceil(px), avail));

    try{
      el.style.width = w + 'px';
      el.style.maxWidth = '100%';
      el.style.boxSizing = 'border-box';
    }catch(_){}

    if (box){
      try{
        box.style.width = w + 'px';
        box.style.maxWidth = '100%';
        box.style.boxSizing = 'border-box';
      }catch(_){}
    }

    if (math){
      try{
        math.style.minWidth = '0';
        math.style.maxWidth = '100%';
      }catch(_){}
    }
  }

  function measureAndApply(){
    try{
      let wanted = 140;

      if (box && math && box.dataset.on === '1'){
        const inner = math.scrollWidth || math.getBoundingClientRect().width || 0;
        const hint = box.querySelector('.lia-tex-preview-hint');
        const hintW = hint ? (hint.getBoundingClientRect().width || 0) : 0;

        wanted = inner + hintW + 32;
      }else{
        const raw = __liaReadFieldValue(el);
        wanted = Math.max(140, raw.length * 0.62 * 16 + 28);
      }

      applyWidth(wanted);
    }catch(_){}
  }

  requestAnimationFrame(measureAndApply);
  setTimeout(measureAndApply, 0);
  setTimeout(measureAndApply, 60);
}



var __liaKatexLoadPromise = null;

function __liaEnsureKatex(){
  const ROOT_WIN = getRootWindow();

  const candidates = [
    window.katex,
    ROOT_WIN.katex,
    window.KaTeX,
    ROOT_WIN.KaTeX
  ];

  for (let i = 0; i < candidates.length; i++){
    const k = candidates[i];
    if (k && typeof k.render === 'function'){
      return Promise.resolve(k);
    }
  }

  if (__liaKatexLoadPromise){
    return __liaKatexLoadPromise;
  }

  __liaKatexLoadPromise = (async function(){
    const ROOT_DOC = ROOT_WIN.document || document;

    if (!ROOT_DOC.getElementById('__lia_katex_css_v1')){
      const link = ROOT_DOC.createElement('link');
      link.id = '__lia_katex_css_v1';
      link.rel = 'stylesheet';
      link.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css';
      (ROOT_DOC.head || ROOT_DOC.documentElement).appendChild(link);
    }

    const mod = await (new Function('u', 'return import(u)'))('https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.mjs');
    const katex = mod && (mod.default || mod);

    if (!katex || typeof katex.render !== 'function'){
      throw new Error('KaTeX render not available.');
    }

    try{
      if (!ROOT_WIN.katex) ROOT_WIN.katex = katex;
    }catch(_){}

    try{
      if (!window.katex) window.katex = katex;
    }catch(_){}

    return katex;
  })();

  return __liaKatexLoadPromise;
}

function __liaRenderTexPreview(target, tex){
  const src = String(tex || '').trim();
  target.innerHTML = '';
  if (!src) return false;

  const box = target.closest ? target.closest('.lia-tex-preview') : null;
  const el = box ? (function(){
    const prev = box.previousElementSibling;
    return prev || null;
  })() : null;

  const ROOT_WIN = getRootWindow();
  const KATEX = window.katex || ROOT_WIN.katex || null;

  function resizeLater(){
    if (!el) return;
    __liaAutoSizeTexWidgets(el);
  }

  try{
    if (KATEX && typeof KATEX.render === 'function'){
      KATEX.render(src, target, {
        throwOnError: false,
        displayMode: false
      });
      resizeLater();
      return true;
    }
  }catch(_){}

  __liaEnsureKatex()
    .then(function(katex){
      if (!target || !target.isConnected) return;
      target.innerHTML = '';
      try{
        katex.render(src, target, {
          throwOnError: false,
          displayMode: false
        });
      }catch(_){
        target.textContent = src;
      }
      resizeLater();
    })
    .catch(function(){
      if (!target || !target.isConnected) return;
      target.textContent = src;
      resizeLater();
    });

  target.textContent = src;
  resizeLater();
  return false;
}

function __liaShowTexEditor(el){
  if (!el || !el.__liaTexPreviewBox) return;

  el.__liaTexPreviewBox.dataset.on = '0';
  el.__liaTexPreviewBox.style.display = 'none';
  el.style.display = '';
  __liaAutoSizeTexWidgets(el);

  try{
    el.focus();
    if (typeof el.select === 'function') el.select();
  }catch(_){}
}

function __liaShowTexPreview(el){
  if (!el || !el.__liaTexPreviewBox) return;

  const value = __liaReadFieldValue(el).trim();

  if (!value){
    el.__liaTexPreviewBox.dataset.on = '0';
    el.__liaTexPreviewBox.style.display = 'none';
    el.style.display = '';
    return;
  }

  const math = el.__liaTexPreviewBox.querySelector('.lia-tex-preview-math');
  __liaRenderTexPreview(math, value);

  el.__liaTexPreviewBox.dataset.on = '1';
  el.__liaTexPreviewBox.style.display = 'inline-flex';
  el.style.display = 'none';  
  __liaAutoSizeTexWidgets(el);
}

function __liaEnsureTexPreview(el){
  if (!el) return null;
  if (el.__liaTexPreviewReady) return el;

  el.__liaTexPreviewReady = true;

  const box = document.createElement('span');
  box.className = 'lia-tex-preview';
  box.dataset.on = '0';
  box.innerHTML = `
    <span class="lia-tex-preview-math"></span>
    <span class="lia-tex-preview-hint">Bearbeiten</span>
  `;

  box.addEventListener('click', function(e){
    e.preventDefault();
    e.stopPropagation();
    __liaShowTexEditor(el);
  });

  el.insertAdjacentElement('afterend', box);
  el.__liaTexPreviewBox = box;

  el.addEventListener('input', function(){
    const math = box.querySelector('.lia-tex-preview-math');
    __liaRenderTexPreview(math, __liaReadFieldValue(el));
  });

  el.addEventListener('blur', function(){
    setTimeout(function(){
      __liaShowTexPreview(el);
    }, 0);
  });

  el.addEventListener('keydown', function(e){
    const isTextarea =
      (el.tagName && el.tagName.toUpperCase() === 'TEXTAREA') ||
      (el.getAttribute && el.getAttribute('contenteditable') === 'true');

    if (e.key === 'Escape'){
      e.preventDefault();
      __liaShowTexPreview(el);
      return;
    }

    if (e.key === 'Enter' && !isTextarea){
      e.preventDefault();
      __liaShowTexPreview(el);
    }
  });

  __liaShowTexPreview(el);  
  __liaAutoSizeTexWidgets(el);
  return el;
}

function __liaFindInputBeforeNode(refEl){
  try{
    if (!refEl || refEl.nodeType !== 1) return null;

    function findIn(node){
      if (!node || node.nodeType !== 1) return null;

      const ce = node.querySelector && node.querySelector('[contenteditable="true"]');
      if (ce) return ce;

      const list = node.querySelectorAll ? node.querySelectorAll('input, textarea') : null;
      if (list && list.length) return list[list.length - 1];

      return null;
    }

    let n = refEl.previousElementSibling;
    while (n){
      if (n.matches && (n.matches('input, textarea') || n.getAttribute('contenteditable') === 'true')){
        return n;
      }
      const hit = findIn(n);
      if (hit) return hit;
      n = n.previousElementSibling;
    }

    let cur = refEl;
    for (let depth = 0; depth < 10; depth++){
      const p = cur.parentElement;
      if (!p) break;

      const kids = Array.from(p.children);
      const idx  = kids.indexOf(cur);

      for (let i = idx - 1; i >= 0; i--){
        const el = kids[i];

        if (el.matches && (el.matches('input, textarea') || el.getAttribute('contenteditable') === 'true')){
          return el;
        }
        const hit = findIn(el);
        if (hit) return hit;
      }

      cur = p;
    }
  }catch(_){}
  return null;
}


function __liaRefreshTexPreviewNear(refEl){
  function run(){
    const fresh = __liaFindInputBeforeNode(refEl);
    if (!fresh) return;
    __liaEnsureTexPreview(fresh);
    __liaShowTexPreview(fresh);
  }

  setTimeout(run, 0);
  setTimeout(run, 80);
  setTimeout(run, 180);
}


function __liaFindAndSetInputBeforeNode(refEl, value){
  const el = __liaFindInputBeforeNode(refEl);
  if (!el) return false;

  const ok = __liaApplyValue(el, value);
  if (!ok) return false;

  __liaRefreshTexPreviewNear(refEl);
  return true;
}





function __liaInitTexPreviews(){
  document.querySelectorAll('.lia-canvas-pair').forEach(function(pair){
    const field = __liaFindInputBeforeNode(pair);
    if (field) __liaEnsureTexPreview(field);
  });
}




  // =========================================================
  // Theme helpers — OHNE Regex-Literale (verhindert Parser-Fehler)
  // =========================================================
  function parseRgbNoRegex(s){
    const str = String(s || '');
    const i0 = str.indexOf('(');
    const i1 = str.indexOf(')');
    if (i0 < 0 || i1 < 0) return null;
    const parts = str.slice(i0+1, i1).split(',').map(x => Number(String(x).trim()));
    if (parts.length < 3) return null;
    if (!isFinite(parts[0]) || !isFinite(parts[1]) || !isFinite(parts[2])) return null;
    return [parts[0], parts[1], parts[2]];
  }
  function luminance(rgb){
    const [r,g,b] = rgb.map(v => v/255).map(c => (c <= 0.03928 ? c/12.92 : Math.pow((c+0.055)/1.055, 2.4)));
    return 0.2126*r + 0.7152*g + 0.0722*b;
  }

  function getLiaAccentColor(doc){
    try{
      const d = doc || document;
      const body = d.body || d.documentElement;

      const existing = d.querySelector('.lia-btn');
      if (existing){
        const bg = getComputedStyle(existing).backgroundColor;
        if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') return bg;
      }

      const probe = d.createElement('button');
      probe.className = 'lia-btn';
      probe.type = 'button';
      probe.textContent = 'x';
      probe.style.position = 'absolute';
      probe.style.left = '-9999px';
      probe.style.top = '-9999px';
      probe.style.visibility = 'hidden';
      body.appendChild(probe);

      const bg = getComputedStyle(probe).backgroundColor;
      probe.remove();

      if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') return bg;
    }catch(e){}
    return null;
  }

  function applyThemeVars(){
    ensureCss();
    try{
      const doc = (window.parent && window.parent.document) ? window.parent.document : document;
      const root = document.documentElement;

      const bg = getComputedStyle(doc.body || doc.documentElement).backgroundColor
              || getComputedStyle(doc.documentElement).backgroundColor;

      const rgb = parseRgbNoRegex(bg);
      const isDark = rgb ? (luminance(rgb) < 0.5) : false;

      const border = isDark ? '#fff' : '#000';
      root.style.setProperty('--canvas-border', border);
      root.style.setProperty('--canvas-pen', border);

      const accent = getLiaAccentColor(doc) || getLiaAccentColor(document);
      if (accent) root.style.setProperty('--canvas-accent', accent);

      document.dispatchEvent(new Event('lia-canvas-theme'));
    }catch(e){}
  }

  applyThemeVars();













  const mo = new MutationObserver(() => applyThemeVars());
  mo.observe(document.documentElement, { attributes:true, attributeFilter:['class','style'] });
  window.addEventListener('resize', () => applyThemeVars());

  // -----------------------------
  // Persistent store per UID
  // -----------------------------
  window.__LIA_CANVAS_STORE__ = window.__LIA_CANVAS_STORE__ || {}; // uid -> {wrapW,canvasH,VIEW,bgMode,bgStep,STROKES,REDO}

  // -----------------------------
  // Colors + helpers
  // -----------------------------
  const COLORS = [
    { key:'auto',       value:null },
    { key:'red',        value:'#ff0000' },
    { key:'orange',     value:'#ff7500' },
    { key:'yellow',     value:'#ffff00' },
    { key:'violett',    value:'#ff00ff' },
    { key:'blue',       value:'#0055ff' },
    { key:'lightblue',  value:'#00ffff' },
    { key:'green',      value:'#00ff00' },
    { key:'darkgreen',  value:'#007500' },
    { key:'black',      value:'#000000' },
    { key:'white',      value:'#ffffff' }
  ];

  function getAutoPen(){
    return getComputedStyle(document.documentElement).getPropertyValue('--canvas-pen').trim() || '#000';
  }
  function getBorderColor(){
    return getComputedStyle(document.documentElement).getPropertyValue('--canvas-border').trim() || '#000';
  }
  function getAccentColor(){
    return getComputedStyle(document.documentElement).getPropertyValue('--canvas-accent').trim() || getBorderColor();
  }

  // Icons (wie bei dir)
  function setSvg(btn, svg){
    if (!btn) return;
    if (btn.__hasIcon) return;
    btn.__hasIcon = true;
    btn.innerHTML = svg;
  }

  function setRectIcon(btn){
    setSvg(btn, `
    <svg viewBox="0 0 24 24" aria-hidden="true"
         style="transform: translateX(3px);">
      <path class="ico-stroke" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"
            d="
              M4.1 4.6
              H19.2
              Q20.9 4.6 20.9 6.3
              V16.0

              M17.2 19.8
              H4.1
              Q2.4 19.8 2.4 18.1
              V6.3
              Q2.4 4.6 4.1 4.6
            "/>

          //  Checkmark (links) 
            <path class="ico-stroke" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"
              d="M5.2 12.7l1.9 1.9 4.0-4.8"/>

          //  Fragezeichen (rechts, im Rechteck) 
            <path class="ico-stroke" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"
                  d="M13.8 9.9c0-2.2 4.8-2.2 4.8 0 0 1.6-2.4 1.8-2.4 3.6"/>
            <circle cx="16.2" cy="16.6" r="0.92" fill="var(--canvas-border)"/>

          //  "Zieh-Plus" direkt an der rechten unteren Ecke (überdeckt/unterbricht optisch die Ecke) 
            <path class="ico-stroke" stroke-width="1.4" stroke-linecap="round"
              d="M19.4 19.0H24.0 M21.7 16.7V21.3"/>
      </svg>
    `);
  }






  function setEraserIcon(btn){
    setSvg(btn, `
      <svg viewBox="-4 4 24 24" aria-hidden="true">
        <path class="ico-stroke" d="M4 16.5l8.6-8.6a2 2 0 0 1 2.8 0l4.1 4.1a2 2 0 0 1 0 2.8L12.8 23H7.6L4 19.4a2 2 0 0 1 0-2.9z"
              fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path class="ico-stroke" d="M8 23h8" fill="none" stroke-width="2" stroke-linecap="round"/>
        <path class="ico-stroke" d="M9.2 14.3l6.5 6.5" fill="none" stroke-width="2" stroke-linecap="round"/>
      </svg>
    `);
  }

  function setUndoIcon(btn){
    setSvg(btn, `
      <svg viewBox="-4 0 24 24" aria-hidden="true">
        <path d="M21 8H10.2V4L2 12l8.2 8v-4H21V8z" fill="var(--canvas-border)"/>
        <rect x="10.2" y="10.6" width="10.8" height="2.8" rx="1.4" fill="var(--canvas-border)"/>
      </svg>
    `);
  }

  function setRedoIcon(btn){
    setSvg(btn, `
      <svg viewBox="-4 0 24 24" aria-hidden="true">
        <path d="M3 8h10.8V4l8.2 8-8.2 8v-4H3V8z" fill="var(--canvas-border)"/>
        <rect x="3" y="10.6" width="10.8" height="2.8" rx="1.4" fill="var(--canvas-border)"/>
      </svg>
    `);
  }

  function setTrashIcon(btn){
    if (!btn) return;
    btn.innerHTML = `
      <svg viewBox="-1 0 24 24" aria-hidden="true" style="width:22px;height:22px;display:block;">
        <path class="ico-stroke" d="M9 3h6" stroke-width="2" stroke-linecap="round"/>
        <path class="ico-stroke" d="M4 6h16" stroke-width="2" stroke-linecap="round"/>
        <path class="ico-stroke" d="M7 6l1 15h8l1-15" stroke-width="2" stroke-linejoin="round"/>
        <path class="ico-stroke" d="M10 10v8M14 10v8" stroke-width="2" stroke-linecap="round"/>
      </svg>
    `;
  }

  function rgbaFromAny(color, a){
    const rgb = parseRgbNoRegex(color);
    if (rgb) return `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${a})`;
    if (String(color).startsWith('#')){
      const h = String(color).slice(1);
      const hex = (h.length===3) ? (h[0]+h[0]+h[1]+h[1]+h[2]+h[2]) : h;
      const r = parseInt(hex.slice(0,2),16);
      const g = parseInt(hex.slice(2,4),16);
      const b = parseInt(hex.slice(4,6),16);
      return `rgba(${r},${g},${b},${a})`;
    }
    return `rgba(0,0,0,${a})`;
  }


  // -----------------------------
  // Canvas Freeze API
  // - exportiert den final sichtbaren Canvas-Zustand
  // - rendert daraus eine statische Frozen-Preview
  // - noch OHNE Eingriff in den Freeze-Code
  // -----------------------------
  function cfNum(v, fallback){
    const n = Number(v);
    return isFinite(n) ? n : (fallback || 0);
  }

  function cfClamp(v, a, b){
    return Math.max(a, Math.min(b, v));
  }

  function cfRound(v){
    return Math.round(cfNum(v, 0) * 100) / 100;
  }

  function cfMod(v, m){
    const mm = cfNum(m, 0);
    if (!(mm > 0)) return 0;
    const x = cfNum(v, 0) % mm;
    return x < 0 ? (x + mm) : x;
  }

  function cfCloneView(view){
    const src = (view && typeof view === 'object') ? view : {};
    return {
      panX: cfNum(src.panX, 0),
      panY: cfNum(src.panY, 0),
      scale: cfNum(src.scale, 1) || 1,
      minScale: cfNum(src.minScale, 0.25),
      maxScale: cfNum(src.maxScale, 8)
    };
  }

  function cfProjectWorldPoint(pt, view){
    const x = cfNum(pt && pt.x, 0);
    const y = cfNum(pt && pt.y, 0);
    const s = cfNum(view && view.scale, 1) || 1;
    const px = x * s + cfNum(view && view.panX, 0);
    const py = y * s + cfNum(view && view.panY, 0);
    return { x:px, y:py };
  }

  function cfNormalizeRect(x0, y0, x1, y1){
    const left = Math.min(cfNum(x0, 0), cfNum(x1, 0));
    const top  = Math.min(cfNum(y0, 0), cfNum(y1, 0));
    const right  = Math.max(cfNum(x0, 0), cfNum(x1, 0));
    const bottom = Math.max(cfNum(y0, 0), cfNum(y1, 0));

    return {
      x: left,
      y: top,
      w: Math.max(0, right - left),
      h: Math.max(0, bottom - top)
    };
  }

  function cfBBoxFromScreenPoints(points, radius){
    const pts = Array.isArray(points) ? points : [];
    if (!pts.length) return null;

    let xMin = Infinity, yMin = Infinity, xMax = -Infinity, yMax = -Infinity;

    for (let i = 0; i < pts.length; i++){
      const p = pts[i];
      const x = cfNum(p && p.x, 0);
      const y = cfNum(p && p.y, 0);

      if (x < xMin) xMin = x;
      if (y < yMin) yMin = y;
      if (x > xMax) xMax = x;
      if (y > yMax) yMax = y;
    }

    const r = Math.max(0, cfNum(radius, 0));

    return {
      x: xMin - r,
      y: yMin - r,
      w: Math.max(0, (xMax - xMin) + 2 * r),
      h: Math.max(0, (yMax - yMin) + 2 * r)
    };
  }

  function cfIntersectViewport(bb, vw, vh){
    if (!bb) return null;

    const x0 = Math.max(0, cfNum(bb.x, 0));
    const y0 = Math.max(0, cfNum(bb.y, 0));
    const x1 = Math.min(cfNum(vw, 0), cfNum(bb.x, 0) + cfNum(bb.w, 0));
    const y1 = Math.min(cfNum(vh, 0), cfNum(bb.y, 0) + cfNum(bb.h, 0));

    if (x1 <= x0 || y1 <= y0) return null;

    return {
      x: x0,
      y: y0,
      w: x1 - x0,
      h: y1 - y0
    };
  }

  function cfUnionBBox(a, b){
    if (!a) return b ? { x:b.x, y:b.y, w:b.w, h:b.h } : null;
    if (!b) return { x:a.x, y:a.y, w:a.w, h:a.h };

    const x0 = Math.min(a.x, b.x);
    const y0 = Math.min(a.y, b.y);
    const x1 = Math.max(a.x + a.w, b.x + b.w);
    const y1 = Math.max(a.y + a.h, b.y + b.h);

    return {
      x: x0,
      y: y0,
      w: Math.max(0, x1 - x0),
      h: Math.max(0, y1 - y0)
    };
  }

  function cfGetCanvasStore(){
    return window.__LIA_CANVAS_STORE__ || {};
  }

  function cfGetCanvasMountFromPair(pair){
    if (!pair || !pair.querySelector) return null;
    return pair.querySelector('.lia-canvas-mount');
  }

  function cfGetCanvasUidFromPair(pair){
    const mount = cfGetCanvasMountFromPair(pair);
    if (!mount) return '';
    return ensureMountUID(mount);
  }

  function cfGetCanvasStoreEntry(uid){
    const STORE = cfGetCanvasStore();
    return uid && STORE[uid] ? STORE[uid] : null;
  }

  function cfCollectCanvasPairsFromRoot(root){
    const scope = (root && root.querySelectorAll) ? root : document;
    return Array.from(scope.querySelectorAll('.lia-canvas-pair')).filter(function(pair){
      return !!cfGetCanvasMountFromPair(pair);
    });
  }

  function cfBuildScreenItemsFromEntry(entry){
    const src = (entry && typeof entry === 'object') ? entry : {};
    const items = Array.isArray(src.ITEMS) ? src.ITEMS : [];
    const view = cfCloneView(src.VIEW || {});
    const vw = Math.max(1, Math.round(cfNum(src.wrapW, 0)));
    const vh = Math.max(1, Math.round(cfNum(src.canvasH, 0)));

    const rectFillDefault = rgbaFromAny(getAccentColor(), 0.28);
    const out = [];

    for (let i = 0; i < items.length; i++){
      const it = items[i];
      if (!it || typeof it !== 'object') continue;

      if (it.kind === 'path'){
        const ptsSrc = Array.isArray(it.points) ? it.points : [];
        if (!ptsSrc.length) continue;

        const pts = ptsSrc.map(function(p){
          const q = cfProjectWorldPoint(p, view);
          return { x:q.x, y:q.y };
        });

        const screenWidth = Math.max(0.75, cfNum(it.width, 1) * cfNum(view.scale, 1));
        const bb = cfBBoxFromScreenPoints(pts, screenWidth / 2 + 2);
        const vis = cfIntersectViewport(bb, vw, vh);
        if (!vis) continue;

        out.push({
          k: (it.tool === 'eraser') ? 'e' : 'p',
          c: String(it.color || getAutoPen()),
          a: cfClamp(cfNum(it.alpha, 1), 0, 1),
          w: cfRound(screenWidth),
          p: pts.map(function(p){
            return [cfRound(p.x), cfRound(p.y)];
          })
        });

        continue;
      }

      if (it.kind === 'rect'){
        const a = cfProjectWorldPoint({ x:it.x0, y:it.y0 }, view);
        const b = cfProjectWorldPoint({ x:it.x1, y:it.y1 }, view);

        const bb = cfNormalizeRect(a.x, a.y, b.x, b.y);
        const vis = cfIntersectViewport(bb, vw, vh);
        if (!vis) continue;

        const alpha = cfClamp(cfNum(it.alpha, 0.28), 0, 1);
        const fill = (it.color)
          ? rgbaFromAny(it.color, alpha)
          : rgbaFromAny(getAccentColor(), alpha);

        out.push({
          k: 'r',
          f: fill || rectFillDefault,
          x: cfRound(bb.x),
          y: cfRound(bb.y),
          w: cfRound(bb.w),
          h: cfRound(bb.h)
        });

        continue;
      }
    }

    return {
      vw: vw,
      vh: vh,
      items: out
    };
  }

  function cfPaintFreezeItems(ctx, items){
    const list = Array.isArray(items) ? items : [];

    for (let i = 0; i < list.length; i++){
      const it = list[i];
      if (!it) continue;

      if (it.k === 'r'){
        ctx.save();
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;
        ctx.fillStyle = String(it.f || 'rgba(0,0,0,0.15)');
        ctx.fillRect(
          cfNum(it.x, 0),
          cfNum(it.y, 0),
          Math.max(0, cfNum(it.w, 0)),
          Math.max(0, cfNum(it.h, 0))
        );
        ctx.restore();
        continue;
      }

      const pts = Array.isArray(it.p) ? it.p : [];
      if (!pts.length) continue;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(cfNum(pts[0][0], 0), cfNum(pts[0][1], 0));

      for (let j = 1; j < pts.length; j++){
        ctx.lineTo(cfNum(pts[j][0], 0), cfNum(pts[j][1], 0));
      }

      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = Math.max(0.75, cfNum(it.w, 1));

      if (it.k === 'e'){
        ctx.globalCompositeOperation = 'destination-out';
        ctx.globalAlpha = 1;
        ctx.strokeStyle = 'rgba(0,0,0,1)';
      }else{
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = cfClamp(cfNum(it.a, 1), 0, 1);
        ctx.strokeStyle = String(it.c || '#000');
      }

      ctx.stroke();
      ctx.restore();
    }
  }

  function cfComputeAlphaBBox(canvas, pad){
    if (!canvas) return null;

    const x = canvas.getContext('2d', { willReadFrequently:true });
    const W = canvas.width | 0;
    const H = canvas.height | 0;
    if (!(W > 0 && H > 0)) return null;

    const img = x.getImageData(0, 0, W, H);
    const d = img.data;

    let xMin = W, yMin = H, xMax = -1, yMax = -1;

    for (let y = 0; y < H; y++){
      const row = y * W * 4;
      for (let x0 = 0; x0 < W; x0++){
        const a = d[row + x0 * 4 + 3];
        if (a <= 10) continue;

        if (x0 < xMin) xMin = x0;
        if (y < yMin) yMin = y;
        if (x0 > xMax) xMax = x0;
        if (y > yMax) yMax = y;
      }
    }

    if (xMax < 0) return null;

    const p = Math.max(0, Math.round(cfNum(pad, 0)));

    xMin = Math.max(0, xMin - p);
    yMin = Math.max(0, yMin - p);
    xMax = Math.min(W - 1, xMax + p);
    yMax = Math.min(H - 1, yMax + p);

    return {
      x: xMin,
      y: yMin,
      w: Math.max(1, xMax - xMin + 1),
      h: Math.max(1, yMax - yMin + 1)
    };
  }

  function cfRebaseFreezeItems(items, crop){
    const list = Array.isArray(items) ? items : [];
    const dx = cfNum(crop && crop.x, 0);
    const dy = cfNum(crop && crop.y, 0);

    return list.map(function(it){
      if (!it) return null;

      if (it.k === 'r'){
        return {
          k: 'r',
          f: String(it.f || ''),
          x: cfRound(cfNum(it.x, 0) - dx),
          y: cfRound(cfNum(it.y, 0) - dy),
          w: cfRound(cfNum(it.w, 0)),
          h: cfRound(cfNum(it.h, 0))
        };
      }

      return {
        k: it.k === 'e' ? 'e' : 'p',
        c: String(it.c || ''),
        a: cfClamp(cfNum(it.a, 1), 0, 1),
        w: cfRound(cfNum(it.w, 1)),
        p: (Array.isArray(it.p) ? it.p : []).map(function(pt){
          return [
            cfRound(cfNum(pt && pt[0], 0) - dx),
            cfRound(cfNum(pt && pt[1], 0) - dy)
          ];
        })
      };
    }).filter(Boolean);
  }

  function cfBuildBackgroundRecipe(entry, crop){
    const src = (entry && typeof entry === 'object') ? entry : {};
    const view = cfCloneView(src.VIEW || {});
    const mode = String(src.bgMode || 'none');

    if (mode !== 'grid' && mode !== 'lined'){
      return { m:'none' };
    }

    const stepWorld = Math.max(1, cfNum(src.bgStep, 24));
    const stepPx = stepWorld * Math.max(0.0001, cfNum(view.scale, 1));

    if (!(stepPx > 0)){
      return { m:'none' };
    }

    const cropX = cfNum(crop && crop.x, 0);
    const cropY = cfNum(crop && crop.y, 0);

    return {
      m: mode,
      s: cfRound(stepPx),
      ox: cfRound(cfMod(cfNum(view.panX, 0) - cropX, stepPx)),
      oy: cfRound(cfMod(cfNum(view.panY, 0) - cropY, stepPx)),
      c: rgbaFromAny(getAccentColor(), 0.65),
      lw: 1.125
    };
  }

  function cfPaintBackground(ctx, bg, w, h){
    const spec = (bg && typeof bg === 'object') ? bg : {};
    const mode = String(spec.m || 'none');
    if (mode !== 'grid' && mode !== 'lined') return;

    const step = Math.max(1, cfNum(spec.s, 1));
    const ox = cfMod(cfNum(spec.ox, 0), step);
    const oy = cfMod(cfNum(spec.oy, 0), step);
    const col = String(spec.c || rgbaFromAny(getAccentColor(), 0.65));
    const lw = Math.max(0.5, cfNum(spec.lw, 1.125));

    ctx.save();
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.strokeStyle = col;
    ctx.lineWidth = lw;

    if (mode === 'grid'){
      ctx.beginPath();

      for (let x = ox; x <= w; x += step){
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
      }

      for (let y = oy; y <= h; y += step){
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
      }

      ctx.stroke();
      ctx.restore();
      return;
    }

    if (mode === 'lined'){
      ctx.beginPath();

      for (let y = oy; y <= h; y += step){
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
      }

      ctx.stroke();
      ctx.restore();
    }
  }

  function cfExportCanvasFreezeStateFromEntry(uid, entry){
    if (!uid || !entry) return null;

    const built = cfBuildScreenItemsFromEntry(entry);
    const vw = Math.max(1, built.vw | 0);
    const vh = Math.max(1, built.vh | 0);
    const items = Array.isArray(built.items) ? built.items : [];

    const off = document.createElement('canvas');
    off.width = vw;
    off.height = vh;

    const ox = off.getContext('2d', { willReadFrequently:true });
    ox.clearRect(0, 0, vw, vh);
    cfPaintFreezeItems(ox, items);

    const crop = cfComputeAlphaBBox(off, 8);

    if (!crop){
      return {
        v: 'cvf1',
        u: String(uid),
        e: 1,
        w: 0,
        h: 0,
        bg: { m:'none' },
        it: []
      };
    }

    return {
      v: 'cvf1',
      u: String(uid),
      w: crop.w,
      h: crop.h,
      bg: cfBuildBackgroundRecipe(entry, crop),
      it: cfRebaseFreezeItems(items, crop)
    };
  }

  function cfExportCanvasFreezeStateFromPair(pair){
    const uid = cfGetCanvasUidFromPair(pair);
    if (!uid) return null;

    const entry = cfGetCanvasStoreEntry(uid);
    if (!entry) return null;

    return cfExportCanvasFreezeStateFromEntry(uid, entry);
  }

  function cfExportAllCanvasFreezeStatesFromRoot(root){
    const pairs = cfCollectCanvasPairsFromRoot(root);
    const out = [];

    for (let i = 0; i < pairs.length; i++){
      const state = cfExportCanvasFreezeStateFromPair(pairs[i]);
      if (!state) continue;

      out.push(state);
    }

    return out;
  }

  function cfHasCanvasFreezeContent(state){
    return !!(
      state &&
      state.e !== 1 &&
      cfNum(state.w, 0) > 0 &&
      cfNum(state.h, 0) > 0 &&
      Array.isArray(state.it) &&
      state.it.length
    );
  }

  function cfPaintCanvasFreezeStateToCanvas(canvas, state){
    if (!canvas || !state) return null;

    const w = Math.max(1, Math.round(cfNum(state.w, 1)));
    const h = Math.max(1, Math.round(cfNum(state.h, 1)));
    const dpr = window.devicePixelRatio || 1;

    canvas.width = Math.max(1, Math.round(w * dpr));
    canvas.height = Math.max(1, Math.round(h * dpr));
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';

    const ctx = canvas.getContext('2d', { willReadFrequently:true });
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    cfPaintBackground(ctx, state.bg || { m:'none' }, w, h);
    cfPaintFreezeItems(ctx, Array.isArray(state.it) ? state.it : []);

    return canvas;
  }

  function cfRenderCanvasFreezeStateIntoMount(mount, state){
    if (!mount || !(mount instanceof Element) || !state) return null;

    mount.dataset.open = '1';
    mount.innerHTML = '';

    if (!cfHasCanvasFreezeContent(state)){
      const empty = document.createElement('span');
      empty.className = 'lia-canvas-freeze-empty';
      empty.textContent = 'Keine sichtbaren Canvas-Inhalte eingefroren.';
      mount.appendChild(empty);
      return empty;
    }

    const block = document.createElement('span');
    block.className = 'lia-draw-block';

    const wrap = document.createElement('span');
    wrap.className = 'lia-draw-wrap';

    const canvas = document.createElement('canvas');
    canvas.className = 'lia-canvas-freeze-preview';
    canvas.setAttribute('aria-label', 'Eingefrorene Zeichenfläche');

    wrap.appendChild(canvas);
    block.appendChild(wrap);
    mount.appendChild(block);

    cfPaintCanvasFreezeStateToCanvas(canvas, state);
    return canvas;
  }

  function cfRenderCanvasFreezeStateIntoPair(pair, state){
    const mount = cfGetCanvasMountFromPair(pair);
    if (!mount) return null;
    return cfRenderCanvasFreezeStateIntoMount(mount, state);
  }

  function ensureCanvasFreezeApi(){
    const api = ROOT.__LIA_CANVAS_FREEZE_API__ || {};

    api.version = 'cvf1';
    api.collectCanvasPairsFromRoot = cfCollectCanvasPairsFromRoot;
    api.getCanvasMountFromPair = cfGetCanvasMountFromPair;
    api.getCanvasUidFromPair = cfGetCanvasUidFromPair;
    api.getCanvasStoreEntry = cfGetCanvasStoreEntry;
    api.exportCanvasFreezeStateFromEntry = cfExportCanvasFreezeStateFromEntry;
    api.exportCanvasFreezeStateFromPair = cfExportCanvasFreezeStateFromPair;
    api.exportAllCanvasFreezeStatesFromRoot = cfExportAllCanvasFreezeStatesFromRoot;
    api.hasCanvasFreezeContent = cfHasCanvasFreezeContent;
    api.paintCanvasFreezeStateToCanvas = cfPaintCanvasFreezeStateToCanvas;
    api.renderCanvasFreezeStateIntoMount = cfRenderCanvasFreezeStateIntoMount;
    api.renderCanvasFreezeStateIntoPair = cfRenderCanvasFreezeStateIntoPair;

    ROOT.__LIA_CANVAS_FREEZE_API__ = api;
    window.__LIA_CANVAS_FREEZE_API__ = api;

    return api;
  }

  ensureCanvasFreezeApi();


  // -----------------------------
  // Canvas HTML (INLINE-STABIL: spans statt divs)
  // -----------------------------
  function canvasMarkup(){
    return `
      <span class="lia-draw-block">
        <span class="lia-draw-wrap">
          <span class="lia-toolstack">
            <button class="lia-tool-btn lia-undo-btn"   type="button" aria-label="Rückgängig"></button>
            <button class="lia-tool-btn lia-redo-btn"   type="button" aria-label="Wiederherstellen"></button>
            <button class="lia-tool-btn lia-eraser-btn" type="button" aria-label="Radierer"></button>
            <button class="lia-tool-btn lia-color-btn"  type="button" aria-label="Stift"></button>
            <button class="lia-tool-btn lia-bgmenu-btn" type="button" aria-label="Hintergrund"></button>
            <button class="lia-tool-btn lia-rect-btn"   type="button" aria-label="Lösung markieren"></button>
          </span>

          <span class="lia-tool-menu" data-open="0" aria-label="Werkzeuge"></span>
          <canvas class="lia-draw" aria-label="Zeichenfläche"></canvas>
        </span>
      </span>
    `;
  }

  // -----------------------------
  // Canvas setup (mit Store-Backup)
  // -----------------------------
function setupCanvas(canvas){
  const wrap = canvas.closest('.lia-draw-wrap');
  if (!wrap) return;

  const mount = wrap.closest('.lia-canvas-mount');
  const uid = ensureMountUID(mount);

  const btnUndo   = wrap.querySelector('.lia-undo-btn');
  const btnRedo   = wrap.querySelector('.lia-redo-btn');
  const btnColor  = wrap.querySelector('.lia-color-btn');
  const btnEraser = wrap.querySelector('.lia-eraser-btn');
  const btnRect   = wrap.querySelector('.lia-rect-btn');   // NEU
  const btnBg     = wrap.querySelector('.lia-bgmenu-btn');
  const menu      = wrap.querySelector('.lia-tool-menu');

  // ---------------------------------------------------------
  // Action-Button (unter Marker-Rechteck) — MUSS existieren,
  // sonst crasht setupCanvas() und die ganze UI ist tot.
  // ---------------------------------------------------------

  const rectActionBtn = document.createElement('button');
  rectActionBtn.type = 'button';
  rectActionBtn.className = 'lia-rect-action';
  rectActionBtn.textContent = 'Als Lösung übergeben';
  rectActionBtn.style.display = 'none';
  wrap.appendChild(rectActionBtn);


  // --- Progressbar unter dem Action-Button ---
  const rectProg = document.createElement('div');
  rectProg.className = 'lia-rect-progress';
  rectProg.dataset.on = '0';
  rectProg.innerHTML = `
    <div class="lia-rect-progbar"><div class="lia-rect-progfill"></div></div>
    <div class="lia-rect-progtxt">0%</div>
  `;
  wrap.appendChild(rectProg);

  const rectProgFill = rectProg.querySelector('.lia-rect-progfill');
  const rectProgTxt  = rectProg.querySelector('.lia-rect-progtxt');

  // verhindert Pointer-"Durchfall" (wie beim Button)
  rectProg.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    e.stopPropagation();
  });



  // verhindert, dass Pointer-Events "durchfallen"
  rectActionBtn.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    e.stopPropagation();
  });


  // Close-Button (oben rechts am Marker-Rechteck)
  const rectCloseBtn = document.createElement('button');
  rectCloseBtn.type = 'button';
  rectCloseBtn.className = 'lia-rect-close';
  rectCloseBtn.setAttribute('aria-label','Marker-Rechteck entfernen');
  rectCloseBtn.style.display = 'none';
  rectCloseBtn.innerHTML = `
    <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 7L17 17M17 7L7 17"
        fill="none"
        stroke="currentColor"
        stroke-width="2.4"
        stroke-linecap="round"/>
    </svg>
  `;
  wrap.appendChild(rectCloseBtn);

  // Sichtbarer Radierer-Ring
  const eraserRing = document.createElement('span');
  eraserRing.className = 'lia-eraser-ring';
  eraserRing.dataset.on = '0';
  wrap.appendChild(eraserRing);

  // verhindert, dass Pointer-Events "durchfallen"
  rectCloseBtn.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); });

  rectCloseBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    clearMarkerRect();
  });



  setUndoIcon(btnUndo);
  setRedoIcon(btnRedo);
  setEraserIcon(btnEraser);
  setRectIcon(btnRect); // NEU
  if (btnBg && !btnBg.__bgCleared){ btnBg.__bgCleared = true; btnBg.innerHTML = ''; }

  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  // Layer: Highlights (unter Strichen) + Striche
  const hiLayer = document.createElement('canvas');
  const hctx = hiLayer.getContext('2d', { willReadFrequently:true });

  const strokeLayer = document.createElement('canvas');
  const sctx = strokeLayer.getContext('2d', { willReadFrequently:true });

  const STORE = window.__LIA_CANVAS_STORE__;
  const saved = (uid && STORE[uid]) ? STORE[uid] : null;

  const VIEW = saved && saved.VIEW ? { ...saved.VIEW } : { panX:0, panY:0, scale:1, minScale:0.25, maxScale:8 };

  let __liaCanvasFreezeNotifyTimer = 0;
  let __liaCanvasFreezeNotifyArmed = false;

  function scheduleCanvasFreezeNotify(reason){
    if (!uid) return;
    if (!__liaCanvasFreezeNotifyArmed) return;

    clearTimeout(__liaCanvasFreezeNotifyTimer);
    __liaCanvasFreezeNotifyTimer = setTimeout(() => {
      __liaDispatchCanvasFreezeChange({
        uid: uid,
        reason: String(reason || 'persist'),
        hasItems: (Array.isArray(ITEMS) && ITEMS.length > 0) ? 1 : 0
      });
    }, 120);
  }

  // --- Action-Button (erscheint nach Rechteck-Commit) ---
    // ---------------------------------------------------------
    // OCR: Rect -> Crop aus strokeLayer -> recognize -> in Input setzen
    // ---------------------------------------------------------

    function __ocrLog(msg){
      try{
        const b = window.__LIA_OCR_BAR__;
        if (b && b.log) b.log(msg);
      }catch(_){}
    }

        function __ocrSquashWS(str){
          const s = String(str || '');
          let out = '';
          let was = false;
          for (let i = 0; i < s.length; i++){
            const ch = s[i];
            const isWS = (ch === ' ' || ch === '\n' || ch === '\r' || ch === '\t' || ch === '\f');
            if (isWS){
              if (!was) out += ' ';
              was = true;
            }else{
              out += ch;
              was = false;
            }
          }
          return out.trim();
        }

        function __ocrCleanLatex(s){
          let t = String(s || '').trim();

          // häufige Wrapper entfernen
          if (t.startsWith('$$') && t.endsWith('$$')) t = t.slice(2, -2).trim();
          if (t.startsWith('$')  && t.endsWith('$'))  t = t.slice(1, -1).trim();
          if (t.startsWith('\\[') && t.endsWith('\\]')) t = t.slice(2, -2).trim();

          return __ocrSquashWS(t);
        }


        function __ocrUnwrapRoman(t){
          let s = String(t || '').trim();

          const pre = '\\mathrm{';
          if (s.startsWith(pre) && s.endsWith('}')){
            s = s.slice(pre.length, -1);

            // ~ und überflüssige Spaces raus
            let out = '';
            for (let i = 0; i < s.length; i++){
              const ch = s[i];
              if (ch === '~') continue;
              out += ch;
            }
            return out.trim();
          }
          return s;
        }



      function __ocrCropFromRect(rectItem){
        if (!rectItem) return null;

        const dpr = window.devicePixelRatio || 1;

        // rect in World -> Screen (CSS px)
        const x0w = Math.min(rectItem.x0, rectItem.x1);
        const y0w = Math.min(rectItem.y0, rectItem.y1);
        const x1w = Math.max(rectItem.x0, rectItem.x1);
        const y1w = Math.max(rectItem.y0, rectItem.y1);

        const A = worldToScreen(x0w, y0w);
        const B = worldToScreen(x1w, y1w);

        let sx0 = Math.min(A.sx, B.sx);
        let sy0 = Math.min(A.sy, B.sy);
        let sx1 = Math.max(A.sx, B.sx);
        let sy1 = Math.max(A.sy, B.sy);

        // clamp in Canvas viewport (CSS)
        sx0 = clamp(sx0, 0, canvas.clientWidth);
        sy0 = clamp(sy0, 0, canvas.clientHeight);
        sx1 = clamp(sx1, 0, canvas.clientWidth);
        sy1 = clamp(sy1, 0, canvas.clientHeight);

        const wCss = sx1 - sx0;
        const hCss = sy1 - sy0;

        if (wCss < 6 || hCss < 6) return null;

        const padCss = 12;

        // Source rect in device px
        const srcX = Math.round((sx0 - padCss) * dpr);
        const srcY = Math.round((sy0 - padCss) * dpr);
        const srcW = Math.round((wCss + 2 * padCss) * dpr);
        const srcH = Math.round((hCss + 2 * padCss) * dpr);

        const out = document.createElement('canvas');
        out.width  = Math.max(1, srcW);
        out.height = Math.max(1, srcH);

        const octx = out.getContext('2d', { willReadFrequently:true });
        octx.setTransform(1,0,0,1,0,0);
        octx.globalCompositeOperation = 'source-over';
        octx.globalAlpha = 1.0;

        // 1) NICHT weiß füllen! Erst transparent croppen -> Alpha bleibt erhalten
        octx.clearRect(0,0,out.width,out.height);

        const srcCanvas = strokeLayer;
        const SRCW = srcCanvas.width, SRCH = srcCanvas.height;

        let sX = srcX, sY = srcY, sW = srcW, sH = srcH;
        let dX = 0,    dY = 0,    dW = out.width, dH = out.height;

        // clamp drawImage safe
        if (sX < 0){
          const frac = (-sX) / sW;
          dX += dW * frac; dW -= dW * frac;
          sW += sX; sX = 0;
        }
        if (sY < 0){
          const frac = (-sY) / sH;
          dY += dH * frac; dH -= dH * frac;
          sH += sY; sY = 0;
        }
        if (sX + sW > SRCW){
          const over = (sX + sW) - SRCW;
          const frac = over / sW;
          dW -= dW * frac;
          sW -= over;
        }
        if (sY + sH > SRCH){
          const over = (sY + sH) - SRCH;
          const frac = over / sH;
          dH -= dH * frac;
          sH -= over;
        }

        if (sW <= 1 || sH <= 1 || dW <= 1 || dH <= 1) return null;

        octx.drawImage(srcCanvas, sX, sY, sW, sH, dX, dY, dW, dH);

        // 2) Alpha-basiert binarisieren: alles mit Alpha>TH => Schwarz, sonst Weiß
        const img = octx.getImageData(0,0,out.width,out.height);
        const data = img.data;

        const TH = 10; // tolerant für dünne/teiltransparente Strokes

        for (let i = 0; i < data.length; i += 4){
          const a = data[i+3];
          if (a > TH){
            data[i]   = 0;
            data[i+1] = 0;
            data[i+2] = 0;
            data[i+3] = 255;
          }else{
            data[i]   = 255;
            data[i+1] = 255;
            data[i+2] = 255;
            data[i+3] = 255;
          }
        }

        octx.putImageData(img, 0, 0);
        return out;
      }




    function __ocrNormalizeSize(c){
      // Texify2 ist relativ robust, aber kleine Ausschnitte brauchen Upscale.
      const maxSide = Math.max(c.width, c.height);
      let scale = 1;

      if (maxSide < 420) scale = 420 / maxSide;     // hochskalieren
      if (maxSide > 1400) scale = 1400 / maxSide;   // runter skalieren

      scale = clamp(scale, 0.5, 4.0);

      if (Math.abs(scale - 1) < 0.06) return c;

      const out = document.createElement('canvas');
      out.width  = Math.max(1, Math.round(c.width  * scale));
      out.height = Math.max(1, Math.round(c.height * scale));

      const x = out.getContext('2d', { willReadFrequently:true });
      x.fillStyle = '#fff';
      x.fillRect(0,0,out.width,out.height);
      x.drawImage(c, 0, 0, out.width, out.height);
      return out;
    }




    function __ocrPreprocessCanvas(src){
      // 1) auf temp ziehen
      const c0 = document.createElement('canvas');
      c0.width = Math.max(1, src.width|0);
      c0.height = Math.max(1, src.height|0);
      const x0 = c0.getContext('2d', { willReadFrequently:true });
      x0.fillStyle = '#fff';
      x0.fillRect(0,0,c0.width,c0.height);
      x0.drawImage(src, 0, 0);
    
      const img = x0.getImageData(0,0,c0.width,c0.height);
      const d = img.data;
      const W = c0.width, H = c0.height;
    
      // 2) Graustufe + einfacher Threshold (funktioniert hier i.d.R. besser als “smart”)
      //    (weil dein StrokeLayer schon stark kontrastreich ist)
      const thr = 200; // <- kann man später im UI als Slider anbieten
      // bin: 1=schwarz (Stroke), 0=weiß
      const bin = new Uint8Array(W*H);
    
      for (let i=0, p=0; p<bin.length; p++, i+=4){
        const r=d[i], g=d[i+1], b=d[i+2];
        const gray = (r*0.299 + g*0.587 + b*0.114);
        bin[p] = (gray < thr) ? 1 : 0;
      }
    
      // 3) Dilation (2 Iterationen, 3x3) -> Striche dicker
      function dilateOnce(srcBin){
        const out = new Uint8Array(W*H);
        for (let y=1; y<H-1; y++){
          for (let x=1; x<W-1; x++){
            let on = 0;
            const idx = y*W + x;
            // 3x3
            for (let dy=-1; dy<=1; dy++){
              for (let dx=-1; dx<=1; dx++){
                if (srcBin[idx + dy*W + dx]) { on = 1; dy = 2; break; }
              }
            }
            out[idx] = on;
          }
        }
        return out;
      }

      // Dilation: bei Ziffern oft schädlich → standardmäßig AUS
      const DILATE_ITERS = 0; // 0 = aus, 1 = mild, 2 = stark
      let b2 = bin;

      for (let k = 0; k < DILATE_ITERS; k++){
        b2 = dilateOnce(b2);
      }
    
      // 4) Boundingbox der schwarzen Pixel
      let xMin=W, yMin=H, xMax=-1, yMax=-1;
      for (let y=0; y<H; y++){
        for (let x=0; x<W; x++){
          if (!b2[y*W + x]) continue;
          if (x < xMin) xMin = x;
          if (y < yMin) yMin = y;
          if (x > xMax) xMax = x;
          if (y > yMax) yMax = y;
        }
      }
      // leer?
      if (xMax < 0) return c0;
    
      // Rand
      const pad = 18;
      xMin = Math.max(0, xMin - pad);
      yMin = Math.max(0, yMin - pad);
      xMax = Math.min(W-1, xMax + pad);
      yMax = Math.min(H-1, yMax + pad);
    
      const cw = Math.max(1, xMax - xMin + 1);
      const ch = Math.max(1, yMax - yMin + 1);
    
      // 5) Render: schwarz auf weiß, sauber, dann skalieren
      const c1 = document.createElement('canvas');
      c1.width = cw;
      c1.height = ch;
      const x1 = c1.getContext('2d', { willReadFrequently:true });
    
      const out = x1.createImageData(cw, ch);
      const od = out.data;
      for (let y=0; y<ch; y++){
        for (let x=0; x<cw; x++){
          const v = b2[(yMin+y)*W + (xMin+x)] ? 0 : 255;
          const i = (y*cw + x)*4;
          od[i] = v; od[i+1]=v; od[i+2]=v; od[i+3]=255;
        }
      }
      x1.putImageData(out, 0, 0);
    
      // 6) Zielgröße (Texify2 mag “nicht zu klein”)
      const target = 512;
      const m = Math.max(cw, ch);
      let scale = target / m;
      if (scale < 0.75) scale = 0.75;
      if (scale > 3.5)  scale = 3.5;
    
      const c2 = document.createElement('canvas');
      c2.width = Math.max(1, Math.round(cw*scale));
      c2.height= Math.max(1, Math.round(ch*scale));
      const x2 = c2.getContext('2d', { willReadFrequently:true });
      x2.fillStyle = '#fff';
      x2.fillRect(0,0,c2.width,c2.height);
      x2.imageSmoothingEnabled = true;
      x2.drawImage(c1, 0,0, c2.width, c2.height);
    
      return c2;
    }
    



function __ocrFixDigitsIfPossible(s){
  const t = String(s || '').trim();
  if (!t) return null;

  // schon nur Ziffern?
  let allDigits = true;
  for (let i=0;i<t.length;i++){
    const c = t.charCodeAt(i);
    if (c < 48 || c > 57){ allDigits = false; break; }
  }
  if (allDigits) return t;

  // sehr konservative Single-Token Fixes
  const low = t.toLowerCase();
  if (low === 'li' || low === 'l1' || low === 'il') return '4'; // dein häufigster Fehlerfall
  if (low === 'go' || low === 'g0' || low === 'qo' || low === 'q0') return '8';


  // char-by-char mapping (nur wenn ALLES mappbar ist)
  const map = {
    'O':'0','o':'0','Q':'0',
    'I':'1','l':'1','|':'1','!':'1',
    'Z':'2','z':'2',
    'J':'3','j':'3',
    'H':'4','h':'4',
    'S':'5','s':'5',
    'B':'8',
    'g':'9','q':'9'
  };

  let out = '';
  for (let i=0;i<t.length;i++){
    const ch = t[i];
    if (map[ch]) out += map[ch];
    else return null;
  }
  return out || null;
}



function __ocrIsAllDigits(s){
  const t = String(s || '').trim();
  if (!t) return false;
  for (let i=0;i<t.length;i++){
    const c = t.charCodeAt(i);
    if (c < 48 || c > 57) return false;
  }
  return true;
}


function __ocrMathLooksIncomplete(s){
  const t = String(s || '').trim();
  if (!t) return true;

  // endet auf typischen "abgeschnittenen" Zeichen
  if (/[+\-*/=,:;\\]$/.test(t)) return true;
  if (/[{[(]$/.test(t)) return true;

  let curly = 0;
  let square = 0;
  let round = 0;
  let escaped = false;

  for (let i = 0; i < t.length; i++){
    const ch = t[i];

    if (escaped){
      escaped = false;
      continue;
    }

    if (ch === '\\'){
      escaped = true;
      continue;
    }

    if (ch === '{') curly++;
    else if (ch === '}') curly--;

    else if (ch === '[') square++;
    else if (ch === ']') square--;

    else if (ch === '(') round++;
    else if (ch === ')') round--;
  }

  if (curly !== 0) return true;
  if (square !== 0) return true;
  if (round !== 0) return true;

  return false;
}

function __ocrShouldPreferDigits(ink, crop){
  if (!ink || !crop) return false;

  const cropW = Math.max(1, crop.width  | 0);
  const cropH = Math.max(1, crop.height | 0);

  const w = Math.max(1, ink.w | 0);
  const h = Math.max(1, ink.h | 0);
  const longSide = Math.max(w, h);
  const shortSide = Math.min(w, h);
  const ar = w / Math.max(1, h);
  const fill = (Number(ink.black || 0) || 0) / Math.max(1, w * h);

  // sehr konservativ:
  // nur kleine, kompakte Einzel-/Kurztoken sollen in den Digit-Pfad
  if (longSide > 220) return false;
  if (shortSide > 170) return false;

  // typische Form für 1 bis wenige Ziffern
  if (ar < 0.20 || ar > 2.80) return false;

  // zu leer oder zu voll => eher kein sauberer Ziffern-Token
  if (fill < 0.01 || fill > 0.60) return false;

  // wenn der Inhalt schon recht groß ist, lieber normaler Math-Pfad
  if (w > Math.floor(cropW * 0.82) && h > Math.floor(cropH * 0.82) && longSide > 140){
    return false;
  }

  return true;
}


// sehr konservativ: akzeptiert nur (gemappte) Ziffern, sonst null
function __ocrDigitCandidateFrom(txt){
  const t = String(txt || '').trim();
  if (!t) return null;

  // LaTeX-Kommandos -> raus (bei Ziffern-Guard wollen wir KEIN \frac etc.)
  if (t.indexOf('\\') !== -1) return null;

  const map = {
    'O':'0','o':'0','Q':'0','D':'0',
    'I':'1','l':'1','|':'1','!':'1',
    'Z':'2','z':'2',
    'S':'5','s':'5',
    'B':'8',
    'g':'9','q':'9'
  };

  let out = '';
  for (let i=0;i<t.length;i++){
    const ch = t[i];
    const code = t.charCodeAt(i);

    // Ziffer
    if (code >= 48 && code <= 57){ out += ch; continue; }

    // erlaubte "Noise"-Zeichen bei OCR-Ausgabe: überspringen
    if (ch === ' ' || ch === '\n' || ch === '\r' || ch === '\t') continue;
    if (ch === '$' || ch === '{' || ch === '}' || ch === '(' || ch === ')' || ch === '[' || ch === ']') continue;
    if (ch === ',' || ch === '.' || ch === ':' || ch === ';' || ch === '_' || ch === '-') continue;

    // Mapping
    if (map[ch]){ out += map[ch]; continue; }

    // irgendwas anderes -> Kandidat verwerfen
    return null;
  }

  out = String(out).trim();
  if (!out) return null;
  if (out.length > 3) return null; // sehr konservativ
  return out;
}

function __ocrRotateCanvas(src, deg){
  const rad = deg * Math.PI / 180;
  const w = src.width|0, h = src.height|0;

  const out = document.createElement('canvas');
  out.width = Math.max(1, w);
  out.height = Math.max(1, h);

  const x = out.getContext('2d', { willReadFrequently:true });
  x.fillStyle = '#fff';
  x.fillRect(0,0,out.width,out.height);

  x.translate(out.width/2, out.height/2);
  x.rotate(rad);
  x.translate(-w/2, -h/2);

  // bei Ziffern ist "crisp" meist besser
  x.imageSmoothingEnabled = false;
  x.drawImage(src, 0, 0);

  return out;
}

// Digit-Preprocess: tight bbox, zentrieren auf Quadrat, optional 1x Dilation
function __ocrPreprocessDigitCanvas(src, opts){
  const o = (opts && typeof opts === 'object') ? opts : {};
  const dilate = (o.dilate === 1) ? 1 : 0;

  const c0 = document.createElement('canvas');
  c0.width = Math.max(1, src.width|0);
  c0.height = Math.max(1, src.height|0);

  const x0 = c0.getContext('2d', { willReadFrequently:true });
  x0.fillStyle = '#fff';
  x0.fillRect(0,0,c0.width,c0.height);
  x0.drawImage(src, 0, 0);

  const img = x0.getImageData(0,0,c0.width,c0.height);
  const d = img.data;
  const W = c0.width, H = c0.height;

  // etwas höherer Threshold -> zartere Strokes bleiben schwarz
  const thr = 225;
  let bin = new Uint8Array(W*H);

  for (let i=0,p=0; p<bin.length; p++, i+=4){
    const r=d[i], g=d[i+1], b=d[i+2];
    const gray = (r*0.299 + g*0.587 + b*0.114);
    bin[p] = (gray < thr) ? 1 : 0;
  }

  function dilateOnce(srcBin){
    const out = new Uint8Array(W*H);
    for (let y=1; y<H-1; y++){
      for (let x=1; x<W-1; x++){
        const idx = y*W + x;
        let on = 0;
        for (let dy=-1; dy<=1; dy++){
          for (let dx=-1; dx<=1; dx++){
            if (srcBin[idx + dy*W + dx]) { on = 1; dy = 2; break; }
          }
        }
        out[idx] = on;
      }
    }
    return out;
  }

  if (dilate === 1){
    bin = dilateOnce(bin);
  }

  // bbox
  let xMin=W, yMin=H, xMax=-1, yMax=-1;
  for (let y=0; y<H; y++){
    for (let x=0; x<W; x++){
      if (!bin[y*W + x]) continue;
      if (x < xMin) xMin = x;
      if (y < yMin) yMin = y;
      if (x > xMax) xMax = x;
      if (y > yMax) yMax = y;
    }
  }
  if (xMax < 0) return __ocrPreprocessCanvas(src); // fallback auf deinen Standard

  const cw = Math.max(1, xMax - xMin + 1);
  const ch = Math.max(1, yMax - yMin + 1);

  // großzügiger Pad bei Einzelsymbolen
  const pad = Math.max(24, Math.floor(Math.max(cw, ch) * 0.35));

  // quadratisches Ziel, zentriert
  const side = Math.max(64, Math.min(1024, Math.max(cw, ch) + 2*pad));

  const c1 = document.createElement('canvas');
  c1.width = side;
  c1.height = side;
  const x1 = c1.getContext('2d', { willReadFrequently:true });

  const out = x1.createImageData(side, side);
  const od = out.data;

  // weiß füllen
  for (let i=0; i<od.length; i+=4){
    od[i]=255; od[i+1]=255; od[i+2]=255; od[i+3]=255;
  }

  const offX = Math.floor((side - cw)/2);
  const offY = Math.floor((side - ch)/2);

  for (let y=0; y<ch; y++){
    for (let x=0; x<cw; x++){
      const v = bin[(yMin+y)*W + (xMin+x)] ? 0 : 255;
      const xx = offX + x;
      const yy = offY + y;
      const i = (yy*side + xx)*4;
      od[i]=v; od[i+1]=v; od[i+2]=v; od[i+3]=255;
    }
  }

  x1.putImageData(out, 0, 0);

  // immer 512x512 (Texify2 mag konsistente Größe)
  const c2 = document.createElement('canvas');
  c2.width = 512;
  c2.height = 512;
  const x2 = c2.getContext('2d', { willReadFrequently:true });
  x2.fillStyle = '#fff';
  x2.fillRect(0,0,512,512);
  x2.imageSmoothingEnabled = false;
  x2.drawImage(c1, 0,0, 512,512);

  return c2;
}

async function __ocrDigitGuard(engine, cropCanvas){
  // Varianten: (dilate 0/1) x (rot -6/0/+6)
  const variants = [];
  const base0 = __ocrPreprocessDigitCanvas(cropCanvas, { dilate:0 });
  const base1 = __ocrPreprocessDigitCanvas(cropCanvas, { dilate:1 });

  const angles = [0, -6, 6];
  for (let i=0;i<angles.length;i++){
    variants.push(__ocrRotateCanvas(base0, angles[i]));
  }
  for (let i=0;i<angles.length;i++){
    variants.push(__ocrRotateCanvas(base1, angles[i]));
  }

  const counts = {}; // candidate -> votes
  const order = [];  // stable order of first appearance

  for (let i=0;i<variants.length;i++){
    let raw = '';
    try{
      raw = await engine.recognize(variants[i], { max_new_tokens: 8, do_sample:false, temperature:0, __silent:true });
    }catch(_){
      continue;
    }

    let latex = __ocrCleanLatex(raw);
    latex = __ocrUnwrapRoman(latex);

    const cand = __ocrDigitCandidateFrom(latex);
    if (!cand) continue;

    if (!counts[cand]){ counts[cand] = 0; order.push(cand); }
    counts[cand] += 1;

    // Wenn wir 3 gleiche Stimmen haben, früh raus (schnell)
    if (counts[cand] >= 3) return cand;
  }

  // best vote
  let best = null;
  let bestV = 0;
  for (let i=0;i<order.length;i++){
    const k = order[i];
    const v = counts[k] || 0;
    if (v > bestV){ bestV = v; best = k; }
  }
  return best;
}



// -----------------------------
// Rect-Progress (Pseudo-Progress für Inference)
// -----------------------------
let __rectProgRAF = 0;
let __rectProgStart = 0;

function __rectProgSet01(v){
  if (!rectProg || !rectProgFill || !rectProgTxt) return;
  const p = Math.max(0, Math.min(1, Number(v)));
  rectProgFill.style.width = Math.round(p*100) + '%';
  rectProgTxt.textContent = Math.round(p*100) + '%';
}

function __rectProgShow(){
  if (!rectProg) return;
  rectProg.dataset.on = '1';
  __rectProgSet01(0);
  scheduleRectActionUpdate();
}

function __rectProgHide(){
  if (!rectProg) return;
  rectProg.dataset.on = '0';
  __rectProgSet01(0);
}

function __rectProgStartPseudo(){
  __rectProgShow();
  __rectProgStart = performance.now();

  const tick = () => {
    const t = performance.now() - __rectProgStart;

    // Kurve: schnell auf 70%, dann 90%, dann langsam bis 98%
    let v = 0;
    if (t < 900){
      v = (t/900) * 0.70;
    }else if (t < 2200){
      v = 0.70 + ((t-900)/1300) * 0.20;
    }else{
      v = 0.90 + Math.min(0.08, ((t-2200)/5000) * 0.08);
    }

    __rectProgSet01(v);
    __rectProgRAF = requestAnimationFrame(tick);
  };

  __rectProgRAF = requestAnimationFrame(tick);
}

function __rectProgStop(final01){
  if (__rectProgRAF){
    cancelAnimationFrame(__rectProgRAF);
    __rectProgRAF = 0;
  }
  __rectProgSet01(final01);

  // kurze “100% sichtbar” Phase, dann weg
  setTimeout(() => __rectProgHide(), 250);
}





async function __ocrFromMarkedRect({ auto=false } = {}){
  const rectItem = getRectItem();
  if (!rectItem){
    __ocrLog('No marker-rectangle found.');
    return;
  }

  const engine = window.__LIA_TEX_OCR__;
  if (!engine || !engine.recognize){
    __ocrLog('OCR engine not available (window.__LIA_TEX_OCR__).');
    return;
  }

    // UI: Button sperren
    const oldText = rectActionBtn.textContent;
    rectActionBtn.disabled = true;
    rectActionBtn.textContent = 'Schrifterkennung läuft...';
    __rectProgStartPseudo();


  try{
    // Modell sicher geladen
    if (engine.ensureLoaded) await engine.ensureLoaded(false);

    // Crop erzeugen
    const crop = __ocrCropFromRect(rectItem);
    if (!crop){
      __ocrLog('Crop failed (rect too small or out of bounds).');
      return;
    }

    // --- NEW: preferDigits NICHT am Marker-Rechteck festmachen,
    // sondern an der Ink-Boundingbox (tatsächliche Stiftpixel) im Crop.
    // Crop ist bereits Schwarz/Weiß (aus __ocrCropFromRect), daher reicht d[i] < 128.

    function __ocrInkBBoxQuick(src){
      try{
        const W = src.width|0, H = src.height|0;
        const x = src.getContext('2d', { willReadFrequently:true });
        const img = x.getImageData(0,0,W,H);
        const d = img.data;

        // Sampling, falls sehr groß (Performance)
        const step = (W * H > 1200000) ? 2 : 1;

        let xMin=W, yMin=H, xMax=-1, yMax=-1;
        let black = 0;

        for (let y=0; y<H; y+=step){
          const row = y * W * 4;
          for (let x0=0; x0<W; x0+=step){
            const i = row + x0*4;
            if (d[i] < 128){ // schwarz
              black++;
              if (x0 < xMin) xMin = x0;
              if (y  < yMin) yMin = y;
              if (x0 > xMax) xMax = x0;
              if (y  > yMax) yMax = y;
            }
          }
        }

        if (xMax < 0) return null;
        const w = xMax - xMin + 1;
        const h = yMax - yMin + 1;
        return { xMin,yMin,xMax,yMax,w,h,black,W,H };
      }catch(_){}
      return null;
    }

    const cropW = crop.width  | 0;
    const cropH = crop.height | 0;

    // Ink-Box statt Crop-Box
    const ink = __ocrInkBBoxQuick(crop);

    // sehr konservativ: nur echte Kurz-/Ziffern-Tokens
    const preferDigits = __ocrShouldPreferDigits(ink, crop);


    const modelName = String(engine.model || '');
    const isTrocr = modelName.toLowerCase().indexOf('trocr') !== -1;



      // 1x OCR mit möglichem Fallback aus dem Digit-Pfad in den normalen Math-Pfad

      let inputCanvas = crop;
      let raw = '';

      try{
        if (preferDigits){
          inputCanvas = __ocrPreprocessDigitCanvas(crop, { dilate: 0 });
        }else{
          inputCanvas = __ocrPreprocessCanvas(crop);
        }
      }catch(_){
        inputCanvas = crop;
      }

      try{
        inputCanvas = __ocrNormalizeSize(inputCanvas);
      }catch(_){}

      raw = await engine.recognize(
        inputCanvas,
        preferDigits
          ? { max_new_tokens: 16,  do_sample:false, temperature:0 }
          : { max_new_tokens: 128, do_sample:false, temperature:0 }
      );

      // Falls der Digit-Pfad versehentlich auf einen echten Math-Term angewendet wurde,
      // dann wirkt die Ausgabe oft "plötzlich abgeschnitten".
      // In diesem Fall rechnen wir einmal sauber im normalen Math-Pfad nach.
      if (preferDigits){
        const rawTrim = String(raw || '').trim();
        const looksMathy =
          rawTrim.indexOf('\\') !== -1 ||
          rawTrim.indexOf('{') !== -1 ||
          rawTrim.indexOf('}') !== -1 ||
          rawTrim.indexOf('^') !== -1 ||
          rawTrim.indexOf('_') !== -1 ||
          rawTrim.indexOf('sqrt') !== -1 ||
          rawTrim.indexOf('frac') !== -1;

        if (looksMathy || __ocrMathLooksIncomplete(rawTrim)){
          let retryCanvas = crop;

          try{
            retryCanvas = __ocrPreprocessCanvas(crop, {
              pad: 24,
              threshold: 205,
              dilateIters: 0,
              target: 640,
              minScale: 0.85,
              maxScale: 4.0
            });
          }catch(_){
            retryCanvas = crop;
          }

          try{
            retryCanvas = __ocrNormalizeSize(retryCanvas);
          }catch(_){}

          raw = await engine.recognize(
            retryCanvas,
            { max_new_tokens: 128, do_sample:false, temperature:0 }
          );
        }
      }




    // Clean je nach Modell
    function __ocrTidyMathText(s){
      const t = __ocrSquashWS(s);
      const ops = '+-=*/()[]{}';
      let out = '';
      for (let i=0;i<t.length;i++){
        const ch = t[i];
        if (ch === ' '){
          const prev = (i>0) ? t[i-1] : '';
          const next = (i+1<t.length) ? t[i+1] : '';
          if (ops.indexOf(prev) >= 0 || ops.indexOf(next) >= 0) continue;
          out += ' ';
        }else{
          out += ch;
        }
      }
      return out.trim();
    }

    let latex = '';
    if (isTrocr){
      latex = __ocrTidyMathText(raw);
    }else{
      latex = __ocrCleanLatex(raw);
      latex = __ocrUnwrapRoman(latex);
    }

    // --- NEW: Digit-Salvage auch dann, wenn Texify "Li" etc. liefert.
    // Wir triggern das, wenn preferDigits true ist ODER die Ausgabe sehr kurz ist und kein LaTeX enthält.

    function __ocrIsShortPlainToken(s){
      const t = String(s || '').trim();
      if (!t) return false;
      if (t.length > 6) return false;
      if (t.indexOf('\\') !== -1) return false;

      // mind. ein "digit-ish" Zeichen?
      let has = false;
      for (let i=0; i<t.length; i++){
        const c = t.charCodeAt(i);
        const ch = t[i];

        // 0-9
        if (c >= 48 && c <= 57){ has = true; continue; }

        // häufige OCR-Verwechsler, die wir als "digit-ish" zulassen
        if (ch === 'l' || ch === 'L' || ch === 'I' || ch === 'i' || ch === '|' || ch === '!' ||
            ch === 'O' || ch === 'o' || ch === 'Q' || ch === 'q' ||
            ch === 'S' || ch === 's' || ch === 'Z' || ch === 'z' ||
            ch === 'B' || ch === 'g'){
          has = true; continue;
        }

        // harmlose Klammern/Spaces: erlauben, aber zählen nicht als "has"
        if (ch === ' ' || ch === '\n' || ch === '\r' || ch === '\t') continue;
        if (ch === '(' || ch === ')' || ch === '[' || ch === ']' || ch === '{' || ch === '}' ) continue;
        if (ch === '.' || ch === ',' || ch === ':' || ch === ';' || ch === '_' || ch === '-') continue;

        // sonst: kein plain token
        return false;
      }
      return has;
    }

    const tryDigitSalvage = preferDigits || __ocrIsShortPlainToken(latex);

    if (tryDigitSalvage){
      // 1) direkt Kandidat extrahieren (sehr konservativ)
      const cand = __ocrDigitCandidateFrom(latex);
      if (cand){
        latex = cand;
      }else{
        // 2) bekannte Texify-Verwechslungen (dein Fix: "Li" -> "4", etc.)
        const fixed = __ocrFixDigitsIfPossible(latex);
        if (fixed) latex = fixed;
      }

      // 3) wenn immer noch keine Ziffern: Multi-Variante (Rotation/Dilation Voting)
      if (!__ocrIsAllDigits(latex)){
        const voted = await __ocrDigitGuard(engine, crop);
        if (voted) latex = voted;
      }
    }





    __ocrLog('OCR result: ' + latex);

    // In das Eingabefeld vor diesem @canvas schreiben
    const pair = wrap.closest('.lia-canvas-pair');
    const ok = __liaFindAndSetInputBeforeNode(pair || wrap, latex);

    if (!ok){
      __ocrLog('Could not find an input field before this @canvas.');
    }else{
      rectActionBtn.textContent = '✅ übernommen';
      setTimeout(() => { rectActionBtn.textContent = oldText; }, 900);
    }

  }catch(err){
    __ocrLog('OCR error: ' + (err && err.message ? err.message : String(err)));
    rectActionBtn.textContent = '⚠ Fehler';
    setTimeout(() => { rectActionBtn.textContent = oldText; }, 900);
  }finally{
    __rectProgStop(1);
    rectActionBtn.disabled = false;
  }
}











    // --- Button: manuell auslösen ---
    rectActionBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();

      await __ocrFromMarkedRect({ auto:false });

      // OPTIONAL: wenn du nach erfolgreicher Übergabe automatisch löschen willst:
      // clearMarkerRect();
    });






  // ---- Migration (alt: STROKES/REDO -> neu: ITEMS/REDO)
  let ITEMS = [];
  let REDO  = [];
  if (saved){
    if (Array.isArray(saved.ITEMS)){
      ITEMS = saved.ITEMS;
      REDO  = Array.isArray(saved.REDO) ? saved.REDO : [];
    } else if (Array.isArray(saved.STROKES)){
      ITEMS = saved.STROKES.map(st => ({ kind:'path', ...st }));
      REDO  = Array.isArray(saved.REDO) ? saved.REDO.map(st => ({ kind:'path', ...st })) : [];
    }
  }

  let tool = 'pen';
  let menuMode = 'pen';

  let colorIndex = 0;
  let penWidth = 3;
  let penAlpha = 1.0;
  let eraserWidth = 12;

  let bgMode = (saved && saved.bgMode) ? saved.bgMode : 'none';
  let bgStep = (saved && saved.bgStep) ? saved.bgStep : 24;

  // Highlight-Rechteck (Themefarbe) – Standard-Alpha
  const RECT_ALPHA = 0.28;

  let currentPath = null;
  let currentRect = null;

  function persist(reason){
    if (!uid) return;
    STORE[uid] = {
      VIEW: { ...VIEW },
      ITEMS,
      REDO,
      bgMode,
      bgStep,
      wrapW: wrap.getBoundingClientRect().width,
      canvasH: canvas.clientHeight
    };

    scheduleCanvasFreezeNotify(reason || 'persist');
  }

  function penBaseColor(){
    const c = COLORS[colorIndex] || COLORS[0];
    return (c.key === 'auto') ? getAutoPen() : (c.value || getAutoPen());
  }

  function setMenuOpen(open){
    if (!menu) return;
    menu.dataset.open = open ? '1' : '0';
  }

function autoCloseSubmenus(){
  if (!menu) return;
  if (menu.dataset.open === '1') setMenuOpen(false);
}



  function __menuCloseBtnSvg(){
    return `
      <svg viewBox="-1 0 24 24" aria-hidden="true" style="width:22px;height:22px;display:block;">
        <path class="ico-stroke" d="M6 6l12 12M18 6L6 18" stroke-width="2" stroke-linecap="round"/>
      </svg>
    `;
  }

  function __menuTrashSvg(){
    return `
      <svg viewBox="-1 0 24 24" aria-hidden="true" style="width:22px;height:22px;display:block;">
        <path class="ico-stroke" d="M9 3h6" stroke-width="2" stroke-linecap="round"/>
        <path class="ico-stroke" d="M4 6h16" stroke-width="2" stroke-linecap="round"/>
        <path class="ico-stroke" d="M7 6l1 15h8l1-15" stroke-width="2" stroke-linejoin="round"/>
        <path class="ico-stroke" d="M10 10v8M14 10v8" stroke-width="2" stroke-linecap="round"/>
      </svg>
    `;
  }

  function buildPenMenu(){
    if (!menu) return;
    menu.__mode = 'pen';

    const auto = getAutoPen();
    let html = '';

    html += `<span class="lia-heading-row">
      <span class="lia-tool-heading">Stift</span>
      <button class="lia-menu-icon-btn" type="button" data-act="close" aria-label="Schließen">${__menuCloseBtnSvg()}</button>
    </span>`;

    html += `<span class="lia-color-grid">`;
    for (let i = 0; i < COLORS.length; i++){
      const c = COLORS[i];
      const col = (c.key === 'auto') ? auto : (c.value || auto);
      const active = (i === colorIndex) ? '1' : '0';
      html += `<button class="lia-color-item" type="button" data-act="color" data-idx="${i}" data-active="${active}"
                style="background:${col};" aria-label="Farbe ${c.key}"></button>`;
    }
    html += `</span>`;

    // Width
    html += `<span class="lia-row">
      <span class="lia-preview"><span class="lia-preview-line" data-k="pw" style="height:${Math.max(2, Math.min(14, penWidth))}px;"></span></span>
      <input class="lia-slider" type="range" min="1" max="100" step="1" value="${penWidth}" data-act="penWidth" aria-label="Stiftbreite">
      <span style="font-weight:800;min-width:2.6em;text-align:right">${penWidth}</span>
    </span>`;

    // Alpha
    html += `<span class="lia-row">
      <span class="lia-preview"><span class="lia-preview-line" data-k="pa" style="opacity:${penAlpha};"></span></span>
      <input class="lia-slider" type="range" min="0.15" max="1" step="0.05" value="${penAlpha}" data-act="penAlpha" aria-label="Deckkraft">
      <span style="font-weight:800;min-width:2.6em;text-align:right">${Math.round(penAlpha*100)}%</span>
    </span>`;

    menu.innerHTML = html;

    menu.onclick = (e) => {
      const el = (e.target && e.target.closest) ? e.target.closest('[data-act]') : null;
      if (!el) return;
      const act = el.getAttribute('data-act');

      if (act === 'close'){
        setMenuOpen(false);
        return;
      }

      if (act === 'color'){
        const idx = Number(el.getAttribute('data-idx'));
        if (isFinite(idx)) colorIndex = clamp(idx, 0, COLORS.length - 1);
        tool = 'pen';
        updateUI();
        persist();
        buildPenMenu(); // refresh active ring
        return;
      }

      if (act === 'penWidth'){
        // handled via oninput below
        return;
      }

      if (act === 'penAlpha'){
        return;
      }
    };

    const w = menu.querySelector('input[data-act="penWidth"]');
    if (w){
      w.oninput = () => {
        penWidth = clamp(Number(w.value), 1, 100);
        updateUI();
        persist();
        const line = menu.querySelector('[data-k="pw"]');
        if (line) line.style.height = Math.max(2, Math.min(14, penWidth)) + 'px';
        const t = w.parentElement && w.parentElement.querySelector('span[style*="min-width"]');
        if (t) t.textContent = String(penWidth);
      };
    }

    const a = menu.querySelector('input[data-act="penAlpha"]');
    if (a){
      a.oninput = () => {
        penAlpha = clamp(Number(a.value), 0.05, 1);
        updateUI();
        persist();
        const line = menu.querySelector('[data-k="pa"]');
        if (line) line.style.opacity = String(penAlpha);
        const t = a.parentElement && a.parentElement.querySelector('span[style*="min-width"]');
        if (t) t.textContent = Math.round(penAlpha*100) + '%';
      };
    }
  }

  function buildEraserMenu(){
    if (!menu) return;
    menu.__mode = 'eraser';

    menu.innerHTML = `
      <span class="lia-heading-row">
        <span class="lia-tool-heading">Radierer</span>
        <span style="display:flex;gap:8px;align-items:center">
          <button class="lia-menu-icon-btn" type="button" data-act="clear" aria-label="Alles löschen">${__menuTrashSvg()}</button>
          <button class="lia-menu-icon-btn" type="button" data-act="close" aria-label="Schließen">${__menuCloseBtnSvg()}</button>
        </span>
      </span>

      <span class="lia-row">
        <span class="lia-preview"><span class="lia-preview-line" style="height:${Math.max(2, Math.min(18, eraserWidth))}px;"></span></span>
        <input class="lia-slider" type="range" min="4" max="500" step="1" value="${eraserWidth}" data-act="eraserWidth" aria-label="Radiererbreite">
        <span style="font-weight:800;min-width:2.6em;text-align:right">${eraserWidth}</span>
      </span>
    `;

    menu.onclick = (e) => {
      const el = (e.target && e.target.closest) ? e.target.closest('[data-act]') : null;
      if (!el) return;
      const act = el.getAttribute('data-act');

      if (act === 'close'){
        setMenuOpen(false);
        return;
      }
      if (act === 'clear'){
        clearAllDrawing();
        return;
      }
    };

    const w = menu.querySelector('input[data-act="eraserWidth"]');
    if (w){
      w.oninput = () => {
        eraserWidth = clamp(Number(w.value), 2, 500);
        updateUI();
        persist();
        const t = w.parentElement && w.parentElement.querySelector('span[style*="min-width"]');
        if (t) t.textContent = String(eraserWidth);
      };
    }
  }

  function buildBgMenu(){
    if (!menu) return;
    menu.__mode = 'bg';

    menu.innerHTML = `
      <span class="lia-heading-row">
        <span class="lia-tool-heading">Hintergrund</span>
        <button class="lia-menu-icon-btn" type="button" data-act="close" aria-label="Schließen">${__menuCloseBtnSvg()}</button>
      </span>

      <span class="lia-bg-tiles">
        <button class="lia-bg-tile" type="button" data-act="bg" data-mode="none"  data-active="${bgMode==='none'?'1':'0'}" aria-label="Kein Hintergrund"></button>
        <button class="lia-bg-tile" type="button" data-act="bg" data-mode="grid"  data-active="${bgMode==='grid'?'1':'0'}" aria-label="Kariert"></button>
        <button class="lia-bg-tile" type="button" data-act="bg" data-mode="lined" data-active="${bgMode==='lined'?'1':'0'}" aria-label="Liniert"></button>
      </span>

      <span class="lia-row">
        <span style="font-weight:800;opacity:.8;min-width:4.8em">Abstand</span>
        <input class="lia-slider" type="range" min="8" max="80" step="1" value="${bgStep}" data-act="bgStep" aria-label="Hintergrundabstand">
        <span style="font-weight:800;min-width:2.6em;text-align:right">${bgStep}</span>
      </span>
    `;

    // kleine Previews auf die Tiles (ohne externe Assets)
    try{
      const accent = rgbaFromAny(getAccentColor(), 0.65);
      const tiles = menu.querySelectorAll('.lia-bg-tile');
      if (tiles && tiles.length >= 3){
        // grid
        const g = tiles[1];
        g.style.backgroundImage =
          `linear-gradient(to right, ${accent} 2px, transparent 2px),
           linear-gradient(to bottom, ${accent} 2px, transparent 2px)`;
        g.style.backgroundSize = `10px 10px`;
        g.style.backgroundPosition = 'center';

        // lined
        const l = tiles[2];
        l.style.backgroundImage = `linear-gradient(to bottom, ${accent} 2px, transparent 2px)`;
        l.style.backgroundSize = `10px 10px`;
        l.style.backgroundPosition = 'center';
      }
    }catch(_){}

    menu.onclick = (e) => {
      const el = (e.target && e.target.closest) ? e.target.closest('[data-act]') : null;
      if (!el) return;
      const act = el.getAttribute('data-act');

      if (act === 'close'){
        setMenuOpen(false);
        return;
      }

      if (act === 'bg'){
        const m = String(el.getAttribute('data-mode') || 'none');
        bgMode = (m === 'grid' || m === 'lined') ? m : 'none';
        present();
        persist();
        buildBgMenu(); // refresh active rings
        updateUI();
        return;
      }
    };

    const s = menu.querySelector('input[data-act="bgStep"]');
    if (s){
      s.oninput = () => {
        bgStep = clamp(Number(s.value), 6, 300);
        present();
        persist();
        const t = s.parentElement && s.parentElement.querySelector('span[style*="min-width"]');
        if (t) t.textContent = String(bgStep);
      };
    }
  }




  function clearMarkerRect(){
    let removed = false;

    for (let i = ITEMS.length - 1; i >= 0; i--){
      if (ITEMS[i] && ITEMS[i].kind === 'rect'){ ITEMS.splice(i, 1); removed = true; }
    }
    for (let i = REDO.length - 1; i >= 0; i--){
      if (REDO[i] && REDO[i].kind === 'rect'){ REDO.splice(i, 1); removed = true; }
    }

    if (removed){
      rebuildHighlightLayer();
      present();
      updateUI();
      persist();
    }
    scheduleRectActionUpdate();
  }





  function getRectItem(){
    for (let i = ITEMS.length - 1; i >= 0; i--){
      const it = ITEMS[i];
      if (it && it.kind === 'rect') return it;
    }
    return null;
  }

  function clamp(v,a,b){ return Math.max(a, Math.min(b, v)); }

  function hideEraserRing(){
    if (!eraserRing) return;
    eraserRing.dataset.on = '0';
  }

  function updateEraserRingFromScreen(sx, sy){
    if (!eraserRing) return;

    // Nur im Radierer-Modus anzeigen
    if (tool !== 'eraser'){
      hideEraserRing();
      return;
    }

    if (!isFinite(sx) || !isFinite(sy)){
      hideEraserRing();
      return;
    }

    // WICHTIG:
    // tatsächliche sichtbare Radierergröße = eraserWidth * VIEW.scale
    const size = Math.max(8, eraserWidth * VIEW.scale);

    eraserRing.style.width = size + 'px';
    eraserRing.style.height = size + 'px';
    eraserRing.style.left = clamp(sx, 0, canvas.clientWidth) + 'px';
    eraserRing.style.top  = clamp(sy, 0, canvas.clientHeight) + 'px';
    eraserRing.dataset.on = '1';
  }

  let __rectBtnRAF = 0;
  function scheduleRectActionUpdate(){
    if (__rectBtnRAF) return;
    __rectBtnRAF = requestAnimationFrame(() => {
      __rectBtnRAF = 0;
      updateRectActionButton();
    });
  }

  function updateRectActionButton(){
    const it = getRectItem();
    if (!it){
      rectActionBtn.style.display = 'none';
      if (rectCloseBtn) rectCloseBtn.style.display = 'none';
      return;
    }

    // Button muss messbar sein
    rectActionBtn.style.display = 'block';
    rectActionBtn.style.visibility = 'hidden';

    const bw = rectActionBtn.offsetWidth  || 180;
    const bh = rectActionBtn.offsetHeight || 34;

    rectActionBtn.style.visibility = 'visible';

    const x0 = Math.min(it.x0, it.x1);
    const y0 = Math.min(it.y0, it.y1);
    const x1 = Math.max(it.x0, it.x1);
    const y1 = Math.max(it.y0, it.y1);

    const a = worldToScreen(x0, y0);
    const b = worldToScreen(x1, y1);

    const right  = Math.max(a.sx, b.sx);
    const bottom = Math.max(a.sy, b.sy);

    const pad = 6;
    const gap = 8; // Abstand unter dem Rechteck

    let left = right - bw;     // rechtsbündig am Rechteck
    let top  = bottom + gap;   // darunter

    // innerhalb der Canvas-Fläche halten
    left = clamp(left, pad, canvas.clientWidth  - bw - pad);
    top  = clamp(top,  pad, canvas.clientHeight - bh - pad);

    rectActionBtn.style.left = left + 'px';
    rectActionBtn.style.top  = top  + 'px';


    // --- Progressbar direkt UNTER dem Button positionieren ---
    if (rectProg){
      rectProg.style.width = bw + 'px';

      const gap2 = 6;
      let pLeft = left;
      let pTop  = top + bh + gap2;

      // wenn rectProg gerade hidden ist, ist offsetHeight 0 → fallback
      const pbH = rectProg.offsetHeight || 26;

      pLeft = clamp(pLeft, pad, canvas.clientWidth  - bw - pad);
      pTop  = clamp(pTop,  pad, canvas.clientHeight - pbH - pad);

      rectProg.style.left = pLeft + 'px';
      rectProg.style.top  = pTop  + 'px';
    }


      // ---- Close-Button oben rechts am Rechteck ----
    if (rectCloseBtn){
      rectCloseBtn.style.display = 'block';
      rectCloseBtn.style.visibility = 'hidden';

      const cbw = rectCloseBtn.offsetWidth  || 24;
      const cbh = rectCloseBtn.offsetHeight || 24;

      rectCloseBtn.style.visibility = 'visible';

      const topRect = Math.min(a.sy, b.sy);
      const rightRect = Math.max(a.sx, b.sx);

      const pad2 = 6;

      // Button leicht "auf" die Ecke setzen (halb über Eck), aber im Canvas halten
      let cLeft = rightRect - cbw * 0.5;
      let cTop  = topRect  - cbh * 0.5;

      cLeft = clamp(cLeft, pad2, canvas.clientWidth  - cbw - pad2);
      cTop  = clamp(cTop,  pad2, canvas.clientHeight - cbh - pad2);

      rectCloseBtn.style.left = cLeft + 'px';
      rectCloseBtn.style.top  = cTop  + 'px';
    }
  }





  function screenToWorld(sx, sy){
    return { x: (sx - VIEW.panX) / VIEW.scale, y: (sy - VIEW.panY) / VIEW.scale };
  }
  function worldToScreen(wx, wy){
    return { sx: wx * VIEW.scale + VIEW.panX, sy: wy * VIEW.scale + VIEW.panY };
  }

  function worldBounds(){
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    return {
      x0: (0 - VIEW.panX) / VIEW.scale,
      y0: (0 - VIEW.panY) / VIEW.scale,
      x1: (w - VIEW.panX) / VIEW.scale,
      y1: (h - VIEW.panY) / VIEW.scale
    };
  }

  function drawBackground(){
    if (bgMode === 'none') return;

    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr*VIEW.scale, 0, 0, dpr*VIEW.scale, dpr*VIEW.panX, dpr*VIEW.panY);

    const step = Math.max(6, Number(bgStep) || 24);
    const b = worldBounds();

    const col = rgbaFromAny(getAccentColor(), 0.65);

    ctx.save();
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1.0;
    ctx.strokeStyle = col;
    ctx.lineWidth = 1.125 / VIEW.scale;

    const xStart = Math.floor(b.x0 / step) * step;
    const xEnd   = Math.ceil (b.x1 / step) * step;
    const yStart = Math.floor(b.y0 / step) * step;
    const yEnd   = Math.ceil (b.y1 / step) * step;

    const maxLines = 4000;

    if (bgMode === 'grid'){
      let count = 0;
      ctx.beginPath();
      for (let x = xStart; x <= xEnd; x += step){
        ctx.moveTo(x, b.y0);
        ctx.lineTo(x, b.y1);
        if (++count > maxLines) break;
      }
      for (let y = yStart; y <= yEnd; y += step){
        ctx.moveTo(b.x0, y);
        ctx.lineTo(b.x1, y);
        if (++count > maxLines) break;
      }
      ctx.stroke();
    }

    if (bgMode === 'lined'){
      let count = 0;
      ctx.beginPath();
      for (let y = yStart; y <= yEnd; y += step){
        ctx.moveTo(b.x0, y);
        ctx.lineTo(b.x1, y);
        if (++count > maxLines) break;
      }
      ctx.stroke();
    }

    ctx.restore();
  }

  function setViewportTransformOn(ctx2){
    const dpr = window.devicePixelRatio || 1;
    ctx2.setTransform(dpr*VIEW.scale, 0, 0, dpr*VIEW.scale, dpr*VIEW.panX, dpr*VIEW.panY);
  }

  function clearLayer(ctx2){
    const dpr = window.devicePixelRatio || 1;
    ctx2.setTransform(dpr,0,0,dpr,0,0);
    ctx2.globalCompositeOperation = 'source-over';
    ctx2.globalAlpha = 1;
    ctx2.clearRect(0,0,canvas.clientWidth,canvas.clientHeight);
  }

  function applyPathStyleTo(ctx2, it){
    if (it.tool === 'eraser'){
      ctx2.globalCompositeOperation = 'destination-out';
      ctx2.globalAlpha = 1.0;
      ctx2.strokeStyle = 'rgba(0,0,0,1)';
      ctx2.lineWidth = it.width;
    }else{
      ctx2.globalCompositeOperation = 'source-over';
      ctx2.globalAlpha = it.alpha;
      ctx2.strokeStyle = it.color;
      ctx2.lineWidth = it.width;
    }
    ctx2.lineCap = 'round';
    ctx2.lineJoin = 'round';
  }

  function rebuildHighlightLayer(){
    clearLayer(hctx);
    setViewportTransformOn(hctx);

    for (const it of ITEMS){
      if (!it || it.kind !== 'rect') continue;

      const colBase = (it.colorKey === 'accent') ? getAccentColor() : (it.color || getAccentColor());
      const fillCol = rgbaFromAny(colBase, Math.max(0, Math.min(1, it.alpha)));

      const x0 = Math.min(it.x0, it.x1);
      const y0 = Math.min(it.y0, it.y1);
      const x1 = Math.max(it.x0, it.x1);
      const y1 = Math.max(it.y0, it.y1);

      hctx.save();
      hctx.globalCompositeOperation = 'source-over';
      hctx.globalAlpha = 1.0;
      hctx.fillStyle = fillCol;
      hctx.fillRect(x0, y0, Math.max(0, x1-x0), Math.max(0, y1-y0));
      hctx.restore();
    }
  }

  function rebuildStrokeLayer(){
    clearLayer(sctx);
    setViewportTransformOn(sctx);

    for (const it of ITEMS){
      if (!it || it.kind !== 'path') continue;
      if (!it.points || it.points.length < 2) continue;

      applyPathStyleTo(sctx, it);
      sctx.beginPath();
      sctx.moveTo(it.points[0].x, it.points[0].y);
      for (let i=1;i<it.points.length;i++){
        const p = it.points[i];
        sctx.lineTo(p.x, p.y);
      }
      sctx.stroke();
    }
  }

  function clearMain(){
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr,0,0,dpr,0,0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.clearRect(0,0,canvas.clientWidth,canvas.clientHeight);
  }

  function present(){
    clearMain();
    drawBackground();

    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr,0,0,dpr,0,0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1.0;

    // 1) Highlights
    ctx.drawImage(
      hiLayer,
      0,0, hiLayer.width, hiLayer.height,
      0,0, canvas.clientWidth, canvas.clientHeight
    );

    // 1b) Preview-Rechteck (während Drag)
    if (currentRect){
      const col = rgbaFromAny(getAccentColor(), RECT_ALPHA);
      const x0 = Math.min(currentRect.x0, currentRect.x1);
      const y0 = Math.min(currentRect.y0, currentRect.y1);
      const x1 = Math.max(currentRect.x0, currentRect.x1);
      const y1 = Math.max(currentRect.y0, currentRect.y1);

      const a = worldToScreen(x0,y0);
      const b = worldToScreen(x1,y1);

      ctx.save();
      ctx.fillStyle = col;
      ctx.globalAlpha = 1.0;
      ctx.fillRect(a.sx, a.sy, Math.max(0, b.sx-a.sx), Math.max(0, b.sy-a.sy));
      ctx.restore();
    }

    // 2) Striche
    ctx.drawImage(
      strokeLayer,
      0,0, strokeLayer.width, strokeLayer.height,
      0,0, canvas.clientWidth, canvas.clientHeight
    );
    scheduleRectActionUpdate();
  }

  // -------- UI / Menüs (dein bestehendes Menü bleibt; wir schließen es fürs Rechteck-Tool)
  function updateMenuVisuals(){
    // dein bestehender Code (Pen/BG/Eraser) bleibt unverändert
    // -> wir rufen weiterhin updateMenuVisuals() unten, aber ändern hier nichts.
  }

  function updateUI(){
    const col = penBaseColor();
    const accent = getAccentColor();

    if (btnUndo){
      btnUndo.disabled = (ITEMS.length === 0);
      btnUndo.title = 'Rückgängig';
    }
    if (btnRedo){
      btnRedo.disabled = (REDO.length === 0);
      btnRedo.title = 'Wiederherstellen';
    }

    if (btnColor){
      btnColor.style.background = col;
      btnColor.dataset.active = (tool === 'pen') ? '1' : '0';
      btnColor.title = 'Stift';
    }
    if (btnEraser){
      btnEraser.dataset.active = (tool === 'eraser') ? '1' : '0';
      btnEraser.title = 'Radierer';
    }

    // NEU: Rechteck-Tool Button
    if (btnRect){
      btnRect.style.background = 'transparent';
      btnRect.dataset.active = (tool === 'rect') ? '1' : '0';
      btnRect.title = 'Marker-Rechteck';
    }

    if (btnBg){
      const gridCol = rgbaFromAny(accent, 0.65);
      const s = 6;
      const t = 1.8;

      btnBg.style.backgroundColor = 'transparent';
      btnBg.style.backgroundImage =
        `linear-gradient(to right, ${gridCol} ${t}px, transparent ${t}px),
         linear-gradient(to bottom, ${gridCol} ${t}px, transparent ${t}px)`;
      btnBg.style.backgroundSize = `${s}px ${s}px`;
      btnBg.style.backgroundPosition = 'center';

      btnBg.dataset.active = (menuMode === 'bg') ? '1' : '0';
      btnBg.title = 'Hintergrund';
    }

    // falls du deine alten Menü-Visuals nutzen willst:
    try{ updateMenuVisuals(); }catch(_){}

    if (tool !== 'eraser'){
      hideEraserRing();
    }
  }

  // ---- Undo/Redo (über ALLE Items)
  function doUndo(){
    if (!ITEMS.length) return;
    const it = ITEMS.pop();
    REDO.push(it);
    rebuildHighlightLayer();
    rebuildStrokeLayer();
    present();
    updateUI();
    persist();
  }
  function doRedo(){
    if (!REDO.length) return;
    const it = REDO.pop();
    ITEMS.push(it);
    rebuildHighlightLayer();
    rebuildStrokeLayer();
    present();
    updateUI();
    persist();
  }

  function clearAllDrawing(){
    ITEMS.length = 0;
    REDO.length = 0;
    rebuildHighlightLayer();
    rebuildStrokeLayer();
    present();
    updateUI();
    persist();
  }

  // ---- Zeichnen: Path
  function startStrokeAtScreen(sx,sy){
    const w = screenToWorld(sx,sy);
    const it = {
      kind:'path',
      tool,
      color: penBaseColor(),
      alpha: penAlpha,
      width: (tool === 'eraser') ? eraserWidth : penWidth,
      points: [ {x:w.x, y:w.y} ]
    };
    ITEMS.push(it);
    currentPath = it;
    REDO.length = 0;

    setViewportTransformOn(sctx);
    applyPathStyleTo(sctx, it);
    sctx.beginPath();
    sctx.moveTo(w.x, w.y);

    updateUI();
    persist();
  }

  function extendStrokeToScreen(sx,sy){
    if (!currentPath) return;
    const w = screenToWorld(sx,sy);
    currentPath.points.push({x:w.x,y:w.y});
    sctx.lineTo(w.x, w.y);
    sctx.stroke();
    present();
    persist();
  }
  function endStroke(){ currentPath = null; }

  // ---- Zeichnen: Rechteck (Highlight)
  function startRectAtScreen(sx,sy){
    const w = screenToWorld(sx,sy);
    currentRect = { x0:w.x, y0:w.y, x1:w.x, y1:w.y };
  }
  function updateRectToScreen(sx,sy){
    if (!currentRect) return;
    const w = screenToWorld(sx,sy);
    currentRect.x1 = w.x;
    currentRect.y1 = w.y;
    present();
  }
  function finishRect(commit){
    if (!currentRect) return;
    if (commit){
      const x0 = Math.min(currentRect.x0, currentRect.x1);
      const y0 = Math.min(currentRect.y0, currentRect.y1);
      const x1 = Math.max(currentRect.x0, currentRect.x1);
      const y1 = Math.max(currentRect.y0, currentRect.y1);

      // Tiny-Rect wegwerfen
      const w = x1 - x0;
      const h = y1 - y0;
      if (w > 1e-3 && h > 1e-3){

      // ✅ es darf nur EIN Marker-Rechteck geben → alte löschen
        for (let i = ITEMS.length - 1; i >= 0; i--){
          if (ITEMS[i] && ITEMS[i].kind === 'rect') ITEMS.splice(i, 1);
        }
        for (let i = REDO.length - 1; i >= 0; i--){
          if (REDO[i] && REDO[i].kind === 'rect') REDO.splice(i, 1);
        }

        ITEMS.push({
          kind:'rect',
          x0, y0, x1, y1,
          alpha: RECT_ALPHA,
          colorKey: 'accent'   // -> bleibt Themefarbe
        });
        REDO.length = 0;
      }
    }
    currentRect = null;
    rebuildHighlightLayer();
    present();
    updateUI();
    persist();
    scheduleRectActionUpdate();

    // Optional: automatisch OCR starten, wenn ein Marker-Rechteck committed wurde
    // (nicht in present()!)
    // try{ __ocrFromMarkedRect({ auto:true }); }catch(_){}


  }

  // ---- Resize
  function resizeToCss(){
    hideEraserRing();
    const dpr = window.devicePixelRatio || 1;
    const cssW = canvas.clientWidth;
    const cssH = canvas.clientHeight;
    const pxW = Math.max(1, Math.round(cssW * dpr));
    const pxH = Math.max(1, Math.round(cssH * dpr));

    canvas.width = pxW;
    canvas.height = pxH;

    hiLayer.width = pxW;
    hiLayer.height = pxH;

    strokeLayer.width = pxW;
    strokeLayer.height = pxH;

    rebuildHighlightLayer();
    rebuildStrokeLayer();
    present();
    updateUI();
    persist();
  }

  updateUI();
  resizeToCss();

  const ro = new ResizeObserver(() => resizeToCss());
  ro.observe(canvas);


// ---------------------------------
// Resize-Corners (links/rechts unten)
// ---------------------------------
function ensureCorners(){
  if (wrap.__cornersReady) return;
  wrap.__cornersReady = true;

  const bl = document.createElement('button');
  bl.type = 'button';
  bl.className = 'lia-resize-corner';
  bl.dataset.corner = 'bl';
  bl.setAttribute('aria-label','Zeichenfläche ziehen (links unten)');

  const br = document.createElement('button');
  br.type = 'button';
  br.className = 'lia-resize-corner';
  br.dataset.corner = 'br';
  br.setAttribute('aria-label','Zeichenfläche ziehen (rechts unten)');

  wrap.appendChild(bl);
  wrap.appendChild(br);

  const MIN_H = 130;
  const MAX_H = 9000;
  const MIN_W = 200;

  const clamp = (v,a,b) => Math.max(a, Math.min(b, v));

  function containerMaxWidth(){
    const mount = wrap.closest('.lia-canvas-mount');
    let host = mount || wrap.parentElement || wrap;

    let w = 0;
    try{ w = host.getBoundingClientRect().width; }catch(_){}

    if ((!w || w < MIN_W) && document.querySelector('main')){
      try{ w = document.querySelector('main').getBoundingClientRect().width; }catch(_){}
    }

    return Math.max(MIN_W, Math.floor(w || MIN_W));
  }

  function bindCorner(handle, side){
    let resizing = false;
    let startX = 0, startY = 0;
    let startW = 0, startH = 0;

    function down(e){
      autoCloseSubmenus();
      e.preventDefault();
      e.stopPropagation();
      resizing = true;

      startW = wrap.getBoundingClientRect().width;
      startH = canvas.clientHeight || 245;
      startX = e.clientX;
      startY = e.clientY;

      try{ handle.setPointerCapture(e.pointerId); }catch(_){}
    }

    function move(e){
      if (!resizing) return;
      e.preventDefault();

      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      const nextH = clamp(startH + dy, MIN_H, MAX_H);
      canvas.style.height = nextH + 'px';

      const maxW = containerMaxWidth();
      const nextW = (side === 'br')
        ? clamp(startW + dx, MIN_W, maxW)
        : clamp(startW - dx, MIN_W, maxW);

      wrap.style.width = nextW + 'px';

      // ResizeObserver feuert resizeToCss() automatisch (Canvas ist 100% Breite)
    }

    function up(e){
      if (!resizing) return;
      resizing = false;
      try{ handle.releasePointerCapture(e.pointerId); }catch(_){}

      // sicherstellen, dass Pixel-Buffer final passt:
      resizeToCss();
      persist();
    }

    handle.addEventListener('pointerdown', down);
    handle.addEventListener('pointermove', move);
    handle.addEventListener('pointerup', up);
    handle.addEventListener('pointercancel', up);
  }

  bindCorner(br, 'br');
  bindCorner(bl, 'bl');
}

ensureCorners();



  document.addEventListener('lia-canvas-theme', () => {
    updateUI();
    rebuildHighlightLayer();
    rebuildStrokeLayer();
    present();
  });

  // ---- Buttons
  if (btnUndo && !btnUndo.__bound){
    btnUndo.__bound = true;
    btnUndo.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); doUndo(); });
  }
  if (btnRedo && !btnRedo.__bound){
    btnRedo.__bound = true;
    btnRedo.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); doRedo(); });
  }

  if (btnRect && !btnRect.__bound){
    btnRect.__bound = true;
    btnRect.addEventListener('click', (e) => {
      e.stopPropagation();
      tool = 'rect';
      menuMode = 'rect';
      setMenuOpen(false);
      updateUI();
    });
  }

  // Menüs: Stift / Radierer / Hintergrund -> wie gehabt, aber Rechteck schließt Menu
  if (btnColor && menu){
    btnColor.addEventListener('click', (e) => {
      e.stopPropagation();
      tool = 'pen';
      menuMode = 'pen';
      const open = menu.dataset.open === '1';
      const same = (menu.__mode === 'pen');
      if (!open || !same) buildPenMenu();
      setMenuOpen(!open || !same);
      updateUI();
    });
  }

  if (btnEraser && menu){
    btnEraser.addEventListener('click', (e) => {
      e.stopPropagation();
      tool = 'eraser';
      menuMode = 'eraser';
      const open = menu.dataset.open === '1';
      const same = (menu.__mode === 'eraser');
      if (!open || !same) buildEraserMenu();
      setMenuOpen(!open || !same);
      updateUI();
    });
  }

  if (btnBg && menu){
    btnBg.addEventListener('click', (e) => {
      e.stopPropagation();
      menuMode = 'bg';
      const open = menu.dataset.open === '1';
      const same = (menu.__mode === 'bg');
      if (!open || !same) buildBgMenu();
      setMenuOpen(!open || !same);
      updateUI();
    });
  }

  document.addEventListener('click', (e) => { if (!wrap.contains(e.target)) setMenuOpen(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenuOpen(false); });

  // ---- Pan/Zoom (wie bei dir)
  let spaceDown = false;
  window.addEventListener('keydown', (e) => { if (e.code === 'Space') spaceDown = true; });
  window.addEventListener('keyup',   (e) => { if (e.code === 'Space') spaceDown = false; });

  canvas.addEventListener('contextmenu', (e) => e.preventDefault());

  function clampScale(s){ return Math.max(VIEW.minScale, Math.min(VIEW.maxScale, s)); }

  function zoomAboutScreenPoint(factor, sx, sy){
    const oldS = VIEW.scale;
    const newS = clampScale(oldS * factor);
    if (newS === oldS) return;

    const w = screenToWorld(sx, sy);
    VIEW.scale = newS;
    VIEW.panX = sx - w.x * newS;
    VIEW.panY = sy - w.y * newS;

    rebuildHighlightLayer();
    rebuildStrokeLayer();
    present();
    persist();
  }

  canvas.addEventListener('wheel', (e) => {  
    autoCloseSubmenus();         
    e.preventDefault();
    hideEraserRing();

    const r = canvas.getBoundingClientRect();
    const sx = e.clientX - r.left;
    const sy = e.clientY - r.top;
    const factor = Math.exp(-e.deltaY * 0.0012);
    zoomAboutScreenPoint(factor, sx, sy);
  }, { passive:false });

  // ---- Pointer Handling
  const pointers = new Map();
  let mode = 'idle';
  let lastPanSX = 0, lastPanSY = 0;
  let pinchStart = null;

  function getScreenPos(evt){
    const r = canvas.getBoundingClientRect();
    return { sx: evt.clientX - r.left, sy: evt.clientY - r.top };
  }
  function dist(a,b){
    const dx = a.sx - b.sx, dy = a.sy - b.sy;
    return Math.hypot(dx,dy);
  }
  function mid(a,b){
    return { sx: (a.sx+b.sx)/2, sy: (a.sy+b.sy)/2 };
  }

  canvas.addEventListener('pointerdown', (e) => {
    autoCloseSubmenus();    
    if (e.target && e.target.classList && e.target.classList.contains('lia-resize-corner')) return;

    const p = getScreenPos(e);
    pointers.set(e.pointerId, p);
    canvas.setPointerCapture(e.pointerId);

    if (pointers.size === 2){
      hideEraserRing();
      if (mode === 'draw') endStroke();
      if (mode === 'rect') finishRect(false); // abbrechen, wenn pinch startet

      const arr = Array.from(pointers.values());
      const m = mid(arr[0], arr[1]);
      const d = Math.max(1e-6, dist(arr[0], arr[1]));
      const worldMid = screenToWorld(m.sx, m.sy);

      pinchStart = { dist:d, worldMid, startScale:VIEW.scale };
      mode = 'pinch';
      return;
    }

    const isRightMouse = (e.pointerType === 'mouse' && e.button === 2);
    const isMiddleMouse= (e.pointerType === 'mouse' && e.button === 1);
    const wantPan = isRightMouse || isMiddleMouse || (e.pointerType === 'mouse' && spaceDown);

    if (wantPan){
      hideEraserRing();
      mode = 'pan';
      lastPanSX = p.sx;
      lastPanSY = p.sy;
      canvas.style.cursor = 'grab';
      return;
    }

    if (tool === 'rect'){
      hideEraserRing();
      mode = 'rect';
      canvas.style.cursor = 'crosshair';
      startRectAtScreen(p.sx, p.sy);
      present();
      return;
    }

    mode = 'draw';
    canvas.style.cursor = 'crosshair';
    startStrokeAtScreen(p.sx, p.sy);

    if (tool === 'eraser'){
      updateEraserRingFromScreen(p.sx, p.sy);
    }else{
      hideEraserRing();
    }
  });

  canvas.addEventListener('pointermove', (e) => {
    if (!pointers.has(e.pointerId)) return;

    const p = getScreenPos(e);
    pointers.set(e.pointerId, p);

    if (tool === 'eraser' && mode !== 'pan' && mode !== 'pinch' && mode !== 'rect'){
      updateEraserRingFromScreen(p.sx, p.sy);
    }else{
      hideEraserRing();
    }

    if (mode === 'pinch' && pointers.size >= 2 && pinchStart){
      const arr = Array.from(pointers.values()).slice(0,2);
      const m = mid(arr[0], arr[1]);
      const d = Math.max(1e-6, dist(arr[0], arr[1]));
      const factor = d / pinchStart.dist;

      const newScale = clampScale(pinchStart.startScale * factor);
      VIEW.scale = newScale;
      VIEW.panX = m.sx - pinchStart.worldMid.x * newScale;
      VIEW.panY = m.sy - pinchStart.worldMid.y * newScale;

      rebuildHighlightLayer();
      rebuildStrokeLayer();
      present();
      persist();
      return;
    }

    if (mode === 'pan'){
      const dx = p.sx - lastPanSX;
      const dy = p.sy - lastPanSY;
      lastPanSX = p.sx;
      lastPanSY = p.sy;
      VIEW.panX += dx;
      VIEW.panY += dy;

      rebuildHighlightLayer();
      rebuildStrokeLayer();
      present();
      persist();
      return;
    }

    if (mode === 'rect'){
      updateRectToScreen(p.sx, p.sy);
      return;
    }

    if (mode === 'draw'){
      extendStrokeToScreen(p.sx, p.sy);
    }
  });

  function stopPointer(e){
    hideEraserRing();
    if (pointers.has(e.pointerId)) pointers.delete(e.pointerId);
    try{ canvas.releasePointerCapture(e.pointerId); }catch(_){}

    if (mode === 'pinch'){
      if (pointers.size < 2){
        pinchStart = null;
        mode = 'idle';
      }
      return;
    }

    if (mode === 'pan'){
      mode = 'idle';
      canvas.style.cursor = 'crosshair';
      return;
    }

    if (mode === 'rect'){
      if (pointers.size === 0){
        finishRect(true);
        mode = 'idle';
      }
      return;
    }

    if (mode === 'draw'){
      endStroke();
      mode = 'idle';
      updateUI();
      persist();
      return;
    }
  }

  canvas.addEventListener('pointerup', stopPointer);
  canvas.addEventListener('pointercancel', stopPointer);
  canvas.addEventListener('pointerleave', () => {
    hideEraserRing();
    if (mode === 'draw') endStroke();
    if (mode !== 'pinch') mode = 'idle';
    canvas.style.cursor = 'crosshair';
    updateUI();
    persist();
  });

  // ---- Trash (dein buildEraserMenu nutzt clearAllDrawing)
  // Wichtig: buildEraserMenu() muss weiterhin clearAllDrawing() aufrufen (wie vorher).

  __liaCanvasFreezeNotifyArmed = true;
}


function initAll(){
  document.querySelectorAll('.lia-draw-wrap canvas.lia-draw:not([data-ready])').forEach(c => {
    c.setAttribute('data-ready','1');
    setupCanvas(c);
  });

  __liaInitTexPreviews();
}

  // init: wenn Canvas markup in mount erscheint
  const obs = new MutationObserver(() => initAll());
  obs.observe(document.body, { childList:true, subtree:true });
  initAll();

  // ---------------------------------------------------------
  // LAUNCHER: Toggle (Mount ist im Makro vorhanden!)
  // ---------------------------------------------------------
  if (!window.__liaCanvasLauncherBound){
    window.__liaCanvasLauncherBound = true;

    document.addEventListener('click', (e) => {
      const btn = (e.target && e.target.closest) ? e.target.closest('.lia-canvas-launch') : null;
      if (!btn) return;

const pair = btn.closest('.lia-canvas-pair');
if (!pair) return;

const mount = pair.querySelector('.lia-canvas-mount');
if (!mount) return;

// Runtime-UID vergeben (Store-Key)
ensureMountUID(mount);



      // Wenn wir in einem flex-nowrap Wrapper sitzen (z.B. bei [[..]]), erzwingen wir Umbruch
      try{
        const parent = mount.parentElement;
        if (parent){
          const cs = getComputedStyle(parent);
          if (cs && String(cs.display).includes('flex') && String(cs.flexWrap) === 'nowrap'){
            parent.style.flexWrap = 'wrap';
          }
        }
      }catch(_){}


      const isOpen = mount.dataset.open === '1';

      if (!isOpen){
        mount.dataset.open = '1';

        if (!mount.querySelector('.lia-draw-wrap')){
          mount.innerHTML = canvasMarkup();
          initAll();
        }
      }else{
        mount.dataset.open = '0';
      }
    }, true);
  }
})();

