export type TaskStatus = "Pending" | "In Progress" | "Done";

export type TaskItem = {
  id: number;
  title: string;
  description: string;
  status: TaskStatus;
  projectId?: number;
  dueDate?: string;
  createdAt?: string;
};

export type ProjectItem = {
  id: number;
  name: string;
  description: string;
};

export type TaskFilter = "All" | TaskStatus | "Overdue";

export type DashboardPage = "Dashboard" | "Tasks" | "Projects" | "Calendar" | "Settings";
