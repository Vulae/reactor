import {
    ComponentStore,
    type ComponentConstructor,
    type ComponentConstructorsAsComponents,
    type ComponentStoreOpts
} from './componentStore';
import type { Entity } from './entity';
import { Query, type PartialQuery } from './query';
import { ResourceStore, type ResourceStoreOpts } from './resourceStore';

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

export type WorldOpts = {
    /**
     * Should have enabled for development
     */
    readonly safetyChecks?: boolean;
} & ResourceStoreOpts &
    ComponentStoreOpts;

export class World<const Stages extends string = string> {
    public readonly resources: ResourceStore;
    public readonly components: ComponentStore;
    private readonly stages: {
        [_ in Stages]: System<SystemQuery>[];
    };

    public constructor(
        opts: WorldOpts = {},
        stages: {
            [_ in Stages]: System<SystemQuery>[];
        }
    ) {
        this.resources = new ResourceStore(this, opts);
        this.resources.set(this);
        this.components = new ComponentStore(this, opts);
        this.stages = stages;
    }

    public runSystem(system: System<SystemQuery>): void {
        const args = system.query.map((arg) => {
            if (Array.isArray(arg) || arg instanceof Query) {
                return this.components.entities(arg);
            } else {
                return this.resources.get(arg);
            }
        });
        // @ts-expect-error - askjdabjdka
        system.callbackfn(...args);
    }

    public runStage(name: Stages): void {
        const stage = this.stages[name];
        if (stage === undefined) {
            throw new Error(`World stage with name "${name}" doesn't exist`);
        }
        for (const system of stage) {
            this.runSystem(system);
        }
    }
}
