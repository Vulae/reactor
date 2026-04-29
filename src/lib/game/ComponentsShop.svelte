<script lang="ts">
    import MouseTooltip from '$lib/MouseTooltip.svelte';
    import TextureAtlasImage from '$lib/TextureAtlasImage.svelte';
    import { ComponentPlacer } from './resource/componentPlacer';
    import type { Game } from './resource/game';
    import { ATLAS } from './textures';
    import { formatMoney } from './util';

    let { game }: { game: Game } = $props();
    let placer = $derived(game.world.getResource(ComponentPlacer));

    let rerender: number = $state(1);

    let componentPlacerEventListener: number = 0;

    $effect(() => {
        componentPlacerEventListener = placer.addEventListener('update', () => {
            rerender++;
        }).id;
        return () => {
            placer.removeEventListener(componentPlacerEventListener);
        };
    });

    let hoverShopItem: keyof (typeof ComponentPlacer)['COMPONENTS'] | null = $state(null);
</script>

{#snippet shopItem(identifier: keyof (typeof ComponentPlacer)['COMPONENTS'])}
    {@const info = !!rerender ? ComponentPlacer.COMPONENTS[identifier].info(game) : null!}
    <button
        class="button flex size-9 items-center justify-center"
        class:button-active={!!rerender && placer.selected == identifier}
        onclick={() => {
            if (placer.selected == identifier) {
                placer.selected = null;
            } else {
                placer.selected = identifier;
            }
            rerender++;
        }}
        onpointerenter={() => {
            hoverShopItem = identifier;
        }}
        onpointerleave={() => {
            hoverShopItem = null;
        }}
    >
        <TextureAtlasImage atlas={ATLAS} texture={info.texture} />
    </button>
{/snippet}

<div class="grid grid-cols-3 gap-1">
    {@render shopItem('uranium_cell_1')}
    {@render shopItem('uranium_cell_2')}
    {@render shopItem('uranium_cell_3')}
    {@render shopItem('plutonium_cell_1')}
    {@render shopItem('plutonium_cell_2')}
    {@render shopItem('plutonium_cell_3')}
    {@render shopItem('basic_vent')}
    {@render shopItem('advanced_vent')}
</div>

{#if hoverShopItem}
    {@const info = !!rerender ? ComponentPlacer.COMPONENTS[hoverShopItem].info(game) : null!}
    <MouseTooltip>
        <div class="flex w-min flex-col gap-1 py-1">
            <div class="flex flex-col px-2">
                <span class="font-jersey text-xl text-nowrap">{info.name}</span>
                <br />
                <div class="text-nowrap">
                    {#if info.cost}
                        <span class="text-lg">${formatMoney(info.cost)}</span>
                    {/if}
                </div>
            </div>
            <hr />
            <div class="px-2 whitespace-normal">
                <span>{info.description}</span>
            </div>
        </div>
    </MouseTooltip>
{/if}
