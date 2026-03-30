from fastapi import APIRouter
from db.connection import db
from services.embeddings import create_style_embedding

router = APIRouter()

@router.post("/style/quiz")
def save_style_quiz(user_id: str, answers: list):
    """
    answers: list of strings representing user's visual quiz selections
    Example: ["classic", "neutral colors", "minimalist"]
    """
    vector = create_style_embedding(answers)
    db.users.update_one(
        {"user_id": user_id},
        {"$set": {"style_dna": vector}}
    )
    return {"message": "Style DNA saved successfully", "style_vector": vector}

@router.get("/style/{user_id}")
def get_style_dna(user_id: str):
    user = db.users.find_one({"user_id": user_id})
    if user and "style_dna" in user:
        return {"style_dna": user["style_dna"]}
    return {"message": "Style DNA not found"}
