export type OcrBenchmarkRun = {
    caseId: string;
    expectedLatex: string;
    text: string;
    wallMs: number;
    inferenceMs?: number;
    tokenCount?: number;
};

type TimingStats = { count: number; invalidCount: number; missingCount: number; median: number | null; p95: number | null };
type TokenStats = { count: number; invalidCount: number; missingCount: number; min: number | null; median: number | null; max: number | null };

function median(sorted: readonly number[]): number | null {
    if (!sorted.length) return null;
    const middle = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[middle] : sorted[middle - 1] + (sorted[middle] - sorted[middle - 1]) / 2;
}
const validTime = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value >= 0;
const validTokens = (value: unknown): value is number => validTime(value) && Number.isInteger(value);
function timing(runs: readonly OcrBenchmarkRun[], field: 'wallMs' | 'inferenceMs'): TimingStats {
    const values = runs.map(run => run[field]).filter(validTime).sort((a, b) => a - b);
    const missingCount = field === 'inferenceMs' ? runs.filter(run => run[field] === undefined).length : 0;
    return {
        count: values.length, invalidCount: runs.length - values.length - missingCount, missingCount,
        median: median(values),
        // Nearest-rank percentile; small samples intentionally keep their maximum.
        p95: values.length ? values[Math.ceil(values.length * 0.95) - 1] : null,
    };
}
function tokens(runs: readonly OcrBenchmarkRun[]): TokenStats {
    const values = runs.map(run => run.tokenCount).filter(validTokens).sort((a, b) => a - b);
    const missingCount = runs.filter(run => run.tokenCount === undefined).length;
    return {
        count: values.length, invalidCount: runs.length - values.length - missingCount, missingCount,
        min: values[0] ?? null, median: median(values), max: values.at(-1) ?? null,
    };
}
function group(runs: readonly OcrBenchmarkRun[]): Map<string, OcrBenchmarkRun[]> {
    const result = new Map<string, OcrBenchmarkRun[]>();
    for (const run of runs) {
        const entries = result.get(run.caseId) || [];
        entries.push(run);
        result.set(run.caseId, entries);
    }
    return result;
}
const invalidTiming = (runs: readonly OcrBenchmarkRun[]) => runs.some(run =>
    !validTime(run.wallMs) || (run.inferenceMs !== undefined && !validTime(run.inferenceMs))
);

/**
 * Descriptive statistics for observed runs, without TeX normalization or mathematical
 * equivalence. Rates are fractions in [0, 1], not confidence estimates.
 * baselineAgreement compares every within-case candidate/reference output pair.
 * qualitySafeSpeedup means identical observed raw outputs to a stable reference;
 * it does not establish correct mathematics or general handwriting accuracy.
 */
export function summarizeOcrBenchmark(runs: readonly OcrBenchmarkRun[], reference?: readonly OcrBenchmarkRun[]) {
    const grouped = group(runs);
    const baseline = reference === undefined ? null : group(reference);
    const cases = [...grouped].map(([caseId, entries]) => {
        const textVariants = new Set(entries.map(run => run.text)).size;
        const errorTypes: string[] = [];
        if (entries.some(run => run.text.trim() === '')) errorTypes.push('empty-output');
        if (entries.some(run => run.text !== run.expectedLatex)) errorTypes.push('raw-text-mismatch');
        if (textVariants > 1) errorTypes.push('non-deterministic-output');
        if (new Set(entries.map(run => run.expectedLatex)).size > 1) errorTypes.push('conflicting-expected-text');
        if (entries.some(run => !validTime(run.wallMs))) errorTypes.push('invalid-wall-time');
        if (entries.some(run => run.inferenceMs !== undefined && !validTime(run.inferenceMs))) errorTypes.push('invalid-inference-time');
        if (entries.some(run => run.tokenCount !== undefined && !validTokens(run.tokenCount))) errorTypes.push('invalid-token-count');
        return {
            caseId, runCount: entries.length,
            exactMatches: entries.filter(run => run.text === run.expectedLatex).length,
            textVariants, errorTypes,
            wallMs: timing(entries, 'wallMs'), inferenceMs: timing(entries, 'inferenceMs'), tokenCount: tokens(entries),
        };
    });
    const missingCaseIds = baseline ? [...baseline.keys()].filter(id => !grouped.has(id)) : [];
    const extraCaseIds = baseline ? [...grouped.keys()].filter(id => !baseline.has(id)) : [];
    const matched = baseline ? [...baseline.keys()].filter(id => grouped.has(id)) : [];
    const repetitionMismatchCaseIds = matched.filter(id => grouped.get(id)!.length !== baseline!.get(id)!.length);
    const expectedMismatchCaseIds = matched.filter(id => new Set([
        ...grouped.get(id)!.map(run => run.expectedLatex),
        ...baseline!.get(id)!.map(run => run.expectedLatex),
    ]).size !== 1);
    const invalidTimingCaseIds = [...new Set([
        ...[...grouped].filter(([, entries]) => invalidTiming(entries)).map(([id]) => id),
        ...[...(baseline || [])].filter(([, entries]) => invalidTiming(entries)).map(([id]) => id),
    ])];
    const completeCaseCount = matched.filter(id =>
        !repetitionMismatchCaseIds.includes(id) && !expectedMismatchCaseIds.includes(id) && !invalidTimingCaseIds.includes(id)
    ).length;
    const complete = baseline === null ? null : baseline.size > 0 &&
        missingCaseIds.length === 0 && extraCaseIds.length === 0 &&
        repetitionMismatchCaseIds.length === 0 && expectedMismatchCaseIds.length === 0 &&
        invalidTimingCaseIds.length === 0;
    let baselineAgreement: { matches: number; comparisons: number; rate: number | null; unstableCaseIds: string[] } | null = null;
    if (baseline) {
        let matches = 0, comparisons = 0;
        for (const id of matched) {
            for (const run of grouped.get(id)!) {
                for (const other of baseline.get(id)!) {
                    comparisons++;
                    if (run.text === other.text) matches++;
                }
            }
        }
        baselineAgreement = {
            matches, comparisons, rate: comparisons ? matches / comparisons : null,
            unstableCaseIds: [...baseline].filter(([, entries]) => new Set(entries.map(run => run.text)).size > 1).map(([id]) => id),
        };
    }
    let speedupRatio: number | null = null;
    if (complete && baselineAgreement?.unstableCaseIds.length === 0) {
        const candidateMs = matched.reduce((sum, id) => sum + timing(grouped.get(id)!, 'wallMs').median!, 0);
        const referenceMs = matched.reduce((sum, id) => sum + timing(baseline!.get(id)!, 'wallMs').median!, 0);
        // Compare the same cases with equal weight, not pooled runtimes or token counts.
        if (candidateMs > 0 && referenceMs > 0 && Number.isFinite(candidateMs) && Number.isFinite(referenceMs)) {
            const ratio = referenceMs / candidateMs;
            if (Number.isFinite(ratio)) speedupRatio = ratio;
        }
    }
    const exactMatches = runs.filter(run => run.text === run.expectedLatex).length;
    return {
        runCount: runs.length, caseCount: grouped.size,
        wallMs: timing(runs, 'wallMs'), inferenceMs: timing(runs, 'inferenceMs'), tokenCount: tokens(runs),
        exact: { matches: exactMatches, total: runs.length, rate: runs.length ? exactMatches / runs.length : null },
        cases,
        coverage: {
            referenceCaseCount: baseline?.size ?? null, matchedCaseCount: matched.length, completeCaseCount,
            missingCaseIds, extraCaseIds, repetitionMismatchCaseIds, expectedMismatchCaseIds, invalidTimingCaseIds, complete,
        },
        baselineAgreement, speedupRatio,
        qualitySafeSpeedup: speedupRatio !== null && baselineAgreement?.rate === 1 && cases.every(entry => entry.textVariants === 1),
    };
}
