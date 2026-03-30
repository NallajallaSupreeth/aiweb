from fastapi import APIRouter, HTTPException
from bson import ObjectId
from datetime import datetime
from db.connection import db

router = APIRouter()

feedback_collection = db["feedback"]


# ---------------- ADD FEEDBACK ----------------
@router.post("/feedback")
async def add_feedback(data: dict):

    try:
        user_id = data.get("user_id")
        item_id = data.get("item_id")
        rating = data.get("rating")

        if rating not in ["like", "dislike"]:
            raise HTTPException(status_code=400, detail="Invalid rating")

        feedback_doc = {
            "user_id": user_id,
            "item_id": item_id,
            "rating": rating,
            "timestamp": datetime.utcnow()
        }

        feedback_collection.insert_one(feedback_doc)

        return {"message": "✅ Feedback recorded"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {e}")


# ---------------- GET USER FEEDBACK ----------------
@router.get("/feedback/{user_id}")
async def get_feedback(user_id: str):

    try:
        feedbacks = list(feedback_collection.find({"user_id": user_id}))

        for f in feedbacks:
            f["_id"] = str(f["_id"])

        return {"feedback": feedbacks}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {e}")