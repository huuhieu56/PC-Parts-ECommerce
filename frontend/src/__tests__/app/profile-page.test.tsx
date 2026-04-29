import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ProfilePage from "@/app/(shop)/profile/page";
import api from "@/lib/api";

vi.mock("next/link", () => ({
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}));

vi.mock("@/lib/api", () => ({
  default: {
    get: vi.fn(),
    put: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockedGet = vi.mocked(api.get);
const mockedPut = vi.mocked(api.put);
const mockedPost = vi.mocked(api.post);

const profilePayload = {
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

describe("ProfilePage", () => {
  beforeEach(() => {
    mockedGet.mockReset();
    mockedPut.mockReset();
    mockedPost.mockReset();
    mockedGet.mockResolvedValue({ data: { data: profilePayload } });
  });

  it("loads customer profile from /users/me without loading addresses on the profile tab", async () => {
    render(<ProfilePage />);

    await waitFor(() => {
      expect(screen.getAllByText("Nguyễn Văn A").length).toBeGreaterThan(0);
    });

    expect(mockedGet).toHaveBeenCalledWith("/users/me");
    expect(mockedGet).not.toHaveBeenCalledWith("/users/addresses");
    expect(screen.getAllByText("customer@pcparts.com").length).toBeGreaterThan(0);
  });

  it("updates profile through /users/me with only editable profile fields", async () => {
    mockedPut.mockResolvedValue({
      data: {
        data: {
          ...profilePayload,
          fullName: "Nguyễn Văn B",
          phone: "0907654321",
          dateOfBirth: "1995-05-15",
          gender: "FEMALE",
        },
      },
    });

    render(<ProfilePage />);
    await screen.findAllByText("Nguyễn Văn A");

    fireEvent.click(screen.getByRole("button", { name: /Chỉnh sửa/i }));
    fireEvent.change(screen.getByLabelText("Họ và tên"), { target: { value: "Nguyễn Văn B" } });
    fireEvent.change(screen.getByLabelText("Số điện thoại"), { target: { value: "0907654321" } });
    fireEvent.change(screen.getByLabelText("Ngày sinh"), { target: { value: "1995-05-15" } });
    fireEvent.change(screen.getByLabelText("Giới tính"), { target: { value: "FEMALE" } });
    fireEvent.click(screen.getByRole("button", { name: /Lưu/i }));

    await waitFor(() => {
      expect(mockedPut).toHaveBeenCalledWith("/users/me", {
        fullName: "Nguyễn Văn B",
        phone: "0907654321",
        dateOfBirth: "1995-05-15",
        gender: "FEMALE",
      });
    });
  });

  it("rejects invalid phone before sending profile update", async () => {
    render(<ProfilePage />);
    await screen.findAllByText("Nguyễn Văn A");

    fireEvent.click(screen.getByRole("button", { name: /Chỉnh sửa/i }));
    fireEvent.change(screen.getByLabelText("Số điện thoại"), { target: { value: "123" } });
    fireEvent.click(screen.getByRole("button", { name: /Lưu/i }));

    expect(await screen.findByText("SĐT không hợp lệ.")).toBeInTheDocument();
    expect(mockedPut).not.toHaveBeenCalled();
  });

  it("uploads avatar through /users/me/avatar with multipart form data", async () => {
    mockedPost.mockResolvedValue({
      data: {
        data: {
          ...profilePayload,
          avatarUrl: "http://localhost:9000/pcparts/avatars/avatar.webp",
        },
      },
    });

    const { container } = render(<ProfilePage />);
    await screen.findAllByText("Nguyễn Văn A");

    const file = new File(["avatar"], "avatar.webp", { type: "image/webp" });
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      const [url, formData, config] = mockedPost.mock.calls[0];
      expect(url).toBe("/users/me/avatar");
      expect(formData).toBeInstanceOf(FormData);
      expect((formData as FormData).get("avatar")).toBe(file);
      expect(config).toEqual({ headers: { "Content-Type": "multipart/form-data" } });
    });
  });
});
