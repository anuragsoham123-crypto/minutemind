from pydantic import BaseModel, Field
from typing import Optional, Literal, Any
from datetime import datetime


# ── Request Models ──

class MeetingCreate(BaseModel):
    title: str
    transcript: Optional[str] = None  # optional if audio is uploaded


class TaskCreate(BaseModel):
    """For manually adding a task that the AI missed."""
    task: str
    owner: Optional[str] = None
    owner_email: Optional[str] = None
    deadline: Optional[str] = None
    deadline_type: Optional[Literal["explicit", "inferred"]] = None
    priority: Literal["high", "medium", "low"] = "medium"
    department: Optional[str] = None
    confidence_score: float = 1.0  # manual = full confidence
    status: str = "created"


class TaskUpdate(BaseModel):
    task: Optional[str] = None
    owner: Optional[str] = None
    owner_email: Optional[str] = None
    deadline: Optional[str] = None
    deadline_type: Optional[Literal["explicit", "inferred"]] = None
    priority: Optional[Literal["high", "medium", "low"]] = None
    department: Optional[str] = None
    status: Optional[Literal["created", "assigned", "in_progress", "completed", "overdue"]] = None


class MeetingUpdate(BaseModel):
    title: Optional[str] = None
    summary: Optional[str] = None
    decisions: Optional[list[Any]] = None  # accepts both str and Decision objects


class GapUpdate(BaseModel):
    description: Optional[str] = None
    resolved: Optional[bool] = None


class ReminderRecipient(BaseModel):
    name: str
    email: str
    task: str
    deadline: Optional[str] = None
    task_id: Optional[str] = None


class ReminderRequest(BaseModel):
    meeting_id: str
    meeting_title: str
    summary: Optional[str] = None
    decisions: list[Any] = []
    recipients: list[ReminderRecipient]


# ── Response Models ──

class Decision(BaseModel):
    """A scored decision with confidence level."""
    decision: str
    confidence: Literal["high", "medium", "low"] = "medium"
    reasoning: Optional[str] = None
    transcript_excerpt: Optional[str] = None


class ActionItem(BaseModel):
    id: Optional[str] = None
    task: str
    owner: Optional[str] = None
    owner_email: Optional[str] = None
    deadline: Optional[str] = None
    deadline_type: Optional[Literal["explicit", "inferred"]] = None
    priority: Literal["high", "medium", "low"] = "medium"
    department: Optional[str] = None
    confidence_score: float = Field(ge=0, le=1, default=0.5)
    status: str = "created"
    # Commitment tracking
    commitment_type: Optional[Literal["verbal_commitment", "assignment", "self_volunteered", "unclear"]] = None
    transcript_excerpt: Optional[str] = None
    transcript_position: Optional[float] = None  # 0.0–1.0 position in transcript


class Gap(BaseModel):
    id: Optional[str] = None
    description: str
    resolved: bool = False


class GhostTask(BaseModel):
    description: str
    reason: str


class BombRisk(BaseModel):
    description: str
    reason: str


class AnalysisResult(BaseModel):
    summary: str
    decisions: list[Decision] = []
    action_items: list[ActionItem] = []
    gaps: list[Gap] = []
    ghost_tasks: list[GhostTask] = []
    bomb_risks: list[BombRisk] = []
    remeeting_risk_score: Optional[int] = None
    remeeting_risk_reason: Optional[str] = None


class MeetingResponse(BaseModel):
    id: str
    title: str
    transcript: Optional[str] = None
    summary: Optional[str] = None
    decisions: list[Any] = []  # supports both str (legacy) and Decision objects
    action_items: list[ActionItem] = []
    gaps: list[Gap] = []
    ghost_tasks: list[GhostTask] = []
    bomb_risks: list[BombRisk] = []
    remeeting_risk_score: Optional[int] = None
    remeeting_risk_reason: Optional[str] = None
    created_at: Optional[str] = None


class DashboardResponse(BaseModel):
    total_meetings: int = 0
    total_tasks: int = 0
    tasks_completed: int = 0
    tasks_overdue: int = 0
    tasks_in_progress: int = 0
    soft_decisions_count: int = 0
    recent_meetings: list[MeetingResponse] = []
    attention_needed: list[ActionItem] = []


# ── Insights & Patterns ──

class PatternInsight(BaseModel):
    type: Literal["recurring_topic", "stuck_task", "overloaded_member", "underutilized_member", "soft_decision_pattern"]
    severity: Literal["info", "warning", "critical"]
    title: str
    description: str
    data: dict = {}


class PatternReport(BaseModel):
    generated_at: str
    insights: list[PatternInsight] = []


# ── Workload ──

class MemberWorkload(BaseModel):
    name: str
    email: str
    total_tasks: int = 0
    completed: int = 0
    in_progress: int = 0
    overdue: int = 0
    load_score: float = 0.0  # 0.0 to 1.0


class WorkloadReport(BaseModel):
    team_id: Optional[str] = None
    generated_at: str
    members: list[MemberWorkload] = []
    bottleneck_departments: list[str] = []
    recommendations: list[str] = []


# ── Teams ──

class TeamCreate(BaseModel):
    name: str
    department: Optional[str] = None


# ── Briefs ──

class BriefRequest(BaseModel):
    team_id: Optional[str] = None
    topic: Optional[str] = None


class BriefAgendaItem(BaseModel):
    title: str
    description: str
    priority: Literal["high", "medium", "low"]


class BriefResponse(BaseModel):
    generated_at: str
    suggested_agenda: list[BriefAgendaItem] = []
    unresolved_tasks: list[ActionItem] = []
    soft_decisions_to_review: list[Decision] = []
    open_gaps: list[Gap] = []
    strategic_risks: list[str] = []


class TeamInvite(BaseModel):
    email: str
    name: Optional[str] = None


class TeamMemberResponse(BaseModel):
    uid: Optional[str] = None
    email: str
    name: str = ""
    role: Literal["coordinator", "member"] = "member"
    status: Literal["pending", "active", "declined"] = "pending"


class TeamResponse(BaseModel):
    id: str
    name: str
    department: Optional[str] = None
    created_by: str
    created_at: Optional[str] = None
    members: list[TeamMemberResponse] = []


class InvitationResponse(BaseModel):
    id: str
    team_id: str
    team_name: str
    invited_by_name: str
    email: str
    status: Literal["pending", "accepted", "declined"] = "pending"
    created_at: Optional[str] = None


class TaskStatusUpdate(BaseModel):
    """Allows assignees to update only the status of their tasks."""
    status: Literal["created", "assigned", "in_progress", "completed", "overdue"]


class CrossTeamDependency(BaseModel):
    waiting_team: str
    blocking_team: str
    description: str
    recommended_action: str


class DependenciesResponse(BaseModel):
    generated_at: str
    dependencies: list[CrossTeamDependency] = []
