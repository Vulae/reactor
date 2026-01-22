<script lang="ts">
    import * as bigint from '$lib/bigintUtil';
    import type { Game } from '$lib/game';
    import Window from '$components/Window.svelte';
    import { onDestroy, onMount } from 'svelte';

    let rerender: number = $state(0);
    let rerenderListener: number = -1;

    let { game, class: _class = '' }: { game: Game; class?: string } = $props();

    onMount(() => {
        rerenderListener = game.addEventListener('render', () => {
            rerender++;
        }).id;
    });

    onDestroy(() => {
        game.removeEventListener(rerenderListener);
    });
</script>

<Window title="Info" gradientStart="green" gradientEnd="lightgreen" class="w-32 {_class}">
    <span class="font-jersey w-28 text-3xl">
        ${#key rerender}{bigint.format(game.money)}{/key}
    </span>
</Window>
