# PC Parts E-Commerce — Agent Context

## Tài liệu dự án
- Requirement Analysis: docs/requirement_analysis.md
- Software Design: docs/software_design_document.md
- System Architecture: docs/system_architecture_design.md
- UI/UX Design: docs/ui_ux_design.md

> Trước khi bắt đầu bất kỳ task nào, đọc toàn bộ docs/ để hiểu đúng yêu cầu.
> Test phải được viết dựa theo tài liệu trong docs/, không được tự suy luận.

## Tech Stack
- Frontend: Next.js (App Router) + TypeScript + Tailwind CSS + shadcn/ui
- Backend: Spring Boot (Java) + PostgreSQL + Redis
- Auth: Spring Security + JWT
- File Storage: MinIO
- Payment: VNPay SDK, MoMo SDK
- CI/CD: GitHub Actions + Docker + Docker Compose + Nginx
- Monitoring: Prometheus + Grafana + ELK Stack

## Môi trường: Windows (QUAN TRỌNG)
- Shell: PowerShell — KHÔNG dùng bash, sh, hoặc Linux commands
- Đường dẫn dùng dấu `\` hoặc `/` (PowerShell chấp nhận cả 2)
- KHÔNG dùng: `rm -rf`, `touch`, `mkdir -p`, `cp -r`, `ls`
- Thay thế tương đương:
  | Linux        | PowerShell                          |
  |-------------|--------------------------------------|
  | `rm -rf`    | `Remove-Item -Recurse -Force`        |
  | `touch`     | `New-Item -ItemType File`            |
  | `mkdir -p`  | `New-Item -ItemType Directory -Force`|
  | `cp -r`     | `Copy-Item -Recurse`                 |
  | `ls`        | `Get-ChildItem`                      |
  | `cat`       | `Get-Content`                        |

## Chạy Server: BẮT BUỘC dùng Docker
- KHÔNG chạy server trực tiếp bằng `java -jar`, `npm run dev`, `mvn spring-boot:run`
- Mọi service (backend, frontend, PostgreSQL, Redis, MinIO...) phải chạy qua Docker Compose
- Lệnh khởi động: `docker compose up -d`
- Lệnh dừng: `docker compose down`
- Xem log: `docker compose logs -f [service-name]`
- Nếu chưa có `docker-compose.yml` → tạo trước khi chạy bất kỳ service nào

## Quy tắc Test (QUAN TRỌNG)
- Test phải được viết DỰA THEO tài liệu trong docs/, không tự suy luận
- Một task chỉ được coi là HOÀN THÀNH khi tất cả test liên quan PASS
- KHÔNG commit code khi test đang FAIL
- Thứ tự bắt buộc: Viết test → Implement → Chạy test → Pass → Commit
- Frontend test: `npm run test`
- Backend test: `docker compose exec backend ./mvnw test`
- Nếu test fail sau 3 lần retry → dừng task đó, ghi vào HANDOFF.md, sang task tiếp theo

## Quy tắc Commit
- Commit nhỏ, thường xuyên — sau mỗi unit nhỏ hoàn thành và test pass
- KHÔNG gom nhiều feature vào 1 commit lớn
- Format: `feat/fix/chore/test/docs: [mô tả ngắn gọn]`
- Ví dụ:
  - `feat: add Product entity and repository`
  - `test: add unit tests for ProductService`
  - `fix: handle null pointer in CartService`
- KHÔNG git push — chỉ commit local

## Quy tắc Overnight
- Đọc GEMINI.md và toàn bộ docs/ trước khi bắt đầu
- Ghi tiến độ vào PROGRESS.md mỗi 30 phút (thời gian, task đang làm, % hoàn thành)
- Nếu bị block >15 phút → skip, ghi rõ lý do vào HANDOFF.md, chuyển task tiếp theo
- Khi xong toàn bộ: tạo HANDOFF.md gồm:
  - Đã hoàn thành gì (kèm commit hash)
  - Còn pending gì
  - Blocker gặp phải
  - Bước tiếp theo đề xuất

## Coding Standards
- TypeScript bắt buộc, KHÔNG dùng `any`
- Mọi function/service mới phải có unit test tương ứng
- Chạy lint trước mỗi commit: `npm run lint` (frontend)
- Java code phải có Javadoc cho public methods

## Project Summary (Agent-generated)

> Auto-generated after reading all files in `docs/`.

### 1. Dự án là gì?

**PC Parts E-Commerce** là website thương mại điện tử chuyên bán linh kiện máy tính, nhắm đến thị trường Việt Nam. Hệ thống được thiết kế theo kiến trúc **Modular Monolith** (Spring Boot backend + Next.js frontend), với khả năng mở rộng sang Microservices trong tương lai.

**Đặc điểm nổi bật:**
- Tính năng **Build PC** cho phép người dùng tự ráp cấu hình, tính giá, xuất báo giá — **không cần đăng nhập**. Chỉ yêu cầu đăng nhập khi kiểm tra tương thích AI hoặc đặt hàng.
- Tích hợp **LLM (AI)** để kiểm tra tương thích linh kiện (provider-agnostic qua abstraction layer).
- Thanh toán qua **VNPay, MoMo, COD**.
- Quản lý kho với **audit trail** đầy đủ qua `Inventory_Log`.
- 5 vai trò người dùng: Guest, Customer, Admin, Sales Staff, Warehouse Staff.

### 2. Các module/tính năng chính

| Module | Mô tả |
|--------|--------|
| **M01 – Auth & RBAC** | Đăng ký, đăng nhập, JWT + Refresh Token, phân quyền theo vai trò |
| **M02 – Product Catalog** | CRUD sản phẩm, danh mục, thuộc tính động (EAV), tìm kiếm/lọc, SEO |
| **M03 – Shopping** | Giỏ hàng (merge guest→customer khi đăng nhập), Wishlist |
| **M04 – Order & Payment** | Tạo đơn, thanh toán VNPay/MoMo/COD, theo dõi trạng thái đơn hàng |
| **M05 – Build PC** | Chọn linh kiện, tính giá, kiểm tra tương thích AI, xuất báo giá |
| **M06 – Inventory** | Quản lý tồn kho, audit log cho mọi biến động kho |
| **M07 – Coupon** | Tạo/quản lý mã giảm giá, áp dụng cho đơn hàng |
| **M08 – Warranty & Returns** | Yêu cầu bảo hành/đổi trả, theo dõi trạng thái |
| **M09 – Review & Rating** | Đánh giá sản phẩm, duyệt đánh giá (admin) |
| **M10 – Notification** | Thông báo email/in-app về đơn hàng, khuyến mãi |
| **M11 – Dashboard & Analytics** | Thống kê doanh thu, sản phẩm bán chạy, báo cáo cho Admin |

### 3. Thứ tự triển khai (theo phase)

#### Phase 1 — Nền tảng (Foundation)
1. **Thiết lập môi trường**: Docker Compose (PostgreSQL, Redis, MinIO, Nginx), project scaffold
2. **Database schema**: Migration bằng Flyway/Liquibase theo ERD trong SDD
3. **M01 – Auth & RBAC**: JWT, refresh token, đăng ký/đăng nhập, phân quyền — nền tảng cho mọi module khác

#### Phase 2 — Core Commerce
4. **M02 – Product Catalog**: Entity, thuộc tính động, CRUD, tìm kiếm/lọc, upload ảnh (MinIO)
5. **M03 – Shopping**: Giỏ hàng (Redis cho guest, DB cho customer), merge logic, Wishlist
6. **M06 – Inventory**: Quản lý tồn kho, audit log

#### Phase 3 — Transactions
7. **M04 – Order & Payment**: Luồng đặt hàng, tích hợp VNPay/MoMo, COD
8. **M07 – Coupon**: Mã giảm giá, validation, áp dụng cho đơn hàng

#### Phase 4 — Advanced Features
9. **M05 – Build PC**: Chọn linh kiện, tính tương thích, tích hợp LLM, xuất báo giá
10. **M08 – Warranty & Returns**: Yêu cầu bảo hành/đổi trả
11. **M09 – Review & Rating**: Đánh giá, duyệt đánh giá

#### Phase 5 — Polish & Operations
12. **M10 – Notification**: Email/in-app notification
13. **M11 – Dashboard & Analytics**: Thống kê, báo cáo
14. **Frontend hoàn thiện**: Responsive design, SEO, animations, accessibility
15. **CI/CD & Monitoring**: GitHub Actions, Prometheus, Grafana, ELK Stack
