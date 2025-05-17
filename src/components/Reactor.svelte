<script lang="ts">
    import Window from '$components/Window.svelte';
    import type { Reactor } from '$lib/reactor';
    import { onDestroy, onMount } from 'svelte';
    import { TILESET } from '$lib/resources';
    import { RenderFrameCaller } from '$lib/util';
    import * as bigint from '$lib/bigintUtil';

    let rerender: number = $state(0);
    let rerenderListener: number = -1;

    let canvas: HTMLCanvasElement | null = $state(null);
    let animationCanvas: HTMLCanvasElement | null = $state(null);

    let renderFrameCaller: RenderFrameCaller | null = null;

    let {
        reactor
    }: {
        reactor: Reactor;
    } = $props();

    onMount(() => {
        reactor.setCanvas(canvas, animationCanvas);

        rerenderListener = reactor.game.addEventListener('render', () => {
            rerender++;
            reactor.render();
        }).id;

        renderFrameCaller = new RenderFrameCaller(() => {
            reactor.animationRender();
        });
        renderFrameCaller.start();

        (async function () {
            await TILESET.awaitLoad();
            reactor.render();
        })();
    });

    onDestroy(() => {
        reactor.setCanvas(null, null);
        reactor.game.removeEventListener(rerenderListener);
        renderFrameCaller?.stop();
        renderFrameCaller = null;
    });
</script>

<Window title="Reactor" gradientStart="red" gradientEnd="pink">
    <div class="flex flex-col gap-1">
        <div class="grid grid-cols-2 gap-2">
            <div class="force-overlap">
                {#key rerender}
                    <progress
                        class="reactor-heat-progress"
                        value={bigint.percentage(reactor.heat, reactor.maxHeat)}
                    ></progress>
                    <div class="flex items-center px-2">
                        <span class="text-white">
                            HEAT {bigint.format(reactor.heat)}/{bigint.format(reactor.maxHeat)}
                        </span>
                    </div>
                {/key}
            </div>
            <div class="force-overlap">
                {#key rerender}
                    <progress
                        class="reactor-power-progress"
                        value={bigint.percentage(reactor.power, reactor.maxPower)}
                    ></progress>
                    <div class="flex items-center justify-between px-2">
                        <span class="text-white">
                            POWER
                            {bigint.format(reactor.power)}/{bigint.format(reactor.maxPower)}
                        </span>
                        <span class="text-white">SELL</span>
                    </div>
                {/key}
                <!-- svelte-ignore a11y_consider_explicit_label -->
                <button
                    class="bg-transparent shadow-none"
                    onclick={(ev) => {
                        reactor.game.money += reactor.power;
                        reactor.power = 0n;
                        reactor.game.dispatchEvent('render', null);
                    }}
                ></button>
            </div>
        </div>
        <div class="force-overlap">
            <canvas bind:this={canvas} oncontextmenu={(ev) => ev.preventDefault()}></canvas>
            <canvas
                bind:this={animationCanvas}
                oncontextmenu={(ev) => ev.preventDefault()}
                class="h-full w-full"
            >
            </canvas>
        </div>
    </div>
</Window>

<style>
    .reactor-heat-progress,
    .reactor-heat-progress::-webkit-progress-bar {
        background-image: url(./progress-heat-inactive.png);
    }
    .reactor-heat-progress::-webkit-progress-value,
    .reactor-heat-progress::-moz-progress-bar {
        background-image: url(./progress-heat-active.png);
    }

    .reactor-power-progress,
    .reactor-power-progress::-webkit-progress-bar {
        background-image: url(./progress-power-inactive.png);
    }
    .reactor-power-progress::-webkit-progress-value,
    .reactor-power-progress::-moz-progress-bar {
        background-image: url(./progress-power-active.png);
    }
</style>
