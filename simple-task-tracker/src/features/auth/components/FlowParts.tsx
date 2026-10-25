"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Check, LoaderCircle } from "lucide-react";
import { AuthMark } from "@/components/shared/AuthShell";
import { CODE_LENGTH, RESEND_SECONDS, passwordRules } from "@/features/auth/flows";
import { cn } from "@/lib/utils";

/** The brand mark in a purple disc, circled by a turning arc. */
export function LogoSpinner({ size = "md", spinning = true }: { size?: "sm" | "md"; spinning?: boolean }) {
  const reduceMotion = useReducedMotion();
  const small = size === "sm";
  return (
    <span aria-hidden="true" className={cn("relative inline-flex shrink-0 items-center justify-center", small ? "size-6" : "size-16")}>
      {small ? (
        <AuthMark className="size-3.5 text-white" />
      ) : (
        <span className="flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-[#7b4fe0] to-auth-primary text-white shadow-md shadow-auth-primary/30">
          <AuthMark className="size-7" />
        </span>
      )}
      {spinning && (
        <motion.svg
          viewBox="0 0 64 64"
          className="absolute inset-0 size-full"
          animate={reduceMotion ? undefined : { rotate: 360 }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
        >
          <circle cx="32" cy="32" r="29" fill="none" stroke="currentColor" strokeWidth={small ? 5 : 2.5}
            strokeLinecap="round" strokeDasharray="120 62" className={small ? "text-white" : "text-auth-primary"} />
        </motion.svg>
      )}
    </span>
  );
}

/** Full-screen progress state, e.g. "Sending reset code…". */
export function AuthLoader({ label }: { label: string }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      role="status"
      aria-live="polite"
      aria-label={label.replace(/…$/, "")}
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={reduceMotion ? undefined : { opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-white/95 px-6 backdrop-blur-sm"
    >
      <div className="flex w-full max-w-xs flex-col items-center">
        <LogoSpinner />
        <p className="mt-4 text-center text-base font-semibold text-auth-primary">{label}</p>
        <div aria-hidden="true" className="mt-3 h-1 w-40 overflow-hidden rounded-full bg-auth-input">
          <motion.div
            className="h-full w-1/2 rounded-full bg-auth-primary"
            animate={reduceMotion ? undefined : { x: ["-100%", "200%"] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      </div>
    </motion.div>
  );
}

export function FlowHeading({ icon, title, children }: { icon?: ReactNode; title: string; children?: ReactNode }) {
  return (
    <div className="mb-5 text-center">
      {icon && <div className="mb-2 flex justify-center text-auth-primary">{icon}</div>}
      <h1 className="text-xl font-bold tracking-tight text-auth-foreground sm:text-2xl">{title}</h1>
      {children && <p className="mt-2 text-sm leading-5 text-auth-subtle-text [overflow-wrap:anywhere]">{children}</p>}
    </div>
  );
}

export function SuccessBadge() {
  const reduceMotion = useReducedMotion();
  return (
    <motion.span
      aria-hidden="true"
      initial={reduceMotion ? false : { scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 18 }}
      className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full border-2 border-auth-primary p-1"
    >
      <span className="flex size-full items-center justify-center rounded-full bg-gradient-to-br from-[#7b4fe0] to-auth-primary text-white">
        <Check className="size-6" strokeWidth={3} />
      </span>
    </motion.span>
  );
}

/** Text-style action used for "Change email", "Back to Sign In" and similar. */
export function TextAction({ className, ...props }: React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      {...props}
      className={cn(
        "rounded-sm text-sm font-medium text-auth-link underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-auth-focus disabled:opacity-60",
        className,
      )}
    />
  );
}

type CodeInputProps = {
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  invalid?: boolean;
  disabled?: boolean;
  describedBy?: string;
  autoFocus?: boolean;
};

/** Six single-digit boxes that behave like one field: typing advances, paste fills, Backspace steps back. */
export function CodeInput({ value, onChange, onComplete, invalid, disabled, describedBy, autoFocus }: CodeInputProps) {
  const labelId = useId();
  const boxes = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length: CODE_LENGTH }, (_, index) => value[index] ?? "");

  useEffect(() => {
    if (autoFocus) boxes.current[0]?.focus();
  }, [autoFocus]);

  const update = (next: string, focusIndex: number) => {
    const clean = next.replace(/\D/g, "").slice(0, CODE_LENGTH);
    onChange(clean);
    boxes.current[Math.min(focusIndex, CODE_LENGTH - 1)]?.focus();
    if (clean.length === CODE_LENGTH) onComplete?.(clean);
  };

  const enter = (index: number, typed: string) => {
    const incoming = typed.replace(/\D/g, "");
    if (!incoming) return;
    // A paste or one-time-code autofill can deliver several digits at once.
    const next = (value.slice(0, index) + incoming).slice(0, CODE_LENGTH);
    update(next + value.slice(next.length), index + incoming.length);
  };

  return (
    <div>
      <p id={labelId} className="mb-1.5 text-sm font-medium text-auth-foreground">Verification code</p>
      <div role="group" aria-labelledby={labelId} aria-describedby={describedBy} className="flex justify-center gap-2">
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={element => { boxes.current[index] = element; }}
            value={digit}
            disabled={disabled}
            inputMode="numeric"
            autoComplete={index === 0 ? "one-time-code" : "off"}
            pattern="[0-9]*"
            aria-label={`Digit ${index + 1} of ${CODE_LENGTH}`}
            aria-invalid={invalid || undefined}
            placeholder="–"
            onFocus={event => event.target.select()}
            onChange={event => {
              const typed = event.target.value;
              // Typing into a filled box (when its text wasn't selected) reports the old digit plus the new one.
              const replaced = digit && typed.length === 2 ? (typed[0] === digit ? typed[1] : typed[0]) : typed;
              enter(index, replaced);
            }}
            onPaste={event => {
              event.preventDefault();
              enter(index, event.clipboardData.getData("text"));
            }}
            onKeyDown={event => {
              if (event.key === "Backspace") {
                event.preventDefault();
                if (digit) update(value.slice(0, index) + value.slice(index + 1), index);
                else if (index > 0) update(value.slice(0, index - 1) + value.slice(index), index - 1);
              } else if (event.key === "ArrowLeft" && index > 0) {
                event.preventDefault();
                boxes.current[index - 1]?.focus();
              } else if (event.key === "ArrowRight" && index < CODE_LENGTH - 1) {
                event.preventDefault();
                boxes.current[index + 1]?.focus();
              }
            }}
            className={cn(
              "aspect-square w-full max-w-12 min-w-0 rounded-lg border-2 border-transparent bg-auth-input text-center text-xl font-semibold text-auth-foreground outline-none transition-[border-color,box-shadow] placeholder:text-auth-muted focus:border-auth-primary focus:ring-2 focus:ring-auth-focus/30 disabled:opacity-60",
              invalid && "border-destructive",
            )}
          />
        ))}
      </div>
    </div>
  );
}

/** Ticks down to the moment another code may be requested. */
export function useCountdown(deadline: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, [deadline]);
  return Math.min(RESEND_SECONDS, Math.max(0, Math.ceil((deadline - now) / 1000)));
}

export function ResendCode({ deadline, onResend, pending }: { deadline: number; onResend: () => void; pending?: boolean }) {
  const remaining = useCountdown(deadline);
  if (remaining > 0 || pending) {
    return (
      <p className="text-center text-sm text-auth-subtle-text" aria-live="off">
        {pending ? "Sending a new code…" : `Resend code in 00:${String(remaining).padStart(2, "0")}`}
      </p>
    );
  }
  return (
    <p className="text-center text-sm text-auth-subtle-text">
      Didn&apos;t get it? <TextAction onClick={onResend} className="font-semibold">Resend code</TextAction>
    </p>
  );
}

const STRENGTH = ["Too weak", "Weak", "Fair", "Good", "Strong"];

export function PasswordStrength({ password }: { password: string }) {
  const met = passwordRules.filter(rule => rule.test(password)).length;
  const filled = Math.max(0, met - 1);
  const tone = filled >= 4 ? "bg-emerald-700" : filled >= 3 ? "bg-lime-700" : filled >= 2 ? "bg-amber-600" : "bg-red-600";
  return (
    <div className="space-y-2">
      <div
        role="meter"
        aria-label="Password strength"
        aria-valuemin={0}
        aria-valuemax={4}
        aria-valuenow={filled}
        aria-valuetext={STRENGTH[filled]}
        className="grid grid-cols-4 gap-1.5"
      >
        {[0, 1, 2, 3].map(index => (
          <span key={index} className={cn("h-1.5 rounded-full transition-colors", index < filled ? tone : "bg-white/70")} />
        ))}
      </div>
      <p className="flex justify-between text-xs font-medium text-auth-foreground">
        <span>Password requirements</span>
        <span aria-hidden="true">{password ? STRENGTH[filled] : ""}</span>
      </p>
      <ul aria-label="Password requirements" className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
        {passwordRules.map(rule => {
          const ok = rule.test(password);
          return (
            <li key={rule.label} className={cn("flex items-center gap-1.5", ok ? "text-emerald-800" : "text-auth-muted")}>
              {ok ? <Check aria-hidden="true" className="size-3.5" strokeWidth={3} /> : <span aria-hidden="true" className="size-3.5 rounded-full border border-current" />}
              {rule.label}
              <span className="sr-only">{ok ? " (met)" : " (not met)"}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function PendingLabel({ children }: { children: string }) {
  return (
    <>
      <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
      {children}
    </>
  );
}
