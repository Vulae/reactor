import { System } from '$lib/ecs';

export class Dt {
    private _lastTime: number = 0;
    private _curTime: number = 0;
    public get curTime(): number {
        return this._curTime;
    }
    public get dt(): number {
        return this._curTime - this._lastTime;
    }

    public static readonly SYSTEM = new System([Dt], (dt) => {
        dt._lastTime = dt._curTime;
        dt._curTime = performance.now();
    });
}

export class FrameInfo {
    public numFrames: number = 0;

    public lastRenderTimeStart: number = -1;
    public lastRenderTimeEnd: number = -1;

    public currentRenderTimeStart: number = -1;

    public static readonly SYSTEM_FIRST = new System([FrameInfo], (info) => {
        info.currentRenderTimeStart = performance.now();
    });
    public static readonly SYSTEM_LAST = new System([FrameInfo], (info) => {
        info.numFrames++;
        info.lastRenderTimeStart = info.currentRenderTimeStart;
        info.lastRenderTimeEnd = performance.now();
    });
}
