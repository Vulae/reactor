import { notNull } from '$lib/util';
import { Game } from './resource/game';
import { Reactor } from './resource/reactor';

import { deflateSync, inflateSync } from 'fflate';
import { Base64 } from 'js-base64';
import { Upgrades } from './resource/upgrades';
import { TickManager } from './resource/tickManager';
import {
    TileBasicSprite,
    TileCapacitor,
    TileDurability,
    TileHeatable,
    TileType as TileType,
    TilePos
} from './component/tile/base';
import {
    TileBasicCapacitor,
    TileBasicComponentType,
    TileBasicGenerator,
    TileBasicGeneratorType,
    TileBasicHeatVent
} from './component/tile/basic';
import { Stats } from './resource/stats';
import { World } from '$lib/ecs';
import { FrameInfo } from './resource/info';
import { GameRenderOptions } from './resource/options';
import { GameCursor } from './resource/cursor';
import { ComponentPlacer } from './resource/componentPlacer';
import { UpgradeBuyer } from './resource/upgradeBuyer';
import { ParticleExplosion, ParticleLifetime, ParticlePos } from './component/particle';

type Constr = new (...args: any) => any;
type ConstrNew<C extends Constr> = C extends new (...args: any) => infer R ? R : never;

const SAVER_NONE = Symbol('SAVER_NONE');

class ClassSaver<C extends Constr> {
    public readonly name: string;
    public readonly constr: C;
    public readonly save: (v: ConstrNew<C>) => { [key: string]: any } | typeof SAVER_NONE;
    public readonly load: (v: { [key: string]: any }) => ConstrNew<C>;
    public constructor(
        name: string,
        constr: C,
        save: (v: ConstrNew<C>) => { [key: string]: any } | typeof SAVER_NONE,
        load: (v: { [key: string]: any }) => ConstrNew<C>
    ) {
        this.name = name;
        this.constr = constr;
        this.save = save;
        this.load = load;
    }

    public static none<C extends Constr>(name: string, constr: C): ClassSaver<C> {
        return new ClassSaver(
            name,
            constr,
            () => SAVER_NONE,
            () => {
                throw new Error('Unreachable');
            }
        );
    }

    public static basic<C extends Constr>(
        name: string,
        constr: C,
        constrConstr: () => ConstrNew<C>,
        keys: (keyof ConstrNew<C>)[]
    ): ClassSaver<C> {
        return new ClassSaver(
            name,
            constr,
            (v) => extract({}, v, keys),
            (v) => extract(constrConstr(), v as any, keys)
        );
    }
}

function extract<T extends { [key: string]: any }, K extends { [key: string]: any }>(
    to: T,
    from: K,
    keys: (keyof K)[]
): T {
    for (const key of keys) {
        // @ts-expect-error - aakjsdaksd
        to[key] = from[key];
    }
    return to;
}

const SAVERS_RESOURCES: ClassSaver<Constr>[] = [
    ClassSaver.none('Game', Game),
    ClassSaver.none('World', World),
    ClassSaver.none('FrameInfo', FrameInfo),
    ClassSaver.none('GameRenderOptions', GameRenderOptions),
    ClassSaver.none('GameCursor', GameCursor),
    ClassSaver.none('ComponentPlacer', ComponentPlacer),
    ClassSaver.none('UpgradeBuyer', UpgradeBuyer),
    ClassSaver.none('CanvasRenderingContext2D', CanvasRenderingContext2D),
    (() => {
        const KEYS: (keyof TickManager)[] = [
            'numTicks',
            'millisecondsPerTick',
            'extraTicks',
            'dateSinceLastTick'
        ];
        return new ClassSaver(
            'TickManager',
            TickManager,
            (v) => {
                const s: { [key: string]: any } = extract({}, v, KEYS);
                s['extraTicks'] = v.extraTicks == Infinity ? 'INFINITY' : v.extraTicks;
                return s;
            },
            (v) => {
                const s: TickManager = extract(new TickManager(), v as any, KEYS);
                if ((s.extraTicks as any) == 'INFINITY') {
                    s.extraTicks = Infinity;
                }
                return s;
            }
        );
    })(),
    (() => {
        const KEYS: (keyof Reactor)[] = [
            'width',
            'height',
            'heat',
            'maxHeat',
            'power',
            'maxPower',
            'money'
        ];
        return new ClassSaver(
            'Reactor',
            Reactor,
            (v) => {
                const s: { [key: string]: any } = extract({}, v, KEYS);
                s['money'] = v.money == Infinity ? 'INFINITY' : v.money;
                return s;
            },
            (v) => {
                const s: Reactor = extract(new Reactor(), v as any, KEYS);
                if ((s.money as any) == 'INFINITY') {
                    s.money = Infinity;
                }
                return s;
            }
        );
    })(),
    ClassSaver.basic('Stats', Stats, () => new Stats(), [
        'totalHeatDissipatedThisReset',
        'totalPowerGeneratedThisReset',
        'totalMoneyGainedThisReset',
        'totalHeatDissipated',
        'totalPowerGenerated',
        'totalMoneyGained'
    ]),
    ClassSaver.basic('Upgrades', Upgrades, () => new Upgrades(), [
        'basicGenerator',
        'ventEfficiency',
        'capacitorStorage'
    ])
];

const SAVERS_COMPONENTS: ClassSaver<Constr>[] = [
    ClassSaver.none('ParticlePos', ParticlePos),
    ClassSaver.none('ParticleLifetime', ParticleLifetime),
    ClassSaver.none('ParticleExplosion', ParticleExplosion),
    ClassSaver.basic('TilePos', TilePos, () => new TilePos(0, 0), ['x', 'y']),
    ClassSaver.basic('TileType', TileType, () => new TileType(''), ['weakType', 'strongType']),
    ClassSaver.basic(
        'TileBasicSprite',
        TileBasicSprite,
        () => new TileBasicSprite('missing_texture'),
        ['texture']
    ),
    ClassSaver.basic('TileHeatable', TileHeatable, () => new TileHeatable(0, 0), [
        'heat',
        'maxHeat'
    ]),
    ClassSaver.basic('TileDurability', TileDurability, () => new TileDurability(0, 0), [
        'durability',
        'maxDurability'
    ]),
    ClassSaver.basic('TileCapacitor', TileCapacitor, () => new TileCapacitor(0), ['powerAmount']),
    ClassSaver.basic(
        'TileBasicGenerator',
        TileBasicGenerator,
        () => new TileBasicGenerator(TileBasicGeneratorType.Uranium, 1),
        ['type', 'tier']
    ),
    ClassSaver.basic(
        'TileBasicHeatVent',
        TileBasicHeatVent,
        () => new TileBasicHeatVent(TileBasicComponentType.Basic),
        ['type']
    ),
    ClassSaver.basic(
        'TileBasicCapacitor',
        TileBasicCapacitor,
        () => new TileBasicCapacitor(TileBasicComponentType.Basic),
        ['type']
    )
];

export function saveGameRaw(game: Game): any {
    return {
        saveDate: new Date(),
        resources: Object.fromEntries(
            game.world.resources
                .iter()
                .map((resource) => {
                    const SAVER = SAVERS_RESOURCES.find(
                        (SAVER) => SAVER.constr == resource.constructor
                    );
                    if (!SAVER) {
                        console.warn(
                            `No saver for resource "${resource.constructor.name}"`,
                            resource
                        );
                        return null;
                    }
                    return [SAVER.name, SAVER.save(resource as any)];
                })
                .filter(notNull)
                .filter(([_, v]) => v !== SAVER_NONE)
                .toArray()
        ),
        entities: game.world.components
            .iterRawEntities()
            .map((entity) => {
                const entries = entity
                    .values()
                    .map((component) => {
                        const SAVER = SAVERS_COMPONENTS.find(
                            (SAVER) => SAVER.constr == component.constructor
                        );
                        if (!SAVER) {
                            console.warn(
                                `No saver for component "${component.constructor.name}"`,
                                entity,
                                component
                            );
                            return null;
                        }
                        return [SAVER.name, SAVER.save(component as any)];
                    })
                    .filter(notNull)
                    .filter(([_, v]) => v !== SAVER_NONE)
                    .toArray();
                if (entries.length == 0) return null;
                return Object.fromEntries(entries);
            })
            .filter(notNull)
            .toArray()
    };
}

export function loadGameRaw(v: any): Game {
    const game = new Game();
    for (const [resourceName, resource] of Object.entries(v.resources) as [
        string,
        { [key: string]: any }
    ][]) {
        const SAVER = SAVERS_RESOURCES.find((SAVER) => SAVER.name == resourceName);
        if (!SAVER) {
            throw new Error(`Could not load resource "${resourceName}"`);
        }
        const loadedResource = SAVER.load(resource);
        game.world.resources.set(loadedResource);
    }
    for (const entity of v.entities) {
        const loadedComponents = [];
        for (const [componentName, component] of Object.entries(entity) as [
            string,
            { [key: string]: any }
        ][]) {
            const SAVER = SAVERS_COMPONENTS.find((SAVER) => SAVER.name == componentName);
            if (!SAVER) {
                throw new Error(`Could not load component "${componentName}"`);
            }
            const loadedComponent = SAVER.load(component);
            loadedComponents.push(loadedComponent);
        }
        game.world.components.add(loadedComponents);
    }
    game.saveDate = new Date(v.saveDate);
    return game;
}

export function saveGame(game: Game, raw: boolean): string {
    const saveStr = JSON.stringify(saveGameRaw(game));
    if (raw) {
        return saveStr;
    }
    const rawBuffer = new TextEncoder().encode(saveStr);
    const compressedBuffer = deflateSync(rawBuffer);
    return Base64.fromUint8Array(compressedBuffer);
}

export function loadGame(v: string): Game {
    if (v[0] == '{' && v[v.length - 1] == '}') {
        return loadGameRaw(JSON.parse(v));
    }
    const compressedBuffer = Base64.toUint8Array(v);
    const rawBuffer = inflateSync(compressedBuffer);
    const saveStr = new TextDecoder().decode(rawBuffer);
    return loadGameRaw(JSON.parse(saveStr));
}
