"use client";

import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api-client";
import type { LoginFormValues } from "@/features/auth/schemas";

export function useLogin() {
  return useMutation({
    mutationFn: (values: LoginFormValues) =>
      apiRequest("/api/auth/login/", {
        method: "POST",
        body: JSON.stringify(values),
      }),
  });
}
