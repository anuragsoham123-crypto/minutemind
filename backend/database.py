import firebase_admin
from firebase_admin import credentials, firestore
from config import FIREBASE_SERVICE_ACCOUNT_PATH
import os

_db = None

def get_db():
    global _db
    if _db is None:
        if os.path.exists(FIREBASE_SERVICE_ACCOUNT_PATH):
            cred = credentials.Certificate(FIREBASE_SERVICE_ACCOUNT_PATH)
            firebase_admin.initialize_app(cred)
        else:
            # Falls back to GOOGLE_APPLICATION_CREDENTIALS env var or default credentials
            firebase_admin.initialize_app()
        _db = firestore.client()
    return _db
