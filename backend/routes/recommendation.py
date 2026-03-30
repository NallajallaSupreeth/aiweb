from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from bson import ObjectId
import requests
import os

from db.connection import db
from services.recommendation import recommend_items, generate_outfit

router = APIRouter()

# DB collections
wardrobe_collection = db["wardrobe"]
feedback_collection = db["feedback"]

# API key
OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY")


# ---------------- REQUEST MODEL ----------------
class RecommendationRequest(BaseModel):
    user_id: str
    city: str


# ---------------- WEATHER FUNCTION ----------------
def get_weather(city: str):
    try:
        url = f"http://api.openweathermap.org/data/2.5/weather?q={city}&appid={OPENWEATHER_API_KEY}&units=metric"
        res = requests.get(url).json()

        return {
            "temperature": res["main"]["temp"],
            "condition": res["weather"][0]["main"].lower()
        }

    except:
        return {
            "temperature": 28,
            "condition": "clear"
        }


# ---------------- MAIN CONTEXT RECOMMENDATION ----------------
@router.post("/recommend")
def recommend_outfits(request: RecommendationRequest):

    user_id = request.user_id
    city = request.city

    try:
        # 🔥 Get wardrobe
        wardrobe_items = list(wardrobe_collection.find({"user_id": user_id}))

        if not wardrobe_items:
            raise HTTPException(status_code=404, detail="No wardrobe items found.")

        # 🔥 Select base item (first item)
        input_item = wardrobe_items[0]

        # 🔥 Get feedback
        feedbacks = list(feedback_collection.find({"user_id": user_id}))

        # 🔥 Get weather
        weather = get_weather(city)

        # 🔥 AI Recommendation (UPDATED ENGINE)
        recommendations = recommend_items(
            input_item=input_item,
            wardrobe_items=wardrobe_items,
            feedbacks=feedbacks,
            weather=weather
        )

        # 🔥 Outfit generation
        outfit = generate_outfit(
            input_item=input_item,
            wardrobe_items=wardrobe_items,
            weather=weather
        )

        # Convert ObjectIds
        for item in recommendations:
            item["_id"] = str(item["_id"])

        if outfit["top"]:
            outfit["top"]["_id"] = str(outfit["top"]["_id"])

        if outfit["bottom"]:
            outfit["bottom"]["_id"] = str(outfit["bottom"]["_id"])

        # 🔥 Smart reasoning
        temp = weather.get("temperature", 28)
        condition = weather.get("condition", "clear")

        if "rain" in condition:
            reasoning = "Rainy weather detected ☔ — go with protective outerwear like jackets."
        elif temp > 30:
            reasoning = "Hot weather ☀️ — light clothes like t-shirts are recommended."
        elif temp < 20:
            reasoning = "Cool weather ❄️ — layering with jackets or hoodies is ideal."
        else:
            reasoning = "Moderate weather 🌤 — flexible outfit choices available."

        return {
            "user_id": user_id,
            "weather": weather,
            "input_item": str(input_item["_id"]),
            "recommendations": recommendations,
            "outfit": outfit,
            "reasoning": reasoning
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Recommendation failed: {e}")