import { render, screen, waitFor } from "@testing-library/react";
import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Header } from "@/components/layout/Header";
import { useAuthStore } from "@/stores/auth-store";
import type { UserProfile } from "@/types";

vi.mock("next/link", () => ({
  default: ({ href, children, className, onClick }: { href: string; children: React.ReactNode; className?: string; onClick?: () => void }) => (
    <a href={href} className={className} onClick={onClick}>{children}</a>
  ),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/lib/api", () => ({
  default: {
    get: vi.fn(),
  },
}));

const customer: UserProfile = {
  id: 1,
  email: "customer@pcparts.com",
  fullName: "Nguyễn Văn A",
  phone: "0901234567",
  avatarUrl: null,
  dateOfBirth: null,
  gender: "MALE",
  role: "CUSTOMER",
  permissions: [],
};

const resetAuthStore = () => {
  useAuthStore.setState({
    user: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
  });
  localStorage.clear();
};

describe("Header user menu", () => {
  beforeEach(() => {
    resetAuthStore();
  });

  it("shows the user's avatar above their name when avatarUrl exists", async () => {
    useAuthStore.getState().setAuth(
      { ...customer, avatarUrl: "http://localhost:9000/pcparts/avatars/customer.webp" },
      "access-token",
      "refresh-token"
    );

    render(<Header />);

    await waitFor(() => {
      expect(screen.getByLabelText("Mở menu tài khoản")).toBeInTheDocument();
    });
    expect(screen.getByRole("img", { name: "Nguyễn Văn A avatar" })).toHaveStyle({
      backgroundImage: "url(http://localhost:9000/pcparts/avatars/customer.webp)",
    });
    expect(screen.getByText("Nguyễn Văn A")).toBeInTheDocument();
  });

  it("falls back to the user icon while still showing the user's name", async () => {
    useAuthStore.getState().setAuth(customer, "access-token", "refresh-token");

    render(<Header />);

    await waitFor(() => {
      expect(screen.getByLabelText("Mở menu tài khoản")).toBeInTheDocument();
    });
    expect(screen.queryByRole("img", { name: "Nguyễn Văn A avatar" })).not.toBeInTheDocument();
    expect(screen.getByText("Nguyễn Văn A")).toBeInTheDocument();
  });
});
