from fastapi import APIRouter
import requests, os

router = APIRouter(prefix="/weather", tags=["Weather"])

# ✅ Load OpenWeather API key from .env
API_KEY = os.getenv("OPENWEATHER_API_KEY", "your_api_key_here")

@router.get("/{city}")
def get_weather(city: str):
    """Fetch real-time weather data for a given city."""
    url = f"https://api.openweathermap.org/data/2.5/weather?q={city}&appid={API_KEY}&units=metric"
    res = requests.get(url).json()

    if "main" not in res:
        return {"error": "City not found or invalid API key"}

    return {
        "city": city,
        "temp": res["main"]["temp"],
        "desc": res["weather"][0]["main"].lower(),
        "humidity": res["main"]["humidity"],
        "wind_speed": res["wind"]["speed"],
    }
