import os
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.clients.database.mongo_client import connect_to_mongo, close_mongo_connection
from app.routes.user_routes import router as user_router
from app.routes.report_routes import router as report_router
from app.routes.chat_routes import router as chat_router

load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Connect to MongoDB and seed dataset if empty
    await connect_to_mongo()
    yield
    # Shutdown: Close database connections
    await close_mongo_connection()


# Configure CORS origins
cors_origins_raw = os.getenv("CORS_ORIGINS", "http://localhost:5173")
origins = [origin.strip() for origin in cors_origins_raw.split(",") if origin.strip()]

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