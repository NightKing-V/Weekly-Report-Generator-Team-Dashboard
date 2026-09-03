from typing import Optional, List, Literal, Dict, Any
from pydantic import BaseModel, Field, field_validator

TaskPriority = Literal["Low", "Medium", "High", "Urgent"]
TaskStatus = Literal["Completed", "In Progress", "Delayed", "Blocked"]
ReportStatus = Literal["Draft", "Submitted", "Needs Correction", "Approved"]
ReviewAction = Literal["approve", "request_changes"]


class CompletedTaskModel(BaseModel):
    id: str
    taskName: str
    priority: TaskPriority = "Medium"
    plannedPercent: int = Field(default=100, ge=0, le=100)
    actualPercent: int = Field(default=100, ge=0, le=100)
    status: TaskStatus = "Completed"
    plannedHours: float = 0
    spentHours: float = 0
    outputDeliverable: Optional[str] = ""


class PlannedTaskModel(BaseModel):
    id: str
    taskName: str
    priority: TaskPriority = "Medium"
    estimatedHours: float = 0
    notes: Optional[str] = None


class BlockerModel(BaseModel):
    id: str
    description: str
    isKeyIssue: bool = False
    impact: Optional[str] = None


class AchievementModel(BaseModel):
    id: str
    description: str
    isKeyAchievement: bool = False


class HoursWorkedModel(BaseModel):
    development: float = 0
    testing: float = 0
    meetings: float = 0
    documentation: float = 0
    other: Optional[float] = 0


class ReviewCommentModel(BaseModel):
    id: str
    authorId: str
    authorName: str
    authorRole: str
    comment: str
    action: ReviewAction
    createdAt: str
    versionNumber: int = 1


class ReportVersionModel(BaseModel):
    versionNumber: int
    submittedAt: Optional[str] = None
    submittedBy: Optional[str] = None
    content: Dict[str, Any]
    reviewComment: Optional[ReviewCommentModel] = None


class WeeklyReportModel(BaseModel):
    id: str
    userId: str
    userName: str
    userTitle: Optional[str] = "Software Engineer"
    userDepartment: Optional[str] = "Engineering"
    weekStartDate: str
    weekEndDate: str
    weekLabel: str
    projectId: str
    projectName: str
    status: ReportStatus = "Draft"
    tasksCompleted: List[CompletedTaskModel] = Field(default_factory=list)
    tasksPlannedNextWeek: List[PlannedTaskModel] = Field(default_factory=list)
    blockers: List[BlockerModel] = Field(default_factory=list)
    achievements: List[AchievementModel] = Field(default_factory=list)
    hoursWorked: HoursWorkedModel = Field(default_factory=HoursWorkedModel)
    notesOrLinks: Optional[str] = ""
    currentVersion: int = 1
    versions: List[ReportVersionModel] = Field(default_factory=list)
    reviewHistory: List[ReviewCommentModel] = Field(default_factory=list)
    latestManagerComment: Optional[str] = None
    submittedAt: Optional[str] = None
    reviewedAt: Optional[str] = None
    createdAt: Optional[str] = None
    updatedAt: Optional[str] = None

    @field_validator(
        "tasksCompleted",
        "tasksPlannedNextWeek",
        "blockers",
        "achievements",
        "versions",
        "reviewHistory",
        mode="before",
    )
    @classmethod
    def default_empty_list_if_none(cls, v):
        return v if v is not None else []

    class Config:
        populate_by_name = True


class ReportSaveDraftRequest(BaseModel):
    id: Optional[str] = None
    userId: Optional[str] = None
    userName: Optional[str] = None
    userTitle: Optional[str] = None
    userDepartment: Optional[str] = None
    weekStartDate: Optional[str] = None
    weekEndDate: Optional[str] = None
    weekLabel: Optional[str] = None
    projectId: Optional[str] = None
    projectName: Optional[str] = None
    tasksCompleted: Optional[List[CompletedTaskModel]] = None
    tasksPlannedNextWeek: Optional[List[PlannedTaskModel]] = None
    blockers: Optional[List[BlockerModel]] = None
    achievements: Optional[List[AchievementModel]] = None
    hoursWorked: Optional[HoursWorkedModel] = None
    notesOrLinks: Optional[str] = None


class ReportSubmitRequest(BaseModel):
    id: Optional[str] = None
    userId: str
    userName: str
    userTitle: Optional[str] = None
    userDepartment: Optional[str] = None
    weekStartDate: str
    weekEndDate: str
    weekLabel: str
    projectId: str
    projectName: Optional[str] = None
    tasksCompleted: List[CompletedTaskModel]
    tasksPlannedNextWeek: Optional[List[PlannedTaskModel]] = None
    blockers: Optional[List[BlockerModel]] = None
    achievements: Optional[List[AchievementModel]] = None
    hoursWorked: HoursWorkedModel
    notesOrLinks: Optional[str] = None


class ReportReviewActionRequest(BaseModel):
    authorId: str
    authorName: str
    authorRole: str = "manager"
    comment: Optional[str] = None


class ProjectModel(BaseModel):
    id: str
    name: str
    code: str
    description: Optional[str] = ""
    status: Literal["Active", "On Hold", "Completed"] = "Active"
    color: str = "#3b82f6"
    assignedMemberIds: Optional[List[str]] = Field(default_factory=list)
    createdAt: Optional[str] = None

    class Config:
        populate_by_name = True


class ProjectCreate(BaseModel):
    name: str
    code: str
    description: Optional[str] = ""
    status: Literal["Active", "On Hold", "Completed"] = "Active"
    color: Optional[str] = "#3b82f6"
    assignedMemberIds: Optional[List[str]] = Field(default_factory=list)


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    description: Optional[str] = None
    status: Optional[Literal["Active", "On Hold", "Completed"]] = None
    color: Optional[str] = None
    assignedMemberIds: Optional[List[str]] = None


class DashboardMetricsModel(BaseModel):
    totalSubmittedThisWeek: int
    submissionComplianceRate: int
    needsCorrectionCount: int
    openBlockersCount: int
    totalTeamMembers: int
    approvedCount: int
    pendingReviewCount: int

