export type AuthFieldName =
  | "email"
  | "password"
  | "full_name"
  | "fullName"
  | "phone_no"
  | "phoneNo"
  | "password_confirm"
  | "confirmPassword"
  | "terms_accepted"
  | "termsAccepted";

export type LoginResponse = {
  user: {
    role: string;
  };
};

export class ApiError extends Error {
  readonly status: number;
  readonly fieldErrors: Partial<Record<AuthFieldName, string>>;
  readonly detail?: string;

  constructor(
    message: string,
    status: number,
    fieldErrors: Partial<Record<AuthFieldName, string>> = {},
    detail?: string,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
    this.detail = detail;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function firstMessage(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    return value.find((item): item is string => typeof item === "string");
  }
  return undefined;
}

export function normalizeApiError(payload: unknown, status: number): ApiError {
  const data = isRecord(payload) ? payload : {};
  const fieldErrors: Partial<Record<AuthFieldName, string>> = {};

  for (const field of [
    "email",
    "password",
    "full_name",
    "fullName",
    "phone_no",
    "phoneNo",
    "password_confirm",
    "confirmPassword",
    "terms_accepted",
    "termsAccepted",
  ] as const) {
    const message = firstMessage(data[field]);
    if (message) fieldErrors[field] = message;
  }

  const detail =
    firstMessage(data.detail) ??
    firstMessage(data.non_field_errors) ??
    firstMessage(data.message);
  const fallback = status >= 500 ? "The service is temporarily unavailable." : "Unable to sign in.";

  return new ApiError(detail ?? fallback, status, fieldErrors, detail);
}

function toLoginResponse(payload: unknown, status: number): LoginResponse {
  if (!isRecord(payload) || !isRecord(payload.user)) {
    throw new ApiError(
      "The server returned an invalid sign-in response.",
      status,
      {},
      "The server returned an invalid sign-in response.",
    );
  }
  const role = payload.user.role;
  if (typeof role !== "string") {
    throw new ApiError(
      "The server returned an invalid sign-in response.",
      status,
      {},
      "The server returned an invalid sign-in response.",
    );
  }
  return { user: { role } };
}

export async function apiRequest<T = LoginResponse>(
  path: string,
  init: RequestInit,
  parseSuccess: (payload: unknown, status: number) => T = toLoginResponse as (
    payload: unknown,
    status: number,
  ) => T,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      ...init,
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        ...init.headers,
      },
    });
  } catch {
    throw new ApiError("Unable to reach the server. Check your connection.", 0);
  }

  const responseText = await response.text();
  let payload: unknown = {};
  if (responseText) {
    try {
      payload = JSON.parse(responseText) as unknown;
    } catch {
      if (response.ok) {
        throw new ApiError(
          "The server returned an invalid sign-in response.",
          response.status,
          {},
          "The server returned an invalid sign-in response.",
        );
      } else {
        throw normalizeApiError(
          { detail: "The server returned an invalid response." },
          response.status,
        );
      }
    }
  }

  if (!response.ok) {
    throw normalizeApiError(payload, response.status);
  }

  return parseSuccess(payload, response.status);
}
