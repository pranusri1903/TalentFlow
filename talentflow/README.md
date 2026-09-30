# TalentFlow

A full-stack recruitment + employee management + Jira-style project management platform, built with Django REST Framework on the backend and React on the frontend, using Supabase for the database and authentication.

Four roles share one app: **Candidates** apply to jobs, **HR** runs the hiring pipeline, **Employees** track their own work and leave, and **Admins** manage accounts, departments, and every project.

---

## Tech stack

**Backend**
- Django 6 + Django REST Framework
- PostgreSQL via [Supabase](https://supabase.com) (falls back to local SQLite if `DATABASE_URL` isn't set)
- Auth: Supabase Auth (Google OAuth + email/password). The backend never touches passwords — it verifies the Supabase-issued JWT on every request using `PyJWT` against Supabase's public JWKS endpoint (no shared secret).
- `gunicorn` + `whitenoise` in production (Render)

**Frontend**
- React 19 + Vite + Tailwind CSS v4
- `react-router-dom` for routing, `axios` for API calls
- `@supabase/supabase-js` for auth (session/login only — all data reads/writes go through the Django API)
- `@dnd-kit/core` for the Kanban drag-and-drop board
- `recharts` for charts, `lucide-react` for icons

**Deployment**: Render (backend) + Vercel (frontend) + Supabase (Postgres + Auth)

---

## Features

### Auth & accounts
- Sign up / log in via Supabase Auth (Google OAuth or email/password)
- Four roles: `candidate`, `hr`, `employee`, `admin` — role is derived server-side, never trusted from the client
- Admin-created accounts get a temp password emailed to them and are forced to change it on first login
- In-app notification bell (assignments, leave decisions, hiring, @mentions) with unread count and mark-as-read

### Recruitment (candidate ↔ HR)
- HR posts jobs (title, department, location, type, description, comma-separated skills, salary range); each job gets a permanent, human-readable **Job ID** (`JOB0001`, ...)
- Candidates browse/search open jobs and apply with a resume upload + cover letter
- HR moves applicants through a pipeline: `applied → shortlisted → interview → hired / rejected`
- **Hiring requires a department + designation** — this is what actually converts the candidate into an employee record (and grants HR/employee role) and is enforced at that step, not left blank
- **Resumes** are stored as bytes directly in the database (not on disk) so they survive backend restarts/redeploys, and are **automatically deleted the moment an application is marked hired or rejected** — only actively-in-pipeline resumes are ever retained. Serving is authenticated: only the candidate who applied or HR/admin can fetch a given resume.
- Search/filter on both the jobs list (title/ID, status, department) and the applicants list (name, status)

### Employee management (admin)
- Create staff/admin accounts with department + designation
- Every employee gets a permanent, human-readable **Employee ID** (`EMP0001`, ...)
- **Manager status is derived from designation text** (e.g. any title containing "Manager"), not a separate toggle — so it's impossible for the two to disagree
- Manager hierarchy ("reports to"), search, group-by-department, department filter
- Activate/deactivate accounts

### Leave management
- Employees submit leave requests; managers or admin approve/reject
- Live leave balance (20 days/year, computed from approved requests — no stored counter to drift out of sync)
- Employees can **cancel an already-approved leave request**, but only while it's still in the future (you can't un-take leave you've already started) — this automatically frees up the balance again
- Managers see only their own reports' requests; admin sees everyone's

### Projects & tasks (Jira-style)
- Projects have a team and a manager — **the manager must always be a member of the team**, enforced both in the UI and at the database layer (assigning a manager auto-adds them to the team; removing a member who's the current manager auto-clears the manager field)
- **Kanban board** with drag-and-drop across four statuses (To Do → In Progress → Review → Done)
- Tasks have priority (Low/Medium/High/Urgent), type (Task/Bug/Story), due dates (with overdue flagging), free-form labels, and a description
- **Epics** group related tasks under a bigger initiative
- **Sprints** (planned/active/completed) with a backlog view
- **Comments + activity history** on every task — a chronological feed combining actual comments and an automatic system log of every status/priority/assignee/etc. change, plus `@Name` mentions that notify the mentioned teammate
- **Project dashboard**: completion rate, overdue count, workload per assignee, breakdown by priority and type — computed live from the task list, no extra backend calls
- **Search/filter bar** on the board (title, assignee, priority, label, epic, sprint)
- **Global search** (`/search`) finds a task across every project you have access to, not just the one you're currently viewing
- **"My Tasks"** (employee view) can be grouped by status, type, due date, sprint, or epic, with completed tasks collapsed into a single expandable summary line instead of cluttering the view

---

## Project structure

```
talentflow/
├── backend/                  Django project
│   ├── accounts/             Profiles, roles, user CRUD, notifications, Supabase JWT auth
│   ├── recruitment/          Jobs, applications, hiring pipeline, resume storage
│   ├── employees/            Employee records, leave requests
│   ├── projectmgmt/          Projects, sprints, epics, tasks, comments, activity log
│   └── config/                settings.py / urls.py
└── frontend/                 React (Vite) app
    └── src/
        ├── pages/
        │   ├── admin/         Users, Projects (list + detail), Leave queue
        │   ├── hr/            Recruitment dashboard, Applicants
        │   ├── employee/      Employee workspace (tasks, leave, projects)
        │   ├── jobseeker/     Public job listing, job detail, my applications
        │   └── GlobalSearchPage.jsx
        ├── components/        KanbanBoard, TaskDetailModal, ProjectDashboard, GroupedTaskList,
        │                       AppShell (sidebar), NotificationBell, DesignationField, ...
        │   └── ui/             Small shared primitives: Button, Card, Chip, SearchInput, Modal, ...
        ├── lib/                api.js (axios + auth interceptor), taskMeta.js, navigation.js, departments.js
        └── context/            AuthContext (Supabase session + profile)
```

### API layout

All endpoints are namespaced under `/api/`:

| Prefix | App | Covers |
|---|---|---|
| `/api/accounts/` | accounts | `me/`, `users/`, `notifications/` |
| `/api/recruitment/` | recruitment | `jobs/`, `jobs/:id/apply/`, `jobs/:id/applications/`, `applications/:id/status/`, `applications/:id/resume/` |
| `/api/employees/` | employees | `me/`, `me/leave/`, `me/leave/balance/`, `me/leave/:id/cancel/`, `leave/`, `leave/:id/decision/`, employee list/detail |
| `/api/projects/` | projectmgmt | `projects/`, `projects/:id/tasks|sprints|epics/`, `tasks/:id/`, `tasks/:id/status|comments|activity/`, `tasks/search/`, `my-tasks/` |

Every list/detail view scopes its queryset by role: admins see everything, managers/employees see only what they're a member of or responsible for.

---

## Running locally

### Backend
```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env        # fill in DATABASE_URL, SUPABASE_URL, etc.
python manage.py migrate
python manage.py runserver
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env         # fill in VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_API_BASE_URL
npm run dev
```

Without a `DATABASE_URL`, the backend falls back to local SQLite — fine for poking around the API, but Supabase Auth is still required for login since there's no local auth system.

---

## Deployment notes & known gotchas

These are things that bit us during this project's build-out — worth knowing before you redeploy:

- **Supabase pooler mode matters.** Use the **Transaction pooler** (port `6543`), not the Session pooler (port `5432`) — the session pooler caps concurrent client connections at 15 on the free tier and will start rejecting requests under any real traffic. `DISABLE_SERVER_SIDE_CURSORS = True` is required when using the transaction pooler.
- **`CONN_MAX_AGE`** is set to `60`, not `0`. Since we're on the transaction pooler (designed for many persistent client connections), Django can safely reuse its connection across requests — with `0`, every single request pays a fresh TLS handshake to Supabase, which is a very noticeable chunk of latency if your Supabase region is far from your users.
- **Media files need an explicit route regardless of `DEBUG`.** Django's own `django.conf.urls.static.static()` helper silently no-ops unless `DEBUG=True` — even if you remove the `if settings.DEBUG:` guard around it yourself, the helper's own internal check still blocks it. `config/urls.py` registers `django.views.static.serve` directly instead, specifically so resume files aren't a 404 in production.
- **Render's free tier has an ephemeral filesystem** — anything written to local disk (and the whole app process itself) can be wiped on restart/redeploy. This is why resumes are stored as bytes in Postgres rather than as uploaded files on disk, and why the backend can feel slow to "wake up" after being idle (a `.github/workflows/keep-backend-warm.yml` scheduled ping helps with the wake-up part, though it's not a substitute for a paid always-on plan).
- **`DJANGO_ALLOWED_HOSTS`** must be a bare hostname (no `https://` scheme) — a common copy-paste mistake when setting Render env vars.

---

## What's deliberately not built yet

TalentFlow covers the highest-value slice of Jira-style project management, not the whole product. Explicitly out of scope for now (see the audit conversation this README was written alongside for the full reasoning):

- Issue dependencies/linking (blocks, relates-to, duplicates), subtasks
- Story points, sprint velocity, burndown/burnup charts
- Releases/versions, roadmaps, milestones
- Time tracking (estimates, logged hours, timesheets)
- Configurable/custom workflows (statuses are currently fixed: To Do → In Progress → Review → Done)
- Fine-grained per-action project permissions beyond the current admin / project-manager / assignee model
- Org-wide audit logs, saved search filters, calendar views

None of these are missing by accident — each was weighed against the size and needs of the app and deliberately deprioritized.
