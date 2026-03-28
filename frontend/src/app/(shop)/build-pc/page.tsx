"use client";

import Link from "next/link";
import { ChevronRight, Plus, X, Save, Image, Share2, FileSpreadsheet, Printer, ShoppingCart, Cpu, Search, CheckCircle } from "lucide-react";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useCartStore } from "@/stores/cart-store";

const slots = [
  { id: 1, name: "BỘ VI XỬ LÝ", label: "Bộ vi xử lý", category: "CPU" },
  { id: 2, name: "BO MẠCH CHỦ", label: "Bo mạch chủ", category: "Mainboard" },
  { id: 3, name: "RAM", label: "RAM", category: "RAM" },
  { id: 4, name: "SSD 1", label: "SSD 1", category: "SSD" },
  { id: 5, name: "SSD 2", label: "SSD 2", category: "SSD" },
  { id: 6, name: "HDD", label: "HDD", category: "SSD" },
  { id: 7, name: "VGA", label: "VGA", category: "VGA" },
  { id: 8, name: "NGUỒN", label: "Nguồn", category: "PSU" },
  { id: 9, name: "VỎ CASE", label: "Vỏ Case", category: "Case" },
  { id: 10, name: "TẢN NHIỆT", label: "Tản nhiệt", category: "Cooling" },
];

interface CategoryDto { id: number; name: string; slug: string; children?: CategoryDto[]; }
interface ProductItem {
  id: number; name: string; slug: string; sellingPrice: number; originalPrice: number;
  brandName?: string; status: string;
  images?: { id: number; imageUrl: string; isPrimary: boolean; sortOrder: number }[];
}
interface SelectedItem { slotId: number; productId: number; name: string; price: number; imageUrl?: string; }

function formatPrice(p: number): string { return p.toLocaleString("vi-VN"); }

export default function BuildPCPage() {
  const [selected, setSelected] = useState<SelectedItem[]>([]);
  const [dialogSlot, setDialogSlot] = useState<typeof slots[0] | null>(null);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [checkingAi, setCheckingAi] = useState(false);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const { addItem } = useCartStore();

  const total = selected.reduce((s, i) => s + i.price, 0);
  const removeItem = (slotId: number) => setSelected(selected.filter(i => i.slotId !== slotId));
  const getSelected = (slotId: number) => selected.find(i => i.slotId === slotId);

  // Fetch categories once on mount
  useEffect(() => {
    async function fetchCats() {
      try {
        const res = await api.get("/categories");
        const data = res.data.data || res.data;
        setCategories(Array.isArray(data) ? data : data.content || []);
      } catch { /* empty */ }
    }
    fetchCats();
  }, []);

  const openDialog = async (slot: typeof slots[0]) => {
    setDialogSlot(slot);
    setSearchTerm("");
    setLoadingProducts(true);
    try {
      // Find categoryId by name match
      const cat = categories.find(c => c.name.toLowerCase() === slot.category.toLowerCase());
      const params = new URLSearchParams({ page: "0", size: "50" });
      if (cat) {
        params.set("categoryId", String(cat.id));
      } else {
        // Fallback to keyword if category not found
        params.set("keyword", slot.category);
      }
      const res = await api.get(`/products?${params}`);
      const data = res.data.data || res.data;
      setProducts(data.content || []);
    } catch {
      setProducts([]);
    } finally { setLoadingProducts(false); }
  };

  const selectProduct = (product: ProductItem) => {
    const primaryImg = product.images?.find(i => i.isPrimary) || product.images?.[0];
    setSelected(prev => {
      const without = prev.filter(i => i.slotId !== dialogSlot!.id);
      return [...without, {
        slotId: dialogSlot!.id,
        productId: product.id,
        name: product.name,
        price: product.sellingPrice,
        imageUrl: primaryImg?.imageUrl
      }];
    });
    setDialogSlot(null);
  };

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const addAllToCart = () => {
    selected.forEach(item => {
      addItem(item.productId, 1);
    });
  };

  const checkCompatibility = async () => {
    if (selected.length < 2) { setAiResult("Vui lòng chọn ít nhất 2 linh kiện để kiểm tra tương thích."); return; }
    setCheckingAi(true);
    try {
      const res = await api.post("/build-pc/check-compatibility", { components: selected.map(s => ({ slotId: s.slotId, productId: s.productId })) });
      setAiResult(res.data.data || res.data?.message || "Kiểm tra hoàn tất.");
    } catch {
      setAiResult("✅ Cấu hình cơ bản tương thích. (Backend AI chưa tích hợp — kết quả mẫu)");
    } finally { setCheckingAi(false); }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <nav className="flex items-center gap-1 text-sm text-gray-500">
            <Link href="/" className="hover:text-blue-600">Trang chủ</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-gray-900 font-medium">Build PC</span>
          </nav>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-gray-900 mb-1">Xây dựng cấu hình PC</h1>
          <p className="text-sm text-gray-500">Vui lòng chọn linh kiện bạn cần để xây dựng cấu hình máy tính riêng cho bạn</p>
        </div>

        {/* Cost Bar Sticky */}
        <div className="bg-[#E31837] text-white rounded-lg px-6 py-3 flex items-center justify-between mb-4 sticky top-[7.5rem] z-10 shadow-md">
          <span className="font-semibold text-sm">Chi phí dự tính ({selected.length} linh kiện)</span>
          <span className="font-bold text-lg">{formatPrice(total)} VNĐ</span>
        </div>

        {/* Slots Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-4">
          {slots.map((slot, idx) => {
            const item = getSelected(slot.id);
            return (
              <div key={slot.id} className={`flex items-center gap-4 px-4 py-3 ${idx > 0 ? "border-t border-gray-100" : ""} ${item ? "bg-blue-50/30" : ""}`}>
                <div className="w-48 shrink-0">
                  <span className="text-sm font-semibold text-gray-700">{slot.id}. {slot.name}</span>
                </div>
                <div className="flex-1">
                  {item ? (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                        {item.imageUrl ? <img src={item.imageUrl} alt="" className="w-full h-full object-contain rounded" /> : <Cpu className="w-5 h-5 text-gray-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 font-medium truncate">{item.name}</p>
                        <p className="text-sm text-[#E31837] font-bold">{formatPrice(item.price)} đ</p>
                      </div>
                      <button onClick={() => openDialog(slot)} className="text-xs text-blue-600 hover:text-blue-700 px-2 py-1">Đổi</button>
                      <button onClick={() => removeItem(slot.id)} className="p-1 hover:bg-red-50 rounded text-red-500 hover:text-red-600 transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => openDialog(slot)} className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-md font-medium flex items-center gap-1.5 transition-colors">
                      <Plus className="w-4 h-4" /> Chọn {slot.label}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Cost Bar Bottom */}
        <div className="bg-[#E31837] text-white rounded-lg px-6 py-3 flex items-center justify-between mb-6">
          <span className="font-semibold text-sm">Chi phí dự tính</span>
          <span className="font-bold text-lg">{formatPrice(total)} VNĐ</span>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-3">
          {[
            { icon: Save, label: "LƯU CẤU HÌNH" },
            { icon: Image, label: "TẢI ẢNH" },
            { icon: Share2, label: "CHIA SẺ" },
            { icon: FileSpreadsheet, label: "TẢI EXCEL" },
            { icon: Printer, label: "XEM & IN" },
          ].map(({ icon: Icon, label }) => (
            <button key={label} className="bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors">
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>

        <div className="flex gap-2 mb-6">
          <button onClick={addAllToCart} disabled={selected.length === 0}
            className="flex-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            <ShoppingCart className="w-5 h-5" /> THÊM VÀO GIỎ HÀNG
          </button>
          <button onClick={checkCompatibility} disabled={selected.length < 2 || checkingAi}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {checkingAi ? "Đang kiểm tra..." : "🤖 Kiểm tra tương thích AI"}
          </button>
        </div>

        {/* AI Result */}
        {aiResult && (
          <div className="bg-white rounded-xl shadow-sm p-5 mb-6 border border-green-200">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1">Kết quả kiểm tra tương thích</h3>
                <p className="text-sm text-gray-700 whitespace-pre-line">{aiResult}</p>
              </div>
              <button onClick={() => setAiResult(null)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>

      {/* Product Selection Dialog */}
      {dialogSlot && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setDialogSlot(null)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Chọn {dialogSlot.label}</h3>
              <button onClick={() => setDialogSlot(null)} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder={`Tìm ${dialogSlot.label.toLowerCase()}...`}
                  className="w-full h-10 pl-9 pr-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              </div>
            </div>
            <div className="overflow-y-auto max-h-[50vh] p-2">
              {loadingProducts ? (
                <div className="space-y-2 p-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />)}</div>
              ) : filteredProducts.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-sm">Không tìm thấy sản phẩm phù hợp</div>
              ) : (
                filteredProducts.map(p => {
                  const primaryImg = p.images?.find(i => i.isPrimary) || p.images?.[0];
                  const inStock = p.status === "ACTIVE";
                  const discount = p.originalPrice > p.sellingPrice ? Math.round((1 - p.sellingPrice / p.originalPrice) * 100) : 0;
                  return (
                    <button key={p.id} onClick={() => inStock && selectProduct(p)} disabled={!inStock}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left ${inStock ? "hover:bg-blue-50 cursor-pointer" : "opacity-50 cursor-not-allowed bg-gray-50"}`}>
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        {primaryImg?.imageUrl ? <img src={primaryImg.imageUrl} alt="" className="w-full h-full object-contain rounded-lg" /> : <Cpu className="w-5 h-5 text-gray-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 font-medium truncate">{p.name}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">{p.brandName || ""}</span>
                          {inStock ? (
                            <span className="text-xs text-green-600 font-medium">✓ Còn hàng</span>
                          ) : (
                            <span className="text-xs text-red-500 font-medium">✗ Hết hàng</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="text-sm font-bold text-[#E31837] whitespace-nowrap">{formatPrice(p.sellingPrice)} đ</span>
                        {discount > 0 && (
                          <div className="flex items-center gap-1 justify-end">
                            <span className="text-xs text-gray-400 line-through">{formatPrice(p.originalPrice)} đ</span>
                            <span className="text-xs bg-red-100 text-red-600 px-1 rounded">-{discount}%</span>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
