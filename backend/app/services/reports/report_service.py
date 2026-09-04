import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any
from app.repositories.report_repository import report_repository
from app.repositories.user_repository import user_repository
from app.repositories.chat_repository import chat_repository
from app.models.reports import (
    ReportSaveDraftRequest,
    ReportSubmitRequest,
    ReportReviewActionRequest,
    ProjectCreate,
    ProjectUpdate,
    DashboardMetricsModel,
)
from app.models.users import UserModel


class ReportService:
    def __init__(self):
        self.report_repo = report_repository
        self.user_repo = user_repository
        self.chat_repo = chat_repository

    async def get_reports(
        self,
        week_label: Optional[str] = None,
        user_id: Optional[str] = None,
        project_id: Optional[str] = None,
        status: Optional[str] = None,
        search: Optional[str] = None,
    ) -> List[dict]:
        """Fetch filtered reports with business domain rules."""
        return await self.report_repo.get_reports(
            week_label=week_label,
            user_id=user_id,
            project_id=project_id,
            status=status,
            search=search,
        )

    async def get_reports_paginated(
        self,
        page: int = 1,
        page_size: int = 10,
        week_label: Optional[str] = None,
        user_id: Optional[str] = None,
        project_id: Optional[str] = None,
        status: Optional[str] = None,
        search: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Fetch paginated reports with search and multi-field filters."""
        return await self.report_repo.get_reports_paginated(
            page=page,
            page_size=page_size,
            week_label=week_label,
            user_id=user_id,
            project_id=project_id,
            status=status,
            search=search,
        )

    async def get_report_by_id(self, report_id: str) -> Optional[dict]:
        """Retrieve full details of a specific weekly report."""
        return await self.report_repo.get_report_by_id(report_id)

    async def calculate_metrics(self, week_label: str) -> DashboardMetricsModel:
        """Compute KPI metrics for team dashboard for the specified week."""
        week_reports = await self.report_repo.get_reports(week_label=week_label)
        team_members = await self.user_repo.get_all_users()
        member_count = len([u for u in team_members if u.get("role") == "team_member"])

        submitted = [r for r in week_reports if r.get("status") in ["Submitted", "Approved"]]
        approved = [r for r in week_reports if r.get("status") == "Approved"]
        needs_corr = [r for r in week_reports if r.get("status") == "Needs Correction"]
        pending = [r for r in week_reports if r.get("status") == "Submitted"]

        open_blockers = sum(len(r.get("blockers", []) or []) for r in week_reports)

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

    async def save_draft(
        self,
        payload: ReportSaveDraftRequest,
        current_user: UserModel,
    ) -> dict:
        """Save or update an in-progress draft report."""
        now = datetime.utcnow().isoformat() + "Z"
        existing = None

        if payload.id:
            existing = await self.report_repo.get_report_by_id(payload.id)
        elif payload.userId and payload.weekLabel:
            existing = await self.report_repo.get_user_report_for_week(
                payload.userId, payload.weekLabel
            )

        # Resolve project name
        project_name = payload.projectName or "General Engineering"
        if payload.projectId:
            proj = await self.report_repo.get_project_by_id(payload.projectId)
            if proj:
                project_name = proj.get("name", project_name)

        if existing:
            update_data = {
                **existing,
                "projectId": payload.projectId or existing.get("projectId"),
                "projectName": project_name,
                "status": "Draft",
                "tasksCompleted": [t.dict() for t in payload.tasksCompleted] if payload.tasksCompleted is not None else existing.get("tasksCompleted", []),
                "tasksPlannedNextWeek": [t.dict() for t in payload.tasksPlannedNextWeek] if payload.tasksPlannedNextWeek is not None else existing.get("tasksPlannedNextWeek", []),
                "blockers": [b.dict() for b in payload.blockers] if payload.blockers is not None else existing.get("blockers", []),
                "achievements": [a.dict() for a in payload.achievements] if payload.achievements is not None else existing.get("achievements", []),
                "hoursWorked": payload.hoursWorked.dict() if payload.hoursWorked is not None else existing.get("hoursWorked", {}),
                "notesOrLinks": payload.notesOrLinks if payload.notesOrLinks is not None else existing.get("notesOrLinks", ""),
                "updatedAt": now,
            }
            return await self.report_repo.upsert_report(update_data)
        else:
            new_id = payload.id or f"rep-{payload.userId or current_user.id}-{uuid.uuid4().hex[:8]}"
            user_name = payload.userName or current_user.name
            user_title = payload.userTitle or current_user.title
            user_dept = payload.userDepartment or current_user.department

            draft_dict = {
                "id": new_id,
                "userId": payload.userId or current_user.id,
                "userName": user_name,
                "userTitle": user_title,
                "userDepartment": user_dept,
                "weekStartDate": payload.weekStartDate or "",
                "weekEndDate": payload.weekEndDate or "",
                "weekLabel": payload.weekLabel or "",
                "projectId": payload.projectId or "proj-default",
                "projectName": project_name,
                "status": "Draft",
                "tasksCompleted": [t.dict() for t in (payload.tasksCompleted or [])],
                "tasksPlannedNextWeek": [t.dict() for t in (payload.tasksPlannedNextWeek or [])],
                "blockers": [b.dict() for b in (payload.blockers or [])],
                "achievements": [a.dict() for a in (payload.achievements or [])],
                "hoursWorked": payload.hoursWorked.dict() if payload.hoursWorked else {"development": 0, "testing": 0, "meetings": 0, "documentation": 0, "other": 0},
                "notesOrLinks": payload.notesOrLinks or "",
                "currentVersion": 1,
                "versions": [],
                "reviewHistory": [],
                "createdAt": now,
                "updatedAt": now,
            }
            return await self.report_repo.upsert_report(draft_dict)

    async def submit_report(
        self,
        payload: ReportSubmitRequest,
        current_user: UserModel,
    ) -> dict:
        """Submit weekly report for manager review, snapshotting versions on resubmission."""
        now = datetime.utcnow().isoformat() + "Z"
        existing = None

        if payload.id:
            existing = await self.report_repo.get_report_by_id(payload.id)
        if not existing and payload.userId and payload.weekLabel:
            existing = await self.report_repo.get_user_report_for_week(
                payload.userId, payload.weekLabel
            )

        # Resolve project name
        project_name = payload.projectName
        if not project_name and payload.projectId:
            proj = await self.report_repo.get_project_by_id(payload.projectId)
            if proj:
                project_name = proj.get("name", "General Engineering")

        if existing:
            current_v = existing.get("currentVersion", 1)
            versions = list(existing.get("versions", []))

            # If re-submitting after changes were requested, archive current version
            if existing.get("status") in ["Needs Correction", "Submitted"]:
                last_review = None
                rev_history = existing.get("reviewHistory", [])
                if rev_history:
                    last_review = rev_history[-1]

                versions.append({
                    "versionNumber": current_v,
                    "submittedAt": existing.get("submittedAt", now),
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
            saved = await self.report_repo.upsert_report(updated_dict)

            # Audit feed item
            await self.chat_repo.add_activity({
                "id": f"act-{uuid.uuid4().hex[:8]}",
                "type": "submitted",
                "actorName": payload.userName,
                "actorRole": current_user.role,
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
            new_id = payload.id or f"rep-{payload.userId}-{uuid.uuid4().hex[:8]}"
            new_report = {
                "id": new_id,
                "userId": payload.userId,
                "userName": payload.userName,
                "userTitle": payload.userTitle or current_user.title or "Software Engineer",
                "userDepartment": payload.userDepartment or current_user.department or "Engineering",
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
            saved = await self.report_repo.upsert_report(new_report)

            # Audit feed item
            await self.chat_repo.add_activity({
                "id": f"act-{uuid.uuid4().hex[:8]}",
                "type": "submitted",
                "actorName": payload.userName,
                "actorRole": current_user.role,
                "reportId": saved["id"],
                "weekLabel": payload.weekLabel,
                "message": f"{payload.userName} submitted weekly report for {payload.weekLabel}",
                "timestamp": now,
            })
            return saved

    async def approve_report(
        self,
        report_id: str,
        payload: ReportReviewActionRequest,
        reviewer: UserModel,
    ) -> Optional[dict]:
        """Approve weekly report and record review history."""
        report = await self.report_repo.get_report_by_id(report_id)
        if not report:
            return None

        now = datetime.utcnow().isoformat() + "Z"
        review_comment = {
            "id": f"rev-{uuid.uuid4().hex[:8]}",
            "authorId": reviewer.id,
            "authorName": reviewer.name,
            "authorRole": reviewer.role,
            "comment": payload.comment or "Approved report without additional changes.",
            "action": "approve",
            "createdAt": now,
            "versionNumber": report.get("currentVersion", 1),
        }

        review_history = list(report.get("reviewHistory", []))
        review_history.append(review_comment)

        updated = await self.report_repo.update_report(
            report_id,
            {
                "status": "Approved",
                "reviewedAt": now,
                "updatedAt": now,
                "reviewHistory": review_history,
            },
        )

        await self.chat_repo.add_activity({
            "id": f"act-{uuid.uuid4().hex[:8]}",
            "type": "approved",
            "actorName": reviewer.name,
            "actorRole": reviewer.role,
            "reportId": report_id,
            "weekLabel": report.get("weekLabel", ""),
            "message": f"{reviewer.name} approved {report.get('userName')}'s report for {report.get('weekLabel')}",
            "timestamp": now,
        })

        return updated

    async def request_changes(
        self,
        report_id: str,
        payload: ReportReviewActionRequest,
        reviewer: UserModel,
    ) -> Optional[dict]:
        """Send report back with required manager correction feedback."""
        report = await self.report_repo.get_report_by_id(report_id)
        if not report:
            return None

        now = datetime.utcnow().isoformat() + "Z"
        review_comment = {
            "id": f"rev-{uuid.uuid4().hex[:8]}",
            "authorId": reviewer.id,
            "authorName": reviewer.name,
            "authorRole": reviewer.role,
            "comment": payload.comment.strip(),
            "action": "request_changes",
            "createdAt": now,
            "versionNumber": report.get("currentVersion", 1),
        }

        review_history = list(report.get("reviewHistory", []))
        review_history.append(review_comment)

        updated = await self.report_repo.update_report(
            report_id,
            {
                "status": "Needs Correction",
                "latestManagerComment": payload.comment.strip(),
                "reviewedAt": now,
                "updatedAt": now,
                "reviewHistory": review_history,
            },
        )

        await self.chat_repo.add_activity({
            "id": f"act-{uuid.uuid4().hex[:8]}",
            "type": "correction_requested",
            "actorName": reviewer.name,
            "actorRole": reviewer.role,
            "reportId": report_id,
            "weekLabel": report.get("weekLabel", ""),
            "message": f"{reviewer.name} requested corrections on {report.get('userName')}'s report for {report.get('weekLabel')}",
            "timestamp": now,
        })

        return updated

    # -----------------------------------------------------------------
    # Projects / Categories Service
    # -----------------------------------------------------------------
    async def get_all_projects(self) -> List[dict]:
        """Retrieve all work categories / projects."""
        return await self.report_repo.get_all_projects()

    async def create_project(self, payload: ProjectCreate, creator: UserModel) -> dict:
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
        return await self.report_repo.create_project(proj_dict)

    async def update_project(self, project_id: str, payload: ProjectUpdate) -> Optional[dict]:
        """Update an existing project category."""
        updates = payload.dict(exclude_unset=True)
        if "code" in updates and updates["code"]:
            updates["code"] = updates["code"].upper()

        return await self.report_repo.update_project(project_id, updates)

    async def delete_project(self, project_id: str) -> bool:
        """Delete a project category."""
        return await self.report_repo.delete_project(project_id)


report_service = ReportService()
