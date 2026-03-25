# HANDOFF.md — PC Parts E-Commerce

## Đã hoàn thành

### Backend (125/125 tests pass ✅)
- Phase 1: Auth & RBAC (JWT, Spring Security, 5 roles)
- Phase 2: Product Catalog, Shopping (Cart+Wishlist), Inventory
- Phase 3: Order & Payment, Coupon
- Phase 4: M05 Build PC, M08 Warranty, M09 Review
- V1-V9 Flyway migrations (34 tables)
- Docker backend healthy

### Backend Test Matrix

| Test Class | Tests | Module |
|---|---|---|
| AddressServiceTest | 10 | Auth |
| AuthServiceExtendedTest | 10 | Auth |
| AuthServiceTest | 3 | Auth |
| UserServiceTest | 7 | Auth |
| InventoryServiceTest | 8 | Inventory |
| CouponServiceTest | 9 | Coupon |
| OrderServiceTest | 15 | Order |
| BrandServiceTest | 9 | Product |
| CategoryServiceTest | 11 | Product |
| ProductServiceTest | 4 | Product |
| ReviewServiceTest | 3 | Review |
| CartServiceTest | 8 | Shopping |
| WishlistServiceTest | 5 | Shopping |
| WarrantyServiceTest | 4 | Warranty |
| PcBuildServiceTest | 19 | Build PC |
| **Tổng** | **125** | **0 failures** |

### Frontend (17/17 routes build pass ✅)

| Route | Mô tả |
|---|---|
| `/` | Homepage (hero, features) |
| `/products` | Product listing (search, filter, grid/list, pagination) |
| `/products/[slug]` | Product detail (gallery, specs, add-to-cart) |
| `/cart` | Cart (qty edit, remove, coupon) |
| `/checkout` | Checkout (address, payment, order summary) |
| `/orders` | Order history |
| `/orders/[id]` | Order detail (status timeline) |
| `/build-pc` | Build PC (slot-based builder) |
| `/wishlist` | Wishlist |
| `/login` | Login |
| `/register` | Register |
| `/admin` | Admin dashboard |
| `/admin/products` | Product management |
| `/admin/orders` | Order management |
| `/admin/inventory` | Inventory management |
| `/admin/coupons` | Coupon management |

## Còn pending
- [ ] M08 Warranty frontend
- [ ] M09 Review frontend (product page reviews)
- [ ] M10 Notification backend + frontend
- [ ] M11 Dashboard real data integration
- [ ] Frontend polish (responsive, SEO, animations)
- [ ] CI/CD & Monitoring

## Blocker
- VNPay/MoMo SDK: cần API keys thật cho integration test
- LLM AI compatibility: cần API key cho tính năng kiểm tra tương thích

## Bước tiếp theo đề xuất
1. Warranty/Review frontend pages
2. M10 Notification backend (email queue via Redis)
3. M11 Dashboard real data (revenue, top products)
4. CI/CD pipeline (GitHub Actions)
