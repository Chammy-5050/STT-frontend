import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import Projects from "./Projects";

it("keeps only the selected project's tasks visible after repeated card clicks", () => {
  render(<Projects projects={[
    { id: "a", name: "Project Alpha", description: "" },
    { id: "b", name: "Project Beta", description: "" },
  ]} tasks={[
    { id: "1", title: "Alpha task", description: "", status: "Pending", projectId: "a" },
    { id: "2", title: "Beta task", description: "", status: "Pending", projectId: "b" },
  ]} onCreateProject={vi.fn()} onStatusChange={vi.fn()} />);
  const alpha = screen.getByRole("button", { name: /Project Alpha/ });
  fireEvent.click(alpha);
  fireEvent.click(alpha);
  expect(alpha).toHaveAttribute("aria-pressed", "true");
  expect(screen.getByRole("heading", { name: "Alpha task" })).toBeVisible();
  expect(screen.queryByRole("heading", { name: "Beta task" })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: /Project Beta/ }));
  expect(screen.getByRole("heading", { name: "Beta task" })).toBeVisible();
  expect(screen.queryByRole("heading", { name: "Alpha task" })).not.toBeInTheDocument();
});

it("shows creators and prevents both controls and forged drops from changing read-only tasks", () => {
  const change = vi.fn();
  const creator = { user_id: "member", full_name: "Morgan Lee", profile_picture: null };
  const { container } = render(<Projects projects={[{ id: "p", name: "Morgan project", description: "", creator }]} tasks={[{ id: "t", title: "Member task", description: "", status: "Pending", projectId: "p", creator, canEdit: false }]} onCreateProject={vi.fn()} onStatusChange={change} />);
  expect(screen.getAllByText("Morgan Lee")).toHaveLength(2);
  expect(container.querySelector("article")).toHaveAttribute("draggable", "false");
  expect(screen.queryByRole("combobox", { name: /Move Member task/ })).not.toBeInTheDocument();
  fireEvent.drop(screen.getByRole("region", { name: "Done tasks" }), { dataTransfer: { getData: () => "t" } });
  expect(change).not.toHaveBeenCalled();
});
