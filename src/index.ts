// Boot module: registry, theme sync, OCR bar, engine, canvas init.

// ---------------------------------------------------------------------------
// Root window helper
// ---------------------------------------------------------------------------

export function getRootWindow(): Window {
  let w: Window = window;
  try { while (w.parent && w.parent !== w) w = w.parent as Window; } catch (_) { }
  return w;
}

// ---------------------------------------------------------------------------
// LIA registry — must be declared before any import side-effects run.
// Other modules import LIA from here; they must not access it at module
// evaluation time (only inside functions called after boot).
// ---------------------------------------------------------------------------

export const LIA: any = (window as any).__LIA_CANVAS_OCR__ = (window as any).__LIA_CANVAS_OCR__ || {
  SHOW_BAR: false,
  bar: null,
  ocr: null,
  canvasPlusOcr: null,
  tfjs: null,
  tfjsLoad: null,
  canvasPlusTfjs: null,
  canvasPlusTfjsLoad: null,
  activeOcrLoadEngine: null,
  store: {},
  uidSeq: 0,
  freeze: {},
  barBoot: false,
  canvasBoot: false,
  launcherBound: false,
};

// ---------------------------------------------------------------------------
// Deferred imports — placed after LIA so the circular reference is safe.
// These modules import LIA, but only use it inside functions, never at the
// top level, so by the time those functions run LIA is already initialized.
// ---------------------------------------------------------------------------

import { ensureOcrBar } from './ocr/bar';
import { ensureOcrEngine } from './ocr/engine';
import { applyThemeVars, getThemeDocument } from './canvas/theme';
import { ensureCanvasFreezeApi } from './canvas/freeze';
import { initAll, canvasMarkup } from './canvas/index';
import { liaT } from './lia/i18n';
import {
  validateCalculationSubmission,
  type CalculationQuizGrade,
} from './math/equivalence';
import {
  validateColumnAdditionSubmission
} from './math/column-arithmetic';
import { validateColumnSubtractionSubmission } from './math/column-subtraction';
import { validateColumnMultiplicationSubmission } from './math/column-multiplication';
import { validateColumnDivisionSubmission } from './math/column-division';
import {
  parseWrittenArithmeticPrompt,
  validateWrittenArithmeticSubmission,
  type WrittenArithmeticKind,
  type WrittenArithmeticValidation
} from './math/written-arithmetic';

const CANVAS_PAIR_SELECTOR = '.lia-canvas-pair';
const THEME_ATTRIBUTES = ['class', 'style', 'data-theme', 'data-color-scheme'];

let discoveryObserver: MutationObserver | null = null;
let themeObserver: MutationObserver | null = null;
let themeSyncFrame = 0;
let themeSyncRunning = false;

function calculationQuizMessage(grade: CalculationQuizGrade): string {
  const reason = grade.firstProblem?.reason || '';
  const line = grade.firstProblem?.lineIndex;
  if (reason === 'too-few-lines') {
    return liaT('ocr.quiz.tooFewLines', 'Write the starting equation and at least one solution step.');
  }
  if (reason === 'too-many-lines') {
    return liaT('ocr.quiz.tooManyLines', 'Use at most 32 calculation lines.');
  }
  if (reason === 'invalid-format') {
    return liaT('ocr.quiz.invalidFormat', 'The submitted calculation could not be read.');
  }
  if (reason === 'cas-unavailable') {
    return liaT('ocr.quiz.casUnavailable', 'The mathematical check is not available.');
  }
  if (grade.firstProblem?.stage === 'prompt' && reason === 'prompt-mismatch') {
    return liaT('ocr.quiz.taskMismatch', 'The first line must match the given equation.');
  }
  if (grade.firstProblem?.stage === 'transition') {
    return liaT('ocr.quiz.transitionProblem', 'Check the transition from line {from} to line {to}.')
      .replace('{from}', String((line ?? 0) + 1))
      .replace('{to}', String((line ?? 0) + 2));
  }
  if (grade.firstProblem?.stage === 'final') {
    return liaT('ocr.quiz.notSolved', 'Finish by isolating the variable or writing the complete root solution.');
  }
  return liaT('ocr.quiz.unknown', 'The calculation could not be checked safely.');
}

LIA.validateCalculationSubmission = validateCalculationSubmission;
LIA.validateColumnAdditionSubmission = validateColumnAdditionSubmission;
LIA.validateColumnSubtractionSubmission = validateColumnSubtractionSubmission;
LIA.validateColumnMultiplicationSubmission = validateColumnMultiplicationSubmission;
LIA.validateColumnDivisionSubmission = validateColumnDivisionSubmission;
LIA.parseWrittenArithmeticPrompt = parseWrittenArithmeticPrompt;
LIA.validateWrittenArithmeticSubmission = validateWrittenArithmeticSubmission;

function writtenArithmeticQuizMessage(
  kind: WrittenArithmeticKind,
  reason: WrittenArithmeticValidation['reason']
): string {
  const common: Record<string, string> = {
    'invalid-prompt': liaT(
      'ocr.quiz.column.invalidPrompt',
      'The task does not define a valid written calculation.'
    ),
    'prompt-result-mismatch': liaT(
      'ocr.quiz.column.promptResultMismatch',
      'The result given in the task does not match its operands.'
    ),
    'invalid-format': liaT(
      'ocr.quiz.column.invalidFormat',
      'The written calculation could not be read.'
    ),
    'operand-mismatch': liaT(
      'ocr.quiz.column.operandMismatch',
      'The written operands do not match the task.'
    ),
    'result-mismatch': liaT(
      'ocr.quiz.column.resultMismatch',
      'Check the result row.'
    )
  };
  if (common[reason]) return common[reason];

  const modeMessages: Record<WrittenArithmeticKind, Record<string, string>> = {
    'column-addition': {
      'carry-mismatch': liaT(
        'ocr.quiz.column.carryMismatch',
        'Check the written carries.'
      ),
      'missing-carry': liaT(
        'ocr.quiz.column.missingCarry',
        'A required carry is missing.'
      )
    },
    'column-subtraction': {
      'borrow-mismatch': liaT(
        'ocr.quiz.column.borrowMismatch',
        'Check the written borrows.'
      ),
      'missing-borrow': liaT(
        'ocr.quiz.column.missingBorrow',
        'A required borrow is missing.'
      )
    },
    'column-multiplication': {
      'partial-product-order-mismatch': liaT(
        'ocr.quiz.column.partialOrderMismatch',
        'Check the order of the written partial products.'
      ),
      'partial-product-mismatch': liaT(
        'ocr.quiz.column.partialMismatch',
        'Check the written partial products.'
      ),
      'shift-mismatch': liaT(
        'ocr.quiz.column.shiftMismatch',
        'Check the place-value shift of the partial product.'
      ),
      'missing-partial-product': liaT(
        'ocr.quiz.column.missingPartial',
        'A required partial product is missing.'
      )
    },
    'column-division': {
      'quotient-mismatch': liaT(
        'ocr.quiz.column.quotientMismatch',
        'Check the quotient.'
      ),
      'remainder-mismatch': liaT(
        'ocr.quiz.column.remainderMismatch',
        'Check the remainder.'
      ),
      'missing-remainder': liaT(
        'ocr.quiz.column.missingRemainder',
        'The nonzero remainder is missing.'
      ),
      'step-mismatch': liaT(
        'ocr.quiz.column.divisionStepMismatch',
        'Check the written division steps.'
      ),
      'missing-step': liaT(
        'ocr.quiz.column.missingDivisionStep',
        'A required division step is missing.'
      ),
      'extra-step': liaT(
        'ocr.quiz.column.extraDivisionStep',
        'The written division contains an extra step.'
      )
    }
  };
  return modeMessages[kind][reason] ||
    liaT('ocr.quiz.unknown', 'The calculation could not be checked safely.');
}

LIA.checkCalculationAnswer = (
  promptTex: string,
  answerValue: string
): {
  accepted: boolean;
  outcome: CalculationQuizGrade['outcome'] | WrittenArithmeticValidation['outcome'];
  ok: boolean;
  status: CalculationQuizGrade['outcome'] | WrittenArithmeticValidation['outcome'];
  reason: string;
  message: string;
} => {
  const writtenPrompt = parseWrittenArithmeticPrompt(promptTex);
  if (writtenPrompt) {
    const grade = validateWrittenArithmeticSubmission(writtenPrompt, answerValue);
    return {
      ...grade,
      ok: grade.accepted,
      status: grade.outcome,
      reason: grade.reason,
      message: grade.accepted
        ? liaT('ocr.quiz.column.correct', 'The written calculation is correct.')
        : writtenArithmeticQuizMessage(writtenPrompt.kind, grade.reason)
    };
  }
  const grade = validateCalculationSubmission(promptTex, answerValue);
  return {
    ...grade,
    ok: grade.accepted,
    status: grade.outcome,
    reason: grade.firstProblem?.reason || (grade.accepted ? 'correct' : 'unknown'),
    message: grade.accepted
      ? liaT('ocr.quiz.correct', 'The complete calculation is correct.')
      : calculationQuizMessage(grade),
  };
};

// ---------------------------------------------------------------------------
// Single registry — guards against double-init across iframes
// ---------------------------------------------------------------------------

const ROOT = getRootWindow() as any;
const REGKEY = '__LIA_CANVAS_OCR_REG_V1__';
ROOT[REGKEY] = ROOT[REGKEY] || { inited: {} };

const DOC_ID = document.baseURI || location.href;
if (!ROOT[REGKEY].inited[DOC_ID]) {
  ROOT[REGKEY].inited[DOC_ID] = true;
  boot();
}

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------

function boot(): void {
  if (document.querySelector(CANVAS_PAIR_SELECTOR)) {
    startCanvasRuntime();
    return;
  }

  if (LIA.discoveryBoot) return;
  LIA.discoveryBoot = true;

  const root = document.body || document.documentElement;
  discoveryObserver = new MutationObserver((records) => {
    for (const record of records) {
      for (const node of Array.from(record.addedNodes)) {
        if (nodeContainsCanvasPair(node)) {
          startCanvasRuntime();
          return;
        }
      }
    }
  });
  discoveryObserver.observe(root, { childList: true, subtree: true });
  LIA.discoveryObserver = discoveryObserver;

  // Close the query/observe race without polling.
  if (document.querySelector(CANVAS_PAIR_SELECTOR)) startCanvasRuntime();
}

function nodeContainsCanvasPair(node: Node): boolean {
  if (node.nodeType !== Node.ELEMENT_NODE) return false;
  const el = node as Element;
  return el.matches(CANVAS_PAIR_SELECTOR) || !!el.querySelector(CANVAS_PAIR_SELECTOR);
}

function startCanvasRuntime(): void {
  if (LIA.canvasBoot) return;
  LIA.canvasBoot = true;
  LIA.uidSeq = LIA.uidSeq || 0;

  if (discoveryObserver) {
    discoveryObserver.disconnect();
    discoveryObserver = null;
  }
  if (LIA.discoveryObserver) {
    try { LIA.discoveryObserver.disconnect(); } catch (_) { }
    LIA.discoveryObserver = null;
  }

  if (!LIA.barBoot) {
    LIA.barBoot = true;
    ensureOcrBar();
  }

  installThemeSync();
  ensureOcrEngine();
  ensureCanvasFreezeApi();
  initAll();
  bindLauncher();
  observeRuntimeCanvasPairs();
}

function observeRuntimeCanvasPairs(): void {
  if (LIA.runtimePairObserver) return;
  const root = document.body || document.documentElement;
  if (!root) return;

  const observer = new MutationObserver(records => {
    for (const record of records) {
      for (const node of Array.from(record.addedNodes)) {
        if (!nodeContainsCanvasPair(node)) continue;
        initAll();
        refreshCanvasPlusLaunchers();
        return;
      }
    }
  });
  observer.observe(root, { childList: true, subtree: true });
  LIA.runtimePairObserver = observer;
}

function observeThemeSources(): void {
  if (!themeObserver) return;
  const sourceDoc = getThemeDocument();
  const options: MutationObserverInit = {
    attributes: true,
    attributeFilter: THEME_ATTRIBUTES,
  };
  const targets = [sourceDoc.documentElement, sourceDoc.body].filter(
    (target, index, all): target is HTMLElement => !!target && all.indexOf(target) === index
  );
  for (const target of targets) {
    try { themeObserver.observe(target, options); } catch (_) { }
  }
}

function runThemeSync(): void {
  if (themeSyncRunning) return;
  themeSyncRunning = true;
  if (themeObserver) themeObserver.disconnect();
  try {
    applyThemeVars();
  } finally {
    if (themeObserver) themeObserver.takeRecords();
    observeThemeSources();
    themeSyncRunning = false;
  }
}

function queueThemeSync(): void {
  if (themeSyncFrame) return;
  themeSyncFrame = requestAnimationFrame(() => {
    themeSyncFrame = 0;
    runThemeSync();
  });
}

function installThemeSync(): void {
  if (LIA.themeBoot) return;
  LIA.themeBoot = true;
  themeObserver = new MutationObserver(() => queueThemeSync());
  LIA.themeObserver = themeObserver;
  runThemeSync();

  try {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    if (typeof media.addEventListener === 'function') media.addEventListener('change', queueThemeSync);
    else if (typeof media.addListener === 'function') media.addListener(queueThemeSync);
  } catch (_) { }
  window.addEventListener('resize', queueThemeSync, { passive: true });
}

function refreshCanvasPlusLaunchers(root: ParentNode = document): void {
  root.querySelectorAll(
    '.lia-canvas-pair[data-canvas-mode=plus]'
  ).forEach(node => {
    const pair = node as HTMLElement;
    const button = pair.querySelector('.lia-canvas-launch') as HTMLButtonElement | null;
    const mount = pair.querySelector('.lia-canvas-mount') as HTMLElement | null;
    if (!button || !mount) return;

    // Keep Calculation launchers visually identical to the classic @canvas
    // launcher. Remove legacy text spans from older copied macro definitions;
    // the localized state remains available through title/aria-label.
    button.querySelectorAll('.lia-canvas-launch-label').forEach(label => {
      label.remove();
    });
    const open = mount.dataset.open === '1';
    const text = open
      ? liaT('ocr.plus.closeBlock', 'Close calculation block')
      : liaT('ocr.plus.openBlock', 'Open calculation block');
    button.title = text;
    button.setAttribute('aria-label', text);
    button.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
}

function bindLauncher(): void {
  if (!LIA.launcherI18nListener) {
    const onLauncherI18nUpdate = () => refreshCanvasPlusLaunchers();
    document.addEventListener(
      'lia:canvas-i18n-update',
      onLauncherI18nUpdate as EventListener,
    );
    LIA.launcherI18nListener = onLauncherI18nUpdate;
  }
  if (LIA.launcherBound) {
    refreshCanvasPlusLaunchers();
    return;
  }
  LIA.launcherBound = true;
  refreshCanvasPlusLaunchers();

  document.addEventListener('click', (e: MouseEvent) => {
    const btn = (e.target as Element)?.closest?.('.lia-canvas-launch') as HTMLElement | null;
    if (!btn) return;

    const pair = btn.closest('.lia-canvas-pair') as HTMLElement | null;
    if (!pair) return;

    const mount = pair.querySelector('.lia-canvas-mount') as HTMLElement | null;
    if (!mount) return;

    if (!mount.dataset.uid) {
      LIA.uidSeq = (LIA.uidSeq || 0) + 1;
      mount.dataset.uid = 'c' + LIA.uidSeq;
    }

    try {
      const parent = mount.parentElement;
      if (parent) {
        const cs = getComputedStyle(parent);
        if (String(cs.display).includes('flex') && String(cs.flexWrap) === 'nowrap') {
          parent.style.flexWrap = 'wrap';
        }
      }
    } catch (_) { }

    if (mount.dataset.open !== '1') {
      mount.dataset.open = '1';
      if (!mount.querySelector('.lia-draw-wrap')) {
        mount.innerHTML = canvasMarkup();
        initAll();
      }
    } else {
      mount.dataset.open = '0';
    }
    refreshCanvasPlusLaunchers();
  }, true);
}
