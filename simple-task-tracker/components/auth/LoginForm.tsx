"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import AuthLogo from "./AuthLogo";

export default function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("Opening your demo workspace…");
    window.setTimeout(() => router.push("/"), 450);
  }

  return (
    <div className="auth-card login-card">
      <AuthLogo />
      <h1>Sign in to Task Tracker</h1>
      <form onSubmit={submit}>
        <label className="auth-label">Email
          <span className="auth-input"><Mail size={16} /><input type="email" placeholder="Enter email" required /></span>
          <small>Use your account email.</small>
        </label>
        <label className="auth-label">Password
          <span className="auth-input"><LockKeyhole size={16} /><input type={showPassword ? "text" : "password"} placeholder="Password" required /><button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></span>
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
