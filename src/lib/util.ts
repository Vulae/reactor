export class RenderFrameCaller {
    private callback: () => void;
    public constructor(callback: () => void) {
        this.callback = callback;
    }

    private running: boolean = false;
    private animframe: number = -1;

    private step(): void {
        if (!this.running) return;
        cancelAnimationFrame(this.animframe);
        this.animframe = requestAnimationFrame(() => this.step());
        this.callback();
    }

    public start(): void {
        this.running = true;
        cancelAnimationFrame(this.animframe);
        requestAnimationFrame(() => this.step());
    }

    public stop(): void {
        this.running = false;
        cancelAnimationFrame(this.animframe);
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
