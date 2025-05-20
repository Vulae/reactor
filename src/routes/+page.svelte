<script lang="ts">
    import Game from '$components/Game.svelte';
    import { DEBUG } from '$lib/DEBUG';
</script>

<svelte:head>
    <title>Reactor Game</title>
</svelte:head>

<svelte:body
    oncontextmenu={(ev) => {
        // BUG: For some reason oncontextmenu event WILL NOT trigger on a disabled button????
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
