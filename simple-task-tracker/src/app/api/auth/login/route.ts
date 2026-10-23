import { NextResponse, type NextRequest } from "next/server";
import { loginSchema } from "@/features/auth/schemas";

const sessionCookieName = "stt_session";
const rememberedCookieAge = 60 * 60 * 24 * 30;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function responseToken(payload: unknown): string | undefined {
  if (!isRecord(payload)) return undefined;
  for (const key of ["access", "access_token", "token", "key"]) {
    const value = payload[key];
    if (typeof value === "string" && value.length > 0) return value;
  }
  return undefined;
}

function responseRole(payload: unknown): string | undefined {
  if (!isRecord(payload) || !isRecord(payload.user)) return undefined;
  return typeof payload.user.role === "string" && payload.user.role.trim()
    ? payload.user.role
    : undefined;
}

function removeCredentialFields(payload: unknown): unknown {
  if (!isRecord(payload)) return {};
  const result = { ...payload };
  for (const key of ["access", "access_token", "token", "key", "refresh"]) {
    delete result[key];
  }
  return result;
}

function safeErrorPayload(payload: unknown) {
  const data = isRecord(payload) ? payload : {};
  const safe: Record<string, string | string[]> = {};
  for (const field of ["email", "password", "detail", "non_field_errors"] as const) {
    const value = data[field];
    if (typeof value === "string") {
      safe[field] = value;
    } else if (Array.isArray(value)) {
      const messages = value.filter((item): item is string => typeof item === "string");
      if (messages.length > 0) safe[field] = messages;
    }
  }
  return Object.keys(safe).length > 0
    ? safe
    : { detail: "Unable to sign in." };
}

function validationErrorResponse(issues: readonly { path: PropertyKey[]; message: string }[]) {
  const errors: Record<string, string[]> = {};
  for (const issue of issues) {
    const field = issue.path[0];
    if (typeof field !== "string") continue;
    errors[field] ??= [];
    errors[field].push(issue.message);
  }
  return NextResponse.json(errors, { status: 400 });
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { detail: "The request body must contain valid JSON." },
      { status: 400 },
    );
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) return validationErrorResponse(parsed.error.issues);

  const { email, password, rememberMe } = parsed.data;
  let payload: unknown;

  if (
    process.env.MOCK_AUTH === "true" &&
    process.env.NODE_ENV !== "production"
  ) {
    if (email.toLowerCase() !== "demo@example.com" || password !== "password123") {
      return NextResponse.json(
        { detail: "Invalid email or password." },
        { status: 401 },
      );
    }
    payload = {
      token: "mock-session-token",
      user: { email, role: "user" },
    };
  } else {
    const apiBaseUrl = process.env.AUTH_API_BASE_URL;
    if (!apiBaseUrl) {
      return NextResponse.json(
        { detail: "Authentication is not configured on this server." },
        { status: 503 },
      );
    }

    let upstream: Response;
    try {
      upstream = await fetch(
        `${apiBaseUrl.replace(/\/+$/, "")}/api/auth/login/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
          cache: "no-store",
        },
      );
    } catch (error) {
      console.error("Authentication service request failed.", error);
      return NextResponse.json(
        { detail: "Unable to reach the authentication service." },
        { status: 502 },
      );
    }

    const responseText = await upstream.text();
    let upstreamPayload: unknown = {};
    if (responseText) {
      try {
        upstreamPayload = JSON.parse(responseText) as unknown;
      } catch {
        return NextResponse.json(
          { detail: "The authentication service returned an invalid response." },
          { status: 502 },
        );
      }
    }

    if (!upstream.ok) {
      return NextResponse.json(safeErrorPayload(upstreamPayload), {
        status: upstream.status,
      });
    }

    if (!responseToken(upstreamPayload) || !responseRole(upstreamPayload)) {
      return NextResponse.json(
        {
          detail:
            "The authentication service response must include a session token and user role.",
        },
        { status: 502 },
      );
    }
    payload = upstreamPayload;
  }

  const token = responseToken(payload);
  if (!token || !responseRole(payload)) {
    return NextResponse.json(
      { detail: "Unable to create a complete authenticated session." },
      { status: 500 },
    );
  }

  const response = NextResponse.json(removeCredentialFields(payload));
  response.cookies.set(sessionCookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    ...(rememberMe ? { maxAge: rememberedCookieAge } : {}),
  });
  return response;
}
