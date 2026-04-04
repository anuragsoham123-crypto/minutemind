import json
from datetime import datetime, timezone, timedelta
from typing import List
from database import get_db
from models.schemas import PatternReport, PatternInsight, ActionItem, Decision
from services.ai_service import _get_client


async def analyze_patterns(user_uid: str) -> PatternReport:
    """Scan the last 10 meetings to detect organizational and team patterns."""
    db = get_db()
    
    # 1. Fetch data
    meetings_docs = list(
        db.collection("meetings")
        .where("created_by", "==", user_uid)
        .order_by("created_at", direction="DESCENDING")
        .limit(10)
        .stream()
    )
    
    if not meetings_docs:
        return PatternReport(generated_at=datetime.now(timezone.utc).isoformat(), insights=[])

    all_decisions = []
    all_open_tasks: List[ActionItem] = []
    soft_decision_meetings = 0
    
    one_week_ago = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
    
    for doc in meetings_docs:
        d = doc.to_dict()
        m_id = doc.id
        
        # Decisions format normalization
        decs = d.get("decisions", [])
        m_soft_decs = 0
        for dec in decs:
            if isinstance(dec, dict):
                all_decisions.append(dec.get("decision", ""))
                if dec.get("confidence") == "low":
                    m_soft_decs += 1
            else:
                all_decisions.append(str(dec))
        
        if m_soft_decs >= 2:
            soft_decision_meetings += 1
            
        # Tasks
        m_created_at = d.get("created_at", "")
        for t in doc.reference.collection("tasks").stream():
            td = t.to_dict()
            status = td.get("status", "created")
            if status != "completed":
                td["id"] = t.id
                ai = ActionItem(**td)
                ai._meeting_created_at = m_created_at
                all_open_tasks.append(ai)

    # 2. Heuristic: Stuck Tasks & Overloaded Members
    insights = []
    
    # Stuck Tasks - tasks from older meetings
    stuck_tasks = [t for t in all_open_tasks if getattr(t, "_meeting_created_at", "") < one_week_ago]
    if len(stuck_tasks) >= 3:
        insights.append(PatternInsight(
            type="stuck_task",
            severity="warning",
            title=f"{len(stuck_tasks)} tasks are stuck across meetings",
            description="Several action items from meetings older than 7 days have not been completed. This is creating a backlog.",
            data={"count": len(stuck_tasks), "uncompleted_tasks": [t.model_dump() for t in stuck_tasks]}
        ))

    # Overloaded Members
    owner_counts = {}
    owner_tasks = {}
    for t in all_open_tasks:
        if t.owner:
            owner_counts[t.owner] = owner_counts.get(t.owner, 0) + 1
            if t.owner not in owner_tasks: owner_tasks[t.owner] = []
            owner_tasks[t.owner].append(t.model_dump())
            
    for owner, count in owner_counts.items():
        if count >= 8:
            insights.append(PatternInsight(
                type="overloaded_member",
                severity="critical",
                title=f"{owner} is critically overloaded",
                description=f"This team member has {count} active tasks across your recent meetings. This is a potential bottleneck.",
                data={"owner": owner, "count": count, "uncompleted_tasks": owner_tasks[owner]}
            ))

    # Soft Decision Pattern
    if soft_decision_meetings >= 3:
        insights.append(PatternInsight(
            type="soft_decision_pattern",
            severity="warning",
            title="Culture of Soft Decisions",
            description="At least 3 of your recent meetings have multiple low-confidence decisions. This suggests a pattern of ambiguity in your team.",
            data={"meeting_count": soft_decision_meetings, "uncompleted_tasks": [t.model_dump() for t in all_open_tasks]}
        ))

    # 3. AI: Recurring Topics (Llama analysis)
    if all_decisions:
        client = _get_client()
        prompt = f"""
        Given this list of decisions made across different meetings, identify if any topics are being re-debated or discussed multiple times WITHOUT reached a final resolution.
        
        Decisions:
        {json.dumps(all_decisions, indent=2)}
        
        Return a JSON object with:
        {{
          "recurring_topics": [
            {{
                "topic": "Brief name",
                "evidence": "Why you think this is recurring",
                "frequency": "How many times it appeared"
            }}
          ]
        }}
        If no recurring themes, return empty list.
        """
        
        try:
            resp = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": "You are an organizational health analyst. Focus on detecting circular debates."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                response_format={"type": "json_object"}
            )
            ai_data = json.loads(resp.choices[0].message.content)
            for rt in ai_data.get("recurring_topics", []):
                insights.append(PatternInsight(
                    type="recurring_topic",
                    severity="critical" if int(rt.get("frequency", 1)) >= 3 else "warning",
                    title=f"Recurring Topic: {rt['topic']}",
                    description=f"This topic has appeared in approximately {rt['frequency']} recent meetings. {rt['evidence']}. Consider scheduling a dedicated decision sync.",
                    data={**rt, "uncompleted_tasks": [t.model_dump() for t in all_open_tasks]}
                ))
        except Exception as e:
            print(f"AI Pattern Analysis failed: {e}")

    # 4. Save/Cache report (not implemented for now, return dynamic)
    return PatternReport(
        generated_at=datetime.now(timezone.utc).isoformat(),
        insights=insights
    )
