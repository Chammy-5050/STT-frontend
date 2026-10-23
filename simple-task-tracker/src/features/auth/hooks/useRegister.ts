"use client";

import { useMutation } from "@tanstack/react-query";
import { API_URL } from "@/lib/api";
import { apiRequest } from "@/lib/api-client";
import type { RegisterFormValues } from "@/features/auth/schemas";

export type RegisterResponse = {
  detail?: string;
};

function parseRegisterResponse(payload: unknown): RegisterResponse {
  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
    return {};
  }
  const result = payload as Record<string, unknown>;
  return {
    detail: typeof result.detail === "string" ? result.detail : undefined,
  };
}

export function useRegister() {
  return useMutation({
    mutationFn: ({
      fullName,
      phoneNo,
      email,
      password,
      confirmPassword,
    }: RegisterFormValues) =>
      apiRequest<RegisterResponse>(
        `${API_URL}/auth/register/`,
        {
          method: "POST",
          body: JSON.stringify({
            full_name: fullName,
            phone_no: phoneNo,
            email,
            password,
            password_confirm: confirmPassword,
          }),
        },
        parseRegisterResponse,
      ),
  });
}
