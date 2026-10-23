import type { TaskFilter, TaskItem, TaskStatus } from "./types";
import { demoUserNames } from "./taskData";

type Props = { tasks: TaskItem[]; filter: TaskFilter; onFilterChange: (filter: TaskFilter) => void; onStatusChange: (taskId: number, status: TaskStatus) => void; showOwners?: boolean };

export default function Task({ tasks, filter, onFilterChange, onStatusChange, showOwners = false }: Props) {
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const visibleTasks = tasks.filter((task) => {
    if (filter === "All") return true;
    if (filter === "Overdue") return Boolean(task.dueDate && task.dueDate.slice(0, 10) < todayKey && task.status !== "Done");
    return task.status === filter;
  });

  return (
    <section className="content-panel">
      <div className="list-heading"><div><h2>{filter === "All" ? "All tasks" : filter === "Overdue" ? "Overdue tasks" : `${filter} tasks`}</h2><p>{visibleTasks.length} {visibleTasks.length === 1 ? "task" : "tasks"}</p></div><select className="task-filter" value={filter} onChange={(event) => onFilterChange(event.target.value as TaskFilter)} aria-label="Filter tasks"><option>All</option><option>Pending</option><option>In Progress</option><option>Done</option><option>Overdue</option></select></div>
      <div className="task-table">{visibleTasks.length ? visibleTasks.map((task) => <article className="task-row" key={task.id}><span className={`status-dot ${task.status.toLowerCase().replace(" ", "-")}`} /><div className="task-row-copy"><h3>{task.title}</h3><p>{task.description || "No description"}{showOwners ? ` · ${demoUserNames[task.ownerId] ?? task.ownerId}` : ""}</p></div><select className="task-status-select" aria-label={`Change ${task.title} status`} value={task.status} onChange={(event) => onStatusChange(task.id, event.target.value as TaskStatus)}><option>Pending</option><option>In Progress</option><option>Done</option></select>{task.dueDate && <time className="task-due-date" dateTime={task.dueDate}>{task.dueDate.slice(0, 10)}</time>}</article>) : <p className="empty-state">No tasks match this filter.</p>}</div>
    </section>
  );
}
