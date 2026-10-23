export type TaskStatus = "Pending" | "In Progress" | "Done";
export type DemoRole = "admin" | "user";

export type TaskItem = {
  id: number;
  title: string;
  description: string;
  status: TaskStatus;
  projectId?: number;
  dueDate?: string;
  createdAt?: string;
  ownerId: string;
};

export type ProjectItem = {
  id: number;
  name: string;
  description: string;
};

export type TaskFilter = "All" | TaskStatus | "Overdue";

export type DashboardPage = "Admin" | "Dashboard" | "Tasks" | "Projects" | "Calendar";
