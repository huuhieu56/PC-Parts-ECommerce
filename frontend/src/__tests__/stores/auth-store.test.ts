import { describe, it, expect, beforeEach } from "vitest";
import { useAuthStore } from "@/stores/auth-store";
import type { UserProfile } from "@/types";

const mockUser: UserProfile = {
  id: 1,
  email: "test@example.com",
  fullName: "Test User",
  phone: "0901234567",
  avatarUrl: null,
  dateOfBirth: null,
  gender: null,
  role: "CUSTOMER",
  permissions: [],
};

describe("useAuthStore", () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth();
    localStorage.clear();
  });

  it("should start with default unauthenticated state", () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(state.refreshToken).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it("should set auth state with setAuth", () => {
    useAuthStore.getState().setAuth(mockUser, "access_123", "refresh_456");

    const state = useAuthStore.getState();
    expect(state.user).toEqual(mockUser);
    expect(state.accessToken).toBe("access_123");
    expect(state.refreshToken).toBe("refresh_456");
    expect(state.isAuthenticated).toBe(true);
  });

  it("should store tokens in localStorage when setAuth is called", () => {
    useAuthStore.getState().setAuth(mockUser, "access_123", "refresh_456");

    expect(localStorage.getItem("accessToken")).toBe("access_123");
    expect(localStorage.getItem("refreshToken")).toBe("refresh_456");
  });

  it("should clear auth state with clearAuth", () => {
    useAuthStore.getState().setAuth(mockUser, "access_123", "refresh_456");
    useAuthStore.getState().clearAuth();

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(state.refreshToken).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it("should remove tokens from localStorage when clearAuth is called", () => {
    useAuthStore.getState().setAuth(mockUser, "access_123", "refresh_456");
    useAuthStore.getState().clearAuth();

    expect(localStorage.getItem("accessToken")).toBeNull();
    expect(localStorage.getItem("refreshToken")).toBeNull();
  });

  it("should update user with updateUser", () => {
    useAuthStore.getState().setAuth(mockUser, "access_123", "refresh_456");
    useAuthStore.getState().updateUser({ fullName: "Updated Name" });

    const state = useAuthStore.getState();
    expect(state.user?.fullName).toBe("Updated Name");
    expect(state.user?.email).toBe("test@example.com");
  });

  it("should not update user when user is null", () => {
    useAuthStore.getState().updateUser({ fullName: "Updated Name" });

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
  });

  it("should keep other user fields when updateUser is called", () => {
    useAuthStore.getState().setAuth(mockUser, "access_123", "refresh_456");
    useAuthStore.getState().updateUser({ phone: "0909999999" });

    const state = useAuthStore.getState();
    expect(state.user?.phone).toBe("0909999999");
    expect(state.user?.id).toBe(1);
    expect(state.user?.role).toBe("CUSTOMER");
  });
});
