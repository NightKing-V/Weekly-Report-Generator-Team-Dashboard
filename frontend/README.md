# Weekly Report Generator & Team Dashboard — Frontend

A responsive Single-Page Application (SPA) built with **React 19**, **TypeScript**, **Zustand 5**, **Tailwind CSS v4**, and **Vite**.

Designed for enterprise engineering teams to streamline weekly report drafting, manager review workflows, executive analytics, and interactive AI-driven team intelligence.

---

## 🌟 Key Features

- **Role-Based Navigation & UI**:
  - **Contributor View**: Personal workbench to draft, edit, and submit weekly reports, log blockers, and track approval status.
  - **Manager Review Queue**: Dedicated review dashboard to approve submissions or request corrections with structured feedback.
  - **Executive Analytics**: Recharts-powered compliance trends, workload distributions, and side-by-side blocker comparisons.
  - **User & Project Administration**: Manage workspace team members and assign project codes.
- **Smart Client-Side Caching**:
  - Eliminates duplicate network calls for stable entities (projects, users, audit feeds) when transitioning between pages.
  - Automatic cache invalidation upon create/update mutations.
- **Real Calendar Week Selection**:
  - Replaced manual date range text inputs with standardized Monday-to-Sunday calendar weeks computed from real ISO calendar boundaries (`src/utils/dateUtils.ts`).
- **Comprehensive Report Form**:
  - Dynamic task tracker with planned vs. actual progress (%) and deliverables.
  - Auto-summing time categorization (Development, Testing, Meetings, Documentation, Other).
  - Blocker logs with high-impact key issue flags.
  - Version comparison viewer with reviewer comment history.
- **Floating AI Assistant Modal**:
  - Direct integration with the backend LangGraph + CrewAI agent.
  - Session-scoped chat memory (preserved across minimize/close, automatically reset on browser refresh).
  - Rich markdown formatting for tables, code snippets, and structured deliverable summaries.
- **Status Badges & Toasts**:
  - Global snackbar notifications with HTTP status code badges (`[HTTP 400]`, `[HTTP 401]`, `[HTTP 500]`).

---

## 📋 Prerequisites

- **Node.js**: `20.x` or `18.x` (LTS recommended)
- **npm**: `10.x+` (or `pnpm` / `yarn`)
- **Backend API**: Running at `http://localhost:8000` (see [`backend/README.md`](../backend/README.md))

---

## 🚀 Installation & Local Setup

### 1. Navigate to the Frontend Application Directory
```bash
cd frontend/reporting-app
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Verify or create `.env` inside `frontend/reporting-app/`:
```ini
VITE_API_BASE_URL=http://localhost:8000/api
```

### 4. Start the Vite Development Server
```bash
npm run dev
```

The application will launch with Hot Module Replacement (HMR) at:
👉 **[http://localhost:5173](http://localhost:5173)**

### 5. Production Build & Linting
- **Typecheck & Production Build**:
  ```bash
  npm run build
  ```
- **Lint Check**:
  ```bash
  npm run lint
  ```

---

## 🐳 Running with Docker Compose

The frontend is containerized with hot-reloading enabled. From the repository root:
```bash
docker compose up -d frontend
```

---

## 🗂️ Source Code Structure

```
frontend/reporting-app/src/
├── components/
│   ├── common/                    # Reusable presentational atoms
│   │   ├── MetricCard.tsx         # KPI cards with delta trends
│   │   ├── Modal.tsx              # Accessible dialog backdrop with focus trap
│   │   ├── Navbar.tsx             # Header bar, 1-click user switcher & AI trigger
│   │   ├── PriorityBadge.tsx      # Task priority pill (Low/Med/High/Urgent)
│   │   ├── Sidebar.tsx            # Role-aware navigation drawer
│   │   ├── StatusBadge.tsx        # Report status pill (Draft/Submitted/Approved/Correction)
│   │   └── SnackbarContainer.tsx  # Floating status error & success toast alerts
│   │
│   ├── reports/                   # Reporting domain widgets
│   │   ├── TaskTable.tsx          # Dynamic task CRUD with % planned vs actual
│   │   ├── HoursBreakdown.tsx     # Time category tracker with auto-sum
│   │   ├── ReportForm.tsx         # Weekly submission form with calendar week selection
│   │   ├── VersionHistoryViewer.tsx# Version comparison modal with reviewer comments
│   │   └── ReviewActionModal.tsx  # Manager approval / change request dialog
│   │
│   ├── dashboard/                 # Analytics & visualization components
│   │   ├── AnalyticsCharts.tsx    # Recharts bar, pie, and line charts
│   │   ├── SideBySideComparison.tsx# Cross-team blocker & achievement comparator
│   │   ├── ReportsFilterBar.tsx   # Multi-criteria filter (Week, Project, Status, Search)
│   │   └── ActivityFeed.tsx       # Live audit trail of team submissions
│   │
│   └── ai/                        # AI Assistant components
│       └── AiAssistantModal.tsx   # Floating intelligent chat interface
│
├── pages/                         # Application views & route containers
│   ├── LoginPage.tsx              # Authentication & 1-click evaluation demo accounts
│   ├── PersonalReportPage.tsx     # Contributor submission workbench
│   ├── ReportHistoryPage.tsx      # Personal weekly reports timeline & status tracker
│   ├── ReportDetailPage.tsx      # Read-only submission view with version history
│   ├── TeamDashboardPage.tsx      # Manager analytics dashboard with KPI metrics
│   ├── ManagerReviewPage.tsx      # Dedicated review queue for manager sign-offs
│   ├── TeamMemberProfilePage.tsx  # Contributor deep-dive showing metrics & history
│   ├── ProjectsPage.tsx           # Category & project code administration
│   └── UserManagementPage.tsx     # User invitations and role assignments
│
├── store/                         # Zustand State Management
│   ├── useAuthStore.ts            # Users, current user session, roles, switch user
│   ├── useReportStore.ts          # Reports, projects, activities, review actions, caching
│   ├── useNotificationStore.ts    # Global snackbar and toast alerts state
│   └── index.ts                   # Re-exports all store hooks
│
├── services/
│   └── api.ts                     # REST client with ApiError status handling & pagination
│
├── hooks/
│   └── useFetch.ts                # HTTP status code wrapper with Snackbar triggers
│
├── utils/
│   ├── dateUtils.ts               # ISO Monday-Sunday real calendar calculation
│   └── formatters.ts              # Relative time, status color, and hour utilities
│
├── App.tsx                        # Root layout orchestrator (clean, no provider wrapping)
└── main.tsx                       # React DOM entry point
```

---

## 👥 Demo User Switching

For testing and evaluation convenience, the application includes a **1-Click User Switcher** in the top navigation bar and on the Login page:

| User | Simulated Role | Key Views Enabled |
| :--- | :--- | :--- |
| **System Admin** (`admin@team.com`) | `admin` | User Management & Roles, Projects & Categories, All Manager & Contributor Views |
| **Alex Rivera** (`alex.rivera@team.com`) | `manager` | Manager Review Queue, Team Dashboard Analytics, Contributor Profiles, Personal Reports |
| **Sarah Chen** (`sarah.chen@team.com`) | `team_member` | Personal Report Form, My Reports History, Team Dashboard, AI Assistant |
| **Michael Scott** (`michael.scott@team.com`) | `team_member` | Personal Report Form (*Needs Correction* status), Report History, AI Assistant |

---

## 📖 Architecture Documentation

For in-depth architectural details, store patterns, and component contracts:
👉 **[Frontend Architecture Documentation](../FRONTEND_ARCHITECTURE.md)**

