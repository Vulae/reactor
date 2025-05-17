import type { Game } from './game';
import { ExplodeParticle } from './particles';
import { TILESET } from './resources';
import { resize } from './util';
import * as bigint from '$lib/bigintUtil';

export const RENDER_SCALE: number = 48;

export const TickStep = {
    applyHeat: 'apply_heat',
    dissipateHeat: 'dissipate_heat',
    heatExplode: 'heat_explode',
    applyPower: 'apply_power',
    dissipatePower: 'dissipate_power',
    applyDurability: 'apply_durability'
} as const;

export type TickSteps<T> = {
    [key in keyof typeof TickStep]?: (this: T, reactor: Reactor, x: number, y: number) => void;
};

export interface ComponentHeatable {
    heat: bigint;
}

export interface ComponentBase {
    isHeatable(): this is ComponentHeatable;

    /** Rendering context is already translated to x, y */
    render(ctx: CanvasRenderingContext2D, reactor: Reactor, x: number, y: number): void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    readonly tickSteps?: TickSteps<any>;
    destroy?(reactor: Reactor, x: number, y: number): void;
}

export interface Particle {
    /** If returning false, particle will be destroyed */
    render(ctx: CanvasRenderingContext2D): boolean;
}

export const PATTERN_X: [number, number][] = [
    [-1, 0],
    [0, -1],
    [1, 0],
    [0, 1]
];

export class Reactor {
    public readonly game: Game;
    public constructor(game: Game) {
        this.game = game;
    }

    public readonly size: number = 10;

    public heat: bigint = 50n;
    public maxHeat: bigint = 100n;

    public power: bigint = 0n;
    public maxPower: bigint = 100n;

    private elements: (ComponentBase | null)[] = new Array(this.size * this.size).fill(null);

    public contains(x: number, y: number): boolean {
        if (!Number.isInteger(x) || !Number.isInteger(y)) return false;
        return x >= 0 && x < this.size && y >= 0 && y < this.size;
    }

    public getElement(x: number, y: number): ComponentBase | null {
        if (!this.contains(x, y)) return null;
        return this.elements[x + y * this.size];
    }

    public setElement(x: number, y: number, element: ComponentBase | null): void {
        if (!this.contains(x, y)) return;
        const previous = this.getElement(x, y);
        if (previous) {
            previous.destroy?.(this, x, y);
        }
        this.elements[x + y * this.size] = element;
    }

    public explode(x: number, y: number): void {
        if (this.getElement(x, y)) {
            this.addParticle(new ExplodeParticle(x, y));
        }
        this.setElement(x, y, null);
    }

    public getComponentsPattern(
        x: number,
        y: number,
        pattern: [number, number][]
    ): ComponentBase[] {
        return pattern
            .map(([dx, dy]) => this.getElement(x + dx, y + dy))
            .filter((component) => component != null);
    }

    public applyHeatPattern(x: number, y: number, pattern: [number, number][], heat: bigint): void {
        const components = this.getComponentsPattern(x, y, pattern);
        const heatable = components.filter((component) => component.isHeatable());
        if (heatable.length == 0) {
            this.heat += heat;
            return;
        }
        if (heatable.length == 1) {
            heatable[0].heat += heat;
            return;
        }
        if (heat < 1e6) {
            const heatPerElement = Math.floor(Number(heat) / heatable.length);
            const lastExtraHeat = Number(heat) % heatable.length;
            for (let i = 0; i < heatable.length - 1; i++) {
                heatable[i].heat += BigInt(heatPerElement);
            }
            heatable[heatable.length - 1].heat += BigInt(lastExtraHeat);
        } else {
            const heatPerElement = heat / BigInt(heatable.length);
            heatable.forEach((component) => (component.heat += heatPerElement));
        }
    }

    private canvas: HTMLCanvasElement | null = null;
    private ctx: CanvasRenderingContext2D | null = null;
    private canvasResizeListenerDestroy: { destroy?: () => void } | null = null;

    private animationCanvas: HTMLCanvasElement | null = null;
    private animationCtx: CanvasRenderingContext2D | null = null;
    private animationCanvasResizeListenerDestroy: { destroy?: () => void } | null = null;

    public setCanvas(
        canvas: HTMLCanvasElement | null,
        animationCanvas: HTMLCanvasElement | null
    ): void {
        if (canvas == null) {
            this.canvas = null;
            this.canvasResizeListenerDestroy?.destroy?.();
            this.canvasResizeListenerDestroy = null;
        } else {
            this.canvas = canvas;
            this.ctx = this.canvas.getContext('2d')!;
            this.canvasResizeListenerDestroy =
                resize(this.canvas, (width, height) => {
                    if (!this.canvas) return;
                    this.canvas.style.width = `${this.size * RENDER_SCALE}px`;
                    this.canvas.style.height = `${this.size * RENDER_SCALE}px`;
                    this.canvas.width = width;
                    this.canvas.height = height;
                    // if (this.canvas.width != this.canvas.height) {
                    //     console.warn('Bad sizing on reactor canvas.', this.canvas);
                    // }
                    this.render();
                }) ?? null;
        }
        if (animationCanvas == null) {
            this.animationCanvas = null;
            this.animationCanvasResizeListenerDestroy?.destroy?.();
            this.canvasResizeListenerDestroy = null;
        } else {
            this.animationCanvas = animationCanvas;
            this.animationCtx = this.animationCanvas.getContext('2d')!;
            this.animationCanvasResizeListenerDestroy =
                resize(this.animationCanvas, (width, height) => {
                    if (!this.animationCanvas) return;
                    this.animationCanvas.width = width;
                    this.animationCanvas.height = height;
                    // if (this.animationCanvas.width != this.animationCanvas.height) {
                    //     console.warn('Bad sizing on reactor animation canvas.', this.canvas);
                    // }
                    this.animationRender();
                }) ?? null;
        }
    }

    public destroy(): void {
        this.setCanvas(null, null);
    }

    public render(): void {
        if (!this.canvas || !this.ctx) return;
        this.ctx.reset();
        this.ctx.imageSmoothingEnabled = false;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.scale(this.canvas.width / this.size, this.canvas.height / this.size);

        for (let x = 0; x < this.size; x++) {
            for (let y = 0; y < this.size; y++) {
                TILESET.draw(this.ctx, 'floor', x, y);
                const element = this.getElement(x, y);
                if (element) {
                    this.ctx.save();
                    this.ctx.translate(x, y);
                    element.render(this.ctx, this, x, y);
                    this.ctx.restore();
                }
            }
        }
    }

    private particles: Particle[] = [];

    public addParticle(particle: Particle): void {
        this.particles.push(particle);
    }

    public animationRender(): void {
        if (!this.animationCanvas || !this.animationCtx) return;
        this.animationCtx.reset();
        this.animationCtx.imageSmoothingEnabled = false;

        this.animationCtx.clearRect(0, 0, this.animationCanvas.width, this.animationCanvas.height);

        this.animationCtx.scale(
            this.animationCanvas.width / this.size,
            this.animationCanvas.height / this.size
        );

        for (let i = this.particles.length - 1; i >= 0; i--) {
            if (!this.particles[i].render(this.animationCtx)) {
                this.particles.splice(i, 1);
            }
        }
    }

    public tick(): void {
        for (const _state in TickStep) {
            const state = _state as keyof typeof TickStep;
            for (let x = 0; x < this.size; x++) {
                for (let y = 0; y < this.size; y++) {
                    const element = this.getElement(x, y);
                    element?.tickSteps?.[state]?.call(element, this, x, y);
                }
            }

            if (state == 'dissipatePower') {
                if (this.power > this.maxPower) {
                    this.power = this.maxPower;
                }
            }
        }

        // Reactor heat dissipation
        this.heat -= 1n;
        if (this.heat < 0n) {
            this.heat = 0n;
        }

        // Reactor meltdown
        if (this.heat > this.maxHeat) {
            for (let x = 0; x < this.size; x++) {
                for (let y = 0; y < this.size; y++) {
                    if (this.getElement(x, y)) {
                        this.explode(x, y);
                        this.heat = bigint.multiplyFloat(this.heat, 1.1);
                    }
                }
            }
        }
    }
}
