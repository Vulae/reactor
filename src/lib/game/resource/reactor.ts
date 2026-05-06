import type { World } from '$lib/ecs';
import type { TilePos } from '../component/tile/base';
import { Stats } from './stats';

export class Reactor {
    public width: number = 10;
    public height: number = 10;

    public containsPos(pos: TilePos): boolean {
        return pos.x >= 0 && pos.y >= 0 && pos.x < this.width && pos.y < this.height;
    }

    public heat: number = 0;
    public maxHeat: number = 100;
    public power: number = 0;
    public maxPower: number = 100;
    public money: number = 0;

    public isOverheating(): boolean {
        return this.heat > this.maxHeat;
    }

    public sellPower(world: World): void {
        const stats = world.getResource(Stats);
        if (this.power > this.maxPower) {
            this.power = this.maxPower;
        }
        this.money += this.power;
        stats.totalMoneyGainedThisReset += this.power;
        this.power = 0;
    }
}
