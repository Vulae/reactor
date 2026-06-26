<script lang="ts">
    import { onMount } from 'svelte';
    import { GameCursor } from './resource/cursor';
    import type { Game } from './resource/game';
    import { Reactor } from './resource/reactor';
    import { RenderFrameCaller } from '$lib/util';
    import { TilePos } from './component/tile/base';

    let { game, isStatic = false }: { game: Game; isStatic?: boolean } = $props();
    let reactor = $derived(game.world.resources.get(Reactor));
    let cursor = $derived(game.world.resources.get(GameCursor));

    let canvas: HTMLCanvasElement | null = $state(null);

    $effect(() => {
        if (canvas) {
            game.setCanvas(canvas);
            if (isStatic) {
                render();
            }
        }
    });

    const render = () => {
        try {
            if (game.dispatcherDestroyed) return;
            game.render();
        } catch (error) {
            renderFrameCaller?.stop();
            console.error(error);
            try {
                // May fail if game is destroyed.
                game.announceMessage({ type: 'error', error: error as Error });
            } catch (error) {
                console.error(error);
            }
        }
    };

    let renderFrameCaller: RenderFrameCaller = new RenderFrameCaller(render);

    onMount(() => {
        if (isStatic) return;
        renderFrameCaller.start();
        () => {
            renderFrameCaller.stop();
        };
    });
</script>

<div>
    {#if isStatic}
        <canvas bind:this={canvas}></canvas>
    {:else}
        <canvas
            bind:this={canvas}
            onpointermove={(ev) => {
                if ((ev.buttons & 0b11) == 0) {
                    cursor.click = 'none';
                }
                if (!canvas) return;
                const tileX = Math.floor((ev.offsetX / canvas.offsetWidth) * reactor.width);
                const tileY = Math.floor((ev.offsetY / canvas.offsetHeight) * reactor.height);
                cursor.pos = new TilePos(tileX, tileY);
                game.setTickRerender();
            }}
            onpointerleave={() => {
                cursor.pos = null;
                game.setTickRerender();
            }}
            onpointerdown={(ev) => {
                if (ev.button == 0) {
                    cursor.click = 'primary';
                    cursor.click = 'primary';
                } else if (ev.button == 2) {
                    cursor.click = 'secondary';
                }
            }}
            onpointerup={(ev) => {
                if (ev.button == 0 || ev.button == 2) {
                    cursor.click = 'none';
                }
            }}
        ></canvas>
    {/if}
</div>
