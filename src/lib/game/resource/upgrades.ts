import { TileBasicGeneratorType, TileBasicComponentType } from '../component/tile/base/def';

export class Upgrades {
    public readonly basicGenerator: {
        [_ in TileBasicGeneratorType]: {
            powerGeneration: number;
            powerHeatGeneration: number;
            durability: number;
            autoReplace: boolean;
        };
    } = Object.fromEntries(
        Object.values(TileBasicGeneratorType).map((v) => [
            v,
            {
                powerGeneration: 0,
                powerHeatGeneration: 0,
                durability: 0,
                autoReplace: false
            }
        ])
    ) as any;

    public getBasicGeneratorCost(type: TileBasicGeneratorType, tier: 0 | 1 | 2): number {
        const mul = [1, 2.5, 6][tier];
        switch (type) {
            case TileBasicGeneratorType.Uranium:
                return 10 * mul;
            case TileBasicGeneratorType.Plutonium:
                return 6000 * mul;
        }
    }

    public getBasicGeneratorDurability(type: TileBasicGeneratorType): number {
        switch (type) {
            case TileBasicGeneratorType.Uranium:
                return 20;
            case TileBasicGeneratorType.Plutonium:
                return 100;
        }
    }

    public getBasicGeneratorHeatGeneration(type: TileBasicGeneratorType, tier: 0 | 1 | 2): number {
        const mul = [1, 8, 36][tier];
        switch (type) {
            case TileBasicGeneratorType.Uranium:
                return 1 * mul;
            case TileBasicGeneratorType.Plutonium:
                return 150 * mul;
        }
    }

    public getBasicGeneratorPowerGeneration(type: TileBasicGeneratorType, tier: 0 | 1 | 2): number {
        const mul = [1, 4, 12][tier];
        switch (type) {
            case TileBasicGeneratorType.Uranium:
                return 1 * mul;
            case TileBasicGeneratorType.Plutonium:
                return 150 * mul;
        }
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
