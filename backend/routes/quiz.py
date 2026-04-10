from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List
from utils.dependencies import get_current_user
from services.gemini_quiz_service import generate_quiz_question, generate_style_dna
from db.connection import db

router = APIRouter()
quiz_collection = db["style_quiz_results"]


class QuizContextRequest(BaseModel):
    gender: Optional[str] = "unspecified"
    age_group: Optional[str] = "adult"
    climate: Optional[str] = "moderate"
    lifestyle: Optional[str] = "general"
    previous_answers: Optional[List[dict]] = []
    style_profile: Optional[dict] = {}
    question_number: Optional[int] = 1


class QuizResultRequest(BaseModel):
    answers: List[dict]
    user_context: Optional[dict] = {}


# ── Generate one adaptive quiz question ──────────────────────────────────────
@router.post("/quiz/question")
def get_quiz_question(
    data: QuizContextRequest,
    user_id: str = Depends(get_current_user)
):
    try:
        question = generate_quiz_question(
            gender=data.gender,
            age_group=data.age_group,
            climate=data.climate,
            lifestyle=data.lifestyle,
            previous_answers=data.previous_answers,
            style_profile=data.style_profile,
            question_number=data.question_number,
        )
        return {"question": question}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate question: {e}")


# ── Generate Style DNA from all answers ──────────────────────────────────────
@router.post("/quiz/result")
def get_quiz_result(
    data: QuizResultRequest,
    user_id: str = Depends(get_current_user)
):
    try:
        style_dna = generate_style_dna(
            answers=data.answers,
            user_context=data.user_context,
        )

        # Save result to MongoDB
        from bson import ObjectId
        quiz_collection.update_one(
            {"user_id": user_id},
            {"$set": {
                "user_id": user_id,
                "style_dna": style_dna,
                "answers": data.answers,
                "context": data.user_context,
            }},
            upsert=True,
        )

        return {"style_dna": style_dna}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate style DNA: {e}")


# ── Get saved style DNA ───────────────────────────────────────────────────────
@router.get("/quiz/result")
def get_saved_result(user_id: str = Depends(get_current_user)):
    try:
        result = quiz_collection.find_one({"user_id": user_id})
        if not result:
            return {"style_dna": None}
        result["_id"] = str(result["_id"])
        return {"style_dna": result.get("style_dna")}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch result: {e}")
