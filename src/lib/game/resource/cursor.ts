import { System, type Component, type Entity, type World } from '$lib/ecs';
import { TileDurability, TileOverwrite, TilePos } from '../component/tile/base/def';
import { ATLAS } from '../textures';
import { Game } from './game';
import { Reactor } from './reactor';

export class GameCursor {
    public pos: TilePos | null = null;
    public click: 'none' | 'primary' | 'secondary' = 'none';
    public placer: {
        readonly costMoney: number;
        readonly texture: keyof (typeof ATLAS)['textures'];
        readonly overwriteType?: string;
        readonly create: (game: Game) => Component[];
    } | null = null;

    public getTile(world: World): Entity<[TilePos]> | null {
        if (!this.pos) {
            return null;
        }
        const entities = world.queryEntities(this.pos.queryOnPos([TilePos]));
        return entities.length > 0 ? entities[0] : null;
    }

    private placeTile(
        game: Game,
        pos: TilePos,
        tile: Component[],
        overwriteType?: string
    ): boolean {
        const reactor = game.world.getResource(Reactor);
        if (!reactor.containsPos(pos) || reactor.isOverheating()) {
            return false;
        }
        // If component at position is ghost
        game.world
            .queryEntities(pos.queryOnPos([]).join(TileDurability.queryIsDead(true, [])))
            .forEach((entity) => entity.destroy());
        // If component at position is overwritable
        if (overwriteType !== undefined) {
            game.world
                .queryEntities(
                    pos
                        .queryOnPos([])
                        .filter(
                            [TileOverwrite],
                            (overwritable) => overwritable.type == overwriteType
                        )
                )
                .forEach((entity) => entity.destroy());
        }
        // If component at position already exists
        if (game.world.queryEntities(pos.queryOnPos([])).length > 0) {
            return false;
        }
        game.world.addEntity([pos, ...tile]);
        return true;
    }

    public static readonly SYSTEM_RENDER = new System(
        [Game, CanvasRenderingContext2D, GameCursor, Reactor],
        (game, ctx, cursor, reactor) => {
            // TODO: Clean this up, its ugly
            const tile = cursor.getTile(game.world);
            if (tile) {
                const [pos] = tile.components;
                ctx.save();
                ctx.translate(pos.x, pos.y);
                ATLAS.draw(ctx, 'cursor_empty');
                ctx.restore();
                if (cursor.click == 'secondary') {
                    tile.destroy();
                    game.dispatchEvent('tickRender', null);
                }
            } else if (cursor.pos && cursor.placer) {
                ctx.save();
                ctx.translate(cursor.pos.x, cursor.pos.y);
                ctx.globalAlpha = 0.5;
                ATLAS.draw(ctx, cursor.placer.texture);
                ctx.restore();
            }
            if (cursor.pos && cursor.placer && cursor.click == 'primary') {
                if (reactor.money >= cursor.placer.costMoney) {
                    if (
                        cursor.placeTile(
                            game,
                            cursor.pos,
                            cursor.placer.create(game),
                            cursor.placer.overwriteType
                        )
                    ) {
                        reactor.money -= cursor.placer.costMoney;
                        game.dispatchEvent('tickRender', null);
                    }
                }
            }
        }
    );
}
