import type { Upgrades } from '#lib/game/resource/upgrades.ts';

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
        return (
            {
                [TileBasicGeneratorType.Uranium]: 20,
                [TileBasicGeneratorType.Plutonium]: 100
            }[this.type] *
            2 ** (upgrades.basicGenerator[this.type].durability + 1)
        );
    }

    public getHeatGeneration(_upgrades: Upgrades): number {
        return (
            {
                [TileBasicGeneratorType.Uranium]: 1,
                [TileBasicGeneratorType.Plutonium]: 150
            }[this.type] *
            (this.tier + 1) ** 3
        );
    }

    public getPowerGeneration(upgrades: Upgrades): number {
        return (
            {
                [TileBasicGeneratorType.Uranium]: 1,
                [TileBasicGeneratorType.Plutonium]: 150
            }[this.type] *
            (this.tier + 1) ** 2 *
            (upgrades.basicGenerator[this.type].powerGeneration + 1)
        );
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

    public getMaxHeat(_upgrades: Upgrades) {
        return {
            [TileBasicComponentType.Basic]: 40,
            [TileBasicComponentType.Advanced]: 3000
        }[this.type];
    }

    public getHeatVentAmount(upgrades: Upgrades) {
        return (
            {
                [TileBasicComponentType.Basic]: 4,
                [TileBasicComponentType.Advanced]: 300
            }[this.type] *
            (upgrades.ventEfficiency + 1)
        );
    }
}

export class TileBasicCapacitor {
    public readonly type: TileBasicComponentType;
    public constructor(type: TileBasicComponentType) {
        this.type = type;
    }

    public getPowerStorage(upgrades: Upgrades): number {
        return (
            {
                [TileBasicComponentType.Basic]: 200,
                [TileBasicComponentType.Advanced]: 10000
            }[this.type] *
            (upgrades.capacitorStorage + 1)
        );
    }
}
