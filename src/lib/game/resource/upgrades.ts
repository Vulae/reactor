import { TileBasicGeneratorType, TileBasicComponentType } from '../component/tile/base/def';

export class Upgrades {
    public readonly basicGenerator: {
        [_ in TileBasicGeneratorType]: {
            powerGeneration: number;
            durability: number;
            autoReplace: boolean;
        };
    } = Object.fromEntries(
        Object.values(TileBasicGeneratorType).map((v) => [
            v,
            {
                powerGeneration: 0,
                durability: 0,
                autoReplace: false
            }
        ])
    ) as any;

    public getBasicGeneratorCost(type: TileBasicGeneratorType, tier: 0 | 1 | 2): number {
        return (
            {
                [TileBasicGeneratorType.Uranium]: 10,
                [TileBasicGeneratorType.Plutonium]: 10
            }[type] *
            (tier + 1) ** 2
        );
    }

    public getBasicGeneratorUpgradeCost(type: TileBasicGeneratorType): {
        powerGeneration: number;
        durability: number;
        autoReplace: number;
    } {
        switch (type) {
            case TileBasicGeneratorType.Uranium:
                return {
                    powerGeneration:
                        (this.basicGenerator[TileBasicGeneratorType.Uranium].powerGeneration + 1) **
                        10,
                    durability:
                        (this.basicGenerator[TileBasicGeneratorType.Uranium].durability + 1) ** 10,
                    autoReplace: 10000
                };
            case TileBasicGeneratorType.Plutonium:
                return {
                    powerGeneration:
                        (this.basicGenerator[TileBasicGeneratorType.Plutonium].powerGeneration +
                            1) **
                        10,
                    durability:
                        (this.basicGenerator[TileBasicGeneratorType.Plutonium].durability + 1) **
                        10,
                    autoReplace: 10000000
                };
        }
    }

    public getBasicGeneratorDurability(type: TileBasicGeneratorType): number {
        return (
            {
                [TileBasicGeneratorType.Uranium]: 20,
                [TileBasicGeneratorType.Plutonium]: 100
            }[type] *
            2 ** (this.basicGenerator[type].durability + 1)
        );
    }

    public getBasicGeneratorHeatGeneration(type: TileBasicGeneratorType, tier: 0 | 1 | 2): number {
        return (
            {
                [TileBasicGeneratorType.Uranium]: 1,
                [TileBasicGeneratorType.Plutonium]: 150
            }[type] *
            (tier + 1) ** 3
        );
    }

    public getBasicGeneratorPowerGeneration(type: TileBasicGeneratorType, tier: 0 | 1 | 2): number {
        return (
            {
                [TileBasicGeneratorType.Uranium]: 1,
                [TileBasicGeneratorType.Plutonium]: 150
            }[type] *
            (tier + 1) ** 2 *
            (this.basicGenerator[type].powerGeneration + 1)
        );
    }

    public readonly basicVent: {
        [_ in TileBasicComponentType]: {
            ventAmount: number;
        };
    } = Object.fromEntries(
        Object.values(TileBasicComponentType).map((v) => [
            v,
            {
                ventAmount: 0
            }
        ])
    ) as any;

    public getBasicVentCost(type: TileBasicComponentType): number {
        switch (type) {
            case TileBasicComponentType.Basic:
                return 50;
            case TileBasicComponentType.Advanced:
                return 12500;
        }
    }

    public getBasicVentHeatVentAmount(type: TileBasicComponentType): number {
        switch (type) {
            case TileBasicComponentType.Basic:
                return 4;
            case TileBasicComponentType.Advanced:
                return 300;
        }
    }

    public getBasicVentMaxHeat(type: TileBasicComponentType): number {
        switch (type) {
            case TileBasicComponentType.Basic:
                return 40;
            case TileBasicComponentType.Advanced:
                return 3000;
        }
    }
}
