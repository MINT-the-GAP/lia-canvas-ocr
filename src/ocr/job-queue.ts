// Serializes complete OCR jobs across canvases. The recognizer itself may still
// run its internal variants in parallel, but foreground submissions take the
// next available slot before queued background work.

export type OcrJobPriority = 'foreground' | 'background';

type PendingJob<T> = {
    priority: OcrJobPriority;
    sequence: number;
    started: boolean;
    task: () => Promise<T>;
    resolve: (value: T | PromiseLike<T>) => void;
    reject: (reason?: unknown) => void;
};

let running = false;
let nextSequence = 0;
const pending: Array<PendingJob<unknown>> = [];
const jobsByPromise = new WeakMap<Promise<unknown>, PendingJob<unknown>>();

function priorityRank(priority: OcrJobPriority): number {
    return priority === 'foreground' ? 0 : 1;
}

function drain(): void {
    if (running || !pending.length) return;
    pending.sort((a, b) => {
        const byPriority = priorityRank(a.priority) - priorityRank(b.priority);
        return byPriority || a.sequence - b.sequence;
    });
    const job = pending.shift()!;
    job.started = true;
    running = true;
    Promise.resolve()
        .then(job.task)
        .then(value => {
            job.resolve(value);
            running = false;
            drain();
        }, error => {
            job.reject(error);
            running = false;
            drain();
        });
}

export function enqueueOcrJob<T>(priority: OcrJobPriority, task: () => Promise<T>): Promise<T> {
    let job!: PendingJob<T>;
    const promise = new Promise<T>((resolve, reject) => {
        job = {
            priority,
            sequence: nextSequence++,
            started: false,
            task,
            resolve,
            reject
        };
    });
    const sharedJob = job as unknown as PendingJob<unknown>;
    pending.push(sharedJob);
    jobsByPromise.set(promise as Promise<unknown>, sharedJob);
    drain();
    return promise;
}

export function promoteOcrJob(promise: Promise<unknown>): void {
    const job = jobsByPromise.get(promise);
    if (!job || job.started || job.priority === 'foreground') return;
    job.priority = 'foreground';
    drain();
}
