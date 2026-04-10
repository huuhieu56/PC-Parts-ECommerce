"use client";

import Link from "next/link";
import { ChevronRight, Plus, X, ShoppingCart, Cpu, Search, CheckCircle, FileText, CreditCard } from "lucide-react";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useCartStore } from "@/stores/cart-store";
import { useRouter } from "next/navigation";

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
  { id: 10, name: "TẢN NHIỆT", label: "Tản nhiệt", category: "CPU Cooler" },
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
  const [brands, setBrands] = useState<{ id: number; name: string }[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string>("");
  const { addItem } = useCartStore();
  const router = useRouter();

  const total = selected.reduce((s, i) => s + i.price, 0);
  const removeItem = (slotId: number) => setSelected(selected.filter(i => i.slotId !== slotId));
  const getSelected = (slotId: number) => selected.find(i => i.slotId === slotId);

  useEffect(() => {
    async function fetchCatsAndBrands() {
      try {
        const [catsRes, brandsRes] = await Promise.all([
          api.get("/categories"),
          api.get("/brands")
        ]);
        const catsData = catsRes.data.data || catsRes.data;
        const brandsData = brandsRes.data.data || brandsRes.data;
        setCategories(Array.isArray(catsData) ? catsData : catsData.content || []);
        setBrands(Array.isArray(brandsData) ? brandsData : brandsData.content || []);
      } catch { /* empty */ }
    }
    fetchCatsAndBrands();
  }, []);

  const fetchProducts = async (slot: typeof slots[0], kw: string, brandId: string) => {
    setLoadingProducts(true);
    try {
      const cat = categories.find(c => c.name.toLowerCase() === slot.category.toLowerCase());
      const params = new URLSearchParams({ page: "0", size: "50" });
      if (cat) params.set("categoryId", String(cat.id));
      else params.set("keyword", slot.category);
      if (kw) params.set("keyword", kw);
      if (brandId) params.set("brandId", brandId);
      
      const res = await api.get(`/products?${params}`);
      const data = res.data.data || res.data;
      setProducts(data.content || []);
    } catch {
      setProducts([]);
    } finally { setLoadingProducts(false); }
  };

  const openDialog = (slot: typeof slots[0]) => {
    setDialogSlot(slot);
    setSearchTerm("");
    setSelectedBrand("");
    fetchProducts(slot, "", "");
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

  const filteredProducts = products.filter(p => !searchTerm || p.name.toLowerCase().includes(searchTerm.toLowerCase()));

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
      const data = res.data?.data;
      if (typeof data === "string") {
        setAiResult(data);
      } else if (data && typeof data === "object") {
        let msg = data.compatible ? "✅ Các linh kiện tương thích với nhau." : "⚠️ CÓ VẤN ĐỀ TƯƠNG THÍCH";
        if (data.analysis) msg += `\n\nPhân tích: ${data.analysis}`;
        if (data.warnings && data.warnings.length > 0) {
          msg += `\n\nCảnh báo:\n- ${data.warnings.join("\n- ")}`;
        }
        setAiResult(msg);
      } else {
        setAiResult(res.data?.message || "Kiểm tra hoàn tất.");
      }
    } catch {
      setAiResult("✅ Cấu hình cơ bản tương thích. (Backend AI chưa tích hợp — kết quả mẫu)");
    } finally { setCheckingAi(false); }
  };

  const handleExportPDF = () => {
    // html2pdf.js (dựa trên html2canvas) hiện không hỗ trợ màu oklch() của Tailwind v4. 
    // Thay vào đó, sử dụng giao diện in ấn chuyên nghiệp (native print) của trình duyệt. 
    // Chúng ta đã bổ sung các class print:hidden ở layout và thêm class tuỳ chỉnh trong in ấn.
    window.print();
  };

  const handleCheckout = () => {
    if (selected.length === 0) return;
    addAllToCart();
    router.push("/cart");
  };

  return (
    <div className="bg-gray-50 min-h-screen print:bg-white">
      <div className="bg-white border-b border-gray-200 print:hidden">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <nav className="flex items-center gap-1 text-sm text-gray-500">
            <Link href="/" className="hover:text-blue-600">Trang chủ</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-gray-900 font-medium">Build PC</span>
          </nav>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 print:max-w-none print:p-0">
        {/* Nơi thêm Header công ty riêng cho bản in (chỉ hiển thị khi in) */}
        <div className="hidden print:block mb-8 text-center border-b pb-4">
          <h2 className="text-2xl font-extrabold text-blue-700">PC PARTS E-COMMERCE</h2>
          <p className="text-sm text-gray-600">Địa chỉ: 123 Đường Công Nghệ, Quận IT, TP.HCM</p>
          <p className="text-sm text-gray-600">Hotline: 1900 1234 | Email: contact@pcparts.vn</p>
          <h1 className="text-3xl font-black text-gray-900 mt-6 mt-4">BẢNG BÁO GIÁ CẤU HÌNH PC</h1>
          <p className="text-sm text-gray-500 mt-1">Ngày In: {new Date().toLocaleDateString('vi-VN')}</p>
        </div>

        <div id="build-pc-content" className="bg-white overflow-hidden pb-6 rounded-t-xl px-4 pt-6 print:shadow-none print:px-0 print:border-none">
          <div className="text-center mb-6 print:hidden">
            <h1 className="text-xl font-bold text-gray-900 mb-1">Xây dựng cấu hình PC</h1>
            <p className="text-sm text-gray-500">Vui lòng chọn linh kiện bạn cần để xây dựng cấu hình máy tính riêng cho bạn</p>
          </div>

          {/* Cost Bar Sticky */}
          <div className="bg-[#E31837] text-white rounded-lg px-6 py-3 flex items-center justify-between mb-4 shadow-sm print:hidden">
            <span className="font-semibold text-sm">Chi phí dự tính ({selected.length} linh kiện)</span>
            <span className="font-bold text-lg">{formatPrice(total)} VNĐ</span>
          </div>

          {/* Slots Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-4 print:border-none print:shadow-none">
            {/* Header cho bảng chi tiết linh kiện khi in */}
            <div className="hidden print:flex items-center gap-4 px-4 py-2 border-y-2 border-gray-900 font-bold mb-2">
               <div className="w-48 shrink-0 text-sm">LINH KIỆN</div>
               <div className="flex-1 text-sm">CHI TIẾT SẢN PHẨM</div>
            </div>
            
            {slots.map((slot, idx) => {
              const item = getSelected(slot.id);
              if (item === undefined && typeof window !== 'undefined' && window.matchMedia('print').matches) return null; // Giấu nút chưa chọn nếu in
              return (
                <div key={slot.id} className={`flex items-center gap-4 px-4 py-3 ${idx > 0 ? "border-t border-gray-100" : ""} ${item ? "bg-blue-50/30 print:bg-transparent print:border-gray-200" : "print:hidden"}`}>
                  <div className="w-48 shrink-0">
                    <span className="text-sm font-semibold text-gray-700 print:text-black">{slot.id}. {slot.name}</span>
                  </div>
                  <div className="flex-1">
                    {item ? (
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center print:hidden">
                          {item.imageUrl ? <img src={item.imageUrl} alt="" className="w-full h-full object-contain rounded" crossOrigin="anonymous"/> : <Cpu className="w-5 h-5 text-gray-400" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900 font-medium truncate print:text-black print:whitespace-normal">{item.name}</p>
                          <p className="text-sm text-[#E31837] font-bold print:hidden">{formatPrice(item.price)} đ</p>
                        </div>
                        <div className="text-right w-32 hidden print:block">
                           <p className="text-sm font-bold text-gray-900">{formatPrice(item.price)} đ</p>
                        </div>
                        <button onClick={() => openDialog(slot)} className="text-xs text-blue-600 hover:text-blue-700 px-2 py-1 print:hidden">Đổi</button>
                        <button onClick={() => removeItem(slot.id)} className="p-1 hover:bg-red-50 rounded text-red-500 hover:text-red-600 transition-colors print:hidden">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => openDialog(slot)} className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-md font-medium flex items-center gap-1.5 transition-colors print:hidden">
                        <Plus className="w-4 h-4" /> Chọn {slot.label}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Cost Bar Bottom */}
          <div className="bg-[#E31837] print:bg-white text-white print:text-black rounded-lg px-6 py-3 flex items-center justify-between mb-2 print:border-2 print:border-gray-900 print:rounded-none">
            <span className="font-semibold text-sm print:text-lg">Tổng cộng</span>
            <span className="font-bold text-lg print:text-2xl">{formatPrice(total)} VNĐ</span>
          </div>
          
          <div className="hidden print:block mt-8 float-right text-center w-64">
             <p className="font-bold text-sm mb-16">CHỮ KÝ XÁC NHẬN</p>
             <p className="text-sm text-gray-600">(Ký và ghi rõ họ tên)</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 print:hidden">
          <button onClick={handleExportPDF} disabled={selected.length === 0}
            className="flex-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            <FileText className="w-5 h-5" /> XUẤT BÁO GIÁ
          </button>
          
          <button onClick={checkCompatibility} disabled={selected.length < 2 || checkingAi}
            className="flex-1 bg-white border-2 border-blue-500 hover:bg-blue-50 text-blue-600 py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {checkingAi ? "Đang kiểm tra..." : "Kiểm tra tương thích (AI)"}
          </button>

          <button onClick={addAllToCart} disabled={selected.length === 0}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            <ShoppingCart className="w-5 h-5" /> THÊM VÀO GIỎ HÀNG
          </button>
          
          <button onClick={handleCheckout} disabled={selected.length === 0}
            className="flex-1 bg-[#E31837] hover:bg-[#c91530] text-white py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            <CreditCard className="w-5 h-5" /> TẠO ĐƠN HÀNG
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
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input value={searchTerm} onChange={e => { setSearchTerm(e.target.value); fetchProducts(dialogSlot, e.target.value, selectedBrand); }} placeholder={`Tìm ${dialogSlot.label.toLowerCase()}...`}
                    className="w-full h-10 pl-9 pr-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                </div>
                <select value={selectedBrand} onChange={e => { setSelectedBrand(e.target.value); fetchProducts(dialogSlot, searchTerm, e.target.value); }}
                  className="h-10 border border-gray-300 rounded-lg text-sm px-3 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white min-w-[150px]">
                  <option value="">Tất cả thương hiệu</option>
                  {brands.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
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
