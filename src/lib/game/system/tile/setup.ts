import { System } from '$lib/ecs';
import { TileCapacitor, TileDurability, TileHeatable } from '$lib/game/component/tile/base';
import {
    TileBasicCapacitor,
    TileBasicGenerator,
    TileBasicHeatVent
} from '$lib/game/component/tile/basic';
import { Upgrades } from '$lib/game/resource/upgrades';

export const SYSTEM_SETUP_BASIC_GENERATOR = new System(
    [Upgrades, [TileBasicGenerator, TileDurability]],
    (upgrades, entities) => {
        for (const entity of entities) {
            const [generator, durability] = entity.components;
            durability.maxDurability = generator.getMaxDurability(upgrades);
        }
    }
);

export const SYSTEM_SETUP_BASIC_HEATVENT = new System(
    [Upgrades, [TileBasicHeatVent, TileHeatable]],
    (upgrades, entities) => {
        for (const entity of entities) {
            const [vent, heatable] = entity.components;
            heatable.maxHeat = vent.getMaxHeat(upgrades);
        }
    }
);

export const SYSTEM_SETUP_BASIC_CAPACITOR = new System(
    [Upgrades, [TileBasicCapacitor, TileCapacitor]],
    (upgrades, entities) => {
        for (const entity of entities) {
            const [basicCapacitor, capacitor] = entity.components;
            capacitor.powerAmount = upgrades.getBasicCapacitorPowerStorage(basicCapacitor.type);
        }
    }
);
