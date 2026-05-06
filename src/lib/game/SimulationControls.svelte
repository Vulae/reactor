<script lang="ts">
    import { IntervalCaller } from '$lib/util';
    import { onMount } from 'svelte';
    import type { Game } from './resource/game';
    import { TickManager } from './resource/tickManager';
    import TextureAtlasImage from '$lib/TextureAtlasImage.svelte';
    import { ATLAS } from './textures';

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
                <TextureAtlasImage atlas={ATLAS} texture="button_pause" class="size-full" />
            {:else}
                <TextureAtlasImage atlas={ATLAS} texture="button_play" class="size-full" />
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
            <TextureAtlasImage atlas={ATLAS} texture="button_step" class="size-full" />
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
            <TextureAtlasImage atlas={ATLAS} texture="button_fastforward" class="size-full" />
        </button>
    </div>
</div>
