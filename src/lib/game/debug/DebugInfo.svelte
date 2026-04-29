<script lang="ts">
    import type { Game } from '../resource/game';
    import { FrameInfo } from '../resource/info';
    import { TickManager } from '../resource/tickManager';
    import { saveGameRaw } from '../save';

    let { game }: { game: Game } = $props();
    let frameInfo = $derived(game.world.getResource(FrameInfo));
    let tickManager = $derived(game.world.getResource(TickManager));

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
            Frame: {frameInfo.numFrames}
            <br />
            RenderTime: {Math.floor(
                (frameInfo.lastRenderTimeEnd - frameInfo.lastRenderTimeStart) * 10
            ) / 10}ms
            <br />
            Entities: {game.world.entities.size} ({game.world.entities
                .values()
                .reduce((count, entity) => count + entity.size, 0)})
            <br />
            Resources: {game.world.resources.size}
            <br />
            Tick: {tickManager.numTicks}
        {/key}
    </span>
</div>
