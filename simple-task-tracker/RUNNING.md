# Run the connected Task Tracker

## Backend and first administrator

From `Taskracker/Simple-Task-Tracker`:

```powershell
docker compose up --build -d
docker compose exec web python manage.py createsuperuser
```

The first command applies committed database migrations before starting Django. The second prompts for your own administrator email, full name, phone number, and password. Create this account once; do not use a public registration request to bootstrap an administrator.

## Frontend

From `Taskracker/STT-frontend/simple-task-tracker`:

```powershell
npm install
npm run dev
```

Open http://localhost:3000. If `.env` does not already exist, copy `.env.example` to `.env`; its `NEXT_PUBLIC_API_URL` defaults to `http://localhost:8001/api`. Docker publishes backend container port 8000 on host port 8001. Backend CORS must allow the frontend origin. Restart the frontend after changing `.env`; production builds must be rebuilt because public environment variables are bundled into browser code.

Members register through `/register`, confirm their email with the 6-digit code sent to them on `/verify-email`, and then sign in through `/login`. Signing in before verifying sends a fresh code and opens `/verify-email`. **Forgot password?** on the sign-in page opens `/forgot-password`: request a code, enter it, then choose a new password. Codes arrive by email only; in development every email lands in Mailpit at http://localhost:8025 (see the backend README). The superuser created with `createsuperuser` is the team administrator and signs in through that same page. Team administrators can access all projects and tasks. Members access only their own projects/tasks. User management is not available through either the frontend or API, and Django admin exposes only projects and tasks. The former `/admin/users` frontend URL redirects to the workspace.

## Connected features

- Projects and tasks load from the database; new accounts start with an empty workspace.
- Project/task forms save to the API. Task status changes and due dates persist after reloads and appear in the calendar.
- Settings edits your name, email and phone, uploads your own profile picture, and changes your password after checking the current password.
- Registration creates ordinary users and does not accept profile pictures or privileges.
- Task reminders are derived from saved overdue tasks; appearance is a local UI preference.
- Login uses JWTs. Access tokens refresh automatically while the refresh token remains valid. The default session lives in session storage; **Remember me** uses local storage. Sign-out clears these browser tokens. Changing or resetting a password ends every existing session on all devices, because tokens are tied to the password they were issued under.
- Task ownership follows the containing project's owner. API responses include a read-only `creator` (user ID, name, picture) and tasks include `can_edit`. Team administrators (`is_superuser=True`) can view all projects/tasks; only owners can create or update tasks within their own projects. Other users' records are read-only in the frontend, API, and Django admin.
- The calendar flags unfinished tasks as **Overdue**, **Due today**, or **Due soon** (next three calendar days). Completed tasks stay on their dates but never receive deadline warnings. Reminders refresh while the calendar remains open.

## Verification

```powershell
npx tsc --noEmit
npm run build
npm run test:e2e
```

Browser tests require the backend Compose stack (including Mailpit, which they read verification and reset codes from), a running frontend, the Docker CLI, and Microsoft Edge. Point them elsewhere with environment variables, for example `E2E_BASE_URL=http://localhost:3001 PW_CHANNEL=chrome npm run test:e2e`. They create uniquely identified temporary accounts and work records in the local database, then remove only those records and their uploaded files. Keep these tests pointed at the local development stack.

For the backend suite (creates and removes a separate PostgreSQL test database):

```powershell
docker compose exec web python manage.py test
```
