import { describe, expect, it } from "vitest";
import { registerSchema } from "@/features/auth/schemas";

const validRegistration = {
  fullName: "Morgan Lee",
  phoneNo: "+255700000100",
  email: "morgan@example.com",
  password: "StrongPass1!",
  confirmPassword: "StrongPass1!",
  termsAccepted: true,
};

describe("registerSchema", () => {
  it("accepts valid registration data", () => {
    expect(registerSchema.safeParse(validRegistration).success).toBe(true);
  });

  it("rejects weak passwords and mismatched confirmation", () => {
    expect(
      registerSchema.safeParse({
        ...validRegistration,
        password: "weakpass",
        confirmPassword: "weakpass",
      }).success,
    ).toBe(false);

    const mismatch = registerSchema.safeParse({
      ...validRegistration,
      confirmPassword: "DifferentPass1!",
    });
    expect(mismatch.success).toBe(false);
    if (!mismatch.success) {
      expect(mismatch.error.issues).toContainEqual(
        expect.objectContaining({
          path: ["confirmPassword"],
          message: "Passwords do not match.",
        }),
      );
    }
  });

  it("requires the user to accept the terms", () => {
    expect(
      registerSchema.safeParse({
        ...validRegistration,
        termsAccepted: false,
      }).success,
    ).toBe(false);
  });
});
