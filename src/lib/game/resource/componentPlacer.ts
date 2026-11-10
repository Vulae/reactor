import * as ECS from '#ecs';
import { EventDispatcher } from '#lib/eventDispatcher.ts';
import {
    TileBasicSprite,
    TileCapacitor,
    TileDurability,
    TileHeatable,
    TileType
} from '../component/tile/base';
import {
    TileBasicCapacitor,
    TileBasicComponentType,
    TileBasicGenerator,
    TileBasicGeneratorType,
    TileBasicHeatVent
} from '../component/tile/basic';
import type { ATLAS } from '../textures';
import type { Game } from './game';
import { Upgrades } from './upgrades';

type Info = {
    readonly name: string;
    readonly description: string;
    readonly texture: keyof (typeof ATLAS)['textures'];
    readonly cost: number;
    readonly weakType: string;
    readonly strongType: string;
};

class Placer {
    public readonly info: (game: Game) => Info;
    public readonly place: (game: Game) => ECS.Instance[];
    public constructor(info: (game: Game) => Info, place: (game: Game) => ECS.Instance[]) {
        this.info = info;
        this.place = place;
    }
}

function placerBasicCell(
    type: TileBasicGeneratorType,
    tier: 0 | 1 | 2,
    strongType: string,
    texture: keyof (typeof ATLAS)['textures']
): Placer {
    return new Placer(
        (game) => {
            const upgrades = game.world.resources.get(Upgrades);
            const generator = new TileBasicGenerator(type, tier);
            return {
                name: `${['Singular', 'Double', 'Quadruple'][tier]} ${type} Cell`,
                description: `Generates ${generator.getPowerGeneration(upgrades)} power and ${generator.getHeatGeneration(upgrades)} heat for ${generator.getMaxDurability(upgrades)} ticks`,
                texture,
                cost:
                    {
                        [TileBasicGeneratorType.Uranium]: 10,
                        [TileBasicGeneratorType.Plutonium]: 10
                    }[type] *
                    (tier + 1) ** 2,
                weakType: 'cell',
                strongType
            };
        },
        (game) => {
            const upgrades = game.world.resources.get(Upgrades);
            const generator = new TileBasicGenerator(type, tier);
            return [
                new TileType('cell', strongType),
                new TileBasicSprite(texture),
                new TileDurability(generator.getMaxDurability(upgrades)),
                generator
            ];
        }
    );
}

function placerBasicVent(
    type: TileBasicComponentType,
    strongType: string,
    texture: keyof (typeof ATLAS)['textures']
): Placer {
    return new Placer(
        (game) => {
            const upgrades = game.world.resources.get(Upgrades);
            const vent = new TileBasicHeatVent(type);
            return {
                name: `${type} Heat Vent`,
                description: `Dissipates ${vent.getHeatVentAmount(upgrades)} heat per tick and holds ${vent.getMaxHeat(upgrades)} heat`,
                texture,
                cost: {
                    [TileBasicComponentType.Basic]: 50,
                    [TileBasicComponentType.Advanced]: 12500
                }[type],
                weakType: 'vent',
                strongType
            };
        },
        (game) => {
            const upgrades = game.world.resources.get(Upgrades);
            const vent = new TileBasicHeatVent(type);
            return [
                new TileType('vent', strongType),
                new TileBasicSprite(texture),
                new TileHeatable(vent.getMaxHeat(upgrades)),
                vent
            ];
        }
    );
}

function placerBasicCapacitor(
    type: TileBasicComponentType,
    strongType: string,
    texture: keyof (typeof ATLAS)['textures']
): Placer {
    return new Placer(
        (game) => {
            const upgrades = game.world.resources.get(Upgrades);
            const capacitor = new TileBasicCapacitor(type);
            return {
                name: `${type} Capacitor`,
                description: `Increases total power storage of the reactor by ${capacitor.getPowerStorage(upgrades)}`,
                texture,
                cost: {
                    [TileBasicComponentType.Basic]: 1000,
                    [TileBasicComponentType.Advanced]: 125000
                }[type],
                weakType: 'capacitor',
                strongType
            };
        },
        (game) => {
            const upgrades = game.world.resources.get(Upgrades);
            const capacitor = new TileBasicCapacitor(type);
            return [
                new TileType('capacitor', strongType),
                new TileBasicSprite(texture),
                new TileHeatable(1),
                new TileCapacitor(capacitor.getPowerStorage(upgrades)),
                capacitor
            ];
        }
    );
}

const COMPONENTS = {
    cell_uranium_single: placerBasicCell(
        TileBasicGeneratorType.Uranium,
        0,
        'cell_uranium_single',
        'cell_uranium_single'
    ),
    cell_uranium_double: placerBasicCell(
        TileBasicGeneratorType.Uranium,
        1,
        'cell_uranium_double',
        'cell_uranium_double'
    ),
    cell_uranium_quad: placerBasicCell(
        TileBasicGeneratorType.Uranium,
        2,
        'cell_uranium_quad',
        'cell_uranium_quad'
    ),
    cell_plutonium_single: placerBasicCell(
        TileBasicGeneratorType.Plutonium,
        0,
        'cell_plutonium_single',
        'cell_plutonium_single'
    ),
    cell_plutonium_double: placerBasicCell(
        TileBasicGeneratorType.Plutonium,
        1,
        'cell_plutonium_double',
        'cell_plutonium_double'
    ),
    cell_plutonium_quad: placerBasicCell(
        TileBasicGeneratorType.Plutonium,
        2,
        'cell_plutonium_quad',
        'cell_plutonium_quad'
    ),
    vent_basic: placerBasicVent(TileBasicComponentType.Basic, 'vent_basic', 'vent_basic'),
    vent_advanced: placerBasicVent(
        TileBasicComponentType.Advanced,
        'vent_advanced',
        'vent_advanced'
    ),
    capacitor_basic: placerBasicCapacitor(
        TileBasicComponentType.Basic,
        'capacitor_basic',
        'capacitor_basic'
    ),
    capacitor_advanced: placerBasicCapacitor(
        TileBasicComponentType.Advanced,
        'capacitor_advanced',
        'capacitor_advanced'
    )
} as const;

export class ComponentPlacer extends EventDispatcher<{
    update: null;
}> {
    public static readonly COMPONENTS = COMPONENTS;
    public selected: keyof typeof COMPONENTS | null = null;
}
