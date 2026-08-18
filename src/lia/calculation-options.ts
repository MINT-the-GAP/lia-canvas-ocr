// Pure parser for the optional @BerechneOCR(...) macro configuration.

export type CalculationOptionsError =
    | 'empty-option'
    | 'malformed-option'
    | 'unknown-option'
    | 'duplicate-option'
    | 'invalid-boolean';

export type CalculationOptions = Readonly<{
    lineFeedback: boolean;
    valid: boolean;
    error?: CalculationOptionsError;
}>;

const DEFAULT_OPTIONS: CalculationOptions = Object.freeze({
    lineFeedback: true,
    valid: true
});

function invalid(error: CalculationOptionsError): CalculationOptions {
    return {
        lineFeedback: false,
        valid: false,
        error
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

/**
 * Parses the single LiaScript argument passed to @BerechneOCR(...).
 *
 * LiaScript can leave a missing forwarded positional parameter as a literal
 * sentinel such as @0. Treat that sentinel like an empty option list so a
 * parameterless @BerechneOCR call enables feedback by default.
 * Multiple future named options share this one LiaScript argument and are
 * therefore separated with semicolons rather than commas.
 */
export function parseCalculationOptions(source: unknown): CalculationOptions {
    if (source === null || source === undefined) return DEFAULT_OPTIONS;

    const raw = String(source).trim();
    if (!raw || /^@\d+$/u.test(raw)) return DEFAULT_OPTIONS;

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
    for (const part of parts) {
        const match = /^([^=]+?)\s*=\s*([^=\s]+)$/u.exec(part);
        if (!match) return invalid('malformed-option');

        const name = normalizeOptionName(match[1].trim());
        if (name !== 'zeilenrückmeldung' && name !== 'zeilenrueckmeldung') {
            return invalid('unknown-option');
        }
        if (lineFeedback !== null) return invalid('duplicate-option');

        const parsed = parseBoolean(match[2]);
        if (parsed === null) return invalid('invalid-boolean');
        lineFeedback = parsed;
    }

    return {
        lineFeedback: lineFeedback ?? true,
        valid: true
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
