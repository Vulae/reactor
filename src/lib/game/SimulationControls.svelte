<script lang="ts">
    import ImgButtonPlay from '$lib/assets/button-play.png';
    import ImgButtonPause from '$lib/assets/button-pause.png';
    import ImgButtonStep from '$lib/assets/button-step.png';
    import ImgButtonFastForward from '$lib/assets/button-fast-forward.png';
    import { Reactor } from './resource/reactor';
    import { IntervalCaller } from '$lib/util';
    import { onMount } from 'svelte';
    import type { Game } from './resource/game';

    let { game }: { game: Game } = $props();
    let reactor = $derived(game.world.getResource(Reactor));

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
                reactor.extraTicks--;
                if (reactor.extraTicks <= 0) {
                    reactor.extraTicks = 0;
                    fastTicksActive = false;
                    break;
                }
                game.tick();
            }
        } else {
            game.tick();
            if (reactor.millisecondsPerTick != intervalCaller.getDelay()) {
                intervalCaller.setDelay(reactor.millisecondsPerTick);
            }
        }
    });

    onMount(() => {
        intervalCaller.setDelay(reactor.millisecondsPerTick);
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
                if (now - lastStepTickTime < reactor.millisecondsPerTick) return;
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
                {reactor.extraTicks}
            {/key}
        </span>
        <button
            class="button size-6 disabled:cursor-not-allowed"
            disabled={!rerender || !running || reactor.extraTicks <= 0}
            class:button-active={fastTicksActive}
            onclick={() => {
                if (!running) return;
                if (reactor.extraTicks == 0) return;
                fastTicksActive = !fastTicksActive;
                intervalCaller.setDelay(
                    fastTicksActive ? FAST_TICK_RATE : reactor.millisecondsPerTick
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
