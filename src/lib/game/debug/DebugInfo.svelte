<script lang="ts">
    import type { Game } from '../resource/game';
    import { FrameInfo } from '../resource/info';
    import { TickManager } from '../resource/tickManager';
    import { saveGameRaw } from '../save';

    let { game }: { game: Game } = $props();
    let frameInfo = $derived(game.world.resources.get(FrameInfo));
    let tickManager = $derived(game.world.resources.get(TickManager));

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
            {@const { numEntities, numComponents } = game.world.components.__DEBUG_INFO()}
            {@const { numResources } = game.world.resources.__DEBUG_INFO()}
            Frame: {frameInfo.numFrames}
            <br />
            FPS: {frameInfo.fps}
            <br />
            RenderTime: {Math.floor(frameInfo.renderTime * 10) / 10}ms
            <br />
            DeltaTime: {Math.floor(frameInfo.dt * 10) / 10}ms
            <br />
            <br />
            Entities: {numEntities} ({numComponents})
            <br />
            Resources: {numResources}
            <br />
            Tick: {tickManager.numTicks}
        {/key}
    </span>
</div>
