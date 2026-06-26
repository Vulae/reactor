<script lang="ts">
    import MouseTooltip from '$lib/MouseTooltip.svelte';
    import TextureAtlasImage from '$lib/TextureAtlasImage.svelte';
    import { updateOn } from '$lib/util';
    import { ComponentPlacer } from './resource/componentPlacer';
    import type { Game } from './resource/game';
    import { ATLAS } from './textures';
    import { formatMoney } from './util';

    let { game }: { game: Game } = $props();
    let placer = $derived(game.world.resources.get(ComponentPlacer));

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
    {@const info = updateOn(rerender, ComponentPlacer.COMPONENTS[identifier].info(game))}
    <button
        class="button flex size-9 items-center justify-center"
        class:button-active={updateOn(rerender, placer.selected == identifier)}
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
    {@render shopItem('cell_uranium_single')}
    {@render shopItem('cell_uranium_double')}
    {@render shopItem('cell_uranium_quad')}
    {@render shopItem('cell_plutonium_single')}
    {@render shopItem('cell_plutonium_double')}
    {@render shopItem('cell_plutonium_quad')}
    {@render shopItem('vent_basic')}
    {@render shopItem('vent_advanced')}
    {@render shopItem('capacitor_basic')}
    {@render shopItem('capacitor_advanced')}
</div>

{#if hoverShopItem}
    {@const info = updateOn(rerender, ComponentPlacer.COMPONENTS[hoverShopItem].info(game))}
    <MouseTooltip style="speech">
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
