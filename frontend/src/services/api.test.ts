import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock localStorage
const store: Record<string, string> = {};
vi.stubGlobal("localStorage", {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, val: string) => { store[key] = val; },
  removeItem: (key: string) => { delete store[key]; },
});

// Must import after mocks
import { getToken, setToken, clearToken, ApiError } from "./api";

describe("Token management", () => {
  beforeEach(() => {
    Object.keys(store).forEach((k) => delete store[k]);
  });

  it("returns null when no token stored", () => {
    expect(getToken()).toBeNull();
  });

  it("stores and retrieves token", () => {
    setToken("abc123");
    expect(getToken()).toBe("abc123");
  });

  it("clears token", () => {
    setToken("abc123");
    clearToken();
    expect(getToken()).toBeNull();
  });
});

describe("ApiError", () => {
  it("creates error with status and message", () => {
    const err = new ApiError(404, "Not found", "not_found");
    expect(err.status).toBe(404);
    expect(err.message).toBe("Not found");
    expect(err.code).toBe("not_found");
    expect(err).toBeInstanceOf(Error);
  });
});
