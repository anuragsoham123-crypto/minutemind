"""Firebase Auth middleware — verifies ID tokens from frontend."""

from fastapi import Request, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from firebase_admin import auth
from database import get_db

security = HTTPBearer(auto_error=False)


async def get_current_user(request: Request) -> dict:
    """Extract and verify Firebase ID token from Authorization header.
    
    Returns user dict with uid, email, name.
    Raises 401 if token is missing or invalid.
    """
    # Force Firebase SDK initialization before using auth.verify_id_token()
    get_db()
    authorization = request.headers.get("Authorization")
    
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")
    
    token = authorization.split("Bearer ")[1]
    
    try:
        decoded = auth.verify_id_token(token)
        return {
            "uid": decoded["uid"],
            "email": decoded.get("email", ""),
            "name": decoded.get("name", decoded.get("email", "Unknown")),
        }
    except Exception as e:
        print(f"Firebase Auth Error: {e}")
        raise HTTPException(status_code=401, detail="Invalid or expired token")
