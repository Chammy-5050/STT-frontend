"use client";

import { useState, type FormEvent } from "react";
import { Camera, Check, Circle, Loader2, Moon, PencilLine, Sun } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/auth/AuthProvider";
import { api, ApiError, message } from "@/lib/api";
import { setTheme, useTheme } from "@/lib/theme";
import { Avatar, ConfirmDialog, Field, PageHeader, type ConfirmRequest } from "./ui";

const MAX_PICTURE_BYTES = 5 * 1024 * 1024;
const PASSWORD_RULES = [
  { label: "At least 8 characters", test: (value: string) => value.length >= 8 },
  { label: "An uppercase letter", test: (value: string) => /[A-Z]/.test(value) },
  { label: "A lowercase letter", test: (value: string) => /[a-z]/.test(value) },
  { label: "A number", test: (value: string) => /[0-9]/.test(value) },
  { label: "A special character", test: (value: string) => /[^A-Za-z0-9\s]/.test(value) },
];

type ProfileErrors = Partial<Record<"full_name" | "email" | "phone_no" | "form", string>>;
type PasswordErrors = Partial<Record<"current_password" | "password" | "password_confirm" | "form", string>>;

export default function Settings() {
  const { user, refreshUser, signOut } = useAuth();
  const theme = useTheme();
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState({ full_name: "", email: "", phone_no: "" });
  const [profileErrors, setProfileErrors] = useState<ProfileErrors>({});
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwords, setPasswords] = useState({ current_password: "", password: "", password_confirm: "" });
  const [passwordErrors, setPasswordErrors] = useState<PasswordErrors>({});
  const [confirm, setConfirm] = useState<ConfirmRequest | null>(null);
  if (!user) return null;

  function startEditing() {
    setProfile({ full_name: user!.full_name, email: user!.email, phone_no: user!.phone_no });
    setProfileErrors({});
    setEditing(true);
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next: ProfileErrors = {};
    if (!profile.full_name.trim()) next.full_name = "Enter your full name.";
    if (!/^\S+@\S+\.\S+$/.test(profile.email.trim())) next.email = "Enter a valid email address.";
    if (!profile.phone_no.trim()) next.phone_no = "Enter your phone number.";
    if (Object.keys(next).length) { setProfileErrors(next); return; }
    setSavingProfile(true);
    try {
      await api("/users/me/", { method: "PATCH", body: JSON.stringify({ full_name: profile.full_name.trim(), email: profile.email.trim(), phone_no: profile.phone_no.trim() }) });
      await refreshUser();
      setEditing(false);
      toast.success("Profile saved.");
    } catch (error) {
      const fields = error instanceof ApiError ? error.fields : {};
      setProfileErrors({ ...fields, form: Object.keys(fields).length ? undefined : message(error) });
    } finally { setSavingProfile(false); }
  }

  async function uploadPicture(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Choose an image file (PNG, JPG, GIF or WebP)."); return; }
    if (file.size > MAX_PICTURE_BYTES) { toast.error("Images must be 5 MB or smaller."); return; }
    setUploading(true);
    const body = new FormData();
    body.set("profile_picture", file);
    try {
      await api("/users/me/", { method: "PATCH", body });
      await refreshUser();
      toast.success("Profile picture updated.");
    } catch (error) { toast.error(message(error)); }
    finally { setUploading(false); }
  }

  function requestPasswordChange(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next: PasswordErrors = {};
    if (!passwords.current_password) next.current_password = "Enter your current password.";
    if (!PASSWORD_RULES.every(rule => rule.test(passwords.password))) next.password = "Choose a password that meets every rule below.";
    if (passwords.password !== passwords.password_confirm) next.password_confirm = "Passwords do not match.";
    if (Object.keys(next).length) { setPasswordErrors(next); return; }
    setConfirm({
      title: "Change your password?",
      message: "You will be signed out on this device and need to sign in again with your new password.",
      confirmLabel: "Change password",
      busyLabel: "Updating…",
      tone: "brand",
      onConfirm: async () => {
        try {
          await api("/users/me/password/", { method: "POST", body: JSON.stringify(passwords) });
        } catch (error) {
          const fields = error instanceof ApiError ? error.fields : {};
          setPasswordErrors({ ...fields, form: Object.keys(fields).length ? undefined : message(error) });
          // Close the confirmation so the field errors are visible on the form.
          setConfirm(null);
          return;
        }
        toast.success("Password updated. Sign in with your new password.");
        signOut();
      },
    });
  }

  const passwordField = (name: keyof typeof passwords, label: string, autoComplete: string) => (
    <Field label={label} error={passwordErrors[name]}>
      {control => <input {...control} className="input" type="password" name={name} autoComplete={autoComplete} value={passwords[name]}
        onChange={event => { setPasswords(current => ({ ...current, [name]: event.target.value })); setPasswordErrors(current => ({ ...current, [name]: undefined, form: undefined })); }} />}
    </Field>
  );

  return (
    <>
      <PageHeader trail={["Workspace", "Settings"]} title="Settings" description="Manage your profile, appearance and password." />
      <div className="settings-grid">
        <section className="panel settings-section" aria-labelledby="settings-profile">
          <div><h2 id="settings-profile">Profile</h2><p>Your name and photo are shown on projects and tasks you own.</p></div>
          <div>
            <div className="profile-summary">
              <Avatar name={user.full_name} src={user.profile_picture} size={64} />
              <div><b>{user.full_name}</b><small>{user.is_superuser ? "Team administrator" : "Member"}</small></div>
              <label className={`btn btn-secondary upload-button${uploading ? " is-busy" : ""}`}>
                {uploading ? <Loader2 size={16} className="spin" aria-hidden="true" /> : <Camera size={16} aria-hidden="true" />}
                {uploading ? "Uploading…" : "Upload photo"}
                <input aria-label="Profile picture" type="file" accept="image/*" disabled={uploading} onChange={event => { void uploadPicture(event.target.files?.[0]); event.target.value = ""; }} />
              </label>
            </div>
            {editing ? (
              <form className="settings-form" noValidate onSubmit={saveProfile} style={{ marginTop: 20 }}>
                <Field label="Full name" error={profileErrors.full_name}>
                  {control => <input {...control} className="input" autoFocus maxLength={255} autoComplete="name" value={profile.full_name} onChange={event => setProfile(current => ({ ...current, full_name: event.target.value }))} />}
                </Field>
                <div className="form-grid">
                  <Field label="Email" error={profileErrors.email}>
                    {control => <input {...control} className="input" type="email" autoComplete="email" value={profile.email} onChange={event => setProfile(current => ({ ...current, email: event.target.value }))} />}
                  </Field>
                  <Field label="Phone" error={profileErrors.phone_no}>
                    {control => <input {...control} className="input" type="tel" autoComplete="tel" maxLength={20} value={profile.phone_no} onChange={event => setProfile(current => ({ ...current, phone_no: event.target.value }))} />}
                  </Field>
                </div>
                {profileErrors.form && <p className="form-error" role="alert">{profileErrors.form}</p>}
                <div className="form-actions">
                  <button className="btn btn-primary" type="submit" disabled={savingProfile}>{savingProfile ? <><Loader2 size={16} className="spin" aria-hidden="true" />Saving…</> : "Save"}</button>
                  <button className="btn btn-secondary" type="button" disabled={savingProfile} onClick={() => setEditing(false)}>Cancel</button>
                </div>
              </form>
            ) : (
              <>
                <dl className="detail-list">
                  <dt>Email</dt><dd>{user.email}</dd>
                  <dt>Phone</dt><dd>{user.phone_no || "—"}</dd>
                </dl>
                <button type="button" className="btn btn-secondary" style={{ marginTop: 16 }} onClick={startEditing}><PencilLine size={16} />Edit</button>
              </>
            )}
          </div>
        </section>

        <section className="panel settings-section" aria-labelledby="settings-appearance">
          <div><h2 id="settings-appearance">Appearance</h2><p>Choose how Task Tracker looks on this device.</p></div>
          <div className="theme-options" role="group" aria-label="Color theme">
            {(["light", "dark"] as const).map(option => (
              <button type="button" key={option} className="theme-option" aria-pressed={theme === option} onClick={() => setTheme(option)}>
                <span className={`theme-preview ${option}`} aria-hidden="true"><i /><i /></span>
                <span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>{option === "dark" ? <Moon size={16} /> : <Sun size={16} />}{option === "dark" ? "Dark" : "Light"}</span>
                  {theme === option && <Check size={16} aria-hidden="true" />}
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="panel settings-section" aria-labelledby="settings-security">
          <div><h2 id="settings-security">Password</h2><p>Use a strong password you don&apos;t use anywhere else.</p></div>
          {changingPassword ? (
            <form className="settings-form" noValidate onSubmit={requestPasswordChange}>
              {passwordField("current_password", "Current password", "current-password")}
              <div className="form-grid">
                {passwordField("password", "New password", "new-password")}
                {passwordField("password_confirm", "Confirm new password", "new-password")}
              </div>
              <ul className="password-rules" aria-label="Password requirements">
                {PASSWORD_RULES.map(rule => {
                  const ok = rule.test(passwords.password);
                  return <li key={rule.label} className={ok ? "ok" : undefined}>{ok ? <Check size={14} aria-hidden="true" /> : <Circle size={10} aria-hidden="true" />}{rule.label}<span className="sr-only">{ok ? " (met)" : " (not met)"}</span></li>;
                })}
              </ul>
              {passwordErrors.form && <p className="form-error" role="alert">{passwordErrors.form}</p>}
              <div className="form-actions">
                <button className="btn btn-primary" type="submit">Save password</button>
                <button className="btn btn-secondary" type="button" onClick={() => { setChangingPassword(false); setPasswords({ current_password: "", password: "", password_confirm: "" }); setPasswordErrors({}); }}>Cancel</button>
              </div>
            </form>
          ) : (
            <div><button type="button" className="btn btn-secondary" onClick={() => setChangingPassword(true)}>Change</button></div>
          )}
        </section>
      </div>
      {confirm && <ConfirmDialog request={confirm} onClose={() => setConfirm(null)} />}
    </>
  );
}
