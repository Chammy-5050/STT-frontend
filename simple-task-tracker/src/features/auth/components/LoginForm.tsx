"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Mail } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { ApiError } from "@/lib/api-client";
import { authFieldVariants, authFieldsVariants } from "@/lib/motion";
import { EmailNotVerifiedError, useLogin } from "@/features/auth/hooks/useLogin";
import { LogoSpinner } from "@/features/auth/components/FlowParts";
import { savePendingVerification, takeLoginNotice } from "@/features/auth/flows";
import {
  loginSchema,
  type LoginFormValues,
} from "@/features/auth/schemas";
import { PasswordInput } from "@/components/shared/PasswordInput";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

export function LoginForm() {
  const router = useRouter();
  const mutation = useLogin();
  const reduceMotion = useReducedMotion();
  const submitLock = useRef(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [signedIn, setSignedIn] = useState(false);
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", rememberMe: false },
  });

  useEffect(() => {
    const notice = takeLoginNotice();
    if (!notice) return;
    if (notice.email) form.setValue("email", notice.email);
    toast.success(notice.message);
  }, [form]);

  const clearFormError = () => {
    if (formError) setFormError(null);
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    if (submitLock.current) {
      event.preventDefault();
      return;
    }
    submitLock.current = true;

    void form.handleSubmit(
      async (values) => {
        setFormError(null);
        form.clearErrors(["email", "password"]);

        try {
          await mutation.mutateAsync(values);
          setSignedIn(true);
          // Let the "You are signed in" confirmation register before the workspace loads.
          window.setTimeout(() => router.replace("/"), reduceMotion ? 0 : 700);
        } catch (error) {
          if (error instanceof EmailNotVerifiedError) {
            savePendingVerification({ email: error.email });
            toast.info("Verify your email to finish signing in. We sent you a code.");
            router.push("/verify-email");
          } else if (error instanceof ApiError) {
            for (const field of ["email", "password"] as const) {
              const message = error.fieldErrors[field];
              if (message) form.setError(field, { type: "server", message });
            }

            if (error.detail) setFormError(error.detail);
            if (error.status === 0 || error.status >= 500) {
              toast.error(error.message);
            }
          } else {
            toast.error("An unexpected error occurred. Please try again.");
          }
        } finally {
          submitLock.current = false;
        }
      },
      () => {
        submitLock.current = false;
      },
    )(event);
  };

  const isSubmitting = mutation.isPending || form.formState.isSubmitting;

  if (signedIn) {
    return (
      <motion.div
        role="status"
        initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex min-h-64 flex-col items-center justify-center gap-4 text-center"
      >
        <LogoSpinner />
        <p className="text-lg font-bold text-auth-foreground">You are signed in</p>
      </motion.div>
    );
  }

  return (
    <>
      <h1 className="mb-5 text-center text-xl font-bold tracking-tight text-auth-foreground sm:text-2xl">
        Sign in to Task Tracker
      </h1>
      <Form {...form}>
        <form noValidate onSubmit={submit} className="space-y-4">
          <motion.div
            variants={authFieldsVariants}
            initial={reduceMotion ? false : "hidden"}
            animate="visible"
            className="space-y-3.5"
          >
            <FormField
              control={form.control}
              name="email"
              render={({ field, fieldState }) => (
                <motion.div variants={authFieldVariants}>
                  <FormItem>
                    <FormLabel htmlFor="email">Email</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail
                          aria-hidden="true"
                          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-auth-muted"
                        />
                        <Input
                          {...field}
                          id="email"
                          type="email"
                          autoComplete="email"
                          placeholder="Enter email"
                          variant="lavender"
                          aria-invalid={Boolean(fieldState.error)}
                          aria-describedby={
                            fieldState.error ? "email-error" : "email-description"
                          }
                          className="h-11 pl-9 text-sm"
                          onChange={(event) => {
                            field.onChange(event);
                            clearFormError();
                          }}
                        />
                      </div>
                    </FormControl>
                    {fieldState.error ? (
                      <FormMessage id="email-error">
                        {fieldState.error.message}
                      </FormMessage>
                    ) : (
                      <FormDescription id="email-description">
                        Use your account email
                      </FormDescription>
                    )}
                  </FormItem>
                </motion.div>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field, fieldState }) => (
                <motion.div variants={authFieldVariants}>
                  <FormItem>
                    <FormLabel htmlFor="password">Password</FormLabel>
                    <FormControl>
                      <PasswordInput
                        {...field}
                        id="password"
                        autoComplete="current-password"
                        placeholder="Password"
                        invalid={Boolean(fieldState.error)}
                        aria-describedby={
                          fieldState.error
                            ? "password-error"
                            : "password-description"
                        }
                        onChange={(event) => {
                          field.onChange(event);
                          clearFormError();
                        }}
                      />
                    </FormControl>
                    {fieldState.error ? (
                      <FormMessage id="password-error">
                        {fieldState.error.message}
                      </FormMessage>
                    ) : (
                      <FormDescription id="password-description">
                        Keep your password private
                      </FormDescription>
                    )}
                  </FormItem>
                </motion.div>
              )}
            />
          </motion.div>

          <FormField
            control={form.control}
            name="rememberMe"
            render={({ field }) => (
              <div className="flex items-center justify-between gap-3 py-0.5">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="rememberMe"
                    checked={Boolean(field.value)}
                    onCheckedChange={(checked) => field.onChange(checked === true)}
                  />
                  <FormLabel htmlFor="rememberMe" className="cursor-pointer text-xs">
                    Remember me
                  </FormLabel>
                </div>
                <Link
                  href="/forgot-password"
                  className="rounded-sm text-xs font-semibold text-auth-link underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-auth-focus"
                >
                  Forgot password?
                </Link>
              </div>
            )}
          />

          <AnimatePresence initial={false}>
            {formError && (
              <motion.div
                key={formError}
                role="alert"
                aria-live="assertive"
                initial={reduceMotion ? false : { opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}
                transition={{ duration: reduceMotion ? 0 : 0.18 }}
                className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive"
              >
                {formError}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            whileTap={
              reduceMotion || isSubmitting ? undefined : { scale: 0.98 }
            }
          >
            <Button
              type="submit"
              variant="authPrimary"
              size="lg"
              disabled={isSubmitting}
              className="h-11 w-full text-sm font-semibold"
            >
              {isSubmitting ? (
                <>
                  <Loader2 aria-hidden="true" className="size-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </motion.div>

          <p className="pt-1 text-center text-xs text-auth-subtle-text">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-semibold text-auth-link underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-auth-focus"
            >
              Sign Up
            </Link>
          </p>
        </form>
      </Form>
    </>
  );
}
