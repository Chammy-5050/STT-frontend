import type { Metadata } from "next";
import { AuthShell } from "@/components/shared/AuthShell";
import { VerifyEmailFlow } from "@/features/auth/components/VerifyEmailFlow";

export const metadata: Metadata = {
  title: "Verify your email | Simple Task Tracker",
  description: "Confirm your email address to finish creating your account.",
};

export default function VerifyEmailPage() {
  return (
    <AuthShell>
      <VerifyEmailFlow />
    </AuthShell>
  );
}
