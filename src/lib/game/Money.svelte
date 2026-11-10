<script lang="ts">
    import type { Game } from './resource/game';
    import { Reactor } from './resource/reactor';
    import { Stats } from './resource/stats';
    import { formatMoney } from './util';

    let { game }: { game: Game } = $props();
    let reactor = $derived(game.world.resources.get(Reactor));
    let stats = $derived(game.world.resources.get(Stats));

    let rerender = $state(1);
    let tickListener: number = -1;

    $effect(() => {
        tickListener = game.addEventListener('tickRender', () => {
            rerender++;
        }).id;
        return () => {
            game.removeEventListener(tickListener);
        };
    });

    let scrounge = $derived(rerender && reactor.money < 100);
</script>

<div class="flex w-40 items-center justify-between h-6">
    <span class="font-jersey text-2xl">
        {#key rerender}
            ${formatMoney(reactor.money)}
        {/key}
    </span>
    {#if scrounge}
        <button
            onclick={() => {
                reactor.money++;
                stats.totalMoneyGainedThisReset++;
                game.setTickRerender();
            }}
            class="button px-2 h-5">Scrounge for $1</button
        >
    {/if}
</div>
