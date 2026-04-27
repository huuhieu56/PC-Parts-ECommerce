import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ResetPasswordPage from "@/app/(auth)/auth/reset-password/page";
import api from "@/lib/api";

const push = vi.fn();
let token = "valid-reset-token";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => new URLSearchParams(token ? { token } : {}),
}));

vi.mock("@/lib/api", () => ({
  default: {
    post: vi.fn(),
  },
}));

const mockedPost = vi.mocked(api.post);

describe("ResetPasswordPage", () => {
  beforeEach(() => {
    token = "valid-reset-token";
    push.mockClear();
    mockedPost.mockReset();
  });

  it("shows a retry message instead of token-expired message when reset request fails without API message", async () => {
    mockedPost.mockRejectedValue(new Error("Network Error"));

    render(<ResetPasswordPage />);

    fireEvent.change(screen.getByLabelText("Mật khẩu mới"), {
      target: { value: "Password123" },
    });
    fireEvent.change(screen.getByLabelText("Xác nhận mật khẩu mới"), {
      target: { value: "Password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Đặt lại mật khẩu" }));

    await waitFor(() => {
      expect(screen.getByText("Không thể đặt lại mật khẩu. Vui lòng thử lại sau")).toBeInTheDocument();
    });
    expect(screen.queryByText("Liên kết đã hết hạn. Vui lòng yêu cầu lại")).not.toBeInTheDocument();
  });
});
