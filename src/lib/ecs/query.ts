import type { Constructor, Instance, InstancesFrom } from './util';

export class Query<const T extends Constructor[]> {
    public readonly components: T;
    public constructor(components: T) {
        this.components = components;
    }

    public static upgrade<const T extends Constructor[]>(partial: PartialQuery<T>): Query<T> {
        if (!(partial instanceof Query)) {
            return new Query(partial);
        } else {
            return partial;
        }
    }

    public _with: Set<Constructor> = new Set();
    /**
     * Add extra required components
     */
    public with(components: Constructor[]): this {
        components.forEach((component) => {
            this._with.add(component);
        });
        return this;
    }

    public _filters: [Constructor[], (...components: Instance[]) => boolean][] = [];
    /**
     * Add a filter
     */
    public filter<T extends Constructor[]>(
        components: T,
        callbackfn: (...components: InstancesFrom<T>) => boolean
    ): this {
        this._filters.push([components, callbackfn as (...components: Instance[]) => boolean]);
        return this;
    }

    /**
     * Merge with other query
     */
    public join<O extends Constructor[]>(other: PartialQuery<O>): Query<[...T, ...O]> {
        other = Query.upgrade(other);
        const query = new Query([...this.components, ...other.components]);
        query._with = this._with.union(other._with);
        query._filters = [...this._filters, ...other._filters];
        return query;
    }
}

export type PartialQuery<T extends Constructor[] = Constructor[]> = Query<T> | T;
