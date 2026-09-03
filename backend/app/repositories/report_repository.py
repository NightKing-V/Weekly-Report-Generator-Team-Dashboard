from typing import List, Optional, Dict, Any
from datetime import datetime
from app.clients.database.mongo_client import get_collection


class ReportRepository:
    def __init__(self):
        self._reports_coll_name = "reports"
        self._projects_coll_name = "projects"

    @property
    def reports_collection(self):
        return get_collection(self._reports_coll_name)

    @property
    def projects_collection(self):
        return get_collection(self._projects_coll_name)

    # -------------------------------------------------------------
    # Report Operations
    # -------------------------------------------------------------
    async def get_reports(
        self,
        week_label: Optional[str] = None,
        user_id: Optional[str] = None,
        project_id: Optional[str] = None,
        status: Optional[str] = None,
    ) -> List[dict]:
        """Fetch reports with optional filtering by week, user, project, or status."""
        query: Dict[str, Any] = {}
        if week_label and week_label != "all":
            query["weekLabel"] = week_label
        if user_id and user_id != "all":
            query["userId"] = user_id
        if project_id and project_id != "all":
            query["projectId"] = project_id
        if status and status != "All":
            query["status"] = status

        cursor = self.reports_collection.find(query, {"_id": 0}).sort("submittedAt", -1)
        return await cursor.to_list(length=200)

    async def get_report_by_id(self, report_id: str) -> Optional[dict]:
        """Fetch a single report by its ID."""
        return await self.reports_collection.find_one({"id": report_id}, {"_id": 0})

    async def get_user_report_for_week(self, user_id: str, week_label: str) -> Optional[dict]:
        """Find an existing report for a specific user and week."""
        return await self.reports_collection.find_one(
            {"userId": user_id, "weekLabel": week_label},
            {"_id": 0},
        )

    async def upsert_report(self, report_data: dict) -> dict:
        """Insert or replace a report document."""
        report_id = report_data.get("id")
        await self.reports_collection.replace_one(
            {"id": report_id},
            dict(report_data),
            upsert=True,
        )
        return await self.get_report_by_id(report_id)

    async def update_report(self, report_id: str, updates: dict) -> Optional[dict]:
        """Apply partial updates to a report document."""
        result = await self.reports_collection.update_one(
            {"id": report_id},
            {"$set": updates},
        )
        if result.matched_count == 0:
            return None
        return await self.get_report_by_id(report_id)

    # -------------------------------------------------------------
    # Project / Category Operations
    # -------------------------------------------------------------
    async def get_all_projects(self) -> List[dict]:
        """Fetch all project categories."""
        cursor = self.projects_collection.find({}, {"_id": 0})
        return await cursor.to_list(length=100)

    async def get_project_by_id(self, project_id: str) -> Optional[dict]:
        """Find project by string ID."""
        return await self.projects_collection.find_one({"id": project_id}, {"_id": 0})

    async def create_project(self, project_data: dict) -> dict:
        """Insert a new project category."""
        await self.projects_collection.insert_one(dict(project_data))
        return await self.get_project_by_id(project_data["id"])

    async def update_project(self, project_id: str, updates: dict) -> Optional[dict]:
        """Update existing project category."""
        result = await self.projects_collection.update_one(
            {"id": project_id},
            {"$set": updates},
        )
        if result.matched_count == 0:
            return None
        return await self.get_project_by_id(project_id)

    async def delete_project(self, project_id: str) -> bool:
        """Delete project category."""
        result = await self.projects_collection.delete_one({"id": project_id})
        return result.deleted_count > 0


# Default singleton instance
report_repository = ReportRepository()

