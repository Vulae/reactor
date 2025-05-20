<script lang="ts">
    import type { Snippet } from 'svelte';

    let {
        title,
        titleDark = false,
        gradientStart,
        gradientEnd = gradientStart,
        class: _class = '',
        children,
        titleRightContent = null
    }: {
        title: String;
        titleDark?: boolean;
        gradientStart: String;
        gradientEnd?: String;
        class?: String;
        children: Snippet;
        titleRightContent?: Snippet | null;
    } = $props();
</script>

<div class="shadow-outline-up flex flex-col bg-zinc-300 {_class} gap-1 p-1">
    <div
        class="flex items-center justify-between"
        style:background="linear-gradient(90deg, {gradientStart} 0%, {gradientEnd} 100%)"
    >
        <span
            class="font-jersey px-1 text-xl"
            style:color={titleDark ? 'var(--color-black)' : 'var(--color-white)'}
        >
            {title}
        </span>
        {#if titleRightContent}
            {@render titleRightContent()}
        {/if}
    </div>
    <div>
        {@render children()}
    </div>
</div>
