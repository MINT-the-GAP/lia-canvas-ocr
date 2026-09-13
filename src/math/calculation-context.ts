import type { TransitionValidationOptions } from './equivalence.ts';
import type { FunctionInterval } from './function-proof-types.ts';

/** Public authored names, shared by the parser, task dispatch and documentation. */
export const CALCULATION_TASK_NAMES = {
    equation: 'gleichung',
    zeros: 'nullstellen',
    simplify: 'vereinfachen',
    domain: 'definitionsbereich',
    range: 'wertebereich',
    symmetry: 'symmetrie',
    periodicity: 'periodizitaet',
    intercepts: 'achsenschnittpunkte',
    intersections: 'schnittpunkte',
    limit: 'grenzwert',
    discontinuities: 'definitionsluecken',
    asymptotes: 'asymptoten',
    derivative: 'ableitung',
    'derivative-value': 'ableitungswert',
    monotonicity: 'monotonie',
    curvature: 'kruemmung',
    extrema: 'extremstellen',
    'extrema-points': 'extrempunkte',
    inflections: 'wendestellen',
    'inflection-points': 'wendepunkte',
    tangent: 'tangente',
    normal: 'normale',
    antiderivative: 'stammfunktion',
    integral: 'integral',
    area: 'flaecheninhalt',
    curve: 'kurvendiskussion',
} as const;

export type CalculationTask = keyof typeof CALCULATION_TASK_NAMES;

export const CURVE_TASK_PARTS: readonly CalculationTask[] = Object.freeze([
    'domain', 'range', 'symmetry', 'periodicity', 'zeros', 'intercepts',
    'monotonicity', 'curvature', 'extrema', 'extrema-points', 'inflections',
    'inflection-points', 'discontinuities', 'asymptotes',
]);

export const DEFAULT_CURVE_TASK_PARTS: readonly CalculationTask[] = Object.freeze([
    'domain', 'zeros', 'extrema-points', 'inflection-points', 'monotonicity', 'curvature',
]);

export function parseCalculationTask(value: string): CalculationTask | null {
    const normalized = value.trim().normalize('NFKC').toLocaleLowerCase('de-DE')
        .replace(/ä/gu, 'ae').replace(/ö/gu, 'oe').replace(/ü/gu, 'ue');
    if (normalized === 'steigung') return 'derivative-value';
    for (const [task, authored] of Object.entries(CALCULATION_TASK_NAMES)) {
        if (normalized === task || normalized === authored) return task as CalculationTask;
    }
    return null;
}

export type CalculationContext = {
    task?: CalculationTask;
    angleUnit?: 'rad' | 'deg';
    interval?: FunctionInterval;
    point?: string;
    order?: number;
    lower?: string;
    upper?: string;
    secondFunction?: string;
    side?: 'left' | 'right' | 'both';
    scope?: 'local' | 'global';
    family?: boolean;
    parts?: CalculationTask[];
};

const CONTEXT_FIELDS = new Set([
    'task', 'angleUnit', 'interval', 'point', 'order', 'lower', 'upper',
    'secondFunction', 'side', 'scope', 'family', 'parts',
]);
const INTERVAL_FIELDS = new Set(['lower', 'upper', 'lowerClosed', 'upperClosed']);

/** Lexical guard only; the exact mathematical parsers establish meaning later. */
function isSafeExpression(value: unknown, maxLength = 64, definition = false): value is string {
    if (typeof value !== 'string' || !value.trim() || value.length > maxLength ||
        !/^[0-9A-Za-z\\\s{}()[\]+*/^._\-°π∞=]+$/u.test(value)) return false;
    if (!value.includes('=')) return true;
    if (!definition) return false;
    const functionDefinition = /^\s*[A-Za-z]\s*\(\s*[A-Za-z]\s*\)\s*=\s*([^=]+)$/u.exec(value);
    return !!functionDefinition?.[1].trim();
}

function validInterval(interval: unknown): interval is FunctionInterval {
    if (!interval || typeof interval !== 'object' || Array.isArray(interval)) return false;
    if (Reflect.ownKeys(interval).some(key => typeof key !== 'string' || !INTERVAL_FIELDS.has(key))) return false;
    const candidate = interval as FunctionInterval;
    return isSafeExpression(candidate.lower) && isSafeExpression(candidate.upper) &&
        typeof candidate.lowerClosed === 'boolean' && typeof candidate.upperClosed === 'boolean';
}

/** JavaScript callers get the same fail-closed contract as authored options. */
export function calculationContextError(context?: CalculationContext): string | null {
    if (context === undefined) return null;
    if (!context || typeof context !== 'object' || Array.isArray(context)) {
        return 'Die Aufgabenvorgaben müssen ein gültiges Konfigurationsobjekt sein.';
    }
    if (Reflect.ownKeys(context).some(key => typeof key !== 'string' || !CONTEXT_FIELDS.has(key))) {
        return 'Die Aufgabenvorgaben enthalten eine unbekannte Option.';
    }
    if (context.task !== undefined &&
        (typeof context.task !== 'string' || !Object.prototype.hasOwnProperty.call(CALCULATION_TASK_NAMES, context.task))) {
        return 'Der angegebene Aufgabentyp ist unbekannt.';
    }
    if (context.angleUnit !== undefined && context.angleUnit !== 'rad' && context.angleUnit !== 'deg') {
        return 'Das Winkelmaß muss rad oder deg sein.';
    }
    if (context.interval !== undefined && !validInterval(context.interval)) {
        return 'Das Untersuchungsintervall ist ungültig; verwende beispielsweise intervall=[-2,2].';
    }
    const task = context.task ?? 'equation';
    const title = CALCULATION_TASK_NAMES[task];
    const applicable: [keyof CalculationContext, string, readonly CalculationTask[]][] = [
        ['point', 'stelle', ['tangent', 'normal', 'derivative-value', 'limit']],
        ['order', 'ordnung', ['derivative', 'derivative-value']],
        ['lower', 'von', ['integral', 'area']],
        ['upper', 'bis', ['integral', 'area']],
        ['secondFunction', 'zweitefunktion', ['intersections', 'area']],
        ['side', 'seite', ['limit']],
        ['scope', 'art', ['extrema', 'extrema-points', 'curve']],
        ['family', 'familie', ['antiderivative']],
        ['parts', 'teile', ['curve']],
    ];
    for (const [field, authored, tasks] of applicable) {
        if (context[field] !== undefined && !tasks.includes(task)) {
            return 'Die Option ' + authored + ' passt nicht zur Aufgabe ' + title + '.';
        }
    }
    if (['tangent', 'normal', 'derivative-value', 'limit'].includes(task) && context.point === undefined) {
        return 'Für ' + title + ' fehlt die Vorgabe stelle, beispielsweise stelle=2.';
    }
    if (context.point !== undefined && !isSafeExpression(context.point)) {
        return 'Die Stelle muss ein mathematischer Ausdruck mit höchstens 64 Zeichen sein.';
    }
    if (context.point !== undefined && task !== 'limit' && /(?:\b(?:inf|infty|infinity)\b|∞)/iu.test(context.point)) {
        return 'Für ' + title + ' muss die Stelle endlich sein.';
    }
    if (context.order !== undefined &&
        (!Number.isInteger(context.order) || context.order < 1 || context.order > 4)) {
        return 'Die Ableitungsordnung muss eine ganze Zahl von 1 bis 4 sein.';
    }
    if (task === 'integral' || task === 'area') {
        if (context.lower === undefined || context.upper === undefined) {
            return 'Für ' + title + ' sind beide Grenzen erforderlich: von=...;bis=....';
        }
    }
    if (context.lower !== undefined && !isSafeExpression(context.lower) ||
        context.upper !== undefined && !isSafeExpression(context.upper)) {
        return 'Die Grenzen müssen mathematische Ausdrücke mit jeweils höchstens 64 Zeichen sein.';
    }
    if (task === 'intersections' && context.secondFunction === undefined) {
        return 'Für Schnittpunkte fehlt zweitefunktion, beispielsweise zweitefunktion=g(x)=x+1.';
    }
    if (context.secondFunction !== undefined && !isSafeExpression(context.secondFunction, 512, true)) {
        return 'Die zweite Funktion muss ein Term oder eine Funktionsdefinition mit höchstens 512 Zeichen sein.';
    }
    if (context.side !== undefined && !['left', 'right', 'both'].includes(context.side)) {
        return 'Die Grenzwertseite muss links, rechts oder beide sein.';
    }
    if (context.scope !== undefined && context.scope !== 'local' && context.scope !== 'global') {
        return 'Die Extremumart muss lokal oder global sein.';
    }
    if (context.scope === 'global' && context.interval === undefined) {
        return 'Für globale Extrema ist ein Untersuchungsintervall erforderlich.';
    }
    if (context.family !== undefined && typeof context.family !== 'boolean') {
        return 'familie muss mit 0 oder 1 angegeben werden.';
    }
    if (context.parts !== undefined) {
        if (!Array.isArray(context.parts) || context.parts.length === 0 ||
            context.parts.length > CURVE_TASK_PARTS.length ||
            [...context.parts].some(part => !CURVE_TASK_PARTS.includes(part)) ||
            new Set(context.parts).size !== context.parts.length) {
            return 'teile muss verschiedene unterstützte Teilaufgaben der Kurvendiskussion enthalten.';
        }
        if (context.scope !== undefined &&
            !context.parts.some(part => part === 'extrema' || part === 'extrema-points')) {
            return 'Die Option art benötigt extremstellen oder extrempunkte unter teile.';
        }
    }
    return null;
}

export function isCalculationContextValid(context?: CalculationContext): boolean {
    return calculationContextError(context) === null;
}

/** Bounds are parsed as expressions by the exact function checker before use. */
export function parseFunctionInterval(source: string): FunctionInterval | null {
    const value = source.trim();
    if (value.length > 160) return null;
    const match = /^([\[(])\s*(.+?)\s*,\s*(.+?)\s*([\])])$/u.exec(value);
    if (!match || match[2].length > 64 || match[3].length > 64) return null;
    return isSafeExpression(match[2]) && isSafeExpression(match[3]) ? {
        lower: match[2], upper: match[3], lowerClosed: match[1] === '[', upperClosed: match[4] === ']'
    } : null;
}

export function prepareCalculationTask(prompt: string, context?: CalculationContext): string | null {
    if (!isCalculationContextValid(context)) return null;
    if (context?.task !== 'zeros') return prompt;
    const match = /^\s*([A-Za-z])\s*\(\s*([A-Za-z])\s*\)\s*=\s*(.+)\s*$/u.exec(prompt);
    if (!match || match[1] === match[2]) return null;
    return match[3].trim() + '=0';
}

export function usesFunctionCalculation(prompt: string, options: TransitionValidationOptions = {}): boolean {
    return !!options.calculationContext?.interval || !!options.calculationContext?.angleUnit ||
        /\\?(?:sin|cos|tan|cot|arcsin|arccos|arctan|ln|lg|log|exp)(?=\b|_)/u.test(prompt) ||
        /(?:\be|\b\d+(?:\.\d+)?)\s*\^\s*(?:\{|\()?[^=]*[A-Za-z]/u.test(prompt);
}
