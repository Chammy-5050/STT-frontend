import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";
const valid = { fullName: "Morgan Lee", phoneNo: "+255700000100", email: "morgan@example.com", password: "StrongPass1!", confirmPassword: "StrongPass1!", termsAccepted: true };
const request = (body: unknown) => new NextRequest("http://localhost/api/auth/register/", { method: "POST", body: JSON.stringify(body) });
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
describe("registration proxy", () => {
  it("validates before calling the backend", async () => {
    const fetcher = vi.fn(); vi.stubGlobal("fetch", fetcher);
    expect((await POST(request({ ...valid, phoneNo: "" }))).status).toBe(400);
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("does not fabricate accounts when no backend is configured", async () => {
    vi.stubEnv("AUTH_API_BASE_URL", "");
    expect((await POST(request(valid))).status).toBe(503);
  });
  it("forwards required Django fields and preserves validation errors", async () => {
    vi.stubEnv("AUTH_API_BASE_URL", "http://backend:8000");
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ email: ["Already registered."] }), { status: 400 }));
    vi.stubGlobal("fetch", fetcher);
    const response = await POST(request(valid));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ email: ["Already registered."] });
    expect(fetcher).toHaveBeenCalledWith("http://backend:8000/api/auth/register/", expect.objectContaining({ body: JSON.stringify({ full_name: valid.fullName, phone_no: valid.phoneNo, email: valid.email, password: valid.password, password_confirm: valid.confirmPassword }) }));
  });
});
