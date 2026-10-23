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

Open http://localhost:3000. If `.env` does not already exist, copy `.env.example` to `.env`; its `NEXT_PUBLIC_API_URL` defaults to `http://localhost:8000/api`. Backend CORS must allow the frontend origin.

Members register through `/register` and sign in through `/login`. The superuser created with `createsuperuser` is the team administrator and signs in through that same page. Team administrators can access all projects and tasks. Members access only their own projects/tasks. User management is not available through either the frontend or API, and Django admin exposes only projects and tasks. The former `/admin/users` frontend URL redirects to the workspace.

## Connected features

- Projects and tasks load from the database; new accounts start with an empty workspace.
- Project/task forms save to the API. Task status changes and due dates persist after reloads and appear in the calendar.
- Settings edits your name, email and phone, uploads your own profile picture, and changes your password after checking the current password.
- Registration creates ordinary users and does not accept profile pictures or privileges.
- Task reminders are derived from saved overdue tasks; appearance is a local UI preference.
- Login uses JWTs. Access tokens refresh automatically while the refresh token remains valid. The default session lives in session storage; **Remember me** uses local storage. Sign-out clears these browser tokens; it does not blacklist issued refresh tokens on the server.
- Task visibility follows project ownership. Team administrators (`is_superuser=True`) can access all projects/tasks.

## Verification

```powershell
npx tsc --noEmit
npm run build
npm run test:e2e
```

Browser tests require the backend, frontend dev server, Docker CLI, and Microsoft Edge. They create uniquely identified temporary accounts and work records in the local database, then remove only those records and their uploaded files. Keep these tests pointed at the local development stack.

For the backend suite (creates and removes a separate PostgreSQL test database):

```powershell
docker compose exec web python manage.py test STT
```
