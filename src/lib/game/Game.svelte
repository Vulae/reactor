<script lang="ts">
    import Window from '../Window.svelte';
    import BackgroundPng from '$lib/assets/background.png';
    import Reactor from './Reactor.svelte';
    import DebugInfo from './debug/DebugInfo.svelte';
    import TilesetAtlas from './debug/TilesetAtlas.svelte';
    import { ATLAS } from './textures';
    import SaveLoad from './SaveLoad.svelte';
    import Cheats from './debug/Cheats.svelte';
    import Messages from './Messages.svelte';
    import SimulationControls from './SimulationControls.svelte';
    import Money from './Money.svelte';
    import Info from './Info.svelte';
    import ComponentsShop from './ComponentsShop.svelte';
    import { Game } from './resource/game';
    import UpgradesShop from './UpgradesShop.svelte';
    import Options from './Options.svelte';

    let { dev = $bindable(false) }: { dev?: boolean } = $props();

    // svelte-ignore state_referenced_locally
    let game = $state(new Game());

    $effect(() => {
        return () => {
            const oldGame = game;
            setTimeout(() => {
                oldGame.destroy();
            });
        };
    });

    let body: HTMLBodyElement;
    let canDrag: boolean = $state(false);
    let dragActive: boolean = $state(false);
    let positionX: number = $state(0);
    let positionY: number = $state(0);
</script>

<svelte:body
    bind:this={body}
    onmousedown={(ev) => {
        if (!canDrag) {
            return;
        }
        dragActive = !!(ev.buttons & 1);
    }}
    onmouseup={(ev) => {
        if (!canDrag) {
            return;
        }
        dragActive = !!(ev.buttons & 1);
    }}
    onmousemove={(ev) => {
        if ((ev.target as (EventTarget & HTMLElement) | null)?.classList.contains('bg-drag')) {
            canDrag = true;
        } else {
            canDrag = false;
        }
        if (dragActive) {
            positionX += ev.movementX;
            positionY += ev.movementY;
        }
    }}
    onmouseleave={() => {
        dragActive = false;
    }}
    oncontextmenu={(ev) => {
        // FIXME: For some reason only on firefox, specifically on a disabled button, you cannot disable context menu.

        if (
            (ev.target as (EventTarget & HTMLElement) | null)?.classList.contains(
                'allow-context-menu'
            )
        ) {
            return;
        }
        const ALLOWED_TAGNAMES = ['A', 'TEXTAREA'];
        if (
            ALLOWED_TAGNAMES.some(
                (ALLOWED_TAGNAME) =>
                    (ev.target as (EventTarget & HTMLElement) | null)?.tagName == ALLOWED_TAGNAME
            )
        ) {
            return;
        }
        ev.preventDefault();
    }}
/>

<div
    class="bg-drag absolute h-screen w-screen"
    style:background="url({BackgroundPng})"
    style:background-position="{positionX}px {positionY}px"
    style:cursor={canDrag ? (dragActive ? 'move' : 'pointer') : null}
>
    <div class="bg-drag absolute h-max w-max" style:left="{positionX}px" style:top="{positionY}px">
        <div class="bg-drag flex flex-row gap-1 p-8">
            <div class="bg-drag flex flex-col gap-1">
                <div class="bg-drag flex gap-1">
                    <Window
                        title="Simulation Controls"
                        gradientStart="yellow"
                        gradientEnd="white"
                        titleDark={true}
                    >
                        <SimulationControls {game} />
                    </Window>
                    <Window title="Money" gradientStart="green" gradientEnd="lime">
                        <Money {game} />
                    </Window>
                </div>
                <div class="bg-drag flex gap-1">
                    <Window title="Reactor" gradientStart="red" gradientEnd="pink">
                        <Reactor {game} />
                    </Window>
                    <Window title="Components" gradientStart="darkorange" gradientEnd="orange">
                        <ComponentsShop {game} />
                    </Window>
                    <Window title="Upgrades" gradientStart="darkviolet" gradientEnd="magenta">
                        <UpgradesShop {game} />
                    </Window>
                </div>
                {#if dev}
                    <div class="bg-drag flex gap-1">
                        <Window
                            title="DEBUG: Tileset Atlas"
                            gradientStart="black"
                            gradientEnd="orange"
                        >
                            <TilesetAtlas atlas={ATLAS} />
                        </Window>
                        <Window title="DEBUG: Info" gradientStart="black" gradientEnd="blue">
                            <DebugInfo {game} />
                        </Window>
                        <Window title="DEBUG: Cheats" gradientStart="black" gradientEnd="magenta">
                            <Cheats {game} />
                        </Window>
                    </div>
                {/if}
            </div>
        </div>
    </div>
</div>

<div class="pointer-events-none absolute top-0 left-0 p-2">
    <div class="flex flex-col items-start gap-2">
        <div class="pointer-events-auto">
            <Window
                title="Information"
                gradientStart="magenta"
                gradientEnd="pink"
                collapsable="removed"
                collapsed={true}
            >
                <div class="max-w-56">
                    <Info />
                </div>
            </Window>
        </div>
        <div class="pointer-events-auto">
            <Window
                title="Options"
                gradientStart="darkgreen"
                gradientEnd="lightgreen"
                collapsable="removed"
                collapsed={true}
            >
                <Options bind:dev bind:game />
            </Window>
        </div>
        <div class="pointer-events-auto">
            <Window
                title="Save"
                gradientStart="blue"
                gradientEnd="lightblue"
                collapsable="hidden"
                collapsed={true}
            >
                <SaveLoad bind:game />
            </Window>
        </div>
    </div>
</div>

<div class="pointer-events-none absolute top-0 right-0 p-2">
    <div class="pointer-events-auto">
        <Messages {game} />
    </div>
</div>
