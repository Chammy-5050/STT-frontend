"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { Eye, EyeOff, LockKeyhole, Mail, UserRound } from "lucide-react";
import AuthLogo from "./AuthLogo";
import LoadingView from "./LoadingView";

export default function RegisterForm() {
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

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password !== confirmPassword) {
      setMessage("Your passwords do not match.");
      return;
    }
    if (!checks.every((check) => check.valid)) {
      setMessage("Please meet all password requirements.");
      return;
    }
    setMessage("Account creation is not connected to a service yet.");
    setLoading(true);
    window.setTimeout(() => setLoading(false), 1800);
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
