<script lang="ts">
    import type { Snippet } from 'svelte';

    let {
        title,
        titleDark = false,
        gradientStart,
        gradientEnd = gradientStart,
        class: _class = '',
        children,
        collapsable = 'no',
        collapsed = false,
        onClose
    }: {
        title: String;
        titleDark?: boolean;
        gradientStart: String;
        gradientEnd?: String;
        class?: String;
        children: Snippet;
        collapsable?: 'no' | 'hidden' | 'removed';
        collapsed?: boolean;
        onClose?: () => unknown;
    } = $props();
</script>

<div class="shadow-outline-up flex flex-col gap-1 bg-zinc-300 p-1 {_class}">
    <div
        class="grid grid-cols-[1fr_auto] gap-2 px-1"
        style:background="linear-gradient(90deg, {gradientStart} 0%, {gradientEnd} 100%)"
    >
        <button
            onclick={() => (collapsed = !collapsed)}
            class="flex items-center gap-1 pr-4"
            style:color={titleDark ? 'var(--color-black)' : 'var(--color-white)'}
            style:cursor={collapsable != 'no' ? 'pointer' : ''}
        >
            {#if collapsable != 'no'}
                <div class="font-jersey" style={collapsed ? 'rotate:90deg' : ''}>&gt;</div>
            {/if}
            <span class="font-jersey text-xl">
                {title}
            </span>
        </button>
        {#if onClose}
            <div class="flex items-center">
                <button class="button size-3.5 bg-zinc-300 text-base" onclick={() => onClose()}
                    >X</button
                >
            </div>
        {/if}
    </div>
    {#if collapsable == 'no'}
        <div>
            {@render children()}
        </div>
    {:else if collapsable == 'hidden'}
        <div style={collapsable == 'hidden' && collapsed ? 'display: hidden' : ''}>
            {@render children()}
        </div>
    {:else if collapsable == 'removed'}
        {#if !collapsed}
            <div>
                {@render children()}
            </div>
        {/if}
    {/if}
</div>
