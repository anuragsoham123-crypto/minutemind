import firebase_admin
from firebase_admin import credentials, firestore
from config import FIREBASE_SERVICE_ACCOUNT_JSON
import json

_db = None

def get_db():
    global _db

    if _db is None:
        # Initialize Firebase only once
        if not firebase_admin._apps:
            if FIREBASE_SERVICE_ACCOUNT_JSON:
                # ✅ Use JSON from environment (Railway-safe)
                cred = credentials.Certificate(
                    json.loads(FIREBASE_SERVICE_ACCOUNT_JSON)
                )
                firebase_admin.initialize_app(cred)
            else:
                # ❌ No credentials → fail clearly
                raise Exception("Firebase credentials not found")

        _db = firestore.client()

    return _db
