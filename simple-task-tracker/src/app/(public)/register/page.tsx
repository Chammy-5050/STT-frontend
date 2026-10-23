import type { Metadata } from "next";
import { AuthShell } from "@/components/shared/AuthShell";
import { RegisterForm } from "@/features/auth/components/RegisterForm";

export const metadata: Metadata = {
  title: "Create account | Simple Task Tracker",
  description: "Create your Simple Task Tracker account.",
};

export default function RegisterPage() {
  return (
    <AuthShell>
      <RegisterForm />
    </AuthShell>
  );
}
