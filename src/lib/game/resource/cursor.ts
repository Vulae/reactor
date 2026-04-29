import { System, type Component, type Entity, type World } from '$lib/ecs';
import { TileDurability, TileOverwrite, TilePos } from '../component/tile/base/def';
import { ATLAS } from '../textures';
import { ComponentPlacer } from './componentPlacer';
import { Game } from './game';
import { Reactor } from './reactor';

export class GameCursor {
    private changed: boolean = false;

    private _click: 'none' | 'primary' | 'secondary' = 'none';
    public set click(click: 'none' | 'primary' | 'secondary') {
        this._click = click;
        this.changed = true;
    }
    public get click(): 'none' | 'primary' | 'secondary' {
        return this._click;
    }

    private lastPos: TilePos | null = null;
    private _pos: TilePos | null = null;
    public set pos(pos: TilePos | null) {
        if (pos == null) {
            this.lastPos = null;
            this._pos = null;
            this.changed = false;
            return;
        }
        this.lastPos = this.pos;
        this._pos = pos;
        if (this.lastPos == null || !pos.eq(this.lastPos)) {
            this.changed = true;
        }
    }
    public get pos(): TilePos | null {
        return this._pos;
    }

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
        [Game, CanvasRenderingContext2D, GameCursor, ComponentPlacer, Reactor],
        (game, ctx, cursor, placer, reactor) => {
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
                    game.setTickRerender();
                }
            } else if (cursor.pos && placer.selected) {
                ctx.save();
                ctx.translate(cursor.pos.x, cursor.pos.y);
                ctx.globalAlpha = 0.5;
                ATLAS.draw(ctx, ComponentPlacer.COMPONENTS[placer.selected].info(game).texture);
                ctx.restore();
            }
            if (cursor.changed && cursor.pos && placer.selected && cursor.click == 'primary') {
                const selectedPlacer = ComponentPlacer.COMPONENTS[placer.selected];
                const selectedPlacerInfo = selectedPlacer.info(game);
                if (reactor.money >= selectedPlacerInfo.cost) {
                    if (
                        cursor.placeTile(
                            game,
                            cursor.pos,
                            selectedPlacer.place(game),
                            selectedPlacerInfo.overwriteType
                        )
                    ) {
                        reactor.money -= selectedPlacerInfo.cost;
                        game.setTickRerender();
                    }
                }
            }
            cursor.changed = false;
        }
    );
}
