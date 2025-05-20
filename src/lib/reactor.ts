import type { Game } from './game';
import { ExplodeParticle } from './particles';
import { TILESET } from './resources';
import { resize } from './util';
import * as bigint from '$lib/bigintUtil';
import type { ComponentBase } from './components/base';

export const RENDER_SCALE: number = 48;

export const TickStep = {
    applyHeat: 'apply_heat',
    dissipateHeat: 'dissipate_heat',
    heatExplode: 'heat_explode',
    applyPower: 'apply_power',
    dissipatePower: 'dissipate_power',
    applyDurability: 'apply_durability',
    autoPlace: 'auto_place'
} as const;

const TickStepOrder: (keyof typeof TickStep)[] = [
    'applyHeat',
    'dissipateHeat',
    'heatExplode',
    'applyPower',
    'dissipatePower',
    'applyDurability',
    'autoPlace'
];

export interface Particle {
    /** If returning false, particle will be destroyed */
    render(ctx: CanvasRenderingContext2D): boolean;
}

export const PATTERN_X: [number, number][] = [
    [0, -1],
    [1, 0],
    [0, 1],
    [-1, 0]
];

export class ReactorUpgrades {
    public readonly reactor: Reactor;
    public constructor(reactor: Reactor) {
        this.reactor = reactor;
    }
    public get game(): Game {
        return this.reactor.game;
    }

    public uraniumAutoPlace: boolean = false;
    public uraniumPowerGeneration: number = 0;
    public uraniumDurability: number = 0;
}

export class Reactor {
    public readonly game: Game;
    public constructor(game: Game) {
        this.game = game;
        this.upgrades = new ReactorUpgrades(this);
    }

    public readonly size: number = 10;

    public readonly upgrades: ReactorUpgrades;

    public heat: bigint = 50n;
    public maxHeat: bigint = 100n;

    public power: bigint = 0n;

    private components: (ComponentBase | null)[] = new Array(this.size * this.size).fill(null);

    public contains(x: number, y: number): boolean {
        if (!Number.isInteger(x) || !Number.isInteger(y)) return false;
        return x >= 0 && x < this.size && y >= 0 && y < this.size;
    }

    public getComponent(x: number, y: number): ComponentBase | null {
        if (!this.contains(x, y)) return null;
        return this.components[x + y * this.size];
    }

    public setComponent(x: number, y: number, component: ComponentBase | null): void {
        if (!this.contains(x, y)) return;
        const previous = this.getComponent(x, y);
        if (previous) {
            previous.destroy?.(this, x, y);
        }
        this.components[x + y * this.size] = component;
    }

    public getComponentsPattern(
        x: number,
        y: number,
        pattern: [number, number][]
    ): ComponentBase[] {
        return pattern
            .map(([dx, dy]) => this.getComponent(x + dx, y + dy))
            .filter((component) => component != null);
    }

    public applyHeatPattern(x: number, y: number, pattern: [number, number][], heat: bigint): void {
        const components = this.getComponentsPattern(x, y, pattern);
        const heatables = components.filter((component) => component.isHeatable());

        if (heatables.length == 0) {
            this.heat += heat;
            return;
        }
        if (heatables.length == 1) {
            heatables[0].heat += heat;
            return;
        }

        const heatPerElement = heat / BigInt(heatables.length);
        const heatRemainder = heat % BigInt(heatables.length);
        const lesserHeatIndex = heatables.reduce(
            (minIndex, heatable, heatableIndex) =>
                heatable.heat < heatables[minIndex].heat ? heatableIndex : minIndex,
            // Math.floor(Math.random() * heatables.length)
            0
        );
        heatables.forEach(
            (component, i) =>
                (component.heat +=
                    i != lesserHeatIndex ? heatPerElement : heatPerElement + heatRemainder)
        );
    }

    public explode(x: number, y: number): void {
        if (this.getComponent(x, y)) {
            this.addParticle(new ExplodeParticle(x, y));
        }
        this.setComponent(x, y, null);
    }

    // Regular canvas renders every tick
    private canvas: HTMLCanvasElement | null = null;
    private ctx: CanvasRenderingContext2D | null = null;
    private canvasResizeListenerDestroy: { destroy?: () => void } | null = null;

    // Animation canvas renders every frame
    private animationCanvas: HTMLCanvasElement | null = null;
    private animationCtx: CanvasRenderingContext2D | null = null;
    private animationCanvasResizeListenerDestroy: { destroy?: () => void } | null = null;

    public cursor: { x: number; y: number } | null = null;

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
            this.animationCanvasResizeListenerDestroy = null;
        } else {
            this.animationCanvas = animationCanvas;
            this.animationCtx = this.animationCanvas.getContext('2d')!;
            this.animationCanvasResizeListenerDestroy =
                resize(this.animationCanvas, (width, height) => {
                    if (!this.animationCanvas) return;
                    this.animationCanvas.width = width;
                    this.animationCanvas.height = height;
                    if (this.animationCanvas.width != this.animationCanvas.height) {
                        console.warn('Bad sizing on reactor animation canvas.', this.canvas);
                    }
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
                const component = this.getComponent(x, y);
                if (component) {
                    this.ctx.save();
                    this.ctx.translate(x, y);
                    component.render(this.ctx, this, x, y);
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
            this.animationCtx.save();
            if (!this.particles[i].render(this.animationCtx)) {
                this.particles.splice(i, 1);
            }
            this.animationCtx.restore();
        }

        if (this.cursor) {
            if (!this.contains(this.cursor.x, this.cursor.y)) return;
            if (this.getComponent(this.cursor.x, this.cursor.y)) {
                TILESET.draw(this.animationCtx, 'cursor_selectable', this.cursor.x, this.cursor.y);
            } else {
                if (this.game.selectedComponent) {
                    this.animationCtx.save();

                    this.animationCtx.globalAlpha = 0.5;
                    TILESET.draw(
                        this.animationCtx,
                        this.game.selectedComponent.texture,
                        this.cursor.x,
                        this.cursor.y
                    );

                    if (this.game.money < this.game.selectedComponent.cost(this.game)) {
                        this.animationCtx.fillStyle = 'red';
                        // This will tint already existing stuff, oh well!
                        this.animationCtx.globalCompositeOperation = 'source-atop';
                        this.animationCtx.fillRect(this.cursor.x, this.cursor.y, 1, 1);
                    }

                    this.animationCtx.restore();
                }
                TILESET.draw(this.animationCtx, 'cursor_empty', this.cursor.x, this.cursor.y);
            }
        }
    }

    public maxPower(): bigint {
        let power: bigint = 100n;
        for (let x = 0; x < this.size; x++) {
            for (let y = 0; y < this.size; y++) {
                const component = this.getComponent(x, y);
                if (component && component.isPowerbank()) {
                    power += component.powerCapacity(this);
                }
            }
        }
        return power;
    }

    public tick(): void {
        TickStepOrder.forEach((state) => {
            for (let x = 0; x < this.size; x++) {
                for (let y = 0; y < this.size; y++) {
                    const component = this.getComponent(x, y);
                    component?.tickSteps?.[state]?.call(component, this, x, y);
                }
            }

            if (state == 'dissipatePower') {
                if (this.power > this.maxPower()) {
                    this.power = this.maxPower();
                }
            }
        });

        // Reactor heat dissipation
        this.heat -= 1n;
        if (this.heat < 0n) {
            this.heat = 0n;
        }

        // Reactor meltdown
        if (this.heat > this.maxHeat) {
            for (let x = 0; x < this.size; x++) {
                for (let y = 0; y < this.size; y++) {
                    if (this.getComponent(x, y)) {
                        this.explode(x, y);
                        this.heat = bigint.multiplyFloat(this.heat, 1.1);
                    }
                }
            }

            this.heat = bigint.multiplyFloat(this.heat, 0.9);
        }
    }
}
