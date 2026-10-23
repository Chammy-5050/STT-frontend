"use client";

import { useEffect, useState, type FormEvent } from "react";
import { X } from "lucide-react";
import type { ProjectItem } from "./types";
import styles from "./Projects.module.css";

type Props = { projects: ProjectItem[]; onClose: () => void; onCreate: (project: ProjectItem) => void };

export default function ProjectDialog({ projects, onClose, onCreate }: Props) {

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  function submit(event: FormEvent) {
    event.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) { setError("Enter a project name."); return; }
    if (projects.some((project) => project.name.toLowerCase() === cleanName.toLowerCase())) { setError("A project with this name already exists."); return; }
    onCreate({ id: Date.now(), name: cleanName, description: description.trim() });
    onClose();
  }

  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><form className="task-modal" role="dialog" aria-modal="true" aria-labelledby="project-dialog-title" onSubmit={submit}><div className="modal-heading"><div><span className="eyebrow">QUICK ACTION</span><h2 id="project-dialog-title">Create a project</h2></div><button type="button" className="icon-button" aria-label="Close project form" onClick={onClose}><X size={18} /></button></div><label>Project name<input autoFocus required maxLength={80} value={name} onChange={(event) => { setName(event.target.value); setError(""); }} placeholder="e.g. Mobile app launch" aria-describedby={error ? "project-error" : undefined} aria-invalid={!!error} /></label><label>Description<textarea rows={3} maxLength={240} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="What is this project about?" /></label>{error && <p id="project-error" className={styles.error} role="alert">{error}</p>}<p className="demo-note">Available immediately in the task form. Saved for this session.</p><div className="modal-actions"><button type="button" className="cancel-button" onClick={onClose}>Cancel</button><button type="submit" className="primary-button">Create project</button></div></form></div>;
}


