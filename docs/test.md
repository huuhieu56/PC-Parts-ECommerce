# TÀI LIỆU TEST SPEC (MVP)

**Dự án:** Hệ thống Website Thương mại điện tử linh kiện máy tính  
**Phạm vi tài liệu này:** Module M01 (Xác thực) với trọng tâm UC-CUS-15  
**Nguồn yêu cầu:** `docs/requirement_analysis.md` + `docs/software_design_document.md`

---

## 1. Mục tiêu kiểm thử

- Xác nhận các luồng xác thực cốt lõi hoạt động đúng theo yêu cầu.
- Đảm bảo UC-CUS-15 (Quên / Thiết lập lại mật khẩu) được bao phủ đầy đủ happy-path, negative-path và edge-case.
- Đảm bảo yêu cầu bảo mật không lộ thông tin email tồn tại trong hệ thống.

---

## 2. Phạm vi kiểm thử

### 2.1 In Scope

- `POST /auth/forgot-password`
- `POST /auth/reset-password`
- Hành vi invalidation token/session sau reset mật khẩu

### 2.2 Out of Scope

- UI animation/pixel-perfect
- SMTP provider thực tế (chỉ kiểm thử logic gửi và enqueue trong backend)
- Hiệu năng tải cao (load test)

---

## 3. Tiền điều kiện môi trường

- Có dữ liệu account mẫu:
	- `user@example.com` (đang active)
	- `locked@example.com` (is_active=false, dùng cho test phụ nếu cần)
- Bật được email adapter mock/stub trong môi trường test.
- Có thể thao tác trực tiếp bảng `token` để chuẩn bị token hợp lệ/hết hạn.

---

## 4. Danh sách test case — Module Auth (M01)

**Quy ước:**
- `P` = Positive
- `N` = Negative

| TC-ID | Use Case | Endpoint | Điều kiện tiên quyết | Các bước thực hiện | Kết quả mong đợi | Loại | Ưu tiên |
|:------|:---------|:---------|:---------------------|:-------------------|:-----------------|:----|:-------|
| TC-AUTH-11 | UC-CUS-15 | POST `/auth/forgot-password` | Account tồn tại (`user@example.com`) | Gửi request với email tồn tại | HTTP 200, tạo token loại `RESET_PASSWORD`, gửi email reset | P | Must |
| TC-AUTH-12 | UC-CUS-15 | POST `/auth/forgot-password` | Email không tồn tại | Gửi request với email chưa đăng ký | HTTP 200, message trung tính giống TC-AUTH-11 (không lộ email) | N | Must |
| TC-AUTH-13 | UC-CUS-15 | POST `/auth/forgot-password` | — | Gửi email sai định dạng | HTTP 400, lỗi validation email | N | Should |
| TC-AUTH-14 | UC-CUS-15 | POST `/auth/forgot-password` | Account tồn tại | Gọi endpoint 2 lần liên tiếp | Cả 2 lần HTTP 200, token mới có hiệu lực, token reset cũ bị vô hiệu | P | Should |
| TC-AUTH-15 | UC-CUS-15 | POST `/auth/reset-password` | Có token `RESET_PASSWORD` hợp lệ | Gửi `{token, newPassword, confirmPassword}` hợp lệ | HTTP 200, cập nhật `account.password_hash`, xóa reset token, xóa token/session cũ | P | Must |
| TC-AUTH-16 | UC-CUS-15 | POST `/auth/reset-password` | Token reset đã hết hạn | Gửi request reset với token hết hạn | HTTP 400, message "Liên kết đã hết hạn. Vui lòng yêu cầu lại" | N | Must |
| TC-AUTH-17 | UC-CUS-15 | POST `/auth/reset-password` | Token không hợp lệ | Gửi request reset với token giả | HTTP 400, thông báo token không hợp lệ/hết hạn | N | Must |
| TC-AUTH-18 | UC-CUS-15 | POST `/auth/reset-password` | Token hợp lệ | `confirmPassword` khác `newPassword` | HTTP 400, message "Mật khẩu xác nhận không khớp" | N | Must |
| TC-AUTH-19 | UC-CUS-15 | POST `/auth/reset-password` | Token hợp lệ | Dùng mật khẩu yếu (`123456`) | HTTP 400, message rule độ mạnh mật khẩu | N | Must |
| TC-AUTH-20 | UC-CUS-15 | API protected bất kỳ | User đã reset mật khẩu thành công | Dùng access token/refresh token cũ gọi API | HTTP 401, yêu cầu đăng nhập lại | P | Must |
| TC-AUTH-21 | UC-CUS-15 | POST `/auth/reset-password` | Token hợp lệ | Thiếu `newPassword` hoặc `confirmPassword` | HTTP 400, trả lỗi field bắt buộc | N | Should |

---

## 5. Tiêu chí pass/fail

- PASS khi toàn bộ test `Must` pass 100%.
- Không chấp nhận release nếu bất kỳ test bảo mật của UC-CUS-15 bị fail (`TC-AUTH-12`, `TC-AUTH-16`, `TC-AUTH-17`, `TC-AUTH-20`).

---

## 6. Truy xuất nguồn yêu cầu

- UC-CUS-15 trong `docs/requirement_analysis.md`.
- API endpoint Auth và enum token trong `docs/software_design_document.md`.
- Ma trận test tổng hợp ở `docs/design.md` (mục 3.4.1).

## 7. Ghi chú cập nhật ngoài phạm vi MVP hiện tại

UC-CUS-12 (Quản lý địa chỉ giao hàng) chưa thuộc phạm vi kiểm thử chi tiết của file MVP này. Test case chính thức cho UC-CUS-12 hiện được truy xuất trong `docs/design.md`, mục `3.4.1.1 Module Quản lý địa chỉ giao hàng (UC-CUS-12)`, với prefix `TC-ADDR-*`.

Khi mở rộng phạm vi test spec sang UC-CUS-12, cần tạo section hoặc file test spec riêng bao phủ:
- CRUD Address của Customer.
- Đặt Address mặc định.
- Ownership check cho Address của user khác.
- Validation vùng giao hàng Hà Nội.
- Checkout dùng `addressId` không thuộc user hoặc ngoài vùng hỗ trợ.
