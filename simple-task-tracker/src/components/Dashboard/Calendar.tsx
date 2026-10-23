"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
  const today = new Date();
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
      <div className="calendar-grid">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => <div className="calendar-day-name" key={day}>{day}</div>)}
        {Array.from({ length: cellCount }, (_, index) => {
          const day = index - firstWeekday + 1;
          const inMonth = day > 0 && day <= daysInMonth;
          const date = inMonth ? dateKey(month.getFullYear(), month.getMonth(), day) : "";
          const dayTasks = inMonth ? tasks.filter((task) => task.dueDate?.slice(0, 10) === date) : [];
          const isToday = inMonth && isCurrentMonth && day === today.getDate();
          return <button className={`calendar-cell${inMonth ? "" : " outside"}${isToday ? " today" : ""}${selectedDate === date ? " selected" : ""}`} key={index} disabled={!inMonth} onClick={() => setSelectedDate(date)}><span>{inMonth ? day : ""}</span>{dayTasks.slice(0, 2).map((task) => <small key={task.id} title={task.title}>{task.title}</small>)}{dayTasks.length > 2 && <em>+{dayTasks.length - 2} more</em>}</button>;
        })}
      </div>
      {selectedDate && <div className="calendar-selection"><div className="list-heading"><div><h3>{new Date(`${selectedDate}T00:00:00`).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</h3><p>{selectedTasks.length} {selectedTasks.length === 1 ? "task" : "tasks"}</p></div></div>{selectedTasks.length ? selectedTasks.map((task) => <div className="task-row" key={task.id}><span className={`status-dot ${task.status.toLowerCase().replace(" ", "-")}`} /><div className="task-row-copy"><h3>{task.title}</h3><p>{task.description || "No description"}</p></div><span className="status-label">{task.status}</span></div>) : <p className="empty-state">No tasks due on this date.</p>}</div>}
    </section>
  );
}
