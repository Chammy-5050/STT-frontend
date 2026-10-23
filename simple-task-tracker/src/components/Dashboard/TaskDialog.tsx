import { useState, type FormEvent } from "react";
import type { ProjectItem, TaskDraft, TaskStatus } from "./types";
import { message } from "@/lib/api";

type Props = {
  projects: ProjectItem[];
  onClose: () => void;
  onCreate: (task: TaskDraft) => Promise<void>;
};

export default function TaskDialog({ projects, onClose, onCreate }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TaskStatus>("Pending");
  const [projectId, setProjectId] = useState(projects[0]?.id ?? "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [dueDate, setDueDate] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanTitle = title.trim();
    if (!cleanTitle) return;
    if (!projectId) { setError("Create a project first."); return; }
    setBusy(true);
    try { await onCreate({ title: cleanTitle, description: description.trim(), status, projectId, dueDate: dueDate || undefined }); onClose(); }
    catch (error) { setError(message(error)); }
    finally { setBusy(false); }
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
        <label>Project<select required value={projectId} onChange={(event) => setProjectId(event.target.value)}>{projects.map((project) => <option value={project.id} key={project.id}>{project.name}</option>)}</select></label>
        {error && <p role="alert" className="api-error">{error}</p>}
        <div className="modal-actions"><button type="button" className="cancel-button" disabled={busy} onClick={onClose}>Cancel</button><button type="submit" className="primary-button" disabled={busy || !projectId}>{busy ? "Saving…" : "Create task"}</button></div>
      </form>
    </div>
  );
}
