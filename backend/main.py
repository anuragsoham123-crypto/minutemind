print("🚀 APP STARTING...")
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException
from fastapi.exceptions import RequestValidationError
import traceback

print("✅ Imports loaded")
from config import FRONTEND_URL
from routers import meetings, tasks, dashboard, reminders, teams, invitations, insights, workload, briefs

app = FastAPI(
    title="MinuteMind API",
    description="AI-powered meeting execution system",
    version="1.0.0",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL, "https://minutemind-hazel.vercel.app","https://minutemind-git-main-anuragsoham123-cryptos-projects.vercel.app", "https://minutemind-rncltndt2-anuragsoham123-cryptos-projects.vercel.app", "https://resourceful-harmony-production.up.railway.app", "http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global exception handler — ensures CORS headers are always present even on crashes,
# while allowing standard HTTP and Validation errors to pass through correctly.
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Catch unhandled exceptions while preserving standard HTTP/Validation errors."""
    
    # 1. Preserve intentional HTTP exceptions (e.g., your 403s and 404s)
    if isinstance(exc, StarletteHTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail},
        )
        
    # 2. Preserve validation errors (e.g., bad JSON payloads from the frontend)
    if isinstance(exc, RequestValidationError):
        return JSONResponse(
            status_code=422,
            content={"detail": exc.errors()},
        )

    # 3. Handle actual unexpected server crashes (500)
    traceback.print_exc()  # Log the full error to server console
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal server error: {str(exc)}"},
    )


# Routers
app.include_router(meetings.router)
app.include_router(tasks.router)
app.include_router(dashboard.router)
app.include_router(reminders.router)
app.include_router(teams.router)
app.include_router(invitations.router)
app.include_router(insights.router)
app.include_router(workload.router)
app.include_router(briefs.router)


@app.get("/")
async def root():
    return {"message": "MinuteMind API is running", "version": "1.0.0"}


@app.get("/health")
async def health():
    return {"status": "ok"}
