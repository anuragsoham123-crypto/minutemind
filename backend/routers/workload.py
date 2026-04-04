from fastapi import APIRouter, Depends, Query, HTTPException
from typing import Optional
from database import get_db
from models.schemas import WorkloadReport, MemberWorkload, ActionItem
from middleware.auth import get_current_user
from datetime import datetime, timezone


router = APIRouter(prefix="/api/workload", tags=["workload"])


@router.get("", response_model=WorkloadReport)
async def get_team_workload(
    team_id: Optional[str] = Query(None),
    user: dict = Depends(get_current_user)
):
    """Aggregate all meeting tasks within a team and calculate individual load scores."""
    db = get_db()
    
    # 1. Fetch relevant meetings
    meetings_query = db.collection("meetings").where("created_by", "==", user["uid"])
    # Note: For now, we search all user's meetings. Later we can filter by team_id 
    # once we have a tighter mapping in Phase 5.
    
    meetings = list(meetings_query.stream())
    
    member_stats = {}
    dept_stats = {}
    all_open_tasks = 0
    
    for meeting in meetings:
        tasks = meeting.reference.collection("tasks").stream()
        for t in tasks:
            td = t.to_dict()
            owner_email = td.get("owner_email")
            owner_name = td.get("owner", "Unassigned")
            status = td.get("status", "created")
            dept = td.get("department", "General")
            
            if not owner_email:
                continue

            if owner_email not in member_stats:
                member_stats[owner_email] = {
                    "name": owner_name,
                    "email": owner_email,
                    "total": 0, "completed": 0, "in_progress": 0, "overdue": 0
                }
            
            stats = member_stats[owner_email]
            stats["total"] += 1
            if status == "completed":
                stats["completed"] += 1
            elif status == "overdue":
                stats["overdue"] += 1
                all_open_tasks += 1
            elif status == "in_progress":
                stats["in_progress"] += 1
                all_open_tasks += 1
            else:
                all_open_tasks += 1

            if status != "completed":
                dept_stats[dept] = dept_stats.get(dept, 0) + 1

    # 2. Convert to MemberWorkload objects and calculate load scores
    member_list = []
    max_load = 0
    for email, s in member_stats.items():
        open_count = s["total"] - s["completed"]
        max_load = max(max_load, open_count)
        
    for email, s in member_stats.items():
        open_count = s["total"] - s["completed"]
        member_list.append(MemberWorkload(
            name=s["name"],
            email=s["email"],
            total_tasks=s["total"],
            completed=s["completed"],
            in_progress=s["in_progress"],
            overdue=s["overdue"],
            load_score=round(open_count / max(1, max_load), 2)
        ))

    # 3. Analyze Bottlenecks
    bottlenecks = [dept for dept, count in dept_stats.items() if count >= 10]
    
    recommendations = []
    # Find most overloaded vs most underutilized
    sorted_members = sorted(member_list, key=lambda x: x.load_score, reverse=True)
    if len(sorted_members) >= 2:
        over = sorted_members[0]
        under = sorted_members[-1]
        if over.load_score > 0.8 and under.load_score < 0.3:
            recommendations.append(f"Consider redistributing some of {over.name}'s workload to {under.name}.")
    
    if bottlenecks:
        recommendations.append(f"The {', '.join(bottlenecks)} department(s) are experiencing significant backlogs.")

    return WorkloadReport(
        team_id=team_id,
        generated_at=datetime.now(timezone.utc).isoformat(),
        members=member_list,
        bottleneck_departments=bottlenecks,
        recommendations=recommendations
    )
