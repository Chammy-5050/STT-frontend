"use client";

import { useState } from "react";
import { FolderKanban, FolderPlus, PencilLine, Plus, Trash2 } from "lucide-react";
import CreatorBadge from "./CreatorBadge";
import TaskBoard from "./TaskBoard";
import { colorSlot, plural } from "./format";
import { ActionMenu, EmptyState, PageHeader } from "./ui";
import type { ProjectItem, TaskItem, TaskStatus } from "./types";

type Props = {
  projects: ProjectItem[];
  tasks: TaskItem[];
  currentUserId?: string;
  canCreateProject?: boolean;
  /** Controlled selection (e.g. from the sidebar); falls back to local state. */
  selectedProjectId?: string;
  onSelectProject?: (projectId: string) => void;
  onCreateProject?: () => void;
  onEditProject?: (project: ProjectItem) => void;
  onDeleteProject?: (project: ProjectItem) => void;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onEditTask?: (task: TaskItem) => void;
  onDeleteTask?: (task: TaskItem) => void;
  onAddTask?: (projectId: string, status: TaskStatus) => void;
};

export default function Projects({
  projects, tasks, currentUserId, canCreateProject = false, selectedProjectId, onSelectProject,
  onCreateProject, onEditProject, onDeleteProject, onStatusChange, onEditTask, onDeleteTask, onAddTask,
}: Props) {
  const [localSelection, setLocalSelection] = useState("");
  const selected = selectedProjectId ?? localSelection;
  const select = (projectId: string) => (onSelectProject ? onSelectProject(projectId) : setLocalSelection(projectId));
  const currentProject = projects.find(project => project.id === selected);
  const boardTasks = currentProject ? tasks.filter(task => task.projectId === currentProject.id) : tasks;
  const ownsCurrent = Boolean(currentProject && currentProject.creator?.user_id === currentUserId);

  return (
    <>
      <PageHeader
        trail={["Workspace", "Projects"]}
        title="Projects"
        description={canCreateProject ? "Create projects, then plan and move their tasks across the board." : "Every project in the team. Projects owned by others are view only."}
        actions={canCreateProject && onCreateProject && <button type="button" className="btn btn-primary btn-lg" onClick={onCreateProject}><Plus size={18} />Create project</button>}
      />

      {!projects.length ? (
        <EmptyState icon={<FolderKanban size={26} />} title="No projects yet"
          action={canCreateProject && onCreateProject && <button type="button" className="btn btn-primary" onClick={onCreateProject}><FolderPlus size={17} />Create your first project</button>}>
          {canCreateProject ? "Projects group related tasks. Create one to start planning work." : "Members haven't created any projects yet."}
        </EmptyState>
      ) : (
        <>
          <div className="project-grid" aria-label="Projects in your workspace">
            {projects.map(project => {
              const projectTasks = tasks.filter(task => task.projectId === project.id);
              const done = projectTasks.filter(task => task.status === "Done").length;
              const percent = projectTasks.length ? Math.round((done / projectTasks.length) * 100) : 0;
              const owned = project.creator?.user_id === currentUserId;
              return (
                <article key={project.id} className={`project-card${selected === project.id ? " is-selected" : ""}`}>
                  <div className="project-card-head">
                    <span className={`project-tile avatar-${colorSlot(project.name)}`} aria-hidden="true">{project.name.slice(0, 1).toUpperCase()}</span>
                    <button type="button" className="project-select" aria-pressed={selected === project.id} onClick={() => select(project.id)}>
                      <strong>{project.name}</strong>
                      <small>{plural(projectTasks.length, "task")}</small>
                    </button>
                    {owned && (onEditProject || onDeleteProject) && <ActionMenu label={`Actions for ${project.name}`} actions={[
                      ...(onEditProject ? [{ label: "Edit project", icon: <PencilLine size={16} />, onSelect: () => onEditProject(project) }] : []),
                      ...(onDeleteProject ? [{ label: "Delete project", icon: <Trash2 size={16} />, tone: "danger" as const, separatorBefore: true, onSelect: () => onDeleteProject(project) }] : []),
                    ]} />}
                  </div>
                  <p className={`project-description${project.description ? "" : " is-empty"}`}>{project.description || "No description yet."}</p>
                  <div>
                    <div className="project-progress-meta"><span>Progress</span><span>{done}/{projectTasks.length} done · {percent}%</span></div>
                    <div className="progress" role="progressbar" aria-label={`${project.name} progress`} aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${percent}%` }} /></div>
                  </div>
                  <div className="project-card-foot">
                    <CreatorBadge creator={project.creator} size={26} />
                    {!owned && <span className="read-only-note">View only</span>}
                  </div>
                </article>
              );
            })}
          </div>

          <div className="board-header">
            <div>
              <h2>{currentProject ? `${currentProject.name} board` : "All projects board"}</h2>
              <p>{currentProject ? (ownsCurrent ? "Add tasks to this project, then drag cards between columns or use the status menu on each card." : "This project belongs to another member and is view only.") : canCreateProject ? "Open one of your projects to add tasks to it." : "Select a project card to focus its board."}</p>
            </div>
            <div className="page-actions">
              {currentProject && <button type="button" className="btn btn-secondary" onClick={() => select("")}>Show all projects</button>}
              {ownsCurrent && onAddTask && <button type="button" className="btn btn-primary" onClick={() => onAddTask(currentProject!.id, "Pending")}><Plus size={17} />Add task</button>}
            </div>
          </div>
          <TaskBoard
            tasks={boardTasks}
            projects={currentProject ? undefined : projects}
            onStatusChange={onStatusChange}
            onEdit={onEditTask}
            onDelete={onDeleteTask}
            onAddTask={ownsCurrent && onAddTask ? status => onAddTask(currentProject!.id, status) : undefined}
          />
        </>
      )}
    </>
  );
}
