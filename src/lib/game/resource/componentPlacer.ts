import type { Component } from '$lib/ecs';
import { EventDispatcher } from '$lib/eventDispatcher';
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
    public readonly place: (game: Game) => Component[];
    public constructor(info: (game: Game) => Info, place: (game: Game) => Component[]) {
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
            const upgrades = game.world.getResource(Upgrades);
            return {
                name: `${['Singular', 'Double', 'Quadruple'][tier]} ${type} Cell`,
                description: `Generates ${upgrades.getBasicGeneratorPowerGeneration(type, tier)} power and ${upgrades.getBasicGeneratorHeatGeneration(type, tier)} heat for ${upgrades.getBasicGeneratorDurability(type)} ticks`,
                texture,
                cost: upgrades.getBasicGeneratorCost(type, tier),
                weakType: 'cell',
                strongType
            };
        },
        (game) => {
            const upgrades = game.world.getResource(Upgrades);
            const durability = upgrades.getBasicGeneratorDurability(type);
            return [
                new TileType('cell', strongType),
                new TileBasicSprite(texture),
                new TileDurability(durability),
                new TileBasicGenerator(type, tier)
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
            const upgrades = game.world.getResource(Upgrades);
            return {
                name: `${type} Heat Vent`,
                description: `Dissipates ${upgrades.getBasicVentHeatVentAmount(type)} heat per tick and holds ${upgrades.getBasicVentMaxHeat(type)} heat`,
                texture,
                cost: upgrades.getBasicVentCost(type),
                weakType: 'vent',
                strongType
            };
        },
        (game) => {
            const upgrades = game.world.getResource(Upgrades);
            return [
                new TileType('vent', strongType),
                new TileBasicSprite(texture),
                new TileHeatable(upgrades.getBasicVentMaxHeat(type)),
                new TileBasicHeatVent(type)
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
            const upgrades = game.world.getResource(Upgrades);
            return {
                name: `${type} Capacitor`,
                description: `Increases total power storage of the reactor by ${upgrades.getBasicCapacitorPowerStorage(type)}`,
                texture,
                cost: upgrades.getBasicCapacitorCost(type),
                weakType: 'capacitor',
                strongType
            };
        },
        (game) => {
            const upgrades = game.world.getResource(Upgrades);
            return [
                new TileType('capacitor', strongType),
                new TileBasicSprite(texture),
                new TileHeatable(1),
                new TileCapacitor(upgrades.getBasicCapacitorPowerStorage(type)),
                new TileBasicCapacitor(type)
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
