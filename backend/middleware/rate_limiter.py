"""Simple in-memory rate limiter per user."""

from fastapi import Request, HTTPException
from collections import defaultdict
from datetime import datetime, timezone
from config import MAX_REQUESTS_PER_HOUR


# { user_uid: [(timestamp, endpoint), ...] }
_request_log: dict[str, list[datetime]] = defaultdict(list)


def check_rate_limit(user_uid: str, endpoint: str = ""):
    """Check if user has exceeded the rate limit.
    
    Raises 429 if they've made more than MAX_REQUESTS_PER_HOUR requests in the last hour.
    Only counts AI-heavy endpoints (analyze, create meeting).
    """
    now = datetime.now(timezone.utc)
    
    # Clean old entries (older than 1 hour)
    _request_log[user_uid] = [
        ts for ts in _request_log[user_uid]
        if (now - ts).total_seconds() < 3600
    ]
    
    if len(_request_log[user_uid]) >= MAX_REQUESTS_PER_HOUR:
        raise HTTPException(
            status_code=429,
            detail=f"Rate limit exceeded. Maximum {MAX_REQUESTS_PER_HOUR} AI requests per hour. Try again later."
        )
    
    # Log this request
    _request_log[user_uid].append(now)


def get_usage(user_uid: str) -> dict:
    """Return current usage stats for a user."""
    now = datetime.now(timezone.utc)
    _request_log[user_uid] = [
        ts for ts in _request_log[user_uid]
        if (now - ts).total_seconds() < 3600
    ]
    return {
        "requests_this_hour": len(_request_log[user_uid]),
        "max_per_hour": MAX_REQUESTS_PER_HOUR,
        "remaining": MAX_REQUESTS_PER_HOUR - len(_request_log[user_uid]),
    }
