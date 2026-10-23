import type { TaskItem } from "./types";

export function localDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function deadlineFor(task: Pick<TaskItem, "status" | "dueDate">, today = new Date()) {
  if (task.status === "Done" || !task.dueDate) return null;
  const date = task.dueDate.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const [year, month, day] = date.split("-").map(Number);
  const remaining = Math.round((Date.UTC(year, month - 1, day) - Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())) / 86400000);
  if (remaining < 0) return { kind: "overdue", label: "Overdue" } as const;
  if (remaining === 0) return { kind: "today", label: "Due today" } as const;
  if (remaining <= 3) return { kind: "soon", label: "Due soon" } as const;
  return null;
}
