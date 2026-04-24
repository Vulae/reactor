<script lang="ts">
    import type { Game } from '../resource/game';
    import { FrameInfo, TickInfo } from '../resource/info';
    import { saveGameRaw } from '../save';

    let { game }: { game: Game } = $props();
    let frameInfo = $derived(game.world.getResource(FrameInfo));
    let tickInfo = $derived(game.world.getResource(TickInfo));

    let frame: number = $state(0);
    let frameListener: number = -1;

    $effect(() => {
        frameListener = game.addEventListener('render', () => {
            frame++;
        }).id;
        return () => {
            game.removeEventListener(frameListener);
        };
    });
</script>

<div class="flex min-w-32 flex-col">
    <span class="font-jersey text-xl">
        <button
            class="button px-2"
            onclick={() => {
                console.log(game);
            }}>Log Game</button
        ><br />
        <button
            class="button px-2"
            onclick={() => {
                console.log(saveGameRaw(game));
            }}>Log Save Game</button
        ><br />
        {#key frame}
            {@const worldInfo = game.world.diagnosticInfo()}
            Frame: {frameInfo.numFrames}<br />
            RenderTime: {Math.floor(
                (frameInfo.lastRenderTimeEnd - frameInfo.lastRenderTimeStart) * 10
            ) / 10}ms<br />
            Entities: {worldInfo.numEntities} ({worldInfo.numComponents})
            <br />
            Tick: {tickInfo.numTicks}<br />
        {/key}
    </span>
</div>
