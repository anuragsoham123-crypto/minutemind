from fastapi import APIRouter, HTTPException, Depends
from database import get_db
from models.schemas import ReminderRequest
from middleware.auth import get_current_user
from config import SMTP_EMAIL
from services.email_service import send_email_smtp
router = APIRouter(prefix="/api/reminders", tags=["reminders"])


def _build_email_html(recipient_name: str, task: str, deadline: str | None,
                      meeting_title: str, summary: str | None, decisions: list[any]) -> str:
    """Build a styled HTML email for a task reminder."""
    deadline_text = deadline if deadline else "No deadline set"
    decisions_html = ""
    if decisions:
        processed_decisions = []
        for d in decisions:
            if isinstance(d, str):
                processed_decisions.append(d)
            elif isinstance(d, dict):
                processed_decisions.append(d.get("decision", "Unknown Decision"))
            else:
                processed_decisions.append(str(d))

        items = "".join(f"<li style='margin-bottom:6px;color:#d1d5db;'>{d}</li>" for d in processed_decisions)
        decisions_html = f"""
        <div style="margin-top:24px;">
            <h3 style="color:#a78bfa;font-size:14px;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:12px;">
                📌 Decisions Made
            </h3>
            <ul style="padding-left:20px;margin:0;">{items}</ul>
        </div>
        """

    summary_html = ""
    if summary:
        summary_html = f"""
        <div style="margin-top:24px;">
            <h3 style="color:#a78bfa;font-size:14px;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:12px;">
                🧠 Meeting Summary
            </h3>
            <p style="color:#d1d5db;line-height:1.7;margin:0;">{summary}</p>
        </div>
        """

    return f"""
    <!DOCTYPE html>
    <html>
    <body style="margin:0;padding:0;background-color:#0a0a1a;font-family:'Segoe UI',Arial,sans-serif;">
        <div style="max-width:600px;margin:40px auto;background:#111827;border-radius:16px;border:1px solid #1f2937;overflow:hidden;">
            <!-- Header -->
            <div style="background:linear-gradient(135deg,#7c3aed,#6366f1);padding:32px 28px;text-align:center;">
                <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;">🧠 MinuteMind</h1>
                <p style="margin:8px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">Task Reminder</p>
            </div>

            <!-- Body -->
            <div style="padding:28px;">
                <p style="color:#e5e7eb;font-size:16px;margin:0 0 20px;">
                    Hi <strong>{recipient_name}</strong>,
                </p>
                <p style="color:#d1d5db;margin:0 0 24px;line-height:1.6;">
                    You have an action item from the meeting <strong style="color:#a78bfa;">"{meeting_title}"</strong>:
                </p>

                <!-- Task Card -->
                <div style="background:#1f2937;border:1px solid #374151;border-radius:12px;padding:20px;margin-bottom:8px;">
                    <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
                        <span style="background:rgba(167,139,250,0.15);color:#a78bfa;padding:4px 10px;border-radius:6px;font-size:11px;font-weight:600;text-transform:uppercase;">
                            Action Required
                        </span>
                    </div>
                    <p style="color:#f3f4f6;font-size:15px;font-weight:600;margin:0 0 12px;line-height:1.5;">
                        {task}
                    </p>
                    <p style="color:#9ca3af;font-size:13px;margin:0;">
                        📅 Deadline: <strong style="color:#fbbf24;">{deadline_text}</strong>
                    </p>
                </div>

                {summary_html}
                {decisions_html}
            </div>

            <!-- Footer -->
            <div style="padding:20px 28px;border-top:1px solid #1f2937;text-align:center;">
                <p style="color:#6b7280;font-size:11px;margin:0;">
                    Sent via MinuteMind — AI-powered meeting execution
                </p>
            </div>
        </div>
    </body>
    </html>
    """


@router.post("/send")
async def send_reminders(request: ReminderRequest, user: dict = Depends(get_current_user)):
    """Send reminder emails to task owners."""
    db = get_db()

    # Verify meeting ownership
    meeting_doc = db.collection("meetings").document(request.meeting_id).get()
    if not meeting_doc.exists:
        raise HTTPException(status_code=404, detail="Meeting not found")
    if meeting_doc.to_dict().get("created_by") != user["uid"]:
        raise HTTPException(status_code=403, detail="You don't have access to this meeting")

    if not SMTP_EMAIL:
        raise HTTPException(status_code=500, detail="SMTP email not configured. Set SMTP_EMAIL in .env")

    sent = []
    failed = []

    try:
        for recipient in request.recipients:
            try:
                html_body = _build_email_html(
                    recipient_name=recipient.name,
                    task=recipient.task,
                    deadline=recipient.deadline,
                    meeting_title=request.meeting_title,
                    summary=request.summary,
                    decisions=request.decisions,
                )

                subject = f"🔔 Task Reminder: {recipient.task[:60]}"
                send_email_smtp(recipient.email, subject, html_body)

                sent.append(recipient.email)

                # Save email to the task document if task_id is provided
                if recipient.task_id:
                    task_ref = (
                        db.collection("meetings")
                        .document(request.meeting_id)
                        .collection("tasks")
                        .document(recipient.task_id)
                    )
                    task_doc = task_ref.get()
                    if task_doc.exists:
                        task_ref.update({
                            "owner_email": recipient.email,
                            "owner": recipient.name,
                        })

            except Exception as e:
                failed.append({"email": recipient.email, "error": str(e)})

    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Failed to connect to email server: {str(e)}")

    return {
        "message": f"Sent {len(sent)} reminder(s)",
        "sent": sent,
        "failed": failed,
    }
