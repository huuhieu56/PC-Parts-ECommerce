import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ReturnsPage from "@/app/(shop)/returns/page";
import api from "@/lib/api";

vi.mock("next/link", () => ({
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}));

vi.mock("@/lib/api", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const mockedGet = vi.mocked(api.get);
const mockedPost = vi.mocked(api.post);

describe("ReturnsPage", () => {
  beforeEach(() => {
    mockedGet.mockReset();
    mockedPost.mockReset();
  });

  it("loads current customer return requests from /returns/my", async () => {
    mockedGet.mockResolvedValue({
      data: {
        data: {
          content: [
            {
              id: 1,
              orderNumber: "ORD-000001",
              productName: "Intel Core i7",
              reason: "Sản phẩm lỗi",
              type: "REFUND",
              status: "PENDING_APPROVAL",
              createdAt: "2026-05-01T10:00:00",
            },
          ],
        },
      },
    });

    render(<ReturnsPage />);

    await waitFor(() => {
      expect(mockedGet).toHaveBeenCalledWith("/returns/my?page=0&size=20");
    });
    expect(await screen.findByText("Intel Core i7")).toBeInTheDocument();
    expect(screen.getByText("Lý do: Sản phẩm lỗi")).toBeInTheDocument();
  });

  it("creates a return request with numeric orderId and orderDetailId", async () => {
    mockedGet.mockImplementation((url: string) => {
      if (url === "/returns/my?page=0&size=20") {
        return Promise.resolve({ data: { data: { content: [] } } });
      }
      if (url === "/orders?page=0&size=50") {
        return Promise.resolve({
          data: {
            data: {
              content: [
                {
                  id: 1,
                  orderNumber: "ORD-000001",
                  status: "COMPLETED",
                  totalAmount: 1000000,
                  createdAt: "2026-05-01T10:00:00",
                },
              ],
            },
          },
        });
      }
      if (url === "/orders/1") {
        return Promise.resolve({
          data: {
            data: {
              id: 1,
              orderNumber: "ORD-000001",
              status: "COMPLETED",
              items: [
                {
                  id: 100,
                  productName: "Intel Core i7",
                  quantity: 1,
                  unitPrice: 1000000,
                  lineTotal: 1000000,
                },
              ],
            },
          },
        });
      }
      return Promise.resolve({ data: { data: {} } });
    });
    mockedPost.mockResolvedValue({ data: { data: { id: 10 } } });

    render(<ReturnsPage />);

    fireEvent.click(await screen.findByRole("button", { name: /Tạo yêu cầu/i }));
    fireEvent.change(await screen.findByLabelText("Đơn hàng"), { target: { value: "1" } });
    fireEvent.change(await screen.findByLabelText("Sản phẩm"), { target: { value: "100" } });
    fireEvent.change(screen.getByLabelText("Lý do"), { target: { value: "Sản phẩm lỗi" } });
    fireEvent.click(screen.getByRole("button", { name: /Gửi yêu cầu/i }));

    await waitFor(() => {
      expect(mockedPost).toHaveBeenCalledWith("/returns", {
        orderId: 1,
        orderDetailId: 100,
        reason: "Sản phẩm lỗi",
        type: "REFUND",
      });
    });
  });
});
