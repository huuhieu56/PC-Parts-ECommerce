import { describe, it, expect } from "vitest";
import api from "@/lib/api";

describe("API Client", () => {
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
