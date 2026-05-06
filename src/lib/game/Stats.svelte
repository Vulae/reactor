<script lang="ts">
    import { updateOn } from '$lib/util';
    import type { Game } from './resource/game';
    import { Stats } from './resource/stats';
    import { formatMoney } from './util';

    let { game }: { game: Game } = $props();
    let rerender: number = $state(1);
    let stats = $derived(game.world.getResource(Stats));

    let tickListener: number = -1;

    $effect(() => {
        tickListener = game.addEventListener('tickRender', () => {
            rerender++;
        }).id;
        () => {
            game.removeEventListener(tickListener);
        };
    });
</script>

<div class="flex flex-col gap-1">
    <span>This Reset</span>
    <div class="shadow-outline-down bg-white px-2 py-1">
        Money Gained: ${updateOn(rerender, formatMoney(stats.totalMoneyGainedThisReset))}
        <br />
        Power Generated: {updateOn(rerender, Math.floor(stats.totalPowerGeneratedThisReset))}
        <br />
        Heat Dissipated: {updateOn(rerender, Math.floor(stats.totalHeatDissipatedThisReset))}
        <br />
    </div>
    <span>All Time</span>
    <div class="shadow-outline-down bg-white px-2 py-1">
        Money Gained: ${updateOn(
            rerender,
            formatMoney(stats.totalMoneyGainedThisReset + stats.totalMoneyGained)
        )}
        <br />
        Power Generated: {updateOn(
            rerender,
            Math.floor(stats.totalPowerGeneratedThisReset + stats.totalPowerGenerated)
        )}
        <br />
        Heat Dissipated: {updateOn(
            rerender,
            Math.floor(stats.totalHeatDissipatedThisReset + stats.totalHeatDissipated)
        )}
        <br />
    </div>
</div>
