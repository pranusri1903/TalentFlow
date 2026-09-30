# 🚀 TalentFlow

TalentFlow is a platform I built that combines recruitment, employee management, and Jira style project management into one app. It has four roles. Candidates apply to jobs. HR runs the hiring pipeline. Employees track their own work and leave. Admins manage accounts, departments, and every project.

The backend is Django REST Framework. The frontend is React with Vite and Tailwind. The database and authentication both run on Supabase.

## 🛠️ Tech stack

Backend: Django 6 and Django REST Framework, PostgreSQL through Supabase (it falls back to a local SQLite file if no DATABASE_URL is set), and Supabase Auth for login (Google OAuth and email/password). The backend never touches a password directly. It verifies the JWT that Supabase issues on every request using PyJWT against Supabase's public JWKS endpoint, so there is no shared secret sitting in the codebase. In production it runs behind gunicorn with whitenoise.

Frontend: React 19, Vite, and Tailwind CSS v4, using react router for navigation and axios for API calls. Supabase's JS client only handles the login session. Every actual read or write of data goes through the Django API. Drag and drop on the Kanban board comes from dnd kit. Charts come from recharts. Icons come from lucide react.

It is deployed with Render for the backend, Vercel for the frontend, and Supabase for the database and auth.

## ✨ What it actually does

### 🔐 Accounts and login

Sign up and log in happen through Supabase Auth, either Google OAuth or plain email and password. There are four roles, candidate, hr, employee, and admin, and the role is always decided server side. The client is never trusted to say who it is. When an admin creates an account for someone, a temporary password gets emailed to them and they are forced to change it the first time they log in. There is also a notification bell in the app for things like new assignments, leave decisions, being hired, or being mentioned in a comment, with an unread count and a way to mark things read.

### 💼 Recruitment

HR posts jobs with a title, department, location, employment type, description, a list of skills, and a salary range. Every job gets a permanent readable id like JOB0001 so it is easy to refer to later. Candidates browse and search open jobs and apply with a resume upload and a cover letter. HR then moves each applicant through a pipeline that goes applied, shortlisted, interview, and finally hired or rejected.

Hiring someone actually requires picking a department and a designation at that step. That is the moment the candidate becomes a real employee record and gets bumped up to the employee or hr role, so it is not something that can be left blank and fixed later.

Resumes are stored as raw bytes in the database instead of as files on disk. That matters because the hosting we use wipes its disk on restarts and redeploys, so files saved to disk do not survive. Storing them in Postgres means they stick around. On top of that, a resume is automatically deleted the moment its application is marked hired or rejected, so we only ever keep resumes for people still actively in the pipeline. Fetching a resume also requires being logged in as either the candidate who applied or someone from HR or admin.

Both the jobs list and the applicants list have search and filters, by title or job id, by status, and by department.

### 🧑‍💼 Employee management

Admins create staff and admin accounts with a department and a designation. Every employee also gets a permanent readable id like EMP0001. Whether someone counts as a manager is decided by their designation text, so anyone with a title containing the word manager is treated as one. There is no separate flag for it, which means it is impossible for the designation and the manager status to ever disagree. Admins can also set up a manager hierarchy through a reports to field, and the users list can be searched, grouped by department, or filtered by department. Accounts can be activated or deactivated.

### 🌴 Leave management

Employees submit leave requests and their manager or an admin approves or rejects them. The leave balance shown to an employee is calculated live from their approved requests each time, twenty days a year by default, so there is no separate counter that could ever get out of sync. An employee can also cancel a leave request that was already approved, as long as it has not started yet, since you cannot undo leave you already took. Cancelling frees the balance back up right away. Managers only see requests from people who report to them. Admins see everything.

### 📋 Projects and tasks

A project has a team and a manager, and the manager always has to be part of that team. That rule is enforced in the interface and at the database level too. Assigning someone as manager automatically adds them to the team, and removing a team member who happens to be the manager automatically clears the manager field instead of leaving it pointing at someone who is no longer on the team.

Work is tracked on a Kanban board with drag and drop across four columns, to do, in progress, review, and done. Each task can have a priority from low to urgent, a type of task, bug, or story, a due date that gets flagged once it is overdue, free form labels, and a description. Related tasks can be grouped under an epic. Sprints move between planned, active, and completed, and anything not in a sprint sits in the backlog.

Every task has a comment thread combined with an automatic activity log, so you get one chronological feed showing both what people said and every change the system made, like a status or priority update. Mentioning someone with @Name in a comment sends them a notification. Each project also has a small dashboard showing completion rate, how many tasks are overdue, workload per person, and a breakdown by priority and type, all computed live from the task list without any extra backend calls. The board itself has a search and filter bar for title, assignee, priority, label, epic, and sprint, and there is a separate global search page that looks across every project you have access to, not just the one you happen to be viewing. On the employee side, My Tasks can be grouped by status, type, due date, sprint, or epic, and finished tasks collapse into a single line instead of cluttering the list.

## 📁 Project structure

```
talentflow/
  backend/                 Django project
    accounts/               profiles, roles, user management, notifications, Supabase auth
    recruitment/             jobs, applications, hiring, resume storage
    employees/               employee records, leave requests
    projectmgmt/             projects, sprints, epics, tasks, comments, activity log
    config/                  settings.py and urls.py

  frontend/                 React app built with Vite
    src/
      pages/
        admin/                users, projects list and detail, leave queue
        hr/                   recruitment dashboard, applicants
        employee/             employee workspace, tasks, leave, projects
        jobseeker/            public job listing, job detail, my applications
        GlobalSearchPage.jsx
      components/            KanbanBoard, TaskDetailModal, ProjectDashboard, GroupedTaskList,
                              AppShell (the sidebar), NotificationBell, DesignationField
        ui/                   small shared pieces, Button, Card, Chip, SearchInput, Modal
      lib/                    api.js (axios plus the auth header), taskMeta.js, navigation.js, departments.js
      context/                AuthContext, holds the Supabase session and profile
```

## 🔌 The API

Everything lives under /api/.

/api/accounts/ handles me, users, and notifications.

/api/recruitment/ handles jobs, applying to a job, viewing applications for a job, updating an application's status, and fetching a resume.

/api/employees/ handles your own profile, your own leave requests and balance, cancelling a leave request, the leave queue managers and admins see, and deciding on a leave request.

/api/projects/ handles projects, tasks, sprints, and epics within a project, a single task and its status, comments, and activity, searching tasks across every project, and listing your own tasks.

Every list or detail endpoint scopes what it returns by role. Admins see everything. Managers and employees only see what they belong to or are responsible for.

## ⚙️ Running it locally

Backend:

```
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python manage.py migrate
python manage.py runserver
```

Fill in DATABASE_URL, SUPABASE_URL, and the rest of the values in .env before running migrate.

Frontend:

```
cd frontend
npm install
cp .env.example .env
npm run dev
```

Fill in VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, and VITE_API_BASE_URL first.

If you skip DATABASE_URL, the backend just falls back to a local SQLite file, which is fine for poking around the API. You still need real Supabase Auth values though, since there is no local login system to fall back on.

## 🚧 Notes from actually deploying this

A few things caused real problems while building this, worth knowing about before touching it again.

Use Supabase's Transaction pooler, on port 6543, not the Session pooler on port 5432. The session pooler caps concurrent connections at fifteen on the free tier and starts rejecting requests under any real load. DISABLE_SERVER_SIDE_CURSORS is set to True because the transaction pooler needs that.

CONN_MAX_AGE is set to 60, not 0. Since we are on the transaction pooler, which is built to handle many persistent client connections, Django can safely reuse its connection across requests. Leaving it at 0 means every single request pays for a brand new handshake to Supabase, which adds up fast if your database is geographically far from your users.

Media files need an explicit route no matter what DEBUG is set to. Django's own static() helper quietly does nothing unless DEBUG is True, even if you remove the surrounding if statement yourself, because that check is baked into the helper. config/urls.py wires up django.views.static.serve directly instead, specifically so resumes are not a dead link in production.

Render's free tier wipes its disk on restart and on every redeploy. That is the whole reason resumes are stored as bytes in Postgres instead of as uploaded files, and it is also why the backend can feel slow to wake up after sitting idle for a while. There is a scheduled workflow in .github/workflows/keep-backend-warm.yml that pings it every ten minutes to help with that, though it is not a real substitute for an always on paid plan.

DJANGO_ALLOWED_HOSTS needs to be a bare hostname, no scheme in front of it. Easy mistake to make when pasting it into Render's environment settings.
