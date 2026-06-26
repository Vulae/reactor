import { EventDispatcher } from '$lib/eventDispatcher';
import { TileBasicGeneratorType } from '../component/tile/basic';
import type { ATLAS } from '../textures';
import type { Game } from './game';
import { Reactor } from './reactor';
import { Upgrades } from './upgrades';

type Info = {
    readonly name: string;
    readonly description: string;
    readonly textures: (keyof (typeof ATLAS)['textures'])[];
    readonly buyable?: boolean;
    readonly bought: number | boolean;
    readonly cost?: number | null;
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
            const upgrades = game.world.resources.get(Upgrades);
            return {
                name: `${type} Cell Power Generation`,
                description: `Increases the base ${type} Cell power generation by +100% per level`,
                textures: [texture, 'upgrade_power'],
                buyable: upgrades.basicGenerator[type].powerGeneration < 100,
                bought: upgrades.basicGenerator[type].powerGeneration,
                cost: upgrades.getBasicGeneratorUpgradeCost(type).powerGeneration
            };
        },
        (game) => {
            const upgrades = game.world.resources.get(Upgrades);
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
            const upgrades = game.world.resources.get(Upgrades);
            return {
                name: `${type} Cell Durability`,
                description: `${type} Cells last *200% per level`,
                textures: [texture, 'upgrade_duration'],
                buyable: upgrades.basicGenerator[type].durability < 10,
                bought: upgrades.basicGenerator[type].durability,
                cost: upgrades.getBasicGeneratorUpgradeCost(type).durability
            };
        },
        (game) => {
            const upgrades = game.world.resources.get(Upgrades);
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
            const upgrades = game.world.resources.get(Upgrades);
            return {
                name: `Perpetual ${type} Cells`,
                description: `Auto replace ${type} Cells when they become depleted`,
                textures: [texture, 'upgrade_infinite'],
                buyable: !upgrades.basicGenerator[type].autoReplace,
                bought: upgrades.basicGenerator[type].autoReplace,
                cost: upgrades.getBasicGeneratorUpgradeCost(type).autoReplace
            };
        },
        (game) => {
            const upgrades = game.world.resources.get(Upgrades);
            upgrades.basicGenerator[type].autoReplace = true;
        }
    );
}

const UPGRADES = {
    cell_power_generation_uranium: upgradesBasicCellPowerGeneration(
        TileBasicGeneratorType.Uranium,
        'cell_uranium_single'
    ),
    cell_durability_uranium: upgradesBasicCellDurability(
        TileBasicGeneratorType.Uranium,
        'cell_uranium_single'
    ),
    cell_autoreplace_uranium: upgradesBasicCellAutoReplace(
        TileBasicGeneratorType.Uranium,
        'cell_uranium_single'
    ),
    cell_power_generation_plutonium: upgradesBasicCellPowerGeneration(
        TileBasicGeneratorType.Plutonium,
        'cell_plutonium_single'
    ),
    cell_durability_plutonium: upgradesBasicCellDurability(
        TileBasicGeneratorType.Plutonium,
        'cell_plutonium_single'
    ),
    cell_autoreplace_plutonium: upgradesBasicCellAutoReplace(
        TileBasicGeneratorType.Plutonium,
        'cell_plutonium_single'
    ),
    vent_efficiency: new Upgrade(
        (game) => {
            const upgrades = game.world.resources.get(Upgrades);
            return {
                name: `Efficient Vents`,
                description: `Increases vent amount by +100% per level`,
                textures: ['vent_basic', 'upgrade_plus'],
                bought: upgrades.ventEfficiency,
                cost: upgrades.getVentEffiencyCost()
            };
        },
        (game) => {
            const upgrades = game.world.resources.get(Upgrades);
            upgrades.ventEfficiency++;
        }
    )
} as const;

export class UpgradeBuyer extends EventDispatcher<{ update: null }> {
    public static readonly UPGRADES = UPGRADES;

    public tryBuyUpgrade(game: Game, identifier: keyof (typeof UpgradeBuyer)['UPGRADES']): void {
        const reactor = game.world.resources.get(Reactor);
        const upgrade = UpgradeBuyer.UPGRADES[identifier];
        const info = upgrade.info(game);
        if (info.buyable === false) return;
        if (typeof info.cost !== 'number') return;
        if (reactor.money >= info.cost) {
            if (info.bought === true) {
                return;
            }
            upgrade.buy(game);
            reactor.money -= info.cost;
            game.setNeedsSetup();
            this.dispatchEvent('update', null);
        }
    }
}
