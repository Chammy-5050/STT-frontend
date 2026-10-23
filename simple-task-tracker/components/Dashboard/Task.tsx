import type { TaskFilter, TaskItem } from "./types";

type Props = { tasks: TaskItem[]; filter: TaskFilter; onFilterChange: (filter: TaskFilter) => void; dataReady: boolean };

export default function Task({ tasks, filter, onFilterChange, dataReady }: Props) {
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const visibleTasks = tasks.filter((task) => {
    if (filter === "All") return true;
    if (filter === "Overdue") return Boolean(task.dueDate && task.dueDate.slice(0, 10) < todayKey && task.status !== "Done");
    return task.status === filter;
  });

  return (
    <section className="content-panel">
      <div className="list-heading"><div><h2>{filter === "All" ? "All tasks" : filter === "Overdue" ? "Overdue tasks" : `${filter} tasks`}</h2><p>Tasks across your workspace</p></div><select className="task-filter" value={filter} onChange={(event) => onFilterChange(event.target.value as TaskFilter)} aria-label="Filter tasks" disabled={!dataReady}><option>All</option><option>Pending</option><option>In Progress</option><option>Done</option><option>Overdue</option></select></div>
      <div className="task-table">{visibleTasks.length ? visibleTasks.map((task) => <article className="task-row" key={task.id}><span className={`status-dot ${task.status.toLowerCase().replace(" ", "-")}`} /><div className="task-row-copy"><h3>{task.title}</h3><p>{task.description}</p></div><span className="status-label">{task.status}</span>{task.dueDate && <time className="task-due-date" dateTime={task.dueDate}>{task.dueDate.slice(0, 10)}</time>}</article>) : <p className="empty-state">{dataReady ? "No tasks match this filter." : "Waiting for task data from the API."}</p>}</div>
    </section>
  );
}
