// MIT No Attribution
//
// Copyright 2026 Vulae
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of this
// software and associated documentation files (the "Software"), to deal in the Software
// without restriction, including without limitation the rights to use, copy, modify,
// merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
// permit persons to whom the Software is furnished to do so.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
// INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
// PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
// HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
// OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
// SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

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

const SAFETY_DISALLOWED_CONSTRUCTORS: Function[] = [
    Boolean,
    Number,
    String,
    BigInt,
    Array,
    Object,
    Symbol,
    Function
    // TODO: Figure out how to do generator functions.
];

function safetyCheckComponentConstructors(
    constructors: ComponentConstructor[],
    allowEmpty: boolean
): void {
    if (!allowEmpty && constructors.length == 0) {
        throw new Error(`Components array cannot be empty.`);
    }
    for (const i in constructors) {
        for (const j in constructors) {
            if (i == j) continue;
            if (constructors[i] == constructors[j]) {
                throw new Error(
                    `Components array cannot have 2 of the same component type "${constructors[i].name}"`
                );
            }
        }
    }
    for (const constructor of constructors) {
        if (constructor === undefined || constructor === null) {
            throw new Error(`Component cannot be "${constructor}"`);
        }
        if (
            SAFETY_DISALLOWED_CONSTRUCTORS.some(
                (DISALLOWED_CONSTRUCTOR) => constructor == DISALLOWED_CONSTRUCTOR
            )
        ) {
            throw new Error(
                `Disallowed component "${constructor.name}", create a wrapper for it instead`
            );
        }
    }
}

function safetyCheckComponents(components: Component[], allowEmpty: boolean): void {
    safetyCheckComponentConstructors(
        components.map((component) => component.constructor as ComponentConstructor),
        allowEmpty
    );
}

export class Entity<const T extends Component[]> {
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
        if (this.world.safetyChecks) {
            safetyCheckComponentConstructors(components, true);
        }
        const entity = this.world.queryEntity(this.id, components);
        if (entity === null) {
            return null;
        }
        callbackfn?.(...entity.components);
        return entity;
    }

    public append<const A extends Component[]>(components: A): Entity<[...T, ...A]> {
        if (this.world.safetyChecks) {
            safetyCheckComponents(components, true);
        }
        const entity = this.world.entities.get(this.id);
        if (entity === undefined) {
            throw new Error("Entity doesn't exist");
        }
        if (!this.world.entityComponentAppendAllowOverwrite) {
            for (const component of components) {
                if (entity.has(component.constructor as ComponentConstructor)) {
                    throw new Error(
                        `Cannot append component "${component.constructor.name}" to entity because it already has that component`
                    );
                }
            }
        }
        for (const component of components) {
            if (!this.world.entityAddComponentPrototypes) {
                entity.set(component.constructor as ComponentConstructor, component);
            } else {
                let constructor = component.constructor as ComponentConstructor;
                while (constructor.name != '') {
                    entity.set(constructor, component);
                    constructor = Object.getPrototypeOf(constructor);
                }
            }
        }
        return new Entity(this.world, this.id, [...this.components, ...components]);
    }

    public remove<const A extends ComponentConstructor[]>(components: A): void {
        const entity = this.world.entities.get(this.id);
        if (entity === undefined) {
            throw new Error("Entity doesn't exist");
        }
        if (this.world.entityComponentRemoveRequired) {
            for (const component of components) {
                if (!entity.has(component as ComponentConstructor)) {
                    throw new Error(
                        `Cannot remove component "${component.name}" to entity because it doesn't already have that component`
                    );
                }
            }
        }
        for (const component of components) {
            entity.delete(component);
        }
        if (!this.world.entityWithZeroComponentsAllowed && entity.size == 0) {
            this.destroy();
        }
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

    public validate(): void {
        safetyCheckComponentConstructors(this.components, true);
        safetyCheckComponentConstructors(Array.from(this._with), true);
        this._filters.forEach(([components, _]) => {
            safetyCheckComponentConstructors(components, true);
        });
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
    public readonly safetyChecks: boolean;
    public readonly resourceAllowOverwrite: boolean;
    public readonly entityAddComponentPrototypes: boolean;
    public readonly entityComponentAppendAllowOverwrite: boolean;
    public readonly entityComponentRemoveRequired: boolean;
    public readonly entityWithZeroComponentsAllowed: boolean;

    public constructor(
        opts: {
            safetyChecks?: boolean;
            resourceAllowOverwrite?: boolean;
            /**
             * Add component extended class to components.
             * ```TypeScript
             * class AABB {
             *     // ...
             * }
             * class RigidBody extends AABB {
             *     // ...
             * }
             *
             * world.addEntity([new RigidBody()]);
             *
             * // You can query class prototypes.
             * world.queryEntities([AABB]);
             * ```
             */
            // TODO: Add safety checks!
            entityAddComponentPrototypes?: boolean;
            /** Allow appending components to an entity to overwrite matching components. */
            entityComponentAppendAllowOverwrite?: boolean;
            /** If when removing a component, it must be required to exist before removing it. */
            entityComponentRemoveRequired?: boolean;
            /** Allow entities with no components. */
            entityWithZeroComponentsAllowed?: boolean;
        } = {},
        stages: {
            [key in Stages]: System<SystemQuery>[];
        }
    ) {
        this.safetyChecks = opts.safetyChecks ?? true;
        this.resourceAllowOverwrite = opts.resourceAllowOverwrite ?? true;
        this.entityAddComponentPrototypes = opts.entityAddComponentPrototypes ?? false;
        this.entityComponentAppendAllowOverwrite = opts.entityComponentAppendAllowOverwrite ?? true;
        this.entityComponentRemoveRequired = opts.entityComponentRemoveRequired ?? false;
        this.entityWithZeroComponentsAllowed = opts.entityWithZeroComponentsAllowed ?? true;

        this.stages = stages;

        this.setResource(this);
    }

    public readonly resources: Map<ComponentConstructor, Component> = new Map();

    public setResource<const T extends Component>(resource: T): T {
        const constructor = resource.constructor as ComponentConstructor;
        if (!this.resourceAllowOverwrite && this.resources.get(constructor) !== undefined) {
            throw new Error(`World setResource resource "${constructor.name}" already exists`);
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
            throw new Error(`World getResource resource "${constructor.name}" doesn't exist`);
        }
        return resource;
    }

    private entityIdCounter: number = 0;
    public readonly entities: Map<number, Map<ComponentConstructor, Component>> = new Map();

    public addEntity<const T extends Component[]>(components: T): Entity<T> {
        if (this.safetyChecks) {
            safetyCheckComponents(components, this.entityWithZeroComponentsAllowed);
        }
        const id = this.entityIdCounter++;
        const entity: Map<ComponentConstructor, Component> = new Map();
        for (const component of components) {
            if (!this.entityAddComponentPrototypes) {
                entity.set(component.constructor as ComponentConstructor, component);
            } else {
                let constructor = component.constructor as ComponentConstructor;
                while (constructor.name != '') {
                    entity.set(constructor, component);
                    constructor = Object.getPrototypeOf(constructor);
                }
            }
        }
        this.entities.set(id, entity);
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
        if (this.safetyChecks) {
            query.validate();
        }
        return this.queryEntityInner(id, entity, query);
    }

    public queryEntities<const T extends ComponentConstructor[]>(
        query: PartialQuery<T>
    ): Entity<ComponentConstructorsAsComponents<T>>[] {
        if (!(query instanceof Query)) {
            query = new Query(query);
        }
        if (this.safetyChecks) {
            query.validate();
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
            throw new Error(`World stage with name "${name}" doesn't exist`);
        }
        for (const system of stage) {
            const args = system.query.map((arg) => {
                if (Array.isArray(arg) || arg instanceof Query) {
                    return this.queryEntities(arg);
                } else {
                    return this.getResource(arg);
                }
            });
            // @ts-expect-error - askjdabjdka
            system.callbackfn(...args);
        }
    }
}
