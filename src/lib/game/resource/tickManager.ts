import * as ECS from '#ecs';
import { Upgrades } from './upgrades';

const GIVE_EXTRATICKS_DELAY: number = 1000 * 60;

export class TickManager {
    public numTicks: number = 0;

    public getMillisecondPerTick(upgrades: Upgrades): number {
        return 1000 / (upgrades.chronometer + 1);
    }

    public extraTicks: number = 0;
    public dateSinceLastTick: number = Date.now();

    public static readonly SYSTEM_TICK = new ECS.System([TickManager, Upgrades], (mngr, upgrades) => {
        mngr.numTicks++;

        const now = Date.now();
        if (now - mngr.dateSinceLastTick > GIVE_EXTRATICKS_DELAY) {
            mngr.extraTicks += Math.floor(
                (now - mngr.dateSinceLastTick - GIVE_EXTRATICKS_DELAY) / mngr.getMillisecondPerTick(upgrades)
            );
        }
        mngr.dateSinceLastTick = now;
    });
}
