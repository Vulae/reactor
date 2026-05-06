export class RenderFrameCaller {
    private callback: (time: DOMHighResTimeStamp) => void;
    private running: boolean = false;
    private animframe: number = -1;

    public constructor(callback: (time: DOMHighResTimeStamp) => void) {
        this.callback = callback;
    }

    private step = (time: DOMHighResTimeStamp): void => {
        if (!this.running) return;
        this.animframe = requestAnimationFrame(this.step);
        this.callback(time);
    };

    public start(): void {
        if (this.running) return;
        this.running = true;
        cancelAnimationFrame(this.animframe);
        this.animframe = requestAnimationFrame(this.step);
    }

    public stop(): void {
        this.running = false;
        if (this.animframe !== null) {
            cancelAnimationFrame(this.animframe);
        }
    }
}

export class IntervalCaller {
    private callback: () => void;
    public constructor(callback: () => void) {
        this.callback = callback;
    }

    private running: boolean = false;
    private milliseconds: number = 1000;
    private interval: number = -1;

    public start(): void {
        this.running = true;
        clearInterval(this.interval);
        // @ts-expect-error - Node & browser have different types.
        this.interval = setInterval(() => this.callback(), this.milliseconds);
    }

    public stop(): void {
        this.running = false;
        clearInterval(this.interval);
    }

    public setDelay(milliseconds: number): void {
        if (milliseconds < 10) {
            throw new Error('IntervalCaller delay is too small');
        }
        this.milliseconds = milliseconds;
        if (this.running) {
            this.start();
        }
    }

    public getDelay(): number {
        return this.milliseconds;
    }
}

export function notNull<T>(value: T | null): value is T {
    return value !== null;
}

export function hoiseArrayNull<T>(arr: (T | null)[]): T[] | null {
    if (arr.every(notNull)) {
        return arr;
    } else {
        return null;
    }
}

export function clamp(v: number, min: number, max: number): number {
    return v < min ? min : v > max ? max : v;
}

export function updateOn<T>(_acc: number, v: T): T {
    return v;
}
