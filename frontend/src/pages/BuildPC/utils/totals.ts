import type { SelectedParts, PriceTotals, SelectedQuantities } from '../types';

export const computeTotals = (
    selected: SelectedParts,
    quantities: SelectedQuantities = {} as SelectedQuantities,
    taxRate = 0.1
): PriceTotals => {
    const subtotal = (Object.keys(selected) as Array<keyof SelectedParts>).reduce((sum, k) => {
        const p = selected[k];
        const q = (quantities && quantities[k]) ? Math.max(1, quantities[k]) : 1;
        return sum + ((p?.price ?? 0) * q);
    }, 0);
    const taxable = Math.max(subtotal, 0);
    const tax = Math.round(taxable * taxRate);
    const total = Math.max(taxable + tax, 0);
    return { subtotal, tax, total };
};
