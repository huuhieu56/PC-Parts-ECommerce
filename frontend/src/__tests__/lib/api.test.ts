import { describe, it, expect, vi } from "vitest";
import api, {
  createBanner,
  deleteBanner,
  getAdminBanners,
  getBanners,
  reorderBanners,
  updateBanner,
} from "@/lib/api";

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

  it("should fetch public banners from the public endpoint", async () => {
    const getSpy = vi.spyOn(api, "get").mockResolvedValueOnce({ data: { data: [] } });

    await getBanners();

    expect(getSpy).toHaveBeenCalledWith("/banners");
    getSpy.mockRestore();
  });

  it("should fetch admin banners from the admin endpoint", async () => {
    const getSpy = vi.spyOn(api, "get").mockResolvedValueOnce({ data: { data: [] } });

    await getAdminBanners();

    expect(getSpy).toHaveBeenCalledWith("/admin/banners");
    getSpy.mockRestore();
  });

  it("should create banner with multipart form data", async () => {
    const postSpy = vi.spyOn(api, "post").mockResolvedValueOnce({ data: { data: { id: 1 } } });
    const file = new File(["image"], "banner.webp", { type: "image/webp" });

    await createBanner({
      title: "Sale GPU",
      image: file,
      linkUrl: "/products",
      sortOrder: 1,
      status: "ACTIVE",
    });

    const [url, formData, config] = postSpy.mock.calls[0];
    expect(url).toBe("/admin/banners");
    expect(formData).toBeInstanceOf(FormData);
    expect((formData as FormData).get("title")).toBe("Sale GPU");
    expect((formData as FormData).get("image")).toBe(file);
    expect(config).toEqual({ headers: { "Content-Type": "multipart/form-data" } });
    postSpy.mockRestore();
  });

  it("should update banner without requiring a new image", async () => {
    const putSpy = vi.spyOn(api, "put").mockResolvedValueOnce({ data: { data: { id: 1 } } });

    await updateBanner(1, {
      title: "Sale CPU",
      linkUrl: "/products?category=cpu",
      sortOrder: 2,
      status: "INACTIVE",
    });

    const [url, formData] = putSpy.mock.calls[0];
    expect(url).toBe("/admin/banners/1");
    expect((formData as FormData).get("title")).toBe("Sale CPU");
    expect((formData as FormData).get("image")).toBeNull();
    putSpy.mockRestore();
  });

  it("should reorder and delete banners through admin endpoints", async () => {
    const patchSpy = vi.spyOn(api, "patch").mockResolvedValueOnce({ data: { data: [] } });
    const deleteSpy = vi.spyOn(api, "delete").mockResolvedValueOnce({});

    await reorderBanners([{ id: 2, sortOrder: 1 }]);
    await deleteBanner(2);

    expect(patchSpy).toHaveBeenCalledWith("/admin/banners/reorder", [{ id: 2, sortOrder: 1 }]);
    expect(deleteSpy).toHaveBeenCalledWith("/admin/banners/2");
    patchSpy.mockRestore();
    deleteSpy.mockRestore();
  });
});
