import { System } from '$lib/ecs';
import { Dt } from '$lib/game/resource/info';
import { ATLAS } from '$lib/game/textures';

export class ParticlePos {
    public x: number;
    public y: number;
    public angle: number;

    public constructor(x: number, y: number, angle: number = 0) {
        this.x = x;
        this.y = y;
        this.angle = angle;
    }
}

export class ParticleBasicRenderer {
    public readonly texture: keyof (typeof ATLAS)['textures'];

    public constructor(texture: keyof (typeof ATLAS)['textures']) {
        this.texture = texture;
    }

    public static readonly SYSTEM = new System(
        [CanvasRenderingContext2D, [ParticleBasicRenderer, ParticlePos]],
        (ctx, entities) => {
            for (const entity of entities) {
                const [renderer, position] = entity.components;
                ctx.save();
                ctx.translate(position.x, position.y);
                ctx.rotate(position.angle);
                ATLAS.draw(ctx, renderer.texture);
                ctx.restore();
            }
        }
    );
}

export class ParticleLifetime {
    public milliseconds: number;
    public readonly startMilliseconds: number;
    public constructor(milliseconds: number) {
        this.milliseconds = milliseconds;
        this.startMilliseconds = milliseconds;
    }

    public static readonly SYSTEM = new System([[ParticleLifetime], Dt], (entities, dt) => {
        for (const entity of entities) {
            const [lifetime] = entity.components;
            lifetime.milliseconds -= dt.dt;
            if (lifetime.milliseconds <= 0) {
                entity.destroy();
            }
        }
    });
}
