import { CalendarDays, ClipboardList, LayoutDashboard, LogOut, Settings, type LucideIcon } from "lucide-react";
import type { DashboardPage } from "./types";

type Props = {
  activePage: DashboardPage;
  onNavigate: (page: DashboardPage) => void;
  onLogout: () => void;
  open: boolean;
  onDailyTasks: () => void;
};

const links = [
  { label: "Dashboard", Icon: LayoutDashboard },
  { label: "Tasks", Icon: ClipboardList },
  { label: "Projects", Icon: LayoutDashboard },
  { label: "Calendar", Icon: CalendarDays },
  { label: "Settings", Icon: Settings },
] satisfies { label: DashboardPage; Icon: LucideIcon }[];

export default function DashboardSidebar({ activePage, onNavigate, onLogout, open, onDailyTasks }: Props) {
  return (
    <aside className={`sidebar${open ? " sidebar-open" : ""}`}>
      <a className="brand" href="#home"><span className="brand-mark">TT</span><span>Task Tracker</span></a>
      <p className="side-label">Main Menu</p>
      <nav className="main-nav" aria-label="Main menu">
        {links.map(({ label, Icon }) => (
          <button key={label} className={`nav-item${activePage === label ? " selected" : ""}`} onClick={() => onNavigate(label)}>
            <Icon size={17} /><span>{label}</span>
          </button>
        ))}
      </nav>
      <div className="workspace-block"><p className="side-label">Workspace</p><button className="workspace-pill" onClick={() => onNavigate("Projects")}><span className="workspace-dot" />Projects</button><button className="nav-item daily" onClick={onDailyTasks}><CalendarDays size={16} /><span>Daily Tasks</span></button></div>
      <div className="sidebar-bottom"><p className="side-label">General</p><button className={`nav-item${activePage === "Settings" ? " selected" : ""}`} onClick={() => onNavigate("Settings")}><Settings size={17} /><span>Settings</span></button><button className="nav-item logout" onClick={onLogout}><LogOut size={17} /><span>Sign out</span></button></div>
    </aside>
  );
}
