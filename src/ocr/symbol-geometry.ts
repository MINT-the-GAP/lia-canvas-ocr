export type OcrSymbolPoint = {
    x: number;
    y: number;
};

export type OcrSymbolPath = {
    points: readonly OcrSymbolPoint[];
    strokeWidth?: number;
};

export type OcrSymbolBox = {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
};

export type OcrDelimiterKind =
    | 'round-open'
    | 'round-close'
    | 'square-open'
    | 'square-close';

export type OcrDelimiterHint = OcrSymbolBox & {
    kind: OcrDelimiterKind;
    pathIndexes: number[];
};

export type OcrCalculationRuleHint = OcrSymbolBox & {
    pathIndexes: number[];
};

export type OcrCalculationRuleContext = {
    /**
     * Maximum distance from the rule to the second full-size row above it,
     * measured in representative glyph heights. The conservative default is
     * 3.6; written subtraction may opt into the selector's existing 4.5 range.
     */
    maximumSecondAboveDistance?: number;
    /**
     * Written multiplication may contain only its expression above the final
     * rule while partial products are still missing. This opt-in remains
     * conditional on an independently observed compact multiplication dot.
     */
    allowSingleMultiplicationRow?: boolean;
};

export type OcrDivisionRuleHint = OcrSymbolBox & {
    pathIndexes: number[];
};

export type OcrCarryOneHint = OcrSymbolBox & {
    pathIndexes: number[];
    rulePathIndexes: number[];
    /** Fitted vertical stem position; the hook itself may extend far left. */
    stemX?: number;
};

export type OcrVerticalGlyphKind =
    | 'hooked-one'
    | 'hookless-bar'
    | 'ambiguous'
    | 'other';

type LineKind = 'horizontal' | 'vertical';

type LineStroke = {
    index: number;
    kind: LineKind;
    box: OcrSymbolBox;
    centerX: number;
    centerY: number;
    width: number;
    height: number;
    strokeWidth: number;
};

type PlusMinusCandidate = {
    top: LineStroke;
    vertical: LineStroke;
    bottom: LineStroke;
    score: number;
};

type DelimiterCandidate = OcrDelimiterHint & {
    score: number;
};

type PolylineGeometry = {
    points: OcrSymbolPoint[];
    samples: OcrSymbolPoint[];
    box: OcrSymbolBox;
    length: number;
    chord: number;
    verticalTravel: number;
    strokeWidth: number;
};

type VerticalStemFit = {
    slope: number;
    intercept: number;
    rmsResidual: number;
    p90Residual: number;
};

type CalculationRuleStroke = {
    index: number;
    geometry: PolylineGeometry;
    centerY: number;
    width: number;
};

type CalculationRuleGroup = {
    strokes: CalculationRuleStroke[];
    box: OcrSymbolBox;
    centerY: number;
    width: number;
};

type InkBand = {
    boxes: OcrSymbolBox[];
    centerY: number;
    maximumHeight: number;
    x0: number;
    x1: number;
};

const EPSILON = 1e-6;

function finitePoints(path: OcrSymbolPath): OcrSymbolPoint[] {
    return (path.points || []).filter(point =>
        Number.isFinite(point.x) && Number.isFinite(point.y)
    );
}

function polylineGeometry(path: OcrSymbolPath): PolylineGeometry | null {
    const finite = finitePoints(path);
    const points: OcrSymbolPoint[] = [];
    for (const point of finite) {
        const previous = points[points.length - 1];
        if (!previous || Math.hypot(point.x - previous.x, point.y - previous.y) > EPSILON) {
            points.push(point);
        }
    }
    if (points.length < 2) return null;

    const cumulative = [0];
    let length = 0;
    let verticalTravel = 0;
    let x0 = points[0].x;
    let y0 = points[0].y;
    let x1 = points[0].x;
    let y1 = points[0].y;
    for (let index = 1; index < points.length; index++) {
        const previous = points[index - 1];
        const point = points[index];
        length += Math.hypot(point.x - previous.x, point.y - previous.y);
        verticalTravel += Math.abs(point.y - previous.y);
        cumulative.push(length);
        x0 = Math.min(x0, point.x);
        y0 = Math.min(y0, point.y);
        x1 = Math.max(x1, point.x);
        y1 = Math.max(y1, point.y);
    }
    if (length <= EPSILON) return null;

    // Uniform arc-length sampling prevents dense portions of a stroke from
    // carrying more weight than sparsely sampled portions. Reversing a path
    // therefore yields the same spatial evidence.
    const samples: OcrSymbolPoint[] = [];
    const sampleIntervals = 80;
    let segment = 0;
    for (let sampleIndex = 0; sampleIndex <= sampleIntervals; sampleIndex++) {
        const distance = length * sampleIndex / sampleIntervals;
        while (
            segment < points.length - 2 &&
            cumulative[segment + 1] < distance - EPSILON
        ) {
            segment++;
        }
        const segmentLength = cumulative[segment + 1] - cumulative[segment];
        const ratio = segmentLength > EPSILON
            ? Math.max(0, Math.min(1, (distance - cumulative[segment]) / segmentLength))
            : 0;
        const from = points[segment];
        const to = points[segment + 1];
        samples.push({
            x: from.x + (to.x - from.x) * ratio,
            y: from.y + (to.y - from.y) * ratio
        });
    }

    const first = points[0];
    const last = points[points.length - 1];
    const strokeWidth = Number.isFinite(path.strokeWidth) && Number(path.strokeWidth) > 0
        ? Number(path.strokeWidth)
        : 1;
    return {
        points,
        samples,
        box: { x0, y0, x1, y1 },
        length,
        chord: Math.hypot(last.x - first.x, last.y - first.y),
        verticalTravel,
        strokeWidth
    };
}

function fitVerticalStem(
    samples: readonly OcrSymbolPoint[],
    top: number,
    height: number
): VerticalStemFit | null {
    // A numeral one's hook lives at its geometric top and can occupy almost
    // half of a short carry glyph. Fitting only the lower portion isolates the
    // stem without relying on drawing direction.
    const stemSamples = samples.filter(point => point.y >= top + height * 0.46);
    if (stemSamples.length < 3) return null;

    let meanX = 0;
    let meanY = 0;
    for (const point of stemSamples) {
        meanX += point.x;
        meanY += point.y;
    }
    meanX /= stemSamples.length;
    meanY /= stemSamples.length;

    let covariance = 0;
    let yVariance = 0;
    for (const point of stemSamples) {
        covariance += (point.y - meanY) * (point.x - meanX);
        yVariance += (point.y - meanY) ** 2;
    }
    if (yVariance <= EPSILON) return null;

    const slope = covariance / yVariance;
    const intercept = meanX - slope * meanY;
    const normalizer = Math.sqrt(1 + slope * slope);
    const residuals = stemSamples
        .map(point => Math.abs(point.x - (slope * point.y + intercept)) / normalizer)
        .sort((left, right) => left - right);
    const squaredResidual = residuals.reduce(
        (total, residual) => total + residual * residual,
        0
    );
    return {
        slope,
        intercept,
        rmsResidual: Math.sqrt(squaredResidual / residuals.length),
        p90Residual: residuals[Math.floor((residuals.length - 1) * 0.9)]
    };
}

function signedStemDistance(fit: VerticalStemFit, point: OcrSymbolPoint): number {
    return (point.x - (fit.slope * point.y + fit.intercept)) /
        Math.sqrt(1 + fit.slope * fit.slope);
}

function residualSummary(
    samples: readonly OcrSymbolPoint[],
    fit: VerticalStemFit
): { rms: number; p95: number; maximum: number } {
    const residuals = samples
        .map(point => Math.abs(signedStemDistance(fit, point)))
        .sort((left, right) => left - right);
    const squaredResidual = residuals.reduce(
        (total, residual) => total + residual * residual,
        0
    );
    return {
        rms: Math.sqrt(squaredResidual / residuals.length),
        p95: residuals[Math.floor((residuals.length - 1) * 0.95)],
        maximum: residuals[residuals.length - 1]
    };
}

type OrderedArmGeometry = {
    endpoint: OcrSymbolPoint;
    length: number;
    chord: number;
    verticalTravel: number;
};

function orderedArmGeometry(points: readonly OcrSymbolPoint[]): OrderedArmGeometry | null {
    if (points.length < 2) return null;
    let length = 0;
    let verticalTravel = 0;
    for (let index = 1; index < points.length; index++) {
        const previous = points[index - 1];
        const point = points[index];
        length += Math.hypot(point.x - previous.x, point.y - previous.y);
        verticalTravel += Math.abs(point.y - previous.y);
    }
    if (length <= EPSILON) return null;
    const first = points[0];
    const endpoint = points[points.length - 1];
    return {
        endpoint,
        length,
        chord: Math.hypot(endpoint.x - first.x, endpoint.y - first.y),
        verticalTravel
    };
}

/**
 * Recognises a one-stroke school-style numeral one by its ordered topology.
 *
 * A real one has one short, simple diagonal arm from the top turn and one
 * long, nearly monotone stem to the bottom.  This remains stable when the
 * diagonal arm reaches well below the old fixed 48% hook band.  A seven has
 * no downward hook arm, while a nine reaches the bottom through a loop rather
 * than through a direct stem.
 */
function hasTurnedOneTopology(geometry: PolylineGeometry): boolean {
    const height = geometry.box.y1 - geometry.box.y0;
    if (height <= EPSILON || geometry.points.length < 3 ||
        geometry.length > height * 2.05) return false;

    const cumulative = [0];
    for (let index = 1; index < geometry.points.length; index++) {
        const previous = geometry.points[index - 1];
        const point = geometry.points[index];
        cumulative.push(cumulative[index - 1] + Math.hypot(
            point.x - previous.x,
            point.y - previous.y
        ));
    }
    const topTolerance = Math.max(geometry.strokeWidth * 0.75, height * 0.025);
    const topIndexes = geometry.points
        .map((point, index) => ({ point, index }))
        .filter(({ point, index }) =>
            index > 0 && index < geometry.points.length - 1 &&
            point.y <= geometry.box.y0 + topTolerance
        );
    if (!topIndexes.length) return false;
    const topIndex = topIndexes.sort((left, right) => {
        const leftBalance = Math.min(
            cumulative[left.index],
            geometry.length - cumulative[left.index]
        );
        const rightBalance = Math.min(
            cumulative[right.index],
            geometry.length - cumulative[right.index]
        );
        // Prefer the actual geometric apex.  Dense pointer sampling can place
        // several points inside the stroke-width top tolerance; choosing the
        // most balanced one first would move the split a few pixels down the
        // stem and make the short hook arm appear non-monotone.
        return left.point.y - right.point.y || rightBalance - leftBalance;
    })[0].index;
    const apex = geometry.points[topIndex];
    const firstArmPoints = geometry.points.slice(0, topIndex + 1).reverse();
    const secondArmPoints = geometry.points.slice(topIndex);
    const firstArm = orderedArmGeometry(firstArmPoints);
    const secondArm = orderedArmGeometry(secondArmPoints);
    if (!firstArm || !secondArm) return false;

    const firstDrop = firstArm.endpoint.y - apex.y;
    const secondDrop = secondArm.endpoint.y - apex.y;
    const stem = firstDrop >= secondDrop ? firstArm : secondArm;
    const hook = firstDrop >= secondDrop ? secondArm : firstArm;
    const stemDrop = stem.endpoint.y - apex.y;
    const hookDrop = hook.endpoint.y - apex.y;
    if (
        stem.endpoint.y < geometry.box.y0 + height * 0.88 ||
        stemDrop < height * 0.82 ||
        stem.chord / stem.length < 0.86 ||
        stemDrop / Math.max(stem.verticalTravel, EPSILON) < 0.9 ||
        Math.abs(stem.endpoint.x - apex.x) >
            Math.max(geometry.strokeWidth * 2.5, height * 0.42)
    ) {
        return false;
    }
    if (
        hookDrop < height * 0.08 ||
        hookDrop > height * 0.75 ||
        hook.chord / hook.length < 0.84 ||
        hookDrop / Math.max(hook.verticalTravel, EPSILON) < 0.86
    ) {
        return false;
    }

    const stemSlope = (stem.endpoint.x - apex.x) / Math.max(stemDrop, EPSILON);
    if (Math.abs(stemSlope) > 0.2) return false;
    const stemXAtHookEnd = apex.x + stemSlope * hookDrop;
    const hookReach = Math.abs(hook.endpoint.x - stemXAtHookEnd);
    return hookReach >= Math.max(geometry.strokeWidth * 2.2, height * 0.085) &&
        hookReach <= height * 0.68;
}

/** Handles a one drawn from its upper diagonal endpoint into the stem. */
function hasTerminalShoulderOneTopology(geometry: PolylineGeometry): boolean {
    const height = geometry.box.y1 - geometry.box.y0;
    if (height <= EPSILON || geometry.points.length < 3 ||
        geometry.length > height * 1.9) return false;

    const first = geometry.points[0];
    const last = geometry.points[geometry.points.length - 1];
    const points = first.y <= last.y
        ? geometry.points
        : geometry.points.slice().reverse();
    const top = points[0];
    const bottom = points[points.length - 1];
    if (
        top.y > geometry.box.y0 + height * 0.2 ||
        bottom.y < geometry.box.y0 + height * 0.88
    ) {
        return false;
    }

    for (let jointIndex = 1; jointIndex < points.length - 1; jointIndex++) {
        const joint = points[jointIndex];
        const jointY = (joint.y - geometry.box.y0) / height;
        if (jointY < 0.05 || jointY > 0.42) continue;
        const shoulder = orderedArmGeometry(points.slice(0, jointIndex + 1));
        const stem = orderedArmGeometry(points.slice(jointIndex));
        if (!shoulder || !stem) continue;

        const shoulderDrop = joint.y - top.y;
        const stemDrop = bottom.y - joint.y;
        if (
            shoulderDrop < height * 0.05 || shoulderDrop > height * 0.42 ||
            shoulder.chord / shoulder.length < 0.84 ||
            shoulderDrop / Math.max(shoulder.verticalTravel, EPSILON) < 0.84 ||
            stemDrop < height * 0.55 ||
            stem.chord / stem.length < 0.88 ||
            stemDrop / Math.max(stem.verticalTravel, EPSILON) < 0.9 ||
            Math.abs(bottom.x - joint.x) >
                Math.max(geometry.strokeWidth * 2.5, height * 0.42)
        ) {
            continue;
        }

        const stemSlope = (bottom.x - joint.x) / Math.max(stemDrop, EPSILON);
        // A slightly falling top bar followed by the diagonal leg of a seven
        // has the same two direct, monotone arms as this alternate one form.
        // The distinguishing feature is the lower arm: a numeral one keeps a
        // predominantly vertical stem, whereas the seven traverses a large
        // horizontal distance on its way to the baseline. Keep the broader
        // slope handling below for ordinary bars; this topology shortcut must
        // remain deliberately narrower because it returns `hooked-one` early.
        if (Math.abs(stemSlope) > 0.2) continue;
        const stemXAtTop = joint.x + stemSlope * (top.y - joint.y);
        const shoulderReach = Math.abs(top.x - stemXAtTop);
        if (
            shoulderReach >= Math.max(geometry.strokeWidth * 2.2, height * 0.085) &&
            shoulderReach <= height * 0.68
        ) {
            return true;
        }
    }
    return false;
}

function hasSamePathOneTopology(geometry: PolylineGeometry): boolean {
    return hasTurnedOneTopology(geometry) ||
        hasTerminalShoulderOneTopology(geometry);
}

function hasTouchingPath(
    paths: readonly OcrSymbolPath[],
    targetIndex: number,
    target: PolylineGeometry
): boolean {
    for (let index = 0; index < paths.length; index++) {
        if (index === targetIndex) continue;
        const other = polylineGeometry(paths[index]);
        if (!other) continue;
        const tolerance = Math.max(target.strokeWidth, other.strokeWidth) * 1.5;
        if (
            intervalGap(target.box.x0, target.box.x1, other.box.x0, other.box.x1) > tolerance ||
            intervalGap(target.box.y0, target.box.y1, other.box.y0, other.box.y1) > tolerance
        ) {
            continue;
        }
        // A long sloped calculation rule can have a global bounding box that
        // overlaps a carry although the rule is still several pixels below it
        // at the carry's x-position.  Confirm proximity on the uniformly
        // sampled paths instead of treating that coarse box overlap as an
        // attachment.
        for (const targetPoint of target.samples) {
            if (other.samples.some(otherPoint =>
                Math.hypot(
                    targetPoint.x - otherPoint.x,
                    targetPoint.y - otherPoint.y
                ) <= tolerance
            )) {
                return true;
            }
        }
    }
    return false;
}

function median(values: readonly number[]): number {
    if (!values.length) return 0;
    const sorted = Array.from(values).sort((left, right) => left - right);
    const middle = Math.floor(sorted.length / 2);
    return sorted.length % 2
        ? sorted[middle]
        : (sorted[middle - 1] + sorted[middle]) / 2;
}

function delimiterBox(
    paths: readonly OcrSymbolPath[],
    pathIndexes: readonly number[]
): OcrSymbolBox | null {
    let x0 = Infinity;
    let y0 = Infinity;
    let x1 = -Infinity;
    let y1 = -Infinity;
    for (const pathIndex of pathIndexes) {
        const path = paths[pathIndex];
        if (!path) continue;
        const points = finitePoints(path);
        if (!points.length) continue;
        const strokeWidth = Number.isFinite(path.strokeWidth) && Number(path.strokeWidth) > 0
            ? Number(path.strokeWidth)
            : 1;
        const padding = strokeWidth / 2;
        for (const point of points) {
            x0 = Math.min(x0, point.x - padding);
            y0 = Math.min(y0, point.y - padding);
            x1 = Math.max(x1, point.x + padding);
            y1 = Math.max(y1, point.y + padding);
        }
    }
    return isFinite(x0) && isFinite(y0) && isFinite(x1) && isFinite(y1)
        ? { x0, y0, x1, y1 }
        : null;
}

function relativeY(point: OcrSymbolPoint, top: number, height: number): number {
    return (point.y - top) / Math.max(height, EPSILON);
}

function singleRoundDelimiterCandidate(
    paths: readonly OcrSymbolPath[],
    pathIndex: number
): DelimiterCandidate | null {
    const geometry = polylineGeometry(paths[pathIndex]);
    if (!geometry) return null;

    const width = geometry.box.x1 - geometry.box.x0;
    const height = geometry.box.y1 - geometry.box.y0;
    if (height < geometry.strokeWidth * 6 || height <= EPSILON) return null;
    if (width < Math.max(geometry.strokeWidth * 1.75, height * 0.055) ||
        width > height * 0.43) return null;

    const first = geometry.points[0];
    const last = geometry.points[geometry.points.length - 1];
    const topEndpoint = first.y <= last.y ? first : last;
    const bottomEndpoint = first.y <= last.y ? last : first;
    const endTolerance = Math.max(geometry.strokeWidth * 1.5, height * 0.065);
    if (topEndpoint.y - geometry.box.y0 > endTolerance ||
        geometry.box.y1 - bottomEndpoint.y > endTolerance) return null;
    if (bottomEndpoint.y - topEndpoint.y < height * 0.84) return null;
    if (Math.abs(topEndpoint.x - bottomEndpoint.x) >
        Math.max(geometry.strokeWidth * 2, height * 0.13)) return null;
    if (height / Math.max(geometry.verticalTravel, EPSILON) < 0.84) return null;

    const endpointHeight = bottomEndpoint.y - topEndpoint.y;
    const signedOffsets = geometry.samples.map(point => {
        const ratio = (point.y - topEndpoint.y) / Math.max(endpointHeight, EPSILON);
        const baselineX = topEndpoint.x + (bottomEndpoint.x - topEndpoint.x) * ratio;
        return {
            offset: point.x - baselineX,
            y: relativeY(point, geometry.box.y0, height)
        };
    });
    let positiveReach = 0;
    let negativeReach = 0;
    let peakY = 0;
    let peakMagnitude = 0;
    for (const sample of signedOffsets) {
        positiveReach = Math.max(positiveReach, sample.offset);
        negativeReach = Math.max(negativeReach, -sample.offset);
        if (Math.abs(sample.offset) > peakMagnitude) {
            peakMagnitude = Math.abs(sample.offset);
            peakY = sample.y;
        }
    }
    const sign = positiveReach >= negativeReach ? 1 : -1;
    const dominantReach = Math.max(positiveReach, negativeReach);
    const oppositeReach = Math.min(positiveReach, negativeReach);
    const strongReach = Math.max(geometry.strokeWidth * 1.6, height * 0.09);
    if (dominantReach < strongReach ||
        oppositeReach > Math.max(geometry.strokeWidth * 1.2, dominantReach * 0.18) ||
        peakY < 0.27 || peakY > 0.73) return null;

    const directionalReach = (from: number, to: number): number => {
        let reach = 0;
        for (const sample of signedOffsets) {
            if (sample.y < from || sample.y > to) continue;
            reach = Math.max(reach, sign * sample.offset);
        }
        return reach;
    };
    const upperReach = directionalReach(0.16, 0.40);
    const centerReach = directionalReach(0.38, 0.62);
    const lowerReach = directionalReach(0.60, 0.84);
    if (upperReach < dominantReach * 0.52 ||
        centerReach < dominantReach * 0.78 ||
        lowerReach < dominantReach * 0.52) return null;
    const sideSymmetry = Math.min(upperReach, lowerReach) /
        Math.max(upperReach, lowerReach, EPSILON);
    if (sideSymmetry < 0.58) return null;

    const box = delimiterBox(paths, [pathIndex]);
    if (!box) return null;
    return {
        ...box,
        kind: sign < 0 ? 'round-open' : 'round-close',
        pathIndexes: [pathIndex],
        score: Math.abs(0.24 - width / height) +
            Math.abs(topEndpoint.x - bottomEndpoint.x) / height +
            (1 - sideSymmetry) * 0.2
    };
}

function singleSquareDelimiterCandidate(
    paths: readonly OcrSymbolPath[],
    pathIndex: number
): DelimiterCandidate | null {
    const geometry = polylineGeometry(paths[pathIndex]);
    if (!geometry) return null;

    const width = geometry.box.x1 - geometry.box.x0;
    const height = geometry.box.y1 - geometry.box.y0;
    if (height < geometry.strokeWidth * 6 || height <= EPSILON) return null;
    if (width < Math.max(geometry.strokeWidth * 2, height * 0.09) ||
        width > height * 0.52) return null;

    const first = geometry.points[0];
    const last = geometry.points[geometry.points.length - 1];
    const topEndpoint = first.y <= last.y ? first : last;
    const bottomEndpoint = first.y <= last.y ? last : first;
    const endTolerance = Math.max(geometry.strokeWidth * 1.5, height * 0.06);
    if (topEndpoint.y - geometry.box.y0 > endTolerance ||
        geometry.box.y1 - bottomEndpoint.y > endTolerance) return null;
    if (bottomEndpoint.y - topEndpoint.y < height * 0.88) return null;
    if (Math.abs(topEndpoint.x - bottomEndpoint.x) >
        Math.max(geometry.strokeWidth * 1.5, width * 0.18)) return null;
    if (height / Math.max(geometry.verticalTravel, EPSILON) < 0.92) return null;

    const railSamples = geometry.samples.filter(point => {
        const y = relativeY(point, geometry.box.y0, height);
        return y >= 0.18 && y <= 0.82;
    });
    if (railSamples.length < 8) return null;
    const railX = median(railSamples.map(point => point.x));
    const railResiduals = railSamples
        .map(point => Math.abs(point.x - railX))
        .sort((left, right) => left - right);
    const railP90 = railResiduals[Math.floor((railResiduals.length - 1) * 0.9)];
    if (railP90 > Math.max(geometry.strokeWidth * 1.5, height * 0.035)) return null;

    const tipX = (topEndpoint.x + bottomEndpoint.x) / 2;
    const reach = tipX - railX;
    const absoluteReach = Math.abs(reach);
    if (absoluteReach < Math.max(geometry.strokeWidth * 2, height * 0.09) ||
        absoluteReach > height * 0.52) return null;

    const bandHeight = Math.max(geometry.strokeWidth * 2.5, height * 0.13);
    const topArm = geometry.samples.filter(point =>
        point.y <= geometry.box.y0 + bandHeight
    );
    const bottomArm = geometry.samples.filter(point =>
        point.y >= geometry.box.y1 - bandHeight
    );
    const armSpan = (samples: readonly OcrSymbolPoint[]): number => {
        if (!samples.length) return 0;
        const xs = samples.map(point => point.x);
        return Math.max(...xs) - Math.min(...xs);
    };
    const topSpan = armSpan(topArm);
    const bottomSpan = armSpan(bottomArm);
    if (topSpan < absoluteReach * 0.78 || bottomSpan < absoluteReach * 0.78) {
        return null;
    }

    const expectedLength = height + topSpan + bottomSpan;
    if (geometry.length < height + absoluteReach * 1.25 ||
        geometry.length > expectedLength * 1.22) return null;

    const box = delimiterBox(paths, [pathIndex]);
    if (!box) return null;
    return {
        ...box,
        kind: reach > 0 ? 'square-open' : 'square-close',
        pathIndexes: [pathIndex],
        score: railP90 / height +
            Math.abs(topSpan - bottomSpan) / Math.max(absoluteReach, EPSILON) * 0.1
    };
}

/**
 * Classifies one path as a handwritten vertical symbol using vector geometry.
 *
 * The result is deliberately conservative: only a straight, isolated stem is
 * a `hookless-bar`. A clear one-sided shoulder at the top, either in the same
 * path or in a separate path, is a `hooked-one`. Nearby branches and borderline
 * shapes remain `ambiguous` so callers never silently turn a four or plus into
 * a bar. Path-array order and point direction do not affect the classification.
 */
export function classifyOcrVerticalSymbolPath(
    paths: readonly OcrSymbolPath[],
    targetIndex: number
): OcrVerticalGlyphKind {
    if (!Number.isInteger(targetIndex) || targetIndex < 0 || targetIndex >= paths.length) {
        return 'other';
    }

    const target = polylineGeometry(paths[targetIndex]);
    if (!target) return 'other';

    const height = target.box.y1 - target.box.y0;
    // Responsive canvas coordinates scale while the selected pen width stays
    // device-sized. Short carry ones from the reported half-scale canvas are
    // still legible at about 5.7 stroke widths.
    if (height < target.strokeWidth * 5.5 || height <= EPSILON) return 'other';

    if (hasSamePathOneTopology(target)) {
        return hasTouchingPath(paths, targetIndex, target)
            ? 'ambiguous'
            : 'hooked-one';
    }

    const fit = fitVerticalStem(target.samples, target.box.y0, height);
    if (!fit || Math.abs(fit.slope) > 0.65) return 'other';

    const broadRmsLimit = Math.max(target.strokeWidth * 2, height * 0.06);
    const broadP90Limit = Math.max(target.strokeWidth * 2.8, height * 0.09);
    if (fit.rmsResidual > broadRmsLimit || fit.p90Residual > broadP90Limit) {
        return 'other';
    }

    const confidentStem = fit.rmsResidual <= Math.max(target.strokeWidth, height * 0.025) &&
        fit.p90Residual <= Math.max(target.strokeWidth * 1.5, height * 0.04);
    if (!confidentStem) return 'ambiguous';

    const weakReach = Math.max(target.strokeWidth * 1.2, height * 0.045);
    const strongReach = Math.max(target.strokeWidth * 2.2, height * 0.085);
    const axisTolerance = Math.max(target.strokeWidth * 1.6, height * 0.025);
    let positiveTopReach = 0;
    let negativeTopReach = 0;
    let bodyReach = 0;
    let hasTopAxisContact = false;
    for (const point of target.samples) {
        const relativeY = (point.y - target.box.y0) / height;
        const distance = signedStemDistance(fit, point);
        if (relativeY <= 0.48) {
            positiveTopReach = Math.max(positiveTopReach, distance);
            negativeTopReach = Math.max(negativeTopReach, -distance);
            if (relativeY >= -0.02 && Math.abs(distance) <= axisTolerance) {
                hasTopAxisContact = true;
            }
        } else if (relativeY <= 0.92) {
            bodyReach = Math.max(bodyReach, Math.abs(distance));
        }
    }

    const topReach = Math.max(positiveTopReach, negativeTopReach);
    const oppositeTopReach = Math.min(positiveTopReach, negativeTopReach);
    let separateHook = false;
    let ambiguousAttachment = false;
    for (let index = 0; index < paths.length; index++) {
        if (index === targetIndex) continue;
        const other = polylineGeometry(paths[index]);
        if (!other) continue;

        const combinedStrokeWidth = Math.max(target.strokeWidth, other.strokeWidth);
        const nearTolerance = Math.max(combinedStrokeWidth * 1.75, height * 0.025);
        const evidence = other.samples.map(point => ({
            relativeY: (point.y - target.box.y0) / height,
            distance: signedStemDistance(fit, point)
        })).filter(sample => sample.relativeY >= -0.18 && sample.relativeY <= 1.15);
        const nearAxis = evidence.filter(sample => Math.abs(sample.distance) <= nearTolerance);
        if (nearAxis.length === 0) continue;

        const touchesMiddle = nearAxis.some(sample =>
            sample.relativeY > 0.30 && sample.relativeY < 0.94
        );
        const touchesBottom = nearAxis.some(sample => sample.relativeY >= 0.94);
        const touchesTop = nearAxis.some(sample => sample.relativeY <= 0.30);
        if (touchesMiddle || touchesBottom || !touchesTop) {
            ambiguousAttachment = true;
            continue;
        }

        let positiveReach = 0;
        let negativeReach = 0;
        for (const sample of evidence) {
            positiveReach = Math.max(positiveReach, sample.distance);
            negativeReach = Math.max(negativeReach, -sample.distance);
        }
        const lateralReach = Math.max(positiveReach, negativeReach);
        const oppositeReach = Math.min(positiveReach, negativeReach);
        const branchWidth = other.box.x1 - other.box.x0;
        const branchHeight = other.box.y1 - other.box.y0;
        const relativeTop = (other.box.y0 - target.box.y0) / height;
        const relativeBottom = (other.box.y1 - target.box.y0) / height;
        const topLocal = relativeTop >= -0.3 &&
            relativeBottom >= 0.12 && relativeBottom <= 0.68;
        const meaningfulBranch = other.length >= Math.max(combinedStrokeWidth * 1.5, height * 0.025) &&
            other.length <= height * 0.85 &&
            branchWidth >= Math.max(combinedStrokeWidth * 1.5, height * 0.045) &&
            branchWidth >= branchHeight * 0.25 &&
            branchHeight >= Math.max(combinedStrokeWidth, height * 0.08) &&
            other.chord / Math.max(other.length, EPSILON) >= 0.84;
        if (
            topLocal &&
            meaningfulBranch &&
            lateralReach >= strongReach &&
            oppositeReach <= weakReach
        ) {
            separateHook = true;
        } else {
            ambiguousAttachment = true;
        }
    }

    // A crossbar wins over hook evidence. This is the conservative distinction
    // needed for separately drawn fours and plus signs.
    if (ambiguousAttachment) return 'ambiguous';
    if (separateHook) return 'hooked-one';
    if (topReach > weakReach || bodyReach > weakReach) return 'ambiguous';

    const residual = residualSummary(target.samples, fit);
    const straightEnough = residual.rms <= Math.max(target.strokeWidth * 0.85, height * 0.018) &&
        residual.p95 <= Math.max(target.strokeWidth * 1.25, height * 0.03) &&
        residual.maximum <= Math.max(target.strokeWidth * 1.8, height * 0.04);
    const directEnough = target.chord / target.length >= 0.94;
    const monotoneEnough = height / Math.max(target.verticalTravel, EPSILON) >= 0.92;
    return straightEnough && directEnough && monotoneEnough
        ? 'hookless-bar'
        : 'ambiguous';
}

function lineStroke(path: OcrSymbolPath, index: number): LineStroke | null {
    const points = finitePoints(path);
    if (points.length < 2) return null;

    let x0 = points[0].x;
    let y0 = points[0].y;
    let x1 = points[0].x;
    let y1 = points[0].y;
    let length = 0;
    for (let pointIndex = 1; pointIndex < points.length; pointIndex++) {
        const previous = points[pointIndex - 1];
        const point = points[pointIndex];
        length += Math.hypot(point.x - previous.x, point.y - previous.y);
        x0 = Math.min(x0, point.x);
        y0 = Math.min(y0, point.y);
        x1 = Math.max(x1, point.x);
        y1 = Math.max(y1, point.y);
    }
    const first = points[0];
    const last = points[points.length - 1];
    const displacement = Math.hypot(last.x - first.x, last.y - first.y);
    const strokeWidth = Number.isFinite(path.strokeWidth) && Number(path.strokeWidth) > 0
        ? Number(path.strokeWidth)
        : 1;
    const width = x1 - x0;
    const height = y1 - y0;
    const straightness = length > EPSILON ? displacement / length : 0;
    if (straightness < 0.82) return null;

    let kind: LineKind;
    if (width >= Math.max(strokeWidth * 2.5, height * 3)) {
        kind = 'horizontal';
    } else if (height >= Math.max(strokeWidth * 2.5, width * 3)) {
        kind = 'vertical';
    } else {
        return null;
    }

    return {
        index,
        kind,
        box: { x0, y0, x1, y1 },
        centerX: (x0 + x1) / 2,
        centerY: (y0 + y1) / 2,
        width,
        height,
        strokeWidth
    };
}

function calculationRuleStroke(
    path: OcrSymbolPath,
    index: number,
    minimumStrokeWidths = 12
): CalculationRuleStroke | null {
    const geometry = polylineGeometry(path);
    if (!geometry) return null;

    const width = geometry.box.x1 - geometry.box.x0;
    const height = geometry.box.y1 - geometry.box.y0;
    if (
        width < geometry.strokeWidth * minimumStrokeWidths ||
        width < Math.max(height * 9, EPSILON)
    ) {
        return null;
    }

    let horizontalTravel = 0;
    for (let pointIndex = 1; pointIndex < geometry.points.length; pointIndex++) {
        horizontalTravel += Math.abs(
            geometry.points[pointIndex].x - geometry.points[pointIndex - 1].x
        );
    }
    const first = geometry.points[0];
    const last = geometry.points[geometry.points.length - 1];
    const endpointRise = Math.abs(last.y - first.y);
    const horizontalEfficiency = width / Math.max(horizontalTravel, EPSILON);
    const directness = geometry.chord / Math.max(geometry.length, EPSILON);

    // A long rule may wobble, but it should still progress predominantly in
    // one horizontal direction. All quantities are unsigned, so reversing the
    // path has no effect.
    if (
        horizontalEfficiency < 0.84 ||
        directness < 0.88 ||
        // A school calculation rule only needs to be predominantly
        // horizontal. On a wide canvas a natural left-to-right hand motion
        // can easily drift by six or seven percent while remaining a clear
        // separator. The aspect-ratio, directness and travel checks above and
        // below still reject diagonal glyph strokes and irregular scribbles.
        endpointRise > Math.max(geometry.strokeWidth * 3, width * 0.08) ||
        geometry.verticalTravel > Math.max(geometry.strokeWidth * 8, width * 0.16)
    ) {
        return null;
    }

    return {
        index,
        geometry,
        centerY: (geometry.box.y0 + geometry.box.y1) / 2,
        width
    };
}

function calculationRuleGroup(
    paths: readonly OcrSymbolPath[],
    strokes: CalculationRuleStroke[]
): CalculationRuleGroup | null {
    const pathIndexes = strokes.map(stroke => stroke.index);
    const box = delimiterBox(paths, pathIndexes);
    if (!box) return null;
    const totalWidth = strokes.reduce((total, stroke) => total + stroke.width, 0);
    const centerY = strokes.reduce(
        (total, stroke) => total + stroke.centerY * stroke.width,
        0
    ) / Math.max(totalWidth, EPSILON);
    return {
        strokes,
        box,
        centerY,
        width: box.x1 - box.x0
    };
}

function groupCalculationRuleStrokes(
    paths: readonly OcrSymbolPath[],
    strokes: readonly CalculationRuleStroke[]
): CalculationRuleGroup[] {
    const groups: CalculationRuleGroup[] = [];
    const ordered = Array.from(strokes).sort((left, right) =>
        left.centerY - right.centerY ||
        left.geometry.box.x0 - right.geometry.box.x0
    );

    for (const stroke of ordered) {
        let selectedIndex = -1;
        for (let index = 0; index < groups.length; index++) {
            const group = groups[index];
            const maximumStrokeWidth = Math.max(
                stroke.geometry.strokeWidth,
                ...group.strokes.map(entry => entry.geometry.strokeWidth)
            );
            const verticalTolerance = Math.max(
                maximumStrokeWidth * 3,
                Math.min(group.width, stroke.width) * 0.035
            );
            if (Math.abs(group.centerY - stroke.centerY) > verticalTolerance) {
                continue;
            }

            const horizontalGap = Math.max(
                0,
                group.box.x0 - stroke.geometry.box.x1,
                stroke.geometry.box.x0 - group.box.x1
            );
            const gapTolerance = Math.max(
                maximumStrokeWidth * 5,
                Math.min(group.width, stroke.width) * 0.12
            );
            if (horizontalGap <= gapTolerance) {
                selectedIndex = index;
                break;
            }
        }

        if (selectedIndex < 0) {
            const group = calculationRuleGroup(paths, [stroke]);
            if (group) groups.push(group);
            continue;
        }
        const replacement = calculationRuleGroup(
            paths,
            [...groups[selectedIndex].strokes, stroke]
        );
        if (replacement) groups[selectedIndex] = replacement;
    }
    return groups;
}

function quantile(values: readonly number[], fraction: number): number {
    if (!values.length) return 0;
    const sorted = Array.from(values).sort((left, right) => left - right);
    const index = Math.max(
        0,
        Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * fraction))
    );
    return sorted[index];
}

function representativeInkHeight(
    geometries: readonly PolylineGeometry[]
): number {
    const heights: number[] = [];
    for (const geometry of geometries) {
        const width = geometry.box.x1 - geometry.box.x0;
        const height = geometry.box.y1 - geometry.box.y0;
        const looksGlyphSized = height >= geometry.strokeWidth * 4 &&
            width <= height * 2.2;
        if (looksGlyphSized) heights.push(height);
    }
    // Three glyph-sized paths are the minimum useful evidence for a written
    // calculation stack. The upper quantile keeps small carry marks from
    // defining the normal operand height.
    return heights.length >= 3 ? quantile(heights, 0.68) : 0;
}

function clusterInkBands(
    geometries: readonly PolylineGeometry[],
    representativeHeight: number
): InkBand[] {
    const entries = geometries.map(geometry => {
        const box = geometry.box;
        return {
            box,
            centerY: (box.y0 + box.y1) / 2,
            height: box.y1 - box.y0
        };
    }).sort((left, right) => left.centerY - right.centerY);
    const tolerance = representativeHeight * 0.48;
    const bands: InkBand[] = [];

    for (const entry of entries) {
        const previous = bands[bands.length - 1];
        if (!previous || entry.centerY - previous.centerY > tolerance) {
            bands.push({
                boxes: [entry.box],
                centerY: entry.centerY,
                maximumHeight: entry.height,
                x0: entry.box.x0,
                x1: entry.box.x1
            });
            continue;
        }
        previous.boxes.push(entry.box);
        previous.centerY = previous.boxes.reduce(
            (total, box) => total + (box.y0 + box.y1) / 2,
            0
        ) / previous.boxes.length;
        previous.maximumHeight = Math.max(previous.maximumHeight, entry.height);
        previous.x0 = Math.min(previous.x0, entry.box.x0);
        previous.x1 = Math.max(previous.x1, entry.box.x1);
    }
    return bands;
}

function hasCompactMultiplicationDot(
    band: InkBand,
    geometries: readonly PolylineGeometry[],
    representativeHeight: number
): boolean {
    const members = geometries.filter(geometry => {
        const centerY = (geometry.box.y0 + geometry.box.y1) / 2;
        return Math.abs(centerY - band.centerY) <= representativeHeight * 0.48;
    });
    const fullSize = members.filter(geometry =>
        geometry.box.y1 - geometry.box.y0 >= representativeHeight * 0.55
    );
    if (fullSize.length < 2) return false;

    // The stored polylines describe pen centres, while the learner sees their
    // complete round-capped footprints. More importantly, a filled dot is
    // often made from several overlapping paths. Evaluate all operator-height
    // ink in one gap together, rather than allowing any old tiny path to remain
    // an existential dot proof after a minus or equals sign is drawn around it.
    const fullSizeSet = new Set(fullSize);
    const compact = members
        .filter(geometry => !fullSizeSet.has(geometry))
        .map(geometry => {
            const halfStroke = geometry.strokeWidth / 2;
            return {
                geometry,
                box: {
                    x0: geometry.box.x0 - halfStroke,
                    y0: geometry.box.y0 - halfStroke,
                    x1: geometry.box.x1 + halfStroke,
                    y1: geometry.box.y1 + halfStroke
                }
            };
        });
    if (!compact.length) return false;

    const fullCentersY = fullSize.map(geometry =>
        (geometry.box.y0 + geometry.box.y1) / 2
    ).sort((left, right) => left - right);
    const typicalCenterY = fullCentersY[
        Math.floor((fullCentersY.length - 1) / 2)
    ];
    const orderedFullSize = [...fullSize].sort((left, right) =>
        (left.box.x0 + left.box.x1) - (right.box.x0 + right.box.x1)
    );

    for (let index = 0; index < orderedFullSize.length - 1; index++) {
        const left = orderedFullSize[index];
        const right = orderedFullSize[index + 1];
        if (left.box.x1 >= right.box.x0) continue;

        const operatorInk = compact.filter(entry => {
            const centerY = (entry.box.y0 + entry.box.y1) / 2;
            return entry.box.x0 > left.box.x1 &&
                entry.box.x1 < right.box.x0 &&
                Math.abs(centerY - typicalCenterY) <=
                    representativeHeight * 0.42;
        });
        if (!operatorInk.length) continue;

        const x0 = Math.min(...operatorInk.map(entry => entry.box.x0));
        const y0 = Math.min(...operatorInk.map(entry => entry.box.y0));
        const x1 = Math.max(...operatorInk.map(entry => entry.box.x1));
        const y1 = Math.max(...operatorInk.map(entry => entry.box.y1));
        const width = x1 - x0;
        const height = y1 - y0;
        const maximumStrokeWidth = Math.max(
            ...operatorInk.map(entry => entry.geometry.strokeWidth)
        );
        const minimumSize = maximumStrokeWidth * 0.75;
        if (width < minimumSize || height < minimumSize) continue;

        const aspect = width / Math.max(height, EPSILON);
        const isSmallDot = width <= representativeHeight * 0.32 &&
            height <= representativeHeight * 0.32 &&
            aspect >= 0.35 && aspect <= 2.8;
        const hasRoundedTrace = operatorInk.some(entry =>
            entry.geometry.chord /
                Math.max(entry.geometry.length, EPSILON) <= 0.72
        ) || operatorInk.every(entry =>
            entry.geometry.length <= entry.geometry.strokeWidth * 2.4
        );
        const isLargeRoundedDot = width <= representativeHeight * 0.45 &&
            height <= representativeHeight * 0.45 &&
            Math.min(width, height) / Math.max(width, height) >= 0.55 &&
            hasRoundedTrace;
        if (isSmallDot || isLargeRoundedDot) return true;
    }
    return false;
}

function hasCalculationStackGeometry(
    group: CalculationRuleGroup,
    geometries: readonly PolylineGeometry[],
    context: OcrCalculationRuleContext
): boolean {
    const horizontallyRelevant = geometries.filter(geometry =>
        geometry.box.x1 >= group.box.x0 &&
        geometry.box.x0 <= group.box.x1
    );
    const representativeHeight = representativeInkHeight(horizontallyRelevant);
    if (representativeHeight <= EPSILON) return false;

    const maximumStrokeWidth = Math.max(
        ...group.strokes.map(stroke => stroke.geometry.strokeWidth)
    );
    if (
        group.width < Math.max(
            maximumStrokeWidth * 12,
            representativeHeight * 2.15
        )
    ) {
        return false;
    }

    const nearby = horizontallyRelevant.filter(geometry => {
        const centerY = (geometry.box.y0 + geometry.box.y1) / 2;
        return Math.abs(centerY - group.centerY) <= representativeHeight * 5.5;
    });
    const bands = clusterInkBands(nearby, representativeHeight);
    const minimumBandSpan = representativeHeight * 0.35;
    const primaryBands = bands.filter(band =>
        band.maximumHeight >= representativeHeight * 0.72 &&
        band.x1 - band.x0 >= minimumBandSpan
    );
    const sideTolerance = Math.max(
        maximumStrokeWidth * 2,
        representativeHeight * 0.08
    );
    const above = primaryBands
        .filter(band => band.centerY < group.centerY - sideTolerance)
        .sort((left, right) => right.centerY - left.centerY);
    const below = primaryBands
        .filter(band => band.centerY > group.centerY + sideTolerance)
        .sort((left, right) => left.centerY - right.centerY);

    const allowSingleMultiplicationRow =
        context.allowSingleMultiplicationRow === true;
    const minimumRowsAbove = allowSingleMultiplicationRow ? 1 : 2;
    if (above.length < minimumRowsAbove || below.length < 1) return false;
    const nearestAbove = group.centerY - above[0].centerY;
    const nearestBelow = below[0].centerY - group.centerY;
    if (nearestAbove > representativeHeight * 1.95 ||
        nearestBelow > representativeHeight * 1.95) return false;
    if (above.length < 2) {
        return allowSingleMultiplicationRow &&
            hasCompactMultiplicationDot(
                above[0],
                nearby,
                representativeHeight
            );
    }
    const secondAbove = group.centerY - above[1].centerY;
    const maximumSecondAboveDistance = Number.isFinite(
        context.maximumSecondAboveDistance
    )
        ? Math.max(3.6, Math.min(4.5, Number(
            context.maximumSecondAboveDistance
        )))
        : 3.6;
    return (
        // The first operand in a four-row school layout can sit slightly
        // higher when the carry row is written close to the rule. The exact
        // reported stack needs 3.51 glyph heights; both full-size-row checks
        // above still prevent a small annotation from satisfying this slot.
        secondAbove <= representativeHeight * maximumSecondAboveDistance
    );
}

/**
 * Finds long handwritten rules that separate operands from a result.
 *
 * The detector is scale-, path-order-, and point-direction-invariant. It is
 * intentionally contextual: a candidate must be much longer than normal
 * glyphs and have two full-size ink bands above it plus one below it. This
 * rejects ordinary minus signs and the common one-line numerator/denominator
 * fraction layout. Pure geometry cannot distinguish a calculation rule from a
 * visually identical bar surrounded by several stacked fraction rows; callers
 * should combine these hints with the recognized task when that ambiguity is
 * possible.
 */
export function findOcrCalculationRuleHints(
    paths: readonly OcrSymbolPath[],
    options: OcrCalculationRuleContext = {}
): OcrCalculationRuleHint[] {
    const geometries = paths.map(path => polylineGeometry(path));
    const strokes = paths
        .map((path, index) => calculationRuleStroke(path, index))
        .filter((stroke): stroke is CalculationRuleStroke => Boolean(stroke));
    const excludedIndexes = new Set(strokes.map(stroke => stroke.index));
    const geometryContext = geometries.filter(
        (geometry, index): geometry is PolylineGeometry =>
            Boolean(geometry) && !excludedIndexes.has(index)
    );
    const groups = groupCalculationRuleStrokes(paths, strokes)
        .filter(group => hasCalculationStackGeometry(
            group,
            geometryContext,
            options
        ))
        .sort((left, right) =>
            left.centerY - right.centerY || left.box.x0 - right.box.x0
        );

    return groups.map(group => ({
        ...group.box,
        pathIndexes: group.strokes
            .map(stroke => stroke.index)
            .sort((left, right) => left - right)
    }));
}

function bandOverlapWithRule(band: InkBand, group: CalculationRuleGroup): number {
    return Math.max(
        0,
        Math.min(band.x1, group.box.x1) - Math.max(band.x0, group.box.x0)
    );
}

function hasDivisionUnderlineGeometry(
    group: CalculationRuleGroup,
    geometries: readonly PolylineGeometry[]
): boolean {
    const horizontallyRelevant = geometries.filter(geometry =>
        geometry.box.x1 >= group.box.x0 - group.width * 0.35 &&
        geometry.box.x0 <= group.box.x1 + group.width * 0.35
    );
    const representativeHeight = representativeInkHeight(horizontallyRelevant);
    if (representativeHeight <= EPSILON) return false;

    const maximumStrokeWidth = Math.max(
        ...group.strokes.map(stroke => stroke.geometry.strokeWidth)
    );
    if (group.width < Math.max(maximumStrokeWidth * 5.5, representativeHeight * 0.42)) {
        return false;
    }

    const nearby = horizontallyRelevant.filter(geometry => {
        const centerY = (geometry.box.y0 + geometry.box.y1) / 2;
        return Math.abs(centerY - group.centerY) <= representativeHeight * 2.2;
    });
    const primaryBands = clusterInkBands(nearby, representativeHeight).filter(band =>
        band.maximumHeight >= representativeHeight * 0.68 &&
        band.x1 - band.x0 >= representativeHeight * 0.22
    );
    const above = primaryBands
        .filter(band => band.centerY < group.centerY)
        .sort((left, right) => right.centerY - left.centerY)[0];
    const below = primaryBands
        .filter(band => band.centerY > group.centerY)
        .sort((left, right) => left.centerY - right.centerY)[0];
    if (!above || !below) return false;

    const aboveDistance = group.centerY - above.centerY;
    const belowDistance = below.centerY - group.centerY;
    const minimumOverlap = Math.min(group.width * 0.22, representativeHeight * 0.22);
    return aboveDistance >= representativeHeight * 0.30 &&
        aboveDistance <= representativeHeight * 1.18 &&
        belowDistance >= representativeHeight * 0.30 &&
        belowDistance <= representativeHeight * 1.85 &&
        bandOverlapWithRule(above, group) >= minimumOverlap &&
        bandOverlapWithRule(below, group) >= minimumOverlap;
}

/**
 * Finds the short horizontal rules in a written long-division stack.
 *
 * Unlike a final calculation rule, each candidate needs one full digit band
 * immediately above and the next partial-dividend/remainder band below. This
 * rejects the subtraction sign on the same baseline as well as separate
 * crossbars in handwritten 4 and 7 glyphs. Callers must opt into this
 * interpretation only for a division prompt.
 */
export function findOcrDivisionRuleHints(
    paths: readonly OcrSymbolPath[]
): OcrDivisionRuleHint[] {
    const geometries = paths.map(path => polylineGeometry(path));
    const strokes = paths
        .map((path, index) => calculationRuleStroke(path, index, 5.5))
        .filter((stroke): stroke is CalculationRuleStroke => Boolean(stroke));
    const excludedIndexes = new Set(strokes.map(stroke => stroke.index));
    const context = geometries.filter(
        (geometry, index): geometry is PolylineGeometry =>
            Boolean(geometry) && !excludedIndexes.has(index)
    );
    return groupCalculationRuleStrokes(paths, strokes)
        .filter(group => hasDivisionUnderlineGeometry(group, context))
        .sort((left, right) =>
            left.centerY - right.centerY || left.box.x0 - right.box.x0
        )
        .map(group => ({
            ...group.box,
            pathIndexes: group.strokes
                .map(stroke => stroke.index)
                .sort((left, right) => left - right)
        }));
}

type HookedOneComponent = {
    box: OcrSymbolBox;
    pathIndexes: number[];
    stemX: number;
};

function intervalGap(
    fromA: number,
    toA: number,
    fromB: number,
    toB: number
): number {
    return Math.max(0, fromA - toB, fromB - toA);
}

function hookedOneComponents(
    paths: readonly OcrSymbolPath[]
): HookedOneComponent[] {
    const geometries = paths.map(path => polylineGeometry(path));
    const components: HookedOneComponent[] = [];
    const keys = new Set<string>();

    for (let targetIndex = 0; targetIndex < paths.length; targetIndex++) {
        const target = geometries[targetIndex];
        if (!target) continue;
        const height = target.box.y1 - target.box.y0;
        if (height <= EPSILON) continue;
        const stemFit = fitVerticalStem(target.samples, target.box.y0, height);
        if (!stemFit) continue;

        const neighborhood = [targetIndex];
        for (let otherIndex = 0; otherIndex < paths.length; otherIndex++) {
            if (otherIndex === targetIndex) continue;
            const other = geometries[otherIndex];
            if (!other) continue;
            const horizontalGap = intervalGap(
                target.box.x0,
                target.box.x1,
                other.box.x0,
                other.box.x1
            );
            const verticalGap = intervalGap(
                target.box.y0,
                target.box.y1,
                other.box.y0,
                other.box.y1
            );
            const tolerance = Math.max(
                target.strokeWidth,
                other.strokeWidth
            ) * 2.25 + height * 0.08;
            if (horizontalGap <= tolerance && verticalGap <= height * 0.18) {
                neighborhood.push(otherIndex);
            }
        }

        const localPaths = neighborhood.map(index => paths[index]);
        if (classifyOcrVerticalSymbolPath(localPaths, 0) !== 'hooked-one') {
            continue;
        }

        const pathIndexes = [targetIndex];
        if (classifyOcrVerticalSymbolPath([paths[targetIndex]], 0) !== 'hooked-one') {
            for (let localIndex = 1; localIndex < neighborhood.length; localIndex++) {
                if (
                    classifyOcrVerticalSymbolPath(
                        [paths[targetIndex], paths[neighborhood[localIndex]]],
                        0
                    ) === 'hooked-one'
                ) {
                    pathIndexes.push(neighborhood[localIndex]);
                }
            }
        }
        pathIndexes.sort((left, right) => left - right);
        const key = pathIndexes.join(',');
        if (keys.has(key)) continue;
        const box = delimiterBox(paths, pathIndexes);
        if (!box) continue;
        const stemY = target.box.y0 + height * 0.75;
        const stemX = stemFit.slope * stemY + stemFit.intercept;
        if (!Number.isFinite(stemX)) continue;
        keys.add(key);
        components.push({ box, pathIndexes, stemX });
    }

    return components.sort((left, right) => {
        const leftCenterY = (left.box.y0 + left.box.y1) / 2;
        const rightCenterY = (right.box.y0 + right.box.y1) / 2;
        return leftCenterY - rightCenterY || left.box.x0 - right.box.x0;
    });
}

/**
 * Locates clear, small hooked numeral ones inside a detected calculation
 * stack. Full-height operand ones are deliberately excluded.
 *
 * This is a hint rather than a digit recognizer: hookless carry marks remain
 * ambiguous with vertical bars, and unusually small operand digits can still
 * be indistinguishable without OCR semantics. Passing already computed rules
 * avoids repeating rule detection.
 */
export function findOcrCarryOneHints(
    paths: readonly OcrSymbolPath[],
    calculationRules: readonly OcrCalculationRuleHint[] =
        findOcrCalculationRuleHints(paths)
): OcrCarryOneHint[] {
    if (!calculationRules.length) return [];

    const geometries = paths.map(path => polylineGeometry(path));
    const excludedRulePaths = new Set<number>();
    for (const rule of calculationRules) {
        for (const pathIndex of rule.pathIndexes) {
            excludedRulePaths.add(pathIndex);
        }
    }
    const components = hookedOneComponents(paths);
    const hints: OcrCarryOneHint[] = [];

    for (const component of components) {
        if (component.pathIndexes.some(index => excludedRulePaths.has(index))) {
            continue;
        }
        // delimiterBox includes half a stroke width above and below the raw
        // paths, while representativeInkHeight deliberately uses raw path
        // bounds. Compare like with like so a thicker pen cannot turn the
        // same small carry glyph into a full-size operand glyph.
        const componentGeometries = component.pathIndexes
            .map(index => geometries[index])
            .filter((geometry): geometry is PolylineGeometry => Boolean(geometry));
        if (!componentGeometries.length) continue;
        const componentHeight = Math.max(
            ...componentGeometries.map(geometry => geometry.box.y1)
        ) - Math.min(
            ...componentGeometries.map(geometry => geometry.box.y0)
        );
        const componentCenterX = (component.box.x0 + component.box.x1) / 2;
        const componentCenterY = (component.box.y0 + component.box.y1) / 2;
        let bestRule: {
            rule: OcrCalculationRuleHint;
            distance: number;
        } | null = null;

        for (const rule of calculationRules) {
            const ruleCenterY = (rule.y0 + rule.y1) / 2;
            const nearbyGeometry: PolylineGeometry[] = [];
            for (let index = 0; index < geometries.length; index++) {
                const geometry = geometries[index];
                if (
                    !geometry ||
                    excludedRulePaths.has(index) ||
                    geometry.box.x1 < rule.x0 ||
                    geometry.box.x0 > rule.x1
                ) {
                    continue;
                }
                nearbyGeometry.push(geometry);
            }
            const representativeHeight = representativeInkHeight(nearbyGeometry);
            if (representativeHeight <= EPSILON) continue;
            if (
                componentHeight < representativeHeight * 0.18 ||
                componentHeight >= representativeHeight * 0.72
            ) {
                continue;
            }
            if (
                componentCenterX < rule.x0 - representativeHeight * 0.12 ||
                componentCenterX > rule.x1 + representativeHeight * 0.12
            ) {
                continue;
            }

            const distance = ruleCenterY - componentCenterY;
            if (
                distance < representativeHeight * 0.12 ||
                distance > representativeHeight * 4.5
            ) {
                continue;
            }
            if (!bestRule || distance < bestRule.distance) {
                bestRule = { rule, distance };
            }
        }

        if (!bestRule) continue;
        hints.push({
            ...component.box,
            pathIndexes: component.pathIndexes,
            stemX: component.stemX,
            rulePathIndexes: Array.from(bestRule.rule.pathIndexes)
        });
    }
    return hints;
}

type SquareArm = {
    line: LineStroke;
    direction: -1 | 1;
    reach: number;
    tipX: number;
};

function squareArmAt(
    line: LineStroke,
    rail: LineStroke,
    edgeY: number
): SquareArm | null {
    if (line.kind !== 'horizontal') return null;
    const tolerance = Math.max(
        line.strokeWidth,
        rail.strokeWidth
    ) * 2 + rail.height * 0.025;
    if (Math.abs(line.centerY - edgeY) > tolerance) return null;
    if (line.width < Math.max(tolerance, rail.height * 0.09) ||
        line.width > rail.height * 0.55) return null;
    if (line.box.x1 < rail.centerX - tolerance ||
        line.box.x0 > rail.centerX + tolerance) return null;

    const leftReach = rail.centerX - line.box.x0;
    const rightReach = line.box.x1 - rail.centerX;
    const direction: -1 | 1 = rightReach >= leftReach ? 1 : -1;
    const reach = Math.max(leftReach, rightReach);
    const oppositeReach = Math.min(leftReach, rightReach);
    if (reach < Math.max(tolerance, rail.height * 0.09) ||
        oppositeReach > Math.max(tolerance, reach * 0.22)) return null;
    return {
        line,
        direction,
        reach,
        tipX: direction > 0 ? line.box.x1 : line.box.x0
    };
}

function multiStrokeSquareCandidates(
    paths: readonly OcrSymbolPath[],
    lines: readonly LineStroke[]
): DelimiterCandidate[] {
    const horizontals = lines.filter(line => line.kind === 'horizontal');
    const verticals = lines.filter(line => line.kind === 'vertical');
    const candidates: DelimiterCandidate[] = [];

    for (const rail of verticals) {
        if (rail.height < rail.strokeWidth * 6) continue;
        const topArms = horizontals
            .map(line => squareArmAt(line, rail, rail.box.y0))
            .filter((arm): arm is SquareArm => Boolean(arm));
        const bottomArms = horizontals
            .map(line => squareArmAt(line, rail, rail.box.y1))
            .filter((arm): arm is SquareArm => Boolean(arm));
        for (const top of topArms) {
            for (const bottom of bottomArms) {
                if (top.line.index === bottom.line.index ||
                    top.direction !== bottom.direction) continue;
                const armRatio = Math.min(top.reach, bottom.reach) /
                    Math.max(top.reach, bottom.reach, EPSILON);
                if (armRatio < 0.58) continue;
                const averageReach = (top.reach + bottom.reach) / 2;
                const tipTolerance = Math.max(
                    top.line.strokeWidth,
                    bottom.line.strokeWidth,
                    rail.strokeWidth
                ) * 2 + averageReach * 0.18;
                if (Math.abs(top.tipX - bottom.tipX) > tipTolerance) continue;
                if (bottom.line.centerY - top.line.centerY < rail.height * 0.78) {
                    continue;
                }

                const pathIndexes = [
                    rail.index,
                    top.line.index,
                    bottom.line.index
                ].sort((left, right) => left - right);
                const box = delimiterBox(paths, pathIndexes);
                if (!box) continue;
                candidates.push({
                    ...box,
                    kind: top.direction > 0 ? 'square-open' : 'square-close',
                    pathIndexes,
                    score: (1 - armRatio) * 0.2 +
                        Math.abs(top.tipX - bottom.tipX) /
                            Math.max(rail.height, EPSILON)
                });
            }
        }
    }
    return candidates;
}

/**
 * Finds vector-confirmed handwritten round and square delimiters.
 *
 * This is intentionally an individual-symbol detector. Pairing an opener with
 * a closer needs line and ink context and is therefore left to the layout
 * layer. Point direction and path-array order do not affect the geometry. A
 * square bracket may be one continuous path or three independent line paths.
 */
export function findOcrDelimiterHints(
    paths: readonly OcrSymbolPath[]
): OcrDelimiterHint[] {
    const candidates: DelimiterCandidate[] = [];
    for (let pathIndex = 0; pathIndex < paths.length; pathIndex++) {
        const round = singleRoundDelimiterCandidate(paths, pathIndex);
        if (round) candidates.push(round);
        const square = singleSquareDelimiterCandidate(paths, pathIndex);
        if (square) candidates.push(square);
    }
    const lines = paths
        .map((path, index) => lineStroke(path, index))
        .filter((line): line is LineStroke => Boolean(line));
    candidates.push(...multiStrokeSquareCandidates(paths, lines));

    candidates.sort((left, right) =>
        left.score - right.score ||
        left.y0 - right.y0 ||
        left.x0 - right.x0
    );
    const usedPaths = new Set<number>();
    const selected: DelimiterCandidate[] = [];
    for (const candidate of candidates) {
        if (candidate.pathIndexes.some(index => usedPaths.has(index))) continue;
        for (const index of candidate.pathIndexes) usedPaths.add(index);
        selected.push(candidate);
    }

    selected.sort((left, right) => {
        const leftHeight = left.y1 - left.y0;
        const rightHeight = right.y1 - right.y0;
        const leftCenterY = (left.y0 + left.y1) / 2;
        const rightCenterY = (right.y0 + right.y1) / 2;
        const sameLineTolerance = Math.min(leftHeight, rightHeight) * 0.35;
        if (Math.abs(leftCenterY - rightCenterY) <= sameLineTolerance) {
            return left.x0 - right.x0 || leftCenterY - rightCenterY;
        }
        return leftCenterY - rightCenterY || left.x0 - right.x0;
    });
    return selected.map(({ score: _score, ...hint }) => hint);
}

function overlap(fromA: number, toA: number, fromB: number, toB: number): number {
    return Math.max(0, Math.min(toA, toB) - Math.max(fromA, fromB));
}

function formsUpperPlus(horizontal: LineStroke, vertical: LineStroke): boolean {
    const tolerance = Math.max(horizontal.strokeWidth, vertical.strokeWidth) * 1.25;
    const horizontalInset = horizontal.width * 0.12;
    const crossesX = vertical.centerX >= horizontal.box.x0 + horizontalInset - tolerance &&
        vertical.centerX <= horizontal.box.x1 - horizontalInset + tolerance;
    const crossesY = horizontal.centerY >= vertical.box.y0 + vertical.height * 0.12 - tolerance &&
        horizontal.centerY <= vertical.box.y1 - vertical.height * 0.12 + tolerance;
    const compatibleSize = vertical.height >= horizontal.width * 0.28 &&
        vertical.height <= horizontal.width * 1.55;
    return crossesX && crossesY && compatibleSize;
}

function formsLowerMinus(top: LineStroke, vertical: LineStroke, bottom: LineStroke): boolean {
    if (bottom.centerY <= top.centerY) return false;

    const averageWidth = (top.width + bottom.width) / 2;
    const widthRatio = bottom.width / Math.max(top.width, EPSILON);
    if (widthRatio < 0.58 || widthRatio > 1.72) return false;

    const horizontalOverlap = overlap(
        top.box.x0,
        top.box.x1,
        bottom.box.x0,
        bottom.box.x1
    );
    if (horizontalOverlap < Math.min(top.width, bottom.width) * 0.62) return false;
    if (Math.abs(top.centerX - bottom.centerX) > averageWidth * 0.28) return false;

    const tolerance = Math.max(top.strokeWidth, vertical.strokeWidth, bottom.strokeWidth) * 1.5;
    const gap = bottom.centerY - top.centerY;
    const minimumGap = Math.max(tolerance, vertical.height * 0.34);
    const maximumGap = averageWidth * 1.45 + tolerance;
    if (gap < minimumGap || gap > maximumGap) return false;

    // The lower line belongs to the minus part, not to the crossing inside
    // the plus. A small overlap caused by pen thickness remains acceptable.
    return bottom.centerY >= vertical.box.y1 - tolerance;
}

function candidateScore(candidate: PlusMinusCandidate): number {
    const { top, vertical, bottom } = candidate;
    const averageWidth = (top.width + bottom.width) / 2;
    const widthDifference = Math.abs(top.width - bottom.width) /
        Math.max(averageWidth, EPSILON);
    const horizontalOffset = Math.abs(top.centerX - bottom.centerX) /
        Math.max(averageWidth, EPSILON);
    const crossingOffset = Math.abs(top.centerX - vertical.centerX) /
        Math.max(top.width, EPSILON);
    const gap = (bottom.centerY - top.centerY) / Math.max(averageWidth, EPSILON);
    return widthDifference + horizontalOffset + crossingOffset + Math.abs(gap - 0.72) * 0.25;
}

function unionBox(strokes: readonly LineStroke[]): OcrSymbolBox {
    let x0 = Infinity;
    let y0 = Infinity;
    let x1 = -Infinity;
    let y1 = -Infinity;
    for (const stroke of strokes) {
        const padding = stroke.strokeWidth / 2;
        x0 = Math.min(x0, stroke.box.x0 - padding);
        y0 = Math.min(y0, stroke.box.y0 - padding);
        x1 = Math.max(x1, stroke.box.x1 + padding);
        y1 = Math.max(y1, stroke.box.y1 + padding);
    }
    return { x0, y0, x1, y1 };
}

/**
 * Finds handwritten plus-minus symbols using vector geometry only.
 *
 * A match requires three independent, nearly straight strokes: an upper
 * horizontal stroke crossed by a vertical stroke, followed by a similarly
 * wide and horizontally aligned lower stroke. The returned boxes include
 * half of each path's stroke width.
 */
export function findOcrPlusMinusBoxes(
    paths: readonly OcrSymbolPath[]
): OcrSymbolBox[] {
    const lines = paths
        .map((path, index) => lineStroke(path, index))
        .filter((line): line is LineStroke => Boolean(line));
    const horizontals = lines.filter(line => line.kind === 'horizontal');
    const verticals = lines.filter(line => line.kind === 'vertical');
    const candidates: PlusMinusCandidate[] = [];

    for (const top of horizontals) {
        for (const vertical of verticals) {
            if (!formsUpperPlus(top, vertical)) continue;
            for (const bottom of horizontals) {
                if (bottom.index === top.index || !formsLowerMinus(top, vertical, bottom)) {
                    continue;
                }
                const candidate = { top, vertical, bottom, score: 0 };
                candidate.score = candidateScore(candidate);
                candidates.push(candidate);
            }
        }
    }

    candidates.sort((left, right) =>
        left.score - right.score ||
        left.top.centerY - right.top.centerY ||
        left.top.centerX - right.top.centerX
    );

    const used = new Set<number>();
    const matches: Array<{ box: OcrSymbolBox; centerY: number; centerX: number }> = [];
    for (const candidate of candidates) {
        const indexes = [candidate.top.index, candidate.vertical.index, candidate.bottom.index];
        if (indexes.some(index => used.has(index))) continue;
        for (const index of indexes) used.add(index);
        matches.push({
            box: unionBox([candidate.top, candidate.vertical, candidate.bottom]),
            centerY: candidate.top.centerY,
            centerX: candidate.top.centerX
        });
    }

    matches.sort((left, right) =>
        left.centerY - right.centerY || left.centerX - right.centerX
    );
    return matches.map(match => match.box);
}
