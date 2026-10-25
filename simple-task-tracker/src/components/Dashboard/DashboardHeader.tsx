"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Bell, ChevronDown, LogOut, Menu, Moon, Settings, Sun } from "lucide-react";
import type { User } from "@/lib/api";
import { setTheme, useTheme } from "@/lib/theme";
import DeadlineBadge from "./DeadlineBadge";
import { deadlineFor } from "./deadlines";
import { formatDate } from "./format";
import { Avatar } from "./ui";
import type { TaskItem } from "./types";

type Props = {
  title: string;
  user: User;
  tasks: TaskItem[];
  sidebarOpen: boolean;
  onOpenMenu: () => void;
  onLogout: () => void;
  onOpenSettings: () => void;
  onOpenReminders: () => void;
};

/** A header popover that closes on outside click or Escape and returns focus to its trigger. */
function Popover({ open, onClose, trigger, children, className = "" }: { open: boolean; onClose: () => void; trigger: ReactNode; children: ReactNode; className?: string }) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const outside = (event: MouseEvent) => { if (!root.current?.contains(event.target as Node)) onClose(); };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") { onClose(); root.current?.querySelector<HTMLElement>("button")?.focus(); } };
    document.addEventListener("mousedown", outside);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("mousedown", outside); document.removeEventListener("keydown", escape); };
  }, [open, onClose]);
  return <div className="popover-anchor" ref={root}>{trigger}{open && <div className={`popover ${className}`}>{children}</div>}</div>;
}

export default function DashboardHeader({ title, user, tasks, sidebarOpen, onOpenMenu, onLogout, onOpenSettings, onOpenReminders }: Props) {
  const theme = useTheme();
  const [openMenu, setOpenMenu] = useState<"notifications" | "profile" | null>(null);
  const close = () => setOpenMenu(null);
  const reminders = tasks
    .filter(task => { const kind = deadlineFor(task)?.kind; return kind === "overdue" || kind === "today"; })
    .sort((a, b) => (a.dueDate ?? "").localeCompare(b.dueDate ?? ""));
  const role = user.is_superuser ? "Administrator" : "Member";

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button type="button" className="icon-button mobile-menu" aria-label="Open navigation" aria-controls="app-sidebar" aria-expanded={sidebarOpen} onClick={onOpenMenu}><Menu size={22} /></button>
        <p className="topbar-title">{title}</p>
      </div>
      <div className="topbar-actions">
        <button type="button" className="icon-button" aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"} title="Toggle theme"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
          {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <Popover open={openMenu === "notifications"} onClose={close} className="notification-popover" trigger={
          <button type="button" className="icon-button" aria-label={reminders.length ? `Task reminders, ${reminders.length} need attention` : "Task reminders"} aria-expanded={openMenu === "notifications"} aria-haspopup="true"
            onClick={() => setOpenMenu(current => current === "notifications" ? null : "notifications")}>
            <Bell size={20} />
            {reminders.length > 0 && <span className="badge-count" aria-hidden="true">{reminders.length > 9 ? "9+" : reminders.length}</span>}
          </button>
        }>
          <div className="popover-header"><b>Task reminders</b><span>Overdue & due today</span></div>
          {reminders.length ? (
            <ul className="reminder-list">
              {reminders.slice(0, 8).map(task => (
                <li key={task.id}>
                  <button type="button" className="reminder-item" onClick={() => { close(); onOpenReminders(); }}>
                    <span className={`status-dot ${deadlineFor(task)?.kind === "overdue" ? "overdue" : "in-progress"}`} aria-hidden="true" />
                    <span><b>{task.title}</b><small>Due {formatDate(task.dueDate)}</small></span>
                    <DeadlineBadge task={task} />
                  </button>
                </li>
              ))}
            </ul>
          ) : <p className="popover-empty">You&apos;re all caught up — nothing is overdue or due today.</p>}
        </Popover>

        <Popover open={openMenu === "profile"} onClose={close} className="profile-menu" trigger={
          <button type="button" className="profile-trigger" aria-label={`Account menu for ${user.full_name}`} aria-expanded={openMenu === "profile"} aria-haspopup="true"
            onClick={() => setOpenMenu(current => current === "profile" ? null : "profile")}>
            <Avatar name={user.full_name} src={user.profile_picture} size={38} />
            <span className="profile-copy"><b>{user.full_name}</b><small>{role}</small></span>
            <ChevronDown size={16} aria-hidden="true" />
          </button>
        }>
          <div className="profile-menu-head">
            <Avatar name={user.full_name} src={user.profile_picture} size={40} />
            <div><b>{user.full_name}</b><small>{user.email}</small></div>
          </div>
          <button type="button" className="menu-item" onClick={() => { close(); onOpenSettings(); }}><Settings size={16} />Settings</button>
          <button type="button" className="menu-item danger" onClick={() => { close(); onLogout(); }}><LogOut size={16} />Sign out</button>
        </Popover>
      </div>
    </header>
  );
}
