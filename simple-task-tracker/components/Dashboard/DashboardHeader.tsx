import { Bell, Search, Sun } from "lucide-react";

type Props = {
  title: string;
  onSearch?: (value: string) => void;
  showAddTask?: boolean;
  dataReady: boolean;
  onToggleTheme: () => void;
};

export default function DashboardHeader({ title, onSearch, showAddTask, dataReady, onToggleTheme }: Props) {
  return (
      <header className="topbar">
        <h1>{title}</h1>
        <div className="topbar-actions">
          {onSearch && <label className="search-box"><Search size={16} /><input placeholder={dataReady ? "Search tasks" : "Search (waiting for API)"} disabled={!dataReady} onChange={(event) => onSearch(event.target.value)} /></label>}
          {showAddTask && <button className="primary-button" disabled title="Task creation will be available when the API is connected">+ New Task</button>}
          <button className="icon-button" aria-label="Toggle theme" onClick={onToggleTheme}><Sun size={18} /></button>
          <button className="icon-button" aria-label="Notifications" disabled title="Notifications will be available when the API is connected"><Bell size={18} /></button>
          <span className="avatar" aria-label="User account">U</span>
          <span className="profile-copy"><b>Account</b><small>Waiting for API</small></span>
        </div>
      </header>
  );
}
