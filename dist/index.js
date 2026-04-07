!function(e,t,a,n,r){var i="u">typeof globalThis?globalThis:"u">typeof self?self:"u">typeof window?window:"u">typeof global?global:{},l="function"==typeof i[n]&&i[n],o=l.i||{},s=l.cache||{},c="u">typeof module&&"function"==typeof module.require&&module.require.bind(module);function d(t,a){if(!s[t]){if(!e[t]){if(r[t])return r[t];var o="function"==typeof i[n]&&i[n];if(!a&&o)return o(t,!0);if(l)return l(t,!0);if(c&&"string"==typeof t)return c(t);var u=Error("Cannot find module '"+t+"'");throw u.code="MODULE_NOT_FOUND",u}h.resolve=function(a){var n=e[t][1][a];return null!=n?n:a},h.cache={};var p=s[t]=new d.Module(t);e[t][0].call(p.exports,h,p,p.exports,i)}return s[t].exports;function h(e){var t=h.resolve(e);if(!1===t)return{};if(Array.isArray(t)){var a={__esModule:!0};return t.forEach(function(e){var t=e[0],n=e[1],r=e[2]||e[0],i=d(n);"*"===t?Object.keys(i).forEach(function(e){"default"===e||"__esModule"===e||Object.prototype.hasOwnProperty.call(a,e)||Object.defineProperty(a,e,{enumerable:!0,get:function(){return i[e]}})}):"*"===r?Object.defineProperty(a,t,{enumerable:!0,value:i}):Object.defineProperty(a,t,{enumerable:!0,get:function(){return"default"===r?i.__esModule?i.default:i:i[r]}})}),a}return d(t)}}d.isParcelRequire=!0,d.Module=function(e){this.id=e,this.bundle=d,this.require=c,this.exports={}},d.modules=e,d.cache=s,d.parent=l,d.distDir=void 0,d.publicUrl=void 0,d.devServer=void 0,d.i=o,d.register=function(t,a){e[t]=[function(e,t){t.exports=a},{}]},Object.defineProperty(d,"root",{get:function(){return i[n]}}),i[n]=d;for(var u=0;u<t.length;u++)d(t[u]);if(a){var p=d(a);"object"==typeof exports&&"u">typeof module?module.exports=p:"function"==typeof define&&define.amd&&define(function(){return p})}}({bZBjE:[function(e,t,a,n){!function(){let e;function t(){let e=window;try{for(;e.parent&&e.parent!==e;)e=e.parent}catch(e){}return e}let a=t(),n="__LIA_CANVAS_OCR_REG_V1__";a[n]=a[n]||{inited:{}};let r=document.baseURI||location.href;if(a[n].inited[r])return;a[n].inited[r]=!0;let i=window.__LIA_CANVAS_OCR__=window.__LIA_CANVAS_OCR__||{SHOW_BAR:!1,bar:null,ocr:null,tfjs:null,tfjsLoad:null,store:{},uidSeq:0,freeze:{},barBoot:!1,canvasBoot:!1,launcherBound:!1};if(!i.barBoot){function l(){try{let e=function(){try{let e=document.querySelector(".lia-btn");if(e){let t=getComputedStyle(e).backgroundColor;if(t&&"rgba(0, 0, 0, 0)"!==t&&"transparent"!==t)return t}let t=document.body||document.documentElement,a=document.createElement("button");a.className="lia-btn",a.type="button",a.textContent="x",a.style.position="absolute",a.style.left="-9999px",a.style.top="-9999px",a.style.visibility="hidden",t.appendChild(a);let n=getComputedStyle(a).backgroundColor;if(a.remove(),n&&"rgba(0, 0, 0, 0)"!==n&&"transparent"!==n)return n}catch(e){}return null}();e&&document.documentElement.style.setProperty("--canvas-accent",e)}catch(e){}}function o(){let e=!0===i.SHOW_BAR;if(d(),i.bar&&i.bar.el&&i.bar.el.isConnected){try{let t=i.bar.el,a=document,n=a.body||a.documentElement;t.parentNode!==n&&n.appendChild(t),t.style.display=e?"":"none",t.setAttribute("aria-hidden",e?"false":"true");let r=i.bar.loadEl;r&&r.parentNode!==n&&n.appendChild(r)}catch(e){}return i.bar}let t=document,a=t.createElement("div");a.className="lia-ocrbar",e||(a.style.display="none",a.setAttribute("aria-hidden","true")),a.dataset.state="idle",a.dataset.open="0",a.innerHTML=`
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
    `,n.appendChild(r);let l=r.querySelector(".lia-ocr-loadfill"),o=r.querySelector(".lia-ocr-loadmsg .t"),s=r.querySelector(".lia-ocr-loadmsg .p"),c=r.querySelector(".lia-ocr-loaddetail"),u={model:"Xenova/texify2",backend:"wasm",precision:"fp32",loaded:!1,phase:"idle",status:"idle",progress:null},p=a.querySelector(".lia-ocr-log"),h=a.querySelector(".lia-ocr-progress"),f=a.querySelector(".lia-ocr-progfill"),g=a.querySelector(".lia-ocr-progtxt"),m=a.querySelector('select[data-act="precision"]'),x=a.querySelector('select[data-act="model"]'),b="__LIA_TEX_OCR_PREC__",y="__LIA_TEX_OCR_MODEL__";try{let e=localStorage.getItem(y);e&&(u.model=String(e))}catch(e){}try{let e=localStorage.getItem(b);e&&(u.precision=String(e))}catch(e){}function v(e,t){let n=a.querySelector('[data-k="'+e+'"]');n&&(n.textContent=String(t))}function w(){if(a.dataset.state=String(u.status||"idle"),v("model",u.model||"—"),v("backend",u.backend||"—"),v("precision",u.precision||"—"),v("loaded",u.loaded?"yes":"no"),v("phase",u.phase||"—"),v("status",u.status||"idle"),null!==u.progress&&void 0!==u.progress&&isFinite(u.progress)){let e=Math.max(0,Math.min(1,Number(u.progress)));h.dataset.on="1",f.style.width=Math.round(100*e)+"%",g.textContent=Math.round(100*e)+"%"}else h.dataset.on="0";try{if(e){let e=Math.ceil(a.getBoundingClientRect().height||a.offsetHeight||0);document.documentElement.style.setProperty("--lia-ocrbar-h",(e||0)+"px"),document.documentElement.style.setProperty("--lia-ocrbar-gap","8px")}else document.documentElement.style.setProperty("--lia-ocrbar-h","0px"),document.documentElement.style.setProperty("--lia-ocrbar-gap","0px")}catch(e){}if(r&&l&&o&&s){let e=String(u.status||"idle"),t=String(u.phase||"idle");if(u.loaded||"loading"!==e&&"import"!==t&&"pipeline"!==t&&"download"!==t)r.dataset.on="0",r.dataset.indet="0",l.style.transform="translateX(0)",l.style.width="0%",s.textContent="";else if(r.dataset.on="1","download"===t?(o.textContent="Schrifterkennungsmodul lädt noch…",c&&(c.innerHTML="Dieser Download dauert nur beim ersten Mal so lange und ist danach im Cache.")):("import"===t?o.textContent="Schrifterkennungsmodul lädt noch… (Bibliothek wird geladen)":"pipeline"===t?o.textContent="Schrifterkennungsmodul lädt noch… (Modell wird initialisiert)":o.textContent="Schrifterkennungsmodul lädt noch…",c&&(c.textContent="Erster Start kann etwas dauern.")),null!==u.progress&&void 0!==u.progress&&isFinite(u.progress)){let e=Math.max(0,Math.min(1,Number(u.progress)));r.dataset.indet="0",l.style.transform="translateX(0)",l.style.width=Math.round(100*e)+"%",s.textContent=Math.round(100*e)+"%"}else r.dataset.indet="1",l.style.width="35%",s.textContent="…"}}function k(e){try{let t=new Date,a=String(t.getHours()).padStart(2,"0"),n=String(t.getMinutes()).padStart(2,"0"),r=String(t.getSeconds()).padStart(2,"0"),i="["+a+":"+n+":"+r+"] "+String(e),l=p.textContent?p.textContent.split("\n"):[];for(l.push(i);l.length>10;)l.shift();p.textContent=l.join("\n")}catch(e){}}function M(e){try{if(!e)return;for(let t in e)Object.prototype.hasOwnProperty.call(e,t)&&(u[t]=e[t]);w()}catch(e){}}return x&&(x.value=u.model),m&&(m.value=u.precision),a.addEventListener("click",e=>{let t=e.target&&e.target.closest?e.target.closest("button[data-act]"):null;if(!t)return;let n=t.getAttribute("data-act");if("toggle"===n){a.dataset.open="1"===a.dataset.open?"0":"1";return}if("copy"===n){let e=["LaTeX-OCR Status Report","Model: "+(u.model||""),"Backend: "+(u.backend||""),"Precision: "+(u.precision||""),"Loaded: "+(u.loaded?"yes":"no"),"Phase: "+(u.phase||""),"Status: "+(u.status||""),"Progress: "+(null===u.progress?"—":String(u.progress)),"\nLog:",p.textContent||""].join("\n");try{navigator.clipboard.writeText(e),k("Report copied to clipboard.")}catch(e){k("Copy failed (clipboard blocked).")}return}if("load"===n){i.ocr&&i.ocr.ensureLoaded&&i.ocr.ensureLoaded(!0);return}}),m&&m.addEventListener("change",()=>{let e=String(m.value||"fp32");try{localStorage.setItem(b,e)}catch(e){}M({precision:e}),i.ocr&&i.ocr.setPrecision&&i.ocr.setPrecision(e)}),x&&x.addEventListener("change",()=>{let e=String(x.value||u.model);try{localStorage.setItem(y,e)}catch(e){}M({model:e}),i.ocr&&i.ocr.setModel&&i.ocr.setModel(e)}),i.bar={el:a,loadEl:r,set:M,log:k,get:()=>({...u})},w(),k("OCR-Bar ready."),i.bar}async function s(){return(!function(){let e=window;try{for(;e.parent&&e.parent!==e;)e=e.parent}catch(e){}}(),i.tfjs&&i.tfjs.pipeline)?i.tfjs:(i.tfjsLoad=i.tfjsLoad||(async()=>{let e=null;for(let t of["https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2/+esm","https://esm.sh/@xenova/transformers@2.17.2?bundle"])try{try{let e=i.bar;e&&e.log&&e.log("Importing Transformers.js: "+t)}catch(e){}let e=await Function("u","return import(u)")(t),a=e.pipeline||e.default&&e.default.pipeline,n=e.env||e.default&&e.default.env;if(!a||!n)throw Error("Transformers.js ESM export missing (pipeline/env).");let r={pipeline:a,env:n,__url:t};return i.tfjs=r,r}catch(a){e=a;try{let e=i.bar;e&&e.log&&e.log("Import failed: "+t+" — "+(a&&a.message?a.message:String(a)))}catch(e){}}throw e||Error("Failed to load Transformers.js from all CDN URLs.")})(),await i.tfjsLoad)}i.barBoot=!0,o(),l(),setTimeout(l,0),function(){if(i.ocr)return i.ocr;let e=o();i.ocr={model:e.get().model||"Xenova/trocr-small-handwritten",task:"image-to-text",precision:e.get().precision||"fp32",pipe:null,loading:null,setModel:async function(t){let a=String(t||this.model||"Xenova/texify2");return this.model=a,e.set({model:a,loaded:!1,status:"idle",phase:"idle",progress:null}),this.pipe=null,this.loading=null,this.ensureLoaded(!0)},setPrecision:async function(t){let a=String(t||"fp32");return this.precision=a,e.set({precision:a,loaded:!1,status:"idle",phase:"idle",progress:null}),this.pipe=null,this.loading=null,this.ensureLoaded(!0)},ensureLoaded:async function(t){if(this.pipe&&!t)return this.pipe;if(this.loading)return this.loading;let a=this.precision||"fp32",n={fp32:"fp32",fp16:"fp16",int8:"q8"}[a]||"fp32";return e.set({model:this.model,backend:"wasm",precision:a,status:"loading",phase:"import",loaded:!1,progress:0}),e.log("Loading model ("+a+") …"),this.loading=(async()=>{try{let t=await s(),r=t.pipeline,i=t.env;try{i.allowLocalModels=!1,i.allowRemoteModels=!0,i.useBrowserCache=!0,i.backends=i.backends||{},i.backends.onnx=i.backends.onnx||{},i.backends.onnx.wasm=i.backends.onnx.wasm||{}}catch(e){}e.set({phase:"pipeline"});let l=await r(this.task,this.model,{dtype:n,progress_callback:t=>{let a=function(e){try{if(null==e)return null;if("number"==typeof e&&isFinite(e))return Math.max(0,Math.min(1,e));let t=e&&"object"==typeof e?e:null;if(!t)return null;if(isFinite(t.progress))return Math.max(0,Math.min(1,Number(t.progress)));if(isFinite(t.loaded)&&isFinite(t.total)&&Number(t.total)>0)return Math.max(0,Math.min(1,Number(t.loaded)/Number(t.total)))}catch(e){}return null}(t);null!==a&&e.set({progress:a,phase:"download"})}});return this.pipe=l,e.set({status:"ready",phase:"ready",loaded:!0,progress:null}),e.log("Model loaded ("+a+")."),l}catch(t){throw e.set({status:"error",phase:"error",loaded:!1,progress:null}),e.log("Load failed: "+(t&&t.message?t.message:String(t))),t}finally{this.loading=null}})(),this.loading},recognize:async function(t,a){let n=!0===(a&&"object"==typeof a?a:{}).__silent,r=await this.ensureLoaded(!1);e.set({status:"working",phase:"infer",progress:null});let i=null;async function l(e){if(e&&"function"==typeof e.convertToBlob)return await e.convertToBlob({type:"image/png"});if(e&&"function"==typeof e.toBlob)return await new Promise((t,a)=>{e.toBlob(e=>e?t(e):a(Error("toBlob() returned null")),"image/png")});throw Error("Canvas-like has no toBlob/convertToBlob")}async function o(e){if("string"==typeof e)return{input:e,revoke:null};if(e&&"object"==typeof e&&"function"==typeof e.arrayBuffer&&"number"==typeof e.size&&"string"==typeof e.type){let t=URL.createObjectURL(e);return{input:t,revoke:()=>URL.revokeObjectURL(t)}}if(e&&"object"==typeof e&&"number"==typeof e.width&&"number"==typeof e.height&&e.data&&"number"==typeof e.data.length){let t=document.createElement("canvas");t.width=Math.max(1,Math.floor(e.width)),t.height=Math.max(1,Math.floor(e.height)),t.getContext("2d",{willReadFrequently:!0}).putImageData(e,0,0);let a=await l(t),n=URL.createObjectURL(a);return{input:n,revoke:()=>URL.revokeObjectURL(n)}}if(e&&"object"==typeof e){if("function"==typeof e.toDataURL)return{input:e.toDataURL("image/png"),revoke:null};if("function"==typeof e.toBlob||"function"==typeof e.convertToBlob){let t=await l(e),a=URL.createObjectURL(t);return{input:a,revoke:()=>URL.revokeObjectURL(a)}}}throw Error("Unsupported input type for OCR: "+(null===e?"null":typeof e))}try{let l=await o(t);i=l.revoke;let s=a&&"object"==typeof a?a:{},c="number"==typeof s.max_new_tokens&&isFinite(s.max_new_tokens)?Math.max(1,Math.floor(s.max_new_tokens)):96,d=await r(l.input,{max_new_tokens:c,do_sample:!0===s.do_sample,temperature:"number"==typeof s.temperature&&isFinite(s.temperature)?s.temperature:0}),u="";if("string"==typeof d)u=d;else if(Array.isArray(d)&&d.length){let e=d[0]||{};(u=e.generated_text||e.text||e.latex||"")||(u=JSON.stringify(e))}else d&&"object"==typeof d?(u=d.generated_text||d.text||d.latex||"")||(u=JSON.stringify(d)):u=String(d);return e.set({status:"ready",phase:"ready"}),n||e.log("Recognize done."),u}catch(t){throw e.set({status:"error",phase:"error"}),n||e.log("Recognize failed: "+(t&&t.message?t.message:String(t))),t}finally{try{i&&i()}catch(e){}}}}}()}if(i.canvasBoot)return;function c(e){if(!e)return"";if(e.dataset&&e.dataset.uid)return e.dataset.uid;let t="c"+ ++i.uidSeq;return e.dataset.uid=t,t}function d(){if(document.getElementById("__lia_canvas_ocr_css_v1"))return;let e=document.createElement("style");e.id="__lia_canvas_ocr_css_v1",e.textContent=`
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
  `,(document.head||document.documentElement).appendChild(e)}function u(e){try{if(!e)return"";if(e.getAttribute&&"true"===e.getAttribute("contenteditable"))return String(e.textContent||"");if("value"in e)return String(e.value||"")}catch(e){}return""}function p(e){if(!e)return;let t=e.__liaTexPreviewBox||null,a=t?t.querySelector(".lia-tex-preview-math"):null;function n(){try{let r=140;if(t&&a&&"1"===t.dataset.on){let e=a.scrollWidth||a.getBoundingClientRect().width||0,n=t.querySelector(".lia-tex-preview-hint"),i=n&&n.getBoundingClientRect().width||0;r=e+i+32}else{let t=u(e);r=Math.max(140,9.92*t.length+28)}var n=r;let i=Math.max(80,Math.min(Math.ceil(n),function(e){try{let t=e&&e.parentElement?e.parentElement:null;if(!t)return 900;let a=t.getBoundingClientRect();if(!a||!a.width)return 900;return Math.max(80,Math.floor(a.width-8))}catch(e){}return 900}(t||e)));try{e.style.width=i+"px",e.style.maxWidth="100%",e.style.boxSizing="border-box"}catch(e){}if(t)try{t.style.width=i+"px",t.style.maxWidth="100%",t.style.boxSizing="border-box"}catch(e){}if(a)try{a.style.minWidth="0",a.style.maxWidth="100%"}catch(e){}}catch(e){}}requestAnimationFrame(n),setTimeout(n,0),setTimeout(n,60)}i.canvasBoot=!0,i.uidSeq=i.uidSeq||0;var h=null;function f(e,a){let n=String(a||"").trim();if(e.innerHTML="",!n)return!1;let r=e.closest?e.closest(".lia-tex-preview"):null,i=r&&r.previousElementSibling||null,l=t(),o=window.katex||l.katex||null;function s(){i&&p(i)}try{if(o&&"function"==typeof o.render)return o.render(n,e,{throwOnError:!1,displayMode:!1}),s(),!0}catch(e){}return(function(){let e=t(),a=[window.katex,e.katex,window.KaTeX,e.KaTeX];for(let e=0;e<a.length;e++){let t=a[e];if(t&&"function"==typeof t.render)return Promise.resolve(t)}return h||(h=async function(){let t=e.document||document;if(!t.getElementById("__lia_katex_css_v1")){let e=t.createElement("link");e.id="__lia_katex_css_v1",e.rel="stylesheet",e.href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css",(t.head||t.documentElement).appendChild(e)}let a=await Function("u","return import(u)")("https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.mjs"),n=a&&(a.default||a);if(!n||"function"!=typeof n.render)throw Error("KaTeX render not available.");try{e.katex||(e.katex=n)}catch(e){}try{window.katex||(window.katex=n)}catch(e){}return n}())})().then(function(t){if(e&&e.isConnected){e.innerHTML="";try{t.render(n,e,{throwOnError:!1,displayMode:!1})}catch(t){e.textContent=n}s()}}).catch(function(){e&&e.isConnected&&(e.textContent=n,s())}),e.textContent=n,s(),!1}function g(e){if(!e||!e.__liaTexPreviewBox)return;let t=u(e).trim();if(!t){e.__liaTexPreviewBox.dataset.on="0",e.__liaTexPreviewBox.style.display="none",e.style.display="";return}f(e.__liaTexPreviewBox.querySelector(".lia-tex-preview-math"),t),e.__liaTexPreviewBox.dataset.on="1",e.__liaTexPreviewBox.style.display="inline-flex",e.style.display="none",p(e)}function m(e){if(!e)return null;if(e.__liaTexPreviewReady)return e;e.__liaTexPreviewReady=!0;let t=document.createElement("span");return t.className="lia-tex-preview",t.dataset.on="0",t.innerHTML=`
    <span class="lia-tex-preview-math"></span>
    <span class="lia-tex-preview-hint">Bearbeiten</span>
  `,t.addEventListener("click",function(t){t.preventDefault(),t.stopPropagation();if(e&&e.__liaTexPreviewBox){e.__liaTexPreviewBox.dataset.on="0",e.__liaTexPreviewBox.style.display="none",e.style.display="",p(e);try{e.focus(),"function"==typeof e.select&&e.select()}catch(e){}}}),e.insertAdjacentElement("afterend",t),e.__liaTexPreviewBox=t,e.addEventListener("input",function(){f(t.querySelector(".lia-tex-preview-math"),u(e))}),e.addEventListener("blur",function(){setTimeout(function(){g(e)},0)}),e.addEventListener("keydown",function(t){let a=e.tagName&&"TEXTAREA"===e.tagName.toUpperCase()||e.getAttribute&&"true"===e.getAttribute("contenteditable");if("Escape"===t.key){t.preventDefault(),g(e);return}"Enter"!==t.key||a||(t.preventDefault(),g(e))}),g(e),p(e),e}function x(e){try{if(!e||1!==e.nodeType)return null;function t(e){if(!e||1!==e.nodeType)return null;let t=e.querySelector&&e.querySelector('[contenteditable="true"]');if(t)return t;let a=e.querySelectorAll?e.querySelectorAll("input, textarea"):null;return a&&a.length?a[a.length-1]:null}let a=e.previousElementSibling;for(;a;){if(a.matches&&(a.matches("input, textarea")||"true"===a.getAttribute("contenteditable")))return a;let e=t(a);if(e)return e;a=a.previousElementSibling}let n=e;for(let e=0;e<10;e++){let e=n.parentElement;if(!e)break;let a=Array.from(e.children),r=a.indexOf(n);for(let e=r-1;e>=0;e--){let n=a[e];if(n.matches&&(n.matches("input, textarea")||"true"===n.getAttribute("contenteditable")))return n;let r=t(n);if(r)return r}n=e}}catch(e){}return null}function b(e){let t=String(e||""),a=t.indexOf("("),n=t.indexOf(")");if(a<0||n<0)return null;let r=t.slice(a+1,n).split(",").map(e=>Number(String(e).trim()));return!(r.length<3)&&isFinite(r[0])&&isFinite(r[1])&&isFinite(r[2])?[r[0],r[1],r[2]]:null}function y(e){try{let t=e||document,a=t.body||t.documentElement,n=t.querySelector(".lia-btn");if(n){let e=getComputedStyle(n).backgroundColor;if(e&&"rgba(0, 0, 0, 0)"!==e&&"transparent"!==e)return e}let r=t.createElement("button");r.className="lia-btn",r.type="button",r.textContent="x",r.style.position="absolute",r.style.left="-9999px",r.style.top="-9999px",r.style.visibility="hidden",a.appendChild(r);let i=getComputedStyle(r).backgroundColor;if(r.remove(),i&&"rgba(0, 0, 0, 0)"!==i&&"transparent"!==i)return i}catch(e){}return null}function v(){d();try{let e=window.parent&&window.parent.document?window.parent.document:document,t=document.documentElement,a=getComputedStyle(e.body||e.documentElement).backgroundColor||getComputedStyle(e.documentElement).backgroundColor,n=b(a),r=n&&.5>function(e){let[t,a,n]=e.map(e=>e/255).map(e=>e<=.03928?e/12.92:Math.pow((e+.055)/1.055,2.4));return .2126*t+.7152*a+.0722*n}(n)?"#fff":"#000";t.style.setProperty("--canvas-border",r),t.style.setProperty("--canvas-pen",r);let i=y(e)||y(document);i&&t.style.setProperty("--canvas-accent",i),document.dispatchEvent(new Event("lia-canvas-theme"))}catch(e){}}v(),new MutationObserver(()=>v()).observe(document.documentElement,{attributes:!0,attributeFilter:["class","style"]}),window.addEventListener("resize",()=>v());let w=[{key:"auto",value:null},{key:"red",value:"#ff0000"},{key:"orange",value:"#ff7500"},{key:"yellow",value:"#ffff00"},{key:"violett",value:"#ff00ff"},{key:"blue",value:"#0055ff"},{key:"lightblue",value:"#00ffff"},{key:"green",value:"#00ff00"},{key:"darkgreen",value:"#007500"},{key:"black",value:"#000000"},{key:"white",value:"#ffffff"}];function k(){return getComputedStyle(document.documentElement).getPropertyValue("--canvas-pen").trim()||"#000"}function M(){return getComputedStyle(document.documentElement).getPropertyValue("--canvas-accent").trim()||getComputedStyle(document.documentElement).getPropertyValue("--canvas-border").trim()||"#000"}function S(e,t){!e||e.__hasIcon||(e.__hasIcon=!0,e.innerHTML=t)}function _(e,t){let a=b(e);if(a)return`rgba(${a[0]},${a[1]},${a[2]},${t})`;if(String(e).startsWith("#")){let a=String(e).slice(1),n=3===a.length?a[0]+a[0]+a[1]+a[1]+a[2]+a[2]:a,r=parseInt(n.slice(0,2),16),i=parseInt(n.slice(2,4),16),l=parseInt(n.slice(4,6),16);return`rgba(${r},${i},${l},${t})`}return`rgba(0,0,0,${t})`}function C(e,t){let a=Number(e);return isFinite(a)?a:t||0}function E(e,t,a){return Math.max(t,Math.min(a,e))}function A(e){return Math.round(100*C(e,0))/100}function R(e,t){let a=C(t,0);if(!(a>0))return 0;let n=C(e,0)%a;return n<0?n+a:n}function L(e){let t=e&&"object"==typeof e?e:{};return{panX:C(t.panX,0),panY:C(t.panY,0),scale:C(t.scale,1)||1,minScale:C(t.minScale,.25),maxScale:C(t.maxScale,8)}}function T(e,t){let a=C(e&&e.x,0),n=C(e&&e.y,0),r=C(t&&t.scale,1)||1;return{x:a*r+C(t&&t.panX,0),y:n*r+C(t&&t.panY,0)}}function q(e,t,a){if(!e)return null;let n=Math.max(0,C(e.x,0)),r=Math.max(0,C(e.y,0)),i=Math.min(C(t,0),C(e.x,0)+C(e.w,0)),l=Math.min(C(a,0),C(e.y,0)+C(e.h,0));return i<=n||l<=r?null:{x:n,y:r,w:i-n,h:l-r}}function P(e){return e&&e.querySelector?e.querySelector(".lia-canvas-mount"):null}function z(e){let t=P(e);return t?c(t):""}function O(e){let t=i.store||{};return e&&t[e]?t[e]:null}function I(e){return Array.from((e&&e.querySelectorAll?e:document).querySelectorAll(".lia-canvas-pair")).filter(function(e){return!!P(e)})}function B(e,t){let a=Array.isArray(t)?t:[];for(let t=0;t<a.length;t++){let n=a[t];if(!n)continue;if("r"===n.k){e.save(),e.globalCompositeOperation="source-over",e.globalAlpha=1,e.fillStyle=String(n.f||"rgba(0,0,0,0.15)"),e.fillRect(C(n.x,0),C(n.y,0),Math.max(0,C(n.w,0)),Math.max(0,C(n.h,0))),e.restore();continue}let r=Array.isArray(n.p)?n.p:[];if(r.length){e.save(),e.beginPath(),e.moveTo(C(r[0][0],0),C(r[0][1],0));for(let t=1;t<r.length;t++)e.lineTo(C(r[t][0],0),C(r[t][1],0));e.lineCap="round",e.lineJoin="round",e.lineWidth=Math.max(.75,C(n.w,1)),"e"===n.k?(e.globalCompositeOperation="destination-out",e.globalAlpha=1,e.strokeStyle="rgba(0,0,0,1)"):(e.globalCompositeOperation="source-over",e.globalAlpha=E(C(n.a,1),0,1),e.strokeStyle=String(n.c||"#000")),e.stroke(),e.restore()}}}function j(e,t){let a,n,r;if(!e||!t)return null;let i=function(e){let t=e&&"object"==typeof e?e:{},a=Array.isArray(t.ITEMS)?t.ITEMS:[],n=L(t.VIEW||{}),r=Math.max(1,Math.round(C(t.wrapW,0))),i=Math.max(1,Math.round(C(t.canvasH,0))),l=_(M(),.28),o=[];for(let e=0;e<a.length;e++){let t=a[e];if(t&&"object"==typeof t){if("path"===t.kind){let e=Array.isArray(t.points)?t.points:[];if(!e.length)continue;let a=e.map(function(e){let t=T(e,n);return{x:t.x,y:t.y}}),l=Math.max(.75,C(t.width,1)*C(n.scale,1));if(!q(function(e,t){let a=Array.isArray(e)?e:[];if(!a.length)return null;let n=1/0,r=1/0,i=-1/0,l=-1/0;for(let e=0;e<a.length;e++){let t=a[e],o=C(t&&t.x,0),s=C(t&&t.y,0);o<n&&(n=o),s<r&&(r=s),o>i&&(i=o),s>l&&(l=s)}let o=Math.max(0,C(t,0));return{x:n-o,y:r-o,w:Math.max(0,i-n+2*o),h:Math.max(0,l-r+2*o)}}(a,l/2+2),r,i))continue;o.push({k:"eraser"===t.tool?"e":"p",c:String(t.color||k()),a:E(C(t.alpha,1),0,1),w:A(l),p:a.map(function(e){return[A(e.x),A(e.y)]})});continue}if("rect"===t.kind){let e=T({x:t.x0,y:t.y0},n),a=T({x:t.x1,y:t.y1},n),s=function(e,t,a,n){let r=Math.min(C(e,0),C(a,0)),i=Math.min(C(t,0),C(n,0));return{x:r,y:i,w:Math.max(0,Math.max(C(e,0),C(a,0))-r),h:Math.max(0,Math.max(C(t,0),C(n,0))-i)}}(e.x,e.y,a.x,a.y);if(!q(s,r,i))continue;let c=E(C(t.alpha,.28),0,1),d=t.color?_(t.color,c):_(M(),c);o.push({k:"r",f:d||l,x:A(s.x),y:A(s.y),w:A(s.w),h:A(s.h)});continue}}}return{vw:r,vh:i,items:o}}(t),l=Math.max(1,0|i.vw),o=Math.max(1,0|i.vh),s=Array.isArray(i.items)?i.items:[],c=document.createElement("canvas");c.width=l,c.height=o;let d=c.getContext("2d",{willReadFrequently:!0});d.clearRect(0,0,l,o),B(d,s);let u=function(e){if(!e)return null;let t=e.getContext("2d",{willReadFrequently:!0}),a=0|e.width,n=0|e.height;if(!(a>0&&n>0))return null;let r=t.getImageData(0,0,a,n).data,i=a,l=n,o=-1,s=-1;for(let e=0;e<n;e++){let t=e*a*4;for(let n=0;n<a;n++)!(r[t+4*n+3]<=10)&&(n<i&&(i=n),e<l&&(l=e),n>o&&(o=n),e>s&&(s=e))}if(o<0)return null;let c=Math.max(0,Math.round(C(8,0)));return{x:i=Math.max(0,i-c),y:l=Math.max(0,l-c),w:Math.max(1,(o=Math.min(a-1,o+c))-i+1),h:Math.max(1,(s=Math.min(n-1,s+c))-l+1)}}(c);return u?{v:"cvf1",u:String(e),w:u.w,h:u.h,bg:function(e,t){let a=e&&"object"==typeof e?e:{},n=L(a.VIEW||{}),r=String(a.bgMode||"none");if("grid"!==r&&"lined"!==r)return{m:"none"};let i=Math.max(1,C(a.bgStep,24))*Math.max(1e-4,C(n.scale,1));if(!(i>0))return{m:"none"};let l=C(t&&t.x,0),o=C(t&&t.y,0);return{m:r,s:A(i),ox:A(R(C(n.panX,0)-l,i)),oy:A(R(C(n.panY,0)-o,i)),c:_(M(),.65),lw:1.125}}(t,u),it:(a=Array.isArray(s)?s:[],n=C(u&&u.x,0),r=C(u&&u.y,0),a.map(function(e){return e?"r"===e.k?{k:"r",f:String(e.f||""),x:A(C(e.x,0)-n),y:A(C(e.y,0)-r),w:A(C(e.w,0)),h:A(C(e.h,0))}:{k:"e"===e.k?"e":"p",c:String(e.c||""),a:E(C(e.a,1),0,1),w:A(C(e.w,1)),p:(Array.isArray(e.p)?e.p:[]).map(function(e){return[A(C(e&&e[0],0)-n),A(C(e&&e[1],0)-r)]})}:null}).filter(Boolean))}:{v:"cvf1",u:String(e),e:1,w:0,h:0,bg:{m:"none"},it:[]}}function F(e){let t=z(e);if(!t)return null;let a=O(t);return a?j(t,a):null}function H(e){return!!(e&&1!==e.e&&C(e.w,0)>0&&C(e.h,0)>0&&Array.isArray(e.it)&&e.it.length)}function W(e,t){if(!e||!t)return null;let a=Math.max(1,Math.round(C(t.w,1))),n=Math.max(1,Math.round(C(t.h,1))),r=window.devicePixelRatio||1;e.width=Math.max(1,Math.round(a*r)),e.height=Math.max(1,Math.round(n*r)),e.style.width=a+"px",e.style.height=n+"px";let i=e.getContext("2d",{willReadFrequently:!0});return i.setTransform(r,0,0,r,0,0),i.clearRect(0,0,a,n),!function(e,t,a,n){let r=t&&"object"==typeof t?t:{},i=String(r.m||"none");if("grid"!==i&&"lined"!==i)return;let l=Math.max(1,C(r.s,1)),o=R(C(r.ox,0),l),s=R(C(r.oy,0),l),c=String(r.c||_(M(),.65)),d=Math.max(.5,C(r.lw,1.125));if(e.save(),e.globalCompositeOperation="source-over",e.globalAlpha=1,e.strokeStyle=c,e.lineWidth=d,"grid"===i){e.beginPath();for(let t=o;t<=a;t+=l)e.moveTo(t,0),e.lineTo(t,n);for(let t=s;t<=n;t+=l)e.moveTo(0,t),e.lineTo(a,t);e.stroke(),e.restore();return}if("lined"===i){e.beginPath();for(let t=s;t<=n;t+=l)e.moveTo(0,t),e.lineTo(a,t);e.stroke(),e.restore()}}(i,t.bg||{m:"none"},a,n),B(i,Array.isArray(t.it)?t.it:[]),e}function N(e,t){if(!e||!(e instanceof Element)||!t)return null;if(e.dataset.open="1",e.innerHTML="",!H(t)){let t=document.createElement("span");return t.className="lia-canvas-freeze-empty",t.textContent="Keine sichtbaren Canvas-Inhalte eingefroren.",e.appendChild(t),t}let a=document.createElement("span");a.className="lia-draw-block";let n=document.createElement("span");n.className="lia-draw-wrap";let r=document.createElement("canvas");return r.className="lia-canvas-freeze-preview",r.setAttribute("aria-label","Eingefrorene Zeichenfläche"),n.appendChild(r),a.appendChild(n),e.appendChild(a),W(r,t),r}function $(){document.querySelectorAll(".lia-draw-wrap canvas.lia-draw:not([data-ready])").forEach(e=>{e.setAttribute("data-ready","1"),function(e){let t=e.closest(".lia-draw-wrap");if(!t)return;let n=c(t.closest(".lia-canvas-mount")),r=t.querySelector(".lia-undo-btn"),l=t.querySelector(".lia-redo-btn"),o=t.querySelector(".lia-color-btn"),s=t.querySelector(".lia-eraser-btn"),d=t.querySelector(".lia-rect-btn"),u=t.querySelector(".lia-bgmenu-btn"),p=t.querySelector(".lia-tool-menu"),h=document.createElement("button");h.type="button",h.className="lia-rect-action",h.textContent="Als Lösung übergeben",h.style.display="none",t.appendChild(h);let f=document.createElement("div");f.className="lia-rect-progress",f.dataset.on="0",f.innerHTML=`
    <div class="lia-rect-progbar"><div class="lia-rect-progfill"></div></div>
    <div class="lia-rect-progtxt">0%</div>
  `,t.appendChild(f);let b=f.querySelector(".lia-rect-progfill"),y=f.querySelector(".lia-rect-progtxt");f.addEventListener("pointerdown",e=>{e.preventDefault(),e.stopPropagation()}),h.addEventListener("pointerdown",e=>{e.preventDefault(),e.stopPropagation()});let v=document.createElement("button");v.type="button",v.className="lia-rect-close",v.setAttribute("aria-label","Marker-Rechteck entfernen"),v.style.display="none",v.innerHTML=`
    <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 7L17 17M17 7L7 17"
        fill="none"
        stroke="currentColor"
        stroke-width="2.4"
        stroke-linecap="round"/>
    </svg>
  `,t.appendChild(v);let C=document.createElement("span");C.className="lia-eraser-ring",C.dataset.on="0",t.appendChild(C),v.addEventListener("pointerdown",e=>{e.preventDefault(),e.stopPropagation()}),v.addEventListener("click",e=>{e.preventDefault(),e.stopPropagation(),function(){let e=!1;for(let t=Q.length-1;t>=0;t--)Q[t]&&"rect"===Q[t].kind&&(Q.splice(t,1),e=!0);for(let t=J.length-1;t>=0;t--)J[t]&&"rect"===J[t].kind&&(J.splice(t,1),e=!0);e&&(e_(),eE(),eA(),ec()),ey()}()}),S(r,`
      <svg viewBox="-4 0 24 24" aria-hidden="true">
        <path d="M21 8H10.2V4L2 12l8.2 8v-4H21V8z" fill="var(--canvas-border)"/>
        <rect x="10.2" y="10.6" width="10.8" height="2.8" rx="1.4" fill="var(--canvas-border)"/>
      </svg>
    `),S(l,`
      <svg viewBox="-4 0 24 24" aria-hidden="true">
        <path d="M3 8h10.8V4l8.2 8-8.2 8v-4H3V8z" fill="var(--canvas-border)"/>
        <rect x="3" y="10.6" width="10.8" height="2.8" rx="1.4" fill="var(--canvas-border)"/>
      </svg>
    `),S(s,`
      <svg viewBox="-4 4 24 24" aria-hidden="true">
        <path class="ico-stroke" d="M4 16.5l8.6-8.6a2 2 0 0 1 2.8 0l4.1 4.1a2 2 0 0 1 0 2.8L12.8 23H7.6L4 19.4a2 2 0 0 1 0-2.9z"
              fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path class="ico-stroke" d="M8 23h8" fill="none" stroke-width="2" stroke-linecap="round"/>
        <path class="ico-stroke" d="M9.2 14.3l6.5 6.5" fill="none" stroke-width="2" stroke-linecap="round"/>
      </svg>
    `),S(d,`
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
    `),u&&!u.__bgCleared&&(u.__bgCleared=!0,u.innerHTML="");let E=e.getContext("2d",{willReadFrequently:!0}),A=document.createElement("canvas"),R=A.getContext("2d",{willReadFrequently:!0}),L=document.createElement("canvas"),T=L.getContext("2d",{willReadFrequently:!0}),q=i.store,P=n&&q[n]?q[n]:null,z=P&&P.VIEW?{...P.VIEW}:{panX:0,panY:0,scale:1,minScale:.25,maxScale:8},O=0,I=!1;function B(e){try{let t=i.bar;t&&t.log&&t.log(e)}catch(e){}}function j(e){let t=String(e||""),a="",n=!1;for(let e=0;e<t.length;e++){let r=t[e];" "===r||"\n"===r||"\r"===r||"	"===r||"\f"===r?(n||(a+=" "),n=!0):(a+=r,n=!1)}return a.trim()}function F(e){let t=String(e||"").trim();return t.startsWith("$$")&&t.endsWith("$$")&&(t=t.slice(2,-2).trim()),t.startsWith("$")&&t.endsWith("$")&&(t=t.slice(1,-1).trim()),t.startsWith("\\[")&&t.endsWith("\\]")&&(t=t.slice(2,-2).trim()),j(t)}function H(e){let t=String(e||"").trim(),a="\\mathrm{";if(t.startsWith(a)&&t.endsWith("}")){t=t.slice(a.length,-1);let e="";for(let a=0;a<t.length;a++){let n=t[a];"~"!==n&&(e+=n)}return e.trim()}return t}function W(e){let t=Math.max(e.width,e.height),a=1;if(t<420&&(a=420/t),t>1400&&(a=1400/t),.06>Math.abs((a=eg(a,.5,4))-1))return e;let n=document.createElement("canvas");n.width=Math.max(1,Math.round(e.width*a)),n.height=Math.max(1,Math.round(e.height*a));let r=n.getContext("2d",{willReadFrequently:!0});return r.fillStyle="#fff",r.fillRect(0,0,n.width,n.height),r.drawImage(e,0,0,n.width,n.height),n}function N(e){let t=document.createElement("canvas");t.width=Math.max(1,0|e.width),t.height=Math.max(1,0|e.height);let a=t.getContext("2d",{willReadFrequently:!0});a.fillStyle="#fff",a.fillRect(0,0,t.width,t.height),a.drawImage(e,0,0);let n=a.getImageData(0,0,t.width,t.height).data,r=t.width,i=t.height,l=new Uint8Array(r*i);for(let e=0,t=0;t<l.length;t++,e+=4){let a=.299*n[e]+.587*n[e+1]+.114*n[e+2];l[t]=+(a<200)}let o=l;for(let e=0;e<0;e++)o=function(e){let t=new Uint8Array(r*i);for(let a=1;a<i-1;a++)for(let n=1;n<r-1;n++){let i=0,l=a*r+n;for(let t=-1;t<=1;t++)for(let a=-1;a<=1;a++)if(e[l+t*r+a]){i=1,t=2;break}t[l]=i}return t}(o);let s=r,c=i,d=-1,u=-1;for(let e=0;e<i;e++)for(let t=0;t<r;t++)o[e*r+t]&&(t<s&&(s=t),e<c&&(c=e),t>d&&(d=t),e>u&&(u=e));if(d<0)return t;s=Math.max(0,s-18),c=Math.max(0,c-18);let p=Math.max(1,(d=Math.min(r-1,d+18))-s+1),h=Math.max(1,(u=Math.min(i-1,u+18))-c+1),f=document.createElement("canvas");f.width=p,f.height=h;let g=f.getContext("2d",{willReadFrequently:!0}),m=g.createImageData(p,h),x=m.data;for(let e=0;e<h;e++)for(let t=0;t<p;t++){let a=255*!o[(c+e)*r+(s+t)],n=(e*p+t)*4;x[n]=a,x[n+1]=a,x[n+2]=a,x[n+3]=255}g.putImageData(m,0,0);let b=512/Math.max(p,h);b<.75&&(b=.75),b>3.5&&(b=3.5);let y=document.createElement("canvas");y.width=Math.max(1,Math.round(p*b)),y.height=Math.max(1,Math.round(h*b));let v=y.getContext("2d",{willReadFrequently:!0});return v.fillStyle="#fff",v.fillRect(0,0,y.width,y.height),v.imageSmoothingEnabled=!0,v.drawImage(f,0,0,y.width,y.height),y}function $(e){let t=String(e||"").trim();if(!t||-1!==t.indexOf("\\"))return null;let a={O:"0",o:"0",Q:"0",D:"0",I:"1",l:"1","|":"1","!":"1",Z:"2",z:"2",S:"5",s:"5",B:"8",g:"9",q:"9"},n="";for(let e=0;e<t.length;e++){let r=t[e],i=t.charCodeAt(e);if(i>=48&&i<=57){n+=r;continue}if(" "!==r&&"\n"!==r&&"\r"!==r&&"	"!==r&&"$"!==r&&"{"!==r&&"}"!==r&&"("!==r&&")"!==r&&"["!==r&&"]"!==r&&","!==r&&"."!==r&&":"!==r&&";"!==r&&"_"!==r&&"-"!==r){if(a[r]){n+=a[r];continue}return null}}return(n=String(n).trim())&&!(n.length>3)?n:null}function D(e,t){let a=t*Math.PI/180,n=0|e.width,r=0|e.height,i=document.createElement("canvas");i.width=Math.max(1,n),i.height=Math.max(1,r);let l=i.getContext("2d",{willReadFrequently:!0});return l.fillStyle="#fff",l.fillRect(0,0,i.width,i.height),l.translate(i.width/2,i.height/2),l.rotate(a),l.translate(-n/2,-r/2),l.imageSmoothingEnabled=!1,l.drawImage(e,0,0),i}function X(e,t){let a=+(1===(t&&"object"==typeof t?t:{}).dilate),n=document.createElement("canvas");n.width=Math.max(1,0|e.width),n.height=Math.max(1,0|e.height);let r=n.getContext("2d",{willReadFrequently:!0});r.fillStyle="#fff",r.fillRect(0,0,n.width,n.height),r.drawImage(e,0,0);let i=r.getImageData(0,0,n.width,n.height).data,l=n.width,o=n.height,s=new Uint8Array(l*o);for(let e=0,t=0;t<s.length;t++,e+=4){let a=.299*i[e]+.587*i[e+1]+.114*i[e+2];s[t]=+(a<225)}1===a&&(s=function(e){let t=new Uint8Array(l*o);for(let a=1;a<o-1;a++)for(let n=1;n<l-1;n++){let r=a*l+n,i=0;for(let t=-1;t<=1;t++)for(let a=-1;a<=1;a++)if(e[r+t*l+a]){i=1,t=2;break}t[r]=i}return t}(s));let c=l,d=o,u=-1,p=-1;for(let e=0;e<o;e++)for(let t=0;t<l;t++)s[e*l+t]&&(t<c&&(c=t),e<d&&(d=e),t>u&&(u=t),e>p&&(p=e));if(u<0)return N(e);let h=Math.max(1,u-c+1),f=Math.max(1,p-d+1),g=Math.max(24,Math.floor(.35*Math.max(h,f))),m=Math.max(64,Math.min(1024,Math.max(h,f)+2*g)),x=document.createElement("canvas");x.width=m,x.height=m;let b=x.getContext("2d",{willReadFrequently:!0}),y=b.createImageData(m,m),v=y.data;for(let e=0;e<v.length;e+=4)v[e]=255,v[e+1]=255,v[e+2]=255,v[e+3]=255;let w=Math.floor((m-h)/2),k=Math.floor((m-f)/2);for(let e=0;e<f;e++)for(let t=0;t<h;t++){let a=255*!s[(d+e)*l+(c+t)],n=((k+e)*m+(w+t))*4;v[n]=a,v[n+1]=a,v[n+2]=a,v[n+3]=255}b.putImageData(y,0,0);let M=document.createElement("canvas");M.width=512,M.height=512;let S=M.getContext("2d",{willReadFrequently:!0});return S.fillStyle="#fff",S.fillRect(0,0,512,512),S.imageSmoothingEnabled=!1,S.drawImage(x,0,0,512,512),M}async function U(e,t){let a=[],n=X(t,{dilate:0}),r=X(t,{dilate:1}),i=[0,-6,6];for(let e=0;e<i.length;e++)a.push(D(n,i[e]));for(let e=0;e<i.length;e++)a.push(D(r,i[e]));let l={},o=[];for(let t=0;t<a.length;t++){let n="";try{n=await e.recognize(a[t],{max_new_tokens:8,do_sample:!1,temperature:0,__silent:!0})}catch(e){continue}let r=F(n),i=$(r=H(r));if(i&&(l[i]||(l[i]=0,o.push(i)),l[i]+=1,l[i]>=3))return i}let s=null,c=0;for(let e=0;e<o.length;e++){let t=o[e],a=l[t]||0;a>c&&(c=a,s=t)}return s}let Y=0,V=0;function K(e){if(!f||!b||!y)return;let t=Math.max(0,Math.min(1,Number(e)));b.style.width=Math.round(100*t)+"%",y.textContent=Math.round(100*t)+"%"}async function Z({auto:a=!1}={}){let n,r=ef();if(!r)return void B("No marker-rectangle found.");let l=i.ocr;if(!l||!l.recognize)return void B("OCR engine not available (LIA.ocr).");let o=h.textContent;h.disabled=!0,h.textContent="Schrifterkennung läuft...",f&&(f.dataset.on="1",K(0),ey()),V=performance.now(),n=()=>{let e=performance.now()-V;K(e<900?e/900*.7:e<2200?.7+(e-900)/1300*.2:.9+Math.min(.08,(e-2200)/5e3*.08)),Y=requestAnimationFrame(n)},Y=requestAnimationFrame(n);try{l.ensureLoaded&&await l.ensureLoaded(!1);let a=function(t){if(!t)return null;let a=window.devicePixelRatio||1,n=Math.min(t.x0,t.x1),r=Math.min(t.y0,t.y1),i=Math.max(t.x0,t.x1),l=Math.max(t.y0,t.y1),o=ew(n,r),s=ew(i,l),c=Math.min(o.sx,s.sx),d=Math.min(o.sy,s.sy),u=Math.max(o.sx,s.sx),p=Math.max(o.sy,s.sy);c=eg(c,0,e.clientWidth),d=eg(d,0,e.clientHeight),u=eg(u,0,e.clientWidth),p=eg(p,0,e.clientHeight);let h=u-c,f=p-d;if(h<6||f<6)return null;let g=Math.round((c-12)*a),m=Math.round((d-12)*a),x=Math.round((h+24)*a),b=Math.round((f+24)*a),y=document.createElement("canvas");y.width=Math.max(1,x),y.height=Math.max(1,b);let v=y.getContext("2d",{willReadFrequently:!0});v.setTransform(1,0,0,1,0,0),v.globalCompositeOperation="source-over",v.globalAlpha=1,v.clearRect(0,0,y.width,y.height);let w=L.width,k=L.height,M=g,S=m,_=x,C=b,E=0,A=0,R=y.width,T=y.height;if(M<0){let e=-M/_;E+=R*e,R-=R*e,_+=M,M=0}if(S<0){let e=-S/C;A+=T*e,T-=T*e,C+=S,S=0}if(M+_>w){let e=M+_-w,t=e/_;R-=R*t,_-=e}if(S+C>k){let e=S+C-k,t=e/C;T-=T*t,C-=e}if(_<=1||C<=1||R<=1||T<=1)return null;v.drawImage(L,M,S,_,C,E,A,R,T);let q=v.getImageData(0,0,y.width,y.height),P=q.data;for(let e=0;e<P.length;e+=4)P[e+3]>10?(P[e]=0,P[e+1]=0,P[e+2]=0):(P[e]=255,P[e+1]=255,P[e+2]=255),P[e+3]=255;return v.putImageData(q,0,0),y}(r);if(!a)return void B("Crop failed (rect too small or out of bounds).");a.width,a.height;let n=function(e){try{let t=0|e.width,a=0|e.height,n=e.getContext("2d",{willReadFrequently:!0}).getImageData(0,0,t,a).data,r=t*a>12e5?2:1,i=t,l=a,o=-1,s=-1,c=0;for(let e=0;e<a;e+=r){let a=e*t*4;for(let d=0;d<t;d+=r)n[a+4*d]<128&&(c++,d<i&&(i=d),e<l&&(l=e),d>o&&(o=d),e>s&&(s=e))}if(o<0)return null;let d=o-i+1,u=s-l+1;return{xMin:i,yMin:l,xMax:o,yMax:s,w:d,h:u,black:c,W:t,H:a}}catch(e){}return null}(a),i=function(e,t){if(!e||!t)return!1;let a=Math.max(1,0|t.width),n=Math.max(1,0|t.height),r=Math.max(1,0|e.w),i=Math.max(1,0|e.h),l=Math.max(r,i),o=Math.min(r,i),s=r/Math.max(1,i),c=(Number(e.black||0)||0)/Math.max(1,r*i);return!(l>220||o>170||s<.2||s>2.8||c<.01||c>.6||r>Math.floor(.82*a)&&i>Math.floor(.82*n)&&l>140)}(n,a),s=String(l.model||""),c=-1!==s.toLowerCase().indexOf("trocr"),d=a,u="";try{d=i?X(a,{dilate:0}):N(a)}catch(e){d=a}try{d=W(d)}catch(e){}if(u=await l.recognize(d,i?{max_new_tokens:16,do_sample:!1,temperature:0}:{max_new_tokens:128,do_sample:!1,temperature:0}),i){let e=String(u||"").trim();if(-1!==e.indexOf("\\")||-1!==e.indexOf("{")||-1!==e.indexOf("}")||-1!==e.indexOf("^")||-1!==e.indexOf("_")||-1!==e.indexOf("sqrt")||-1!==e.indexOf("frac")||function(e){let t=String(e||"").trim();if(!t||/[+\-*/=,:;\\]$/.test(t)||/[{[(]$/.test(t))return!0;let a=0,n=0,r=0,i=!1;for(let e=0;e<t.length;e++){let l=t[e];if(i){i=!1;continue}if("\\"===l){i=!0;continue}"{"===l?a++:"}"===l?a--:"["===l?n++:"]"===l?n--:"("===l?r++:")"===l&&r--}return 0!==a||0!==n||0!==r}(e)){let e=a;try{e=N(a)}catch(t){e=a}try{e=W(e)}catch(e){}u=await l.recognize(e,{max_new_tokens:128,do_sample:!1,temperature:0})}}let p="";if(c?p=function(e){let t=j(e),a="+-=*/()[]{}",n="";for(let e=0;e<t.length;e++){let r=t[e];if(" "===r){let r=e>0?t[e-1]:"",i=e+1<t.length?t[e+1]:"";if(a.indexOf(r)>=0||a.indexOf(i)>=0)continue;n+=" "}else n+=r}return n.trim()}(u):(p=F(u),p=H(p)),i||function(e){let t=String(e||"").trim();if(!t||t.length>6||-1!==t.indexOf("\\"))return!1;let a=!1;for(let e=0;e<t.length;e++){let n=t.charCodeAt(e),r=t[e];if(n>=48&&n<=57||"l"===r||"L"===r||"I"===r||"i"===r||"|"===r||"!"===r||"O"===r||"o"===r||"Q"===r||"q"===r||"S"===r||"s"===r||"Z"===r||"z"===r||"B"===r||"g"===r){a=!0;continue}if(" "!==r&&"\n"!==r&&"\r"!==r&&"	"!==r&&"("!==r&&")"!==r&&"["!==r&&"]"!==r&&"{"!==r&&"}"!==r&&"."!==r&&","!==r&&":"!==r&&";"!==r&&"_"!==r&&"-"!==r)return!1}return a}(p)){let e=$(p);if(e)p=e;else{let e=function(e){let t=String(e||"").trim();if(!t)return null;let a=!0;for(let e=0;e<t.length;e++){let n=t.charCodeAt(e);if(n<48||n>57){a=!1;break}}if(a)return t;let n=t.toLowerCase();if("li"===n||"l1"===n||"il"===n)return"4";if("go"===n||"g0"===n||"qo"===n||"q0"===n)return"8";let r={O:"0",o:"0",Q:"0",I:"1",l:"1","|":"1","!":"1",Z:"2",z:"2",J:"3",j:"3",H:"4",h:"4",S:"5",s:"5",B:"8",g:"9",q:"9"},i="";for(let e=0;e<t.length;e++){let a=t[e];if(!r[a])return null;i+=r[a]}return i||null}(p);e&&(p=e)}if(!function(e){let t=String(e||"").trim();if(!t)return!1;for(let e=0;e<t.length;e++){let a=t.charCodeAt(e);if(a<48||a>57)return!1}return!0}(p)){let e=await U(l,a);e&&(p=e)}}B("OCR result: "+p);let f=t.closest(".lia-canvas-pair");!function(e,t){let a=x(e);if(!a||!function(e,t){let a=String(t);try{if(e&&e.getAttribute&&"true"===e.getAttribute("contenteditable"))return e.textContent=a,e.dispatchEvent(new Event("input",{bubbles:!0})),e.dispatchEvent(new Event("change",{bubbles:!0})),!0;if(e&&"value"in e)return e.value=a,e.dispatchEvent(new Event("input",{bubbles:!0})),e.dispatchEvent(new Event("change",{bubbles:!0})),!0}catch(e){}return!1}(a,t))return!1;function n(){let t=x(e);t&&(m(t),g(t))}return setTimeout(n,0),setTimeout(n,80),setTimeout(n,180),!0}(f||t,p)?B("Could not find an input field before this @canvas."):(h.textContent="✅ übernommen",setTimeout(()=>{h.textContent=o},900))}catch(e){B("OCR error: "+(e&&e.message?e.message:String(e))),h.textContent="⚠ Fehler",setTimeout(()=>{h.textContent=o},900)}finally{Y&&(cancelAnimationFrame(Y),Y=0),K(1),setTimeout(()=>void(f&&(f.dataset.on="0",K(0))),250),h.disabled=!1}}h.addEventListener("click",async e=>{e.preventDefault(),e.stopPropagation(),await Z({auto:!1})});let Q=[],J=[];P&&(Array.isArray(P.ITEMS)?(Q=P.ITEMS,J=Array.isArray(P.REDO)?P.REDO:[]):Array.isArray(P.STROKES)&&(Q=P.STROKES.map(e=>({kind:"path",...e})),J=Array.isArray(P.REDO)?P.REDO.map(e=>({kind:"path",...e})):[]));let G="pen",ee="pen",et=0,ea=3,en=1,er=12,ei=P&&P.bgMode?P.bgMode:"none",el=P&&P.bgStep?P.bgStep:24,eo=null,es=null;function ec(r){if(n){var i;q[n]={VIEW:{...z},ITEMS:Q,REDO:J,bgMode:ei,bgStep:el,wrapW:t.getBoundingClientRect().width,canvasH:e.clientHeight},i=r||"persist",!n||I&&(clearTimeout(O),O=setTimeout(()=>{var e={uid:n,reason:String(i||"persist"),hasItems:Array.isArray(Q)&&Q.length>0?1:0};try{let t=Object.assign({ts:Date.now()},e&&!0?e:{});(a&&"function"==typeof a.dispatchEvent?a:window).dispatchEvent(new CustomEvent("lia:canvas-change",{detail:t}))}catch(e){}},120))}}function ed(){let e=w[et]||w[0];return"auto"===e.key?k():e.value||k()}function eu(e){p&&(p.dataset.open=e?"1":"0")}function ep(){p&&"1"===p.dataset.open&&eu(!1)}function eh(){return`
      <svg viewBox="-1 0 24 24" aria-hidden="true" style="width:22px;height:22px;display:block;">
        <path class="ico-stroke" d="M6 6l12 12M18 6L6 18" stroke-width="2" stroke-linecap="round"/>
      </svg>
    `}function ef(){for(let e=Q.length-1;e>=0;e--){let t=Q[e];if(t&&"rect"===t.kind)return t}return null}function eg(e,t,a){return Math.max(t,Math.min(a,e))}function em(){C&&(C.dataset.on="0")}function ex(t,a){if(!C)return;if("eraser"!==G||!isFinite(t)||!isFinite(a))return void em();let n=Math.max(8,er*z.scale);C.style.width=n+"px",C.style.height=n+"px",C.style.left=eg(t,0,e.clientWidth)+"px",C.style.top=eg(a,0,e.clientHeight)+"px",C.dataset.on="1"}let eb=0;function ey(){eb||(eb=requestAnimationFrame(()=>{eb=0,function(){let t=ef();if(!t){h.style.display="none",v&&(v.style.display="none");return}h.style.display="block",h.style.visibility="hidden";let a=h.offsetWidth||180,n=h.offsetHeight||34;h.style.visibility="visible";let r=Math.min(t.x0,t.x1),i=Math.min(t.y0,t.y1),l=Math.max(t.x0,t.x1),o=Math.max(t.y0,t.y1),s=ew(r,i),c=ew(l,o),d=Math.max(s.sx,c.sx),u=Math.max(s.sy,c.sy),p=d-a,g=u+8;if(p=eg(p,6,e.clientWidth-a-6),g=eg(g,6,e.clientHeight-n-6),h.style.left=p+"px",h.style.top=g+"px",f){f.style.width=a+"px";let t=p,r=g+n+6,i=f.offsetHeight||26;t=eg(t,6,e.clientWidth-a-6),r=eg(r,6,e.clientHeight-i-6),f.style.left=t+"px",f.style.top=r+"px"}if(v){v.style.display="block",v.style.visibility="hidden";let t=v.offsetWidth||24,a=v.offsetHeight||24;v.style.visibility="visible";let n=Math.min(s.sy,c.sy),r=Math.max(s.sx,c.sx)-.5*t,i=n-.5*a;r=eg(r,6,e.clientWidth-t-6),i=eg(i,6,e.clientHeight-a-6),v.style.left=r+"px",v.style.top=i+"px"}}()}))}function ev(e,t){return{x:(e-z.panX)/z.scale,y:(t-z.panY)/z.scale}}function ew(e,t){return{sx:e*z.scale+z.panX,sy:t*z.scale+z.panY}}function ek(e){let t=window.devicePixelRatio||1;e.setTransform(t*z.scale,0,0,t*z.scale,t*z.panX,t*z.panY)}function eM(t){let a=window.devicePixelRatio||1;t.setTransform(a,0,0,a,0,0),t.globalCompositeOperation="source-over",t.globalAlpha=1,t.clearRect(0,0,e.clientWidth,e.clientHeight)}function eS(e,t){"eraser"===t.tool?(e.globalCompositeOperation="destination-out",e.globalAlpha=1,e.strokeStyle="rgba(0,0,0,1)"):(e.globalCompositeOperation="source-over",e.globalAlpha=t.alpha,e.strokeStyle=t.color),e.lineWidth=t.width,e.lineCap="round",e.lineJoin="round"}function e_(){for(let e of(eM(R),ek(R),Q)){if(!e||"rect"!==e.kind)continue;let t=_("accent"===e.colorKey?M():e.color||M(),Math.max(0,Math.min(1,e.alpha))),a=Math.min(e.x0,e.x1),n=Math.min(e.y0,e.y1),r=Math.max(e.x0,e.x1),i=Math.max(e.y0,e.y1);R.save(),R.globalCompositeOperation="source-over",R.globalAlpha=1,R.fillStyle=t,R.fillRect(a,n,Math.max(0,r-a),Math.max(0,i-n)),R.restore()}}function eC(){for(let e of(eM(T),ek(T),Q))if(e&&"path"===e.kind&&e.points&&!(e.points.length<2)){eS(T,e),T.beginPath(),T.moveTo(e.points[0].x,e.points[0].y);for(let t=1;t<e.points.length;t++){let a=e.points[t];T.lineTo(a.x,a.y)}T.stroke()}}function eE(){let t;t=window.devicePixelRatio||1,E.setTransform(t,0,0,t,0,0),E.globalCompositeOperation="source-over",E.globalAlpha=1,E.clearRect(0,0,e.clientWidth,e.clientHeight),function(){let t,a;if("none"===ei)return;let n=window.devicePixelRatio||1;E.setTransform(n*z.scale,0,0,n*z.scale,n*z.panX,n*z.panY);let r=Math.max(6,Number(el)||24),i=(t=e.clientWidth,a=e.clientHeight,{x0:(0-z.panX)/z.scale,y0:(0-z.panY)/z.scale,x1:(t-z.panX)/z.scale,y1:(a-z.panY)/z.scale}),l=_(M(),.65);E.save(),E.globalCompositeOperation="source-over",E.globalAlpha=1,E.strokeStyle=l,E.lineWidth=1.125/z.scale;let o=Math.floor(i.x0/r)*r,s=Math.ceil(i.x1/r)*r,c=Math.floor(i.y0/r)*r,d=Math.ceil(i.y1/r)*r;if("grid"===ei){let e=0;E.beginPath();for(let t=o;t<=s&&(E.moveTo(t,i.y0),E.lineTo(t,i.y1),!(++e>4e3));t+=r);for(let t=c;t<=d&&(E.moveTo(i.x0,t),E.lineTo(i.x1,t),!(++e>4e3));t+=r);E.stroke()}if("lined"===ei){let e=0;E.beginPath();for(let t=c;t<=d&&(E.moveTo(i.x0,t),E.lineTo(i.x1,t),!(++e>4e3));t+=r);E.stroke()}E.restore()}();let a=window.devicePixelRatio||1;if(E.setTransform(a,0,0,a,0,0),E.globalCompositeOperation="source-over",E.globalAlpha=1,E.drawImage(A,0,0,A.width,A.height,0,0,e.clientWidth,e.clientHeight),es){let e=_(M(),.28),t=Math.min(es.x0,es.x1),a=Math.min(es.y0,es.y1),n=Math.max(es.x0,es.x1),r=Math.max(es.y0,es.y1),i=ew(t,a),l=ew(n,r);E.save(),E.fillStyle=e,E.globalAlpha=1,E.fillRect(i.sx,i.sy,Math.max(0,l.sx-i.sx),Math.max(0,l.sy-i.sy)),E.restore()}E.drawImage(L,0,0,L.width,L.height,0,0,e.clientWidth,e.clientHeight),ey()}function eA(){let e=ed(),t=M();if(r&&(r.disabled=0===Q.length,r.title="Rückgängig"),l&&(l.disabled=0===J.length,l.title="Wiederherstellen"),o&&(o.style.background=e,o.dataset.active="pen"===G?"1":"0",o.title="Stift"),s&&(s.dataset.active="eraser"===G?"1":"0",s.title="Radierer"),d&&(d.style.background="transparent",d.dataset.active="rect"===G?"1":"0",d.title="Marker-Rechteck"),u){let e=_(t,.65);u.style.backgroundColor="transparent",u.style.backgroundImage=`linear-gradient(to right, ${e} 1.8px, transparent 1.8px),
         linear-gradient(to bottom, ${e} 1.8px, transparent 1.8px)`,u.style.backgroundSize="6px 6px",u.style.backgroundPosition="center",u.dataset.active="bg"===ee?"1":"0",u.title="Hintergrund"}"eraser"!==G&&em()}function eR(e){if(es){if(e){let e=Math.min(es.x0,es.x1),t=Math.min(es.y0,es.y1),a=Math.max(es.x0,es.x1),n=Math.max(es.y0,es.y1),r=n-t;if(a-e>.001&&r>.001){for(let e=Q.length-1;e>=0;e--)Q[e]&&"rect"===Q[e].kind&&Q.splice(e,1);for(let e=J.length-1;e>=0;e--)J[e]&&"rect"===J[e].kind&&J.splice(e,1);Q.push({kind:"rect",x0:e,y0:t,x1:a,y1:n,alpha:.28,colorKey:"accent"}),J.length=0}}es=null,e_(),eE(),eA(),ec(),ey()}}function eL(){em();let t=window.devicePixelRatio||1,a=e.clientWidth,n=e.clientHeight,r=Math.max(1,Math.round(a*t)),i=Math.max(1,Math.round(n*t));e.width=r,e.height=i,A.width=r,A.height=i,L.width=r,L.height=i,e_(),eC(),eE(),eA(),ec()}eA(),eL(),new ResizeObserver(()=>eL()).observe(e),!function(){if(t.__cornersReady)return;t.__cornersReady=!0;let a=document.createElement("button");a.type="button",a.className="lia-resize-corner",a.dataset.corner="bl",a.setAttribute("aria-label","Zeichenfläche ziehen (links unten)");let n=document.createElement("button");n.type="button",n.className="lia-resize-corner",n.dataset.corner="br",n.setAttribute("aria-label","Zeichenfläche ziehen (rechts unten)"),t.appendChild(a),t.appendChild(n);let r=(e,t,a)=>Math.max(t,Math.min(a,e));function i(a,n){let i=!1,l=0,o=0,s=0,c=0;function d(e){if(i){i=!1;try{a.releasePointerCapture(e.pointerId)}catch(e){}eL(),ec()}}a.addEventListener("pointerdown",function(n){ep(),n.preventDefault(),n.stopPropagation(),i=!0,s=t.getBoundingClientRect().width,c=e.clientHeight||245,l=n.clientX,o=n.clientY;try{a.setPointerCapture(n.pointerId)}catch(e){}}),a.addEventListener("pointermove",function(a){if(!i)return;a.preventDefault();let d=a.clientX-l,u=a.clientY-o,p=r(c+u,130,9e3);e.style.height=p+"px";let h=function(){let e=t.closest(".lia-canvas-mount")||t.parentElement||t,a=0;try{a=e.getBoundingClientRect().width}catch(e){}if((!a||a<200)&&document.querySelector("main"))try{a=document.querySelector("main").getBoundingClientRect().width}catch(e){}return Math.max(200,Math.floor(a||200))}(),f="br"===n?r(s+d,200,h):r(s-d,200,h);t.style.width=f+"px"}),a.addEventListener("pointerup",d),a.addEventListener("pointercancel",d)}i(n,"br"),i(a,"bl")}(),document.addEventListener("lia-canvas-theme",()=>{eA(),e_(),eC(),eE()}),r&&!r.__bound&&(r.__bound=!0,r.addEventListener("click",e=>{e.preventDefault(),e.stopPropagation(),function(){if(!Q.length)return;let e=Q.pop();J.push(e),e_(),eC(),eE(),eA(),ec()}()})),l&&!l.__bound&&(l.__bound=!0,l.addEventListener("click",e=>{e.preventDefault(),e.stopPropagation(),function(){if(!J.length)return;let e=J.pop();Q.push(e),e_(),eC(),eE(),eA(),ec()}()})),d&&!d.__bound&&(d.__bound=!0,d.addEventListener("click",e=>{e.stopPropagation(),G="rect",ee="rect",eu(!1),eA()})),o&&p&&o.addEventListener("click",e=>{e.stopPropagation(),G="pen",ee="pen";let t="1"===p.dataset.open,a="pen"===p.__mode;t&&a||function e(){if(!p)return;p.__mode="pen";let t=k(),a="";a+=`<span class="lia-heading-row">
      <span class="lia-tool-heading">Stift</span>
      <button class="lia-menu-icon-btn" type="button" data-act="close" aria-label="Schlie\xdfen">${eh()}</button>
    </span><span class="lia-color-grid">`;for(let e=0;e<w.length;e++){let n=w[e],r="auto"===n.key?t:n.value||t,i=e===et?"1":"0";a+=`<button class="lia-color-item" type="button" data-act="color" data-idx="${e}" data-active="${i}"
                style="background:${r};" aria-label="Farbe ${n.key}"></button>`}p.innerHTML=a+=`</span><span class="lia-row">
      <span class="lia-preview"><span class="lia-preview-line" data-k="pw" style="height:${Math.max(2,Math.min(14,ea))}px;"></span></span>
      <input class="lia-slider" type="range" min="1" max="100" step="1" value="${ea}" data-act="penWidth" aria-label="Stiftbreite">
      <span style="font-weight:800;min-width:2.6em;text-align:right">${ea}</span>
    </span><span class="lia-row">
      <span class="lia-preview"><span class="lia-preview-line" data-k="pa" style="opacity:${en};"></span></span>
      <input class="lia-slider" type="range" min="0.15" max="1" step="0.05" value="${en}" data-act="penAlpha" aria-label="Deckkraft">
      <span style="font-weight:800;min-width:2.6em;text-align:right">${Math.round(100*en)}%</span>
    </span>`,p.onclick=t=>{let a=t.target&&t.target.closest?t.target.closest("[data-act]"):null;if(!a)return;let n=a.getAttribute("data-act");if("close"===n)return void eu(!1);if("color"===n){let t=Number(a.getAttribute("data-idx"));isFinite(t)&&(et=eg(t,0,w.length-1)),G="pen",eA(),ec(),e();return}if("penWidth"!==n&&"penAlpha"===n)return};let n=p.querySelector('input[data-act="penWidth"]');n&&(n.oninput=()=>{ea=eg(Number(n.value),1,100),eA(),ec();let e=p.querySelector('[data-k="pw"]');e&&(e.style.height=Math.max(2,Math.min(14,ea))+"px");let t=n.parentElement&&n.parentElement.querySelector('span[style*="min-width"]');t&&(t.textContent=String(ea))});let r=p.querySelector('input[data-act="penAlpha"]');r&&(r.oninput=()=>{en=eg(Number(r.value),.05,1),eA(),ec();let e=p.querySelector('[data-k="pa"]');e&&(e.style.opacity=String(en));let t=r.parentElement&&r.parentElement.querySelector('span[style*="min-width"]');t&&(t.textContent=Math.round(100*en)+"%")})}(),eu(!t||!a),eA()}),s&&p&&s.addEventListener("click",e=>{e.stopPropagation(),G="eraser",ee="eraser";let t="1"===p.dataset.open,a="eraser"===p.__mode;t&&a||function(){if(!p)return;p.__mode="eraser",p.innerHTML=`
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
          <button class="lia-menu-icon-btn" type="button" data-act="close" aria-label="Schlie\xdfen">${eh()}</button>
        </span>
      </span>

      <span class="lia-row">
        <span class="lia-preview"><span class="lia-preview-line" style="height:${Math.max(2,Math.min(18,er))}px;"></span></span>
        <input class="lia-slider" type="range" min="4" max="500" step="1" value="${er}" data-act="eraserWidth" aria-label="Radiererbreite">
        <span style="font-weight:800;min-width:2.6em;text-align:right">${er}</span>
      </span>
    `,p.onclick=e=>{let t=e.target&&e.target.closest?e.target.closest("[data-act]"):null;if(!t)return;let a=t.getAttribute("data-act");"close"===a?eu(!1):"clear"===a&&(Q.length=0,J.length=0,e_(),eC(),eE(),eA(),ec())};let e=p.querySelector('input[data-act="eraserWidth"]');e&&(e.oninput=()=>{er=eg(Number(e.value),2,500),eA(),ec();let t=e.parentElement&&e.parentElement.querySelector('span[style*="min-width"]');t&&(t.textContent=String(er))})}(),eu(!t||!a),eA()}),u&&p&&u.addEventListener("click",e=>{e.stopPropagation(),ee="bg";let t="1"===p.dataset.open,a="bg"===p.__mode;t&&a||function e(){if(!p)return;p.__mode="bg",p.innerHTML=`
      <span class="lia-heading-row">
        <span class="lia-tool-heading">Hintergrund</span>
        <button class="lia-menu-icon-btn" type="button" data-act="close" aria-label="Schlie\xdfen">${eh()}</button>
      </span>

      <span class="lia-bg-tiles">
        <button class="lia-bg-tile" type="button" data-act="bg" data-mode="none"  data-active="${"none"===ei?"1":"0"}" aria-label="Kein Hintergrund"></button>
        <button class="lia-bg-tile" type="button" data-act="bg" data-mode="grid"  data-active="${"grid"===ei?"1":"0"}" aria-label="Kariert"></button>
        <button class="lia-bg-tile" type="button" data-act="bg" data-mode="lined" data-active="${"lined"===ei?"1":"0"}" aria-label="Liniert"></button>
      </span>

      <span class="lia-row">
        <span style="font-weight:800;opacity:.8;min-width:4.8em">Abstand</span>
        <input class="lia-slider" type="range" min="8" max="80" step="1" value="${el}" data-act="bgStep" aria-label="Hintergrundabstand">
        <span style="font-weight:800;min-width:2.6em;text-align:right">${el}</span>
      </span>
    `;try{let e=_(M(),.65),t=p.querySelectorAll(".lia-bg-tile");if(t&&t.length>=3){let a=t[1];a.style.backgroundImage=`linear-gradient(to right, ${e} 2px, transparent 2px),
           linear-gradient(to bottom, ${e} 2px, transparent 2px)`,a.style.backgroundSize="10px 10px",a.style.backgroundPosition="center";let n=t[2];n.style.backgroundImage=`linear-gradient(to bottom, ${e} 2px, transparent 2px)`,n.style.backgroundSize="10px 10px",n.style.backgroundPosition="center"}}catch(e){}p.onclick=t=>{let a=t.target&&t.target.closest?t.target.closest("[data-act]"):null;if(!a)return;let n=a.getAttribute("data-act");if("close"===n)return void eu(!1);if("bg"===n){let t=String(a.getAttribute("data-mode")||"none");ei="grid"===t||"lined"===t?t:"none",eE(),ec(),e(),eA();return}};let t=p.querySelector('input[data-act="bgStep"]');t&&(t.oninput=()=>{el=eg(Number(t.value),6,300),eE(),ec();let e=t.parentElement&&t.parentElement.querySelector('span[style*="min-width"]');e&&(e.textContent=String(el))})}(),eu(!t||!a),eA()}),document.addEventListener("click",e=>{t.contains(e.target)||eu(!1)}),document.addEventListener("keydown",e=>{"Escape"===e.key&&eu(!1)});let eT=!1;function eq(e){return Math.max(z.minScale,Math.min(z.maxScale,e))}window.addEventListener("keydown",e=>{"Space"===e.code&&(eT=!0)}),window.addEventListener("keyup",e=>{"Space"===e.code&&(eT=!1)}),e.addEventListener("contextmenu",e=>e.preventDefault()),e.addEventListener("wheel",t=>{ep(),t.preventDefault(),em();let a=e.getBoundingClientRect(),n=t.clientX-a.left,r=t.clientY-a.top;!function(e,t,a){let n=z.scale,r=eq(n*e);if(r===n)return;let i=ev(t,a);z.scale=r,z.panX=t-i.x*r,z.panY=a-i.y*r,e_(),eC(),eE(),ec()}(Math.exp(-(.0012*t.deltaY)),n,r)},{passive:!1});let eP=new Map,ez="idle",eO=0,eI=0,eB=null;function ej(t){let a=e.getBoundingClientRect();return{sx:t.clientX-a.left,sy:t.clientY-a.top}}function eF(e,t){return Math.hypot(e.sx-t.sx,e.sy-t.sy)}function eH(e,t){return{sx:(e.sx+t.sx)/2,sy:(e.sy+t.sy)/2}}function eW(t){em(),eP.has(t.pointerId)&&eP.delete(t.pointerId);try{e.releasePointerCapture(t.pointerId)}catch(e){}if("pinch"===ez){eP.size<2&&(eB=null,ez="idle");return}if("pan"===ez){ez="idle",e.style.cursor="crosshair";return}if("rect"===ez){0===eP.size&&(eR(!0),ez="idle");return}if("draw"===ez){eo=null,ez="idle",eA(),ec();return}}e.addEventListener("pointerdown",t=>{let a,n;if(ep(),t.target&&t.target.classList&&t.target.classList.contains("lia-resize-corner"))return;let r=ej(t);if(eP.set(t.pointerId,r),e.setPointerCapture(t.pointerId),2===eP.size){em(),"draw"===ez&&(eo=null),"rect"===ez&&eR(!1);let e=Array.from(eP.values()),t=eH(e[0],e[1]);eB={dist:Math.max(1e-6,eF(e[0],e[1])),worldMid:ev(t.sx,t.sy),startScale:z.scale},ez="pinch";return}let i="mouse"===t.pointerType&&2===t.button,l="mouse"===t.pointerType&&1===t.button;if(i||l||"mouse"===t.pointerType&&eT){em(),ez="pan",eO=r.sx,eI=r.sy,e.style.cursor="grab";return}if("rect"===G){let t;em(),ez="rect",e.style.cursor="crosshair",es={x0:(t=ev(r.sx,r.sy)).x,y0:t.y,x1:t.x,y1:t.y},eE();return}ez="draw",e.style.cursor="crosshair",a=ev(r.sx,r.sy),n={kind:"path",tool:G,color:ed(),alpha:en,width:"eraser"===G?er:ea,points:[{x:a.x,y:a.y}]},Q.push(n),eo=n,J.length=0,ek(T),eS(T,n),T.beginPath(),T.moveTo(a.x,a.y),eA(),ec(),"eraser"===G?ex(r.sx,r.sy):em()}),e.addEventListener("pointermove",e=>{if(!eP.has(e.pointerId))return;let t=ej(e);if(eP.set(e.pointerId,t),"eraser"===G&&"pan"!==ez&&"pinch"!==ez&&"rect"!==ez?ex(t.sx,t.sy):em(),"pinch"===ez&&eP.size>=2&&eB){let e=Array.from(eP.values()).slice(0,2),t=eH(e[0],e[1]),a=Math.max(1e-6,eF(e[0],e[1]))/eB.dist,n=eq(eB.startScale*a);z.scale=n,z.panX=t.sx-eB.worldMid.x*n,z.panY=t.sy-eB.worldMid.y*n,e_(),eC(),eE(),ec();return}if("pan"===ez){let e=t.sx-eO,a=t.sy-eI;eO=t.sx,eI=t.sy,z.panX+=e,z.panY+=a,e_(),eC(),eE(),ec();return}"rect"===ez?function(e,t){if(!es)return;let a=ev(e,t);es.x1=a.x,es.y1=a.y,eE()}(t.sx,t.sy):"draw"===ez&&function(e,t){if(!eo)return;let a=ev(e,t);eo.points.push({x:a.x,y:a.y}),T.lineTo(a.x,a.y),T.stroke(),eE(),ec()}(t.sx,t.sy)}),e.addEventListener("pointerup",eW),e.addEventListener("pointercancel",eW),e.addEventListener("pointerleave",()=>{em(),"draw"===ez&&(eo=null),"pinch"!==ez&&(ez="idle"),e.style.cursor="crosshair",eA(),ec()}),I=!0}(e)}),document.querySelectorAll(".lia-canvas-pair").forEach(function(e){let t=x(e);t&&m(t)})}(e=i.freeze||{}).version="cvf1",e.collectCanvasPairsFromRoot=I,e.getCanvasMountFromPair=P,e.getCanvasUidFromPair=z,e.getCanvasStoreEntry=O,e.exportCanvasFreezeStateFromEntry=j,e.exportCanvasFreezeStateFromPair=F,e.exportAllCanvasFreezeStatesFromRoot=function(e){let t=I(e),a=[];for(let e=0;e<t.length;e++){let n=F(t[e]);n&&a.push(n)}return a},e.hasCanvasFreezeContent=H,e.paintCanvasFreezeStateToCanvas=W,e.renderCanvasFreezeStateIntoMount=N,e.renderCanvasFreezeStateIntoPair=function(e,t){let a=P(e);return a?N(a,t):null},i.freeze=e,new MutationObserver(()=>$()).observe(document.body,{childList:!0,subtree:!0}),$(),i.launcherBound||(i.launcherBound=!0,document.addEventListener("click",e=>{let t=e.target&&e.target.closest?e.target.closest(".lia-canvas-launch"):null;if(!t)return;let a=t.closest(".lia-canvas-pair");if(!a)return;let n=a.querySelector(".lia-canvas-mount");if(n){c(n);try{let e=n.parentElement;if(e){let t=getComputedStyle(e);t&&String(t.display).includes("flex")&&"nowrap"===String(t.flexWrap)&&(e.style.flexWrap="wrap")}}catch(e){}"1"===n.dataset.open?n.dataset.open="0":(n.dataset.open="1",n.querySelector(".lia-draw-wrap")||(n.innerHTML=`
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
    `,$()))}},!0))}()},{}]},["bZBjE"],"bZBjE","parcelRequirecca2",{});
//# sourceMappingURL=index.js.map
