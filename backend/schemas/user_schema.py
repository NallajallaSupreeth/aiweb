from pydantic import BaseModel
from typing import Optional

class BodyMeasurements(BaseModel):
    chest: Optional[float] = None
    waist: Optional[float] = None
    shoulder: Optional[float] = None


class UpdateProfileSchema(BaseModel):
    full_name: Optional[str]
    phone: Optional[str]

    height: Optional[float]
    weight: Optional[float]

    body_measurements: Optional[BodyMeasurements]

    skin_tone: Optional[str]
    eye_color: Optional[str]
    hair_color: Optional[str]