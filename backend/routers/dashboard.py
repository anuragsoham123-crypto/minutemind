from fastapi import APIRouter, Depends
from database import get_db
from models.schemas import DashboardResponse, MeetingResponse, ActionItem, Gap
from middleware.auth import get_current_user
from middleware.rate_limiter import get_usage
from config import CONFIDENCE_THRESHOLD

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("")
async def get_dashboard(user: dict = Depends(get_current_user)):
    """Aggregated dashboard: stats, recent meetings, attention-needed items, usage info."""
    db = get_db()

    # Fetch only user's meetings
    meetings_docs = list(
        db.collection("meetings")
        .where("created_by", "==", user["uid"])
        .order_by("created_at", direction="DESCENDING")
        .limit(10)
        .stream()
    )

    recent_meetings = []
    all_tasks_count = 0
    completed_count = 0
    overdue_count = 0
    in_progress_count = 0
    soft_decisions_count = 0
    attention_needed = []

    for doc in meetings_docs:
        d = doc.to_dict()
        meeting_tasks = []
        meeting_gaps = []

        # Count soft decisions
        decisions = d.get("decisions", [])
        for dec in decisions:
            if isinstance(dec, dict) and dec.get("confidence") == "low":
                soft_decisions_count += 1

        for t in doc.reference.collection("tasks").stream():
            td = t.to_dict()
            td["id"] = t.id
            meeting_tasks.append(ActionItem(**td))
            all_tasks_count += 1

            status = td.get("status", "")
            if status == "completed":
                completed_count += 1
            elif status == "overdue":
                overdue_count += 1
            elif status == "in_progress":
                in_progress_count += 1

            # Flag attention-needed items
            if td.get("confidence_score", 1) < CONFIDENCE_THRESHOLD:
                attention_needed.append(ActionItem(**td))

        for g in doc.reference.collection("gaps").stream():
            gd = g.to_dict()
            gd["id"] = g.id
            meeting_gaps.append(Gap(**gd))

        recent_meetings.append(MeetingResponse(
            id=doc.id,
            title=d.get("title", ""),
            summary=d.get("summary"),
            decisions=decisions,
            action_items=meeting_tasks,
            gaps=meeting_gaps,
            created_at=d.get("created_at"),
        ))

    total_meetings = len(list(
        db.collection("meetings")
        .where("created_by", "==", user["uid"])
        .stream()
    ))

    return {
        "total_meetings": total_meetings,
        "total_tasks": all_tasks_count,
        "tasks_completed": completed_count,
        "tasks_overdue": overdue_count,
        "tasks_in_progress": in_progress_count,
        "soft_decisions_count": soft_decisions_count,
        "recent_meetings": [m.model_dump() for m in recent_meetings],
        "attention_needed": [a.model_dump() for a in attention_needed],
        "usage": get_usage(user["uid"]),
    }
