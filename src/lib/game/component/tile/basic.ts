import type { Upgrades } from '$lib/game/resource/upgrades';

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
