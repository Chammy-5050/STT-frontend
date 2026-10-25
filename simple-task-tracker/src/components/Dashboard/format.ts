import { localDateKey } from "./deadlines";
import type { TaskItem, TaskStatus } from "./types";

/** Parses a "YYYY-MM-DD" (or ISO timestamp) as a local calendar date. */
function localDate(value: string) {
  return new Date(`${value.slice(0, 10)}T00:00:00`);
}

/** "28 Oct 2026" — the date format used across the workspace. */
export function formatDate(value?: string) {
  if (!value) return "";
  return localDate(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

/** "Wed, 28 Oct" for compact lists. */
export function formatShortDate(value?: string) {
  if (!value) return "";
  return localDate(value).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

export function todayKey(today = new Date()) {
  return localDateKey(today);
}

export function isOverdue(task: Pick<TaskItem, "status" | "dueDate">, today = new Date()) {
  return Boolean(task.dueDate && task.status !== "Done" && task.dueDate.slice(0, 10) < todayKey(today));
}

export function statusSlug(status: TaskStatus) {
  return status.toLowerCase().replace(" ", "-");
}

export function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join("").toUpperCase() || "?";
}

/** Stable palette slot (0-4) so a person or project keeps the same colour. */
export function colorSlot(seed: string) {
  let hash = 0;
  for (const character of seed) hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  return hash % 5;
}

export function plural(count: number, word: string, many = `${word}s`) {
  return `${count} ${count === 1 ? word : many}`;
}
