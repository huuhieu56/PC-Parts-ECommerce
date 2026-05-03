# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PC Parts E-Commerce (Vietnamese: linh kien may tinh) — a full-stack e-commerce platform for computer parts with role-based admin panel. Monorepo with separate `backend/` and `frontend/` directories.

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Java 21, Spring Boot 3.3, Flyway, JPA/Hibernate |
| Frontend | Next.js 16, React 19, Tailwind CSS 4, Zustand, TanStack Query |
| Database | PostgreSQL 16 |
| Cache | Redis 7 |
| Storage | MinIO (S3-compatible) |
| Auth | JWT (access + refresh token rotation) |

## Commands

### Infrastructure (Docker)
```bash
docker compose up -d          # Start PostgreSQL (port 5433), Redis, MinIO
docker compose down           # Stop (keep data)
docker compose down -v        # Stop and wipe all data
```

### Backend
```bash
./bin/run-backend-dev                 # Run Spring Boot (loads .env, needs Java 21)
cd backend && ./mvnw spring-boot:run -DskipTests   # Direct Maven run
docker compose --profile test run --build backend-test  # Run 146 unit tests in Docker
```

### Frontend
```bash
cd frontend && npm install     # Install deps (first time or after package.json changes)
./bin/run-frontend-dev         # Run Next.js dev server (loads .env)
cd frontend && npm test        # Run Vitest tests
cd frontend && npm run build   # Production build
cd frontend && npm run lint    # ESLint
```

### Seed Test Data
```bash
./bin/seed-data    # After backend is healthy: creates 4 test accounts + sample data
```

## Architecture

### Monorepo Layout
- `backend/` — Spring Boot Maven project (standalone)
- `frontend/` — Next.js app (standalone)
- `bin/` — Dev helper scripts (run-backend-dev, run-frontend-dev, seed-data)
- `docker-compose.yml` — Infrastructure only for dev (Postgres, Redis, MinIO)
- `docker-compose.prod.yml` — Full stack for production
- `docs/` — Design docs, ERDs, sequence diagrams, UML (PlantUML + images)
- `nginx/` — Reverse proxy config for production
- `.agents/skills/` — Reference skill files for various patterns (architecture, UI, testing)

### Backend Structure (`backend/src/main/java/com/pcparts/`)
- **Module-based architecture**: Each domain is a self-contained module under `module/`
  - `auth/` — Registration, login, JWT, refresh tokens, password reset
  - `product/` — CRUD, EAV attributes, search/filter, image upload, specifications
  - `shopping/` — Cart (Redis for guests, DB for customers), wishlist, merge logic
  - `order/` — Order flow, payment (VNPay/MoMo/COD)
  - `buildpc/` — Slot-based PC builder with compatibility checks
  - `inventory/` — Stock management, audit log
  - `coupon/` — CRUD, validation, order integration
  - `warranty/` — Warranty requests and policy management
  - `review/` — Product reviews with duplicate check
  - `notification/` — User notifications with IDOR protection
  - `dashboard/` — Admin analytics
  - `content/` — Banners/sliders CMS
- `common/` — Shared DTOs (`ApiResponse`, `PageResponse`), exceptions, constants
- `config/` — Security, CORS, Redis, MinIO configuration
- `security/` — JWT filter, token provider, user details service, login rate limiter

Each module follows: `controller/` → `service/` → `repository/` + `entity/` + `dto/`

### Frontend Structure (`frontend/src/`)
- **App Router** with route groups:
  - `(shop)/` — Public-facing pages: products, cart, checkout, build-pc, orders, wishlist, warranty, notifications, profile
  - `(admin)/admin/` — Admin panel: dashboard, products, orders, inventory, categories, brands, coupons, suppliers, warranty, returns, accounts, statistics, banners
  - `(auth)/` — Login, register, forgot/reset password
- `components/` — Shared components (ProductCard, Header, Footer, Pagination) + `ui/` (shadcn primitives) + `admin/` (AdminGuard, PermissionGate, ImageUpload)
- `stores/` — Zustand stores: `auth-store.ts` (persisted to localStorage), `cart-store.ts`
- `lib/` — `api.ts` (Axios instance with JWT interceptors and token refresh), `permissions.ts` (RBAC permission codes matching backend), `mappers.ts`, `utils.ts`, `constants.ts`
- `hooks/` — Custom hooks (e.g., `useProductFilters.ts`)
- `types/` — TypeScript types in `types/index.ts`

### Key Patterns
- **Auth flow**: JWT access + refresh token rotation. Axios interceptor auto-refreshes on 401/403. Tokens stored in localStorage via Zustand persist.
- **RBAC**: Four roles (ADMIN, SALES, WAREHOUSE, CUSTOMER). Permissions defined in `lib/permissions.ts` match backend permission codes. `AdminGuard` and `PermissionGate` components gate admin routes.
- **API responses**: Backend wraps all responses in `ApiResponse<T>` with `{ data, message }`. Frontend uses `extractData()` helper to unwrap.
- **Image storage**: MinIO (S3-compatible). Product images uploaded via multipart form data.
- **Database migrations**: Flyway auto-runs on backend startup. 18 migration files in `backend/src/main/resources/db/migration/`.
- **Cart**: Redis-backed for guest users, database-backed for authenticated users. Merge logic on login.

### Environment
- `.env` at project root — shared by both backend and frontend via `bin/` scripts
- `.env.example` — Template with comments explaining each variable
- Key difference for local dev: Postgres on `localhost:5433`, Redis on `localhost`, MinIO on `localhost:9000`, API at `localhost:8080/api/v1`

### Test Accounts (after seed)
| Role | Email | Password |
|---|---|---|
| ADMIN | admin@pcparts.com | Admin@123 |
| SALES | sales@pcparts.com | Sales@123 |
| WAREHOUSE | warehouse@pcparts.com | Warehouse@123 |
| CUSTOMER | customer@pcparts.com | Customer@123 |

## Important Notes

- **Next.js 16**: This version has breaking changes from training data. Before writing Next.js code, check `frontend/node_modules/next/dist/docs/` for the actual API docs. (See `frontend/AGENTS.md`.)
- **Language**: UI text, metadata, and docs are in Vietnamese. SEO metadata uses `lang="vi"`.
- **AGENTS.md**: Root `AGENTS.md` contains behavioral guidelines — think before coding, simplicity first, surgical changes, goal-driven execution. Follow these principles.
- **Path alias**: Frontend uses `@/` → `./src/` (configured in tsconfig and vitest).
- **No `.cursorrules` or Copilot instructions** exist in this repo.
