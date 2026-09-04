"""CrewAI Chat Crew for Weekly Report Intelligence.

Follows the BaseTool and Crew class pattern from Customer-Support-chat-bot.
Equipped with specialized report retrieval tools to iteratively search,
inspect, and synthesize contributor reports, KPI metrics, and blockers.
"""

import os
import asyncio
import concurrent.futures
import json
import logging
from typing import Optional, Dict, Any, List, Type
from pydantic import BaseModel, Field
from crewai import Agent, Crew, Process, Task
from crewai.tools import BaseTool

from app.llm.clients.groq_client import _apply_groq_patches
from app.repositories.report_repository import report_repository
from app.services.reports.report_service import report_service

logger = logging.getLogger("app.services.chat.crew")

# Apply Groq LiteLLM compatibility patches immediately
_apply_groq_patches()

# ThreadPoolExecutor to run async repo calls from CrewAI's sync _run method
_tool_executor = concurrent.futures.ThreadPoolExecutor(max_workers=10, thread_name_prefix="crewai-report-tool")


def run_async(coro):
    """Run a coroutine from sync context, safe inside FastAPI's running event loop."""
    def _run_in_new_loop():
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            return loop.run_until_complete(coro)
        finally:
            loop.close()
    return _tool_executor.submit(_run_in_new_loop).result()


# ---------------------------------------------------------------------------
# Tool Input Schemas
# ---------------------------------------------------------------------------

class FetchWeeklyReportsInput(BaseModel):
    week_label: Optional[str] = Field(default="", description="e.g. 'Week 36 (Aug 31 - Sep 06, 2026)'")
    project_id: Optional[str] = Field(default="", description="Optional project ID or code filter")
    status: Optional[str] = Field(default="", description="Optional status: 'Submitted', 'Approved', 'Needs Correction', 'Draft'")
    search: Optional[str] = Field(default="", description="Optional search term matching tasks, deliverables, or contributor names")


class FetchContributorReportInput(BaseModel):
    contributor_name: str = Field(..., description="Name of the team contributor (e.g. 'Sarah Chen', 'Priya Patel')")
    week_label: Optional[str] = Field(default="", description="Optional reporting week label to filter by")


class FetchTeamKpiInput(BaseModel):
    week_label: Optional[str] = Field(default="", description="e.g. 'Week 36 (Aug 31 - Sep 06, 2026)'")


class FetchTeamBlockersInput(BaseModel):
    week_label: Optional[str] = Field(default="", description="Optional reporting week label to filter by")
    key_issues_only: Optional[bool] = Field(default=False, description="Set to true to filter for critical blockers only")


class FetchProjectsListInput(BaseModel):
    search_term: Optional[str] = Field(default="", description="Optional search term to filter projects by name or code")


# ---------------------------------------------------------------------------
# BaseTool Implementations
# ---------------------------------------------------------------------------

class FetchWeeklyReportsTool(BaseTool):
    name: str = "fetch_weekly_reports"
    description: str = (
        "Fetch weekly reports from team contributors with optional filters for week, project, status, or search query. "
        "Returns contributor names, project names, status, tasks completed, deliverables, and blockers."
    )
    args_schema: Type[BaseModel] = FetchWeeklyReportsInput

    def _run(self, week_label: str = "", project_id: str = "", status: str = "", search: str = "") -> str:
        return run_async(self._arun(week_label, project_id, status, search))

    async def _arun(self, week_label: str = "", project_id: str = "", status: str = "", search: str = "") -> str:
        clean_week = (week_label or "").strip() or None
        clean_project = (project_id or "").strip() or None
        clean_status = (status or "").strip() or None
        clean_search = (search or "").strip() or None

        reports = await report_repository.get_reports(
            week_label=clean_week,
            project_id=clean_project,
            status=clean_status,
            search=clean_search,
            limit=50,
        )
        data = []
        for r in reports:
            data.append({
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
        return json.dumps(data, default=str)


class FetchContributorReportTool(BaseTool):
    name: str = "fetch_contributor_report"
    description: str = (
        "Fetch the detailed report for a specific contributor (e.g. 'Sarah Chen', 'Michael Scott', 'Priya Patel'). "
        "Returns individual tasks completed, next week plans, blockers, hours worked, and manager comments."
    )
    args_schema: Type[BaseModel] = FetchContributorReportInput

    def _run(self, contributor_name: str, week_label: str = "") -> str:
        return run_async(self._arun(contributor_name, week_label))

    async def _arun(self, contributor_name: str, week_label: str = "") -> str:
        clean_name = (contributor_name or "").strip()
        clean_week = (week_label or "").strip() or None

        reports = await report_repository.get_reports(
            week_label=clean_week,
            search=clean_name,
            limit=5,
        )
        matched = [r for r in reports if clean_name.lower() in (r.get("userName") or "").lower()]
        if not matched:
            matched = reports

        if not matched:
            return json.dumps({"error": f"No report found for contributor '{contributor_name}'"})

        r = matched[0]
        return json.dumps({
            "contributor": r.get("userName"),
            "title": r.get("userTitle"),
            "department": r.get("userDepartment"),
            "project": r.get("projectName"),
            "week": r.get("weekLabel"),
            "status": r.get("status"),
            "tasksCompleted": r.get("tasksCompleted", []),
            "tasksPlannedNextWeek": r.get("tasksPlannedNextWeek", []),
            "blockers": r.get("blockers", []),
            "achievements": r.get("achievements", []),
            "hoursWorked": r.get("hoursWorked", {}),
            "latestManagerComment": r.get("latestManagerComment"),
        }, default=str)


class FetchTeamKpiMetricsTool(BaseTool):
    name: str = "fetch_team_kpi_metrics"
    description: str = (
        "Fetch high-level aggregate KPI metrics for the team for a specific week. "
        "Returns total submissions, compliance percentage, approved count, pending review, and open blockers count."
    )
    args_schema: Type[BaseModel] = FetchTeamKpiInput

    def _run(self, week_label: str = "") -> str:
        return run_async(self._arun(week_label))

    async def _arun(self, week_label: str = "") -> str:
        clean_week = (week_label or "").strip() or None
        metrics = await report_service.calculate_metrics(clean_week)
        return json.dumps(metrics.dict(), default=str)


class FetchTeamBlockersTool(BaseTool):
    name: str = "fetch_team_blockers"
    description: str = (
        "Fetch active blockers, risks, and obstacles flagged by team contributors across projects. "
        "Set key_issues_only to true to filter for critical blockers only."
    )
    args_schema: Type[BaseModel] = FetchTeamBlockersInput

    def _run(self, week_label: str = "", key_issues_only: bool = False) -> str:
        return run_async(self._arun(week_label, key_issues_only))

    async def _arun(self, week_label: str = "", key_issues_only: bool = False) -> str:
        clean_week = (week_label or "").strip() or None
        reports = await report_repository.get_reports(
            week_label=clean_week,
            limit=100,
        )
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
        return json.dumps(blockers_list, default=str)


class FetchProjectsListTool(BaseTool):
    name: str = "fetch_projects_list"
    description: str = (
        "Fetch the list of all active project categories, project codes, and descriptions. "
        "Optional search_term filters projects by name or code."
    )
    args_schema: Type[BaseModel] = FetchProjectsListInput

    def _run(self, search_term: str = "") -> str:
        return run_async(self._arun(search_term))

    async def _arun(self, search_term: str = "") -> str:
        projects = await report_repository.get_all_projects()
        clean_st = (search_term or "").strip().lower()
        if clean_st:
            projects = [p for p in projects if clean_st in (p.get("name") or "").lower() or clean_st in (p.get("code") or "").lower()]
        return json.dumps([
            {
                "id": p.get("id"),
                "name": p.get("name"),
                "code": p.get("code"),
                "description": p.get("description"),
                "status": p.get("status"),
            }
            for p in projects
        ], default=str)


def get_report_tools() -> List[BaseTool]:
    """Instantiate and return fresh instances of all report tools."""
    return [
        FetchWeeklyReportsTool(),
        FetchContributorReportTool(),
        FetchTeamKpiMetricsTool(),
        FetchTeamBlockersTool(),
        FetchProjectsListTool(),
    ]


# ---------------------------------------------------------------------------
# Fallback Tool Query (When Groq is offline or API key is unset)
# ---------------------------------------------------------------------------

async def _fallback_tool_query(query: str, effective_week: str) -> Dict[str, Any]:
    """Execute deterministic tool queries when Groq is unreachable."""
    q_lower = query.lower()

    if any(w in q_lower for w in ["kpi", "compliance", "rate", "summary", "overview"]):
        metrics = await report_service.calculate_metrics(effective_week)
        reports = await report_repository.get_reports(week_label=effective_week, limit=20)
        lines = [
            f"**KPI Summary for {effective_week}:**\n",
            f"- **Submissions:** {metrics.totalSubmittedThisWeek} / {metrics.totalTeamMembers}",
            f"- **Compliance Rate:** {metrics.submissionComplianceRate}%",
            f"- **Approved Submissions:** {metrics.approvedCount}",
            f"- **Needs Correction:** {metrics.needsCorrectionCount}",
            f"- **Open Blockers:** {metrics.openBlockersCount}",
        ]
        if reports:
            lines.append("\n**Active Submissions:**")
            for r in reports[:5]:
                lines.append(f"- **{r.get('userName')}** ({r.get('projectName', 'General')}): {r.get('status')}")
        return {
            "reply": "\n".join(lines),
            "sources_count": len(reports),
        }

    if any(w in q_lower for w in ["blocker", "risk", "issue", "impediment"]):
        reports = await report_repository.get_reports(week_label=effective_week, limit=50)
        blockers = []
        for r in reports:
            for b in (r.get("blockers") or []):
                blockers.append((r.get("userName"), r.get("projectName"), b.get("description"), b.get("isKeyIssue")))

        if not blockers:
            return {
                "reply": f"No active blockers logged for **{effective_week}**. All team members reported unblocked progress!",
                "sources_count": len(reports),
            }

        lines = [f"**Active Blockers for {effective_week} ({len(blockers)} found):**\n"]
        for user, proj, desc, is_key in blockers:
            badge = " ⚠️ [CRITICAL KEY ISSUE]" if is_key else ""
            lines.append(f"- **{user}** ({proj}){badge}: {desc}")
        return {
            "reply": "\n".join(lines),
            "sources_count": len(reports),
        }

    if any(w in q_lower for w in ["project", "projects", "categories"]):
        projects = await report_repository.get_all_projects()
        lines = ["**Active Project Categories:**\n"]
        for p in projects:
            lines.append(f"- **{p.get('name')}** (`{p.get('code')}`): {p.get('description') or 'Active'}")
        return {
            "reply": "\n".join(lines),
            "sources_count": len(projects),
        }

    reports = await report_repository.get_reports(week_label=effective_week, limit=20)
    if reports:
        lines = [f"**Weekly Report Findings for {effective_week}:**\n"]
        for r in reports[:6]:
            tasks = [t.get("taskName") for t in (r.get("tasksCompleted") or []) if t.get("taskName")]
            task_str = f" - delivered: {', '.join(tasks[:2])}" if tasks else ""
            lines.append(f"- **{r.get('userName')}** ({r.get('projectName', 'General')}) [{r.get('status')}]{task_str}")
        return {
            "reply": "\n".join(lines),
            "sources_count": len(reports),
        }

    return {
        "reply": f"No report records found for **{effective_week}**. Team contributors can submit their weekly updates using the Report Form.",
        "sources_count": 0,
    }


# ---------------------------------------------------------------------------
# ReportQnACrew Class Pattern (Matches QnACrew from Customer-Support-chat-bot)
# ---------------------------------------------------------------------------

class ReportQnACrew:
    """CrewAI Chat Crew for weekly report analysis and question answering."""

    def __init__(self, user_query: str, week_label: str = "", rolling_summary: str = ""):
        self.user_query = user_query
        self.week_label = week_label or "Week 36 (Aug 31 - Sep 06, 2026)"
        self.rolling_summary = rolling_summary

        model_name = os.getenv("GROQ_MODEL", "qwen/qwen3.8-27b").strip()
        self.llm = model_name if model_name.startswith("groq/") else f"groq/{model_name}"
        self.tools = get_report_tools()
        self.agents = self._create_agents()
        self.tasks = self._create_tasks()
        self.crew = self._create_crew()

    def _create_agents(self) -> Dict[str, Agent]:
        return {
            "analyst_agent": Agent(
                role="Weekly Report Intelligence Analyst",
                goal="Accurately inspect team weekly reports, contributor submissions, blockers, and KPI metrics to answer queries with verifiable facts",
                backstory="""You are the dedicated engineering intelligence analyst for the team dashboard.
You have full access to team weekly reports, contributor submissions, blocker logs, and KPI metrics.
Always use your specialized reporting tools to iteratively verify data. Do not make up metrics, dates, or deliverables.""",
                tools=self.tools,
                llm=self.llm,
                verbose=True,
                allow_delegation=False,
                max_iter=5,
            )
        }

    def _create_tasks(self) -> List[Task]:
        a = self.agents
        context_str = f"Prior Conversation Summary: {self.rolling_summary}\n" if self.rolling_summary else ""
        return [
            Task(
                description=(
                    f"{context_str}"
                    f"User Query: '{self.user_query}'\n"
                    f"Reporting Week: '{self.week_label}'\n\n"
                    "Instructions:\n"
                    "1. Call your reporting tools iteratively as needed to look up weekly reports, contributor details, blockers, or KPIs.\n"
                    "2. Synthesize an objective, structured answer in markdown.\n"
                    "3. Cite specific team members, project codes, deliverables, or blockers discovered from the data."
                ),
                expected_output="A structured, factual markdown answer citing specific team members, deliverables, blockers, or KPIs.",
                agent=a["analyst_agent"],
            )
        ]

    def _create_crew(self) -> Crew:
        return Crew(
            agents=list(self.agents.values()),
            tasks=self.tasks,
            process=Process.sequential,
            verbose=True,
        )

    async def run(self) -> str:
        """Kickoff the Crew asynchronously, returning the text output."""
        result = await self.crew.kickoff_async()
        return str(result).strip()


# ---------------------------------------------------------------------------
# Runner function for LangGraph QnA Node
# ---------------------------------------------------------------------------

async def run_chat_crew(
    query: str,
    selected_week: str,
    rolling_summary: str = "",
) -> Dict[str, Any]:
    """Execute the ReportQnACrew for LangGraph's qna_node."""
    effective_week = selected_week or "Week 36 (Aug 31 - Sep 06, 2026)"
    api_key = os.getenv("GROQ_API_KEY", "").strip()

    if not api_key:
        logger.info("GROQ_API_KEY unset; running direct tool query fallback.")
        return await _fallback_tool_query(query, effective_week)

    try:
        crew_runner = ReportQnACrew(
            user_query=query,
            week_label=effective_week,
            rolling_summary=rolling_summary,
        )
        output_text = await crew_runner.run()

        # Check if the output returned a valid response
        if output_text and len(output_text) > 10:
            return {
                "reply": output_text,
                "sources_count": 1 if "report" in output_text.lower() else 0,
            }

        return await _fallback_tool_query(query, effective_week)

    except Exception as exc:
        logger.warning(f"CrewAI execution error: {exc}. Using fallback tool query.", exc_info=True)
        return await _fallback_tool_query(query, effective_week)
