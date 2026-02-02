import { useMemo, useCallback, useState } from 'react';
// Lightweight UUID v4 generator to avoid external deps
const uuidv4 = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
});
import type { SelectedParts, SelectedQuantities } from '../types';
import { EMPTY_SELECTED, EMPTY_QUANTITIES } from '../types';
import type { Product } from '../../../types/product.types';
import { computeTotals } from '../utils/totals';

type BuildConfig = {
    id: string;
    name: string;
    selectedParts: SelectedParts;
    quantities: SelectedQuantities;
};

type MultiState = {
    configs: BuildConfig[];
    activeId: string;
};

const LS_MULTI_KEY = 'pc_builder_multi_v1';
const LS_SINGLE_KEY = 'pc_builder_state_v1';

const createDefaultConfigs = (count = 3): BuildConfig[] => {
    return Array.from({ length: count }).map((_, i) => ({
        id: uuidv4(),
        name: `Cấu hình ${i + 1}`,
        selectedParts: { ...EMPTY_SELECTED },
        quantities: { ...EMPTY_QUANTITIES },
    }));
};

type LooseSelected = Partial<Record<string, Product | null>>;
type LooseQuantities = Partial<Record<string, number>>;

const normalizeSelectedParts = (input?: LooseSelected): SelectedParts => {
    const next: SelectedParts = { ...EMPTY_SELECTED };
    if (!input) return next;
    Object.entries(input).forEach(([key, value]) => {
        if (key === 'cooler_air' || key === 'cooler_water') {
            if (!next.cpu_cooler && value) {
                next.cpu_cooler = value as Product | null;
            }
            return;
        }
        const typedKey = key as keyof SelectedParts;
        if (Object.prototype.hasOwnProperty.call(next, typedKey)) {
            next[typedKey] = value as Product | null;
        }
    });
    return next;
};

const normalizeQuantities = (input?: LooseQuantities): SelectedQuantities => {
    const next: SelectedQuantities = { ...EMPTY_QUANTITIES };
    if (!input) return next;
    Object.entries(input).forEach(([key, value]) => {
        const numeric = typeof value === 'number' ? value : Number(value);
        if (Number.isNaN(numeric) || numeric <= 0) return;
        if (key === 'cooler_air' || key === 'cooler_water') {
            next.cpu_cooler = Math.max(1, Math.floor(numeric));
            return;
        }
        const typedKey = key as keyof SelectedQuantities;
        if (Object.prototype.hasOwnProperty.call(next, typedKey)) {
            next[typedKey] = Math.max(1, Math.floor(numeric));
        }
    });
    return next;
};

const normalizeConfig = (cfg: BuildConfig | (BuildConfig & { selectedParts?: LooseSelected; quantities?: LooseQuantities; })) => {
    return {
        id: cfg.id || uuidv4(),
        name: cfg.name || 'Cấu hình',
        selectedParts: normalizeSelectedParts(cfg.selectedParts as LooseSelected),
        quantities: normalizeQuantities(cfg.quantities as LooseQuantities),
    } as BuildConfig;
};

export const usePcBuilderMultiState = () => {
    // Initialize from localStorage with migration from single-state if present
    const [state, setState] = useState<MultiState>(() => {
        try {
            const raw = localStorage.getItem(LS_MULTI_KEY);
            if (raw) {
                const parsed = JSON.parse(raw) as MultiState & { configs?: any[] };
                if (parsed?.configs?.length) {
                    const normalizedConfigs = parsed.configs.map(cfg => normalizeConfig(cfg));
                    const activeId = normalizedConfigs.some(c => c.id === parsed.activeId)
                        ? parsed.activeId
                        : normalizedConfigs[0].id;
                    const sanitized = { configs: normalizedConfigs, activeId } as MultiState;
                    localStorage.setItem(LS_MULTI_KEY, JSON.stringify(sanitized));
                    return sanitized;
                }
            }
            // Migrate from single-state
            const single = localStorage.getItem(LS_SINGLE_KEY);
            if (single) {
                try {
                    const selected = JSON.parse(single) as SelectedParts;
                    const cfg: BuildConfig = {
                        id: uuidv4(),
                        name: 'Cấu hình 1',
                        selectedParts: normalizeSelectedParts(selected as LooseSelected),
                        quantities: { ...EMPTY_QUANTITIES },
                    };
                    const migrated: MultiState = { configs: [cfg], activeId: cfg.id };
                    localStorage.setItem(LS_MULTI_KEY, JSON.stringify(migrated));
                    // Optional: keep single-state for backward compatibility; do not remove
                    return migrated;
                } catch { }
            }
            // Default: create 3 empty configs
            const defaults = createDefaultConfigs(3);
            const initial: MultiState = { configs: defaults, activeId: defaults[0].id };
            localStorage.setItem(LS_MULTI_KEY, JSON.stringify(initial));
            return initial;
        } catch {
            const defaults = createDefaultConfigs(3);
            return { configs: defaults, activeId: defaults[0].id };
        }
    });

    const persist = useCallback((next: MultiState) => {
        setState(next);
        try { localStorage.setItem(LS_MULTI_KEY, JSON.stringify(next)); } catch { }
    }, []);

    const activeIndex = useMemo(() => state.configs.findIndex(c => c.id === state.activeId), [state]);
    const active = useMemo(() => state.configs[activeIndex] || state.configs[0], [state, activeIndex]);

    // Derived values for active config
    const totals = useMemo(() => computeTotals(active.selectedParts, active.quantities, 0.1), [active.selectedParts, active.quantities]);

    // Actions on active selection
    const selectPart = useCallback((key: keyof SelectedParts, product: Product | null) => {
        const nextConfigs = state.configs.map((cfg, idx) => idx === activeIndex ? { ...cfg, selectedParts: { ...cfg.selectedParts, [key]: product } } : cfg);
        // ensure quantity default is set when selecting a product
        const next = nextConfigs.map(cfg => cfg.id === state.configs[activeIndex]?.id ? { ...cfg, quantities: { ...cfg.quantities, [key]: cfg.quantities?.[key] ?? 1 } } : cfg);
        persist({ configs: next, activeId: state.activeId });
    }, [state, activeIndex, persist]);

    const removePart = useCallback((key: keyof SelectedParts) => {
        const nextConfigs = state.configs.map((cfg, idx) => idx === activeIndex ? { ...cfg, selectedParts: { ...cfg.selectedParts, [key]: null } } : cfg);
        persist({ configs: nextConfigs, activeId: state.activeId });
    }, [state, activeIndex, persist]);

    const resetActive = useCallback(() => {
        const nextConfigs = state.configs.map((cfg, idx) => idx === activeIndex ? { ...cfg, selectedParts: { ...EMPTY_SELECTED }, quantities: { ...EMPTY_QUANTITIES } } : cfg);
        persist({ configs: nextConfigs, activeId: state.activeId });
    }, [state, activeIndex, persist]);

    const updateQuantity = useCallback((key: keyof SelectedParts, qty: number) => {
        const safeQty = Math.max(1, Math.floor(qty));
        const next = state.configs.map((cfg, idx) => idx === activeIndex ? { ...cfg, quantities: { ...cfg.quantities, [key]: safeQty } } : cfg);
        persist({ configs: next, activeId: state.activeId });
    }, [state, activeIndex, persist]);

    // Config list actions
    const setActive = useCallback((id: string) => {
        if (id === state.activeId) return;
        if (!state.configs.some(c => c.id === id)) return;
        persist({ configs: state.configs, activeId: id });
    }, [state, persist]);

    const addConfig = useCallback((name?: string) => {
        const newCfg: BuildConfig = { id: uuidv4(), name: name || `Cấu hình ${state.configs.length + 1}`, selectedParts: { ...EMPTY_SELECTED }, quantities: { ...EMPTY_QUANTITIES } };
        persist({ configs: [...state.configs, newCfg], activeId: newCfg.id });
    }, [state, persist]);

    const renameConfig = useCallback((id: string, name: string) => {
        const next = state.configs.map(c => c.id === id ? { ...c, name } : c);
        persist({ configs: next, activeId: state.activeId });
    }, [state, persist]);

    const removeConfig = useCallback((id: string) => {
        if (state.configs.length <= 1) return; // always keep at least 1
        const next = state.configs.filter(c => c.id !== id);
        const nextActive = state.activeId === id ? next[0].id : state.activeId;
        persist({ configs: next, activeId: nextActive });
    }, [state, persist]);

    return {
        // list & active
        configs: state.configs,
        activeId: state.activeId,
        active,
        setActive,
        addConfig,
        renameConfig,
        removeConfig,

        // active selection derived
        selectedParts: active.selectedParts,
        quantities: active.quantities,
        totals,
        actions: {
            selectPart,
            removePart,
            reset: resetActive,
            updateQuantity,
        },
    } as const;
};
