# [ECS](https://github.com/Vulae/reactor/tree/main/src/lib/ecs)

Simple TypeScript [ECS](https://en.wikipedia.org/wiki/Entity_component_system)

# [License](#license)

[`MIT-0` / `MIT No Attribution`](./LICENSE)
i.e. Literally do anything you want with it lmao

# [Usage](#usage)

```TypeScript
import * as ECS from "@ecs";

// Define some components
class Position {
    public x: number;
    public y: number;
    public constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }
}

class Sprite {
    public texture: string;
    public constructor(texture: string) {
        this.texture = texture;
    }

    public draw(ctx: CanvasRenderingContext2D): void {
        // ...
    }
}

// Create a system
const SYSTEM_RENDER_SPRITE = new ECS.System(
    // A singular constructor will query a resource.
    // A tuple of constructors will query entities.
    [CanvasRenderingContext2D, [Sprite, Position]],
    (ctx, entities) => {
        for(const entity of entities) {
            const [sprite, position] = entity.components;
            ctx.save();
            ctx.translate(position.x, position.y);
            sprite.draw(ctx);
            ctx.restore();
        }
    },
);

// Add system to the world
const world = new ECS.World({
    // Usually want to enable safety checks for dev builds
    safetyChecks: true,
}, {
    // Define stages which run systems
    render: [
        SYSTEM_RENDER_SPRITE,
    ]
});

// Add resources to the world
const canvas = document.querySelector('canvas')!;
const ctx = canvas.getContext('2d')!;
ctx.scale(32, 32);
world.resources.set(ctx);

// Add entity to the world
world.components.add([new Sprite('player'), new Position(10, 10)]);

// Run a stage
const render = () => {
    requestAnimationFrame(render);
    world.runStage('render');
}
render();
```
