"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDownUp, Edit2, GripVertical, ImagePlus, Loader2, Plus, Search, Trash2, X } from "lucide-react";
import {
  createBanner,
  deleteBanner,
  getAdminBanners,
  reorderBanners,
  updateBanner,
} from "@/lib/api";
import type { Banner, BannerPlacement, BannerStatus } from "@/types";
import { BANNER_IMAGE_GUIDELINES } from "@/lib/banner-layout-config";
import { applyBannerDrop } from "./bannerReorder";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

interface BannerFormState {
  title: string;
  linkUrl: string;
  placement: BannerPlacement;
  sortOrder: string;
  startDate: string;
  endDate: string;
  status: BannerStatus;
}

const placementOptions: Array<{ value: BannerPlacement; label: string }> = [
  { value: "MAIN", label: "Banner chính" },
  { value: "SIDE_1", label: "Banner phụ 1" },
  { value: "SIDE_2", label: "Banner phụ 2" },
  { value: "SIDE_3", label: "Banner phụ 3" },
  { value: "POPUP", label: "Banner popup" },
  { value: "EVENT", label: "Event banner" },
  { value: "CUSTOM", label: "Banner custom" },
];

const placementLabels: Record<BannerPlacement, string> = {
  MAIN: "Banner chính",
  SIDE_1: "Banner phụ 1",
  SIDE_2: "Banner phụ 2",
  SIDE_3: "Banner phụ 3",
  POPUP: "Banner popup",
  EVENT: "Event banner",
  CUSTOM: "Banner custom",
};

const emptyForm: BannerFormState = {
  title: "",
  linkUrl: "",
  placement: "CUSTOM",
  sortOrder: "0",
  startDate: "",
  endDate: "",
  status: "ACTIVE",
};

const toDateTimeLocal = (value: string | null): string => {
  if (!value) return "";
  return value.slice(0, 16);
};

const formatDate = (value: string | null): string => {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("vi-VN");
};

const validateImage = (file: File | null, required: boolean): string | null => {
  if (!file) return required ? "Vui lòng chọn hình ảnh banner." : null;
  if (!ACCEPTED_TYPES.includes(file.type)) return "Chỉ chấp nhận ảnh JPG, PNG, WEBP.";
  if (file.size > MAX_IMAGE_BYTES) return "Ảnh tối đa 5MB.";
  return null;
};

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | BannerStatus>("ALL");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<BannerFormState>(emptyForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [draggedId, setDraggedId] = useState<number | null>(null);

  const fetchBanners = async () => {
    setLoading(true);
    try {
      setBanners(await getAdminBanners());
    } catch {
      setMessage({ type: "error", text: "Không tải được danh sách banner." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const filteredBanners = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return banners.filter((banner) => {
      const matchesSearch = !keyword || banner.title.toLowerCase().includes(keyword);
      const matchesStatus = statusFilter === "ALL" || banner.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [banners, search, statusFilter]);

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    window.setTimeout(() => setMessage(null), 3000);
  };

  const openCreate = () => {
    setEditId(null);
    setForm({ ...emptyForm, sortOrder: String(banners.length + 1) });
    setImageFile(null);
    setPreviewUrl(null);
    setShowForm(true);
  };

  const openEdit = (banner: Banner) => {
    setEditId(banner.id);
    setForm({
      title: banner.title,
      linkUrl: banner.linkUrl || "",
      placement: banner.placement,
      sortOrder: String(banner.sortOrder),
      startDate: toDateTimeLocal(banner.startDate),
      endDate: toDateTimeLocal(banner.endDate),
      status: banner.status,
    });
    setImageFile(null);
    setPreviewUrl(banner.imageUrl);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditId(null);
    setForm(emptyForm);
    setImageFile(null);
    setPreviewUrl(null);
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    const error = validateImage(file, false);
    if (error) {
      showMessage("error", error);
      event.target.value = "";
      return;
    }
    if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    setImageFile(file);
    setPreviewUrl(file ? URL.createObjectURL(file) : null);
  };

  const validateForm = (): string | null => {
    if (!form.title.trim()) return "Tiêu đề banner không được để trống.";
    const imageError = validateImage(imageFile, editId === null);
    if (imageError) return imageError;
    if (form.startDate && form.endDate && new Date(form.endDate) < new Date(form.startDate)) {
      return "Ngày kết thúc phải sau ngày bắt đầu.";
    }
    return null;
  };

  const saveBanner = async () => {
    const error = validateForm();
    if (error) {
      showMessage("error", error);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        image: imageFile,
        linkUrl: form.linkUrl.trim() || null,
        placement: form.placement,
        sortOrder: Number.parseInt(form.sortOrder, 10) || 0,
        startDate: form.startDate || null,
        endDate: form.endDate || null,
        status: form.status,
      };

      if (editId) {
        await updateBanner(editId, payload);
        showMessage("success", "Cập nhật banner thành công.");
      } else {
        await createBanner(payload);
        showMessage("success", "Tạo banner thành công.");
      }

      closeForm();
      await fetchBanners();
    } catch {
      showMessage("error", "Lưu banner thất bại.");
    } finally {
      setSaving(false);
    }
  };

  const removeBanner = async (banner: Banner) => {
    if (!window.confirm(`Xóa banner "${banner.title}"?`)) return;
    try {
      await deleteBanner(banner.id);
      setBanners((current) => current.filter((item) => item.id !== banner.id));
      showMessage("success", "Đã xóa banner.");
    } catch {
      showMessage("error", "Xóa banner thất bại.");
    }
  };

  const handleDrop = async (targetId: number) => {
    const { draggedId: nextDraggedId, reorderedBanners } = applyBannerDrop(banners, draggedId, targetId);
    setDraggedId(nextDraggedId);

    if (!reorderedBanners) {
      return;
    }

    setBanners(reorderedBanners);

    try {
      const saved = await reorderBanners(
        reorderedBanners.map((banner) => ({ id: banner.id, sortOrder: banner.sortOrder })),
      );
      setBanners(saved);
      showMessage("success", "Đã cập nhật thứ tự banner.");
    } catch {
      showMessage("error", "Sắp xếp banner thất bại.");
      await fetchBanners();
    }
  };

  const setFormValue = (key: keyof BannerFormState) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => setForm((current) => ({ ...current, [key]: event.target.value }));

  const imageGuideline = BANNER_IMAGE_GUIDELINES[form.placement];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Banner / Slider</h1>
          <p className="text-sm text-gray-500">Quản lý banner hiển thị trên trang chủ.</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" /> Thêm banner
        </button>
      </div>

      {message && (
        <div className={`rounded-lg border px-4 py-3 text-sm font-medium ${message.type === "success" ? "border-green-200 bg-green-50 text-green-700" : "border-red-200 bg-red-50 text-red-700"}`}>
          {message.text}
        </div>
      )}

      {showForm && (
        <div className="rounded-xl border border-blue-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">{editId ? "Sửa banner" : "Thêm banner mới"}</h2>
            <button onClick={closeForm} className="rounded p-1 hover:bg-gray-100" aria-label="Đóng form">
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
            <div className="flex flex-col gap-3">
              <div className="aspect-video overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                {previewUrl ? (
                  <img src={previewUrl} alt="Xem trước banner" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-2 text-gray-400">
                    <ImagePlus className="w-8 h-8" />
                    <span className="text-sm">Chưa chọn ảnh</span>
                  </div>
                )}
              </div>
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.webp"
                onChange={handleImageChange}
                className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100"
              />
              <p className="text-xs text-gray-500">JPG, PNG, WEBP. Tối đa 5MB.</p>
              <p className="rounded-md bg-blue-50 px-3 py-2 text-xs leading-5 text-blue-700">
                Kích thước ảnh nên là {imageGuideline.recommendedSize}. {imageGuideline.note}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-1 text-sm font-medium text-gray-700 md:col-span-2">
                Tiêu đề quản trị / alt text *
                <input value={form.title} onChange={setFormValue("title")} className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-normal text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <span className="text-xs font-normal text-gray-500">
                  Dùng để quản lý và làm alt text cho ảnh; không hiển thị chữ trên banner trang chủ.
                </span>
              </label>
              <label className="flex flex-col gap-1 text-sm font-medium text-gray-700 md:col-span-2">
                URL liên kết
                <input value={form.linkUrl} onChange={setFormValue("linkUrl")} placeholder="/products?categoryId=1" className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-normal text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </label>
              <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                Vị trí hiển thị
                <select value={form.placement} onChange={setFormValue("placement")} className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-normal text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {placementOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                Thứ tự
                <input type="number" min="0" value={form.sortOrder} onChange={setFormValue("sortOrder")} className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-normal text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <span className="text-xs font-normal text-gray-500">
                  Banner custom dùng thứ tự này để hiển thị ở section bên dưới trang chủ.
                </span>
              </label>
              <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                Trạng thái
                <select value={form.status} onChange={setFormValue("status")} className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-normal text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </label>
              <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                Ngày bắt đầu
                <input type="datetime-local" value={form.startDate} onChange={setFormValue("startDate")} className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-normal text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </label>
              <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                Ngày kết thúc
                <input type="datetime-local" value={form.endDate} onChange={setFormValue("endDate")} className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-normal text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </label>
            </div>
          </div>

          <div className="mt-5 flex gap-2">
            <button
              onClick={saveBanner}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />} Lưu
            </button>
            <button onClick={closeForm} className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100">
              Hủy
            </button>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-gray-200 p-4 md:flex-row md:items-center md:justify-between">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 w-4 h-4 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm banner..."
              className="h-9 w-full rounded-lg border border-gray-300 bg-white pl-9 pr-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as "ALL" | BannerStatus)}
            className="h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 p-10 text-sm text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" /> Đang tải banner...
          </div>
        ) : filteredBanners.length === 0 ? (
          <div className="p-10 text-center">
            <ImagePlus className="mx-auto mb-3 w-12 h-12 text-gray-300" />
            <p className="text-sm text-gray-500">Chưa có banner phù hợp.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-left text-gray-500">
                  <th className="w-10 px-4 py-3 font-medium"><ArrowDownUp className="w-4 h-4" /></th>
                  <th className="px-4 py-3 font-medium">Banner</th>
                  <th className="px-4 py-3 font-medium">Vị trí</th>
                  <th className="px-4 py-3 font-medium">Trạng thái</th>
                  <th className="px-4 py-3 font-medium">Thứ tự</th>
                  <th className="px-4 py-3 font-medium">Hiệu lực</th>
                  <th className="px-4 py-3 font-medium">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredBanners.map((banner) => (
                  <tr
                    key={banner.id}
                    draggable
                    onDragStart={() => setDraggedId(banner.id)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => handleDrop(banner.id)}
                    className={`border-b border-gray-50 hover:bg-gray-50 ${draggedId === banner.id ? "opacity-50" : ""}`}
                  >
                    <td className="px-4 py-3 text-gray-400"><GripVertical className="w-4 h-4 cursor-grab" /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img src={banner.imageUrl} alt={banner.title} className="h-14 w-24 rounded-md object-cover ring-1 ring-gray-200" />
                        <div>
                          <p className="font-semibold text-gray-900">{banner.title}</p>
                          <p className="max-w-[280px] truncate text-xs text-gray-500">{banner.linkUrl || "Không có link"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                        {placementLabels[banner.placement]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${banner.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {banner.status === "ACTIVE" ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{banner.sortOrder}</td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(banner.startDate)} - {formatDate(banner.endDate)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(banner)} className="rounded p-1 text-blue-600 hover:bg-blue-50 hover:text-blue-700" aria-label="Sửa banner">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => removeBanner(banner)} className="rounded p-1 text-red-500 hover:bg-red-50 hover:text-red-700" aria-label="Xóa banner">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
