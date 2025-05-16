import {
    PATTERN_X,
    type ComponentBase,
    type ComponentHeatable,
    type Reactor,
    type TickSteps
} from '$lib/reactor';
import { TILESET } from '$lib/resources';

export abstract class BasicFuelCell implements ComponentBase {
    public abstract initialDurability(): number;
    public abstract readonly INITIAL_HEAT_GENERATION: number;
    public abstract readonly INITIAL_POWER_GENERATION: number;

    public abstract readonly TEXTURE: keyof typeof TILESET.textures;

    public durability: number;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public constructor(reactor: Reactor) {
        this.durability = this.initialDurability();
    }

    public isHeatable(): this is ComponentHeatable {
        return false;
    }

    public render(ctx: CanvasRenderingContext2D): void {
        TILESET.draw(ctx, this.TEXTURE);
        ctx.fillStyle = 'blue';
        ctx.fillRect(0, 0.9, this.durability / this.initialDurability(), 0.1);
    }

    public readonly tickSteps: TickSteps<this> = {
        applyHeat(reactor, x, y) {
            reactor.applyHeatPattern(x, y, PATTERN_X, this.INITIAL_HEAT_GENERATION);
        },
        applyPower(reactor) {
            reactor.power += this.INITIAL_POWER_GENERATION;
        },
        applyDurability(reactor, x, y) {
            this.durability--;
            if (this.durability <= 0) {
                reactor.setElement(x, y, null);
            }
        }
    };
}

export class UraniumFuelCell extends BasicFuelCell {
    public initialDurability(): number {
        return 20;
    }
    public readonly INITIAL_HEAT_GENERATION: number = 1;
    public readonly INITIAL_POWER_GENERATION: number = 1;
    public readonly TEXTURE: keyof typeof TILESET.textures = 'uranium_cell_1';
}
