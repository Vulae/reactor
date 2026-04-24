export function formatMoney(number: number): string {
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
    if (number == Infinity) {
        return 'Infinity';
    }
    return new Intl.NumberFormat('en-us', {
        notation: 'scientific',
        minimumFractionDigits: 2
    }).format(number);
}
