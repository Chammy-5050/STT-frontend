import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api-client";
import { ApiError as BackendError } from "@/lib/api";
import { LoginForm } from "@/features/auth/components/LoginForm";

const { replace, push, signIn } = vi.hoisted(() => ({
  signIn: vi.fn(),
  replace: vi.fn(),
  push: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push }),
}));

vi.mock("@/components/auth/AuthProvider", () => ({ useAuth: () => ({ signIn }) }));
const apiRequestMock = signIn;

function renderLoginForm() {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <LoginForm />
    </QueryClientProvider>,
  );
}

describe("LoginForm", () => {
  beforeEach(() => {
    replace.mockReset();
    push.mockReset();
    apiRequestMock.mockReset();
    sessionStorage.clear();
  });

  it("shows inline validation errors when submitted empty", async () => {
    const user = userEvent.setup();
    renderLoginForm();

    await user.click(screen.getByRole("button", { name: "Sign In" }));

    expect(await screen.findByText("Enter your email address.")).toBeVisible();
    await waitFor(() =>
      expect(
        screen.getByText("Password must be at least 8 characters."),
      ).toBeVisible(),
    );
    expect(screen.getByLabelText("Email")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText("Password")).toHaveAttribute("aria-invalid", "true");
    expect(apiRequestMock).not.toHaveBeenCalled();
  });

  it("toggles password visibility with an accessible button", async () => {
    const user = userEvent.setup();
    renderLoginForm();
    const password = screen.getByLabelText("Password");

    expect(password).toHaveAttribute("type", "password");
    await user.click(screen.getByRole("button", { name: "Show password" }));
    expect(password).toHaveAttribute("type", "text");
    expect(
      screen.getByRole("button", { name: "Hide password" }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("redirects after a successful login and shows invalid credentials", async () => {
    const user = userEvent.setup();
    apiRequestMock.mockResolvedValueOnce({ user: { role: "member" } });
    renderLoginForm();

    await user.type(screen.getByLabelText("Email"), "person@example.com");
    await user.type(screen.getByLabelText("Password"), "valid-password");
    await user.click(screen.getByRole("button", { name: "Sign In" }));

    expect(await screen.findByRole("status")).toHaveTextContent("You are signed in");
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/"));
    expect(signIn).toHaveBeenCalledWith("person@example.com", "valid-password", false);
  });

  it("shows invalid credentials without redirecting", async () => {
    renderLoginForm();
    apiRequestMock.mockRejectedValueOnce(
      new ApiError(
        "Invalid email or password.",
        401,
        {},
        "Invalid email or password.",
      ),
    );
    const retryUser = userEvent.setup();
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "person@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "another-password" },
    });
    await retryUser.click(screen.getByRole("button", { name: "Sign In" }));

    await waitFor(() =>
      expect(screen.getByText("Invalid email or password.")).toBeVisible(),
    );
    expect(replace).not.toHaveBeenCalled();
  });

  it("sends unverified accounts to email verification", async () => {
    const user = userEvent.setup();
    apiRequestMock.mockRejectedValueOnce(
      new BackendError("Verify your email.", 403, { code: "email_not_verified", email: "new@example.com" }),
    );
    renderLoginForm();

    await user.type(screen.getByLabelText("Email"), "new@example.com");
    await user.type(screen.getByLabelText("Password"), "valid-password");
    await user.click(screen.getByRole("button", { name: "Sign In" }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/verify-email"));
    expect(JSON.parse(sessionStorage.getItem("stt-pending-verification") || "{}").email).toBe("new@example.com");
    expect(replace).not.toHaveBeenCalled();
  });

  it("links to password reset and pre-fills the email after a reset", async () => {
    sessionStorage.setItem("stt-login-notice", JSON.stringify({ email: "back@example.com", message: "Password reset." }));
    renderLoginForm();
    expect(screen.getByRole("link", { name: "Forgot password?" })).toHaveAttribute("href", "/forgot-password");
    await waitFor(() => expect(screen.getByLabelText("Email")).toHaveValue("back@example.com"));
  });

  it("redirects team administrators to the project and task workspace", async () => {
    const user = userEvent.setup();
    apiRequestMock.mockResolvedValueOnce({ user: { role: "admin" } });
    renderLoginForm();

    await user.type(screen.getByLabelText("Email"), "admin@example.com");
    await user.type(screen.getByLabelText("Password"), "valid-password");
    await user.click(screen.getByRole("button", { name: "Sign In" }));

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/"));
  });
});
