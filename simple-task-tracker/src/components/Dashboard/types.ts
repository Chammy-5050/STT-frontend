export type TaskStatus = "Pending" | "In Progress" | "Done";

export type TaskItem = {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  projectId: string;
  dueDate?: string;
  createdAt?: string;
};

export type ProjectItem = {
  id: string;
  name: string;
  description: string;
};

export type TaskFilter = "All" | TaskStatus | "Overdue" | "Today";

export type DashboardPage = "Dashboard" | "Tasks" | "Projects" | "Calendar" | "Settings";

export type ProjectDraft = { name: string; description: string };
export type TaskDraft = Omit<TaskItem, "id" | "createdAt">;
