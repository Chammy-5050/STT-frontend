"use client";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/components/auth/AuthProvider";
import { ApiError as BackendError } from "@/lib/api";
import { ApiError } from "@/lib/api-client";
import type { LoginFormValues } from "@/features/auth/schemas";
export function useLogin() {
  const { signIn } = useAuth();
  return useMutation({ mutationFn: async (values: LoginFormValues) => {
    try { return await signIn(values.email, values.password, values.rememberMe); }
    catch (error) {
      if (error instanceof BackendError) throw new ApiError(error.message, error.status, {}, error.message);
      throw error;
    }
  }});
}
