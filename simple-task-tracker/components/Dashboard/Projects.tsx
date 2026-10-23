"use client";

import type { DragEvent } from "react";
import { useState } from "react";
import { MoreVertical, Plus } from "lucide-react";
import ProjectDialog from "./ProjectDialog";
import styles from "./Projects.module.css";
import type { ProjectItem, TaskItem, TaskStatus } from "./types";

type Props = {
  projects: ProjectItem[];
  onCreateProject: (project: ProjectItem) => void;
  tasks: TaskItem[];
  onStatusChange: (taskId: number, status: TaskStatus) => void;
};

const columns: TaskStatus[] = ["Pending", "In Progress", "Done"];

export default function Projects({ projects, tasks, onCreateProject, onStatusChange }: Props) {
  const [creatingProject, setCreatingProject] = useState(false);
  const [selectedProject, setSelectedProject] = useState(0);
  const currentProject = projects.find((project) => project.id === selectedProject);
  const projectTasks = selectedProject ? tasks.filter((task) => task.projectId === selectedProject) : tasks;
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
      <div className="project-heading"><div className="project-identity"><div><h2>{currentProject?.name ?? "Projects"}</h2><p>{currentProject?.description || "Manage your projects and keep every task moving."}</p></div></div><button className="primary-button" onClick={() => setCreatingProject(true)}><Plus size={15} />Create project</button></div>
      <div className={styles.projectPicker}><label>Project<select value={selectedProject} onChange={(event) => setSelectedProject(Number(event.target.value))}><option value={0}>All projects</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></label><span>{projects.length} {projects.length === 1 ? "project" : "projects"} in your workspace</span></div>
      <p className="demo-banner">Drag tasks or change their status from the card menu. Updates are kept for this demo session.</p>
      <section className="board" aria-label="Task status board">
        {columns.map((status) => {
          const columnTasks = projectTasks.filter((task) => task.status === status);
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
      {creatingProject && <ProjectDialog projects={projects} onClose={() => setCreatingProject(false)} onCreate={(project) => { onCreateProject(project); setSelectedProject(project.id); }} />}
    </>
  );
}
