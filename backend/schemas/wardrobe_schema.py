from pydantic import BaseModel

class WardrobeCreate(BaseModel):

    user_id: str
    category: str
    color: str
    pattern: str

class WardrobeResponse(BaseModel):

    id: str
    user_id: str
    category: str
    color: str
    pattern: str
    image_url: str