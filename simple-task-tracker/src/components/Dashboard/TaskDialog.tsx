"use client";

import { useState, type FormEvent } from "react";
import { FolderOpen, ListPlus, Loader2, PencilLine } from "lucide-react";
import { ApiError, message } from "@/lib/api";
import { ConfirmDialog, EmptyState, Field, Modal } from "./ui";
import { TASK_STATUSES, type ProjectItem, type TaskDraft, type TaskItem, type TaskStatus } from "./types";

type Props = {
  /** Present when editing; absent when creating. */
  task?: TaskItem;
  /** Projects the user owns, used to name the task's project. */
  projects: ProjectItem[];
  /** New tasks are always created inside the project given here. */
  defaults?: Partial<TaskDraft>;
  onClose: () => void;
  onSubmit: (draft: TaskDraft) => Promise<void>;
};

type Errors = Partial<Record<"title" | "description" | "projectId" | "dueDate" | "form", string>>;
const LIMIT = 255;

export default function TaskDialog({ task, projects, defaults, onClose, onSubmit }: Props) {
  const editing = Boolean(task);
  const [initial] = useState<TaskDraft>(() => ({
    title: task?.title ?? defaults?.title ?? "",
    description: task?.description ?? defaults?.description ?? "",
    status: task?.status ?? defaults?.status ?? "Pending",
    projectId: task?.projectId ?? defaults?.projectId ?? "",
    dueDate: task?.dueDate?.slice(0, 10) ?? defaults?.dueDate ?? "",
  }));
  const [draft, setDraft] = useState<TaskDraft>(initial);
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const dirty = JSON.stringify(draft) !== JSON.stringify(initial);

  function update<K extends keyof TaskDraft>(key: K, value: TaskDraft[K]) {
    setDraft(current => ({ ...current, [key]: value }));
    setErrors(current => ({ ...current, [key]: undefined, form: undefined }));
  }

  function requestClose() {
    if (busy) return;
    if (dirty) setConfirmDiscard(true);
    else onClose();
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = draft.title.trim();
    const next: Errors = {};
    if (!title) next.title = "Enter a task name.";
    if (!draft.projectId) next.projectId = "Choose a project.";
    if (Object.keys(next).length) { setErrors(next); return; }
    setBusy(true);
    try {
      await onSubmit({ ...draft, title, description: draft.description.trim(), dueDate: draft.dueDate || undefined });
      onClose();
    } catch (error) {
      const fields = error instanceof ApiError ? error.fields : {};
      setErrors({
        title: fields.task_name,
        description: fields.description,
        dueDate: fields.due_date,
        form: fields.task_name || fields.description || fields.due_date ? undefined : message(error),
      });
      setBusy(false);
    }
  }

  const project = projects.find(item => item.id === draft.projectId);

  if (!editing && !project) {
    return (
      <Modal title="Create a task" icon={<ListPlus size={22} />} onClose={onClose}>
        <div className="modal-body">
          <EmptyState icon={<FolderOpen size={26} />} title="Open a project first">
            Tasks live inside projects. Open one of your projects and add the task from its board.
          </EmptyState>
        </div>
      </Modal>
    );
  }

  return (
    <>
      <Modal title={editing ? "Edit task" : "Create a task"} description={editing ? "Update the details of this task." : `Add a task to ${project!.name}.`}
        icon={editing ? <PencilLine size={22} /> : <ListPlus size={22} />} busy={busy} onClose={requestClose}>
        <form noValidate onSubmit={submit}>
          <div className="modal-body">
            <Field label="Task name" error={errors.title}>
              {control => <input {...control} className="input" autoFocus maxLength={LIMIT} value={draft.title} placeholder="e.g. Prepare project kickoff"
                onChange={event => update("title", event.target.value)} />}
            </Field>
            <Field label="Description" optional hint={`${draft.description.length}/${LIMIT} characters`} error={errors.description}>
              {control => <textarea {...control} className="textarea" rows={3} maxLength={LIMIT} value={draft.description} placeholder="Add a short description"
                onChange={event => update("description", event.target.value)} />}
            </Field>
            <Field label="Project" hint={editing ? "Tasks stay in the project they were created in." : "Tasks are added to the project you are working in."} error={errors.projectId}>
              {control => <input {...control} className="input" readOnly disabled value={project?.name ?? "Unknown project"} />}
            </Field>
            <div className="form-grid">
              <Field label="Status">
                {control => <select {...control} className="select" value={draft.status} onChange={event => update("status", event.target.value as TaskStatus)}>
                  {TASK_STATUSES.map(status => <option key={status}>{status}</option>)}
                </select>}
              </Field>
              <Field label="Due date" optional error={errors.dueDate}>
                {control => <input {...control} className="input" type="date" value={draft.dueDate ?? ""} onChange={event => update("dueDate", event.target.value)} />}
              </Field>
            </div>
            {errors.form && <p className="form-error" role="alert">{errors.form}</p>}
          </div>
          <footer className="modal-footer">
            <button type="button" className="btn btn-secondary" disabled={busy} onClick={requestClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {busy ? <><Loader2 size={16} className="spin" aria-hidden="true" />{editing ? "Saving…" : "Creating…"}</> : editing ? "Save changes" : "Create task"}
            </button>
          </footer>
        </form>
      </Modal>
      {confirmDiscard && <ConfirmDialog onClose={() => setConfirmDiscard(false)} request={{
        title: "Discard changes?",
        message: "You have unsaved changes to this task. If you leave now they will be lost.",
        confirmLabel: "Discard changes",
        onConfirm: onClose,
      }} />}
    </>
  );
}
