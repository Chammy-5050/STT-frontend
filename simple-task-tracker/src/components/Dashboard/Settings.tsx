"use client";

import { useState, type FormEvent } from "react";
import { Bell, Check, LockKeyhole, Moon, Palette, Sun, UserRound } from "lucide-react";
import styles from "./Settings.module.css";

type Props = {
  darkTheme: boolean;
  onThemeChange: (dark: boolean) => void;
};

export default function Settings({ darkTheme, onThemeChange }: Props) {
  const [editingProfile, setEditingProfile] = useState(false);
  const [name, setName] = useState("Demo User");
  const [email, setEmail] = useState("demo@tasktracker.local");
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [updatesEnabled, setUpdatesEnabled] = useState(true);
  const [changingPassword, setChangingPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [notice, setNotice] = useState("");

  function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setEditingProfile(false);
    setNotice("Profile updated for this demo session.");
  }

  function savePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPassword("");
    setChangingPassword(false);
    setNotice("Password preview complete. No real password was changed.");
  }

  return (
    <div className={`${styles.settings} ${darkTheme ? styles.dark : ""}`}>
      <div className={styles.breadcrumb}>Workspace <span>/</span> Settings</div>
      <header className={styles.pageHeading}>
        <div><span className={styles.eyebrow}>PREFERENCES</span><h2>Settings</h2><p>Manage your preferences.</p></div>
      </header>

      <div className={styles.settingsList}>
        <section className={styles.card}>
          <div className={styles.sectionHeading}><span className={styles.icon}><Palette size={18} /></span><div><h3>Appearance</h3><p>Theme</p></div></div>
          <div className={styles.cardContent}><div className={styles.themePicker} role="group" aria-label="Color theme"><button className={`${styles.themeOption} ${!darkTheme ? styles.active : ""}`} onClick={() => onThemeChange(false)} aria-pressed={!darkTheme}><Sun size={16} />Light{!darkTheme && <Check size={15} />}</button><button className={`${styles.themeOption} ${darkTheme ? styles.active : ""}`} onClick={() => onThemeChange(true)} aria-pressed={darkTheme}><Moon size={16} />Dark{darkTheme && <Check size={15} />}</button></div></div>
        </section>

        <section className={styles.card}>
          <div className={styles.sectionHeading}><span className={styles.icon}><UserRound size={18} /></span><div><h3>Profile</h3><p>{editingProfile ? "Edit details" : name}</p></div></div>
          <div className={styles.cardContent}>{editingProfile ? <form className={styles.inlineForm} onSubmit={saveProfile}><input aria-label="Display name" value={name} onChange={(event) => setName(event.target.value)} required /><input aria-label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /><button className={styles.actionButton} type="submit">Save</button><button className={styles.quietButton} type="button" onClick={() => setEditingProfile(false)}>Cancel</button></form> : <><span className={styles.detailText}>{email}</span><button className={styles.actionButton} onClick={() => { setNotice(""); setEditingProfile(true); }}>Edit</button></>}</div>
        </section>

        <section className={styles.card}>
          <div className={styles.sectionHeading}><span className={styles.icon}><Bell size={18} /></span><div><h3>Notifications</h3><p>Task and project updates</p></div></div>
          <div className={styles.cardContent}><div className={styles.notificationChoices}><button className={styles.preferenceButton} aria-pressed={remindersEnabled} onClick={() => setRemindersEnabled((value) => !value)}><span>Task reminders</span><i className={remindersEnabled ? styles.switchOn : ""}><b /></i></button><button className={styles.preferenceButton} aria-pressed={updatesEnabled} onClick={() => setUpdatesEnabled((value) => !value)}><span>Project updates</span><i className={updatesEnabled ? styles.switchOn : ""}><b /></i></button></div></div>
        </section>

        <section className={styles.card}>
          <div className={styles.sectionHeading}><span className={styles.icon}><LockKeyhole size={18} /></span><div><h3>Security</h3><p>Password</p></div></div>
          <div className={styles.cardContent}>{changingPassword ? <form className={styles.inlineForm} onSubmit={savePassword}><input aria-label="New demo password" type="password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" required /><button className={styles.actionButton} type="submit">Save</button><button className={styles.quietButton} type="button" onClick={() => setChangingPassword(false)}>Cancel</button></form> : <><span className={styles.detailText}>Change password</span><button className={styles.actionButton} onClick={() => { setNotice(""); setChangingPassword(true); }}>Change</button></>}</div>
        </section>
      </div>
      {notice && <p className={styles.notice} role="status">{notice}</p>}
    </div>
  );
}
