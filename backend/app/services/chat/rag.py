"""Lightweight, Minimal RAG Engine for Weekly Reports.

Powered by pure LangChain & LangGraph.
Queries MongoDB asynchronously to retrieve relevant weekly reports, KPI metrics,
blockers, and project categories, then synthesizes an answer using ChatGroq.
"""

import os
import logging
from typing import Dict, Any, Tuple, Optional
from langchain_core.messages import SystemMessage, HumanMessage

from app.llm import LLMFactory, LLMTier
from app.repositories.report_repository import report_repository
from app.services.reports.report_service import report_service

logger = logging.getLogger("app.services.chat.rag")


async def retrieve_report_context(query: str, week_label: str) -> Tuple[str, int]:
    """Retrieve grounded weekly report context and metrics from MongoDB.
    
    Returns:
        (context_markdown, sources_count)
    """
    q_lower = query.lower()
    effective_week = week_label or "Week 36 (Aug 31 - Sep 06, 2026)"

    # 1. Fetch live KPI metrics for the effective reporting week
    metrics = await report_service.calculate_metrics(effective_week)

    # 2. Determine targeted retrieval filters based on user query
    matched_reports = []
    
    # Check if a known team member is explicitly mentioned
    common_names = ["sarah", "michael", "priya", "david", "alex", "valenteno"]
    mentioned_name = next((name for name in common_names if name in q_lower), None)

    if mentioned_name:
        # Search specifically for this contributor
        matched_reports = await report_repository.get_reports(
            week_label=effective_week,
            search=mentioned_name,
            limit=5,
        )
        if not matched_reports:
            # If not in current week, search across recent weeks
            matched_reports = await report_repository.get_reports(
                search=mentioned_name,
                limit=5,
            )
    else:
        # Fetch reports for the selected reporting week
        matched_reports = await report_repository.get_reports(
            week_label=effective_week,
            limit=25,
        )
        if not matched_reports:
            # Fallback to recent reports across any week if selected week has none
            matched_reports = await report_repository.get_reports(limit=10)

    # 3. Fetch projects list if query asks about projects
    projects_context = []
    if any(k in q_lower for k in ["project", "projects", "category", "categories", "code", "clt", "rd"]):
        projects = await report_repository.get_all_projects()
        for p in projects:
            projects_context.append(
                f"- **{p.get('name')}** (`{p.get('code')}`): {p.get('description') or 'Active'} [{p.get('status')}]"
            )

    # 4. Construct Structured Context Markdown
    sections = []
    sections.append(f"### Reporting Week: {effective_week}")

    # Metrics section
    sections.append(
        "### Team KPI Metrics Summary:\n"
        f"- Total Team Members: {metrics.totalTeamMembers}\n"
        f"- Reports Submitted: {metrics.totalSubmittedThisWeek}\n"
        f"- Submission Compliance Rate: {metrics.submissionComplianceRate}%\n"
        f"- Approved Reports: {metrics.approvedCount}\n"
        f"- Reports Needing Correction: {metrics.needsCorrectionCount}\n"
        f"- Open Blockers: {metrics.openBlockersCount}"
    )

    # Reports section
    if matched_reports:
        report_lines = ["### Contributor Weekly Submissions:"]
        for r in matched_reports:
            user_name = r.get("userName", "Unknown Member")
            user_title = r.get("userTitle", "Contributor")
            proj_name = r.get("projectName", "General")
            status = r.get("status", "Draft")
            version = r.get("currentVersion", 1)

            entry = [f"\n- **{user_name}** ({user_title}) - Project: {proj_name} | Status: **{status}** (v{version})"]

            # Completed tasks & deliverables
            tasks = r.get("tasksCompleted") or []
            if tasks:
                t_strs = []
                for t in tasks:
                    t_name = t.get("taskName", "")
                    pct = t.get("actualPercent", 100)
                    deliv = t.get("outputDeliverable", "")
                    d_str = f" [Deliverable: {deliv}]" if deliv else ""
                    t_strs.append(f"{t_name} ({pct}%){d_str}")
                entry.append(f"  * Completed Tasks: {'; '.join(t_strs)}")

            # Planned tasks
            planned = r.get("tasksPlannedNextWeek") or []
            if planned:
                p_strs = [p.get("taskName", "") for p in planned if p.get("taskName")]
                if p_strs:
                    entry.append(f"  * Planned Next Week: {'; '.join(p_strs)}")

            # Blockers
            blockers = r.get("blockers") or []
            if blockers:
                b_strs = []
                for b in blockers:
                    desc = b.get("description", "")
                    is_key = b.get("isKeyIssue", False)
                    flag = " ⚠️ [CRITICAL KEY ISSUE]" if is_key else ""
                    b_strs.append(f"{desc}{flag}")
                entry.append(f"  * Blockers: {'; '.join(b_strs)}")

            # Hours breakdown
            hours = r.get("hoursWorked") or {}
            if hours:
                dev = hours.get("development", 0)
                test = hours.get("testing", 0)
                meet = hours.get("meetings", 0)
                doc = hours.get("documentation", 0)
                total_hrs = dev + test + meet + doc + (hours.get("other", 0) or 0)
                entry.append(f"  * Hours: {total_hrs} hrs (Dev: {dev}h, Test: {test}h, Meetings: {meet}h, Doc: {doc}h)")

            # Latest manager review comment
            if r.get("latestManagerComment"):
                entry.append(f"  * Manager Feedback: \"{r.get('latestManagerComment')}\"")

            report_lines.append("\n".join(entry))
        sections.append("\n".join(report_lines))
    else:
        sections.append("### Contributor Weekly Submissions:\nNo report submissions found for this reporting period.")

    if projects_context:
        sections.append("### Workspace Projects:\n" + "\n".join(projects_context))

    context_markdown = "\n\n".join(sections)
    sources_count = len(matched_reports)
    return context_markdown, sources_count


def _build_deterministic_fallback(query: str, context_text: str, week_label: str) -> str:
    """Provide a reliable, factual markdown answer when Groq API is offline or unconfigured."""
    return (
        f"**Weekly Intelligence Summary for {week_label}:**\n\n"
        f"{context_text}\n\n"
        "*(Generated directly via Dashboard Lightweight RAG engine)*"
    )


async def run_rag(
    query: str,
    selected_week: str,
    rolling_summary: str = "",
) -> Dict[str, Any]:
    """Execute simple, minimal RAG: Retrieve context -> Synthesize answer via ChatGroq."""
    effective_week = selected_week or "Week 36 (Aug 31 - Sep 06, 2026)"
    context_text, sources_count = await retrieve_report_context(query, effective_week)

    api_key = os.getenv("GROQ_API_KEY", "").strip()
    if not api_key:
        logger.info("GROQ_API_KEY is unset; returning direct RAG context fallback.")
        return {
            "reply": _build_deterministic_fallback(query, context_text, effective_week),
            "sources_count": sources_count,
        }

    try:
        llm = LLMFactory.get_llm(LLMTier.STANDARD)
        system_prompt = (
            "You are the AI Intelligence Assistant for the Weekly Report Generator & Team Dashboard.\n"
            "Your job is to answer user questions factually and concisely using ONLY the retrieved report data provided below.\n\n"
            "Guidelines:\n"
            "1. Cite specific contributor names, deliverables, project codes, and metrics from the context.\n"
            "2. If blockers are mentioned, clearly state if they are flagged as critical key issues.\n"
            "3. Do not invent or assume facts not present in the context.\n"
            "4. Format your answer with clean markdown bullet points, bold names, and concise summaries."
        )

        user_content_parts = []
        if rolling_summary:
            user_content_parts.append(f"Prior Conversation Context:\n{rolling_summary}\n")

        user_content_parts.append(f"Retrieved Report Context:\n{context_text}\n")
        user_content_parts.append(f"User Question: {query}")

        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content="\n".join(user_content_parts)),
        ]

        response = await llm.ainvoke(messages)
        reply_text = str(response.content).strip()

        if reply_text and len(reply_text) > 10:
            return {
                "reply": reply_text,
                "sources_count": sources_count,
            }

        return {
            "reply": _build_deterministic_fallback(query, context_text, effective_week),
            "sources_count": sources_count,
        }

    except Exception as exc:
        logger.warning(f"Error during ChatGroq RAG invocation: {exc}. Using deterministic fallback.")
        return {
            "reply": _build_deterministic_fallback(query, context_text, effective_week),
            "sources_count": sources_count,
        }

