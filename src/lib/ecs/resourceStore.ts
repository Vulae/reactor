import { throwConstructedInvalid, throwConstructorInvalid } from './util';
import { type World } from './world';

export interface Resource {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    constructor: Function;
}

export type ResourceConstructor<T extends Resource = Resource> = new (...args: any[]) => T;

export type ResourceConstructorAsResource<T extends ResourceConstructor> =
    T extends ResourceConstructor<infer O> ? O : never;

export type ResourceStoreOpts = {
    readonly safetyChecks?: boolean;
    readonly resourceAllowOverwrite?: boolean;
};

export class ResourceStore {
    public readonly safetyChecks: boolean;
    public readonly resourceAllowOverwrite: boolean;

    public readonly world: World;

    public constructor(world: World, opts: ResourceStoreOpts = {}) {
        this.safetyChecks = opts.safetyChecks ?? true;
        this.resourceAllowOverwrite = opts.resourceAllowOverwrite ?? true;

        this.world = world;
    }

    public readonly resources: Map<ResourceConstructor, Resource> = new Map();

    public set<const T extends Resource>(resource: T): T {
        if (this.safetyChecks) {
            throwConstructedInvalid(resource);
        }
        const constructor = resource.constructor as ResourceConstructor;
        if (!this.resourceAllowOverwrite && this.resources.get(constructor) !== undefined) {
            throw new Error(`Resource "${constructor.name}" already exists`);
        }
        this.resources.set(constructor, resource);
        return resource;
    }

    public get<const T extends ResourceConstructor>(
        constructor: T
    ): ResourceConstructorAsResource<T> {
        if (this.safetyChecks) {
            throwConstructorInvalid(constructor);
        }
        const resource = this.resources.get(constructor) as
            | ResourceConstructorAsResource<T>
            | undefined;
        if (resource === undefined) {
            throw new Error(`Resource "${constructor.name}" doesn't exist`);
        }
        return resource;
    }

    public iter(): IteratorObject<Resource> {
        return this.resources.values();
    }

    public __DEBUG_INFO(): {
        numResources: number;
    } {
        return {
            numResources: this.resources.size
        };
    }
}
