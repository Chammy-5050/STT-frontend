import { CalendarDays, ClipboardList, LayoutDashboard, LogOut, ShieldCheck, type LucideIcon } from "lucide-react";
import type { DashboardPage, DemoRole } from "./types";

type Props = {
  activePage: DashboardPage;
  onNavigate: (page: DashboardPage) => void;
  role: DemoRole;
};

const links: { label: DashboardPage; Icon: LucideIcon }[] = [
  { label: "Dashboard", Icon: LayoutDashboard },
  { label: "Tasks", Icon: ClipboardList },
  { label: "Projects", Icon: LayoutDashboard },
  { label: "Calendar", Icon: CalendarDays },
];

export default function DashboardSidebar({ activePage, onNavigate, role }: Props) {
  const visibleLinks: { label: DashboardPage; Icon: LucideIcon }[] = role === "admin" ? [{ label: "Admin", Icon: ShieldCheck }, ...links] : links;
  return (
    <aside className="sidebar">
      <a className="brand" href="#home"><span className="brand-mark">TT</span><span>Task Tracker</span></a>
      <p className="side-label">Main Menu</p>
      <nav className="main-nav" aria-label="Main menu">
        {visibleLinks.map(({ label, Icon }) => (
          <button key={label} className={`nav-item${activePage === label ? " selected" : ""}`} onClick={() => onNavigate(label)}>
            <Icon size={17} /><span>{label}</span>
          </button>
        ))}
      </nav>
      <div className="workspace-block"><p className="side-label">Workspace</p><button className="workspace-pill" onClick={() => onNavigate("Projects")}><span className="workspace-dot" />Projects</button><button className="nav-item daily" onClick={() => onNavigate("Tasks")}><CalendarDays size={16} /><span>Daily Tasks</span></button></div>
      <div className="sidebar-bottom"><a className="nav-item logout" href="/login"><LogOut size={17} /><span>Log out</span></a></div>
    </aside>
  );
}
