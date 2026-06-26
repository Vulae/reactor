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

export function throwConstructorInvalid(constructor: any): void {
    if (typeof constructor !== 'function') {
        throw new Error(`Constructor expected to be function, got ${typeof constructor}.`);
    }
    if (INVALID_CONSTRUCTORS.some((DISALLOW_CONSTRUCTOR) => constructor == DISALLOW_CONSTRUCTOR)) {
        throw new Error(
            `Constructor disallowed "${constructor.name}", you may create a wrapper for it instead.`
        );
    }
}

export function throwConstructedInvalid(constructed: any): void {
    if (typeof constructed !== 'object') {
        throw new Error(`Constructed value must be object, got ${typeof constructed}.`);
    }
    if (constructed === null) {
        throw new Error(`Constructed value must not be null.`);
    }
    if (typeof constructed['constructor'] !== 'function') {
        throw new Error(`Constructed value must have a constructor`);
    }
    const constructor = constructed['constructor'];
    throwConstructorInvalid(constructor);
}

export function throwConstructorsInvalid(constructors: any[]): void {
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

export function throwConstructedsInvalid(constructeds: any[]): void {
    for (const constructed of constructeds) {
        throwConstructedInvalid(constructed);
    }
    throwConstructorsInvalid(constructeds.map((constructed) => constructed['constructor']));
}
