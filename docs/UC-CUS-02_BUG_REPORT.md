# Báo cáo kiểm tra UC-CUS-02: Tạo đơn hàng và thanh toán

**Ngày kiểm tra:** 2026-04-03
**Tester:** Claude Agent
**Version:** Based on commit acaad90

---

## Tổng kết nhanh

| STT | Vấn đề | Mức độ | Trạng thái |
|:---:|:-------|:------:|:----------:|
| 1 | Phone validation | **HIGH** | ✅ FIXED |
| 2 | Coupon input location | **MEDIUM** | ✅ FIXED |
| 3 | Shipping area restriction | **LOW** | ✅ FIXED |
| 4 | Auth check (no token) | - | PASS |
| 5 | Empty cart check | - | PASS |

### Commits (2026-04-03)
- `109ca65` fix: add Vietnamese phone number validation (UC-CUS-02)
- `00973ad` feat: add coupon input to checkout page (UC-CUS-02)
- `b9aa428` feat: restrict shipping to Hanoi area only (UC-CUS-02)

---

## 1. BUG: Không validate định dạng số điện thoại

### Mô tả
Hệ thống cho phép tạo đơn hàng với số điện thoại không đúng định dạng (chứa ký tự chữ cái).

### Reproduce
```bash
POST /api/v1/orders
{
  "paymentMethod": "COD",
  "shippingAddress": {
    "receiverName": "Test User",
    "receiverPhone": "098765432a",  # Chứa ký tự 'a'
    ...
  }
}
# Response: 201 Created - Đơn hàng được tạo thành công!
```

**Đơn hàng được tạo:** `ORD-000007` với SĐT `098765432a`

### Root Cause Analysis

| Layer | File | Validation |
|:------|:-----|:-----------|
| **Frontend** | `checkout/page.tsx:51` | Chỉ check empty |
| **Backend DTO** | `ShippingAddressRequest` (inner class `OrderService.java:377`) | **KHÔNG có annotation nào** |
| **Backend Entity** | `Address.java` | Chỉ có `@Column(length=20)` |

**Regex đề xuất cho SĐT Việt Nam:**
```regex
^(0|84|\+84)(3|5|7|8|9)[0-9]{8}$
```

### Fix đề xuất

**Backend (ưu tiên):**
```java
// ShippingAddressRequest hoặc tạo DTO riêng
@NotBlank
@Pattern(regexp = "^(0|84|\\+84)(3|5|7|8|9)[0-9]{8}$",
         message = "Số điện thoại không hợp lệ")
private String receiverPhone;
```

**Frontend (defense in depth):**
```typescript
const phoneRegex = /^(0|84|\+84)(3|5|7|8|9)[0-9]{8}$/;
if (!phoneRegex.test(phone)) {
  setError("Số điện thoại không hợp lệ");
  return;
}
```

---

## 2. SAI SPEC: Coupon chỉ nhập được ở Cart, không có ở Checkout

### Mô tả
Theo tài liệu UC-CUS-02 (requirement_analysis.md, dòng 332):

> "Customer nhập mã Coupon (nếu có). Hệ thống kiểm tra tính hợp lệ..."

**Luồng theo spec:**
```
Giỏ hàng → Checkout → [Nhập Coupon tại đây] → Xác nhận đặt hàng
```

**Hiện tại:**
```
Giỏ hàng → [Nhập Coupon tại đây] → Checkout (KHÔNG có Coupon input) → Đặt hàng
```

### So sánh

| Tính năng | Spec (UC-CUS-02) | Hiện tại |
|:----------|:-----------------|:---------|
| Nhập coupon ở Checkout | Có | **KHÔNG** |
| Nhập coupon ở Cart | Không đề cập | Có |
| Coupon được gửi khi tạo order | Có (`couponCode` param) | **KHÔNG** (không có field) |

### Code hiện tại

**Cart page (`cart/page.tsx`):** Có input coupon + validate API
**Checkout page (`checkout/page.tsx`):** **KHÔNG có** coupon input

**Order request hiện tại:**
```typescript
const orderRequest = {
  paymentMethod,
  note: note || undefined,
  shippingAddress: { ... }
  // THIẾU: couponCode
};
```

### Fix đề xuất

1. **Di chuyển** hoặc **duplicate** coupon input từ Cart sang Checkout
2. Thêm `couponCode` vào order request
3. Backend đã hỗ trợ (SDD: `POST /api/orders {..., coupon_code?}`)

---

## 3. CHƯA XÁC ĐỊNH: Phạm vi giao hàng

### Mô tả
User yêu cầu chỉ giới hạn giao hàng khu vực Hà Nội.

### Kiểm tra tài liệu
Tìm kiếm trong toàn bộ `docs/`:
- `phạm vi giao hàng` → Không tìm thấy
- `khu vực giao hàng` → Không tìm thấy
- `giới hạn địa chỉ` → Không tìm thấy

**Kết luận:** Tài liệu **KHÔNG** quy định giới hạn khu vực giao hàng.

### Hiện tại

**Frontend (`checkout/page.tsx:150-151`):**
```typescript
<select value={province}>
  <option>TP. Hồ Chí Minh</option>
  <option>Hà Nội</option>
  <option>Đà Nẵng</option>
</select>
```

**Backend:** Không validate province/district

### Đề xuất

Nếu muốn giới hạn Hà Nội:
1. **Thêm vào requirement** (cập nhật docs)
2. Backend validate whitelist provinces
3. Frontend chỉ hiển thị provinces được phép

**Danh sách quận Hà Nội:**
```
Ba Đình, Hoàn Kiếm, Hai Bà Trưng, Đống Đa, Tây Hồ, Cầu Giấy,
Thanh Xuân, Hoàng Mai, Long Biên, Nam Từ Liêm, Bắc Từ Liêm,
Hà Đông, Sơn Tây, và các huyện ngoại thành
```

---

## 4. PASS: Kiểm tra token/session

### Test
```bash
POST /api/v1/orders (không có Authorization header)
```

### Kết quả
```
HTTP 403 Forbidden
```

### Đánh giá: PASS
Hệ thống đúng theo spec: "Customer đã đăng nhập (có Token/Session hợp lệ)"

---

## 5. PASS: Kiểm tra giỏ hàng trống

### Test
```bash
# Clear cart trước
DELETE /api/v1/cart

# Tạo đơn hàng
POST /api/v1/orders { ... }
```

### Kết quả
```json
{
  "status": 400,
  "message": "Giỏ hàng trống"
}
```

### Đánh giá: PASS
Hệ thống đúng theo spec: "Giỏ hàng (Cart) không trống"

---

## Kế hoạch sửa chữa đề xuất

### Priority 1: Phone Validation (HIGH)
- [ ] Backend: Thêm `@Pattern` validation cho `receiverPhone`
- [ ] Frontend: Thêm regex validation trước khi submit
- [ ] Test: Viết unit test cho validation

### Priority 2: Coupon ở Checkout (MEDIUM)
- [ ] Frontend: Thêm coupon input vào checkout page
- [ ] Frontend: Gửi `couponCode` trong order request
- [ ] Test: Test flow coupon end-to-end

### Priority 3: Shipping Area (LOW - cần confirm)
- [ ] **Confirm với stakeholder:** Có cần giới hạn khu vực giao hàng không?
- [ ] Nếu YES: Cập nhật docs, implement frontend/backend validation

---

## Tham chiếu

- **UC-CUS-02:** `docs/requirement_analysis.md` (dòng 312-377)
- **API Contract:** `docs/software_design_document.md` (Section 11.4)
- **Sequence Diagram:** `docs/software_design_document.md` (Section 9.2)
