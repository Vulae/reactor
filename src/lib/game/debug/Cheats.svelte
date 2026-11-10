<script lang="ts">
    import { updateOn } from '#lib/util.ts';
    import { TilePos } from '../component/tile/base.ts';
    import { ComponentPlacer } from '../resource/componentPlacer.ts';
    import type { Game } from '../resource/game.ts';
    import { Reactor } from '../resource/reactor.ts';
    import { TickManager } from '../resource/tickManager.ts';
    import { ATLAS } from '../textures.ts';
    import * as ECS from '#ecs';
    import TextureAtlasImage from '#lib/TextureAtlasImage.svelte';
    import { ParticleExplosion, ParticleLifetime, ParticlePos } from '../component/particle.ts';

    let { game }: { game: Game } = $props();
    let reactor = $derived(game.world.resources.get(Reactor));
    let tickManager = $derived(game.world.resources.get(TickManager));
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
</script>

{#snippet overlapTextures(textures: (keyof (typeof ATLAS)['textures'])[])}
    <div class="force-overlap">
        {#each textures as texture (texture)}
            <TextureAtlasImage atlas={ATLAS} {texture} />
        {/each}
    </div>
{/snippet}

{#snippet placerItem(
    textures: (keyof (typeof ATLAS)['textures'])[],
    create: (pos: TilePos) => ECS.Instance[]
)}
    <button
        class="button flex size-9 items-center justify-center"
        class:button-active={updateOn(rerender, placer.selected == create)}
        onclick={() => {
            if (placer.selected == create) {
                placer.selected = null;
            } else {
                placer.selected = create;
            }
            placer.dispatchEvent('update', null);
        }}
    >
        {@render overlapTextures(textures)}
    </button>
{/snippet}

<div class="flex flex-col">
    <span class="grid grid-cols-1 font-jersey text-xl">
        <button
            class="button px-2"
            onclick={() => {
                reactor.money = Infinity;
                game.setTickRerender();
                game.dispatchEvent('announceMessage', {
                    type: 'debug',
                    message: 'Gave infinite money'
                });
            }}
        >
            Infinite Money
        </button>
        <button
            class="button px-2"
            onclick={() => {
                tickManager.extraTicks = Infinity;
                game.setTickRerender();
                game.dispatchEvent('announceMessage', {
                    type: 'debug',
                    message: 'Gave infinite extra ticks'
                });
            }}
        >
            Infinite Extra Ticks
        </button>
    </span>
    <span class="grid grid-cols-1">
        {const createExplosionFn = (pos: TilePos) => [
            new ParticlePos(pos.x, pos.y),
            new ParticleLifetime(500),
            new ParticleExplosion()
        ]}
        {@render placerItem(['explosion_frame_3'], createExplosionFn)}
    </span>
</div>
