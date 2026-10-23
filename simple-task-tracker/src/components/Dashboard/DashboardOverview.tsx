import type { ProjectItem, TaskFilter, TaskItem, TaskStatus } from "./types";

type Props = {
  projects: ProjectItem[];
  tasks: TaskItem[];
  onOpenProjects: () => void;
  onSelectTaskFilter: (filter: TaskFilter) => void;
};

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatDate(date: string) {
  return new Date(`${date.slice(0, 10)}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function DashboardOverview({ projects, tasks, onOpenProjects, onSelectTaskFilter }: Props) {
  const statuses: TaskStatus[] = ["Pending", "In Progress", "Done"];
  const today = new Date();
  const todayKey = dateKey(today);
  const weekEnd = new Date(today);
  weekEnd.setDate(weekEnd.getDate() + 7);
  const overdueTasks = tasks.filter((task) => task.dueDate && task.dueDate.slice(0, 10) < todayKey && task.status !== "Done");
  const upcomingTasks = tasks
    .filter((task) => task.dueDate && task.dueDate.slice(0, 10) >= todayKey && task.dueDate.slice(0, 10) <= dateKey(weekEnd) && task.status !== "Done")
    .sort((first, second) => (first.dueDate ?? "").localeCompare(second.dueDate ?? ""));

  return (
    <>
      <div className="breadcrumbs">Workspace <span>/</span> Dashboard</div>
      <section className="summary-grid" aria-label="Workspace summary">
        <button className="summary-card" onClick={onOpenProjects}><span>Total projects</span><strong>{projects.length}</strong><small>Open your projects</small></button>
        <button className="summary-card" onClick={() => onSelectTaskFilter("All")}><span>Total tasks</span><strong>{tasks.length}</strong><small>Across all projects</small></button>
        {statuses.map((status) => <button className="summary-card" key={status} onClick={() => onSelectTaskFilter(status)}><span>{status === "Done" ? "Completed tasks" : `${status} tasks`}</span><strong>{tasks.filter((task) => task.status === status).length}</strong><small>Click to view tasks</small></button>)}
        <button className="summary-card warning-card" onClick={() => onSelectTaskFilter("Overdue")}><span>Overdue tasks</span><strong>{overdueTasks.length}</strong><small>Past due and not completed</small></button>
      </section>
      <section className="dashboard-lower-grid">
        <article className="content-panel"><div className="list-heading"><div><h2>Upcoming deadlines</h2><p>Due within the next 7 days</p></div></div>
          {upcomingTasks.length ? upcomingTasks.map((task) => <div className="task-row" key={task.id}><span className={`status-dot ${task.status.toLowerCase().replace(" ", "-")}`} /><div className="task-row-copy"><h3>{task.title}</h3><p>{projects.find((project) => project.id === task.projectId)?.name ?? "No project"}</p></div><span className="status-label">{task.dueDate ? formatDate(task.dueDate) : ""}</span></div>) : <p className="empty-state">No upcoming deadlines.</p>}
        </article>
        <article className="content-panel"><div className="list-heading"><div><h2>Recent projects</h2><p>Your current workspaces</p></div><button className="text-button" onClick={onOpenProjects}>View all</button></div>
          {projects.slice(0, 3).map((project) => <button className="project-summary-row" key={project.id} onClick={onOpenProjects}><span className="project-summary-mark">{project.name.slice(0, 1)}</span><span><b>{project.name}</b><small>{project.description}</small></span><span className="project-summary-count">{tasks.filter((task) => task.projectId === project.id).length} tasks</span></button>)}
          {!projects.length && <p className="empty-state">No projects yet.</p>}
        </article>
        <article className="content-panel recent-tasks-panel"><div className="list-heading"><div><h2>Recent tasks</h2><p>Latest activity across your projects</p></div><button className="text-button" onClick={() => onSelectTaskFilter("All")}>View all</button></div>
          {tasks.slice(0, 4).map((task) => <div className="task-row" key={task.id}><span className={`status-dot ${task.status.toLowerCase().replace(" ", "-")}`} /><div className="task-row-copy"><h3>{task.title}</h3><p>{projects.find((project) => project.id === task.projectId)?.name ?? "No project"}</p></div><span className="status-label">{task.status}</span></div>)}
          {!tasks.length && <p className="empty-state">No recent tasks.</p>}
        </article>
      </section>
    </>
  );
}
