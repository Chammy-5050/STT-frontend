"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarCheck2, CalendarDays, ChevronDown, FolderKanban, LayoutGrid, ListChecks, LogOut, Search, Settings, X, type LucideIcon } from "lucide-react";
import { BrandMark } from "./ui";
import type { DashboardPage, ProjectItem } from "./types";

type Props = {
  activePage: DashboardPage;
  onNavigate: (page: DashboardPage) => void;
  onLogout: () => void;
  open: boolean;
  onClose: () => void;
  projects: ProjectItem[];
  selectedProjectId: string;
  onOpenProject: (projectId: string) => void;
  openTaskCount: number;
  dueTodayCount: number;
  onDailyTasks: () => void;
  search: string;
  onSearch: (value: string) => void;
};

const links: { label: DashboardPage; Icon: LucideIcon }[] = [
  { label: "Dashboard", Icon: LayoutGrid },
  { label: "Tasks", Icon: ListChecks },
  { label: "Projects", Icon: FolderKanban },
  { label: "Calendar", Icon: CalendarDays },
];

export default function DashboardSidebar({ activePage, onNavigate, onLogout, open, onClose, projects, selectedProjectId, onOpenProject, openTaskCount, dueTodayCount, onDailyTasks, search, onSearch }: Props) {
  const [projectsOpen, setProjectsOpen] = useState(true);
  const searchRef = useRef<HTMLInputElement>(null);

  // "/" jumps to search from anywhere that isn't already a text field.
  useEffect(() => {
    const focusSearch = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (event.key !== "/" || target.closest("input, textarea, select, [contenteditable]")) return;
      event.preventDefault();
      searchRef.current?.focus();
    };
    document.addEventListener("keydown", focusSearch);
    return () => document.removeEventListener("keydown", focusSearch);
  }, []);

  return (
    <aside id="app-sidebar" className={`sidebar${open ? " sidebar-open" : ""}`} aria-label="Sidebar">
      <div className="sidebar-top">
        <button type="button" className="brand" onClick={() => onNavigate("Dashboard")}><BrandMark size={34} />Task Tracker</button>
        <button type="button" className="icon-button sidebar-close" aria-label="Close navigation" onClick={onClose}><X size={20} /></button>
      </div>
      <label className="input-with-icon">
        <Search size={17} aria-hidden="true" />
        <span className="sr-only">Search tasks</span>
        <input ref={searchRef} className="input" type="search" placeholder="Search tasks" value={search} onChange={event => onSearch(event.target.value)} />
        {!search && <kbd aria-hidden="true">/</kbd>}
      </label>

      <p className="side-label" id="nav-main">Main menu</p>
      <nav aria-labelledby="nav-main">
        <ul className="nav-list" role="list" style={{ margin: 0, padding: 0, listStyle: "none" }}>
          {links.map(({ label, Icon }) => (
            <li key={label}>
              <button type="button" className="nav-item" aria-current={activePage === label ? "page" : undefined} onClick={() => onNavigate(label)}>
                <Icon size={19} aria-hidden="true" /><span>{label}</span>
                {label === "Tasks" && openTaskCount > 0 && <span className="count" aria-hidden="true">{openTaskCount}</span>}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <p className="side-label">Workspace</p>
      <button type="button" className="nav-item workspace-toggle" aria-expanded={projectsOpen} aria-controls="sidebar-projects" onClick={() => setProjectsOpen(current => !current)}>
        <FolderKanban size={19} aria-hidden="true" /><span>Ongoing projects</span>
        <span className="count" aria-hidden="true">{projects.length}</span>
        <ChevronDown size={17} className="chevron" aria-hidden="true" />
      </button>
      {projectsOpen && (
        projects.length
          ? <ul className="project-links" id="sidebar-projects">
              {projects.map(project => (
                <li key={project.id}>
                  <button type="button" className="project-link" aria-current={activePage === "Projects" && selectedProjectId === project.id ? "true" : undefined} onClick={() => onOpenProject(project.id)} title={project.name}>
                    <span>{project.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          : <p className="sidebar-empty" id="sidebar-projects">No projects yet.</p>
      )}
      <button type="button" className="nav-item" onClick={onDailyTasks}>
        <CalendarCheck2 size={19} aria-hidden="true" /><span>Daily tasks</span>
        <span className="count" aria-hidden="true">{dueTodayCount}</span>
      </button>

      <div className="sidebar-bottom">
        <p className="side-label" style={{ marginTop: 0 }}>General</p>
        <button type="button" className="nav-item" aria-current={activePage === "Settings" ? "page" : undefined} onClick={() => onNavigate("Settings")}>
          <Settings size={19} aria-hidden="true" /><span>Settings</span>
        </button>
        <button type="button" className="nav-item danger" onClick={onLogout}>
          <LogOut size={19} aria-hidden="true" /><span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}
