import type { Reactor, TickStep } from '$lib/reactor';

export interface ComponentHeatable {
    heat: bigint;
}

export interface ComponentPowerbank {
    powerCapacity(reactor: Reactor): bigint;
}

export type TickSteps<T> = {
    [key in keyof typeof TickStep]?: (this: T, reactor: Reactor, x: number, y: number) => void;
};

export abstract class ComponentBase {
    public isHeatable(): this is ComponentHeatable {
        return false;
    }
    public isPowerbank(): this is ComponentPowerbank {
        return false;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public sellAmount(reactor: Reactor): bigint {
        return 0n;
    }

    /** Rendering context is already translated to x, y */
    public abstract render(
        ctx: CanvasRenderingContext2D,
        reactor: Reactor,
        x: number,
        y: number
    ): void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public readonly tickSteps: TickSteps<any> = {};
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public destroy(reactor: Reactor, x: number, y: number): void {}
}
