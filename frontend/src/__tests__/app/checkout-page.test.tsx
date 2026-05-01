import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CheckoutPage from "@/app/(shop)/checkout/page";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { useCartStore } from "@/stores/cart-store";
import type { UserProfile } from "@/types";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}));

vi.mock("@/lib/api", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockedGet = vi.mocked(api.get);
const mockedPost = vi.mocked(api.post);
const mockedDelete = vi.mocked(api.delete);

const customer = {
  id: 1,
  email: "customer@pcparts.com",
  fullName: "Nguyễn Văn A",
  phone: "0901234567",
  avatarUrl: null,
  dateOfBirth: null,
  gender: "MALE",
  role: "CUSTOMER",
  permissions: [],
} satisfies UserProfile;

describe("CheckoutPage", () => {
  beforeEach(() => {
    push.mockReset();
    mockedGet.mockReset();
    mockedPost.mockReset();
    mockedDelete.mockReset();
    localStorage.clear();
    useAuthStore.setState({
      user: customer,
      accessToken: "access-token",
      refreshToken: "refresh-token",
      isAuthenticated: true,
    });
    useCartStore.setState({
      items: [
        {
          id: 1,
          productId: 100,
          productName: "Intel Core i7",
          productImage: null,
          sellingPrice: 1000000,
          quantity: 1,
        },
      ],
      totalPrice: 1000000,
      totalItems: 1,
      loading: false,
      fetchCart: vi.fn().mockResolvedValue(undefined),
      clearCart: vi.fn().mockResolvedValue(undefined),
    });
  });

  it("uses the default addressId when placing an order", async () => {
    mockedGet.mockImplementation((url: string) => {
      if (url === "/users/addresses") {
        return Promise.resolve({
          data: {
            data: [
              {
                id: 10,
                label: "Nhà",
                receiverName: "Nguyễn Văn A",
                receiverPhone: "0901234567",
                province: "Hà Nội",
                district: "Cầu Giấy",
                ward: "Dịch Vọng",
                street: "123 Xuân Thủy",
                isDefault: true,
              },
            ],
          },
        });
      }
      return Promise.resolve({ data: { data: {} } });
    });
    mockedPost.mockResolvedValue({ data: { data: { id: 200, orderNumber: "ORD-000200" } } });

    render(<CheckoutPage />);
    expect(await screen.findByText("123 Xuân Thủy, Dịch Vọng, Cầu Giấy, Hà Nội")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /ĐẶT HÀNG/i }));

    await waitFor(() => {
      expect(mockedPost).toHaveBeenCalledWith("/orders", expect.objectContaining({
        addressId: 10,
        paymentMethod: "COD",
      }));
      expect(mockedPost).not.toHaveBeenCalledWith("/orders", expect.objectContaining({
        shippingAddress: expect.anything(),
      }));
      expect(push).toHaveBeenCalledWith("/checkout/success?orderNumber=ORD-000200");
    });
  });

  it("creates a new address during checkout, then places the order with its addressId", async () => {
    mockedGet.mockImplementation((url: string) => {
      if (url === "/users/addresses") {
        return Promise.resolve({ data: { data: [] } });
      }
      return Promise.resolve({ data: { data: {} } });
    });
    mockedPost.mockImplementation((url: string) => {
      if (url === "/users/addresses") {
        return Promise.resolve({
          data: {
            data: {
              id: 30,
              label: "Checkout",
              receiverName: "Nguyễn Văn A",
              receiverPhone: "0901234567",
              province: "Hà Nội",
              district: "Cầu Giấy",
              ward: "Dịch Vọng",
              street: "123 Xuân Thủy",
              isDefault: true,
            },
          },
        });
      }
      return Promise.resolve({ data: { data: { id: 201, orderNumber: "ORD-000201" } } });
    });

    render(<CheckoutPage />);
    await screen.findByText("Chưa có địa chỉ giao hàng");
    fireEvent.change(screen.getByLabelText("Họ tên *"), { target: { value: "Nguyễn Văn A" } });
    fireEvent.change(screen.getByLabelText("Số điện thoại *"), { target: { value: "0901234567" } });
    fireEvent.change(screen.getByLabelText("Địa chỉ *"), { target: { value: "123 Xuân Thủy" } });
    fireEvent.change(screen.getByLabelText("Quận/Huyện *"), { target: { value: "Cầu Giấy" } });
    fireEvent.change(screen.getByLabelText("Phường/Xã *"), { target: { value: "Dịch Vọng" } });
    fireEvent.click(screen.getByRole("button", { name: /ĐẶT HÀNG/i }));

    await waitFor(() => {
      expect(mockedPost).toHaveBeenCalledWith("/users/addresses", expect.objectContaining({
        receiverName: "Nguyễn Văn A",
        district: "Cầu Giấy",
        isDefault: true,
      }));
      expect(mockedPost).toHaveBeenCalledWith("/orders", expect.objectContaining({
        addressId: 30,
      }));
    });
  });
});
