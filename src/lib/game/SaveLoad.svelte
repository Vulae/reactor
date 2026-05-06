<script lang="ts">
    import MouseTooltip from '$lib/MouseTooltip.svelte';
    import { onMount } from 'svelte';
    import type { Game } from './resource/game';
    import { loadGame, saveGame } from './save';
    import AlertWindow from '$lib/AlertWindow.svelte';
    import ReactorCanvas from './ReactorCanvas.svelte';
    import { Reactor } from './resource/reactor';
    import { TickManager } from './resource/tickManager';
    import { formatMoney } from './util';
    import { updateOn } from '$lib/util';

    let { game = $bindable() }: { game: Game } = $props();

    let textarea: HTMLTextAreaElement | null = $state(null);
    let textareaUpdate: number = $state(1);
    let textareaEmpty: boolean = $derived(
        updateOn(textareaUpdate, (textarea as HTMLTextAreaElement | null)?.value.length == 0)
    );

    let saveHover: boolean = $state(false);
    let loadConfirmationWindow: boolean = $state(false);
    let loadConfirmationLoadGame: Game | null = $state(null);

    onMount(() => {
        const saveText = localStorage.getItem('save');
        if (saveText) {
            let loadedGame: Game | null = null;
            try {
                loadedGame = loadGame(saveText);
            } catch (err) {
                console.error(`Corrupted save: `, err);
                localStorage.setItem('saveErrorText', new String(err) as string);
                localStorage.setItem('saveErrorSave', saveText);
            }
            if (loadedGame) {
                game = loadedGame;
            } else {
                setTimeout(() => {
                    game.dispatchEvent('announceMessage', {
                        type: 'message',
                        message: 'Could not load corrupted save.'
                    });
                });
            }
        }
    });
</script>

<svelte:window
    onbeforeunload={() => {
        localStorage.setItem('save', saveGame(game, false));
    }}
/>

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
                    try {
                        loadConfirmationLoadGame = loadGame(textarea!.value);
                        loadConfirmationWindow = true;
                    } catch (err) {
                        console.error(err);
                        game.dispatchEvent('announceMessage', {
                            type: 'message',
                            message: 'Failed to load game'
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
    <MouseTooltip style="area">
        <div class="w-24 p-1 text-center leading-[0.7]">Shift click to save raw data</div>
    </MouseTooltip>
{/if}

<AlertWindow bind:open={loadConfirmationWindow} title="Load Save" gradientStart="black">
    {#if loadConfirmationLoadGame}
        {@const loadGame = loadConfirmationLoadGame}
        {@const reactor = loadGame.world.getResource(Reactor)}
        {@const tickManager = loadGame.world.getResource(TickManager)}
        <div class="flex max-w-80 flex-col gap-1">
            <span class="text-center">Are you sure you want to load save?</span>
            <hr />
            <div class="flex flex-col">
                {#if loadGame.saveDate}
                    <span class="text-center">
                        Saved on {loadGame.saveDate.toLocaleString()}
                    </span>
                {/if}
                <span class="text-center">
                    ${formatMoney(reactor.money)} - {tickManager.numTicks} ticks - {tickManager.extraTicks}
                    extra ticks
                </span>
                <ReactorCanvas game={loadGame} isStatic={true} />
            </div>
            <hr />
            <div class="grid grid-cols-2 gap-1">
                <button class="button" onclick={() => (loadConfirmationWindow = false)}>NO</button>
                <button
                    class="button"
                    onclick={() => {
                        game = loadGame;
                        setTimeout(() => {
                            game.dispatchEvent('announceMessage', {
                                type: 'message',
                                message: 'Game loaded'
                            });
                        });
                        loadConfirmationWindow = false;
                    }}>LOAD SAVE</button
                >
            </div>
        </div>
    {/if}
</AlertWindow>
