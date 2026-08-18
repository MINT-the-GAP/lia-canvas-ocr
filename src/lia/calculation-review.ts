// Row-wise calculation rendering and conservative transition diagnostics.

import { __liaRenderTexPreview } from './input';
import {
    alignFirstTopLevelRelation,
    editableTextToLatex
} from '../ocr/layout';
import {
    validateEquationTransition,
    type TransitionCheck
} from '../math/equivalence';
import type { WrittenArithmeticKind } from '../math/written-arithmetic';

export type CalculationReviewSnapshot = {
    editableText: string;
    latex: string;
    lines: string[];
    revision: number;
};

export type CalculationReviewAnalysis = {
    revision: number;
    state: 'ready' | 'error';
    checks: TransitionCheck[];
};

export type CalculationReviewController = {
    render(editableText: string, revision: number): CalculationReviewSnapshot;
    markStale(): void;
    pause(): void;
    resume(): void;
    clear(): void;
    refreshLayout(): void;
    refreshTexts(): void;
    getSnapshot(): CalculationReviewSnapshot | null;
    destroy(): void;
};

export type CalculationReviewMode = 'equation-path' | WrittenArithmeticKind;

type ReviewOptions = {
    root: HTMLElement;
    target: HTMLElement;
    summary: HTMLElement;
    translate: (key: string, fallback: string) => string;
    mode?: CalculationReviewMode;
    composeLatex?: (lines: readonly string[]) => string;
    onAnalysis?: (analysis: CalculationReviewAnalysis) => void;
};

type TransitionDom = {
    container: HTMLElement;
    trigger: HTMLButtonElement;
    icon: HTMLElement;
    label: HTMLElement;
    detail: HTMLElement;
};

let reviewSequence = 0;

function isWrittenArithmeticReviewMode(
    mode: CalculationReviewMode | undefined
): mode is WrittenArithmeticKind {
    return mode === 'column-addition' ||
        mode === 'column-subtraction' ||
        mode === 'column-multiplication' ||
        mode === 'column-division';
}

function appendElement<K extends keyof HTMLElementTagNameMap>(
    parent: HTMLElement,
    tag: K,
    className: string,
    text?: string
): HTMLElementTagNameMap[K] {
    const element = document.createElement(tag);
    element.className = className;
    if (typeof text === 'string') element.textContent = text;
    parent.appendChild(element);
    return element;
}

function splitEditableLines(value: string): string[] {
    return String(value || '')
        .replace(/\r/g, '')
        .split('\n')
        .map(line => line.trim())
        .filter(Boolean);
}

function replaceTokens(template: string, values: Record<string, string | number>): string {
    let output = String(template || '');
    for (const [key, value] of Object.entries(values)) {
        output = output.replace(new RegExp('\\{' + key + '\\}', 'g'), String(value));
    }
    return output;
}

function fallbackForCheck(check: TransitionCheck): string {
    switch (check.reason) {
        case 'quadratic-root-solutions':
            return 'The plus-minus square-root notation contains both real solutions.';
        case 'cubic-root-solution':
            return 'The cube-root notation gives the unique real solution.';
        case 'quartic-root-solutions':
            return 'The plus-minus fourth-root notation contains both real solutions.';
        case 'missing-plus-minus':
            return 'The indexed square-root solution is missing the plus-minus sign.';
        case 'cas-unavailable':
            return 'The CAS is unavailable. Import LiaTemplates/Algebrite before Canvas OCR.';
        case 'domain-uncertain':
            return 'Without the equation domain, this transition cannot be checked safely.';
        case 'operation-applied-both-sides':
            return 'The stated transformation was applied to both sides.';
        case 'operation-missing-left':
            return 'The left side does not match the stated transformation.';
        case 'operation-missing-right':
            return 'The right side does not match the stated transformation.';
        case 'operation-mismatch-both':
            return 'Both sides do not match the stated transformation.';
        case 'equivalent-linear-equations':
            return 'The two equations are equivalent.';
        case 'different-linear-solutions':
            return 'The two equations have different solutions.';
        default:
            return 'This transition could not be checked reliably.';
    }
}

export function createCalculationReview(options: ReviewOptions): CalculationReviewController {
    const sequence = ++reviewSequence;
    let generation = 0;
    let validationTimer = 0;
    let destroyed = false;
    let stale = false;
    let paused = false;
    let analysisError = false;
    let current: CalculationReviewSnapshot | null = null;
    let currentChecks: TransitionCheck[] | null = null;
    let transitions: TransitionDom[] = [];
    let lineRows: HTMLElement[] = [];
    let stepsList: HTMLOListElement | null = null;
    let transitionLayoutFrame = 0;
    let transitionResizeObserver: ResizeObserver | null = null;

    const tr = options.translate;

    function transitionLabel(
        status: TransitionCheck['status'] | 'pending',
        from: number,
        to: number,
        isStale = false
    ): string {
        const positions = { from: from + 1, to: to + 1 };
        if (isStale) {
            return replaceTokens(
                tr(
                    'ocr.plus.validation.transitionStale',
                    'Transition from line {from} to line {to}: result is outdated.'
                ),
                positions
            );
        }
        if (status === 'valid') {
            return replaceTokens(
                tr(
                    'ocr.plus.validation.transitionValid',
                    'Transition from line {from} to line {to}: correct.'
                ),
                positions
            );
        }
        if (status === 'invalid') {
            return replaceTokens(
                tr(
                    'ocr.plus.validation.transitionInvalid',
                    'Transition from line {from} to line {to}: incorrect. Show explanation.'
                ),
                positions
            );
        }
        if (status === 'unknown') {
            return replaceTokens(
                tr(
                    'ocr.plus.validation.transitionUnknown',
                    'Transition from line {from} to line {to}: could not be checked reliably.'
                ),
                positions
            );
        }
        return replaceTokens(
            tr(
                'ocr.plus.validation.transitionPending',
                'Transition from line {from} to line {to}: checking.'
            ),
            positions
        );
    }

    function setSummary(checks: TransitionCheck[] | null, state: string): void {
        options.summary.dataset.state = state;
        if (state === 'stale') {
            options.summary.textContent = tr(
                'ocr.plus.validation.stale',
                'The calculation has changed; the previous check is outdated.'
            );
            return;
        }
        if (state === 'running') {
            options.summary.textContent = tr(
                'ocr.plus.validation.running',
                'Checking transitions...'
            );
            return;
        }
        if (state === 'error') {
            options.summary.textContent = tr(
                'ocr.plus.validation.error',
                'The transitions could not be checked.'
            );
            return;
        }
        if (!checks || checks.length === 0) {
            options.summary.textContent = tr(
                'ocr.plus.validation.noTransitions',
                'Add at least two equations to check a transition.'
            );
            return;
        }
        if (checks.some(check => check.reason === 'cas-unavailable')) {
            options.summary.textContent = tr(
                'ocr.plus.validation.casUnavailableSummary',
                'The CAS is unavailable. Import LiaTemplates/Algebrite before Canvas OCR; no transitions were checked.'
            );
            return;
        }
        const valid = checks.filter(check => check.status === 'valid').length;
        const invalid = checks.filter(check => check.status === 'invalid').length;
        const unknown = checks.length - valid - invalid;
        const summaryKey = checks.length === 1
            ? 'ocr.plus.validation.summaryOne'
            : 'ocr.plus.validation.summary';
        const summaryFallback = checks.length === 1
            ? '{count} transition: {valid} correct, {invalid} incorrect, {unknown} not checked.'
            : '{count} transitions: {valid} correct, {invalid} incorrect, {unknown} not checked.';
        options.summary.textContent = replaceTokens(
            tr(summaryKey, summaryFallback),
            { count: checks.length, valid, invalid, unknown }
        );
    }

    function renderEquationLine(parent: HTMLElement, line: string, index: number): void {
        const row = appendElement(parent, 'div', 'lia-canvasplus-line');
        row.dataset.lineIndex = String(index);
        row.dataset.rawLatex = line;
        const number = appendElement(
            row,
            'span',
            'lia-canvasplus-line-number',
            String(index + 1)
        );
        number.setAttribute('aria-hidden', 'true');

        const equation = appendElement(row, 'div', 'lia-canvasplus-line-equation');
        const aligned = alignFirstTopLevelRelation(line);
        const marker = aligned.indexOf('&');
        if (marker >= 0) {
            equation.dataset.hasRelation = '1';
            const left = appendElement(equation, 'span', 'lia-canvasplus-line-left');
            const right = appendElement(equation, 'span', 'lia-canvasplus-line-right');
            __liaRenderTexPreview(left, aligned.slice(0, marker));
            __liaRenderTexPreview(right, aligned.slice(marker + 1));
        } else {
            equation.dataset.hasRelation = '0';
            const whole = appendElement(equation, 'span', 'lia-canvasplus-line-whole');
            __liaRenderTexPreview(whole, line);
        }
        lineRows.push(row);
    }

    function collapseTransition(dom: TransitionDom): void {
        dom.container.dataset.expanded = '0';
        dom.trigger.setAttribute('aria-expanded', 'false');
        dom.detail.hidden = true;
    }

    function cancelTransitionLayout(): void {
        if (transitionLayoutFrame) {
            window.cancelAnimationFrame(transitionLayoutFrame);
            transitionLayoutFrame = 0;
        }
        transitionResizeObserver?.disconnect();
        transitionResizeObserver = null;
        stepsList = null;
    }

    function updateTransitionLayout(): void {
        const list = stepsList;
        if (!list?.isConnected) return;
        const listRect = list.getBoundingClientRect();
        if (listRect.width <= 0 || listRect.height <= 0) {
            delete list.dataset.layoutReady;
            return;
        }
        for (let index = 0; index < transitions.length; index++) {
            const from = lineRows[index];
            const to = lineRows[index + 1];
            const dom = transitions[index];
            if (!from || !to || !dom) continue;
            const fromRect = from.getBoundingClientRect();
            const toRect = to.getBoundingClientRect();
            const desiredCenterY = (
                fromRect.top + fromRect.bottom + toRect.top + toRect.bottom
            ) / 4;
            const initialY = Math.max(0, desiredCenterY - listRect.top);
            dom.container.style.setProperty(
                '--lia-canvasplus-transition-y',
                `${initialY}px`
            );

            // The visual coordinate space can differ slightly from the absolute
            // containing block (for example when LiaScript scales course content).
            // Calibrate against the connector's rendered centre instead of
            // encoding a browser- or host-specific offset.
            const containerRect = dom.container.getBoundingClientRect();
            const triggerRect = dom.trigger.getBoundingClientRect();
            const actualCenterY = (triggerRect.top + triggerRect.bottom) / 2;
            const layoutHeight = dom.container.offsetHeight;
            const visualScale = layoutHeight > 0
                ? containerRect.height / layoutHeight
                : 1;
            const correction = Number.isFinite(visualScale) && visualScale > 0
                ? (desiredCenterY - actualCenterY) / visualScale
                : desiredCenterY - actualCenterY;
            if (Math.abs(correction) > 0.1) {
                dom.container.style.setProperty(
                    '--lia-canvasplus-transition-y',
                    `${Math.max(0, initialY + correction)}px`
                );
            }
        }
        list.dataset.layoutReady = '1';
    }

    function scheduleTransitionLayout(): void {
        if (destroyed || transitionLayoutFrame) return;
        if (stepsList) delete stepsList.dataset.layoutReady;
        transitionLayoutFrame = window.requestAnimationFrame(() => {
            transitionLayoutFrame = 0;
            updateTransitionLayout();
        });
    }

    function installTransitionLayout(list: HTMLOListElement): void {
        cancelTransitionLayout();
        stepsList = list;
        if (typeof ResizeObserver === 'function') {
            transitionResizeObserver = new ResizeObserver(scheduleTransitionLayout);
            transitionResizeObserver.observe(list);
            for (const row of lineRows) transitionResizeObserver.observe(row);
        }
        scheduleTransitionLayout();
    }

    function createTransition(parent: HTMLElement, from: number, to: number): void {
        const container = appendElement(parent, 'div', 'lia-canvasplus-transition');
        container.dataset.fromIndex = String(from);
        container.dataset.toIndex = String(to);
        container.dataset.verdict = 'pending';
        container.dataset.expanded = '0';

        const arrow = appendElement(container, 'span', 'lia-canvasplus-transition-arrow');
        arrow.dataset.shape = 'curved-down';
        arrow.setAttribute('aria-hidden', 'true');
        const svgNs = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(svgNs, 'svg');
        svg.setAttribute('viewBox', '0 0 42 58');
        svg.setAttribute('focusable', 'false');
        const curve = document.createElementNS(svgNs, 'path');
        curve.setAttribute('d', 'M7 4 C29 17 29 34 14 50');
        const head = document.createElementNS(svgNs, 'path');
        head.setAttribute('d', 'M14 50 L15 39 M14 50 L24 45');
        svg.append(curve, head);
        arrow.appendChild(svg);

        const trigger = appendElement(
            container,
            'button',
            'lia-canvasplus-transition-trigger'
        );
        trigger.type = 'button';
        trigger.disabled = true;
        trigger.setAttribute('aria-expanded', 'false');
        const detailId = 'lia-canvasplus-transition-detail-' + sequence + '-' + from;
        trigger.setAttribute('aria-controls', detailId);
        trigger.setAttribute('aria-label', transitionLabel('pending', from, to));

        const icon = appendElement(trigger, 'span', 'lia-canvasplus-transition-icon', '…');
        icon.setAttribute('aria-hidden', 'true');
        const label = appendElement(
            trigger,
            'span',
            'lia-canvasplus-transition-label',
            tr('ocr.plus.validation.checking', 'Checking')
        );

        const detail = appendElement(container, 'div', 'lia-canvasplus-transition-detail');
        detail.id = detailId;
        detail.hidden = true;

        trigger.addEventListener('click', () => {
            if (trigger.disabled) return;
            const expanded = trigger.getAttribute('aria-expanded') === 'true';
            for (const dom of transitions) {
                if (dom.trigger !== trigger) collapseTransition(dom);
            }
            trigger.setAttribute('aria-expanded', expanded ? 'false' : 'true');
            container.dataset.expanded = expanded ? '0' : '1';
            detail.hidden = expanded;
        });
        transitions.push({ container, trigger, icon, label, detail });
    }

    function renderRows(lines: string[]): void {
        cancelTransitionLayout();
        options.target.replaceChildren();
        transitions = [];
        lineRows = [];
        if (isWrittenArithmeticReviewMode(options.mode)) {
            const calculation = appendElement(
                options.target,
                'div',
                'lia-canvasplus-column-calculation'
            );
            calculation.setAttribute(
                'aria-label',
                tr(
                    'ocr.plus.column.previewLabel',
                    'Recognized written calculation'
                )
            );
            const latex = options.composeLatex?.(lines) || '';
            if (latex) __liaRenderTexPreview(calculation, latex);
            return;
        }
        const list = appendElement(options.target, 'ol', 'lia-canvasplus-steps');
        list.dataset.layout = 'side-rail';
        list.setAttribute(
            'aria-label',
            tr('ocr.plus.validation.pathLabel', 'Checked calculation path')
        );
        for (let index = 0; index < lines.length; index++) {
            const step = appendElement(list, 'li', 'lia-canvasplus-step');
            step.dataset.lineIndex = String(index);
            renderEquationLine(step, lines[index], index);
            if (index + 1 < lines.length) createTransition(step, index, index + 1);
        }
        installTransitionLayout(list);
    }

    function applyChecks(checks: TransitionCheck[]): void {
        for (const row of lineRows) delete row.dataset.errorSide;
        for (let index = 0; index < transitions.length; index++) {
            const dom = transitions[index];
            const check = checks[index];
            if (!check) continue;
            const verdict = check.status === 'valid'
                ? 'correct'
                : check.status === 'invalid'
                    ? 'incorrect'
                    : 'unknown';
            dom.container.dataset.verdict = verdict;
            dom.container.dataset.code = check.reason;
            dom.trigger.disabled = false;
            dom.trigger.setAttribute(
                'aria-label',
                transitionLabel(check.status, check.fromIndex, check.toIndex)
            );
            dom.icon.textContent = check.status === 'valid'
                ? '✓'
                : check.status === 'invalid'
                    ? '×'
                    : '?';
            dom.label.textContent = check.status === 'valid'
                ? tr('ocr.plus.validation.correct', 'Correct')
                : check.status === 'invalid'
                    ? tr('ocr.plus.validation.incorrect', 'Incorrect')
                    : check.reason === 'cas-unavailable'
                        ? tr('ocr.plus.validation.casUnavailableLabel', 'CAS unavailable')
                        : tr('ocr.plus.validation.unknownLabel', 'Not checked');
            dom.detail.textContent = tr(check.messageKey, fallbackForCheck(check));
            collapseTransition(dom);
            if (check.status === 'invalid' && lineRows[check.toIndex]) {
                lineRows[check.toIndex].dataset.errorSide = check.side || 'whole';
            }
        }
    }

    function applyAnalysisError(): void {
        for (const row of lineRows) delete row.dataset.errorSide;
        for (let index = 0; index < transitions.length; index++) {
            const dom = transitions[index];
            dom.container.dataset.verdict = 'unknown';
            dom.container.dataset.code = 'analysis-error';
            dom.trigger.disabled = false;
            dom.trigger.setAttribute(
                'aria-label',
                transitionLabel('unknown', index, index + 1)
            );
            dom.icon.textContent = '?';
            dom.label.textContent = tr(
                'ocr.plus.validation.unknownLabel',
                'Not checked'
            );
            dom.detail.textContent = tr(
                'ocr.plus.validation.error',
                'The transitions could not be checked.'
            );
            collapseTransition(dom);
        }
    }

    function scheduleValidation(snapshot: CalculationReviewSnapshot): void {
        const requestGeneration = ++generation;
        if (validationTimer) window.clearTimeout(validationTimer);
        currentChecks = null;
        stale = false;
        paused = false;
        analysisError = false;
        if (isWrittenArithmeticReviewMode(options.mode)) {
            options.root.dataset.analysisState = 'ready';
            options.root.dataset.analysisRevision = String(snapshot.revision);
            options.summary.dataset.state = 'ready';
            options.summary.textContent = tr(
                'ocr.plus.column.recognized',
                'Written calculation recognized.'
            );
            currentChecks = [];
            validationTimer = window.setTimeout(() => {
                validationTimer = 0;
                if (destroyed || stale || requestGeneration !== generation) return;
                options.onAnalysis?.({
                    revision: snapshot.revision,
                    state: 'ready',
                    checks: []
                });
            }, 0);
            return;
        }
        options.root.dataset.analysisState = snapshot.lines.length > 1 ? 'running' : 'ready';
        options.root.dataset.analysisRevision = String(snapshot.revision);
        setSummary(null, snapshot.lines.length > 1 ? 'running' : 'ready');
        if (snapshot.lines.length < 2) {
            currentChecks = [];
            validationTimer = window.setTimeout(() => {
                validationTimer = 0;
                if (destroyed || stale || requestGeneration !== generation) return;
                options.onAnalysis?.({
                    revision: snapshot.revision,
                    state: 'ready',
                    checks: []
                });
            }, 0);
            return;
        }
        validationTimer = window.setTimeout(() => {
            validationTimer = 0;
            void (async () => {
                if (destroyed || stale || requestGeneration !== generation) return;
                try {
                    const checks: TransitionCheck[] = [];
                    for (let index = 0; index + 1 < snapshot.lines.length; index++) {
                        checks.push(validateEquationTransition(
                            snapshot.lines[index],
                            snapshot.lines[index + 1],
                            index
                        ));
                        if (index + 2 < snapshot.lines.length) {
                            await new Promise<void>(resolve => window.setTimeout(resolve, 0));
                        }
                        if (destroyed || stale || requestGeneration !== generation) return;
                    }
                    currentChecks = checks;
                    applyChecks(checks);
                    options.root.dataset.analysisState = 'ready';
                    setSummary(checks, 'ready');
                    options.onAnalysis?.({
                        revision: snapshot.revision,
                        state: 'ready',
                        checks
                    });
                } catch (error) {
                    if (destroyed || stale || requestGeneration !== generation) return;
                    console.warn('[lia-canvas-ocr] transition check failed', error);
                    currentChecks = null;
                    analysisError = true;
                    applyAnalysisError();
                    options.root.dataset.analysisState = 'error';
                    setSummary(null, 'error');
                    options.onAnalysis?.({
                        revision: snapshot.revision,
                        state: 'error',
                        checks: []
                    });
                }
            })();
        }, 0);
    }

    function render(editableText: string, revision: number): CalculationReviewSnapshot {
        const lines = splitEditableLines(editableText);
        const normalizedText = lines.join('\n');
        const snapshot: CalculationReviewSnapshot = {
            editableText: normalizedText,
            latex: options.composeLatex?.(lines) || editableTextToLatex(normalizedText),
            lines,
            revision
        };
        current = snapshot;
        stale = false;
        options.target.dataset.renderedTex = snapshot.latex;
        renderRows(lines);
        scheduleValidation(snapshot);
        return snapshot;
    }

    function markStale(): void {
        stale = true;
        paused = false;
        generation++;
        if (validationTimer) {
            window.clearTimeout(validationTimer);
            validationTimer = 0;
        }
        options.root.dataset.analysisState = 'stale';
        if (isWrittenArithmeticReviewMode(options.mode)) {
            options.summary.dataset.state = 'stale';
            options.summary.textContent = tr(
                'ocr.plus.validation.stale',
                'The calculation has changed; the previous check is outdated.'
            );
            return;
        }
        for (let index = 0; index < transitions.length; index++) {
            const dom = transitions[index];
            collapseTransition(dom);
            dom.container.dataset.stale = '1';
            dom.trigger.setAttribute('aria-label', transitionLabel(
                currentChecks?.[index]?.status || 'pending',
                index,
                index + 1,
                true
            ));
        }
        setSummary(currentChecks, 'stale');
    }

    function pause(): void {
        if (destroyed || !current || paused) return;
        if (!validationTimer && options.root.dataset.analysisState !== 'running') return;
        paused = true;
        generation++;
        if (validationTimer) {
            window.clearTimeout(validationTimer);
            validationTimer = 0;
        }
    }

    function resume(): void {
        if (destroyed || stale || !paused || !current) return;
        const snapshot = current;
        paused = false;
        scheduleValidation(snapshot);
    }

    function clear(): void {
        generation++;
        cancelTransitionLayout();
        if (validationTimer) {
            window.clearTimeout(validationTimer);
            validationTimer = 0;
        }
        current = null;
        currentChecks = null;
        analysisError = false;
        transitions = [];
        lineRows = [];
        stale = false;
        paused = false;
        options.target.replaceChildren();
        options.target.removeAttribute('data-rendered-tex');
        options.root.dataset.analysisState = 'idle';
        options.root.removeAttribute('data-analysis-revision');
        options.summary.textContent = '';
        options.summary.dataset.state = 'idle';
    }

    function refreshTexts(): void {
        if (isWrittenArithmeticReviewMode(options.mode)) {
            options.target.querySelector('.lia-canvasplus-column-calculation')
                ?.setAttribute(
                    'aria-label',
                    tr(
                        'ocr.plus.column.previewLabel',
                        'Recognized written calculation'
                    )
                );
            options.summary.dataset.state = stale ? 'stale' : current ? 'ready' : 'idle';
            options.summary.textContent = stale
                ? tr(
                    'ocr.plus.validation.stale',
                    'The calculation has changed; the previous check is outdated.'
                )
                : current
                    ? tr(
                        'ocr.plus.column.recognized',
                        'Written calculation recognized.'
                    )
                    : '';
            return;
        }
        options.target.querySelector('.lia-canvasplus-steps')?.setAttribute(
            'aria-label',
            tr('ocr.plus.validation.pathLabel', 'Checked calculation path')
        );
        if (stale) {
            if (currentChecks) applyChecks(currentChecks);
            for (let index = 0; index < transitions.length; index++) {
                const dom = transitions[index];
                dom.container.dataset.stale = '1';
                dom.trigger.setAttribute('aria-label', transitionLabel(
                    currentChecks?.[index]?.status || 'pending',
                    index,
                    index + 1,
                    true
                ));
            }
            setSummary(currentChecks, 'stale');
            return;
        }
        if (analysisError) {
            applyAnalysisError();
            setSummary(null, 'error');
            return;
        }
        if (currentChecks) {
            applyChecks(currentChecks);
            setSummary(currentChecks, 'ready');
        } else if (current) {
            for (let index = 0; index < transitions.length; index++) {
                const dom = transitions[index];
                dom.trigger.setAttribute(
                    'aria-label',
                    transitionLabel('pending', index, index + 1)
                );
                dom.label.textContent = tr(
                    'ocr.plus.validation.checking',
                    'Checking'
                );
            }
            setSummary(null, current.lines.length > 1 ? 'running' : 'ready');
        }
    }

    function destroy(): void {
        destroyed = true;
        clear();
    }

    return {
        render,
        markStale,
        pause,
        resume,
        clear,
        refreshLayout: scheduleTransitionLayout,
        refreshTexts,
        getSnapshot: () => current,
        destroy
    };
}
