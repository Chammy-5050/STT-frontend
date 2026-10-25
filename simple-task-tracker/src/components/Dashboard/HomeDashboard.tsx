"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Calendar from "./Calendar";
import DashboardHeader from "./DashboardHeader";
import DashboardOverview from "./DashboardOverview";
import DashboardSidebar from "./DashboardSidebar";
import ProjectDialog from "./ProjectDialog";
import Projects from "./Projects";
import Settings from "./Settings";
import TaskDialog from "./TaskDialog";
import TasksPage from "./TasksPage";
import { plural, todayKey } from "./format";
import { BrandMark, ConfirmDialog, type ConfirmRequest } from "./ui";
import { useAuth } from "@/components/auth/AuthProvider";
import { api, message, type ApiProject, type ApiTask } from "@/lib/api";
import type { DashboardPage, ProjectDraft, ProjectItem, TaskDraft, TaskFilter, TaskItem, TaskStatus } from "./types";

const statusToApi = { Pending: "pending", "In Progress": "in_progress", Done: "done" } as const;
const statusToUi = { pending: "Pending", in_progress: "In Progress", done: "Done" } as const;
const projectFromApi = (value: ApiProject): ProjectItem => ({ id: value.project_id, name: value.project_name, description: value.description || "", creator: value.creator, createdAt: value.created_at });
const taskFromApi = (value: ApiTask): TaskItem => ({ id: value.task_id, title: value.task_name, description: value.description || "", status: statusToUi[value.status], projectId: value.project_id, dueDate: value.due_date || undefined, createdAt: value.created_at, creator: value.creator, canEdit: value.can_edit });
const taskToApi = (draft: Partial<TaskDraft>) => ({
  ...(draft.title !== undefined && { task_name: draft.title }),
  ...(draft.description !== undefined && { description: draft.description }),
  ...(draft.status !== undefined && { status: statusToApi[draft.status] }),
  ...("dueDate" in draft && { due_date: draft.dueDate || null }),
});

const PAGES: DashboardPage[] = ["Dashboard", "Tasks", "Projects", "Calendar", "Settings"];
function pageFromUrl(): DashboardPage {
  if (typeof window === "undefined") return "Dashboard";
  const view = new URLSearchParams(window.location.search).get("view");
  return PAGES.find(page => page.toLowerCase() === view) ?? "Dashboard";
}

function WorkspaceSkeleton() {
  return (
    <div role="status" aria-label="Loading your workspace">
      <div className="skeleton" style={{ width: 120, height: 14, marginBottom: 10 }} />
      <div className="skeleton" style={{ width: "min(360px, 70%)", height: 34, marginBottom: 28 }} />
      <div className="stat-grid">{Array.from({ length: 5 }, (_, index) => <div key={index} className="skeleton" style={{ height: 104, borderRadius: 14 }} />)}</div>
      <div className="skeleton-grid">{Array.from({ length: 5 }, (_, index) => <div key={index} className="skeleton" style={{ height: 64, borderRadius: 12 }} />)}</div>
      <span className="sr-only">Loading projects and tasks…</span>
    </div>
  );
}

export default function HomeDashboard() {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const userId = user?.user_id;
  const isAdmin = Boolean(user?.is_superuser);
  const [activePage, setActivePage] = useState<DashboardPage>(pageFromUrl);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [taskFilter, setTaskFilter] = useState<TaskFilter>("All");
  const [search, setSearch] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [taskDialog, setTaskDialog] = useState<{ task?: TaskItem; defaults?: Partial<TaskDraft> } | null>(null);
  const [projectDialog, setProjectDialog] = useState<{ project?: ProjectItem } | null>(null);
  const [confirm, setConfirm] = useState<ConfirmRequest | null>(null);

  const navigate = useCallback((page: DashboardPage, closeSidebar = true) => {
    setActivePage(page);
    if (closeSidebar) setSidebarOpen(false);
    const url = page === "Dashboard" ? window.location.pathname : `${window.location.pathname}?view=${page.toLowerCase()}`;
    if (`${window.location.pathname}${window.location.search}` !== url) window.history.pushState(null, "", url);
    window.scrollTo({ top: 0 });
  }, []);

  useEffect(() => {
    const syncFromUrl = () => setActivePage(pageFromUrl());
    window.addEventListener("popstate", syncFromUrl);
    return () => window.removeEventListener("popstate", syncFromUrl);
  }, []);

  useEffect(() => { document.title = `${activePage} | Task Tracker`; }, [activePage]);

  useEffect(() => {
    if (!sidebarOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setSidebarOpen(false); };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [sidebarOpen]);

  const load = useCallback(async () => {
    setFetching(true);
    setError("");
    try {
      const result = await api<ApiProject[]>("/projects/");
      const taskLists = await Promise.all(result.map(project => api<ApiTask[]>(`/projects/${project.project_id}/tasks/`)));
      setProjects(result.map(projectFromApi));
      setTasks(taskLists.flat().map(taskFromApi));
    } catch (failure) { setError(message(failure)); }
    finally { setFetching(false); }
  }, []);

  useEffect(() => {
    if (!loading && !userId) router.replace("/login");
    // The request updates loading state immediately before fetching workspace data.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (userId) void load();
  }, [userId, loading, router, load]);

  function openProject(projectId: string) {
    setSelectedProjectId(projectId);
    navigate("Projects");
  }

  function openTasks(filter: TaskFilter) {
    setTaskFilter(filter);
    navigate("Tasks");
  }

  function requestLogout() {
    setConfirm({
      title: "Sign out?",
      message: "You'll need to sign in again to get back to your workspace.",
      confirmLabel: "Sign out",
      tone: "brand",
      onConfirm: () => { signOut(); router.replace("/login"); },
    });
  }

  // ----- Projects -----
  async function createProject(draft: ProjectDraft) {
    const project = projectFromApi(await api<ApiProject>("/projects/", { method: "POST", body: JSON.stringify({ project_name: draft.name, description: draft.description }) }));
    setProjects(current => [project, ...current]);
    // Open the new project's board straight away: tasks are added from inside a project.
    openProject(project.id);
    toast.success(`Project “${project.name}” created. Add its first task.`);
  }

  async function updateProject(project: ProjectItem, draft: ProjectDraft) {
    const updated = projectFromApi(await api<ApiProject>(`/projects/${project.id}/`, { method: "PATCH", body: JSON.stringify({ project_name: draft.name, description: draft.description }) }));
    setProjects(current => current.map(item => (item.id === updated.id ? updated : item)));
    toast.success("Project updated.");
  }

  function requestDeleteProject(project: ProjectItem) {
    const taskCount = tasks.filter(task => task.projectId === project.id).length;
    setConfirm({
      title: "Delete project?",
      message: <>
        <p style={{ margin: 0 }}>This permanently deletes <strong>{project.name}</strong>{taskCount ? <> and its <strong>{plural(taskCount, "task")}</strong></> : null}.</p>
        <p style={{ margin: "8px 0 0" }}>This can&apos;t be undone.</p>
      </>,
      confirmLabel: "Delete project",
      busyLabel: "Deleting…",
      onConfirm: async () => {
        await api(`/projects/${project.id}/`, { method: "DELETE" });
        setProjects(current => current.filter(item => item.id !== project.id));
        setTasks(current => current.filter(task => task.projectId !== project.id));
        if (selectedProjectId === project.id) setSelectedProjectId("");
        toast.success(`Project “${project.name}” deleted.`);
      },
    });
  }

  // ----- Tasks -----
  async function createTask(draft: TaskDraft) {
    const task = taskFromApi(await api<ApiTask>(`/projects/${draft.projectId}/tasks/`, { method: "POST", body: JSON.stringify(taskToApi(draft)) }));
    setTasks(current => [task, ...current]);
    toast.success(`Task “${task.title}” created.`);
  }

  async function updateTask(task: TaskItem, draft: TaskDraft) {
    const updated = taskFromApi(await api<ApiTask>(`/projects/${task.projectId}/tasks/${task.id}/`, { method: "PATCH", body: JSON.stringify(taskToApi(draft)) }));
    setTasks(current => current.map(item => (item.id === updated.id ? updated : item)));
    toast.success("Task updated.");
  }

  async function changeTaskStatus(taskId: string, status: TaskStatus) {
    const task = tasks.find(item => item.id === taskId);
    if (!task || !task.canEdit || task.status === status) return;
    // Optimistic: move the card immediately, roll back if the server refuses.
    setTasks(current => current.map(item => (item.id === taskId ? { ...item, status } : item)));
    try {
      const updated = await api<ApiTask>(`/projects/${task.projectId}/tasks/${task.id}/`, { method: "PATCH", body: JSON.stringify({ status: statusToApi[status] }) });
      setTasks(current => current.map(item => (item.id === taskId ? taskFromApi(updated) : item)));
    } catch (failure) {
      setTasks(current => current.map(item => (item.id === taskId ? { ...item, status: task.status } : item)));
      toast.error(`Couldn't move “${task.title}”: ${message(failure)}`);
    }
  }

  async function bulkStatus(selected: TaskItem[], status: TaskStatus) {
    const targets = selected.filter(task => task.status !== status);
    const results = await Promise.allSettled(targets.map(task => api<ApiTask>(`/projects/${task.projectId}/tasks/${task.id}/`, { method: "PATCH", body: JSON.stringify({ status: statusToApi[status] }) })));
    const updated = results.flatMap(result => (result.status === "fulfilled" ? [taskFromApi(result.value)] : []));
    setTasks(current => current.map(item => updated.find(task => task.id === item.id) ?? item));
    const failed = results.length - updated.length;
    if (failed) toast.error(`${plural(failed, "task")} couldn't be updated.`);
    else toast.success(`${plural(updated.length || selected.length, "task")} marked as ${status.toLowerCase()}.`);
  }

  function requestDeleteTasks(selected: TaskItem[]) {
    const single = selected.length === 1;
    setConfirm({
      title: single ? "Delete task?" : `Delete ${selected.length} tasks?`,
      message: <>
        <p style={{ margin: 0 }}>{single ? <>This permanently deletes <strong>{selected[0].title}</strong>.</> : "These tasks will be permanently deleted:"}</p>
        {!single && <ul>{selected.slice(0, 5).map(task => <li key={task.id}><strong>{task.title}</strong></li>)}{selected.length > 5 && <li>and {selected.length - 5} more</li>}</ul>}
        <p style={{ margin: "8px 0 0" }}>This can&apos;t be undone.</p>
      </>,
      confirmLabel: single ? "Delete task" : `Delete ${selected.length} tasks`,
      busyLabel: "Deleting…",
      onConfirm: async () => {
        const results = await Promise.allSettled(selected.map(task => api(`/projects/${task.projectId}/tasks/${task.id}/`, { method: "DELETE" })));
        const deleted = new Set(selected.filter((_, index) => results[index].status === "fulfilled").map(task => task.id));
        setTasks(current => current.filter(task => !deleted.has(task.id)));
        const failed = selected.length - deleted.size;
        if (failed) throw new Error(`${plural(failed, "task")} couldn't be deleted. ${deleted.size ? `${deleted.size} deleted.` : ""}`.trim());
        toast.success(single ? `Task “${selected[0].title}” deleted.` : `${plural(deleted.size, "task")} deleted.`);
      },
    });
  }

  if (loading || !user) {
    return <div className="loading-screen" role="status"><BrandMark size={52} /><span>Loading your account…</span></div>;
  }

  const ownedProjects = projects.filter(project => project.creator?.user_id === userId);
  const canCreateProject = !isAdmin;
  const today = todayKey();
  const openTaskCount = tasks.filter(task => task.status !== "Done").length;
  const dueTodayCount = tasks.filter(task => task.dueDate?.slice(0, 10) === today && task.status !== "Done").length;
  // Tasks are only ever created inside a specific project the user owns.
  const newTask = (defaults: Partial<TaskDraft> & { projectId: string }) => setTaskDialog({ defaults });

  function renderPage() {
    switch (activePage) {
      case "Dashboard":
        return <DashboardOverview userName={user!.full_name} isAdmin={isAdmin} projects={projects} tasks={tasks}
          canCreateProject={canCreateProject}
          onOpenProject={openProject} onOpenProjects={() => navigate("Projects")} onSelectTaskFilter={openTasks}
          onCreateProject={() => setProjectDialog({})} />;
      case "Tasks":
        return <TasksPage tasks={tasks} projects={projects} isAdmin={isAdmin} search={search} onSearchChange={setSearch}
          filter={taskFilter} onFilterChange={setTaskFilter} onOpenProjects={isAdmin ? undefined : () => navigate("Projects")}
          onEditTask={task => setTaskDialog({ task })} onDeleteTasks={requestDeleteTasks}
          onStatusChange={(id, status) => void changeTaskStatus(id, status)} onBulkStatus={(selected, status) => void bulkStatus(selected, status)} />;
      case "Projects":
        return <Projects projects={projects} tasks={tasks} currentUserId={userId} canCreateProject={canCreateProject}
          selectedProjectId={selectedProjectId} onSelectProject={setSelectedProjectId}
          onCreateProject={() => setProjectDialog({})} onEditProject={project => setProjectDialog({ project })} onDeleteProject={requestDeleteProject}
          onStatusChange={(id, status) => void changeTaskStatus(id, status)}
          onEditTask={task => setTaskDialog({ task })} onDeleteTask={task => requestDeleteTasks([task])}
          onAddTask={(projectId, status) => newTask({ projectId, status })} />;
      case "Calendar":
        return <Calendar tasks={tasks} />;
      case "Settings":
        return <Settings />;
    }
  }

  return (
    <div className="app-shell">
      <DashboardSidebar activePage={activePage} onNavigate={page => navigate(page)} onLogout={requestLogout}
        open={sidebarOpen} onClose={() => setSidebarOpen(false)}
        projects={projects} selectedProjectId={selectedProjectId} onOpenProject={openProject}
        openTaskCount={openTaskCount} dueTodayCount={dueTodayCount} onDailyTasks={() => openTasks("Today")}
        search={search} onSearch={value => { setSearch(value); if (value && activePage !== "Tasks") { setTaskFilter("All"); navigate("Tasks", false); } }} />
      {sidebarOpen && <button type="button" className="scrim" aria-label="Close navigation" onClick={() => setSidebarOpen(false)} />}
      <div className="main-area">
        <DashboardHeader title={isAdmin ? "Admin workspace" : "My workspace"} user={user} tasks={tasks}
          sidebarOpen={sidebarOpen} onOpenMenu={() => setSidebarOpen(true)} onLogout={requestLogout}
          onOpenSettings={() => navigate("Settings")} onOpenReminders={() => navigate("Calendar")} />
        <main className="page-content" id="main">
          {error && <div className="alert-error" role="alert"><span>{error}</span><button type="button" className="btn btn-secondary btn-sm" onClick={() => void load()}>Retry</button></div>}
          {fetching ? <WorkspaceSkeleton /> : renderPage()}
        </main>
      </div>

      {taskDialog && <TaskDialog task={taskDialog.task} defaults={taskDialog.defaults} projects={ownedProjects}
        onClose={() => setTaskDialog(null)}
        onSubmit={draft => (taskDialog.task ? updateTask(taskDialog.task, draft) : createTask(draft))} />}
      {projectDialog && <ProjectDialog project={projectDialog.project} ownedProjects={ownedProjects}
        onClose={() => setProjectDialog(null)}
        onSubmit={draft => (projectDialog.project ? updateProject(projectDialog.project, draft) : createProject(draft))} />}
      {confirm && <ConfirmDialog request={confirm} onClose={() => setConfirm(null)} />}
    </div>
  );
}
