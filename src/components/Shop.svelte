<script lang="ts">
    import TextureAtlasImage from '$components/TextureAtlasImage.svelte';
    import Window from '$components/Window.svelte';
    import type { Game } from '$lib/game';
    import { TILESET } from '$lib/resources';
    import { formatBigNumber } from '$lib/util';
    import { onDestroy, onMount } from 'svelte';

    let rerender: number = $state(0);
    let rerenderListener: number = -1;

    let { game, class: _class = '' }: { game: Game; class?: string } = $props();

    let tab: 'cells' | 'components' = $state('cells');

    interface CellInfo {
        texture: keyof typeof TILESET.textures;
        description: string;
    }
    let cellInfo: CellInfo | null = $state(null);

    onMount(() => {
        rerenderListener = game.addEventListener('render', () => {
            rerender++;
        }).id;
    });

    onDestroy(() => {
        game.removeEventListener(rerenderListener);
    });
</script>

{#snippet buyable(info: CellInfo)}
    <button
        class="size-10 p-0"
        onmouseenter={() => {
            cellInfo = info;
        }}
        onmouseleave={() => {
            if (JSON.stringify(cellInfo) == JSON.stringify(info)) {
                cellInfo = null;
            }
        }}
    >
        <TextureAtlasImage atlas={TILESET} texture={info.texture} class="size-full" />
    </button>
{/snippet}

<Window title="Shop" gradientStart="blue" gradientEnd="lightblue" class="w-64 {_class}">
    <div class="flex justify-between gap-2">
        <div>
            <button onclick={() => (tab = 'cells')} disabled={tab == 'cells'}>Cells</button>
            <button onclick={() => (tab = 'components')} disabled={tab == 'components'}>
                Components
            </button>
        </div>
        <span class="w-24 text-3xl">
            ${#key rerender}{formatBigNumber(game.money)}{/key}
        </span>
    </div>
    <div class="mx-0.5 mt-1 h-[2px] bg-zinc-500"></div>
    {#if tab == 'cells'}
        <div class="flex h-16 items-center justify-between gap-10 px-2">
            {#if cellInfo}
                <TextureAtlasImage
                    atlas={TILESET}
                    texture={cellInfo.texture}
                    class="aspect-square h-full"
                />
                <span class="leading-[0.8]">{cellInfo.description}</span>
            {:else}
                <h1 class="font-jersey text-4xl">CELLS</h1>
                <span>Hover over a cell to view information.</span>
            {/if}
        </div>
        <div class="mx-0.5 mb-1 h-[2px] bg-zinc-500"></div>
        <div class="flex-col">
            <div>
                {@render buyable({
                    texture: 'uranium_cell_1',
                    description: 'x1 uranium cell produces energy and heat.'
                })}
                {@render buyable({
                    texture: 'uranium_cell_1',
                    description:
                        'x2 uranium cell that produces x3 energy and heat of a regular uranium cell.'
                })}
                {@render buyable({
                    texture: 'uranium_cell_1',
                    description:
                        'x4 uranium cell that produces x9 energy and heat of a regular uranium cell.'
                })}
            </div>
        </div>
    {:else if tab == 'components'}
        <h1>COMPONENTS</h1>
    {/if}
</Window>
