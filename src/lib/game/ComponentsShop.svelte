<script lang="ts">
    import type { Component } from '$lib/ecs';
    import TextureAtlasImage from '$lib/TextureAtlasImage.svelte';
    import {
        TileBasicGenerator,
        TileBasicGeneratorType,
        TileBasicHeatVent,
        TileBasicComponentType,
        TileBasicSprite,
        TileDurability,
        TileHeatable,
        TileOverwrite
    } from './component/tile/base/def';
    import { GameCursor } from './resource/cursor';
    import type { Game } from './resource/game';
    import { Upgrades } from './resource/upgrades';
    import { ATLAS } from './textures';

    let { game }: { game: Game } = $props();
    let upgrades = $derived(game.world.getResource(Upgrades));
    let cursor = $derived(game.world.getResource(GameCursor));
</script>

{#snippet shopItem(
    texture: keyof (typeof ATLAS)['textures'],
    costMoney: number,
    create: (game: Game) => Component[]
)}
    <button
        class="button flex size-9 items-center justify-center"
        onclick={() => {
            cursor.placer = {
                texture,
                costMoney,
                create,
                overwriteType: 'cell'
            };
        }}
    >
        <TextureAtlasImage atlas={ATLAS} {texture} />
    </button>
{/snippet}

{#snippet shopItemBasicCell(
    type: TileBasicGeneratorType,
    textures: [
        keyof (typeof ATLAS)['textures'],
        keyof (typeof ATLAS)['textures'],
        keyof (typeof ATLAS)['textures']
    ]
)}
    {#each [0, 1, 2] as _tier}
        {@const tier = _tier as 0 | 1 | 2}
        {@const texture = textures[tier]}
        {@const price = upgrades.getBasicGeneratorCost(type, tier)}
        {@const durability = upgrades.getBasicGeneratorDurability(type)}
        {@render shopItem(texture, price, () => [
            new TileBasicSprite(texture),
            new TileOverwrite('cell'),
            new TileDurability(durability, price),
            new TileBasicGenerator(type, tier)
        ])}
    {/each}
{/snippet}

{#snippet shopItemBasicVent(
    type: TileBasicComponentType,
    texture: keyof (typeof ATLAS)['textures']
)}
    {@const price = upgrades.getBasicVentCost(type)}
    {@const maxHeat = upgrades.getBasicVentMaxHeat(type)}
    {@render shopItem(texture, price, () => [
        new TileBasicSprite(texture),
        new TileOverwrite('vent'),
        new TileHeatable(maxHeat),
        new TileBasicHeatVent(type)
    ])}
{/snippet}

<div class="grid grid-cols-3 gap-1">
    {@render shopItemBasicCell(TileBasicGeneratorType.Uranium, [
        'uranium_cell_1',
        'uranium_cell_2',
        'uranium_cell_3'
    ])}
    {@render shopItemBasicCell(TileBasicGeneratorType.Plutonium, [
        'plutonium_cell_1',
        'plutonium_cell_2',
        'plutonium_cell_3'
    ])}
    {@render shopItemBasicVent(TileBasicComponentType.Basic, 'vent_1')}
    {@render shopItemBasicVent(TileBasicComponentType.Advanced, 'vent_2')}
</div>
