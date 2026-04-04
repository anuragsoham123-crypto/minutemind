from fastapi import APIRouter, HTTPException, Depends
from database import get_db
from models.schemas import TeamCreate, TeamInvite
from middleware.auth import get_current_user
from datetime import datetime
from services.teams_service import scan_organization_dependencies
from config import FRONTEND_URL, SMTP_EMAIL
from services.email_service import send_email_smtp
router = APIRouter(prefix="/api/teams", tags=["teams"])


@router.post("", status_code=201)
async def create_team(data: TeamCreate, user: dict = Depends(get_current_user)):
    """Create a new team. The creator is automatically the coordinator."""
    db = get_db()
    now = datetime.utcnow().isoformat()

    team_data = {
        "name": data.name,
        "department": data.department,
        "created_by": user["uid"],
        "created_at": now,
    }
    _, team_ref = db.collection("teams").add(team_data)

    # Add creator as coordinator member
    team_ref.collection("members").add({
        "uid": user["uid"],
        "email": user["email"],
        "name": user["name"],
        "role": "coordinator",
        "status": "active",
        "invited_at": now,
        "joined_at": now,
    })

    return {"id": team_ref.id, "name": data.name}


@router.get("")
async def list_teams(user: dict = Depends(get_current_user)):
    """List all teams where the current user is a member (any status)."""
    db = get_db()

    # Get teams created by user
    owned = db.collection("teams").where("created_by", "==", user["uid"]).stream()
    team_ids = set()
    teams = []

    for doc in owned:
        team_ids.add(doc.id)
        td = doc.to_dict()
        td["id"] = doc.id
        # Get member count
        members = list(doc.reference.collection("members").stream())
        td["member_count"] = len(members)
        teams.append(td)

    # Also find teams where user is invited (by email)
    all_teams = db.collection("teams").stream()
    for doc in all_teams:
        if doc.id in team_ids:
            continue
        members = list(doc.reference.collection("members")
                       .where("email", "==", user["email"]).stream())
        if members:
            td = doc.to_dict()
            td["id"] = doc.id
            td["member_count"] = len(list(doc.reference.collection("members").stream()))
            teams.append(td)

    return teams


@router.get("/{team_id}")
async def get_team(team_id: str, user: dict = Depends(get_current_user)):
    """Get team details including all members."""
    db = get_db()
    team_doc = db.collection("teams").document(team_id).get()
    if not team_doc.exists:
        raise HTTPException(status_code=404, detail="Team not found")

    td = team_doc.to_dict()
    td["id"] = team_doc.id

    # Get members
    members = []
    for m in team_doc.reference.collection("members").stream():
        md = m.to_dict()
        md["id"] = m.id
        members.append(md)

    td["members"] = members
    return td


@router.delete("/{team_id}")
async def delete_team(team_id: str, user: dict = Depends(get_current_user)):
    """Delete a team (coordinator only)."""
    db = get_db()
    team_doc = db.collection("teams").document(team_id).get()
    if not team_doc.exists:
        raise HTTPException(status_code=404, detail="Team not found")
    if team_doc.to_dict().get("created_by") != user["uid"]:
        raise HTTPException(status_code=403, detail="Only the coordinator can delete this team")

    # Delete all members subcollection
    for m in team_doc.reference.collection("members").stream():
        m.reference.delete()

    # Delete related invitations
    invitations = db.collection("invitations").where("team_id", "==", team_id).stream()
    for inv in invitations:
        inv.reference.delete()

    team_doc.reference.delete()
    return {"message": "Team deleted"}


@router.post("/{team_id}/invite")
async def invite_to_team(team_id: str, data: TeamInvite, user: dict = Depends(get_current_user)):
    """Invite an employee to a team by email. Creates an invitation they must accept."""
    db = get_db()
    team_doc = db.collection("teams").document(team_id).get()
    if not team_doc.exists:
        raise HTTPException(status_code=404, detail="Team not found")
    if team_doc.to_dict().get("created_by") != user["uid"]:
        raise HTTPException(status_code=403, detail="Only the coordinator can invite members")

    team_data = team_doc.to_dict()

    # Check if already invited
    existing = list(db.collection("invitations")
                    .where("team_id", "==", team_id)
                    .where("email", "==", data.email)
                    .where("status", "==", "pending")
                    .stream())
    if existing:
        raise HTTPException(status_code=409, detail="Invitation already pending for this email")

    # Check if already a member
    existing_member = list(team_doc.reference.collection("members")
                          .where("email", "==", data.email)
                          .where("status", "==", "active")
                          .stream())
    if existing_member:
        raise HTTPException(status_code=409, detail="This person is already a team member")

    now = datetime.utcnow().isoformat()

    # Create invitation
    _, inv_ref = db.collection("invitations").add({
        "team_id": team_id,
        "team_name": team_data["name"],
        "invited_by": user["uid"],
        "invited_by_name": user["name"],
        "email": data.email,
        "status": "pending",
        "created_at": now,
    })

    # Also add as pending member
    team_doc.reference.collection("members").add({
        "uid": None,
        "email": data.email,
        "name": data.name or data.email.split("@")[0],
        "role": "member",
        "status": "pending",
        "invited_at": now,
        "joined_at": None,
    })

    # Send an email invite through SMTP if configured
    if SMTP_EMAIL:
        try:
            html_body = f"""
            <html>
            <body style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px;">
                <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; border: 1px solid #eaeaea;">
                    <h2 style="color: #333;">You've been invited!</h2>
                    <p style="color: #555; line-height: 1.6;">
                        <strong>{user['name']}</strong> has invited you to join the <strong>{team_data['name']}</strong> team on MinuteMind.
                    </p>
                    <a href="{FRONTEND_URL}/dashboard" style="display: inline-block; background-color: #0ea5e9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 10px;">
                        Accept Invitation
                    </a>
                </div>
            </body>
            </html>
            """
            
            subject = f"Join {team_data['name']} on MinuteMind"
            send_email_smtp(data.email, subject, html_body)
            
        except Exception as e:
            print(f"Failed to send invite email via SMTP: {e}")
            # We don't fail the request completely if email fails, but maybe we should log it.

    return {"message": f"Invitation sent to {data.email}", "invitation_id": inv_ref.id}


@router.post("/{team_id}/remove/{member_email}")
async def remove_member(team_id: str, member_email: str, user: dict = Depends(get_current_user)):
    """Remove a member from a team (coordinator only)."""
    db = get_db()
    team_doc = db.collection("teams").document(team_id).get()
    if not team_doc.exists:
        raise HTTPException(status_code=404, detail="Team not found")
    if team_doc.to_dict().get("created_by") != user["uid"]:
        raise HTTPException(status_code=403, detail="Only the coordinator can remove members")

    members = list(team_doc.reference.collection("members")
                   .where("email", "==", member_email).stream())
    if not members:
        raise HTTPException(status_code=404, detail="Member not found")

    for m in members:
        m.reference.delete()

    return {"message": f"Removed {member_email} from team"}


@router.post("/dependencies/scan")
async def scan_dependencies(user: dict = Depends(get_current_user)):
    """Triggers an AI scan across the user's organization to map cross-team dependencies and bottlenecks."""
    return await scan_organization_dependencies(user["uid"])
