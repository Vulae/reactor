import {
    throwInstanceInvalid,
    throwConstructorInvalid,
    type Constructor,
    type Instance,
    type InstanceFrom
} from './util';
import { type World } from './world';

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

    public readonly resources: Map<Constructor, Instance> = new Map();

    public set<const T extends Instance>(resource: T): T {
        if (this.safetyChecks) {
            throwInstanceInvalid(resource);
        }
        const constructor = resource.constructor as Constructor;
        if (!this.resourceAllowOverwrite && this.resources.get(constructor) !== undefined) {
            throw new Error(`Resource "${constructor.name}" already exists`);
        }
        this.resources.set(constructor, resource);
        return resource;
    }

    public get<const T extends Constructor>(constructor: T): InstanceFrom<T> {
        if (this.safetyChecks) {
            throwConstructorInvalid(constructor);
        }
        const resource = this.resources.get(constructor) as InstanceFrom<T> | undefined;
        if (resource === undefined) {
            throw new Error(`Resource "${constructor.name}" doesn't exist`);
        }
        return resource;
    }

    public iter(): IteratorObject<Instance> {
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
