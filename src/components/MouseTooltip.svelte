<!--
    TODO: Make tooltip move to fit inside of the screen.
-->

<script lang="ts">
    import type { Snippet } from 'svelte';

    let mouseX: number = $state(0);
    let mouseY: number = $state(0);

    let {
        children
    }: {
        children: Snippet;
    } = $props();
</script>

<svelte:body
    onmousemove={(ev) => {
        mouseX = ev.clientX;
        mouseY = ev.clientY;
    }}
/>

<div class="pointer-events-none fixed z-50 p-2" style:left="{mouseX}px" style:top="{mouseY}px">
    <div class="h-max w-max border-2 border-black/50 bg-white/50 backdrop-blur-sm">
        {@render children()}
    </div>
</div>
