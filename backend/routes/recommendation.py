from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from bson import ObjectId
import requests
import os

from db.connection import db
from services.recommendation import recommend_items, generate_outfit

router = APIRouter()

wardrobe_collection = db["wardrobe"]
feedback_collection = db["feedback"]

OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY")


# ==============================
# 📦 REQUEST MODEL
# ==============================
class RecommendationRequest(BaseModel):
    user_id: str
    city: str


# ==============================
# 🌦️ WEATHER
# ==============================
def get_weather(city: str):
    try:
        url = f"http://api.openweathermap.org/data/2.5/weather?q={city}&appid={OPENWEATHER_API_KEY}&units=metric"
        res = requests.get(url).json()

        return {
            "temperature": res["main"]["temp"],
            "condition": res["weather"][0]["main"].lower()
        }

    except:
        return {"temperature": 28, "condition": "clear"}


# ==============================
# 🚀 MAIN API
# ==============================
@router.post("/recommend")
def recommend_outfits(request: RecommendationRequest):

    try:
        user_id = request.user_id
        city = request.city

        wardrobe_items = list(wardrobe_collection.find({"user_id": user_id}))

        if not wardrobe_items:
            raise HTTPException(status_code=404, detail="No wardrobe items found.")

        input_item = wardrobe_items[0]

        feedbacks = list(feedback_collection.find({"user_id": user_id}))

        weather = get_weather(city)

        recommendations = recommend_items(
            input_item=input_item,
            wardrobe_items=wardrobe_items,
            feedbacks=feedbacks,
            weather=weather
        )

        outfit = generate_outfit(
            input_item=input_item,
            wardrobe_items=wardrobe_items,
            weather=weather
        )

        # Convert ObjectId
        for item in recommendations:
            item["_id"] = str(item["_id"])

        if outfit["top"]:
            outfit["top"]["_id"] = str(outfit["top"]["_id"])
        if outfit["bottom"]:
            outfit["bottom"]["_id"] = str(outfit["bottom"]["_id"])

        return {
            "user_id": user_id,
            "weather": weather,
            "recommendations": recommendations,
            "outfit": outfit
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Recommendation failed: {e}")