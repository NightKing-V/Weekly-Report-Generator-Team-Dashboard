import os
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.clients.database.mongo_client import connect_to_mongo, close_mongo_connection
from app.data.seeder import seed_database_if_empty
from app.routes.user_routes import router as user_router
from app.routes.report_routes import router as report_router
from app.routes.chat_routes import router as chat_router

load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Connect to MongoDB and idempotently seed dataset if empty
    await connect_to_mongo()
    await seed_database_if_empty()
    yield
    # Shutdown: Close database connections
    await close_mongo_connection()


# Configure CORS origins
cors_origins_raw = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000,https://reportingapp-nine.vercel.app"
)
raw_origins = [origin.strip() for origin in cors_origins_raw.split(",") if origin.strip()]
origins_set = set()
for o in raw_origins:
    clean = o.rstrip("/")
    if clean:
        origins_set.add(clean)
        origins_set.add(f"{clean}/")

# Explicitly guarantee production & development origins
origins_set.add("https://reportingapp-nine.vercel.app")
origins_set.add("https://reportingapp-nine.vercel.app/")
origins_set.add("http://localhost:5173")
origins_set.add("http://127.0.0.1:5173")
origins = list(origins_set)

# Initialize the FastAPI app with lifespan
app = FastAPI(
    title="Weekly Report Generator & Team Dashboard API",
    description="API for weekly reports, manager approval workflows, team metrics, and AI assistant.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"^https://.*\.vercel\.app/?$|^http://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routes
app.include_router(user_router)
app.include_router(report_router)
app.include_router(chat_router)


@app.get("/")
async def root():
    return {
        "status": "online",
        "service": "Weekly Report Generator & Team Dashboard API",
        "docs": "/docs",
    }