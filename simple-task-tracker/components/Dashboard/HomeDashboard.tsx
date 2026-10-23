"use client";

import { useMemo, useState } from "react";
import Calendar from "./Calendar";
import DashboardHeader from "./DashboardHeader";
import DashboardOverview from "./DashboardOverview";
import DashboardSidebar from "./DashboardSidebar";
import Projects from "./Projects";
import Settings from "./Settings";
import Task from "./Task";
import TaskDialog from "./TaskDialog";
import { initialProjects, initialTasks } from "./taskData";
import type { DashboardPage, TaskFilter, TaskItem } from "./types";

export default function HomeDashboard() {
  const [activePage, setActivePage] = useState<DashboardPage>("Projects");
  const [projects, setProjects] = useState(initialProjects);
  const [tasks, setTasks] = useState(initialTasks);
  const [taskFilter, setTaskFilter] = useState<TaskFilter>("All");
  const [search, setSearch] = useState("");
  const [darkTheme, setDarkTheme] = useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const visibleTasks = useMemo(() => tasks.filter((task) => `${task.title} ${task.description}`.toLowerCase().includes(search.toLowerCase())), [tasks, search]);

  function openTasks(filter: TaskFilter) {
    setTaskFilter(filter);
    setActivePage("Tasks");
  }

  function changeTaskStatus(taskId: number, status: TaskItem["status"]) {
    setTasks((currentTasks) => currentTasks.map((task) => task.id === taskId ? { ...task, status } : task));
  }

  function createTask(task: TaskItem) {
    setTasks((currentTasks) => [task, ...currentTasks]);
    setTaskFilter("All");
    setSearch("");
  }

  function renderPage() {
    switch (activePage) {
      case "Dashboard": return <DashboardOverview projects={projects} tasks={tasks} onOpenProjects={() => setActivePage("Projects")} onSelectTaskFilter={openTasks} />;
      case "Tasks": return <Task tasks={visibleTasks} filter={taskFilter} onFilterChange={setTaskFilter} onStatusChange={changeTaskStatus} />;
      case "Projects": return <Projects projects={projects} tasks={visibleTasks} onCreateProject={(project) => setProjects((current) => [...current, project])} onStatusChange={changeTaskStatus} />;
      case "Calendar": return <Calendar tasks={tasks} />;
      case "Settings": return <Settings darkTheme={darkTheme} onThemeChange={setDarkTheme} />;
    }
  }

  const supportsTaskActions = activePage !== "Settings";
  const supportsTaskSearch = activePage === "Tasks" || activePage === "Projects";

  return (
    <main className={`app-shell${darkTheme ? " dark-theme" : ""}`}>
      <DashboardSidebar activePage={activePage} onNavigate={setActivePage} />
      <section className="main-area">
        <DashboardHeader title={activePage} onSearch={supportsTaskSearch ? setSearch : undefined} showAddTask={supportsTaskActions} onAddTask={() => setTaskDialogOpen(true)} onToggleTheme={() => setDarkTheme((current) => !current)} onOpenSettings={() => setActivePage("Settings")} />
        <div className="page-content">{renderPage()}</div>
      </section>
      {taskDialogOpen && <TaskDialog projects={projects} onClose={() => setTaskDialogOpen(false)} onCreate={createTask} />}
    </main>
  );
}
