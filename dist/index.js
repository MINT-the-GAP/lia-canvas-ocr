!function(e,t,a,n,r){var i="u">typeof globalThis?globalThis:"u">typeof self?self:"u">typeof window?window:"u">typeof global?global:{},l="function"==typeof i[n]&&i[n],o=l.i||{},s=l.cache||{},c="u">typeof module&&"function"==typeof module.require&&module.require.bind(module);function d(t,a){if(!s[t]){if(!e[t]){if(r[t])return r[t];var o="function"==typeof i[n]&&i[n];if(!a&&o)return o(t,!0);if(l)return l(t,!0);if(c&&"string"==typeof t)return c(t);var p=Error("Cannot find module '"+t+"'");throw p.code="MODULE_NOT_FOUND",p}h.resolve=function(a){var n=e[t][1][a];return null!=n?n:a},h.cache={};var u=s[t]=new d.Module(t);e[t][0].call(u.exports,h,u,u.exports,i)}return s[t].exports;function h(e){var t=h.resolve(e);if(!1===t)return{};if(Array.isArray(t)){var a={__esModule:!0};return t.forEach(function(e){var t=e[0],n=e[1],r=e[2]||e[0],i=d(n);"*"===t?Object.keys(i).forEach(function(e){"default"===e||"__esModule"===e||Object.prototype.hasOwnProperty.call(a,e)||Object.defineProperty(a,e,{enumerable:!0,get:function(){return i[e]}})}):"*"===r?Object.defineProperty(a,t,{enumerable:!0,value:i}):Object.defineProperty(a,t,{enumerable:!0,get:function(){return"default"===r?i.__esModule?i.default:i:i[r]}})}),a}return d(t)}}d.isParcelRequire=!0,d.Module=function(e){this.id=e,this.bundle=d,this.require=c,this.exports={}},d.modules=e,d.cache=s,d.parent=l,d.distDir=void 0,d.publicUrl=void 0,d.devServer=void 0,d.i=o,d.register=function(t,a){e[t]=[function(e,t){t.exports=a},{}]},Object.defineProperty(d,"root",{get:function(){return i[n]}}),i[n]=d;for(var p=0;p<t.length;p++)d(t[p]);if(a){var u=d(a);"object"==typeof exports&&"u">typeof module?module.exports=u:"function"==typeof define&&define.amd&&define(function(){return u})}}({bZBjE:[function(e,t,a,n){var r=e("@parcel/transformer-js/src/esmodule-helpers.js");r.defineInteropFlag(a),r.export(a,"getRootWindow",()=>d),r.export(a,"LIA",()=>p);var i=e("./ocr/bar"),l=e("./ocr/engine"),o=e("./canvas/theme"),s=e("./canvas/freeze"),c=e("./canvas/index");function d(){let e=window;try{for(;e.parent&&e.parent!==e;)e=e.parent}catch(e){}return e}let p=window.__LIA_CANVAS_OCR__=window.__LIA_CANVAS_OCR__||{SHOW_BAR:!1,bar:null,ocr:null,tfjs:null,tfjsLoad:null,store:{},uidSeq:0,freeze:{},barBoot:!1,canvasBoot:!1,launcherBound:!1},u=d(),h="__LIA_CANVAS_OCR_REG_V1__";u[h]=u[h]||{inited:{}};let f=document.baseURI||location.href;u[h].inited[f]||(u[h].inited[f]=!0,function(){if(!p.barBoot){p.barBoot=!0,(0,i.ensureOcrBar)();let e=()=>{try{let e=(0,o.getAccentColor)(document);e&&document.documentElement.style.setProperty("--canvas-accent",e)}catch(e){}};e(),setTimeout(e,0)}(0,o.applyThemeVars)(),new MutationObserver(()=>(0,o.applyThemeVars)()).observe(document.documentElement,{attributes:!0,attributeFilter:["class","style"]}),window.addEventListener("resize",()=>(0,o.applyThemeVars)()),!p.canvasBoot&&(p.canvasBoot=!0,p.uidSeq=p.uidSeq||0,(0,l.ensureOcrEngine)(),(0,s.ensureCanvasFreezeApi)(),new MutationObserver(()=>(0,c.initAll)()).observe(document.body,{childList:!0,subtree:!0}),(0,c.initAll)(),p.launcherBound||(p.launcherBound=!0,document.addEventListener("click",e=>{let t=e.target?.closest?.(".lia-canvas-launch");if(!t)return;let a=t.closest(".lia-canvas-pair");if(!a)return;let n=a.querySelector(".lia-canvas-mount");if(n){n.dataset.uid||(p.uidSeq=(p.uidSeq||0)+1,n.dataset.uid="c"+p.uidSeq);try{let e=n.parentElement;if(e){let t=getComputedStyle(e);String(t.display).includes("flex")&&"nowrap"===String(t.flexWrap)&&(e.style.flexWrap="wrap")}}catch(e){}"1"!==n.dataset.open?(n.dataset.open="1",n.querySelector(".lia-draw-wrap")||(n.innerHTML=(0,c.canvasMarkup)(),(0,c.initAll)())):n.dataset.open="0"}},!0)))}())},{"./ocr/bar":"hlAaK","./ocr/engine":"bEGKb","./canvas/theme":"9gAEw","./canvas/freeze":"cCz1j","./canvas/index":"2KvOo","@parcel/transformer-js/src/esmodule-helpers.js":"9p1zA"}],hlAaK:[function(e,t,a,n){var r=e("@parcel/transformer-js/src/esmodule-helpers.js");r.defineInteropFlag(a),r.export(a,"ensureOcrBar",()=>o);var i=e("../index"),l=e("../canvas/theme");function o(){let e=!0===i.LIA.SHOW_BAR;if((0,l.ensureCss)(),i.LIA.bar&&i.LIA.bar.el&&i.LIA.bar.el.isConnected){try{let t=i.LIA.bar.el,a=document.body||document.documentElement;t.parentNode!==a&&a.appendChild(t),t.style.display=e?"":"none",t.setAttribute("aria-hidden",e?"false":"true");let n=i.LIA.bar.loadEl;n&&n.parentNode!==a&&a.appendChild(n)}catch(e){}return i.LIA.bar}let t=document.createElement("div");t.className="lia-ocrbar",e||(t.style.display="none",t.setAttribute("aria-hidden","true")),t.dataset.state="idle",t.dataset.open="0",t.innerHTML=`
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
  `;let a=document.body||document.documentElement;a.appendChild(t);let n=document.createElement("div");n.className="lia-ocr-loadwrap",n.dataset.on="0",n.dataset.indet="0",n.innerHTML=`
    <div class="lia-ocr-loadmsg">
      <span class="t">Schrifterkennungsmodul l\xe4dt noch\u{2026}</span>
      <span class="p">\u{2026}</span>
    </div>
    <div class="lia-ocr-loadtrack"><div class="lia-ocr-loadfill"></div></div>
    <div class="lia-ocr-loaddetail">Download von rund 900&nbsp;MB (nur beim ersten Mal, danach Cache).</div>
  `,a.appendChild(n);let r=n.querySelector(".lia-ocr-loadfill"),o=n.querySelector(".lia-ocr-loadmsg .t"),s=n.querySelector(".lia-ocr-loadmsg .p"),c=n.querySelector(".lia-ocr-loaddetail"),d={model:"Xenova/texify2",backend:"wasm",precision:"fp32",loaded:!1,phase:"idle",status:"idle",progress:null},p=t.querySelector(".lia-ocr-log"),u=t.querySelector(".lia-ocr-progress"),h=t.querySelector(".lia-ocr-progfill"),f=t.querySelector(".lia-ocr-progtxt"),g=t.querySelector('select[data-act="precision"]'),m=t.querySelector('select[data-act="model"]'),x="__LIA_TEX_OCR_PREC__",b="__LIA_TEX_OCR_MODEL__";try{let e=localStorage.getItem(b);e&&(d.model=e)}catch(e){}try{let e=localStorage.getItem(x);e&&(d.precision=e)}catch(e){}function y(e,a){let n=t.querySelector('[data-k="'+e+'"]');n&&(n.textContent=String(a))}function v(){if(t.dataset.state=String(d.status||"idle"),y("model",d.model||"—"),y("backend",d.backend||"—"),y("precision",d.precision||"—"),y("loaded",d.loaded?"yes":"no"),y("phase",d.phase||"—"),y("status",d.status||"idle"),null!==d.progress&&void 0!==d.progress&&isFinite(d.progress)){let e=Math.max(0,Math.min(1,Number(d.progress)));u.dataset.on="1",h.style.width=Math.round(100*e)+"%",f.textContent=Math.round(100*e)+"%"}else u.dataset.on="0";try{if(e){let e=Math.ceil(t.getBoundingClientRect().height||t.offsetHeight||0);document.documentElement.style.setProperty("--lia-ocrbar-h",(e||0)+"px"),document.documentElement.style.setProperty("--lia-ocrbar-gap","8px")}else document.documentElement.style.setProperty("--lia-ocrbar-h","0px"),document.documentElement.style.setProperty("--lia-ocrbar-gap","0px")}catch(e){}if(n&&r&&o&&s){let e=String(d.status||"idle"),t=String(d.phase||"idle");if(d.loaded||"loading"!==e&&"import"!==t&&"pipeline"!==t&&"download"!==t)n.dataset.on="0",n.dataset.indet="0",r.style.transform="translateX(0)",r.style.width="0%",s.textContent="";else if(n.dataset.on="1","download"===t?(o.textContent="Schrifterkennungsmodul lädt noch…",c&&(c.innerHTML="Dieser Download dauert nur beim ersten Mal so lange und ist danach im Cache.")):("import"===t?o.textContent="Schrifterkennungsmodul lädt noch… (Bibliothek wird geladen)":"pipeline"===t?o.textContent="Schrifterkennungsmodul lädt noch… (Modell wird initialisiert)":o.textContent="Schrifterkennungsmodul lädt noch…",c&&(c.textContent="Erster Start kann etwas dauern.")),null!==d.progress&&void 0!==d.progress&&isFinite(d.progress)){let e=Math.max(0,Math.min(1,Number(d.progress)));n.dataset.indet="0",r.style.transform="translateX(0)",r.style.width=Math.round(100*e)+"%",s.textContent=Math.round(100*e)+"%"}else n.dataset.indet="1",r.style.width="35%",s.textContent="…"}}function w(e){try{let t=new Date,a=String(t.getHours()).padStart(2,"0"),n=String(t.getMinutes()).padStart(2,"0"),r=String(t.getSeconds()).padStart(2,"0"),i="["+a+":"+n+":"+r+"] "+String(e),l=p.textContent?p.textContent.split("\n"):[];for(l.push(i);l.length>10;)l.shift();p.textContent=l.join("\n")}catch(e){}}function k(e){try{if(!e)return;for(let t in e)Object.prototype.hasOwnProperty.call(e,t)&&(d[t]=e[t]);v()}catch(e){}}return m&&(m.value=d.model),g&&(g.value=d.precision),t.addEventListener("click",e=>{let a=e.target?.closest?.("button[data-act]");if(!a)return;let n=a.getAttribute("data-act");if("toggle"===n){t.dataset.open="1"===t.dataset.open?"0":"1";return}if("copy"===n){let e=["LaTeX-OCR Status Report","Model: "+(d.model||""),"Backend: "+(d.backend||""),"Precision: "+(d.precision||""),"Loaded: "+(d.loaded?"yes":"no"),"Phase: "+(d.phase||""),"Status: "+(d.status||""),"Progress: "+(null===d.progress?"—":String(d.progress)),"\nLog:",p.textContent||""].join("\n");try{navigator.clipboard.writeText(e),w("Report copied to clipboard.")}catch(e){w("Copy failed (clipboard blocked).")}return}if("load"===n){i.LIA.ocr&&i.LIA.ocr.ensureLoaded&&i.LIA.ocr.ensureLoaded(!0);return}}),g&&g.addEventListener("change",()=>{let e=String(g.value||"fp32");try{localStorage.setItem(x,e)}catch(e){}k({precision:e}),i.LIA.ocr&&i.LIA.ocr.setPrecision&&i.LIA.ocr.setPrecision(e)}),m&&m.addEventListener("change",()=>{let e=String(m.value||d.model);try{localStorage.setItem(b,e)}catch(e){}k({model:e}),i.LIA.ocr&&i.LIA.ocr.setModel&&i.LIA.ocr.setModel(e)}),i.LIA.bar={el:t,loadEl:n,set:k,log:w,get:()=>({...d})},v(),w("OCR-Bar ready."),i.LIA.bar}},{"../index":"bZBjE","../canvas/theme":"9gAEw","@parcel/transformer-js/src/esmodule-helpers.js":"9p1zA"}],"9gAEw":[function(e,t,a,n){var r=e("@parcel/transformer-js/src/esmodule-helpers.js");function i(){if(document.getElementById("__lia_canvas_ocr_css_v1"))return;let e=document.createElement("style");e.id="__lia_canvas_ocr_css_v1",e.textContent=`
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
  `,(document.head||document.documentElement).appendChild(e)}function l(e){let t=String(e||""),a=t.indexOf("("),n=t.indexOf(")");if(a<0||n<0)return null;let r=t.slice(a+1,n).split(",").map(e=>Number(String(e).trim()));return!(r.length<3)&&isFinite(r[0])&&isFinite(r[1])&&isFinite(r[2])?[r[0],r[1],r[2]]:null}function o(e){let[t,a,n]=e.map(e=>e/255).map(e=>e<=.03928?e/12.92:Math.pow((e+.055)/1.055,2.4));return .2126*t+.7152*a+.0722*n}function s(e){try{let t=e||document,a=t.body||t.documentElement,n=t.querySelector(".lia-btn");if(n){let e=getComputedStyle(n).backgroundColor;if(e&&"rgba(0, 0, 0, 0)"!==e&&"transparent"!==e)return e}let r=t.createElement("button");r.className="lia-btn",r.type="button",r.textContent="x",r.style.position="absolute",r.style.left="-9999px",r.style.top="-9999px",r.style.visibility="hidden",a.appendChild(r);let i=getComputedStyle(r).backgroundColor;if(r.remove(),i&&"rgba(0, 0, 0, 0)"!==i&&"transparent"!==i)return i}catch(e){}return null}function c(){i();try{let e=window.parent&&window.parent.document?window.parent.document:document,t=document.documentElement,a=getComputedStyle(e.body||e.documentElement).backgroundColor||getComputedStyle(e.documentElement).backgroundColor,n=l(a),r=n&&.5>o(n)?"#fff":"#000";t.style.setProperty("--canvas-border",r),t.style.setProperty("--canvas-pen",r);let i=s(e)||s(document);i&&t.style.setProperty("--canvas-accent",i),document.dispatchEvent(new Event("lia-canvas-theme"))}catch(e){}}r.defineInteropFlag(a),r.export(a,"ensureCss",()=>i),r.export(a,"parseRgb",()=>l),r.export(a,"luminance",()=>o),r.export(a,"getAccentColor",()=>s),r.export(a,"applyThemeVars",()=>c),r.export(a,"COLORS",()=>d),r.export(a,"getAutoPen",()=>p),r.export(a,"getBorderColor",()=>u),r.export(a,"getAccentCssVar",()=>h),r.export(a,"setSvg",()=>f),r.export(a,"setRectIcon",()=>g),r.export(a,"setEraserIcon",()=>m),r.export(a,"setUndoIcon",()=>x),r.export(a,"setRedoIcon",()=>b),r.export(a,"setTrashIcon",()=>y),r.export(a,"rgbaFromAny",()=>v);let d=[{key:"auto",value:null},{key:"red",value:"#ff0000"},{key:"orange",value:"#ff7500"},{key:"yellow",value:"#ffff00"},{key:"violett",value:"#ff00ff"},{key:"blue",value:"#0055ff"},{key:"lightblue",value:"#00ffff"},{key:"green",value:"#00ff00"},{key:"darkgreen",value:"#007500"},{key:"black",value:"#000000"},{key:"white",value:"#ffffff"}];function p(){return getComputedStyle(document.documentElement).getPropertyValue("--canvas-pen").trim()||"#000"}function u(){return getComputedStyle(document.documentElement).getPropertyValue("--canvas-border").trim()||"#000"}function h(){return getComputedStyle(document.documentElement).getPropertyValue("--canvas-accent").trim()||u()}function f(e,t){!e||e.__hasIcon||(e.__hasIcon=!0,e.innerHTML=t)}function g(e){f(e,`
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
  `)}function m(e){f(e,`
    <svg viewBox="-4 4 24 24" aria-hidden="true">
      <path class="ico-stroke" d="M4 16.5l8.6-8.6a2 2 0 0 1 2.8 0l4.1 4.1a2 2 0 0 1 0 2.8L12.8 23H7.6L4 19.4a2 2 0 0 1 0-2.9z"
            fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path class="ico-stroke" d="M8 23h8" fill="none" stroke-width="2" stroke-linecap="round"/>
      <path class="ico-stroke" d="M9.2 14.3l6.5 6.5" fill="none" stroke-width="2" stroke-linecap="round"/>
    </svg>
  `)}function x(e){f(e,`
    <svg viewBox="-4 0 24 24" aria-hidden="true">
      <path d="M21 8H10.2V4L2 12l8.2 8v-4H21V8z" fill="var(--canvas-border)"/>
      <rect x="10.2" y="10.6" width="10.8" height="2.8" rx="1.4" fill="var(--canvas-border)"/>
    </svg>
  `)}function b(e){f(e,`
    <svg viewBox="-4 0 24 24" aria-hidden="true">
      <path d="M3 8h10.8V4l8.2 8-8.2 8v-4H3V8z" fill="var(--canvas-border)"/>
      <rect x="3" y="10.6" width="10.8" height="2.8" rx="1.4" fill="var(--canvas-border)"/>
    </svg>
  `)}function y(e){e&&(e.innerHTML=`
    <svg viewBox="-1 0 24 24" aria-hidden="true" style="width:22px;height:22px;display:block;">
      <path class="ico-stroke" d="M9 3h6" stroke-width="2" stroke-linecap="round"/>
      <path class="ico-stroke" d="M4 6h16" stroke-width="2" stroke-linecap="round"/>
      <path class="ico-stroke" d="M7 6l1 15h8l1-15" stroke-width="2" stroke-linejoin="round"/>
      <path class="ico-stroke" d="M10 10v8M14 10v8" stroke-width="2" stroke-linecap="round"/>
    </svg>
  `)}function v(e,t){let a=l(e);if(a)return`rgba(${a[0]},${a[1]},${a[2]},${t})`;if(String(e).startsWith("#")){let a=String(e).slice(1),n=3===a.length?a[0]+a[0]+a[1]+a[1]+a[2]+a[2]:a,r=parseInt(n.slice(0,2),16),i=parseInt(n.slice(2,4),16),l=parseInt(n.slice(4,6),16);return`rgba(${r},${i},${l},${t})`}return`rgba(0,0,0,${t})`}},{"@parcel/transformer-js/src/esmodule-helpers.js":"9p1zA"}],"9p1zA":[function(e,t,a,n){a.interopDefault=function(e){return e&&e.__esModule?e:{default:e}},a.defineInteropFlag=function(e){Object.defineProperty(e,"__esModule",{value:!0})},a.exportAll=function(e,t){return Object.keys(e).forEach(function(a){"default"===a||"__esModule"===a||Object.prototype.hasOwnProperty.call(t,a)||Object.defineProperty(t,a,{enumerable:!0,get:function(){return e[a]}})}),t},a.export=function(e,t,a){Object.defineProperty(e,t,{enumerable:!0,get:a})}},{}],bEGKb:[function(e,t,a,n){var r=e("@parcel/transformer-js/src/esmodule-helpers.js");r.defineInteropFlag(a),r.export(a,"ensureOcrEngine",()=>s);var i=e("../index"),l=e("./bar");async function o(){return i.LIA.tfjs&&i.LIA.tfjs.pipeline?i.LIA.tfjs:(i.LIA.tfjsLoad=i.LIA.tfjsLoad||(async()=>{let e=null;for(let t of["https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2/+esm","https://esm.sh/@xenova/transformers@2.17.2?bundle"])try{try{let e=i.LIA.bar;e&&e.log&&e.log("Importing Transformers.js: "+t)}catch(e){}let e=await Function("u","return import(u)")(t),a=e.pipeline||e.default&&e.default.pipeline,n=e.env||e.default&&e.default.env;if(!a||!n)throw Error("Transformers.js ESM export missing (pipeline/env).");let r={pipeline:a,env:n,__url:t};return i.LIA.tfjs=r,r}catch(a){e=a;try{let e=i.LIA.bar;e&&e.log&&e.log("Import failed: "+t+" — "+(a&&a.message?a.message:String(a)))}catch(e){}}throw e||Error("Failed to load Transformers.js from all CDN URLs.")})(),await i.LIA.tfjsLoad)}function s(){if(i.LIA.ocr)return i.LIA.ocr;let e=(0,l.ensureOcrBar)(),t={model:e.get().model||"Xenova/trocr-small-handwritten",task:"image-to-text",precision:e.get().precision||"fp32",pipe:null,loading:null,async setModel(t){let a=String(t||this.model||"Xenova/texify2");return this.model=a,e.set({model:a,loaded:!1,status:"idle",phase:"idle",progress:null}),this.pipe=null,this.loading=null,this.ensureLoaded(!0)},async setPrecision(t){let a=String(t||"fp32");return this.precision=a,e.set({precision:a,loaded:!1,status:"idle",phase:"idle",progress:null}),this.pipe=null,this.loading=null,this.ensureLoaded(!0)},async ensureLoaded(t){if(this.pipe&&!t)return this.pipe;if(this.loading)return this.loading;let a=this.precision||"fp32",n={fp32:"fp32",fp16:"fp16",int8:"q8"}[a]||"fp32";return e.set({model:this.model,backend:"wasm",precision:a,status:"loading",phase:"import",loaded:!1,progress:0}),e.log("Loading model ("+a+") …"),this.loading=(async()=>{try{let{pipeline:t,env:r}=await o();try{r.allowLocalModels=!1,r.allowRemoteModels=!0,r.useBrowserCache=!0,r.backends=r.backends||{},r.backends.onnx=r.backends.onnx||{},r.backends.onnx.wasm=r.backends.onnx.wasm||{}}catch(e){}e.set({phase:"pipeline"});let i=await t(this.task,this.model,{dtype:n,progress_callback:t=>{let a=function(e){try{if(null==e)return null;if("number"==typeof e&&isFinite(e))return Math.max(0,Math.min(1,e));let t=e&&"object"==typeof e?e:null;if(!t)return null;if(isFinite(t.progress))return Math.max(0,Math.min(1,Number(t.progress)));if(isFinite(t.loaded)&&isFinite(t.total)&&Number(t.total)>0)return Math.max(0,Math.min(1,Number(t.loaded)/Number(t.total)))}catch(e){}return null}(t);null!==a&&e.set({progress:a,phase:"download"})}});return this.pipe=i,e.set({status:"ready",phase:"ready",loaded:!0,progress:null}),e.log("Model loaded ("+a+")."),i}catch(t){throw e.set({status:"error",phase:"error",loaded:!1,progress:null}),e.log("Load failed: "+(t&&t.message?t.message:String(t))),t}finally{this.loading=null}})(),this.loading},async recognize(t,a){let n=a&&"object"==typeof a?a:{},r=!0===n.__silent,i=await this.ensureLoaded(!1);e.set({status:"working",phase:"infer",progress:null});let l=null;async function o(e){if(e&&"function"==typeof e.convertToBlob)return await e.convertToBlob({type:"image/png"});if(e&&"function"==typeof e.toBlob)return await new Promise((t,a)=>{e.toBlob(e=>e?t(e):a(Error("toBlob() returned null")),"image/png")});throw Error("Canvas-like has no toBlob/convertToBlob")}async function s(e){if("string"==typeof e)return{input:e,revoke:null};if(e&&"object"==typeof e&&"function"==typeof e.arrayBuffer&&"number"==typeof e.size&&"string"==typeof e.type){let t=URL.createObjectURL(e);return{input:t,revoke:()=>URL.revokeObjectURL(t)}}if(e&&"object"==typeof e&&"number"==typeof e.width&&"number"==typeof e.height&&e.data&&"number"==typeof e.data.length){let t=document.createElement("canvas");t.width=Math.max(1,Math.floor(e.width)),t.height=Math.max(1,Math.floor(e.height)),t.getContext("2d",{willReadFrequently:!0}).putImageData(e,0,0);let a=await o(t),n=URL.createObjectURL(a);return{input:n,revoke:()=>URL.revokeObjectURL(n)}}if(e&&"object"==typeof e){if("function"==typeof e.toDataURL)return{input:e.toDataURL("image/png"),revoke:null};if("function"==typeof e.toBlob||"function"==typeof e.convertToBlob){let t=await o(e),a=URL.createObjectURL(t);return{input:a,revoke:()=>URL.revokeObjectURL(a)}}}throw Error("Unsupported input type for OCR: "+(null===e?"null":typeof e))}try{let a=await s(t);l=a.revoke;let o="number"==typeof n.max_new_tokens&&isFinite(n.max_new_tokens)?Math.max(1,Math.floor(n.max_new_tokens)):96,c=await i(a.input,{max_new_tokens:o,do_sample:!0===n.do_sample,temperature:"number"==typeof n.temperature&&isFinite(n.temperature)?n.temperature:0}),d="";if("string"==typeof c)d=c;else if(Array.isArray(c)&&c.length){let e=c[0]||{};(d=e.generated_text||e.text||e.latex||"")||(d=JSON.stringify(e))}else c&&"object"==typeof c?(d=c.generated_text||c.text||c.latex||"")||(d=JSON.stringify(c)):d=String(c);return e.set({status:"ready",phase:"ready"}),r||e.log("Recognize done."),d}catch(t){throw e.set({status:"error",phase:"error"}),r||e.log("Recognize failed: "+(t&&t.message?t.message:String(t))),t}finally{try{l&&l()}catch(e){}}}};return i.LIA.ocr=t,t}},{"../index":"bZBjE","./bar":"hlAaK","@parcel/transformer-js/src/esmodule-helpers.js":"9p1zA"}],cCz1j:[function(e,t,a,n){var r=e("@parcel/transformer-js/src/esmodule-helpers.js");r.defineInteropFlag(a),r.export(a,"cfUnionBBox",()=>g),r.export(a,"ensureCanvasFreezeApi",()=>E);var i=e("../index"),l=e("./store"),o=e("./theme");function s(e,t){let a=Number(e);return isFinite(a)?a:t||0}function c(e,t,a){return Math.max(t,Math.min(a,e))}function d(e){return Math.round(100*s(e,0))/100}function p(e,t){let a=s(t,0);if(!(a>0))return 0;let n=s(e,0)%a;return n<0?n+a:n}function u(e){let t=e&&"object"==typeof e?e:{};return{panX:s(t.panX,0),panY:s(t.panY,0),scale:s(t.scale,1)||1,minScale:s(t.minScale,.25),maxScale:s(t.maxScale,8)}}function h(e,t){let a=s(e&&e.x,0),n=s(e&&e.y,0),r=s(t&&t.scale,1)||1;return{x:a*r+s(t&&t.panX,0),y:n*r+s(t&&t.panY,0)}}function f(e,t,a){if(!e)return null;let n=Math.max(0,s(e.x,0)),r=Math.max(0,s(e.y,0)),i=Math.min(s(t,0),s(e.x,0)+s(e.w,0)),l=Math.min(s(a,0),s(e.y,0)+s(e.h,0));return i<=n||l<=r?null:{x:n,y:r,w:i-n,h:l-r}}function g(e,t){if(!e)return t?{x:t.x,y:t.y,w:t.w,h:t.h}:null;if(!t)return{x:e.x,y:e.y,w:e.w,h:e.h};let a=Math.min(e.x,t.x),n=Math.min(e.y,t.y);return{x:a,y:n,w:Math.max(0,Math.max(e.x+e.w,t.x+t.w)-a),h:Math.max(0,Math.max(e.y+e.h,t.y+t.h)-n)}}function m(e){return e&&e.querySelector?e.querySelector(".lia-canvas-mount"):null}function x(e){let t=m(e);return t?(0,l.ensureMountUID)(t):""}function b(e){let t=i.LIA.store||{};return e&&t[e]?t[e]:null}function y(e){return Array.from((e&&e.querySelectorAll?e:document).querySelectorAll(".lia-canvas-pair")).filter(e=>!!m(e))}function v(e,t){let a=Array.isArray(t)?t:[];for(let t=0;t<a.length;t++){let n=a[t];if(!n)continue;if("r"===n.k){e.save(),e.globalCompositeOperation="source-over",e.globalAlpha=1,e.fillStyle=String(n.f||"rgba(0,0,0,0.15)"),e.fillRect(s(n.x,0),s(n.y,0),Math.max(0,s(n.w,0)),Math.max(0,s(n.h,0))),e.restore();continue}let r=Array.isArray(n.p)?n.p:[];if(r.length){e.save(),e.beginPath(),e.moveTo(s(r[0][0],0),s(r[0][1],0));for(let t=1;t<r.length;t++)e.lineTo(s(r[t][0],0),s(r[t][1],0));e.lineCap="round",e.lineJoin="round",e.lineWidth=Math.max(.75,s(n.w,1)),"e"===n.k?(e.globalCompositeOperation="destination-out",e.globalAlpha=1,e.strokeStyle="rgba(0,0,0,1)"):(e.globalCompositeOperation="source-over",e.globalAlpha=c(s(n.a,1),0,1),e.strokeStyle=String(n.c||"#000")),e.stroke(),e.restore()}}}function w(e,t){let a,n,r;if(!e||!t)return null;let i=function(e){let t=e&&"object"==typeof e?e:{},a=Array.isArray(t.ITEMS)?t.ITEMS:[],n=u(t.VIEW||{}),r=Math.max(1,Math.round(s(t.wrapW,0))),i=Math.max(1,Math.round(s(t.canvasH,0))),l=(0,o.rgbaFromAny)((0,o.getAccentCssVar)(),.28),p=[];for(let e=0;e<a.length;e++){let t=a[e];if(t&&"object"==typeof t){if("path"===t.kind){let e=Array.isArray(t.points)?t.points:[];if(!e.length)continue;let a=e.map(e=>h(e,n)),l=Math.max(.75,s(t.width,1)*s(n.scale,1));if(!f(function(e,t){let a=Array.isArray(e)?e:[];if(!a.length)return null;let n=1/0,r=1/0,i=-1/0,l=-1/0;for(let e=0;e<a.length;e++){let t=a[e],o=s(t&&t.x,0),c=s(t&&t.y,0);o<n&&(n=o),c<r&&(r=c),o>i&&(i=o),c>l&&(l=c)}let o=Math.max(0,s(t,0));return{x:n-o,y:r-o,w:Math.max(0,i-n+2*o),h:Math.max(0,l-r+2*o)}}(a,l/2+2),r,i))continue;p.push({k:"eraser"===t.tool?"e":"p",c:String(t.color||(0,o.getAutoPen)()),a:c(s(t.alpha,1),0,1),w:d(l),p:a.map(e=>[d(e.x),d(e.y)])});continue}if("rect"===t.kind){let e=h({x:t.x0,y:t.y0},n),a=h({x:t.x1,y:t.y1},n),u=function(e,t,a,n){let r=Math.min(s(e,0),s(a,0)),i=Math.min(s(t,0),s(n,0));return{x:r,y:i,w:Math.max(0,Math.max(s(e,0),s(a,0))-r),h:Math.max(0,Math.max(s(t,0),s(n,0))-i)}}(e.x,e.y,a.x,a.y);if(!f(u,r,i))continue;let g=c(s(t.alpha,.28),0,1),m=t.color?(0,o.rgbaFromAny)(t.color,g):(0,o.rgbaFromAny)((0,o.getAccentCssVar)(),g);p.push({k:"r",f:m||l,x:d(u.x),y:d(u.y),w:d(u.w),h:d(u.h)})}}}return{vw:r,vh:i,items:p}}(t),l=Math.max(1,0|i.vw),g=Math.max(1,0|i.vh),m=Array.isArray(i.items)?i.items:[],x=document.createElement("canvas");x.width=l,x.height=g;let b=x.getContext("2d",{willReadFrequently:!0});b.clearRect(0,0,l,g),v(b,m);let y=function(e){if(!e)return null;let t=e.getContext("2d",{willReadFrequently:!0});if(!t)return null;let a=0|e.width,n=0|e.height;if(!(a>0&&n>0))return null;let r=t.getImageData(0,0,a,n).data,i=a,l=n,o=-1,c=-1;for(let e=0;e<n;e++){let t=e*a*4;for(let n=0;n<a;n++)!(r[t+4*n+3]<=10)&&(n<i&&(i=n),e<l&&(l=e),n>o&&(o=n),e>c&&(c=e))}if(o<0)return null;let d=Math.max(0,Math.round(s(8,0)));return{x:Math.max(0,i-d),y:Math.max(0,l-d),w:Math.max(1,Math.min(a-1,o+d)-Math.max(0,i-d)+1),h:Math.max(1,Math.min(n-1,c+d)-Math.max(0,l-d)+1)}}(x);return y?{v:"cvf1",u:String(e),w:y.w,h:y.h,bg:function(e,t){let a=e&&"object"==typeof e?e:{},n=u(a.VIEW||{}),r=String(a.bgMode||"none");if("grid"!==r&&"lined"!==r)return{m:"none"};let i=Math.max(1,s(a.bgStep,24))*Math.max(1e-4,s(n.scale,1));if(!(i>0))return{m:"none"};let l=s(t&&t.x,0),c=s(t&&t.y,0);return{m:r,s:d(i),ox:d(p(s(n.panX,0)-l,i)),oy:d(p(s(n.panY,0)-c,i)),c:(0,o.rgbaFromAny)((0,o.getAccentCssVar)(),.65),lw:1.125}}(t,y),it:(a=Array.isArray(m)?m:[],n=s(y&&y.x,0),r=s(y&&y.y,0),a.map(e=>e?"r"===e.k?{k:"r",f:String(e.f||""),x:d(s(e.x,0)-n),y:d(s(e.y,0)-r),w:d(s(e.w,0)),h:d(s(e.h,0))}:{k:"e"===e.k?"e":"p",c:String(e.c||""),a:c(s(e.a,1),0,1),w:d(s(e.w,1)),p:(Array.isArray(e.p)?e.p:[]).map(e=>[d(s(e&&e[0],0)-n),d(s(e&&e[1],0)-r)])}:null).filter(Boolean))}:{v:"cvf1",u:String(e),e:1,w:0,h:0,bg:{m:"none"},it:[]}}function k(e){let t=x(e);if(!t)return null;let a=b(t);return a?w(t,a):null}function M(e){let t=y(e),a=[];for(let e=0;e<t.length;e++){let n=k(t[e]);n&&a.push(n)}return a}function S(e){return!!(e&&1!==e.e&&s(e.w,0)>0&&s(e.h,0)>0&&Array.isArray(e.it)&&e.it.length)}function _(e,t){if(!e||!t)return null;let a=Math.max(1,Math.round(s(t.w,1))),n=Math.max(1,Math.round(s(t.h,1))),r=window.devicePixelRatio||1;e.width=Math.max(1,Math.round(a*r)),e.height=Math.max(1,Math.round(n*r)),e.style.width=a+"px",e.style.height=n+"px";let i=e.getContext("2d",{willReadFrequently:!0});return i.setTransform(r,0,0,r,0,0),i.clearRect(0,0,a,n),!function(e,t,a,n){let r=t&&"object"==typeof t?t:{},i=String(r.m||"none");if("grid"!==i&&"lined"!==i)return;let l=Math.max(1,s(r.s,1)),c=p(s(r.ox,0),l),d=p(s(r.oy,0),l),u=String(r.c||(0,o.rgbaFromAny)((0,o.getAccentCssVar)(),.65)),h=Math.max(.5,s(r.lw,1.125));if(e.save(),e.globalCompositeOperation="source-over",e.globalAlpha=1,e.strokeStyle=u,e.lineWidth=h,e.beginPath(),"grid"===i){for(let t=c;t<=a;t+=l)e.moveTo(t,0),e.lineTo(t,n);for(let t=d;t<=n;t+=l)e.moveTo(0,t),e.lineTo(a,t)}else for(let t=d;t<=n;t+=l)e.moveTo(0,t),e.lineTo(a,t);e.stroke(),e.restore()}(i,t.bg||{m:"none"},a,n),v(i,Array.isArray(t.it)?t.it:[]),e}function A(e,t){if(!e||!(e instanceof Element)||!t)return null;if(e.dataset.open="1",e.innerHTML="",!S(t)){let t=document.createElement("span");return t.className="lia-canvas-freeze-empty",t.textContent="Keine sichtbaren Canvas-Inhalte eingefroren.",e.appendChild(t),t}let a=document.createElement("span");a.className="lia-draw-block";let n=document.createElement("span");n.className="lia-draw-wrap";let r=document.createElement("canvas");return r.className="lia-canvas-freeze-preview",r.setAttribute("aria-label","Eingefrorene Zeichenfläche"),n.appendChild(r),a.appendChild(n),e.appendChild(a),_(r,t),r}function C(e,t){let a=m(e);return a?A(a,t):null}function E(){let e=i.LIA.freeze||{};return e.version="cvf1",e.collectCanvasPairsFromRoot=y,e.getCanvasMountFromPair=m,e.getCanvasUidFromPair=x,e.getCanvasStoreEntry=b,e.exportCanvasFreezeStateFromEntry=w,e.exportCanvasFreezeStateFromPair=k,e.exportAllCanvasFreezeStatesFromRoot=M,e.hasCanvasFreezeContent=S,e.paintCanvasFreezeStateToCanvas=_,e.renderCanvasFreezeStateIntoMount=A,e.renderCanvasFreezeStateIntoPair=C,i.LIA.freeze=e,e}},{"../index":"bZBjE","./store":"bxEU5","./theme":"9gAEw","@parcel/transformer-js/src/esmodule-helpers.js":"9p1zA"}],bxEU5:[function(e,t,a,n){var r=e("@parcel/transformer-js/src/esmodule-helpers.js");r.defineInteropFlag(a),r.export(a,"ensureMountUID",()=>l),r.export(a,"__liaDispatchCanvasFreezeChange",()=>o);var i=e("../index");function l(e){if(!e)return"";if(e.dataset&&e.dataset.uid)return e.dataset.uid;let t="c"+ ++i.LIA.uidSeq;return e.dataset.uid=t,t}function o(e){try{let t=Object.assign({ts:Date.now()},e&&"object"==typeof e?e:{}),a=(0,i.getRootWindow)();(a&&"function"==typeof a.dispatchEvent?a:window).dispatchEvent(new CustomEvent("lia:canvas-change",{detail:t}))}catch(e){}}},{"../index":"bZBjE","@parcel/transformer-js/src/esmodule-helpers.js":"9p1zA"}],"2KvOo":[function(e,t,a,n){var r=e("@parcel/transformer-js/src/esmodule-helpers.js");r.defineInteropFlag(a),r.export(a,"ensureCanvasFreezeApi",()=>s.ensureCanvasFreezeApi),r.export(a,"canvasMarkup",()=>d),r.export(a,"initAll",()=>p);var i=e("../index"),l=e("./theme"),o=e("./store"),s=e("./freeze"),c=e("../lia/input");function d(){return`
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
  `}function p(){document.querySelectorAll(".lia-draw-wrap canvas.lia-draw:not([data-ready])").forEach(e=>{e.setAttribute("data-ready","1"),function(e){let t=e.closest(".lia-draw-wrap");if(!t)return;let a=t.closest(".lia-canvas-mount"),n=(0,o.ensureMountUID)(a),r=t.querySelector(".lia-undo-btn"),s=t.querySelector(".lia-redo-btn"),d=t.querySelector(".lia-color-btn"),p=t.querySelector(".lia-eraser-btn"),u=t.querySelector(".lia-rect-btn"),h=t.querySelector(".lia-bgmenu-btn"),f=t.querySelector(".lia-tool-menu"),g=document.createElement("button");g.type="button",g.className="lia-rect-action",g.textContent="Als Lösung übergeben",g.style.display="none",t.appendChild(g);let m=document.createElement("div");m.className="lia-rect-progress",m.dataset.on="0",m.innerHTML=`
    <div class="lia-rect-progbar"><div class="lia-rect-progfill"></div></div>
    <div class="lia-rect-progtxt">0%</div>
  `,t.appendChild(m);let x=m.querySelector(".lia-rect-progfill"),b=m.querySelector(".lia-rect-progtxt");m.addEventListener("pointerdown",e=>{e.preventDefault(),e.stopPropagation()}),g.addEventListener("pointerdown",e=>{e.preventDefault(),e.stopPropagation()});let y=document.createElement("button");y.type="button",y.className="lia-rect-close",y.setAttribute("aria-label","Marker-Rechteck entfernen"),y.style.display="none",y.innerHTML=`
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 7L17 17M17 7L7 17" fill="none" stroke="currentColor"
            stroke-width="2.4" stroke-linecap="round"/>
    </svg>
  `,t.appendChild(y);let v=document.createElement("span");v.className="lia-eraser-ring",v.dataset.on="0",t.appendChild(v),y.addEventListener("pointerdown",e=>{e.preventDefault(),e.stopPropagation()}),y.addEventListener("click",e=>{e.preventDefault(),e.stopPropagation(),function(){let e=!1;for(let t=X.length-1;t>=0;t--)X[t]&&"rect"===X[t].kind&&(X.splice(t,1),e=!0);for(let t=V.length-1;t>=0;t--)V[t]&&"rect"===V[t].kind&&(V.splice(t,1),e=!0);e&&(ey(),ew(),ek(),er()),eh()}()}),(0,l.setUndoIcon)(r),(0,l.setRedoIcon)(s),(0,l.setEraserIcon)(p),(0,l.setRectIcon)(u),h&&!h.__bgCleared&&(h.__bgCleared=!0,h.innerHTML="");let w=e.getContext("2d",{willReadFrequently:!0}),k=document.createElement("canvas"),M=k.getContext("2d",{willReadFrequently:!0}),S=document.createElement("canvas"),_=S.getContext("2d",{willReadFrequently:!0}),A=i.LIA.store,C=n&&A[n]?A[n]:null,E=C&&C.VIEW?{...C.VIEW}:{panX:0,panY:0,scale:1,minScale:.25,maxScale:8},L=0,I=!1;function R(e){try{let t=i.LIA.bar;t&&t.log&&t.log(e)}catch(e){}}function j(e){let t=String(e||""),a="",n=!1;for(let e=0;e<t.length;e++){let r=t[e];" "===r||"\n"===r||"\r"===r||"	"===r||"\f"===r?(n||(a+=" "),n=!0):(a+=r,n=!1)}return a.trim()}function O(e){let t=String(e||"").trim();return t.startsWith("$$")&&t.endsWith("$$")&&(t=t.slice(2,-2).trim()),t.startsWith("$")&&t.endsWith("$")&&(t=t.slice(1,-1).trim()),t.startsWith("\\[")&&t.endsWith("\\]")&&(t=t.slice(2,-2).trim()),j(t)}function z(e){let t=String(e||"").trim(),a="\\mathrm{";if(t.startsWith(a)&&t.endsWith("}")){t=t.slice(a.length,-1);let e="";for(let a=0;a<t.length;a++)"~"!==t[a]&&(e+=t[a]);return e.trim()}return t}function T(e){let t=Math.max(e.width,e.height),a=1;if(t<420&&(a=420/t),t>1400&&(a=1400/t),.06>Math.abs((a=en(a,.5,4))-1))return e;let n=document.createElement("canvas");n.width=Math.max(1,Math.round(e.width*a)),n.height=Math.max(1,Math.round(e.height*a));let r=n.getContext("2d",{willReadFrequently:!0});return r.fillStyle="#fff",r.fillRect(0,0,n.width,n.height),r.drawImage(e,0,0,n.width,n.height),n}function q(e){let t=document.createElement("canvas");t.width=Math.max(1,0|e.width),t.height=Math.max(1,0|e.height);let a=t.getContext("2d",{willReadFrequently:!0});a.fillStyle="#fff",a.fillRect(0,0,t.width,t.height),a.drawImage(e,0,0);let n=a.getImageData(0,0,t.width,t.height).data,r=t.width,i=t.height,l=new Uint8Array(r*i);for(let e=0,t=0;t<l.length;t++,e+=4)l[t]=+(.299*n[e]+.587*n[e+1]+.114*n[e+2]<200);let o=l;for(let e=0;e<0;e++)o=function(e){let t=new Uint8Array(r*i);for(let a=1;a<i-1;a++)for(let n=1;n<r-1;n++){let i=a*r+n,l=0;for(let t=-1;t<=1;t++)for(let a=-1;a<=1;a++)if(e[i+t*r+a]){l=1,t=2;break}t[i]=l}return t}(o);let s=r,c=i,d=-1,p=-1;for(let e=0;e<i;e++)for(let t=0;t<r;t++)o[e*r+t]&&(t<s&&(s=t),e<c&&(c=e),t>d&&(d=t),e>p&&(p=e));if(d<0)return t;s=Math.max(0,s-18),c=Math.max(0,c-18);let u=Math.max(1,(d=Math.min(r-1,d+18))-s+1),h=Math.max(1,(p=Math.min(i-1,p+18))-c+1),f=document.createElement("canvas");f.width=u,f.height=h;let g=f.getContext("2d",{willReadFrequently:!0}),m=g.createImageData(u,h),x=m.data;for(let e=0;e<h;e++)for(let t=0;t<u;t++){let a=255*!o[(c+e)*r+(s+t)],n=(e*u+t)*4;x[n]=a,x[n+1]=a,x[n+2]=a,x[n+3]=255}g.putImageData(m,0,0);let b=512/Math.max(u,h);b<.75&&(b=.75),b>3.5&&(b=3.5);let y=document.createElement("canvas");y.width=Math.max(1,Math.round(u*b)),y.height=Math.max(1,Math.round(h*b));let v=y.getContext("2d",{willReadFrequently:!0});return v.fillStyle="#fff",v.fillRect(0,0,y.width,y.height),v.imageSmoothingEnabled=!0,v.drawImage(f,0,0,y.width,y.height),y}function P(e,t){let a=+(1===(t&&"object"==typeof t?t:{}).dilate),n=document.createElement("canvas");n.width=Math.max(1,0|e.width),n.height=Math.max(1,0|e.height);let r=n.getContext("2d",{willReadFrequently:!0});r.fillStyle="#fff",r.fillRect(0,0,n.width,n.height),r.drawImage(e,0,0);let i=r.getImageData(0,0,n.width,n.height).data,l=n.width,o=n.height,s=new Uint8Array(l*o);for(let e=0,t=0;t<s.length;t++,e+=4)s[t]=+(.299*i[e]+.587*i[e+1]+.114*i[e+2]<225);1===a&&(s=function(e){let t=new Uint8Array(l*o);for(let a=1;a<o-1;a++)for(let n=1;n<l-1;n++){let r=a*l+n,i=0;for(let t=-1;t<=1;t++)for(let a=-1;a<=1;a++)if(e[r+t*l+a]){i=1,t=2;break}t[r]=i}return t}(s));let c=l,d=o,p=-1,u=-1;for(let e=0;e<o;e++)for(let t=0;t<l;t++)s[e*l+t]&&(t<c&&(c=t),e<d&&(d=e),t>p&&(p=t),e>u&&(u=e));if(p<0)return q(e);let h=Math.max(1,p-c+1),f=Math.max(1,u-d+1),g=Math.max(24,Math.floor(.35*Math.max(h,f))),m=Math.max(64,Math.min(1024,Math.max(h,f)+2*g)),x=document.createElement("canvas");x.width=m,x.height=m;let b=x.getContext("2d",{willReadFrequently:!0}),y=b.createImageData(m,m),v=y.data;for(let e=0;e<v.length;e+=4)v[e]=255,v[e+1]=255,v[e+2]=255,v[e+3]=255;let w=Math.floor((m-h)/2),k=Math.floor((m-f)/2);for(let e=0;e<f;e++)for(let t=0;t<h;t++){let a=255*!s[(d+e)*l+(c+t)],n=((k+e)*m+(w+t))*4;v[n]=a,v[n+1]=a,v[n+2]=a,v[n+3]=255}b.putImageData(y,0,0);let M=document.createElement("canvas");M.width=512,M.height=512;let S=M.getContext("2d",{willReadFrequently:!0});return S.fillStyle="#fff",S.fillRect(0,0,512,512),S.imageSmoothingEnabled=!1,S.drawImage(x,0,0,512,512),M}function F(e,t){let a=t*Math.PI/180,n=0|e.width,r=0|e.height,i=document.createElement("canvas");i.width=Math.max(1,n),i.height=Math.max(1,r);let l=i.getContext("2d",{willReadFrequently:!0});return l.fillStyle="#fff",l.fillRect(0,0,i.width,i.height),l.translate(i.width/2,i.height/2),l.rotate(a),l.translate(-n/2,-r/2),l.imageSmoothingEnabled=!1,l.drawImage(e,0,0),i}function B(e){let t=String(e||"").trim();if(!t||-1!==t.indexOf("\\"))return null;let a={O:"0",o:"0",Q:"0",D:"0",I:"1",l:"1","|":"1","!":"1",Z:"2",z:"2",S:"5",s:"5",B:"8",g:"9",q:"9"},n="";for(let e=0;e<t.length;e++){let r=t[e],i=t.charCodeAt(e);if(i>=48&&i<=57){n+=r;continue}if(!(" \n\r	".includes(r)||"${}()[]".includes(r))&&!",.;:_-".includes(r)){if(a[r]){n+=a[r];continue}return null}}return(n=String(n).trim())&&!(n.length>3)?n:null}async function W(e,t){let a=[],n=P(t,{dilate:0}),r=P(t,{dilate:1});for(let e of[0,-6,6])a.push(F(n,e));for(let e of[0,-6,6])a.push(F(r,e));let i={},l=[];for(let t=0;t<a.length;t++){let n="";try{n=await e.recognize(a[t],{max_new_tokens:8,do_sample:!1,temperature:0,__silent:!0})}catch(e){continue}let r=O(n),o=B(r=z(r));if(o&&(i[o]||(i[o]=0,l.push(o)),i[o]+=1,i[o]>=3))return o}let o=null,s=0;for(let e of l)(i[e]||0)>s&&(s=i[e],o=e);return o}let H=0,D=0;function N(e){if(!m||!x||!b)return;let t=Math.max(0,Math.min(1,Number(e)));x.style.width=Math.round(100*t)+"%",b.textContent=Math.round(100*t)+"%"}async function $({auto:a=!1}={}){let n,r=ec();if(!r)return void R("No marker-rectangle found.");let l=i.LIA.ocr;if(!l||!l.recognize)return void R("OCR engine not available (LIA.ocr).");let o=g.textContent||"";g.disabled=!0,g.textContent="Schrifterkennung läuft...",m&&(m.dataset.on="1",N(0),eh()),D=performance.now(),n=()=>{let e=performance.now()-D;N(e<900?e/900*.7:e<2200?.7+(e-900)/1300*.2:.9+Math.min(.08,(e-2200)/5e3*.08)),H=requestAnimationFrame(n)},H=requestAnimationFrame(n);try{l.ensureLoaded&&await l.ensureLoaded(!1);let a=function(t){if(!t)return null;let a=window.devicePixelRatio||1,n=Math.min(t.x0,t.x1),r=Math.min(t.y0,t.y1),i=Math.max(t.x0,t.x1),l=Math.max(t.y0,t.y1),o=eg(n,r),s=eg(i,l),c=en(Math.min(o.sx,s.sx),0,e.clientWidth),d=en(Math.min(o.sy,s.sy),0,e.clientHeight),p=en(Math.max(o.sx,s.sx),0,e.clientWidth),u=en(Math.max(o.sy,s.sy),0,e.clientHeight),h=p-c,f=u-d;if(h<6||f<6)return null;let g=Math.round((c-12)*a),m=Math.round((d-12)*a),x=Math.round((h+24)*a),b=Math.round((f+24)*a),y=document.createElement("canvas");y.width=Math.max(1,x),y.height=Math.max(1,b);let v=y.getContext("2d",{willReadFrequently:!0});v.setTransform(1,0,0,1,0,0),v.globalCompositeOperation="source-over",v.globalAlpha=1,v.clearRect(0,0,y.width,y.height);let w=S.width,k=S.height,M=g,_=m,A=x,C=b,E=0,L=0,I=y.width,R=y.height;if(M<0){let e=-M/A;E+=I*e,I-=I*e,A+=M,M=0}if(_<0){let e=-_/C;L+=R*e,R-=R*e,C+=_,_=0}if(M+A>w){let e=M+A-w;I-=e/A*I,A-=e}if(_+C>k){let e=_+C-k;R-=e/C*R,C-=e}if(A<=1||C<=1||I<=1||R<=1)return null;v.drawImage(S,M,_,A,C,E,L,I,R);let j=v.getImageData(0,0,y.width,y.height),O=j.data;for(let e=0;e<O.length;e+=4)O[e+3]>10?(O[e]=0,O[e+1]=0,O[e+2]=0):(O[e]=255,O[e+1]=255,O[e+2]=255),O[e+3]=255;return v.putImageData(j,0,0),y}(r);if(!a)return void R("Crop failed (rect too small or out of bounds).");let n=function(e){try{let t=0|e.width,a=0|e.height,n=e.getContext("2d",{willReadFrequently:!0}).getImageData(0,0,t,a).data,r=t*a>12e5?2:1,i=t,l=a,o=-1,s=-1,c=0;for(let e=0;e<a;e+=r){let a=e*t*4;for(let d=0;d<t;d+=r)n[a+4*d]<128&&(c++,d<i&&(i=d),e<l&&(l=e),d>o&&(o=d),e>s&&(s=e))}if(o<0)return null;let d=o-i+1,p=s-l+1;return{xMin:i,yMin:l,xMax:o,yMax:s,w:d,h:p,black:c,W:t,H:a}}catch(e){}return null}(a),i=function(e,t){if(!e||!t)return!1;let a=Math.max(1,0|t.width),n=Math.max(1,0|t.height),r=Math.max(1,0|e.w),i=Math.max(1,0|e.h),l=Math.max(r,i),o=Math.min(r,i),s=r/Math.max(1,i),c=(Number(e.black||0)||0)/Math.max(1,r*i);return!(l>220||o>170||s<.2||s>2.8||c<.01||c>.6||r>Math.floor(.82*a)&&i>Math.floor(.82*n)&&l>140)}(n,a),s=String(l.model||""),d=-1!==s.toLowerCase().indexOf("trocr"),p=a,u="";try{p=i?P(a,{dilate:0}):q(a)}catch(e){p=a}try{p=T(p)}catch(e){}if(u=await l.recognize(p,i?{max_new_tokens:16,do_sample:!1,temperature:0}:{max_new_tokens:128,do_sample:!1,temperature:0}),i){let e=String(u||"").trim();if(-1!==e.indexOf("\\")||-1!==e.indexOf("{")||-1!==e.indexOf("}")||-1!==e.indexOf("^")||-1!==e.indexOf("_")||-1!==e.indexOf("sqrt")||-1!==e.indexOf("frac")||function(e){let t=String(e||"").trim();if(!t||/[+\-*/=,:;\\]$/.test(t)||/[{[(]$/.test(t))return!0;let a=0,n=0,r=0,i=!1;for(let e=0;e<t.length;e++){let l=t[e];if(i){i=!1;continue}if("\\"===l){i=!0;continue}"{"===l?a++:"}"===l?a--:"["===l?n++:"]"===l?n--:"("===l?r++:")"===l&&r--}return 0!==a||0!==n||0!==r}(e)){let e=a;try{e=q(a)}catch(t){e=a}try{e=T(e)}catch(e){}u=await l.recognize(e,{max_new_tokens:128,do_sample:!1,temperature:0})}}let h=d?function(e){let t=j(e),a="+-=*/()[]{}",n="";for(let e=0;e<t.length;e++){let r=t[e];if(" "===r){let r=e>0?t[e-1]:"",i=e+1<t.length?t[e+1]:"";if(a.indexOf(r)>=0||a.indexOf(i)>=0)continue;n+=" "}else n+=r}return n.trim()}(u):z(O(u));if(i||function(e){let t=String(e||"").trim();if(!t||t.length>6||-1!==t.indexOf("\\"))return!1;let a=!1;for(let e=0;e<t.length;e++){let n=t.charCodeAt(e),r=t[e];if(n>=48&&n<=57||"lLIi|!OoQqSsZzBg".includes(r)){a=!0;continue}if(!" \n\r	()[]{}.,;:_-".includes(r))return!1}return a}(h)){let e=B(h);if(e)h=e;else{let e=function(e){let t=String(e||"").trim();if(!t)return null;let a=!0;for(let e=0;e<t.length;e++){let n=t.charCodeAt(e);if(n<48||n>57){a=!1;break}}if(a)return t;let n=t.toLowerCase();if("li"===n||"l1"===n||"il"===n)return"4";if("go"===n||"g0"===n||"qo"===n||"q0"===n)return"8";let r={O:"0",o:"0",Q:"0",I:"1",l:"1","|":"1","!":"1",Z:"2",z:"2",J:"3",j:"3",H:"4",h:"4",S:"5",s:"5",B:"8",g:"9",q:"9"},i="";for(let e=0;e<t.length;e++){let a=t[e];if(!r[a])return null;i+=r[a]}return i||null}(h);e&&(h=e)}if(!function(e){let t=String(e||"").trim();if(!t)return!1;for(let e=0;e<t.length;e++){let a=t.charCodeAt(e);if(a<48||a>57)return!1}return!0}(h)){let e=await W(l,a);e&&(h=e)}}R("OCR result: "+h);let f=t.closest(".lia-canvas-pair");(0,c.__liaFindAndSetInputBeforeNode)(f||t,h)?(g.textContent="✅ übernommen",setTimeout(()=>{g.textContent=o},900)):R("Could not find an input field before this @canvas.")}catch(e){R("OCR error: "+(e&&e.message?e.message:String(e))),g.textContent="⚠ Fehler",setTimeout(()=>{g.textContent=o},900)}finally{H&&(cancelAnimationFrame(H),H=0),N(1),setTimeout(()=>void(m&&(m.dataset.on="0",N(0))),250),g.disabled=!1}}g.addEventListener("click",async e=>{e.preventDefault(),e.stopPropagation(),await $({auto:!1})});let X=[],V=[];C&&(Array.isArray(C.ITEMS)?(X=C.ITEMS,V=Array.isArray(C.REDO)?C.REDO:[]):Array.isArray(C.STROKES)&&(X=C.STROKES.map(e=>({kind:"path",...e})),V=Array.isArray(C.REDO)?C.REDO.map(e=>({kind:"path",...e})):[]));let U="pen",Y="pen",K=0,Z=3,Q=1,J=12,G=C&&C.bgMode?C.bgMode:"none",ee=C&&C.bgStep?C.bgStep:24,et=null,ea=null;function en(e,t,a){return Math.max(t,Math.min(a,e))}function er(a){if(n){var r;A[n]={VIEW:{...E},ITEMS:X,REDO:V,bgMode:G,bgStep:ee,wrapW:t.getBoundingClientRect().width,canvasH:e.clientHeight},r=a||"persist",!n||I&&(clearTimeout(L),L=setTimeout(()=>{(0,o.__liaDispatchCanvasFreezeChange)({uid:n,reason:String(r||"persist"),hasItems:Array.isArray(X)&&X.length>0?1:0})},120))}}function ei(){let e=l.COLORS[K]||l.COLORS[0];return"auto"===e.key?(0,l.getAutoPen)():e.value||(0,l.getAutoPen)()}function el(e){f&&(f.dataset.open=e?"1":"0")}function eo(){f&&"1"===f.dataset.open&&el(!1)}function es(){return'<svg viewBox="-1 0 24 24" aria-hidden="true" style="width:22px;height:22px;display:block;"><path class="ico-stroke" d="M6 6l12 12M18 6L6 18" stroke-width="2" stroke-linecap="round"/></svg>'}function ec(){for(let e=X.length-1;e>=0;e--){let t=X[e];if(t&&"rect"===t.kind)return t}return null}function ed(){v&&(v.dataset.on="0")}function ep(t,a){if(!v)return;if("eraser"!==U||!isFinite(t)||!isFinite(a))return void ed();let n=Math.max(8,J*E.scale);v.style.width=n+"px",v.style.height=n+"px",v.style.left=en(t,0,e.clientWidth)+"px",v.style.top=en(a,0,e.clientHeight)+"px",v.dataset.on="1"}let eu=0;function eh(){eu||(eu=requestAnimationFrame(()=>{eu=0,function(){let t=ec();if(!t){g.style.display="none",y&&(y.style.display="none");return}g.style.display="block",g.style.visibility="hidden";let a=g.offsetWidth||180,n=g.offsetHeight||34;g.style.visibility="visible";let r=Math.min(t.x0,t.x1),i=Math.min(t.y0,t.y1),l=Math.max(t.x0,t.x1),o=Math.max(t.y0,t.y1),s=eg(r,i),c=eg(l,o),d=Math.max(s.sx,c.sx),p=Math.max(s.sy,c.sy),u=en(d-a,6,e.clientWidth-a-6),h=en(p+8,6,e.clientHeight-n-6);if(g.style.left=u+"px",g.style.top=h+"px",m){m.style.width=a+"px";let t=m.offsetHeight||26;m.style.left=en(u,6,e.clientWidth-a-6)+"px",m.style.top=en(h+n+6,6,e.clientHeight-t-6)+"px"}if(y){y.style.display="block",y.style.visibility="hidden";let t=y.offsetWidth||24,a=y.offsetHeight||24;y.style.visibility="visible";let n=Math.min(s.sy,c.sy),r=Math.max(s.sx,c.sx);y.style.left=en(r-.5*t,6,e.clientWidth-t-6)+"px",y.style.top=en(n-.5*a,6,e.clientHeight-a-6)+"px"}}()}))}function ef(e,t){return{x:(e-E.panX)/E.scale,y:(t-E.panY)/E.scale}}function eg(e,t){return{sx:e*E.scale+E.panX,sy:t*E.scale+E.panY}}function em(e){let t=window.devicePixelRatio||1;e.setTransform(t*E.scale,0,0,t*E.scale,t*E.panX,t*E.panY)}function ex(t){let a=window.devicePixelRatio||1;t.setTransform(a,0,0,a,0,0),t.globalCompositeOperation="source-over",t.globalAlpha=1,t.clearRect(0,0,e.clientWidth,e.clientHeight)}function eb(e,t){"eraser"===t.tool?(e.globalCompositeOperation="destination-out",e.globalAlpha=1,e.strokeStyle="rgba(0,0,0,1)"):(e.globalCompositeOperation="source-over",e.globalAlpha=t.alpha,e.strokeStyle=t.color),e.lineWidth=t.width,e.lineCap="round",e.lineJoin="round"}function ey(){for(let e of(ex(M),em(M),X)){if(!e||"rect"!==e.kind)continue;let t="accent"===e.colorKey?(0,l.getAccentCssVar)():e.color||(0,l.getAccentCssVar)(),a=(0,l.rgbaFromAny)(t,Math.max(0,Math.min(1,e.alpha))),n=Math.min(e.x0,e.x1),r=Math.min(e.y0,e.y1),i=Math.max(e.x0,e.x1),o=Math.max(e.y0,e.y1);M.save(),M.globalCompositeOperation="source-over",M.globalAlpha=1,M.fillStyle=a,M.fillRect(n,r,Math.max(0,i-n),Math.max(0,o-r)),M.restore()}}function ev(){for(let e of(ex(_),em(_),X))if(e&&"path"===e.kind&&e.points&&!(e.points.length<2)){eb(_,e),_.beginPath(),_.moveTo(e.points[0].x,e.points[0].y);for(let t=1;t<e.points.length;t++)_.lineTo(e.points[t].x,e.points[t].y);_.stroke()}}function ew(){let t;t=window.devicePixelRatio||1,w.setTransform(t,0,0,t,0,0),w.globalCompositeOperation="source-over",w.globalAlpha=1,w.clearRect(0,0,e.clientWidth,e.clientHeight),function(){let t,a;if("none"===G)return;let n=window.devicePixelRatio||1;w.setTransform(n*E.scale,0,0,n*E.scale,n*E.panX,n*E.panY);let r=Math.max(6,Number(ee)||24),i=(t=e.clientWidth,a=e.clientHeight,{x0:(0-E.panX)/E.scale,y0:(0-E.panY)/E.scale,x1:(t-E.panX)/E.scale,y1:(a-E.panY)/E.scale}),o=(0,l.rgbaFromAny)((0,l.getAccentCssVar)(),.65);w.save(),w.globalCompositeOperation="source-over",w.globalAlpha=1,w.strokeStyle=o,w.lineWidth=1.125/E.scale;let s=Math.floor(i.x0/r)*r,c=Math.ceil(i.x1/r)*r,d=Math.floor(i.y0/r)*r,p=Math.ceil(i.y1/r)*r;if(w.beginPath(),"grid"===G){let e=0;for(let t=s;t<=c&&(w.moveTo(t,i.y0),w.lineTo(t,i.y1),!(++e>4e3));t+=r);for(let t=d;t<=p&&(w.moveTo(i.x0,t),w.lineTo(i.x1,t),!(++e>4e3));t+=r);}else{let e=0;for(let t=d;t<=p&&(w.moveTo(i.x0,t),w.lineTo(i.x1,t),!(++e>4e3));t+=r);}w.stroke(),w.restore()}();let a=window.devicePixelRatio||1;if(w.setTransform(a,0,0,a,0,0),w.globalCompositeOperation="source-over",w.globalAlpha=1,w.drawImage(k,0,0,k.width,k.height,0,0,e.clientWidth,e.clientHeight),ea){let e=(0,l.rgbaFromAny)((0,l.getAccentCssVar)(),.28),t=Math.min(ea.x0,ea.x1),a=Math.min(ea.y0,ea.y1),n=Math.max(ea.x0,ea.x1),r=Math.max(ea.y0,ea.y1),i=eg(t,a),o=eg(n,r);w.save(),w.fillStyle=e,w.globalAlpha=1,w.fillRect(i.sx,i.sy,Math.max(0,o.sx-i.sx),Math.max(0,o.sy-i.sy)),w.restore()}w.drawImage(S,0,0,S.width,S.height,0,0,e.clientWidth,e.clientHeight),eh()}function ek(){let e=ei(),t=(0,l.getAccentCssVar)();if(r&&(r.disabled=0===X.length,r.title="Rückgängig"),s&&(s.disabled=0===V.length,s.title="Wiederherstellen"),d&&(d.style.background=e,d.dataset.active="pen"===U?"1":"0",d.title="Stift"),p&&(p.dataset.active="eraser"===U?"1":"0",p.title="Radierer"),u&&(u.style.background="transparent",u.dataset.active="rect"===U?"1":"0",u.title="Marker-Rechteck"),h){let e=(0,l.rgbaFromAny)(t,.65);h.style.backgroundColor="transparent",h.style.backgroundImage=`linear-gradient(to right, ${e} 1.8px, transparent 1.8px), linear-gradient(to bottom, ${e} 1.8px, transparent 1.8px)`,h.style.backgroundSize="6px 6px",h.style.backgroundPosition="center",h.dataset.active="bg"===Y?"1":"0",h.title="Hintergrund"}"eraser"!==U&&ed()}function eM(e){if(ea){if(e){let e=Math.min(ea.x0,ea.x1),t=Math.min(ea.y0,ea.y1),a=Math.max(ea.x0,ea.x1),n=Math.max(ea.y0,ea.y1);if(a-e>.001&&n-t>.001){for(let e=X.length-1;e>=0;e--)X[e]&&"rect"===X[e].kind&&X.splice(e,1);for(let e=V.length-1;e>=0;e--)V[e]&&"rect"===V[e].kind&&V.splice(e,1);X.push({kind:"rect",x0:e,y0:t,x1:a,y1:n,alpha:.28,colorKey:"accent"}),V.length=0}}ea=null,ey(),ew(),ek(),er(),eh()}}function eS(){ed();let t=window.devicePixelRatio||1,a=e.clientWidth,n=e.clientHeight,r=Math.max(1,Math.round(a*t)),i=Math.max(1,Math.round(n*t));e.width=r,e.height=i,k.width=r,k.height=i,S.width=r,S.height=i,ey(),ev(),ew(),ek(),er()}ek(),eS(),new ResizeObserver(()=>eS()).observe(e),!function(){if(t.__cornersReady)return;t.__cornersReady=!0;let a=document.createElement("button");a.type="button",a.className="lia-resize-corner",a.dataset.corner="bl",a.setAttribute("aria-label","Zeichenfläche ziehen (links unten)");let n=document.createElement("button");n.type="button",n.className="lia-resize-corner",n.dataset.corner="br",n.setAttribute("aria-label","Zeichenfläche ziehen (rechts unten)"),t.appendChild(a),t.appendChild(n);let r=(e,t,a)=>Math.max(t,Math.min(a,e));function i(a,n){let i=!1,l=0,o=0,s=0,c=0;function d(e){if(i){i=!1;try{a.releasePointerCapture(e.pointerId)}catch(e){}eS(),er()}}a.addEventListener("pointerdown",function(n){eo(),n.preventDefault(),n.stopPropagation(),i=!0,s=t.getBoundingClientRect().width,c=e.clientHeight||245,l=n.clientX,o=n.clientY;try{a.setPointerCapture(n.pointerId)}catch(e){}}),a.addEventListener("pointermove",function(a){if(!i)return;a.preventDefault();let d=a.clientX-l,p=a.clientY-o;e.style.height=r(c+p,130,9e3)+"px";let u=function(){let e=t.closest(".lia-canvas-mount")||t.parentElement||t,a=0;try{a=e.getBoundingClientRect().width}catch(e){}if((!a||a<200)&&document.querySelector("main"))try{a=document.querySelector("main").getBoundingClientRect().width}catch(e){}return Math.max(200,Math.floor(a||200))}();t.style.width=r("br"===n?s+d:s-d,200,u)+"px"}),a.addEventListener("pointerup",d),a.addEventListener("pointercancel",d)}i(n,"br"),i(a,"bl")}(),document.addEventListener("lia-canvas-theme",()=>{ek(),ey(),ev(),ew()}),r&&!r.__bound&&(r.__bound=!0,r.addEventListener("click",e=>{e.preventDefault(),e.stopPropagation(),X.length&&(V.push(X.pop()),ey(),ev(),ew(),ek(),er())})),s&&!s.__bound&&(s.__bound=!0,s.addEventListener("click",e=>{e.preventDefault(),e.stopPropagation(),V.length&&(X.push(V.pop()),ey(),ev(),ew(),ek(),er())})),u&&!u.__bound&&(u.__bound=!0,u.addEventListener("click",e=>{e.stopPropagation(),U="rect",Y="rect",el(!1),ek()})),d&&f&&d.addEventListener("click",e=>{e.stopPropagation(),U="pen",Y="pen";let t="1"===f.dataset.open,a="pen"===f.__mode;t&&a||function e(){if(!f)return;f.__mode="pen";let t=(0,l.getAutoPen)(),a="";a+=`<span class="lia-heading-row"><span class="lia-tool-heading">Stift</span><button class="lia-menu-icon-btn" type="button" data-act="close" aria-label="Schlie\xdfen">${es()}</button></span><span class="lia-color-grid">`;for(let e=0;e<l.COLORS.length;e++){let n=l.COLORS[e],r="auto"===n.key?t:n.value||t;a+=`<button class="lia-color-item" type="button" data-act="color" data-idx="${e}" data-active="${e===K?"1":"0"}" style="background:${r};" aria-label="Farbe ${n.key}"></button>`}f.innerHTML=a+=`</span><span class="lia-row"><span class="lia-preview"><span class="lia-preview-line" data-k="pw" style="height:${Math.max(2,Math.min(14,Z))}px;"></span></span><input class="lia-slider" type="range" min="1" max="100" step="1" value="${Z}" data-act="penWidth" aria-label="Stiftbreite"><span style="font-weight:800;min-width:2.6em;text-align:right">${Z}</span></span><span class="lia-row"><span class="lia-preview"><span class="lia-preview-line" data-k="pa" style="opacity:${Q};"></span></span><input class="lia-slider" type="range" min="0.15" max="1" step="0.05" value="${Q}" data-act="penAlpha" aria-label="Deckkraft"><span style="font-weight:800;min-width:2.6em;text-align:right">${Math.round(100*Q)}%</span></span>`,f.onclick=t=>{let a=t.target&&t.target.closest?t.target.closest("[data-act]"):null;if(!a)return;let n=a.getAttribute("data-act");if("close"===n)return void el(!1);if("color"===n){let t=Number(a.getAttribute("data-idx"));isFinite(t)&&(K=en(t,0,l.COLORS.length-1)),U="pen",ek(),er(),e();return}};let n=f.querySelector('input[data-act="penWidth"]');n&&(n.oninput=()=>{Z=en(Number(n.value),1,100),ek(),er();let e=f.querySelector('[data-k="pw"]');e&&(e.style.height=Math.max(2,Math.min(14,Z))+"px");let t=n.parentElement&&n.parentElement.querySelector('span[style*="min-width"]');t&&(t.textContent=String(Z))});let r=f.querySelector('input[data-act="penAlpha"]');r&&(r.oninput=()=>{Q=en(Number(r.value),.05,1),ek(),er();let e=f.querySelector('[data-k="pa"]');e&&(e.style.opacity=String(Q));let t=r.parentElement&&r.parentElement.querySelector('span[style*="min-width"]');t&&(t.textContent=Math.round(100*Q)+"%")})}(),el(!t||!a),ek()}),p&&f&&p.addEventListener("click",e=>{e.stopPropagation(),U="eraser",Y="eraser";let t="1"===f.dataset.open,a="eraser"===f.__mode;t&&a||function(){if(!f)return;f.__mode="eraser",f.innerHTML=`<span class="lia-heading-row"><span class="lia-tool-heading">Radierer</span><span style="display:flex;gap:8px;align-items:center"><button class="lia-menu-icon-btn" type="button" data-act="clear" aria-label="Alles l\xf6schen"><svg viewBox="-1 0 24 24" aria-hidden="true" style="width:22px;height:22px;display:block;"><path class="ico-stroke" d="M9 3h6" stroke-width="2" stroke-linecap="round"/><path class="ico-stroke" d="M4 6h16" stroke-width="2" stroke-linecap="round"/><path class="ico-stroke" d="M7 6l1 15h8l1-15" stroke-width="2" stroke-linejoin="round"/><path class="ico-stroke" d="M10 10v8M14 10v8" stroke-width="2" stroke-linecap="round"/></svg></button><button class="lia-menu-icon-btn" type="button" data-act="close" aria-label="Schlie\xdfen">${es()}</button></span></span><span class="lia-row"><span class="lia-preview"><span class="lia-preview-line" style="height:${Math.max(2,Math.min(18,J))}px;"></span></span><input class="lia-slider" type="range" min="4" max="500" step="1" value="${J}" data-act="eraserWidth" aria-label="Radiererbreite"><span style="font-weight:800;min-width:2.6em;text-align:right">${J}</span></span>`,f.onclick=e=>{let t=e.target?.closest?.("[data-act]");if(!t)return;let a=t.getAttribute("data-act");"close"===a?el(!1):"clear"===a&&(X.length=0,V.length=0,ey(),ev(),ew(),ek(),er())};let e=f.querySelector('input[data-act="eraserWidth"]');e&&(e.oninput=()=>{J=en(Number(e.value),2,500),ek(),er();let t=e.parentElement&&e.parentElement.querySelector('span[style*="min-width"]');t&&(t.textContent=String(J))})}(),el(!t||!a),ek()}),h&&f&&h.addEventListener("click",e=>{e.stopPropagation(),Y="bg";let t="1"===f.dataset.open,a="bg"===f.__mode;t&&a||function e(){if(!f)return;f.__mode="bg",f.innerHTML=`<span class="lia-heading-row"><span class="lia-tool-heading">Hintergrund</span><button class="lia-menu-icon-btn" type="button" data-act="close" aria-label="Schlie\xdfen">${es()}</button></span><span class="lia-bg-tiles"><button class="lia-bg-tile" type="button" data-act="bg" data-mode="none" data-active="${"none"===G?"1":"0"}" aria-label="Kein Hintergrund"></button><button class="lia-bg-tile" type="button" data-act="bg" data-mode="grid" data-active="${"grid"===G?"1":"0"}" aria-label="Kariert"></button><button class="lia-bg-tile" type="button" data-act="bg" data-mode="lined" data-active="${"lined"===G?"1":"0"}" aria-label="Liniert"></button></span><span class="lia-row"><span style="font-weight:800;opacity:.8;min-width:4.8em">Abstand</span><input class="lia-slider" type="range" min="8" max="80" step="1" value="${ee}" data-act="bgStep" aria-label="Hintergrundabstand"><span style="font-weight:800;min-width:2.6em;text-align:right">${ee}</span></span>`;try{let e=(0,l.rgbaFromAny)((0,l.getAccentCssVar)(),.65),t=f.querySelectorAll(".lia-bg-tile");t&&t.length>=3&&(t[1].style.backgroundImage=`linear-gradient(to right, ${e} 2px, transparent 2px), linear-gradient(to bottom, ${e} 2px, transparent 2px)`,t[1].style.backgroundSize="10px 10px",t[1].style.backgroundPosition="center",t[2].style.backgroundImage=`linear-gradient(to bottom, ${e} 2px, transparent 2px)`,t[2].style.backgroundSize="10px 10px",t[2].style.backgroundPosition="center")}catch(e){}f.onclick=t=>{let a=t.target?.closest?.("[data-act]");if(!a)return;let n=a.getAttribute("data-act");if("close"===n)return void el(!1);if("bg"===n){let t=String(a.getAttribute("data-mode")||"none");G="grid"===t||"lined"===t?t:"none",ew(),er(),e(),ek();return}};let t=f.querySelector('input[data-act="bgStep"]');t&&(t.oninput=()=>{ee=en(Number(t.value),6,300),ew(),er();let e=t.parentElement&&t.parentElement.querySelector('span[style*="min-width"]');e&&(e.textContent=String(ee))})}(),el(!t||!a),ek()}),document.addEventListener("click",e=>{t.contains(e.target)||el(!1)}),document.addEventListener("keydown",e=>{"Escape"===e.key&&el(!1)});let e_=!1;function eA(e){return Math.max(E.minScale,Math.min(E.maxScale,e))}window.addEventListener("keydown",e=>{"Space"===e.code&&(e_=!0)}),window.addEventListener("keyup",e=>{"Space"===e.code&&(e_=!1)}),e.addEventListener("contextmenu",e=>e.preventDefault()),e.addEventListener("wheel",t=>{eo(),t.preventDefault(),ed();let a=e.getBoundingClientRect();!function(e,t,a){let n=E.scale,r=eA(n*e);if(r===n)return;let i=ef(t,a);E.scale=r,E.panX=t-i.x*r,E.panY=a-i.y*r,ey(),ev(),ew(),er()}(Math.exp(-(.0012*t.deltaY)),t.clientX-a.left,t.clientY-a.top)},{passive:!1});let eC=new Map,eE="idle",eL=0,eI=0,eR=null;function ej(t){let a=e.getBoundingClientRect();return{sx:t.clientX-a.left,sy:t.clientY-a.top}}function eO(e,t){return Math.hypot(e.sx-t.sx,e.sy-t.sy)}function ez(e,t){return{sx:(e.sx+t.sx)/2,sy:(e.sy+t.sy)/2}}function eT(t){ed(),eC.has(t.pointerId)&&eC.delete(t.pointerId);try{e.releasePointerCapture(t.pointerId)}catch(e){}if("pinch"===eE){eC.size<2&&(eR=null,eE="idle");return}if("pan"===eE){eE="idle",e.style.cursor="crosshair";return}if("rect"===eE){0===eC.size&&(eM(!0),eE="idle");return}if("draw"===eE){et=null,eE="idle",ek(),er();return}}e.addEventListener("pointerdown",t=>{let a,n;if(eo(),t.target?.classList?.contains("lia-resize-corner"))return;let r=ej(t);if(eC.set(t.pointerId,r),e.setPointerCapture(t.pointerId),2===eC.size){ed(),"draw"===eE&&(et=null),"rect"===eE&&eM(!1);let e=Array.from(eC.values()),t=ez(e[0],e[1]);eR={dist:Math.max(1e-6,eO(e[0],e[1])),worldMid:ef(t.sx,t.sy),startScale:E.scale},eE="pinch";return}let i="mouse"===t.pointerType&&2===t.button,l="mouse"===t.pointerType&&1===t.button;if(i||l||"mouse"===t.pointerType&&e_){ed(),eE="pan",eL=r.sx,eI=r.sy,e.style.cursor="grab";return}if("rect"===U){let t;ed(),eE="rect",e.style.cursor="crosshair",ea={x0:(t=ef(r.sx,r.sy)).x,y0:t.y,x1:t.x,y1:t.y},ew();return}eE="draw",e.style.cursor="crosshair",a=ef(r.sx,r.sy),n={kind:"path",tool:U,color:ei(),alpha:Q,width:"eraser"===U?J:Z,points:[{x:a.x,y:a.y}]},X.push(n),et=n,V.length=0,em(_),eb(_,n),_.beginPath(),_.moveTo(a.x,a.y),ek(),er(),"eraser"===U?ep(r.sx,r.sy):ed()}),e.addEventListener("pointermove",e=>{if(!eC.has(e.pointerId))return;let t=ej(e);if(eC.set(e.pointerId,t),"eraser"===U&&"pan"!==eE&&"pinch"!==eE&&"rect"!==eE?ep(t.sx,t.sy):ed(),"pinch"===eE&&eC.size>=2&&eR){let e=Array.from(eC.values()).slice(0,2),t=ez(e[0],e[1]),a=Math.max(1e-6,eO(e[0],e[1])),n=eA(eR.startScale*(a/eR.dist));E.scale=n,E.panX=t.sx-eR.worldMid.x*n,E.panY=t.sy-eR.worldMid.y*n,ey(),ev(),ew(),er();return}if("pan"===eE){let e=t.sx-eL,a=t.sy-eI;eL=t.sx,eI=t.sy,E.panX+=e,E.panY+=a,ey(),ev(),ew(),er();return}"rect"===eE?function(e,t){if(!ea)return;let a=ef(e,t);ea.x1=a.x,ea.y1=a.y,ew()}(t.sx,t.sy):"draw"===eE&&function(e,t){if(!et)return;let a=ef(e,t);et.points.push({x:a.x,y:a.y}),_.lineTo(a.x,a.y),_.stroke(),ew(),er()}(t.sx,t.sy)}),e.addEventListener("pointerup",eT),e.addEventListener("pointercancel",eT),e.addEventListener("pointerleave",()=>{ed(),"draw"===eE&&(et=null),"pinch"!==eE&&(eE="idle"),e.style.cursor="crosshair",ek(),er()}),I=!0}(e)}),(0,c.__liaInitTexPreviews)()}},{"../index":"bZBjE","./theme":"9gAEw","./store":"bxEU5","./freeze":"cCz1j","../lia/input":"8t34P","@parcel/transformer-js/src/esmodule-helpers.js":"9p1zA"}],"8t34P":[function(e,t,a,n){var r=e("@parcel/transformer-js/src/esmodule-helpers.js");r.defineInteropFlag(a),r.export(a,"__liaApplyValue",()=>l),r.export(a,"__liaReadFieldValue",()=>o),r.export(a,"__liaAutoSizeTexWidgets",()=>s),r.export(a,"__liaFindAndSetInputBeforeNode",()=>f),r.export(a,"__liaInitTexPreviews",()=>g);var i=e("../index");function l(e,t){let a=String(t);try{if(e&&e.getAttribute&&"true"===e.getAttribute("contenteditable"))return e.textContent=a,e.dispatchEvent(new Event("input",{bubbles:!0})),e.dispatchEvent(new Event("change",{bubbles:!0})),!0;if(e&&"value"in e)return e.value=a,e.dispatchEvent(new Event("input",{bubbles:!0})),e.dispatchEvent(new Event("change",{bubbles:!0})),!0}catch(e){}return!1}function o(e){try{if(!e)return"";if(e.getAttribute&&"true"===e.getAttribute("contenteditable"))return String(e.textContent||"");if("value"in e)return String(e.value||"")}catch(e){}return""}function s(e){if(!e)return;let t=e.__liaTexPreviewBox||null,a=t?t.querySelector(".lia-tex-preview-math"):null;requestAnimationFrame(function(){try{let r=140;if(t&&a&&"1"===t.dataset.on){let e=a.scrollWidth||a.getBoundingClientRect().width||0,n=t.querySelector(".lia-tex-preview-hint"),i=n&&n.getBoundingClientRect().width||0;r=e+i+32}else{let t=o(e);r=Math.max(140,9.92*t.length+28)}var n=r;let i=Math.max(80,Math.min(Math.ceil(n),function(e){try{let t=e&&e.parentElement?e.parentElement:null;if(!t)return 900;let a=t.getBoundingClientRect();if(!a||!a.width)return 900;return Math.max(80,Math.floor(a.width-8))}catch(e){}return 900}(t||e)));try{e.style.width=i+"px",e.style.maxWidth="100%",e.style.boxSizing="border-box"}catch(e){}if(t)try{t.style.width=i+"px",t.style.maxWidth="100%",t.style.boxSizing="border-box"}catch(e){}if(a)try{a.style.minWidth="0",a.style.maxWidth="100%"}catch(e){}}catch(e){}})}let c=null;function d(e,t){let a=String(t||"").trim();if(e.innerHTML="",!a)return!1;let n=e.closest?e.closest(".lia-tex-preview"):null,r=n?n.previousElementSibling:null,l=(0,i.getRootWindow)(),o=window.katex||l.katex||null;function d(){r&&s(r)}try{if(o&&"function"==typeof o.render)return o.render(a,e,{throwOnError:!1,displayMode:!1}),d(),!0}catch(e){}return(function(){let e=(0,i.getRootWindow)(),t=[window.katex,e.katex,window.KaTeX,e.KaTeX];for(let e=0;e<t.length;e++){let a=t[e];if(a&&"function"==typeof a.render)return Promise.resolve(a)}return c||(c=(async()=>{let t=e.document||document;if(!t.getElementById("__lia_katex_css_v1")){let e=t.createElement("link");e.id="__lia_katex_css_v1",e.rel="stylesheet",e.href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css",(t.head||t.documentElement).appendChild(e)}let a=await Function("u","return import(u)")("https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.mjs"),n=a&&(a.default||a);if(!n||"function"!=typeof n.render)throw Error("KaTeX render not available.");try{e.katex||(e.katex=n)}catch(e){}try{window.katex||(window.katex=n)}catch(e){}return n})())})().then(t=>{if(e&&e.isConnected){e.innerHTML="";try{t.render(a,e,{throwOnError:!1,displayMode:!1})}catch(t){e.textContent=a}d()}}).catch(()=>{e&&e.isConnected&&(e.textContent=a,d())}),e.textContent=a,d(),!1}function p(e){if(!e||!e.__liaTexPreviewBox)return;let t=e.__liaTexPreviewBox,a=o(e).trim();if(!a){t.dataset.on="0",t.style.display="none",e.style.display="";return}let n=t.querySelector(".lia-tex-preview-math");n&&d(n,a),t.dataset.on="1",t.style.display="inline-flex",e.style.display="none",s(e)}function u(e){if(!e)return null;if(e.__liaTexPreviewReady)return e;e.__liaTexPreviewReady=!0;let t=document.createElement("span");return t.className="lia-tex-preview",t.dataset.on="0",t.innerHTML=`
    <span class="lia-tex-preview-math"></span>
    <span class="lia-tex-preview-hint">Bearbeiten</span>
  `,t.addEventListener("click",t=>{t.preventDefault(),t.stopPropagation(),function(e){if(!e||!e.__liaTexPreviewBox)return;let t=e.__liaTexPreviewBox;t.dataset.on="0",t.style.display="none",e.style.display="",s(e);try{e.focus(),"function"==typeof e.select&&e.select()}catch(e){}}(e)}),e.insertAdjacentElement("afterend",t),e.__liaTexPreviewBox=t,e.addEventListener("input",()=>{let a=t.querySelector(".lia-tex-preview-math");a&&d(a,o(e))}),e.addEventListener("blur",()=>{setTimeout(()=>p(e),0)}),e.addEventListener("keydown",t=>{let a=e.tagName&&"TEXTAREA"===e.tagName.toUpperCase()||e.getAttribute&&"true"===e.getAttribute("contenteditable");if("Escape"===t.key){t.preventDefault(),p(e);return}"Enter"!==t.key||a||(t.preventDefault(),p(e))}),p(e),s(e),e}function h(e){try{if(!e||1!==e.nodeType)return null;function t(e){if(!e||1!==e.nodeType)return null;let t=e.querySelector&&e.querySelector('[contenteditable="true"]');if(t)return t;let a=e.querySelectorAll?e.querySelectorAll("input, textarea"):null;return a&&a.length?a[a.length-1]:null}let a=e.previousElementSibling;for(;a;){if(a.matches&&(a.matches("input, textarea")||"true"===a.getAttribute("contenteditable")))return a;let e=t(a);if(e)return e;a=a.previousElementSibling}let n=e;for(let e=0;e<10;e++){let e=n.parentElement;if(!e)break;let a=Array.from(e.children),r=a.indexOf(n);for(let e=r-1;e>=0;e--){let n=a[e];if(n.matches&&(n.matches("input, textarea")||"true"===n.getAttribute("contenteditable")))return n;let r=t(n);if(r)return r}n=e}}catch(e){}return null}function f(e,t){let a=h(e);return!!a&&!!l(a,t)&&(!function(e){function t(){let t=h(e);return!!t&&(u(t),p(t),!0)}if(t())return;let a=e.parentElement;if(!a)return;let n=new MutationObserver(()=>{t()&&n.disconnect()});n.observe(a,{childList:!0,subtree:!0}),setTimeout(()=>n.disconnect(),2e3)}(e),!0)}function g(){document.querySelectorAll(".lia-canvas-pair").forEach(e=>{let t=h(e);t&&u(t)})}},{"../index":"bZBjE","@parcel/transformer-js/src/esmodule-helpers.js":"9p1zA"}]},["bZBjE"],"bZBjE","parcelRequirecca2",{});
//# sourceMappingURL=index.js.map
