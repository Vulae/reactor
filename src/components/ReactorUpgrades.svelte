<script lang="ts">
    import { onDestroy, onMount } from 'svelte';
    import Window from './Window.svelte';
    import type { Reactor } from '$lib/reactor';
    import * as bigint from '$lib/bigintUtil';
    import { TILESET, type ReactorUpgradeInfo, REACTOR_UPGRADES } from '$lib/resources';
    import MouseTooltip from './MouseTooltip.svelte';
    import TextureAtlasImage from './TextureAtlasImage.svelte';

    let rerender: number = $state(0);
    let rerenderListener: number = -1;

    let { reactor, class: _class = '' }: { reactor: Reactor; class?: string } = $props();

    let tab: 'cells' | 'components' | 'reactor' = $state('cells');

    let upgradeInfo: ReactorUpgradeInfo | null = $state(null);

    onMount(() => {
        rerenderListener = reactor.game.addEventListener('render', () => {
            rerender++;
        }).id;
    });

    onDestroy(() => {
        reactor.game.removeEventListener(rerenderListener);
    });
</script>

{#snippet textureAtlasImageStack(textures: (keyof typeof TILESET.textures)[], _class: string = '')}
    <div class="force-overlap {_class}">
        {#each textures as texture}
            <TextureAtlasImage atlas={TILESET} {texture} class="size-full" />
        {/each}
    </div>
{/snippet}

{#snippet buyable(info: ReactorUpgradeInfo)}
    <button
        class="button size-10 p-0.5"
        disabled={!rerender || info.cost(reactor) === null}
        onclick={() => {
            const cost = info.cost(reactor);
            if (cost === null) return;
            if (reactor.game.money >= cost) {
                reactor.game.money -= cost;
                info.buy(reactor);
                reactor.game.dispatchEvent('render', null);
            }
        }}
        onmouseenter={() => {
            upgradeInfo = info;
        }}
        onmouseleave={() => {
            if (upgradeInfo?.name == info.name) {
                upgradeInfo = null;
            }
        }}
    >
        {@render textureAtlasImageStack(info.textures)}
    </button>
{/snippet}

<Window
    title="Reactor Upgrades"
    gradientStart="orange"
    gradientEnd="white"
    titleDark={true}
    class="w-64 {_class}"
>
    <div class="flex gap-2">
        <button onclick={() => (tab = 'cells')} disabled={tab == 'cells'} class="button px-2 py-1">
            Cells
        </button>
        <button
            onclick={() => (tab = 'components')}
            disabled={tab == 'components'}
            class="button px-2 py-1"
        >
            Components
        </button>
        <button
            onclick={() => (tab = 'reactor')}
            disabled={tab == 'reactor'}
            class="button px-2 py-1"
        >
            Reactor
        </button>
    </div>
    <div class="mx-0.5 mt-1 h-[2px] bg-zinc-500"></div>
    {#if tab == 'cells'}
        <div class="flex h-16 flex-col justify-center px-2 py-1">
            <h1 class="font-jersey text-4xl">CELLS</h1>
            <span>Hover upgrades to view information.</span>
        </div>
        <div class="mx-0.5 mb-1 h-[2px] bg-zinc-500"></div>
        <div class="flex-col">
            <div>
                {@render buyable(REACTOR_UPGRADES.uranium_power)}
                {@render buyable(REACTOR_UPGRADES.uranium_durability)}
                {@render buyable(REACTOR_UPGRADES.uranium_auto_place)}
            </div>
        </div>
    {:else if tab == 'components'}
        <div class="flex h-16 flex-col justify-center px-2 py-1">
            <h1 class="font-jersey text-4xl">COMPONENTS</h1>
            <span>Hover upgrades to view information.</span>
        </div>
        <div class="mx-0.5 mb-1 h-[2px] bg-zinc-500"></div>
        <div class="flex-col">
            <div>
                {@render buyable(REACTOR_UPGRADES.capacitor_max_power)}
            </div>
        </div>
    {:else if tab == 'reactor'}
        <div class="flex h-16 flex-col justify-center px-2 py-1">
            <h1 class="font-jersey text-4xl">REACTOR</h1>
            <span>Hover upgrades to view information.</span>
        </div>
        <div class="mx-0.5 mb-1 h-[2px] bg-zinc-500"></div>
        <div class="flex-col">
            <div>
                {@render buyable(REACTOR_UPGRADES.auto_sell)}
            </div>
        </div>
    {/if}
    {#if upgradeInfo}
        <MouseTooltip>
            <div class="flex max-w-48 items-center justify-between">
                <div class="p-1">
                    {@render textureAtlasImageStack(upgradeInfo.textures, 'aspect-square size-16')}
                </div>
                <span class="leading-[0.8]">{upgradeInfo.description(reactor)}</span>
            </div>
        </MouseTooltip>
    {/if}
</Window>
