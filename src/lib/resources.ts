import { UraniumFuelCell } from './cells/basic';
import type { Game } from './game';
import type { ComponentBase, Reactor } from './reactor';
import { TextureAtlas, TextureAtlasAnimation } from './textureAtlas';

export const TILESET = new TextureAtlas('./tileset.png', {
    empty: [0, 0, 32, 32],
    missing_texture: [0, 32, 32, 32],
    floor: [0, 64, 32, 32],
    big_tile: [0, 224, 64, 64],
    explosion_frame_1: [0, 96, 32, 32],
    explosion_frame_2: [0, 128, 32, 32],
    explosion_frame_3: [0, 160, 32, 32],
    explosion_frame_4: [0, 192, 32, 32],
    uranium_cell_1: [32, 0, 32, 32],
    uranium_cell_2: [64, 0, 32, 32],
    uranium_cell_3: [96, 0, 32, 32],
    unnamed_1_cell_1: [32, 32, 32, 32],
    unnamed_1_cell_2: [64, 32, 32, 32],
    unnamed_1_cell_3: [96, 32, 32, 32],
    unnamed_2_cell_1: [32, 64, 32, 32],
    unnamed_2_cell_2: [64, 64, 32, 32],
    unnamed_2_cell_3: [96, 64, 32, 32],
    unnamed_3_cell_1: [32, 96, 32, 32],
    unnamed_3_cell_2: [64, 96, 32, 32],
    unnamed_3_cell_3: [96, 96, 32, 32]
});

export const EXPLOSION = new TextureAtlasAnimation(TILESET, [
    'explosion_frame_1',
    'explosion_frame_2',
    'explosion_frame_3',
    'explosion_frame_4'
]);

export interface GameComponentInfo {
    readonly name: string;
    description(game: Game): string;
    readonly texture: keyof typeof TILESET.textures;
    cost(game: Game): bigint;
    create(reactor: Reactor): ComponentBase;
}

function componentInfoTypeHint(v: GameComponentInfo): GameComponentInfo {
    return v;
}

export const GAME_COMPONENTS = {
    uranium_cell_1: componentInfoTypeHint({
        name: 'Single Uranium Cell',
        description() {
            return 'Singular uranium cell produces energy and heat.';
        },
        texture: 'uranium_cell_1',
        cost() {
            return 0n;
        },
        create(reactor) {
            return new UraniumFuelCell(reactor);
        }
    }),
    uranium_cell_2: componentInfoTypeHint({
        name: 'Double Uranium Cell',
        description() {
            return 'Double uranium cell that produces x3 energy and heat of a singular uranium cell.';
        },
        texture: 'uranium_cell_2',
        cost() {
            return 5n;
        },
        create(reactor) {
            return new UraniumFuelCell(reactor);
        }
    }),
    uranium_cell_3: componentInfoTypeHint({
        name: 'Quad Uranium Cell',
        description() {
            return 'Quad uranium cell that produces x9 energy and heat of a singular uranium cell.';
        },
        texture: 'uranium_cell_3',
        cost() {
            return 20n;
        },
        create(reactor) {
            return new UraniumFuelCell(reactor);
        }
    })
} as const;
