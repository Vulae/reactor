<script lang="ts">
    import MouseTooltip from '$lib/MouseTooltip.svelte';
    import TextureAtlasImage from '$lib/TextureAtlasImage.svelte';
    import type { Game } from './resource/game';
    import { UpgradeBuyer } from './resource/upgradeBuyer';
    import { ATLAS } from './textures';
    import { formatMoney } from './util';

    let { game }: { game: Game } = $props();
    let upgradeBuyer = $derived(game.world.getResource(UpgradeBuyer));

    let rerender: number = $state(1);

    let upgradeBuyerEventListener: number = 0;

    $effect(() => {
        upgradeBuyerEventListener = upgradeBuyer.addEventListener('update', () => {
            rerender++;
        }).id;
        return () => {
            upgradeBuyer.removeEventListener(upgradeBuyerEventListener);
        };
    });

    let hoverShopItem: keyof (typeof UpgradeBuyer)['UPGRADES'] | null = $state(null);
</script>

{#snippet overlapTextures(textures: (keyof (typeof ATLAS)['textures'])[])}
    <div class="force-overlap">
        {#each textures as texture}
            <TextureAtlasImage atlas={ATLAS} {texture} />
        {/each}
    </div>
{/snippet}

{#snippet shopItem(identifier: keyof (typeof UpgradeBuyer)['UPGRADES'])}
    {@const upgrade = !!rerender ? UpgradeBuyer.UPGRADES[identifier] : null!}
    {@const info = upgrade.info(game)}
    <button
        class="button flex size-9 items-center justify-center"
        disabled={info.bought === true}
        onclick={() => {
            upgradeBuyer.tryBuyUpgrade(game, identifier);
        }}
        onpointerenter={() => {
            hoverShopItem = identifier;
        }}
        onpointerleave={() => {
            hoverShopItem = null;
        }}
    >
        {@render overlapTextures(info.textures)}
    </button>
{/snippet}

<!--
    FIXME: DONT HAVE THIS RERENDER HERE!
    For some reason when buying a upgrade that can only be bought once the upgrade wont get visually disabled unless forcefully updated like this.
-->
{#key rerender}
    <div class="grid grid-cols-3 gap-1">
        {@render shopItem('uranium_cell_power_generation')}
        {@render shopItem('uranium_cell_durability')}
        {@render shopItem('uranium_cell_autoreplace')}
        {@render shopItem('plutonium_cell_power_generation')}
        {@render shopItem('plutonium_cell_durability')}
        {@render shopItem('plutonium_cell_autoreplace')}
    </div>
{/key}

{#if hoverShopItem}
    {@const info = !!rerender ? UpgradeBuyer.UPGRADES[hoverShopItem].info(game) : null!}
    <MouseTooltip>
        <div class="flex w-min flex-col gap-1 py-1">
            <div class="flex flex-col px-2">
                <span class="font-jersey text-xl text-nowrap">{info.name}</span>
                <br />
                <div class="text-nowrap">
                    {#if info.cost}
                        <span class="text-lg">${formatMoney(info.cost)}</span>
                    {/if}
                    -
                    <span class="text-lg">
                        {typeof info.bought == 'number'
                            ? `BOUGHT ${info.bought} TIMES`
                            : info.bought
                              ? 'BOUGHT'
                              : 'NOT BOUGHT'}
                    </span>
                </div>
            </div>
            <hr />
            <div class="px-2 whitespace-normal">
                <span>{info.description}</span>
            </div>
        </div>
    </MouseTooltip>
{/if}
