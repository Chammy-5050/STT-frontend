"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import DeadlineBadge from "./DeadlineBadge";
import { deadlineFor, localDateKey } from "./deadlines";
import { formatDate, plural } from "./format";
import { PageHeader, StatusBadge } from "./ui";
import type { TaskItem } from "./types";

type Props = { tasks: TaskItem[] };

function dateKey(year: number, month: number, day: number) {
  return localDateKey(new Date(year, month, day));
}

export default function Calendar({ tasks }: Props) {
  const [month, setMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [today, setToday] = useState(() => new Date());
  useEffect(() => { const timer = window.setInterval(() => setToday(new Date()), 60000); return () => window.clearInterval(timer); }, []);

  const firstWeekday = (month.getDay() + 6) % 7;
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cellCount = Math.ceil((firstWeekday + daysInMonth) / 7) * 7;
  const urgentTasks = tasks.filter(task => deadlineFor(task, today)).sort((a, b) => (a.dueDate || "").localeCompare(b.dueDate || ""));
  const isCurrentMonth = today.getFullYear() === month.getFullYear() && today.getMonth() === month.getMonth();
  const selectedTasks = selectedDate ? tasks.filter(task => task.dueDate?.slice(0, 10) === selectedDate) : [];
  const monthLabel = month.toLocaleDateString("en-GB", { month: "long", year: "numeric" });

  function changeMonth(offset: number) {
    setMonth(current => new Date(current.getFullYear(), current.getMonth() + offset, 1));
    setSelectedDate(null);
  }

  function jumpTo(task: TaskItem) {
    const [year, monthNumber, day] = task.dueDate!.slice(0, 10).split("-").map(Number);
    setMonth(new Date(year, monthNumber - 1, 1));
    setSelectedDate(dateKey(year, monthNumber - 1, day));
  }

  return (
    <>
      <PageHeader trail={["Workspace", "Calendar"]} title="Calendar" description="See due dates at a glance. Select a day to list its tasks." />
      <div className="calendar-layout">
        <section className="panel calendar-panel" aria-label={`Calendar for ${monthLabel}`}>
          <div className="panel-header">
            <div><h2 aria-live="polite">{monthLabel}</h2><p>{plural(tasks.filter(task => task.dueDate?.startsWith(dateKey(month.getFullYear(), month.getMonth(), 1).slice(0, 7))).length, "task")} due this month</p></div>
            <div className="calendar-controls">
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => { setMonth(new Date(today.getFullYear(), today.getMonth(), 1)); setSelectedDate(localDateKey(today)); }}>Today</button>
              <button type="button" className="icon-button" aria-label="Previous month" onClick={() => changeMonth(-1)}><ChevronLeft size={18} /></button>
              <button type="button" className="icon-button" aria-label="Next month" onClick={() => changeMonth(1)}><ChevronRight size={18} /></button>
            </div>
          </div>
          <div className="calendar-grid">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(day => <div className="calendar-day-name" key={day} aria-hidden="true">{day}</div>)}
            {Array.from({ length: cellCount }, (_, index) => {
              const day = index - firstWeekday + 1;
              const inMonth = day > 0 && day <= daysInMonth;
              const date = inMonth ? dateKey(month.getFullYear(), month.getMonth(), day) : "";
              const dayTasks = inMonth ? tasks.filter(task => task.dueDate?.slice(0, 10) === date) : [];
              const isToday = inMonth && isCurrentMonth && day === today.getDate();
              return (
                <button type="button" key={index} disabled={!inMonth} onClick={() => setSelectedDate(date)}
                  className={`calendar-cell${inMonth ? "" : " outside"}${isToday ? " today" : ""}${selectedDate === date && inMonth ? " selected" : ""}`}
                  aria-label={inMonth ? `${formatDate(date)}${isToday ? ", today" : ""}: ${plural(dayTasks.length, "task")}` : undefined}
                  aria-pressed={inMonth ? selectedDate === date : undefined}>
                  <span className="day-number" aria-hidden="true">{inMonth ? day : ""}</span>
                  {dayTasks.slice(0, 2).map(task => {
                    const deadline = deadlineFor(task, today);
                    return (
                      <small key={task.id} title={`${task.title} · ${deadline?.label || task.status}`}
                        className={`calendar-task${deadline ? ` deadline-${deadline.kind}` : ""}${task.status === "Done" ? " is-done" : ""}`}>
                        {task.title}{deadline && <span> · {deadline.label}</span>}
                      </small>
                    );
                  })}
                  {dayTasks.length > 2 && <em>+{dayTasks.length - 2} more</em>}
                  {dayTasks.length > 0 && <span className="calendar-dots" aria-hidden="true">{dayTasks.slice(0, 3).map(task => <i key={task.id} />)}</span>}
                </button>
              );
            })}
          </div>
        </section>

        <div className="calendar-side">
          {selectedDate && (
            <section className="panel calendar-selection" aria-label="Selected day">
              <div className="panel-header">
                <div><h2>{new Date(`${selectedDate}T00:00:00`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}</h2><p>{plural(selectedTasks.length, "task")} due</p></div>
              </div>
              {selectedTasks.length ? (
                <ul>
                  {selectedTasks.map(task => (
                    <li key={task.id}>
                      <div><h4>{task.title}</h4><p>{task.description || "No description"}</p></div>
                      <DeadlineBadge task={task} today={today} />
                      <StatusBadge status={task.status} />
                    </li>
                  ))}
                </ul>
              ) : <p className="empty-inline">No tasks due on this date.</p>}
            </section>
          )}
          <section className="panel calendar-deadlines" aria-label="Task deadline reminders">
            <div className="panel-header"><div><h2>Upcoming and overdue</h2><p>Unfinished tasks due within three days or already overdue.</p></div></div>
            {urgentTasks.length ? (
              <ul>
                {urgentTasks.map(task => (
                  <li key={task.id}>
                    <button type="button" onClick={() => jumpTo(task)}>{task.title}</button>
                    <time dateTime={task.dueDate}>{formatDate(task.dueDate)}</time>
                    <DeadlineBadge task={task} today={today} />
                  </li>
                ))}
              </ul>
            ) : <p className="empty-inline">No unfinished tasks are due soon or overdue.</p>}
          </section>
        </div>
      </div>
    </>
  );
}
