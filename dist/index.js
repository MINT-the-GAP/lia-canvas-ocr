!function(e,t,a,n,r){var i="u">typeof globalThis?globalThis:"u">typeof self?self:"u">typeof window?window:"u">typeof global?global:{},l="function"==typeof i[n]&&i[n],o=l.i||{},s=l.cache||{},c="u">typeof module&&"function"==typeof module.require&&module.require.bind(module);function d(t,a){if(!s[t]){if(!e[t]){if(r[t])return r[t];var o="function"==typeof i[n]&&i[n];if(!a&&o)return o(t,!0);if(l)return l(t,!0);if(c&&"string"==typeof t)return c(t);var u=Error("Cannot find module '"+t+"'");throw u.code="MODULE_NOT_FOUND",u}h.resolve=function(a){var n=e[t][1][a];return null!=n?n:a},h.cache={};var p=s[t]=new d.Module(t);e[t][0].call(p.exports,h,p,p.exports,i)}return s[t].exports;function h(e){var t=h.resolve(e);if(!1===t)return{};if(Array.isArray(t)){var a={__esModule:!0};return t.forEach(function(e){var t=e[0],n=e[1],r=e[2]||e[0],i=d(n);"*"===t?Object.keys(i).forEach(function(e){"default"===e||"__esModule"===e||Object.prototype.hasOwnProperty.call(a,e)||Object.defineProperty(a,e,{enumerable:!0,get:function(){return i[e]}})}):"*"===r?Object.defineProperty(a,t,{enumerable:!0,value:i}):Object.defineProperty(a,t,{enumerable:!0,get:function(){return"default"===r?i.__esModule?i.default:i:i[r]}})}),a}return d(t)}}d.isParcelRequire=!0,d.Module=function(e){this.id=e,this.bundle=d,this.require=c,this.exports={}},d.modules=e,d.cache=s,d.parent=l,d.distDir=void 0,d.publicUrl=void 0,d.devServer=void 0,d.i=o,d.register=function(t,a){e[t]=[function(e,t){t.exports=a},{}]},Object.defineProperty(d,"root",{get:function(){return i[n]}}),i[n]=d;for(var u=0;u<t.length;u++)d(t[u]);if(a){var p=d(a);"object"==typeof exports&&"u">typeof module?module.exports=p:"function"==typeof define&&define.amd&&define(function(){return p})}}({bZBjE:[function(e,t,a,n){!function(){let e;function t(){let e=window;try{for(;e.parent&&e.parent!==e;)e=e.parent}catch(e){}return e}let a=t(),n="__LIA_CANVAS_OCR_REG_V1__";a[n]=a[n]||{inited:{}};let r=document.baseURI||location.href;if(a[n].inited[r])return;if(a[n].inited[r]=!0,window.__LIA_OCR_SHOW_BAR__=!1,!window.__LIA_OCR_BAR_BOOT__){function i(){try{let e=function(){try{let e=document.querySelector(".lia-btn");if(e){let t=getComputedStyle(e).backgroundColor;if(t&&"rgba(0, 0, 0, 0)"!==t&&"transparent"!==t)return t}let t=document.body||document.documentElement,a=document.createElement("button");a.className="lia-btn",a.type="button",a.textContent="x",a.style.position="absolute",a.style.left="-9999px",a.style.top="-9999px",a.style.visibility="hidden",t.appendChild(a);let n=getComputedStyle(a).backgroundColor;if(a.remove(),n&&"rgba(0, 0, 0, 0)"!==n&&"transparent"!==n)return n}catch(e){}return null}();e&&document.documentElement.style.setProperty("--canvas-accent",e)}catch(e){}}function l(){let e=!1!==window.__LIA_OCR_SHOW_BAR__;if(c(),window.__LIA_OCR_BAR__&&window.__LIA_OCR_BAR__.el&&window.__LIA_OCR_BAR__.el.isConnected){try{let t=window.__LIA_OCR_BAR__.el,a=document,n=a.body||a.documentElement;t.parentNode!==n&&n.appendChild(t),t.style.display=e?"":"none",t.setAttribute("aria-hidden",e?"false":"true");let r=window.__LIA_OCR_BAR__.loadEl;r&&r.parentNode!==n&&n.appendChild(r)}catch(e){}return window.__LIA_OCR_BAR__}let t=document,a=t.createElement("div");a.className="lia-ocrbar",e||(a.style.display="none",a.setAttribute("aria-hidden","true")),a.dataset.state="idle",a.dataset.open="0",a.innerHTML=`
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
    `;let n=t.body||t.documentElement;n.appendChild(a);let r=t.createElement("div");r.className="lia-ocr-loadwrap",r.dataset.on="0",r.dataset.indet="0",r.innerHTML=`
      <div class="lia-ocr-loadmsg">
        <span class="t">Schrifterkennungsmodul l\xe4dt noch\u{2026}</span>
        <span class="p">\u{2026}</span>
      </div>
      <div class="lia-ocr-loadtrack"><div class="lia-ocr-loadfill"></div></div>
      <div class="lia-ocr-loaddetail">Download von rund 900&nbsp;MB (nur beim ersten Mal, danach Cache).</div>
    `,n.appendChild(r);let i=r.querySelector(".lia-ocr-loadfill"),l=r.querySelector(".lia-ocr-loadmsg .t"),o=r.querySelector(".lia-ocr-loadmsg .p"),s=r.querySelector(".lia-ocr-loaddetail"),d={model:"Xenova/texify2",backend:"wasm",precision:"fp32",loaded:!1,phase:"idle",status:"idle",progress:null},u=a.querySelector(".lia-ocr-log"),p=a.querySelector(".lia-ocr-progress"),h=a.querySelector(".lia-ocr-progfill"),f=a.querySelector(".lia-ocr-progtxt"),g=a.querySelector('select[data-act="precision"]'),m=a.querySelector('select[data-act="model"]'),x="__LIA_TEX_OCR_PREC__",b="__LIA_TEX_OCR_MODEL__";try{let e=localStorage.getItem(b);e&&(d.model=String(e))}catch(e){}try{let e=localStorage.getItem(x);e&&(d.precision=String(e))}catch(e){}function y(e,t){let n=a.querySelector('[data-k="'+e+'"]');n&&(n.textContent=String(t))}function w(){if(a.dataset.state=String(d.status||"idle"),y("model",d.model||"—"),y("backend",d.backend||"—"),y("precision",d.precision||"—"),y("loaded",d.loaded?"yes":"no"),y("phase",d.phase||"—"),y("status",d.status||"idle"),null!==d.progress&&void 0!==d.progress&&isFinite(d.progress)){let e=Math.max(0,Math.min(1,Number(d.progress)));p.dataset.on="1",h.style.width=Math.round(100*e)+"%",f.textContent=Math.round(100*e)+"%"}else p.dataset.on="0";try{if(e){let e=Math.ceil(a.getBoundingClientRect().height||a.offsetHeight||0);document.documentElement.style.setProperty("--lia-ocrbar-h",(e||0)+"px"),document.documentElement.style.setProperty("--lia-ocrbar-gap","8px")}else document.documentElement.style.setProperty("--lia-ocrbar-h","0px"),document.documentElement.style.setProperty("--lia-ocrbar-gap","0px")}catch(e){}if(r&&i&&l&&o){let e=String(d.status||"idle"),t=String(d.phase||"idle");if(d.loaded||"loading"!==e&&"import"!==t&&"pipeline"!==t&&"download"!==t)r.dataset.on="0",r.dataset.indet="0",i.style.transform="translateX(0)",i.style.width="0%",o.textContent="";else if(r.dataset.on="1","download"===t?(l.textContent="Schrifterkennungsmodul lädt noch…",s&&(s.innerHTML="Dieser Download dauert nur beim ersten Mal so lange und ist danach im Cache.")):("import"===t?l.textContent="Schrifterkennungsmodul lädt noch… (Bibliothek wird geladen)":"pipeline"===t?l.textContent="Schrifterkennungsmodul lädt noch… (Modell wird initialisiert)":l.textContent="Schrifterkennungsmodul lädt noch…",s&&(s.textContent="Erster Start kann etwas dauern.")),null!==d.progress&&void 0!==d.progress&&isFinite(d.progress)){let e=Math.max(0,Math.min(1,Number(d.progress)));r.dataset.indet="0",i.style.transform="translateX(0)",i.style.width=Math.round(100*e)+"%",o.textContent=Math.round(100*e)+"%"}else r.dataset.indet="1",i.style.width="35%",o.textContent="…"}}function v(e){try{let t=new Date,a=String(t.getHours()).padStart(2,"0"),n=String(t.getMinutes()).padStart(2,"0"),r=String(t.getSeconds()).padStart(2,"0"),i="["+a+":"+n+":"+r+"] "+String(e),l=u.textContent?u.textContent.split("\n"):[];for(l.push(i);l.length>10;)l.shift();u.textContent=l.join("\n")}catch(e){}}function _(e){try{if(!e)return;for(let t in e)Object.prototype.hasOwnProperty.call(e,t)&&(d[t]=e[t]);w()}catch(e){}}return m&&(m.value=d.model),g&&(g.value=d.precision),a.addEventListener("click",e=>{let t=e.target&&e.target.closest?e.target.closest("button[data-act]"):null;if(!t)return;let n=t.getAttribute("data-act");if("toggle"===n){a.dataset.open="1"===a.dataset.open?"0":"1";return}if("copy"===n){let e=["LaTeX-OCR Status Report","Model: "+(d.model||""),"Backend: "+(d.backend||""),"Precision: "+(d.precision||""),"Loaded: "+(d.loaded?"yes":"no"),"Phase: "+(d.phase||""),"Status: "+(d.status||""),"Progress: "+(null===d.progress?"—":String(d.progress)),"\nLog:",u.textContent||""].join("\n");try{navigator.clipboard.writeText(e),v("Report copied to clipboard.")}catch(e){v("Copy failed (clipboard blocked).")}return}if("load"===n){window.__LIA_TEX_OCR__&&window.__LIA_TEX_OCR__.ensureLoaded&&window.__LIA_TEX_OCR__.ensureLoaded(!0);return}}),g&&g.addEventListener("change",()=>{let e=String(g.value||"fp32");try{localStorage.setItem(x,e)}catch(e){}_({precision:e}),window.__LIA_TEX_OCR__&&window.__LIA_TEX_OCR__.setPrecision&&window.__LIA_TEX_OCR__.setPrecision(e)}),m&&m.addEventListener("change",()=>{let e=String(m.value||d.model);try{localStorage.setItem(b,e)}catch(e){}_({model:e}),window.__LIA_TEX_OCR__&&window.__LIA_TEX_OCR__.setModel&&window.__LIA_TEX_OCR__.setModel(e)}),window.__LIA_OCR_BAR__={el:a,loadEl:r,set:_,log:v,get:()=>({...d})},w(),v("OCR-Bar ready."),window.__LIA_OCR_BAR__}async function o(){let e=function(){let e=window;try{for(;e.parent&&e.parent!==e;)e=e.parent}catch(e){}return e}();return e.__LIA_TFJS__&&e.__LIA_TFJS__.pipeline?e.__LIA_TFJS__:(e.__LIA_TFJS_IMPORT__=e.__LIA_TFJS_IMPORT__||(async()=>{let t=null;for(let a of["https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2/+esm","https://esm.sh/@xenova/transformers@2.17.2?bundle"])try{try{let e=window.__LIA_OCR_BAR__;e&&e.log&&e.log("Importing Transformers.js: "+a)}catch(e){}let t=await Function("u","return import(u)")(a),n=t.pipeline||t.default&&t.default.pipeline,r=t.env||t.default&&t.default.env;if(!n||!r)throw Error("Transformers.js ESM export missing (pipeline/env).");let i={pipeline:n,env:r,__url:a};return e.__LIA_TFJS__=i,i}catch(e){t=e;try{let t=window.__LIA_OCR_BAR__;t&&t.log&&t.log("Import failed: "+a+" — "+(e&&e.message?e.message:String(e)))}catch(e){}}throw t||Error("Failed to load Transformers.js from all CDN URLs.")})(),await e.__LIA_TFJS_IMPORT__)}window.__LIA_OCR_BAR_BOOT__=!0,l(),i(),setTimeout(i,0),function(){if(window.__LIA_TEX_OCR__)return window.__LIA_TEX_OCR__;let e=l(),t={model:e.get().model||"Xenova/trocr-small-handwritten",task:"image-to-text",precision:e.get().precision||"fp32",pipe:null,loading:null,setModel:async function(t){let a=String(t||this.model||"Xenova/texify2");return this.model=a,e.set({model:a,loaded:!1,status:"idle",phase:"idle",progress:null}),this.pipe=null,this.loading=null,this.ensureLoaded(!0)},setPrecision:async function(t){let a=String(t||"fp32");return this.precision=a,e.set({precision:a,loaded:!1,status:"idle",phase:"idle",progress:null}),this.pipe=null,this.loading=null,this.ensureLoaded(!0)},ensureLoaded:async function(t){if(this.pipe&&!t)return this.pipe;if(this.loading)return this.loading;let a=this.precision||"fp32",n={fp32:"fp32",fp16:"fp16",int8:"q8"}[a]||"fp32";return e.set({model:this.model,backend:"wasm",precision:a,status:"loading",phase:"import",loaded:!1,progress:0}),e.log("Loading model ("+a+") …"),this.loading=(async()=>{try{let t=await o(),r=t.pipeline,i=t.env;try{i.allowLocalModels=!1,i.allowRemoteModels=!0,i.useBrowserCache=!0,i.backends=i.backends||{},i.backends.onnx=i.backends.onnx||{},i.backends.onnx.wasm=i.backends.onnx.wasm||{}}catch(e){}e.set({phase:"pipeline"});let l=await r(this.task,this.model,{dtype:n,progress_callback:t=>{let a=function(e){try{if(null==e)return null;if("number"==typeof e&&isFinite(e))return Math.max(0,Math.min(1,e));let t=e&&"object"==typeof e?e:null;if(!t)return null;if(isFinite(t.progress))return Math.max(0,Math.min(1,Number(t.progress)));if(isFinite(t.loaded)&&isFinite(t.total)&&Number(t.total)>0)return Math.max(0,Math.min(1,Number(t.loaded)/Number(t.total)))}catch(e){}return null}(t);null!==a&&e.set({progress:a,phase:"download"})}});return this.pipe=l,e.set({status:"ready",phase:"ready",loaded:!0,progress:null}),e.log("Model loaded ("+a+")."),l}catch(t){throw e.set({status:"error",phase:"error",loaded:!1,progress:null}),e.log("Load failed: "+(t&&t.message?t.message:String(t))),t}finally{this.loading=null}})(),this.loading},recognize:async function(t,a){let n=!0===(a&&"object"==typeof a?a:{}).__silent,r=await this.ensureLoaded(!1);e.set({status:"working",phase:"infer",progress:null});let i=null;async function l(e){if(e&&"function"==typeof e.convertToBlob)return await e.convertToBlob({type:"image/png"});if(e&&"function"==typeof e.toBlob)return await new Promise((t,a)=>{e.toBlob(e=>e?t(e):a(Error("toBlob() returned null")),"image/png")});throw Error("Canvas-like has no toBlob/convertToBlob")}async function o(e){if("string"==typeof e)return{input:e,revoke:null};if(e&&"object"==typeof e&&"function"==typeof e.arrayBuffer&&"number"==typeof e.size&&"string"==typeof e.type){let t=URL.createObjectURL(e);return{input:t,revoke:()=>URL.revokeObjectURL(t)}}if(e&&"object"==typeof e&&"number"==typeof e.width&&"number"==typeof e.height&&e.data&&"number"==typeof e.data.length){let t=document.createElement("canvas");t.width=Math.max(1,Math.floor(e.width)),t.height=Math.max(1,Math.floor(e.height)),t.getContext("2d",{willReadFrequently:!0}).putImageData(e,0,0);let a=await l(t),n=URL.createObjectURL(a);return{input:n,revoke:()=>URL.revokeObjectURL(n)}}if(e&&"object"==typeof e){if("function"==typeof e.toDataURL)return{input:e.toDataURL("image/png"),revoke:null};if("function"==typeof e.toBlob||"function"==typeof e.convertToBlob){let t=await l(e),a=URL.createObjectURL(t);return{input:a,revoke:()=>URL.revokeObjectURL(a)}}}throw Error("Unsupported input type for OCR: "+(null===e?"null":typeof e))}try{let l=await o(t);i=l.revoke;let s=a&&"object"==typeof a?a:{},c="number"==typeof s.max_new_tokens&&isFinite(s.max_new_tokens)?Math.max(1,Math.floor(s.max_new_tokens)):96,d=await r(l.input,{max_new_tokens:c,do_sample:!0===s.do_sample,temperature:"number"==typeof s.temperature&&isFinite(s.temperature)?s.temperature:0}),u="";if("string"==typeof d)u=d;else if(Array.isArray(d)&&d.length){let e=d[0]||{};(u=e.generated_text||e.text||e.latex||"")||(u=JSON.stringify(e))}else d&&"object"==typeof d?(u=d.generated_text||d.text||d.latex||"")||(u=JSON.stringify(d)):u=String(d);return e.set({status:"ready",phase:"ready"}),n||e.log("Recognize done."),u}catch(t){throw e.set({status:"error",phase:"error"}),n||e.log("Recognize failed: "+(t&&t.message?t.message:String(t))),t}finally{try{i&&i()}catch(e){}}}};window.__LIA_TEX_OCR__=t}()}if(window.__liaDrawCanvasInit)return;function s(e){if(!e)return"";if(e.dataset&&e.dataset.uid)return e.dataset.uid;let t="c"+ ++window.__LIA_CANVAS_UID_COUNTER__;return e.dataset.uid=t,t}function c(){if(document.getElementById("__lia_canvas_ocr_css_v1"))return;let e=document.createElement("style");e.id="__lia_canvas_ocr_css_v1",e.textContent=`
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
  `,(document.head||document.documentElement).appendChild(e)}function d(e){try{if(!e)return"";if(e.getAttribute&&"true"===e.getAttribute("contenteditable"))return String(e.textContent||"");if("value"in e)return String(e.value||"")}catch(e){}return""}function u(e){if(!e)return;let t=e.__liaTexPreviewBox||null,a=t?t.querySelector(".lia-tex-preview-math"):null;function n(){try{let r=140;if(t&&a&&"1"===t.dataset.on){let e=a.scrollWidth||a.getBoundingClientRect().width||0,n=t.querySelector(".lia-tex-preview-hint"),i=n&&n.getBoundingClientRect().width||0;r=e+i+32}else{let t=d(e);r=Math.max(140,9.92*t.length+28)}var n=r;let i=Math.max(80,Math.min(Math.ceil(n),function(e){try{let t=e&&e.parentElement?e.parentElement:null;if(!t)return 900;let a=t.getBoundingClientRect();if(!a||!a.width)return 900;return Math.max(80,Math.floor(a.width-8))}catch(e){}return 900}(t||e)));try{e.style.width=i+"px",e.style.maxWidth="100%",e.style.boxSizing="border-box"}catch(e){}if(t)try{t.style.width=i+"px",t.style.maxWidth="100%",t.style.boxSizing="border-box"}catch(e){}if(a)try{a.style.minWidth="0",a.style.maxWidth="100%"}catch(e){}}catch(e){}}requestAnimationFrame(n),setTimeout(n,0),setTimeout(n,60)}window.__liaDrawCanvasInit=!0,window.__LIA_CANVAS_UID_COUNTER__=window.__LIA_CANVAS_UID_COUNTER__||0;var p=null;function h(e,a){let n=String(a||"").trim();if(e.innerHTML="",!n)return!1;let r=e.closest?e.closest(".lia-tex-preview"):null,i=r&&r.previousElementSibling||null,l=t(),o=window.katex||l.katex||null;function s(){i&&u(i)}try{if(o&&"function"==typeof o.render)return o.render(n,e,{throwOnError:!1,displayMode:!1}),s(),!0}catch(e){}return(function(){let e=t(),a=[window.katex,e.katex,window.KaTeX,e.KaTeX];for(let e=0;e<a.length;e++){let t=a[e];if(t&&"function"==typeof t.render)return Promise.resolve(t)}return p||(p=async function(){let t=e.document||document;if(!t.getElementById("__lia_katex_css_v1")){let e=t.createElement("link");e.id="__lia_katex_css_v1",e.rel="stylesheet",e.href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css",(t.head||t.documentElement).appendChild(e)}let a=await Function("u","return import(u)")("https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.mjs"),n=a&&(a.default||a);if(!n||"function"!=typeof n.render)throw Error("KaTeX render not available.");try{e.katex||(e.katex=n)}catch(e){}try{window.katex||(window.katex=n)}catch(e){}return n}())})().then(function(t){if(e&&e.isConnected){e.innerHTML="";try{t.render(n,e,{throwOnError:!1,displayMode:!1})}catch(t){e.textContent=n}s()}}).catch(function(){e&&e.isConnected&&(e.textContent=n,s())}),e.textContent=n,s(),!1}function f(e){if(!e||!e.__liaTexPreviewBox)return;let t=d(e).trim();if(!t){e.__liaTexPreviewBox.dataset.on="0",e.__liaTexPreviewBox.style.display="none",e.style.display="";return}h(e.__liaTexPreviewBox.querySelector(".lia-tex-preview-math"),t),e.__liaTexPreviewBox.dataset.on="1",e.__liaTexPreviewBox.style.display="inline-flex",e.style.display="none",u(e)}function g(e){if(!e)return null;if(e.__liaTexPreviewReady)return e;e.__liaTexPreviewReady=!0;let t=document.createElement("span");return t.className="lia-tex-preview",t.dataset.on="0",t.innerHTML=`
    <span class="lia-tex-preview-math"></span>
    <span class="lia-tex-preview-hint">Bearbeiten</span>
  `,t.addEventListener("click",function(t){t.preventDefault(),t.stopPropagation();if(e&&e.__liaTexPreviewBox){e.__liaTexPreviewBox.dataset.on="0",e.__liaTexPreviewBox.style.display="none",e.style.display="",u(e);try{e.focus(),"function"==typeof e.select&&e.select()}catch(e){}}}),e.insertAdjacentElement("afterend",t),e.__liaTexPreviewBox=t,e.addEventListener("input",function(){h(t.querySelector(".lia-tex-preview-math"),d(e))}),e.addEventListener("blur",function(){setTimeout(function(){f(e)},0)}),e.addEventListener("keydown",function(t){let a=e.tagName&&"TEXTAREA"===e.tagName.toUpperCase()||e.getAttribute&&"true"===e.getAttribute("contenteditable");if("Escape"===t.key){t.preventDefault(),f(e);return}"Enter"!==t.key||a||(t.preventDefault(),f(e))}),f(e),u(e),e}function m(e){try{if(!e||1!==e.nodeType)return null;function t(e){if(!e||1!==e.nodeType)return null;let t=e.querySelector&&e.querySelector('[contenteditable="true"]');if(t)return t;let a=e.querySelectorAll?e.querySelectorAll("input, textarea"):null;return a&&a.length?a[a.length-1]:null}let a=e.previousElementSibling;for(;a;){if(a.matches&&(a.matches("input, textarea")||"true"===a.getAttribute("contenteditable")))return a;let e=t(a);if(e)return e;a=a.previousElementSibling}let n=e;for(let e=0;e<10;e++){let e=n.parentElement;if(!e)break;let a=Array.from(e.children),r=a.indexOf(n);for(let e=r-1;e>=0;e--){let n=a[e];if(n.matches&&(n.matches("input, textarea")||"true"===n.getAttribute("contenteditable")))return n;let r=t(n);if(r)return r}n=e}}catch(e){}return null}function x(e){let t=String(e||""),a=t.indexOf("("),n=t.indexOf(")");if(a<0||n<0)return null;let r=t.slice(a+1,n).split(",").map(e=>Number(String(e).trim()));return!(r.length<3)&&isFinite(r[0])&&isFinite(r[1])&&isFinite(r[2])?[r[0],r[1],r[2]]:null}function b(e){try{let t=e||document,a=t.body||t.documentElement,n=t.querySelector(".lia-btn");if(n){let e=getComputedStyle(n).backgroundColor;if(e&&"rgba(0, 0, 0, 0)"!==e&&"transparent"!==e)return e}let r=t.createElement("button");r.className="lia-btn",r.type="button",r.textContent="x",r.style.position="absolute",r.style.left="-9999px",r.style.top="-9999px",r.style.visibility="hidden",a.appendChild(r);let i=getComputedStyle(r).backgroundColor;if(r.remove(),i&&"rgba(0, 0, 0, 0)"!==i&&"transparent"!==i)return i}catch(e){}return null}function y(){c();try{let e=window.parent&&window.parent.document?window.parent.document:document,t=document.documentElement,a=getComputedStyle(e.body||e.documentElement).backgroundColor||getComputedStyle(e.documentElement).backgroundColor,n=x(a),r=n&&.5>function(e){let[t,a,n]=e.map(e=>e/255).map(e=>e<=.03928?e/12.92:Math.pow((e+.055)/1.055,2.4));return .2126*t+.7152*a+.0722*n}(n)?"#fff":"#000";t.style.setProperty("--canvas-border",r),t.style.setProperty("--canvas-pen",r);let i=b(e)||b(document);i&&t.style.setProperty("--canvas-accent",i),document.dispatchEvent(new Event("lia-canvas-theme"))}catch(e){}}y(),new MutationObserver(()=>y()).observe(document.documentElement,{attributes:!0,attributeFilter:["class","style"]}),window.addEventListener("resize",()=>y()),window.__LIA_CANVAS_STORE__=window.__LIA_CANVAS_STORE__||{};let w=[{key:"auto",value:null},{key:"red",value:"#ff0000"},{key:"orange",value:"#ff7500"},{key:"yellow",value:"#ffff00"},{key:"violett",value:"#ff00ff"},{key:"blue",value:"#0055ff"},{key:"lightblue",value:"#00ffff"},{key:"green",value:"#00ff00"},{key:"darkgreen",value:"#007500"},{key:"black",value:"#000000"},{key:"white",value:"#ffffff"}];function v(){return getComputedStyle(document.documentElement).getPropertyValue("--canvas-pen").trim()||"#000"}function _(){return getComputedStyle(document.documentElement).getPropertyValue("--canvas-accent").trim()||getComputedStyle(document.documentElement).getPropertyValue("--canvas-border").trim()||"#000"}function k(e,t){!e||e.__hasIcon||(e.__hasIcon=!0,e.innerHTML=t)}function M(e,t){let a=x(e);if(a)return`rgba(${a[0]},${a[1]},${a[2]},${t})`;if(String(e).startsWith("#")){let a=String(e).slice(1),n=3===a.length?a[0]+a[0]+a[1]+a[1]+a[2]+a[2]:a,r=parseInt(n.slice(0,2),16),i=parseInt(n.slice(2,4),16),l=parseInt(n.slice(4,6),16);return`rgba(${r},${i},${l},${t})`}return`rgba(0,0,0,${t})`}function S(e,t){let a=Number(e);return isFinite(a)?a:t||0}function C(e,t,a){return Math.max(t,Math.min(a,e))}function E(e){return Math.round(100*S(e,0))/100}function A(e,t){let a=S(t,0);if(!(a>0))return 0;let n=S(e,0)%a;return n<0?n+a:n}function R(e){let t=e&&"object"==typeof e?e:{};return{panX:S(t.panX,0),panY:S(t.panY,0),scale:S(t.scale,1)||1,minScale:S(t.minScale,.25),maxScale:S(t.maxScale,8)}}function L(e,t){let a=S(e&&e.x,0),n=S(e&&e.y,0),r=S(t&&t.scale,1)||1;return{x:a*r+S(t&&t.panX,0),y:n*r+S(t&&t.panY,0)}}function T(e,t,a){if(!e)return null;let n=Math.max(0,S(e.x,0)),r=Math.max(0,S(e.y,0)),i=Math.min(S(t,0),S(e.x,0)+S(e.w,0)),l=Math.min(S(a,0),S(e.y,0)+S(e.h,0));return i<=n||l<=r?null:{x:n,y:r,w:i-n,h:l-r}}function I(e){return e&&e.querySelector?e.querySelector(".lia-canvas-mount"):null}function O(e){let t=I(e);return t?s(t):""}function P(e){let t=window.__LIA_CANVAS_STORE__||{};return e&&t[e]?t[e]:null}function q(e){return Array.from((e&&e.querySelectorAll?e:document).querySelectorAll(".lia-canvas-pair")).filter(function(e){return!!I(e)})}function z(e,t){let a=Array.isArray(t)?t:[];for(let t=0;t<a.length;t++){let n=a[t];if(!n)continue;if("r"===n.k){e.save(),e.globalCompositeOperation="source-over",e.globalAlpha=1,e.fillStyle=String(n.f||"rgba(0,0,0,0.15)"),e.fillRect(S(n.x,0),S(n.y,0),Math.max(0,S(n.w,0)),Math.max(0,S(n.h,0))),e.restore();continue}let r=Array.isArray(n.p)?n.p:[];if(r.length){e.save(),e.beginPath(),e.moveTo(S(r[0][0],0),S(r[0][1],0));for(let t=1;t<r.length;t++)e.lineTo(S(r[t][0],0),S(r[t][1],0));e.lineCap="round",e.lineJoin="round",e.lineWidth=Math.max(.75,S(n.w,1)),"e"===n.k?(e.globalCompositeOperation="destination-out",e.globalAlpha=1,e.strokeStyle="rgba(0,0,0,1)"):(e.globalCompositeOperation="source-over",e.globalAlpha=C(S(n.a,1),0,1),e.strokeStyle=String(n.c||"#000")),e.stroke(),e.restore()}}}function B(e,t){let a,n,r;if(!e||!t)return null;let i=function(e){let t=e&&"object"==typeof e?e:{},a=Array.isArray(t.ITEMS)?t.ITEMS:[],n=R(t.VIEW||{}),r=Math.max(1,Math.round(S(t.wrapW,0))),i=Math.max(1,Math.round(S(t.canvasH,0))),l=M(_(),.28),o=[];for(let e=0;e<a.length;e++){let t=a[e];if(t&&"object"==typeof t){if("path"===t.kind){let e=Array.isArray(t.points)?t.points:[];if(!e.length)continue;let a=e.map(function(e){let t=L(e,n);return{x:t.x,y:t.y}}),l=Math.max(.75,S(t.width,1)*S(n.scale,1));if(!T(function(e,t){let a=Array.isArray(e)?e:[];if(!a.length)return null;let n=1/0,r=1/0,i=-1/0,l=-1/0;for(let e=0;e<a.length;e++){let t=a[e],o=S(t&&t.x,0),s=S(t&&t.y,0);o<n&&(n=o),s<r&&(r=s),o>i&&(i=o),s>l&&(l=s)}let o=Math.max(0,S(t,0));return{x:n-o,y:r-o,w:Math.max(0,i-n+2*o),h:Math.max(0,l-r+2*o)}}(a,l/2+2),r,i))continue;o.push({k:"eraser"===t.tool?"e":"p",c:String(t.color||v()),a:C(S(t.alpha,1),0,1),w:E(l),p:a.map(function(e){return[E(e.x),E(e.y)]})});continue}if("rect"===t.kind){let e=L({x:t.x0,y:t.y0},n),a=L({x:t.x1,y:t.y1},n),s=function(e,t,a,n){let r=Math.min(S(e,0),S(a,0)),i=Math.min(S(t,0),S(n,0));return{x:r,y:i,w:Math.max(0,Math.max(S(e,0),S(a,0))-r),h:Math.max(0,Math.max(S(t,0),S(n,0))-i)}}(e.x,e.y,a.x,a.y);if(!T(s,r,i))continue;let c=C(S(t.alpha,.28),0,1),d=t.color?M(t.color,c):M(_(),c);o.push({k:"r",f:d||l,x:E(s.x),y:E(s.y),w:E(s.w),h:E(s.h)});continue}}}return{vw:r,vh:i,items:o}}(t),l=Math.max(1,0|i.vw),o=Math.max(1,0|i.vh),s=Array.isArray(i.items)?i.items:[],c=document.createElement("canvas");c.width=l,c.height=o;let d=c.getContext("2d",{willReadFrequently:!0});d.clearRect(0,0,l,o),z(d,s);let u=function(e){if(!e)return null;let t=e.getContext("2d",{willReadFrequently:!0}),a=0|e.width,n=0|e.height;if(!(a>0&&n>0))return null;let r=t.getImageData(0,0,a,n).data,i=a,l=n,o=-1,s=-1;for(let e=0;e<n;e++){let t=e*a*4;for(let n=0;n<a;n++)!(r[t+4*n+3]<=10)&&(n<i&&(i=n),e<l&&(l=e),n>o&&(o=n),e>s&&(s=e))}if(o<0)return null;let c=Math.max(0,Math.round(S(8,0)));return{x:i=Math.max(0,i-c),y:l=Math.max(0,l-c),w:Math.max(1,(o=Math.min(a-1,o+c))-i+1),h:Math.max(1,(s=Math.min(n-1,s+c))-l+1)}}(c);return u?{v:"cvf1",u:String(e),w:u.w,h:u.h,bg:function(e,t){let a=e&&"object"==typeof e?e:{},n=R(a.VIEW||{}),r=String(a.bgMode||"none");if("grid"!==r&&"lined"!==r)return{m:"none"};let i=Math.max(1,S(a.bgStep,24))*Math.max(1e-4,S(n.scale,1));if(!(i>0))return{m:"none"};let l=S(t&&t.x,0),o=S(t&&t.y,0);return{m:r,s:E(i),ox:E(A(S(n.panX,0)-l,i)),oy:E(A(S(n.panY,0)-o,i)),c:M(_(),.65),lw:1.125}}(t,u),it:(a=Array.isArray(s)?s:[],n=S(u&&u.x,0),r=S(u&&u.y,0),a.map(function(e){return e?"r"===e.k?{k:"r",f:String(e.f||""),x:E(S(e.x,0)-n),y:E(S(e.y,0)-r),w:E(S(e.w,0)),h:E(S(e.h,0))}:{k:"e"===e.k?"e":"p",c:String(e.c||""),a:C(S(e.a,1),0,1),w:E(S(e.w,1)),p:(Array.isArray(e.p)?e.p:[]).map(function(e){return[E(S(e&&e[0],0)-n),E(S(e&&e[1],0)-r)]})}:null}).filter(Boolean))}:{v:"cvf1",u:String(e),e:1,w:0,h:0,bg:{m:"none"},it:[]}}function F(e){let t=O(e);if(!t)return null;let a=P(t);return a?B(t,a):null}function N(e){return!!(e&&1!==e.e&&S(e.w,0)>0&&S(e.h,0)>0&&Array.isArray(e.it)&&e.it.length)}function X(e,t){if(!e||!t)return null;let a=Math.max(1,Math.round(S(t.w,1))),n=Math.max(1,Math.round(S(t.h,1))),r=window.devicePixelRatio||1;e.width=Math.max(1,Math.round(a*r)),e.height=Math.max(1,Math.round(n*r)),e.style.width=a+"px",e.style.height=n+"px";let i=e.getContext("2d",{willReadFrequently:!0});return i.setTransform(r,0,0,r,0,0),i.clearRect(0,0,a,n),!function(e,t,a,n){let r=t&&"object"==typeof t?t:{},i=String(r.m||"none");if("grid"!==i&&"lined"!==i)return;let l=Math.max(1,S(r.s,1)),o=A(S(r.ox,0),l),s=A(S(r.oy,0),l),c=String(r.c||M(_(),.65)),d=Math.max(.5,S(r.lw,1.125));if(e.save(),e.globalCompositeOperation="source-over",e.globalAlpha=1,e.strokeStyle=c,e.lineWidth=d,"grid"===i){e.beginPath();for(let t=o;t<=a;t+=l)e.moveTo(t,0),e.lineTo(t,n);for(let t=s;t<=n;t+=l)e.moveTo(0,t),e.lineTo(a,t);e.stroke(),e.restore();return}if("lined"===i){e.beginPath();for(let t=s;t<=n;t+=l)e.moveTo(0,t),e.lineTo(a,t);e.stroke(),e.restore()}}(i,t.bg||{m:"none"},a,n),z(i,Array.isArray(t.it)?t.it:[]),e}function j(e,t){if(!e||!(e instanceof Element)||!t)return null;if(e.dataset.open="1",e.innerHTML="",!N(t)){let t=document.createElement("span");return t.className="lia-canvas-freeze-empty",t.textContent="Keine sichtbaren Canvas-Inhalte eingefroren.",e.appendChild(t),t}let a=document.createElement("span");a.className="lia-draw-block";let n=document.createElement("span");n.className="lia-draw-wrap";let r=document.createElement("canvas");return r.className="lia-canvas-freeze-preview",r.setAttribute("aria-label","Eingefrorene Zeichenfläche"),n.appendChild(r),a.appendChild(n),e.appendChild(a),X(r,t),r}function H(){document.querySelectorAll(".lia-draw-wrap canvas.lia-draw:not([data-ready])").forEach(e=>{e.setAttribute("data-ready","1"),function(e){let t=e.closest(".lia-draw-wrap");if(!t)return;let n=s(t.closest(".lia-canvas-mount")),r=t.querySelector(".lia-undo-btn"),i=t.querySelector(".lia-redo-btn"),l=t.querySelector(".lia-color-btn"),o=t.querySelector(".lia-eraser-btn"),c=t.querySelector(".lia-rect-btn"),d=t.querySelector(".lia-bgmenu-btn"),u=t.querySelector(".lia-tool-menu"),p=document.createElement("button");p.type="button",p.className="lia-rect-action",p.textContent="Als Lösung übergeben",p.style.display="none",t.appendChild(p);let h=document.createElement("div");h.className="lia-rect-progress",h.dataset.on="0",h.innerHTML=`
    <div class="lia-rect-progbar"><div class="lia-rect-progfill"></div></div>
    <div class="lia-rect-progtxt">0%</div>
  `,t.appendChild(h);let x=h.querySelector(".lia-rect-progfill"),b=h.querySelector(".lia-rect-progtxt");h.addEventListener("pointerdown",e=>{e.preventDefault(),e.stopPropagation()}),p.addEventListener("pointerdown",e=>{e.preventDefault(),e.stopPropagation()});let y=document.createElement("button");y.type="button",y.className="lia-rect-close",y.setAttribute("aria-label","Marker-Rechteck entfernen"),y.style.display="none",y.innerHTML=`
    <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 7L17 17M17 7L7 17"
        fill="none"
        stroke="currentColor"
        stroke-width="2.4"
        stroke-linecap="round"/>
    </svg>
  `,t.appendChild(y);let S=document.createElement("span");S.className="lia-eraser-ring",S.dataset.on="0",t.appendChild(S),y.addEventListener("pointerdown",e=>{e.preventDefault(),e.stopPropagation()}),y.addEventListener("click",e=>{e.preventDefault(),e.stopPropagation(),function(){let e=!1;for(let t=J.length-1;t>=0;t--)J[t]&&"rect"===J[t].kind&&(J.splice(t,1),e=!0);for(let t=K.length-1;t>=0;t--)K[t]&&"rect"===K[t].kind&&(K.splice(t,1),e=!0);e&&(eM(),eC(),eE(),es()),eb()}()}),k(r,`
      <svg viewBox="-4 0 24 24" aria-hidden="true">
        <path d="M21 8H10.2V4L2 12l8.2 8v-4H21V8z" fill="var(--canvas-border)"/>
        <rect x="10.2" y="10.6" width="10.8" height="2.8" rx="1.4" fill="var(--canvas-border)"/>
      </svg>
    `),k(i,`
      <svg viewBox="-4 0 24 24" aria-hidden="true">
        <path d="M3 8h10.8V4l8.2 8-8.2 8v-4H3V8z" fill="var(--canvas-border)"/>
        <rect x="3" y="10.6" width="10.8" height="2.8" rx="1.4" fill="var(--canvas-border)"/>
      </svg>
    `),k(o,`
      <svg viewBox="-4 4 24 24" aria-hidden="true">
        <path class="ico-stroke" d="M4 16.5l8.6-8.6a2 2 0 0 1 2.8 0l4.1 4.1a2 2 0 0 1 0 2.8L12.8 23H7.6L4 19.4a2 2 0 0 1 0-2.9z"
              fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path class="ico-stroke" d="M8 23h8" fill="none" stroke-width="2" stroke-linecap="round"/>
        <path class="ico-stroke" d="M9.2 14.3l6.5 6.5" fill="none" stroke-width="2" stroke-linecap="round"/>
      </svg>
    `),k(c,`
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

          //  "Zieh-Plus" direkt an der rechten unteren Ecke (\xfcberdeckt/unterbricht optisch die Ecke) 
            <path class="ico-stroke" stroke-width="1.4" stroke-linecap="round"
              d="M19.4 19.0H24.0 M21.7 16.7V21.3"/>
      </svg>
    `),d&&!d.__bgCleared&&(d.__bgCleared=!0,d.innerHTML="");let C=e.getContext("2d",{willReadFrequently:!0}),E=document.createElement("canvas"),A=E.getContext("2d",{willReadFrequently:!0}),R=document.createElement("canvas"),L=R.getContext("2d",{willReadFrequently:!0}),T=window.__LIA_CANVAS_STORE__,I=n&&T[n]?T[n]:null,O=I&&I.VIEW?{...I.VIEW}:{panX:0,panY:0,scale:1,minScale:.25,maxScale:8},P=0,q=!1;function z(e){try{let t=window.__LIA_OCR_BAR__;t&&t.log&&t.log(e)}catch(e){}}function B(e){let t=String(e||""),a="",n=!1;for(let e=0;e<t.length;e++){let r=t[e];" "===r||"\n"===r||"\r"===r||"	"===r||"\f"===r?(n||(a+=" "),n=!0):(a+=r,n=!1)}return a.trim()}function F(e){let t=String(e||"").trim();return t.startsWith("$$")&&t.endsWith("$$")&&(t=t.slice(2,-2).trim()),t.startsWith("$")&&t.endsWith("$")&&(t=t.slice(1,-1).trim()),t.startsWith("\\[")&&t.endsWith("\\]")&&(t=t.slice(2,-2).trim()),B(t)}function N(e){let t=String(e||"").trim(),a="\\mathrm{";if(t.startsWith(a)&&t.endsWith("}")){t=t.slice(a.length,-1);let e="";for(let a=0;a<t.length;a++){let n=t[a];"~"!==n&&(e+=n)}return e.trim()}return t}function X(e){let t=Math.max(e.width,e.height),a=1;if(t<420&&(a=420/t),t>1400&&(a=1400/t),.06>Math.abs((a=ef(a,.5,4))-1))return e;let n=document.createElement("canvas");n.width=Math.max(1,Math.round(e.width*a)),n.height=Math.max(1,Math.round(e.height*a));let r=n.getContext("2d",{willReadFrequently:!0});return r.fillStyle="#fff",r.fillRect(0,0,n.width,n.height),r.drawImage(e,0,0,n.width,n.height),n}function j(e){let t=document.createElement("canvas");t.width=Math.max(1,0|e.width),t.height=Math.max(1,0|e.height);let a=t.getContext("2d",{willReadFrequently:!0});a.fillStyle="#fff",a.fillRect(0,0,t.width,t.height),a.drawImage(e,0,0);let n=a.getImageData(0,0,t.width,t.height).data,r=t.width,i=t.height,l=new Uint8Array(r*i);for(let e=0,t=0;t<l.length;t++,e+=4){let a=.299*n[e]+.587*n[e+1]+.114*n[e+2];l[t]=+(a<200)}let o=l;for(let e=0;e<0;e++)o=function(e){let t=new Uint8Array(r*i);for(let a=1;a<i-1;a++)for(let n=1;n<r-1;n++){let i=0,l=a*r+n;for(let t=-1;t<=1;t++)for(let a=-1;a<=1;a++)if(e[l+t*r+a]){i=1,t=2;break}t[l]=i}return t}(o);let s=r,c=i,d=-1,u=-1;for(let e=0;e<i;e++)for(let t=0;t<r;t++)o[e*r+t]&&(t<s&&(s=t),e<c&&(c=e),t>d&&(d=t),e>u&&(u=e));if(d<0)return t;s=Math.max(0,s-18),c=Math.max(0,c-18);let p=Math.max(1,(d=Math.min(r-1,d+18))-s+1),h=Math.max(1,(u=Math.min(i-1,u+18))-c+1),f=document.createElement("canvas");f.width=p,f.height=h;let g=f.getContext("2d",{willReadFrequently:!0}),m=g.createImageData(p,h),x=m.data;for(let e=0;e<h;e++)for(let t=0;t<p;t++){let a=255*!o[(c+e)*r+(s+t)],n=(e*p+t)*4;x[n]=a,x[n+1]=a,x[n+2]=a,x[n+3]=255}g.putImageData(m,0,0);let b=512/Math.max(p,h);b<.75&&(b=.75),b>3.5&&(b=3.5);let y=document.createElement("canvas");y.width=Math.max(1,Math.round(p*b)),y.height=Math.max(1,Math.round(h*b));let w=y.getContext("2d",{willReadFrequently:!0});return w.fillStyle="#fff",w.fillRect(0,0,y.width,y.height),w.imageSmoothingEnabled=!0,w.drawImage(f,0,0,y.width,y.height),y}function H(e){let t=String(e||"").trim();if(!t||-1!==t.indexOf("\\"))return null;let a={O:"0",o:"0",Q:"0",D:"0",I:"1",l:"1","|":"1","!":"1",Z:"2",z:"2",S:"5",s:"5",B:"8",g:"9",q:"9"},n="";for(let e=0;e<t.length;e++){let r=t[e],i=t.charCodeAt(e);if(i>=48&&i<=57){n+=r;continue}if(" "!==r&&"\n"!==r&&"\r"!==r&&"	"!==r&&"$"!==r&&"{"!==r&&"}"!==r&&"("!==r&&")"!==r&&"["!==r&&"]"!==r&&","!==r&&"."!==r&&":"!==r&&";"!==r&&"_"!==r&&"-"!==r){if(a[r]){n+=a[r];continue}return null}}return(n=String(n).trim())&&!(n.length>3)?n:null}function W(e,t){let a=t*Math.PI/180,n=0|e.width,r=0|e.height,i=document.createElement("canvas");i.width=Math.max(1,n),i.height=Math.max(1,r);let l=i.getContext("2d",{willReadFrequently:!0});return l.fillStyle="#fff",l.fillRect(0,0,i.width,i.height),l.translate(i.width/2,i.height/2),l.rotate(a),l.translate(-n/2,-r/2),l.imageSmoothingEnabled=!1,l.drawImage(e,0,0),i}function D(e,t){let a=+(1===(t&&"object"==typeof t?t:{}).dilate),n=document.createElement("canvas");n.width=Math.max(1,0|e.width),n.height=Math.max(1,0|e.height);let r=n.getContext("2d",{willReadFrequently:!0});r.fillStyle="#fff",r.fillRect(0,0,n.width,n.height),r.drawImage(e,0,0);let i=r.getImageData(0,0,n.width,n.height).data,l=n.width,o=n.height,s=new Uint8Array(l*o);for(let e=0,t=0;t<s.length;t++,e+=4){let a=.299*i[e]+.587*i[e+1]+.114*i[e+2];s[t]=+(a<225)}1===a&&(s=function(e){let t=new Uint8Array(l*o);for(let a=1;a<o-1;a++)for(let n=1;n<l-1;n++){let r=a*l+n,i=0;for(let t=-1;t<=1;t++)for(let a=-1;a<=1;a++)if(e[r+t*l+a]){i=1,t=2;break}t[r]=i}return t}(s));let c=l,d=o,u=-1,p=-1;for(let e=0;e<o;e++)for(let t=0;t<l;t++)s[e*l+t]&&(t<c&&(c=t),e<d&&(d=e),t>u&&(u=t),e>p&&(p=e));if(u<0)return j(e);let h=Math.max(1,u-c+1),f=Math.max(1,p-d+1),g=Math.max(24,Math.floor(.35*Math.max(h,f))),m=Math.max(64,Math.min(1024,Math.max(h,f)+2*g)),x=document.createElement("canvas");x.width=m,x.height=m;let b=x.getContext("2d",{willReadFrequently:!0}),y=b.createImageData(m,m),w=y.data;for(let e=0;e<w.length;e+=4)w[e]=255,w[e+1]=255,w[e+2]=255,w[e+3]=255;let v=Math.floor((m-h)/2),_=Math.floor((m-f)/2);for(let e=0;e<f;e++)for(let t=0;t<h;t++){let a=255*!s[(d+e)*l+(c+t)],n=((_+e)*m+(v+t))*4;w[n]=a,w[n+1]=a,w[n+2]=a,w[n+3]=255}b.putImageData(y,0,0);let k=document.createElement("canvas");k.width=512,k.height=512;let M=k.getContext("2d",{willReadFrequently:!0});return M.fillStyle="#fff",M.fillRect(0,0,512,512),M.imageSmoothingEnabled=!1,M.drawImage(x,0,0,512,512),k}async function $(e,t){let a=[],n=D(t,{dilate:0}),r=D(t,{dilate:1}),i=[0,-6,6];for(let e=0;e<i.length;e++)a.push(W(n,i[e]));for(let e=0;e<i.length;e++)a.push(W(r,i[e]));let l={},o=[];for(let t=0;t<a.length;t++){let n="";try{n=await e.recognize(a[t],{max_new_tokens:8,do_sample:!1,temperature:0,__silent:!0})}catch(e){continue}let r=F(n),i=H(r=N(r));if(i&&(l[i]||(l[i]=0,o.push(i)),l[i]+=1,l[i]>=3))return i}let s=null,c=0;for(let e=0;e<o.length;e++){let t=o[e],a=l[t]||0;a>c&&(c=a,s=t)}return s}let U=0,V=0;function Y(e){if(!h||!x||!b)return;let t=Math.max(0,Math.min(1,Number(e)));x.style.width=Math.round(100*t)+"%",b.textContent=Math.round(100*t)+"%"}async function Z({auto:a=!1}={}){let n,r=eh();if(!r)return void z("No marker-rectangle found.");let i=window.__LIA_TEX_OCR__;if(!i||!i.recognize)return void z("OCR engine not available (window.__LIA_TEX_OCR__).");let l=p.textContent;p.disabled=!0,p.textContent="Schrifterkennung läuft...",h&&(h.dataset.on="1",Y(0),eb()),V=performance.now(),n=()=>{let e=performance.now()-V;Y(e<900?e/900*.7:e<2200?.7+(e-900)/1300*.2:.9+Math.min(.08,(e-2200)/5e3*.08)),U=requestAnimationFrame(n)},U=requestAnimationFrame(n);try{i.ensureLoaded&&await i.ensureLoaded(!1);let a=function(t){if(!t)return null;let a=window.devicePixelRatio||1,n=Math.min(t.x0,t.x1),r=Math.min(t.y0,t.y1),i=Math.max(t.x0,t.x1),l=Math.max(t.y0,t.y1),o=ew(n,r),s=ew(i,l),c=Math.min(o.sx,s.sx),d=Math.min(o.sy,s.sy),u=Math.max(o.sx,s.sx),p=Math.max(o.sy,s.sy);c=ef(c,0,e.clientWidth),d=ef(d,0,e.clientHeight),u=ef(u,0,e.clientWidth),p=ef(p,0,e.clientHeight);let h=u-c,f=p-d;if(h<6||f<6)return null;let g=Math.round((c-12)*a),m=Math.round((d-12)*a),x=Math.round((h+24)*a),b=Math.round((f+24)*a),y=document.createElement("canvas");y.width=Math.max(1,x),y.height=Math.max(1,b);let w=y.getContext("2d",{willReadFrequently:!0});w.setTransform(1,0,0,1,0,0),w.globalCompositeOperation="source-over",w.globalAlpha=1,w.clearRect(0,0,y.width,y.height);let v=R.width,_=R.height,k=g,M=m,S=x,C=b,E=0,A=0,L=y.width,T=y.height;if(k<0){let e=-k/S;E+=L*e,L-=L*e,S+=k,k=0}if(M<0){let e=-M/C;A+=T*e,T-=T*e,C+=M,M=0}if(k+S>v){let e=k+S-v,t=e/S;L-=L*t,S-=e}if(M+C>_){let e=M+C-_,t=e/C;T-=T*t,C-=e}if(S<=1||C<=1||L<=1||T<=1)return null;w.drawImage(R,k,M,S,C,E,A,L,T);let I=w.getImageData(0,0,y.width,y.height),O=I.data;for(let e=0;e<O.length;e+=4)O[e+3]>10?(O[e]=0,O[e+1]=0,O[e+2]=0):(O[e]=255,O[e+1]=255,O[e+2]=255),O[e+3]=255;return w.putImageData(I,0,0),y}(r);if(!a)return void z("Crop failed (rect too small or out of bounds).");a.width,a.height;let n=function(e){try{let t=0|e.width,a=0|e.height,n=e.getContext("2d",{willReadFrequently:!0}).getImageData(0,0,t,a).data,r=t*a>12e5?2:1,i=t,l=a,o=-1,s=-1,c=0;for(let e=0;e<a;e+=r){let a=e*t*4;for(let d=0;d<t;d+=r)n[a+4*d]<128&&(c++,d<i&&(i=d),e<l&&(l=e),d>o&&(o=d),e>s&&(s=e))}if(o<0)return null;let d=o-i+1,u=s-l+1;return{xMin:i,yMin:l,xMax:o,yMax:s,w:d,h:u,black:c,W:t,H:a}}catch(e){}return null}(a),o=function(e,t){if(!e||!t)return!1;let a=Math.max(1,0|t.width),n=Math.max(1,0|t.height),r=Math.max(1,0|e.w),i=Math.max(1,0|e.h),l=Math.max(r,i),o=Math.min(r,i),s=r/Math.max(1,i),c=(Number(e.black||0)||0)/Math.max(1,r*i);return!(l>220||o>170||s<.2||s>2.8||c<.01||c>.6||r>Math.floor(.82*a)&&i>Math.floor(.82*n)&&l>140)}(n,a),s=String(i.model||""),c=-1!==s.toLowerCase().indexOf("trocr"),d=a,u="";try{d=o?D(a,{dilate:0}):j(a)}catch(e){d=a}try{d=X(d)}catch(e){}if(u=await i.recognize(d,o?{max_new_tokens:16,do_sample:!1,temperature:0}:{max_new_tokens:128,do_sample:!1,temperature:0}),o){let e=String(u||"").trim();if(-1!==e.indexOf("\\")||-1!==e.indexOf("{")||-1!==e.indexOf("}")||-1!==e.indexOf("^")||-1!==e.indexOf("_")||-1!==e.indexOf("sqrt")||-1!==e.indexOf("frac")||function(e){let t=String(e||"").trim();if(!t||/[+\-*/=,:;\\]$/.test(t)||/[{[(]$/.test(t))return!0;let a=0,n=0,r=0,i=!1;for(let e=0;e<t.length;e++){let l=t[e];if(i){i=!1;continue}if("\\"===l){i=!0;continue}"{"===l?a++:"}"===l?a--:"["===l?n++:"]"===l?n--:"("===l?r++:")"===l&&r--}return 0!==a||0!==n||0!==r}(e)){let e=a;try{e=j(a)}catch(t){e=a}try{e=X(e)}catch(e){}u=await i.recognize(e,{max_new_tokens:128,do_sample:!1,temperature:0})}}let h="";if(c?h=function(e){let t=B(e),a="+-=*/()[]{}",n="";for(let e=0;e<t.length;e++){let r=t[e];if(" "===r){let r=e>0?t[e-1]:"",i=e+1<t.length?t[e+1]:"";if(a.indexOf(r)>=0||a.indexOf(i)>=0)continue;n+=" "}else n+=r}return n.trim()}(u):(h=F(u),h=N(h)),o||function(e){let t=String(e||"").trim();if(!t||t.length>6||-1!==t.indexOf("\\"))return!1;let a=!1;for(let e=0;e<t.length;e++){let n=t.charCodeAt(e),r=t[e];if(n>=48&&n<=57||"l"===r||"L"===r||"I"===r||"i"===r||"|"===r||"!"===r||"O"===r||"o"===r||"Q"===r||"q"===r||"S"===r||"s"===r||"Z"===r||"z"===r||"B"===r||"g"===r){a=!0;continue}if(" "!==r&&"\n"!==r&&"\r"!==r&&"	"!==r&&"("!==r&&")"!==r&&"["!==r&&"]"!==r&&"{"!==r&&"}"!==r&&"."!==r&&","!==r&&":"!==r&&";"!==r&&"_"!==r&&"-"!==r)return!1}return a}(h)){let e=H(h);if(e)h=e;else{let e=function(e){let t=String(e||"").trim();if(!t)return null;let a=!0;for(let e=0;e<t.length;e++){let n=t.charCodeAt(e);if(n<48||n>57){a=!1;break}}if(a)return t;let n=t.toLowerCase();if("li"===n||"l1"===n||"il"===n)return"4";if("go"===n||"g0"===n||"qo"===n||"q0"===n)return"8";let r={O:"0",o:"0",Q:"0",I:"1",l:"1","|":"1","!":"1",Z:"2",z:"2",J:"3",j:"3",H:"4",h:"4",S:"5",s:"5",B:"8",g:"9",q:"9"},i="";for(let e=0;e<t.length;e++){let a=t[e];if(!r[a])return null;i+=r[a]}return i||null}(h);e&&(h=e)}if(!function(e){let t=String(e||"").trim();if(!t)return!1;for(let e=0;e<t.length;e++){let a=t.charCodeAt(e);if(a<48||a>57)return!1}return!0}(h)){let e=await $(i,a);e&&(h=e)}}z("OCR result: "+h);let x=t.closest(".lia-canvas-pair");!function(e,t){let a=m(e);if(!a||!function(e,t){let a=String(t);try{if(e&&e.getAttribute&&"true"===e.getAttribute("contenteditable"))return e.textContent=a,e.dispatchEvent(new Event("input",{bubbles:!0})),e.dispatchEvent(new Event("change",{bubbles:!0})),!0;if(e&&"value"in e)return e.value=a,e.dispatchEvent(new Event("input",{bubbles:!0})),e.dispatchEvent(new Event("change",{bubbles:!0})),!0}catch(e){}return!1}(a,t))return!1;function n(){let t=m(e);t&&(g(t),f(t))}return setTimeout(n,0),setTimeout(n,80),setTimeout(n,180),!0}(x||t,h)?z("Could not find an input field before this @canvas."):(p.textContent="✅ übernommen",setTimeout(()=>{p.textContent=l},900))}catch(e){z("OCR error: "+(e&&e.message?e.message:String(e))),p.textContent="⚠ Fehler",setTimeout(()=>{p.textContent=l},900)}finally{U&&(cancelAnimationFrame(U),U=0),Y(1),setTimeout(()=>void(h&&(h.dataset.on="0",Y(0))),250),p.disabled=!1}}p.addEventListener("click",async e=>{e.preventDefault(),e.stopPropagation(),await Z({auto:!1})});let J=[],K=[];I&&(Array.isArray(I.ITEMS)?(J=I.ITEMS,K=Array.isArray(I.REDO)?I.REDO:[]):Array.isArray(I.STROKES)&&(J=I.STROKES.map(e=>({kind:"path",...e})),K=Array.isArray(I.REDO)?I.REDO.map(e=>({kind:"path",...e})):[]));let Q="pen",G="pen",ee=0,et=3,ea=1,en=12,er=I&&I.bgMode?I.bgMode:"none",ei=I&&I.bgStep?I.bgStep:24,el=null,eo=null;function es(r){if(n){var i;T[n]={VIEW:{...O},ITEMS:J,REDO:K,bgMode:er,bgStep:ei,wrapW:t.getBoundingClientRect().width,canvasH:e.clientHeight},i=r||"persist",!n||q&&(clearTimeout(P),P=setTimeout(()=>{var e={uid:n,reason:String(i||"persist"),hasItems:Array.isArray(J)&&J.length>0?1:0};try{let t=Object.assign({ts:Date.now()},e&&!0?e:{});(a&&"function"==typeof a.dispatchEvent?a:window).dispatchEvent(new CustomEvent("lia:canvas-change",{detail:t}))}catch(e){}},120))}}function ec(){let e=w[ee]||w[0];return"auto"===e.key?v():e.value||v()}function ed(e){u&&(u.dataset.open=e?"1":"0")}function eu(){u&&"1"===u.dataset.open&&ed(!1)}function ep(){return`
      <svg viewBox="-1 0 24 24" aria-hidden="true" style="width:22px;height:22px;display:block;">
        <path class="ico-stroke" d="M6 6l12 12M18 6L6 18" stroke-width="2" stroke-linecap="round"/>
      </svg>
    `}function eh(){for(let e=J.length-1;e>=0;e--){let t=J[e];if(t&&"rect"===t.kind)return t}return null}function ef(e,t,a){return Math.max(t,Math.min(a,e))}function eg(){S&&(S.dataset.on="0")}function em(t,a){if(!S)return;if("eraser"!==Q||!isFinite(t)||!isFinite(a))return void eg();let n=Math.max(8,en*O.scale);S.style.width=n+"px",S.style.height=n+"px",S.style.left=ef(t,0,e.clientWidth)+"px",S.style.top=ef(a,0,e.clientHeight)+"px",S.dataset.on="1"}let ex=0;function eb(){ex||(ex=requestAnimationFrame(()=>{ex=0,function(){let t=eh();if(!t){p.style.display="none",y&&(y.style.display="none");return}p.style.display="block",p.style.visibility="hidden";let a=p.offsetWidth||180,n=p.offsetHeight||34;p.style.visibility="visible";let r=Math.min(t.x0,t.x1),i=Math.min(t.y0,t.y1),l=Math.max(t.x0,t.x1),o=Math.max(t.y0,t.y1),s=ew(r,i),c=ew(l,o),d=Math.max(s.sx,c.sx),u=Math.max(s.sy,c.sy),f=d-a,g=u+8;if(f=ef(f,6,e.clientWidth-a-6),g=ef(g,6,e.clientHeight-n-6),p.style.left=f+"px",p.style.top=g+"px",h){h.style.width=a+"px";let t=f,r=g+n+6,i=h.offsetHeight||26;t=ef(t,6,e.clientWidth-a-6),r=ef(r,6,e.clientHeight-i-6),h.style.left=t+"px",h.style.top=r+"px"}if(y){y.style.display="block",y.style.visibility="hidden";let t=y.offsetWidth||24,a=y.offsetHeight||24;y.style.visibility="visible";let n=Math.min(s.sy,c.sy),r=Math.max(s.sx,c.sx)-.5*t,i=n-.5*a;r=ef(r,6,e.clientWidth-t-6),i=ef(i,6,e.clientHeight-a-6),y.style.left=r+"px",y.style.top=i+"px"}}()}))}function ey(e,t){return{x:(e-O.panX)/O.scale,y:(t-O.panY)/O.scale}}function ew(e,t){return{sx:e*O.scale+O.panX,sy:t*O.scale+O.panY}}function ev(e){let t=window.devicePixelRatio||1;e.setTransform(t*O.scale,0,0,t*O.scale,t*O.panX,t*O.panY)}function e_(t){let a=window.devicePixelRatio||1;t.setTransform(a,0,0,a,0,0),t.globalCompositeOperation="source-over",t.globalAlpha=1,t.clearRect(0,0,e.clientWidth,e.clientHeight)}function ek(e,t){"eraser"===t.tool?(e.globalCompositeOperation="destination-out",e.globalAlpha=1,e.strokeStyle="rgba(0,0,0,1)"):(e.globalCompositeOperation="source-over",e.globalAlpha=t.alpha,e.strokeStyle=t.color),e.lineWidth=t.width,e.lineCap="round",e.lineJoin="round"}function eM(){for(let e of(e_(A),ev(A),J)){if(!e||"rect"!==e.kind)continue;let t=M("accent"===e.colorKey?_():e.color||_(),Math.max(0,Math.min(1,e.alpha))),a=Math.min(e.x0,e.x1),n=Math.min(e.y0,e.y1),r=Math.max(e.x0,e.x1),i=Math.max(e.y0,e.y1);A.save(),A.globalCompositeOperation="source-over",A.globalAlpha=1,A.fillStyle=t,A.fillRect(a,n,Math.max(0,r-a),Math.max(0,i-n)),A.restore()}}function eS(){for(let e of(e_(L),ev(L),J))if(e&&"path"===e.kind&&e.points&&!(e.points.length<2)){ek(L,e),L.beginPath(),L.moveTo(e.points[0].x,e.points[0].y);for(let t=1;t<e.points.length;t++){let a=e.points[t];L.lineTo(a.x,a.y)}L.stroke()}}function eC(){let t;t=window.devicePixelRatio||1,C.setTransform(t,0,0,t,0,0),C.globalCompositeOperation="source-over",C.globalAlpha=1,C.clearRect(0,0,e.clientWidth,e.clientHeight),function(){let t,a;if("none"===er)return;let n=window.devicePixelRatio||1;C.setTransform(n*O.scale,0,0,n*O.scale,n*O.panX,n*O.panY);let r=Math.max(6,Number(ei)||24),i=(t=e.clientWidth,a=e.clientHeight,{x0:(0-O.panX)/O.scale,y0:(0-O.panY)/O.scale,x1:(t-O.panX)/O.scale,y1:(a-O.panY)/O.scale}),l=M(_(),.65);C.save(),C.globalCompositeOperation="source-over",C.globalAlpha=1,C.strokeStyle=l,C.lineWidth=1.125/O.scale;let o=Math.floor(i.x0/r)*r,s=Math.ceil(i.x1/r)*r,c=Math.floor(i.y0/r)*r,d=Math.ceil(i.y1/r)*r;if("grid"===er){let e=0;C.beginPath();for(let t=o;t<=s&&(C.moveTo(t,i.y0),C.lineTo(t,i.y1),!(++e>4e3));t+=r);for(let t=c;t<=d&&(C.moveTo(i.x0,t),C.lineTo(i.x1,t),!(++e>4e3));t+=r);C.stroke()}if("lined"===er){let e=0;C.beginPath();for(let t=c;t<=d&&(C.moveTo(i.x0,t),C.lineTo(i.x1,t),!(++e>4e3));t+=r);C.stroke()}C.restore()}();let a=window.devicePixelRatio||1;if(C.setTransform(a,0,0,a,0,0),C.globalCompositeOperation="source-over",C.globalAlpha=1,C.drawImage(E,0,0,E.width,E.height,0,0,e.clientWidth,e.clientHeight),eo){let e=M(_(),.28),t=Math.min(eo.x0,eo.x1),a=Math.min(eo.y0,eo.y1),n=Math.max(eo.x0,eo.x1),r=Math.max(eo.y0,eo.y1),i=ew(t,a),l=ew(n,r);C.save(),C.fillStyle=e,C.globalAlpha=1,C.fillRect(i.sx,i.sy,Math.max(0,l.sx-i.sx),Math.max(0,l.sy-i.sy)),C.restore()}C.drawImage(R,0,0,R.width,R.height,0,0,e.clientWidth,e.clientHeight),eb()}function eE(){let e=ec(),t=_();if(r&&(r.disabled=0===J.length,r.title="Rückgängig"),i&&(i.disabled=0===K.length,i.title="Wiederherstellen"),l&&(l.style.background=e,l.dataset.active="pen"===Q?"1":"0",l.title="Stift"),o&&(o.dataset.active="eraser"===Q?"1":"0",o.title="Radierer"),c&&(c.style.background="transparent",c.dataset.active="rect"===Q?"1":"0",c.title="Marker-Rechteck"),d){let e=M(t,.65);d.style.backgroundColor="transparent",d.style.backgroundImage=`linear-gradient(to right, ${e} 1.8px, transparent 1.8px),
         linear-gradient(to bottom, ${e} 1.8px, transparent 1.8px)`,d.style.backgroundSize="6px 6px",d.style.backgroundPosition="center",d.dataset.active="bg"===G?"1":"0",d.title="Hintergrund"}"eraser"!==Q&&eg()}function eA(e){if(eo){if(e){let e=Math.min(eo.x0,eo.x1),t=Math.min(eo.y0,eo.y1),a=Math.max(eo.x0,eo.x1),n=Math.max(eo.y0,eo.y1),r=n-t;if(a-e>.001&&r>.001){for(let e=J.length-1;e>=0;e--)J[e]&&"rect"===J[e].kind&&J.splice(e,1);for(let e=K.length-1;e>=0;e--)K[e]&&"rect"===K[e].kind&&K.splice(e,1);J.push({kind:"rect",x0:e,y0:t,x1:a,y1:n,alpha:.28,colorKey:"accent"}),K.length=0}}eo=null,eM(),eC(),eE(),es(),eb()}}function eR(){eg();let t=window.devicePixelRatio||1,a=e.clientWidth,n=e.clientHeight,r=Math.max(1,Math.round(a*t)),i=Math.max(1,Math.round(n*t));e.width=r,e.height=i,E.width=r,E.height=i,R.width=r,R.height=i,eM(),eS(),eC(),eE(),es()}eE(),eR(),new ResizeObserver(()=>eR()).observe(e),!function(){if(t.__cornersReady)return;t.__cornersReady=!0;let a=document.createElement("button");a.type="button",a.className="lia-resize-corner",a.dataset.corner="bl",a.setAttribute("aria-label","Zeichenfläche ziehen (links unten)");let n=document.createElement("button");n.type="button",n.className="lia-resize-corner",n.dataset.corner="br",n.setAttribute("aria-label","Zeichenfläche ziehen (rechts unten)"),t.appendChild(a),t.appendChild(n);let r=(e,t,a)=>Math.max(t,Math.min(a,e));function i(a,n){let i=!1,l=0,o=0,s=0,c=0;function d(e){if(i){i=!1;try{a.releasePointerCapture(e.pointerId)}catch(e){}eR(),es()}}a.addEventListener("pointerdown",function(n){eu(),n.preventDefault(),n.stopPropagation(),i=!0,s=t.getBoundingClientRect().width,c=e.clientHeight||245,l=n.clientX,o=n.clientY;try{a.setPointerCapture(n.pointerId)}catch(e){}}),a.addEventListener("pointermove",function(a){if(!i)return;a.preventDefault();let d=a.clientX-l,u=a.clientY-o,p=r(c+u,130,9e3);e.style.height=p+"px";let h=function(){let e=t.closest(".lia-canvas-mount")||t.parentElement||t,a=0;try{a=e.getBoundingClientRect().width}catch(e){}if((!a||a<200)&&document.querySelector("main"))try{a=document.querySelector("main").getBoundingClientRect().width}catch(e){}return Math.max(200,Math.floor(a||200))}(),f="br"===n?r(s+d,200,h):r(s-d,200,h);t.style.width=f+"px"}),a.addEventListener("pointerup",d),a.addEventListener("pointercancel",d)}i(n,"br"),i(a,"bl")}(),document.addEventListener("lia-canvas-theme",()=>{eE(),eM(),eS(),eC()}),r&&!r.__bound&&(r.__bound=!0,r.addEventListener("click",e=>{e.preventDefault(),e.stopPropagation(),function(){if(!J.length)return;let e=J.pop();K.push(e),eM(),eS(),eC(),eE(),es()}()})),i&&!i.__bound&&(i.__bound=!0,i.addEventListener("click",e=>{e.preventDefault(),e.stopPropagation(),function(){if(!K.length)return;let e=K.pop();J.push(e),eM(),eS(),eC(),eE(),es()}()})),c&&!c.__bound&&(c.__bound=!0,c.addEventListener("click",e=>{e.stopPropagation(),Q="rect",G="rect",ed(!1),eE()})),l&&u&&l.addEventListener("click",e=>{e.stopPropagation(),Q="pen",G="pen";let t="1"===u.dataset.open,a="pen"===u.__mode;t&&a||function e(){if(!u)return;u.__mode="pen";let t=v(),a="";a+=`<span class="lia-heading-row">
      <span class="lia-tool-heading">Stift</span>
      <button class="lia-menu-icon-btn" type="button" data-act="close" aria-label="Schlie\xdfen">${ep()}</button>
    </span><span class="lia-color-grid">`;for(let e=0;e<w.length;e++){let n=w[e],r="auto"===n.key?t:n.value||t,i=e===ee?"1":"0";a+=`<button class="lia-color-item" type="button" data-act="color" data-idx="${e}" data-active="${i}"
                style="background:${r};" aria-label="Farbe ${n.key}"></button>`}u.innerHTML=a+=`</span><span class="lia-row">
      <span class="lia-preview"><span class="lia-preview-line" data-k="pw" style="height:${Math.max(2,Math.min(14,et))}px;"></span></span>
      <input class="lia-slider" type="range" min="1" max="100" step="1" value="${et}" data-act="penWidth" aria-label="Stiftbreite">
      <span style="font-weight:800;min-width:2.6em;text-align:right">${et}</span>
    </span><span class="lia-row">
      <span class="lia-preview"><span class="lia-preview-line" data-k="pa" style="opacity:${ea};"></span></span>
      <input class="lia-slider" type="range" min="0.15" max="1" step="0.05" value="${ea}" data-act="penAlpha" aria-label="Deckkraft">
      <span style="font-weight:800;min-width:2.6em;text-align:right">${Math.round(100*ea)}%</span>
    </span>`,u.onclick=t=>{let a=t.target&&t.target.closest?t.target.closest("[data-act]"):null;if(!a)return;let n=a.getAttribute("data-act");if("close"===n)return void ed(!1);if("color"===n){let t=Number(a.getAttribute("data-idx"));isFinite(t)&&(ee=ef(t,0,w.length-1)),Q="pen",eE(),es(),e();return}if("penWidth"!==n&&"penAlpha"===n)return};let n=u.querySelector('input[data-act="penWidth"]');n&&(n.oninput=()=>{et=ef(Number(n.value),1,100),eE(),es();let e=u.querySelector('[data-k="pw"]');e&&(e.style.height=Math.max(2,Math.min(14,et))+"px");let t=n.parentElement&&n.parentElement.querySelector('span[style*="min-width"]');t&&(t.textContent=String(et))});let r=u.querySelector('input[data-act="penAlpha"]');r&&(r.oninput=()=>{ea=ef(Number(r.value),.05,1),eE(),es();let e=u.querySelector('[data-k="pa"]');e&&(e.style.opacity=String(ea));let t=r.parentElement&&r.parentElement.querySelector('span[style*="min-width"]');t&&(t.textContent=Math.round(100*ea)+"%")})}(),ed(!t||!a),eE()}),o&&u&&o.addEventListener("click",e=>{e.stopPropagation(),Q="eraser",G="eraser";let t="1"===u.dataset.open,a="eraser"===u.__mode;t&&a||function(){if(!u)return;u.__mode="eraser",u.innerHTML=`
      <span class="lia-heading-row">
        <span class="lia-tool-heading">Radierer</span>
        <span style="display:flex;gap:8px;align-items:center">
          <button class="lia-menu-icon-btn" type="button" data-act="clear" aria-label="Alles l\xf6schen">
      <svg viewBox="-1 0 24 24" aria-hidden="true" style="width:22px;height:22px;display:block;">
        <path class="ico-stroke" d="M9 3h6" stroke-width="2" stroke-linecap="round"/>
        <path class="ico-stroke" d="M4 6h16" stroke-width="2" stroke-linecap="round"/>
        <path class="ico-stroke" d="M7 6l1 15h8l1-15" stroke-width="2" stroke-linejoin="round"/>
        <path class="ico-stroke" d="M10 10v8M14 10v8" stroke-width="2" stroke-linecap="round"/>
      </svg>
    </button>
          <button class="lia-menu-icon-btn" type="button" data-act="close" aria-label="Schlie\xdfen">${ep()}</button>
        </span>
      </span>

      <span class="lia-row">
        <span class="lia-preview"><span class="lia-preview-line" style="height:${Math.max(2,Math.min(18,en))}px;"></span></span>
        <input class="lia-slider" type="range" min="4" max="500" step="1" value="${en}" data-act="eraserWidth" aria-label="Radiererbreite">
        <span style="font-weight:800;min-width:2.6em;text-align:right">${en}</span>
      </span>
    `,u.onclick=e=>{let t=e.target&&e.target.closest?e.target.closest("[data-act]"):null;if(!t)return;let a=t.getAttribute("data-act");"close"===a?ed(!1):"clear"===a&&(J.length=0,K.length=0,eM(),eS(),eC(),eE(),es())};let e=u.querySelector('input[data-act="eraserWidth"]');e&&(e.oninput=()=>{en=ef(Number(e.value),2,500),eE(),es();let t=e.parentElement&&e.parentElement.querySelector('span[style*="min-width"]');t&&(t.textContent=String(en))})}(),ed(!t||!a),eE()}),d&&u&&d.addEventListener("click",e=>{e.stopPropagation(),G="bg";let t="1"===u.dataset.open,a="bg"===u.__mode;t&&a||function e(){if(!u)return;u.__mode="bg",u.innerHTML=`
      <span class="lia-heading-row">
        <span class="lia-tool-heading">Hintergrund</span>
        <button class="lia-menu-icon-btn" type="button" data-act="close" aria-label="Schlie\xdfen">${ep()}</button>
      </span>

      <span class="lia-bg-tiles">
        <button class="lia-bg-tile" type="button" data-act="bg" data-mode="none"  data-active="${"none"===er?"1":"0"}" aria-label="Kein Hintergrund"></button>
        <button class="lia-bg-tile" type="button" data-act="bg" data-mode="grid"  data-active="${"grid"===er?"1":"0"}" aria-label="Kariert"></button>
        <button class="lia-bg-tile" type="button" data-act="bg" data-mode="lined" data-active="${"lined"===er?"1":"0"}" aria-label="Liniert"></button>
      </span>

      <span class="lia-row">
        <span style="font-weight:800;opacity:.8;min-width:4.8em">Abstand</span>
        <input class="lia-slider" type="range" min="8" max="80" step="1" value="${ei}" data-act="bgStep" aria-label="Hintergrundabstand">
        <span style="font-weight:800;min-width:2.6em;text-align:right">${ei}</span>
      </span>
    `;try{let e=M(_(),.65),t=u.querySelectorAll(".lia-bg-tile");if(t&&t.length>=3){let a=t[1];a.style.backgroundImage=`linear-gradient(to right, ${e} 2px, transparent 2px),
           linear-gradient(to bottom, ${e} 2px, transparent 2px)`,a.style.backgroundSize="10px 10px",a.style.backgroundPosition="center";let n=t[2];n.style.backgroundImage=`linear-gradient(to bottom, ${e} 2px, transparent 2px)`,n.style.backgroundSize="10px 10px",n.style.backgroundPosition="center"}}catch(e){}u.onclick=t=>{let a=t.target&&t.target.closest?t.target.closest("[data-act]"):null;if(!a)return;let n=a.getAttribute("data-act");if("close"===n)return void ed(!1);if("bg"===n){let t=String(a.getAttribute("data-mode")||"none");er="grid"===t||"lined"===t?t:"none",eC(),es(),e(),eE();return}};let t=u.querySelector('input[data-act="bgStep"]');t&&(t.oninput=()=>{ei=ef(Number(t.value),6,300),eC(),es();let e=t.parentElement&&t.parentElement.querySelector('span[style*="min-width"]');e&&(e.textContent=String(ei))})}(),ed(!t||!a),eE()}),document.addEventListener("click",e=>{t.contains(e.target)||ed(!1)}),document.addEventListener("keydown",e=>{"Escape"===e.key&&ed(!1)});let eL=!1;function eT(e){return Math.max(O.minScale,Math.min(O.maxScale,e))}window.addEventListener("keydown",e=>{"Space"===e.code&&(eL=!0)}),window.addEventListener("keyup",e=>{"Space"===e.code&&(eL=!1)}),e.addEventListener("contextmenu",e=>e.preventDefault()),e.addEventListener("wheel",t=>{eu(),t.preventDefault(),eg();let a=e.getBoundingClientRect(),n=t.clientX-a.left,r=t.clientY-a.top;!function(e,t,a){let n=O.scale,r=eT(n*e);if(r===n)return;let i=ey(t,a);O.scale=r,O.panX=t-i.x*r,O.panY=a-i.y*r,eM(),eS(),eC(),es()}(Math.exp(-(.0012*t.deltaY)),n,r)},{passive:!1});let eI=new Map,eO="idle",eP=0,eq=0,ez=null;function eB(t){let a=e.getBoundingClientRect();return{sx:t.clientX-a.left,sy:t.clientY-a.top}}function eF(e,t){return Math.hypot(e.sx-t.sx,e.sy-t.sy)}function eN(e,t){return{sx:(e.sx+t.sx)/2,sy:(e.sy+t.sy)/2}}function eX(t){eg(),eI.has(t.pointerId)&&eI.delete(t.pointerId);try{e.releasePointerCapture(t.pointerId)}catch(e){}if("pinch"===eO){eI.size<2&&(ez=null,eO="idle");return}if("pan"===eO){eO="idle",e.style.cursor="crosshair";return}if("rect"===eO){0===eI.size&&(eA(!0),eO="idle");return}if("draw"===eO){el=null,eO="idle",eE(),es();return}}e.addEventListener("pointerdown",t=>{let a,n;if(eu(),t.target&&t.target.classList&&t.target.classList.contains("lia-resize-corner"))return;let r=eB(t);if(eI.set(t.pointerId,r),e.setPointerCapture(t.pointerId),2===eI.size){eg(),"draw"===eO&&(el=null),"rect"===eO&&eA(!1);let e=Array.from(eI.values()),t=eN(e[0],e[1]);ez={dist:Math.max(1e-6,eF(e[0],e[1])),worldMid:ey(t.sx,t.sy),startScale:O.scale},eO="pinch";return}let i="mouse"===t.pointerType&&2===t.button,l="mouse"===t.pointerType&&1===t.button;if(i||l||"mouse"===t.pointerType&&eL){eg(),eO="pan",eP=r.sx,eq=r.sy,e.style.cursor="grab";return}if("rect"===Q){let t;eg(),eO="rect",e.style.cursor="crosshair",eo={x0:(t=ey(r.sx,r.sy)).x,y0:t.y,x1:t.x,y1:t.y},eC();return}eO="draw",e.style.cursor="crosshair",a=ey(r.sx,r.sy),n={kind:"path",tool:Q,color:ec(),alpha:ea,width:"eraser"===Q?en:et,points:[{x:a.x,y:a.y}]},J.push(n),el=n,K.length=0,ev(L),ek(L,n),L.beginPath(),L.moveTo(a.x,a.y),eE(),es(),"eraser"===Q?em(r.sx,r.sy):eg()}),e.addEventListener("pointermove",e=>{if(!eI.has(e.pointerId))return;let t=eB(e);if(eI.set(e.pointerId,t),"eraser"===Q&&"pan"!==eO&&"pinch"!==eO&&"rect"!==eO?em(t.sx,t.sy):eg(),"pinch"===eO&&eI.size>=2&&ez){let e=Array.from(eI.values()).slice(0,2),t=eN(e[0],e[1]),a=Math.max(1e-6,eF(e[0],e[1]))/ez.dist,n=eT(ez.startScale*a);O.scale=n,O.panX=t.sx-ez.worldMid.x*n,O.panY=t.sy-ez.worldMid.y*n,eM(),eS(),eC(),es();return}if("pan"===eO){let e=t.sx-eP,a=t.sy-eq;eP=t.sx,eq=t.sy,O.panX+=e,O.panY+=a,eM(),eS(),eC(),es();return}"rect"===eO?function(e,t){if(!eo)return;let a=ey(e,t);eo.x1=a.x,eo.y1=a.y,eC()}(t.sx,t.sy):"draw"===eO&&function(e,t){if(!el)return;let a=ey(e,t);el.points.push({x:a.x,y:a.y}),L.lineTo(a.x,a.y),L.stroke(),eC(),es()}(t.sx,t.sy)}),e.addEventListener("pointerup",eX),e.addEventListener("pointercancel",eX),e.addEventListener("pointerleave",()=>{eg(),"draw"===eO&&(el=null),"pinch"!==eO&&(eO="idle"),e.style.cursor="crosshair",eE(),es()}),q=!0}(e)}),document.querySelectorAll(".lia-canvas-pair").forEach(function(e){let t=m(e);t&&g(t)})}(e=a.__LIA_CANVAS_FREEZE_API__||{}).version="cvf1",e.collectCanvasPairsFromRoot=q,e.getCanvasMountFromPair=I,e.getCanvasUidFromPair=O,e.getCanvasStoreEntry=P,e.exportCanvasFreezeStateFromEntry=B,e.exportCanvasFreezeStateFromPair=F,e.exportAllCanvasFreezeStatesFromRoot=function(e){let t=q(e),a=[];for(let e=0;e<t.length;e++){let n=F(t[e]);n&&a.push(n)}return a},e.hasCanvasFreezeContent=N,e.paintCanvasFreezeStateToCanvas=X,e.renderCanvasFreezeStateIntoMount=j,e.renderCanvasFreezeStateIntoPair=function(e,t){let a=I(e);return a?j(a,t):null},a.__LIA_CANVAS_FREEZE_API__=e,window.__LIA_CANVAS_FREEZE_API__=e,new MutationObserver(()=>H()).observe(document.body,{childList:!0,subtree:!0}),H(),window.__liaCanvasLauncherBound||(window.__liaCanvasLauncherBound=!0,document.addEventListener("click",e=>{let t=e.target&&e.target.closest?e.target.closest(".lia-canvas-launch"):null;if(!t)return;let a=t.closest(".lia-canvas-pair");if(!a)return;let n=a.querySelector(".lia-canvas-mount");if(n){s(n);try{let e=n.parentElement;if(e){let t=getComputedStyle(e);t&&String(t.display).includes("flex")&&"nowrap"===String(t.flexWrap)&&(e.style.flexWrap="wrap")}}catch(e){}"1"===n.dataset.open?n.dataset.open="0":(n.dataset.open="1",n.querySelector(".lia-draw-wrap")||(n.innerHTML=`
      <span class="lia-draw-block">
        <span class="lia-draw-wrap">
          <span class="lia-toolstack">
            <button class="lia-tool-btn lia-undo-btn"   type="button" aria-label="R\xfcckg\xe4ngig"></button>
            <button class="lia-tool-btn lia-redo-btn"   type="button" aria-label="Wiederherstellen"></button>
            <button class="lia-tool-btn lia-eraser-btn" type="button" aria-label="Radierer"></button>
            <button class="lia-tool-btn lia-color-btn"  type="button" aria-label="Stift"></button>
            <button class="lia-tool-btn lia-bgmenu-btn" type="button" aria-label="Hintergrund"></button>
            <button class="lia-tool-btn lia-rect-btn"   type="button" aria-label="L\xf6sung markieren"></button>
          </span>

          <span class="lia-tool-menu" data-open="0" aria-label="Werkzeuge"></span>
          <canvas class="lia-draw" aria-label="Zeichenfl\xe4che"></canvas>
        </span>
      </span>
    `,H()))}},!0))}()},{}]},["bZBjE"],"bZBjE","parcelRequirecca2",{});
//# sourceMappingURL=index.js.map
