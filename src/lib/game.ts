import { EventDispatcher } from './eventDispatcher';
import { Reactor } from './reactor';
import type { GameComponentInfo } from './resources';

export class GameUpgrades {
    public readonly game: Game;
    public constructor(game: Game) {
        this.game = game;
    }

    public fasterTicks: number = 0;
}

export class Game extends EventDispatcher<{
    tick: null;
    render: null;
}> {
    public readonly reactor: Reactor;
    public constructor() {
        super();
        this.reactor = new Reactor(this);
        this.upgrades = new GameUpgrades(this);
        this.addEventListener('tick', () => this.tick());
    }

    public readonly upgrades: GameUpgrades;

    public selectedComponent: GameComponentInfo | null = null;

    public money: bigint = 0n;
    public debugTickRateOverride: number | null = null;
    public tickRate(): number {
        if (this.debugTickRateOverride !== null) {
            return this.debugTickRateOverride;
        }
        return 1000 / (this.upgrades.fasterTicks + 1);
    }
    public extraTicks: number = 0;

    public tick(): void {
        this.reactor.tick();
    }

    public destroy(): void {
        this.reactor.destroy();
        this.destroyDispatcher();
    }
}
