import { AlarmClock, CheckCircle2, CircleDashed, FolderKanban, Loader, Plus } from "lucide-react";
import DeadlineBadge from "./DeadlineBadge";
import { formatShortDate, isOverdue, plural, statusSlug, todayKey } from "./format";
import { EmptyState, PageHeader, StatusBadge } from "./ui";
import type { ProjectItem, TaskFilter, TaskItem } from "./types";

type Props = {
  userName: string;
  isAdmin: boolean;
  projects: ProjectItem[];
  tasks: TaskItem[];
  canCreateProject: boolean;
  onOpenProject: (projectId: string) => void;
  onOpenProjects: () => void;
  onSelectTaskFilter: (filter: TaskFilter) => void;
  onCreateProject: () => void;
};

function greeting(date = new Date()) {
  const hour = date.getHours();
  return hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
}

export default function DashboardOverview({ userName, isAdmin, projects, tasks, canCreateProject, onOpenProject, onOpenProjects, onSelectTaskFilter, onCreateProject }: Props) {
  const today = todayKey();
  const weekEnd = new Date();
  weekEnd.setDate(weekEnd.getDate() + 7);
  const weekEndKey = todayKey(weekEnd);
  const count = (status: TaskItem["status"]) => tasks.filter(task => task.status === status).length;
  const overdue = tasks.filter(task => isOverdue(task));
  const done = count("Done");
  const completion = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
  const attention = tasks
    .filter(task => task.status !== "Done" && task.dueDate && task.dueDate.slice(0, 10) <= weekEndKey)
    .sort((a, b) => a.dueDate!.localeCompare(b.dueDate!))
    .slice(0, 6);
  const recent = [...tasks].sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? "")).slice(0, 5);
  const projectName = (id: string) => projects.find(project => project.id === id)?.name ?? "No project";

  const stats = [
    { label: "Projects", value: projects.length, note: isAdmin ? "Across the team" : "In your workspace", icon: <FolderKanban size={22} />, tone: "info", onClick: onOpenProjects },
    { label: "Pending", value: count("Pending"), note: "Not started yet", icon: <CircleDashed size={22} />, tone: "warning", onClick: () => onSelectTaskFilter("Pending") },
    { label: "In progress", value: count("In Progress"), note: "Being worked on", icon: <Loader size={22} />, tone: "brand", onClick: () => onSelectTaskFilter("In Progress") },
    { label: "Completed", value: done, note: `${completion}% of all tasks`, icon: <CheckCircle2 size={22} />, tone: "success", onClick: () => onSelectTaskFilter("Done") },
    { label: "Overdue", value: overdue.length, note: overdue.length ? "Needs attention" : "Nothing overdue", icon: <AlarmClock size={22} />, tone: "danger", onClick: () => onSelectTaskFilter("Overdue"), alert: overdue.length > 0 },
  ];

  return (
    <>
      <PageHeader
        trail={["Workspace", "Dashboard"]}
        title={`${greeting()}, ${userName.split(" ")[0]}`}
        description={isAdmin ? "Here is how work is progressing across the team." : "Here is what's happening across your projects today."}
        actions={<>
          {canCreateProject && <button type="button" className="btn btn-primary btn-lg" onClick={onCreateProject}><Plus size={18} />New project</button>}
        </>}
      />

      <section className="stat-grid" aria-label="Workspace summary">
        {stats.map(stat => (
          <button type="button" key={stat.label} className={`stat-card${stat.alert ? " is-alert" : ""}`} onClick={stat.onClick}>
            <span className={`stat-icon tone-${stat.tone}`} aria-hidden="true">{stat.icon}</span>
            <span>{stat.label}</span>
            <strong>{stat.value}</strong>
            <small>{stat.note}</small>
          </button>
        ))}
      </section>

      {!projects.length ? (
        <EmptyState icon={<FolderKanban size={26} />} title={isAdmin ? "No projects in the team yet" : "Welcome to Task Tracker"}
          action={canCreateProject && <button type="button" className="btn btn-primary" onClick={onCreateProject}><Plus size={17} />Create your first project</button>}>
          {isAdmin ? "When members create projects and tasks they will show up here." : "Start by creating a project, then add tasks with due dates to track progress."}
        </EmptyState>
      ) : (
        <div className="dashboard-grid">
          <article className="panel">
            <div className="panel-header">
              <div><h2>Needs attention</h2><p>Overdue and due within 7 days</p></div>
              <button type="button" className="text-link" onClick={() => onSelectTaskFilter("Overdue")}>View overdue</button>
            </div>
            {attention.length ? (
              <ul className="list-rows">
                {attention.map(task => (
                  <li className="list-row" key={task.id}>
                    <span className={`status-dot ${statusSlug(task.status)}`} aria-hidden="true" />
                    <div className="list-row-copy"><b>{task.title}</b><small>{projectName(task.projectId)}</small></div>
                    <div className="list-row-meta">
                      <DeadlineBadge task={task} />
                      <time className="date-chip" dateTime={task.dueDate}>{task.dueDate!.slice(0, 10) === today ? "Today" : formatShortDate(task.dueDate)}</time>
                    </div>
                  </li>
                ))}
              </ul>
            ) : <p className="empty-inline">Nothing is overdue or due this week. Nice work!</p>}
          </article>

          <article className="panel">
            <div className="panel-header">
              <div><h2>Project progress</h2><p>Share of tasks completed</p></div>
              <button type="button" className="text-link" onClick={onOpenProjects}>All projects</button>
            </div>
            <ul className="progress-list">
              {projects.slice(0, 6).map(project => {
                const projectTasks = tasks.filter(task => task.projectId === project.id);
                const finished = projectTasks.filter(task => task.status === "Done").length;
                const percent = projectTasks.length ? Math.round((finished / projectTasks.length) * 100) : 0;
                return (
                  <li key={project.id}>
                    <button type="button" className="progress-row" onClick={() => onOpenProject(project.id)} aria-label={`${project.name}: ${percent}% complete, open board`}>
                      <span className={`status-dot${percent === 100 ? " done" : " in-progress"}`} aria-hidden="true" />
                      <b>{project.name}</b>
                      <small>{finished}/{plural(projectTasks.length, "task")} · {percent}%</small>
                      <span className="progress" aria-hidden="true"><span style={{ width: `${percent}%` }} /></span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </article>

          <article className="panel span-all">
            <div className="panel-header">
              <div><h2>Recently added</h2><p>Latest tasks across {isAdmin ? "the team" : "your projects"}</p></div>
              <button type="button" className="text-link" onClick={() => onSelectTaskFilter("All")}>View all tasks</button>
            </div>
            {recent.length ? (
              <ul className="list-rows">
                {recent.map(task => (
                  <li className="list-row" key={task.id}>
                    <span className={`status-dot ${statusSlug(task.status)}`} aria-hidden="true" />
                    <div className="list-row-copy"><b>{task.title}</b><small>{projectName(task.projectId)}{task.creator && isAdmin ? ` · ${task.creator.full_name}` : ""}</small></div>
                    <div className="list-row-meta"><StatusBadge status={task.status} /></div>
                  </li>
                ))}
              </ul>
            ) : <p className="empty-inline">No tasks yet.</p>}
          </article>
        </div>
      )}
    </>
  );
}
