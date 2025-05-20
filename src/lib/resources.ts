import type { ComponentBase } from './components/base';
import { BasicCapacitor } from './components/capacitors';
import { BasicFuelCell } from './components/cells';
import { BasicVent } from './components/vents';
import type { Game } from './game';
import type { Reactor } from './reactor';
import { TextureAtlas, TextureAtlasAnimation } from './textureAtlas';

export const TILESET = new TextureAtlas('./tileset.png', {
    empty: [0, 0, 32, 32],
    missing_texture: [0, 32, 32, 32],

    cursor_empty: [0, 288, 32, 32],
    cursor_selectable: [0, 320, 32, 32],
    cursor_unselectable: [0, 352, 32, 32],

    floor: [0, 64, 32, 32],
    big_tile: [0, 224, 64, 64],

    explosion_frame_1: [0, 96, 32, 32],
    explosion_frame_2: [0, 128, 32, 32],
    explosion_frame_3: [0, 160, 32, 32],
    explosion_frame_4: [0, 192, 32, 32],

    capacitor_1: [128, 0, 32, 32],
    capacitor_2: [128, 32, 32, 32],
    capacitor_3: [128, 64, 32, 32],
    capacitor_4: [128, 96, 32, 32],
    capacitor_5: [128, 128, 32, 32],

    vent_1: [160, 0, 32, 32],
    vent_2: [160, 32, 32, 32],
    vent_3: [160, 64, 32, 32],
    vent_4: [160, 96, 32, 32],
    vent_5: [160, 128, 32, 32],

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

function componentInfoTypeHint<T extends GameComponentInfo>(callbackfn: (component: T) => T): T {
    const component = {};
    return Object.assign(component, callbackfn(component as T));
}

export const GAME_COMPONENTS = {
    capacitor_1: componentInfoTypeHint((info) => ({
        name: 'Basic Capacitor',
        description() {
            return 'Basic capacitor increases the total power storage of the reactor.';
        },
        texture: 'capacitor_1',
        cost() {
            return 500n;
        },
        create(): ComponentBase {
            return new BasicCapacitor(info, 10n, 100n, 'capacitor_1');
        }
    })),
    vent_1: componentInfoTypeHint((info) => ({
        name: 'Basic Vent',
        description() {
            return 'Basic vent reduces the heat of itself every tick.';
        },
        texture: 'vent_1',
        cost() {
            return 50n;
        },
        create(): ComponentBase {
            return new BasicVent(info, 25n, 2n, 'vent_1');
        }
    })),
    uranium_cell_1: componentInfoTypeHint((info) => ({
        name: 'Single Uranium Cell',
        description() {
            return 'Singular uranium cell produces energy and heat every tick.';
        },
        texture: 'uranium_cell_1',
        cost() {
            return 0n;
        },
        create(reactor): ComponentBase {
            return new BasicFuelCell(
                info,
                reactor,
                10,
                1n,
                1n,
                'uranium_cell_1',
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                (_reactor) => true
            );
        }
    })),
    uranium_cell_2: componentInfoTypeHint((info) => ({
        name: 'Double Uranium Cell',
        description() {
            return 'Double uranium cell produces x3 energy and heat of a singular uranium cell.';
        },
        texture: 'uranium_cell_2',
        cost() {
            return 5n;
        },
        create(reactor): ComponentBase {
            return new BasicFuelCell(
                info,
                reactor,
                10,
                3n,
                3n,
                'uranium_cell_2', // eslint-disable-next-line @typescript-eslint/no-unused-vars
                (_reactor) => true
            );
        }
    })),
    uranium_cell_3: componentInfoTypeHint((info) => ({
        name: 'Quad Uranium Cell',
        description() {
            return 'Quad uranium cell produces x9 energy and heat of a singular uranium cell.';
        },
        texture: 'uranium_cell_3',
        cost() {
            return 20n;
        },
        create(reactor): ComponentBase {
            return new BasicFuelCell(
                info,
                reactor,
                10,
                9n,
                9n,
                'uranium_cell_3', // eslint-disable-next-line @typescript-eslint/no-unused-vars
                (_reactor) => true
            );
        }
    }))
} as const;
