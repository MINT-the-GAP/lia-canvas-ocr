!function(e,t,a,n,r){var i="u">typeof globalThis?globalThis:"u">typeof self?self:"u">typeof window?window:"u">typeof global?global:{},o="function"==typeof i[n]&&i[n],l=o.i||{},s=o.cache||{},c="u">typeof module&&"function"==typeof module.require&&module.require.bind(module);function d(t,a){if(!s[t]){if(!e[t]){if(r[t])return r[t];var l="function"==typeof i[n]&&i[n];if(!a&&l)return l(t,!0);if(o)return o(t,!0);if(c&&"string"==typeof t)return c(t);var u=Error("Cannot find module '"+t+"'");throw u.code="MODULE_NOT_FOUND",u}h.resolve=function(a){var n=e[t][1][a];return null!=n?n:a},h.cache={};var p=s[t]=new d.Module(t);e[t][0].call(p.exports,h,p,p.exports,i)}return s[t].exports;function h(e){var t=h.resolve(e);if(!1===t)return{};if(Array.isArray(t)){var a={__esModule:!0};return t.forEach(function(e){var t=e[0],n=e[1],r=e[2]||e[0],i=d(n);"*"===t?Object.keys(i).forEach(function(e){"default"===e||"__esModule"===e||Object.prototype.hasOwnProperty.call(a,e)||Object.defineProperty(a,e,{enumerable:!0,get:function(){return i[e]}})}):"*"===r?Object.defineProperty(a,t,{enumerable:!0,value:i}):Object.defineProperty(a,t,{enumerable:!0,get:function(){return"default"===r?i.__esModule?i.default:i:i[r]}})}),a}return d(t)}}d.isParcelRequire=!0,d.Module=function(e){this.id=e,this.bundle=d,this.require=c,this.exports={}},d.modules=e,d.cache=s,d.parent=o,d.distDir=void 0,d.publicUrl=void 0,d.devServer=void 0,d.i=l,d.register=function(t,a){e[t]=[function(e,t){t.exports=a},{}]},Object.defineProperty(d,"root",{get:function(){return i[n]}}),i[n]=d;for(var u=0;u<t.length;u++)d(t[u]);if(a){var p=d(a);"object"==typeof exports&&"u">typeof module?module.exports=p:"function"==typeof define&&define.amd&&define(function(){return p})}}({gFFiE:[function(e,t,a,n){var r=e("@parcel/transformer-js/src/esmodule-helpers.js");r.defineInteropFlag(a),r.export(a,"getRootWindow",()=>d),r.export(a,"LIA",()=>u);var i=e("./ocr/bar"),o=e("./ocr/engine"),l=e("./canvas/theme"),s=e("./canvas/freeze"),c=e("./canvas/index");function d(){let e=window;try{for(;e.parent&&e.parent!==e;)e=e.parent}catch(e){}return e}let u=window.__LIA_CANVAS_OCR__=window.__LIA_CANVAS_OCR__||{SHOW_BAR:!1,bar:null,ocr:null,tfjs:null,tfjsLoad:null,store:{},uidSeq:0,freeze:{},barBoot:!1,canvasBoot:!1,launcherBound:!1},p=".lia-canvas-pair",h=["class","style","data-theme","data-color-scheme"],f=null,g=null,m=0,b=!1,x=d(),y="__LIA_CANVAS_OCR_REG_V1__";x[y]=x[y]||{inited:{}};let v=document.baseURI||location.href;function w(){if(!u.canvasBoot){if(u.canvasBoot=!0,u.uidSeq=u.uidSeq||0,f&&(f.disconnect(),f=null),u.discoveryObserver){try{u.discoveryObserver.disconnect()}catch(e){}u.discoveryObserver=null}u.barBoot||(u.barBoot=!0,(0,i.ensureOcrBar)()),function(){if(!u.themeBoot){u.themeBoot=!0,u.themeObserver=g=new MutationObserver(()=>k()),_();try{let e=window.matchMedia("(prefers-color-scheme: dark)");"function"==typeof e.addEventListener?e.addEventListener("change",k):"function"==typeof e.addListener&&e.addListener(k)}catch(e){}window.addEventListener("resize",k,{passive:!0})}}(),(0,o.ensureOcrEngine)(),(0,s.ensureCanvasFreezeApi)(),(0,c.initAll)(),u.launcherBound||(u.launcherBound=!0,document.addEventListener("click",e=>{let t=e.target?.closest?.(".lia-canvas-launch");if(!t)return;let a=t.closest(".lia-canvas-pair");if(!a)return;let n=a.querySelector(".lia-canvas-mount");if(n){n.dataset.uid||(u.uidSeq=(u.uidSeq||0)+1,n.dataset.uid="c"+u.uidSeq);try{let e=n.parentElement;if(e){let t=getComputedStyle(e);String(t.display).includes("flex")&&"nowrap"===String(t.flexWrap)&&(e.style.flexWrap="wrap")}}catch(e){}"1"!==n.dataset.open?(n.dataset.open="1",n.querySelector(".lia-draw-wrap")||(n.innerHTML=(0,c.canvasMarkup)(),(0,c.initAll)())):n.dataset.open="0"}},!0))}}function _(){if(!b){b=!0,g&&g.disconnect();try{(0,l.applyThemeVars)()}finally{g&&g.takeRecords(),function(){if(!g)return;let e=(0,l.getThemeDocument)(),t={attributes:!0,attributeFilter:h};for(let a of[e.documentElement,e.body].filter((e,t,a)=>!!e&&a.indexOf(e)===t))try{g.observe(a,t)}catch(e){}}(),b=!1}}}function k(){m||(m=requestAnimationFrame(()=>{m=0,_()}))}x[y].inited[v]||(x[y].inited[v]=!0,function(){if(document.querySelector(p))return w();if(u.discoveryBoot)return;u.discoveryBoot=!0;let e=document.body||document.documentElement;(f=new MutationObserver(e=>{for(let a of e)for(let e of Array.from(a.addedNodes)){var t;if((t=e).nodeType===Node.ELEMENT_NODE&&(t.matches(p)||t.querySelector(p)))return void w()}})).observe(e,{childList:!0,subtree:!0}),u.discoveryObserver=f,document.querySelector(p)&&w()}())},{"./ocr/bar":"bCXIb","./ocr/engine":"ba0DF","./canvas/theme":"3aqKC","./canvas/freeze":"8S2RV","./canvas/index":"bUAoc","@parcel/transformer-js/src/esmodule-helpers.js":"b0H7B"}],bCXIb:[function(e,t,a,n){var r=e("@parcel/transformer-js/src/esmodule-helpers.js");r.defineInteropFlag(a),r.export(a,"ensureOcrBar",()=>s);var i=e("../index"),o=e("../canvas/theme"),l=e("../lia/i18n");function s(){let e=!0===i.LIA.SHOW_BAR,t=(e,t)=>(0,l.liaT)("ocr."+e,t);if((0,o.ensureCss)(),i.LIA.bar&&i.LIA.bar.__i18nListener&&(document.removeEventListener("lia:canvas-i18n-update",i.LIA.bar.__i18nListener),delete(0,i.LIA).bar.__i18nListener),i.LIA.bar&&i.LIA.bar.el&&i.LIA.bar.el.isConnected){try{let t=i.LIA.bar.el,a=document.body||document.documentElement;t.parentNode!==a&&a.appendChild(t),t.style.display=e?"":"none",t.setAttribute("aria-hidden",e?"false":"true");let n=i.LIA.bar.loadEl;n&&n.parentNode!==a&&a.appendChild(n)}catch(e){}return i.LIA.bar}let a=document.body||document.documentElement,n=document.createElement("div");n.className="lia-ocr-loadwrap",n.dataset.on="0",n.dataset.indet="0",n.innerHTML=`
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
  `,a.appendChild(n);let r=n.querySelector(".lia-ocr-loadfill"),s=n.querySelector(".lia-ocr-loadmsg .t"),c=n.querySelector(".lia-ocr-loadmsg .p"),d=n.querySelector(".lia-ocr-loaddetail"),u=n.querySelector(".lia-ocr-loaderror"),p=n.querySelector(".lia-ocr-retry-btn");p&&p.addEventListener("click",()=>{i.LIA.ocr&&i.LIA.ocr.ensureLoaded&&i.LIA.ocr.ensureLoaded(!0)});let h={model:"Xenova/texify2",backend:"wasm",precision:"fp32",loaded:!1,phase:"idle",status:"idle",progress:null},f="__LIA_TEX_OCR_PREC__",g="__LIA_TEX_OCR_MODEL__";try{let e=localStorage.getItem(g);e&&(h.model=e)}catch(e){}try{let e=localStorage.getItem(f);e&&(h.precision=e)}catch(e){}let m=null,b=null,x=null,y=null,v=null,w=null,_=null;function k(e,t){if(!m)return;let a=m.querySelector('[data-k="'+e+'"]');a&&(a.textContent=String(t))}function S(){if(m){var e,a;let n,r;if(m.dataset.state=String(h.status||"idle"),k("model",h.model||"—"),k("backend",h.backend||"—"),k("precision",h.precision||"—"),k("loaded",h.loaded?t("yes","yes"):t("no","no")),k("phase","idle"===(n=String(e=h.phase||"—").toLowerCase())?t("phase.idle","idle"):"import"===n?t("phase.import","import"):"download"===n?t("phase.download","download"):"pipeline"===n?t("phase.pipeline","pipeline"):e||"—"),k("status","idle"===(r=String(a=h.status||"idle").toLowerCase())?t("status.idle","idle"):"ready"===r?t("status.ready","ready"):"working"===r?t("status.working","working"):"loading"===r?t("status.loading","loading"):"error"===r?t("status.error","error"):a||"idle"),x&&y&&v)if(null!==h.progress&&void 0!==h.progress&&isFinite(h.progress)){let e=Math.max(0,Math.min(1,Number(h.progress)));x.dataset.on="1",y.style.width=Math.round(100*e)+"%",v.textContent=Math.round(100*e)+"%"}else x.dataset.on="0";try{let e=Math.ceil(m.getBoundingClientRect().height||m.offsetHeight||0);document.documentElement.style.setProperty("--lia-ocrbar-h",(e||0)+"px"),document.documentElement.style.setProperty("--lia-ocrbar-gap","8px")}catch(e){}}else try{document.documentElement.style.setProperty("--lia-ocrbar-h","0px"),document.documentElement.style.setProperty("--lia-ocrbar-gap","0px")}catch(e){}if(r&&s&&c){if(u){let e=u.querySelector(".lia-ocr-loaderror-msg");e&&(e.textContent=t("load.failed","Loading failed."))}p&&(p.textContent=t("retry","Try again"));let e=String(h.status||"idle"),a=String(h.phase||"idle"),i=!h.loaded&&("loading"===e||"import"===a||"pipeline"===a||"download"===a),o="error"===e&&!h.loaded;if(u&&(u.style.display=o?"":"none"),o)n.dataset.on="1",n.dataset.indet="0",s&&(s.textContent=t("load.failed","Loading failed.")),c&&(c.textContent=""),d&&(d.textContent=""),r&&(r.style.width="0%");else if(i)if(n.dataset.on="1","download"===a?(s.textContent=t("load.engine","Loading OCR engine..."),d&&(d.textContent=t("load.downloadDetail","This download only happens once and is cached afterwards."))):("import"===a?s.textContent=t("load.importing","Loading OCR engine... (importing library)"):"pipeline"===a?s.textContent=t("load.initializing","Loading OCR engine... (initializing model)"):s.textContent=t("load.engine","Loading OCR engine..."),d&&(d.textContent=t("load.firstStart","First start may take a moment."))),null!==h.progress&&void 0!==h.progress&&isFinite(h.progress)){let e=Math.max(0,Math.min(1,Number(h.progress)));n.dataset.indet="0",r.style.transform="translateX(0)",r.style.width=Math.round(100*e)+"%",c.textContent=Math.round(100*e)+"%"}else n.dataset.indet="1",r.style.width="35%",c.textContent="…";else o||(n.dataset.on="0",n.dataset.indet="0",r.style.transform="translateX(0)",r.style.width="0%",c.textContent="")}}function M(e){if(b)try{let t=new Date,a=String(t.getHours()).padStart(2,"0"),n=String(t.getMinutes()).padStart(2,"0"),r=String(t.getSeconds()).padStart(2,"0"),i="["+a+":"+n+":"+r+"] "+String(e),o=b.textContent?b.textContent.split("\n"):[];for(o.push(i);o.length>10;)o.shift();b.textContent=o.join("\n")}catch(e){}}function C(e){try{if(!e)return;for(let t in e)Object.prototype.hasOwnProperty.call(e,t)&&(h[t]=e[t]);S()}catch(e){}}if(e&&((m=document.createElement("div")).className="lia-ocrbar",m.dataset.state="idle",m.dataset.open="0",m.innerHTML=`
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
    `,a.appendChild(m),b=m.querySelector(".lia-ocr-log"),x=m.querySelector(".lia-ocr-progress"),y=m.querySelector(".lia-ocr-progfill"),v=m.querySelector(".lia-ocr-progtxt"),w=m.querySelector('select[data-act="precision"]'),(_=m.querySelector('select[data-act="model"]'))&&(_.value=h.model),w&&(w.value=h.precision)),m){let e=m.querySelector(".lia-ocr-title"),a=m.querySelectorAll(".lia-ocr-pill .k"),n=m.querySelector('button[data-act="load"]'),r=m.querySelector('button[data-act="toggle"]'),o=m.querySelector('button[data-act="copy"]'),l=m.querySelector('select[data-act="model"]'),s=m.querySelector('select[data-act="precision"]'),c=()=>{e&&(e.textContent=t("title","LaTeX-OCR")),a&&a.length>=6&&(a[0].textContent=t("pill.model","Model"),a[1].textContent=t("pill.backend","Backend"),a[2].textContent=t("pill.precision","Precision"),a[3].textContent=t("pill.loaded","Loaded"),a[4].textContent=t("pill.phase","Phase"),a[5].textContent=t("pill.status","Status")),n&&(n.textContent=t("btn.load","Load/Reload")),r&&(r.textContent=t("btn.log","Log")),o&&(o.textContent=t("btn.copy","Copy")),l&&l.setAttribute("aria-label",t("aria.model","Model")),s&&s.setAttribute("aria-label",t("aria.precision","Precision"))};c(),m.addEventListener("click",e=>{let a=e.target?.closest?.("button[data-act]");if(!a)return;let n=a.getAttribute("data-act");if("toggle"===n){m.dataset.open="1"===m.dataset.open?"0":"1";return}if("copy"===n){let e=[t("report.title","LaTeX-OCR Status Report"),t("pill.model","Model")+": "+(h.model||""),t("pill.backend","Backend")+": "+(h.backend||""),t("pill.precision","Precision")+": "+(h.precision||""),t("pill.loaded","Loaded")+": "+(h.loaded?t("yes","yes"):t("no","no")),t("pill.phase","Phase")+": "+(h.phase||""),t("pill.status","Status")+": "+(h.status||""),t("report.progress","Progress")+": "+(null===h.progress?"—":String(h.progress)),"",t("report.log","Log")+":",b?.textContent||""].join("\n");try{navigator.clipboard.writeText(e),M(t("log.copied","Report copied to clipboard."))}catch(e){M(t("log.copyFailed","Copy failed (clipboard blocked)."))}return}if("load"===n){i.LIA.ocr&&i.LIA.ocr.ensureLoaded&&i.LIA.ocr.ensureLoaded(!0);return}}),w&&w.addEventListener("change",()=>{let e=String(w.value||"fp32");try{localStorage.setItem(f,e)}catch(e){}C({precision:e}),i.LIA.ocr&&i.LIA.ocr.setPrecision&&i.LIA.ocr.setPrecision(e)}),_&&_.addEventListener("change",()=>{let e=String(_.value||h.model);try{localStorage.setItem(g,e)}catch(e){}C({model:e}),i.LIA.ocr&&i.LIA.ocr.setModel&&i.LIA.ocr.setModel(e)});let d=()=>{c(),S()};document.addEventListener("lia:canvas-i18n-update",d),i.LIA.bar=i.LIA.bar||{},i.LIA.bar.__i18nListener=d}return i.LIA.bar={el:m,loadEl:n,set:C,log:M,get:()=>({...h})},S(),e&&M("OCR-Bar ready."),i.LIA.bar}},{"../index":"gFFiE","../canvas/theme":"3aqKC","../lia/i18n":"lednP","@parcel/transformer-js/src/esmodule-helpers.js":"b0H7B"}],"3aqKC":[function(e,t,a,n){var r=e("@parcel/transformer-js/src/esmodule-helpers.js");r.defineInteropFlag(a),r.export(a,"ensureCss",()=>o),r.export(a,"parseRgb",()=>l),r.export(a,"luminance",()=>s),r.export(a,"getAccentColor",()=>c),r.export(a,"getThemeDocument",()=>d),r.export(a,"applyThemeVars",()=>h),r.export(a,"COLORS",()=>f),r.export(a,"getAutoPen",()=>g),r.export(a,"getBorderColor",()=>m),r.export(a,"getAccentCssVar",()=>b),r.export(a,"setSvg",()=>x),r.export(a,"setRectIcon",()=>y),r.export(a,"setEraserIcon",()=>v),r.export(a,"setUndoIcon",()=>w),r.export(a,"setRedoIcon",()=>_),r.export(a,"setTrashIcon",()=>k),r.export(a,"rgbaFromAny",()=>S);var i=e("./icons");function o(){let e=document.getElementById("__lia_canvas_ocr_css_v1");if(e&&e.parentNode&&e.parentNode.removeChild(e),document.getElementById("__lia_canvas_ocr_css_v2"))return;let t=document.createElement("style");t.id="__lia_canvas_ocr_css_v2",t.textContent=`
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
  `,(document.head||document.documentElement).appendChild(t)}function l(e){let t=String(e||"").match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);return t?[Number(t[1]),Number(t[2]),Number(t[3])]:null}function s(e){let[t,a,n]=e.map(e=>e/255).map(e=>e<=.03928?e/12.92:Math.pow((e+.055)/1.055,2.4));return .2126*t+.7152*a+.0722*n}function c(e){try{let t=e||document,a=t.defaultView||window,n=t.body||t.documentElement,r=t.querySelector(".lia-btn");if(r){let e=a.getComputedStyle(r).backgroundColor;if(e&&"rgba(0, 0, 0, 0)"!==e&&"transparent"!==e)return e}let i=t.createElement("button");i.className="lia-btn",i.type="button",i.textContent="x",i.style.position="absolute",i.style.left="-9999px",i.style.top="-9999px",i.style.visibility="hidden",n.appendChild(i);let o=a.getComputedStyle(i).backgroundColor;if(i.remove(),o&&"rgba(0, 0, 0, 0)"!==o&&"transparent"!==o)return o}catch(e){}return null}function d(){try{if(window.parent&&window.parent!==window&&window.parent.document)return window.parent.document}catch(e){}return document}let u=!1;function p(e,t,a){let n=String(a||"").trim();return!!n&&e.style.getPropertyValue(t).trim()!==n&&(e.style.setProperty(t,n),!0)}function h(){if(u)return!1;u=!0;try{o();let e=d(),t=e.defaultView||window,a=document.documentElement,n=t.getComputedStyle(e.body||e.documentElement).backgroundColor||t.getComputedStyle(e.documentElement).backgroundColor,r=l(n),i=!!r&&.5>s(r),u=i?"#fff":"#000",h=!1;h=p(a,"--canvas-border",u)||h,h=p(a,"--canvas-pen",u)||h,h=p(a,"--canvas-panel-bg",i?"rgba(22,22,24,0.84)":"rgba(255,255,255,0.84)")||h,h=p(a,"--canvas-overlay-soft",i?"rgba(255,255,255,0.10)":"rgba(0,0,0,0.10)")||h;let f=c(e)||c(document);return f&&(h=p(a,"--canvas-accent",f)||h),h&&document.dispatchEvent(new Event("lia-canvas-theme")),h}catch(e){return!1}finally{u=!1}}let f=[{key:"auto",value:null},{key:"red",value:"#ff0000"},{key:"orange",value:"#ff7500"},{key:"yellow",value:"#ffff00"},{key:"violett",value:"#ff00ff"},{key:"blue",value:"#0055ff"},{key:"lightblue",value:"#00ffff"},{key:"green",value:"#00ff00"},{key:"darkgreen",value:"#007500"},{key:"black",value:"#000000"},{key:"white",value:"#ffffff"}];function g(){return getComputedStyle(document.documentElement).getPropertyValue("--canvas-pen").trim()||"#000"}function m(){return getComputedStyle(document.documentElement).getPropertyValue("--canvas-border").trim()||"#000"}function b(){return getComputedStyle(document.documentElement).getPropertyValue("--canvas-accent").trim()||m()}function x(e,t){!e||e.__hasIcon||(e.__hasIcon=!0,e.innerHTML=t)}function y(e){x(e,i.SVG_RECT)}function v(e){x(e,i.SVG_ERASER)}function w(e){x(e,i.SVG_UNDO)}function _(e){x(e,i.SVG_REDO)}function k(e){x(e,i.SVG_TRASH)}function S(e,t){let a=l(e);if(a)return`rgba(${a[0]},${a[1]},${a[2]},${t})`;if(String(e).startsWith("#")){let a=String(e).slice(1),n=3===a.length?a[0]+a[0]+a[1]+a[1]+a[2]+a[2]:a,r=parseInt(n.slice(0,2),16),i=parseInt(n.slice(2,4),16),o=parseInt(n.slice(4,6),16);return`rgba(${r},${i},${o},${t})`}return`rgba(0,0,0,${t})`}},{"./icons":"cwXVY","@parcel/transformer-js/src/esmodule-helpers.js":"b0H7B"}],cwXVY:[function(e,t,a,n){var r=e("@parcel/transformer-js/src/esmodule-helpers.js");r.defineInteropFlag(a),r.export(a,"SVG_RECT",()=>i),r.export(a,"SVG_ERASER",()=>o),r.export(a,"SVG_UNDO",()=>l),r.export(a,"SVG_REDO",()=>s),r.export(a,"SVG_TRASH",()=>c);let i=`
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
`},{"@parcel/transformer-js/src/esmodule-helpers.js":"b0H7B"}],b0H7B:[function(e,t,a,n){a.interopDefault=function(e){return e&&e.__esModule?e:{default:e}},a.defineInteropFlag=function(e){Object.defineProperty(e,"__esModule",{value:!0})},a.exportAll=function(e,t){return Object.keys(e).forEach(function(a){"default"===a||"__esModule"===a||Object.prototype.hasOwnProperty.call(t,a)||Object.defineProperty(t,a,{enumerable:!0,get:function(){return e[a]}})}),t},a.export=function(e,t,a){Object.defineProperty(e,t,{enumerable:!0,get:a})}},{}],lednP:[function(e,t,a,n){var r=e("@parcel/transformer-js/src/esmodule-helpers.js");function i(){try{let e=document.documentElement&&document.documentElement.lang;if(e&&String(e).trim())return String(e).trim()}catch(e){}try{let e=window,t=e&&e.LIA&&e.LIA.settings&&e.LIA.settings.data&&e.LIA.settings.data.lang;if(t&&String(t).trim())return String(t).trim()}catch(e){}try{if(navigator.language&&String(navigator.language).trim())return String(navigator.language).trim()}catch(e){}return"en"}function o(e){let t=String(e||"").trim();return t?t.toLowerCase():"en"}r.defineInteropFlag(a),r.export(a,"ensureI18nLanguageWatch",()=>u),r.export(a,"liaLang",()=>f),r.export(a,"liaT",()=>g);let l=window.__LIA_CANVAS_I18N_STATE__=window.__LIA_CANVAS_I18N_STATE__||{cache:{},pending:{},lang:o(i()),translateQueue:[],translateTimer:null,langWatchObserver:null},s={de:{"ocr.title":"LaTeX-OCR","ocr.selectSubmit":"Als Lösung senden","ocr.runningOcr":"OCR läuft...","ocr.submitted":"Gesendet","ocr.ocrError":"Fehler","ocr.retry":"Erneut versuchen","ocr.yes":"ja","ocr.no":"nein","ocr.pill.model":"Modell","ocr.pill.backend":"Backend","ocr.pill.precision":"Praezision","ocr.pill.loaded":"Geladen","ocr.pill.phase":"Phase","ocr.pill.status":"Status","ocr.btn.load":"Laden/Neu laden","ocr.btn.log":"Log","ocr.btn.copy":"Kopieren","ocr.aria.model":"Modell","ocr.aria.precision":"Präzision","ocr.report.title":"LaTeX-OCR Statusbericht","ocr.report.progress":"Fortschritt","ocr.report.log":"Log","ocr.log.copied":"Bericht in die Zwischenablage kopiert.","ocr.log.copyFailed":"Kopieren fehlgeschlagen (Zwischenablage blockiert).","ocr.status.idle":"inaktiv","ocr.status.ready":"bereit","ocr.status.working":"arbeitet","ocr.status.loading":"lädt","ocr.status.error":"fehler","ocr.phase.idle":"inaktiv","ocr.phase.import":"import","ocr.phase.download":"download","ocr.phase.pipeline":"pipeline","ocr.load.failed":"Laden fehlgeschlagen.","ocr.load.engine":"OCR-Engine wird geladen...","ocr.load.downloadDetail":"Dieser Download passiert nur einmal und wird danach gecacht.","ocr.load.importing":"OCR-Engine wird geladen... (Bibliothek wird importiert)","ocr.load.initializing":"OCR-Engine wird geladen... (Modell wird initialisiert)","ocr.load.firstStart":"Der erste Start kann einen Moment dauern.","canvas.pen":"Stift","canvas.eraser":"Radierer","canvas.background":"Hintergrund","canvas.edit":"Bearbeiten"}},c=!1;function d(){let e=o(i());if(e===l.lang||c)return e;c=!0;try{l.lang=e,l.cache={},l.pending={},document.dispatchEvent(new CustomEvent("lia:canvas-i18n-update",{detail:{lang:e,reason:"lang-change"}}))}finally{c=!1}return e}function u(){if(l.langWatchObserver)return;let e=l.langWatchInterval;e&&(clearInterval(e),l.langWatchInterval=null);let t=document.documentElement;t&&(l.langWatchObserver=new MutationObserver(()=>d()),l.langWatchObserver.observe(t,{attributes:!0,attributeFilter:["lang"]}))}async function p(e,t){let a=String(e||"").split("-")[0].toLowerCase()||"en";if(!a||"en"===a)return t;let n="https://api.mymemory.translated.net/get?q="+encodeURIComponent(t)+"&langpair="+encodeURIComponent("en|"+a),r=new AbortController,i=setTimeout(()=>r.abort(),3500);try{let e=await fetch(n,{signal:r.signal});if(!e||!e.ok)return null;let t=await e.json(),a=t&&t.responseData&&t.responseData.translatedText;if(!a||"string"!=typeof a)return null;return a.trim()||null}catch(e){return null}finally{clearTimeout(i)}}async function h(){for(;l.translateQueue.length>0;){let{cacheKey:e,lang:t,text:a}=l.translateQueue.shift();if(l.cache[e]){delete l.pending[e];continue}try{let n=await p(t,a),r=n?function(e){var t;let a,n=String(e||"");return t=n,(a=document.createElement("textarea")).innerHTML=String(t||""),n=(n=(n=a.value||"").replace(/<[^>]+>/g," ")).replace(/\s+/g," ").trim()}(n):"";r&&r!==a&&(l.cache[e]=r,document.dispatchEvent(new CustomEvent("lia:canvas-i18n-update",{detail:{lang:t,key:e,translated:r}})))}catch(e){}delete l.pending[e],l.translateQueue.length>0&&await new Promise(e=>setTimeout(e,150))}}function f(){return u(),d()}function g(e,t){let a=f(),n=String(t||"");if(!n)return"";if("en"===a||a.startsWith("en-"))return n;let r=function(e,t){let a=String(e||"").trim().toLowerCase();if(!a)return null;let n=s[a];if(n&&n[t])return n[t];let r=s[a.split("-")[0]];return r&&r[t]?r[t]:null}(a,String(e||""));if(r)return r;let i=a+"|"+String(e||n),o=l.cache[i];return o||(!function(e,t,a){if(l.pending[e])return;let n=String(a||"").replace(/&/g,"and").replace(/…/g,"...");l.pending[e]=Promise.resolve(),l.translateQueue.push({cacheKey:e,lang:t,text:n}),null===l.translateTimer&&(l.translateTimer=setTimeout(()=>{l.translateTimer=null,h()},0))}(i,a,n),n)}},{"@parcel/transformer-js/src/esmodule-helpers.js":"b0H7B"}],ba0DF:[function(e,t,a,n){var r=e("@parcel/transformer-js/src/esmodule-helpers.js");r.defineInteropFlag(a),r.export(a,"ensureOcrEngine",()=>s);var i=e("../index"),o=e("./bar");async function l(){return i.LIA.tfjs&&i.LIA.tfjs.pipeline?i.LIA.tfjs:(i.LIA.tfjsLoad=i.LIA.tfjsLoad||(async()=>{let e=null;for(let t of["https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2/+esm","https://esm.sh/@xenova/transformers@2.17.2?bundle"])try{try{let e=i.LIA.bar;e&&e.log&&e.log("Importing Transformers.js: "+t)}catch(e){}let e=await Function("u","return import(u)")(t),a=e.pipeline||e.default&&e.default.pipeline,n=e.env||e.default&&e.default.env;if(!a||!n)throw Error("Transformers.js ESM export missing (pipeline/env).");let r={pipeline:a,env:n,__url:t};return i.LIA.tfjs=r,r}catch(a){e=a;try{let e=i.LIA.bar;e&&e.log&&e.log("Import failed: "+t+" — "+(a&&a.message?a.message:String(a)))}catch(e){}}throw e||Error("Failed to load Transformers.js from all CDN URLs.")})(),await i.LIA.tfjsLoad)}function s(){if(i.LIA.ocr)return i.LIA.ocr;let e=(0,o.ensureOcrBar)(),t={model:e.get().model||"Xenova/trocr-small-handwritten",task:"image-to-text",precision:e.get().precision||"fp32",pipe:null,loading:null,async setModel(t){let a=String(t||this.model||"Xenova/texify2");return this.model=a,e.set({model:a,loaded:!1,status:"idle",phase:"idle",progress:null}),this.pipe=null,this.loading=null,this.ensureLoaded(!0)},async setPrecision(t){let a=String(t||"fp32");return this.precision=a,e.set({precision:a,loaded:!1,status:"idle",phase:"idle",progress:null}),this.pipe=null,this.loading=null,this.ensureLoaded(!0)},async ensureLoaded(t){if(this.pipe&&!t)return this.pipe;if(this.loading)return this.loading;let a=this.precision||"fp32",n={fp32:"fp32",fp16:"fp16",int8:"q8"}[a]||"fp32";e.set({model:this.model,backend:"wasm",precision:a,status:"loading",phase:"import",loaded:!1,progress:0}),e.log("Loading model ("+a+") …");let r=null,i=new Promise((e,t)=>{r=setTimeout(()=>t(Error("OCR runtime import timed out after 60s")),6e4)});return this.loading=(async()=>{try{let t=await Promise.race([l(),i]);null!==r&&(clearTimeout(r),r=null);let{pipeline:o,env:s}=t;try{s.allowLocalModels=!1,s.allowRemoteModels=!0,s.useBrowserCache=!0,s.backends=s.backends||{},s.backends.onnx=s.backends.onnx||{},s.backends.onnx.wasm=s.backends.onnx.wasm||{}}catch(e){}e.set({phase:"pipeline"});let c=await o(this.task,this.model,{dtype:n,progress_callback:t=>{let a=function(e){try{if(null==e)return null;if("number"==typeof e&&isFinite(e))return Math.max(0,Math.min(1,e>1?e/100:e));let t=e&&"object"==typeof e?e:null;if(!t)return null;if(isFinite(t.progress)){let e=Number(t.progress);return Math.max(0,Math.min(1,e>1?e/100:e))}if(isFinite(t.loaded)&&isFinite(t.total)&&Number(t.total)>0)return Math.max(0,Math.min(1,Number(t.loaded)/Number(t.total)))}catch(e){}return null}(t);null!==a&&e.set({progress:a,phase:"download"})}});return this.pipe=c,e.set({status:"ready",phase:"ready",loaded:!0,progress:null}),e.log("Model loaded ("+a+")."),c}catch(t){throw e.set({status:"error",phase:"error",loaded:!1,progress:null}),e.log("Load failed: "+(t&&t.message?t.message:String(t))),t}finally{null!==r&&clearTimeout(r),this.loading=null}})(),this.loading},async recognize(t,a){let n=a&&"object"==typeof a?a:{},r=!0===n.__silent,i=await this.ensureLoaded(!1);e.set({status:"working",phase:"infer",progress:null});let o=null;async function l(e){if(e&&"function"==typeof e.convertToBlob)return await e.convertToBlob({type:"image/png"});if(e&&"function"==typeof e.toBlob)return await new Promise((t,a)=>{e.toBlob(e=>e?t(e):a(Error("toBlob() returned null")),"image/png")});throw Error("Canvas-like has no toBlob/convertToBlob")}async function s(e){if("string"==typeof e)return{input:e,revoke:null};if(e&&"object"==typeof e&&"function"==typeof e.arrayBuffer&&"number"==typeof e.size&&"string"==typeof e.type){let t=URL.createObjectURL(e);return{input:t,revoke:()=>URL.revokeObjectURL(t)}}if(e&&"object"==typeof e&&"number"==typeof e.width&&"number"==typeof e.height&&e.data&&"number"==typeof e.data.length){let t=document.createElement("canvas");t.width=Math.max(1,Math.floor(e.width)),t.height=Math.max(1,Math.floor(e.height)),t.getContext("2d",{willReadFrequently:!0}).putImageData(e,0,0);let a=await l(t),n=URL.createObjectURL(a);return{input:n,revoke:()=>URL.revokeObjectURL(n)}}if(e&&"object"==typeof e){if("function"==typeof e.toDataURL)return{input:e.toDataURL("image/png"),revoke:null};if("function"==typeof e.toBlob||"function"==typeof e.convertToBlob){let t=await l(e),a=URL.createObjectURL(t);return{input:a,revoke:()=>URL.revokeObjectURL(a)}}}throw Error("Unsupported input type for OCR: "+(null===e?"null":typeof e))}try{let a=await s(t);o=a.revoke;let l="number"==typeof n.max_new_tokens&&isFinite(n.max_new_tokens)?Math.max(1,Math.floor(n.max_new_tokens)):96,c=await i(a.input,{max_new_tokens:l,do_sample:!0===n.do_sample,temperature:"number"==typeof n.temperature&&isFinite(n.temperature)?n.temperature:0}),d="";if("string"==typeof c)d=c;else if(Array.isArray(c)&&c.length){let e=c[0]||{};(d=e.generated_text||e.text||e.latex||"")||(d=JSON.stringify(e))}else c&&"object"==typeof c?(d=c.generated_text||c.text||c.latex||"")||(d=JSON.stringify(c)):d=String(c);return e.set({status:"ready",phase:"ready"}),r||e.log("Recognize done."),d}catch(t){throw e.set({status:"error",phase:"error"}),r||e.log("Recognize failed: "+(t&&t.message?t.message:String(t))),t}finally{try{o&&o()}catch(e){}}}};return i.LIA.ocr=t,t}},{"../index":"gFFiE","./bar":"bCXIb","@parcel/transformer-js/src/esmodule-helpers.js":"b0H7B"}],"8S2RV":[function(e,t,a,n){var r=e("@parcel/transformer-js/src/esmodule-helpers.js");r.defineInteropFlag(a),r.export(a,"cfUnionBBox",()=>g),r.export(a,"ensureCanvasFreezeApi",()=>L);var i=e("../index"),o=e("./store"),l=e("./theme");function s(e,t){let a=Number(e);return isFinite(a)?a:t||0}function c(e,t,a){return Math.max(t,Math.min(a,e))}function d(e){return Math.round(100*s(e,0))/100}function u(e,t){let a=s(t,0);if(!(a>0))return 0;let n=s(e,0)%a;return n<0?n+a:n}function p(e){let t=e&&"object"==typeof e?e:{};return{panX:s(t.panX,0),panY:s(t.panY,0),scale:s(t.scale,1)||1,minScale:s(t.minScale,.25),maxScale:s(t.maxScale,8)}}function h(e,t){let a=s(e&&e.x,0),n=s(e&&e.y,0),r=s(t&&t.scale,1)||1;return{x:a*r+s(t&&t.panX,0),y:n*r+s(t&&t.panY,0)}}function f(e,t,a){if(!e)return null;let n=Math.max(0,s(e.x,0)),r=Math.max(0,s(e.y,0)),i=Math.min(s(t,0),s(e.x,0)+s(e.w,0)),o=Math.min(s(a,0),s(e.y,0)+s(e.h,0));return i<=n||o<=r?null:{x:n,y:r,w:i-n,h:o-r}}function g(e,t){if(!e)return t?{x:t.x,y:t.y,w:t.w,h:t.h}:null;if(!t)return{x:e.x,y:e.y,w:e.w,h:e.h};let a=Math.min(e.x,t.x),n=Math.min(e.y,t.y);return{x:a,y:n,w:Math.max(0,Math.max(e.x+e.w,t.x+t.w)-a),h:Math.max(0,Math.max(e.y+e.h,t.y+t.h)-n)}}function m(e){return e&&e.querySelector?e.querySelector(".lia-canvas-mount"):null}function b(e){let t=m(e);return t?(0,o.ensureMountUID)(t):""}function x(e){let t=i.LIA.store||{};return e&&t[e]?t[e]:null}function y(e){return Array.from((e&&e.querySelectorAll?e:document).querySelectorAll(".lia-canvas-pair")).filter(e=>!!m(e))}function v(e,t){let a=Array.isArray(t)?t:[];for(let t=0;t<a.length;t++){let n=a[t];if(!n)continue;if("r"===n.k){e.save(),e.globalCompositeOperation="source-over",e.globalAlpha=1,e.fillStyle=String(n.f||"rgba(0,0,0,0.15)"),e.fillRect(s(n.x,0),s(n.y,0),Math.max(0,s(n.w,0)),Math.max(0,s(n.h,0))),e.restore();continue}let r=Array.isArray(n.p)?n.p:[];if(r.length){e.save(),e.beginPath(),e.moveTo(s(r[0][0],0),s(r[0][1],0));for(let t=1;t<r.length;t++)e.lineTo(s(r[t][0],0),s(r[t][1],0));e.lineCap="round",e.lineJoin="round",e.lineWidth=Math.max(.75,s(n.w,1)),"e"===n.k?(e.globalCompositeOperation="destination-out",e.globalAlpha=1,e.strokeStyle="rgba(0,0,0,1)"):(e.globalCompositeOperation="source-over",e.globalAlpha=c(s(n.a,1),0,1),e.strokeStyle=String(n.c||"#000")),e.stroke(),e.restore()}}}function w(e,t){let a,n,r;if(!e||!t)return null;let i=function(e){let t=e&&"object"==typeof e?e:{},a=Array.isArray(t.ITEMS)?t.ITEMS:[],n=p(t.VIEW||{}),r=Math.max(1,Math.round(s(t.wrapW,0))),i=Math.max(1,Math.round(s(t.canvasH,0))),o=(0,l.rgbaFromAny)((0,l.getAccentCssVar)(),.28),u=[];for(let e=0;e<a.length;e++){let t=a[e];if(t&&"object"==typeof t){if("path"===t.kind){let e=Array.isArray(t.points)?t.points:[];if(!e.length)continue;let a=e.map(e=>h(e,n)),o=Math.max(.75,s(t.width,1)*s(n.scale,1));if(!f(function(e,t){let a=Array.isArray(e)?e:[];if(!a.length)return null;let n=1/0,r=1/0,i=-1/0,o=-1/0;for(let e=0;e<a.length;e++){let t=a[e],l=s(t&&t.x,0),c=s(t&&t.y,0);l<n&&(n=l),c<r&&(r=c),l>i&&(i=l),c>o&&(o=c)}let l=Math.max(0,s(t,0));return{x:n-l,y:r-l,w:Math.max(0,i-n+2*l),h:Math.max(0,o-r+2*l)}}(a,o/2+2),r,i))continue;u.push({k:"eraser"===t.tool?"e":"p",c:String(t.color||(0,l.getAutoPen)()),a:c(s(t.alpha,1),0,1),w:d(o),p:a.map(e=>[d(e.x),d(e.y)])});continue}if("rect"===t.kind){let e=h({x:t.x0,y:t.y0},n),a=h({x:t.x1,y:t.y1},n),p=function(e,t,a,n){let r=Math.min(s(e,0),s(a,0)),i=Math.min(s(t,0),s(n,0));return{x:r,y:i,w:Math.max(0,Math.max(s(e,0),s(a,0))-r),h:Math.max(0,Math.max(s(t,0),s(n,0))-i)}}(e.x,e.y,a.x,a.y);if(!f(p,r,i))continue;let g=c(s(t.alpha,.28),0,1),m=t.color?(0,l.rgbaFromAny)(t.color,g):(0,l.rgbaFromAny)((0,l.getAccentCssVar)(),g);u.push({k:"r",f:m||o,x:d(p.x),y:d(p.y),w:d(p.w),h:d(p.h)})}}}return{vw:r,vh:i,items:u}}(t),o=Math.max(1,0|i.vw),g=Math.max(1,0|i.vh),m=Array.isArray(i.items)?i.items:[],b=document.createElement("canvas");b.width=o,b.height=g;let x=b.getContext("2d",{willReadFrequently:!0});x.clearRect(0,0,o,g),v(x,m);let y=function(e){if(!e)return null;let t=e.getContext("2d",{willReadFrequently:!0});if(!t)return null;let a=0|e.width,n=0|e.height;if(!(a>0&&n>0))return null;let r=t.getImageData(0,0,a,n).data,i=a,o=n,l=-1,c=-1;for(let e=0;e<n;e++){let t=e*a*4;for(let n=0;n<a;n++)!(r[t+4*n+3]<=10)&&(n<i&&(i=n),e<o&&(o=e),n>l&&(l=n),e>c&&(c=e))}if(l<0)return null;let d=Math.max(0,Math.round(s(8,0)));return{x:Math.max(0,i-d),y:Math.max(0,o-d),w:Math.max(1,Math.min(a-1,l+d)-Math.max(0,i-d)+1),h:Math.max(1,Math.min(n-1,c+d)-Math.max(0,o-d)+1)}}(b);return y?{v:"cvf1",u:String(e),w:y.w,h:y.h,bg:function(e,t){let a=e&&"object"==typeof e?e:{},n=p(a.VIEW||{}),r=String(a.bgMode||"none");if("grid"!==r&&"lined"!==r)return{m:"none"};let i=Math.max(1,s(a.bgStep,24))*Math.max(1e-4,s(n.scale,1));if(!(i>0))return{m:"none"};let o=s(t&&t.x,0),c=s(t&&t.y,0);return{m:r,s:d(i),ox:d(u(s(n.panX,0)-o,i)),oy:d(u(s(n.panY,0)-c,i)),c:(0,l.rgbaFromAny)((0,l.getAccentCssVar)(),.65),lw:1.125}}(t,y),it:(a=Array.isArray(m)?m:[],n=s(y&&y.x,0),r=s(y&&y.y,0),a.map(e=>e?"r"===e.k?{k:"r",f:String(e.f||""),x:d(s(e.x,0)-n),y:d(s(e.y,0)-r),w:d(s(e.w,0)),h:d(s(e.h,0))}:{k:"e"===e.k?"e":"p",c:String(e.c||""),a:c(s(e.a,1),0,1),w:d(s(e.w,1)),p:(Array.isArray(e.p)?e.p:[]).map(e=>[d(s(e&&e[0],0)-n),d(s(e&&e[1],0)-r)])}:null).filter(Boolean))}:{v:"cvf1",u:String(e),e:1,w:0,h:0,bg:{m:"none"},it:[]}}function _(e){let t=b(e);if(!t)return null;let a=x(t);return a?w(t,a):null}function k(e){let t=y(e),a=[];for(let e=0;e<t.length;e++){let n=_(t[e]);n&&a.push(n)}return a}function S(e){return!!(e&&1!==e.e&&s(e.w,0)>0&&s(e.h,0)>0&&Array.isArray(e.it)&&e.it.length)}function M(e,t){if(!e||!t)return null;let a=Math.max(1,Math.round(s(t.w,1))),n=Math.max(1,Math.round(s(t.h,1))),r=window.devicePixelRatio||1;e.width=Math.max(1,Math.round(a*r)),e.height=Math.max(1,Math.round(n*r)),e.style.width=a+"px",e.style.height=n+"px";let i=e.getContext("2d",{willReadFrequently:!0});return i.setTransform(r,0,0,r,0,0),i.clearRect(0,0,a,n),!function(e,t,a,n){let r=t&&"object"==typeof t?t:{},i=String(r.m||"none");if("grid"!==i&&"lined"!==i)return;let o=Math.max(1,s(r.s,1)),c=u(s(r.ox,0),o),d=u(s(r.oy,0),o),p=String(r.c||(0,l.rgbaFromAny)((0,l.getAccentCssVar)(),.65)),h=Math.max(.5,s(r.lw,1.125));if(e.save(),e.globalCompositeOperation="source-over",e.globalAlpha=1,e.strokeStyle=p,e.lineWidth=h,e.beginPath(),"grid"===i){for(let t=c;t<=a;t+=o)e.moveTo(t,0),e.lineTo(t,n);for(let t=d;t<=n;t+=o)e.moveTo(0,t),e.lineTo(a,t)}else for(let t=d;t<=n;t+=o)e.moveTo(0,t),e.lineTo(a,t);e.stroke(),e.restore()}(i,t.bg||{m:"none"},a,n),v(i,Array.isArray(t.it)?t.it:[]),e}function C(e,t){if(!e||!(e instanceof Element)||!t)return null;if(e.dataset.open="1",e.innerHTML="",!S(t)){let t=document.createElement("span");return t.className="lia-canvas-freeze-empty",t.textContent="No visible canvas content frozen.",e.appendChild(t),t}let a=document.createElement("span");a.className="lia-draw-block";let n=document.createElement("span");n.className="lia-draw-wrap";let r=document.createElement("canvas");return r.className="lia-canvas-freeze-preview",r.setAttribute("aria-label","Frozen drawing area"),n.appendChild(r),a.appendChild(n),e.appendChild(a),M(r,t),r}function A(e,t){let a=m(e);return a?C(a,t):null}function L(){let e=i.LIA.freeze||{};return e.version="cvf1",e.collectCanvasPairsFromRoot=y,e.getCanvasMountFromPair=m,e.getCanvasUidFromPair=b,e.getCanvasStoreEntry=x,e.exportCanvasFreezeStateFromEntry=w,e.exportCanvasFreezeStateFromPair=_,e.exportAllCanvasFreezeStatesFromRoot=k,e.hasCanvasFreezeContent=S,e.paintCanvasFreezeStateToCanvas=M,e.renderCanvasFreezeStateIntoMount=C,e.renderCanvasFreezeStateIntoPair=A,i.LIA.freeze=e,e}},{"../index":"gFFiE","./store":"8Sk5l","./theme":"3aqKC","@parcel/transformer-js/src/esmodule-helpers.js":"b0H7B"}],"8Sk5l":[function(e,t,a,n){var r=e("@parcel/transformer-js/src/esmodule-helpers.js");r.defineInteropFlag(a),r.export(a,"ensureMountUID",()=>o),r.export(a,"__liaDispatchCanvasFreezeChange",()=>l);var i=e("../index");function o(e){if(!e)return"";if(e.dataset&&e.dataset.uid)return e.dataset.uid;let t="c"+ ++i.LIA.uidSeq;return e.dataset.uid=t,t}function l(e){try{let t=Object.assign({ts:Date.now()},e&&"object"==typeof e?e:{}),a=(0,i.getRootWindow)();(a&&"function"==typeof a.dispatchEvent?a:window).dispatchEvent(new CustomEvent("lia:canvas-change",{detail:t}))}catch(e){}}},{"../index":"gFFiE","@parcel/transformer-js/src/esmodule-helpers.js":"b0H7B"}],bUAoc:[function(e,t,a,n){var r=e("@parcel/transformer-js/src/esmodule-helpers.js");r.defineInteropFlag(a),r.export(a,"ensureCanvasFreezeApi",()=>s.ensureCanvasFreezeApi),r.export(a,"canvasMarkup",()=>u),r.export(a,"initAll",()=>p);var i=e("../index"),o=e("./theme"),l=e("./store"),s=e("./freeze"),c=e("../lia/input"),d=e("../lia/i18n");function u(){return`
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
  `}function p(){document.querySelectorAll(".lia-draw-wrap canvas.lia-draw:not([data-ready])").forEach(e=>{e.setAttribute("data-ready","1"),function(e){let t=e.closest(".lia-draw-wrap");if(!t)return;let a=function(){let e=window.__LIA_CANVAS_PEN_TOUCH_GUARD__=window.__LIA_CANVAS_PEN_TOUCH_GUARD__||{activePenPointers:new Set};if(window.__LIA_CANVAS_GLOBAL_TOUCH_SUPPRESSOR__)return e;window.__LIA_CANVAS_GLOBAL_TOUCH_SUPPRESSOR__=!0;let t=t=>{0===String(t.type||"").indexOf("pointer")&&"touch"!==String(t.pointerType||"")||e.activePenPointers.size&&(t.cancelable&&t.preventDefault(),t.stopPropagation())};document.addEventListener("touchstart",t,{capture:!0,passive:!1}),document.addEventListener("touchmove",t,{capture:!0,passive:!1}),document.addEventListener("pointerdown",t,{capture:!0,passive:!1}),document.addEventListener("pointermove",t,{capture:!0,passive:!1});let a=t=>{"pen"===String(t.pointerType||"").toLowerCase()&&e.activePenPointers.delete(t.pointerId)};return document.addEventListener("pointerup",a,{capture:!0}),document.addEventListener("pointercancel",a,{capture:!0}),document.addEventListener("pointerleave",a,{capture:!0}),e}(),n=new Set,r=(e,t)=>(0,d.liaT)("ocr."+e,t),s=(e,t)=>(0,d.liaT)("canvas."+e,t),u=t.closest(".lia-canvas-mount"),p=(0,l.ensureMountUID)(u),h=t.querySelector(".lia-undo-btn"),f=t.querySelector(".lia-redo-btn"),g=t.querySelector(".lia-color-btn"),m=t.querySelector(".lia-eraser-btn"),b=t.querySelector(".lia-rect-btn"),x=t.querySelector(".lia-bgmenu-btn"),y=t.querySelector(".lia-tool-menu"),v=document.createElement("button");v.type="button",v.className="lia-rect-action",v.textContent=r("selectSubmit","Submit as Solution"),v.style.display="none",t.appendChild(v);let w=document.createElement("div");w.className="lia-rect-progress",w.dataset.on="0",w.innerHTML=`
    <div class="lia-rect-progbar"><div class="lia-rect-progfill"></div></div>
    <div class="lia-rect-progtxt">0%</div>
  `,t.appendChild(w);let _=w.querySelector(".lia-rect-progfill"),k=w.querySelector(".lia-rect-progtxt"),S=!1;function M(){if(S||(v.textContent=r("selectSubmit","Submit as Solution")),b){let e=r("selectSubmit","Submit as Solution");b.title=e,b.setAttribute("aria-label",e)}}let C=()=>{if(M(),ej(),y&&"1"===y.dataset.open){let e=String(y.__mode||"");"pen"===e?e_():"eraser"===e?ek():"bg"===e&&eS()}};document.addEventListener("lia:canvas-i18n-update",C),w.addEventListener("pointerdown",e=>{e.preventDefault(),e.stopPropagation()}),v.addEventListener("pointerdown",e=>{e.preventDefault(),e.stopPropagation()});let A=document.createElement("button");A.type="button",A.className="lia-rect-close",A.setAttribute("aria-label","Marker-Rechteck entfernen"),A.style.display="none",A.innerHTML=`
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 7L17 17M17 7L7 17" fill="none" stroke="currentColor"
            stroke-width="2.4" stroke-linecap="round"/>
    </svg>
  `,t.appendChild(A);let L=document.createElement("span");L.className="lia-eraser-ring",L.dataset.on="0",t.appendChild(L),A.addEventListener("pointerdown",e=>{e.preventDefault(),e.stopPropagation()}),A.addEventListener("click",e=>{e.preventDefault(),e.stopPropagation(),function(){let e=!1;for(let t=er.length-1;t>=0;t--)er[t]&&"rect"===er[t].kind&&(er.splice(t,1),e=!0);for(let t=ei.length-1;t>=0;t--)ei[t]&&"rect"===ei[t].kind&&(ei.splice(t,1),e=!0);e&&(eF(),eq(),ej(),eb()),eE()}()}),(0,o.setUndoIcon)(h),(0,o.setRedoIcon)(f),(0,o.setEraserIcon)(m),(0,o.setRectIcon)(b),x&&!x.__bgCleared&&(x.__bgCleared=!0,x.innerHTML="");let E=e.getContext("2d",{willReadFrequently:!0}),I=document.createElement("canvas"),R=I.getContext("2d",{willReadFrequently:!0}),T=document.createElement("canvas"),P=T.getContext("2d",{willReadFrequently:!0}),O=i.LIA.store,F=p&&O[p]?O[p]:null,z=F&&F.VIEW?{...F.VIEW}:{panX:0,panY:0,scale:1,minScale:.25,maxScale:8},q=0,j=!1;function B(e){try{let t=i.LIA.bar;t&&t.log&&t.log(e)}catch(e){}}function N(e){let t=String(e||""),a="",n=!1;for(let e=0;e<t.length;e++){let r=t[e];" "===r||"\n"===r||"\r"===r||"	"===r||"\f"===r?(n||(a+=" "),n=!0):(a+=r,n=!1)}return a.trim()}function D(e){let t=String(e||"").trim();return t.startsWith("$$")&&t.endsWith("$$")&&(t=t.slice(2,-2).trim()),t.startsWith("$")&&t.endsWith("$")&&(t=t.slice(1,-1).trim()),t.startsWith("\\[")&&t.endsWith("\\]")&&(t=t.slice(2,-2).trim()),N(t)}function H(e){let t=String(e||"").trim(),a="\\mathrm{";if(t.startsWith(a)&&t.endsWith("}")){t=t.slice(a.length,-1);let e="";for(let a=0;a<t.length;a++)"~"!==t[a]&&(e+=t[a]);return e.trim()}return t}function V(e){if(!e||(-1!==e.indexOf("\\div")&&(e=e.replace(/\s*\\div\s*/g,":")),-1===e.indexOf("\\times")))return e;let t="",a=0,n=e;for(;a<n.length;){let e=n.indexOf("\\times",a);if(-1===e){t+=n.slice(a);break}t+=n.slice(a,e);let r=e+6;for(;r<n.length&&" "===n[r];)r++;let i=e-1;for(;i>=0&&" "===n[i];)i--;let o=n[r]||"",l=n[i]||"",s=e=>e>="0"&&e<="9",c=e=>e>="a"&&e<="z";s(l)&&s(o)?t+="\\cdot":c(l)||c(o)?t+="x":t+="\\cdot",a=e+6}return t}function W(e){let t=Math.max(e.width,e.height),a=1;if(t<420&&(a=420/t),t>1400&&(a=1400/t),.06>Math.abs((a=em(a,.5,4))-1))return e;let n=document.createElement("canvas");n.width=Math.max(1,Math.round(e.width*a)),n.height=Math.max(1,Math.round(e.height*a));let r=n.getContext("2d",{willReadFrequently:!0});return r.fillStyle="#fff",r.fillRect(0,0,n.width,n.height),r.drawImage(e,0,0,n.width,n.height),n}function U(e){let t=document.createElement("canvas");t.width=Math.max(1,0|e.width),t.height=Math.max(1,0|e.height);let a=t.getContext("2d",{willReadFrequently:!0});a.fillStyle="#fff",a.fillRect(0,0,t.width,t.height),a.drawImage(e,0,0);let n=a.getImageData(0,0,t.width,t.height).data,r=t.width,i=t.height,o=new Uint8Array(r*i);for(let e=0,t=0;t<o.length;t++,e+=4)o[t]=+(.299*n[e]+.587*n[e+1]+.114*n[e+2]<200);let l=o;for(let e=0;e<0;e++)l=function(e){let t=new Uint8Array(r*i);for(let a=1;a<i-1;a++)for(let n=1;n<r-1;n++){let i=a*r+n,o=0;for(let t=-1;t<=1;t++)for(let a=-1;a<=1;a++)if(e[i+t*r+a]){o=1,t=2;break}t[i]=o}return t}(l);let s=r,c=i,d=-1,u=-1;for(let e=0;e<i;e++)for(let t=0;t<r;t++)l[e*r+t]&&(t<s&&(s=t),e<c&&(c=e),t>d&&(d=t),e>u&&(u=e));if(d<0)return t;s=Math.max(0,s-18),c=Math.max(0,c-18);let p=Math.max(1,(d=Math.min(r-1,d+18))-s+1),h=Math.max(1,(u=Math.min(i-1,u+18))-c+1),f=document.createElement("canvas");f.width=p,f.height=h;let g=f.getContext("2d",{willReadFrequently:!0}),m=g.createImageData(p,h),b=m.data;for(let e=0;e<h;e++)for(let t=0;t<p;t++){let a=255*!l[(c+e)*r+(s+t)],n=(e*p+t)*4;b[n]=a,b[n+1]=a,b[n+2]=a,b[n+3]=255}g.putImageData(m,0,0);let x=512/Math.max(p,h);x<.75&&(x=.75),x>3.5&&(x=3.5);let y=document.createElement("canvas");y.width=Math.max(1,Math.round(p*x)),y.height=Math.max(1,Math.round(h*x));let v=y.getContext("2d",{willReadFrequently:!0});return v.fillStyle="#fff",v.fillRect(0,0,y.width,y.height),v.imageSmoothingEnabled=!0,v.drawImage(f,0,0,y.width,y.height),y}function $(e,t){let a=+(1===(t&&"object"==typeof t?t:{}).dilate),n=document.createElement("canvas");n.width=Math.max(1,0|e.width),n.height=Math.max(1,0|e.height);let r=n.getContext("2d",{willReadFrequently:!0});r.fillStyle="#fff",r.fillRect(0,0,n.width,n.height),r.drawImage(e,0,0);let i=r.getImageData(0,0,n.width,n.height).data,o=n.width,l=n.height,s=new Uint8Array(o*l);for(let e=0,t=0;t<s.length;t++,e+=4)s[t]=+(.299*i[e]+.587*i[e+1]+.114*i[e+2]<225);1===a&&(s=function(e){let t=new Uint8Array(o*l);for(let a=1;a<l-1;a++)for(let n=1;n<o-1;n++){let r=a*o+n,i=0;for(let t=-1;t<=1;t++)for(let a=-1;a<=1;a++)if(e[r+t*o+a]){i=1,t=2;break}t[r]=i}return t}(s));let c=o,d=l,u=-1,p=-1;for(let e=0;e<l;e++)for(let t=0;t<o;t++)s[e*o+t]&&(t<c&&(c=t),e<d&&(d=e),t>u&&(u=t),e>p&&(p=e));if(u<0)return U(e);let h=Math.max(1,u-c+1),f=Math.max(1,p-d+1),g=Math.max(24,Math.floor(.35*Math.max(h,f))),m=Math.max(64,Math.min(1024,Math.max(h,f)+2*g)),b=document.createElement("canvas");b.width=m,b.height=m;let x=b.getContext("2d",{willReadFrequently:!0}),y=x.createImageData(m,m),v=y.data;for(let e=0;e<v.length;e+=4)v[e]=255,v[e+1]=255,v[e+2]=255,v[e+3]=255;let w=Math.floor((m-h)/2),_=Math.floor((m-f)/2);for(let e=0;e<f;e++)for(let t=0;t<h;t++){let a=255*!s[(d+e)*o+(c+t)],n=((_+e)*m+(w+t))*4;v[n]=a,v[n+1]=a,v[n+2]=a,v[n+3]=255}x.putImageData(y,0,0);let k=document.createElement("canvas");k.width=512,k.height=512;let S=k.getContext("2d",{willReadFrequently:!0});return S.fillStyle="#fff",S.fillRect(0,0,512,512),S.imageSmoothingEnabled=!1,S.drawImage(b,0,0,512,512),k}function X(e){let t=String(e||"").trim();return t?K(t)?t.length-5e3:t.length:-9999}async function Y(e,t){let a=t,n=t,r=t;try{a=U(t)}catch(e){a=t}try{a=W(a)}catch(e){}try{var i;let e,a,r;i=U(t),e=Math.max(0,Math.round(20)),(a=document.createElement("canvas")).width=i.width+2*e,a.height=i.height+2*e,(r=a.getContext("2d",{willReadFrequently:!0})).fillStyle="#fff",r.fillRect(0,0,a.width,a.height),r.drawImage(i,e,e),n=a}catch(e){n=a}try{n=W(n)}catch(e){}try{r=U(function(e){let t=document.createElement("canvas");t.width=e.width,t.height=e.height;let a=t.getContext("2d",{willReadFrequently:!0});a.fillStyle="#fff",a.fillRect(0,0,t.width,t.height),a.drawImage(e,0,0);let n=a.getImageData(0,0,t.width,t.height),r=n.data;for(let e=0;e<r.length;e+=4)!(r[e+3]<128)&&.299*r[e]+.587*r[e+1]+.114*r[e+2]<240&&(r[e]=Math.max(0,Math.min(255,Math.round(r[e]/1.35))),r[e+1]=Math.max(0,Math.min(255,Math.round(r[e+1]/1.35))),r[e+2]=Math.max(0,Math.min(255,Math.round(r[e+2]/1.35))));return a.putImageData(n,0,0),t}(t))}catch(e){r=a}try{r=W(r)}catch(e){}let o={max_new_tokens:128,do_sample:!1,temperature:0},[l,s,c]=await Promise.all([e.recognize(a,o).catch(()=>""),e.recognize(n,o).catch(()=>""),e.recognize(r,o).catch(()=>"")]),d=V(H(D(l))),u=V(H(D(s))),p=V(H(D(c))),h=X(d),f=X(u),g=X(p);return h>=f&&h>=g?d:f>=g?u:p}function G(e,t){let a=t*Math.PI/180,n=0|e.width,r=0|e.height,i=document.createElement("canvas");i.width=Math.max(1,n),i.height=Math.max(1,r);let o=i.getContext("2d",{willReadFrequently:!0});return o.fillStyle="#fff",o.fillRect(0,0,i.width,i.height),o.translate(i.width/2,i.height/2),o.rotate(a),o.translate(-n/2,-r/2),o.imageSmoothingEnabled=!1,o.drawImage(e,0,0),i}function K(e){let t=String(e||"").trim();if(!t||/[+\-*/=,:;\\]$/.test(t)||/[{[(]$/.test(t))return!0;let a=0,n=0,r=0,i=!1;for(let e=0;e<t.length;e++){let o=t[e];if(i){i=!1;continue}if("\\"===o){i=!0;continue}"{"===o?a++:"}"===o?a--:"["===o?n++:"]"===o?n--:"("===o?r++:")"===o&&r--}return 0!==a||0!==n||0!==r}function Q(e){let t=String(e||"").trim();if(!t||-1!==t.indexOf("\\"))return null;let a={O:"0",o:"0",Q:"0",D:"0",I:"1",l:"1","|":"1","!":"1",Z:"2",z:"2",S:"5",s:"5",B:"8",g:"9",q:"9"},n="";for(let e=0;e<t.length;e++){let r=t[e],i=t.charCodeAt(e);if(i>=48&&i<=57){n+=r;continue}if(!(" \n\r	".includes(r)||"${}()[]".includes(r))&&!",.;:_-".includes(r)){if(a[r]){n+=a[r];continue}return null}}return(n=String(n).trim())&&!(n.length>3)?n:null}async function J(e,t){t.__dgBase0||(t.__dgBase0=$(t,{dilate:0})),t.__dgBase1||(t.__dgBase1=$(t,{dilate:1}));let a=t.__dgBase0,n=t.__dgBase1,r=[()=>a,()=>G(a,-6),()=>G(a,6),()=>n,()=>G(n,-6),()=>G(n,6)],i={},o=[];for(let t=0;t<r.length;t++){let a="";try{a=await e.recognize(r[t](),{max_new_tokens:8,do_sample:!1,temperature:0,__silent:!0})}catch(e){continue}let n=D(a),l=Q(n=V(n=H(n)));if(l&&(i[l]||(i[l]=0,o.push(l)),i[l]+=1,i[l]>=3))return l}let l=null,s=0;for(let e of o)(i[e]||0)>s&&(s=i[e],l=e);return l}let Z=0,ee=0,et=0;function ea(e){if(!w||!_||!k)return;let t=Math.max(0,Math.min(1,Number(e)));_.style.width=Math.round(100*t)+"%",k.textContent=Math.round(100*t)+"%"}async function en({auto:a=!1}={}){let n,o=eM();if(!o)return void B("No marker-rectangle found.");let l=i.LIA.ocr;if(!l||!l.recognize)return void B("OCR engine not available (LIA.ocr).");let s=v.textContent||"";S=!0,v.disabled=!0,v.textContent=r("runningOcr","Running OCR..."),Z&&cancelAnimationFrame(Z),et&&clearTimeout(et),Z=0,et=0,w&&(w.dataset.on="1",ea(0),eE()),ee=performance.now(),n=()=>{let e=performance.now()-ee;if(ea(e<900?e/900*.7:e<2200?.7+(e-900)/1300*.2:.9+Math.min(.08,(e-2200)/5e3*.08)),!S||!t.isConnected||e>=8e3){Z=0;return}Z=requestAnimationFrame(n)},Z=requestAnimationFrame(n);try{l.ensureLoaded&&await l.ensureLoaded(!1);let a=function(t){if(!t)return null;let a=window.devicePixelRatio||1,n=Math.min(t.x0,t.x1),r=Math.min(t.y0,t.y1),i=Math.max(t.x0,t.x1),o=Math.max(t.y0,t.y1),l=eR(n,r),s=eR(i,o),c=em(Math.min(l.sx,s.sx),0,e.clientWidth),d=em(Math.min(l.sy,s.sy),0,e.clientHeight),u=em(Math.max(l.sx,s.sx),0,e.clientWidth),p=em(Math.max(l.sy,s.sy),0,e.clientHeight),h=u-c,f=p-d;if(h<6||f<6)return null;let g=Math.round((c-12)*a),m=Math.round((d-12)*a),b=Math.round((h+24)*a),x=Math.round((f+24)*a),y=document.createElement("canvas");y.width=Math.max(1,b),y.height=Math.max(1,x);let v=y.getContext("2d",{willReadFrequently:!0});v.setTransform(1,0,0,1,0,0),v.globalCompositeOperation="source-over",v.globalAlpha=1,v.clearRect(0,0,y.width,y.height);let w=T.width,_=T.height,k=g,S=m,M=b,C=x,A=0,L=0,E=y.width,I=y.height;if(k<0){let e=-k/M;A+=E*e,E-=E*e,M+=k,k=0}if(S<0){let e=-S/C;L+=I*e,I-=I*e,C+=S,S=0}if(k+M>w){let e=k+M-w;E-=e/M*E,M-=e}if(S+C>_){let e=S+C-_;I-=e/C*I,C-=e}if(M<=1||C<=1||E<=1||I<=1)return null;v.drawImage(T,k,S,M,C,A,L,E,I);let R=v.getImageData(0,0,y.width,y.height),P=R.data;for(let e=0;e<P.length;e+=4)P[e+3]>10?(P[e]=0,P[e+1]=0,P[e+2]=0):(P[e]=255,P[e+1]=255,P[e+2]=255),P[e+3]=255;return v.putImageData(R,0,0),y}(o);if(!a)return void B("Crop failed (rect too small or out of bounds).");let n=function(e){try{let t=0|e.width,a=0|e.height,n=e.getContext("2d",{willReadFrequently:!0}).getImageData(0,0,t,a).data,r=t*a>12e5?2:1,i=t,o=a,l=-1,s=-1,c=0;for(let e=0;e<a;e+=r){let a=e*t*4;for(let d=0;d<t;d+=r)n[a+4*d]<128&&(c++,d<i&&(i=d),e<o&&(o=e),d>l&&(l=d),e>s&&(s=e))}if(l<0)return null;let d=l-i+1,u=s-o+1;return{xMin:i,yMin:o,xMax:l,yMax:s,w:d,h:u,black:c,W:t,H:a}}catch(e){}return null}(a),i=function(e,t){if(!e||!t)return!1;let a=Math.max(1,0|t.width),n=Math.max(1,0|t.height),r=Math.max(1,0|e.w),i=Math.max(1,0|e.h),o=Math.max(r,i),l=Math.min(r,i),s=r/Math.max(1,i),c=(Number(e.black||0)||0)/Math.max(1,r*i);return!(o>220||l>170||s<.2||s>2.8||c<.01||c>.6||r>Math.floor(.82*a)&&i>Math.floor(.82*n)&&o>140)}(n,a),d=String(l.model||""),u=-1!==d.toLowerCase().indexOf("trocr"),p=a,h="";if(i){try{p=$(a,{dilate:0})}catch(e){p=a}try{p=W(p)}catch(e){}h=await l.recognize(p,{max_new_tokens:16,do_sample:!1,temperature:0})}else h=await Y(l,a);if(i){let e=String(h||"").trim();if(-1!==e.indexOf("\\")||-1!==e.indexOf("{")||-1!==e.indexOf("}")||-1!==e.indexOf("^")||-1!==e.indexOf("_")||-1!==e.indexOf("sqrt")||-1!==e.indexOf("frac")||K(e)){let e=a;try{e=U(a)}catch(t){e=a}try{e=W(e)}catch(e){}h=await l.recognize(e,{max_new_tokens:128,do_sample:!1,temperature:0})}}let f=u?function(e){let t=N(e),a="+-=*/()[]{}",n="";for(let e=0;e<t.length;e++){let r=t[e];if(" "===r){let r=e>0?t[e-1]:"",i=e+1<t.length?t[e+1]:"";if(a.indexOf(r)>=0||a.indexOf(i)>=0)continue;n+=" "}else n+=r}return n.trim()}(h):i?H(D(h)):h;if(f=V(f),i||function(e){let t=String(e||"").trim();if(!t||t.length>6||-1!==t.indexOf("\\"))return!1;let a=!1;for(let e=0;e<t.length;e++){let n=t.charCodeAt(e),r=t[e];if(n>=48&&n<=57||"lLIi|!OoQqSsZzBg".includes(r)){a=!0;continue}if(!" \n\r	()[]{}.,;:_-".includes(r))return!1}return a}(f)){let e=Q(f);if(e)f=e;else{let e=function(e){let t=String(e||"").trim();if(!t)return null;let a=!0;for(let e=0;e<t.length;e++){let n=t.charCodeAt(e);if(n<48||n>57){a=!1;break}}if(a)return t;let n=t.toLowerCase();if("li"===n||"l1"===n||"il"===n)return"4";if("go"===n||"g0"===n||"qo"===n||"q0"===n)return"8";let r={O:"0",o:"0",Q:"0",I:"1",l:"1","|":"1","!":"1",Z:"2",z:"2",J:"3",j:"3",H:"4",h:"4",S:"5",s:"5",B:"8",g:"9",q:"9"},i="";for(let e=0;e<t.length;e++){let a=t[e];if(!r[a])return null;i+=r[a]}return i||null}(f);e&&(f=e)}if(!function(e){let t=String(e||"").trim();if(!t)return!1;for(let e=0;e<t.length;e++){let a=t.charCodeAt(e);if(a<48||a>57)return!1}return!0}(f)){let e=await J(l,a);e&&(f=e)}}B("OCR result: "+f);let g=t.closest(".lia-canvas-pair");(0,c.__liaFindAndSetInputBeforeNode)(g||t,f)?(v.textContent=r("submitted","✅ submitted"),setTimeout(()=>{v.textContent=s},900)):B("Could not find an input field before this @canvas.")}catch(e){B("OCR error: "+(e&&e.message?e.message:String(e))),v.textContent=r("ocrError","⚠ Error"),setTimeout(()=>{v.textContent=s},900)}finally{Z&&(cancelAnimationFrame(Z),Z=0),et&&clearTimeout(et),ea(1),et=setTimeout(()=>{et=0,w&&(w.dataset.on="0",ea(0))},250),v.disabled=!1,S=!1,M()}}v.addEventListener("click",async e=>{e.preventDefault(),e.stopPropagation(),await en({auto:!1})});let er=[],ei=[];F&&(Array.isArray(F.ITEMS)?(er=F.ITEMS,ei=Array.isArray(F.REDO)?F.REDO:[]):Array.isArray(F.STROKES)&&(er=F.STROKES.map(e=>({kind:"path",...e})),ei=Array.isArray(F.REDO)?F.REDO.map(e=>({kind:"path",...e})):[]));let eo="pen",el="pen",es=0,ec=3,ed=1,eu=12,ep=F&&F.bgMode?F.bgMode:"none",eh=F&&F.bgStep?F.bgStep:24,ef=null,eg=null;function em(e,t,a){return Math.max(t,Math.min(a,e))}function eb(a){if(p){var n;O[p]={VIEW:{...z},ITEMS:er,REDO:ei,bgMode:ep,bgStep:eh,wrapW:t.getBoundingClientRect().width,canvasH:e.clientHeight},n=a||"persist",!p||j&&(clearTimeout(q),q=setTimeout(()=>{(0,l.__liaDispatchCanvasFreezeChange)({uid:p,reason:String(n||"persist"),hasItems:Array.isArray(er)&&er.length>0?1:0})},120))}}function ex(){let e=o.COLORS[es]||o.COLORS[0];return"auto"===e.key?(0,o.getAutoPen)():e.value||(0,o.getAutoPen)()}function ey(e){y&&(y.dataset.open=e?"1":"0")}function ev(){y&&"1"===y.dataset.open&&ey(!1)}function ew(){return'<svg viewBox="-1 0 24 24" aria-hidden="true" style="width:22px;height:22px;display:block;"><path class="ico-stroke" d="M6 6l12 12M18 6L6 18" stroke-width="2" stroke-linecap="round"/></svg>'}function e_(){if(!y)return;y.__mode="pen";let e=(0,o.getAutoPen)(),t="";t+=`<span class="lia-heading-row"><span class="lia-tool-heading">${s("pen","Pen")}</span><button class="lia-menu-icon-btn" type="button" data-act="close" aria-label="Close">${ew()}</button></span><span class="lia-color-grid">`;for(let a=0;a<o.COLORS.length;a++){let n=o.COLORS[a],r="auto"===n.key?e:n.value||e;t+=`<button class="lia-color-item" type="button" data-act="color" data-idx="${a}" data-active="${a===es?"1":"0"}" style="background:${r};" aria-label="Color ${n.key}"></button>`}y.innerHTML=t+=`</span><span class="lia-row"><span class="lia-preview"><span class="lia-preview-line" data-k="pw" style="height:${Math.max(2,Math.min(14,ec))}px;"></span></span><input class="lia-slider" type="range" min="1" max="100" step="1" value="${ec}" data-act="penWidth" aria-label="Pen width"><span class="lia-menu-value" data-k="pwv" style="font-weight:800;min-width:2.6em;text-align:right">${ec}</span></span><span class="lia-row"><span class="lia-preview"><span class="lia-preview-line" data-k="pa" style="opacity:${ed};"></span></span><input class="lia-slider" type="range" min="0.15" max="1" step="0.05" value="${ed}" data-act="penAlpha" aria-label="Opacity"><span class="lia-menu-value" data-k="pav" style="font-weight:800;min-width:2.6em;text-align:right">${Math.round(100*ed)}%</span></span>`,y.onclick=e=>{let t=e.target&&e.target.closest?e.target.closest("[data-act]"):null;if(!t)return;let a=t.getAttribute("data-act");if("close"===a)return void ey(!1);if("color"===a){let e=Number(t.getAttribute("data-idx"));isFinite(e)&&(es=em(e,0,o.COLORS.length-1)),eo="pen",ej(),eb(),e_();return}};let a=y.querySelector('input[data-act="penWidth"]');a&&(a.oninput=()=>{ec=em(Number(a.value),1,100),ej(),eb();let e=y.querySelector('[data-k="pw"]');e&&(e.style.height=Math.max(2,Math.min(14,ec))+"px");let t=y.querySelector('[data-k="pwv"]');t&&(t.textContent=String(ec))});let n=y.querySelector('input[data-act="penAlpha"]');n&&(n.oninput=()=>{ed=em(Number(n.value),.05,1),ej(),eb();let e=y.querySelector('[data-k="pa"]');e&&(e.style.opacity=String(ed));let t=y.querySelector('[data-k="pav"]');t&&(t.textContent=Math.round(100*ed)+"%")})}function ek(){if(!y)return;y.__mode="eraser",y.innerHTML=`<span class="lia-heading-row"><span class="lia-tool-heading">${s("eraser","Eraser")}</span><span style="display:flex;gap:8px;align-items:center"><button class="lia-menu-icon-btn" type="button" data-act="clear" aria-label="Clear all"><svg viewBox="-1 0 24 24" aria-hidden="true" style="width:22px;height:22px;display:block;"><path class="ico-stroke" d="M9 3h6" stroke-width="2" stroke-linecap="round"/><path class="ico-stroke" d="M4 6h16" stroke-width="2" stroke-linecap="round"/><path class="ico-stroke" d="M7 6l1 15h8l1-15" stroke-width="2" stroke-linejoin="round"/><path class="ico-stroke" d="M10 10v8M14 10v8" stroke-width="2" stroke-linecap="round"/></svg></button><button class="lia-menu-icon-btn" type="button" data-act="close" aria-label="Close">${ew()}</button></span></span><span class="lia-row"><span class="lia-preview"><span class="lia-preview-line lia-preview-line--eraser" style="height:${Math.max(2,Math.min(18,eu))}px;"></span></span><input class="lia-slider" type="range" min="4" max="500" step="1" value="${eu}" data-act="eraserWidth" aria-label="Eraser width"><span class="lia-menu-value" data-k="ewv" style="font-weight:800;min-width:2.6em;text-align:right">${eu}</span></span>`,y.onclick=e=>{let t=e.target?.closest?.("[data-act]");if(!t)return;let a=t.getAttribute("data-act");"close"===a?ey(!1):"clear"===a&&(er.length=0,ei.length=0,eF(),ez(),eq(),ej(),eb())};let e=y.querySelector('input[data-act="eraserWidth"]');e&&(e.oninput=()=>{eu=em(Number(e.value),2,500),ej(),eb();let t=y.querySelector('[data-k="ewv"]');t&&(t.textContent=String(eu))})}function eS(){if(!y)return;y.__mode="bg";let e=s("background","Background");y.innerHTML=`<span class="lia-heading-row"><span class="lia-tool-heading">${e}</span><button class="lia-menu-icon-btn" type="button" data-act="close" aria-label="Close">${ew()}</button></span><span class="lia-bg-tiles"><button class="lia-bg-tile" type="button" data-act="bg" data-mode="none" data-active="${"none"===ep?"1":"0"}" aria-label="No background"></button><button class="lia-bg-tile" type="button" data-act="bg" data-mode="grid" data-active="${"grid"===ep?"1":"0"}" aria-label="Grid"></button><button class="lia-bg-tile" type="button" data-act="bg" data-mode="lined" data-active="${"lined"===ep?"1":"0"}" aria-label="Lined"></button></span><span class="lia-row"><span class="lia-menu-label" style="font-weight:800;opacity:.8;min-width:4.8em">Spacing</span><input class="lia-slider" type="range" min="8" max="80" step="1" value="${eh}" data-act="bgStep" aria-label="Background spacing"><span class="lia-menu-value" data-k="bgsv" style="font-weight:800;min-width:2.6em;text-align:right">${eh}</span></span>`;try{let e=(0,o.rgbaFromAny)((0,o.getAccentCssVar)(),.65),t=y.querySelectorAll(".lia-bg-tile");t&&t.length>=3&&(t[1].style.backgroundImage=`linear-gradient(to right, ${e} 2px, transparent 2px), linear-gradient(to bottom, ${e} 2px, transparent 2px)`,t[1].style.backgroundSize="10px 10px",t[1].style.backgroundPosition="center",t[2].style.backgroundImage=`linear-gradient(to bottom, ${e} 2px, transparent 2px)`,t[2].style.backgroundSize="10px 10px",t[2].style.backgroundPosition="center")}catch(e){}y.onclick=e=>{let t=e.target?.closest?.("[data-act]");if(!t)return;let a=t.getAttribute("data-act");if("close"===a)return void ey(!1);if("bg"===a){let e=String(t.getAttribute("data-mode")||"none");ep="grid"===e||"lined"===e?e:"none",eq(),eb(),eS(),ej();return}};let t=y.querySelector('input[data-act="bgStep"]');t&&(t.oninput=()=>{eh=em(Number(t.value),6,300),eq(),eb();let e=y.querySelector('[data-k="bgsv"]');e&&(e.textContent=String(eh))})}function eM(){for(let e=er.length-1;e>=0;e--){let t=er[e];if(t&&"rect"===t.kind)return t}return null}function eC(){L&&(L.dataset.on="0")}function eA(t,a){if(!L)return;if("eraser"!==eo||!isFinite(t)||!isFinite(a))return void eC();let n=Math.max(8,eu*z.scale);L.style.width=n+"px",L.style.height=n+"px",L.style.left=em(t,0,e.clientWidth)+"px",L.style.top=em(a,0,e.clientHeight)+"px",L.dataset.on="1"}let eL=0;function eE(){eL||(eL=requestAnimationFrame(()=>{eL=0,function(){let t=eM();if(!t){v.style.display="none",A&&(A.style.display="none");return}v.style.display="block",v.style.visibility="hidden";let a=v.offsetWidth||180,n=v.offsetHeight||34;v.style.visibility="visible";let r=Math.min(t.x0,t.x1),i=Math.min(t.y0,t.y1),o=Math.max(t.x0,t.x1),l=Math.max(t.y0,t.y1),s=eR(r,i),c=eR(o,l),d=Math.max(s.sx,c.sx),u=Math.max(s.sy,c.sy),p=em(d-a,6,e.clientWidth-a-6),h=em(u+8,6,e.clientHeight-n-6);if(v.style.left=p+"px",v.style.top=h+"px",w){w.style.width=a+"px";let t=w.offsetHeight||26;w.style.left=em(p,6,e.clientWidth-a-6)+"px",w.style.top=em(h-t-6,6,e.clientHeight-t-6)+"px"}if(A){A.style.display="block",A.style.visibility="hidden";let t=A.offsetWidth||24,a=A.offsetHeight||24;A.style.visibility="visible";let n=Math.min(s.sy,c.sy),r=Math.max(s.sx,c.sx);A.style.left=em(r-.5*t,6,e.clientWidth-t-6)+"px",A.style.top=em(n-.5*a,6,e.clientHeight-a-6)+"px"}}()}))}function eI(e,t){return{x:(e-z.panX)/z.scale,y:(t-z.panY)/z.scale}}function eR(e,t){return{sx:e*z.scale+z.panX,sy:t*z.scale+z.panY}}function eT(e){let t=window.devicePixelRatio||1;e.setTransform(t*z.scale,0,0,t*z.scale,t*z.panX,t*z.panY)}function eP(t){let a=window.devicePixelRatio||1;t.setTransform(a,0,0,a,0,0),t.globalCompositeOperation="source-over",t.globalAlpha=1,t.clearRect(0,0,e.clientWidth,e.clientHeight)}function eO(e,t){"eraser"===t.tool?(e.globalCompositeOperation="destination-out",e.globalAlpha=1,e.strokeStyle="rgba(0,0,0,1)"):(e.globalCompositeOperation="source-over",e.globalAlpha=t.alpha,e.strokeStyle=t.color),e.lineWidth=t.width,e.lineCap="round",e.lineJoin="round"}function eF(){for(let e of(eP(R),eT(R),er)){if(!e||"rect"!==e.kind)continue;let t="accent"===e.colorKey?(0,o.getAccentCssVar)():e.color||(0,o.getAccentCssVar)(),a=(0,o.rgbaFromAny)(t,Math.max(0,Math.min(1,e.alpha))),n=Math.min(e.x0,e.x1),r=Math.min(e.y0,e.y1),i=Math.max(e.x0,e.x1),l=Math.max(e.y0,e.y1);R.save(),R.globalCompositeOperation="source-over",R.globalAlpha=1,R.fillStyle=a,R.fillRect(n,r,Math.max(0,i-n),Math.max(0,l-r)),R.restore()}}function ez(){for(let e of(eP(P),eT(P),er))if(e&&"path"===e.kind&&e.points&&!(e.points.length<2)){eO(P,e),P.beginPath(),P.moveTo(e.points[0].x,e.points[0].y);for(let t=1;t<e.points.length;t++)P.lineTo(e.points[t].x,e.points[t].y);P.stroke()}}function eq(){let t;t=window.devicePixelRatio||1,E.setTransform(t,0,0,t,0,0),E.globalCompositeOperation="source-over",E.globalAlpha=1,E.clearRect(0,0,e.clientWidth,e.clientHeight),function(){let t,a;if("none"===ep)return;let n=window.devicePixelRatio||1;E.setTransform(n*z.scale,0,0,n*z.scale,n*z.panX,n*z.panY);let r=Math.max(6,Number(eh)||24),i=(t=e.clientWidth,a=e.clientHeight,{x0:(0-z.panX)/z.scale,y0:(0-z.panY)/z.scale,x1:(t-z.panX)/z.scale,y1:(a-z.panY)/z.scale}),l=(0,o.rgbaFromAny)((0,o.getAccentCssVar)(),.65);E.save(),E.globalCompositeOperation="source-over",E.globalAlpha=1,E.strokeStyle=l,E.lineWidth=1.125/z.scale;let s=Math.floor(i.x0/r)*r,c=Math.ceil(i.x1/r)*r,d=Math.floor(i.y0/r)*r,u=Math.ceil(i.y1/r)*r;if(E.beginPath(),"grid"===ep){let e=0;for(let t=s;t<=c&&(E.moveTo(t,i.y0),E.lineTo(t,i.y1),!(++e>4e3));t+=r);for(let t=d;t<=u&&(E.moveTo(i.x0,t),E.lineTo(i.x1,t),!(++e>4e3));t+=r);}else{let e=0;for(let t=d;t<=u&&(E.moveTo(i.x0,t),E.lineTo(i.x1,t),!(++e>4e3));t+=r);}E.stroke(),E.restore()}();let a=window.devicePixelRatio||1;if(E.setTransform(a,0,0,a,0,0),E.globalCompositeOperation="source-over",E.globalAlpha=1,E.drawImage(I,0,0,I.width,I.height,0,0,e.clientWidth,e.clientHeight),eg){let e=(0,o.rgbaFromAny)((0,o.getAccentCssVar)(),.28),t=Math.min(eg.x0,eg.x1),a=Math.min(eg.y0,eg.y1),n=Math.max(eg.x0,eg.x1),r=Math.max(eg.y0,eg.y1),i=eR(t,a),l=eR(n,r);E.save(),E.fillStyle=e,E.globalAlpha=1,E.fillRect(i.sx,i.sy,Math.max(0,l.sx-i.sx),Math.max(0,l.sy-i.sy)),E.restore()}E.drawImage(T,0,0,T.width,T.height,0,0,e.clientWidth,e.clientHeight),eE()}function ej(){let e=ex(),t=(0,o.getAccentCssVar)(),a=s("pen","Pen"),n=s("eraser","Eraser");if(h&&(h.disabled=0===er.length,h.title="Undo",h.setAttribute("aria-label","Undo")),f&&(f.disabled=0===ei.length,f.title="Redo",f.setAttribute("aria-label","Redo")),g&&(g.style.background=e,g.dataset.active="pen"===eo?"1":"0",g.title=a,g.setAttribute("aria-label",a)),m&&(m.dataset.active="eraser"===eo?"1":"0",m.title=n,m.setAttribute("aria-label",n)),b){let e=r("selectSubmit","Submit as Solution");b.style.background="transparent",b.dataset.active="rect"===eo?"1":"0",b.title=e,b.setAttribute("aria-label",e)}if(x){let e=s("background","Background"),a=(0,o.rgbaFromAny)(t,.65);x.style.backgroundColor="transparent",x.style.backgroundImage=`linear-gradient(to right, ${a} 1.8px, transparent 1.8px), linear-gradient(to bottom, ${a} 1.8px, transparent 1.8px)`,x.style.backgroundSize="6px 6px",x.style.backgroundPosition="center",x.dataset.active="bg"===el?"1":"0",x.title=e,x.setAttribute("aria-label",e)}"eraser"!==eo&&eC()}function eB(e,t){ef&&(ef.points.push({x:e,y:t}),P.lineTo(e,t))}function eN(e,t){ef&&(!function(e,t){if(!ef)return;let a=ef.points,n=a&&a.length?a[a.length-1]:null;if(!n){let a=eI(e,t);eB(a.x,a.y);return}let r=eR(n.x,n.y),i=e-r.sx,o=t-r.sy,l=Math.hypot(i,o);if(l<.35)return;if(l>1.4){let e=Math.min(12,Math.max(0,Math.floor(l/1.4)));for(let t=1;t<=e;t++){let a=t/(e+1),n=eI(r.sx+i*a,r.sy+o*a);eB(n.x,n.y)}}let s=eI(e,t);eB(s.x,s.y)}(e,t),P.stroke(),eq(),eb())}function eD(e){if(eg){if(e){let e=Math.min(eg.x0,eg.x1),t=Math.min(eg.y0,eg.y1),a=Math.max(eg.x0,eg.x1),n=Math.max(eg.y0,eg.y1);if(a-e>.001&&n-t>.001){for(let e=er.length-1;e>=0;e--)er[e]&&"rect"===er[e].kind&&er.splice(e,1);for(let e=ei.length-1;e>=0;e--)ei[e]&&"rect"===ei[e].kind&&ei.splice(e,1);er.push({kind:"rect",x0:e,y0:t,x1:a,y1:n,alpha:.28,colorKey:"accent"}),ei.length=0}}eg=null,eF(),eq(),ej(),eb(),eE()}}function eH(){eC();let t=window.devicePixelRatio||1,a=e.clientWidth,n=e.clientHeight,r=Math.max(1,Math.round(a*t)),i=Math.max(1,Math.round(n*t));(e.width!==r||e.height!==i||I.width!==r||I.height!==i||T.width!==r||T.height!==i)&&(e.width=r,e.height=i,I.width=r,I.height=i,T.width=r,T.height=i,eF(),ez(),eq(),ej(),eb())}ej(),eH(),M();let eV=new ResizeObserver(()=>eH());eV.observe(e),!function(){if(t.__cornersReady)return;t.__cornersReady=!0;let a=document.createElement("button");a.type="button",a.className="lia-resize-corner",a.dataset.corner="bl",a.setAttribute("aria-label","Resize drawing area (bottom left)");let n=document.createElement("button");n.type="button",n.className="lia-resize-corner",n.dataset.corner="br",n.setAttribute("aria-label","Resize drawing area (bottom right)"),t.appendChild(a),t.appendChild(n);let r=(e,t,a)=>Math.max(t,Math.min(a,e));function i(a,n){let i=!1,o=0,l=0,s=0,c=0;function d(e){if(i){i=!1;try{a.releasePointerCapture(e.pointerId)}catch(e){}eH(),eb()}}a.addEventListener("pointerdown",function(n){ev(),n.preventDefault(),n.stopPropagation(),i=!0,s=t.getBoundingClientRect().width,c=e.clientHeight||245,o=n.clientX,l=n.clientY;try{a.setPointerCapture(n.pointerId)}catch(e){}}),a.addEventListener("pointermove",function(a){if(!i)return;a.preventDefault();let d=a.clientX-o,u=a.clientY-l;e.style.height=r(c+u,130,9e3)+"px";let p=function(){let e=t.closest(".lia-canvas-mount")||t.parentElement||t,a=0;try{a=e.getBoundingClientRect().width}catch(e){}if((!a||a<200)&&document.querySelector("main"))try{a=document.querySelector("main").getBoundingClientRect().width}catch(e){}return Math.max(200,Math.floor(a||200))}();t.style.width=r("br"===n?s+d:s-d,200,p)+"px"}),a.addEventListener("pointerup",d),a.addEventListener("pointercancel",d)}i(n,"br"),i(a,"bl")}();let eW=()=>{(0,c.__liaRefreshAllTexPreviewBorders)(document),ej(),eF(),ez(),eq()};document.addEventListener("lia-canvas-theme",eW),h&&!h.__bound&&(h.__bound=!0,h.addEventListener("click",e=>{e.preventDefault(),e.stopPropagation(),er.length&&(ei.push(er.pop()),eF(),ez(),eq(),ej(),eb())})),f&&!f.__bound&&(f.__bound=!0,f.addEventListener("click",e=>{e.preventDefault(),e.stopPropagation(),ei.length&&(er.push(ei.pop()),eF(),ez(),eq(),ej(),eb())})),b&&!b.__bound&&(b.__bound=!0,b.addEventListener("click",e=>{e.stopPropagation(),eo="rect",el="rect",ey(!1),ej()})),g&&y&&g.addEventListener("click",e=>{e.stopPropagation(),eo="pen",el="pen";let t="1"===y.dataset.open,a="pen"===y.__mode;t&&a||e_(),ey(!t||!a),ej()}),m&&y&&m.addEventListener("click",e=>{e.stopPropagation(),eo="eraser",el="eraser";let t="1"===y.dataset.open,a="eraser"===y.__mode;t&&a||ek(),ey(!t||!a),ej()}),x&&y&&x.addEventListener("click",e=>{e.stopPropagation(),el="bg";let t="1"===y.dataset.open,a="bg"===y.__mode;t&&a||eS(),ey(!t||!a),ej()});let eU=e=>{t.contains(e.target)||ey(!1)},e$=e=>{"Escape"===e.key&&ey(!1)};document.addEventListener("click",eU),document.addEventListener("keydown",e$);let eX=!1,eY=e=>{"Space"===e.code&&(eX=!0)},eG=e=>{"Space"===e.code&&(eX=!1)};window.addEventListener("keydown",eY),window.addEventListener("keyup",eG);let eK=!1,eQ=null,eJ=t.closest(".lia-canvas-pair"),eZ=eJ?.parentElement||t.parentElement||document.body;function e0(e){return Math.max(z.minScale,Math.min(z.maxScale,e))}(eQ=new MutationObserver(()=>{t.isConnected||function(){if(!eK){for(let e of(eK=!0,eV.disconnect(),Z&&(cancelAnimationFrame(Z),Z=0),eL&&(cancelAnimationFrame(eL),eL=0),et&&(clearTimeout(et),et=0),q&&(clearTimeout(q),q=0),n))a.activePenPointers.delete(e);n.clear(),e1.clear(),document.removeEventListener("lia:canvas-i18n-update",C),document.removeEventListener("lia-canvas-theme",eW),document.removeEventListener("click",eU),document.removeEventListener("keydown",e$),window.removeEventListener("keydown",eY),window.removeEventListener("keyup",eG),eQ&&(eQ.disconnect(),eQ=null)}}()})).observe(eZ,{childList:!0}),e.addEventListener("contextmenu",e=>e.preventDefault()),e.addEventListener("wheel",t=>{ev(),t.preventDefault(),eC();let a=e.getBoundingClientRect();!function(e,t,a){let n=z.scale,r=e0(n*e);if(r===n)return;let i=eI(t,a);z.scale=r,z.panX=t-i.x*r,z.panY=a-i.y*r,eF(),ez(),eq(),eb()}(Math.exp(-(.0012*t.deltaY)),t.clientX-a.left,t.clientY-a.top)},{passive:!1});let e1=new Map,e2="idle",e5=0,e8=0,e4=null;function e6(t){let a=e.getBoundingClientRect();return{sx:t.clientX-a.left,sy:t.clientY-a.top}}function e9(e,t){return Math.hypot(e.sx-t.sx,e.sy-t.sy)}function e3(e,t){return{sx:(e.sx+t.sx)/2,sy:(e.sy+t.sy)/2}}function e7(t){"pen"===String(t.pointerType||"").toLowerCase()&&(n.delete(t.pointerId),a.activePenPointers.delete(t.pointerId)),eC(),e1.has(t.pointerId)&&e1.delete(t.pointerId);try{e.releasePointerCapture(t.pointerId)}catch(e){}if("pinch"===e2){e1.size<2&&(e4=null,e2="idle");return}if("pan"===e2){e2="idle",e.style.cursor="crosshair";return}if("rect"===e2){0===e1.size&&(eD(!0),e2="idle");return}if("draw"===e2){ef=null,e2="idle",ej(),eb();return}}e.addEventListener("pointerdown",t=>{let r,i;if("pen"===String(t.pointerType||"").toLowerCase()&&(n.add(t.pointerId),a.activePenPointers.add(t.pointerId)),"touch"===String(t.pointerType||"").toLowerCase()&&a.activePenPointers.size>0){t.cancelable&&t.preventDefault(),t.stopPropagation();return}if(ev(),t.target?.classList?.contains("lia-resize-corner"))return;let o=e6(t);if(e1.set(t.pointerId,o),e.setPointerCapture(t.pointerId),2===e1.size){eC(),"draw"===e2&&(ef=null),"rect"===e2&&eD(!1);let e=Array.from(e1.values()),t=e3(e[0],e[1]);e4={dist:Math.max(1e-6,e9(e[0],e[1])),worldMid:eI(t.sx,t.sy),startScale:z.scale},e2="pinch";return}let l="mouse"===t.pointerType&&2===t.button,s="mouse"===t.pointerType&&1===t.button;if(l||s||"mouse"===t.pointerType&&eX){eC(),e2="pan",e5=o.sx,e8=o.sy,e.style.cursor="grab";return}if("rect"===eo){let t;eC(),e2="rect",e.style.cursor="crosshair",eg={x0:(t=eI(o.sx,o.sy)).x,y0:t.y,x1:t.x,y1:t.y},eq();return}e2="draw",e.style.cursor="crosshair",r=eI(o.sx,o.sy),i={kind:"path",tool:eo,color:ex(),alpha:ed,width:"eraser"===eo?eu:ec,points:[{x:r.x,y:r.y}]},er.push(i),ef=i,ei.length=0,eT(P),eO(P,i),P.beginPath(),P.moveTo(r.x,r.y),ej(),eb(),"eraser"===eo?eA(o.sx,o.sy):eC()}),e.addEventListener("pointermove",e=>{if("pen"===String(e.pointerType||"").toLowerCase()&&(e.pressure>0||0!==e.buttons?(n.add(e.pointerId),a.activePenPointers.add(e.pointerId)):(n.delete(e.pointerId),a.activePenPointers.delete(e.pointerId))),"touch"===String(e.pointerType||"").toLowerCase()&&a.activePenPointers.size>0){e1.has(e.pointerId)&&e1.delete(e.pointerId),e.cancelable&&e.preventDefault(),e.stopPropagation();return}if(!e1.has(e.pointerId))return;let t=e6(e);if(e1.set(e.pointerId,t),"eraser"===eo&&"pan"!==e2&&"pinch"!==e2&&"rect"!==e2?eA(t.sx,t.sy):eC(),"pinch"===e2&&e1.size>=2&&e4){let e=Array.from(e1.values()).slice(0,2),t=e3(e[0],e[1]),a=Math.max(1e-6,e9(e[0],e[1])),n=e0(e4.startScale*(a/e4.dist));z.scale=n,z.panX=t.sx-e4.worldMid.x*n,z.panY=t.sy-e4.worldMid.y*n,eF(),ez(),eq(),eb();return}if("pan"===e2){let e=t.sx-e5,a=t.sy-e8;e5=t.sx,e8=t.sy,z.panX+=e,z.panY+=a,eF(),ez(),eq(),eb();return}if("rect"===e2)return void function(e,t){if(!eg)return;let a=eI(e,t);eg.x1=a.x,eg.y1=a.y,eq()}(t.sx,t.sy);if("draw"===e2){let a=!1;if("function"==typeof e.getCoalescedEvents){let t=e.getCoalescedEvents();if(Array.isArray(t)&&t.length){for(let e of t){if(!e)continue;let t=e6(e);eN(t.sx,t.sy)}a=!0}}a||eN(t.sx,t.sy)}}),e.addEventListener("pointerup",e7),e.addEventListener("pointercancel",e7),e.addEventListener("pointerleave",t=>{"pen"===String(t.pointerType||"").toLowerCase()&&(n.delete(t.pointerId),a.activePenPointers.delete(t.pointerId)),eC(),"draw"===e2&&(ef=null),"pinch"!==e2&&(e2="idle"),e.style.cursor="crosshair",ej(),eb()}),j=!0}(e)}),(0,c.__liaInitTexPreviews)()}},{"../index":"gFFiE","./theme":"3aqKC","./store":"8Sk5l","./freeze":"8S2RV","../lia/input":"3dckU","../lia/i18n":"lednP","@parcel/transformer-js/src/esmodule-helpers.js":"b0H7B"}],"3dckU":[function(e,t,a,n){var r=e("@parcel/transformer-js/src/esmodule-helpers.js");r.defineInteropFlag(a),r.export(a,"__liaRegisterCanvasTexField",()=>s),r.export(a,"__liaRefreshAllTexPreviewBorders",()=>d),r.export(a,"__liaApplyValue",()=>m),r.export(a,"__liaReadFieldValue",()=>b),r.export(a,"__liaAutoSizeTexWidgets",()=>x),r.export(a,"__liaFindAndSetInputBeforeNode",()=>S),r.export(a,"__liaInitTexPreviews",()=>M),r.export(a,"ensureTexSyncBoot",()=>C);var i=e("../index"),o=e("./i18n"),l=e("./tex-preview");function s(e){e&&(C(),e.dataset.liaCanvasTex="1")}function c(e){if(!e||!e.__liaTexPreviewBox)return;let t=e.__liaTexPreviewBox,a="";if(function(e){try{if(!e||!e.classList)return!1;if(e.classList.contains("is-success")||e.classList.contains("is-failure")||e.classList.contains("is-warning")||e.classList.contains("is-partial")||e.classList.contains("is-resolved")||e.getAttribute&&"true"===e.getAttribute("aria-invalid"))return!0}catch(e){}return!1}(e)){let t;try{let t=getComputedStyle(e);a=t.borderTopColor||t.borderColor||t.outlineColor||""}catch(e){}(t=String(a||"").trim().toLowerCase())&&"transparent"!==t&&"rgba(0, 0, 0, 0)"!==t&&"rgba(0,0,0,0)"!==t&&1||(a="")}t.style.getPropertyValue("--lia-tex-preview-border").trim()!==a&&(a?t.style.setProperty("--lia-tex-preview-border",a):t.style.removeProperty("--lia-tex-preview-border"))}function d(e){(e&&e.querySelectorAll?e:document).querySelectorAll(".lia-canvas-pair").forEach(e=>{let t=k(e);t&&c(t)})}function u(e){if(!e||!e.__liaTexPreviewBox)return;let t=b(e),a=document.activeElement===e;if(e.__liaTexPreviewLastValue===t&&e.__liaTexPreviewLastFocused===a)return;e.__liaTexPreviewLastValue=t,e.__liaTexPreviewLastFocused=a;let n=e.__liaTexPreviewBox,r=n.querySelector(".lia-tex-preview-math");r&&v(r,t),a?(n.dataset.on="0",n.style.display="none",e.style.display="",x(e)):w(e)}function p(e){(e&&e.querySelectorAll?e:document).querySelectorAll(".lia-canvas-pair").forEach(e=>{let t=k(e);t&&(_(t),c(t),t.__liaTexPreviewLastValue=null,t.__liaTexPreviewLastFocused=null,u(t),document.activeElement!==t&&w(t))})}let h=0,f=[0,0,0];function g(e){clearTimeout(h),h=setTimeout(()=>{p(document)},Math.max(0,e||0))}function m(e,t){let a=String(t);try{if(e&&e.getAttribute&&"true"===e.getAttribute("contenteditable"))return e.textContent=a,e.dispatchEvent(new Event("input",{bubbles:!0})),e.dispatchEvent(new Event("change",{bubbles:!0})),!0;if(e&&"value"in e)return e.value=a,e.dispatchEvent(new Event("input",{bubbles:!0})),e.dispatchEvent(new Event("change",{bubbles:!0})),!0}catch(e){}return!1}function b(e){try{if(!e)return"";if(e.getAttribute&&"true"===e.getAttribute("contenteditable"))return String(e.textContent||"");if("value"in e)return String(e.value||"")}catch(e){}return""}function x(e){if(!e)return;let t=e.__liaTexPreviewBox||null,a=t?t.querySelector(".lia-tex-preview-math"):null;requestAnimationFrame(function(){try{let r=140;if(t&&a&&"1"===t.dataset.on){let e=a.scrollWidth||a.getBoundingClientRect().width||0,n=t.querySelector(".lia-tex-preview-hint"),i=n&&n.getBoundingClientRect().width||0;r=e+i+32}else{let t=b(e);r=Math.max(140,9.92*t.length+28)}var n=r;let i=Math.max(80,Math.min(Math.ceil(n),function(e){try{let t=e&&e.parentElement?e.parentElement:null;if(!t)return 900;let a=t.getBoundingClientRect();if(!a||!a.width)return 900;return Math.max(80,Math.floor(a.width-8))}catch(e){}return 900}(t||e)));try{e.style.width=i+"px",e.style.maxWidth="100%",e.style.boxSizing="border-box"}catch(e){}if(t)try{t.style.width=i+"px",t.style.maxWidth="100%",t.style.boxSizing="border-box"}catch(e){}if(a)try{a.style.minWidth="0",a.style.maxWidth="100%"}catch(e){}}catch(e){}})}let y=null;function v(e,t){let a=String(t||"").trim();if(e.innerHTML="",!a)return!1;let n=(0,l.formatTexForPreview)(a),r=e.closest?e.closest(".lia-tex-preview"):null,o=r?r.previousElementSibling:null,s=(0,i.getRootWindow)(),c=window.katex||s.katex||null;function d(){o&&x(o)}try{if(c&&"function"==typeof c.render)return c.render(n,e,{throwOnError:!1,displayMode:!1}),d(),!0}catch(e){}return(function(){let e=(0,i.getRootWindow)(),t=[window.katex,e.katex,window.KaTeX,e.KaTeX];for(let e=0;e<t.length;e++){let a=t[e];if(a&&"function"==typeof a.render)return Promise.resolve(a)}return y||(y=(async()=>{let t=e.document||document;if(!t.getElementById("__lia_katex_css_v1")){let e=t.createElement("link");e.id="__lia_katex_css_v1",e.rel="stylesheet",e.href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css",(t.head||t.documentElement).appendChild(e)}let a=await Function("u","return import(u)")("https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.mjs"),n=a&&(a.default||a);if(!n||"function"!=typeof n.render)throw Error("KaTeX render not available.");try{e.katex||(e.katex=n)}catch(e){}try{window.katex||(window.katex=n)}catch(e){}return n})())})().then(t=>{if(e&&e.isConnected){e.innerHTML="";try{t.render(n,e,{throwOnError:!1,displayMode:!1})}catch(t){e.textContent=a}d()}}).catch(()=>{e&&e.isConnected&&(e.textContent=a,d())}),e.textContent=a,d(),!1}function w(e){if(!e||!e.__liaTexPreviewBox)return;let t=e.__liaTexPreviewBox,a=b(e).trim();if(!a){t.dataset.on="0",t.style.display="none",e.style.display="";return}let n=t.querySelector(".lia-tex-preview-math");n&&v(n,a),t.dataset.on="1",t.style.display="inline-flex",e.style.display="none",x(e)}function _(e){if(!e)return null;if(e.__liaTexPreviewReady)return e;if(e.__liaTexPreviewReady=!0,s(e),!e.__liaTexPreviewBorderObserver){let t=new MutationObserver(()=>{c(e),u(e)});t.observe(e,{attributes:!0,attributeFilter:["class","style","aria-invalid","value"],characterData:!0,childList:!0,subtree:!0}),e.__liaTexPreviewBorderObserver=t}c(e);let t=document.createElement("span"),a=(0,o.liaT)("canvas.edit","Edit");return t.className="lia-tex-preview",t.dataset.on="0",t.innerHTML=`
    <span class="lia-tex-preview-math"></span>
        <span class="lia-tex-preview-hint">${a}</span>
  `,t.addEventListener("click",t=>{t.preventDefault(),t.stopPropagation(),function(e){if(!e||!e.__liaTexPreviewBox)return;let t=document.body;if(t&&(t.classList.contains("lia-snapshot-mode")||t.classList.contains("lia-course-frozen")))return w(e);let a=e.__liaTexPreviewBox;a.dataset.on="0",a.style.display="none",e.style.display="",x(e);try{e.focus(),"function"==typeof e.select&&e.select()}catch(e){}}(e)}),e.insertAdjacentElement("afterend",t),e.__liaTexPreviewBox=t,e.addEventListener("input",()=>{u(e)}),e.addEventListener("change",()=>{u(e)}),e.addEventListener("focus",()=>{u(e)}),e.addEventListener("blur",()=>{setTimeout(()=>w(e),0)}),e.addEventListener("keydown",t=>{let a=e.tagName&&"TEXTAREA"===e.tagName.toUpperCase()||e.getAttribute&&"true"===e.getAttribute("contenteditable");if("Escape"===t.key){t.preventDefault(),w(e);return}"Enter"!==t.key||a||(t.preventDefault(),w(e))}),w(e),u(e),e}function k(e){try{if(!e||1!==e.nodeType)return null;function t(e){if(!e||1!==e.nodeType)return null;let t=e.querySelector&&e.querySelector('[contenteditable="true"]');if(t)return t;let a=e.querySelectorAll?e.querySelectorAll("input, textarea"):null;return a&&a.length?a[a.length-1]:null}let a=e.previousElementSibling;for(;a;){if(a.matches&&(a.matches("input, textarea")||"true"===a.getAttribute("contenteditable")))return a;let e=t(a);if(e)return e;a=a.previousElementSibling}let n=e;for(let e=0;e<10;e++){let e=n.parentElement;if(!e)break;let a=Array.from(e.children),r=a.indexOf(n);for(let e=r-1;e>=0;e--){let n=a[e];if(n.matches&&(n.matches("input, textarea")||"true"===n.getAttribute("contenteditable")))return n;let r=t(n);if(r)return r}n=e}}catch(e){}return null}function S(e,t){let a=k(e);return!!a&&!!m(a,t)&&(!function(e){function t(){let t=k(e);return!!t&&(_(t),w(t),!0)}if(t())return;let a=e.parentElement;if(!a)return;let n=new MutationObserver(()=>{t()&&n.disconnect()});n.observe(a,{childList:!0,subtree:!0}),setTimeout(()=>n.disconnect(),2e3)}(e),!0)}function M(){C(),document.querySelectorAll(".lia-canvas-pair").forEach(e=>{let t=k(e);t&&(_(t),c(t))})}function C(){if(window.__LIA_CANVAS_TEX_SYNC_BOOT__)return;window.__LIA_CANVAS_TEX_SYNC_BOOT__=!0;let e=()=>{[0,80,200].forEach((e,t)=>{clearTimeout(f[t]),f[t]=setTimeout(()=>{p(document)},e)})};try{window.addEventListener("lia:freeze-tex-refresh",e,!0)}catch(e){}try{document.addEventListener("lia:freeze-tex-refresh",e,!0)}catch(e){}document.addEventListener("focusout",e=>{let t=e.target;if(t){if(t.dataset&&"1"===t.dataset.liaCanvasTex)return void g(0);t.matches&&t.matches('input, textarea, [contenteditable="true"]')&&g(0)}},!0),document.addEventListener("change",e=>{let t=e.target;!t||t.matches&&t.matches('input, textarea, [contenteditable="true"]')&&g(0)},!0)}},{"../index":"gFFiE","./i18n":"lednP","./tex-preview":"cfifm","@parcel/transformer-js/src/esmodule-helpers.js":"b0H7B"}],cfifm:[function(e,t,a,n){var r=e("@parcel/transformer-js/src/esmodule-helpers.js");r.defineInteropFlag(a),r.export(a,"formatTexForPreview",()=>o);let i=/^([+-]?\d+)\s*\/\s*([+-]?\d+)$/u;function o(e){let t=String(e??"").trim(),a=i.exec(t);return a?`\\dfrac{${a[1]}}{${a[2]}}`:t}},{"@parcel/transformer-js/src/esmodule-helpers.js":"b0H7B"}]},["gFFiE"],"gFFiE","parcelRequirecca2",{});