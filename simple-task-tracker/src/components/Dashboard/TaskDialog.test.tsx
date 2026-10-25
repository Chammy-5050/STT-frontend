import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api";
import TaskDialog from "./TaskDialog";

const projects = [{ id: "p1", name: "Website", description: "" }, { id: "p2", name: "Mobile", description: "" }];

it("creates the task in the project it was opened from", async () => {
  const user = userEvent.setup();
  const submit = vi.fn().mockResolvedValue(undefined);
  const close = vi.fn();
  render(<TaskDialog projects={projects} defaults={{ projectId: "p2" }} onClose={close} onSubmit={submit} />);
  expect(screen.getByRole("dialog", { name: "Create a task" })).toHaveAccessibleDescription("Add a task to Mobile.");
  expect(screen.getByLabelText("Project")).toHaveValue("Mobile");
  expect(screen.getByLabelText("Project")).toBeDisabled();
  await user.click(screen.getByRole("button", { name: "Create task" }));
  expect(screen.getByText("Enter a task name.")).toBeVisible();
  expect(submit).not.toHaveBeenCalled();
  await user.type(screen.getByLabelText("Task name"), "  Launch page  ");
  await user.selectOptions(screen.getByLabelText("Status"), "In Progress");
  await user.click(screen.getByRole("button", { name: "Create task" }));
  await waitFor(() => expect(close).toHaveBeenCalled());
  expect(submit).toHaveBeenCalledWith({ title: "Launch page", description: "", status: "In Progress", projectId: "p2", dueDate: undefined });
});

it("shows server field errors next to the right input and stays open", async () => {
  const user = userEvent.setup();
  const close = vi.fn();
  const submit = vi.fn().mockRejectedValue(new ApiError("A task with this name already exists in this project.", 400, { task_name: "A task with this name already exists in this project." }));
  render(<TaskDialog projects={projects} defaults={{ projectId: "p1" }} onClose={close} onSubmit={submit} />);
  await user.type(screen.getByLabelText("Task name"), "Duplicate");
  await user.click(screen.getByRole("button", { name: "Create task" }));
  expect(await screen.findByText("A task with this name already exists in this project.")).toBeVisible();
  expect(screen.getByLabelText("Task name")).toHaveAttribute("aria-invalid", "true");
  expect(close).not.toHaveBeenCalled();
});

it("asks before discarding unsaved edits", async () => {
  const user = userEvent.setup();
  const close = vi.fn();
  const task = { id: "t", title: "Original", description: "", status: "Pending" as const, projectId: "p1", canEdit: true };
  render(<TaskDialog task={task} projects={projects} onClose={close} onSubmit={vi.fn()} />);
  expect(screen.getByRole("dialog", { name: "Edit task" })).toBeVisible();
  expect(screen.getByLabelText("Project")).toBeDisabled();
  await user.type(screen.getByLabelText("Task name"), " changed");
  fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
  expect(screen.getByRole("alertdialog", { name: "Discard changes?" })).toBeVisible();
  expect(close).not.toHaveBeenCalled();
  await user.click(screen.getByRole("button", { name: "Discard changes" }));
  expect(close).toHaveBeenCalledOnce();
});

it("closes immediately when nothing changed", () => {
  const close = vi.fn();
  render(<TaskDialog projects={projects} defaults={{ projectId: "p1" }} onClose={close} onSubmit={vi.fn()} />);
  fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
  expect(close).toHaveBeenCalledOnce();
  expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
});

it("refuses to create a task outside a project", () => {
  const submit = vi.fn();
  render(<TaskDialog projects={projects} onClose={vi.fn()} onSubmit={submit} />);
  expect(screen.getByText("Open a project first")).toBeVisible();
  expect(screen.queryByLabelText("Task name")).not.toBeInTheDocument();
  expect(submit).not.toHaveBeenCalled();
});
