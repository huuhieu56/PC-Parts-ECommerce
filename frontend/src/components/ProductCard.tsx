"use client";

import Link from "next/link";
import { Cpu, ShoppingCart, Check, Loader2 } from "lucide-react";
import { useState } from "react";
import { formatPrice } from "@/lib/utils";

export interface DisplayProduct {
  id: number;
  name: string;
  slug: string;
  sku: string;
  price: number;
  originalPrice: number | null;
  discountPercent: number;
  thumbnailUrl: string | null;
  brandName: string;
}

/**
 * Shared product card used on homepage and product listing pages.
 * Renders thumbnail, price, discount badge, and add-to-cart button.
 */
export default function ProductCard({ product, onAddToCart }: { product: DisplayProduct; onAddToCart: (id: number) => Promise<void> }) {
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const handleAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (adding) return;
    setAdding(true);
    try {
      await onAddToCart(product.id);
      setAdded(true);
      setTimeout(() => setAdded(false), 1500);
    } catch { /* empty */ } finally {
      setAdding(false);
    }
  };

  return (
    <Link href={`/products/${product.slug}`} className="block group">
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden h-full flex flex-col">
        {/* Fixed-height image container — standardizes alignment across the grid */}
        <div className="relative h-52 bg-gray-50 flex items-center justify-center p-3">
          {product.thumbnailUrl ? (
            <img
              src={product.thumbnailUrl}
              alt={product.name}
              className="max-w-full max-h-full object-contain transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 rounded-md flex items-center justify-center">
              <Cpu className="w-10 h-10 text-gray-400" />
            </div>
          )}
          {product.discountPercent > 0 && (
            <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded shadow-sm">
              -{product.discountPercent}%
            </span>
          )}
        </div>
        {/* Text content flexes to fill remaining height; sticky footer via mt-auto */}
        <div className="p-3 flex-1 flex flex-col">
          <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1 leading-snug">
            {product.name}
          </h3>
          <p className="text-xs text-gray-400 mb-1">Mã SP: {product.sku}</p>
          <p className="text-xs text-gray-500 mb-2">{product.brandName}</p>
          {/* mt-auto pushes the entire bottom section to the card footer */}
          <div className="mt-auto">
            {product.originalPrice && (
              <p className="text-xs text-gray-400 line-through">{formatPrice(product.originalPrice)}</p>
            )}
            <p className="text-[#E31837] font-bold text-base">{formatPrice(product.price)}</p>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs flex items-center gap-0.5 text-green-600">✓ Còn hàng</span>
              <button
                onClick={handleAdd}
                disabled={adding}
                className={`w-7 h-7 rounded flex items-center justify-center transition-all duration-200 cursor-pointer active:scale-90 ${
                  added ? "bg-green-500 text-white scale-110" : "bg-blue-600 hover:bg-blue-700 hover:shadow-md text-white"
                }`}
                title="Thêm vào giỏ hàng"
              >
                {adding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : added ? <Check className="w-3.5 h-3.5" /> : <ShoppingCart className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
