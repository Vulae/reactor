import { Query, type ComponentConstructor } from '$lib/ecs';
import type { Upgrades } from '$lib/game/resource/upgrades';
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

export class TileOverwrite {
    public readonly type: string;
    public constructor(type: string) {
        this.type = type;
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
    public autoreplaceCost: number;
    public constructor(
        durability: number,
        autoreplaceCost: number,
        maxDurability: number = durability
    ) {
        this.durability = durability;
        this.autoreplaceCost = autoreplaceCost;
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

export enum TileBasicGeneratorType {
    Uranium = 'Uranium',
    Plutonium = 'Plutonium'
}

export class TileBasicGenerator {
    public readonly type: TileBasicGeneratorType;
    public readonly tier: 0 | 1 | 2;
    public constructor(type: TileBasicGeneratorType, tier: 0 | 1 | 2) {
        this.type = type;
        this.tier = tier;
    }

    public getMaxDurability(upgrades: Upgrades): number {
        return upgrades.getBasicGeneratorDurability(this.type);
    }

    public getHeatGeneration(upgrades: Upgrades): number {
        return upgrades.getBasicGeneratorHeatGeneration(this.type, this.tier);
    }

    public getPowerGeneration(upgrades: Upgrades): number {
        return upgrades.getBasicGeneratorPowerGeneration(this.type, this.tier);
    }
}

export enum TileBasicComponentType {
    Basic = 'Basic',
    Advanced = 'Advanced'
}

export class TileBasicHeatVent {
    public readonly type: TileBasicComponentType;
    public constructor(type: TileBasicComponentType) {
        this.type = type;
    }

    public getMaxHeat(reactor: Upgrades) {
        return reactor.getBasicVentMaxHeat(this.type);
    }

    public getHeatVentAmount(reactor: Upgrades) {
        return reactor.getBasicVentHeatVentAmount(this.type);
    }
}

export class TileBasicCapacitor {
    public readonly type: TileBasicComponentType;
    public constructor(type: TileBasicComponentType) {
        this.type = type;
    }
}
