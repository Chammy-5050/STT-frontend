"use client";

import { Bell, Search, Settings, Sun } from "lucide-react";
import { useState } from "react";

type Props = {
  title: string;
  onSearch?: (value: string) => void;
  showAddTask?: boolean;
  onAddTask: () => void;
  onToggleTheme: () => void;
  onOpenSettings: () => void;
};

export default function DashboardHeader({ title, onSearch, showAddTask, onAddTask, onToggleTheme, onOpenSettings }: Props) {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsRead, setNotificationsRead] = useState(false);

  function toggleNotifications() {
    setNotificationsOpen((open) => !open);
    setProfileOpen(false);
    setNotificationsRead(true);
  }

  return (
    <header className="topbar">
      <h1>{title}</h1>
      <div className="topbar-actions">
        {onSearch && <label className="search-box"><Search size={16} /><input placeholder="Search tasks" onChange={(event) => onSearch(event.target.value)} /></label>}
        {showAddTask && <button className="primary-button" onClick={onAddTask}>+ New Task</button>}
        <button className="icon-button" aria-label="Toggle theme" title="Toggle theme" onClick={onToggleTheme}><Sun size={18} /></button>
        <div className="header-popover-anchor">
          <button className={`icon-button notification-button${notificationsOpen ? " is-active" : ""}`} aria-label="Notifications" aria-expanded={notificationsOpen} onClick={toggleNotifications}><Bell size={18} />{!notificationsRead && <i />}</button>
          {notificationsOpen && <div className="header-popover notification-popover"><div className="popover-title"><b>Notifications</b><span>Demo</span></div><p><span className="notice-dot purple" />Your workspace is ready to use.</p><p><span className="notice-dot green" />You can drag tasks between columns.</p><p><span className="notice-dot amber" />New tasks stay in this browser session.</p><button className="text-button" onClick={() => setNotificationsOpen(false)}>Close</button></div>}
        </div>
        <div className="header-popover-anchor">
          <button className="profile profile-trigger" aria-expanded={profileOpen} onClick={() => { setProfileOpen((open) => !open); setNotificationsOpen(false); }}><span className="avatar">D</span><span className="profile-copy"><b>Demo User</b><small>Local workspace</small></span></button>
          {profileOpen && <div className="header-popover profile-popover"><div className="profile-menu-copy"><b>Demo User</b><small>Changes are stored locally.</small></div><button onClick={() => { onOpenSettings(); setProfileOpen(false); }}><Settings size={15} />Settings</button><a href="/login">Exit demo</a></div>}
        </div>
      </div>
    </header>
  );
}
