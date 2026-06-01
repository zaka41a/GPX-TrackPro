import { describe, it, expect, vi, beforeEach } from "vitest";

const store: Record<string, string> = {};
vi.stubGlobal("localStorage", {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, val: string) => { store[key] = val; },
  removeItem: (key: string) => { delete store[key]; },
});

import { apiFetch, setToken, ApiError } from "./api";

function mockResponse(body: unknown, init: { status?: number; ok?: boolean } = {}) {
  const status = init.status ?? 200;
  return {
    ok: init.ok ?? (status >= 200 && status < 300),
    status,
    json: async () => body,
  } as Response;
}

describe("apiFetch", () => {
  beforeEach(() => {
    Object.keys(store).forEach((k) => delete store[k]);
    vi.restoreAllMocks();
  });

  it("attaches the bearer token when auth is required", async () => {
    setToken("tok_123");
    const fetchMock = vi.fn().mockResolvedValue(mockResponse({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    await apiFetch("/api/thing", undefined, true);

    const headers = fetchMock.mock.calls[0][1].headers as Headers;
    expect(headers.get("Authorization")).toBe("Bearer tok_123");
  });

  it("throws 401 without calling fetch when auth required but no token", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(apiFetch("/api/thing", undefined, true)).rejects.toMatchObject({
      status: 401,
      code: "unauthorized",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sets a JSON content-type by default", async () => {
    const fetchMock = vi.fn().mockResolvedValue(mockResponse({}));
    vi.stubGlobal("fetch", fetchMock);

    await apiFetch("/api/thing", { method: "POST", body: "{}" });

    const headers = fetchMock.mock.calls[0][1].headers as Headers;
    expect(headers.get("Content-Type")).toBe("application/json");
  });

  it("parses backend error body into an ApiError", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      mockResponse({ error: "nope", code: "bad" }, { status: 400, ok: false }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const err = (await apiFetch("/api/thing").catch((e) => e)) as ApiError;
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(400);
    expect(err.message).toBe("nope");
    expect(err.code).toBe("bad");
  });

  it("tags 402 responses as SUBSCRIPTION_REQUIRED", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      mockResponse({ error: "pay" }, { status: 402, ok: false }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const err = (await apiFetch("/api/thing").catch((e) => e)) as ApiError;
    expect(err.code).toBe("SUBSCRIPTION_REQUIRED");
  });

  it("returns undefined on 204 No Content", async () => {
    const fetchMock = vi.fn().mockResolvedValue(mockResponse(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await apiFetch("/api/thing");
    expect(result).toBeUndefined();
  });
});
