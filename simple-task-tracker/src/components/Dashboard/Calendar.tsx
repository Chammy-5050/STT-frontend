"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import DeadlineBadge from "./DeadlineBadge";
import { deadlineFor } from "./deadlines";
import type { TaskItem } from "./types";

type Props = { tasks: TaskItem[] };

function dateKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export default function Calendar({ tasks }: Props) {
  const [month, setMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const firstWeekday = (month.getDay() + 6) % 7;
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cellCount = Math.ceil((firstWeekday + daysInMonth) / 7) * 7;
  const [today, setToday] = useState(() => new Date());
  useEffect(() => { const timer = window.setInterval(() => setToday(new Date()), 60000); return () => window.clearInterval(timer); }, []);
  const urgentTasks = tasks.filter(task => deadlineFor(task, today)).sort((a, b) => (a.dueDate || "").localeCompare(b.dueDate || ""));
  const isCurrentMonth = today.getFullYear() === month.getFullYear() && today.getMonth() === month.getMonth();
  const selectedTasks = selectedDate ? tasks.filter((task) => task.dueDate?.slice(0, 10) === selectedDate) : [];

  function changeMonth(offset: number) {
    setMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
    setSelectedDate(null);
  }

  return (
    <section className="content-panel calendar-panel">
      <div className="list-heading">
        <div><h2>{month.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</h2><p>Click a date to view its tasks.</p></div>
        <div className="calendar-controls"><button className="cancel-button" onClick={() => { setMonth(new Date(today.getFullYear(), today.getMonth(), 1)); setSelectedDate(null); }}>Today</button><button className="icon-button" aria-label="Previous month" onClick={() => changeMonth(-1)}><ChevronLeft size={17} /></button><button className="icon-button" aria-label="Next month" onClick={() => changeMonth(1)}><ChevronRight size={17} /></button></div>
      </div>
      <section className="calendar-deadlines" aria-label="Task deadline reminders">
        <h3>Upcoming and overdue</h3>
        <p>Unfinished tasks due within three days or already overdue.</p>
        {urgentTasks.length ? <ul>{urgentTasks.map(task => <li key={task.id}>
          <button onClick={() => { const [year, month, day] = task.dueDate!.slice(0, 10).split("-").map(Number); setMonth(new Date(year, month - 1, 1)); setSelectedDate(dateKey(year, month - 1, day)); }}>{task.title}</button>
          <time dateTime={task.dueDate}>{task.dueDate?.slice(0, 10)}</time>
          <DeadlineBadge task={task} today={today} />
        </li>)}</ul> : <p className="empty-state">No unfinished tasks are due soon or overdue.</p>}
      </section>
      <div className="calendar-grid">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => <div className="calendar-day-name" key={day}>{day}</div>)}
        {Array.from({ length: cellCount }, (_, index) => {
          const day = index - firstWeekday + 1;
          const inMonth = day > 0 && day <= daysInMonth;
          const date = inMonth ? dateKey(month.getFullYear(), month.getMonth(), day) : "";
          const dayTasks = inMonth ? tasks.filter((task) => task.dueDate?.slice(0, 10) === date) : [];
          const isToday = inMonth && isCurrentMonth && day === today.getDate();
          return <button className={`calendar-cell${inMonth ? "" : " outside"}${isToday ? " today" : ""}${selectedDate === date ? " selected" : ""}`} key={index} disabled={!inMonth} onClick={() => setSelectedDate(date)}><span>{inMonth ? day : ""}</span>{dayTasks.slice(0, 2).map((task) => <small key={task.id} className={deadlineFor(task, today) ? `calendar-task deadline-${deadlineFor(task, today)!.kind}` : "calendar-task"} title={`${task.title} · ${deadlineFor(task, today)?.label || task.status}`}>{task.title}{deadlineFor(task, today) && <span> · {deadlineFor(task, today)!.label}</span>}</small>)}{dayTasks.length > 2 && <em>+{dayTasks.length - 2} more</em>}</button>;
        })}
      </div>
      {selectedDate && <div className="calendar-selection"><div className="list-heading"><div><h3>{new Date(`${selectedDate}T00:00:00`).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</h3><p>{selectedTasks.length} {selectedTasks.length === 1 ? "task" : "tasks"}</p></div></div>{selectedTasks.length ? selectedTasks.map((task) => <div className="task-row" key={task.id}><span className={`status-dot ${task.status.toLowerCase().replace(" ", "-")}`} /><div className="task-row-copy"><h3>{task.title}</h3><p>{task.description || "No description"}</p></div><DeadlineBadge task={task} today={today} /><span className="status-label">{task.status}</span></div>) : <p className="empty-state">No tasks due on this date.</p>}</div>}
    </section>
  );
}
