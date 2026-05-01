# PC Parts E-Commerce

Hệ thống thương mại điện tử linh kiện máy tính — Spring Boot + Next.js.

## Tech Stack

| Layer          | Công nghệ                                      |
| -------------- | ----------------------------------------------- |
| **Backend**    | Java 21, Spring Boot 3.3, Flyway, JPA/Hibernate |
| **Frontend**   | Next.js 16, React 19, Tailwind CSS 4, Zustand   |
| **Database**   | PostgreSQL 16                                    |
| **Cache**      | Redis 7                                          |
| **Storage**    | MinIO (S3-compatible)                            |
| **Auth**       | JWT (access + refresh token rotation)            |

---

## Yêu cầu hệ thống

- **Docker** + **Docker Compose** (v2)
- **Java 21** (khuyến nghị dùng [SDKMAN](https://sdkman.io/))
- **Node.js 22+** (khuyến nghị dùng [nvm](https://github.com/nvm-sh/nvm))
- **curl** (dùng cho `bin/seed-data`)

---

## Hướng dẫn chạy Local Dev

Trong môi trường dev, chỉ **infrastructure** (PostgreSQL, Redis, MinIO) chạy trong Docker.
Backend và Frontend chạy **trực tiếp trên host** để hot-reload nhanh.

### Bước 1 — Cấu hình `.env`

```bash
# Copy file mẫu (chỉ cần làm 1 lần)
cp .env.example .env
```

> **Lưu ý:** File `.env` đã có sẵn giá trị dev mặc định, dùng luôn được.
> Điểm khác biệt quan trọng so với `.env.example`:
>
> | Biến                      | `.env.example` (Docker)            | `.env` (Local Dev)                      |
> | ------------------------- | ---------------------------------- | --------------------------------------- |
> | `SPRING_DATASOURCE_URL`   | `jdbc:postgresql://postgres:5432/` | `jdbc:postgresql://localhost:5433/`      |
> | `SPRING_REDIS_HOST`       | `redis`                            | `localhost`                             |
> | `MINIO_ENDPOINT`          | `http://minio:9000`                | `http://localhost:9000`                 |
> | `NEXT_PUBLIC_API_URL`     | `http://localhost/api/v1`          | `http://localhost:8080/api/v1`          |

### Bước 2 — Khởi động Infrastructure

```bash
docker compose up -d
```

Lệnh này khởi động 3 container:

| Container           | Port                | Mô tả                     |
| ------------------- | ------------------- | -------------------------- |
| `pcparts-postgres`  | `5433` → 5432       | PostgreSQL database        |
| `pcparts-redis`     | `6379`              | Redis cache & rate limiter |
| `pcparts-minio`     | `9000` (API), `9001` (Console) | Object storage (ảnh sản phẩm) |

Kiểm tra trạng thái:

```bash
docker compose ps
```

### Bước 3 — Chạy Backend

```bash
./bin/run-backend-dev
```

Script này tự động:
1. Load biến môi trường từ `.env`
2. Khởi tạo SDKMAN (nếu có) để dùng Java 21
3. Chạy `./mvnw spring-boot:run -DskipTests`

Backend sẽ chạy tại **http://localhost:8080**.

> Flyway tự động chạy migrations khi backend khởi động lần đầu.

### Bước 4 — Chạy Frontend

Mở **terminal khác** (backend cần đang chạy):

```bash
# Cài dependencies (lần đầu hoặc khi package.json thay đổi)
cd frontend && npm install && cd ..

# Chạy dev server
./bin/run-frontend-dev
```

Frontend sẽ chạy tại **http://localhost:3000**.

### Bước 5 — Seed dữ liệu test

Sau khi **backend đã healthy** (bước 3 chạy xong, Flyway migrate thành công):

```bash
./bin/seed-data
```

Script này:
1. Đợi backend healthy qua `/actuator/health` (tối đa 120s)
2. Đăng ký 4 tài khoản qua REST API (`/api/v1/auth/register`)
3. Cập nhật role qua SQL (`docker exec` → `psql`)
4. Thêm địa chỉ mẫu cho tài khoản customer

#### Tài khoản test

| Role         | Email                     | Password        |
| ------------ | ------------------------- | --------------- |
| **ADMIN**    | `admin@pcparts.com`       | `Admin@123`     |
| **SALES**    | `sales@pcparts.com`       | `Sales@123`     |
| **WAREHOUSE**| `warehouse@pcparts.com`   | `Warehouse@123` |
| **CUSTOMER** | `customer@pcparts.com`    | `Customer@123`  |

---

## Tổng hợp lệnh nhanh

```bash
# === Lần đầu setup ===
cp .env.example .env           # Tạo .env (sửa nếu cần)
cd frontend && npm install && cd ..
docker compose up -d           # Khởi động infrastructure
./bin/run-backend-dev          # Terminal 1: Backend
./bin/run-frontend-dev         # Terminal 2: Frontend
./bin/seed-data                # Terminal 3: Seed data (đợi backend ready)

# === Các lần sau ===
docker compose up -d           # Bật infrastructure (nếu đã tắt)
./bin/run-backend-dev          # Terminal 1
./bin/run-frontend-dev         # Terminal 2
```

---

## Các URL sau khi chạy

| Dịch vụ              | URL                                 |
| --------------------- | ----------------------------------- |
| Frontend (Shop)       | http://localhost:3000                |
| Frontend (Admin)      | http://localhost:3000/admin          |
| Backend API           | http://localhost:8080/api/v1         |
| API Health Check      | http://localhost:8080/actuator/health|
| MinIO Console         | http://localhost:9001                |

**MinIO Console login:** `minioadmin` / `minio_secret_2026`

---

## Chạy Tests

### Backend (146 unit tests)

```bash
docker compose --profile test run --build backend-test
```

### Frontend (Vitest)

```bash
cd frontend && npm test
```

---

## Monitoring (tuỳ chọn)

```bash
docker compose -f docker-compose.monitoring.yml up -d
```

| Dịch vụ     | URL                    | Login              |
| ----------- | ---------------------- | ------------------ |
| Prometheus  | http://localhost:9090   | —                  |
| Grafana     | http://localhost:3001   | `admin` / `admin123` |

---

## Seed dữ liệu Production

Dùng script riêng với SSH tunnel:

```bash
# Cấu hình trong .env.prod hoặc truyền trực tiếp
PROD_API_URL=https://pcparts.example.com/api/v1/auth \
PROD_SSH_HOST=root@your-server-ip \
./bin/seed-data-prod
```

Xem chi tiết cấu hình trong `bin/seed-data-prod`.

---

## Cấu trúc thư mục `bin/`

| Script              | Mô tả                                                |
| ------------------- | ----------------------------------------------------- |
| `run-backend-dev`   | Chạy Spring Boot dev server (load `.env`, SDKMAN)     |
| `run-frontend-dev`  | Chạy Next.js dev server (load `.env`)                 |
| `seed-data`         | Seed tài khoản test trên local dev                    |
| `seed-data-prod`    | Seed tài khoản test trên server production (qua SSH)  |

---

## Dừng hệ thống

```bash
# Dừng infrastructure (giữ data)
docker compose down

# Dừng và xoá toàn bộ data (reset sạch)
docker compose down -v
```
