import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UserProfile } from "@/types";

interface AuthState {
  user: UserProfile | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;

  setAuth: (user: UserProfile, accessToken: string, refreshToken: string) => void;
  clearAuth: () => void;
  updateUser: (user: Partial<UserProfile>) => void;

  // Permission helpers
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  isStaff: () => boolean;
}

/**
 * Zustand auth store with localStorage persistence.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      setAuth: (user, accessToken, refreshToken) => {
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", refreshToken);
        set({ user, accessToken, refreshToken, isAuthenticated: true });
      },

      clearAuth: () => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      },

      updateUser: (updates) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        }));
      },

      /**
       * Check if user has a specific permission.
       * ADMIN role has all permissions.
       */
      hasPermission: (permission: string) => {
        const { user } = get();
        if (!user) return false;
        if (user.role === "ADMIN") return true;
        return user.permissions?.includes(permission) ?? false;
      },

      /**
       * Check if user has ANY of the given permissions.
       */
      hasAnyPermission: (permissions: string[]) => {
        const { user, hasPermission } = get();
        if (!user) return false;
        if (user.role === "ADMIN") return true;
        return permissions.some((p) => hasPermission(p));
      },

      /**
       * Check if user is a staff member (non-CUSTOMER).
       */
      isStaff: () => {
        const { user } = get();
        return !!user && user.role !== "CUSTOMER";
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
