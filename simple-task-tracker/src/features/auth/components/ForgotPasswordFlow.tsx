"use client";

import { useRef, useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Mail } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { ApiError } from "@/lib/api";
import {
  atLeast, authFlows, flowError, inboxUrl, maskEmail, passwordRules, saveLoginNotice, CODE_LENGTH, RESEND_SECONDS,
} from "@/features/auth/flows";
import {
  AuthLoader, CodeInput, FlowHeading, LogoSpinner, PasswordStrength, PendingLabel, ResendCode, SuccessBadge, TextAction,
} from "@/features/auth/components/FlowParts";
import { PasswordInput } from "@/components/shared/PasswordInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Step = "email" | "inbox" | "code" | "reset" | "done";
const emailSchema = z.string().trim().min(1, "Enter your email address.").email("Enter a valid email address.");

function FormAlert({ children }: { children: ReactNode }) {
  return (
    <div role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
      {children}
    </div>
  );
}

export function ForgotPasswordFlow() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const busy = useRef(false);
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string>();
  const [sending, setSending] = useState(false);
  const [deadline, setDeadline] = useState(0);
  const [resending, setResending] = useState(false);
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState<string>();
  const [resetToken, setResetToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [passwordError, setPasswordError] = useState<string>();
  const [formError, setFormError] = useState<string>();
  const [tokenExpired, setTokenExpired] = useState(false);
  const [pending, setPending] = useState(false);

  const go = (next: Step) => { setFormError(undefined); setStep(next); };
  const backToSignIn = () => router.push("/login");
  const startCountdown = (seconds = RESEND_SECONDS) => setDeadline(Date.now() + seconds * 1000);

  /** Runs one request at a time so double clicks and Enter repeats can't send twice. */
  async function once(task: () => Promise<void>) {
    if (busy.current) return;
    busy.current = true;
    try { await task(); } finally { busy.current = false; }
  }

  const sendCode = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) { setEmailError(parsed.error.issues[0].message); return; }
    void once(async () => {
      setFormError(undefined);
      setSending(true);
      try {
        const result = await atLeast(authFlows.forgotPassword(parsed.data));
        setEmail(parsed.data);
        setCode("");
        startCountdown(result.resend_in);
        go("inbox");
      } catch (error) {
        setFormError(flowError(error));
      } finally {
        setSending(false);
      }
    });
  };

  const resend = () => void once(async () => {
    setResending(true);
    try {
      const result = await authFlows.resendCode(email, "password_reset");
      startCountdown(result.resend_in);
      setCode("");
      setCodeError(undefined);
      toast.success("We sent a new code. Only the newest code works.");
    } catch (error) {
      toast.error(flowError(error));
    } finally {
      setResending(false);
    }
  });

  const verify = (value = code) => void once(async () => {
    if (value.length !== CODE_LENGTH) { setCodeError("Enter all 6 digits of the code."); return; }
    setPending(true);
    setCodeError(undefined);
    try {
      const result = await authFlows.verifyResetCode(email, value);
      setResetToken(result.reset_token);
      go("reset");
    } catch (error) {
      setCodeError(flowError(error));
      setCode("");
    } finally {
      setPending(false);
    }
  });

  const passwordValid = passwordRules.every(rule => rule.test(password));
  const canReset = passwordValid && password === confirm;

  const reset = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canReset) return;
    void once(async () => {
      setPending(true);
      setFormError(undefined);
      setPasswordError(undefined);
      try {
        await authFlows.resetPassword(resetToken, password, confirm);
        saveLoginNotice({ email, message: "Password reset. Sign in with your new password." });
        setPassword("");
        setConfirm("");
        go("done");
      } catch (error) {
        const fields = error instanceof ApiError ? error.fields : {};
        if (fields.password) setPasswordError(fields.password);
        else {
          setTokenExpired(Boolean(fields.reset_token));
          setFormError(flowError(error));
        }
      } finally {
        setPending(false);
      }
    });
  };

  const masked = maskEmail(email);
  const mailIcon = <Mail aria-hidden="true" className="size-5" />;
  const changeEmail = <TextAction onClick={() => { setCode(""); setCodeError(undefined); go("email"); }}>Change email</TextAction>;
  const signInLink = <TextAction onClick={backToSignIn}>Back to Sign In</TextAction>;
  const inbox = inboxUrl(email);

  let body: ReactNode;
  if (step === "email") {
    body = (
      <form noValidate onSubmit={sendCode} className="space-y-4">
        <FlowHeading title="Forgot your password?">
          Enter your email and we will send a 6-digit reset code.
        </FlowHeading>
        <div className="space-y-1.5">
          <label htmlFor="resetEmail" className="text-sm font-medium text-auth-foreground">Email address</label>
          <div className="relative">
            <Mail aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-auth-muted" />
            <Input
              id="resetEmail"
              type="email"
              autoComplete="email"
              autoCapitalize="none"
              autoFocus
              maxLength={254}
              placeholder="Enter email address"
              variant="lavender"
              value={email}
              aria-invalid={Boolean(emailError)}
              aria-describedby={emailError ? "resetEmail-error" : "resetEmail-help"}
              onChange={event => { setEmail(event.target.value); setEmailError(undefined); setFormError(undefined); }}
              className="h-11 pl-9 text-sm"
            />
          </div>
          {emailError
            ? <p id="resetEmail-error" className="text-xs font-medium text-destructive">{emailError}</p>
            : <p id="resetEmail-help" className="text-xs text-auth-muted">Use the email address you registered with.</p>}
        </div>
        {formError && <FormAlert>{formError}</FormAlert>}
        <Button type="submit" variant="authPrimary" size="lg" disabled={sending} className="h-11 w-full text-sm font-semibold">
          Send reset code
        </Button>
        <div className="text-center">{signInLink}</div>
      </form>
    );
  } else if (step === "inbox") {
    body = (
      <div className="space-y-4">
        <FlowHeading icon={mailIcon} title="Check your inbox">
          We sent a reset code to <b className="font-semibold text-auth-foreground">{masked}</b>. Check your inbox or spam folder.
        </FlowHeading>
        <Button variant="authPrimary" size="lg" autoFocus className="h-11 w-full text-sm font-semibold" onClick={() => go("code")}>
          Enter reset code
        </Button>
        <Button asChild variant="outline" size="lg" className="h-11 w-full border-auth-primary bg-transparent text-sm font-semibold text-auth-link hover:bg-white/50">
          <a href={inbox} {...(inbox.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
            Open email app
          </a>
        </Button>
        <ResendCode deadline={deadline} onResend={resend} pending={resending} />
        <div className="flex flex-col items-center gap-3">{changeEmail}{signInLink}</div>
      </div>
    );
  } else if (step === "code") {
    body = (
      <form noValidate onSubmit={event => { event.preventDefault(); verify(); }} className="space-y-4">
        <FlowHeading icon={mailIcon} title="Enter your reset code">
          Enter the 6-digit code sent to <b className="font-semibold text-auth-foreground">{masked}</b>.
        </FlowHeading>
        <div className="space-y-1.5">
          <CodeInput
            value={code}
            onChange={value => { setCode(value); setCodeError(undefined); }}
            onComplete={verify}
            invalid={Boolean(codeError)}
            disabled={pending}
            describedBy="resetCode-help"
            autoFocus
          />
          <p id="resetCode-help" role={codeError ? "alert" : undefined} className={codeError ? "text-xs font-medium text-destructive" : "text-xs text-auth-muted"}>
            {codeError ?? "Enter the 6-digit code from your email."}
          </p>
        </div>
        <Button type="submit" variant="authPrimary" size="lg" disabled={pending || code.length !== CODE_LENGTH} className="h-11 w-full text-sm font-semibold">
          {pending ? <PendingLabel>Verifying…</PendingLabel> : "Verify code"}
        </Button>
        <ResendCode deadline={deadline} onResend={resend} pending={resending} />
        <div className="flex flex-col items-center gap-3">{changeEmail}{signInLink}</div>
      </form>
    );
  } else if (step === "reset") {
    body = (
      <form noValidate onSubmit={reset} className="space-y-4">
        <FlowHeading title="Reset your Password" />
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="min-w-0 space-y-1.5">
            <label htmlFor="newPassword" className="text-sm font-medium text-auth-foreground">Password</label>
            <PasswordInput
              id="newPassword"
              autoComplete="new-password"
              autoFocus
              placeholder="New password"
              value={password}
              invalid={Boolean(passwordError)}
              aria-describedby={passwordError ? "newPassword-error" : "newPassword-help"}
              onChange={event => { setPassword(event.target.value); setPasswordError(undefined); }}
            />
            {passwordError
              ? <p id="newPassword-error" className="text-xs font-medium text-destructive">{passwordError}</p>
              : <p id="newPassword-help" className="text-xs text-auth-muted">8+ characters</p>}
          </div>
          <div className="min-w-0 space-y-1.5">
            <label htmlFor="confirmNewPassword" className="text-sm font-medium text-auth-foreground">Confirm password</label>
            <PasswordInput
              id="confirmNewPassword"
              autoComplete="new-password"
              placeholder="Repeat password"
              value={confirm}
              invalid={Boolean(confirm) && confirm !== password}
              aria-describedby="confirmNewPassword-help"
              onChange={event => setConfirm(event.target.value)}
            />
            <p id="confirmNewPassword-help" className={confirm && confirm !== password ? "text-xs font-medium text-destructive" : "text-xs text-auth-muted"}>
              {confirm && confirm !== password ? "Passwords do not match." : "Repeat your password."}
            </p>
          </div>
        </div>
        <PasswordStrength password={password} />
        {formError && (
          <FormAlert>
            {formError}
            {tokenExpired && (
              <> <TextAction className="text-destructive underline" onClick={() => { setTokenExpired(false); go("email"); }}>Request a new code</TextAction></>
            )}
          </FormAlert>
        )}
        <Button type="submit" variant="authPrimary" size="lg" disabled={!canReset || pending} className="h-11 w-full text-sm font-semibold">
          {pending ? <><LogoSpinner size="sm" /><span className="sr-only">Resetting password…</span></> : "Reset password"}
        </Button>
        <div className="text-center">{signInLink}</div>
      </form>
    );
  } else {
    body = (
      <div className="text-center">
        <SuccessBadge />
        <FlowHeading title="Password reset successful">Use your new password to sign in.</FlowHeading>
        <Button variant="authPrimary" size="lg" autoFocus className="h-11 w-full text-sm font-semibold" onClick={() => router.replace("/login")}>
          Back to Sign In
        </Button>
      </div>
    );
  }

  return (
    <>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={step}
          initial={reduceMotion ? false : { opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={reduceMotion ? undefined : { opacity: 0, x: -16 }}
          transition={{ duration: reduceMotion ? 0 : 0.2, ease: "easeOut" }}
        >
          {body}
        </motion.div>
      </AnimatePresence>
      <AnimatePresence>{sending && <AuthLoader label="Sending reset code…" />}</AnimatePresence>
    </>
  );
}
