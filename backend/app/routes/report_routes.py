import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, status
from app.models.reports import (
    WeeklyReportModel,
    ReportSaveDraftRequest,
    ReportSubmitRequest,
    ReportReviewActionRequest,
    ProjectModel,
    ProjectCreate,
    ProjectUpdate,
    DashboardMetricsModel,
    ReviewCommentModel,
    ReportVersionModel,
)
from app.repositories.report_repository import report_repository
from app.repositories.user_repository import user_repository
from app.repositories.chat_repository import chat_repository

router = APIRouter(prefix="/api", tags=["Reports & Projects"])


# -----------------------------------------------------------------
# Weekly Reports Endpoints
# -----------------------------------------------------------------
@router.get("/reports", response_model=List[WeeklyReportModel])
async def list_reports(
    week: Optional[str] = Query(None, description="Week label filter"),
    user_id: Optional[str] = Query(None, description="User ID filter"),
    project_id: Optional[str] = Query(None, description="Project ID filter"),
    status: Optional[str] = Query(None, description="Status filter"),
):
    """Retrieve weekly reports matching optional query filters."""
    reports = await report_repository.get_reports(
        week_label=week,
        user_id=user_id,
        project_id=project_id,
        status=status,
    )
    return reports


@router.get("/reports/metrics/summary", response_model=DashboardMetricsModel)
async def get_metrics(week: str = Query(..., description="Target week label")):
    """Compute KPI metrics for team dashboard for the specified week."""
    week_reports = await report_repository.get_reports(week_label=week)
    team_members = await user_repository.get_all_users()
    member_count = len([u for u in team_members if u.get("role") == "team_member"])

    submitted = [r for r in week_reports if r.get("status") in ["Submitted", "Approved"]]
    approved = [r for r in week_reports if r.get("status") == "Approved"]
    needs_corr = [r for r in week_reports if r.get("status") == "Needs Correction"]
    pending = [r for r in week_reports if r.get("status") == "Submitted"]

    open_blockers = sum(len(r.get("blockers", [])) for r in week_reports)

    compliance = (
        round(((len(submitted) + len(needs_corr)) / member_count) * 100)
        if member_count > 0
        else 0
    )

    return DashboardMetricsModel(
        totalSubmittedThisWeek=len(submitted),
        submissionComplianceRate=compliance,
        needsCorrectionCount=len(needs_corr),
        openBlockersCount=open_blockers,
        totalTeamMembers=member_count,
        approvedCount=len(approved),
        pendingReviewCount=len(pending),
    )


@router.get("/reports/{report_id}", response_model=WeeklyReportModel)
async def get_report(report_id: str):
    """Retrieve full details of a weekly report."""
    report = await report_repository.get_report_by_id(report_id)
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Report with id '{report_id}' was not found.",
        )
    return report


@router.post("/reports/draft", response_model=WeeklyReportModel)
async def save_draft(payload: ReportSaveDraftRequest):
    """Save or update an in-progress draft report."""
    now = datetime.utcnow().isoformat() + "Z"
    existing = None

    if payload.id:
        existing = await report_repository.get_report_by_id(payload.id)
    elif payload.userId and payload.weekLabel:
        existing = await report_repository.get_user_report_for_week(
            payload.userId, payload.weekLabel
        )

    # Resolve project name
    project_name = "General Project"
    if payload.projectId:
        proj = await report_repository.get_project_by_id(payload.projectId)
        if proj:
            project_name = proj.get("name", project_name)

    if existing:
        payload_data = payload.dict(exclude_unset=True)
        payload_data.pop("id", None)
        report_data = {
            **existing,
            **payload_data,
            "id": existing["id"],
            "status": "Draft",
            "updatedAt": now,
        }
        if payload.projectId:
            report_data["projectName"] = project_name
        return await report_repository.upsert_report(report_data)
    else:
        new_report = {
            "id": payload.id or f"rep-{payload.userId or 'anon'}-{uuid.uuid4().hex[:8]}",
            "userId": payload.userId or "user-anon",
            "userName": payload.userName or "Team Member",
            "userTitle": payload.userTitle or "Software Engineer",
            "userDepartment": payload.userDepartment or "Engineering",
            "weekStartDate": payload.weekStartDate or "2026-08-31",
            "weekEndDate": payload.weekEndDate or "2026-09-06",
            "weekLabel": payload.weekLabel or "Week 36 (Aug 31 - Sep 06, 2026)",
            "projectId": payload.projectId or "proj-1",
            "projectName": project_name,
            "status": "Draft",
            "tasksCompleted": [t.dict() for t in (payload.tasksCompleted or [])],
            "tasksPlannedNextWeek": [t.dict() for t in (payload.tasksPlannedNextWeek or [])],
            "blockers": [b.dict() for b in (payload.blockers or [])],
            "achievements": [a.dict() for a in (payload.achievements or [])],
            "hoursWorked": payload.hoursWorked.dict() if payload.hoursWorked else {"development": 0, "testing": 0, "meetings": 0, "documentation": 0},
            "notesOrLinks": payload.notesOrLinks or "",
            "currentVersion": 1,
            "versions": [],
            "reviewHistory": [],
            "createdAt": now,
            "updatedAt": now,
        }
        return await report_repository.upsert_report(new_report)


@router.post("/reports/submit", response_model=WeeklyReportModel)
async def submit_report(payload: ReportSubmitRequest):
    """Submit a weekly report for manager review, archiving previous version if resubmitted."""
    now = datetime.utcnow().isoformat() + "Z"
    existing = None

    if payload.id:
        existing = await report_repository.get_report_by_id(payload.id)
    elif payload.userId and payload.weekLabel:
        existing = await report_repository.get_user_report_for_week(
            payload.userId, payload.weekLabel
        )

    # Resolve project name
    proj = await report_repository.get_project_by_id(payload.projectId)
    project_name = proj.get("name") if proj else (payload.projectName or "General Project")

    if existing:
        current_v = existing.get("currentVersion", 1)
        versions = list(existing.get("versions", []))

        # Archive version if previously submitted or needs correction
        if existing.get("status") in ["Needs Correction", "Submitted"]:
            last_review = (
                existing.get("reviewHistory")[-1]
                if existing.get("reviewHistory")
                else None
            )
            versions.append({
                "versionNumber": current_v,
                "submittedAt": existing.get("submittedAt") or existing.get("updatedAt"),
                "submittedBy": existing.get("userName"),
                "content": {
                    "weekStartDate": existing.get("weekStartDate"),
                    "weekEndDate": existing.get("weekEndDate"),
                    "weekLabel": existing.get("weekLabel"),
                    "projectId": existing.get("projectId"),
                    "tasksCompleted": existing.get("tasksCompleted"),
                    "tasksPlannedNextWeek": existing.get("tasksPlannedNextWeek"),
                    "blockers": existing.get("blockers"),
                    "achievements": existing.get("achievements"),
                    "hoursWorked": existing.get("hoursWorked"),
                    "notesOrLinks": existing.get("notesOrLinks"),
                },
                "reviewComment": last_review,
            })
            if existing.get("status") == "Needs Correction":
                current_v += 1

        payload_data = payload.dict()
        payload_data.pop("id", None)

        updated_dict = {
            **existing,
            **payload_data,
            "id": existing["id"],
            "projectName": project_name,
            "status": "Submitted",
            "currentVersion": current_v,
            "versions": versions,
            "tasksCompleted": [t.dict() for t in payload.tasksCompleted],
            "tasksPlannedNextWeek": [t.dict() for t in payload.tasksPlannedNextWeek] if payload.tasksPlannedNextWeek is not None else existing.get("tasksPlannedNextWeek", []),
            "blockers": [b.dict() for b in payload.blockers] if payload.blockers is not None else existing.get("blockers", []),
            "achievements": [a.dict() for a in payload.achievements] if payload.achievements is not None else existing.get("achievements", []),
            "hoursWorked": payload.hoursWorked.dict(),
            "submittedAt": now,
            "updatedAt": now,
        }
        saved = await report_repository.upsert_report(updated_dict)

        # Audit feed item
        await chat_repository.add_activity({
            "id": f"act-{uuid.uuid4().hex[:8]}",
            "type": "submitted",
            "actorName": payload.userName,
            "actorRole": "team_member",
            "reportId": saved["id"],
            "weekLabel": payload.weekLabel,
            "message": (
                f"{payload.userName} resubmitted revised report for {payload.weekLabel} (v{current_v})"
                if existing.get("status") == "Needs Correction"
                else f"{payload.userName} submitted weekly report for {payload.weekLabel}"
            ),
            "timestamp": now,
        })
        return saved
    else:
        new_report = {
            "id": payload.id or f"rep-{payload.userId}-{uuid.uuid4().hex[:8]}",
            "userId": payload.userId,
            "userName": payload.userName,
            "userTitle": payload.userTitle or "Software Engineer",
            "userDepartment": payload.userDepartment or "Engineering",
            "weekStartDate": payload.weekStartDate,
            "weekEndDate": payload.weekEndDate,
            "weekLabel": payload.weekLabel,
            "projectId": payload.projectId,
            "projectName": project_name,
            "status": "Submitted",
            "tasksCompleted": [t.dict() for t in payload.tasksCompleted],
            "tasksPlannedNextWeek": [t.dict() for t in (payload.tasksPlannedNextWeek or [])],
            "blockers": [b.dict() for b in (payload.blockers or [])],
            "achievements": [a.dict() for a in (payload.achievements or [])],
            "hoursWorked": payload.hoursWorked.dict(),
            "notesOrLinks": payload.notesOrLinks or "",
            "currentVersion": 1,
            "versions": [],
            "reviewHistory": [],
            "submittedAt": now,
            "createdAt": now,
            "updatedAt": now,
        }
        saved = await report_repository.upsert_report(new_report)

        await chat_repository.add_activity({
            "id": f"act-{uuid.uuid4().hex[:8]}",
            "type": "submitted",
            "actorName": payload.userName,
            "actorRole": "team_member",
            "reportId": saved["id"],
            "weekLabel": payload.weekLabel,
            "message": f"{payload.userName} submitted weekly report for {payload.weekLabel}",
            "timestamp": now,
        })
        return saved


@router.post("/reports/{report_id}/approve", response_model=WeeklyReportModel)
async def approve_report(report_id: str, payload: ReportReviewActionRequest):
    """Approve a submitted weekly report."""
    report = await report_repository.get_report_by_id(report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    now = datetime.utcnow().isoformat() + "Z"
    review_comment = {
        "id": f"rev-{uuid.uuid4().hex[:8]}",
        "authorId": payload.authorId,
        "authorName": payload.authorName,
        "authorRole": payload.authorRole,
        "comment": payload.comment or "Approved report without additional changes.",
        "action": "approve",
        "createdAt": now,
        "versionNumber": report.get("currentVersion", 1),
    }

    review_history = list(report.get("reviewHistory", []))
    review_history.append(review_comment)

    updated = await report_repository.update_report(
        report_id,
        {
            "status": "Approved",
            "reviewedAt": now,
            "updatedAt": now,
            "reviewHistory": review_history,
        },
    )

    await chat_repository.add_activity({
        "id": f"act-{uuid.uuid4().hex[:8]}",
        "type": "approved",
        "actorName": payload.authorName,
        "actorRole": payload.authorRole,
        "reportId": report_id,
        "weekLabel": report.get("weekLabel", ""),
        "message": f"{payload.authorName} approved {report.get('userName')}'s report for {report.get('weekLabel')}",
        "timestamp": now,
    })

    return updated


@router.post("/reports/{report_id}/request-changes", response_model=WeeklyReportModel)
async def request_changes(report_id: str, payload: ReportReviewActionRequest):
    """Send report back with required manager correction feedback."""
    if not payload.comment or not payload.comment.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A correction feedback comment is required.",
        )

    report = await report_repository.get_report_by_id(report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    now = datetime.utcnow().isoformat() + "Z"
    review_comment = {
        "id": f"rev-{uuid.uuid4().hex[:8]}",
        "authorId": payload.authorId,
        "authorName": payload.authorName,
        "authorRole": payload.authorRole,
        "comment": payload.comment.strip(),
        "action": "request_changes",
        "createdAt": now,
        "versionNumber": report.get("currentVersion", 1),
    }

    review_history = list(report.get("reviewHistory", []))
    review_history.append(review_comment)

    updated = await report_repository.update_report(
        report_id,
        {
            "status": "Needs Correction",
            "latestManagerComment": payload.comment.strip(),
            "reviewedAt": now,
            "updatedAt": now,
            "reviewHistory": review_history,
        },
    )

    await chat_repository.add_activity({
        "id": f"act-{uuid.uuid4().hex[:8]}",
        "type": "correction_requested",
        "actorName": payload.authorName,
        "actorRole": payload.authorRole,
        "reportId": report_id,
        "weekLabel": report.get("weekLabel", ""),
        "message": f"{payload.authorName} requested corrections on {report.get('userName')}'s report for {report.get('weekLabel')}",
        "timestamp": now,
    })

    return updated


# -----------------------------------------------------------------
# Projects / Categories Endpoints
# -----------------------------------------------------------------
@router.get("/projects", response_model=List[ProjectModel])
async def list_projects():
    """Retrieve all work categories / projects."""
    return await report_repository.get_all_projects()


@router.post("/projects", response_model=ProjectModel, status_code=status.HTTP_201_CREATED)
async def create_project(payload: ProjectCreate):
    """Create a new project category."""
    proj_dict = {
        "id": f"proj-{uuid.uuid4().hex[:8]}",
        "name": payload.name,
        "code": payload.code.upper(),
        "description": payload.description or "",
        "status": payload.status,
        "color": payload.color or "#3b82f6",
        "assignedMemberIds": payload.assignedMemberIds or [],
        "createdAt": datetime.utcnow().isoformat() + "Z",
    }
    return await report_repository.create_project(proj_dict)


@router.put("/projects/{project_id}", response_model=ProjectModel)
async def update_project(project_id: str, payload: ProjectUpdate):
    """Update an existing project category."""
    updates = payload.dict(exclude_unset=True)
    if "code" in updates and updates["code"]:
        updates["code"] = updates["code"].upper()

    updated = await report_repository.update_project(project_id, updates)
    if not updated:
        raise HTTPException(status_code=404, detail="Project not found")
    return updated


@router.delete("/projects/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(project_id: str):
    """Delete a project category."""
    deleted = await report_repository.delete_project(project_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Project not found")
    return None

