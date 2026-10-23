import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/auth/register/route";

const validPayload = {
  fullName: "Morgan Lee",
  email: "morgan@example.com",
  password: "StrongPass1!",
  confirmPassword: "StrongPass1!",
  termsAccepted: true,
};

function registrationRequest(
  payload: unknown,
  headers: Record<string, string> = {},
) {
  return new NextRequest("http://localhost/api/auth/register/", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(payload),
  });
}

describe("POST /api/auth/register/", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("validates registration data before forwarding it", async () => {
    vi.stubEnv("MOCK_AUTH", "true");
    const response = await POST(
      registrationRequest({ ...validPayload, password: "weak" }),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.password).toContain("Use at least 8 characters.");
  });

  it("marks mock registration as simulated and never returns credentials", async () => {
    vi.stubEnv("MOCK_AUTH", "true");
    const response = await POST(registrationRequest(validPayload));
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.simulated).toBe(true);
    expect(body.detail).toContain("No account was saved");
    expect(JSON.stringify(body)).not.toContain(validPayload.password);
    expect(response.headers.get("set-cookie")).toBeNull();
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("rejects oversized registration requests", async () => {
    vi.stubEnv("MOCK_AUTH", "true");
    const response = await POST(
      registrationRequest(validPayload, { "content-length": "20000" }),
    );

    expect(response.status).toBe(413);
  });
});
