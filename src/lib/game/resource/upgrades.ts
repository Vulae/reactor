import { TileBasicGeneratorType, TileBasicComponentType } from '../component/tile/basic';

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
        return {
            powerGeneration:
                {
                    [TileBasicGeneratorType.Uranium]: 100,
                    [TileBasicGeneratorType.Plutonium]: 500000
                }[type] *
                (this.basicGenerator[type].powerGeneration + 1) ** 4,
            durability:
                {
                    [TileBasicGeneratorType.Uranium]: 250,
                    [TileBasicGeneratorType.Plutonium]: 1250000
                }[type] *
                50 ** (this.basicGenerator[type].durability + 1),
            autoReplace: {
                [TileBasicGeneratorType.Uranium]: 10000,
                [TileBasicGeneratorType.Plutonium]: 10000000
            }[type]
        };
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

    public ventEfficiency: number = 0;

    public getVentEffiencyCost(): number {
        return 250 * (this.ventEfficiency + 1) ** 3;
    }

    public getBasicVentCost(type: TileBasicComponentType): number {
        return {
            [TileBasicComponentType.Basic]: 50,
            [TileBasicComponentType.Advanced]: 12500
        }[type];
    }

    public getBasicVentHeatVentAmount(type: TileBasicComponentType): number {
        return (
            {
                [TileBasicComponentType.Basic]: 4,
                [TileBasicComponentType.Advanced]: 300
            }[type] *
            (this.ventEfficiency + 1)
        );
    }

    public getBasicVentMaxHeat(type: TileBasicComponentType): number {
        return {
            [TileBasicComponentType.Basic]: 40,
            [TileBasicComponentType.Advanced]: 3000
        }[type];
    }

    public capacitorStorage: number = 0;

    public getBasicCapacitorCost(type: TileBasicComponentType): number {
        return {
            [TileBasicComponentType.Basic]: 1000,
            [TileBasicComponentType.Advanced]: 125000
        }[type];
    }

    public getBasicCapacitorPowerStorage(type: TileBasicComponentType): number {
        return (
            {
                [TileBasicComponentType.Basic]: 200,
                [TileBasicComponentType.Advanced]: 10000
            }[type] *
            (this.capacitorStorage + 1)
        );
    }
}
