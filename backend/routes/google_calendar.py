from fastapi import APIRouter, Request, Depends, HTTPException
from fastapi.responses import RedirectResponse
from google.oauth2.credentials import Credentials

from utils.oauth_handler import get_google_flow
from utils.dependencies import get_current_user

from services.google_calendar_service import (
    get_calendar_service,
    create_event,
    get_events,
)

from services.auth_service import save_google_tokens, get_user_by_id

router = APIRouter()


# 🔹 STEP 1: Connect Google
@router.get("/connect")
def connect_google():
    flow = get_google_flow()
    auth_url, _ = flow.authorization_url(prompt="consent")

    return RedirectResponse(auth_url)


# 🔹 STEP 2: Callback (SAVE TOKENS IN DB)
@router.get("/callback")
def callback(request: Request, user_id: str = Depends(get_current_user)):
    try:
        flow = get_google_flow()
        flow.fetch_token(authorization_response=str(request.url))

        credentials = flow.credentials

        tokens = {
            "token": credentials.token,
            "refresh_token": credentials.refresh_token,
            "token_uri": credentials.token_uri,
            "client_id": credentials.client_id,
            "client_secret": credentials.client_secret,
            "scopes": credentials.scopes,
        }

        # ✅ Save tokens to MongoDB
        save_google_tokens(user_id, tokens)

        return {"message": "Google Calendar Connected ✅"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OAuth failed: {e}")


# 🔹 STEP 3: Create Event
@router.post("/add-event")
def add_event(
    data: dict,
    user_id: str = Depends(get_current_user)
):
    try:
        user = get_user_by_id(user_id)

        if not user or "google_tokens" not in user:
            raise HTTPException(status_code=400, detail="Google not connected")

        credentials = Credentials(**user["google_tokens"])
        service = get_calendar_service(credentials)

        event = create_event(
            service,
            data["title"],
            data["description"],
            data["date"],
        )

        return {"event": event}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Event creation failed: {e}")


# 🔹 STEP 4: Get Events
@router.get("/events")
def fetch_events(user_id: str = Depends(get_current_user)):
    try:
        user = get_user_by_id(user_id)

        if not user or "google_tokens" not in user:
            raise HTTPException(status_code=400, detail="Google not connected")

        credentials = Credentials(**user["google_tokens"])
        service = get_calendar_service(credentials)

        events = get_events(service)

        return {"events": events}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Fetch failed: {e}")