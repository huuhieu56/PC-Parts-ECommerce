"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";

export interface AttributeValueOption {
  valueId: number;
  value: string;
  count: number;
}

export interface AttributeFilterGroup {
  attributeId: number;
  attributeName: string;
  values: AttributeValueOption[];
}

export interface BrandFilterOption {
  brandId: number;
  brandName: string;
  count: number;
}

export interface ProductFilterData {
  attributes: AttributeFilterGroup[];
  brands: BrandFilterOption[];
  priceRange: { minPrice: number; maxPrice: number };
}

export const priceRanges = [
  { label: "Dưới 2 triệu", min: 0, max: 2000000 },
  { label: "2 - 5 triệu", min: 2000000, max: 5000000 },
  { label: "5 - 10 triệu", min: 5000000, max: 10000000 },
  { label: "10 - 20 triệu", min: 10000000, max: 20000000 },
  { label: "Trên 20 triệu", min: 20000000, max: Infinity },
];

export function useProductFilters(categoryId: number | null) {
  const [filterData, setFilterData] = useState<ProductFilterData | null>(null);
  const [loadingFilters, setLoadingFilters] = useState(false);
  const [selectedAttrValues, setSelectedAttrValues] = useState<Set<number>>(new Set());
  const [expandedAttrs, setExpandedAttrs] = useState<Set<number>>(new Set());
  const [selectedPriceRanges, setSelectedPriceRanges] = useState<number[]>([]);

  useEffect(() => {
    if (!categoryId) {
      setFilterData(null);
      return;
    }
    let cancelled = false;
    async function fetchFilters() {
      setLoadingFilters(true);
      try {
        const res = await api.get("/products/filters", { params: { categoryId } });
        const data: ProductFilterData = res.data.data || res.data;
        if (!cancelled) {
          setFilterData(data);
          setExpandedAttrs(new Set(data.attributes.map((a) => a.attributeId)));
        }
      } catch (err) {
        console.error("Failed to fetch filters", err);
      }
      if (!cancelled) setLoadingFilters(false);
    }
    fetchFilters();
    setSelectedAttrValues(new Set());
    return () => { cancelled = true; };
  }, [categoryId]);

  function toggleAttrValue(valueId: number) {
    setSelectedAttrValues((prev) => {
      const next = new Set(prev);
      if (next.has(valueId)) next.delete(valueId);
      else next.add(valueId);
      return next;
    });
  }

  function toggleExpandAttr(attrId: number) {
    setExpandedAttrs((prev) => {
      const next = new Set(prev);
      if (next.has(attrId)) next.delete(attrId);
      else next.add(attrId);
      return next;
    });
  }

  function togglePriceRange(idx: number) {
    setSelectedPriceRanges((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  }

  function clearFilters() {
    setSelectedPriceRanges([]);
    setSelectedAttrValues(new Set());
  }

  function getAttrValueLabel(valueId: number): string {
    if (!filterData) return String(valueId);
    for (const group of filterData.attributes) {
      const val = group.values.find((v) => v.valueId === valueId);
      if (val) return `${group.attributeName}: ${val.value}`;
    }
    return String(valueId);
  }

  function buildFilterParams(params: URLSearchParams) {
    if (selectedAttrValues.size > 0) {
      Array.from(selectedAttrValues).forEach((id) =>
        params.append("attributeValueIds", String(id))
      );
    }
    if (selectedPriceRanges.length > 0) {
      const ranges = selectedPriceRanges.map((idx) => priceRanges[idx]);
      const minPrice = Math.min(...ranges.map((r) => r.min));
      const maxPrice = Math.max(...ranges.map((r) => r.max));
      params.set("minPrice", String(minPrice));
      if (maxPrice !== Infinity) params.set("maxPrice", String(maxPrice));
    }
    return params;
  }

  const hasActiveFilters =
    selectedPriceRanges.length > 0 || selectedAttrValues.size > 0;

  return {
    filterData,
    loadingFilters,
    selectedAttrValues,
    expandedAttrs,
    selectedPriceRanges,
    toggleAttrValue,
    toggleExpandAttr,
    togglePriceRange,
    clearFilters,
    getAttrValueLabel,
    buildFilterParams,
    hasActiveFilters,
  };
}
