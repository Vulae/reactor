import { EventDispatcher } from './eventDispatcher';
import { Reactor } from './reactor';

export class Game extends EventDispatcher<{
    tick: null;
    render: null;
}> {
    public readonly reactor: Reactor;
    public constructor() {
        super();
        this.reactor = new Reactor(this);
        this.addEventListener('tick', () => this.tick());
    }

    public money: bigint = 10000n;
    public tickRate: number = 1000;
    public extraTicks: bigint = 1000000n;

    public tick(): void {
        this.reactor.tick();
    }

    public destroy(): void {
        this.reactor.destroy();
        this.destroyDispatcher();
    }
}
