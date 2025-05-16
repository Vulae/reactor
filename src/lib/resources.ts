import { TextureAtlas, TextureAtlasAnimation } from './textureAtlas';

export const TILESET = new TextureAtlas('./tileset.png', {
    empty: [0, 0, 16, 16],
    floor: [0, 16, 16, 16],
    uranium_cell_1: [16, 0, 16, 16]
});

export const EXPLOSION = new TextureAtlasAnimation(
    new TextureAtlas('./explosion.png', {
        frame_1: [0, 0, 16, 16],
        frame_2: [0, 16, 16, 16],
        frame_3: [0, 32, 16, 16],
        frame_4: [0, 48, 16, 16]
    }),
    ['frame_1', 'frame_2', 'frame_3', 'frame_4']
);
