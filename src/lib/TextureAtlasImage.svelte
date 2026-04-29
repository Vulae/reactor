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
</script>

{#await atlas.getTextureImageAsBlobURL(texture) then url}
    <img src={url} alt={texture} class={_class} draggable="false" />
{/await}
