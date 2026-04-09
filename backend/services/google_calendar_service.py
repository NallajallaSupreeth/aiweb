from googleapiclient.discovery import build
from datetime import datetime

def get_calendar_service(credentials):
    service = build("calendar", "v3", credentials=credentials)
    return service


def create_event(service, title, description, date):
    event = {
        "summary": title,
        "description": description,
        "start": {
            "dateTime": f"{date}T09:00:00",
            "timeZone": "Asia/Kolkata",
        },
        "end": {
            "dateTime": f"{date}T10:00:00",
            "timeZone": "Asia/Kolkata",
        },
    }

    event = service.events().insert(calendarId="primary", body=event).execute()
    return event


def get_events(service):
    now = datetime.utcnow().isoformat() + "Z"

    events_result = service.events().list(
        calendarId="primary",
        timeMin=now,
        maxResults=10,
        singleEvents=True,
        orderBy="startTime",
    ).execute()

    return events_result.get("items", [])