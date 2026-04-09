from pydantic import BaseModel
from typing import Optional

class WardrobeCreate(BaseModel):

    user_id: str
    category: str
    color: str
    pattern: str

class WardrobeCreate(BaseModel):
    user_id: str
    
    # MAIN CATEGORY
    category: str   # topwear / bottomwear / footwear
    
    # SUB CATEGORY
    subcategory: str   # shirt / t-shirt / jeans / hoodie
    
    # TYPE / STYLE
    type: Optional[str] = None   # printed / striped / solid
    
    # COLOR
    color: str
    
    # EXTRA ATTRIBUTES
    material: Optional[str] = None   # cotton / denim
    season: Optional[str] = None     # summer / winter