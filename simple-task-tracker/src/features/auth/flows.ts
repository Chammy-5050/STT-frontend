import { api, ApiError } from "@/lib/api";

export const CODE_LENGTH = 6;
export const RESEND_SECONDS = 45;

/** "kenneth@mail.com" → "k***@mail.com". */
export function maskEmail(email: string) {
  const at = email.lastIndexOf("@");
  if (at < 1) return email;
  return `${email[0]}***${email.slice(at)}`;
}

const WEB_INBOXES: [RegExp, string][] = [
  [/^(gmail|googlemail)\.com$/, "https://mail.google.com/mail/u/0/#inbox"],
  [/^(outlook|hotmail|live|msn)\.[a-z.]+$/, "https://outlook.live.com/mail/0/inbox"],
  [/^(yahoo|ymail|rocketmail)\.[a-z.]+$/, "https://mail.yahoo.com/"],
];

/** The provider's web inbox for well-known domains, otherwise the default mail app. */
export function inboxUrl(email: string) {
  const domain = email.slice(email.lastIndexOf("@") + 1).toLowerCase();
  return WEB_INBOXES.find(([pattern]) => pattern.test(domain))?.[1] ?? "mailto:";
}

export const passwordRules = [
  { label: "8+ characters", test: (value: string) => value.length >= 8 },
  { label: "Uppercase", test: (value: string) => /[A-Z]/.test(value) },
  { label: "Lowercase", test: (value: string) => /[a-z]/.test(value) },
  { label: "Number", test: (value: string) => /[0-9]/.test(value) },
  { label: "Special character", test: (value: string) => /[^A-Za-z0-9\s]/.test(value) },
];

/** Readable text for a failed auth request, including rate limits. */
export function flowError(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 429) {
      const seconds = Number(/(\d+) seconds?/.exec(error.message)?.[1]);
      const minutes = Math.max(1, Math.ceil((Number.isFinite(seconds) ? seconds : 60) / 60));
      return `Too many attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`;
    }
    if (error.status === 0 || error.status >= 500) return "We couldn't reach the server. Check your connection and try again.";
    return error.fields.code ?? error.fields.reset_token ?? error.fields.password ?? error.fields.email ?? error.message;
  }
  return "Something went wrong. Please try again.";
}

export type CodePurpose = "email_verify" | "password_reset";

const post = <T,>(path: string, body: object) =>
  api<T>(`/auth/${path}`, { method: "POST", body: JSON.stringify(body) }, false);

export const authFlows = {
  verifyEmail: (email: string, code: string) => post<{ detail: string }>("verify-email/", { email, code }),
  resendCode: (email: string, purpose: CodePurpose) => post<{ resend_in: number }>("resend-code/", { email, purpose }),
  forgotPassword: (email: string) => post<{ resend_in: number }>("password/forgot/", { email }),
  verifyResetCode: (email: string, code: string) => post<{ reset_token: string }>("password/verify-code/", { email, code }),
  resetPassword: (resetToken: string, password: string, confirmPassword: string) =>
    post<{ detail: string }>("password/reset/", { reset_token: resetToken, password, confirm_password: confirmPassword }),
};

/** Remembers which address is waiting for verification across the register → verify pages. */
const PENDING_KEY = "stt-pending-verification";
export type PendingVerification = { email: string; name?: string; sentAt: number };

export function savePendingVerification(value: Omit<PendingVerification, "sentAt">) {
  try { sessionStorage.setItem(PENDING_KEY, JSON.stringify({ ...value, sentAt: Date.now() })); } catch { /* storage blocked */ }
}

export function readPendingVerification(): PendingVerification | null {
  try {
    const value = JSON.parse(sessionStorage.getItem(PENDING_KEY) || "null") as PendingVerification | null;
    return value && typeof value.email === "string" ? value : null;
  } catch { return null; }
}

/** The raw stored value, stable between calls, for useSyncExternalStore. */
export function pendingVerificationSnapshot() {
  try { return sessionStorage.getItem(PENDING_KEY); } catch { return null; }
}

export function clearPendingVerification() {
  try { sessionStorage.removeItem(PENDING_KEY); } catch { /* storage blocked */ }
}

/** Keeps a loader on screen long enough to read, without slowing fast requests much. */
export async function atLeast<T>(promise: Promise<T>, ms = 600): Promise<T> {
  const [value] = await Promise.all([promise, new Promise(resolve => setTimeout(resolve, ms))]);
  return value;
}

/** A one-time message and email prefill for the next visit to the sign-in page. */
const LOGIN_NOTICE_KEY = "stt-login-notice";
export type LoginNotice = { email?: string; message: string };

export function saveLoginNotice(value: LoginNotice) {
  try { sessionStorage.setItem(LOGIN_NOTICE_KEY, JSON.stringify(value)); } catch { /* storage blocked */ }
}

export function takeLoginNotice(): LoginNotice | null {
  try {
    const raw = sessionStorage.getItem(LOGIN_NOTICE_KEY);
    sessionStorage.removeItem(LOGIN_NOTICE_KEY);
    const value = JSON.parse(raw || "null") as LoginNotice | null;
    return value && typeof value.message === "string" ? value : null;
  } catch { return null; }
}
