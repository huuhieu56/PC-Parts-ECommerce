"use client";

import { Star, Camera, X, Loader2 } from "lucide-react";
import { useState } from "react";
import api from "@/lib/api";
import { ALLOWED_IMAGE_TYPES, MAX_REVIEW_IMAGE_BYTES } from "@/lib/constants";

/**
 * Review submission form with star rating and image upload (UC-CUS-07).
 * Extracted from product detail page to enable reuse and reduce page size.
 */
export default function ReviewForm({ productId, onSubmitted }: { productId: number; onSubmitted: () => void }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");
  const [msgError, setMsgError] = useState(false);
  // UC-CUS-07: Image upload state
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(f => {
      if (!ALLOWED_IMAGE_TYPES.includes(f.type)) {
        setMsg("Chỉ chấp nhận ảnh JPG, PNG, WEBP"); setMsgError(true);
        return false;
      }
      if (f.size > MAX_REVIEW_IMAGE_BYTES) {
        setMsg("Ảnh tối đa 5MB"); setMsgError(true);
        return false;
      }
      return true;
    });
    if (selectedFiles.length + validFiles.length > 5) {
      setMsg("Tối đa 5 ảnh"); setMsgError(true);
      return;
    }
    const newPreviews = validFiles.map(f => URL.createObjectURL(f));
    setSelectedFiles(prev => [...prev, ...validFiles]);
    setPreviewUrls(prev => [...prev, ...newPreviews]);
    e.target.value = "";
  };

  const removeFile = (index: number) => {
    URL.revokeObjectURL(previewUrls[index]);
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (rating === 0) { setMsg("Vui lòng chọn số sao"); setMsgError(true); return; }
    if (!comment.trim()) { setMsg("Vui lòng nhập nội dung đánh giá"); setMsgError(true); return; }
    setSubmitting(true);
    setMsg("");

    try {
      let imageUrls: string[] = [];
      // UC-CUS-07: Upload images first if any
      if (selectedFiles.length > 0) {
        setUploading(true);
        const formData = new FormData();
        selectedFiles.forEach(f => formData.append("files", f));
        const uploadRes = await api.post("/reviews/images", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        imageUrls = uploadRes.data.data || [];
        setUploading(false);
      }

      await api.post("/reviews", { productId, rating, content: comment.trim(), imageUrls });
      setMsg("Đánh giá đã được gửi thành công!");
      setMsgError(false);
      setRating(0);
      setComment("");
      // Clean up previews
      previewUrls.forEach(url => URL.revokeObjectURL(url));
      setSelectedFiles([]);
      setPreviewUrls([]);
      onSubmitted();
    } catch {
      setMsg("Bạn cần đăng nhập để đánh giá, hoặc đã đánh giá sản phẩm này rồi.");
      setMsgError(true);
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  };

  return (
    <div className="border-t border-gray-200 pt-6">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">Viết đánh giá</h3>
      <div className="flex items-center gap-1 mb-3">
        <span className="text-sm text-gray-500 mr-2">Đánh giá:</span>
        {[1, 2, 3, 4, 5].map((s) => (
          <button
            key={s}
            type="button"
            onMouseEnter={() => setHoverRating(s)}
            onMouseLeave={() => setHoverRating(0)}
            onClick={() => setRating(s)}
            className="focus:outline-none transition-transform hover:scale-110"
          >
            <Star className={`w-6 h-6 cursor-pointer transition-colors ${s <= (hoverRating || rating) ? "fill-amber-400 text-amber-400" : "text-gray-300 hover:text-amber-200"}`} />
          </button>
        ))}
        {rating > 0 && <span className="text-sm text-amber-600 ml-2 font-medium">{rating}/5</span>}
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Chia sẻ trải nghiệm của bạn với sản phẩm này..."
        rows={3}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
      />

      {/* UC-CUS-07: Image upload section */}
      <div className="mt-3">
        <label className="flex items-center gap-2 text-sm text-gray-500 mb-2 cursor-pointer hover:text-blue-600">
          <Camera className="w-4 h-4" />
          <span>Thêm ảnh (tối đa 5 ảnh, 5MB/ảnh)</span>
          <input
            type="file"
            accept=".jpg,.jpeg,.png,.webp"
            multiple
            className="hidden"
            onChange={handleFileSelect}
            disabled={submitting || selectedFiles.length >= 5}
          />
        </label>
        {previewUrls.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {previewUrls.map((url, idx) => (
              <div key={idx} className="relative w-16 h-16 group">
                <img src={url} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover rounded-md border border-gray-200" />
                <button
                  type="button"
                  onClick={() => removeFile(idx)}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {msg && <p className={`text-xs mt-1 ${msgError ? "text-red-500" : "text-green-600"}`}>{msg}</p>}
      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
      >
        {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
        {uploading ? "Đang upload ảnh..." : submitting ? "Đang gửi..." : "Gửi đánh giá"}
      </button>
    </div>
  );
}
