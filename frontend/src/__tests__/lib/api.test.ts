import { describe, it, expect } from "vitest";
import api from "@/lib/api";

type InterceptorHandler = {
  fulfilled?: (value: unknown) => unknown;
  rejected?: (error: unknown) => Promise<unknown>;
};

const getRequestFulfilled = () => {
  const handlers = (api.interceptors.request as unknown as { handlers: InterceptorHandler[] }).handlers;
  return handlers[0]?.fulfilled as (config: { url?: string; headers: Record<string, string> }) => {
    url?: string;
    headers: Record<string, string>;
  };
};

const getResponseRejected = () => {
  const handlers = (api.interceptors.response as unknown as { handlers: InterceptorHandler[] }).handlers;
  return handlers[0]?.rejected as (error: {
    config?: { url?: string; _retry?: boolean; headers?: Record<string, string> };
    response?: { status?: number };
  }) => Promise<unknown>;
};

describe("API Client", () => {
  it("should not attach Authorization header for auth endpoints", () => {
    localStorage.setItem("accessToken", "test-token");

    const fulfilled = getRequestFulfilled();
    const config = fulfilled({ url: "/auth/login", headers: {} });

    expect(config.headers.Authorization).toBeUndefined();
  });

  it("should attach Authorization header for non-auth endpoints", () => {
    localStorage.setItem("accessToken", "test-token");

    const fulfilled = getRequestFulfilled();
    const config = fulfilled({ url: "/orders", headers: {} });

    expect(config.headers.Authorization).toBe("Bearer test-token");
  });

  it("should not trigger session-expired flow for login 401 errors", async () => {
    localStorage.setItem("accessToken", "existing-access");
    localStorage.setItem("refreshToken", "existing-refresh");

    const rejected = getResponseRejected();
    const loginError = {
      config: { url: "/auth/login", headers: {} },
      response: { status: 401 },
    };

    await expect(rejected(loginError)).rejects.toBe(loginError);
    expect(localStorage.getItem("accessToken")).toBe("existing-access");
    expect(localStorage.getItem("refreshToken")).toBe("existing-refresh");
  });

  it("should have correct baseURL", () => {
    expect(api.defaults.baseURL).toBe("http://localhost/api/v1");
  });

  it("should have Content-Type header set to application/json", () => {
    expect(api.defaults.headers["Content-Type"]).toBe("application/json");
  });

  it("should have request interceptors configured", () => {
    // Axios interceptors manager has handlers array
    const interceptors = api.interceptors.request as unknown as { handlers: unknown[] };
    expect(interceptors.handlers.length).toBeGreaterThan(0);
  });

  it("should have response interceptors configured", () => {
    const interceptors = api.interceptors.response as unknown as { handlers: unknown[] };
    expect(interceptors.handlers.length).toBeGreaterThan(0);
  });
});
