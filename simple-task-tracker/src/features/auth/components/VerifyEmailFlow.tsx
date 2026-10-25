"use client";

import { useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { Mail } from "lucide-react";
import { toast } from "sonner";
import {
  authFlows, clearPendingVerification, flowError, maskEmail, pendingVerificationSnapshot, readPendingVerification,
  saveLoginNotice, savePendingVerification, CODE_LENGTH, RESEND_SECONDS,
} from "@/features/auth/flows";
import { CodeInput, FlowHeading, PendingLabel, ResendCode, SuccessBadge, TextAction } from "@/features/auth/components/FlowParts";
import { Button } from "@/components/ui/button";

const noSubscription = () => () => {};

export function VerifyEmailFlow() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const busy = useRef(false);
  // Read after hydration so the server-rendered page and the first client render agree.
  const raw = useSyncExternalStore(noSubscription, pendingVerificationSnapshot, () => undefined);
  const pending = raw === undefined ? undefined : readPendingVerification();
  const [resentAt, setResentAt] = useState<number>();
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState<string>();
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [verifiedEmail, setVerifiedEmail] = useState<string>();

  if (pending === undefined && !verifiedEmail) return <p role="status" className="py-10 text-center text-sm text-auth-subtle-text">Loading…</p>;

  if (verifiedEmail) {
    return (
      <motion.div initial={reduceMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <SuccessBadge />
        <FlowHeading title="Email verified">Your account is ready. Sign in to start tracking your work.</FlowHeading>
        <Button variant="authPrimary" size="lg" autoFocus className="h-11 w-full text-sm font-semibold" onClick={() => router.replace("/login")}>
          Continue to Sign In
        </Button>
      </motion.div>
    );
  }

  if (!pending) {
    return (
      <div className="space-y-4 text-center">
        <FlowHeading icon={<Mail aria-hidden="true" className="size-5" />} title="Verify your email">
          Sign in with your email and password and we&apos;ll send you a new verification code.
        </FlowHeading>
        <Button variant="authPrimary" size="lg" className="h-11 w-full text-sm font-semibold" onClick={() => router.replace("/login")}>
          Go to Sign In
        </Button>
      </div>
    );
  }

  const { email } = pending;
  const deadline = (resentAt ?? pending.sentAt) + RESEND_SECONDS * 1000;

  const verify = (value = code) => {
    if (busy.current) return;
    if (value.length !== CODE_LENGTH) { setCodeError("Enter all 6 digits of the code."); return; }
    busy.current = true;
    setVerifying(true);
    setCodeError(undefined);
    authFlows.verifyEmail(email, value)
      .then(() => {
        clearPendingVerification();
        saveLoginNotice({ email, message: "Email verified. Sign in to continue." });
        setVerifiedEmail(email);
      })
      .catch(error => { setCodeError(flowError(error)); setCode(""); })
      .finally(() => { busy.current = false; setVerifying(false); });
  };

  const resend = () => {
    if (busy.current) return;
    busy.current = true;
    setResending(true);
    authFlows.resendCode(email, "email_verify")
      .then(() => {
        savePendingVerification({ email, name: pending.name });
        setResentAt(Date.now());
        setCode("");
        setCodeError(undefined);
        toast.success("We sent a new code. Only the newest code works.");
      })
      .catch(error => toast.error(flowError(error)))
      .finally(() => { busy.current = false; setResending(false); });
  };

  return (
    <form noValidate onSubmit={(event: FormEvent<HTMLFormElement>) => { event.preventDefault(); verify(); }} className="space-y-4">
      <FlowHeading icon={<Mail aria-hidden="true" className="size-5" />} title="Verify your email">
        Enter the 6-digit code sent to <b className="font-semibold text-auth-foreground">{maskEmail(email)}</b>.
      </FlowHeading>
      <div className="space-y-1.5">
        <CodeInput
          value={code}
          onChange={value => { setCode(value); setCodeError(undefined); }}
          onComplete={verify}
          invalid={Boolean(codeError)}
          disabled={verifying}
          describedBy="verifyCode-help"
          autoFocus
        />
        <p id="verifyCode-help" role={codeError ? "alert" : undefined} className={codeError ? "text-xs font-medium text-destructive" : "text-xs text-auth-muted"}>
          {codeError ?? "Enter the 6-digit code from your email."}
        </p>
      </div>
      <Button type="submit" variant="authPrimary" size="lg" disabled={verifying || code.length !== CODE_LENGTH} className="h-11 w-full text-sm font-semibold">
        {verifying ? <PendingLabel>Verifying…</PendingLabel> : "Verify code"}
      </Button>
      <ResendCode deadline={deadline} onResend={resend} pending={resending} />
      <div className="flex flex-col items-center gap-3">
        <TextAction onClick={() => { clearPendingVerification(); router.push("/register"); }}>Change email</TextAction>
        <TextAction onClick={() => router.push("/login")}>Back to Sign In</TextAction>
      </div>
    </form>
  );
}
