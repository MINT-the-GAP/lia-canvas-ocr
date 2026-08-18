// Versioned, data-only Freeze projection of a rendered calculation review.

export const CALCULATION_REVIEW_FREEZE_VERSION = 'cr1' as const;
export const MAX_CALCULATION_REVIEW_FREEZE_LINES = 32;
export const MAX_CALCULATION_REVIEW_FREEZE_CHARACTERS = 16_384;

export type CalculationReviewFreezeStatus = 'running' | 'ready' | 'error';
export type CalculationReviewFreezeCheckStatus = 'valid' | 'invalid' | 'unknown';
export type CalculationReviewFreezeSide = 'left' | 'right' | 'both';

export type CalculationReviewFreezeCheck = {
    status: CalculationReviewFreezeCheckStatus;
    reason: string;
    side?: CalculationReviewFreezeSide;
};

export type CalculationReviewFreezeState = {
    v: typeof CALCULATION_REVIEW_FREEZE_VERSION;
    lines: string[];
    state: CalculationReviewFreezeStatus;
    checks: CalculationReviewFreezeCheck[];
    stale?: 1;
};

const CHECK_STATUSES = new Set<CalculationReviewFreezeCheckStatus>([
    'valid',
    'invalid',
    'unknown'
]);

const REVIEW_STATES = new Set<CalculationReviewFreezeStatus>([
    'running',
    'ready',
    'error'
]);

const CHECK_SIDES = new Set<CalculationReviewFreezeSide>([
    'left',
    'right',
    'both'
]);

// Keep this whitelist synchronized with TransitionReason in math/equivalence.ts.
const CHECK_REASONS = new Set([
    'operation-applied-both-sides',
    'operation-missing-left',
    'operation-missing-right',
    'operation-mismatch-both',
    'equivalent-linear-equations',
    'quadratic-root-solutions',
    'quartic-root-solutions',
    'cubic-root-solution',
    'missing-plus-minus',
    'different-linear-solutions',
    'domain-uncertain',
    'cas-unavailable',
    'unsupported-or-unproven'
]);

function isRecord(value: unknown): value is Record<string, unknown> {
    return !!value && typeof value === 'object' && !Array.isArray(value);
}

function sanitizeLines(value: unknown): string[] | null {
    if (!Array.isArray(value) || value.length < 1 ||
        value.length > MAX_CALCULATION_REVIEW_FREEZE_LINES) return null;

    const lines: string[] = [];
    for (const line of value) {
        if (typeof line !== 'string') return null;
        const normalized = line.replace(/\r/g, '').trim();
        if (!normalized || normalized.includes('\n')) return null;
        lines.push(normalized);
    }

    // Match the existing native calculation-answer transport limit. Measuring
    // the serialized array also accounts for quotes, separators, and escaping.
    if (JSON.stringify(lines).length > MAX_CALCULATION_REVIEW_FREEZE_CHARACTERS) {
        return null;
    }
    return lines;
}

function sanitizeCheck(value: unknown): CalculationReviewFreezeCheck | null {
    if (!isRecord(value) ||
        typeof value.status !== 'string' ||
        !CHECK_STATUSES.has(value.status as CalculationReviewFreezeCheckStatus) ||
        typeof value.reason !== 'string' ||
        !CHECK_REASONS.has(value.reason)) return null;

    if (value.side !== undefined && (
        typeof value.side !== 'string' ||
        !CHECK_SIDES.has(value.side as CalculationReviewFreezeSide)
    )) return null;

    const check: CalculationReviewFreezeCheck = {
        status: value.status as CalculationReviewFreezeCheckStatus,
        reason: value.reason
    };
    if (value.side !== undefined) {
        check.side = value.side as CalculationReviewFreezeSide;
    }
    return check;
}

/**
 * Validate untrusted state from a shared Freeze link and return a detached,
 * canonical data object. Translated prose and HTML are deliberately excluded.
 */
export function sanitizeCalculationReviewFreezeState(
    value: unknown
): CalculationReviewFreezeState | null {
    if (!isRecord(value) || value.v !== CALCULATION_REVIEW_FREEZE_VERSION ||
        typeof value.state !== 'string' ||
        !REVIEW_STATES.has(value.state as CalculationReviewFreezeStatus) ||
        !Array.isArray(value.checks) ||
        (value.stale !== undefined && value.stale !== 1)) return null;

    const lines = sanitizeLines(value.lines);
    if (!lines) return null;

    const state = value.state as CalculationReviewFreezeStatus;
    const expectedChecks = state === 'ready' ? lines.length - 1 : 0;
    if (value.checks.length !== expectedChecks) return null;

    const checks: CalculationReviewFreezeCheck[] = [];
    for (const rawCheck of value.checks) {
        const check = sanitizeCheck(rawCheck);
        if (!check) return null;
        checks.push(check);
    }

    return {
        v: CALCULATION_REVIEW_FREEZE_VERSION,
        lines,
        state,
        checks,
        ...(value.stale === 1 ? { stale: 1 as const } : {})
    };
}
