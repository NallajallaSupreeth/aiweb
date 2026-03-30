from pydantic import BaseModel
from typing import List

class StyleDNA(BaseModel):
    user_id: int
    vector: List[float]
    preferences: dict = None  # e.g., {"tone": "warm", "fit": "casual"}
