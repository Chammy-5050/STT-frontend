import { NextResponse, type NextRequest } from "next/server";
import { registerSchema } from "@/features/auth/schemas";

export async function POST(request: NextRequest) {
  const reply = (body: unknown, status: number) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
  let payload: unknown;
  try {
    const raw = await request.text();
    if (new TextEncoder().encode(raw).byteLength > 16 * 1024) return reply({ detail: "The request is too large." }, 413);
    payload = JSON.parse(raw);
  } catch { return reply({ detail: "The request body must contain valid JSON." }, 400); }
  const parsed = registerSchema.safeParse(payload);
  if (!parsed.success) return reply(parsed.error.flatten().fieldErrors, 400);
  const base = process.env.AUTH_API_BASE_URL;
  if (!base) return reply({ detail: "Authentication is not configured on this server." }, 503);
  const values = parsed.data;
  try {
    const upstream = await fetch(`${base.replace(/\/$/, "")}/api/auth/register/`, {
      method: "POST", headers: { "Content-Type": "application/json" }, cache: "no-store",
      body: JSON.stringify({ full_name: values.fullName, phone_no: values.phoneNo, email: values.email, password: values.password, password_confirm: values.confirmPassword }),
    });
    return reply(await upstream.json(), upstream.status);
  } catch { return reply({ detail: "The authentication service is unavailable." }, 502); }
}
