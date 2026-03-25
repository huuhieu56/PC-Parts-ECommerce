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

### Frontend — Light Theme (An Phát PC Style) ✅ ALL 22 PAGES
- **Layout**: globals.css (light-only), layout.tsx (bg-gray-50), shop layout
- **Header**: 2-layer blue #1A4B9C (top bar + main header), amber search/nav, responsive
- **Footer**: Dark slate-800, 4-column, amber accents, payment badges
- **Shop pages (11)**: Homepage, Products, Product Detail, Cart, Checkout, Build PC, Orders, Order Detail, Wishlist, Warranty, Notifications
- **Auth pages (2)**: Login, Register — clean light styled with blue branding
- **System pages (2)**: Error, 404 Not Found
- **Admin pages (7)**: Layout (sidebar nav), Dashboard, Products, Orders, Inventory, Coupons, Warranty
- **SEO**: Vietnamese metadata, Inter font, OpenGraph, lang="vi"
- **Test suite**: Vitest 22/22 tests PASS (pre-redesign run)

### Performance & Security (QA/QC fixes)
- **PERF-01**: Dashboard revenue — `OrderRepository.sumTotalRevenue()` aggregate query
- **SEC-07**: Redis login rate limiter — `LoginRateLimiter` (5 attempts / 15 min)

### Backend Testing ✅ 146/146 PASS
- Backend Dockerfile multi-stage build with test target
- `docker-compose.yml` — `backend-test` service (test profile)
- `LoginRateLimiterTest` — 10 unit tests
- 9 test files fixed to align with service API changes
- **Usage**: `docker compose --profile test run --build backend-test`

### Infrastructure
- Docker Compose: PostgreSQL, Redis, MinIO, Backend, Frontend, Nginx
- Monitoring: Prometheus + Grafana docker-compose.monitoring.yml
- `.env.example` for developer setup

### Commits
- `113410c` — feat: complete M08-M11 with tests and CI/CD
- `45334b5` — feat: add frontend tests, SEO, monitoring
- `8137935` — fix: critical security fixes (IDOR, CORS, JWT, auth crash, secrets, rotation)
- `74c36b1` — feat: redesign frontend to light theme (An Phát PC style)
- `01c545b` — feat: redesign all remaining pages to light theme
- `5400736` — feat: SEC-07 login rate limiter + PERF-01 + all 146 tests pass

## Còn pending

1. **Frontend tests re-run**: Tests cần update sau light theme redesign
2. **Payment integration**: VNPay/MoMo SDK real credentials
3. **AI compatibility check**: LLM provider integration for Build PC
4. **Email notification**: SMTP credentials needed
5. **E2E tests**: Playwright/Cypress test suite

## Bước tiếp theo đề xuất

1. Update frontend tests for new light theme components
2. Configure production env vars (SMTP, payment SDKs)
3. Write E2E tests with Playwright for critical flows
4. Integrate LLM provider for Build PC compatibility check
