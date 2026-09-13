import {
    calculationContextError,
    parseCalculationTask,
    parseFunctionInterval,
    type CalculationContext,
    type CalculationTask,
} from '../math/calculation-context.ts';
import type { TransitionValidationOptions } from '../math/equivalence.ts';
// Pure parser for the optional @BerechneOCR(...) macro configuration.

export type CalculationOptionsError =
    | 'empty-option'
    | 'malformed-option'
    | 'unknown-option'
    | 'duplicate-option'
    | 'invalid-boolean'
    | 'invalid-context';

export type CalculationOptions = Readonly<{
    lineFeedback: boolean;
    valid: boolean;
    error?: CalculationOptionsError;
    message?: string;
    calculationContext?: CalculationContext;
}>;

const DEFAULT_OPTIONS: CalculationOptions = Object.freeze({
    lineFeedback: true,
    valid: true
});

function invalid(error: CalculationOptionsError, message?: string): CalculationOptions {
    return {
        lineFeedback: false,
        valid: false,
        error,
        ...(message ? { message } : {})
    };
}

function normalizeOptionName(value: string): string {
    return value
        .normalize('NFKC')
        .toLocaleLowerCase('de-DE');
}

function parseBoolean(value: string): boolean | null {
    switch (value.toLocaleLowerCase('en-US')) {
        case '1':
        case 'true':
            return true;
        case '0':
        case 'false':
            return false;
        default:
            return null;
    }
}

const OPTION_ALIASES: Readonly<Record<string, string>> = {
    zeilenrückmeldung: 'feedback', zeilenrueckmeldung: 'feedback',
    intervall: 'interval', interval: 'interval',
    winkelmass: 'angle', winkelmaß: 'angle', angle: 'angle',
    aufgabe: 'task', task: 'task',
    stelle: 'point', point: 'point',
    ordnung: 'order', order: 'order',
    von: 'lower', lower: 'lower',
    bis: 'upper', upper: 'upper',
    zweitefunktion: 'secondFunction', secondfunction: 'secondFunction',
    seite: 'side', side: 'side',
    art: 'scope', scope: 'scope',
    familie: 'family', family: 'family',
    teile: 'parts', parts: 'parts',
};

/**
 * Parses the single LiaScript argument passed to @BerechneOCR(...).
 *
 * A missing forwarded positional parameter can remain a literal sentinel such
 * as @0. Named options share this argument, separated by semicolons. Only the
 * second-function option may contain another equals sign in its value.
 */
export function parseCalculationOptions(source: unknown): CalculationOptions {
    if (source === null || source === undefined) return DEFAULT_OPTIONS;

    const raw = String(source).trim();
    if (!raw || /^@\d+$/u.test(raw)) return DEFAULT_OPTIONS;
    if (raw.length > 2048) {
        return invalid('invalid-context', 'Die Aufgabenvorgaben dürfen insgesamt höchstens 2048 Zeichen enthalten.');
    }

    const shorthand = parseBoolean(raw);
    if (shorthand !== null) {
        return {
            lineFeedback: shorthand,
            valid: true
        };
    }

    const parts = raw.split(';').map(part => part.trim());
    if (parts.some(part => !part)) return invalid('empty-option');

    let lineFeedback: boolean | null = null;
    const context: CalculationContext = {};
    const seen = new Set<string>();
    for (const part of parts) {
        const match = /^([^=]+?)\s*=\s*(.+)$/u.exec(part);
        if (!match) return invalid('malformed-option');
        const authoredName = normalizeOptionName(match[1].trim());
        const name = Object.prototype.hasOwnProperty.call(OPTION_ALIASES, authoredName)
            ? OPTION_ALIASES[authoredName] : undefined;
        if (!name) return invalid('unknown-option');
        if (seen.has(name)) return invalid('duplicate-option');
        seen.add(name);
        const value = match[2].trim();
        if (!value || name !== 'secondFunction' && value.includes('=')) return invalid('malformed-option');
        const normalizedValue = normalizeOptionName(value);
        if (name === 'feedback' || name === 'family') {
            const parsed = parseBoolean(value);
            if (parsed === null) return invalid('invalid-boolean');
            if (name === 'feedback') lineFeedback = parsed;
            else context.family = parsed;
        } else if (name === 'interval') {
            const interval = parseFunctionInterval(value);
            if (!interval) return invalid('invalid-context', 'Ungültiges Intervall; verwende beispielsweise intervall=[-2,2].');
            context.interval = interval;
        } else if (name === 'angle') {
            if (!['rad', 'deg', 'grad'].includes(normalizedValue)) {
                return invalid('invalid-context', 'Das Winkelmaß muss rad oder deg sein.');
            }
            context.angleUnit = normalizedValue === 'rad' ? 'rad' : 'deg';
        } else if (name === 'task') {
            const task = parseCalculationTask(value);
            if (!task) return invalid('invalid-context', 'Der angegebene Aufgabentyp ist unbekannt.');
            context.task = task;
        } else if (name === 'order') {
            if (!/^[1-4]$/u.test(value)) {
                return invalid('invalid-context', 'Die Ableitungsordnung muss eine ganze Zahl von 1 bis 4 sein.');
            }
            context.order = Number(value);
        } else if (name === 'side') {
            const side = ({ links: 'left', left: 'left', rechts: 'right', right: 'right', beide: 'both', both: 'both' } as const);
            if (!Object.prototype.hasOwnProperty.call(side, normalizedValue)) {
                return invalid('invalid-context', 'Die Grenzwertseite muss links, rechts oder beide sein.');
            }
            context.side = side[normalizedValue as keyof typeof side];
        } else if (name === 'scope') {
            if (!['lokal', 'local', 'global'].includes(normalizedValue)) {
                return invalid('invalid-context', 'Die Extremumart muss lokal oder global sein.');
            }
            context.scope = normalizedValue === 'global' ? 'global' : 'local';
        } else if (name === 'parts') {
            const tasks = value.split(',').map(part => parseCalculationTask(part));
            if (tasks.some(task => task === null)) {
                return invalid('invalid-context', 'teile enthält einen unbekannten Aufgabentyp.');
            }
            context.parts = tasks as CalculationTask[];
        } else if (name === 'point') {
            context.point = value;
        } else if (name === 'lower') {
            context.lower = value;
        } else if (name === 'upper') {
            context.upper = value;
        } else if (name === 'secondFunction') {
            context.secondFunction = value;
        }
    }
    const message = calculationContextError(context);
    if (message) return invalid('invalid-context', message);
    return {
        lineFeedback: lineFeedback ?? true,
        valid: true,
        ...(Object.keys(context).length ? { calculationContext: context } : {})
    };
}

/**
 * Reads the normalized runtime flag first and falls back to the authored
 * macro-option source embedded by the LiaScript template.
 */
export function isLineFeedbackEnabledForPair(pair: Element): boolean {
    const normalized = pair.getAttribute('data-line-feedback');
    if (normalized !== null) {
        const parsed = parseBoolean(normalized.trim());
        return parsed === true;
    }

    if (pair.getAttribute('data-canvas-mode') !== 'plus') return false;
    if (pair.getAttribute('data-canvas-output') !== 'answer') return false;

    return parseCalculationOptions(
        pair.getAttribute('data-calculation-options')
    ).lineFeedback;
}

/** Shared by the native quiz, rendering review, and generated resolution. */
export function calculationValidationOptionsForPair(pair?: Element | null): TransitionValidationOptions {
    const parsed = parseCalculationOptions(pair?.getAttribute('data-calculation-options'));
    // Invalid authored options must not silently grade using a different domain.
    return parsed.valid ? (parsed.calculationContext ? { calculationContext: parsed.calculationContext } : {})
        : { runtime: null };
}
