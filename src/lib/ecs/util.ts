// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Constructor = new (...args: any[]) => any;

export interface Instance {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    constructor: Function;
}

export type ConstructorFrom<T extends Instance> = T extends { constructor: infer J } ? J : never;

export type InstanceFrom<T extends Constructor> =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    T extends new (...args: any[]) => infer J ? J : never;

export type InstancesFrom<T extends Constructor[]> = {
    [K in keyof T]: InstanceFrom<T[K]>;
};

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
const INVALID_CONSTRUCTORS: Function[] = [
    Boolean,
    Number,
    String,
    BigInt,
    Array,
    Object,
    Symbol,
    Function
];

/** @internal */
export function throwConstructorInvalid(constructor: Constructor): void {
    if (typeof constructor !== 'function') {
        throw new Error(`Constructor expected to be function, got ${typeof constructor}.`);
    }
    if (INVALID_CONSTRUCTORS.some((DISALLOW_CONSTRUCTOR) => constructor == DISALLOW_CONSTRUCTOR)) {
        throw new Error(
            `Constructor disallowed "${constructor.name}", you may create a wrapper for it instead.`
        );
    }
}

/** @internal */
export function throwInstanceInvalid(instance: Instance): void {
    if (typeof instance !== 'object') {
        throw new Error(`Instance value must be object, got ${typeof instance}.`);
    }
    if (instance === null) {
        throw new Error(`Instance value must not be null.`);
    }
    if (typeof instance['constructor'] !== 'function') {
        throw new Error(`Instance value must have a constructor`);
    }
    throwConstructorInvalid(instance.constructor as Constructor);
}

/** @internal */
export function throwConstructorsInvalid(constructors: Constructor[]): void {
    for (const constructor of constructors) {
        throwConstructorInvalid(constructor);
    }
    for (let i = 0; i < constructors.length; i++) {
        for (let j = 0; j < constructors.length; j++) {
            if (i === j) continue;
            if (constructors[i] === constructors[j]) {
                throw new Error(
                    `Constructors cannot have 2 of the same type "${constructors[i].name}"`
                );
            }
        }
    }
}

/** @internal */
export function throwInstancesInvalid(instances: Instance[]): void {
    for (const constructed of instances) {
        throwInstanceInvalid(constructed);
    }
    throwConstructorsInvalid(instances.map((instance) => instance.constructor as Constructor));
}
