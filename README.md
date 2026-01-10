# DailyPath

MVP implementation of DailyPatch: a web application for daily and weekly planning in 15‑minute slots, manual time logging, and lightweight reporting for teams. Employees plan and track work; managers get quick visibility into team plans and can assign work when needed.

Badges: [Node 22.14.0](https://img.shields.io/badge/node-22.14.0-339933?logo=node.js) · [Astro 5](https://img.shields.io/badge/Astro-5-ff5d01?logo=astro) · [React 19](https://img.shields.io/badge/React-19-61DAFB?logo=react) · [TypeScript 5](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript) · [License: MIT](https://img.shields.io/badge/license-MIT-blue)

## Table of Contents

- [Project name](#dailypath)
- [Project description](#dailypath)
- [Tech stack](#tech-stack)
- [Getting started locally](#getting-started-locally)
- [Available scripts](#available-scripts)
- [Authentication & authorization](#authentication--authorization)
- [Project scope](#project-scope)
- [Project status](#project-status)
- [License](#license)

## Tech stack

- Astro 5
- React 19
- TypeScript 5
- Tailwind CSS 4
- shadcn/ui (React primitives + utilities)
- Supporting libraries: `@astrojs/react`, `@astrojs/node`, `@astrojs/sitemap`, `class-variance-authority`, `clsx`, `lucide-react`, `tailwind-merge`, `tw-animate-css`

## Getting started locally

Prerequisites:

- Node.js 22.14.0 (pinned in `.nvmrc`)
- npm (bundled with Node)

Steps:

1) Clone and enter the project directory

```bash
git clone <your-repo-url>
cd DailyPath
```

2) Install dependencies

```bash
npm install
```

3) (Optional) Environment configuration

```bash
# copy the example env and adjust values as needed
cp .env.example .env   # Linux/macOS
# or on Windows PowerShell
Copy-Item .env.example .env
```

4) Run the development server

```bash
npm run dev
```

5) Build and preview production

```bash
npm run build
npm run preview
```

## Available scripts

- `npm run dev` — Start the Astro dev server
- `npm run build` — Build the production site
- `npm run preview` — Preview the production build locally
- `npm run astro` — Run Astro CLI directly
- `npm run lint` — Run ESLint over the project
- `npm run lint:fix` — Fix lint issues where possible
- `npm run format` — Format files with Prettier

## Authentication & authorization

DailyPath uses **Supabase Auth** with server-side rendering (SSR) for secure authentication and authorization.

### Protected routes

All main application pages require authentication:
- **Home page** (`/`) - requires login
- **Dashboard** (`/dashboard`) - requires login
- **Tasks** (`/tasks`) - requires login
- **Plan** (`/plan`) - requires login
- **Settings** (`/settings`) - requires login
- **Reports** (`/reports`) - requires login
- **Team** (`/team`) - requires login
- **Time logs** (`/time-logs`) - requires login
- **Admin** (`/admin`) - requires Admin role

### Usage in Astro pages

```astro
---
import { requireAuth } from "../lib/utils/auth";

// Ensure user is authenticated
const user = requireAuth(Astro);
---
```

For pages requiring specific roles:

```astro
---
import { requireRole } from "../lib/utils/auth";

// Ensure user has Admin role
const user = requireRole(Astro, "Admin");
---
```

### Documentation

For detailed documentation on authentication and authorization:
- **[Login Guide](LOGIN_GUIDE.md)** - How to login and test user accounts
- **[Auth Protection Guide](docs/AUTH_PROTECTION_GUIDE.md)** - How to protect pages and implement authorization

## Project scope

MVP capabilities (condensed from the Product Requirements Document):

- Roles and access: Employee, Manager; technical Admin for provisioning and cross‑department visibility
- Tasks: title, description, priority (L/M/H), required estimate, optional due date, status (To Do / In Progress / Blocked / Done), assignment to user or department, visible assignee/assigner
- Planning: 24/7 daily/weekly views, 15‑minute slots, drag & drop, conflict detection with an option to intentionally allow overlaps (visually marked); managers can plan for others
- Time logging: manual time entries rounded to 15 minutes; editable up to 7 days back; entries over 150% of estimate flagged for manager review
- ETA and closing: show ETA when 100% of estimate is scheduled; early completion sets status Done and closes the task with ETA = closure time
- Reports: daily and monthly reports based on actual time (date, task, department, performer, total time, status at closure); CSV export
- Analytics: `plan_filled_%`, `daily_active_update`, `manager_view_time`
- Onboarding and NFR highlights: email invites, first‑day wizard, minimal PII (name, email), EU hosting, daily backups, time zones and DST support, retention policy (TBD), supervisor action audit trail
- Accessibility/UX: keyboard alternatives to drag & drop; responsive day/week views; clear color semantics

Out of scope for MVP:

- External integrations (Outlook/Google/Slack/Teams)
- Advanced notifications/reminders
- KPI dashboards/advanced analytics beyond listed metrics
- Full change history/versioning beyond supervisor audit entries
- Automated scheduling
- Native mobile apps; multilingual UI
- Complex permissions beyond Employee/Manager and technical Admin

For full details, see the PRD: [.ai/prd.md](.ai/prd.md).

## Project status

Version: 0.0.1 (MVP scaffolding). Active development with Astro + React + Tailwind baseline in place; feature implementation is ongoing per the PRD.

## License

MIT
