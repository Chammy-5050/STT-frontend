"use client";

import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api-client";
import type { RegisterFormValues } from "@/features/auth/schemas";

export type RegisterResponse = {
  simulated: boolean;
  detail?: string;
};

function parseRegisterResponse(payload: unknown): RegisterResponse {
  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
    return { simulated: false };
  }
  const result = payload as Record<string, unknown>;
  return {
    simulated: result.simulated === true,
    detail: typeof result.detail === "string" ? result.detail : undefined,
  };
}

export function useRegister() {
  return useMutation({
    mutationFn: ({
      fullName,
      email,
      password,
      confirmPassword,
      termsAccepted,
    }: RegisterFormValues) =>
      apiRequest<RegisterResponse>(
        "/api/auth/register/",
        {
          method: "POST",
          body: JSON.stringify({
            fullName,
            email,
            password,
            confirmPassword,
            termsAccepted,
          }),
        },
        parseRegisterResponse,
      ),
  });
}
