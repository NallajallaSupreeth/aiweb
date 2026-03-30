from fastapi import APIRouter
from sentence_transformers import SentenceTransformer
from models.style_dna_model import StyleDNA
from db.connection import db

router = APIRouter(prefix="/style", tags=["StyleDNA"])
model = SentenceTransformer('all-MiniLM-L6-v2')

@router.post("/quiz")
async def create_style_dna(user_id: int, answers: list[str]):
    text = " ".join(answers)
    vector = model.encode(text).tolist()
    dna = StyleDNA(user_id=user_id, vector=vector)
    db.style_dna.update_one({"user_id": user_id}, {"$set": dna.dict()}, upsert=True)
    return {"message": "Style DNA saved successfully", "embedding_len": len(vector)}

@router.get("/{user_id}")
async def get_style_dna(user_id: int):
    dna = db.style_dna.find_one({"user_id": user_id}, {"_id": 0})
    return dna or {"message": "No Style DNA found"}
