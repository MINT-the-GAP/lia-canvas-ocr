!function(e,t,n,r,a){var i="u">typeof globalThis?globalThis:"u">typeof self?self:"u">typeof window?window:"u">typeof global?global:{},l="function"==typeof i[r]&&i[r],o=l.i||{},s=l.cache||{},u="u">typeof module&&"function"==typeof module.require&&module.require.bind(module);function c(t,n){if(!s[t]){if(!e[t]){if(a[t])return a[t];var o="function"==typeof i[r]&&i[r];if(!n&&o)return o(t,!0);if(l)return l(t,!0);if(u&&"string"==typeof t)return u(t);var d=Error("Cannot find module '"+t+"'");throw d.code="MODULE_NOT_FOUND",d}h.resolve=function(n){var r=e[t][1][n];return null!=r?r:n},h.cache={};var p=s[t]=new c.Module(t);e[t][0].call(p.exports,h,p,p.exports,i)}return s[t].exports;function h(e){var t=h.resolve(e);if(!1===t)return{};if(Array.isArray(t)){var n={__esModule:!0};return t.forEach(function(e){var t=e[0],r=e[1],a=e[2]||e[0],i=c(r);"*"===t?Object.keys(i).forEach(function(e){"default"===e||"__esModule"===e||Object.prototype.hasOwnProperty.call(n,e)||Object.defineProperty(n,e,{enumerable:!0,get:function(){return i[e]}})}):"*"===a?Object.defineProperty(n,t,{enumerable:!0,value:i}):Object.defineProperty(n,t,{enumerable:!0,get:function(){return"default"===a?i.__esModule?i.default:i:i[a]}})}),n}return c(t)}}c.isParcelRequire=!0,c.Module=function(e){this.id=e,this.bundle=c,this.require=u,this.exports={}},c.modules=e,c.cache=s,c.parent=l,c.distDir=void 0,c.publicUrl=void 0,c.devServer=void 0,c.i=o,c.register=function(t,n){e[t]=[function(e,t){t.exports=n},{}]},Object.defineProperty(c,"root",{get:function(){return i[r]}}),i[r]=c;for(var d=0;d<t.length;d++)c(t[d]);if(n){var p=c(n);"object"==typeof exports&&"u">typeof module?module.exports=p:"function"==typeof define&&define.amd&&define(function(){return p})}}({gFFiE:[function(e,t,n,r){var a=e("@parcel/transformer-js/src/esmodule-helpers.js");a.defineInteropFlag(n),a.export(n,"getRootWindow",()=>x),a.export(n,"LIA",()=>b);var i=e("./ocr/bar"),l=e("./ocr/engine"),o=e("./canvas/theme"),s=e("./canvas/freeze"),u=e("./canvas/index"),c=e("./lia/i18n"),d=e("./math/equivalence"),p=e("./math/column-arithmetic"),h=e("./math/column-subtraction"),m=e("./math/column-multiplication"),f=e("./math/column-division"),g=e("./math/written-arithmetic");function x(){let e=window;try{for(;e.parent&&e.parent!==e;)e=e.parent}catch(e){}return e}let b=window.__LIA_CANVAS_OCR__=window.__LIA_CANVAS_OCR__||{SHOW_BAR:!1,bar:null,ocr:null,canvasPlusOcr:null,tfjs:null,tfjsLoad:null,canvasPlusTfjs:null,canvasPlusTfjsLoad:null,activeOcrLoadEngine:null,store:{},uidSeq:0,freeze:{},barBoot:!1,canvasBoot:!1,launcherBound:!1},v=".lia-canvas-pair",y=["class","style","data-theme","data-color-scheme"],w=null,M=null,k=0,S=!1;b.validateCalculationSubmission=d.validateCalculationSubmission,b.validateColumnAdditionSubmission=p.validateColumnAdditionSubmission,b.validateColumnSubtractionSubmission=h.validateColumnSubtractionSubmission,b.validateColumnMultiplicationSubmission=m.validateColumnMultiplicationSubmission,b.validateColumnDivisionSubmission=f.validateColumnDivisionSubmission,b.parseWrittenArithmeticPrompt=g.parseWrittenArithmeticPrompt,b.validateWrittenArithmeticSubmission=g.validateWrittenArithmeticSubmission,b.checkCalculationAnswer=(e,t)=>{var n,r;let a,i,l=(0,g.parseWrittenArithmeticPrompt)(e);if(l){let e,a=(0,g.validateWrittenArithmeticSubmission)(l,t);return{...a,ok:a.accepted,status:a.outcome,reason:a.reason,message:a.accepted?(0,c.liaT)("ocr.quiz.column.correct","The written calculation is correct."):(n=l.kind,r=a.reason,(e={"invalid-prompt":(0,c.liaT)("ocr.quiz.column.invalidPrompt","The task does not define a valid written calculation."),"prompt-result-mismatch":(0,c.liaT)("ocr.quiz.column.promptResultMismatch","The result given in the task does not match its operands."),"invalid-format":(0,c.liaT)("ocr.quiz.column.invalidFormat","The written calculation could not be read."),"operand-mismatch":(0,c.liaT)("ocr.quiz.column.operandMismatch","The written operands do not match the task."),"result-mismatch":(0,c.liaT)("ocr.quiz.column.resultMismatch","Check the result row.")})[r]?e[r]:({"column-addition":{"carry-mismatch":(0,c.liaT)("ocr.quiz.column.carryMismatch","Check the written carries."),"missing-carry":(0,c.liaT)("ocr.quiz.column.missingCarry","A required carry is missing.")},"column-subtraction":{"borrow-mismatch":(0,c.liaT)("ocr.quiz.column.borrowMismatch","Check the written borrows."),"missing-borrow":(0,c.liaT)("ocr.quiz.column.missingBorrow","A required borrow is missing.")},"column-multiplication":{"partial-product-order-mismatch":(0,c.liaT)("ocr.quiz.column.partialOrderMismatch","Check the order of the written partial products."),"partial-product-mismatch":(0,c.liaT)("ocr.quiz.column.partialMismatch","Check the written partial products."),"shift-mismatch":(0,c.liaT)("ocr.quiz.column.shiftMismatch","Check the place-value shift of the partial product."),"missing-partial-product":(0,c.liaT)("ocr.quiz.column.missingPartial","A required partial product is missing.")},"column-division":{"quotient-mismatch":(0,c.liaT)("ocr.quiz.column.quotientMismatch","Check the quotient."),"remainder-mismatch":(0,c.liaT)("ocr.quiz.column.remainderMismatch","Check the remainder."),"missing-remainder":(0,c.liaT)("ocr.quiz.column.missingRemainder","The nonzero remainder is missing."),"step-mismatch":(0,c.liaT)("ocr.quiz.column.divisionStepMismatch","Check the written division steps."),"missing-step":(0,c.liaT)("ocr.quiz.column.missingDivisionStep","A required division step is missing."),"extra-step":(0,c.liaT)("ocr.quiz.column.extraDivisionStep","The written division contains an extra step.")}})[n][r]||(0,c.liaT)("ocr.quiz.unknown","The calculation could not be checked safely."))}}let o=(0,d.validateCalculationSubmission)(e,t);return{...o,ok:o.accepted,status:o.outcome,reason:o.firstProblem?.reason||(o.accepted?"correct":"unknown"),message:o.accepted?(0,c.liaT)("ocr.quiz.correct","The complete calculation is correct."):(a=o.firstProblem?.reason||"",i=o.firstProblem?.lineIndex,"too-few-lines"===a?(0,c.liaT)("ocr.quiz.tooFewLines","Write the starting equation and at least one solution step."):"too-many-lines"===a?(0,c.liaT)("ocr.quiz.tooManyLines","Use at most 32 calculation lines."):"invalid-format"===a?(0,c.liaT)("ocr.quiz.invalidFormat","The submitted calculation could not be read."):"cas-unavailable"===a?(0,c.liaT)("ocr.quiz.casUnavailable","The mathematical check is not available."):o.firstProblem?.stage==="prompt"&&"prompt-mismatch"===a?(0,c.liaT)("ocr.quiz.taskMismatch","The first line must match the given equation."):o.firstProblem?.stage==="transition"?(0,c.liaT)("ocr.quiz.transitionProblem","Check the transition from line {from} to line {to}.").replace("{from}",String((i??0)+1)).replace("{to}",String((i??0)+2)):o.firstProblem?.stage==="final"?(0,c.liaT)("ocr.quiz.notSolved","Finish by isolating the variable or writing the complete root solution."):(0,c.liaT)("ocr.quiz.unknown","The calculation could not be checked safely."))}};let A=x(),C="__LIA_CANVAS_OCR_REG_V1__";A[C]=A[C]||{inited:{}};let _=document.baseURI||location.href;function R(e){return e.nodeType===Node.ELEMENT_NODE&&(e.matches(v)||!!e.querySelector(v))}function T(){if(!b.canvasBoot){if(b.canvasBoot=!0,b.uidSeq=b.uidSeq||0,w&&(w.disconnect(),w=null),b.discoveryObserver){try{b.discoveryObserver.disconnect()}catch(e){}b.discoveryObserver=null}b.barBoot||(b.barBoot=!0,(0,i.ensureOcrBar)()),function(){if(!b.themeBoot){b.themeBoot=!0,b.themeObserver=M=new MutationObserver(()=>L()),E();try{let e=window.matchMedia("(prefers-color-scheme: dark)");"function"==typeof e.addEventListener?e.addEventListener("change",L):"function"==typeof e.addListener&&e.addListener(L)}catch(e){}window.addEventListener("resize",L,{passive:!0})}}(),(0,l.ensureOcrEngine)(),(0,s.ensureCanvasFreezeApi)(),(0,u.initAll)(),function(){if(!b.launcherI18nListener){let e=()=>z();document.addEventListener("lia:canvas-i18n-update",e),b.launcherI18nListener=e}b.launcherBound?z():(b.launcherBound=!0,z(),document.addEventListener("click",e=>{let t=e.target?.closest?.(".lia-canvas-launch");if(!t)return;let n=t.closest(".lia-canvas-pair");if(!n)return;let r=n.querySelector(".lia-canvas-mount");if(r){r.dataset.uid||(b.uidSeq=(b.uidSeq||0)+1,r.dataset.uid="c"+b.uidSeq);try{let e=r.parentElement;if(e){let t=getComputedStyle(e);String(t.display).includes("flex")&&"nowrap"===String(t.flexWrap)&&(e.style.flexWrap="wrap")}}catch(e){}"1"!==r.dataset.open?(r.dataset.open="1",r.querySelector(".lia-draw-wrap")||(r.innerHTML=(0,u.canvasMarkup)(),(0,u.initAll)())):r.dataset.open="0",z()}},!0))}(),function(){if(b.runtimePairObserver)return;let e=document.body||document.documentElement;if(!e)return;let t=new MutationObserver(e=>{for(let t of e)for(let e of Array.from(t.addedNodes))if(R(e)){(0,u.initAll)(),z();return}});t.observe(e,{childList:!0,subtree:!0}),b.runtimePairObserver=t}()}}function E(){if(!S){S=!0,M&&M.disconnect();try{(0,o.applyThemeVars)()}finally{M&&M.takeRecords(),function(){if(!M)return;let e=(0,o.getThemeDocument)(),t={attributes:!0,attributeFilter:y};for(let n of[e.documentElement,e.body].filter((e,t,n)=>!!e&&n.indexOf(e)===t))try{M.observe(n,t)}catch(e){}}(),S=!1}}}function L(){k||(k=requestAnimationFrame(()=>{k=0,E()}))}function z(e=document){e.querySelectorAll(".lia-canvas-pair[data-canvas-mode=plus]").forEach(e=>{let t=e.querySelector(".lia-canvas-launch"),n=e.querySelector(".lia-canvas-mount");if(!t||!n)return;t.querySelectorAll(".lia-canvas-launch-label").forEach(e=>{e.remove()});let r="1"===n.dataset.open,a=r?(0,c.liaT)("ocr.plus.closeBlock","Close calculation block"):(0,c.liaT)("ocr.plus.openBlock","Open calculation block");t.title=a,t.setAttribute("aria-label",a),t.setAttribute("aria-expanded",r?"true":"false")})}A[C].inited[_]||(A[C].inited[_]=!0,function(){if(document.querySelector(v))return T();if(b.discoveryBoot)return;b.discoveryBoot=!0;let e=document.body||document.documentElement;(w=new MutationObserver(e=>{for(let t of e)for(let e of Array.from(t.addedNodes))if(R(e))return void T()})).observe(e,{childList:!0,subtree:!0}),b.discoveryObserver=w,document.querySelector(v)&&T()}())},{"./ocr/bar":"bCXIb","./ocr/engine":"ba0DF","./canvas/theme":"3aqKC","./canvas/freeze":"8S2RV","./canvas/index":"bUAoc","@parcel/transformer-js/src/esmodule-helpers.js":"b0H7B","./lia/i18n":"lednP","./math/equivalence":"dFsXY","./math/column-arithmetic":"ewiNe","./math/column-subtraction":"7mdjG","./math/column-multiplication":"luDfW","./math/column-division":"cHQYJ","./math/written-arithmetic":"jUsUh"}],bCXIb:[function(e,t,n,r){var a=e("@parcel/transformer-js/src/esmodule-helpers.js");a.defineInteropFlag(n),a.export(n,"ensureOcrBar",()=>s);var i=e("../index"),l=e("../canvas/theme"),o=e("../lia/i18n");function s(){let e=!0===i.LIA.SHOW_BAR,t=(e,t)=>(0,o.liaT)("ocr."+e,t);if((0,l.ensureCss)(),i.LIA.bar&&i.LIA.bar.__i18nListener&&(document.removeEventListener("lia:canvas-i18n-update",i.LIA.bar.__i18nListener),delete(0,i.LIA).bar.__i18nListener),i.LIA.bar&&i.LIA.bar.el&&i.LIA.bar.el.isConnected){try{let t=i.LIA.bar.el,n=document.body||document.documentElement;t.parentNode!==n&&n.appendChild(t),t.style.display=e?"":"none",t.setAttribute("aria-hidden",e?"false":"true");let r=i.LIA.bar.loadEl;r&&r.parentNode!==n&&n.appendChild(r)}catch(e){}return i.LIA.bar}let n=document.body||document.documentElement,r=document.createElement("div");r.className="lia-ocr-loadwrap",r.dataset.on="0",r.dataset.indet="0",r.innerHTML=`
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
  `,n.appendChild(r);let a=r.querySelector(".lia-ocr-loadfill"),s=r.querySelector(".lia-ocr-loadmsg .t"),u=r.querySelector(".lia-ocr-loadmsg .p"),c=r.querySelector(".lia-ocr-loaddetail"),d=r.querySelector(".lia-ocr-loaderror"),p=r.querySelector(".lia-ocr-retry-btn");p&&p.addEventListener("click",()=>{let e=i.LIA.activeOcrLoadEngine||i.LIA.ocr;e&&e.ensureLoaded&&e.ensureLoaded(!0)});let h={model:"Xenova/texify2",backend:"wasm",precision:"fp32",loaded:!1,phase:"idle",status:"idle",progress:null},m="__LIA_TEX_OCR_PREC__",f="__LIA_TEX_OCR_MODEL__";try{let e=localStorage.getItem(f);e&&(h.model=e)}catch(e){}try{let e=localStorage.getItem(m);e&&(h.precision=e)}catch(e){}let g=null,x=null,b=null,v=null,y=null,w=null,M=null;function k(e,t){if(!g)return;let n=g.querySelector('[data-k="'+e+'"]');n&&(n.textContent=String(t))}function S(){if(g){var e,n;let r,a;if(g.dataset.state=String(h.status||"idle"),k("model",h.model||"—"),k("backend",h.backend||"—"),k("precision",h.precision||"—"),k("loaded",h.loaded?t("yes","yes"):t("no","no")),k("phase","idle"===(r=String(e=h.phase||"—").toLowerCase())?t("phase.idle","idle"):"import"===r?t("phase.import","import"):"download"===r?t("phase.download","download"):"pipeline"===r?t("phase.pipeline","pipeline"):e||"—"),k("status","idle"===(a=String(n=h.status||"idle").toLowerCase())?t("status.idle","idle"):"ready"===a?t("status.ready","ready"):"working"===a?t("status.working","working"):"loading"===a?t("status.loading","loading"):"error"===a?t("status.error","error"):n||"idle"),b&&v&&y)if(null!==h.progress&&void 0!==h.progress&&isFinite(h.progress)){let e=Math.max(0,Math.min(1,Number(h.progress)));b.dataset.on="1",v.style.width=Math.round(100*e)+"%",y.textContent=Math.round(100*e)+"%"}else b.dataset.on="0";try{let e=Math.ceil(g.getBoundingClientRect().height||g.offsetHeight||0);document.documentElement.style.setProperty("--lia-ocrbar-h",(e||0)+"px"),document.documentElement.style.setProperty("--lia-ocrbar-gap","8px")}catch(e){}}else try{document.documentElement.style.setProperty("--lia-ocrbar-h","0px"),document.documentElement.style.setProperty("--lia-ocrbar-gap","0px")}catch(e){}if(a&&s&&u){if(d){let e=d.querySelector(".lia-ocr-loaderror-msg");e&&(e.textContent=t("load.failed","Loading failed."))}p&&(p.textContent=t("retry","Try again"));let e=String(h.status||"idle"),n=String(h.phase||"idle"),i=!h.loaded&&("loading"===e||"import"===n||"pipeline"===n||"download"===n),l="error"===e&&!h.loaded;if(d&&(d.style.display=l?"":"none"),l)r.dataset.on="1",r.dataset.indet="0",s&&(s.textContent=t("load.failed","Loading failed.")),u&&(u.textContent=""),c&&(c.textContent=""),a&&(a.style.width="0%");else if(i)if(r.dataset.on="1","download"===n?(s.textContent=t("load.engine","Loading OCR engine..."),c&&(c.textContent=t("load.downloadDetail","This download only happens once and is cached afterwards."))):("import"===n?s.textContent=t("load.importing","Loading OCR engine... (importing library)"):"pipeline"===n?s.textContent=t("load.initializing","Loading OCR engine... (initializing model)"):s.textContent=t("load.engine","Loading OCR engine..."),c&&(c.textContent=t("load.firstStart","First start may take a moment."))),null!==h.progress&&void 0!==h.progress&&isFinite(h.progress)){let e=Math.max(0,Math.min(1,Number(h.progress)));r.dataset.indet="0",a.style.transform="translateX(0)",a.style.width=Math.round(100*e)+"%",u.textContent=Math.round(100*e)+"%"}else r.dataset.indet="1",a.style.width="35%",u.textContent="…";else l||(r.dataset.on="0",r.dataset.indet="0",a.style.transform="translateX(0)",a.style.width="0%",u.textContent="")}}function A(e){if(x)try{let t=new Date,n=String(t.getHours()).padStart(2,"0"),r=String(t.getMinutes()).padStart(2,"0"),a=String(t.getSeconds()).padStart(2,"0"),i="["+n+":"+r+":"+a+"] "+String(e),l=x.textContent?x.textContent.split("\n"):[];for(l.push(i);l.length>10;)l.shift();x.textContent=l.join("\n")}catch(e){}}function C(e){try{if(!e)return;for(let t in e)Object.prototype.hasOwnProperty.call(e,t)&&(h[t]=e[t]);S()}catch(e){}}if(e&&((g=document.createElement("div")).className="lia-ocrbar",g.dataset.state="idle",g.dataset.open="0",g.innerHTML=`
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
    `,n.appendChild(g),x=g.querySelector(".lia-ocr-log"),b=g.querySelector(".lia-ocr-progress"),v=g.querySelector(".lia-ocr-progfill"),y=g.querySelector(".lia-ocr-progtxt"),w=g.querySelector('select[data-act="precision"]'),(M=g.querySelector('select[data-act="model"]'))&&(M.value=h.model),w&&(w.value=h.precision)),g){let e=g.querySelector(".lia-ocr-title"),n=g.querySelectorAll(".lia-ocr-pill .k"),r=g.querySelector('button[data-act="load"]'),a=g.querySelector('button[data-act="toggle"]'),l=g.querySelector('button[data-act="copy"]'),o=g.querySelector('select[data-act="model"]'),s=g.querySelector('select[data-act="precision"]'),u=()=>{e&&(e.textContent=t("title","LaTeX-OCR")),n&&n.length>=6&&(n[0].textContent=t("pill.model","Model"),n[1].textContent=t("pill.backend","Backend"),n[2].textContent=t("pill.precision","Precision"),n[3].textContent=t("pill.loaded","Loaded"),n[4].textContent=t("pill.phase","Phase"),n[5].textContent=t("pill.status","Status")),r&&(r.textContent=t("btn.load","Load/Reload")),a&&(a.textContent=t("btn.log","Log")),l&&(l.textContent=t("btn.copy","Copy")),o&&o.setAttribute("aria-label",t("aria.model","Model")),s&&s.setAttribute("aria-label",t("aria.precision","Precision"))};u(),g.addEventListener("click",e=>{let n=e.target?.closest?.("button[data-act]");if(!n)return;let r=n.getAttribute("data-act");if("toggle"===r){g.dataset.open="1"===g.dataset.open?"0":"1";return}if("copy"===r){let e=[t("report.title","LaTeX-OCR Status Report"),t("pill.model","Model")+": "+(h.model||""),t("pill.backend","Backend")+": "+(h.backend||""),t("pill.precision","Precision")+": "+(h.precision||""),t("pill.loaded","Loaded")+": "+(h.loaded?t("yes","yes"):t("no","no")),t("pill.phase","Phase")+": "+(h.phase||""),t("pill.status","Status")+": "+(h.status||""),t("report.progress","Progress")+": "+(null===h.progress?"—":String(h.progress)),"",t("report.log","Log")+":",x?.textContent||""].join("\n");try{navigator.clipboard.writeText(e),A(t("log.copied","Report copied to clipboard."))}catch(e){A(t("log.copyFailed","Copy failed (clipboard blocked)."))}return}if("load"===r){i.LIA.ocr&&i.LIA.ocr.ensureLoaded&&i.LIA.ocr.ensureLoaded(!0);return}}),w&&w.addEventListener("change",()=>{let e=String(w.value||"fp32");try{localStorage.setItem(m,e)}catch(e){}C({precision:e}),i.LIA.ocr&&i.LIA.ocr.setPrecision&&i.LIA.ocr.setPrecision(e)}),M&&M.addEventListener("change",()=>{let e=String(M.value||h.model);try{localStorage.setItem(f,e)}catch(e){}C({model:e}),i.LIA.ocr&&i.LIA.ocr.setModel&&i.LIA.ocr.setModel(e)});let c=()=>{u(),S()};document.addEventListener("lia:canvas-i18n-update",c),i.LIA.bar=i.LIA.bar||{},i.LIA.bar.__i18nListener=c}return i.LIA.bar={el:g,loadEl:r,set:C,log:A,get:()=>({...h})},S(),e&&A("OCR-Bar ready."),i.LIA.bar}},{"../index":"gFFiE","../canvas/theme":"3aqKC","../lia/i18n":"lednP","@parcel/transformer-js/src/esmodule-helpers.js":"b0H7B"}],"3aqKC":[function(e,t,n,r){var a=e("@parcel/transformer-js/src/esmodule-helpers.js");a.defineInteropFlag(n),a.export(n,"ensureCss",()=>l),a.export(n,"parseRgb",()=>o),a.export(n,"luminance",()=>s),a.export(n,"getAccentColor",()=>u),a.export(n,"getThemeDocument",()=>c),a.export(n,"applyThemeVars",()=>h),a.export(n,"COLORS",()=>m),a.export(n,"getAutoPen",()=>f),a.export(n,"getBorderColor",()=>g),a.export(n,"getAccentCssVar",()=>x),a.export(n,"setSvg",()=>b),a.export(n,"setRectIcon",()=>v),a.export(n,"setEraserIcon",()=>y),a.export(n,"setUndoIcon",()=>w),a.export(n,"setRedoIcon",()=>M),a.export(n,"setTrashIcon",()=>k),a.export(n,"rgbaFromAny",()=>S);var i=e("./icons");function l(){let e=document.getElementById("__lia_canvas_ocr_css_v1");if(e&&e.parentNode&&e.parentNode.removeChild(e),document.getElementById("__lia_canvas_ocr_css_v2"))return;let t=document.createElement("style");t.id="__lia_canvas_ocr_css_v2",t.textContent=`
:root{
  --canvas-border: #000;
  --canvas-pen: #000;
  --canvas-accent: #0b5fff;
  --canvas-error: #b3261e;
  --canvas-panel-bg: rgba(255,255,255,0.84);
  --canvas-overlay-soft: rgba(0,0,0,0.10);
}

@media (prefers-color-scheme: dark){
  :root{
    --canvas-border: #fff;
    --canvas-pen: #fff;
    --canvas-error: #ffb4ab;
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

.lia-tex-preview[data-on='1'][data-multiline='1']{
  display: inline-grid;
  grid-template-columns: minmax(0, 1fr) auto;
  grid-template-rows: auto auto;
  align-items: start;
  gap: 2px 8px;
  vertical-align: top;
  min-height: 0;
  width: fit-content;
  max-width: 100%;
  padding: 6px 8px 8px;
  border-radius: 12px;
  background: color-mix(in srgb, var(--canvas-panel-bg) 38%, transparent);
  overflow: visible;
}

.lia-tex-preview[data-multiline='1'] .lia-tex-preview-math{
  grid-column: 1 / -1;
  grid-row: 2;
  justify-self: stretch;
  width: 100%;
  min-width: 0;
  max-width: 100%;
  padding: 2px 2px 4px;
  overflow: auto;
  overscroll-behavior-inline: contain;
  scrollbar-width: thin;
  box-sizing: border-box;
}

.lia-tex-preview[data-multiline='1'] .lia-tex-preview-hint{
  grid-column: 2;
  grid-row: 1;
  justify-self: end;
  align-self: start;
  line-height: 1.1;
  padding-inline: 2px;
}

.lia-tex-preview[data-multiline='1'] + .lia-canvas-pair,
.lia-tex-preview[data-multiline='1'] + .lia-canvas-pair > .lia-canvas-anchor,
.lia-tex-preview[data-multiline='1'] + .lia-canvas-pair .lia-canvas-launch,
.lia-canvas-pair[data-lia-preview-multiline='1'],
.lia-canvas-pair[data-lia-preview-multiline='1'] > .lia-canvas-anchor,
.lia-canvas-pair[data-lia-preview-multiline='1'] .lia-canvas-launch{
  vertical-align: top;
}

/* ---------------------------------------------------------
   Multi-line calculation block rendering
   --------------------------------------------------------- */
.lia-canvas-pair[data-canvas-mode='plus'] .lia-rect-action{
  display: none !important;
}

.lia-canvasplus-standalone-controls{
  display: flex;
  flex-wrap: wrap;
  align-items: start;
  gap: 10px 12px;
  width: min(1180px, 100%);
  box-sizing: border-box;
  margin-top: 12px;
}

.lia-canvasplus-submit-stack{
  display: flex;
  flex: 0 0 auto;
  flex-direction: column;
  align-items: flex-start;
  min-width: 0;
  min-height: 44px;
}

.lia-canvasplus-standalone-submit{
  box-sizing: border-box;
  height: 44px;
  min-height: 44px;
  align-self: flex-start;
  margin: 0;
  white-space: nowrap;
}

.lia-canvasplus-standalone-status{
  position: absolute !important;
  width: 1px !important;
  height: 1px !important;
  margin: -1px !important;
  padding: 0 !important;
  overflow: hidden !important;
  clip: rect(0 0 0 0) !important;
  clip-path: inset(50%) !important;
  border: 0 !important;
  white-space: nowrap !important;
}

.lia-canvasplus-standalone-status:empty{
  display: none !important;
}

.lia-canvasplus-standalone-status[data-state=error],
.lia-canvasplus-standalone-status[data-state=error-stale]{
  position: static !important;
  width: auto !important;
  height: auto !important;
  max-width: min(34rem, 100%) !important;
  margin: 6px 0 0 !important;
  overflow: visible !important;
  clip: auto !important;
  clip-path: none !important;
  white-space: normal !important;
  color: var(--canvas-error);
  font-size: 0.9em;
  font-weight: 600;
  line-height: 1.35;
}

.lia-canvasplus-standalone-result{
  flex: 1 1 440px;
  position: relative;
  container: lia-canvasplus-result / inline-size;
  align-self: start;
  width: auto;
  min-width: min(440px, 100%);
  box-sizing: border-box;
  margin-top: 0;
  padding: 0;
  border: 1px solid color-mix(in srgb, var(--canvas-border) 24%, transparent);
  border-radius: 8px;
  color: var(--canvas-border);
  background: color-mix(in srgb, var(--canvas-overlay-soft) 55%, transparent);
  font-size: 16px;
  overflow: visible;
}

.lia-canvasplus-standalone-result[hidden]{
  display: none !important;
}

.lia-canvasplus-standalone-result[data-stale='1']{
  border-style: dashed;
  border-color: color-mix(in srgb, var(--canvas-accent) 70%, var(--canvas-border));
}

.lia-canvasplus-result-toggle{
  display: grid;
  grid-template-columns: 36px minmax(0, 1fr);
  grid-template-rows: 18px 16px;
  align-items: center;
  gap: 2px 10px;
  height: 42px;
  min-height: 42px;
  box-sizing: border-box;
  padding: 3px 10px;
  border-radius: 7px;
  cursor: pointer;
  line-height: 1.3;
  list-style: none;
}

.lia-canvasplus-result-toggle::marker{
  content: '';
  font-size: 0;
}

.lia-canvasplus-result-toggle::-webkit-details-marker{
  display: none;
}

.lia-canvasplus-result-toggle::after{
  display: none !important;
  content: none !important;
}

.lia-canvasplus-result-toggle-indicator{
  grid-column: 1;
  grid-row: 1 / span 2;
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  box-sizing: border-box;
  border: 2px solid var(--canvas-accent);
  border-radius: 8px;
  color: #fff;
  background: var(--canvas-accent);
  box-shadow: 0 2px 7px color-mix(in srgb, var(--canvas-accent) 28%, transparent);
}

.lia-canvasplus-result-toggle-indicator::before{
  width: 0;
  height: 0;
  border-block: 5px solid transparent;
  border-inline-start: 8px solid currentColor;
  content: '';
  transform: translateX(1px);
  transform-origin: 3px 5px;
  transition: transform 140ms ease;
}

.lia-canvasplus-standalone-result[open]
  > .lia-canvasplus-result-toggle
  .lia-canvasplus-result-toggle-indicator::before{
  transform: translateY(-1px) rotate(90deg);
}

.lia-canvasplus-result-toggle:hover{
  background: color-mix(in srgb, var(--canvas-accent) 8%, transparent);
}

.lia-canvasplus-result-toggle:focus-visible{
  outline: 3px solid color-mix(in srgb, var(--canvas-accent) 48%, transparent);
  outline-offset: 3px;
}

.lia-canvasplus-standalone-result[open] > .lia-canvasplus-result-toggle{
  padding-inline-end: 150px;
  border-end-start-radius: 0;
  border-end-end-radius: 0;
  border-bottom: 1px solid color-mix(in srgb, var(--canvas-border) 22%, transparent);
}

.lia-canvasplus-result-content{
  position: static;
  padding: 14px;
}

.lia-canvasplus-standalone-title{
  grid-column: 2;
  grid-row: 1;
  display: block;
  margin: 0;
  min-width: 0;
  overflow: hidden;
  font-size: 16px;
  line-height: 18px;
  font-weight: 650;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.lia-canvasplus-result-header{
  display: none;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  min-height: 42px;
  margin: 0;
  padding: 0;
}

.lia-canvasplus-standalone-result[open]
  > .lia-canvasplus-result-header{
  position: absolute;
  z-index: 5;
  inset-block-start: 0;
  inset-inline-end: 6px;
  display: flex;
  transform: none !important;
}

.lia-canvasplus-edit{
  box-sizing: border-box;
  height: 36px;
  min-height: 36px;
  margin: 0;
  padding: 7px 10px;
  border: 1px solid var(--canvas-accent);
  border-radius: 8px;
  color: var(--canvas-accent);
  background: transparent;
  font: inherit;
  font-size: 15px;
  line-height: 20px;
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;
}

@container lia-canvasplus-result (max-width: 400px){
  .lia-canvasplus-standalone-result[open] > .lia-canvasplus-result-toggle{
    padding-inline-end: 10px;
  }

  .lia-canvasplus-standalone-result[open]
    > .lia-canvasplus-result-header{
    position: static;
    margin: 10px 10px 4px;
  }
}

.lia-canvasplus-edit:disabled{
  opacity: 0.45;
  cursor: not-allowed;
}

.lia-canvasplus-edit:focus-visible{
  outline: 3px solid color-mix(in srgb, var(--canvas-accent) 45%, transparent);
  outline-offset: 2px;
}

.lia-canvasplus-analysis-summary{
  grid-column: 2;
  grid-row: 2;
  display: block;
  min-width: 0;
  min-height: 0;
  margin: 0;
  overflow: hidden;
  font-size: 14px;
  line-height: 16px;
  font-weight: 400;
  opacity: 0.96;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.lia-canvasplus-analysis-summary:empty{
  display: none;
}

.lia-canvasplus-rendered.lia-canvasplus-standalone-math{
  min-height: 96px;
  display: block;
  position: relative;
  overflow: visible;
  padding: 14px 10px;
  font-size: clamp(18px, 2.7vw, 30px);
}

.lia-canvasplus-steps{
  --lia-canvasplus-review-rail: clamp(4.75rem, 13vw, 6.5rem);
  position: relative;
  width: 100%;
  max-width: 760px;
  box-sizing: border-box;
  margin: 0 auto;
  padding: 0 var(--lia-canvasplus-review-rail) 0 0;
  list-style: none;
  overflow: visible;
}

.lia-canvasplus-step{
  margin: 0;
  padding: 0;
}

.lia-canvasplus-step:not(:last-child){
  margin-block-end: 0.55rem;
}

.lia-canvasplus-line{
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr);
  align-items: center;
  gap: 0.35rem;
  min-width: 0;
  min-height: 44px;
  box-sizing: border-box;
  padding: 0.2rem 0.15rem;
  border: 2px solid transparent;
  border-radius: 9px;
  line-height: 1.1;
}

.lia-canvasplus-line-number{
  align-self: center;
  padding: 0;
  color: #374151;
  font: 800 14px/1.2 system-ui, sans-serif;
  text-align: center;
}

.lia-canvasplus-line-equation{
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  align-items: baseline;
  min-width: 0;
  overflow-x: auto;
  overflow-y: hidden;
}

.lia-canvasplus-line-equation[data-has-relation='0']{
  display: block;
  text-align: center;
}

.lia-canvasplus-line-left{
  min-width: max-content;
  justify-self: end;
  padding-left: 4px;
}

.lia-canvasplus-line-right{
  min-width: max-content;
  justify-self: start;
  padding-right: 4px;
}

.lia-canvasplus-line-whole{
  display: inline-block;
}

.lia-canvasplus-line[data-error-side='left'] .lia-canvasplus-line-left,
.lia-canvasplus-line[data-error-side='right'] .lia-canvasplus-line-right,
.lia-canvasplus-line[data-error-side='both'] .lia-canvasplus-line-left,
.lia-canvasplus-line[data-error-side='both'] .lia-canvasplus-line-right,
.lia-canvasplus-line[data-error-side='whole']{
  color: #b42318;
  text-decoration: underline wavy currentColor 2px;
  text-underline-offset: 0.18em;
}

.lia-canvasplus-transition{
  --lia-canvasplus-transition-y: 0px;
  position: absolute;
  z-index: 4;
  inset-inline-end: 0;
  top: var(--lia-canvasplus-transition-y);
  width: var(--lia-canvasplus-review-rail);
  height: 52px;
  display: grid;
  grid-template-columns: minmax(1.75rem, 1fr) 44px;
  align-items: center;
  transform: translateY(-50%);
  pointer-events: none;
  color: #59636e;
}

.lia-canvasplus-transition[data-expanded='1']{
  z-index: 30;
}

.lia-canvasplus-transition-arrow{
  grid-column: 1;
  display: grid;
  place-items: center;
  align-self: stretch;
  pointer-events: none;
}

.lia-canvasplus-transition-arrow svg{
  display: block;
  width: 2.6rem;
  height: 52px;
  overflow: visible;
}

.lia-canvasplus-transition-arrow path{
  fill: none;
  stroke: currentColor;
  stroke-width: 3.2;
  stroke-linecap: round;
  stroke-linejoin: round;
  vector-effect: non-scaling-stroke;
}

.lia-canvasplus-transition-trigger{
  grid-column: 2;
  justify-self: center;
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  min-width: 44px;
  min-height: 44px;
  margin: 0;
  padding: 0;
  border: 0;
  border-radius: 50%;
  color: inherit;
  background: transparent;
  font: 800 1rem/1 system-ui, sans-serif;
  cursor: pointer;
  pointer-events: auto;
}

.lia-canvasplus-transition-trigger:hover:not(:disabled),
.lia-canvasplus-transition[data-expanded='1'] .lia-canvasplus-transition-trigger{
  background: color-mix(in srgb, currentColor 12%, transparent);
}

.lia-canvasplus-transition-trigger:disabled{
  cursor: wait;
  opacity: 0.6;
}

.lia-canvasplus-transition-trigger:focus-visible{
  outline: 3px solid color-mix(in srgb, currentColor 42%, transparent);
  outline-offset: 2px;
}

.lia-canvasplus-transition-icon{
  font-size: 2rem;
  font-weight: 900;
  line-height: 1;
}

.lia-canvasplus-transition-label{
  position: absolute !important;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}

.lia-canvasplus-transition[data-verdict='correct']{
  color: #147a36;
}

.lia-canvasplus-transition[data-verdict='incorrect']{
  color: #b42318;
}

.lia-canvasplus-transition[data-verdict='unknown']{
  color: #8a5a00;
}

.lia-canvasplus-transition[data-stale='1']{
  color: #59636e;
  opacity: 0.64;
}

.lia-canvasplus-transition-detail{
  position: absolute;
  z-index: 3;
  inset-inline-end: 0;
  inset-block-start: calc(100% + 0.2rem);
  width: min(22rem, calc(100vw - 2rem));
  box-sizing: border-box;
  margin: 0;
  padding: 9px 11px;
  border: 2px solid currentColor;
  border-radius: 9px;
  color: light-dark(#222, #f7f7f7);
  background: light-dark(#f4f5f6, #24282c);
  box-shadow: 0 7px 22px rgba(0,0,0,0.2);
  font: 14px/1.4 system-ui, sans-serif;
  text-align: start;
  pointer-events: auto;
}

.lia-canvasplus-transition-detail[hidden]{
  display: none !important;
}

/* Authored calculation quizzes opt into transition feedback explicitly. The
   equation rows stay visible when feedback is disabled. Calculation
   Calculation blocks retain their existing review behaviour. */
.lia-canvas-pair[data-canvas-mode='plus'][data-canvas-output='answer'][data-line-feedback='0']
  .lia-canvasplus-analysis-summary,
.lia-canvas-pair[data-canvas-mode='plus'][data-canvas-output='answer'][data-line-feedback='0']
  .lia-canvasplus-transition{
  display: none !important;
}

.lia-canvas-pair[data-canvas-mode='plus'][data-canvas-output='answer'][data-line-feedback='0']
  .lia-canvasplus-steps{
  --lia-canvasplus-review-rail: 0px;
  padding-inline-end: 0;
}

.lia-canvas-pair[data-canvas-mode='plus'][data-canvas-output='answer'][data-line-feedback='0']
  .lia-canvasplus-line[data-error-side='left'] .lia-canvasplus-line-left,
.lia-canvas-pair[data-canvas-mode='plus'][data-canvas-output='answer'][data-line-feedback='0']
  .lia-canvasplus-line[data-error-side='right'] .lia-canvasplus-line-right,
.lia-canvas-pair[data-canvas-mode='plus'][data-canvas-output='answer'][data-line-feedback='0']
  .lia-canvasplus-line[data-error-side='both'] .lia-canvasplus-line-left,
.lia-canvas-pair[data-canvas-mode='plus'][data-canvas-output='answer'][data-line-feedback='0']
  .lia-canvasplus-line[data-error-side='both'] .lia-canvasplus-line-right,
.lia-canvas-pair[data-canvas-mode='plus'][data-canvas-output='answer'][data-line-feedback='0']
  .lia-canvasplus-line[data-error-side='whole']{
  color: inherit;
  text-decoration: none;
}

/* Frozen calculation feedback is immutable and always expanded. It reuses the
   live semantic class names for accessibility/test stability, but flows below
   the frozen drawing instead of relying on interactive side-rail controls. */
.lia-canvas-freeze-block{
  display: grid;
  gap: 12px;
  width: 100%;
}

.lia-canvas-freeze-calculation-review{
  display: block;
  width: min(760px, 100%);
  min-width: 0;
  margin: 0;
  padding: 12px;
}

.lia-canvas-freeze-review-header{
  display: grid;
  gap: 4px;
  padding: 0 2px 10px;
  border-bottom: 1px solid color-mix(in srgb, var(--canvas-border) 20%, transparent);
}

.lia-canvas-freeze-review-header .lia-canvasplus-standalone-title{
  display: block;
  margin: 0;
  overflow: visible;
  white-space: normal;
}

.lia-canvas-freeze-review-header .lia-canvasplus-analysis-summary{
  display: block;
  margin: 0;
  overflow: visible;
  white-space: normal;
}

.lia-canvas-freeze-calculation-review .lia-canvasplus-result-content{
  padding: 8px 0 0;
}

.lia-canvas-freeze-calculation-review
  .lia-canvasplus-rendered.lia-canvasplus-standalone-math{
  min-height: 0;
  padding: 0;
  font-size: clamp(17px, 2.4vw, 26px);
}

.lia-canvas-freeze-calculation-review .lia-canvasplus-steps{
  --lia-canvasplus-review-rail: 0px;
  width: 100%;
  max-width: 100%;
  padding: 0;
}

.lia-canvas-freeze-calculation-review .lia-canvasplus-step:not(:last-child){
  margin-block-end: 0.7rem;
}

.lia-canvas-freeze-calculation-review .lia-canvasplus-transition{
  position: static;
  inset: auto;
  width: auto;
  height: auto;
  min-height: 42px;
  margin: 0.25rem 0 0.15rem 2rem;
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr);
  gap: 4px 8px;
  align-items: center;
  transform: none;
  pointer-events: none;
}

.lia-canvas-freeze-calculation-review .lia-canvasplus-transition-arrow{
  grid-column: 1;
  grid-row: 1;
  display: block;
  align-self: center;
  font: 800 1.4rem/1 system-ui, sans-serif;
  text-align: center;
}

.lia-canvas-freeze-calculation-review .lia-canvasplus-transition-trigger{
  grid-column: 2;
  grid-row: 1;
  justify-self: start;
  width: auto;
  height: auto;
  min-width: 0;
  min-height: 32px;
  display: inline-grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 7px;
  padding: 3px 7px;
  border-radius: 8px;
  cursor: default;
  pointer-events: none;
}

.lia-canvas-freeze-calculation-review .lia-canvasplus-transition-icon{
  font-size: 1.5rem;
}

.lia-canvas-freeze-calculation-review .lia-canvasplus-transition-label{
  position: static !important;
  width: auto;
  height: auto;
  margin: 0;
  padding: 0;
  overflow: visible;
  clip: auto;
  clip-path: none;
  border: 0;
  white-space: normal;
  font: 650 0.88rem/1.35 system-ui, sans-serif;
}

.lia-canvas-freeze-calculation-review .lia-canvasplus-transition-detail{
  position: static;
  grid-column: 2;
  grid-row: 2;
  inset: auto;
  width: auto;
  max-width: 42rem;
  margin: 0;
  padding: 7px 9px;
  border-width: 1px;
  box-shadow: none;
  pointer-events: none;
}

.lia-canvas-freeze-calculation-review[data-stale='1']
  .lia-canvasplus-transition-detail{
  opacity: 0.72;
}

.lia-canvasplus-inline-editor{
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1.5px solid color-mix(in srgb, var(--canvas-border) 22%, transparent);
}

.lia-canvasplus-inline-editor[hidden]{
  display: none !important;
}

.lia-canvasplus-edit-validation{
  min-height: 1.25em;
  margin: 6px 0 0;
  font-size: 13px;
}

.lia-canvasplus-inline-textarea{
  font-size: 15px;
  line-height: 1.45;
}

.lia-canvasplus-edit-validation[data-state='error']{
  color: #b42318;
  font-weight: 750;
}

.lia-canvasplus-edit-validation[data-state='ready']{
  opacity: 0.72;
}

.lia-canvasplus-edit-validation[data-state='warning']{
  color: #805000;
  color: light-dark(#805000, #ffd166);
  font-weight: 750;
}

.lia-canvasplus-insert-pm{
  border-color: currentColor;
  color: #805000;
  color: light-dark(#805000, #ffd166);
}

.lia-canvasplus-insert-pm[hidden]{
  display: none !important;
}

@media (max-width: 820px){
  .lia-canvasplus-submit-stack,
  .lia-canvasplus-standalone-result{
    flex-basis: 100%;
    width: 100%;
  }

  .lia-canvasplus-standalone-result{
    margin-top: 6px;
  }
}

@media (max-width: 520px){
  .lia-canvasplus-standalone-controls{
    align-items: stretch;
  }

  .lia-canvasplus-standalone-submit{
    width: auto;
  }

  .lia-canvasplus-result-header{
    align-items: flex-start;
    justify-content: flex-end;
  }

  .lia-canvasplus-result-toggle{
    column-gap: 8px;
    padding: 3px 8px;
  }

  .lia-canvasplus-result-content{
    padding: 10px;
  }

  .lia-canvasplus-rendered.lia-canvasplus-standalone-math{
    padding-inline: 4px;
    font-size: clamp(16px, 5vw, 22px);
  }

  .lia-canvasplus-steps{
    --lia-canvasplus-review-rail: 68px;
  }

  .lia-canvasplus-line{
    grid-template-columns: 28px minmax(0, 1fr);
    padding-inline: 0;
  }

  .lia-canvasplus-transition{
    grid-template-columns: minmax(16px, 1fr) 44px;
  }

  .lia-canvasplus-transition-arrow svg{
    width: 1.9rem;
  }

  .lia-canvasplus-transition-detail{
    width: min(18rem, calc(100vw - 1rem));
  }
}

@media (prefers-reduced-motion: reduce){
  .lia-canvasplus-transition-trigger,
  .lia-canvasplus-result-toggle-indicator::before{
    transition: none;
  }
}

@media (forced-colors: active){
  .lia-canvasplus-result-toggle:focus-visible{
    outline-color: Highlight;
  }

  .lia-canvasplus-result-toggle-indicator{
    border-color: ButtonText;
    color: ButtonText;
    background: ButtonFace;
    box-shadow: none;
  }

  .lia-canvasplus-result-toggle::marker,
  .lia-canvasplus-line-number{
    color: CanvasText;
  }

  .lia-canvasplus-edit,
  .lia-canvasplus-line[data-error-side]{
    border-color: currentColor;
  }

  .lia-canvasplus-transition-trigger:focus-visible{
    outline-color: Highlight;
  }

  .lia-canvasplus-transition-detail{
    color: CanvasText;
    background: Canvas;
    box-shadow: none;
  }
}

/* ---------------------------------------------------------
   Experimental calculation recognition handoff (reserved)
   --------------------------------------------------------- */
.lia-canvasplus-overlay{
  position: fixed;
  inset: 0;
  z-index: 2147483000;
  display: grid;
  place-items: center;
  box-sizing: border-box;
  padding: 18px;
  background: rgba(0,0,0,0.58);
  overflow: auto;
}

.lia-canvasplus-dialog{
  width: min(880px, 100%);
  max-height: calc(100vh - 36px);
  max-height: calc(100dvh - 36px);
  overflow: auto;
  box-sizing: border-box;
  padding: clamp(18px, 3vw, 30px);
  border: 2px solid color-mix(in srgb, var(--canvas-border) 35%, transparent);
  border-radius: 18px;
  color: var(--canvas-border);
  background: var(--canvas-panel-bg);
  box-shadow: 0 24px 80px rgba(0,0,0,0.38);
  backdrop-filter: blur(18px);
}

.lia-canvasplus-title{
  margin: 0;
  font-size: clamp(1.35rem, 2.7vw, 1.9rem);
  line-height: 1.2;
}

.lia-canvasplus-description{
  margin: 8px 0 20px;
  opacity: 0.82;
  line-height: 1.45;
}

.lia-canvasplus-meta{
  width: fit-content;
  margin: -10px 0 18px;
  padding: 5px 9px;
  border-radius: 999px;
  color: var(--canvas-accent);
  background: color-mix(in srgb, var(--canvas-accent) 12%, transparent);
  font-size: 0.82rem;
  font-weight: 700;
}

.lia-canvasplus-comparison{
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.lia-canvasplus-panel{
  min-width: 0;
  padding: 14px;
  border: 1.5px solid color-mix(in srgb, var(--canvas-border) 24%, transparent);
  border-radius: 12px;
  background: color-mix(in srgb, var(--canvas-overlay-soft) 55%, transparent);
}

.lia-canvasplus-panel-title{
  margin: 0 0 10px;
  font-size: 0.9rem;
  font-weight: 800;
  opacity: 0.78;
}

.lia-canvasplus-handwriting-frame,
.lia-canvasplus-rendered{
  min-height: 130px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  overflow: auto;
  padding: 12px;
  border-radius: 9px;
  background: #fff;
  color: #111;
}

.lia-canvasplus-handwriting{
  display: block;
  max-width: 100%;
  width: auto;
  height: auto;
  max-height: 220px;
}

.lia-canvasplus-rendered{
  font-size: clamp(1.35rem, 3.4vw, 2.2rem);
  overflow-wrap: anywhere;
}

.lia-canvasplus-rendered[data-empty='1']{
  opacity: 0.45;
}

.lia-canvasplus-editor{
  margin-top: 16px;
}

.lia-canvasplus-label{
  display: block;
  margin-bottom: 7px;
  font-weight: 800;
}

.lia-canvasplus-textarea{
  display: block;
  width: 100%;
  min-height: 5.5em;
  resize: vertical;
  box-sizing: border-box;
  padding: 11px 12px;
  border: 2px solid color-mix(in srgb, var(--canvas-border) 30%, transparent);
  border-radius: 10px;
  color: var(--canvas-border);
  background: color-mix(in srgb, var(--canvas-panel-bg) 85%, transparent);
  font: 1rem/1.45 ui-monospace, SFMono-Regular, Consolas, 'Liberation Mono', monospace;
}

.lia-canvasplus-textarea:focus{
  outline: 3px solid color-mix(in srgb, var(--canvas-accent) 45%, transparent);
  outline-offset: 1px;
  border-color: var(--canvas-accent);
}

.lia-canvasplus-actions{
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 18px;
}

.lia-canvasplus-button{
  min-height: 42px;
  padding: 8px 16px;
  border: 2px solid color-mix(in srgb, var(--canvas-border) 28%, transparent);
  border-radius: 10px;
  color: var(--canvas-border);
  background: transparent;
  font: inherit;
  font-weight: 800;
  cursor: pointer;
}

.lia-canvasplus-accept{
  border-color: var(--canvas-accent);
  color: #fff;
  background: var(--canvas-accent);
}

.lia-canvasplus-button:disabled{
  opacity: 0.45;
  cursor: not-allowed;
}

.lia-canvasplus-button:focus-visible{
  outline: 3px solid color-mix(in srgb, var(--canvas-accent) 45%, transparent);
  outline-offset: 2px;
}

@media (max-width: 680px){
  .lia-canvasplus-overlay{
    padding: 8px;
    align-items: end;
  }

  .lia-canvasplus-dialog{
    max-height: calc(100vh - 8px);
    max-height: calc(100dvh - 8px);
    border-radius: 16px 16px 6px 6px;
  }

  .lia-canvasplus-comparison{
    grid-template-columns: 1fr;
  }

  .lia-canvasplus-handwriting-frame,
  .lia-canvasplus-rendered{
    min-height: 96px;
  }
}
  `,(document.head||document.documentElement).appendChild(t)}function o(e){let t=String(e||"").match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);return t?[Number(t[1]),Number(t[2]),Number(t[3])]:null}function s(e){let[t,n,r]=e.map(e=>e/255).map(e=>e<=.03928?e/12.92:Math.pow((e+.055)/1.055,2.4));return .2126*t+.7152*n+.0722*r}function u(e){try{let t=e||document,n=t.defaultView||window,r=t.body||t.documentElement,a=t.querySelector(".lia-btn");if(a){let e=n.getComputedStyle(a).backgroundColor;if(e&&"rgba(0, 0, 0, 0)"!==e&&"transparent"!==e)return e}let i=t.createElement("button");i.className="lia-btn",i.type="button",i.textContent="x",i.style.position="absolute",i.style.left="-9999px",i.style.top="-9999px",i.style.visibility="hidden",r.appendChild(i);let l=n.getComputedStyle(i).backgroundColor;if(i.remove(),l&&"rgba(0, 0, 0, 0)"!==l&&"transparent"!==l)return l}catch(e){}return null}function c(){try{if(window.parent&&window.parent!==window&&window.parent.document)return window.parent.document}catch(e){}return document}let d=!1;function p(e,t,n){let r=String(n||"").trim();return!!r&&e.style.getPropertyValue(t).trim()!==r&&(e.style.setProperty(t,r),!0)}function h(){if(d)return!1;d=!0;try{l();let e=c(),t=e.defaultView||window,n=document.documentElement,r=t.getComputedStyle(e.body||e.documentElement).backgroundColor||t.getComputedStyle(e.documentElement).backgroundColor,a=o(r),i=!!a&&.5>s(a),d=i?"#fff":"#000",h=!1;h=p(n,"--canvas-border",d)||h,h=p(n,"--canvas-pen",d)||h,h=p(n,"--canvas-panel-bg",i?"rgba(22,22,24,0.84)":"rgba(255,255,255,0.84)")||h,h=p(n,"--canvas-overlay-soft",i?"rgba(255,255,255,0.10)":"rgba(0,0,0,0.10)")||h;let m=u(e)||u(document);return m&&(h=p(n,"--canvas-accent",m)||h),h&&document.dispatchEvent(new Event("lia-canvas-theme")),h}catch(e){return!1}finally{d=!1}}let m=[{key:"auto",value:null},{key:"red",value:"#ff0000"},{key:"orange",value:"#ff7500"},{key:"yellow",value:"#ffff00"},{key:"violett",value:"#ff00ff"},{key:"blue",value:"#0055ff"},{key:"lightblue",value:"#00ffff"},{key:"green",value:"#00ff00"},{key:"darkgreen",value:"#007500"},{key:"black",value:"#000000"},{key:"white",value:"#ffffff"}];function f(){return getComputedStyle(document.documentElement).getPropertyValue("--canvas-pen").trim()||"#000"}function g(){return getComputedStyle(document.documentElement).getPropertyValue("--canvas-border").trim()||"#000"}function x(){return getComputedStyle(document.documentElement).getPropertyValue("--canvas-accent").trim()||g()}function b(e,t){!e||e.__hasIcon||(e.__hasIcon=!0,e.innerHTML=t)}function v(e){b(e,i.SVG_RECT)}function y(e){b(e,i.SVG_ERASER)}function w(e){b(e,i.SVG_UNDO)}function M(e){b(e,i.SVG_REDO)}function k(e){b(e,i.SVG_TRASH)}function S(e,t){let n=o(e);if(n)return`rgba(${n[0]},${n[1]},${n[2]},${t})`;if(String(e).startsWith("#")){let n=String(e).slice(1),r=3===n.length?n[0]+n[0]+n[1]+n[1]+n[2]+n[2]:n,a=parseInt(r.slice(0,2),16),i=parseInt(r.slice(2,4),16),l=parseInt(r.slice(4,6),16);return`rgba(${a},${i},${l},${t})`}return`rgba(0,0,0,${t})`}},{"./icons":"cwXVY","@parcel/transformer-js/src/esmodule-helpers.js":"b0H7B"}],cwXVY:[function(e,t,n,r){var a=e("@parcel/transformer-js/src/esmodule-helpers.js");a.defineInteropFlag(n),a.export(n,"SVG_RECT",()=>i),a.export(n,"SVG_ERASER",()=>l),a.export(n,"SVG_UNDO",()=>o),a.export(n,"SVG_REDO",()=>s),a.export(n,"SVG_TRASH",()=>u);let i=`
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
`,l=`
  <svg viewBox="-4 4 24 24" aria-hidden="true">
    <path class="ico-stroke" d="M4 16.5l8.6-8.6a2 2 0 0 1 2.8 0l4.1 4.1a2 2 0 0 1 0 2.8L12.8 23H7.6L4 19.4a2 2 0 0 1 0-2.9z"
          fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path class="ico-stroke" d="M8 23h8" fill="none" stroke-width="2" stroke-linecap="round"/>
    <path class="ico-stroke" d="M9.2 14.3l6.5 6.5" fill="none" stroke-width="2" stroke-linecap="round"/>
  </svg>
`,o=`
  <svg viewBox="-4 0 24 24" aria-hidden="true">
    <path d="M21 8H10.2V4L2 12l8.2 8v-4H21V8z" fill="var(--canvas-border)"/>
    <rect x="10.2" y="10.6" width="10.8" height="2.8" rx="1.4" fill="var(--canvas-border)"/>
  </svg>
`,s=`
  <svg viewBox="-4 0 24 24" aria-hidden="true">
    <path d="M3 8h10.8V4l8.2 8-8.2 8v-4H3V8z" fill="var(--canvas-border)"/>
    <rect x="3" y="10.6" width="10.8" height="2.8" rx="1.4" fill="var(--canvas-border)"/>
  </svg>
`,u=`
  <svg viewBox="-1 0 24 24" aria-hidden="true" style="width:22px;height:22px;display:block;">
    <path class="ico-stroke" d="M9 3h6" stroke-width="2" stroke-linecap="round"/>
    <path class="ico-stroke" d="M4 6h16" stroke-width="2" stroke-linecap="round"/>
    <path class="ico-stroke" d="M7 6l1 15h8l1-15" stroke-width="2" stroke-linejoin="round"/>
    <path class="ico-stroke" d="M10 10v8M14 10v8" stroke-width="2" stroke-linecap="round"/>
  </svg>
`},{"@parcel/transformer-js/src/esmodule-helpers.js":"b0H7B"}],b0H7B:[function(e,t,n,r){n.interopDefault=function(e){return e&&e.__esModule?e:{default:e}},n.defineInteropFlag=function(e){Object.defineProperty(e,"__esModule",{value:!0})},n.exportAll=function(e,t){return Object.keys(e).forEach(function(n){"default"===n||"__esModule"===n||Object.prototype.hasOwnProperty.call(t,n)||Object.defineProperty(t,n,{enumerable:!0,get:function(){return e[n]}})}),t},n.export=function(e,t,n){Object.defineProperty(e,t,{enumerable:!0,get:n})}},{}],lednP:[function(e,t,n,r){var a=e("@parcel/transformer-js/src/esmodule-helpers.js");function i(){try{let e=document.documentElement&&document.documentElement.lang;if(e&&String(e).trim())return String(e).trim()}catch(e){}try{let e=window,t=e&&e.LIA&&e.LIA.settings&&e.LIA.settings.data&&e.LIA.settings.data.lang;if(t&&String(t).trim())return String(t).trim()}catch(e){}try{if(navigator.language&&String(navigator.language).trim())return String(navigator.language).trim()}catch(e){}return"en"}function l(e){let t=String(e||"").trim();return t?t.toLowerCase():"en"}a.defineInteropFlag(n),a.export(n,"ensureI18nLanguageWatch",()=>d),a.export(n,"liaLang",()=>m),a.export(n,"liaT",()=>f);let o=window.__LIA_CANVAS_I18N_STATE__=window.__LIA_CANVAS_I18N_STATE__||{cache:{},pending:{},lang:l(i()),translateQueue:[],translateTimer:null,langWatchObserver:null},s={de:{"ocr.quiz.tooFewLines":"Schreibe die Ausgangsgleichung und mindestens einen Lösungsschritt.","ocr.quiz.tooManyLines":"Verwende höchstens 32 Rechenzeilen.","ocr.quiz.invalidFormat":"Der übergebene Rechenweg konnte nicht gelesen werden.","ocr.quiz.casUnavailable":"Die mathematische Prüfung ist nicht verfügbar.","ocr.quiz.taskMismatch":"Die erste Zeile muss zur vorgegebenen Gleichung passen.","ocr.quiz.transitionProblem":"Prüfe den Übergang von Zeile {from} zu Zeile {to}.","ocr.quiz.notSolved":"Stelle die Variable am Ende frei oder gib die vollständige Wurzellösung an.","ocr.quiz.unknown":"Der Rechenweg konnte nicht sicher geprüft werden.","ocr.quiz.correct":"Der vollständige Rechenweg ist richtig.","ocr.quiz.column.invalidFormat":"Die schriftliche Rechnung konnte nicht gelesen werden.","ocr.quiz.column.operandMismatch":"Die geschriebenen Zahlen passen nicht zur Aufgabe.","ocr.quiz.column.resultMismatch":"Prüfe die Ergebniszeile.","ocr.quiz.column.carryMismatch":"Prüfe die eingetragenen Überträge.","ocr.quiz.column.missingCarry":"Ein notwendiger Übertrag fehlt.","ocr.quiz.column.correct":"Die schriftliche Rechnung ist richtig.","ocr.title":"LaTeX-OCR","ocr.selectSubmit":"Als Lösung senden","ocr.runningOcr":"OCR läuft...","ocr.submitted":"Gesendet","ocr.ocrError":"Fehler","ocr.plus.title":"Erkennung prüfen","ocr.plus.description":"Vergleiche deine Handschrift mit dem dargestellten Ergebnis. Korrigiere bei Bedarf das TeX.","ocr.plus.handwriting":"Ausgewählte Handschrift","ocr.plus.preview":"Dargestelltes Ergebnis","ocr.plus.tex":"Erkanntes TeX","ocr.plus.texMultiline":"Erkanntes TeX (eine Gleichung pro Zeile)","ocr.plus.linesDetected":"{count} Zeilen erkannt","ocr.plus.prepared":"Im Hintergrund vorbereitet","ocr.plus.cancel":"Abbrechen","ocr.plus.accept":"Ergebnis übernehmen","ocr.plus.renderBlock":"Rechenblock erkennen und darstellen","ocr.plus.selectArea":"Darstellungsbereich auswählen","ocr.plus.clearSelection":"Darstellungsbereich aufheben","ocr.plus.selectionEmpty":"Im ausgewählten Bereich ist keine Handschrift.","ocr.plus.rendering":"Rechenblock wird erkannt …","ocr.plus.writeFirst":"Schreibe zuerst etwas in die Zeichenfläche.","ocr.plus.readyToRender":"Bereit zum Darstellen.","ocr.plus.preparing":"Erkennung wird im Hintergrund vorbereitet …","ocr.plus.preparedLines":"{count} Zeilen im Hintergrund vorbereitet.","ocr.plus.preparedStale":"Neue Erkennung vorbereitet – bitte erneut darstellen.","ocr.plus.rendered":"Rechenblock dargestellt.","ocr.plus.stale":"Handschrift geändert – bitte erneut darstellen.","ocr.plus.renderError":"Der Rechenblock konnte nicht erkannt werden.","ocr.plus.engineUnavailable":"Die OCR-Engine für Rechenblöcke ist nicht verfügbar.","ocr.plus.renderErrorKeep":"Neue Erkennung fehlgeschlagen – das vorherige Ergebnis bleibt sichtbar.","ocr.plus.resultTitle":"Erkanntes Ergebnis","ocr.plus.editResult":"Erkennung bearbeiten","ocr.plus.applyCorrection":"Änderungen übernehmen","ocr.plus.editEmpty":"Gib mindestens eine Gleichung ein.","ocr.plus.editTooManyLines":"Verwende höchstens {count} Gleichungen.","ocr.plus.editLineCount":"{count} Gleichungen bereit.","ocr.plus.insertPlusMinus":"± einfügen","ocr.plus.missingPlusMinus":"Zeile {line}: Vor der Wurzel wurde kein ± erkannt. Prüfe die Handschrift oder füge es ein.","ocr.plus.validation.pathLabel":"Geprüfter Rechenweg","ocr.plus.validation.running":"Übergänge werden geprüft …","ocr.plus.validation.error":"Die Übergänge konnten nicht geprüft werden.","ocr.plus.validation.stale":"Die Rechnung wurde geändert – die vorherige Prüfung ist veraltet.","ocr.plus.validation.noTransitions":"Ab zwei Gleichungen kann ein Übergang geprüft werden.","ocr.plus.validation.summaryOne":"{count} Übergang: {valid} richtig, {invalid} falsch, {unknown} nicht sicher prüfbar.","ocr.plus.validation.summary":"{count} Übergänge: {valid} richtig, {invalid} falsch, {unknown} nicht sicher prüfbar.","ocr.plus.validation.checking":"Wird geprüft","ocr.plus.validation.correct":"Richtig","ocr.plus.validation.incorrect":"Fehler","ocr.plus.validation.unknownLabel":"Nicht sicher prüfbar","ocr.plus.validation.casUnavailableLabel":"CAS nicht verfügbar","ocr.plus.validation.casUnavailableSummary":"Das CAS ist nicht verfügbar. Importiere LiaTemplates/Algebrite vor Canvas OCR; es wurde kein Übergang geprüft.","ocr.plus.validation.transitionPending":"Übergang von Zeile {from} zu Zeile {to}: wird geprüft.","ocr.plus.validation.transitionValid":"Übergang von Zeile {from} zu Zeile {to}: richtig.","ocr.plus.validation.transitionInvalid":"Übergang von Zeile {from} zu Zeile {to}: falsch. Erklärung anzeigen.","ocr.plus.validation.transitionUnknown":"Übergang von Zeile {from} zu Zeile {to}: konnte nicht sicher geprüft werden.","ocr.plus.validation.transitionStale":"Übergang von Zeile {from} zu Zeile {to}: Prüfung ist veraltet.","ocr.plus.validation.validOperation":"Die angegebene Umformung wurde auf beide Seiten angewendet.","ocr.plus.validation.validEquivalent":"Die beiden Gleichungen sind äquivalent.","ocr.plus.validation.validRoots":"Die Plus-Minus-Wurzelschreibweise enthält beide reellen Lösungen.","ocr.plus.validation.validCubeRoot":"Die Kubikwurzelschreibweise gibt die eindeutige reelle Lösung an.","ocr.plus.validation.validFourthRoot":"Die Plus-Minus-Schreibweise der vierten Wurzel enthält beide reellen Lösungen.","ocr.plus.validation.missingPlusMinus":"Vor der Wurzel fehlt das ±. Ohne Plus-Minus sind nicht beide reellen Lösungen angegeben.","ocr.plus.validation.invalidLeft":"Die linke Seite passt nicht zur angegebenen Umformung.","ocr.plus.validation.invalidRight":"Die rechte Seite passt nicht zur angegebenen Umformung.","ocr.plus.validation.invalidBoth":"Beide Seiten passen nicht zur angegebenen Umformung.","ocr.plus.validation.invalidEquivalent":"Die beiden Gleichungen haben unterschiedliche Lösungen.","ocr.plus.validation.unknownDomain":"Ohne Angabe der Definitionsmenge kann dieser Übergang nicht sicher geprüft werden.","ocr.plus.validation.casUnavailable":"Das CAS ist nicht verfügbar. Importiere LiaTemplates/Algebrite vor Canvas OCR.","ocr.plus.validation.unknown":"Dieser Übergang konnte mit den unterstützten Regeln nicht sicher geprüft werden.","ocr.plus.validation.freezeTransitionInvalid":"Übergang von Zeile {from} zu Zeile {to}: falsch.","ocr.plus.column.previewLabel":"Erkannte schriftliche Rechnung","ocr.plus.column.recognized":"Schriftliche Rechnung erkannt.","ocr.plus.openBlock":"Rechenblock öffnen","ocr.plus.closeBlock":"Rechenblock schließen","ocr.retry":"Erneut versuchen","ocr.yes":"ja","ocr.no":"nein","ocr.pill.model":"Modell","ocr.pill.backend":"Backend","ocr.pill.precision":"Praezision","ocr.pill.loaded":"Geladen","ocr.pill.phase":"Phase","ocr.pill.status":"Status","ocr.btn.load":"Laden/Neu laden","ocr.btn.log":"Log","ocr.btn.copy":"Kopieren","ocr.aria.model":"Modell","ocr.aria.precision":"Präzision","ocr.report.title":"LaTeX-OCR Statusbericht","ocr.report.progress":"Fortschritt","ocr.report.log":"Log","ocr.log.copied":"Bericht in die Zwischenablage kopiert.","ocr.log.copyFailed":"Kopieren fehlgeschlagen (Zwischenablage blockiert).","ocr.status.idle":"inaktiv","ocr.status.ready":"bereit","ocr.status.working":"arbeitet","ocr.status.loading":"lädt","ocr.status.error":"fehler","ocr.phase.idle":"inaktiv","ocr.phase.import":"import","ocr.phase.download":"download","ocr.phase.pipeline":"pipeline","ocr.load.failed":"Laden fehlgeschlagen.","ocr.load.engine":"OCR-Engine wird geladen...","ocr.load.downloadDetail":"Dieser Download passiert nur einmal und wird danach gecacht.","ocr.load.importing":"OCR-Engine wird geladen... (Bibliothek wird importiert)","ocr.load.initializing":"OCR-Engine wird geladen... (Modell wird initialisiert)","ocr.load.firstStart":"Der erste Start kann einen Moment dauern.","canvas.undo":"Rückgängig","canvas.redo":"Wiederholen","canvas.pen":"Stift","canvas.eraser":"Radierer","canvas.background":"Hintergrund","canvas.edit":"Bearbeiten","canvas.tools":"Werkzeuge","canvas.drawingArea":"Zeichenfläche","canvas.clearMarkerRectangle":"Markierungsrechteck entfernen","canvas.closeMenu":"Menü schließen","canvas.clearAll":"Alles löschen","canvas.colorLabel":"Farbe {color}","canvas.color.auto":"Automatisch","canvas.color.red":"Rot","canvas.color.orange":"Orange","canvas.color.yellow":"Gelb","canvas.color.violett":"Violett","canvas.color.blue":"Blau","canvas.color.lightblue":"Hellblau","canvas.color.green":"Grün","canvas.color.darkgreen":"Dunkelgrün","canvas.color.black":"Schwarz","canvas.color.white":"Weiß","canvas.penWidth":"Stiftbreite","canvas.opacity":"Deckkraft","canvas.eraserWidth":"Radiererbreite","canvas.noBackground":"Kein Hintergrund","canvas.grid":"Raster","canvas.lined":"Liniert","canvas.spacing":"Abstand","canvas.backgroundSpacing":"Hintergrundabstand","canvas.resizeBottomLeft":"Zeichenfläche unten links skalieren","canvas.resizeBottomRight":"Zeichenfläche unten rechts skalieren","canvas.freeze.empty":"Kein sichtbarer Inhalt der Zeichenfläche eingefroren.","canvas.freeze.drawingArea":"Eingefrorene Zeichenfläche"}},u=!1;function c(){let e=l(i());if(e===o.lang||u)return e;u=!0;try{o.lang=e,o.cache={},o.pending={},document.dispatchEvent(new CustomEvent("lia:canvas-i18n-update",{detail:{lang:e,reason:"lang-change"}}))}finally{u=!1}return e}function d(){if(o.langWatchObserver)return;let e=o.langWatchInterval;e&&(clearInterval(e),o.langWatchInterval=null);let t=document.documentElement;t&&(o.langWatchObserver=new MutationObserver(()=>c()),o.langWatchObserver.observe(t,{attributes:!0,attributeFilter:["lang"]}))}async function p(e,t){let n=String(e||"").split("-")[0].toLowerCase()||"en";if(!n||"en"===n)return t;let r="https://api.mymemory.translated.net/get?q="+encodeURIComponent(t)+"&langpair="+encodeURIComponent("en|"+n),a=new AbortController,i=setTimeout(()=>a.abort(),3500);try{let e=await fetch(r,{signal:a.signal});if(!e||!e.ok)return null;let t=await e.json(),n=t&&t.responseData&&t.responseData.translatedText;if(!n||"string"!=typeof n)return null;return n.trim()||null}catch(e){return null}finally{clearTimeout(i)}}async function h(){for(;o.translateQueue.length>0;){let{cacheKey:e,lang:t,text:n}=o.translateQueue.shift();if(o.cache[e]){delete o.pending[e];continue}try{let r=await p(t,n),a=r?function(e){var t;let n,r=String(e||"");return t=r,(n=document.createElement("textarea")).innerHTML=String(t||""),r=(r=(r=n.value||"").replace(/<[^>]+>/g," ")).replace(/\s+/g," ").trim()}(r):"";a&&a!==n&&(o.cache[e]=a,document.dispatchEvent(new CustomEvent("lia:canvas-i18n-update",{detail:{lang:t,key:e,translated:a}})))}catch(e){}delete o.pending[e],o.translateQueue.length>0&&await new Promise(e=>setTimeout(e,150))}}function m(){return d(),c()}function f(e,t){let n=m(),r=String(t||"");if(!r)return"";if("en"===n||n.startsWith("en-"))return r;let a=function(e,t){let n=String(e||"").trim().toLowerCase();if(!n)return null;let r=s[n];if(r&&r[t])return r[t];let a=s[n.split("-")[0]];return a&&a[t]?a[t]:null}(n,String(e||""));if(a)return a;let i=n+"|"+String(e||r),l=o.cache[i];return l||(!function(e,t,n){if(o.pending[e])return;let r=String(n||"").replace(/&/g,"and").replace(/…/g,"...");o.pending[e]=Promise.resolve(),o.translateQueue.push({cacheKey:e,lang:t,text:r}),null===o.translateTimer&&(o.translateTimer=setTimeout(()=>{o.translateTimer=null,h()},0))}(i,n,r),r)}},{"@parcel/transformer-js/src/esmodule-helpers.js":"b0H7B"}],ba0DF:[function(e,t,n,r){var a=e("@parcel/transformer-js/src/esmodule-helpers.js");a.defineInteropFlag(n),a.export(n,"ensureOcrEngine",()=>s);var i=e("../index"),l=e("./bar");async function o(){return i.LIA.tfjs&&i.LIA.tfjs.pipeline?i.LIA.tfjs:(i.LIA.tfjsLoad=i.LIA.tfjsLoad||(async()=>{let e=null;for(let t of["https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2/+esm","https://esm.sh/@xenova/transformers@2.17.2?bundle"])try{try{let e=i.LIA.bar;e&&e.log&&e.log("Importing Transformers.js: "+t)}catch(e){}let e=await Function("u","return import(u)")(t),n=e.pipeline||e.default&&e.default.pipeline,r=e.env||e.default&&e.default.env;if(!n||!r)throw Error("Transformers.js ESM export missing (pipeline/env).");let a={pipeline:n,env:r,__url:t};return i.LIA.tfjs=a,a}catch(n){e=n;try{let e=i.LIA.bar;e&&e.log&&e.log("Import failed: "+t+" — "+(n&&n.message?n.message:String(n)))}catch(e){}}throw e||Error("Failed to load Transformers.js from all CDN URLs.")})(),await i.LIA.tfjsLoad)}function s(){if(i.LIA.ocr)return i.LIA.ocr;let e=(0,l.ensureOcrBar)(),t={model:e.get().model||"Xenova/trocr-small-handwritten",task:"image-to-text",precision:e.get().precision||"fp32",pipe:null,loading:null,loadGeneration:0,async setModel(t){let n=String(t||this.model||"Xenova/texify2");return this.model=n,e.set({model:n,loaded:!1,status:"idle",phase:"idle",progress:null}),this.pipe=null,this.loading=null,this.ensureLoaded(!0)},async setPrecision(t){let n=String(t||"fp32");return this.precision=n,e.set({precision:n,loaded:!1,status:"idle",phase:"idle",progress:null}),this.pipe=null,this.loading=null,this.ensureLoaded(!0)},async ensureLoaded(t){if(this.pipe&&!t)return this.pipe;if(this.loading)return this.loading;let n=this.precision||"fp32",r=String(this.model||"Xenova/texify2"),a=String(this.task||"image-to-text"),i=++this.loadGeneration,l={fp32:"fp32",fp16:"fp16",int8:"q8"}[n]||"fp32";e.set({model:this.model,backend:"wasm",precision:n,status:"loading",phase:"import",loaded:!1,progress:0}),e.log("Loading model ("+n+") …");let s=null,u=new Promise((e,t)=>{s=setTimeout(()=>t(Error("OCR runtime import timed out after 60s")),6e4)});return this.loading=(async()=>{try{let t=await Promise.race([o(),u]);null!==s&&(clearTimeout(s),s=null);let{pipeline:c,env:d}=t;try{d.allowLocalModels=!1,d.allowRemoteModels=!0,d.useBrowserCache=!0,d.backends=d.backends||{},d.backends.onnx=d.backends.onnx||{},d.backends.onnx.wasm=d.backends.onnx.wasm||{}}catch(e){}i===this.loadGeneration&&e.set({phase:"pipeline"});let p=await c(a,r,{dtype:l,progress_callback:t=>{if(i!==this.loadGeneration)return;let n=function(e){try{if(null==e)return null;if("number"==typeof e&&isFinite(e))return Math.max(0,Math.min(1,e>1?e/100:e));let t=e&&"object"==typeof e?e:null;if(!t)return null;if(isFinite(t.progress)){let e=Number(t.progress);return Math.max(0,Math.min(1,e>1?e/100:e))}if(isFinite(t.loaded)&&isFinite(t.total)&&Number(t.total)>0)return Math.max(0,Math.min(1,Number(t.loaded)/Number(t.total)))}catch(e){}return null}(t);null!==n&&e.set({progress:n,phase:"download"})}});if(i!==this.loadGeneration||r!==String(this.model||"")||n!==String(this.precision||"fp32")){let e=Error("Discarded stale OCR model load.");throw e.__liaOcrLoadStale=!0,e}return this.pipe=p,e.set({status:"ready",phase:"ready",loaded:!0,progress:null}),e.log("Model loaded ("+n+")."),p}catch(t){throw i===this.loadGeneration&&(e.set({status:"error",phase:"error",loaded:!1,progress:null}),e.log("Load failed: "+(t&&t.message?t.message:String(t)))),t}finally{null!==s&&clearTimeout(s),i===this.loadGeneration&&(this.loading=null)}})(),this.loading},async recognize(t,n){let r=n&&"object"==typeof n?n:{},a=!0===r.__silent,i=await this.ensureLoaded(!1);e.set({status:"working",phase:"infer",progress:null});let l=null;async function o(e){if(e&&"function"==typeof e.convertToBlob)return await e.convertToBlob({type:"image/png"});if(e&&"function"==typeof e.toBlob)return await new Promise((t,n)=>{e.toBlob(e=>e?t(e):n(Error("toBlob() returned null")),"image/png")});throw Error("Canvas-like has no toBlob/convertToBlob")}async function s(e){if("string"==typeof e)return{input:e,revoke:null};if(e&&"object"==typeof e&&"function"==typeof e.arrayBuffer&&"number"==typeof e.size&&"string"==typeof e.type){let t=URL.createObjectURL(e);return{input:t,revoke:()=>URL.revokeObjectURL(t)}}if(e&&"object"==typeof e&&"number"==typeof e.width&&"number"==typeof e.height&&e.data&&"number"==typeof e.data.length){let t=document.createElement("canvas");t.width=Math.max(1,Math.floor(e.width)),t.height=Math.max(1,Math.floor(e.height)),t.getContext("2d",{willReadFrequently:!0}).putImageData(e,0,0);let n=await o(t),r=URL.createObjectURL(n);return{input:r,revoke:()=>URL.revokeObjectURL(r)}}if(e&&"object"==typeof e){if("function"==typeof e.toBlob||"function"==typeof e.convertToBlob){let t=await o(e),n=URL.createObjectURL(t);return{input:n,revoke:()=>URL.revokeObjectURL(n)}}if("function"==typeof e.toDataURL)return{input:e.toDataURL("image/png"),revoke:null}}throw Error("Unsupported input type for OCR: "+(null===e?"null":typeof e))}try{let n=await s(t);l=n.revoke;let o="number"==typeof r.max_new_tokens&&isFinite(r.max_new_tokens)?Math.max(1,Math.floor(r.max_new_tokens)):96,u=await i(n.input,{max_new_tokens:o,do_sample:!0===r.do_sample,temperature:"number"==typeof r.temperature&&isFinite(r.temperature)?r.temperature:0}),c="";if("string"==typeof u)c=u;else if(Array.isArray(u)&&u.length){let e=u[0]||{};(c=e.generated_text||e.text||e.latex||"")||(c=JSON.stringify(e))}else u&&"object"==typeof u?(c=u.generated_text||u.text||u.latex||"")||(c=JSON.stringify(u)):c=String(u);return e.set({status:"ready",phase:"ready"}),a||e.log("Recognize done."),c}catch(t){throw e.set({status:"error",phase:"error"}),a||e.log("Recognize failed: "+(t&&t.message?t.message:String(t))),t}finally{try{l&&l()}catch(e){}}}};return i.LIA.ocr=t,t}},{"../index":"gFFiE","./bar":"bCXIb","@parcel/transformer-js/src/esmodule-helpers.js":"b0H7B"}],"8S2RV":[function(e,t,n,r){var a=e("@parcel/transformer-js/src/esmodule-helpers.js");a.defineInteropFlag(n),a.export(n,"cfUnionBBox",()=>M),a.export(n,"ensureCanvasFreezeApi",()=>V);var i=e("../index"),l=e("../lia/calculation-options"),o=e("../lia/i18n"),s=e("../lia/input"),u=e("../ocr/layout"),c=e("./store"),d=e("./theme"),p=e("./calculation-freeze");let h=new WeakMap,m=!1;function f(e,t){let n=Number(e);return isFinite(n)?n:t||0}function g(e,t,n){return Math.max(t,Math.min(n,e))}function x(e){return Math.round(100*f(e,0))/100}function b(e,t){let n=f(t,0);if(!(n>0))return 0;let r=f(e,0)%n;return r<0?r+n:r}function v(e){let t=e&&"object"==typeof e?e:{};return{panX:f(t.panX,0),panY:f(t.panY,0),scale:f(t.scale,1)||1,minScale:f(t.minScale,.25),maxScale:f(t.maxScale,8)}}function y(e,t){let n=f(e&&e.x,0),r=f(e&&e.y,0),a=f(t&&t.scale,1)||1;return{x:n*a+f(t&&t.panX,0),y:r*a+f(t&&t.panY,0)}}function w(e,t,n){if(!e)return null;let r=Math.max(0,f(e.x,0)),a=Math.max(0,f(e.y,0)),i=Math.min(f(t,0),f(e.x,0)+f(e.w,0)),l=Math.min(f(n,0),f(e.y,0)+f(e.h,0));return i<=r||l<=a?null:{x:r,y:a,w:i-r,h:l-a}}function M(e,t){if(!e)return t?{x:t.x,y:t.y,w:t.w,h:t.h}:null;if(!t)return{x:e.x,y:e.y,w:e.w,h:e.h};let n=Math.min(e.x,t.x),r=Math.min(e.y,t.y);return{x:n,y:r,w:Math.max(0,Math.max(e.x+e.w,t.x+t.w)-n),h:Math.max(0,Math.max(e.y+e.h,t.y+t.h)-r)}}function k(e){return e&&e.querySelector?e.querySelector(".lia-canvas-mount"):null}function S(e){let t=k(e);return t?(0,c.ensureMountUID)(t):""}function A(e){let t=i.LIA.store||{};return e&&t[e]?t[e]:null}function C(e){let t=A(e);return(0,p.sanitizeCalculationReviewFreezeState)(t?.calculationReviewFreeze)&&_(document).some(t=>S(t)===e&&(0,l.isLineFeedbackEnabledForPair)(t))?null:t}function _(e){return Array.from((e&&e.querySelectorAll?e:document).querySelectorAll(".lia-canvas-pair")).filter(e=>!!k(e))}function R(e,t){let n=Array.isArray(t)?t:[];for(let t=0;t<n.length;t++){let r=n[t];if(!r)continue;if("r"===r.k){e.save(),e.globalCompositeOperation="source-over",e.globalAlpha=1,e.fillStyle=String(r.f||"rgba(0,0,0,0.15)"),e.fillRect(f(r.x,0),f(r.y,0),Math.max(0,f(r.w,0)),Math.max(0,f(r.h,0))),e.restore();continue}let a=Array.isArray(r.p)?r.p:[];if(a.length){e.save(),e.beginPath(),e.moveTo(f(a[0][0],0),f(a[0][1],0));for(let t=1;t<a.length;t++)e.lineTo(f(a[t][0],0),f(a[t][1],0));e.lineCap="round",e.lineJoin="round",e.lineWidth=Math.max(.75,f(r.w,1)),"e"===r.k?(e.globalCompositeOperation="destination-out",e.globalAlpha=1,e.strokeStyle="rgba(0,0,0,1)"):(e.globalCompositeOperation="source-over",e.globalAlpha=g(f(r.a,1),0,1),e.strokeStyle=String(r.c||"#000")),e.stroke(),e.restore()}}}function T(e,t){let n=e&&"object"==typeof e?e:{},r=v(n.VIEW||{}),a=String(n.bgMode||"none");if("grid"!==a&&"lined"!==a)return{m:"none"};let i=Math.max(1,f(n.bgStep,24))*Math.max(1e-4,f(r.scale,1));if(!(i>0))return{m:"none"};let l=f(t&&t.x,0),o=f(t&&t.y,0);return{m:a,s:x(i),ox:x(b(f(r.panX,0)-l,i)),oy:x(b(f(r.panY,0)-o,i)),c:(0,d.rgbaFromAny)((0,d.getAccentCssVar)(),.65),lw:1.125}}function E(e,t,n=!0){let r,a,i;if(!e||!t)return null;let l=function(e){let t=e&&"object"==typeof e?e:{},n=Array.isArray(t.ITEMS)?t.ITEMS:[],r=v(t.VIEW||{}),a=Math.max(1,Math.round(f(t.wrapW,0))),i=Math.max(1,Math.round(f(t.canvasH,0))),l=(0,d.rgbaFromAny)((0,d.getAccentCssVar)(),.28),o=[];for(let e=0;e<n.length;e++){let t=n[e];if(t&&"object"==typeof t){if("path"===t.kind){let e=Array.isArray(t.points)?t.points:[];if(!e.length)continue;let n=e.map(e=>y(e,r)),l=Math.max(.75,f(t.width,1)*f(r.scale,1));if(!w(function(e,t){let n=Array.isArray(e)?e:[];if(!n.length)return null;let r=1/0,a=1/0,i=-1/0,l=-1/0;for(let e=0;e<n.length;e++){let t=n[e],o=f(t&&t.x,0),s=f(t&&t.y,0);o<r&&(r=o),s<a&&(a=s),o>i&&(i=o),s>l&&(l=s)}let o=Math.max(0,f(t,0));return{x:r-o,y:a-o,w:Math.max(0,i-r+2*o),h:Math.max(0,l-a+2*o)}}(n,l/2+2),a,i))continue;o.push({k:"eraser"===t.tool?"e":"p",c:String(t.color||(0,d.getAutoPen)()),a:g(f(t.alpha,1),0,1),w:x(l),p:n.map(e=>[x(e.x),x(e.y)])});continue}if("rect"===t.kind){let e=y({x:t.x0,y:t.y0},r),n=y({x:t.x1,y:t.y1},r),s=function(e,t,n,r){let a=Math.min(f(e,0),f(n,0)),i=Math.min(f(t,0),f(r,0));return{x:a,y:i,w:Math.max(0,Math.max(f(e,0),f(n,0))-a),h:Math.max(0,Math.max(f(t,0),f(r,0))-i)}}(e.x,e.y,n.x,n.y);if(!w(s,a,i))continue;let u=g(f(t.alpha,.28),0,1),c=t.color?(0,d.rgbaFromAny)(t.color,u):(0,d.rgbaFromAny)((0,d.getAccentCssVar)(),u);o.push({k:"r",f:c||l,x:x(s.x),y:x(s.y),w:x(s.w),h:x(s.h)})}}}return{vw:a,vh:i,items:o}}(t),o=Math.max(1,0|l.vw),s=Math.max(1,0|l.vh),u=Array.isArray(l.items)?l.items:[],c=n?(0,p.sanitizeCalculationReviewFreezeState)(t.calculationReviewFreeze):null;if(c)return{v:"cvf1",u:String(e),...u.length?{}:{e:1},w:o,h:s,bg:T(t,null),it:u,cr:c};let h=document.createElement("canvas");h.width=o,h.height=s;let m=h.getContext("2d",{willReadFrequently:!0});m.clearRect(0,0,o,s),R(m,u);let b=function(e){if(!e)return null;let t=e.getContext("2d",{willReadFrequently:!0});if(!t)return null;let n=0|e.width,r=0|e.height;if(!(n>0&&r>0))return null;let a=t.getImageData(0,0,n,r).data,i=n,l=r,o=-1,s=-1;for(let e=0;e<r;e++){let t=e*n*4;for(let r=0;r<n;r++)!(a[t+4*r+3]<=10)&&(r<i&&(i=r),e<l&&(l=e),r>o&&(o=r),e>s&&(s=e))}if(o<0)return null;let u=Math.max(0,Math.round(f(8,0)));return{x:Math.max(0,i-u),y:Math.max(0,l-u),w:Math.max(1,Math.min(n-1,o+u)-Math.max(0,i-u)+1),h:Math.max(1,Math.min(r-1,s+u)-Math.max(0,l-u)+1)}}(h);return b?{v:"cvf1",u:String(e),w:b.w,h:b.h,bg:T(t,b),it:(r=Array.isArray(u)?u:[],a=f(b&&b.x,0),i=f(b&&b.y,0),r.map(e=>e?"r"===e.k?{k:"r",f:String(e.f||""),x:x(f(e.x,0)-a),y:x(f(e.y,0)-i),w:x(f(e.w,0)),h:x(f(e.h,0))}:{k:"e"===e.k?"e":"p",c:String(e.c||""),a:g(f(e.a,1),0,1),w:x(f(e.w,1)),p:(Array.isArray(e.p)?e.p:[]).map(e=>[x(f(e&&e[0],0)-a),x(f(e&&e[1],0)-i)])}:null).filter(Boolean))}:{v:"cvf1",u:String(e),e:1,w:0,h:0,bg:{m:"none"},it:[]}}function L(e){let t=S(e);if(!t)return null;let n=A(t);if(!n)return null;let r=(0,l.isLineFeedbackEnabledForPair)(e),a=(r?(0,p.sanitizeCalculationReviewFreezeState)(n.calculationReviewFreeze):null)?e.querySelector("canvas.lia-draw"):null;return E(t,a&&a.clientWidth>0&&a.clientHeight>0?{...n,wrapW:a.clientWidth,canvasH:a.clientHeight}:n,r)}function z(e){let t=_(e),n=[];for(let e=0;e<t.length;e++){let r=L(t[e]);r&&n.push(r)}return n}function O(e){return!!(e&&1!==e.e&&f(e.w,0)>0&&f(e.h,0)>0&&Array.isArray(e.it)&&e.it.length)}function I(e,t,n,r){let a=document.createElement(t);return a.className=n,"string"==typeof r&&(a.textContent=r),e.appendChild(a),a}function q(e,t){let n=String(e||"");for(let[e,r]of Object.entries(t))n=n.replace(RegExp("\\{"+e+"\\}","g"),String(r));return n}function P(e,t,n,r){let a={from:t+1,to:n+1};return r?q((0,o.liaT)("ocr.plus.validation.transitionStale","Transition from line {from} to line {to}: result is outdated."),a):"valid"===e?q((0,o.liaT)("ocr.plus.validation.transitionValid","Transition from line {from} to line {to}: correct."),a):"invalid"===e?q((0,o.liaT)("ocr.plus.validation.freezeTransitionInvalid","Transition from line {from} to line {to}: incorrect."),a):"unknown"===e?q((0,o.liaT)("ocr.plus.validation.transitionUnknown","Transition from line {from} to line {to}: could not be checked reliably."),a):q((0,o.liaT)("ocr.plus.validation.transitionPending","Transition from line {from} to line {to}: checking."),a)}function N(e){if(1===e.stale)return(0,o.liaT)("ocr.plus.validation.stale","The calculation has changed; the previous check is outdated.");if("running"===e.state)return(0,o.liaT)("ocr.plus.validation.running","Checking transitions...");if("error"===e.state)return(0,o.liaT)("ocr.plus.validation.error","The transitions could not be checked.");if(!e.checks.length)return(0,o.liaT)("ocr.plus.validation.noTransitions","Add at least two equations to check a transition.");if(e.checks.some(e=>"cas-unavailable"===e.reason))return(0,o.liaT)("ocr.plus.validation.casUnavailableSummary","The CAS is unavailable. Import LiaTemplates/Algebrite before Canvas OCR; no transitions were checked.");let t=e.checks.filter(e=>"valid"===e.status).length,n=e.checks.filter(e=>"invalid"===e.status).length,r=e.checks.length-t-n,a=1===e.checks.length?"ocr.plus.validation.summaryOne":"ocr.plus.validation.summary",i=1===e.checks.length?"{count} transition: {valid} correct, {invalid} incorrect, {unknown} not checked.":"{count} transitions: {valid} correct, {invalid} incorrect, {unknown} not checked.";return q((0,o.liaT)(a,i),{count:e.checks.length,valid:t,invalid:n,unknown:r})}function F(){return(0,o.liaT)("canvas.freeze.empty","No visible canvas content frozen.")}function W(){return(0,o.liaT)("canvas.freeze.drawingArea","Frozen drawing area")}function D(e,t){let n="ready"===e.state?e.checks[t]:null;if(n)return"quadratic-root-solutions"===n.reason?(0,o.liaT)("ocr.plus.validation.validRoots","The plus-minus square-root notation contains both real solutions."):"quartic-root-solutions"===n.reason?(0,o.liaT)("ocr.plus.validation.validFourthRoot","The plus-minus fourth-root notation contains both real solutions."):"cubic-root-solution"===n.reason?(0,o.liaT)("ocr.plus.validation.validCubeRoot","The cube-root notation gives the unique real solution."):"missing-plus-minus"===n.reason?(0,o.liaT)("ocr.plus.validation.missingPlusMinus","The indexed square-root solution is missing the plus-minus sign."):"cas-unavailable"===n.reason?(0,o.liaT)("ocr.plus.validation.casUnavailable","The CAS is unavailable. Import LiaTemplates/Algebrite before Canvas OCR."):"domain-uncertain"===n.reason?(0,o.liaT)("ocr.plus.validation.unknownDomain","Without the equation domain, this transition cannot be checked safely."):"operation-applied-both-sides"===n.reason?(0,o.liaT)("ocr.plus.validation.validOperation","The stated transformation was applied to both sides."):"operation-missing-left"===n.reason?(0,o.liaT)("ocr.plus.validation.invalidLeft","The left side does not match the stated transformation."):"operation-missing-right"===n.reason?(0,o.liaT)("ocr.plus.validation.invalidRight","The right side does not match the stated transformation."):"operation-mismatch-both"===n.reason?(0,o.liaT)("ocr.plus.validation.invalidBoth","Both sides do not match the stated transformation."):"equivalent-linear-equations"===n.reason?(0,o.liaT)("ocr.plus.validation.validEquivalent","The two equations are equivalent."):"different-linear-solutions"===n.reason?(0,o.liaT)("ocr.plus.validation.invalidEquivalent","The two equations have different solutions."):(0,o.liaT)("ocr.plus.validation.unknown","This transition could not be checked reliably.");return"running"===e.state?(0,o.liaT)("ocr.plus.validation.checking","Checking"):(0,o.liaT)("ocr.plus.validation.error","The transitions could not be checked.")}function j(e,t){let n=(0,p.sanitizeCalculationReviewFreezeState)(t);if(!n)return;h.set(e,n);let r=e.querySelector(".lia-canvasplus-standalone-title");r&&(r.textContent=(0,o.liaT)("ocr.plus.resultTitle","Rendered calculation block"));let a=e.querySelector(".lia-canvasplus-analysis-summary");a&&(a.textContent=N(n)),e.querySelector(".lia-canvasplus-steps")?.setAttribute("aria-label",(0,o.liaT)("ocr.plus.validation.pathLabel","Checked calculation path"));for(let t=0;t+1<n.lines.length;t++){let r=e.querySelector(`.lia-canvasplus-transition[data-from-index='${t}'][data-to-index='${t+1}']`);if(!r)continue;let a="ready"===n.state?n.checks[t]:null,i=P(a?.status||("running"===n.state?"pending":"unknown"),t,t+1,1===n.stale);r.querySelector(".lia-canvasplus-transition-trigger")?.setAttribute("aria-label",i);let l=r.querySelector(".lia-canvasplus-transition-label");l&&(l.textContent=i);let o=r.querySelector(".lia-canvasplus-transition-detail");o&&(o.textContent=D(n,t))}}function $(e,t){let n=(0,p.sanitizeCalculationReviewFreezeState)(t);if(!n)return null;let r=document.createElement("section");r.className="lia-canvasplus-output lia-canvasplus-standalone-result lia-canvas-freeze-calculation-review",r.dataset.freezeStatic="1",r.dataset.state="ready",r.dataset.analysisState=n.state,r.dataset.lineCount=String(n.lines.length),r.dataset.stale=1===n.stale?"1":"0";let a=I(r,"header","lia-canvas-freeze-review-header");I(a,"h3","lia-canvasplus-standalone-title",(0,o.liaT)("ocr.plus.resultTitle","Rendered calculation block")).setAttribute("aria-level","3");let i=I(a,"p","lia-canvasplus-analysis-summary",N(n));i.dataset.state=1===n.stale?"stale":n.state,i.setAttribute("role","status");let l=I(r,"div","lia-canvasplus-result-content"),c=I(l,"div","lia-canvasplus-rendered lia-canvasplus-standalone-math"),d=I(c,"ol","lia-canvasplus-steps lia-canvas-freeze-review-steps");d.dataset.layout="flow",d.setAttribute("aria-label",(0,o.liaT)("ocr.plus.validation.pathLabel","Checked calculation path"));let m=[];for(let e=0;e<n.lines.length;e++){let t=I(d,"li","lia-canvasplus-step");t.dataset.lineIndex=String(e),m.push(function(e,t,n){let r=I(e,"div","lia-canvasplus-line");r.dataset.lineIndex=String(n),r.dataset.rawLatex=t,I(r,"span","lia-canvasplus-line-number",String(n+1)).setAttribute("aria-hidden","true");let a=I(r,"div","lia-canvasplus-line-equation"),i=(0,u.alignFirstTopLevelRelation)(t),l=i.indexOf("&");if(l>=0){a.dataset.hasRelation="1";let e=I(a,"span","lia-canvasplus-line-left"),t=I(a,"span","lia-canvasplus-line-right");(0,s.__liaRenderTexPreview)(e,i.slice(0,l)),(0,s.__liaRenderTexPreview)(t,i.slice(l+1))}else{a.dataset.hasRelation="0";let e=I(a,"span","lia-canvasplus-line-whole");(0,s.__liaRenderTexPreview)(e,t)}return r}(t,n.lines[e],e)),e+1<n.lines.length&&function(e,t,n){let r="ready"===t.state?t.checks[n]:null,a=r?.status||("running"===t.state?"pending":"unknown"),i=I(e,"div","lia-canvasplus-transition");i.dataset.fromIndex=String(n),i.dataset.toIndex=String(n+1),i.dataset.verdict="valid"===a?"correct":"invalid"===a?"incorrect":a,i.dataset.code=r?.reason||("running"===t.state?"pending":"analysis-error"),i.dataset.expanded="1",1===t.stale&&(i.dataset.stale="1"),I(i,"span","lia-canvasplus-transition-arrow","↓").setAttribute("aria-hidden","true");let l=I(i,"span","lia-canvasplus-transition-trigger");l.setAttribute("role","status");let o=P(a,n,n+1,1===t.stale);l.setAttribute("aria-label",o),I(l,"span","lia-canvasplus-transition-icon","valid"===a?"✓":"invalid"===a?"×":"pending"===a?"…":"?").setAttribute("aria-hidden","true"),I(l,"span","lia-canvasplus-transition-label",o),I(i,"p","lia-canvasplus-transition-detail",D(t,n)).removeAttribute("hidden")}(t,n,e)}if("ready"===n.state)for(let e=0;e<n.checks.length;e++){let t=n.checks[e];"invalid"===t.status&&m[e+1]&&(m[e+1].dataset.errorSide=t.side||"whole")}return h.set(r,n),e.appendChild(r),j(r,n),r}function B(){m||(m=!0,Promise.resolve().then(()=>{try{let e,t;e=F(),document.querySelectorAll(".lia-canvas-freeze-empty").forEach(t=>{t.textContent=e}),t=W(),document.querySelectorAll("canvas.lia-canvas-freeze-preview").forEach(e=>{e.setAttribute("aria-label",t)}),document.querySelectorAll(".lia-canvas-freeze-calculation-review[data-freeze-static='1']").forEach(e=>{let t=h.get(e);t&&j(e,t)})}finally{m=!1}}))}function H(e,t){if(!e||!t)return null;let n=Math.max(1,Math.round(f(t.w,1))),r=Math.max(1,Math.round(f(t.h,1))),a=window.devicePixelRatio||1;e.width=Math.max(1,Math.round(n*a)),e.height=Math.max(1,Math.round(r*a)),e.style.width=n+"px",e.style.height=r+"px";let i=e.getContext("2d",{willReadFrequently:!0});return i.setTransform(a,0,0,a,0,0),i.clearRect(0,0,n,r),!function(e,t,n,r){let a=t&&"object"==typeof t?t:{},i=String(a.m||"none");if("grid"!==i&&"lined"!==i)return;let l=Math.max(1,f(a.s,1)),o=b(f(a.ox,0),l),s=b(f(a.oy,0),l),u=String(a.c||(0,d.rgbaFromAny)((0,d.getAccentCssVar)(),.65)),c=Math.max(.5,f(a.lw,1.125));if(e.save(),e.globalCompositeOperation="source-over",e.globalAlpha=1,e.strokeStyle=u,e.lineWidth=c,e.beginPath(),"grid"===i){for(let t=o;t<=n;t+=l)e.moveTo(t,0),e.lineTo(t,r);for(let t=s;t<=r;t+=l)e.moveTo(0,t),e.lineTo(n,t)}else for(let t=s;t<=r;t+=l)e.moveTo(0,t),e.lineTo(n,t);e.stroke(),e.restore()}(i,t.bg||{m:"none"},n,r),R(i,Array.isArray(t.it)?t.it:[]),e}function U(e,t){if(!e||!(e instanceof Element)||!t)return null;e.dataset.open="1",e.replaceChildren();let n=O(t),r=(0,p.sanitizeCalculationReviewFreezeState)(t.cr);if(!n&&!r){let t=document.createElement("span");return t.className="lia-canvas-freeze-empty",t.textContent=F(),e.appendChild(t),t}let a=document.createElement("span");a.className="lia-draw-block lia-canvas-freeze-block",e.appendChild(a);let i=null;if(n){let e=document.createElement("span");e.className="lia-draw-wrap",(i=document.createElement("canvas")).className="lia-canvas-freeze-preview",i.setAttribute("aria-label",W()),e.appendChild(i),a.appendChild(e),H(i,t)}else{let e=document.createElement("span");e.className="lia-canvas-freeze-empty lia-canvas-freeze-drawing-empty",e.textContent=F(),a.appendChild(e)}let l=r?$(a,r):null;return i||l}function X(e,t){let n=k(e);if(!n)return null;let r=S(e);return U(n,(0,l.isLineFeedbackEnabledForPair)(e)&&r&&String(t?.u||"")===r||!t||"object"!=typeof t||Array.isArray(t)?t:{...t,cr:null})}function V(){let e,t=i.LIA.freeze||{};return(e=t.__canvasFreezeI18nListener)!==B&&("function"==typeof e&&document.removeEventListener("lia:canvas-i18n-update",e),document.addEventListener("lia:canvas-i18n-update",B),t.__canvasFreezeI18nListener=B),t.version="cvf1",t.collectCanvasPairsFromRoot=_,t.getCanvasMountFromPair=k,t.getCanvasUidFromPair=S,t.getCanvasStoreEntry=C,t.exportCanvasFreezeStateFromEntry=E,t.exportCanvasFreezeStateFromPair=L,t.exportAllCanvasFreezeStatesFromRoot=z,t.hasCanvasFreezeContent=O,t.paintCanvasFreezeStateToCanvas=H,t.renderCanvasFreezeStateIntoMount=U,t.renderCanvasFreezeStateIntoPair=X,t.sanitizeCalculationReviewFreezeState=p.sanitizeCalculationReviewFreezeState,t.renderCalculationReviewFreezeStateIntoMount=(e,t)=>$(e,t),i.LIA.freeze=t,t}},{"../index":"gFFiE","./store":"8Sk5l","./theme":"3aqKC","@parcel/transformer-js/src/esmodule-helpers.js":"b0H7B","../lia/calculation-options":"jx05g","../lia/i18n":"lednP","../lia/input":"3dckU","../ocr/layout":"9tjfg","./calculation-freeze":"jvdAp"}],"8Sk5l":[function(e,t,n,r){var a=e("@parcel/transformer-js/src/esmodule-helpers.js");a.defineInteropFlag(n),a.export(n,"ensureMountUID",()=>l),a.export(n,"__liaDispatchCanvasFreezeChange",()=>o);var i=e("../index");function l(e){if(!e)return"";if(e.dataset&&e.dataset.uid)return e.dataset.uid;let t="c"+ ++i.LIA.uidSeq;return e.dataset.uid=t,t}function o(e){try{let t=Object.assign({ts:Date.now()},e&&"object"==typeof e?e:{}),n=(0,i.getRootWindow)();(n&&"function"==typeof n.dispatchEvent?n:window).dispatchEvent(new CustomEvent("lia:canvas-change",{detail:t}))}catch(e){}}},{"../index":"gFFiE","@parcel/transformer-js/src/esmodule-helpers.js":"b0H7B"}],jx05g:[function(e,t,n,r){var a=e("@parcel/transformer-js/src/esmodule-helpers.js");a.defineInteropFlag(n),a.export(n,"parseCalculationOptions",()=>s),a.export(n,"isLineFeedbackEnabledForPair",()=>u);let i=Object.freeze({lineFeedback:!0,valid:!0});function l(e){return{lineFeedback:!1,valid:!1,error:e}}function o(e){switch(e.toLocaleLowerCase("en-US")){case"1":case"true":return!0;case"0":case"false":return!1;default:return null}}function s(e){if(null==e)return i;let t=String(e).trim();if(!t||/^@\d+$/u.test(t))return i;let n=o(t);if(null!==n)return{lineFeedback:n,valid:!0};let r=t.split(";").map(e=>e.trim());if(r.some(e=>!e))return l("empty-option");let a=null;for(let e of r){let t=/^([^=]+?)\s*=\s*([^=\s]+)$/u.exec(e);if(!t)return l("malformed-option");let n=t[1].trim().normalize("NFKC").toLocaleLowerCase("de-DE");if("zeilenrückmeldung"!==n&&"zeilenrueckmeldung"!==n)return l("unknown-option");if(null!==a)return l("duplicate-option");let r=o(t[2]);if(null===r)return l("invalid-boolean");a=r}return{lineFeedback:a??!0,valid:!0}}function u(e){let t=e.getAttribute("data-line-feedback");return null!==t?!0===o(t.trim()):"plus"===e.getAttribute("data-canvas-mode")&&"answer"===e.getAttribute("data-canvas-output")&&s(e.getAttribute("data-calculation-options")).lineFeedback}},{"@parcel/transformer-js/src/esmodule-helpers.js":"b0H7B"}],"3dckU":[function(e,t,n,r){var a=e("@parcel/transformer-js/src/esmodule-helpers.js");a.defineInteropFlag(n),a.export(n,"__liaRegisterCanvasTexField",()=>s),a.export(n,"__liaRefreshAllTexPreviewBorders",()=>c),a.export(n,"__liaApplyValue",()=>g),a.export(n,"__liaReadFieldValue",()=>x),a.export(n,"__liaAutoSizeTexWidgets",()=>b),a.export(n,"__liaRenderTexPreview",()=>y),a.export(n,"__liaFindAndSetInputBeforeNode",()=>C),a.export(n,"__liaInitTexPreviews",()=>_),a.export(n,"ensureTexSyncBoot",()=>R);var i=e("../index"),l=e("./i18n"),o=e("./tex-preview");function s(e){e&&(R(),e.dataset.liaCanvasTex="1")}function u(e){if(!e||!e.__liaTexPreviewBox)return;let t=e.__liaTexPreviewBox,n="";if(function(e){try{if(!e||!e.classList)return!1;if(e.classList.contains("is-success")||e.classList.contains("is-failure")||e.classList.contains("is-warning")||e.classList.contains("is-partial")||e.classList.contains("is-resolved")||e.getAttribute&&"true"===e.getAttribute("aria-invalid"))return!0}catch(e){}return!1}(e)){let t;try{let t=getComputedStyle(e);n=t.borderTopColor||t.borderColor||t.outlineColor||""}catch(e){}(t=String(n||"").trim().toLowerCase())&&"transparent"!==t&&"rgba(0, 0, 0, 0)"!==t&&"rgba(0,0,0,0)"!==t&&1||(n="")}t.style.getPropertyValue("--lia-tex-preview-border").trim()!==n&&(n?t.style.setProperty("--lia-tex-preview-border",n):t.style.removeProperty("--lia-tex-preview-border"))}function c(e){(e&&e.querySelectorAll?e:document).querySelectorAll(".lia-canvas-pair").forEach(e=>{let t=S(e);t&&u(t)})}function d(e){if(!e||!e.__liaTexPreviewBox)return;let t=x(e),n=document.activeElement===e;if(e.__liaTexPreviewLastValue===t&&e.__liaTexPreviewLastFocused===n)return;e.__liaTexPreviewLastValue=t,e.__liaTexPreviewLastFocused=n;let r=e.__liaTexPreviewBox,a=r.querySelector(".lia-tex-preview-math");a&&y(a,t),n?(r.dataset.on="0",r.dataset.multiline="0",r.style.display="none",e.style.display="",b(e)):M(e)}function p(e){(e&&e.querySelectorAll?e:document).querySelectorAll(".lia-canvas-pair").forEach(e=>{let t=S(e);t&&(k(t),u(t),t.__liaTexPreviewLastValue=null,t.__liaTexPreviewLastFocused=null,d(t),document.activeElement!==t&&M(t))})}let h=0,m=[0,0,0];function f(e){clearTimeout(h),h=setTimeout(()=>{p(document)},Math.max(0,e||0))}function g(e,t){let n=String(t);try{if(e&&e.getAttribute&&"true"===e.getAttribute("contenteditable"))return e.textContent=n,e.dispatchEvent(new Event("input",{bubbles:!0})),e.dispatchEvent(new Event("change",{bubbles:!0})),!0;if(e&&"value"in e)return e.value=n,e.dispatchEvent(new Event("input",{bubbles:!0})),e.dispatchEvent(new Event("change",{bubbles:!0})),!0}catch(e){}return!1}function x(e){try{if(!e)return"";if(e.getAttribute&&"true"===e.getAttribute("contenteditable"))return String(e.textContent||"");if("value"in e)return String(e.value||"")}catch(e){}return""}function b(e){if(!e)return;let t=e.__liaTexPreviewBox||null,n=t?t.querySelector(".lia-tex-preview-math"):null;requestAnimationFrame(function(){try{let a=140;if(t&&n&&"1"===t.dataset.on){let e=function(e){try{let t=e.querySelector(".katex-html, .katex"),n=t?.getBoundingClientRect().width||0;if(n>0)return n}catch(e){}try{if(e.childNodes.length&&document.createRange){let t=document.createRange();t.selectNodeContents(e);let n=t.getBoundingClientRect().width||0;try{t.detach()}catch(e){}if(n>0)return n}}catch(e){}try{return e.getBoundingClientRect().width||0}catch(e){}return 0}(n),r=t.querySelector(".lia-tex-preview-hint"),i=r&&r.getBoundingClientRect().width||0;a="1"===t.dataset.multiline?Math.max(e,i)+24:e+i+32}else{let t=x(e);a=Math.max(140,9.92*t.length+28)}var r=a;let i=Math.max(80,Math.ceil(r));try{e.style.width=i+"px",e.style.maxWidth="100%",e.style.boxSizing="border-box"}catch(e){}if(t)try{t.style.width=i+"px",t.style.maxWidth="100%",t.style.boxSizing="border-box"}catch(e){}if(n)try{n.style.minWidth="0",n.style.maxWidth="100%"}catch(e){}}catch(e){}})}let v=null;function y(e,t){let n,r=String(t||"").trim();e.innerHTML="";let a=e.closest?e.closest(".lia-tex-preview"):null;if(!r)return a instanceof HTMLElement&&(a.dataset.multiline="0"),!1;let l=(0,o.formatTexForPreview)(r);a instanceof HTMLElement&&(n=String(r||"").trim(),a.dataset.multiline=n.startsWith("[")&&l.startsWith("\\begin{aligned}")&&l.endsWith("\\end{aligned}")||n.startsWith("{")&&(l.startsWith("\\begin{array}")&&l.endsWith("\\end{array}")||l.startsWith("\\begin{aligned}")&&l.endsWith("\\end{aligned}"))?"1":"0");let s=a?a.previousElementSibling:null,u=(0,i.getRootWindow)(),c=window.katex||u.katex||null;function d(){s&&b(s)}try{if(c&&"function"==typeof c.render)return c.render(l,e,{throwOnError:!1,displayMode:!1}),d(),!0}catch(e){}return(function(){let e=(0,i.getRootWindow)(),t=[window.katex,e.katex,window.KaTeX,e.KaTeX];for(let e=0;e<t.length;e++){let n=t[e];if(n&&"function"==typeof n.render)return Promise.resolve(n)}return v||(v=(async()=>{let t=e.document||document;if(!t.getElementById("__lia_katex_css_v1")){let e=t.createElement("link");e.id="__lia_katex_css_v1",e.rel="stylesheet",e.href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css",(t.head||t.documentElement).appendChild(e)}let n=await Function("u","return import(u)")("https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.mjs"),r=n&&(n.default||n);if(!r||"function"!=typeof r.render)throw Error("KaTeX render not available.");try{e.katex||(e.katex=r)}catch(e){}try{window.katex||(window.katex=r)}catch(e){}return r})())})().then(t=>{if(e&&e.isConnected){e.innerHTML="";try{t.render(l,e,{throwOnError:!1,displayMode:!1})}catch(t){e.textContent=r}d()}}).catch(()=>{e&&e.isConnected&&(e.textContent=r,d())}),e.textContent=r,d(),!1}function w(e,t){try{document.querySelectorAll(".lia-canvas-pair").forEach(n=>{S(n)===e&&(t?n.setAttribute("data-lia-preview-multiline","1"):n.removeAttribute("data-lia-preview-multiline"))})}catch(e){}}function M(e){if(!e||!e.__liaTexPreviewBox)return;let t=e.__liaTexPreviewBox,n=x(e).trim();if(!n){t.dataset.on="0",t.dataset.multiline="0",t.style.display="none",e.style.display="",w(e,!1);return}let r=t.querySelector(".lia-tex-preview-math");r&&y(r,n),t.dataset.on="1",t.style.display="1"===t.dataset.multiline?"inline-grid":"inline-flex",e.style.display="none",w(e,"1"===t.dataset.multiline),b(e)}function k(e){if(!e)return null;if(e.__liaTexPreviewReady)return e;if(e.__liaTexPreviewReady=!0,s(e),!e.__liaTexPreviewBorderObserver){let t=new MutationObserver(()=>{u(e),d(e)});t.observe(e,{attributes:!0,attributeFilter:["class","style","aria-invalid","value"],characterData:!0,childList:!0,subtree:!0}),e.__liaTexPreviewBorderObserver=t}u(e);let t=document.createElement("span"),n=(0,l.liaT)("canvas.edit","Edit");return t.className="lia-tex-preview",t.dataset.on="0",t.dataset.multiline="0",t.innerHTML=`
    <span class="lia-tex-preview-math"></span>
        <span class="lia-tex-preview-hint">${n}</span>
  `,t.addEventListener("click",t=>{t.preventDefault(),t.stopPropagation(),function(e){if(!e||!e.__liaTexPreviewBox)return;let t=document.body;if(t&&(t.classList.contains("lia-snapshot-mode")||t.classList.contains("lia-course-frozen")))return M(e);let n=e.__liaTexPreviewBox;n.dataset.on="0",n.dataset.multiline="0",n.style.display="none",e.style.display="",w(e,!1),b(e);try{e.focus(),"function"==typeof e.select&&e.select()}catch(e){}}(e)}),e.insertAdjacentElement("afterend",t),e.__liaTexPreviewBox=t,e.addEventListener("input",()=>{d(e)}),e.addEventListener("change",()=>{d(e)}),e.addEventListener("focus",()=>{d(e)}),e.addEventListener("blur",()=>{setTimeout(()=>M(e),0)}),e.addEventListener("keydown",t=>{let n=e.tagName&&"TEXTAREA"===e.tagName.toUpperCase()||e.getAttribute&&"true"===e.getAttribute("contenteditable");if("Escape"===t.key){t.preventDefault(),M(e);return}"Enter"!==t.key||n||(t.preventDefault(),M(e))}),M(e),d(e),e}function S(e){try{if(!e||1!==e.nodeType)return null;function t(e){if(!e||1!==e.nodeType)return null;let t=e.querySelector&&e.querySelector('[contenteditable="true"]');if(t)return t;let n=e.querySelectorAll?e.querySelectorAll("input, textarea"):null;return n&&n.length?n[n.length-1]:null}let n=e.previousElementSibling;for(;n;){if(n.matches&&(n.matches("input, textarea")||"true"===n.getAttribute("contenteditable")))return n;let e=t(n);if(e)return e;n=n.previousElementSibling}let r=e;for(let e=0;e<10;e++){let e=r.parentElement;if(!e)break;let n=Array.from(e.children),a=n.indexOf(r);for(let e=a-1;e>=0;e--){let r=n[e];if(r.matches&&(r.matches("input, textarea")||"true"===r.getAttribute("contenteditable")))return r;let a=t(r);if(a)return a}r=e}}catch(e){}return null}function A(e){function t(){let t=S(e);return!!t&&(k(t),M(t),!0)}if(t())return;let n=e.parentElement;if(!n)return;let r=new MutationObserver(()=>{t()&&r.disconnect()});r.observe(n,{childList:!0,subtree:!0}),setTimeout(()=>r.disconnect(),2e3)}function C(e,t){let n=S(e);return!!n&&(x(n)===String(t)?(A(e),!0):!!g(n,t)&&(A(e),!0))}function _(){R(),document.querySelectorAll(".lia-canvas-pair").forEach(e=>{let t=S(e);t&&(k(t),u(t))})}function R(){if(window.__LIA_CANVAS_TEX_SYNC_BOOT__)return;window.__LIA_CANVAS_TEX_SYNC_BOOT__=!0;let e=()=>{[0,80,200].forEach((e,t)=>{clearTimeout(m[t]),m[t]=setTimeout(()=>{p(document)},e)})};try{window.addEventListener("lia:freeze-tex-refresh",e,!0)}catch(e){}try{document.addEventListener("lia:freeze-tex-refresh",e,!0)}catch(e){}document.addEventListener("focusout",e=>{let t=e.target;if(t){if(t.dataset&&"1"===t.dataset.liaCanvasTex)return void f(0);t.matches&&t.matches('input, textarea, [contenteditable="true"]')&&f(0)}},!0),document.addEventListener("change",e=>{let t=e.target;!t||t.matches&&t.matches('input, textarea, [contenteditable="true"]')&&f(0)},!0)}},{"../index":"gFFiE","./i18n":"lednP","./tex-preview":"cfifm","@parcel/transformer-js/src/esmodule-helpers.js":"b0H7B"}],cfifm:[function(e,t,n,r){var a=e("@parcel/transformer-js/src/esmodule-helpers.js");a.defineInteropFlag(n),a.export(n,"formatTexForPreview",()=>u);var i=e("../ocr/layout.ts"),l=e("../math/equivalence.ts"),o=e("../math/written-arithmetic.ts");let s=/^([+-]?\d+)\s*\/\s*([+-]?\d+)$/u;function u(e){let t=String(e??"").trim();if(t.length>o.MAX_WRITTEN_ARITHMETIC_SUBMISSION_LENGTH)return"";let n=(0,o.decodeWrittenArithmeticSubmission)(t);if(n)return(0,o.composeWrittenArithmeticLatex)(n);if(t.length>l.MAX_CALCULATION_ANSWER_LENGTH)return"";let r=function(e){if(!e.startsWith("["))return null;try{let t=JSON.parse(e);if(!Array.isArray(t)||t.length<1||t.length>32||!t.every(e=>"string"==typeof e))return null;let n=t.map(e=>e.trim()).filter(Boolean);return n.length===t.length?n:null}catch(e){return null}}(t);if(r)return(0,i.composeMultilineLatex)(r);let a=s.exec(t);return a?`\\dfrac{${a[1]}}{${a[2]}}`:t}},{"@parcel/transformer-js/src/esmodule-helpers.js":"b0H7B","../ocr/layout.ts":"9tjfg","../math/equivalence.ts":"dFsXY","../math/written-arithmetic.ts":"jUsUh"}],"9tjfg":[function(e,t,n,r){var a=e("@parcel/transformer-js/src/esmodule-helpers.js");a.defineInteropFlag(n),a.export(n,"OCR_LAYOUT_ALGORITHM_VERSION",()=>l),a.export(n,"getOcrOperationSeparators",()=>o),a.export(n,"getOcrStructuralBars",()=>s),a.export(n,"getOcrStructuralDelimiters",()=>u),a.export(n,"ocrDelimiterToken",()=>c),a.export(n,"composeOcrStructuralParts",()=>d),a.export(n,"composeOcrLiteralBarParts",()=>p),a.export(n,"hasOcrNumeralOneTopHook",()=>m),a.export(n,"findOcrLineBands",()=>f),a.export(n,"splitOcrLineBandsAtRules",()=>g),a.export(n,"splitOcrDivisionLineBands",()=>x),a.export(n,"selectOcrOperationSeparator",()=>b),a.export(n,"selectOcrStructuralBars",()=>v),a.export(n,"selectOcrStructuralDelimiters",()=>y),a.export(n,"selectOcrRasterOperationSeparator",()=>M),a.export(n,"segmentOcrCanvas",()=>k),a.export(n,"alignFirstTopLevelRelation",()=>C),a.export(n,"canComposeOcrOperationSeparator",()=>_),a.export(n,"normalizeOcrOperationSide",()=>R),a.export(n,"recoverOcrOperationSeparatorFromWholeLine",()=>E),a.export(n,"findMissingPlusMinusRootLine",()=>I),a.export(n,"canRestoreOcrPlusMinusFromSplit",()=>q),a.export(n,"insertPlusMinusIntoIndexedRootSolution",()=>P),a.export(n,"normalizeCalculationLineSequence",()=>F),a.export(n,"composeMultilineLatex",()=>W),a.export(n,"editableTextToLatex",()=>D);var i=e("./symbol-geometry.ts");let l="lines-v15-written-arithmetic";function o(e){return e.operationSeparators?.length?Array.from(e.operationSeparators):e.operationSeparator?[e.operationSeparator]:[]}function s(e){return e.structuralBars?.length?Array.from(e.structuralBars):[]}function u(e){return e.structuralDelimiters?.length?Array.from(e.structuralDelimiters):[]}function c(e){return"round-open"===e?"(":"round-close"===e?")":"square-open"===e?"[":"]"}function d(e,t){if(e.length!==t.length+1)return"";let n=String(e[0]||"").trim();for(let r=0;r<t.length;r++)n+="\\vert"===t[r]?" \\vert ":t[r],n+=String(e[r+1]||"").trim();return n}function p(e){return e.length<2?String(e[0]||"").trim():d(e,Array(e.length-1).fill("\\vert"))}function h(e){let t=Number(e);return isFinite(t)?Math.max(.25,Math.min(32,t)):1}function m(e,t=1){return"hooked-one"===(0,i.classifyOcrVerticalSymbolPath)([{points:e,strokeWidth:t}],0)}function f(e,t,n=1){let r=e.length;if(!r)return[];let a=h(n),i=Math.max(1,Math.round(4*a)),l=[],o=-1,s=0;for(let t=0;t<=r;t++){let n=t<r?Math.max(0,Number(e[t])||0):0;if(n>0){o<0&&(o=t,s=0),s+=n;continue}if(o>=0){let e=t-o,n=e<=i,r=s/Math.max(1,e);l.push({y0:o,y1:t-1,ink:s,maxRunHeight:e,hasBroadThinRun:n&&r>=Math.max(Math.round(4*a),4*e),substantialRuns:+!n,componentCount:1}),o=-1,s=0}}let u=Math.max(Math.round(2*a),Math.min(Math.round(6*a),Math.round(.018*r))),c=Math.max(Math.round(2*a),Math.round(.003*Math.max(1,t))),d=Math.max(u,Math.round(8*a)),p=l.filter((e,t)=>1===l.length||!!(e.ink>c)||Math.min(t>0?e.y0-l[t-1].y1-1:1/0,t+1<l.length?l[t+1].y0-e.y1-1:1/0)<=d);if(!p.length)return[];let m=!0;for(;m&&p.length>1;){m=!1;let e=[];for(let t of p){let n=e[e.length-1];if(n&&function(e,t,n,r){let a=t.y0-e.y1-1;if(a<=n)return!0;let i=e.y1-e.y0+1,l=t.y1-t.y0+1;if(0===e.substantialRuns||0===t.substantialRuns)return a<=Math.min(Math.round(16*r),Math.max(n,Math.round(.8*Math.max(i,l))));let o=e.substantialRuns+t.substantialRuns,s=e.componentCount+t.componentCount;return(!!e.hasBroadThinRun||!!t.hasBroadThinRun)&&o<=2&&s<=3&&a<=Math.min(Math.round(14*r),Math.max(n,Math.round(.45*Math.max(i,l))))}(n,t,u,a))e[e.length-1]={y0:n.y0,y1:t.y1,ink:n.ink+t.ink,maxRunHeight:Math.max(n.maxRunHeight,t.maxRunHeight),hasBroadThinRun:n.hasBroadThinRun||t.hasBroadThinRun,substantialRuns:n.substantialRuns+t.substantialRuns,componentCount:n.componentCount+t.componentCount},m=!0;else e.push(t)}p=e}return(p=p.filter(e=>1===p.length||e.y1-e.y0+1>Math.max(1,Math.round(a))||e.ink>=c)).map(({y0:e,y1:t,ink:n})=>({y0:e,y1:t,ink:n}))}function g(e,t,n){let r=(Array.isArray(n)?n:[]).map(e=>e&&"object"==typeof e&&[e.y0,e.y1].every(Number.isFinite)?{y0:Math.floor(Math.min(Number(e.y0),Number(e.y1))),y1:Math.ceil(Math.max(Number(e.y0),Number(e.y1)))}:null).filter(e=>!!e).sort((e,t)=>e.y0-t.y0);if(!r.length)return Array.from(t);let a=(t,n)=>{let r=0;for(let a=Math.max(0,t);a<=Math.min(e.length-1,n);a++)r+=Math.max(0,Number(e[a])||0);return r},i=Array.from(t);for(let e of r){let t=[];for(let n of i){if(e.y1<n.y0||e.y0>n.y1){t.push(n);continue}let r=Math.min(n.y1,e.y0-1),i=Math.max(n.y0,e.y1+1);if(r>=n.y0){let e=a(n.y0,r);e>0&&t.push({y0:n.y0,y1:r,ink:e})}if(i<=n.y1){let e=a(i,n.y1);e>0&&t.push({y0:i,y1:n.y1,ink:e})}}i=t}return i.sort((e,t)=>e.y0-t.y0)}function x(e,t,n){let r=(Array.isArray(n)?n:[]).map(e=>e&&"object"==typeof e&&[e.y0,e.y1].every(Number.isFinite)?{y0:Math.floor(Math.min(Number(e.y0),Number(e.y1))),y1:Math.ceil(Math.max(Number(e.y0),Number(e.y1)))}:null).filter(e=>!!e).sort((e,t)=>e.y0-t.y0),a=g(e,t,r);if(!r.length)return a;let i=new Map;for(let e of a){let t=(e.y0+e.y1)/2,n=r.length;for(let e=0;e<r.length;e++)if(t<r[e].y0){n=e;break}let a=i.get(n)||[];a.push(e),i.set(n,a)}let l=[];for(let t=0;t<=r.length;t++){let n=(i.get(t)||[]).sort((e,t)=>e.y0-t.y0);if(t<r.length&&n.length){let t=n[0].y0,r=n[n.length-1].y1,a=0;for(let n=t;n<=r;n++)a+=Math.max(0,Number(e[n])||0);let i=function(e,t){let n=-1,r=-1,a=-1;for(let i=t.y0;i<=t.y1+1;i++){if(i<=t.y1&&0>=(Number(e[i])||0)){a<0&&(a=i);continue}if(a>=0){let e=i-1;a>t.y0&&e<t.y1&&e-a>r-n&&(n=a,r=e),a=-1}}let i=(t,n)=>{let r=0;for(let a=t;a<=n;a++)r+=Math.max(0,Number(e[a])||0);return r};if(n<0){let n=t.y1-t.y0+1;if(n<10)return[t];let r=Math.max(2,Math.floor(.22*n)),a=-1,l=1/0;for(let n=t.y0+r;n<t.y1-r;n++){let t=Math.max(0,Number(e[n])||0)+Math.max(0,Number(e[n+1])||0);t<l&&(a=n,l=t)}let o=t.ink/Math.max(1,n);if(a<0||l>Math.max(4,.65*o))return[t];let s=i(t.y0,a),u=i(a+1,t.y1);return s&&u?[{y0:t.y0,y1:a,ink:s},{y0:a+1,y1:t.y1,ink:u}]:[t]}let l=i(t.y0,n-1),o=i(r+1,t.y1);return l&&o?[{y0:t.y0,y1:n-1,ink:l},{y0:r+1,y1:t.y1,ink:o}]:[t]}(e,{y0:t,y1:r,ink:a});if(2===i.length){l.push(...i);continue}}l.push(...n)}return l.sort((e,t)=>e.y0-t.y0)}function b(e,t,n,r=1,a,i){if(!e.length)return null;let l=h(r),o=Math.max(1,t.x1-t.x0+1),s=Math.max(1,t.y1-t.y0+1),u=0;for(let e=t.x0;e<=t.x1;e++)u+=Math.max(0,Number(n[e])||0);if(!u)return null;let c=null,d=-1/0;for(let r of e){if(!0===r.hasTopHook)continue;let p=!1===r.hasTopHook,h=Math.max(t.x0,Math.floor(Math.min(r.x0,r.x1))),m=Math.min(t.x1,Math.ceil(Math.max(r.x0,r.x1))),f=Math.max(t.y0,Math.floor(Math.min(r.y0,r.y1))),g=Math.min(t.y1,Math.ceil(Math.max(r.y0,r.y1)));if(m<h||g<f)continue;let x=m-h+1,b=g-f+1,v=(h+m)*.5,y=(v-t.x0)/o;if(y<.48||y>.92||b<Math.max(Math.round(12*l),s*(p?.55:.72))||x>Math.max(Math.round(5*l),.18*b))continue;let w=0;for(let e=h;e<=m;e++)w+=Math.max(0,Number(n[e])||0);if(w<Math.max(Math.round(3*l),.35*b))continue;if(a&&i){let e=1/0,r=-1/0;for(let l=t.x0;l<=t.x1;l++){if(l>=h&&l<=m||0>=(Number(n[l])||0))continue;let t=Number(a[l]),o=Number(i[l]);isFinite(t)&&isFinite(o)&&!(o<t)&&(e=Math.min(e,t),r=Math.max(r,o))}if(!p&&isFinite(e)&&isFinite(r)&&b<.92*(r-e+1))continue}let M=t.x0-1;for(let e=h-1;e>=t.x0;e--)if((Number(n[e])||0)>0){M=e;break}let k=t.x1+1;for(let e=m+1;e<=t.x1;e++)if((Number(n[e])||0)>0){k=e;break}if(M<t.x0||k>t.x1)continue;let S=h-M-1,A=k-m-1,C=Math.max(Math.round(2*l),Math.round(s*(p?.07:.1)));if(S<C||A<C)continue;let _=Math.sqrt((S+1)*(A+1));if(e.some(e=>{if(e===r||!0===e.hasTopHook)return!1;let a=Math.max(t.x0,Math.floor(Math.min(e.x0,e.x1))),i=Math.min(t.x1,Math.ceil(Math.max(e.x0,e.x1))),l=Math.max(t.y0,Math.floor(Math.min(e.y0,e.y1))),s=Math.min(t.y1,Math.ceil(Math.max(e.y0,e.y1)));if(i<a||s<l)return!1;let u=t.x0-1,c=t.x1+1;for(let e=a-1;e>=t.x0;e--)if((Number(n[e])||0)>0){u=e;break}for(let e=i+1;e<=t.x1;e++)if((Number(n[e])||0)>0){c=e;break}let d=a-u-1,p=c-i-1;if(u<t.x0||c>t.x1||d<C||p<C)return!1;let h=s-l+1,m=Math.max(0,Math.min(g,s)-Math.max(f,l)+1),x=Math.abs((a+i)*.5-v),y=Math.sqrt((d+1)*(p+1));return Math.min(b,h)>=.82*Math.max(b,h)&&m>=.78*Math.min(b,h)&&x>=C&&x<=.35*o&&y>=.65*_}))continue;let R=0,T=0;for(let e=t.x0;e<h;e++)R+=Math.max(0,Number(n[e])||0);for(let e=m+1;e<=t.x1;e++)T+=Math.max(0,Number(n[e])||0);if(R<.25*u||T<.035*u)continue;let E=2*b+S+A-2*x;E>d&&(d=E,c=r)}return c}function v(e,t,n,r=1){let a=h(r),i=Math.max(1,t.y1-t.y0+1),l=[];for(let r of e){if(!1!==r.hasTopHook)continue;let e=Number(r.slantRatio);if(Number.isFinite(e)&&e>1/3)continue;let o=Math.max(t.x0,Math.floor(Math.min(r.x0,r.x1))),s=Math.min(t.x1,Math.ceil(Math.max(r.x0,r.x1))),u=Math.max(t.y0,Math.floor(Math.min(r.y0,r.y1))),c=Math.min(t.y1,Math.ceil(Math.max(r.y0,r.y1)));if(s<o||c<u)continue;let d=s-o+1,p=c-u+1;if(p<Math.max(Math.round(8*a),.45*i)||d>Math.max(Math.round(7*a),.55*p))continue;let h=0;for(let e=o;e<=s;e++)h+=Math.max(0,Number(n[e])||0);!(h<Math.max(Math.round(3*a),.28*p))&&(l.some(e=>Math.max(Math.min(e.x0,e.x1),o)<=Math.min(Math.max(e.x0,e.x1),s))||l.push(r))}return l.sort((e,t)=>Math.min(e.x0,e.x1)+Math.max(e.x0,e.x1)-(Math.min(t.x0,t.x1)+Math.max(t.x0,t.x1))),l}function y(e,t,n,r=1,a,i=n.length){let l=h(r),o=Math.max(1,t.y1-t.y0+1),s=e.filter(e=>{let r=Math.max(t.x0,Math.floor(Math.min(e.x0,e.x1))),s=Math.min(t.x1,Math.ceil(Math.max(e.x0,e.x1))),u=Math.max(t.y0,Math.floor(Math.min(e.y0,e.y1))),c=Math.min(t.y1,Math.ceil(Math.max(e.y0,e.y1)));if(s<r||c<u)return!1;let d=Math.max(1,Math.abs(e.y1-e.y0)),p=c-u+1;if(p<Math.max(Math.round(8*l),.45*o)||p<.72*d||s-r+1>.68*p)return!1;let h=0;for(let e=r;e<=s;e++)h+=Math.max(0,Number(n[e])||0);if(h<Math.max(Math.round(4*l),.3*p))return!1;if(a&&i>0){let e=0;for(let t=u;t<=c;t++){let n=t*i,l=!1;for(let e=r;e<=s;e++)if(Number(a[n+e])){l=!0;break}l&&e++}if(e<.68*p)return!1}return!0}).sort((e,t)=>Math.min(e.x0,e.x1)+Math.max(e.x0,e.x1)-(Math.min(t.x0,t.x1)+Math.max(t.x0,t.x1)));if(!s.length)return[];let u=[];for(let e of s){if("round-open"===e.kind||"square-open"===e.kind){u.push(e);continue}let r=u.pop();if(!r)return[];let a=Math.max(1,Math.abs(r.y1-r.y0)),i=Math.max(1,Math.abs(e.y1-e.y0)),s=Math.min(a,i)/Math.max(a,i),c=Math.max(0,Math.min(Math.max(r.y0,r.y1),Math.max(e.y0,e.y1))-Math.max(Math.min(r.y0,r.y1),Math.min(e.y0,e.y1)))/Math.min(a,i),d=(r.x0+r.x1)*.5,p=(e.x0+e.x1)*.5,h=Math.max(t.x0,Math.ceil(Math.max(r.x0,r.x1))+1),m=Math.min(t.x1,Math.floor(Math.min(e.x0,e.x1))-1),f=0;for(let e=h;e<=m;e++)f+=Math.max(0,Number(n[e])||0);if(s<.64||c<.68||p-d<Math.max(3*l,.1*o)||f<Math.max(Math.round(2*l),.08*o))return[]}return u.length?[]:s}function w(e,t,n){let r=Math.max(t.x0,Math.floor(Math.min(e.x0,e.x1))),a=Math.min(t.x1,Math.ceil(Math.max(e.x0,e.x1))),i=Math.max(t.y0,Math.floor(Math.min(e.y0,e.y1))),l=Math.min(t.y1,Math.ceil(Math.max(e.y0,e.y1))),o=t.x0-1,s=t.x1+1;for(let e=r-1;e>=t.x0;e--)if((Number(n[e])||0)>0){o=e;break}for(let e=a+1;e<=t.x1;e++)if((Number(n[e])||0)>0){s=e;break}return(l-i+1)*2+Math.max(0,r-o-1)+Math.max(0,s-a-1)-(a-r+1)*2}function M(e,t,n,r,a=1,i,l){let o=Math.max(0,Math.floor(t)),s=o>0?Math.floor(e.length/o):0;if(!o||!s)return null;let u=h(a),c={x0:Math.max(0,Math.floor(n.x0)),y0:Math.max(0,Math.floor(n.y0)),x1:Math.min(o-1,Math.floor(n.x1)),y1:Math.min(s-1,Math.floor(n.y1))};if(c.x1<c.x0||c.y1<c.y0)return null;let d=c.x1-c.x0+1,p=c.y1-c.y0+1,m=Math.max(Math.round(3*u),Math.round(.11*p)),f=0;for(let e=c.x0;e<=c.x1;e++)f+=Math.max(0,Number(r[e])||0);if(!f)return null;let g=[],x=-1;for(let e=c.x0;e<=c.x1+1;e++){let t=e<=c.x1&&(Number(r[e])||0)>0;t&&x<0&&(x=e),!t&&x>=0&&(g.push({x0:x,x1:e-1}),x=-1)}let b=[];for(let t of g){let n=s,r=-1;if(i&&l)for(let e=t.x0;e<=t.x1;e++){let t=Number(i[e]),a=Number(l[e]);isFinite(t)&&isFinite(a)&&!(a<t)&&(n=Math.min(n,t),r=Math.max(r,a))}else for(let a=c.y0;a<=c.y1;a++){let i=a*o;for(let l=t.x0;l<=t.x1;l++)Number(e[i+l])&&(n=Math.min(n,a),r=Math.max(r,a))}if(r<n)continue;n=Math.max(c.y0,n),r=Math.min(c.y1,r);let a=t.x1-t.x0+1,d=r-n+1;if(d<Math.max(Math.round(14*u),.76*p)||a>Math.max(Math.round(4*u),.16*d))continue;let h=0,m=0,f=0,g=0,x=1/0,v=-1/0;for(let a=n;a<=r;a++){let n=a*o,r=0,i=0;for(let a=t.x0;a<=t.x1;a++)Number(e[n+a])&&(r++,i+=a);if(g+=r,!r){m=Math.max(m,++f);continue}f=0,h++;let l=i/r;x=Math.min(x,l),v=Math.max(v,l)}h<.78*d||m>Math.max(Math.round(2*u),Math.round(.08*d))||g<.7*d||v-x>Math.max(Math.round(3*u),1.8*a)||b.push({x0:t.x0,y0:n,x1:t.x1,y1:r,height:d,width:a,ink:g})}let v=null,y=-1/0;for(let e of b){let t=((e.x0+e.x1)*.5-c.x0)/d;if(t<.48||t>.92)continue;let n=c.x0-1,a=c.x1+1;for(let t=e.x0-1;t>=c.x0;t--)if((Number(r[t])||0)>0){n=t;break}for(let t=e.x1+1;t<=c.x1;t++)if((Number(r[t])||0)>0){a=t;break}if(n<c.x0||a>c.x1)continue;let o=e.x0-n-1,u=a-e.x1-1;if(o<m||u<m)continue;let p=0,h=0,g=s,x=-1;for(let t=c.x0;t<=c.x1;t++){let n=Math.max(0,Number(r[t])||0);if(t<e.x0&&(p+=n),t>e.x1&&(h+=n),!n||t>=e.x0&&t<=e.x1||!i||!l)continue;let a=Number(i[t]),o=Number(l[t]);isFinite(a)&&isFinite(o)&&!(o<a)&&(g=Math.min(g,a),x=Math.max(x,o))}if(p<.28*f||h<.04*f||x>=g&&e.height<(x-g+1)*1.05||b.some(t=>{if(t===e)return!1;let n=c.x0-1,a=c.x1+1;for(let e=t.x0-1;e>=c.x0;e--)if((Number(r[e])||0)>0){n=e;break}for(let e=t.x1+1;e<=c.x1;e++)if((Number(r[e])||0)>0){a=e;break}if(n<c.x0||a>c.x1||t.x0-n-1<m||a-t.x1-1<m)return!1;let i=Math.min(t.height,e.height)/Math.max(t.height,e.height),l=Math.max(0,Math.min(t.y1,e.y1)-Math.max(t.y0,e.y0)+1)/Math.min(t.height,e.height),o=Math.abs((t.x0+t.x1)*.5-(e.x0+e.x1)*.5);return i>=.82&&l>=.78&&o>=m&&o<=.35*d}))continue;let w=3*e.height+o+u-3*e.width+.1*e.ink;w>y&&(y=w,v=e)}return v?{x0:v.x0,y0:v.y0,x1:v.x1,y1:v.y1}:null}function k(e,t=1,n={}){let r=Math.max(0,0|e.width),a=Math.max(0,0|e.height);if(!r||!a)return[];let i=e.getContext("2d",{willReadFrequently:!0});if(!i)return[];let l=i.getImageData(0,0,r,a),o=new Uint8Array(r*a),s=new Uint32Array(a);for(let e=0;e<a;e++){let t=e*r;for(let n=0;n<r;n++){let r=t+n;(function(e,t){let n=e[t+3]/255;return!(n<=.04)&&255-n*(255-(.299*e[t]+.587*e[t+1]+.114*e[t+2]))<245})(l.data,4*r)&&(o[r]=1,s[e]++)}}let u=e=>{for(let t of Array.isArray(e)?e:[]){if(!t||"object"!=typeof t||![t.x0,t.y0,t.x1,t.y1].every(Number.isFinite))continue;let e=Math.max(0,Math.floor(Math.min(Number(t.x0),Number(t.x1)))),n=Math.min(r-1,Math.ceil(Math.max(Number(t.x0),Number(t.x1)))),i=Math.max(0,Math.floor(Math.min(Number(t.y0),Number(t.y1)))),l=Math.min(a-1,Math.ceil(Math.max(Number(t.y0),Number(t.y1))));if(!(n<e)&&!(l<i))for(let t=i;t<=l;t++){let a=t*r;for(let r=e;r<=n;r++){let e=a+r;o[e]&&(o[e]=0,s[t]>0&&s[t]--)}}}};n.maskCalculationRules&&u(e.__liaOcrCalculationRules),n.maskCarryOnes&&u(e.__liaOcrCarryOneHints),n.maskDivisionRules&&u(e.__liaOcrDivisionRules);let c=h(t),d=f(s,r,c);n.maskDivisionRules&&(d=x(s,d,e.__liaOcrDivisionRules));let p=Array.isArray(e.__liaOcrVerticalStrokes)?e.__liaOcrVerticalStrokes:[],m=Array.isArray(e.__liaOcrPlusMinusBoxes)?e.__liaOcrPlusMinusBoxes:[],g=Array.isArray(e.__liaOcrDelimiterHints)?e.__liaOcrDelimiterHints:[],S=[];for(let e=0;e<d.length;e++){let t=d[e],n=r,i=-1,l=0,s=new Uint32Array(r),u=new Int32Array(r),h=new Int32Array(r);u.fill(a),h.fill(-1);for(let e=t.y0;e<=t.y1;e++){let t=e*r;for(let a=0;a<r;a++)o[t+a]&&(l++,s[a]++,e<u[a]&&(u[a]=e),e>h[a]&&(h[a]=e),a<n&&(n=a),a>i&&(i=a))}if(i<n||l<2)continue;let f=t.y1-t.y0+1,x=Math.max(Math.round(8*c),Math.min(Math.round(28*c),Math.round((i-n+1)*.04))),k=Math.max(Math.round(5*c),Math.min(Math.round(18*c),Math.round(.22*f))),A=e>0?Math.floor((d[e-1].y1+t.y0)/2)+1:0,C=e+1<d.length?Math.ceil((t.y1+d[e+1].y0)/2)-1:a-1,_=Math.max(0,n-x),R=Math.min(r-1,i+x),T=Math.max(A,t.y0-k),E=Math.min(C,t.y1+k),L=R-_+1,z=E-T+1;if(L<=0||z<=0)continue;let O={x0:n,y0:t.y0,x1:i,y1:t.y1},I=[],q=v(p,O,s,c),P=y(g,O,s,c,o,r);for(let e of p){let t=b([e],O,s,c,u,h);!t||I.some(e=>1>Math.abs(e.hint.x0-t.x0)&&1>Math.abs(e.hint.x1-t.x1))||I.push({hint:t,source:"vector"})}if(I.sort((e,t)=>w(t.hint,O,s)-w(e.hint,O,s)),!I.length){let e=M(o,r,O,s,c,u,h);e&&I.push({hint:e,source:"raster"})}let N=document.createElement("canvas");N.width=L,N.height=z;let F=N.getContext("2d",{willReadFrequently:!0});if(!F)continue;let W=F.createImageData(L,z);for(let e=0;e<z;e++){let t=(T+e)*r+_,n=e*L;for(let e=0;e<L;e++){let r=(n+e)*4,a=255*!o[t+e];W.data[r]=a,W.data[r+1]=a,W.data[r+2]=a,W.data[r+3]=255}}F.putImageData(W,0,0);let D=I.map(e=>({x0:Math.max(0,Math.floor(Math.min(e.hint.x0,e.hint.x1))-_),x1:Math.min(L-1,Math.ceil(Math.max(e.hint.x0,e.hint.x1))-_),source:e.source,confidence:"vector"===e.source&&!1===e.hint.hasTopHook?"high":"normal"})),j=D[0],$=q.map(e=>({x0:Math.max(0,Math.floor(Math.min(e.x0,e.x1))-_),x1:Math.min(L-1,Math.ceil(Math.max(e.x0,e.x1))-_),source:"vector",confidence:"high"})),B=P.map(e=>({x0:Math.max(0,Math.floor(Math.min(e.x0,e.x1))-_),x1:Math.min(L-1,Math.ceil(Math.max(e.x0,e.x1))-_),kind:e.kind})),H=m.filter(e=>{let t=(e.x0+e.x1)/2,l=(e.y0+e.y1)/2;if(t<n||t>i||l<T||l>E||e.y0<T||e.y1>E)return!1;let s=Math.max(0,Math.floor(e.x0)),u=Math.max(0,Math.floor(e.y0)),c=Math.min(r-1,Math.ceil(e.x1)),d=Math.min(a-1,Math.ceil(e.y1)),p=0,h=new Set,m=new Set;for(let e=u;e<=d;e++){let t=e*r;for(let n=s;n<=c;n++)o[t+n]&&(p++,h.add(n),m.add(e))}let f=Math.max(1,c-s+1),g=Math.max(1,d-u+1);return p>=Math.max(6,Math.round((f+g)*.6))&&h.size>=Math.max(2,Math.round(.45*f))&&m.size>=Math.max(2,Math.round(.45*g))}).map(e=>({x0:Math.max(0,e.x0-_),y0:Math.max(0,e.y0-T),x1:Math.min(L-1,e.x1-_),y1:Math.min(z-1,e.y1-T)}));S.push({canvas:N,bbox:{x:_,y:T,width:L,height:z},inkBox:{x:n,y:t.y0,width:i-n+1,height:t.y1-t.y0+1},fingerprint:function(e,t,n,r,a,i){let l=0x811c9dc5,o=e=>{l^=255&e,l=Math.imul(l,0x1000193)>>>0};o(a),o(a>>>8),o(i),o(i>>>8);for(let l=0;l<i;l++){let i=(r+l)*t+n;for(let t=0;t<a;t++)o(e[i+t])}return a+"x"+i+"-"+l.toString(16).padStart(8,"0")}(o,r,n,t.y0,i-n+1,t.y1-t.y0+1),inkPixels:l,operationSeparator:j,operationSeparators:D,structuralBars:$,structuralDelimiters:B,plusMinusHints:H,hasPlusMinusHint:H.length>0})}return S}let S=new Set(["le","leq","ge","geq","approx","neq","ne","equiv","sim","simeq","cong","propto","in","notin","subset","subseteq","supset","supseteq","to","mapsto","implies","iff"]);function A(e,t){let n=e.slice(t,t+2);return"<="===n||">="===n||"!="===n||":="===n||"=="===n||"=<>≤≥≈≠≡∼".includes(e[t]||"")}function C(e){let t=String(e||"");if(!t)return t;let n=0,r=0,a=0,i=!1,l=-1;for(let e=0;e<t.length;){let o=t[e];if("%"===o)break;if("&"===o)return t;if("\\"===o){let i=t[e+1]||"";if(!/[A-Za-z]/.test(i)){e+=Math.min(2,t.length-e);continue}let o=e+2;for(;o<t.length&&/[A-Za-z]/.test(t[o]);)o++;let s=t.slice(e+1,o);if("begin"===s||"end"===s)return t;if(l<0&&0===n&&0===r&&0===a){if(S.has(s))l=e;else if("not"===s){let n=o;for(;n<t.length&&/\s/.test(t[n]);)n++;A(t,n)&&(l=e)}}e=o;continue}"{"===o?n++:"}"===o?--n<0&&(i=!0):"("===o?r++:")"===o?--r<0&&(i=!0):"["===o?a++:"]"===o?--a<0&&(i=!0):l<0&&0===n&&0===r&&0===a&&A(t,e)&&(l=e),e++}return i||0!==n||0!==r||0!==a||l<0?t:t.slice(0,l)+"&"+t.slice(l)}function _(e,t){let n=String(e||"").trim(),r=String(t||"").trim();if(!n)return!1;let a=C(n);if(a===n)return!1;let i=a.indexOf("&");if(i<0)return!1;let l=a.slice(i+1).replace(/^(?:(?:<=|>=|!=|:=|==|[=<>\u2264\u2265\u2248\u2260\u2261\u223c])|\\(?:le|leq|ge|geq|approx|neq|ne|equiv|sim|simeq|cong|propto|in|notin|subset|subseteq|supset|supseteq|to|mapsto|implies|iff)\b)\s*/,"").trim();if(!l||/[+\-*/=,:;]$/.test(l)||/\\(?:cdot|div|times)\s*$/.test(l))return!1;let o=0,s=0;for(let e of n)"|"===e?(s%2==0&&o++,s=0):"\\"===e?s++:s=0;let u=(n.match(/\\lvert\b/g)||[]).length,c=(n.match(/\\rvert\b/g)||[]).length,d=(n.match(/\\vert\b/g)||[]).length,p=(n.match(/\\lVert\b/g)||[]).length,h=(n.match(/\\rVert\b/g)||[]).length,m=(n.match(/\\Vert\b/g)||[]).length;return o%2==0&&u===c&&d%2==0&&p===h&&m%2==0&&/^(?:[+\-:/]|\\(?:cdot|div|times)\b)/.test(r)}function R(e){let t=String(e||"").trim();return/^(?:;|=(?=\s*[^=]))(?=\s*\S)/.test(t)?":"+t.slice(1):t}function T(e){return String(e||"").trim().replace(/&/gu,"").replace(/\\(?:left|right)\b/gu,"").replace(/\\dfrac\b/gu,"\\frac").replace(/\s/gu,"")}function E(e,t){let n=String(e||"").replace(/&/gu,"").trim(),r=T(t);if(!n||!r||!_(t,"+0"))return null;let a=0,i=0,l=0,o=!1,s=[];for(let e=0;e<n.length;){let t=n[e];if("\\"===t){let t=e+1;for(;t<n.length&&/[A-Za-z]/u.test(n[t]);)t++;let r=n.slice(e+1,t);o&&0===a&&0===i&&0===l&&("cdot"===r||"times"===r||"div"===r)&&s.push(e),e=Math.max(t,e+2);continue}if("{"===t?a++:"}"===t?a--:"("===t?i++:")"===t?i--:"["===t?l++:"]"===t?l--:0===a&&0===i&&0===l&&("="===t?o=!0:o&&"+-:/*".includes(t)&&s.push(e)),a<0||i<0||l<0)return null;e++}if(0!==a||0!==i||0!==l)return null;for(let e of s){let a=n.slice(0,e).trim(),i=R(n.slice(e)),l=T(a),o=l===r,s=l===r+"1";if(!o&&!s)continue;let u=s?String(t||"").trim():a;if(_(u,i))return u+" \\mid "+i}return null}let L=/^(\s*(?:(?:⇒|⟹|=>|\\(?:Rightarrow|Longrightarrow|implies)\b)\s*)?[A-Za-z]_\{(?:1,2|12)\}\s*=\s*)(\\sqrt\b[\s\S]*)$/u,z=/^\s*(?:(?:⇒|⟹|=>|\\(?:Rightarrow|Longrightarrow|implies)\b)\s*)?([A-Za-z])_\{(?:1,2|12)\}\s*=\s*\\sqrt\{([\s\S]+)\}\s*$/u;function O(e){return String(e||"").replace(/\\(?:left|right)\b/gu,"").replace(/\\dfrac\b/gu,"\\frac").replace(/\s/gu,"")}function I(e){for(let t=1;t<e.length;t++){let n=z.exec(String(e[t]||""));if(!n)continue;let r=String(e[t-1]||"").split(/\\mid\b/u,1)[0].replace(/\s/gu,""),a=/^([A-Za-z])(?:\^\{2\}|\^2|²)=([\s\S]+)$/u.exec(r);if(a&&a[1].toLowerCase()===n[1].toLowerCase()&&O(a[2])===O(n[2]))return t}return -1}function q(e,t){let n=String(e||"").replace(/&/gu,"").trim(),r=String(t||"").trim();return/^(?:(?:⇒|⟹|=>|\\(?:Rightarrow|Longrightarrow|implies)\b)\s*)?[A-Za-z]_\{(?:1,2|12)\}\s*=\s*$/u.test(n)&&/^\\sqrt\b/u.test(r)}function P(e){let t=String(e||"");if(/(?:±|\\pm(?![A-Za-z]))/u.test(t))return null;let n=L.exec(t);return n?n[1]+"\\pm"+n[2]:null}let N=new Set(["alpha","beta","gamma","delta","epsilon","varepsilon","zeta","eta","theta","vartheta","iota","kappa","lambda","mu","nu","xi","pi","varpi","rho","varrho","sigma","varsigma","tau","upsilon","phi","varphi","chi","psi","omega"]);function F(e){let t=e.map(e=>String(e||"").trim()),n=e=>{let t=String(e||"").match(/^\s*(?:\{([A-Za-z])\}|([A-Za-z]))\s*(?:&\s*)?=(?!=)/);return t&&(t[1]||t[2])||""},r=(e,t)=>{let n=String(e||"").match(RegExp("^(\\s*[+\\-]?\\s*\\d+(?:[.,]\\d+)?\\s*(?:\\\\,)?\\s*)\\\\cdot\\b"+(t?"(?=\\s*(?:==|<=|>=|!=|=|<|>))":"(?=\\s*(?:[+\\-]|==|<=|>=|!=|=|<|>))")));return n?{coefficient:n[1].replace(/\s+/g,""),prefix:n[1]}:null},a=(e,t,n)=>{let a=r(e,!1);return a&&a.coefficient===n&&C(e)!==e?e.replace(/^(\s*[+\-]?\s*\d+(?:[.,]\d+)?\s*(?:\\,)?\s*)\\cdot\b/,"$1"+t):e},i=e=>{let t=String(e||"").match(/^\s*([+\-]?\s*\d+(?:[.,]\d+)?\s*(?:\\,)?\s*)(?:\{([A-Za-z])\}|([A-Za-z]))(?=\s*(?:[+\-]|==|<=|>=|!=|=|<|>))/);return t&&C(e)!==e?{coefficient:t[1].replace(/\s+/g,""),variable:t[2]||t[3]||""}:null};for(let e=0;e+1<t.length;e++){let n=r(t[e],!1),l=i(t[e+1]);n&&l&&n.coefficient===l.coefficient&&(t[e]=a(t[e],l.variable,n.coefficient))}for(let e=0;e<t.length;e++){let i=r(t[e],!0);if(!i)continue;let l=Array.from(new Set([e>0?n(t[e-1]):"",e+1<t.length?n(t[e+1]):""].filter(Boolean)));if(1!==l.length)continue;let o=l[0];t[e]=a(t[e],o,i.coefficient);for(let n=e-1;n>=0;n--){let e=a(t[n],o,i.coefficient);if(e===t[n])break;t[n]=e}}for(let e=1;e+1<t.length;e++){let n=t[e],r=n.match(/^(?:\u2203\s*|\\exists\s*)(?:\{([A-Za-z])\}|([A-Za-z]))\s*=/);if(!r)continue;let a=r[1]||r[2],i=t[e-1],l=i.replace(/\s+/g,""),o=t[e+1].replace(/\s+/g,""),s=a.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"),u=RegExp("^3(?:\\\\,)?"+s+"(?=[+\\-*/^_=<>])").test(l),c=RegExp("^"+s+"=").test(o),d=C(i)!==i;u&&d&&c&&(t[e]="3"+a+"="+n.slice(r[0].length))}return function(e){let t=e.slice(),n=t.join("\n");if(!function(e){let t=0;for(let n=0;n<e.length;n++){if("\\"===e[n]){n++;continue}if("{"===e[n]&&t++,"}"===e[n]&&--t<0)return!1}return 0===t}(n)||[/\\(?:vec|mathbf|mathcal|mathrm|text|operatorname)\s*\{\s*X(?:\s|\})/,/(?:^|[^A-Za-z])X\s*_/m,/_\s*\{?\s*X(?:\s|\}|$)/m,/(?:^|[^A-Za-z])X\s*'(?:\s|$)/m,/(?:^|[^A-Za-z])X\s*\^\s*(?:T|\{\s*(?:T|\\top)\s*\})/m,/(?:^|[^A-Za-z])X\s*\(/m,/(?:^|[^A-Za-z])X\s*=\s*\(/m,/\\Delta\s+X(?:\s|$)/m,/(?:^|[^A-Za-z])X\s*\\sim\b/m,/(?:^|[^A-Za-z])X\s*=.*\\(?:mathrm|text)\b/m].some(e=>e.test(n)))return t;let r=new Set;for(let e of t)for(let t=0;t<e.length;){let n=e[t];if("\\"===n){let n=t+1;for(;n<e.length&&/[A-Za-z]/.test(e[n]);)n++;let a=e.slice(t+1,n);N.has(a)&&r.add("\\"+a),t=Math.max(n,t+2);continue}if(/[A-Za-z]/.test(n)){let n=t+1;for(;n<e.length&&/[A-Za-z]/.test(e[n]);)n++;let a=e.slice(t,n);r.add(1===a.length&&/[xX]/.test(a)?"x":a),t=n;continue}t++}return 1===r.size&&r.has("x")?t.map(e=>e.replace(/(^|[^A-Za-z\\])X(?=$|[^A-Za-z_])/g,(e,t)=>t+"x")):t}(t)}function W(e){let t=e.map(e=>String(e||"").trim()).filter(Boolean);return t.length?1===t.length?t[0]:"\\begin{aligned} "+t.map(C).join(" \\\\ ")+" \\end{aligned}":""}function D(e){return W(String(e||"").replace(/\r/g,"").split("\n"))}},{"@parcel/transformer-js/src/esmodule-helpers.js":"b0H7B","./symbol-geometry.ts":"aw2PO"}],aw2PO:[function(e,t,n,r){var a=e("@parcel/transformer-js/src/esmodule-helpers.js");function i(e){return(e.points||[]).filter(e=>Number.isFinite(e.x)&&Number.isFinite(e.y))}function l(e){let t=i(e),n=[];for(let e of t){let t=n[n.length-1];(!t||Math.hypot(e.x-t.x,e.y-t.y)>1e-6)&&n.push(e)}if(n.length<2)return null;let r=[0],a=0,l=0,o=n[0].x,s=n[0].y,u=n[0].x,c=n[0].y;for(let e=1;e<n.length;e++){let t=n[e-1],i=n[e];a+=Math.hypot(i.x-t.x,i.y-t.y),l+=Math.abs(i.y-t.y),r.push(a),o=Math.min(o,i.x),s=Math.min(s,i.y),u=Math.max(u,i.x),c=Math.max(c,i.y)}if(a<=1e-6)return null;let d=[],p=0;for(let e=0;e<=80;e++){let t=a*e/80;for(;p<n.length-2&&r[p+1]<t-1e-6;)p++;let i=r[p+1]-r[p],l=i>1e-6?Math.max(0,Math.min(1,(t-r[p])/i)):0,o=n[p],s=n[p+1];d.push({x:o.x+(s.x-o.x)*l,y:o.y+(s.y-o.y)*l})}let h=n[0],m=n[n.length-1],f=Number.isFinite(e.strokeWidth)&&Number(e.strokeWidth)>0?Number(e.strokeWidth):1;return{points:n,samples:d,box:{x0:o,y0:s,x1:u,y1:c},length:a,chord:Math.hypot(m.x-h.x,m.y-h.y),verticalTravel:l,strokeWidth:f}}function o(e,t){return(t.x-(e.slope*t.y+e.intercept))/Math.sqrt(1+e.slope*e.slope)}function s(e,t){let n=1/0,r=1/0,a=-1/0,l=-1/0;for(let o of t){let t=e[o];if(!t)continue;let s=i(t);if(!s.length)continue;let u=(Number.isFinite(t.strokeWidth)&&Number(t.strokeWidth)>0?Number(t.strokeWidth):1)/2;for(let e of s)n=Math.min(n,e.x-u),r=Math.min(r,e.y-u),a=Math.max(a,e.x+u),l=Math.max(l,e.y+u)}return isFinite(n)&&isFinite(r)&&isFinite(a)&&isFinite(l)?{x0:n,y0:r,x1:a,y1:l}:null}function u(e,t,n){return(e.y-t)/Math.max(n,1e-6)}function c(e,t){var n;let r;if(!Number.isInteger(t)||t<0||t>=e.length)return"other";let a=l(e[t]);if(!a)return"other";let i=a.box.y1-a.box.y0;if(i<6*a.strokeWidth||i<=1e-6)return"other";let s=function(e,t,n){let r=e.filter(e=>e.y>=t+.28*n);if(r.length<3)return null;let a=0,i=0;for(let e of r)a+=e.x,i+=e.y;a/=r.length,i/=r.length;let l=0,o=0;for(let e of r)l+=(e.y-i)*(e.x-a),o+=(e.y-i)**2;if(o<=1e-6)return null;let s=l/o,u=a-s*i,c=Math.sqrt(1+s*s),d=r.map(e=>Math.abs(e.x-(s*e.y+u))/c).sort((e,t)=>e-t);return{slope:s,intercept:u,rmsResidual:Math.sqrt(d.reduce((e,t)=>e+t*t,0)/d.length),p90Residual:d[Math.floor((d.length-1)*.9)]}}(a.samples,a.box.y0,i);if(!s||Math.abs(s.slope)>.65)return"other";let u=Math.max(2*a.strokeWidth,.06*i),c=Math.max(2.8*a.strokeWidth,.09*i);if(s.rmsResidual>u||s.p90Residual>c)return"other";if(!(s.rmsResidual<=Math.max(a.strokeWidth,.025*i)&&s.p90Residual<=Math.max(1.5*a.strokeWidth,.04*i)))return"ambiguous";let d=Math.max(1.2*a.strokeWidth,.045*i),p=Math.max(2.2*a.strokeWidth,.085*i),h=Math.max(1.6*a.strokeWidth,.025*i),m=0,f=0,g=0,x=!1;for(let e of a.samples){let t=(e.y-a.box.y0)/i,n=o(s,e);t<=.34?(m=Math.max(m,n),f=Math.max(f,-n),t>=-.02&&Math.abs(n)<=h&&(x=!0)):t<=.92&&(g=Math.max(g,Math.abs(n)))}let b=Math.max(m,f),v=Math.min(m,f),y=b>=p&&b<=.65*i&&v<=d&&g<=Math.max(1.7*a.strokeWidth,.04*i)&&x,w=!1,M=!1;for(let n=0;n<e.length;n++){if(n===t)continue;let r=l(e[n]);if(!r)continue;let u=Math.max(a.strokeWidth,r.strokeWidth),c=Math.max(1.75*u,.025*i),h=r.samples.map(e=>({relativeY:(e.y-a.box.y0)/i,distance:o(s,e)})).filter(e=>e.relativeY>=-.18&&e.relativeY<=1.15),m=h.filter(e=>Math.abs(e.distance)<=c);if(0===m.length)continue;let f=m.some(e=>e.relativeY>.3&&e.relativeY<.94),g=m.some(e=>e.relativeY>=.94),x=m.some(e=>e.relativeY<=.3);if(f||g||!x){M=!0;continue}let b=0,v=0;for(let e of h)b=Math.max(b,e.distance),v=Math.max(v,-e.distance);let y=Math.max(b,v),k=Math.min(b,v),S=r.box.x1-r.box.x0,A=r.box.y1-r.box.y0,C=(r.box.y0-a.box.y0)/i,_=(r.box.y1-a.box.y0)/i,R=C>=-.25&&_<=.42,T=r.length>=Math.max(1.5*u,.025*i)&&r.length<=.85*i&&S>=Math.max(1.5*u,.045*i)&&S>=.25*A;R&&T&&y>=p&&k<=d?w=!0:M=!0}if(M)return"ambiguous";if(y||w)return"hooked-one";if(b>d||g>d)return"ambiguous";let k=(n=a.samples,{rms:Math.sqrt((r=n.map(e=>Math.abs(o(s,e))).sort((e,t)=>e-t)).reduce((e,t)=>e+t*t,0)/r.length),p95:r[Math.floor((r.length-1)*.95)],maximum:r[r.length-1]}),S=k.rms<=Math.max(.85*a.strokeWidth,.018*i)&&k.p95<=Math.max(1.25*a.strokeWidth,.03*i)&&k.maximum<=Math.max(1.8*a.strokeWidth,.04*i),A=a.chord/a.length>=.94,C=i/Math.max(a.verticalTravel,1e-6)>=.92;return S&&A&&C?"hookless-bar":"ambiguous"}function d(e,t){let n,r=i(e);if(r.length<2)return null;let a=r[0].x,l=r[0].y,o=r[0].x,s=r[0].y,u=0;for(let e=1;e<r.length;e++){let t=r[e-1],n=r[e];u+=Math.hypot(n.x-t.x,n.y-t.y),a=Math.min(a,n.x),l=Math.min(l,n.y),o=Math.max(o,n.x),s=Math.max(s,n.y)}let c=r[0],d=r[r.length-1],p=Math.hypot(d.x-c.x,d.y-c.y),h=Number.isFinite(e.strokeWidth)&&Number(e.strokeWidth)>0?Number(e.strokeWidth):1,m=o-a,f=s-l;if((u>1e-6?p/u:0)<.82)return null;if(m>=Math.max(2.5*h,3*f))n="horizontal";else{if(!(f>=Math.max(2.5*h,3*m)))return null;n="vertical"}return{index:t,kind:n,box:{x0:a,y0:l,x1:o,y1:s},centerX:(a+o)/2,centerY:(l+s)/2,width:m,height:f,strokeWidth:h}}function p(e,t,n=12){let r=l(e);if(!r)return null;let a=r.box.x1-r.box.x0,i=r.box.y1-r.box.y0;if(a<r.strokeWidth*n||a<Math.max(9*i,1e-6))return null;let o=0;for(let e=1;e<r.points.length;e++)o+=Math.abs(r.points[e].x-r.points[e-1].x);let s=r.points[0],u=Math.abs(r.points[r.points.length-1].y-s.y),c=a/Math.max(o,1e-6),d=r.chord/Math.max(r.length,1e-6);return c<.84||d<.88||u>Math.max(3*r.strokeWidth,.055*a)||r.verticalTravel>Math.max(8*r.strokeWidth,.16*a)?null:{index:t,geometry:r,centerY:(r.box.y0+r.box.y1)/2,width:a}}function h(e,t){let n=s(e,t.map(e=>e.index));if(!n)return null;let r=t.reduce((e,t)=>e+t.width,0),a=t.reduce((e,t)=>e+t.centerY*t.width,0)/Math.max(r,1e-6);return{strokes:t,box:n,centerY:a,width:n.x1-n.x0}}function m(e,t){let n=[];for(let r of Array.from(t).sort((e,t)=>e.centerY-t.centerY||e.geometry.box.x0-t.geometry.box.x0)){let t=-1;for(let e=0;e<n.length;e++){let a=n[e],i=Math.max(r.geometry.strokeWidth,...a.strokes.map(e=>e.geometry.strokeWidth)),l=Math.max(3*i,.035*Math.min(a.width,r.width));if(!(Math.abs(a.centerY-r.centerY)>l)){if(Math.max(0,a.box.x0-r.geometry.box.x1,r.geometry.box.x0-a.box.x1)<=Math.max(5*i,.12*Math.min(a.width,r.width))){t=e;break}}}if(t<0){let t=h(e,[r]);t&&n.push(t);continue}let a=h(e,[...n[t].strokes,r]);a&&(n[t]=a)}return n}function f(e){let t=[];for(let n of e){let e=n.box.x1-n.box.x0,r=n.box.y1-n.box.y0;r>=4*n.strokeWidth&&e<=2.2*r&&t.push(r)}return t.length>=3?function(e){if(!e.length)return 0;let t=Array.from(e).sort((e,t)=>e-t),n=Math.max(0,Math.min(t.length-1,Math.floor((t.length-1)*.68)));return t[n]}(t):0}function g(e,t){let n=e.map(e=>{let t=e.box;return{box:t,centerY:(t.y0+t.y1)/2,height:t.y1-t.y0}}).sort((e,t)=>e.centerY-t.centerY),r=.48*t,a=[];for(let e of n){let t=a[a.length-1];if(!t||e.centerY-t.centerY>r){a.push({boxes:[e.box],centerY:e.centerY,maximumHeight:e.height,x0:e.box.x0,x1:e.box.x1});continue}t.boxes.push(e.box),t.centerY=t.boxes.reduce((e,t)=>e+(t.y0+t.y1)/2,0)/t.boxes.length,t.maximumHeight=Math.max(t.maximumHeight,e.height),t.x0=Math.min(t.x0,e.box.x0),t.x1=Math.max(t.x1,e.box.x1)}return a}function x(e){let t=e.map(e=>l(e)),n=e.map((e,t)=>p(e,t)).filter(e=>!!e),r=new Set(n.map(e=>e.index)),a=t.filter((e,t)=>!!e&&!r.has(t));return m(e,n).filter(e=>(function(e,t){let n=t.filter(t=>t.box.x1>=e.box.x0&&t.box.x0<=e.box.x1),r=f(n);if(r<=1e-6)return!1;let a=Math.max(...e.strokes.map(e=>e.geometry.strokeWidth));if(e.width<Math.max(12*a,2.15*r))return!1;let i=g(n.filter(t=>Math.abs((t.box.y0+t.box.y1)/2-e.centerY)<=5.5*r),r),l=.35*r,o=i.filter(e=>e.maximumHeight>=.72*r&&e.x1-e.x0>=l),s=Math.max(2*a,.08*r),u=o.filter(t=>t.centerY<e.centerY-s).sort((e,t)=>t.centerY-e.centerY),c=o.filter(t=>t.centerY>e.centerY+s).sort((e,t)=>e.centerY-t.centerY);if(u.length<2||c.length<1)return!1;let d=e.centerY-u[0].centerY,p=e.centerY-u[1].centerY,h=c[0].centerY-e.centerY;return d<=1.95*r&&p<=3.45*r&&h<=1.95*r})(e,a)).sort((e,t)=>e.centerY-t.centerY||e.box.x0-t.box.x0).map(e=>({...e.box,pathIndexes:e.strokes.map(e=>e.index).sort((e,t)=>e-t)}))}function b(e,t){return Math.max(0,Math.min(e.x1,t.box.x1)-Math.max(e.x0,t.box.x0))}function v(e){let t=e.map(e=>l(e)),n=e.map((e,t)=>p(e,t,5.5)).filter(e=>!!e),r=new Set(n.map(e=>e.index)),a=t.filter((e,t)=>!!e&&!r.has(t));return m(e,n).filter(e=>(function(e,t){let n=t.filter(t=>t.box.x1>=e.box.x0-.35*e.width&&t.box.x0<=e.box.x1+.35*e.width),r=f(n);if(r<=1e-6)return!1;let a=Math.max(...e.strokes.map(e=>e.geometry.strokeWidth));if(e.width<Math.max(5.5*a,.42*r))return!1;let i=g(n.filter(t=>Math.abs((t.box.y0+t.box.y1)/2-e.centerY)<=2.2*r),r).filter(e=>e.maximumHeight>=.68*r&&e.x1-e.x0>=.22*r),l=i.filter(t=>t.centerY<e.centerY).sort((e,t)=>t.centerY-e.centerY)[0],o=i.filter(t=>t.centerY>e.centerY).sort((e,t)=>e.centerY-t.centerY)[0];if(!l||!o)return!1;let s=e.centerY-l.centerY,u=o.centerY-e.centerY,c=Math.min(.22*e.width,.22*r);return s>=.3*r&&s<=1.18*r&&u>=.3*r&&u<=1.85*r&&b(l,e)>=c&&b(o,e)>=c})(e,a)).sort((e,t)=>e.centerY-t.centerY||e.box.x0-t.box.x0).map(e=>({...e.box,pathIndexes:e.strokes.map(e=>e.index).sort((e,t)=>e-t)}))}function y(e,t,n,r){return Math.max(0,e-r,n-t)}function w(e,t=x(e)){if(!t.length)return[];let n=e.map(e=>l(e)),r=new Set;for(let e of t)for(let t of e.pathIndexes)r.add(t);let a=function(e){let t=e.map(e=>l(e)),n=[],r=new Set;for(let a=0;a<e.length;a++){let i=t[a];if(!i)continue;let l=i.box.y1-i.box.y0;if(l<=1e-6)continue;let o=[a];for(let n=0;n<e.length;n++){if(n===a)continue;let e=t[n];if(!e)continue;let r=y(i.box.x0,i.box.x1,e.box.x0,e.box.x1),s=y(i.box.y0,i.box.y1,e.box.y0,e.box.y1);r<=2.25*Math.max(i.strokeWidth,e.strokeWidth)+.08*l&&s<=.18*l&&o.push(n)}if("hooked-one"!==c(o.map(t=>e[t]),0))continue;let u=[a];if("hooked-one"!==c([e[a]],0))for(let t=1;t<o.length;t++)"hooked-one"===c([e[a],e[o[t]]],0)&&u.push(o[t]);u.sort((e,t)=>e-t);let d=u.join(",");if(r.has(d))continue;let p=s(e,u);p&&(r.add(d),n.push({box:p,pathIndexes:u}))}return n.sort((e,t)=>(e.box.y0+e.box.y1)/2-(t.box.y0+t.box.y1)/2||e.box.x0-t.box.x0)}(e),i=[];for(let e of a){if(e.pathIndexes.some(e=>r.has(e)))continue;let a=e.box.y1-e.box.y0,l=(e.box.x0+e.box.x1)/2,o=(e.box.y0+e.box.y1)/2,s=null;for(let e of t){let t=(e.y0+e.y1)/2,i=[];for(let t=0;t<n.length;t++){let a=n[t];!a||r.has(t)||a.box.x1<e.x0||a.box.x0>e.x1||i.push(a)}let u=f(i);if(u<=1e-6||a<.18*u||a>=.72*u||l<e.x0-.12*u||l>e.x1+.12*u)continue;let c=t-o;c<.12*u||c>4.5*u||(!s||c<s.distance)&&(s={rule:e,distance:c})}s&&i.push({...e.box,pathIndexes:e.pathIndexes,rulePathIndexes:Array.from(s.rule.pathIndexes)})}return i}function M(e,t,n){if("horizontal"!==e.kind)return null;let r=2*Math.max(e.strokeWidth,t.strokeWidth)+.025*t.height;if(Math.abs(e.centerY-n)>r||e.width<Math.max(r,.09*t.height)||e.width>.55*t.height||e.box.x1<t.centerX-r||e.box.x0>t.centerX+r)return null;let a=t.centerX-e.box.x0,i=e.box.x1-t.centerX,l=i>=a?1:-1,o=Math.max(a,i),s=Math.min(a,i);return o<Math.max(r,.09*t.height)||s>Math.max(r,.22*o)?null:{line:e,direction:l,reach:o,tipX:l>0?e.box.x1:e.box.x0}}function k(e){let t=[];for(let n=0;n<e.length;n++){let r=function(e,t){let n=l(e[t]);if(!n)return null;let r=n.box.x1-n.box.x0,a=n.box.y1-n.box.y0;if(a<6*n.strokeWidth||a<=1e-6||r<Math.max(1.75*n.strokeWidth,.055*a)||r>.43*a)return null;let i=n.points[0],o=n.points[n.points.length-1],c=i.y<=o.y?i:o,d=i.y<=o.y?o:i,p=Math.max(1.5*n.strokeWidth,.065*a);if(c.y-n.box.y0>p||n.box.y1-d.y>p||d.y-c.y<.84*a||Math.abs(c.x-d.x)>Math.max(2*n.strokeWidth,.13*a)||a/Math.max(n.verticalTravel,1e-6)<.84)return null;let h=d.y-c.y,m=n.samples.map(e=>{let t=(e.y-c.y)/Math.max(h,1e-6),r=c.x+(d.x-c.x)*t;return{offset:e.x-r,y:u(e,n.box.y0,a)}}),f=0,g=0,x=0,b=0;for(let e of m)f=Math.max(f,e.offset),g=Math.max(g,-e.offset),Math.abs(e.offset)>b&&(b=Math.abs(e.offset),x=e.y);let v=f>=g?1:-1,y=Math.max(f,g),w=Math.min(f,g);if(y<Math.max(1.6*n.strokeWidth,.09*a)||w>Math.max(1.2*n.strokeWidth,.18*y)||x<.27||x>.73)return null;let M=(e,t)=>{let n=0;for(let r of m)r.y<e||r.y>t||(n=Math.max(n,v*r.offset));return n},k=M(.16,.4),S=M(.38,.62),A=M(.6,.84);if(k<.52*y||S<.78*y||A<.52*y)return null;let C=Math.min(k,A)/Math.max(k,A,1e-6);if(C<.58)return null;let _=s(e,[t]);return _?{..._,kind:v<0?"round-open":"round-close",pathIndexes:[t],score:Math.abs(.24-r/a)+Math.abs(c.x-d.x)/a+(1-C)*.2}:null}(e,n);r&&t.push(r);let a=function(e,t){let n=l(e[t]);if(!n)return null;let r=n.box.x1-n.box.x0,a=n.box.y1-n.box.y0;if(a<6*n.strokeWidth||a<=1e-6||r<Math.max(2*n.strokeWidth,.09*a)||r>.52*a)return null;let i=n.points[0],o=n.points[n.points.length-1],c=i.y<=o.y?i:o,d=i.y<=o.y?o:i,p=Math.max(1.5*n.strokeWidth,.06*a);if(c.y-n.box.y0>p||n.box.y1-d.y>p||d.y-c.y<.88*a||Math.abs(c.x-d.x)>Math.max(1.5*n.strokeWidth,.18*r)||a/Math.max(n.verticalTravel,1e-6)<.92)return null;let h=n.samples.filter(e=>{let t=u(e,n.box.y0,a);return t>=.18&&t<=.82});if(h.length<8)return null;let m=function(e){if(!e.length)return 0;let t=Array.from(e).sort((e,t)=>e-t),n=Math.floor(t.length/2);return t.length%2?t[n]:(t[n-1]+t[n])/2}(h.map(e=>e.x)),f=h.map(e=>Math.abs(e.x-m)).sort((e,t)=>e-t),g=f[Math.floor((f.length-1)*.9)];if(g>Math.max(1.5*n.strokeWidth,.035*a))return null;let x=(c.x+d.x)/2-m,b=Math.abs(x);if(b<Math.max(2*n.strokeWidth,.09*a)||b>.52*a)return null;let v=Math.max(2.5*n.strokeWidth,.13*a),y=n.samples.filter(e=>e.y<=n.box.y0+v),w=n.samples.filter(e=>e.y>=n.box.y1-v),M=e=>{if(!e.length)return 0;let t=e.map(e=>e.x);return Math.max(...t)-Math.min(...t)},k=M(y),S=M(w);if(k<.78*b||S<.78*b)return null;let A=a+k+S;if(n.length<a+1.25*b||n.length>1.22*A)return null;let C=s(e,[t]);return C?{...C,kind:x>0?"square-open":"square-close",pathIndexes:[t],score:g/a+Math.abs(k-S)/Math.max(b,1e-6)*.1}:null}(e,n);a&&t.push(a)}let n=e.map((e,t)=>d(e,t)).filter(e=>!!e);t.push(...function(e,t){let n=t.filter(e=>"horizontal"===e.kind),r=t.filter(e=>"vertical"===e.kind),a=[];for(let t of r){if(t.height<6*t.strokeWidth)continue;let r=n.map(e=>M(e,t,t.box.y0)).filter(e=>!!e),i=n.map(e=>M(e,t,t.box.y1)).filter(e=>!!e);for(let n of r)for(let r of i){if(n.line.index===r.line.index||n.direction!==r.direction)continue;let i=Math.min(n.reach,r.reach)/Math.max(n.reach,r.reach,1e-6);if(i<.58)continue;let l=(n.reach+r.reach)/2,o=2*Math.max(n.line.strokeWidth,r.line.strokeWidth,t.strokeWidth)+.18*l;if(Math.abs(n.tipX-r.tipX)>o||r.line.centerY-n.line.centerY<.78*t.height)continue;let u=[t.index,n.line.index,r.line.index].sort((e,t)=>e-t),c=s(e,u);c&&a.push({...c,kind:n.direction>0?"square-open":"square-close",pathIndexes:u,score:(1-i)*.2+Math.abs(n.tipX-r.tipX)/Math.max(t.height,1e-6)})}}return a}(e,n)),t.sort((e,t)=>e.score-t.score||e.y0-t.y0||e.x0-t.x0);let r=new Set,a=[];for(let e of t)if(!e.pathIndexes.some(e=>r.has(e))){for(let t of e.pathIndexes)r.add(t);a.push(e)}return a.sort((e,t)=>{let n=e.y1-e.y0,r=t.y1-t.y0,a=(e.y0+e.y1)/2,i=(t.y0+t.y1)/2;return Math.abs(a-i)<=.35*Math.min(n,r)?e.x0-t.x0||a-i:a-i||e.x0-t.x0}),a.map(({score:e,...t})=>t)}function S(e){let t=e.map((e,t)=>d(e,t)).filter(e=>!!e),n=t.filter(e=>"horizontal"===e.kind),r=t.filter(e=>"vertical"===e.kind),a=[];for(let e of n)for(let t of r)if(function(e,t){let n=1.25*Math.max(e.strokeWidth,t.strokeWidth),r=.12*e.width,a=t.centerX>=e.box.x0+r-n&&t.centerX<=e.box.x1-r+n,i=e.centerY>=t.box.y0+.12*t.height-n&&e.centerY<=t.box.y1-.12*t.height+n,l=t.height>=.28*e.width&&t.height<=1.55*e.width;return a&&i&&l}(e,t))for(let r of n){if(r.index===e.index||!function(e,t,n){var r,a,i;if(n.centerY<=e.centerY)return!1;let l=(e.width+n.width)/2,o=n.width/Math.max(e.width,1e-6);if(o<.58||o>1.72||(r=e.box.x0,a=e.box.x1,i=n.box.x0,Math.max(0,Math.min(a,n.box.x1)-Math.max(r,i))<.62*Math.min(e.width,n.width)||Math.abs(e.centerX-n.centerX)>.28*l))return!1;let s=1.5*Math.max(e.strokeWidth,t.strokeWidth,n.strokeWidth),u=n.centerY-e.centerY;return!(u<Math.max(s,.34*t.height))&&!(u>1.45*l+s)&&n.centerY>=t.box.y1-s}(e,t,r))continue;let n={top:e,vertical:t,bottom:r,score:0};n.score=function(e){let{top:t,vertical:n,bottom:r}=e,a=(t.width+r.width)/2;return Math.abs(t.width-r.width)/Math.max(a,1e-6)+Math.abs(t.centerX-r.centerX)/Math.max(a,1e-6)+Math.abs(t.centerX-n.centerX)/Math.max(t.width,1e-6)+.25*Math.abs((r.centerY-t.centerY)/Math.max(a,1e-6)-.72)}(n),a.push(n)}a.sort((e,t)=>e.score-t.score||e.top.centerY-t.top.centerY||e.top.centerX-t.top.centerX);let i=new Set,l=[];for(let e of a){let t=[e.top.index,e.vertical.index,e.bottom.index];if(!t.some(e=>i.has(e))){for(let e of t)i.add(e);l.push({box:function(e){let t=1/0,n=1/0,r=-1/0,a=-1/0;for(let i of e){let e=i.strokeWidth/2;t=Math.min(t,i.box.x0-e),n=Math.min(n,i.box.y0-e),r=Math.max(r,i.box.x1+e),a=Math.max(a,i.box.y1+e)}return{x0:t,y0:n,x1:r,y1:a}}([e.top,e.vertical,e.bottom]),centerY:e.top.centerY,centerX:e.top.centerX})}}return l.sort((e,t)=>e.centerY-t.centerY||e.centerX-t.centerX),l.map(e=>e.box)}a.defineInteropFlag(n),a.export(n,"classifyOcrVerticalSymbolPath",()=>c),a.export(n,"findOcrCalculationRuleHints",()=>x),a.export(n,"findOcrDivisionRuleHints",()=>v),a.export(n,"findOcrCarryOneHints",()=>w),a.export(n,"findOcrDelimiterHints",()=>k),a.export(n,"findOcrPlusMinusBoxes",()=>S)},{"@parcel/transformer-js/src/esmodule-helpers.js":"b0H7B"}],dFsXY:[function(e,t,n,r){var a=e("@parcel/transformer-js/src/esmodule-helpers.js");a.defineInteropFlag(n),a.export(n,"extractCalculationEquation",()=>v),a.export(n,"validateEquationTransition",()=>z),a.export(n,"validateEquationTransitions",()=>O),a.export(n,"MAX_CALCULATION_ANSWER_LENGTH",()=>I),a.export(n,"serializeCalculationSubmission",()=>P),a.export(n,"validateCalculationSubmission",()=>F);let i=/^[+-]?(?:\d+(?:\.\d+)?|\d+\/\d+)$/u,l=/[A-Za-z][A-Za-z0-9_]*/g;function o(){try{let e=globalThis.Algebrite;return e&&"function"==typeof e.run?e:null}catch(e){return null}}let s={alpha:"greek_alpha",beta:"greek_beta",gamma:"greek_gamma",delta:"greek_delta",epsilon:"greek_epsilon",theta:"greek_theta",lambda:"greek_lambda",mu:"greek_mu",nu:"greek_nu",pi:"pi",rho:"greek_rho",sigma:"greek_sigma",tau:"greek_tau",phi:"greek_phi",chi:"greek_chi",psi:"greek_psi",omega:"greek_omega",Gamma:"greek_Gamma",Delta:"greek_Delta",Theta:"greek_Theta",Lambda:"greek_Lambda",Sigma:"greek_Sigma",Phi:"greek_Phi",Psi:"greek_Psi",Omega:"greek_Omega"},u=new Set(["mathrm","mathit","mathbf","mathsf","mathtt"]),c=new Set(["quad","qquad","enspace","thinspace","medspace","thickspace"]);function d(e,t,n,r,a,i,l={}){return{from:e,to:t,fromIndex:n,toIndex:n+1,status:r,reason:a,messageKey:i,...l}}function p(e,t,n,r){if(e[t]!==n)return null;let a=1;for(let i=t+1;i<e.length;i++)if(e[i]===n)a++;else if(e[i]===r&&0==--a)return{content:e.slice(t+1,i),end:i+1};return null}function h(e,t){let n=t;for(;n<e.length&&/\s/u.test(e[n]);)n++;if("{"===e[n])return p(e,n,"{","}");if("("===e[n])return p(e,n,"(",")");if("\\"===e[n]){let t=n+1;for(;t<e.length&&/[A-Za-z]/u.test(e[t]);)t++;return t===n+1?null:{content:e.slice(n,t),end:t}}return/[A-Za-z0-9.+-]/u.test(e[n]||"")?{content:e[n],end:n+1}:null}function m(e){return/[A-Za-z]/u.test(e)}function f(e,t){if(!e.domainRisk)return!1;if(/sqrt\s*\(|\^\(\s*-/u.test(e.cas))return!0;let n=function(e){let t=[];for(let n=0;n<e.length;n++){if("/"!==e[n])continue;let r=n+1;for(;r<e.length&&/\s/u.test(e[r]);)r++;for(("+"===e[r]||"-"===e[r])&&r++;r<e.length&&/\s/u.test(e[r]);)r++;if("("===e[r]){let n=p(e,r,"(",")");n&&m(n.content)&&t.push(n.content);continue}if(/[A-Za-z]/u.test(e[r]||"")){let n=r+1;for(;n<e.length&&/[A-Za-z0-9_]/u.test(e[n]);)n++;t.push(e.slice(r,n))}}return t}(e.cas);if(!n.length)return!0;let r=new Set(t.nonZeroSymbols||[]);return n.some(e=>!/^[A-Za-z][A-Za-z0-9_]*$/u.test(e)||!r.has(e))}function g(e,t=0){if(t>32||e.length>512)return null;let n="",r=!1;for(let a=0;a<e.length;){let i=e[a];if(/\s/u.test(i)||"​"===i){a++;continue}if("{"===i){let i=p(e,a,"{","}");if(!i)return null;let l=g(i.content,t+1);if(!l)return null;n+="("+l.cas+")",r||=l.domainRisk,a=i.end;continue}if("("===i||"["===i){let l="("===i?")":"]",o=p(e,a,i,l);if(!o)return null;let s=g(o.content,t+1);if(!s)return null;n+="("+s.cas+")",r||=s.domainRisk,a=o.end;continue}if("}"===i||")"===i||"]"===i)return null;if("\\"===i){let i=e[a+1]||"";if(!/[A-Za-z]/u.test(i)){if(","===i||";"===i||"!"===i||/\s/u.test(i)){a+=2;continue}return null}let l=a+2;for(;l<e.length&&/[A-Za-z]/u.test(e[l]);)l++;let o=e.slice(a+1,l);if(c.has(o)||"left"===o||"right"===o){a=l;continue}if("cdot"===o||"times"===o){n+="*",a=l;continue}if("div"===o){n+="/",a=l;continue}if("prime"===o){n+="_prime",a=l;continue}if("frac"===o||"dfrac"===o||"tfrac"===o){let i=h(e,l);if(!i)return null;let o=i.end;for(;o<e.length&&/\s/u.test(e[o]);)o++;if("{"!==e[o])return null;let s=p(e,o,"{","}");if(!s)return null;let u=g(i.content,t+1),c=g(s.content,t+1);if(!u||!c)return null;n+="(("+u.cas+")/("+c.cas+"))",r||=u.domainRisk||c.domainRisk||m(c.cas),a=s.end;continue}if("sqrt"===o){let i=h(e,l);if(!i)return null;let o=g(i.content,t+1);if(!o)return null;n+="sqrt("+o.cas+")",r=!0,a=i.end;continue}if(u.has(o)){let i=h(e,l);if(!i)return null;let o=g(i.content,t+1);if(!o)return null;n+=o.cas,r||=o.domainRisk,a=i.end;continue}let d=s[o];if(d){n+=d,a=l;continue}return null}if("_"===i){let t=h(e,a+1);if(!t)return null;let r=function(e){let t=String(e||"").replace(/\s/gu,"");if(/^[A-Za-z0-9]+$/u.test(t))return t;let n=/^\\([A-Za-z]+)$/u.exec(t);if(!n)return null;let r=s[n[1]];return r?r.replace(/^greek_/u,""):null}(t.content);if(!r)return null;n+="_"+r,a=t.end;continue}if("^"===i){let i=h(e,a+1);if(!i)return null;let l=g(i.content,t+1);if(!l)return null;n+="^("+l.cas+")",r||=l.domainRisk||/^\s*-/u.test(l.cas),a=i.end;continue}if("'"===i){n+="_prime",a++;continue}if(","===i){let t=e[a-1]||"",r=e[a+1]||"";if(!/\d/u.test(t)||!/\d/u.test(r))return null;n+=".",a++;continue}if(/[0-9.]/u.test(i)){let t=a+1;for(;t<e.length&&/[0-9.]/u.test(e[t]);)t++;let r=e.slice(a,t);if(!/^\d+(?:\.\d+)?$/u.test(r)||r.length>24)return null;n+=r,a=t;continue}if(/[A-Za-z]/u.test(i)){let t=a+1;for(;t<e.length&&/[A-Za-z0-9]/u.test(e[t]);)t++;/[A-Za-z0-9_]$/u.test(n)&&(n+="*"),n+=Array.from(e.slice(a,t)).join("*"),a=t;continue}if("+-*/".includes(i)){n+=i,a++;continue}if("−"===i){n+="-",a++;continue}if("×"===i||"·"===i){n+="*",a++;continue}if("÷"===i||":"===i){n+="/",a++;continue}return null}if(!n||!/^[A-Za-z0-9_+\-*/^().]+$/u.test(n))return null;let a=n.replace(/\b([A-Za-z][A-Za-z0-9_]*)\s*\(/gu,(e,t)=>"sqrt"===t?"sqrt(":t+"*(").replace(/(\d|\))\s*\(/gu,"$1*(").replace(/\)\s*(?=[A-Za-z0-9_])/gu,")*");return{cas:a,domainRisk:r||function(e){for(let t=0;t<e.length;t++){if("/"!==e[t])continue;let n=t+1;for(;n<e.length&&/\s/u.test(e[n]);)n++;for(("+"===e[n]||"-"===e[n])&&n++;n<e.length&&/\s/u.test(e[n]);)n++;if("("===e[n]){let t=p(e,n,"(",")");if(!t||m(t.content))return!0;continue}if(!/[0-9.]/u.test(e[n]||""))return!0}return!1}(a)}}function x(e){let t=String(e||"").trim();return t.startsWith("$$")&&t.endsWith("$$")&&t.length>=4?t=t.slice(2,-2).trim():t.startsWith("$")&&t.endsWith("$")&&t.length>=2&&(t=t.slice(1,-1).trim()),t}function b(e){let t=x(e),n=function(e){let t=0,n=0,r=0;for(let a=0;a<e.length;){let i=e[a];if("{"===i)t++;else if("}"===i)t--;else if("("===i)n++;else if(")"===i)n--;else if("["===i)r++;else if("]"===i)r--;else if("\\"===i){let i=a+1;for(;i<e.length&&/[A-Za-z]/u.test(e[i]);)i++;if("mid"===e.slice(a+1,i)&&0===t&&0===n&&0===r)return{start:a,end:i};a=Math.max(i,a+2);continue}else if("|"===i&&0===t&&0===n&&0===r){let t=e.slice(a+1).trim();if(/^(?:[+\-:/*]|\\(?:cdot|times|div)\b)/u.test(t))return{start:a,end:a+1}}if(t<0||n<0||r<0)break;a++}return null}(t);return n?{equation:t.slice(0,n.start).trim(),operation:t.slice(n.end).trim()}:{equation:t,operation:null}}function v(e){return b(e).equation}function y(e){let t=x(e);for(;;){let e=/^(?:⇒|⟹|→|⟶|=>|->|\\(?:Rarr|to|rightarrow|longrightarrow|Rightarrow|Longrightarrow|implies)\b)\s*/u.exec(t);if(!e)return t;t=t.slice(e[0].length).trim()}}function w(e){let t=0,n=0,r=0,a=-1;for(let i=0;i<e.length;i++){let l=e[i];if("\\"===l){for(i++;i+1<e.length&&/[A-Za-z]/u.test(e[i+1]);)i++;continue}if("{"===l)t++;else if("}"===l)t--;else if("("===l)n++;else if(")"===l)n--;else if("["===l)r++;else if("]"===l)r--;else if("="===l&&0===t&&0===n&&0===r){if(a>=0)return null;a=i}if(t<0||n<0||r<0)return null}return 0===t&&0===n&&0===r&&a>=0?a:null}function M(e){let t=b(e).equation.replace(/&/gu,"").trim();if(!t||t.length>1024)return null;let n=0,r=0,a=0,i=[];for(let e=0;e<t.length;e++){let l=t[e];if("\\"===l){for(e++;e+1<t.length&&/[A-Za-z]/u.test(t[e+1]);)e++;continue}if("{"===l?n++:"}"===l?n--:"("===l?r++:")"===l?r--:"["===l?a++:"]"===l?a--:"="===l&&0===n&&0===r&&0===a&&i.push(e),n<0||r<0||a<0)return null}if(0!==n||0!==r||0!==a||1!==i.length)return null;let l=i[0],o=g(t.slice(0,l)),s=g(t.slice(l+1));return o&&s?{left:o,right:s}:null}function k(e,t){if(!e||e.length>4096)return null;try{let n=String(t.run(e)??"").trim();if(!n||/^Stop:/u.test(n))return null;return n}catch(e){return null}}function S(e,t,n){let r=k("simplify(rationalize(("+e+")-("+t+")))",n);return null===r?null:C(r)}function A(e){return i.test(e)}function C(e){return/^[+-]?0+(?:\.0+)?$/u.test(e)}function _(e){if(!A(e))return null;let t=e.split("/"),n=Number(t[0]),r=t.length>1?Number(t[1]):1;return isFinite(n)&&isFinite(r)&&0!==r?n/r:null}function R(e,t){let n=t.operand.cas;return"add"===t.kind?"(("+e+")+("+n+"))":"subtract"===t.kind?"(("+e+")-("+n+"))":"multiply"===t.kind?"(("+e+")*("+n+"))":"(("+e+")/("+n+"))"}function T(e){let t=new Set;for(let n of e)for(let e of n.match(l)||[])if("sqrt"!==e&&"pi"!==e&&"e"!==e)if(e.includes("_")||1===e.length)t.add(e);else for(let n of e)t.add(n);return Array.from(t).sort()}function E(e,t,n){let r="(("+e.left.cas+")-("+e.right.cas+"))";if(!t){let e=k("simplify(rationalize("+r+"))",n);return null!==e&&A(e)?C(e)?{kind:"identity"}:{kind:"contradiction"}:null}let a=k("expand("+r+")",n);if(null===a)return null;let i=k("simplify(coeff("+a+","+t+",1))",n),l=k("simplify(coeff("+a+","+t+",0))",n);if(null===i||null===l||!A(i)||!A(l))return null;let o=k("simplify(rationalize(("+a+")-(("+i+")*"+t+"+("+l+"))))",n);if(null===o||!C(o))return null;if(C(i))return C(l)?{kind:"identity"}:{kind:"contradiction"};let s=k("simplify(-("+l+")/("+i+"))",n);return null!==s&&A(s)?{kind:"root",root:s}:null}function L(e,t,n){if(e.left.domainRisk||e.right.domainRisk||t.left.domainRisk||t.right.domainRisk)return null;let r=T([e.left.cas,e.right.cas,t.left.cas,t.right.cas]);if(r.length>1)return null;let a=r[0]||null,i=E(e,a,n),l=E(t,a,n);return i&&l?i.kind===l.kind&&("root"!==i.kind||"root"!==l.kind||S(i.root,l.root,n)):null}function z(e,t,n=0,r={}){let a=String(e||"").trim(),i=String(t||"").trim(),l=b(a),s=M(l.equation);if(!l.operation&&function(e){let t=x(e),n=w(t);if(null===n)return!1;let r=0,a=0,i=0;for(let e=n+1;e<t.length;){let n=t[e];if("\\"===n){let n=e+1;for(;n<t.length&&/[A-Za-z]/u.test(t[n]);)n++;let l=t.slice(e+1,n);if(0===r&&0===a&&0===i&&"div"===l&&t.slice(n).trim())return!0;e=Math.max(n,e+2);continue}if("{"===n)r++;else if("}"===n)r--;else if("("===n)a++;else if(")"===n)a--;else if("["===n)i++;else if("]"===n)i--;else if(0===r&&0===a&&0===i&&(":"===n||"÷"===n)&&t.slice(e+1).trim())return!0;if(r<0||a<0||i<0)break;e++}return!1}(a))return d(a,i,n,"unknown","unsupported-or-unproven","ocr.plus.validation.unknown");let u=M(i),c=s?function(e,t=!1){let n=y(e).replace(/&/gu,"").trim(),r=w(n);if(null===r)return null;let a=n.slice(0,r).replace(/\s/gu,""),i=/^([A-Za-z])_\{(1,2|12|1\/2)\}$/u.exec(a);if(!i)return null;let l="1/2"===i[2],o=n.slice(r+1).trim(),s=!1;if(o.startsWith("±"))o=o.slice(1).trim(),s=!0;else if(/^\\pm(?![A-Za-z])/u.test(o))o=o.slice(3).trim(),s=!0;else if(l||!t)return null;if(o.startsWith("\\sqrt")){let e=5;for(;e<o.length&&/\s/u.test(o[e]);)e++;let t="";if("{"===o[e]){let n=p(o,e,"{","}");if(!n||o.slice(n.end).trim())return null;t=n.content}else{let n=/^([0-9])\s*$/u.exec(o.slice(e));if(!n)return null;t=n[1]}let n=g(t);return n?{kind:"radical",variable:i[1],radicand:n,hasPlusMinus:s}:null}if(!s)return null;let u=function(e){let t=String(e||"").trim();if(!t.startsWith("\\frac"))return null;let n=5;for(;n<t.length&&/\s/u.test(t[n]);)n++;let r=p(t,n,"{","}");if(!r)return null;for(n=r.end;n<t.length&&/\s/u.test(t[n]);)n++;let a=p(t,n,"{","}");if(!a||t.slice(a.end).trim())return null;let i=e=>{let t=e.trim();if(!t.startsWith("\\sqrt"))return null;let n=5;for(;n<t.length&&/\s/u.test(t[n]);)n++;let r=p(t,n,"{","}");return!r||t.slice(r.end).trim()?null:g(r.content)},l=i(r.content);if(l){let e=g(a.content);return e?{kind:"radical-numerator",radicand:l,denominator:e}:null}let o=i(a.content);if(!o)return null;let s=g(r.content);return s?{kind:"radical-denominator",numerator:s,radicand:o}:null}(o),c=g(o);return c?{kind:"magnitude",variable:i[1],magnitude:c,principalRadicalRatio:u,hasPlusMinus:!0}:null}(i,!0):null,h=s&&!l.operation?function(e){let t=y(e).replace(/&/gu,"").trim(),n=w(t);if(null===n)return null;let r=t.slice(0,n).replace(/\s/gu,""),a=/^([A-Za-z])$/u.exec(r);if(!a)return null;let i=t.slice(n+1).trim();if(!i.startsWith("\\sqrt"))return null;let l=5;for(;l<i.length&&/\s/u.test(i[l]);)l++;let o=p(i,l,"[","]");if(!o||"3"!==o.content.replace(/\s/gu,""))return null;for(l=o.end;l<i.length&&/\s/u.test(i[l]);)l++;let s=p(i,l,"{","}");if(!s||i.slice(s.end).trim())return null;let u=g(s.content);return u?{variable:a[1],radicand:u}:null}(i):null,m=s&&!l.operation?function(e){let t=y(e).replace(/&/gu,"").trim(),n=w(t);if(null===n)return null;let r=t.slice(0,n).replace(/\s/gu,""),a=/^([A-Za-z])_\{1,2\}$/u.exec(r);if(!a)return null;let i=t.slice(n+1).trim(),l=!1;if(i.startsWith("±")?(i=i.slice(1).trim(),l=!0):/^\\pm(?![A-Za-z])/u.test(i)&&(i=i.slice(3).trim(),l=!0),!i.startsWith("\\sqrt"))return null;let o=5;for(;o<i.length&&/\s/u.test(i[o]);)o++;let s=p(i,o,"[","]");if(!s||"4"!==s.content.replace(/\s/gu,""))return null;for(o=s.end;o<i.length&&/\s/u.test(i[o]);)o++;let u=p(i,o,"{","}");if(!u||i.slice(u.end).trim())return null;let c=g(u.content);return c?{variable:a[1],radicand:c,hasPlusMinus:l}:null}(i):null;if(!s||!u&&!c&&!h&&!m)return d(a,i,n,"unknown","unsupported-or-unproven","ocr.plus.validation.unknown");let v=o();if(!v)return d(a,i,n,"unknown","cas-unavailable","ocr.plus.validation.casUnavailable");let E=function(e){let t,n;if(!e)return null;let r=e.trim();if(r.startsWith("\\cdot"))t="multiply",n=r.slice(5);else if(r.startsWith("\\times"))t="multiply",n=r.slice(6);else if(r.startsWith("\\div"))t="divide",n=r.slice(4);else{let e=r[0];if("+"===e)t="add";else if("-"===e)t="subtract";else if("*"===e||"×"===e||"·"===e)t="multiply";else{if("/"!==e&&":"!==e&&"÷"!==e)return null;t="divide"}n=r.slice(1)}let a=g(n.trim());return a?{kind:t,operand:a,source:r}:null}(l.operation);if(r.strictDeclaredOperations&&l.operation&&!E||r.strictDeclaredOperations&&l.operation&&(c||h||m))return d(a,i,n,"unknown","unsupported-or-unproven","ocr.plus.validation.unknown",{operation:l.operation});if(c){let e=function(e,t,n){let r=("radical"===t.kind?t.radicand:t.magnitude).domainRisk&&("radical"===t.kind||null===t.principalRadicalRatio);if(e.left.domainRisk||e.right.domainRisk||r)return null;let a=T([e.left.cas,e.right.cas]);if(1!==a.length||!/^[A-Za-z]$/u.test(a[0]))return null;let i=a[0];if(t.variable!==i)return null;let l=i+"^2",o=S(e.left.cas,l,n),s=S(e.right.cas,l,n);if(o===s||!0!==o&&!0!==s)return null;let u=!0===o?e.right:e.left;if(T([u.cas]).length)return null;let c=k("simplify(rationalize("+u.cas+"))",n),d=null===c?null:_(c);if(null===d||d<0)return null;if("radical"===t.kind)return S(u.cas,t.radicand.cas,n);if(T([t.magnitude.cas]).length)return null;if(t.principalRadicalRatio){let e=t.principalRadicalRatio;if("radical-numerator"===e.kind){if(e.radicand.domainRisk||e.denominator.domainRisk||T([e.radicand.cas,e.denominator.cas]).length)return null;let t=k("simplify(rationalize("+e.radicand.cas+"))",n),r=null===t?null:_(t),a=k("simplify(rationalize("+e.denominator.cas+"))",n),i=null===a?null:_(a);if(null===r||r<0||null===i||i<=0)return null}else{if(e.numerator.domainRisk||e.radicand.domainRisk||T([e.numerator.cas,e.radicand.cas]).length)return null;let t=k("simplify(rationalize("+e.numerator.cas+"))",n),r=null===t?null:_(t),a=k("simplify(rationalize("+e.radicand.cas+"))",n),i=null===a?null:_(a);if(null===r||r<0||null===i||i<=0)return null}}else{let e=k("simplify(rationalize("+t.magnitude.cas+"))",n),r=null===e?null:_(e);if(null===r||r<0)return null}return S(u.cas,"(("+t.magnitude.cas+")^2)",n)}(s,c,v);return!0===e&&c.hasPlusMinus?d(a,i,n,"valid","quadratic-root-solutions","ocr.plus.validation.validRoots"):!0===e?d(a,i,n,"unknown","missing-plus-minus","ocr.plus.validation.missingPlusMinus"):d(a,i,n,"unknown","unsupported-or-unproven","ocr.plus.validation.unknown")}if(h)return!0===function(e,t,n){if(e.left.domainRisk||e.right.domainRisk||t.radicand.domainRisk)return null;let r=T([e.left.cas,e.right.cas]);if(1!==r.length||!/^[A-Za-z]$/u.test(r[0]))return null;let a=r[0];if(t.variable!==a)return null;let i=a+"^3",l=S(e.left.cas,i,n),o=S(e.right.cas,i,n);if(l===o||!0!==l&&!0!==o)return null;let s=!0===l?e.right:e.left;if(T([s.cas,t.radicand.cas]).length)return null;let u=k("simplify(rationalize("+s.cas+"))",n);return null===u||null===_(u)?null:S(s.cas,t.radicand.cas,n)}(s,h,v)?d(a,i,n,"valid","cubic-root-solution","ocr.plus.validation.validCubeRoot"):d(a,i,n,"unknown","unsupported-or-unproven","ocr.plus.validation.unknown");if(m){let e=function(e,t,n){if(e.left.domainRisk||e.right.domainRisk||t.radicand.domainRisk)return null;let r=T([e.left.cas,e.right.cas]);if(1!==r.length||!/^[A-Za-z]$/u.test(r[0]))return null;let a=r[0];if(t.variable!==a)return null;let i=a+"^4",l=S(e.left.cas,i,n),o=S(e.right.cas,i,n);if(l===o||!0!==l&&!0!==o)return null;let s=!0===l?e.right:e.left;if(T([s.cas,t.radicand.cas]).length)return null;let u=k("simplify(rationalize("+s.cas+"))",n),c=null===u?null:_(u);return null===c||c<0?null:S(s.cas,t.radicand.cas,n)}(s,m,v);return!0===e&&m.hasPlusMinus?d(a,i,n,"valid","quartic-root-solutions","ocr.plus.validation.validFourthRoot"):!0===e?d(a,i,n,"unknown","missing-plus-minus","ocr.plus.validation.missingPlusMinus"):d(a,i,n,"unknown","unsupported-or-unproven","ocr.plus.validation.unknown")}if(!u)return d(a,i,n,"unknown","unsupported-or-unproven","ocr.plus.validation.unknown");if(E){if(f(s.left,r)||f(s.right,r)||f(u.left,r)||f(u.right,r)||!function(e,t,n){if(f(e.operand,t))return!1;if("add"===e.kind||"subtract"===e.kind)return!0;let r=k("simplify("+e.operand.cas+")",n);return null!==r&&(A(r)?!C(r):!!/^[A-Za-z][A-Za-z0-9_]*$/u.test(r)&&(t.nonZeroSymbols||[]).some(e=>e===r))}(E,r,v))return d(a,i,n,"unknown","domain-uncertain","ocr.plus.validation.unknownDomain",{operation:E.source});let e=S(R(s.left.cas,E),u.left.cas,v),t=S(R(s.right.cas,E),u.right.cas,v);if(!0===e&&!0===t)return d(a,i,n,"valid","operation-applied-both-sides","ocr.plus.validation.validOperation",{operation:E.source});if(!1===e&&!0===t)return d(a,i,n,"invalid","operation-missing-left","ocr.plus.validation.invalidLeft",{side:"left",operation:E.source});if(!0===e&&!1===t)return d(a,i,n,"invalid","operation-missing-right","ocr.plus.validation.invalidRight",{side:"right",operation:E.source});if(r.strictDeclaredOperations)return!1===e&&!1===t?d(a,i,n,"invalid","operation-mismatch-both","ocr.plus.validation.invalidBoth",{side:"both",operation:E.source}):d(a,i,n,"unknown","unsupported-or-unproven","ocr.plus.validation.unknown",{operation:E.source});let l=L(s,u,v);if(!1===l&&!1===e&&!1===t)return d(a,i,n,"invalid","operation-mismatch-both","ocr.plus.validation.invalidBoth",{side:"both",operation:E.source});if(!0===l)return d(a,i,n,"valid","equivalent-linear-equations","ocr.plus.validation.validEquivalent",{operation:E.source})}if(f(s.left,r)||f(s.right,r)||f(u.left,r)||f(u.right,r))return d(a,i,n,"unknown","domain-uncertain","ocr.plus.validation.unknownDomain",l.operation?{operation:l.operation}:{});let O=L(s,u,v);return!0===O?d(a,i,n,"valid","equivalent-linear-equations","ocr.plus.validation.validEquivalent",l.operation?{operation:l.operation}:{}):!1===O?d(a,i,n,"invalid","different-linear-solutions","ocr.plus.validation.invalidEquivalent",l.operation?{operation:l.operation}:{}):d(a,i,n,"unknown","unsupported-or-unproven","ocr.plus.validation.unknown",l.operation?{operation:l.operation}:{})}function O(e,t={}){let n=[];for(let r=0;r+1<e.length;r++)n.push(z(e[r],e[r+1],r,t));return n}let I=16384,q=new Set(["quadratic-root-solutions","cubic-root-solution","quartic-root-solutions"]);function P(e){let t=JSON.stringify(e.map(e=>String(e||"").trim()).filter(Boolean));return t.length<=I?t:""}function N(e,t,n,r,a){return{accepted:!1,outcome:t,lines:e,promptCheck:{status:"unknown",reason:"prompt-unproven"},transitionChecks:[],finalCheck:{status:"unknown",reason:"unsupported"},firstProblem:{stage:n,lineIndex:a,reason:r}}}function F(e,t,n={}){let r=function(e){if(Array.isArray(e)){if(!e.every(e=>"string"==typeof e)||e.reduce((e,t)=>e+String(t).length,0)>I)return null;let t=e.map(e=>String(e).trim());return t.some(e=>!e)?null:t}let t=String(e||"").trim();if(!t)return[];if(t.length>I)return null;if(t.startsWith("["))try{let e=JSON.parse(t);if(!Array.isArray(e)||!e.every(e=>"string"==typeof e))return null;let n=e.map(e=>e.trim());return n.some(e=>!e)?null:n}catch(e){return null}return t.includes("\\begin{aligned}")||t.includes("\\end{aligned}")?function(e){let t=x(e),n="\\begin{aligned}",r="\\end{aligned}";if(!t.startsWith(n)||!t.endsWith(r))return null;let a=t.slice(n.length,t.length-r.length),i=[],l="",o=0,s=0,u=0;for(let e=0;e<a.length;e++){let t=a[e];if("\\"===t&&"\\"===a[e+1]&&0===o&&0===s&&0===u){i.push(l.replace(/&/gu,"").trim()),l="",e++;continue}if("{"===t?o++:"}"===t?o--:"("===t?s++:")"===t?s--:"["===t?u++:"]"===t&&u--,o<0||s<0||u<0)return null;l+=t}return 0!==o||0!==s||0!==u?null:(i.push(l.replace(/&/gu,"").trim()),i)}(t):t.replace(/\r/gu,"").split("\n").map(e=>e.trim()).filter(Boolean)}(t);if(null===r)return N([],"unknown","prompt","invalid-format");if(r.length<2)return N(r,"incomplete","final","too-few-lines");if(r.length>32)return N(r,"incomplete","final","too-many-lines");let a=o();if(!a)return N(r,"unknown","prompt","cas-unavailable");let i=function(e,t,n){let r=M(e),a=M(b(t).equation);if(!r||!a)return{status:"unknown",reason:"prompt-unproven"};let i=T([r.left.cas,r.right.cas]);if(1!==i.length||!/^[A-Za-z]$/u.test(i[0]))return{status:"unknown",reason:"prompt-unproven"};let l=r.left.cas===a.left.cas&&r.right.cas===a.right.cas,o=r.left.cas===a.right.cas&&r.right.cas===a.left.cas;if(r.left.domainRisk||r.right.domainRisk||a.left.domainRisk||a.right.domainRisk)return l||o?{status:"valid",reason:"prompt-match"}:{status:"unknown",reason:"prompt-unproven"};let s=[S(r.left.cas,a.left.cas,n),S(r.right.cas,a.right.cas,n)],u=[S(r.left.cas,a.right.cas,n),S(r.right.cas,a.left.cas,n)];return s.every(e=>!0===e)||u.every(e=>!0===e)?{status:"valid",reason:"prompt-match"}:[...s,...u].some(e=>null===e)?{status:"unknown",reason:"prompt-unproven"}:{status:"invalid",reason:"prompt-mismatch"}}(e,r[0],a),l=O(r,{...n,strictDeclaredOperations:!0}),s=function(e,t,n,r){let a=n[n.length-1];if(a?.status==="valid"&&q.has(a.reason))return{status:"valid",reason:"solved-root-set"};let i=M(e),l=b(String(t[t.length-1]||"").trim()),o=l.operation?null:M(l.equation);if(!i||!o)return{status:"unknown",reason:"unsupported"};let s=T([i.left.cas,i.right.cas]);if(1!==s.length||!/^[A-Za-z]$/u.test(s[0]))return{status:"unknown",reason:"unsupported"};let u=s[0],c=[[o.left,o.right],[o.right,o.left]],d=!1;for(let[e,t]of c){if(!function(e,t){let n=e.cas.trim();for(;n.startsWith("(");){let e=p(n,0,"(",")");if(!e||e.end!==n.length)break;n=e.content.trim()}return n===t}(e,u)||t.domainRisk||T([t.cas]).length)continue;let n=k("simplify(rationalize("+t.cas+"))",r);if(null===n&&(d=!0),null!==n&&null!==_(n))return{status:"valid",reason:"solved-variable"}}return d?{status:"unknown",reason:"unsupported"}:{status:"incomplete",reason:"not-isolated"}}(e,r,l,a);if("valid"!==i.status)return{accepted:!1,outcome:"invalid"===i.status?"incorrect":"unknown",lines:r,promptCheck:i,transitionChecks:l,finalCheck:s,firstProblem:{stage:"prompt",lineIndex:0,reason:i.reason}};let u=l.findIndex(e=>"invalid"===e.status);if(u>=0)return{accepted:!1,outcome:"incorrect",lines:r,promptCheck:i,transitionChecks:l,finalCheck:s,firstProblem:{stage:"transition",lineIndex:u,reason:l[u].reason}};let c=l.findIndex(e=>"unknown"===e.status);return c>=0?{accepted:!1,outcome:"unknown",lines:r,promptCheck:i,transitionChecks:l,finalCheck:s,firstProblem:{stage:"transition",lineIndex:c,reason:l[c].reason}}:"valid"!==s.status?{accepted:!1,outcome:"incomplete"===s.status?"incomplete":"unknown",lines:r,promptCheck:i,transitionChecks:l,finalCheck:s,firstProblem:{stage:"final",lineIndex:r.length-1,reason:s.reason}}:{accepted:!0,outcome:"correct",lines:r,promptCheck:i,transitionChecks:l,finalCheck:s}}},{"@parcel/transformer-js/src/esmodule-helpers.js":"b0H7B"}],jUsUh:[function(e,t,n,r){var a=e("@parcel/transformer-js/src/esmodule-helpers.js");a.defineInteropFlag(n),a.export(n,"MAX_WRITTEN_ARITHMETIC_SUBMISSION_LENGTH",()=>u),a.export(n,"parseWrittenArithmeticPrompt",()=>d),a.export(n,"createExpectedWrittenArithmeticSubmission",()=>p),a.export(n,"serializeWrittenArithmeticSubmission",()=>h),a.export(n,"decodeWrittenArithmeticSubmission",()=>m),a.export(n,"composeWrittenArithmeticLatex",()=>g),a.export(n,"validateWrittenArithmeticSubmission",()=>x),a.export(n,"writtenArithmeticLayoutRowCount",()=>b);var i=e("./column-arithmetic.ts"),l=e("./column-subtraction.ts"),o=e("./column-multiplication.ts"),s=e("./column-division.ts");let u=Math.max(i.MAX_COLUMN_ADDITION_SUBMISSION_LENGTH,l.MAX_COLUMN_SUBTRACTION_SUBMISSION_LENGTH,o.MAX_COLUMN_MULTIPLICATION_SUBMISSION_LENGTH,s.MAX_COLUMN_DIVISION_SUBMISSION_LENGTH);function c(e){return"object"==typeof e&&null!==e&&!Array.isArray(e)}function d(e){return(0,i.parseColumnAdditionPrompt)(e)||(0,l.parseColumnSubtractionPrompt)(e)||(0,o.parseColumnMultiplicationPrompt)(e)||(0,s.parseColumnDivisionPrompt)(e)}function p(e){let t="string"==typeof e?d(e):e;if(!t)return null;switch(t.kind){case"column-addition":return(0,i.createExpectedColumnAdditionSubmission)(t);case"column-subtraction":return(0,l.createExpectedColumnSubtractionSubmission)(t);case"column-multiplication":return(0,o.createExpectedColumnMultiplicationSubmission)(t);case"column-division":return(0,s.createExpectedColumnDivisionSubmission)(t);default:return null}}function h(e){if(!c(e))return"";switch(e.kind){case"column-addition":return(0,i.serializeColumnAdditionSubmission)(e);case"column-subtraction":return(0,l.serializeColumnSubtractionSubmission)(e);case"column-multiplication":return(0,o.serializeColumnMultiplicationSubmission)(e);case"column-division":return(0,s.serializeColumnDivisionSubmission)(e);default:return""}}function m(e){let t;if("string"!=typeof e)return null;let n=e.trim();if(!n||n.length>u||"{"!==n[0])return null;try{t=JSON.parse(n)}catch(e){return null}if(!c(t)||"string"!=typeof t.kind)return null;switch(t.kind){case"column-addition":return(0,i.decodeColumnAdditionSubmission)(n);case"column-subtraction":return(0,l.decodeColumnSubtractionSubmission)(n);case"column-multiplication":return(0,o.decodeColumnMultiplicationSubmission)(n);case"column-division":return(0,s.decodeColumnDivisionSubmission)(n);default:return null}}function f(e){if("string"==typeof e)return m(e);let t=h(e);return t?m(t):null}function g(e){let t=f(e);if(!t)return"";switch(t.kind){case"column-addition":return(0,i.composeColumnAdditionLatex)(t);case"column-subtraction":return(0,l.composeColumnSubtractionLatex)(t);case"column-multiplication":return(0,o.composeColumnMultiplicationLatex)(t);case"column-division":return(0,s.composeColumnDivisionLatex)(t)}}function x(e,t){let n="string"==typeof e?d(e):e;if(!n)return{accepted:!1,outcome:"unknown",reason:"invalid-prompt"};let r="string"==typeof t?t:h(t);switch(n.kind){case"column-addition":return(0,i.validateColumnAdditionSubmission)(n,r);case"column-subtraction":return(0,l.validateColumnSubtractionSubmission)(n,r);case"column-multiplication":return(0,o.validateColumnMultiplicationSubmission)(n,r);case"column-division":return(0,s.validateColumnDivisionSubmission)(n,r);default:return{accepted:!1,outcome:"unknown",reason:"invalid-prompt"}}}function b(e){let t=f(e);if(!t)return 0;switch(t.kind){case"column-addition":case"column-subtraction":return t.layout.rows.length;case"column-multiplication":return t.partialProducts.length+2;case"column-division":return 2*t.steps.length+1}}},{"./column-arithmetic.ts":"ewiNe","./column-subtraction.ts":"7mdjG","./column-multiplication.ts":"luDfW","./column-division.ts":"cHQYJ","@parcel/transformer-js/src/esmodule-helpers.js":"b0H7B"}],ewiNe:[function(e,t,n,r){var a=e("@parcel/transformer-js/src/esmodule-helpers.js");a.defineInteropFlag(n),a.export(n,"COLUMN_ADDITION_SUBMISSION_VERSION",()=>i),a.export(n,"MAX_COLUMN_ADDITION_DIGITS",()=>l),a.export(n,"MAX_COLUMN_ADDITION_PROMPT_LENGTH",()=>o),a.export(n,"MAX_COLUMN_ADDITION_SUBMISSION_LENGTH",()=>s),a.export(n,"parseColumnAdditionPrompt",()=>b),a.export(n,"createColumnAdditionSubmission",()=>w),a.export(n,"createExpectedColumnAdditionSubmission",()=>M),a.export(n,"serializeColumnAdditionSubmission",()=>S),a.export(n,"decodeColumnAdditionSubmission",()=>A),a.export(n,"composeColumnAdditionLatex",()=>_),a.export(n,"validateColumnAdditionSubmission",()=>T);let i=1,l=256,o=1024,s=16384,u=/^\d+$/u,c=/^\d$/u,d=/^(\d+)\+(\d+)(?:=(\d+))?$/u;function p(e){return"object"==typeof e&&null!==e&&!Array.isArray(e)}function h(e,t){let n=Object.keys(e).sort(),r=Array.from(t).sort();return n.length===r.length&&n.every((e,t)=>e===r[t])}function m(e,t){if("string"!=typeof e)return null;let n=e.trim();return n&&!(n.length>t)&&u.test(n)?n.replace(/^0+(?=\d)/u,""):null}function f(e,t){if("string"!=typeof e)return null;let n=m(e,t);return n===e?n:null}function g(e,t){let n=e.length-t-1;return n<0?0:e.charCodeAt(n)-48}function x(e,t){let n=Math.max(e.length,t.length),r=[],a=[],i=0;for(let l=0;l<n;l++){a.push(i?"1":null);let n=g(e,l)+g(t,l)+i;r.push(String.fromCharCode(48+n%10)),i=+(n>=10)}return i&&(a.push("1"),r.push("1")),{result:r.reverse().join("")||"0",carries:a}}function b(e){let t=function(e){if("string"!=typeof e)return null;let t=e.trim();if(!t||t.length>o||/[\r\n]/u.test(t))return null;let n=function(e){let t=e.trim();if(t.startsWith("$$")||t.endsWith("$$")){if(!(t.startsWith("$$")&&t.endsWith("$$")&&t.length>4))return null;t=t.slice(2,-2).trim()}else if(t.startsWith("$")||t.endsWith("$")){if(!(t.startsWith("$")&&t.endsWith("$")&&t.length>2))return null;t=t.slice(1,-1).trim()}else if(t.startsWith("\\(")||t.endsWith("\\)")){if(!(t.startsWith("\\(")&&t.endsWith("\\)")))return null;t=t.slice(2,-2).trim()}else if(t.startsWith("\\[")||t.endsWith("\\]")){if(!(t.startsWith("\\[")&&t.endsWith("\\]")))return null;t=t.slice(2,-2).trim()}return t}(t);return null===n||!function(e){let t=0;for(let n of e)if("{"===n)t++;else if("}"===n&&--t<0)return!1;return 0===t}(t=n.replace(/\\(?:left|right)\b/gu,"").replace(/\\(?:quad|qquad|enspace|thinspace|medspace|thickspace)\b/gu,"").replace(/\\[,;!:>]/gu,"").replace(/\\[ \t]/gu,"").replace(/[\s~]/gu,""))?null:t=t.replace(/[{}]/gu,"")}(e);if(!t)return null;let n=d.exec(t);if(!n)return null;let r=m(n[1],l),a=m(n[2],l),i=void 0===n[3]?null:m(n[3],l+1);return null===r||null===a||void 0!==n[3]&&null===i?null:{kind:"column-addition",operands:[r,a],authoredResult:i,expectedResult:x(r,a).result}}function v(e){if("string"==typeof e)return b(e);if(!p(e)||!h(e,["kind","operands","authoredResult","expectedResult"])||"column-addition"!==e.kind||!Array.isArray(e.operands)||2!==e.operands.length)return null;let t=f(e.operands[0],l),n=f(e.operands[1],l),r=null===e.authoredResult?null:f(e.authoredResult,l+1),a=f(e.expectedResult,l+1);return null===t||null===n||null!==e.authoredResult&&null===r||null===a||a!==x(t,n).result?null:{kind:"column-addition",operands:[t,n],authoredResult:r,expectedResult:a}}function y(e,t){let n=Array(t).fill(null),r=t-e.length;for(let t=0;t<e.length;t++)n[r+t]=e[t];return n}function w(e){var t,n,r;let a;if(!p(e)||!Array.isArray(e.operands)||2!==e.operands.length)return null;let o=m(e.operands[0],l),s=m(e.operands[1],l),u=m(e.result,l+1);if(null===o||null===s||null===u)return null;let d=Math.max(o.length,s.length,u.length),h=void 0===e.carries?[]:e.carries;if(!Array.isArray(h)||h.length>d)return null;let f=[];for(let e of h)if(null===e)f.push(null);else{if(!("string"==typeof e&&c.test(e.trim())))return null;f.push(e.trim())}for(;f.length<d;)f.push(null);let g=[o,s];return{kind:"column-addition",version:i,operands:g,result:u,carries:f,layout:(t=g,n=u,r=f,{columns:a=Math.max(t[0].length,t[1].length,n.length),rows:[{role:"first-operand",operator:"",cells:y(t[0],a)},{role:"second-operand",operator:"+",cells:y(t[1],a)},{role:"carries",operator:"",cells:Array.from(r).reverse()},{role:"result",operator:"",cells:y(n,a)}],rules:[{kind:"horizontal",afterRow:2}]})}}function M(e){let t=v(e);if(!t||null!==t.authoredResult&&t.authoredResult!==t.expectedResult)return null;let n=x(t.operands[0],t.operands[1]);return w({operands:t.operands,result:n.result,carries:n.carries})}function k(e){if(!p(e)||!h(e,["kind","version","operands","result","carries","layout"])||"column-addition"!==e.kind||e.version!==i||!Array.isArray(e.operands)||2!==e.operands.length||!Array.isArray(e.carries))return null;let t=f(e.operands[0],l),n=f(e.operands[1],l),r=f(e.result,l+1);if(null===t||null===n||null===r)return null;let a=Math.max(t.length,n.length,r.length);if(e.carries.length!==a||!e.carries.every(e=>null===e||"string"==typeof e&&c.test(e)))return null;let o=w({operands:[t,n],result:r,carries:e.carries});return o&&function(e,t){if(!p(e)||!h(e,["columns","rows","rules"])||e.columns!==t.columns||!Array.isArray(e.rows)||e.rows.length!==t.rows.length||!Array.isArray(e.rules)||1!==e.rules.length)return!1;for(let n=0;n<t.rows.length;n++){let r=e.rows[n],a=t.rows[n];if(!p(r)||!h(r,["role","operator","cells"])||r.role!==a.role||r.operator!==a.operator||!Array.isArray(r.cells)||!function(e,t){return e.length===t.length&&e.every((e,n)=>e===t[n])}(r.cells,a.cells))return!1}let n=e.rules[0];return p(n)&&h(n,["kind","afterRow"])&&"horizontal"===n.kind&&2===n.afterRow}(e.layout,o.layout)?o:null}function S(e){let t=k(e);if(!t)return"";try{let e=JSON.stringify(t);return e.length<=s?e:""}catch(e){return""}}function A(e){if("string"!=typeof e)return null;let t=e.trim();if(!t||t.length>s||"{"!==t[0])return null;try{return k(JSON.parse(t))}catch(e){return null}}function C(e){return"string"==typeof e?A(e):k(e)}function _(e){let t=C(e);if(!t)return"";let{layout:n}=t,r=Array(n.columns+1).fill("r").join(""),a=[];for(let e=0;e<n.rows.length;e++)a.push(function(e){let t=e.cells.map(t=>null===t?"":"carries"===e.role?`{\\scriptstyle ${t}}`:t);return[e.operator,...t].join(" & ").replace(/\s+$/u,"")}(n.rows[e])),e+1<n.rows.length&&a.push(n.rules.some(t=>t.afterRow===e)?String.raw` \\ \hline `:String.raw` \\ `);return`\\begin{array}{${r}} ${a.join("")} \\end{array}`}function R(e,t,n,r,a,i){return{accepted:e,outcome:t,reason:n,...void 0===i?{}:{carryColumn:i},...r?{expected:r}:{},...a?{submission:a}:{}}}function T(e,t){let n,r=v(e);if(!r)return R(!1,"unknown","invalid-prompt");if(null!==r.authoredResult&&r.authoredResult!==r.expectedResult)return R(!1,"unknown","prompt-result-mismatch");let a=M(r);if(!a)return R(!1,"unknown","invalid-prompt");let i=C(t);if(!i)return R(!1,"incorrect","invalid-format",a);if(i.operands[0]!==r.operands[0]||i.operands[1]!==r.operands[1])return R(!1,"incorrect","operand-mismatch",a,i);if(i.result!==a.result)return R(!1,"incorrect","result-mismatch",a,i);for(let e=0;e<a.carries.length;e++){let t=a.carries[e],r=i.carries[e];if(r!==t){if(null!==t&&null===r){void 0===n&&(n=e);continue}return R(!1,"incorrect","carry-mismatch",a,i,e)}}return void 0!==n?R(!1,"incomplete","missing-carry",a,i,n):R(!0,"correct","valid",a,i)}},{"@parcel/transformer-js/src/esmodule-helpers.js":"b0H7B"}],"7mdjG":[function(e,t,n,r){var a=e("@parcel/transformer-js/src/esmodule-helpers.js");a.defineInteropFlag(n),a.export(n,"COLUMN_SUBTRACTION_SUBMISSION_VERSION",()=>i),a.export(n,"MAX_COLUMN_SUBTRACTION_DIGITS",()=>l),a.export(n,"MAX_COLUMN_SUBTRACTION_PROMPT_LENGTH",()=>o),a.export(n,"MAX_COLUMN_SUBTRACTION_SUBMISSION_LENGTH",()=>s),a.export(n,"parseColumnSubtractionPrompt",()=>v),a.export(n,"createColumnSubtractionSubmission",()=>M),a.export(n,"createExpectedColumnSubtractionSubmission",()=>k),a.export(n,"serializeColumnSubtractionSubmission",()=>A),a.export(n,"decodeColumnSubtractionSubmission",()=>C),a.export(n,"composeColumnSubtractionLatex",()=>R),a.export(n,"validateColumnSubtractionSubmission",()=>E);let i=1,l=256,o=1024,s=16384,u=/^\d+$/u,c=/^\d$/u,d=/^(\d+)-(\d+)(?:=(\d+))?$/u;function p(e){return"object"==typeof e&&null!==e&&!Array.isArray(e)}function h(e,t){let n=Object.keys(e).sort(),r=Array.from(t).sort();return n.length===r.length&&n.every((e,t)=>e===r[t])}function m(e,t){if("string"!=typeof e)return null;let n=e.trim();return n&&!(n.length>t)&&u.test(n)?n.replace(/^0+(?=\d)/u,""):null}function f(e,t){if("string"!=typeof e)return null;let n=m(e,t);return n===e?n:null}function g(e,t){return e.length!==t.length?e.length<t.length?-1:1:e===t?0:e<t?-1:1}function x(e,t){let n=e.length-t-1;return n<0?0:e.charCodeAt(n)-48}function b(e,t){if(0>g(e,t))return null;let n=[],r=[],a=0;for(let i=0;i<e.length;i++){r.push(a?"1":null);let l=x(e,i),o=x(t,i)+a;l<o?(n.push(String.fromCharCode(48+l+10-o)),a=1):(n.push(String.fromCharCode(48+l-o)),a=0)}return a?null:{result:n.reverse().join("").replace(/^0+(?=\d)/u,"")||"0",borrows:r}}function v(e){let t=function(e){if("string"!=typeof e)return null;let t=e.trim();if(!t||t.length>o||/[\r\n]/u.test(t))return null;let n=function(e){let t=e.trim();if(t.startsWith("$$")||t.endsWith("$$")){if(!(t.startsWith("$$")&&t.endsWith("$$")&&t.length>4))return null;t=t.slice(2,-2).trim()}else if(t.startsWith("$")||t.endsWith("$")){if(!(t.startsWith("$")&&t.endsWith("$")&&t.length>2))return null;t=t.slice(1,-1).trim()}else if(t.startsWith("\\(")||t.endsWith("\\)")){if(!(t.startsWith("\\(")&&t.endsWith("\\)")))return null;t=t.slice(2,-2).trim()}else if(t.startsWith("\\[")||t.endsWith("\\]")){if(!(t.startsWith("\\[")&&t.endsWith("\\]")))return null;t=t.slice(2,-2).trim()}return t}(t);return null===n||!function(e){let t=0;for(let n of e)if("{"===n)t++;else if("}"===n&&--t<0)return!1;return 0===t}(t=n.replace(/\\(?:left|right)\b/gu,"").replace(/\\(?:quad|qquad|enspace|thinspace|medspace|thickspace)\b/gu,"").replace(/\\[,;!:>]/gu,"").replace(/\\[ \t]/gu,"").replace(/[\s~]/gu,"").replace(/\u2212/gu,"-"))?null:t.replace(/[{}]/gu,"")}(e);if(!t)return null;let n=d.exec(t);if(!n)return null;let r=m(n[1],l),a=m(n[2],l),i=void 0===n[3]?null:m(n[3],l);if(null===r||null===a||void 0!==n[3]&&null===i)return null;let s=b(r,a);return s?{kind:"column-subtraction",operands:[r,a],authoredResult:i,expectedResult:s.result}:null}function y(e){if("string"==typeof e)return v(e);if(!p(e)||!h(e,["kind","operands","authoredResult","expectedResult"])||"column-subtraction"!==e.kind||!Array.isArray(e.operands)||2!==e.operands.length)return null;let t=f(e.operands[0],l),n=f(e.operands[1],l),r=null===e.authoredResult?null:f(e.authoredResult,l),a=f(e.expectedResult,l);if(null===t||null===n||null!==e.authoredResult&&null===r||null===a)return null;let i=b(t,n);return i&&a===i.result?{kind:"column-subtraction",operands:[t,n],authoredResult:r,expectedResult:a}:null}function w(e,t){let n=Array(t).fill(null),r=t-e.length;for(let t=0;t<e.length;t++)n[r+t]=e[t];return n}function M(e){var t,n,r;let a,o,s,u,d;if(!p(e)||!Array.isArray(e.operands)||2!==e.operands.length)return null;let h=m(e.operands[0],l),f=m(e.operands[1],l),x=m(e.result,l);if(null===h||null===f||null===x||0>g(h,f))return null;let b=Math.max(h.length,f.length,x.length),v=void 0===e.borrows?[]:e.borrows;if(!Array.isArray(v)||v.length>b)return null;let y=[];for(let e of v)if(null===e)y.push(null);else{if(!("string"==typeof e&&c.test(e.trim())))return null;y.push(e.trim())}for(;y.length<b;)y.push(null);let M=[h,f];return{kind:"column-subtraction",version:i,operands:M,result:x,borrows:y,layout:(t=M,n=x,r=y,a=Math.max(t[0].length,t[1].length,n.length),o={role:"first-operand",operator:"",cells:w(t[0],a)},s={role:"second-operand",operator:"-",cells:w(t[1],a)},u={role:"result",operator:"",cells:w(n,a)},{columns:a,rows:(d=r.some(e=>null!==e))?[o,s,{role:"borrows",operator:"-",cells:Array.from(r).reverse()},u]:[o,s,u],rules:[{kind:"horizontal",afterRow:d?2:1}]})}}function k(e){let t=y(e);if(!t||null!==t.authoredResult&&t.authoredResult!==t.expectedResult)return null;let n=b(t.operands[0],t.operands[1]);return n?M({operands:t.operands,result:n.result,borrows:n.borrows}):null}function S(e){if(!p(e)||!h(e,["kind","version","operands","result","borrows","layout"])||"column-subtraction"!==e.kind||e.version!==i||!Array.isArray(e.operands)||2!==e.operands.length||!Array.isArray(e.borrows))return null;let t=f(e.operands[0],l),n=f(e.operands[1],l),r=f(e.result,l);if(null===t||null===n||null===r||0>g(t,n))return null;let a=Math.max(t.length,n.length,r.length);if(e.borrows.length!==a||!e.borrows.every(e=>null===e||"string"==typeof e&&c.test(e)))return null;let o=M({operands:[t,n],result:r,borrows:e.borrows});return o&&function(e,t){if(!p(e)||!h(e,["columns","rows","rules"])||e.columns!==t.columns||!Array.isArray(e.rows)||e.rows.length!==t.rows.length||!Array.isArray(e.rules)||1!==e.rules.length)return!1;for(let n=0;n<t.rows.length;n++){let r=e.rows[n],a=t.rows[n];if(!p(r)||!h(r,["role","operator","cells"])||r.role!==a.role||r.operator!==a.operator||!Array.isArray(r.cells)||!function(e,t){return e.length===t.length&&e.every((e,n)=>e===t[n])}(r.cells,a.cells))return!1}let n=e.rules[0];return p(n)&&h(n,["kind","afterRow"])&&"horizontal"===n.kind&&n.afterRow===t.rules[0].afterRow}(e.layout,o.layout)?o:null}function A(e){let t=S(e);if(!t)return"";try{let e=JSON.stringify(t);return e.length<=s?e:""}catch(e){return""}}function C(e){if("string"!=typeof e)return null;let t=e.trim();if(!t||t.length>s||"{"!==t[0])return null;try{return S(JSON.parse(t))}catch(e){return null}}function _(e){return"string"==typeof e?C(e):S(e)}function R(e){let t=_(e);if(!t)return"";let{layout:n}=t,r=Array(n.columns+1).fill("r").join(""),a=[];for(let e=0;e<n.rows.length;e++)a.push(function(e){let t=e.cells.map(t=>null===t?"":"borrows"===e.role?`{\\scriptstyle ${t}}`:t);return[e.operator,...t].join(" & ").replace(/\s+$/u,"")}(n.rows[e])),e+1<n.rows.length&&a.push(n.rules.some(t=>t.afterRow===e)?String.raw` \\ \hline `:String.raw` \\ `);return`\\begin{array}{${r}} ${a.join("")} \\end{array}`}function T(e,t,n,r,a,i){return{accepted:e,outcome:t,reason:n,...void 0===i?{}:{borrowColumn:i},...r?{expected:r}:{},...a?{submission:a}:{}}}function E(e,t){let n,r=y(e);if(!r)return T(!1,"unknown","invalid-prompt");if(null!==r.authoredResult&&r.authoredResult!==r.expectedResult)return T(!1,"unknown","prompt-result-mismatch");let a=k(r);if(!a)return T(!1,"unknown","invalid-prompt");let i=_(t);if(!i)return T(!1,"incorrect","invalid-format",a);if(i.operands[0]!==r.operands[0]||i.operands[1]!==r.operands[1])return T(!1,"incorrect","operand-mismatch",a,i);if(i.result!==a.result)return T(!1,"incorrect","result-mismatch",a,i);for(let e=0;e<a.borrows.length;e++){let t=a.borrows[e],r=i.borrows[e];if(r!==t){if(null!==t&&null===r){void 0===n&&(n=e);continue}return T(!1,"incorrect","borrow-mismatch",a,i,e)}}return void 0!==n?T(!1,"incomplete","missing-borrow",a,i,n):T(!0,"correct","valid",a,i)}},{"@parcel/transformer-js/src/esmodule-helpers.js":"b0H7B"}],luDfW:[function(e,t,n,r){var a=e("@parcel/transformer-js/src/esmodule-helpers.js");a.defineInteropFlag(n),a.export(n,"COLUMN_MULTIPLICATION_SUBMISSION_VERSION",()=>i),a.export(n,"MAX_COLUMN_MULTIPLICATION_DIGITS",()=>l),a.export(n,"MAX_COLUMN_MULTIPLICATION_PROMPT_LENGTH",()=>o),a.export(n,"MAX_COLUMN_MULTIPLICATION_PARTIAL_VALUE_DIGITS",()=>s),a.export(n,"MAX_COLUMN_MULTIPLICATION_SUBMISSION_LENGTH",()=>u),a.export(n,"parseColumnMultiplicationPrompt",()=>b),a.export(n,"createColumnMultiplicationSubmission",()=>w),a.export(n,"createExpectedColumnMultiplicationSubmission",()=>M),a.export(n,"serializeColumnMultiplicationSubmission",()=>S),a.export(n,"decodeColumnMultiplicationSubmission",()=>A),a.export(n,"composeColumnMultiplicationLatex",()=>_),a.export(n,"validateColumnMultiplicationSubmission",()=>T);let i=1,l=256,o=2048,s=512,u=262144,c=/^\d+$/u,d=/^(\d+)\*(\d+)(?:=(\d+))?$/u;function p(e){return"object"==typeof e&&null!==e&&!Array.isArray(e)}function h(e,t){let n=Object.keys(e).sort(),r=Array.from(t).sort();return n.length===r.length&&n.every((e,t)=>e===r[t])}function m(e,t){if("string"!=typeof e)return null;let n=e.trim();return n&&!(n.length>t)&&c.test(n)?n.replace(/^0+(?=\d)/u,""):null}function f(e,t){if("string"!=typeof e)return null;let n=m(e,t);return n===e?n:null}function g(e){if("string"!=typeof e)return null;let t=e.trim();return t&&t.length<=s&&c.test(t)?t:null}function x(e,t){if("0"===e||"0"===t)return"0";let n=Array(e.length+t.length).fill(0);for(let r=e.length-1;r>=0;r--){let a=e.charCodeAt(r)-48;for(let e=t.length-1;e>=0;e--){let i=t.charCodeAt(e)-48,l=r+e+1,o=a*i+n[l];n[l]=o%10,n[l-1]+=Math.floor(o/10)}}let r=0;for(;r<n.length-1&&0===n[r];)r++;return n.slice(r).join("")}function b(e){let t=function(e){if("string"!=typeof e)return null;let t=e.trim();if(!t||t.length>o||/[\r\n]/u.test(t))return null;let n=function(e){let t=e.trim();if(t.startsWith("$$")||t.endsWith("$$")){if(!(t.startsWith("$$")&&t.endsWith("$$")&&t.length>4))return null;t=t.slice(2,-2).trim()}else if(t.startsWith("$")||t.endsWith("$")){if(!(t.startsWith("$")&&t.endsWith("$")&&t.length>2))return null;t=t.slice(1,-1).trim()}else if(t.startsWith("\\(")||t.endsWith("\\)")){if(!(t.startsWith("\\(")&&t.endsWith("\\)")))return null;t=t.slice(2,-2).trim()}else if(t.startsWith("\\[")||t.endsWith("\\]")){if(!(t.startsWith("\\[")&&t.endsWith("\\]")))return null;t=t.slice(2,-2).trim()}return t}(t);return null===n||!function(e){let t=0;for(let n of e)if("{"===n)t++;else if("}"===n&&--t<0)return!1;return 0===t}(t=n.replace(/\\(?:left|right)\b/gu,"").replace(/\\(?:quad|qquad|enspace|thinspace|medspace|thickspace)\b/gu,"").replace(/\\[,;!:>]/gu,"").replace(/\\[ \t]/gu,"").replace(/\\(?:cdot|times)(?![A-Za-z])/gu,"*").replace(/[·⋅×]/gu,"*").replace(/[\s~]/gu,""))?null:t.replace(/[{}]/gu,"")}(e);if(!t)return null;let n=d.exec(t);if(!n)return null;let r=m(n[1],l),a=m(n[2],l),i=void 0===n[3]?null:m(n[3],s);return null===r||null===a||void 0!==n[3]&&null===i?null:{kind:"column-multiplication",operands:[r,a],authoredResult:i,expectedResult:x(r,a)}}function v(e){if("string"==typeof e)return b(e);if(!p(e)||!h(e,["kind","operands","authoredResult","expectedResult"])||"column-multiplication"!==e.kind||!Array.isArray(e.operands)||2!==e.operands.length)return null;let t=f(e.operands[0],l),n=f(e.operands[1],l),r=null===e.authoredResult?null:f(e.authoredResult,s),a=f(e.expectedResult,s);return null===t||null===n||null===a||null!==e.authoredResult&&null===r||a!==x(t,n)?null:{kind:"column-multiplication",operands:[t,n],authoredResult:r,expectedResult:a}}function y(e,t,n,r){if(n.length>e[0].length)return null;let a=[],o={};for(let t of n){let n=function(e,t,n){if(!p(e)||!h(e,["multiplicandColumn","shift","value"]))return null;let r=e.multiplicandColumn,a=e.shift,i=n?function(e){if("string"!=typeof e)return null;let t=g(e);return t===e?t:null}(e.value):g(e.value);return!Number.isInteger(r)||r<0||r>=t||!Number.isInteger(a)||a<0||a>=l||null===i?null:{multiplicandColumn:r,shift:a,value:i}}(t,e[0].length,r);if(!n||o[n.multiplicandColumn])return null;o[n.multiplicandColumn]=!0,a.push(n)}return{kind:"column-multiplication",version:i,operands:e,partialProducts:a,result:t}}function w(e){if(!p(e)||!Array.isArray(e.operands)||2!==e.operands.length)return null;let t=m(e.operands[0],l),n=m(e.operands[1],l),r=m(e.result,s),a=void 0===e.partialProducts?[]:e.partialProducts;return null!==t&&null!==n&&null!==r&&Array.isArray(a)?y([t,n],r,a,!1):null}function M(e){let t=v(e);if(!t||null!==t.authoredResult&&t.authoredResult!==t.expectedResult)return null;let[n,r]=t.operands,a=[];for(let e=0;e<n.length;e++){let t=n.length-e-1,i=x(n[e],r);a.push({multiplicandColumn:t,shift:t,value:`${i}${"0".repeat(t)}`})}return w({operands:t.operands,partialProducts:a,result:t.expectedResult})}function k(e){if(!p(e)||!h(e,["kind","version","operands","partialProducts","result"])||"column-multiplication"!==e.kind||e.version!==i||!Array.isArray(e.operands)||2!==e.operands.length||!Array.isArray(e.partialProducts))return null;let t=f(e.operands[0],l),n=f(e.operands[1],l),r=f(e.result,s);return null===t||null===n||null===r?null:y([t,n],r,e.partialProducts,!0)}function S(e){let t=k(e);if(!t)return"";try{let e=JSON.stringify(t);return e.length<=u?e:""}catch(e){return""}}function A(e){if("string"!=typeof e)return null;let t=e.trim();if(!t||t.length>u||"{"!==t[0])return null;try{return k(JSON.parse(t))}catch(e){return null}}function C(e){return"string"==typeof e?A(e):k(e)}function _(e){let t=C(e);if(!t)return"";let n=[`${t.operands[0]} \\cdot ${t.operands[1]}`,...t.partialProducts.map(e=>`+${e.value}`)];return`\\begin{array}{r} ${n.join(" \\\\ ")} \\\\ \\hline ${t.result} \\end{array}`}function R(e,t,n,r,a,i){return{accepted:e,outcome:t,reason:n,...void 0===i?{}:{partialProductColumn:i},...r?{expected:r}:{},...a?{submission:a}:{}}}function T(e,t){let n=v(e);if(!n)return R(!1,"unknown","invalid-prompt");if(null!==n.authoredResult&&n.authoredResult!==n.expectedResult)return R(!1,"unknown","prompt-result-mismatch");let r=M(n);if(!r)return R(!1,"unknown","invalid-prompt");let a=C(t);if(!a)return R(!1,"incorrect","invalid-format",r);if(a.operands[0]!==n.operands[0]||a.operands[1]!==n.operands[1])return R(!1,"incorrect","operand-mismatch",r,a);let i={};for(let e of a.partialProducts)i[e.multiplicandColumn]=e;for(let e of r.partialProducts)if(!i[e.multiplicandColumn])return R(!1,"incomplete","missing-partial-product",r,a,e.multiplicandColumn);for(let e=0;e<r.partialProducts.length;e++){let t=r.partialProducts[e],n=a.partialProducts[e];if(n.multiplicandColumn!==t.multiplicandColumn)return R(!1,"incorrect","partial-product-order-mismatch",r,a,t.multiplicandColumn);if(n.shift!==t.shift)return R(!1,"incorrect","shift-mismatch",r,a,t.multiplicandColumn);if(n.value!==t.value)return R(!1,"incorrect","partial-product-mismatch",r,a,t.multiplicandColumn)}return a.result!==r.result?R(!1,"incorrect","result-mismatch",r,a):R(!0,"correct","valid",r,a)}},{"@parcel/transformer-js/src/esmodule-helpers.js":"b0H7B"}],cHQYJ:[function(e,t,n,r){var a=e("@parcel/transformer-js/src/esmodule-helpers.js");a.defineInteropFlag(n),a.export(n,"COLUMN_DIVISION_SUBMISSION_VERSION",()=>i),a.export(n,"MAX_COLUMN_DIVISION_DIGITS",()=>l),a.export(n,"MAX_COLUMN_DIVISION_PROMPT_LENGTH",()=>o),a.export(n,"MAX_COLUMN_DIVISION_SUBMISSION_LENGTH",()=>s),a.export(n,"parseColumnDivisionPrompt",()=>y),a.export(n,"createColumnDivisionSubmission",()=>S),a.export(n,"createExpectedColumnDivisionSubmission",()=>C),a.export(n,"serializeColumnDivisionSubmission",()=>R),a.export(n,"decodeColumnDivisionSubmission",()=>T),a.export(n,"composeColumnDivisionLatex",()=>z),a.export(n,"validateColumnDivisionSubmission",()=>I);let i=1,l=128,o=1024,s=65536,u=/^\d+$/u,c=/^\d$/u,d=/^(\d+):(\d+)(?:=(\d+)(?:R(?:EST)?=?(\d+))?)?$/iu,p=["partialDividend","partialDividendStart","partialDividendEnd","quotientDigit","subtractedProduct","subtractedProductStart","remainder","remainderPosition","broughtDownDigit","broughtDownPosition"];function h(e){return"object"==typeof e&&null!==e&&!Array.isArray(e)}function m(e,t){let n=Object.keys(e).sort(),r=Array.from(t).sort();return n.length===r.length&&n.every((e,t)=>e===r[t])}function f(e,t){if("string"!=typeof e)return null;let n=e.trim();return n&&!(n.length>t)&&u.test(n)?n.replace(/^0+(?=\d)/u,""):null}function g(e,t){if("string"!=typeof e)return null;let n=f(e,t);return n===e?n:null}function x(e,t){return e.length!==t.length?e.length<t.length?-1:1:e===t?0:e<t?-1:1}function b(e,t){let n=[],r=0;for(let a=0;a<e.length;a++){let i=e.length-a-1,l=t.length-a-1,o=e.charCodeAt(i)-48-r;l>=0&&(o-=t.charCodeAt(l)-48),o<0?(o+=10,r=1):r=0,n.push(String.fromCharCode(48+o))}return n.reverse().join("").replace(/^0+(?=\d)/u,"")}function v(e,t){let n=0,r=e[0],a=f(r,l);for(;n+1<e.length&&0>x(a,t);)r+=e[++n],a=f(r,l);let i=[],o=[],s="0";for(;;){let u=function(e,t){let n=e,r=0;for(;x(n,t)>=0;)if(n=b(n,t),++r>9)throw Error("invalid long-division partial dividend");return{digit:String.fromCharCode(48+r),product:b(e,n),remainder:n}}(a,t);o.push(u.digit);let c=n-u.remainder.length+1,d=n+1<e.length?n+1:null,p=null===d?null:e[d];if(i.push({partialDividend:r,partialDividendStart:n-r.length+1,partialDividendEnd:n,quotientDigit:u.digit,subtractedProduct:u.product,subtractedProductStart:n-u.product.length+1,remainder:u.remainder,remainderPosition:c,broughtDownDigit:p,broughtDownPosition:d}),s=u.remainder,null===p||null===d)break;a=f(r=u.remainder+p,l),n=d}return{quotient:o.join("").replace(/^0+(?=\d)/u,""),remainder:s,steps:i}}function y(e){let t=function(e){if("string"!=typeof e)return null;let t=e.trim();if(!t||t.length>o||/[\r\n]/u.test(t))return null;let n=function(e){let t=e.trim();if(t.startsWith("$$")||t.endsWith("$$")){if(!(t.startsWith("$$")&&t.endsWith("$$")&&t.length>4))return null;t=t.slice(2,-2).trim()}else if(t.startsWith("$")||t.endsWith("$")){if(!(t.startsWith("$")&&t.endsWith("$")&&t.length>2))return null;t=t.slice(1,-1).trim()}else if(t.startsWith("\\(")||t.endsWith("\\)")){if(!(t.startsWith("\\(")&&t.endsWith("\\)")))return null;t=t.slice(2,-2).trim()}else if(t.startsWith("\\[")||t.endsWith("\\]")){if(!(t.startsWith("\\[")&&t.endsWith("\\]")))return null;t=t.slice(2,-2).trim()}return t}(t);return null===n||!function(e){let t=0;for(let n of e)if("{"===n)t++;else if("}"===n&&--t<0)return!1;return 0===t}(t=n.replace(/\\(?:operatorname|mathrm|text)\s*\{\s*(?:R|Rest)\s*\}/giu,"R").replace(/\\div\b/gu,":").replace(/\u00f7/gu,":").replace(/\\(?:left|right)\b/gu,"").replace(/\\(?:quad|qquad|enspace|thinspace|medspace|thickspace)\b/gu,"").replace(/\\[,;!:>]/gu,"").replace(/\\[ \t]/gu,"").replace(/[\s~]/gu,""))?null:t.replace(/[{}]/gu,"")}(e);if(!t)return null;let n=d.exec(t);if(!n)return null;let r=f(n[1],l),a=f(n[2],l),i=void 0===n[3]?null:f(n[3],l),s=void 0===n[4]?null:f(n[4],l);if(null===r||null===a||"0"===a||void 0!==n[3]&&null===i||void 0!==n[4]&&null===s)return null;let u=v(r,a);return{kind:"column-division",dividend:r,divisor:a,authoredQuotient:i,authoredRemainder:s,expectedQuotient:u.quotient,expectedRemainder:u.remainder}}function w(e){if("string"==typeof e)return y(e);if(!h(e)||!m(e,["kind","dividend","divisor","authoredQuotient","authoredRemainder","expectedQuotient","expectedRemainder"])||"column-division"!==e.kind)return null;let t=g(e.dividend,l),n=g(e.divisor,l),r=null===e.authoredQuotient?null:g(e.authoredQuotient,l),a=null===e.authoredRemainder?null:g(e.authoredRemainder,l),i=g(e.expectedQuotient,l),o=g(e.expectedRemainder,l);if(null===t||null===n||"0"===n||null!==e.authoredQuotient&&null===r||null!==e.authoredRemainder&&null===a||null===i||null===o)return null;let s=v(t,n);return s.quotient!==i||s.remainder!==o?null:{kind:"column-division",dividend:t,divisor:n,authoredQuotient:r,authoredRemainder:a,expectedQuotient:i,expectedRemainder:o}}function M(e,t){return"number"==typeof e&&Number.isInteger(e)&&e>=0&&e<t?e:null}function k(e,t,n){if(!h(e)||!m(e,p))return null;let r="string"==typeof e.partialDividend?e.partialDividend.trim():"",a=r.length<=l&&u.test(r)?r:null,i="string"==typeof e.quotientDigit?e.quotientDigit.trim():"",o=n?g(e.subtractedProduct,l):f(e.subtractedProduct,l),s=n?g(e.remainder,l):f(e.remainder,l),d=M(e.partialDividendStart,t),x=M(e.partialDividendEnd,t),b=M(e.subtractedProductStart,t),v=M(e.remainderPosition,t),y=null===e.broughtDownPosition?null:M(e.broughtDownPosition,t),w=null===e.broughtDownDigit?null:"string"==typeof e.broughtDownDigit&&c.test(e.broughtDownDigit.trim())?e.broughtDownDigit.trim():void 0;return null===a||!c.test(i)||null===o||null===s||null===d||null===x||null===b||null===v||void 0===w||null!==e.broughtDownPosition&&null===y||null===w!=(null===y)||d>x||n&&(r!==e.partialDividend||i!==e.quotientDigit||w!==e.broughtDownDigit)?null:{partialDividend:a,partialDividendStart:d,partialDividendEnd:x,quotientDigit:i,subtractedProduct:o,subtractedProductStart:b,remainder:s,remainderPosition:v,broughtDownDigit:w,broughtDownPosition:y}}function S(e){if(!h(e))return null;let t=f(e.dividend,l),n=f(e.divisor,l),r=f(e.quotient,l),a=void 0===e.remainder?null:e.remainder,o=null===a?null:f(a,l),s=void 0===e.steps?[]:e.steps;if(null===t||null===n||"0"===n||null===r||null!==a&&null===o||!Array.isArray(s)||s.length>t.length)return null;let u=[];for(let e of s){let n=k(e,t.length,!1);if(!n)return null;u.push(n)}return{kind:"column-division",version:i,dividend:t,divisor:n,quotient:r,remainder:o,steps:u}}function A(e){return(null===e.authoredQuotient||e.authoredQuotient===e.expectedQuotient)&&(null===e.authoredRemainder||e.authoredRemainder===e.expectedRemainder)}function C(e){let t=w(e);if(!t||!A(t))return null;let n=v(t.dividend,t.divisor);return S({dividend:t.dividend,divisor:t.divisor,quotient:n.quotient,remainder:"0"===n.remainder?null:n.remainder,steps:n.steps})}function _(e){if(!h(e)||!m(e,["kind","version","dividend","divisor","quotient","remainder","steps"])||"column-division"!==e.kind||e.version!==i||!Array.isArray(e.steps))return null;let t=g(e.dividend,l),n=g(e.divisor,l),r=g(e.quotient,l),a=null===e.remainder?null:g(e.remainder,l);if(null===t||null===n||"0"===n||null===r||null!==e.remainder&&null===a||e.steps.length>t.length)return null;let o=[];for(let n of e.steps){let e=k(n,t.length,!0);if(!e)return null;o.push(e)}return{kind:"column-division",version:i,dividend:t,divisor:n,quotient:r,remainder:a,steps:o}}function R(e){let t=_(e);if(!t)return"";try{let e=JSON.stringify(t);return e.length<=s?e:""}catch(e){return""}}function T(e){if("string"!=typeof e)return null;let t=e.trim();if(!t||t.length>s||"{"!==t[0])return null;try{return _(JSON.parse(t))}catch(e){return null}}function E(e){return"string"==typeof e?T(e):_(e)}function L(e){return e>0?`\\phantom{${"0".repeat(e)}}`:""}function z(e){let t=E(e);if(!t)return"";let n=t.dividend.length,r=`\\phantom{:${t.divisor}}`,a=null===t.remainder?"":`\\;\\mathrm{R}\\;${t.remainder}`,i=[`${t.dividend}:${t.divisor}&=${t.quotient}${a}`];for(let e of t.steps){var l;i.push(L(e.subtractedProductStart)+`\\underline{-${e.subtractedProduct}}`+L(n-e.subtractedProductStart-e.subtractedProduct.length)+r+"&");let t=e.remainder+(e.broughtDownDigit||"");i.push((l=e.remainderPosition,L(l)+t+L(n-l-t.length)+r+"&"))}return`\\begin{aligned} ${i.join(String.raw` \\ `)} \\end{aligned}`}function O(e,t,n,r,a,i,l){return{accepted:e,outcome:t,reason:n,...void 0===i?{}:{stepIndex:i},...void 0===l?{}:{stepField:l},...r?{expected:r}:{},...a?{submission:a}:{}}}function I(e,t){let n=w(e);if(!n)return O(!1,"unknown","invalid-prompt");if(!A(n))return O(!1,"unknown","prompt-result-mismatch");let r=C(n);if(!r)return O(!1,"unknown","invalid-prompt");let a=E(t);if(!a)return O(!1,"incorrect","invalid-format",r);if(a.dividend!==r.dividend||a.divisor!==r.divisor)return O(!1,"incorrect","operand-mismatch",r,a);if(a.quotient!==r.quotient)return O(!1,"incorrect","quotient-mismatch",r,a);let i=n.expectedRemainder;if("0"!==i&&null===a.remainder)return O(!1,"incomplete","missing-remainder",r,a);if(null!==a.remainder&&a.remainder!==i)return O(!1,"incorrect","remainder-mismatch",r,a);let l=Math.min(r.steps.length,a.steps.length);for(let e=0;e<l;e++){let t=function(e,t){return p.find(n=>e[n]!==t[n])}(r.steps[e],a.steps[e]);if(void 0!==t)return O(!1,"incorrect","step-mismatch",r,a,e,t)}return a.steps.length<r.steps.length?O(!1,"incomplete","missing-step",r,a,a.steps.length):a.steps.length>r.steps.length?O(!1,"incorrect","extra-step",r,a,r.steps.length):O(!0,"correct","valid",r,a)}},{"@parcel/transformer-js/src/esmodule-helpers.js":"b0H7B"}],jvdAp:[function(e,t,n,r){var a=e("@parcel/transformer-js/src/esmodule-helpers.js");a.defineInteropFlag(n),a.export(n,"CALCULATION_REVIEW_FREEZE_VERSION",()=>i),a.export(n,"MAX_CALCULATION_REVIEW_FREEZE_LINES",()=>l),a.export(n,"MAX_CALCULATION_REVIEW_FREEZE_CHARACTERS",()=>o),a.export(n,"sanitizeCalculationReviewFreezeState",()=>h);let i="cr1",l=32,o=16384,s=new Set(["valid","invalid","unknown"]),u=new Set(["running","ready","error"]),c=new Set(["left","right","both"]),d=new Set(["operation-applied-both-sides","operation-missing-left","operation-missing-right","operation-mismatch-both","equivalent-linear-equations","quadratic-root-solutions","quartic-root-solutions","cubic-root-solution","missing-plus-minus","different-linear-solutions","domain-uncertain","cas-unavailable","unsupported-or-unproven"]);function p(e){return!!e&&"object"==typeof e&&!Array.isArray(e)}function h(e){if(!p(e)||e.v!==i||"string"!=typeof e.state||!u.has(e.state)||!Array.isArray(e.checks)||void 0!==e.stale&&1!==e.stale)return null;let t=function(e){if(!Array.isArray(e)||e.length<1||e.length>l)return null;let t=[];for(let n of e){if("string"!=typeof n)return null;let e=n.replace(/\r/g,"").trim();if(!e||e.includes("\n"))return null;t.push(e)}return JSON.stringify(t).length>o?null:t}(e.lines);if(!t)return null;let n=e.state,r="ready"===n?t.length-1:0;if(e.checks.length!==r)return null;let a=[];for(let t of e.checks){let e=function(e){if(!p(e)||"string"!=typeof e.status||!s.has(e.status)||"string"!=typeof e.reason||!d.has(e.reason)||void 0!==e.side&&("string"!=typeof e.side||!c.has(e.side)))return null;let t={status:e.status,reason:e.reason};return void 0!==e.side&&(t.side=e.side),t}(t);if(!e)return null;a.push(e)}return{v:i,lines:t,state:n,checks:a,...1===e.stale?{stale:1}:{}}}},{"@parcel/transformer-js/src/esmodule-helpers.js":"b0H7B"}],bUAoc:[function(e,t,n,r){var a=e("@parcel/transformer-js/src/esmodule-helpers.js");a.defineInteropFlag(n),a.export(n,"ensureCanvasFreezeApi",()=>s.ensureCanvasFreezeApi),a.export(n,"canvasMarkup",()=>U),a.export(n,"initAll",()=>X);var i=e("../index"),l=e("./theme"),o=e("./store"),s=e("./freeze"),u=e("../lia/input"),c=e("../lia/i18n"),d=e("../lia/calculation-options"),p=e("../lia/calculation-review"),h=e("./calculation-freeze"),m=e("../math/equivalence"),f=e("../math/column-arithmetic"),g=e("../math/column-subtraction"),x=e("../math/column-multiplication"),b=e("../math/column-division"),v=e("../math/written-arithmetic"),y=e("../math/expected-calculation"),w=e("../ocr/column-layout"),M=e("../ocr/layout"),k=e("../ocr/job-queue"),S=e("../ocr/formulanet-engine"),A=e("../ocr/symbol-geometry");let C={auto:"Automatic",red:"Red",orange:"Orange",yellow:"Yellow",violett:"Violet",blue:"Blue",lightblue:"Light blue",green:"Green",darkgreen:"Dark green",black:"Black",white:"White"},_={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"};function R(e){return String(e??"").replace(/[&<>'\u0022]/g,e=>_[e]||e)}function T(e){let t=(0,d.parseCalculationOptions)(e.dataset.calculationOptions),n=!!(0,v.parseWrittenArithmeticPrompt)(e.dataset.calculationPrompt||""),r=!!("plus"===e.dataset.canvasMode&&"answer"===e.dataset.canvasOutput&&!n&&t.lineFeedback);return e.dataset.lineFeedback=r?"1":"0",e.dataset.calculationOptionsState=t.valid?"valid":"invalid",t.error?e.dataset.calculationOptionsError=t.error:delete e.dataset.calculationOptionsError,r}let E=".lia-canvas-pair[data-canvas-output=answer][data-answer-format=native-equation-v1]",L=new Map,z=!1;function O(e){let t=e;for(let n=0;t&&n<10;n++){let n=t.parentElement;if(!n)break;let r=Array.from(n.querySelectorAll("input.lia-quiz__input, textarea.lia-quiz__input, [contenteditable=true].lia-quiz__input"));for(let t=r.length-1;t>=0;t--){let n=r[t];if(n.compareDocumentPosition(e)&Node.DOCUMENT_POSITION_FOLLOWING)return n}t=n}return null}function I(e){let t=e.closest(".lia-quiz");if(t)return t;let n=O(e)?.closest(".lia-quiz");if(n)return n;for(let t of Array.from((e.closest("main")||document).querySelectorAll(".lia-quiz")))if(e.compareDocumentPosition(t)&Node.DOCUMENT_POSITION_FOLLOWING)return t;return null}function q(e){let t=Array.from(document.querySelectorAll(E)).find(t=>t.dataset.calculationQuiz===e);if(!t)return!1;let n=String(t.dataset.calculationPrompt||"").trim(),r=O(t);if(!n||!r)return!1;let a=(0,u.__liaReadFieldValue)(r),i=(0,v.parseWrittenArithmeticPrompt)(n);return i?(0,v.validateWrittenArithmeticSubmission)(i,a).accepted:(0,m.validateCalculationSubmission)(n,a).accepted}function P(e){let t=L.get(e);t&&(t.cancelled=!0,t.timer&&window.clearTimeout(t.timer),t.timer=0,L.delete(e))}function N(e){e.timer&&window.clearTimeout(e.timer),e.timer=0,e.cancelled=!0,L.get(e.pair)===e&&L.delete(e.pair)}function F(e){if(e.pair.isConnected)return e.pair;if(!e.pairKey)return null;for(let t of Array.from(document.querySelectorAll(E)))if(t.dataset.calculationQuiz===e.pairKey)return t;return null}function W(e,t){if(!e.isConnected)return!1;if((0,u.__liaInitTexPreviews)(),(0,u.__liaReadFieldValue)(e)===t)return!0;let n=(0,u.__liaApplyValue)(e,t);return n&&(0,u.__liaRefreshAllTexPreviewBorders)(document),n}function D(e,t){let n=O(e);return!!n&&W(n,t)}function j(e){if(!e.cancelled&&L.get(e.pair)===e){if(performance.now()>=e.deadline){if(e.submission){let t=F(e),n=t?I(t):null,r=t?O(t):null;n?.classList.contains("resolved")&&r&&W(r,e.submission)}N(e);return}e.timer=window.setTimeout(()=>{e.timer=0,$(e)},16)}}function $(e){if(e.cancelled||L.get(e.pair)!==e)return;let t=F(e),n=t?I(t):null,r=t?O(t):null,a=r?(0,u.__liaReadFieldValue)(r).trim():"";if(!t||!n?.classList.contains("resolved")||!r||!a)return void j(e);let i=performance.now();if(!e.submission){if(e.field!==r||e.authoredEquation!==a){e.field=r,e.authoredEquation=a,e.stableSince=i,j(e);return}if(i-e.stableSince<80)return void j(e);let t=(0,v.parseWrittenArithmeticPrompt)(a),n=t?(0,v.createExpectedWrittenArithmeticSubmission)(t):null,l=n?(0,v.serializeWrittenArithmeticSubmission)(n):"";if(t)return l?(e.submission=l,e.stableSince=i,e.deadline=Math.max(e.deadline,i+2800+500),W(r,l),void j(e)):void N(e);let o=(0,y.generateExpectedCalculation)(a);if(!o?.length)return void N(e);let s=(0,m.serializeCalculationSubmission)(o);return s?(e.submission=s,e.stableSince=i,e.deadline=Math.max(e.deadline,i+2800+500),W(r,s),void j(e)):void N(e)}if((0,u.__liaReadFieldValue)(r)!==e.submission)W(r,e.submission),e.stableSince=i;else if(i-e.stableSince>=2800)return void N(e);j(e)}function B(e){let t,n=e.target instanceof Element?e.target:null,r=n?.closest("button.lia-quiz__resolve");if(!r||r.disabled)return;let a=r.closest(".lia-quiz");if(!a)return;let i=function(e){for(let t of Array.from(document.querySelectorAll(E)))if(I(t)===e)return t;return null}(a);i&&(P(i),t={pair:i,pairKey:i.dataset.calculationQuiz||"",deadline:performance.now()+3200,timer:0,cancelled:!1,field:null,authoredEquation:"",submission:"",stableSince:0},L.set(i,t),t.timer=window.setTimeout(()=>{t.timer=0,$(t)},0))}function H(e){for(let e of Array.from(L.keys()))P(e);e.persisted||function(){if(z)for(let e of(z=!1,document.removeEventListener("click",B,!0),window.removeEventListener("pagehide",H),Array.from(L.keys())))P(e)}()}function U(){let e=R((0,c.liaT)("canvas.undo","Undo")),t=R((0,c.liaT)("canvas.redo","Redo")),n=R((0,c.liaT)("canvas.eraser","Eraser")),r=R((0,c.liaT)("canvas.pen","Pen")),a=R((0,c.liaT)("canvas.background","Background")),i=R((0,c.liaT)("ocr.selectSubmit","Submit as Solution")),l=R((0,c.liaT)("canvas.tools","Tools")),o=R((0,c.liaT)("canvas.drawingArea","Drawing area"));return`
    <span class="lia-draw-block">
      <span class="lia-draw-wrap">
        <span class="lia-toolstack">
          <button class="lia-tool-btn lia-undo-btn"   type="button" aria-label="${e}"></button>
          <button class="lia-tool-btn lia-redo-btn"   type="button" aria-label="${t}"></button>
          <button class="lia-tool-btn lia-eraser-btn" type="button" aria-label="${n}"></button>
          <button class="lia-tool-btn lia-color-btn"  type="button" aria-label="${r}"></button>
          <button class="lia-tool-btn lia-bgmenu-btn" type="button" aria-label="${a}"></button>
          <button class="lia-tool-btn lia-rect-btn"   type="button" aria-label="${i}"></button>
        </span>

        <span class="lia-tool-menu" data-open="0" aria-label="${l}"></span>
        <canvas class="lia-draw" aria-label="${o}"></canvas>
      </span>
    </span>
  `}function X(){i.LIA.checkCalculationAnswerByUID=q,z||(z=!0,document.addEventListener("click",B,!0),window.addEventListener("pagehide",H)),document.querySelectorAll(".lia-canvas-pair[data-canvas-mode=plus]").forEach(T),document.querySelectorAll(".lia-draw-wrap canvas.lia-draw:not([data-ready])").forEach(e=>{e.setAttribute("data-ready","1"),function(e){let t=e.closest(".lia-draw-wrap");if(!t)return;let n=function(){let e=window.__LIA_CANVAS_PEN_TOUCH_GUARD__=window.__LIA_CANVAS_PEN_TOUCH_GUARD__||{activePenPointers:new Set};if(window.__LIA_CANVAS_GLOBAL_TOUCH_SUPPRESSOR__)return e;window.__LIA_CANVAS_GLOBAL_TOUCH_SUPPRESSOR__=!0;let t=t=>{0===String(t.type||"").indexOf("pointer")&&"touch"!==String(t.pointerType||"")||e.activePenPointers.size&&(t.cancelable&&t.preventDefault(),t.stopPropagation())};document.addEventListener("touchstart",t,{capture:!0,passive:!1}),document.addEventListener("touchmove",t,{capture:!0,passive:!1}),document.addEventListener("pointerdown",t,{capture:!0,passive:!1}),document.addEventListener("pointermove",t,{capture:!0,passive:!1});let n=t=>{"pen"===String(t.pointerType||"").toLowerCase()&&e.activePenPointers.delete(t.pointerId)};return document.addEventListener("pointerup",n,{capture:!0}),document.addEventListener("pointercancel",n,{capture:!0}),document.addEventListener("pointerleave",n,{capture:!0}),e}(),r=new Set,a=(e,t)=>(0,c.liaT)("ocr."+e,t),s=(e,t)=>(0,c.liaT)("canvas."+e,t),d=t.closest(".lia-canvas-mount"),y=t.closest(".lia-canvas-pair"),_=y?.dataset.canvasMode==="plus",E=_?(0,v.parseWrittenArithmeticPrompt)(y?.dataset.calculationPrompt||""):null,L=E?.kind||null,z=!!E,O="column-addition"===L,I="column-subtraction"===L,q="column-multiplication"===L,P="column-division"===L,N=O||I||q,F=O||I;y&&(y.dataset.calculationKind=L||"equation");let W=!!y&&T(y),j=!z&&W,$=_&&y?.dataset.ocrMode==="background",B=(0,o.ensureMountUID)(d),H=t.querySelector(".lia-undo-btn"),U=t.querySelector(".lia-redo-btn"),X=t.querySelector(".lia-color-btn"),V=t.querySelector(".lia-eraser-btn"),Y=t.querySelector(".lia-rect-btn"),Z=t.querySelector(".lia-bgmenu-btn"),G=t.querySelector(".lia-tool-menu"),K=null,Q=null,J=null,ee=null,et=null,en=null,er=null,ea=null,ei=null,el=null,eo=null,es=null,eu=null,ec=null,ed=null;if(_){let e=t.closest(".lia-draw-block");if(e){let t=document.createElement("div");t.className="lia-canvasplus-standalone-controls",t.dataset.snapshotAdmin="1",(K=document.createElement("button")).type="button",K.className="lia-btn lia-canvasplus-submit lia-canvasplus-standalone-submit",K.disabled=!0,(Q=document.createElement("span")).className="lia-canvasplus-standalone-status",Q.setAttribute("role","status"),Q.setAttribute("aria-live","polite"),Q.dataset.state="empty";let n=document.createElement("div");n.className="lia-canvasplus-submit-stack",n.appendChild(K),n.appendChild(Q),t.appendChild(n),(J=ee=document.createElement("details")).className="lia-canvasplus-output lia-canvasplus-standalone-result",J.dataset.snapshotAdmin="1",J.hidden=!0,J.dataset.stale="0",J.dataset.state="idle",J.id="lia-canvasplus-result-"+String(B||"canvas").replace(/[^a-zA-Z0-9_-]/g,"-");let r=String(B||"canvas").replace(/[^a-zA-Z0-9_-]/g,"-"),i=document.createElement("summary");i.className="lia-canvasplus-result-toggle";let l=document.createElement("span");l.className="lia-canvasplus-result-toggle-indicator",l.setAttribute("aria-hidden","true");let o=document.createElement("div");o.className="lia-canvasplus-result-header";let s=document.createElement("span");s.className="lia-canvasplus-standalone-title",s.textContent=a("plus.resultTitle","Rendered calculation block"),s.id="lia-canvasplus-result-title-"+r,s.setAttribute("role","heading"),s.setAttribute("aria-level","3"),(er=document.createElement("button")).type="button",er.className="lia-canvasplus-edit",er.disabled=!0,er.hidden=z,er.setAttribute("aria-expanded","false"),o.appendChild(er),(en=document.createElement("span")).className="lia-canvasplus-analysis-summary",en.setAttribute("role","status"),en.setAttribute("aria-live","polite"),en.setAttribute("aria-atomic","true"),i.appendChild(l),i.appendChild(s),i.appendChild(en),(et=document.createElement("div")).className="lia-canvasplus-rendered lia-canvasplus-standalone-math",(ea=document.createElement("div")).className="lia-canvasplus-inline-editor",ea.hidden=!0;let u="lia-canvasplus-editor-"+r,d="lia-canvasplus-editor-text-"+r;ea.id=u,er.setAttribute("aria-controls",u);let h=document.createElement("label");h.className="lia-canvasplus-label lia-canvasplus-inline-label",h.htmlFor=d,(ei=document.createElement("textarea")).className="lia-canvasplus-textarea lia-canvasplus-inline-textarea",ei.id=d,ei.rows=6,ei.spellcheck=!1,ei.autocomplete="off",(eu=document.createElement("p")).className="lia-canvasplus-edit-validation",eu.setAttribute("role","status"),eu.setAttribute("aria-live","polite"),eu.id=d+"-status",ei.setAttribute("aria-describedby",eu.id);let m=document.createElement("div");m.className="lia-canvasplus-actions lia-canvasplus-inline-actions",(el=document.createElement("button")).type="button",el.className="lia-canvasplus-button lia-canvasplus-insert-pm",el.hidden=!0,(es=document.createElement("button")).type="button",es.className="lia-canvasplus-button lia-canvasplus-cancel",(eo=document.createElement("button")).type="button",eo.className="lia-canvasplus-button lia-canvasplus-accept",m.appendChild(el),m.appendChild(es),m.appendChild(eo),ea.appendChild(h),ea.appendChild(ei),ea.appendChild(eu),ea.appendChild(m),J.dataset.analysisState="idle",J.dataset.resultSource="ocr";let f=document.createElement("div");f.className="lia-canvasplus-result-content",f.appendChild(et),f.appendChild(ea),J.appendChild(i),J.appendChild(o),J.appendChild(f),K.setAttribute("aria-controls",J.id),t.appendChild(J),e.appendChild(t),ec=(0,p.createCalculationReview)({root:J,target:et,summary:en,translate:c.liaT,mode:L||"equation-path",composeLatex:z?()=>ed?(0,v.composeWrittenArithmeticLatex)(ed):"":void 0,onAnalysis:e=>{y&&e.revision===tv&&(function(e){if(!j)return;let t=ec?.getSnapshot();t&&t.revision===e.revision&&tS({v:"cr1",lines:t.lines.slice(),state:e.state,checks:"ready"===e.state?e.checks.map(e=>({status:e.status,reason:e.reason,...e.side?{side:e.side}:{}})):[]},"calculation-analysis")}(e),y.dispatchEvent(new CustomEvent("lia:canvasplus-analysis",{bubbles:!0,detail:{uid:B||"",revision:e.revision,state:e.state,checks:e.checks}})))}}),ee.addEventListener("toggle",()=>{ee?.open&&ec?.refreshLayout()})}}let ep=document.createElement("button");ep.type="button",ep.className="lia-rect-action",ep.textContent=a("selectSubmit","Submit as Solution"),ep.style.display="none",t.appendChild(ep);let eh=document.createElement("div");eh.className="lia-rect-progress",eh.dataset.on="0",eh.innerHTML=`
    <div class="lia-rect-progbar"><div class="lia-rect-progfill"></div></div>
    <div class="lia-rect-progtxt">0%</div>
  `,t.appendChild(eh);let em=eh.querySelector(".lia-rect-progfill"),ef=eh.querySelector(".lia-rect-progtxt"),eg=!1;function ex(){let n=s("undo","Undo"),r=s("redo","Redo");if(H&&(H.title=n,H.setAttribute("aria-label",n)),U&&(U.title=r,U.setAttribute("aria-label",r)),G?.setAttribute("aria-label",s("tools","Tools")),e.setAttribute("aria-label",s("drawingArea","Drawing area")),t.querySelector("[data-corner=bl]")?.setAttribute("aria-label",s("resizeBottomLeft","Resize drawing area from the bottom left")),t.querySelector("[data-corner=br]")?.setAttribute("aria-label",s("resizeBottomRight","Resize drawing area from the bottom right")),eg||(ep.textContent=a("selectSubmit","Submit as Solution")),K){let e=String(Q?.dataset.state||"empty");K.textContent="running"===e?a("plus.rendering","Recognizing calculation block..."):"error"===e||"error-stale"===e?a("retry","Try again"):a("plus.renderBlock","Submit to render")}if(Q){let e=String(Q.dataset.state||"empty");if("empty"===e)Q.textContent=tI()?a("plus.selectionEmpty","The selected area contains no handwriting."):a("plus.writeFirst","Write a calculation block first.");else if("ready"===e)Q.textContent=a("plus.readyToRender","Ready to render.");else if("preparing"===e)Q.textContent=a("plus.preparing","Preparing recognition in the background...");else if("prepared"===e)Q.textContent=a("plus.preparedLines","{count} lines prepared in the background.").replace("{count}",String(Math.max(0,Number(Q.dataset.lineCount)||0)));else if("prepared-stale"===e)Q.textContent=a("plus.preparedStale","New recognition prepared — render again.");else if("stale"===e)Q.textContent=a("plus.stale","Handwriting changed — render again.");else if("rendered"===e)Q.textContent="";else if("running"===e)Q.textContent=a("plus.rendering","Recognizing calculation block...");else if("error"===e){let e=a("plus.renderError","The calculation block could not be rendered."),t=String(y?.dataset.ocrError||"").trim();Q.textContent=t?e+" "+t:e}else if("error-stale"===e){let e=a("plus.renderErrorKeep","New recognition failed; the previous result remains visible."),t=String(y?.dataset.ocrError||"").trim();Q.textContent=t?e+" "+t:e}}if(J){let e=J.querySelector(".lia-canvasplus-standalone-title");e&&(e.textContent=a("plus.resultTitle","Rendered calculation block"))}if(er&&(er.textContent=a("plus.editResult","Edit recognition")),ea){let e=ea.querySelector(".lia-canvasplus-inline-label");e&&(e.textContent=a("plus.texMultiline","Recognized TeX (one equation per line)"))}if(es&&(es.textContent=a("plus.cancel","Cancel")),eo&&(eo.textContent=a("plus.applyCorrection","Apply changes")),el&&(el.textContent=a("plus.insertPlusMinus","Insert ±")),ea&&!ea.hidden&&tW(),ec?.refreshTexts(),Y){let e=_?a("plus.selectArea","Select render area"):a("selectSubmit","Submit as Solution");Y.title=e,Y.setAttribute("aria-label",e)}ev&&ev.setAttribute("aria-label",_?a("plus.clearSelection","Clear render selection"):s("clearMarkerRectangle","Remove selection rectangle"))}let eb=()=>{if(ex(),nh(),G&&"1"===G.dataset.open){let e=String(G.__mode||"");"pen"===e?t3():"eraser"===e?t6():"bg"===e&&t9()}};document.addEventListener("lia:canvas-i18n-update",eb),eh.addEventListener("pointerdown",e=>{e.preventDefault(),e.stopPropagation()}),ep.addEventListener("pointerdown",e=>{e.preventDefault(),e.stopPropagation()});let ev=document.createElement("button");ev.type="button",ev.className="lia-rect-close",ev.setAttribute("aria-label",_?a("plus.clearSelection","Clear render selection"):s("clearMarkerRectangle","Remove selection rectangle")),ev.style.display="none",ev.innerHTML=`
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 7L17 17M17 7L7 17" fill="none" stroke="currentColor"
            stroke-width="2.4" stroke-linecap="round"/>
    </svg>
  `,t.appendChild(ev);let ey=document.createElement("span");ey.className="lia-eraser-ring",ey.dataset.on="0",t.appendChild(ey),ev.addEventListener("pointerdown",e=>{e.preventDefault(),e.stopPropagation()}),ev.addEventListener("click",e=>{e.preventDefault(),e.stopPropagation(),function(){let e=!1;for(let t=e7.length-1;t>=0;t--)e7[t]&&"rect"===e7[t].kind&&(e7.splice(t,1),e=!0);for(let t=te.length-1;t>=0;t--)te[t]&&"rect"===te[t].kind&&(te.splice(t,1),e=!0);e&&(nu(),nd(),nh(),t1(),tY("selection-clear"),tV("selection-clear")),nr()}(),Y?.focus()}),(0,l.setUndoIcon)(H),(0,l.setRedoIcon)(U),(0,l.setEraserIcon)(V),(0,l.setRectIcon)(Y),Z&&!Z.__bgCleared&&(Z.__bgCleared=!0,Z.innerHTML="");let ew=e.getContext("2d"),eM=document.createElement("canvas"),ek=eM.getContext("2d"),eS=document.createElement("canvas"),eA=eS.getContext("2d"),eC=i.LIA.store,e_=B&&eC[B]?eC[B]:null,eR=e_&&e_.VIEW?{...e_.VIEW}:{panX:0,panY:0,scale:1,minScale:.25,maxScale:8},eT=0,eE=!1;function eL(){eT&&(clearTimeout(eT),eT=0)}function ez(e){try{let t=i.LIA.bar;t&&t.log&&t.log(e)}catch(e){}}function eO(e){let t=String(e||""),n="",r=!1;for(let e=0;e<t.length;e++){let a=t[e];" "===a||"\n"===a||"\r"===a||"	"===a||"\f"===a?(r||(n+=" "),r=!0):(n+=a,r=!1)}return n.trim()}function eI(e){let t=String(e||"").trim();return t.startsWith("$$")&&t.endsWith("$$")&&(t=t.slice(2,-2).trim()),t.startsWith("$")&&t.endsWith("$")&&(t=t.slice(1,-1).trim()),t.startsWith("\\[")&&t.endsWith("\\]")&&(t=t.slice(2,-2).trim()),eO(t)}function eq(e){let t=String(e||"").trim(),n="\\mathrm{";if(t.startsWith(n)&&t.endsWith("}")){t=t.slice(n.length,-1);let e="";for(let n=0;n<t.length;n++)"~"!==t[n]&&(e+=t[n]);return e.trim()}return t}function eP(e){if(!e||(-1!==e.indexOf("\\div")&&(e=e.replace(/\s*\\div\s*/g,":")),-1===e.indexOf("\\times")))return e;let t="",n=0,r=e;for(;n<r.length;){let e=r.indexOf("\\times",n);if(-1===e){t+=r.slice(n);break}t+=r.slice(n,e);let a=e+6;for(;a<r.length&&" "===r[a];)a++;let i=e-1;for(;i>=0&&" "===r[i];)i--;let l=r[a]||"",o=r[i]||"",s=e=>e>="0"&&e<="9",u=e=>e>="a"&&e<="z";s(o)&&s(l)?t+="\\cdot":u(o)||u(l)?t+="x":t+="\\cdot",n=e+6}return t}function eN(e){let t=Math.max(e.width,e.height),n=1;if(t<420&&(n=420/t),t>1400&&(n=1400/t),.06>Math.abs((n=t0(n,.5,4))-1))return e;let r=document.createElement("canvas");r.width=Math.max(1,Math.round(e.width*n)),r.height=Math.max(1,Math.round(e.height*n));let a=r.getContext("2d",{willReadFrequently:!0});return a.fillStyle="#fff",a.fillRect(0,0,r.width,r.height),a.drawImage(e,0,0,r.width,r.height),r}function eF(e){let t=document.createElement("canvas");t.width=Math.max(1,0|e.width),t.height=Math.max(1,0|e.height);let n=t.getContext("2d",{willReadFrequently:!0});n.fillStyle="#fff",n.fillRect(0,0,t.width,t.height),n.drawImage(e,0,0);let r=n.getImageData(0,0,t.width,t.height).data,a=t.width,i=t.height,l=new Uint8Array(a*i);for(let e=0,t=0;t<l.length;t++,e+=4)l[t]=+(.299*r[e]+.587*r[e+1]+.114*r[e+2]<200);let o=l;for(let e=0;e<0;e++)o=function(e){let t=new Uint8Array(a*i);for(let n=1;n<i-1;n++)for(let r=1;r<a-1;r++){let i=n*a+r,l=0;for(let t=-1;t<=1;t++)for(let n=-1;n<=1;n++)if(e[i+t*a+n]){l=1,t=2;break}t[i]=l}return t}(o);let s=a,u=i,c=-1,d=-1;for(let e=0;e<i;e++)for(let t=0;t<a;t++)o[e*a+t]&&(t<s&&(s=t),e<u&&(u=e),t>c&&(c=t),e>d&&(d=e));if(c<0)return t;s=Math.max(0,s-18),u=Math.max(0,u-18);let p=Math.max(1,(c=Math.min(a-1,c+18))-s+1),h=Math.max(1,(d=Math.min(i-1,d+18))-u+1),m=document.createElement("canvas");m.width=p,m.height=h;let f=m.getContext("2d",{willReadFrequently:!0}),g=f.createImageData(p,h),x=g.data;for(let e=0;e<h;e++)for(let t=0;t<p;t++){let n=255*!o[(u+e)*a+(s+t)],r=(e*p+t)*4;x[r]=n,x[r+1]=n,x[r+2]=n,x[r+3]=255}f.putImageData(g,0,0);let b=512/Math.max(p,h);b<.75&&(b=.75),b>3.5&&(b=3.5);let v=document.createElement("canvas");v.width=Math.max(1,Math.round(p*b)),v.height=Math.max(1,Math.round(h*b));let y=v.getContext("2d",{willReadFrequently:!0});return y.fillStyle="#fff",y.fillRect(0,0,v.width,v.height),y.imageSmoothingEnabled=!0,y.drawImage(m,0,0,v.width,v.height),v}function eW(e,t){let n=+(1===(t&&"object"==typeof t?t:{}).dilate),r=document.createElement("canvas");r.width=Math.max(1,0|e.width),r.height=Math.max(1,0|e.height);let a=r.getContext("2d",{willReadFrequently:!0});a.fillStyle="#fff",a.fillRect(0,0,r.width,r.height),a.drawImage(e,0,0);let i=a.getImageData(0,0,r.width,r.height).data,l=r.width,o=r.height,s=new Uint8Array(l*o);for(let e=0,t=0;t<s.length;t++,e+=4)s[t]=+(.299*i[e]+.587*i[e+1]+.114*i[e+2]<225);1===n&&(s=function(e){let t=new Uint8Array(l*o);for(let n=1;n<o-1;n++)for(let r=1;r<l-1;r++){let a=n*l+r,i=0;for(let t=-1;t<=1;t++)for(let n=-1;n<=1;n++)if(e[a+t*l+n]){i=1,t=2;break}t[a]=i}return t}(s));let u=l,c=o,d=-1,p=-1;for(let e=0;e<o;e++)for(let t=0;t<l;t++)s[e*l+t]&&(t<u&&(u=t),e<c&&(c=e),t>d&&(d=t),e>p&&(p=e));if(d<0)return eF(e);let h=Math.max(1,d-u+1),m=Math.max(1,p-c+1),f=Math.max(24,Math.floor(.35*Math.max(h,m))),g=Math.max(64,Math.min(1024,Math.max(h,m)+2*f)),x=document.createElement("canvas");x.width=g,x.height=g;let b=x.getContext("2d",{willReadFrequently:!0}),v=b.createImageData(g,g),y=v.data;for(let e=0;e<y.length;e+=4)y[e]=255,y[e+1]=255,y[e+2]=255,y[e+3]=255;let w=Math.floor((g-h)/2),M=Math.floor((g-m)/2);for(let e=0;e<m;e++)for(let t=0;t<h;t++){let n=255*!s[(c+e)*l+(u+t)],r=((M+e)*g+(w+t))*4;y[r]=n,y[r+1]=n,y[r+2]=n,y[r+3]=255}b.putImageData(v,0,0);let k=document.createElement("canvas");k.width=512,k.height=512;let S=k.getContext("2d",{willReadFrequently:!0});return S.fillStyle="#fff",S.fillRect(0,0,512,512),S.imageSmoothingEnabled=!1,S.drawImage(x,0,0,512,512),k}function eD(e,t){let n=Math.max(0,Math.round(t)),r=document.createElement("canvas");r.width=e.width+2*n,r.height=e.height+2*n;let a=r.getContext("2d",{willReadFrequently:!0});return a.fillStyle="#fff",a.fillRect(0,0,r.width,r.height),a.drawImage(e,n,n),r}function ej(e,t,n){if("formulanet-line-384"===String(e&&e.inputProfile||""))return t;let r=n?eD(eF(t),20):eF(t);return eN(r)}function e$(e){let t=String(e||"").trim();return t?eU(t)?t.length-5e3:t.length:-9999}async function eB(e,t,n=!1){let r=t,a=t,i=t;try{r=eF(t)}catch(e){r=t}try{r=eN(r)}catch(e){}try{a=eD(eF(t),20)}catch(e){a=r}try{a=eN(a)}catch(e){}try{i=eF(function(e){let t=document.createElement("canvas");t.width=e.width,t.height=e.height;let n=t.getContext("2d",{willReadFrequently:!0});n.fillStyle="#fff",n.fillRect(0,0,t.width,t.height),n.drawImage(e,0,0);let r=n.getImageData(0,0,t.width,t.height),a=r.data;for(let e=0;e<a.length;e+=4)!(a[e+3]<128)&&.299*a[e]+.587*a[e+1]+.114*a[e+2]<240&&(a[e]=Math.max(0,Math.min(255,Math.round(a[e]/1.35))),a[e+1]=Math.max(0,Math.min(255,Math.round(a[e+1]/1.35))),a[e+2]=Math.max(0,Math.min(255,Math.round(a[e+2]/1.35))));return n.putImageData(r,0,0),t}(t))}catch(e){i=r}try{i=eN(i)}catch(e){}let l={max_new_tokens:128,do_sample:!1,temperature:0};n&&(l.__silent=!0);let[o,s,u]=await Promise.all([e.recognize(r,l).catch(()=>""),e.recognize(a,l).catch(()=>""),e.recognize(i,l).catch(()=>"")]),c=eP(eq(eI(o))),d=eP(eq(eI(s))),p=eP(eq(eI(u))),h=e$(c),m=e$(d),f=e$(p);return h>=m&&h>=f?c:m>=f?d:p}function eH(e,t){let n=t*Math.PI/180,r=0|e.width,a=0|e.height,i=document.createElement("canvas");i.width=Math.max(1,r),i.height=Math.max(1,a);let l=i.getContext("2d",{willReadFrequently:!0});return l.fillStyle="#fff",l.fillRect(0,0,i.width,i.height),l.translate(i.width/2,i.height/2),l.rotate(n),l.translate(-r/2,-a/2),l.imageSmoothingEnabled=!1,l.drawImage(e,0,0),i}function eU(e){let t=String(e||"").trim();if(!t||/[+\-*/=,:;\\]$/.test(t)||/[{[(]$/.test(t))return!0;let n=0,r=0,a=0,i=!1;for(let e=0;e<t.length;e++){let l=t[e];if(i){i=!1;continue}if("\\"===l){i=!0;continue}"{"===l?n++:"}"===l?n--:"["===l?r++:"]"===l?r--:"("===l?a++:")"===l&&a--}return 0!==n||0!==r||0!==a}function eX(e){let t=String(e||"").trim();if(!t||-1!==t.indexOf("\\"))return null;let n={O:"0",o:"0",Q:"0",D:"0",I:"1",l:"1","|":"1","!":"1",Z:"2",z:"2",S:"5",s:"5",B:"8",g:"9",q:"9"},r="";for(let e=0;e<t.length;e++){let a=t[e],i=t.charCodeAt(e);if(i>=48&&i<=57){r+=a;continue}if(!(" \n\r	".includes(a)||"${}()[]".includes(a))&&!",.;:_-".includes(a)){if(n[a]){r+=n[a];continue}return null}}return(r=String(r).trim())&&!(r.length>3)?r:null}async function eV(e,t){t.__dgBase0||(t.__dgBase0=eW(t,{dilate:0})),t.__dgBase1||(t.__dgBase1=eW(t,{dilate:1}));let n=t.__dgBase0,r=t.__dgBase1,a=[()=>n,()=>eH(n,-6),()=>eH(n,6),()=>r,()=>eH(r,-6),()=>eH(r,6)],i={},l=[];for(let t=0;t<a.length;t++){let n="";try{n=await e.recognize(a[t](),{max_new_tokens:8,do_sample:!1,temperature:0,__silent:!0})}catch(e){continue}let r=eI(n),o=eX(r=eP(r=eq(r)));if(o&&(i[o]||(i[o]=0,l.push(o)),i[o]+=1,i[o]>=3))return o}let o=null,s=0;for(let e of l)(i[e]||0)>s&&(s=i[e],o=e);return o}function eY(e){try{let t=0|e.width,n=0|e.height,r=e.getContext("2d",{willReadFrequently:!0}).getImageData(0,0,t,n).data,a=t*n>12e5?2:1,i=t,l=n,o=-1,s=-1,u=0;for(let e=0;e<n;e+=a){let n=e*t*4;for(let c=0;c<t;c+=a)r[n+4*c]<128&&(u++,c<i&&(i=c),e<l&&(l=e),c>o&&(o=c),e>s&&(s=e))}if(o<0)return null;let c=o-i+1,d=s-l+1;return{xMin:i,yMin:l,xMax:o,yMax:s,w:c,h:d,black:u,W:t,H:n}}catch(e){}return null}function eZ(e){let t=eO(e),n="+-=*/()[]{}",r="";for(let e=0;e<t.length;e++){let a=t[e];if(" "===a){let a=e>0?t[e-1]:"",i=e+1<t.length?t[e+1]:"";if(n.indexOf(a)>=0||n.indexOf(i)>=0)continue;r+=" "}else r+=a}return r.trim()}function eG(e,t){let n=-1!==String(e&&e.model||"").toLowerCase().indexOf("trocr"),r="latex"===String(e&&e.outputKind||"").toLowerCase();return eP(n&&!r?eZ(t):r?eI(t):eq(eI(t)))}function eK(e){let t=String(e||"").trim();return!!(!t||eU(t))||t.length>256||-1!==t.indexOf("�")||/^(?:generated_text|text|latex)\s*:/i.test(t)}async function eQ(e,t,n){let r={max_new_tokens:64,do_sample:!1,temperature:0};n&&(r.__silent=!0);let a=t;try{a=ej(e,t,!1)}catch(e){a=t}let i=await e.recognize(a,r),l=eG(e,i);if(!eK(l)||!0===e.calculationSinglePass)return l;let o=t;try{o=ej(e,t,!0)}catch(e){o=t}let s={...r,max_new_tokens:128},u=await e.recognize(o,s),c=eG(e,u);return eK(c)?c||l:c}function eJ(e,t,n){let r=Math.max(0,Math.floor(t)),a=Math.min(e.width-1,Math.ceil(n));if(a-r<2)return null;let i=document.createElement("canvas");i.width=a-r+1,i.height=e.height;let l=i.getContext("2d",{willReadFrequently:!0});return l?(l.fillStyle="#fff",l.fillRect(0,0,i.width,i.height),l.drawImage(e,r,0,i.width,e.height,0,0,i.width,i.height),i):null}async function e0(e,t,n,r,a,i=!0,l=!1){let o=Math.max(0,Math.floor(n)),s=Math.min(t.canvas.width-1,Math.ceil(r)),u=function(e,t,n,r){let a=[];if(r)for(let r of(0,M.getOcrStructuralBars)(e))r.x1<t||r.x0>n||a.push({x0:r.x0,x1:r.x1,token:"\\vert"});for(let r of(0,M.getOcrStructuralDelimiters)(e))r.x1<t||r.x0>n||a.push({x0:r.x0,x1:r.x1,token:(0,M.ocrDelimiterToken)(r.kind)});a.sort((e,t)=>e.x0-t.x0||e.x1-t.x1);for(let e=1;e<a.length;e++)if(a[e].x0<=a[e-1].x1)return null;return a}(t,o,s,i);if(null===u&&l)return"";let c=u||[];if(!c.length){let n=eJ(t.canvas,o,s);return n&&eY(n)?eQ(e,n,a):""}let d=[],p=o;for(let e of c)d.push([p,e.x0-1]),p=Math.max(p,e.x1+1);d.push([p,s]);let h=await Promise.all(d.map(async([n,r])=>{let i=eJ(t.canvas,n,r);if(!i||!eY(i))return{value:"",hadInk:!1};try{return{value:await eQ(e,i,a),hadInk:!0}}catch(e){return{value:"",hadInk:!0}}}));return h.some(e=>e.hadInk&&!e.value.trim())?"":(0,M.composeOcrStructuralParts)(h.map(e=>e.value),c.map(e=>e.token))}async function e1(e,t,n){return(0,M.getOcrStructuralBars)(t).length||(0,M.getOcrStructuralDelimiters)(t).length?e0(e,t,0,t.canvas.width-1,n,!0,!0):null}async function e2(e,t,n){let r=(0,M.getOcrOperationSeparators)(t).filter(e=>!function(e,t){let n=(0,M.getOcrStructuralDelimiters)(e).slice().sort((e,t)=>e.x0-t.x0),r=[],a=(t.x0+t.x1)*.5;for(let e of n){if("round-open"===e.kind||"square-open"===e.kind){r.push(e);continue}let t=r.pop();if(t&&a>t.x1&&a<e.x0)return!0}return!1}(t,e)),a="",i=[];for(let l of r)if(l.x0>2&&l.x1<t.canvas.width-3){let[r,o]=await Promise.all([e0(e,t,0,l.x0-1,n,!1),e0(e,t,l.x1+1,t.canvas.width-1,n,!1)]),s=(0,M.normalizeOcrOperationSide)(o);if((0,M.canComposeOcrOperationSeparator)(r,s))return r+" \\mid "+s;let u="vector"===l.source&&"high"===l.confidence&&!!r.trim()&&(0,M.canComposeOcrOperationSeparator)(r,"+0");u&&!i.includes(r)&&i.push(r),u&&/^(?:[+\-:/]|\\(?:cdot|div|times)\b)/.test(s.trim())&&!a&&(a=r+" \\mid "+s)}let l=await eQ(e,t.canvas,n);for(let e of i){let t=(0,M.recoverOcrOperationSeparatorFromWholeLine)(l,e);if(t)return t}if(a)return a;let o=await e1(e,t,n);if(o)return o;let s=(0,M.insertPlusMinusIntoIndexedRootSolution)(l);if(!s||!t.plusMinusHints?.length)return l;for(let r of t.plusMinusHints.slice(0,3)){let[a,i]=await Promise.all([e0(e,t,0,r.x0-1,n,!1),e0(e,t,r.x1+1,t.canvas.width-1,n,!1)]);if((0,M.canRestoreOcrPlusMinusFromSplit)(a,i))return s}return l}async function e5(e,t,n=!1){let r=function(e,t){if(!e||!t)return!1;let n=Math.max(1,0|t.width),r=Math.max(1,0|t.height),a=Math.max(1,0|e.w),i=Math.max(1,0|e.h),l=Math.max(a,i),o=Math.min(a,i),s=a/Math.max(1,i),u=(Number(e.black||0)||0)/Math.max(1,a*i);return!(l>220||o>170||s<.2||s>2.8||u<.01||u>.6||a>Math.floor(.82*n)&&i>Math.floor(.82*r)&&l>140)}(eY(t),t),a=-1!==String(e.model||"").toLowerCase().indexOf("trocr"),i=t,l="";if(r){try{i=eW(t,{dilate:0})}catch(e){i=t}try{i=eN(i)}catch(e){}let r={max_new_tokens:16,do_sample:!1,temperature:0};n&&(r.__silent=!0),l=await e.recognize(i,r)}else l=await eB(e,t,n);if(r){let r=String(l||"").trim();if(-1!==r.indexOf("\\")||-1!==r.indexOf("{")||-1!==r.indexOf("}")||-1!==r.indexOf("^")||-1!==r.indexOf("_")||-1!==r.indexOf("sqrt")||-1!==r.indexOf("frac")||eU(r)){let r=t;try{r=eF(t)}catch(e){r=t}try{r=eN(r)}catch(e){}let a={max_new_tokens:128,do_sample:!1,temperature:0};n&&(a.__silent=!0),l=await e.recognize(r,a)}}let o=a?eZ(l):r?eq(eI(l)):l;if(o=eP(o),r||function(e){let t=String(e||"").trim();if(!t||t.length>6||-1!==t.indexOf("\\"))return!1;let n=!1;for(let e=0;e<t.length;e++){let r=t.charCodeAt(e),a=t[e];if(r>=48&&r<=57||"lLIi|!OoQqSsZzBg".includes(a)){n=!0;continue}if(!" \n\r	()[]{}.,;:_-".includes(a))return!1}return n}(o)){let n=eX(o);if(n)o=n;else{let e=function(e){let t=String(e||"").trim();if(!t)return null;let n=!0;for(let e=0;e<t.length;e++){let r=t.charCodeAt(e);if(r<48||r>57){n=!1;break}}if(n)return t;let r=t.toLowerCase();if("li"===r||"l1"===r||"il"===r)return"4";if("go"===r||"g0"===r||"qo"===r||"q0"===r)return"8";let a={O:"0",o:"0",Q:"0",I:"1",l:"1","|":"1","!":"1",Z:"2",z:"2",J:"3",j:"3",H:"4",h:"4",S:"5",s:"5",B:"8",g:"9",q:"9"},i="";for(let e=0;e<t.length;e++){let n=t[e];if(!a[n])return null;i+=a[n]}return i||null}(o);e&&(o=e)}if(!function(e){let t=String(e||"").trim();if(!t)return!1;for(let e=0;e<t.length;e++){let n=t.charCodeAt(e);if(n<48||n>57)return!1}return!0}(o)){let n=await eV(e,t);n&&(o=n)}}return String(o||"").trim()}let e4=0,e8=0,e3=0;function e6(e){if(!eh||!em||!ef)return;let t=Math.max(0,Math.min(1,Number(e)));em.style.width=Math.round(100*t)+"%",ef.textContent=Math.round(100*t)+"%"}async function e9({auto:n=!1}={}){let r;if(_)return void await tX();let l=t7();if(!l)return void ez("No marker-rectangle found.");let o=i.LIA.ocr;if(!o||!o.recognize)return void ez("OCR engine not available (LIA.ocr).");let s=ep.textContent||"";eg=!0,ep.disabled=!0,ep.textContent=a("runningOcr","Running OCR..."),e4&&cancelAnimationFrame(e4),e3&&clearTimeout(e3),e4=0,e3=0,eh&&(eh.dataset.on="1",e6(0),nr()),e8=performance.now(),r=()=>{let e=performance.now()-e8;if(e6(e<900?e/900*.7:e<2200?.7+(e-900)/1300*.2:.9+Math.min(.08,(e-2200)/5e3*.08)),!eg||!t.isConnected||e>=8e3){e4=0;return}e4=requestAnimationFrame(r)},e4=requestAnimationFrame(r);try{let n=function(t){if(!t)return null;let n=window.devicePixelRatio||1,r=Math.min(t.x0,t.x1),a=Math.min(t.y0,t.y1),i=Math.max(t.x0,t.x1),l=Math.max(t.y0,t.y1),o=ni(r,a),s=ni(i,l),u=t0(Math.min(o.sx,s.sx),0,e.clientWidth),c=t0(Math.min(o.sy,s.sy),0,e.clientHeight),d=t0(Math.max(o.sx,s.sx),0,e.clientWidth),p=t0(Math.max(o.sy,s.sy),0,e.clientHeight),h=d-u,m=p-c;if(h<6||m<6)return null;let f=Math.round((u-12)*n),g=Math.round((c-12)*n),x=Math.round((h+24)*n),b=Math.round((m+24)*n),v=_?Math.min(1,3200/Math.max(x,b),Math.sqrt(3e6/Math.max(1,x*b))):1,y=document.createElement("canvas");y.width=Math.max(1,Math.round(x*v)),y.height=Math.max(1,Math.round(b*v));let w=y.getContext("2d",{willReadFrequently:!0});w.setTransform(1,0,0,1,0,0),w.globalCompositeOperation="source-over",w.globalAlpha=1,w.clearRect(0,0,y.width,y.height);let M=eS.width,k=eS.height,S=f,A=g,C=x,R=b,T=0,E=0,L=y.width,z=y.height;if(S<0){let e=-S/C;T+=L*e,L-=L*e,C+=S,S=0}if(A<0){let e=-A/R;E+=z*e,z-=z*e,R+=A,A=0}if(S+C>M){let e=S+C-M;L-=e/C*L,C-=e}if(A+R>k){let e=A+R-k;z-=e/R*z,R-=e}if(C<=1||R<=1||L<=1||z<=1)return null;w.drawImage(eS,S,A,C,R,T,E,L,z);let O=w.getImageData(0,0,y.width,y.height),I=O.data;for(let e=0;e<I.length;e+=4)I[e+3]>10?(I[e]=0,I[e+1]=0,I[e+2]=0):(I[e]=255,I[e+1]=255,I[e+2]=255),I[e+3]=255;return w.putImageData(O,0,0),y.__liaOcrPixelScale=n*eR.scale*v,y}(l);if(!n)return void ez("Crop failed (rect too small or out of bounds).");o.ensureLoaded&&await o.ensureLoaded(!1);let r=await e5(o,n,!1);if(ez("OCR result: "+r),!t.isConnected)return;(0,u.__liaFindAndSetInputBeforeNode)(y||t,r)?(ep.textContent=a("submitted","✅ submitted"),setTimeout(()=>{ep.textContent=s},900)):ez("Could not find an input field before this @canvas.")}catch(e){ez("OCR error: "+(e&&e.message?e.message:String(e))),ep.textContent=a("ocrError","⚠ Error"),setTimeout(()=>{ep.textContent=s},900)}finally{e4&&(cancelAnimationFrame(e4),e4=0),e3&&clearTimeout(e3),e6(1),e3=setTimeout(()=>{e3=0,eh&&(eh.dataset.on="0",e6(0))},250),ep.disabled=!1,eg=!1,ex()}}ep.addEventListener("click",async e=>{e.preventDefault(),e.stopPropagation(),await e9({auto:!1})});let e7=[],te=[];e_&&(Array.isArray(e_.ITEMS)?(e7=e_.ITEMS,te=Array.isArray(e_.REDO)?e_.REDO:[]):Array.isArray(e_.STROKES)&&(e7=e_.STROKES.map(e=>({kind:"path",...e})),te=Array.isArray(e_.REDO)?e_.REDO.map(e=>({kind:"path",...e})):[]));let tt="pen",tn="pen",tr=0,ta=3,ti=1,tl=12,to=e_&&e_.bgMode?e_.bgMode:"none",ts=e_&&e_.bgStep?e_.bgStep:24,tu=null,tc=null,td=0,tp=0,th=new Map,tm=new Map,tf=0,tg=0,tx=0,tb=null,tv=-1,ty="",tw=null,tM="unknown",tk=j?(0,h.sanitizeCalculationReviewFreezeState)(e_?.calculationReviewFreeze):null;function tS(e,t){j&&(tk=(0,h.sanitizeCalculationReviewFreezeState)(e),t1(t))}function tA(){return _?i.LIA.canvasPlusOcr||(0,S.ensureCanvasPlusFormulaOcrEngine)():i.LIA.ocr}function tC(e){return e&&e.cacheKey?String(e.cacheKey)+"|"+M.OCR_LAYOUT_ALGORITHM_VERSION:String(e&&e.model||"")+"|"+String(e&&e.precision||"")+"|"+String(e&&e.task||"")+"|"+M.OCR_LAYOUT_ALGORITHM_VERSION}function t_(){let e=Error("Calculation OCR request is stale.");return e.__liaCanvasPlusCancelled=!0,e}function tR(e){return!!(e&&e.__liaCanvasPlusCancelled)}function tT(e,t,n){if(!n()||tC(e)!==t)throw t_()}async function tE(e,t,n,r,a){let i=tC(e),l=tg,o=Number(t.__liaOcrPixelScale)||(window.devicePixelRatio||1)*eR.scale;tT(e,i,a);let s=(0,M.segmentOcrCanvas)(t,o,{maskCalculationRules:N,maskCarryOnes:F,maskDivisionRules:P}),u=N&&Array.isArray(t.__liaOcrCalculationRules)?t.__liaOcrCalculationRules:[],c=F&&Array.isArray(t.__liaOcrCarryOneHints)?t.__liaOcrCarryOneHints:[],d=P&&Array.isArray(t.__liaOcrDivisionRules)?t.__liaOcrDivisionRules:[],p=O||I?(0,w.selectOcrColumnAdditionSegments)(s,u):null,h=q&&E?(0,v.createExpectedWrittenArithmeticSubmission)(E):null,m=h?.kind==="column-multiplication"?h.partialProducts.length+1:0,y=q?(0,w.selectOcrColumnStackSegments)(s,u,Math.max(2,m)):null;if((O||I)&&!p)throw Error("Written arithmetic needs two operand rows, a calculation rule, and one result row.");if(q&&!y)throw Error("Written multiplication needs its expression, every place-value row, a rule, and a result.");if(P&&!d.length)throw Error("Written division needs at least one confirmed subtraction underline.");let S=y?y.rowsAbove.slice(-m):[],A=p?[p.operands[0],p.operands[1],p.result]:y?[...S,y.result]:s;if(A.length>32)throw Error("Calculation OCR detected "+A.length+" lines; the safety limit is 32.");let C=A.map(t=>{let r,a,i,o,s,u,c,d=(a=(r=(0,M.getOcrOperationSeparators)(t)).length?"operations:"+r.map(e=>String(e.source||"unknown")+":"+String(e.confidence||"normal")+":"+Math.round(e.x0)+"-"+Math.round(e.x1)).join(","):"operations:none",o=(i=(0,M.getOcrStructuralBars)(t)).length?"bars:"+i.map(e=>Math.round(e.x0)+"-"+Math.round(e.x1)).join(","):"bars:none",u=(s=(0,M.getOcrStructuralDelimiters)(t)).length?"delimiters:"+s.map(e=>e.kind+":"+Math.round(e.x0)+"-"+Math.round(e.x1)).join(","):"delimiters:none",c=t.plusMinusHints?.length?"plusminus:"+t.plusMinusHints.map(e=>Math.round(e.x0)+"-"+Math.round(e.y0)+"-"+Math.round(e.x1)+"-"+Math.round(e.y1)).join(","):"plusminus:none",tC(e)+"|"+t.fingerprint+"|"+a+"|"+o+"|"+u+"|"+c);if(th.has(d))return{segment:t,key:d,source:"cache",promise:Promise.resolve(th.get(d)||"")};let p=tm.get(d);return p&&p.generation===l?("foreground"===n&&(0,k.promoteOcrJob)(p.promise),{segment:t,key:d,source:"inflight",promise:p.promise}):{segment:t,key:d,source:"recognition",promise:null}}),_=new Map;for(let e of C)"recognition"===e.source&&_.set(e.key,e.segment);for(let[t,o]of _){let s=(0,k.enqueueOcrJob)(n,async()=>{if(tT(e,i,a),e.ensureLoaded)try{await e.ensureLoaded(!1)}catch(t){throw tT(e,i,a),t}if(tT(e,i,a),th.has(t))return th.get(t)||"";let n=await e2(e,o,r);return tT(e,i,a),n&&function(e,t){if(t)for(th.has(e)&&th.delete(e),th.set(e,t);th.size>128;){let e=th.keys().next();if(e.done)break;th.delete(e.value)}}(t,n),n}),u={promise:s,generation:l};tm.set(t,u);let c=()=>{tm.get(t)===u&&tm.delete(t)};s.then(c,c)}for(let e of C)"recognition"===e.source&&(e.promise=tm.get(e.key)?.promise||Promise.resolve(""));let R=await Promise.all(C.map(async e=>({bbox:e.segment.bbox,fingerprint:e.segment.fingerprint,latex:await (e.promise||Promise.resolve("")),source:e.source})));if(tT(e,i,a),p){let e=(0,w.normalizeOcrColumnDigits)(R[0]?.latex),t=(0,w.normalizeOcrColumnDigitsExact)(R[1]?.latex,I?"-":"+"),n=(0,w.normalizeOcrColumnDigits)(R[2]?.latex);if(!e||!t||!n)throw Error("Written arithmetic OCR did not return three plain integer rows.");let r=Math.max(e.length,t.length,n.length),a=new Set(p.rule.pathIndexes),l=c.filter(e=>e.rulePathIndexes.some(e=>a.has(e))),o=(0,w.mapOcrCarryOnesToColumns)(l,[{segment:p.operands[0],digitCount:e.length},{segment:p.result,digitCount:n.length}],r),s=o?I?(0,g.createColumnSubtractionSubmission)({operands:[e,t],result:n,borrows:o}):(0,f.createColumnAdditionSubmission)({operands:[e,t],result:n,carries:o}):null;if(!s)throw Error("Written carry or borrow marks could not be assigned to digit columns.");let u=[e,(I?"-":"+")+t,n],d=R.map((e,t)=>({...e,latex:u[t]||""}));return{kind:s.kind,lines:d,editableText:u.join("\n"),latex:(0,v.composeWrittenArithmeticLatex)(s),lineCount:(0,v.writtenArithmeticLayoutRowCount)(s),modelKey:i,cacheHits:C.filter(e=>"cache"===e.source).length,awaitedCount:C.filter(e=>"inflight"===e.source).length,recognizedCount:_.size,writtenSubmission:s}}if(y){let e=(0,x.parseColumnMultiplicationPrompt)(R[0]?.latex),t=R.slice(1,-1).map(e=>(0,w.normalizeOcrColumnDigitsExact)(e.latex,"+")),n=(0,w.normalizeOcrColumnDigits)(R[R.length-1]?.latex);if(!e||!n||t.some(e=>null===e)||t.length!==e.operands[0].length)throw Error("Written multiplication OCR did not return the expression, every place-value row, and result.");let r=t.map((t,n)=>{let r=e.operands[0].length-n-1;return{multiplicandColumn:r,shift:r,value:t||""}}),a=(0,x.createColumnMultiplicationSubmission)({operands:e.operands,partialProducts:r,result:n});if(!a)throw Error("Written multiplication rows are structurally invalid.");let l=[e.operands[0]+" \\cdot "+e.operands[1],...t.map(e=>"+"+e),n];return{kind:"column-multiplication",lines:R.map((e,t)=>({...e,latex:l[t]||""})),editableText:l.join("\n"),latex:(0,v.composeWrittenArithmeticLatex)(a),lineCount:(0,v.writtenArithmeticLayoutRowCount)(a),modelKey:i,cacheHits:C.filter(e=>"cache"===e.source).length,awaitedCount:C.filter(e=>"inflight"===e.source).length,recognizedCount:_.size,writtenSubmission:a}}if(P){let e=(0,b.parseColumnDivisionPrompt)(R[0]?.latex);if(!e?.authoredQuotient)throw Error("Written division OCR did not return a quotient in its first row.");let t=e.authoredQuotient,n=Math.floor((R.length-1)/2);if(R.length!==2*n+1||t.length!==n||d.length!==n)throw Error("Written division needs one product and one bring-down row per quotient digit. [rows="+R.length+", rules="+d.length+", quotientDigits="+t.length+"]");for(let e=0;e<n;e++){let t=A[1+2*e]?.bbox,n=A[2+2*e]?.bbox,r=d[e],a=t?t.y+t.height/2:NaN,i=n?n.y+n.height/2:NaN,l=(r.y0+r.y1)/2;if(!Number.isFinite(a)||!Number.isFinite(i)||!(a<l&&l<i))throw Error("Each written division product must be underlined before the next partial dividend.")}let r=e.dividend.length-t.length;if(r<0)throw Error("Written division quotient is wider than its dividend.");let a=[],l=[e.dividend+":"+e.divisor+"="+t],o="";for(let i=0;i<n;i++){let s=(0,w.normalizeOcrColumnDigitsExact)(R[1+2*i]?.latex,"-"),u=(0,w.normalizeOcrColumnDigitsExact)(R[2+2*i]?.latex);if(null===s||null===u)throw Error("Written division contains a non-integer step row.");let c=r+i,d=0===i?e.dividend.slice(0,c+1):o,p=i+1<n,h=p?u.slice(-1):null,m=(p?u.slice(0,-1)||"0":u).replace(/^0+(?=\d)/u,""),f=c+ +!!p;a.push({partialDividend:d,partialDividendStart:Math.max(0,c-d.length+1),partialDividendEnd:c,quotientDigit:t[i],subtractedProduct:s.replace(/^0+(?=\d)/u,""),subtractedProductStart:Math.max(0,c-s.length+1),remainder:m,remainderPosition:Math.max(0,f-u.length+1),broughtDownDigit:h,broughtDownPosition:p?c+1:null}),l.push("-"+s,u),o=u}let s=(0,b.createColumnDivisionSubmission)({dividend:e.dividend,divisor:e.divisor,quotient:t,remainder:e.authoredRemainder,steps:a});if(!s)throw Error("Written division steps are structurally invalid.");return{kind:"column-division",lines:R.map((e,t)=>({...e,latex:l[t]||""})),editableText:l.join("\n"),latex:(0,v.composeWrittenArithmeticLatex)(s),lineCount:(0,v.writtenArithmeticLayoutRowCount)(s),modelKey:i,cacheHits:C.filter(e=>"cache"===e.source).length,awaitedCount:C.filter(e=>"inflight"===e.source).length,recognizedCount:_.size,writtenSubmission:s}}let T=(0,M.normalizeCalculationLineSequence)(R.map(e=>e.latex));return{kind:"equation",lines:R.map((e,t)=>({...e,latex:T[t]||""})),editableText:T.join("\n"),latex:(0,M.composeMultilineLatex)(T),lineCount:R.length,modelKey:i,cacheHits:C.filter(e=>"cache"===e.source).length,awaitedCount:C.filter(e=>"inflight"===e.source).length,recognizedCount:_.size}}function tL(){let e=document.body;return!!(e&&(e.classList.contains("lia-course-frozen")||e.classList.contains("lia-snapshot-mode")))}function tz(e,t,n,r=!0,a=tf){_&&y&&(r&&(y.dataset.ocrBackground=e,y.dataset.ocrRevision=String(tf),y.dataset.ocrLineCount=String(Math.max(0,0|n)),!eg&&Q&&("scheduled"===e||"running"===e?tv<0&&tN("preparing"):"manual"===e?tv===tf&&""!==ty?tN("rendered"):tv>=0?tN("stale"):tN("ready"):"ready"===e?(Q.dataset.lineCount=String(Math.max(0,0|n)),tv===tf&&""!==ty&&ty===tb?.modelKey?tN("rendered"):tv>=0?tN("prepared-stale"):tN("prepared")):"error"===e?tN(tv>=0?"error-stale":"error"):"idle"===e&&"empty"===tM&&tN("empty"))),y.dispatchEvent(new CustomEvent("lia:canvasplus-ocr",{bubbles:!0,detail:{uid:B||"",phase:e,reason:t,revision:a,lineCount:Math.max(0,0|n),source:$?"background":"submit"}})))}function tO(){return e7.some(e=>e&&"path"===e.kind&&"eraser"!==e.tool&&Array.isArray(e.points)&&e.points.length>1)}function tI(){let e=t7();if(!e)return null;let t=Math.min(Number(e.x0),Number(e.x1)),n=Math.min(Number(e.y0),Number(e.y1)),r=Math.max(Number(e.x0),Number(e.x1)),a=Math.max(Number(e.y0),Number(e.y1)),i=6/Math.max(.001,eR.scale);return![t,n,r,a].every(isFinite)||r-t<i||a-n<i?null:{x0:t,y0:n,x1:r,y1:a}}function tq(e){if(!e||"path"!==e.kind||!Array.isArray(e.points)||e.points.length<2)return null;let t=1/0,n=1/0,r=-1/0,a=-1/0;for(let i of e.points)i&&isFinite(i.x)&&isFinite(i.y)&&(t=Math.min(t,Number(i.x)),n=Math.min(n,Number(i.y)),r=Math.max(r,Number(i.x)),a=Math.max(a,Number(i.y)));if(![t,n,r,a].every(isFinite))return null;let i=.5*Math.max(.5,Number(e.width)||1)+1;return{x0:t-i,y0:n-i,x1:r+i,y1:a+i}}function tP(){return"empty"===tM}function tN(e){Q&&(Q.dataset.state=e,Q.setAttribute("role",e.startsWith("error")?"alert":"status")),J&&("rendered"===e?(J.dataset.state="ready",J.dataset.stale="0"):"empty"===e?J.dataset.state="idle":"stale"===e||"error"===e?J.dataset.state=e:("prepared-stale"===e||"error-stale"===e)&&(J.dataset.state="stale",J.dataset.stale="1")),ex()}function tF(){return String(ei?.value||"").replace(/\r/g,"").split("\n").map(e=>e.trim()).filter(Boolean)}function tW(){let e=tF(),t=e.length>0&&e.length<=32,n=t?(0,M.findMissingPlusMinusRootLine)(e):-1;return eo&&(eo.disabled=!t),el&&(el.hidden=n<0),ei&&ei.setAttribute("aria-invalid",t?"false":"true"),eu&&(e.length?e.length>32?(eu.textContent=a("plus.editTooManyLines","Use at most {count} equations.").replace("{count}",String(32)),eu.dataset.state="error"):n>=0?(eu.textContent=a("plus.missingPlusMinus","Line {line}: no ± was recognized before the square root. Check the handwriting or insert it.").replace("{line}",String(n+1)),eu.dataset.state="warning"):(eu.textContent=a("plus.editLineCount","{count} equations ready.").replace("{count}",String(e.length)),eu.dataset.state="ready"):(eu.textContent=a("plus.editEmpty","Enter at least one equation."),eu.dataset.state="error")),t}function tD(e=!0){ea&&!ea.hidden&&(ea.hidden=!0,er&&er.setAttribute("aria-expanded","false"),e&&er?.isConnected&&requestAnimationFrame(()=>{try{er?.focus()}catch(e){}}))}function tj(e,t,n,r,a,i=null){if(z){if(!i||i.kind!==L)throw Error("Written arithmetic has no matching structured submission.");ed=i}else ed=null;let l=ec?.render(e,t);if(!l||!l.latex)throw Error("Calculation OCR has no renderable lines.");let o=z&&ed?(0,v.writtenArithmeticLayoutRowCount)(ed):l.lines.length;tv=t,ty=n,tw="correction"===r?{revision:t,modelKey:n,editableText:l.editableText,latex:l.latex,lineCount:l.lines.length}:null,J&&(J.hidden=!1,J.dataset.stale="0",J.dataset.latex=l.latex,J.dataset.lineCount=String(o),J.dataset.resultSource=r,J.removeAttribute("aria-busy")),er&&(er.disabled=z),j&&tS({v:"cr1",lines:l.lines.slice(),state:l.lines.length>1?"running":"ready",checks:[]},"calculation-render"),tD("correction"===r),tN("rendered");let s=z&&ed?(0,v.serializeWrittenArithmeticSubmission)(ed):(0,m.serializeCalculationSubmission)(l.lines),u=(0,m.extractCalculationEquation)(l.lines[0]||""),c=String(y?.dataset.calculationPrompt||u).trim(),d=s&&c?z?(0,v.validateWrittenArithmeticSubmission)(c,s):(0,m.validateCalculationSubmission)(c,s):null,p=d?.accepted===!0,h=!!s&&!!y&&D(y,s);y?.dispatchEvent(new CustomEvent("lia:canvasplus-answer",{bubbles:!0,detail:{uid:B||"",revision:t,lines:l.lines,latex:l.latex,value:s,submissionValue:s,pathAccepted:p,source:r,applied:h}})),y?.dispatchEvent(new CustomEvent("lia:canvasplus-render",{bubbles:!0,detail:{uid:B||"",revision:t,lineCount:o,lines:l.lines,latex:l.latex,source:r,preparedInBackground:a}}))}function t$(){if(!ei||nC||eg||tL()||tv!==tf||J?.dataset.stale==="1"||!tW())return;let e=J?.dataset.latex||"",t=tf,n=ty||tC(tA());tj(tF().join("\n"),t,n,"correction",!1);let r=ec?.getSnapshot();r&&y?.dispatchEvent(new CustomEvent("lia:canvasplus-correction",{bubbles:!0,detail:{uid:B||"",revision:t,previousLatex:e,latex:r.latex,lines:r.lines,lineCount:r.lines.length}}))}function tB(){J&&!(tv<0)&&(tw=null,tD(!1),ec?.markStale(),j&&tk&&tS({...tk,stale:1},"calculation-stale"),er&&(er.disabled=!0),J.dataset.stale="1",tN("stale"))}function tH(){y&&(delete y.dataset.ocrError,D(y,"")),tv=-1,ty="",tw=null,j&&tk&&(tk=null,t1("calculation-clear")),tM="empty",K&&(K.disabled=!0),er&&(er.disabled=!0),tD(!1),J&&(J.hidden=!0,J.dataset.stale="0",J.dataset.state="idle",J.removeAttribute("data-latex"),J.removeAttribute("data-line-count"),J.removeAttribute("aria-busy")),ee&&(ee.open=!1),ec?.clear(),ed=null,tN("empty")}function tU(){if(!_)return null;if(!tO())return tM="empty",null;let e=tI(),t=1/0,n=1/0,r=-1/0,a=-1/0;if(e)t=e.x0,n=e.y0,r=e.x1,a=e.y1;else for(let e of e7){if(!e||"path"!==e.kind||"eraser"===e.tool||!Array.isArray(e.points)||e.points.length<2)continue;let i=.5*Math.max(1,Number(e.width)||1)+2;for(let l of e.points)l&&isFinite(l.x)&&isFinite(l.y)&&(t=Math.min(t,l.x-i),n=Math.min(n,l.y-i),r=Math.max(r,l.x+i),a=Math.max(a,l.y+i))}if(!isFinite(t)||!isFinite(n)||!isFinite(r)||!isFinite(a))return null;t-=18,n-=18,a+=18;let i=Math.max(1,(r+=18)-t),l=Math.max(1,a-n),o=Math.max(1,Math.min(3,window.devicePixelRatio||1)),s=Math.max(1,Math.ceil(i*o)),u=Math.max(1,Math.ceil(l*o)),c=o*Math.min(1,3200/Math.max(s,u),Math.sqrt(3e6/Math.max(1,s*u))),d=Math.max(1,Math.round(i*c)),p=Math.max(1,Math.round(l*c)),h=document.createElement("canvas");h.width=d,h.height=p;let m=h.getContext("2d",{willReadFrequently:!0});if(!m)return null;for(let r of(m.clearRect(0,0,d,p),m.setTransform(c,0,0,c,-t*c,-n*c),m.save(),e&&(m.beginPath(),m.rect(e.x0,e.y0,e.x1-e.x0,e.y1-e.y0),m.clip()),e7))if(r&&"path"===r.kind&&Array.isArray(r.points)&&!(r.points.length<2)){m.save(),m.globalCompositeOperation="eraser"===r.tool?"destination-out":"source-over",m.globalAlpha=1,m.strokeStyle="#000",m.lineWidth=Math.max(.5,Number(r.width)||1),m.lineCap="round",m.lineJoin="round",m.beginPath(),m.moveTo(r.points[0].x,r.points[0].y);for(let e=1;e<r.points.length;e++)m.lineTo(r.points[e].x,r.points[e].y);m.stroke(),m.restore()}m.restore(),m.setTransform(1,0,0,1,0,0);let f=m.getImageData(0,0,d,p),g=d,x=p,b=-1,v=-1;for(let e=0;e<p;e++)for(let t=0;t<d;t++){let n=(e*d+t)*4;!(f.data[n+3]<=10)&&(t<g&&(g=t),e<x&&(x=e),t>b&&(b=t),e>v&&(v=e))}if(b<g||v<x)return tM="empty",null;let y=Math.max(6,Math.round(12*c));g=Math.max(0,g-y),x=Math.max(0,x-y);let w=(b=Math.min(d-1,b+y))-g+1,M=(v=Math.min(p-1,v+y))-x+1,k=document.createElement("canvas");k.width=w,k.height=M;let S=k.getContext("2d",{willReadFrequently:!0});if(!S)return null;let C=S.createImageData(w,M);for(let e=0;e<M;e++)for(let t=0;t<w;t++){let n=((x+e)*d+g+t)*4,r=(e*w+t)*4,a=f.data[n+3]>10?0:255;C.data[r]=a,C.data[r+1]=a,C.data[r+2]=a,C.data[r+3]=255}S.putImageData(C,0,0),k.__liaOcrPixelScale=c;let R=e7.filter(t=>{if(!t||"path"!==t.kind||"eraser"===t.tool||!Array.isArray(t.points)||t.points.length<2)return!1;if(!e)return!0;let n=tq(t);return!!(n&&n.x1>=e.x0&&n.x0<=e.x1&&n.y1>=e.y0&&n.y0<=e.y1)}),T=R.map(e=>({points:e.points,strokeWidth:Math.max(.5,Number(e.width)||1)})),E=e=>({...e,x0:Math.max(0,(e.x0-t)*c-g),y0:Math.max(0,(e.y0-n)*c-x),x1:Math.min(w-1,(e.x1-t)*c-g),y1:Math.min(M-1,(e.y1-n)*c-x)}),L=e=>{let t=Math.max(0,Math.floor(e.x0)),n=Math.max(0,Math.floor(e.y0)),r=Math.min(w-1,Math.ceil(e.x1)),a=Math.min(M-1,Math.ceil(e.y1)),i=new Set,l=new Set,o=0;for(let e=n;e<=a;e++)for(let n=t;n<=r;n++){let t=(e*w+n)*4;0===C.data[t]&&(o++,i.add(n),l.add(e))}return{ink:o,columns:i.size,rows:l.size,width:Math.max(1,r-t+1),height:Math.max(1,a-n+1)}},z=e=>{let t=L(e);return t.ink>=Math.max(6,.55*t.width)&&t.columns>=.7*t.width},O=N?(0,A.findOcrCalculationRuleHints)(T).filter(t=>!e||t.x0>=e.x0&&t.y0>=e.y0&&t.x1<=e.x1&&t.y1<=e.y1):[],I=F?(0,A.findOcrCarryOneHints)(T,O):[],q=P?(0,A.findOcrDivisionRuleHints)(T).filter(t=>!e||t.x0>=e.x0&&t.y0>=e.y0&&t.x1<=e.x1&&t.y1<=e.y1):[],W=O.map(E).filter(e=>e.x1>e.x0&&e.y1>=e.y0&&z(e)),D=new Set;for(let e of W)for(let t of e.pathIndexes)D.add(t);let j=I.map(E).filter(e=>e.x1>e.x0&&e.y1>e.y0&&e.rulePathIndexes.some(e=>D.has(e))&&(e=>{let t=L(e);if(t.ink<Math.max(4,(t.width+t.height)*.3)||t.rows<.62*t.height)return!1;let n=Math.max(0,Math.floor(e.x0)),r=Math.max(0,Math.floor(e.y0)),a=Math.min(w-1,Math.ceil(e.x1)),i=Math.min(M-1,Math.ceil(e.y1)),l=r+Math.floor((i-r+1)*.45),o=r+Math.ceil((i-r+1)*.48),s=[];for(let e=l;e<=i;e++)for(let t=n;t<=a;t++)0===C.data[(e*w+t)*4]&&s.push(t);if(!s.length)return!1;s.sort((e,t)=>e-t);let u=s[Math.floor(s.length/2)],c=Math.max(2,Math.ceil(.5*Math.max(u-n,a-u))),d=new Set,p=new Set;for(let e=r;e<=o;e++)for(let t=n;t<=a;t++)0===C.data[(e*w+t)*4]&&(Math.abs(t-u)<=c||(d.add(e),p.add(t)));return d.size>=1&&p.size>=1})(e)),$=q.map(E).filter(e=>e.x1>e.x0&&e.y1>=e.y0&&z(e));k.__liaOcrCalculationRules=W,k.__liaOcrCarryOneHints=j,k.__liaOcrDivisionRules=$;let B=R.map((e,t)=>({item:e,itemIndex:t})).filter(({item:t})=>{if(!e)return!0;let n=tq(t);return!!(n&&n.x0>=e.x0&&n.y0>=e.y0&&n.x1<=e.x1&&n.y1<=e.y1)}),H=B.map(({item:e})=>({points:e.points,strokeWidth:Math.max(.5,Number(e.width)||1)})),U=(0,A.findOcrDelimiterHints)(H).map(e=>({...e,pathIndexes:e.pathIndexes.map(e=>B[e].itemIndex)})).filter(t=>!e||t.x0>=e.x0&&t.y0>=e.y0&&t.x1<=e.x1&&t.y1<=e.y1),X=new Set;for(let e of U)for(let t of e.pathIndexes)X.add(t);k.__liaOcrDelimiterHints=U.map(e=>({x0:(e.x0-t)*c-g,y0:(e.y0-n)*c-x,x1:(e.x1-t)*c-g,y1:(e.y1-n)*c-x,kind:e.kind,pathIndexes:e.pathIndexes})).filter(e=>e.x1>=0&&e.y1>=0&&e.x0<w&&e.y0<M).map(e=>({...e,x0:Math.max(0,e.x0),y0:Math.max(0,e.y0),x1:Math.min(w-1,e.x1),y1:Math.min(M-1,e.y1)})),k.__liaOcrPlusMinusBoxes=(0,A.findOcrPlusMinusBoxes)(T).map(t=>e?{x0:Math.max(t.x0,e.x0),y0:Math.max(t.y0,e.y0),x1:Math.min(t.x1,e.x1),y1:Math.min(t.y1,e.y1)}:t).filter(e=>e.x1>e.x0&&e.y1>e.y0).map(e=>({x0:(e.x0-t)*c-g,y0:(e.y0-n)*c-x,x1:(e.x1-t)*c-g,y1:(e.y1-n)*c-x})).filter(e=>e.x1>=0&&e.y1>=0&&e.x0<w&&e.y0<M).map(e=>({x0:Math.max(0,e.x0),y0:Math.max(0,e.y0),x1:Math.min(w-1,e.x1),y1:Math.min(M-1,e.y1)}));let V=[];for(let r=0;r<R.length;r++){let a=R[r];if(X.has(r))continue;let i=a.points.filter(e=>e&&isFinite(e.x)&&isFinite(e.y));if(i.length<2||"hookless-bar"!==(0,A.classifyOcrVerticalSymbolPath)(T,r))continue;let l=1/0,o=1/0,s=-1/0,u=-1/0,d=0;for(let e=0;e<i.length;e++){let t=i[e];l=Math.min(l,t.x),o=Math.min(o,t.y),s=Math.max(s,t.x),u=Math.max(u,t.y),e>0&&(d+=Math.hypot(t.x-i[e-1].x,t.y-i[e-1].y))}let p=i[0],h=i[i.length-1],m=h.x-p.x,f=h.y-p.y,b=Math.hypot(m,f),v=Math.max(.5,Number(a.width)||1),y=Math.max(0,u-o);if(y<Math.max(6,8*v,1.8*Math.max(0,s-l))||Math.abs(f)<1.8*Math.abs(m)||b<.85*y||d>1.15*b)continue;let k=0;if(b>0)for(let e of i)k=Math.max(k,Math.abs(f*e.x-m*e.y+h.x*p.y-h.y*p.x)/b);if(k>Math.max(1.75*v,.055*y))continue;let S=.5*v+1,C=e?Math.max(l-S,e.x0):l-S,_=e?Math.max(o-S,e.y0):o-S,E=e?Math.min(s+S,e.x1):s+S,L=e?Math.min(u+S,e.y1):u+S;if(E<=C||L<=_)continue;let z=(C-t)*c-g,O=(_-n)*c-x,I=(E-t)*c-g,q=(L-n)*c-x;I<0||q<0||z>=w||O>=M||V.push({x0:Math.max(0,z),y0:Math.max(0,O),x1:Math.min(w-1,I),y1:Math.min(M-1,q),hasTopHook:!1,slantRatio:Math.abs(m)/Math.max(Math.abs(f),1e-6)})}return k.__liaOcrVerticalStrokes=V,k.__liaOcrRenderScope=e?"selection":"all",tM="present",k}async function tX(){if(!_||eg||nC||!t.isConnected||tL())return;if(y&&delete y.dataset.ocrError,i.LIA.lastCanvasPlusError="",!tO()||tP())return void tH();let e=tA();if(!e||!e.recognize){let e=a("plus.engineUnavailable","The calculation OCR engine is unavailable.");y&&(y.dataset.ocrError=e),i.LIA.lastCanvasPlusError=e,tN("error");return}let n=tf,r=tg,l=tC(e),o=()=>!nC&&!!t.isConnected&&n===tf&&r===tg&&l===tC(e)&&!tL();eg=!0,K&&(K.disabled=!0),er&&(er.disabled=!0),tD(!1),J&&J.setAttribute("aria-busy","true"),tN("running");try{if(tw&&tw.revision===n&&tw.modelKey===l)return void tj(tw.editableText,n,l,"correction",!1);let t=tb&&tb.modelKey===l?tb:null;if(!t){let n=tU();if(!n){if(tP())return void tH();throw Error("Calculation OCR could not prepare the handwriting image.")}t=await tE(e,n,"foreground",!1,o)}if(!o())throw t_();if(!t.latex.trim())throw Error("Calculation OCR returned no text.");tb=t,tj(t.editableText,n,l,"ocr",0===t.recognizedCount,t.writtenSubmission||null)}catch(t){if(tR(t))return void(tO()?tv>=0?tB():tN($?"preparing":"ready"):tH());let e=t&&t.message?String(t.message):String(t);y&&(y.dataset.ocrError=e),i.LIA.lastCanvasPlusError=e,ez("Calculation block render error: "+e),tv>=0&&J?.dataset.latex&&J&&!J.hidden?(J&&(J.hidden=!1,J.dataset.stale="1",J.removeAttribute("aria-busy")),tN("error-stale")):(J&&(J.hidden=!0,J.removeAttribute("data-latex"),J.removeAttribute("aria-busy")),ec?.clear(),tN("error"))}finally{J&&J.removeAttribute("aria-busy"),eg=!1,nh(),ex()}}function tV(e,t=1400){if(_){if(tx&&(clearTimeout(tx),tx=0),!tO()){tb=null,tz("idle",e,0);return}$?(tz("scheduled",e,tb?tb.lineCount:0),document.hidden||tL()||(tx=setTimeout(()=>{tx=0,tG(e)},Math.max(0,t)))):tz("manual",e,tb?tb.lineCount:0)}}function tY(e){_&&(tx&&(clearTimeout(tx),tx=0),tf++,tg++,tb=null,tw=null,tM="unknown",tO()?tB():tH(),tz(tO()?"stale":"idle",e,0),nh())}function tZ(e){if(!_)return}async function tG(e){if(!_||nC||!t.isConnected||document.hidden||tL())return;let n=tU();if(!n){tb=null,tP()?(tH(),tz("idle",e,0)):(ez("Calculation background OCR could not prepare the handwriting image."),tz("error",e,0));return}let r=tA();if(!r||!r.recognize)return void tz("error",e,0);let a=tf,i=tg,l=tC(r);tz("running",e,0);try{let l=await tE(r,n,"background",!0,()=>!nC&&!!t.isConnected&&a===tf&&i===tg&&!document.hidden&&!tL());tb=l,tz("ready",e,l.lineCount)}catch(n){if(tR(n)){if(nC||!t.isConnected)return;a!==tf||i!==tg?tz("discarded",e,0,!1,a):document.hidden||tL()?tz("scheduled","paused",0):tC(r)!==l?tV("model-change",80):tz("discarded",e,0,!1,a);return}if(a!==tf||i!==tg)return void tz("discarded",e,0,!1,a);ez("Calculation background OCR error: "+(n&&n.message?n.message:String(n))),tz("error",e,0)}}_&&y&&(y.dataset.ocrBackground="idle",y.dataset.ocrRevision="0",y.dataset.ocrLineCount="0"),K&&K.addEventListener("click",e=>{e.preventDefault(),e.stopPropagation(),tX()}),er&&er.addEventListener("click",e=>{e.preventDefault(),e.stopPropagation(),ea?.hidden?function(){if(!ea||!ei||!er||er.disabled||eg||tL())return;let e=ec?.getSnapshot();e&&tv===tf&&J?.dataset.stale!=="1"&&(ei.value=e.editableText,ei.rows=Math.max(3,Math.min(12,e.lines.length+1)),ea.hidden=!1,er.setAttribute("aria-expanded","true"),tW(),requestAnimationFrame(()=>{ei?.isConnected&&!ea?.hidden&&ei.focus()}))}():tD()}),ei&&(ei.addEventListener("input",tW),ei.addEventListener("keydown",e=>{"Escape"===e.key?(e.preventDefault(),e.stopPropagation(),tD()):"Enter"===e.key&&(e.ctrlKey||e.metaKey)&&(e.preventDefault(),t$())})),es&&es.addEventListener("click",e=>{e.preventDefault(),tD()}),eo&&eo.addEventListener("click",e=>{e.preventDefault(),t$()}),el&&el.addEventListener("click",e=>{e.preventDefault(),e.stopPropagation(),function(){if(!ei)return;let e=String(ei.value||"").replace(/\r/g,"").split("\n"),t=e.map(e=>e.trim()).filter(Boolean),n=(0,M.findMissingPlusMinusRootLine)(t);if(n<0)return;let r=0,a=-1;for(let t=0;t<e.length;t++){e[t].trim()&&a++;let i=a===n?(0,M.insertPlusMinusIntoIndexedRootSolution)(e[t]):null;if(null!==i){e[t]=i;let n=e.join("\n");ei.setRangeText(n,0,ei.value.length,"end"),ei.dispatchEvent(new Event("input",{bubbles:!0}));let a=r+Math.max(0,i.indexOf("\\pm")+3);ei.focus(),ei.setSelectionRange(a,a);return}r+=e[t].length+1}}()});let tK=()=>{!(!_||document.hidden||tL())&&y&&"scheduled"===y.dataset.ocrBackground&&tV("visible",80)};_&&document.addEventListener("visibilitychange",tK);let tQ=tL(),tJ=_&&document.body?new MutationObserver(()=>{let e=tL();if(e!==tQ){if(tQ=e,e){let e=document.activeElement;ea?.contains(e)&&e?.blur(),tD(!1),er&&(er.disabled=!0),eo&&(eo.disabled=!0),K&&(K.disabled=!0),ec?.pause(),tx&&(clearTimeout(tx),tx=0),tg++,tz(tO()?$?"scheduled":"manual":"idle","freeze",tb?tb.lineCount:0)}else ec?.resume(),!document.hidden&&tO()&&tV("unfreeze",80);nh()}}):null;function t0(e,t,n){return Math.max(t,Math.min(n,e))}function t1(n){var r;if(!B)return;let a={VIEW:{...eR},ITEMS:e7,REDO:te,bgMode:to,bgStep:ts,wrapW:t.getBoundingClientRect().width,canvasH:e.clientHeight};j&&tk&&(a.calculationReviewFreeze=tk),eC[B]=a,r=n||"persist",!B||eE&&(eL(),eT=setTimeout(()=>{eT=0,(0,o.__liaDispatchCanvasFreezeChange)({uid:B,reason:String(r||"persist"),hasItems:Array.isArray(e7)&&e7.length>0?1:0})},120))}function t2(){let e=l.COLORS[tr]||l.COLORS[0];return"auto"===e.key?(0,l.getAutoPen)():e.value||(0,l.getAutoPen)()}function t5(e){G&&(G.dataset.open=e?"1":"0")}function t4(){G&&"1"===G.dataset.open&&t5(!1)}function t8(){return'<svg viewBox="-1 0 24 24" aria-hidden="true" style="width:22px;height:22px;display:block;"><path class="ico-stroke" d="M6 6l12 12M18 6L6 18" stroke-width="2" stroke-linecap="round"/></svg>'}function t3(){if(!G)return;G.__mode="pen";let e=(0,l.getAutoPen)(),t="",n=R(s("pen","Pen")),r=R(s("closeMenu","Close menu"));t+=`<span class="lia-heading-row"><span class="lia-tool-heading">${n}</span><button class="lia-menu-icon-btn" type="button" data-act="close" aria-label="${r}">${t8()}</button></span><span class="lia-color-grid">`;for(let n=0;n<l.COLORS.length;n++){let r=l.COLORS[n],a="auto"===r.key?e:r.value||e,i=s("color."+r.key,C[r.key]||r.key),o=s("colorLabel","Color {color}").replace(/\{color\}/g,i);t+=`<button class="lia-color-item" type="button" data-act="color" data-idx="${n}" data-active="${n===tr?"1":"0"}" style="background:${a};" aria-label="${R(o)}"></button>`}G.innerHTML=t+=`</span><span class="lia-row"><span class="lia-preview"><span class="lia-preview-line" data-k="pw" style="height:${Math.max(2,Math.min(14,ta))}px;"></span></span><input class="lia-slider" type="range" min="1" max="100" step="1" value="${ta}" data-act="penWidth" aria-label="${R(s("penWidth","Pen width"))}"><span class="lia-menu-value" data-k="pwv" style="font-weight:800;min-width:2.6em;text-align:right">${ta}</span></span><span class="lia-row"><span class="lia-preview"><span class="lia-preview-line" data-k="pa" style="opacity:${ti};"></span></span><input class="lia-slider" type="range" min="0.15" max="1" step="0.05" value="${ti}" data-act="penAlpha" aria-label="${R(s("opacity","Opacity"))}"><span class="lia-menu-value" data-k="pav" style="font-weight:800;min-width:2.6em;text-align:right">${Math.round(100*ti)}%</span></span>`,G.onclick=e=>{let t=e.target&&e.target.closest?e.target.closest("[data-act]"):null;if(!t)return;let n=t.getAttribute("data-act");if("close"===n)return void t5(!1);if("color"===n){let e=Number(t.getAttribute("data-idx"));isFinite(e)&&(tr=t0(e,0,l.COLORS.length-1)),tt="pen",nh(),t1(),t3();return}};let a=G.querySelector('input[data-act="penWidth"]');a&&(a.oninput=()=>{ta=t0(Number(a.value),1,100),nh(),t1();let e=G.querySelector('[data-k="pw"]');e&&(e.style.height=Math.max(2,Math.min(14,ta))+"px");let t=G.querySelector('[data-k="pwv"]');t&&(t.textContent=String(ta))});let i=G.querySelector('input[data-act="penAlpha"]');i&&(i.oninput=()=>{ti=t0(Number(i.value),.05,1),nh(),t1();let e=G.querySelector('[data-k="pa"]');e&&(e.style.opacity=String(ti));let t=G.querySelector('[data-k="pav"]');t&&(t.textContent=Math.round(100*ti)+"%")})}function t6(){if(!G)return;G.__mode="eraser";let e=R(s("eraser","Eraser")),t=R(s("clearAll","Clear all")),n=R(s("closeMenu","Close menu")),r=R(s("eraserWidth","Eraser width"));G.innerHTML=`<span class="lia-heading-row"><span class="lia-tool-heading">${e}</span><span style="display:flex;gap:8px;align-items:center"><button class="lia-menu-icon-btn" type="button" data-act="clear" aria-label="${t}"><svg viewBox="-1 0 24 24" aria-hidden="true" style="width:22px;height:22px;display:block;"><path class="ico-stroke" d="M9 3h6" stroke-width="2" stroke-linecap="round"/><path class="ico-stroke" d="M4 6h16" stroke-width="2" stroke-linecap="round"/><path class="ico-stroke" d="M7 6l1 15h8l1-15" stroke-width="2" stroke-linejoin="round"/><path class="ico-stroke" d="M10 10v8M14 10v8" stroke-width="2" stroke-linecap="round"/></svg></button><button class="lia-menu-icon-btn" type="button" data-act="close" aria-label="${n}">${t8()}</button></span></span><span class="lia-row"><span class="lia-preview"><span class="lia-preview-line lia-preview-line--eraser" style="height:${Math.max(2,Math.min(18,tl))}px;"></span></span><input class="lia-slider" type="range" min="4" max="500" step="1" value="${tl}" data-act="eraserWidth" aria-label="${r}"><span class="lia-menu-value" data-k="ewv" style="font-weight:800;min-width:2.6em;text-align:right">${tl}</span></span>`,G.onclick=e=>{let t,n,r=e.target?.closest?.("[data-act]");if(!r)return;let a=r.getAttribute("data-act");"close"===a?t5(!1):"clear"===a&&(t=e7.some(e=>e&&"path"===e.kind),n=e7.some(e=>e&&"rect"===e.kind),e7.length=0,te.length=0,nu(),nc(),nd(),nh(),t1(),(t||n)&&(tY("clear"),tV("clear")))};let a=G.querySelector('input[data-act="eraserWidth"]');a&&(a.oninput=()=>{tl=t0(Number(a.value),2,500),nh(),t1();let e=G.querySelector('[data-k="ewv"]');e&&(e.textContent=String(tl))})}function t9(){if(!G)return;G.__mode="bg";let e=R(s("background","Background")),t=R(s("closeMenu","Close menu")),n=R(s("noBackground","No background")),r=R(s("grid","Grid")),a=R(s("lined","Lined")),i=R(s("spacing","Spacing")),o=R(s("backgroundSpacing","Background spacing"));G.innerHTML=`<span class="lia-heading-row"><span class="lia-tool-heading">${e}</span><button class="lia-menu-icon-btn" type="button" data-act="close" aria-label="${t}">${t8()}</button></span><span class="lia-bg-tiles"><button class="lia-bg-tile" type="button" data-act="bg" data-mode="none" data-active="${"none"===to?"1":"0"}" aria-label="${n}"></button><button class="lia-bg-tile" type="button" data-act="bg" data-mode="grid" data-active="${"grid"===to?"1":"0"}" aria-label="${r}"></button><button class="lia-bg-tile" type="button" data-act="bg" data-mode="lined" data-active="${"lined"===to?"1":"0"}" aria-label="${a}"></button></span><span class="lia-row"><span class="lia-menu-label" style="font-weight:800;opacity:.8;min-width:4.8em">${i}</span><input class="lia-slider" type="range" min="8" max="80" step="1" value="${ts}" data-act="bgStep" aria-label="${o}"><span class="lia-menu-value" data-k="bgsv" style="font-weight:800;min-width:2.6em;text-align:right">${ts}</span></span>`;try{let e=(0,l.rgbaFromAny)((0,l.getAccentCssVar)(),.65),t=G.querySelectorAll(".lia-bg-tile");t&&t.length>=3&&(t[1].style.backgroundImage=`linear-gradient(to right, ${e} 2px, transparent 2px), linear-gradient(to bottom, ${e} 2px, transparent 2px)`,t[1].style.backgroundSize="10px 10px",t[1].style.backgroundPosition="center",t[2].style.backgroundImage=`linear-gradient(to bottom, ${e} 2px, transparent 2px)`,t[2].style.backgroundSize="10px 10px",t[2].style.backgroundPosition="center")}catch(e){}G.onclick=e=>{let t=e.target?.closest?.("[data-act]");if(!t)return;let n=t.getAttribute("data-act");if("close"===n)return void t5(!1);if("bg"===n){let e=String(t.getAttribute("data-mode")||"none");to="grid"===e||"lined"===e?e:"none",nd(),t1(),t9(),nh();return}};let u=G.querySelector('input[data-act="bgStep"]');u&&(u.oninput=()=>{ts=t0(Number(u.value),6,300),nd(),t1();let e=G.querySelector('[data-k="bgsv"]');e&&(e.textContent=String(ts))})}function t7(){for(let e=e7.length-1;e>=0;e--){let t=e7[e];if(t&&"rect"===t.kind)return t}return null}function ne(){ey&&(ey.dataset.on="0")}function nt(t,n){if(!ey)return;if("eraser"!==tt||!isFinite(t)||!isFinite(n))return void ne();let r=Math.max(8,tl*eR.scale);ey.style.width=r+"px",ey.style.height=r+"px",ey.style.left=t0(t,0,e.clientWidth)+"px",ey.style.top=t0(n,0,e.clientHeight)+"px",ey.dataset.on="1"}tJ&&document.body&&tJ.observe(document.body,{attributes:!0,attributeFilter:["class"]});let nn=0;function nr(){nn||(nn=requestAnimationFrame(()=>{nn=0,function(){let t=t7();if(!t){ep.style.display="none",ev&&(ev.style.display="none");return}let n=Math.min(t.x0,t.x1),r=Math.min(t.y0,t.y1),a=Math.max(t.x0,t.x1),i=Math.max(t.y0,t.y1),l=ni(n,r),o=ni(a,i);if(_)ep.style.display="none";else{ep.style.display="block",ep.style.visibility="hidden";let t=ep.offsetWidth||180,n=ep.offsetHeight||34;ep.style.visibility="visible";let r=Math.max(l.sx,o.sx),a=Math.max(l.sy,o.sy),i=t0(r-t,6,e.clientWidth-t-6),s=t0(a+8,6,e.clientHeight-n-6);if(ep.style.left=i+"px",ep.style.top=s+"px",eh){eh.style.width=t+"px";let n=eh.offsetHeight||26;eh.style.left=t0(i,6,e.clientWidth-t-6)+"px",eh.style.top=t0(s-n-6,6,e.clientHeight-n-6)+"px"}}if(ev){ev.style.display="block",ev.style.visibility="hidden";let t=ev.offsetWidth||24,n=ev.offsetHeight||24;ev.style.visibility="visible";let r=Math.min(l.sy,o.sy),a=Math.max(l.sx,o.sx);ev.style.left=t0(a-.5*t,6,e.clientWidth-t-6)+"px",ev.style.top=t0(r-.5*n,6,e.clientHeight-n-6)+"px"}}()}))}function na(e,t){return{x:(e-eR.panX)/eR.scale,y:(t-eR.panY)/eR.scale}}function ni(e,t){return{sx:e*eR.scale+eR.panX,sy:t*eR.scale+eR.panY}}function nl(e){let t=window.devicePixelRatio||1;e.setTransform(t*eR.scale,0,0,t*eR.scale,t*eR.panX,t*eR.panY)}function no(t){let n=window.devicePixelRatio||1;t.setTransform(n,0,0,n,0,0),t.globalCompositeOperation="source-over",t.globalAlpha=1,t.clearRect(0,0,e.clientWidth,e.clientHeight)}function ns(e,t){"eraser"===t.tool?(e.globalCompositeOperation="destination-out",e.globalAlpha=1,e.strokeStyle="rgba(0,0,0,1)"):(e.globalCompositeOperation="source-over",e.globalAlpha=t.alpha,e.strokeStyle=t.color),e.lineWidth=t.width,e.lineCap="round",e.lineJoin="round"}function nu(){for(let e of(no(ek),nl(ek),e7)){if(!e||"rect"!==e.kind)continue;let t="accent"===e.colorKey?(0,l.getAccentCssVar)():e.color||(0,l.getAccentCssVar)(),n=(0,l.rgbaFromAny)(t,Math.max(0,Math.min(1,e.alpha))),r=Math.min(e.x0,e.x1),a=Math.min(e.y0,e.y1),i=Math.max(e.x0,e.x1),o=Math.max(e.y0,e.y1);ek.save(),ek.globalCompositeOperation="source-over",ek.globalAlpha=1,ek.fillStyle=n,ek.fillRect(r,a,Math.max(0,i-r),Math.max(0,o-a)),ek.restore()}}function nc(){for(let e of(no(eA),nl(eA),e7))if(e&&"path"===e.kind&&e.points&&!(e.points.length<2)){ns(eA,e),eA.beginPath(),eA.moveTo(e.points[0].x,e.points[0].y);for(let t=1;t<e.points.length;t++)eA.lineTo(e.points[t].x,e.points[t].y);eA.stroke()}tu&&Array.isArray(tu.points)&&(td=tu.points.length)}function nd(){let t;t=window.devicePixelRatio||1,ew.setTransform(t,0,0,t,0,0),ew.globalCompositeOperation="source-over",ew.globalAlpha=1,ew.clearRect(0,0,e.clientWidth,e.clientHeight),function(){let t,n;if("none"===to)return;let r=window.devicePixelRatio||1;ew.setTransform(r*eR.scale,0,0,r*eR.scale,r*eR.panX,r*eR.panY);let a=Math.max(6,Number(ts)||24),i=(t=e.clientWidth,n=e.clientHeight,{x0:(0-eR.panX)/eR.scale,y0:(0-eR.panY)/eR.scale,x1:(t-eR.panX)/eR.scale,y1:(n-eR.panY)/eR.scale}),o=(0,l.rgbaFromAny)((0,l.getAccentCssVar)(),.65);ew.save(),ew.globalCompositeOperation="source-over",ew.globalAlpha=1,ew.strokeStyle=o,ew.lineWidth=1.125/eR.scale;let s=Math.floor(i.x0/a)*a,u=Math.ceil(i.x1/a)*a,c=Math.floor(i.y0/a)*a,d=Math.ceil(i.y1/a)*a;if(ew.beginPath(),"grid"===to){let e=0;for(let t=s;t<=u&&(ew.moveTo(t,i.y0),ew.lineTo(t,i.y1),!(++e>4e3));t+=a);for(let t=c;t<=d&&(ew.moveTo(i.x0,t),ew.lineTo(i.x1,t),!(++e>4e3));t+=a);}else{let e=0;for(let t=c;t<=d&&(ew.moveTo(i.x0,t),ew.lineTo(i.x1,t),!(++e>4e3));t+=a);}ew.stroke(),ew.restore()}();let n=window.devicePixelRatio||1;if(ew.setTransform(n,0,0,n,0,0),ew.globalCompositeOperation="source-over",ew.globalAlpha=1,ew.drawImage(eM,0,0,eM.width,eM.height,0,0,e.clientWidth,e.clientHeight),tc){let e=(0,l.rgbaFromAny)((0,l.getAccentCssVar)(),.28),t=Math.min(tc.x0,tc.x1),n=Math.min(tc.y0,tc.y1),r=Math.max(tc.x0,tc.x1),a=Math.max(tc.y0,tc.y1),i=ni(t,n),o=ni(r,a);ew.save(),ew.fillStyle=e,ew.globalAlpha=1,ew.fillRect(i.sx,i.sy,Math.max(0,o.sx-i.sx),Math.max(0,o.sy-i.sy)),ew.restore()}ew.drawImage(eS,0,0,eS.width,eS.height,0,0,e.clientWidth,e.clientHeight),nr()}function np(){if(!tu||!Array.isArray(tu.points))return!1;let e=tu.points,t=e.length;if(t<=Math.max(1,td))return!1;let n=Math.max(0,td-1),r=e[n];if(!r)return!1;nl(eA),ns(eA,tu),eA.beginPath(),eA.moveTo(r.x,r.y);for(let r=n+1;r<t;r++){let t=e[r];t&&eA.lineTo(t.x,t.y)}return eA.stroke(),td=t,!0}function nh(){let e=t2(),t=(0,l.getAccentCssVar)(),n=s("pen","Pen"),r=s("eraser","Eraser");if(H){let e=s("undo","Undo");H.disabled=0===e7.length,H.title=e,H.setAttribute("aria-label",e)}if(U){let e=s("redo","Redo");U.disabled=0===te.length,U.title=e,U.setAttribute("aria-label",e)}if(X&&(X.style.background=e,X.dataset.active="pen"===tt?"1":"0",X.title=n,X.setAttribute("aria-label",n)),V&&(V.dataset.active="eraser"===tt?"1":"0",V.title=r,V.setAttribute("aria-label",r)),Y){let e=_?a("plus.selectArea","Select render area"):a("selectSubmit","Submit as Solution");Y.style.background="transparent",Y.dataset.active="rect"===tt?"1":"0",Y.setAttribute("aria-pressed","rect"===tt?"true":"false"),Y.title=e,Y.setAttribute("aria-label",e)}if(Z){let e=s("background","Background"),n=(0,l.rgbaFromAny)(t,.65);Z.style.backgroundColor="transparent",Z.style.backgroundImage=`linear-gradient(to right, ${n} 1.8px, transparent 1.8px), linear-gradient(to bottom, ${n} 1.8px, transparent 1.8px)`,Z.style.backgroundSize="6px 6px",Z.style.backgroundPosition="center",Z.dataset.active="bg"===tn?"1":"0",Z.title=e,Z.setAttribute("aria-label",e)}K&&(K.disabled=eg||!tO()||tP()||tL()),er&&(er.disabled=eg||!ec?.getSnapshot()||!!J?.hidden||J?.dataset.stale==="1"||tv!==tf||tL()),"eraser"!==tt&&ne()}function nm(e,t){tu&&tu.points.push({x:e,y:t})}function nf(e,t){if(!tu)return!1;let n=Array.isArray(tu.points)?tu.points.length:0;return!function(e,t){if(!tu)return;let n=tu.points,r=n&&n.length?n[n.length-1]:null;if(!r){let n=na(e,t);nm(n.x,n.y);return}let a=ni(r.x,r.y),i=e-a.sx,l=t-a.sy,o=Math.hypot(i,l);if(o<.35)return;if(o>1.4){let e=Math.min(12,Math.max(0,Math.floor(o/1.4)));for(let t=1;t<=e;t++){let n=t/(e+1),r=na(a.sx+i*n,a.sy+l*n);nm(r.x,r.y)}}let s=na(e,t);nm(s.x,s.y)}(e,t),Array.isArray(tu.points)&&tu.points.length>n}function ng(){let e=tu;tp&&(cancelAnimationFrame(tp),tp=0),np()&&nd(),tu=null,td=0,e&&"path"===e.kind&&Array.isArray(e.points)&&(e.points.length>1&&(tM="unknown"),tV(e.points.length>1?"stroke-end":"stroke-tap")),e&&t1("stroke-end")}function nx(e){if(!tc)return;let t=!1;if(e){let e=Math.min(tc.x0,tc.x1),n=Math.min(tc.y0,tc.y1),r=Math.max(tc.x0,tc.x1),a=Math.max(tc.y0,tc.y1),i=_?6/Math.max(.001,eR.scale):.001;if(r-e>=i&&a-n>=i){for(let e=e7.length-1;e>=0;e--)e7[e]&&"rect"===e7[e].kind&&e7.splice(e,1);for(let e=te.length-1;e>=0;e--)te[e]&&"rect"===te[e].kind&&te.splice(e,1);e7.push({kind:"rect",x0:e,y0:n,x1:r,y1:a,alpha:.28,colorKey:"accent"}),te.length=0,t=!0}}tc=null,nu(),nd(),nh(),t1(),nr(),t&&(tY("selection-change"),tV("selection-change"))}function nb(){ne();let t=window.devicePixelRatio||1,n=e.clientWidth,r=e.clientHeight,a=Math.max(1,Math.round(n*t)),i=Math.max(1,Math.round(r*t));(e.width!==a||e.height!==i||eM.width!==a||eM.height!==i||eS.width!==a||eS.height!==i)&&(e.width=a,e.height=i,eM.width=a,eM.height=i,eS.width=a,eS.height=i,nu(),nc(),nd(),nh(),t1(),tZ("resize"),tV("resize"))}nh(),nb(),ex();let nv=new ResizeObserver(()=>nb());nv.observe(e),!function(){if(t.__cornersReady)return;t.__cornersReady=!0;let n=document.createElement("button");n.type="button",n.className="lia-resize-corner",n.dataset.corner="bl",n.setAttribute("aria-label",s("resizeBottomLeft","Resize drawing area from the bottom left"));let r=document.createElement("button");r.type="button",r.className="lia-resize-corner",r.dataset.corner="br",r.setAttribute("aria-label",s("resizeBottomRight","Resize drawing area from the bottom right")),t.appendChild(n),t.appendChild(r);let a=(e,t,n)=>Math.max(t,Math.min(n,e));function i(n,r){let i=!1,l=0,o=0,s=0,u=0;function c(e){if(i){i=!1;try{n.releasePointerCapture(e.pointerId)}catch(e){}nb(),t1()}}n.addEventListener("pointerdown",function(r){t4(),r.preventDefault(),r.stopPropagation(),i=!0,s=t.getBoundingClientRect().width,u=e.clientHeight||245,l=r.clientX,o=r.clientY;try{n.setPointerCapture(r.pointerId)}catch(e){}}),n.addEventListener("pointermove",function(n){if(!i)return;n.preventDefault();let c=n.clientX-l,d=n.clientY-o;e.style.height=a(u+d,130,9e3)+"px";let p=function(){let e=t.closest(".lia-canvas-mount")||t.parentElement||t,n=0;try{n=e.getBoundingClientRect().width}catch(e){}if((!n||n<200)&&document.querySelector("main"))try{n=document.querySelector("main").getBoundingClientRect().width}catch(e){}return Math.max(200,Math.floor(n||200))}();t.style.width=a("br"===r?s+c:s-c,200,p)+"px"}),n.addEventListener("pointerup",c),n.addEventListener("pointercancel",c)}i(r,"br"),i(n,"bl")}();let ny=()=>{(0,u.__liaRefreshAllTexPreviewBorders)(document),nh(),nu(),nc(),nd()};document.addEventListener("lia-canvas-theme",ny),H&&!H.__bound&&(H.__bound=!0,H.addEventListener("click",e=>{e.preventDefault(),e.stopPropagation(),function(){if(!e7.length)return;let e=e7.pop();te.push(e),nu(),nc(),nd(),nh(),t1(),e&&("path"===e.kind||"rect"===e.kind)&&(tY("undo"),tV("undo"))}()})),U&&!U.__bound&&(U.__bound=!0,U.addEventListener("click",e=>{e.preventDefault(),e.stopPropagation(),function(){if(!te.length)return;let e=te.pop();e7.push(e),nu(),nc(),nd(),nh(),t1(),e&&("path"===e.kind||"rect"===e.kind)&&(tY("redo"),tV("redo"))}()})),Y&&!Y.__bound&&(Y.__bound=!0,Y.addEventListener("click",e=>{e.stopPropagation(),tt="rect",tn="rect",t5(!1),nh()})),X&&G&&X.addEventListener("click",e=>{e.stopPropagation(),tt="pen",tn="pen";let t="1"===G.dataset.open,n="pen"===G.__mode;t&&n||t3(),t5(!t||!n),nh()}),V&&G&&V.addEventListener("click",e=>{e.stopPropagation(),tt="eraser",tn="eraser";let t="1"===G.dataset.open,n="eraser"===G.__mode;t&&n||t6(),t5(!t||!n),nh()}),Z&&G&&Z.addEventListener("click",e=>{e.stopPropagation(),tn="bg";let t="1"===G.dataset.open,n="bg"===G.__mode;t&&n||t9(),t5(!t||!n),nh()});let nw=e=>{t.contains(e.target)||t5(!1)},nM=e=>{"Escape"===e.key&&t5(!1)};document.addEventListener("click",nw),document.addEventListener("keydown",nM);let nk=!1,nS=e=>{"Space"===e.code&&(nk=!0)},nA=e=>{"Space"===e.code&&(nk=!1)};window.addEventListener("keydown",nS),window.addEventListener("keyup",nA);let nC=!1,n_=null,nR=y?.parentElement||t.parentElement||document.body;function nT(e){return Math.max(eR.minScale,Math.min(eR.maxScale,e))}(n_=new MutationObserver(()=>{t.isConnected||function(){if(!nC){for(let e of(nC=!0,nv.disconnect(),e4&&(cancelAnimationFrame(e4),e4=0),nn&&(cancelAnimationFrame(nn),nn=0),tp&&(cancelAnimationFrame(tp),tp=0),e3&&(clearTimeout(e3),e3=0),eT&&(clearTimeout(eT),eT=0),tx&&(clearTimeout(tx),tx=0),tg++,th.clear(),tm.clear(),tD(!1),ec?.destroy(),tJ&&tJ.disconnect(),r))n.activePenPointers.delete(e);r.clear(),nE.clear(),document.removeEventListener("lia:canvas-i18n-update",eb),document.removeEventListener("lia-canvas-theme",ny),document.removeEventListener("visibilitychange",tK),document.removeEventListener("click",nw),document.removeEventListener("keydown",nM),window.removeEventListener("keydown",nS),window.removeEventListener("keyup",nA),n_&&(n_.disconnect(),n_=null)}}()})).observe(nR,{childList:!0}),e.addEventListener("contextmenu",e=>e.preventDefault()),e.addEventListener("wheel",t=>{t4(),t.preventDefault(),ne();let n=e.getBoundingClientRect();!function(e,t,n){let r=eR.scale,a=nT(r*e);if(a===r)return;let i=na(t,n);eR.scale=a,eR.panX=t-i.x*a,eR.panY=n-i.y*a,nu(),nc(),nd(),t1(),tZ("zoom"),tV("zoom")}(Math.exp(-(.0012*t.deltaY)),t.clientX-n.left,t.clientY-n.top)},{passive:!1});let nE=new Map,nL="idle",nz=0,nO=0,nI=null;function nq(t,n=e.getBoundingClientRect()){return{sx:t.clientX-n.left,sy:t.clientY-n.top}}function nP(e,t){return Math.hypot(e.sx-t.sx,e.sy-t.sy)}function nN(e,t){return{sx:(e.sx+t.sx)/2,sy:(e.sy+t.sy)/2}}function nF(t){"pen"===String(t.pointerType||"").toLowerCase()&&(r.delete(t.pointerId),n.activePenPointers.delete(t.pointerId)),ne(),nE.has(t.pointerId)&&nE.delete(t.pointerId);try{e.releasePointerCapture(t.pointerId)}catch(e){}if("pinch"===nL){nE.size<2&&(nI=null,nL="idle",tZ("pinch"),tV("pinch"));return}if("pan"===nL){nL="idle",e.style.cursor="crosshair",tZ("pan"),tV("pan");return}if("rect"===nL){0===nE.size&&(nx("pointerup"===t.type),nL="idle");return}if("draw"===nL){if("pointerup"===t.type){let e=nq(t);nf(e.sx,e.sy)}ng(),nL="idle",nh();return}}e.addEventListener("pointerdown",t=>{let a,i;if("pen"===String(t.pointerType||"").toLowerCase()&&(r.add(t.pointerId),n.activePenPointers.add(t.pointerId)),"touch"===String(t.pointerType||"").toLowerCase()&&n.activePenPointers.size>0){t.cancelable&&t.preventDefault(),t.stopPropagation();return}if(t4(),t.target?.classList?.contains("lia-resize-corner"))return;let l=nq(t);if(nE.set(t.pointerId,l),e.setPointerCapture(t.pointerId),2===nE.size){ne(),"draw"===nL&&ng(),"rect"===nL&&nx(!1);let e=Array.from(nE.values()),t=nN(e[0],e[1]);nI={dist:Math.max(1e-6,nP(e[0],e[1])),worldMid:na(t.sx,t.sy),startScale:eR.scale},nL="pinch";return}let o="mouse"===t.pointerType&&2===t.button,s="mouse"===t.pointerType&&1===t.button;if(o||s||"mouse"===t.pointerType&&nk){ne(),nL="pan",nz=l.sx,nO=l.sy,e.style.cursor="grab";return}if("rect"===tt){let t;ne(),nL="rect",e.style.cursor="crosshair",tc={x0:(t=na(l.sx,l.sy)).x,y0:t.y,x1:t.x,y1:t.y},nd();return}nL="draw",e.style.cursor="crosshair",a=na(l.sx,l.sy),i={kind:"path",tool:tt,color:t2(),alpha:ti,width:"eraser"===tt?tl:ta,points:[{x:a.x,y:a.y}]},e7.push(i),tu=i,te.length=0,td=1,tY("stroke-start"),eL(),nh(),"eraser"===tt?nt(l.sx,l.sy):ne()}),e.addEventListener("pointermove",t=>{if("pen"===String(t.pointerType||"").toLowerCase()&&(t.pressure>0||0!==t.buttons?(r.add(t.pointerId),n.activePenPointers.add(t.pointerId)):(r.delete(t.pointerId),n.activePenPointers.delete(t.pointerId))),"touch"===String(t.pointerType||"").toLowerCase()&&n.activePenPointers.size>0){nE.has(t.pointerId)&&nE.delete(t.pointerId),t.cancelable&&t.preventDefault(),t.stopPropagation();return}if(!nE.has(t.pointerId))return;let a=e.getBoundingClientRect(),i=nq(t,a);if(nE.set(t.pointerId,i),"eraser"===tt&&"pan"!==nL&&"pinch"!==nL&&"rect"!==nL?nt(i.sx,i.sy):ne(),"pinch"===nL&&nE.size>=2&&nI){let e=Array.from(nE.values()).slice(0,2),t=nN(e[0],e[1]),n=Math.max(1e-6,nP(e[0],e[1])),r=nT(nI.startScale*(n/nI.dist));eR.scale=r,eR.panX=t.sx-nI.worldMid.x*r,eR.panY=t.sy-nI.worldMid.y*r,nu(),nc(),nd(),t1();return}if("pan"===nL){let e=i.sx-nz,t=i.sy-nO;nz=i.sx,nO=i.sy,eR.panX+=e,eR.panY+=t,nu(),nc(),nd(),t1();return}if("rect"===nL)return void function(e,t){if(!tc)return;let n=na(e,t);tc.x1=n.x,tc.y1=n.y,nd()}(i.sx,i.sy);if("draw"===nL){let e=!1;if("function"==typeof t.getCoalescedEvents){let n=t.getCoalescedEvents();if(Array.isArray(n)&&n.length)for(let t of n){if(!t)continue;let n=nq(t,a);e=nf(n.sx,n.sy)||e}}(e=nf(i.sx,i.sy)||e)&&(tp||(tp=requestAnimationFrame(()=>{tp=0,np()&&nd()})))}}),e.addEventListener("pointerup",nF),e.addEventListener("pointercancel",nF),e.addEventListener("pointerleave",t=>{"pen"===String(t.pointerType||"").toLowerCase()&&(r.delete(t.pointerId),n.activePenPointers.delete(t.pointerId)),ne();let a="draw"===nL,i="rect"===nL;a&&ng(),i&&nx(!1),"pinch"!==nL&&(nL="idle"),e.style.cursor="crosshair",nh(),a||t1()}),eE=!0,_&&tO()&&tV("restore")}(e)}),(0,u.__liaInitTexPreviews)()}},{"../index":"gFFiE","./theme":"3aqKC","./store":"8Sk5l","./freeze":"8S2RV","../lia/input":"3dckU","../lia/i18n":"lednP","@parcel/transformer-js/src/esmodule-helpers.js":"b0H7B","../ocr/layout":"9tjfg","../ocr/job-queue":"jl9tP","../lia/calculation-review":"NhOuh","../ocr/formulanet-engine":"70e9m","../ocr/symbol-geometry":"aw2PO","../math/equivalence":"dFsXY","../math/expected-calculation":"jD8Ho","../lia/calculation-options":"jx05g","./calculation-freeze":"jvdAp","../math/column-arithmetic":"ewiNe","../ocr/column-layout":"hjtPZ","../math/column-subtraction":"7mdjG","../math/column-multiplication":"luDfW","../math/column-division":"cHQYJ","../math/written-arithmetic":"jUsUh"}],jl9tP:[function(e,t,n,r){var a=e("@parcel/transformer-js/src/esmodule-helpers.js");a.defineInteropFlag(n),a.export(n,"enqueueOcrJob",()=>d),a.export(n,"promoteOcrJob",()=>p);let i=!1,l=0,o=[],s=new WeakMap;function u(e){return+("foreground"!==e)}function c(){if(i||!o.length)return;o.sort((e,t)=>u(e.priority)-u(t.priority)||e.sequence-t.sequence);let e=o.shift();e.started=!0,i=!0,Promise.resolve().then(e.task).then(t=>{e.resolve(t),i=!1,c()},t=>{e.reject(t),i=!1,c()})}function d(e,t){let n,r=new Promise((r,a)=>{n={priority:e,sequence:l++,started:!1,task:t,resolve:r,reject:a}}),a=n;return o.push(a),s.set(r,a),c(),r}function p(e){let t=s.get(e);t&&!t.started&&"foreground"!==t.priority&&(t.priority="foreground",c())}},{"@parcel/transformer-js/src/esmodule-helpers.js":"b0H7B"}],NhOuh:[function(e,t,n,r){var a=e("@parcel/transformer-js/src/esmodule-helpers.js");a.defineInteropFlag(n),a.export(n,"createCalculationReview",()=>p);var i=e("./input"),l=e("../ocr/layout"),o=e("../math/equivalence");let s=0;function u(e){return"column-addition"===e||"column-subtraction"===e||"column-multiplication"===e||"column-division"===e}function c(e,t,n,r){let a=document.createElement(t);return a.className=n,"string"==typeof r&&(a.textContent=r),e.appendChild(a),a}function d(e,t){let n=String(e||"");for(let[e,r]of Object.entries(t))n=n.replace(RegExp("\\{"+e+"\\}","g"),String(r));return n}function p(e){let t=++s,n=0,r=0,a=!1,p=!1,h=!1,m=!1,f=null,g=null,x=[],b=[],v=null,y=0,w=null,M=e.translate;function k(e,t,n,r=!1){let a={from:t+1,to:n+1};return r?d(M("ocr.plus.validation.transitionStale","Transition from line {from} to line {to}: result is outdated."),a):"valid"===e?d(M("ocr.plus.validation.transitionValid","Transition from line {from} to line {to}: correct."),a):"invalid"===e?d(M("ocr.plus.validation.transitionInvalid","Transition from line {from} to line {to}: incorrect. Show explanation."),a):"unknown"===e?d(M("ocr.plus.validation.transitionUnknown","Transition from line {from} to line {to}: could not be checked reliably."),a):d(M("ocr.plus.validation.transitionPending","Transition from line {from} to line {to}: checking."),a)}function S(t,n){if(e.summary.dataset.state=n,"stale"===n){e.summary.textContent=M("ocr.plus.validation.stale","The calculation has changed; the previous check is outdated.");return}if("running"===n){e.summary.textContent=M("ocr.plus.validation.running","Checking transitions...");return}if("error"===n){e.summary.textContent=M("ocr.plus.validation.error","The transitions could not be checked.");return}if(!t||0===t.length){e.summary.textContent=M("ocr.plus.validation.noTransitions","Add at least two equations to check a transition.");return}if(t.some(e=>"cas-unavailable"===e.reason)){e.summary.textContent=M("ocr.plus.validation.casUnavailableSummary","The CAS is unavailable. Import LiaTemplates/Algebrite before Canvas OCR; no transitions were checked.");return}let r=t.filter(e=>"valid"===e.status).length,a=t.filter(e=>"invalid"===e.status).length,i=t.length-r-a,l=1===t.length?"ocr.plus.validation.summaryOne":"ocr.plus.validation.summary",o=1===t.length?"{count} transition: {valid} correct, {invalid} incorrect, {unknown} not checked.":"{count} transitions: {valid} correct, {invalid} incorrect, {unknown} not checked.";e.summary.textContent=d(M(l,o),{count:t.length,valid:r,invalid:a,unknown:i})}function A(e){e.container.dataset.expanded="0",e.trigger.setAttribute("aria-expanded","false"),e.detail.hidden=!0}function C(){y&&(window.cancelAnimationFrame(y),y=0),w?.disconnect(),w=null,v=null}function _(){a||y||(v&&delete v.dataset.layoutReady,y=window.requestAnimationFrame(()=>{y=0,function(){let e=v;if(!e?.isConnected)return;let t=e.getBoundingClientRect();if(t.width<=0||t.height<=0)return delete e.dataset.layoutReady;for(let e=0;e<x.length;e++){let n=b[e],r=b[e+1],a=x[e];if(!n||!r||!a)continue;let i=n.getBoundingClientRect(),l=r.getBoundingClientRect(),o=(i.top+i.bottom+l.top+l.bottom)/4,s=Math.max(0,o-t.top);a.container.style.setProperty("--lia-canvasplus-transition-y",`${s}px`);let u=a.container.getBoundingClientRect(),c=a.trigger.getBoundingClientRect(),d=(c.top+c.bottom)/2,p=a.container.offsetHeight,h=p>0?u.height/p:1,m=Number.isFinite(h)&&h>0?(o-d)/h:o-d;Math.abs(m)>.1&&a.container.style.setProperty("--lia-canvasplus-transition-y",`${Math.max(0,s+m)}px`)}e.dataset.layoutReady="1"}()}))}function R(e){for(let e of b)delete e.dataset.errorSide;for(let t=0;t<x.length;t++){let n=x[t],r=e[t];if(!r)continue;let a="valid"===r.status?"correct":"invalid"===r.status?"incorrect":"unknown";n.container.dataset.verdict=a,n.container.dataset.code=r.reason,n.trigger.disabled=!1,n.trigger.setAttribute("aria-label",k(r.status,r.fromIndex,r.toIndex)),n.icon.textContent="valid"===r.status?"✓":"invalid"===r.status?"×":"?",n.label.textContent="valid"===r.status?M("ocr.plus.validation.correct","Correct"):"invalid"===r.status?M("ocr.plus.validation.incorrect","Incorrect"):"cas-unavailable"===r.reason?M("ocr.plus.validation.casUnavailableLabel","CAS unavailable"):M("ocr.plus.validation.unknownLabel","Not checked"),n.detail.textContent=M(r.messageKey,function(e){switch(e.reason){case"quadratic-root-solutions":return"The plus-minus square-root notation contains both real solutions.";case"cubic-root-solution":return"The cube-root notation gives the unique real solution.";case"quartic-root-solutions":return"The plus-minus fourth-root notation contains both real solutions.";case"missing-plus-minus":return"The indexed square-root solution is missing the plus-minus sign.";case"cas-unavailable":return"The CAS is unavailable. Import LiaTemplates/Algebrite before Canvas OCR.";case"domain-uncertain":return"Without the equation domain, this transition cannot be checked safely.";case"operation-applied-both-sides":return"The stated transformation was applied to both sides.";case"operation-missing-left":return"The left side does not match the stated transformation.";case"operation-missing-right":return"The right side does not match the stated transformation.";case"operation-mismatch-both":return"Both sides do not match the stated transformation.";case"equivalent-linear-equations":return"The two equations are equivalent.";case"different-linear-solutions":return"The two equations have different solutions.";default:return"This transition could not be checked reliably."}}(r)),A(n),"invalid"===r.status&&b[r.toIndex]&&(b[r.toIndex].dataset.errorSide=r.side||"whole")}}function T(){for(let e of b)delete e.dataset.errorSide;for(let e=0;e<x.length;e++){let t=x[e];t.container.dataset.verdict="unknown",t.container.dataset.code="analysis-error",t.trigger.disabled=!1,t.trigger.setAttribute("aria-label",k("unknown",e,e+1)),t.icon.textContent="?",t.label.textContent=M("ocr.plus.validation.unknownLabel","Not checked"),t.detail.textContent=M("ocr.plus.validation.error","The transitions could not be checked."),A(t)}}function E(t){let i=++n;if(r&&window.clearTimeout(r),g=null,p=!1,h=!1,m=!1,u(e.mode)){e.root.dataset.analysisState="ready",e.root.dataset.analysisRevision=String(t.revision),e.summary.dataset.state="ready",e.summary.textContent=M("ocr.plus.column.recognized","Written calculation recognized."),g=[],r=window.setTimeout(()=>{r=0,a||p||i!==n||e.onAnalysis?.({revision:t.revision,state:"ready",checks:[]})},0);return}if(e.root.dataset.analysisState=t.lines.length>1?"running":"ready",e.root.dataset.analysisRevision=String(t.revision),S(null,t.lines.length>1?"running":"ready"),t.lines.length<2){g=[],r=window.setTimeout(()=>{r=0,a||p||i!==n||e.onAnalysis?.({revision:t.revision,state:"ready",checks:[]})},0);return}r=window.setTimeout(()=>{r=0,(async()=>{if(!a&&!p&&i===n)try{let r=[];for(let e=0;e+1<t.lines.length;e++)if(r.push((0,o.validateEquationTransition)(t.lines[e],t.lines[e+1],e)),e+2<t.lines.length&&await new Promise(e=>window.setTimeout(e,0)),a||p||i!==n)return;g=r,R(r),e.root.dataset.analysisState="ready",S(r,"ready"),e.onAnalysis?.({revision:t.revision,state:"ready",checks:r})}catch(r){if(a||p||i!==n)return;console.warn("[lia-canvas-ocr] transition check failed",r),g=null,m=!0,T(),e.root.dataset.analysisState="error",S(null,"error"),e.onAnalysis?.({revision:t.revision,state:"error",checks:[]})}})()},0)}function L(){n++,C(),r&&(window.clearTimeout(r),r=0),f=null,g=null,m=!1,x=[],b=[],p=!1,h=!1,e.target.replaceChildren(),e.target.removeAttribute("data-rendered-tex"),e.root.dataset.analysisState="idle",e.root.removeAttribute("data-analysis-revision"),e.summary.textContent="",e.summary.dataset.state="idle"}return{render:function(n,r){let a=String(n||"").replace(/\r/g,"").split("\n").map(e=>e.trim()).filter(Boolean),o=a.join("\n"),s={editableText:o,latex:e.composeLatex?.(a)||(0,l.editableTextToLatex)(o),lines:a,revision:r};return f=s,p=!1,e.target.dataset.renderedTex=s.latex,!function(n){if(C(),e.target.replaceChildren(),x=[],b=[],u(e.mode)){let t=c(e.target,"div","lia-canvasplus-column-calculation");t.setAttribute("aria-label",M("ocr.plus.column.previewLabel","Recognized written calculation"));let r=e.composeLatex?.(n)||"";r&&(0,i.__liaRenderTexPreview)(t,r);return}let r=c(e.target,"ol","lia-canvasplus-steps");r.dataset.layout="side-rail",r.setAttribute("aria-label",M("ocr.plus.validation.pathLabel","Checked calculation path"));for(let e=0;e<n.length;e++){let a=c(r,"li","lia-canvasplus-step");a.dataset.lineIndex=String(e),function(e,t,n){let r=c(e,"div","lia-canvasplus-line");r.dataset.lineIndex=String(n),r.dataset.rawLatex=t,c(r,"span","lia-canvasplus-line-number",String(n+1)).setAttribute("aria-hidden","true");let a=c(r,"div","lia-canvasplus-line-equation"),o=(0,l.alignFirstTopLevelRelation)(t),s=o.indexOf("&");if(s>=0){a.dataset.hasRelation="1";let e=c(a,"span","lia-canvasplus-line-left"),t=c(a,"span","lia-canvasplus-line-right");(0,i.__liaRenderTexPreview)(e,o.slice(0,s)),(0,i.__liaRenderTexPreview)(t,o.slice(s+1))}else{a.dataset.hasRelation="0";let e=c(a,"span","lia-canvasplus-line-whole");(0,i.__liaRenderTexPreview)(e,t)}b.push(r)}(a,n[e],e),e+1<n.length&&function(e,n,r){let a=c(e,"div","lia-canvasplus-transition");a.dataset.fromIndex=String(n),a.dataset.toIndex=String(r),a.dataset.verdict="pending",a.dataset.expanded="0";let i=c(a,"span","lia-canvasplus-transition-arrow");i.dataset.shape="curved-down",i.setAttribute("aria-hidden","true");let l="http://www.w3.org/2000/svg",o=document.createElementNS(l,"svg");o.setAttribute("viewBox","0 0 42 58"),o.setAttribute("focusable","false");let s=document.createElementNS(l,"path");s.setAttribute("d","M7 4 C29 17 29 34 14 50");let u=document.createElementNS(l,"path");u.setAttribute("d","M14 50 L15 39 M14 50 L24 45"),o.append(s,u),i.appendChild(o);let d=c(a,"button","lia-canvasplus-transition-trigger");d.type="button",d.disabled=!0,d.setAttribute("aria-expanded","false");let p="lia-canvasplus-transition-detail-"+t+"-"+n;d.setAttribute("aria-controls",p),d.setAttribute("aria-label",k("pending",n,r));let h=c(d,"span","lia-canvasplus-transition-icon","…");h.setAttribute("aria-hidden","true");let m=c(d,"span","lia-canvasplus-transition-label",M("ocr.plus.validation.checking","Checking")),f=c(a,"div","lia-canvasplus-transition-detail");f.id=p,f.hidden=!0,d.addEventListener("click",()=>{if(d.disabled)return;let e="true"===d.getAttribute("aria-expanded");for(let e of x)e.trigger!==d&&A(e);d.setAttribute("aria-expanded",e?"false":"true"),a.dataset.expanded=e?"0":"1",f.hidden=e}),x.push({container:a,trigger:d,icon:h,label:m,detail:f})}(a,e,e+1)}if(C(),v=r,"function"==typeof ResizeObserver)for(let e of((w=new ResizeObserver(_)).observe(r),b))w.observe(e);_()}(a),E(s),s},markStale:function(){if(p=!0,h=!1,n++,r&&(window.clearTimeout(r),r=0),e.root.dataset.analysisState="stale",u(e.mode)){e.summary.dataset.state="stale",e.summary.textContent=M("ocr.plus.validation.stale","The calculation has changed; the previous check is outdated.");return}for(let e=0;e<x.length;e++){let t=x[e];A(t),t.container.dataset.stale="1",t.trigger.setAttribute("aria-label",k(g?.[e]?.status||"pending",e,e+1,!0))}S(g,"stale")},pause:function(){a||!f||h||(r||"running"===e.root.dataset.analysisState)&&(h=!0,n++,r&&(window.clearTimeout(r),r=0))},resume:function(){a||p||!h||!f||(h=!1,E(f))},clear:L,refreshLayout:_,refreshTexts:function(){if(u(e.mode)){e.target.querySelector(".lia-canvasplus-column-calculation")?.setAttribute("aria-label",M("ocr.plus.column.previewLabel","Recognized written calculation")),e.summary.dataset.state=p?"stale":f?"ready":"idle",e.summary.textContent=p?M("ocr.plus.validation.stale","The calculation has changed; the previous check is outdated."):f?M("ocr.plus.column.recognized","Written calculation recognized."):"";return}if(e.target.querySelector(".lia-canvasplus-steps")?.setAttribute("aria-label",M("ocr.plus.validation.pathLabel","Checked calculation path")),p){g&&R(g);for(let e=0;e<x.length;e++){let t=x[e];t.container.dataset.stale="1",t.trigger.setAttribute("aria-label",k(g?.[e]?.status||"pending",e,e+1,!0))}S(g,"stale");return}if(m){T(),S(null,"error");return}if(g)R(g),S(g,"ready");else if(f){for(let e=0;e<x.length;e++){let t=x[e];t.trigger.setAttribute("aria-label",k("pending",e,e+1)),t.label.textContent=M("ocr.plus.validation.checking","Checking")}S(null,f.lines.length>1?"running":"ready")}},getSnapshot:()=>f,destroy:function(){a=!0,L()}}}},{"./input":"3dckU","../ocr/layout":"9tjfg","@parcel/transformer-js/src/esmodule-helpers.js":"b0H7B","../math/equivalence":"dFsXY"}],"70e9m":[function(e,t,n,r){var a=e("@parcel/transformer-js/src/esmodule-helpers.js");a.defineInteropFlag(n),a.export(n,"CANVASPLUS_FORMULA_OCR_MODEL",()=>o),a.export(n,"CANVASPLUS_FORMULA_OCR_REVISION",()=>s),a.export(n,"ensureCanvasPlusFormulaOcrEngine",()=>p);var i=e("../index"),l=e("./bar");let o="alephpi/FormulaNet",s="63e04c86fc96c2324811114351eeea8118bf6b28";async function u(){return i.LIA.canvasPlusTfjs?.VisionEncoderDecoderModel?i.LIA.canvasPlusTfjs:(i.LIA.canvasPlusTfjsLoad=i.LIA.canvasPlusTfjsLoad||(async()=>{let e=null;for(let t of["https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1/+esm","https://esm.sh/@huggingface/transformers@3.8.1?bundle"])try{let e=await Function("u","return import(u)")(t),n={VisionEncoderDecoderModel:e.VisionEncoderDecoderModel||e.default?.VisionEncoderDecoderModel,PreTrainedTokenizer:e.PreTrainedTokenizer||e.default?.PreTrainedTokenizer,Tensor:e.Tensor||e.default?.Tensor,cat:e.cat||e.default?.cat,env:e.env||e.default?.env,__url:t};if(!n.VisionEncoderDecoderModel||!n.PreTrainedTokenizer||!n.Tensor||!n.cat||!n.env)throw Error("Transformers.js ESM exports for FormulaNet are missing.");return i.LIA.canvasPlusTfjs=n,n}catch(t){e=t}throw e||Error("Failed to load the handwritten-formula OCR runtime.")})(),await i.LIA.canvasPlusTfjsLoad)}async function c(e){if("u">typeof HTMLCanvasElement&&e instanceof HTMLCanvasElement)return e;if("u">typeof ImageData&&e instanceof ImageData){let t=document.createElement("canvas");t.width=Math.max(1,e.width),t.height=Math.max(1,e.height);let n=t.getContext("2d",{willReadFrequently:!0});if(!n)throw Error("Could not create the FormulaNet source canvas.");return n.putImageData(e,0,0),t}let t=null;try{if("string"==typeof e){let n=await fetch(e);if(!n.ok)throw Error("Could not load the FormulaNet image input.");t=await createImageBitmap(await n.blob())}else if(e instanceof Blob)t=await createImageBitmap(e);else if(e&&"function"==typeof e.convertToBlob)t=await createImageBitmap(await e.convertToBlob({type:"image/png"}));else if(e&&"function"==typeof e.toBlob){let n=await new Promise((t,n)=>{e.toBlob(e=>e?t(e):n(Error("FormulaNet toBlob() returned null.")),"image/png")});t=await createImageBitmap(n)}if(!t)throw Error("Unsupported FormulaNet image input.");let n=document.createElement("canvas");n.width=Math.max(1,t.width),n.height=Math.max(1,t.height);let r=n.getContext("2d",{willReadFrequently:!0});if(!r)throw Error("Could not create the FormulaNet bitmap canvas.");return r.fillStyle="#fff",r.fillRect(0,0,n.width,n.height),r.drawImage(t,0,0),n}finally{try{t?.close()}catch(e){}}}async function d(e,t){let n=await c(t),r=n.getContext("2d",{willReadFrequently:!0});if(!r)throw Error("Could not read the FormulaNet source image.");let a=r.getImageData(0,0,n.width,n.height),i=new Uint8Array(n.width*n.height),l=0,o=0;for(let e=0;e<i.length;e++){let t=4*e,n=a.data[t+3]/255,r=Math.round(.299*(a.data[t]*n+255*(1-n))+.587*(a.data[t+1]*n+255*(1-n))+.114*(a.data[t+2]*n+255*(1-n)));i[e]=r,r<200?l++:o++}if(l>=o)for(let e=0;e<i.length;e++)i[e]=255-i[e];let s=n.width,u=n.height,d=-1,p=-1;for(let e=0;e<n.height;e++)for(let t=0;t<n.width;t++)i[e*n.width+t]>=200||(s=Math.min(s,t),u=Math.min(u,e),d=Math.max(d,t),p=Math.max(p,e));if(d<s||p<u)throw Error("FormulaNet received a blank line.");let h=d-s+1,m=p-u+1,f=document.createElement("canvas");f.width=h,f.height=m;let g=f.getContext("2d",{willReadFrequently:!0});if(!g)throw Error("Could not create the FormulaNet crop.");let x=g.createImageData(h,m);for(let e=0;e<m;e++)for(let t=0;t<h;t++){let r=i[(u+e)*n.width+s+t],a=(e*h+t)*4;x.data[a]=r,x.data[a+1]=r,x.data[a+2]=r,x.data[a+3]=255}g.putImageData(x,0,0);let b=Math.min(384/h,384/m),v=Math.max(1,Math.round(h*b)),y=Math.max(1,Math.round(m*b)),w=document.createElement("canvas");w.width=384,w.height=384;let M=w.getContext("2d",{willReadFrequently:!0});if(!M)throw Error("Could not create the FormulaNet input.");M.fillStyle="#000",M.fillRect(0,0,384,384),M.imageSmoothingEnabled=!0,M.drawImage(f,Math.floor((384-v)/2),Math.floor((384-y)/2),v,y);let k=M.getImageData(0,0,384,384),S=new Float32Array(147456);for(let e=0;e<S.length;e++){let t=4*e,n=(.299*k.data[t]+.587*k.data[t+1]+.114*k.data[t+2])/255;S[e]=(n-.7931)/.1738}let A=new e.Tensor("float32",S,[1,1,384,384]);return e.cat([A,A,A],1)}function p(){if(i.LIA.canvasPlusOcr)return i.LIA.canvasPlusOcr;let e=(0,l.ensureOcrBar)(),t={model:o,modelRevision:s,task:"image-to-text",precision:"fp32",backend:"wasm",cacheKey:o+"@"+s+"|formulanet-v1",domain:"handwritten-math",outputKind:"latex",inputProfile:"formulanet-line-384",calculationSinglePass:!0,modelInstance:null,tokenizer:null,runtime:null,lastError:"",lastOutput:"",lastText:"",loading:null,loadGeneration:0,inferenceTail:Promise.resolve(),async ensureLoaded(t){if(this.modelInstance&&this.tokenizer&&!t)return this;if(this.loading)return this.loading;let n=++this.loadGeneration;return i.LIA.activeOcrLoadEngine=this,e.set({backend:"wasm",precision:"fp32",status:"loading",phase:"import",loaded:!1,progress:0}),e.log("Loading FormulaNet calculation OCR..."),this.loading=(async()=>{try{let t=await u(),{env:r,VisionEncoderDecoderModel:a,PreTrainedTokenizer:i}=t;r.allowLocalModels=!1,r.allowRemoteModels=!0,r.useBrowserCache=!0,r.backends.onnx.wasm.numThreads=1,r.backends.onnx.wasm.proxy=!0;let l=t=>{if(n!==this.loadGeneration)return;let r="number"==typeof t&&Number.isFinite(t)?Math.max(0,Math.min(1,t>1?t/100:t)):t&&"object"==typeof t?"number"==typeof t.progress&&Number.isFinite(t.progress)?Math.max(0,Math.min(1,t.progress>1?t.progress/100:t.progress)):"number"==typeof t.loaded&&"number"==typeof t.total&&t.total>0?Math.max(0,Math.min(1,t.loaded/t.total)):null:null;null!==r&&e.set({progress:r,phase:"download"})},[o,s]=await Promise.all([a.from_pretrained(this.model,{revision:this.modelRevision,dtype:"fp32",progress_callback:l}),i.from_pretrained(this.model,{revision:this.modelRevision,progress_callback:l})]);if(n!==this.loadGeneration)throw Error("Discarded stale FormulaNet model load.");return this.runtime=t,this.modelInstance=o,this.tokenizer=s,this.lastError="",e.set({backend:"wasm",precision:"fp32",status:"ready",phase:"ready",loaded:!0,progress:null}),e.log("FormulaNet calculation OCR ready."),this}catch(t){throw this.lastError=t&&t.message?String(t.message):String(t),n===this.loadGeneration&&e.set({status:"error",phase:"error",loaded:!1,progress:null}),t}finally{n===this.loadGeneration&&(this.loading=null),i.LIA.activeOcrLoadEngine===this&&(i.LIA.activeOcrLoadEngine=null)}})(),this.loading},async recognize(t,n){let r=async()=>{await this.ensureLoaded(!1),e.set({status:"working",phase:"infer",progress:null});try{let n=await d(this.runtime,t),r=await this.modelInstance.generate({inputs:n}),a=this.tokenizer.batch_decode(r,{skip_special_tokens:!0}),i=String(a?.[0]||"").trim();return this.lastOutput=JSON.stringify(a||[]),this.lastText=i,this.lastError="",e.set({status:"ready",phase:"ready"}),i}catch(t){throw this.lastError=t&&t.message?String(t.message):String(t),e.set({status:"error",phase:"error"}),t}},a=this.inferenceTail.then(r,r);return this.inferenceTail=a.then(()=>void 0,()=>void 0),await a}};return i.LIA.canvasPlusOcr=t,t}},{"../index":"gFFiE","./bar":"bCXIb","@parcel/transformer-js/src/esmodule-helpers.js":"b0H7B"}],jD8Ho:[function(e,t,n,r){var a=e("@parcel/transformer-js/src/esmodule-helpers.js");function i(e,t){let n=e+t;return Number.isSafeInteger(n)?n:null}function l(e,t){let n=e*t;return Number.isSafeInteger(n)?n:null}function o(e,t){let n=Math.abs(e),r=Math.abs(t);for(;r;)[n,r]=[r,n%r];return n||1}function s(e,t=1){if(!Number.isSafeInteger(e)||!Number.isSafeInteger(t)||!t)return null;let n=o(e,t),r=t<0?-1:1,a=e/n*r,i=t/n*r;return Number.isSafeInteger(a)&&Number.isSafeInteger(i)?{numerator:a,denominator:i}:null}a.defineInteropFlag(n),a.export(n,"generateExpectedCalculation",()=>q);let u=()=>({numerator:0,denominator:1}),c=()=>({numerator:1,denominator:1}),d=e=>0===e.numerator,p=e=>({numerator:-e.numerator,denominator:e.denominator}),h=e=>({numerator:Math.abs(e.numerator),denominator:e.denominator});function m(e,t){let n=o(e.denominator,t.denominator),r=t.denominator/n,a=e.denominator/n,u=l(e.numerator,r),c=l(t.numerator,a),d=l(e.denominator,r);if(null===u||null===c||null===d)return null;let p=i(u,c);return null===p?null:s(p,d)}function f(e,t){let n=o(e.numerator,t.denominator),r=o(t.numerator,e.denominator),a=l(e.numerator/n,t.numerator/r),i=l(e.denominator/r,t.denominator/n);return null===a||null===i?null:s(a,i)}function g(e,t){return d(t)?null:f(e,{numerator:t.denominator,denominator:t.numerator})}function x(){return Array.from({length:5},u)}function b(e){let t=x();return t[0]=e,t}function v(e){for(let t=4;t>0;t--)if(!d(e[t]))return t;return 0}function y(e,t){let n=x();for(let r=0;r<=4;r++){let a=m(e[r],t[r]);if(!a)return null;n[r]=a}return n}function w(e,t){let n=x();for(let r=0;r<=4;r++)if(!d(e[r]))for(let a=0;a<=4;a++){if(d(t[a]))continue;if(r+a>4)return null;let i=f(e[r],t[a]);if(!i)return null;let l=m(n[r+a],i);if(!l)return null;n[r+a]=l}return n}function M(e,t){if("{"!==e[t])return null;let n=1;for(let r=t+1;r<e.length;r++)if("{"===e[r])n++;else if("}"===e[r]&&0==--n)return{content:e.slice(t+1,r),end:r+1};return null}function k(e){let t=[];for(let n=0;n<e.length;){let r=e[n];if(/\d/u.test(r)){let r=n+1;for(;r<e.length&&/\d/u.test(e[r]);)r++;if("."===e[r]){let t=++r;for(;r<e.length&&/\d/u.test(e[r]);)r++;if(r===t)return null}t.push({kind:"number",value:e.slice(n,r)}),n=r;continue}if(/[A-Za-z]/u.test(r)){t.push({kind:"variable",value:r}),n++;continue}if("+-*/^".includes(r))t.push({kind:"operator",value:r});else if("("===r||"["===r)t.push({kind:"left",value:r});else{if(")"!==r&&"]"!==r)return null;t.push({kind:"right",value:r})}n++}return t}class S{constructor(e,t){this.index=0,this.tokens=e,this.variable=t}parse(){let e=this.sum();return e&&this.index===this.tokens.length?e:null}peek(){return this.tokens[this.index]}take(){return this.tokens[this.index++]}sum(){let e=this.product();if(!e)return null;for(;this.peek()?.kind==="operator"&&["+","-"].includes(this.peek().value);){let t=this.take().value,n=this.product();if(!n||!(e=y(e,"+"===t?n:n.map(p))))return null}return e}product(){let e=this.unary();if(!e)return null;for(;;){let t=this.peek(),n=t?.kind==="operator"&&("*"===t.value||"/"===t.value),r=t?.kind==="number"||t?.kind==="variable"||t?.kind==="left";if(!n&&!r)break;let a=n?this.take().value:"*",i=this.unary();if(!i||!(e="/"===a?function(e,t){if(0!==v(t)||d(t[0]))return null;let n=x();for(let r=0;r<=4;r++){let a=g(e[r],t[0]);if(!a)return null;n[r]=a}return n}(e,i):w(e,i)))return null}return e}unary(){let e=this.peek();if(e?.kind==="operator"&&("+"===e.value||"-"===e.value)){this.take();let t=this.unary();return t&&"-"===e.value?t.map(p):t}return this.power()}power(){let e=this.primary();if(!e)return null;if(this.peek()?.kind!=="operator"||"^"!==this.peek().value)return e;this.take();let t=this.take();if(!t||"number"!==t.kind||!/^\d+$/u.test(t.value))return null;let n=Number(t.value);return Number.isInteger(n)&&n>=0&&n<=4?function(e,t){let n=b(c());for(let r=0;r<t;r++){let t=w(n,e);if(!t)return null;n=t}return n}(e,n):null}primary(){let e=this.take();if(!e)return null;if("number"===e.kind){let t=function(e){if(!e.includes(".")){let t=Number(e);return Number.isSafeInteger(t)?s(t):null}let[t,n]=e.split("."),r=10**n.length,a=Number(t+n);return Number.isSafeInteger(a)&&Number.isSafeInteger(r)?s(a,r):null}(e.value);return t?b(t):null}if("variable"===e.kind){let t;return e.value===this.variable?((t=x())[1]=c(),t):null}if("left"!==e.kind)return null;let t=this.sum(),n=this.take();return t&&n?.kind==="right"&&("("!==e.value||")"===n.value)&&("["!==e.value||"]"===n.value)?t:null}}function A(e){if(1===e.denominator)return String(e.numerator);let t=e.numerator<0?"-":"";return`${t}\\frac{${Math.abs(e.numerator)}}{${e.denominator}}`}function C(e,t,n,r){let a=e.numerator<0,i=h(e),l=r?a?"-":"+":a?"-":"";return 0===t?l+A(i):l+(i.numerator===i.denominator?"":A(i))+n+(1===t?"":`^{${t}}`)}function _(e,t){let n="";for(let r=4;r>=0;r--)d(e[r])||(n+=C(e[r],r,t,n.length>0));return n||"0"}function R(e){return e.numerator>0?"-"+A(e):"+"+A(h(e))}function T(e){let t=A(e);return e.numerator<0||1!==e.denominator?":("+t+")":":"+t}function E(e,t){let n=e<0;if(n&&t%2==0)return null;let r=Math.abs(e),a=Math.round(r**(1/t));for(let e=Math.max(0,a-2);e<=a+2;e++){let a=e**t;if(Number.isSafeInteger(a)&&a===r)return n?-e:e}return null}function L(e){let t=e,n=1;for(let e=2;e<=1e4&&e*e<=t;e++){let r=e*e;for(;t%r==0;)t/=r,n*=e}let r=E(t,2);return null!==r&&(n*=r,t=1),{outside:n,inside:t}}function z(e){let t=L(e);if(1===t.inside)return String(t.outside);let n=`\\sqrt{${t.inside}}`;return 1===t.outside?n:String(t.outside)+n}function O(e,t,n,r){if(n%2==0&&t.numerator<0)return void e.push("\\Rightarrow \\mathcal{L}_{\\mathbb{R}}=\\varnothing");if(d(t))return void e.push(`\\Rightarrow ${r}=0`);let a=function(e,t,n=!1){let r,a,i=(r=E(e.numerator,t),a=E(e.denominator,t),null===r||null===a?null:s(r,a));if(i)return A(i);let l=e.numerator<0,o=h(e);if(2===t){let e=z(o.numerator);if(1===o.denominator)return e;let t=z(o.denominator);if(n||"\\"!==e[0]||"\\"!==t[0])return`\\frac{${e}}{${t}}`}let u=A(o),c=2===t?`\\sqrt{${u}}`:`\\sqrt[${t}]{${u}}`;return l?"-"+c:c}(t,n,2===n);e.push(n%2==0?`\\Rightarrow ${r}_{1,2}=\\pm${a}`:`\\Rightarrow ${r}=${a}`)}function I(e,t){e[e.length-1]+=" \\mid "+t}function q(e){let t=function(e){let t=function(e){let t=String(e||"").trim();if(!t||t.length>512)return null;t.startsWith("$")&&t.endsWith("$")&&t.length>2&&(t=t.slice(1,-1)),t.startsWith("\\(")&&t.endsWith("\\)")&&(t=t.slice(2,-2));let n=(t=t.replace(/\u2212/gu,"-").replace(/\u00b2/gu,"^2").replace(/\u00b3/gu,"^3").replace(/\u2074/gu,"^4").replace(/\\left|\\right|\\bigl|\\bigr|\\Bigl|\\Bigr/gu,"").replace(/\\(?:,|;|!| |quad|qquad)/gu,"").replace(/\s+/gu,"")).replace(/\\times|\*/gu,"\\cdot ").replace(/\^\{([0-4])\}|\^([0-4])/gu,(e,t,n)=>`^{${t||n}}`),r=function e(t,n=0){if(n>16)return null;let r="";for(let a=0;a<t.length;){let i=["\\dfrac","\\tfrac","\\frac"].find(e=>t.startsWith(e,a));if(!i){r+=t[a++];continue}let l=M(t,a+i.length);if(!l)return null;let o=M(t,l.end);if(!o)return null;let s=e(l.content,n+1),u=e(o.content,n+1);if(null===s||null===u)return null;r+="(("+s+")/("+u+"))",a=o.end}return r}(t=t.replace(/\\cdot|\\times/gu,"*").replace(/(\d),(\d)/gu,"$1.$2").replace(/\^\{([0-4])\}/gu,"^$1"));return null===r||r.length>2048?null:{source:r.replace(/\{/gu,"(").replace(/\}/gu,")").replace(/:/gu,"/"),display:n}}(e);if(!t)return null;let n=t.source.split("=");if(2!==n.length||!n[0]||!n[1])return null;let r=k(n[0]),a=k(n[1]);if(!r?.length||!a?.length)return null;let i=new Set([...r,...a].filter(e=>"variable"===e.kind).map(e=>e.value));if(1!==i.size)return null;let l=[...i][0],o=new S(r,l).parse(),s=new S(a,l).parse();return o&&s?{left:o,right:s,variable:l,display:t.display}:null}(e);if(!t)return null;let n=function(e){if(0!==v(e.right))return null;let t=v(e.left);if(t<1||t>4)return null;for(let n=1;n<=4;n++)if(n!==t&&!d(e.left[n]))return null;let n=e.left[t],r=e.left[0],a=e.right[0],i=m(a,p(r));if(!i)return null;let l=g(i,n);if(!l)return null;let o=C(n,t,e.variable,!1),s=o+(d(r)?"":C(r,0,e.variable,!0))+"="+A(a),u=e.display===s?[]:[e.display];d(r)||u.push(s+" \\mid "+R(r));let c=o+"="+A(i);n.numerator===n.denominator?d(r)&&u.push(s):u.push(c+" \\mid "+T(n));let h=e.variable+(1===t?"":`^{${t}}`)+"="+A(l);return u[u.length-1]!==h&&u.push(h),t>1&&O(u,l,t,e.variable),u}(t);if(n)return n;let r=y(t.left,t.right.map(p));if(!r)return null;let a=function(e){let t=1;for(let n of e){let e=n.denominator/o(t,n.denominator),r=l(t,e);if(null===r)return null;t=r}let n=[];for(let r of e){let e=l(r.numerator,t/r.denominator);if(null===e)return null;n.push(e)}let r=0;for(let e of n)r=o(r,e);if(r>1)for(let e=0;e<n.length;e++)n[e]/=r;let a=n.length-1;for(;a>0&&0===n[a];)a--;if(n[a]<0)for(let e=0;e<n.length;e++)n[e]*=-1;return n}(r);if(!a)return null;let u=a.length-1;for(;u>0&&0===a[u];)u--;let c=_(t.left,t.variable)+"="+_(t.right,t.variable),h=t.display===c?[c]:[t.display,c];if(0===u)return 0===a[0]?[...h,"\\Rightarrow \\mathcal{L}=\\mathbb{R}"]:[...h,a[0]+"=0","\\Rightarrow \\mathcal{L}=\\varnothing"];let f=_(function(e){let t=x();for(let n=0;n<t.length;n++)t[n]=s(e[n]||0);return t}(a),t.variable)+"=0",b=[...h];if(b[b.length-1]!==f&&b.push(f),1===u)return function(e,t,n,r){let a=s(-n,t);if(!a)return null;let i=s(t);0!==n&&(I(e,R(s(n))),e.push(C(i,1,r,!1)+"="+String(-n))),1!==t&&I(e,T(i));let l=r+"="+A(a);return e[e.length-1]!==l&&e.push(l),e}(b,a[1],a[0],t.variable);if(2===u&&0!==a[1])return function(e,t,n){let[r,a,u]=t,c=l(a,a),d=l(u,r),p=null===d?null:l(4,d),h=null===c||null===p?null:i(c,-p),m=l(2,u);if(null===h||null===m)return null;let f=a<0?`(${a})`:String(a),g=r<0?`(${r})`:String(r);if(e.push(`\\Delta=${f}^{2}-4\\cdot${u}\\cdot${g}=${h}`+(h<0?"<0":"")),h<0)return e.push("\\Rightarrow \\mathcal{L}_{\\mathbb{R}}=\\varnothing"),e;if(0===h){let t=s(-a,m);return t?(e.push(`\\Rightarrow ${n}=${A(t)}`),e):null}let x=E(h,2);if(null===x){var b;let t,r,i,l,s,u;return e.push(`\\Rightarrow ${n}_{1,2}=`+(r=o(o(Math.abs(b=-a),(t=L(h)).outside),m),i=t.outside/r,l=m/r,s=(1===i?"":String(i))+`\\sqrt{${t.inside}}`,u=String(b/r)+"\\pm"+s,1===l?u:`\\frac{${u}}{${l}}`)),e}let v=i(-a,x),y=i(-a,-x);if(null===v||null===y)return null;let w=s(v,m),M=s(y,m);return w&&M?(e.push(`${n}_{1,2}=\\frac{${-a}\\pm${x}}{${m}}`),e.push(`\\Rightarrow ${n}_1=${A(w)},\\quad ${n}_2=${A(M)}`),e):null}(b,a,t.variable);if(u>=2&&u<=4){for(let e=1;e<u;e++)if(0!==a[e])return null;return function(e,t,n,r){let a=t[n],i=t[0],l=s(-i,a);if(!l)return null;let o=s(a);0!==i&&(I(e,R(s(i))),e.push(C(o,n,r,!1)+"="+String(-i))),1!==a&&I(e,T(o));let u=r+`^{${n}}=`+A(l);return e[e.length-1]!==u&&e.push(u),O(e,l,n,r),e}(b,a,u,t.variable)}return null}},{"@parcel/transformer-js/src/esmodule-helpers.js":"b0H7B"}],hjtPZ:[function(e,t,n,r){var a=e("@parcel/transformer-js/src/esmodule-helpers.js");function i(e){return e.bbox.y+e.bbox.height/2}function l(e){return Math.max(1,Number(e.inkPixels)||0)+Math.max(1,e.bbox.width)*Math.max(1,e.bbox.height)}function o(e,t){let n=null;for(let r of t){let t=(r.y0+r.y1)/2,a=e.filter(e=>i(e)<t),o=e.filter(e=>i(e)>t);if(a.length<2||o.length<1)continue;let s=Math.max(...a.map(e=>e.bbox.height)),u=a.filter(e=>e.bbox.height>=.62*s);if(u.length<2)continue;let c=u.slice().sort((e,t)=>i(t)-i(e)).slice(0,2).sort((e,t)=>i(e)-i(t)),d=Math.max(c[0].bbox.height,c[1].bbox.height),p=o.filter(e=>e.bbox.height>=.55*d).slice().sort((e,t)=>i(e)-i(t)||l(t)-l(e))[0];if(!p)continue;let h=r.x1-r.x0+l(c[0])+l(c[1])+l(p);(!n||h>n.score)&&(n={rule:r,operands:c,result:p,score:h})}return n?{rule:n.rule,operands:n.operands,result:n.result}:null}function s(e,t,n=2){let r=null;for(let a of t){let t=(a.y0+a.y1)/2,o=e.filter(e=>i(e)<t),s=e.filter(e=>i(e)>t);if(o.length<n||s.length<1)continue;let u=Math.max(...o.map(e=>e.bbox.height)),c=o.filter(e=>e.bbox.height>=.55*u).slice().sort((e,t)=>i(e)-i(t));if(c.length<n)continue;let p=d(c.map(e=>e.bbox.height)),h=s.filter(e=>e.bbox.height>=.52*p).slice().sort((e,t)=>i(e)-i(t)||l(t)-l(e))[0];if(!h)continue;let m=a.x1-a.x0+l(h)+c.reduce((e,t)=>e+l(t),0);(!r||m>r.score)&&(r={rule:a,rowsAbove:c,result:h,score:m})}return r?{rule:r.rule,rowsAbove:r.rowsAbove,result:r.result}:null}function u(e,t=!1){let n=String(e??"").trim();if(!n)return null;n=n.replace(/^\$+|\$+$/gu,"").replace(/\\(?:left|right)\b/gu,"").replace(/\\(?:,|;|!|quad|qquad|enspace|thinspace|medspace|thickspace)/gu,"").replace(/\\(?:mathrm|mathbf|mathsf|text)\s*\{(\d+)\}/gu,"$1").replace(/[{}\s~]/gu,"");let r=(t?/^\+?(\d+)$/u:/^(\d+)$/u).exec(n);return r?r[1].replace(/^0+(?=\d)/u,""):null}function c(e,t=null){let n=String(e??"").trim();if(!n)return null;n=n.replace(/^\$+|\$+$/gu,"").replace(/\\(?:left|right)\b/gu,"").replace(/\\(?:,|;|!|quad|qquad|enspace|thinspace|medspace|thickspace)/gu,"").replace(/\\(?:mathrm|mathbf|mathsf|text)\s*\{(\d+)\}/gu,"$1").replace(/[{}\s~]/gu,"").replace(/\u2212/gu,"-");let r="+"===t?"\\+":"-"===t?"-":"",a=RegExp("^"+(r?r+"?":"")+"(\\d+)$","u").exec(n);return a?a[1]:null}function d(e){if(!e.length)return 0;let t=Array.from(e).sort((e,t)=>e-t),n=Math.floor(t.length/2);return t.length%2?t[n]:(t[n-1]+t[n])/2}a.defineInteropFlag(n),a.export(n,"selectOcrColumnAdditionSegments",()=>o),a.export(n,"selectOcrColumnStackSegments",()=>s),a.export(n,"normalizeOcrColumnDigits",()=>u),a.export(n,"normalizeOcrColumnDigitsExact",()=>c),a.export(n,"mapOcrCarryOnesToColumns",()=>h);function p(e){return!!e&&"object"==typeof e&&"number"==typeof e.x&&Number.isFinite(e.x)&&"number"==typeof e.y&&Number.isFinite(e.y)&&"number"==typeof e.width&&Number.isFinite(e.width)&&e.width>0&&"number"==typeof e.height&&Number.isFinite(e.height)&&e.height>0}function h(e,t,n){if(!Number.isInteger(n)||n<1)return null;let r=t.map(e=>(function(e,t){if(!Number.isInteger(t)||t<1||!p(e.bbox))return null;let n=p(e.inkBox),r=n?e.inkBox:e.bbox,a=r.width/Math.max(.55,t-.44999999999999996);return!Number.isFinite(a)||a<=0?null:{digitCount:t,exactInkBox:n,pitch:a,rightmostCenter:r.x+r.width-.275*a}})(e.segment,e.digitCount)).filter(e=>!!e);if(!r.length)return e.length?null:Array(n).fill(null);let a=r.filter(e=>e.exactInkBox),i=d((a.length?a:r).map(e=>e.pitch));if(!Number.isFinite(i)||i<=0)return null;let l=[];for(let e=0;e<n;e++){let t=r.filter(t=>t.digitCount>e),n=t.filter(e=>e.exactInkBox),a=n.length?n:t;if(!a.length)return null;l.push(d(a.map(t=>t.rightmostCenter-e*t.pitch)))}let o=Array(n).fill(0);for(let t of e){let e=Math.min(t.x0,t.x1),n=Math.max(t.x0,t.x1);if(!Number.isFinite(e)||!Number.isFinite(n))return null;let r=(e+n)/2,a=l.map((t,a)=>({column:a,intervalDistance:t<e?e-t:t>n?t-n:0,centerDistance:Math.abs(t-r)})).sort((e,t)=>e.intervalDistance-t.intervalDistance||e.centerDistance-t.centerDistance||e.column-t.column),s=a[0];if(!s||s.intervalDistance>.58*i)return null;let u=a[1];if(u&&0===s.intervalDistance&&0===u.intervalDistance||u&&Math.abs(u.intervalDistance-s.intervalDistance)<=.035*i&&Math.abs(u.centerDistance-s.centerDistance)<=.035*i)return null;o[s.column]++}return o.map(e=>e?String(Math.min(9,e)):null)}},{"@parcel/transformer-js/src/esmodule-helpers.js":"b0H7B"}]},["gFFiE"],"gFFiE","parcelRequirecca2",{});