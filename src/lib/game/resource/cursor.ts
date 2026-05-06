import { System, type Component, type Entity, type World } from '$lib/ecs';
import { TileDurability, TileType, TilePos } from '../component/tile/base';
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
        if (entities.length > 1) {
            console.warn(
                `GameCursor.getTile: Multiple entities at the same position: ${this.pos.x}, ${this.pos.y} `,
                entities
            );
        }
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
                            [TileType],
                            (overwritable) => overwritable.weakType == overwriteType
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

    private tryBuy(game: Game, pos: TilePos): void {
        const placer = game.world.getResource(ComponentPlacer);
        if (!placer.selected) return;
        const reactor = game.world.getResource(Reactor);
        const selectedPlacer = ComponentPlacer.COMPONENTS[placer.selected];
        const selectedPlacerInfo = selectedPlacer.info(game);
        if (reactor.money < selectedPlacerInfo.cost) return;
        if (this.placeTile(game, pos, selectedPlacer.place(game), selectedPlacerInfo.weakType)) {
            reactor.money -= selectedPlacerInfo.cost;
            game.setTickRerender();
            game.setNeedsSetup();
        }
    }

    private trySellOrDestroy(game: Game, _pos: TilePos): void {
        const entity = this.getTile(game.world);
        if (!entity) return;
        entity.destroy();
        // TODO: Tile selling
        game.setTickRerender();
        game.setNeedsSetup();
    }

    public static readonly SYSTEM_RENDER = new System(
        [Game, CanvasRenderingContext2D, GameCursor, ComponentPlacer],
        (game, ctx, cursor, placer) => {
            const tile = cursor.getTile(game.world);
            if (tile) {
                const [pos] = tile.components;
                ctx.save();
                ctx.translate(pos.x, pos.y);
                ATLAS.draw(ctx, 'cursor_empty');
                ctx.restore();
            } else if (cursor.pos && placer.selected) {
                ctx.save();
                ctx.translate(cursor.pos.x, cursor.pos.y);
                ctx.globalAlpha = 0.5;
                ATLAS.draw(ctx, ComponentPlacer.COMPONENTS[placer.selected].info(game).texture);
                ctx.restore();
            }
            if (cursor.changed && cursor.pos) {
                if (cursor.click == 'primary') {
                    cursor.tryBuy(game, cursor.pos);
                } else if (cursor.click == 'secondary') {
                    cursor.trySellOrDestroy(game, cursor.pos);
                }
            }
            cursor.changed = false;
        }
    );
}
