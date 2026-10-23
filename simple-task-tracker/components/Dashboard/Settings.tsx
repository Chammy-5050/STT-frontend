import { Bell, Check, LockKeyhole, Moon, Palette, Sun, UserRound } from "lucide-react";
import styles from "./Settings.module.css";

type Props = {
  darkTheme: boolean;
  onThemeChange: (dark: boolean) => void;
};

export default function Settings({ darkTheme, onThemeChange }: Props) {
  return (
    <div className={`${styles.settings} ${darkTheme ? styles.dark : ""}`}>
      <div className={styles.breadcrumb}>Workspace <span>/</span> Settings</div>
      <header className={styles.pageHeading}>
        <div><span className={styles.eyebrow}>PREFERENCES</span><h2>Settings</h2><p>Make Task Tracker work for you.</p></div>
        <span className={styles.apiStatus}><i />API connection pending</span>
      </header>

      <div className={styles.sectionLabel}>YOUR PREFERENCES</div>
      <div className={styles.settingsList}>
        <section className={styles.card}>
          <div className={styles.sectionHeading}><span className={styles.icon}><Palette size={18} /></span><div><h3>Appearance</h3><p>Choose a theme</p></div></div>
          <div className={styles.cardContent}>
            <div className={styles.themePicker} role="group" aria-label="Color theme">
              <button className={`${styles.themeOption} ${!darkTheme ? styles.active : ""}`} onClick={() => onThemeChange(false)} aria-pressed={!darkTheme}><Sun size={16} />Light{!darkTheme && <Check size={15} />}</button>
              <button className={`${styles.themeOption} ${darkTheme ? styles.active : ""}`} onClick={() => onThemeChange(true)} aria-pressed={darkTheme}><Moon size={16} />Dark{darkTheme && <Check size={15} />}</button>
            </div>
          </div>
        </section>

        <section className={styles.card}>
          <div className={styles.sectionHeading}><span className={styles.icon}><UserRound size={18} /></span><div><h3>Profile</h3><p>Personal details</p></div></div>
          <div className={styles.cardContent}><span className={styles.waiting}><i />Available when API is connected</span><button className={styles.actionButton} disabled>Edit profile</button></div>
        </section>

        <section className={styles.card}>
          <div className={styles.sectionHeading}><span className={styles.icon}><Bell size={18} /></span><div><h3>Notifications</h3><p>Reminders and project updates</p></div></div>
          <div className={styles.cardContent}><span className={styles.waiting}><i />Available when API is connected</span><button className={styles.actionButton} disabled>Manage</button></div>
        </section>

        <section className={styles.card}>
          <div className={styles.sectionHeading}><span className={styles.icon}><LockKeyhole size={18} /></span><div><h3>Security</h3><p>Password and sign-in</p></div></div>
          <div className={styles.cardContent}><span className={styles.waiting}><i />Available when API is connected</span><button className={styles.actionButton} disabled>Change password</button></div>
        </section>
      </div>
    </div>
  );
}
