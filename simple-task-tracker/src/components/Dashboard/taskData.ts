import type { ProjectItem, TaskItem } from "./types";

export const initialProjects: ProjectItem[] = [
  { id: 1, name: "Website Redesign", description: "Sample workspace for trying the dashboard" },
];

function dateOffset(offset: number) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export const initialTasks: TaskItem[] = [
  { id: 1, title: "Wireframe homepage", description: "Create a clear landing page structure.", status: "Pending", projectId: 1, dueDate: dateOffset(1) },
  { id: 2, title: "Checkout flow redesign", description: "Simplify the steps in the checkout experience.", status: "In Progress", projectId: 1, dueDate: dateOffset(3) },
  { id: 3, title: "Design system audit", description: "Review spacing, colors, and reusable components.", status: "Done", projectId: 1, dueDate: dateOffset(-1) },
  { id: 4, title: "Registration page", description: "Polish the account creation form.", status: "Pending", projectId: 1, dueDate: dateOffset(-2) },
];
