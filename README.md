# Weekly Report Generator & Team Dashboard

An enterprise-ready Weekly Report Generator and Team Dashboard system built with **FastAPI**, **MongoDB**, **React 19**, **Redux Toolkit**, and **Tailwind CSS v4**.

---

## 📖 Architecture & Design Documentation

For an in-depth breakdown of the frontend architectural patterns, code responsibilities, props organization, and data flows, refer to:

👉 **[Frontend Architecture Documentation](frontend/reporting-app/FRONTEND_ARCHITECTURE.md)**

---

## 🚀 Quick Start (Docker Compose)

The entire stack (MongoDB, FastAPI backend, and React frontend) is containerized and managed via Docker Compose.

### 1. Start All Services
```bash
docker compose up -d
```

### 2. Service Endpoints
| Service | URL | Description |
| :--- | :--- | :--- |
| **Frontend UI** | [http://localhost:5173](http://localhost:5173) | Single-page application with role-based dashboard |
| **Backend API** | [http://localhost:8000](http://localhost:8000) | FastAPI REST endpoints |
| **Swagger Docs**| [http://localhost:8000/docs](http://localhost:8000/docs) | Interactive API documentation |
| **MongoDB** | `localhost:27017` | Direct connection via MongoDB Compass |

---

## 🛠️ Project Structure

```
├── backend/
│   ├── app/
│   │   ├── clients/database/   # Motor async MongoDB client & auto-seeder
│   │   ├── data/               # Seed dataset (users, projects, reports, activities)
│   │   ├── models/             # Pydantic schemas (users, reports, chats)
│   │   ├── repositories/       # Async database queries
│   │   ├── routes/             # REST controllers (users, reports, chat)
│   │   └── services/           # Service layer stubs reserved for business logic
│   ├── Dockerfile
│   └── main.py                 # FastAPI application & lifespan
│
├── frontend/
│   ├── reporting-app/
│   │   ├── FRONTEND_ARCHITECTURE.md  # Detailed frontend design documentation
│   │   ├── src/
│   │   │   ├── props/          # Modular component & page props contracts
│   │   │   ├── types/          # Domain entity interfaces
│   │   │   ├── services/       # Remote API client (api.ts) with ApiError
│   │   │   ├── hooks/          # Custom hooks (useFetch.ts) with status code snackbars
│   │   │   ├── store/          # Redux Toolkit store & slices (auth, reports, notification)
│   │   │   ├── context/        # Adapter facades (AuthContext, ReportContext)
│   │   │   ├── components/     # UI atoms, report widgets, analytics charts, AI assistant
│   │   │   ├── pages/          # Application views & route containers
│   │   │   └── utils/          # Formatting & hour calculation helpers
│   ├── Dockerfile
│   └── .env
│
├── docker-compose.yml
└── README.md
```

