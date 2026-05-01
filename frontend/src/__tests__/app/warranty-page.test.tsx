import { render, screen, waitFor } from "@testing-library/react";
import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import WarrantyPage from "@/app/(shop)/warranty/page";
import api from "@/lib/api";

vi.mock("next/link", () => ({
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}));

vi.mock("@/lib/api", () => ({
  default: {
    get: vi.fn(),
  },
}));

const mockedGet = vi.mocked(api.get);

describe("WarrantyPage", () => {
  beforeEach(() => {
    mockedGet.mockReset();
  });

  it("loads current customer warranty requests from /warranty", async () => {
    mockedGet.mockResolvedValue({
      data: {
        data: {
          content: [
            {
              id: 1,
              productName: "RAM 32GB",
              status: "RECEIVED",
              issueDescription: "RAM bị lỗi",
              createdAt: "2026-05-01T10:00:00",
            },
          ],
        },
      },
    });

    render(<WarrantyPage />);

    await waitFor(() => {
      expect(mockedGet).toHaveBeenCalledWith("/warranty");
    });
    expect(await screen.findByText("RAM 32GB")).toBeInTheDocument();
    expect(screen.getByText("RAM bị lỗi")).toBeInTheDocument();
  });
});
