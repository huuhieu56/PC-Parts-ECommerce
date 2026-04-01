"use client";

import { useCallback, useRef, useState } from "react";
import { ImagePlus, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { uploadProductImages, deleteProductImage } from "@/lib/api";
import type { ProductImage } from "@/types";
import { cn } from "@/lib/utils";

interface PendingFile {
  file: File;
  previewUrl: string;
}

interface ImageUploadProps {
  /** Existing images from the product */
  images: ProductImage[];
  /** Product ID (null for new products) */
  productId: number | null;
  /** Called when images are uploaded successfully */
  onImagesUploaded: (newImages: ProductImage[]) => void;
  /** Called when an image is deleted successfully */
  onImageDeleted: (imageId: number) => void;
  /** Called when pending files change (for new products) */
  onPendingFilesChange?: (files: File[]) => void;
  /** Whether the component is disabled */
  disabled?: boolean;
  /** Maximum number of images allowed (default: 10) */
  maxImages?: number;
  /** Maximum file size in MB (default: 5) */
  maxFileSizeMB?: number;
}

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ACCEPTED_EXTENSIONS = ".jpg,.jpeg,.png,.webp";

export function ImageUpload({
  images,
  productId,
  onImagesUploaded,
  onImageDeleted,
  onPendingFilesChange,
  disabled = false,
  maxImages = 10,
  maxFileSizeMB = 5,
}: ImageUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFiles = useCallback(
    (files: File[]): File[] => {
      const valid: File[] = [];
      const maxSize = maxFileSizeMB * 1024 * 1024;

      for (const file of files) {
        if (!ACCEPTED_TYPES.includes(file.type)) {
          toast.error(
            `File "${file.name}" không được hỗ trợ. Chỉ chấp nhận JPG, PNG, WEBP.`
          );
          continue;
        }
        if (file.size > maxSize) {
          toast.error(`File "${file.name}" quá lớn. Tối đa ${maxFileSizeMB}MB.`);
          continue;
        }
        valid.push(file);
      }

      const totalCount = images.length + pendingFiles.length + valid.length;
      if (totalCount > maxImages) {
        toast.error(`Tối đa ${maxImages} hình ảnh.`);
        return valid.slice(0, maxImages - images.length - pendingFiles.length);
      }

      return valid;
    },
    [images.length, pendingFiles.length, maxImages, maxFileSizeMB]
  );

  const handleFiles = useCallback(
    async (files: File[]) => {
      const validFiles = validateFiles(files);
      if (validFiles.length === 0) return;

      // If no productId (new product), store as pending
      if (productId === null) {
        const newPending = validFiles.map((file) => ({
          file,
          previewUrl: URL.createObjectURL(file),
        }));
        setPendingFiles((prev) => {
          const updated = [...prev, ...newPending];
          onPendingFilesChange?.(updated.map((p) => p.file));
          return updated;
        });
        return;
      }

      // Upload immediately for existing products
      setUploading(true);
      try {
        const uploaded = await uploadProductImages(
          productId,
          validFiles,
          images.length === 0
        );
        onImagesUploaded(uploaded);
        toast.success(`Upload ${uploaded.length} hình thành công!`);
      } catch (err: unknown) {
        const message =
          (err as { response?: { data?: { message?: string } } })?.response
            ?.data?.message || "Upload thất bại";
        toast.error(message);
      } finally {
        setUploading(false);
      }
    },
    [
      productId,
      images.length,
      onImagesUploaded,
      onPendingFilesChange,
      validateFiles,
    ]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      if (disabled || uploading) return;

      const files = Array.from(e.dataTransfer.files);
      handleFiles(files);
    },
    [disabled, uploading, handleFiles]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      handleFiles(files);
      // Reset input so same file can be selected again
      e.target.value = "";
    },
    [handleFiles]
  );

  const handleDelete = useCallback(
    async (imageId: number) => {
      if (!window.confirm("Bạn có chắc muốn xóa ảnh này?")) return;

      setDeletingId(imageId);
      try {
        await deleteProductImage(imageId);
        onImageDeleted(imageId);
        toast.success("Xóa ảnh thành công!");
      } catch (err: unknown) {
        const message =
          (err as { response?: { data?: { message?: string } } })?.response
            ?.data?.message || "Xóa ảnh thất bại";
        toast.error(message);
      } finally {
        setDeletingId(null);
      }
    },
    [onImageDeleted]
  );

  const handleRemovePending = useCallback(
    (index: number) => {
      setPendingFiles((prev) => {
        // Revoke the old object URL to free memory
        URL.revokeObjectURL(prev[index].previewUrl);
        const updated = prev.filter((_, i) => i !== index);
        onPendingFilesChange?.(updated.map((p) => p.file));
        return updated;
      });
    },
    [onPendingFilesChange]
  );

  const totalImages = images.length + pendingFiles.length;
  const canUpload = totalImages < maxImages && !disabled && !uploading;

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      {canUpload && (
        <div
          role="button"
          tabIndex={0}
          aria-label="Khu vực upload hình ảnh. Kéo thả hoặc click để chọn file."
          className={cn(
            "relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
            dragActive
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
          )}
          onDragEnter={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setDragActive(false);
          }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ")
              fileInputRef.current?.click();
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={ACCEPTED_EXTENSIONS}
            className="hidden"
            onChange={handleFileSelect}
          />
          <ImagePlus className="w-10 h-10 mx-auto text-gray-400 mb-3" />
          <p className="text-sm text-gray-600 font-medium">
            Kéo thả hình ảnh hoặc{" "}
            <span className="text-blue-600">click để chọn</span>
          </p>
          <p className="text-xs text-gray-400 mt-1">
            JPG, PNG, WEBP - Tối đa {maxFileSizeMB}MB mỗi file
          </p>
        </div>
      )}

      {/* Upload Progress */}
      {uploading && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Đang upload...</span>
        </div>
      )}

      {/* Image Gallery */}
      {(images.length > 0 || pendingFiles.length > 0) && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {/* Existing Images */}
          {images
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((img) => (
              <div
                key={img.id}
                className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden group"
              >
                <img
                  src={img.imageUrl}
                  alt="Product image"
                  className="w-full h-full object-contain"
                />
                {img.isPrimary && (
                  <span className="absolute top-1 left-1 bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded font-medium">
                    Chính
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => handleDelete(img.id)}
                  disabled={deletingId === img.id || disabled}
                  className="absolute top-1 right-1 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                  aria-label="Xóa ảnh"
                >
                  {deletingId === img.id ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <X className="w-3 h-3" />
                  )}
                </button>
              </div>
            ))}

          {/* Pending Files (local previews) */}
          {pendingFiles.map((pf, idx) => (
            <div
              key={`pending-${idx}`}
              className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden group border-2 border-dashed border-amber-400"
            >
              <img
                src={pf.previewUrl}
                alt="Pending upload"
                className="w-full h-full object-contain opacity-70"
              />
              <span className="absolute bottom-1 left-1 bg-amber-500 text-white text-[10px] px-1.5 py-0.5 rounded font-medium">
                Chờ upload
              </span>
              <button
                type="button"
                onClick={() => handleRemovePending(idx)}
                disabled={disabled}
                className="absolute top-1 right-1 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Xóa file"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {totalImages === 0 && !canUpload && (
        <p className="text-sm text-gray-400 text-center py-4">
          Chưa có hình ảnh nào
        </p>
      )}

      {/* Image Count */}
      {totalImages > 0 && (
        <p className="text-xs text-gray-400">
          {totalImages}/{maxImages} hình ảnh
        </p>
      )}
    </div>
  );
}
