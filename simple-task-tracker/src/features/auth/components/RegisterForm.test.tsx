import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RegisterForm } from "@/features/auth/components/RegisterForm";
import type { RegisterResponse } from "@/features/auth/hooks/useRegister";

const { replace, mutateAsync } = vi.hoisted(() => ({
  replace: vi.fn(),
  mutateAsync: vi.fn<(...args: unknown[]) => Promise<RegisterResponse>>(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

vi.mock("@/features/auth/hooks/useRegister", () => ({
  useRegister: () => ({ mutateAsync, isPending: false }),
}));

describe("RegisterForm", () => {
  beforeEach(() => {
    replace.mockReset();
    mutateAsync.mockReset();
  });

  it("shows errors for empty required fields", async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    await user.click(screen.getByRole("button", { name: "Create Account" }));

    expect(await screen.findByText("Enter your full name.")).toBeVisible();
    expect(screen.getByText("Enter your email address.")).toBeVisible();
    await waitFor(() =>
      expect(screen.getByText("Use at least 8 characters.")).toBeVisible(),
    );
    await waitFor(() =>
      expect(screen.getByText("Confirm your password.")).toBeVisible(),
    );
    await waitFor(() =>
      expect(
        screen.getByText("Accept the Terms and Conditions to continue."),
      ).toBeVisible(),
    );
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it("shows the loading state, then routes to email verification after registration", async () => {
    const user = userEvent.setup();
    let completeRegistration: (result: RegisterResponse) => void = () => {};
    mutateAsync.mockImplementation(
      () =>
        new Promise<RegisterResponse>((resolve) => {
          completeRegistration = resolve;
        }),
    );
    render(<RegisterForm />);

    await user.type(screen.getByLabelText("Full name"), "Morgan Lee");
    await user.type(screen.getByLabelText("Phone number"), "+255700000100");
    await user.type(screen.getByLabelText("Email address"), "morgan@example.com");
    await user.type(screen.getByLabelText("Password"), "StrongPass1!");
    await user.type(screen.getByLabelText("Confirm password"), "StrongPass1!");
    await user.click(screen.getByRole("checkbox", { name: /terms and conditions/i }));
    await user.click(screen.getByRole("button", { name: "Create Account" }));

    expect(
      await screen.findByRole("status", { name: "Creating your account" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeDisabled();

    completeRegistration({
      detail: "Account created successfully. Please sign in.",
    });

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/verify-email"));
    expect(JSON.parse(sessionStorage.getItem("stt-pending-verification") || "{}")).toMatchObject({
      email: "morgan@example.com", name: "Morgan Lee",
    });
  });

  it("keeps the registration form open when the backend fails", async () => {
    const user = userEvent.setup();
    mutateAsync.mockRejectedValueOnce(new Error("Unavailable"));
    render(<RegisterForm />);
    await user.type(screen.getByLabelText("Full name"), "Morgan Lee");
    await user.type(screen.getByLabelText("Phone number"), "+255700000100");
    await user.type(screen.getByLabelText("Email address"), "morgan@example.com");
    await user.type(screen.getByLabelText("Password"), "StrongPass1!");
    await user.type(screen.getByLabelText("Confirm password"), "StrongPass1!");
    await user.click(screen.getByRole("checkbox", { name: /terms and conditions/i }));
    await user.click(screen.getByRole("button", { name: "Create Account" }));
    await waitFor(() => expect(mutateAsync).toHaveBeenCalled());
    expect(replace).not.toHaveBeenCalled();
  });
});
