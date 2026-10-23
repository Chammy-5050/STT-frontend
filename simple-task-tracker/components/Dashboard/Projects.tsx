"use client";

import type { DragEvent } from "react";
import { useState } from "react";
import { MoreVertical } from "lucide-react";
import type { TaskItem, TaskStatus } from "./types";

type Props = {
  tasks: TaskItem[];
  onStatusChange: (taskId: number, status: TaskStatus) => void;
};

const columns: TaskStatus[] = ["Pending", "In Progress", "Done"];

export default function Projects({ tasks, onStatusChange }: Props) {
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [dropTarget, setDropTarget] = useState<TaskStatus | null>(null);

  function handleDragStart(event: DragEvent<HTMLElement>, taskId: number) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(taskId));
    setDraggingId(taskId);
  }

  function handleDrop(event: DragEvent<HTMLElement>, status: TaskStatus) {
    event.preventDefault();
    const taskId = Number(event.dataTransfer.getData("text/plain"));
    if (taskId) onStatusChange(taskId, status);
    setDraggingId(null);
    setDropTarget(null);
  }

  return (
    <>
      <div className="breadcrumbs">Workspace <span>/</span> Projects</div>
      <div className="project-heading"><div className="project-identity"><div><h2>Project tasks</h2><p>Drag a task to another column to update its status.</p></div></div></div>
      <p className="api-empty-state">Status changes are currently held in this page only. They will save to your account when the task API is connected.</p>
      <section className="board" aria-label="Task status board">
        {columns.map((status) => {
          const columnTasks = tasks.filter((task) => task.status === status);
          return (
            <section
              className={`board-column${dropTarget === status ? " drop-target" : ""}`}
              key={status}
              aria-label={`${status} tasks`}
              onDragOver={(event) => { event.preventDefault(); setDropTarget(status); }}
              onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setDropTarget(null); }}
              onDrop={(event) => handleDrop(event, status)}
            >
              <div className="column-heading"><span className={`status-dot ${status.toLowerCase().replace(" ", "-")}`} /><h3>{status}</h3><span className="task-total">{columnTasks.length}</span><MoreVertical size={16} className="column-menu-icon" /></div>
              <div className="task-list">
                {columnTasks.map((task) => (
                  <article
                    className={`task-card draggable-task${draggingId === task.id ? " is-dragging" : ""}`}
                    key={task.id}
                    draggable
                    onDragStart={(event) => handleDragStart(event, task.id)}
                    onDragEnd={() => { setDraggingId(null); setDropTarget(null); }}
                  >
                    <span className="card-menu" aria-hidden="true"><MoreVertical size={17} /></span>
                    <h4>{task.title}</h4>
                    <p>{task.description}</p>
                    {task.dueDate && <time className="task-due-date" dateTime={task.dueDate}>{task.dueDate.slice(0, 10)}</time>}
                    <label className="move-task-control">Move to
                      <select aria-label={`Move ${task.title} to another status`} value={task.status} onChange={(event) => onStatusChange(task.id, event.target.value as TaskStatus)}>
                        {columns.map((option) => <option key={option}>{option}</option>)}
                      </select>
                    </label>
                  </article>
                ))}
                {!columnTasks.length && <p className="column-empty">No tasks in this column.</p>}
              </div>
            </section>
          );
        })}
      </section>
    </>
  );
}
