"use client";

import Link from "next/link";
import { ChevronRight, Plus, X, Save, Image, Share2, FileSpreadsheet, Printer, ShoppingCart, Cpu } from "lucide-react";
import { useState } from "react";

const slots = [
  { id: 1, name: "BỘ VI XỬ LÝ", label: "Bộ vi xử lý" },
  { id: 2, name: "BO MẠCH CHỦ", label: "Bo mạch chủ" },
  { id: 3, name: "RAM", label: "RAM" },
  { id: 4, name: "SSD 1", label: "SSD 1" },
  { id: 5, name: "SSD 2", label: "SSD 2" },
  { id: 6, name: "HDD", label: "HDD" },
  { id: 7, name: "VGA", label: "VGA" },
  { id: 8, name: "NGUỒN", label: "Nguồn" },
  { id: 9, name: "VỎ CASE", label: "Vỏ Case" },
  { id: 10, name: "TẢN NHIỆT KHÍ CPU", label: "Tản nhiệt khí CPU" },
  { id: 11, name: "TẢN NHIỆT NƯỚC CPU", label: "Tản nhiệt nước CPU" },
  { id: 12, name: "QUẠT TẢN NHIỆT VỎ CASE", label: "Quạt tản nhiệt vỏ case" },
  { id: 13, name: "MÀN HÌNH", label: "Màn hình" },
  { id: 14, name: "BÀN PHÍM", label: "Bàn phím" },
  { id: 15, name: "CHUỘT", label: "Chuột" },
  { id: 16, name: "TAI NGHE", label: "Tai nghe" },
  { id: 17, name: "LOA", label: "Loa" },
  { id: 18, name: "WINDOWS BẢN QUYỀN", label: "Windows bản quyền" },
];

interface SelectedItem {
  slotId: number;
  name: string;
  price: number;
}

function formatPrice(p: number): string { return p.toLocaleString("vi-VN"); }

export default function BuildPCPage() {
  const [selected, setSelected] = useState<SelectedItem[]>([]);
  const total = selected.reduce((s, i) => s + i.price, 0);

  const removeItem = (slotId: number) => setSelected(selected.filter(i => i.slotId !== slotId));
  const getSelected = (slotId: number) => selected.find(i => i.slotId === slotId);

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

        {/* Cost Bar */}
        <div className="bg-[#E31837] text-white rounded-lg px-6 py-3 flex items-center justify-between mb-4 sticky top-[7.5rem] z-10 shadow-md">
          <span className="font-semibold text-sm">Chi phí dự tính</span>
          <span className="font-bold text-lg">{formatPrice(total)} VNĐ</span>
        </div>

        {/* Slots Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-4">
          {slots.map((slot, idx) => {
            const item = getSelected(slot.id);
            return (
              <div key={slot.id} className={`flex items-center gap-4 px-4 py-3 ${idx > 0 ? "border-t border-gray-100" : ""}`}>
                <div className="w-48 shrink-0">
                  <span className="text-sm font-semibold text-gray-700">{slot.id}. {slot.name}</span>
                </div>
                <div className="flex-1">
                  {item ? (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center"><Cpu className="w-5 h-5 text-gray-400" /></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 font-medium truncate">{item.name}</p>
                        <p className="text-sm text-[#E31837] font-bold">{formatPrice(item.price)} đ</p>
                      </div>
                      <button onClick={() => removeItem(slot.id)} className="p-1 hover:bg-red-50 rounded text-red-500 hover:text-red-600 transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-md font-medium flex items-center gap-1.5 transition-colors">
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
        <button className="w-full bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-colors">
          <ShoppingCart className="w-5 h-5" /> THÊM VÀO GIỎ HÀNG
        </button>
      </div>
    </div>
  );
}
