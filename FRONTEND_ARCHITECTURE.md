# Frontend Architecture & Design Documentation (Zustand Edition)

## 1. Architectural Overview

The **Weekly Report Generator & Team Dashboard** frontend is built as a single-page application (SPA) using **React 19**, **TypeScript**, **Zustand 5**, **Tailwind CSS v4**, and **Vite**.

State management is powered by **Zustand**, providing high-performance, hook-based stores with minimal boilerplate, direct `async/await` execution, smart in-memory caching, fine-grained selector re-rendering, and no root `<Provider>` wrapping requirement.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                   Browser UI                                    │
│  ┌───────────────────────┐  ┌────────────────────────────────────────────────┐  │
│  │   Pages (Containers)  │  │        Presentational & Common Components      │  │
│  │  • PersonalReportPage │  │  • ReportForm        • AnalyticsCharts         │  │
│  │  • TeamDashboardPage  │  │  • TaskTable         • ReportsFilterBar        │  │
│  │  • ManagerReviewPage  │  │  • AiAssistantModal  • SnackbarContainer       │  │
│  └───────────┬───────────┘  └───────────────────────▲────────────────────────┘  │
│              │                                      │ (Props from src/props/)   │
│              ▼                                      │                           │
│  ┌───────────────────────┐                          │                           │
│  │   Custom Hooks Layer  │                          │                           │
│  │  • useFetch.ts        │                          │                           │
│  └───────────┬───────────┘                          │                           │
│              │                                      │                           │
│              ▼                                      │                           │
│  ┌──────────────────────────────────────────────────┴────────────────────────┐  │
│  │                      Zustand Stores (`src/store/`)                        │  │
│  │   • `useAuthStore`      • `useReportStore`       • `useNotificationStore` │  │
│  │   (Smart Caching, Selector Subscriptions, Direct async/await actions)     │  │
│  └───────────────────────────────────┬──────────────────────────────────────┘  │
│                                      │                                          │
│                                      ▼                                          │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │                   API Service Client (`src/services/api.ts`)              │  │
│  │         Async fetch calls, HTTP status code translation & ApiError        │  │
│  └───────────────────────────────────┬───────────────────────────────────────┘  │
└──────────────────────────────────────┼──────────────────────────────────────────┘
                                       ▼ HTTP / REST (JWT Bearer)
                     ┌───────────────────────────────────┐
                     │       FastAPI Backend (:8000)     │
                     │       MongoDB Database (:27017)   │
                     └───────────────────────────────────┘
```

---

## 2. Directory Structure & File Map

```
frontend/reporting-app/src/
├── props/                         # Component and Page Props type contracts
│   ├── commonProps.ts             # Shared UI component props & NavigationTab
│   ├── reportProps.ts             # Report forms, tables, versions, review modals
│   ├── dashboardProps.ts          # Analytics charts, filters, comparison, feed
│   ├── pageProps.ts               # Page container props
│   ├── aiProps.ts                 # AI assistant dialog props
│   └── index.ts                   # Central barrel re-export
│
├── types/                         # Domain entities & data models
│   └── index.ts                   # User, WeeklyReport, Task, Blocker, Metrics, etc.
│
├── services/                      # Remote API client & HTTP communication
│   └── api.ts                     # REST client with ApiError status handling & pagination
│
├── hooks/                         # Custom React Hooks
│   └── useFetch.ts                # HTTP status code wrapper with Snackbar triggers
│
├── store/                         # Zustand State Management
│   ├── useAuthStore.ts            # Users, current user session, roles, switch user
│   ├── useReportStore.ts          # Reports, projects, activities, review actions, caching
│   ├── useNotificationStore.ts    # Global snackbar and toast alerts state
│   └── index.ts                   # Re-exports all Zustand store hooks
│
├── context/                       # Adapter layer bridging stores to useAuth() & useReports()
│   ├── AuthContext.tsx            # Direct export: export const useAuth = useAuthStore
│   └── ReportContext.tsx          # Direct export: export const useReports = useReportStore
│
├── components/
│   ├── common/                    # Reusable presentational atoms and layout elements
│   │   ├── MetricCard.tsx         # KPI metric card with trends and icons
│   │   ├── Modal.tsx              # Accessible dialog backdrop with focus trap
│   │   ├── Navbar.tsx             # Header bar with user profile switcher & AI trigger
│   │   ├── PriorityBadge.tsx      # Color-coded task priority badge (Low/Med/High/Urgent)
│   │   ├── Sidebar.tsx            # Role-aware navigation drawer
│   │   ├── StatusBadge.tsx        # Report status pill (Draft/Submitted/Approved/Correction)
│   │   └── SnackbarContainer.tsx  # Floating HTTP status error & success notifications
│   │
│   ├── reports/                   # Reporting domain components
│   │   ├── TaskTable.tsx          # Dynamic task CRUD with % planned vs actual & deliverables
│   │   ├── HoursBreakdown.tsx     # Time category tracker with auto-sum calculation
│   │   ├── ReportForm.tsx         # Weekly submission form with calendar week selection
│   │   ├── VersionHistoryViewer.tsx# Version comparison modal with reviewer comments
│   │   └── ReviewActionModal.tsx  # Manager approval / change request dialog
│   │
│   ├── dashboard/                 # Analytics & visualization components
│   │   ├── AnalyticsCharts.tsx    # Recharts bar, pie, and line workload visualizations
│   │   ├── SideBySideComparison.tsx# Horizontal cross-team blocker & achievement comparator
│   │   ├── ReportsFilterBar.tsx   # Multi-criteria filter (Week, Member, Project, Status, Search)
│   │   └── ActivityFeed.tsx       # Live audit trail of team submissions and reviews
│   │
│   └── ai/                        # AI Assistant components
│       └── AiAssistantModal.tsx   # Floating intelligent assistant with session chat memory
│
├── pages/                         # Route / Page containers
│   ├── LoginPage.tsx              # Authentication & 1-click evaluation demo accounts
│   ├── PersonalReportPage.tsx     # Contributor submission workbench
│   ├── ReportHistoryPage.tsx      # Personal weekly reports timeline & status tracker
│   ├── ReportDetailPage.tsx      # Read-only submission view with version history
│   ├── TeamDashboardPage.tsx      # Manager analytics dashboard with KPI metrics
│   ├── ManagerReviewPage.tsx      # Dedicated review queue for manager sign-offs
│   ├── TeamMemberProfilePage.tsx  # Contributor deep-dive showing metrics, assignments, and history
│   ├── ProjectsPage.tsx           # Category & project code administration
│   └── UserManagementPage.tsx     # User invitations and role assignments
│
├── utils/
│   ├── dateUtils.ts               # ISO Monday-Sunday real calendar calculation & week labels
│   └── formatters.ts              # Relative time, status color, and hour utilities
│
├── App.tsx                        # Root layout orchestrator (clean, no provider wrapping)
└── main.tsx                       # React DOM entry point
```

---

## 3. Zustand Design Patterns & State Architecture

### 3.1 Hook-Based Stores (No Root Providers)
- Stores are instantiated using `create()` and exported directly as custom React hooks (`useAuthStore`, `useReportStore`, `useNotificationStore`).
- **Zero Root Provider Overhead**: Components consume store state directly without `<Provider store={...}>` tree pollution.
- **Imperative Access Outside React**: Utility functions, Axios/fetch interceptors, and non-component handlers access store state imperatively via `useAuthStore.getState()` and `useAuthStore.setState()`.

### 3.2 Smart Client-Side Caching
To eliminate redundant network waterfalls when navigating between views:
- `fetchProjects()` checks `if (get().projects.length > 0) return;` before dispatching API requests.
- `fetchUsers()` checks `if (get().users.length > 0) return;`.
- `fetchActivities()` caches recent feed items while supporting manual pull-to-refresh.
- Data mutations (creating a project, updating a role) explicitly invalidate cache entries to guarantee consistency.

### 3.3 Fine-Grained Selector Re-rendering
Components subscribe strictly to the state properties they consume:
```tsx
const currentUser = useAuthStore((state) => state.currentUser);
const currentWeek = useReportStore((state) => state.selectedWeek);
```
Updates to unrelated slice fields (such as `projects` or `loading`) will **not** trigger re-renders in subscriber components.

### 3.4 Direct Async Action Execution
Asynchronous logic and state mutations live together as readable methods on the store:
```ts
submitReport: async (reportData) => {
  const submitted = await apiClient.reports.submit(reportData);
  set((state) => ({ reports: [submitted, ...state.reports] }));
  return submitted;
}
```

### 3.5 Adapter Pattern (`src/context/`)
To guarantee backward compatibility with legacy hooks:
```ts
export const useAuth = useAuthStore;
export const useReports = useReportStore;
```

---

## 4. Calendar Standardization & Week Selection (`dateUtils.ts`)

Manual date range text inputs have been completely removed from the report submission interface. All dates are strictly derived from real calendar boundaries:

1. **Monday to Sunday Period**: Every reporting cycle starts on Monday at 00:00:00 and ends on Sunday at 23:59:59.
2. **Dynamic Generation**: `generateCalendarWeeks()` computes the current ISO calendar week, past historical weeks, and upcoming weeks based on real system dates.
3. **Consistent Labeling**: Outputs standardized strings (e.g. `Week 36 (Aug 31 - Sep 06, 2026)`), matching backend indexing keys.

---

## 5. AI Assistant Modal & Session Memory (`AiAssistantModal.tsx`)

- **Session-Only Memory**: Initializes a unique session `threadId` via `crypto.randomUUID()` when the application opens.
- **Lifecycle Persistence**: Chat state is maintained in React state while the modal is minimized or closed. When the user performs a full browser page refresh, the session resets cleanly without leaving stale data in the database.
- **Rich Markdown Formatting**: Supports structured markdown rendering, tables, bullet points, and code snippets returned by the backend CrewAI agents.
- **Context Injection**: Automatically attaches the currently viewed `weekLabel` to user queries, providing the AI assistant with temporal context.

---

## 6. Build & Lint Verification Standards

- **Production Build**: `npm run build` compiles with `tsc -b && vite build` with **0 errors**.
- **Linting**: `npm run lint` passes with **0 errors**.
- **Docker Ready**: Fully containerized with hot-reloading dev server on port `5173`.
