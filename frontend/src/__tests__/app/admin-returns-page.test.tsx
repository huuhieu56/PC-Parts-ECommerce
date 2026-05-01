import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AdminReturnsPage from "@/app/(admin)/admin/returns/page";
import api from "@/lib/api";

vi.mock("@/lib/api", () => ({
  default: {
    get: vi.fn(),
    put: vi.fn(),
  },
}));

const mockedGet = vi.mocked(api.get);

describe("AdminReturnsPage", () => {
  beforeEach(() => {
    mockedGet.mockReset();
  });

  it("normalizes Spring Page metadata before rendering pagination", async () => {
    mockedGet.mockResolvedValue({
      data: {
        data: {
          content: [
            {
              id: 1,
              orderNumber: "ORD-000001",
              customerName: "Nguyễn Văn A",
              productName: "Intel Core i7",
              reason: "Lỗi sản phẩm",
              type: "REFUND",
              status: "PENDING_APPROVAL",
              refundAmount: 1000000,
              createdAt: "2026-05-01T10:00:00",
            },
          ],
          number: 0,
          size: 15,
          totalElements: 1,
          totalPages: 1,
          first: true,
          last: true,
        },
      },
    });

    render(<AdminReturnsPage />);

    await waitFor(() => {
      expect(mockedGet).toHaveBeenCalledWith("/returns?page=0&size=15");
    });
    expect(await screen.findByText("Intel Core i7")).toBeInTheDocument();
    expect(screen.getByText((_, element) =>
      element?.textContent === "Hiển thị 1–1 trong 1 kết quả"
    )).toBeInTheDocument();
  });
});
