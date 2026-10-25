import type { Creator } from "@/lib/api";
export type TaskStatus = "Pending" | "In Progress" | "Done";
export const TASK_STATUSES: TaskStatus[] = ["Pending", "In Progress", "Done"];

export type TaskItem = {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  projectId: string;
  dueDate?: string;
  createdAt?: string;
  creator?: Creator;
  canEdit?: boolean;
};

export type ProjectItem = {
  creator?: Creator;
  id: string;
  name: string;
  description: string;
  createdAt?: string;
};

export type TaskFilter = "All" | TaskStatus | "Overdue" | "Today";

export type DashboardPage = "Dashboard" | "Tasks" | "Projects" | "Calendar" | "Settings";

export type ProjectDraft = { name: string; description: string };
export type TaskDraft = Omit<TaskItem, "id" | "createdAt" | "creator" | "canEdit">;
