<script lang="ts">
    import type { Game } from '../resource/game.ts';
    import { Reactor } from '../resource/reactor.ts';

    let { game }: { game: Game } = $props();
    let reactor = $derived(game.world.getResource(Reactor));
</script>

<div class="flex flex-col">
    <span class="font-jersey grid grid-cols-1 text-xl">
        <button
            class="button px-2"
            onclick={() => {
                reactor.money = Infinity;
                game.dispatchEvent('tickRender', null);
                game.dispatchEvent('announceMessage', {
                    type: 'debug',
                    message: 'Gave infinite money'
                });
            }}
        >
            Infinite Money
        </button>
        <button
            class="button px-2"
            onclick={() => {
                reactor.extraTicks = Infinity;
                game.dispatchEvent('tickRender', null);
                game.dispatchEvent('announceMessage', {
                    type: 'debug',
                    message: 'Gave infinite extra ticks'
                });
            }}
        >
            Infinite Extra Ticks
        </button>
        <button
            class="button px-2"
            onclick={() => {
                game.world.queryEntities([]).forEach((entity) => entity.destroy());
                game.dispatchEvent('tickRender', null);
                game.dispatchEvent('render', null);
                game.dispatchEvent('announceMessage', {
                    type: 'debug',
                    message: 'Cleared entities'
                });
            }}
        >
            Clear Entities
        </button>
    </span>
</div>
