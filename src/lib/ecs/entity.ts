import type {
    Component,
    ComponentConstructor,
    ComponentConstructorsAsComponents
} from './componentStore';
import type { PartialQuery } from './query';
import { throwConstructedsInvalid } from './util';
import type { World } from './world';

export class Entity<const T extends Component[]> {
    public readonly world: World;
    public readonly id: number;
    public readonly components: T;
    public constructor(world: World, id: number, components: T) {
        this.world = world;
        this.id = id;
        this.components = components;
    }

    public exists(): boolean {
        return this.world.components.exists(this.id);
    }

    public destroy(): void {
        this.world.components.delete(this.id);
    }

    /**
     * Requeries this entity
     * @param callbackfn If query is successful, callbackfn gets called with new components as rest
     * @returns Entity with new components
     */
    public with<const A extends ComponentConstructor[]>(
        query: PartialQuery<A>,
        callbackfn?: (...components: ComponentConstructorsAsComponents<A>) => unknown
    ): Entity<ComponentConstructorsAsComponents<A>> | null {
        return this.world.components.entity(this.id, query, callbackfn);
    }

    /**
     * Appends new components to this entity
     */
    public append<const A extends Component[]>(components: A): Entity<[...T, ...A]> {
        const requeried = this.world.components.append(this.id, components);
        if (this.world.components.safetyChecks) {
            throwConstructedsInvalid([...this.components, ...requeried.components]);
        }
        return new Entity(this.world, this.id, [...this.components, ...requeried.components]);
    }

    /**
     * Remove components from this entity
     */
    public remove<const A extends ComponentConstructor[]>(components: A): void {
        this.world.components.remove(this.id, components);
    }
}
