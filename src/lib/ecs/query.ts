import type {
    Component,
    ComponentConstructor,
    ComponentConstructorsAsComponents
} from './componentStore';

export class Query<const T extends ComponentConstructor[]> {
    public readonly components: T;
    public constructor(components: T) {
        this.components = components;
    }

    public static upgrade<const T extends ComponentConstructor[]>(
        partial: PartialQuery<T>
    ): Query<T> {
        if (!(partial instanceof Query)) {
            return new Query(partial);
        } else {
            return partial;
        }
    }

    public _with: Set<ComponentConstructor> = new Set();
    /**
     * Add extra required components
     */
    public with(components: ComponentConstructor[]): this {
        components.forEach((component) => {
            this._with.add(component);
        });
        return this;
    }

    public _filters: [ComponentConstructor[], (...components: Component[]) => boolean][] = [];
    /**
     * Add a filter
     */
    public filter<T extends ComponentConstructor[]>(
        components: T,
        callbackfn: (...components: ComponentConstructorsAsComponents<T>) => boolean
    ): this {
        this._filters.push([components, callbackfn as (...components: Component[]) => boolean]);
        return this;
    }

    /**
     * Merge with other query
     */
    public join<O extends ComponentConstructor[]>(other: PartialQuery<O>): Query<[...T, ...O]> {
        other = Query.upgrade(other);
        const query = new Query([...this.components, ...other.components]);
        query._with = this._with.union(other._with);
        query._filters = [...this._filters, ...other._filters];
        return query;
    }
}

export type PartialQuery<T extends ComponentConstructor[] = ComponentConstructor[]> = Query<T> | T;
