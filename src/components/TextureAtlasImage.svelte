<script lang="ts">
    import { onDestroy, onMount } from 'svelte';
    import type { TextureAtlas } from '$lib/textureAtlas';

    let {
        atlas,
        texture,
        class: _class = ''
    }: {
        atlas: TextureAtlas<any>;
        texture: string;
        class?: string;
    } = $props();
    let url: string | null = $state(null);

    onMount(async () => {
        let blob = await atlas.getTextureImageBlob(texture);
        url = URL.createObjectURL(blob);
    });

    onDestroy(() => {
        if (url) {
            URL.revokeObjectURL(url);
        }
    });
</script>

{#if url}
    <img src={url} alt={texture} class={_class} draggable="false" />
{/if}
