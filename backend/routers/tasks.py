from fastapi import APIRouter, HTTPException, Depends
from database import get_db
from models.schemas import TaskUpdate, TaskCreate, TaskStatusUpdate
from middleware.auth import get_current_user

router = APIRouter(prefix="/api/tasks", tags=["tasks"])


@router.get("")
async def list_tasks(status: str = None, owner: str = None, user: dict = Depends(get_current_user)):
    """List all tasks across the user's meetings, optionally filtered."""
    db = get_db()

    # First get the user's meetings
    user_meetings = db.collection("meetings").where("created_by", "==", user["uid"]).stream()
    meeting_ids = [doc.id for doc in user_meetings]

    tasks = []
    for mid in meeting_ids:
        for t in db.collection("meetings").document(mid).collection("tasks").stream():
            td = t.to_dict()
            td["id"] = t.id
            td["meeting_id"] = mid

            # Apply filters
            if status and td.get("status") != status:
                continue
            if owner and td.get("owner") != owner:
                continue

            tasks.append(td)

    # Sort by created_at descending
    tasks.sort(key=lambda x: x.get("created_at", ""), reverse=True)

    return tasks


@router.get("/my")
async def get_my_tasks(user: dict = Depends(get_current_user)):
    """Get all tasks assigned to the current user's email, across ALL meetings.
    This powers the 'My Tasks' view for employees."""
    db = get_db()

    # Search ALL meetings for tasks where owner_email matches
    all_meetings = db.collection("meetings").stream()
    tasks = []

    for meeting_doc in all_meetings:
        meeting_data = meeting_doc.to_dict()
        for t in meeting_doc.reference.collection("tasks").stream():
            td = t.to_dict()
            if td.get("owner_email", "").lower() == user["email"].lower():
                td["id"] = t.id
                td["meeting_id"] = meeting_doc.id
                td["meeting_title"] = meeting_data.get("title", "Untitled")
                tasks.append(td)

    tasks.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return tasks


@router.post("/{meeting_id}", status_code=201)
async def create_task(meeting_id: str, task_data: TaskCreate, user: dict = Depends(get_current_user)):
    """Manually add a task that the AI missed."""
    db = get_db()

    # Verify meeting ownership
    meeting_doc = db.collection("meetings").document(meeting_id).get()
    if not meeting_doc.exists:
        raise HTTPException(status_code=404, detail="Meeting not found")
    if meeting_doc.to_dict().get("created_by") != user["uid"]:
        raise HTTPException(status_code=403, detail="You don't have access to this meeting")

    tasks_col = db.collection("meetings").document(meeting_id).collection("tasks")
    doc_ref = tasks_col.add(task_data.model_dump())

    return {"message": "Task created", "id": doc_ref[1].id}


@router.patch("/{meeting_id}/{task_id}")
async def update_task(meeting_id: str, task_id: str, update: TaskUpdate, user: dict = Depends(get_current_user)):
    """Update any field on a task.
    - Meeting coordinators can update ALL fields.
    - Task assignees (matched by email) can update status only.
    """
    db = get_db()

    meeting_doc = db.collection("meetings").document(meeting_id).get()
    if not meeting_doc.exists:
        raise HTTPException(status_code=404, detail="Meeting not found")

    task_ref = db.collection("meetings").document(meeting_id).collection("tasks").document(task_id)
    task_doc = task_ref.get()
    if not task_doc.exists:
        raise HTTPException(status_code=404, detail="Task not found")

    is_coordinator = meeting_doc.to_dict().get("created_by") == user.get("uid")
    owner_email = task_doc.to_dict().get("owner_email") or ""
    is_assignee = owner_email.lower() == user.get("email", "").lower()

    if not is_coordinator and not is_assignee:
        raise HTTPException(status_code=403, detail="You don't have access to this task")

    update_data = {k: v for k, v in update.model_dump().items() if v is not None}

    # Assignees can only update status
    if is_assignee and not is_coordinator:
        update_data = {k: v for k, v in update_data.items() if k == "status"}
        if not update_data:
            raise HTTPException(status_code=403, detail="Assignees can only update task status")

    if update_data:
        task_ref.update(update_data)

    return {"message": "Task updated", "updated_fields": list(update_data.keys())}


@router.patch("/my/{meeting_id}/{task_id}/status")
async def update_my_task_status(meeting_id: str, task_id: str, update: TaskStatusUpdate, user: dict = Depends(get_current_user)):
    """Dedicated endpoint for assignees to update their task status."""
    db = get_db()

    task_ref = db.collection("meetings").document(meeting_id).collection("tasks").document(task_id)
    task_doc = task_ref.get()

    if not task_doc.exists:
        raise HTTPException(status_code=404, detail="Task not found")

    td = task_doc.to_dict()
    owner_email = td.get("owner_email") or ""
    if owner_email.lower() != user.get("email", "").lower():
        raise HTTPException(status_code=403, detail="This task is not assigned to you")

    task_ref.update({"status": update.status})
    return {"message": f"Task status updated to '{update.status}'"}
