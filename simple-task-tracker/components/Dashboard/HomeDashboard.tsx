"use client";

import { useMemo, useState } from "react";
import Calendar from "./Calendar";
import DashboardHeader from "./DashboardHeader";
import DashboardOverview from "./DashboardOverview";
import DashboardSidebar from "./DashboardSidebar";
import Projects from "./Projects";
import Settings from "./Settings";
import Task from "./Task";
import { initialProjects, initialTasks } from "./taskData";
import type { DashboardPage, TaskFilter, TaskItem } from "./types";

export default function HomeDashboard() {
  const [activePage, setActivePage] = useState<DashboardPage>("Projects");
  const projects = initialProjects;
  const [tasks, setTasks] = useState(initialTasks);
  const [taskFilter, setTaskFilter] = useState<TaskFilter>("All");
  const [search, setSearch] = useState("");
  const [darkTheme, setDarkTheme] = useState(false);
  const visibleTasks = useMemo(() => tasks.filter((task) => `${task.title} ${task.description}`.toLowerCase().includes(search.toLowerCase())), [tasks, search]);

  function openTasks(filter: TaskFilter) {
    setTaskFilter(filter);
    setActivePage("Tasks");
  }

  function changeTaskStatus(taskId: number, status: TaskItem["status"]) {
    setTasks((currentTasks) => currentTasks.map((task) => task.id === taskId ? { ...task, status } : task));
  }

  function renderPage() {
    switch (activePage) {
      case "Dashboard": return <DashboardOverview projects={projects} tasks={tasks} onOpenProjects={() => setActivePage("Projects")} onSelectTaskFilter={openTasks} dataReady={false} />;
      case "Tasks": return <Task tasks={visibleTasks} filter={taskFilter} onFilterChange={setTaskFilter} dataReady={false} />;
      case "Projects": return <Projects tasks={tasks} onStatusChange={changeTaskStatus} />;
      case "Calendar": return <Calendar />;
      case "Settings": return <Settings darkTheme={darkTheme} onThemeChange={setDarkTheme} />;
    }
  }

  const supportsTaskActions = activePage === "Tasks" || activePage === "Projects";
  const supportsTaskSearch = activePage === "Tasks";

  return (
    <main className={`app-shell${darkTheme ? " dark-theme" : ""}`}>
      <DashboardSidebar activePage={activePage} onNavigate={setActivePage} />
      <section className="main-area">
        <DashboardHeader title={activePage} onSearch={supportsTaskSearch ? setSearch : undefined} showAddTask={supportsTaskActions} dataReady={false} onToggleTheme={() => setDarkTheme((current) => !current)} />
        <div className="page-content">{renderPage()}</div>
      </section>
    </main>
  );
}
