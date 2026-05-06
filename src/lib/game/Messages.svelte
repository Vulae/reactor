<script lang="ts">
    import Window from '$lib/Window.svelte';
    import type { AnnounceMessage, Game } from './resource/game';

    let { game }: { game: Game } = $props();

    let announceListener: number = -1;
    let messages: AnnounceMessage[] = $state([]);

    $effect(() => {
        announceListener = game.addEventListener('announceMessage', ({ data: message }) => {
            messages.push(message);
        }).id;
        () => {
            game.removeEventListener(announceListener);
        };
    });
</script>

{#snippet MessageWindow(
    title: string,
    gradientStart: string,
    gradientEnd: string,
    index: number,
    message: string
)}
    <Window
        {title}
        {gradientStart}
        {gradientEnd}
        onClose={() => {
            messages.splice(index, 1);
        }}
    >
        <div class="font-jersey">{message}</div>
    </Window>
{/snippet}

<div class="flex flex-col items-end gap-2">
    {#each messages as message, i}
        {#if message.type == 'message'}
            {@render MessageWindow('Message', 'darkgreen', 'lightgreen', i, message.message)}
        {:else if message.type == 'debug'}
            {@render MessageWindow('Debug', 'blue', 'lightblue', i, message.message)}
        {/if}
    {/each}
</div>
