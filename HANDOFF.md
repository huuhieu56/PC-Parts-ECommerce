# HANDOFF.md — PC Parts E-Commerce

## Đã hoàn thành

### Backend (M01–M11)
- **M01 Auth & RBAC**: JWT, refresh token, register/login, role-based access
- **M02 Product Catalog**: CRUD, EAV attributes, search/filter, image upload (MinIO)
- **M03 Shopping**: Cart (Redis guest + DB customer), merge logic, Wishlist
- **M04 Order & Payment**: Order flow, VNPay/MoMo (mocked), COD
- **M05 Build PC**: Slot-based builder, compatibility check, export quote
- **M06 Inventory**: Stock management, audit log
- **M07 Coupon**: CRUD, validation, order integration
- **M08 Warranty**: Create request, view my/all requests, update status
- **M09 Review**: Create review, view product reviews (duplicate check)
- **M10 Notification**: Create/get/markRead/markAllRead, 8 unit tests ✅
- **M11 Dashboard Analytics**: Admin stats (revenue/orders/products/customers), 2 tests ✅

### Frontend (All pages)
- **Customer**: Home, Products (listing/detail+review), Cart, Checkout, Orders, Build PC, Wishlist, Warranty, Notifications
- **Admin**: Dashboard (real data), Products, Orders, Inventory, Coupons, Warranty
- **SEO**: Vietnamese metadata, Inter font, OpenGraph, lang="vi"
- **Test suite**: Vitest + testing-library, 22/22 tests PASS

### Infrastructure
- Flyway V1-V10: 35+ database tables
- GitHub Actions CI pipeline (backend build+test, frontend build)
- Docker Compose: PostgreSQL, Redis, MinIO, Backend, Frontend, Nginx
- Monitoring: Prometheus + Grafana docker-compose.monitoring.yml

### Tests
- 135+ backend unit tests (M01-M11) — coded, need environment to run
- 22 frontend unit tests — ALL PASS ✅

### Commits
- `113410c` — feat: complete M08-M11 with tests and CI/CD (19 files)
- (pending) — feat: add frontend tests, SEO, monitoring config

## Còn pending

1. **Backend test execution**: Cần cài Maven hoặc tạo Docker test container
2. **Payment integration**: VNPay/MoMo SDK real credentials
3. **AI compatibility check**: LLM provider integration
4. **Email notification**: SMTP credentials needed
5. **Frontend E2E tests**: Playwright/Cypress test suite

## Blockers gặp phải

- Docker backend container chỉ có production JAR, không có Maven wrapper
- Máy local không có `mvn` command
- WSL bash không khả dụng → không thể chạy `./mvnw`
- **Giải pháp đề xuất**: Tạo `Dockerfile.test` với Maven base image, hoặc cài Maven local

## Bước tiếp theo đề xuất

1. **Cài Maven local** hoặc tạo Docker test container → chạy backend tests
2. Configure production env vars (VNPay, MoMo, SMTP, LLM API keys)
3. Write E2E tests with Playwright
4. SEO optimization (sitemap, structured data)
5. Performance optimization (image lazy loading, code splitting)
