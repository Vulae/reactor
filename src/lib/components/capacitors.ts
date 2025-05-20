import { TILESET, type GameComponentInfo } from '$lib/resources';
import * as bigint from '$lib/bigintUtil';
import {
    ComponentBase,
    type ComponentHeatable,
    type ComponentPowerbank,
    type TickSteps
} from './base';
import type { Reactor } from '$lib/reactor';

export class BasicCapacitor extends ComponentBase implements ComponentHeatable, ComponentPowerbank {
    public readonly info: GameComponentInfo;

    private readonly baseMaxHeat: bigint;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public maxHeat(_reactor: Reactor): bigint {
        return this.baseMaxHeat;
    }
    public heat: bigint = 0n;

    private readonly basePowerCapacity: bigint;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public powerCapacity(_reactor: Reactor): bigint {
        return this.basePowerCapacity;
    }

    public readonly texture: keyof typeof TILESET.textures;

    public constructor(
        info: GameComponentInfo,
        baseMaxHeat: bigint,
        basePowerCapacity: bigint,
        texture: keyof typeof TILESET.textures
    ) {
        super();
        this.info = info;
        this.baseMaxHeat = baseMaxHeat;
        this.basePowerCapacity = basePowerCapacity;
        this.texture = texture;
    }

    public isHeatable(): this is ComponentHeatable {
        return true;
    }
    public isPowerbank(): this is ComponentPowerbank {
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
        heatExplode(reactor, x, y) {
            if (this.heat > this.maxHeat(reactor)) {
                reactor.explode(x, y);
            }
        }
    };
}
