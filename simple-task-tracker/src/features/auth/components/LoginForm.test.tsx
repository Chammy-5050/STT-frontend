import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api-client";
import { LoginForm } from "@/features/auth/components/LoginForm";

const { replace, signIn } = vi.hoisted(() => ({
  signIn: vi.fn(),
  replace: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
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
    apiRequestMock.mockReset();
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

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/"));
    expect(signIn).toHaveBeenCalledWith("person@example.com", "valid-password", false);

    replace.mockReset();
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
