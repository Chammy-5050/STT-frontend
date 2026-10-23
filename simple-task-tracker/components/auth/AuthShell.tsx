import type { ReactNode } from "react";

type Props = { children: ReactNode };

export default function AuthShell({ children }: Props) {
  return (
    <main className="auth-page">
      <section className="auth-brand-panel" aria-label="Task Tracker">
        <a className="auth-brand" href="/login"><span className="auth-brand-mark"><i /><i /><i /></span><span>Task Tracker</span></a>
        <p className="auth-brand-caption">Plan your work.<br />Make progress together.</p>
      </section>
      <section className="auth-form-panel">{children}</section>
    </main>
  );
}
