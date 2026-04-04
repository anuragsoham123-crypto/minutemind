import json
from datetime import datetime, timezone
from typing import List, Optional
from database import get_db
from models.schemas import BriefResponse, BriefAgendaItem, ActionItem, Decision, Gap
from services.ai_service import _get_client


async def generate_pre_meeting_brief(user_uid: str, team_id: Optional[str] = None, topic: Optional[str] = None) -> BriefResponse:
    """Generate a pre-meeting brief by synthesizing unresolved items from past meetings."""
    db = get_db()
    
    # 1. Fetch relevant meetings for context
    meetings_ref = db.collection("meetings").where("created_by", "==", user_uid)
    
    # Simple keyword search if topic is provided, otherwise just get last 10
    all_docs = list(meetings_ref.order_by("created_at", direction="DESCENDING").limit(20).stream())
    
    relevant_docs = []
    if topic:
        topic_lower = topic.lower()
        for doc in all_docs:
            d = doc.to_dict()
            if topic_lower in d.get("title", "").lower() or topic_lower in (d.get("summary") or "").lower():
                relevant_docs.append(doc)
    else:
        # If no topic, take the last 5
        relevant_docs = all_docs[:5]

    if not relevant_docs:
        return BriefResponse(generated_at=datetime.now(timezone.utc).isoformat())

    # 2. Extract unresolved items
    unresolved_tasks = []
    soft_decisions = []
    open_gaps = []
    
    for doc in relevant_docs:
        m_data = doc.to_dict()
        
        # Decisions
        for dec in m_data.get("decisions", []):
            if isinstance(dec, dict) and dec.get("confidence") == "low":
                soft_decisions.append(Decision(**dec))
        
        # Tasks & Gaps
        for t in doc.reference.collection("tasks").where("status", "!=", "completed").stream():
            td = t.to_dict()
            td["id"] = t.id
            unresolved_tasks.append(ActionItem(**td))
            
        for g in doc.reference.collection("gaps").where("resolved", "==", False).stream():
            gd = g.to_dict()
            gd["id"] = g.id
            open_gaps.append(Gap(**gd))

    # 3. AI Synthesis (Agenda & Risks)
    client = _get_client()
    
    # Prepare context for AI
    context_str = f"""
    Topic/Context: {topic if topic else "General Team Sync"}
    Open Tasks: {[t.task for t in unresolved_tasks[:15]]}
    Soft Decisions (ambiguous): {[d.decision for d in soft_decisions[:10]]}
    Unresolved Gaps: {[g.description for g in open_gaps[:10]]}
    """
    
    prompt = f"""
    You are a Strategic Meeting Architect. Based on the unresolved context from previous meetings provided below, 
    generate a high-impact pre-meeting brief.
    
    {context_str}
    
    Return a JSON object with:
    1. "suggested_agenda": A list of up to 5 items. Each with "title", "description", and "priority" (high/medium/low).
    2. "strategic_risks": A list of 2-3 risks if these items remain unaddressed.
    
    Focus on items that seem like circular debates or critical path blockers.
    """
    
    try:
        resp = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You excel at meeting preparation and executive summaries."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.4,
            response_format={"type": "json_object"}
        )
        ai_data = json.loads(resp.choices[0].message.content)
        
        return BriefResponse(
            generated_at=datetime.now(timezone.utc).isoformat(),
            suggested_agenda=[BriefAgendaItem(**item) for item in ai_data.get("suggested_agenda", [])],
            unresolved_tasks=unresolved_tasks[:10],
            soft_decisions_to_review=soft_decisions[:10],
            open_gaps=open_gaps[:10],
            strategic_risks=ai_data.get("strategic_risks", [])
        )
    except Exception as e:
        print(f"Brief generation AI failure: {e}")
        return BriefResponse(
            generated_at=datetime.now(timezone.utc).isoformat(),
            unresolved_tasks=unresolved_tasks[:10],
            soft_decisions_to_review=soft_decisions[:10],
            open_gaps=open_gaps[:10]
        )
