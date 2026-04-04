from fastapi import APIRouter, Depends, HTTPException
from database import get_db
from models.schemas import PatternReport
from services.patterns_service import analyze_patterns
from middleware.auth import get_current_user


router = APIRouter(prefix="/api/insights", tags=["insights"])


@router.get("", response_model=PatternReport)
async def get_insights(user: dict = Depends(get_current_user)):
    """Retrieve personal and organizational patterns from transcript metadata."""
    try:
        report = await analyze_patterns(user["uid"])
        return report
    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail=f"Pattern analysis failed: {str(e)}"
        )


@router.post("/refresh", response_model=PatternReport)
async def refresh_insights(user: dict = Depends(get_current_user)):
    """Trigger a fresh scan of pattern intelligence."""
    # Since analyze_patterns is dynamic, this is essentially a GET for now
    # We could implement caching later
    return await analyze_patterns(user["uid"])
