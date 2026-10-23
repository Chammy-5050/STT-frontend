"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import AuthLogo from "./AuthLogo";
import { findDemoAccount, hashDemoPassword } from "@/lib/demoAccounts";

export default function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    const savedNotice = window.sessionStorage.getItem("stt-demo-registration-notice");
    if (!savedNotice) return;
    window.sessionStorage.removeItem("stt-demo-registration-notice");
    try {
      const registration = JSON.parse(savedNotice) as { name?: string; email?: string };
      if (registration.email) setEmail(registration.email);
      setMessage(`Account created successfully${registration.name ? ` for ${registration.name}` : ""}. Sign in to continue.`);
    } catch {
      setMessage("Account created successfully. Sign in to continue.");
    }
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const enteredEmail = String(new FormData(event.currentTarget).get("email") ?? "").trim().toLowerCase();
    const password = String(new FormData(event.currentTarget).get("password") ?? "");
    const role = enteredEmail === "admin@gmail.com" ? "admin" : "user";
    if (role === "user" && enteredEmail !== "demo@tasktracker.local") {
      const account = findDemoAccount(enteredEmail);
      if (!account) {
        setMessage("No account found for this email. Create an account first.");
        return;
      }
      try {
        if (account.passwordHash !== await hashDemoPassword(password)) {
          setMessage("The email or password is incorrect.");
          return;
        }
      } catch {
        setMessage("Could not verify this demo account in your browser.");
        return;
      }
    }
    window.sessionStorage.setItem("stt-demo-role", role);
    window.sessionStorage.setItem("stt-demo-email", enteredEmail);
    setMessage(`Opening the ${role === "admin" ? "admin" : "user"} workspace...`);
    window.setTimeout(() => router.push(role === "admin" ? "/admin" : "/dashboard"), 450);
  }

  return (
    <div className="auth-card login-card">
      <AuthLogo />
      <h1>Sign in to Task Tracker</h1>
      <form onSubmit={submit}>
        <label className="auth-label">Email
          <span className="auth-input"><Mail size={16} /><input name="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Enter email" required /></span>
          <small>{email ? (email.trim().toLowerCase() === "admin@gmail.com" ? "Administrator account detected." : "Standard user account detected.") : "Your role is identified from your email."}</small>
        </label>
        <label className="auth-label">Password
          <span className="auth-input"><LockKeyhole size={16} /><input name="password" type={showPassword ? "text" : "password"} placeholder="Password" required /><button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></span>
          <small>Keep your password private.</small>
        </label>
        <div className="auth-options"><label className="remember-option"><input type="checkbox" /> Remember me</label><a href="#forgot-password" onClick={(event) => { event.preventDefault(); setMessage("Password reset is not connected yet."); }}>Forgot password?</a></div>
        <button className="auth-submit" type="submit">Sign In</button>
        {message && <p className="auth-message" role="status">{message}</p>}
      </form>
      <p className="auth-switch">Don&apos;t have an account? <Link href="/register">Sign Up</Link></p>
    </div>
  );
}
