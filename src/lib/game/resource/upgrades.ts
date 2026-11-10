import { TileBasicGeneratorType } from '../component/tile/basic';

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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ) as any;

    public ventEfficiency: number = 0;

    public capacitorStorage: number = 0;

    public chronometer: number = 0;
}
