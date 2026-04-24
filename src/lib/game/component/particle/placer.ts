import type { Component, World } from '$lib/ecs';
import { ParticleLifetime, type ParticlePos } from './base';
import { ParticleExplosionRenderer } from './explosion';

class ParticlePlacer<T extends string> {
    private readonly things: {
        [_ in T]: () => Component[] | null;
    };
    public constructor(things: {
        [_ in T]: () => Component[] | null;
    }) {
        this.things = things;
    }

    public place(world: World, pos: ParticlePos, thing: T): boolean {
        const components = this.things[thing]();
        if (!components) return false;
        world.addEntity([pos, ...components]);
        return true;
    }
}

export const PARTICLE_PLACER = new ParticlePlacer({
    explosion: () => {
        return [new ParticleLifetime(500), new ParticleExplosionRenderer()];
    }
});
