from typing import List, Optional
from fastapi import APIRouter, Depends
from app.models.chats import ActivityFeedModel, ChatQueryRequest, ChatQueryResponse
from app.repositories.chat_repository import chat_repository
from app.models.users import UserModel
from app.middleware.auth import require_authenticated
from app.services.chat.chat_service import chat_service

router = APIRouter(prefix="/api", tags=["Activities & Chat"])


@router.get("/activities", response_model=List[ActivityFeedModel])
async def get_activities(
    limit: int = 50,
    type: Optional[str] = None,
    current_user: UserModel = Depends(require_authenticated),
):
    """Fetch the real-time audit log of report submissions, approvals, and change requests."""
    activities = await chat_repository.get_recent_activities(limit=limit)
    if type and type != "all":
        activities = [a for a in activities if a.get("type") == type]
    return activities


@router.post("/chat/ask", response_model=ChatQueryResponse)
async def ask_chat(
    payload: ChatQueryRequest,
    current_user: UserModel = Depends(require_authenticated),
):
    """
    Intelligent QnA Assistant powered by LangGraph & ChatGroq.
    Leverages report fetch tools and automatically triggers a conversation summarizer every 5 turns.
    Maintains session-only conversational memory in memory (cleared on refresh).
    """
    week = payload.effective_week
    return await chat_service.generate_chat_response(
        query=payload.message,
        week_label=week,
        thread_id=payload.threadId,
        user_id=current_user.id,
    )


