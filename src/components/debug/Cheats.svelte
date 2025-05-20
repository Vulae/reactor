<script lang="ts">
    import Window from '$components/Window.svelte';
    import type { Game } from '$lib/game';
    import * as bigint from '$lib/bigintUtil';
    import { onDestroy, onMount } from 'svelte';

    let rerender: number = $state(0);
    let rerenderListener: number = -1;

    let { game }: { game: Game } = $props();

    onMount(() => {
        rerenderListener = game.addEventListener('render', () => rerender++).id;
    });

    onDestroy(() => {
        game.removeEventListener(rerenderListener);
    });
</script>

<Window title={'DEBUG: Cheats'} gradientStart="black">
    <div class="flex flex-col gap-1">
        <div class="flex gap-1">
            <button
                class="button px-2 py-1"
                onclick={() => {
                    game.money = bigint.VERYBIG;
                    game.dispatchEvent('render', null);
                }}>Infinite money</button
            >
            <button
                class="button px-2 py-1"
                onclick={() => {
                    game.extraTicks = Infinity;
                    game.dispatchEvent('render', null);
                }}>Infinite extra ticks</button
            >
        </div>
        <div class="flex h-4 items-center gap-2">
            <span>Tickrate:</span>
            <input
                type="checkbox"
                onchange={(ev) => {
                    if (ev.currentTarget.checked) {
                        game.debugTickRateOverride = 1000;
                    } else {
                        game.debugTickRateOverride = null;
                    }
                    game.dispatchEvent('render', null);
                }}
            />
            {#if rerender && game.debugTickRateOverride !== null}
                <input
                    class="arrow-hide outline-2 outline-black"
                    type="number"
                    min="10"
                    max="10000"
                    step="1"
                    value={game.debugTickRateOverride}
                    onchange={(ev) => {
                        game.debugTickRateOverride = Math.min(
                            Math.max(Number(ev.currentTarget.value), 10),
                            10000
                        );
                        ev.currentTarget.value = game.debugTickRateOverride.toString();
                    }}
                />
            {/if}
        </div>
    </div>
</Window>
