import { World, System } from '$lib/ecs';
import { ParticlePos } from '../component/particle/base';
import { PARTICLE_PLACER } from '../component/particle/placer';
import { TileDurability, TilePos } from '../component/tile/base/def';

export class Reactor {
    public width: number = 10;
    public height: number = 10;

    public containsPos(pos: TilePos): boolean {
        return pos.x >= 0 && pos.y >= 0 && pos.x < this.width && pos.y < this.height;
    }

    public extraTicks: number = 0;
    public millisecondsPerTick: number = 1000;

    public heat: number = 0;
    public maxHeat: number = 100;
    public power: number = 0;
    public maxPower: number = 100;
    public money: number = 0;

    public isOverheating(): boolean {
        return this.heat > this.maxHeat;
    }

    public static readonly SYSTEM_TICK_END = new System([World, Reactor], (world, reactor) => {
        reactor.heat--;
        if (reactor.heat < 0) {
            reactor.heat = 0;
        }

        if (reactor.isOverheating()) {
            const entities = world.queryEntities([TilePos]);
            for (const entity of entities) {
                const [pos] = entity.components;
                entity.with([TileDurability], (_) => {
                    PARTICLE_PLACER.place(world, new ParticlePos(pos.x, pos.y), 'explosion');
                });
                entity.destroy();
            }
            if (entities.length > 0) {
                reactor.heat *= entities.length;
            }
            reactor.heat *= 0.95;
        }

        if (reactor.power > reactor.maxPower) {
            reactor.power = reactor.maxPower;
        }
    });

    public sellPower(): void {
        if (this.power > this.maxPower) {
            this.power = this.maxPower;
        }
        this.money += this.power;
        this.power = 0;
    }
}
