"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Calendar() {
  const [month, setMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const firstWeekday = (month.getDay() + 6) % 7;
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cellCount = Math.ceil((firstWeekday + daysInMonth) / 7) * 7;
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === month.getFullYear() && today.getMonth() === month.getMonth();

  function changeMonth(offset: number) {
    setMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  }

  return (
    <section className="content-panel calendar-panel">
      <div className="list-heading">
        <div><h2>{month.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</h2><p>Task dates will appear when the calendar API is connected.</p></div>
        <div className="calendar-controls"><button className="cancel-button" onClick={() => setMonth(new Date(today.getFullYear(), today.getMonth(), 1))}>Today</button><button className="icon-button" aria-label="Previous month" onClick={() => changeMonth(-1)}><ChevronLeft size={17} /></button><button className="icon-button" aria-label="Next month" onClick={() => changeMonth(1)}><ChevronRight size={17} /></button></div>
      </div>
      <div className="calendar-grid">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => <div className="calendar-day-name" key={day}>{day}</div>)}
        {Array.from({ length: cellCount }, (_, index) => {
          const day = index - firstWeekday + 1;
          const inMonth = day > 0 && day <= daysInMonth;
          const isToday = inMonth && isCurrentMonth && day === today.getDate();
          return <div className={`calendar-cell${inMonth ? "" : " outside"}${isToday ? " today" : ""}`} key={index}>{inMonth && <span>{day}</span>}</div>;
        })}
      </div>
      <p className="empty-state">No calendar events are loaded. Task and deadline events will appear here when the API is available.</p>
    </section>
  );
}

