from typing import Optional, Literal
from pydantic import BaseModel

ActivityType = Literal["submitted", "approved", "correction_requested", "draft_saved"]


class ActivityFeedModel(BaseModel):
    id: str
    type: ActivityType
    actorName: str
    actorRole: str
    reportId: Optional[str] = None
    weekLabel: Optional[str] = None
    message: str
    timestamp: str

    class Config:
        populate_by_name = True


class ActivityCreate(BaseModel):
    type: ActivityType
    actorName: str
    actorRole: str
    reportId: Optional[str] = None
    weekLabel: Optional[str] = None
    message: str


class ChatMessageModel(BaseModel):
    id: str
    sender: Literal["user", "assistant"]
    text: str
    timestamp: str


class ChatQueryRequest(BaseModel):
    message: str
    weekLabel: Optional[str] = None
    selectedWeek: Optional[str] = None
    threadId: Optional[str] = None

    @property
    def effective_week(self) -> Optional[str]:
        return self.weekLabel or self.selectedWeek


class ChatQueryResponse(BaseModel):
    reply: str
    sourcesCount: int = 0
    threadId: Optional[str] = None
    summary: Optional[str] = None
    responseCount: int = 0

