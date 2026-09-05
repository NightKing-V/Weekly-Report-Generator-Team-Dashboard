"""Database Seeder Module.

Idempotently seeds initial users, projects, reports, and activities into MongoDB.
Uses unique indexes and $setOnInsert upserts to prevent duplicate records
across multiple deployments or concurrent serverless cold starts.
"""

import os
import asyncio
import logging
from app.clients.database.mongo_client import get_database
from app.data.mock_data import (
    INITIAL_USERS,
    INITIAL_PROJECTS,
    INITIAL_REPORTS,
    INITIAL_ACTIVITIES,
    DEFAULT_HASHED_PASSWORD,
)

logger = logging.getLogger("uvicorn.error")


async def ensure_indexes():
    """Create unique indexes to physically prevent duplicate documents across deployments."""
    database = get_database()
    try:
        await database["users"].create_index("id", unique=True)
        await database["users"].create_index("email", unique=True)
        await database["projects"].create_index("id", unique=True)
        await database["projects"].create_index("code", unique=True)
        await database["reports"].create_index("id", unique=True)
        await database["activities"].create_index("id", unique=True)
        logger.info("MongoDB unique indexes verified.")
    except Exception as e:
        logger.warning(f"Note on MongoDB index verification: {e}")


async def seed_database_if_empty():
    """Idempotently seeds initial users, projects, reports, and activities without creating duplicates.
    
    1. Checks each collection independently.
    2. Uses $setOnInsert upserts on unique 'id' to guarantee duplicate-free idempotency.
    3. Respects AUTO_SEED=false environment variable for production control.
    """
    auto_seed = os.getenv("AUTO_SEED", "true").lower() in ("true", "1", "yes")
    if not auto_seed:
        logger.info("AUTO_SEED is set to false. Skipping database seeding.")
        return

    # Ensure unique indexes are established before seeding
    await ensure_indexes()

    database = get_database()

    # 1. Seed Users (only if not already present)
    users_coll = database["users"]
    user_count = await users_coll.count_documents({})
    if user_count == 0:
        logger.info("Seeding initial users into MongoDB...")
        for u in INITIAL_USERS:
            await users_coll.update_one(
                {"id": u["id"]},
                {"$setOnInsert": u},
                upsert=True,
            )
    else:
        # Ensure password exists on any existing accounts
        await users_coll.update_many(
            {"hashedPassword": {"$exists": False}},
            {"$set": {"hashedPassword": DEFAULT_HASHED_PASSWORD}},
        )

    # 2. Seed Projects (only if not already present)
    projects_coll = database["projects"]
    proj_count = await projects_coll.count_documents({})
    if proj_count == 0:
        logger.info("Seeding initial projects into MongoDB...")
        for p in INITIAL_PROJECTS:
            await projects_coll.update_one(
                {"id": p["id"]},
                {"$setOnInsert": p},
                upsert=True,
            )

    # 3. Seed Reports (only if not already present)
    reports_coll = database["reports"]
    rep_count = await reports_coll.count_documents({})
    if rep_count == 0:
        logger.info("Seeding initial reports into MongoDB...")
        for r in INITIAL_REPORTS:
            await reports_coll.update_one(
                {"id": r["id"]},
                {"$setOnInsert": r},
                upsert=True,
            )

    # 4. Seed Activities (only if not already present)
    activities_coll = database["activities"]
    act_count = await activities_coll.count_documents({})
    if act_count == 0:
        logger.info("Seeding initial activities into MongoDB...")
        for a in INITIAL_ACTIVITIES:
            await activities_coll.update_one(
                {"id": a["id"]},
                {"$setOnInsert": a},
                upsert=True,
            )

    logger.info("MongoDB collections check and idempotent seeding completed.")


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
    from app.clients.database.mongo_client import connect_to_mongo, close_mongo_connection

    async def main():
        await connect_to_mongo()
        await seed_database_if_empty()
        await close_mongo_connection()

    asyncio.run(main())

