from typing import List, Optional
from app.clients.database.mongo_client import get_collection


class UserRepository:
    def __init__(self):
        self._collection_name = "users"

    @property
    def collection(self):
        return get_collection(self._collection_name)

    async def get_all_users(self) -> List[dict]:
        """Fetch all users from MongoDB, excluding MongoDB's internal _id and password hash."""
        cursor = self.collection.find({}, {"_id": 0, "hashedPassword": 0})
        return await cursor.to_list(length=100)

    async def get_user_by_id(self, user_id: str) -> Optional[dict]:
        """Find a single user by their custom string ID, excluding password hash."""
        return await self.collection.find_one({"id": user_id}, {"_id": 0, "hashedPassword": 0})

    async def get_user_by_email(self, email: str) -> Optional[dict]:
        """Find a single user by email address (case-insensitive), excluding password hash."""
        return await self.collection.find_one(
            {"email": {"$regex": f"^{email.strip()}$", "$options": "i"}},
            {"_id": 0, "hashedPassword": 0},
        )

    async def get_user_with_password(self, email: str) -> Optional[dict]:
        """Find user by email address including hashedPassword for authentication verification."""
        return await self.collection.find_one(
            {"email": {"$regex": f"^{email.strip()}$", "$options": "i"}},
            {"_id": 0},
        )

    async def create_user(self, user_data: dict) -> dict:
        """Insert a new user document."""
        await self.collection.insert_one(dict(user_data))
        return await self.get_user_by_id(user_data["id"])

    async def update_user_role(self, user_id: str, new_role: str) -> Optional[dict]:
        """Update a user's role."""
        result = await self.collection.update_one(
            {"id": user_id},
            {"$set": {"role": new_role}},
        )
        if result.matched_count == 0:
            return None
        return await self.get_user_by_id(user_id)

    async def update_user_password(self, user_id: str, hashed_password: str) -> bool:
        """Update a user's password hash."""
        result = await self.collection.update_one(
            {"id": user_id},
            {"$set": {"hashedPassword": hashed_password}},
        )
        return result.modified_count > 0

    async def delete_user(self, user_id: str) -> bool:
        """Remove a user document."""
        result = await self.collection.delete_one({"id": user_id})
        return result.deleted_count > 0

    async def count_users(self, filter_query: Optional[dict] = None) -> int:
        """Count users matching optional filter."""
        return await self.collection.count_documents(filter_query or {})


# Default singleton instance
user_repository = UserRepository()
