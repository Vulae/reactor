export const VERYBIG: bigint = 10n ** 1_000n;

export function min(...vals: bigint[]): bigint {
    if (vals.length == 0) {
        throw new Error('BigInt cannot min empty list.');
    }
    let min = vals[0];
    for (let i = 1; i < vals.length; i++) {
        if (vals[i] < min) {
            min = vals[i];
        }
    }
    return min;
}

export function max(...vals: bigint[]): bigint {
    if (vals.length == 0) {
        throw new Error('BigInt cannot max empty list.');
    }
    let max = vals[0];
    for (let i = 1; i < vals.length; i++) {
        if (vals[i] > max) {
            max = vals[i];
        }
    }
    return max;
}

export function clamp(value: bigint, min: bigint, max: bigint): bigint {
    if (value < min) return min;
    if (value > max) return max;
    return value;
}

const BIGINT_PRECISION: bigint = 1_000_000n;
const BIGINT_PRECISION_N: number = Number(BIGINT_PRECISION);

export function multiplyFloat(bigint: bigint, float: number): bigint {
    return (bigint * BigInt(float * BIGINT_PRECISION_N)) / BIGINT_PRECISION;
}

export function percentage(value: bigint, max: bigint): number {
    return Number((value * BIGINT_PRECISION) / max) / BIGINT_PRECISION_N;
}

export function format(number: bigint): string {
    if (number < 1e6) {
        return new Intl.NumberFormat('en-us', {
            notation: 'standard'
        }).format(number);
    }
    if (number < 1e15) {
        return new Intl.NumberFormat('en-us', {
            notation: 'compact',
            minimumFractionDigits: 2
        }).format(number);
    }
    return new Intl.NumberFormat('en-us', {
        notation: 'scientific',
        minimumFractionDigits: 2
    }).format(number);
}
