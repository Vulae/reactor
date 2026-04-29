import { EventDispatcher } from '$lib/eventDispatcher';
import { TileBasicGeneratorType } from '../component/tile/base/def';
import type { ATLAS } from '../textures';
import type { Game } from './game';
import { Reactor } from './reactor';
import { Upgrades } from './upgrades';

type Info = {
    readonly name: string;
    readonly description: string;
    readonly textures: (keyof (typeof ATLAS)['textures'])[];
    readonly bought: number | boolean;
    readonly cost: number | undefined;
};

class Upgrade {
    public readonly info: (game: Game) => Info;
    public readonly buy: (game: Game) => void;
    public constructor(info: (game: Game) => Info, buy: (game: Game) => void) {
        this.info = info;
        this.buy = buy;
    }
}

function upgradesBasicCellPowerGeneration(
    type: TileBasicGeneratorType,
    texture: keyof (typeof ATLAS)['textures']
): Upgrade {
    return new Upgrade(
        (game) => {
            const upgrades = game.world.getResource(Upgrades);
            return {
                name: `${type} Cell Power Generation`,
                description: `Increases the base ${type} Cell power generation by +100% per level`,
                textures: [texture, 'upgrade_power'],
                bought: upgrades.basicGenerator[type].powerGeneration,
                cost: upgrades.getBasicGeneratorUpgradeCost(type).powerGeneration
            };
        },
        (game) => {
            const upgrades = game.world.getResource(Upgrades);
            upgrades.basicGenerator[type].powerGeneration++;
        }
    );
}

function upgradesBasicCellDurability(
    type: TileBasicGeneratorType,
    texture: keyof (typeof ATLAS)['textures']
): Upgrade {
    return new Upgrade(
        (game) => {
            const upgrades = game.world.getResource(Upgrades);
            return {
                name: `${type} Cell Durability`,
                description: `${type} Cells last *200% per level`,
                textures: [texture, 'upgrade_duration'],
                bought: upgrades.basicGenerator[type].durability,
                cost: upgrades.getBasicGeneratorUpgradeCost(type).durability
            };
        },
        (game) => {
            const upgrades = game.world.getResource(Upgrades);
            upgrades.basicGenerator[type].durability++;
        }
    );
}

function upgradesBasicCellAutoReplace(
    type: TileBasicGeneratorType,
    texture: keyof (typeof ATLAS)['textures']
): Upgrade {
    return new Upgrade(
        (game) => {
            const upgrades = game.world.getResource(Upgrades);
            return {
                name: `Perpetual ${type} Cells`,
                description: `Auto replace ${type} Cells when they become depleted`,
                textures: [texture, 'upgrade_infinite'],
                bought: upgrades.basicGenerator[type].autoReplace,
                cost: upgrades.getBasicGeneratorUpgradeCost(type).autoReplace
            };
        },
        (game) => {
            const upgrades = game.world.getResource(Upgrades);
            upgrades.basicGenerator[type].autoReplace = true;
        }
    );
}

const UPGRADES = {
    uranium_cell_power_generation: upgradesBasicCellPowerGeneration(
        TileBasicGeneratorType.Uranium,
        'uranium_cell_1'
    ),
    uranium_cell_durability: upgradesBasicCellDurability(
        TileBasicGeneratorType.Uranium,
        'uranium_cell_1'
    ),
    uranium_cell_autoreplace: upgradesBasicCellAutoReplace(
        TileBasicGeneratorType.Uranium,
        'uranium_cell_1'
    ),
    plutonium_cell_power_generation: upgradesBasicCellPowerGeneration(
        TileBasicGeneratorType.Plutonium,
        'plutonium_cell_1'
    ),
    plutonium_cell_durability: upgradesBasicCellDurability(
        TileBasicGeneratorType.Plutonium,
        'plutonium_cell_1'
    ),
    plutonium_cell_autoreplace: upgradesBasicCellAutoReplace(
        TileBasicGeneratorType.Plutonium,
        'plutonium_cell_1'
    )
} as const;

export class UpgradeBuyer extends EventDispatcher<{ update: null }> {
    public static readonly UPGRADES = UPGRADES;

    public tryBuyUpgrade(game: Game, identifier: keyof (typeof UpgradeBuyer)['UPGRADES']): void {
        const reactor = game.world.getResource(Reactor);
        const upgrade = UpgradeBuyer.UPGRADES[identifier];
        const info = upgrade.info(game);
        if (info.cost === undefined) return;
        if (reactor.money >= info.cost) {
            if (info.bought === true) {
                return;
            }
            upgrade.buy(game);
            reactor.money -= info.cost;
            this.dispatchEvent('update', null);
        }
    }
}
