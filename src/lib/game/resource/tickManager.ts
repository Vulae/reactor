import { System } from '$lib/ecs';

const GIVE_EXTRATICKS_DELAY: number = 1000 * 60;

export class TickManager {
    public numTicks: number = 0;

    public millisecondsPerTick: number = 1000;

    public extraTicks: number = 0;
    public dateSinceLastTick: number = Date.now();

    public static readonly SYSTEM_TICK = new System([TickManager], (mngr) => {
        mngr.numTicks++;

        const now = Date.now();
        if (now - mngr.dateSinceLastTick > GIVE_EXTRATICKS_DELAY) {
            mngr.extraTicks += Math.floor(
                (now - mngr.dateSinceLastTick - GIVE_EXTRATICKS_DELAY) / mngr.millisecondsPerTick
            );
        }
        mngr.dateSinceLastTick = now;
    });
}
