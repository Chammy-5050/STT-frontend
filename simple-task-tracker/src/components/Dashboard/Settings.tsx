"use client";

import { useState, type FormEvent } from "react";
import { Check, LockKeyhole, Moon, Palette, Sun, UserRound } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { api, message } from "@/lib/api";
import styles from "./Settings.module.css";

type Props = { darkTheme: boolean; onThemeChange: (dark: boolean) => void };

export default function Settings({ darkTheme, onThemeChange }: Props) {
  const { user, refreshUser, signOut } = useAuth();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.full_name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone_no || "");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setNotice("");
    try {
      await api("/users/me/", { method: "PATCH", body: JSON.stringify({ full_name: name, email, phone_no: phone }) });
      await refreshUser(); setEditing(false); setNotice("Profile saved.");
    } catch (error) { setNotice(message(error)); }
    finally { setBusy(false); }
  }
  async function uploadPicture(file?: File) {
    if (!file) return;
    setBusy(true); setNotice("");
    const body = new FormData(); body.set("profile_picture", file);
    try { await api("/users/me/", { method: "PATCH", body }); await refreshUser(); setNotice("Profile picture updated."); }
    catch (error) { setNotice(message(error)); }
    finally { setBusy(false); }
  }
  async function savePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setBusy(true); setNotice("");
    try {
      await api("/users/me/password/", { method: "POST", body: JSON.stringify({ current_password: data.get("current_password"), password: data.get("password"), password_confirm: data.get("password_confirm") }) });
      form.reset(); signOut();
    } catch (error) { setNotice(message(error)); }
    finally { setBusy(false); }
  }
  return <div className={`${styles.settings} ${darkTheme ? styles.dark : ""}`}>
    <div className={styles.breadcrumb}>Workspace <span>/</span> Settings</div>
    <header className={styles.pageHeading}><div><span className={styles.eyebrow}>PREFERENCES</span><h2>Settings</h2><p>Manage your account and preferences.</p></div></header>
    {notice && <p className={styles.notice} role="status">{notice}</p>}
    <div className={styles.settingsList}>
      <section className={styles.card}>
        <div className={styles.sectionHeading}><span className={styles.icon}><Palette size={18} /></span><div><h3>Appearance</h3><p>Theme</p></div></div>
        <div className={styles.cardContent}><div className={styles.themePicker} role="group" aria-label="Color theme">{[false, true].map(dark => <button key={String(dark)} className={`${styles.themeOption} ${darkTheme === dark ? styles.active : ""}`} onClick={() => onThemeChange(dark)} aria-pressed={darkTheme === dark}>{dark ? <Moon size={16} /> : <Sun size={16} />}{dark ? "Dark" : "Light"}{darkTheme === dark && <Check size={15} />}</button>)}</div></div>
      </section>
      <section className={styles.card}>
        <div className={styles.sectionHeading}><span className={styles.icon}><UserRound size={18} /></span><div><h3>Profile</h3><p>{user?.full_name}</p></div></div>
        <div className={styles.cardContent}>{editing ? <form className={styles.inlineForm} onSubmit={saveProfile}>
          <label>Full name<input aria-label="Full name" value={name} onChange={event => setName(event.target.value)} maxLength={255} required /></label>
          <label>Email<input aria-label="Email" type="email" value={email} onChange={event => setEmail(event.target.value)} required /></label>
          <label>Phone<input aria-label="Phone" type="tel" value={phone} onChange={event => setPhone(event.target.value)} maxLength={20} required /></label>
          <button className={styles.actionButton} disabled={busy} type="submit">{busy ? "Saving…" : "Save"}</button><button className={styles.quietButton} type="button" onClick={() => setEditing(false)}>Cancel</button>
        </form> : <><span className={styles.detailText}>{user?.email}</span><button className={styles.actionButton} onClick={() => { setName(user?.full_name || ""); setEmail(user?.email || ""); setPhone(user?.phone_no || ""); setEditing(true); }}>Edit</button></>}</div>
        <div className={styles.cardContent}><label className="picture-upload">Profile picture<input aria-label="Profile picture" type="file" accept="image/*" disabled={busy} onChange={event => { void uploadPicture(event.target.files?.[0]); event.target.value = ""; }} /></label></div>
      </section>
      <section className={styles.card}>
        <div className={styles.sectionHeading}><span className={styles.icon}><LockKeyhole size={18} /></span><div><h3>Security</h3><p>Password</p></div></div>
        <div className={styles.cardContent}>{changingPassword ? <form className={styles.inlineForm} onSubmit={savePassword}>
          <label>Current password<input aria-label="Current password" name="current_password" type="password" autoComplete="current-password" required /></label>
          <label>New password<input aria-label="New password" name="password" type="password" autoComplete="new-password" minLength={8} required /></label>
          <label>Confirm new password<input aria-label="Confirm new password" name="password_confirm" type="password" autoComplete="new-password" required /></label>
          <small>8+ characters with uppercase, lowercase, a number, and a special character. Sign in again after saving.</small>
          <button className={styles.actionButton} type="submit" disabled={busy}>Save password</button><button className={styles.quietButton} type="button" onClick={() => setChangingPassword(false)}>Cancel</button>
        </form> : <><span className={styles.detailText}>Update your password</span><button className={styles.actionButton} onClick={() => setChangingPassword(true)}>Change</button></>}</div>
      </section>
    </div>
  </div>;
}
