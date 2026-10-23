import { useState, type FormEvent } from "react";
import type { ProjectItem, TaskItem, TaskStatus } from "./types";

type Props = {
  projects: ProjectItem[];
  onClose: () => void;
  onCreate: (task: TaskItem) => void;
};

export default function TaskDialog({ projects, onClose, onCreate }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TaskStatus>("Pending");
  const [projectId, setProjectId] = useState(projects[0]?.id ?? 0);
  const [dueDate, setDueDate] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanTitle = title.trim();
    if (!cleanTitle) return;
    onCreate({ id: Date.now(), title: cleanTitle, description: description.trim(), status, projectId: projectId || undefined, dueDate: dueDate || undefined, createdAt: new Date().toISOString() });
    onClose();
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <form className="task-modal" role="dialog" aria-modal="true" aria-labelledby="task-dialog-title" onSubmit={handleSubmit}>
        <div className="modal-heading"><div><span className="eyebrow">QUICK ACTION</span><h2 id="task-dialog-title">Create a task</h2></div><button type="button" className="icon-button" aria-label="Close" onClick={onClose}>×</button></div>
        <label>Task name<input autoFocus required maxLength={80} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Prepare project kickoff" /></label>
        <label>Description<textarea rows={3} maxLength={240} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Add a short description" /></label>
        <div className="task-form-grid">
          <label>Status<select value={status} onChange={(event) => setStatus(event.target.value as TaskStatus)}><option>Pending</option><option>In Progress</option><option>Done</option></select></label>
          <label>Due date<input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} /></label>
        </div>
        {projects.length > 0 && <label>Project<select value={projectId} onChange={(event) => setProjectId(Number(event.target.value))}>{projects.map((project) => <option value={project.id} key={project.id}>{project.name}</option>)}</select></label>}
        <p className="demo-note">Saved in this browser session for the UI demo.</p>
        <div className="modal-actions"><button type="button" className="cancel-button" onClick={onClose}>Cancel</button><button type="submit" className="primary-button">Create task</button></div>
      </form>
    </div>
  );
}
