import * as ECS from '#ecs';
import { TileCapacitor, TileDurability, TileHeatable } from '#lib/game/component/tile/base.ts';
import {
    TileBasicCapacitor,
    TileBasicGenerator,
    TileBasicHeatVent
} from '#lib/game/component/tile/basic.ts';
import { Upgrades } from '#lib/game/resource/upgrades.ts';

export const SYSTEM_SETUP_BASIC_GENERATOR = new ECS.System(
    [Upgrades, [TileBasicGenerator, TileDurability]],
    (upgrades, entities) => {
        for (const entity of entities) {
            const [generator, durability] = entity.components;
            durability.maxDurability = generator.getMaxDurability(upgrades);
        }
    }
);

export const SYSTEM_SETUP_BASIC_HEATVENT = new ECS.System(
    [Upgrades, [TileBasicHeatVent, TileHeatable]],
    (upgrades, entities) => {
        for (const entity of entities) {
            const [vent, heatable] = entity.components;
            heatable.maxHeat = vent.getMaxHeat(upgrades);
        }
    }
);

export const SYSTEM_SETUP_BASIC_CAPACITOR = new ECS.System(
    [Upgrades, [TileBasicCapacitor, TileCapacitor]],
    (upgrades, entities) => {
        for (const entity of entities) {
            const [basicCapacitor, capacitor] = entity.components;
            capacitor.powerAmount = basicCapacitor.getPowerStorage(upgrades);
        }
    }
);
