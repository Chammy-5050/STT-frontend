import { describe, expect, it } from "vitest";
import { normalizeApiError } from "@/lib/api-client";

describe("normalizeApiError", () => {
  it("maps DRF field errors and detail into an ApiError", () => {
    const error = normalizeApiError(
      {
        email: ["Enter a valid email address."],
        detail: "Invalid email or password.",
      },
      400,
    );

    expect(error.status).toBe(400);
    expect(error.fieldErrors).toEqual({
      email: "Enter a valid email address.",
    });
    expect(error.detail).toBe("Invalid email or password.");
  });

  it("uses an explicit fallback for server errors", () => {
    const error = normalizeApiError({}, 500);

    expect(error.message).toBe("The service is temporarily unavailable.");
    expect(error.status).toBe(500);
  });
});
