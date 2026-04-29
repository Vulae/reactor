import type { Component } from '$lib/ecs';
import { EventDispatcher } from '$lib/eventDispatcher';
import {
    TileBasicComponentType,
    TileBasicGenerator,
    TileBasicGeneratorType,
    TileBasicHeatVent,
    TileBasicSprite,
    TileDurability,
    TileHeatable,
    TileOverwrite
} from '../component/tile/base/def';
import type { ATLAS } from '../textures';
import type { Game } from './game';
import { Upgrades } from './upgrades';

type Info = {
    readonly name: string;
    readonly description: string;
    readonly texture: keyof (typeof ATLAS)['textures'];
    readonly cost: number;
    readonly overwriteType: string;
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
                overwriteType: 'cell'
            };
        },
        (game) => {
            const upgrades = game.world.getResource(Upgrades);
            const durability = upgrades.getBasicGeneratorDurability(type);
            const cost = upgrades.getBasicGeneratorCost(type, tier);
            return [
                new TileOverwrite('cell'),
                new TileBasicSprite(texture),
                new TileDurability(durability, cost),
                new TileBasicGenerator(type, tier)
            ];
        }
    );
}

function placerBasicVent(
    type: TileBasicComponentType,
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
                overwriteType: 'vent'
            };
        },
        (game) => {
            const upgrades = game.world.getResource(Upgrades);
            return [
                new TileOverwrite('vent'),
                new TileBasicSprite(texture),
                new TileHeatable(upgrades.getBasicVentMaxHeat(type)),
                new TileBasicHeatVent(type)
            ];
        }
    );
}

const COMPONENTS = {
    uranium_cell_1: placerBasicCell(TileBasicGeneratorType.Uranium, 0, 'uranium_cell_1'),
    uranium_cell_2: placerBasicCell(TileBasicGeneratorType.Uranium, 1, 'uranium_cell_2'),
    uranium_cell_3: placerBasicCell(TileBasicGeneratorType.Uranium, 2, 'uranium_cell_3'),
    plutonium_cell_1: placerBasicCell(TileBasicGeneratorType.Plutonium, 0, 'plutonium_cell_1'),
    plutonium_cell_2: placerBasicCell(TileBasicGeneratorType.Plutonium, 1, 'plutonium_cell_2'),
    plutonium_cell_3: placerBasicCell(TileBasicGeneratorType.Plutonium, 2, 'plutonium_cell_3'),
    basic_vent: placerBasicVent(TileBasicComponentType.Basic, 'vent_1'),
    advanced_vent: placerBasicVent(TileBasicComponentType.Advanced, 'vent_2')
} as const;

export class ComponentPlacer extends EventDispatcher<{
    update: null;
}> {
    public static readonly COMPONENTS = COMPONENTS;
    public selected: keyof typeof COMPONENTS | null = null;
}
