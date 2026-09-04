from typing import List, Optional, Union
from fastapi import APIRouter, HTTPException, Query, Depends, status

from app.models.reports import (
    WeeklyReportModel,
    ReportSaveDraftRequest,
    ReportSubmitRequest,
    ReportReviewActionRequest,
    ProjectModel,
    ProjectCreate,
    ProjectUpdate,
    DashboardMetricsModel,
)
from app.models.pagination import PaginatedResponse
from app.models.users import UserModel
from app.middleware.auth import (
    require_authenticated,
    require_manager_or_admin,
    require_admin,
)
from app.services.reports.report_service import report_service

router = APIRouter(prefix="/api", tags=["Reports & Projects"])


# -----------------------------------------------------------------
# Weekly Reports Endpoints
# -----------------------------------------------------------------
@router.get(
    "/reports",
    response_model=Union[PaginatedResponse[WeeklyReportModel], List[WeeklyReportModel]],
)
async def list_reports(
    page: Optional[int] = Query(None, ge=1, description="Page number for pagination"),
    page_size: Optional[int] = Query(None, ge=1, le=100, description="Items per page"),
    week: Optional[str] = Query(None, description="Week label filter"),
    user_id: Optional[str] = Query(None, description="User ID filter"),
    project_id: Optional[str] = Query(None, description="Project ID filter"),
    status: Optional[str] = Query(None, description="Status filter"),
    search: Optional[str] = Query(None, description="Search keyword matching contributor, project, or deliverables"),
    current_user: UserModel = Depends(require_authenticated),
):
    """Retrieve weekly reports matching optional query filters with optional pagination (Requires authentication)."""
    if page is not None or page_size is not None:
        p = page if page is not None else 1
        ps = page_size if page_size is not None else 10
        return await report_service.get_reports_paginated(
            page=p,
            page_size=ps,
            week_label=week,
            user_id=user_id,
            project_id=project_id,
            status=status,
            search=search,
        )

    return await report_service.get_reports(
        week_label=week,
        user_id=user_id,
        project_id=project_id,
        status=status,
        search=search,
    )


@router.get("/reports/metrics/summary", response_model=DashboardMetricsModel)
async def get_metrics(
    week: str = Query(..., description="Target week label"),
    current_user: UserModel = Depends(require_authenticated),
):
    """Compute KPI metrics for team dashboard for the specified week."""
    return await report_service.calculate_metrics(week_label=week)


@router.get("/reports/{report_id}", response_model=WeeklyReportModel)
async def get_report(
    report_id: str,
    current_user: UserModel = Depends(require_authenticated),
):
    """Retrieve full details of a weekly report."""
    report = await report_service.get_report_by_id(report_id)
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Report with id '{report_id}' was not found.",
        )
    return report


@router.post("/reports/draft", response_model=WeeklyReportModel)
async def save_draft(
    payload: ReportSaveDraftRequest,
    current_user: UserModel = Depends(require_authenticated),
):
    """Save or update an in-progress draft report."""
    return await report_service.save_draft(payload, current_user)


@router.post("/reports/submit", response_model=WeeklyReportModel)
async def submit_report(
    payload: ReportSubmitRequest,
    current_user: UserModel = Depends(require_authenticated),
):
    """Submit weekly report for manager review."""
    # RBAC: Non-admin team members can only submit on their own behalf
    if current_user.role == "team_member" and payload.userId != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only submit weekly reports on your own behalf.",
        )
    return await report_service.submit_report(payload, current_user)


@router.post("/reports/{report_id}/review", response_model=WeeklyReportModel)
async def approve_report(
    report_id: str,
    payload: ReportReviewActionRequest,
    reviewer: UserModel = Depends(require_manager_or_admin),
):
    """Approve weekly report (Manager/Admin only)."""
    updated = await report_service.approve_report(report_id, payload, reviewer)
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")
    return updated


@router.post("/reports/{report_id}/request-changes", response_model=WeeklyReportModel)
async def request_changes(
    report_id: str,
    payload: ReportReviewActionRequest,
    reviewer: UserModel = Depends(require_manager_or_admin),
):
    """Send report back with required manager correction feedback (Manager/Admin only)."""
    if not payload.comment or not payload.comment.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A correction feedback comment is required.",
        )
    updated = await report_service.request_changes(report_id, payload, reviewer)
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")
    return updated


# -----------------------------------------------------------------
# Projects / Categories Endpoints
# -----------------------------------------------------------------
@router.get("/projects", response_model=List[ProjectModel])
async def list_projects(current_user: UserModel = Depends(require_authenticated)):
    """Retrieve all work categories / projects."""
    return await report_service.get_all_projects()


@router.post("/projects", response_model=ProjectModel, status_code=status.HTTP_201_CREATED)
async def create_project(
    payload: ProjectCreate,
    current_user: UserModel = Depends(require_manager_or_admin),
):
    """Create a new project category (Manager/Admin only)."""
    return await report_service.create_project(payload, current_user)


@router.put("/projects/{project_id}", response_model=ProjectModel)
async def update_project(
    project_id: str,
    payload: ProjectUpdate,
    current_user: UserModel = Depends(require_manager_or_admin),
):
    """Update an existing project category (Manager/Admin only)."""
    updated = await report_service.update_project(project_id, payload)
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return updated


@router.delete("/projects/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: str,
    admin_user: UserModel = Depends(require_admin),
):
    """Delete a project category (Admin only)."""
    deleted = await report_service.delete_project(project_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return None
