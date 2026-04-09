// Canvas store: per-mount UID assignment and canvas change dispatch.

import { LIA, getRootWindow } from '../index';

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
