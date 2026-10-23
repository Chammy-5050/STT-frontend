import { describe, expect, it } from "vitest";
import { loginSchema } from "@/features/auth/schemas";

describe("loginSchema", () => {
  it("accepts valid credentials and an optional remember-me value", () => {
    expect(
      loginSchema.safeParse({
        email: "person@example.com",
        password: "long-enough-password",
      }).success,
    ).toBe(true);
    expect(
      loginSchema.safeParse({
        email: "person@example.com",
        password: "long-enough-password",
        rememberMe: false,
      }).success,
    ).toBe(true);
  });

  it("requires a valid email and a password of at least eight characters", () => {
    expect(
      loginSchema.safeParse({
        email: "",
        password: "short",
        rememberMe: true,
      }).success,
    ).toBe(false);
    expect(
      loginSchema.safeParse({
        email: "not-an-email",
        password: "long-enough-password",
      }).success,
    ).toBe(false);
  });
});
