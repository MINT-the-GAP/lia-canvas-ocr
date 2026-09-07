type StrokePoint = { x: number; y: number };

/** Paint the stored centreline, including taps that have no line segment. */
export function paintStrokePath(
    context: CanvasRenderingContext2D,
    points: readonly StrokePoint[],
    start = 0,
    end = points.length
): void {
    const first = points[start];
    if (!first || start >= end) return;

    context.beginPath();
    context.moveTo(first.x, first.y);
    let hasSegment = false;
    for (let index = start + 1; index < end; index++) {
        const point = points[index];
        context.lineTo(point.x, point.y);
        hasSegment = hasSegment || point.x !== first.x || point.y !== first.y;
    }
    if (hasSegment) {
        context.stroke();
        return;
    }

    // moveTo + stroke does not paint a tap, even with round line caps.
    // Filling the cap uses the same width, alpha and eraser composition as
    // a moving stroke, without inventing a second point in the stored ink.
    context.beginPath();
    context.arc(first.x, first.y, context.lineWidth / 2, 0, Math.PI * 2);
    context.fillStyle = context.strokeStyle;
    context.fill();
}
