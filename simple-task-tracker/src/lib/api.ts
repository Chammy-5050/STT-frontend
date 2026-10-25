export const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api").replace(/\/$/, "");
type Tokens = { access: string; refresh: string };
const tokenKey = "stt.tokens";

export class ApiError extends Error {
  /** First message per field, e.g. { task_name: "A task with this name already exists." }. */
  constructor(message: string, public status: number, public fields: Record<string, string> = {}) { super(message); }
}

function tokenStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(tokenKey) ? localStorage : sessionStorage;
}

export function tokens(): Tokens | null {
  try { return JSON.parse(tokenStorage()?.getItem(tokenKey) || "null"); }
  catch { return null; }
}

export function saveTokens(value: Tokens, remember = false) {
  clearTokens();
  (remember ? localStorage : sessionStorage).setItem(tokenKey, JSON.stringify(value));
}

export function clearTokens() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(tokenKey);
    sessionStorage.removeItem(tokenKey);
  }
}

function errorText(value: unknown): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(errorText).join(" ");
  if (value && typeof value === "object") return Object.values(value).map(errorText).join(" ");
  return "The request could not be completed.";
}

function fieldErrors(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value)
    .filter(([key]) => key !== "detail" && key !== "non_field_errors")
    .map(([key, item]) => [key, errorText(Array.isArray(item) ? item[0] : item)]));
}

let refreshing: Promise<boolean> | null = null;
async function refreshAccess(): Promise<boolean> {
  if (!refreshing) refreshing = (async () => {
    const previous = tokens();
    if (!previous) return false;
    try {
      const response = await fetch(`${API_URL}/auth/refresh/`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh: previous.refresh }),
      });
      if (!response.ok) return false;
      const updated = await response.json();
      tokenStorage()?.setItem(tokenKey, JSON.stringify({ ...previous, ...updated }));
      return true;
    } catch { return false; }
  })().finally(() => { refreshing = null; });
  return refreshing;
}

export async function api<T>(path: string, init: RequestInit = {}, authenticated = true): Promise<T> {
  async function send() {
    const headers = new Headers(init.headers);
    if (!(init.body instanceof FormData) && init.body) headers.set("Content-Type", "application/json");
    const access = tokens()?.access;
    if (authenticated && access) headers.set("Authorization", `Bearer ${access}`);
    return fetch(`${API_URL}${path}`, { ...init, headers, cache: "no-store" });
  }
  let response: Response;
  try {
    response = await send();
    if (authenticated && response.status === 401 && await refreshAccess()) response = await send();
  } catch { throw new ApiError("Cannot reach the server. Check your connection and try again.", 0); }
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    if (authenticated && response.status === 401) {
      clearTokens();
      window.dispatchEvent(new Event("stt:logout"));
    }
    throw new ApiError(data ? errorText(data) : `Request failed (${response.status}).`, response.status, fieldErrors(data));
  }
  return data as T;
}

export type User = {
  user_id: string; full_name: string; email: string; phone_no: string;
  profile_picture: string | null; is_active: boolean; is_staff: boolean;
  is_superuser: boolean; role: string | null;
};
export type AdminUser = Omit<User, "profile_picture">;
export type Role = { role_id: string; role_name: string; grant_superuser_access: boolean };
export type Creator = { user_id: string; full_name: string; profile_picture: string | null };
export type ApiProject = { creator: Creator; project_id: string; project_name: string; description: string | null; user_id: string; created_at: string };
export type ApiTask = { creator: Creator; can_edit: boolean; task_id: string; task_name: string; description: string | null; project_id: string; status: "pending" | "in_progress" | "done"; due_date: string | null; created_at: string };
export const message = (error: unknown) => error instanceof Error ? error.message : "Something went wrong. Please try again.";
