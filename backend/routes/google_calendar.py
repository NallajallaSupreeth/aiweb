from fastapi import APIRouter, Request, Depends, HTTPException
from fastapi.responses import RedirectResponse
import os
import requests as http_requests
from google.oauth2.credentials import Credentials

from utils.dependencies import get_current_user
from services.google_calendar_service import get_calendar_service, create_event, get_events
from services.auth_service import save_google_tokens, get_user_by_id

router = APIRouter()

SCOPES = ["https://www.googleapis.com/auth/calendar"]
TOKEN_URL = "https://oauth2.googleapis.com/token"
AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"


def _build_auth_url(user_id: str) -> str:
    """Build Google OAuth URL manually — avoids Flow state mismatch."""
    import urllib.parse
    params = {
        "client_id": os.getenv("GOOGLE_CLIENT_ID"),
        "redirect_uri": os.getenv("GOOGLE_REDIRECT_URI"),
        "response_type": "code",
        "scope": " ".join(SCOPES),
        "access_type": "offline",
        "prompt": "consent",
        "state": user_id,      # carry user_id through the redirect
    }
    return AUTH_URL + "?" + urllib.parse.urlencode(params)


def _exchange_code_for_tokens(code: str) -> dict:
    """Exchange authorization code for tokens directly (no Flow state issues)."""
    response = http_requests.post(TOKEN_URL, data={
        "code": code,
        "client_id": os.getenv("GOOGLE_CLIENT_ID"),
        "client_secret": os.getenv("GOOGLE_CLIENT_SECRET"),
        "redirect_uri": os.getenv("GOOGLE_REDIRECT_URI"),
        "grant_type": "authorization_code",
    })
    if response.status_code != 200:
        raise Exception(f"Token exchange failed: {response.text}")
    return response.json()


# ─── STEP 1: Start Google OAuth ──────────────────────────────────────────────
@router.get("/connect")
def connect_google(user_id: str = Depends(get_current_user)):
    auth_url = _build_auth_url(user_id)
    return {"auth_url": auth_url}


# ─── STEP 2: OAuth Callback ──────────────────────────────────────────────────
@router.get("/callback")
def callback(request: Request):
    try:
        user_id = request.query_params.get("state")
        code = request.query_params.get("code")
        error = request.query_params.get("error")

        if error:
            return RedirectResponse(
                f"http://localhost:5173/dashboard?google=error&msg={error}"
            )

        if not user_id or not code:
            return RedirectResponse(
                "http://localhost:5173/dashboard?google=error&msg=missing_params"
            )

        # ✅ Exchange code for tokens manually — no Flow state mismatch
        token_data = _exchange_code_for_tokens(code)

        tokens = {
            "token": token_data.get("access_token"),
            "refresh_token": token_data.get("refresh_token"),
            "token_uri": TOKEN_URL,
            "client_id": os.getenv("GOOGLE_CLIENT_ID"),
            "client_secret": os.getenv("GOOGLE_CLIENT_SECRET"),
            "scopes": SCOPES,
        }

        # ✅ Save tokens in MongoDB
        save_google_tokens(user_id, tokens)

        return RedirectResponse("http://localhost:5173/dashboard?google=connected")

    except Exception as e:
        print(f"[Calendar Callback Error] {e}")
        return RedirectResponse(
            f"http://localhost:5173/dashboard?google=error&msg={str(e)[:100]}"
        )


# ─── STEP 3: Connection Status ───────────────────────────────────────────────
@router.get("/status")
def google_status(user_id: str = Depends(get_current_user)):
    user = get_user_by_id(user_id)
    connected = bool(user and "google_tokens" in user and user["google_tokens"])
    return {"connected": connected}


# ─── STEP 4: Create Event ────────────────────────────────────────────────────
@router.post("/add-event")
def add_event(data: dict, user_id: str = Depends(get_current_user)):
    try:
        user = get_user_by_id(user_id)

        if not user or "google_tokens" not in user:
            raise HTTPException(
                status_code=400,
                detail="Google Calendar not connected. Please connect first."
            )

        credentials = Credentials(**user["google_tokens"])
        service = get_calendar_service(credentials)

        event = create_event(
            service,
            data.get("title", "New Event"),
            data.get("description", ""),
            data.get("date", ""),
        )

        return {"message": "✅ Event added to Google Calendar!", "event": event}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Event creation failed: {e}")


# ─── STEP 5: Get Events ──────────────────────────────────────────────────────
@router.get("/events")
def fetch_events(user_id: str = Depends(get_current_user)):
    try:
        user = get_user_by_id(user_id)

        if not user or "google_tokens" not in user:
            return {"events": [], "connected": False}

        credentials = Credentials(**user["google_tokens"])
        service = get_calendar_service(credentials)
        events = get_events(service)

        return {"events": events, "connected": True}

    except Exception as e:
        print(f"[Calendar Events Error] {e}")
        return {"events": [], "connected": False}