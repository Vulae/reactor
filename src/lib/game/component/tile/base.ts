import { Query, type ComponentConstructor } from '$lib/ecs';
import type { ATLAS } from '$lib/game/textures';

export class TilePos {
    public x: number;
    public y: number;
    public constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    public eq(other: TilePos): boolean {
        return this.x == other.x && this.y == other.y;
    }

    public distance(other: TilePos): number {
        return Math.abs(this.x - other.x) + Math.abs(this.y - other.y);
    }

    public queryWithinDistance<const T extends ComponentConstructor[]>(
        components: T,
        distance: number,
        ignoreThis: boolean = true
    ): Query<T> {
        return new Query(components).filter([TilePos], (pos) => {
            return this.distance(pos) <= distance && (!ignoreThis || pos != this);
        });
    }

    public queryOnPos<const T extends ComponentConstructor[]>(components: T): Query<T> {
        return this.queryWithinDistance(components, 0, false);
    }
}

export class TileType {
    public readonly weakType: string;
    public readonly strongType: string | null = null;
    public constructor(weakType: string, strongType: string | null = null) {
        this.weakType = weakType;
        this.strongType = strongType;
    }
}

export class TileBasicSprite {
    public readonly texture: keyof (typeof ATLAS)['textures'];
    public constructor(texture: keyof (typeof ATLAS)['textures']) {
        this.texture = texture;
    }
}

export class TileHeatable {
    public maxHeat: number;
    public heat: number;
    public constructor(maxHeat: number, heat: number = 0) {
        this.maxHeat = maxHeat;
        this.heat = heat;
    }
}

export class TileDurability {
    public durability: number;
    public maxDurability: number;
    public constructor(durability: number, maxDurability: number = durability) {
        this.durability = durability;
        this.maxDurability = maxDurability;
    }

    public isDead(): boolean {
        return this.durability <= 0;
    }

    public static queryIsDead<const T extends ComponentConstructor[]>(
        isDead: boolean,
        components: T
    ): Query<T> {
        return new Query(components).filter([TileDurability], (durability) => {
            return durability.isDead() == isDead;
        });
    }
}

export class TileCapacitor {
    public powerAmount: number;
    public constructor(powerAmount: number) {
        this.powerAmount = powerAmount;
    }
}
