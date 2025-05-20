<script lang="ts">
    import TextureAtlasImage from '$components/TextureAtlasImage.svelte';
    import Window from '$components/Window.svelte';
    import type { Game } from '$lib/game';
    import { GAME_COMPONENTS, TILESET, type GameComponentInfo } from '$lib/resources';
    import { onDestroy, onMount } from 'svelte';
    import * as bigint from '$lib/bigintUtil';
    import MouseTooltip from './MouseTooltip.svelte';

    let rerender: number = $state(0);
    let rerenderListener: number = -1;

    let { game, class: _class = '' }: { game: Game; class?: string } = $props();

    let tab: 'cells' | 'components' = $state('cells');

    let componentInfo: GameComponentInfo | null = $state(null);

    onMount(() => {
        rerenderListener = game.addEventListener('render', () => {
            rerender++;
        }).id;
    });

    onDestroy(() => {
        game.removeEventListener(rerenderListener);
    });
</script>

{#snippet buyable(info: GameComponentInfo)}
    <button
        class="button size-10 p-0.5"
        disabled={!rerender || game?.selectedComponent?.name == info.name}
        onclick={() => {
            if (!game) return;
            game.selectedComponent = info;
            game.dispatchEvent('render', null);
        }}
        onmouseenter={() => {
            componentInfo = info;
        }}
        onmouseleave={() => {
            if (componentInfo?.name == info.name) {
                componentInfo = null;
            }
        }}
    >
        <TextureAtlasImage atlas={TILESET} texture={info.texture} class="size-full" />
    </button>
{/snippet}

<Window title="Shop" gradientStart="blue" gradientEnd="lightblue" class="w-64 {_class}">
    <div class="flex items-center justify-between gap-2">
        <div>
            <button
                onclick={() => (tab = 'cells')}
                disabled={tab == 'cells'}
                class="button px-2 py-1"
            >
                Cells
            </button>
            <button
                onclick={() => (tab = 'components')}
                disabled={tab == 'components'}
                class="button px-2 py-1"
            >
                Components
            </button>
        </div>
        <span class="font-jersey w-28 text-3xl">
            ${#key rerender}{bigint.format(game.money)}{/key}
        </span>
    </div>
    <div class="mx-0.5 mt-1 h-[2px] bg-zinc-500"></div>
    {#if tab == 'cells'}
        <div class="flex h-16 flex-col justify-center px-2 py-1">
            <h1 class="font-jersey text-4xl">CELLS</h1>
            <span>Hover cells to view information.</span>
        </div>
        <div class="mx-0.5 mb-1 h-[2px] bg-zinc-500"></div>
        <div class="flex-col">
            <div>
                {@render buyable(GAME_COMPONENTS.uranium_cell_1)}
                {@render buyable(GAME_COMPONENTS.uranium_cell_2)}
                {@render buyable(GAME_COMPONENTS.uranium_cell_3)}
            </div>
        </div>
    {:else if tab == 'components'}
        <div class="flex h-16 flex-col justify-center px-2 py-1">
            <h1 class="font-jersey text-4xl">COMPONENTS</h1>
            <span>Hover components to view information.</span>
        </div>
        <div class="mx-0.5 mb-1 h-[2px] bg-zinc-500"></div>
        <div class="flex-col">
            <div>
                {@render buyable(GAME_COMPONENTS.capacitor_1)}
            </div>
            <div>
                {@render buyable(GAME_COMPONENTS.vent_1)}
            </div>
        </div>
    {/if}
    {#if componentInfo}
        <MouseTooltip>
            <div class="flex max-w-48 items-center justify-between">
                <TextureAtlasImage
                    atlas={TILESET}
                    texture={componentInfo.texture}
                    class="aspect-square h-16 p-1"
                />
                <span class="leading-[0.8]">{componentInfo.description(game)}</span>
            </div>
        </MouseTooltip>
    {/if}
</Window>
