# Weekly Report Generator & Team Dashboard — Backend API

An enterprise-ready, asynchronous REST API powered by **FastAPI**, **MongoDB (Motor)**, **Pydantic v2**, and an agentic AI intelligence layer orchestrating **LangGraph**, **CrewAI**, and **Groq LLM**.

---

## 🌟 Key Features

- **Layered Architecture**: Strict separation of concerns across Routes, Domain Services, Repositories, and MongoDB.
- **Role-Based Access Control (RBAC)**: Fine-grained permissions enforced via dependency injection for `team_member`, `manager`, and `admin`.
- **Workflow State Machine**: Supports complete weekly report lifecycle: `Draft` ➔ `Submitted` ➔ `Needs Correction` ➔ `Approved`.
- **Immutable Version History**: Full snapshot tracking and review comment audit logs stored with every report version.
- **Automated KPI Metrics**: Calculates live submission compliance, pending reviews, approved deliverables, and open team blockers.
- **Intelligent QnA Assistant**:
  - **CrewAI Chat Crew**: Autonomous agent equipped with 5 specialized tools to search reports, analyze individual contributor progress, inspect KPI metrics, and flag blockers.
  - **LangGraph StateGraph**: Maintains session conversational memory (`MemorySaver`) and triggers an automatic rolling summarizer every 5 turns.
  - **Groq LLM Provider**: High-throughput inference via `ChatGroq` with runtime LiteLLM compatibility patches.
- **Standardized Calendar**: ISO Monday-to-Sunday weekly reporting boundaries.
- **Auto-Seeding**: Seeds initial users, projects, reports, and activity logs on first boot.

---

## 📋 Prerequisites

- **Python**: `3.12+` (or `3.11+`)
- **MongoDB**: `7.0+` (local service, Atlas instance, or via Docker)
- **Groq API Key**: Obtain a free API key at [console.groq.com](https://console.groq.com)

---

## 🚀 Installation & Local Setup

### 1. Navigate to the Backend Directory
```bash
cd backend
```

### 2. Create and Activate a Virtual Environment
- **Windows (PowerShell)**:
  ```powershell
  python -m venv venv
  .\venv\Scripts\Activate.ps1
  ```
- **macOS / Linux**:
  ```bash
  python3 -m venv venv
  source venv/bin/activate
  ```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables
Copy the example configuration file:
```bash
cp .env.example .env
```
Edit `.env` and provide your settings:

```ini
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/team_dashboard?authSource=admin
MONGODB_DB_NAME=team_dashboard

# JWT Authentication
JWT_SECRET_KEY=supersecretjwtsecretkeyformonthlyreporting123456
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Groq LLM & AI Agent Configuration
GROQ_API_KEY=gsk_your_actual_groq_api_key_here
GROQ_MODEL=qwen/qwen3.8-27b
GROQ_MODEL_SMALL=qwen/qwen3.8-27b
GROQ_MODEL_LARGE=qwen/qwen3.8-27b

# CORS Configuration
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

> **Note on Groq Models**: Fast and reliable models on Groq include `qwen/qwen3.8-27b`, `openai/gpt-oss-20b`, or `llama-3.3-70b-versatile` depending on your account tier.

### 5. Start MongoDB
If using Docker for MongoDB:
```bash
docker run -d --name mongodb -p 27017:27017 mongo:7.0
```

### 6. Run the FastAPI Development Server
```bash
uvicorn main:app --reload --port 8000
```

The API will start at: `http://localhost:8000`
- **Interactive Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Alternative ReDoc UI**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

## 🐳 Running with Docker Compose

To run the backend as part of the containerized stack:
```bash
# From the repository root
docker compose up -d backend mongodb
```
To view backend logs:
```bash
docker logs -f backend
```

---

## 🗂️ Directory Structure

```
backend/
├── app/
│   ├── clients/
│   │   └── database/
│   │       └── mongo_client.py     # Motor async client & auto-seeder
│   ├── data/
│   │   └── mock_data.py            # Initial seed dataset
│   ├── llm/                        # LLM Provider Factory Layer
│   │   ├── LLMFactory.py           # Provider registry
│   │   ├── LLMProvider.py          # Abstract base class
│   │   ├── tiers.py                # Model tier definitions (SMALL, STANDARD, LARGE)
│   │   └── clients/
│   │       └── groq_client.py      # Groq client & LiteLLM patches
│   ├── middleware/
│   │   └── auth.py                 # JWT token decoding & RBAC route dependencies
│   ├── models/                     # Pydantic v2 schemas
│   │   ├── users.py                # UserModel, LoginRequest, AuthResponse
│   │   ├── reports.py              # WeeklyReportModel, Tasks, Blockers, Projects
│   │   └── chats.py                # ActivityFeedModel, ChatQuery schemas
│   ├── repositories/               # Asynchronous database data access
│   │   ├── report_repository.py    # Report CRUD, filtering, pagination
│   │   ├── user_repository.py      # User retrieval & role updates
│   │   └── chat_repository.py      # Real-time activity feed queries
│   ├── routes/                     # FastAPI controllers
│   │   ├── user_routes.py          # Auth & user endpoints
│   │   ├── report_routes.py        # Reports, reviews, KPI metrics, projects
│   │   └── chat_routes.py          # Audit log & AI assistant endpoints
│   └── services/                   # Business logic layer
│       ├── reports/
│       │   └── report_service.py   # State transitions, KPI calculations, audits
│       └── chat/
│           ├── chat_service.py     # Chat coordinator
│           ├── graph.py            # LangGraph StateGraph (QnA + Summarizer)
│           └── crew.py             # CrewAI Chat Crew & Report Tools
├── main.py                         # Application lifespan & router mounting
├── requirements.txt                # Python dependencies
└── Dockerfile                      # Backend container definition
```

---

## 📡 API Reference

### 🔐 Authentication & Users (`/api/users`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/users/login` | Authenticates with email and password, returns JWT | Public |
| `POST` | `/api/users/register` | Registers a new user account | Public |
| `GET` | `/api/users/me` | Returns profile of the currently logged-in user | Authenticated |
| `GET` | `/api/users` | Lists all users in the workspace | Authenticated |
| `GET` | `/api/users/{id}` | Retrieves a user by their unique ID | Authenticated |
| `PUT` | `/api/users/{id}/role` | Promotes or demotes user role | **Admin Only** |

### 📝 Reports & Reviews (`/api/reports`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/reports` | Paginated reports with filters (`week_label`, `project_id`, `status`, `search`) | Authenticated |
| `GET` | `/api/reports/{id}` | Fetches a single report with full version history | Authenticated |
| `POST` | `/api/reports/draft` | Creates or saves an editable draft report | Authenticated |
| `POST` | `/api/reports/submit` | Submits report for review and creates version snapshot | Authenticated |
| `POST` | `/api/reports/{id}/review` | Approves or requests changes with comments | **Manager / Admin** |
| `GET` | `/api/reports/metrics/summary` | Calculates live team compliance & blocker KPIs | Authenticated |
| `GET` | `/api/reports/projects/all` | Lists all active project codes & categories | Authenticated |

### 🤖 Activities & AI Assistant (`/api`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/activities` | Retrieves the real-time team audit log | Authenticated |
| `POST` | `/api/chat/ask` | LangGraph + CrewAI intelligent assistant query | Authenticated |

---

## 🧪 Demo User Accounts

The database auto-seeds with these test profiles (default password for all: `password123`):

| Name | Email | Role | Department |
| :--- | :--- | :--- | :--- |
| **System Admin** | `admin@team.com` | `admin` | IT & Security |
| **Alex Rivera** | `alex.rivera@team.com` | `manager` | Core Platform (Lead) |
| **Sarah Chen** | `sarah.chen@team.com` | `team_member` | Product UI |
| **Michael Scott** | `michael.scott@team.com` | `team_member` | Cloud Services |

---

## 📐 Architecture & Database Documentation

- 📖 Detailed architectural breakdown: [`BACKEND_ARCHITECTURE.md`](../BACKEND_ARCHITECTURE.md)
- 🗄️ Visual Database ER Diagram (Draw.io format): [`database_er_diagram.drawio`](../database_er_diagram.drawio)

