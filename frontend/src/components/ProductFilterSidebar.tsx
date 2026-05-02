"use client";

import { ChevronDown, Loader2, SlidersHorizontal, X } from "lucide-react";
import type {
  ProductFilterData,
  AttributeFilterGroup,
} from "@/hooks/useProductFilters";
import { priceRanges } from "@/hooks/useProductFilters";

interface ProductFilterSidebarProps {
  filterData: ProductFilterData | null;
  loadingFilters: boolean;
  selectedAttrValues: Set<number>;
  expandedAttrs: Set<number>;
  selectedPriceRanges: number[];
  selectedBrandId: number | null;
  toggleAttrValue: (valueId: number) => void;
  toggleExpandAttr: (attrId: number) => void;
  togglePriceRange: (idx: number) => void;
  onBrandChange: (brandId: number | null) => void;
  onClearAll: () => void;
  hasActiveFilters: boolean;
}

export default function ProductFilterSidebar({
  filterData,
  loadingFilters,
  selectedAttrValues,
  expandedAttrs,
  selectedPriceRanges,
  selectedBrandId,
  toggleAttrValue,
  toggleExpandAttr,
  togglePriceRange,
  onBrandChange,
  onClearAll,
  hasActiveFilters,
}: ProductFilterSidebarProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2 text-sm">
          <SlidersHorizontal className="w-4 h-4" /> Bộ lọc
        </h3>
        {hasActiveFilters && (
          <button
            onClick={onClearAll}
            className="text-xs text-red-500 hover:text-red-600 cursor-pointer"
          >
            Xóa lọc
          </button>
        )}
      </div>

      {/* Brand filter */}
      {(filterData?.brands || []).length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Thương hiệu
          </h4>
          <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
            {filterData!.brands.map((brand) => (
              <label
                key={brand.brandId}
                className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer hover:text-gray-900 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedBrandId === brand.brandId}
                  onChange={() =>
                    onBrandChange(
                      selectedBrandId === brand.brandId ? null : brand.brandId
                    )
                  }
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <span className="truncate">{brand.brandName}</span>
                <span className="text-xs text-gray-400 ml-auto shrink-0">
                  ({brand.count})
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Dynamic Attribute Filters */}
      {loadingFilters && (
        <div className="mb-4 text-center py-3">
          <Loader2 className="w-5 h-5 animate-spin text-blue-500 mx-auto" />
          <p className="text-xs text-gray-400 mt-1">Đang tải bộ lọc...</p>
        </div>
      )}
      {filterData &&
        filterData.attributes.map((attrGroup: AttributeFilterGroup) => (
          <div key={attrGroup.attributeId} className="mb-4">
            <button
              onClick={() => toggleExpandAttr(attrGroup.attributeId)}
              className="flex items-center justify-between w-full text-sm font-medium text-gray-700 mb-1.5 cursor-pointer hover:text-gray-900 transition-colors"
            >
              <span>{attrGroup.attributeName}</span>
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-200 ${
                  expandedAttrs.has(attrGroup.attributeId) ? "rotate-180" : ""
                }`}
              />
            </button>
            {expandedAttrs.has(attrGroup.attributeId) && (
              <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                {attrGroup.values.map((val) => (
                  <label
                    key={val.valueId}
                    className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer hover:text-gray-900 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedAttrValues.has(val.valueId)}
                      onChange={() => toggleAttrValue(val.valueId)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="truncate">{val.value}</span>
                    <span className="text-xs text-gray-400 ml-auto shrink-0">
                      ({val.count})
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
        ))}

      {/* Price filter */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Khoảng giá</h4>
        <div className="space-y-1.5">
          {priceRanges.map((range, idx) => (
            <label
              key={idx}
              className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer hover:text-gray-900 transition-colors"
            >
              <input
                type="checkbox"
                checked={selectedPriceRanges.includes(idx)}
                onChange={() => togglePriceRange(idx)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              {range.label}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
