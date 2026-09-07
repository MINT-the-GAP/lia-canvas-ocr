// Shared reasons keep live review, native grading and Freeze explanations aligned.
export const CALCULATION_METHOD_MESSAGES = {
    'equivalent-polynomial-equations': ['Both equations have the same real solutions.', 'Beide Gleichungen haben dieselben reellen Lösungen.'],
    'different-polynomial-solutions': ['The equations have different real solutions.', 'Die Gleichungen haben verschiedene reelle Lösungen.'],
    'complete-real-solutions': ['All real solutions are included.', 'Alle reellen Lösungen sind enthalten.'],
    'conflicting-solution-label': ['The same solution index is assigned different values in this branch.', 'Derselbe L\u00f6sungsindex erh\u00e4lt in diesem Zweig verschiedene Werte.'],
    'solution-candidate': ['This value solves the equation. The complete solution set is checked separately.', 'Dieser Wert löst die Gleichung. Die Vollständigkeit der Lösungsmenge wird gesondert geprüft.'],
    'incomplete-real-solutions': ['At least one real solution is missing.', 'Mindestens eine reelle Lösung fehlt.'],
    'incorrect-real-solutions': ['At least one stated value does not solve the original equation.', 'Mindestens ein angegebener Wert löst die Ausgangsgleichung nicht.'],
    'given-equation': ['This is the given equation, following a label or auxiliary calculation.', 'Dies ist die vorgegebene Gleichung nach einer Beschriftung oder Nebenrechnung.'],
    'given-system-equation': ['This is another equation of the given system.', 'Dies ist eine weitere Gleichung des vorgegebenen Systems.'],
    'equivalent-system': ['The two systems have the same solutions.', 'Die beiden Gleichungssysteme haben dieselben Lösungen.'],
    'linear-system-consequence': ['This equation follows from the given system.', 'Diese Gleichung folgt aus dem vorgegebenen Gleichungssystem.'],
    'incorrect-system-consequence': ['This equation does not follow from the given system.', 'Diese Gleichung folgt nicht aus dem vorgegebenen Gleichungssystem.'],
    'substitution-step': ['The defined expression was substituted correctly.', 'Der definierte Ausdruck wurde richtig eingesetzt.'],
    'back-substitution': ['This branch follows by substituting back a previously established value.', 'Dieser Lösungszweig entsteht durch Rückeinsetzen eines zuvor bestimmten Wertes.'],
    'definition-step': ['This line defines an auxiliary variable; it does not replace the original equation.', 'Diese Zeile definiert eine Hilfsvariable. Die Ausgangsgleichung bleibt dabei erhalten.'],
    'auxiliary-calculation': ['This auxiliary calculation is correct and leaves the main equation unchanged.', 'Diese Nebenrechnung ist richtig. Die Hauptgleichung bleibt dabei erhalten.'],
    'incorrect-auxiliary-calculation': ['An equality in this auxiliary calculation is incorrect.', 'Eine Gleichheit in dieser Nebenrechnung ist falsch.'],
    'verification-step': ['Substituting the solution into the original equation confirms this check.', 'Das Einsetzen der Lösung in die Ausgangsgleichung bestätigt diese Probe.'],
    'incorrect-verification': ['This check does not agree with substituting the solution into the original equation.', 'Diese Probe stimmt nicht mit dem Einsetzen der Lösung in die Ausgangsgleichung überein.'],
    'calculation-annotation': ['The label identifies the following calculation.', 'Die Beschriftung kennzeichnet die folgende Rechnung.'],
    'domain-restriction': ['This exclusion follows from a denominator in the original equation.', 'Dieser Ausschluss folgt aus einem Nenner der Ausgangsgleichung.'],
    'domain-violation': ['A stated value is excluded by the original equation.', 'Ein angegebener Wert ist in der Ausgangsgleichung ausgeschlossen.']
} as const;

export type CalculationMethodReason = keyof typeof CALCULATION_METHOD_MESSAGES;
export type CalculationCheckRole = 'equivalence' | 'given' | 'auxiliary' | 'definition' | 'verification' | 'system' | 'branch' | 'annotation';
export const CALCULATION_METHOD_REASONS = Object.keys(CALCULATION_METHOD_MESSAGES) as CalculationMethodReason[];
export const CALCULATION_METHOD_GERMAN: Record<string, string> = {};
for (const reason of CALCULATION_METHOD_REASONS) {
    CALCULATION_METHOD_GERMAN['ocr.plus.validation.' + reason] = CALCULATION_METHOD_MESSAGES[reason][1];
}
export function calculationMethodFallback(reason: string): string | undefined {
    return Object.prototype.hasOwnProperty.call(CALCULATION_METHOD_MESSAGES, reason)
        ? CALCULATION_METHOD_MESSAGES[reason as CalculationMethodReason][0] : undefined;
}
