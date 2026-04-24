import { System, World } from '$lib/ecs';
import { EventDispatcher } from '$lib/eventDispatcher';
import { ParticleBasicRenderer, ParticleLifetime } from '../component/particle/base';
import { ParticleExplosionRenderer } from '../component/particle/explosion';
import {
    SYSTEM_RENDER_DURABILITY,
    SYSTEM_RENDER_HEATABLE,
    SYSTEM_RENDER_SPRITE
} from '../component/tile/base/render';
import {
    SYSTEM_TICK_BASIC_GENERATOR,
    SYSTEM_TICK_BASIC_HEATVENT,
    SYSTEM_TICK_DURABILITY,
    SYSTEM_TICK_HEATABLE
} from '../component/tile/base/tick';
import { ATLAS } from '../textures';
import { GameCursor } from './cursor';
import { Dt, FrameInfo, TickInfo } from './info';
import { GameRenderOptions } from './options';
import { Reactor } from './reactor';
import { Upgrades } from './upgrades';

const CREATE_SYSTEMS = () => ({
    tick: [
        SYSTEM_TICK_HEATABLE,

        SYSTEM_TICK_BASIC_HEATVENT,

        SYSTEM_TICK_BASIC_GENERATOR,

        SYSTEM_TICK_DURABILITY,

        Reactor.SYSTEM_TICK_END,

        TickInfo.SYSTEM
    ],
    render: [
        FrameInfo.SYSTEM_FIRST,
        Dt.SYSTEM,

        new System(
            [CanvasRenderingContext2D, Reactor, GameRenderOptions],
            (ctx, reactor, renderOpts) => {
                const canvas = ctx.canvas;
                const targetWidth = reactor.width * renderOpts.scale;
                const targetHeight = reactor.height * renderOpts.scale;
                if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
                    canvas.width = targetWidth;
                    canvas.height = targetHeight;
                }
                ctx.reset();

                ctx.imageSmoothingEnabled = false;
                ctx.scale(renderOpts.scale, renderOpts.scale);
            }
        ),

        new System([CanvasRenderingContext2D, Reactor], (ctx, reactor) => {
            for (let x = 0; x < reactor.width; x++) {
                for (let y = 0; y < reactor.height; y++) {
                    ATLAS.draw(ctx, 'floor', x, y);
                }
            }
        }),

        SYSTEM_RENDER_SPRITE,
        SYSTEM_RENDER_HEATABLE,
        SYSTEM_RENDER_DURABILITY,

        ParticleLifetime.SYSTEM,
        ParticleBasicRenderer.SYSTEM,
        ParticleExplosionRenderer.SYSTEM,

        GameCursor.SYSTEM_RENDER,

        FrameInfo.SYSTEM_LAST
    ]
});

export type AnnounceMessage =
    | { type: 'message' | 'info' | 'debug'; message: string }
    | { type: 'error'; error: Error };

export class Game extends EventDispatcher<{
    tick: null;
    render: null;
    tickRender: null;
    announceMessage: AnnounceMessage;
}> {
    public readonly world: World<'tick' | 'render'>;

    public constructor() {
        super();

        this.world = new World(CREATE_SYSTEMS());

        this.world.setResource(this);

        this.world.setResource(new TickInfo());
        this.world.setResource(new Dt());
        this.world.setResource(new FrameInfo());

        this.world.setResource(new GameRenderOptions());

        this.world.setResource(new GameCursor());

        this.world.setResource(new Reactor());
        this.world.setResource(new Upgrades());
    }

    private cacheCanvas: HTMLCanvasElement | null = null;
    public setCanvas(canvas: HTMLCanvasElement): void {
        if (this.cacheCanvas == canvas) {
            return;
        }
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new Error("Your browser or machine doesn't support canvas rendering context 2d");
        }
        this.cacheCanvas = canvas;
        this.world.setResource(ctx);
    }

    public render(): void {
        this.world.runStage('render');
        this.dispatchEvent('render', null);
    }

    public tick(): void {
        this.world.runStage('tick');
        this.dispatchEvent('tick', null);
        this.dispatchEvent('tickRender', null);
    }

    public announceMessage(message: AnnounceMessage): void {
        this.dispatchEvent('announceMessage', message);
    }

    public destroy(): void {
        this.destroyDispatcher();
    }
}
