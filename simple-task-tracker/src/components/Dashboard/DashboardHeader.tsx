"use client";

import { Bell, Menu, Search, Settings, Sun } from "lucide-react";
import { useState } from "react";
import type { User } from "@/lib/api";
import type { TaskItem } from "./types";

type Props = {
  title: string;
  user: User;
  tasks: TaskItem[];
  onLogout: () => void;
  onOpenMenu: () => void;
  onSearch?: (value: string) => void;
  showAddTask?: boolean;
  onAddTask: () => void;
  onToggleTheme: () => void;
  onOpenSettings: () => void;
};

export default function DashboardHeader({ title, user, tasks, onLogout, onOpenMenu, onSearch, showAddTask, onAddTask, onToggleTheme, onOpenSettings }: Props) {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsRead, setNotificationsRead] = useState(false);
  const today = new Date();
  const dayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const overdue = tasks.filter(task => task.dueDate && task.dueDate < dayKey && task.status !== "Done");

  function toggleNotifications() {
    setNotificationsOpen((open) => !open);
    setProfileOpen(false);
    setNotificationsRead(true);
  }

  return (
    <header className="topbar">
      <div className="topbar-left"><button className="mobile-menu icon-button" aria-label="Open navigation" onClick={onOpenMenu}><Menu size={19} /></button><h1>{title}</h1></div>
      <div className="topbar-actions">
        {onSearch && <label className="search-box"><Search size={16} /><input placeholder="Search tasks" onChange={(event) => onSearch(event.target.value)} /></label>}
        {showAddTask && <button className="primary-button" onClick={onAddTask}>+ New Task</button>}
        <button className="icon-button" aria-label="Toggle theme" title="Toggle theme" onClick={onToggleTheme}><Sun size={18} /></button>
        <div className="header-popover-anchor">
          <button className={`icon-button notification-button${notificationsOpen ? " is-active" : ""}`} aria-label="Notifications" aria-expanded={notificationsOpen} onClick={toggleNotifications}><Bell size={18} />{!notificationsRead && overdue.length > 0 && <i />}</button>
          {notificationsOpen && <div className="header-popover notification-popover"><div className="popover-title"><b>Task reminders</b></div>{overdue.length ? overdue.slice(0, 5).map(task => <p key={task.id}><span className="notice-dot amber" />{task.title} is overdue.</p>) : <p>No overdue tasks.</p>}<button className="text-button" onClick={() => setNotificationsOpen(false)}>Close</button></div>}
        </div>
        <div className="header-popover-anchor">
          <button className="profile profile-trigger" aria-expanded={profileOpen} onClick={() => { setProfileOpen((open) => !open); setNotificationsOpen(false); }}><span className="avatar" style={user.profile_picture ? { backgroundImage: `url("${user.profile_picture}")`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}>{user.profile_picture ? "" : user.full_name.slice(0, 1).toUpperCase()}</span><span className="profile-copy"><b>{user.full_name}</b><small>{user.is_superuser ? "Administrator" : "Member"}</small></span></button>
          {profileOpen && <div className="header-popover profile-popover"><div className="profile-menu-copy"><b>{user.full_name}</b><small>{user.email}</small></div><button onClick={() => { onOpenSettings(); setProfileOpen(false); }}><Settings size={15} />Settings</button><button onClick={onLogout}>Sign out</button></div>}
        </div>
      </div>
    </header>
  );
}
