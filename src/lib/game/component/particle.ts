import { System, World } from '$lib/ecs';
import { FrameInfo } from '$lib/game/resource/info';
import { ATLAS_EXPLOSION } from '$lib/game/textures';

export class ParticlePos {
    public x: number;
    public y: number;

    public constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }
}

export class ParticleLifetime {
    public milliseconds: number;
    public readonly startMilliseconds: number;
    public constructor(milliseconds: number) {
        this.milliseconds = milliseconds;
        this.startMilliseconds = milliseconds;
    }

    public static readonly SYSTEM_RENDER = new System(
        [FrameInfo, [ParticleLifetime]],
        (frameInfo, entities) => {
            for (const entity of entities) {
                const [lifetime] = entity.components;
                lifetime.milliseconds -= frameInfo.dt;
                if (lifetime.milliseconds <= 0) {
                    entity.destroy();
                }
            }
        }
    );
}

export class ParticleExplosion {
    public static create(world: World, pos: ParticlePos): void {
        world.components.add([pos, new ParticleLifetime(500), new ParticleExplosion()]);
    }

    public static readonly SYSTEM_RENDER = new System(
        [CanvasRenderingContext2D, [ParticleExplosion, ParticlePos, ParticleLifetime]],
        (ctx, entities) => {
            for (const entity of entities) {
                const [_, position, lifetime] = entity.components;
                ATLAS_EXPLOSION.draw(
                    ctx,
                    1 - lifetime.milliseconds / lifetime.startMilliseconds,
                    position.x,
                    position.y
                );
            }
        }
    );
}
