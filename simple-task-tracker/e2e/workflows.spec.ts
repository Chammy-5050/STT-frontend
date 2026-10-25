import { test, expect, type Page } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { baseURL } from "../playwright.config";

const runId = randomUUID().replaceAll("-", "").slice(0, 12);
const memberEmail = `e2e_${runId}_member@example.test`;
const adminEmail = `e2e_${runId}_admin@example.test`;
const managedEmail = `e2e_${runId}_managed@example.test`;
const password = `Browser!${randomUUID()}927`;
const updatedPassword = `Updated!${randomUUID()}927`;
const projectName = `Browser project ${runId}`;
const taskName = `Browser task ${runId}`;
const throwawayTask = `Throwaway ${runId}`;
const api = "http://localhost:8001/api";
// Mailpit, started by the backend's docker-compose, receives every email the backend sends.
const mailpit = process.env.E2E_MAILPIT_URL ?? "http://localhost:8025";
const resetEmail = `e2e_${runId}_reset@example.test`;
const home = `${baseURL}/`;
const backend = path.resolve(process.cwd(), "../../Simple-Task-Tracker");
test.describe.configure({ mode: "serial" });

function django(code: string) {
  return execFileSync("docker", ["compose", "exec", "-T", "web", "python", "-"], {
    cwd: backend, encoding: "utf8",
    input: `import os\nos.environ.setdefault('DJANGO_SETTINGS_MODULE', 'taskTracker.settings')\nimport django\ndjango.setup()\n${code}`,
  });
}

/** Waits for the newest email to `to` with `subject` and returns the 6-digit code in it. */
async function emailedCode(to: string, subject: string) {
  const query = encodeURIComponent(`to:"${to}" subject:"${subject}"`);
  for (let attempt = 0; attempt < 40; attempt++) {
    const found = await (await fetch(`${mailpit}/api/v1/search?query=${query}`)).json();
    const latest = found.messages?.[0];
    if (latest) {
      const message = await (await fetch(`${mailpit}/api/v1/message/${latest.ID}`)).json();
      const code = /\b(\d{6})\b/.exec(message.Text)?.[1];
      if (code) return { code, id: latest.ID as string };
    }
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  throw new Error(`No "${subject}" email reached ${to}`);
}

async function enterCode(page: Page, code: string) {
  await page.getByLabel("Digit 1 of 6").fill(code);
}

/** Navigates with the sidebar, opening it first on narrow screens. */
async function go(page: Page, name: string) {
  const menu = page.getByRole("button", { name: "Open navigation" });
  if (await menu.isVisible()) await menu.click();
  await page.getByRole("complementary", { name: "Sidebar" }).getByRole("button", { name, exact: true }).click();
}

async function signIn(page: Page, email: string, secret: string) {
  await page.goto("/login");
  await page.getByPlaceholder("Enter email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(secret);
  await page.getByRole("button", { name: "Sign In", exact: true }).click();
  await expect(page).toHaveURL(home);
}

test.beforeAll(() => {
  // Start with empty rate-limit counters so repeated local runs aren't throttled.
  django(`from django.core.cache import cache\ncache.clear()\n`);
  django(`from django.contrib.auth import get_user_model\nget_user_model().objects.create_user(email=${JSON.stringify(resetEmail)}, password=${JSON.stringify(password)}, full_name='Reset Member', phone_no='+255700009998')\n`);
  django(`from django.contrib.auth import get_user_model\nget_user_model().objects.create_superuser(email=${JSON.stringify(adminEmail)}, password=${JSON.stringify(password)}, full_name='Browser Test Admin', phone_no='+255700009999')\n`);
});

test.afterAll(() => {
  // Remove only accounts and work records created by this uniquely identified run.
  django(`from django.contrib.auth import get_user_model\nfrom STT.models import Projects, Tasks\nemails = ${JSON.stringify([memberEmail, adminEmail, managedEmail, resetEmail])}\naccounts = get_user_model().objects.filter(email__in=emails)\nTasks.objects.filter(project_id__user_id__in=accounts).delete()\nProjects.objects.filter(user_id__in=accounts).delete()\nfor account in accounts:\n    if account.profile_picture:\n        account.profile_picture.delete(save=False)\naccounts.delete()\n`);
});

test("member registers, manages projects and tasks with confirmations, updates profile and signs out", async ({ page }) => {
  const failures: string[] = [];
  page.on("pageerror", error => failures.push(error.message));
  await page.goto("/register");
  await page.getByLabel("Full name", { exact: true }).fill("Browser Member");
  await page.getByLabel("Email address", { exact: true }).fill(memberEmail);
  await page.getByLabel("Phone number", { exact: true }).fill("+255700000100");
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Confirm password", { exact: true }).fill(password);
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Create Account", exact: true }).click();

  // New accounts confirm their email with a code before they can sign in.
  await expect(page).toHaveURL(/\/verify-email$/);
  await expect(page.getByRole("heading", { name: "Verify your email" })).toBeVisible();
  await expect(page.getByText(`${memberEmail[0]}***@example.test`)).toBeVisible();
  const { code: verifyCode } = await emailedCode(memberEmail, "Verify your email");
  // Signing in before verifying leads back to the code screen.
  await page.getByRole("button", { name: "Back to Sign In" }).click();
  await page.getByLabel("Email", { exact: true }).fill(memberEmail);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign In", exact: true }).click();
  await expect(page).toHaveURL(/\/verify-email$/);
  await enterCode(page, verifyCode === "000000" ? "111111" : "000000");
  await expect(page.getByText(/That code is incorrect or has expired/)).toBeVisible();
  await enterCode(page, verifyCode);
  await expect(page.getByRole("heading", { name: "Email verified" })).toBeVisible();
  await page.getByRole("button", { name: "Continue to Sign In" }).click();
  await expect(page.getByLabel("Email", { exact: true })).toHaveValue(memberEmail);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign In", exact: true }).click();
  await expect(page.getByText("You are signed in")).toBeVisible();
  await expect(page).toHaveURL(home);
  await expect(page.getByRole("heading", { name: /, Browser$/ })).toBeVisible();
  await expect(page.getByText("Welcome to Task Tracker")).toBeVisible();

  // Create, then edit a project.
  await go(page, "Projects");
  await expect(page).toHaveURL(/\?view=projects$/);
  await page.getByRole("button", { name: "Create project", exact: true }).first().click();
  let dialog = page.getByRole("dialog", { name: "Create a project" });
  await dialog.getByLabel("Project name").fill(projectName);
  await dialog.getByLabel("Description").fill("Persisted browser verification");
  await dialog.getByRole("button", { name: "Create project", exact: true }).click();
  await expect(dialog).toBeHidden();
  await page.getByRole("button", { name: `Actions for ${projectName}` }).click();
  await page.getByRole("menuitem", { name: "Edit project" }).click();
  dialog = page.getByRole("dialog", { name: "Edit project" });
  await dialog.getByLabel("Description").fill("Edited in the browser");
  await dialog.getByRole("button", { name: "Save changes" }).click();
  await expect(dialog).toBeHidden();
  await expect(page.locator(".project-card").filter({ hasText: projectName })).toContainText("Edited in the browser");

  // Add a task from the focused project board, then move and edit it.
  await page.getByRole("button", { name: "Add task", exact: true }).click();
  dialog = page.getByRole("dialog", { name: "Create a task" });
  await dialog.getByLabel("Task name").fill(taskName);
  await dialog.getByLabel("Due date").fill(new Date().toISOString().slice(0, 10));
  await dialog.getByRole("button", { name: "Create task", exact: true }).click();
  await expect(dialog).toBeHidden();
  const card = page.locator("article.task-card").filter({ hasText: taskName });
  await expect(card).toBeVisible();
  await card.getByRole("combobox").selectOption("Done");
  await expect(card.getByRole("combobox")).toHaveValue("Done");
  await card.getByRole("button", { name: `Actions for ${taskName}` }).click();
  await page.getByRole("menuitem", { name: "Edit task" }).click();
  dialog = page.getByRole("dialog", { name: "Edit task" });
  await dialog.getByLabel("Description").fill("Edited task description");
  await dialog.getByRole("button", { name: "Save changes" }).click();
  await expect(card).toContainText("Edited task description");

  const tokens = await page.evaluate(() => JSON.parse(sessionStorage.getItem("stt.tokens") || "null"));
  const refreshResponse = await page.request.post(`${api}/auth/refresh/`, { data: { refresh: tokens.refresh } });
  const authHeaders = { Authorization: `Bearer ${(await refreshResponse.json()).access}` };
  // An expired access token must be refreshed transparently on the next request.
  await page.evaluate(() => {
    const value = JSON.parse(sessionStorage.getItem("stt.tokens") || "null");
    value.access = "expired-test-access-token";
    sessionStorage.setItem("stt.tokens", JSON.stringify(value));
  });
  const projectsResponse = await page.request.get(`${api}/projects/`, { headers: authHeaders });
  const savedProject = (await projectsResponse.json()).find((project: { project_name: string }) => project.project_name === projectName);
  for (const [label, offset] of [["Overdue", -1], ["Today", 0], ["Soon", 2]] as const) {
    const date = new Date();
    date.setDate(date.getDate() + offset);
    const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    const result = await page.request.post(`${api}/projects/${savedProject.project_id}/tasks/`, { headers: authHeaders, data: { task_name: `Deadline ${label} ${runId}`, due_date: dateKey } });
    expect(result.status()).toBe(201);
  }
  await page.reload();
  await expect(page).toHaveURL(/\?view=projects$/);
  await expect(page.locator("article.task-card").filter({ hasText: taskName }).getByRole("combobox")).toHaveValue("Done");
  await page.screenshot({ path: "test-results/workspace.png", fullPage: true });

  await go(page, "Calendar");
  await expect(page.locator(".calendar-grid").getByText(taskName, { exact: true })).toBeVisible();
  const reminders = page.getByRole("region", { name: "Task deadline reminders" });
  await expect(reminders.getByText(taskName, { exact: true })).toHaveCount(0);
  for (const [label, badge] of [["Overdue", "Overdue"], ["Today", "Due today"], ["Soon", "Due soon"]] as const) {
    const reminder = reminders.locator("li").filter({ hasText: `Deadline ${label} ${runId}` });
    await expect(reminder.getByText(badge, { exact: true })).toBeVisible();
  }
  await expect(page.locator(".calendar-grid .deadline-overdue").first()).toHaveCSS("color", "rgb(159, 18, 57)");

  // Tasks are only created inside a project: the Tasks page and dashboard offer no shortcut.
  await go(page, "Tasks");
  await expect(page.getByRole("button", { name: "New Task" })).toHaveCount(0);
  await page.getByRole("button", { name: "Open projects" }).click();
  await expect(page).toHaveURL(/\?view=projects$/);
  await expect(page.getByRole("button", { name: "Add task", exact: true })).toHaveCount(0);
  await page.locator(".project-card").filter({ hasText: projectName }).locator(".project-select").click();
  await page.getByRole("button", { name: "Add task", exact: true }).click();
  dialog = page.getByRole("dialog", { name: "Create a task" });
  await expect(dialog.getByLabel("Project")).toHaveValue(projectName);
  await expect(dialog.getByLabel("Project")).toBeDisabled();
  await dialog.getByLabel("Task name").fill(throwawayTask);
  await dialog.getByRole("button", { name: "Create task", exact: true }).click();
  await expect(page.locator("article.task-card").filter({ hasText: throwawayTask })).toBeVisible();

  // Deleting asks first: cancelling keeps the task, confirming removes it.
  await go(page, "Tasks");
  await page.getByRole("search", { name: "Filter tasks" }).getByRole("searchbox").fill(runId);
  await expect(page.getByRole("heading", { name: throwawayTask })).toBeVisible();
  await page.getByRole("button", { name: `More actions for ${throwawayTask}` }).click();
  await page.getByRole("menuitem", { name: "Delete task" }).click();
  let confirm = page.getByRole("alertdialog", { name: "Delete task?" });
  await expect(confirm).toContainText(throwawayTask);
  await confirm.getByRole("button", { name: "Cancel" }).click();
  await expect(page.getByRole("heading", { name: throwawayTask })).toBeVisible();
  await page.getByRole("button", { name: `More actions for ${throwawayTask}` }).click();
  await page.getByRole("menuitem", { name: "Delete task" }).click();
  confirm = page.getByRole("alertdialog", { name: "Delete task?" });
  await confirm.getByRole("button", { name: "Delete task" }).click();
  await expect(confirm).toBeHidden();
  await expect(page.getByRole("heading", { name: throwawayTask })).toHaveCount(0);

  await go(page, "Settings");
  await page.getByRole("button", { name: "Edit", exact: true }).click();
  await page.getByLabel("Full name", { exact: true }).fill("Browser Updated");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByText("Profile saved.", { exact: true })).toBeVisible();
  await expect(page.locator(".profile-copy b")).toHaveText("Browser Updated");
  await page.getByLabel("Profile picture", { exact: true }).setInputFiles({
    name: "avatar.png", mimeType: "image/png",
    buffer: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64"),
  });
  await expect(page.getByText("Profile picture updated.", { exact: true })).toBeVisible();
  await page.screenshot({ path: "test-results/settings.png", fullPage: true });
  await page.goto("/admin/users");
  await expect(page).toHaveURL(home);

  await go(page, "Settings");
  await page.getByRole("button", { name: "Change", exact: true }).click();
  await page.getByLabel("Current password", { exact: true }).fill(password);
  await page.getByLabel("New password", { exact: true }).fill(updatedPassword);
  await page.getByLabel("Confirm new password", { exact: true }).fill(updatedPassword);
  await page.getByRole("button", { name: "Save password", exact: true }).click();
  await page.getByRole("alertdialog", { name: "Change your password?" }).getByRole("button", { name: "Change password" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await signIn(page, memberEmail, updatedPassword);

  await go(page, "Sign out");
  confirm = page.getByRole("alertdialog", { name: "Sign out?" });
  await confirm.getByRole("button", { name: "Cancel" }).click();
  await expect(page).toHaveURL(home);
  await go(page, "Sign out");
  await page.getByRole("alertdialog", { name: "Sign out?" }).getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);
  expect(failures).toEqual([]);
});

test("team superuser sees all work read-only and has no user management", async ({ page }) => {
  await signIn(page, adminEmail, password);
  await expect(page.getByRole("button", { name: "New Task" })).toHaveCount(0);
  await go(page, "Projects");
  const memberCard = page.locator("article.task-card").filter({ hasText: taskName });
  await expect(memberCard).toBeVisible();
  await expect(memberCard).toHaveAttribute("draggable", "false");
  await expect(memberCard.getByRole("combobox")).toHaveCount(0);
  await expect(memberCard.getByRole("button", { name: `Actions for ${taskName}` })).toHaveCount(0);
  await expect(memberCard.getByText("Browser Updated", { exact: true })).toBeVisible();
  await expect(memberCard.locator("img")).toBeVisible();
  const projectCard = page.locator(".project-card").filter({ hasText: projectName });
  await expect(projectCard.getByText("Browser Updated", { exact: true })).toBeVisible();
  await expect(projectCard.getByRole("button", { name: `Actions for ${projectName}` })).toHaveCount(0);

  const token = await page.evaluate(() => JSON.parse(sessionStorage.getItem("stt.tokens") || "null").access);
  const auth = { Authorization: `Bearer ${token}` };
  const project = (await (await page.request.get(`${api}/projects/`, { headers: auth })).json()).find((item: { project_name: string }) => item.project_name === projectName);
  const task = (await (await page.request.get(`${api}/projects/${project.project_id}/tasks/`, { headers: auth })).json()).find((item: { task_name: string }) => item.task_name === taskName);
  expect((await page.request.patch(`${api}/projects/${project.project_id}/tasks/${task.task_id}/`, { headers: auth, data: { status: "in_progress" } })).status()).toBe(403);
  expect((await page.request.delete(`${api}/projects/${project.project_id}/tasks/${task.task_id}/`, { headers: auth })).status()).toBe(403);
  expect((await page.request.delete(`${api}/projects/${project.project_id}/`, { headers: auth })).status()).toBe(403);
  expect((await page.request.post(`${api}/admin/users/`, { headers: auth, data: { email: managedEmail } })).status()).toBe(404);
  await expect(page.getByRole("link", { name: "Manage users", exact: true })).toHaveCount(0);

  await go(page, "Tasks");
  await expect(page.getByRole("heading", { name: "All Tasks" })).toBeVisible();
  await page.getByRole("search", { name: "Filter tasks" }).getByRole("searchbox").fill(runId);
  await expect(page.getByRole("heading", { name: taskName, exact: true })).toBeVisible();
  await expect(page.getByRole("checkbox", { name: `Select ${taskName}` })).toBeDisabled();
  await page.goto("/admin/users");
  await expect(page).toHaveURL(home);
  await page.screenshot({ path: "test-results/admin-workspace.png", fullPage: true });

  await page.setViewportSize({ width: 390, height: 844 });
  await go(page, "Tasks");
  // Other people's work (such as seeded demo data) can push this task onto a later page.
  await page.getByRole("search", { name: "Filter tasks" }).getByRole("searchbox").fill(runId);
  await expect(page.getByRole("heading", { name: taskName, exact: true })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBe(0);
});

test("forgot password resets with an emailed code and signs out other sessions", async ({ page, browser }) => {
  const failures: string[] = [];
  page.on("pageerror", error => failures.push(error.message));
  // A second browser that is already signed in must lose access after the reset.
  const other = await browser.newPage();
  await signIn(other, resetEmail, password);

  await page.goto("/login");
  await page.getByRole("link", { name: "Forgot password?" }).click();
  await expect(page.getByRole("heading", { name: "Forgot your password?" })).toBeVisible();
  await page.getByLabel("Email address").fill(resetEmail);
  await page.getByRole("button", { name: "Send reset code" }).click();
  await expect(page.getByRole("status", { name: "Sending reset code" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Check your inbox" })).toBeVisible();
  await expect(page.getByText(/Resend code in 00:4\d/)).toBeVisible();
  await expect(page.getByRole("link", { name: "Open email app" })).toHaveAttribute("href", "mailto:");

  const { code } = await emailedCode(resetEmail, "password reset code");
  await page.getByRole("button", { name: "Enter reset code" }).click();
  await enterCode(page, code);
  await expect(page.getByRole("heading", { name: "Reset your Password" })).toBeVisible();
  const submit = page.getByRole("button", { name: "Reset password" });
  await page.getByLabel("Password", { exact: true }).fill(updatedPassword);
  await page.getByLabel("Confirm password").fill(`${updatedPassword}x`);
  await expect(submit).toBeDisabled();
  await page.getByLabel("Confirm password").fill(updatedPassword);
  await submit.click();
  await expect(page.getByRole("heading", { name: "Password reset successful" })).toBeVisible();
  const changed = await (await fetch(`${mailpit}/api/v1/search?query=${encodeURIComponent(`to:"${resetEmail}" subject:"password was changed"`)}`)).json();
  expect(changed.messages.length).toBeGreaterThan(0);

  // Forgot password answers the same way for an address with no account.
  const unknown = await page.request.post(`${api}/auth/password/forgot/`, { data: { email: `nobody_${runId}@example.test` } });
  const known = await page.request.post(`${api}/auth/password/forgot/`, { data: { email: resetEmail } });
  expect(await unknown.json()).toEqual(await known.json());

  await page.getByRole("button", { name: "Back to Sign In" }).click();
  await expect(page.getByLabel("Email", { exact: true })).toHaveValue(resetEmail);
  await page.getByLabel("Password", { exact: true }).fill(updatedPassword);
  await page.getByRole("button", { name: "Sign In", exact: true }).click();
  await expect(page).toHaveURL(home);

  await other.reload();
  await expect(other).toHaveURL(/\/login$/);
  await other.close();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/forgot-password");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBe(0);
  expect(failures).toEqual([]);
});
