import { test, expect } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import path from "node:path";

const runId = randomUUID().replaceAll("-", "").slice(0, 12);
const memberEmail = `e2e_${runId}_member@example.test`;
const adminEmail = `e2e_${runId}_admin@example.test`;
const managedEmail = `e2e_${runId}_managed@example.test`;
const password = `Browser!${randomUUID()}927`;
const updatedPassword = `Updated!${randomUUID()}927`;
const projectName = `Browser project ${runId}`;
const taskName = `Browser task ${runId}`;
const backend = path.resolve(process.cwd(), "../../Simple-Task-Tracker");
test.describe.configure({ mode: "serial" });

function django(code: string) {
  return execFileSync("docker", ["compose", "exec", "-T", "web", "python", "-"], {
    cwd: backend, encoding: "utf8",
    input: `import os\nos.environ.setdefault('DJANGO_SETTINGS_MODULE', 'taskTracker.settings')\nimport django\ndjango.setup()\n${code}`,
  });
}

test.beforeAll(() => {
  django(`from django.contrib.auth import get_user_model\nget_user_model().objects.create_superuser(email=${JSON.stringify(adminEmail)}, password=${JSON.stringify(password)}, full_name='Browser Test Admin', phone_no='+255700009999')\n`);
});

test.afterAll(() => {
  // Remove only accounts and work records created by this uniquely identified run.
  django(`from django.contrib.auth import get_user_model\nfrom STT.models import Projects, Tasks\nemails = ${JSON.stringify([memberEmail, adminEmail, managedEmail])}\naccounts = get_user_model().objects.filter(email__in=emails)\nTasks.objects.filter(project_id__user_id__in=accounts).delete()\nProjects.objects.filter(user_id__in=accounts).delete()\nfor account in accounts:\n    if account.profile_picture:\n        account.profile_picture.delete(save=False)\naccounts.delete()\n`);
});

test("member registers, creates persisted work, updates profile and signs out", async ({ page }) => {
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
  await expect(page).toHaveURL(/\/login$/);
  await page.getByLabel("Email", { exact: true }).fill(memberEmail);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign In", exact: true }).click();
  await expect(page).toHaveURL("http://localhost:3000/");
  await expect(page.getByText("Browser Member", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Create project", exact: true }).click();
  const projectDialog = page.getByRole("dialog");
  await projectDialog.getByLabel("Project name").fill(projectName);
  await projectDialog.getByLabel("Description").fill("Persisted browser verification");
  await projectDialog.getByRole("button", { name: "Create project", exact: true }).click();
  await expect(projectDialog).toBeHidden();
  await page.getByRole("button", { name: /New Task/ }).click();
  const taskDialog = page.getByRole("dialog");
  await taskDialog.getByLabel("Task name").fill(taskName);
  await taskDialog.getByLabel("Due date").fill(new Date().toISOString().slice(0, 10));
  await taskDialog.getByRole("button", { name: "Create task", exact: true }).click();
  await expect(taskDialog).toBeHidden();
  const card = page.locator("article.task-card").filter({ hasText: taskName });
  await expect(card).toBeVisible();
  await card.getByRole("combobox").selectOption("Done");
  await expect(card.getByRole("combobox")).toHaveValue("Done");
  await page.evaluate(() => {
    const value = JSON.parse(sessionStorage.getItem("stt.tokens") || "null");
    value.access = "expired-test-access-token";
    sessionStorage.setItem("stt.tokens", JSON.stringify(value));
  });
  await page.reload();
  await expect(page.locator("article.task-card").filter({ hasText: taskName }).getByRole("combobox")).toHaveValue("Done");
  await expect(page.getByRole("combobox").first()).toHaveCSS("min-height", "36px");
  await page.screenshot({ path: "test-results/workspace.png", fullPage: true });
  await page.getByRole("button", { name: "Calendar", exact: true }).click();
  await expect(page.locator(".calendar-grid").getByText(taskName, { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Settings", exact: true }).first().click();
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
  await expect(page).toHaveURL("http://localhost:3000/");
  await page.getByRole("button", { name: "Settings", exact: true }).first().click();
  await page.getByRole("button", { name: "Change", exact: true }).click();
  await page.getByLabel("Current password", { exact: true }).fill(password);
  await page.getByLabel("New password", { exact: true }).fill(updatedPassword);
  await page.getByLabel("Confirm new password", { exact: true }).fill(updatedPassword);
  await page.getByRole("button", { name: "Save password", exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.getByPlaceholder("Enter email", { exact: true }).fill(memberEmail);
  await page.getByLabel("Password", { exact: true }).fill(updatedPassword);
  await page.getByRole("button", { name: "Sign In", exact: true }).click();
  await expect(page).toHaveURL("http://localhost:3000/");
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);
  expect(failures).toEqual([]);
});

test("team superuser sees all work and has no user management", async ({ page }) => {
  await page.goto("/login");
  await page.getByPlaceholder("Enter email", { exact: true }).fill(adminEmail);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign In", exact: true }).click();
  await expect(page).toHaveURL("http://localhost:3000/");
  await expect(page.locator("article.task-card").filter({ hasText: taskName })).toBeVisible();
  await expect(page.getByRole("link", { name: "Manage users", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Tasks", exact: true }).click();
  await expect(page.getByRole("heading", { name: taskName, exact: true })).toBeVisible();
  const access = await page.evaluate(() => JSON.parse(sessionStorage.getItem("stt.tokens") || "null").access);
  const result = await page.request.post("http://localhost:8000/api/admin/users/", {
    headers: { Authorization: `Bearer ${access}` },
    data: { email: managedEmail },
  });
  expect(result.status()).toBe(404);
  await page.goto("/admin/users");
  await expect(page).toHaveURL("http://localhost:3000/");
  await page.screenshot({ path: "test-results/admin-workspace.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page.getByRole("button", { name: "Tasks", exact: true }).click();
  await expect(page.getByRole("heading", { name: taskName, exact: true })).toBeVisible();
});
