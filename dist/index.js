!function(e,t,a,n,r){var i="u">typeof globalThis?globalThis:"u">typeof self?self:"u">typeof window?window:"u">typeof global?global:{},o="function"==typeof i[n]&&i[n],l=o.i||{},s=o.cache||{},c="u">typeof module&&"function"==typeof module.require&&module.require.bind(module);function d(t,a){if(!s[t]){if(!e[t]){if(r[t])return r[t];var l="function"==typeof i[n]&&i[n];if(!a&&l)return l(t,!0);if(o)return o(t,!0);if(c&&"string"==typeof t)return c(t);var u=Error("Cannot find module '"+t+"'");throw u.code="MODULE_NOT_FOUND",u}h.resolve=function(a){var n=e[t][1][a];return null!=n?n:a},h.cache={};var p=s[t]=new d.Module(t);e[t][0].call(p.exports,h,p,p.exports,i)}return s[t].exports;function h(e){var t=h.resolve(e);if(!1===t)return{};if(Array.isArray(t)){var a={__esModule:!0};return t.forEach(function(e){var t=e[0],n=e[1],r=e[2]||e[0],i=d(n);"*"===t?Object.keys(i).forEach(function(e){"default"===e||"__esModule"===e||Object.prototype.hasOwnProperty.call(a,e)||Object.defineProperty(a,e,{enumerable:!0,get:function(){return i[e]}})}):"*"===r?Object.defineProperty(a,t,{enumerable:!0,value:i}):Object.defineProperty(a,t,{enumerable:!0,get:function(){return"default"===r?i.__esModule?i.default:i:i[r]}})}),a}return d(t)}}d.isParcelRequire=!0,d.Module=function(e){this.id=e,this.bundle=d,this.require=c,this.exports={}},d.modules=e,d.cache=s,d.parent=o,d.distDir=void 0,d.publicUrl=void 0,d.devServer=void 0,d.i=l,d.register=function(t,a){e[t]=[function(e,t){t.exports=a},{}]},Object.defineProperty(d,"root",{get:function(){return i[n]}}),i[n]=d;for(var u=0;u<t.length;u++)d(t[u]);if(a){var p=d(a);"object"==typeof exports&&"u">typeof module?module.exports=p:"function"==typeof define&&define.amd&&define(function(){return p})}}({bZBjE:[function(e,t,a,n){var r=e("@parcel/transformer-js/src/esmodule-helpers.js");r.defineInteropFlag(a),r.export(a,"getRootWindow",()=>d),r.export(a,"LIA",()=>u);var i=e("./ocr/bar"),o=e("./ocr/engine"),l=e("./canvas/theme"),s=e("./canvas/freeze"),c=e("./canvas/index");function d(){let e=window;try{for(;e.parent&&e.parent!==e;)e=e.parent}catch(e){}return e}let u=window.__LIA_CANVAS_OCR__=window.__LIA_CANVAS_OCR__||{SHOW_BAR:!1,bar:null,ocr:null,tfjs:null,tfjsLoad:null,store:{},uidSeq:0,freeze:{},barBoot:!1,canvasBoot:!1,launcherBound:!1},p=d(),h="__LIA_CANVAS_OCR_REG_V1__";p[h]=p[h]||{inited:{}};let g=document.baseURI||location.href;p[h].inited[g]||(p[h].inited[g]=!0,function(){if(!u.barBoot){u.barBoot=!0,(0,i.ensureOcrBar)();let e=()=>{try{let e=(0,l.getAccentColor)(document);e&&document.documentElement.style.setProperty("--canvas-accent",e)}catch(e){}};e(),setTimeout(e,0)}(0,l.applyThemeVars)(),new MutationObserver(()=>(0,l.applyThemeVars)()).observe(document.documentElement,{attributes:!0,attributeFilter:["class","style"]}),window.addEventListener("resize",()=>(0,l.applyThemeVars)()),!u.canvasBoot&&(u.canvasBoot=!0,u.uidSeq=u.uidSeq||0,(0,o.ensureOcrEngine)(),(0,s.ensureCanvasFreezeApi)(),(0,c.initAll)(),u.launcherBound||(u.launcherBound=!0,document.addEventListener("click",e=>{let t=e.target?.closest?.(".lia-canvas-launch");if(!t)return;let a=t.closest(".lia-canvas-pair");if(!a)return;let n=a.querySelector(".lia-canvas-mount");if(n){n.dataset.uid||(u.uidSeq=(u.uidSeq||0)+1,n.dataset.uid="c"+u.uidSeq);try{let e=n.parentElement;if(e){let t=getComputedStyle(e);String(t.display).includes("flex")&&"nowrap"===String(t.flexWrap)&&(e.style.flexWrap="wrap")}}catch(e){}"1"!==n.dataset.open?(n.dataset.open="1",n.querySelector(".lia-draw-wrap")||(n.innerHTML=(0,c.canvasMarkup)(),(0,c.initAll)())):n.dataset.open="0"}},!0)))}())},{"./ocr/bar":"hlAaK","./ocr/engine":"bEGKb","./canvas/theme":"9gAEw","./canvas/freeze":"cCz1j","./canvas/index":"2KvOo","@parcel/transformer-js/src/esmodule-helpers.js":"9p1zA"}],hlAaK:[function(e,t,a,n){var r=e("@parcel/transformer-js/src/esmodule-helpers.js");r.defineInteropFlag(a),r.export(a,"ensureOcrBar",()=>s);var i=e("../index"),o=e("../canvas/theme"),l=e("../lia/i18n");function s(){let e=!0===i.LIA.SHOW_BAR,t=(e,t)=>(0,l.liaT)("ocr."+e,t);if((0,o.ensureCss)(),i.LIA.bar&&i.LIA.bar.__i18nListener&&(document.removeEventListener("lia:canvas-i18n-update",i.LIA.bar.__i18nListener),delete(0,i.LIA).bar.__i18nListener),i.LIA.bar&&i.LIA.bar.el&&i.LIA.bar.el.isConnected){try{let t=i.LIA.bar.el,a=document.body||document.documentElement;t.parentNode!==a&&a.appendChild(t),t.style.display=e?"":"none",t.setAttribute("aria-hidden",e?"false":"true");let n=i.LIA.bar.loadEl;n&&n.parentNode!==a&&a.appendChild(n)}catch(e){}return i.LIA.bar}let a=document.body||document.documentElement,n=document.createElement("div");n.className="lia-ocr-loadwrap",n.dataset.on="0",n.dataset.indet="0",n.innerHTML=`
    <div class="lia-ocr-loadmsg">
            <span class="t">Loading OCR engine...</span>
      <span class="p">\u{2026}</span>
    </div>
    <div class="lia-ocr-loadtrack"><div class="lia-ocr-loadfill"></div></div>
    <div class="lia-ocr-loaddetail">Download ~900&nbsp;MB (first time only, cached afterwards).</div>
    <div class="lia-ocr-loaderror" style="display:none">
      <span class="lia-ocr-loaderror-msg">Loading failed.</span>
      <button class="lia-ocr-btn lia-ocr-retry-btn" type="button">Try again</button>
    </div>
  `,a.appendChild(n);let r=n.querySelector(".lia-ocr-loadfill"),s=n.querySelector(".lia-ocr-loadmsg .t"),c=n.querySelector(".lia-ocr-loadmsg .p"),d=n.querySelector(".lia-ocr-loaddetail"),u=n.querySelector(".lia-ocr-loaderror"),p=n.querySelector(".lia-ocr-retry-btn");p&&p.addEventListener("click",()=>{i.LIA.ocr&&i.LIA.ocr.ensureLoaded&&i.LIA.ocr.ensureLoaded(!0)});let h={model:"Xenova/texify2",backend:"wasm",precision:"fp32",loaded:!1,phase:"idle",status:"idle",progress:null},g="__LIA_TEX_OCR_PREC__",f="__LIA_TEX_OCR_MODEL__";try{let e=localStorage.getItem(f);e&&(h.model=e)}catch(e){}try{let e=localStorage.getItem(g);e&&(h.precision=e)}catch(e){}let m=null,b=null,x=null,y=null,v=null,w=null,_=null;function k(e,t){if(!m)return;let a=m.querySelector('[data-k="'+e+'"]');a&&(a.textContent=String(t))}function S(){if(m){var e,a;let n,r;if(m.dataset.state=String(h.status||"idle"),k("model",h.model||"—"),k("backend",h.backend||"—"),k("precision",h.precision||"—"),k("loaded",h.loaded?t("yes","yes"):t("no","no")),k("phase","idle"===(n=String(e=h.phase||"—").toLowerCase())?t("phase.idle","idle"):"import"===n?t("phase.import","import"):"download"===n?t("phase.download","download"):"pipeline"===n?t("phase.pipeline","pipeline"):e||"—"),k("status","idle"===(r=String(a=h.status||"idle").toLowerCase())?t("status.idle","idle"):"ready"===r?t("status.ready","ready"):"working"===r?t("status.working","working"):"loading"===r?t("status.loading","loading"):"error"===r?t("status.error","error"):a||"idle"),x&&y&&v)if(null!==h.progress&&void 0!==h.progress&&isFinite(h.progress)){let e=Math.max(0,Math.min(1,Number(h.progress)));x.dataset.on="1",y.style.width=Math.round(100*e)+"%",v.textContent=Math.round(100*e)+"%"}else x.dataset.on="0";try{let e=Math.ceil(m.getBoundingClientRect().height||m.offsetHeight||0);document.documentElement.style.setProperty("--lia-ocrbar-h",(e||0)+"px"),document.documentElement.style.setProperty("--lia-ocrbar-gap","8px")}catch(e){}}else try{document.documentElement.style.setProperty("--lia-ocrbar-h","0px"),document.documentElement.style.setProperty("--lia-ocrbar-gap","0px")}catch(e){}if(r&&s&&c){if(u){let e=u.querySelector(".lia-ocr-loaderror-msg");e&&(e.textContent=t("load.failed","Loading failed."))}p&&(p.textContent=t("retry","Try again"));let e=String(h.status||"idle"),a=String(h.phase||"idle"),i=!h.loaded&&("loading"===e||"import"===a||"pipeline"===a||"download"===a),o="error"===e&&!h.loaded;if(u&&(u.style.display=o?"":"none"),o)n.dataset.on="1",n.dataset.indet="0",s&&(s.textContent=t("load.failed","Loading failed.")),c&&(c.textContent=""),d&&(d.textContent=""),r&&(r.style.width="0%");else if(i)if(n.dataset.on="1","download"===a?(s.textContent=t("load.engine","Loading OCR engine..."),d&&(d.textContent=t("load.downloadDetail","This download only happens once and is cached afterwards."))):("import"===a?s.textContent=t("load.importing","Loading OCR engine... (importing library)"):"pipeline"===a?s.textContent=t("load.initializing","Loading OCR engine... (initializing model)"):s.textContent=t("load.engine","Loading OCR engine..."),d&&(d.textContent=t("load.firstStart","First start may take a moment."))),null!==h.progress&&void 0!==h.progress&&isFinite(h.progress)){let e=Math.max(0,Math.min(1,Number(h.progress)));n.dataset.indet="0",r.style.transform="translateX(0)",r.style.width=Math.round(100*e)+"%",c.textContent=Math.round(100*e)+"%"}else n.dataset.indet="1",r.style.width="35%",c.textContent="…";else o||(n.dataset.on="0",n.dataset.indet="0",r.style.transform="translateX(0)",r.style.width="0%",c.textContent="")}}function M(e){if(b)try{let t=new Date,a=String(t.getHours()).padStart(2,"0"),n=String(t.getMinutes()).padStart(2,"0"),r=String(t.getSeconds()).padStart(2,"0"),i="["+a+":"+n+":"+r+"] "+String(e),o=b.textContent?b.textContent.split("\n"):[];for(o.push(i);o.length>10;)o.shift();b.textContent=o.join("\n")}catch(e){}}function A(e){try{if(!e)return;for(let t in e)Object.prototype.hasOwnProperty.call(e,t)&&(h[t]=e[t]);S()}catch(e){}}if(e&&((m=document.createElement("div")).className="lia-ocrbar",m.dataset.state="idle",m.dataset.open="0",m.innerHTML=`
      <span class="lia-ocr-head">
        <span class="lia-ocr-dot"></span>
        <span class="lia-ocr-title">LaTeX-OCR</span>
      </span>

      <span class="lia-ocr-pills">
        <span class="lia-ocr-pill"><span class="k">Model</span>     <span class="v" data-k="model">\u{2014}</span></span>
        <span class="lia-ocr-pill"><span class="k">Backend</span>   <span class="v" data-k="backend">\u{2014}</span></span>
        <span class="lia-ocr-pill"><span class="k">Precision</span> <span class="v" data-k="precision">\u{2014}</span></span>
        <span class="lia-ocr-pill"><span class="k">Loaded</span>    <span class="v" data-k="loaded">\u{2014}</span></span>
        <span class="lia-ocr-pill"><span class="k">Phase</span>     <span class="v" data-k="phase">\u{2014}</span></span>
        <span class="lia-ocr-pill"><span class="k">Status</span>    <span class="v" data-k="status">\u{2014}</span></span>
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
    `,a.appendChild(m),b=m.querySelector(".lia-ocr-log"),x=m.querySelector(".lia-ocr-progress"),y=m.querySelector(".lia-ocr-progfill"),v=m.querySelector(".lia-ocr-progtxt"),w=m.querySelector('select[data-act="precision"]'),(_=m.querySelector('select[data-act="model"]'))&&(_.value=h.model),w&&(w.value=h.precision)),m){let e=m.querySelector(".lia-ocr-title"),a=m.querySelectorAll(".lia-ocr-pill .k"),n=m.querySelector('button[data-act="load"]'),r=m.querySelector('button[data-act="toggle"]'),o=m.querySelector('button[data-act="copy"]'),l=m.querySelector('select[data-act="model"]'),s=m.querySelector('select[data-act="precision"]'),c=()=>{e&&(e.textContent=t("title","LaTeX-OCR")),a&&a.length>=6&&(a[0].textContent=t("pill.model","Model"),a[1].textContent=t("pill.backend","Backend"),a[2].textContent=t("pill.precision","Precision"),a[3].textContent=t("pill.loaded","Loaded"),a[4].textContent=t("pill.phase","Phase"),a[5].textContent=t("pill.status","Status")),n&&(n.textContent=t("btn.load","Load/Reload")),r&&(r.textContent=t("btn.log","Log")),o&&(o.textContent=t("btn.copy","Copy")),l&&l.setAttribute("aria-label",t("aria.model","Model")),s&&s.setAttribute("aria-label",t("aria.precision","Precision"))};c(),m.addEventListener("click",e=>{let a=e.target?.closest?.("button[data-act]");if(!a)return;let n=a.getAttribute("data-act");if("toggle"===n){m.dataset.open="1"===m.dataset.open?"0":"1";return}if("copy"===n){let e=[t("report.title","LaTeX-OCR Status Report"),t("pill.model","Model")+": "+(h.model||""),t("pill.backend","Backend")+": "+(h.backend||""),t("pill.precision","Precision")+": "+(h.precision||""),t("pill.loaded","Loaded")+": "+(h.loaded?t("yes","yes"):t("no","no")),t("pill.phase","Phase")+": "+(h.phase||""),t("pill.status","Status")+": "+(h.status||""),t("report.progress","Progress")+": "+(null===h.progress?"—":String(h.progress)),"",t("report.log","Log")+":",b?.textContent||""].join("\n");try{navigator.clipboard.writeText(e),M(t("log.copied","Report copied to clipboard."))}catch(e){M(t("log.copyFailed","Copy failed (clipboard blocked)."))}return}if("load"===n){i.LIA.ocr&&i.LIA.ocr.ensureLoaded&&i.LIA.ocr.ensureLoaded(!0);return}}),w&&w.addEventListener("change",()=>{let e=String(w.value||"fp32");try{localStorage.setItem(g,e)}catch(e){}A({precision:e}),i.LIA.ocr&&i.LIA.ocr.setPrecision&&i.LIA.ocr.setPrecision(e)}),_&&_.addEventListener("change",()=>{let e=String(_.value||h.model);try{localStorage.setItem(f,e)}catch(e){}A({model:e}),i.LIA.ocr&&i.LIA.ocr.setModel&&i.LIA.ocr.setModel(e)});let d=()=>{c(),S()};document.addEventListener("lia:canvas-i18n-update",d),i.LIA.bar=i.LIA.bar||{},i.LIA.bar.__i18nListener=d}return i.LIA.bar={el:m,loadEl:n,set:A,log:M,get:()=>({...h})},S(),e&&M("OCR-Bar ready."),i.LIA.bar}},{"../index":"bZBjE","../canvas/theme":"9gAEw","@parcel/transformer-js/src/esmodule-helpers.js":"9p1zA","../lia/i18n":"4oC8I"}],"9gAEw":[function(e,t,a,n){var r=e("@parcel/transformer-js/src/esmodule-helpers.js");r.defineInteropFlag(a),r.export(a,"ensureCss",()=>o),r.export(a,"parseRgb",()=>l),r.export(a,"luminance",()=>s),r.export(a,"getAccentColor",()=>c),r.export(a,"applyThemeVars",()=>d),r.export(a,"COLORS",()=>u),r.export(a,"getAutoPen",()=>p),r.export(a,"getBorderColor",()=>h),r.export(a,"getAccentCssVar",()=>g),r.export(a,"setSvg",()=>f),r.export(a,"setRectIcon",()=>m),r.export(a,"setEraserIcon",()=>b),r.export(a,"setUndoIcon",()=>x),r.export(a,"setRedoIcon",()=>y),r.export(a,"setTrashIcon",()=>v),r.export(a,"rgbaFromAny",()=>w);var i=e("./icons");function o(){let e=document.getElementById("__lia_canvas_ocr_css_v1");if(e&&e.parentNode&&e.parentNode.removeChild(e),document.getElementById("__lia_canvas_ocr_css_v2"))return;let t=document.createElement("style");t.id="__lia_canvas_ocr_css_v2",t.textContent=`
:root{
  --canvas-border: #000;
  --canvas-pen: #000;
  --canvas-accent: #0b5fff;
  --canvas-panel-bg: rgba(255,255,255,0.84);
  --canvas-overlay-soft: rgba(0,0,0,0.10);
}

@media (prefers-color-scheme: dark){
  :root{
    --canvas-border: #fff;
    --canvas-pen: #fff;
    --canvas-panel-bg: rgba(22,22,24,0.84);
    --canvas-overlay-soft: rgba(255,255,255,0.10);
  }
}

/* ---------------------------------------------------------
   Canvas Block
   --------------------------------------------------------- */
.lia-draw-block{
  display: block;
  width: 100%;
  overflow-x: hidden;
  overflow-y: visible;
}

.lia-draw-wrap{
  width: min(520px, 100%);
  border: 1.5px solid color-mix(in srgb, var(--canvas-border) 30%, transparent);
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.10);
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
  border: 1.5px solid color-mix(in srgb, var(--canvas-border) 35%, transparent);
  border-radius: 8px;
  cursor: pointer;
  user-select: none;
  display: grid;
  place-items: center;
  background: color-mix(in srgb, var(--canvas-border) 6%, transparent);
  transition: background 0.12s, border-color 0.12s;
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

.lia-tool-btn:hover{
  background: color-mix(in srgb, var(--canvas-border) 14%, transparent);
  border-color: color-mix(in srgb, var(--canvas-border) 55%, transparent);
}

.lia-tool-btn[data-active="1"]{
  background: color-mix(in srgb, var(--canvas-border) 18%, transparent);
  border-color: var(--canvas-border);
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
  border-radius: 8px;
  background: color-mix(in srgb, var(--canvas-accent) 12%, transparent);
  border: 1.5px solid color-mix(in srgb, var(--canvas-accent) 60%, transparent);
  cursor: pointer;
  user-select: none;
  touch-action: manipulation;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  vertical-align: middle;
  line-height: 0;
  margin-bottom: 6px;
  transition: background 0.12s, border-color 0.12s;
}

.lia-canvas-launch:hover{
  background: color-mix(in srgb, var(--canvas-accent) 22%, transparent);
  border-color: var(--canvas-accent);
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
  padding: 12px 14px;
  border: 1px solid color-mix(in srgb, var(--canvas-border) 18%, transparent);
  border-radius: 14px;
  background: var(--canvas-panel-bg);
  backdrop-filter: blur(20px) saturate(1.4);
  -webkit-backdrop-filter: blur(20px) saturate(1.4);
  box-shadow: 0 8px 32px rgba(0,0,0,0.18), 0 1.5px 4px rgba(0,0,0,0.08);
  display: none;
  gap: 10px;
  font-size: 1rem;
}

.lia-tool-menu[data-open="1"]{
  display: grid;
  align-items: start;
  row-gap: 8px;
}

.lia-color-grid{
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.lia-color-item{
  width: 18px;
  height: 18px;
  border-radius: 5px;
  cursor: pointer;
  user-select: none;
  border: 1.5px solid color-mix(in srgb, var(--canvas-border) 30%, transparent);
  background: transparent;
  box-sizing: border-box;
  transition: transform 0.1s, border-color 0.1s;
}

.lia-color-item:hover{
  transform: scale(1.1);
  border-color: color-mix(in srgb, var(--canvas-border) 60%, transparent);
}

.lia-color-item[data-active="1"]{
  outline: 2px solid var(--canvas-border);
  outline-offset: 2px;
  border-color: var(--canvas-border);
}

.lia-tool-heading{
  font-size: 1.3rem;
  font-weight: 700;
  line-height: 1.1;
  padding-left: 2px;
  opacity: 0.7;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.lia-heading-row{
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding-bottom: 6px;
  border-bottom: 1px solid color-mix(in srgb, var(--canvas-border) 15%, transparent);
  margin-bottom: 2px;
}

.lia-heading-row .lia-tool-heading{
  padding-left: 2px;
}

.lia-menu-icon-btn{
  width: 26px;
  height: 26px;
  border-radius: 6px;
  border: none;
  background: transparent;
  display: grid;
  place-items: center;
  cursor: pointer;
  user-select: none;
  padding: 0;
  opacity: 0.55;
  transition: opacity 0.12s, background 0.12s;
}

.lia-menu-icon-btn:hover{
  opacity: 1;
  background: color-mix(in srgb, var(--canvas-border) 12%, transparent);
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
  font-size: 0.98rem;
}

.lia-menu-label,
.lia-menu-value{
  font-size: 0.98rem;
}

.lia-preview{
  width: 34px;
  height: 22px;
  border-radius: 6px;
  border: 1.5px solid color-mix(in srgb, var(--canvas-border) 35%, transparent);
  box-sizing: border-box;
  display: grid;
  place-items: center;
  background: color-mix(in srgb, var(--canvas-border) 5%, transparent);
}

.lia-preview-line{
  width: 22px;
  border-radius: 999px;
  background: var(--canvas-border);
  height: 3px;
}

.lia-preview-line--eraser{
  background: transparent;
  border: 1.5px solid var(--canvas-border);
  box-sizing: border-box;
  border-radius: 3px;
}

.lia-slider{
  width: 180px;
  accent-color: var(--canvas-accent);
  font-size: 0.98rem;
}

.lia-bg-tiles{
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  align-items: stretch;
}

.lia-bg-tile{
  height: 34px;
  border-radius: 8px;
  border: 1.5px solid color-mix(in srgb, var(--canvas-border) 30%, transparent);
  background: color-mix(in srgb, var(--canvas-border) 5%, transparent);
  cursor: pointer;
  user-select: none;
  padding: 0;
  transition: background 0.12s, border-color 0.12s;
}

.lia-bg-tile:hover{
  background: color-mix(in srgb, var(--canvas-border) 12%, transparent);
  border-color: color-mix(in srgb, var(--canvas-border) 55%, transparent);
}

.lia-bg-tile[data-active="1"]{
  border-color: var(--canvas-accent);
  box-shadow: inset 0 0 0 1px var(--canvas-accent);
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
  background: var(--canvas-overlay-soft);
  backdrop-filter: blur(6px);
  box-sizing: border-box;
  flex: 0 0 100%;
  align-self: stretch;
  font-size: 1.22rem;
}

.lia-ocr-head{
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin-right: 6px;
}

.lia-ocr-title{
  font-weight: 850;
  font-size: 1.14em;
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
  font-size: 1em;
}

.lia-ocr-pill .v{
  font-weight: 800;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: min(52vw, 520px);
  font-size: 1.04em;
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
  padding: 9px 13px;
  font-weight: 850;
  cursor: pointer;
  user-select: none;
  line-height: 1;
  font-size: 1em;
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
  font-size: 1em;
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
  font-size: 1.02em;
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
  width: min(640px, calc(100vw - 24px));
  max-width: calc(100vw - 24px);
  margin: 0;
  padding: 14px 16px;
  border: 1px solid color-mix(in srgb, var(--canvas-border) 18%, transparent);
  border-radius: 14px;
  background: var(--canvas-panel-bg);
  backdrop-filter: blur(20px) saturate(1.4);
  -webkit-backdrop-filter: blur(20px) saturate(1.4);
  box-shadow: 0 8px 32px rgba(0,0,0,0.18), 0 1.5px 4px rgba(0,0,0,0.08);
  box-sizing: border-box;
  pointer-events: none;
}

.lia-ocr-loadwrap[data-on="1"]{
  display: block;
}

.lia-ocr-loadwrap[data-on="1"][data-indet="0"]:not([data-error="1"]),
.lia-ocr-loadwrap[data-on="1"][data-indet="1"]{
  pointer-events: none;
}

.lia-ocr-loadmsg{
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.lia-ocr-loadmsg .t{
  font-size: 1.6rem;
  font-weight: 600;
  opacity: 0.9;
}

.lia-ocr-loadmsg .p{
  font-size: 1.42rem;
  font-weight: 700;
  min-width: 3em;
  text-align: right;
  opacity: 0.7;
}

.lia-ocr-loaddetail{
  margin-top: 4px;
  opacity: 0.5;
  font-size: 1.3rem;
  font-weight: 500;
}

.lia-ocr-loadtrack{
  margin-top: 10px;
  height: 4px;
  width: 100%;
  border-radius: 999px;
  overflow: hidden;
  box-sizing: border-box;
  background: color-mix(in srgb, var(--canvas-border) 15%, transparent);
}

.lia-ocr-loadfill{
  height: 100%;
  width: 0%;
  border-radius: 999px;
  background: var(--canvas-accent);
  transition: width 0.2s ease;
}

.lia-ocr-loadwrap[data-indet="1"] .lia-ocr-loadfill{
  width: 35%;
  transition: none;
  animation: lia_ocr_indet 1.1s ease-in-out infinite;
}

@keyframes lia_ocr_indet{
  0%{ transform: translateX(-120%); }
  100%{ transform: translateX(320%); }
}

.lia-ocr-loaderror{
  margin-top: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.lia-ocr-loaderror-msg{
  font-size: 1.05rem;
  font-weight: 600;
  color: #c00;
}

.lia-ocr-retry-btn{
  pointer-events: all;
  font-size: 1rem;
  padding: 4px 10px;
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
  background: var(--canvas-overlay-soft);
  backdrop-filter: blur(6px);
  box-sizing: border-box;
  align-items: center;
  gap: 8px;
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
  border: 2px solid var(--lia-tex-preview-border, var(--canvas-accent));
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
  `,(document.head||document.documentElement).appendChild(t)}function l(e){let t=String(e||"").match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);return t?[Number(t[1]),Number(t[2]),Number(t[3])]:null}function s(e){let[t,a,n]=e.map(e=>e/255).map(e=>e<=.03928?e/12.92:Math.pow((e+.055)/1.055,2.4));return .2126*t+.7152*a+.0722*n}function c(e){try{let t=e||document,a=t.body||t.documentElement,n=t.querySelector(".lia-btn");if(n){let e=getComputedStyle(n).backgroundColor;if(e&&"rgba(0, 0, 0, 0)"!==e&&"transparent"!==e)return e}let r=t.createElement("button");r.className="lia-btn",r.type="button",r.textContent="x",r.style.position="absolute",r.style.left="-9999px",r.style.top="-9999px",r.style.visibility="hidden",a.appendChild(r);let i=getComputedStyle(r).backgroundColor;if(r.remove(),i&&"rgba(0, 0, 0, 0)"!==i&&"transparent"!==i)return i}catch(e){}return null}function d(){o();try{let e=window.parent&&window.parent.document?window.parent.document:document,t=document.documentElement,a=getComputedStyle(e.body||e.documentElement).backgroundColor||getComputedStyle(e.documentElement).backgroundColor,n=l(a),r=!!n&&.5>s(n),i=r?"#fff":"#000";t.style.setProperty("--canvas-border",i),t.style.setProperty("--canvas-pen",i),t.style.setProperty("--canvas-panel-bg",r?"rgba(22,22,24,0.84)":"rgba(255,255,255,0.84)"),t.style.setProperty("--canvas-overlay-soft",r?"rgba(255,255,255,0.10)":"rgba(0,0,0,0.10)");let o=c(e)||c(document);o&&t.style.setProperty("--canvas-accent",o),document.dispatchEvent(new Event("lia-canvas-theme"))}catch(e){}}let u=[{key:"auto",value:null},{key:"red",value:"#ff0000"},{key:"orange",value:"#ff7500"},{key:"yellow",value:"#ffff00"},{key:"violett",value:"#ff00ff"},{key:"blue",value:"#0055ff"},{key:"lightblue",value:"#00ffff"},{key:"green",value:"#00ff00"},{key:"darkgreen",value:"#007500"},{key:"black",value:"#000000"},{key:"white",value:"#ffffff"}];function p(){return getComputedStyle(document.documentElement).getPropertyValue("--canvas-pen").trim()||"#000"}function h(){return getComputedStyle(document.documentElement).getPropertyValue("--canvas-border").trim()||"#000"}function g(){return getComputedStyle(document.documentElement).getPropertyValue("--canvas-accent").trim()||h()}function f(e,t){!e||e.__hasIcon||(e.__hasIcon=!0,e.innerHTML=t)}function m(e){f(e,i.SVG_RECT)}function b(e){f(e,i.SVG_ERASER)}function x(e){f(e,i.SVG_UNDO)}function y(e){f(e,i.SVG_REDO)}function v(e){f(e,i.SVG_TRASH)}function w(e,t){let a=l(e);if(a)return`rgba(${a[0]},${a[1]},${a[2]},${t})`;if(String(e).startsWith("#")){let a=String(e).slice(1),n=3===a.length?a[0]+a[0]+a[1]+a[1]+a[2]+a[2]:a,r=parseInt(n.slice(0,2),16),i=parseInt(n.slice(2,4),16),o=parseInt(n.slice(4,6),16);return`rgba(${r},${i},${o},${t})`}return`rgba(0,0,0,${t})`}},{"@parcel/transformer-js/src/esmodule-helpers.js":"9p1zA","./icons":"1nUuC"}],"9p1zA":[function(e,t,a,n){a.interopDefault=function(e){return e&&e.__esModule?e:{default:e}},a.defineInteropFlag=function(e){Object.defineProperty(e,"__esModule",{value:!0})},a.exportAll=function(e,t){return Object.keys(e).forEach(function(a){"default"===a||"__esModule"===a||Object.prototype.hasOwnProperty.call(t,a)||Object.defineProperty(t,a,{enumerable:!0,get:function(){return e[a]}})}),t},a.export=function(e,t,a){Object.defineProperty(e,t,{enumerable:!0,get:a})}},{}],"1nUuC":[function(e,t,a,n){var r=e("@parcel/transformer-js/src/esmodule-helpers.js");r.defineInteropFlag(a),r.export(a,"SVG_RECT",()=>i),r.export(a,"SVG_ERASER",()=>o),r.export(a,"SVG_UNDO",()=>l),r.export(a,"SVG_REDO",()=>s),r.export(a,"SVG_TRASH",()=>c);let i=`
  <svg viewBox="0 0 24 24" aria-hidden="true" style="transform: translateX(3px);">
    <path class="ico-stroke" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"
          d="M4.1 4.6 H19.2 Q20.9 4.6 20.9 6.3 V16.0 M17.2 19.8 H4.1 Q2.4 19.8 2.4 18.1 V6.3 Q2.4 4.6 4.1 4.6"/>
    <path class="ico-stroke" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"
      d="M5.2 12.7l1.9 1.9 4.0-4.8"/>
    <path class="ico-stroke" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"
          d="M13.8 9.9c0-2.2 4.8-2.2 4.8 0 0 1.6-2.4 1.8-2.4 3.6"/>
    <circle cx="16.2" cy="16.6" r="0.92" fill="var(--canvas-border)"/>
    <path class="ico-stroke" stroke-width="1.4" stroke-linecap="round"
      d="M19.4 19.0H24.0 M21.7 16.7V21.3"/>
  </svg>
`,o=`
  <svg viewBox="-4 4 24 24" aria-hidden="true">
    <path class="ico-stroke" d="M4 16.5l8.6-8.6a2 2 0 0 1 2.8 0l4.1 4.1a2 2 0 0 1 0 2.8L12.8 23H7.6L4 19.4a2 2 0 0 1 0-2.9z"
          fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path class="ico-stroke" d="M8 23h8" fill="none" stroke-width="2" stroke-linecap="round"/>
    <path class="ico-stroke" d="M9.2 14.3l6.5 6.5" fill="none" stroke-width="2" stroke-linecap="round"/>
  </svg>
`,l=`
  <svg viewBox="-4 0 24 24" aria-hidden="true">
    <path d="M21 8H10.2V4L2 12l8.2 8v-4H21V8z" fill="var(--canvas-border)"/>
    <rect x="10.2" y="10.6" width="10.8" height="2.8" rx="1.4" fill="var(--canvas-border)"/>
  </svg>
`,s=`
  <svg viewBox="-4 0 24 24" aria-hidden="true">
    <path d="M3 8h10.8V4l8.2 8-8.2 8v-4H3V8z" fill="var(--canvas-border)"/>
    <rect x="3" y="10.6" width="10.8" height="2.8" rx="1.4" fill="var(--canvas-border)"/>
  </svg>
`,c=`
  <svg viewBox="-1 0 24 24" aria-hidden="true" style="width:22px;height:22px;display:block;">
    <path class="ico-stroke" d="M9 3h6" stroke-width="2" stroke-linecap="round"/>
    <path class="ico-stroke" d="M4 6h16" stroke-width="2" stroke-linecap="round"/>
    <path class="ico-stroke" d="M7 6l1 15h8l1-15" stroke-width="2" stroke-linejoin="round"/>
    <path class="ico-stroke" d="M10 10v8M14 10v8" stroke-width="2" stroke-linecap="round"/>
  </svg>
`},{"@parcel/transformer-js/src/esmodule-helpers.js":"9p1zA"}],"4oC8I":[function(e,t,a,n){var r=e("@parcel/transformer-js/src/esmodule-helpers.js");function i(){try{let e=document.documentElement&&document.documentElement.lang;if(e&&String(e).trim())return String(e).trim()}catch(e){}try{let e=window,t=e&&e.LIA&&e.LIA.settings&&e.LIA.settings.data&&e.LIA.settings.data.lang;if(t&&String(t).trim())return String(t).trim()}catch(e){}try{if(navigator.language&&String(navigator.language).trim())return String(navigator.language).trim()}catch(e){}return"en"}function o(e){let t=String(e||"").trim();return t?t.toLowerCase():"en"}r.defineInteropFlag(a),r.export(a,"liaLang",()=>u),r.export(a,"liaT",()=>p);let l=window.__LIA_CANVAS_I18N_STATE__=window.__LIA_CANVAS_I18N_STATE__||{cache:{},pending:{},lang:o(i()),translateQueue:[],translateTimer:null,langWatchInterval:null},s={de:{"ocr.title":"LaTeX-OCR","ocr.selectSubmit":"Als Lösung senden","ocr.runningOcr":"OCR läuft...","ocr.submitted":"Gesendet","ocr.ocrError":"Fehler","ocr.retry":"Erneut versuchen","ocr.yes":"ja","ocr.no":"nein","ocr.pill.model":"Modell","ocr.pill.backend":"Backend","ocr.pill.precision":"Praezision","ocr.pill.loaded":"Geladen","ocr.pill.phase":"Phase","ocr.pill.status":"Status","ocr.btn.load":"Laden/Neu laden","ocr.btn.log":"Log","ocr.btn.copy":"Kopieren","ocr.aria.model":"Modell","ocr.aria.precision":"Präzision","ocr.report.title":"LaTeX-OCR Statusbericht","ocr.report.progress":"Fortschritt","ocr.report.log":"Log","ocr.log.copied":"Bericht in die Zwischenablage kopiert.","ocr.log.copyFailed":"Kopieren fehlgeschlagen (Zwischenablage blockiert).","ocr.status.idle":"inaktiv","ocr.status.ready":"bereit","ocr.status.working":"arbeitet","ocr.status.loading":"lädt","ocr.status.error":"fehler","ocr.phase.idle":"inaktiv","ocr.phase.import":"import","ocr.phase.download":"download","ocr.phase.pipeline":"pipeline","ocr.load.failed":"Laden fehlgeschlagen.","ocr.load.engine":"OCR-Engine wird geladen...","ocr.load.downloadDetail":"Dieser Download passiert nur einmal und wird danach gecacht.","ocr.load.importing":"OCR-Engine wird geladen... (Bibliothek wird importiert)","ocr.load.initializing":"OCR-Engine wird geladen... (Modell wird initialisiert)","ocr.load.firstStart":"Der erste Start kann einen Moment dauern.","canvas.pen":"Stift","canvas.eraser":"Radierer","canvas.background":"Hintergrund","canvas.edit":"Bearbeiten"}};async function c(e,t){let a=String(e||"").split("-")[0].toLowerCase()||"en";if(!a||"en"===a)return t;let n="https://api.mymemory.translated.net/get?q="+encodeURIComponent(t)+"&langpair="+encodeURIComponent("en|"+a),r=new AbortController,i=setTimeout(()=>r.abort(),3500);try{let e=await fetch(n,{signal:r.signal});if(!e||!e.ok)return null;let t=await e.json(),a=t&&t.responseData&&t.responseData.translatedText;if(!a||"string"!=typeof a)return null;return a.trim()||null}catch(e){return null}finally{clearTimeout(i)}}async function d(){for(;l.translateQueue.length>0;){let{cacheKey:e,lang:t,text:a}=l.translateQueue.shift();if(l.cache[e]){delete l.pending[e];continue}try{let n=await c(t,a),r=n?function(e){var t;let a,n=String(e||"");return t=n,(a=document.createElement("textarea")).innerHTML=String(t||""),n=(n=(n=a.value||"").replace(/<[^>]+>/g," ")).replace(/\s+/g," ").trim()}(n):"";r&&r!==a&&(l.cache[e]=r,document.dispatchEvent(new CustomEvent("lia:canvas-i18n-update",{detail:{lang:t,key:e,translated:r}})))}catch(e){}delete l.pending[e],l.translateQueue.length>0&&await new Promise(e=>setTimeout(e,150))}}function u(){return o(i())}function p(e,t){let a=u(),n=String(t||"");if(!n)return"";if("en"===a||a.startsWith("en-"))return n;let r=function(e,t){let a=String(e||"").trim().toLowerCase();if(!a)return null;let n=s[a];if(n&&n[t])return n[t];let r=s[a.split("-")[0]];return r&&r[t]?r[t]:null}(a,String(e||""));if(r)return r;let i=a+"|"+String(e||n),o=l.cache[i];return o||(!function(e,t,a){if(l.pending[e])return;let n=String(a||"").replace(/&/g,"and").replace(/…/g,"...");l.pending[e]=Promise.resolve(),l.translateQueue.push({cacheKey:e,lang:t,text:n}),null===l.translateTimer&&(l.translateTimer=setTimeout(()=>{l.translateTimer=null,d()},0))}(i,a,n),n)}window.__LIA_CANVAS_I18N_LANG_WATCH__||(window.__LIA_CANVAS_I18N_LANG_WATCH__=!0,l.langWatchInterval=setInterval(()=>{let e=o(i());e!==l.lang&&(l.lang=e,l.cache={},l.pending={},document.dispatchEvent(new CustomEvent("lia:canvas-i18n-update",{detail:{lang:e,reason:"lang-change"}})))},2e3))},{"@parcel/transformer-js/src/esmodule-helpers.js":"9p1zA"}],bEGKb:[function(e,t,a,n){var r=e("@parcel/transformer-js/src/esmodule-helpers.js");r.defineInteropFlag(a),r.export(a,"ensureOcrEngine",()=>s);var i=e("../index"),o=e("./bar");async function l(){return i.LIA.tfjs&&i.LIA.tfjs.pipeline?i.LIA.tfjs:(i.LIA.tfjsLoad=i.LIA.tfjsLoad||(async()=>{let e=null;for(let t of["https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2/+esm","https://esm.sh/@xenova/transformers@2.17.2?bundle"])try{try{let e=i.LIA.bar;e&&e.log&&e.log("Importing Transformers.js: "+t)}catch(e){}let e=await Function("u","return import(u)")(t),a=e.pipeline||e.default&&e.default.pipeline,n=e.env||e.default&&e.default.env;if(!a||!n)throw Error("Transformers.js ESM export missing (pipeline/env).");let r={pipeline:a,env:n,__url:t};return i.LIA.tfjs=r,r}catch(a){e=a;try{let e=i.LIA.bar;e&&e.log&&e.log("Import failed: "+t+" — "+(a&&a.message?a.message:String(a)))}catch(e){}}throw e||Error("Failed to load Transformers.js from all CDN URLs.")})(),await i.LIA.tfjsLoad)}function s(){if(i.LIA.ocr)return i.LIA.ocr;let e=(0,o.ensureOcrBar)(),t={model:e.get().model||"Xenova/trocr-small-handwritten",task:"image-to-text",precision:e.get().precision||"fp32",pipe:null,loading:null,async setModel(t){let a=String(t||this.model||"Xenova/texify2");return this.model=a,e.set({model:a,loaded:!1,status:"idle",phase:"idle",progress:null}),this.pipe=null,this.loading=null,this.ensureLoaded(!0)},async setPrecision(t){let a=String(t||"fp32");return this.precision=a,e.set({precision:a,loaded:!1,status:"idle",phase:"idle",progress:null}),this.pipe=null,this.loading=null,this.ensureLoaded(!0)},async ensureLoaded(t){if(this.pipe&&!t)return this.pipe;if(this.loading)return this.loading;let a=this.precision||"fp32",n={fp32:"fp32",fp16:"fp16",int8:"q8"}[a]||"fp32";e.set({model:this.model,backend:"wasm",precision:a,status:"loading",phase:"import",loaded:!1,progress:0}),e.log("Loading model ("+a+") …");let r=null,i=new Promise((e,t)=>{r=setTimeout(()=>t(Error("OCR model load timed out after 60s")),6e4)});return this.loading=(async()=>{try{let{pipeline:t,env:r}=await Promise.race([l(),i]);try{r.allowLocalModels=!1,r.allowRemoteModels=!0,r.useBrowserCache=!0,r.backends=r.backends||{},r.backends.onnx=r.backends.onnx||{},r.backends.onnx.wasm=r.backends.onnx.wasm||{}}catch(e){}e.set({phase:"pipeline"});let o=await Promise.race([t(this.task,this.model,{dtype:n,progress_callback:t=>{let a=function(e){try{if(null==e)return null;if("number"==typeof e&&isFinite(e))return Math.max(0,Math.min(1,e));let t=e&&"object"==typeof e?e:null;if(!t)return null;if(isFinite(t.progress))return Math.max(0,Math.min(1,Number(t.progress)));if(isFinite(t.loaded)&&isFinite(t.total)&&Number(t.total)>0)return Math.max(0,Math.min(1,Number(t.loaded)/Number(t.total)))}catch(e){}return null}(t);null!==a&&e.set({progress:a,phase:"download"})}}),i]);return this.pipe=o,e.set({status:"ready",phase:"ready",loaded:!0,progress:null}),e.log("Model loaded ("+a+")."),o}catch(t){throw e.set({status:"error",phase:"error",loaded:!1,progress:null}),e.log("Load failed: "+(t&&t.message?t.message:String(t))),t}finally{null!==r&&clearTimeout(r),this.loading=null}})(),this.loading},async recognize(t,a){let n=a&&"object"==typeof a?a:{},r=!0===n.__silent,i=await this.ensureLoaded(!1);e.set({status:"working",phase:"infer",progress:null});let o=null;async function l(e){if(e&&"function"==typeof e.convertToBlob)return await e.convertToBlob({type:"image/png"});if(e&&"function"==typeof e.toBlob)return await new Promise((t,a)=>{e.toBlob(e=>e?t(e):a(Error("toBlob() returned null")),"image/png")});throw Error("Canvas-like has no toBlob/convertToBlob")}async function s(e){if("string"==typeof e)return{input:e,revoke:null};if(e&&"object"==typeof e&&"function"==typeof e.arrayBuffer&&"number"==typeof e.size&&"string"==typeof e.type){let t=URL.createObjectURL(e);return{input:t,revoke:()=>URL.revokeObjectURL(t)}}if(e&&"object"==typeof e&&"number"==typeof e.width&&"number"==typeof e.height&&e.data&&"number"==typeof e.data.length){let t=document.createElement("canvas");t.width=Math.max(1,Math.floor(e.width)),t.height=Math.max(1,Math.floor(e.height)),t.getContext("2d",{willReadFrequently:!0}).putImageData(e,0,0);let a=await l(t),n=URL.createObjectURL(a);return{input:n,revoke:()=>URL.revokeObjectURL(n)}}if(e&&"object"==typeof e){if("function"==typeof e.toDataURL)return{input:e.toDataURL("image/png"),revoke:null};if("function"==typeof e.toBlob||"function"==typeof e.convertToBlob){let t=await l(e),a=URL.createObjectURL(t);return{input:a,revoke:()=>URL.revokeObjectURL(a)}}}throw Error("Unsupported input type for OCR: "+(null===e?"null":typeof e))}try{let a=await s(t);o=a.revoke;let l="number"==typeof n.max_new_tokens&&isFinite(n.max_new_tokens)?Math.max(1,Math.floor(n.max_new_tokens)):96,c=await i(a.input,{max_new_tokens:l,do_sample:!0===n.do_sample,temperature:"number"==typeof n.temperature&&isFinite(n.temperature)?n.temperature:0}),d="";if("string"==typeof c)d=c;else if(Array.isArray(c)&&c.length){let e=c[0]||{};(d=e.generated_text||e.text||e.latex||"")||(d=JSON.stringify(e))}else c&&"object"==typeof c?(d=c.generated_text||c.text||c.latex||"")||(d=JSON.stringify(c)):d=String(c);return e.set({status:"ready",phase:"ready"}),r||e.log("Recognize done."),d}catch(t){throw e.set({status:"error",phase:"error"}),r||e.log("Recognize failed: "+(t&&t.message?t.message:String(t))),t}finally{try{o&&o()}catch(e){}}}};return i.LIA.ocr=t,t}},{"../index":"bZBjE","./bar":"hlAaK","@parcel/transformer-js/src/esmodule-helpers.js":"9p1zA"}],cCz1j:[function(e,t,a,n){var r=e("@parcel/transformer-js/src/esmodule-helpers.js");r.defineInteropFlag(a),r.export(a,"cfUnionBBox",()=>f),r.export(a,"ensureCanvasFreezeApi",()=>L);var i=e("../index"),o=e("./store"),l=e("./theme");function s(e,t){let a=Number(e);return isFinite(a)?a:t||0}function c(e,t,a){return Math.max(t,Math.min(a,e))}function d(e){return Math.round(100*s(e,0))/100}function u(e,t){let a=s(t,0);if(!(a>0))return 0;let n=s(e,0)%a;return n<0?n+a:n}function p(e){let t=e&&"object"==typeof e?e:{};return{panX:s(t.panX,0),panY:s(t.panY,0),scale:s(t.scale,1)||1,minScale:s(t.minScale,.25),maxScale:s(t.maxScale,8)}}function h(e,t){let a=s(e&&e.x,0),n=s(e&&e.y,0),r=s(t&&t.scale,1)||1;return{x:a*r+s(t&&t.panX,0),y:n*r+s(t&&t.panY,0)}}function g(e,t,a){if(!e)return null;let n=Math.max(0,s(e.x,0)),r=Math.max(0,s(e.y,0)),i=Math.min(s(t,0),s(e.x,0)+s(e.w,0)),o=Math.min(s(a,0),s(e.y,0)+s(e.h,0));return i<=n||o<=r?null:{x:n,y:r,w:i-n,h:o-r}}function f(e,t){if(!e)return t?{x:t.x,y:t.y,w:t.w,h:t.h}:null;if(!t)return{x:e.x,y:e.y,w:e.w,h:e.h};let a=Math.min(e.x,t.x),n=Math.min(e.y,t.y);return{x:a,y:n,w:Math.max(0,Math.max(e.x+e.w,t.x+t.w)-a),h:Math.max(0,Math.max(e.y+e.h,t.y+t.h)-n)}}function m(e){return e&&e.querySelector?e.querySelector(".lia-canvas-mount"):null}function b(e){let t=m(e);return t?(0,o.ensureMountUID)(t):""}function x(e){let t=i.LIA.store||{};return e&&t[e]?t[e]:null}function y(e){return Array.from((e&&e.querySelectorAll?e:document).querySelectorAll(".lia-canvas-pair")).filter(e=>!!m(e))}function v(e,t){let a=Array.isArray(t)?t:[];for(let t=0;t<a.length;t++){let n=a[t];if(!n)continue;if("r"===n.k){e.save(),e.globalCompositeOperation="source-over",e.globalAlpha=1,e.fillStyle=String(n.f||"rgba(0,0,0,0.15)"),e.fillRect(s(n.x,0),s(n.y,0),Math.max(0,s(n.w,0)),Math.max(0,s(n.h,0))),e.restore();continue}let r=Array.isArray(n.p)?n.p:[];if(r.length){e.save(),e.beginPath(),e.moveTo(s(r[0][0],0),s(r[0][1],0));for(let t=1;t<r.length;t++)e.lineTo(s(r[t][0],0),s(r[t][1],0));e.lineCap="round",e.lineJoin="round",e.lineWidth=Math.max(.75,s(n.w,1)),"e"===n.k?(e.globalCompositeOperation="destination-out",e.globalAlpha=1,e.strokeStyle="rgba(0,0,0,1)"):(e.globalCompositeOperation="source-over",e.globalAlpha=c(s(n.a,1),0,1),e.strokeStyle=String(n.c||"#000")),e.stroke(),e.restore()}}}function w(e,t){let a,n,r;if(!e||!t)return null;let i=function(e){let t=e&&"object"==typeof e?e:{},a=Array.isArray(t.ITEMS)?t.ITEMS:[],n=p(t.VIEW||{}),r=Math.max(1,Math.round(s(t.wrapW,0))),i=Math.max(1,Math.round(s(t.canvasH,0))),o=(0,l.rgbaFromAny)((0,l.getAccentCssVar)(),.28),u=[];for(let e=0;e<a.length;e++){let t=a[e];if(t&&"object"==typeof t){if("path"===t.kind){let e=Array.isArray(t.points)?t.points:[];if(!e.length)continue;let a=e.map(e=>h(e,n)),o=Math.max(.75,s(t.width,1)*s(n.scale,1));if(!g(function(e,t){let a=Array.isArray(e)?e:[];if(!a.length)return null;let n=1/0,r=1/0,i=-1/0,o=-1/0;for(let e=0;e<a.length;e++){let t=a[e],l=s(t&&t.x,0),c=s(t&&t.y,0);l<n&&(n=l),c<r&&(r=c),l>i&&(i=l),c>o&&(o=c)}let l=Math.max(0,s(t,0));return{x:n-l,y:r-l,w:Math.max(0,i-n+2*l),h:Math.max(0,o-r+2*l)}}(a,o/2+2),r,i))continue;u.push({k:"eraser"===t.tool?"e":"p",c:String(t.color||(0,l.getAutoPen)()),a:c(s(t.alpha,1),0,1),w:d(o),p:a.map(e=>[d(e.x),d(e.y)])});continue}if("rect"===t.kind){let e=h({x:t.x0,y:t.y0},n),a=h({x:t.x1,y:t.y1},n),p=function(e,t,a,n){let r=Math.min(s(e,0),s(a,0)),i=Math.min(s(t,0),s(n,0));return{x:r,y:i,w:Math.max(0,Math.max(s(e,0),s(a,0))-r),h:Math.max(0,Math.max(s(t,0),s(n,0))-i)}}(e.x,e.y,a.x,a.y);if(!g(p,r,i))continue;let f=c(s(t.alpha,.28),0,1),m=t.color?(0,l.rgbaFromAny)(t.color,f):(0,l.rgbaFromAny)((0,l.getAccentCssVar)(),f);u.push({k:"r",f:m||o,x:d(p.x),y:d(p.y),w:d(p.w),h:d(p.h)})}}}return{vw:r,vh:i,items:u}}(t),o=Math.max(1,0|i.vw),f=Math.max(1,0|i.vh),m=Array.isArray(i.items)?i.items:[],b=document.createElement("canvas");b.width=o,b.height=f;let x=b.getContext("2d",{willReadFrequently:!0});x.clearRect(0,0,o,f),v(x,m);let y=function(e){if(!e)return null;let t=e.getContext("2d",{willReadFrequently:!0});if(!t)return null;let a=0|e.width,n=0|e.height;if(!(a>0&&n>0))return null;let r=t.getImageData(0,0,a,n).data,i=a,o=n,l=-1,c=-1;for(let e=0;e<n;e++){let t=e*a*4;for(let n=0;n<a;n++)!(r[t+4*n+3]<=10)&&(n<i&&(i=n),e<o&&(o=e),n>l&&(l=n),e>c&&(c=e))}if(l<0)return null;let d=Math.max(0,Math.round(s(8,0)));return{x:Math.max(0,i-d),y:Math.max(0,o-d),w:Math.max(1,Math.min(a-1,l+d)-Math.max(0,i-d)+1),h:Math.max(1,Math.min(n-1,c+d)-Math.max(0,o-d)+1)}}(b);return y?{v:"cvf1",u:String(e),w:y.w,h:y.h,bg:function(e,t){let a=e&&"object"==typeof e?e:{},n=p(a.VIEW||{}),r=String(a.bgMode||"none");if("grid"!==r&&"lined"!==r)return{m:"none"};let i=Math.max(1,s(a.bgStep,24))*Math.max(1e-4,s(n.scale,1));if(!(i>0))return{m:"none"};let o=s(t&&t.x,0),c=s(t&&t.y,0);return{m:r,s:d(i),ox:d(u(s(n.panX,0)-o,i)),oy:d(u(s(n.panY,0)-c,i)),c:(0,l.rgbaFromAny)((0,l.getAccentCssVar)(),.65),lw:1.125}}(t,y),it:(a=Array.isArray(m)?m:[],n=s(y&&y.x,0),r=s(y&&y.y,0),a.map(e=>e?"r"===e.k?{k:"r",f:String(e.f||""),x:d(s(e.x,0)-n),y:d(s(e.y,0)-r),w:d(s(e.w,0)),h:d(s(e.h,0))}:{k:"e"===e.k?"e":"p",c:String(e.c||""),a:c(s(e.a,1),0,1),w:d(s(e.w,1)),p:(Array.isArray(e.p)?e.p:[]).map(e=>[d(s(e&&e[0],0)-n),d(s(e&&e[1],0)-r)])}:null).filter(Boolean))}:{v:"cvf1",u:String(e),e:1,w:0,h:0,bg:{m:"none"},it:[]}}function _(e){let t=b(e);if(!t)return null;let a=x(t);return a?w(t,a):null}function k(e){let t=y(e),a=[];for(let e=0;e<t.length;e++){let n=_(t[e]);n&&a.push(n)}return a}function S(e){return!!(e&&1!==e.e&&s(e.w,0)>0&&s(e.h,0)>0&&Array.isArray(e.it)&&e.it.length)}function M(e,t){if(!e||!t)return null;let a=Math.max(1,Math.round(s(t.w,1))),n=Math.max(1,Math.round(s(t.h,1))),r=window.devicePixelRatio||1;e.width=Math.max(1,Math.round(a*r)),e.height=Math.max(1,Math.round(n*r)),e.style.width=a+"px",e.style.height=n+"px";let i=e.getContext("2d",{willReadFrequently:!0});return i.setTransform(r,0,0,r,0,0),i.clearRect(0,0,a,n),!function(e,t,a,n){let r=t&&"object"==typeof t?t:{},i=String(r.m||"none");if("grid"!==i&&"lined"!==i)return;let o=Math.max(1,s(r.s,1)),c=u(s(r.ox,0),o),d=u(s(r.oy,0),o),p=String(r.c||(0,l.rgbaFromAny)((0,l.getAccentCssVar)(),.65)),h=Math.max(.5,s(r.lw,1.125));if(e.save(),e.globalCompositeOperation="source-over",e.globalAlpha=1,e.strokeStyle=p,e.lineWidth=h,e.beginPath(),"grid"===i){for(let t=c;t<=a;t+=o)e.moveTo(t,0),e.lineTo(t,n);for(let t=d;t<=n;t+=o)e.moveTo(0,t),e.lineTo(a,t)}else for(let t=d;t<=n;t+=o)e.moveTo(0,t),e.lineTo(a,t);e.stroke(),e.restore()}(i,t.bg||{m:"none"},a,n),v(i,Array.isArray(t.it)?t.it:[]),e}function A(e,t){if(!e||!(e instanceof Element)||!t)return null;if(e.dataset.open="1",e.innerHTML="",!S(t)){let t=document.createElement("span");return t.className="lia-canvas-freeze-empty",t.textContent="No visible canvas content frozen.",e.appendChild(t),t}let a=document.createElement("span");a.className="lia-draw-block";let n=document.createElement("span");n.className="lia-draw-wrap";let r=document.createElement("canvas");return r.className="lia-canvas-freeze-preview",r.setAttribute("aria-label","Frozen drawing area"),n.appendChild(r),a.appendChild(n),e.appendChild(a),M(r,t),r}function C(e,t){let a=m(e);return a?A(a,t):null}function L(){let e=i.LIA.freeze||{};return e.version="cvf1",e.collectCanvasPairsFromRoot=y,e.getCanvasMountFromPair=m,e.getCanvasUidFromPair=b,e.getCanvasStoreEntry=x,e.exportCanvasFreezeStateFromEntry=w,e.exportCanvasFreezeStateFromPair=_,e.exportAllCanvasFreezeStatesFromRoot=k,e.hasCanvasFreezeContent=S,e.paintCanvasFreezeStateToCanvas=M,e.renderCanvasFreezeStateIntoMount=A,e.renderCanvasFreezeStateIntoPair=C,i.LIA.freeze=e,e}},{"../index":"bZBjE","./store":"bxEU5","./theme":"9gAEw","@parcel/transformer-js/src/esmodule-helpers.js":"9p1zA"}],bxEU5:[function(e,t,a,n){var r=e("@parcel/transformer-js/src/esmodule-helpers.js");r.defineInteropFlag(a),r.export(a,"ensureMountUID",()=>o),r.export(a,"__liaDispatchCanvasFreezeChange",()=>l);var i=e("../index");function o(e){if(!e)return"";if(e.dataset&&e.dataset.uid)return e.dataset.uid;let t="c"+ ++i.LIA.uidSeq;return e.dataset.uid=t,t}function l(e){try{let t=Object.assign({ts:Date.now()},e&&"object"==typeof e?e:{}),a=(0,i.getRootWindow)();(a&&"function"==typeof a.dispatchEvent?a:window).dispatchEvent(new CustomEvent("lia:canvas-change",{detail:t}))}catch(e){}}},{"../index":"bZBjE","@parcel/transformer-js/src/esmodule-helpers.js":"9p1zA"}],"2KvOo":[function(e,t,a,n){var r=e("@parcel/transformer-js/src/esmodule-helpers.js");r.defineInteropFlag(a),r.export(a,"ensureCanvasFreezeApi",()=>s.ensureCanvasFreezeApi),r.export(a,"canvasMarkup",()=>p),r.export(a,"initAll",()=>h);var i=e("../index"),o=e("./theme"),l=e("./store"),s=e("./freeze"),c=e("../lia/input"),d=e("../lia/i18n");let u=window.__LIA_CANVAS_PEN_TOUCH_GUARD__=window.__LIA_CANVAS_PEN_TOUCH_GUARD__||{activePenPointers:new Set};if(!window.__LIA_CANVAS_GLOBAL_TOUCH_SUPPRESSOR__){window.__LIA_CANVAS_GLOBAL_TOUCH_SUPPRESSOR__=!0;let e=e=>{0===String(e.type||"").indexOf("pointer")&&"touch"!==String(e.pointerType||"")||u.activePenPointers.size&&(e.cancelable&&e.preventDefault(),e.stopPropagation())};document.addEventListener("touchstart",e,{capture:!0,passive:!1}),document.addEventListener("touchmove",e,{capture:!0,passive:!1}),document.addEventListener("pointerdown",e,{capture:!0,passive:!1}),document.addEventListener("pointermove",e,{capture:!0,passive:!1});let t=e=>{"pen"===String(e.pointerType||"").toLowerCase()&&u.activePenPointers.delete(e.pointerId)};document.addEventListener("pointerup",t,{capture:!0}),document.addEventListener("pointercancel",t,{capture:!0}),document.addEventListener("pointerleave",t,{capture:!0})}function p(){return`
    <span class="lia-draw-block">
      <span class="lia-draw-wrap">
        <span class="lia-toolstack">
          <button class="lia-tool-btn lia-undo-btn"   type="button" aria-label="Undo"></button>
          <button class="lia-tool-btn lia-redo-btn"   type="button" aria-label="Redo"></button>
          <button class="lia-tool-btn lia-eraser-btn" type="button" aria-label="Eraser"></button>
          <button class="lia-tool-btn lia-color-btn"  type="button" aria-label="Pen"></button>
          <button class="lia-tool-btn lia-bgmenu-btn" type="button" aria-label="Background"></button>
          <button class="lia-tool-btn lia-rect-btn"   type="button" aria-label="Submit as Solution"></button>
        </span>

        <span class="lia-tool-menu" data-open="0" aria-label="Werkzeuge"></span>
        <canvas class="lia-draw" aria-label="Drawing area"></canvas>
      </span>
    </span>
  `}function h(){document.querySelectorAll(".lia-draw-wrap canvas.lia-draw:not([data-ready])").forEach(e=>{e.setAttribute("data-ready","1"),function(e){let t=e.closest(".lia-draw-wrap");if(!t)return;let a=(e,t)=>(0,d.liaT)("ocr."+e,t),n=(e,t)=>(0,d.liaT)("canvas."+e,t),r=t.closest(".lia-canvas-mount"),s=(0,l.ensureMountUID)(r),p=t.querySelector(".lia-undo-btn"),h=t.querySelector(".lia-redo-btn"),g=t.querySelector(".lia-color-btn"),f=t.querySelector(".lia-eraser-btn"),m=t.querySelector(".lia-rect-btn"),b=t.querySelector(".lia-bgmenu-btn"),x=t.querySelector(".lia-tool-menu"),y=document.createElement("button");y.type="button",y.className="lia-rect-action",y.textContent=a("selectSubmit","Submit as Solution"),y.style.display="none",t.appendChild(y);let v=document.createElement("div");v.className="lia-rect-progress",v.dataset.on="0",v.innerHTML=`
    <div class="lia-rect-progbar"><div class="lia-rect-progfill"></div></div>
    <div class="lia-rect-progtxt">0%</div>
  `,t.appendChild(v);let w=v.querySelector(".lia-rect-progfill"),_=v.querySelector(".lia-rect-progtxt"),k=!1;function S(){if(k||(y.textContent=a("selectSubmit","Submit as Solution")),m){let e=a("selectSubmit","Submit as Solution");m.title=e,m.setAttribute("aria-label",e)}}let M=()=>{if(S(),ej(),x&&"1"===x.dataset.open){let e=String(x.__mode||"");"pen"===e?ev():"eraser"===e?ew():"bg"===e&&e_()}};document.addEventListener("lia:canvas-i18n-update",M),v.addEventListener("pointerdown",e=>{e.preventDefault(),e.stopPropagation()}),y.addEventListener("pointerdown",e=>{e.preventDefault(),e.stopPropagation()});let A=document.createElement("button");A.type="button",A.className="lia-rect-close",A.setAttribute("aria-label","Marker-Rechteck entfernen"),A.style.display="none",A.innerHTML=`
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 7L17 17M17 7L7 17" fill="none" stroke="currentColor"
            stroke-width="2.4" stroke-linecap="round"/>
    </svg>
  `,t.appendChild(A);let C=document.createElement("span");C.className="lia-eraser-ring",C.dataset.on="0",t.appendChild(C),A.addEventListener("pointerdown",e=>{e.preventDefault(),e.stopPropagation()}),A.addEventListener("click",e=>{e.preventDefault(),e.stopPropagation(),function(){let e=!1;for(let t=ea.length-1;t>=0;t--)ea[t]&&"rect"===ea[t].kind&&(ea.splice(t,1),e=!0);for(let t=en.length-1;t>=0;t--)en[t]&&"rect"===en[t].kind&&(en.splice(t,1),e=!0);e&&(eP(),ez(),ej(),ef()),eC()}()}),(0,o.setUndoIcon)(p),(0,o.setRedoIcon)(h),(0,o.setEraserIcon)(f),(0,o.setRectIcon)(m),b&&!b.__bgCleared&&(b.__bgCleared=!0,b.innerHTML="");let L=e.getContext("2d",{willReadFrequently:!0}),E=document.createElement("canvas"),I=E.getContext("2d",{willReadFrequently:!0}),R=document.createElement("canvas"),T=R.getContext("2d",{willReadFrequently:!0}),P=i.LIA.store,O=s&&P[s]?P[s]:null,z=O&&O.VIEW?{...O.VIEW}:{panX:0,panY:0,scale:1,minScale:.25,maxScale:8},j=0,q=!1;function B(e){try{let t=i.LIA.bar;t&&t.log&&t.log(e)}catch(e){}}function F(e){let t=String(e||""),a="",n=!1;for(let e=0;e<t.length;e++){let r=t[e];" "===r||"\n"===r||"\r"===r||"	"===r||"\f"===r?(n||(a+=" "),n=!0):(a+=r,n=!1)}return a.trim()}function N(e){let t=String(e||"").trim();return t.startsWith("$$")&&t.endsWith("$$")&&(t=t.slice(2,-2).trim()),t.startsWith("$")&&t.endsWith("$")&&(t=t.slice(1,-1).trim()),t.startsWith("\\[")&&t.endsWith("\\]")&&(t=t.slice(2,-2).trim()),F(t)}function D(e){let t=String(e||"").trim(),a="\\mathrm{";if(t.startsWith(a)&&t.endsWith("}")){t=t.slice(a.length,-1);let e="";for(let a=0;a<t.length;a++)"~"!==t[a]&&(e+=t[a]);return e.trim()}return t}function V(e){if(!e||(-1!==e.indexOf("\\div")&&(e=e.replace(/\s*\\div\s*/g,":")),-1===e.indexOf("\\times")))return e;let t="",a=0,n=e;for(;a<n.length;){let e=n.indexOf("\\times",a);if(-1===e){t+=n.slice(a);break}t+=n.slice(a,e);let r=e+6;for(;r<n.length&&" "===n[r];)r++;let i=e-1;for(;i>=0&&" "===n[i];)i--;let o=n[r]||"",l=n[i]||"",s=e=>e>="0"&&e<="9",c=e=>e>="a"&&e<="z";s(l)&&s(o)?t+="\\cdot":c(l)||c(o)?t+="x":t+="\\cdot",a=e+6}return t}function W(e){let t=Math.max(e.width,e.height),a=1;if(t<420&&(a=420/t),t>1400&&(a=1400/t),.06>Math.abs((a=eg(a,.5,4))-1))return e;let n=document.createElement("canvas");n.width=Math.max(1,Math.round(e.width*a)),n.height=Math.max(1,Math.round(e.height*a));let r=n.getContext("2d",{willReadFrequently:!0});return r.fillStyle="#fff",r.fillRect(0,0,n.width,n.height),r.drawImage(e,0,0,n.width,n.height),n}function H(e){let t=document.createElement("canvas");t.width=Math.max(1,0|e.width),t.height=Math.max(1,0|e.height);let a=t.getContext("2d",{willReadFrequently:!0});a.fillStyle="#fff",a.fillRect(0,0,t.width,t.height),a.drawImage(e,0,0);let n=a.getImageData(0,0,t.width,t.height).data,r=t.width,i=t.height,o=new Uint8Array(r*i);for(let e=0,t=0;t<o.length;t++,e+=4)o[t]=+(.299*n[e]+.587*n[e+1]+.114*n[e+2]<200);let l=o;for(let e=0;e<0;e++)l=function(e){let t=new Uint8Array(r*i);for(let a=1;a<i-1;a++)for(let n=1;n<r-1;n++){let i=a*r+n,o=0;for(let t=-1;t<=1;t++)for(let a=-1;a<=1;a++)if(e[i+t*r+a]){o=1,t=2;break}t[i]=o}return t}(l);let s=r,c=i,d=-1,u=-1;for(let e=0;e<i;e++)for(let t=0;t<r;t++)l[e*r+t]&&(t<s&&(s=t),e<c&&(c=e),t>d&&(d=t),e>u&&(u=e));if(d<0)return t;s=Math.max(0,s-18),c=Math.max(0,c-18);let p=Math.max(1,(d=Math.min(r-1,d+18))-s+1),h=Math.max(1,(u=Math.min(i-1,u+18))-c+1),g=document.createElement("canvas");g.width=p,g.height=h;let f=g.getContext("2d",{willReadFrequently:!0}),m=f.createImageData(p,h),b=m.data;for(let e=0;e<h;e++)for(let t=0;t<p;t++){let a=255*!l[(c+e)*r+(s+t)],n=(e*p+t)*4;b[n]=a,b[n+1]=a,b[n+2]=a,b[n+3]=255}f.putImageData(m,0,0);let x=512/Math.max(p,h);x<.75&&(x=.75),x>3.5&&(x=3.5);let y=document.createElement("canvas");y.width=Math.max(1,Math.round(p*x)),y.height=Math.max(1,Math.round(h*x));let v=y.getContext("2d",{willReadFrequently:!0});return v.fillStyle="#fff",v.fillRect(0,0,y.width,y.height),v.imageSmoothingEnabled=!0,v.drawImage(g,0,0,y.width,y.height),y}function U(e,t){let a=+(1===(t&&"object"==typeof t?t:{}).dilate),n=document.createElement("canvas");n.width=Math.max(1,0|e.width),n.height=Math.max(1,0|e.height);let r=n.getContext("2d",{willReadFrequently:!0});r.fillStyle="#fff",r.fillRect(0,0,n.width,n.height),r.drawImage(e,0,0);let i=r.getImageData(0,0,n.width,n.height).data,o=n.width,l=n.height,s=new Uint8Array(o*l);for(let e=0,t=0;t<s.length;t++,e+=4)s[t]=+(.299*i[e]+.587*i[e+1]+.114*i[e+2]<225);1===a&&(s=function(e){let t=new Uint8Array(o*l);for(let a=1;a<l-1;a++)for(let n=1;n<o-1;n++){let r=a*o+n,i=0;for(let t=-1;t<=1;t++)for(let a=-1;a<=1;a++)if(e[r+t*o+a]){i=1,t=2;break}t[r]=i}return t}(s));let c=o,d=l,u=-1,p=-1;for(let e=0;e<l;e++)for(let t=0;t<o;t++)s[e*o+t]&&(t<c&&(c=t),e<d&&(d=e),t>u&&(u=t),e>p&&(p=e));if(u<0)return H(e);let h=Math.max(1,u-c+1),g=Math.max(1,p-d+1),f=Math.max(24,Math.floor(.35*Math.max(h,g))),m=Math.max(64,Math.min(1024,Math.max(h,g)+2*f)),b=document.createElement("canvas");b.width=m,b.height=m;let x=b.getContext("2d",{willReadFrequently:!0}),y=x.createImageData(m,m),v=y.data;for(let e=0;e<v.length;e+=4)v[e]=255,v[e+1]=255,v[e+2]=255,v[e+3]=255;let w=Math.floor((m-h)/2),_=Math.floor((m-g)/2);for(let e=0;e<g;e++)for(let t=0;t<h;t++){let a=255*!s[(d+e)*o+(c+t)],n=((_+e)*m+(w+t))*4;v[n]=a,v[n+1]=a,v[n+2]=a,v[n+3]=255}x.putImageData(y,0,0);let k=document.createElement("canvas");k.width=512,k.height=512;let S=k.getContext("2d",{willReadFrequently:!0});return S.fillStyle="#fff",S.fillRect(0,0,512,512),S.imageSmoothingEnabled=!1,S.drawImage(b,0,0,512,512),k}function X(e){let t=String(e||"").trim();return t?Y(t)?t.length-5e3:t.length:-9999}async function $(e,t){let a=t,n=t,r=t;try{a=H(t)}catch(e){a=t}try{a=W(a)}catch(e){}try{var i;let e,a,r;i=H(t),e=Math.max(0,Math.round(20)),(a=document.createElement("canvas")).width=i.width+2*e,a.height=i.height+2*e,(r=a.getContext("2d",{willReadFrequently:!0})).fillStyle="#fff",r.fillRect(0,0,a.width,a.height),r.drawImage(i,e,e),n=a}catch(e){n=a}try{n=W(n)}catch(e){}try{r=H(function(e){let t=document.createElement("canvas");t.width=e.width,t.height=e.height;let a=t.getContext("2d",{willReadFrequently:!0});a.fillStyle="#fff",a.fillRect(0,0,t.width,t.height),a.drawImage(e,0,0);let n=a.getImageData(0,0,t.width,t.height),r=n.data;for(let e=0;e<r.length;e+=4)!(r[e+3]<128)&&.299*r[e]+.587*r[e+1]+.114*r[e+2]<240&&(r[e]=Math.max(0,Math.min(255,Math.round(r[e]/1.35))),r[e+1]=Math.max(0,Math.min(255,Math.round(r[e+1]/1.35))),r[e+2]=Math.max(0,Math.min(255,Math.round(r[e+2]/1.35))));return a.putImageData(n,0,0),t}(t))}catch(e){r=a}try{r=W(r)}catch(e){}let o={max_new_tokens:128,do_sample:!1,temperature:0},[l,s,c]=await Promise.all([e.recognize(a,o).catch(()=>""),e.recognize(n,o).catch(()=>""),e.recognize(r,o).catch(()=>"")]),d=V(D(N(l))),u=V(D(N(s))),p=V(D(N(c))),h=X(d),g=X(u),f=X(p);return h>=g&&h>=f?d:g>=f?u:p}function G(e,t){let a=t*Math.PI/180,n=0|e.width,r=0|e.height,i=document.createElement("canvas");i.width=Math.max(1,n),i.height=Math.max(1,r);let o=i.getContext("2d",{willReadFrequently:!0});return o.fillStyle="#fff",o.fillRect(0,0,i.width,i.height),o.translate(i.width/2,i.height/2),o.rotate(a),o.translate(-n/2,-r/2),o.imageSmoothingEnabled=!1,o.drawImage(e,0,0),i}function Y(e){let t=String(e||"").trim();if(!t||/[+\-*/=,:;\\]$/.test(t)||/[{[(]$/.test(t))return!0;let a=0,n=0,r=0,i=!1;for(let e=0;e<t.length;e++){let o=t[e];if(i){i=!1;continue}if("\\"===o){i=!0;continue}"{"===o?a++:"}"===o?a--:"["===o?n++:"]"===o?n--:"("===o?r++:")"===o&&r--}return 0!==a||0!==n||0!==r}function K(e){let t=String(e||"").trim();if(!t||-1!==t.indexOf("\\"))return null;let a={O:"0",o:"0",Q:"0",D:"0",I:"1",l:"1","|":"1","!":"1",Z:"2",z:"2",S:"5",s:"5",B:"8",g:"9",q:"9"},n="";for(let e=0;e<t.length;e++){let r=t[e],i=t.charCodeAt(e);if(i>=48&&i<=57){n+=r;continue}if(!(" \n\r	".includes(r)||"${}()[]".includes(r))&&!",.;:_-".includes(r)){if(a[r]){n+=a[r];continue}return null}}return(n=String(n).trim())&&!(n.length>3)?n:null}async function Z(e,t){t.__dgBase0||(t.__dgBase0=U(t,{dilate:0})),t.__dgBase1||(t.__dgBase1=U(t,{dilate:1}));let a=t.__dgBase0,n=t.__dgBase1,r=[()=>a,()=>G(a,-6),()=>G(a,6),()=>n,()=>G(n,-6),()=>G(n,6)],i={},o=[];for(let t=0;t<r.length;t++){let a="";try{a=await e.recognize(r[t](),{max_new_tokens:8,do_sample:!1,temperature:0,__silent:!0})}catch(e){continue}let n=N(a),l=K(n=V(n=D(n)));if(l&&(i[l]||(i[l]=0,o.push(l)),i[l]+=1,i[l]>=3))return l}let l=null,s=0;for(let e of o)(i[e]||0)>s&&(s=i[e],l=e);return l}let Q=0,J=0;function ee(e){if(!v||!w||!_)return;let t=Math.max(0,Math.min(1,Number(e)));w.style.width=Math.round(100*t)+"%",_.textContent=Math.round(100*t)+"%"}async function et({auto:n=!1}={}){let r,o=ek();if(!o)return void B("No marker-rectangle found.");let l=i.LIA.ocr;if(!l||!l.recognize)return void B("OCR engine not available (LIA.ocr).");let s=y.textContent||"";k=!0,y.disabled=!0,y.textContent=a("runningOcr","Running OCR..."),v&&(v.dataset.on="1",ee(0),eC()),J=performance.now(),r=()=>{let e=performance.now()-J;ee(e<900?e/900*.7:e<2200?.7+(e-900)/1300*.2:.9+Math.min(.08,(e-2200)/5e3*.08)),Q=requestAnimationFrame(r)},Q=requestAnimationFrame(r);try{l.ensureLoaded&&await l.ensureLoaded(!1);let n=function(t){if(!t)return null;let a=window.devicePixelRatio||1,n=Math.min(t.x0,t.x1),r=Math.min(t.y0,t.y1),i=Math.max(t.x0,t.x1),o=Math.max(t.y0,t.y1),l=eE(n,r),s=eE(i,o),c=eg(Math.min(l.sx,s.sx),0,e.clientWidth),d=eg(Math.min(l.sy,s.sy),0,e.clientHeight),u=eg(Math.max(l.sx,s.sx),0,e.clientWidth),p=eg(Math.max(l.sy,s.sy),0,e.clientHeight),h=u-c,g=p-d;if(h<6||g<6)return null;let f=Math.round((c-12)*a),m=Math.round((d-12)*a),b=Math.round((h+24)*a),x=Math.round((g+24)*a),y=document.createElement("canvas");y.width=Math.max(1,b),y.height=Math.max(1,x);let v=y.getContext("2d",{willReadFrequently:!0});v.setTransform(1,0,0,1,0,0),v.globalCompositeOperation="source-over",v.globalAlpha=1,v.clearRect(0,0,y.width,y.height);let w=R.width,_=R.height,k=f,S=m,M=b,A=x,C=0,L=0,E=y.width,I=y.height;if(k<0){let e=-k/M;C+=E*e,E-=E*e,M+=k,k=0}if(S<0){let e=-S/A;L+=I*e,I-=I*e,A+=S,S=0}if(k+M>w){let e=k+M-w;E-=e/M*E,M-=e}if(S+A>_){let e=S+A-_;I-=e/A*I,A-=e}if(M<=1||A<=1||E<=1||I<=1)return null;v.drawImage(R,k,S,M,A,C,L,E,I);let T=v.getImageData(0,0,y.width,y.height),P=T.data;for(let e=0;e<P.length;e+=4)P[e+3]>10?(P[e]=0,P[e+1]=0,P[e+2]=0):(P[e]=255,P[e+1]=255,P[e+2]=255),P[e+3]=255;return v.putImageData(T,0,0),y}(o);if(!n)return void B("Crop failed (rect too small or out of bounds).");let r=function(e){try{let t=0|e.width,a=0|e.height,n=e.getContext("2d",{willReadFrequently:!0}).getImageData(0,0,t,a).data,r=t*a>12e5?2:1,i=t,o=a,l=-1,s=-1,c=0;for(let e=0;e<a;e+=r){let a=e*t*4;for(let d=0;d<t;d+=r)n[a+4*d]<128&&(c++,d<i&&(i=d),e<o&&(o=e),d>l&&(l=d),e>s&&(s=e))}if(l<0)return null;let d=l-i+1,u=s-o+1;return{xMin:i,yMin:o,xMax:l,yMax:s,w:d,h:u,black:c,W:t,H:a}}catch(e){}return null}(n),i=function(e,t){if(!e||!t)return!1;let a=Math.max(1,0|t.width),n=Math.max(1,0|t.height),r=Math.max(1,0|e.w),i=Math.max(1,0|e.h),o=Math.max(r,i),l=Math.min(r,i),s=r/Math.max(1,i),c=(Number(e.black||0)||0)/Math.max(1,r*i);return!(o>220||l>170||s<.2||s>2.8||c<.01||c>.6||r>Math.floor(.82*a)&&i>Math.floor(.82*n)&&o>140)}(r,n),d=String(l.model||""),u=-1!==d.toLowerCase().indexOf("trocr"),p=n,h="";if(i){try{p=U(n,{dilate:0})}catch(e){p=n}try{p=W(p)}catch(e){}h=await l.recognize(p,{max_new_tokens:16,do_sample:!1,temperature:0})}else h=await $(l,n);if(i){let e=String(h||"").trim();if(-1!==e.indexOf("\\")||-1!==e.indexOf("{")||-1!==e.indexOf("}")||-1!==e.indexOf("^")||-1!==e.indexOf("_")||-1!==e.indexOf("sqrt")||-1!==e.indexOf("frac")||Y(e)){let e=n;try{e=H(n)}catch(t){e=n}try{e=W(e)}catch(e){}h=await l.recognize(e,{max_new_tokens:128,do_sample:!1,temperature:0})}}let g=u?function(e){let t=F(e),a="+-=*/()[]{}",n="";for(let e=0;e<t.length;e++){let r=t[e];if(" "===r){let r=e>0?t[e-1]:"",i=e+1<t.length?t[e+1]:"";if(a.indexOf(r)>=0||a.indexOf(i)>=0)continue;n+=" "}else n+=r}return n.trim()}(h):i?D(N(h)):h;if(g=V(g),i||function(e){let t=String(e||"").trim();if(!t||t.length>6||-1!==t.indexOf("\\"))return!1;let a=!1;for(let e=0;e<t.length;e++){let n=t.charCodeAt(e),r=t[e];if(n>=48&&n<=57||"lLIi|!OoQqSsZzBg".includes(r)){a=!0;continue}if(!" \n\r	()[]{}.,;:_-".includes(r))return!1}return a}(g)){let e=K(g);if(e)g=e;else{let e=function(e){let t=String(e||"").trim();if(!t)return null;let a=!0;for(let e=0;e<t.length;e++){let n=t.charCodeAt(e);if(n<48||n>57){a=!1;break}}if(a)return t;let n=t.toLowerCase();if("li"===n||"l1"===n||"il"===n)return"4";if("go"===n||"g0"===n||"qo"===n||"q0"===n)return"8";let r={O:"0",o:"0",Q:"0",I:"1",l:"1","|":"1","!":"1",Z:"2",z:"2",J:"3",j:"3",H:"4",h:"4",S:"5",s:"5",B:"8",g:"9",q:"9"},i="";for(let e=0;e<t.length;e++){let a=t[e];if(!r[a])return null;i+=r[a]}return i||null}(g);e&&(g=e)}if(!function(e){let t=String(e||"").trim();if(!t)return!1;for(let e=0;e<t.length;e++){let a=t.charCodeAt(e);if(a<48||a>57)return!1}return!0}(g)){let e=await Z(l,n);e&&(g=e)}}B("OCR result: "+g);let f=t.closest(".lia-canvas-pair");(0,c.__liaFindAndSetInputBeforeNode)(f||t,g)?(y.textContent=a("submitted","✅ submitted"),setTimeout(()=>{y.textContent=s},900)):B("Could not find an input field before this @canvas.")}catch(e){B("OCR error: "+(e&&e.message?e.message:String(e))),y.textContent=a("ocrError","⚠ Error"),setTimeout(()=>{y.textContent=s},900)}finally{Q&&(cancelAnimationFrame(Q),Q=0),ee(1),setTimeout(()=>void(v&&(v.dataset.on="0",ee(0))),250),y.disabled=!1,k=!1,S()}}y.addEventListener("click",async e=>{e.preventDefault(),e.stopPropagation(),await et({auto:!1})});let ea=[],en=[];O&&(Array.isArray(O.ITEMS)?(ea=O.ITEMS,en=Array.isArray(O.REDO)?O.REDO:[]):Array.isArray(O.STROKES)&&(ea=O.STROKES.map(e=>({kind:"path",...e})),en=Array.isArray(O.REDO)?O.REDO.map(e=>({kind:"path",...e})):[]));let er="pen",ei="pen",eo=0,el=3,es=1,ec=12,ed=O&&O.bgMode?O.bgMode:"none",eu=O&&O.bgStep?O.bgStep:24,ep=null,eh=null;function eg(e,t,a){return Math.max(t,Math.min(a,e))}function ef(a){if(s){var n;P[s]={VIEW:{...z},ITEMS:ea,REDO:en,bgMode:ed,bgStep:eu,wrapW:t.getBoundingClientRect().width,canvasH:e.clientHeight},n=a||"persist",!s||q&&(clearTimeout(j),j=setTimeout(()=>{(0,l.__liaDispatchCanvasFreezeChange)({uid:s,reason:String(n||"persist"),hasItems:Array.isArray(ea)&&ea.length>0?1:0})},120))}}function em(){let e=o.COLORS[eo]||o.COLORS[0];return"auto"===e.key?(0,o.getAutoPen)():e.value||(0,o.getAutoPen)()}function eb(e){x&&(x.dataset.open=e?"1":"0")}function ex(){x&&"1"===x.dataset.open&&eb(!1)}function ey(){return'<svg viewBox="-1 0 24 24" aria-hidden="true" style="width:22px;height:22px;display:block;"><path class="ico-stroke" d="M6 6l12 12M18 6L6 18" stroke-width="2" stroke-linecap="round"/></svg>'}function ev(){if(!x)return;x.__mode="pen";let e=(0,o.getAutoPen)(),t="";t+=`<span class="lia-heading-row"><span class="lia-tool-heading">${n("pen","Pen")}</span><button class="lia-menu-icon-btn" type="button" data-act="close" aria-label="Close">${ey()}</button></span><span class="lia-color-grid">`;for(let a=0;a<o.COLORS.length;a++){let n=o.COLORS[a],r="auto"===n.key?e:n.value||e;t+=`<button class="lia-color-item" type="button" data-act="color" data-idx="${a}" data-active="${a===eo?"1":"0"}" style="background:${r};" aria-label="Color ${n.key}"></button>`}x.innerHTML=t+=`</span><span class="lia-row"><span class="lia-preview"><span class="lia-preview-line" data-k="pw" style="height:${Math.max(2,Math.min(14,el))}px;"></span></span><input class="lia-slider" type="range" min="1" max="100" step="1" value="${el}" data-act="penWidth" aria-label="Pen width"><span class="lia-menu-value" data-k="pwv" style="font-weight:800;min-width:2.6em;text-align:right">${el}</span></span><span class="lia-row"><span class="lia-preview"><span class="lia-preview-line" data-k="pa" style="opacity:${es};"></span></span><input class="lia-slider" type="range" min="0.15" max="1" step="0.05" value="${es}" data-act="penAlpha" aria-label="Opacity"><span class="lia-menu-value" data-k="pav" style="font-weight:800;min-width:2.6em;text-align:right">${Math.round(100*es)}%</span></span>`,x.onclick=e=>{let t=e.target&&e.target.closest?e.target.closest("[data-act]"):null;if(!t)return;let a=t.getAttribute("data-act");if("close"===a)return void eb(!1);if("color"===a){let e=Number(t.getAttribute("data-idx"));isFinite(e)&&(eo=eg(e,0,o.COLORS.length-1)),er="pen",ej(),ef(),ev();return}};let a=x.querySelector('input[data-act="penWidth"]');a&&(a.oninput=()=>{el=eg(Number(a.value),1,100),ej(),ef();let e=x.querySelector('[data-k="pw"]');e&&(e.style.height=Math.max(2,Math.min(14,el))+"px");let t=x.querySelector('[data-k="pwv"]');t&&(t.textContent=String(el))});let r=x.querySelector('input[data-act="penAlpha"]');r&&(r.oninput=()=>{es=eg(Number(r.value),.05,1),ej(),ef();let e=x.querySelector('[data-k="pa"]');e&&(e.style.opacity=String(es));let t=x.querySelector('[data-k="pav"]');t&&(t.textContent=Math.round(100*es)+"%")})}function ew(){if(!x)return;x.__mode="eraser",x.innerHTML=`<span class="lia-heading-row"><span class="lia-tool-heading">${n("eraser","Eraser")}</span><span style="display:flex;gap:8px;align-items:center"><button class="lia-menu-icon-btn" type="button" data-act="clear" aria-label="Clear all"><svg viewBox="-1 0 24 24" aria-hidden="true" style="width:22px;height:22px;display:block;"><path class="ico-stroke" d="M9 3h6" stroke-width="2" stroke-linecap="round"/><path class="ico-stroke" d="M4 6h16" stroke-width="2" stroke-linecap="round"/><path class="ico-stroke" d="M7 6l1 15h8l1-15" stroke-width="2" stroke-linejoin="round"/><path class="ico-stroke" d="M10 10v8M14 10v8" stroke-width="2" stroke-linecap="round"/></svg></button><button class="lia-menu-icon-btn" type="button" data-act="close" aria-label="Close">${ey()}</button></span></span><span class="lia-row"><span class="lia-preview"><span class="lia-preview-line lia-preview-line--eraser" style="height:${Math.max(2,Math.min(18,ec))}px;"></span></span><input class="lia-slider" type="range" min="4" max="500" step="1" value="${ec}" data-act="eraserWidth" aria-label="Eraser width"><span class="lia-menu-value" data-k="ewv" style="font-weight:800;min-width:2.6em;text-align:right">${ec}</span></span>`,x.onclick=e=>{let t=e.target?.closest?.("[data-act]");if(!t)return;let a=t.getAttribute("data-act");"close"===a?eb(!1):"clear"===a&&(ea.length=0,en.length=0,eP(),eO(),ez(),ej(),ef())};let e=x.querySelector('input[data-act="eraserWidth"]');e&&(e.oninput=()=>{ec=eg(Number(e.value),2,500),ej(),ef();let t=x.querySelector('[data-k="ewv"]');t&&(t.textContent=String(ec))})}function e_(){if(!x)return;x.__mode="bg";let e=n("background","Background");x.innerHTML=`<span class="lia-heading-row"><span class="lia-tool-heading">${e}</span><button class="lia-menu-icon-btn" type="button" data-act="close" aria-label="Close">${ey()}</button></span><span class="lia-bg-tiles"><button class="lia-bg-tile" type="button" data-act="bg" data-mode="none" data-active="${"none"===ed?"1":"0"}" aria-label="No background"></button><button class="lia-bg-tile" type="button" data-act="bg" data-mode="grid" data-active="${"grid"===ed?"1":"0"}" aria-label="Grid"></button><button class="lia-bg-tile" type="button" data-act="bg" data-mode="lined" data-active="${"lined"===ed?"1":"0"}" aria-label="Lined"></button></span><span class="lia-row"><span class="lia-menu-label" style="font-weight:800;opacity:.8;min-width:4.8em">Spacing</span><input class="lia-slider" type="range" min="8" max="80" step="1" value="${eu}" data-act="bgStep" aria-label="Background spacing"><span class="lia-menu-value" data-k="bgsv" style="font-weight:800;min-width:2.6em;text-align:right">${eu}</span></span>`;try{let e=(0,o.rgbaFromAny)((0,o.getAccentCssVar)(),.65),t=x.querySelectorAll(".lia-bg-tile");t&&t.length>=3&&(t[1].style.backgroundImage=`linear-gradient(to right, ${e} 2px, transparent 2px), linear-gradient(to bottom, ${e} 2px, transparent 2px)`,t[1].style.backgroundSize="10px 10px",t[1].style.backgroundPosition="center",t[2].style.backgroundImage=`linear-gradient(to bottom, ${e} 2px, transparent 2px)`,t[2].style.backgroundSize="10px 10px",t[2].style.backgroundPosition="center")}catch(e){}x.onclick=e=>{let t=e.target?.closest?.("[data-act]");if(!t)return;let a=t.getAttribute("data-act");if("close"===a)return void eb(!1);if("bg"===a){let e=String(t.getAttribute("data-mode")||"none");ed="grid"===e||"lined"===e?e:"none",ez(),ef(),e_(),ej();return}};let t=x.querySelector('input[data-act="bgStep"]');t&&(t.oninput=()=>{eu=eg(Number(t.value),6,300),ez(),ef();let e=x.querySelector('[data-k="bgsv"]');e&&(e.textContent=String(eu))})}function ek(){for(let e=ea.length-1;e>=0;e--){let t=ea[e];if(t&&"rect"===t.kind)return t}return null}function eS(){C&&(C.dataset.on="0")}function eM(t,a){if(!C)return;if("eraser"!==er||!isFinite(t)||!isFinite(a))return void eS();let n=Math.max(8,ec*z.scale);C.style.width=n+"px",C.style.height=n+"px",C.style.left=eg(t,0,e.clientWidth)+"px",C.style.top=eg(a,0,e.clientHeight)+"px",C.dataset.on="1"}let eA=0;function eC(){eA||(eA=requestAnimationFrame(()=>{eA=0,function(){let t=ek();if(!t){y.style.display="none",A&&(A.style.display="none");return}y.style.display="block",y.style.visibility="hidden";let a=y.offsetWidth||180,n=y.offsetHeight||34;y.style.visibility="visible";let r=Math.min(t.x0,t.x1),i=Math.min(t.y0,t.y1),o=Math.max(t.x0,t.x1),l=Math.max(t.y0,t.y1),s=eE(r,i),c=eE(o,l),d=Math.max(s.sx,c.sx),u=Math.max(s.sy,c.sy),p=eg(d-a,6,e.clientWidth-a-6),h=eg(u+8,6,e.clientHeight-n-6);if(y.style.left=p+"px",y.style.top=h+"px",v){v.style.width=a+"px";let t=v.offsetHeight||26;v.style.left=eg(p,6,e.clientWidth-a-6)+"px",v.style.top=eg(h-t-6,6,e.clientHeight-t-6)+"px"}if(A){A.style.display="block",A.style.visibility="hidden";let t=A.offsetWidth||24,a=A.offsetHeight||24;A.style.visibility="visible";let n=Math.min(s.sy,c.sy),r=Math.max(s.sx,c.sx);A.style.left=eg(r-.5*t,6,e.clientWidth-t-6)+"px",A.style.top=eg(n-.5*a,6,e.clientHeight-a-6)+"px"}}()}))}function eL(e,t){return{x:(e-z.panX)/z.scale,y:(t-z.panY)/z.scale}}function eE(e,t){return{sx:e*z.scale+z.panX,sy:t*z.scale+z.panY}}function eI(e){let t=window.devicePixelRatio||1;e.setTransform(t*z.scale,0,0,t*z.scale,t*z.panX,t*z.panY)}function eR(t){let a=window.devicePixelRatio||1;t.setTransform(a,0,0,a,0,0),t.globalCompositeOperation="source-over",t.globalAlpha=1,t.clearRect(0,0,e.clientWidth,e.clientHeight)}function eT(e,t){"eraser"===t.tool?(e.globalCompositeOperation="destination-out",e.globalAlpha=1,e.strokeStyle="rgba(0,0,0,1)"):(e.globalCompositeOperation="source-over",e.globalAlpha=t.alpha,e.strokeStyle=t.color),e.lineWidth=t.width,e.lineCap="round",e.lineJoin="round"}function eP(){for(let e of(eR(I),eI(I),ea)){if(!e||"rect"!==e.kind)continue;let t="accent"===e.colorKey?(0,o.getAccentCssVar)():e.color||(0,o.getAccentCssVar)(),a=(0,o.rgbaFromAny)(t,Math.max(0,Math.min(1,e.alpha))),n=Math.min(e.x0,e.x1),r=Math.min(e.y0,e.y1),i=Math.max(e.x0,e.x1),l=Math.max(e.y0,e.y1);I.save(),I.globalCompositeOperation="source-over",I.globalAlpha=1,I.fillStyle=a,I.fillRect(n,r,Math.max(0,i-n),Math.max(0,l-r)),I.restore()}}function eO(){for(let e of(eR(T),eI(T),ea))if(e&&"path"===e.kind&&e.points&&!(e.points.length<2)){eT(T,e),T.beginPath(),T.moveTo(e.points[0].x,e.points[0].y);for(let t=1;t<e.points.length;t++)T.lineTo(e.points[t].x,e.points[t].y);T.stroke()}}function ez(){let t;t=window.devicePixelRatio||1,L.setTransform(t,0,0,t,0,0),L.globalCompositeOperation="source-over",L.globalAlpha=1,L.clearRect(0,0,e.clientWidth,e.clientHeight),function(){let t,a;if("none"===ed)return;let n=window.devicePixelRatio||1;L.setTransform(n*z.scale,0,0,n*z.scale,n*z.panX,n*z.panY);let r=Math.max(6,Number(eu)||24),i=(t=e.clientWidth,a=e.clientHeight,{x0:(0-z.panX)/z.scale,y0:(0-z.panY)/z.scale,x1:(t-z.panX)/z.scale,y1:(a-z.panY)/z.scale}),l=(0,o.rgbaFromAny)((0,o.getAccentCssVar)(),.65);L.save(),L.globalCompositeOperation="source-over",L.globalAlpha=1,L.strokeStyle=l,L.lineWidth=1.125/z.scale;let s=Math.floor(i.x0/r)*r,c=Math.ceil(i.x1/r)*r,d=Math.floor(i.y0/r)*r,u=Math.ceil(i.y1/r)*r;if(L.beginPath(),"grid"===ed){let e=0;for(let t=s;t<=c&&(L.moveTo(t,i.y0),L.lineTo(t,i.y1),!(++e>4e3));t+=r);for(let t=d;t<=u&&(L.moveTo(i.x0,t),L.lineTo(i.x1,t),!(++e>4e3));t+=r);}else{let e=0;for(let t=d;t<=u&&(L.moveTo(i.x0,t),L.lineTo(i.x1,t),!(++e>4e3));t+=r);}L.stroke(),L.restore()}();let a=window.devicePixelRatio||1;if(L.setTransform(a,0,0,a,0,0),L.globalCompositeOperation="source-over",L.globalAlpha=1,L.drawImage(E,0,0,E.width,E.height,0,0,e.clientWidth,e.clientHeight),eh){let e=(0,o.rgbaFromAny)((0,o.getAccentCssVar)(),.28),t=Math.min(eh.x0,eh.x1),a=Math.min(eh.y0,eh.y1),n=Math.max(eh.x0,eh.x1),r=Math.max(eh.y0,eh.y1),i=eE(t,a),l=eE(n,r);L.save(),L.fillStyle=e,L.globalAlpha=1,L.fillRect(i.sx,i.sy,Math.max(0,l.sx-i.sx),Math.max(0,l.sy-i.sy)),L.restore()}L.drawImage(R,0,0,R.width,R.height,0,0,e.clientWidth,e.clientHeight),eC()}function ej(){let e=em(),t=(0,o.getAccentCssVar)(),r=n("pen","Pen"),i=n("eraser","Eraser");if(p&&(p.disabled=0===ea.length,p.title="Undo",p.setAttribute("aria-label","Undo")),h&&(h.disabled=0===en.length,h.title="Redo",h.setAttribute("aria-label","Redo")),g&&(g.style.background=e,g.dataset.active="pen"===er?"1":"0",g.title=r,g.setAttribute("aria-label",r)),f&&(f.dataset.active="eraser"===er?"1":"0",f.title=i,f.setAttribute("aria-label",i)),m){let e=a("selectSubmit","Submit as Solution");m.style.background="transparent",m.dataset.active="rect"===er?"1":"0",m.title=e,m.setAttribute("aria-label",e)}if(b){let e=n("background","Background"),a=(0,o.rgbaFromAny)(t,.65);b.style.backgroundColor="transparent",b.style.backgroundImage=`linear-gradient(to right, ${a} 1.8px, transparent 1.8px), linear-gradient(to bottom, ${a} 1.8px, transparent 1.8px)`,b.style.backgroundSize="6px 6px",b.style.backgroundPosition="center",b.dataset.active="bg"===ei?"1":"0",b.title=e,b.setAttribute("aria-label",e)}"eraser"!==er&&eS()}function eq(e,t){ep&&(ep.points.push({x:e,y:t}),T.lineTo(e,t))}function eB(e,t){ep&&(!function(e,t){if(!ep)return;let a=ep.points,n=a&&a.length?a[a.length-1]:null;if(!n){let a=eL(e,t);eq(a.x,a.y);return}let r=eE(n.x,n.y),i=e-r.sx,o=t-r.sy,l=Math.hypot(i,o);if(l<.35)return;if(l>1.4){let e=Math.min(12,Math.max(0,Math.floor(l/1.4)));for(let t=1;t<=e;t++){let a=t/(e+1),n=eL(r.sx+i*a,r.sy+o*a);eq(n.x,n.y)}}let s=eL(e,t);eq(s.x,s.y)}(e,t),T.stroke(),ez(),ef())}function eF(e){if(eh){if(e){let e=Math.min(eh.x0,eh.x1),t=Math.min(eh.y0,eh.y1),a=Math.max(eh.x0,eh.x1),n=Math.max(eh.y0,eh.y1);if(a-e>.001&&n-t>.001){for(let e=ea.length-1;e>=0;e--)ea[e]&&"rect"===ea[e].kind&&ea.splice(e,1);for(let e=en.length-1;e>=0;e--)en[e]&&"rect"===en[e].kind&&en.splice(e,1);ea.push({kind:"rect",x0:e,y0:t,x1:a,y1:n,alpha:.28,colorKey:"accent"}),en.length=0}}eh=null,eP(),ez(),ej(),ef(),eC()}}function eN(){eS();let t=window.devicePixelRatio||1,a=e.clientWidth,n=e.clientHeight,r=Math.max(1,Math.round(a*t)),i=Math.max(1,Math.round(n*t));e.width=r,e.height=i,E.width=r,E.height=i,R.width=r,R.height=i,eP(),eO(),ez(),ej(),ef()}ej(),eN(),S();let eD=new ResizeObserver(()=>eN());eD.observe(e),!function(){if(t.__cornersReady)return;t.__cornersReady=!0;let a=document.createElement("button");a.type="button",a.className="lia-resize-corner",a.dataset.corner="bl",a.setAttribute("aria-label","Resize drawing area (bottom left)");let n=document.createElement("button");n.type="button",n.className="lia-resize-corner",n.dataset.corner="br",n.setAttribute("aria-label","Resize drawing area (bottom right)"),t.appendChild(a),t.appendChild(n);let r=(e,t,a)=>Math.max(t,Math.min(a,e));function i(a,n){let i=!1,o=0,l=0,s=0,c=0;function d(e){if(i){i=!1;try{a.releasePointerCapture(e.pointerId)}catch(e){}eN(),ef()}}a.addEventListener("pointerdown",function(n){ex(),n.preventDefault(),n.stopPropagation(),i=!0,s=t.getBoundingClientRect().width,c=e.clientHeight||245,o=n.clientX,l=n.clientY;try{a.setPointerCapture(n.pointerId)}catch(e){}}),a.addEventListener("pointermove",function(a){if(!i)return;a.preventDefault();let d=a.clientX-o,u=a.clientY-l;e.style.height=r(c+u,130,9e3)+"px";let p=function(){let e=t.closest(".lia-canvas-mount")||t.parentElement||t,a=0;try{a=e.getBoundingClientRect().width}catch(e){}if((!a||a<200)&&document.querySelector("main"))try{a=document.querySelector("main").getBoundingClientRect().width}catch(e){}return Math.max(200,Math.floor(a||200))}();t.style.width=r("br"===n?s+d:s-d,200,p)+"px"}),a.addEventListener("pointerup",d),a.addEventListener("pointercancel",d)}i(n,"br"),i(a,"bl")}();let eV=()=>{(0,c.__liaRefreshAllTexPreviewBorders)(document),ej(),eP(),eO(),ez()};document.addEventListener("lia-canvas-theme",eV),p&&!p.__bound&&(p.__bound=!0,p.addEventListener("click",e=>{e.preventDefault(),e.stopPropagation(),ea.length&&(en.push(ea.pop()),eP(),eO(),ez(),ej(),ef())})),h&&!h.__bound&&(h.__bound=!0,h.addEventListener("click",e=>{e.preventDefault(),e.stopPropagation(),en.length&&(ea.push(en.pop()),eP(),eO(),ez(),ej(),ef())})),m&&!m.__bound&&(m.__bound=!0,m.addEventListener("click",e=>{e.stopPropagation(),er="rect",ei="rect",eb(!1),ej()})),g&&x&&g.addEventListener("click",e=>{e.stopPropagation(),er="pen",ei="pen";let t="1"===x.dataset.open,a="pen"===x.__mode;t&&a||ev(),eb(!t||!a),ej()}),f&&x&&f.addEventListener("click",e=>{e.stopPropagation(),er="eraser",ei="eraser";let t="1"===x.dataset.open,a="eraser"===x.__mode;t&&a||ew(),eb(!t||!a),ej()}),b&&x&&b.addEventListener("click",e=>{e.stopPropagation(),ei="bg";let t="1"===x.dataset.open,a="bg"===x.__mode;t&&a||e_(),eb(!t||!a),ej()});let eW=e=>{t.contains(e.target)||eb(!1)},eH=e=>{"Escape"===e.key&&eb(!1)};document.addEventListener("click",eW),document.addEventListener("keydown",eH);let eU=!1,eX=e=>{"Space"===e.code&&(eU=!0)},e$=e=>{"Space"===e.code&&(eU=!1)};window.addEventListener("keydown",eX),window.addEventListener("keyup",e$);let eG=new MutationObserver(()=>{t.isConnected||(eD.disconnect(),document.removeEventListener("lia:canvas-i18n-update",M),document.removeEventListener("lia-canvas-theme",eV),document.removeEventListener("click",eW),document.removeEventListener("keydown",eH),window.removeEventListener("keydown",eX),window.removeEventListener("keyup",e$),eG.disconnect())}),eY=t.parentElement||document.body;function eK(e){return Math.max(z.minScale,Math.min(z.maxScale,e))}eG.observe(eY,{childList:!0,subtree:!0}),e.addEventListener("contextmenu",e=>e.preventDefault()),e.addEventListener("wheel",t=>{ex(),t.preventDefault(),eS();let a=e.getBoundingClientRect();!function(e,t,a){let n=z.scale,r=eK(n*e);if(r===n)return;let i=eL(t,a);z.scale=r,z.panX=t-i.x*r,z.panY=a-i.y*r,eP(),eO(),ez(),ef()}(Math.exp(-(.0012*t.deltaY)),t.clientX-a.left,t.clientY-a.top)},{passive:!1});let eZ=new Map,eQ="idle",eJ=0,e0=0,e1=null;function e2(t){let a=e.getBoundingClientRect();return{sx:t.clientX-a.left,sy:t.clientY-a.top}}function e5(e,t){return Math.hypot(e.sx-t.sx,e.sy-t.sy)}function e8(e,t){return{sx:(e.sx+t.sx)/2,sy:(e.sy+t.sy)/2}}function e4(t){"pen"===String(t.pointerType||"").toLowerCase()&&u.activePenPointers.delete(t.pointerId),eS(),eZ.has(t.pointerId)&&eZ.delete(t.pointerId);try{e.releasePointerCapture(t.pointerId)}catch(e){}if("pinch"===eQ){eZ.size<2&&(e1=null,eQ="idle");return}if("pan"===eQ){eQ="idle",e.style.cursor="crosshair";return}if("rect"===eQ){0===eZ.size&&(eF(!0),eQ="idle");return}if("draw"===eQ){ep=null,eQ="idle",ej(),ef();return}}e.addEventListener("pointerdown",t=>{let a,n;if("pen"===String(t.pointerType||"").toLowerCase()&&u.activePenPointers.add(t.pointerId),"touch"===String(t.pointerType||"").toLowerCase()&&u.activePenPointers.size>0){t.cancelable&&t.preventDefault(),t.stopPropagation();return}if(ex(),t.target?.classList?.contains("lia-resize-corner"))return;let r=e2(t);if(eZ.set(t.pointerId,r),e.setPointerCapture(t.pointerId),2===eZ.size){eS(),"draw"===eQ&&(ep=null),"rect"===eQ&&eF(!1);let e=Array.from(eZ.values()),t=e8(e[0],e[1]);e1={dist:Math.max(1e-6,e5(e[0],e[1])),worldMid:eL(t.sx,t.sy),startScale:z.scale},eQ="pinch";return}let i="mouse"===t.pointerType&&2===t.button,o="mouse"===t.pointerType&&1===t.button;if(i||o||"mouse"===t.pointerType&&eU){eS(),eQ="pan",eJ=r.sx,e0=r.sy,e.style.cursor="grab";return}if("rect"===er){let t;eS(),eQ="rect",e.style.cursor="crosshair",eh={x0:(t=eL(r.sx,r.sy)).x,y0:t.y,x1:t.x,y1:t.y},ez();return}eQ="draw",e.style.cursor="crosshair",a=eL(r.sx,r.sy),n={kind:"path",tool:er,color:em(),alpha:es,width:"eraser"===er?ec:el,points:[{x:a.x,y:a.y}]},ea.push(n),ep=n,en.length=0,eI(T),eT(T,n),T.beginPath(),T.moveTo(a.x,a.y),ej(),ef(),"eraser"===er?eM(r.sx,r.sy):eS()}),e.addEventListener("pointermove",e=>{if("pen"===String(e.pointerType||"").toLowerCase()&&(e.pressure>0||0!==e.buttons?u.activePenPointers.add(e.pointerId):u.activePenPointers.delete(e.pointerId)),"touch"===String(e.pointerType||"").toLowerCase()&&u.activePenPointers.size>0){eZ.has(e.pointerId)&&eZ.delete(e.pointerId),e.cancelable&&e.preventDefault(),e.stopPropagation();return}if(!eZ.has(e.pointerId))return;let t=e2(e);if(eZ.set(e.pointerId,t),"eraser"===er&&"pan"!==eQ&&"pinch"!==eQ&&"rect"!==eQ?eM(t.sx,t.sy):eS(),"pinch"===eQ&&eZ.size>=2&&e1){let e=Array.from(eZ.values()).slice(0,2),t=e8(e[0],e[1]),a=Math.max(1e-6,e5(e[0],e[1])),n=eK(e1.startScale*(a/e1.dist));z.scale=n,z.panX=t.sx-e1.worldMid.x*n,z.panY=t.sy-e1.worldMid.y*n,eP(),eO(),ez(),ef();return}if("pan"===eQ){let e=t.sx-eJ,a=t.sy-e0;eJ=t.sx,e0=t.sy,z.panX+=e,z.panY+=a,eP(),eO(),ez(),ef();return}if("rect"===eQ)return void function(e,t){if(!eh)return;let a=eL(e,t);eh.x1=a.x,eh.y1=a.y,ez()}(t.sx,t.sy);if("draw"===eQ){let a=!1;if("function"==typeof e.getCoalescedEvents){let t=e.getCoalescedEvents();if(Array.isArray(t)&&t.length){for(let e of t){if(!e)continue;let t=e2(e);eB(t.sx,t.sy)}a=!0}}a||eB(t.sx,t.sy)}}),e.addEventListener("pointerup",e4),e.addEventListener("pointercancel",e4),e.addEventListener("pointerleave",t=>{"pen"===String(t.pointerType||"").toLowerCase()&&u.activePenPointers.delete(t.pointerId),eS(),"draw"===eQ&&(ep=null),"pinch"!==eQ&&(eQ="idle"),e.style.cursor="crosshair",ej(),ef()}),q=!0}(e)}),(0,c.__liaInitTexPreviews)()}},{"../index":"bZBjE","./theme":"9gAEw","./store":"bxEU5","./freeze":"cCz1j","../lia/input":"8t34P","@parcel/transformer-js/src/esmodule-helpers.js":"9p1zA","../lia/i18n":"4oC8I"}],"8t34P":[function(e,t,a,n){var r=e("@parcel/transformer-js/src/esmodule-helpers.js");r.defineInteropFlag(a),r.export(a,"__liaRegisterCanvasTexField",()=>l),r.export(a,"__liaRefreshAllTexPreviewBorders",()=>c),r.export(a,"__liaApplyValue",()=>f),r.export(a,"__liaReadFieldValue",()=>m),r.export(a,"__liaAutoSizeTexWidgets",()=>b),r.export(a,"__liaFindAndSetInputBeforeNode",()=>k),r.export(a,"__liaInitTexPreviews",()=>S);var i=e("../index"),o=e("./i18n");function l(e){if(!e)return;e.dataset.liaCanvasTex="1";let t=window.__LIA_CANVAS_TEX_FIELDS__=window.__LIA_CANVAS_TEX_FIELDS__||[];-1===t.indexOf(e)&&t.push(e)}function s(e){let t;if(!e||!e.__liaTexPreviewBox)return;let a=e.__liaTexPreviewBox;if(a.style.removeProperty("--lia-tex-preview-border"),!function(e){try{if(!e||!e.classList)return!1;if(e.classList.contains("is-success")||e.classList.contains("is-failure")||e.classList.contains("is-warning")||e.classList.contains("is-partial")||e.classList.contains("is-resolved")||e.getAttribute&&"true"===e.getAttribute("aria-invalid"))return!0}catch(e){}return!1}(e))return;let n="";try{let t=getComputedStyle(e);n=t.borderTopColor||t.borderColor||t.outlineColor||""}catch(e){}(t=String(n||"").trim().toLowerCase())&&"transparent"!==t&&"rgba(0, 0, 0, 0)"!==t&&"rgba(0,0,0,0)"!==t&&a.style.setProperty("--lia-tex-preview-border",n)}function c(e){(e&&e.querySelectorAll?e:document).querySelectorAll(".lia-canvas-pair").forEach(e=>{let t=_(e);t&&s(t)})}function d(e){if(!e||!e.__liaTexPreviewBox)return;let t=m(e),a=document.activeElement===e;if(e.__liaTexPreviewLastValue===t&&e.__liaTexPreviewLastFocused===a)return;e.__liaTexPreviewLastValue=t,e.__liaTexPreviewLastFocused=a;let n=e.__liaTexPreviewBox,r=n.querySelector(".lia-tex-preview-math");r&&y(r,t),a?(n.dataset.on="0",n.style.display="none",e.style.display="",b(e)):v(e)}function u(e){(e&&e.querySelectorAll?e:document).querySelectorAll(".lia-canvas-pair").forEach(e=>{let t=_(e);t&&(w(t),s(t),t.__liaTexPreviewLastValue=null,t.__liaTexPreviewLastFocused=null,d(t),document.activeElement!==t&&v(t))})}let p=0,h=[0,0,0];function g(e){clearTimeout(p),p=setTimeout(()=>{u(document)},Math.max(0,e||0))}function f(e,t){let a=String(t);try{if(e&&e.getAttribute&&"true"===e.getAttribute("contenteditable"))return e.textContent=a,e.dispatchEvent(new Event("input",{bubbles:!0})),e.dispatchEvent(new Event("change",{bubbles:!0})),!0;if(e&&"value"in e)return e.value=a,e.dispatchEvent(new Event("input",{bubbles:!0})),e.dispatchEvent(new Event("change",{bubbles:!0})),!0}catch(e){}return!1}function m(e){try{if(!e)return"";if(e.getAttribute&&"true"===e.getAttribute("contenteditable"))return String(e.textContent||"");if("value"in e)return String(e.value||"")}catch(e){}return""}function b(e){if(!e)return;let t=e.__liaTexPreviewBox||null,a=t?t.querySelector(".lia-tex-preview-math"):null;requestAnimationFrame(function(){try{let r=140;if(t&&a&&"1"===t.dataset.on){let e=a.scrollWidth||a.getBoundingClientRect().width||0,n=t.querySelector(".lia-tex-preview-hint"),i=n&&n.getBoundingClientRect().width||0;r=e+i+32}else{let t=m(e);r=Math.max(140,9.92*t.length+28)}var n=r;let i=Math.max(80,Math.min(Math.ceil(n),function(e){try{let t=e&&e.parentElement?e.parentElement:null;if(!t)return 900;let a=t.getBoundingClientRect();if(!a||!a.width)return 900;return Math.max(80,Math.floor(a.width-8))}catch(e){}return 900}(t||e)));try{e.style.width=i+"px",e.style.maxWidth="100%",e.style.boxSizing="border-box"}catch(e){}if(t)try{t.style.width=i+"px",t.style.maxWidth="100%",t.style.boxSizing="border-box"}catch(e){}if(a)try{a.style.minWidth="0",a.style.maxWidth="100%"}catch(e){}}catch(e){}})}let x=null;function y(e,t){let a=String(t||"").trim();if(e.innerHTML="",!a)return!1;let n=e.closest?e.closest(".lia-tex-preview"):null,r=n?n.previousElementSibling:null,o=(0,i.getRootWindow)(),l=window.katex||o.katex||null;function s(){r&&b(r)}try{if(l&&"function"==typeof l.render)return l.render(a,e,{throwOnError:!1,displayMode:!1}),s(),!0}catch(e){}return(function(){let e=(0,i.getRootWindow)(),t=[window.katex,e.katex,window.KaTeX,e.KaTeX];for(let e=0;e<t.length;e++){let a=t[e];if(a&&"function"==typeof a.render)return Promise.resolve(a)}return x||(x=(async()=>{let t=e.document||document;if(!t.getElementById("__lia_katex_css_v1")){let e=t.createElement("link");e.id="__lia_katex_css_v1",e.rel="stylesheet",e.href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css",(t.head||t.documentElement).appendChild(e)}let a=await Function("u","return import(u)")("https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.mjs"),n=a&&(a.default||a);if(!n||"function"!=typeof n.render)throw Error("KaTeX render not available.");try{e.katex||(e.katex=n)}catch(e){}try{window.katex||(window.katex=n)}catch(e){}return n})())})().then(t=>{if(e&&e.isConnected){e.innerHTML="";try{t.render(a,e,{throwOnError:!1,displayMode:!1})}catch(t){e.textContent=a}s()}}).catch(()=>{e&&e.isConnected&&(e.textContent=a,s())}),e.textContent=a,s(),!1}function v(e){if(!e||!e.__liaTexPreviewBox)return;let t=e.__liaTexPreviewBox,a=m(e).trim();if(!a){t.dataset.on="0",t.style.display="none",e.style.display="";return}let n=t.querySelector(".lia-tex-preview-math");n&&y(n,a),t.dataset.on="1",t.style.display="inline-flex",e.style.display="none",b(e)}function w(e){if(!e)return null;if(e.__liaTexPreviewReady)return e;if(e.__liaTexPreviewReady=!0,l(e),!e.__liaTexPreviewBorderObserver){let t=new MutationObserver(()=>{s(e)});t.observe(e,{attributes:!0,attributeFilter:["class","style","aria-invalid"]}),e.__liaTexPreviewBorderObserver=t}s(e);let t=document.createElement("span"),a=(0,o.liaT)("canvas.edit","Edit");return t.className="lia-tex-preview",t.dataset.on="0",t.innerHTML=`
    <span class="lia-tex-preview-math"></span>
        <span class="lia-tex-preview-hint">${a}</span>
  `,t.addEventListener("click",t=>{t.preventDefault(),t.stopPropagation(),function(e){if(!e||!e.__liaTexPreviewBox)return;let t=document.body;if(t&&(t.classList.contains("lia-snapshot-mode")||t.classList.contains("lia-course-frozen")))return v(e);let a=e.__liaTexPreviewBox;a.dataset.on="0",a.style.display="none",e.style.display="",b(e);try{e.focus(),"function"==typeof e.select&&e.select()}catch(e){}}(e)}),e.insertAdjacentElement("afterend",t),e.__liaTexPreviewBox=t,e.addEventListener("input",()=>{d(e)}),e.addEventListener("change",()=>{d(e)}),e.addEventListener("focus",()=>{d(e)}),e.addEventListener("blur",()=>{setTimeout(()=>v(e),0)}),e.addEventListener("keydown",t=>{let a=e.tagName&&"TEXTAREA"===e.tagName.toUpperCase()||e.getAttribute&&"true"===e.getAttribute("contenteditable");if("Escape"===t.key){t.preventDefault(),v(e);return}"Enter"!==t.key||a||(t.preventDefault(),v(e))}),v(e),d(e),e}function _(e){try{if(!e||1!==e.nodeType)return null;function t(e){if(!e||1!==e.nodeType)return null;let t=e.querySelector&&e.querySelector('[contenteditable="true"]');if(t)return t;let a=e.querySelectorAll?e.querySelectorAll("input, textarea"):null;return a&&a.length?a[a.length-1]:null}let a=e.previousElementSibling;for(;a;){if(a.matches&&(a.matches("input, textarea")||"true"===a.getAttribute("contenteditable")))return a;let e=t(a);if(e)return e;a=a.previousElementSibling}let n=e;for(let e=0;e<10;e++){let e=n.parentElement;if(!e)break;let a=Array.from(e.children),r=a.indexOf(n);for(let e=r-1;e>=0;e--){let n=a[e];if(n.matches&&(n.matches("input, textarea")||"true"===n.getAttribute("contenteditable")))return n;let r=t(n);if(r)return r}n=e}}catch(e){}return null}function k(e,t){let a=_(e);return!!a&&!!f(a,t)&&(!function(e){function t(){let t=_(e);return!!t&&(w(t),v(t),!0)}if(t())return;let a=e.parentElement;if(!a)return;let n=new MutationObserver(()=>{t()&&n.disconnect()});n.observe(a,{childList:!0,subtree:!0}),setTimeout(()=>n.disconnect(),2e3)}(e),!0)}function S(){document.querySelectorAll(".lia-canvas-pair").forEach(e=>{let t=_(e);t&&(w(t),s(t))})}if(window.__LIA_CANVAS_TEX_SYNC_BOOT__||(window.__LIA_CANVAS_TEX_SYNC_BOOT__=!0,setInterval(()=>{let e=window.__LIA_CANVAS_TEX_FIELDS__||[];for(let t=e.length-1;t>=0;t--){let a=e[t];if(!a||!a.isConnected){e.splice(t,1);continue}d(a)}},250)),!window.__LIA_CANVAS_TEX_REFRESH_BRIDGE__){window.__LIA_CANVAS_TEX_REFRESH_BRIDGE__=!0;let e=()=>{[0,80,200].forEach((e,t)=>{clearTimeout(h[t]),h[t]=setTimeout(()=>{u(document)},e)})};try{window.addEventListener("lia:freeze-tex-refresh",e,!0)}catch(e){}try{document.addEventListener("lia:freeze-tex-refresh",e,!0)}catch(e){}document.addEventListener("focusout",e=>{let t=e.target;if(t){if(t.dataset&&"1"===t.dataset.liaCanvasTex)return void g(0);t.matches&&t.matches('input, textarea, [contenteditable="true"]')&&g(0)}},!0),document.addEventListener("change",e=>{let t=e.target;!t||t.matches&&t.matches('input, textarea, [contenteditable="true"]')&&g(0)},!0)}},{"@parcel/transformer-js/src/esmodule-helpers.js":"9p1zA","../index":"bZBjE","./i18n":"4oC8I"}]},["bZBjE"],"bZBjE","parcelRequirecca2",{});
//# sourceMappingURL=index.js.map
