<script lang="ts">
    import MouseTooltip from '$lib/MouseTooltip.svelte';
    import type { Game } from './resource/game';
    import { loadGame, saveGame } from './save';

    let { game = $bindable() }: { game: Game } = $props();

    let textarea: HTMLTextAreaElement | null = $state(null);
    let textareaUpdate: number = $state(1);
    let textareaEmpty: boolean = $derived(
        !!textareaUpdate && (textarea as HTMLTextAreaElement | null)?.value.length == 0
    );

    let saveHover: boolean = $state(false);
</script>

<div class="flex w-36 flex-col gap-1">
    <p class="text-center leading-[0.8]">Your game is saved when closing the tab.</p>
    <hr />
    <div class="flex flex-col gap-1">
        <span class="text-center">Save/Load as Text</span>
        <div class="grid grid-cols-2 gap-1">
            <button
                class="button px-2"
                onclick={(ev) => {
                    textarea!.value = saveGame(game, ev.shiftKey);
                    textareaUpdate++;
                }}
                onpointerenter={() => (saveHover = true)}
                onpointerleave={() => (saveHover = false)}>Save</button
            >
            <button
                class="button px-2 disabled:cursor-not-allowed"
                disabled={textareaEmpty}
                onclick={() => {
                    const loadedGame = loadGame(textarea!.value);
                    if (confirm('Are you sure you want to load?')) {
                        game = loadedGame;
                        setTimeout(() => {
                            game.dispatchEvent('announceMessage', {
                                type: 'message',
                                message: 'Game loaded'
                            });
                        });
                    }
                }}
            >
                Load
            </button>
        </div>
        <textarea
            bind:this={textarea}
            class="shadow-outline-down h-12 resize-none bg-white"
            autocomplete="off"
            placeholder="Save Game Data"
            style:font-size={textareaEmpty ? 'var(--text-lg)' : 'var(--text-sm)'}
            style:text-align={textareaEmpty ? 'center' : ''}
            oninput={() => {
                textareaUpdate++;
            }}
        ></textarea>
    </div>
</div>

{#if saveHover}
    <MouseTooltip>
        <div class="w-24 p-1 text-center leading-[0.7]">Shift click to save raw data</div>
    </MouseTooltip>
{/if}
