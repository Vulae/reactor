import { TextureAtlas, TextureAtlasAnimation } from '$lib/textureAtlas';
import ATLAS_IMAGE from '$lib/assets/tileset.png';

export const TILE_SIZE = 32;

export const ATLAS = new TextureAtlas(ATLAS_IMAGE, {
    empty: [0, 0, 32, 32],
    missing_texture: [0, 32, 32, 32],

    cursor_empty: [0, 288, 32, 32],
    cursor_selectable: [0, 320, 32, 32],
    cursor_unselectable: [0, 352, 32, 32],

    button_pause: [0, 384, 16, 16],
    button_play: [16, 384, 16, 16],
    button_step: [0, 400, 16, 16],
    button_fastforward: [16, 400, 16, 16],

    floor: [0, 64, 32, 32],
    big_tile: [0, 224, 64, 64],

    explosion_frame_1: [0, 96, 32, 32],
    explosion_frame_2: [0, 128, 32, 32],
    explosion_frame_3: [0, 160, 32, 32],
    explosion_frame_4: [0, 192, 32, 32],

    upgrade_power: [32, 288, 32, 32],
    upgrade_duration: [32, 320, 32, 32],
    upgrade_infinite: [32, 352, 32, 32],
    upgrade_plus: [32, 384, 32, 32],

    capacitor_basic: [128, 0, 32, 32],
    capacitor_advanced: [128, 32, 32, 32],
    capacitor_super: [128, 64, 32, 32],
    capacitor_wondrous: [128, 96, 32, 32],
    capacitor_ultimate: [128, 128, 32, 32],

    vent_basic: [160, 0, 32, 32],
    vent_advanced: [160, 32, 32, 32],
    vent_super: [160, 64, 32, 32],
    vent_wondrous: [160, 96, 32, 32],
    vent_ultimate: [160, 128, 32, 32],

    cell_uranium_single: [32, 0, 32, 32],
    cell_uranium_double: [64, 0, 32, 32],
    cell_uranium_quad: [96, 0, 32, 32],
    cell_plutonium_single: [32, 32, 32, 32],
    cell_plutonium_double: [64, 32, 32, 32],
    cell_plutonium_quad: [96, 32, 32, 32],
    cell_basic_3_single: [32, 64, 32, 32],
    cell_basic_3_double: [64, 64, 32, 32],
    cell_basic_3_quad: [96, 64, 32, 32],
    cell_basic_4_single: [32, 96, 32, 32],
    cell_basic_4_double: [64, 96, 32, 32],
    cell_basic_4_quad: [96, 96, 32, 32],
    cell_basic_5_single: [32, 128, 32, 32],
    cell_basic_5_double: [64, 128, 32, 32],
    cell_basic_5_quad: [96, 128, 32, 32],
    cell_basic_6_single: [32, 160, 32, 32],
    cell_basic_6_double: [64, 160, 32, 32],
    cell_basic_6_quad: [96, 160, 32, 32]
});

export const ATLAS_EXPLOSION = new TextureAtlasAnimation(ATLAS, [
    'explosion_frame_1',
    'explosion_frame_2',
    'explosion_frame_3',
    'explosion_frame_4'
]);
