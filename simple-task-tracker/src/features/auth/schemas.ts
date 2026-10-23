import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Enter your email address.")
    .email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  rememberMe: z.boolean().optional(),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, "Enter your full name.")
      .max(100, "Your name must be 100 characters or fewer."),
    email: z
      .string()
      .trim()
      .min(1, "Enter your email address.")
      .email("Enter a valid email address.")
      .max(254, "Email must be 254 characters or fewer."),
    password: z
      .string()
      .min(8, "Use at least 8 characters.")
      .max(1024, "Password is too long.")
      .regex(/[a-z]/, "Add a lowercase letter.")
      .regex(/[A-Z]/, "Add an uppercase letter.")
      .regex(/[0-9]/, "Add a number.")
      .regex(/[^A-Za-z0-9]/, "Add a special character."),
    confirmPassword: z.string().min(1, "Confirm your password."),
    termsAccepted: z.boolean().refine((accepted) => accepted, {
      message: "Accept the Terms and Conditions to continue.",
    }),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;
