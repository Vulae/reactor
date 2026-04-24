import { notNull } from '$lib/util';
import {
    TileBasicGenerator,
    TileBasicGeneratorType,
    TileBasicHeatVent,
    TileBasicComponentType,
    TileBasicSprite,
    TileDurability,
    TileHeatable,
    TileOverwrite,
    TilePos
} from './component/tile/base/def';
import { Game } from './resource/game';
import { TickInfo } from './resource/info';
import { Reactor } from './resource/reactor';

import { deflateSync, inflateSync } from 'fflate';
import { Base64 } from 'js-base64';
import { Upgrades } from './resource/upgrades';

type Constr = new (...args: any) => any;
type ConstrNew<C extends Constr> = C extends new (...args: any) => infer R ? R : never;

class ClassSaver<C extends Constr> {
    public readonly name: string;
    public readonly constr: C;
    public readonly save: (v: ConstrNew<C>) => { [key: string]: any };
    public readonly load: (v: { [key: string]: any }) => ConstrNew<C>;
    public constructor(
        name: string,
        constr: C,
        save: (v: ConstrNew<C>) => { [key: string]: any },
        load: (v: { [key: string]: any }) => ConstrNew<C>
    ) {
        this.name = name;
        this.constr = constr;
        this.save = save;
        this.load = load;
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

const SAVERS = [
    ClassSaver.basic('TickInfo', TickInfo, () => new TickInfo(), ['numTicks']),
    (() => {
        const KEYS: (keyof Reactor)[] = [
            'width',
            'height',
            'extraTicks',
            'millisecondsPerTick',
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
                s['extraTicks'] = v.extraTicks == Infinity ? 'INFINITY' : v.extraTicks;
                s['money'] = v.money == Infinity ? 'INFINITY' : v.money;
                return s;
            },
            (v) => {
                const s: Reactor = extract(new Reactor(), v as any, KEYS);
                if ((s.extraTicks as any) == 'INFINITY') {
                    s.extraTicks = Infinity;
                }
                if ((s.money as any) == 'INFINITY') {
                    s.money = Infinity;
                }
                return s;
            }
        );
    })(),
    ClassSaver.basic('Upgrades', Upgrades, () => new Upgrades(), ['basicGenerator', 'basicVent']),
    ClassSaver.basic('TilePos', TilePos, () => new TilePos(0, 0), ['x', 'y']),
    ClassSaver.basic('TileOverwrite', TileOverwrite, () => new TileOverwrite(''), ['type']),
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
    ClassSaver.basic(
        'TileBasicHeatVent',
        TileBasicHeatVent,
        () => new TileBasicHeatVent(TileBasicComponentType.Basic),
        ['type']
    ),
    ClassSaver.basic(
        'TileBasicGenerator',
        TileBasicGenerator,
        () => new TileBasicGenerator(TileBasicGeneratorType.Uranium, 1),
        ['type', 'tier']
    ),
    ClassSaver.basic('TileDurability', TileDurability, () => new TileDurability(0, 0), [
        'durability',
        'maxDurability',
        'autoreplaceCost'
    ])
];

export function saveGameRaw(game: Game): any {
    return {
        saveDate: new Date(),
        resources: Object.fromEntries(
            game.world.resources
                .entries()
                .map(([resourceConstructor, resource]) => {
                    const SAVER = SAVERS.find((SAVER) => SAVER.constr == resourceConstructor);
                    if (!SAVER) return null;
                    return [SAVER.name, SAVER.save(resource as any)];
                })
                .filter(notNull)
                .toArray()
        ),
        entities: game.world.entities
            .values()
            .map((entity) => {
                const entries = entity
                    .values()
                    .map((component) => {
                        const SAVER = SAVERS.find((SAVER) => SAVER.constr == component.constructor);
                        if (!SAVER) return null;
                        return [SAVER.name, SAVER.save(component as any)];
                    })
                    .filter(notNull)
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
        const SAVER = SAVERS.find((SAVER) => SAVER.name == resourceName);
        if (!SAVER) {
            throw new Error(`Could not load resource "${resourceName}"`);
        }
        const loadedResource = SAVER.load(resource);
        game.world.setResource(loadedResource);
    }
    for (const entity of v.entities) {
        const loadedComponents = [];
        for (const [componentName, component] of Object.entries(entity) as [
            string,
            { [key: string]: any }
        ][]) {
            const SAVER = SAVERS.find((SAVER) => SAVER.name == componentName);
            if (!SAVER) {
                throw new Error(`Could not load component "${componentName}"`);
            }
            const loadedComponent = SAVER.load(component);
            loadedComponents.push(loadedComponent);
        }
        game.world.addEntity(loadedComponents);
    }
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
