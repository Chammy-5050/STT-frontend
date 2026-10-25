"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { AlertTriangle, Loader2, MoreVertical, X } from "lucide-react";
import { message } from "@/lib/api";
import { colorSlot, initials, statusSlug } from "./format";
import type { TaskStatus } from "./types";

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function BrandMark({ size = 32 }: { size?: number }) {
  return (
    <span className="brand-mark" style={{ width: size, height: size }} aria-hidden="true">
      <svg viewBox="0 0 48 48" width={size * 0.62} height={size * 0.62} fill="none">
        <rect x="8" y="19" width="24" height="8" rx="4" transform="rotate(45 8 19)" fill="currentColor" />
        <circle cx="31.5" cy="15.5" r="4.5" fill="currentColor" />
        <circle cx="39" cy="8" r="3.5" fill="currentColor" />
      </svg>
    </span>
  );
}

export function Avatar({ name, src, size = 32 }: { name: string; src?: string | null; size?: number }) {
  const style = { width: size, height: size, fontSize: Math.max(11, Math.round(size * 0.38)) };
  return src
    ? <img className="avatar" src={src} alt="" width={size} height={size} style={style} />
    : <span className={`avatar avatar-${colorSlot(name)}`} style={style} aria-hidden="true">{initials(name)}</span>;
}

export function StatusBadge({ status }: { status: TaskStatus }) {
  return <span className={`status-badge status-${statusSlug(status)}`}><i aria-hidden="true" />{status}</span>;
}

export function PageHeader({ trail, title, description, actions }: { trail: string[]; title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="page-header">
      <div>
        <nav aria-label="Breadcrumb">
          <ol className="breadcrumbs">
            {trail.map((item, index) => <li key={item} aria-current={index === trail.length - 1 ? "page" : undefined}>{item}</li>)}
          </ol>
        </nav>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </header>
  );
}

type ControlProps = { id: string; "aria-invalid": boolean; "aria-describedby"?: string };

/** Label + control + hint/error. The label stays clean; hint and error are linked via aria-describedby. */
export function Field({ label, optional, hint, error, children }: { label: string; optional?: boolean; hint?: ReactNode; error?: string; children: (control: ControlProps) => ReactNode }) {
  const id = useId();
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;
  return (
    <div className="field">
      <label htmlFor={id} className="field-label">{label}{optional && <span className="optional"> (optional)</span>}</label>
      {children({ id, "aria-invalid": Boolean(error), "aria-describedby": describedBy })}
      {hint && <small id={`${id}-hint`}>{hint}</small>}
      {error && <small id={`${id}-error`} className="field-error">{error}</small>}
    </div>
  );
}

export function EmptyState({ icon, title, children, action }: { icon: ReactNode; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="empty-state">
      <span className="empty-icon" aria-hidden="true">{icon}</span>
      <h3>{title}</h3>
      {children && <p>{children}</p>}
      {action}
    </div>
  );
}

type ModalProps = {
  title: string;
  description?: ReactNode;
  icon?: ReactNode;
  tone?: "brand" | "danger";
  size?: "sm" | "md";
  role?: "dialog" | "alertdialog";
  busy?: boolean;
  onClose: () => void;
  children: ReactNode;
};

/** Accessible dialog: traps focus, closes on Escape/backdrop (unless busy) and restores focus. */
export function Modal({ title, description, icon, tone = "brand", size = "md", role = "dialog", busy = false, onClose, children }: ModalProps) {
  const titleId = useId();
  const descriptionId = useId();
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const node = panel.current;
    if (node && !node.contains(document.activeElement)) node.querySelector<HTMLElement>(FOCUSABLE)?.focus();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
      previous?.focus?.();
    };
  }, []);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.stopPropagation();
      if (!busy) onClose();
      return;
    }
    if (event.key !== "Tab" || !panel.current) return;
    const items = [...panel.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget && !busy) onClose(); }}>
      <div ref={panel} className={`modal modal-${size}`} role={role} aria-modal="true" aria-labelledby={titleId} aria-describedby={description ? descriptionId : undefined} onKeyDown={handleKeyDown}>
        <header className="modal-header">
          {icon && <span className={`modal-icon tone-${tone}`} aria-hidden="true">{icon}</span>}
          <div>
            <h2 id={titleId}>{title}</h2>
            {description && <p id={descriptionId}>{description}</p>}
          </div>
          <button type="button" className="icon-button sm" aria-label="Close dialog" disabled={busy} onClick={onClose}><X size={18} /></button>
        </header>
        {children}
      </div>
    </div>
  );
}

export type ConfirmRequest = {
  title: string;
  message: ReactNode;
  confirmLabel: string;
  busyLabel?: string;
  tone?: "danger" | "brand";
  onConfirm: () => Promise<void> | void;
};

/** Asks the user to confirm before an action runs; keeps the dialog open and shows the error if it fails. */
export function ConfirmDialog({ request, onClose }: { request: ConfirmRequest; onClose: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const tone = request.tone ?? "danger";

  async function confirm() {
    setBusy(true);
    setError("");
    try {
      await request.onConfirm();
      onClose();
    } catch (failure) {
      setError(message(failure));
      setBusy(false);
    }
  }

  return (
    <Modal role="alertdialog" size="sm" title={request.title} icon={<AlertTriangle size={22} />} tone={tone} busy={busy} onClose={onClose}>
      <div className="modal-body">
        <div className="confirm-message">{request.message}</div>
        {error && <p className="form-error" role="alert">{error}</p>}
      </div>
      <footer className="modal-footer">
        {/* Cancel is focused first so pressing Enter never confirms by accident. */}
        <button type="button" className="btn btn-secondary" disabled={busy} onClick={onClose} autoFocus>Cancel</button>
        <button type="button" className={`btn ${tone === "danger" ? "btn-danger" : "btn-primary"}`} disabled={busy} onClick={() => void confirm()}>
          {busy ? <><Loader2 size={16} className="spin" aria-hidden="true" />{request.busyLabel ?? "Working…"}</> : request.confirmLabel}
        </button>
      </footer>
    </Modal>
  );
}

export type MenuAction = { label: string; icon?: ReactNode; onSelect: () => void; tone?: "danger"; separatorBefore?: boolean };

/** Kebab menu with keyboard support (arrows, Escape, Tab closes). */
export function ActionMenu({ label, actions, align = "end" }: { label: string; actions: MenuAction[]; align?: "start" | "end" }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const closeOutside = (event: MouseEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", closeOutside);
    root.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
    return () => document.removeEventListener("mousedown", closeOutside);
  }, [open]);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!open || !root.current) return;
    const items = [...root.current.querySelectorAll<HTMLElement>('[role="menuitem"]')];
    const index = items.indexOf(document.activeElement as HTMLElement);
    if (event.key === "Escape") {
      event.stopPropagation();
      setOpen(false);
      root.current.querySelector<HTMLElement>("button")?.focus();
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      items[(index + 1) % items.length]?.focus();
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      items[(index - 1 + items.length) % items.length]?.focus();
    } else if (event.key === "Tab") {
      setOpen(false);
    }
  }

  return (
    <div className="menu" ref={root} onKeyDown={handleKeyDown}>
      <button type="button" className="icon-button sm" aria-label={label} aria-haspopup="menu" aria-expanded={open} aria-controls={open ? menuId : undefined} onClick={() => setOpen(current => !current)}>
        <MoreVertical size={18} />
      </button>
      {open && (
        <div className="menu-popover" role="menu" id={menuId} aria-label={label} data-align={align}>
          {actions.map(action => [
            action.separatorBefore && <div key={`${action.label}-separator`} className="menu-separator" role="separator" />,
            <button key={action.label} type="button" role="menuitem" tabIndex={-1} className={`menu-item${action.tone === "danger" ? " danger" : ""}`} onClick={() => { setOpen(false); action.onSelect(); }}>
              {action.icon}{action.label}
            </button>,
          ])}
        </div>
      )}
    </div>
  );
}
