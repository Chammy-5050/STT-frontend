import type { Metadata } from "next";
import { AuthShell } from "@/components/shared/AuthShell";
import { ForgotPasswordFlow } from "@/features/auth/components/ForgotPasswordFlow";

export const metadata: Metadata = {
  title: "Reset password | Simple Task Tracker",
  description: "Reset your Simple Task Tracker password with a code sent to your email.",
};

export default function ForgotPasswordPage() {
  return (
    <AuthShell>
      <ForgotPasswordFlow />
    </AuthShell>
  );
}
