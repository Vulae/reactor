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

    let ticker: number = $state(0);
    let running: boolean = $state(true);
    let intervalCaller: IntervalCaller | null = null;
    let lastStepTime: number = -Infinity;
    let fastTicksActive: boolean = $state(false);

    // const FAST_TICK_RATE: number = 25;
    // const FAST_TICK_STEPS: number = 100;
    const FAST_TICK_RATE: number = 50;
    const FAST_TICK_STEPS: number = 1;

    function step() {
        if (fastTicksActive) {
            for (let i = 0; i < FAST_TICK_STEPS; i++) {
                game.extraTicks -= 1;
                if (game.extraTicks <= 0) {
                    game.extraTicks = 0;
                    fastTicksActive = false;
                    break;
                }
                game?.dispatchEvent('tick', null);
            }
        } else {
            game?.dispatchEvent('tick', null);
            if (game?.tickRate != intervalCaller?.getDelay()) {
                intervalCaller?.setDelay(game.tickRate);
            }
        }
        game?.dispatchEvent('render', null);
        ticker += 1;
    }

    onMount(() => {
        intervalCaller = new IntervalCaller(step);
        intervalCaller.setDelay(game.tickRate);
        intervalCaller.start();
    });

    onDestroy(() => {
        intervalCaller?.stop();
        intervalCaller = null;
    });
</script>

<Window title="Simulation Controls" titleDark={true} gradientStart="yellow" gradientEnd="white">
    <div class="flex w-56 justify-between">
        <div class="flex items-center gap-1">
            {#if running}
                <button
                    class="size-6 p-0"
                    onclick={() => {
                        running = false;
                        fastTicksActive = false;
                        intervalCaller?.stop();
                    }}
                >
                    <img class="size-full" src="./button-pause.png" alt="Pause" draggable="false" />
                </button>
            {:else}
                <button
                    class="size-6 p-0"
                    onclick={() => {
                        running = true;
                        intervalCaller?.start();
                    }}
                >
                    <img class="size-full" src="./button-play.png" alt="Play" draggable="false" />
                </button>
            {/if}
            <button
                class="size-6 p-0 disabled:cursor-not-allowed"
                disabled={running}
                onclick={() => {
                    if (running) return;
                    if (Date.now() - lastStepTime < game.tickRate) return;
                    lastStepTime = Date.now();
                    step();
                }}
            >
                <img class="size-full" src="./button-step.png" alt="Step" draggable="false" />
            </button>
        </div>
        <div class="flex items-center gap-1">
            <span class="text-3xl">
                {#key ticker}
                    {new Intl.NumberFormat('en-us', {
                        maximumFractionDigits: 0
                    }).format(game.extraTicks)}
                {/key}
            </span>
            <button
                class="size-6 p-0 disabled:cursor-not-allowed"
                disabled={!running}
                class:button-active={fastTicksActive}
                onclick={() => {
                    if (!running) return;
                    if (game.extraTicks == 0) return;
                    fastTicksActive = !fastTicksActive;
                    intervalCaller?.setDelay(fastTicksActive ? FAST_TICK_RATE : game.tickRate);
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
