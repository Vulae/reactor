import { System, World } from '$lib/ecs';
import { Reactor } from '$lib/game/resource/reactor';
import { Upgrades } from '$lib/game/resource/upgrades';
import { ParticlePos } from '../../particle/base';
import { PARTICLE_PLACER } from '../../particle/placer';
import {
    TileBasicGenerator,
    TileBasicHeatVent,
    TileDurability,
    TileHeatable,
    TilePos
} from './def';

export const SYSTEM_TICK_HEATABLE = (() =>
    new System([World, Reactor, [TileHeatable, TilePos]], (world, reactor, entities) => {
        for (const entity of entities) {
            const [heatable, pos] = entity.components;
            if (heatable.heat < 0) {
                heatable.heat = 0;
            }
            if (heatable.heat > heatable.maxHeat) {
                entity.destroy();
                reactor.heat += heatable.heat;
                PARTICLE_PLACER.place(world, new ParticlePos(pos.x, pos.y), 'explosion');
            }
        }
    }))();

export const SYSTEM_TICK_DURABILITY = new System([[TileDurability]], (entities) => {
    for (const entity of entities) {
        const [dur] = entity.components;
        if (!dur.isDead()) {
            if (dur.durability > dur.maxDurability) {
                dur.durability = dur.maxDurability;
            }
            dur.durability--;
        }
    }
});

export const SYSTEM_TICK_BASIC_HEATVENT = new System(
    [Upgrades, [TileBasicHeatVent, TileHeatable]],
    (upgrades, entities) => {
        for (const entity of entities) {
            const [vent, heatable] = entity.components;
            heatable.maxHeat = vent.getMaxHeat(upgrades);
            heatable.heat -= vent.getHeatVentAmount(upgrades);
        }
    }
);

export const SYSTEM_TICK_BASIC_GENERATOR = new System(
    [Reactor, Upgrades, TileDurability.queryIsDead(false, [TilePos, TileBasicGenerator])],
    (reactor, upgrades, entities) => {
        for (const entity of entities) {
            const [pos, generator] = entity.components;

            const nearby = entity.world.queryEntities(pos.queryWithinDistance([TileHeatable], 1));
            if (nearby.length == 0) {
                reactor.heat += generator.getHeatGeneration(upgrades);
            } else {
                const distr = generator.getHeatGeneration(upgrades) / nearby.length;
                for (const near of nearby) {
                    const [heat] = near.components;
                    heat.heat += distr;
                }
            }

            reactor.power += generator.getPowerGeneration(upgrades);

            const entityWithDurability = entity.with([TileDurability]);
            if (entityWithDurability) {
                const [durability] = entityWithDurability.components;
                durability.maxDurability = generator.getMaxDurability(upgrades);
            }
        }
    }
);
