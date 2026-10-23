import type { TaskItem } from "@/components/Dashboard/types";

const ACCOUNTS_KEY = "stt-demo-accounts";
const TASKS_KEY = "stt-demo-tasks";
const LATEST_ACCOUNT_KEY = "stt-demo-latest-account";

export type DemoAccount = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: string;
};

export async function hashDemoPassword(password: string) {
  const digest = await window.crypto.subtle.digest("SHA-256", new TextEncoder().encode(password));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function getDemoAccounts(): DemoAccount[] {
  try {
    const saved = window.localStorage.getItem(ACCOUNTS_KEY);
    if (!saved) return [];
    const accounts: unknown = JSON.parse(saved);
    return Array.isArray(accounts) ? accounts as DemoAccount[] : [];
  } catch {
    return [];
  }
}

export function findDemoAccount(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  return getDemoAccounts().find((account) => account.email === normalizedEmail);
}

export function addDemoAccount(account: DemoAccount) {
  const accounts = getDemoAccounts();
  if (accounts.some((saved) => saved.email === account.email)) return false;
  accounts.push(account);
  window.localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
  window.localStorage.setItem(LATEST_ACCOUNT_KEY, account.email);
  return true;
}

export function getLatestDemoAccount() {
  const email = window.localStorage.getItem(LATEST_ACCOUNT_KEY);
  return email ? findDemoAccount(email) ?? null : null;
}

export function clearLatestDemoAccount() {
  window.localStorage.removeItem(LATEST_ACCOUNT_KEY);
}

export function getDemoTasks(fallback: TaskItem[]) {
  try {
    const saved = window.localStorage.getItem(TASKS_KEY);
    if (!saved) return fallback;
    const tasks: unknown = JSON.parse(saved);
    return Array.isArray(tasks) ? tasks as TaskItem[] : fallback;
  } catch {
    return fallback;
  }
}

export function saveDemoTasks(tasks: TaskItem[]) {
  window.localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
}
