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

  it("shows the animated loading state and success prompt, then routes to login", async () => {
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
      simulated: false,
      detail: "Account created successfully. Please sign in.",
    });

    expect(
      await screen.findByRole("dialog", { name: "Account created!" }),
    ).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Go to sign in" }));
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/login"));
  });

  it("discloses that mock registration does not save an account", async () => {
    const user = userEvent.setup();
    mutateAsync.mockResolvedValueOnce({
      simulated: true,
      detail: "Demo registration simulated successfully. No account was saved.",
    });
    render(<RegisterForm />);

    await user.type(screen.getByLabelText("Full name"), "Morgan Lee");
    await user.type(screen.getByLabelText("Email address"), "morgan@example.com");
    await user.type(screen.getByLabelText("Password"), "StrongPass1!");
    await user.type(screen.getByLabelText("Confirm password"), "StrongPass1!");
    await user.click(screen.getByRole("checkbox", { name: /terms and conditions/i }));
    await user.click(screen.getByRole("button", { name: "Create Account" }));

    expect(
      await screen.findByRole("dialog", {
        name: "Registration preview complete",
      }),
    ).toBeVisible();
    expect(
      screen.getByText(/This demo did not save an account/),
    ).toBeVisible();
    expect(mutateAsync).toHaveBeenCalledWith({
      fullName: "Morgan Lee",
      email: "morgan@example.com",
      password: "StrongPass1!",
      confirmPassword: "StrongPass1!",
      termsAccepted: true,
    });
  });
});
