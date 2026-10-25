"use client";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/components/auth/AuthProvider";
import { ApiError as BackendError } from "@/lib/api";
import { ApiError } from "@/lib/api-client";
import type { LoginFormValues } from "@/features/auth/schemas";
/** The password was right but the account's email is not verified yet; a code was emailed. */
export class EmailNotVerifiedError extends Error {
  constructor(readonly email: string, message: string) { super(message); this.name = "EmailNotVerifiedError"; }
}

export function useLogin() {
  const { signIn } = useAuth();
  return useMutation({ mutationFn: async (values: LoginFormValues) => {
    try { return await signIn(values.email, values.password, values.rememberMe); }
    catch (error) {
      if (error instanceof BackendError && error.fields.code === "email_not_verified") {
        throw new EmailNotVerifiedError(error.fields.email || values.email, "Verify your email to sign in.");
      }
      if (error instanceof BackendError) throw new ApiError(error.message, error.status, {}, error.message);
      throw error;
    }
  }});
}
