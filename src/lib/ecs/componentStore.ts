import { Entity } from './entity';
import { Query, type PartialQuery } from './query';
import { throwConstructedsInvalid, throwConstructorInvalid } from './util';
import type { World } from './world';

export interface Component {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
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

class Ids {
    private readonly ids: Set<number> = new Set();

    public new(): number {
        let id = 1;
        while (this.ids.has(id)) id++;
        this.ids.add(id);
        return id;
    }

    public remove(id: number): void {
        if (!this.ids.has(id)) {
            throw new Error(`Could not remove id that doesn't exist`);
        }
        this.ids.delete(id);
    }

    public exists(id: number): boolean {
        return this.ids.has(id);
    }

    public iter(): SetIterator<number> {
        return this.ids.keys();
    }
}

export type ComponentStoreOpts = {
    readonly safetyChecks?: boolean;
    // /**
    //  * Add component extended class to components
    //  * ```TypeScript
    //  * class AABB {
    //  *     // ...
    //  * }
    //  * class RigidBody extends AABB {
    //  *     // ...
    //  * }
    //  *
    //  * world.addEntity([new RigidBody()]);
    //  *
    //  * // You can query class prototypes.
    //  * world.queryEntities([AABB]);
    //  * ```
    //  */
    // readonly entityAddComponentPrototypes?: boolean;
    /** Allow appending components to an entity to overwrite matching components */
    readonly entityComponentAppendAllowOverwrite?: boolean;
    /** If when removing a component, it must be required to exist before removing it */
    readonly entityComponentRemoveRequired?: boolean;
    /** Allow entities with no components */
    readonly entityWithZeroComponentsAllowed?: boolean;
};

export class ComponentStore {
    public readonly safetyChecks: boolean;
    // public readonly entityAddComponentPrototypes: boolean;
    public readonly entityComponentAppendAllowOverwrite: boolean;
    public readonly entityComponentRemoveRequired: boolean;
    public readonly entityWithZeroComponentsAllowed: boolean;

    public readonly world: World;

    public constructor(world: World, opts: ComponentStoreOpts = {}) {
        this.safetyChecks = opts.safetyChecks ?? true;
        // this.entityAddComponentPrototypes = opts.entityAddComponentPrototypes ?? false;
        this.entityComponentAppendAllowOverwrite = opts.entityComponentAppendAllowOverwrite ?? true;
        this.entityComponentRemoveRequired = opts.entityComponentRemoveRequired ?? false;
        this.entityWithZeroComponentsAllowed = opts.entityWithZeroComponentsAllowed ?? false;

        this.world = world;
    }

    private readonly ids: Ids = new Ids();

    private readonly components: Map<ComponentConstructor, Map<number, Component>> = new Map();
    private getComponentsMap<T extends ComponentConstructor>(
        constructor: T
    ): Map<number, ComponentConstructorAsComponent<T>> {
        return this.components.getOrInsertComputed(constructor, () => new Map()) as Map<
            number,
            ComponentConstructorAsComponent<T>
        >;
    }

    /**
     * Add components to a entity
     */
    public append<const T extends Component[]>(id: number, components: T): Entity<T> {
        if (this.safetyChecks) {
            throwConstructedsInvalid(components);
        }
        if (!this.ids.exists(id)) {
            throw new Error(`Entity with id ${id} doesn't exist`);
        }
        for (const component of components) {
            const map = this.getComponentsMap(component.constructor as ComponentConstructor);
            if (!this.entityComponentAppendAllowOverwrite && map.has(id)) {
                throw new Error(`Entity already has component "${component.constructor.name}"`);
            }
            map.set(id, component);
        }
        return new Entity(this.world, id, components);
    }

    /**
     * Remove components from a entity
     */
    public remove<const T extends ComponentConstructor[]>(id: number, components: T): void {
        if (this.safetyChecks) {
            for (const constructor of components) {
                throwConstructorInvalid(constructor);
            }
        }
        if (!this.ids.exists(id)) {
            throw new Error(`Entity with id ${id} doesn't exist`);
        }
        for (const component of components) {
            const map = this.getComponentsMap(component);
            if (this.entityComponentRemoveRequired && !map.has(id)) {
                throw new Error(
                    `Cannot remove component "${component.name}" from an entity that doesnt have "${component.name}"`
                );
            }
            map.delete(id);
        }
        if (!this.entityWithZeroComponentsAllowed && this.rawEntity(id).length == 0) {
            throw new Error(`Entity ${id} has no components`);
        }
    }

    /**
     * Create a new entity
     */
    public add<const T extends Component[]>(components: T): Entity<T> {
        if (this.safetyChecks) {
            throwConstructedsInvalid(components);
        }
        if (!this.entityWithZeroComponentsAllowed && components.length == 0) {
            throw new Error('Cannot add entity with no components');
        }
        const id = this.ids.new();
        return this.append(id, components);
    }

    /**
     * Delete a entity
     */
    public delete(id: number): void {
        this.ids.remove(id);
        for (const [_, map] of this.components) {
            map.delete(id);
        }
    }

    /**
     * Check if a entity exists
     */
    public exists(id: number): boolean {
        return this.ids.exists(id);
    }

    private entityExtract<const T extends ComponentConstructor[]>(
        id: number,
        constructors: T
    ): ComponentConstructorsAsComponents<T> | null {
        const components: Component[] = [];
        for (const constructor of constructors) {
            const map = this.getComponentsMap(constructor);
            const component = map.get(id);
            if (component === undefined) {
                return null;
            }
            components.push(component);
        }
        return components as ComponentConstructorsAsComponents<T>;
    }

    private entityInner<const T extends ComponentConstructor[]>(
        id: number,
        query: Query<T>
    ): Entity<ComponentConstructorsAsComponents<T>> | null {
        for (const constructor of query._with) {
            if (!this.getComponentsMap(constructor).has(id)) {
                return null;
            }
        }

        for (const [constructors, callbackfn] of query._filters) {
            const components = this.entityExtract(id, constructors);
            if (components === null) {
                return null;
            }
            if (!callbackfn(...components)) {
                return null;
            }
        }

        const components = this.entityExtract(id, query.components);
        if (components === null) {
            return null;
        }
        return new Entity(this.world, id, components);
    }

    /**
     * Query specific entity
     * @param callbackfn If query is successful, callbackfn gets called with new components as rest
     * @returns Entity with components
     */
    public entity<const T extends ComponentConstructor[]>(
        id: number,
        query: PartialQuery<T>,
        callbackfn?: (...components: ComponentConstructorsAsComponents<T>) => unknown
    ): Entity<ComponentConstructorsAsComponents<T>> | null {
        if (!this.ids.exists(id)) {
            throw new Error(`Entity with id ${id} doesn't exist`);
        }
        const entity = this.entityInner(id, Query.upgrade(query));
        if (entity) {
            callbackfn?.(...entity.components);
        }
        return entity;
    }

    /**
     * Query all entities
     * @param callbackfn callbackfn gets called for every successfully queried entity with arguments as rest components
     * @returns Entities with components
     */
    public entities<const T extends ComponentConstructor[]>(
        query: PartialQuery<T>,
        callbackfn?: (...components: ComponentConstructorsAsComponents<T>) => unknown
    ): Entity<ComponentConstructorsAsComponents<T>>[] {
        const upgradedQuery = Query.upgrade(query);
        const entities = [];
        for (const id of this.ids.iter()) {
            const entity = this.entityInner(id, upgradedQuery);
            if (entity !== null) {
                callbackfn?.(...entity.components);
                entities.push(entity);
            }
        }
        return entities;
    }

    public iterIds(): IteratorObject<number> {
        return this.ids.iter();
    }

    /**
     * Get raw entity
     */
    public rawEntity(id: number): Component[] {
        const components: Component[] = [];
        this.components.forEach((map) => {
            const component = map.get(id);
            if (component !== undefined) {
                components.push(component);
            }
        });
        return components;
    }

    /**
     * Iterate through all raw entities
     */
    public iterRawEntities(): IteratorObject<Component[]> {
        return this.ids.iter().map((id) => this.rawEntity(id));
    }

    public __DEBUG_INFO(): {
        numEntities: number;
        numComponents: number;
    } {
        let numEntities = 0;
        let numComponents = 0;

        this.ids.iter().forEach((id) => {
            numEntities++;
            this.components.forEach((map) => {
                if (map.has(id)) {
                    numComponents++;
                }
            });
        });

        return {
            numEntities,
            numComponents
        };
    }
}
