// Session-only corrections. Ink identities never enter exported Canvas state.
export type CorrectableCalculationLine = Readonly<{ correctionKey: string; latex: string }>;
type Correction = { originals: CorrectableCalculationLine[]; replacements: string[] };
type ProjectionBlock = { sourceStart: number; sourceEnd: number; outputStart: number; outputEnd: number };

export class CalculationCorrections {
    private readonly entries = new Map<string, Correction>();
    private readonly limit: number;
    constructor(limit = 128) { this.limit = Math.max(1, limit); }

    clear(): void { this.entries.clear(); }

    remember(originals: readonly CorrectableCalculationLine[], edited: readonly string[]): void {
        if (!originals.length) return;
        const counts = new Map<string, number>();
        for (const line of originals) counts.set(line.correctionKey, (counts.get(line.correctionKey) || 0) + 1);
        let hasGroupedSource = false;
        {
            // Keep unchanged edge spans independent when the editor splits or
            // merges other rows, including rows without an unambiguous ink ID.
            const previous = this.project(originals);
            let sourceStart = 0, sourceEnd = originals.length;
            let outputStart = 0, outputEnd = edited.length;
            let left = 0, right = previous.blocks.length;
            while (left < right) {
                const block = previous.blocks[left];
                const text = previous.lines.slice(block.outputStart, block.outputEnd);
                if ((left + 1 === right && outputStart + text.length < outputEnd) ||
                    outputStart + text.length > outputEnd ||
                    !text.every((value, i) => value === edited[outputStart + i])) break;
                sourceStart = block.sourceEnd;
                outputStart += text.length;
                left++;
            }
            while (right > left) {
                const block = previous.blocks[right - 1];
                const text = previous.lines.slice(block.outputStart, block.outputEnd);
                if ((right - 1 === left && outputEnd - text.length > outputStart) ||
                    outputEnd - text.length < outputStart ||
                    !text.every((value, i) => value === edited[outputEnd - text.length + i])) break;
                sourceEnd = block.sourceStart;
                outputEnd -= text.length;
                right--;
            }
            hasGroupedSource = previous.blocks.some(block =>
                block.sourceStart < sourceEnd && block.sourceEnd > sourceStart &&
                block.sourceEnd - block.sourceStart !== block.outputEnd - block.outputStart
            );
            originals = originals.slice(sourceStart, sourceEnd);
            edited = edited.slice(outputStart, outputEnd);
            if (!originals.length) return;
        }
        const keys = new Set(originals.map(line => line.correctionKey).filter(Boolean));
        for (const [key, entry] of this.entries) {
            if (entry.originals.some(line => keys.has(line.correctionKey))) this.entries.delete(key);
        }
        const usable = (line: CorrectableCalculationLine) => Boolean(line.correctionKey) && counts.get(line.correctionKey) === 1;
        const put = (source: readonly CorrectableCalculationLine[], replacements: readonly string[]) => {
            this.entries.set(source[0].correctionKey, {
                originals: source.map(line => ({ ...line })), replacements: [...replacements]
            });
        };
        if (originals.length === edited.length && !hasGroupedSource) {
            originals.forEach((line, index) => {
                if (usable(line) && line.latex !== edited[index]) put([line], [edited[index]]);
            });
        } else if (originals.every(usable)) {
            // Changed row counts have no unique per-row mapping. Keep the
            // correction only while its entire original ink span stays intact.
            put(originals, edited);
        }
        while (this.entries.size > Math.max(1, this.limit)) {
            const oldest = this.entries.keys().next();
            if (oldest.done) break;
            this.entries.delete(oldest.value);
        }
    }

    originalFor(key: string): string | undefined {
        if (!key) return undefined;
        for (const entry of this.entries.values()) {
            const line = entry.originals.find(candidate => candidate.correctionKey === key);
            if (line) return line.latex;
        }
        return undefined;
    }

    apply(lines: readonly CorrectableCalculationLine[]): { lines: string[]; corrected: boolean } {
        const { lines: result, corrected } = this.project(lines);
        return { lines: result, corrected };
    }

    private project(lines: readonly CorrectableCalculationLine[]): {
        lines: string[]; corrected: boolean; blocks: ProjectionBlock[];
    } {
        const result: string[] = [];
        const blocks: ProjectionBlock[] = [];
        let corrected = false;
        const counts = new Map<string, number>();
        for (const line of lines) counts.set(line.correctionKey, (counts.get(line.correctionKey) || 0) + 1);
        for (let index = 0; index < lines.length;) {
            const sourceStart = index;
            const outputStart = result.length;
            const entry = this.entries.get(lines[index].correctionKey);
            if (entry && entry.originals.every((original, offset) =>
                counts.get(original.correctionKey) === 1 &&
                lines[index + offset]?.correctionKey === original.correctionKey
            )) {
                result.push(...entry.replacements);
                index += entry.originals.length;
                corrected = true;
            } else {
                result.push(lines[index].latex);
                index++;
            }
            blocks.push({ sourceStart, sourceEnd: index, outputStart, outputEnd: result.length });
        }
        return { lines: result, corrected, blocks };
    }
}
