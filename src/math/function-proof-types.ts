import type { AlgebriteRuntime, Proof } from './equivalence.ts';

/** Author-provided bounds use exact expressions (for example 2*pi), never floats. */
export interface FunctionInterval {
    lower: string;
    upper: string;
    lowerClosed: boolean;
    upperClosed: boolean;
}
export interface FunctionContext {
    runtime: AlgebriteRuntime;
    angleUnit?: 'rad' | 'deg';
    interval?: FunctionInterval;
}
export type RealSolutionSet =
    | { kind: 'finite'; values: string[] }
    | { kind: 'periodic'; families: { offset: string; period: string }[] }
    | { kind: 'all' };
export interface FunctionEquationModel {
    variable: string;
    solutions: RealSolutionSet;
    expectedLines: string[];
    /** Membership in the original domain, independently of equation truth. */
    domain: (value: string) => Proof;
}
