<script lang="ts">
    import ImgButtonPlay from '$lib/assets/button-play.png';
    import ImgButtonPause from '$lib/assets/button-pause.png';
    import ImgButtonStep from '$lib/assets/button-step.png';
    import ImgButtonFastForward from '$lib/assets/button-fast-forward.png';
    import { IntervalCaller } from '$lib/util';
    import { onMount } from 'svelte';
    import type { Game } from './resource/game';
    import { TickManager } from './resource/tickManager';

    let { game }: { game: Game } = $props();
    let tickManager = $derived(game.world.getResource(TickManager));

    let rerender = $state(1);
    let tickListener: number = -1;

    let running = $state(true);
    let fastTicksActive = $state(false);
    let lastStepTickTime: number = -Infinity;

    const FAST_TICK_RATE = 25;
    const FAST_TICK_STEPS = 10;

    let intervalCaller = new IntervalCaller(() => {
        if (!running) return;
        if (fastTicksActive) {
            for (let i = 0; i < FAST_TICK_STEPS; i++) {
                tickManager.extraTicks--;
                if (tickManager.extraTicks <= 0) {
                    tickManager.extraTicks = 0;
                    fastTicksActive = false;
                    break;
                }
                game.tick();
            }
        } else {
            game.tick();
            if (tickManager.millisecondsPerTick != intervalCaller.getDelay()) {
                intervalCaller.setDelay(tickManager.millisecondsPerTick);
            }
        }
    });

    onMount(() => {
        intervalCaller.setDelay(tickManager.millisecondsPerTick);
        intervalCaller.start();
        return () => {
            intervalCaller.stop();
        };
    });

    $effect(() => {
        tickListener = game.addEventListener('tickRender', () => {
            rerender++;
        }).id;
        () => {
            game.removeEventListener(tickListener);
        };
    });
</script>

<div class="flex w-48 justify-between">
    <div class="flex items-center gap-1">
        <button
            class="button size-6"
            onclick={() => {
                if (running) {
                    running = false;
                    fastTicksActive = false;
                    intervalCaller.stop();
                } else {
                    running = true;
                    intervalCaller.start();
                }
            }}
        >
            {#if running}
                <img class="size-full" src={ImgButtonPause} alt="Pause" draggable="false" />
            {:else}
                <img class="size-full" src={ImgButtonPlay} alt="Play" draggable="false" />
            {/if}
        </button>
        <button
            class="button size-6 disabled:cursor-not-allowed"
            disabled={running}
            onclick={() => {
                if (running) return;
                const now = performance.now();
                if (now - lastStepTickTime < tickManager.millisecondsPerTick) return;
                lastStepTickTime = now;
                game.tick();
            }}
        >
            <img class="size-full" src={ImgButtonStep} alt="Step" draggable="false" />
        </button>
    </div>
    <div class="flex items-center gap-1">
        <span class="font-jersey">
            {#key rerender}
                {tickManager.extraTicks}
            {/key}
        </span>
        <button
            class="button size-6 disabled:cursor-not-allowed"
            disabled={!rerender || !running || tickManager.extraTicks <= 0}
            class:button-active={fastTicksActive}
            onclick={() => {
                if (!running) return;
                if (tickManager.extraTicks == 0) return;
                fastTicksActive = !fastTicksActive;
                intervalCaller.setDelay(
                    fastTicksActive ? FAST_TICK_RATE : tickManager.millisecondsPerTick
                );
            }}
        >
            <img
                class="size-full"
                src={ImgButtonFastForward}
                alt="Fast Forward"
                draggable="false"
            />
        </button>
    </div>
</div>
