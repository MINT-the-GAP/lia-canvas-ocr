// Canvas: markup, setup, init, launcher.

import { LIA } from '../index';
import {
    COLORS, getAutoPen, getAccentCssVar, rgbaFromAny,
    setUndoIcon, setRedoIcon, setEraserIcon, setRectIcon
} from './theme';
import { ensureMountUID, __liaDispatchCanvasFreezeChange } from './store';
export { ensureCanvasFreezeApi } from './freeze';
import {
    __liaApplyValue,
    __liaFindAndSetInputBeforeNode,
    __liaInitTexPreviews,
    __liaReadFieldValue,
    __liaRefreshAllTexPreviewBorders,
    __liaRenderTexPreview
} from '../lia/input';
import { liaT } from '../lia/i18n';
import { parseCalculationOptions } from '../lia/calculation-options';
import {
    createCalculationReview,
    type CalculationReviewAnalysis,
    type CalculationReviewController
} from '../lia/calculation-review';
import {
    sanitizeCalculationReviewFreezeState,
    type CalculationReviewFreezeState
} from './calculation-freeze';
import {
    extractCalculationEquation,
    serializeCalculationSubmission,
    validateCalculationSubmission
} from '../math/equivalence';
import {
    createColumnAdditionSubmission
} from '../math/column-arithmetic';
import {
    createColumnSubtractionSubmission
} from '../math/column-subtraction';
import {
    createColumnMultiplicationSubmission,
    parseColumnMultiplicationPrompt
} from '../math/column-multiplication';
import {
    createColumnDivisionSubmission,
    parseColumnDivisionPrompt,
    type ColumnDivisionStep
} from '../math/column-division';
import {
    composeWrittenArithmeticLatex,
    createExpectedWrittenArithmeticSubmission,
    parseWrittenArithmeticPrompt,
    serializeWrittenArithmeticSubmission,
    validateWrittenArithmeticSubmission,
    writtenArithmeticLayoutRowCount,
    type WrittenArithmeticKind,
    type WrittenArithmeticPrompt,
    type WrittenArithmeticSubmission
} from '../math/written-arithmetic';
import { generateExpectedCalculation } from '../math/expected-calculation';
import {
    mapOcrCarryOnesToColumns,
    normalizeOcrColumnDigits,
    normalizeOcrColumnDigitsExact,
    selectOcrColumnAdditionSegments,
    selectOcrColumnStackSegments
} from '../ocr/column-layout';
import {
    OCR_LAYOUT_ALGORITHM_VERSION,
    alignFirstTopLevelRelation,
    canRestoreOcrPlusMinusFromSplit,
    canComposeOcrOperationSeparator,
    composeOcrStructuralParts,
    composeMultilineLatex,
    findMissingPlusMinusRootLine,
    getOcrOperationSeparators,
    getOcrStructuralBars,
    getOcrStructuralDelimiters,
    insertPlusMinusIntoIndexedRootSolution,
    normalizeCalculationLineSequence,
    normalizeOcrOperationSide,
    ocrDelimiterToken,
    recoverOcrOperationSeparatorFromWholeLine,
    segmentOcrCanvas,
    type OcrLineSegment,
    type OcrStructuralToken
} from '../ocr/layout';
import { enqueueOcrJob, promoteOcrJob, type OcrJobPriority } from '../ocr/job-queue';
import { ensureCanvasPlusFormulaOcrEngine } from '../ocr/formulanet-engine';
import {
    classifyOcrVerticalSymbolPath,
    findOcrCalculationRuleHints,
    findOcrCarryOneHints,
    findOcrDelimiterHints,
    findOcrDivisionRuleHints,
    findOcrPlusMinusBoxes,
    type OcrCalculationRuleHint,
    type OcrCarryOneHint,
    type OcrDivisionRuleHint
} from '../ocr/symbol-geometry';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CANVAS_DEFAULT_H = 245;   // px — matches CSS canvas.lia-draw initial height
const CANVAS_MIN_H = 130;   // px — minimum canvas height when resizing
const CANVAS_MAX_H = 9000;  // px — maximum canvas height when resizing
const CANVAS_MIN_W = 200;   // px — minimum canvas width when resizing

const OCR_MIN_SIDE = 420;   // px — minimum side length for OCR normalization
const OCR_MAX_SIDE = 1400;  // px — maximum side length for OCR normalization
const OCR_BINARIZE_THR = 200;   // luminance threshold (0–255) for binarization

const PLUS_OCR_MAX_RASTER_PIXELS = 3000000;
const PLUS_OCR_MAX_RASTER_SIDE = 3200;
const PLUS_OCR_MAX_LINES = 32;

const CANVAS_COLOR_FALLBACKS: Record<string, string> = {
    auto: 'Automatic',
    red: 'Red',
    orange: 'Orange',
    yellow: 'Yellow',
    violett: 'Violet',
    blue: 'Blue',
    lightblue: 'Light blue',
    green: 'Green',
    darkgreen: 'Dark green',
    black: 'Black',
    white: 'White'
};

const HTML_ESCAPE_MAP: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '\u0022': '&quot;',
    [String.fromCharCode(39)]: '&#39;'
};

function escapeHtml(value: unknown): string {
    return String(value ?? '').replace(
        /[&<>'\u0022]/g,
        character => HTML_ESCAPE_MAP[character] || character
    );
}

const STROKE_CAPTURE_MIN_STEP_PX = 0.35;      // minimum pixel distance to record a new stroke point
const STROKE_CAPTURE_TARGET_STEP_PX = 1.4;    // target step size for stroke interpolation
const STROKE_CAPTURE_MAX_INTERP_POINTS = 12;  // maximum interpolated points per segment

function normalizeCalculationPairOptions(pair: HTMLElement): boolean {
    const calculationOptions = parseCalculationOptions(
        pair.dataset.calculationOptions
    );
    const isWrittenArithmetic = Boolean(
        parseWrittenArithmeticPrompt(pair.dataset.calculationPrompt || '')
    );
    const lineFeedbackEnabled = Boolean(
        pair.dataset.canvasMode === 'plus' &&
        pair.dataset.canvasOutput === 'answer' &&
        !isWrittenArithmetic &&
        calculationOptions.lineFeedback
    );
    pair.dataset.lineFeedback = lineFeedbackEnabled ? '1' : '0';
    pair.dataset.calculationOptionsState = calculationOptions.valid
        ? 'valid'
        : 'invalid';
    if (calculationOptions.error) {
        pair.dataset.calculationOptionsError = calculationOptions.error;
    } else {
        delete pair.dataset.calculationOptionsError;
    }
    return lineFeedbackEnabled;
}

type CanvasPlusDocumentRecognition = {
    kind: 'equation' | WrittenArithmeticKind;
    lines: Array<{
        bbox: { x: number; y: number; width: number; height: number };
        fingerprint: string;
        latex: string;
        source: 'cache' | 'inflight' | 'recognition';
    }>;
    editableText: string;
    latex: string;
    lineCount: number;
    modelKey: string;
    cacheHits: number;
    awaitedCount: number;
    recognizedCount: number;
    writtenSubmission?: WrittenArithmeticSubmission;
};

type CanvasPlusInflightLine = {
    promise: Promise<string>;
    generation: number;
};

type CanvasPlusCorrection = {
    revision: number;
    modelKey: string;
    editableText: string;
    latex: string;
    lineCount: number;
};

// ---------------------------------------------------------------------------
// Native LiaScript resolve handoff
// ---------------------------------------------------------------------------

const NATIVE_ANSWER_PAIR_SELECTOR =
    '.lia-canvas-pair[data-canvas-output=answer]' +
    '[data-answer-format=native-equation-v1]';
const NATIVE_QUIZ_FIELD_SELECTOR = [
    'input.lia-quiz__input',
    'textarea.lia-quiz__input',
    '[contenteditable=true].lia-quiz__input'
].join(', ');
const NATIVE_RESOLVE_PRE_APPLY_SETTLE_MS = 80;
// LiaScript's Firefox renderer performs a second authored-answer write roughly
// 1.2 seconds after Resolve. Keep the finite guard alive through that pass.
const NATIVE_RESOLVE_POST_APPLY_SETTLE_MS = 2800;
const NATIVE_RESOLVE_JOB_TIMEOUT_MS = 3200;

type NativeResolveJob = {
    pair: HTMLElement;
    pairKey: string;
    deadline: number;
    timer: number;
    cancelled: boolean;
    field: HTMLElement | null;
    authoredEquation: string;
    submission: string;
    stableSince: number;
};

const nativeResolveJobs = new Map<HTMLElement, NativeResolveJob>();
let nativeResolveHookBound = false;

function findNativeQuizFieldBeforePair(pair: Element): HTMLElement | null {
    let cursor: Element | null = pair;
    for (let depth = 0; cursor && depth < 10; depth++) {
        const container: HTMLElement | null = cursor.parentElement;
        if (!container) break;
        const fields: HTMLElement[] = Array.from(
            container.querySelectorAll<HTMLElement>(NATIVE_QUIZ_FIELD_SELECTOR)
        );
        for (let index = fields.length - 1; index >= 0; index--) {
            const field = fields[index];
            if (field.compareDocumentPosition(pair) & Node.DOCUMENT_POSITION_FOLLOWING) {
                return field;
            }
        }
        cursor = container;
    }
    return null;
}

function findNativeQuizAfterPair(pair: HTMLElement): HTMLElement | null {
    const containingQuiz = pair.closest('.lia-quiz') as HTMLElement | null;
    if (containingQuiz) return containingQuiz;

    const fieldQuiz = findNativeQuizFieldBeforePair(pair)?.closest('.lia-quiz') as
        HTMLElement | null;
    if (fieldQuiz) return fieldQuiz;

    const scope = pair.closest('main') || document;
    const quizzes = Array.from(scope.querySelectorAll<HTMLElement>('.lia-quiz'));
    for (const quiz of quizzes) {
        if (pair.compareDocumentPosition(quiz) & Node.DOCUMENT_POSITION_FOLLOWING) {
            return quiz;
        }
    }
    return null;
}

function findAnswerPairForQuiz(quiz: HTMLElement): HTMLElement | null {
    const pairs = Array.from(
        document.querySelectorAll<HTMLElement>(NATIVE_ANSWER_PAIR_SELECTOR)
    );
    for (const pair of pairs) {
        if (findNativeQuizAfterPair(pair) === quiz) return pair;
    }
    return null;
}

function checkCalculationAnswerByUID(pairKey: string): boolean {
    const pair = Array.from(
        document.querySelectorAll<HTMLElement>(NATIVE_ANSWER_PAIR_SELECTOR)
    ).find(candidate => candidate.dataset.calculationQuiz === pairKey);
    if (!pair) return false;

    const promptEquation = String(pair.dataset.calculationPrompt || '').trim();
    const field = findNativeQuizFieldBeforePair(pair);
    if (!promptEquation || !field) return false;

    const answer = __liaReadFieldValue(field);
    const writtenPrompt = parseWrittenArithmeticPrompt(promptEquation);
    return writtenPrompt
        ? validateWrittenArithmeticSubmission(writtenPrompt, answer).accepted
        : validateCalculationSubmission(promptEquation, answer).accepted;
}

function cancelNativeResolveJob(pair: HTMLElement): void {
    const job = nativeResolveJobs.get(pair);
    if (!job) return;
    job.cancelled = true;
    if (job.timer) window.clearTimeout(job.timer);
    job.timer = 0;
    nativeResolveJobs.delete(pair);
}

function finishNativeResolveJob(job: NativeResolveJob): void {
    if (job.timer) window.clearTimeout(job.timer);
    job.timer = 0;
    job.cancelled = true;
    if (nativeResolveJobs.get(job.pair) === job) {
        nativeResolveJobs.delete(job.pair);
    }
}

function liveAnswerPairForJob(job: NativeResolveJob): HTMLElement | null {
    if (job.pair.isConnected) return job.pair;
    if (!job.pairKey) return null;
    const pairs = document.querySelectorAll<HTMLElement>(NATIVE_ANSWER_PAIR_SELECTOR);
    for (const pair of Array.from(pairs)) {
        if (pair.dataset.calculationQuiz === job.pairKey) return pair;
    }
    return null;
}

function applyNativeQuizSubmission(
    field: HTMLElement,
    submission: string
): boolean {
    if (!field.isConnected) return false;
    // Ensure the preview listener exists before dispatching the normal input
    // then change sequence. Programmatic events also work for disabled inputs;
    // never re-enable the resolved LiaScript control.
    __liaInitTexPreviews();
    if (__liaReadFieldValue(field) === submission) return true;
    const applied = __liaApplyValue(field, submission);
    if (applied) __liaRefreshAllTexPreviewBorders(document);
    return applied;
}

function applyNativeQuizSubmissionForPair(
    pair: HTMLElement,
    submission: string
): boolean {
    const field = findNativeQuizFieldBeforePair(pair);
    return field ? applyNativeQuizSubmission(field, submission) : false;
}

function retryNativeResolveJob(job: NativeResolveJob): void {
    if (job.cancelled || nativeResolveJobs.get(job.pair) !== job) return;
    if (performance.now() >= job.deadline) {
        // Finish with one last write after the bounded settling window. This
        // covers a final late Firefox/Elm render without creating a permanent
        // observer or an unbounded rewrite loop.
        if (job.submission) {
            const pair = liveAnswerPairForJob(job);
            const quiz = pair ? findNativeQuizAfterPair(pair) : null;
            const field = pair ? findNativeQuizFieldBeforePair(pair) : null;
            if (quiz?.classList.contains('resolved') && field) {
                applyNativeQuizSubmission(field, job.submission);
            }
        }
        finishNativeResolveJob(job);
        return;
    }
    job.timer = window.setTimeout(() => {
        job.timer = 0;
        runNativeResolveJob(job);
    }, 16);
}

function runNativeResolveJob(job: NativeResolveJob): void {
    if (job.cancelled || nativeResolveJobs.get(job.pair) !== job) return;
    const pair = liveAnswerPairForJob(job);
    const quiz = pair ? findNativeQuizAfterPair(pair) : null;
    const field = pair ? findNativeQuizFieldBeforePair(pair) : null;

    // LiaScript resolves its own quiz first. Its render pass both marks the
    // quiz as resolved and writes the authored answer into the (now disabled)
    // input. Wait for both signals instead of racing the native click handler.
    const authoredEquation = field ? __liaReadFieldValue(field).trim() : '';
    if (!pair || !quiz?.classList.contains('resolved') || !field || !authoredEquation) {
        retryNativeResolveJob(job);
        return;
    }

    const now = performance.now();
    if (!job.submission) {
        // Native LiaScript can replace the disabled input once more after the
        // quiz already carries .resolved (notably in Firefox). Require the
        // authored value and field identity to stay quiet before generating.
        if (job.field !== field || job.authoredEquation !== authoredEquation) {
            job.field = field;
            job.authoredEquation = authoredEquation;
            job.stableSince = now;
            retryNativeResolveJob(job);
            return;
        }
        if (now - job.stableSince < NATIVE_RESOLVE_PRE_APPLY_SETTLE_MS) {
            retryNativeResolveJob(job);
            return;
        }

        const writtenPrompt = parseWrittenArithmeticPrompt(authoredEquation);
        const expectedWritten = writtenPrompt
            ? createExpectedWrittenArithmeticSubmission(writtenPrompt)
            : null;
        const writtenSubmission = expectedWritten
            ? serializeWrittenArithmeticSubmission(expectedWritten)
            : '';
        if (writtenPrompt) {
            if (!writtenSubmission) {
                finishNativeResolveJob(job);
                return;
            }
            job.submission = writtenSubmission;
            job.stableSince = now;
            job.deadline = Math.max(
                job.deadline,
                now + NATIVE_RESOLVE_POST_APPLY_SETTLE_MS + 500
            );
            applyNativeQuizSubmission(field, writtenSubmission);
            retryNativeResolveJob(job);
            return;
        }

        const expectedLines = generateExpectedCalculation(authoredEquation);
        if (!expectedLines?.length) {
            // Unsupported equations retain LiaScript's native authored answer.
            finishNativeResolveJob(job);
            return;
        }
        const submission = serializeCalculationSubmission(expectedLines);
        if (!submission) {
            finishNativeResolveJob(job);
            return;
        }
        job.submission = submission;
        job.stableSince = now;
        job.deadline = Math.max(
            job.deadline,
            now + NATIVE_RESOLVE_POST_APPLY_SETTLE_MS + 500
        );
        applyNativeQuizSubmission(field, submission);
        retryNativeResolveJob(job);
        return;
    }

    if (__liaReadFieldValue(field) !== job.submission) {
        // A late native render restored the authored equation. Reapply only on
        // an observed overwrite and restart the finite quiet-period clock.
        applyNativeQuizSubmission(field, job.submission);
        job.stableSince = now;
    } else if (now - job.stableSince >= NATIVE_RESOLVE_POST_APPLY_SETTLE_MS) {
        finishNativeResolveJob(job);
        return;
    }
    retryNativeResolveJob(job);
}

function scheduleNativeResolveHandoff(pair: HTMLElement): void {
    cancelNativeResolveJob(pair);
    const job: NativeResolveJob = {
        pair,
        pairKey: pair.dataset.calculationQuiz || '',
        deadline: performance.now() + NATIVE_RESOLVE_JOB_TIMEOUT_MS,
        timer: 0,
        cancelled: false,
        field: null,
        authoredEquation: '',
        submission: '',
        stableSince: 0
    };
    nativeResolveJobs.set(pair, job);
    // A new task guarantees that LiaScript's native click processing runs
    // before the first inspection. Further retries cover asynchronous renders.
    job.timer = window.setTimeout(() => {
        job.timer = 0;
        runNativeResolveJob(job);
    }, 0);
}

function onNativeResolveClick(event: MouseEvent): void {
    const target = event.target instanceof Element ? event.target : null;
    const button = target?.closest('button.lia-quiz__resolve') as
        HTMLButtonElement | null;
    if (!button || button.disabled) return;
    const quiz = button.closest('.lia-quiz') as HTMLElement | null;
    if (!quiz) return;
    const pair = findAnswerPairForQuiz(quiz);
    if (pair) scheduleNativeResolveHandoff(pair);
}

function cleanupNativeResolveHook(): void {
    if (!nativeResolveHookBound) return;
    nativeResolveHookBound = false;
    document.removeEventListener('click', onNativeResolveClick, true);
    window.removeEventListener('pagehide', onNativeResolvePageHide);
    for (const pair of Array.from(nativeResolveJobs.keys())) {
        cancelNativeResolveJob(pair);
    }
}

function onNativeResolvePageHide(event: PageTransitionEvent): void {
    for (const pair of Array.from(nativeResolveJobs.keys())) {
        cancelNativeResolveJob(pair);
    }
    if (!event.persisted) cleanupNativeResolveHook();
}

function ensureNativeResolveHook(): void {
    if (nativeResolveHookBound) return;
    nativeResolveHookBound = true;
    // Capture associates the still-live native button with its pair before
    // LiaScript is allowed to replace parts of the quiz DOM.
    document.addEventListener('click', onNativeResolveClick, true);
    window.addEventListener('pagehide', onNativeResolvePageHide);
}

// ---------------------------------------------------------------------------
// Pen-touch guard (cross-canvas, prevents accidental touch when stylus is active)
// ---------------------------------------------------------------------------

type PenTouchGuard = { activePenPointers: Set<number> };

function getPenTouchGuard(): PenTouchGuard {
    return (window as any).__LIA_CANVAS_PEN_TOUCH_GUARD__ =
        (window as any).__LIA_CANVAS_PEN_TOUCH_GUARD__ || { activePenPointers: new Set<number>() };
}

function ensureGlobalTouchSuppressor(): PenTouchGuard {
    const guard = getPenTouchGuard();
    if ((window as any).__LIA_CANVAS_GLOBAL_TOUCH_SUPPRESSOR__) return guard;
    (window as any).__LIA_CANVAS_GLOBAL_TOUCH_SUPPRESSOR__ = true;
    const suppressTouchIfPenActive = (evt: Event): void => {
        const isPointerEvent = String(evt.type || '').indexOf('pointer') === 0;
        if (isPointerEvent && String((evt as PointerEvent).pointerType || '') !== 'touch') return;
        if (!guard.activePenPointers.size) return;
        if (evt.cancelable) evt.preventDefault();
        evt.stopPropagation();
    };
    document.addEventListener('touchstart', suppressTouchIfPenActive as EventListener, { capture: true, passive: false });
    document.addEventListener('touchmove', suppressTouchIfPenActive as EventListener, { capture: true, passive: false });
    document.addEventListener('pointerdown', suppressTouchIfPenActive as EventListener, { capture: true, passive: false });
    document.addEventListener('pointermove', suppressTouchIfPenActive as EventListener, { capture: true, passive: false });
    const __penCleanup = (e: Event): void => {
        const pe = e as PointerEvent;
        if (String(pe.pointerType || '').toLowerCase() === 'pen') {
            guard.activePenPointers.delete(pe.pointerId);
        }
    };
    document.addEventListener('pointerup', __penCleanup, { capture: true });
    document.addEventListener('pointercancel', __penCleanup, { capture: true });
    document.addEventListener('pointerleave', __penCleanup, { capture: true });
    return guard;
}

// ---------------------------------------------------------------------------
// Markup
// ---------------------------------------------------------------------------

export function canvasMarkup(): string {
    const undo = escapeHtml(liaT('canvas.undo', 'Undo'));
    const redo = escapeHtml(liaT('canvas.redo', 'Redo'));
    const eraser = escapeHtml(liaT('canvas.eraser', 'Eraser'));
    const pen = escapeHtml(liaT('canvas.pen', 'Pen'));
    const background = escapeHtml(liaT('canvas.background', 'Background'));
    const submit = escapeHtml(liaT('ocr.selectSubmit', 'Submit as Solution'));
    const tools = escapeHtml(liaT('canvas.tools', 'Tools'));
    const drawingArea = escapeHtml(liaT('canvas.drawingArea', 'Drawing area'));
    return `
    <span class="lia-draw-block">
      <span class="lia-draw-wrap">
        <span class="lia-toolstack">
          <button class="lia-tool-btn lia-undo-btn"   type="button" aria-label="${undo}"></button>
          <button class="lia-tool-btn lia-redo-btn"   type="button" aria-label="${redo}"></button>
          <button class="lia-tool-btn lia-eraser-btn" type="button" aria-label="${eraser}"></button>
          <button class="lia-tool-btn lia-color-btn"  type="button" aria-label="${pen}"></button>
          <button class="lia-tool-btn lia-bgmenu-btn" type="button" aria-label="${background}"></button>
          <button class="lia-tool-btn lia-rect-btn"   type="button" aria-label="${submit}"></button>
        </span>

        <span class="lia-tool-menu" data-open="0" aria-label="${tools}"></span>
        <canvas class="lia-draw" aria-label="${drawingArea}"></canvas>
      </span>
    </span>
  `;
}

// ---------------------------------------------------------------------------
// setupCanvas
// ---------------------------------------------------------------------------

function setupCanvas(canvas: HTMLCanvasElement): void {
    const wrap = canvas.closest('.lia-draw-wrap') as HTMLElement | null;
    if (!wrap) return;
    const penTouchGuard = ensureGlobalTouchSuppressor();
    const canvasPenPointers = new Set<number>();
    const trOcr = (key: string, fallback: string) => liaT('ocr.' + key, fallback);
    const trCanvas = (key: string, fallback: string) => liaT('canvas.' + key, fallback);

    const mount = wrap.closest('.lia-canvas-mount') as HTMLElement | null;
    const canvasPair = wrap.closest('.lia-canvas-pair') as HTMLElement | null;
    const isCanvasPlus = canvasPair?.dataset.canvasMode === 'plus';
    const writtenArithmeticPrompt: WrittenArithmeticPrompt | null = isCanvasPlus
        ? parseWrittenArithmeticPrompt(canvasPair?.dataset.calculationPrompt || '')
        : null;
    const writtenArithmeticKind = writtenArithmeticPrompt?.kind || null;
    const isWrittenArithmetic = Boolean(writtenArithmeticPrompt);
    const isColumnAddition = writtenArithmeticKind === 'column-addition';
    const isColumnSubtraction = writtenArithmeticKind === 'column-subtraction';
    const isColumnMultiplication = writtenArithmeticKind === 'column-multiplication';
    const isColumnDivision = writtenArithmeticKind === 'column-division';
    const usesFinalCalculationRule =
        isColumnAddition || isColumnSubtraction || isColumnMultiplication;
    const usesCarryOrBorrowOnes = isColumnAddition || isColumnSubtraction;
    if (canvasPair) {
        canvasPair.dataset.calculationKind = writtenArithmeticKind || 'equation';
    }
    const requestedLineFeedback = canvasPair
        ? normalizeCalculationPairOptions(canvasPair)
        : false;
    const lineFeedbackEnabled = !isWrittenArithmetic && requestedLineFeedback;
    const plusBackgroundRecognitionEnabled = isCanvasPlus &&
        canvasPair?.dataset.ocrMode === 'background';
    const uid = ensureMountUID(mount);

    const btnUndo = wrap.querySelector('.lia-undo-btn') as HTMLButtonElement | null;
    const btnRedo = wrap.querySelector('.lia-redo-btn') as HTMLButtonElement | null;
    const btnColor = wrap.querySelector('.lia-color-btn') as HTMLButtonElement | null;
    const btnEraser = wrap.querySelector('.lia-eraser-btn') as HTMLButtonElement | null;
    const btnRect = wrap.querySelector('.lia-rect-btn') as HTMLButtonElement | null;
    const btnBg = wrap.querySelector('.lia-bgmenu-btn') as HTMLButtonElement | null;
    const menu = wrap.querySelector('.lia-tool-menu') as HTMLElement | null;

    let plusSubmitBtn: HTMLButtonElement | null = null;
    let plusStatus: HTMLElement | null = null;
    let plusResult: HTMLElement | null = null;
    let plusResultDisclosure: HTMLDetailsElement | null = null;
    let plusResultMath: HTMLElement | null = null;
    let plusResultSummary: HTMLElement | null = null;
    let plusEditBtn: HTMLButtonElement | null = null;
    let plusInlineEditor: HTMLElement | null = null;
    let plusEditTextarea: HTMLTextAreaElement | null = null;
    let plusEditInsertPmBtn: HTMLButtonElement | null = null;
    let plusEditApplyBtn: HTMLButtonElement | null = null;
    let plusEditCancelBtn: HTMLButtonElement | null = null;
    let plusEditValidation: HTMLElement | null = null;
    let plusReview: CalculationReviewController | null = null;
    let __plusWrittenSubmission: WrittenArithmeticSubmission | null = null;

    if (isCanvasPlus) {
        const drawBlock = wrap.closest('.lia-draw-block') as HTMLElement | null;
        if (drawBlock) {
            const controls = document.createElement('div');
            controls.className = 'lia-canvasplus-standalone-controls';
            controls.dataset.snapshotAdmin = '1';

            plusSubmitBtn = document.createElement('button');
            plusSubmitBtn.type = 'button';
            plusSubmitBtn.className =
                'lia-btn lia-canvasplus-submit lia-canvasplus-standalone-submit';
            plusSubmitBtn.disabled = true;

            plusStatus = document.createElement('span');
            plusStatus.className = 'lia-canvasplus-standalone-status';
            plusStatus.setAttribute('role', 'status');
            plusStatus.setAttribute('aria-live', 'polite');
            plusStatus.dataset.state = 'empty';

            const submitStack = document.createElement('div');
            submitStack.className = 'lia-canvasplus-submit-stack';
            submitStack.appendChild(plusSubmitBtn);
            submitStack.appendChild(plusStatus);
            controls.appendChild(submitStack);

            plusResultDisclosure = document.createElement('details');
            plusResult = plusResultDisclosure;
            plusResult.className = 'lia-canvasplus-output lia-canvasplus-standalone-result';
            plusResult.dataset.snapshotAdmin = '1';
            plusResult.hidden = true;
            plusResult.dataset.stale = '0';
            plusResult.dataset.state = 'idle';
            plusResult.id = 'lia-canvasplus-result-' + String(uid || 'canvas').replace(/[^a-zA-Z0-9_-]/g, '-');

            const resultKey = String(uid || 'canvas').replace(/[^a-zA-Z0-9_-]/g, '-');
            const resultToggle = document.createElement('summary');
            resultToggle.className = 'lia-canvasplus-result-toggle';

            const resultToggleIndicator = document.createElement('span');
            resultToggleIndicator.className = 'lia-canvasplus-result-toggle-indicator';
            resultToggleIndicator.setAttribute('aria-hidden', 'true');

            const header = document.createElement('div');
            header.className = 'lia-canvasplus-result-header';

            const heading = document.createElement('span');
            heading.className = 'lia-canvasplus-standalone-title';
            heading.textContent = trOcr('plus.resultTitle', 'Rendered calculation block');
            heading.id = 'lia-canvasplus-result-title-' + resultKey;
            heading.setAttribute('role', 'heading');
            heading.setAttribute('aria-level', '3');

            plusEditBtn = document.createElement('button');
            plusEditBtn.type = 'button';
            plusEditBtn.className = 'lia-canvasplus-edit';
            plusEditBtn.disabled = true;
            plusEditBtn.hidden = isWrittenArithmetic;
            plusEditBtn.setAttribute('aria-expanded', 'false');

            header.appendChild(plusEditBtn);

            plusResultSummary = document.createElement('span');
            plusResultSummary.className = 'lia-canvasplus-analysis-summary';
            plusResultSummary.setAttribute('role', 'status');
            plusResultSummary.setAttribute('aria-live', 'polite');
            plusResultSummary.setAttribute('aria-atomic', 'true');

            resultToggle.appendChild(resultToggleIndicator);
            resultToggle.appendChild(heading);
            resultToggle.appendChild(plusResultSummary);

            plusResultMath = document.createElement('div');
            plusResultMath.className = 'lia-canvasplus-rendered lia-canvasplus-standalone-math';

            plusInlineEditor = document.createElement('div');
            plusInlineEditor.className = 'lia-canvasplus-inline-editor';
            plusInlineEditor.hidden = true;
            const editorId = 'lia-canvasplus-editor-' + resultKey;
            const textareaId = 'lia-canvasplus-editor-text-' + resultKey;
            plusInlineEditor.id = editorId;
            plusEditBtn.setAttribute('aria-controls', editorId);

            const editLabel = document.createElement('label');
            editLabel.className = 'lia-canvasplus-label lia-canvasplus-inline-label';
            editLabel.htmlFor = textareaId;

            plusEditTextarea = document.createElement('textarea');
            plusEditTextarea.className = 'lia-canvasplus-textarea lia-canvasplus-inline-textarea';
            plusEditTextarea.id = textareaId;
            plusEditTextarea.rows = 6;
            plusEditTextarea.spellcheck = false;
            plusEditTextarea.autocomplete = 'off';

            plusEditValidation = document.createElement('p');
            plusEditValidation.className = 'lia-canvasplus-edit-validation';
            plusEditValidation.setAttribute('role', 'status');
            plusEditValidation.setAttribute('aria-live', 'polite');
            plusEditValidation.id = textareaId + '-status';
            plusEditTextarea.setAttribute('aria-describedby', plusEditValidation.id);

            const editActions = document.createElement('div');
            editActions.className = 'lia-canvasplus-actions lia-canvasplus-inline-actions';
            plusEditInsertPmBtn = document.createElement('button');
            plusEditInsertPmBtn.type = 'button';
            plusEditInsertPmBtn.className =
                'lia-canvasplus-button lia-canvasplus-insert-pm';
            plusEditInsertPmBtn.hidden = true;
            plusEditCancelBtn = document.createElement('button');
            plusEditCancelBtn.type = 'button';
            plusEditCancelBtn.className = 'lia-canvasplus-button lia-canvasplus-cancel';
            plusEditApplyBtn = document.createElement('button');
            plusEditApplyBtn.type = 'button';
            plusEditApplyBtn.className = 'lia-canvasplus-button lia-canvasplus-accept';
            editActions.appendChild(plusEditInsertPmBtn);
            editActions.appendChild(plusEditCancelBtn);
            editActions.appendChild(plusEditApplyBtn);

            plusInlineEditor.appendChild(editLabel);
            plusInlineEditor.appendChild(plusEditTextarea);
            plusInlineEditor.appendChild(plusEditValidation);
            plusInlineEditor.appendChild(editActions);

            plusResult.dataset.analysisState = 'idle';
           plusResult.dataset.resultSource = 'ocr';
           const resultContent = document.createElement('div');
           resultContent.className = 'lia-canvasplus-result-content';
           resultContent.appendChild(plusResultMath);
           resultContent.appendChild(plusInlineEditor);
           plusResult.appendChild(resultToggle);
            plusResult.appendChild(header);
           plusResult.appendChild(resultContent);
            plusSubmitBtn.setAttribute('aria-controls', plusResult.id);
            controls.appendChild(plusResult);
            drawBlock.appendChild(controls);

            plusReview = createCalculationReview({
                root: plusResult,
                target: plusResultMath,
                summary: plusResultSummary,
                translate: liaT,
                mode: writtenArithmeticKind || 'equation-path',
                composeLatex: isWrittenArithmetic
                    ? () => __plusWrittenSubmission
                        ? composeWrittenArithmeticLatex(__plusWrittenSubmission)
                        : ''
                    : undefined,
                onAnalysis: analysis => {
                    if (!canvasPair || analysis.revision !== __plusRenderedRevision) return;
                    __plusRecordFreezeAnalysis(analysis);
                    canvasPair.dispatchEvent(new CustomEvent('lia:canvasplus-analysis', {
                        bubbles: true,
                        detail: {
                            uid: uid || '',
                            revision: analysis.revision,
                            state: analysis.state,
                            checks: analysis.checks
                        }
                    }));
                }
            });
            plusResultDisclosure.addEventListener('toggle', () => {
                if (plusResultDisclosure?.open) plusReview?.refreshLayout();
            });
        }
    }

    // Action button
    const rectActionBtn = document.createElement('button');
    rectActionBtn.type = 'button';
    rectActionBtn.className = 'lia-rect-action';
    rectActionBtn.textContent = trOcr('selectSubmit', 'Submit as Solution');
    rectActionBtn.style.display = 'none';
    wrap.appendChild(rectActionBtn);

    // Progress bar
    const rectProg = document.createElement('div');
    rectProg.className = 'lia-rect-progress';
    rectProg.dataset.on = '0';
    rectProg.innerHTML = `
    <div class="lia-rect-progbar"><div class="lia-rect-progfill"></div></div>
    <div class="lia-rect-progtxt">0%</div>
  `;
    wrap.appendChild(rectProg);

    const rectProgFill = rectProg.querySelector('.lia-rect-progfill') as HTMLElement | null;
    const rectProgTxt = rectProg.querySelector('.lia-rect-progtxt') as HTMLElement | null;
    let __ocrBusy = false;

    function __liaRefreshOcrTexts(): void {
        const undoLabel = trCanvas('undo', 'Undo');
        const redoLabel = trCanvas('redo', 'Redo');
        if (btnUndo) {
            btnUndo.title = undoLabel;
            btnUndo.setAttribute('aria-label', undoLabel);
        }
        if (btnRedo) {
            btnRedo.title = redoLabel;
            btnRedo.setAttribute('aria-label', redoLabel);
        }
        menu?.setAttribute('aria-label', trCanvas('tools', 'Tools'));
        canvas.setAttribute('aria-label', trCanvas('drawingArea', 'Drawing area'));
        wrap!.querySelector('[data-corner=bl]')?.setAttribute(
            'aria-label',
            trCanvas('resizeBottomLeft', 'Resize drawing area from the bottom left')
        );
        wrap!.querySelector('[data-corner=br]')?.setAttribute(
            'aria-label',
            trCanvas('resizeBottomRight', 'Resize drawing area from the bottom right')
        );
        if (!__ocrBusy) rectActionBtn.textContent = trOcr('selectSubmit', 'Submit as Solution');
        if (plusSubmitBtn) {
            const state = String(plusStatus?.dataset.state || 'empty');
            plusSubmitBtn.textContent = state === 'running'
                ? trOcr('plus.rendering', 'Recognizing calculation block...')
                : state === 'error' || state === 'error-stale'
                    ? trOcr('retry', 'Try again')
                    : trOcr('plus.renderBlock', 'Submit to render');
        }
        if (plusStatus) {
            const state = String(plusStatus.dataset.state || 'empty');
            if (state === 'empty') {
                plusStatus.textContent = __plusSelectionBounds()
                    ? trOcr('plus.selectionEmpty', 'The selected area contains no handwriting.')
                    : trOcr('plus.writeFirst', 'Write a calculation block first.');
            } else if (state === 'ready') {
                plusStatus.textContent = trOcr('plus.readyToRender', 'Ready to render.');
            } else if (state === 'preparing') {
                plusStatus.textContent = trOcr('plus.preparing', 'Preparing recognition in the background...');
            } else if (state === 'prepared') {
                plusStatus.textContent = trOcr('plus.preparedLines', '{count} lines prepared in the background.')
                    .replace('{count}', String(Math.max(0, Number(plusStatus.dataset.lineCount) || 0)));
            } else if (state === 'prepared-stale') {
                plusStatus.textContent = trOcr(
                    'plus.preparedStale',
                    'New recognition prepared — render again.'
                );
            } else if (state === 'stale') {
                plusStatus.textContent = trOcr('plus.stale', 'Handwriting changed — render again.');
            } else if (state === 'rendered') {
                plusStatus.textContent = '';
            } else if (state === 'running') {
                plusStatus.textContent = trOcr('plus.rendering', 'Recognizing calculation block...');
            } else if (state === 'error') {
                const message = trOcr(
                    'plus.renderError',
                    'The calculation block could not be rendered.'
                );
                const detail = String(canvasPair?.dataset.ocrError || '').trim();
                plusStatus.textContent = detail ? message + ' ' + detail : message;
            } else if (state === 'error-stale') {
                const message = trOcr(
                    'plus.renderErrorKeep',
                    'New recognition failed; the previous result remains visible.'
                );
                const detail = String(canvasPair?.dataset.ocrError || '').trim();
                plusStatus.textContent = detail ? message + ' ' + detail : message;
            }
        }
        if (plusResult) {
            const heading = plusResult.querySelector('.lia-canvasplus-standalone-title');
            if (heading) heading.textContent = trOcr('plus.resultTitle', 'Rendered calculation block');
        }
        if (plusEditBtn) {
            plusEditBtn.textContent = trOcr('plus.editResult', 'Edit recognition');
        }
        if (plusInlineEditor) {
            const label = plusInlineEditor.querySelector('.lia-canvasplus-inline-label');
            if (label) {
                label.textContent = trOcr(
                    'plus.texMultiline',
                    'Recognized TeX (one equation per line)'
                );
            }
        }
        if (plusEditCancelBtn) {
            plusEditCancelBtn.textContent = trOcr('plus.cancel', 'Cancel');
        }
        if (plusEditApplyBtn) {
            plusEditApplyBtn.textContent = trOcr('plus.applyCorrection', 'Apply changes');
        }
        if (plusEditInsertPmBtn) {
            plusEditInsertPmBtn.textContent = trOcr('plus.insertPlusMinus', 'Insert ±');
        }
        if (plusInlineEditor && !plusInlineEditor.hidden) __plusValidateEditor();
        plusReview?.refreshTexts();
        if (btnRect) {
            const label = isCanvasPlus
                ? trOcr('plus.selectArea', 'Select render area')
                : trOcr('selectSubmit', 'Submit as Solution');
            btnRect.title = label;
            btnRect.setAttribute('aria-label', label);
        }
        if (rectCloseBtn) {
            rectCloseBtn.setAttribute(
                'aria-label',
                isCanvasPlus
                    ? trOcr('plus.clearSelection', 'Clear render selection')
                    : trCanvas('clearMarkerRectangle', 'Remove selection rectangle')
            );
        }
    }

    const onI18nUpdate = () => {
        __liaRefreshOcrTexts();
        updateUI();
        if (menu && menu.dataset.open === '1') {
            const mode = String((menu as any).__mode || '');
            if (mode === 'pen') buildPenMenu();
            else if (mode === 'eraser') buildEraserMenu();
            else if (mode === 'bg') buildBgMenu();
        }
    };
    document.addEventListener('lia:canvas-i18n-update', onI18nUpdate as EventListener);

    rectProg.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); });
    rectActionBtn.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); });

    // Close button
    const rectCloseBtn = document.createElement('button');
    rectCloseBtn.type = 'button';
    rectCloseBtn.className = 'lia-rect-close';
    rectCloseBtn.setAttribute(
        'aria-label',
        isCanvasPlus
            ? trOcr('plus.clearSelection', 'Clear render selection')
            : trCanvas('clearMarkerRectangle', 'Remove selection rectangle')
    );
    rectCloseBtn.style.display = 'none';
    rectCloseBtn.innerHTML = `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 7L17 17M17 7L7 17" fill="none" stroke="currentColor"
            stroke-width="2.4" stroke-linecap="round"/>
    </svg>
  `;
    wrap.appendChild(rectCloseBtn);

    // Eraser ring
    const eraserRing = document.createElement('span');
    eraserRing.className = 'lia-eraser-ring';
    eraserRing.dataset.on = '0';
    wrap.appendChild(eraserRing);

    rectCloseBtn.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); });
    rectCloseBtn.addEventListener('click', (e) => {
        e.preventDefault(); e.stopPropagation();
        clearMarkerRect();
        btnRect?.focus();
    });

    setUndoIcon(btnUndo);
    setRedoIcon(btnRedo);
    setEraserIcon(btnEraser);
    setRectIcon(btnRect);
    if (btnBg && !(btnBg as any).__bgCleared) { (btnBg as any).__bgCleared = true; btnBg.innerHTML = ''; }

    const ctx = canvas.getContext('2d')!;
    const hiLayer = document.createElement('canvas');
    const hctx = hiLayer.getContext('2d')!;
    const strokeLayer = document.createElement('canvas');
    const sctx = strokeLayer.getContext('2d')!;

    const STORE = LIA.store as Record<string, any>;
    const saved = (uid && STORE[uid]) ? STORE[uid] : null;

    const VIEW = saved && saved.VIEW
        ? { ...saved.VIEW }
        : { panX: 0, panY: 0, scale: 1, minScale: 0.25, maxScale: 8 };

    let __liaCanvasFreezeNotifyTimer = 0;
    let __liaCanvasFreezeNotifyArmed = false;

    function cancelCanvasFreezeNotify(): void {
        if (!__liaCanvasFreezeNotifyTimer) return;
        clearTimeout(__liaCanvasFreezeNotifyTimer);
        __liaCanvasFreezeNotifyTimer = 0;
    }

    function scheduleCanvasFreezeNotify(reason: string): void {
        if (!uid) return;
        if (!__liaCanvasFreezeNotifyArmed) return;
        cancelCanvasFreezeNotify();
        __liaCanvasFreezeNotifyTimer = setTimeout(() => {
            __liaCanvasFreezeNotifyTimer = 0;
            __liaDispatchCanvasFreezeChange({
                uid,
                reason: String(reason || 'persist'),
                hasItems: (Array.isArray(ITEMS) && ITEMS.length > 0) ? 1 : 0
            });
        }, 120) as unknown as number;
    }

    // ---- OCR closures ----

    function __ocrLog(msg: string): void {
        try { const b = LIA.bar; if (b && b.log) b.log(msg); } catch (_) { }
    }

    function __ocrSquashWS(str: string): string {
        const s = String(str || '');
        let out = '', was = false;
        for (let i = 0; i < s.length; i++) {
            const ch = s[i];
            const isWS = (ch === ' ' || ch === '\n' || ch === '\r' || ch === '\t' || ch === '\f');
            if (isWS) { if (!was) out += ' '; was = true; } else { out += ch; was = false; }
        }
        return out.trim();
    }

    function __ocrCleanLatex(s: string): string {
        let t = String(s || '').trim();
        if (t.startsWith('$$') && t.endsWith('$$')) t = t.slice(2, -2).trim();
        if (t.startsWith('$') && t.endsWith('$')) t = t.slice(1, -1).trim();
        if (t.startsWith('\\[') && t.endsWith('\\]')) t = t.slice(2, -2).trim();
        return __ocrSquashWS(t);
    }

    function __ocrUnwrapRoman(t: string): string {
        let s = String(t || '').trim();
        const pre = '\\mathrm{';
        if (s.startsWith(pre) && s.endsWith('}')) {
            s = s.slice(pre.length, -1);
            let out = '';
            for (let i = 0; i < s.length; i++) { if (s[i] !== '~') out += s[i]; }
            return out.trim();
        }
        return s;
    }

    function __ocrNormalizeTimesVsX(input: string): string {
        if (!input) return input;
        // Normalize \div to : consistently (same as post-OCR step, moved here so voting benefits too)
        if (input.indexOf('\\div') !== -1) input = input.replace(/\s*\\div\s*/g, ':');
        if (input.indexOf('\\times') === -1) return input;
        let out = '', i = 0;
        const s = input;
        while (i < s.length) {
            const match = s.indexOf('\\times', i);
            if (match === -1) { out += s.slice(i); break; }
            out += s.slice(i, match);
            let after = match + 6;
            while (after < s.length && s[after] === ' ') after++;
            let before = match - 1;
            while (before >= 0 && s[before] === ' ') before--;
            const nextCh = s[after] || '', prevCh = s[before] || '';
            const isDigit = (c: string) => c >= '0' && c <= '9';
            const isAlphaLower = (c: string) => c >= 'a' && c <= 'z';
            if (isDigit(prevCh) && isDigit(nextCh)) out += '\\cdot';
            else if (isAlphaLower(prevCh) || isAlphaLower(nextCh)) out += 'x';
            else out += '\\cdot';
            i = match + 6;
        }
        return out;
    }

    function __ocrCropFromRect(rectItem: any): HTMLCanvasElement | null {
        if (!rectItem) return null;
        const dpr = window.devicePixelRatio || 1;
        const x0w = Math.min(rectItem.x0, rectItem.x1), y0w = Math.min(rectItem.y0, rectItem.y1);
        const x1w = Math.max(rectItem.x0, rectItem.x1), y1w = Math.max(rectItem.y0, rectItem.y1);
        const A = worldToScreen(x0w, y0w), B = worldToScreen(x1w, y1w);
        let sx0 = clamp(Math.min(A.sx, B.sx), 0, canvas.clientWidth);
        let sy0 = clamp(Math.min(A.sy, B.sy), 0, canvas.clientHeight);
        let sx1 = clamp(Math.max(A.sx, B.sx), 0, canvas.clientWidth);
        let sy1 = clamp(Math.max(A.sy, B.sy), 0, canvas.clientHeight);
        const wCss = sx1 - sx0, hCss = sy1 - sy0;
        if (wCss < 6 || hCss < 6) return null;
        const padCss = 12;
        const srcX = Math.round((sx0 - padCss) * dpr), srcY = Math.round((sy0 - padCss) * dpr);
        const srcW = Math.round((wCss + 2 * padCss) * dpr), srcH = Math.round((hCss + 2 * padCss) * dpr);
        const rasterScale = isCanvasPlus
            ? Math.min(
                1,
                PLUS_OCR_MAX_RASTER_SIDE / Math.max(srcW, srcH),
                Math.sqrt(PLUS_OCR_MAX_RASTER_PIXELS / Math.max(1, srcW * srcH))
            )
            : 1;
        const out = document.createElement('canvas');
        out.width = Math.max(1, Math.round(srcW * rasterScale));
        out.height = Math.max(1, Math.round(srcH * rasterScale));
        const octx = out.getContext('2d', { willReadFrequently: true })!;
        octx.setTransform(1, 0, 0, 1, 0, 0);
        octx.globalCompositeOperation = 'source-over';
        octx.globalAlpha = 1.0;
        octx.clearRect(0, 0, out.width, out.height);
        const SRCW = strokeLayer.width, SRCH = strokeLayer.height;
        let sX = srcX, sY = srcY, sW = srcW, sH = srcH;
        let dX = 0, dY = 0, dW = out.width, dH = out.height;
        if (sX < 0) { const f = (-sX) / sW; dX += dW * f; dW -= dW * f; sW += sX; sX = 0; }
        if (sY < 0) { const f = (-sY) / sH; dY += dH * f; dH -= dH * f; sH += sY; sY = 0; }
        if (sX + sW > SRCW) { const o = (sX + sW) - SRCW; dW -= dW * (o / sW); sW -= o; }
        if (sY + sH > SRCH) { const o = (sY + sH) - SRCH; dH -= dH * (o / sH); sH -= o; }
        if (sW <= 1 || sH <= 1 || dW <= 1 || dH <= 1) return null;
        octx.drawImage(strokeLayer, sX, sY, sW, sH, dX, dY, dW, dH);
        const img = octx.getImageData(0, 0, out.width, out.height);
        const data = img.data;
        for (let i = 0; i < data.length; i += 4) {
            if (data[i + 3] > 10) { data[i] = 0; data[i + 1] = 0; data[i + 2] = 0; data[i + 3] = 255; }
            else { data[i] = 255; data[i + 1] = 255; data[i + 2] = 255; data[i + 3] = 255; }
        }
        octx.putImageData(img, 0, 0);
        (out as any).__liaOcrPixelScale = dpr * VIEW.scale * rasterScale;
        return out;
    }

    function __ocrNormalizeSize(c: HTMLCanvasElement): HTMLCanvasElement {
        const maxSide = Math.max(c.width, c.height);
        let scale = 1;
        if (maxSide < OCR_MIN_SIDE) scale = OCR_MIN_SIDE / maxSide;
        if (maxSide > OCR_MAX_SIDE) scale = OCR_MAX_SIDE / maxSide;
        scale = clamp(scale, 0.5, 4.0);
        if (Math.abs(scale - 1) < 0.06) return c;
        const out = document.createElement('canvas');
        out.width = Math.max(1, Math.round(c.width * scale));
        out.height = Math.max(1, Math.round(c.height * scale));
        const x = out.getContext('2d', { willReadFrequently: true })!;
        x.fillStyle = '#fff'; x.fillRect(0, 0, out.width, out.height);
        x.drawImage(c, 0, 0, out.width, out.height);
        return out;
    }

    function __ocrPreprocessCanvas(src: HTMLCanvasElement): HTMLCanvasElement {
        const c0 = document.createElement('canvas');
        c0.width = Math.max(1, src.width | 0); c0.height = Math.max(1, src.height | 0);
        const x0 = c0.getContext('2d', { willReadFrequently: true })!;
        x0.fillStyle = '#fff'; x0.fillRect(0, 0, c0.width, c0.height); x0.drawImage(src, 0, 0);
        const img = x0.getImageData(0, 0, c0.width, c0.height);
        const d = img.data, W = c0.width, H = c0.height;
        const thr = OCR_BINARIZE_THR;
        const bin = new Uint8Array(W * H);
        for (let i = 0, p = 0; p < bin.length; p++, i += 4) {
            bin[p] = ((d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114) < thr) ? 1 : 0;
        }
        function dilateOnce(srcBin: Uint8Array<ArrayBuffer>): Uint8Array<ArrayBuffer> {
            const out = new Uint8Array(W * H) as Uint8Array<ArrayBuffer>;
            for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
                const idx = y * W + x; let on = 0;
                for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
                    if (srcBin[idx + dy * W + dx]) { on = 1; dy = 2; break; }
                }
                out[idx] = on;
            }
            return out;
        }
        let b2: Uint8Array<ArrayBuffer> = bin as Uint8Array<ArrayBuffer>;
        const DILATE_ITERS = 0;
        for (let k = 0; k < DILATE_ITERS; k++) b2 = dilateOnce(b2);
        let xMin = W, yMin = H, xMax = -1, yMax = -1;
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
            if (!b2[y * W + x]) continue;
            if (x < xMin) xMin = x; if (y < yMin) yMin = y;
            if (x > xMax) xMax = x; if (y > yMax) yMax = y;
        }
        if (xMax < 0) return c0;
        const pad = 18;
        xMin = Math.max(0, xMin - pad); yMin = Math.max(0, yMin - pad);
        xMax = Math.min(W - 1, xMax + pad); yMax = Math.min(H - 1, yMax + pad);
        const cw = Math.max(1, xMax - xMin + 1), ch = Math.max(1, yMax - yMin + 1);
        const c1 = document.createElement('canvas'); c1.width = cw; c1.height = ch;
        const x1 = c1.getContext('2d', { willReadFrequently: true })!;
        const out1 = x1.createImageData(cw, ch);
        const od = out1.data;
        for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) {
            const v = b2[(yMin + y) * W + (xMin + x)] ? 0 : 255;
            const i = (y * cw + x) * 4;
            od[i] = v; od[i + 1] = v; od[i + 2] = v; od[i + 3] = 255;
        }
        x1.putImageData(out1, 0, 0);
        const target = 512, m = Math.max(cw, ch);
        let scale = target / m;
        if (scale < 0.75) scale = 0.75; if (scale > 3.5) scale = 3.5;
        const c2 = document.createElement('canvas');
        c2.width = Math.max(1, Math.round(cw * scale)); c2.height = Math.max(1, Math.round(ch * scale));
        const x2 = c2.getContext('2d', { willReadFrequently: true })!;
        x2.fillStyle = '#fff'; x2.fillRect(0, 0, c2.width, c2.height);
        x2.imageSmoothingEnabled = true; x2.drawImage(c1, 0, 0, c2.width, c2.height);
        return c2;
    }

    function __ocrPreprocessDigitCanvas(src: HTMLCanvasElement, opts: any): HTMLCanvasElement {
        const o = (opts && typeof opts === 'object') ? opts : {};
        const dilate = (o.dilate === 1) ? 1 : 0;
        const c0 = document.createElement('canvas');
        c0.width = Math.max(1, src.width | 0); c0.height = Math.max(1, src.height | 0);
        const x0 = c0.getContext('2d', { willReadFrequently: true })!;
        x0.fillStyle = '#fff'; x0.fillRect(0, 0, c0.width, c0.height); x0.drawImage(src, 0, 0);
        const img = x0.getImageData(0, 0, c0.width, c0.height);
        const d = img.data, W = c0.width, H = c0.height;
        const thr = 225;
        let bin: Uint8Array<ArrayBuffer> = new Uint8Array(W * H);
        for (let i = 0, p = 0; p < bin.length; p++, i += 4) {
            bin[p] = ((d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114) < thr) ? 1 : 0;
        }
        function dilateOnce(srcBin: Uint8Array<ArrayBuffer>): Uint8Array<ArrayBuffer> {
            const out = new Uint8Array(W * H) as Uint8Array<ArrayBuffer>;
            for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
                const idx = y * W + x; let on = 0;
                for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
                    if (srcBin[idx + dy * W + dx]) { on = 1; dy = 2; break; }
                }
                out[idx] = on;
            }
            return out;
        }
        if (dilate === 1) bin = dilateOnce(bin as Uint8Array<ArrayBuffer>);
        let xMin = W, yMin = H, xMax = -1, yMax = -1;
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
            if (!bin[y * W + x]) continue;
            if (x < xMin) xMin = x; if (y < yMin) yMin = y;
            if (x > xMax) xMax = x; if (y > yMax) yMax = y;
        }
        if (xMax < 0) return __ocrPreprocessCanvas(src);
        const cw = Math.max(1, xMax - xMin + 1), ch = Math.max(1, yMax - yMin + 1);
        const pad = Math.max(24, Math.floor(Math.max(cw, ch) * 0.35));
        const side = Math.max(64, Math.min(1024, Math.max(cw, ch) + 2 * pad));
        const c1 = document.createElement('canvas'); c1.width = side; c1.height = side;
        const x1 = c1.getContext('2d', { willReadFrequently: true })!;
        const out1 = x1.createImageData(side, side); const od = out1.data;
        for (let i = 0; i < od.length; i += 4) { od[i] = 255; od[i + 1] = 255; od[i + 2] = 255; od[i + 3] = 255; }
        const offX = Math.floor((side - cw) / 2), offY = Math.floor((side - ch) / 2);
        for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) {
            const v = bin[(yMin + y) * W + (xMin + x)] ? 0 : 255;
            const i = ((offY + y) * side + (offX + x)) * 4;
            od[i] = v; od[i + 1] = v; od[i + 2] = v; od[i + 3] = 255;
        }
        x1.putImageData(out1, 0, 0);
        const c2 = document.createElement('canvas'); c2.width = 512; c2.height = 512;
        const x2 = c2.getContext('2d', { willReadFrequently: true })!;
        x2.fillStyle = '#fff'; x2.fillRect(0, 0, 512, 512);
        x2.imageSmoothingEnabled = false; x2.drawImage(c1, 0, 0, 512, 512);
        return c2;
    }

    function __ocrAddPadding(src: HTMLCanvasElement, px: number): HTMLCanvasElement {
        const p = Math.max(0, Math.round(px));
        const out = document.createElement('canvas');
        out.width = src.width + p * 2;
        out.height = src.height + p * 2;
        const x = out.getContext('2d', { willReadFrequently: true })!;
        x.fillStyle = '#fff';
        x.fillRect(0, 0, out.width, out.height);
        x.drawImage(src, p, p);
        return out;
    }

    function __ocrPrepareCalculationInput(
        engine: any,
        crop: HTMLCanvasElement,
        retry: boolean
    ): HTMLCanvasElement {
        const profile = String(engine && engine.inputProfile || '');
        if (profile === 'formulanet-line-384') {
            // FormulaNet owns its exact grayscale/crop/384x384 normalisation.
            return crop;
        }
        let output = retry
            ? __ocrAddPadding(__ocrPreprocessCanvas(crop), 20)
            : __ocrPreprocessCanvas(crop);
        output = __ocrNormalizeSize(output);
        return output;
    }

    function __ocrDarkenCrop(src: HTMLCanvasElement, factor: number): HTMLCanvasElement {
        const out = document.createElement('canvas');
        out.width = src.width;
        out.height = src.height;
        const x = out.getContext('2d', { willReadFrequently: true })!;
        x.fillStyle = '#fff';
        x.fillRect(0, 0, out.width, out.height);
        x.drawImage(src, 0, 0);
        const img = x.getImageData(0, 0, out.width, out.height);
        const d = img.data;
        const f = Math.max(1, factor);
        for (let i = 0; i < d.length; i += 4) {
            if (d[i + 3] < 128) continue;
            const lum = d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114;
            if (lum < 240) {
                d[i] = Math.max(0, Math.min(255, Math.round(d[i] / f)));
                d[i + 1] = Math.max(0, Math.min(255, Math.round(d[i + 1] / f)));
                d[i + 2] = Math.max(0, Math.min(255, Math.round(d[i + 2] / f)));
            }
        }
        x.putImageData(img, 0, 0);
        return out;
    }

    function __ocrScoreLatex(s: string): number {
        const t = String(s || '').trim();
        if (!t) return -9999;
        if (__ocrMathLooksIncomplete(t)) return t.length - 5000;
        return t.length;
    }

    async function __ocrVotingRecognize(engine: any, crop: HTMLCanvasElement, silent = false): Promise<string> {
        let varA = crop, varB = crop, varC = crop;
        try { varA = __ocrPreprocessCanvas(crop); } catch (_) { varA = crop; }
        try { varA = __ocrNormalizeSize(varA); } catch (_) { }
        try { varB = __ocrAddPadding(__ocrPreprocessCanvas(crop), 20); } catch (_) { varB = varA; }
        try { varB = __ocrNormalizeSize(varB); } catch (_) { }
        try { varC = __ocrPreprocessCanvas(__ocrDarkenCrop(crop, 1.35)); } catch (_) { varC = varA; }
        try { varC = __ocrNormalizeSize(varC); } catch (_) { }
        const opts: Record<string, any> = { max_new_tokens: 128, do_sample: false, temperature: 0 };
        if (silent) opts.__silent = true;
        const [rawA, rawB, rawC] = await Promise.all([
            engine.recognize(varA, opts).catch(() => ''),
            engine.recognize(varB, opts).catch(() => ''),
            engine.recognize(varC, opts).catch(() => ''),
        ]);
        const latexA = __ocrNormalizeTimesVsX(__ocrUnwrapRoman(__ocrCleanLatex(rawA)));
        const latexB = __ocrNormalizeTimesVsX(__ocrUnwrapRoman(__ocrCleanLatex(rawB)));
        const latexC = __ocrNormalizeTimesVsX(__ocrUnwrapRoman(__ocrCleanLatex(rawC)));
        const scoreA = __ocrScoreLatex(latexA);
        const scoreB = __ocrScoreLatex(latexB);
        const scoreC = __ocrScoreLatex(latexC);
        if (scoreA >= scoreB && scoreA >= scoreC) return latexA;
        if (scoreB >= scoreC) return latexB;
        return latexC;
    }

    function __ocrRotateCanvas(src: HTMLCanvasElement, deg: number): HTMLCanvasElement {
        const rad = deg * Math.PI / 180, w = src.width | 0, h = src.height | 0;
        const out = document.createElement('canvas'); out.width = Math.max(1, w); out.height = Math.max(1, h);
        const x = out.getContext('2d', { willReadFrequently: true })!;
        x.fillStyle = '#fff'; x.fillRect(0, 0, out.width, out.height);
        x.translate(out.width / 2, out.height / 2); x.rotate(rad); x.translate(-w / 2, -h / 2);
        x.imageSmoothingEnabled = false; x.drawImage(src, 0, 0);
        return out;
    }

    function __ocrFixDigitsIfPossible(s: string): string | null {
        const t = String(s || '').trim(); if (!t) return null;
        let allDigits = true;
        for (let i = 0; i < t.length; i++) { const c = t.charCodeAt(i); if (c < 48 || c > 57) { allDigits = false; break; } }
        if (allDigits) return t;
        const low = t.toLowerCase();
        if (low === 'li' || low === 'l1' || low === 'il') return '4';
        if (low === 'go' || low === 'g0' || low === 'qo' || low === 'q0') return '8';
        const map: Record<string, string> = { 'O': '0', 'o': '0', 'Q': '0', 'I': '1', 'l': '1', '|': '1', '!': '1', 'Z': '2', 'z': '2', 'J': '3', 'j': '3', 'H': '4', 'h': '4', 'S': '5', 's': '5', 'B': '8', 'g': '9', 'q': '9' };
        let out = '';
        for (let i = 0; i < t.length; i++) { const ch = t[i]; if (map[ch]) out += map[ch]; else return null; }
        return out || null;
    }

    function __ocrIsAllDigits(s: string): boolean {
        const t = String(s || '').trim(); if (!t) return false;
        for (let i = 0; i < t.length; i++) { const c = t.charCodeAt(i); if (c < 48 || c > 57) return false; }
        return true;
    }

    function __ocrMathLooksIncomplete(s: string): boolean {
        const t = String(s || '').trim(); if (!t) return true;
        if (/[+\-*/=,:;\\]$/.test(t)) return true;
        if (/[{[(]$/.test(t)) return true;
        let curly = 0, square = 0, round = 0, escaped = false;
        for (let i = 0; i < t.length; i++) {
            const ch = t[i];
            if (escaped) { escaped = false; continue; }
            if (ch === '\\') { escaped = true; continue; }
            if (ch === '{') curly++; else if (ch === '}') curly--;
            else if (ch === '[') square++; else if (ch === ']') square--;
            else if (ch === '(') round++; else if (ch === ')') round--;
        }
        return curly !== 0 || square !== 0 || round !== 0;
    }

    function __ocrShouldPreferDigits(ink: any, crop: HTMLCanvasElement): boolean {
        if (!ink || !crop) return false;
        const cropW = Math.max(1, crop.width | 0), cropH = Math.max(1, crop.height | 0);
        const w = Math.max(1, ink.w | 0), h = Math.max(1, ink.h | 0);
        const longSide = Math.max(w, h), shortSide = Math.min(w, h);
        const ar = w / Math.max(1, h);
        const fill = (Number(ink.black || 0) || 0) / Math.max(1, w * h);
        if (longSide > 220 || shortSide > 170) return false;
        if (ar < 0.20 || ar > 2.80) return false;
        if (fill < 0.01 || fill > 0.60) return false;
        if (w > Math.floor(cropW * 0.82) && h > Math.floor(cropH * 0.82) && longSide > 140) return false;
        return true;
    }

    function __ocrDigitCandidateFrom(txt: string): string | null {
        const t = String(txt || '').trim(); if (!t) return null;
        if (t.indexOf('\\') !== -1) return null;
        const map: Record<string, string> = { 'O': '0', 'o': '0', 'Q': '0', 'D': '0', 'I': '1', 'l': '1', '|': '1', '!': '1', 'Z': '2', 'z': '2', 'S': '5', 's': '5', 'B': '8', 'g': '9', 'q': '9' };
        let out = '';
        for (let i = 0; i < t.length; i++) {
            const ch = t[i]; const code = t.charCodeAt(i);
            if (code >= 48 && code <= 57) { out += ch; continue; }
            if (' \n\r\t'.includes(ch)) continue;
            if ('${}()[]'.includes(ch)) continue;
            if (',.;:_-'.includes(ch)) continue;
            if (map[ch]) { out += map[ch]; continue; }
            return null;
        }
        out = String(out).trim();
        if (!out || out.length > 3) return null;
        return out;
    }

    async function __ocrDigitGuard(engine: any, cropCanvas: HTMLCanvasElement): Promise<string | null> {
        // Lazy variant factory — avoids creating all 6 canvases when early consensus is reached.
        const c = cropCanvas as any;
        if (!c.__dgBase0) c.__dgBase0 = __ocrPreprocessDigitCanvas(cropCanvas, { dilate: 0 });
        if (!c.__dgBase1) c.__dgBase1 = __ocrPreprocessDigitCanvas(cropCanvas, { dilate: 1 });
        const base0: HTMLCanvasElement = c.__dgBase0;
        const base1: HTMLCanvasElement = c.__dgBase1;

        // deg=0 needs no rotation — reuse the base directly to save a canvas + draw call.
        const variantDefs: Array<() => HTMLCanvasElement> = [
            () => base0,
            () => __ocrRotateCanvas(base0, -6),
            () => __ocrRotateCanvas(base0, 6),
            () => base1,
            () => __ocrRotateCanvas(base1, -6),
            () => __ocrRotateCanvas(base1, 6),
        ];

        const counts: Record<string, number> = {};
        const order: string[] = [];

        for (let i = 0; i < variantDefs.length; i++) {
            let raw = '';
            try { raw = await engine.recognize(variantDefs[i](), { max_new_tokens: 8, do_sample: false, temperature: 0, __silent: true }); } catch (_) { continue; }
            let latex = __ocrCleanLatex(raw); latex = __ocrUnwrapRoman(latex); latex = __ocrNormalizeTimesVsX(latex);
            const cand = __ocrDigitCandidateFrom(latex); if (!cand) continue;
            if (!counts[cand]) { counts[cand] = 0; order.push(cand); }
            counts[cand] += 1;
            if (counts[cand] >= 3) return cand;
        }

        let best = null, bestV = 0;
        for (const k of order) { if ((counts[k] || 0) > bestV) { bestV = counts[k]; best = k; } }
        return best;
    }

    function __ocrInkBBoxQuick(src: HTMLCanvasElement): any {
        try {
            const W = src.width | 0, H = src.height | 0;
            const x = src.getContext('2d', { willReadFrequently: true })!;
            const img = x.getImageData(0, 0, W, H); const d = img.data;
            const step = (W * H > 1200000) ? 2 : 1;
            let xMin = W, yMin = H, xMax = -1, yMax = -1, black = 0;
            for (let y = 0; y < H; y += step) {
                const row = y * W * 4;
                for (let x0 = 0; x0 < W; x0 += step) {
                    const i = row + x0 * 4;
                    if (d[i] < 128) {
                        black++;
                        if (x0 < xMin) xMin = x0;
                        if (y < yMin) yMin = y;
                        if (x0 > xMax) xMax = x0;
                        if (y > yMax) yMax = y;
                    }
                }
            }
            if (xMax < 0) return null;
            const w = xMax - xMin + 1, h = yMax - yMin + 1;
            return { xMin, yMin, xMax, yMax, w, h, black, W, H };
        } catch (_) { }
        return null;
    }

    function __ocrTidyMathText(s: string): string {
        const t = __ocrSquashWS(s), ops = '+-=*/()[]{}';
        let out = '';
        for (let i = 0; i < t.length; i++) {
            const ch = t[i];
            if (ch === ' ') {
                const prev = (i > 0) ? t[i - 1] : '';
                const next = (i + 1 < t.length) ? t[i + 1] : '';
                if (ops.indexOf(prev) >= 0 || ops.indexOf(next) >= 0) continue;
                out += ' ';
            } else {
                out += ch;
            }
        }
        return out.trim();
    }

    function __ocrIsShortPlainToken(s: string): boolean {
        const t = String(s || '').trim();
        if (!t || t.length > 6 || t.indexOf('\\') !== -1) return false;
        let has = false;
        for (let i = 0; i < t.length; i++) {
            const c = t.charCodeAt(i), ch = t[i];
            if (c >= 48 && c <= 57) { has = true; continue; }
            if ('lLIi|!OoQqSsZzBg'.includes(ch)) { has = true; continue; }
            if (' \n\r\t()[]{}.,;:_-'.includes(ch)) continue;
            return false;
        }
        return has;
    }

    function __ocrCleanCalculationResult(engine: any, raw: string): string {
        const modelName = String(engine && engine.model || '');
        const isTrocr = modelName.toLowerCase().indexOf('trocr') !== -1;
        const emitsLatex = String(engine && engine.outputKind || '').toLowerCase() === 'latex';
        const cleaned = (isTrocr && !emitsLatex)
            ? __ocrTidyMathText(raw)
            : emitsLatex
                ? __ocrCleanLatex(raw)
                : __ocrUnwrapRoman(__ocrCleanLatex(raw));
        return __ocrNormalizeTimesVsX(cleaned);
    }

    function __ocrCalculationNeedsRetry(value: string): boolean {
        const text = String(value || '').trim();
        if (!text || __ocrMathLooksIncomplete(text)) return true;
        if (text.length > 256 || text.indexOf('\uFFFD') !== -1) return true;
        return /^(?:generated_text|text|latex)\s*:/i.test(text);
    }

    async function __ocrRecognizeCalculationCrop(
        engine: any,
        crop: HTMLCanvasElement,
        silent: boolean
    ): Promise<string> {
        const opts: Record<string, any> = {
            max_new_tokens: 64,
            do_sample: false,
            temperature: 0
        };
        if (silent) opts.__silent = true;
        let primary = crop;
        try { primary = __ocrPrepareCalculationInput(engine, crop, false); } catch (_) { primary = crop; }
        const firstRaw = await engine.recognize(primary, opts);
        const first = __ocrCleanCalculationResult(engine, firstRaw);
        if (!__ocrCalculationNeedsRetry(first) || engine.calculationSinglePass === true) return first;

        let retry = crop;
        try { retry = __ocrPrepareCalculationInput(engine, crop, true); } catch (_) { retry = crop; }
        const retryOpts = { ...opts, max_new_tokens: 128 };
        const secondRaw = await engine.recognize(retry, retryOpts);
        const second = __ocrCleanCalculationResult(engine, secondRaw);
        if (!__ocrCalculationNeedsRetry(second)) return second;
        return second || first;
    }

    function __ocrSliceCanvas(
        source: HTMLCanvasElement,
        fromX: number,
        toX: number
    ): HTMLCanvasElement | null {
        const x0 = Math.max(0, Math.floor(fromX));
        const x1 = Math.min(source.width - 1, Math.ceil(toX));
        if (x1 - x0 < 2) return null;
        const output = document.createElement('canvas');
        output.width = x1 - x0 + 1;
        output.height = source.height;
        const context = output.getContext('2d', { willReadFrequently: true });
        if (!context) return null;
        context.fillStyle = '#fff';
        context.fillRect(0, 0, output.width, output.height);
        context.drawImage(
            source,
            x0,
            0,
            output.width,
            source.height,
            0,
            0,
            output.width,
            output.height
        );
        return output;
    }

    function __ocrGetStructuralTokens(
        segment: OcrLineSegment,
        fromX: number,
        toX: number,
        includeBars: boolean
    ): Array<{ x0: number; x1: number; token: OcrStructuralToken }> | null {
        const tokens: Array<{ x0: number; x1: number; token: OcrStructuralToken }> = [];
        if (includeBars) {
            for (const bar of getOcrStructuralBars(segment)) {
                if (bar.x1 < fromX || bar.x0 > toX) continue;
                tokens.push({ x0: bar.x0, x1: bar.x1, token: '\\vert' });
            }
        }
        for (const delimiter of getOcrStructuralDelimiters(segment)) {
            if (delimiter.x1 < fromX || delimiter.x0 > toX) continue;
            tokens.push({
                x0: delimiter.x0,
                x1: delimiter.x1,
                token: ocrDelimiterToken(delimiter.kind)
            });
        }
        tokens.sort((left, right) => left.x0 - right.x0 || left.x1 - right.x1);
        for (let index = 1; index < tokens.length; index++) {
            // Never keep only one half of an overlapping structural sequence:
            // that could silently drop a bar or turn a balanced pair into an
            // invented unmatched delimiter.
            if (tokens[index].x0 <= tokens[index - 1].x1) return null;
        }
        return tokens;
    }

    async function __ocrRecognizeStructuredRange(
        engine: any,
        segment: OcrLineSegment,
        fromX: number,
        toX: number,
        silent: boolean,
        includeBars = true,
        abortOnStructuralConflict = false
    ): Promise<string> {
        const rangeStart = Math.max(0, Math.floor(fromX));
        const rangeEnd = Math.min(segment.canvas.width - 1, Math.ceil(toX));
        const structuralTokens = __ocrGetStructuralTokens(
            segment,
            rangeStart,
            rangeEnd,
            includeBars
        );
        if (structuralTokens === null && abortOnStructuralConflict) return '';
        const tokens = structuralTokens || [];
        if (!tokens.length) {
            const crop = __ocrSliceCanvas(segment.canvas, rangeStart, rangeEnd);
            if (!crop || !__ocrInkBBoxQuick(crop)) return '';
            return __ocrRecognizeCalculationCrop(engine, crop, silent);
        }

        const ranges: Array<[number, number]> = [];
        let contentStart = rangeStart;
        for (const token of tokens) {
            ranges.push([contentStart, token.x0 - 1]);
            contentStart = Math.max(contentStart, token.x1 + 1);
        }
        ranges.push([contentStart, rangeEnd]);

        const partResults = await Promise.all(ranges.map(async ([partStart, partEnd]) => {
            const crop = __ocrSliceCanvas(segment.canvas, partStart, partEnd);
            if (!crop || !__ocrInkBBoxQuick(crop)) {
                return { value: '', hadInk: false };
            }
            try {
                return {
                    value: await __ocrRecognizeCalculationCrop(engine, crop, silent),
                    hadInk: true
                };
            } catch (_) {
                // The whole-line result is already available to the caller.
                // A failed narrow crop must not fail the entire submission.
                return { value: '', hadInk: true };
            }
        }));
        // Structural evidence may restore delimiters, but it must never erase
        // visible content merely because a narrow crop was hard to recognize.
        if (partResults.some(result => result.hadInk && !result.value.trim())) {
            return '';
        }
        return composeOcrStructuralParts(
            partResults.map(result => result.value),
            tokens.map(token => token.token)
        );
    }

    async function __ocrRecognizeStructuralLine(
        engine: any,
        segment: OcrLineSegment,
        silent: boolean
    ): Promise<string | null> {
        if (!getOcrStructuralBars(segment).length &&
            !getOcrStructuralDelimiters(segment).length) return null;
        return __ocrRecognizeStructuredRange(
            engine,
            segment,
            0,
            segment.canvas.width - 1,
            silent,
            true,
            true
        );
    }

    function __ocrBarInsideDelimiterPair(
        segment: OcrLineSegment,
        separator: { x0: number; x1: number }
    ): boolean {
        const delimiters = getOcrStructuralDelimiters(segment)
            .slice()
            .sort((left, right) => left.x0 - right.x0);
        const stack: typeof delimiters = [];
        const center = (separator.x0 + separator.x1) * 0.5;
        for (const delimiter of delimiters) {
            const opening = delimiter.kind === 'round-open' ||
                delimiter.kind === 'square-open';
            if (opening) {
                stack.push(delimiter);
                continue;
            }
            const partner = stack.pop();
            if (partner && center > partner.x1 && center < delimiter.x0) {
                return true;
            }
        }
        return false;
    }

    async function __ocrRecognizeCalculationLine(
        engine: any,
        segment: OcrLineSegment,
        silent: boolean
    ): Promise<string> {
        const separators = getOcrOperationSeparators(segment).filter(
            separator => !__ocrBarInsideDelimiterPair(segment, separator)
        );
        let preservedSplit = '';
        const wholeLineLeftEvidence: string[] = [];
        for (const separator of separators) {
            if (separator.x0 > 2 &&
                separator.x1 < segment.canvas.width - 3) {
                const [left, right] = await Promise.all([
                    __ocrRecognizeStructuredRange(
                        engine, segment, 0, separator.x0 - 1, silent, false
                    ),
                    __ocrRecognizeStructuredRange(
                        engine,
                        segment,
                        separator.x1 + 1,
                        segment.canvas.width - 1,
                        silent,
                        false
                    )
                ]);
                const normalizedRight = normalizeOcrOperationSide(right);
                if (canComposeOcrOperationSeparator(left, normalizedRight)) {
                    return left + ' \\mid ' + normalizedRight;
                }
                const hasCompleteHighConfidenceLeft =
                    separator.source === 'vector' &&
                    separator.confidence === 'high' &&
                    Boolean(left.trim()) &&
                    canComposeOcrOperationSeparator(left, '+0');
                if (hasCompleteHighConfidenceLeft &&
                    !wholeLineLeftEvidence.includes(left)) {
                    wholeLineLeftEvidence.push(left);
                }
                // A separately drawn, straight and hookless vector stroke is
                // primary handwriting evidence. Never feed it back into a
                // whole-line OCR pass where it can become the digit 1. Even
                // when the tiny side crop loses its operator, preserve the
                // marker and let the review report an honest unknown result.
                if (hasCompleteHighConfidenceLeft &&
                    /^(?:[+\-:/]|\\(?:cdot|div|times)\b)/.test(normalizedRight.trim()) &&
                    !preservedSplit) {
                    preservedSplit = left + ' \\mid ' + normalizedRight;
                }
            }
        }
        // A later candidate can be the real operation bar even when an
        // earlier digit stem already produced a merely preservable split.
        // Only use the geometric fallback after every candidate had a chance
        // to produce a semantically complete operation.
        const wholeLine = await __ocrRecognizeCalculationCrop(
            engine,
            segment.canvas,
            silent
        );
        for (const leftEvidence of wholeLineLeftEvidence) {
            const recovered = recoverOcrOperationSeparatorFromWholeLine(
                wholeLine,
                leftEvidence
            );
            if (recovered) return recovered;
        }
        if (preservedSplit) return preservedSplit;
        const structuralLine = await __ocrRecognizeStructuralLine(
            engine,
            segment,
            silent
        );
        if (structuralLine) return structuralLine;
        const plusMinusRepair = insertPlusMinusIntoIndexedRootSolution(wholeLine);
        if (!plusMinusRepair || !segment.plusMinusHints?.length) return wholeLine;
        for (const hint of segment.plusMinusHints.slice(0, 3)) {
            const [left, right] = await Promise.all([
                __ocrRecognizeStructuredRange(
                    engine, segment, 0, hint.x0 - 1, silent, false
                ),
                __ocrRecognizeStructuredRange(
                    engine,
                    segment,
                    hint.x1 + 1,
                    segment.canvas.width - 1,
                    silent,
                    false
                )
            ]);
            if (canRestoreOcrPlusMinusFromSplit(left, right)) return plusMinusRepair;
        }
        return wholeLine;
    }

    async function __ocrRecognizeSingleCrop(
        engine: any,
        crop: HTMLCanvasElement,
        silent = false
    ): Promise<string> {
        const ink = __ocrInkBBoxQuick(crop);
        const preferDigits = __ocrShouldPreferDigits(ink, crop);
        const modelName = String(engine.model || '');
        const isTrocr = modelName.toLowerCase().indexOf('trocr') !== -1;

        let inputCanvas = crop, raw = '';
        if (preferDigits) {
            try { inputCanvas = __ocrPreprocessDigitCanvas(crop, { dilate: 0 }); } catch (_) { inputCanvas = crop; }
            try { inputCanvas = __ocrNormalizeSize(inputCanvas); } catch (_) { }
            const opts: Record<string, any> = { max_new_tokens: 16, do_sample: false, temperature: 0 };
            if (silent) opts.__silent = true;
            raw = await engine.recognize(inputCanvas, opts);
        } else {
            raw = await __ocrVotingRecognize(engine, crop, silent);
        }

        if (preferDigits) {
            const rawTrim = String(raw || '').trim();
            const looksMathy = rawTrim.indexOf('\\') !== -1 ||
                rawTrim.indexOf('{') !== -1 ||
                rawTrim.indexOf('}') !== -1 ||
                rawTrim.indexOf('^') !== -1 ||
                rawTrim.indexOf('_') !== -1 ||
                rawTrim.indexOf('sqrt') !== -1 ||
                rawTrim.indexOf('frac') !== -1;
            if (looksMathy || __ocrMathLooksIncomplete(rawTrim)) {
                let retryCanvas = crop;
                try { retryCanvas = __ocrPreprocessCanvas(crop); } catch (_) { retryCanvas = crop; }
                try { retryCanvas = __ocrNormalizeSize(retryCanvas); } catch (_) { }
                const opts: Record<string, any> = { max_new_tokens: 128, do_sample: false, temperature: 0 };
                if (silent) opts.__silent = true;
                raw = await engine.recognize(retryCanvas, opts);
            }
        }

        // The voting path already returns cleaned output; other paths still need it.
        let latex = isTrocr
            ? __ocrTidyMathText(raw)
            : (preferDigits ? __ocrUnwrapRoman(__ocrCleanLatex(raw)) : raw);
        latex = __ocrNormalizeTimesVsX(latex);

        const tryDigitSalvage = preferDigits || __ocrIsShortPlainToken(latex);
        if (tryDigitSalvage) {
            const candidate = __ocrDigitCandidateFrom(latex);
            if (candidate) {
                latex = candidate;
            } else {
                const fixed = __ocrFixDigitsIfPossible(latex);
                if (fixed) latex = fixed;
            }
            if (!__ocrIsAllDigits(latex)) {
                const voted = await __ocrDigitGuard(engine, crop);
                if (voted) latex = voted;
            }
        }
        return String(latex || '').trim();
    }

    // Rect progress
    let __rectProgRAF = 0;
    let __rectProgStart = 0;
    let __rectProgHideTimer = 0;
    const RECT_PROGRESS_ANIMATION_MAX_MS = 8000;

    function __rectProgSet01(v: number): void {
        if (!rectProg || !rectProgFill || !rectProgTxt) return;
        const p = Math.max(0, Math.min(1, Number(v)));
        rectProgFill.style.width = Math.round(p * 100) + '%';
        rectProgTxt.textContent = Math.round(p * 100) + '%';
    }
    function __rectProgShow(): void { if (!rectProg) return; rectProg.dataset.on = '1'; __rectProgSet01(0); scheduleRectActionUpdate(); }
    function __rectProgHide(): void { if (!rectProg) return; rectProg.dataset.on = '0'; __rectProgSet01(0); }
    function __rectProgStartPseudo(): void {
        if (__rectProgRAF) cancelAnimationFrame(__rectProgRAF);
        if (__rectProgHideTimer) clearTimeout(__rectProgHideTimer);
        __rectProgRAF = 0;
        __rectProgHideTimer = 0;
        __rectProgShow(); __rectProgStart = performance.now();
        const tick = () => {
            const t = performance.now() - __rectProgStart; let v = 0;
            if (t < 900) v = (t / 900) * 0.70;
            else if (t < 2200) v = 0.70 + ((t - 900) / 1300) * 0.20;
            else v = 0.90 + Math.min(0.08, ((t - 2200) / 5000) * 0.08);
            __rectProgSet01(v);
            if (!__ocrBusy || !wrap!.isConnected || t >= RECT_PROGRESS_ANIMATION_MAX_MS) {
                __rectProgRAF = 0;
                return;
            }
            __rectProgRAF = requestAnimationFrame(tick);
        };
        __rectProgRAF = requestAnimationFrame(tick);
    }
    function __rectProgStop(final01: number): void {
        if (__rectProgRAF) { cancelAnimationFrame(__rectProgRAF); __rectProgRAF = 0; }
        if (__rectProgHideTimer) clearTimeout(__rectProgHideTimer);
        __rectProgSet01(final01);
        __rectProgHideTimer = setTimeout(() => {
            __rectProgHideTimer = 0;
            __rectProgHide();
        }, 250) as unknown as number;
    }

    async function __ocrFromMarkedRect({ auto = false } = {}): Promise<void> {
        if (isCanvasPlus) {
            await __plusRenderWholeBlock();
            return;
        }
        const rectItem = getRectItem();
        if (!rectItem) { __ocrLog('No marker-rectangle found.'); return; }
        const engine = LIA.ocr;
        if (!engine || !engine.recognize) { __ocrLog('OCR engine not available (LIA.ocr).'); return; }
        const oldText = rectActionBtn.textContent || '';
        __ocrBusy = true;
        rectActionBtn.disabled = true;
        rectActionBtn.textContent = trOcr('runningOcr', 'Running OCR...');
        __rectProgStartPseudo();
        try {
            const crop = __ocrCropFromRect(rectItem);
            if (!crop) { __ocrLog('Crop failed (rect too small or out of bounds).'); return; }
            // Keep classic @canvas independent from experimental background
            // work. This is intentionally the direct path it used before
            // Multi-line calculation OCR introduced its private scheduling queue.
            if (engine.ensureLoaded) await engine.ensureLoaded(false);
            const latex = await __ocrRecognizeSingleCrop(engine, crop, false);

            __ocrLog('OCR result: ' + latex);
            if (!wrap!.isConnected) return;
            const ok = __liaFindAndSetInputBeforeNode((canvasPair || wrap!) as Element, latex);
            if (!ok) { __ocrLog('Could not find an input field before this @canvas.'); }
            else { rectActionBtn.textContent = trOcr('submitted', '✅ submitted'); setTimeout(() => { rectActionBtn.textContent = oldText; }, 900); }
        } catch (err) {
            __ocrLog('OCR error: ' + (err && (err as any).message ? (err as any).message : String(err)));
            rectActionBtn.textContent = trOcr('ocrError', '⚠ Error');
            setTimeout(() => { rectActionBtn.textContent = oldText; }, 900);
        } finally {
            __rectProgStop(1);
            rectActionBtn.disabled = false;
            __ocrBusy = false;
            __liaRefreshOcrTexts();
        }
    }

    rectActionBtn.addEventListener('click', async (e) => {
        e.preventDefault(); e.stopPropagation();
        await __ocrFromMarkedRect({ auto: false });
    });

    // ---- State ----
    let ITEMS: any[] = [];
    let REDO: any[] = [];
    if (saved) {
        if (Array.isArray(saved.ITEMS)) { ITEMS = saved.ITEMS; REDO = Array.isArray(saved.REDO) ? saved.REDO : []; }
        else if (Array.isArray(saved.STROKES)) { ITEMS = saved.STROKES.map((st: any) => ({ kind: 'path', ...st })); REDO = Array.isArray(saved.REDO) ? saved.REDO.map((st: any) => ({ kind: 'path', ...st })) : []; }
    }

    let tool = 'pen', menuMode = 'pen';
    let colorIndex = 0, penWidth = 3, penAlpha = 1.0, eraserWidth = 12;
    let bgMode = (saved && saved.bgMode) ? saved.bgMode : 'none';
    let bgStep = (saved && saved.bgStep) ? saved.bgStep : 24;
    const RECT_ALPHA = 0.28;
    let currentPath: any = null, currentRect: any = null;
    let currentStrokeRenderedPointCount = 0;
    let __strokePresentRAF = 0;

    // ---- Multi-line calculation background recognition ----
    const PLUS_BACKGROUND_IDLE_MS = 1400;
    const PLUS_LINE_CACHE_LIMIT = 128;
    const __plusLineCache = new Map<string, string>();
    const __plusLineInflight = new Map<string, CanvasPlusInflightLine>();
    let __plusInkRevision = 0;
    let __plusGeneration = 0;
    let __plusBackgroundTimer = 0;
    let __plusDraft: CanvasPlusDocumentRecognition | null = null;
    let __plusRenderedRevision = -1;
    let __plusRenderedModelKey = '';
    let __plusCorrection: CanvasPlusCorrection | null = null;
    let __plusRasterInkState: 'unknown' | 'present' | 'empty' = 'unknown';
    let __plusFreezeReview: CalculationReviewFreezeState | null =
        lineFeedbackEnabled
            ? sanitizeCalculationReviewFreezeState(saved?.calculationReviewFreeze)
            : null;

    function __plusStoreFreezeReview(
        value: unknown,
        reason: string
    ): void {
        if (!lineFeedbackEnabled) return;
        __plusFreezeReview = sanitizeCalculationReviewFreezeState(value);
        persist(reason);
    }

    function __plusRecordFreezeAnalysis(
        analysis: CalculationReviewAnalysis
    ): void {
        if (!lineFeedbackEnabled) return;
        const snapshot = plusReview?.getSnapshot();
        if (!snapshot || snapshot.revision !== analysis.revision) return;
        __plusStoreFreezeReview({
            v: 'cr1',
            lines: snapshot.lines.slice(),
            state: analysis.state,
            checks: analysis.state === 'ready'
                ? analysis.checks.map(check => ({
                    status: check.status,
                    reason: check.reason,
                    ...(check.side ? { side: check.side } : {})
                }))
                : []
        }, 'calculation-analysis');
    }

    if (isCanvasPlus && canvasPair) {
        canvasPair.dataset.ocrBackground = 'idle';
        canvasPair.dataset.ocrRevision = '0';
        canvasPair.dataset.ocrLineCount = '0';
    }

    function __plusGetOcrEngine(): any {
        if (!isCanvasPlus) return LIA.ocr;
        return LIA.canvasPlusOcr || ensureCanvasPlusFormulaOcrEngine();
    }

    function __plusModelKey(engine: any): string {
        if (engine && engine.cacheKey) {
            return String(engine.cacheKey) + '|' + OCR_LAYOUT_ALGORITHM_VERSION;
        }
        return String(engine && engine.model || '') + '|' +
            String(engine && engine.precision || '') + '|' +
            String(engine && engine.task || '') + '|' +
            OCR_LAYOUT_ALGORITHM_VERSION;
    }

    function __plusLineKey(engine: any, segment: OcrLineSegment): string {
        const separators = getOcrOperationSeparators(segment);
        const separatorKey = separators.length
            ? 'operations:' + separators.map(separator =>
                String(separator.source || 'unknown') + ':' +
                String(separator.confidence || 'normal') + ':' +
                Math.round(separator.x0) + '-' + Math.round(separator.x1)
            ).join(',')
            : 'operations:none';
        const structuralBars = getOcrStructuralBars(segment);
        const structuralBarKey = structuralBars.length
            ? 'bars:' + structuralBars.map(bar =>
                Math.round(bar.x0) + '-' + Math.round(bar.x1)
            ).join(',')
            : 'bars:none';
        const structuralDelimiters = getOcrStructuralDelimiters(segment);
        const structuralDelimiterKey = structuralDelimiters.length
            ? 'delimiters:' + structuralDelimiters.map(delimiter =>
                delimiter.kind + ':' +
                Math.round(delimiter.x0) + '-' + Math.round(delimiter.x1)
            ).join(',')
            : 'delimiters:none';
        const plusMinusKey = segment.plusMinusHints?.length
            ? 'plusminus:' + segment.plusMinusHints.map(box =>
                Math.round(box.x0) + '-' + Math.round(box.y0) + '-' +
                Math.round(box.x1) + '-' + Math.round(box.y1)
            ).join(',')
            : 'plusminus:none';
        return __plusModelKey(engine) + '|' + segment.fingerprint + '|' +
            separatorKey + '|' + structuralBarKey + '|' +
            structuralDelimiterKey + '|' + plusMinusKey;
    }

    function __plusRememberLine(key: string, latex: string): void {
        if (!latex) return;
        if (__plusLineCache.has(key)) __plusLineCache.delete(key);
        __plusLineCache.set(key, latex);
        while (__plusLineCache.size > PLUS_LINE_CACHE_LIMIT) {
            const oldest = __plusLineCache.keys().next();
            if (oldest.done) break;
            __plusLineCache.delete(oldest.value);
        }
    }

    function __plusCancelledError(): Error {
        const error = new Error('Calculation OCR request is stale.');
        (error as any).__liaCanvasPlusCancelled = true;
        return error;
    }

    function __plusIsCancelledError(error: unknown): boolean {
        return Boolean(error && (error as any).__liaCanvasPlusCancelled);
    }

    function __plusAssertRecognitionCurrent(
        engine: any,
        modelKey: string,
        isCurrent: () => boolean
    ): void {
        if (!isCurrent() || __plusModelKey(engine) !== modelKey) {
            throw __plusCancelledError();
        }
    }

    async function __plusRecognizeDocument(
        engine: any,
        crop: HTMLCanvasElement,
        priority: OcrJobPriority,
        silent: boolean,
        isCurrent: () => boolean
    ): Promise<CanvasPlusDocumentRecognition> {
        const modelKey = __plusModelKey(engine);
        const requestGeneration = __plusGeneration;
        const pixelScale = Number((crop as any).__liaOcrPixelScale) ||
            (window.devicePixelRatio || 1) * VIEW.scale;
        __plusAssertRecognitionCurrent(engine, modelKey, isCurrent);
        const allSegments = segmentOcrCanvas(crop, pixelScale, {
            maskCalculationRules: usesFinalCalculationRule,
            maskCarryOnes: usesCarryOrBorrowOnes,
            maskDivisionRules: isColumnDivision
        });
        const columnRules: OcrCalculationRuleHint[] = usesFinalCalculationRule &&
            Array.isArray((crop as any).__liaOcrCalculationRules)
            ? (crop as any).__liaOcrCalculationRules
            : [];
        const columnCarries: OcrCarryOneHint[] = usesCarryOrBorrowOnes &&
            Array.isArray((crop as any).__liaOcrCarryOneHints)
            ? (crop as any).__liaOcrCarryOneHints
            : [];
        const divisionRules: OcrDivisionRuleHint[] = isColumnDivision &&
            Array.isArray((crop as any).__liaOcrDivisionRules)
            ? (crop as any).__liaOcrDivisionRules
            : [];
        const twoOperandSelection = (isColumnAddition || isColumnSubtraction)
            ? selectOcrColumnAdditionSegments(allSegments, columnRules)
            : null;
        const expectedMultiplication = isColumnMultiplication && writtenArithmeticPrompt
            ? createExpectedWrittenArithmeticSubmission(writtenArithmeticPrompt)
            : null;
        const multiplicationRowCount = expectedMultiplication?.kind === 'column-multiplication'
            ? expectedMultiplication.partialProducts.length + 1
            : 0;
        const multiplicationSelection = isColumnMultiplication
            ? selectOcrColumnStackSegments(
                allSegments,
                columnRules,
                Math.max(2, multiplicationRowCount)
            )
            : null;
        if ((isColumnAddition || isColumnSubtraction) && !twoOperandSelection) {
            throw new Error(
                'Written arithmetic needs two operand rows, a calculation rule, and one result row.'
            );
        }
        if (isColumnMultiplication && !multiplicationSelection) {
            throw new Error(
                'Written multiplication needs its expression, every place-value row, a rule, and a result.'
            );
        }
        if (isColumnDivision && !divisionRules.length) {
            throw new Error('Written division needs at least one confirmed subtraction underline.');
        }
        const multiplicationRows = multiplicationSelection
            ? multiplicationSelection.rowsAbove.slice(-multiplicationRowCount)
            : [];
        const segments = twoOperandSelection
            ? [
                twoOperandSelection.operands[0],
                twoOperandSelection.operands[1],
                twoOperandSelection.result
            ]
            : multiplicationSelection
                ? [...multiplicationRows, multiplicationSelection.result]
            : allSegments;
        if (segments.length > PLUS_OCR_MAX_LINES) {
            throw new Error(
                'Calculation OCR detected ' + segments.length +
                ' lines; the safety limit is ' + PLUS_OCR_MAX_LINES + '.'
            );
        }
        const descriptors = segments.map(segment => {
            const key = __plusLineKey(engine, segment);
            if (__plusLineCache.has(key)) {
                return {
                    segment,
                    key,
                    source: 'cache' as const,
                    promise: Promise.resolve(__plusLineCache.get(key) || '')
                };
            }
            const running = __plusLineInflight.get(key);
            if (running && running.generation === requestGeneration) {
                if (priority === 'foreground') promoteOcrJob(running.promise);
                return {
                    segment,
                    key,
                    source: 'inflight' as const,
                    promise: running.promise
                };
            }
            return {
                segment,
                key,
                source: 'recognition' as const,
                promise: null as Promise<string> | null
            };
        });

        const missing = new Map<string, OcrLineSegment>();
        for (const descriptor of descriptors) {
            if (descriptor.source === 'recognition') missing.set(descriptor.key, descriptor.segment);
        }

        for (const [key, segment] of missing) {
            const linePromise = enqueueOcrJob(priority, async () => {
                __plusAssertRecognitionCurrent(engine, modelKey, isCurrent);
                if (engine.ensureLoaded) {
                    try {
                        await engine.ensureLoaded(false);
                    } catch (error) {
                        __plusAssertRecognitionCurrent(engine, modelKey, isCurrent);
                        throw error;
                    }
                }
                __plusAssertRecognitionCurrent(engine, modelKey, isCurrent);
                if (__plusLineCache.has(key)) return __plusLineCache.get(key) || '';
                const latex = await __ocrRecognizeCalculationLine(engine, segment, silent);
                __plusAssertRecognitionCurrent(engine, modelKey, isCurrent);
                if (latex) __plusRememberLine(key, latex);
                return latex;
            });
            const entry: CanvasPlusInflightLine = {
                promise: linePromise,
                generation: requestGeneration
            };
            __plusLineInflight.set(key, entry);
            const clearInflight = (): void => {
                if (__plusLineInflight.get(key) === entry) __plusLineInflight.delete(key);
            };
            linePromise.then(clearInflight, clearInflight);
        }
        for (const descriptor of descriptors) {
            if (descriptor.source === 'recognition') {
                descriptor.promise = __plusLineInflight.get(descriptor.key)?.promise || Promise.resolve('');
            }
        }

        const recognized = await Promise.all(descriptors.map(async descriptor => ({
            bbox: descriptor.segment.bbox,
            fingerprint: descriptor.segment.fingerprint,
            latex: await (descriptor.promise || Promise.resolve('')),
            source: descriptor.source
        })));
        __plusAssertRecognitionCurrent(engine, modelKey, isCurrent);
        if (twoOperandSelection) {
            const first = normalizeOcrColumnDigits(recognized[0]?.latex);
            const second = normalizeOcrColumnDigitsExact(
                recognized[1]?.latex,
                isColumnSubtraction ? '-' : '+'
            );
            const result = normalizeOcrColumnDigits(recognized[2]?.latex);
            if (!first || !second || !result) {
                throw new Error('Written arithmetic OCR did not return three plain integer rows.');
            }
            const columns = Math.max(first.length, second.length, result.length);
            const selectedRulePaths = new Set(twoOperandSelection.rule.pathIndexes);
            const matchingCarries = columnCarries.filter(hint =>
                hint.rulePathIndexes.some(pathIndex => selectedRulePaths.has(pathIndex))
            );
            const carries = mapOcrCarryOnesToColumns(
                matchingCarries,
                [
                    { segment: twoOperandSelection.operands[0], digitCount: first.length },
                    { segment: twoOperandSelection.result, digitCount: result.length }
                ],
                columns
            );
            const writtenSubmission = carries
                ? isColumnSubtraction
                    ? createColumnSubtractionSubmission({
                        operands: [first, second],
                        result,
                        borrows: carries
                    })
                    : createColumnAdditionSubmission({
                    operands: [first, second],
                    result,
                    carries
                })
                : null;
            if (!writtenSubmission) {
                throw new Error(
                    'Written carry or borrow marks could not be assigned to digit columns.'
                );
            }
            const lineLatex = [
                first,
                (isColumnSubtraction ? '-' : '+') + second,
                result
            ];
            const normalizedLines = recognized.map((line, index) => ({
                ...line,
                latex: lineLatex[index] || ''
            }));
            return {
                kind: writtenSubmission.kind,
                lines: normalizedLines,
                editableText: lineLatex.join('\n'),
                latex: composeWrittenArithmeticLatex(writtenSubmission),
                lineCount: writtenArithmeticLayoutRowCount(writtenSubmission),
                modelKey,
                cacheHits: descriptors.filter(item => item.source === 'cache').length,
                awaitedCount: descriptors.filter(item => item.source === 'inflight').length,
                recognizedCount: missing.size,
                writtenSubmission
            };
        }

        if (multiplicationSelection) {
            const expression = parseColumnMultiplicationPrompt(recognized[0]?.latex);
            const partialRows = recognized.slice(1, -1).map(line =>
                normalizeOcrColumnDigitsExact(line.latex, '+')
            );
            const result = normalizeOcrColumnDigits(recognized[recognized.length - 1]?.latex);
            if (!expression || !result || partialRows.some(row => row === null) ||
                partialRows.length !== expression.operands[0].length) {
                throw new Error(
                    'Written multiplication OCR did not return the expression, every place-value row, and result.'
                );
            }
            const partialProducts = partialRows.map((value, index) => {
                const multiplicandColumn = expression.operands[0].length - index - 1;
                return {
                    multiplicandColumn,
                    shift: multiplicandColumn,
                    value: value || ''
                };
            });
            const writtenSubmission = createColumnMultiplicationSubmission({
                operands: expression.operands,
                partialProducts,
                result
            });
            if (!writtenSubmission) {
                throw new Error('Written multiplication rows are structurally invalid.');
            }
            const lineLatex = [
                expression.operands[0] + ' \\cdot ' + expression.operands[1],
                ...partialRows.map(value => '+' + value),
                result
            ];
            const normalizedLines = recognized.map((line, index) => ({
                ...line,
                latex: lineLatex[index] || ''
            }));
            return {
                kind: 'column-multiplication',
                lines: normalizedLines,
                editableText: lineLatex.join('\n'),
                latex: composeWrittenArithmeticLatex(writtenSubmission),
                lineCount: writtenArithmeticLayoutRowCount(writtenSubmission),
                modelKey,
                cacheHits: descriptors.filter(item => item.source === 'cache').length,
                awaitedCount: descriptors.filter(item => item.source === 'inflight').length,
                recognizedCount: missing.size,
                writtenSubmission
            };
        }

        if (isColumnDivision) {
            const expression = parseColumnDivisionPrompt(recognized[0]?.latex);
            if (!expression?.authoredQuotient) {
                throw new Error('Written division OCR did not return a quotient in its first row.');
            }
            const quotient = expression.authoredQuotient;
            const stepCount = Math.floor((recognized.length - 1) / 2);
            if (recognized.length !== stepCount * 2 + 1 ||
                quotient.length !== stepCount ||
                divisionRules.length !== stepCount) {
                throw new Error(
                    'Written division needs one product and one bring-down row per quotient digit.' +
                    ' [rows=' + recognized.length +
                    ', rules=' + divisionRules.length +
                    ', quotientDigits=' + quotient.length + ']'
                );
            }
            for (let index = 0; index < stepCount; index++) {
                const productBox = segments[1 + index * 2]?.bbox;
                const nextBox = segments[2 + index * 2]?.bbox;
                const rule = divisionRules[index];
                const productCenter = productBox
                    ? productBox.y + productBox.height / 2
                    : Number.NaN;
                const nextCenter = nextBox
                    ? nextBox.y + nextBox.height / 2
                    : Number.NaN;
                const ruleCenter = (rule.y0 + rule.y1) / 2;
                if (!Number.isFinite(productCenter) || !Number.isFinite(nextCenter) ||
                    !(productCenter < ruleCenter && ruleCenter < nextCenter)) {
                    throw new Error(
                        'Each written division product must be underlined before the next partial dividend.'
                    );
                }
            }
            const initialEnd = expression.dividend.length - quotient.length;
            if (initialEnd < 0) {
                throw new Error('Written division quotient is wider than its dividend.');
            }
            const steps: ColumnDivisionStep[] = [];
            const lineLatex = [
                expression.dividend + ':' + expression.divisor + '=' + quotient
            ];
            let previousNext = '';
            for (let index = 0; index < stepCount; index++) {
                const product = normalizeOcrColumnDigitsExact(
                    recognized[1 + index * 2]?.latex,
                    '-'
                );
                const nextValue = normalizeOcrColumnDigitsExact(
                    recognized[2 + index * 2]?.latex
                );
                if (product === null || nextValue === null) {
                    throw new Error('Written division contains a non-integer step row.');
                }
                const partialDividendEnd = initialEnd + index;
                const partialDividend = index === 0
                    ? expression.dividend.slice(0, partialDividendEnd + 1)
                    : previousNext;
                const hasNextDigit = index + 1 < stepCount;
                const broughtDownDigit = hasNextDigit
                    ? nextValue.slice(-1)
                    : null;
                const remainderDisplay = hasNextDigit
                    ? nextValue.slice(0, -1) || '0'
                    : nextValue;
                const remainder = remainderDisplay.replace(/^0+(?=\d)/u, '');
                const nextEnd = partialDividendEnd + (hasNextDigit ? 1 : 0);
                steps.push({
                    partialDividend,
                    partialDividendStart: Math.max(
                        0,
                        partialDividendEnd - partialDividend.length + 1
                    ),
                    partialDividendEnd,
                    quotientDigit: quotient[index],
                    subtractedProduct: product.replace(/^0+(?=\d)/u, ''),
                    subtractedProductStart: Math.max(
                        0,
                        partialDividendEnd - product.length + 1
                    ),
                    remainder,
                    remainderPosition: Math.max(
                        0,
                        nextEnd - nextValue.length + 1
                    ),
                    broughtDownDigit,
                    broughtDownPosition: hasNextDigit
                        ? partialDividendEnd + 1
                        : null
                });
                lineLatex.push('-' + product, nextValue);
                previousNext = nextValue;
            }
            const writtenSubmission = createColumnDivisionSubmission({
                dividend: expression.dividend,
                divisor: expression.divisor,
                quotient,
                remainder: expression.authoredRemainder,
                steps
            });
            if (!writtenSubmission) {
                throw new Error('Written division steps are structurally invalid.');
            }
            const normalizedLines = recognized.map((line, index) => ({
                ...line,
                latex: lineLatex[index] || ''
            }));
            return {
                kind: 'column-division',
                lines: normalizedLines,
                editableText: lineLatex.join('\n'),
                latex: composeWrittenArithmeticLatex(writtenSubmission),
                lineCount: writtenArithmeticLayoutRowCount(writtenSubmission),
                modelKey,
                cacheHits: descriptors.filter(item => item.source === 'cache').length,
                awaitedCount: descriptors.filter(item => item.source === 'inflight').length,
                recognizedCount: missing.size,
                writtenSubmission
            };
        }

        const lineLatex = normalizeCalculationLineSequence(recognized.map(line => line.latex));
        const normalizedLines = recognized.map((line, index) => ({
            ...line,
            latex: lineLatex[index] || ''
        }));
        return {
            kind: 'equation',
            lines: normalizedLines,
            editableText: lineLatex.join('\n'),
            latex: composeMultilineLatex(lineLatex),
            lineCount: recognized.length,
            modelKey,
            cacheHits: descriptors.filter(item => item.source === 'cache').length,
            awaitedCount: descriptors.filter(item => item.source === 'inflight').length,
            recognizedCount: missing.size
        };
    }

    function __plusIsFrozenView(): boolean {
        const body = document.body;
        return Boolean(body && (
            body.classList.contains('lia-course-frozen') ||
            body.classList.contains('lia-snapshot-mode')
        ));
    }

    function __plusDispatch(
        phase: string,
        reason: string,
        lineCount: number,
        updateDataset = true,
        eventRevision = __plusInkRevision
    ): void {
        if (!isCanvasPlus || !canvasPair) return;
        if (updateDataset) {
            canvasPair.dataset.ocrBackground = phase;
            canvasPair.dataset.ocrRevision = String(__plusInkRevision);
            canvasPair.dataset.ocrLineCount = String(Math.max(0, lineCount | 0));

            // Background work reports quietly in the inline status. A running
            // foreground submit remains authoritative until it settles.
            if (!__ocrBusy && plusStatus) {
                if (phase === 'scheduled' || phase === 'running') {
                    if (__plusRenderedRevision < 0) __plusSetStandaloneState('preparing');
                } else if (phase === 'manual') {
                    if (__plusRenderedRevision === __plusInkRevision &&
                        __plusRenderedModelKey !== '') {
                        __plusSetStandaloneState('rendered');
                    } else if (__plusRenderedRevision >= 0) {
                        __plusSetStandaloneState('stale');
                    } else {
                        __plusSetStandaloneState('ready');
                    }
                } else if (phase === 'ready') {
                    plusStatus.dataset.lineCount = String(Math.max(0, lineCount | 0));
                    if (__plusRenderedRevision === __plusInkRevision &&
                        __plusRenderedModelKey !== '' &&
                        __plusRenderedModelKey === __plusDraft?.modelKey) {
                        __plusSetStandaloneState('rendered');
                    } else if (__plusRenderedRevision >= 0) {
                        __plusSetStandaloneState('prepared-stale');
                    } else {
                        __plusSetStandaloneState('prepared');
                    }
                } else if (phase === 'error') {
                    __plusSetStandaloneState(
                        __plusRenderedRevision >= 0 ? 'error-stale' : 'error'
                    );
                } else if (phase === 'idle' && __plusRasterInkState === 'empty') {
                    __plusSetStandaloneState('empty');
                }
            }
        }
        canvasPair.dispatchEvent(new CustomEvent('lia:canvasplus-ocr', {
            bubbles: true,
            detail: {
                uid: uid || '',
                phase,
                reason,
                revision: eventRevision,
                lineCount: Math.max(0, lineCount | 0),
                source: plusBackgroundRecognitionEnabled ? 'background' : 'submit'
            }
        }));
    }

    function __plusHasVisibleInkItems(): boolean {
        return ITEMS.some(item =>
            item &&
            item.kind === 'path' &&
            item.tool !== 'eraser' &&
            Array.isArray(item.points) &&
            item.points.length > 1
        );
    }

    function __plusSelectionBounds(): {
        x0: number;
        y0: number;
        x1: number;
        y1: number;
    } | null {
        const rect = getRectItem();
        if (!rect) return null;
        const x0 = Math.min(Number(rect.x0), Number(rect.x1));
        const y0 = Math.min(Number(rect.y0), Number(rect.y1));
        const x1 = Math.max(Number(rect.x0), Number(rect.x1));
        const y1 = Math.max(Number(rect.y0), Number(rect.y1));
        const minSelectionWorld = 6 / Math.max(0.001, VIEW.scale);
        if (![x0, y0, x1, y1].every(isFinite) ||
            x1 - x0 < minSelectionWorld || y1 - y0 < minSelectionWorld) return null;
        return { x0, y0, x1, y1 };
    }

    function __plusBoundsIntersect(
        a: { x0: number; y0: number; x1: number; y1: number },
        b: { x0: number; y0: number; x1: number; y1: number }
    ): boolean {
        return a.x1 >= b.x0 && a.x0 <= b.x1 &&
            a.y1 >= b.y0 && a.y0 <= b.y1;
    }

    function __plusPathBounds(item: any): {
        x0: number;
        y0: number;
        x1: number;
        y1: number;
    } | null {
        if (!item || item.kind !== 'path' ||
            !Array.isArray(item.points) || item.points.length < 2) return null;
        let x0 = Number.POSITIVE_INFINITY;
        let y0 = Number.POSITIVE_INFINITY;
        let x1 = Number.NEGATIVE_INFINITY;
        let y1 = Number.NEGATIVE_INFINITY;
        for (const point of item.points) {
            if (!point || !isFinite(point.x) || !isFinite(point.y)) continue;
            x0 = Math.min(x0, Number(point.x));
            y0 = Math.min(y0, Number(point.y));
            x1 = Math.max(x1, Number(point.x));
            y1 = Math.max(y1, Number(point.y));
        }
        if (![x0, y0, x1, y1].every(isFinite)) return null;
        const padding = Math.max(0.5, Number(item.width) || 1) * 0.5 + 1;
        return {
            x0: x0 - padding,
            y0: y0 - padding,
            x1: x1 + padding,
            y1: y1 + padding
        };
    }

    function __plusRasterIsEmpty(): boolean {
        return __plusRasterInkState === 'empty';
    }

    function __plusSetStandaloneState(state: string): void {
        if (plusStatus) {
            plusStatus.dataset.state = state;
            plusStatus.setAttribute('role', state.startsWith('error') ? 'alert' : 'status');
        }
        if (plusResult) {
            if (state === 'rendered') {
                plusResult.dataset.state = 'ready';
                plusResult.dataset.stale = '0';
            }
            else if (state === 'empty') plusResult.dataset.state = 'idle';
            else if (state === 'stale' || state === 'error') plusResult.dataset.state = state;
            else if (state === 'prepared-stale' || state === 'error-stale') {
                plusResult.dataset.state = 'stale';
                plusResult.dataset.stale = '1';
            }
        }
        __liaRefreshOcrTexts();
    }

    function __plusEditorLines(): string[] {
        return String(plusEditTextarea?.value || '')
            .replace(/\r/g, '')
            .split('\n')
            .map(line => line.trim())
            .filter(Boolean);
    }

    function __plusValidateEditor(): boolean {
        const lines = __plusEditorLines();
        const valid = lines.length > 0 && lines.length <= PLUS_OCR_MAX_LINES;
        const missingPlusMinusLine = valid
            ? findMissingPlusMinusRootLine(lines)
            : -1;
        if (plusEditApplyBtn) plusEditApplyBtn.disabled = !valid;
        if (plusEditInsertPmBtn) plusEditInsertPmBtn.hidden = missingPlusMinusLine < 0;
        if (plusEditTextarea) {
            plusEditTextarea.setAttribute('aria-invalid', valid ? 'false' : 'true');
        }
        if (plusEditValidation) {
            if (!lines.length) {
                plusEditValidation.textContent = trOcr(
                    'plus.editEmpty',
                    'Enter at least one equation.'
                );
                plusEditValidation.dataset.state = 'error';
            } else if (lines.length > PLUS_OCR_MAX_LINES) {
                plusEditValidation.textContent = trOcr(
                    'plus.editTooManyLines',
                    'Use at most {count} equations.'
                ).replace('{count}', String(PLUS_OCR_MAX_LINES));
                plusEditValidation.dataset.state = 'error';
            } else if (missingPlusMinusLine >= 0) {
                plusEditValidation.textContent = trOcr(
                    'plus.missingPlusMinus',
                    'Line {line}: no ± was recognized before the square root. Check the handwriting or insert it.'
                ).replace('{line}', String(missingPlusMinusLine + 1));
                plusEditValidation.dataset.state = 'warning';
            } else {
                plusEditValidation.textContent = trOcr(
                    'plus.editLineCount',
                    '{count} equations ready.'
                ).replace('{count}', String(lines.length));
                plusEditValidation.dataset.state = 'ready';
            }
        }
        return valid;
    }

    function __plusInsertMissingPlusMinus(): void {
        if (!plusEditTextarea) return;
        const rawLines = String(plusEditTextarea.value || '')
            .replace(/\r/g, '')
            .split('\n');
        const logicalLines = rawLines.map(line => line.trim()).filter(Boolean);
        const targetLogicalIndex = findMissingPlusMinusRootLine(logicalLines);
        if (targetLogicalIndex < 0) return;
        let offset = 0;
        let logicalIndex = -1;
        for (let index = 0; index < rawLines.length; index++) {
            const trimmed = rawLines[index].trim();
            if (trimmed) logicalIndex++;
            const replacement = logicalIndex === targetLogicalIndex
                ? insertPlusMinusIntoIndexedRootSolution(rawLines[index])
                : null;
            if (replacement !== null) {
                rawLines[index] = replacement;
                const nextValue = rawLines.join('\n');
                plusEditTextarea.setRangeText(
                    nextValue,
                    0,
                    plusEditTextarea.value.length,
                    'end'
                );
                plusEditTextarea.dispatchEvent(new Event('input', { bubbles: true }));
                const signEnd = replacement.indexOf('\\pm') + '\\pm'.length;
                const cursor = offset + Math.max(0, signEnd);
                plusEditTextarea.focus();
                plusEditTextarea.setSelectionRange(cursor, cursor);
                return;
            }
            offset += rawLines[index].length + 1;
        }
    }

    function __plusCloseEditor(restoreFocus = true): void {
        if (!plusInlineEditor || plusInlineEditor.hidden) return;
        plusInlineEditor.hidden = true;
        if (plusEditBtn) plusEditBtn.setAttribute('aria-expanded', 'false');
        if (restoreFocus && plusEditBtn?.isConnected) {
            requestAnimationFrame(() => {
                try { plusEditBtn?.focus(); } catch (_) { }
            });
        }
    }

    function __plusOpenEditor(): void {
        if (!plusInlineEditor || !plusEditTextarea || !plusEditBtn ||
            plusEditBtn.disabled || __ocrBusy || __plusIsFrozenView()) return;
        const snapshot = plusReview?.getSnapshot();
        if (!snapshot || __plusRenderedRevision !== __plusInkRevision ||
            plusResult?.dataset.stale === '1') return;
        plusEditTextarea.value = snapshot.editableText;
        plusEditTextarea.rows = Math.max(3, Math.min(12, snapshot.lines.length + 1));
        plusInlineEditor.hidden = false;
        plusEditBtn.setAttribute('aria-expanded', 'true');
        __plusValidateEditor();
        requestAnimationFrame(() => {
            if (plusEditTextarea?.isConnected && !plusInlineEditor?.hidden) {
                plusEditTextarea.focus();
            }
        });
    }

    function __plusCommitRenderedResult(
        editableText: string,
        revision: number,
        modelKey: string,
        source: 'ocr' | 'correction',
        preparedInBackground: boolean,
        writtenSubmission: WrittenArithmeticSubmission | null = null
    ): void {
        if (isWrittenArithmetic) {
            if (!writtenSubmission || writtenSubmission.kind !== writtenArithmeticKind) {
                throw new Error('Written arithmetic has no matching structured submission.');
            }
            __plusWrittenSubmission = writtenSubmission;
        } else {
            __plusWrittenSubmission = null;
        }
        const snapshot = plusReview?.render(editableText, revision);
        if (!snapshot || !snapshot.latex) {
            throw new Error('Calculation OCR has no renderable lines.');
        }
        const renderedLineCount = isWrittenArithmetic && __plusWrittenSubmission
            ? writtenArithmeticLayoutRowCount(__plusWrittenSubmission)
            : snapshot.lines.length;
        __plusRenderedRevision = revision;
        __plusRenderedModelKey = modelKey;
        if (source === 'correction') {
            __plusCorrection = {
                revision,
                modelKey,
                editableText: snapshot.editableText,
                latex: snapshot.latex,
                lineCount: snapshot.lines.length
            };
        } else {
            __plusCorrection = null;
        }
        if (plusResult) {
            plusResult.hidden = false;
            plusResult.dataset.stale = '0';
            plusResult.dataset.latex = snapshot.latex;
            plusResult.dataset.lineCount = String(renderedLineCount);
            plusResult.dataset.resultSource = source;
            plusResult.removeAttribute('aria-busy');
        }
        if (plusEditBtn) plusEditBtn.disabled = isWrittenArithmetic;
        if (lineFeedbackEnabled) {
            __plusStoreFreezeReview({
                v: 'cr1',
                lines: snapshot.lines.slice(),
                state: snapshot.lines.length > 1 ? 'running' : 'ready',
                checks: []
            }, 'calculation-render');
        }
        __plusCloseEditor(source === 'correction');
        __plusSetStandaloneState('rendered');
        const submissionValue = isWrittenArithmetic && __plusWrittenSubmission
            ? serializeWrittenArithmeticSubmission(__plusWrittenSubmission)
            : serializeCalculationSubmission(snapshot.lines);
        const firstEquation = extractCalculationEquation(snapshot.lines[0] || '');
        const promptEquation = String(
            canvasPair?.dataset.calculationPrompt || firstEquation
        ).trim();
        const grade = submissionValue && promptEquation
            ? isWrittenArithmetic
                ? validateWrittenArithmeticSubmission(promptEquation, submissionValue)
                : validateCalculationSubmission(promptEquation, submissionValue)
            : null;
        const pathAccepted = grade?.accepted === true;
        const value = submissionValue;
        // An empty serialized value signals an oversized submission. Keep
        // the last native quiz value instead of silently clearing it.
        const applied = value && canvasPair
            ? applyNativeQuizSubmissionForPair(canvasPair, value)
            : false;
        canvasPair?.dispatchEvent(new CustomEvent('lia:canvasplus-answer', {
            bubbles: true,
            detail: {
                uid: uid || '',
                revision,
                lines: snapshot.lines,
                latex: snapshot.latex,
                value,
                submissionValue,
                pathAccepted,
                source,
                applied
            }
        }));
        canvasPair?.dispatchEvent(new CustomEvent('lia:canvasplus-render', {
            bubbles: true,
            detail: {
                uid: uid || '',
                revision,
                lineCount: renderedLineCount,
                lines: snapshot.lines,
                latex: snapshot.latex,
                source,
                preparedInBackground
            }
        }));
    }

    function __plusApplyCorrection(): void {
        if (!plusEditTextarea || cleanedUp ||
            __ocrBusy || __plusIsFrozenView() ||
            __plusRenderedRevision !== __plusInkRevision ||
            plusResult?.dataset.stale === '1' ||
            !__plusValidateEditor()) return;
        const previousLatex = plusResult?.dataset.latex || '';
        const revision = __plusInkRevision;
        const modelKey = __plusRenderedModelKey || __plusModelKey(__plusGetOcrEngine());
        __plusCommitRenderedResult(
            __plusEditorLines().join('\n'),
            revision,
            modelKey,
            'correction',
            false
        );
        const snapshot = plusReview?.getSnapshot();
        if (!snapshot) return;
        canvasPair?.dispatchEvent(new CustomEvent('lia:canvasplus-correction', {
            bubbles: true,
            detail: {
                uid: uid || '',
                revision,
                previousLatex,
                latex: snapshot.latex,
                lines: snapshot.lines,
                lineCount: snapshot.lines.length
            }
        }));
    }

    function __plusMarkRenderedStale(): void {
        if (!plusResult || __plusRenderedRevision < 0) return;
        __plusCorrection = null;
        __plusCloseEditor(false);
        plusReview?.markStale();
        if (lineFeedbackEnabled && __plusFreezeReview) {
            __plusStoreFreezeReview({
                ...__plusFreezeReview,
                stale: 1
            }, 'calculation-stale');
        }
        if (plusEditBtn) plusEditBtn.disabled = true;
        plusResult.dataset.stale = '1';
        __plusSetStandaloneState('stale');
    }

    function __plusClearStandaloneResult(): void {
        if (canvasPair) {
            delete canvasPair.dataset.ocrError;
            applyNativeQuizSubmissionForPair(canvasPair, '');
        }
        __plusRenderedRevision = -1;
        __plusRenderedModelKey = '';
        __plusCorrection = null;
        if (lineFeedbackEnabled && __plusFreezeReview) {
            __plusFreezeReview = null;
            persist('calculation-clear');
        }
        __plusRasterInkState = 'empty';
        if (plusSubmitBtn) plusSubmitBtn.disabled = true;
        if (plusEditBtn) plusEditBtn.disabled = true;
        __plusCloseEditor(false);
        if (plusResult) {
            plusResult.hidden = true;
            plusResult.dataset.stale = '0';
            plusResult.dataset.state = 'idle';
            plusResult.removeAttribute('data-latex');
            plusResult.removeAttribute('data-line-count');
            plusResult.removeAttribute('aria-busy');
        }
        if (plusResultDisclosure) plusResultDisclosure.open = false;
        plusReview?.clear();
        __plusWrittenSubmission = null;
        __plusSetStandaloneState('empty');
    }

    function __plusCropAllInk(): HTMLCanvasElement | null {
        if (!isCanvasPlus) return null;
        if (!__plusHasVisibleInkItems()) {
            __plusRasterInkState = 'empty';
            return null;
        }
        const selectionBounds = __plusSelectionBounds();
        let worldX0 = Number.POSITIVE_INFINITY;
        let worldY0 = Number.POSITIVE_INFINITY;
        let worldX1 = Number.NEGATIVE_INFINITY;
        let worldY1 = Number.NEGATIVE_INFINITY;
        if (selectionBounds) {
            worldX0 = selectionBounds.x0;
            worldY0 = selectionBounds.y0;
            worldX1 = selectionBounds.x1;
            worldY1 = selectionBounds.y1;
        } else {
            for (const item of ITEMS) {
                if (!item || item.kind !== 'path' || item.tool === 'eraser' ||
                    !Array.isArray(item.points) || item.points.length < 2) continue;
                const padding = Math.max(1, Number(item.width) || 1) * 0.5 + 2;
                for (const point of item.points) {
                    if (!point || !isFinite(point.x) || !isFinite(point.y)) continue;
                    worldX0 = Math.min(worldX0, point.x - padding);
                    worldY0 = Math.min(worldY0, point.y - padding);
                    worldX1 = Math.max(worldX1, point.x + padding);
                    worldY1 = Math.max(worldY1, point.y + padding);
                }
            }
        }
        if (!isFinite(worldX0) || !isFinite(worldY0) || !isFinite(worldX1) || !isFinite(worldY1)) {
            return null;
        }

        // Render from world-space paths instead of the current viewport. This
        // keeps panned or zoomed-out parts of a calculation block in the OCR
        // input and produces stable line fingerprints across view changes.
        const paddingWorld = 18;
        worldX0 -= paddingWorld;
        worldY0 -= paddingWorld;
        worldX1 += paddingWorld;
        worldY1 += paddingWorld;
        const worldWidth = Math.max(1, worldX1 - worldX0);
        const worldHeight = Math.max(1, worldY1 - worldY0);
        const baseScale = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
        const rawWidth = Math.max(1, Math.ceil(worldWidth * baseScale));
        const rawHeight = Math.max(1, Math.ceil(worldHeight * baseScale));
        const sampleScale = Math.min(
            1,
            PLUS_OCR_MAX_RASTER_SIDE / Math.max(rawWidth, rawHeight),
            Math.sqrt(PLUS_OCR_MAX_RASTER_PIXELS / Math.max(1, rawWidth * rawHeight))
        );
        const rasterScale = baseScale * sampleScale;
        const sampleWidth = Math.max(1, Math.round(worldWidth * rasterScale));
        const sampleHeight = Math.max(1, Math.round(worldHeight * rasterScale));
        const sample = document.createElement('canvas');
        sample.width = sampleWidth;
        sample.height = sampleHeight;
        const sampleContext = sample.getContext('2d', { willReadFrequently: true });
        if (!sampleContext) return null;
        sampleContext.clearRect(0, 0, sampleWidth, sampleHeight);
        sampleContext.setTransform(
            rasterScale,
            0,
            0,
            rasterScale,
            -worldX0 * rasterScale,
            -worldY0 * rasterScale
        );
        sampleContext.save();
        if (selectionBounds) {
            // Keep OCR padding white without admitting strokes that sit just
            // outside the learner's marked render area.
            sampleContext.beginPath();
            sampleContext.rect(
                selectionBounds.x0,
                selectionBounds.y0,
                selectionBounds.x1 - selectionBounds.x0,
                selectionBounds.y1 - selectionBounds.y0
            );
            sampleContext.clip();
        }
        for (const item of ITEMS) {
            if (!item || item.kind !== 'path' || !Array.isArray(item.points) || item.points.length < 2) continue;
            sampleContext.save();
            sampleContext.globalCompositeOperation = item.tool === 'eraser' ? 'destination-out' : 'source-over';
            sampleContext.globalAlpha = 1;
            sampleContext.strokeStyle = '#000';
            sampleContext.lineWidth = Math.max(0.5, Number(item.width) || 1);
            sampleContext.lineCap = 'round';
            sampleContext.lineJoin = 'round';
            sampleContext.beginPath();
            sampleContext.moveTo(item.points[0].x, item.points[0].y);
            for (let index = 1; index < item.points.length; index++) {
                sampleContext.lineTo(item.points[index].x, item.points[index].y);
            }
            sampleContext.stroke();
            sampleContext.restore();
        }
        sampleContext.restore();
        sampleContext.setTransform(1, 0, 0, 1, 0, 0);
        const image = sampleContext.getImageData(0, 0, sampleWidth, sampleHeight);
        const rasterWidth = sampleWidth;
        const rasterHeight = sampleHeight;
        let inkX0 = rasterWidth, inkY0 = rasterHeight, inkX1 = -1, inkY1 = -1;
        for (let y = 0; y < rasterHeight; y++) {
            for (let x = 0; x < rasterWidth; x++) {
                const offset = (y * rasterWidth + x) * 4;
                if (image.data[offset + 3] <= 10) continue;
                if (x < inkX0) inkX0 = x;
                if (y < inkY0) inkY0 = y;
                if (x > inkX1) inkX1 = x;
                if (y > inkY1) inkY1 = y;
            }
        }
        if (inkX1 < inkX0 || inkY1 < inkY0) {
            __plusRasterInkState = 'empty';
            return null;
        }

        const trimPad = Math.max(6, Math.round(12 * rasterScale));
        inkX0 = Math.max(0, inkX0 - trimPad);
        inkY0 = Math.max(0, inkY0 - trimPad);
        inkX1 = Math.min(rasterWidth - 1, inkX1 + trimPad);
        inkY1 = Math.min(rasterHeight - 1, inkY1 + trimPad);
        const outputWidth = inkX1 - inkX0 + 1;
        const outputHeight = inkY1 - inkY0 + 1;
        const output = document.createElement('canvas');
        output.width = outputWidth;
        output.height = outputHeight;
        const outputContext = output.getContext('2d', { willReadFrequently: true });
        if (!outputContext) return null;
        const binary = outputContext.createImageData(outputWidth, outputHeight);
        for (let y = 0; y < outputHeight; y++) {
            for (let x = 0; x < outputWidth; x++) {
                const sourceOffset = ((inkY0 + y) * rasterWidth + inkX0 + x) * 4;
                const targetOffset = (y * outputWidth + x) * 4;
                const value = image.data[sourceOffset + 3] > 10 ? 0 : 255;
                binary.data[targetOffset] = value;
                binary.data[targetOffset + 1] = value;
                binary.data[targetOffset + 2] = value;
                binary.data[targetOffset + 3] = 255;
            }
        }
        outputContext.putImageData(binary, 0, 0);
        (output as any).__liaOcrPixelScale = rasterScale;
        const hintPathItems = ITEMS.filter(item => {
            if (!item || item.kind !== 'path' || item.tool === 'eraser' ||
                !Array.isArray(item.points) || item.points.length < 2) return false;
            if (!selectionBounds) return true;
            const bounds = __plusPathBounds(item);
            return Boolean(bounds && __plusBoundsIntersect(bounds, selectionBounds));
        });
        const hintSymbolPaths = hintPathItems.map(item => ({
            points: item.points,
            strokeWidth: Math.max(0.5, Number(item.width) || 1)
        }));
        const mapColumnBoxToCrop = <T extends {
            x0: number;
            y0: number;
            x1: number;
            y1: number;
        }>(hint: T): T => ({
            ...hint,
            x0: Math.max(0, (hint.x0 - worldX0) * rasterScale - inkX0),
            y0: Math.max(0, (hint.y0 - worldY0) * rasterScale - inkY0),
            x1: Math.min(
                outputWidth - 1,
                (hint.x1 - worldX0) * rasterScale - inkX0
            ),
            y1: Math.min(
                outputHeight - 1,
                (hint.y1 - worldY0) * rasterScale - inkY0
            )
        });
        const cropInkCoverage = (hint: {
            x0: number;
            y0: number;
            x1: number;
            y1: number;
        }): { ink: number; columns: number; rows: number; width: number; height: number } => {
            const x0 = Math.max(0, Math.floor(hint.x0));
            const y0 = Math.max(0, Math.floor(hint.y0));
            const x1 = Math.min(outputWidth - 1, Math.ceil(hint.x1));
            const y1 = Math.min(outputHeight - 1, Math.ceil(hint.y1));
            const columns = new Set<number>();
            const rows = new Set<number>();
            let ink = 0;
            for (let y = y0; y <= y1; y++) {
                for (let x = x0; x <= x1; x++) {
                    const offset = (y * outputWidth + x) * 4;
                    if (binary.data[offset] !== 0) continue;
                    ink++;
                    columns.add(x);
                    rows.add(y);
                }
            }
            return {
                ink,
                columns: columns.size,
                rows: rows.size,
                width: Math.max(1, x1 - x0 + 1),
                height: Math.max(1, y1 - y0 + 1)
            };
        };
        const visibleCalculationRule = (hint: {
            x0: number;
            y0: number;
            x1: number;
            y1: number;
        }): boolean => {
            const coverage = cropInkCoverage(hint);
            return coverage.ink >= Math.max(6, coverage.width * 0.55) &&
                coverage.columns >= coverage.width * 0.7;
        };
        const visibleCarryOne = (hint: {
            x0: number;
            y0: number;
            x1: number;
            y1: number;
        }): boolean => {
            const coverage = cropInkCoverage(hint);
            if (
                coverage.ink < Math.max(4, (coverage.width + coverage.height) * 0.3) ||
                coverage.rows < coverage.height * 0.62
            ) {
                return false;
            }
            const x0 = Math.max(0, Math.floor(hint.x0));
            const y0 = Math.max(0, Math.floor(hint.y0));
            const x1 = Math.min(outputWidth - 1, Math.ceil(hint.x1));
            const y1 = Math.min(outputHeight - 1, Math.ceil(hint.y1));
            const lowerStart = y0 + Math.floor((y1 - y0 + 1) * 0.45);
            const upperEnd = y0 + Math.ceil((y1 - y0 + 1) * 0.48);
            const lowerXs: number[] = [];
            for (let y = lowerStart; y <= y1; y++) {
                for (let x = x0; x <= x1; x++) {
                    if (binary.data[(y * outputWidth + x) * 4] === 0) {
                        lowerXs.push(x);
                    }
                }
            }
            if (!lowerXs.length) return false;
            lowerXs.sort((left, right) => left - right);
            const stemX = lowerXs[Math.floor(lowerXs.length / 2)];
            const hookOffset = Math.max(
                2,
                Math.ceil(Math.max(stemX - x0, x1 - stemX) * 0.5)
            );
            const hookRows = new Set<number>();
            const hookColumns = new Set<number>();
            for (let y = y0; y <= upperEnd; y++) {
                for (let x = x0; x <= x1; x++) {
                    if (binary.data[(y * outputWidth + x) * 4] !== 0) continue;
                    if (Math.abs(x - stemX) <= hookOffset) continue;
                    hookRows.add(y);
                    hookColumns.add(x);
                }
            }
            // At small CSS/device-pixel scales a real diagonal hook can occupy
            // only one outer raster column. Its distance from the lower stem,
            // not its pixel count, is the stable signal.
            return hookRows.size >= 1 && hookColumns.size >= 1;
        };
        const columnRuleWorldHints = usesFinalCalculationRule
            ? findOcrCalculationRuleHints(hintSymbolPaths).filter(hint =>
                !selectionBounds || (
                    hint.x0 >= selectionBounds.x0 &&
                    hint.y0 >= selectionBounds.y0 &&
                    hint.x1 <= selectionBounds.x1 &&
                    hint.y1 <= selectionBounds.y1
                )
            )
            : [];
        const columnCarryWorldHints = usesCarryOrBorrowOnes
            ? findOcrCarryOneHints(hintSymbolPaths, columnRuleWorldHints)
            : [];
        const divisionRuleWorldHints = isColumnDivision
            ? findOcrDivisionRuleHints(hintSymbolPaths).filter(hint =>
                !selectionBounds || (
                    hint.x0 >= selectionBounds.x0 &&
                    hint.y0 >= selectionBounds.y0 &&
                    hint.x1 <= selectionBounds.x1 &&
                    hint.y1 <= selectionBounds.y1
                )
            )
            : [];
        const columnRuleHints = columnRuleWorldHints
            .map(mapColumnBoxToCrop)
            .filter(hint =>
                hint.x1 > hint.x0 && hint.y1 >= hint.y0 &&
                visibleCalculationRule(hint)
            );
        const visibleRulePathIndexes = new Set<number>();
        for (const hint of columnRuleHints) {
            for (const pathIndex of hint.pathIndexes) {
                visibleRulePathIndexes.add(pathIndex);
            }
        }
        const columnCarryHints = columnCarryWorldHints
            .map(mapColumnBoxToCrop)
            .filter(hint =>
                hint.x1 > hint.x0 && hint.y1 > hint.y0 &&
                hint.rulePathIndexes.some(pathIndex =>
                    visibleRulePathIndexes.has(pathIndex)
                ) &&
                visibleCarryOne(hint)
            );
        const divisionRuleHints = divisionRuleWorldHints
            .map(mapColumnBoxToCrop)
            .filter(hint =>
                hint.x1 > hint.x0 && hint.y1 >= hint.y0 &&
                visibleCalculationRule(hint)
            );
        (output as any).__liaOcrCalculationRules = columnRuleHints;
        (output as any).__liaOcrCarryOneHints = columnCarryHints;
        (output as any).__liaOcrDivisionRules = divisionRuleHints;
        const delimiterPathEntries = hintPathItems
            .map((item, itemIndex) => ({ item, itemIndex }))
            .filter(({ item }) => {
                if (!selectionBounds) return true;
                const bounds = __plusPathBounds(item);
                return Boolean(
                    bounds &&
                    bounds.x0 >= selectionBounds.x0 &&
                    bounds.y0 >= selectionBounds.y0 &&
                    bounds.x1 <= selectionBounds.x1 &&
                    bounds.y1 <= selectionBounds.y1
                );
            });
        const delimiterSymbolPaths = delimiterPathEntries.map(({ item }) => ({
            points: item.points,
            strokeWidth: Math.max(0.5, Number(item.width) || 1)
        }));
        const delimiterWorldHints = findOcrDelimiterHints(delimiterSymbolPaths)
            .map(hint => ({
                ...hint,
                pathIndexes: hint.pathIndexes.map(
                    pathIndex => delimiterPathEntries[pathIndex].itemIndex
                )
            }))
            .filter(hint => !selectionBounds || (
                hint.x0 >= selectionBounds.x0 &&
                hint.y0 >= selectionBounds.y0 &&
                hint.x1 <= selectionBounds.x1 &&
                hint.y1 <= selectionBounds.y1
            ));
        const delimiterPathIndexes = new Set<number>();
        for (const hint of delimiterWorldHints) {
            for (const pathIndex of hint.pathIndexes) {
                delimiterPathIndexes.add(pathIndex);
            }
        }
        const delimiterHints = delimiterWorldHints.map(hint => ({
            x0: (hint.x0 - worldX0) * rasterScale - inkX0,
            y0: (hint.y0 - worldY0) * rasterScale - inkY0,
            x1: (hint.x1 - worldX0) * rasterScale - inkX0,
            y1: (hint.y1 - worldY0) * rasterScale - inkY0,
            kind: hint.kind,
            pathIndexes: hint.pathIndexes
        })).filter(hint =>
            hint.x1 >= 0 && hint.y1 >= 0 &&
            hint.x0 < outputWidth && hint.y0 < outputHeight
        ).map(hint => ({
            ...hint,
            x0: Math.max(0, hint.x0),
            y0: Math.max(0, hint.y0),
            x1: Math.min(outputWidth - 1, hint.x1),
            y1: Math.min(outputHeight - 1, hint.y1)
        }));
        (output as any).__liaOcrDelimiterHints = delimiterHints;
        const plusMinusBoxes = findOcrPlusMinusBoxes(
            hintSymbolPaths
        ).map(box => selectionBounds ? ({
            x0: Math.max(box.x0, selectionBounds.x0),
            y0: Math.max(box.y0, selectionBounds.y0),
            x1: Math.min(box.x1, selectionBounds.x1),
            y1: Math.min(box.y1, selectionBounds.y1)
        }) : box).filter(box => box.x1 > box.x0 && box.y1 > box.y0).map(box => ({
            x0: (box.x0 - worldX0) * rasterScale - inkX0,
            y0: (box.y0 - worldY0) * rasterScale - inkY0,
            x1: (box.x1 - worldX0) * rasterScale - inkX0,
            y1: (box.y1 - worldY0) * rasterScale - inkY0
        })).filter(box =>
            box.x1 >= 0 && box.y1 >= 0 &&
            box.x0 < outputWidth && box.y0 < outputHeight
        ).map(box => ({
            x0: Math.max(0, box.x0),
            y0: Math.max(0, box.y0),
            x1: Math.min(outputWidth - 1, box.x1),
            y1: Math.min(outputHeight - 1, box.y1)
        }));
        (output as any).__liaOcrPlusMinusBoxes = plusMinusBoxes;
        const verticalStrokeHints: Array<{
            x0: number;
            y0: number;
            x1: number;
            y1: number;
            hasTopHook: boolean;
            slantRatio: number;
        }> = [];
        for (let itemIndex = 0; itemIndex < hintPathItems.length; itemIndex++) {
            const item = hintPathItems[itemIndex];
            if (delimiterPathIndexes.has(itemIndex)) continue;
            const points = item.points.filter((point: any) =>
                point && isFinite(point.x) && isFinite(point.y)
            );
            if (points.length < 2) continue;
            if (classifyOcrVerticalSymbolPath(hintSymbolPaths, itemIndex) !==
                'hookless-bar') continue;
            let minX = Number.POSITIVE_INFINITY;
            let minY = Number.POSITIVE_INFINITY;
            let maxX = Number.NEGATIVE_INFINITY;
            let maxY = Number.NEGATIVE_INFINITY;
            let pathLength = 0;
            for (let index = 0; index < points.length; index++) {
                const point = points[index];
                minX = Math.min(minX, point.x);
                minY = Math.min(minY, point.y);
                maxX = Math.max(maxX, point.x);
                maxY = Math.max(maxY, point.y);
                if (index > 0) {
                    pathLength += Math.hypot(
                        point.x - points[index - 1].x,
                        point.y - points[index - 1].y
                    );
                }
            }
            const first = points[0];
            const last = points[points.length - 1];
            const dx = last.x - first.x;
            const dy = last.y - first.y;
            const directLength = Math.hypot(dx, dy);
            const strokeWidthWorld = Math.max(0.5, Number(item.width) || 1);
            const rawWidth = Math.max(0, maxX - minX);
            const rawHeight = Math.max(0, maxY - minY);
            if (rawHeight < Math.max(6, strokeWidthWorld * 8, rawWidth * 1.8)) continue;
            if (Math.abs(dy) < Math.abs(dx) * 1.8 ||
                directLength < rawHeight * 0.85) continue;
            if (pathLength > directLength * 1.15) continue;
            let maxDeviation = 0;
            if (directLength > 0) {
                for (const point of points) {
                    const deviation = Math.abs(
                        dy * point.x - dx * point.y + last.x * first.y - last.y * first.x
                    ) / directLength;
                    maxDeviation = Math.max(maxDeviation, deviation);
                }
            }
            if (maxDeviation > Math.max(strokeWidthWorld * 1.75, rawHeight * 0.055)) {
                continue;
            }

            const halfStroke = strokeWidthWorld * 0.5 + 1;
            const hintWorldX0 = selectionBounds
                ? Math.max(minX - halfStroke, selectionBounds.x0)
                : minX - halfStroke;
            const hintWorldY0 = selectionBounds
                ? Math.max(minY - halfStroke, selectionBounds.y0)
                : minY - halfStroke;
            const hintWorldX1 = selectionBounds
                ? Math.min(maxX + halfStroke, selectionBounds.x1)
                : maxX + halfStroke;
            const hintWorldY1 = selectionBounds
                ? Math.min(maxY + halfStroke, selectionBounds.y1)
                : maxY + halfStroke;
            if (hintWorldX1 <= hintWorldX0 || hintWorldY1 <= hintWorldY0) continue;
            const x0 = (hintWorldX0 - worldX0) * rasterScale - inkX0;
            const y0 = (hintWorldY0 - worldY0) * rasterScale - inkY0;
            const x1 = (hintWorldX1 - worldX0) * rasterScale - inkX0;
            const y1 = (hintWorldY1 - worldY0) * rasterScale - inkY0;
            if (x1 < 0 || y1 < 0 || x0 >= outputWidth || y0 >= outputHeight) continue;
            verticalStrokeHints.push({
                x0: Math.max(0, x0),
                y0: Math.max(0, y0),
                x1: Math.min(outputWidth - 1, x1),
                y1: Math.min(outputHeight - 1, y1),
                hasTopHook: false,
                slantRatio: Math.abs(dx) / Math.max(Math.abs(dy), 1e-6)
            });
        }
        (output as any).__liaOcrVerticalStrokes = verticalStrokeHints;
        (output as any).__liaOcrRenderScope = selectionBounds ? 'selection' : 'all';
        __plusRasterInkState = 'present';
        return output;
    }

    async function __plusRenderWholeBlock(): Promise<void> {
        if (!isCanvasPlus || __ocrBusy || cleanedUp || !wrap!.isConnected ||
            __plusIsFrozenView()) return;
        if (canvasPair) delete canvasPair.dataset.ocrError;
        LIA.lastCanvasPlusError = '';
        if (!__plusHasVisibleInkItems() || __plusRasterIsEmpty()) {
            __plusClearStandaloneResult();
            return;
        }
        const engine = __plusGetOcrEngine();
        if (!engine || !engine.recognize) {
            const errorMessage = trOcr(
                'plus.engineUnavailable',
                'The calculation OCR engine is unavailable.'
            );
            if (canvasPair) canvasPair.dataset.ocrError = errorMessage;
            LIA.lastCanvasPlusError = errorMessage;
            __plusSetStandaloneState('error');
            return;
        }

        const revision = __plusInkRevision;
        const generation = __plusGeneration;
        const modelKey = __plusModelKey(engine);
        const isCurrent = () =>
            !cleanedUp &&
            Boolean(wrap!.isConnected) &&
            revision === __plusInkRevision &&
            generation === __plusGeneration &&
            modelKey === __plusModelKey(engine) &&
            !__plusIsFrozenView();

        __ocrBusy = true;
        if (plusSubmitBtn) plusSubmitBtn.disabled = true;
        if (plusEditBtn) plusEditBtn.disabled = true;
        __plusCloseEditor(false);
        if (plusResult) plusResult.setAttribute('aria-busy', 'true');
        __plusSetStandaloneState('running');

        try {
            if (__plusCorrection &&
                __plusCorrection.revision === revision &&
                __plusCorrection.modelKey === modelKey) {
                __plusCommitRenderedResult(
                    __plusCorrection.editableText,
                    revision,
                    modelKey,
                    'correction',
                    false
                );
                return;
            }
            let recognition = __plusDraft && __plusDraft.modelKey === modelKey
                ? __plusDraft
                : null;
            if (!recognition) {
                const crop = __plusCropAllInk();
                if (!crop) {
                    if (__plusRasterIsEmpty()) {
                        __plusClearStandaloneResult();
                        return;
                    }
                    throw new Error('Calculation OCR could not prepare the handwriting image.');
                }
                recognition = await __plusRecognizeDocument(
                    engine,
                    crop,
                    'foreground',
                    false,
                    isCurrent
                );
            }
            if (!isCurrent()) throw __plusCancelledError();
            if (!recognition.latex.trim()) {
                throw new Error('Calculation OCR returned no text.');
            }

            __plusDraft = recognition;
            __plusCommitRenderedResult(
                recognition.editableText,
                revision,
                modelKey,
                'ocr',
                recognition.recognizedCount === 0,
                recognition.writtenSubmission || null
            );
        } catch (error) {
            if (__plusIsCancelledError(error)) {
                if (!__plusHasVisibleInkItems()) __plusClearStandaloneResult();
                else if (__plusRenderedRevision >= 0) __plusMarkRenderedStale();
                else __plusSetStandaloneState(
                    plusBackgroundRecognitionEnabled ? 'preparing' : 'ready'
                );
                return;
            }
            const errorMessage = error && (error as any).message
                ? String((error as any).message)
                : String(error);
            if (canvasPair) canvasPair.dataset.ocrError = errorMessage;
            LIA.lastCanvasPlusError = errorMessage;
            __ocrLog('Calculation block render error: ' + errorMessage);
            const keepPrevious = __plusRenderedRevision >= 0 &&
                Boolean(plusResult?.dataset.latex) && Boolean(plusResult && !plusResult.hidden);
            if (keepPrevious) {
                if (plusResult) {
                    plusResult.hidden = false;
                    plusResult.dataset.stale = '1';
                    plusResult.removeAttribute('aria-busy');
                }
                __plusSetStandaloneState('error-stale');
            } else {
                if (plusResult) {
                    plusResult.hidden = true;
                    plusResult.removeAttribute('data-latex');
                    plusResult.removeAttribute('aria-busy');
                }
                plusReview?.clear();
                __plusSetStandaloneState('error');
            }
        } finally {
            if (plusResult) plusResult.removeAttribute('aria-busy');
            __ocrBusy = false;
            updateUI();
            __liaRefreshOcrTexts();
        }
    }

    if (plusSubmitBtn) {
        plusSubmitBtn.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            void __plusRenderWholeBlock();
        });
    }
    if (plusEditBtn) {
        plusEditBtn.addEventListener('click', event => {
            event.preventDefault();
            event.stopPropagation();
            if (plusInlineEditor?.hidden) __plusOpenEditor();
            else __plusCloseEditor();
        });
    }
    if (plusEditTextarea) {
        plusEditTextarea.addEventListener('input', __plusValidateEditor);
        plusEditTextarea.addEventListener('keydown', event => {
            if (event.key === 'Escape') {
                event.preventDefault();
                event.stopPropagation();
                __plusCloseEditor();
            } else if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
                event.preventDefault();
                __plusApplyCorrection();
            }
        });
    }
    if (plusEditCancelBtn) {
        plusEditCancelBtn.addEventListener('click', event => {
            event.preventDefault();
            __plusCloseEditor();
        });
    }
    if (plusEditApplyBtn) {
        plusEditApplyBtn.addEventListener('click', event => {
            event.preventDefault();
            __plusApplyCorrection();
        });
    }
    if (plusEditInsertPmBtn) {
        plusEditInsertPmBtn.addEventListener('click', event => {
            event.preventDefault();
            event.stopPropagation();
            __plusInsertMissingPlusMinus();
        });
    }

    function __plusScheduleBackground(reason: string, delay = PLUS_BACKGROUND_IDLE_MS): void {
        if (!isCanvasPlus) return;
        if (__plusBackgroundTimer) {
            clearTimeout(__plusBackgroundTimer);
            __plusBackgroundTimer = 0;
        }
        if (!__plusHasVisibleInkItems()) {
            __plusDraft = null;
            __plusDispatch('idle', reason, 0);
            return;
        }
        if (!plusBackgroundRecognitionEnabled) {
            __plusDispatch('manual', reason, __plusDraft ? __plusDraft.lineCount : 0);
            return;
        }
        __plusDispatch('scheduled', reason, __plusDraft ? __plusDraft.lineCount : 0);
        if (document.hidden || __plusIsFrozenView()) return;
        __plusBackgroundTimer = setTimeout(() => {
            __plusBackgroundTimer = 0;
            void __plusRunBackground(reason);
        }, Math.max(0, delay)) as unknown as number;
    }

    function __plusInvalidateInk(reason: string): void {
        if (!isCanvasPlus) return;
        if (__plusBackgroundTimer) {
            clearTimeout(__plusBackgroundTimer);
            __plusBackgroundTimer = 0;
        }
        __plusInkRevision++;
        __plusGeneration++;
        __plusDraft = null;
        __plusCorrection = null;
        __plusRasterInkState = 'unknown';
        if (__plusHasVisibleInkItems()) __plusMarkRenderedStale();
        else __plusClearStandaloneResult();
        __plusDispatch(__plusHasVisibleInkItems() ? 'stale' : 'idle', reason, 0);
        updateUI();
    }

    function __plusInvalidateView(reason: string): void {
        if (!isCanvasPlus) return;
        // Full-block OCR is rendered from world-space paths. Resizing, panning,
        // or zooming therefore does not change either the draft or a rendered
        // result and must not make it stale.
        void reason;
    }

    async function __plusRunBackground(reason: string): Promise<void> {
        if (!isCanvasPlus || cleanedUp || !wrap!.isConnected ||
            document.hidden || __plusIsFrozenView()) return;
        const crop = __plusCropAllInk();
        if (!crop) {
            __plusDraft = null;
            if (__plusRasterIsEmpty()) {
                __plusClearStandaloneResult();
                __plusDispatch('idle', reason, 0);
            } else {
                __ocrLog('Calculation background OCR could not prepare the handwriting image.');
                __plusDispatch('error', reason, 0);
            }
            return;
        }
        const engine = __plusGetOcrEngine();
        if (!engine || !engine.recognize) {
            __plusDispatch('error', reason, 0);
            return;
        }
        const revision = __plusInkRevision;
        const generation = __plusGeneration;
        const modelKey = __plusModelKey(engine);
        const isCurrent = () =>
            !cleanedUp &&
            Boolean(wrap!.isConnected) &&
            revision === __plusInkRevision &&
            generation === __plusGeneration &&
            !document.hidden &&
            !__plusIsFrozenView();
        __plusDispatch('running', reason, 0);
        try {
            const result = await __plusRecognizeDocument(
                engine,
                crop,
                'background',
                true,
                isCurrent
            );
            __plusDraft = result;
            __plusDispatch('ready', reason, result.lineCount);
        } catch (error) {
            if (__plusIsCancelledError(error)) {
                if (cleanedUp || !wrap!.isConnected) return;
                if (revision !== __plusInkRevision || generation !== __plusGeneration) {
                    __plusDispatch('discarded', reason, 0, false, revision);
                } else if (document.hidden || __plusIsFrozenView()) {
                    __plusDispatch('scheduled', 'paused', 0);
                } else if (__plusModelKey(engine) !== modelKey) {
                    __plusScheduleBackground('model-change', 80);
                } else {
                    __plusDispatch('discarded', reason, 0, false, revision);
                }
                return;
            }
            if (revision !== __plusInkRevision || generation !== __plusGeneration) {
                __plusDispatch('discarded', reason, 0, false, revision);
                return;
            }
            __ocrLog('Calculation background OCR error: ' +
                (error && (error as any).message ? (error as any).message : String(error)));
            __plusDispatch('error', reason, 0);
        }
    }

    const onPlusVisibilityChange = (): void => {
        if (!isCanvasPlus || document.hidden || __plusIsFrozenView()) return;
        if (canvasPair && canvasPair.dataset.ocrBackground === 'scheduled') {
            __plusScheduleBackground('visible', 80);
        }
    };
    if (isCanvasPlus) document.addEventListener('visibilitychange', onPlusVisibilityChange);

    let __plusWasFrozen = __plusIsFrozenView();
    const __plusFreezeObserver = isCanvasPlus && document.body
        ? new MutationObserver(() => {
            const frozen = __plusIsFrozenView();
            if (frozen === __plusWasFrozen) return;
            __plusWasFrozen = frozen;
            if (frozen) {
                const focused = document.activeElement as HTMLElement | null;
                if (plusInlineEditor?.contains(focused)) focused?.blur();
                __plusCloseEditor(false);
                if (plusEditBtn) plusEditBtn.disabled = true;
                if (plusEditApplyBtn) plusEditApplyBtn.disabled = true;
                if (plusSubmitBtn) plusSubmitBtn.disabled = true;
                plusReview?.pause();
                if (__plusBackgroundTimer) {
                    clearTimeout(__plusBackgroundTimer);
                    __plusBackgroundTimer = 0;
                }
                __plusGeneration++;
                __plusDispatch(
                    __plusHasVisibleInkItems()
                        ? (plusBackgroundRecognitionEnabled ? 'scheduled' : 'manual')
                        : 'idle',
                    'freeze',
                    __plusDraft ? __plusDraft.lineCount : 0
                );
            } else {
                plusReview?.resume();
                if (!document.hidden && __plusHasVisibleInkItems()) {
                    __plusScheduleBackground('unfreeze', 80);
                }
            }
            updateUI();
        })
        : null;
    if (__plusFreezeObserver && document.body) {
        __plusFreezeObserver.observe(document.body, {
            attributes: true,
            attributeFilter: ['class']
        });
    }

    function clamp(v: number, a: number, b: number): number { return Math.max(a, Math.min(b, v)); }

    function persist(reason?: string): void {
        if (!uid) return;
        const entry: Record<string, unknown> = {
            VIEW: { ...VIEW },
            ITEMS,
            REDO,
            bgMode,
            bgStep,
            wrapW: wrap!.getBoundingClientRect().width,
            canvasH: canvas.clientHeight
        };
        if (lineFeedbackEnabled && __plusFreezeReview) {
            entry.calculationReviewFreeze = __plusFreezeReview;
        }
        STORE[uid] = entry;
        scheduleCanvasFreezeNotify(reason || 'persist');
    }

    function penBaseColor(): string {
        const c = COLORS[colorIndex] || COLORS[0];
        return (c.key === 'auto') ? getAutoPen() : (c.value || getAutoPen());
    }

    function setMenuOpen(open: boolean): void { if (!menu) return; menu.dataset.open = open ? '1' : '0'; }
    function autoCloseSubmenus(): void { if (menu && menu.dataset.open === '1') setMenuOpen(false); }

    function __menuCloseBtnSvg(): string {
        return `<svg viewBox="-1 0 24 24" aria-hidden="true" style="width:22px;height:22px;display:block;"><path class="ico-stroke" d="M6 6l12 12M18 6L6 18" stroke-width="2" stroke-linecap="round"/></svg>`;
    }
    function __menuTrashSvg(): string {
        return `<svg viewBox="-1 0 24 24" aria-hidden="true" style="width:22px;height:22px;display:block;"><path class="ico-stroke" d="M9 3h6" stroke-width="2" stroke-linecap="round"/><path class="ico-stroke" d="M4 6h16" stroke-width="2" stroke-linecap="round"/><path class="ico-stroke" d="M7 6l1 15h8l1-15" stroke-width="2" stroke-linejoin="round"/><path class="ico-stroke" d="M10 10v8M14 10v8" stroke-width="2" stroke-linecap="round"/></svg>`;
    }

    function buildPenMenu(): void {
        if (!menu) return; (menu as any).__mode = 'pen';
        const auto = getAutoPen(); let html = '';
        const penLabel = escapeHtml(trCanvas('pen', 'Pen'));
        const closeLabel = escapeHtml(trCanvas('closeMenu', 'Close menu'));
        html += `<span class="lia-heading-row"><span class="lia-tool-heading">${penLabel}</span><button class="lia-menu-icon-btn" type="button" data-act="close" aria-label="${closeLabel}">${__menuCloseBtnSvg()}</button></span>`;
        html += `<span class="lia-color-grid">`;
        for (let i = 0; i < COLORS.length; i++) {
            const c = COLORS[i], col = (c.key === 'auto') ? auto : (c.value || auto);
            const colorName = trCanvas(
                'color.' + c.key,
                CANVAS_COLOR_FALLBACKS[c.key] || c.key
            );
            const colorLabel = trCanvas('colorLabel', 'Color {color}')
                .replace(/\{color\}/g, colorName);
            html += `<button class="lia-color-item" type="button" data-act="color" data-idx="${i}" data-active="${i === colorIndex ? '1' : '0'}" style="background:${col};" aria-label="${escapeHtml(colorLabel)}"></button>`;
        }
        html += `</span>`;
        html += `<span class="lia-row"><span class="lia-preview"><span class="lia-preview-line" data-k="pw" style="height:${Math.max(2, Math.min(14, penWidth))}px;"></span></span><input class="lia-slider" type="range" min="1" max="100" step="1" value="${penWidth}" data-act="penWidth" aria-label="${escapeHtml(trCanvas('penWidth', 'Pen width'))}"><span class="lia-menu-value" data-k="pwv" style="font-weight:800;min-width:2.6em;text-align:right">${penWidth}</span></span>`;
        html += `<span class="lia-row"><span class="lia-preview"><span class="lia-preview-line" data-k="pa" style="opacity:${penAlpha};"></span></span><input class="lia-slider" type="range" min="0.15" max="1" step="0.05" value="${penAlpha}" data-act="penAlpha" aria-label="${escapeHtml(trCanvas('opacity', 'Opacity'))}"><span class="lia-menu-value" data-k="pav" style="font-weight:800;min-width:2.6em;text-align:right">${Math.round(penAlpha * 100)}%</span></span>`;
        menu.innerHTML = html;
        menu.onclick = (e: MouseEvent) => {
            const el = (e.target && (e.target as Element).closest) ? (e.target as Element).closest('[data-act]') : null;
            if (!el) return; const act = el.getAttribute('data-act');
            if (act === 'close') { setMenuOpen(false); return; }
            if (act === 'color') { const idx = Number(el.getAttribute('data-idx')); if (isFinite(idx)) colorIndex = clamp(idx, 0, COLORS.length - 1); tool = 'pen'; updateUI(); persist(); buildPenMenu(); return; }
        };
        const w = menu.querySelector('input[data-act="penWidth"]') as HTMLInputElement | null;
        if (w) w.oninput = () => { penWidth = clamp(Number(w.value), 1, 100); updateUI(); persist(); const line = menu.querySelector('[data-k="pw"]') as HTMLElement | null; if (line) line.style.height = Math.max(2, Math.min(14, penWidth)) + 'px'; const tv = menu.querySelector('[data-k="pwv"]') as HTMLElement | null; if (tv) tv.textContent = String(penWidth); };
        const a = menu.querySelector('input[data-act="penAlpha"]') as HTMLInputElement | null;
        if (a) a.oninput = () => { penAlpha = clamp(Number(a.value), 0.05, 1); updateUI(); persist(); const line = menu.querySelector('[data-k="pa"]') as HTMLElement | null; if (line) line.style.opacity = String(penAlpha); const tv = menu.querySelector('[data-k="pav"]') as HTMLElement | null; if (tv) tv.textContent = Math.round(penAlpha * 100) + '%'; };
    }

    function buildEraserMenu(): void {
        if (!menu) return; (menu as any).__mode = 'eraser';
        const eraserLabel = escapeHtml(trCanvas('eraser', 'Eraser'));
        const clearAllLabel = escapeHtml(trCanvas('clearAll', 'Clear all'));
        const closeLabel = escapeHtml(trCanvas('closeMenu', 'Close menu'));
        const eraserWidthLabel = escapeHtml(trCanvas('eraserWidth', 'Eraser width'));
        menu.innerHTML = `<span class="lia-heading-row"><span class="lia-tool-heading">${eraserLabel}</span><span style="display:flex;gap:8px;align-items:center"><button class="lia-menu-icon-btn" type="button" data-act="clear" aria-label="${clearAllLabel}">${__menuTrashSvg()}</button><button class="lia-menu-icon-btn" type="button" data-act="close" aria-label="${closeLabel}">${__menuCloseBtnSvg()}</button></span></span><span class="lia-row"><span class="lia-preview"><span class="lia-preview-line lia-preview-line--eraser" style="height:${Math.max(2, Math.min(18, eraserWidth))}px;"></span></span><input class="lia-slider" type="range" min="4" max="500" step="1" value="${eraserWidth}" data-act="eraserWidth" aria-label="${eraserWidthLabel}"><span class="lia-menu-value" data-k="ewv" style="font-weight:800;min-width:2.6em;text-align:right">${eraserWidth}</span></span>`;
        menu.onclick = (e: MouseEvent) => { const el = (e.target as Element)?.closest?.('[data-act]'); if (!el) return; const act = el.getAttribute('data-act'); if (act === 'close') { setMenuOpen(false); return; } if (act === 'clear') { clearAllDrawing(); return; } };
        const w = menu.querySelector('input[data-act="eraserWidth"]') as HTMLInputElement | null;
        if (w) w.oninput = () => { eraserWidth = clamp(Number(w.value), 2, 500); updateUI(); persist(); const tv = menu.querySelector('[data-k="ewv"]') as HTMLElement | null; if (tv) tv.textContent = String(eraserWidth); };
    }

    function buildBgMenu(): void {
        if (!menu) return; (menu as any).__mode = 'bg';
        const labelBackground = escapeHtml(trCanvas('background', 'Background'));
        const closeLabel = escapeHtml(trCanvas('closeMenu', 'Close menu'));
        const noBackgroundLabel = escapeHtml(trCanvas('noBackground', 'No background'));
        const gridLabel = escapeHtml(trCanvas('grid', 'Grid'));
        const linedLabel = escapeHtml(trCanvas('lined', 'Lined'));
        const spacingLabel = escapeHtml(trCanvas('spacing', 'Spacing'));
        const backgroundSpacingLabel = escapeHtml(
            trCanvas('backgroundSpacing', 'Background spacing')
        );
        menu.innerHTML = `<span class="lia-heading-row"><span class="lia-tool-heading">${labelBackground}</span><button class="lia-menu-icon-btn" type="button" data-act="close" aria-label="${closeLabel}">${__menuCloseBtnSvg()}</button></span><span class="lia-bg-tiles"><button class="lia-bg-tile" type="button" data-act="bg" data-mode="none" data-active="${bgMode === 'none' ? '1' : '0'}" aria-label="${noBackgroundLabel}"></button><button class="lia-bg-tile" type="button" data-act="bg" data-mode="grid" data-active="${bgMode === 'grid' ? '1' : '0'}" aria-label="${gridLabel}"></button><button class="lia-bg-tile" type="button" data-act="bg" data-mode="lined" data-active="${bgMode === 'lined' ? '1' : '0'}" aria-label="${linedLabel}"></button></span><span class="lia-row"><span class="lia-menu-label" style="font-weight:800;opacity:.8;min-width:4.8em">${spacingLabel}</span><input class="lia-slider" type="range" min="8" max="80" step="1" value="${bgStep}" data-act="bgStep" aria-label="${backgroundSpacingLabel}"><span class="lia-menu-value" data-k="bgsv" style="font-weight:800;min-width:2.6em;text-align:right">${bgStep}</span></span>`;
        try {
            const accent = rgbaFromAny(getAccentCssVar(), 0.65);
            const tiles = menu.querySelectorAll('.lia-bg-tile');
            if (tiles && tiles.length >= 3) {
                (tiles[1] as HTMLElement).style.backgroundImage = `linear-gradient(to right, ${accent} 2px, transparent 2px), linear-gradient(to bottom, ${accent} 2px, transparent 2px)`;
                (tiles[1] as HTMLElement).style.backgroundSize = '10px 10px'; (tiles[1] as HTMLElement).style.backgroundPosition = 'center';
                (tiles[2] as HTMLElement).style.backgroundImage = `linear-gradient(to bottom, ${accent} 2px, transparent 2px)`;
                (tiles[2] as HTMLElement).style.backgroundSize = '10px 10px'; (tiles[2] as HTMLElement).style.backgroundPosition = 'center';
            }
        } catch (_) { }
        menu.onclick = (e: MouseEvent) => { const el = (e.target as Element)?.closest?.('[data-act]'); if (!el) return; const act = el.getAttribute('data-act'); if (act === 'close') { setMenuOpen(false); return; } if (act === 'bg') { const m = String(el.getAttribute('data-mode') || 'none'); bgMode = (m === 'grid' || m === 'lined') ? m : 'none'; present(); persist(); buildBgMenu(); updateUI(); return; } };
        const s = menu.querySelector('input[data-act="bgStep"]') as HTMLInputElement | null;
        if (s) s.oninput = () => { bgStep = clamp(Number(s.value), 6, 300); present(); persist(); const tv = menu.querySelector('[data-k="bgsv"]') as HTMLElement | null; if (tv) tv.textContent = String(bgStep); };
    }

    function clearMarkerRect(): void {
        let removed = false;
        for (let i = ITEMS.length - 1; i >= 0; i--) if (ITEMS[i] && ITEMS[i].kind === 'rect') { ITEMS.splice(i, 1); removed = true; }
        for (let i = REDO.length - 1; i >= 0; i--) if (REDO[i] && REDO[i].kind === 'rect') { REDO.splice(i, 1); removed = true; }
        if (removed) {
            rebuildHighlightLayer();
            present();
            updateUI();
            persist();
            __plusInvalidateInk('selection-clear');
            __plusScheduleBackground('selection-clear');
        }
        scheduleRectActionUpdate();
    }

    function getRectItem(): any {
        for (let i = ITEMS.length - 1; i >= 0; i--) { const it = ITEMS[i]; if (it && it.kind === 'rect') return it; }
        return null;
    }

    function hideEraserRing(): void { if (!eraserRing) return; eraserRing.dataset.on = '0'; }

    function updateEraserRingFromScreen(sx: number, sy: number): void {
        if (!eraserRing) return;
        if (tool !== 'eraser' || !isFinite(sx) || !isFinite(sy)) { hideEraserRing(); return; }
        const size = Math.max(8, eraserWidth * VIEW.scale);
        eraserRing.style.width = size + 'px'; eraserRing.style.height = size + 'px';
        eraserRing.style.left = clamp(sx, 0, canvas.clientWidth) + 'px';
        eraserRing.style.top = clamp(sy, 0, canvas.clientHeight) + 'px';
        eraserRing.dataset.on = '1';
    }

    let __rectBtnRAF = 0;
    function scheduleRectActionUpdate(): void {
        if (__rectBtnRAF) return;
        __rectBtnRAF = requestAnimationFrame(() => { __rectBtnRAF = 0; updateRectActionButton(); });
    }

    function updateRectActionButton(): void {
        const it = getRectItem();
        if (!it) { rectActionBtn.style.display = 'none'; if (rectCloseBtn) rectCloseBtn.style.display = 'none'; return; }
        const x0 = Math.min(it.x0, it.x1), y0 = Math.min(it.y0, it.y1);
        const x1 = Math.max(it.x0, it.x1), y1 = Math.max(it.y0, it.y1);
        const a = worldToScreen(x0, y0), b = worldToScreen(x1, y1);
        if (isCanvasPlus) {
            // The calculation block has one explicit Submit-to-render action. The classic
            // quiz-submit bubble would create a second, competing flow.
            rectActionBtn.style.display = 'none';
        } else {
            rectActionBtn.style.display = 'block'; rectActionBtn.style.visibility = 'hidden';
            const bw = rectActionBtn.offsetWidth || 180, bh = rectActionBtn.offsetHeight || 34;
            rectActionBtn.style.visibility = 'visible';
            const right = Math.max(a.sx, b.sx), bottom = Math.max(a.sy, b.sy);
            const pad = 6, gap = 8;
            const left = clamp(right - bw, pad, canvas.clientWidth - bw - pad);
            const top = clamp(bottom + gap, pad, canvas.clientHeight - bh - pad);
            rectActionBtn.style.left = left + 'px'; rectActionBtn.style.top = top + 'px';
            if (rectProg) {
                rectProg.style.width = bw + 'px';
                const pbH = rectProg.offsetHeight || 26;
                rectProg.style.left = clamp(left, pad, canvas.clientWidth - bw - pad) + 'px';
                rectProg.style.top = clamp(top - pbH - 6, pad, canvas.clientHeight - pbH - pad) + 'px';
            }
        }
        if (rectCloseBtn) {
            rectCloseBtn.style.display = 'block'; rectCloseBtn.style.visibility = 'hidden';
            const cbw = rectCloseBtn.offsetWidth || 24, cbh = rectCloseBtn.offsetHeight || 24;
            rectCloseBtn.style.visibility = 'visible';
            const topRect = Math.min(a.sy, b.sy), rightRect = Math.max(a.sx, b.sx);
            const pad2 = 6;
            rectCloseBtn.style.left = clamp(rightRect - cbw * 0.5, pad2, canvas.clientWidth - cbw - pad2) + 'px';
            rectCloseBtn.style.top = clamp(topRect - cbh * 0.5, pad2, canvas.clientHeight - cbh - pad2) + 'px';
        }
    }

    function screenToWorld(sx: number, sy: number): { x: number; y: number } {
        return { x: (sx - VIEW.panX) / VIEW.scale, y: (sy - VIEW.panY) / VIEW.scale };
    }
    function worldToScreen(wx: number, wy: number): { sx: number; sy: number } {
        return { sx: wx * VIEW.scale + VIEW.panX, sy: wy * VIEW.scale + VIEW.panY };
    }
    function worldBounds(): { x0: number; y0: number; x1: number; y1: number } {
        const w = canvas.clientWidth, h = canvas.clientHeight;
        return { x0: (0 - VIEW.panX) / VIEW.scale, y0: (0 - VIEW.panY) / VIEW.scale, x1: (w - VIEW.panX) / VIEW.scale, y1: (h - VIEW.panY) / VIEW.scale };
    }

    function drawBackground(): void {
        if (bgMode === 'none') return;
        const dpr = window.devicePixelRatio || 1;
        ctx.setTransform(dpr * VIEW.scale, 0, 0, dpr * VIEW.scale, dpr * VIEW.panX, dpr * VIEW.panY);
        const step = Math.max(6, Number(bgStep) || 24), b = worldBounds();
        const col = rgbaFromAny(getAccentCssVar(), 0.65);
        ctx.save(); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1.0;
        ctx.strokeStyle = col; ctx.lineWidth = 1.125 / VIEW.scale;
        const xStart = Math.floor(b.x0 / step) * step, xEnd = Math.ceil(b.x1 / step) * step;
        const yStart = Math.floor(b.y0 / step) * step, yEnd = Math.ceil(b.y1 / step) * step;
        const maxLines = 4000; ctx.beginPath();
        if (bgMode === 'grid') {
            let count = 0;
            for (let x = xStart; x <= xEnd; x += step) { ctx.moveTo(x, b.y0); ctx.lineTo(x, b.y1); if (++count > maxLines) break; }
            for (let y = yStart; y <= yEnd; y += step) { ctx.moveTo(b.x0, y); ctx.lineTo(b.x1, y); if (++count > maxLines) break; }
        } else {
            let count = 0;
            for (let y = yStart; y <= yEnd; y += step) { ctx.moveTo(b.x0, y); ctx.lineTo(b.x1, y); if (++count > maxLines) break; }
        }
        ctx.stroke(); ctx.restore();
    }

    function setViewportTransformOn(ctx2: CanvasRenderingContext2D): void {
        const dpr = window.devicePixelRatio || 1;
        ctx2.setTransform(dpr * VIEW.scale, 0, 0, dpr * VIEW.scale, dpr * VIEW.panX, dpr * VIEW.panY);
    }
    function clearLayer(ctx2: CanvasRenderingContext2D): void {
        const dpr = window.devicePixelRatio || 1;
        ctx2.setTransform(dpr, 0, 0, dpr, 0, 0); ctx2.globalCompositeOperation = 'source-over';
        ctx2.globalAlpha = 1; ctx2.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
    }
    function applyPathStyleTo(ctx2: CanvasRenderingContext2D, it: any): void {
        if (it.tool === 'eraser') { ctx2.globalCompositeOperation = 'destination-out'; ctx2.globalAlpha = 1.0; ctx2.strokeStyle = 'rgba(0,0,0,1)'; ctx2.lineWidth = it.width; }
        else { ctx2.globalCompositeOperation = 'source-over'; ctx2.globalAlpha = it.alpha; ctx2.strokeStyle = it.color; ctx2.lineWidth = it.width; }
        ctx2.lineCap = 'round'; ctx2.lineJoin = 'round';
    }
    function rebuildHighlightLayer(): void {
        clearLayer(hctx); setViewportTransformOn(hctx);
        for (const it of ITEMS) {
            if (!it || it.kind !== 'rect') continue;
            const colBase = (it.colorKey === 'accent') ? getAccentCssVar() : (it.color || getAccentCssVar());
            const fillCol = rgbaFromAny(colBase, Math.max(0, Math.min(1, it.alpha)));
            const x0 = Math.min(it.x0, it.x1), y0 = Math.min(it.y0, it.y1), x1 = Math.max(it.x0, it.x1), y1 = Math.max(it.y0, it.y1);
            hctx.save(); hctx.globalCompositeOperation = 'source-over'; hctx.globalAlpha = 1.0;
            hctx.fillStyle = fillCol; hctx.fillRect(x0, y0, Math.max(0, x1 - x0), Math.max(0, y1 - y0)); hctx.restore();
        }
    }
    function rebuildStrokeLayer(): void {
        clearLayer(sctx); setViewportTransformOn(sctx);
        for (const it of ITEMS) {
            if (!it || it.kind !== 'path' || !it.points || it.points.length < 2) continue;
            applyPathStyleTo(sctx, it); sctx.beginPath(); sctx.moveTo(it.points[0].x, it.points[0].y);
            for (let i = 1; i < it.points.length; i++) sctx.lineTo(it.points[i].x, it.points[i].y);
            sctx.stroke();
        }
        if (currentPath && Array.isArray(currentPath.points)) {
            currentStrokeRenderedPointCount = currentPath.points.length;
        }
    }
    function clearMain(): void {
        const dpr = window.devicePixelRatio || 1;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
        ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
    }
    function present(): void {
        clearMain(); drawBackground();
        const dpr = window.devicePixelRatio || 1;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1.0;
        ctx.drawImage(hiLayer, 0, 0, hiLayer.width, hiLayer.height, 0, 0, canvas.clientWidth, canvas.clientHeight);
        if (currentRect) {
            const col = rgbaFromAny(getAccentCssVar(), RECT_ALPHA);
            const x0 = Math.min(currentRect.x0, currentRect.x1), y0 = Math.min(currentRect.y0, currentRect.y1);
            const x1 = Math.max(currentRect.x0, currentRect.x1), y1 = Math.max(currentRect.y0, currentRect.y1);
            const a = worldToScreen(x0, y0), b = worldToScreen(x1, y1);
            ctx.save(); ctx.fillStyle = col; ctx.globalAlpha = 1.0;
            ctx.fillRect(a.sx, a.sy, Math.max(0, b.sx - a.sx), Math.max(0, b.sy - a.sy)); ctx.restore();
        }
        ctx.drawImage(strokeLayer, 0, 0, strokeLayer.width, strokeLayer.height, 0, 0, canvas.clientWidth, canvas.clientHeight);
        scheduleRectActionUpdate();
    }

    function renderPendingStrokeSegments(): boolean {
        if (!currentPath || !Array.isArray(currentPath.points)) return false;
        const points = currentPath.points;
        const end = points.length;
        if (end <= Math.max(1, currentStrokeRenderedPointCount)) return false;
        const start = Math.max(0, currentStrokeRenderedPointCount - 1);
        const first = points[start];
        if (!first) return false;

        setViewportTransformOn(sctx);
        applyPathStyleTo(sctx, currentPath);
        sctx.beginPath();
        sctx.moveTo(first.x, first.y);
        for (let index = start + 1; index < end; index++) {
            const point = points[index];
            if (point) sctx.lineTo(point.x, point.y);
        }
        sctx.stroke();
        currentStrokeRenderedPointCount = end;
        return true;
    }

    function scheduleStrokePresent(): void {
        if (__strokePresentRAF) return;
        __strokePresentRAF = requestAnimationFrame(() => {
            __strokePresentRAF = 0;
            if (renderPendingStrokeSegments()) present();
        });
    }

    function flushStrokePresent(): void {
        if (__strokePresentRAF) {
            cancelAnimationFrame(__strokePresentRAF);
            __strokePresentRAF = 0;
        }
        if (renderPendingStrokeSegments()) present();
    }

    function updateUI(): void {
        const col = penBaseColor(), accent = getAccentCssVar();
        const labelPen = trCanvas('pen', 'Pen');
        const labelEraser = trCanvas('eraser', 'Eraser');
        if (btnUndo) { const label = trCanvas('undo', 'Undo'); btnUndo.disabled = (ITEMS.length === 0); btnUndo.title = label; btnUndo.setAttribute('aria-label', label); }
        if (btnRedo) { const label = trCanvas('redo', 'Redo'); btnRedo.disabled = (REDO.length === 0); btnRedo.title = label; btnRedo.setAttribute('aria-label', label); }
        if (btnColor) { btnColor.style.background = col; btnColor.dataset.active = (tool === 'pen') ? '1' : '0'; btnColor.title = labelPen; btnColor.setAttribute('aria-label', labelPen); }
        if (btnEraser) { btnEraser.dataset.active = (tool === 'eraser') ? '1' : '0'; btnEraser.title = labelEraser; btnEraser.setAttribute('aria-label', labelEraser); }
        if (btnRect) {
            const label = isCanvasPlus
                ? trOcr('plus.selectArea', 'Select render area')
                : trOcr('selectSubmit', 'Submit as Solution');
            btnRect.style.background = 'transparent';
            btnRect.dataset.active = (tool === 'rect') ? '1' : '0';
            btnRect.setAttribute('aria-pressed', tool === 'rect' ? 'true' : 'false');
            btnRect.title = label;
            btnRect.setAttribute('aria-label', label);
        }
        if (btnBg) {
            const labelBackground = trCanvas('background', 'Background');
            const gridCol = rgbaFromAny(accent, 0.65), s = 6, t = 1.8;
            btnBg.style.backgroundColor = 'transparent';
            btnBg.style.backgroundImage = `linear-gradient(to right, ${gridCol} ${t}px, transparent ${t}px), linear-gradient(to bottom, ${gridCol} ${t}px, transparent ${t}px)`;
            btnBg.style.backgroundSize = `${s}px ${s}px`; btnBg.style.backgroundPosition = 'center';
            btnBg.dataset.active = (menuMode === 'bg') ? '1' : '0'; btnBg.title = labelBackground; btnBg.setAttribute('aria-label', labelBackground);
        }
        if (plusSubmitBtn) {
            plusSubmitBtn.disabled = __ocrBusy || !__plusHasVisibleInkItems() ||
                __plusRasterIsEmpty() || __plusIsFrozenView();
        }
        if (plusEditBtn) {
            plusEditBtn.disabled = __ocrBusy ||
                !plusReview?.getSnapshot() ||
                Boolean(plusResult?.hidden) ||
                plusResult?.dataset.stale === '1' ||
                __plusRenderedRevision !== __plusInkRevision ||
                __plusIsFrozenView();
        }
        if (tool !== 'eraser') hideEraserRing();
    }

    function doUndo(): void {
        if (!ITEMS.length) return;
        const item = ITEMS.pop();
        REDO.push(item);
        rebuildHighlightLayer(); rebuildStrokeLayer(); present(); updateUI(); persist();
        if (item && (item.kind === 'path' || item.kind === 'rect')) {
            __plusInvalidateInk('undo');
            __plusScheduleBackground('undo');
        }
    }
    function doRedo(): void {
        if (!REDO.length) return;
        const item = REDO.pop();
        ITEMS.push(item);
        rebuildHighlightLayer(); rebuildStrokeLayer(); present(); updateUI(); persist();
        if (item && (item.kind === 'path' || item.kind === 'rect')) {
            __plusInvalidateInk('redo');
            __plusScheduleBackground('redo');
        }
    }
    function clearAllDrawing(): void {
        const hadInk = ITEMS.some(item => item && item.kind === 'path');
        const hadSelection = ITEMS.some(item => item && item.kind === 'rect');
        ITEMS.length = 0; REDO.length = 0;
        rebuildHighlightLayer(); rebuildStrokeLayer(); present(); updateUI(); persist();
        if (hadInk || hadSelection) {
            __plusInvalidateInk('clear');
            __plusScheduleBackground('clear');
        }
    }

    function startStrokeAtScreen(sx: number, sy: number): void {
        const w = screenToWorld(sx, sy);
        const it = { kind: 'path', tool, color: penBaseColor(), alpha: penAlpha, width: (tool === 'eraser') ? eraserWidth : penWidth, points: [{ x: w.x, y: w.y }] };
        ITEMS.push(it); currentPath = it; REDO.length = 0;
        currentStrokeRenderedPointCount = 1;
        __plusInvalidateInk('stroke-start');
        cancelCanvasFreezeNotify();
        updateUI();
    }

    function appendStrokePointWorld(wx: number, wy: number): void {
        if (!currentPath) return;
        currentPath.points.push({ x: wx, y: wy });
    }

    function appendStrokePointFromScreen(sx: number, sy: number): void {
        if (!currentPath) return;
        const pts = currentPath.points;
        const last = pts && pts.length ? pts[pts.length - 1] : null;
        if (!last) { const first = screenToWorld(sx, sy); appendStrokePointWorld(first.x, first.y); return; }
        const prev = worldToScreen(last.x, last.y);
        const dx = sx - prev.sx, dy = sy - prev.sy;
        const d = Math.hypot(dx, dy);
        if (d < STROKE_CAPTURE_MIN_STEP_PX) return;
        if (d > STROKE_CAPTURE_TARGET_STEP_PX) {
            const rawSteps = Math.floor(d / STROKE_CAPTURE_TARGET_STEP_PX);
            const steps = Math.min(STROKE_CAPTURE_MAX_INTERP_POINTS, Math.max(0, rawSteps));
            for (let i = 1; i <= steps; i++) {
                const t = i / (steps + 1);
                const mw = screenToWorld(prev.sx + dx * t, prev.sy + dy * t);
                appendStrokePointWorld(mw.x, mw.y);
            }
        }
        const w = screenToWorld(sx, sy);
        appendStrokePointWorld(w.x, w.y);
    }

    function extendStrokeToScreen(sx: number, sy: number): boolean {
        if (!currentPath) return false;
        const before = Array.isArray(currentPath.points) ? currentPath.points.length : 0;
        appendStrokePointFromScreen(sx, sy);
        return Array.isArray(currentPath.points) && currentPath.points.length > before;
    }
    function endStroke(): void {
        const finished = currentPath;
        flushStrokePresent();
        currentPath = null;
        currentStrokeRenderedPointCount = 0;
        if (finished && finished.kind === 'path' && Array.isArray(finished.points)) {
            if (finished.points.length > 1) __plusRasterInkState = 'unknown';
            __plusScheduleBackground(finished.points.length > 1 ? 'stroke-end' : 'stroke-tap');
        }
        if (finished) persist('stroke-end');
    }

    function startRectAtScreen(sx: number, sy: number): void { const w = screenToWorld(sx, sy); currentRect = { x0: w.x, y0: w.y, x1: w.x, y1: w.y }; }
    function updateRectToScreen(sx: number, sy: number): void { if (!currentRect) return; const w = screenToWorld(sx, sy); currentRect.x1 = w.x; currentRect.y1 = w.y; present(); }
    function finishRect(commit: boolean): void {
        if (!currentRect) return;
        let selectionChanged = false;
        if (commit) {
            const x0 = Math.min(currentRect.x0, currentRect.x1), y0 = Math.min(currentRect.y0, currentRect.y1);
            const x1 = Math.max(currentRect.x0, currentRect.x1), y1 = Math.max(currentRect.y0, currentRect.y1);
            const minSelectionWorld = isCanvasPlus
                ? 6 / Math.max(0.001, VIEW.scale)
                : 1e-3;
            if ((x1 - x0) >= minSelectionWorld && (y1 - y0) >= minSelectionWorld) {
                for (let i = ITEMS.length - 1; i >= 0; i--) if (ITEMS[i] && ITEMS[i].kind === 'rect') ITEMS.splice(i, 1);
                for (let i = REDO.length - 1; i >= 0; i--) if (REDO[i] && REDO[i].kind === 'rect') REDO.splice(i, 1);
                ITEMS.push({ kind: 'rect', x0, y0, x1, y1, alpha: RECT_ALPHA, colorKey: 'accent' }); REDO.length = 0;
                selectionChanged = true;
            }
        }
        currentRect = null; rebuildHighlightLayer(); present(); updateUI(); persist(); scheduleRectActionUpdate();
        if (selectionChanged) {
            __plusInvalidateInk('selection-change');
            __plusScheduleBackground('selection-change');
        }
    }

    function resizeToCss(): void {
        hideEraserRing();
        const dpr = window.devicePixelRatio || 1, cssW = canvas.clientWidth, cssH = canvas.clientHeight;
        const pxW = Math.max(1, Math.round(cssW * dpr)), pxH = Math.max(1, Math.round(cssH * dpr));
        if (canvas.width === pxW && canvas.height === pxH
            && hiLayer.width === pxW && hiLayer.height === pxH
            && strokeLayer.width === pxW && strokeLayer.height === pxH) return;
        canvas.width = pxW; canvas.height = pxH;
        hiLayer.width = pxW; hiLayer.height = pxH;
        strokeLayer.width = pxW; strokeLayer.height = pxH;
        rebuildHighlightLayer(); rebuildStrokeLayer(); present(); updateUI(); persist();
        __plusInvalidateView('resize');
        __plusScheduleBackground('resize');
    }

    updateUI(); resizeToCss();
    __liaRefreshOcrTexts();
    const ro = new ResizeObserver(() => resizeToCss()); ro.observe(canvas);

    function ensureCorners(): void {
        const ww = wrap!;
        if ((ww as any).__cornersReady) return; (ww as any).__cornersReady = true;
        const bl = document.createElement('button'); bl.type = 'button'; bl.className = 'lia-resize-corner'; bl.dataset.corner = 'bl'; bl.setAttribute('aria-label', trCanvas('resizeBottomLeft', 'Resize drawing area from the bottom left'));
        const br = document.createElement('button'); br.type = 'button'; br.className = 'lia-resize-corner'; br.dataset.corner = 'br'; br.setAttribute('aria-label', trCanvas('resizeBottomRight', 'Resize drawing area from the bottom right'));
        ww.appendChild(bl); ww.appendChild(br);
        const MIN_H = CANVAS_MIN_H, MAX_H = CANVAS_MAX_H, MIN_W = CANVAS_MIN_W;
        const clampLocal = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
        function containerMaxWidth(): number {
            const m = ww.closest('.lia-canvas-mount'); let host = (m || ww.parentElement || ww) as HTMLElement;
            let w = 0; try { w = host.getBoundingClientRect().width; } catch (_) { }
            if ((!w || w < MIN_W) && document.querySelector('main')) { try { w = (document.querySelector('main') as HTMLElement).getBoundingClientRect().width; } catch (_) { } }
            return Math.max(MIN_W, Math.floor(w || MIN_W));
        }
        function bindCorner(handle: HTMLElement, side: string): void {
            let resizing = false, startX = 0, startY = 0, startW = 0, startH = 0;
            function down(e: PointerEvent) { autoCloseSubmenus(); e.preventDefault(); e.stopPropagation(); resizing = true; startW = ww.getBoundingClientRect().width; startH = canvas.clientHeight || CANVAS_DEFAULT_H; startX = e.clientX; startY = e.clientY; try { handle.setPointerCapture(e.pointerId); } catch (_) { } }
            function move(e: PointerEvent) { if (!resizing) return; e.preventDefault(); const dx = e.clientX - startX, dy = e.clientY - startY; canvas.style.height = clampLocal(startH + dy, MIN_H, MAX_H) + 'px'; const maxW = containerMaxWidth(); ww.style.width = clampLocal(side === 'br' ? startW + dx : startW - dx, MIN_W, maxW) + 'px'; }
            function up(e: PointerEvent) { if (!resizing) return; resizing = false; try { handle.releasePointerCapture(e.pointerId); } catch (_) { } resizeToCss(); persist(); }
            handle.addEventListener('pointerdown', down); handle.addEventListener('pointermove', move);
            handle.addEventListener('pointerup', up); handle.addEventListener('pointercancel', up);
        }
        bindCorner(br, 'br'); bindCorner(bl, 'bl');
    }
    ensureCorners();

    const onTheme = () => { __liaRefreshAllTexPreviewBorders(document); updateUI(); rebuildHighlightLayer(); rebuildStrokeLayer(); present(); };
    document.addEventListener('lia-canvas-theme', onTheme);

    if (btnUndo && !(btnUndo as any).__bound) { (btnUndo as any).__bound = true; btnUndo.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); doUndo(); }); }
    if (btnRedo && !(btnRedo as any).__bound) { (btnRedo as any).__bound = true; btnRedo.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); doRedo(); }); }
    if (btnRect && !(btnRect as any).__bound) { (btnRect as any).__bound = true; btnRect.addEventListener('click', (e) => { e.stopPropagation(); tool = 'rect'; menuMode = 'rect'; setMenuOpen(false); updateUI(); }); }
    if (btnColor && menu) btnColor.addEventListener('click', (e) => { e.stopPropagation(); tool = 'pen'; menuMode = 'pen'; const open = menu.dataset.open === '1', same = (menu as any).__mode === 'pen'; if (!open || !same) buildPenMenu(); setMenuOpen(!open || !same); updateUI(); });
    if (btnEraser && menu) btnEraser.addEventListener('click', (e) => { e.stopPropagation(); tool = 'eraser'; menuMode = 'eraser'; const open = menu.dataset.open === '1', same = (menu as any).__mode === 'eraser'; if (!open || !same) buildEraserMenu(); setMenuOpen(!open || !same); updateUI(); });
    if (btnBg && menu) btnBg.addEventListener('click', (e) => { e.stopPropagation(); menuMode = 'bg'; const open = menu.dataset.open === '1', same = (menu as any).__mode === 'bg'; if (!open || !same) buildBgMenu(); setMenuOpen(!open || !same); updateUI(); });

    const onDocClick = (e: Event) => { if (!wrap.contains(e.target as Node)) setMenuOpen(false); };
    const onDocKeydown = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false); };
    document.addEventListener('click', onDocClick);
    document.addEventListener('keydown', onDocKeydown);

    let spaceDown = false;
    const onWinKeydown = (e: KeyboardEvent) => { if (e.code === 'Space') spaceDown = true; };
    const onWinKeyup = (e: KeyboardEvent) => { if (e.code === 'Space') spaceDown = false; };
    window.addEventListener('keydown', onWinKeydown);
    window.addEventListener('keyup', onWinKeyup);

    let cleanedUp = false;
    let teardownObs: MutationObserver | null = null;
    function cleanup(): void {
        if (cleanedUp) return;
        cleanedUp = true;
        ro.disconnect();
        if (__rectProgRAF) { cancelAnimationFrame(__rectProgRAF); __rectProgRAF = 0; }
        if (__rectBtnRAF) { cancelAnimationFrame(__rectBtnRAF); __rectBtnRAF = 0; }
        if (__strokePresentRAF) { cancelAnimationFrame(__strokePresentRAF); __strokePresentRAF = 0; }
        if (__rectProgHideTimer) { clearTimeout(__rectProgHideTimer); __rectProgHideTimer = 0; }
        if (__liaCanvasFreezeNotifyTimer) {
            clearTimeout(__liaCanvasFreezeNotifyTimer);
            __liaCanvasFreezeNotifyTimer = 0;
        }
        if (__plusBackgroundTimer) {
            clearTimeout(__plusBackgroundTimer);
            __plusBackgroundTimer = 0;
        }
        __plusGeneration++;
        __plusLineCache.clear();
        __plusLineInflight.clear();
        __plusCloseEditor(false);
        plusReview?.destroy();
        if (__plusFreezeObserver) __plusFreezeObserver.disconnect();
        for (const pointerId of canvasPenPointers) {
            penTouchGuard.activePenPointers.delete(pointerId);
        }
        canvasPenPointers.clear();
        pointers.clear();
        document.removeEventListener('lia:canvas-i18n-update', onI18nUpdate as EventListener);
        document.removeEventListener('lia-canvas-theme', onTheme);
        document.removeEventListener('visibilitychange', onPlusVisibilityChange);
        document.removeEventListener('click', onDocClick);
        document.removeEventListener('keydown', onDocKeydown);
        window.removeEventListener('keydown', onWinKeydown);
        window.removeEventListener('keyup', onWinKeyup);
        if (teardownObs) {
            teardownObs.disconnect();
            teardownObs = null;
        }
    }

    const teardownRoot = canvasPair?.parentElement || wrap.parentElement || document.body;
    teardownObs = new MutationObserver(() => {
        if (!wrap.isConnected) cleanup();
    });
    teardownObs.observe(teardownRoot, { childList: true });

    canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    function clampScale(s: number): number { return Math.max(VIEW.minScale, Math.min(VIEW.maxScale, s)); }
    function zoomAboutScreenPoint(factor: number, sx: number, sy: number): void {
        const oldS = VIEW.scale, newS = clampScale(oldS * factor);
        if (newS === oldS) return;
        const w = screenToWorld(sx, sy); VIEW.scale = newS; VIEW.panX = sx - w.x * newS; VIEW.panY = sy - w.y * newS;
        rebuildHighlightLayer(); rebuildStrokeLayer(); present(); persist();
        __plusInvalidateView('zoom');
        __plusScheduleBackground('zoom');
    }

    canvas.addEventListener('wheel', (e) => {
        autoCloseSubmenus(); e.preventDefault(); hideEraserRing();
        const r = canvas.getBoundingClientRect();
        zoomAboutScreenPoint(Math.exp(-e.deltaY * 0.0012), e.clientX - r.left, e.clientY - r.top);
    }, { passive: false });

    const pointers = new Map<number, { sx: number; sy: number }>();
    let mode = 'idle', lastPanSX = 0, lastPanSY = 0, pinchStart: any = null;

    function getScreenPos(evt: PointerEvent, rect = canvas.getBoundingClientRect()): { sx: number; sy: number } {
        return { sx: evt.clientX - rect.left, sy: evt.clientY - rect.top };
    }
    function dist(a: { sx: number; sy: number }, b: { sx: number; sy: number }): number { return Math.hypot(a.sx - b.sx, a.sy - b.sy); }
    function mid(a: { sx: number; sy: number }, b: { sx: number; sy: number }): { sx: number; sy: number } { return { sx: (a.sx + b.sx) / 2, sy: (a.sy + b.sy) / 2 }; }

    canvas.addEventListener('pointerdown', (e) => {
        if (String(e.pointerType || '').toLowerCase() === 'pen') {
            canvasPenPointers.add(e.pointerId);
            penTouchGuard.activePenPointers.add(e.pointerId);
        }
        if (String(e.pointerType || '').toLowerCase() === 'touch' && penTouchGuard.activePenPointers.size > 0) {
            if (e.cancelable) e.preventDefault();
            e.stopPropagation();
            return;
        }
        autoCloseSubmenus();
        if ((e.target as Element)?.classList?.contains('lia-resize-corner')) return;
        const p = getScreenPos(e); pointers.set(e.pointerId, p); canvas.setPointerCapture(e.pointerId);
        if (pointers.size === 2) {
            hideEraserRing(); if (mode === 'draw') endStroke(); if (mode === 'rect') finishRect(false);
            const arr = Array.from(pointers.values()); const m = mid(arr[0], arr[1]); const d = Math.max(1e-6, dist(arr[0], arr[1]));
            pinchStart = { dist: d, worldMid: screenToWorld(m.sx, m.sy), startScale: VIEW.scale }; mode = 'pinch'; return;
        }
        const isRightMouse = (e.pointerType === 'mouse' && e.button === 2), isMiddleMouse = (e.pointerType === 'mouse' && e.button === 1);
        const wantPan = isRightMouse || isMiddleMouse || (e.pointerType === 'mouse' && spaceDown);
        if (wantPan) { hideEraserRing(); mode = 'pan'; lastPanSX = p.sx; lastPanSY = p.sy; canvas.style.cursor = 'grab'; return; }
        if (tool === 'rect') { hideEraserRing(); mode = 'rect'; canvas.style.cursor = 'crosshair'; startRectAtScreen(p.sx, p.sy); present(); return; }
        mode = 'draw'; canvas.style.cursor = 'crosshair'; startStrokeAtScreen(p.sx, p.sy);
        if (tool === 'eraser') updateEraserRingFromScreen(p.sx, p.sy); else hideEraserRing();
    });

    canvas.addEventListener('pointermove', (e) => {
        if (String(e.pointerType || '').toLowerCase() === 'pen') {
            if ((e.pressure > 0) || (e.buttons !== 0)) {
                canvasPenPointers.add(e.pointerId);
                penTouchGuard.activePenPointers.add(e.pointerId);
            } else {
                canvasPenPointers.delete(e.pointerId);
                penTouchGuard.activePenPointers.delete(e.pointerId);
            }
        }
        if (String(e.pointerType || '').toLowerCase() === 'touch' && penTouchGuard.activePenPointers.size > 0) {
            if (pointers.has(e.pointerId)) pointers.delete(e.pointerId);
            if (e.cancelable) e.preventDefault();
            e.stopPropagation();
            return;
        }
        if (!pointers.has(e.pointerId)) return;
        const canvasRect = canvas.getBoundingClientRect();
        const p = getScreenPos(e, canvasRect); pointers.set(e.pointerId, p);
        if (tool === 'eraser' && mode !== 'pan' && mode !== 'pinch' && mode !== 'rect') updateEraserRingFromScreen(p.sx, p.sy); else hideEraserRing();
        if (mode === 'pinch' && pointers.size >= 2 && pinchStart) {
            const arr = Array.from(pointers.values()).slice(0, 2);
            const m = mid(arr[0], arr[1]); const d = Math.max(1e-6, dist(arr[0], arr[1]));
            const newScale = clampScale(pinchStart.startScale * (d / pinchStart.dist));
            VIEW.scale = newScale; VIEW.panX = m.sx - pinchStart.worldMid.x * newScale; VIEW.panY = m.sy - pinchStart.worldMid.y * newScale;
            rebuildHighlightLayer(); rebuildStrokeLayer(); present(); persist(); return;
        }
        if (mode === 'pan') { const dx = p.sx - lastPanSX, dy = p.sy - lastPanSY; lastPanSX = p.sx; lastPanSY = p.sy; VIEW.panX += dx; VIEW.panY += dy; rebuildHighlightLayer(); rebuildStrokeLayer(); present(); persist(); return; }
        if (mode === 'rect') { updateRectToScreen(p.sx, p.sy); return; }
        if (mode === 'draw') {
            let changed = false;
            if (typeof (e as any).getCoalescedEvents === 'function') {
                const coalesced: PointerEvent[] = (e as any).getCoalescedEvents();
                if (Array.isArray(coalesced) && coalesced.length) {
                    for (const ce of coalesced) {
                        if (!ce) continue;
                        const cp = getScreenPos(ce, canvasRect);
                        changed = extendStrokeToScreen(cp.sx, cp.sy) || changed;
                    }
                }
            }
            changed = extendStrokeToScreen(p.sx, p.sy) || changed;
            if (changed) scheduleStrokePresent();
        }
    });

    function stopPointer(e: PointerEvent): void {
        if (String(e.pointerType || '').toLowerCase() === 'pen') {
            canvasPenPointers.delete(e.pointerId);
            penTouchGuard.activePenPointers.delete(e.pointerId);
        }
        hideEraserRing(); if (pointers.has(e.pointerId)) pointers.delete(e.pointerId);
        try { canvas.releasePointerCapture(e.pointerId); } catch (_) { }
        if (mode === 'pinch') {
            if (pointers.size < 2) {
                pinchStart = null;
                mode = 'idle';
                __plusInvalidateView('pinch');
                __plusScheduleBackground('pinch');
            }
            return;
        }
        if (mode === 'pan') {
            mode = 'idle';
            canvas.style.cursor = 'crosshair';
            __plusInvalidateView('pan');
            __plusScheduleBackground('pan');
            return;
        }
        if (mode === 'rect') {
            if (pointers.size === 0) {
                finishRect(e.type === 'pointerup');
                mode = 'idle';
            }
            return;
        }
        if (mode === 'draw') {
            if (e.type === 'pointerup') {
                const finalPoint = getScreenPos(e);
                extendStrokeToScreen(finalPoint.sx, finalPoint.sy);
            }
            endStroke(); mode = 'idle'; updateUI(); return;
        }
    }
    canvas.addEventListener('pointerup', stopPointer);
    canvas.addEventListener('pointercancel', stopPointer);
    canvas.addEventListener('pointerleave', (e: PointerEvent) => {
        if (String(e.pointerType || '').toLowerCase() === 'pen') {
            canvasPenPointers.delete(e.pointerId);
            penTouchGuard.activePenPointers.delete(e.pointerId);
        }
        hideEraserRing();
        const endedStroke = mode === 'draw';
        const abandonedRect = mode === 'rect';
        if (endedStroke) endStroke();
        if (abandonedRect) finishRect(false);
        if (mode !== 'pinch') mode = 'idle';
        canvas.style.cursor = 'crosshair'; updateUI();
        if (!endedStroke) persist();
    });

    __liaCanvasFreezeNotifyArmed = true;
    if (isCanvasPlus && __plusHasVisibleInkItems()) {
        __plusScheduleBackground('restore');
    }
}

// ---------------------------------------------------------------------------
// initAll + export
// ---------------------------------------------------------------------------

export function initAll(): void {
    LIA.checkCalculationAnswerByUID = checkCalculationAnswerByUID;
    ensureNativeResolveHook();
    document.querySelectorAll<HTMLElement>(
        '.lia-canvas-pair[data-canvas-mode=plus]'
    ).forEach(normalizeCalculationPairOptions);
    document.querySelectorAll('.lia-draw-wrap canvas.lia-draw:not([data-ready])').forEach(c => {
        (c as HTMLCanvasElement).setAttribute('data-ready', '1');
        setupCanvas(c as HTMLCanvasElement);
    });
    __liaInitTexPreviews();
}
