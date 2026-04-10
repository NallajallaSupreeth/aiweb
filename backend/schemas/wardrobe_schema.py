from pydantic import BaseModel
from typing import Optional, List


class ColourInfo(BaseModel):
    name: str
    hex: str
    rgb: str
    r: int
    g: int
    b: int
    weight: float


class GarmentDetail(BaseModel):
    type: str              # e.g. shirt / jeans
    confidence: float = 0.0   # CLIP classification confidence (0.0–1.0)
    pattern: str           # solid / striped / etc.
    colors: List[ColourInfo]
    dominant_rgb: List[int]   # [R, G, B]


class WardrobeCreate(BaseModel):
    user_id: str

    # ── Main category ──────────────────────────────────────────────────────
    category: str           # topwear | bottomwear | footwear | outerwear

    # ── Garment detail ─────────────────────────────────────────────────────
    subcategory: str        # shirt | jeans | hoodie | etc.
    style: Optional[str] = None    # casual | formal | ethnic | sporty | denim

    # ── Dominant colour (flat, for card display) ───────────────────────────
    color: str
    color_hex: Optional[str] = None
    color_rgb: Optional[str] = None

    # ── Pattern ────────────────────────────────────────────────────────────
    pattern: Optional[str] = None  # solid | striped | checked | printed | floral

    # ── Material & context ─────────────────────────────────────────────────
    material: Optional[str] = None
    season:   Optional[str] = None
    occasion: Optional[str] = None

    # ── Detailed sub-objects (from pipeline) ───────────────────────────────
    topwear:    Optional[dict] = None
    bottomwear: Optional[dict] = None