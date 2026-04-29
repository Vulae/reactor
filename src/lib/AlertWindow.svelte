<script lang="ts">
    import type { Snippet } from 'svelte';
    import Window from './Window.svelte';

    let {
        open = $bindable(false),
        title,
        titleDark = false,
        gradientStart,
        gradientEnd = gradientStart,
        class: _class = '',
        children
    }: {
        open: boolean;
        title: String;
        titleDark?: boolean;
        gradientStart: String;
        gradientEnd?: String;
        class?: String;
        children: Snippet;
    } = $props();

    let root: HTMLDivElement | undefined = $state();
</script>

{#if open}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
        class="fixed top-0 left-0 flex h-full w-full cursor-pointer items-center justify-center bg-black/50"
        bind:this={root}
        onclick={(ev) => {
            if (ev.target == root) {
                open = false;
            }
        }}
    >
        <div class="cursor-auto">
            <Window
                {title}
                {titleDark}
                {gradientStart}
                {gradientEnd}
                class={_class}
                onClose={() => {
                    open = false;
                }}
            >
                {@render children()}
            </Window>
        </div>
    </div>
{/if}
