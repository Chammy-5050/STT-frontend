import { NextResponse, type NextRequest } from "next/server";
import { registerSchema } from "@/features/auth/schemas";

const maxRequestBytes = 16 * 1024;

function jsonResponse(body: unknown, status: number) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validationErrorResponse(
  issues: readonly { path: PropertyKey[]; message: string }[],
) {
  const errors: Record<string, string[]> = {};
  const fieldNames: Record<string, string> = {
    fullName: "full_name",
    confirmPassword: "password_confirm",
    termsAccepted: "terms_accepted",
  };
  for (const issue of issues) {
    const field = issue.path[0];
    if (typeof field !== "string") continue;
    const apiField = fieldNames[field] ?? field;
    errors[apiField] ??= [];
    errors[apiField].push(issue.message);
  }
  return jsonResponse(errors, 400);
}

function safeErrorPayload(payload: unknown) {
  const data = isRecord(payload) ? payload : {};
  const safe: Record<string, string | string[]> = {};
  for (const field of [
    "full_name",
    "email",
    "password",
    "password_confirm",
    "terms_accepted",
    "detail",
    "non_field_errors",
  ]) {
    const value = data[field];
    if (typeof value === "string") {
      safe[field] = value;
    } else if (Array.isArray(value)) {
      const messages = value.filter(
        (item): item is string => typeof item === "string",
      );
      if (messages.length > 0) safe[field] = messages;
    }
  }
  return Object.keys(safe).length > 0
    ? safe
    : { detail: "Unable to create your account." };
}

export async function POST(request: NextRequest) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > maxRequestBytes) {
    return jsonResponse({ detail: "The request is too large." }, 413);
  }

  let body: unknown;
  try {
    const rawBody = await request.text();
    if (new TextEncoder().encode(rawBody).byteLength > maxRequestBytes) {
      return jsonResponse({ detail: "The request is too large." }, 413);
    }
    body = JSON.parse(rawBody) as unknown;
  } catch {
    return jsonResponse(
      { detail: "The request body must contain valid JSON." },
      400,
    );
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) return validationErrorResponse(parsed.error.issues);
  const { fullName, email, password, confirmPassword, termsAccepted } =
    parsed.data;

  if (
    process.env.MOCK_AUTH === "true" &&
    process.env.NODE_ENV !== "production"
  ) {
    return jsonResponse(
      {
        detail:
          "Demo registration simulated successfully. No account was saved.",
        simulated: true,
      },
      201,
    );
  }

  const apiBaseUrl = process.env.AUTH_API_BASE_URL;
  if (!apiBaseUrl) {
    return jsonResponse(
      { detail: "Registration is not configured on this server." },
      503,
    );
  }

  let upstream: Response;
  try {
    upstream = await fetch(
      `${apiBaseUrl.replace(/\/+$/, "")}/api/auth/register/`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName,
          email,
          password,
          password_confirm: confirmPassword,
          terms_accepted: termsAccepted,
        }),
        cache: "no-store",
      },
    );
  } catch (error) {
    console.error("Registration service request failed.", error);
    return jsonResponse(
      { detail: "Unable to reach the registration service." },
      502,
    );
  }

  const responseText = await upstream.text();
  let upstreamPayload: unknown = {};
  if (responseText) {
    try {
      upstreamPayload = JSON.parse(responseText) as unknown;
    } catch {
      return jsonResponse(
        { detail: "The registration service returned an invalid response." },
        502,
      );
    }
  }

  if (!upstream.ok) {
    return jsonResponse(safeErrorPayload(upstreamPayload), upstream.status);
  }

  return jsonResponse(
    { detail: "Account created successfully. Please sign in." },
    201,
  );
}
