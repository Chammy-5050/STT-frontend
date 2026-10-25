import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { expect, it, vi } from "vitest";
import TasksPage from "./TasksPage";
import type { TaskFilter, TaskItem } from "./types";

const owner = { user_id: "u1", full_name: "Hubert Mrema", profile_picture: null };
const other = { user_id: "u2", full_name: "Sabrina Kileo", profile_picture: null };
const projects = [{ id: "p1", name: "Website", description: "" }, { id: "p2", name: "School", description: "" }];
const tasks: TaskItem[] = [
  { id: "1", title: "Login page", description: "Auth screen", status: "Pending", projectId: "p1", creator: owner, canEdit: true, dueDate: "2026-10-20" },
  { id: "2", title: "Report cards", description: "", status: "Done", projectId: "p2", creator: other, canEdit: false },
  ...Array.from({ length: 9 }, (_, index): TaskItem => ({ id: `x${index}`, title: `Extra ${index}`, description: "", status: "In Progress", projectId: "p1", creator: owner, canEdit: true })),
];

function Harness({ isAdmin = true, onDelete = vi.fn(), onBulkStatus = vi.fn() }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<TaskFilter>("All");
  return <TasksPage tasks={tasks} projects={projects} isAdmin={isAdmin} search={search} onSearchChange={setSearch} filter={filter} onFilterChange={setFilter}
    onOpenProjects={vi.fn()} onEditTask={vi.fn()} onDeleteTasks={onDelete} onStatusChange={vi.fn()} onBulkStatus={onBulkStatus} />;
}

it("paginates, searches and filters by owner", async () => {
  const user = userEvent.setup();
  render(<Harness />);
  expect(screen.getByText("Showing 1–8 of 11 tasks")).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Page 2" }));
  expect(screen.getByText("Showing 9–11 of 11 tasks")).toBeVisible();
  await user.type(screen.getByRole("searchbox", { name: "Search tasks" }), "auth");
  expect(screen.getByRole("heading", { name: "Login page" })).toBeVisible();
  expect(screen.getAllByRole("row")).toHaveLength(2);
  await user.clear(screen.getByRole("searchbox", { name: "Search tasks" }));
  await user.selectOptions(screen.getByRole("combobox", { name: "Filter by owner" }), "u2");
  expect(screen.getByRole("heading", { name: "Report cards" })).toBeVisible();
  expect(screen.queryByRole("heading", { name: "Login page" })).not.toBeInTheDocument();
});

it("hides the owner filter from members and offers a clear-filters escape hatch", async () => {
  const user = userEvent.setup();
  render(<Harness isAdmin={false} />);
  expect(screen.getByRole("heading", { name: "My Tasks" })).toBeVisible();
  expect(screen.queryByRole("combobox", { name: "Filter by owner" })).not.toBeInTheDocument();
  await user.type(screen.getByRole("searchbox", { name: "Search tasks" }), "no such task");
  expect(screen.getByText("No tasks match your filters")).toBeVisible();
  await user.click(screen.getAllByRole("button", { name: "Clear filters" })[0]);
  expect(screen.getByText("Showing 1–8 of 11 tasks")).toBeVisible();
});

it("only lets editable tasks be selected and passes the selection to bulk actions", async () => {
  const user = userEvent.setup();
  const onDelete = vi.fn();
  const onBulkStatus = vi.fn();
  render(<Harness onDelete={onDelete} onBulkStatus={onBulkStatus} />);
  await user.selectOptions(screen.getByRole("combobox", { name: "Filter by owner" }), "u2");
  expect(screen.getByRole("checkbox", { name: "Select Report cards" })).toBeDisabled();
  expect(screen.queryByRole("button", { name: "Edit Report cards" })).not.toBeInTheDocument();
  await user.selectOptions(screen.getByRole("combobox", { name: "Filter by owner" }), "u1");
  await user.click(screen.getByRole("checkbox", { name: "Select Login page" }));
  await user.click(screen.getByRole("checkbox", { name: "Select Extra 0" }));
  const bulk = screen.getByRole("region", { name: "Bulk actions" });
  expect(within(bulk).getByText("2 tasks selected")).toBeVisible();
  await user.click(within(bulk).getByRole("button", { name: "Delete" }));
  expect(onDelete.mock.calls[0][0].map((task: TaskItem) => task.id).sort()).toEqual(["1", "x0"]);
  await user.click(within(bulk).getByRole("button", { name: "Mark as done" }));
  expect(onBulkStatus).toHaveBeenCalledWith(expect.arrayContaining([expect.objectContaining({ id: "1" })]), "Done");
});

it("switches to the board view", async () => {
  const user = userEvent.setup();
  render(<Harness />);
  await user.click(screen.getByRole("button", { name: "Board" }));
  expect(screen.getByRole("region", { name: "Task status board" })).toBeVisible();
  expect(within(screen.getByRole("region", { name: "Done tasks" })).getByRole("heading", { name: "Report cards" })).toBeVisible();
});
