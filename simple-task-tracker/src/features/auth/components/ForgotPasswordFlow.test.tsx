import { useState } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api";
import { ForgotPasswordFlow } from "@/features/auth/components/ForgotPasswordFlow";
import { CodeInput } from "@/features/auth/components/FlowParts";

const { replace, push, flows } = vi.hoisted(() => ({
  replace: vi.fn(),
  push: vi.fn(),
  flows: {
    forgotPassword: vi.fn(),
    resendCode: vi.fn(),
    verifyResetCode: vi.fn(),
    resetPassword: vi.fn(),
    verifyEmail: vi.fn(),
  },
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace, push }) }));
vi.mock("@/features/auth/flows", async importOriginal => ({
  ...(await importOriginal<typeof import("@/features/auth/flows")>()),
  authFlows: flows,
  atLeast: <T,>(promise: Promise<T>) => promise,
}));

function ControlledCode({ onComplete }: { onComplete: (value: string) => void }) {
  const [value, setValue] = useState("");
  return <CodeInput value={value} onChange={setValue} onComplete={onComplete} />;
}

describe("CodeInput", () => {
  it("fills every box from a paste and steps back with Backspace", async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(<ControlledCode onComplete={onComplete} />);
    const boxes = screen.getAllByRole("textbox");
    expect(boxes).toHaveLength(6);

    fireEvent.paste(boxes[0], { clipboardData: { getData: () => "12 34-56" } });
    expect(boxes.map(box => (box as HTMLInputElement).value).join("")).toBe("123456");
    expect(onComplete).toHaveBeenCalledWith("123456");

    await user.click(boxes[5]);
    await user.keyboard("{Backspace}{Backspace}");
    expect(boxes.map(box => (box as HTMLInputElement).value).join("")).toBe("1234");
    expect(boxes[4]).toHaveFocus();
  });

  it("advances focus as digits are typed and ignores letters", async () => {
    const user = userEvent.setup();
    render(<ControlledCode onComplete={vi.fn()} />);
    const boxes = screen.getAllByRole("textbox");
    await user.click(boxes[0]);
    await user.keyboard("7a8");
    expect((boxes[0] as HTMLInputElement).value).toBe("7");
    expect((boxes[1] as HTMLInputElement).value).toBe("8");
    expect(boxes[2]).toHaveFocus();
  });
});

describe("ForgotPasswordFlow", () => {
  beforeEach(() => {
    Object.values(flows).forEach(mock => mock.mockReset());
    replace.mockReset();
    push.mockReset();
    sessionStorage.clear();
  });

  it("walks from email to a new password and back to sign in", async () => {
    const user = userEvent.setup();
    flows.forgotPassword.mockResolvedValue({ resend_in: 45 });
    flows.verifyResetCode.mockResolvedValue({ reset_token: "signed-token" });
    flows.resetPassword.mockResolvedValue({ detail: "ok" });
    render(<ForgotPasswordFlow />);

    await user.type(screen.getByLabelText("Email address"), "kenneth@gmail.com");
    await user.click(screen.getByRole("button", { name: "Send reset code" }));

    expect(await screen.findByRole("heading", { name: "Check your inbox" })).toBeInTheDocument();
    expect(flows.forgotPassword).toHaveBeenCalledWith("kenneth@gmail.com");
    expect(screen.getByText("k***@gmail.com")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open email app" })).toHaveAttribute("href", "https://mail.google.com/mail/u/0/#inbox");
    expect(screen.getByText(/Resend code in 00:4\d/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Enter reset code" }));
    fireEvent.paste(await screen.findByLabelText("Digit 1 of 6"), { clipboardData: { getData: () => "482913" } });
    await waitFor(() => expect(flows.verifyResetCode).toHaveBeenCalledWith("kenneth@gmail.com", "482913"));

    expect(await screen.findByRole("heading", { name: "Reset your Password" })).toBeInTheDocument();
    const submit = screen.getByRole("button", { name: "Reset password" });
    await user.type(screen.getByLabelText("Password"), "weak");
    expect(submit).toBeDisabled();
    expect(screen.getByRole("meter", { name: "Password strength" })).toHaveAttribute("aria-valuetext", "Too weak");
    await user.clear(screen.getByLabelText("Password"));
    await user.type(screen.getByLabelText("Password"), "Str0ng!Pass");
    await user.type(screen.getByLabelText("Confirm password"), "Str0ng!Pass");
    expect(screen.getByRole("meter", { name: "Password strength" })).toHaveAttribute("aria-valuetext", "Strong");
    await user.click(submit);

    expect(await screen.findByRole("heading", { name: "Password reset successful" })).toBeInTheDocument();
    expect(flows.resetPassword).toHaveBeenCalledWith("signed-token", "Str0ng!Pass", "Str0ng!Pass");
    await user.click(screen.getByRole("button", { name: "Back to Sign In" }));
    expect(replace).toHaveBeenCalledWith("/login");
    expect(JSON.parse(sessionStorage.getItem("stt-login-notice") || "{}").email).toBe("kenneth@gmail.com");
  });

  it("shows the server's message for a wrong code and clears the boxes", async () => {
    const user = userEvent.setup();
    flows.forgotPassword.mockResolvedValue({ resend_in: 45 });
    flows.verifyResetCode.mockRejectedValue(new ApiError("bad", 400, { code: "That code is incorrect or has expired." }));
    render(<ForgotPasswordFlow />);
    await user.type(screen.getByLabelText("Email address"), "someone@company.com");
    await user.click(screen.getByRole("button", { name: "Send reset code" }));
    expect(await screen.findByRole("link", { name: "Open email app" })).toHaveAttribute("href", "mailto:");
    await user.click(screen.getByRole("button", { name: "Enter reset code" }));
    fireEvent.paste(await screen.findByLabelText("Digit 1 of 6"), { clipboardData: { getData: () => "000000" } });
    expect(await screen.findByRole("alert")).toHaveTextContent("That code is incorrect or has expired.");
    expect((screen.getByLabelText("Digit 1 of 6") as HTMLInputElement).value).toBe("");
  });

  it("validates the email before sending and reports rate limits", async () => {
    const user = userEvent.setup();
    flows.forgotPassword.mockRejectedValue(new ApiError("Request was throttled. Expected available in 600 seconds.", 429));
    render(<ForgotPasswordFlow />);
    await user.click(screen.getByRole("button", { name: "Send reset code" }));
    expect(screen.getByText("Enter your email address.")).toBeInTheDocument();
    expect(flows.forgotPassword).not.toHaveBeenCalled();
    await user.type(screen.getByLabelText("Email address"), "a@b.co");
    await user.click(screen.getByRole("button", { name: "Send reset code" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Too many attempts. Try again in 10 minutes.");
  });
});
