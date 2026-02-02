import { useMemo, useCallback } from 'react';
import { useLocalStorage } from '../../../hooks/useLocalStorage';
import type { SelectedParts } from '../types';
import type { Product } from '../../../types/product.types';
import { EMPTY_SELECTED, EMPTY_QUANTITIES } from '../types';
import { computeTotals } from '../utils/totals';

const LS_KEY = 'pc_builder_state_v1';

export const usePcBuilderState = () => {
    const [selectedParts, setSelectedParts, resetStorage] = useLocalStorage<SelectedParts>(LS_KEY, EMPTY_SELECTED);
    const totals = useMemo(() => computeTotals(selectedParts, EMPTY_QUANTITIES, 0.1), [selectedParts]);

    const selectPart = useCallback((key: keyof SelectedParts, product: Product | null) => {
        setSelectedParts(prev => ({ ...prev, [key]: product }));
        // no persistent quantities in single-state hook; keep defaults in EMPTY_QUANTITIES
    }, [setSelectedParts]);

    const removePart = useCallback((key: keyof SelectedParts) => {
        setSelectedParts(prev => ({ ...prev, [key]: null }));
    }, [setSelectedParts]);

    const reset = useCallback(() => {
        resetStorage();
    }, [resetStorage]);

    return {
        selectedParts,
        totals,
        actions: { selectPart, removePart, reset },
    } as const;
};
