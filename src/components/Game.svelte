<script lang="ts">
    import { onDestroy, onMount } from 'svelte';
    import { Game } from '../lib/game';
    import Shop from '$components/Shop.svelte';
    import Reactor from './Reactor.svelte';
    import SimulationControls from './SimulationControls.svelte';
    import { UraniumFuelCell } from '$lib/cells/basic';
    import Window from './Window.svelte';
    import { TILESET } from '$lib/resources';

    let {
        debug = false
    }: {
        debug?: boolean;
    } = $props();

    let game: Game | null = $state(null);

    let body: HTMLBodyElement;
    let canDrag: boolean = $state(false);
    let dragActive: boolean = $state(false);
    let bgX: number = $state(0);
    let bgY: number = $state(0);

    let debugTilesetBlob: string | null = $state(null);

    onMount(() => {
        game = new Game();

        for (let x = 0; x < 10; x++) {
            game.reactor.setElement(x, 1, new UraniumFuelCell(game.reactor));
        }
        console.log(game);

        if (debug) {
            TILESET.debugGetRebuiltBlob().then((blob) => {
                debugTilesetBlob = URL.createObjectURL(blob);
            });
        }
    });

    onDestroy(() => {
        game?.destroy();
        game = null;

        if (debugTilesetBlob) {
            URL.revokeObjectURL(debugTilesetBlob);
        }
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
    class="bg-drag absolute h-screen w-screen"
    style:background="url(./background.png)"
    style:background-position="{bgX}px {bgY}px"
    style:cursor={canDrag ? (dragActive ? 'move' : 'pointer') : null}
>
    <div class="bg-drag h-max w-max" style:translate="{bgX}px {bgY}px">
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
                        {#if debugTilesetBlob}
                            <Window title={'DEBUG: Tilset atlas image'} gradientStart="black">
                                <img
                                    class="allow-context-menu"
                                    src={debugTilesetBlob}
                                    alt="Debug tileset atlas"
                                />
                            </Window>
                        {/if}
                    </div>
                {/if}
            </div>
        {/if}
    </div>
</div>
