import type { Particle } from './reactor';
import { EXPLOSION } from './resources';

export class ExplodeParticle implements Particle {
    public readonly x: number;
    public readonly y: number;
    private readonly createdAt: number;
    private readonly duration: number = 500;

    public constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
        this.createdAt = Date.now();
    }

    public render(ctx: CanvasRenderingContext2D): boolean {
        const lifetime = (Date.now() - this.createdAt) / this.duration;
        if (lifetime > 1) {
            return false;
        }
        EXPLOSION.draw(ctx, lifetime, this.x, this.y);
        return true;
    }
}
