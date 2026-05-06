import { System, World } from '$lib/ecs';
import { ParticleExplosion, ParticlePos } from '$lib/game/component/particle';
import { TileDurability, TileHeatable, TilePos } from '$lib/game/component/tile/base';
import { TileBasicGenerator, TileBasicHeatVent } from '$lib/game/component/tile/basic';
import { Reactor } from '$lib/game/resource/reactor';
import { Stats } from '$lib/game/resource/stats';
import { Upgrades } from '$lib/game/resource/upgrades';
import { clamp } from '$lib/util';

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
                ParticleExplosion.create(world, new ParticlePos(pos.x, pos.y));
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

export const SYSTEM_TICK_BASIC_GENERATOR = new System(
    [Reactor, Upgrades, Stats, [TilePos, TileBasicGenerator, TileDurability]],
    (reactor, upgrades, stats, entities) => {
        for (const entity of entities) {
            const [pos, generator, durability] = entity.components;
            if (durability.isDead()) {
                if (!upgrades.basicGenerator[generator.type].autoReplace) {
                    continue;
                }
                const cost = upgrades.getBasicGeneratorCost(generator.type, generator.tier);
                if (reactor.money >= cost) {
                    reactor.money -= cost;
                    durability.durability = durability.maxDurability;
                } else {
                    continue;
                }
            }

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

            const powerAmount = generator.getPowerGeneration(upgrades);
            reactor.power += powerAmount;
            stats.totalPowerGeneratedThisReset += powerAmount;
        }
    }
);

export const SYSTEM_TICK_BASIC_HEATVENT = new System(
    [Upgrades, Stats, [TileBasicHeatVent, TileHeatable]],
    (upgrades, stats, entities) => {
        for (const entity of entities) {
            const [vent, heatable] = entity.components;
            const dissipateAmount = vent.getHeatVentAmount(upgrades);
            const sub = clamp(heatable.heat, 0, dissipateAmount);
            heatable.heat -= sub;
            stats.totalHeatDissipatedThisReset += sub;
        }
    }
);
