"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LockKeyhole, Mail, UserRound } from "lucide-react";
import AuthLogo from "./AuthLogo";
import LoadingView from "./LoadingView";
import { addDemoAccount, findDemoAccount, hashDemoPassword } from "@/lib/demoAccounts";

export default function RegisterForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const checks = useMemo(() => [
    { label: "8+ characters", valid: password.length >= 8 },
    { label: "Lowercase", valid: /[a-z]/.test(password) },
    { label: "Uppercase", valid: /[A-Z]/.test(password) },
    { label: "Number", valid: /\d/.test(password) },
    { label: "Special character", valid: /[^A-Za-z0-9]/.test(password) },
  ], [password]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    if (normalizedEmail === "admin@gmail.com" || normalizedEmail === "demo@tasktracker.local") {
      setMessage("That email is reserved for a built-in demo account.");
      return;
    }
    if (findDemoAccount(normalizedEmail)) {
      setMessage("An account already exists with this email. Sign in instead.");
      return;
    }
    if (password !== confirmPassword) {
      setMessage("Your passwords do not match.");
      return;
    }
    if (!checks.every((check) => check.valid)) {
      setMessage("Please meet all password requirements.");
      return;
    }
    setLoading(true);
    try {
      const account = {
        id: normalizedEmail,
        name: name.trim(),
        email: normalizedEmail,
        passwordHash: await hashDemoPassword(password),
        createdAt: new Date().toISOString(),
      };
      if (!addDemoAccount(account)) {
        setMessage("An account already exists with this email. Sign in instead.");
        setLoading(false);
        return;
      }
      window.sessionStorage.setItem("stt-demo-registration-notice", JSON.stringify({ name: account.name, email: account.email }));
      router.push("/login");
    } catch {
      setMessage("Could not save this demo account in this browser.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <LoadingView />;

  return (
    <div className="auth-card register-card">
      <AuthLogo />
      <h1>Create your account</h1>
      <div className="auth-steps"><span className="current">1&nbsp; Details</span><i /> <span>2&nbsp; Verify email</span><i /> <span>3&nbsp; Complete</span></div>
      <form onSubmit={submit}>
        <label className="auth-label">Full name<span className="auth-input"><UserRound size={16} /><input value={name} onChange={(event) => setName(event.target.value)} placeholder="Your full name" required /></span><small>Required</small></label>
        <label className="auth-label">Email address<span className="auth-input"><Mail size={16} /><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required /></span><small>We&apos;ll send a verification code.</small></label>
        <div className="auth-password-grid">
          <label className="auth-label">Password<span className="auth-input"><LockKeyhole size={15} /><input type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" required /><button type="button" aria-label="Toggle password visibility" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={15} /> : <Eye size={15} />}</button></span></label>
          <label className="auth-label">Confirm password<span className="auth-input"><LockKeyhole size={15} /><input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Repeat password" required /></span></label>
        </div>
        <small className="password-hint">8+ characters</small>
        <div className="password-checks">{checks.map((check) => <span className={check.valid ? "valid" : ""} key={check.label}>{check.valid ? "✓" : "○"} {check.label}</span>)}</div>
        <label className="terms-option"><input type="checkbox" checked={acceptedTerms} onChange={(event) => setAcceptedTerms(event.target.checked)} required /> I agree to the Terms and Conditions</label>
        {message && <p className="auth-message" role="status">{message}</p>}
        <button className="auth-submit" type="submit" disabled={!acceptedTerms}>Sign Up</button>
      </form>
      <p className="auth-switch">Already have an account? <Link href="/login">Sign In</Link></p>
    </div>
  );
}
