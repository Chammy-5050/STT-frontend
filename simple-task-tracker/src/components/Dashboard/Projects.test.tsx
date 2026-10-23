import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import Projects from "./Projects";

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
