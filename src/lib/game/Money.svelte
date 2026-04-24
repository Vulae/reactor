<script lang="ts">
    import type { Game } from './resource/game';
    import { Reactor } from './resource/reactor';
    import { formatMoney } from './util';

    let { game }: { game: Game } = $props();
    let reactor = $derived(game.world.getResource(Reactor));

    let rerender = $state(1);
    let tickListener: number = -1;

    $effect(() => {
        tickListener = game.addEventListener('tickRender', () => {
            rerender++;
        }).id;
        () => {
            game.removeEventListener(tickListener);
        };
    });

    let scrounge = $derived(rerender && reactor.money < 100);
</script>

<div class="flex w-36 justify-between">
    <span class="font-jersey text-2xl">
        {#key rerender}
            ${formatMoney(reactor.money)}
        {/key}
    </span>
    {#if scrounge}
        <button
            onclick={() => {
                reactor.money++;
                game.dispatchEvent('tickRender', null);
            }}
            class="button px-2">Scrounge for $1</button
        >
    {/if}
</div>
