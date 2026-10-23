"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Calendar from "./Calendar";
import DashboardHeader from "./DashboardHeader";
import DashboardOverview from "./DashboardOverview";
import DashboardSidebar from "./DashboardSidebar";
import Projects from "./Projects";
import Settings from "./Settings";
import Task from "./Task";
import TaskDialog from "./TaskDialog";
import { useAuth } from "@/components/auth/AuthProvider";
import { api, message, type ApiProject, type ApiTask } from "@/lib/api";
import type { DashboardPage, ProjectDraft, ProjectItem, TaskDraft, TaskFilter, TaskItem, TaskStatus } from "./types";

const statusToApi = { Pending: "pending", "In Progress": "in_progress", Done: "done" } as const;
const statusToUi = { pending: "Pending", in_progress: "In Progress", done: "Done" } as const;
const projectFromApi = (value: ApiProject): ProjectItem => ({ id: value.project_id, name: value.project_name, description: value.description || "", creator: value.creator });
const taskFromApi = (value: ApiTask): TaskItem => ({ id: value.task_id, title: value.task_name, description: value.description || "", status: statusToUi[value.status], projectId: value.project_id, dueDate: value.due_date || undefined, createdAt: value.created_at, creator: value.creator, canEdit: value.can_edit });

export default function HomeDashboard() {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const userId = user?.user_id;
  const [activePage, setActivePage] = useState<DashboardPage>("Projects");
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [taskFilter, setTaskFilter] = useState<TaskFilter>("All");
  const [search, setSearch] = useState("");
  const [darkTheme, setDarkTheme] = useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const visibleTasks = useMemo(() => tasks.filter((task) => `${task.title} ${task.description}`.toLowerCase().includes(search.toLowerCase())), [tasks, search]);

  function openTasks(filter: TaskFilter) {
    setTaskFilter(filter);
    setActivePage("Tasks");
  }

  const load = useCallback(async () => {
    setFetching(true);
    setError("");
    try {
      const result = await api<ApiProject[]>("/projects/");
      const taskLists = await Promise.all(result.map(project => api<ApiTask[]>(`/projects/${project.project_id}/tasks/`)));
      setProjects(result.map(projectFromApi));
      setTasks(taskLists.flat().map(taskFromApi));
    } catch (error) { setError(message(error)); }
    finally { setFetching(false); }
  }, []);

  useEffect(() => {
    if (!loading && !userId) router.replace("/login");
    // The request updates loading state immediately before fetching workspace data.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (userId) void load();
  }, [userId, loading, router, load]);

  function logout() { signOut(); router.replace("/login"); }
  async function changeTaskStatus(taskId: string, status: TaskStatus) {
    const task = tasks.find(item => item.id === taskId);
    if (!task || !task.canEdit) return;
    try {
      const updated = await api<ApiTask>(`/projects/${task.projectId}/tasks/${task.id}/`, { method: "PATCH", body: JSON.stringify({ status: statusToApi[status] }) });
      setTasks(current => current.map(item => item.id === taskId ? taskFromApi(updated) : item));
      setError("");
    } catch (error) { setError(message(error)); }
  }

  async function createProject(input: ProjectDraft) {
    const result = projectFromApi(await api<ApiProject>("/projects/", { method: "POST", body: JSON.stringify({ project_name: input.name, description: input.description }) }));
    setProjects(current => [...current, result]);
    return result;
  }

  async function createTask(input: TaskDraft) {
    const task = taskFromApi(await api<ApiTask>(`/projects/${input.projectId}/tasks/`, { method: "POST", body: JSON.stringify({ task_name: input.title, description: input.description, status: statusToApi[input.status], due_date: input.dueDate || null }) }));
    setTasks((currentTasks) => [task, ...currentTasks]);
    setTaskFilter("All");
    setSearch("");
  }

  function renderPage() {
    switch (activePage) {
      case "Dashboard": return <DashboardOverview projects={projects} tasks={tasks} onOpenProjects={() => setActivePage("Projects")} onSelectTaskFilter={openTasks} />;
      case "Tasks": return <Task tasks={visibleTasks} filter={taskFilter} onFilterChange={setTaskFilter} onStatusChange={changeTaskStatus} />;
      case "Projects": return <Projects projects={projects} tasks={visibleTasks} canCreateProject={Boolean(user && !user.is_superuser)} onCreateProject={createProject} onStatusChange={changeTaskStatus} />;
      case "Calendar": return <Calendar tasks={tasks} />;
      case "Settings": return <Settings darkTheme={darkTheme} onThemeChange={setDarkTheme} />;
    }
  }

  const ownedProjects = projects.filter(project => project.creator?.user_id === userId);
  const supportsTaskActions = activePage !== "Settings" && ownedProjects.length > 0 && !fetching;
  const supportsTaskSearch = activePage === "Tasks" || activePage === "Projects";

  if (loading || !user) return <main className="empty-state" role="status">Loading your account…</main>;
  return (
    <main className={`app-shell${darkTheme ? " dark-theme" : ""}`}>
      <DashboardSidebar activePage={activePage} onNavigate={page => { setActivePage(page); setSidebarOpen(false); }} onDailyTasks={() => { openTasks("Today"); setSidebarOpen(false); }} onLogout={logout} open={sidebarOpen} />
      {sidebarOpen && <button className="scrim" aria-label="Close navigation" onClick={() => setSidebarOpen(false)} />}
      <section className="main-area">
        <DashboardHeader title={activePage} user={user} tasks={tasks} onOpenMenu={() => setSidebarOpen(true)} onLogout={logout} onSearch={supportsTaskSearch ? setSearch : undefined} showAddTask={supportsTaskActions} onAddTask={() => setTaskDialogOpen(true)} onToggleTheme={() => setDarkTheme((current) => !current)} onOpenSettings={() => setActivePage("Settings")} />
        <div className="page-content">{supportsTaskSearch && <label className="mobile-search search-box"><input placeholder="Search tasks" aria-label="Search tasks on mobile" onChange={event => setSearch(event.target.value)} /></label>}{error && <div className="api-error" role="alert">{error} <button className="text-button" onClick={() => void load()}>Retry</button></div>}{fetching ? <p role="status">Loading projects and tasks…</p> : renderPage()}</div>
      </section>
      {taskDialogOpen && <TaskDialog projects={ownedProjects} onClose={() => setTaskDialogOpen(false)} onCreate={createTask} />}
    </main>
  );
}
