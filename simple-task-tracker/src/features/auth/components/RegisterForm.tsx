"use client";

import {
  useRef,
  useState,
  type FormEvent,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from "framer-motion";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Check,
  CheckCircle2,
  LoaderCircle,
  Mail,
  UserRound,
} from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { ApiError } from "@/lib/api-client";
import { authFieldVariants, authFieldsVariants } from "@/lib/motion";
import { useRegister } from "@/features/auth/hooks/useRegister";
import {
  registerSchema,
  type RegisterFormValues,
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

const passwordRequirements = [
  { label: "8 or more characters", test: (value: string) => value.length >= 8 },
  { label: "Lowercase letter", test: (value: string) => /[a-z]/.test(value) },
  { label: "Uppercase letter", test: (value: string) => /[A-Z]/.test(value) },
  { label: "Number", test: (value: string) => /[0-9]/.test(value) },
  {
    label: "Special character",
    test: (value: string) => /[^A-Za-z0-9\s]/.test(value),
  },
];

function CreatingOverlay({ reduceMotion }: { reduceMotion: boolean }) {
  return (
    <motion.div
      key="creating"
      role="status"
      aria-live="polite"
      aria-label="Creating your account"
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={reduceMotion ? undefined : { opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-white/95 px-6 backdrop-blur-sm"
    >
      <div className="flex w-full max-w-xs flex-col items-center">
        <div className="relative mb-5 flex size-14 items-center justify-center rounded-full bg-auth-primary text-white">
          <CheckCircle2 aria-hidden="true" className="size-8" />
          {!reduceMotion && (
            <motion.span
              aria-hidden="true"
              className="absolute inset-[-5px] rounded-full border border-auth-primary"
              animate={{ rotate: 360 }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "linear" }}
            />
          )}
        </div>
        <p className="text-center text-sm font-semibold text-auth-primary">
          Creating your account…
        </p>
        <div
          role="progressbar"
          aria-label="Account creation in progress"
          aria-valuetext="Please wait"
          className="mt-3 h-1 w-36 overflow-hidden rounded-full bg-auth-input"
        >
          <motion.div
            className="h-full w-1/2 rounded-full bg-auth-primary"
            animate={reduceMotion ? undefined : { x: ["-100%", "200%"] }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>
      </div>
    </motion.div>
  );
}

export function RegisterForm() {
  const router = useRouter();
  const mutation = useRegister();
  const reduceMotion = useReducedMotion();
  const submitLock = useRef(false);
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    mode: "onTouched",
    defaultValues: {
      fullName: "",
      phoneNo: "",
      email: "",
      password: "",
      confirmPassword: "",
      termsAccepted: false,
    },
  });
  const password = useWatch({ control: form.control, name: "password" });

  const goToLogin = () => router.replace("/login");

  const submit = (event: FormEvent<HTMLFormElement>) => {
    if (submitLock.current) {
      event.preventDefault();
      return;
    }
    submitLock.current = true;

    void form.handleSubmit(
      async (values) => {
        setFormError(null);
        try {
          await mutation.mutateAsync(values);
          window.sessionStorage.setItem("stt-registration-notice", JSON.stringify({ name: values.fullName.trim(), email: values.email.trim().toLowerCase() }));
          form.reset();
          toast.success("Your account was created.");
          goToLogin();
        } catch (error) {
          if (error instanceof ApiError) {
            const serverFieldMap = [
              ["full_name", "fullName"],
              ["fullName", "fullName"],
              ["email", "email"],
              ["phone_no", "phoneNo"],
              ["password", "password"],
              ["password_confirm", "confirmPassword"],
              ["confirmPassword", "confirmPassword"],
              ["terms_accepted", "termsAccepted"],
              ["termsAccepted", "termsAccepted"],
            ] as const;
            for (const [serverField, formField] of serverFieldMap) {
              const message = error.fieldErrors[serverField];
              if (message) {
                form.setError(formField, { type: "server", message });
              }
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

  return (
    <>
      <h1 className="mb-5 text-center text-xl font-bold tracking-tight text-auth-foreground sm:text-2xl">
        Create your account
      </h1>
      <Form {...form}>
        <form
          noValidate
          onSubmit={submit}
          className="space-y-3.5"
          aria-busy={isSubmitting}
          inert={isSubmitting}
        >
          <motion.div
            variants={authFieldsVariants}
            initial={reduceMotion ? false : "hidden"}
            animate="visible"
            className="space-y-3"
            aria-busy={isSubmitting}
          >
            <FormField
              control={form.control}
              name="fullName"
              render={({ field, fieldState }) => (
                <motion.div variants={authFieldVariants}>
                  <FormItem>
                    <FormLabel htmlFor="fullName">Full name</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <UserRound
                          aria-hidden="true"
                          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-auth-muted"
                        />
                        <Input
                          {...field}
                          id="fullName"
                          type="text"
                          autoComplete="name"
                          maxLength={100}
                          placeholder="Your full name"
                          variant="lavender"
                          disabled={isSubmitting}
                          aria-invalid={Boolean(fieldState.error)}
                          aria-describedby={
                            fieldState.error ? "fullName-error" : undefined
                          }
                          className="h-10 pl-9 text-xs"
                        />
                      </div>
                    </FormControl>
                    {fieldState.error && (
                      <FormMessage id="fullName-error">
                        {fieldState.error.message}
                      </FormMessage>
                    )}
                  </FormItem>
                </motion.div>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field, fieldState }) => (
                <motion.div variants={authFieldVariants}>
                  <FormItem>
                    <FormLabel htmlFor="registerEmail">Email address</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail
                          aria-hidden="true"
                          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-auth-muted"
                        />
                        <Input
                          {...field}
                          id="registerEmail"
                          type="email"
                          autoComplete="email"
                          autoCapitalize="none"
                          maxLength={254}
                          placeholder="Enter your email"
                          variant="lavender"
                          disabled={isSubmitting}
                          aria-invalid={Boolean(fieldState.error)}
                          aria-describedby={
                            fieldState.error ? "registerEmail-error" : undefined
                          }
                          className="h-10 pl-9 text-xs"
                        />
                      </div>
                    </FormControl>
                    {fieldState.error && (
                      <FormMessage id="registerEmail-error">
                        {fieldState.error.message}
                      </FormMessage>
                    )}
                  </FormItem>
                </motion.div>
              )}
            />

            <FormField control={form.control} name="phoneNo" render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="phoneNo">Phone number</FormLabel>
                <FormControl><Input {...field} id="phoneNo" type="tel" autoComplete="tel" maxLength={20} placeholder="+255…" variant="lavender" disabled={isSubmitting} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField
              control={form.control}
              name="password"
              render={({ field, fieldState }) => (
                <motion.div variants={authFieldVariants}>
                  <FormItem>
                    <FormLabel htmlFor="registerPassword">Password</FormLabel>
                    <FormControl>
                      <PasswordInput
                        {...field}
                        id="registerPassword"
                        autoComplete="new-password"
                        placeholder="Create a password"
                        disabled={isSubmitting}
                        invalid={Boolean(fieldState.error)}
                        aria-describedby={
                          fieldState.error
                            ? "password-requirements registerPassword-error"
                            : "password-requirements"
                        }
                      />
                    </FormControl>
                    <FormDescription id="password-requirements">
                      Use at least 8 characters with lowercase and uppercase
                      letters, a number, and a special character.
                    </FormDescription>
                    <ul
                      aria-label="Password requirements"
                      className="grid grid-cols-2 gap-x-2 gap-y-1 pt-0.5 text-[9px] text-auth-muted"
                    >
                      {passwordRequirements.map((requirement) => {
                        const met = requirement.test(password);
                        return (
                          <li
                            key={requirement.label}
                            className={met ? "text-auth-link" : undefined}
                          >
                            <span className="inline-flex items-center gap-1">
                              {met ? (
                                <Check
                                  aria-hidden="true"
                                  className="size-3"
                                />
                              ) : (
                                <span
                                  aria-hidden="true"
                                  className="size-3"
                                />
                              )}
                              {requirement.label}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                    {fieldState.error && (
                      <FormMessage id="registerPassword-error">
                        {fieldState.error.message}
                      </FormMessage>
                    )}
                  </FormItem>
                </motion.div>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field, fieldState }) => (
                <motion.div variants={authFieldVariants}>
                  <FormItem>
                    <FormLabel htmlFor="confirmPassword">
                      Confirm password
                    </FormLabel>
                    <FormControl>
                      <PasswordInput
                        {...field}
                        id="confirmPassword"
                        autoComplete="new-password"
                        placeholder="Repeat your password"
                        disabled={isSubmitting}
                        invalid={Boolean(fieldState.error)}
                        aria-describedby={
                          fieldState.error ? "confirmPassword-error" : undefined
                        }
                      />
                    </FormControl>
                    {fieldState.error && (
                      <FormMessage id="confirmPassword-error">
                        {fieldState.error.message}
                      </FormMessage>
                    )}
                  </FormItem>
                </motion.div>
              )}
            />
          </motion.div>

          <FormField
            control={form.control}
            name="termsAccepted"
            render={({ field, fieldState }) => (
              <FormItem className="space-y-1">
                <div className="flex items-start gap-2">
                  <Checkbox
                    id="termsAccepted"
                    checked={field.value}
                    disabled={isSubmitting}
                    aria-invalid={Boolean(fieldState.error)}
                    aria-describedby={
                      fieldState.error ? "termsAccepted-error" : undefined
                    }
                    onCheckedChange={(checked) => field.onChange(checked === true)}
                  />
                  <FormLabel
                    htmlFor="termsAccepted"
                    className="cursor-pointer text-[10px] leading-4"
                  >
                    I agree to the Terms and Conditions.
                  </FormLabel>
                </div>
                {fieldState.error && (
                  <FormMessage id="termsAccepted-error">
                    {fieldState.error.message}
                  </FormMessage>
                )}
              </FormItem>
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
              className="h-10 w-full text-xs font-semibold"
            >
              {isSubmitting ? (
                <>
                  <LoaderCircle
                    aria-hidden="true"
                    className="size-4 animate-spin"
                  />
                  Creating account…
                </>
              ) : (
                "Create Account"
              )}
            </Button>
          </motion.div>

          <p className="pt-1 text-center text-[10px] text-auth-subtle-text">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-auth-link underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-auth-focus"
            >
              Sign In
            </Link>
          </p>
        </form>
      </Form>

      <AnimatePresence>
        {isSubmitting && <CreatingOverlay reduceMotion={Boolean(reduceMotion)} />}
      </AnimatePresence>
    </>
  );
}
