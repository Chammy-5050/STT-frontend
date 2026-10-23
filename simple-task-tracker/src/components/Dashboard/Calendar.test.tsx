import { render, screen, within } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import Calendar from "./Calendar";
import type { TaskItem } from "./types";

afterEach(() => vi.useRealTimers());
it("shows unfinished deadline reminders while retaining completed tasks without warnings", () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 9, 23, 12));
  const tasks: TaskItem[] = [
    { id: "1", title: "Late draft", description: "", projectId: "p", status: "Pending", dueDate: "2026-10-22" },
    { id: "2", title: "Review", description: "", projectId: "p", status: "In Progress", dueDate: "2026-10-25" },
    { id: "3", title: "Finished draft", description: "", projectId: "p", status: "Done", dueDate: "2026-10-22" },
  ];
  render(<Calendar tasks={tasks} />);
  const reminders = within(screen.getByRole("region", { name: "Task deadline reminders" }));
  expect(reminders.getByText("Late draft")).toBeVisible();
  expect(reminders.getByText("Overdue")).toBeVisible();
  expect(reminders.getByText("Review")).toBeVisible();
  expect(reminders.getByText("Due soon")).toBeVisible();
  expect(reminders.queryByText("Finished draft")).not.toBeInTheDocument();
  expect(screen.getByTitle("Finished draft · Done")).toBeVisible();
});
