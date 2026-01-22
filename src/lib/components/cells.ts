import { PATTERN_X, type Reactor } from '$lib/reactor';
import { TILESET, type GameComponentInfo } from '$lib/resources';
import { ComponentBase, ComponentType, type TickSteps } from './base';

export enum BasicCellType {
    Uranium
}

export class BasicFuelCell extends ComponentBase {
    public readonly type: ComponentType = ComponentType.Cell;
    public get tier(): number {
        return this.info.tier;
    }

    public readonly info: GameComponentInfo;
    public readonly basicCellType: BasicCellType;

    private readonly baseDurability: number;
    public maxDurability(reactor: Reactor): number {
        return (
            this.baseDurability *
            (reactor.upgrades.basicCellUpgrades[this.basicCellType].durability + 1)
        );
    }
    public durability: number;

    private readonly baseHeatGeneration: bigint;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public heatGeneration(_reactor: Reactor): bigint {
        return this.baseHeatGeneration;
    }

    private readonly basePowerGeneration: bigint;
    public powerGeneration(reactor: Reactor): bigint {
        return (
            this.basePowerGeneration *
            BigInt(reactor.upgrades.basicCellUpgrades[this.basicCellType].powerGeneration + 1)
        );
    }

    public readonly texture: keyof typeof TILESET.textures;

    public constructor(
        info: GameComponentInfo,
        basicCellType: BasicCellType,
        reactor: Reactor,
        baseDurability: number,
        baseHeatGeneration: bigint,
        basePowerGeneration: bigint,
        texture: keyof typeof TILESET.textures
    ) {
        super();
        this.info = info;
        this.basicCellType = basicCellType;
        this.baseDurability = baseDurability;
        this.baseHeatGeneration = baseHeatGeneration;
        this.basePowerGeneration = basePowerGeneration;
        this.texture = texture;
        this.durability = this.maxDurability(reactor);
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
                    new BasicCellSpent(this.info, this.basicCellType, this.texture)
                );
            }
        }
    };
}

export class BasicCellSpent extends ComponentBase {
    public readonly type: ComponentType = ComponentType.SpentCell;
    public readonly tier: number = 0;

    public readonly info: GameComponentInfo;
    public readonly basicCellType: BasicCellType;
    public readonly texture: keyof typeof TILESET.textures;

    public constructor(
        info: GameComponentInfo,
        type: BasicCellType,
        texture: keyof typeof TILESET.textures
    ) {
        super();
        this.info = info;
        this.basicCellType = type;
        this.texture = texture;
    }

    public render(ctx: CanvasRenderingContext2D): void {
        ctx.globalAlpha = 0.5;
        TILESET.draw(ctx, this.texture);
    }

    public readonly tickSteps: TickSteps<this> = {
        autoPlace(reactor, x, y) {
            if (reactor.upgrades.basicCellUpgrades[this.basicCellType].autoPlace) {
                const cost = this.info.cost(reactor.game);
                if (reactor.game.money >= cost) {
                    reactor.game.money -= cost;
                    reactor.setComponent(x, y, this.info.create(reactor));
                }
            }
        }
    };
}
