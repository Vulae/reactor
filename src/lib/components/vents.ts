import { TILESET, type GameComponentInfo } from '$lib/resources';
import * as bigint from '$lib/bigintUtil';
import { ComponentBase, type ComponentHeatable, type TickSteps } from './base';
import type { Reactor } from '$lib/reactor';

export class BasicVent extends ComponentBase implements ComponentHeatable {
    public readonly info: GameComponentInfo;

    private readonly baseMaxHeat: bigint;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public maxHeat(_reactor: Reactor): bigint {
        return this.baseMaxHeat;
    }
    private readonly baseHeatDissipation: bigint;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public heatDissipation(_reactor: Reactor): bigint {
        return this.baseHeatDissipation;
    }
    public heat: bigint = 0n;

    public readonly texture: keyof typeof TILESET.textures;

    public constructor(
        info: GameComponentInfo,
        baseMaxHeat: bigint,
        baseHeatDissipation: bigint,
        texture: keyof typeof TILESET.textures
    ) {
        super();
        this.info = info;
        this.baseMaxHeat = baseMaxHeat;
        this.baseHeatDissipation = baseHeatDissipation;
        this.texture = texture;
    }

    public isHeatable(): this is ComponentHeatable {
        return true;
    }

    public sellAmount(reactor: Reactor): bigint {
        const percent = bigint.percentage(this.heat, this.maxHeat(reactor));
        return bigint.multiplyFloat(this.info.cost(reactor.game), 1 - percent);
    }

    public render(ctx: CanvasRenderingContext2D, reactor: Reactor): void {
        TILESET.draw(ctx, this.texture);
        ctx.fillStyle = 'red';
        ctx.fillRect(0, 0.9, bigint.percentage(this.heat, this.maxHeat(reactor)), 0.1);
    }

    public readonly tickSteps: TickSteps<this> = {
        dissipateHeat(reactor) {
            this.heat -= this.heatDissipation(reactor);
            if (this.heat < 0) {
                this.heat = 0n;
            }
        },
        heatExplode(reactor, x, y) {
            if (this.heat > this.maxHeat(reactor)) {
                reactor.explode(x, y);
            }
        }
    };
}
