/* eslint-disable @typescript-eslint/no-unsafe-function-type */

export interface Component {
    constructor: Function;
}

export type ComponentConstructor<T extends Component = Component> = new (...args: any[]) => T;

export type ComponentConstructorAsComponent<T extends ComponentConstructor> =
    T extends ComponentConstructor<infer O> ? O : never;

export type ComponentConstructorsAsComponents<T extends ComponentConstructor[]> = {
    [K in keyof T]: T[K] extends ComponentConstructor<infer O> ? O : never;
};

export type ComponentsAsComponentConstructors<T extends Component[]> = {
    [K in keyof T]: ComponentConstructor<T[K]>;
};

export class Entity<T extends Component[]> {
    public readonly world: World;
    public readonly id: number;
    public readonly components: T;
    public constructor(world: World, id: number, components: T) {
        this.world = world;
        this.id = id;
        this.components = components;
    }

    public clone(): Entity<T> {
        return new Entity(this.world, this.id, [...this.components]) as Entity<T>;
    }

    public destroy(): void {
        this.world.entities.delete(this.id);
    }

    public exists(): boolean {
        return this.world.entities.has(this.id);
    }

    public with<const A extends ComponentConstructor[]>(
        components: A,
        callbackfn?: (...components: ComponentConstructorsAsComponents<A>) => unknown
    ): Entity<ComponentConstructorsAsComponents<A>> | null {
        const entity = this.world.queryEntity(this.id, components);
        if (entity === null) {
            return null;
        }
        callbackfn?.(...entity.components);
        return entity;
    }

    public append<A extends Component[]>(_components: A): Entity<[...T, ...A]> {
        throw 'unimplemented';
    }

    public remove<A extends Component[]>(_components: ComponentsAsComponentConstructors<A>): void {
        throw 'unimplemented';
    }
}

export class Query<const T extends ComponentConstructor[]> {
    public readonly components: T;
    public constructor(components: T) {
        this.components = components;
    }

    public _with: Set<ComponentConstructor> = new Set();
    public with(components: ComponentConstructor[]): this {
        components.forEach((component) => {
            this._with.add(component);
        });
        return this;
    }

    public _filters: [ComponentConstructor[], (...components: Component[]) => boolean][] = [];
    public filter<const T extends Component[]>(
        components: ComponentsAsComponentConstructors<T>,
        callbackfn: (...components: T) => boolean
    ): this {
        // @ts-expect-error - oqwdjakldsn
        this._filters.push([components, callbackfn]);
        return this;
    }

    public join<const O extends ComponentConstructor[]>(other: Query<O>): Query<[...T, ...O]> {
        const query = new Query([...this.components, ...other.components]);
        query._with = this._with.union(other._with);
        query._filters = [...this._filters, ...other._filters];
        return query;
    }
}

type PartialQuery<T extends ComponentConstructor[] = ComponentConstructor[]> = Query<T> | T;

function extractComponent<const T extends ComponentConstructor[]>(
    constructors: T,
    entity: Map<ComponentConstructor, Component>
): ComponentConstructorsAsComponents<T> | null {
    const extracted = [];
    for (const constructor of constructors) {
        const components = entity.get(constructor);
        if (components === undefined) {
            return null;
        }
        extracted.push(components);
    }
    return extracted as ComponentConstructorsAsComponents<T>;
}

type SystemQuery = (PartialQuery | ComponentConstructor)[];

type SystemQueryCallbackFn<T extends SystemQuery> = (
    ...args: {
        [K in keyof T]: T[K] extends PartialQuery<infer T>
            ? Entity<ComponentConstructorsAsComponents<T>>[]
            : T[K] extends ComponentConstructor<infer T>
              ? T
              : never;
    }
) => unknown;

export class System<const T extends SystemQuery> {
    public readonly query: T;
    public readonly callbackfn: SystemQueryCallbackFn<T>;
    public constructor(query: T, callbackfn: SystemQueryCallbackFn<T>) {
        this.query = query;
        this.callbackfn = callbackfn;
    }
}

export class World<const Stages extends string = string> {
    public constructor(stages: {
        [key in Stages]: System<SystemQuery>[];
    }) {
        this.stages = stages;
        this.setResource(this);
    }

    public readonly allowResourceOverwrite: boolean = true;

    public readonly resources: Map<ComponentConstructor, Component> = new Map();

    public setResource<const T extends Component>(resource: T): T {
        const constructor = resource.constructor as ComponentConstructor;
        if (!this.allowResourceOverwrite && this.resources.get(constructor) !== undefined) {
            throw new Error(`ECS setResource resource "${constructor.name}" already exists`);
        }
        this.resources.set(constructor, resource);
        return resource;
    }

    public getResource<const T extends ComponentConstructor>(
        constructor: T
    ): ComponentConstructorAsComponent<T> {
        const resource = this.resources.get(constructor) as
            | ComponentConstructorAsComponent<T>
            | undefined;
        if (resource === undefined) {
            throw new Error(`ECS getResource resource "${constructor.name}" doesn't exist`);
        }
        return resource;
    }

    private entityIdCounter: number = 0;
    public readonly entities: Map<number, Map<ComponentConstructor, Component>> = new Map();

    public addEntity<const T extends Component[]>(components: T): Entity<T> {
        const id = this.entityIdCounter++;
        const componentsMap = new Map();
        for (const component of components) {
            componentsMap.set(component.constructor, component);
        }
        this.entities.set(id, componentsMap);
        return new Entity(this, id, components);
    }

    private queryEntityInner<const T extends ComponentConstructor[]>(
        id: number,
        entity: Map<ComponentConstructor, Component>,
        query: Query<T>
    ): Entity<ComponentConstructorsAsComponents<T>> | null {
        for (const componentConstructors of query._with) {
            if (!entity.has(componentConstructors)) {
                return null;
            }
        }
        for (const [componentConstructors, filter] of query._filters) {
            const components = extractComponent(componentConstructors, entity);
            if (components === null || !filter(...components)) {
                return null;
            }
        }
        const components = extractComponent(query.components, entity);
        if (components === null) {
            return null;
        }
        return new Entity(this, id, components);
    }

    public queryEntity<const T extends ComponentConstructor[]>(
        id: number,
        query: PartialQuery<T>
    ): Entity<ComponentConstructorsAsComponents<T>> | null {
        const entity = this.entities.get(id);
        if (entity === undefined) {
            return null;
        }
        if (!(query instanceof Query)) {
            query = new Query(query);
        }
        return this.queryEntityInner(id, entity, query);
    }

    public queryEntities<const T extends ComponentConstructor[]>(
        query: PartialQuery<T>
    ): Entity<ComponentConstructorsAsComponents<T>>[] {
        if (!(query instanceof Query)) {
            query = new Query(query);
        }
        return this.entities
            .entries()
            .map(([id, entity]) => this.queryEntityInner(id, entity, query))
            .filter((v) => v !== null)
            .toArray();
    }

    private readonly stages: {
        [key in Stages]: System<SystemQuery>[];
    };

    public runStage(name: Stages): void {
        const stage = this.stages[name];
        if (stage === undefined) {
            throw new Error(`ECS stage with name "${name}" doesn't exist`);
        }
        for (const system of stage) {
            const args = [];
            for (const arg of system.query) {
                if (Array.isArray(arg) || arg instanceof Query) {
                    args.push(this.queryEntities(arg));
                } else {
                    args.push(this.getResource(arg));
                }
            }
            // @ts-expect-error - askjdabjdka
            system.callbackfn(...args);
        }
    }

    public diagnosticInfo(): { numEntities: number; numComponents: number } {
        return {
            numEntities: this.entities.size,
            numComponents: this.entities.values().reduce((count, entity) => count + entity.size, 0)
        };
    }
}
