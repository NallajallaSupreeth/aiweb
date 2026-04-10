from googleapiclient.discovery import build
from datetime import datetime, timedelta


def get_calendar_service(credentials):
    service = build("calendar", "v3", credentials=credentials)
    return service


def create_event(service, title, description, date_str):
    """
    date_str can be:
    - "2026-04-11T19:28"  (datetime-local from HTML input)
    - "2026-04-11"        (date only)
    """
    try:
        # Try parsing full datetime-local format first
        if "T" in date_str:
            # datetime-local: "2026-04-11T19:28"
            dt = datetime.strptime(date_str[:16], "%Y-%m-%dT%H:%M")
        else:
            # date only: "2026-04-11"
            dt = datetime.strptime(date_str[:10], "%Y-%m-%d")
            # Default to 9am
            dt = dt.replace(hour=9, minute=0)

        start_dt = dt
        end_dt = dt + timedelta(hours=1)

        # Format for Google Calendar API (RFC3339 without timezone offset)
        fmt = "%Y-%m-%dT%H:%M:%S"
        event = {
            "summary": title,
            "description": description or "",
            "start": {
                "dateTime": start_dt.strftime(fmt),
                "timeZone": "Asia/Kolkata",
            },
            "end": {
                "dateTime": end_dt.strftime(fmt),
                "timeZone": "Asia/Kolkata",
            },
        }

        created = service.events().insert(calendarId="primary", body=event).execute()
        return created

    except Exception as e:
        raise Exception(f"create_event error: {e}")


def get_events(service):
    """Fetch upcoming events from Google Calendar."""
    now = datetime.utcnow().isoformat() + "Z"

    events_result = service.events().list(
        calendarId="primary",
        timeMin=now,
        maxResults=50,
        singleEvents=True,
        orderBy="startTime",
    ).execute()

    return events_result.get("items", [])