import { System } from '$lib/ecs';
import { ATLAS_EXPLOSION } from '$lib/game/textures';
import { ParticleLifetime, ParticlePos } from './base';

export class ParticleExplosionRenderer {
    public static readonly SYSTEM = new System(
        [CanvasRenderingContext2D, [ParticleExplosionRenderer, ParticlePos, ParticleLifetime]],
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
