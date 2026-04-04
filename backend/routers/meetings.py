from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends
from typing import Optional
from database import get_db
from models.schemas import MeetingCreate, MeetingResponse, MeetingUpdate, GapUpdate, AnalysisResult, ActionItem, Gap, Decision
from services.ai_service import analyze_transcript
from services.whisper_service import transcribe_audio
from middleware.auth import get_current_user
from middleware.rate_limiter import check_rate_limit
from datetime import datetime, timezone

router = APIRouter(prefix="/api/meetings", tags=["meetings"])


@router.post("", status_code=201)
async def create_meeting(
    title: str = Form(...),
    transcript: Optional[str] = Form(None),
    audio: Optional[UploadFile] = File(None),
    user: dict = Depends(get_current_user),
):
    """Create a new meeting. Accepts transcript text and/or audio file.
    Audio is NOT stored — only the transcript is kept."""
    db = get_db()

    # Rate limit AI-heavy operations
    check_rate_limit(user["uid"], "create_meeting")

    final_transcript = transcript or ""

    # If audio file uploaded, transcribe via Whisper then DISCARD audio
    if audio:
        audio_bytes = await audio.read()
        whisper_text = await transcribe_audio(audio_bytes, audio.filename or "audio.wav")
        final_transcript = (final_transcript + "\n\n" + whisper_text).strip() if final_transcript else whisper_text
        # Audio bytes are NOT stored — they go out of scope and are garbage collected

    if not final_transcript:
        raise HTTPException(status_code=400, detail="Provide either a transcript or an audio file.")

    meeting_data = {
        "title": title,
        "transcript": final_transcript,
        "summary": None,
        "decisions": [],
        "created_by": user["uid"],
        "created_by_name": user.get("name", ""),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    doc_ref = db.collection("meetings").document()
    doc_ref.set(meeting_data)

    return {"id": doc_ref.id, "title": title, "message": "Meeting created"}


@router.post("/{meeting_id}/analyze")
async def analyze_meeting(meeting_id: str, user: dict = Depends(get_current_user)):
    """Run AI pipeline on a meeting's transcript."""
    db = get_db()

    # Rate limit AI-heavy operations
    check_rate_limit(user["uid"], "analyze")

    doc_ref = db.collection("meetings").document(meeting_id)
    doc = doc_ref.get()

    if not doc.exists:
        raise HTTPException(status_code=404, detail="Meeting not found")

    data = doc.to_dict()

    # Verify ownership
    if data.get("created_by") != user["uid"]:
        raise HTTPException(status_code=403, detail="You don't have access to this meeting")

    transcript = data.get("transcript", "")
    if not transcript:
        raise HTTPException(status_code=400, detail="No transcript to analyze")

    # Run AI pipeline
    try:
        result: AnalysisResult = await analyze_transcript(transcript)
    except Exception as e:
        error_msg = str(e).lower()
        if "quota" in error_msg or "rate" in error_msg or "resource" in error_msg or "429" in error_msg:
            raise HTTPException(
                status_code=429,
                detail="Gemini API rate limit reached. Please wait a minute and try again."
            )
        raise HTTPException(
            status_code=502,
            detail=f"AI analysis failed: {str(e)}"
        )

    # Store summary + decisions and AI Phase 4 metrics on the meeting doc
    doc_ref.update({
        "summary": result.summary,
        "decisions": [d.model_dump() for d in result.decisions],
        "remeeting_risk_score": result.remeeting_risk_score,
        "remeeting_risk_reason": result.remeeting_risk_reason,
        "ghost_tasks": [gt.model_dump() for gt in result.ghost_tasks],
        "bomb_risks": [br.model_dump() for br in result.bomb_risks]
    })

    # Store tasks as subcollection
    tasks_col = doc_ref.collection("tasks")
    for item in result.action_items:
        tasks_col.add(item.model_dump())

    # Store gaps as subcollection
    gaps_col = doc_ref.collection("gaps")
    for gap in result.gaps:
        gaps_col.add(gap.model_dump())

    return {
        "message": "Analysis complete",
        "summary": result.summary,
        "decisions": [d.model_dump() for d in result.decisions],
        "action_items": [i.model_dump() for i in result.action_items],
        "gaps": [g.model_dump() for g in result.gaps],
    }


@router.get("")
async def list_meetings(user: dict = Depends(get_current_user)):
    """List meetings created by the authenticated user."""
    db = get_db()
    meetings = []
    docs = (
        db.collection("meetings")
        .where("created_by", "==", user["uid"])
        .order_by("created_at", direction="DESCENDING")
        .stream()
    )

    for doc in docs:
        d = doc.to_dict()
        meetings.append({
            "id": doc.id,
            "title": d.get("title"),
            "summary": d.get("summary"),
            "created_at": d.get("created_at"),
        })

    return meetings


@router.get("/{meeting_id}")
async def get_meeting(meeting_id: str, user: dict = Depends(get_current_user)):
    """Get full meeting detail with tasks and gaps."""
    db = get_db()
    doc_ref = db.collection("meetings").document(meeting_id)
    doc = doc_ref.get()

    if not doc.exists:
        raise HTTPException(status_code=404, detail="Meeting not found")

    data = doc.to_dict()

    # Verify ownership
    if data.get("created_by") != user["uid"]:
        raise HTTPException(status_code=403, detail="You don't have access to this meeting")

    # Fetch tasks subcollection
    tasks = []
    for t in doc_ref.collection("tasks").stream():
        td = t.to_dict()
        td["id"] = t.id
        tasks.append(td)

    # Fetch gaps subcollection
    gaps = []
    for g in doc_ref.collection("gaps").stream():
        gd = g.to_dict()
        gd["id"] = g.id
        gaps.append(gd)

    return MeetingResponse(
        id=doc.id,
        title=data.get("title", ""),
        transcript=data.get("transcript"),
        summary=data.get("summary"),
        decisions=data.get("decisions", []),
        action_items=[ActionItem(**t) for t in tasks],
        gaps=[Gap(**g) for g in gaps],
        created_at=data.get("created_at"),
    )


@router.put("/{meeting_id}")
async def update_meeting(meeting_id: str, update: MeetingUpdate, user: dict = Depends(get_current_user)):
    """Edit meeting title, summary, or decisions."""
    db = get_db()
    doc_ref = db.collection("meetings").document(meeting_id)
    doc = doc_ref.get()

    if not doc.exists:
        raise HTTPException(status_code=404, detail="Meeting not found")

    data = doc.to_dict()
    if data.get("created_by") != user["uid"]:
        raise HTTPException(status_code=403, detail="You don't have access to this meeting")

    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    if update_data:
        doc_ref.update(update_data)

    return {"message": "Meeting updated"}


@router.patch("/{meeting_id}/gaps/{gap_id}")
async def update_gap(meeting_id: str, gap_id: str, update: GapUpdate, user: dict = Depends(get_current_user)):
    """Resolve or update a gap/attention item."""
    db = get_db()
    meeting_doc = db.collection("meetings").document(meeting_id).get()

    if not meeting_doc.exists:
        raise HTTPException(status_code=404, detail="Meeting not found")
    if meeting_doc.to_dict().get("created_by") != user["uid"]:
        raise HTTPException(status_code=403, detail="You don't have access to this meeting")

    gap_ref = db.collection("meetings").document(meeting_id).collection("gaps").document(gap_id)
    gap_doc = gap_ref.get()

    if not gap_doc.exists:
        raise HTTPException(status_code=404, detail="Gap not found")

    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    if update_data:
        gap_ref.update(update_data)

    return {"message": "Gap updated"}


@router.get("/handoff/{meeting_id}")
async def get_public_handoff(meeting_id: str):
    """Public read-only route for the visual Shareable Handoff Card."""
    db = get_db()
    doc_ref = db.collection("meetings").document(meeting_id)
    doc = doc_ref.get()

    if not doc.exists:
        raise HTTPException(status_code=404, detail="Meeting not found")

    data = doc.to_dict()
    
    tasks = []
    # Only fetch top 3 highest priority/confidence tasks for a clean card
    for t in doc_ref.collection("tasks").stream():
        td = t.to_dict()
        td["id"] = t.id
        if td.get("status") != "completed":
            tasks.append(td)
            
    # Sort custom: High priority and high confidence first
    tasks.sort(key=lambda x: (
        0 if x.get("priority") == "high" else 1 if x.get("priority") == "medium" else 2,
        -float(x.get("confidence_score", 0))
    ))
    
    # Take top 3
    tasks = tasks[:3]
    
    # Decisions (Top 3)
    decisions = data.get("decisions", [])[:3]

    return {
        "title": data.get("title", "Meeting"),
        "date": data.get("created_at"),
        "summary": data.get("summary", ""),
        "decisions": decisions,
        "tasks": tasks,
        "remeeting_risk_score": data.get("remeeting_risk_score"),
        "bomb_risks": data.get("bomb_risks", [])[:1]  # Return just the top risk
    }
