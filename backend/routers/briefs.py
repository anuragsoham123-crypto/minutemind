from fastapi import APIRouter, Depends, HTTPException
from database import get_db
from models.schemas import BriefRequest, BriefResponse
from services.brief_service import generate_pre_meeting_brief
from middleware.auth import get_current_user


router = APIRouter(prefix="/api/briefs", tags=["briefs"])


@router.post("/generate", response_model=BriefResponse)
async def generate_brief(request: BriefRequest, user: dict = Depends(get_current_user)):
    """Generate a strategic pre-meeting brief based on previous meeting context."""
    try:
        report = await generate_pre_meeting_brief(
            user_uid=user["uid"],
            team_id=request.team_id,
            topic=request.topic
        )
        return report
    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail=f"Brief generation failed: {str(e)}"
        )
