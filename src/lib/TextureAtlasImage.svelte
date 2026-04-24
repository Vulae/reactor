<script lang="ts" generics="K extends string">
    import type { TextureAtlas } from './textureAtlas';

    let {
        class: _class = '',
        atlas,
        texture
    }: {
        class?: string;
        atlas: TextureAtlas<K>;
        texture: K;
    } = $props();

    let url: string | null = $state(null);

    $effect(() => {
        atlas.getTextureImageBlob(texture).then((blob) => (url = URL.createObjectURL(blob)));
        return () => {
            if (url) {
                URL.revokeObjectURL(url);
            }
        };
    });
</script>

{#if url}
    <img src={url} alt={texture} class={_class} draggable="false" />
{/if}
