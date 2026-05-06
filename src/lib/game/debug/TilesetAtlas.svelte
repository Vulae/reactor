<script lang="ts">
    import type { TextureAtlas } from '$lib/textureAtlas';
    import { onDestroy, onMount } from 'svelte';

    let { atlas }: { atlas: TextureAtlas<any> } = $props();

    let debugTilesetBlob: string | null = $state(null);

    onMount(() => {
        atlas.debugGetRebuiltBlob().then((blob) => {
            debugTilesetBlob = URL.createObjectURL(blob);
        });
    });

    onDestroy(() => {
        if (debugTilesetBlob) {
            URL.revokeObjectURL(debugTilesetBlob);
        }
    });
</script>

{#if debugTilesetBlob}
    <img class="allow-context-menu" src={debugTilesetBlob} alt="Debug tileset atlas" />
{/if}
