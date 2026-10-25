"use client";

import { useState, type FormEvent } from "react";
import { FolderPen, FolderPlus, Loader2 } from "lucide-react";
import { ApiError, message } from "@/lib/api";
import { ConfirmDialog, Field, Modal } from "./ui";
import type { ProjectDraft, ProjectItem } from "./types";

type Props = {
  /** Present when editing. */
  project?: ProjectItem;
  /** The user's own projects, used to catch duplicate names before saving. */
  ownedProjects: ProjectItem[];
  onClose: () => void;
  onSubmit: (draft: ProjectDraft) => Promise<unknown>;
};

const LIMIT = 255;

export default function ProjectDialog({ project, ownedProjects, onClose, onSubmit }: Props) {
  const editing = Boolean(project);
  const [initial] = useState<ProjectDraft>(() => ({ name: project?.name ?? "", description: project?.description ?? "" }));
  const [draft, setDraft] = useState(initial);
  const [errors, setErrors] = useState<{ name?: string; description?: string; form?: string }>({});
  const [busy, setBusy] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const dirty = draft.name !== initial.name || draft.description !== initial.description;

  function requestClose() {
    if (busy) return;
    if (dirty) setConfirmDiscard(true);
    else onClose();
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = draft.name.trim();
    if (!name) { setErrors({ name: "Enter a project name." }); return; }
    if (ownedProjects.some(item => item.id !== project?.id && item.name.toLowerCase() === name.toLowerCase())) {
      setErrors({ name: "You already have a project with this name." });
      return;
    }
    setBusy(true);
    try {
      await onSubmit({ name, description: draft.description.trim() });
      onClose();
    } catch (error) {
      const fields = error instanceof ApiError ? error.fields : {};
      setErrors({
        name: fields.project_name,
        description: fields.description,
        form: fields.project_name || fields.description ? undefined : message(error),
      });
      setBusy(false);
    }
  }

  return (
    <>
      <Modal title={editing ? "Edit project" : "Create a project"} description={editing ? "Rename the project or update its description." : "Group related tasks into a project."}
        icon={editing ? <FolderPen size={22} /> : <FolderPlus size={22} />} busy={busy} onClose={requestClose}>
        <form noValidate onSubmit={submit}>
          <div className="modal-body">
            <Field label="Project name" error={errors.name}>
              {control => <input {...control} className="input" autoFocus maxLength={LIMIT} value={draft.name} placeholder="e.g. Mobile app launch"
                onChange={event => { setDraft(current => ({ ...current, name: event.target.value })); setErrors({}); }} />}
            </Field>
            <Field label="Description" optional hint={`${draft.description.length}/${LIMIT} characters`} error={errors.description}>
              {control => <textarea {...control} className="textarea" rows={3} maxLength={LIMIT} value={draft.description} placeholder="What is this project about?"
                onChange={event => { setDraft(current => ({ ...current, description: event.target.value })); setErrors({}); }} />}
            </Field>
            {errors.form && <p className="form-error" role="alert">{errors.form}</p>}
          </div>
          <footer className="modal-footer">
            <button type="button" className="btn btn-secondary" disabled={busy} onClick={requestClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {busy ? <><Loader2 size={16} className="spin" aria-hidden="true" />{editing ? "Saving…" : "Creating…"}</> : editing ? "Save changes" : "Create project"}
            </button>
          </footer>
        </form>
      </Modal>
      {confirmDiscard && <ConfirmDialog onClose={() => setConfirmDiscard(false)} request={{
        title: "Discard changes?",
        message: "You have unsaved changes to this project. If you leave now they will be lost.",
        confirmLabel: "Discard changes",
        onConfirm: onClose,
      }} />}
    </>
  );
}
