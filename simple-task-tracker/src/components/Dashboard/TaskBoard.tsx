"use client";

import { useState, type DragEvent } from "react";
import { CalendarDays, Eye, PencilLine, Plus, Trash2 } from "lucide-react";
import CreatorBadge from "./CreatorBadge";
import DeadlineBadge from "./DeadlineBadge";
import { formatDate, statusSlug } from "./format";
import { ActionMenu } from "./ui";
import { TASK_STATUSES, type ProjectItem, type TaskItem, type TaskStatus } from "./types";

type Props = {
  tasks: TaskItem[];
  projects?: ProjectItem[];
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onEdit?: (task: TaskItem) => void;
  onDelete?: (task: TaskItem) => void;
  /** Shown as "+" on each column when the user can add tasks here. */
  onAddTask?: (status: TaskStatus) => void;
};

export default function TaskBoard({ tasks, projects, onStatusChange, onEdit, onDelete, onAddTask }: Props) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<TaskStatus | null>(null);
  const canEdit = (taskId: string | null) => Boolean(taskId && tasks.find(task => task.id === taskId)?.canEdit);

  function handleDragStart(event: DragEvent<HTMLElement>, taskId: string) {
    if (!canEdit(taskId)) { event.preventDefault(); return; }
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", taskId);
    setDraggingId(taskId);
  }

  function handleDrop(event: DragEvent<HTMLElement>, status: TaskStatus) {
    event.preventDefault();
    const taskId = event.dataTransfer.getData("text/plain");
    const task = tasks.find(item => item.id === taskId);
    // Re-check on drop: a forged drag payload must not move a read-only task.
    if (task?.canEdit && task.status !== status) onStatusChange(taskId, status);
    setDraggingId(null);
    setDropTarget(null);
  }

  return (
    <section className="board" aria-label="Task status board">
      {TASK_STATUSES.map(status => {
        const columnTasks = tasks.filter(task => task.status === status);
        return (
          <section
            key={status}
            className={`board-column${dropTarget === status ? " drop-target" : ""}`}
            aria-label={`${status} tasks`}
            onDragOver={event => { if (canEdit(draggingId)) { event.preventDefault(); setDropTarget(status); } }}
            onDragLeave={event => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setDropTarget(null); }}
            onDrop={event => handleDrop(event, status)}
          >
            <div className="column-heading">
              <span className={`status-dot ${statusSlug(status)}`} aria-hidden="true" />
              <h3>{status}</h3>
              <span className="count" aria-label={`${columnTasks.length} tasks`}>{columnTasks.length}</span>
              {onAddTask && <button type="button" className="icon-button sm" aria-label={`Add a ${status.toLowerCase()} task`} onClick={() => onAddTask(status)}><Plus size={17} /></button>}
            </div>
            <div className="task-list">
              {columnTasks.map(task => (
                <article
                  key={task.id}
                  className={`task-card${task.canEdit ? " draggable-task" : " read-only-task"}${draggingId === task.id ? " is-dragging" : ""}`}
                  draggable={Boolean(task.canEdit)}
                  onDragStart={event => handleDragStart(event, task.id)}
                  onDragEnd={() => { setDraggingId(null); setDropTarget(null); }}
                >
                  <div className="task-card-head">
                    <h4>{task.title}</h4>
                    {task.canEdit && (onEdit || onDelete) && <ActionMenu label={`Actions for ${task.title}`} actions={[
                      ...(onEdit ? [{ label: "Edit task", icon: <PencilLine size={16} />, onSelect: () => onEdit(task) }] : []),
                      ...(onDelete ? [{ label: "Delete task", icon: <Trash2 size={16} />, tone: "danger" as const, separatorBefore: true, onSelect: () => onDelete(task) }] : []),
                    ]} />}
                  </div>
                  {task.description && <p>{task.description}</p>}
                  {(task.dueDate || projects) && (
                    <div className="task-card-meta">
                      {task.dueDate && <time dateTime={task.dueDate}><CalendarDays size={14} aria-hidden="true" />{formatDate(task.dueDate)}</time>}
                      <DeadlineBadge task={task} />
                      {projects && <span className="task-card-project">· {projects.find(project => project.id === task.projectId)?.name}</span>}
                    </div>
                  )}
                  <div className="task-card-foot">
                    <CreatorBadge creator={task.creator} size={24} />
                    {task.canEdit
                      ? <select className={`status-select status-${statusSlug(task.status)}`} aria-label={`Move ${task.title} to another status`} value={task.status}
                          onChange={event => onStatusChange(task.id, event.target.value as TaskStatus)}>
                          {TASK_STATUSES.map(option => <option key={option}>{option}</option>)}
                        </select>
                      : <span className="read-only-note"><Eye size={14} aria-hidden="true" />View only</span>}
                  </div>
                </article>
              ))}
              {!columnTasks.length && <p className="column-empty">{draggingId ? "Drop here to move" : "No tasks here yet"}</p>}
            </div>
          </section>
        );
      })}
    </section>
  );
}
