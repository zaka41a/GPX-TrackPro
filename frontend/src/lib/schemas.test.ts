import { describe, it, expect } from "vitest";
import {
  loginSchema,
  registerSchema,
  changePasswordSchema,
  communityPostSchema,
} from "./schemas";

describe("loginSchema", () => {
  it("accepts a valid email and password", () => {
    expect(loginSchema.safeParse({ email: "a@b.com", password: "x" }).success).toBe(true);
  });
  it("rejects an invalid email", () => {
    expect(loginSchema.safeParse({ email: "not-an-email", password: "x" }).success).toBe(false);
  });
  it("rejects an empty password", () => {
    expect(loginSchema.safeParse({ email: "a@b.com", password: "" }).success).toBe(false);
  });
});

describe("registerSchema", () => {
  it("requires a password of at least 8 characters", () => {
    const short = registerSchema.safeParse({ name: "Jane Doe", email: "a@b.com", password: "1234567" });
    expect(short.success).toBe(false);
    const ok = registerSchema.safeParse({ name: "Jane Doe", email: "a@b.com", password: "12345678" });
    expect(ok.success).toBe(true);
  });
  it("requires a name of at least 2 characters", () => {
    expect(registerSchema.safeParse({ name: "J", email: "a@b.com", password: "12345678" }).success).toBe(false);
  });
});

describe("changePasswordSchema", () => {
  it("fails when confirmation does not match", () => {
    const res = changePasswordSchema.safeParse({
      currentPassword: "old",
      newPassword: "newpass12",
      confirmPassword: "different",
    });
    expect(res.success).toBe(false);
  });
  it("passes when confirmation matches", () => {
    const res = changePasswordSchema.safeParse({
      currentPassword: "old",
      newPassword: "newpass12",
      confirmPassword: "newpass12",
    });
    expect(res.success).toBe(true);
  });
});

describe("communityPostSchema", () => {
  it("rejects empty content", () => {
    expect(communityPostSchema.safeParse({ content: "" }).success).toBe(false);
  });
  it("rejects content over 5000 characters", () => {
    expect(communityPostSchema.safeParse({ content: "a".repeat(5001) }).success).toBe(false);
  });
});
