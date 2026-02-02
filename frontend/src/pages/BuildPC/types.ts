import type { Product } from '../../types/product.types';

export type PartKey =
    | 'cpu'
    | 'mainboard'
    | 'ram1'
    | 'drive1'
    | 'drive2'
    | 'drive3'
    | 'gpu'
    | 'psu'
    | 'case'
    | 'cpu_cooler'
    | 'case_fan1'
    | 'case_fan2'
    | 'monitor'
    | 'keyboard'
    | 'mouse';

export type SelectedParts = Record<PartKey, Product | null>;
export type SelectedQuantities = Record<PartKey, number>;

export interface PriceTotals {
    subtotal: number;
    tax: number;
    total: number;
}

export type IssueSeverity = 'info' | 'warning' | 'error';

export interface CompatibilityIssue {
    code: string;
    message: string;
    severity: IssueSeverity;
    related: PartKey[];
}

export interface PCBuildState {
    selectedParts: SelectedParts;
    totals: PriceTotals;
}

export const EMPTY_SELECTED: SelectedParts = {
    cpu: null,
    mainboard: null,
    ram1: null,
    drive1: null,
    drive2: null,
    drive3: null,
    gpu: null,
    psu: null,
    case: null,
    cpu_cooler: null,
    case_fan1: null,
    case_fan2: null,
    monitor: null,
    keyboard: null,
    mouse: null,
};

export const EMPTY_QUANTITIES: SelectedQuantities = {
    cpu: 1,
    mainboard: 1,
    ram1: 1,
    drive1: 1,
    drive2: 1,
    drive3: 1,
    gpu: 1,
    psu: 1,
    case: 1,
    cpu_cooler: 1,
    case_fan1: 1,
    case_fan2: 1,
    monitor: 1,
    keyboard: 1,
    mouse: 1,
};
