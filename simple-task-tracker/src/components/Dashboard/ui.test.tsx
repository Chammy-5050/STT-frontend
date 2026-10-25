import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { ActionMenu, ConfirmDialog } from "./ui";

it("focuses Cancel first and only runs the action after confirming", async () => {
  const action = vi.fn();
  const close = vi.fn();
  render(<ConfirmDialog onClose={close} request={{ title: "Delete task?", message: "Gone forever.", confirmLabel: "Delete task", onConfirm: action }} />);
  expect(screen.getByRole("alertdialog", { name: "Delete task?" })).toBeVisible();
  expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus();
  fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
  expect(action).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Delete task" }));
  await waitFor(() => expect(close).toHaveBeenCalledTimes(2));
  expect(action).toHaveBeenCalledOnce();
});

it("keeps the confirmation open and shows the error when the action fails", async () => {
  const close = vi.fn();
  render(<ConfirmDialog onClose={close} request={{ title: "Delete project?", message: "", confirmLabel: "Delete project", onConfirm: () => Promise.reject(new Error("Server refused.")) }} />);
  fireEvent.click(screen.getByRole("button", { name: "Delete project" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Server refused.");
  expect(close).not.toHaveBeenCalled();
  expect(screen.getByRole("button", { name: "Delete project" })).toBeEnabled();
});

it("closes the confirmation with Escape without running the action", () => {
  const action = vi.fn();
  const close = vi.fn();
  render(<ConfirmDialog onClose={close} request={{ title: "Sign out?", message: "", confirmLabel: "Sign out", onConfirm: action }} />);
  fireEvent.keyDown(screen.getByRole("alertdialog"), { key: "Escape" });
  expect(close).toHaveBeenCalledOnce();
  expect(action).not.toHaveBeenCalled();
});

it("opens the action menu, supports arrow keys and runs the chosen action", async () => {
  const user = userEvent.setup();
  const edit = vi.fn();
  const remove = vi.fn();
  render(<ActionMenu label="Actions for Report" actions={[{ label: "Edit", onSelect: edit }, { label: "Delete", tone: "danger", onSelect: remove }]} />);
  await user.click(screen.getByRole("button", { name: "Actions for Report" }));
  expect(screen.getByRole("menuitem", { name: "Edit" })).toHaveFocus();
  await user.keyboard("{ArrowDown}");
  expect(screen.getByRole("menuitem", { name: "Delete" })).toHaveFocus();
  await user.keyboard("{Enter}");
  expect(remove).toHaveBeenCalledOnce();
  expect(edit).not.toHaveBeenCalled();
  expect(screen.queryByRole("menu")).not.toBeInTheDocument();
});
