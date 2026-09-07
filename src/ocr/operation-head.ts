import { isCompleteOcrEquationPart } from './equation-recognition.ts';

export type OcrDivisionOperationHead = {
    token: ':';
    /** Bounds of both visible dots; x1/y1 are exclusive. */
    box: { x0: number; y0: number; x1: number; y1: number };
    /** A cut in the empty gap before the operand, preserving all operand ink. */
    operandX0: number;
};
type Component = { x0: number; y0: number; x1: number; y1: number; ink: number };

function componentsOf(mask: Uint8Array, width: number, height: number): Component[] | null {
    const seen = new Uint8Array(mask.length), queue = new Int32Array(mask.length);
    const components: Component[] = [];
    for (let index = 0; index < mask.length; index++) {
        if (!mask[index] || seen[index]) continue;
        if (components.length >= 128) return null;
        const part = { x0: width, y0: height, x1: 0, y1: 0, ink: 0 };
        let start = 0, end = 1;
        queue[0] = index; seen[index] = 1;
        while (start < end) {
            const current = queue[start++], y = Math.floor(current / width), x = current - y * width;
            part.x0 = Math.min(part.x0, x); part.y0 = Math.min(part.y0, y);
            part.x1 = Math.max(part.x1, x + 1); part.y1 = Math.max(part.y1, y + 1); part.ink++;
            for (let yy = Math.max(0, y - 1); yy <= Math.min(height - 1, y + 1); yy++) {
                for (let xx = Math.max(0, x - 1); xx <= Math.min(width - 1, x + 1); xx++) {
                    const next = yy * width + xx;
                    if (!mask[next] || seen[next]) continue;
                    seen[next] = 1; queue[end++] = next;
                }
            }
        }
        // Neither a clipped dot nor a clipped operand establishes the head.
        if (part.x0 === 0 || part.y0 === 0 || part.x1 === width || part.y1 === height) return null;
        components.push(part);
    }
    return components.sort((a, b) => a.x0 - b.x0 || a.y0 - b.y0);
}

/** Only for the final binary raster immediately RIGHT of an independently
 * confirmed operation bar. This does not infer a bar, a task or a solution.
 * Nonzero pixels are visible ink, after erasing and selection clipping. */
export function findOcrDivisionOperationHead(
    mask: Uint8Array, width: number, height: number, pixelScale = 1
): OcrDivisionOperationHead | null {
    if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 ||
        width * height > 1_000_000 || mask.length !== width * height ||
        !Number.isFinite(pixelScale) || pixelScale < .25 || pixelScale > 32) return null;
    const components = componentsOf(mask, width, height);
    if (!components || components.length < 3) return null;
    const pair = components.slice(0, 2).sort((a, b) => a.y0 - b.y0);
    const [upper, lower] = pair;
    const rest = components.slice(2);
    const operand = rest[0];
    const glyphHeight = operand.y1 - operand.y0;
    const box = { x0: Math.min(upper.x0, lower.x0), y0: upper.y0,
        x1: Math.max(upper.x1, lower.x1), y1: lower.y1 };
    const maxDotSize = Math.max(...pair.map(dot => Math.max(dot.x1 - dot.x0, dot.y1 - dot.y0)));
    if (glyphHeight < Math.max(12 * pixelScale, maxDotSize * 5) || box.x0 > glyphHeight * 1.5) return null;
    for (const dot of pair) {
        const w = dot.x1 - dot.x0, h = dot.y1 - dot.y0;
        if (w < pixelScale || h < pixelScale || w / h < .7 || w / h > 1.45 ||
            Math.max(w, h) > glyphHeight * .2 || dot.ink / (w * h) < .5) return null;
    }
    const upperWidth = upper.x1 - upper.x0, lowerWidth = lower.x1 - lower.x0;
    const upperHeight = upper.y1 - upper.y0, lowerHeight = lower.y1 - lower.y0;
    if (Math.min(upperWidth, lowerWidth) / Math.max(upperWidth, lowerWidth) < .6 ||
        Math.min(upperHeight, lowerHeight) / Math.max(upperHeight, lowerHeight) < .6) return null;
    const upperX = (upper.x0 + upper.x1) / 2, lowerX = (lower.x0 + lower.x1) / 2;
    const upperY = (upper.y0 + upper.y1) / 2, lowerY = (lower.y0 + lower.y1) / 2;
    const separation = lowerY - upperY;
    if (Math.abs(upperX - lowerX) > Math.max(pixelScale * .75, Math.min(upperWidth, lowerWidth) * .35) ||
        lower.y0 - upper.y1 < Math.max(pixelScale, Math.max(upperHeight, lowerHeight) * .75) ||
        separation < glyphHeight * .25 || separation > glyphHeight * .72 ||
        box.y1 - box.y0 > glyphHeight * .88 ||
        Math.abs((upperY + lowerY) / 2 - (operand.y0 + operand.y1) / 2) > glyphHeight * .16 ||
        upperY < operand.y0 + glyphHeight * .08 || lowerY > operand.y1 - glyphHeight * .08) return null;
    const gap = operand.x0 - box.x1;
    if (gap < Math.max(2 * pixelScale, Math.min(upperWidth, lowerWidth) * .5) || gap > glyphHeight * .9) return null;
    return { token: ':', box, operandX0: Math.floor((box.x1 + operand.x0) / 2) };
}

/** The operand is recognized from its own intact crop. Never strip an i, dot
 * or other token from an OCR response to make it fit a supposed division. */
export function composeOcrDivisionOperation(
    head: OcrDivisionOperationHead | null, operand: string
): string | null {
    return head && isCompleteOcrEquationPart(operand) ? ': ' + operand.trim() : null;
}
