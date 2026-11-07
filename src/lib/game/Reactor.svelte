<script lang="ts">
    import { Reactor } from './resource/reactor';
    import { clamp } from '#lib/util.ts';
    import type { Game } from './resource/game';
    import ReactorCanvas from './ReactorCanvas.svelte';
    import { Stats } from './resource/stats';
    import ImgProgressHeatInactive from "#lib/assets/progress-heat-inactive.png";
    import ImgProgressHeatActive from "#lib/assets/progress-heat-active.png";
    import ImgProgressPowerInactive from "#lib/assets/progress-power-inactive.png";
    import ImgProgressPowerActive from "#lib/assets/progress-power-active.png";

    let { game }: { game: Game } = $props();
    let reactor = $derived(game.world.resources.get(Reactor));
    let stats = $derived(game.world.resources.get(Stats));

    let tick: number = $state(0);
    let tickListener: number = -1;

    let canvas: HTMLCanvasElement | null = $state(null);

    $effect(() => {
        if (canvas) {
            game.setCanvas(canvas);
        }
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

<div class="flex w-min flex-col gap-1">
    <!-- The buttons cannot have the progress bar as a child because when the progress bar updates it resets any current interaction with the button. -->
    <div class="force-overlap">
        {#key tick}
            <progress
                class="w-full custom-progress"
                style="--inactive-image: url('{ImgProgressHeatInactive}'); --active-image: url('{ImgProgressHeatActive}')"
                value={reactor.heat / reactor.maxHeat}
            ></progress>
            <div class="flex items-center justify-between px-2">
                <span class="text-white">
                    HEAT {Math.floor(reactor.heat)} / {Math.floor(reactor.maxHeat)}
                </span>
                <span class="text-white">
                    <!-- sus -->
                    VENT
                </span>
            </div>
        {/key}
        <!-- svelte-ignore a11y_consider_explicit_label -->
        <button
            class="cursor-pointer"
            onclick={() => {
                const dissipateAmount = 1;
                const sub = clamp(reactor.heat, 0, dissipateAmount);
                reactor.heat -= sub;
                stats.totalHeatDissipatedThisReset += sub;
                game.setTickRerender();
            }}
        ></button>
    </div>
    <div class="force-overlap">
        {#key tick}
            <progress
                class="w-full custom-progress"
                style="--inactive-image: url('{ImgProgressPowerInactive}'); --active-image: url('{ImgProgressPowerActive}')"
                value={reactor.power / reactor.maxPower}
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
                reactor.sellPower(game.world);
                game.setTickRerender();
            }}
        ></button>
    </div>
    <ReactorCanvas {game} />
</div>

<style>
    .custom-progress, .custom-progress::-webkit-progress-bar {
        background-image: var(--inactive-image);
    }

    .custom-progress::-webkit-progress-value, .custom-progress::-moz-progress-bar {
        background-image: var(--active-image);
    }
</style>
