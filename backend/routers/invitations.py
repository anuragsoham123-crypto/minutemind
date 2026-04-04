import os
import resend
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr

# Assuming these are your local modules
from database import get_db
from middleware.auth import get_current_user

# Configure your Resend API key
# Make sure to set RESEND_API_KEY in your environment variables
resend.api_key = os.environ.get("RESEND_API_KEY")

router = APIRouter(prefix="/api/invitations", tags=["invitations"])

# --- Models ---
class InvitationRequest(BaseModel):
    email: EmailStr
    team_id: str
    team_name: str


# --- Endpoints ---

@router.post("/send")
async def send_invitation(invitation: InvitationRequest, user: dict = Depends(get_current_user)):
    """Create a team invitation and send an email via Resend."""
    db = get_db()
    now = datetime.utcnow().isoformat()

    # 1. Create the invitation record in Firestore
    inv_data = {
        "email": invitation.email,
        "team_id": invitation.team_id,
        "team_name": invitation.team_name,
        "status": "pending",
        "invited_by": user["email"],
        "created_at": now
    }
    
    # Add to the invitations collection
    _, inv_ref = db.collection("invitations").add(inv_data)

    # Add a pending member record to the team
    db.collection("teams").document(invitation.team_id).collection("members").add({
        "email": invitation.email,
        "role": "member",  
        "status": "pending",
        "invited_at": now,
    })

    # 2. Send the email using Resend
    try:
        # Build the acceptance link (Swap 'localhost:3000' with your actual frontend URL)
        accept_link = f"http://localhost:3000/invitations/accept?id={inv_ref.id}"

        params = {
            "from": "Your App Name <onboarding@resend.dev>", # Change for production
            "to": [invitation.email],
            "subject": f"You've been invited to join {invitation.team_name}",
            "html": f"""
            <div style="font-family: sans-serif; color: #333;">
                <h2>Team Invitation</h2>
                <p>Hi there,</p>
                <p><strong>{user.get('name', user['email'])}</strong> has invited you to join their team: <strong>{invitation.team_name}</strong>.</p>
                <a href="{accept_link}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">
                    Accept Invitation
                </a>
            </div>
            """
        }
        
        email_response = resend.Emails.send(params)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send email: {str(e)}")

    return {"message": "Invitation sent successfully", "invitation_id": inv_ref.id}


@router.get("")
async def list_invitations(user: dict = Depends(get_current_user)):
    """List all pending invitations for the current user (matched by email)."""
    db = get_db()
    invitations = db.collection("invitations") \
        .where("email", "==", user["email"]) \
        .where("status", "==", "pending") \
        .stream()

    result = []
    for inv in invitations:
        d = inv.to_dict()
        d["id"] = inv.id
        result.append(d)

    return result


@router.post("/{invitation_id}/accept")
async def accept_invitation(invitation_id: str, user: dict = Depends(get_current_user)):
    """Accept a team invitation. Updates invitation + member status to active."""
    db = get_db()
    inv_ref = db.collection("invitations").document(invitation_id)
    inv_doc = inv_ref.get()

    if not inv_doc.exists:
        raise HTTPException(status_code=404, detail="Invitation not found")

    inv_data = inv_doc.to_dict()
    if inv_data["email"] != user["email"]:
        raise HTTPException(status_code=403, detail="This invitation is not for you")
    if inv_data["status"] != "pending":
        raise HTTPException(status_code=400, detail=f"Invitation already {inv_data['status']}")

    now = datetime.utcnow().isoformat()

    # Update invitation
    inv_ref.update({"status": "accepted"})

    # Update the team member record
    team_id = inv_data["team_id"]
    members = list(db.collection("teams").document(team_id)
                   .collection("members")
                   .where("email", "==", user["email"]).stream())

    for m in members:
        m.reference.update({
            "uid": user["uid"],
            "name": user["name"],
            "status": "active",
            "joined_at": now,
        })

    # If no member record exists (edge case), create one
    if not members:
        db.collection("teams").document(team_id).collection("members").add({
            "uid": user["uid"],
            "email": user["email"],
            "name": user["name"],
            "role": "member",
            "status": "active",
            "invited_at": now,
            "joined_at": now,
        })

    return {"message": f"Joined team '{inv_data['team_name']}'"}


@router.post("/{invitation_id}/decline")
async def decline_invitation(invitation_id: str, user: dict = Depends(get_current_user)):
    """Decline a team invitation."""
    db = get_db()
    inv_ref = db.collection("invitations").document(invitation_id)
    inv_doc = inv_ref.get()

    if not inv_doc.exists:
        raise HTTPException(status_code=404, detail="Invitation not found")

    inv_data = inv_doc.to_dict()
    if inv_data["email"] != user["email"]:
        raise HTTPException(status_code=403, detail="This invitation is not for you")
    if inv_data["status"] != "pending":
        raise HTTPException(status_code=400, detail=f"Invitation already {inv_data['status']}")

    inv_ref.update({"status": "declined"})

    # Update member status
    team_id = inv_data["team_id"]
    members = list(db.collection("teams").document(team_id)
                   .collection("members")
                   .where("email", "==", user["email"]).stream())
    for m in members:
        m.reference.update({"status": "declined"})

    return {"message": "Invitation declined"}