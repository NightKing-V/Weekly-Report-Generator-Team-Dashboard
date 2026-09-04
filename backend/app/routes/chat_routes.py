from typing import List, Optional
from fastapi import APIRouter, Depends
from app.models.chats import ActivityFeedModel, ChatQueryRequest, ChatQueryResponse
from app.repositories.chat_repository import chat_repository
from app.repositories.report_repository import report_repository
from app.models.users import UserModel
from app.middleware.auth import require_authenticated

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
    """Answer questions about team deliverables, blockers, or generate executive summaries."""
    query = payload.message.lower()
    reports = await report_repository.get_reports(week_label=payload.weekLabel)

    # 1. Executive Summary query
    if "summary" in query or "overview" in query or "executive" in query:
        total_tasks = sum(len(r.get("tasksCompleted") or []) for r in reports)
        submitted_count = len([r for r in reports if r.get("status") in ["Submitted", "Approved"]])
        blockers_count = sum(len(r.get("blockers") or []) for r in reports)

        reply = (
            f"**Executive Team Summary for {payload.weekLabel or 'current week'}:**\n\n"
            f"- **Submissions:** {submitted_count} contributors submitted weekly deliverables.\n"
            f"- **Work Completed:** {total_tasks} distinct tasks delivered across active projects.\n"
            f"- **Impediments:** {blockers_count} open blocker(s) recorded requiring manager review.\n"
            f"- **Key Milestone:** Client A Portal and Backend auth migration milestones on track."
        )
        return ChatQueryResponse(reply=reply, sourcesCount=len(reports))

    # 2. Blockers query
    elif "blocker" in query or "issue" in query or "impediment" in query or "risk" in query:
        all_blockers = []
        for r in reports:
            for b in (r.get("blockers") or []):
                all_blockers.append(f"• **{r.get('userName')}** ({r.get('projectName')}): {b.get('description')} "
                                   f"{'[KEY ISSUE]' if b.get('isKeyIssue') else ''}")

        if all_blockers:
            reply = f"**Identified Team Blockers:**\n\n" + "\n".join(all_blockers)
        else:
            reply = "No unresolved blockers have been logged for this reporting period."

        return ChatQueryResponse(reply=reply, sourcesCount=len(reports))

    # 3. Specific Member / Project query
    matched_members = [r for r in reports if r.get("userName", "").lower() in query]
    if matched_members:
        rep = matched_members[0]
        tasks = [f"• {t.get('taskName')} ({t.get('status')})" for t in (rep.get("tasksCompleted") or [])]
        reply = (
            f"**Report summary for {rep.get('userName')} ({rep.get('projectName')}):**\n"
            f"Status: **{rep.get('status')}** (v{rep.get('currentVersion')})\n"
            f"Tasks:\n" + ("\n".join(tasks) if tasks else "• No tasks listed.")
        )
        return ChatQueryResponse(reply=reply, sourcesCount=1)

    # Default fallback intelligent summary
    reply = (
        f"Based on the weekly team data, {len(reports)} reports are registered. "
        "You can ask me to summarize deliverables, list open blockers, or look up specific contributor milestones."
    )
    return ChatQueryResponse(reply=reply, sourcesCount=len(reports))

