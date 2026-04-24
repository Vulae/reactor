<script lang="ts">
    import { Reactor } from './resource/reactor';
    import { RenderFrameCaller } from '$lib/util';
    import { onMount } from 'svelte';
    import type { Game } from './resource/game';
    import { GameCursor } from './resource/cursor';
    import { TilePos } from './component/tile/base/def';

    let { game }: { game: Game } = $props();
    let reactor = $derived(game.world.getResource(Reactor));
    let cursor = $derived(game.world.getResource(GameCursor));

    let tick: number = $state(0);
    let tickListener: number = -1;

    let canvas: HTMLCanvasElement | null = $state(null);

    $effect(() => {
        if (canvas) {
            game.setCanvas(canvas);
        }
    });

    let renderFrameCaller: RenderFrameCaller = new RenderFrameCaller(() => {
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
    });

    onMount(() => {
        renderFrameCaller.start();
        () => {
            renderFrameCaller.stop();
        };
    });

    $effect(() => {
        tickListener = game.addEventListener('tickRender', () => {
            tick++;
        }).id;
        return () => {
            game.removeEventListener(tickListener);
        };
    });
</script>

<div class="flex flex-col gap-1">
    <div class="grid grid-cols-2 gap-2">
        <div class="force-overlap">
            {#key tick}
                <progress class="reactor-heat-progress" value={reactor.heat / reactor.maxHeat}
                ></progress>
                <div class="flex items-center justify-between px-2">
                    <span class="text-white">
                        HEAT {Math.floor(reactor.heat)} / {Math.floor(reactor.maxHeat)}
                    </span>
                    <span class="text-white">VENT</span>
                </div>
            {/key}
            <!-- svelte-ignore a11y_consider_explicit_label -->
            <button
                class="cursor-pointer"
                onclick={() => {
                    reactor.heat -= 1;
                    if (reactor.heat < 0) {
                        reactor.heat = 0;
                    }
                    game.dispatchEvent('tickRender', null);
                }}
            ></button>
        </div>
        <div class="force-overlap">
            {#key tick}
                <progress class="reactor-power-progress" value={reactor.power / reactor.maxPower}
                ></progress>
                <div class="flex items-center justify-between px-2">
                    <span class="text-white">
                        POWER {Math.floor(reactor.power)} / {Math.floor(reactor.maxPower)}
                    </span>
                    <span class="text-white">SELL</span>
                </div>
            {/key}
            <!-- svelte-ignore a11y_consider_explicit_label -->
            <button
                class="cursor-pointer"
                onclick={() => {
                    reactor.sellPower();
                    game.dispatchEvent('tickRender', null);
                }}
            ></button>
        </div>
    </div>
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
            game.dispatchEvent('tickRender', null);
        }}
        onpointerleave={() => {
            cursor.pos = null;
            game.dispatchEvent('tickRender', null);
        }}
        onpointerdown={(ev) => {
            if (ev.button == 0) {
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
</div>

<style lang="scss">
    .reactor-heat-progress,
    .reactor-heat-progress::-webkit-progress-bar {
        background-image: url('$lib/assets/progress-heat-inactive.png');
    }
    .reactor-heat-progress::-webkit-progress-value,
    .reactor-heat-progress::-moz-progress-bar {
        background-image: url('$lib/assets/progress-heat-active.png');
    }

    .reactor-power-progress,
    .reactor-power-progress::-webkit-progress-bar {
        background-image: url('$lib/assets/progress-power-inactive.png');
    }
    .reactor-power-progress::-webkit-progress-value,
    .reactor-power-progress::-moz-progress-bar {
        background-image: url('$lib/assets/progress-power-active.png');
    }
</style>
