<script lang="ts">
    import { onDestroy, onMount } from 'svelte';
    import { Game } from '../lib/game';
    import Shop from '$components/Shop.svelte';
    import Reactor from './Reactor.svelte';
    import SimulationControls from './SimulationControls.svelte';
    import { UraniumFuelCell } from '$lib/cells/basic';

    let game: Game | null = $state(null);

    let body: HTMLBodyElement;
    let canDrag: boolean = $state(false);
    let dragActive: boolean = $state(false);
    let bgX: number = $state(0);
    let bgY: number = $state(0);

    onMount(() => {
        game = new Game();

        game.reactor.setElement(1, 1, new UraniumFuelCell(game.reactor));
        game.reactor.setElement(2, 1, new UraniumFuelCell(game.reactor));
        console.log(game);
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
        if (ev.button == 0 && ev.buttons == 1) {
            dragActive = true;
        }
    }}
    onmousemove={(ev) => {
        if ((ev.target as (EventTarget & HTMLElement) | null)?.classList.contains('bg-drag')) {
            canDrag = true;
        } else {
            canDrag = false;
        }
        if (dragActive) {
            bgX += ev.movementX;
            bgY += ev.movementY;
        }
    }}
    onmouseup={() => {
        dragActive = false;
    }}
    onmouseleave={() => {
        dragActive = false;
    }}
/>

<div
    class="bg-drag h-screen w-screen"
    style:background="url(./background.png)"
    style:background-position="{bgX}px {bgY}px"
    style:cursor={canDrag ? (dragActive ? 'move' : 'pointer') : null}
>
    <div class="bg-drag absolute" style:translate="{bgX}px {bgY}px">
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
            </div>
        {/if}
    </div>
</div>
