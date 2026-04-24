import { TextureAtlas, TextureAtlasAnimation } from '$lib/textureAtlas';
import ATLAS_IMAGE from '$lib/assets/tileset.png';

export const TILE_SIZE = 32;

export const ATLAS = new TextureAtlas(ATLAS_IMAGE, {
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
    plutonium_cell_1: [32, 32, 32, 32],
    plutonium_cell_2: [64, 32, 32, 32],
    plutonium_cell_3: [96, 32, 32, 32],
    unnamed_2_cell_1: [32, 64, 32, 32],
    unnamed_2_cell_2: [64, 64, 32, 32],
    unnamed_2_cell_3: [96, 64, 32, 32],
    unnamed_3_cell_1: [32, 96, 32, 32],
    unnamed_3_cell_2: [64, 96, 32, 32],
    unnamed_3_cell_3: [96, 96, 32, 32],

    upgrade_power: [32, 288, 32, 32],
    upgrade_duration: [32, 320, 32, 32],
    upgrade_infinite: [32, 352, 32, 32]
});

export const ATLAS_EXPLOSION = new TextureAtlasAnimation(ATLAS, [
    'explosion_frame_1',
    'explosion_frame_2',
    'explosion_frame_3',
    'explosion_frame_4'
]);
