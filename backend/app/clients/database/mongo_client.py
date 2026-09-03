import os
import logging
from typing import Optional
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from dotenv import load_dotenv

from app.data.mock_data import (
    INITIAL_USERS,
    INITIAL_PROJECTS,
    INITIAL_REPORTS,
    INITIAL_ACTIVITIES,
)

load_dotenv()

logger = logging.getLogger("uvicorn.error")

MONGO_URL = os.getenv(
    "MONGO_URL",
    "mongodb://admin:password123@mongodb:27017/team_dashboard?authSource=admin",
)
DATABASE_NAME = os.getenv("DATABASE_NAME", "team_dashboard")

client: Optional[AsyncIOMotorClient] = None
db: Optional[AsyncIOMotorDatabase] = None


async def connect_to_mongo():
    global client, db
    logger.info(f"Connecting to MongoDB at: {MONGO_URL.split('@')[-1] if '@' in MONGO_URL else MONGO_URL}")
    try:
        client = AsyncIOMotorClient(MONGO_URL, serverSelectionTimeoutMS=5000)
        db = client[DATABASE_NAME]
        # Ping the server to verify connectivity
        await client.admin.command("ping")
        logger.info(f"Successfully connected to MongoDB database: {DATABASE_NAME}")
        await seed_database_if_empty()
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB: {e}")


async def close_mongo_connection():
    global client
    if client:
        client.close()
        logger.info("Closed MongoDB connection.")


def get_database() -> AsyncIOMotorDatabase:
    global db
    if db is None:
        client_fallback = AsyncIOMotorClient(MONGO_URL)
        return client_fallback[DATABASE_NAME]
    return db


def get_collection(name: str):
    database = get_database()
    return database[name]


async def seed_database_if_empty():
    """Seeds initial users, projects, reports, and activity feed if collections are empty."""
    database = get_database()
    users_coll = database["users"]
    user_count = await users_coll.count_documents({})

    if user_count > 0:
        logger.info("MongoDB collections already populated. Skipping seeding.")
        return

    logger.info("Seeding initial dataset into MongoDB...")

    # 1. Seed Users
    await users_coll.insert_many(INITIAL_USERS)

    # 2. Seed Projects
    projects_coll = database["projects"]
    await projects_coll.insert_many(INITIAL_PROJECTS)

    # 3. Seed Reports
    reports_coll = database["reports"]
    await reports_coll.insert_many(INITIAL_REPORTS)

    # 4. Seed Activities
    activities_coll = database["activities"]
    await activities_coll.insert_many(INITIAL_ACTIVITIES)

    logger.info("Database seeding completed successfully.")
