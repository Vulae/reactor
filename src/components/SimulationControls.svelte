<script lang="ts">
    import Window from '$components/Window.svelte';
    import { IntervalCaller } from '$lib/util';
    import { onDestroy, onMount } from 'svelte';
    import { Game } from '$lib/game';

    let {
        game
    }: {
        game: Game;
    } = $props();

    let rerender: number = $state(0);
    let rerenderListener: number = -1;

    let running: boolean = $state(true);
    let intervalCaller: IntervalCaller | null = null;
    let lastStepTime: number = -Infinity;
    let fastTicksActive: boolean = $state(false);

    const FAST_TICK_RATE: number = 25;
    const FAST_TICK_STEPS: number = 10;

    function step() {
        if (fastTicksActive) {
            for (let i = 0; i < FAST_TICK_STEPS; i++) {
                game.extraTicks -= 1;
                if (game.extraTicks <= 0n) {
                    game.extraTicks = 0;
                    fastTicksActive = false;
                    break;
                }
                game?.dispatchEvent('tick', null);
            }
        } else {
            game?.dispatchEvent('tick', null);
            if (game?.tickRate() != intervalCaller?.getDelay()) {
                intervalCaller?.setDelay(game.tickRate());
            }
        }
        game?.dispatchEvent('render', null);
        rerender += 1;
    }

    onMount(() => {
        intervalCaller = new IntervalCaller(step);
        intervalCaller.setDelay(game.tickRate());
        intervalCaller.start();

        rerenderListener = game.addEventListener('render', () => {
            rerender++;
        }).id;
    });

    onDestroy(() => {
        intervalCaller?.stop();
        intervalCaller = null;
        game.removeEventListener(rerenderListener);
    });
</script>

<Window title="Simulation Controls" titleDark={true} gradientStart="yellow" gradientEnd="white">
    <div class="flex w-56 justify-between">
        <div class="flex items-center gap-1">
            <button
                class="button size-6"
                onclick={() => {
                    if (running) {
                        running = false;
                        fastTicksActive = false;
                        intervalCaller?.stop();
                    } else {
                        running = true;
                        intervalCaller?.start();
                    }
                }}
            >
                {#if running}
                    <img class="size-full" src="./button-pause.png" alt="Pause" draggable="false" />
                {:else}
                    <img class="size-full" src="./button-play.png" alt="Play" draggable="false" />
                {/if}
            </button>
            <button
                class="button size-6 disabled:cursor-not-allowed"
                disabled={running}
                onclick={() => {
                    if (running) return;
                    if (Date.now() - lastStepTime < game.tickRate()) return;
                    lastStepTime = Date.now();
                    step();
                }}
            >
                <img class="size-full" src="./button-step.png" alt="Step" draggable="false" />
            </button>
        </div>
        <div class="flex items-center gap-1">
            <span class="font-jersey text-3xl">
                {#key rerender}
                    {new Intl.NumberFormat('en-us', {
                        maximumFractionDigits: 0
                    }).format(game.extraTicks)}
                {/key}
            </span>
            <button
                class="button size-6 disabled:cursor-not-allowed"
                disabled={!rerender || !running || game.extraTicks <= 0}
                class:button-active={fastTicksActive}
                onclick={() => {
                    if (!running) return;
                    if (game.extraTicks == 0) return;
                    fastTicksActive = !fastTicksActive;
                    intervalCaller?.setDelay(fastTicksActive ? FAST_TICK_RATE : game.tickRate());
                }}
            >
                <img
                    class="size-full"
                    src="./button-fast-forward.png"
                    alt="Fast Forward"
                    draggable="false"
                />
            </button>
        </div>
    </div>
</Window>
