<script lang="ts">
    import AlertWindow from '$lib/AlertWindow.svelte';
    import { Game } from './resource/game';
    import { saveGame } from './save';

    let {
        dev = $bindable(),
        game = $bindable()
    }: {
        dev: boolean;
        game: Game;
    } = $props();

    let clearSaveConfirmationWindow: boolean = $state(false);
</script>

<div class="flex flex-col gap-1">
    <button
        class="button px-2"
        onclick={() => {
            clearSaveConfirmationWindow = true;
        }}
    >
        Clear Save
    </button>
    <label class="flex cursor-pointer items-center gap-1">
        <input class="checkbox" type="checkbox" bind:checked={dev} />
        Development Mode
    </label>
</div>

<AlertWindow bind:open={clearSaveConfirmationWindow} title="Clear Save" gradientStart="black">
    <div class="flex max-w-48 flex-col gap-1">
        <span class="text-center">Are you sure you want to clear your save?</span>
        <hr />
        <span class="text-center">
            Just in case, copy your current save data and save it to a file.
        </span>
        <textarea
            value={saveGame(game, false)}
            class="shadow-outline-down h-16 resize-none bg-white"
            autocomplete="off"
            readonly
        ></textarea>
        <hr />
        <div class="grid grid-cols-2 gap-1">
            <button class="button" onclick={() => (clearSaveConfirmationWindow = false)}>
                NO
            </button>
            <button
                class="button"
                onclick={() => {
                    game = new Game();
                    setTimeout(() => {
                        game.dispatchEvent('announceMessage', {
                            type: 'message',
                            message: 'Your save was cleared.'
                        });
                    });
                    clearSaveConfirmationWindow = false;
                }}
            >
                CLEAR SAVE
            </button>
        </div>
    </div>
</AlertWindow>
