import { PATTERN_X, type Reactor } from '$lib/reactor';
import { TILESET, type GameComponentInfo } from '$lib/resources';
import { ComponentBase, type TickSteps } from './base';

export class BasicFuelCell extends ComponentBase {
    public readonly info: GameComponentInfo;

    private readonly baseDurability: number;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public maxDurability(reactor: Reactor): number {
        return this.baseDurability;
    }
    public durability: number;

    private readonly baseHeatGeneration: bigint;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public heatGeneration(_reactor: Reactor): bigint {
        return this.baseHeatGeneration;
    }

    private readonly basePowerGeneration: bigint;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public powerGeneration(_reactor: Reactor): bigint {
        return this.basePowerGeneration;
    }

    public readonly texture: keyof typeof TILESET.textures;
    private readonly shouldAutoplace: (reactor: Reactor) => boolean;

    public constructor(
        info: GameComponentInfo,
        reactor: Reactor,
        baseDurability: number,
        baseHeatGeneration: bigint,
        basePowerGeneration: bigint,
        texture: keyof typeof TILESET.textures,
        shouldAutoPlace: (reactor: Reactor) => boolean
    ) {
        super();
        this.info = info;
        this.baseDurability = baseDurability;
        this.baseHeatGeneration = baseHeatGeneration;
        this.basePowerGeneration = basePowerGeneration;
        this.texture = texture;
        this.durability = this.maxDurability(reactor);
        this.shouldAutoplace = shouldAutoPlace;
    }

    public render(ctx: CanvasRenderingContext2D, reactor: Reactor): void {
        TILESET.draw(ctx, this.texture);
        ctx.fillStyle = 'blue';
        ctx.fillRect(0, 0.9, this.durability / this.maxDurability(reactor), 0.1);
    }

    public readonly tickSteps: TickSteps<this> = {
        applyHeat(reactor, x, y) {
            reactor.applyHeatPattern(x, y, PATTERN_X, this.heatGeneration(reactor));
        },
        applyPower(reactor) {
            reactor.power += this.powerGeneration(reactor);
        },
        applyDurability(reactor, x, y) {
            this.durability--;
            if (this.durability <= 0) {
                reactor.setComponent(
                    x,
                    y,
                    new BasicCellGhost(this.info, this.texture, this.shouldAutoplace)
                );
            }
        }
    };
}

export class BasicCellGhost extends ComponentBase {
    public readonly info: GameComponentInfo;
    public readonly texture: keyof typeof TILESET.textures;
    private readonly shouldAutoplace: (reactor: Reactor) => boolean;

    public constructor(
        info: GameComponentInfo,
        texture: keyof typeof TILESET.textures,
        shouldAutoplace: (reactor: Reactor) => boolean
    ) {
        super();
        this.info = info;
        this.texture = texture;
        this.shouldAutoplace = shouldAutoplace;
    }

    public render(ctx: CanvasRenderingContext2D): void {
        ctx.globalAlpha = 0.5;
        TILESET.draw(ctx, this.texture);
    }

    public readonly tickSteps: TickSteps<this> = {
        autoPlace(reactor, x, y) {
            if (this.shouldAutoplace(reactor)) {
                const cost = this.info.cost(reactor.game);
                if (reactor.game.money >= cost) {
                    reactor.game.money -= cost;
                    reactor.setComponent(x, y, this.info.create(reactor));
                }
            }
        }
    };
}
