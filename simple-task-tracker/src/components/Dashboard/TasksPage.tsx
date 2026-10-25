"use client";

import { useMemo, useState } from "react";
import { ArrowDownUp, CheckCheck, ClipboardList, Columns3, Eye, FolderOpen, List, PencilLine, Search, SearchX, Trash2 } from "lucide-react";
import CreatorBadge from "./CreatorBadge";
import DeadlineBadge from "./DeadlineBadge";
import TaskBoard from "./TaskBoard";
import { formatDate, isOverdue, plural, statusSlug, todayKey } from "./format";
import { ActionMenu, EmptyState, PageHeader, StatusBadge } from "./ui";
import { TASK_STATUSES, type ProjectItem, type TaskFilter, type TaskItem, type TaskStatus } from "./types";

const PAGE_SIZE = 8;
type SortKey = "title" | "due" | "created";

type Props = {
  tasks: TaskItem[];
  projects: ProjectItem[];
  isAdmin: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  filter: TaskFilter;
  onFilterChange: (filter: TaskFilter) => void;
  /** Members add tasks from inside a project; this takes them there. */
  onOpenProjects?: () => void;
  onEditTask: (task: TaskItem) => void;
  onDeleteTasks: (tasks: TaskItem[]) => void;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onBulkStatus: (tasks: TaskItem[], status: TaskStatus) => void;
};

const FILTER_LABELS: Record<TaskFilter, string> = { All: "All statuses", Pending: "Pending", "In Progress": "In Progress", Done: "Done", Overdue: "Overdue", Today: "Due today" };

export default function TasksPage({ tasks, projects, isAdmin, search, onSearchChange, filter, onFilterChange, onOpenProjects, onEditTask, onDeleteTasks, onStatusChange, onBulkStatus }: Props) {
  const [projectFilter, setProjectFilter] = useState("");
  const [ownerFilter, setOwnerFilter] = useState("");
  const [view, setView] = useState<"list" | "board">("list");
  const [sort, setSort] = useState<{ key: SortKey; ascending: boolean }>({ key: "due", ascending: true });
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const projectName = useMemo(() => new Map(projects.map(project => [project.id, project.name])), [projects]);
  const owners = useMemo(() => {
    const seen = new Map<string, string>();
    for (const task of tasks) if (task.creator) seen.set(task.creator.user_id, task.creator.full_name);
    return [...seen].sort((a, b) => a[1].localeCompare(b[1]));
  }, [tasks]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const today = todayKey();
    const matches = tasks.filter(task => {
      if (query && !`${task.title} ${task.description} ${projectName.get(task.projectId) ?? ""}`.toLowerCase().includes(query)) return false;
      if (projectFilter && task.projectId !== projectFilter) return false;
      if (ownerFilter && task.creator?.user_id !== ownerFilter) return false;
      if (filter === "Overdue") return isOverdue(task);
      if (filter === "Today") return task.dueDate?.slice(0, 10) === today;
      return filter === "All" || task.status === filter;
    });
    const direction = sort.ascending ? 1 : -1;
    return matches.sort((a, b) => {
      if (sort.key === "title") return a.title.localeCompare(b.title) * direction;
      const key = sort.key === "due" ? "dueDate" : "createdAt";
      // Undated tasks always sink to the bottom, whichever way the column is sorted.
      if (!a[key] || !b[key]) return a[key] ? -1 : b[key] ? 1 : 0;
      return a[key]!.localeCompare(b[key]!) * direction;
    });
  }, [tasks, search, projectFilter, ownerFilter, filter, sort, projectName]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageTasks = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const selected = tasks.filter(task => selectedIds.has(task.id) && task.canEdit);
  const selectablePage = pageTasks.filter(task => task.canEdit);
  const allPageSelected = selectablePage.length > 0 && selectablePage.every(task => selectedIds.has(task.id));
  const somePageSelected = selectablePage.some(task => selectedIds.has(task.id));
  const filtersActive = Boolean(search || projectFilter || ownerFilter || filter !== "All");

  function resetPage<T>(setter: (value: T) => void) {
    return (value: T) => { setter(value); setPage(1); };
  }
  function toggle(id: string) {
    setSelectedIds(current => { const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  }
  function togglePage() {
    setSelectedIds(current => {
      const next = new Set(current);
      for (const task of selectablePage) { if (allPageSelected) next.delete(task.id); else next.add(task.id); }
      return next;
    });
  }
  function sortBy(key: SortKey) {
    setSort(current => ({ key, ascending: current.key === key ? !current.ascending : true }));
  }
  function clearFilters() {
    onSearchChange(""); setProjectFilter(""); setOwnerFilter(""); onFilterChange("All"); setPage(1);
  }
  const ariaSort = (key: SortKey) => (sort.key === key ? (sort.ascending ? "ascending" : "descending") : "none");

  return (
    <>
      <PageHeader
        trail={["Workspace", "Tasks"]}
        title={isAdmin ? "All Tasks" : "My Tasks"}
        description={isAdmin ? "Manage work across the team. Tasks in other members' projects are view only." : "Every task across your projects. To add a task, open the project it belongs to."}
        actions={onOpenProjects && <button type="button" className="btn btn-secondary btn-lg" onClick={onOpenProjects}><FolderOpen size={18} />Open projects</button>}
      />

      {!tasks.length ? (
        <EmptyState icon={<ClipboardList size={26} />} title="No tasks yet"
          action={onOpenProjects && <button type="button" className="btn btn-primary" onClick={onOpenProjects}><FolderOpen size={17} />Go to projects</button>}>
          {isAdmin ? "Tasks created by members will appear here." : "Tasks are created inside projects. Open one of your projects and add a task to its board."}
        </EmptyState>
      ) : (
        <>
          <div className="toolbar" role="search" aria-label="Filter tasks">
            <label className="input-with-icon">
              <Search size={17} aria-hidden="true" />
              <span className="sr-only">Search tasks</span>
              <input className="input" type="search" placeholder="Search tasks…" value={search} onChange={event => { onSearchChange(event.target.value); setPage(1); }} />
            </label>
            <select className="select" aria-label="Filter by project" value={projectFilter} onChange={event => resetPage(setProjectFilter)(event.target.value)}>
              <option value="">All projects</option>
              {projects.map(project => <option key={project.id} value={project.id}>{project.name}</option>)}
            </select>
            {isAdmin && (
              <select className="select" aria-label="Filter by owner" value={ownerFilter} onChange={event => resetPage(setOwnerFilter)(event.target.value)}>
                <option value="">All owners</option>
                {owners.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
              </select>
            )}
            <select className="select" aria-label="Filter by status" value={filter} onChange={event => { onFilterChange(event.target.value as TaskFilter); setPage(1); }}>
              {(Object.keys(FILTER_LABELS) as TaskFilter[]).map(option => <option key={option} value={option}>{FILTER_LABELS[option]}</option>)}
            </select>
            {filtersActive && <button type="button" className="btn btn-ghost btn-sm" onClick={clearFilters}>Clear filters</button>}
            <span className="toolbar-spacer" />
            <div className="segmented" role="group" aria-label="Task view">
              <button type="button" aria-pressed={view === "board"} onClick={() => setView("board")}><Columns3 size={16} aria-hidden="true" />Board</button>
              <button type="button" aria-pressed={view === "list"} onClick={() => setView("list")}><List size={16} aria-hidden="true" />List</button>
            </div>
          </div>

          {selected.length > 0 && view === "list" && (
            <div className="bulk-bar" role="region" aria-label="Bulk actions">
              <span>{plural(selected.length, "task")} selected</span>
              <span className="bulk-spacer" />
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => { onBulkStatus(selected, "Done"); setSelectedIds(new Set()); }}><CheckCheck size={16} />Mark as done</button>
              <button type="button" className="btn btn-danger btn-sm" onClick={() => onDeleteTasks(selected)}><Trash2 size={16} />Delete</button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSelectedIds(new Set())}>Clear selection</button>
            </div>
          )}

          {!filtered.length ? (
            <EmptyState icon={<SearchX size={26} />} title="No tasks match your filters"
              action={<button type="button" className="btn btn-secondary" onClick={clearFilters}>Clear filters</button>}>
              Try a different search term or remove some filters.
            </EmptyState>
          ) : view === "board" ? (
            <TaskBoard tasks={filtered} projects={projects} onStatusChange={onStatusChange} onEdit={onEditTask} onDelete={task => onDeleteTasks([task])} />
          ) : (
            <>
              <table className="task-table">
                <caption className="sr-only">{FILTER_LABELS[filter]} — {plural(filtered.length, "task")}</caption>
                <thead>
                  <tr>
                    <th scope="col" className="col-check">
                      <input type="checkbox" className="checkbox" aria-label="Select all tasks on this page" checked={allPageSelected} disabled={!selectablePage.length}
                        ref={node => { if (node) node.indeterminate = somePageSelected && !allPageSelected; }} onChange={togglePage} />
                    </th>
                    <th scope="col" aria-sort={ariaSort("title")}><button type="button" className="sort-button" onClick={() => sortBy("title")}>Task<ArrowDownUp size={14} aria-hidden="true" /></button></th>
                    <th scope="col">Project</th>
                    <th scope="col">Owner</th>
                    <th scope="col" aria-sort={ariaSort("due")}><button type="button" className="sort-button" onClick={() => sortBy("due")}>Due date<ArrowDownUp size={14} aria-hidden="true" /></button></th>
                    <th scope="col">Status</th>
                    <th scope="col" className="col-created" aria-sort={ariaSort("created")}><button type="button" className="sort-button" onClick={() => sortBy("created")}>Created<ArrowDownUp size={14} aria-hidden="true" /></button></th>
                    <th scope="col"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  {pageTasks.map(task => (
                    <tr key={task.id} className={selectedIds.has(task.id) ? "is-selected" : undefined}>
                      <td className="col-check">
                        <input type="checkbox" className="checkbox" aria-label={`Select ${task.title}`} disabled={!task.canEdit} checked={selectedIds.has(task.id)} onChange={() => toggle(task.id)} />
                      </td>
                      <td className="col-task">
                        <h3 className="task-title">{task.title}</h3>
                        {task.description && <p className="task-desc">{task.description}</p>}
                      </td>
                      <td data-label="Project">{projectName.get(task.projectId) ?? "—"}</td>
                      <td data-label="Owner"><CreatorBadge creator={task.creator} size={26} /></td>
                      <td data-label="Due date">
                        <span className="cell-stack">
                          {task.dueDate ? <time dateTime={task.dueDate}>{formatDate(task.dueDate)}</time> : <span aria-label="No due date">—</span>}
                          <DeadlineBadge task={task} />
                        </span>
                      </td>
                      <td data-label="Status">
                        {task.canEdit
                          ? <select className={`status-select status-${statusSlug(task.status)}`} aria-label={`Change status of ${task.title}`} value={task.status} onChange={event => onStatusChange(task.id, event.target.value as TaskStatus)}>
                              {TASK_STATUSES.map(status => <option key={status}>{status}</option>)}
                            </select>
                          : <StatusBadge status={task.status} />}
                      </td>
                      <td className="col-created" data-label="Created">{formatDate(task.createdAt)}</td>
                      <td className="col-actions">
                        {task.canEdit ? (
                          <div className="row-actions">
                            <button type="button" className="icon-button sm" aria-label={`Edit ${task.title}`} onClick={() => onEditTask(task)}><PencilLine size={17} /></button>
                            <ActionMenu label={`More actions for ${task.title}`} actions={[
                              ...TASK_STATUSES.filter(status => status !== task.status).map(status => ({ label: `Mark as ${status.toLowerCase()}`, onSelect: () => onStatusChange(task.id, status) })),
                              { label: "Delete task", icon: <Trash2 size={16} />, tone: "danger" as const, separatorBefore: true, onSelect: () => onDeleteTasks([task]) },
                            ]} />
                          </div>
                        ) : <span className="read-only-note" title="Only the project owner can change this task"><Eye size={14} aria-hidden="true" />View only</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="pagination">
                <p aria-live="polite">Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} of {plural(filtered.length, "task")}</p>
                {pageCount > 1 && (
                  <nav aria-label="Pagination">
                    <button type="button" className="btn btn-outline-brand" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>Previous</button>
                    {Array.from({ length: pageCount }, (_, index) => index + 1).map(number => (
                      <button type="button" key={number} className="page-number" aria-current={number === currentPage ? "page" : undefined} aria-label={`Page ${number}`} onClick={() => setPage(number)}>{number}</button>
                    ))}
                    <button type="button" className="btn btn-outline-brand" disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)}>Next</button>
                  </nav>
                )}
              </div>
            </>
          )}
        </>
      )}
    </>
  );
}
