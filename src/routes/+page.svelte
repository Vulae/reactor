<script lang="ts">
    import Game from '$components/Game.svelte';
</script>

<svelte:head>
    <title>Reactor Game</title>
</svelte:head>

<svelte:body
    oncontextmenu={(ev) => {
        // TODO: Make this disablable
        ev.preventDefault();
    }}
/>

<Game />
