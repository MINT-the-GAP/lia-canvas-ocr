// Canvas store: per-mount UID assignment and canvas change dispatch.

import { LIA, getRootWindow } from '../index';
import { getCanvasLiveRevision } from './live-state';

export type CanvasLiveActivity = {
    uid: string;
    revision: number;
    active: boolean;
    operations: string[];
};

type LiveController = { canvas: HTMLCanvasElement; dispose: () => void };
const liveControllers = new Map<string, LiveController>();
const liveOperations = new Map<string, Set<string>>();

export function registerCanvasLiveController(uid: string, controller: LiveController): void {
    liveControllers.get(uid)?.dispose();
    liveControllers.set(uid, controller);
}

export function disposeCanvasLiveController(uid: string): void {
    const controller = liveControllers.get(uid);
    controller?.dispose();
    liveControllers.delete(uid);
}

export function unregisterCanvasLiveController(uid: string, canvas: HTMLCanvasElement): void {
    if (liveControllers.get(uid)?.canvas !== canvas) return;
    liveControllers.delete(uid);
    clearCanvasLiveOperations(uid);
}

export function getCanvasLiveActivityByUID(uid: string): CanvasLiveActivity | null {
    const entry = typeof uid === 'string' && LIA.store &&
        Object.prototype.hasOwnProperty.call(LIA.store, uid) ? LIA.store[uid] : null;
    if (!uid || !entry) return null;
    const operations = Array.from(liveOperations.get(uid) || []);
    return { uid, revision: getCanvasLiveRevision(uid, entry), active: operations.length > 0, operations };
}

function dispatchCanvasLiveActivity(uid: string): void {
    const detail = getCanvasLiveActivityByUID(uid);
    if (!detail) return;
    try {
        getRootWindow().dispatchEvent(new CustomEvent('lia:canvas-activity', { detail }));
    } catch (_) {
        // A cross-origin embedding must not interrupt the drawing handler.
        window.dispatchEvent(new CustomEvent('lia:canvas-activity', { detail }));
    }
}

export function setCanvasLiveOperation(uid: string, operation: string, active: boolean): void {
    let operations = liveOperations.get(uid);
    if (!operations) liveOperations.set(uid, operations = new Set());
    if (operations.has(operation) === active) return;
    if (active) operations.add(operation);
    else operations.delete(operation);
    dispatchCanvasLiveActivity(uid);
}

export function clearCanvasLiveOperations(uid: string): void {
    if (!liveOperations.get(uid)?.size) return;
    liveOperations.delete(uid);
    dispatchCanvasLiveActivity(uid);
}

export function ensureMountUID(mount: HTMLElement | null): string {
    if (!mount) return '';
    if ((mount as any).dataset && (mount as any).dataset.uid) return (mount as any).dataset.uid;
    const uid = 'c' + (++LIA.uidSeq);
    (mount as any).dataset.uid = uid;
    return uid;
}

export function __liaDispatchCanvasFreezeChange(detail: Record<string, unknown> | null): void {
    try {
        const payload = Object.assign(
            { ts: Date.now() },
            (detail && typeof detail === 'object') ? detail : {}
        );

        const ROOT = getRootWindow();
        const target = (ROOT && typeof (ROOT as any).dispatchEvent === 'function')
            ? ROOT as unknown as EventTarget
            : window;

        target.dispatchEvent(new CustomEvent('lia:canvas-change', {
            detail: payload
        }));
    } catch (_) { }
}
