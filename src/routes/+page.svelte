<script lang="ts">
    import Game from '$components/Game.svelte';
    import { DEBUG } from '$lib/DEBUG';
</script>

<svelte:head>
    <title>Reactor Game</title>
</svelte:head>

<svelte:body
    oncontextmenu={(ev) => {
        if (
            (ev.target as (EventTarget & HTMLElement) | null)?.classList.contains(
                'allow-context-menu'
            )
        ) {
            return;
        }
        // TODO: Make this a toggle in settings or something.
        ev.preventDefault();
    }}
/>

<Game debug={DEBUG} />
