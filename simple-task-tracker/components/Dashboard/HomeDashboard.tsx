"use client";

import { useEffect, useMemo, useState } from "react";
import Calendar from "./Calendar";
import DashboardHeader from "./DashboardHeader";
import DashboardOverview from "./DashboardOverview";
import DashboardSidebar from "./DashboardSidebar";
import Projects from "./Projects";
import Task from "./Task";
import TaskDialog from "./TaskDialog";
import { demoUserNames, initialProjects, initialTasks } from "./taskData";
import type { DashboardPage, DemoRole, TaskFilter, TaskItem } from "./types";
import { findDemoAccount, getDemoTasks, saveDemoTasks } from "@/lib/demoAccounts";

export default function HomeDashboard({ role = "user" }: { role?: DemoRole }) {
  const [activePage, setActivePage] = useState<DashboardPage>(role === "admin" ? "Admin" : "Projects");
  const projects = initialProjects;
  const [tasks, setTasks] = useState(initialTasks);
  const [tasksReady, setTasksReady] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(role === "admin" ? "admin@gmail.com" : "demo@tasktracker.local");
  const [currentUserName, setCurrentUserName] = useState(demoUserNames[role === "admin" ? "admin@gmail.com" : "demo@tasktracker.local"]);
  const [taskFilter, setTaskFilter] = useState<TaskFilter>("All");
  const [search, setSearch] = useState("");
  const [darkTheme, setDarkTheme] = useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  useEffect(() => {
    const email = role === "admin" ? "admin@gmail.com" : window.sessionStorage.getItem("stt-demo-email") ?? "demo@tasktracker.local";
    const account = findDemoAccount(email);
    setCurrentUserId(email);
    setCurrentUserName(account?.name ?? demoUserNames[email] ?? email);
    setTasks(getDemoTasks(initialTasks));
    setTasksReady(true);
  }, [role]);

  useEffect(() => {
    if (tasksReady) saveDemoTasks(tasks);
  }, [tasks, tasksReady]);

  const roleTasks = useMemo(() => role === "admin" ? tasks : tasks.filter((task) => task.ownerId === currentUserId), [tasks, role, currentUserId]);
  const visibleTasks = useMemo(() => roleTasks.filter((task) => `${task.title} ${task.description}`.toLowerCase().includes(search.toLowerCase())), [roleTasks, search]);

  function openTasks(filter: TaskFilter) {
    setTaskFilter(filter);
    setActivePage("Tasks");
  }

  function changeTaskStatus(taskId: number, status: TaskItem["status"]) {
    setTasks((currentTasks) => currentTasks.map((task) => task.id === taskId ? { ...task, status } : task));
  }

  function createTask(task: TaskItem) {
    setTasks((currentTasks) => [{ ...task, ownerId: currentUserId }, ...currentTasks]);
    setTaskFilter("All");
    setSearch("");
  }

  function renderPage() {
    switch (activePage) {
      case "Admin": return <DashboardOverview projects={projects} tasks={roleTasks} isAdmin onOpenProjects={() => setActivePage("Projects")} onSelectTaskFilter={openTasks} />;
      case "Dashboard": return <DashboardOverview projects={projects} tasks={roleTasks} onOpenProjects={() => setActivePage("Projects")} onSelectTaskFilter={openTasks} />;
      case "Tasks": return <Task tasks={visibleTasks} filter={taskFilter} onFilterChange={setTaskFilter} onStatusChange={changeTaskStatus} showOwners={role === "admin"} />;
      case "Projects": return <Projects tasks={visibleTasks} onStatusChange={changeTaskStatus} showOwners={role === "admin"} />;
      case "Calendar": return <Calendar tasks={roleTasks} />;
    }
  }

  const supportsTaskSearch = activePage === "Tasks" || activePage === "Projects";

  return (
    <main className={`app-shell${darkTheme ? " dark-theme" : ""}`}>
        <DashboardSidebar activePage={activePage} onNavigate={setActivePage} role={role} />
      <section className="main-area">
        <DashboardHeader title={activePage === "Admin" ? "Admin Dashboard" : activePage} userName={currentUserName} onSearch={supportsTaskSearch ? setSearch : undefined} showAddTask onAddTask={() => setTaskDialogOpen(true)} onToggleTheme={() => setDarkTheme((current) => !current)} />
        <div className="page-content">{renderPage()}</div>
      </section>
      {taskDialogOpen && <TaskDialog projects={projects} ownerId={currentUserId} onClose={() => setTaskDialogOpen(false)} onCreate={createTask} />}
    </main>
  );
}
