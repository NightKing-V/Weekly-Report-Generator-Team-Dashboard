"""
Report Fetch Tools for LangGraph Chatbot.
Provides structured tools to query reports, metrics, blockers, contributors, and projects.
"""
from typing import Optional, List, Dict, Any
from langchain_core.tools import tool
from app.repositories.report_repository import report_repository
from app.services.reports.report_service import report_service


@tool
async def fetch_weekly_reports(
    week_label: Optional[str] = None,
    project_id: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """
    Fetch a list of weekly reports from team contributors with optional filters.
    Use this to see who submitted, their project, status, tasks, hours, and achievements.
    
    Args:
        week_label: e.g. 'Week 36 (Aug 31 - Sep 06, 2026)'
        project_id: optional project ID filter
        status: optional status filter ('Submitted', 'Approved', 'Needs Correction', 'Draft')
        search: optional text search matching task names, deliverables, or contributor names
    """
    reports = await report_repository.get_reports(
        week_label=week_label,
        project_id=project_id,
        status=status,
        search=search,
        limit=50,
    )
    simplified = []
    for r in reports:
        simplified.append({
            "id": r.get("id"),
            "contributor": r.get("userName"),
            "title": r.get("userTitle"),
            "department": r.get("userDepartment"),
            "project": r.get("projectName"),
            "week": r.get("weekLabel"),
            "status": r.get("status"),
            "completedTasks": [
                {
                    "name": t.get("taskName"),
                    "status": t.get("status"),
                    "actualPercent": t.get("actualPercent"),
                    "deliverable": t.get("outputDeliverable"),
                }
                for t in (r.get("tasksCompleted") or [])
            ],
            "plannedTasks": [t.get("taskName") for t in (r.get("tasksPlannedNextWeek") or [])],
            "blockers": [b.get("description") for b in (r.get("blockers") or [])],
            "achievements": [a.get("description") for a in (r.get("achievements") or [])],
            "hours": r.get("hoursWorked"),
        })
    return simplified


@tool
async def fetch_contributor_report(
    contributor_name: str,
    week_label: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Fetch the detailed report of a specific team contributor (e.g. 'Sarah Chen', 'Michael Scott', 'Dwight Schrute').
    
    Args:
        contributor_name: Name of the team member
        week_label: Optional week label to look up. If omitted, searches across available reports.
    """
    reports = await report_repository.get_reports(week_label=week_label, search=contributor_name, limit=5)
    matched = [r for r in reports if contributor_name.lower() in r.get("userName", "").lower()]
    if not matched:
        if reports:
            matched = reports
        else:
            return {"error": f"No weekly report found for contributor '{contributor_name}'"}

    r = matched[0]
    return {
        "contributor": r.get("userName"),
        "title": r.get("userTitle"),
        "department": r.get("userDepartment"),
        "project": r.get("projectName"),
        "week": r.get("weekLabel"),
        "status": r.get("status"),
        "currentVersion": r.get("currentVersion"),
        "tasksCompleted": r.get("tasksCompleted", []),
        "tasksPlannedNextWeek": r.get("tasksPlannedNextWeek", []),
        "blockers": r.get("blockers", []),
        "achievements": r.get("achievements", []),
        "hoursWorked": r.get("hoursWorked", {}),
        "latestManagerComment": r.get("latestManagerComment"),
        "submittedAt": r.get("submittedAt"),
    }


@tool
async def fetch_team_kpi_metrics(week_label: str) -> Dict[str, Any]:
    """
    Fetch aggregate KPI metrics for the entire team for a given week.
    Returns total reports submitted, submission compliance rate percentage,
    count of reports needing correction, approved count, pending review count,
    and count of open blockers.
    
    Args:
        week_label: e.g. 'Week 36 (Aug 31 - Sep 06, 2026)'
    """
    metrics = await report_service.calculate_metrics(week_label)
    return metrics.dict()


@tool
async def fetch_team_blockers(
    week_label: Optional[str] = None,
    key_issues_only: bool = False,
) -> List[Dict[str, Any]]:
    """
    Fetch all blockers, impediments, and challenges flagged by team contributors.
    
    Args:
        week_label: Optional week label to filter by
        key_issues_only: If true, only return critical blockers flagged as key issues
    """
    reports = await report_repository.get_reports(week_label=week_label, limit=100)
    blockers_list = []
    for r in reports:
        for b in (r.get("blockers") or []):
            is_key = b.get("isKeyIssue", False)
            if key_issues_only and not is_key:
                continue
            blockers_list.append({
                "contributor": r.get("userName"),
                "project": r.get("projectName"),
                "week": r.get("weekLabel"),
                "description": b.get("description"),
                "isKeyIssue": is_key,
                "reportStatus": r.get("status"),
            })
    return blockers_list


@tool
async def fetch_projects_list() -> List[Dict[str, Any]]:
    """
    Fetch the list of all active project categories, their codes, and descriptions.
    """
    projects = await report_repository.get_all_projects()
    return [
        {
            "id": p.get("id"),
            "name": p.get("name"),
            "code": p.get("code"),
            "description": p.get("description"),
            "status": p.get("status"),
        }
        for p in projects
    ]


ALL_REPORT_TOOLS = [
    fetch_weekly_reports,
    fetch_contributor_report,
    fetch_team_kpi_metrics,
    fetch_team_blockers,
    fetch_projects_list,
]
