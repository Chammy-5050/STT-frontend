"use client";

import type { DragEvent } from "react";
import { useState } from "react";
import { MoreVertical, Plus } from "lucide-react";
import CreatorBadge from "./CreatorBadge";
import DeadlineBadge from "./DeadlineBadge";
import ProjectDialog from "./ProjectDialog";
import styles from "./Projects.module.css";
import type { ProjectDraft, ProjectItem, TaskItem, TaskStatus } from "./types";

type Props = {
  canCreateProject?: boolean;
  projects: ProjectItem[];
  onCreateProject: (project: ProjectDraft) => Promise<ProjectItem>;
  tasks: TaskItem[];
  onStatusChange: (taskId: string, status: TaskStatus) => void;
};

const columns: TaskStatus[] = ["Pending", "In Progress", "Done"];

export default function Projects({ projects, tasks, onCreateProject, onStatusChange, canCreateProject = false }: Props) {
  const [creatingProject, setCreatingProject] = useState(false);
  const [selectedProject, setSelectedProject] = useState("");
  const currentProject = projects.find((project) => project.id === selectedProject);
  const projectTasks = selectedProject ? tasks.filter((task) => task.projectId === selectedProject) : tasks;
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<TaskStatus | null>(null);

  function handleDragStart(event: DragEvent<HTMLElement>, taskId: string) {
    if (!tasks.find(task => task.id === taskId)?.canEdit) { event.preventDefault(); return; }
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(taskId));
    setDraggingId(taskId);
  }

  function handleDrop(event: DragEvent<HTMLElement>, status: TaskStatus) {
    event.preventDefault();
    const taskId = event.dataTransfer.getData("text/plain");
    if (tasks.find(task => task.id === taskId)?.canEdit) onStatusChange(taskId, status);
    setDraggingId(null);
    setDropTarget(null);
  }

  return (
    <>
      <div className="breadcrumbs">Workspace <span>/</span> Projects</div>
      <div className="project-heading"><div className="project-identity"><div><h2>{currentProject?.name ?? "Projects"}</h2><p>{currentProject?.description || "View projects and track task progress."}</p></div></div>{canCreateProject && <button className="primary-button" onClick={() => setCreatingProject(true)}><Plus size={15} />Create project</button>}</div>
      <div className={styles.projectPicker}><label>Project<select value={selectedProject} onChange={(event) => setSelectedProject(event.target.value)}><option value="">All projects</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></label><span>{projects.length} {projects.length === 1 ? "project" : "projects"} in your workspace</span></div>
      <div className="project-cards" aria-label="Projects in your workspace">
        {projects.map(project => (
          <button type="button" className={`project-summary-card ${styles.projectCard}${selectedProject === project.id ? ` ${styles.selectedCard}` : ""}`} aria-pressed={selectedProject === project.id} key={project.id} onClick={() => setSelectedProject(project.id)}>
            <span className={styles.cardTop}><span className={styles.projectIcon} aria-hidden="true">{project.name.slice(0, 1).toUpperCase()}</span><span className={styles.taskCount}>{tasks.filter(task => task.projectId === project.id).length} tasks</span></span>
            <strong>{project.name}</strong>
            <span className={styles.cardDescription}>{project.description || "No description yet."}</span>
            <CreatorBadge creator={project.creator} />
            <span className={styles.cardAction}>{selectedProject === project.id ? "Showing this project's tasks" : "View project tasks →"}</span>
          </button>
        ))}
        {!projects.length && <p className="empty-state">{canCreateProject ? "No projects yet. Create your first project to get started." : "No projects have been created yet."}</p>}
      </div>
      <section className="board" aria-label="Task status board">
        {columns.map((status) => {
          const columnTasks = projectTasks.filter((task) => task.status === status);
          return (
            <section
              className={`board-column${dropTarget === status ? " drop-target" : ""}`}
              key={status}
              aria-label={`${status} tasks`}
              onDragOver={(event) => { if (draggingId && tasks.find(task => task.id === draggingId)?.canEdit) { event.preventDefault(); setDropTarget(status); } }}
              onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setDropTarget(null); }}
              onDrop={(event) => handleDrop(event, status)}
            >
              <div className="column-heading"><span className={`status-dot ${status.toLowerCase().replace(" ", "-")}`} /><h3>{status}</h3><span className="task-total">{columnTasks.length}</span><MoreVertical size={16} className="column-menu-icon" /></div>
              <div className="task-list">
                {columnTasks.map((task) => (
                  <article
                    className={`task-card${task.canEdit ? " draggable-task" : " read-only-task"}${draggingId === task.id ? " is-dragging" : ""}`}
                    key={task.id}
                    draggable={Boolean(task.canEdit)}
                    onDragStart={(event) => handleDragStart(event, task.id)}
                    onDragEnd={() => { setDraggingId(null); setDropTarget(null); }}
                  >
                    <span className="card-menu" aria-hidden="true"><MoreVertical size={17} /></span>
                    <h4>{task.title}</h4>
                    <p>{task.description}</p>
                    {task.dueDate && <time className="task-due-date" dateTime={task.dueDate}>{task.dueDate.slice(0, 10)}</time>}
                    <DeadlineBadge task={task} />
                    <CreatorBadge creator={task.creator} />
                    {task.canEdit ? <label className="move-task-control">Move to
                      <select aria-label={`Move ${task.title} to another status`} value={task.status} onChange={(event) => onStatusChange(task.id, event.target.value as TaskStatus)}>
                        {columns.map((option) => <option key={option}>{option}</option>)}
                      </select>
                    </label> : <span className="task-read-only">View only</span>}
                  </article>
                ))}
                {!columnTasks.length && <p className="column-empty">No tasks in this column.</p>}
              </div>
            </section>
          );
        })}
      </section>
      {canCreateProject && creatingProject && <ProjectDialog projects={projects} onClose={() => setCreatingProject(false)} onCreate={async (input) => { const project = await onCreateProject(input); setSelectedProject(project.id); return project; }} />}
    </>
  );
}
