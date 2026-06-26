import { System, World } from '$lib/ecs';
import { clamp } from '$lib/util';
import { ParticleExplosion, ParticlePos } from '../component/particle';
import { TileCapacitor, TileDurability, TilePos } from '../component/tile/base';
import { Reactor } from '../resource/reactor';
import { Stats } from '../resource/stats';

export const SYSTEM_SETUP_REACTOR = new System(
    [Reactor, [TileCapacitor]],
    (reactor, capacitors) => {
        reactor.maxPower = 100;
        for (const entity of capacitors) {
            const [capacitor] = entity.components;
            reactor.maxPower += capacitor.powerAmount;
        }
    }
);

export const SYSTEM_TICK_REACTOR = new System([World, Reactor, Stats], (world, reactor, stats) => {
    const dissipateAmount = 1;
    const sub = clamp(reactor.heat, 0, dissipateAmount);
    reactor.heat -= sub;
    stats.totalHeatDissipatedThisReset += sub;

    if (reactor.isOverheating()) {
        const entities = world.components.entities([TilePos]);
        for (const entity of entities) {
            const [pos] = entity.components;
            entity.with([TileDurability], (durability) => {
                if (durability.isDead()) return;
                ParticleExplosion.create(world, new ParticlePos(pos.x, pos.y));
            });
            entity.destroy();
        }
        if (entities.length > 0) {
            reactor.heat *= 10;
        }
        reactor.heat *= 0.95;
    }

    if (reactor.power > reactor.maxPower) {
        reactor.power = reactor.maxPower;
    }
});
