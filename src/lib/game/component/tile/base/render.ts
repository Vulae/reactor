import { System } from '$lib/ecs';
import { ATLAS, TILE_SIZE } from '$lib/game/textures';
import { clamp } from '$lib/util';
import { TileBasicSprite, TileDurability, TileHeatable, TilePos } from './def';

const BAR_SIZE: number = (1 / TILE_SIZE) * 4;

export const SYSTEM_RENDER_SPRITE = new System(
    [CanvasRenderingContext2D, [TileBasicSprite, TilePos]],
    (ctx, entities) => {
        for (const entity of entities) {
            const [sprite, pos] = entity.components;
            ctx.save();
            ctx.translate(pos.x, pos.y);
            entity.with([TileDurability], (durability) => {
                if (durability.isDead()) {
                    ctx.globalAlpha = 0.5;
                }
            });
            ATLAS.draw(ctx, sprite.texture);
            ctx.restore();
        }
    }
);

export const SYSTEM_RENDER_HEATABLE = new System(
    [CanvasRenderingContext2D, [TileHeatable, TilePos]],
    (ctx, entities) => {
        for (const entity of entities) {
            const [heatable, pos] = entity.components;
            ctx.save();
            ctx.translate(pos.x, pos.y);
            ctx.fillStyle = 'red';
            ctx.fillRect(0, 1 - BAR_SIZE, clamp(heatable.heat / heatable.maxHeat, 0, 1), BAR_SIZE);
            ctx.restore();
        }
    }
);

export const SYSTEM_RENDER_DURABILITY = new System(
    [CanvasRenderingContext2D, [TileDurability, TilePos]],
    (ctx, entities) => {
        for (const entity of entities) {
            const [dur, pos] = entity.components;
            if (dur.isDead()) continue;
            ctx.save();
            ctx.translate(pos.x, pos.y);
            ctx.fillStyle = 'blue';
            ctx.fillRect(0, 1 - BAR_SIZE, dur.durability / dur.maxDurability, BAR_SIZE);
            ctx.restore();
        }
    }
);
