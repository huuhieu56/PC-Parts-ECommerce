import { describe, it, expect } from "vitest";
import type {
  ApiResponse,
  PageResponse,
  UserProfile,
  Product,
  CartDto,
  Order,
  Coupon,
  InventoryDto,
  PcBuild,
  WarrantyTicket,
} from "@/types";

describe("Type definitions", () => {
  it("should create valid ApiResponse", () => {
    const response: ApiResponse<string> = {
      status: 200,
      message: "Success",
      data: "test",
      timestamp: "2026-01-01T00:00:00",
    };
    expect(response.status).toBe(200);
    expect(response.data).toBe("test");
  });

  it("should create valid PageResponse", () => {
    const page: PageResponse<number> = {
      content: [1, 2, 3],
      page: 0,
      size: 10,
      totalElements: 3,
      totalPages: 1,
      last: true,
    };
    expect(page.content).toHaveLength(3);
    expect(page.last).toBe(true);
  });

  it("should create valid UserProfile", () => {
    const user: UserProfile = {
      id: 1,
      email: "test@example.com",
      fullName: "Test User",
      phone: "0901234567",
      avatarUrl: null,
      dateOfBirth: null,
      gender: null,
      role: "CUSTOMER",
    };
    expect(user.role).toBe("CUSTOMER");
    expect(user.phone).toBe("0901234567");
  });

  it("should create valid Product", () => {
    const product: Product = {
      id: 1,
      name: "RTX 4090",
      sku: "GPU-4090",
      slug: "rtx-4090",
      originalPrice: 45000000,
      sellingPrice: 43000000,
      description: "Graphics card",
      categoryId: 1,
      categoryName: "GPU",
      brandId: 1,
      brandName: "NVIDIA",
      condition: "NEW",
      status: "ACTIVE",
      images: [],
      attributes: [],
    };
    expect(product.condition).toBe("NEW");
    expect(product.status).toBe("ACTIVE");
  });

  it("should create valid CartDto", () => {
    const cart: CartDto = {
      items: [],
      totalPrice: 0,
      totalItems: 0,
    };
    expect(cart.items).toHaveLength(0);
  });

  it("should create valid Order", () => {
    const order: Order = {
      id: 1,
      subtotal: 100000,
      discountAmount: 0,
      totalAmount: 100000,
      status: "PENDING",
      note: null,
      createdAt: "2026-01-01",
      items: [],
    };
    expect(order.status).toBe("PENDING");
  });

  it("should create valid Coupon", () => {
    const coupon: Coupon = {
      id: 1,
      code: "SAVE10",
      discountType: "PERCENTAGE",
      discountValue: 10,
      minOrderValue: 500000,
      maxDiscount: 100000,
      maxUses: 100,
      usedCount: 5,
      startDate: "2026-01-01",
      endDate: "2026-12-31",
    };
    expect(coupon.discountType).toBe("PERCENTAGE");
  });

  it("should create valid InventoryDto", () => {
    const inv: InventoryDto = {
      productId: 1,
      productName: "RAM 16GB",
      quantity: 100,
      reservedQuantity: 10,
      availableQuantity: 90,
    };
    expect(inv.availableQuantity).toBe(90);
  });

  it("should create valid PcBuild", () => {
    const build: PcBuild = {
      id: 1,
      name: "Gaming PC",
      totalPrice: 50000000,
      status: "DRAFT",
      components: [],
      createdAt: "2026-01-01",
    };
    expect(build.status).toBe("DRAFT");
  });

  it("should create valid WarrantyTicket", () => {
    const ticket: WarrantyTicket = {
      id: 1,
      orderId: 10,
      productName: "RTX 4090",
      issueDescription: "Fan noise",
      status: "PENDING",
      createdAt: "2026-01-01",
    };
    expect(ticket.status).toBe("PENDING");
  });
});
