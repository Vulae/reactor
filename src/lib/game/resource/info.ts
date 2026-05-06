import { System } from '$lib/ecs';

export class FrameInfo {
    private _numFrames: number = 0;
    public get numFrames(): number {
        return this._numFrames;
    }

    private _frameStart: number = 0;
    private _frameEnd: number = 0;
    private _lastFrameStart: number = 0;
    public get renderTime(): number {
        return this._frameEnd - this._frameStart;
    }
    public get dt(): number {
        return this._frameStart - this._lastFrameStart;
    }

    private _moments: number[] = [];
    public get fps(): number {
        return this._moments.length;
    }

    public static readonly SYSTEM_FIRST = new System([FrameInfo], (info) => {
        const now = performance.now();
        while (info._moments.length > 0 && info._moments[0] <= now - 1000) {
            info._moments.shift();
        }
        info._moments.push(now);

        info._lastFrameStart = info._frameStart;
        info._frameStart = now;
    });

    public static readonly SYSTEM_LAST = new System([FrameInfo], (info) => {
        info._frameEnd = performance.now();
        info._numFrames++;
    });
}
