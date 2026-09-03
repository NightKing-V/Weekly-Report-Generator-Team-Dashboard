from typing import List, Optional
from app.clients.database.mongo_client import get_collection


class ChatRepository:
    def __init__(self):
        self._activities_coll_name = "activities"
        self._messages_coll_name = "chat_messages"

    @property
    def activities_collection(self):
        return get_collection(self._activities_coll_name)

    @property
    def messages_collection(self):
        return get_collection(self._messages_coll_name)

    async def get_recent_activities(self, limit: int = 50) -> List[dict]:
        """Fetch audit activity log sorted by latest timestamp first."""
        cursor = self.activities_collection.find({}, {"_id": 0}).sort("timestamp", -1).limit(limit)
        return await cursor.to_list(length=limit)

    async def add_activity(self, activity_data: dict) -> dict:
        """Record an activity in the audit feed."""
        await self.activities_collection.insert_one(dict(activity_data))
        return activity_data

    async def save_chat_message(self, message_data: dict) -> dict:
        """Store conversational message for history."""
        await self.messages_collection.insert_one(dict(message_data))
        return message_data


# Default singleton instance
chat_repository = ChatRepository()

