<script lang="ts">
    import { TILESET } from '$lib/resources';
    import { onDestroy, onMount } from 'svelte';
    import Window from '$components/Window.svelte';

    let debugTilesetBlob: string | null = $state(null);

    onMount(() => {
        TILESET.debugGetRebuiltBlob().then((blob) => {
            debugTilesetBlob = URL.createObjectURL(blob);
        });
    });

    onDestroy(() => {
        if (debugTilesetBlob) {
            URL.revokeObjectURL(debugTilesetBlob);
        }
    });
</script>

<Window title={'DEBUG: Tilset Atlas Image'} gradientStart="black">
    {#if debugTilesetBlob}
        <img class="allow-context-menu" src={debugTilesetBlob} alt="Debug tileset atlas" />
    {/if}
</Window>
