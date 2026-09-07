import os
import logging
from typing import Optional
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from dotenv import load_dotenv

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

