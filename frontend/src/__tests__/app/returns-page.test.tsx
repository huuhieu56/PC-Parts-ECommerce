import { render, screen, waitFor } from "@testing-library/react";
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

describe("ReturnsPage", () => {
  beforeEach(() => {
    mockedGet.mockReset();
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
});
