import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ProfilePage from "@/app/(shop)/profile/page";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import type { UserProfile } from "@/types";

vi.mock("next/link", () => ({
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}));

vi.mock("@/lib/api", () => ({
  default: {
    get: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockedGet = vi.mocked(api.get);
const mockedPut = vi.mocked(api.put);
const mockedPatch = vi.mocked(api.patch);
const mockedPost = vi.mocked(api.post);
const mockedDelete = vi.mocked(api.delete);

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
} satisfies UserProfile;

describe("ProfilePage", () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
    });
    localStorage.clear();
    mockedGet.mockReset();
    mockedPut.mockReset();
    mockedPatch.mockReset();
    mockedPost.mockReset();
    mockedDelete.mockReset();
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
    useAuthStore.getState().setAuth(profilePayload, "access-token", "refresh-token");
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
      expect(useAuthStore.getState().user?.fullName).toBe("Nguyễn Văn B");
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
    useAuthStore.getState().setAuth(profilePayload, "access-token", "refresh-token");
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
      expect(useAuthStore.getState().user?.avatarUrl).toBe("http://localhost:9000/pcparts/avatars/avatar.webp");
    });
  });

  it("loads address book only after selecting the address tab", async () => {
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
      return Promise.resolve({ data: { data: profilePayload } });
    });

    render(<ProfilePage />);
    await screen.findAllByText("Nguyễn Văn A");
    fireEvent.click(screen.getByRole("button", { name: /Sổ địa chỉ/i }));

    expect(await screen.findByText("123 Xuân Thủy, Dịch Vọng, Cầu Giấy, Hà Nội")).toBeInTheDocument();
    expect(mockedGet).toHaveBeenCalledWith("/users/addresses");
  });

  it("sets a default address through PATCH /users/addresses/{id}/default", async () => {
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
              {
                id: 11,
                label: "Cơ quan",
                receiverName: "Nguyễn Văn A",
                receiverPhone: "0901234567",
                province: "Hà Nội",
                district: "Thanh Xuân",
                ward: "Nhân Chính",
                street: "456 Nguyễn Trãi",
                isDefault: false,
              },
            ],
          },
        });
      }
      return Promise.resolve({ data: { data: profilePayload } });
    });
    mockedPatch.mockResolvedValue({ data: { data: { id: 11, isDefault: true } } });

    render(<ProfilePage />);
    await screen.findAllByText("Nguyễn Văn A");
    fireEvent.click(screen.getByRole("button", { name: /Sổ địa chỉ/i }));
    await screen.findByText("Cơ quan");
    fireEvent.click(screen.getByRole("button", { name: /Đặt mặc định/i }));

    await waitFor(() => {
      expect(mockedPatch).toHaveBeenCalledWith("/users/addresses/11/default");
    });
  });

  it("rejects address outside Hanoi before sending create request", async () => {
    mockedGet.mockImplementation((url: string) => {
      if (url === "/users/addresses") {
        return Promise.resolve({ data: { data: [] } });
      }
      return Promise.resolve({ data: { data: profilePayload } });
    });

    render(<ProfilePage />);
    await screen.findAllByText("Nguyễn Văn A");
    fireEvent.click(screen.getByRole("button", { name: /Sổ địa chỉ/i }));
    fireEvent.click(await screen.findByRole("button", { name: /Thêm địa chỉ/i }));
    fireEvent.change(screen.getByLabelText("Tên người nhận"), { target: { value: "Nguyễn Văn A" } });
    fireEvent.change(screen.getByLabelText("SĐT người nhận"), { target: { value: "0901234567" } });
    fireEvent.change(screen.getByLabelText("Tỉnh/Thành phố"), { target: { value: "Hồ Chí Minh" } });
    fireEvent.change(screen.getByLabelText("Quận/Huyện"), { target: { value: "Quận 1" } });
    fireEvent.change(screen.getByLabelText("Phường/Xã"), { target: { value: "Bến Nghé" } });
    fireEvent.change(screen.getByLabelText("Số nhà, đường"), { target: { value: "1 Lê Lợi" } });
    fireEvent.click(screen.getByRole("button", { name: /^Lưu$/i }));

    expect(await screen.findByText("Địa chỉ nằm ngoài vùng giao hàng hỗ trợ.")).toBeInTheDocument();
    expect(mockedPost).not.toHaveBeenCalledWith("/users/addresses", expect.anything());
  });

  it("updates an existing address through PUT /users/addresses/{id}", async () => {
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
      return Promise.resolve({ data: { data: profilePayload } });
    });
    mockedPut.mockResolvedValue({
      data: {
        data: {
          id: 10,
          label: "Nhà mới",
          receiverName: "Nguyễn Văn A",
          receiverPhone: "0901234567",
          province: "Hà Nội",
          district: "Cầu Giấy",
          ward: "Dịch Vọng",
          street: "789 Xuân Thủy",
          isDefault: true,
        },
      },
    });

    render(<ProfilePage />);
    await screen.findAllByText("Nguyễn Văn A");
    fireEvent.click(screen.getByRole("button", { name: /Sổ địa chỉ/i }));
    await screen.findByText("123 Xuân Thủy, Dịch Vọng, Cầu Giấy, Hà Nội");
    fireEvent.click(screen.getByRole("button", { name: /Sửa địa chỉ/i }));
    fireEvent.change(screen.getByLabelText("Nhãn địa chỉ"), { target: { value: "Nhà mới" } });
    fireEvent.change(screen.getByLabelText("Số nhà, đường"), { target: { value: "789 Xuân Thủy" } });
    fireEvent.click(screen.getByRole("button", { name: /^Lưu$/i }));

    await waitFor(() => {
      expect(mockedPut).toHaveBeenCalledWith("/users/addresses/10", expect.objectContaining({
        label: "Nhà mới",
        street: "789 Xuân Thủy",
      }));
    });
  });

  it("does not delete the only address from the address book UI", async () => {
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
      return Promise.resolve({ data: { data: profilePayload } });
    });

    render(<ProfilePage />);
    await screen.findAllByText("Nguyễn Văn A");
    fireEvent.click(screen.getByRole("button", { name: /Sổ địa chỉ/i }));
    await screen.findByText("123 Xuân Thủy, Dịch Vọng, Cầu Giấy, Hà Nội");
    fireEvent.click(screen.getByRole("button", { name: /Xóa địa chỉ/i }));

    expect(await screen.findByText("Bạn cần tạo địa chỉ mới trước khi xóa.")).toBeInTheDocument();
    expect(mockedDelete).not.toHaveBeenCalled();
  });
});
