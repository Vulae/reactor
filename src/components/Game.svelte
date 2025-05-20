<script lang="ts">
    import { onDestroy, onMount } from 'svelte';
    import { Game } from '../lib/game';
    import Shop from '$components/Shop.svelte';
    import Reactor from './Reactor.svelte';
    import SimulationControls from './SimulationControls.svelte';
    import { GAME_COMPONENTS } from '$lib/resources';
    import DebugTilesetAtlas from '$components/debug/TilesetAtlas.svelte';
    import DebugCheats from '$components/debug/Cheats.svelte';

    let {
        debug = false
    }: {
        debug?: boolean;
    } = $props();

    let game: Game | null = $state(null);

    let body: HTMLBodyElement;
    let canDrag: boolean = $state(false);
    let dragActive: boolean = $state(false);
    // FIXME: Dragging isn't 1:1 with how the mouse moves, it seems very slightly behind.
    let positionX: number = $state(0);
    let positionY: number = $state(0);

    onMount(() => {
        game = new Game();

        for (let x = 0; x < 10; x++) {
            for (let y = 0; y < 10; y++) {
                game.reactor.setComponent(
                    x,
                    y,
                    GAME_COMPONENTS.uranium_cell_1.create(game.reactor)
                );
            }
        }
    });

    onDestroy(() => {
        game?.destroy();
        game = null;
    });
</script>

<svelte:body
    bind:this={body}
    onmousedown={(ev) => {
        if (!canDrag) {
            return;
        }
        dragActive = !!(ev.buttons & 1);
    }}
    onmouseup={(ev) => {
        if (!canDrag) {
            return;
        }
        dragActive = !!(ev.buttons & 1);
    }}
    onmousemove={(ev) => {
        if ((ev.target as (EventTarget & HTMLElement) | null)?.classList.contains('bg-drag')) {
            canDrag = true;
        } else {
            canDrag = false;
        }
        if (dragActive) {
            positionX += ev.movementX;
            positionY += ev.movementY;
        }
    }}
    onmouseleave={() => {
        dragActive = false;
    }}
/>

<div
    class="bg-drag absolute h-screen w-screen"
    style:background="url(./background.png)"
    style:background-position="{positionX}px {positionY}px"
    style:cursor={canDrag ? (dragActive ? 'move' : 'pointer') : null}
>
    <div class="bg-drag absolute h-max w-max" style:left="{positionX}px" style:top="{positionY}px">
        {#if game}
            <div class="bg-drag flex flex-col gap-1">
                <div class="bg-drag flex">
                    <SimulationControls {game} />
                </div>
                <div class="bg-drag flex gap-1">
                    <Reactor reactor={game.reactor} />
                    <div class="bg-drag">
                        <Shop {game} />
                    </div>
                </div>
                {#if debug}
                    <div class="bg-drag flex gap-1">
                        <DebugTilesetAtlas />
                        <DebugCheats {game} />
                    </div>
                {/if}
            </div>
        {/if}
    </div>
</div>
