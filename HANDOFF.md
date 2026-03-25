# HANDOFF.md — PC Parts E-Commerce

## Đã hoàn thành

### Backend (M01–M11) — All modules complete
- **M01 Auth & RBAC**: JWT (account ID as subject, issuer+type claims), refresh token rotation, register/login, role-based access
- **M02 Product Catalog**: CRUD, EAV attributes, search/filter, image upload (MinIO)
- **M03 Shopping**: Cart (Redis guest + DB customer), merge logic, Wishlist
- **M04 Order & Payment**: Order flow, VNPay/MoMo (mocked), COD, @Valid + pagination limits
- **M05 Build PC**: Slot-based builder, compatibility check, export quote
- **M06 Inventory**: Stock management, audit log
- **M07 Coupon**: CRUD, validation, order integration
- **M08 Warranty**: Create request, view my/all requests, update status
- **M09 Review**: Create review, view product reviews (duplicate check)
- **M10 Notification**: Create/get/markRead(with IDOR check)/markAllRead, 9 unit tests ✅
- **M11 Dashboard Analytics**: Admin stats, 2 tests ✅

### Security Hardening (QA/QC audit result)
- **ARCH-01**: auth.getName() returns accountId (not email) — fixed in 4 files
- **SEC-01**: Hardcoded secrets removed from application.yml
- **SEC-02**: IDOR prevention on notification markAsRead
- **SEC-03**: CORS configuration added (localhost:3000, pcparts.vn)
- **SEC-04**: Actuator restricted — only /health public
- **SEC-06**: JWT tokens include issuer + type claims
- **SEC-08**: Refresh token rotation implemented
- **SEC-09**: @Valid on OrderController.createOrder
- **ARCH-03**: Pagination limits @Max(100) on Order + Notification controllers
- **ARCH-05**: Frontend error.tsx + not-found.tsx error boundaries

### Frontend
- **Pages**: Home, Products, Cart, Checkout, Orders, Build PC, Wishlist, Warranty, Notifications, Admin Dashboard
- **SEO**: Vietnamese metadata, Inter font, OpenGraph, lang="vi"
- **Test suite**: Vitest 22/22 tests PASS
- **Error handling**: Global error.tsx + not-found.tsx

### Infrastructure
- Docker Compose: PostgreSQL, Redis, MinIO, Backend, Frontend, Nginx
- Monitoring: Prometheus + Grafana docker-compose.monitoring.yml
- CI/CD: GitHub Actions pipeline
- `.env.example` for developer setup

### Commits
- `113410c` — feat: complete M08-M11 with tests and CI/CD
- `45334b5` — feat: add frontend tests, SEO, monitoring
- `8137935` — fix: critical security fixes (IDOR, CORS, JWT, auth crash, secrets, rotation)

## Còn pending

1. **SEC-07 Login rate limiting**: Needs Redis-backed counter (bucket4j or custom)
2. **PERF-01 Dashboard @Query**: Replace reflection with SUM aggregate query
3. **Backend test execution**: Needs Maven or Docker test container
4. **Payment integration**: VNPay/MoMo SDK real credentials
5. **AI compatibility check**: LLM provider integration
6. **Email notification**: SMTP credentials needed
7. **E2E tests**: Playwright/Cypress test suite

## Bước tiếp theo đề xuất

1. Cài Maven local (`choco install maven`) → chạy backend tests
2. Tạo `@Query("SELECT COALESCE(SUM(o.totalAmount),0) FROM Order o")` trong OrderRepository
3. Implement login rate limiting với Redis + bucket4j
4. Configure production env vars
5. Write E2E tests with Playwright
