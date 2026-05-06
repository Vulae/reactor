<!--
    TODO: Make tooltip move to fit inside of the screen.
-->

<script lang="ts">
    import type { Snippet } from 'svelte';

    let mouseX: number = $state(0);
    let mouseY: number = $state(0);

    let {
        style = 'none',
        children
    }: {
        style?: 'none' | 'outdent' | 'area' | 'speech';
        children: Snippet;
    } = $props();
</script>

<svelte:body
    onmousemove={(ev) => {
        mouseX = ev.clientX;
        mouseY = ev.clientY;
    }}
    onmouseover={(ev) => {
        mouseX = ev.clientX;
        mouseY = ev.clientY;
    }}
/>

<div class="pointer-events-none fixed z-50" style:left="{mouseX}px" style:top="{mouseY}px">
    {#if style == 'none'}
        <div class="h-max w-max">
            {@render children()}
        </div>
    {:else if style == 'outdent'}
        <div class="p-2">
            <div class="shadow-outline-up h-max w-max bg-zinc-300">
                {@render children()}
            </div>
        </div>
    {:else if style == 'area'}
        <div class="p-2">
            <div class="bg-white p-0.5">
                <div class="h-max w-max outline-2 outline-gray-400 outline-dashed">
                    {@render children()}
                </div>
            </div>
        </div>
    {:else if style == 'speech'}
        <div class="absolute top-4 -left-2 flex flex-col">
            <svg
                viewBox="0 0 26 26"
                class=" ml-4 size-[26px] translate-y-[2px]"
                xmlns="http://www.w3.org/2000/svg"
            >
                <polygon points="1,1 1,24 24,24" fill="white" />
                <path d="M1 24V1L24 24" fill="none" stroke="black" stroke-width="1" />
            </svg>
            <div class="h-max w-max rounded-xl bg-white outline-1 outline-black">
                {@render children()}
            </div>
        </div>
    {/if}
</div>
