"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, ChevronDown, FolderKanban, LayoutDashboard, LogOut, MoreVertical, Plus, Search, Sun, UsersRound } from "lucide-react";
import { initialTasks } from "./taskData";
import { clearLatestDemoAccount, getDemoAccounts, getDemoTasks, getLatestDemoAccount, type DemoAccount } from "@/lib/demoAccounts";

type Stage = "Planned" | "In Development" | "Testing" | "Completed / Deployed";
type AdminProject = { id: number; name: string; stage: Stage; logo: string; style: string };

const stages: Stage[] = ["Planned", "In Development", "Testing", "Completed / Deployed"];
const initialProjects: AdminProject[] = [
  { id: 1, name: "Barber Smart", stage: "Planned", logo: "Barber Smart", style: "barber" },
  { id: 2, name: "Jufmeester", stage: "In Development", logo: "jufmeester.nl", style: "jufmeester" },
  { id: 3, name: "School Education MP", stage: "Testing", logo: "U SCHOOL", style: "school" },
  { id: 4, name: "Agriculture Information", stage: "Completed / Deployed", logo: "AIC", style: "aic" },
];

const navItems = [
  { name: "Dashboard", Icon: LayoutDashboard },
  { name: "Projects", Icon: FolderKanban },
  { name: "Users", Icon: UsersRound },
] as const;

export default function AdminWorkspace() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [registeredUsers, setRegisteredUsers] = useState<DemoAccount[]>([]);
  const [adminTasks, setAdminTasks] = useState(initialTasks);
  const [newAccountNotice, setNewAccountNotice] = useState<DemoAccount | null>(null);
  const [adminProjects, setAdminProjects] = useState(initialProjects);
  const [activePage, setActivePage] = useState<string>("Projects");
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [projectListOpen, setProjectListOpen] = useState(true);
  const [search, setSearch] = useState("");
  const [dark, setDark] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  useEffect(() => {
    function refreshUsers() {
      const accounts = getDemoAccounts();
      const latestAccount = getLatestDemoAccount();
      setRegisteredUsers(accounts);
      setNewAccountNotice(latestAccount);
      if (latestAccount) setActivePage("Users");
    }

    const isAdmin = window.sessionStorage.getItem("stt-demo-role") === "admin"
      && window.sessionStorage.getItem("stt-demo-email")?.toLowerCase() === "admin@gmail.com";
    if (isAdmin) {
      refreshUsers();
      setAdminTasks(getDemoTasks(initialTasks));
      setAuthorized(true);

      // Keep an already-open admin tab in sync when registration happens elsewhere.
      window.addEventListener("storage", refreshUsers);
      window.addEventListener("focus", refreshUsers);
      return () => {
        window.removeEventListener("storage", refreshUsers);
        window.removeEventListener("focus", refreshUsers);
      };
    }
    else router.replace("/login");
  }, [router]);

  const filteredProjects = useMemo(() => adminProjects.filter((project) => {
    const matchesProject = selectedProject === null || project.id === selectedProject;
    return matchesProject && project.name.toLowerCase().includes(search.toLowerCase());
  }), [adminProjects, search, selectedProject]);
  // Show only accounts actually created through registration. Admin and demo
  // credentials are built in and should not appear as registered members.
  const users = registeredUsers.map((account) => ({ id: account.email, name: account.name, email: account.email, role: "Member" }));

  function openProjects(projectId: number | null = null) {
    setSelectedProject(projectId);
    setActivePage("Projects");
  }

  function addProject() {
    const name = window.prompt("Project name");
    if (!name?.trim()) return;
    const cleanName = name.trim();
    setAdminProjects((current) => [...current, { id: Date.now(), name: cleanName, stage: "Planned", logo: cleanName, style: "new-project" }]);
    openProjects();
  }

  if (!authorized) return <main className="admin-loading">Checking admin access…</main>;

  return (
    <main className={`admin-frame${dark ? " admin-dark" : ""}`}>
      <aside className="admin-sidebar">
        <a className="admin-brand" href="/admin"><span className="admin-brand-mark"><i /><i /><i /></span><b>Task Tracker</b></a>
        <label className="admin-search"><Search size={14} /><input placeholder="Search" value={search} onChange={(event) => setSearch(event.target.value)} /><kbd>⌘</kbd></label>
        <p className="admin-side-label">Main Menu</p>
        <nav className="admin-nav" aria-label="Admin menu">
          {navItems.map(({ name, Icon }) => <button key={name} className={activePage === name ? "active" : ""} onClick={() => { setActivePage(name); if (name === "Users") { setRegisteredUsers(getDemoAccounts()); setNewAccountNotice(getLatestDemoAccount()); } if (name !== "Projects") setSelectedProject(null); }}><Icon size={15} /><span>{name}</span></button>)}
        </nav>
        <button className={`admin-workspace-toggle${activePage === "Projects" ? " active" : ""}`} onClick={() => { setProjectListOpen((open) => !open); openProjects(null); }}><FolderKanban size={15} /><span>Projects</span><small>{adminProjects.length}</small><ChevronDown size={14} className={projectListOpen ? "rotated" : ""} /></button>
        {projectListOpen && <div className="admin-project-links">{adminProjects.map((project) => <button key={project.id} className={selectedProject === project.id ? "selected" : ""} onClick={() => openProjects(project.id)}>{project.name}</button>)}</div>}
        <div className="admin-sidebar-bottom"><span>Admin account</span><a href="/login" onClick={() => { window.sessionStorage.removeItem("stt-demo-role"); window.sessionStorage.removeItem("stt-demo-email"); }}><LogOut size={15} />Log out</a></div>
      </aside>

      <section className="admin-main">
        <header className="admin-topbar">
          <h1>Admin workspace</h1>
          <div className="admin-top-actions">
            <button className="admin-icon" aria-label="Toggle theme" onClick={() => setDark((value) => !value)}><Sun size={17} /></button>
            <div className="admin-popover-wrap"><button className="admin-icon" aria-label="Notifications" aria-expanded={showNotifications} onClick={() => setShowNotifications((open) => !open)}><Bell size={16} /></button>{showNotifications && <div className="admin-notice">Admin view includes all users and their assigned tasks.</div>}</div>
            <div className="admin-user"><span className="admin-avatar">A</span><span><b>Admin</b><small>Administrator</small></span><ChevronDown size={13} /></div>
          </div>
        </header>

        <div className="admin-content">
          <div className="admin-breadcrumb">Workspace <span>›</span> {activePage}</div>
          <div className="admin-page-heading"><h2>{activePage === "Projects" && selectedProject !== null ? adminProjects.find((project) => project.id === selectedProject)?.name : activePage}</h2>{activePage === "Projects" && <button className="admin-add-project" aria-label="Add project" onClick={addProject}><Plus size={17} /></button>}</div>

          {activePage === "Projects" && <section className="admin-project-board" aria-label="Projects by stage">
            {stages.map((stage) => {
              const stageProjects = filteredProjects.filter((project) => project.stage === stage);
              return <div className="admin-project-column" key={stage}>
                <div className="admin-column-heading"><i className={`stage-dot ${stage.toLowerCase().replaceAll(/[^a-z]+/g, "-")}`} /><b>{stage}</b><span>{stageProjects.length}</span><MoreVertical size={15} aria-hidden="true" /></div>
                {stageProjects.map((project) => <button className="admin-project-card" key={project.id} onClick={() => openProjects(project.id)}><MoreVertical size={15} className="project-card-menu" /><span className={`admin-project-logo ${project.style}`}>{project.logo}</span></button>)}
              </div>;
            })}
            {!filteredProjects.length && <p className="admin-empty">No projects match your search.</p>}
          </section>}

          {activePage === "Dashboard" && <section className="admin-summary-grid"><article><span>Projects</span><b>{adminProjects.length}</b></article><article><span>In progress</span><b>{adminProjects.filter((project) => project.stage === "In Development" || project.stage === "Testing").length}</b></article><article><span>Completed</span><b>{adminProjects.filter((project) => project.stage === "Completed / Deployed").length}</b></article></section>}
          {activePage === "Users" && <section className="admin-users-list" aria-label="Users and their tasks">
            {newAccountNotice && <div className="admin-user-added-notice" role="status"><span><b>{newAccountNotice.name}</b> ({newAccountNotice.email}) was added successfully.</span><button onClick={() => { clearLatestDemoAccount(); setNewAccountNotice(null); }}>Dismiss</button></div>}
            {users.filter((user) => `${user.name} ${user.email}`.toLowerCase().includes(search.toLowerCase()) || adminTasks.some((task) => task.ownerId === user.id && task.title.toLowerCase().includes(search.toLowerCase()))).map((user) => {
              const userTasks = adminTasks.filter((task) => task.ownerId === user.id && `${task.title} ${task.description}`.toLowerCase().includes(search.toLowerCase()));
              const userStyle = user.id === "admin@gmail.com" ? "admin" : "user";
              return <article className="admin-user-card" key={user.id}>
                <header className="admin-user-card-heading"><span className={`admin-member-avatar ${userStyle}`}>{user.name[0]}</span><div><h3>{user.name}</h3><p>{user.email}</p></div><span className={`admin-role-badge ${userStyle}`}>{user.role}</span><span className="admin-user-task-count">{userTasks.length} {userTasks.length === 1 ? "task" : "tasks"}</span></header>
                <div className="admin-user-tasks">{userTasks.length ? userTasks.map((task) => <div className="admin-user-task" key={task.id}><span className={`status-dot ${task.status.toLowerCase().replace(" ", "-")}`} /><div><b>{task.title}</b><small>{task.description}</small></div><span className={`admin-task-status ${task.status.toLowerCase().replace(" ", "-")}`}>{task.status}</span></div>) : <p className="admin-empty">No tasks match this search.</p>}</div>
              </article>;
            })}
            {!users.length && <p className="admin-empty">No registered users yet. New accounts will appear here after registration.</p>}
          </section>}
        </div>
      </section>
    </main>
  );
}
